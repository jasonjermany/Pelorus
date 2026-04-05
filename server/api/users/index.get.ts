import { getSupabase } from '../../utils/supabase'
import { getSessionUser } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, role')
    .eq('org_id', user.org_id)
    .order('email', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch users', data: { message: error.message } })
  }

  return { users: data ?? [] }
})
