# Project Research Summary

**Project:** Promptys v0.3.0 — Créditos + Geração de Imagem In-App
**Domain:** Credits economy + provider-agnostic AI image generation via Supabase Edge Function
**Researched:** 2026-05-31
**Confidence:** HIGH

## Executive Summary

Promptys v0.3.0 adds a credits economy and in-app AI image generation to an existing Tauri + React + Supabase SPA. The correct approach is a mirror of the existing `point_events` pattern: an append-only `credit_events` ledger written exclusively by SECURITY DEFINER triggers and a single Edge Function, with a cached `profiles.credits` column as the read surface. No new frontend libraries are needed. All new capability lives in SQL migrations and one Edge Function (`generate-image`). The 3-phase split is natural and validated by the dependency graph: Phases 4 and 5 (ledger + earn mechanics) are fully provider-independent and can be built and tested without any provider decision or API key; only Phase 6 (generation) requires a provider choice.

The recommended initial provider is Google Imagen 4 Fast at $0.02/image. The adapter pattern means this is swappable by changing one environment secret — the provider decision does not block Phases 4–5. The Edge Function is the only actor that holds the provider API key and the only actor that can perform a credit debit; the client-side role is purely read-and-display. This is a deliberate trust boundary, not an optional hardening step.

The most dangerous risks are all preventable with patterns already proven in this codebase: double-spend prevented by `SELECT FOR UPDATE` + `pg_advisory_xact_lock` inside `spend_credit()`; client balance manipulation prevented by an RLS block on `credit_events` INSERT plus a mutation guard on `profiles.credits`; signup bonus duplication prevented by a partial unique index; refund-on-failure as a compensating ledger event; and Supabase free-tier auto-pause mitigated by a keep-alive cron. Every guardrail must be built in the same phase that introduces the underlying feature — none can be deferred as later hardening.

---

## Key Findings

### Recommended Stack

The existing stack is unchanged. v0.3.0 adds exactly two new infrastructure elements: a SQL migration adding `credit_events` + `generations` tables and associated stored procedures, and one Supabase Edge Function (`generate-image`). No npm packages are added to the frontend. Inside the Edge Function, `@supabase/supabase-js` is imported via Deno's `npm:` specifier and all provider calls use native `fetch()`.

**Core technologies (new additions only):**
- `Supabase Edge Functions (Deno 2.1.x)` — secret holder + atomic orchestrator — the only way to keep provider API keys off the client while staying 100% within Supabase infrastructure; no custom server needed
- `SQL SECURITY DEFINER stored procedures` — atomic credit debit/refund — PostgREST has no multi-statement transaction primitive; SECURITY DEFINER RPCs are the established codebase pattern (mirrors `award_points_on_test`, `update_profile_points`)
- `Supabase Storage bucket (prompty-generations, private)` — persist generated images — accessed from Edge Function via service-role client; users receive short-TTL signed URLs, never direct bucket access
- `Google Imagen 4 Fast ($0.02/image)` — initial provider — base64 inline response (no extra HTTP round-trip), swappable via `ACTIVE_PROVIDER` secret without redeploy

**Critical version note:** `gpt-image-1` deprecates October 2026 — if OpenAI is chosen over Gemini, plan migration to `gpt-image-1.5` before that date. The adapter pattern makes this a one-file change.

### Expected Features

**Must have (table stakes — v0.3.0):**
- Credit ledger (`credit_events` + `profiles.credits`) — foundational; all other credit features depend on it
- Signup bonus (+1 credit, idempotent via partial unique index) — conversion hook; industry standard
- Atomic debit before generation starts — prevents double-spend; non-negotiable
- Auto-refund on provider failure — users must never be charged for a broken generation (Photoroom, Luma AI, PixAI all do this automatically)
- Visible credit balance in UI — trust signal; updates from Edge Function response payload, no polling needed
- Generation loading UX (skeleton + time estimate) — AI gen takes 5–20s; blank spinner causes abandonment at ~5s
- Zero-balance earn-more nudge with specific actions listed — soft engagement, not a hard paywall
- Anonymous CTA: "Cadastre-se e ganhe 1 crédito" — specific, not generic
- Anti-abuse daily caps on earn actions — server-side in SECURITY DEFINER triggers; cannot be client-enforced

