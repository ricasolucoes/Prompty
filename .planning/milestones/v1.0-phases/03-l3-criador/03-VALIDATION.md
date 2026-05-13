---
phase: 3
slug: l3-criador
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + React Testing Library 16.x |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `pnpm test:run --reporter=verbose src/components/create/` |
| **Full suite command** | `pnpm test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:run src/components/create/ src/hooks/useCreatePrompty.test.ts`
- **After every plan wave:** Run `pnpm test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01 | migration | 1 | CREAT-01, CREAT-04 | manual | `pnpm supabase db push` | ❌ W0 | ⬜ pending |
| 3-02 | useCreatePrompty | 1 | CREAT-01, CREAT-04 | unit | `pnpm test:run src/hooks/useCreatePrompty.test.ts` | ❌ W0 | ⬜ pending |
| 3-03 | CriarPage route | 1 | CREAT-01 | unit | `pnpm test:run src/pages/CriarPage.test.tsx` | ❌ W0 | ⬜ pending |
| 3-04 | WizardStep1Basics | 2 | CREAT-02 | unit | `pnpm test:run src/components/create/WizardStep1Basics.test.tsx` | ❌ W0 | ⬜ pending |
| 3-05 | WizardStep4Advanced | 2 | CREAT-05 | unit | `pnpm test:run src/components/create/WizardStep4Advanced.test.tsx` | ❌ W0 | ⬜ pending |
| 3-06 | MyPromptysGrid | 2 | CREAT-03 | unit | `pnpm test:run src/components/profile/MyPromptysGrid.test.tsx` | ❌ W0 | ⬜ pending |
| 3-07 | TabBar L3 update | 2 | LEVL-07 | unit | `pnpm test:run src/components/layout/TabBar.test.tsx` | ✅ exists | ⬜ pending |
| 3-08 | Variation fork | 2 | CREAT-04 | unit | `pnpm test:run src/pages/CriarPage.test.tsx` | ❌ W0 | ⬜ pending |
| 3-09 | PromptyDetailPage variation btn | 2 | CREAT-04 | unit | `pnpm test:run src/pages/PromptyDetailPage.test.tsx` | ✅ exists | ⬜ pending |
| 3-10 | template.ts resolveBeginner | 1 | CREAT-05 | unit | `pnpm test:run src/lib/prompty/template.test.ts` | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useCreatePrompty.test.ts` — stubs for CREAT-01, CREAT-04
- [ ] `src/pages/CriarPage.test.tsx` — stubs for CREAT-01, CREAT-04 (route + wizard mount)
- [ ] `src/components/create/WizardStep1Basics.test.tsx` — stubs for CREAT-02
- [ ] `src/components/profile/MyPromptysGrid.test.tsx` — stubs for CREAT-03 (stats display + L3 gate)
- [ ] `src/components/create/WizardStep4Advanced.test.tsx` — stubs for CREAT-05 (variable detection)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cover image upload compresses to WebP and appears in feed card | CREAT-01 | Storage bucket integration; no test harness for browser File API + Supabase Storage | Upload a JPEG > 500KB; verify card shows WebP cover, file in `prompty-covers` bucket |
| Publish trigger awards 50 points to author | CREAT-01 | Supabase trigger; cannot fire from unit test environment | Create prompty as L3 user; check profile points incremented by 50 |
| Wizard OS back gesture loses data (documented known gap) | CREAT-01 | Browser navigation behavior; not testable in RTL | Fill 2 steps, press OS back; verify feed opens (not wizard); data is gone — expected |
| Variation "Baseado em [título]" attribution displays in detail page | CREAT-04 | Visual rendering; no RTL assertion covers display text in full page context | Create variation; navigate to its detail page; verify attribution line present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
