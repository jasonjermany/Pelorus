import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedFact, Operator, Rule } from '~/types/models'
import { getFactKeys, loadFactCatalog } from '../../utils/factCatalog'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const RULES_MAX_TOKENS = 4000
const FACTS_MAX_TOKENS = 1600

type ClaudeJsonArray = unknown[]
type ClaudeJsonObject = Record<string, unknown>

export type FactExtractionResult = {
  facts: ExtractedFact[]
  additionalFacts: ExtractedFact[]
}

function isOperator(value: unknown): value is Operator {
  return value === '<' || value === '<=' || value === '>' || value === '>=' || value === '='
}

function normalizeOperator(value: unknown): Operator | null {
  if (isOperator(value)) return value
  if (value === '==') return '='
  if (value === 'eq') return '='
  if (value === 'equals') return '='
  return null
}

function isPrimitiveValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function isNonAtomicStringValue(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (!v) return true
  return /required_if|if\s+|then| and | or |<=|>=|!=|==|<|>|decline|custom/.test(v)
}

function formatRuleValue(value: string | number | boolean): string {
  if (typeof value === 'string') return `'${value}'`
  return String(value)
}

function toTextContent(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((item) => item.type === 'text')
    .map((item) => item.text || '')
    .join('\n')
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  return text.trim()
}

function parseJsonArray(text: string): ClaudeJsonArray {
  const cleaned = stripCodeFences(text)
  console.info('[parseJsonArray] raw input:')
  console.info(text)
  console.info('[parseJsonArray] cleaned input:')
  console.info(cleaned)
  const tryArrayFromObject = (value: unknown): ClaudeJsonArray | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const obj = value as Record<string, unknown>
    const candidates = ['rules', 'items', 'data', 'results']
    for (const key of candidates) {
      if (Array.isArray(obj[key])) return obj[key] as ClaudeJsonArray
    }
    return null
  }

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      console.info('[parseJsonArray] parsed as top-level array')
      return parsed
    }
    const wrapped = tryArrayFromObject(parsed)
    if (wrapped) {
      console.info('[parseJsonArray] parsed as wrapped array object')
      return wrapped
    }
  } catch {
    console.info('[parseJsonArray] top-level JSON.parse failed; attempting salvage')
  }

  const objStart = cleaned.indexOf('{')
  const objEnd = cleaned.lastIndexOf('}')
  if (objStart >= 0 && objEnd > objStart) {
    try {
      const objectCandidate = cleaned.slice(objStart, objEnd + 1)
      const parsedObject = JSON.parse(objectCandidate)
      const wrapped = tryArrayFromObject(parsedObject)
      if (wrapped) {
        console.info('[parseJsonArray] salvaged wrapped array from object slice')
        return wrapped
      }
    } catch {
      console.info('[parseJsonArray] object-slice salvage failed')
    }
  }

  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start >= 0 && end > start) {
    const candidate = cleaned.slice(start, end + 1)
    const parsed = JSON.parse(candidate)
    if (Array.isArray(parsed)) {
      console.info('[parseJsonArray] salvaged top-level array from bracket slice')
      return parsed
    }
  }

  console.info('[parseJsonArray] unable to parse any JSON array path')
  throw new Error('Claude response was not a valid JSON array.')
}

function parseJsonObject(text: string): ClaudeJsonObject {
  const cleaned = stripCodeFences(text)

  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as ClaudeJsonObject
  } catch {
    // Try to salvage JSON object from noisy output.
  }

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const candidate = cleaned.slice(start, end + 1)
    const parsed = JSON.parse(candidate)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as ClaudeJsonObject
  }

  throw new Error('Claude response was not a valid JSON object.')
}

