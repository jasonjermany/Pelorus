const ALLOWED_IPS = [
  '72.93.65.252', // owner
  '96.237.115.113',
  '10.0.0.62',
  "::1"
]

const PUBLIC_PATHS = ['/api/email/inbound']

export default defineEventHandler((event) => {
  if (PUBLIC_PATHS.includes(event.path)) return

  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ??
    event.node.req.socket.remoteAddress
  console.log(`[ipwhitelist] request from IP: ${ip}`)
  if (!ip || !ALLOWED_IPS.includes(ip)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
})
