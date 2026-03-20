import type { Rule } from '~/types/models'
import { getClient, callClaude, getModel } from './claudeClient'
import { normalizeFact } from './normalization'
import { FactExtractionZod, FACTS_JSON_SCHEMA } from './schemas'
import { loadFactCatalog, type FactCatalogItem } from '../../utils/factCatalog'

export type FactExtractionResult = {
  facts: any[]
  additionalFacts: any[]
}

const FACTS_MODEL = getModel()
const FACTS_MAX_TOKENS = 16000

// Collect every unique field name referenced by rules (primary field + all condition fields).
// Returns a map of field → first constraint seen, to give Claude extraction hints.
function extractRuleFields(rules: Rule[]): Map<string, string> {
  const fields = new Map<string, string>()

  for (const rule of rules) {
    if (!fields.has(rule.field)) {
      const hint =
        rule.operator === 'in'
          ? `in [${(rule.values ?? []).slice(0, 8).join(', ')}${(rule.values?.length ?? 0) > 8 ? '…' : ''}]`
          : `${rule.operator} ${rule.value}`
      fields.set(rule.field, hint)
    }
    for (const cond of rule.conditions ?? []) {
      if (!fields.has(cond.field)) {
        const hint =
          cond.operator === 'in'
            ? `in [${(cond.values ?? []).slice(0, 8).join(', ')}${(cond.values?.length ?? 0) > 8 ? '…' : ''}]`
            : `${cond.operator} ${cond.value}`
        fields.set(cond.field, hint)
      }
    }
  }

  return fields
}

// Group catalog keys by category, excluding fields already covered by rules.
function buildCatalogContext(catalog: FactCatalogItem[], requiredFields: Set<string>): string {
  const byCategory = new Map<string, string[]>()
  for (const item of catalog) {
    if (requiredFields.has(item.factKey)) continue
    if (!byCategory.has(item.category)) byCategory.set(item.category, [])
    byCategory.get(item.category)!.push(item.factKey)
  }
  return [...byCategory.entries()].map(([cat, keys]) => `${cat}: ${keys.join(', ')}`).join('\n')
}

function buildFactPrompt(
  submissionText: string,
  ruleFields: Map<string, string>,
  catalogContext: string,
): string {
  const requiredLines = [...ruleFields.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([field, hint]) => `  ${field}  (${hint})`)
    .join('\n')

  return [
    'Extract underwriting facts from the submission below.',
    'Return ONLY a JSON object — no markdown, no prose.',
    '',
    'Schema: { "facts": [...], "additionalFacts": [...] }',
    'Each item: { "field": string, "value": string, "confidence": number 0–1, "sourceSnippet": string }',
    'All values are strings: numbers as "42", booleans as "true"/"false", not found as "null".',
    'sourceSnippet: quote ≤15 words from the submission that support the value. Empty string if not found.',
    '',
    'REQUIRED FIELDS — extract every field listed; value = "null" and confidence = 0 if not found.',
    'Each field shows the rule constraint it will be evaluated against — use it as a hint for the expected format:',
    requiredLines,
    '',
    'ADDITIONAL FACTS — extract ALL other material underwriting facts present in the submission.',
    '  No cap. Include everything an underwriter would consider.',
    '  Cover: property (construction / valuation / systems / protection / perils / loss history),',
    '  GL (operations / revenue / liquor / EPLI / products / subcontractors),',
    '  WC (class codes / EMR / safety / OSHA), commercial auto (fleet / MVR / DOT),',
    '  umbrella (underlying limits), specialty flags (cannabis / aviation / marine / healthcare / fraud indicators),',
    '  submission metadata (prior carrier / reason for change / coverage lapse / financial distress).',
    '  Only include facts with clear supporting evidence — never guess.',
    '',
    'Catalog keys — prefer these names for additionalFacts fields:',
    catalogContext || '(empty catalog)',
    '',
    'Submission:',
    submissionText,
  ].join('\n')
}

export async function extractFactsWithClaude(
  submissionText: string,
  rules: Rule[],
): Promise<FactExtractionResult> {
  const ruleFields = extractRuleFields(rules)
  console.log(
    `[facts] extracting facts — ${ruleFields.size} required fields from ${rules.length} rules, submission length=${submissionText.length} model=${FACTS_MODEL}`,
  )

  const client = getClient()
  const catalog = await loadFactCatalog()
  const requiredFieldSet = new Set(ruleFields.keys())
  const catalogContext = buildCatalogContext(catalog, requiredFieldSet)

  const prompt = buildFactPrompt(submissionText, ruleFields, catalogContext)

  let parsed
  try {
    parsed = await callClaude(
      client,
      FACTS_MODEL,
      FACTS_MAX_TOKENS,
      [{ role: 'user', content: prompt }],
      FACTS_JSON_SCHEMA as unknown as Record<string, unknown>,
      FactExtractionZod,
    )
  } catch (err) {
    console.error('[facts] callClaude failed:', err instanceof Error ? err.message : err)
    throw err
  }

  const facts = parsed.facts.map((item, idx) => {
    try {
      return normalizeFact(item, idx)
    } catch (err) {
      console.error(`[facts] normalizeFact failed for facts[${idx}]:`, JSON.stringify(item), err instanceof Error ? err.message : err)
      throw err
    }
  })

  // Normalize first, then deduplicate against facts to avoid redundant entries
  const factFieldSet = new Set(facts.map((f) => f.field))
  const additionalFacts = parsed.additionalFacts
    .map((item, idx) => {
      try {
        return normalizeFact(item, idx)
      } catch (err) {
        console.error(`[facts] normalizeFact failed for additionalFacts[${idx}]:`, JSON.stringify(item), err instanceof Error ? err.message : err)
        throw err
      }
    })
    .filter((fact) => !factFieldSet.has(fact.field))

  console.log(`[facts] done: ${facts.length} facts, ${additionalFacts.length} additionalFacts`)
  return { facts, additionalFacts }
}
