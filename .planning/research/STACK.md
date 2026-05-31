# Stack Research

**Domain:** Credits ledger + provider-agnostic AI image generation via Supabase Edge Function
**Researched:** 2026-05-31
**Confidence:** HIGH (Edge Functions, supabase-js, storage patterns) / MEDIUM (provider pricing — market moves fast)

---

## Context: What is Fixed vs New

The existing stack (Tauri 2.0 + Vite + React + React Router + Zustand + Supabase Auth/Postgres/Storage/Realtime + `@supabase/supabase-js ^2.50.0`) is **not re-researched**. This document covers only additions for v0.3.0.

**New surface:** One Supabase Edge Function (`generate-image`) that:
1. Receives the user's request with their session JWT
2. Validates the JWT, gets the user ID
3. Atomically debits 1 credit (SQL RPC / stored procedure)
4. Calls the image generation provider via HTTP
5. Uploads the returned bytes to Supabase Storage
6. Returns a signed URL to the client
7. Refunds the credit on provider failure

**No new frontend libraries are needed.** All new capability lives in:
- SQL migrations (credit ledger schema + triggers)
- One Edge Function in `supabase/functions/generate-image/index.ts`

---

## Recommended Stack

### Core Technologies (new additions only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase Edge Functions (Deno runtime) | Deno 2.1.x (platform-managed) | Secure server-side function holding provider API key; performs atomic credit debit + provider call + storage upload | The only way to keep provider secrets off the client ANON key while staying 100% within Supabase infrastructure. No custom server needed. |
| `@supabase/supabase-js` (existing) | ^2.50.0 (already installed) | `supabase.functions.invoke()` from the frontend to call the Edge Function | Already in the project. The client automatically forwards the user session JWT on the Authorization header — no manual header passing needed from the calling code. |
| Supabase Storage (existing) | Platform-managed | Private bucket `generated-images` to persist generated images per-user | Already in the project; accessed from inside the Edge Function via `supabaseAdmin` client with service role key. |
| SQL stored procedure (SECURITY DEFINER) | Postgres 15 (platform) | Atomic credit debit + refund, mirroring the `point_events` pattern | PostgREST (supabase-js) does not support multi-statement transactions. The safe, proven pattern in this codebase is SECURITY DEFINER SQL functions called via `supabase.rpc()`. Keeps business-critical debit logic in Postgres where it can be audited and is transactionally safe. |

### Supporting: Image Generation Providers (adapter targets)

Three candidates researched. Only one will be wired at a time; the adapter interface is designed so swapping = changing one `Deno.env.get()` secret and one implementation file.

| Provider | Auth | Endpoint | Request Shape | Response Shape | Approx Cost / image | Notes |
|----------|------|----------|---------------|----------------|---------------------|-------|
| **Google Gemini Imagen 4** | `x-goog-api-key: $GEMINI_API_KEY` header | `POST https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict` | `{ instances: [{ prompt }], parameters: { sampleCount: 1 } }` | `candidates[0].content.parts[0].inline_data` → base64 bytes + mimeType | $0.02 (Fast) / $0.04 (Standard) / $0.06 (Ultra) | Returns base64 inline. No URL phase needed. Best value for "1 credit = 1 generation." |
| **OpenAI gpt-image-1** | `Authorization: Bearer $OPENAI_API_KEY` header | `POST https://api.openai.com/v1/images/generations` | `{ model: "gpt-image-1", prompt, n: 1, size: "1024x1024", quality: "low"\|"medium"\|"high", output_format: "png" }` | `data[0].b64_json` → base64 string | $0.011 (low) / $0.042 (medium) / $0.167 (high) at 1024×1024. Note: gpt-image-1 deprecates Oct 2026; gpt-image-1.5 is $0.009/$0.034/$0.133 | Returns base64. Requires org verification before use. |
| **Replicate** | `Authorization: Bearer $REPLICATE_API_TOKEN` header | `POST https://api.replicate.com/v1/predictions` | `{ version: "<model:version>", input: { prompt } }` | Async: poll status until `status === "succeeded"`, then `output` = array of HTTPS URLs | $0.003 (Flux Schnell) | Returns URL, not bytes — must `fetch()` the URL to get bytes before uploading to Storage. Requires async polling or `Prefer: wait=60` header. More complex flow. |

