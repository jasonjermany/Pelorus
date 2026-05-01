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
    "risk_tier_reason": "<one sentence explaining the tier assignment>"
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
      "source_tier": "<Inspector Confirmed | Application Stated | Broker Represented | Owner Stated | Not Confirmed>"
    }
  ],
  "favorable_factors": [
    {
      "factor": "<positive finding — noun phrase, 6 words max>",
      "detail": "<1 sentence — start with Positive indicator.>",
      "source_doc": "<document name>"
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
  HARD_STOP  Guideline check status "fail." Verdict is DECLINE. Required. Opener: "Hard stop confirmed." Use for explicit automatic decline conditions.
  CONDITION  Guideline check status "fail" — not a named hard stop but verdict is still DECLINE. Use ONLY when verdict_code = DECLINE. NEVER use CONDITION when verdict is REFER, REQUEST_INFO, or PROCEED. Opener: "Hard stop confirmed."
  VERIFY     Guideline check status "review." Used for referral triggers, items requiring authority approval, or unconfirmed material conditions. Opener: "Requires verification."
  INFO       Material observation NOT tied to any guideline check. Maximum 2 INFO flags. Apply extreme selectivity. DO NOT use INFO for standard regulated items confirmed as compliant (nitrous oxide in dental offices, refrigerants, standard medical gases), normal tenant equipment, routine occupancy characteristics. Opener: "Note."

FLAG TYPE / VERDICT BINDING RULE — enforce strictly:
  HARD_STOP or CONDITION → verdict_code MUST be DECLINE
  VERIFY                 → verdict_code is REFER or REQUEST_INFO
  INFO                   → any verdict
  If you assign CONDITION but verdict is REFER or PROCEED, you have made an error. Correct it: change the flag type to VERIFY.

Flags: maximum 6 total. Ranked by priority_rank (1 = most important).
Do NOT flag items that would not change the verdict, terms, or underwriter action.
Do NOT re-flag items already in priority_actions.
Do NOT flag standard-compliant regulated items.

PROCEED IS VALID AND OFTEN CORRECT. The majority of well-documented commercial property submissions from competent brokers should resolve to PROCEED or REQUEST_INFO — not REFER. If every run produces REFER, the review check generation is too aggressive. A clean, well-documented account with Class A construction, updated/permitted systems, wet pipe sprinklers certified, Zone X flood, strong loss history, 0% vacancy, and an Inspector Confirmed report finding no hard stops is a PROCEED.

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
