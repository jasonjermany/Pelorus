import { supabase } from '../../utils/supabase'
import { getOrgId } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const orgId = await getOrgId(event)

  const { data, error } = await supabase
    .from('submissions')
    .select('id, org_id, status, source, broker_email, created_at, extracted_fields')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch submissions', data: { message: error.message } })
  }

  return { submissions: data ?? [] }
})
