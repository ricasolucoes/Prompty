---
phase: 02-l2-curador-descoberta
plan: "04"
subsystem: saved-library
tags: [useSaved, SavedCard, SavedPage, FilterChipBar, CUR-03, SOCL-02]
dependency_graph:
  requires: [02-01, 02-02, 02-03]
  provides: [SavedPage at /saved, useSaved hook, SavedCard component]
  affects: [App.tsx route /saved]
tech_stack:
  added: []
  patterns: [parallel-Promise.all fetch, 3-column grid (repeat(3,1fr) gap:8), backgroundImage for JSDOM compat]
key_files:
  created:
    - src/hooks/useSaved.ts
    - src/components/feed/SavedCard.tsx
    - src/pages/SavedPage.tsx
  modified:
    - src/hooks/useSaved.test.ts
    - src/components/feed/SavedCard.test.tsx
    - src/pages/SavedPage.test.tsx
    - src/App.tsx
decisions:
  - "SavedCard uses backgroundImage (not background shorthand) for URL-based images — JSDOM expands background shorthand incorrectly; backgroundImage is directly accessible on link.style"
  - "ratings = all prompty_tests rows; results = subset where image_url is non-empty string — two derivations from a single query"
  - "SavedPage handleChipChange ignores null (chip toggle-off) to enforce always-one-active UX"
metrics:
  duration: "4 min"
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_changed: 7
requirements_satisfied: [CUR-03, SOCL-02]
---

# Phase 02 Plan 04: SavedPage — Salvos Library Summary

**One-liner:** Personal library at /saved with 3-chip tab (Salvos/Avaliações/Resultados) backed by parallel `Promise.all` on `prompty_saves` + `prompty_tests`, rendered in a 3-column `SavedCard` grid.

## What Was Built

### useSaved hook (`src/hooks/useSaved.ts`)

Parallel `Promise.all` fetching `prompty_saves` and `prompty_tests` for the authenticated user, ordered by `created_at` descending. Derives three arrays:

- `saves` — rows from `prompty_saves` joined to `promptys`
- `ratings` — all rows from `prompty_tests` joined to `promptys`
- `results` — subset of `prompty_tests` where `image_url` is a non-empty string

Returns `{ saves: [], ratings: [], results: [], loading: false }` immediately when `user` is null (no query, no throw). Exports `SavedItem` and `ResultItem` interfaces.

### SavedCard component (`src/components/feed/SavedCard.tsx`)

Compact card for 3-column grid. Key details:
- `<Link to="/p/{slug}">` with `aria-label="Ver prompty: {title}"`
- Bottom-gradient scrim (`linear-gradient(to top, rgba(0,0,0,0.70), transparent)`)
- Title: `data-testid="saved-card-title"`, `-webkit-line-clamp: 2`
- Background: uses `backgroundImage` style property (not `background` shorthand) for URL-bearing images so JSDOM tests can assert `link.style.backgroundImage`
- Resultados variant: `result_image_url` prop overrides cover; renders camera badge (`data-testid="saved-card-camera-badge"`)

### SavedPage (`src/pages/SavedPage.tsx`)

- 3-chip `FilterChipBar` in `ariaLabelPrefix="Aba"` mode; default chip `'saves'`
- `handleChipChange` ignores `null` (chip toggle-off) to keep always-one-active
- Per-chip empty states with `Icon` + heading + body:
  - Salvos: bookmark icon / "Nenhum prompty salvo ainda"
  - Avaliações: star icon / "Nenhuma avaliação ainda"
  - Resultados: image icon / "Nenhum resultado enviado ainda"
- Grid: `display:grid`, `gridTemplateColumns:'repeat(3,1fr)'`, `gap:8`
- Resultados chip passes `result_image_url` prop to `SavedCard` for image-bearing items

### App.tsx changes

- Added `import { SavedPage } from '@/pages/SavedPage'`
- `/saved` route updated from `<SavedPagePlaceholder />` to `<SavedPage />`
- `SavedPagePlaceholder` function declaration deleted

## Tests Added

| File | Tests |
|------|-------|
| `src/hooks/useSaved.test.ts` | 3 (empty when null; parallel queries; results subset) |
| `src/components/feed/SavedCard.test.tsx` | 6 (Link/href/aria; line-clamp; cover_url; gradient fallback; result variant+badge; no badge without result) |
| `src/pages/SavedPage.test.tsx` | 6 (3 chips; default active; Salvos empty state; Avaliações empty state; Resultados empty state; grid renders cards) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SavedCard background shorthand not readable via JSDOM**

- **Found during:** Task 1 GREEN phase (test run)
- **Issue:** JSDOM does not expose `url(...)` values set via the `background` CSS shorthand on `element.style.background`; the property returns `''`
- **Fix:** Changed `background: url(...) center/cover` to separate `backgroundImage`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat` properties. Tests updated to assert `link.style.backgroundImage` for URL cases and `link.style.background` for gradient-only case
- **Files modified:** `src/components/feed/SavedCard.tsx`, `src/components/feed/SavedCard.test.tsx`
- **Commit:** 09358d1

**2. [Rule 1 - Bug] `exactOptionalPropertyTypes` TS error in unwrapPrompty call**

- **Found during:** Task 1 type-check
- **Issue:** `{ promptys: row.promptys }` where `row.promptys` could be `undefined` — `exactOptionalPropertyTypes` rejects `undefined` where `null` is expected
- **Fix:** Changed to `{ promptys: row.promptys ?? null }`
- **Files modified:** `src/hooks/useSaved.ts`
- **Commit:** 09358d1

## Self-Check: PASSED

- src/hooks/useSaved.ts: FOUND
- src/components/feed/SavedCard.tsx: FOUND
- src/pages/SavedPage.tsx: FOUND
- commit 09358d1 (Task 1): FOUND
- commit 4b45d64 (Task 2): FOUND
