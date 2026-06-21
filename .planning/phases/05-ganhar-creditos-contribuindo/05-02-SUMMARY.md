---
phase: 05-ganhar-creditos-contribuindo
plan: "02"
subsystem: database/triggers
tags: [credits, triggers, sql, gamification, earn]
dependency_graph:
  requires: [04-02, 05-01]
  provides: [EARN-01, EARN-02, EARN-03, EARN-04]
  affects: [profiles.credits, credit_events, prompty_tests.approved]
tech_stack:
  added: []
  patterns: [SECURITY DEFINER triggers, ON CONFLICT idempotency, daily/lifetime COUNT caps]
key_files:
  created:
    - supabase/migrations/20260621000010_phase5_earn_credits.sql
  modified:
    - supabase/tests/earn02_publish.sql
decisions:
  - "Migration filename changed from 20260531000009 to 20260621000010 — sequence 009 was already taken by levelup_ai_credit migration from earlier work"
  - "Drop trg_award_credit_on_level_up on profiles (migration 009 approach) before redefining award_credit_on_level_up for unlock_events — same function name, incompatible NEW record shapes"
  - "earn02 test isolation: delete point_events + unlock_events between cap-loop iterations so award_points_on_publish level-up side effects don't pollute publish_prompty credit assertions; assert by credit_events count not total balance"
metrics:
  duration: "~15min"
  completed: "2026-06-21"
  tasks: 2
  files: 2
---

# Phase 05 Plan 02: Phase 5 Earn Credits Migration Summary

Three SECURITY DEFINER earn triggers wired to `unlock_events`, `promptys`, and `prompty_tests` — awarding credits server-side with anti-farming caps, idempotent per row via `ON CONFLICT`.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Write Phase 5 earn credits migration | af88d95 | supabase/migrations/20260621000010_phase5_earn_credits.sql |
| 2 | Apply migration, run earn0* + cred0* regression GREEN | f4afaf6 | migration fix + earn02_publish.sql |

## What Was Built

**Migration `20260621000010_phase5_earn_credits.sql`:**
- `ALTER TABLE prompty_tests ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true`
- Extended `credit_events.event_type` CHECK to include `level_up`, `publish_prompty`, `approved_result`
- `award_credit_on_level_up()` — AFTER INSERT on `unlock_events`, +2 per level transition, idempotent via ON CONFLICT + JOIN cap
- `award_credit_on_publish()` — AFTER INSERT OR UPDATE on `promptys`, +1 per published prompty, lifetime cap 20
- `award_credit_on_approved_result()` — AFTER INSERT OR UPDATE on `prompty_tests`, +1 per approved result, daily cap 10
- All three functions: SECURITY DEFINER SET search_path = public; call `update_profile_credits()`
- Drops legacy `trg_award_credit_on_level_up` on `profiles` (migration 009) before redefining function

**Test Results:**
- EARN-01 PASS: +2 on level-up, idempotent on duplicate ref_id
- EARN-02 PASS: +1 per publish (by publish_prompty count), no double-award on UPDATE, lifetime cap 20
- EARN-03 PASS: daily cap 10, approved=false guard
- EARN-04 PASS: 0 credit-typed rows in point_events; all three credit types correct
- CRED-01/03/04/double_spend: still GREEN (no regression)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration sequence conflict: 009 already taken**
- **Found during:** Task 1 setup
- **Issue:** `20260610000009_levelup_ai_credit.sql` already existed with sequence 009; plan said filename was LOCKED as 20260531000009
- **Fix:** Used `20260621000010_phase5_earn_credits.sql` as the new filename
- **Commit:** af88d95

**2. [Rule 1 - Bug] Legacy profiles trigger broke award_credit_on_level_up**
- **Found during:** Task 2, EARN-02/03/04 failures
- **Issue:** Migration 009 had `trg_award_credit_on_level_up` on `profiles` using the same function name. Our `CREATE OR REPLACE` overwrote it with a function expecting `unlock_events.user_id` — when the profiles trigger fired, it got `record "new" has no field user_id"`
- **Fix:** Added `DROP TRIGGER IF EXISTS trg_award_credit_on_level_up ON profiles` to the migration before redefining the function
- **Commit:** f4afaf6

**3. [Rule 1 - Bug] earn02_publish.sql test assertions broken by level-up side effect**
- **Found during:** Task 2, after fixing deviation 2
- **Issue:** Publishing 50 points triggers `award_points_on_publish` → `update_profile_points` → level L1→L2 → `trg_record_level_transition` → `unlock_events` INSERT → `trg_credit_on_level_up` (+2). Test expected total balance=1 but got 3
- **Fix:** Changed test to delete `point_events` + `unlock_events` before the cap loop to prevent level-up during the test; assert by `publish_prompty` count in credit_events rather than total credits balance
- **Commit:** f4afaf6

## Self-Check: PASSED
- `supabase/migrations/20260621000010_phase5_earn_credits.sql` exists and applied
- All 3 triggers present in DB (verified via pg_trigger)
- `prompty_tests.approved` column exists
- EARN-01..04 all GREEN, CRED-01/03/04 regression GREEN
