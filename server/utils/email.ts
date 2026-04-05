import sgMail from '@sendgrid/mail'

let _initialized = false
function getSgMail() {
  if (!_initialized) {
    const key = process.env.SENDGRID_API_KEY
    if (!key) throw new Error('SENDGRID_API_KEY is not set')
    sgMail.setApiKey(key)
    _initialized = true
  }
  return sgMail
}

function buildHtml(label: string, resultsUrl: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;color:#333;padding:40px;max-width:480px;">
  <p>Hi,</p>
  <p>Your submission review for <strong>${label}</strong> is ready.</p>
  <p><a href="${resultsUrl}">View full results</a></p>
  <p style="color:#999;font-size:12px;">Pelorus</p>
</body>
</html>`
}

export async function sendResultsEmail(
  to: string,
  submissionId: string,
  decision: string,
  namedInsured: string | null,
) {
  const siteUrl = process.env.SITE_URL || 'https://www.pelorusai.io'
  const resultsUrl = `${siteUrl}/app/submissions/${submissionId}`
  const label = namedInsured || 'Your submission'

  await getSgMail().send({
    from: 'reviews@pelorusai.io',
    to,
    subject: `Review complete: ${decision} — ${label}`,
    html: buildHtml(label, resultsUrl),
  })

  console.log(`[email] sent results to ${to}  submission=${submissionId}  decision=${decision}`)
}

export async function sendInboundResultsEmail(
  to: string,
  submissionId: string,
  decision: string,
  namedInsured: string | null,
  pdfBuffer: Buffer,
) {
  const siteUrl = process.env.SITE_URL || 'https://www.pelorusai.io'
  const resultsUrl = `${siteUrl}/app/submissions/${submissionId}`
  const label = namedInsured || 'Your submission'
  const pdfFilename = namedInsured
    ? `${namedInsured.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_review.pdf`
    : `submission_review.pdf`

  await getSgMail().send({
    from: 'reviews@pelorusai.io',
    to,
    subject: `${decision}: ${label} — Pelorus Review`,
    html: buildHtml(label, resultsUrl),
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: pdfFilename,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  })

  console.log(`[email] sent inbound results to ${to}  submission=${submissionId}  decision=${decision}`)
}
