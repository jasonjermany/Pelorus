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

export async function parseFileToChunks(fileBuffer: Buffer, filename: string): Promise<ReductoChunk[]> {
  const t0 = Date.now()
  const uploadFile = await toFile(fileBuffer, filename)
  const upload = await reducto.upload({ file: uploadFile })
  console.log(`[reducto] upload "${filename}" (${(fileBuffer.length / 1024).toFixed(1)} KB) → ${Date.now() - t0}ms`)

  const t1 = Date.now()
  const parseResponse = await reducto.pipeline.run({
    input: upload.file_id,
    pipeline_id: 'k97515keq0d8ysbq4bz3edryas83c0an',
  })
  console.log(`[reducto] parse "${filename}" → ${Date.now() - t1}ms`)

  console.log(`[reducto] full response:`, JSON.stringify(parseResponse, null, 2).slice(0, 3000))
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

export function filterChunks(chunks: ReductoChunk[]): ReductoChunk[] {
  return chunks.filter((chunk) => {
    if (!chunk.embed || chunk.embed.length < 80) return false
    const allSkippable = chunk.blocks.every((b) => SKIP_TYPES.has(b.type))
    return !allSkippable
  })
}

export function getChunkPage(chunk: ReductoChunk): number | null {
  return chunk.blocks[0]?.bbox?.page ?? null
}

export function getChunkBlockTypes(chunk: ReductoChunk): string[] {
  return [...new Set(chunk.blocks.map((b) => b.type))]
}
