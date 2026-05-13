---
phase: 01-foundation
plan: 04
subsystem: auth
tags: [zustand, supabase-auth, react-query, react-router, vitest, jsdom]

requires:
  - phase: 01-01
    provides: Supabase schema + database.types.ts skeleton
  - phase: 01-02
    provides: Supabase client singleton at src/lib/supabase.ts

provides:
  - useAuthStore (Zustand): user/profile/loading state + setters + reset
  - useLevelStore (Zustand): persisted level-up tracking in localStorage
  - useAuth hook: signUp/signIn/signOut/resetPassword with pt-BR error messages
  - PrivateRoute: auth guard — null while loading, redirect to /login if unauth
  - main.tsx: QueryClient + BrowserRouter + onAuthStateChange listener wired once
  - database.types.ts: minimal typed placeholder with profiles, promptys, and action tables

affects:
  - 01-05 (layout — uses PrivateRoute, useAuthStore)
  - 01-06 (feed — uses useAuthStore to show/hide social actions)
  - 01-07 (profile — uses useAuthStore for profile state)
  - 01-08 (social — uses useAuthStore for auth guards)
  - 01-09 (level — uses useLevelStore for modal tracking)

tech-stack:
  added: []
  patterns:
    - "Single onAuthStateChange listener at module load in main.tsx"
    - "useAuthStore(s => s.loading) guard in PrivateRoute — returns null while loading"
    - "vi.mock('@/lib/supabase') before dynamic import in test files"
    - "Zustand persist middleware with name promptys-level-store for level-up deduplication"

key-files:
  created:
    - src/stores/auth.store.ts
    - src/stores/auth.store.test.ts
    - src/stores/level.store.ts
    - src/hooks/useAuth.ts
    - src/hooks/useAuth.test.ts
    - src/components/layout/PrivateRoute.tsx
  modified:
    - src/main.tsx
    - src/App.tsx
    - src/types/database.types.ts
    - vite.config.ts

key-decisions:
  - "Auth listener registered in main.tsx IIFE (module load) not in a React effect — avoids double-registration in StrictMode"
  - "database.types.ts expanded from stub to minimal typed shape covering all Phase 1 tables — will be overwritten by pnpm gen:types after migration push"
  - "QueryClient defaults: staleTime=60s, gcTime=5m, refetchOnWindowFocus=false — conservative for mobile/desktop Tauri app"
  - "vitest environment=jsdom added to vite.config.ts test block with setup file reference"
  - "useAuth maps supabase error messages to pt-BR at the hook level, not in UI components"

patterns-established:
  - "PrivateRoute reads two selectors from useAuthStore (user and loading) separately to avoid full re-render"
  - "useAuth returns plain functions (not wrapped in useCallback) — stateless hook pattern"
  - "test files mock @/lib/supabase before dynamic import of the module under test"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

duration: 5min
completed: 2026-05-07
---

# Phase 01 Plan 04: Auth Layer Summary

**Zustand auth/level stores + useAuth hook + PrivateRoute guard + QueryClient bootstrap wired at app root with single onAuthStateChange listener**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-07T11:58:21Z
- **Completed:** 2026-05-07T12:03:30Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Zustand `useAuthStore` is the single source of truth for session + profile state across all downstream components
- `useAuth` hook provides all four auth actions with mapped pt-BR error messages; 6 unit tests verify each code path
- App bootstraps with QueryClient (staleTime 60s) + BrowserRouter + `onAuthStateChange` listener registered exactly once at module load

## Task Commits

1. **Task 1: Create auth.store.ts and level.store.ts with tests** — `a5b9936` (feat)
2. **Task 2: Create useAuth hook + PrivateRoute + tests** — `ef4177c` (feat)
3. **Task 3: Wire QueryClient + auth listener + replace App.tsx scaffolding** — `f2faeec` (feat)

## Files Created/Modified

