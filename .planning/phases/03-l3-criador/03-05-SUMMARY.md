---
phase: 03-l3-criador
plan: 05
subsystem: ui
tags: [react, wizard, file-upload, variable-detection, template, tdd, routing]

# Dependency graph
requires:
  - phase: 03-02
    provides: useCreatePrompty hook, WizardData type, PublishResult type
  - phase: 03-03
    provides: CreateWizard root state machine, WizardStep1Basics, WizardStep2Prompt

provides:
  - WizardStep3Image: cover upload slot (JPEG/PNG/WebP), local preview, skip via footer CTA
  - VariableChip: inline editor for one detected {{key}} (label/type/default)
  - WizardStep4Advanced: advanced template textarea + auto-detected variable chips + live preview via resolveBeginner
  - CriarPage: route /criar, wires CreateWizard + useCreatePrompty.publish, supports ?from=<id> variation pre-fill
  - CreateWizard updated: renders all 4 steps; publish CTAs on steps 2+3; handlePublish override pattern
  - App.tsx: /criar and /ranking routes registered inside ChromeShell

affects:
  - 03-06 (will replace inline RankingPage stub with proper component)
  - 03-07 (variation button on PromptyDetailPage links to /criar?from=<id>)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - exactOptionalPropertyTypes-safe optional field clearing via type assertion (undefined as unknown as T)
    - handlePublish override pattern: overrides? arg bypasses stale closure when skip button must clear a field before calling publish
    - fireEvent.change instead of userEvent.type for {{variable}} strings (curly brace escaping in userEvent)
    - TDD: RED (test file written, component absent) → GREEN (component created, all tests pass)

key-files:
  created:
    - src/components/create/WizardStep3Image.tsx
    - src/components/create/VariableChip.tsx
    - src/components/create/WizardStep4Advanced.tsx
    - src/components/create/WizardStep4Advanced.test.tsx
    - src/pages/CriarPage.tsx
    - src/pages/CriarPage.test.tsx
  modified:
    - src/components/create/CreateWizard.tsx
    - src/App.tsx

key-decisions:
  - "exactOptionalPropertyTypes prevents { coverFile: undefined } — use `undefined as unknown as File` type assertion to clear optional File field in Partial<WizardData>"
  - "handlePublish(overrides?) bypasses stale closure: skip buttons pass the cleared value directly as override instead of patching state and reading stale data"
  - "WizardStep4Advanced uses fireEvent.change in tests (not userEvent.type) — userEvent treats { as key modifier, breaking {{variable}} input strings"
  - "extractVariables() exported from WizardStep4Advanced for direct unit testing without DOM round-trips"
  - "inline RankingPage stub in App.tsx — Plan 03-06 replaces with proper component"
  - "VARIABLE_REGEX defined locally in WizardStep4Advanced for detection logic; resolveBeginner from template.ts is the single source of truth for rendering"

patterns-established:
  - "Override pattern for skip buttons: patch(overrides) + void handlePublish(overrides) — prevents stale closure when optional field must be absent from publish payload"
  - "exactOptionalPropertyTypes bypass: (undefined as unknown as T) for Partial<T> fields that must be cleared at call sites"
  - "fireEvent.change for inputs containing { or } characters to avoid userEvent special key interpretation"

requirements-completed: [CREAT-01, CREAT-04, CREAT-05]

# Metrics
duration: 98min
completed: 2026-05-13
---

# Phase 3 Plan 05: Create Wizard Complete — Steps 3+4, CriarPage, /criar Route Summary

**Full 4-step create wizard: WizardStep3Image (cover upload), WizardStep4Advanced (variable detection + live preview via resolveBeginner), CriarPage at /criar with ?from=<id> variation fork support, and publish CTAs wired to useCreatePrompty**

## Performance

- **Duration:** 98 min
- **Started:** 2026-05-13T00:16:10Z
- **Completed:** 2026-05-13T01:53:00Z
- **Tasks:** 3
- **Files modified/created:** 8

## Accomplishments

- WizardStep3Image renders cover upload slot (JPEG/PNG/WebP) with local preview via URL.createObjectURL; raw File passed to wizard data for upload-on-publish
- WizardStep4Advanced auto-detects `{{variable}}` keys, renders one VariableChip per unique key (deduped), and shows live preview via `resolveBeginner()` — no logic duplication from template.ts
- VariableChip provides inline label/type/default editing per detected variable
- CriarPage at /criar wires CreateWizard to useCreatePrompty.publish and navigates to /p/${slug} on success; ?from= fetches parent and pre-fills wizard (graceful degrade on error)
- CreateWizard updated: step 2 shows Publicar Prompty + Continuar para modo avançado + Pular imagem; step 3 shows Salvar modo avançado e publicar + Ignorar e publicar; handlePublish accepts overrides to bypass stale closure
- App.tsx: /criar and /ranking routes registered inside ChromeShell
- Full suite: 31 test files, 180 tests, 0 failures; type-check clean

