export function buildRiskProfilePrompt(submissionText: string, fields: string[]): string {
  const schemaLines = fields.map((f) => `  "${f}": { "value": "<extracted value or 'Not disclosed'>", "source": "<document name and page or section, or 'Not disclosed'>" }`).join(',\n')
  return `You are extracting structured data from an insurance submission.
Extract the following fields exactly as stated. If not explicitly stated, write "Not disclosed" — do not infer or guess.
One value per field. No explanation, no credentials, no license numbers.
For name fields (broker, agent, insured): company or person name only — omit titles, designations (CPCU, CIC), license numbers, addresses.
Example: "Brendan Shea, CPCU, New England Commercial Insurance, License #NH-IA-031882" → "New England Commercial Insurance".

For each field, also record the source: the document name (from the === DOCUMENT: name === header) and page or section where the value was found.
If the source cannot be determined, write "Not disclosed" for source.

SUBMISSION:
${submissionText}

Return ONLY valid JSON with exactly these fields, no markdown, no backticks:
{
${schemaLines}
}`
}
