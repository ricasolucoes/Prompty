---
phase: 04-ledger-creditos-bonus
plan: 01
subsystem: testing
tags: [vitest, psql, sql, rls, concurrency, postgres, credits]

# Dependency graph
requires: []
provides:
  - supabase/tests/ directory with 4 runnable SQL/shell assertion scaffolds (CRED-01, CRED-03, CRED-04)
  - 3 Vitest RTL anchor stubs (CRED-02/04) — green, no missing-module imports
  - Every Wave 0 file listed in 04-VALIDATION.md
affects:
  - 04-02-PLAN.md (DB migration plan — its <verify> blocks reference these SQL files)
  - 04-03-PLAN.md (frontend plan — its <verify> blocks reference the RTL stubs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SQL smoke scripts with \set ON_ERROR_STOP on + DO $$ RAISE EXCEPTION/NOTICE $$ for psql-exit-non-zero assertions
    - Two-session concurrency test via backgrounded psql processes (psql & psql & wait) — genuine backend connections, not sequential
    - RTL Wave 0 stubs with anchor-only assertions (expect(true).toBe(true)) — avoids Vite static resolution failure on missing modules

key-files:
  created:
    - supabase/tests/cred01_signup_bonus.sql
    - supabase/tests/cred03_rls_block.sql
    - supabase/tests/cred03_double_spend.sh
    - supabase/tests/cred04_rls_isolation.sql
    - src/hooks/useCredits.test.ts
    - src/components/layout/AppHeader.test.tsx
    - src/components/profile/CreditHistorySheet.test.tsx
  modified: []

key-decisions:
  - "cred03_double_spend.sh uses TRUE two-session concurrency (two backgrounded psql processes + wait) — not a sequential single-session test, per 04-CONTEXT.md specifics requirement"
  - "Shell script idempotency: DELETE prior credit_events for test user at seed time so re-runs always start with balance=1, not accumulated rows"
  - "RTL stubs do NOT import not-yet-created modules (useCredits, AppHeader credit badge, CreditHistorySheet) — Vite static module resolution fails even in catch() blocks (STATE.md Phase 02 decision)"

patterns-established:
  - "SQL test pattern: ROLLBACK-wrapped transactions for safe repeated execution against live DB (except double-spend which needs committed seed)"
  - "Wave 0 anchor stub: describe + single it('placeholder anchor — replaced by plan 04-0X') with expect(true).toBe(true)"

requirements-completed: [CRED-01, CRED-02, CRED-03, CRED-04]

# Metrics
duration: 3min
completed: 2026-05-31
---

# Phase 04 Plan 01: Test Scaffolds (Wave 0) Summary

**4 SQL/shell assertion scaffolds + 3 Vitest RTL anchor stubs covering CRED-01/02/03/04 — all tests green, all Wave 0 files on disk before any implementation**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-31T19:40:21Z
- **Completed:** 2026-05-31T19:42:46Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created `supabase/tests/` directory with 4 runnable assertion scaffolds that will RED until plan 04-02 applies the migration
- TRUE two-session concurrency test (`cred03_double_spend.sh`) using backgrounded `psql` processes — genuine concurrent backend connections, not sequential
- 3 Vitest RTL anchor stubs in place; full suite of 210 tests passes green with 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: SQL + shell scaffolds** - `780b16b` (test)
2. **Task 2: RTL anchor stubs** - `9899be3` (test)

## Files Created/Modified

- `supabase/tests/cred01_signup_bonus.sql` — idempotency assertion: exactly 1 signup_bonus row, balance=1
- `supabase/tests/cred03_rls_block.sql` — RLS assertion: direct profiles.credits UPDATE + credit_events INSERT both blocked for authenticated role
- `supabase/tests/cred03_double_spend.sh` — two-session concurrent spend_credit test; asserts exactly 1 success, final balance=0
- `supabase/tests/cred04_rls_isolation.sql` — isolation assertion: authenticated user A sees 0 rows belonging to user B
- `src/hooks/useCredits.test.ts` — anchor stub; plan 04-03 fills with null-safety assertions once useCredits.ts exists
- `src/components/layout/AppHeader.test.tsx` — anchor stub; plan 04-03 fills with credit badge render assertions
- `src/components/profile/CreditHistorySheet.test.tsx` — anchor stub; plan 04-03 fills with history render assertions

## Decisions Made

- `cred03_double_spend.sh` uses TRUE two-session concurrency (two backgrounded `psql &` processes + `wait`) per 04-CONTEXT.md explicit requirement — single-session sequential testing would not exercise the advisory lock serialization
- Shell script idempotency achieved by `DELETE FROM credit_events WHERE user_id = test_user` at seed time; re-runs always start with exactly 1 credit
- RTL stubs use no imports beyond `vitest` itself — Vite static module resolution fails on non-existent paths even inside `catch()`, per Phase 02 decision in STATE.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. SQL scripts require DB access (handled by orchestrator outside sandbox).

## Next Phase Readiness

- All Wave 0 files exist — plan 04-02 (DB migration) and plan 04-03 (frontend) have their `<verify>` targets on disk
- SQL scaffolds will RED until plan 04-02 creates `credit_events` table, `update_profile_credits()`, `spend_credit()`, and the RLS policies
- RTL stubs will be replaced by plan 04-03 with real assertions once `useCredits.ts`, the AppHeader credit badge, and `CreditHistorySheet.tsx` exist

---
*Phase: 04-ledger-creditos-bonus*
*Completed: 2026-05-31*
