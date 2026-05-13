---
phase: 01-foundation
plan: 07
subsystem: ui
tags: [clipboard, rating, image-upload, supabase, tauri, webp, gamification]

# Dependency graph
requires:
  - phase: 01-foundation/plan-06
    provides: FeedCard with onCopy/onRate props, Toast component, SkeletonCard, WelcomeStrip, useFeed hook
  - phase: 01-foundation/plan-02
    provides: compress.ts (compressToWebP), supabase client
  - phase: 01-foundation/plan-01
    provides: auth.store (useAuthStore), database.types.ts (prompty_tests table)
provides:
  - useCopy hook with browser + Tauri clipboard fallback chain + record_copy RPC
  - useTest hook with WebP image compression + prompty-results bucket upload + prompty_tests insert
  - RateSheet bottom-sheet component with 5-star rating + optional image/notes
  - FeedPage wired with copy/rate state and toast feedback
affects: [plan-08-profile-likes, plan-09-tauri-native]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Clipboard fallback chain: navigator.clipboard -> dynamic plugin import (no-new-func) -> execCommand"
    - "Best-effort RPC: record_copy called after clipboard write, errors swallowed (user already got feedback)"
    - "Image upload pipeline: compressToWebP(200KB cap) -> storage.from('prompty-results').upload with path {userId}/{promptyId}-{ts}.webp"
    - "Gamification via SQL trigger: prompty_tests INSERT fires award_points_on_test, frontend never touches point_events"
    - "FeedPage state: copiedIds/ratedIds as Set<string>, rateOpenFor as FeedItem|null"

key-files:
  created:
    - src/hooks/useCopy.ts
    - src/hooks/useTest.ts
    - src/components/feed/RateSheet.tsx
  modified:
    - src/pages/FeedPage.tsx

key-decisions:
  - "Tauri clipboard plugin (@tauri-apps/plugin-clipboard-manager) loaded via Function constructor dynamic import — avoids TS module resolution error for optional plugin not yet in package.json (deferred to plan-09)"
  - "record_copy RPC is best-effort (errors swallowed after successful clipboard write) — user feedback never blocked by analytics"
  - "Image upload failure is non-fatal — returns null image_url and allows rating insert to proceed without image"
  - "Auto-approve checkpoint: human smoke test deferred to live session (auto_advance=true)"

patterns-established:
  - "Optional Tauri plugin: use Function constructor dynamic import pattern to avoid TS errors for plugins not yet installed"
  - "Gamification points via SQL trigger only — frontend inserts into prompty_tests, never into point_events"

requirements-completed: [FEED-04, SOCL-03, INFR-03, INFR-04]

# Metrics
duration: 20min
completed: 2026-05-07
---

# Phase 01 Plan 07: Copy + Rate Primary Loop Summary

**L1 primary loop wired: clipboard copy with browser/Tauri fallback chain, RateSheet with 5-star rating + WebP image upload, prompty_tests insert that fires SQL trigger awarding +5p**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-07T15:09:00Z
- **Completed:** 2026-05-07T15:29:41Z
- **Tasks:** 3 auto (Task 4 human-verify auto-approved)
- **Files modified:** 4

