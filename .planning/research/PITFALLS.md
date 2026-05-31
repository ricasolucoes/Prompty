# Pitfalls Research

**Domain:** Credits economy + AI image generation in a Supabase-only client-side app (Tauri + React)
**Researched:** 2026-05-31
**Confidence:** HIGH — grounded in existing codebase patterns (RLS migrations, trigger conventions) and verified against Supabase official docs, Postgres documentation, and community CVE disclosures

---

## Critical Pitfalls

### Pitfall 1: Double-Spend via Concurrent Generate Clicks

**What goes wrong:**
User taps "Generate" twice in fast succession (or network lag causes two requests to race). Both Edge Function invocations read `profiles.credits = 1`, both pass the balance check, both debit 1 credit and call the provider — the user ends up with `credits = -1` and two provider invocations billed.

**Why it happens:**
The natural pattern is read-then-write: read balance from `profiles`, check > 0, insert spend row into `credit_events`, update `profiles.credits`. Between the read and the write, a second concurrent call sees the pre-debit balance. `supabase-js` has no client-side transaction primitive (PostgREST does not expose transactions), so naively chaining `.rpc()` calls does not protect you.

**How to avoid:**
Debit inside a single `SECURITY DEFINER` SQL function that acquires a row lock:

```sql
CREATE OR REPLACE FUNCTION spend_credit(
  p_user_id UUID,
  p_ref_id UUID,
  p_event_type TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Row-level lock: second concurrent call blocks here until first commits
  SELECT credits INTO current_credits FROM profiles
  WHERE id = p_user_id FOR UPDATE;

  IF current_credits < 1 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO credit_events (user_id, delta, event_type, ref_id)
  VALUES (p_user_id, -1, p_event_type, p_ref_id)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

  UPDATE profiles SET credits = credits - 1 WHERE id = p_user_id;
  RETURN TRUE;
END;
$$;
```

The Edge Function calls `supabase.rpc('spend_credit', {...})` — the lock inside the function serialises concurrent calls on that user's profile row. Add `ON CONFLICT DO NOTHING` on a unique constraint `(user_id, event_type, ref_id)` so a retry that somehow fires the function twice is harmless.

On the client, disable the generate button immediately on first tap and re-enable only after the Edge Function responds (success or error), preventing the second request from even being sent.

**Warning signs:**
- `profiles.credits` goes negative
- Duplicate rows in `credit_events` with same `user_id + ref_id`
- Provider invoiced for more generations than `credit_events` debits

**Phase to address:** Phase 4 (ledger schema) — `spend_credit` function and the `(user_id, event_type, ref_id)` unique constraint must exist before Phase 6 (generation) can call it.

---

### Pitfall 2: Client-Mutated Credits — Frontend Bypasses the Ledger

**What goes wrong:**
An authenticated user calls `supabase.from('profiles').update({ credits: 999 })` or inserts directly into `credit_events` from the browser, granting themselves arbitrary credits.

**Why it happens:**
The existing `point_events` table already blocks this correctly (`point_events_no_client_insert` policy: `WITH CHECK (false)`). The trap is forgetting to replicate the same pattern for `credit_events`. Since `profiles.credits` is a cache column, it also needs an UPDATE policy that only allows the server (SECURITY DEFINER functions) to change it — the current `profiles_update_own` policy (migration 002) would allow the client to UPDATE any `profiles` column they own, including `credits`.

**How to avoid:**
Mirror the `point_events` approach exactly:

```sql
-- credit_events: trigger/function-only writes, no client mutations
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_events_select_own" ON credit_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "credit_events_no_client_insert" ON credit_events
  FOR INSERT TO anon, authenticated WITH CHECK (false);
-- No UPDATE or DELETE policies — append-only via SECURITY DEFINER functions
```

For `profiles.credits` specifically: the existing `profiles_update_own` policy is broad. Either narrow it to only permit updating non-financial columns (username, avatar_url), or enforce the invariant via a `BEFORE UPDATE` trigger that prevents the `credits` column from being changed by the `authenticated` role directly (allow only `SECURITY DEFINER` callers).

The simplest hardening: add a trigger that raises an exception if `NEW.credits != OLD.credits` and `current_setting('role') != 'rls_bypassed'`, or split the financial cache into a separate table the client cannot UPDATE at all.

