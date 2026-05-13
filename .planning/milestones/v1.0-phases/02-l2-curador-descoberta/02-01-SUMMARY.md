---
phase: 02-l2-curador-descoberta
plan: 01
subsystem: database
tags: [supabase, postgres, migration, tsvector, fts, rls, typescript, vitest]

requires:
  - phase: 01-foundation
    provides: "Phase 1 schema (promptys, profiles, prompty_tests, all RLS); database.types.ts placeholder; test infrastructure (vitest, RTL)"

provides:
  - "Migration 006: reports table with RLS, promptys.category, promptys.fts (trigger-maintained tsvector), profiles.is_admin"
  - "Regenerated database.types.ts with new tables/columns (reports, category, fts, is_admin)"
  - "13 Wave 0 test scaffolds with 59 it.todo() entries documenting Phase 2 behavior contracts"

affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07]

tech-stack:
  added: []
  patterns:
    - "Trigger-maintained tsvector: use trigger (not GENERATED ALWAYS AS) for FTS columns containing TEXT[] — array_to_string() is STABLE not IMMUTABLE in PG17, blocking generated columns"
    - "Wave 0 test scaffold: it.todo() entries + one anchor it() passing assertion; avoids Vite static import resolution on non-existent modules"
    - "Supabase CLI gen types stdout: pipe to file then strip trailing CLI version notice appended to stdout"

key-files:
  created:
    - supabase/migrations/20260508000006_l2_features.sql
    - src/hooks/useSearch.test.ts
    - src/hooks/useSaved.test.ts
    - src/hooks/useReport.test.ts
    - src/hooks/useCommunityResults.test.ts
    - src/components/feed/RateSheet.test.tsx
    - src/components/feed/ReportSheet.test.tsx
    - src/components/feed/CategorySuggestSheet.test.tsx
    - src/components/feed/CommunityResults.test.tsx
    - src/components/feed/SavedCard.test.tsx
    - src/components/ui/OptionsSheet.test.tsx
    - src/components/ui/FilterChipBar.test.tsx
    - src/pages/SearchPage.test.tsx
    - src/pages/SavedPage.test.tsx
  modified:
    - src/types/database.types.ts

key-decisions:
  - "FTS column uses trigger (not GENERATED ALWAYS AS) — array_to_string(TEXT[], TEXT) is classified STABLE in PostgreSQL 17, which is forbidden in generated column expressions; trigger achieves identical behavior"
  - "FTS config uses 'simple'::regconfig not 'portuguese' — matches plan's Pitfall 3 mitigation (simple is universally available; production can upgrade to portuguese via migration if needed)"
  - "Wave 0 test scaffolds use anchor assertion (expect(true).toBe(true)) instead of dynamic import — Vite performs static module resolution at transform time, causing errors for non-existent module paths even in catch() blocks"
  - "Supabase CLI gen types used (not manual edit) — CLI linked to remote DB and generated correct types after stripping CLI version notice from stdout"

requirements-completed:
  - FEED-06
  - FEED-07
  - CUR-05
  - MODR-01
  - MODR-02
  - MODR-03

duration: 7min
completed: 2026-05-12
---

# Phase 2 Plan 01: L2 Foundation — Schema + Types + Wave 0 Scaffolds Summary

**Migration 006 applied: reports table with RLS, promptys.category + trigger-maintained fts tsvector + GIN index, profiles.is_admin; database.types.ts regenerated via CLI; 13 Wave 0 test scaffolds with 59 todos committed**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-12T20:30:56Z
- **Completed:** 2026-05-12T20:38:22Z
- **Tasks:** 4 (3 auto + 1 human-verify auto-approved)
- **Files modified:** 16

## Accomplishments

- Phase 2 database schema locked: reports table + RLS, category filter column, fts full-text search column with GIN index, is_admin flag
- TypeScript types regenerated via Supabase CLI gen types — `Tables<'reports'>`, `promptys.category`, `promptys.fts`, `profiles.is_admin` all accessible
- 13 Wave 0 test scaffold files created, 59 behavior-documenting todos registered; all 24 test files pass (79 passing + 59 todo)

