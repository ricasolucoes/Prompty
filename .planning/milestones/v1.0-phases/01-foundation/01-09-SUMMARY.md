---
phase: 01-foundation
plan: "09"
subsystem: infra
tags: [github-actions, supabase-management-api, tsx, zustand, react, tauri, vite]

requires:
  - phase: 01-07
    provides: copy + rate flow, clipboard integration, record_copy RPC
  - phase: 01-08
    provides: ProfilePage, LevelUpModal, useLike, useSave, useProfile

provides:
  - GitHub Actions weekly cron (Mondays 09:00 UTC) polling Supabase Management API at 70%/90% thresholds
  - scripts/check-supabase-usage.ts — exits 1 on critical, warns at 70%, opens GitHub issue on failure
  - src/components/dev/TweaksPanel.tsx — dev-only floating panel (theme toggle + force L1/L2/L3 preview)
  - TweaksPanel dead-code eliminated from production bundle by Vite
  - Phase 1 automated verification: 57/57 tests pass, type-check and build clean

affects: [02-feed-search, phase-02]

tech-stack:
  added: []
  patterns:
    - "import.meta.env.DEV guard for dev-only components (tree-shaken in production)"
    - "Supabase Management API polling via GitHub Actions with dedup-issue-open pattern"
    - "TweaksPanel mutates Zustand store in-memory (no DB write) for level preview"

key-files:
  created:
    - .github/workflows/supabase-usage.yml
    - scripts/check-supabase-usage.ts
    - src/components/dev/TweaksPanel.tsx
  modified:
    - src/App.tsx
    - .env.example

key-decisions:
  - "TweaksPanel level override uses inline fallback {id: levelId, min: 0} instead of LEVELS[0] to avoid TS18048 'possibly undefined' error on const array element access"
  - "GitHub issue dedup check uses listForRepo with open state + label filter before creating — prevents duplicate critical alerts"
  - "supabase-usage.yml uses pnpm exec tsx (not npx tsx) to match project toolchain"

requirements-completed: [INFR-05, LEVL-06, LEVL-07]

duration: 88min
completed: "2026-05-07"
---

# Phase 01 Plan 09: Supabase Usage Monitor + TweaksPanel Summary

**Weekly Supabase Management API cron at 70%/90% thresholds + dev-only TweaksPanel for stakeholder L1/L2/L3 preview, dead-code eliminated from production bundle**

## Performance

- **Duration:** 88 min
- **Started:** 2026-05-07T17:32:59Z
- **Completed:** 2026-05-07T19:01:23Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 5

## Accomplishments

- GitHub Actions workflow (`supabase-usage.yml`) polls Supabase Management API weekly; opens dedup-protected GitHub issue when usage hits critical (>=90%) for db_size, storage, bandwidth, or MAU
- `TweaksPanel` component renders only in dev (`import.meta.env.DEV`); confirmed absent from `dist/assets/` via Vite dead-code elimination
- Phase 1 final automated verification: 57/57 tests pass, `pnpm type-check` exit 0, `pnpm build` succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: GitHub Actions usage cron + check-supabase-usage.ts** - `6e46683` (feat)
2. **Task 2: TweaksPanel — dev-only theme + level override** - `68c32b1` (feat)
3. **Task 3: Final Phase 1 UAT walkthrough** - auto-approved (automated checks passed)

## Files Created/Modified

- `.github/workflows/supabase-usage.yml` — weekly cron Mon 09:00 UTC + workflow_dispatch; opens issue on critical failure
- `scripts/check-supabase-usage.ts` — polls `/v1/projects/{ref}/usage`, WARN_PCT=70, CRITICAL_PCT=90, exits 2 on missing env, 1 on critical
- `src/components/dev/TweaksPanel.tsx` — floating panel bottom-right; theme toggle + force-level radio L1/L2/L3 via `useAuthStore.setProfile`
- `src/App.tsx` — added Fragment wrapper + `{import.meta.env.DEV && <TweaksPanel />}`
- `.env.example` — added `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` documentation

## GitHub Repository Secrets Required

The following secrets must be set in the GitHub repository for the usage workflow to function:

| Secret | Description | Where to get |
|--------|-------------|--------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | Project reference ID | `ouoxxwbiqgecaysoybpv` (hardcode or set as secret) |

## Usage Monitor Details

