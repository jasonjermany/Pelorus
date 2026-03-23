import Anthropic from '@anthropic-ai/sdk'
import { getRelevantChunks } from './rag'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function evaluateSubmission(submission: {
  id: string
  org_id: string
  raw_text: string
  extracted_fields?: Record<string, unknown> | null
}) {
  const t0 = Date.now()
  const submissionText = submission.raw_text.slice(0, 8000)

  const tr = Date.now()
  const { pinned, similar } = await getRelevantChunks(submission.org_id, submissionText)
  console.log(`[claude] 1/3 rag: ${Date.now() - tr}ms → ${pinned.length} pinned, ${similar.length} similar`)

  const hardStopsText = pinned.map((c: any) => `• ${c.content.slice(0, 120)}`).join('\n')
  const guidelinesText = similar
    .map((c: any) => `[Page ${c.page}]\n${c.content.slice(0, 800)}`)
    .join('\n\n---\n\n')

  // Build mandatory check list from stored hard stops (deterministic — derived from DB)
  const hardStopCheckList = pinned
    .map((c: any) => `- ${c.embed_text.split(':')[0].trim()}`)
    .join('\n')

  const prompt = `You are an expert commercial insurance underwriter evaluating a broker submission.

## HARD STOPS — context only, do not re-evaluate here
${hardStopsText || '(none)'}

## RELEVANT GUIDELINES (retrieved for this specific risk)
${guidelinesText || '(none)'}

## SUBMISSION
${submissionText}

---

Evaluate this submission against the guidelines above.
Return ONLY a JSON object — no other text, no markdown, no backticks.

You MUST evaluate ALL of the following checks. These are derived from this carrier's actual guidelines.
Do not add checks. Do not remove checks. Do not rename checks. Evaluate every single one.

MANDATORY CHECKS — evaluate all ${pinned.length} of these:
${hardStopCheckList}

For each check:
- status "pass" = clearly not present in submission
- status "review" = unclear or cannot confirm from submission
- status "fail" = confirmed present → triggers DECLINE or referral

{
  "decision": "PROCEED" | "REFER" | "DECLINE",
  "composite_score": <0-100 integer>,
  "dimension_scores": {
    "construction": <0-100>,
    "fire_protection": <0-100>,
    "management": <0-100>,
    "submission_quality": <0-100>,
    "loss_history": <0-100>,
    "occupancy": <0-100>,
    "cat_exposure": <0-100>
  },
  "recommendation": {
    "summary": "<one sentence>",
    "action_items": ["<item 1>", "<item 2>", "<item 3>", "<item 4>"]
  },
  "flags": [
    {
      "title": "<short label>",
      "type": "CONDITION" | "VERIFY",
      "explanation": "<what the issue is>",
      "action_required": "<what the underwriter must do>",
      "cited_section": "<guideline section reference>"
    }
  ],
  "favorable_factors": ["<factor 1>", "<factor 2>"],
  "guideline_checks": [
    {
      "rule": "<exact rule name from the mandatory list above>",
      "required": "<what the guideline requires — one sentence>",
      "submitted": "<what the submission says about this — one sentence>",
      "status": "pass" | "review" | "fail",
      "cited_section": "<section reference>"
    }
  ],
  "insights": {
    "pattern_recognition": "<AI pattern analysis>",
    "market_context": "<prior carrier / market context>",
    "consistency_check": "<cross-document consistency>",
    "coverage_gap": "<any missing coverages to flag>"
  },
  "missing_info": [
    {
      "label": "<short label>",
      "description": "<what is needed and why>"
    }
  ],
  "risk_profile": {
    "named_insured": "<full legal name of the insured>",
    "broker": "<broker firm name>",
    "location_count": "<number of locations e.g. '4 locations'>",
    "construction": "<value>",
    "year_built": "<value>",
    "renovation": "<value>",
    "sq_footage": "<value>",
    "tiv": "<value>",
    "roof": "<value>",
    "electrical": "<value>",
    "sprinklers": "<value>",
    "fire_alarm": "<value>",
    "protection_class": "<value>",
    "losses_5yr": "<value>",
    "prior_carrier": "<value>",
    "cooking_ops": "<value>",
    "vacancy": "<value>"
  }
}

DECISION RULES — follow exactly, no judgment:
- If ANY guideline_check has status "fail" → decision MUST be "DECLINE"
- If ANY guideline_check has status "review" → decision MUST be "REFER"
- If ALL guideline_checks have status "pass" → decision is "PROCEED"
Apply these rules mechanically. Do not override them with judgment.

FLAG RULES:
- CONDITION flag = check has status "fail" or requires resolution before binding
- VERIFY flag = check has status "review" or needs confirmation
- flags: max 6 items
- missing_info: max 5 items
- action_items: max 4 items
- favorable_factors: max 4 items`

  console.log(`[claude] 2/3 prompt: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`)

  const tc = Date.now()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 16000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log(`[claude] 3/3 api call: ${Date.now() - tc}ms`)
  console.log(`[claude] total: ${Date.now() - t0}ms`)

  const text = (response.content[0] as any).text as string
  const clean = text.replace(/```json|```/g, '').trim()

  if (response.stop_reason === 'max_tokens') {
    console.error('[claude] response truncated — hit max_tokens limit')
    console.error('[claude] last 300 chars:', clean.slice(-300))
    throw new Error('Claude response truncated — increase max_tokens or reduce prompt size')
  }

  try {
    const verdict = JSON.parse(clean)

    // Override composite_score with deterministic calculation from check results
    const checks = verdict.guideline_checks ?? []
    const total = checks.length
    if (total > 0) {
      const passCount = checks.filter((c: any) => c.status === 'pass').length
      const reviewCount = checks.filter((c: any) => c.status === 'review').length
      const failCount = checks.filter((c: any) => c.status === 'fail').length
      const rawScore = (passCount * 1.0 + reviewCount * 0.5 + failCount * 0.0) / total
      verdict.composite_score = Math.round(rawScore * 100)
      console.log(`[claude] score: ${verdict.composite_score} (${passCount}p/${reviewCount}r/${failCount}f of ${total} checks)`)
    }

    return verdict
  } catch (e) {
    console.error('[claude] JSON parse failed')
    console.error('[claude] stop_reason:', response.stop_reason)
    console.error('[claude] response length:', clean.length)
    console.error('[claude] last 300 chars:', clean.slice(-300))
    throw e
  }
}