**Should have (differentiators — v0.3.0):**
- Earn credits by contributing (level-up, publish, approved result) — aligns with community-library identity; reinforces L1→L2→L3 loop
- Generation scoped to current prompty's template — contextual "Generate with this prompt"; prompt fills automatically from `prompty_id`
- Provider-agnostic adapter — `ACTIVE_PROVIDER` env var; swapping = one secret change, no UI change

**Defer (v0.3.x after validation):**
- Generated result → submit as community result (defer until generation baseline is confirmed)
- Per-provider latency estimate in UI (calibrate after provider is chosen)
- Daily generation remaining counter (add if abuse becomes a support issue)

**Defer (v1.x+, explicit monetization decision required):**
- Credit purchase / top-up — requires IAP (Google Play / App Store), payment processor, tax handling; contradicts "gratuito, calmo" brand
- Generation history page — requires storage budget + moderation strategy
- Referral credits — self-referral farming requires phone/identity verification

**Anti-features (never build):**
- Quality-based refund requests (user marks result "bad") — subjective, easily abused, support burden at 1-credit cost
- Daily login bonus credits — hollow engagement, inflates economy unpredictably, clashes with Promptys identity
- Multiple images per generation — costs 4x provider budget, confusing UX for L1/L2 users

### Architecture Approach

The new subsystem is structurally identical to the existing `point_events` system and shares its trust model: the ledger is append-only, all writes happen via SECURITY DEFINER functions/triggers, and the client only reads the cached aggregate column (`profiles.credits`). The Edge Function is the only new actor — it is the sole holder of the provider API key and the only entity that can perform a credit debit. The frontend gains two new hooks (`useCredits` — 5-line selector over `useAuthStore`; `useGenerate` — Edge Function invocation state machine) and one modified page (`PromptyDetailPage` adds `GenerateButton` for authenticated users and `SignupCTA` for anonymous users). `auth.store.ts` is unchanged — `refetchProfile()` already handles the new `credits` column automatically.

**Major components:**
1. `credit_events` table + SECURITY DEFINER RPCs (`spend_credit`, `refund_credit`, `update_profile_credits`) — ledger layer; append-only; auditable; mirrors `point_events`
2. `handle_new_user` (modified) + earn triggers on `unlock_events`, `promptys`, `prompty_tests` — server-side award layer; each trigger is additive, existing gamification logic untouched
3. `generate-image` Edge Function + provider adapter interface — orchestration layer; JWT validation → atomic debit → provider call → Storage upload → signed URL → refund on failure
4. `generations` table — generation record; FK to `credit_events` for full audit trail
5. `prompty-generations` private Storage bucket — image persistence; signed URL access only
6. `useCredits` / `useGenerate` hooks + `PromptyDetailPage` modifications — frontend layer; reads only, delegates all mutations to the Edge Function

**Key architectural invariant:** The client never writes `credit_events` rows or mutates `profiles.credits` directly. The only client write surface is `supabase.functions.invoke('generate-image')`.

### Critical Pitfalls

1. **Double-spend via concurrent generate clicks** — Two simultaneous Edge Function calls both pass the balance check when only 1 credit exists. Prevention: `spend_credit()` uses `SELECT credits FROM profiles WHERE id = p_user_id FOR UPDATE` plus `pg_advisory_xact_lock` keyed on `user_id`. Client disables generate button on first tap. Must be in Phase 4 — `spend_credit()` must exist before Phase 6 calls it.

2. **Client-mutated credits (`profiles.credits` unprotected)** — The existing `profiles_update_own` RLS policy allows `supabase.from('profiles').update({ credits: 999 })`. Prevention: (a) `WITH CHECK (false)` INSERT block on `credit_events`; (b) `BEFORE UPDATE` trigger on `profiles` that raises exception if `NEW.credits != OLD.credits` when called by the `authenticated` role. Must be in Phase 4 — not a follow-up hardening task.

3. **Signup bonus fires multiple times** — `handle_new_user` can fire more than once (OAuth re-link, email confirmation, dev reseed). Prevention: partial unique index `CREATE UNIQUE INDEX credit_events_signup_bonus_once ON credit_events (user_id) WHERE event_type = 'signup_bonus'` plus `ON CONFLICT DO NOTHING`. General `credit_events` unique constraint must use `NULLS NOT DISTINCT` to handle NULL `ref_id` correctly. Must be in Phase 4.