**Recommended initial provider: Google Imagen 4 Fast ($0.02/image).**
- Cheapest of the three for low-quality generation suitable for an MVP
- Returns base64 inline — no extra HTTP round-trip to fetch bytes
- Same API key family as Gemini (likely already familiar)
- Provider decision is still deferred (adapter pattern means this is swappable)

### Supporting: Deno standard library inside Edge Function

| Import | Source | Purpose |
|--------|--------|---------|
| `@supabase/supabase-js` | `npm:@supabase/supabase-js@2` | Admin client inside function for privileged storage + RPC calls |
| No additional Deno libs needed | — | `fetch()` is native in Deno; base64 decode via `atob()` + `Uint8Array` is built-in |

No npm packages beyond `@supabase/supabase-js` are needed inside the Edge Function. All HTTP calls to providers use native `fetch`.

---

## Architecture: Edge Function Integration Points

```
Frontend (React + supabase-js)
  │
  │  supabase.functions.invoke('generate-image', { body: { promptyId, prompt } })
  │  ← JWT auto-forwarded on Authorization header
  ▼
Edge Function: supabase/functions/generate-image/index.ts
  │
  ├─ 1. Validate user JWT (verify_jwt: true, platform-level; get uid via createClient + getUser)
  ├─ 2. Call SQL RPC: debit_credit(user_id) → fails if balance < 1 → returns { ok, newBalance }
  │     (SECURITY DEFINER stored proc — same pattern as record_copy / update_profile_points)
  ├─ 3. Call provider HTTP API (adapter dispatch on ACTIVE_PROVIDER env var)
  │     ├─ On success → base64 bytes
  │     └─ On failure → call SQL RPC: refund_credit(user_id) + return error
  ├─ 4. Upload bytes to Storage: supabaseAdmin.storage.from('generated-images').upload(path, bytes)
  ├─ 5. Create signed URL: supabaseAdmin.storage.from('generated-images').createSignedUrl(path, 3600)
  └─ 6. Return { signedUrl, newBalance } to client
```

---

## Scaffolding and CLI Commands

```bash
# Create the function
supabase functions new generate-image
# → creates supabase/functions/generate-image/index.ts

# Serve locally with secrets
supabase functions serve generate-image --env-file supabase/functions/.env.local

# Set secrets in production (never commit these)
supabase secrets set GEMINI_API_KEY=...
supabase secrets set OPENAI_API_KEY=...          # future
supabase secrets set REPLICATE_API_TOKEN=...     # future
supabase secrets set ACTIVE_PROVIDER=gemini      # adapter selector

# Deploy
supabase functions deploy generate-image
```

Secrets are available immediately after `secrets set` — no redeploy needed.

---

## Edge Function: JWT Validation Pattern

```typescript
// supabase/functions/generate-image/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // 1. Build a user-scoped client (RLS enforced, reflects caller's identity)
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  // 2. Validate the JWT and get the user
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })
  const userId = user.id

  // 3. Admin client for privileged operations (bypasses RLS for Storage + RPC)
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ... debit, generate, upload, return
})
```

Key points:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are **auto-injected** by the platform — no `secrets set` needed for these.
- `verify_jwt = true` (default) — platform rejects requests with invalid/missing JWTs before the function handler runs.
- `supabase.functions.invoke()` on the client **automatically forwards** the active session JWT. No manual header setup needed in React code.

---

## Credit Ledger: SQL Pattern (mirrors point_events)

New schema to add via migration:

```sql
-- credit_events: append-only, same shape as point_events
CREATE TABLE credit_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'signup_bonus' | 'level_up' | 'publish' | 'submit_result' | 'image_gen' | 'refund'
  delta      INTEGER NOT NULL, -- positive = earn, negative = spend
  ref_id     UUID,             -- optional: prompty_id or generation_id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- profiles: add credits column
ALTER TABLE profiles ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;
```

Stored procedures needed (SECURITY DEFINER, called via `supabase.rpc()`):

```sql
-- Atomic debit: inserts -1 event + updates cache; errors if balance would go negative
CREATE OR REPLACE FUNCTION debit_credit(target_user UUID)
RETURNS INTEGER  -- returns new balance, or raises exception if insufficient
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance INTEGER;
BEGIN
  UPDATE profiles SET credits = credits - 1
    WHERE id = target_user AND credits >= 1
    RETURNING credits INTO new_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient_credits'; END IF;
  INSERT INTO credit_events (user_id, event_type, delta) VALUES (target_user, 'image_gen', -1);
  RETURN new_balance;
END;
$$;

-- Refund: inserts +1 event + updates cache (called on provider failure)
CREATE OR REPLACE FUNCTION refund_credit(target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles SET credits = credits + 1 WHERE id = target_user;
  INSERT INTO credit_events (user_id, event_type, delta) VALUES (target_user, 'refund', 1);
END;
$$;
```

