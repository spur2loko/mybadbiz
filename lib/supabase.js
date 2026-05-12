import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xjsgnoumfremslzxqubt.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_-JSqJliGD4lGdewvdtuYTg_ZKjTFL7i'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
