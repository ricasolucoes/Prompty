# Phase 6: Geração de Imagem in-app — Research

**Researched:** 2026-05-31
**Domain:** Supabase Edge Function (Deno) · provider adapter pattern · Tauri CORS · credit spend/refund
**Confidence:** HIGH — grounded in existing codebase, STACK.md/ARCHITECTURE.md/PITFALLS.md, and Supabase docs

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Provider MOCK as default.** `ACTIVE_PROVIDER` env secret default = `mock`. Mock returns a deterministic placeholder image (~1–2 s simulated delay). Force-fail via prompt `__FORCE_FAIL__` or env `MOCK_FAIL=1`.
- **Adapter interface:** `interface ImageProvider { generate(prompt: string): Promise<{ bytes: Uint8Array; mimeType: string }> }`. One file per provider in `supabase/functions/generate-image/providers/`.
- **`verify_jwt = true`** in `config.toml` — NEVER false. `user_id` from JWT only.
- **Pre-mint `generation_id`** (UUID) before `spend_credit(p_ref)`.
- **Full flow order:** validate JWT → circuit-breaker `generation_enabled` (app_settings) + daily cap → `spend_credit(generation_id)` → provider.generate() with AbortSignal.timeout(120_000) → WebP <200KB → upload `prompty-generations` bucket → insert `generations` → signed URL → return. Refund on any post-spend failure.
- **CORS:** `http://tauri.localhost` and `tauri://localhost` in allow-list; explicit OPTIONS handler.
- **Prompt sanitization:** length ≤ 1500 chars + basic injection denylist.
- **Frontend states:** anon CTA → signup; 0-credit nudge "contribua para ganhar" (Phase 5 earn actions); loading skeleton; inline result; error + refund confirmed.
- **CLAUDE.md + AGENTS.md must be updated** in the same commit adding the Edge Function.
- **Keep-alive GitHub Actions cron** (every ~5 days) in the same PR.

### Claude's Discretion
- Exact placeholder format for mock (PNG generated in memory vs static asset).
- Structure of `app_settings` (new minimal table vs reuse).
- Where the generated image is displayed (inline below buttons, modal, or separate section).
- Value of daily generation cap (start conservative, e.g., 5/day).

### Deferred Ideas (OUT OF SCOPE)
- Real providers (Gemini/OpenAI/Replicate) — stubs only; fill when user sets secret.
- Sending generated image as community result (LOOP-01).
- Advanced rate limiting beyond simple daily cap (OPS-01).
- Image orphan cleanup (OPS-02).
- Credit purchase (out of scope entirely).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | Logged-in user with balance ≥1 can generate an image spending 1 credit | `spend_credit(p_ref)` RPC from Phase 4 + Edge Function orchestrator |
| GEN-02 | Generation runs via secure Edge Function — provider key never reaches frontend | `supabase secrets set` + `Deno.env.get` + `SUPABASE_SERVICE_ROLE_KEY` auto-injected |
| GEN-03 | Debit is atomic — concurrent clicks do not cause double-spend | `pg_advisory_xact_lock` + `FOR UPDATE` inside `spend_credit` (Phase 4); client-side disable-on-click |
| GEN-04 | Provider failure triggers automatic credit refund | `refund_credit(p_ref)` RPC in try/catch wrapping provider + storage steps |
| GEN-05 | User sees loading skeleton (~10 s estimate) + inline result; clear error + refund confirmation | `useGenerate` state machine; `setState('done' \| 'error')` after `invoke()` resolves |
| GEN-06 | Anonymous user sees CTA "Cadastre-se e ganhe 1 crédito" instead of generate button | `user` from `useAuthStore`; conditional render in PromptyDetailPage |
| GEN-07 | Zero-credit logged-in user sees nudge "contribua para ganhar mais" (no purchase paywall) | `profile.credits === 0` branch; nudge lists Phase 5 earn actions |
| GEN-08 | Provider-agnostic — swapping provider = 1 file + 1 secret, no credit/UI changes | `ACTIVE_PROVIDER` env var dispatch; adapter interface |
</phase_requirements>

