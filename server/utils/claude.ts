import Anthropic from '@anthropic-ai/sdk'
import { getGuidelineChunks } from './rag'
import { CHECKS_TOOL, buildChecksMessages, buildEnrichmentMessages } from './prompts/checks'
import { buildFlagsPrompt } from './prompts/flags'
import { buildInsightsPrompt } from './prompts/insights'
import { RISK_PROFILE_TOOL, buildRiskProfileMessages } from './prompts/riskProfile'
import { CLASSIFY_INSTRUCTIONS } from './prompts/classify'
import { buildHardStopsPrompt } from './prompts/hardStops'
import { buildRiskFieldsPrompt } from './prompts/riskFields'

function extractJson(text: string): string {
  const stripped = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const objStart = stripped.indexOf('{')
  const arrStart = stripped.indexOf('[')
  // Determine whether the outermost structure is an object or array
  const isArray = arrStart !== -1 && (objStart === -1 || arrStart < objStart)
  if (isArray) {
    const end = stripped.lastIndexOf(']')
    return end > arrStart ? stripped.slice(arrStart, end + 1) : stripped
  }
  const end = stripped.lastIndexOf('}')
  return objStart !== -1 && end > objStart ? stripped.slice(objStart, end + 1) : stripped
}

function logUsage(label: string, ms: number, usage: any, extra = '') {
  const inp   = (usage?.input_tokens ?? 0)
  const out   = usage?.output_tokens ?? 0
  const hit   = usage?.cache_read_input_tokens ?? 0
  const write = usage?.cache_creation_input_tokens ?? 0
  const parts = [`${ms}ms`, `in=${inp}`, `out=${out}`]
  if (hit > 0)   parts.push(`cache_hit=${hit}`)
  if (write > 0) parts.push(`cache_write=${write}`)
  if (extra)     parts.push(extra)
  console.log(`[eval] ${label.padEnd(16)} ${parts.join('  ')}`)
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'extended-cache-ttl-2025-04-11',
  },
})

async function runInsightsCall(submissionText: string): Promise<any> {
  const t = Date.now()
  const prompt = buildInsightsPrompt(submissionText)
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 3000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  logUsage('insights', Date.now() - t, response.usage)
  const text = (response.content[0] as any).text as string
  try {
    return JSON.parse(extractJson(text))
  } catch {
    console.warn('[eval] insights parse failed')
    return { insights: [], missing_information: [] }
  }
}

async function runFlagsCall(
  submissionText: string,
  checksResult: { verdict_code: string; guideline_checks: any[] },
): Promise<any> {
  const t = Date.now()
  const prompt = buildFlagsPrompt(submissionText, checksResult)
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 6000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  logUsage('flags', Date.now() - t, response.usage)
  const text = (response.content[0] as any).text as string
  try {
    return JSON.parse(extractJson(text))
  } catch {
    console.error('[eval] flags parse failed, last 300:', text.slice(-300))
    throw new Error('flags call JSON parse failed')
  }
}

async function runEnrichmentCall(
  submissionText: string,
  checks: Array<{ rule_name: string; submitted_value: string }>,
): Promise<Array<{ raw_text: string | null; context: string | null; doc_name: string | null; page_ref: string | null }>> {
  if (!checks.length) return []
  const t = Date.now()
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    temperature: 0,
    messages: buildEnrichmentMessages(submissionText, checks) as any,
  })
  logUsage('enrichment', Date.now() - t, response.usage)
  const text = (response.content[0] as any).text as string
  try {
    return JSON.parse(extractJson(text))
  } catch {
    console.warn('[eval] enrichment parse failed')
    return checks.map(() => ({ raw_text: null, context: null, doc_name: null, page_ref: null }))
  }
}

async function runRiskProfileCall(submissionText: string, fields: string[]): Promise<any> {
  const t = Date.now()
  const text = submissionText.length > 20000
    ? submissionText.slice(0, 20000) + '\n\n[TRUNCATED]'
    : submissionText
  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 20000,
      temperature: 0,
      tools: [RISK_PROFILE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_risk_profile' },
      messages: buildRiskProfileMessages(text, fields),
    } as any)

    const toolUseBlock = response.content.find((b: any) => b.type === 'tool_use')
    if (!toolUseBlock) {
      logUsage('risk_profile', Date.now() - t, response.usage, `stop=${(response as any).stop_reason} NO_TOOL_USE`)
      return { lines: [] }
    }
    const result = (toolUseBlock as any).input
    logUsage('risk_profile', Date.now() - t, response.usage, `stop=${(response as any).stop_reason}  lines=${result?.lines?.length ?? 'MISSING'}`)
    if (!result.lines) result.lines = []
    return result
  } catch (err: any) {
    console.error(`[eval] risk_profile     FAILED  ${Date.now() - t}ms  ${err?.status}  ${err?.message ?? err}`)
    return { lines: [] }
  }
}

