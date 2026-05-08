---
phase: 2
slug: l2-curador-descoberta
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.ts` (vitest inline config) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | FEED-06 | migration | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | FEED-07 | migration + query | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | CUR-01 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | CUR-02 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | CUR-03 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | CUR-04 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 2 | CUR-05 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 2 | MODR-01 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-04-02 | 04 | 2 | MODR-02 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |
| 2-04-03 | 04 | 2 | MODR-03 | unit | `npx vitest run --reporter=dot` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/phase-02/feed-filters.test.tsx` — stubs for FEED-06, FEED-07
- [ ] `src/tests/phase-02/curator.test.tsx` — stubs for CUR-01, CUR-02, CUR-03
- [ ] `src/tests/phase-02/moderation.test.tsx` — stubs for CUR-04, CUR-05, MODR-01, MODR-02, MODR-03
- [ ] Update `src/__tests__/TabBar.test.tsx` line 55 — assert 4 tabs for L2 (not 3)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload imagem gerada | CUR-01 | File picker + Supabase Storage UI flow | Acesse perfil L2, clique "Enviar resultado", selecione imagem, confirme upload em Supabase Storage bucket |
| Moderação admin | MODR-02 | Role-based UI not testable in unit | Login como admin, abra prompty denunciado, altere status para "removido" ou "aprovado" |
| Busca full-text | FEED-07 | FTS config `portuguese` vs `simple` | Pesquise palavra em português com acento; verifique resultado retornado |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