---

## Summary

Phase 6 is the project's first Supabase Edge Function. It is intentionally narrow: one Deno function orchestrates the spend-generate-store-return flow; the provider is a deterministic mock by default so the entire flow is testable without any external API key. The Phase 4 contracts (`spend_credit`, `refund_credit`, `generations` table, `prompty-generations` bucket) are already in place — Phase 6 only adds the function and the frontend hook+button.

The most important correctness constraint is the **refund path**: any failure after `spend_credit` returns `ok=true` must call `refund_credit` before responding with an error. The `AbortSignal.timeout(120_000)` guard ensures the function always has headroom to execute the refund before the 150 s Supabase free-tier wall-clock kills it.

The CORS story for Tauri requires manually specifying both `http://tauri.localhost` (Android/desktop) and `tauri://localhost` (older builds) because the Supabase `corsHeaders` helper does not enumerate Tauri origins. There is no `@supabase/supabase-js/cors` named import — CORS headers must be written manually or copied from the official Supabase CORS snippet.

**Primary recommendation:** Write the Edge Function with a hardcoded `corsHeaders` constant, implement the mock provider as the full working path, stub the three real providers with a "not configured" throw, and verify the entire flow works locally with `supabase functions serve` before wiring the frontend.

---

## Standard Stack

### Core (no new frontend packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions (Deno runtime) | Deno 2.1.x (platform-managed) | Runs server-side: holds provider secret, calls spend/refund RPCs, uploads to Storage | Only option for keeping secrets off the Tauri SPA binary |
| `@supabase/supabase-js` (existing) | ^2.50.0 (already installed) | `supabase.functions.invoke()` on client; admin client inside function | Already in project; JWT auto-forwarded |
| Supabase CLI | 2.23.0 (devDep, confirmed in package.json) | `functions new`, `functions serve`, `functions deploy`, `secrets set` | Already in project |
| Vitest + @testing-library/react | ^3.1.0 / ^16.3.0 (already installed) | Unit tests for `useGenerate` hook states | Already in project |

### No New Frontend Dependencies

`supabase.functions.invoke()` is part of `@supabase/supabase-js` already installed. No new `npm install` needed anywhere.

Inside the Edge Function, the only import is:
```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'
// All provider HTTP via native Deno fetch() — no SDK packages
```

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Manual CORS headers | `import { corsHeaders } from 'https://...'` CDN snippet | The Supabase "cors" helper CDN import is fragile; manual constant is 6 lines and more legible |
| Mock via static asset | Generate PNG bytes in Deno | Static asset approach is simpler and zero-dependency; both work, planner decides |

---

## Architecture Patterns

### Edge Function Directory Structure

```
supabase/
├── config.toml                      (add [functions.generate-image] block)
└── functions/
    └── generate-image/
        ├── index.ts                 (orchestrator)
        └── providers/
            ├── types.ts             (interface ImageProvider)
            ├── mock.ts              (COMPLETE implementation, default)
            ├── gemini.ts            (stub — throws "not configured")
            ├── openai.ts            (stub — throws "not configured")
            └── replicate.ts         (stub — throws "not configured")
```

### Pattern 1: config.toml function block

Add to `supabase/config.toml` (no `[functions]` section exists yet):

```toml
[functions.generate-image]
verify_jwt = true
```

`verify_jwt = true` is the default but must be explicit to prevent any future accidental override. The platform rejects requests with invalid/missing JWT before the handler runs — no manual JWT parsing needed.

### Pattern 2: Edge Function skeleton (confirmed from ARCHITECTURE.md + STACK.md)

```typescript
// supabase/functions/generate-image/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',   // or enumerate origins — see CORS section
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // User-scoped client (JWT forwarded, RLS applies)
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  // Validate JWT — getUser() verifies signature server-side
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Service-role client for privileged ops (bypasses RLS for Storage + RPC)
  // SUPABASE_SERVICE_ROLE_KEY is auto-injected — no supabase secrets set needed
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ... flow: circuit-breaker → spend → generate → upload → insert → return
})
```

