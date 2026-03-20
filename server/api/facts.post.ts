import type { Rule } from '~/types/models'
import { extractFactsFromSubmission } from '../lib/ai'
import { hasReductoApiKey, isSupportedReductoFilename, runReductoParseChunks } from '../lib/reducto'

export default defineEventHandler(async (event) => {
  const contentType = getRequestHeader(event, 'content-type') || ''
  const isMultipart = contentType.toLowerCase().includes('multipart/form-data')

  if (isMultipart) {
    if (!hasReductoApiKey()) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing REDUCTO_API_KEY',
        data: { message: 'Server is missing REDUCTO_API_KEY.' },
      })
    }

    const parts = await readMultipartFormData(event)
    const fileParts = (parts || []).filter((p) => p.filename && p.data)
    const rulesPart = (parts || []).find((p) => p.name === 'rules' && !p.filename)

    if (!fileParts.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing file',
        data: { message: 'Please upload at least one submission file.' },
      })
    }

    for (const part of fileParts) {
      if (!part.filename || !isSupportedReductoFilename(part.filename)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported file type',
          data: { message: 'Unsupported submission file type. Please upload PDF, DOCX, XLSX, XLS, or TXT.' },
        })
      }
    }

    let rules: Rule[] = []
    if (rulesPart?.data) {
      try {
        const parsed = JSON.parse(rulesPart.data.toString('utf8'))
        rules = Array.isArray(parsed) ? parsed : []
      } catch {
        rules = []
      }
    }

    const allChunks: string[] = []
    for (const part of fileParts) {
      const chunks = await runReductoParseChunks({
        fileBuffer: Buffer.from(part.data),
        filename: part.filename!,
      })
      allChunks.push(...chunks)
    }

    const submissionText = allChunks.join('\n\n')

    try {
      const extraction = await extractFactsFromSubmission(submissionText, rules)
      return { ...extraction, submissionText }
    } catch (error) {
      console.error('Error in facts.post.ts (multipart):', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to extract facts',
        data: { message: error instanceof Error ? error.message : 'Unknown AI error while extracting facts' },
      })
    }
  }

  // JSON body path
  const body = await readBody<{ submissionText: string; rules: Rule[] }>(event)
  const submissionText = body?.submissionText ?? ''
  const rules = Array.isArray(body?.rules) ? body.rules : []

  try {
    const extraction = await extractFactsFromSubmission(submissionText, rules)
    return extraction
  } catch (error) {
    console.error('Error in facts.post.ts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to extract facts',
      data: {
        message: error instanceof Error ? error.message : 'Unknown AI error while extracting facts',
      },
    })
  }
})
