const fieldSchema = {
  type: 'object' as const,
  properties: {
    label:  { type: 'string', description: 'Field label.' },
    value:  { type: 'string', description: 'Key fact only — 15 words max. No explanation or rationale.' },
    status: { type: 'string', enum: ['ok', 'warn', 'fail', 'unconfirmed', 'na'], description: 'ok=confirmed no concerns; warn=flagged concern; fail=hard stop present; unconfirmed=referenced but undocumented; na=not applicable.' },
    note:   { type: 'string', description: 'Optional underwriter note. Omit if none.' },
  },
  required: ['label', 'value', 'status'],
}

const sectionSchema = {
  type: 'object' as const,
  properties: {
    title:  { type: 'string', description: 'Section title in ALL CAPS (e.g. CONSTRUCTION / COPE, ELECTRICAL, FIRE PROTECTION, LIMITS, LOSSES).' },
    fields: { type: 'array', items: fieldSchema },
  },
  required: ['title', 'fields'],
}

const locationSchema = {
  type: 'object' as const,
  properties: {
    id:       { type: 'string', description: 'Location identifier e.g. LOC 001.' },
    address:  { type: 'string', description: 'Full street address, or null if not provided.' },
    tiv:      { type: 'string', description: 'Total insured value formatted as a dollar amount, or null.' },
    sections: { type: 'array', items: sectionSchema },
  },
  required: ['sections'],
}

export const RISK_PROFILE_TOOL = {
  name: 'submit_risk_profile',
  description: 'Submit the structured risk profile extracted from the insurance submission.',
  input_schema: {
    type: 'object' as const,
    properties: {
      risk_summary: {
        type: 'object' as const,
        properties: {
          named_insured: { type: 'string', description: 'Full legal name of the insured entity, or null.' },
          broker:        { type: 'string', description: 'Broker or agency name, or null.' },
          prior_carrier: { type: 'string', description: 'Prior or incumbent carrier name, or null.' },
        },
        required: ['named_insured', 'broker', 'prior_carrier'],
      },
      lines: {
        type: 'array',
        description: 'One entry per line of business present in the submission.',
        items: {
          type: 'object' as const,
          properties: {
            line_type: { type: 'string', description: 'Short identifier for the line of business e.g. "property", "gl", "auto", "wc", "im", "umbrella", "cyber", "epli", etc.' },
            label:     { type: 'string', description: 'Human-readable label e.g. "Commercial Property", "General Liability", "Cyber Liability".' },
            locations: { type: 'array', items: locationSchema, description: 'PROPERTY ONLY — one entry per insured location. Omit for all other lines.' },
            sections:  { type: 'array', items: sectionSchema, description: 'NON-PROPERTY lines — sections directly on the line. Omit if locations[] is present.' },
          },
          required: ['line_type', 'label'],
        },
      },
    },
    required: ['risk_summary', 'lines'],
  },
}

export function buildRiskProfileMessages(submissionText: string, fields: string[]) {
  const fieldHints = fields.length
    ? `\nThe following fields are of particular interest — extract all if present:\n${fields.map(f => `- ${f.replace(/_/g, ' ')}`).join('\n')}`
    : ''

  return [
    {
      role: 'user' as const,
      content: `You are building a structured risk profile from an insurance submission for a commercial underwriter.

STATUS RULES — assign one per field:
- "ok"          — value confirmed with documentation, no concerns
- "warn"        — value present but flagged (age, gaps, missing docs, advisory items)
- "fail"        — hard stop condition confirmed (prohibited material, binding condition unmet, zone AE without flood coverage, etc.)
- "unconfirmed" — condition referenced but specific supporting documentation not in this submission
- "na"          — field not applicable to this account

INSTRUCTIONS:
1. You MUST populate the lines array. Always include at least one line. If the submission doesn't label a line explicitly, infer it from the content — default to "property" for building/location submissions.
2. PROPERTY: one location per insured location. Sections: CONSTRUCTION / COPE, ELECTRICAL, PLUMBING, HVAC, ROOF, FIRE PROTECTION, SECURITY, OCCUPANCY, INSURED VALUES, LOSS HISTORY — include a section only if the submission has relevant data.
3. GL / AUTO / WC / IM / UMBRELLA: sections directly on the line (OPERATIONS, CLASSIFICATIONS, LIMITS, DRIVERS, FLEET, LOSSES, etc.) — no locations.
4. Assign status honestly — flag age issues, gaps, missing docs, and hard stops. Do not default everything to "ok".
5. Be thorough but concise — extract all material facts an underwriter needs. Keep field values to 15 words or fewer. Omit notes when status is ok or na.${fieldHints}

## SUBMISSION
${submissionText}

Call the submit_risk_profile tool with your results.`,
    },
  ]
}

export function buildSourceFetchMessages(submissionText: string, field: { label: string; value: string }) {
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
          text: `Locate the source passage in the submission above for the following extracted field.

Field: ${field.label}
Value: ${field.value}

Return ONLY a JSON object, no markdown, no backticks:
{
  "source_doc": "document filename from the === DOCUMENT: name === header, or null",
  "source_location": "page, section, row, or cell reference within the document, or null",
  "raw_text": "verbatim text excerpt copied exactly from the document, or null",
  "context": "1 short sentence of surrounding context for the underwriter, or null"
}

If no specific passage can be traced in the submission, set all fields to null.`,
        },
      ],
    },
  ]
}
