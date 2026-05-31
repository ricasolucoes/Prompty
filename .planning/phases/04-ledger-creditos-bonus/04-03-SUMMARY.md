---
phase: 04-ledger-creditos-bonus
plan: "03"
subsystem: frontend
tags: [react, zustand, react-query, credits, ui, rtl]

# Dependency graph
requires:
  - phase: 04-02
    provides: profiles.credits column, credit_events table, spend_credit/refund_credit RPCs
  - phase: 01-foundation
    provides: useAuthStore, Zustand store pattern, inline-style design system
provides:
  - useCredits selector (null-safe credits from store, zero new query)
  - useCredits hook (src/hooks/useCredits.ts)
  - useCreditHistory hook (react-query, credit_events newest-first, RLS-scoped)
  - AppHeader Solar Coral credit badge beside the level badge (CRED-02)
  - CreditHistorySheet bottom sheet with PT-BR event labels + signed deltas (CRED-04)
  - ProfilePage "Histórico de créditos" button + sheet wiring
  - database.types.ts hand-edited with credit_events, generations tables and profiles.credits
affects: [phase-05-earn-contribution, phase-06-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useCredits as 1-line Zustand selector (no new DB query — credits in select('*'))
    - useCreditHistory as react-query hook with RLS-scoped query (no user_id filter in client)
    - CreditHistorySheet following OptionsSheet bottom-sheet pattern (role=dialog, aria-modal, backdrop close, drag handle, inline styles)
    - ProfilePage test isolation via vi.mock for CreditHistorySheet (avoids QueryClient requirement in nudge-copy tests)

key-files:
  created:
    - src/hooks/useCredits.ts
    - src/hooks/useCreditHistory.ts
    - src/components/profile/CreditHistorySheet.tsx
  modified:
    - src/types/database.types.ts
    - src/components/layout/AppHeader.tsx
    - src/pages/ProfilePage.tsx
    - src/hooks/useCredits.test.ts
    - src/components/layout/AppHeader.test.tsx
    - src/components/profile/CreditHistorySheet.test.tsx
    - src/pages/ProfilePage.test.tsx

key-decisions:
  - "database.types.ts hand-edited (not gen:types) — no network access to Supabase in sandbox; orchestrator must regenerate after DB is live to get the authoritative types"
  - "CreditHistorySheet as bottom sheet (not dedicated route) — consistent with OptionsSheet/ReportSheet pattern per RESEARCH.md Open Question 3"
  - "VALIDATION.md named the test CreditHistoryPage.test.tsx; plan 04-01 Wave 0 created CreditHistorySheet.test.tsx — kept the Wave 0 name (component is a sheet, not a page)"
  - "useCreditHistory has no .eq('user_id') filter — RLS auth.uid() policy handles scoping automatically"
  - "ProfilePage.test.tsx mocks CreditHistorySheet to avoid QueryClient requirement in nudge-copy tests (Rule 1 auto-fix)"

# Metrics
duration: 5min
completed: 2026-05-31
---

# Phase 4 Plan 03: Frontend Credits UI Summary

**useCredits Zustand selector + Solar Coral AppHeader badge (CRED-02) + CreditHistorySheet bottom sheet on ProfilePage (CRED-04) with 12 new RTL assertions replacing all 3 Wave 0 stubs**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-31T19:56:10Z
- **Completed:** 2026-05-31T20:01:03Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Hand-edited `database.types.ts` to add `credits: number` to profiles Row/Insert/Update, added `credit_events` table type (id, user_id, event_type, delta, ref_id, created_at), added `generations` table type, added `spend_credit`/`refund_credit`/`update_profile_credits` functions
- Created `useCredits` hook: 1-line Zustand selector over `profile?.credits ?? 0` — zero new DB queries
- Updated AppHeader: Solar Coral `#FF6B4A` credit badge rendered beside the Electric Violet level badge, aria-label uses correct singular/plural ("1 crédito" / "N créditos")
- Created `useCreditHistory` hook: react-query, selects from `credit_events` ordered `created_at desc`, limit 50; no `user_id` filter (RLS `auth.uid()` policy scopes rows automatically)
- Created `CreditHistorySheet` component: bottom sheet (OptionsSheet pattern — role=dialog, aria-modal, backdrop close, drag handle, inline styles); PT-BR event labels for all 5 event types; signed delta colored Mint Signal (positive) / Solar Coral (negative)
- Wired `CreditHistorySheet` into `ProfilePage` with `historyOpen` state and a "Histórico de créditos" SecondaryButton
- Replaced all 3 Wave 0 stubs (`useCredits.test.ts`, `AppHeader.test.tsx`, `CreditHistorySheet.test.tsx`) with real RTL assertions — 12 new passing tests

## Task Commits

1. **Task 1: types + useCredits + AppHeader badge** - `05f2118` (feat)
2. **Task 2: useCreditHistory + CreditHistorySheet + ProfilePage** - `465c073` (feat)
3. **Auto-fix: ProfilePage test mock** - `0b742fb` (fix)

## Files Created/Modified

- `src/types/database.types.ts` — Hand-added `credit_events` table, `generations` table, `profiles.credits` column, `spend_credit`/`refund_credit`/`update_profile_credits` functions
- `src/hooks/useCredits.ts` — New: 1-line Zustand selector
- `src/hooks/useCreditHistory.ts` — New: react-query credit_events hook
- `src/components/layout/AppHeader.tsx` — Added Solar Coral credit badge + flex wrapper
- `src/components/profile/CreditHistorySheet.tsx` — New: bottom sheet component
- `src/pages/ProfilePage.tsx` — Added historyOpen state, button, and sheet render
- `src/hooks/useCredits.test.ts` — Wave 0 stub replaced (3 tests)
- `src/components/layout/AppHeader.test.tsx` — Wave 0 stub replaced (3 tests)
- `src/components/profile/CreditHistorySheet.test.tsx` — Wave 0 stub replaced (6 tests)
- `src/pages/ProfilePage.test.tsx` — Added CreditHistorySheet mock (Rule 1 auto-fix)

## Decisions Made

- `database.types.ts` hand-edited because no network access to Supabase DB in sandbox; orchestrator must run `pnpm gen:types` after the Phase 4 migration is applied to production to get authoritative auto-generated types
- `CreditHistorySheet` named as a sheet (not a page) — consistent with the Wave 0 test scaffold name from plan 04-01 and the OptionsSheet/ReportSheet pattern
- `useCreditHistory` intentionally omits `.eq('user_id', ...)` — RLS `auth.uid()` policy scopes rows automatically

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ProfilePage.test.tsx broke after CreditHistorySheet was wired in**
- **Found during:** Task 2 (full test suite run)
- **Issue:** Existing ProfilePage nudge-copy tests render `<ProfilePage />` without a `QueryClientProvider`. After wiring `CreditHistorySheet` into ProfilePage, `useCreditHistory` calls `useQuery`, which throws "No QueryClient set" — 2 tests failed
- **Fix:** Added `vi.mock('@/components/profile/CreditHistorySheet', () => ({ CreditHistorySheet: () => null }))` to `ProfilePage.test.tsx`; the nudge-copy tests do not exercise the credit sheet
- **Files modified:** `src/pages/ProfilePage.test.tsx`
- **Commit:** `0b742fb`

## Deferred to Orchestrator

1. **Type regeneration:** `pnpm gen:types` (after `supabase db push` applies migration 04-02) to replace the hand-edited `database.types.ts` with the authoritative auto-generated file
2. **Manual verification:** Logged-in user sees "🎟 N" Solar Coral badge beside level badge in AppHeader; opening ProfilePage → "Histórico de créditos" button → sheet shows own credit_events newest-first with PT-BR labels and signed deltas

## Issues Encountered

None beyond the ProfilePage test auto-fix (documented above).

## Self-Check: PASSED

- FOUND: src/hooks/useCredits.ts
- FOUND: src/hooks/useCreditHistory.ts
- FOUND: src/components/profile/CreditHistorySheet.tsx
- FOUND: .planning/phases/04-ledger-creditos-bonus/04-03-SUMMARY.md
- FOUND: commit 05f2118 (Task 1)
- FOUND: commit 465c073 (Task 2)
- FOUND: commit 0b742fb (auto-fix)
- All 219 tests pass (38 test files)

---
*Phase: 04-ledger-creditos-bonus*
*Completed: 2026-05-31*