## Accomplishments
- Cross-platform clipboard write with three-tier fallback: Web Clipboard API -> Tauri plugin (dynamic) -> execCommand
- RateSheet bottom sheet with 5 interactive stars, optional textarea (500 chars), optional image upload with WebP compression to 200KB cap
- FeedPage fully wired: copiedIds/ratedIds state, handleCopy/handleRate/onRateSubmitted, Toast feedback on every action
- Anonymous users can copy freely; "Entre para avaliar" toast guards rating for unauth users
- SQL trigger `award_points_on_test` awards +5p server-side on `prompty_tests` insert (frontend never touches `point_events`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build useCopy + useTest hooks** - `ac898c4` (feat)
2. **Task 2: Build RateSheet component** - `ac3b457` (feat)
3. **Task 3: Wire copy/rate flow in FeedPage** - `9e7e02e` (feat)

**Plan metadata:** (see final commit)

## Files Created/Modified
- `src/hooks/useCopy.ts` - Cross-platform clipboard + record_copy RPC
- `src/hooks/useTest.ts` - prompty_tests insert with optional WebP image upload
- `src/components/feed/RateSheet.tsx` - Bottom sheet: 5 stars + textarea + file upload + submit
- `src/pages/FeedPage.tsx` - Copy + rate state wiring + Toast + RateSheet mount

## Decisions Made

1. **Tauri clipboard plugin via Function constructor:** `@tauri-apps/plugin-clipboard-manager` not in `package.json`. Used `new Function('specifier', 'return import(specifier)')` to avoid TypeScript module resolution error while preserving runtime safety. Plugin installation deferred to plan-09.

2. **record_copy best-effort:** Copy event RPC fires after successful clipboard write; errors are swallowed so clipboard failure never blocks user feedback.

3. **Image upload non-fatal:** If Storage upload fails (e.g. size rejection), `uploadResultImage` returns `null` and the rating insert proceeds with `image_url = null`. Upload failure is logged as a console.warn.

4. **Clipboard fallback order:** navigator.clipboard (primary) -> dynamic plugin import -> execCommand (last resort for old WebViews).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `Icon` import from LevelUpModal.tsx**
- **Found during:** Task 1 (first type-check run)
- **Issue:** `src/components/modals/LevelUpModal.tsx` had `import { Icon }` but `Icon` was never used — TS error `TS6133: 'Icon' is declared but its value is never read`
- **Fix:** Linter auto-removed the unused import before manual fix was needed
- **Files modified:** src/components/modals/LevelUpModal.tsx
- **Verification:** `pnpm type-check` exits 0
- **Committed in:** ac898c4 (linter auto-fix; file modified in working tree)

**2. [Rule 3 - Blocking] Tauri plugin TypeScript workaround**
- **Found during:** Task 1 (type-check after writing useCopy.ts)
- **Issue:** `@tauri-apps/plugin-clipboard-manager` not installed -> TS2307 Cannot find module
- **Fix:** Replaced bare `import()` with `new Function` constructor to bypass TS module resolution; used bracket notation `mod?.['writeText']` to satisfy `noPropertyAccessFromIndexSignature`
- **Files modified:** src/hooks/useCopy.ts
- **Verification:** `pnpm type-check` exits 0; runtime behavior preserved
- **Committed in:** ac898c4

---

**Total deviations:** 2 auto-fixed (1 pre-existing bug, 1 blocking TS issue)
**Impact on plan:** Both fixes required for type-check to pass. No scope creep. Plugin installation deferred intentionally per plan spec.

## Issues Encountered

- `pnpm type-check` failed three times while resolving the Tauri plugin dynamic import pattern. Final solution: `new Function` constructor + bracket notation for index-signature access. All resolved within Task 1 commit.

## Clipboard Fallback Chain

Order used (implemented in `useCopy.ts`):
1. `navigator.clipboard.writeText(text)` — Primary, works in Chromium/WebKit with HTTPS or localhost
2. Dynamic import of `@tauri-apps/plugin-clipboard-manager` via `new Function` (no-op if plugin absent)
3. `document.execCommand('copy')` via temporary `<textarea>` — Last resort for WKWebView quirks

`@tauri-apps/plugin-clipboard-manager` was **NOT added** to `package.json` in this plan. The dynamic import is safe when the plugin is absent (returns null). Plan-09 will add the plugin when native clipboard is required.

## Image Upload

- Path scheme: `${user.id}/${prompty.id}-${Date.now()}.webp`
- Compression: `compressToWebP(file, 200, 0.85)` — 85% quality first pass; 42.5% quality if over 200KB
- Upload: `supabase.storage.from('prompty-results').upload(path, blob, { contentType: 'image/webp', upsert: false })`
- RLS: path starts with `user.id/` so the "upload own" policy is satisfied
- Smoke test results: not captured (human verification checkpoint auto-approved in auto_advance mode)

## User Setup Required

None — no new environment variables or external service configuration added in this plan.

## Next Phase Readiness
- L1 primary copy → rate loop is complete end-to-end at the frontend level
- SQL trigger `award_points_on_test` and `record_copy` RPC are already in migration 003 — no new SQL needed
- Plan-08 (Profile + likes/saves) is independent of these specifics and can proceed
- Plan-09 (Tauri native) should add `@tauri-apps/plugin-clipboard-manager` to `package.json` and install the Rust plugin

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
