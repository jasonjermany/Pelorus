import { VOICE } from './voice'

export function buildFlagsPrompt(
  submissionText: string,
  checksResult: { decision: string; guideline_checks: any[] },
): string {
  return `You are an expert commercial insurance underwriter.

${VOICE}

SUBMISSION:
${submissionText.slice(0, 10000)}

GUIDELINE CHECK RESULTS (already evaluated):
${JSON.stringify(checksResult, null, 2)}

Return ONLY valid JSON, no markdown, no backticks:
{
  "recommendation": {
    "summary": "<decision rationale — 2 sentences max, declarative>",
    "action_items": ["<specific next step — verb-first, 1 sentence, max 4>"]
  },
  "flags": [
    {
      "title": "<issue label — 6 words max, noun phrase>",
      "type": "CONDITION" | "VERIFY",
      "explanation": "<what the issue is and why it matters — 2 sentences max>",
      "action_required": "<what must be done — verb-first, 1 sentence>",
      "cited_section": "<section reference>"
    }
  ],
  "favorable_factors": ["<positive finding — noun or verb phrase, 1 sentence max, max 4>"],
  "dimension_scores": {
    "construction": <0.0-10.0>,
    "fire_protection": <0.0-10.0>,
    "management": <0.0-10.0>,
    "submission_quality": <0.0-10.0>,
    "loss_history": <0.0-10.0>,
    "occupancy": <0.0-10.0>,
    "cat_exposure": <0.0-10.0>
  },
  "composite_score": <0.0-10.0>
}

composite_score rules:
- This is NOT an average of dimension scores — it is your holistic judgment of the overall risk
- Hard stops should result in scores of 0-2 regardless of other dimensions
- A clean risk with no flags and strong dimensions should score 8-10
- Weight hard stops and eligibility failures most heavily
- The score must feel coherent with your decision and reasoning

FLAG TYPE RULES — follow exactly:
- CONDITION = the corresponding guideline_check has status "fail"
- VERIFY = the corresponding guideline_check has status "review"
- Do not use your own judgment to upgrade or downgrade flag severity.
- The type MUST match the status of the corresponding check exactly.
- Only flag checks with status "fail" or "review" — never flag a "pass".
- flags: max 6 items`
}
