import { supabase } from '../utils/supabase'

export default defineNitroPlugin(async () => {
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'error' })
    .in('status', ['processing', 'pending'])

  if (error) {
    console.error('[startup] failed to reset stuck submissions:', error.message)
  } else {
    console.log('[startup] reset any stuck processing/pending submissions to error')
  }
})
