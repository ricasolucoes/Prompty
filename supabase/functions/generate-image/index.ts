import { createClient } from 'npm:@supabase/supabase-js@2'
import type { ImageProvider } from './providers/types.ts'
import { GeminiProvider } from './providers/gemini.ts'
import { OpenAIProvider } from './providers/openai.ts'
import { ReplicateProvider } from './providers/replicate.ts'

// CORS — wildcard origin is fine: invoke uses Bearer, not cookies (RESEARCH Pattern 6).
// The real Tauri fix is a COMPLETE Allow-Headers list, not origin matching.
// Tauri origins (http://tauri.localhost, tauri://localhost) are covered by '*'.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DAILY_CAP = 5 // Conservative start (GEN, per-user/day)
const PROMPT_MAX = 1500
const INJECTION_DENYLIST = [/ignore (all|previous) instructions/i, /system prompt/i]

function pickProvider(): ImageProvider {
  // OpenAI (gpt-image-1) is the active default. Gemini/Replicate stubs remain
  // for future swap via ACTIVE_PROVIDER — provider-agnostic (GEN-08).
  switch (Deno.env.get('ACTIVE_PROVIDER') ?? 'openai') {
    case 'gemini':
      return new GeminiProvider()
    case 'replicate':
      return new ReplicateProvider()
    case 'openai':
    default:
      return new OpenAIProvider()
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const authHeader = req.headers.get('Authorization') ?? ''

  // USER client — RPCs (spend/refund) MUST go through this so auth.uid() resolves.
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  // ADMIN client — Storage upload + generations INSERT only (bypasses RLS). NEVER for spend/refund.
  const adminClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 1. Verify JWT (user_id derived ONLY from the verified token, never from body)
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser()
  if (authErr || !user) return json({ error: 'unauthorized' }, 401)

  // 2. Parse + sanitize body
  let body: { prompty_id?: string; rendered_prompt?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  const promptyId = body.prompty_id
  const prompt = (body.rendered_prompt ?? '').slice(0, PROMPT_MAX)
  if (!promptyId || !prompt.trim()) return json({ error: 'missing prompty_id or prompt' }, 400)
  if (INJECTION_DENYLIST.some((re) => re.test(prompt))) return json({ error: 'prompt_rejected' }, 400)

  // 3. Circuit breaker (app_settings.generation_enabled)
  const { data: setting } = await adminClient
    .from('app_settings')
    .select('value')
    .eq('key', 'generation_enabled')
    .maybeSingle()
  if (setting?.value !== 'true') return json({ error: 'generation_disabled' }, 503)

  // 4. Pre-mint generation_id BEFORE spend → audit trail (ref_id)
  const generationId = crypto.randomUUID()

  // 5. Atomic per-user daily cap + spend via USER client (auth.uid() must resolve).
  // GAM-003: cap check and spend share one advisory lock in spend_generation_credit,
  // so concurrent requests cannot exceed DAILY_CAP (no TOCTOU).
  const { data: spend, error: spendErr } = await userClient.rpc('spend_generation_credit', {
    p_ref: generationId,
    p_daily_cap: DAILY_CAP,
  })
  const spendRow = Array.isArray(spend) ? spend[0] : spend
  if (spendErr || !spendRow?.ok) {
    if (spendRow?.reason === 'daily_cap') {
      return json({ error: 'daily_cap_reached', balance: spendRow?.balance ?? 0 }, 429)
    }
    return json({ error: 'no_credits', balance: spendRow?.balance ?? 0 }, 402)
  }

  // Resolve the spend ledger row (ref_id = generationId) for the generations audit FK.
  const { data: spendEvent } = await adminClient
    .from('credit_events')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_type', 'spent_generation')
    .eq('ref_id', generationId)
    .maybeSingle()
  const creditEventId = spendEvent?.id ?? null

  // 7..9 — any failure AFTER spend must refund before returning
  try {
    const provider = pickProvider()
    // provider.generate is bounded; real adapters use AbortSignal.timeout(120_000) on their fetch.
    const { bytes, mimeType } = await provider.generate(prompt)

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'webp'
    const path = `${user.id}/${generationId}.${ext}`
    const { error: upErr } = await adminClient.storage
      .from('prompty-generations')
      .upload(path, bytes, { contentType: mimeType, upsert: false })
    if (upErr) throw new Error(`storage_error: ${upErr.message}`)

    const { error: insErr } = await adminClient.from('generations').insert({
      id: generationId,
      user_id: user.id,
      prompty_id: promptyId,
      credit_event_id: creditEventId,
      image_path: path,
      provider: Deno.env.get('ACTIVE_PROVIDER') ?? 'openai',
    })
    if (insErr) throw new Error(`db_error: ${insErr.message}`)

    const { data: signed, error: signErr } = await adminClient.storage
      .from('prompty-generations')
      .createSignedUrl(path, 3600)
    if (signErr || !signed?.signedUrl) throw new Error('sign_error')

    return json({ signed_url: signed.signedUrl, balance: spendRow.balance }, 200)
  } catch (e) {
    // Refund via USER client (auth.uid()); refund_credit is idempotent (ON CONFLICT) in Phase 4.
    await userClient.rpc('refund_credit', { p_ref: generationId })
    return json({ error: 'generation_failed', detail: String(e), refunded: true }, 502)
  }
})
