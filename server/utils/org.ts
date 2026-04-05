import type { H3Event } from 'h3'

export async function getSessionUser(event: H3Event) {
  const session = await getUserSession(event)
  const user = session?.user
  if (!user?.org_id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user as { id: string; email: string; org_id: string; role: 'admin' | 'underwriter' }
}

export async function getOrgId(event: H3Event): Promise<string> {
  const user = await getSessionUser(event)
  return user.org_id
}

export async function requireAdmin(event: H3Event): Promise<void> {
  const session = await getUserSession(event)
  if (session?.user?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
}