## Task Commits

1. **Task 1: WizardStep3Image** - `3cd7b24` (feat)
2. **Task 2: VariableChip + WizardStep4Advanced** - `08e7ac8` (feat, TDD)
3. **Task 3: CriarPage + CreateWizard CTAs + App.tsx route** - `c30b7c6` (feat, TDD)

**Plan metadata:** (docs commit — added below)

## Files Created/Modified

- `src/components/create/WizardStep3Image.tsx` — Step 3: cover upload slot with preview and clear button
- `src/components/create/VariableChip.tsx` — Inline editor for one detected {{key}} (label, type, default)
- `src/components/create/WizardStep4Advanced.tsx` — Step 4: advanced template textarea + extractVariables + VariableChip list + live preview
- `src/components/create/WizardStep4Advanced.test.tsx` — 6 tests: detection, dedup, multi-chip, preview, counter, empty state
- `src/pages/CriarPage.tsx` — Route /criar; useCreatePrompty.publish; ?from= variation pre-fill; graceful degrade
- `src/pages/CriarPage.test.tsx` — 3 tests: mount, pre-fill, graceful degrade
- `src/components/create/CreateWizard.tsx` — Added steps 2+3 renders, handlePublish overrides, publish CTAs for all steps
- `src/App.tsx` — Added /criar (CriarPage) and /ranking (inline stub) routes inside ChromeShell

## Decisions Made

- `exactOptionalPropertyTypes` strictness requires `undefined as unknown as T` to clear optional File/string fields — type-safe erasure pattern used in handleClear and skip buttons
- `handlePublish(overrides?)` override parameter prevents stale closure bug: skip buttons pass cleared values directly rather than relying on React state re-render between patch() and handlePublish()
- `fireEvent.change` used in WizardStep4Advanced tests instead of `userEvent.type` because userEvent interprets `{` as a keyboard modifier, making `{{variable}}` strings impossible to type naturally
- `extractVariables()` exported as standalone function so tests can assert on regex logic directly without DOM render
- Inline `RankingPage` stub in App.tsx keeps the route registered without blocking this plan; Plan 03-06 will promote it to `src/pages/RankingPage.tsx`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] exactOptionalPropertyTypes prevents `{ coverFile: undefined }` assignment**
- **Found during:** Task 1 (WizardStep3Image)
- **Issue:** TypeScript `exactOptionalPropertyTypes: true` rejects `{ coverFile: undefined }` as `Partial<WizardData>` because undefined is not assignable to `File` (the optional is absence-only, not undefined-allowed)
- **Fix:** Used `undefined as unknown as File` type assertion to signal field erasure without changing the runtime behavior
- **Files modified:** src/components/create/WizardStep3Image.tsx, src/components/create/CreateWizard.tsx
- **Verification:** `pnpm type-check` exits 0
- **Committed in:** 3cd7b24 (Task 1 commit), c30b7c6 (Task 3 commit)

**2. [Rule 1 - Bug] Same exactOptionalPropertyTypes issue for advancedTemplate in step 3 skip button**
- **Found during:** Task 3 (CreateWizard step 3 CTAs)
- **Issue:** `{ advancedTemplate: undefined, inputs_schema: [] }` fails same constraint as above
- **Fix:** Extracted `skipAdv` constant with `undefined as unknown as string` assertion
- **Files modified:** src/components/create/CreateWizard.tsx
- **Verification:** `pnpm type-check` exits 0
- **Committed in:** c30b7c6 (Task 3 commit)

**3. [Rule 1 - Bug] userEvent.type breaks on {{variable}} strings (curly brace is special key modifier)**
- **Found during:** Task 2 (TDD RED phase for WizardStep4Advanced)
- **Issue:** `userEvent.type(el, '{{name}}')` produces `Hello {name}}` in the textarea — single `{` is consumed as modifier start, second `{` types literally; full pattern doesn't reach the component
- **Fix:** Replaced `userEvent.type` with `fireEvent.change` + `{ target: { value } }` for all template-typing assertions; wrapped in helper `changeTemplate()`
- **Files modified:** src/components/create/WizardStep4Advanced.test.tsx
- **Verification:** All 6 tests pass
- **Committed in:** 08e7ac8 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2x Rule 1 - TS strict type constraint, 1x Rule 1 - test framework bug)
**Impact on plan:** All three fixes are correctness requirements. No scope creep. No architectural changes.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CREAT-01, CREAT-04, CREAT-05 complete — full wizard publish flow operational
- Plan 03-06 should replace the inline `RankingPage` stub in App.tsx with `src/pages/RankingPage.tsx`
- Plan 03-06/03-07: add sparkle/+ button in TabBar that navigates to /criar
- Plan 03-07: add "Criar variação" button on PromptyDetailPage linking to /criar?from=<id>

---
*Phase: 03-l3-criador*
*Completed: 2026-05-13*
