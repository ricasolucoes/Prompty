---
phase: 03-l3-criador
plan: "01"
subsystem: database
tags: [supabase, postgres, typescript, vitest, migrations, triggers, storage]

requires:
  - phase: 02-l2-curador
    provides: "FTS migration pattern (20260508000006_l2_features.sql), Wave 0 scaffold pattern with anchor assertions"

provides:
  - "parent_id UUID FK column on promptys with ON DELETE SET NULL (CREAT-04)"
  - "prompty-covers Storage bucket with 2MB/WebP/JPEG/PNG and 4 RLS policies (CREAT-01)"
  - "trg_points_on_publish trigger — 50p on INSERT with status='published' (CREAT-01)"
  - "database.types.ts promptys Row/Insert/Update with parent_id field"
  - "6 Wave 0 test scaffold files with 26 it.skip tests ready for implementation"

affects: [03-02, 03-03, 03-04, 03-05, 03-06]

tech-stack:
  added: []
  patterns:
    - "Phase 3 migration uses 20260512000007 timestamp (not 20260508000006 which is reserved for l2_features)"
    - "Wave 0 test scaffolds import target module; all tests skipped with it.skip; anchor assert expect(true).toBe(true)"
    - "Manual database.types.ts edit pattern when gen:types unavailable (supabase local not running)"

key-files:
  created:
    - supabase/migrations/20260512000007_phase3_criador.sql
    - src/hooks/useCreatePrompty.test.ts
    - src/hooks/useMyPromptys.test.ts
    - src/pages/CriarPage.test.tsx
    - src/components/create/WizardStep1Basics.test.tsx
    - src/components/create/WizardStep4Advanced.test.tsx
    - src/components/profile/MyPromptysGrid.test.tsx
  modified:
    - src/types/database.types.ts

key-decisions:
  - "Phase 3 migration filename is 20260512000007_phase3_criador.sql — 20260508000006 was already used by l2_features migration; timestamp set to today's date (20260512)"
  - "database.types.ts edited manually (gen:types unavailable — supabase local not running); parent_id added to promptys Row/Insert/Update only"
  - "file truncation bug: gen:types attempt truncated database.types.ts to 0 bytes via shell > redirect before failing; recovered via git checkout HEAD~1"

patterns-established:
  - "src/components/create/ and src/components/profile/ directories created as part of Wave 0 scaffold seeding"

requirements-completed: [CREAT-01, CREAT-04]

duration: 2min
completed: 2026-05-12
---

# Phase 3 Plan 01: L3 Criador Foundation Summary

**Phase 3 SQL migration (parent_id FK, prompty-covers bucket, publish-points trigger) + manual database.types.ts update + 6 Wave 0 test scaffolds seeded with 26 skipped requirement tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-12T21:18:30Z
- **Completed:** 2026-05-12T21:20:50Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Migration `20260512000007_phase3_criador.sql` adds `parent_id UUID REFERENCES promptys(id) ON DELETE SET NULL`, `idx_promptys_parent` index, `prompty-covers` Storage bucket with 4 RLS policies, and `trg_points_on_publish` trigger (50p on published INSERT)
- `database.types.ts` manually updated with `parent_id: string | null` in promptys Row/Insert/Update; `pnpm type-check` passes clean
- Six Wave 0 test scaffold files created covering CREAT-01/02/03/04/05 and LEVL-07; all 26 tests skipped; `pnpm test:run` exits 0

## Task Commits

1. **Task 1: Phase 3 migration** - `9ef10ed` (chore)
2. **Task 2: Regenerate database.types.ts** - `78ff75c` (chore)
3. **Task 3: Wave 0 test scaffolds** - `ce18528` (test)

## Files Created/Modified

- `supabase/migrations/20260512000007_phase3_criador.sql` — Phase 3 DB migration (parent_id, prompty-covers bucket, publish trigger)
- `src/types/database.types.ts` — Added parent_id to promptys Row/Insert/Update
- `src/hooks/useCreatePrompty.test.ts` — Wave 0 scaffold: 5 skipped tests (CREAT-01/04/05)
- `src/hooks/useMyPromptys.test.ts` — Wave 0 scaffold: 3 skipped tests (CREAT-03)
- `src/pages/CriarPage.test.tsx` — Wave 0 scaffold: 3 skipped tests (CREAT-01/04)
- `src/components/create/WizardStep1Basics.test.tsx` — Wave 0 scaffold: 5 skipped tests (CREAT-01/02)
- `src/components/create/WizardStep4Advanced.test.tsx` — Wave 0 scaffold: 5 skipped tests (CREAT-05)
- `src/components/profile/MyPromptysGrid.test.tsx` — Wave 0 scaffold: 5 skipped tests (CREAT-03/LEVL-07)

## Decisions Made

- **Migration filename `20260512000007_phase3_criador.sql`** — The plan specified `20260508000006_phase3_criador.sql` but that number conflicts with the existing `20260508000006_l2_features.sql` (Phase 2 migration). Used `20260512000007` with today's date as the unique timestamp prefix.
- **Manual types edit** — `gen:types` failed because `supabase start` is not running (matching prior Phase 1 pattern from STATE.md). Added `parent_id` to Row/Insert/Update manually; follows exact same procedure documented in Phase 1 decisions.
- **File recovery via git** — The `gen:types` shell command truncated `database.types.ts` to 0 bytes via `>` redirect before the CLI returned an error. Recovered with `git checkout HEAD~1 -- src/types/database.types.ts` and then applied manual edits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recovered database.types.ts after truncation by failed gen:types**
- **Found during:** Task 2 (Regenerate database.types.ts)
- **Issue:** `pnpm gen:types` runs `npx supabase gen types ... > src/types/database.types.ts` — the shell `>` redirect empties the file before the supabase CLI runs; when CLI fails (supabase not running), file is left at 0 bytes
- **Fix:** `git checkout HEAD~1 -- src/types/database.types.ts` to restore, then manual edits to add `parent_id` to all three blocks
- **Files modified:** `src/types/database.types.ts`
- **Verification:** `grep -c parent_id` returns 3; `pnpm type-check` exits 0
- **Committed in:** `78ff75c` (Task 2 commit)

**2. [Rule 1 - Bug] Migration filename conflict — renamed to avoid collision**
- **Found during:** Task 1 (Phase 3 migration)
- **Issue:** Plan specified `20260508000006_phase3_criador.sql` which conflicts with existing `20260508000006_l2_features.sql`
- **Fix:** Used `20260512000007_phase3_criador.sql` (today's date, sequential number)
- **Files modified:** `supabase/migrations/20260512000007_phase3_criador.sql`
- **Verification:** `ls supabase/migrations/` shows no conflict
- **Committed in:** `9ef10ed` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep. All acceptance criteria met with corrected filenames.

## Issues Encountered

- `gen:types` attempt truncated database.types.ts before failing — recovered from git and continued with manual edit (same approach used in Phase 1 per STATE.md decisions)

## User Setup Required

None — no external service configuration required for this foundational plan. The migration file is ready; apply via `pnpm supabase db push --linked` or `psql "$SUPABASE_DB_URL" -f supabase/migrations/20260512000007_phase3_criador.sql` when the database is accessible.

## Next Phase Readiness

- Database surface locked: `parent_id` column available for Phase 3 feature plans (03-02 through 03-06)
- Test harness seeded: all 6 Wave 0 files ready for implementation code to be written against
- TypeScript types updated: downstream plans can import `Database['public']['Tables']['promptys']['Row']` with `parent_id`
- No blockers for parallel Wave 2 execution

---
*Phase: 03-l3-criador*
*Completed: 2026-05-12*
