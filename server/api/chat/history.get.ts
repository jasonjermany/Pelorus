import { getSupabase } from '../../utils/supabase'
import { getSessionUser } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  const query = getQuery(event)
  const submissionId = query.submissionId as string

  if (!submissionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing submissionId.' })
  }

  const supabase = getSupabase()

  // Verify submission belongs to user's org
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, org_id, user_id')
    .eq('id', submissionId)
    .single()

  if (!submission || submission.org_id !== user.org_id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden.' })
  }

  if (user.role === 'underwriter' && submission.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden.' })
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('submission_id', submissionId)
    .eq('flagged', false)
    .order('created_at', { ascending: true })

  return { messages: messages ?? [] }
})
