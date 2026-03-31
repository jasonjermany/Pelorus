import { getSupabase } from '../../../utils/supabase'
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

  await getSupabase().from('submissions').update({ status: 'processing' }).eq('id', id)

  try {
    const t = Date.now()
    const verdict = await evaluateSubmission(submission, submission.org_id)
    const analyzedInSeconds = ((Date.now() - t) / 1000).toFixed(1)
    const storedVerdict = { ...verdict, analyzed_in_seconds: analyzedInSeconds }

    const { error: evalInsertError } = await getSupabase().from('evaluations').insert({
      org_id: submission.org_id,
      submission_id: id,
      decision: verdict.decision,
      composite_score: verdict.composite_score,
      verdict: storedVerdict,
    })
    if (evalInsertError) throw new Error(`Failed to store evaluation: ${evalInsertError.message}`)

    const { error: completeError } = await getSupabase().from('submissions').update({ status: 'complete' }).eq('id', id)
    if (completeError) throw new Error(`Failed to mark complete: ${completeError.message}`)

    return storedVerdict
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error(`[eval] failed  submission=${id}  error=${msg}`)
    if (stack) console.error(`[eval] stack: ${stack}`)
    await getSupabase().from('submissions').update({ status: 'error' }).eq('id', id)
    throw createError({
      statusCode: 500,
      statusMessage: 'Evaluation failed',
      data: { message: msg },
    })
  }
})
