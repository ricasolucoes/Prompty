---
phase: 03-l3-criador
plan: "06"
subsystem: navigation-integration
tags: [tabbar, routing, ranking, variation-fork, levl-07, creat-04, tdd]
dependency_graph:
  requires: ["03-05"]
  provides: ["TabBar /criar route", "RankingPage standalone", "Criar variação button"]
  affects: ["src/components/layout/TabBar.tsx", "src/pages/RankingPage.tsx", "src/pages/PromptyDetailPage.tsx", "src/App.tsx"]
tech_stack:
  added: []
  patterns: ["levelOf() L3 gate", "conditional NavLink aria-label", "gradient pill NavLink", "TDD red-green per task"]
key_files:
  created:
    - src/pages/RankingPage.tsx
  modified:
    - src/components/layout/TabBar.tsx
    - src/components/layout/TabBar.test.tsx
    - src/pages/PromptyDetailPage.tsx
    - src/pages/PromptyDetailPage.test.tsx
    - src/App.tsx
decisions:
  - "TabBar Criar entry uses isCriar=t.to==='/criar' conditional inside visible.map — keeps NavLink role=link (5-link assertion safe) while applying distinct sparkle styling and aria-label"
  - "Ranking tab icon changed from flame → starFill per UI-SPEC; was incorrect in prior plan scaffold"
  - "isL3OrAbove gate uses lvl.id === 'L3' || 'L4' || 'L5' — same explicit-id pattern as existing MyPromptysGrid"
  - "handleVariation() uses nav() from useNavigate, not a Link — consistent with L3-only show/hide; anonymous users get L1 default (0 pts) so button is safely absent"
metrics:
  duration: "30min"
  completed_date: "2026-05-13"
  tasks: 3
  files: 5
---

# Phase 3 Plan 06: Final Navigation Wiring Summary

**One-liner:** TabBar sparkle routes to /criar (route fix + gradient pill styling), RankingPage promoted from App.tsx inline stub to standalone file, PromptyDetailPage gains L3-gated "Criar variação" button navigating to /criar?from=<id>.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update TabBar — fix /criar route + sparkle styling + starFill icon | 481f8f1 | TabBar.tsx, TabBar.test.tsx |
| 2 | Promote inline RankingPage stub to proper file | 58dd4ef | RankingPage.tsx (new), App.tsx |
| 3 | Add 'Criar variação' button to PromptyDetailPage (L3-gated) | 7fc1b41 | PromptyDetailPage.tsx, PromptyDetailPage.test.tsx |

---

## Task 1 — TabBar Mutation Summary (3 changes)

**Change 1 — Route fix:** `to: '/create'` → `to: '/criar'`. The Criar tab was routing to a non-existent route. Route now matches the App.tsx `/criar` route from plan 03-05.

**Change 2 — Ranking icon:** `icon: 'flame'` → `icon: 'starFill'` per UI-SPEC. The flame icon was used as a scaffold default; starFill is the correct icon for the Ranking tab.

**Change 3 — Sparkle styling + aria-label:** The Criar NavLink now uses a conditional `isCriar = t.to === '/criar'` inside `visible.map()`. When true:
- `aria-label="Criar Prompty"` (was `t.label` = "Criar")
- 48×48px gradient pill: `linear-gradient(135deg, #8B4DF5, #22D3EE)`
- `marginTop: -8`, `marginBottom: -8` (lifts 8px above bar)
- `borderRadius: 999`, `boxShadow`, `fontSize: 0` (hides span text visually; aria-label handles a11y)
- Icon: `sparkle` 24px, `#fff`, `strokeWidth={2.2}`

Test changes: updated `getByLabelText('Criar')` → `getByLabelText('Criar Prompty')` in all assertions; added new test for href='/criar' route correctness; added LEVL-07 L2 absence test.

---

## Task 2 — RankingPage File

`src/pages/RankingPage.tsx` created with exact UI-SPEC placeholder:
- 60×60 `borderRadius: 14` container, `background: 'var(--surface-2)'`
- `<Icon name="sparkle" size={26} color="var(--primary)" strokeWidth={2} />`
- `<h1>` "Ranking" — 19px / 700 / Space Grotesk
- `<p>` "Os criadores que mais contribuíram aparecem aqui. Em breve!" — 14px / `var(--text-2)` / maxWidth 280

App.tsx: removed inline `function RankingPage()` stub (was added in 03-05 as placeholder); replaced with `import { RankingPage } from '@/pages/RankingPage'`. Route `<Route path="/ranking" element={<RankingPage />} />` unchanged.

---

## Task 3 — PromptyDetailPage Variation Button

**Placement:** In the action buttons `<div>` (below Save button), gated by `isL3OrAbove`.

**Gate logic:**
```tsx
const lvl = levelOf(profile?.points ?? 0)
const isL3OrAbove = lvl.id === 'L3' || lvl.id === 'L4' || lvl.id === 'L5'
```
Anonymous users: `profile?.points ?? 0` → 0 pts → L1 → button hidden. LEVL-07 satisfied.

**Navigation:**
```tsx
function handleVariation() {
  if (!prompty) return
  nav(`/criar?from=${prompty.id}`)
}
```

**Button style:** matches existing Save button pattern — plain `<button>` with Tailwind layout classes + inline `style` object using `var(--surface-2)` / `var(--line)` / `var(--text-1)`. Icon: `wand` 18px `var(--primary)`. Text: "Criar variação".

---

## Test Coverage Summary

| File | Tests Before | Tests After | New Tests |
|------|-------------|-------------|-----------|
| TabBar.test.tsx | 6 | 7 | LEVL-07 L2 absence; updated aria-label + route assertions |
| PromptyDetailPage.test.tsx | 13 | 17 | CREAT-04/LEVL-07: L1 absent, L2 absent, L3 present, click navigates |

Full suite: 31 test files, 185 tests passing (3 todo anchor tests in RateSheet).

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

- `src/components/layout/TabBar.tsx` exists and contains `to: '/criar'`, `Criar Prompty`, `linear-gradient(135deg, #8B4DF5, #22D3EE)`, `width: 48`, `height: 48`, `marginTop: -8`, `icon: 'starFill'`
- `src/pages/RankingPage.tsx` exists and contains `export function RankingPage`, `Em breve!`, `width: 60`, `height: 60`, `var(--surface-2)`
- `src/App.tsx` contains `import { RankingPage } from '@/pages/RankingPage'` and does NOT contain `function RankingPage()`
- `src/pages/PromptyDetailPage.tsx` contains `isL3OrAbove`, `Criar variação`, `levelOf(profile?.points ?? 0)`
- Commits 481f8f1, 58dd4ef, 7fc1b41 verified present
