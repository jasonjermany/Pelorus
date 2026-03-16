import { getProcessedSubmissionById } from '../../utils/submissionStore'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id') || ''
    const submission = await getProcessedSubmissionById(id)
    if (!submission) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Submission not found',
        data: {
          message: 'Submission not found.',
        },
      })
    }
    return { submission }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in (error as Record<string, unknown>)) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load submission',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error while loading submission',
      },
    })
  }
})
