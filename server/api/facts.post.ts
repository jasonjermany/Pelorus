import type { Rule } from '~/types/models'
import { extractFactsFromSubmission } from '../lib/ai'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ submissionText: string; rules: Rule[] }>(event)
  const submissionText = body?.submissionText ?? ''
  const rules = Array.isArray(body?.rules) ? body.rules : []

  try {
    const extraction = await extractFactsFromSubmission(submissionText, rules)
    return extraction
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to extract facts',
      data: {
        message: error instanceof Error ? error.message : 'Unknown AI error while extracting facts',
      },
    })
  }
})