**Warning signs:**
- `profiles.credits` does not match `SUM(delta) FROM credit_events WHERE user_id = ?`
- A user has credits but `credit_events` has no corresponding row
- Any frontend code doing `supabase.from('profiles').update({ credits: ... })`

**Phase to address:** Phase 4 (ledger schema) — policy and trigger must be part of the migration, not a follow-up.

---

### Pitfall 3: Negative Balance Not Enforced at the Database Level

**What goes wrong:**
`profiles.credits` dips below 0. Even if the application checks balance before spending, a race (Pitfall 1) or a refund-then-spend sequencing error can produce a negative. No database-level constraint catches it.

**Why it happens:**
Application-layer checks are not atomic with the write.

**How to avoid:**
Add a CHECK constraint on the column and a non-negative guard inside `spend_credit`:

```sql
ALTER TABLE profiles ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);
```

The constraint acts as a last-resort safety net. Combined with `SELECT FOR UPDATE` in `spend_credit`, it makes negative balance a hard database error rather than a silent data corruption.

**Warning signs:**
- Any row in `profiles` with `credits < 0`

**Phase to address:** Phase 4 (ledger schema) — the CHECK constraint belongs in the initial `credit_events` migration.

---

### Pitfall 4: Provider API Key in the Frontend Bundle

**What goes wrong:**
The image generation provider key (Gemini / OpenAI / Replicate) is placed in a Vite env var (`VITE_PROVIDER_KEY`), bundled into the JS, and shipped inside the Tauri app binary. The key is extractable from the binary or intercepted in traffic, allowing anyone to bill the account directly.

**Why it happens:**
Convenience — calling the provider API directly from the React frontend feels like the obvious shortcut. The `VITE_` prefix is how Vite exposes env vars to the browser, and the Tauri app is still a browser-rendered SPA.

