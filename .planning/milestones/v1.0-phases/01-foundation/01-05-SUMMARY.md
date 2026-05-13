---
phase: 01-foundation
plan: 05
subsystem: ui-shell
tags: [ui-primitives, layout, auth-pages, routing, theme, tdd, levl-07]
dependency_graph:
  requires: [01-01, 01-04]
  provides:
    - src/components/ui/Icon (IconName type + inline SVG)
    - src/components/ui/Avatar
    - src/components/ui/PrimaryButton
    - src/components/ui/SecondaryButton
    - src/components/ui/ProgressBar
    - src/components/ui/Toast
    - src/components/layout/AppHeader
    - src/components/layout/TabBar (LEVL-07 progressive disclosure)
    - src/stores/theme.store (useThemeStore)
    - src/pages/LoginPage, SignupPage, ResetPasswordPage, OnboardingPage
    - src/App.tsx (full route tree)
  affects:
    - plans 01-06, 01-07, 01-08 (reuse primitives + chrome shell)
tech_stack:
  added: []
  patterns:
    - TDD (RED→GREEN) for TabBar to lock LEVL-07 compliance
    - Zustand persist middleware for theme toggle
    - NavLink from react-router-dom for active-state tab styling
    - Progressive disclosure via LEVEL_ORDER array comparison (no greyed/locked tabs)
key_files:
  created:
    - src/components/ui/Icon.tsx
    - src/components/ui/Avatar.tsx
    - src/components/ui/PrimaryButton.tsx
    - src/components/ui/SecondaryButton.tsx
    - src/components/ui/ProgressBar.tsx
    - src/components/ui/Toast.tsx
    - src/components/layout/AppHeader.tsx
    - src/components/layout/TabBar.tsx
    - src/components/layout/TabBar.test.tsx
    - src/pages/OnboardingPage.tsx
    - src/pages/LoginPage.tsx
    - src/pages/SignupPage.tsx
    - src/pages/ResetPasswordPage.tsx
    - src/stores/theme.store.ts
  modified:
    - src/App.tsx
decisions:
  - "Icon PATHS uses React.ReactElement (not JSX.Element) to avoid JSX namespace error in strict TS"
  - "Avatar palette uses string[] with ?? fallback to satisfy noUncheckedIndexedAccess"
  - "AppHeader level fallback uses (LEVELS[0] ?? levelOf(0)) to satisfy strict null checks on readonly array"
  - "theme.store default is 'light' — matches index.css which applies theme-light class on html by default"
  - "App.tsx redirects / to /onboarding inline via hasOnboarded() — no extra route guard needed"
metrics:
  duration: "~125min"
  completed_date: "2026-05-07"
  tasks: 3
  files: 15
---

# Phase 01 Plan 05: Layout Shell + Auth Pages + UI Primitives Summary

**One-liner:** Full UI chrome (6 primitives, AppHeader, TabBar, 4 auth/onboarding pages) with LEVL-07-tested progressive disclosure and persisted theme toggle.

---

## What Was Built

### Task 1 — UI Primitives + Theme Store

Six primitive components and one Zustand store:

- **Icon.tsx** — inline SVG with 18 named icons (24px viewBox, stroke-only, monoline). Icon paths are hardcoded from plan spec. `PATHS` typed as `Record<IconName, React.ReactElement>` (not `JSX.Element`) to avoid TypeScript namespace error with Vite's JSX transform.
- **Avatar.tsx** — shows `<img>` when `avatar_url` is provided, falls back to initials block using deterministic color hash from name. `colorFromName` uses `string[]` type with `?? '#7C3AED'` fallback to satisfy strict array access checks.
- **PrimaryButton.tsx** — gradient violet button (180deg `#8B4DF5 → #7C3AED`), supports `full`, `icon`, `disabled`, `color` override, `type`. Disabled state uses `--line` background and `--text-3` color.
- **SecondaryButton.tsx** — `--surface-2` background with `--line` border, 13.5px font.
- **ProgressBar.tsx** — accessible `role="progressbar"` with `aria-valuemin/max/now`, gradient fill `#7C3AED → #22D3EE`, `transition: width .4s ease`.
- **Toast.tsx** — fixed positioned, auto-dismiss via `setTimeout`, optional inline points badge.
- **theme.store.ts** — Zustand `persist` middleware with `name: 'promptys-theme'`. `setTheme` removes `theme-light`/`theme-dark` then adds the new class on `document.documentElement`. `onRehydrateStorage` reapplies class on page load from stored value. Default is `'light'`.

