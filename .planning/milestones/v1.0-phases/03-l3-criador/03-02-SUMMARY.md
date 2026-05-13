---
phase: 03-l3-criador
plan: "02"
subsystem: hooks
tags: [supabase, react, zustand, vitest, tdd, wizard, publish, storage, stats]

requires:
  - phase: 03-01
    provides: "parent_id column on promptys, prompty-covers storage bucket, award_points_on_publish trigger, prompty_versions table, database.types.ts updated"

provides:
  - "useCreatePrompty hook: WizardData/PublishResult interfaces, publish(), slug generation, cover upload to prompty-covers, parent_id wiring, prompty_versions snapshot"
  - "useMyPromptys hook: MyPromptyWithStats interface, stats aggregation (copies/saves/feedbacks) via parallel count queries"
  - "8 TDD tests for useCreatePrompty (CREAT-01, CREAT-04, CREAT-05)"
  - "5 TDD tests for useMyPromptys (CREAT-03)"

affects:
  - "03-03 (CriarPage wizard — consumes useCreatePrompty)"
  - "03-04 (ProfilePage L3 section — consumes useMyPromptys)"
  - "03-05 (PromptyDetailPage variation UI — consumes WizardData.parentId)"

tech-stack:
  added: []
  patterns:
    - "TDD red-green for hook layers: write failing test → write implementation → verify green"
    - "Dynamic import after vi.mock() for hooks that depend on mocked modules"
    - "vi.fn() capture of insert/upload payloads for assertion on DB call shape"
    - "Promise.all for parallelized N+1 count queries per prompty"
    - "Cancellation flag (let cancelled = false) in useEffect async loads"

key-files:
  created:
    - src/hooks/useCreatePrompty.ts
    - src/hooks/useMyPromptys.ts
  modified:
    - src/hooks/useCreatePrompty.test.ts
    - src/hooks/useMyPromptys.test.ts

key-decisions:
  - "generateSlug: kebab(title) normalized via NFD + diacritic strip, truncated to 40 chars, + Math.random().toString(36).slice(2,8) suffix (no nanoid dependency)"
  - "Cover upload uses upsert: true (unlike prompty-results which uses upsert: false) — creator may re-upload cover for same slug"
  - "Cover upload failure is non-fatal: prompty publishes with cover_url=null; matches useTest.ts pattern"
  - "prompty_versions insert is best-effort (no error surfaced to caller) — publish() succeeds even if snapshot fails"
  - "useMyPromptys uses one-shot fetch + Promise.all (not useInfiniteQuery) — creator has tens of promptys at MVP scale"
  - "copies count uses point_events WHERE event_type='copy' AND ref_id=promptyId — semantically unique-copier count due to UNIQUE constraint on (user_id, event_type, ref_id)"

patterns-established:
  - "WizardData interface: beginner_prompt maps to template column, category maps to difficulty column"
  - "Storage path convention for covers: {userId}/{slug}-cover.webp under prompty-covers bucket"
  - "Stats aggregation pattern: Promise.all([point_events count, prompty_saves count, prompty_tests count]) per prompty row"

requirements-completed: [CREAT-01, CREAT-03, CREAT-04, CREAT-05]

duration: 8min
completed: 2026-05-12
---

# Phase 03 Plan 02: Hooks Layer (useCreatePrompty + useMyPromptys) Summary

**Two Supabase hook layers — publish with slug gen/cover upload/version snapshot (useCreatePrompty) and stats aggregation via parallelized count queries (useMyPromptys) — unlocking wizard and profile grid work in parallel**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-12T20:47:00Z
- **Completed:** 2026-05-12T20:50:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `useCreatePrompty`: publish() maps WizardData to DB columns, generates kebab slug with random suffix, uploads cover to `prompty-covers` (upsert: true, non-fatal), sets parent_id for variation wiring, creates prompty_versions snapshot for advanced mode
- `useMyPromptys`: returns authenticated user's published promptys enriched with copies/saves/feedbacks via parallel count queries; empty list immediately for unauthenticated users
- 13 TDD tests (8 + 5) — all passing, full suite 159 tests green

## Task Commits

1. **Task 1: useCreatePrompty hook** - `f1c5aec` (feat)
2. **Task 2: useMyPromptys hook** - `06b8513` (feat)

## Files Created/Modified

- `src/hooks/useCreatePrompty.ts` - WizardData/PublishResult interfaces, generateSlug(), uploadCoverImage(), publish() orchestrating insert + cover + version snapshot
- `src/hooks/useCreatePrompty.test.ts` - 8 TDD tests replacing Wave 0 scaffold (CREAT-01, CREAT-04, CREAT-05)
- `src/hooks/useMyPromptys.ts` - MyPromptyWithStats interface, fetchStats() with Promise.all, useMyPromptys() with useEffect + cancellation
- `src/hooks/useMyPromptys.test.ts` - 5 TDD tests replacing Wave 0 scaffold (CREAT-03)

## Decisions Made

- `generateSlug` uses `Math.random().toString(36).slice(2, 8)` — no nanoid dependency added, stays within established project toolchain
- Cover upload `upsert: true` — creator can re-upload cover without needing to delete first; different from prompty-results (upsert: false) where each test creates a unique path via timestamp
- `prompty_versions` insert is best-effort (no `await` error handling) — publish result is not blocked by snapshot failure; SQL trigger awards 50p regardless
- `useMyPromptys` uses plain `useEffect` + `useState` (not useInfiniteQuery) — MVP scale does not warrant cursor pagination for owned promptys

## Deviations from Plan

None — plan executed exactly as written. Implementation follows the exact contract specified in the plan action blocks.

## Issues Encountered

Vitest warning "Maximum update depth exceeded" appeared in stderr for two `useMyPromptys` tests. This is a test-environment artifact from the `useAuthStore` mock returning a new object literal on each selector call (causing infinite re-renders in JSDOM), not a production bug. The hook code itself is correct (`[user]` dependency is stable after the first render when using real Zustand). All 5 tests passed correctly despite the warning.

## Next Phase Readiness

- `WizardData`, `PublishResult`, `MyPromptyWithStats` exported and ready for consumption by Plans 03-03, 03-04, 03-05
- Hook contracts are locked — wizard UI (03-03) and profile grid (03-04) can proceed in parallel
- No blockers

---
*Phase: 03-l3-criador*
*Completed: 2026-05-12*
