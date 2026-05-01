import { VOICE } from './voice'

export function buildInsightsPrompt(submissionText: string): string {
  return `You are an expert commercial insurance underwriter analyzing a broker submission.

${VOICE}

SUBMISSION:
${submissionText}

Return ONLY valid JSON, no markdown, no backticks:
{
  "insights": [
    {
      "type": "<PATTERN_RECOGNITION | MARKET_CONTEXT | CONSISTENCY_CHECK | COVERAGE_GAP>",
      "label": "<short label — 5 words max>",
      "finding": "<1-2 sentences. Start with the required opener for the type.>",
      "source_docs": ["<document names that support this insight>"]
    }
  ],
  "missing_information": [
    {
      "label": "<short label — 5 words max>",
      "description": "<1 sentence — start with Required:>",
      "why_it_matters": "<1 sentence — specific underwriting impact if not obtained>",
      "how_to_obtain": "<1 sentence — exactly what to request from whom>",
      "priority": <integer 1-7, 1 = most critical>
    }
  ]
}

INSIGHT TYPE RULES:
  PATTERN_RECOGNITION  Cross-submission risk pattern. Same cause appearing across multiple losses, locations, or years. Systemic indicator — not a one-off event. Opener: "Risk pattern:"
  MARKET_CONTEXT       Prior carrier history, non-renewal reasons, market conditions affecting appetite, coverage history gaps. Include ONLY if material. Opener: "Market context:"
  CONSISTENCY_CHECK    Contradiction between source tiers. Broker Represented or Owner Stated source claims something that Inspector Confirmed or Application Stated evidence contradicts. MANDATORY whenever a Broker Represented or Owner Stated claim is favorable and no Inspector Confirmed or Application Stated source confirms it. Opener: "Consistency:"
  COVERAGE_GAP         Missing coverage, sublimit inadequacy, co-insurance gap, limit inadequacy vs. exposure, or coverage form mismatch. Opener: "Coverage gap:"

INSIGHT LIMITS:
  Include 2-4 insights total. Each must add underwriting value not captured elsewhere in the report. Do not restate flag findings as insights. Omit insight types where there is genuinely nothing material to report.

MISSING INFORMATION PRIORITY RULES (integer 1-7):
  1-2   Required before any coverage attaches. Absence prevents binding. Examples: signed ACORD, current loss runs, flood elevation certificate required by carrier for Zone A properties.
  3-4   Required before binding but not before quoting. Examples: roof inspection for 20+ year roof, MVR for listed drivers, updated payroll audit for WC.
  5-7   Important for underwriting file completeness but not blocking.

MISSING INFO VOLUME RULES (enforce strictly):
  Target 2-5 items. Maximum 7 under any circumstances.
  Over 7 items signals failure of judgment, not thoroughness.
  When choosing between a priority 3-4 and 5-7 item, use 5-7 or omit entirely unless the item would genuinely change the quoting decision.

MISSING INFO QUALITY GATE — apply before including any item:
  Ask: if this information were provided and it confirmed the expected (compliant) answer, would the verdict or terms change?
  If NO → omit the item entirely.
  Examples that FAIL the quality gate: electrical panel brands when copper wiring is confirmed and a licensed inspector found no concerns; polybutylene/lead piping when copper supply and PVC drain are confirmed by an Inspector Confirmed report; nitrous oxide compliance when dental occupancy is confirmed and inspection noted compliance.
  Examples that PASS: roof replacement plan when roof age is approaching threshold; sprinkler recertification when last cert is 2+ years old; PERC permit renewal when permit expires within policy period.

SOURCING REQUIREMENT:
  Every insight must cite at least one source_doc.
  Do not list items already fully answered by the submitted documents.
  Do not list standard policy issuance information (agent code, effective date, payment plan).`
}
