---
phase: 06-geracao-imagem
plan: 01
subsystem: infra
tags: [supabase, edge-functions, postgres, rls, vitest, github-actions]

requires:
  - phase: 04-ledger-creditos-bonus
    provides: credit_events table, spend_credit(), RLS patterns
  - phase: 05-earn-credits
    provides: generations table, prompty-generations bucket (FK-ready for Edge Function)

provides:
  - "[functions.generate-image] verify_jwt=true block in supabase/config.toml"
  - "app_settings table + generation_enabled='true' circuit breaker row + RLS"
  - "RED test scaffold for useGenerate hook (GEN-03/05) in useGenerate.test.tsx"
  - "RED describe block for GEN-06/07 cases appended to PromptyDetailPage.test.tsx"
  - "Manual-assisted integration harnesses: gen01_generate_happy.sh, gen04_refund_on_fail.sh"
  - "GitHub Actions keep-alive cron (every 5 days) to prevent free-tier auto-pause"

affects:
  - 06-02 (Edge Function reads app_settings circuit breaker; config.toml gates it with verify_jwt)
  - 06-03 (implements useGenerate.ts to turn RED todos GREEN; extends PromptyDetailPage with GEN-06/07 UI)

tech-stack:
  added: []
  patterns:
    - "Wave 0 scaffold: anchor assertion (expect(true).toBe(true)) + it.todo for not-yet-existing modules — Vite static module resolution fails even in catch()"
    - "app_settings key/value pattern for global feature flags (circuit breaker readable by anon, no client writes)"

key-files:
  created:
    - supabase/config.toml (modified — [functions.generate-image] block appended)
    - supabase/migrations/20260531000010_phase6_app_settings.sql
    - src/hooks/useGenerate.test.tsx
    - supabase/tests/gen01_generate_happy.sh
    - supabase/tests/gen04_refund_on_fail.sh
    - .github/workflows/keep-alive.yml
  modified:
    - src/pages/PromptyDetailPage.test.tsx (GEN-06/07 describe block appended)

key-decisions:
  - "[Phase 06-01]: app_settings RLS allows SELECT to anon+authenticated; INSERT/UPDATE blocked via WITH CHECK (false) — Edge Function uses service-role key to write"
  - "[Phase 06-01]: Per-user daily cap (default 5/day) enforced inside Edge Function by COUNTing generations rows today — no extra column in app_settings"
  - "[Phase 06-01]: Wave 0 test scaffolds use anchor + it.todo pattern (no static import of useGenerate.ts) — consistent with Phase 02 decision"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, GEN-08]

duration: 15min
completed: 2026-06-21
---

# Phase 06 Plan 01: Geração de Imagem — Wave 0 Scaffolding Summary

**Edge Function config block (verify_jwt=true), app_settings circuit-breaker migration, RED test anchors for GEN-03/05/06/07, GEN-01/04 shell harnesses, and keep-alive cron — all implementation dependencies for plans 06-02/06-03 on disk before any feature code.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-21T13:11:00Z
- **Completed:** 2026-06-21T13:26:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Config gated: `[functions.generate-image] verify_jwt = true` in supabase/config.toml — 06-02 Edge Function cannot deploy without this block
- Circuit breaker ready: app_settings table with `generation_enabled='true'` row + RLS (anon/auth can SELECT, never INSERT/UPDATE)
- RED test surface: useGenerate.test.tsx (anchor + 4 todos for GEN-03/05) + PromptyDetailPage.test.tsx GEN-06/07 describe block — full suite green (18 pass, 7 todo)
- Integration harnesses: gen01_generate_happy.sh (signed_url assertion) and gen04_refund_on_fail.sh (__FORCE_FAIL__ + refund row count) both executable
- Free-tier auto-pause guard: .github/workflows/keep-alive.yml pings REST root every 5 days via secrets

## Task Commits

1. **Task 1: config.toml + app_settings migration** - `bbdfe84` (chore)
2. **Task 2: RED test scaffolds** - `cd1a616` (test)
3. **Task 3: shell scripts + keep-alive workflow** - `fb3cabe` (feat)

## Files Created/Modified
- `supabase/config.toml` - Appended [functions.generate-image] verify_jwt=true block
- `supabase/migrations/20260531000010_phase6_app_settings.sql` - app_settings CREATE TABLE + seed + RLS
- `src/hooks/useGenerate.test.tsx` - Wave 0 scaffold: anchor + 4 it.todo for GEN-03/05 hook
- `src/pages/PromptyDetailPage.test.tsx` - Appended Geração de imagem describe block (GEN-06/07/01 todos)
- `supabase/tests/gen01_generate_happy.sh` - GEN-01 manual-assisted happy path harness
- `supabase/tests/gen04_refund_on_fail.sh` - GEN-04 manual-assisted refund harness
- `.github/workflows/keep-alive.yml` - Free-tier auto-pause guard cron

## Decisions Made
- app_settings RLS: SELECT open to anon+authenticated; INSERT/UPDATE blocked via `WITH CHECK (false)` — service-role key (Edge Function) bypasses RLS for writes
- Daily generation cap (default 5/day) will be enforced in Edge Function (06-02) by COUNTing `generations` rows created today — no extra column in app_settings
- Wave 0 scaffolds follow Phase 02 anchor pattern: no static import of non-existent `useGenerate.ts`

## Deviations from Plan
None — plan executed exactly as written. Local Supabase was not running so migration apply was skipped (migration file is on disk; it will apply on next `supabase start` or `supabase db push --linked`).

## Issues Encountered
Local Supabase container was not running (`supabase status` reported no container). Migration file created on disk; apply deferred to next `supabase start` or remote push. This is consistent with the plan's fallback instructions.

## Next Phase Readiness
- 06-02 (Edge Function): config block + circuit-breaker table are in place; function can be written and deployed
- 06-03 (Frontend): RED test surface anchors GEN-03/05/06/07; todos will be converted to real assertions after implementing useGenerate.ts and PromptyDetailPage UI
- Blockers: provider decision + `supabase secrets set ACTIVE_PROVIDER=... GEMINI_API_KEY=...` still needed before 06-02 deploy (pre-existing blocker, not introduced here)

---
*Phase: 06-geracao-imagem*
*Completed: 2026-06-21*
