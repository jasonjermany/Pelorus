const ALLOWED_IPS = (process.env.ALLOWED_IPS ?? '::1').split(',').map(s => s.trim()).filter(Boolean)

const PUBLIC_PATHS = ['/api/email/inbound', '/api/logs/stream']

export default defineEventHandler((event) => {
  if (PUBLIC_PATHS.includes(event.path)) return

  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    event.node.req.socket?.remoteAddress

  if (!ip || !ALLOWED_IPS.includes(ip)) {
    console.warn(`[ipwhitelist] blocked IP: ${ip}  path: ${event.path}`)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
})