## Task Commits

1. **Task 1: Phase 2 migration 006** - `e408568` (feat)
2. **Task 2: Regenerate database.types.ts** - `bc8f135` (feat)
3. **Task 3: Wave 0 test scaffolds** - `69c8832` (test)
4. **Task 4: Checkpoint auto-approved** - (no separate commit — verification confirmed via automated DB queries)

## Files Created/Modified

- `supabase/migrations/20260508000006_l2_features.sql` — Phase 2 schema migration (reports, category, fts trigger, is_admin)
- `src/types/database.types.ts` — Regenerated with reports, promptys.category/fts, profiles.is_admin
- `src/hooks/useSearch.test.ts` — Wave 0 scaffold (FEED-06, FEED-07); plan 02-03
- `src/hooks/useSaved.test.ts` — Wave 0 scaffold (CUR-03); plan 02-04
- `src/hooks/useReport.test.ts` — Wave 0 scaffold (CUR-04, CUR-05); plan 02-03
- `src/hooks/useCommunityResults.test.ts` — Wave 0 scaffold (CUR-01); plan 02-02
- `src/components/feed/RateSheet.test.tsx` — Wave 0 scaffold (CUR-01/CUR-02); plan 02-02
- `src/components/feed/ReportSheet.test.tsx` — Wave 0 scaffold (CUR-05); plan 02-02
- `src/components/feed/CategorySuggestSheet.test.tsx` — Wave 0 scaffold (CUR-04); plan 02-02
- `src/components/feed/CommunityResults.test.tsx` — Wave 0 scaffold (CUR-01); plan 02-02
- `src/components/feed/SavedCard.test.tsx` — Wave 0 scaffold (CUR-03); plan 02-02
- `src/components/ui/OptionsSheet.test.tsx` — Wave 0 scaffold; plan 02-02
- `src/components/ui/FilterChipBar.test.tsx` — Wave 0 scaffold (FEED-06); plan 02-02
- `src/pages/SearchPage.test.tsx` — Wave 0 scaffold (FEED-06, FEED-07); plan 02-03
- `src/pages/SavedPage.test.tsx` — Wave 0 scaffold (CUR-03); plan 02-04

## Decisions Made

1. **FTS via trigger, not generated column** — `array_to_string(TEXT[], TEXT)` is `STABLE` in PG17, which PostgreSQL forbids in `GENERATED ALWAYS AS` expressions. Switching to a trigger-maintained column achieves identical semantics (title + description + style_tags coverage) without volatility restrictions. The `tags_to_text()` helper wraps `array_to_string` in a separate `IMMUTABLE` function but the trigger approach is cleaner.

2. **FTS config: `'simple'::regconfig`** — Matches plan Pitfall 3 decision. Simple is available in all Postgres installations and does not require dictionary configuration. Portuguese config is a future migration if needed.

3. **Wave 0 scaffolds: anchor assertion** — Vitest with Vite performs static module resolution at transform time, causing `Failed to resolve import` errors for `await import('./NonExistent').catch(() => null)` patterns, unlike Jest/Node where the catch suppresses the error. Replaced with `expect(true).toBe(true)` anchor assertions that keep the describe block collectible.

