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

  const t0 = Date.now()
  try {
    const t1 = Date.now()
    const verdict = await evaluateSubmission(submission)
    const analyzedInSeconds = ((Date.now() - t1) / 1000).toFixed(1)
    console.log(`[evaluate] claude+rag: ${Date.now() - t1}ms`)
    const storedVerdict = { ...verdict, analyzed_in_seconds: analyzedInSeconds }

    const t2 = Date.now()
    const { error: evalInsertError } = await supabase.from('evaluations').insert({
      org_id: submission.org_id,
      submission_id: id,
      decision: verdict.decision,
      composite_score: verdict.composite_score,
      verdict: storedVerdict,
    })
    if (evalInsertError) throw new Error(`Failed to store evaluation: ${evalInsertError.message}`)
    console.log(`[evaluate] db insert: ${Date.now() - t2}ms`)

    const { error: completeError } = await supabase.from('submissions').update({ status: 'complete' }).eq('id', id)
    if (completeError) throw new Error(`Failed to mark complete: ${completeError.message}`)

    console.log(`[evaluate] total: ${Date.now() - t0}ms → ${verdict.decision} (${verdict.composite_score})`)
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
