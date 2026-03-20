import { generateRulesFromGuidelines } from '../lib/ai'
import type { Rule } from '~/types/models'
import {
  extractRulesFromGuidelineFileWithReducto,
  isSupportedGuidelineFilename,
} from '../lib/rules/reductoGuidelines'
import { hasReductoApiKey } from '../lib/reducto'

function getUnsupportedTypeError() {
  return createError({
    statusCode: 400,
    statusMessage: 'Unsupported file type',
    data: {
      message: 'Unsupported guideline file type. Please upload PDF, DOCX, XLSX, XLS, or TXT.',
    },
  })
}

function getMissingFileError() {
  return createError({
    statusCode: 400,
    statusMessage: 'Missing file',
    data: {
      message: 'Please upload at least one guideline file.',
    },
  })
}

function getMissingGuidelineTextError() {
  return createError({
    statusCode: 400,
    statusMessage: 'Missing guideline text',
    data: {
      message: 'Please provide guidelineText or upload guideline files.',
    },
  })
}

function getMissingReductoKeyError() {
  return createError({
    statusCode: 500,
    statusMessage: 'Missing REDUCTO_API_KEY',
    data: {
      message: 'Server is missing REDUCTO_API_KEY.',
    },
  })
}

function renumberRules(rules: Rule[]): Rule[] {
  return rules.map((rule, index) => ({
    ...rule,
    id: `rule_${String(index + 1).padStart(4, '0')}`,
  }))
}

export default defineEventHandler(async (event) => {
  try {
    const contentType = getRequestHeader(event, 'content-type') || ''
    const isMultipart = contentType.toLowerCase().includes('multipart/form-data')

    if (isMultipart) {
      if (!hasReductoApiKey()) throw getMissingReductoKeyError()

      const parts = await readMultipartFormData(event)
      const fileParts = (parts || []).filter((part) => part.filename && part.data)
      if (!fileParts.length) throw getMissingFileError()

      const allRules: Rule[] = []
      for (const part of fileParts) {
        if (!part.filename || !isSupportedGuidelineFilename(part.filename)) {
          throw getUnsupportedTypeError()
        }

        const extracted = await extractRulesFromGuidelineFileWithReducto(
          Buffer.from(part.data),
          part.filename,
        )
        allRules.push(...extracted)
      }

      if (!allRules.length) {
        throw createError({
          statusCode: 422,
          statusMessage: 'No rules extracted',
          data: {
            message: 'No valid rules were extracted from the uploaded guideline files.',
          },
        })
      }

      return {
        rules: renumberRules(allRules),
        provider: 'anthropic',
        filesProcessed: fileParts.length,
      }
    }

    const body = await readBody<{ guidelineText: string }>(event)
    const guidelineText = body?.guidelineText ?? ''
    if (!guidelineText.trim()) throw getMissingGuidelineTextError()

    const rules = await generateRulesFromGuidelines(guidelineText)
    return { rules: renumberRules(rules), provider: 'anthropic' }
  } catch (error) {
    console.error('Error in rules.post.ts:', error)
    if (error && typeof error === 'object' && 'statusCode' in (error as Record<string, unknown>)) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate rules',
      data: {
        message: error instanceof Error ? error.message : 'Unknown AI error while generating rules',
      },
    })
  }
})
