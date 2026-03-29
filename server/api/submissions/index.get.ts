import { supabase } from '../../utils/supabase'
import { getOrgId } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const orgId = await getOrgId(event)

  const { data, error } = await supabase
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
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
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
      named_insured: verdict?.risk_profile?.named_insured ?? null,
      broker: verdict?.risk_profile?.broker ?? null,
      prior_carrier: verdict?.risk_profile?.prior_carrier ?? null,
    }
  })

  return { submissions }
})
