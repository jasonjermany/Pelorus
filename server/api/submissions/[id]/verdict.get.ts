import { supabase } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params!

  const { data, error } = await supabase
    .from('evaluations')
    .select('id, decision, composite_score, verdict, created_at')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Verdict not found for this submission' })
  }

  return { evaluation: data }
})
