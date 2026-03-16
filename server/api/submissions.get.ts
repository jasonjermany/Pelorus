import { listProcessedSubmissions } from '../utils/submissionStore'

export default defineEventHandler(async () => {
  try {
    const submissions = await listProcessedSubmissions()
    return { submissions }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load submissions',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error while loading submissions',
      },
    })
  }
})