function validateRules(raw: ClaudeJsonArray): Rule[] {
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid rule at index ${index}: expected object.`)
    }

    const candidate = item as Record<string, unknown>
    const field = typeof candidate.field === 'string' ? candidate.field.trim() : ''
    const operator = normalizeOperator(candidate.operator)
    const value = candidate.value
    const sourceText = typeof candidate.sourceText === 'string' ? candidate.sourceText.trim() : ''
    if (!field) throw new Error(`Invalid rule at index ${index}: missing "field".`)
    if (!operator) {
      throw new Error(`Invalid rule at index ${index}: invalid "operator" (${String(candidate.operator)}). Allowed: <, <=, >, >=, =`)
    }
    if (!isPrimitiveValue(value)) throw new Error(`Invalid rule at index ${index}: invalid "value".`)
    if (typeof value === 'string' && isNonAtomicStringValue(value)) {
      throw new Error(`Invalid rule at index ${index}: non-atomic string value "${value}".`)
    }

    const normalizedExpression = `${field} ${operator} ${formatRuleValue(value)}`

    return {
      id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : `rule_${index + 1}`,
      sourceText: sourceText || 'Rule extracted by Claude',
      field,
      operator,
      value,
      normalizedExpression,
    }
  })
}

function tryValidateRules(raw: ClaudeJsonArray): Rule[] | null {
  try {
    return validateRules(raw)
  } catch {
    return null
  }
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function validateFacts(raw: ClaudeJsonArray): ExtractedFact[] {
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid fact at index ${index}: expected object.`)
    }

    const candidate = item as Record<string, unknown>
    const field = typeof candidate.field === 'string' ? candidate.field.trim() : ''
    const value = candidate.value
    const sourceSnippet = typeof candidate.sourceSnippet === 'string' ? candidate.sourceSnippet : undefined

    if (!field) throw new Error(`Invalid fact at index ${index}: missing "field".`)
    if (!(value === null || isPrimitiveValue(value))) {
      throw new Error(`Invalid fact at index ${index}: invalid "value".`)
    }

    return {
      field,
      value,
      confidence: clampConfidence(candidate.confidence),
      sourceSnippet,
    }
  })
}

function getClient() {
  const config = useRuntimeConfig()
  const apiKey = config.anthropicApiKey as string | undefined
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured.')
  return new Anthropic({ apiKey })
}

function getModel() {
  const config = useRuntimeConfig()
  const model = config.anthropicModel as string | undefined
  return model || DEFAULT_MODEL
}

function countGuidelineLines(guidelineText: string): number {
  return guidelineText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length
}

function logClaudeRequest(requestType: 'rules' | 'facts', model: string, prompt: string) {
  // Intentional debug logging for prompt visibility during MVP development.
  // This logs the exact text payload sent to Claude.
  console.info(`[Claude Request][${requestType}] model=${model}\n${prompt}`)
}

function logClaudeResponse(requestType: 'rules' | 'facts', rawText: string, parsed: unknown) {
  // Intentional debug logging for output visibility during MVP development.
  console.info(`[Claude Response][${requestType}] raw\n${rawText}`)
  console.info(`[Claude Response][${requestType}] parsed\n${JSON.stringify(parsed, null, 2)}`)
}