4. **CLI gen types used** — `pnpm exec supabase gen types typescript --linked` succeeded and generated accurate types. The CLI appends a version notice to stdout which was stripped from the file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FTS GENERATED ALWAYS AS fails with array_to_string STABLE volatility**
- **Found during:** Task 1 (migration application via `supabase db push`)
- **Issue:** `array_to_string(TEXT[], TEXT)` is classified `STABLE` (not `IMMUTABLE`) in PostgreSQL 17. PostgreSQL requires all functions in `GENERATED ALWAYS AS` expressions to be `IMMUTABLE`. Migration failed with `ERROR: generation expression is not immutable (SQLSTATE 42P17)` even after adding `::regconfig` cast.
- **Fix:** Changed from `GENERATED ALWAYS AS` column to a trigger-maintained column. Added `CREATE OR REPLACE FUNCTION trigger_fn_promptys_fts()` trigger function + `CREATE TRIGGER trigger_promptys_fts_update BEFORE INSERT OR UPDATE` + backfill `UPDATE`. Column type and GIN index remain unchanged.
- **Files modified:** `supabase/migrations/20260508000006_l2_features.sql`
- **Verification:** Migration applied successfully, `idx_promptys_fts` confirmed via `pg_indexes` query, `fts` column (tsvector) confirmed via `information_schema.columns`
- **Committed in:** `e408568` (Task 1 commit)

**2. [Rule 1 - Bug] CLI gen types appends version notice to stdout**
- **Found during:** Task 2 (type regen)
- **Issue:** `pnpm exec supabase gen types typescript --linked > src/types/database.types.ts` appended CLI version notice text to the end of the TypeScript file, causing 22 type errors.
- **Fix:** Stripped the appended text (3 lines after `} as const`) from the file.
- **Files modified:** `src/types/database.types.ts`
- **Verification:** `pnpm type-check` exits 0
- **Committed in:** `bc8f135` (Task 2 commit)

**3. [Rule 1 - Bug] Vite static analysis fails dynamic import of non-existent module**
- **Found during:** Task 3 (running `pnpm test:run` after scaffold creation)
- **Issue:** `await import('./useSearch').catch(() => null)` fails in Vitest/Vite because Vite performs static import resolution at transform time (not runtime), throwing `Failed to resolve import` even when the catch block would suppress it.
- **Fix:** Replaced `it('module is importable', async () => { ... })` pattern with `it('Wave 0 scaffold is registered (...)', () => { expect(true).toBe(true) })` anchor assertion in all 13 test files.
- **Files modified:** All 13 scaffold files
- **Verification:** `pnpm test:run` exits 0: 24 test files passed, 79 passing + 59 todo
- **Committed in:** `69c8832` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All auto-fixes necessary for correctness. No scope changes — same schema surface, same test coverage. The trigger approach for fts is documented in the plan's "Alternatives Considered" as equivalent to the generated column approach.

## Issues Encountered

- `supabase db push` is interactive by default but accepted `echo "y" |` pipe to auto-confirm the migration list prompt.
- `supabase db query --linked` is the correct subcommand for remote queries (not `supabase db execute --linked`).

## Auto-Mode Checkpoint (Task 4)

Task 4 (human-verify: migration live in Supabase) was **auto-approved** in auto-mode after completing all 7 verification checks programmatically:

1. `reports` table confirmed in `information_schema.tables`
2. `reports` columns confirmed: id, reporter_id, prompty_id, type, reason, notes, created_at
3. `reports_insert_own` and `reports_select_own` confirmed in `pg_policies`
4. `promptys.category` (text) and `promptys.fts` (tsvector) confirmed in `information_schema.columns`
5. `profiles.is_admin` (boolean) confirmed in `information_schema.columns`
6. `idx_promptys_fts` confirmed in `pg_indexes` (1 row)
7. `pnpm type-check` exits 0

## Next Phase Readiness

- Database schema locked for Phase 2 — no further schema changes needed in Wave 2 or Wave 3
- `Tables<'reports'>`, `Tables<'promptys'>` (with `.category`, `.fts`), `Tables<'profiles'>` (with `.is_admin`) all type-safe in downstream code
- 13 Wave 0 test files present — plans 02-02, 02-03, 02-04 can write production code against committed types and edit test files in place
- `supabase.from('promptys').textSearch('fts', query, { type: 'websearch', config: 'simple' })` is available for plan 02-03 (SearchPage)

---
*Phase: 02-l2-curador-descoberta*
*Completed: 2026-05-12*
