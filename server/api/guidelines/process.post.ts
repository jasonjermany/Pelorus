import { supabase } from '../../utils/supabase'
import { embed } from '../../utils/embeddings'
import { extractHardStops } from '../../utils/claude'
import { filterChunks, getChunkPage, getChunkBlockTypes, type ReductoChunk } from '../../utils/reducto'
import { getOrgId } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const orgId = await getOrgId(event)
  const body = await readBody<{ chunks: ReductoChunk[] }>(event)

  if (!Array.isArray(body?.chunks) || !body.chunks.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or empty chunks array' })
  }
  const chunks = filterChunks(body.chunks)

  if (!chunks.length) {
    throw createError({ statusCode: 422, statusMessage: 'No usable content after filtering' })
  }

  const allChunksText = chunks.map((c) => c.content).join('\n\n---\n\n')
  const hardStops = await extractHardStops(allChunksText)

  const rows: any[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const vector = await embed(chunk.embed)
    rows.push({
      org_id: orgId,
      chunk_index: i,
      content: chunk.content,
      embed_text: chunk.embed,
      embedding: vector,
      page: getChunkPage(chunk),
      block_types: getChunkBlockTypes(chunk),
      is_pinned: false,
      rule_type: 'standard',
    })
  }

  for (let i = 0; i < hardStops.length; i++) {
    const hs = hardStops[i]
    const text = `${hs.rule_name}: ${hs.condition} (${hs.section})`
    const vector = await embed(text)
    rows.push({
      org_id: orgId,
      chunk_index: chunks.length + i,
      content: text,
      embed_text: text,
      embedding: vector,
      page: null,
      block_types: ['hard_stop'],
      is_pinned: true,
      rule_type: 'hard_stop',
    })
  }

  const { error } = await supabase.from('guideline_chunks').insert(rows)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store chunks', data: { message: error.message } })
  }

  return { chunks_stored: chunks.length, hard_stops_stored: hardStops.length, total_rows: rows.length }
})
