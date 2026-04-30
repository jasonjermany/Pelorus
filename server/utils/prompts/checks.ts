import { HARD_STOP_RULES } from './voice'

export const CHECKS_TOOL = {
  name: 'submit_evaluation',
  description: 'Submit the structured underwriting evaluation results after analyzing all checks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      pelorus_reference_id: {
        type: 'string',
        description: 'Generate as PEL-YYYYMMDD-XXXX where XXXX is a 4-char hash of the named insured (e.g. PEL-20260428-MAPL). Use today\'s date.',
      },
      verdict_code: {
        type: 'string',
        enum: ['DECLINE', 'SOFT_DECLINE', 'REFER', 'REQUEST_INFO', 'PROCEED'],
        description: 'Overall verdict code. Follow verdict priority rules exactly.',
      },
      verdict_label: {
        type: 'string',
        description: 'Human-readable label: "Decline" | "Recommended Decline" | "Refer to Authority" | "Request Additional Information" | "Proceed to Quote"',
      },
      verdict_reason: {
        type: 'string',
        description: 'One sentence citing the specific condition, guideline section, or pattern driving this verdict.',
      },
      action_recommendation: {
        type: 'string',
        description: '2-3 sentences written as underwriting file notes. What to do next and why. Start with the verdict label.',
      },
      hard_stops_triggered: {
        type: 'array',
        description: 'List every hard stop that was confirmed present. Empty array if verdict is not DECLINE.',
        items: {
          type: 'object' as const,
          properties: {
            rule_name:           { type: 'string', description: 'Exact rule name.' },
            condition_confirmed: { type: 'string', description: 'Specific condition found in this submission.' },
            guideline_section:   { type: 'string', description: 'Section reference in carrier guidelines.' },
            source_doc:          { type: 'string', description: 'Document where condition was found.' },
            source_tier:         { type: 'string', enum: ['T1', 'T2', 'T3', 'T4'], description: 'Source tier of the confirming evidence.' },
          },
          required: ['rule_name', 'condition_confirmed', 'guideline_section', 'source_doc', 'source_tier'],
        },
      },
      guideline_checks: {
        type: 'array',
        description: 'Only include checks with status "review" or "fail". Omit passing checks entirely.',
        items: {
          type: 'object' as const,
          properties: {
            rule_name:       { type: 'string', description: 'Exact rule name from the eligible check list — copy verbatim.' },
            status:          { type: 'string', enum: ['fail', 'review'] },
            requirement:     { type: 'string', description: 'What the guideline requires — 20 words max.' },
            submitted_value: { type: 'string', description: 'What was submitted — 20 words max, factual only.' },
            section:         { type: 'string', description: 'Guideline section reference.' },
            source_doc:      { type: 'string', description: 'Submission document name. "Not disclosed" if not traceable.' },
            source_tier:     { type: 'string', enum: ['T1', 'T2', 'T3', 'T4', 'NOT_CONFIRMED'], description: 'Source tier.' },
          },
          required: ['rule_name', 'status', 'requirement', 'submitted_value', 'section', 'source_doc', 'source_tier'],
        },
      },
    },
    required: ['pelorus_reference_id', 'verdict_code', 'verdict_label', 'verdict_reason', 'action_recommendation', 'hard_stops_triggered', 'guideline_checks'],
  },
}

export function buildEnrichmentMessages(
  submissionText: string,
  checks: Array<{ rule_name: string; submitted_value: string }>,
) {
  const checkList = checks
    .map((c, i) => `${i}. Rule: "${c.rule_name}"\n   Finding: "${c.submitted_value}"`)
    .join('\n')

  return [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: `## SUBMISSION\n${submissionText}`,
          cache_control: { type: 'ephemeral', ttl: '1h' } as any,
        },
        {
          type: 'text' as const,
          text: `For each finding below, locate the relevant passage in the submission above and return:
- raw_text: the verbatim text excerpt from the document that supports the finding. Copy exactly. Do not paraphrase. Preserve original capitalization, punctuation, and line breaks.
- context: 1-2 sentences of surrounding text giving the underwriter context for where in the document this passage appears and why it is relevant.
- doc_name: the document filename or type (e.g., "Broker Cover Letter", "Loss Runs 2019-2024")
- page_ref: page number or section heading where the passage appears, if determinable.

If a finding has no traceable passage (status "review" — condition not mentioned), set raw_text, context, doc_name, and page_ref all to null.

Return ONLY a JSON array with one object per finding, indexed to match the list below. No markdown, no backticks.
[{ "raw_text": "...", "context": "...", "doc_name": "...", "page_ref": "..." }, ...]

FINDINGS:
${checkList}`,
        },
      ],
    },
  ]
}

