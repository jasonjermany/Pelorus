import { getSupabase } from '../../utils/supabase'
import { parseFileToChunks, PIPELINE_SUBMISSIONS } from '../../utils/reducto'
import { evaluateSubmission } from '../../utils/claude'
import { generatePdfBuffer } from '../../utils/pdfBuilder'
import { sendInboundResultsEmail } from '../../utils/email'
import { scrubDocumentText } from '../../utils/sanitize'

/** Pull the bare email address out of "Display Name <addr>" or plain "addr". */
function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/)
  return (match ? match[1] : raw).trim().toLowerCase()
}

export default defineEventHandler(async (event) => {
  // Always return 200 — SendGrid retries on any non-2xx response.
  let parts: Awaited<ReturnType<typeof readMultipartFormData>>
  try {
    parts = await readMultipartFormData(event)
  } catch (err) {
    console.error('[email/inbound] multipart parse error:', err)
    return { ok: true }
  }

  if (!parts?.length) {
    console.warn('[email/inbound] no parts — content-type:', getRequestHeader(event, 'content-type'))
    return { ok: true }
  }

  const field = (name: string) =>
    parts!.find((p) => p.name === name && !p.filename)?.data.toString('utf8').trim() ?? ''

  const fromRaw  = field('from')
  const toRaw    = field('to')
  const subject  = field('subject')
  const textBody = field('text')
  const htmlBody = field('html')

  const brokerEmail = fromRaw ? extractEmail(fromRaw) : null

  // Derive the org from the inbound handle: {handle}@mail.pelorusai.io
  const toEmail = toRaw ? extractEmail(toRaw) : ''
  const handle  = toEmail.split('@')[0].trim().toLowerCase()

  if (!handle) {
    console.warn('[email/inbound] could not parse handle from to:', toRaw)
    return { ok: true }
  }

  const { data: org } = await getSupabase()
    .from('organizations')
    .select('id')
    .eq('inbound_email_handle', handle)
    .single()

  if (!org) {
    console.warn(`[email/inbound] no org found for handle: ${handle}`)
    return { ok: true }
  }

  const orgId = org.id

  // Only process submissions from users who belong to this org
  // const { data: userRecord } = await getSupabase()
  //   .from('users')
  //   .select('id')
  //   .eq('org_id', orgId)
  //   .eq('email', brokerEmail)
  //   .single()

  // if (!brokerEmail || !userRecord) {
  if (!brokerEmail) {
    console.warn(`[email/inbound] sender not whitelisted  from=${brokerEmail}  handle=${handle}`)
    return { ok: true }
  }

  // Collect all attachments; fall back to plain-text body wrapped as .txt
  const attachmentFiles = parts
    .filter((p) => !!p.filename && p.data?.length > 0)
    .map((p) => ({ data: Buffer.from(p.data), filename: p.filename! }))

  if (!attachmentFiles.length) {
    const body =
      textBody ||
      htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim() ||
      subject ||
      '(no content)'
    const filename = subject
      ? `${subject.slice(0, 60).replace(/[^a-z0-9 ._-]/gi, '_')}.txt`
      : 'submission.txt'
    attachmentFiles.push({ data: Buffer.from(body, 'utf8'), filename })
  }

  // Insert immediately so it shows up in the inbox right away.
  const { data: submission, error: insertError } = await getSupabase()
    .from('submissions')
    .insert({
      org_id: orgId,
      raw_text: '',
      broker_email: brokerEmail,
      source: 'email',
      status: 'processing',
    })
    .select('id, org_id, status, source, broker_email, created_at')
    .single()

  if (insertError) {
    console.error('[email/inbound] DB insert failed:', insertError.message)
    return { ok: true }
  }

  console.log(`[email/inbound] queued ${submission.id}  handle=${handle}  from=${brokerEmail ?? 'unknown'}`)

  const t_total = Date.now()

  setImmediate(async () => {
    try {
      const fileResults = await Promise.all(
        attachmentFiles.map(async ({ data, filename }) => {
          const chunks = await parseFileToChunks(data, filename, PIPELINE_SUBMISSIONS)
          return { filename, text: chunks.map((c) => c.embed || c.content).join('\n\n') }
        })
      )
      const rawText = scrubDocumentText(
        fileResults.map(({ filename, text }) => `=== DOCUMENT: ${filename} ===\n${text}`).join('\n\n---\n\n')
      )

      await getSupabase().from('submissions').update({ raw_text: rawText }).eq('id', submission.id)

      const verdict = await evaluateSubmission({ ...submission, raw_text: rawText }, orgId)
      const analyzedInSeconds = ((Date.now() - t_total) / 1000).toFixed(1)

      const { error: evalError } = await getSupabase().from('evaluations').insert({
        org_id: submission.org_id,
        submission_id: submission.id,
        decision: (verdict as any).verdict_code,
        composite_score: verdict.composite_score,
        verdict: { ...verdict, analyzed_in_seconds: analyzedInSeconds },
      })
      if (evalError) throw new Error(`Failed to store evaluation: ${evalError.message}`)

      const { error: completeError } = await getSupabase()
        .from('submissions')
        .update({ status: 'complete' })
        .eq('id', submission.id)
      if (completeError) throw new Error(`Failed to mark complete: ${completeError.message}`)

      console.log(`[email/inbound] complete ${submission.id}  ${((Date.now() - t_total) / 1000).toFixed(1)}s`)

      if (brokerEmail) {
        const namedInsured = verdict.risk_profile?.named_insured ?? null
        const sub = submission as any
        const pdfBuffer = await generatePdfBuffer(
          { ...verdict, analyzed_in_seconds: analyzedInSeconds } as any,
          new Date(sub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          namedInsured,
        )
        await sendInboundResultsEmail(brokerEmail, sub.id, (verdict as any).verdict_code, namedInsured, pdfBuffer)
          .catch(err => console.error(`[email/inbound] reply failed  submission=${sub.id}  error=${err.message}`))
      }
    } catch (err) {
      console.error('[email/inbound] background eval failed:', err)
      await getSupabase().from('submissions').update({ status: 'error' }).eq('id', submission.id)
    }
  })

  return { ok: true }
})
