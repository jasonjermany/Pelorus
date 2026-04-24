import { HARD_STOP_RULES } from './voice'

export const CHECKS_TOOL = {
  name: 'submit_evaluation',
  description: 'Submit the structured underwriting evaluation results after analyzing all checks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      decision: {
        type: 'string',
        enum: ['PROCEED', 'REFER', 'DECLINE'],
        description: 'Overall underwriting decision based on the check results.',
      },
      guideline_checks: {
        type: 'array',
        description: 'Only include checks with status "review" or "fail". Omit passing checks entirely.',
        items: {
          type: 'object',
          properties: {
            rule:              { type: 'string', description: 'Exact rule name from the mandatory check list — copy verbatim.' },
            submitted:         { type: 'string', description: 'Maximum 20 words. State the key fact only — no explanation, no rationale.' },
            submission_source: { type: 'string', description: 'Document name and page only. "Not disclosed" if not traceable.' },
            status:            { type: 'string', enum: ['review', 'fail'] },
            cited_section:     { type: 'string', description: 'Section or page reference in the carrier guidelines.' },
          },
          required: ['rule', 'submitted', 'submission_source', 'status', 'cited_section'],
        },
      },
    },
    required: ['decision', 'guideline_checks'],
  },
}

export function buildEnrichmentMessages(
  submissionText: string,
  checks: Array<{ rule: string; submitted: string }>,
) {
  const checkList = checks
    .map((c, i) => `${i}. Rule: "${c.rule}"\n   Finding: "${c.submitted}"`)
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
- raw_text: the verbatim text excerpt from the document that supports the finding (copy exactly, do not paraphrase)
- context: 1-2 sentences of surrounding text giving the underwriter context

If a finding has no traceable passage (status "review" — condition not mentioned), set both fields to null.

Return ONLY a JSON array with one object per finding, indexed to match the list below. No markdown, no backticks.
[{ "raw_text": "...", "context": "..." }, ...]

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
          text: `You are an expert commercial insurance underwriter evaluating broker submissions.

## HARD STOPS — carrier guidelines
${hardStopsText || '(none)'}

## RELEVANT GUIDELINES
${guidelinesText || '(none)'}

---

${HARD_STOP_RULES}

Below is the full list of eligible guideline checks for this carrier. Do NOT evaluate all of them mechanically.
Instead, include ONLY checks that are relevant to this specific submission — meaning:
- The submission contains information that triggers or relates to the check (include as "fail" or "pass"), OR
- The check covers a condition that is material for this type of risk/account and its absence is a meaningful gap (include as "review")

Omit any check that has no bearing on this account whatsoever. The goal is a short, focused list — not an exhaustive audit.
Do not rename checks. Use the exact rule name from the list.

ELIGIBLE CHECKS:
${hardStopCheckList}

For included checks, apply HARD STOP STATUS RULES above exactly. In brief:
- status "fail"   = condition IS present in submission (explicitly, vaguely, or by implication)
                    but does not satisfy the requirement with documentation → CONDITION flag
- status "review" = check is relevant to this account but the condition is entirely absent from the submission → VERIFY flag
- status "pass"   = condition explicitly confirmed absent with named professional documentation

Only include checks with status "review" or "fail" in guideline_checks. Omit passing checks entirely.
Keep "submitted" to 20 words or fewer — state the key fact only, no explanation.

DECISION RULES — follow exactly, no judgment, in strict priority order:
1. If ANY guideline_check has status "fail" → decision MUST be "DECLINE". A single fail overrides all review checks.
2. If NO checks have status "fail" but ANY has status "review" → decision MUST be "REFER"
3. If guideline_checks is empty (all relevant checks passed) → decision is "PROCEED"

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
