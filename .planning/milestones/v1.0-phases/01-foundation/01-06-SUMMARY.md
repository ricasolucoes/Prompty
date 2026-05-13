---
phase: 01-foundation
plan: "06"
subsystem: feed
tags: [feed, react-query, cursor-pagination, rtl-tests, levl-06, auth-05]
dependency_graph:
  requires: [01-03, 01-04, 01-05]
  provides: [useFeed, FeedCard, FeedPage]
  affects: [01-07, 01-08]
tech_stack:
  added: ["@tanstack/react-query useInfiniteQuery", "cursor pagination"]
  patterns: ["infinite-query with cursor tuple", "TDD red-green", "LEVL-06 enforcement via RTL"]
key_files:
  created:
    - src/hooks/useFeed.ts
    - src/components/feed/SkeletonCard.tsx
    - src/components/feed/WelcomeStrip.tsx
    - src/components/feed/EndOfFeedNudge.tsx
    - src/components/feed/FeedCard.tsx
    - src/components/feed/FeedCard.test.tsx
    - src/pages/FeedPage.tsx
    - src/pages/FeedPage.test.tsx
  modified:
    - src/App.tsx
decisions:
  - "Cursor pagination uses .or(`created_at.lt.${cursor},and(created_at.eq.${cursor},id.lt.${id})`) — no OFFSET anywhere"
  - "FeedCard action row limited to 2 buttons (Curtir + Copiar) — LEVL-06 enforced by 9 RTL tests"
  - "SkeletonCard uses inline shimmer animation (no keyframe CSS file) to avoid global CSS side-effects in tests"
  - "FeedPage uses window scroll listener for infinite scroll (no IntersectionObserver dependency)"
metrics:
  duration: "20 min"
  completed: "2026-05-07"
  tasks: 3
  files: 9
---

# Phase 01 Plan 06: L1 Feed Summary

**One-liner:** Cursor-paginated feed with FeedCard (resolveBeginner + LEVL-06), WelcomeStrip for unauthenticated visitors, and 13 RTL tests enforcing AUTH-05 and LEVL-06 contracts.

## What Was Built

### Task 1 — useFeed hook + skeleton/welcome/nudge components

`useFeed` uses `@tanstack/react-query` `useInfiniteQuery` with a cursor-based strategy: the "next page" cursor is the `{ created_at, id }` tuple of the last item in each page. The Supabase query uses `.or("created_at.lt.${cursor},and(created_at.eq.${cursor},id.lt.${id})")` — a compound filter that handles rows at identical timestamps via secondary sort on `id`. No `OFFSET` or `.range()` anywhere (FEED-05).

Supporting components:
- `SkeletonCard` — 5 shimmer bars of varying widths with inline `animation: shimmer 1.4s linear infinite` to simulate content loading shape
- `WelcomeStrip` — gradient section with `aria-label="Como funciona"` explaining the Promptys concept for unauthenticated visitors
- `EndOfFeedNudge` — dashed-border section telling users new features unlock with usage

### Task 2 — FeedCard with LEVL-06 enforcement

`FeedCard` renders the canonical L1 card structure top-to-bottom:
1. Author header: Avatar + name + "compartilhou um Prompty · {relativeTime}"
2. `<h2>` title
3. "PROMPT" label + 3-line WebkitLineClamp + "Ver mais" expand button
4. Cover image (gradient fallback if no URL)
5. Reaction count row (heart icon + "Curtidas")
6. Action row: Curtir button + Copiar prompt button (LEVL-06: only these two)
7. PostCopyBanner (shown when `copied=true && rated=false`)
8. PostRateConfirmation (shown when `rated=true`)

`resolveBeginner` from `src/lib/prompty/template.ts` substitutes `{{key}}` placeholders with seed values before render — the L1 user never sees raw template syntax.

9 RTL tests cover: variable substitution, action row buttons, LEVL-06 forbidden elements (save/remix/share/model chips/difficulty/version/star ratings), Ver mais expansion, copy state, rating state.

### Task 3 — FeedPage + routing

`FeedPage` assembles all feed components: WelcomeStrip (unauthenticated only), 2× SkeletonCard during load, FeedCard list, EndOfFeedNudge at end. Infinite scroll triggered via `window.scroll` listener when within 600px of bottom.

`App.tsx` updated: `FeedPlaceholder` removed, `FeedPage` imported and mounted at `<Route path="/">`. 4 RTL tests validate AUTH-05 and FEED-02 contracts.

## Cursor Pagination Approach

```
.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
```

This correctly handles:
- Rows older than the cursor: `created_at.lt`
- Rows at same timestamp with smaller id: `and(created_at.eq, id.lt)` 
- Natural ordering: `ORDER BY created_at DESC, id DESC` already applied

## Tests Added

| File | Tests | Focus |
|------|-------|-------|
| `FeedCard.test.tsx` | 9 | LEVL-06 forbidden elements, resolveBeginner, Ver mais, copy/rate states |
| `FeedPage.test.tsx` | 4 | AUTH-05 WelcomeStrip auth gate, skeleton loading, empty state |
| **Total** | **13** | |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Null guard on last item in getNextPageParam**
- **Found during:** Task 1 type-check
- **Issue:** `lastPage[lastPage.length - 1]` is `FeedItem | undefined` — TypeScript strictness (exactOptionalPropertyTypes) caught `'last' is possibly 'undefined'`
- **Fix:** Added `if (!last) return undefined` guard
- **Files modified:** `src/hooks/useFeed.ts`
- **Commit:** f5d3ca4

**2. [Rule 1 - Bug] exactOptionalPropertyTypes on optional onRate spread**
- **Found during:** Task 2 type-check
- **Issue:** Passing `onRate?: () => void` directly as `<PostCopyBanner onRate={onRate} />` failed TS2375 with `exactOptionalPropertyTypes: true` — `undefined` not assignable to `() => void`
- **Fix:** Conditional spread: `<PostCopyBanner {...(onRate ? { onRate } : {})} />`
- **Files modified:** `src/components/feed/FeedCard.tsx`
- **Commit:** 1cc922d

## Self-Check: PASSED

All 8 created files exist on disk. All 3 task commits verified in git log.
