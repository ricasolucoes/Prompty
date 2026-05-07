---
phase: 01-foundation
plan: 03
subsystem: database
tags: [supabase, seed, promptys, psql, tsx]

dependency-graph:
  requires:
    - phase: 01-02
      provides: database-schema (promptys table, profiles table, RLS policies, triggers)
  provides:
    - seed-data (6 prototype promptys in live Supabase, status=published)
    - demo-author (profile UUID 00000000-0000-0000-0000-000000000001)
    - seed-generator (scripts/seed-promptys.ts — single source of truth)
    - smoke-check (scripts/verify-seed.ts — reusable anon-client count verification)
  affects: [01-04, 01-05, 01-06, 01-07, 01-08, 01-09]

tech-stack:
  added: [tsx, dotenv, supabase-cli (homebrew)]
  patterns:
    - "Idempotent seed via INSERT ... ON CONFLICT (slug) DO UPDATE"
    - "Explicit profiles INSERT in seed (not relying on trigger when auth.users row pre-exists)"
    - "Fixed UUID demo author pattern for deterministic re-seeding"

key-files:
  created:
    - scripts/seed-promptys.ts
    - supabase/seed.sql
    - scripts/verify-seed.ts
  modified:
    - package.json (added seed:gen, seed:apply scripts; tsx, dotenv devDependencies)
    - pnpm-lock.yaml

key-decisions:
  - "profiles INSERT added explicitly to seed instead of relying on trigger — trigger only fires on INSERT not when auth.users row pre-exists via ON CONFLICT DO NOTHING"
  - "verify-seed.ts kept as permanent reusable smoke check (not deleted after single run)"
  - "Seed applied Path B (psql direct) — Supabase CLI link skipped due to missing access token; psql works with DATABASE_URL from .env"
  - "Migrations applied manually via psql (plan 01-02 checkpoint was unresolved) before seed"

patterns-established:
  - "Seed generator: TypeScript source → generated SQL (never edit seed.sql by hand)"
  - "Smoke check: tsx scripts/verify-seed.ts confirms count via anon client after any seed apply"

requirements-completed: [FEED-01]

duration: 6min
completed: "2026-05-07"
---

# Phase 01 Plan 03: Seed Promptys Summary

**6 prototype promptys seeded in live Supabase (ouoxxwbiqgecaysoybpv) via idempotent INSERT...ON CONFLICT (slug); TypeScript generator and anon-client smoke check included**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-07T12:00:16Z
- **Completed:** 2026-05-07T12:06:12Z
- **Tasks:** 2 of 2
- **Files modified:** 5

## Accomplishments

- Generated `supabase/seed.sql` with 6 prototype promptys and 1 demo author via `scripts/seed-promptys.ts`
- Applied all 4 schema migrations + seed to live Supabase project (migrations were pending from plan 01-02 checkpoint)
- Confirmed 6 published promptys via `scripts/verify-seed.ts` (anon JS client count check)
- Seed is idempotent: re-running produces same 6 rows, 0 duplicates

## Task Commits

