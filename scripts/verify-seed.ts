/* eslint-disable */
// One-shot smoke check: verify 6 published promptys in the live Supabase.
// Run: tsx scripts/verify-seed.ts
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env') })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, key)

const { count, error } = await supabase
  .from('promptys')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published')

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

if ((count ?? 0) !== 6) {
  console.error(`Expected 6 published promptys, got ${count}`)
  process.exit(2)
}

console.log(`Seed verified: ${count} published promptys`)
process.exit(0)
