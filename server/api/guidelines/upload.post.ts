import { getSupabase } from '../../utils/supabase'
import { embed } from '../../utils/embeddings'
import { extractHardStops, extractRiskProfileFields, classifyChunks } from '../../utils/claude'
import { parseFileToChunks, filterChunks, getChunkPage, getChunkBlockTypes } from '../../utils/reducto'
import { getOrgId, requireAdmin } from '../../utils/org'

function t() { return Date.now() }
function lap(label: string, start: number) {
  console.log(`[guidelines] ${label}: ${Date.now() - start}ms`)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing form data' })
  }

  const orgId = await getOrgId(event)
  const total = t()

  // Clear existing guidelines for this org before processing new ones
  const { error: deleteError } = await getSupabase()
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
  let s = t()
  const rawChunks = await parseFileToChunks(Buffer.from(filePart.data), filename)
  const chunks = filterChunks(rawChunks)
  lap(`reducto parse → ${rawChunks.length} raw, ${chunks.length} after filter`, s)

  if (!chunks.length) {
    throw createError({ statusCode: 422, statusMessage: 'No usable content extracted from file' })
  }

  // 2. Extract hard stops + risk profile fields via Claude (parallel)
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

  s = t()
  const [hardStops, riskProfileFields] = await Promise.all([
    extractHardStops(hardStopText),
    extractRiskProfileFields(chunks.map((c) => c.embed).join('\n\n---\n\n')),
  ])
  lap(`claude extractHardStops + extractRiskProfileFields (parallel) → ${hardStops.length} hard stops`, s)

  await (getSupabase() as any).from('organizations').update({ risk_profile_fields: riskProfileFields }).eq('id', orgId)

  // 3. Classify chunks via Claude (single call)
  s = t()
  const classifications = await classifyChunks(chunks)
  const classMap = new Map(classifications.map((c) => [c.index, c]))
  const keptChunks = chunks.filter((_, i) => classMap.get(i)?.keep !== false)
  lap(`claude classifyChunks → kept ${keptChunks.length}/${chunks.length}`, s)

  // 4. Embed chunks (parallel)
  s = t()
  const chunkRows = await Promise.all(
    keptChunks.map(async (chunk, i) => {
      const originalIndex = chunks.indexOf(chunk)
      const cls = classMap.get(originalIndex)
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
        summary: cls?.summary ?? null,
      }
    })
  )
  lap(`embed ${keptChunks.length} chunks (parallel)`, s)

  // 5. Embed hard stop rows (parallel)
  s = t()
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
      }
    })
  )
  lap(`embed ${hardStops.length} hard stop rows (parallel)`, s)

  const rows = [...chunkRows, ...hardStopRows]

  // 6. Bulk insert into Supabase
  s = t()
  const { error } = await getSupabase().from('guideline_chunks').insert(rows as any)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to store chunks', data: { message: error.message } })
  }
  lap(`supabase bulk insert ${rows.length} rows`, s)

  lap(`TOTAL`, total)

  return {
    chunks_stored: keptChunks.length,
    hard_stops_stored: hardStops.length,
    total_rows: rows.length,
  }
})
