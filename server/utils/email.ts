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

export async function sendResultsEmail(
  to: string,
  submissionId: string,
  decision: string,
  namedInsured: string | null,
) {
  const siteUrl = process.env.SITE_URL || 'https://www.pelorusai.io'
  const resultsUrl = `${siteUrl}/app/submissions/${submissionId}`
  const label = namedInsured || 'Your submission'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;color:#333;padding:40px;max-width:480px;">
  <p>Hi,</p>
  <p>Your submission review for <strong>${label}</strong> is ready.</p>
  <p><a href="${resultsUrl}">View results</a></p>
  <p style="color:#999;font-size:12px;">Pelorus</p>
</body>
</html>`

  await getSgMail().send({
    from: 'reviews@pelorusai.io',
    to,
    subject: `Review complete: ${decision} — ${label}`,
    html,
  })

  console.log(`[email] sent results to ${to}  submission=${submissionId}  decision=${decision}`)
}
