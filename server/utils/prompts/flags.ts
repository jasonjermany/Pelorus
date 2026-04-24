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
- This is NOT an average of dimension scores — it is your holistic judgment of the overall RISK QUALITY
- Score the quality of the underlying risk independently of the underwriting decision
- A hard stop does not automatically mean a low score — a well-documented, clean risk that happens to trigger one eligibility condition can still score 7-9
- Score low (0-4) only when the risk itself is genuinely poor: poor construction, high hazard, poor loss history, inadequate controls, or multiple compounding concerns
- Score high (7-10) when the risk is fundamentally sound even if a guideline check needs follow-up
- Do NOT anchor the score to the decision — a DECLINE can have a high score if the account is good but ineligible; a PROCEED can score low if the risk quality is weak

FLAG TYPE RULES — follow exactly:
- CONDITION = the corresponding guideline_check has status "fail"
- VERIFY = the corresponding guideline_check has status "review"
- Do not use your own judgment to upgrade or downgrade flag severity.
- The type MUST match the status of the corresponding check exactly.
- Only flag checks with status "fail" or "review" — never flag a "pass".
- flags: max 6 items`
}
