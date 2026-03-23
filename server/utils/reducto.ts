import Reducto, { toFile } from 'reductoai'

export type ReductoChunk = {
  content: string
  embed: string
  blocks: Array<{
    type: string
    bbox?: { page?: number }
  }>
}

const reducto = new Reducto({ apiKey: process.env.REDUCTO_API_KEY })

const PIPELINE_GUIDELINES = 'k97515keq0d8ysbq4bz3edryas83c0an'
export const PIPELINE_SUBMISSIONS = 'k974b6rdszkw7yxyf9e3jpp27h83dx2f'

export async function parseFileToChunks(fileBuffer: Buffer, filename: string, pipelineId = PIPELINE_GUIDELINES): Promise<ReductoChunk[]> {
  const t0 = Date.now()
  const uploadFile = await toFile(fileBuffer, filename)
  const upload = await reducto.upload({ file: uploadFile })
  console.log(`[reducto] upload "${filename}" (${(fileBuffer.length / 1024).toFixed(1)} KB) → ${Date.now() - t0}ms`)

  const t1 = Date.now()
  const parseResponse = await reducto.pipeline.run({
    input: upload.file_id,
    pipeline_id: pipelineId,
  })
  console.log(`[reducto] parse "${filename}" → ${Date.now() - t1}ms`)

  const parseResult = (parseResponse as any).result?.parse?.result
  if (!parseResult) {
    throw new Error(`Reducto pipeline returned no parse result for ${filename}`)
  }

  let chunks: ReductoChunk[]

  if (parseResult.type === 'url') {
    // Large doc — chunks stored at S3 URL
    const res = await fetch(parseResult.url)
    if (!res.ok) throw new Error(`Failed to fetch Reducto result from S3: ${res.status}`)
    const data = await res.json() as any
    console.log(`[reducto] S3 data keys:`, Object.keys(data), `chunks type:`, typeof data.chunks, `isArray:`, Array.isArray(data.chunks), `length:`, data.chunks?.length)
    chunks = data.chunks
  } else if (Array.isArray(parseResult.chunks)) {
    // Direct chunks (pipeline or small doc)
    chunks = parseResult.chunks
  } else {
    throw new Error(`Unexpected Reducto result shape: ${JSON.stringify(parseResult).slice(0, 200)}`)
  }

  console.log(`[reducto] "${filename}" → ${chunks.length} chunks, total ${Date.now() - t0}ms`)
  return chunks
}

const SKIP_TYPES = new Set(['Page Number', 'Footer', 'Header'])
const MEANINGFUL_TYPES = new Set(['Text', 'Table', 'List Item', 'Key Value'])
const RULE_BULLET = /[◆●✔•]/  // bullet chars = real rule content

export function filterChunks(chunks: ReductoChunk[]): ReductoChunk[] {
  return chunks.filter((chunk) => {
    // Must have embed text of substance
    if (!chunk.embed || chunk.embed.length < 80) return false

    // Skip chunks made entirely of non-content block types
    const allSkippable = chunk.blocks.every((b) => SKIP_TYPES.has(b.type))
    if (allSkippable) return false

    // Keep if chunk has any meaningful content block type
    const hasMeaningfulContent = chunk.blocks.some((b) => MEANINGFUL_TYPES.has(b.type))
    if (hasMeaningfulContent) return true

    // Safety net — chunk has only Section Header/Title blocks but contains
    // bullet characters. Reducto sometimes mislabels bullet point content
    // as Section Headers. These contain real rules and must be kept.
    if (RULE_BULLET.test(chunk.embed)) return true

    return false
  })
}

export function getChunkPage(chunk: ReductoChunk): number | null {
  return chunk.blocks[0]?.bbox?.page ?? null
}

export function getChunkBlockTypes(chunk: ReductoChunk): string[] {
  return [...new Set(chunk.blocks.map((b) => b.type))]
}