### Task 2 — AppHeader, TabBar (TDD), OnboardingPage

TDD flow for TabBar:

- **RED commit:** `TabBar.test.tsx` written with 5 tests before `TabBar.tsx` existed. Tests confirmed failing (import error = RED state).
- **GREEN commit:** `TabBar.tsx` implemented — tests pass (44/44).

**TabBar progressive disclosure approach:** `LEVEL_ORDER = ['L1','L2','L3','L4','L5']`. Each tab has `minLevel`. `levelGteMin` compares index positions — no locked/disabled/greyed tabs for levels not yet reached; those tabs simply don't exist in the DOM (LEVL-07).

**Level calculation:** `levelOf(profile.points ?? 0)` — if profile is null (unauthenticated), defaults to `'L1'`. This means unauthenticated visitors get the same 2-tab experience as L1 users (Feed + Perfil only).

**AppHeader:** renders `lvl.name` (e.g. `EXPLORADOR` for L1) in a badge. L1 badge uses `rgba(34,211,238,0.12)` background and `#22D3EE` color (Prompt Cyan) — different from higher levels which use `--primary-soft` / `--primary`.

**OnboardingPage:** `hasOnboarded()` and `markOnboarded()` use `localStorage` with key `'promptys-onboarded'`. Wrapped in try/catch for environments where localStorage is unavailable. CTA calls `markOnboarded()` then navigates to `/` via `replace: true`.

### Task 3 — Auth Pages + App.tsx Route Tree

**LoginPage / SignupPage / ResetPasswordPage:** all use `useAuth()` hook from plan 01-04. Error messages displayed via `role="alert"` (accessibility). Success redirects: login → `/`, signup → `/login` after 1800ms delay with info message, reset → shows done state inline (no redirect).

**App.tsx rewrite:** Routes defined in this order:
1. `/onboarding` — `<OnboardingPage />`
2. `/login`, `/signup`, `/reset-password` — auth pages (no chrome)
3. `*` — `<ChromeShell />` (all other paths get header + tab bar)

`ChromeShell` renders `<AppHeader>` + `<Routes>` for `/` and `/profile` + `<TabBar>`. Feed and Profile placeholders have visible text noting which plan adds real content.

First-time visitor redirect: implemented inline in `App()` — `if (location.pathname === '/' && !hasOnboarded()) return <Navigate to="/onboarding" replace />`. This runs before the `<Routes>` render so unauthenticated first-timers always see onboarding.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSX.Element namespace unavailable in strict TS**
- **Found during:** Task 1
- **Issue:** `const PATHS: Record<IconName, JSX.Element>` fails — `JSX` namespace not available in `tsconfig` strict mode with Vite JSX transform
- **Fix:** Changed to `React.ReactElement` and added `import React from 'react'`
- **Files modified:** `src/components/ui/Icon.tsx`
- **Commit:** 12ab18d

**2. [Rule 1 - Bug] Avatar palette array access — string | undefined**
- **Found during:** Task 1
- **Issue:** `palette[0]` and `palette[h]` typed as `string | undefined` under strict array indexing
- **Fix:** Added `string[]` type annotation and `?? '#7C3AED'` fallback
- **Files modified:** `src/components/ui/Avatar.tsx`
- **Commit:** 12ab18d

**3. [Rule 1 - Bug] AppHeader LEVELS[0] possibly undefined**
- **Found during:** Task 2
- **Issue:** `LEVELS[0]` on a `readonly` array typed as `Level | undefined`
- **Fix:** Changed to `(LEVELS[0] ?? levelOf(0))` — double safety
- **Files modified:** `src/components/layout/AppHeader.tsx`
- **Commit:** 7bb55d7

---

## Self-Check

**Files created (spot check):**
- src/components/ui/Icon.tsx — FOUND
- src/components/layout/TabBar.tsx — FOUND
- src/components/layout/TabBar.test.tsx — FOUND
- src/pages/LoginPage.tsx — FOUND
- src/stores/theme.store.ts — FOUND

**Commits:**
- 12ab18d — feat(01-05): build UI primitives and theme store
- c8bf3f4 — test(01-05): add failing TabBar tests for LEVL-07 progressive disclosure
- 7bb55d7 — feat(01-05): build AppHeader, TabBar (LEVL-07), and OnboardingPage
- 03f9664 — feat(01-05): build auth pages and wire full route tree in App.tsx

**Final suite:** 44 tests, 7 test files — all pass.
**type-check:** exit 0.
**pnpm build:** exit 0 (chunk warning is pre-existing, out of scope).

## Self-Check: PASSED
