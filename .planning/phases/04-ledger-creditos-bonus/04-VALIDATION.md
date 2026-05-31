---
phase: 4
slug: ledger-creditos-bonus
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.1.0 (frontend) + psql SQL smoke scripts (DB) |
| **Config file** | `vitest.config.ts` (separate from vite.config.ts) |
| **Quick run command** | `pnpm test:run --reporter=verbose` |
| **Full suite command** | `pnpm run quality:all` + SQL smoke scripts in `supabase/tests/` |
| **Estimated runtime** | ~30s (Vitest) + ~10s (SQL smoke) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:run --reporter=verbose`
- **After every plan wave:** Run `pnpm test:run` + relevant `supabase/tests/*.sql`
- **Before `/gsd:verify-work`:** Full suite + all SQL smoke scripts green
- **Max feedback latency:** 40 seconds

---

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|-----------|-------------------|-------------|--------|
| CRED-01 | `handle_new_user` → exactly 1 `signup_bonus` row | SQL smoke | `psql $DATABASE_URL -f supabase/tests/cred01_signup_bonus.sql` | ❌ W0 | ⬜ pending |
| CRED-01 | Running `handle_new_user` twice → still 1 bonus (idempotent) | SQL smoke | same script (second invocation) | ❌ W0 | ⬜ pending |
| CRED-02 | AppHeader renders credit badge with count from store | RTL unit | `pnpm test:run src/components/layout/AppHeader.test.tsx` | ❌ W0 | ⬜ pending |
| CRED-02 | `useCredits` returns `profile.credits ?? 0` (null-safe) | RTL unit | `pnpm test:run src/hooks/useCredits.test.ts` | ❌ W0 | ⬜ pending |
| CRED-03 | client `profiles.update({credits:999})` → blocked | SQL/RLS smoke | `psql $DATABASE_URL -f supabase/tests/cred03_rls_block.sql` | ❌ W0 | ⬜ pending |
| CRED-03 | client `credit_events.insert(...)` → RLS error | SQL/RLS smoke | same `cred03_rls_block.sql` | ❌ W0 | ⬜ pending |
| CRED-03 | two concurrent `spend_credit()` w/ 1 credit → 1 success, balance never < 0 | Concurrency SQL | `bash supabase/tests/cred03_double_spend.sh` | ❌ W0 | ⬜ pending |
| CRED-04 | authenticated user reads `credit_events` → only own rows | SQL smoke | `psql $DATABASE_URL -f supabase/tests/cred04_rls_isolation.sql` | ❌ W0 | ⬜ pending |
| CRED-04 | credit history view renders events sorted desc | RTL unit | `pnpm test:run src/pages/CreditHistoryPage.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `supabase/tests/` directory created (new — no SQL test dir exists yet)
- [ ] `supabase/tests/cred01_signup_bonus.sql` — signup bonus + idempotency (CRED-01)
- [ ] `supabase/tests/cred03_rls_block.sql` — block client mutation of profiles.credits + credit_events insert (CRED-03)
- [ ] `supabase/tests/cred03_double_spend.sh` — two-process psql concurrency test (CRED-03)
- [ ] `supabase/tests/cred04_rls_isolation.sql` — cross-user isolation (CRED-04)
- [ ] `src/components/layout/AppHeader.test.tsx` — credit badge (CRED-02)
- [ ] `src/hooks/useCredits.test.ts` — selector null-safety (CRED-02)
- [ ] `src/pages/CreditHistoryPage.test.tsx` (or sheet test) — history rendering (CRED-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guard trigger `current_user='authenticated'` discriminator fires correctly in LOCAL Supabase (not just hosted) | CRED-03 | PostgREST role-setting behavior best confirmed against running stack | After migration applied locally, run `cred03_rls_block.sql`; if it does not block, confirm `SELECT current_user` inside an authenticated session |
| Badge visual placement next to level badge | CRED-02 | Visual/layout judgment | Run app logged in, confirm "🎟️ N" badge appears beside level badge in AppHeader |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
