import { supabase } from './supabase'
import { embed } from './embeddings'

export async function getRelevantChunks(orgId: string, submissionText: string) {
  // Run pinned fetch, org fetch, and embedding in parallel
  const [pinnedResult, orgResult, vector] = await Promise.all([
    supabase
      .from('guideline_chunks')
      .select('content, embed_text, page, rule_type')
      .eq('org_id', orgId)
      .eq('is_pinned', true)
      .order('chunk_index', { ascending: true }),
    supabase
      .from('organizations')
      .select('risk_profile_fields')
      .eq('id', orgId)
      .single(),
    embed(submissionText),
  ])

  if (pinnedResult.error) throw new Error(`[rag] pinned chunk fetch error: ${pinnedResult.error.message}`)

  const { data: similar, error: similarError } = await supabase.rpc('match_chunks', {
    query_embedding: vector,
    org_id: orgId,
    match_count: 6,
  })

  if (similarError) throw new Error(`[rag] similarity search error: ${similarError.message}`)

  const riskProfileFields: string[] = orgResult?.data?.risk_profile_fields?.length
    ? orgResult.data.risk_profile_fields
    : ['named_insured', 'broker', 'prior_carrier', 'losses_5yr']

  return { pinned: pinnedResult.data ?? [], similar: similar ?? [], riskProfileFields }
}