The Edge Function calls these via `adminClient.rpc('debit_credit', { target_user: userId })` — service role bypasses RLS, but the function itself enforces the balance check atomically.

For award triggers (signup bonus, level-up, publish, submit result): same pattern as `award_points_on_test` — SECURITY DEFINER triggers on the relevant table inserts, calling a shared `award_credit(user_id, event_type, delta)` helper. Idempotent via `ON CONFLICT`.

---

## Storage: Private Bucket Pattern

```typescript
// Inside Edge Function, after provider returns base64 bytes:
const bytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
const path = `${userId}/${crypto.randomUUID()}.png`

const { error: uploadError } = await adminClient.storage
  .from('generated-images')
  .upload(path, bytes, { contentType: 'image/png', upsert: false })

// Signed URL for client to display (1-hour expiry)
const { data: { signedUrl } } = await adminClient.storage
  .from('generated-images')
  .createSignedUrl(path, 3600)
```

Bucket `generated-images` must be created as **private** (not public). RLS policy: users can only read their own objects (`storage.foldername(name)[1] = auth.uid()::text`). The Edge Function uses `supabaseAdmin` (service role) to upload, bypassing RLS legitimately.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Provider SDK npm packages (e.g., `@google/generative-ai`, `openai` npm) | Adds Deno import complexity; the provider APIs are simple REST — a `fetch()` call is sufficient and keeps the adapter thin | Raw `fetch()` with JSON — 10 lines per provider |
| Direct Postgres connection from Edge Function (e.g., `deno-postgres`) | Adds connection overhead and complexity; this project's pattern is SECURITY DEFINER RPCs, which are already proven and transactional | `supabase.rpc()` calling a SECURITY DEFINER stored procedure |
| Node.js server / Express / Hono custom server | Contradicts the project constraint "no custom backend in MVP"; adds infra to maintain | Supabase Edge Function handles this case |
| Provider API key in frontend env vars | VITE_* env vars are embedded in the Vite build and visible in the JS bundle | Secret stored only as Supabase Edge Function secret via `supabase secrets set` |
| Polling loop in React for Replicate async predictions | Requires long-running client-side state; fragile on mobile | If Replicate is chosen: use `Prefer: wait=60` HTTP header in the Edge Function to synchronize the call; client sees a single synchronous `invoke()` |
| Separate storage bucket per provider | Premature; provider is swappable but images are images | Single `generated-images` bucket with path `{userId}/{uuid}.{ext}` |
| `response_format: "url"` for OpenAI | URL output from OpenAI is a temporary CDN URL (expires ~60 min) and cannot be stored long-term | Always request `b64_json`; upload to Supabase Storage for persistence |

---

## Provider Adapter Interface

The Edge Function should dispatch via a single env var `ACTIVE_PROVIDER`:

```typescript
// supabase/functions/generate-image/_providers/types.ts
export interface ImageProvider {
  generate(prompt: string): Promise<{ bytes: Uint8Array; mimeType: string }>
}

// supabase/functions/generate-image/_providers/gemini.ts
// supabase/functions/generate-image/_providers/openai.ts
// supabase/functions/generate-image/_providers/replicate.ts

// index.ts dispatch:
const PROVIDER = Deno.env.get('ACTIVE_PROVIDER') ?? 'gemini'
const provider = PROVIDER === 'openai' ? new OpenAIProvider()
               : PROVIDER === 'replicate' ? new ReplicateProvider()
               : new GeminiProvider()
```

Swapping provider = `supabase secrets set ACTIVE_PROVIDER=openai` (no redeploy needed).

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SQL SECURITY DEFINER RPC for atomic debit | Direct Postgres connection via `deno-postgres` in Edge Function | Only if transaction logic grows too complex for a single stored proc; overkill here |
| Gemini Imagen 4 as initial provider | OpenAI gpt-image-1 | If image quality is more important than cost at launch (3-15x more expensive) |
| Single Edge Function `generate-image` | Separate functions per concern (debit-credit, call-provider, upload) | Only if concurrency or partial retry logic becomes complex enough to warrant separate invocations |
| Raw `fetch()` for provider calls | Provider SDK packages | If provider SDK adds meaningful type safety or automatic retry logic — not justified at this scale |
| Private Supabase Storage bucket | Return base64 directly to client | Base64 in API response is ~33% larger and wastes Edge Function memory; Storage is the right primitive for files |