4. **Charged but no image (storage or DB failure after provider success)** — Provider bills the API account but Storage upload or `generations` INSERT fails; user debited with nothing. Prevention: Edge Function calls `refund_credit()` on every post-debit failure. `AbortSignal.timeout(120_000)` on provider fetch ensures headroom for refund path before 150s wall-clock kills the process. Must be in Phase 6 initial implementation.

5. **Supabase free-tier auto-pause** — Project pauses after 7 days of inactivity (has already happened once on this project). First Edge Function call after resume fails; `spend_credit` RPC fails before debit so no charge, but user experience is broken. Prevention: GitHub Actions cron every 5 days pinging a public endpoint. Client handles 503 gracefully. Deploy in same Phase 6 PR — not a follow-up.

---

## Implications for Roadmap

The phase split is unambiguous from the dependency graph. The ledger must exist before anything can read or write credits, earn mechanics depend on the ledger but not on the provider, and generation depends on all prior phases.

### Phase 4: Credits Ledger + Signup Bonus

**Rationale:** Every other credit feature in v0.3.0 depends on `credit_events` and `profiles.credits` existing. This phase is the unconditional foundation. Fully provider-independent — no API key, no external service, no provider decision needed.

**Delivers:** `credit_events` schema + RLS + SECURITY DEFINER functions (`spend_credit`, `refund_credit`, `update_profile_credits`); `profiles.credits` column with `CHECK (credits >= 0)` constraint; `generations` table + RLS; `prompty-generations` private Storage bucket + RLS policy; modified `handle_new_user` with idempotent signup bonus; `useCredits` hook; credit balance displayed in ProfilePage header.

**Must-ship guardrails (inline, not deferred):**
- `WITH CHECK (false)` INSERT block on `credit_events`
- `BEFORE UPDATE` trigger blocking direct client mutation of `profiles.credits`
- `CHECK (credits >= 0)` constraint
- Partial unique index for signup bonus idempotency (`NULLS NOT DISTINCT`)
- `SELECT FOR UPDATE` + `pg_advisory_xact_lock` inside `spend_credit()`
- `refund_credit()` function created here (even though generation is Phase 6)

**Tests:** `spend_credit` atomicity (2 concurrent calls for 1-credit user → only one succeeds); signup bonus idempotency (replay `handle_new_user` twice → exactly one bonus row); `CHECK` constraint (debit user with 0 credits → `spend_credit` returns false, constraint blocks).

**Research flag:** Standard patterns — skip `/gsd:research-phase`. All patterns derived directly from existing migrations.

---

### Phase 5: Earn Credits by Contributing

**Rationale:** Depends on Phase 4 (ledger) but is provider-independent. Builds the earn side before the spend side is live in production — safer to validate earn mechanics without generation costs. Anti-abuse caps must ship in this same phase.

**Delivers:** Three SECURITY DEFINER triggers — `award_credit_on_level_up` (on `unlock_events` INSERT, lifetime cap: 5), `award_credit_on_publish` (on `promptys` INSERT where `status = 'published'`, lifetime cap: 20), `award_credit_on_test` (on `prompty_tests` INSERT, lifetime cap: 10). All three additive — existing `point_events` triggers untouched.

**Must-ship guardrails (inline, not deferred):**
- `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` on every earn insert
- Lifetime cap `COUNT(*)` check inside each trigger function
- Triggers fire on existing source tables — no modification to existing trigger chain

**Tests:** Cap enforcement per trigger (replay same action beyond cap → no extra credit row); `ON CONFLICT` idempotency; end-to-end smoke-test: trigger a level-up in dev, verify `credit_events` row and `profiles.credits` update.

**Research flag:** Standard patterns — skip `/gsd:research-phase`. Mirrors `award_points_on_like` daily cap pattern.

---

### Phase 6: AI Image Generation

**Rationale:** The only phase requiring a provider choice and external API key. Depends on Phases 4–5 for `spend_credit`/`refund_credit` RPCs. Contains the highest density of security and reliability requirements. Provider decision is deferred to this phase — Phases 4–5 proceed without it.