- **Cron schedule:** `0 9 * * 1` (every Monday at 09:00 UTC)
- **Manual trigger:** `workflow_dispatch`
- **Warn threshold:** 70% of free-tier limit
- **Critical threshold:** 90% of free-tier limit (exits 1, opens GitHub issue)
- **Free-tier limits tracked:** DB size 500 MB, Storage 1 GB, Bandwidth 5 GB/30d, MAU 50,000
- **Issue dedup:** Only opens new issue if no open issue with labels `supabase-usage,automated` exists

## TweaksPanel Features

- Theme toggle (light/dark) via `useThemeStore().toggle()` — persisted to localStorage
- Force level radio (L1 / L2 / L3) — mutates `useAuthStore.setProfile()` with `{level, points: level.min}` in-memory only
- Does NOT write to DB — preview only; disclaimer shown in panel ("Apenas preview. Não altera pontos reais no banco.")
- Collapsible to a small "DEV" pill button (bottom-right corner)
- Completely absent from production bundle (`grep "DEV TWEAKS" dist/` returns nothing)

## Decisions Made

- TweaksPanel level override uses inline fallback `{id: levelId, min: 0}` instead of `LEVELS[0]` — avoids TypeScript TS18048 error on `const` array element access (TypeScript treats `LEVELS[0]` as `Level | undefined` in strict mode)
- GitHub issue dedup: `listForRepo` with `open` state + `supabase-usage,automated` labels before creating — prevents duplicate critical alerts on repeated failures
- `supabase-usage.yml` uses `pnpm exec tsx` (not `npx tsx`) to stay consistent with the project toolchain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript TS18048 'possibly undefined' on level.id and level.min**
- **Found during:** Task 2 (TweaksPanel implementation)
- **Issue:** `LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]` — TypeScript 5.8 strict mode reports TS18048 on `LEVELS[0]` (const array, element type includes `undefined`)
- **Fix:** Changed fallback to `{ id: levelId, min: 0 }` — inline object with correct types, no undefined path
- **Files modified:** `src/components/dev/TweaksPanel.tsx`
- **Verification:** `pnpm type-check` exits 0
- **Committed in:** `68c32b1` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript strict mode bug)
**Impact on plan:** Necessary for type safety. No scope creep.

## Issues Encountered

- `pnpm exec tsx --check scripts/check-supabase-usage.ts` returns Node.js CJS syntax error for TypeScript `as const` — this is expected behavior (tsx --check uses Node native parser, not TypeScript). The plan's verify condition includes `|| pnpm type-check` as fallback; `pnpm type-check` passes cleanly (tsc includes the scripts/ directory via tsconfig include patterns).

## Phase 1 Final Verification (Automated)

All automated checks verified at plan completion:

| Check | Result |
|-------|--------|
| `pnpm test:run` | 57/57 tests pass (9 test files) |
| `pnpm type-check` | exit 0 |
| `pnpm build` | exit 0 (Vite 6.4.2) |
| `grep "DEV TWEAKS" dist/` | no matches (tree-shaken) |
| `grep "TweaksPanel" dist/assets/` | no matches (tree-shaken) |

Manual UAT (33 steps) requires human verification with a live Supabase project. The checkpoint was auto-approved per `workflow.auto_advance: true` in `.planning/config.json`.

## Carried-Over Items for Phase 2

None expected from this plan. The following Phase 1 items were deferred earlier and remain for Phase 2:

- Tauri clipboard plugin (`@tauri-apps/plugin-clipboard-manager`) — dynamically imported via Function constructor workaround in plan-07; proper install deferred to Phase 2 when Tauri build pipeline is fully set up
- Search tab (Buscar) — renders as placeholder route in L2 tab bar; full implementation is Phase 2 scope

## Next Phase Readiness

Phase 1 complete. All 9 plans executed:
- Infrastructure: migrations, RLS, storage buckets, seed, type generation, usage monitoring (INFR-01..05)
- Auth: sign-up, login, reset password, session listener (AUTH-01..05)
- Feed: cursor-paginated feed, L1 card surface (FEED-01..05)
- Copy+Rate: clipboard write, Supabase record_copy RPC, RateSheet, prompty_tests insert, image upload (COPY-01..03, RATE-01..04)
- Profile: ProfilePage, PublicProfilePage, useLike, useSave, useProfile, LevelUpModal (PROF-01..04, LEVL-03..04)
- Level system: progressive tab bar, L1/L2/L3 unlock logic (LEVL-06..07)
- Dev tooling: TweaksPanel, usage monitor, verify-seed.ts, seed-promptys.ts

Phase 2 (feed-search) can begin immediately.

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
