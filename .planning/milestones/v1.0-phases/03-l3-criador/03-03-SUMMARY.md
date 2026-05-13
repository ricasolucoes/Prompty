---
phase: 03-l3-criador
plan: "03"
subsystem: ui
tags: [react, wizard, form, tdd, testing-library]

# Dependency graph
requires:
  - phase: 03-02
    provides: useCreatePrompty hook, WizardData type, publish() function

provides:
  - WizardProgressBar: 4-segment gradient progress bar with "N de 4" counter
  - WizardStep1Basics: title input + 3 category chips + expandable optional fields (tags + model)
  - WizardStep2Prompt: mono textarea for beginner_prompt + tip callout
  - CreateWizard: wizard root with step state machine (0-3), data state, patch/next/back navigation

affects:
  - 03-05 (adds steps 2+3 conditional branches and publish CTA to CreateWizard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD with @testing-library/react and userEvent for wizard component tests
    - radiogroup + role=radio + aria-checked for custom chip-based selector
    - Disclosure pattern via useState + aria-expanded for optional fields

key-files:
  created:
    - src/components/create/WizardProgressBar.tsx
    - src/components/create/WizardStep1Basics.tsx
    - src/components/create/WizardStep2Prompt.tsx
    - src/components/create/CreateWizard.tsx
  modified:
    - src/components/create/WizardStep1Basics.test.tsx (replaced Wave 0 scaffold with 6 real RTL tests)

key-decisions:
  - "[Phase 03-03]: handlePublish defined in CreateWizard and referenced via false-branch render to satisfy TypeScript strict unused-variable check — Plan 03-05 will wire it to the publish button"
  - "[Phase 03-03]: WizardStep1Basics uses role=radio on buttons inside role=radiogroup — ARIA 1.1 pattern enables aria-checked for chip-style selectors without native <input type=radio>"

patterns-established:
  - "Wizard chip selector: role=radiogroup wrapping role=radio buttons with aria-checked — same pattern should be reused in any future multi-option selector"
  - "Disclosure toggle: useState(false) + aria-expanded + conditional render — preferred over accordion library for single-use optional fields"

requirements-completed: [CREAT-01, CREAT-02]

# Metrics
duration: 129min
completed: "2026-05-13"
---

# Phase 03 Plan 03: Wizard Core (ProgressBar + Steps 1+2 + CreateWizard) Summary

**4-component wizard core: step state machine in CreateWizard, gradient ProgressBar, Step 1 with category chips and expandable optional fields, Step 2 with mono textarea — 6 RTL tests covering CREAT-01 and CREAT-02 all green**

## Performance

- **Duration:** 129 min
- **Started:** 2026-05-13T00:13:30Z
- **Completed:** 2026-05-13T02:22:58Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- WizardProgressBar: 4 segments with `linear-gradient(90deg, #7C3AED, #22D3EE)` on completed steps, "N de 4" counter, aria-valuenow/min/max
- WizardStep1Basics: title input, 3 complexity chips (Simples/Guiado/Avançado → beginner/intermediate/advanced), expandable Tags + Modelo recomendado via disclosure; 6 RTL tests covering chip ARIA state, onChange patches, and disclosure toggle
- WizardStep2Prompt: mono-font textarea for beginner_prompt with char counter, tip callout with Prompt Cyan accent
- CreateWizard: step state (0-3), WizardData ownership, isStepValid guards Continuar CTA, handlePublish stub pre-wired for Plan 03-05

## Task Commits

Each task was committed atomically:

1. **Task 1: WizardProgressBar** - `907a882` (feat)
2. **Task 2: WizardStep1Basics + TDD tests** - `eda2de3` (feat)
3. **Task 3: WizardStep2Prompt + CreateWizard** - `c072d84` (feat)

## Files Created/Modified
- `src/components/create/WizardProgressBar.tsx` - 4-segment gradient progress bar + "N de 4" counter
- `src/components/create/WizardStep1Basics.tsx` - Step 1: title input + category chips + optional fields disclosure
- `src/components/create/WizardStep1Basics.test.tsx` - 6 RTL tests for CREAT-01 (title) and CREAT-02 (chips)
- `src/components/create/WizardStep2Prompt.tsx` - Step 2: mono textarea + tip callout
- `src/components/create/CreateWizard.tsx` - Wizard root: step state machine + data state + navigation + error Toast

## Decisions Made
- `handlePublish` is defined inside CreateWizard but referenced via a `{false && <button onClick={handlePublish} />}` branch to satisfy TypeScript strict unused-variable enforcement. Plan 03-05 will replace this with the real publish button on steps 2+3.
- WizardStep1Basics uses `role="radio"` on `<button>` elements inside `role="radiogroup"` — this is the ARIA 1.1 pattern that enables `aria-checked` for visually styled chip selectors, fully testable with `getByRole('radio', { name })`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript unused-variable error for handlePublish**
- **Found during:** Task 3 (CreateWizard creation)
- **Issue:** Plan suggested `void handlePublish` at module level but `handlePublish` is a function defined inside the component body — referencing it outside the component is a `TS2304: Cannot find name` error
- **Fix:** Added `{false && <button onClick={handlePublish} />}` inside the JSX return — TypeScript sees handlePublish as used; React never renders it (false short-circuits)
- **Files modified:** src/components/create/CreateWizard.tsx
- **Verification:** `pnpm type-check` exits 0
- **Committed in:** c072d84 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix required for type-check to pass. No behavior change, no scope creep.

## Issues Encountered
- TypeScript strict mode flagged `handlePublish` as unused when referenced outside the component function scope. Resolved inline as documented above.

## Plan 03-05 Hand-off Notes

Plan 03-05 must:
1. **Add step 2 conditional**: `{step === 2 && <WizardStep3Image data={data} onChange={patch} />}` in `CreateWizard.tsx` section body
2. **Add step 3 conditional**: `{step === 3 && <WizardStep4Advanced data={data} onChange={patch} />}`
3. **Add publish CTA**: Replace/supplement the Continuar button on steps 2+3 with a Publicar button that calls `handlePublish()`
4. **Remove false-branch stub**: `{false && <button onClick={handlePublish} />}` can be deleted once the real publish button is wired
5. **Create WizardStep3Image**: cover image upload component
6. **Create WizardStep4Advanced**: advanced template + variable detection (Wave 0 scaffold already exists in `WizardStep4Advanced.test.tsx`)
7. **Wire CriarPage route**: `/criar` page that instantiates `<CreateWizard onPublish={useCreatePrompty().publish} onClose={navigate(-1)} />`

Do NOT replace CreateWizard.tsx — only add the missing step branches and the publish CTA.

## Next Phase Readiness
- All 4 component files exist and type-check clean
- 6 RTL tests cover CREAT-01 and CREAT-02 requirements
- Full test suite: 171 passed, 0 failures
- CreateWizard contract matches Plan 03-05 expected props (initialData, onClose, onPublish)
- WizardData type imported from `@/hooks/useCreatePrompty` (03-02 dependency satisfied)

---
*Phase: 03-l3-criador*
*Completed: 2026-05-13*
