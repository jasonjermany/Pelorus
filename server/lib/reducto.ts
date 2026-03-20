import { extname } from 'node:path'
import Reducto, { toFile } from 'reductoai'

export const SUPPORTED_REDUCTO_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.xls', '.txt'])

const reducto = new Reducto({
  apiKey: process.env.REDUCTO_API_KEY,
})

type RunReductoParseOptions = {
  fileBuffer: Buffer
  filename: string
}

export function isSupportedReductoFilename(filename: string): boolean {
  return SUPPORTED_REDUCTO_EXTENSIONS.has(extname(filename).toLowerCase())
}

export function hasReductoApiKey(): boolean {
  return Boolean(process.env.REDUCTO_API_KEY)
}

export async function runReductoParseChunks(options: RunReductoParseOptions): Promise<string[]> {
  const { fileBuffer, filename } = options

  const t0 = Date.now()
  const uploadFile = await toFile(fileBuffer, filename)
  const upload = await reducto.upload({ file: uploadFile })
  console.log(`[reducto] upload "${filename}" (${(fileBuffer.length / 1024).toFixed(1)} KB) → ${Date.now() - t0}ms`)

  const t1 = Date.now()
  const parseResponse = await reducto.parse.run({ input: upload.file_id })
  console.log(`[reducto] parse "${filename}" → ${Date.now() - t1}ms`)

  if (!('result' in parseResponse)) {
    throw new Error(`Reducto returned asynchronous parse response for ${filename}.`)
  }

  const result = parseResponse.result

  if (result.type !== 'full') {
    throw new Error(`Expected full parse result but got URL result for ${filename}.`)
  }

  const chunks = result.chunks
    .map((chunk: any) => (typeof chunk.content === 'string' ? chunk.content.trim() : ''))
    .filter(Boolean)

  console.log(`[reducto] "${filename}" → ${chunks.length} chunks, total time ${Date.now() - t0}ms`)
  return chunks
}