export async function evaluateSubmission(
  submission: { id: string; org_id: string; raw_text: string; extracted_fields?: Record<string, unknown> | null },
  orgId?: string,
) {
  const t0 = Date.now()
  const submissionText = submission.raw_text

  console.log(`[eval] submission   ${submissionText.length} chars`)
  const t_rag = Date.now()
  const { pinned, guidelines, riskProfileFields } = await getGuidelineChunks(orgId ?? submission.org_id)
  console.log(`[eval] chunks       ${Date.now() - t_rag}ms  (${pinned.length} pinned, ${guidelines.length} guidelines)`)

  const hardStopsText = pinned.map((c: any) => `• ${c.content.slice(0, 240)}`).join('\n')
  const guidelinesText = guidelines.map((c: any) => `[Page ${c.page}]\n${c.content}`).join('\n\n---\n\n')
  const hardStopCheckList = pinned.map((c: any) => `- ${c.embed_text.split(':')[0].trim()}`).join('\n')

  // Fire insights + risk profile immediately — they need no check results
  const insightsPromise = runInsightsCall(submissionText)
  const riskProfilePromise = runRiskProfileCall(submissionText, riskProfileFields)

  const t_call1 = Date.now()
  const stream = anthropic.messages.stream({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 10000,
    temperature: 0,
    tools: [CHECKS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_evaluation' },
    messages: buildChecksMessages(submissionText, hardStopsText, guidelinesText, hardStopCheckList),
  } as any)

  const finalMsg = await stream.finalMessage()
  logUsage('checks', Date.now() - t_call1, finalMsg.usage)

  if (finalMsg.stop_reason === 'max_tokens') {
    throw new Error('[eval] checks call truncated — hit max_tokens')
  }

  const toolUseBlock = finalMsg.content.find((b: any) => b.type === 'tool_use')
  if (!toolUseBlock) {
    throw new Error(`[eval] checks call returned no tool_use block (stop_reason: ${finalMsg.stop_reason})`)
  }
  const checksResult = (toolUseBlock as any).input as {
    verdict_code: string
    verdict_label?: string
    verdict_reason?: string
    action_recommendation?: string
    hard_stops_triggered?: any[]
    guideline_checks: any[]
  }

  // Enforce DECLINE when any check has status "fail" — server is the source of truth
  const hasFail = checksResult.guideline_checks?.some((c: any) => c.status === 'fail')
  if (hasFail && checksResult.verdict_code !== 'DECLINE') {
    console.warn(`[eval] verdict overridden  claude=${checksResult.verdict_code} → DECLINE`)
    checksResult.verdict_code = 'DECLINE'
  }

  console.log(`[eval] call 1 output  ${JSON.stringify(checksResult).length} chars  verdict=${checksResult.verdict_code}  checks=${checksResult.guideline_checks?.length ?? 0}`)

  // Fire flags + enrichment in parallel
  const flagsPromise = runFlagsCall(submissionText, checksResult)
  const enrichmentPromise = runEnrichmentCall(submissionText, checksResult.guideline_checks ?? [])

  const t_parallel = Date.now()
  async function track<T>(label: string, p: Promise<T>): Promise<{ value: T; ms: number; label: string }> {
    const t = Date.now()
    const value = await p
    return { value, ms: Date.now() - t, label }
  }

  const [flags, insights, riskProfileTracked, enrichmentsTracked] = await Promise.all([
    track('flags', flagsPromise),
    track('insights', insightsPromise),
    track('risk_profile', riskProfilePromise),
    track('enrichment', enrichmentPromise),
  ])

  const flagsResult    = flags.value
  const insightsResult = insights.value
  const riskProfile    = riskProfileTracked.value
  const enrichments    = enrichmentsTracked.value as any[]

  const tracked = [flags, insights, riskProfileTracked, enrichmentsTracked]
  const slowest = tracked.reduce((a, b) => a.ms > b.ms ? a : b)
  const parallelMs = Date.now() - t_parallel
  console.log(
    `[eval] parallel wait ${parallelMs}ms  ` +
    tracked.map(x => `${x.label}=${x.ms}ms`).join('  ') +
    `  ← slowest: ${slowest.label}`
  )

  // Merge enrichment into checks
  enrichments.forEach((e: any, i: number) => {
    if (checksResult.guideline_checks[i]) {
      checksResult.guideline_checks[i].raw_text = e.raw_text ?? undefined
      checksResult.guideline_checks[i].context  = e.context  ?? undefined
      checksResult.guideline_checks[i].doc_name = e.doc_name ?? undefined
      checksResult.guideline_checks[i].page_ref = e.page_ref ?? undefined
    }
  })

  console.log(`[eval] score        ${flagsResult.composite_score}  ${flagsResult.score_label}  → ${checksResult.verdict_code}`)
  console.log(`[eval] total        ${Date.now() - t0}ms`)

  return {
    verdict_code:          checksResult.verdict_code,
    verdict_label:         checksResult.verdict_label,
    verdict_reason:        checksResult.verdict_reason,
    action_recommendation: checksResult.action_recommendation,
    hard_stops_triggered:  checksResult.hard_stops_triggered ?? [],
    guideline_checks:      checksResult.guideline_checks,
    risk_summary:          flagsResult.risk_summary,
    analysis_summary:      flagsResult.analysis_summary,
    priority_actions:      flagsResult.priority_actions ?? [],
    recommendation:        flagsResult.recommendation,
    flags:                 flagsResult.flags ?? [],
    favorable_factors:     flagsResult.favorable_factors ?? [],
    dimension_scores:      flagsResult.dimension_scores,
    composite_score:       flagsResult.composite_score,
    score_label:           flagsResult.score_label,
    insights:              insightsResult.insights ?? [],
    missing_information:   insightsResult.missing_information ?? [],
    risk_profile:          riskProfile,
  }
}

export type ChunkClassification = {
  index: number
  keep: boolean
  summary: string
  type?: string
}

async function classifyBatch(batch: Array<{ index: number; embed: string }>): Promise<ChunkClassification[]> {
  const numbered = batch
    .map((c) => `=== CHUNK ${c.index} ===\n${c.embed.slice(0, 800)}`)
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    temperature: 0,
    messages: [{ role: 'user', content: `${CLASSIFY_INSTRUCTIONS}\n\n${numbered}\n\nReturn ONLY the JSON array:` }],
  })

  const text = (response.content[0] as any).text as string
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean) as ChunkClassification[]
  } catch {
    console.warn(`[guidelines] classifyBatch parse failed for indices ${batch.at(0)?.index}–${batch.at(-1)?.index} — keeping all`)
    return batch.map((c) => ({ index: c.index, keep: true, summary: '' }))
  }
}

