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
  raw_text?: string
  context?: string
}

export type SourceCitation = {
  source_doc?: string
  source_location?: string
  raw_text?: string
  context?: string
}

export type Flag = {
  title: string
  type: string
  explanation: string
  action_required: string
  cited_section: string
} & SourceCitation

export type MissingInfoItem = {
  label: string
  description: string
  priority?: string
} & SourceCitation

export type RpReportField = {
  label: string
  value: string
  status: 'ok' | 'warn' | 'fail' | 'na' | 'unconfirmed'
  note?: string
  source?: {
    source_doc?: string
    source_location?: string
    raw_text?: string
    context?: string
  }
}

export type RpSection = {
  title: string
  fields: RpReportField[]
}

export type RpLocation = {
  id?: string
  address?: string
  tiv?: string
  sections: RpSection[]
}

export type RpLine = {
  line_type: string
  label?: string
  locations?: RpLocation[]
  sections?: RpSection[]
}

export type RiskReport = {
  risk_summary?: { named_insured?: string; broker?: string; prior_carrier?: string }
  lines: RpLine[]
}

export type Verdict = {
  decision: 'PROCEED' | 'REFER' | 'DECLINE'
  composite_score: number
  dimension_scores: Record<string, number>
  recommendation: { summary: string; action_items: string[] }
  flags: Flag[]
  favorable_factors: string[]
  guideline_checks: GuidelineCheck[]
  insights: Record<string, string>
  missing_info: MissingInfoItem[]
  risk_profile?: RiskReport
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
