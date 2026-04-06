import Anthropic from '@anthropic-ai/sdk'
import { getGuidelineChunks } from './rag'
import { CHECKS_TOOL, buildChecksMessages } from './prompts/checks'
import { buildFlagsPrompt } from './prompts/flags'
import { buildInsightsPrompt } from './prompts/insights'
import { buildRiskProfilePrompt } from './prompts/riskProfile'
import { CLASSIFY_INSTRUCTIONS } from './prompts/classify'
import { buildHardStopsPrompt } from './prompts/hardStops'
import { buildRiskFieldsPrompt } from './prompts/riskFields'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'extended-cache-ttl-2025-04-11',
  },
})

async function runInsightsCall(submissionText: string): Promise<any> {
  const prompt = buildInsightsPrompt(submissionText)
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  console.log(`[eval] call 2 output  ${text.length} chars (~${Math.round(text.length / 4)} tokens)`)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.warn('[eval] insights call parse failed')
    return { insights: {}, missing_info: [] }
  }
}

async function runFlagsCall(
  submissionText: string,
  checksResult: { decision: string; guideline_checks: any[] },
): Promise<any> {
  const prompt = buildFlagsPrompt(submissionText, checksResult)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  console.log(`[eval] call 3 output  ${text.length} chars (~${Math.round(text.length / 4)} tokens)`)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.error('[eval] flags call parse failed, last 300:', text.slice(-300))
    throw new Error('flags call JSON parse failed')
  }
}

async function runRiskProfileCall(submissionText: string, fields: string[]): Promise<Record<string, { value: string; source: string }>> {
  const prompt = buildRiskProfilePrompt(submissionText, fields)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 5000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.warn('[eval] risk profile parse failed')
    return {}
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

  // Stream Call 1 (checks) — fire flags as soon as decision is visible in the stream
  let flagsPromise: Promise<any> | null = null
  let partialToolInput = ''
  let flagsFired = false

  const t_call1 = Date.now()
  const stream = anthropic.messages.stream({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 6000,
    temperature: 0,
    tools: [CHECKS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_evaluation' },
    messages: buildChecksMessages(submissionText, hardStopsText, guidelinesText, hardStopCheckList, pinned.length),
  } as any)

  stream.on('streamEvent', (event: any) => {
    if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
      partialToolInput += event.delta.partial_json ?? ''
      if (!flagsFired) {
        const m = partialToolInput.match(/"decision"\s*:\s*"(PROCEED|REFER|DECLINE)"/)
        if (m) {
          flagsFired = true
          console.log(`[eval] flags fired  → ${m[1]}`)
          flagsPromise = runFlagsCall(submissionText, { decision: m[1]!, guideline_checks: [] })
        }
      }
    }
  })

  const finalMsg = await stream.finalMessage()
  console.log(`[eval] call 1       ${Date.now() - t_call1}ms`)

  const usage = finalMsg.usage as any
  if (usage.cache_read_input_tokens > 0) {
    console.log(`[eval] cache HIT    ${usage.cache_read_input_tokens} tokens`)
  } else if (usage.cache_creation_input_tokens > 0) {
    console.log(`[eval] cache MISS   ${usage.cache_creation_input_tokens} tokens written`)
  }

  if (finalMsg.stop_reason === 'max_tokens') {
    throw new Error('[eval] checks call truncated — hit max_tokens')
  }

  const toolUseBlock = finalMsg.content.find((b: any) => b.type === 'tool_use')
  if (!toolUseBlock) {
    throw new Error(`[eval] checks call returned no tool_use block (stop_reason: ${finalMsg.stop_reason})`)
  }
  const checksResult = (toolUseBlock as any).input as { decision: string; guideline_checks: any[] }

  // Enforce decision priority server-side — Claude should follow the rules but this is the source of truth
  const hasFail = checksResult.guideline_checks?.some((c: any) => c.status === 'fail')
  const hasReview = checksResult.guideline_checks?.some((c: any) => c.status === 'review')
  const enforcedDecision = hasFail ? 'DECLINE' : hasReview ? 'REFER' : 'PROCEED'
  if (enforcedDecision !== checksResult.decision) {
    console.warn(`[eval] decision overridden  claude=${checksResult.decision} → enforced=${enforcedDecision}`)
    checksResult.decision = enforcedDecision
  }

  console.log(`[eval] call 1 output  ${JSON.stringify(checksResult).length} chars  (${checksResult.guideline_checks?.length ?? 0} checks)`)

  // Always re-run flags with the full, enforced checksResult (early-fired version had empty checks)
  flagsPromise = runFlagsCall(submissionText, checksResult)

  // Await all parallel calls (flags already running since early in stream)
  const t_p2 = Date.now()
  const [flagsResult, insightsResult, riskProfile] = await Promise.all([
    flagsPromise,
    insightsPromise,
    riskProfilePromise,
  ])
  console.log(`[eval] parallel     ${Date.now() - t_p2}ms remaining wait`)
  console.log(`[eval] score        ${flagsResult.composite_score}  → ${checksResult.decision}`)
  console.log(`[eval] total        ${Date.now() - t0}ms`)

  return {
    decision: checksResult.decision,
    composite_score: flagsResult.composite_score,
    guideline_checks: checksResult.guideline_checks,
    recommendation: flagsResult.recommendation,
    flags: flagsResult.flags,
    favorable_factors: flagsResult.favorable_factors,
    dimension_scores: flagsResult.dimension_scores,
    insights: insightsResult.insights,
    missing_info: insightsResult.missing_info,
    risk_profile: riskProfile,
  }
}

export type ChunkClassification = {
  index: number
  keep: boolean
  summary: string
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
