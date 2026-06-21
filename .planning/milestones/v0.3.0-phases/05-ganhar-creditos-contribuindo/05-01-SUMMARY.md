---
phase: 05-ganhar-creditos-contribuindo
plan: 01
subsystem: testing
tags: [sql, psql, smoke-tests, gamification, credits, tdd]

requires:
  - phase: 04-ledger-creditos-bonus
    provides: credit_events table, update_profile_credits(), profiles.credits column

provides:
  - Four RED smoke scripts encoding EARN-01..EARN-04 observable success criteria
  - earn01: +2 credits on level-up + ON CONFLICT idempotency per unlock_events row
  - earn02: +1 on publish, UPDATE no double-award, lifetime cap 20
  - earn03: +1 on approved result, daily cap 10, approved=false guard
  - earn04: zero credit-typed rows in point_events + expected credit_events deltas

affects:
  - 05-02 (migration must turn these RED scripts GREEN)

tech-stack:
  added: []
  patterns:
    - "Wave 0 smoke scripts: BEGIN/ROLLBACK, deterministic UUIDs 00000000-0000-0000-0000-0000000e00NN, DO-block RAISE EXCEPTION FAIL / RAISE NOTICE PASS"
    - "Seeding via auth.users (handle_new_user fires, auto-creates profile); DELETE FROM credit_events for known baseline"
    - "Assertions count only specific event_type rows — not absolute totals — to stay robust against legitimate concurrent trigger firings"

key-files:
  created:
    - supabase/tests/earn01_level_up.sql
    - supabase/tests/earn02_publish.sql
    - supabase/tests/earn03_approved_result.sql
    - supabase/tests/earn04_no_interference.sql
  modified: []

key-decisions:
  - "earn scripts seed via auth.users (not profiles directly) so handle_new_user fires and profile exists before unlock_events/promptys FK inserts"
  - "earn02 asserts bal <> 20 (not absolute >= 21) because only publish_prompty credit_events rows are bounded; the point_events trigger (award_points_on_publish) fires separately"
  - "earn04 does NOT assert absolute point_events count — asserts no credit-typed event_type rows leaked in — because award_points_on_publish and award_points_on_test legitimately fire during the same transaction"
  - "earn03 checks credit_events count by event_type='approved_result' (not profile.credits total) so the host prompty's publish credit (+1) does not pollute the daily-cap assertion"

patterns-established:
  - "RED smoke scripts: encode observable behavior before triggers exist; fail on missing event_type CHECK values or absent triggers"
  - "Deterministic earn UUIDs in 0000000e00NN range avoid collision with cred (0000000c00NN) test UUIDs"

requirements-completed: [EARN-01, EARN-02, EARN-03, EARN-04]

duration: 5min
completed: 2026-06-21
---

# Phase 05 Plan 01: Earn Credits — Wave 0 Smoke Scripts Summary

**Four psql smoke scripts encoding EARN-01..EARN-04 observable success criteria as runnable RED assertions (level-up +2, publish cap 20, approved-result daily cap 10, point_events independence)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-21T18:53:37Z
- **Completed:** 2026-06-21T18:58:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- earn01: asserts +2 credits on level-up + idempotency via ON CONFLICT on same unlock_events row ref_id
- earn02: asserts +1 on publish, UPDATE no double-award, lifetime cap 20 (21st publish yields no credit)
- earn03: asserts +1 on approved result, daily cap 10 (11th yields no credit), approved=false guard
- earn04: fires all three credit-earning actions in one transaction; asserts zero credit-typed rows in point_events and expected credit_events rows (level_up +2, publish_prompty +1, approved_result +1)

## Task Commits

1. **Task 1: earn01 + earn04 smoke scripts** - `ef17772` (test)
2. **Task 2: earn02 + earn03 smoke scripts** - `9566217` (test)

## Files Created/Modified

- `supabase/tests/earn01_level_up.sql` - EARN-01: +2 level-up credit, ref_id idempotency
- `supabase/tests/earn02_publish.sql` - EARN-02: +1 publish, lifetime cap 20, UPDATE idempotency
- `supabase/tests/earn03_approved_result.sql` - EARN-03: +1 approved result, daily cap 10, false guard
- `supabase/tests/earn04_no_interference.sql` - EARN-04: point_events isolation + credit_events presence

## Decisions Made

- Seeding via `auth.users` (not `profiles` directly) so `handle_new_user` fires and the profile row exists before FK-dependent inserts (unlock_events, promptys, prompty_tests).
- earn04 asserts `event_type NOT IN (credit types)` on point_events rather than asserting count=0 — because `award_points_on_publish` and `award_points_on_test` legitimately fire during the same transaction.
- earn03 counts only `credit_events WHERE event_type = 'approved_result'` for the daily-cap check — the host prompty's publish credit (+1) is separate and does not pollute the cap assertion.

## Deviations from Plan

None - plan executed exactly as written. (Files existed from a prior partial session; content matches all acceptance criteria.)

## Issues Encountered

Files were pre-existing from a prior session commit (ef17772, 9566217). Content verified against all acceptance criteria — all pass.

## Next Phase Readiness

- Four RED smoke scripts committed and ready as the grading contract for 05-02.
- Plan 05-02 must add: `credit_events` extended `event_type` CHECK values, `profiles.credits` trigger chain, `prompty_tests.approved` column, and the three award triggers (`award_credit_on_level_up`, `award_credit_on_publish`, `award_credit_on_approved_result`).

---
*Phase: 05-ganhar-creditos-contribuindo*
*Completed: 2026-06-21*
