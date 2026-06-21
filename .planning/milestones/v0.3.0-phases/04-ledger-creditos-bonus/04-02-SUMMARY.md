---
phase: 04-ledger-creditos-bonus
plan: "02"
subsystem: database
tags: [postgres, supabase, rls, security-definer, ledger, credits, advisory-lock]

# Dependency graph
requires:
  - phase: 04-01
    provides: Wave 0 SQL smoke-test scaffolds (cred01/cred03/cred04) that validate this migration
  - phase: 01-foundation
    provides: profiles table, point_events pattern, handle_new_user, RLS policies baseline, storage bucket pattern
provides:
  - credit_events append-only ledger table with partial unique index for signup bonus idempotency
  - profiles.credits cached balance column (CHECK >= 0, GREATEST floor)
  - guard_profiles_financial_columns BEFORE UPDATE trigger closing profiles_update_own hole
  - handle_new_user extended with idempotent signup_bonus (ON CONFLICT DO NOTHING via partial index)
  - update_profile_credits SECURITY DEFINER function
  - spend_credit(p_ref UUID) RETURNS TABLE(ok BOOLEAN, balance INTEGER) with pg_advisory_xact_lock + FOR UPDATE
  - refund_credit(p_ref UUID) RETURNS TABLE(ok BOOLEAN, balance INTEGER)
  - generations table + prompty-generations private bucket (Phase 6 ready)
