import { getSupabase } from '../../utils/supabase'
import { embed } from '../../utils/embeddings'
import { extractHardStops, extractRiskProfileFields } from '../../utils/claude'
import { parseFileToChunks, filterChunks, getChunkPage, getChunkBlockTypes } from '../../utils/reducto'
import { getOrgId, requireAdmin } from '../../utils/org'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

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

  const filePart = parts.find((p) => p.filename && p.data)

  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file', data: { message: 'Upload a PDF guidelines file.' } })
  }

  const filename = filePart.filename!

  // 1. Parse with Reducto
  const rawChunks = await parseFileToChunks(Buffer.from(filePart.data), filename)
  const chunks = filterChunks(rawChunks)

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
  const [hardStops, riskProfileFields] = await Promise.all([
    extractHardStops(hardStopText),
    extractRiskProfileFields(chunks.map((c) => c.embed).join('\n\n---\n\n')),
  ])

  await getSupabase().from('organizations').update({ risk_profile_fields: riskProfileFields }).eq('id', orgId)

  // 3. Embed chunks (parallel)
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

  // 4. Embed hard stop rows (parallel)
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
  const { error } = await getSupabase().from('guideline_chunks').insert(rows)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store chunks', data: { message: error.message } })
  }

  return {
    chunks_stored: chunks.length,
    hard_stops_stored: hardStops.length,
    total_rows: rows.length,
  }
})