const BATCH_SIZE = 20

export async function classifyChunks(chunks: import('./reducto').ReductoChunk[]): Promise<ChunkClassification[]> {
  const batches: Array<Array<{ index: number; embed: string }>> = []
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE).map((c, j) => ({ index: i + j, embed: c.embed })))
  }

  const batchResults = await Promise.all(batches.map(classifyBatch))
  const results = batchResults.flat()
  console.log(`[guidelines] classified ${results.length} chunks across ${batches.length} batches, keeping ${results.filter(r => r.keep).length}`)
  return results
}

export async function extractRiskProfileFields(allChunksText: string): Promise<string[]> {
  const prompt = buildRiskFieldsPrompt(allChunksText)

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 500,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    const fields = JSON.parse(clean)
    console.log(`[guidelines] risk profile fields: ${fields.length} fields`)
    return fields
  } catch {
    console.warn('[guidelines] risk profile fields parse failed — using defaults')
    return ['named_insured', 'broker', 'tiv', 'prior_carrier', 'losses_5yr', 'location_count']
  }
}

export async function extractHardStops(allChunksText: string): Promise<Array<{
  rule_name: string
  condition: string
  section: string
  line?: string
}>> {
  const prompt = buildHardStopsPrompt(allChunksText)

  const estimatedOutputTokens = Math.ceil(allChunksText.length / 20)
  const maxTokens = Math.min(8000, Math.max(4000, estimatedOutputTokens))

  const t0 = Date.now()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log(`[hardstops] claude api   ${Date.now() - t0}ms`)

  if (response.stop_reason === 'max_tokens') {
    console.warn('[hardstops] truncated — retrying with 8000 tokens')

    const t1 = Date.now()
    const retryResponse = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 8000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
    console.log(`[hardstops] retry api    ${Date.now() - t1}ms`)

    const retryText = (retryResponse.content[0] as any).text as string
    const retryStripped = retryText.replace(/```json|```/g, '').trim()
    const retryMatch = retryStripped.match(/\[[\s\S]*\]/)

    if (!retryMatch) {
      console.warn('[hardstops] retry: no JSON array found')
      return []
    }
    try {
      const result = JSON.parse(retryMatch[0])
      console.log(`[hardstops] retry ok     ${result.length} stops`)
      return result
    } catch (e) {
      console.warn('[hardstops] retry: JSON parse failed')
      return []
    }
  }

  const text = (response.content[0] as any).text as string
  const stripped = text.replace(/```json|```/g, '').trim()
  const match = stripped.match(/\[[\s\S]*\]/)

  if (!match) {
    console.warn('[hardstops] no JSON array found in response')
    console.warn('[hardstops] raw:', stripped.slice(0, 500))
    return []
  }

  try {
    const hardStops = JSON.parse(match[0])
    console.log(`[hardstops] extracted    ${hardStops.length} stops  (total ${Date.now() - t0}ms)`)
    return hardStops
  } catch (e) {
    console.warn('[hardstops] JSON parse failed')
    return []
  }
}