**Delivers:** `generate-image` Edge Function (JWT validation, provider adapter dispatch, atomic debit, provider call, Storage upload, `generations` row, signed URL, refund on failure); Gemini Imagen 4 Fast adapter as initial implementation; `useGenerate` hook; `GenerateButton` (authenticated) and `SignupCTA` (anonymous) on `PromptyDetailPage`; zero-balance earn-more nudge; generation loading UX (skeleton + time estimate); inline result display; inline error + refund confirmation.

**Must-ship guardrails (inline, not deferred):**
- `verify_jwt = true` in `config.toml` — never commit `false`
- Derive `user_id` from verified JWT only, never from request body
- Pre-mint `generation_id` UUID before the spend; pass as `ref_id` to `spend_credit`
- `AbortSignal.timeout(120_000)` on provider fetch
- Refund path on every post-debit failure (provider error, Storage error, DB insert error)
- CORS headers including `http://tauri.localhost` and `tauri://localhost`
- Explicit `OPTIONS` preflight handler
- Per-user daily generation cap check (inside Edge Function, before spend)
- Global `generation_enabled` circuit breaker flag in `app_settings`
- Prompt length cap (≤1500 chars) + basic injection denylist inside Edge Function
- Keep-alive cron (GitHub Actions, every 5 days) — deploy in same PR
- Confirm `VITE_*PROVIDER*` never exists in `.env` (`grep -r "VITE_.*KEY\|VITE_.*TOKEN" src/` returns empty)

**Provider deploy prerequisite:**
```
supabase secrets set ACTIVE_PROVIDER=gemini
supabase secrets set GEMINI_API_KEY=<key>
```

**Tests:** Full E2E flow with real provider in staging; mock provider failure → refund row appears; no JWT → 401; run from Tauri Android build → no CORS error; exceed daily cap → 429.

**Research flag:** Standard for Gemini or OpenAI (synchronous base64 response). Needs `/gsd:research-phase` if Replicate is chosen — the async polling pattern is materially different.

---

### Phase Ordering Rationale

- **Ledger before earn before spend:** `credit_events` is a FK requirement for all other credit rows. Earn triggers depend on the ledger but not on the Edge Function. `spend_credit`/`refund_credit` RPCs (created in Phase 4) must exist before Phase 6 can call them.
- **Phases 4–5 are provider-independent by design:** Provider decision and API key acquisition happen in parallel with Phase 4–5 development. No external dependency blocks ledger work.
- **All guardrails inline, never deferred:** Research is unambiguous — double-spend protection, RLS blocks, signup bonus idempotency, and refund paths are architectural requirements. The Pitfall-to-Phase Mapping in PITFALLS.md assigns every pitfall to its originating phase. Slipping a guardrail to a later phase means shipping the feature broken.
- **Earn triggers are additive, zero regression risk:** They are new AFTER INSERT triggers on existing tables. They do not modify `trg_points_on_publish`, `trg_points_on_test`, or any existing trigger function.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 4 (Credits Ledger):** Direct mirror of existing migrations. Codebase is the primary source.
- **Phase 5 (Earn by Contributing):** Mirrors `award_points_on_like` daily cap pattern. Fully established.

Phases needing `/gsd:research-phase`:
- **Phase 6 (Generation) — Replicate only:** If provider is switched to Replicate, the async polling flow is materially different from Gemini/OpenAI. Request a research-phase pass before implementing the Replicate adapter.
- **Phase 6 — CORS on Android:** Tauri Android webview origins are non-standard. Verify in actual Android build early — do not rely on browser testing.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Edge Functions, supabase-js, storage patterns verified against official Supabase docs. Provider REST APIs verified against official provider docs. No SDK dependencies — pure `fetch()`. |
| Features | MEDIUM-HIGH | Credit economy UX from industry sources (Stigg, Photoroom, Luma AI, PixAI). Anti-abuse patterns from verified implementations. Promptys-specific coupling from direct codebase inspection. |
| Architecture | HIGH | All patterns derived from direct codebase inspection of existing migrations, stores, and hooks. No inference — source files are the primary source. |
| Pitfalls | HIGH | Grounded in existing codebase RLS migrations and trigger conventions. Verified against Supabase official docs, Postgres docs, and CVE-2025-48757 RLS misconfiguration analysis. |

**Overall confidence:** HIGH

### Gaps to Address

