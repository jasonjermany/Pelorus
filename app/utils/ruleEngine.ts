import type { Rule, ExtractedFact, EvaluationResult } from '~/types/models'

type RuleStatus = EvaluationResult['status']

function normalizeOperator(operator: string): string {
  if (operator === '==') return '='
  return operator
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim()
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseBooleanValue(value: number | boolean | string): boolean | null {
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true' || normalized === 'yes' || normalized === 'y') return true
  if (normalized === 'false' || normalized === 'no' || normalized === 'n') return false
  return null
}

function classifyRuleDeclineStrength(rule: Rule): { isHardDecline: boolean; requiresManualReview: boolean } {
  const haystack = `${rule.sourceText} ${rule.normalizedExpression}`.toLowerCase()

  const isHardDecline =
    /\b(decline|ineligible|prohibit|not\s+allowed|disqualif|must\s+not|no\s+)\b/.test(haystack)
  const requiresManualReview =
    /\b(prefer|preferred|manual\s+review|refer)\b/.test(haystack) ||
    /\ballowed\s+only\s+with\b|\bonly\s+if\b|\bprovided\s+that\b|\bunless\b|\bif\b/.test(haystack)

  return { isHardDecline, requiresManualReview }
}

function compareValues(
  operator: string,
  expected: number | boolean | string,
  actual: number | boolean | string | null,
): { status: RuleStatus; reason: string } {
  if (actual === null || (typeof actual === 'string' && actual.trim().length === 0)) {
    return { status: 'UNKNOWN', reason: 'Missing fact' }
  }

  const normalizedOperator = normalizeOperator(operator)
  const supportedOperators = ['<', '<=', '>', '>=', '=', '!=']
  if (!supportedOperators.includes(normalizedOperator)) {
    return { status: 'UNKNOWN', reason: `Unsupported operator: ${operator}` }
  }

  const normalizedActual = actual

  if (typeof expected === 'boolean') {
    const actualBoolean = parseBooleanValue(normalizedActual)
    if (actualBoolean === null) {
      return { status: 'UNKNOWN', reason: 'Ambiguous boolean fact value' }
    }

    const passed = normalizedOperator === '=' ? actualBoolean === expected : actualBoolean !== expected
    return {
      status: passed ? 'PASS' : 'FAIL',
      reason: passed ? 'Meets rule' : `Expected ${normalizedOperator} ${expected}`,
    }
  }

  const actualNumber = typeof normalizedActual === 'number' ? normalizedActual : Number(normalizedActual)
  const expectedNumber = typeof expected === 'number' ? expected : Number(expected)

  const isNumericComparison = ['<', '<=', '>', '>='].includes(normalizedOperator)

  if (isNumericComparison) {
    if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) {
      return { status: 'UNKNOWN', reason: 'Fact value is not numeric' }
    }
    const passed =
      normalizedOperator === '<'
        ? actualNumber < expectedNumber
        : normalizedOperator === '<='
        ? actualNumber <= expectedNumber
        : normalizedOperator === '>'
        ? actualNumber > expectedNumber
        : actualNumber >= expectedNumber

    return {
      status: passed ? 'PASS' : 'FAIL',
      reason: passed ? 'Meets rule' : `Expected ${normalizedOperator} ${expected}`,
    }
  }

  if (normalizedOperator === '=' || normalizedOperator === '!=') {
    let passed = false

    if (Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) {
      passed = normalizedOperator === '=' ? actualNumber === expectedNumber : actualNumber !== expectedNumber
      return {
        status: passed ? 'PASS' : 'FAIL',
        reason: passed ? 'Meets rule' : `Expected ${normalizedOperator} ${expected}`,
      }
    }

    const actualString = stripWrappingQuotes(String(normalizedActual)).toLowerCase()
    const expectedString = stripWrappingQuotes(String(expected)).toLowerCase()
    passed = normalizedOperator === '=' ? actualString === expectedString : actualString !== expectedString
    return {
      status: passed ? 'PASS' : 'FAIL',
      reason: passed ? 'Meets rule' : `Expected ${normalizedOperator} ${expected}`,
    }
  }

  return { status: 'UNKNOWN', reason: `Unsupported operator: ${operator}` }
}

export function evaluateRules(rules: Rule[], facts: ExtractedFact[]): EvaluationResult[] {
  const results: EvaluationResult[] = []

  for (const rule of rules) {
    const fact = facts.find((f) => f.field === rule.field)
    const actualValue = fact?.value ?? null
    const evaluation = compareValues(rule.operator, rule.value, actualValue)
    const severity = classifyRuleDeclineStrength(rule)
    const status =
      severity.requiresManualReview && evaluation.status === 'FAIL'
        ? 'UNKNOWN'
        : evaluation.status
    const reason =
      severity.requiresManualReview && evaluation.status === 'FAIL'
        ? 'Conditional rule requires manual review.'
        : evaluation.reason

    results.push({
      ruleId: rule.id,
      normalizedExpression: rule.normalizedExpression,
      actualValue,
      status,
      isHardDecline: severity.isHardDecline,
      requiresManualReview: severity.requiresManualReview,
      reason,
    })
  }

  return results
}
