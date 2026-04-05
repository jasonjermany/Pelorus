import { VOICE } from './voice'

export function buildInsightsPrompt(submissionText: string): string {
  return `You are an expert commercial insurance underwriter analyzing a broker submission.

${VOICE}

SUBMISSION:
${submissionText}

Return ONLY valid JSON, no markdown, no backticks:
{
  "insights": {
    "pattern_recognition": "<risk pattern — 1-2 sentences>",
    "market_context": "<prior carrier and market context — 1-2 sentences>",
    "consistency_check": "<cross-document consistency — 1-2 sentences>",
    "coverage_gap": "<missing coverages or gaps — 1-2 sentences>"
  },
  "missing_info": [
    {
      "label": "<short label — 5 words max>",
      "description": "<1 sentence — what is needed and why>"
    }
  ]
}`
}
