---
phase: 06-geracao-imagem
plan: "03"
subsystem: generate-ui
tags: [generation, credits, useGenerate, hook, PromptyDetailPage, GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07]
dependency_graph:
  requires: ["06-01", "06-02"]
  provides: [useGenerate-hook, generate-button-ui, anon-CTA, zero-credit-nudge, inline-image, error-refund-message]
  affects: [PromptyDetailPage, credit-badge]
tech_stack:
  added: []
  patterns: [renderHook-act-testing, inFlight-useRef-guard, supabase-functions-invoke]
key_files:
  created:
    - src/hooks/useGenerate.ts
    - src/hooks/useGenerate.test.tsx (rewritten from scaffold)
  modified:
    - src/pages/PromptyDetailPage.tsx
    - src/pages/PromptyDetailPage.test.tsx
    - CLAUDE.md
    - AGENTS.md
decisions:
  - "useGenerate mirrors useCopy refetchProfile pattern — fire-and-forget void call after every invoke outcome"
  - "inFlight useRef (not state) for GEN-03 guard — synchronous early-return before setState, prevents React batching ambiguity"
  - "GEN-07 nudge is a plain <p> with contribution copy, not a PrimaryButton — avoids accidental paywall pattern"
  - "Edge Function exception documented in both CLAUDE.md and AGENTS.md in the same commit per rule-sync clause"
metrics:
  duration: "~20min"
  completed_date: "2026-06-21"
  tasks_completed: 3
  files_changed: 6
---

# Phase 06 Plan 03: Frontend Generate UI Summary

**One-liner:** 4-state useGenerate hook (idle/loading/done/error) wired to PromptyDetailPage with anon CTA, zero-credit earn nudge, generate button with anti-double-click guard, inline image on success, and error+refund message.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | useGenerate hook + GEN-03/05 tests GREEN | 9609127 | src/hooks/useGenerate.ts, src/hooks/useGenerate.test.tsx |
| 2 | PromptyDetailPage generate UI + GEN-01/06/07 tests GREEN | e3a21cb | src/pages/PromptyDetailPage.tsx, src/pages/PromptyDetailPage.test.tsx |
| 3 | CLAUDE.md + AGENTS.md Edge Function exception | f8a2d1d | CLAUDE.md, AGENTS.md |

## What Was Built

### useGenerate hook (`src/hooks/useGenerate.ts`)

- 4-state machine: `idle → loading → done | error`
- `supabase.functions.invoke('generate-image', { body: { prompty_id, rendered_prompt } })`
- `inFlight` useRef guard — synchronous early-return on second call (GEN-03)
- `refetchProfile()` called on every outcome, success or error (GEN-05 badge decrement)
- Error path: prefers `data?.error` over `error?.message` (GEN-04 refund message)

### PromptyDetailPage generate UI (`src/pages/PromptyDetailPage.tsx`)

- **Anonymous (`!user`):** button with exact text "Cadastre-se e ganhe 1 crédito para gerar" → `nav('/signup')` (GEN-06)
- **Logged-in, credits === 0:** earn nudge paragraph listing Phase 5 contribution actions — no paywall, no "comprar"/"R$" wording (GEN-07)
- **Logged-in, credits >= 1:** PrimaryButton with `disabled={genState === 'loading'}` + loading label → immediate anti-double-click (GEN-01/03)
- **Success state:** inline `<img src={signedUrl} alt="Imagem gerada" />` (GEN-05)
- **Error state:** `<p>` with errorMsg + "Seu crédito foi devolvido." (GEN-04/05)

### Documentation (`CLAUDE.md`, `AGENTS.md`)

- Both updated in the same commit per rule-sync clause
- Edge Function carve-out: provider keys in `Deno.env` only, never `VITE_*` or bundle (GEN-02)
- "service_role nunca no frontend" rule preserved

## Verification

- `pnpm test:run`: 229/229 tests pass (40 test files)
- `pnpm type-check`: exits 0
- `grep -rE "SERVICE_ROLE|GEMINI_API_KEY|OPENAI_API_KEY|REPLICATE_API_TOKEN" src/`: empty (GEN-02 satisfied)
- No `it.todo` remaining in useGenerate.test.tsx or PromptyDetailPage.test.tsx

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `src/hooks/useGenerate.ts` exists with `functions.invoke('generate-image'`, `inFlight`, `refetchProfile`, `rendered_prompt`, `prompty_id`
- [x] `src/pages/PromptyDetailPage.tsx` contains all required strings: "Cadastre-se e ganhe 1 crédito para gerar", "Gerar imagem (1 crédito)", "Seu crédito foi devolvido", "Contribua para ganhar mais"
- [x] Commits 9609127, e3a21cb, f8a2d1d exist
- [x] 229 tests pass, type-check clean
