export default defineEventHandler(async (event) => {
  const path = event.path
  if (!path.startsWith('/api/')) return

  const method = event.node.req.method ?? 'GET'
  const start = Date.now()
  console.log(`[api] --> ${method} ${path}`)

  event.node.res.on('finish', () => {
    const status = event.node.res.statusCode
    const ms = Date.now() - start
    console.log(`[api] <-- ${method} ${path} ${status} ${ms}ms`)
  })
})
