export function buildHardStopsPrompt(allChunksText: string): string {
  return `Read these underwriting guidelines. Extract every HARD STOP: conditions that cause automatic DECLINE with no exceptions, no referral path, no binding authority override.

A referral trigger is NOT a hard stop. A "submit to CUM" requirement is NOT a hard stop.
A prohibited class is a hard stop. A physical condition that voids eligibility is a hard stop.

Return ONLY a JSON array, no other text, no markdown, no backticks:
[
  {
    "rule_name": "<short label, 5 words max, noun phrase>",
    "condition": "<exactly what triggers this decline — specific, not paraphrased>",
    "section":   "<section, appendix, or page reference as it appears in the document>",
    "line":      "<property | gl | auto | wc | im | umbrella | all>"
  }
]

EXTRACTION DISCIPLINE:
  Include every automatic decline. Miss nothing. The list is used to check every submission against every hard stop — an omission here means a missed hard stop later.

  Do NOT include:
    Referral triggers that have an approval path
    Conditional rules ("...unless CUM approves")
    Appetite preferences ("preferred not to write")
    Rating surcharges or coverage exclusions that don't cause a decline
    Administrative requirements (inspections, warranties)

  DO include:
    Prohibited construction types (frame over TIV threshold, EIFS, EFIS)
    Prohibited electrical systems (knob-and-tube, aluminum branch, fused panel)
    Prohibited plumbing materials (polybutylene, lead pipe)
    Prohibited occupancy classes (adult entertainment, marijuana, explosives)
    Catastrophe zone absolute limits (no new business in Tier 1 wind zones)
    Flood zone hard stops (Zone AE without NFIP, Zone V)
    TIV hard stops (single location or total exceeding absolute ceiling)
    Experience mod hard stops (EMR above threshold with no path to approval)
    Loss ratio hard stops (adverse development exceeding threshold)
    FMCSA safety rating hard stops (conditional or unsatisfactory)
    Vacancy percentage hard stops
    Roof age absolute limits (over X years with no replacement plan)

GUIDELINES:
${allChunksText}`
}
