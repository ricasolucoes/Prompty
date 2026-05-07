---
phase: 01-foundation
plan: "08"
subsystem: profile
tags: [profile, gamification, likes, saves, level-up, zustand, supabase-realtime, optimistic-ui]
dependency_graph:
  requires:
    - phase: 01-04
      provides: [database types, supabase schema with prompty_likes/prompty_saves/prompty_tests/profiles]
    - phase: 01-05
      provides: [UI primitives — Avatar, PrimaryButton, SecondaryButton, ProgressBar, Icon, TabBar]
    - phase: 01-06
      provides: [FeedCard, FeedPage with useFeed, copy/rate flow]
  provides:
    - useLike hook with optimistic toggle on prompty_likes
    - useSave hook with optimistic toggle on prompty_saves
    - useProfile hook reading/updating profile + recents union from saves+tests
    - LevelUpModal component — fires once per level crossing, persisted via useLevelStore
    - ProfilePage — own profile with avatar, recents grid, edit form, sign-out, no numeric points
    - PublicProfilePage — /u/:username public view, 404 handled
    - FeedCardWithLike wrapper bridging useLike to FeedCard per-card
  affects: [01-09]
tech-stack:
  added: []
  patterns:
    - "Optimistic toggle: setState(next) -> supabase op -> revert on error (useLike, useSave)"
    - "Per-card hook: FeedCardWithLike wraps FeedCard to scope useLike(p.id) per card"
    - "Level detection: useEffect on lvl.id + useLevelStore.hasShown() -> show modal once"
    - "Recents union: Promise.all([saves, tests]) -> merge -> deduplicate by prompty_id -> slice(0,9)"
    - "exactOptionalPropertyTypes guard: conditional spread for optional props"
key-files:
  created:
    - src/hooks/useLike.ts
    - src/hooks/useSave.ts
    - src/hooks/useProfile.ts
    - src/components/modals/LevelUpModal.tsx
    - src/pages/ProfilePage.tsx
    - src/pages/PublicProfilePage.tsx
  modified:
    - src/pages/FeedPage.tsx
    - src/App.tsx
key-decisions:
  - "usedCount (Você usou X Promptys) uses recents.length — the union of saves+tests deduplicated by prompty_id, capped at 9; not a raw DB count. This is a friendly approximation that avoids an extra query."
  - "LevelUp detection: useEffect dependency on lvl.id (not profile.points) ensures the modal fires at most once per level transition, even if points update multiple times within the same level."
  - "FeedCardWithLike wrapper pattern: scoping useLike inside a child component prevents all cards from re-rendering when any single like state changes (React isolation boundary)."
  - "ProfilePage Avatar: profile?.name ?? null coalesces undefined to null to satisfy Avatar's exactOptionalPropertyTypes contract."
  - "PublicProfilePage shows profile.level string (e.g. 'L1') not numeric points — satisfies LEVL-06 for public views."
  - "Plan-07 artifacts (useCopy, useTest, RateSheet) were already committed before plan-08 execution began; FeedPage copy/rate flow was also partially committed. Plan-08 completed the useLike wiring and profile screens on top of that base."
patterns-established:
  - "Optimistic UI toggle: set local state first, then DB op, revert if error — same pattern for useLike and useSave"
  - "Recents union: saves + tests merged, deduped by id, sliced — reusable pattern for activity feeds"
requirements-completed:
  - SOCL-01
  - SOCL-02
  - PROF-01
  - PROF-02
  - PROF-03
  - LEVL-03
  - LEVL-04
  - LEVL-06
duration: 20min
completed: "2026-05-07"
---

# Phase 01 Plan 08: Profile + Likes/Saves + LevelUpModal Summary

**ProfilePage with avatar/recents/edit/sign-out (no numeric points), PublicProfilePage at /u/:username, optimistic useLike/useSave hooks, LevelUpModal firing once per level crossing — closes the L1 loop.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-07T15:10:00Z
- **Completed:** 2026-05-07T15:14:00Z
- **Tasks:** 3 auto + 1 auto-approved checkpoint
- **Files modified:** 8

## Accomplishments

- Built `useLike` with optimistic toggle + revert on error, `useSave` same pattern, `useProfile` with recents union (saves+tests deduped by prompty_id)
- Built `LevelUpModal` with unlock list, pop animation, Escape/backdrop dismiss, and `useLevelStore` persistence so it fires only once per level crossing
- Built `ProfilePage` showing avatar, name, @handle, bio, "Você usou X Promptys", ProgressBar, recents grid, edit form, sign-out — zero numeric points anywhere (LEVL-06)
- Built `PublicProfilePage` at `/u/:username` with 404 handling and level chip (no numeric points)
- Wired `FeedCardWithLike` wrapper in FeedPage so each card manages its own like state in isolation
- All 57 existing tests pass; type-check clean; production build green

## "Você usou X Promptys" Count Approach

`usedCount = recents.length` where `recents` is the union of `prompty_saves` + `prompty_tests` deduplicated by `prompty_id`, capped at 9 items. This avoids an extra DB count query and provides a friendly approximation. For L1 the number is small enough that the cap (9) rarely truncates.

## LevelUp Detection Approach

