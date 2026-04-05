import { getSupabase } from '../../../utils/supabase'
import { getSessionUser } from '../../../utils/org'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params!
  const user = await getSessionUser(event)

  const { data: submission, error } = await getSupabase()
    .from('submissions')
    .select('id, org_id, user_id, status, source, broker_email, created_at, extracted_fields')
    .eq('id', id)
    .eq('org_id', user.org_id)
    .single()

  if (error || !submission) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
  }

  if (user.role === 'underwriter' && (submission as any).user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: evaluation } = await getSupabase()
    .from('evaluations')
    .select('verdict, decision, composite_score')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    ...submission,
    verdict: evaluation?.verdict ?? null,
  }
})
