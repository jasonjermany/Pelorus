import { supabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params!

  const { data: submission, error } = await supabase
    .from('submissions')
    .select('id, org_id, status, source, broker_email, created_at, extracted_fields')
    .eq('id', id)
    .single()

  if (error || !submission) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
  }

  const { data: evaluation } = await supabase
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
