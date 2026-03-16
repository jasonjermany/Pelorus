import type { ProcessedSubmission } from '~/types/models'
import { saveProcessedSubmission } from '../utils/submissionStore'

type CreateSubmissionBody = Omit<ProcessedSubmission, 'id' | 'createdAt'>

function deriveSummary(status: ProcessedSubmission['status'], evaluation: ProcessedSubmission['evaluation']): string {
  const failed = evaluation.filter((item) => item.status === 'FAIL').length
  const unknown = evaluation.filter((item) => item.status === 'UNKNOWN').length
  if (status === 'FAIL') return `${failed} rule(s) failed including hard-decline conditions.`
  if (status === 'REFER') return `${unknown} unknown and ${failed} failed rule(s) requiring review.`
  return 'All evaluated rules passed with no blocking unknowns.'
}

function deriveCompanyName(
  facts: ProcessedSubmission['facts'],
  additionalFacts: ProcessedSubmission['additionalFacts'],
  submissionText: string,
): string {
  const allFacts = [...facts, ...additionalFacts]
  const preferredFields = ['insured_name', 'dba_trade_name', 'business_name', 'entity_name']
  for (const field of preferredFields) {
    const match = allFacts.find((fact) => fact.field === field && typeof fact.value === 'string' && fact.value.trim())
    if (match && typeof match.value === 'string') return match.value.trim()
  }

  const firstLine = submissionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
  if (!firstLine) return 'Unknown Insured'
  return firstLine.slice(0, 80)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Partial<CreateSubmissionBody>>(event)
    const rules = Array.isArray(body.rules) ? body.rules : []
    const facts = Array.isArray(body.facts) ? body.facts : []
    const additionalFacts = Array.isArray(body.additionalFacts) ? body.additionalFacts : []
    const evaluation = Array.isArray(body.evaluation) ? body.evaluation : []
    const status = body.status === 'PASS' || body.status === 'REFER' || body.status === 'FAIL' ? body.status : 'REFER'
    const guidelinesText = typeof body.guidelinesText === 'string' ? body.guidelinesText : ''
    const submissionText = typeof body.submissionText === 'string' ? body.submissionText : ''
    const companyName = typeof body.companyName === 'string' && body.companyName.trim()
      ? body.companyName.trim()
      : deriveCompanyName(facts, additionalFacts, submissionText)
    const summary = typeof body.summary === 'string' && body.summary.trim()
      ? body.summary.trim()
      : deriveSummary(status, evaluation)

    const saved = await saveProcessedSubmission({
      companyName,
      status,
      summary,
      guidelinesText,
      submissionText,
      rules,
      facts,
      additionalFacts,
      evaluation,
    })

    return { submission: saved }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save submission',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error while saving submission',
      },
    })
  }
})
