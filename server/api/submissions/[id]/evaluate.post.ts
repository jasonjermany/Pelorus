import { supabase } from '../../../utils/supabase'
import { evaluateSubmission } from '../../../utils/claude'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params!

  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !submission) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
  }

  if (!submission.org_id) {
    throw createError({ statusCode: 400, statusMessage: 'Submission has no org_id' })
  }

  await supabase.from('submissions').update({ status: 'processing' }).eq('id', id)

  try {
    const claudeStart = Date.now()
    const verdict = await evaluateSubmission(submission)
    const analyzedInSeconds = ((Date.now() - claudeStart) / 1000).toFixed(1)
    const storedVerdict = { ...verdict, analyzed_in_seconds: analyzedInSeconds }

    await supabase.from('evaluations').insert({
      org_id: submission.org_id,
      submission_id: id,
      decision: verdict.decision,
      composite_score: verdict.composite_score,
      verdict: storedVerdict,
    })

    await supabase.from('submissions').update({ status: 'complete' }).eq('id', id)

    return storedVerdict
  } catch (err) {
    await supabase.from('submissions').update({ status: 'error' }).eq('id', id)
    console.error('[evaluate] failed:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Evaluation failed',
      data: { message: err instanceof Error ? err.message : 'Unknown error' },
    })
  }
})
