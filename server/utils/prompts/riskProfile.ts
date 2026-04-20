export function buildRiskProfilePrompt(submissionText: string, fields: string[]): string {
  const schemaLines = fields
    .map(
      (f) =>
        `  "${f}": {\n    "value": "<extracted value or 'Not disclosed'>",\n    "source_doc": "<document name from the === DOCUMENT: name === header, or 'Not disclosed'>",\n    "source_location": "<page number, section, row, or cell reference within that document, or 'Not disclosed'>",\n    "raw_text": "<verbatim text excerpt from the document that contains this value — copy it exactly>",\n    "context": "<1-2 sentences of surrounding text giving the underwriter context for this value>"\n  }`,
    )
    .join(',\n')

  return `You are extracting structured data from an insurance submission for an underwriter who needs to verify every value.

Extract the following fields. If a value is not explicitly stated, write "Not disclosed" — do not infer or guess.
One value per field. No explanations, credentials, or license numbers in values.
For name fields (broker, agent, insured): company or person name only — omit titles, designations (CPCU, CIC), license numbers, addresses.
Example: "Brendan Shea, CPCU, New England Commercial Insurance, License #NH-IA-031882" → "New England Commercial Insurance".

For EACH field you must also provide:
- source_doc: the document filename from the === DOCUMENT: filename === header where you found this value
- source_location: the specific page, section, table name, row label, or cell reference within that document
- raw_text: copy the exact verbatim text excerpt that contains this value — do not paraphrase or summarize
- context: 1-2 sentences of surrounding text so the underwriter understands what they're looking at

SUBMISSION:
${submissionText}

Return ONLY valid JSON with exactly these fields, no markdown, no backticks:
{
${schemaLines}
}`
}