- **Provider pricing is volatile (MEDIUM confidence):** All three providers' pricing tiers change frequently. Set a provider billing alert before shipping Phase 6. Do not hardcode pricing assumptions in UI — the credit cost is always "1 credit = 1 generation" regardless of provider cost.
- **`profiles.credits` mutation block implementation detail:** The `BEFORE UPDATE` trigger approach must be verified against Postgres trigger firing order — triggers fire before RLS policy evaluation for UPDATE, which means SECURITY DEFINER functions (which bypass RLS) can still update the column while the trigger blocks the `authenticated` role. Validate this behavior in a test migration before shipping Phase 4.
- **Supabase CORS truncation bug:** A 2025 bug truncates `Access-Control-Allow-Headers` to the first four entries in OPTIONS responses. Import CORS headers from `@supabase/supabase-js/cors` (v2.95.0+) rather than hand-coding to stay in sync with SDK fixes.
- **Free-tier storage quota (1 GB total):** AI-generated images at 500KB–2MB each can exhaust the free tier quickly if images are persisted. Target <200KB per image via WebP compression inside the Edge Function before upload. The FEATURES.md architecture decision (not storing generated images unless submitted as community result) is the primary mitigation — validate this remains the plan in Phase 6.

---

## Sources

### Primary (HIGH confidence)
- Supabase Edge Functions docs — scaffolding, deploy, secrets, Deno runtime
- Supabase Securing Edge Functions — JWT validation, `verify_jwt`, `getUser()` pattern
- Supabase functions.invoke() reference — client-side invocation, JWT auto-forwarding
- Supabase Storage createSignedUrl — signed URL pattern for private buckets
- Supabase Row Level Security docs — RLS policy patterns
- Supabase Storage Access Control — bucket privacy, folder-scoped RLS
- Gemini Imagen API docs — `imagen-4.0-generate-001` endpoint, base64 inline_data
- OpenAI Image Generation API — `gpt-image-1`, b64_json, quality tiers
- Replicate HTTP API — predictions endpoint, `Prefer: wait` header, URL output
- CVE-2025-48757 RLS misconfiguration analysis (VibeAppScanner)
- SELECT FOR UPDATE and concurrent credits — Stormatics / PostgreSQL docs
- OWASP Prompt Injection — length cap and denylist pattern
- Existing codebase: `supabase/migrations/20260507000001_initial_schema.sql` — `point_events` mirror pattern
- Existing codebase: `supabase/migrations/20260507000002_rls_policies.sql` — `WITH CHECK (false)` pattern
- Existing codebase: `supabase/migrations/20260507000003_triggers_points.sql` — `handle_new_user`, daily cap
- Existing codebase: `supabase/migrations/20260507000004_unlock_events.sql` — level-up hook
- Existing codebase: `supabase/migrations/20260512000007_phase3_criador.sql` — Storage folder-scoped RLS
- Existing codebase: `src/stores/auth.store.ts` — `refetchProfile` pattern
- Existing codebase: `src/hooks/useCopy.ts` — post-RPC `refetchProfile` pattern

### Secondary (MEDIUM confidence)
- Stigg: "We Built AI Credits and it Was Harder Than We Expected" — ledger design, idempotency, balance transparency
- Kinde: "Freemium to Premium: Converting Free AI Tool Users" — zero-balance UX, earn-more nudge
- Photoroom Help: "Refund AI credits for unsuccessful generations" — auto-refund as table stakes
- Luma AI Help: "Credit refund, failed generation" — automatic credit return standard
- PixAI: "Refund Policy for Failed Generation Tasks" — auto-refund conditions
- Medium/CodeToDeploy: "We Trusted Client-Side Validation. Bots Drained Our Credits in 3 Hours." — server-side enforcement imperative
- Marmelab: "Transactions and RLS in Supabase Edge Functions" — RPC vs direct Postgres pattern
- Gemini Imagen 4 pricing — $0.02/$0.04/$0.06 Fast/Standard/Ultra (pricing changes)
- OpenAI pricing (CostGoat) — gpt-image-1 per-image cost by quality tier (pricing changes)
- Replicate Flux Schnell pricing — ~$0.003/image (varies by model/version)
- Supabase Free Tier Limits 2026 — auto-pause, 500K Edge Function invocations/month, 1 GB storage

---
*Research completed: 2026-05-31*
*Ready for roadmap: yes*
