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
  const filePart = parts.find((p) => p.filename && p.data)

  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file', data: { message: 'Upload a PDF guidelines file.' } })
  }

  const filename = filePart.filename!

  // 1. Parse with Reducto
  const rawChunks = await parseFileToChunks(Buffer.from(filePart.data), filename)
  console.log(`[guidelines/upload] rawChunks: ${rawChunks.length}, first embed length: ${rawChunks[0]?.embed?.length ?? 'undefined'}`)
  const chunks = filterChunks(rawChunks)
  console.log(`[guidelines/upload] after filter: ${chunks.length} chunks`)

  if (!chunks.length) {
    throw createError({ statusCode: 422, statusMessage: 'No usable content extracted from file' })
  }

  // 2. Extract hard stops via Claude — filter to relevant chunks only to stay within context
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
  console.log(`[guidelines/upload] hard stop candidate chunks: ${hardStopChunks.length}`)
  const hardStops = await extractHardStops(hardStopText)
  console.log(`[guidelines/upload] ${hardStops.length} hard stops extracted`)

  // 3. Embed each chunk and build insert rows (parallel)
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

  // 4. Insert hard stop chunks as synthetic pinned rows (parallel)
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

  const rows = [...chunkRows, ...hardStopRows]

  // 5. Bulk insert into Supabase
  const { error } = await supabase.from('guideline_chunks').insert(rows)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store chunks', data: { message: error.message } })
  }

  return {
    chunks_stored: chunks.length,
    hard_stops_stored: hardStops.length,
    total_rows: rows.length,
  }
})
