import { getSupabase } from '../../utils/supabase'
import { getSessionUser } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)

  let query = getSupabase()
    .from('submissions')
    .select(`
      id,
      org_id,
      status,
      source,
      broker_email,
      created_at,
      evaluations (
        decision,
        composite_score,
        verdict
      )
    `)
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false })

  if (user.role === 'underwriter') {
    query = query.eq('user_id', user.id)
  } else {
    const filterUserId = getQuery(event).userId as string | undefined
    if (filterUserId) query = query.eq('user_id', filterUserId)
  }

  const { data, error } = await query

  if (error) {
    console.error(`[submissions] fetch failed  org=${user.org_id}  error=${error.message}`)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch submissions', data: { message: error.message } })
  }

const submissions = (data ?? []).map((sub: any) => {
    const evaluation = sub.evaluations?.[0]
    const verdict = evaluation?.verdict
    return {
      id: sub.id,
      status: sub.status,
      source: sub.source,
      broker_email: sub.broker_email,
      created_at: sub.created_at,
      decision: evaluation?.decision ?? null,
      composite_score: evaluation?.composite_score ?? null,
      named_insured: verdict?.risk_profile?.risk_summary?.named_insured ?? null,
      broker: verdict?.risk_profile?.risk_summary?.broker ?? null,
      prior_carrier: verdict?.risk_profile?.risk_summary?.prior_carrier ?? null,
    }
  })

  return { submissions }
})
