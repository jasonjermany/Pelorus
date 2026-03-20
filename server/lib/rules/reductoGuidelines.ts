import type { Rule } from '~/types/models'
import { generateRulesFromGuidelineChunks } from '../ai/anthropic'
import {
  isSupportedReductoFilename,
  runReductoParseChunks,
} from '../reducto'

export function isSupportedGuidelineFilename(filename: string): boolean {
  return isSupportedReductoFilename(filename)
}

export async function extractRulesFromGuidelineFileWithReducto(
  fileBuffer: Buffer,
  filename: string,
): Promise<Rule[]> {
  if (!isSupportedGuidelineFilename(filename)) {
    throw new Error(`Unsupported guideline file type: ${filename}`)
  }

  const chunks = await runReductoParseChunks({
    fileBuffer,
    filename,
  })

  if (!chunks.length) {
    throw new Error(`No parseable content returned for ${filename}`)
  }

  return generateRulesFromGuidelineChunks(chunks)
}
