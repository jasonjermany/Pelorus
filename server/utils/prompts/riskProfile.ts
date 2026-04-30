const fieldSchema = {
  type: 'object' as const,
  properties: {
    label:  { type: 'string', description: 'Field label.' },
    value:  { type: 'string', description: 'Extracted value — 20 words max. No explanation or rationale.' },
    status: { type: 'string', enum: ['ok', 'warn', 'fail', 'unconfirmed', 'na'], description: 'ok=confirmed, no concerns; warn=flagged; fail=hard stop; unconfirmed=referenced but undocumented; na=not applicable.' },
    note:   { type: 'string', description: 'Underwriter note when status is warn/fail/unconfirmed. Omit otherwise.' },
  },
  required: ['label', 'value', 'status'],
}

const sectionSchema = {
  type: 'object' as const,
  properties: {
    title:  { type: 'string', description: 'Section title in ALL CAPS (e.g. CONSTRUCTION / COPE, ELECTRICAL, FIRE PROTECTION).' },
    fields: { type: 'array', items: fieldSchema },
  },
  required: ['title', 'fields'],
}

const locationSchema = {
  type: 'object' as const,
  properties: {
    id:       { type: 'string', description: 'Location identifier e.g. LOC 001.' },
    address:  { type: 'string', description: 'Full street address.' },
    tiv:      { type: 'string', description: 'Total insured value formatted as a dollar amount.' },
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
      named_insured:        { type: 'string', description: 'Full legal name of the insured entity.' },
      broker:               { type: 'string', description: 'Broker or agency name.' },
      submission_date:      { type: 'string', description: 'Submission date as MM/YYYY.' },
      policy_effective_date:{ type: 'string', description: 'Policy effective date as MM/YYYY.' },
      lines: {
        type: 'array',
        description: 'One entry per line of business present in the submission.',
        items: {
          type: 'object' as const,
          properties: {
            line_type: { type: 'string', enum: ['property', 'gl', 'auto', 'wc', 'im_transit', 'im_equipment', 'im_br', 'umbrella'], description: 'Line of business identifier.' },
            label:     { type: 'string', description: 'Human-readable label e.g. "Commercial Property", "General Liability".' },
            locations: { type: 'array', items: locationSchema, description: 'PROPERTY ONLY — one entry per insured location. Omit for all other lines.' },
            sections:  { type: 'array', items: sectionSchema, description: 'NON-PROPERTY lines — sections directly on the line. Omit if locations[] is present.' },
          },
          required: ['line_type', 'label'],
        },
      },
    },
    required: ['named_insured', 'broker', 'lines'],
  },
}

