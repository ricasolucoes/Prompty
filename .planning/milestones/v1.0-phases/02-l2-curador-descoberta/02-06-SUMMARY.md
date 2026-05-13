---
phase: 02-l2-curador-descoberta
plan: "06"
subsystem: ui
tags: [react, vitest, testing-library, zustand, inline-styles, bottom-sheet]

requires:
  - phase: 02-l2-curador-descoberta
    plan: "01"
    provides: reports table + RLS migration
  - phase: 02-l2-curador-descoberta
    plan: "02"
    provides: CATEGORIES constant, moreHorizontal/flag/tag icons in Icon.tsx
  - phase: 02-l2-curador-descoberta
    plan: "05"
    provides: useReport hook, OptionsSheet component

provides:
  - ReportSheet (CUR-05/MODR-01) — destructive bottom sheet for reporting inappropriate content
  - CategorySuggestSheet (CUR-04) — primary bottom sheet for category suggestions
  - PromptyDetailPage "..." L2-gated menu wiring — OptionsSheet + both sheets + toast feedback

affects: [02-07, 03-l3-criador]

tech-stack:
  added: []
  patterns:
    - Bottom sheet resets all state via useEffect when open becomes false
    - Destructive submit uses raw <button> styled inline (#FF3B6B) instead of PrimaryButton override
    - isL2 gating via LEVEL_ORDER.indexOf comparison (not string equality) — supports L3/L4/L5 as well
    - Auth store mock in tests extended with mockProfile variable alongside mockUser for per-test level control

key-files:
  created:
    - src/components/feed/ReportSheet.tsx
    - src/components/feed/ReportSheet.test.tsx
    - src/components/feed/CategorySuggestSheet.tsx
    - src/components/feed/CategorySuggestSheet.test.tsx
  modified:
    - src/pages/PromptyDetailPage.tsx
    - src/pages/PromptyDetailPage.test.tsx

key-decisions:
  - "ReportSheet destructive button uses raw <button> styled inline (#FF3B6B) — PrimaryButton has no style prop, avoids modifying shared component"
  - "isL2 uses LEVEL_ORDER.indexOf comparison (not id === 'L2') — correctly treats L3/L4/L5 as also qualifying"
  - "PromptyDetailPage test mock extended with mockProfile alongside mockUser — useAuthStore mock now selects from {user, profile} state, enabling per-test level simulation without Zustand setState"

patterns-established:
  - "Sheet state machine: showOptions → (showReport | showCategorySuggest); OptionsSheet.onClick closes itself via OptionsSheet internals before parent setState opens child sheet"
  - "onSubmitted callback pattern: parent owns toast state, sheet owns form state — clean separation"

requirements-completed: [CUR-04, CUR-05, MODR-01]

duration: 4min
completed: 2026-05-12
---

# Phase 2 Plan 06: ReportSheet + CategorySuggestSheet + PromptyDetailPage L2 menu

**Two domain bottom sheets (report + category suggest) wired into PromptyDetailPage via L2-gated "..." OptionsSheet menu, delivering CUR-04, CUR-05, and MODR-01 with LEVL-07 enforcement**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-12T20:59:30Z
- **Completed:** 2026-05-12T21:04:20Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- ReportSheet: reason select (4 options), optional notes textarea, destructive submit button (#FF3B6B inline), error alert, state reset on close — 6 RTL tests
- CategorySuggestSheet: category select (10 CATEGORIES entries), optional notes textarea, PrimaryButton submit — 5 RTL tests
- PromptyDetailPage: "..." button gated on isL2 (absent for anon/L1), OptionsSheet wired to open ReportSheet and CategorySuggestSheet, toast feedback on success — 6 new RTL tests + 4 existing pass

## Task Commits

1. **Task 1: ReportSheet component + tests (CUR-05/MODR-01)** — `3bd97f9` (feat)
2. **Task 2: CategorySuggestSheet component + tests (CUR-04)** — `a4135eb` (feat)
3. **Task 3: Wire "..." button + sheets into PromptyDetailPage (LEVL-07)** — `69b1e94` (feat)

**Plan metadata:** (docs commit — see below)

_Note: All TDD tasks followed RED → GREEN flow. No REFACTOR commits needed._

## Files Created/Modified

- `src/components/feed/ReportSheet.tsx` — Bottom sheet for CUR-05/MODR-01 report flow; exports ReportSheet
- `src/components/feed/ReportSheet.test.tsx` — 6 RTL tests replacing Wave 0 scaffold
- `src/components/feed/CategorySuggestSheet.tsx` — Bottom sheet for CUR-04 category suggestion flow; exports CategorySuggestSheet
- `src/components/feed/CategorySuggestSheet.test.tsx` — 5 RTL tests replacing Wave 0 scaffold
- `src/pages/PromptyDetailPage.tsx` — Imports OptionsSheet/ReportSheet/CategorySuggestSheet/levelOf; adds isL2 check + 3 sheet states + "..." button in header + sheets JSX block
- `src/pages/PromptyDetailPage.test.tsx` — Auth mock extended with mockProfile; 6 new Phase 2 tests added in separate describe block; 4 existing tests unchanged

## Decisions Made

- **ReportSheet destructive button uses raw `<button>` styled inline (#FF3B6B):** PrimaryButton does not accept a `style` prop for background override, and we deliberately avoided modifying the shared component in this plan.
- **isL2 uses `LEVEL_ORDER.indexOf` comparison:** `levelOf(profile.points).id >= 'L2'` would be string comparison and fragile. Index comparison correctly includes L3/L4/L5.
- **Auth mock extended to include `profile`:** The existing PromptyDetailPage test mock used a simple `mockUser` variable with a selector function. Rather than switching to Zustand's real `setState` (which would require unmocking), we extended the mock state object to include `mockProfile`, maintaining the established test pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted test describe block to match existing mock pattern**
- **Found during:** Task 3 (PromptyDetailPage test authoring)
- **Issue:** Plan's new test code called `useAuthStore.setState(...)`, which is unavailable because the test file mocks `@/stores/auth.store` as a simple function, not a real Zustand store. Calling `.setState()` on the mock would throw or silently fail.
- **Fix:** Extended the existing mock state object from `{ user }` to `{ user, profile }` and introduced `let mockProfile = null` alongside `mockUser`. New tests set `mockProfile` directly rather than calling `setState`. Mock selector updated to `(s: { user, profile }) => selector(s)`.
- **Files modified:** `src/pages/PromptyDetailPage.test.tsx`
- **Verification:** All 10 PromptyDetailPage tests pass (4 existing + 6 new). LEVL-07 L1/anon tests correctly exclude "..." button.
- **Committed in:** `69b1e94` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test mock pattern adaptation)
**Impact on plan:** No scope creep. Adaptation was purely mechanical — behavior under test is identical.

## Issues Encountered

None — all tasks completed on first attempt with no build issues.

## Next Phase Readiness

- Plan 02-07 (CommunityResults integration on PromptyDetailPage) can proceed — PromptyDetailPage is clean and structured; the sheets and L2 menu are appended at the bottom of the `<main>` element, leaving the rest of the component untouched.
- Requirements CUR-04, CUR-05, MODR-01 are satisfied at the UI surface.
- All 24 test files green (135 tests), build green.

---
*Phase: 02-l2-curador-descoberta*
*Completed: 2026-05-12*
