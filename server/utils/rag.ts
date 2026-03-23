import { supabase } from './supabase'
import { embed } from './embeddings'

export async function getRelevantChunks(orgId: string, submissionText: string) {
  // Always fetch pinned hard stops — never left to similarity search
  const { data: pinned, error: pinnedError } = await supabase
    .from('guideline_chunks')
    .select('content, embed_text, page, rule_type')
    .eq('org_id', orgId)
    .eq('is_pinned', true)
    .order('chunk_index', { ascending: true })

  if (pinnedError) {
    console.error('[rag] pinned chunk fetch error:', pinnedError)
  }

  // Embed submission text + similarity search for relevant chunks
  const vector = await embed(submissionText)
  const { data: similar, error: similarError } = await supabase.rpc('match_chunks', {
    query_embedding: vector,
    org_id: orgId,
    match_count: 6,
  })

  if (similarError) {
    console.error('[rag] similarity search error:', similarError)
  }

  return { pinned: pinned ?? [], similar: similar ?? [] }
}
