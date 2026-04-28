import { HARD_STOP_RULES } from './voice'

export const CHECKS_TOOL = {
  name: 'submit_evaluation',
  description: 'Submit the structured underwriting evaluation results after analyzing all checks.',
  input_schema: {
    type: 'object' as const,
    properties: {
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
    required: ['verdict_code', 'verdict_label', 'verdict_reason', 'action_recommendation', 'hard_stops_triggered', 'guideline_checks'],
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

STATUS RULES — apply Hard Stop Decision Logic above exactly:
  "fail"   — condition present in submission (explicitly, vaguely, or by implication) without T1/T2 documentation satisfying it. T3 broker denial without T1/T2 confirmation = "fail."
  "review" — check is relevant but condition entirely absent from all docs.
  "pass"   — explicitly confirmed absent by T1/T2 source. Omit from output.
  Show only "fail" and "review" checks in guideline_checks.

ELIGIBLE CHECKS:
${hardStopCheckList}

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
