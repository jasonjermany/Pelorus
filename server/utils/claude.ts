import Anthropic from '@anthropic-ai/sdk'
import { getRelevantChunks } from './rag'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function evaluateSubmission(submission: {
  id: string
  org_id: string
  raw_text: string
  extracted_fields?: Record<string, unknown> | null
}) {
  const submissionText = submission.raw_text.slice(0, 12000)
  const { pinned, similar } = await getRelevantChunks(submission.org_id, submissionText)

  const hardStopsText = pinned.map((c: any) => c.content.slice(0, 500)).join('\n\n')
  const guidelinesText = similar
    .map((c: any) => `[Page ${c.page}]\n${c.content.slice(0, 1500)}`)
    .join('\n\n---\n\n')

  const prompt = `You are an expert commercial insurance underwriter evaluating a broker submission.

## HARD STOPS — Check these first. If ANY match, decision is DECLINE immediately.
${hardStopsText || '(none)'}

## RELEVANT GUIDELINES (retrieved for this specific risk)
${guidelinesText || '(none)'}

## SUBMISSION
${submissionText}

---

Evaluate this submission against the guidelines above.
Return ONLY a JSON object — no other text, no markdown, no backticks.

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
    "action_items": ["<item 1>", "<item 2>"]
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
      "rule": "<rule name>",
      "required": "<what the guideline requires>",
      "submitted": "<what was in the submission>",
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

Rules:
- If ANY hard stop condition is present → decision MUST be "DECLINE"
- CONDITION flag = must be resolved before binding
- VERIFY flag = needs confirmation but does not block
- Cite the specific guideline section for every flag and check`

  console.log('[claude] prompt chars:', prompt.length)
  console.log('[claude] prompt approx tokens:', Math.round(prompt.length / 4))

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  const clean = text.replace(/```json|```/g, '').trim()

  if (response.stop_reason === 'max_tokens') {
    console.error('[claude] response truncated — hit max_tokens limit')
    console.error('[claude] last 300 chars:', clean.slice(-300))
    throw new Error('Claude response truncated — increase max_tokens or reduce prompt size')
  }

  try {
    return JSON.parse(clean)
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

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  console.log('[claude] hard stop raw response:', text.slice(0, 1000))

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    console.warn('[claude] hard stop extraction: no JSON array found in response')
    console.warn('[claude] raw response:', text.slice(0, 500))
    return []
  }
  try {
    return JSON.parse(match[0])
  } catch (e) {
    console.warn('[claude] hard stop extraction: JSON parse failed')
    console.warn('[claude] matched text:', match[0].slice(0, 500))
    return []
  }
}
