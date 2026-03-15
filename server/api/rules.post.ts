import { generateRulesFromGuidelines } from '../lib/ai'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ guidelineText: string }>(event)
  const guidelineText = body?.guidelineText ?? ''

  try {
    const rules = await generateRulesFromGuidelines(guidelineText)
    return { rules }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate rules',
      data: {
        message: error instanceof Error ? error.message : 'Unknown AI error while generating rules',
      },
    })
  }
})
