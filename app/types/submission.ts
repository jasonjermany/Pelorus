export type RpAmendment = {
  amendedValue: string
  originalValue: string
  amendedAt: string
}

export type SourceTier = 'T1' | 'T2' | 'T3' | 'T4' | 'NOT_CONFIRMED'

// ── Prompt 7: Risk Profile ─────────────────────────────────────────────────

export type RpReportField = {
  label: string
  value: string
  status: 'ok' | 'warn' | 'fail' | 'na' | 'unconfirmed'
  note?: string
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
  line_type: 'property' | 'gl' | 'auto' | 'wc' | 'im_transit' | 'im_equipment' | 'im_br' | 'umbrella' | string
  label?: string
  locations?: RpLocation[]
  sections?: RpSection[]
}

export type RiskReport = {
  named_insured?: string
  broker?: string
  submission_date?: string
  policy_effective_date?: string
  lines: RpLine[]
}

// ── Prompt 8: Guideline Checks ─────────────────────────────────────────────

export type GuidelineCheck = {
  rule_name: string
  status: 'fail' | 'review'
  requirement: string
  submitted_value: string
  section: string
  source_doc: string
  source_tier: SourceTier
  // enriched by Prompt 9
  raw_text?: string | null
  context?: string | null
  doc_name?: string | null
  page_ref?: string | null
}

export type HardStopTriggered = {
  rule_name: string
  condition_confirmed: string
  guideline_section: string
  source_doc: string
  source_tier: SourceTier
}

export type VerdictCode = 'DECLINE' | 'SOFT_DECLINE' | 'REFER' | 'REQUEST_INFO' | 'PROCEED'

// ── Prompt 10: Flags, Scores, Recommendation ───────────────────────────────

export type FlagType = 'HARD_STOP' | 'CONDITION' | 'VERIFY' | 'INFO'
export type FlagSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type Flag = {
  title: string
  type: FlagType
  severity: FlagSeverity
  priority_rank: number
  explanation: string
  action_required: string
  cited_section: string
  source_doc?: string
  source_tier?: SourceTier
}

export type FavorableFactor = {
  factor: string
  detail: string
  source_doc?: string
  source_tier?: SourceTier
}

export type PriorityAction = {
  priority: number
  action: string
  why: string
  deadline: string
  owner: string
}

export type RiskSummary = {
  one_liner: string
  uw_file_note: string
  risk_tier: 'PREFERRED' | 'STANDARD' | 'SUBSTANDARD' | 'INELIGIBLE'
  risk_tier_reason: string
  binding_authority: 'FIELD' | 'REFER_CUM' | 'REFER_SENIOR' | 'DECLINE'
}

export type DimensionScores = {
  construction: number
  fire_protection: number
  occupancy: number
  loss_history: number
  management: number
  cat_exposure: number
  submission_quality: number
}

// ── Prompt 11: Insights ────────────────────────────────────────────────────

export type InsightType = 'PATTERN_RECOGNITION' | 'MARKET_CONTEXT' | 'CONSISTENCY_CHECK' | 'COVERAGE_GAP'

export type Insight = {
  type: InsightType
  label: string
  finding: string
  source_docs: string[]
  source_tier: SourceTier
}

export type MissingInfoItem = {
  label: string
  description: string
  why_it_matters?: string
  how_to_obtain?: string
  priority: 'BINDING' | 'PRE_BIND' | 'RECOMMENDED'
  source_tier_needed?: 'T1' | 'T2'
}

// ── Main Verdict ───────────────────────────────────────────────────────────

export type Verdict = {
  // Prompt 8 outputs
  verdict_code: VerdictCode
  verdict_label?: string
  verdict_reason?: string
  action_recommendation?: string
  hard_stops_triggered?: HardStopTriggered[]
  guideline_checks: GuidelineCheck[]

  // Prompt 10 outputs
  risk_summary?: RiskSummary
  analysis_summary?: string
  priority_actions?: PriorityAction[]
  recommendation: { summary: string; action_items: string[] }
  flags: Flag[]
  favorable_factors: FavorableFactor[]
  dimension_scores: DimensionScores
  composite_score: number
  score_label?: string

  // Prompt 11 outputs
  insights: Insight[]
  missing_information: MissingInfoItem[]

  // Prompt 7 output
  risk_profile?: RiskReport

  // Metadata
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