export function buildRiskProfileMessages(submissionText: string, fields: string[]) {
  const fieldHints = fields.length
    ? `\nThe following fields are of particular interest — extract all if present:\n${fields.map(f => `- ${f.replace(/_/g, ' ')}`).join('\n')}`
    : ''

  return [
    {
      role: 'user' as const,
      content: `You are building a structured risk profile from an insurance submission for a commercial underwriter. Extract every material fact needed to evaluate this risk.

STATUS VALUES — assign one per field:
  "ok"          — value confirmed with T1/T2 documentation, no concerns
  "warn"        — value present but flagged (age threshold, gap, missing doc, advisory item, value approaching a guideline limit)
  "fail"        — hard stop condition confirmed (prohibited material, binding condition unmet, hard stop threshold breached)
  "unconfirmed" — condition referenced but specific supporting documentation not present in this submission
  "na"          — field not applicable to this account or location

STRUCTURE RULES:
  1. You MUST populate the lines array. Always include at least one line. Infer the line from submission content if not explicitly labeled. Default to "property" for building/location submissions.

  2. PROPERTY: one location object per INSURED LOCATION — not per building. A location is a site address or site identifier, not an individual structure. Multiple buildings at the same address or on the same campus are grouped under a single location object.
     Sections per location: CONSTRUCTION / COPE, ELECTRICAL, PLUMBING, HVAC, ROOF, FIRE PROTECTION, SECURITY, OCCUPANCY, INSURED VALUES, LOSS HISTORY — include a section only if the submission has relevant data.

  2a. LARGE SOV HANDLING — apply when the SOV has more than 6 locations:
      GROUPING RULES: Group by physical site when buildings share an address or are part of the same campus, complex, or contiguous parcel. A 10-unit condo building at one address is ONE location with a buildings_count field, not 10 locations.
      When grouping, extract per-location aggregate values: total_tiv, building_count, year_built_range, roof_age_range, worst_status.

      DISPLAY TIERS by location count:
        1-6 locations:  Full section-by-section extraction per location (standard)
        7-15 locations: Grouped extraction — full COPE per location, condensed sections (no separate ELECTRICAL/PLUMBING/HVAC unless a specific concern exists)
        16+ locations:  Portfolio summary mode — extract key fields per location (address, TIV, year built, construction class, roof age, worst status), then provide a PORTFOLIO SUMMARY section with aggregate statistics. Only expand individual locations where a concern exists.

      PORTFOLIO SUMMARY SECTION (required when 16+ locations):
        portfolio_summary: { location_count, building_count, total_tiv, tiv_by_location, largest_single_location_tiv, largest_single_location_pct, construction_class_breakdown, roof_age_profile, flood_zone_breakdown, protection_class_breakdown, locations_with_concerns, locations_requiring_attention }

      CONCENTRATION ANALYSIS: Flag when any single location exceeds 25% of total TIV. Surface as an INFO flag if it exceeds 40%.

  3. GL: sections directly on the line (no locations): OPERATIONS, CLASSIFICATIONS, LIMITS, LOSS HISTORY, CONTROLS
  4. COMMERCIAL AUTO: sections on the line: FLEET, DRIVERS, OPERATIONS, CARGO, COMPLIANCE, LOSS HISTORY
  5. WORKERS COMP: sections on the line: CLASSIFICATIONS, PAYROLL, EXPERIENCE MOD, LOSS HISTORY, SAFETY PROGRAM, OPEN CLAIMS
  6. INLAND MARINE: sections on the line: TRANSIT or EQUIPMENT FLOATER or BUILDERS RISK as appropriate
  7. UMBRELLA: sections on the line: UNDERLYING SCHEDULE, LIMITS, STRUCTURE, LOSS HISTORY, OPEN RESERVES
  8. Do NOT include source citations on fields. Source document, location, tier, and raw text are all fetched separately on demand when the underwriter opens a field. Keep fields lean: label, value, status, note only.
  9. Assign status honestly. Flag age issues, gaps, missing docs, and hard stops. Do not default everything to "ok". If you are uncertain, use "unconfirmed".
  10. Be thorough but proportionate. Extract all material facts. Keep field values to 20 words or fewer. Include notes only when status is warn, fail, or unconfirmed.
  11. THE FIELD LIBRARY IS A FLOOR, NOT A CEILING. Extract any additional variable a senior CPCU-level underwriter would notice, even if not listed.
  12. COMPLIANT REGULATED ITEMS — DO NOT FLAG AS CONCERNS. When a submission documents that a potentially hazardous item is present AND confirms regulatory compliance, the item is FAVORABLE, not a concern. Extract it as a field with status "ok" and note the compliance confirmation. Examples: nitrous oxide in a licensed dental office (NFPA 99), PERC dry cleaning with current state permit, compressed gas in medical occupancy confirmed secured per regulations, sprinkler systems confirmed certified, electrical systems updated to code with permits. Flagging a compliant item as a concern creates noise, not signal.${fieldHints}

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
  "source_doc":      "document filename from the === DOCUMENT: name === header, or null",
  "source_location": "page, section, row, or cell reference within the document, or null",
  "raw_text":        "verbatim text excerpt copied exactly from the document, or null",
  "context":         "1 short sentence of surrounding context for the underwriter, or null"
}

If no specific passage can be traced in the submission, set all fields to null.`,
        },
      ],
    },
  ]
}
