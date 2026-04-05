import { getSupabase } from './supabase'

export async function getGuidelineChunks(orgId: string) {
  const [chunksResult, orgResult] = await Promise.all([
    getSupabase()
      .from('guideline_chunks')
      .select('content, embed_text, page, is_pinned')
      .eq('org_id', orgId)
      .order('chunk_index', { ascending: true }),
    getSupabase()
      .from('organizations')
      .select('risk_profile_fields')
      .eq('id', orgId)
      .single(),
  ])

  if (chunksResult.error) throw new Error(`[rag] chunk fetch error: ${chunksResult.error.message}`)

  const all = (chunksResult.data ?? []) as any[]
  const pinned = all.filter((c) => c.is_pinned)
  const guidelines = all.filter((c) => !c.is_pinned)

  const riskProfileFields: string[] = orgResult?.data?.risk_profile_fields?.length
    ? orgResult.data.risk_profile_fields
    : ['named_insured', 'broker', 'prior_carrier', 'losses_5yr']

  return { pinned, guidelines, riskProfileFields }
}
