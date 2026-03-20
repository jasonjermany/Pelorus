import type { Rule } from '~/types/models'
import { getClient, callClaude, getModel } from './claudeClient'
import { normalizeRule, dedupeRules } from './normalization'
import { RulesArrayZod, RULES_JSON_SCHEMA } from './schemas'
import { getFactKeys, loadFactCatalog } from '../../utils/factCatalog'

const RULES_MODEL = getModel();
const RULES_MAX_TOKENS = 8000
const CHUNK_CONCURRENCY = 10
const CHUNK_MAX_CHARS = 6000
const CHUNK_MIN_CHARS = 1000

function splitLargeChunk(chunk: string): string[] {
  if (chunk.length <= CHUNK_MAX_CHARS) return [chunk]

  const segments: string[] = []
  let current = ''

  for (const para of chunk.split(/\n\n+/)) {
    if (!current) {
      current = para
    } else if (current.length + para.length + 2 <= CHUNK_MAX_CHARS) {
      current += '\n\n' + para
    } else {
      segments.push(current)
      current = para
    }
  }
  if (current) segments.push(current)
  return segments.filter(Boolean)
}

function mergeSmallChunks(chunks: string[]): string[] {
  const merged: string[] = []
  let current = ''
  for (const chunk of chunks) {
    if (!current) {
      current = chunk
    } else if (current.length + chunk.length + 2 <= CHUNK_MAX_CHARS && current.length < CHUNK_MIN_CHARS) {
      current += '\n\n' + chunk
    } else {
      merged.push(current)
      current = chunk
    }
  }
  if (current) merged.push(current)
  return merged
}

function normalizeChunks(raw: string[]): string[] {
  return mergeSmallChunks(raw.flatMap(splitLargeChunk))
}

function buildRulePrompt(chunk: string, factCatalogContext: string): string {
  const currentYear = new Date().getFullYear()
  return [
    'Return ONLY a JSON array of underwriting rules. No markdown, no prose.',
    '',
    'Schema: { "id": string, "sourceText": string, "field": string, "operator": "<|<=|>|>=|=|in", "value": string, "values": string[], "normalizedExpression": string, "conditions": [{ "field": string, "operator": "<|<=|>|>=|=|in", "value": string, "values": string[] }] }',
    '',
    'EXTRACT: Hard limits, decline triggers, referral thresholds, mandatory conditions.',
    'SKIP: Preferences, eligibility descriptions ("standard", "welcome"), process steps, approval workflows.',
    'FIELDS: Use a descriptive snake_case field name for every fact. Never encode non-occupancy facts (arson history, fraud, flood zone, financial ratios) into primary_occupancy_class.',
    '',
    'OPERATORS',
    '- Single value: use < <= > >= =',
    '- Discrete OR-list (≤10 non-sequential items): use "in" with "values" array. Example: { field: "state", operator: "in", values: ["CT","ME","MA"] }',
    '- Numeric range: use >= / <=, never "in". Example: SIC 3000–3999 → two conditions [{ operator: ">=", value: "3000" }, { operator: "<=", value: "3999" }]',
    '',
    'CONDITIONS: Use when a rule applies only in a specific context.',
    '  Example: "PPC 7: TIV max $10M" → { field: "tiv", operator: "<=", value: "10000000", conditions: [{ field: "iso_ppc_rating", operator: "=", value: "7" }] }',
    '  Omit conditions if the rule applies universally.',
    '',
    'LISTS: Multiple items sharing one ineligibility reason → one rule.',
    '  Parent category exists: { field: "primary_occupancy_class", operator: "=", value: "habitational" }',
    '  No parent: { field: "state", operator: "in", values: ["FL","CA","TX"] }',
    '',
    `DATE FIELDS: Current year is ${currentYear}. Compute absolute values: "50+ years old" → year_built <= ${currentYear - 50}. Age fields (roof_age_years, building_age_years, etc.) are numeric — use directly.`,
    '',
    'Map field names to catalog keys when matched:',
    factCatalogContext,
    '',
    'Guidelines:',
    chunk,
  ].join('\n')
}

async function generateRulesFromChunk(
  chunk: string,
  chunkIndex: number,
  total: number,
  factCatalogContext: string,
): Promise<Rule[]> {
  console.log(`[rules] chunk ${chunkIndex + 1}/${total} (${chunk.length} chars)`)
  const client = getClient()
  const prompt = buildRulePrompt(chunk, factCatalogContext)

  let parsed
  try {
    parsed = await callClaude(
      client,
      RULES_MODEL,
      RULES_MAX_TOKENS,
      [{ role: 'user', content: prompt }],
      RULES_JSON_SCHEMA as unknown as Record<string, unknown>,
      RulesArrayZod,
    )
  } catch (err) {
    console.error(`[rules] chunk ${chunkIndex + 1}/${total} failed:`, err instanceof Error ? err.message : err)
    throw err
  }

  const rules = parsed.map((item, index) => {
    try {
      return normalizeRule(item, index)
    } catch (err) {
      console.error(`[rules] normalizeRule failed for item ${index} in chunk ${chunkIndex + 1}:`, JSON.stringify(item), err instanceof Error ? err.message : err)
      throw err
    }
  })

  console.log(`[rules] chunk ${chunkIndex + 1}/${total} → ${rules.length} rules`)
  return rules
}

export async function generateRulesFromGuidelineChunks(guidelineChunks: string[]): Promise<Rule[]> {
  const raw = guidelineChunks.map((c) => c.trim()).filter(Boolean)
  if (!raw.length) return []

  const chunks = normalizeChunks(raw)
  console.log(`[rules] ${raw.length} raw chunks → ${chunks.length} normalized (model=${RULES_MODEL} concurrency=${CHUNK_CONCURRENCY})`)

  const catalog = await loadFactCatalog()
  const factKeys = getFactKeys(catalog)
  const factCatalogContext = factKeys.length ? factKeys.join('\n') : '(empty catalog)'

  const t0 = Date.now()
  const allRules: Rule[] = []
  for (let i = 0; i < chunks.length; i += CHUNK_CONCURRENCY) {
    const batchNum = Math.floor(i / CHUNK_CONCURRENCY) + 1
    const totalBatches = Math.ceil(chunks.length / CHUNK_CONCURRENCY)
    const batch = chunks.slice(i, i + CHUNK_CONCURRENCY)
    const tb = Date.now()
    const results = await Promise.all(
      batch.map((chunk, batchIndex) =>
        generateRulesFromChunk(chunk, i + batchIndex, chunks.length, factCatalogContext),
      ),
    )
    console.log(`[rules] batch ${batchNum}/${totalBatches} done in ${Date.now() - tb}ms`)
    for (const chunkRules of results) allRules.push(...chunkRules)
  }

  const deduped = dedupeRules(allRules)
  console.log(`[rules] done: ${allRules.length} total → ${deduped.length} after dedup — total ${Date.now() - t0}ms`)
  return deduped
}
