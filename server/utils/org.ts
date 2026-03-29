import type { H3Event } from 'h3'

export async function getOrgId(event: H3Event): Promise<string> {
  const session = await getUserSession(event)
  const orgId = session?.user?.org_id
  if (!orgId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return orgId as string
}

export async function requireAdmin(event: H3Event): Promise<void> {
  const session = await getUserSession(event)
  if (session?.user?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
}