affects: [phase-06-generation, phase-05-earn-contribution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Partial unique index (WHERE event_type = 'signup_bonus') for NULL-ref_id idempotency
    - current_user = 'authenticated' guard in BEFORE UPDATE trigger (not session_user)
    - Two-layer atomicity: pg_advisory_xact_lock + SELECT FOR UPDATE in spend_credit
    - GREATEST(sum, 0) soft floor + CHECK >= 0 hard constraint for balance integrity

key-files:
  created:
    - supabase/migrations/20260531000008_phase4_credits_ledger.sql
  modified: []

key-decisions:
  - "credit_events UNIQUE (user_id, event_type, ref_id) covers non-null ref_id; partial index credit_events_signup_once covers NULL ref_id signup bonus — both coexist without conflict"
  - "guard_profiles_financial_columns uses current_user = 'authenticated' (not session_user) — PostgREST sets SET LOCAL role which changes current_user; SECURITY DEFINER functions run as postgres so they bypass the guard"
  - "profiles_update_own policy kept UNCHANGED — trigger is surgical (only raises on financial column changes); bio/username/avatar updates still pass through"
  - "spend_credit requires both pg_advisory_xact_lock AND SELECT FOR UPDATE: advisory lock serializes sessions that both begin before either acquires the row lock; FOR UPDATE blocks concurrent update_profile_credits calls"
  - "generations table and prompty-generations bucket created in Phase 4 migration (FK ready early); Edge Function that writes to them arrives in Phase 6"

patterns-established:
  - "Pattern: append-only ledger with SECURITY DEFINER recompute — do NOT use UPDATE profiles SET credits = credits - 1; always recompute via SUM(delta)"
  - "Pattern: partial unique index WHERE event_type = X for idempotency when ref_id IS NULL (standard UNIQUE misses NULL in PostgreSQL)"
  - "Pattern: current_user = 'authenticated' in BEFORE UPDATE trigger to distinguish client vs SECURITY DEFINER caller in Supabase PostgREST"

requirements-completed: [CRED-01, CRED-03, CRED-04]

# Metrics
duration: 5min
completed: 2026-05-31
---

# Phase 4 Plan 02: Credits Ledger Summary

**Immutable credit_events ledger with BEFORE UPDATE guard trigger, idempotent signup bonus (partial unique index), atomic spend_credit/refund_credit via pg_advisory_xact_lock + FOR UPDATE, and generations table + private bucket ready for Phase 6**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-31T19:44:40Z
- **Completed:** 2026-05-31T19:49:55Z
- **Tasks:** 2 (single-file; tasks 1 and 2 both write to the same migration)
- **Files modified:** 1

## Accomplishments

- Authored complete single-file migration `20260531000008_phase4_credits_ledger.sql` (278 lines) covering all DDL for CRED-01/03/04
- Guard trigger `guard_profiles_financial_columns` closes the `profiles_update_own` policy hole for credits, points, and level columns without touching the policy itself
- `spend_credit()` atomic double-spend protection using both `pg_advisory_xact_lock(hashtext(...))` and `SELECT ... FOR UPDATE` as required by CONTEXT.md
- Phase 6 infrastructure (generations table + prompty-generations private bucket) created early so FK dependencies are available when the Edge Function is written

## Task Commits

1. **Task 1+2: Phase 4 migration (single file — both tasks)** - `791861e` (feat)

**Plan metadata:** (pending — docs commit follows)

## Files Created/Modified

- `supabase/migrations/20260531000008_phase4_credits_ledger.sql` — Complete Phase 4 DDL: credit_events ledger, profiles.credits column, RLS, guard trigger, handle_new_user extension, update_profile_credits, spend_credit, refund_credit, generations table, prompty-generations bucket

## Decisions Made

- `UNIQUE (user_id, event_type, ref_id)` kept on the table for non-null ref_id earn/spend events, PLUS `CREATE UNIQUE INDEX credit_events_signup_once WHERE event_type = 'signup_bonus'` for the NULL ref_id case — both coexist without conflict (RESEARCH.md Pitfall 1 resolved)
- `guard_profiles_financial_columns` guards `credits`, `points`, AND `level` (belt-and-suspenders) — only credits is new; points/level guard was not in migrations before but does not break any existing SECURITY DEFINER trigger since they run as `postgres`
- `profiles_update_own` policy intentionally left unchanged — trigger is surgical

## Deviations from Plan

None — migration authored exactly per RESEARCH.md Patterns 1–6 and PLAN.md task specifications.

## Deferred to Orchestrator

The following steps from the plan's acceptance criteria require a live Supabase DB and cannot be executed in this sandbox:

1. **DB application:** `npx supabase db push --linked` (or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260531000008_phase4_credits_ledger.sql`)
2. **Migration repair if needed:** `npx supabase migration repair --status applied 20260531000008`
3. **SQL smoke tests (must go GREEN):**
   - `psql "$DB" -f supabase/tests/cred01_signup_bonus.sql` — expects "CRED-01 PASS"
   - `psql "$DB" -f supabase/tests/cred03_rls_block.sql` — expects "CRED-03 PASS" twice
   - `psql "$DB" -f supabase/tests/cred04_rls_isolation.sql` — expects "CRED-04 PASS"
   - `bash supabase/tests/cred03_double_spend.sh` — expects "CRED-03 PASS: concurrent double-spend → 1 success, balance=0"
4. **Type regeneration:** `pnpm gen:types` (after migration is applied) to refresh `database.types.ts` with `profiles.credits` and `credit_events` table types

**Static validation completed (in sandbox):** All 10 `grep` acceptance checks passed. Migration file exists at `supabase/migrations/20260531000008_phase4_credits_ledger.sql` (278 lines, > 120 minimum). All required objects are present: `CREATE TABLE credit_events`, `credit_events_signup_once`, `current_user = 'authenticated'`, `signup_bonus`, `ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0)`, `credit_events_no_client_insert`, `WITH CHECK (false)`, `guard_profiles_financial_columns`, `BEFORE UPDATE ON profiles`, `GREATEST(total, 0)`, `pg_advisory_xact_lock(hashtext(v_user_id::text))`, `FOR UPDATE`, `CREATE TABLE generations`, `generations_no_client_insert`, `false, 5242880` (private bucket). `DROP POLICY.*profiles_update_own` count = 0 (policy untouched).

## Issues Encountered

None.

## Next Phase Readiness

- Migration authored and committed — ready for orchestrator to apply to production DB
- Wave 0 SQL smoke scripts (`cred01_signup_bonus.sql`, `cred03_rls_block.sql`, `cred03_double_spend.sh`, `cred04_rls_isolation.sql`) already exist from plan 04-01 and will validate CRED-01/03/04 once DB is live
- After DB application, plan 04-03 can proceed with frontend: `useCredits` selector, AppHeader credit badge, CreditHistoryPage/sheet

---
*Phase: 04-ledger-creditos-bonus*
*Completed: 2026-05-31*
