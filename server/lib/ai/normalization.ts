import type { ExtractedFact, Operator, Rule, RuleCondition } from '~/types/models'
import type { RawFact, RawRule, RawRuleCondition } from './schemas'

export function toSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function isOperator(value: unknown): value is Operator {
  return value === '<' || value === '<=' || value === '>' || value === '>=' || value === '=' || value === 'in'
}

export function normalizeOperator(value: unknown): Operator | null {
  if (isOperator(value)) return value
  if (value === '==') return '='
  if (value === 'eq') return '='
  if (value === 'equals') return '='
  return null
}

export function isNonAtomicStringValue(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (!v) return true
  return /required_if|if\s+|then|<=|>=|!=|==|<|>|decline|custom/.test(v)
}

export function formatRuleValue(value: string | number | boolean): string {
  if (typeof value === 'string') return `'${value}'`
  return String(value)
}

export function formatRuleValues(values: string[]): string {
  return `[${values.map((v) => `'${v}'`).join(', ')}]`
}

// Claude outputs all values as strings when constrained by json_schema output_config.
// These helpers coerce them back to the correct primitive types.
function coerceValue(value: string | number | boolean): string | number | boolean {
  if (typeof value !== 'string') return value
  if (value === 'true') return true
  if (value === 'false') return false
  const trimmed = value.trim()
  // Don't coerce strings with leading zeros — they are codes (ZIP, FEIN, policy numbers)
  if (trimmed.startsWith('0') && trimmed.length > 1) return value
  const n = Number(value)
  if (!Number.isNaN(n) && trimmed !== '') return n
  return value
}

function coerceNullableValue(value: string | number | boolean | null): string | number | boolean | null {
  if (value === null) return null
  if (typeof value === 'string' && (value === 'null' || value === '')) return null
  return coerceValue(value)
}

function normalizeCondition(raw: RawRuleCondition): RuleCondition | null {
  const field = toSnakeCase(raw.field)
  const operator = normalizeOperator(raw.operator) ?? raw.operator
  if (!field) return null
  if (operator === 'in') {
    const values = (raw.values ?? []).map((v) => String(v).trim()).filter(Boolean)
    return { field, operator, value: '', values }
  }
  const value = coerceValue(raw.value ?? '')
  return { field, operator, value }
}

export function normalizeRule(raw: RawRule, index: number): Rule {
  const field = toSnakeCase(raw.field)
  const operator = normalizeOperator(raw.operator) ?? raw.operator

  if (!field) throw new Error(`Invalid rule at index ${index}: missing "field".`)

  const conditions: RuleCondition[] = (raw.conditions ?? [])
    .map(normalizeCondition)
    .filter((c): c is RuleCondition => c !== null)

  if (operator === 'in') {
    const values = (raw.values ?? []).map((v) => String(v).trim()).filter(Boolean)
    if (!values.length) throw new Error(`Invalid rule at index ${index}: "in" operator requires "values" array.`)
    return {
      id: raw.id?.trim() || `rule_${index + 1}`,
      sourceText: raw.sourceText?.trim() || 'Rule extracted by Claude',
      field,
      operator,
      value: '',
      values,
      normalizedExpression: `${field} in ${formatRuleValues(values)}`,
      conditions: conditions.length ? conditions : undefined,
    }
  }

  if (typeof raw.value === 'string' && isNonAtomicStringValue(raw.value ?? '')) {
    throw new Error(`Invalid rule at index ${index}: non-atomic string value "${raw.value}".`)
  }

  const value = coerceValue(raw.value ?? '')

  return {
    id: raw.id?.trim() || `rule_${index + 1}`,
    sourceText: raw.sourceText?.trim() || 'Rule extracted by Claude',
    field,
    operator,
    value,
    normalizedExpression: `${field} ${operator} ${formatRuleValue(value)}`,
    conditions: conditions.length ? conditions : undefined,
  }
}

export function normalizeFact(raw: RawFact, index: number): ExtractedFact {
  const field = toSnakeCase(raw.field)
  if (!field) throw new Error(`Invalid fact at index ${index}: missing "field".`)

  return {
    field,
    value: coerceNullableValue(raw.value),
    confidence: raw.confidence,
    sourceSnippet: raw.sourceSnippet || undefined,
  }
}

export function dedupeRules(rules: Rule[]): Rule[] {
  const seen = new Set<string>()
  const deduped: Rule[] = []

  for (const rule of rules) {
    const conditionKey = (rule.conditions ?? [])
      .map((c) => {
        const vPart = c.operator === 'in' ? (c.values ?? []).map((v) => v.toLowerCase()).sort().join(',') : String(c.value).toLowerCase()
        return `${c.field}:${c.operator}:${vPart}`
      })
      .sort()
      .join('|')
    const valuePart = rule.operator === 'in'
      ? (rule.values ?? []).map((v) => v.toLowerCase()).sort().join(',')
      : String(rule.value).trim().toLowerCase()
    const key = `${rule.field}::${rule.operator}::${valuePart}::${conditionKey}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(rule)
  }

  return deduped.map((rule, index) => ({
    ...rule,
    id: `rule_${String(index + 1).padStart(4, '0')}`,
  }))
}
