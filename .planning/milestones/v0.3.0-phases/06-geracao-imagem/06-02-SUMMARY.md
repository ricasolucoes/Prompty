---
phase: 06-geracao-imagem
plan: 02
subsystem: api
tags: [deno, edge-function, supabase, image-generation, credits, storage]

requires:
  - phase: 04-ledger-creditos-bonus
    provides: spend_credit / refund_credit RPCs with pg_advisory_xact_lock + SELECT FOR UPDATE atomicity; generations table + prompty-generations bucket
  - phase: 06-01
    provides: app_settings table with generation_enabled circuit breaker; Wave 0 test scaffolds

provides:
  - supabase/functions/generate-image/providers/types.ts — ImageProvider interface (LOCKED)
  - supabase/functions/generate-image/providers/mock.ts — full working mock provider with forced-failure path
  - supabase/functions/generate-image/providers/gemini.ts — stub (throws unless GEMINI_API_KEY set)
  - supabase/functions/generate-image/providers/openai.ts — stub (throws unless OPENAI_API_KEY set)
  - supabase/functions/generate-image/providers/replicate.ts — stub (throws unless REPLICATE_API_TOKEN set)
  - supabase/functions/generate-image/index.ts — full orchestrator: JWT → circuit breaker → daily cap → spend → provider → upload → insert → signed URL; refund on any post-spend failure

affects: [06-03-frontend-generate, useGenerate hook, provider swap workflow]

tech-stack:
  added: [Deno 2.1.x, npm:@supabase/supabase-js@2 (Edge Function context), Deno.serve]
  patterns:
    - dual-client pattern (userClient for RPCs, adminClient for storage/DB insert)
    - pre-mint UUID before spend for complete audit trail
    - single try/catch guarantees refund on every post-spend failure path
    - ACTIVE_PROVIDER env dispatch — zero code change to swap providers

key-files:
  created:
    - supabase/functions/generate-image/providers/types.ts
    - supabase/functions/generate-image/providers/mock.ts
    - supabase/functions/generate-image/providers/gemini.ts
    - supabase/functions/generate-image/providers/openai.ts
    - supabase/functions/generate-image/providers/replicate.ts
    - supabase/functions/generate-image/index.ts
  modified: []

key-decisions:
  - "Dual-client pattern enforced: userClient for spend_credit/refund_credit (auth.uid() resolution), adminClient for storage + generations INSERT only — service-role key never reaches src/"
  - "DAILY_CAP=5 per user/day (conservative MVP default, no UI change needed to adjust)"
  - "Prompt sanitization: ≤1500 chars truncation + injection denylist regex before any spend"
  - "Pre-mint generationId (crypto.randomUUID()) before spend_credit call — complete audit trail even if provider fails"
  - "Single try/catch wrapping provider→upload→insert→sign ensures refund_credit fires on ALL failure paths (GEN-04)"
  - "CORS uses wildcard origin with full Allow-Headers list — covers tauri.localhost and tauri:// without origin matching"

patterns-established:
  - "ImageProvider interface: generate(prompt) → Promise<{bytes, mimeType}> — all adapters behind this contract"
  - "Mock provider: deterministic 1×1 WebP bytes, __FORCE_FAIL__ in prompt or MOCK_FAIL=1 env triggers failure"
  - "Real provider stubs: read key from Deno.env, throw 'not configured' if absent — safe placeholder until secret is set"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04, GEN-08]

duration: 8min
completed: 2026-06-21
---

# Phase 06 Plan 02: generate-image Edge Function Summary

**Deno Edge Function orchestrating JWT auth → generation_enabled circuit breaker → DAILY_CAP=5 daily cap → atomic spend_credit → ACTIVE_PROVIDER adapter dispatch (mock default) → prompty-generations bucket upload → generations row insert → signed URL response; refund_credit fires on every post-spend failure path**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-21T16:14:42Z
- **Completed:** 2026-06-21T16:16:18Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- 4 provider adapters behind one `ImageProvider` interface; mock is the fully working default with `__FORCE_FAIL__`/`MOCK_FAIL=1` path and 1.5s latency simulation
- 3 real provider stubs (Gemini, OpenAI, Replicate) are one-file placeholders that throw "not configured" until the corresponding secret is set — zero other changes needed to activate (GEN-08)
- `index.ts` orchestrator enforces all GEN requirements: credit is spent via userClient (auth.uid() resolves), storage/insert via adminClient (service-role, no RLS), refund guaranteed by single try/catch, provider key never leaves Deno.env

## Task Commits

1. **Task 1: Provider adapter interface + mock + 3 stubs** - `8de3f20` (feat)
2. **Task 2: Edge Function orchestrator index.ts** - `472f3c5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `supabase/functions/generate-image/providers/types.ts` — `ImageProvider` + `GeneratedImage` interfaces (LOCKED contract)
- `supabase/functions/generate-image/providers/mock.ts` — deterministic 1×1 WebP placeholder, forced-failure path, latency sim
- `supabase/functions/generate-image/providers/gemini.ts` — stub reading `GEMINI_API_KEY`
- `supabase/functions/generate-image/providers/openai.ts` — stub reading `OPENAI_API_KEY`
- `supabase/functions/generate-image/providers/replicate.ts` — stub reading `REPLICATE_API_TOKEN`
- `supabase/functions/generate-image/index.ts` — full orchestrator (136 lines)

## Decisions Made

- Dual-client pattern: `userClient` (forwarded Authorization header) for RPCs, `adminClient` (service-role) for storage + generations INSERT — enforces that `auth.uid()` resolves inside spend/refund RPCs
- `DAILY_CAP = 5` per user/day as conservative MVP default
- Prompt sanitized to ≤1500 chars + injection denylist before spend to avoid wasting credits on rejected input
- `generationId` pre-minted via `crypto.randomUUID()` before `spend_credit` call — used as `p_ref` for audit linkage
- CORS wildcard origin with full `Allow-Headers` list — covers both Tauri webview origins without per-origin matching

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

To test with a real provider, set the secret and change the active provider:
```bash
supabase secrets set ACTIVE_PROVIDER=gemini GEMINI_API_KEY=<key>
supabase functions deploy generate-image
```

The mock provider works with zero secrets — the entire flow (spend → generate → upload → insert → sign) is exercisable locally with `supabase functions serve generate-image`.

## Next Phase Readiness

- Edge Function is ready; plan 06-03 can wire `useGenerate` hook + UI button
- Local smoke test: `supabase functions serve generate-image` + `gen01_generate_happy.sh` (happy path) + `gen04_refund_on_fail.sh` (`__FORCE_FAIL__` → refund) — documented as manual-only in 06-VALIDATION.md
- Provider choice still deferred; ACTIVE_PROVIDER=mock is the safe default for 06-03 dev

---
*Phase: 06-geracao-imagem*
*Completed: 2026-06-21*
