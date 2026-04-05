import { getSupabase } from '../../utils/supabase'
import { getOrgId } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const orgId = await getOrgId(event)

  const { data, error } = await getSupabase()
    .from('guideline_chunks')
    .select('id, chunk_index, page, block_types, is_pinned, embed_text, summary, created_at')
    .eq('org_id', orgId)
    .order('chunk_index', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch guideline chunks', data: { message: error.message } })
  }

  return { chunks: data ?? [] }
})