**Key facts confirmed:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are **auto-injected by the platform** — no `supabase secrets set` needed for these three.
- `supabase.functions.invoke()` on the client **automatically** sends the session JWT on `Authorization: Bearer <token>`. No manual header in React code.
- The function signature `Deno.serve(async (req) => ...)` is the current Deno 2.1.x style (not the older `serve()` from `std/http`).

### Pattern 3: spend_credit / refund_credit call from Edge Function

The Phase 4 RPC signatures (locked):
```typescript
// spend via service-role client (bypasses RLS)
const { data, error } = await adminClient.rpc('spend_credit', { p_ref: generationId })
// data: { ok: boolean, balance: number }

// refund on failure
await adminClient.rpc('refund_credit', { p_ref: generationId })
```

The Edge Function derives `user_id` from the verified JWT — it is NOT passed in the request body (security requirement). The `spend_credit` function uses `auth.uid()` from the session context... but since the admin client bypasses RLS, the function needs the user_id explicitly. See architecture note below.

**Architecture note:** `spend_credit` in Phase 4 uses `auth.uid()` internally. When called via the service-role client, `auth.uid()` returns NULL. Therefore the Edge Function must call the RPC via the **user-scoped client** (or pass `p_user_id` explicitly to the function). Confirm Phase 4 signature: `spend_credit(p_ref UUID DEFAULT NULL) RETURNS TABLE(ok BOOLEAN, balance INTEGER)` — it reads `auth.uid()` internally. **Use `userClient.rpc()` for spend/refund**, not `adminClient.rpc()`. Use `adminClient` only for Storage upload and `generations` INSERT.

### Pattern 4: Storage upload from Edge Function

```typescript
// Source: STACK.md + ARCHITECTURE.md
const path = `${user.id}/${generationId}.webp`
const { error: uploadErr } = await adminClient.storage
  .from('prompty-generations')
  .upload(path, imageBytes, { contentType: 'image/webp', upsert: false })

if (uploadErr) {
  await userClient.rpc('refund_credit', { p_ref: generationId })
  return errorResponse(500, 'storage_error')
}

const { data: { signedUrl } } = await adminClient.storage
  .from('prompty-generations')
  .createSignedUrl(path, 3600)   // 1-hour TTL
```

### Pattern 5: Mock provider with force-fail

```typescript
// supabase/functions/generate-image/providers/mock.ts
const MOCK_PNG = new Uint8Array([
  // minimal 1×1 WebP bytes — 26 bytes, purple pixel
  // OR: generate a solid-color PNG using Deno Canvas — no external dep needed
  // Simplest: use a hardcoded minimal valid WebP/PNG byte array
])

export class MockProvider implements ImageProvider {
  async generate(prompt: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
    if (prompt.includes('__FORCE_FAIL__') || Deno.env.get('MOCK_FAIL') === '1') {
      throw new Error('Mock forced failure')
    }
    // Simulate provider latency
    await new Promise(r => setTimeout(r, 1500))
    return { bytes: MOCK_PNG, mimeType: 'image/webp' }
  }
}
```

For the placeholder bytes: the simplest valid approach is to embed a hardcoded minimal PNG (8×8 px, ~68 bytes) as a `Uint8Array` literal. No Deno Canvas needed. The planner can choose to use a base64-decoded constant inline.

### Pattern 6: CORS headers — Tauri origins

The Supabase docs' standard CORS snippet uses `'*'` for origin, which works for Tauri webview. However, the locked decision requires `http://tauri.localhost` and `tauri://localhost` to be explicit. Two options:

**Option A (permissive, simpler):** Use `'*'` for `Access-Control-Allow-Origin`. Works for Tauri since it does not send credentials in a way that origin-matching blocks. This is the Supabase-recommended approach for Edge Functions.

