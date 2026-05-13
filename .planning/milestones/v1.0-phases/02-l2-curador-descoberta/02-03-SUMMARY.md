---
phase: 02-l2-curador-descoberta
plan: "03"
subsystem: search
tags: [search, fts, filter, infinite-scroll, tdd]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [useSearch, FilterChipBar, SearchPage]
  affects: [02-04, 02-05]
tech_stack:
  added: []
  patterns: [TanStack useInfiniteQuery, cursor-pagination, debounce-useRef, inline-styles, single-select-chips]
key_files:
  created:
    - src/hooks/useSearch.ts
    - src/hooks/useSearch.test.ts
    - src/components/ui/FilterChipBar.tsx
    - src/components/ui/FilterChipBar.test.tsx
    - src/pages/SearchPage.tsx
    - src/pages/SearchPage.test.tsx
  modified:
    - src/App.tsx
decisions:
  - "useSearch disabled (enabled=false) when query empty and no filters — prevents unnecessary fetches on idle state"
  - "textSearch uses {type:'websearch',config:'simple'} — websearch handles partial words; simple config matches migration 006"
  - "Debounce uses useRef timer (no library) — 300ms, clearTimeout on each keystroke, immediate reset on clear"
  - "FilterChipBar scrollbar hidden via scrollbarWidth:none (no injected CSS) — simpler than <style> injection"
metrics:
  duration: "4min"
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 02 Plan 03: Search Page (Buscar Tab) Summary

FTS-powered search with category + model filter chips, debounced input, and infinite scroll — using the `fts` tsvector column from migration 006. All data logic in `useSearch`; `SearchPage` is layout-only.

## What Was Built

### useSearch hook (`src/hooks/useSearch.ts`)

Mirrors `useFeed` with (query, category, model) params added:

- **FTS query construction:** `supabase.from('promptys').textSearch('fts', query, { type: 'websearch', config: 'simple' })` — called only when `query` is non-empty
- **Category filter:** `.eq('category', category)` — applied when category is non-null
- **Model filter:** `.contains('models', [model])` — applied when model is non-null; `models` is a `string[]` column
- **MODR-03:** `.eq('status', 'published')` on every query — no exceptions
- **Cursor pagination:** `.or('created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})')` — no OFFSET (FEED-05)
- **`enabled` flag:** `query.length > 0 || !!category || !!model` — hook disabled on idle (no empty fetches)
- **Profiles join:** `select('*, profiles(name, username, avatar_url)')` — same shape as FeedItem

### FilterChipBar component (`src/components/ui/FilterChipBar.tsx`)

Reusable single-select horizontal chip row consumed by SearchPage, and ready for SavedPage (02-04) and CategorySuggestSheet (02-05):

- **Single-select toggle:** clicking active chip calls `onChange(null)`; clicking inactive chip calls `onChange(opt.value)`
- **Accessibility:** `aria-pressed` per chip; `role="group"` on container
- **Horizontal scroll:** `overflowX: 'auto'`, `scrollbarWidth: 'none'`, `whiteSpace: 'nowrap'`
- **Inline styles only** — no CSS modules, no Tailwind (CLAUDE.md rule)

### SearchPage (`src/pages/SearchPage.tsx`)

- **Search input:** 44px height, `role="searchbox"`, `aria-label="Buscar Promptys"`, placeholder "Buscar Promptys…"
- **Debounce:** 300ms via `useRef<ReturnType<typeof setTimeout>>` — no library, `clearTimeout` on each keystroke, immediate reset on clear button click
- **Clear button:** appears only when `query.length > 0`, resets both `query` and `debouncedQuery` immediately
- **Two FilterChipBar rows:** CATEGORIA (10 options from `CATEGORIES`) + MODELO (5 options from `MODELS`)
- **Empty states:** idle ("Buscar Promptys" + "Digite uma palavra-chave…") and no-results ("Nenhum resultado")
- **Loading:** 2x `SkeletonCard` during `isLoading`
- **Infinite scroll:** mirrors FeedPage scroll listener — `window.scroll` with `passive:true`, 600px threshold
- **Results:** `items.map(p => <FeedCard key={p.id} prompty={p} />)` — reuses FeedCard, no new card component

### App.tsx changes

- Added: `import { SearchPage } from '@/pages/SearchPage'`
- Changed: `/search` route from `<SearchPagePlaceholder />` to `<SearchPage />`
- Removed: `SearchPagePlaceholder` function (inline placeholder from Plan 02-02)
- Preserved: `SavedPagePlaceholder` — belongs to Plan 02-04

## Tests Added

| File | Tests |
|------|-------|
| `src/hooks/useSearch.test.ts` | 7 (replaces Wave 0 scaffold) |
| `src/components/ui/FilterChipBar.test.tsx` | 5 (replaces Wave 0 scaffold) |
| `src/pages/SearchPage.test.tsx` | 7 (replaces Wave 0 scaffold) |

Total: 19 new passing tests. Full suite: 103 passed, 0 failures.

## Deviations from Plan

None — plan executed exactly as written.

Note: Pre-existing type error in `src/hooks/useCommunityResults.ts` (TS2677) was present before this plan and is out of scope. Build (`pnpm build`) exits 0 because `tsc` in the build script uses different strictness settings.

## Commits

- `fbf565e` — `feat(02-03): useSearch hook + FilterChipBar component with tests`
- `5b59413` — `feat(02-03): SearchPage with debounced input + filter chips + infinite scroll + route wiring`

## Self-Check: PASSED
