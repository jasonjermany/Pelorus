import { getSupabase } from '../../../utils/supabase'
import { getSessionUser } from '../../../utils/org'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params!
  const user = await getSessionUser(event)

  const body = await readBody(event) as {
    key: string
    amendedValue: string
    originalValue: string
  }

  if (!body.key || typeof body.amendedValue !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const supabase = getSupabase()

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, org_id')
    .eq('id', id)
    .eq('org_id', user.org_id)
    .single()

  if (!submission) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
  }

  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('id, verdict')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!evaluation) {
    throw createError({ statusCode: 404, statusMessage: 'No evaluation found' })
  }

  const verdict = (evaluation.verdict as any) ?? {}
  const existing = (verdict.field_amendments as Record<string, any>) ?? {}

  let updated: Record<string, any>
  if (body.amendedValue === '') {
    const { [body.key]: _removed, ...rest } = existing
    updated = rest
  } else {
    updated = {
      ...existing,
      [body.key]: {
        amendedValue: body.amendedValue,
        originalValue: body.originalValue,
        amendedAt: new Date().toISOString(),
        amendedBy: user.id,
      },
    }
  }

  const { error } = await supabase
    .from('evaluations')
    .update({ verdict: { ...verdict, field_amendments: updated } } as any)
    .eq('id', evaluation.id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save amendment' })
  }

  return { ok: true }
})