**Option B (explicit allow-list):** Check `req.headers.get('origin')` and reflect it if it matches the allowed list. Required if the function ever uses `credentials: 'include'` mode.

For this project, `supabase.functions.invoke()` uses `Authorization: Bearer <token>` (not cookies), so **Option A (wildcard `'*'`) is correct and sufficient**. CORS errors in Tauri are typically about missing `Access-Control-Allow-Headers`, not origin mismatch. The headers constant must include `authorization, x-client-info, apikey, content-type`.

### Pattern 7: useGenerate hook (mirrors useCopy.ts pattern)

```typescript
// src/hooks/useGenerate.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

type GenState = 'idle' | 'loading' | 'done' | 'error'

export function useGenerate() {
  const [state, setState] = useState<GenState>('idle')
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function generate(promptyId: string, renderedPrompt: string) {
    setState('loading')
    setSignedUrl(null)
    setErrorMsg(null)

    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompty_id: promptyId, rendered_prompt: renderedPrompt },
    })

    // Always refetch — server is source of truth for credits
    void useAuthStore.getState().refetchProfile()

    if (error || !data?.signed_url) {
      setErrorMsg(data?.error ?? error?.message ?? 'Erro ao gerar imagem')
      setState('error')
      return
    }
    setSignedUrl(data.signed_url)
    setState('done')
  }

  return { generate, state, signedUrl, errorMsg, reset: () => setState('idle') }
}
```

**Error surface:** `supabase.functions.invoke()` wraps HTTP errors: if the function returns status 402, `error` will be non-null with `context.status === 402`. The `data?.error` field contains the message string returned by the function body. Always check `error` first, then `data?.error`.

### Pattern 8: Button states in PromptyDetailPage

Insert between the copy button and the save button (same `div` container at line 291):

```tsx
{/* GEN-06: anonymous CTA */}
{!user && (
  <button onClick={() => nav('/signup')} style={...}>
    Cadastre-se e ganhe 1 crédito para gerar
  </button>
)}

{/* GEN-01/05/07: authenticated generate button */}
{user && (
  <>
    {profile?.credits === 0 && (
      <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
        Sem créditos — publique, contribua ou suba de nível para ganhar mais.
      </p>
    )}
    <PrimaryButton
      full
      disabled={state === 'loading' || (profile?.credits ?? 0) < 1}
      onClick={() => void generate(prompty.id, resolved)}
    >
      {state === 'loading' ? 'Gerando (~10s)…' : 'Gerar imagem (1 crédito)'}
    </PrimaryButton>
    {state === 'done' && signedUrl && (
      <img src={signedUrl} alt="Imagem gerada" style={{ width: '100%', borderRadius: 12, marginTop: 8 }} />
    )}
    {state === 'error' && (
      <p style={{ color: '#FF3B6B', fontSize: 13 }}>
        {errorMsg} Seu crédito foi devolvido.
      </p>
    )}
  </>
)}
```

### Anti-Patterns to Avoid

- **Never pass `user_id` in the request body.** The Edge Function derives user identity from the verified JWT only (`user.id` from `getUser()`).
- **Never use `adminClient` for `spend_credit`/`refund_credit`.** The RPC uses `auth.uid()` internally — call via `userClient` so the session context is present.
- **Never call `window.fetch` directly to the provider API from the frontend.** All provider traffic goes through the Edge Function.
- **Never set `verify_jwt = false`** even in local dev config committed to git.
- **Never store the provider API key in any `.env` file or as `VITE_*` variable.**

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Credit atomicity | Manual read-then-write from Edge Function | `spend_credit` RPC (Phase 4) — already built | `pg_advisory_xact_lock` + `FOR UPDATE`; concurrent calls serialized |
| JWT validation | Manual JWT decode in Deno | `verify_jwt = true` in `config.toml` + `userClient.auth.getUser()` | Platform validates signature; `getUser()` confirms not revoked |
| Storage path scoping | Custom path obfuscation | `${user.id}/{uuid}.webp` convention + Storage RLS | Already in bucket RLS policy from Phase 4 |
| Refund idempotency | Custom deduplication logic | `ON CONFLICT DO NOTHING` in `refund_credit` (Phase 4) | A double-refund is blocked at DB level |
| CORS | Custom CORS middleware | Manual `corsHeaders` constant (6 lines) | No framework needed; the OPTIONS pattern is 3 lines |
| Provider HTTP client | Provider SDK packages | Native `Deno fetch()` | Provider APIs are simple REST; no SDK needed |