export async function generateRulesWithClaude(guidelineText: string): Promise<Rule[]> {
  const client = getClient()
  const model = getModel()
  const catalog = await loadFactCatalog()
  const factKeys = getFactKeys(catalog)
  const factCatalogContext = factKeys.length ? factKeys.join('\n') : '(empty catalog)'
  const guidelineLineCount = countGuidelineLines(guidelineText)

  const prompt = [
    'Convert underwriting guidelines into structured JSON rules.',
    'Return ONLY a JSON array. No markdown. No prose.',
    'Schema for each item:',
    '{ "id": string, "sourceText": string, "field": string, "operator": "<|<=|>|>=|=", "value": string|number|boolean, "normalizedExpression": string }',
    'Do NOT return question lists, questionnaires, or keys like fact_key/question/why_needed/answer_type/options.',
    'Operator must be exactly one of: <, <=, >, >=, =',
    'Never use: ==, !=, in, custom, preferred, requires, decline_if.',
    'Rules must be atomic: one field, one operator, one literal value.',
    'Do NOT encode conditional logic in value or normalizedExpression (no IF/THEN, no required_if_*, no AND/OR).',
    'If a guideline is compound, split it into multiple atomic rules.',
    'Requirements:',
    '- Extract only actual underwriting rules present in the text.',
    '- Normalize field to snake_case.',
    '- Infer operator from language.',
    '- Preserve original source text for each rule in sourceText.',
    '- Create one rule for every explicit constraint line in the guideline text.',
    '- Never omit an explicit constraint line.',
    '- When possible, map extracted rule fields to one of the known fact keys provided in the fact catalog.',
    '- If no catalog key matches, you MUST create a new normalized snake_case field.',
    '- Do not invent rules.',
    '- Do not include any keys outside schema.',
    '',
    'Fact Catalog Keys:',
    factCatalogContext,
    '',
    'Guidelines text:',
    guidelineText,
  ].join('\n')

  logClaudeRequest('rules', model, prompt)

  const response = await client.messages.create({
    model,
    max_tokens: RULES_MAX_TOKENS,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  console.info(
    `[Claude Response Meta][rules] stop_reason=${String(response.stop_reason)} input_tokens=${response.usage?.input_tokens ?? 'n/a'} output_tokens=${response.usage?.output_tokens ?? 'n/a'}`,
  )

  const text = toTextContent(response.content)
  const parsed = parseJsonArray(text)
  logClaudeResponse('rules', text, parsed)
  const validated = tryValidateRules(parsed)

  if (validated && validated.length >= guidelineLineCount) {
    return validated
  }

  const repairPrompt = [
    'Your previous output did not match the required Rule schema.',
    'Return ONLY a JSON array of Rule objects with keys: id, sourceText, field, operator, value, normalizedExpression.',
    'Do NOT return fact-questionnaire format (fact_key/question/why_needed/answer_type/options).',
    'Operator must be exactly one of: <, <=, >, >=, =',
    'Never use: ==, !=, in, custom, preferred, requires, decline_if.',
    'Rules must be atomic: one field, one operator, one literal value.',
    'Do NOT encode conditional logic in value or normalizedExpression (no IF/THEN, no required_if_*, no AND/OR).',
    'If a guideline is compound, split it into multiple atomic rules.',
    `Guideline line count: ${guidelineLineCount}.`,
    `Returned valid rule count: ${validated?.length ?? 0}.`,
    'Regenerate and include one rule per explicit constraint line when applicable.',
    'If no catalog key matches, create a new normalized snake_case field.',
    'Return ONLY a JSON array matching the exact schema.',
    '',
    'Original guideline text:',
    guidelineText,
    '',
    'Fact Catalog Keys:',
    factCatalogContext,
  ].join('\n')

  logClaudeRequest('rules', model, repairPrompt)

  const repairResponse = await client.messages.create({
    model,
    max_tokens: RULES_MAX_TOKENS,
    temperature: 0,
    messages: [{ role: 'user', content: repairPrompt }],
  })
  console.info(
    `[Claude Response Meta][rules-repair] stop_reason=${String(repairResponse.stop_reason)} input_tokens=${repairResponse.usage?.input_tokens ?? 'n/a'} output_tokens=${repairResponse.usage?.output_tokens ?? 'n/a'}`,
  )

  const repairText = toTextContent(repairResponse.content)
  const repairParsed = parseJsonArray(repairText)
  logClaudeResponse('rules', repairText, repairParsed)
  return validateRules(repairParsed)
}

export async function extractFactsWithClaude(submissionText: string, rules: Rule[]): Promise<FactExtractionResult> {
  const client = getClient()
  const model = getModel()
  const catalog = await loadFactCatalog()
  const factKeys = getFactKeys(catalog)
  const factCatalogContext = factKeys.length ? factKeys.join('\n') : '(empty catalog)'

  const prompt = [
    'Extract facts from submission text for underwriting evaluation.',
    'Return ONLY a JSON object. No markdown. No prose.',
    'Output schema:',
    '{',
    '  "facts": [ { "field": string, "value": string|number|boolean|null, "confidence": number, "sourceSnippet": string } ],',
    '  "additionalFacts": [ { "field": string, "value": string|number|boolean|null, "confidence": number, "sourceSnippet": string } ]',
    '}',
    'Requirements for "facts":',
    '- Extract fields required by the provided rules.',
    '- Use the rule fields as target schema, but prefer known catalog keys when there is a close semantic match.',
    '- If no catalog key matches, you may create a new normalized snake_case field.',
    '- If evidence is missing, set value to null and confidence to 0.',
    '- Include short sourceSnippet when possible.',
    '',
    'Requirements for "additionalFacts":',
    '- Include important underwriting-relevant facts not already represented in "facts".',
    '- Only include facts with strong supporting evidence in submission text.',
    '- Keep this list concise (0-8 items).',
    '- Use normalized snake_case field names.',
    '',
    'Global rules:',
    '- Do not guess unsupported facts.',
    '- Do not include keys outside schema.',
    '',
    'Rules JSON:',
    JSON.stringify(rules),
    '',
    'Fact Catalog Keys:',
    factCatalogContext,
    '',
    'Submission text:',
    submissionText,
  ].join('\n')

  logClaudeRequest('facts', model, prompt)

  const response = await client.messages.create({
    model,
    max_tokens: FACTS_MAX_TOKENS,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  console.info(
    `[Claude Response Meta][facts] stop_reason=${String(response.stop_reason)} input_tokens=${response.usage?.input_tokens ?? 'n/a'} output_tokens=${response.usage?.output_tokens ?? 'n/a'}`,
  )

  const text = toTextContent(response.content)
  const parsed = parseJsonObject(text)
  logClaudeResponse('facts', text, parsed)

  const rawFacts = Array.isArray(parsed.facts) ? parsed.facts : []
  const rawAdditionalFacts = Array.isArray(parsed.additionalFacts) ? parsed.additionalFacts : []

  return {
    facts: validateFacts(rawFacts),
    additionalFacts: validateFacts(rawAdditionalFacts),
  }
}
