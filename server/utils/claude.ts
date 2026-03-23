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
  const submissionText = submission.raw_text

  const t_rag = Date.now()
  const { pinned, similar } = await getRelevantChunks(submission.org_id, submissionText)
  console.log(`[eval] rag          ${Date.now() - t_rag}ms  (${pinned.length} pinned, ${similar.length} similar)`)

  const hardStopsText = pinned.map((c: any) => `• ${c.content.slice(0, 120)}`).join('\n')
  const guidelinesText = similar
    .map((c: any) => `[Page ${c.page}]\n${c.content}`)
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

HARD STOP STATUS RULES — apply these to every check, no exceptions:

Assign "fail" when:
- The condition is explicitly confirmed present in any submitted document
- Any document mentions the condition existed, even if claimed remediated,
  unless this submission contains written professional certification of
  complete removal meeting program standards
- The submission discloses materials or systems from an era when the
  prohibited condition was common, without confirming the specific
  safe type currently present

Assign "review" when:
- The condition cannot be confirmed absent from all portions of all buildings
- Any system, material, or condition is described with vague language such
  as "original", "predating modern standards", "unconfirmed", or similar
- The submission does not explicitly address this condition at all
- Claimed remediation exists but written professional documentation
  confirming complete resolution is not included in this submission
- The building age or location creates reasonable risk that the condition
  may be present, even if not disclosed

Assign "pass" only when all of the following are true:
- The condition is explicitly confirmed absent from all portions of
  all buildings in the submission
- Confirmation comes from a named professional report, inspection
  certificate, or explicit documented statement
- No document in the submission mentions or implies the condition
  may have existed or currently exists

GENERAL RULES:
- "It was fixed" without supporting documentation = "review", not "pass"
- Any mention of a condition in any document = at minimum "review"
- Silence on a condition for an older building = "review", not "pass"
- Partial remediation of a building does not satisfy whole-building requirements
- Program approvals not yet obtained = "review", not "pass"
- Geographic or age-based risk factors warrant "review" even without
  explicit disclosure

You MUST evaluate ALL of the following checks. These are derived from this carrier's actual guidelines.
Do not add checks. Do not remove checks. Do not rename checks. Evaluate every single one.

MANDATORY CHECKS — evaluate all ${pinned.length} of these:
${hardStopCheckList}

For each check:
- status "pass" = clearly not present in submission
- status "review" = unclear or cannot confirm from submission
- status "fail" = confirmed present → triggers DECLINE or referral

Only include checks with status "review" or "fail" in guideline_checks.
Do NOT include passing checks — omit them entirely to keep the response concise.

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
    "action_items": ["<action — 1 sentence max>"]
  },
  "flags": [
    {
      "title": "<short label — 6 words max>",
      "type": "CONDITION" | "VERIFY",
      "explanation": "<what the issue is — 2 sentences max>",
      "action_required": "<what the underwriter must do — 1 sentence>",
      "cited_section": "<guideline section reference>"
    }
  ],
  "favorable_factors": ["<factor 1>", "<factor 2>"],
  "insights": {
    "pattern_recognition": "<AI pattern analysis of this risk — 2-3 sentences>",
    "market_context": "<prior carrier and market context — 2-3 sentences>",
    "consistency_check": "<cross-document consistency observations — 2-3 sentences>",
    "coverage_gap": "<missing coverages or gaps to flag — 2-3 sentences>"
  },
  "missing_info": [
    {
      "label": "<short label — 5 words max>",
      "description": "<1 sentence — what is needed and why>"
    }
  ],
  "guideline_checks": [
    {
      "rule": "<exact rule name from the mandatory list above>",
      "required": "<what the guideline requires — one sentence>",
      "submitted": "<what the submission says about this — one sentence>",
      "status": "review" | "fail",
      "cited_section": "<section reference>"
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
- If ALL checks pass (guideline_checks is empty) → decision is "PROCEED"
Apply these rules mechanically. Do not override them with judgment.

FLAG RULES:
- CONDITION flag = check has status "fail" or requires resolution before binding
- VERIFY flag = check has status "review" or needs confirmation
- flags: max 6 items
- action_items: max 4 items
- favorable_factors: max 4 items`

  console.log(`[eval] prompt       ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`)

  const t_api = Date.now()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 16000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log(`[eval] claude api   ${Date.now() - t_api}ms`)

  const text = (response.content[0] as any).text as string
  console.log(`[eval] output chars  ${text.length}`)
  console.log(`[eval] output tokens ~${Math.round(text.length / 4)}`)
  const clean = text.replace(/```json|```/g, '').trim()

  if (response.stop_reason === 'max_tokens') {
    console.error('[claude] response truncated — hit max_tokens limit')
    console.error('[claude] last 300 chars:', clean.slice(-300))
    throw new Error('Claude response truncated — increase max_tokens or reduce prompt size')
  }

  try {
    const verdict = JSON.parse(clean)

    // Override composite_score with decision-banded calculation
    // guideline_checks only contains review/fail — infer pass count from total pinned
    const checks = verdict.guideline_checks ?? []
    const failCount = checks.filter((c: any) => c.status === 'fail').length
    const reviewCount = checks.filter((c: any) => c.status === 'review').length
    const totalChecks = pinned.length
    const passCount = Math.max(0, totalChecks - failCount - reviewCount)

    let score: number
    if (failCount > 0) {
      score = Math.max(0, 25 - (failCount - 1) * 8)
    } else if (reviewCount > 0) {
      const reviewRatio = reviewCount / totalChecks
      score = Math.round(74 - (reviewRatio * 34))
      score = Math.max(40, Math.min(74, score))
    } else {
      score = Math.round(80 + (passCount / totalChecks) * 20)
      score = Math.min(100, score)
    }

    verdict.composite_score = score
    console.log(`[eval] score        ${score}  (${passCount}p/${reviewCount}r/${failCount}f of ${totalChecks}) → ${verdict.decision}`)

    console.log(`[eval] total        ${Date.now() - t0}ms`)

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
