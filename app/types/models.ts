export type Operator = '<' | '<=' | '>' | '>=' | '='

export interface Rule {
  id: string
  sourceText: string
  field: string
  operator: Operator
  value: number | boolean | string
  normalizedExpression: string
}

export interface ExtractedFact {
  field: string
  value: number | boolean | string | null
  confidence: number // 0-1
  sourceSnippet?: string
}

export interface EvaluationResult {
  ruleId: string
  normalizedExpression: string
  actualValue: number | boolean | string | null
  status: 'PASS' | 'FAIL' | 'UNKNOWN'
  isHardDecline: boolean
  requiresManualReview: boolean
  reason: string
}
