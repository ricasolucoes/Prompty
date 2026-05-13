---
phase: 01-foundation
plan: 10
subsystem: ui
tags: [react, react-router, supabase-js, vitest, rtl, prompty-detail]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: useSave hook (plan-08), useCopy hook (plan-07), FeedCard component (plan-06), supabase client, auth store
provides:
  - PromptyDetailPage at route /p/:slug — full prompt display + Copiar + Salvar
  - FeedCard title now navigates to detail page via Link
  - useSave hook is no longer orphaned — wired into production graph
affects:
  - Any future plan that adds detail-page affordances (remix, share, comments)
  - VERIFICATION.md gap closure for FEED-03 and SOCL-01

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Detail-page pattern: fetch by slug with maybeSingle, cancelled flag, notFound state"
    - "Save button as plain <button> with stateful aria-label (not SecondaryButton) to avoid prop-API mismatch"
    - "FeedCard tests wrapped in MemoryRouter — required whenever FeedCard renders Link children"

key-files:
  created:
    - src/pages/PromptyDetailPage.tsx
    - src/pages/PromptyDetailPage.test.tsx
  modified:
    - src/components/feed/FeedCard.tsx
    - src/components/feed/FeedCard.test.tsx
    - src/App.tsx

key-decisions:
  - "Save button placed on PromptyDetailPage, not FeedCard, to preserve LEVL-06 constraint (FeedCard tests assert no save/bookmark button)"
  - "Plain <button> used for Save action because SecondaryButton does not accept aria-label; stateful aria-label ('Salvar na biblioteca' / 'Remover dos salvos') required for accessibility"
  - "FeedCard.test.tsx wrapped in MemoryRouter after Link addition caused router-context crash — Rule 1 auto-fix"

patterns-established:
  - "Detail page slug-based URL: /p/:slug — human-readable, shareable, anon-accessible"
  - "useSave called unconditionally (Rules of Hooks) with prompty?.id ?? '' — empty id is no-op until data loads"

requirements-completed: [FEED-03, SOCL-01]

# Metrics
duration: 4min
completed: 2026-05-07
---

# Phase 01 Plan 10: PromptyDetailPage + FeedCard Link Summary

**Dedicated Prompty detail page at /p/:slug with full prompt display, Copiar action, and auth-gated Salvar button using useSave hook — closes FEED-03 and SOCL-01 verification gaps**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-07T20:06:23Z
- **Completed:** 2026-05-07T20:09:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `PromptyDetailPage` at `/p/:slug` — full prompt (no 3-line clamp), Copiar prompt button, Salvar button for authenticated users only
- Wired the orphaned `useSave` hook into the production component graph (first production import)
- FeedCard title now renders as `<Link to={/p/${prompty.slug}}>` enabling navigation from feed to detail
- Route `/p/:slug` registered inside ChromeShell so AppHeader + TabBar remain visible on detail page
- All 66 tests pass; TypeScript compiles cleanly

## Task Commits

1. **Task 1: Create PromptyDetailPage component + tests** - `a8e2250` (feat)
2. **Task 2: Wire FeedCard title to Link + add /p/:slug route to App.tsx** - `42156aa` (feat)

## Files Created/Modified

- `src/pages/PromptyDetailPage.tsx` — Detail screen; fetches by slug, renders full prompt, Copiar + conditional Salvar
- `src/pages/PromptyDetailPage.test.tsx` — 4 smoke tests: FEED-03, SOCL-01 anon/auth, back-link
- `src/components/feed/FeedCard.tsx` — Added `<Link>` import; wrapped title `<h2>` text in `<Link to={/p/:slug}>`
- `src/components/feed/FeedCard.test.tsx` — Added MemoryRouter wrapper via `renderCard()` helper for all render calls
- `src/App.tsx` — Imported PromptyDetailPage; added `<Route path="/p/:slug" element={<PromptyDetailPage />}>` inside ChromeShell

## Decisions Made

1. **Save button on detail page, not FeedCard** — LEVL-06 constraint: `FeedCard.test.tsx` lines 48-55 explicitly assert no save/bookmark button on the card. The detail page is the correct surface for this action.
2. **Plain `<button>` for Save, not `<SecondaryButton>`** — `SecondaryButton` does not accept `aria-label`. A stateful aria-label ("Salvar na biblioteca" / "Remover dos salvos") is required for accessibility and for test assertions to work correctly via `getByLabelText`.
3. **Route inside ChromeShell** — AppHeader and TabBar should remain visible on the detail page. Zero additional code needed; the existing chrome wraps the new route automatically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FeedCard.test.tsx needed MemoryRouter wrapper after Link addition**
- **Found during:** Task 2 (wire FeedCard title to Link)
- **Issue:** Adding `<Link>` to FeedCard caused all 9 FeedCard tests to crash with `TypeError: Cannot destructure property 'basename' of 'React10.useContext(...)' as it is null` — Link requires a Router context that the bare test renders did not provide
- **Fix:** Added `import { MemoryRouter } from 'react-router-dom'` and a `renderCard(ui)` helper that wraps all renders in `<MemoryRouter>`. Replaced all 9 `render(<FeedCard ...>)` calls with `renderCard(<FeedCard ...>)`.
- **Files modified:** `src/components/feed/FeedCard.test.tsx`
- **Verification:** All 9 FeedCard tests pass; LEVL-06 assertions unchanged and green
- **Committed in:** `42156aa` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/crash in test file caused by planned FeedCard Link addition)
**Impact on plan:** Necessary consequence of the Link addition. No scope creep. LEVL-06 test assertions are unchanged — still asserting no save/bookmark button on FeedCard.

## Issues Encountered

None beyond the auto-fixed test router context issue above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- FEED-03 and SOCL-01 verification gaps are now closed
- `useSave` hook is wired into production; future plans can add save-list views
- Detail page is a blank canvas for future L2+ features (remix, share, comments)
- No blockers for Phase 2

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
