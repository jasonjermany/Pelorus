import { getSupabase } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  const { data: authData, error: authError } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    console.error(`[auth] login failed  email=${email}  error=${authError?.message ?? 'no user returned'}`)
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id, org_id, role, email')
    .eq('email', email)
    .single()

  if (userError || !userRecord) {
    console.error(`[auth] user record not found  email=${email}  error=${userError?.message ?? 'null record'}`)
    throw createError({ statusCode: 401, statusMessage: 'User not found' })
  }

  await setUserSession(event, {
    user: {
      id: userRecord.id,
      email: userRecord.email,
      org_id: userRecord.org_id,
      role: userRecord.role,
    },
  })

  return { ok: true, role: userRecord.role }
})