export async function extractHardStops(allChunksText: string): Promise<Array<{
  rule_name: string
  condition: string
  section: string
}>> {
  const prompt = `Read these underwriting guidelines. Extract every HARD STOP — conditions that cause automatic DECLINE with no exceptions.

Return ONLY a JSON array, no other text:
[{
  "rule_name": "short label",
  "condition": "exactly what triggers this decline",
  "section": "section or appendix reference"
}]

Only automatic declines. Not referral triggers. Not conditional rules.

GUIDELINES:
${allChunksText}`

  const estimatedOutputTokens = Math.ceil(allChunksText.length / 20)
  const maxTokens = Math.min(8000, Math.max(4000, estimatedOutputTokens))

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'max_tokens') {
    console.warn('[claude] hard stop extraction truncated — retrying with 8000 tokens')

    const retryResponse = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 8000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })

    const retryText = (retryResponse.content[0] as any).text as string
    const retryStripped = retryText.replace(/```json|```/g, '').trim()
    const retryMatch = retryStripped.match(/\[[\s\S]*\]/)

    if (!retryMatch) {
      console.warn('[claude] hard stop retry: still no JSON array found')
      return []
    }
    try {
      const result = JSON.parse(retryMatch[0])
      console.log(`[claude] hard stop retry succeeded: ${result.length} stops`)
      return result
    } catch (e) {
      console.warn('[claude] hard stop retry: JSON parse failed')
      return []
    }
  }

  const text = (response.content[0] as any).text as string
  const stripped = text.replace(/```json|```/g, '').trim()
  const match = stripped.match(/\[[\s\S]*\]/)

  if (!match) {
    console.warn('[claude] hard stop extraction: no JSON array found')
    console.warn('[claude] raw response:', stripped.slice(0, 500))
    return []
  }

  try {
    const hardStops = JSON.parse(match[0])
    if (hardStops.length < 10) {
      console.warn(`[claude] suspiciously few hard stops: ${hardStops.length}`)
    }
    console.log(`[claude] hard stop extraction: ${hardStops.length} stops found`)
    return hardStops
  } catch (e) {
    console.warn('[claude] hard stop extraction: JSON parse failed')
    console.warn('[claude] matched text:', match[0].slice(0, 500))
    return []
  }
}
