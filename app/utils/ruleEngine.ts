import type { Rule, ExtractedFact, EvaluationResult } from '~/types/models'

function compareValues(operator: string, expected: number | boolean | string, actual: number | boolean | string | null) {
  if (actual === null) return false

  if (typeof expected === 'boolean') {
    if (typeof actual !== 'boolean') return false
    return operator === '=' ? actual === expected : false
  }

  const actualNumber = typeof actual === 'number' ? actual : Number(actual)
  const expectedNumber = typeof expected === 'number' ? expected : Number(expected)

  if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) return false

  switch (operator) {
    case '<':
      return actualNumber < expectedNumber
    case '<=':
      return actualNumber <= expectedNumber
    case '>':
      return actualNumber > expectedNumber
    case '>=':
      return actualNumber >= expectedNumber
    case '=':
      return actualNumber === expectedNumber
    default:
      return false
  }
}

export function evaluateRules(rules: Rule[], facts: ExtractedFact[]): EvaluationResult[] {
  const results: EvaluationResult[] = []

  for (const rule of rules) {
    const fact = facts.find((f) => f.field === rule.field)
    const actualValue = fact?.value ?? null

    const passed = compareValues(rule.operator, rule.value, actualValue)
    const reason = passed
      ? 'Meets rule'
      : actualValue === null
      ? 'Missing fact'
      : `Expected ${rule.operator} ${rule.value}`

    results.push({
      ruleId: rule.id,
      normalizedExpression: rule.normalizedExpression,
      actualValue,
      passed,
      reason,
    })
  }

  return results
}