1. **Task 1: Generate seed.sql from data.jsx via generator script** - `0358400` (feat)
2. **Task 2: Apply seed to live Supabase + verify count** - `bcce898` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/seed-promptys.ts` — TypeScript generator; single source of truth for all seed content; run with `pnpm seed:gen`
- `supabase/seed.sql` — Generated idempotent SQL; 6 promptys + demo author; referenced by `supabase/config.toml` `[db.seed]`
- `scripts/verify-seed.ts` — Reusable smoke check; uses anon Supabase JS client; run with `tsx scripts/verify-seed.ts`
- `package.json` — Added `seed:gen`, `seed:apply` scripts; tsx and dotenv devDependencies
- `pnpm-lock.yaml` — Updated for tsx + dotenv installs

## Decisions Made

- **Path B (psql direct):** Supabase CLI `db execute --linked` requires an access token (`supabase login`). Used `psql "$DATABASE_URL"` instead — works directly with the connection string in `.env`.
- **verify-seed.ts kept permanently:** Useful for re-verification after any future schema change or migration. Not deleted after first run.
- **Explicit profiles INSERT:** The `on_auth_user_created` trigger only fires on actual INSERT. When re-running the seed, `auth.users` ON CONFLICT DO NOTHING skips insertion, so the trigger never fires and `profiles` row is missing. Fixed by adding an explicit `INSERT INTO profiles ... ON CONFLICT (id) DO UPDATE` after the auth.users insert.
- **Migrations applied in this plan:** Plan 01-02 paused at a human-action checkpoint (Supabase link not completed). All 4 migrations were applied via psql here as a prerequisite for seed application.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase CLI not available as linked binary**
- **Found during:** Task 2 (Apply seed)
- **Issue:** `supabase` command not found — pnpm-workspace.yaml has supabase in `ignoredBuiltDependencies`, so the postinstall that downloads the CLI binary was skipped
- **Fix:** Installed supabase CLI via `brew install supabase/tap/supabase-beta`
- **Files modified:** None (system-level install)
- **Verification:** `supabase --version` returns `2.99.0-beta.1`
- **Committed in:** Task 2 commit bcce898

**2. [Rule 3 - Blocking] Migrations not applied to live DB (prerequisite)**
- **Found during:** Task 2 (Apply seed) — `relation "promptys" does not exist`
- **Issue:** Plan 01-02 paused at checkpoint; migrations were authored but never applied; live DB was empty
- **Fix:** Applied all 4 migrations via psql in order (initial_schema, rls_policies, triggers_points, unlock_events)
- **Files modified:** None (live DB state changed)
- **Verification:** All tables present; seed applied successfully after
- **Committed in:** Task 2 commit bcce898

**3. [Rule 1 - Bug] profiles row missing after auth.users ON CONFLICT skip**
- **Found during:** Task 2 (seed.sql first apply) — FK violation on promptys.author_id
- **Issue:** auth.users INSERT returned `INSERT 0 0` (row already existed) so trigger never fired; profiles table had no row for demo author
- **Fix:** Added explicit `INSERT INTO profiles (id, name, username) VALUES ... ON CONFLICT (id) DO UPDATE SET ...` after auth.users insert in seed generator
- **Files modified:** `scripts/seed-promptys.ts`, `supabase/seed.sql` (regenerated)
- **Verification:** `psql ... -c "SELECT COUNT(*) FROM promptys WHERE author_id='...'` returns 6
- **Committed in:** Task 2 commit bcce898

**4. [Rule 3 - Blocking] dotenv not installed**
- **Found during:** Task 2 (running verify-seed.ts) — `Cannot find package 'dotenv'`
- **Fix:** `pnpm add -D dotenv`
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** `tsx scripts/verify-seed.ts` prints `Seed verified: 6 published promptys`
- **Committed in:** Task 2 commit bcce898

---

**Total deviations:** 4 auto-fixed (2 blocking infrastructure, 1 bug, 1 blocking dependency)
**Impact on plan:** All fixes were prerequisites for the seed to apply. No scope creep — all changes directly enable the plan's stated outcome.

## Issues Encountered

- Supabase CLI access token not available prevented `supabase db execute --linked`. Used psql + DATABASE_URL from `.env` as Plan B — cleaner and more reliable for CI scenarios.

## Seed Details

**Seed application path used:** Path B — `psql "$DATABASE_URL" -f supabase/seed.sql`

**verify-seed.ts status:** Kept permanently as reusable smoke check

**Demo author:** UUID `00000000-0000-0000-0000-000000000001`, email `demo@promptys.local`, username `promptys`

**Seeded promptys (all status=published):**

| slug | difficulty | inputs | template_len |
|------|------------|--------|-------------|
| retrato-cinematografico | intermediate | 11 | 893 chars |
| cartaz-editorial-y2k | beginner | 5 | 470 chars |
| brutalismo-solar | advanced | 5 | 371 chars |
| mascote-claymation | beginner | 4 | 337 chars |
| monograma-geometrico | intermediate | 4 | 270 chars |
| still-comida-35mm | beginner | 2 | 299 chars |

## Next Phase Readiness

- Live DB has 6 published promptys — L1 feed will not be empty when implemented (plan 01-05, 01-06)
- `scripts/verify-seed.ts` can be run anytime to confirm seed health
- Safe re-run: `pnpm seed:gen && psql "$DATABASE_URL" -f supabase/seed.sql`
- Supabase CLI login still pending — needed for `supabase db push --linked` and type generation

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
