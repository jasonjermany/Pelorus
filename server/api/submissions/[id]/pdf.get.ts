import { getSupabase } from '../../../utils/supabase'
import { getSessionUser } from '../../../utils/org'
import { generatePdfBuffer } from '../../../utils/pdfBuilder'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  const { id } = event.context.params!

  const { data: submission, error: subError } = await getSupabase()
    .from('submissions')
    .select('id, user_id, created_at')
    .eq('id', id)
    .eq('org_id', user.org_id)
    .single()

  if (subError || !submission) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
  }

  if (user.role === 'underwriter' && (submission as any).user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: evaluation, error: evalError } = await getSupabase()
    .from('evaluations')
    .select('verdict')
    .eq('submission_id', id)
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (evalError || !evaluation?.verdict) {
    throw createError({ statusCode: 404, statusMessage: 'Evaluation not found' })
  }

  const verdict = evaluation.verdict as any
  const namedInsured: string | null = verdict.risk_profile?.risk_summary?.named_insured ?? null
  const submissionDate = new Date(submission.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const buffer = await generatePdfBuffer(verdict, submissionDate, namedInsured)

  const filename = namedInsured
    ? `${namedInsured.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_review.pdf`
    : `submission_${id.slice(0, 8)}_review.pdf`

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Content-Length', buffer.length)

  return buffer
})
