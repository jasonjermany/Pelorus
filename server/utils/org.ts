import { supabase } from './supabase'

export async function getOrgId(_event?: any): Promise<string> {
  if (process.env.ORG_ID) return process.env.ORG_ID

  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('organizations')
    .insert({ name: 'Default' })
    .select('id')
    .single()

  if (error || !created) throw new Error(`Failed to get or create organization: ${error?.message}`)
  return created.id
}