---

## Installation

No new frontend `npm install` needed — `@supabase/supabase-js ^2.50.0` already covers `functions.invoke()`.

Inside the Edge Function (Deno import, not npm install):
```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'
// All provider calls use native Deno fetch() — no additional imports
```

New Supabase resources to provision:
```bash
# 1. Create private storage bucket (Dashboard or SQL)
# SQL: INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', false);

# 2. Scaffold Edge Function
supabase functions new generate-image

# 3. Set provider secret(s)
supabase secrets set ACTIVE_PROVIDER=gemini
supabase secrets set GEMINI_API_KEY=<your-key>

# 4. Deploy
supabase functions deploy generate-image
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@supabase/supabase-js ^2.50.0` | Supabase Edge Functions Deno runtime | `supabase.functions.invoke()` auto-forwards JWT since v2.x; no breaking changes expected |
| Deno 2.1.x (platform-managed) | `npm:@supabase/supabase-js@2` imports | Deno 2.x supports `npm:` specifier natively; no import map needed for this use case |
| Supabase CLI 2.99.0-beta.1 | Edge Functions Deno 2.1 | Current CLI version supports `supabase functions new`, `serve`, `deploy`, and `secrets set` |
| Gemini Imagen 4 API | Deno native `fetch()` | Pure HTTP — no SDK dependency, no compatibility risk |
| OpenAI Images API (gpt-image-1 / gpt-image-1.5) | Deno native `fetch()` | Pure HTTP — gpt-image-1 deprecates Oct 2026; migrate to gpt-image-1.5 if OpenAI is chosen |

---

## Sources

- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions) — scaffolding, deploy, secrets, Deno runtime (HIGH)
- [Supabase Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) — JWT validation pattern, `verify_jwt`, `ctx.supabase` (HIGH)
- [Supabase Edge Functions auth (legacy JWT pattern)](https://supabase.com/docs/guides/functions/auth-legacy-jwt) — `createClient` + `Authorization` header forwarding, `getUser()` pattern (HIGH)
- [Supabase Function Configuration](https://supabase.com/docs/guides/functions/function-configuration) — `verify_jwt`, `import_map`, `entrypoint` in `config.toml` (HIGH)
- [Supabase functions.invoke() reference](https://supabase.com/docs/reference/javascript/functions-invoke) — client-side invocation, automatic JWT forwarding (HIGH)
- [Supabase Storage createSignedUrl](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl) — signed URL for private bucket access (HIGH)
- [Gemini Imagen API docs](https://ai.google.dev/gemini-api/docs/imagen) — `imagen-4.0-generate-001` endpoint, request/response format, base64 inline_data (HIGH)
- [OpenAI Image Generation API](https://developers.openai.com/api/docs/guides/image-generation) — `gpt-image-1` endpoint, b64_json response, quality tiers (HIGH)
- [Replicate HTTP API](https://replicate.com/docs/reference/http) — predictions endpoint, polling / `Prefer: wait`, URL output (HIGH)
- [OpenAI pricing (via CostGoat)](https://costgoat.com/pricing/openai-images) — gpt-image-1 per-image cost by quality tier (MEDIUM — pricing changes)
- [Gemini Imagen 4 pricing](https://ai.google.dev/gemini-api/docs/pricing) — $0.02/$0.04/$0.06 per image Fast/Standard/Ultra (MEDIUM — pricing changes)
- [Replicate Flux Schnell pricing](https://replicate.com/docs) — ~$0.003/image (MEDIUM — varies by model/version)
- [Transactions and RLS in Supabase Edge Functions](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html) — RPC vs direct postgres; recommends stored proc RPC for this pattern (MEDIUM)
- [Edge Functions Deno 2.1 announcement](https://supabase.com/blog/supabase-edge-functions-deploy-dashboard-deno-2-1) — current Deno version, dashboard deploy (HIGH)

---
*Stack research for: Promptys v0.3.0 — Credits ledger + AI image generation*
*Researched: 2026-05-31*
