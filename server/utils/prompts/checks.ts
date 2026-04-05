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
            rule: { type: 'string', description: 'Exact rule name from the mandatory check list.' },
            required: { type: 'string', description: 'What the guideline requires.' },
            submitted: { type: 'string', description: 'What the submission says.' },
            status: { type: 'string', enum: ['review', 'fail'] },
            cited_section: { type: 'string', description: 'Section or page reference.' },
          },
          required: ['rule', 'required', 'submitted', 'status', 'cited_section'],
        },
      },
    },
    required: ['decision', 'guideline_checks'],
  },
}

export function buildChecksMessages(
  submissionText: string,
  hardStopsText: string,
  guidelinesText: string,
  hardStopCheckList: string,
  pinnedCount: number,
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

You MUST evaluate ALL of the following checks. These are derived from this carrier's actual guidelines.
Do not add checks. Do not remove checks. Do not rename checks. Evaluate every single one.

MANDATORY CHECKS — evaluate all ${pinnedCount} of these:
${hardStopCheckList}

For each check:
- status "pass" = clearly not present in submission
- status "review" = unclear or cannot confirm from submission
- status "fail" = confirmed present → triggers DECLINE or referral

Only include checks with status "review" or "fail" in guideline_checks.
Do NOT include passing checks — omit them entirely.

DECISION RULES — follow exactly, no judgment:
- If ANY guideline_check has status "fail" → decision MUST be "DECLINE"
- If ANY guideline_check has status "review" → decision MUST be "REFER"
- If ALL checks pass (guideline_checks is empty) → decision is "PROCEED"

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
