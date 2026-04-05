import { createRequire } from 'module'
import { resolve } from 'path'

// Resolve from process.cwd() (the server root at runtime) rather than
// import.meta.url (a chunk file deep in the output tree), so that Node's
// module resolution reliably finds pdfmake in .output/server/node_modules/.
const _require = createRequire(resolve(process.cwd(), 'package.json'))

// Lazily initialized — pdfmake + VFS fonts are large, load once
let _pdfMake: any = null
function getPdfMake() {
  if (!_pdfMake) {
    _pdfMake = _require('pdfmake/build/pdfmake')
    const vfsFonts = _require('pdfmake/build/vfs_fonts')
    _pdfMake.addVirtualFileSystem(vfsFonts)
  }
  return _pdfMake
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Verdict = {
  decision: 'PROCEED' | 'REFER' | 'DECLINE'
  composite_score: number
  analyzed_in_seconds?: string
  dimension_scores?: Record<string, number>
  recommendation?: { summary: string; action_items?: string[] }
  flags?: Array<{ title: string; type: string; explanation: string; action_required: string; cited_section: string }>
  favorable_factors?: string[]
  guideline_checks?: Array<{ rule: string; required: string; submitted: string; status: string; cited_section: string }>
  insights?: Record<string, string>
  missing_info?: Array<{ label: string; description: string }>
  risk_profile?: Record<string, { value: string; source: string } | string>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score
}

function decisionColors(decision: string) {
  if (decision === 'PROCEED') return { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' }
  if (decision === 'REFER')   return { text: '#a8882e', bg: '#fffbeb', border: '#fde68a' }
  return                             { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
}

// pdfmake layout with only horizontal hairlines between rows, no vertical lines
const hairlineLayout = {
  hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 0 : 0.4,
  vLineWidth: () => 0,
  hLineColor: () => '#e2e8f0',
  paddingLeft: () => 0,
  paddingRight: () => 8,
  paddingTop: () => 7,
  paddingBottom: () => 7,
}

const headerRowLayout = {
  hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.4,
  vLineWidth: () => 0,
  hLineColor: () => '#e2e8f0',
  paddingLeft: () => 0,
  paddingRight: () => 8,
  paddingTop: () => 7,
  paddingBottom: () => 7,
  fillColor: (row: number) => row === 0 ? '#f8fafc' : null,
}

// ─── Section helpers ──────────────────────────────────────────────────────────

function sectionTitle(text: string, topMargin = 22) {
  return { text, style: 'sectionTitle', margin: [0, topMargin, 0, 10] as [number, number, number, number] }
}

function kvTable(rows: [string, string][]) {
  return {
    table: {
      widths: [140, '*'],
      body: rows.map(([k, v]) => [
        { text: k, style: 'tableLabel' },
        { text: v || '—', style: 'tableValue' },
      ]),
    },
    layout: hairlineLayout,
  }
}

// ─── Document builder ─────────────────────────────────────────────────────────

function buildDocDef(verdict: Verdict, submissionDate: string, namedInsured: string | null) {
  const colors = decisionColors(verdict.decision)
  const score = normalizeScore(verdict.composite_score)
  const content: any[] = []

  // ── Title ──
  content.push({ text: 'Submission Review', style: 'pageTitle' })
  if (namedInsured) {
    content.push({ text: namedInsured, style: 'subtitle', margin: [0, 3, 0, 0] as [number, number, number, number] })
  }

  // ── Decision Banner ──
  content.push({
    margin: [0, 16, 0, 0] as [number, number, number, number],
    table: {
      widths: ['*', 90],
      body: [[
        {
          stack: [
            { text: 'DECISION', style: 'label' },
            { text: verdict.decision, fontSize: 24, bold: true, color: colors.text, margin: [0, 4, 0, 8] },
            { text: verdict.recommendation?.summary ?? '', style: 'body' },
            ...(verdict.risk_profile?.tiv && (typeof verdict.risk_profile.tiv === 'object' ? verdict.risk_profile.tiv.value : verdict.risk_profile.tiv) !== 'N/A'
              ? [{ text: `TIV: ${typeof verdict.risk_profile.tiv === 'object' ? verdict.risk_profile.tiv.value : verdict.risk_profile.tiv}`, style: 'caption', margin: [0, 6, 0, 0] as [number, number, number, number] }]
              : []),
            ...(verdict.analyzed_in_seconds
              ? [{ text: `Analyzed in ${verdict.analyzed_in_seconds}s`, style: 'caption', margin: [0, 3, 0, 0] as [number, number, number, number] }]
              : []),
          ],
          margin: [16, 16, 8, 16] as [number, number, number, number],
        },
        {
          stack: [
            { text: score.toFixed(1), fontSize: 42, bold: true, color: colors.text, alignment: 'center' },
            { text: '/ 10', fontSize: 12, color: colors.text, alignment: 'center' },
          ],
          margin: [0, 20, 16, 16] as [number, number, number, number],
          alignment: 'center',
        },
      ]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      fillColor: () => colors.bg,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  })

  // ── Risk Profile ──
  const riskEntries = Object.entries(verdict.risk_profile ?? {})
    .map(([k, raw]) => {
      const value = typeof raw === 'object' ? raw.value : raw
      const source = typeof raw === 'object' && raw.source && raw.source !== 'Not disclosed' ? raw.source : null
      return { label: formatKey(k), value, source }
    })
    .filter(({ value }) => value && value !== 'null' && value !== 'N/A' && value !== 'Not disclosed')

  if (riskEntries.length) {
    content.push(sectionTitle('Risk Profile'))
    content.push({
      table: {
        widths: [140, '*'],
        body: riskEntries.map(({ label, value, source }) => [
          { text: label, style: 'tableLabel' },
          {
            stack: [
              { text: value || '—', style: 'tableValue' },
              ...(source ? [{ text: source, fontSize: 8, color: '#94a3b8', margin: [0, 2, 0, 0] as [number, number, number, number] }] : []),
            ],
          },
        ]),
      },
      layout: hairlineLayout,
    })
  }

  // ── Dimension Scores ──
  if (verdict.dimension_scores) {
    content.push(sectionTitle('Dimension Scores'))
    content.push({
      table: {
        widths: ['*', 70],
        body: [
          [
            { text: 'DIMENSION', style: 'tableHeader' },
            { text: 'SCORE', style: 'tableHeader', alignment: 'right' },
          ],
          ...Object.entries(verdict.dimension_scores).map(([key, raw]) => {
            const s = normalizeScore(raw)
            const color = s >= 7.5 ? '#15803d' : s >= 5.0 ? '#a8882e' : '#dc2626'
            return [
              { text: formatKey(key), style: 'tableValue' },
              { text: `${s.toFixed(1)} / 10`, style: 'tableValue', alignment: 'right', color },
            ]
          }),
        ],
      },
      layout: headerRowLayout,
    })
  }

  // ── Recommendation ──
  if (verdict.recommendation) {
    content.push(sectionTitle('Recommended Next Action'))
    content.push({ text: verdict.recommendation.summary, style: 'body', margin: [0, 0, 0, 8] as [number, number, number, number] })
    for (const [i, item] of (verdict.recommendation.action_items ?? []).entries()) {
      content.push({
        margin: [0, 3, 0, 0] as [number, number, number, number],
        text: [{ text: `${i + 1}.  `, bold: true, color: '#c9a84c' }, { text: item }],
        style: 'body',
      })
    }
  }

  // ── Flags ──
  const sortedFlags = [...(verdict.flags ?? [])].sort((a, b) =>
    a.type === 'CONDITION' && b.type !== 'CONDITION' ? -1 : a.type !== 'CONDITION' && b.type === 'CONDITION' ? 1 : 0
  )
  if (sortedFlags.length) {
    content.push(sectionTitle('Concerns & Flags'))
    for (const flag of sortedFlags) {
      const badgeColor = flag.type === 'CONDITION' ? '#dc2626' : '#a8882e'
      content.push({
        margin: [0, 0, 0, 12] as [number, number, number, number],
        stack: [
          {
            columns: [
              { text: flag.title, style: 'flagTitle', width: '*' },
              { text: flag.type, style: 'badge', color: badgeColor, width: 'auto' },
            ],
            margin: [0, 0, 0, 4] as [number, number, number, number],
          },
          { text: flag.explanation, style: 'body', margin: [0, 0, 0, 4] as [number, number, number, number] },
          { text: [{ text: 'Action: ', bold: true, color: '#0a1628' }, flag.action_required], style: 'body' },
          { text: `Ref: ${flag.cited_section}`, style: 'caption', margin: [0, 4, 0, 0] as [number, number, number, number] },
        ],
      })
    }
  }

  // ── Favorable Factors ──
  if (verdict.favorable_factors?.length) {
    content.push(sectionTitle('Favorable Factors'))
    for (const f of verdict.favorable_factors) {
      content.push({
        margin: [0, 3, 0, 0] as [number, number, number, number],
        text: [{ text: '✓  ', color: '#22c55e', bold: true }, f],
        style: 'body',
      })
    }
  }

  // ── Guideline Checks ──
  if (verdict.guideline_checks?.length) {
    content.push(sectionTitle('Guideline Checks'))
    content.push({
      table: {
        widths: [110, '*', '*', 44],
        body: [
          [
            { text: 'RULE', style: 'tableHeader' },
            { text: 'REQUIRED', style: 'tableHeader' },
            { text: 'SUBMITTED', style: 'tableHeader' },
            { text: 'STATUS', style: 'tableHeader', alignment: 'center' },
          ],
          ...verdict.guideline_checks.map(check => {
            const statusColor = check.status === 'pass' ? '#15803d' : check.status === 'review' ? '#a8882e' : '#dc2626'
            return [
              {
                stack: [
                  { text: check.rule, style: 'tableValueBold' },
                  { text: check.cited_section, style: 'caption', margin: [0, 2, 0, 0] as [number, number, number, number] },
                ],
              },
              { text: check.required, style: 'tableValue' },
              { text: check.submitted, style: 'tableValue' },
              { text: check.status.toUpperCase(), style: 'badge', alignment: 'center', color: statusColor },
            ]
          }),
        ],
      },
      layout: headerRowLayout,
    })
  }

  // ── Insights ──
  if (verdict.insights) {
    const insightEntries = Object.entries(verdict.insights)
    if (insightEntries.length) {
      content.push(sectionTitle('Underwriting Insights'))
      // 2-column grid, row by row
      for (let i = 0; i < insightEntries.length; i += 2) {
        const pair = insightEntries.slice(i, i + 2)
        content.push({
          columns: pair.map(([key, value]) => ({
            width: '*',
            stack: [
              { text: formatKey(key).toUpperCase(), style: 'label', margin: [0, 0, 0, 4] as [number, number, number, number] },
              { text: value, style: 'body' },
            ],
          })),
          columnGap: 24,
          margin: [0, 0, 0, 14] as [number, number, number, number],
        })
      }
    }
  }

  // ── Missing Information ──
  if (verdict.missing_info?.length) {
    content.push(sectionTitle('Missing Information'))
    for (const item of verdict.missing_info) {
      content.push({
        margin: [0, 0, 0, 10] as [number, number, number, number],
        stack: [
          { text: item.label, style: 'flagTitle' },
          { text: item.description, style: 'body', margin: [0, 3, 0, 0] as [number, number, number, number] },
        ],
      })
    }
  }

  return {
    pageSize: 'LETTER' as const,
    pageMargins: [50, 62, 50, 55] as [number, number, number, number],

    header: () => ({
      columns: [
        { text: 'PELORUS', fontSize: 8, bold: true, color: '#0a1628', characterSpacing: 2, margin: [50, 22, 0, 0] },
        { text: submissionDate, fontSize: 8, color: '#aaa', alignment: 'right', margin: [0, 22, 50, 0] },
      ],
    }),

    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#bbb',
      margin: [0, 18],
    }),

    content,

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#1a1a1a',
      lineHeight: 1.4,
    },

    styles: {
      pageTitle:      { fontSize: 22, bold: true, color: '#0a1628' },
      subtitle:       { fontSize: 12, color: '#555' },
      sectionTitle:   { fontSize: 11, bold: true, color: '#0a1628' },
      label:          { fontSize: 7, bold: true, color: '#999', characterSpacing: 1.2 },
      body:           { fontSize: 10, color: '#333', lineHeight: 1.5 },
      caption:        { fontSize: 8, color: '#999' },
      tableHeader:    { fontSize: 7, bold: true, color: '#666', characterSpacing: 0.8 },
      tableLabel:     { fontSize: 9, bold: true, color: '#555' },
      tableValue:     { fontSize: 10, color: '#333', lineHeight: 1.4 },
      tableValueBold: { fontSize: 10, bold: true, color: '#0a1628' },
      flagTitle:      { fontSize: 11, bold: true, color: '#0a1628' },
      badge:          { fontSize: 8, bold: true, characterSpacing: 0.4 },
    },
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePdfBuffer(
  verdict: Verdict,
  submissionDate: string,
  namedInsured: string | null
): Promise<Buffer> {
  const pdfMake = getPdfMake()
  const docDef = buildDocDef(verdict, submissionDate, namedInsured)
  const pdfDoc = pdfMake.createPdf(docDef)
  const uint8 = await pdfDoc.getBuffer()
  return Buffer.from(uint8)
}
