import { supabase } from '../../utils/supabase'
import { embed } from '../../utils/embeddings'
import { extractHardStops } from '../../utils/claude'
import { parseFileToChunks, filterChunks, getChunkPage, getChunkBlockTypes } from '../../utils/reducto'
import { getOrgId } from '../../utils/org'

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing form data' })
  }

  const orgId = await getOrgId(event)

  // Clear existing guidelines for this org before processing new ones
  const { error: deleteError } = await supabase
    .from('guideline_chunks')
    .delete()
    .eq('org_id', orgId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear existing guidelines',
      data: { message: deleteError.message },
    })
  }

  console.log('[guidelines] cleared existing chunks for org')

  const filePart = parts.find((p) => p.filename && p.data)

  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file', data: { message: 'Upload a PDF guidelines file.' } })
  }

  const filename = filePart.filename!
  const t0 = Date.now()

  // 1. Parse with Reducto
  const rawChunks = await parseFileToChunks(Buffer.from(filePart.data), filename)
  console.log(`[guidelines] reducto parse: ${Date.now() - t0}ms → ${rawChunks.length} raw chunks`)
  const chunks = filterChunks(rawChunks)
  console.log(`[guidelines] after filter: ${chunks.length} chunks`)

  if (!chunks.length) {
    throw createError({ statusCode: 422, statusMessage: 'No usable content extracted from file' })
  }

  // 2. Extract hard stops via Claude
  const hardStopChunks = chunks.filter((chunk) => {
    const text = chunk.embed.toLowerCase()
    return (
      text.includes('decline') ||
      text.includes('hard stop') ||
      text.includes('prohibited') ||
      text.includes('ineligible') ||
      text.includes('appendix a') ||
      text.includes('absolute') ||
      text.includes('no exceptions')
    )
  })
  const hardStopText = (hardStopChunks.length ? hardStopChunks : chunks)
    .map((c) => c.embed)
    .join('\n\n---\n\n')
    .slice(0, 40000)
  console.log(`[guidelines] hard stop candidates: ${hardStopChunks.length} chunks`)
  const t1 = Date.now()
  const hardStops = await extractHardStops(hardStopText)
  console.log(`[guidelines] hard stop extraction: ${Date.now() - t1}ms → ${hardStops.length} stops`)

  // 3. Embed chunks (parallel)
  const t2 = Date.now()
  const chunkRows = await Promise.all(
    chunks.map(async (chunk, i) => {
      const vector = await embed(chunk.embed)
      return {
        org_id: orgId,
        chunk_index: i,
        content: chunk.content,
        embed_text: chunk.embed,
        embedding: vector,
        page: getChunkPage(chunk),
        block_types: getChunkBlockTypes(chunk),
        is_pinned: false,
        rule_type: 'standard',
      }
    })
  )
  console.log(`[guidelines] embed ${chunks.length} chunks: ${Date.now() - t2}ms`)

  // 4. Embed hard stop rows (parallel)
  const t3 = Date.now()
  const hardStopRows = await Promise.all(
    hardStops.map(async (hs, i) => {
      const text = `${hs.rule_name}: ${hs.condition} (${hs.section})`
      const vector = await embed(text)
      return {
        org_id: orgId,
        chunk_index: chunks.length + i,
        content: text,
        embed_text: text,
        embedding: vector,
        page: null,
        block_types: ['hard_stop'],
        is_pinned: true,
        rule_type: 'hard_stop',
      }
    })
  )
  console.log(`[guidelines] embed ${hardStops.length} hard stops: ${Date.now() - t3}ms`)

  const rows = [...chunkRows, ...hardStopRows]

  // 5. Bulk insert into Supabase
  const t4 = Date.now()
  const { error } = await supabase.from('guideline_chunks').insert(rows)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store chunks', data: { message: error.message } })
  }
  console.log(`[guidelines] db insert ${rows.length} rows: ${Date.now() - t4}ms`)
  console.log(`[guidelines] total: ${Date.now() - t0}ms`)

  return {
    chunks_stored: chunks.length,
    hard_stops_stored: hardStops.length,
    total_rows: rows.length,
  }
})