- `src/stores/auth.store.ts` — useAuthStore: user/profile/loading + setters + reset()
- `src/stores/auth.store.test.ts` — 5 unit tests for initial state and all mutations
- `src/stores/level.store.ts` — useLevelStore persisted to localStorage (name: promptys-level-store)
- `src/hooks/useAuth.ts` — signUp/signIn/signOut/resetPassword; maps Supabase errors to pt-BR
- `src/hooks/useAuth.test.ts` — 6 unit tests via vi.mock on @/lib/supabase
- `src/components/layout/PrivateRoute.tsx` — returns null while loading, Navigate /login if unauth
- `src/main.tsx` — QueryClientProvider + BrowserRouter + auth listener IIFE
- `src/App.tsx` — minimal placeholder <Routes> shell (downstream plans add real routes)
- `src/types/database.types.ts` — expanded to typed interface covering profiles, promptys, action tables
- `vite.config.ts` — added test block with jsdom environment and setup file

## Decisions Made

- Auth listener in main.tsx IIFE (not useEffect): eliminates double-registration risk in React 18+ StrictMode
- `database.types.ts` promoted from `Record<string, unknown>` to typed placeholder — enables compile-time safety for all downstream Supabase queries before `pnpm gen:types` is run
- QueryClient defaults tuned for Tauri app: no refetchOnWindowFocus, 60s staleTime prevents unnecessary API calls on window focus

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vitest jsdom config to vite.config.ts**
- **Found during:** Task 1 (before RED phase)
- **Issue:** No test environment was declared; running vitest would fail with JSDOM errors
- **Fix:** Added `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }` to vite.config.ts
- **Files modified:** vite.config.ts
- **Verification:** Tests ran and passed
- **Committed in:** a5b9936 (Task 1 commit)

**2. [Rule 3 - Blocking] Expanded database.types.ts from stub to typed placeholder**
- **Found during:** Task 1 (writing auth.store.ts)
- **Issue:** `Database['public']['Tables']['profiles']['Row']` fails with `Record<string, unknown>` — auth store could not be type-safe
- **Fix:** Expanded database.types.ts with full Table/Insert/Update shapes for all Phase 1 tables
- **Files modified:** src/types/database.types.ts
- **Verification:** pnpm type-check exits 0
- **Committed in:** a5b9936 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed exactOptionalPropertyTypes error in useAuth.resetPassword**
- **Found during:** Task 2 (type-check after writing useAuth.ts)
- **Issue:** `{ redirectTo: string | undefined }` not assignable to `{ redirectTo?: string }` with exactOptionalPropertyTypes=true
- **Fix:** Changed to conditional object spread: `const options = window ? { redirectTo } : {}`
- **Files modified:** src/hooks/useAuth.ts
- **Verification:** pnpm type-check exits 0; 6 useAuth tests pass
- **Committed in:** ef4177c (Task 2 commit)

**4. [Rule 1 - Bug] Fixed noUncheckedIndexedAccess errors in levels.ts (auto-fixed by linter)**
- **Found during:** Task 3 (type-check after writing main.tsx)
- **Issue:** Pre-existing: LEVELS[0] and LEVELS[idx+1] returned `Level | undefined` under noUncheckedIndexedAccess
- **Fix:** Linter auto-applied type assertions `as Level` at index access sites
- **Files modified:** src/lib/constants/levels.ts
- **Verification:** pnpm type-check exits 0
- **Committed in:** f2faeec (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (2 blocking infrastructure, 2 bugs)
**Impact on plan:** All auto-fixes necessary for type safety and test infrastructure. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Output Notes (per plan spec)

- **QueryClient defaults:** staleTime=60_000ms, gcTime=300_000ms (5min), refetchOnWindowFocus=false
- **Mock pattern for useAuth tests:** `vi.mock('@/lib/supabase', () => ({ supabase: { auth: { ... } } }))` declared before `await import('./useAuth')` — ensures mock applies at module load
- **Loading flicker:** `loading` initializes to `true`; PrivateRoute returns `null` while loading — no redirect fires before session is hydrated. The IIFE in main.tsx calls `setLoading(false)` only after getSession() resolves, so auth state is always ready before first render completes. No observable flicker in testing.

## Next Phase Readiness

- `useAuthStore`, `useAuth`, and `PrivateRoute` are ready for plans 01-05 (layout) and 01-06 (feed)
- `QueryClientProvider` is wired at root — downstream hooks can use `useQuery` / `useInfiniteQuery` immediately
- No blockers

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
