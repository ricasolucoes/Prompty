---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (`^3.1.0` installed) |
| **Config file** | None found — Wave 0 adds vitest config to `vite.config.ts` or creates `vitest.config.ts` |
| **Quick run command** | `pnpm test:run -- --reporter=dot` |
| **Full suite command** | `pnpm test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:run -- src/lib/prompty/template.test.ts src/lib/constants/levels.test.ts`
- **After every plan wave:** Run `pnpm test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-xx-01 | schema | 0 | INFR-01 | manual | Supabase Studio — check RLS policies | N/A | ⬜ pending |
| 1-xx-02 | schema | 0 | INFR-02 | manual | Supabase Studio — verify trigger fires on prompty_tests insert | N/A | ⬜ pending |
| 1-xx-03 | template | 0 | FEED-04 | unit | `pnpm test:run -- src/lib/prompty/template.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-04 | levels | 0 | LEVL-01/02 | unit | `pnpm test:run -- src/lib/constants/levels.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-05 | compress | 0 | INFR-03 | unit | `pnpm test:run -- src/lib/images/compress.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-06 | auth-store | 1 | AUTH-02/03 | unit | `pnpm test:run -- src/stores/auth.store.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-07 | auth-hooks | 1 | AUTH-01/04 | unit | `pnpm test:run -- src/hooks/useAuth.test.ts` | ❌ W0 | ⬜ pending |
| 1-xx-08 | feed-card | 2 | LEVL-06 | unit (RTL) | `pnpm test:run -- src/components/feed/FeedCard.test.tsx` | ❌ W0 | ⬜ pending |
| 1-xx-09 | tab-bar | 2 | LEVL-07 | unit (RTL) | `pnpm test:run -- src/components/layout/TabBar.test.tsx` | ❌ W0 | ⬜ pending |
| 1-xx-10 | feed-page | 2 | AUTH-05 | unit | `pnpm test:run -- src/pages/FeedPage.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` or vitest config in `vite.config.ts` — jsdom environment for RTL
- [ ] `src/lib/prompty/template.test.ts` — `resolveBeginner` unit tests (FEED-04)
- [ ] `src/lib/constants/levels.test.ts` — `levelOf` boundary tests (LEVL-01, LEVL-02)
- [ ] `src/lib/images/compress.test.ts` — image compression output size (INFR-03)
- [ ] `src/stores/auth.store.test.ts` — Zustand store behavior (AUTH-02, AUTH-03)
- [ ] `src/hooks/useAuth.test.ts` — auth actions (AUTH-01, AUTH-04)
- [ ] `src/components/feed/FeedCard.test.tsx` — L1 forbidden elements excluded (LEVL-06)
- [ ] `src/components/layout/TabBar.test.tsx` — 2 tabs rendered for L1 (LEVL-07)
- [ ] `src/pages/FeedPage.test.tsx` — feed accessible to unauthenticated user (AUTH-05)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All tables have RLS + explicit policies | INFR-01 | Requires live Supabase Studio inspection | Open Supabase Studio → Authentication → Policies; verify every table has policies for anon + authenticated roles |
| SQL trigger fires on prompty_tests insert | INFR-02 | Trigger behavior needs DB-level verification | Insert row in `prompty_tests` via Studio; check `point_events` for new row; check `profiles.points` incremented |
| RLS blocks direct `point_events` insert from client | INFR-02 | Browser-level test | Open browser devtools; run `supabase.from('point_events').insert({...})`; confirm 0 rows affected, no JS error |
| Save and feedback actions work for auth user | SOCL-01/03 | Requires live Supabase session | Log in → open FeedCard → tap save → check `prompty_saves` in Studio; tap feedback → fill form → check `prompty_tests` |
| Profile update persists | PROF-01 | Requires live Supabase session | Open profile edit → change username → save → reload app; confirm username persists |
| LevelUp modal shows once only | LEVL-03 | State persistence across reload | Reach L2 threshold → modal appears → dismiss → reload app; confirm modal does NOT re-appear |
| L1 interface shows no locked/greyed features | LEVL-06 | Visual inspection | Load as L1 user; confirm no cadeados, no greyed buttons, no disabled tabs |
| Storage bucket rejects files > 2 MB | INFR-04 | Requires Supabase Storage bucket configured | Attempt to upload 3 MB image via feedback form; confirm Supabase returns error |
| GitHub Actions cron workflow runs | INFR-05 | Requires GitHub repo + secrets | Check Actions tab in GitHub after merge; verify cron job appears and runs on schedule |
| Clipboard write succeeds on iOS device | FEED-04 | Device-level test; Tauri iOS WKWebView constraint | Run Tauri iOS build; tap Copiar; paste in Notes app; confirm prompt text present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