export function buildChecksMessages(
  submissionText: string,
  hardStopsText: string,
  guidelinesText: string,
  hardStopCheckList: string,
) {
  return [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: `You are an expert commercial insurance underwriter evaluating a broker submission against carrier guidelines.

## HARD STOPS — carrier guidelines
${hardStopsText || '(none)'}

## RELEVANT GUIDELINES
${guidelinesText || '(none)'}

---

${HARD_STOP_RULES}

---

FIVE-VERDICT SYSTEM — follow in strict priority order, stop at first match:

  DECLINE      One or more guideline checks have status "fail." Hard stop confirmed. Automatic — no judgment override.
               verdict_code: "DECLINE"

  SOFT_DECLINE No hard stop triggered AND no referral trigger AND no BINDING missing information. However, the risk presents compounding concerns severe enough that a recommendation against writing it is warranted.
               ONLY use when ALL of the following are true:
                 1. Composite risk quality would score below 4.5
                 2. Three or more material concerns at HIGH or CRITICAL severity
                 3. A specific articulable reason exists that the underwriter could defend in a file audit
               If any condition is not met, use REFER instead. This verdict is rare. Default to REFER when in doubt.
               verdict_code: "SOFT_DECLINE"

  REFER        No hard stops triggered. Material concerns requiring referral to a specific authority (CUM, senior UW) before a quote can be issued.
               verdict_code: "REFER"

  REQUEST_INFO No hard stops triggered. No referral required. But missing information is material enough that a quote cannot be responsibly issued without it.
               Use when 1+ BINDING missing info items exist with no fails.
               verdict_code: "REQUEST_INFO"

  PROCEED      No hard stops, no referral triggers, no binding missing information. Quote as submitted.
               verdict_code: "PROCEED"

CHECK SELECTION — focused list, not exhaustive audit:
  Include ONLY:
  - Checks where the submission contains information that triggers or relates to the check (include as "fail" or "review"), OR
  - Checks covering conditions material for this risk whose absence is a meaningful gap (include as "review")
  Omit any check with no bearing on this account. Do not rename checks. Use the exact rule_name from the eligible check list.

REVIEW CHECK DISCIPLINE — prevent over-generation:
  Status "review" means the condition is ENTIRELY ABSENT from the submission.
  Do NOT assign "review" when:
  - The submission confirms a related compliant material or system (copper wiring confirmed → aluminum and K&T are implicitly addressed)
  - The condition is standard practice for the occupancy type and no adverse indicators exist
  - A licensed inspection report reviewed the system and found no concerns — sign-off covers the check unless the specific prohibited material is explicitly named
  REVIEW checks should reflect GENUINE gaps. Do not manufacture review checks for theoretical possibilities that the submission's overall documentation pattern makes highly unlikely.
  CALIBRATION TEST: Before adding a "review" check, ask — would a senior underwriter at a regional carrier actually hold this quote pending this specific confirmation, given everything else in this submission? If the answer is "probably not," omit the check.

STATUS RULES — apply Hard Stop Decision Logic above exactly:
  "fail"   — condition present in submission (explicitly, vaguely, or by implication) without T1/T2 documentation satisfying it. T3 broker denial without T1/T2 confirmation = "fail."
  "review" — check is relevant but condition entirely absent from all docs.
  "pass"   — explicitly confirmed absent by T1/T2 source. Omit from output.
  Show only "fail" and "review" checks in guideline_checks.

ELIGIBLE CHECKS:
${hardStopCheckList}

PROCEED DOCTRINE — anti-bias rule, apply on every run:
  PROCEED is not a fallback. It is the correct verdict for any well-documented submission that passes all guideline checks and has no BINDING missing information.
  Do NOT issue REFER solely because:
  - A routine item is unconfirmed but not a guideline-specified referral trigger
  - The submission could theoretically be more complete
  - A standard regulated occupancy hazard exists and is documented as compliant
  - An older system exists but is within all guideline thresholds
  - Your general uncertainty about the risk
  REFER requires a SPECIFIC, ARTICULABLE guideline section or authority requirement. If you cannot cite a section that requires referral for this specific condition, the verdict is PROCEED, not REFER.
  The following items do NOT trigger REFER on their own:
  - Copper wiring confirmed without panel brand names stated (panel brand is a VERIFY flag only)
  - Standard medical gas in licensed medical/dental occupancy confirmed compliant
  - Single water loss in 5+ years with documented remediation and no recurrence
  - Original plumbing/electrical within age thresholds with no adverse findings
  - Any item for which the submission documents confirm compliance with the controlling regulatory authority

Call the submit_evaluation tool with your results.`,
          cache_control: { type: 'ephemeral', ttl: '1h' } as any,
        },
        {
          type: 'text' as const,
          text: `## SUBMISSION TO EVALUATE\n${submissionText}`,
        },
      ],
    },
  ]
}
