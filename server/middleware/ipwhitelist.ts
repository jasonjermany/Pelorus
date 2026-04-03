const ALLOWED_IPS = [
  '72.93.65.252', // owner
  '96.237.115.113',
  "::1"
]

export default defineEventHandler((event) => {
  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ??
    event.node.req.socket.remoteAddress
    console.log(`[ipwhitelist] request from IP: ${ip}`)
  if (!ip || !ALLOWED_IPS.includes(ip)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
})
