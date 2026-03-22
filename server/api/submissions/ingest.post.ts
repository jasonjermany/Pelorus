import { supabase } from '../../utils/supabase'
import { parseFileToChunks } from '../../utils/reducto'
import { getOrgId } from '../../utils/org'
import { evaluateSubmission } from '../../utils/claude'

export default defineEventHandler(async (event) => {
  const contentType = getRequestHeader(event, 'content-type') || ''
  const isMultipart = contentType.toLowerCase().includes('multipart/form-data')

  const orgId = await getOrgId(event)

  let rawText: string
  let brokerEmail: string | undefined
  let source: 'upload' | 'email' = 'upload'

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

    const texts = await Promise.all(
      fileParts.map(async (filePart) => {
        const chunks = await parseFileToChunks(Buffer.from(filePart.data), filePart.filename!)
        return chunks.map((c) => c.content).join('\n\n')
      })
    )
    rawText = texts.join('\n\n---\n\n')
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

  // Fire-and-forget evaluation — don't block the response
  const submission = data
  ;(async () => {
    try {
      await supabase.from('submissions').update({ status: 'processing' }).eq('id', submission.id)
      const claudeStart = Date.now()
      const verdict = await evaluateSubmission({ ...submission, raw_text: rawText })
      const analyzedInSeconds = ((Date.now() - claudeStart) / 1000).toFixed(1)
      const storedVerdict = { ...verdict, analyzed_in_seconds: analyzedInSeconds }
      await supabase.from('evaluations').insert({
        org_id: submission.org_id,
        submission_id: submission.id,
        decision: verdict.decision,
        composite_score: verdict.composite_score,
        verdict: storedVerdict,
      })
      await supabase.from('submissions').update({ status: 'complete', decision: verdict.decision }).eq('id', submission.id)
    } catch (err) {
      console.error('[ingest] auto-evaluate failed:', err)
      await supabase.from('submissions').update({ status: 'error' }).eq('id', submission.id)
    }
  })()

  return { submission: data }
})
