import Anthropic from '@anthropic-ai/sdk'
import { getSupabase } from '../../../utils/supabase'
import { getSessionUser } from '../../../utils/org'
import { buildSourceFetchMessages } from '../../../utils/prompts/riskProfile'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'extended-cache-ttl-2025-04-11',
  },
})

export default defineEventHandler(async (event) => {
  const { id } = event.context.params!
  const user = await getSessionUser(event)

  const { field_key, label, value } = await readBody(event) as {
    field_key: string
    label: string
    value: string
  }

  if (!field_key || !label) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields.' })
  }

  const supabase = getSupabase()

  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select('id, org_id, raw_text')
    .eq('id', id)
    .single()

  if (subError || !submission) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found.' })
  }

  if (submission.org_id !== user.org_id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden.' })
  }

  const { data: cached } = await supabase
    .from('field_sources')
    .select('source_doc, source_location, raw_text, context')
    .eq('submission_id', id)
    .eq('field_key', field_key)
    .maybeSingle()

  if (cached) return cached

  const t = Date.now()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1000,
    temperature: 0,
    messages: buildSourceFetchMessages(submission.raw_text, { label, value }) as any,
  })
  console.log(`[field-source] ${label}  ${Date.now() - t}ms`)

  const text = (response.content[0] as any).text as string
  let result = { source_doc: null as string | null, source_location: null as string | null, raw_text: null as string | null, context: null as string | null }
  try {
    result = JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.warn('[field-source] parse failed for', label)
  }

  await supabase.from('field_sources').insert({
    submission_id: id,
    field_key,
    source_doc: result.source_doc,
    source_location: result.source_location,
    raw_text: result.raw_text,
    context: result.context,
  })

  return result
})
