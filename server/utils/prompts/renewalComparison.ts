export function buildRenewalComparisonPrompt(
  priorYearReport: any,
  currentSubmissionText: string,
  priorReferenceId: string,
): string {
  return `You are a senior commercial lines underwriter reviewing a renewal submission for an account that was previously analyzed by Pelorus.

PRIOR YEAR PELORUS REPORT:
${JSON.stringify(priorYearReport, null, 2)}

CURRENT YEAR SUBMISSION:
${currentSubmissionText.slice(0, 20000)}

PRIOR YEAR REFERENCE: ${priorReferenceId}

WHAT TO COMPARE — run the current year through the full standard pipeline first, then produce this renewal comparison as an additional section.

Compare all material fields between prior year and current year:

CONSTRUCTION / SYSTEMS:
  Roof age (flag if crossed a threshold since last year)
  System updates (new permits, replacements, upgrades)
  New construction or renovation at any location
  New locations added to or removed from the schedule
  TIV changes — flag if any location changed by more than 15%
  Replacement cost adequacy — flag if TIV growth lags inflation

OCCUPANCY:
  Tenant changes — new tenants, departing tenants, new hazard classes
  Vacancy rate changes
  New regulated operations (dry cleaning, food service, hazmat)

LOSS HISTORY:
  New losses since prior year
  Prior year losses now closed vs. still open
  Reserve development — did any prior year loss increase?
  Loss ratio trend — improving or deteriorating?

VERDICT / SCORE DELTA:
  Prior year verdict vs. current year verdict
  Composite score change — flag if moved more than 0.5 in either direction
  Dimension score changes — which dimensions improved, which deteriorated

FLAGS:
  Resolved concerns from prior year (prior VERIFY/CONDITION now cleared)
  New concerns not present in prior year
  Persistent concerns (same flag in both years — escalate priority)

RENEWAL-SPECIFIC JUDGMENT RULES:
  ROOF AGE THRESHOLD CROSSING: If a roof under threshold last year is now over threshold, this is a HIGH severity new concern.
  TIV ADEQUACY DRIFT: If total portfolio TIV grew less than 6% year-over-year, flag for replacement cost appraisal.
  LOSS DEVELOPMENT: If any prior year loss reserve increased, that is DETERIORATED regardless of dollar amount.
  PERSISTENT CONCERNS: A concern in both years should be escalated in priority.
  SCORE: Delta > +0.5 meaningful improvement; -0.5 to +0.5 stable; < -0.5 meaningful deterioration; < -1.5 significant deterioration.

Return ONLY valid JSON, no markdown, no backticks. Append as a top-level "renewal_comparison" field:
{
  "renewal_comparison": {
    "prior_reference_id": "<prior submission identifier>",
    "current_reference_id": "<current submission identifier>",
    "prior_verdict": "<prior verdict_code>",
    "current_verdict": "<current verdict_code>",
    "verdict_changed": <true | false>,
    "prior_composite": <number>,
    "current_composite": <number>,
    "score_delta": <number — positive = improved, negative = deteriorated>,
    "score_trend": "<IMPROVED | STABLE | DETERIORATED>",
    "changes": [
      {
        "category": "<CONSTRUCTION | OCCUPANCY | LOSS_HISTORY | TIV | SYSTEMS | TENANTS>",
        "field": "<specific field name>",
        "prior_value": "<prior year value>",
        "current_value": "<current year value>",
        "direction": "<IMPROVED | NEUTRAL | DETERIORATED | NEW | REMOVED>",
        "note": "<1 sentence — why this change matters>"
      }
    ],
    "resolved_concerns": ["<prior year flag now cleared>"],
    "new_concerns": ["<concern not present in prior year>"],
    "persistent_concerns": ["<concern in both years — note if escalating>"],
    "renewal_recommendation": "<2-3 sentences. Should the carrier renew? On what terms? What changed most materially?>",
    "uw_renewal_note": "<3-4 sentences in past-tense file note style for underwriting file>"
  }
}`
}
