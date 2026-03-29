import { supabase } from '../../utils/supabase'
import { parseFileToChunks, PIPELINE_SUBMISSIONS } from '../../utils/reducto'
import { getOrgId } from '../../utils/org'
import { evaluateSubmission } from '../../utils/claude'

export default defineEventHandler(async (event) => {
  const contentType = getRequestHeader(event, 'content-type') || ''
  const isMultipart = contentType.toLowerCase().includes('multipart/form-data')

  const orgId = await getOrgId(event)

  let rawText: string
  let brokerEmail: string | undefined
  let source: 'upload' | 'email' = 'upload'
  const t_total = Date.now()

  if (isMultipart) {
    // File upload path
    const parts = await readMultipartFormData(event)
    if (!parts?.length) {
      throw createError({ statusCode: 400, statusMessage: 'Missing form data' })
    }

    const fileParts = parts.filter((p) => p.filename && p.data)
    const emailPart = parts.find((p) => p.name === 'brokerEmail' && !p.filename)

    if (!fileParts.length) throw createError({ statusCode: 400, statusMessage: 'Missing submission file' })

    brokerEmail = emailPart?.data.toString('utf8').trim()
    source = 'upload'

    const t_reducto = Date.now()
    const texts = await Promise.all(
      fileParts.map(async (filePart) => {
        const chunks = await parseFileToChunks(Buffer.from(filePart.data), filePart.filename!, PIPELINE_SUBMISSIONS)
        return chunks.map((c) => c.embed || c.content).join('\n\n')
      })
    )
    rawText = texts.join('\n\n---\n\n')
    console.log(`[ingest] reducto     ${Date.now() - t_reducto}ms  (${fileParts.length} file${fileParts.length !== 1 ? 's' : ''})`)
  } else {
    // Email webhook / JSON path
    const body = await readBody<{ text: string; brokerEmail?: string }>(event)

    if (!body?.text?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing submission text' })

    rawText = body.text
    brokerEmail = body.brokerEmail
    source = 'email'
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      org_id: orgId,
      raw_text: rawText,
      broker_email: brokerEmail ?? null,
      source,
      status: 'pending',
    })
    .select('id, org_id, status, source, broker_email, created_at')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save submission', data: { message: error.message } })
  }

  const submission = data

  // Fire and forget — return immediately, evaluate in background
  setImmediate(async () => {
    try {
      await supabase.from('submissions').update({ status: 'processing' }).eq('id', submission.id)

      const verdict = await evaluateSubmission({ ...submission, raw_text: rawText }, orgId)
      const analyzedInSeconds = ((Date.now() - t_total) / 1000).toFixed(1)
      const storedVerdict = { ...verdict, analyzed_in_seconds: analyzedInSeconds }

      const { error: evalInsertError } = await supabase.from('evaluations').insert({
        org_id: submission.org_id,
        submission_id: submission.id,
        decision: verdict.decision,
        composite_score: verdict.composite_score,
        verdict: storedVerdict,
      })
      if (evalInsertError) throw new Error(`Failed to store evaluation: ${evalInsertError.message}`)

      const { error: completeError } = await supabase
        .from('submissions')
        .update({ status: 'complete' })
        .eq('id', submission.id)
      if (completeError) throw new Error(`Failed to mark complete: ${completeError.message}`)
      console.log(`[ingest] total       ${Date.now() - t_total}ms`)
    } catch (err) {
      console.error('[ingest] background eval failed:', err)
      await supabase.from('submissions').update({ status: 'error' }).eq('id', submission.id)
    }
  })

  return { submission }
})