**How to avoid:**
The key must live only as a Supabase Edge Function secret (`supabase secrets set PROVIDER_API_KEY=...`). The Edge Function is the sole caller of the provider API. The frontend calls the Edge Function via the Supabase client (with the user's JWT for authentication), never the provider directly. No VITE_-prefixed provider key should ever exist.

This is already the confirmed architectural decision in PROJECT.md: "Edge Function guarda o secret e debita crédito atomicamente." Do not create a fallback path.

**Warning signs:**
- Any `VITE_GEMINI_KEY`, `VITE_OPENAI_KEY`, `VITE_REPLICATE_TOKEN` in `.env` or source
- Provider API calls originating from the Tauri app process (visible in network inspector) that do not go through `*.supabase.co/functions`

**Phase to address:** Phase 6 (generation Edge Function) — the secret must be set via CLI before the function is deployed. Add a CI check or pre-deploy step that asserts no `VITE_*PROVIDER*` env var exists.

---

### Pitfall 5: Charged but No Image — Storage Write Fails After Provider Succeeds

**What goes wrong:**
The Edge Function sequence is: (1) debit credit, (2) call provider, (3) upload image to Supabase Storage, (4) insert row into `generated_images`. The provider succeeds and bills the API account, but step 3 or 4 fails (storage quota exceeded, network timeout, bucket policy misconfiguration). The user is debited and gets nothing.

**Why it happens:**
The sequence is not atomic. Steps 2–4 are three separate external calls; no distributed transaction covers them. Storage upload is particularly fragile on the Supabase free tier (1 GB total storage, 50 MB max file size per object).

**How to avoid:**
Design the Edge Function as: debit → call provider → on provider success, write to storage AND DB → on any post-debit failure, issue refund immediately:

```typescript
// Inside the Edge Function (pseudo-code)
const debited = await supabase.rpc('spend_credit', { p_user_id: userId, p_ref_id: genId, p_event_type: 'generate' });
if (!debited) return error(402, 'Insufficient credits');

let imageUrl: string;
try {
  imageUrl = await callProvider(prompt);
} catch (providerError) {
  await supabase.rpc('refund_credit', { p_user_id: userId, p_ref_id: genId });
  return error(502, 'Provider failed');
}

try {
  await supabase.storage.from('generated-images').upload(path, imageBlob);
  await supabase.from('generated_images').insert({ user_id: userId, image_url: imageUrl, ... });
} catch (storageError) {
  await supabase.rpc('refund_credit', { p_user_id: userId, p_ref_id: genId });
  return error(500, 'Storage failed — credit refunded');
}
```

`refund_credit` is a companion SECURITY DEFINER function that inserts a `+1` row into `credit_events` and updates `profiles.credits`. It should be idempotent: `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` on the refund row.

Important: if the Edge Function itself times out (150 s free tier wall clock) after the provider responds but before storage write completes, the refund path does not execute. Mitigate by: (a) keeping the provider call as early as possible, (b) setting a request timeout lower than the Edge Function wall clock so you have headroom for the refund RPC.

**Warning signs:**
- `credit_events` has a `generate` debit row for a `ref_id` with no corresponding row in `generated_images`
- Automated reconciliation query: `SELECT ce.ref_id FROM credit_events ce LEFT JOIN generated_images gi ON gi.id = ce.ref_id WHERE ce.event_type = 'generate' AND gi.id IS NULL`

**Phase to address:** Phase 6 (generation Edge Function) — the refund path must be part of the initial implementation, not a later hardening task. `refund_credit` function should be created in Phase 4 alongside `spend_credit`.

---

### Pitfall 6: Signup Bonus Fires Multiple Times (Non-Idempotent handle_new_user)

**What goes wrong:**
The existing `handle_new_user` trigger inserts a `profiles` row `ON CONFLICT (id) DO NOTHING` — correct for the profile. But if the credit-bonus insert is added naively to the same function without its own idempotency guard, email confirmation re-fires, OAuth token refresh, or Supabase internal retry of the auth.users trigger can insert two or more `+1` bonus rows.

**Why it happens:**
Supabase Auth triggers on `auth.users INSERT` can fire more than once in edge cases (email confirmation flow, row replication, dev environment reseeds). The existing pattern handles this for profiles via `ON CONFLICT DO NOTHING`, but a separate `credit_events` insert inside the same trigger function needs the same treatment.

**How to avoid:**
Add a unique constraint on `credit_events` for `(user_id, event_type)` where `event_type = 'signup_bonus'`:

```sql
-- Partial unique index: only one signup_bonus per user, ever
CREATE UNIQUE INDEX credit_events_signup_bonus_once
  ON credit_events (user_id)
  WHERE event_type = 'signup_bonus';
```

Inside the trigger:

```sql
INSERT INTO credit_events (user_id, delta, event_type, ref_id)
VALUES (NEW.id, 1, 'signup_bonus', NEW.id)
ON CONFLICT DO NOTHING;  -- partial index handles the idempotency
```

This is the exact pattern used in migration 003 for `point_events` with `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING`. The signup bonus needs the partial index variant because there is no `ref_id` concept (or ref_id = user id), not a prompty UUID.

**Warning signs:**
- Any user with more than one `credit_events` row with `event_type = 'signup_bonus'`
- `profiles.credits` is 2 for a new user who has done nothing

**Phase to address:** Phase 4 (ledger schema) — the partial unique index must be in the migration that creates `credit_events`.

---

### Pitfall 7: Earn-Credit Triggers Not Capped — Credit Farming via Repeated Actions

**What goes wrong:**
Actions that award credits (submit result, level-up, publish prompty) are not capped per user per period. A user creates multiple accounts, publishes minimal promptys from each, collects signup bonuses and publish credits, then uses all credits on the primary account if they can be transferred — or just farms image generations per-account.

**Why it happens:**
The earn triggers mirror the existing `point_events` award functions without adding credit-specific anti-abuse limits. The like daily cap (migration 003: `today_likes < 10`) shows the pattern exists but it must be replicated for each credit-earning action.

**How to avoid:**
- Each earn trigger must check both the action-level uniqueness (`ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` — already prevents double-earning the same action) AND a periodic cap if the action is repeatable.
- Signup bonus is inherently one-time (partial unique index from Pitfall 6).
- Level-up credit: `event_type = 'level_up'`, `ref_id = new_level`. One per level, enforced by unique index.
- Publish credit: one per published prompty (`ref_id = prompty_id`), already handled by `ON CONFLICT`.
- Submit result credit: one per approved result (`ref_id = result_id`) — require `prompty_results.approved = true` before awarding, so a user cannot spam unapproved results.
- Multi-account: prevent by enforcing email verification before any credit is awarded. New accounts with unverified email should not receive signup bonus immediately — delay the trigger to fire on email confirmation, not on signup.

Transfers between accounts are not in scope; do not build credit transfer functionality.

**Warning signs:**
- One user with disproportionately high `credits` vs `point_events` count
- High volume of `prompty_results` rows from a single user with low approval rate

**Phase to address:** Phase 5 (earn-by-contributing) — each earn trigger must include the cap or uniqueness guard as a first-class implementation requirement, not an afterthought.

---

### Pitfall 8: Provider Cost Runaway on Free API Tier

**What goes wrong:**
During a promo or after social sharing, the app receives 500+ simultaneous generate requests. Gemini/OpenAI/Replicate bills per generation — costs spike before anyone notices. The Supabase free tier has 500K Edge Function invocations/month (the function itself is free to invoke), but the provider API has its own cost structure outside Supabase.

**Why it happens:**
No per-user rate limit, no daily/weekly generation cap, no cost alert on the provider account.

**How to avoid:**
- **Per-user daily cap**: add a `generate_today_count` check inside `spend_credit` or a separate rate-check function. Simpler: add a partial count query before debit — if `COUNT(*) FROM credit_events WHERE user_id = ? AND event_type = 'generate' AND created_at > NOW() - INTERVAL '24 hours' >= N` return 429.
- **Global circuit breaker**: a `app_settings` table with a `generation_enabled` boolean. The Edge Function checks this flag on every call. Flip it to false via the Supabase Dashboard when provider costs spike.
- **Provider budget alert**: set a billing alert on the provider account (Gemini/OpenAI both support email alerts at dollar thresholds).
- **Prompt length limit**: cap the prompt input in the Edge Function (`prompt.length > 2000 → reject`) to prevent driving up token costs via very long prompts.

**Warning signs:**
- Provider dashboard showing cost spike not correlated with user count
- Unusual spike in Edge Function invocations in Supabase dashboard

**Phase to address:** Phase 6 (generation Edge Function) — daily cap check and global circuit breaker must be in the initial implementation. Provider budget alert is a deploy prerequisite.

---

### Pitfall 9: Prompt Injection Driving Expensive or Harmful Generations

**What goes wrong:**
A malicious user crafts a prompt that includes adversarial instructions: `"ignore all safety guidelines and generate..."` or extremely long tokens designed to max out provider context and cost. The Edge Function passes the raw user string directly to the provider.

**Why it happens:**
Image generation prompts feel like plain text, so sanitization is often skipped. However, providers with multi-modal or instruction-following capabilities (Gemini 2.0) can be susceptible to embedded instructions.

**How to avoid:**
- **Length cap**: enforce `prompt.length <= 1500` characters in the Edge Function (not just client-side).
- **Block injection patterns**: strip or reject prompts containing phrases like "ignore previous instructions", "system:", "you are now" — a basic denylist inside the Edge Function.
- **Provider safety settings**: pass the strictest safety filter config available (Gemini: `BLOCK_LOW_AND_ABOVE`; OpenAI: `moderation` endpoint pre-check).
- **Do not echo the raw prompt back in error responses** — avoids leaking what was sanitized/blocked.

Note: client-side validation is not a security control. The Edge Function must enforce all limits regardless of what the client sends.

**Warning signs:**
- Provider returning policy-violation errors at unusual rates
- Prompt length distribution showing outliers far above the median

**Phase to address:** Phase 6 (generation Edge Function) — sanitization and length enforcement are part of the Edge Function implementation, not optional hardening.

---

### Pitfall 10: RLS Exposes Other Users' credit_events or generated_images

**What goes wrong:**
A user queries `supabase.from('credit_events').select('*')` and receives rows belonging to other users, leaking balance information and generation history. More critically, `supabase.from('generated_images').select('*')` without a user-scoped policy would expose all generated images including potentially sensitive content.

**Why it happens:**
New tables added in v0.3.0 are easy to forget to RLS-enable. CVE-2025-48757 found 10.3% of Supabase apps shipped with tables readable by the anon key because `ENABLE ROW LEVEL SECURITY` was not called. The Supabase dashboard does not block table creation without RLS.

The existing `point_events_select_own` policy (migration 002) shows the correct pattern. The trap is not copying it for `credit_events` and `generated_images`.

**How to avoid:**
Every new table in v0.3.0 migrations must include:
```sql
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_events_select_own" ON credit_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_images_select_own" ON generated_images
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- No anon read — generated images are private by default
```

For the Storage bucket `generated-images`, the bucket must be **private** (not public), and the Storage RLS policy must scope objects to the owning user's folder (same pattern as `prompty-covers` in migration 007: `auth.uid()::text = (storage.foldername(name))[1]`).

**Warning signs:**
- `supabase.from('credit_events').select('*')` from an anon session returns rows (should return 0 rows or 401)
- `supabase.from('credit_events').select('*')` from user A returns rows with `user_id != user_A_id`

**Phase to address:** Phase 4 (ledger schema) — RLS must be in the same migration as table creation, never deferred.

---

### Pitfall 11: Edge Function JWT Verification Bypassed or Misconfigured

**What goes wrong:**
The `generate-image` Edge Function has `verify_jwt = false` (set in `config.toml`) to "simplify testing", allowing unauthenticated callers to trigger provider invocations and spend credits. Or: the function checks the JWT manually but makes a mistake (e.g., only checks that a token exists, not that it is valid), allowing a tampered token.

**Why it happens:**
`verify_jwt = false` is a common local dev shortcut that gets committed. Manual JWT verification is error-prone.

**How to avoid:**
- Keep `verify_jwt = true` (the default) for all functions that spend credits or interact with the provider. Never commit `verify_jwt = false` to production config.
- Use `auth: 'user'` via `withSupabase` wrapper so `ctx.supabase` is already scoped to the caller's RLS policies — the platform verifies the JWT before the handler runs.
- In the Edge Function, confirm `const { data: { user } } = await ctx.supabase.auth.getUser()` returns a non-null user before proceeding.
- Never trust `user_id` from the request body — derive it from the verified JWT only.

**Warning signs:**
- Edge Function returns 200 to a request with no Authorization header or a clearly fake JWT
- `user_id` in the request body does not match the JWT `sub` claim but is accepted

**Phase to address:** Phase 6 (generation Edge Function) — JWT enforcement is a day-one requirement for the Edge Function, not a later security pass.

---

### Pitfall 12: CORS Misconfiguration Breaks Tauri Webview Invocations

**What goes wrong:**
The Edge Function returns 403 or a CORS error for requests from the Tauri webview. Tauri on Android uses a custom URL scheme (`http://tauri.localhost`) or the Tauri asset protocol. The Edge Function's CORS allow-list only contains `https://your-project.supabase.co` or is set to `*` without allowing the necessary headers, breaking the OPTIONS preflight.

**Why it happens:**
The Supabase CORS guide covers browser origins. Tauri webview origins are non-standard and are easy to miss. Additionally, a reported 2025 bug causes Supabase Edge Functions to truncate the `Access-Control-Allow-Headers` header to only the first four entries during OPTIONS responses, blocking custom headers.

**How to avoid:**
- Import CORS headers from the Supabase SDK (`@supabase/supabase-js v2.95.0+`): `import { corsHeaders } from '@supabase/supabase-js/cors'` — this keeps headers in sync with SDK updates.
- Explicitly handle `OPTIONS` preflight: `if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })`.
- Add the Tauri webview origin to the allow-list: `http://tauri.localhost`, `tauri://localhost`, and `https://tauri.localhost`.
- Test the Edge Function from the actual Tauri build (not just a browser), especially on Android.

**Warning signs:**
- Edge Function works in the browser test but returns CORS error in the Tauri build
- Network logs showing OPTIONS requests without a matching 200 response

**Phase to address:** Phase 6 (generation Edge Function) — CORS must be verified in the Tauri build before the feature is considered complete.

---

### Pitfall 13: Supabase Free Tier Auto-Pause Kills Edge Functions Mid-Session

**What goes wrong:**
The project pauses after 7 days of no database requests (this already happened once on this project). After the pause, the first user to open the app gets a cold-start delay of 10–30 seconds while the project resumes. If a user attempts image generation during this window, the Edge Function call may fail (503) or timeout before the DB is accepting connections, resulting in a charge to the user without a response.

**Why it happens:**
Free tier projects auto-pause on inactivity. The Edge Function invokes the DB as its first action (`spend_credit` RPC) — if the DB is still resuming, the RPC fails.

**How to avoid:**
- **Prevent the pause**: add a scheduled ping. A GitHub Actions cron workflow running every 5 days, calling any public Supabase endpoint (e.g., a health-check RPC), is sufficient. Alternatively, use an external uptime monitor (UptimeRobot free tier).
- **Handle gracefully on the client**: if the Edge Function returns a 503 or times out, do not debit the user (the `spend_credit` RPC would have failed before any debit happened). Show a "Server is waking up, please try again in a moment" message.
- **Retry with backoff**: a single automatic retry after 10 seconds on 503 covers most cold-start windows without duplicating charges (idempotency key on the generation request prevents double-spend even if the retry races).

Note: Edge Function cold starts themselves are fast (milliseconds) per Supabase docs. The slow part is the Postgres instance resuming, not the function boot.

**Warning signs:**
- 503 errors from Edge Functions first thing in the morning or after weekends
- Supabase dashboard shows project in "Paused" state

**Phase to address:** Phase 6 (generation feature) — the keep-alive mechanism should be set up at the same time the feature is shipped. Add the GH Actions workflow in the same PR.

---

### Pitfall 14: Edge Function Timeout During Slow Provider Response

**What goes wrong:**
Image generation APIs take 5–20 seconds depending on provider, model, and load. On the free tier, the Edge Function wall-clock timeout is 150 seconds — sufficient, but if the function idles (waiting for the provider) and the provider hangs without sending bytes, the idle timeout (also 150 s on free) may cut the connection. The user sees a timeout; the provider may have already billed and started the generation.

**Why it happens:**
Provider APIs do not always stream a heartbeat while generating. A connection that is open but silent for >150 s will be terminated by the Supabase gateway.

**How to avoid:**
- Set an explicit `AbortController` timeout on the provider fetch call shorter than the Edge Function wall-clock limit: `signal: AbortSignal.timeout(120_000)` (120 s). This ensures the function has time to run the refund path before the gateway kills it.
- If the provider supports streaming (Server-Sent Events), use streaming to keep the connection alive and send progress to the client.
- Design the refund path (Pitfall 5) to execute within the remaining time budget after provider timeout.

**Warning signs:**
- Supabase Edge Function logs showing `504 Gateway Timeout` or shutdown reason `"wall_clock_limit_exceeded"`
- Orphaned debit rows with no corresponding generation (same reconciliation query as Pitfall 5)

**Phase to address:** Phase 6 (generation Edge Function) — timeout and abort controller are part of the initial implementation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `profiles.credits` as the only balance source (no ledger) | Simple, single column to query | No audit trail; no way to debug incorrect balances; cannot reconcile without full history | Never — the ledger `credit_events` is the source of truth; cache is derived |
| `verify_jwt = false` in Edge Function config | Easier local testing | Production function accepts unauthenticated requests; any caller can drain provider budget | Only in local dev, never committed |
| Direct `profiles.update({ credits })` from frontend | Avoids RPC call | Bypasses SECURITY DEFINER guard; client can set arbitrary balance | Never |
| Skipping CORS for internal testing | Faster iteration | Tauri build fails on first attempt; CORS is harder to debug in native app context | Never — handle from day one |
| No rate limit on generation | Simpler implementation | Single viral event drives provider bills to hundreds of dollars | Never — add daily cap before shipping |
| Bucket `public: true` for generated images | CDN-cacheable, fast delivery | All generated images accessible to anyone with the URL, no user privacy | Only if images are explicitly marked public by the user; default to private |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RPC (`spend_credit`) | Checking return value as truthy without handling `null` (network error) vs `false` (insufficient credits) | Check both: `data === false` means no credits; `error !== null` means system failure — treat differently |
| Supabase Storage (generated-images bucket) | Using `supabase.storage.from(...).upload()` with the anon key from inside the Edge Function | Use the service-role client inside the Edge Function for storage writes; the user's JWT client cannot write to a private bucket without a permissive Storage policy |
| Provider API (Gemini / OpenAI / Replicate) | Retrying the provider call on timeout without tracking whether the first call succeeded | Use a generation idempotency key passed to the provider if supported; otherwise, do not retry automatically — let the user retry manually |
| Tauri invoke vs Edge Function | Calling the provider via a Tauri Rust command instead of the Edge Function to avoid CORS | Rust commands can't hold provider secrets securely either (binary is inspectable); Edge Function remains the only correct path |
| `handle_new_user` trigger extension | Adding credit bonus at the end of the existing function without idempotency | Add `ON CONFLICT DO NOTHING` on a unique partial index, as described in Pitfall 6 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `SUM(delta) FROM credit_events` on every balance read | Balance query slows as ledger grows per user | `profiles.credits` cache column exists for this — always read the cache, recompute from ledger only in reconciliation/admin queries | After ~1,000 credit events per user (unlikely on free tier but good practice) |
| No index on `credit_events(user_id, created_at)` | Per-user history query scans entire table | Add composite index: `CREATE INDEX ON credit_events (user_id, created_at DESC)` | At ~10K total rows |
| No index on `generated_images(user_id)` | User's generation history slow | Add index: `CREATE INDEX ON generated_images (user_id)` | At ~5K rows |
| Edge Function cold start + DB resume stacked | First request after inactivity takes 30+ seconds | Keep-alive cron (Pitfall 13) | Every 7 days on free tier if no traffic |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `service_role` key in any `.env` file committed to git | Full DB bypass for anyone with repo access | Use `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only in frontend env; provider key is a Supabase secret set via CLI, never in `.env` |
| `credit_events` without RLS | Any anon caller can read all users' ledger history | `ENABLE ROW LEVEL SECURITY` + `select_own` policy in same migration as table creation |
| Provider API key in Edge Function source code (hardcoded) | Key exposed in GitHub repo | Always use `Deno.env.get('PROVIDER_API_KEY')` — set via `supabase secrets set` |
| Trusting `user_id` from request body | User passes another user's ID to generate on their credits | Derive user ID from verified JWT only: `ctx.supabase.auth.getUser()` |
| `generated_images` bucket set to `public: true` | All generated images world-readable by URL | Default to private bucket; sign URLs for display (short TTL) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Button stays enabled after first generate tap | User double-taps, sees confusing duplicate/error | Disable button on first tap, show spinner, re-enable only on complete or error response |
| Generic "Generation failed" without refund confirmation | User worries about lost credit | Always state explicitly "Your credit was refunded" when refund path executes |
| Showing raw provider error message | Confusing (API jargon, model names) and potentially leaks system details | Map all provider errors to user-facing strings: "Image could not be generated. Try a different prompt." |
| No progress indicator during 5–20 s generation | User thinks app is frozen | Show an animated placeholder or progress bar with estimated wait time |
| Balance shown as number only (e.g., "1 credit") | User doesn't understand what a credit is on first load | On first visit, show "1 credit = 1 in-app image generation" inline tooltip |

---

## "Looks Done But Isn't" Checklist

- [ ] **Ledger RLS:** `credit_events` has `ENABLE ROW LEVEL SECURITY` AND a `select_own` policy AND a `no_client_insert` block — verify all three exist in the migration
- [ ] **profiles.credits mutation block:** Confirm no client code does `.update({ credits: ... })` on profiles — search codebase for `credits` in any `.update(` call
- [ ] **Signup bonus idempotency:** Run `handle_new_user` trigger twice for the same user in a test migration and confirm `credit_events` has exactly one bonus row
- [ ] **spend_credit atomicity:** Run two concurrent calls to `spend_credit` for a user with 1 credit — confirm only one succeeds, final balance is 0 not -1
- [ ] **Refund on provider failure:** Mock the provider to return 500 — confirm the user's balance is restored and `credit_events` shows a matching `+1 refund` row
- [ ] **JWT required:** Call the generate Edge Function with no Authorization header — confirm 401, not 200
- [ ] **Tauri CORS:** Run the generate flow from the actual Tauri Android build — confirm no CORS error in device logs
- [ ] **Storage bucket private:** Confirm `generated-images` bucket has `public: false` and Storage RLS restricts reads to `owner_id`
- [ ] **Daily cap:** Trigger more than the allowed daily generations per user — confirm the function rejects with the cap message
- [ ] **No VITE_ provider key:** `grep -r "VITE_.*KEY\|VITE_.*TOKEN" src/` returns no provider credentials

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double-spend discovered in production | MEDIUM | Run reconciliation query to find users with `credits < 0` or duplicate debit rows; issue compensating `+1` credit_events rows via admin SQL; add `SELECT FOR UPDATE` in spend_credit retrospectively |
| Provider API key leaked (in binary or git) | HIGH | Rotate key immediately in provider dashboard; rotate Supabase secret (`supabase secrets set`); audit provider billing for unauthorized usage; force-redeploy Edge Function |
| Mass credit farming discovered | MEDIUM | Identify offending accounts via SQL audit; zero-balance via admin `credit_events` debit rows; add missing uniqueness constraints; consider rate-limiting by email domain |
| Supabase project paused during generation wave | LOW | Unpause via dashboard; add keep-alive cron; affected users had their requests fail before debit (spend_credit RPC would have failed) — no refund needed if `spend_credit` failed atomically |
| Free tier storage quota hit (1 GB) | MEDIUM | Delete oldest generations via admin query; compress images before storage upload (target <200KB per image); upgrade to Pro or add external CDN for generated images |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Double-spend (concurrent clicks) | Phase 4 — ledger schema (`spend_credit` + `SELECT FOR UPDATE`) | Concurrent test: 2 simultaneous calls for 1-credit user → only one succeeds |
| Client-mutated credits | Phase 4 — RLS `no_client_insert` + profiles mutation block | Attempt `profiles.update({ credits: 999 })` from authenticated client → returns error |
| Negative balance | Phase 4 — `CHECK (credits >= 0)` constraint | Attempt to debit user with 0 credits → `spend_credit` returns false, constraint blocks |
| Provider API key in frontend | Phase 6 — Edge Function secrets, never VITE_ | `grep -r VITE_ .env` finds no provider key; provider traffic only through `*.supabase.co/functions` |
| Charged but no image (storage failure) | Phase 6 — refund path in Edge Function | Mock storage failure → refund row appears in `credit_events` |
| Signup bonus fires multiple times | Phase 4 — partial unique index on signup_bonus | Replay `handle_new_user` twice → exactly one bonus row |
| Credit farming via earn actions | Phase 5 — per-action caps and uniqueness constraints | Replay same earning action 5 times → only one credit row |
| Provider cost runaway | Phase 6 — daily cap check + circuit breaker flag | Exceed daily cap → Edge Function returns 429 |
| Prompt injection | Phase 6 — length cap + denylist in Edge Function | Send 2000-char adversarial prompt → Edge Function rejects before provider call |
| RLS exposes other users' rows | Phase 4 — RLS on credit_events + generated_images | Authenticated user queries `credit_events` → receives only own rows |
| JWT verification bypassed | Phase 6 — `verify_jwt = true` in config.toml | Call Edge Function with no JWT → 401 |
| CORS breaks Tauri webview | Phase 6 — CORS headers + OPTIONS handler | Run from Tauri Android build → no CORS error in device logs |
| Auto-pause kills cold start | Phase 6 (deploy) — keep-alive cron | Project receives no traffic for 6 days → cron fires on day 5, project stays live |
| Edge Function timeout during slow generation | Phase 6 — AbortController at 120 s | Mock 130 s provider delay → function returns error with refund before 150 s wall clock |

---

## Sources

- [Transactions and RLS in Supabase Edge Functions — Marmelab (Dec 2025)](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html)
- [Securing Edge Functions — Supabase Docs](https://supabase.com/docs/guides/functions/auth)
- [CORS in Edge Functions — Supabase Docs](https://supabase.com/docs/guides/functions/cors)
- [Edge Functions Limits — Supabase Docs](https://supabase.com/docs/guides/functions/limits)
- [Edge Functions Architecture — Supabase Docs](https://supabase.com/docs/guides/functions/architecture)
- [Manage Edge Function Invocations usage — Supabase Docs](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations)
- [Understanding API Keys — Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security — Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage Access Control — Supabase Docs](https://supabase.com/docs/guides/storage/security/access-control)
- [CVE-2025-48757: Supabase RLS misconfiguration analysis — VibeAppScanner](https://vibeappscanner.com/supabase-row-level-security)
- [Is Supabase Safe for Production? — VibeAppScanner](https://vibeappscanner.com/is-supabase-safe)
- [SELECT FOR UPDATE and concurrent credits — Stormatics / PostgreSQL docs](https://stormatics.tech/blogs/select-for-update-in-postgresql)
- [Supabase Edge Function Error Handling — DEV Community](https://dev.to/kanta13jp1/supabase-edge-function-error-handling-retries-logging-and-idempotency-2nh0)
- [Supabase Free Tier Limits 2026](https://www.itpathsolutions.com/supabase-free-tier-limits)
- [Prompt Injection — OWASP Foundation](https://owasp.org/www-community/attacks/PromptInjection)
- Existing codebase: `supabase/migrations/20260507000002_rls_policies.sql` — `point_events_no_client_insert` pattern
- Existing codebase: `supabase/migrations/20260507000003_triggers_points.sql` — `ON CONFLICT DO NOTHING` idempotency pattern, daily like cap
- Existing codebase: `supabase/migrations/20260512000007_phase3_criador.sql` — Storage RLS folder-scoping pattern

---
*Pitfalls research for: credits economy + AI image generation in Supabase-only client-side app (Tauri)*
*Researched: 2026-05-31*
