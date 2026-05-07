---
phase: 01-foundation
plan: 02
subsystem: database
status: paused-at-checkpoint
tags: [supabase, migrations, rls, triggers, points-engine, storage]
dependency-graph:
  requires: []
  provides: [database-schema, rls-policies, points-engine, storage-bucket, database-types]
  affects: [01-03, 01-04, 01-05, 01-06, 01-07, 01-08, 01-09]
tech-stack:
  added: [supabase-cli]
  patterns: [SECURITY DEFINER triggers, append-only point_events, RLS-first design]
key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/20260507000001_initial_schema.sql
    - supabase/migrations/20260507000002_rls_policies.sql
    - supabase/migrations/20260507000003_triggers_points.sql
    - supabase/migrations/20260507000004_unlock_events.sql
    - .env.example
  modified:
    - src/types/database.types.ts (pending — Task 3 after checkpoint)
decisions:
  - Storage bucket SQL added to migration 004 (not a separate migration 005) — simpler, atomic
  - unlock_events table placed in migration 004 alongside record_level_transition trigger for logical grouping
  - .env.example updated in-place (pre-existing file was enhanced, not replaced)
metrics:
  completed_date: "2026-05-07"
  tasks_total: 3
  tasks_completed: 1
  tasks_pending: 2
---

# Phase 01 Plan 02: Supabase Schema Migrations Summary

One-liner: 4 SQL migrations establishing 9-table schema with SECURITY DEFINER points engine, RLS on all tables, and Storage bucket via SQL insert.

## Status

**Paused at checkpoint Task 2** — user must run `supabase link` and supply `.env.local` before Task 3 can apply migrations and regenerate types.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Author 4 migration files | 1647e5c | supabase/migrations/*, supabase/config.toml, .env.example |

## Tasks Pending (after checkpoint)

| # | Task | Type | Blocked by |
|---|------|------|------------|
| 2 | User links Supabase project + supplies env vars | checkpoint:human-action | User action required |
| 3 | Apply migrations + Storage bucket + regenerate types | auto | Task 2 completion |

## Migration Order

| File | Purpose |
|------|---------|
| `20260507000001_initial_schema.sql` | 9 tables with indexes and constraints |
| `20260507000002_rls_policies.sql` | RLS enabled on all 9 tables, 22 policies total |
| `20260507000003_triggers_points.sql` | Points engine: 3 trigger functions + handle_new_user + level_from_points |
| `20260507000004_unlock_events.sql` | unlock_events table + level transition trigger + Storage bucket |

## Schema Summary

### Tables (9 total)

- `profiles` — extends auth.users; level L1-L5, points, streak, verified
- `promptys` — core content with slug, template, inputs_schema JSONB, status enum
- `prompty_versions` — version history with unique (prompty_id, version) constraint
- `prompty_tests` — user test submissions; triggers point award on insert
- `prompty_ratings` — multi-dimensional NUMERIC(3,2) ratings (L2+ feature, created now)
- `prompty_likes` — composite PK (user_id, prompty_id); triggers point award
- `prompty_saves` — composite PK; private to owner via RLS
- `prompty_remixes` — Phase 3 remix lineage tracking
- `point_events` — append-only; UNIQUE (user_id, event_type, ref_id) prevents duplicate awards

### RLS Design

All 9 tables have RLS enabled. Key decisions:

- `point_events` and `unlock_events`: `WITH CHECK (false)` blocks all client inserts — only SECURITY DEFINER triggers can write
- `prompty_saves`: private (SELECT only for owner) — not public like likes/tests
- `promptys`: separate policies for published (anon-readable) vs own drafts (author-readable)

### Points Engine (Trigger Chain)

```
auth.users INSERT → on_auth_user_created → profiles row created
prompty_tests INSERT → trg_points_on_test → point_events INSERT → update_profile_points()
                                                                  → profiles.points + level updated
                                                                  → IF level changed: trg_record_level_transition
                                                                                    → unlock_events INSERT
prompty_likes INSERT → trg_points_on_like (daily cap 10) → point_events INSERT → update_profile_points()
client calls record_copy(uuid) RPC → point_events INSERT → update_profile_points()
```

### Storage Bucket

- Bucket: `prompty-results` (public, 2 MB limit)
- MIME whitelist: image/webp, image/jpeg, image/png
- RLS: public read; authenticated upload to own folder (`auth.uid()::text = foldername[1]`)
- Included in migration 004 (not a separate file) — deviation from plan's "optional migration 005"

## Deviations from Plan

### Deviation 1: Storage bucket in migration 004, not 005

- **Found during:** Task 1 planning
- **Rationale:** Plan offered both options — append to 004 OR create 005. Appending to 004 is simpler, keeps related unlock_events and storage config together, and avoids an unnecessary 5th file.
- **Impact:** None — migrations apply in order; result is identical.

## Self-Check: PASSED

All created files verified on disk. Task 1 commit 1647e5c confirmed in git log.

Files confirmed:
- FOUND: supabase/migrations/20260507000001_initial_schema.sql
- FOUND: supabase/migrations/20260507000002_rls_policies.sql
- FOUND: supabase/migrations/20260507000003_triggers_points.sql
- FOUND: supabase/migrations/20260507000004_unlock_events.sql
- FOUND: supabase/config.toml
- FOUND: .env.example
- FOUND commit: 1647e5c
