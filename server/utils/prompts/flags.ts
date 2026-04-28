import { VOICE } from './voice'

export function buildFlagsPrompt(
  submissionText: string,
  checksResult: { verdict_code: string; guideline_checks: any[] },
): string {
  return `You are an expert commercial insurance underwriter.

${VOICE}

SUBMISSION (first 10,000 characters):
${submissionText.slice(0, 10000)}

GUIDELINE CHECK RESULTS:
${JSON.stringify(checksResult, null, 2)}

Return ONLY valid JSON, no markdown, no backticks:
{
  "risk_summary": {
    "one_liner": "<15 words max. Named insured, primary operation, location, TIV. Nothing else.>",
    "uw_file_note": "<3-5 sentences written as underwriting file notes — past tense, declarative, professional. Cover: what was submitted, what the analysis found, what the key issues are, and what action was taken or recommended. Do not start with I.>",
    "risk_tier": "<PREFERRED | STANDARD | SUBSTANDARD | INELIGIBLE>",
    "risk_tier_reason": "<one sentence explaining the tier assignment>",
    "binding_authority": "<FIELD | REFER_CUM | REFER_SENIOR | DECLINE>"
  },
  "analysis_summary": "<3-5 sentence executive summary. Start with the verdict word (DECLINE. REFER. PROCEED.). Cite the two most material findings. End with the single most important next action.>",
  "priority_actions": [
    {
      "priority": <1-5 integer, 1 = most urgent>,
      "action": "<verb-first, specific, 1 sentence>",
      "why": "<one sentence — what happens if this is not done>",
      "deadline": "<Before binding | Before quoting | Within 10 days | Within 30 days | At renewal | Informational>",
      "owner": "<Underwriter | Broker | CUM | Risk Control | Legal>"
    }
  ],
  "recommendation": {
    "summary": "<decision rationale — 2 sentences max, declarative, start with Decision:>",
    "action_items": ["<specific next step — verb-first, 1 sentence, max 5 items>"]
  },
  "flags": [
    {
      "title": "<issue label — 6 words max, noun phrase>",
      "type": "<HARD_STOP | CONDITION | VERIFY | INFO>",
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "priority_rank": <integer 1-6, 1 = most urgent>,
      "explanation": "<what the issue is and why it matters — 2 sentences max>",
      "action_required": "<what must be done — verb-first, 1 sentence>",
      "cited_section": "<guideline section reference>",
      "source_doc": "<submission document name>",
      "source_tier": "<T1 | T2 | T3 | T4 | NOT_CONFIRMED>"
    }
  ],
  "favorable_factors": [
    {
      "factor": "<positive finding — noun phrase, 6 words max>",
      "detail": "<1 sentence — start with Positive indicator.>",
      "source_doc": "<document name>",
      "source_tier": "<T1 | T2 | T3 | T4>"
    }
  ],
  "dimension_scores": {
    "construction": <0.0-10.0>,
    "fire_protection": <0.0-10.0>,
    "occupancy": <0.0-10.0>,
    "loss_history": <0.0-10.0>,
    "management": <0.0-10.0>,
    "cat_exposure": <0.0-10.0>,
    "submission_quality": <0.0-10.0>
  },
  "composite_score": <0.0-10.0>,
  "score_label": "<Exceptional | Strong | Acceptable | Marginal | Elevated Risk | High Risk>"
}

COMPOSITE SCORE LABELS:
  9.0-10.0 Exceptional   8.0-8.9 Strong   7.0-7.9 Acceptable
  6.0-6.9  Marginal      5.0-5.9 Elevated Risk   <5.0 High Risk

COMPOSITE SCORE RULES:
- Score the underlying risk quality independently of the underwriting decision.
- A hard stop does not automatically mean a low score — a well-managed risk that triggers one eligibility condition can score 7-9.
- Score low (0-4) only when the risk itself is genuinely poor: poor construction, high hazard, poor loss history, inadequate controls, or multiple compounding concerns.
- Never force the composite score up or down to match the verdict.

FLAG TYPE RULES:
  HARD_STOP  = guideline_check has status "fail" AND matches an explicit hard stop rule
  CONDITION  = guideline_check has status "fail" but is not a formal hard stop (conditional fails)
  VERIFY     = guideline_check has status "review"
  INFO       = material observation not tied to a guideline check; use ONLY when it would change underwriter decision. Maximum 2 INFO flags.
  Flags: maximum 6 total. Ranked by priority_rank (1 = most important).

PRIORITY ACTION RULES:
  Include 3-6 priority actions. Rank 1 = do this first.
  1 = Hard stop resolution (DECLINE only — issue letter or request cure)
  2 = Binding-required missing information
  3 = Referral submission to authority
  4 = Pre-bind required information
  5 = Coverage gap or condition to address at quoting
  6 = Informational / file documentation item
  Every action must be specific and assignable.`
}
