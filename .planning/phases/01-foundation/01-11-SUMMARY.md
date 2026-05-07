---
phase: 01-foundation
plan: 11
subsystem: database, gamification, ui
tags: [supabase, migration, typescript, vitest, testing-library, react]

# Dependency graph
requires:
  - phase: 01-foundation plan 08
    provides: LevelUpModal component with UNLOCKS const and level-gated UI
  - phase: 01-foundation plan 03
    provides: level_from_points() SQL function and points trigger chain
  - phase: 01-foundation plan 02
    provides: database.types.ts manual typing pattern and profiles table schema
provides:
  - profiles.last_active_at TIMESTAMPTZ column (migration 005) with backfill + DESC index
  - COMMENT ON FUNCTION level_from_points documenting 50p design choice
  - COMMENT ON COLUMN profiles.last_active_at documenting passive visit signal
  - touchLastActive() wired into main.tsx auth listener (session restore + onAuthStateChange)
  - LevelUpModal UNLOCKS.L2 updated to four items including Avaliar Promptys e enviar imagens geradas
  - LevelUpModal.test.tsx: 5 tests locking in LEVL-03 unlock copy
  - REQUIREMENTS.md LEVL-02 row annotated with points-based approximation rationale
affects: [Phase 2 retention analytics, CUR-01, CUR-02, level system documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "touchLastActive: fire-and-forget Supabase UPDATE pattern — void prefix, try/catch swallowed, never blocks UI"
    - "SQL COMMENT ON FUNCTION/COLUMN as architecture decision documentation surface"
    - "ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS for idempotent migration style"

key-files:
  created:
    - supabase/migrations/20260507000005_last_active_and_levl_annotations.sql
    - src/components/modals/LevelUpModal.test.tsx
  modified:
    - src/types/database.types.ts
    - src/main.tsx
    - src/components/modals/LevelUpModal.tsx
    - .planning/REQUIREMENTS.md

key-decisions:
  - "profiles.last_active_at is a passive timestamp — does NOT award points, does NOT participate in point_events trigger chain"
  - "touchLastActive is fire-and-forget (void + try/catch) — transient network errors never block UI"
  - "LEVL-02 50p threshold is the locked decision from CONTEXT.md; per-criteria gating is deferred to Phase 2 — we annotate, not replace"
  - "SQL COMMENT ON FUNCTION/COLUMN used as a lightweight design documentation surface available to DB-level tooling"

patterns-established:
  - "Fire-and-forget Supabase UPDATE: async function + void call + try/catch swallowed"
  - "Migration idempotency: ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS"
  - "Architecture annotations via SQL COMMENT ON — no behavior change, pure documentation"

requirements-completed: [LEVL-02, LEVL-03]

# Metrics
duration: 8min
completed: 2026-05-07
---

# Phase 01 Plan 11: last_active_at + LEVL-03 modal copy — gamification gap closure

**Passive return-visit tracking added via `profiles.last_active_at`, LEVL-02 design annotated in SQL and REQUIREMENTS.md, and LevelUpModal L2 unlock list corrected to four items with "Avaliar Promptys e enviar imagens geradas"**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-07T20:06:22Z
- **Completed:** 2026-05-07T20:14:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added `profiles.last_active_at` column (migration 005) with DESC index and backfill from `created_at`; annotated `level_from_points()` and the column itself with design-choice COMMENTs
- Wired `touchLastActive()` into `src/main.tsx`: fires fire-and-forget on initial session restore and every `onAuthStateChange` event with a user present
- Updated `REQUIREMENTS.md` LEVL-02 row with annotation: aggregate 50p threshold approximates four behavioral criteria; return visits now have a DB surface
- Fixed `LevelUpModal` UNLOCKS.L2 array from 3 items to 4 — added `'Avaliar Promptys e enviar imagens geradas'` in position 3 (between Salvar and Seguir)
- Created `LevelUpModal.test.tsx` with 5 tests: L2 four-item assertion (LEVL-03), L3 regression guard, emoji+name render, CTA button, backdrop dismiss handler
- Full test suite grew from 61 to 66 tests; all pass; `pnpm tsc --noEmit` exits 0

## LEVL-02 Design Notes

The `useSave` hook (wired in Plan 01-10) and `profiles.last_active_at` (wired here) are the two database surfaces that satisfy the LEVL-02 behavioral criteria as approximated:

| Behavioral criterion | How approximated |
|----------------------|-----------------|
| ≥5 copies | 5 × 5p copy events = 25p — largest single contributor |
| ≥3 saves | Tracked in `prompty_saves` (0p by design — curator behavior, not beginner) |
| ≥1 feedback | 1 × 5p rate event = 5p |
| ≥2 return visits | `profiles.last_active_at` updated on every auth event; Phase 2 analytics can use this |

The locked CONTEXT.md decision (50p threshold, 5-level schema) is preserved. The SQL COMMENT on `level_from_points()` documents this explicitly so future developers don't attempt to add per-criteria gating to the function.

## Task Commits

1. **Task 1: Migration + types + auth listener wiring for last_active_at + REQUIREMENTS annotation** - `4477b69` (feat)
2. **Task 2: LevelUpModal LEVL-03 unlock copy fix + test** - `f40247c` (feat)

## Files Created/Modified

- `supabase/migrations/20260507000005_last_active_and_levl_annotations.sql` — New migration: ADD COLUMN last_active_at, DESC index, backfill, COMMENT ON FUNCTION level_from_points, COMMENT ON COLUMN profiles.last_active_at
- `src/types/database.types.ts` — Added `last_active_at: string | null` to profiles Row; `last_active_at?: string | null` to Insert and Update shapes
- `src/main.tsx` — Added `touchLastActive()` helper; two fire-and-forget calls (initial load + onAuthStateChange)
- `src/components/modals/LevelUpModal.tsx` — UNLOCKS.L2 expanded from 3 to 4 items; new item at index 2
- `src/components/modals/LevelUpModal.test.tsx` — New: 5 tests covering LEVL-03 unlock copy and existing behavior
- `.planning/REQUIREMENTS.md` — LEVL-02 line annotated with approximation note and Plan 01-11 reference

## Decisions Made

- `profiles.last_active_at` is a passive timestamp with no points awarded — keeps gamification clean; the field is purely a DB surface for future retention analytics
- `touchLastActive` is fire-and-forget (`void` + `try/catch` swallowed) so a transient Supabase network error never blocks the auth flow or UI rendering
- SQL `COMMENT ON FUNCTION` and `COMMENT ON COLUMN` chosen over code comments for design decisions — they survive schema dumps and are visible in Supabase Studio
- LEVL-02 stays approximated by aggregate 50p threshold; per-criteria gating is explicitly deferred to Phase 2 by annotation

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. The migration will need to be applied to the remote Supabase database via `supabase db push` or psql when deploying.

## Next Phase Readiness

- Phase 1 Foundation is fully complete: all 11 plans executed
- `profiles.last_active_at` is available for Phase 2 retention analytics and streak features
- LevelUpModal LEVL-03 copy is locked in and tested — Phase 2 can build CUR-01/CUR-02 without changing the modal

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