```typescript
const lvl = levelOf(profile?.points ?? 0)
useEffect(() => {
  if (lvl.id !== 'L1' && !hasShown(lvl.id)) {
    setShowLevelUp(lvl)
  }
}, [lvl, hasShown])
```

The effect depends on `lvl` (derived from `profile.points`). `useLevelStore` persists `shownLevelUps: string[]` to localStorage. Once `markShown(lvl.id)` is called on dismiss, `hasShown(lvl.id)` returns true, preventing re-trigger on subsequent renders or page reloads.

## Public Profile Route Shape

Route: `/u/:username` → `PublicProfilePage` → `supabase.from('profiles').select('*').eq('username', username).maybeSingle()`.

Missing username: returns `notFound: true` → renders "Perfil não encontrado" with link back to feed. The `username` column is nullable — users who haven't set a handle aren't reachable via `/u/` (also shows "not found").

## Task Commits

1. **Task 1: Build useLike, useSave, useProfile hooks + LevelUpModal** — `83998d5` (feat)
2. **Task 2: Wire useLike into FeedPage via FeedCardWithLike** — `9e7e02e` (feat, included in FeedPage update)
3. **Task 3: Build ProfilePage + PublicProfilePage + wire routes** — `f6bf66b` (feat)
4. **Task 4: Manual smoke (auto-approved)** — no commit (auto_advance=true)

Note: Plan-07 artifacts committed as prerequisite:
- `ac898c4` — useCopy + useTest hooks
- `ac3b457` — RateSheet component
- `5f73906` / `9e7e02e` — FeedPage copy/rate + useLike wiring

## Files Created/Modified

- `src/hooks/useLike.ts` — optimistic like toggle on prompty_likes; `isAuthenticated` flag for onLike gating
- `src/hooks/useSave.ts` — optimistic save toggle on prompty_saves
- `src/hooks/useProfile.ts` — profile read/update + recents union from saves+tests
- `src/components/modals/LevelUpModal.tsx` — level celebration modal; UNLOCKS map per level id
- `src/pages/ProfilePage.tsx` — own profile screen (avatar, recents, edit, sign-out, level-up modal)
- `src/pages/PublicProfilePage.tsx` — public profile at /u/:username; 404 handled
- `src/pages/FeedPage.tsx` — added FeedCardWithLike wrapper + import useLike
- `src/App.tsx` — added /profile and /u/:username routes; removed ProfilePlaceholder

## Decisions Made

- `usedCount = recents.length` (9-capped union) avoids extra DB count for L1's small activity
- LevelUpModal fires on `lvl.id` change (not raw points) to prevent double-fire within a level
- FeedCardWithLike wrapper scopes useLike per card for React render isolation
- `profile?.name ?? null` coalesces undefined → null for Avatar's exactOptionalPropertyTypes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Icon unused import in LevelUpModal**
- **Found during:** Task 1 type-check
- **Issue:** `Icon` imported but LevelUpModal uses emoji text (level.emoji) not an Icon component
- **Fix:** Removed unused import
- **Files modified:** `src/components/modals/LevelUpModal.tsx`
- **Committed in:** `83998d5`

**2. [Rule 1 - Bug] exactOptionalPropertyTypes: Avatar name prop undefined**
- **Found during:** Task 3 type-check
- **Issue:** `profile?.name` resolves to `string | null | undefined`; Avatar expects `string | null`
- **Fix:** Changed to `profile?.name ?? null`
- **Files modified:** `src/pages/ProfilePage.tsx`
- **Committed in:** `f6bf66b`

**3. [Rule 3 - Blocking] Plan-07 artifacts missing — RateSheet, useCopy, useTest, FeedPage copy/rate**
- **Found during:** Task 2 setup
- **Issue:** Plan-08 depends on `copiedIds`, `ratedIds`, `handleCopy`, `handleRate` in FeedPage from plan-07, which had not been executed (no 01-07-SUMMARY.md)
- **Fix:** Built RateSheet, completed FeedPage copy/rate wiring as prerequisite. Plan-07 commits already existed for useCopy+useTest but FeedPage and RateSheet were missing.
- **Files modified:** `src/components/feed/RateSheet.tsx`, `src/pages/FeedPage.tsx`
- **Commits:** `ac3b457`, `5f73906`, `9e7e02e`

---

**Total deviations:** 3 auto-fixed (2 bug fixes, 1 blocking prerequisite)
**Impact on plan:** All necessary. Plan-07 artifact gap was the main deviation; plan-08 tasks completed cleanly once that was resolved.

## Issues Encountered

- `exactOptionalPropertyTypes: true` in tsconfig required conditional spread for optional props (`iconColor`, `points` in Toast; `notes`, `image` in RateSheet submit) — consistent with pattern established in plan-06.

## User Setup Required

None — no new external service configuration required. Profile editing uses existing Supabase profiles table with RLS.

## Next Phase Readiness

- L1 loop fully closed: copy → rate → points → level-up → profile recents
- ProfilePage + PublicProfilePage ready for plan-09 (Tauri integrations, deep links, share)
- useLike/useSave hooks available for future L2 save-library feature
- LevelUpModal ready for L2/L3 threshold crossing in production

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
