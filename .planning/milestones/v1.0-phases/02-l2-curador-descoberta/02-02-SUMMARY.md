---
phase: 02-l2-curador-descoberta
plan: "02"
subsystem: navigation-chrome
tags: [tabbar, routing, icons, constants, l2-navigation]
dependency_graph:
  requires: [02-01]
  provides: [/saved route, /search route, CATEGORIES constant, MODELS constant, moreHorizontal icon, flag icon, tag icon, Salvos tab]
  affects: [02-03, 02-04, 02-05, TabBar]
tech_stack:
  added: []
  patterns: [placeholder-page, as-const-tuple, react-router-route]
key_files:
  created:
    - src/lib/constants/categories.ts
  modified:
    - src/components/layout/TabBar.tsx
    - src/components/layout/TabBar.test.tsx
    - src/components/ui/Icon.tsx
    - src/App.tsx
decisions:
  - TABS array now has 6 entries; L2 sees 4 (Feed/Salvos/Buscar/Perfil), L3 sees 6 (adds Criar/Ranking)
  - Placeholder pages inline in App.tsx (no new files) — deleted by owning plans 02-03 and 02-04
  - CATEGORIES/MODELS exported as const (not enum) for type inference in FilterChipBar
  - moreHorizontal uses filled circles (fill=currentColor, stroke=none) per UI-SPEC engineering note — strokeWidth on 1.2px circles is invisible
metrics:
  duration: 2min
  completed_date: "2026-05-12"
  tasks_completed: 3
  files_modified: 5
---

# Phase 02 Plan 02: Navigation Chrome + Route Scaffolding Summary

Wire L2 navigation chrome: Salvos tab in TabBar, /saved and /search routes, three new icons, and static categories/models constants for FilterChipBar.

## What Was Built

### TABS array final order (6 entries)

| Index | to | icon | label | minLevel |
|-------|----|------|-------|----------|
| 0 | / | home | Feed | L1 |
| 1 | /saved | bookmark | Salvos | L2 |
| 2 | /search | search | Buscar | L2 |
| 3 | /create | sparkle | Criar | L3 |
| 4 | /ranking | flame | Ranking | L3 |
| 5 | /profile | user | Perfil | L1 |

Visible tab counts: L1 = 2 (Feed + Perfil), L2 = 4 (+ Salvos + Buscar), L3 = 6 (+ Criar + Ranking).

### TabBar test count delta

- Previous: 5 tests (unauthenticated, L1/0pts, L1 locked-absent, L2=3 tabs, L3=5 tabs)
- Added: 1 test (L1 user does NOT see Salvos — LEVL-07)
- Updated: L2 assertion changed from `toHaveLength(3)` to `toHaveLength(4)`; L3 changed from `toHaveLength(5)` to `toHaveLength(6)`
- New total: 6 tests, all passing

### New icons in Icon.tsx

| Name | SVG approach | Notes |
|------|-------------|-------|
| moreHorizontal | Three `<circle>` with `fill="currentColor" stroke="none"` | Filled dots — strokeWidth on 1.2px circles is invisible per UI-SPEC engineering note |
| flag | Single `<path>` stroked | Report/flag affordance for OptionsSheet |
| tag | `<path>` + `<line>` stroked | Category tagging affordance |

IconName union now has 21 members (was 18).

### Placeholder pages in App.tsx

Both placeholders live as inline functions in `src/App.tsx` below the `ChromeShell` function:

- `SavedPagePlaceholder` — `// TODO Plan 02-04: replace with real <SavedPage />`
- `SearchPagePlaceholder` — `// TODO Plan 02-03: replace with real <SearchPage />`

Each renders a centered `<p>` with `color: var(--text-3)` and `fontSize: 13.5` inside a `<main className="screen">`. Style follows the inline styles pattern from CLAUDE.md.

### Categories constants

`src/lib/constants/categories.ts` exports:
- `CATEGORIES` — 10 items: Retrato, Paisagem, Fantasia, Sci-Fi, Abstrato, Arquitetura, Moda, Comida, Animais, Arte digital
- `MODELS` — 5 items: Gemini, Midjourney, DALL·E, Stable Diffusion, Flux
- `Category` and `Model` type aliases derived from the const tuples

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b787f53 | feat(02-02): add Salvos tab to TabBar for L2 users |
| 2 | e1493d8 | feat(02-02): add moreHorizontal, flag, tag icons to Icon.tsx |
| 3 | 835804f | feat(02-02): register /saved + /search routes; add categories/models constants |

## Verification

- `pnpm test:run` — 80 passed, 59 todo (wave-0 scaffolds for future plans), 0 failed
- `pnpm build` — exit 0 (chunk size warning is pre-existing, not introduced by this plan)
- `pnpm type-check` — exit 0

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All files found on disk. All commits verified in git log.
