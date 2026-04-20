export type RpField = string | {
  value: string
  source?: string
  source_doc?: string
  source_location?: string
  raw_text?: string
  context?: string
}

export type RpAmendment = {
  amendedValue: string
  originalValue: string
  amendedAt: string
}

export type GuidelineCheck = {
  rule: string
  required: string
  submitted: string
  submission_source?: string
  status: string
  cited_section: string
}

export type Verdict = {
  decision: 'PROCEED' | 'REFER' | 'DECLINE'
  composite_score: number
  dimension_scores: Record<string, number>
  recommendation: { summary: string; action_items: string[] }
  flags: Array<{ title: string; type: string; explanation: string; action_required: string; cited_section: string }>
  favorable_factors: string[]
  guideline_checks: GuidelineCheck[]
  insights: Record<string, string>
  missing_info: Array<{ label: string; description: string; priority?: string }>
  risk_profile?: Record<string, RpField>
  analyzed_in_seconds?: string
  field_amendments?: Record<string, RpAmendment>
}

export type SubmissionResponse = {
  id: string
  org_id: string
  status: string
  source: string
  broker_email: string | null
  created_at: string
  extracted_fields?: Record<string, any> | null
  verdict: Verdict | null
}
