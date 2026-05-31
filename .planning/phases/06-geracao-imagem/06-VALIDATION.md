---
phase: 6
slug: geracao-imagem
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.1.0 + @testing-library/react 16.3.0 (frontend) + `supabase functions serve` + curl/psql (Edge Function integration) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `pnpm test:run --reporter=verbose` |
| **Full suite command** | `pnpm test:run` + key-leakage grep + Edge Function smoke |
| **Estimated runtime** | ~30s (Vitest) + ~15s (EF smoke) |

---

## Sampling Rate

- **After every task commit:** `pnpm test:run` (unit/RTL, <30s)
- **After every plan wave:** `pnpm test:run` + key-leakage grep + Edge Function smoke curl
- **Before `/gsd:verify-work`:** full suite green + manual Tauri Android CORS check
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | Auto? | Status |
|-----|----------|-----------|-------------------|-------|--------|
| GEN-01 | Logged-in w/ credits generates → image inline, balance→0 | Integration (local EF + DB) | `bash supabase/tests/gen01_generate_happy.sh` (serve + curl + psql balance check) | Manual-assisted | ⬜ |
| GEN-02 | Provider key never in bundle | grep | `grep -rE "VITE_.*(KEY\|TOKEN\|SECRET)" src/ \| grep -v ".test." ` → empty | ✅ auto | ⬜ |
| GEN-03 | No double-spend on fast double-click | RTL unit (hook) | `pnpm test:run src/hooks/useGenerate.test.tsx` (button disabled during loading; one invocation) | ✅ auto | ⬜ |
| GEN-03 | Server lock (true concurrency) | SQL | reuses Phase 4 `cred03_double_spend.sh` (spend_credit lock) | ✅ auto | ⬜ |
| GEN-04 | Credit refunded on provider failure | Integration (local EF) | `bash supabase/tests/gen04_refund_on_fail.sh` (curl `__FORCE_FAIL__` → assert refund row) | Manual-assisted | ⬜ |
| GEN-05 | Loading skeleton + inline result + error+refund msg | RTL unit (hook + component) | `pnpm test:run src/hooks/useGenerate.test.tsx` (idle→loading→done / →error) | ✅ auto | ⬜ |
| GEN-06 | Anonymous sees signup CTA | RTL unit | `pnpm test:run src/pages/PromptyDetailPage.test.tsx` (user=null → CTA text) | ✅ auto | ⬜ |
| GEN-07 | Zero-credit user sees earn nudge | RTL unit | `pnpm test:run src/pages/PromptyDetailPage.test.tsx` (credits=0 → nudge text) | ✅ auto | ⬜ |
| GEN-08 | Provider swap = 1 file + 1 secret | structural | `ls supabase/functions/generate-image/providers/` (mock+gemini+openai+replicate) + `grep ACTIVE_PROVIDER .../index.ts` | ✅ auto | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `supabase/config.toml` — add `[functions.generate-image]` block with `verify_jwt = true`
- [ ] `src/hooks/useGenerate.test.tsx` — GEN-03, GEN-05 (state transitions + disabled-during-loading), mocked `supabase.functions.invoke`
- [ ] `src/pages/PromptyDetailPage.test.tsx` — add GEN-06 (anon CTA) + GEN-07 (zero-credit nudge) cases
- [ ] `supabase/tests/gen01_generate_happy.sh` — happy path (manual-assisted)
- [ ] `supabase/tests/gen04_refund_on_fail.sh` — force-fail → refund row (manual-assisted)
- [ ] `.github/workflows/keep-alive.yml` — keep-alive cron (free-tier auto-pause guard)

*Reuses existing Vitest setup + Phase 4 `supabase/tests/` dir. No new framework.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tauri Android build does not get CORS error calling the function | GEN-05/GEN-02 | Tauri webview origin behavior only reproducible on a real Android build | Build Tauri Android, trigger generate, confirm no CORS error in webview console |
| Happy path against running stack (GEN-01) + refund (GEN-04) end-to-end | GEN-01, GEN-04 | Needs local `supabase start` + function served + DB | Run the gen01/gen04 shell scripts against local supabase; confirm image + balance + refund row |
| Real provider swap works | GEN-08 | Needs a real provider key | After `secrets set ACTIVE_PROVIDER=gemini GEMINI_API_KEY=...` and filling `gemini.ts`, generate once |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies or documented Manual-Only
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