---

## Common Pitfalls

### Pitfall 1: `spend_credit` called via `adminClient` instead of `userClient`

**What goes wrong:** `auth.uid()` returns NULL inside the RPC because the service-role key bypasses the session. The function returns `ok=false` for every call.

**How to avoid:** Call `spend_credit` and `refund_credit` via `userClient` (the client initialized with the user's Bearer token). Use `adminClient` only for Storage uploads and `generations` INSERT.

### Pitfall 2: Refund path not reached on Edge Function timeout

**What goes wrong:** Provider call exceeds 120 s but function has already spent the credit. Supabase kills the function at 150 s; the catch block never runs.

**How to avoid:** `AbortSignal.timeout(120_000)` on the provider `fetch()` call. At 120 s the signal fires, the fetch throws, the catch block calls `refund_credit`, and the function returns an error response — all within the 150 s wall clock.

### Pitfall 3: CORS fails in Tauri build (not in browser test)

**What goes wrong:** The Edge Function works fine when called from a browser dev session but returns CORS errors in the Tauri Android build.

**Root cause:** Missing or truncated `Access-Control-Allow-Headers`. The Supabase platform has a documented bug where it can truncate the header list. The fix is to include the full header string in the OPTIONS response, not rely on platform passthrough.

**How to avoid:** The `corsHeaders` constant must include `'authorization, x-client-info, apikey, content-type'` and the OPTIONS handler must return these headers directly from the function handler (not relying on any middleware).

### Pitfall 4: Double-click sends two invocations before button disables

**Client defense:** Disable the button on the first click (set `state = 'loading'` synchronously before the `await`). This prevents the second `invoke()` call from being sent at the network level.

**Server defense (Phase 4):** `pg_advisory_xact_lock` inside `spend_credit` serializes concurrent RPCs for the same user. Only one succeeds.

### Pitfall 5: `generations` INSERT fails after successful Storage upload

**What happens:** Image is in the bucket but no DB row exists. User has been refunded (correct). Image is orphaned in Storage (acceptable per deferred OPS-02).

**How to avoid:** Wrap both the Storage upload AND the `generations` INSERT in the same try/catch. On any failure in this block, call `refund_credit`. Log the orphaned path for future cleanup.

### Pitfall 6: `app_settings` table not created before Phase 6 deploys

**What happens:** The circuit-breaker check `generation_enabled` fails because the table doesn't exist — function crashes on first call.

**How to avoid:** Include the `app_settings` table creation in Wave 0 (migration task). Insert the default row: `INSERT INTO app_settings (key, value) VALUES ('generation_enabled', 'true') ON CONFLICT DO NOTHING`.

---

## Code Examples

### CLI scaffold and deploy sequence

```bash
# 1. Scaffold (creates supabase/functions/generate-image/index.ts)
npx supabase functions new generate-image

# 2. Add config block (edit supabase/config.toml manually — no CLI command for this)
# [functions.generate-image]
# verify_jwt = true

# 3. Local test — serves function at http://localhost:54321/functions/v1/generate-image
npx supabase functions serve generate-image --env-file supabase/functions/.env.local

# 4. Set secrets (production — not committed to git)
npx supabase secrets set ACTIVE_PROVIDER=mock
npx supabase secrets set MOCK_FAIL=0

# 5. Deploy
npx supabase functions deploy generate-image --no-verify-jwt  # local only; production: no flag
```

**Note on `--no-verify-jwt`:** Use only for local dev `serve` testing without a real JWT. Never in the deploy command.

### Invoking from the frontend (confirmed pattern)

```typescript
// The client forwards the session JWT automatically — no manual headers needed
const { data, error } = await supabase.functions.invoke('generate-image', {
  body: { prompty_id: 'uuid-here', rendered_prompt: 'a purple cat' },
})
// data.signed_url on success
// error.message (or data.error) on failure
// error.context?.status for HTTP status code (e.g., 402 = no credits)
```

### Keep-alive GitHub Actions workflow

```yaml
# .github/workflows/keep-alive.yml
name: Supabase Keep-Alive
on:
  schedule:
    - cron: '0 10 */5 * *'   # every 5 days at 10:00 UTC
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase health endpoint
        run: |
          curl -sf "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            || echo "Ping failed (project may be resuming)"
```

GitHub secrets needed: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (already in CI from existing workflows, or add them).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `serve()` from `https://deno.land/std/http/server.ts` | `Deno.serve()` native | Deno 2.1.x uses `Deno.serve`; Supabase Edge Functions run on Deno 2.1.x |
| `import_map.json` for Deno deps | `npm:` specifier inline | No import map needed for `npm:@supabase/supabase-js@2` |
| `supabase functions deploy --legacy-bundle` | Default bundler (eszip) | Default is correct for Deno 2.1.x |

---

## Open Questions

1. **`spend_credit` caller context**: Confirmed from Phase 4 PLAN that `spend_credit` uses `auth.uid()` internally and must be called via `userClient`. But the function also accepts `p_ref UUID`. Planner should verify this explicitly against the actual migration before implementing.

2. **WebP compression in Deno**: The mock returns a small placeholder — no compression needed. For real providers (Gemini returns base64 PNG/JPEG), the CONTEXT.md requires WebP <200KB. The Deno runtime has no built-in WebP encoder. Options for real providers: (a) skip conversion and store as-is if provider returns ≤200KB; (b) use `npm:sharp` (heavy, may not work in Edge runtime); (c) accept PNG/JPEG from provider and cap at 1MB instead of converting. This is a stub concern deferred to when a real provider is configured.

3. **`app_settings` structure**: Claude's discretion. Recommendation: a single-row `key/value TEXT` table is sufficient. Minimal schema:
   ```sql
   CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
   INSERT INTO app_settings VALUES ('generation_enabled', 'true') ON CONFLICT DO NOTHING;
   ```

---

## Validation Architecture

> `nyquist_validation: true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 + @testing-library/react 16.3.0 |
| Config file | `vitest.config.ts` (exists, from existing test suite) |
| Quick run | `pnpm test:run` (vitest run --reporter=verbose) |
| Full suite | `pnpm test:run` |
| Edge Function local test | `npx supabase functions serve generate-image` + curl |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| GEN-01 | Logged-in user with credits can generate | Integration (local Edge Function + DB) | `curl -X POST http://localhost:54321/functions/v1/generate-image -H "Authorization: Bearer <token>" -d '{"prompty_id":"...","rendered_prompt":"test"}'` | Manual-assisted: needs local supabase running |
| GEN-02 | Provider key never in bundle | Automated grep | `grep -r "VITE_.*KEY\|VITE_.*TOKEN\|VITE_.*SECRET" src/ \| grep -v ".test."` → must return empty | Fully automated; run as pre-deploy check |
| GEN-03 | No double-spend on concurrent clicks | Unit (hook) | `pnpm test:run src/hooks/useGenerate.test.tsx` — mock invoke, call generate twice fast, assert only one invocation starts | Button disabled on first click; server-side lock tested via SQL script from Phase 4 |
| GEN-04 | Credit refunded on failure | Integration (local EF) | curl with `rendered_prompt: "__FORCE_FAIL__"` → assert 502; then query DB for refund row | Manual-assisted (needs local supabase + psql check) |
| GEN-05 | Loading skeleton + inline result + error+refund message | Unit (hook + component RTL) | `pnpm test:run src/hooks/useGenerate.test.tsx` — test `state` transitions: idle→loading→done and idle→loading→error | Fully automated with mocked `supabase.functions.invoke` |
| GEN-06 | Anonymous user sees signup CTA | Unit (component RTL) | `pnpm test:run src/pages/PromptyDetailPage.test.tsx` — render with `user=null`, assert CTA text present | Fully automated |
| GEN-07 | Zero-credit user sees earn nudge | Unit (component RTL) | `pnpm test:run src/pages/PromptyDetailPage.test.tsx` — render with `user` set, `profile.credits=0`, assert nudge text | Fully automated |
| GEN-08 | Provider swap = 1 file + 1 secret, no other changes | Code review / structural | `ls supabase/functions/generate-image/providers/` — assert 4 files (mock, gemini, openai, replicate) + `grep "ACTIVE_PROVIDER" supabase/functions/generate-image/index.ts` | Structural: grep + file existence check |

### Sampling Rate

- **Per task commit:** `pnpm test:run` (unit/RTL tests only; <30 s)
- **Per wave merge:** `pnpm test:run` + key-leakage grep + Edge Function smoke curl
- **Phase gate:** Full suite green + manual Tauri Android CORS verification before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useGenerate.test.tsx` — covers GEN-03, GEN-05 (idle→loading→done, idle→loading→error state transitions; button disabled during loading)
- [ ] `src/pages/PromptyDetailPage.test.tsx` — add GEN-06 (anon CTA) and GEN-07 (zero-credit nudge) cases to existing test file (if it exists) or create new
- [ ] `supabase/tests/gen04_refund_on_fail.sh` — curl force-fail + psql assert refund row (manual-assisted integration test)
- [ ] `supabase/config.toml` — add `[functions.generate-image]` block with `verify_jwt = true`
- [ ] `.github/workflows/keep-alive.yml` — keep-alive cron

None of these require new framework installation — Vitest and the testing libraries are already present.

---

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` — Edge Function scaffold/deploy/secrets, supabase-js invoke, JWT pattern, Storage from function, provider shapes (codebase research file, 2026-05-31)
- `.planning/research/ARCHITECTURE.md` — full Edge Function flow, spend/refund signatures, generations table, bucket schema (codebase research file, 2026-05-31)
- `.planning/research/PITFALLS.md` — JWT, CORS Tauri, AbortSignal/timeout, refund race, key leakage, free tier, double-spend (codebase research file, 2026-05-31)
- `.planning/phases/04-ledger-creditos-bonus/04-02-PLAN.md` — exact `spend_credit`/`refund_credit` signatures, `generations` table DDL, `prompty-generations` bucket DDL
- `src/hooks/useCopy.ts` — fire-and-forget refetchProfile pattern (direct codebase read)
- `src/pages/PromptyDetailPage.tsx` — insertion points, button pattern, toast pattern (direct codebase read)
- `supabase/config.toml` — confirmed: no `[functions]` section exists yet; must be added
- `package.json` — confirmed: Supabase CLI 2.23.0 in devDeps; Vitest 3.1.0; no new deps needed

### Secondary (MEDIUM confidence)

- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions) — `Deno.serve`, config.toml, secrets, verify_jwt
- [Supabase CORS in Edge Functions](https://supabase.com/docs/guides/functions/cors) — corsHeaders pattern, OPTIONS handler
- [Supabase functions.invoke() reference](https://supabase.com/docs/reference/javascript/functions-invoke) — client JWT auto-forwarding

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all confirmed against package.json + existing codebase; no new deps
- Architecture: HIGH — derived from already-written ARCHITECTURE.md and Phase 4 PLAN with exact signatures
- Pitfalls: HIGH — grounded in codebase migrations and PITFALLS.md
- CORS: MEDIUM — wildcard origin confirmed as standard Supabase approach; Tauri-specific behavior is manual-only to verify

**Research date:** 2026-05-31
**Valid until:** 2026-08-31 (Supabase Edge Function API is stable; Deno 2.x is mature)
