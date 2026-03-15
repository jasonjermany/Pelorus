import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedFact, Operator, Rule } from '~/types/models'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

type ClaudeJsonArray = unknown[]

function isOperator(value: unknown): value is Operator {
  return value === '<' || value === '<=' || value === '>' || value === '>=' || value === '='
}

function isPrimitiveValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
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

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Try to salvage JSON array from noisy output.
  }

  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start >= 0 && end > start) {
    const candidate = cleaned.slice(start, end + 1)
    const parsed = JSON.parse(candidate)
    if (Array.isArray(parsed)) return parsed
  }

  throw new Error('Claude response was not a valid JSON array.')
}

function validateRules(raw: ClaudeJsonArray): Rule[] {
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid rule at index ${index}: expected object.`)
    }

    const candidate = item as Record<string, unknown>
    const field = typeof candidate.field === 'string' ? candidate.field.trim() : ''
    const operator = candidate.operator
    const value = candidate.value
    const sourceText = typeof candidate.sourceText === 'string' ? candidate.sourceText.trim() : ''
    const normalizedExpression =
      typeof candidate.normalizedExpression === 'string' && candidate.normalizedExpression.trim().length > 0
        ? candidate.normalizedExpression.trim()
        : `${field} ${String(operator)} ${String(value)}`

    if (!field) throw new Error(`Invalid rule at index ${index}: missing "field".`)
    if (!isOperator(operator)) throw new Error(`Invalid rule at index ${index}: invalid "operator".`)
    if (!isPrimitiveValue(value)) throw new Error(`Invalid rule at index ${index}: invalid "value".`)

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

export async function generateRulesWithClaude(guidelineText: string): Promise<Rule[]> {
  const client = getClient()
  const model = getModel()

  const prompt = [
    'Convert underwriting guidelines into structured JSON rules.',
    'Return ONLY a JSON array. No markdown. No prose.',
    'Schema for each item:',
    '{ "id": string, "sourceText": string, "field": string, "operator": "<|<=|>|>=|=", "value": string|number|boolean, "normalizedExpression": string }',
    'Requirements:',
    '- Extract only actual underwriting rules present in the text.',
    '- Normalize field to snake_case.',
    '- Infer operator from language.',
    '- Preserve original source text for each rule in sourceText.',
    '- Do not invent rules.',
    '- Do not include any keys outside schema.',
    '',
    'Guidelines text:',
    guidelineText,
  ].join('\n')

  const response = await client.messages.create({
    model,
    max_tokens: 1200,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = toTextContent(response.content)
  const parsed = parseJsonArray(text)
  return validateRules(parsed)
}

export async function extractFactsWithClaude(submissionText: string, rules: Rule[]): Promise<ExtractedFact[]> {
  const client = getClient()
  const model = getModel()

  const prompt = [
    'Extract submission facts for the provided underwriting rule fields.',
    'Return ONLY a JSON array. No markdown. No prose.',
    'Schema for each item:',
    '{ "field": string, "value": string|number|boolean|null, "confidence": number, "sourceSnippet": string }',
    'Requirements:',
    '- Extract only fields required by the provided rules.',
    '- Use rule field names exactly as the target schema.',
    '- If evidence is missing, set value to null and confidence to 0.',
    '- Do not guess unsupported facts.',
    '- Include a short sourceSnippet when possible.',
    '- Do not include keys outside schema.',
    '',
    'Rules JSON:',
    JSON.stringify(rules),
    '',
    'Submission text:',
    submissionText,
  ].join('\n')

  const response = await client.messages.create({
    model,
    max_tokens: 1200,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = toTextContent(response.content)
  const parsed = parseJsonArray(text)
  return validateFacts(parsed)
}
