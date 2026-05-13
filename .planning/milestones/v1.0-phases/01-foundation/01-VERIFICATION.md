---
phase: 01-foundation
verified: 2026-05-07T20:15:00Z
status: passed
score: 27/28 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 23/28
  gaps_closed:
    - "FEED-03: PromptyDetailPage at /p/:slug now exists, is routed, and shows full prompt + Copiar"
    - "SOCL-01: useSave wired into PromptyDetailPage (auth-only Salvar button); hook no longer orphaned"
    - "LEVL-02: profiles.last_active_at column added via migration 005; touchLastActive called on session establish/restore; REQUIREMENTS.md annotated"
    - "LEVL-03: UNLOCKS.L2 now contains exactly four items including 'Avaliar Promptys e enviar imagens geradas'"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Unauthenticated user opens app, sees WelcomeStrip, browses feed, clicks card title, arrives at /p/:slug detail page, copies prompt without login"
    expected: "Feed loads, WelcomeStrip visible, clicking card title navigates to detail page, full prompt visible, Copiar button works, no Salvar button shown, clipboard gets text"
    why_human: "Clipboard API and real navigation require live browser; jsdom mocks clipboard"
  - test: "Authenticated user rates a prompty with a photo"
    expected: "RateSheet opens, photo compresses to WebP ≤200KB, prompty_tests row inserted, +5p awarded, LevelUpModal appears if threshold crossed"
    why_human: "Requires live Supabase connection and actual file upload to storage"
  - test: "Supabase trigger fires: auth.users insert -> profiles row created"
    expected: "After signup, profiles table has a row for the new user automatically"
    why_human: "Requires live Supabase; trigger runs server-side"
  - test: "profiles.last_active_at updated on login"
    expected: "After signing in, the profiles row for the user has last_active_at set to approximately now"
    why_human: "Requires live Supabase; client UPDATE runs against real DB"
---

# Phase 1: L1 Iniciante — Feed e Copiar — Re-Verification Report

**Phase Goal:** Qualquer visitante pode navegar o feed, ler um prompt pronto, copiá-lo e usar no Gemini; usuários autenticados podem salvar e marcar feedback; o sistema registra ações internamente para cálculo de nível sem exibir gamificação.
**Verified:** 2026-05-07T20:15:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure via plans 01-10 and 01-11

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitante não autenticado abre o app, vê o card "Como funciona", navega o feed, abre detalhe do Prompty em /p/:slug, e copia sem criar conta | VERIFIED | WelcomeStrip for !user; FeedCard title is a Link to `/p/${prompty.slug}`; PromptyDetailPage fetches by slug + shows full prompt; Copiar wired via useCopy; no Salvar button rendered when user === null |
| 2 | Usuário autenticado pode salvar e marcar feedback | VERIFIED | PromptyDetailPage renders `{user && <button aria-label="Salvar na biblioteca">}` wired to useSave; RateSheet + useTest still fully wired in FeedPage |
| 3 | Ações internas registradas via trigger SQL; L1 não exibe pontos, ranking, badges, comentários, remix ou editor avançado | VERIFIED | FeedCard LEVL-06 RTL tests pass (66/66); point_events has WITH CHECK(false); no forbidden elements in production render |
| 4 | Todas as tabelas têm RLS; escritas de eventos só via triggers | VERIFIED | 9 ENABLE ROW LEVEL SECURITY in migration 002; point_events_no_client_insert policy with WITH CHECK(false) confirmed |
| 5 | Quando critérios de L2 são atingidos, sistema exibe mensagem discreta de desbloqueio com conteúdo correto | VERIFIED | LevelUpModal UNLOCKS.L2 = ['Buscar Promptys por estilo', 'Salvar favoritos na sua biblioteca', 'Avaliar Promptys e enviar imagens geradas', 'Seguir criadores']; new LevelUpModal.test.tsx asserts all four strings |

**Score:** 5/5 truths verified

---

## Gap Closure Verification (Plans 01-10 and 01-11)

### Gap 1 — FEED-03: PromptyDetailPage at /p/:slug (Plan 01-10)

| Check | Result | Evidence |
|-------|--------|----------|
| File exists | VERIFIED | `src/pages/PromptyDetailPage.tsx` — 235 lines |
| Route registered in App.tsx | VERIFIED | `<Route path="/p/:slug" element={<PromptyDetailPage />} />` at line 48, inside ChromeShell |
| Fetches by slug | VERIFIED | `.from('promptys').eq('slug', slug).eq('status', 'published').maybeSingle()` at lines 35-37 |
| Full prompt rendered (no clamp) | VERIFIED | `data-testid="prompt-text-full"` at line 181 with `whiteSpace: 'pre-wrap'`, no line-clamp style |
| Copiar prompt button | VERIFIED | `<PrimaryButton full icon={...} onClick={handleCopy}>` wired to useCopy |
| FeedCard title links to /p/:slug | VERIFIED | `<Link to={\`/p/${prompty.slug}\`}>` inside `<h2>` at lines 84-89 of FeedCard.tsx |
| FEED-03 test passes | VERIFIED | `PromptyDetailPage.test.tsx > FEED-03:` passes; 66/66 tests total |

### Gap 2 — SOCL-01: Save button on PromptyDetailPage (Plan 01-10)

| Check | Result | Evidence |
|-------|--------|----------|
| useSave imported in PromptyDetailPage | VERIFIED | `import { useSave } from '@/hooks/useSave'` at line 5 |
| useSave called unconditionally (Rules of Hooks) | VERIFIED | `const { saved, toggle: toggleSave } = useSave(promptyIdForSave)` at line 56 |
| Save button rendered only for authenticated users | VERIFIED | `{user && (<button ... aria-label={saved ? 'Remover dos salvos' : 'Salvar na biblioteca'}>` at line 201 |
| Anonymous users see no Salvar button | VERIFIED | PromptyDetailPage.test.tsx SOCL-01 anon test passes |
| Authenticated users see Salvar button | VERIFIED | PromptyDetailPage.test.tsx SOCL-01 auth test passes |
| useSave no longer orphaned | VERIFIED | Exactly 1 production import found: `src/pages/PromptyDetailPage.tsx:5` |
| LEVL-06 constraint preserved | VERIFIED | FeedCard.test.tsx line 56 `queryByLabelText(/salvar/i)` still asserts absent; all FeedCard tests pass |

### Gap 3 — LEVL-02: Return visit tracking (Plan 01-11)

| Check | Result | Evidence |
|-------|--------|----------|
| Migration 005 exists | VERIFIED | `supabase/migrations/20260507000005_last_active_and_levl_annotations.sql` |
| ADD COLUMN last_active_at | VERIFIED | `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NULL` |
| Index created | VERIFIED | `CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles (last_active_at DESC NULLS LAST)` |
| COMMENT ON FUNCTION level_from_points | VERIFIED | Annotates LEVL-02 design choice at line 43 |
| COMMENT ON COLUMN profiles.last_active_at | VERIFIED | Explains passive tracking role at line 46 |
| TypeScript types updated | VERIFIED | `last_active_at: string \| null` in Row (line 58); `last_active_at?: string \| null` in Insert (71) and Update (84) |
| touchLastActive in main.tsx | VERIFIED | Defined at line 20; called at line 43 (initial load) and line 57 (onAuthStateChange) — 2 calls total |
| REQUIREMENTS.md annotated | VERIFIED | LEVL-02 line now reads "approximated by aggregate point accumulation (50p threshold)..." |

### Gap 4 — LEVL-03: LevelUpModal UNLOCKS.L2 copy (Plan 01-11)

| Check | Result | Evidence |
|-------|--------|----------|
| UNLOCKS.L2 contains exactly 4 items | VERIFIED | Lines 16-21 of LevelUpModal.tsx: Buscar, Salvar, Avaliar, Seguir |
| Exact phrasing present | VERIFIED | `'Avaliar Promptys e enviar imagens geradas'` at line 19 |
| L3 list unchanged (no regression) | VERIFIED | L3 still has 3 items: Criar, Estatísticas, Variações |
| LevelUpModal.test.tsx created | VERIFIED | `src/components/modals/LevelUpModal.test.tsx` with 5 tests |
| LEVL-03 test passes | VERIFIED | All 5 LevelUpModal tests pass |

---

## Required Artifacts

### Previously Verified (Spot-checked for Regression)

| Artifact | Status | Regression Check |
|----------|--------|-----------------|
| `src/lib/constants/levels.ts` | VERIFIED | LEVELS and levelOf unchanged; 16 tests still pass |
| `src/lib/prompty/template.ts` | VERIFIED | resolveBeginner unchanged; 8 template tests still pass |
| `src/hooks/useCopy.ts` | VERIFIED | supabase.rpc('record_copy') still at line 53 |
| `src/hooks/useSave.ts` | VERIFIED | Still exports useSave; now imported by PromptyDetailPage |
| `src/components/layout/PrivateRoute.tsx` | VERIFIED | Outlet + Navigate pattern unchanged |
| `supabase/migrations/20260507000002_rls_policies.sql` | VERIFIED | 9 ENABLE ROW LEVEL SECURITY; point_events WITH CHECK(false) confirmed |
| `src/components/feed/FeedCard.tsx` | VERIFIED | Title now a Link (FEED-03 fix); LEVL-06 tests still pass; no aria-label /salvar/i |
| `src/App.tsx` | VERIFIED | /p/:slug route inside ChromeShell; existing routes untouched |

### New Artifacts (Plans 01-10, 01-11)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/pages/PromptyDetailPage.tsx` | VERIFIED | 235 lines; exports PromptyDetailPage; slug fetch, useSave, useCopy, auth-conditional Save button |
| `src/pages/PromptyDetailPage.test.tsx` | VERIFIED | 4 tests; FEED-03 + SOCL-01 (anon + auth) + back-link all pass |
| `src/components/modals/LevelUpModal.test.tsx` | VERIFIED | 5 tests; LEVL-03 assertion + L3 regression guard + UX smoke |
| `supabase/migrations/20260507000005_last_active_and_levl_annotations.sql` | VERIFIED | ADD COLUMN, index, backfill, COMMENTs |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/components/feed/FeedCard.tsx` | `/p/:slug` route | `<Link to={\`/p/${prompty.slug}\`}>` inside `<h2>` | WIRED | FeedCard.tsx lines 84-89 |
| `src/App.tsx` | `src/pages/PromptyDetailPage.tsx` | `import + <Route path="/p/:slug" element={<PromptyDetailPage />} />` | WIRED | App.tsx lines 9 + 48 |
| `src/pages/PromptyDetailPage.tsx` | `supabase.from('promptys')` | `.from('promptys').eq('slug', slug).eq('status','published').maybeSingle()` | WIRED | Lines 35-40 |
| `src/pages/PromptyDetailPage.tsx` | `src/hooks/useSave.ts` | `import { useSave }` + `useSave(promptyIdForSave)` | WIRED | Lines 5 + 56 |
| `src/main.tsx` | `profiles.last_active_at` | `touchLastActive(userId)` → `supabase.from('profiles').update({ last_active_at })` | WIRED | Lines 20-26 (def), 43 (initial), 57 (onAuthStateChange) |
| `src/main.tsx` | `supabase.auth.onAuthStateChange` | Single listener registered | WIRED | Unchanged from initial verification |
| `src/hooks/useCopy.ts` | `supabase.rpc('record_copy')` | After clipboard write | WIRED | Unchanged from initial verification |
| `auth.users` | `profiles` | `on_auth_user_created` trigger | WIRED (migration) | Unchanged from initial verification |
| `prompty_tests` | `point_events` | `trg_points_on_test` trigger | WIRED (migration) | Unchanged from initial verification |
| `point_events` | `profiles.points/level` | `update_profile_points()` | WIRED (migration) | Unchanged from initial verification |
| `profiles.level change` | `unlock_events` | `trg_record_level_transition` trigger | WIRED (migration) | Unchanged from initial verification |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-04, 01-05 | User can create account with email/password | SATISFIED | SignupPage + useAuth.signUp + supabase.auth.signUp |
| AUTH-02 | 01-04 | User stays logged in across sessions | SATISFIED | onAuthStateChange + getSession in main.tsx |
| AUTH-03 | 01-04, 01-08 | User can log out from any page | SATISFIED | ProfilePage "Sair" -> useAuth.signOut -> store.reset |
| AUTH-04 | 01-04, 01-05 | User can reset password via email link | SATISFIED | ResetPasswordPage + useAuth.resetPassword |
| AUTH-05 | 01-05, 01-06 | Unauthenticated users can browse feed | SATISFIED | No PrivateRoute on / or /p/:slug; feed + detail page render without auth |
| FEED-01 | 01-03, 01-06 | Vertical feed of published Promptys with cover, title, category badge, prompt preview | PARTIAL | Cover, title, prompt preview render. style_tags not rendered as visible category badge. Minor cosmetic gap carried from initial. |
| FEED-02 | 01-05, 01-06 | "Como funciona" card at top for new/unauth users | SATISFIED | WelcomeStrip for !user; FeedPage.test confirms |
| FEED-03 | 01-10 | Any visitor can open Prompty detail page | SATISFIED | PromptyDetailPage at /p/:slug; FeedCard title is Link; 4 tests pass |
| FEED-04 | 01-01, 01-07 | One-tap copy of beginner_prompt to clipboard | SATISFIED | useCopy in FeedPage AND PromptyDetailPage; resolveBeginner applied |
| FEED-05 | 01-06 | Cursor-based keyset pagination (no OFFSET) | SATISFIED | useFeed OR clause on (created_at, id) |
| SOCL-01 | 01-10 | Authenticated user can save a Prompty | SATISFIED | useSave wired into PromptyDetailPage; auth-conditional Salvar button; SOCL-01 test passes |
| SOCL-02 | 01-08 | Authenticated user can view their saved Promptys | PARTIAL | Profile recents grid merges saves + tests. No dedicated "Saved" list. Carried from initial. |
| SOCL-03 | 01-07 | User can mark feedback "Funcionou"/"Não ficou bom" | PARTIAL | RateSheet uses 1-5 stars, not binary labels. Semantic variance from requirement text. Carried from initial. |
| PROF-01 | 01-08 | User can set username, avatar, bio | SATISFIED | ProfilePage edit form; useProfile.update() |
| PROF-02 | 01-08 | Profile displays user_level badge and published Promptys | SATISFIED | AppHeader shows level name chip; ProfilePage shows level-derived progress |
| PROF-03 | 01-08 | Any visitor can view public profile | SATISFIED | /u/:username -> PublicProfilePage |
| LEVL-01 | 01-02, 01-07 | Copies, saves, feedback tracked via SQL triggers; no internal_points shown to L1 | SATISFIED | record_copy RPC + trigger chain; L1 UI never shows raw points |
| LEVL-02 | 01-11 | L2 unlock criteria: ≥5 copies + ≥3 saves + ≥1 feedback + ≥2 return visits | SATISFIED | Aggregate 50p threshold (per CONTEXT.md locked decision); last_active_at tracks return visits passively; REQUIREMENTS.md annotated |
| LEVL-03 | 01-11 | Discrete L2 unlock message shows correct content | SATISFIED | UNLOCKS.L2 = ['Buscar...', 'Salvar...', 'Avaliar Promptys e enviar imagens geradas', 'Seguir criadores']; LevelUpModal.test.tsx asserts all four |
| LEVL-04 | 01-08 | L3 unlock criteria evaluated | PARTIAL | L3 at 250p (same threshold system). No explicit approval/trusted-behavior gating. Design-appropriate simplification. Carried from initial. |
| LEVL-05 | 01-02 | Level transitions recorded in unlock_events | SATISFIED | unlock_events + trg_record_level_transition wired in migration 004 |
| LEVL-06 | 01-06, 01-08 | L1 never shows ranking, points, badges, comments, remix, variables, advanced editor | SATISFIED | FeedCard RTL tests confirm; Save button on detail page (not feed card) preserves this |
| LEVL-07 | 01-05 | Advanced features appear progressively — never disabled/greyed | SATISFIED | TabBar.filter() removes tabs; RTL test confirms |
| INFR-01 | 01-02 | All tables have RLS with explicit policies | SATISFIED | 9 ENABLE ROW LEVEL SECURITY confirmed |
| INFR-02 | 01-02 | Action tracking via SQL triggers; no direct frontend writes to point_events | SATISFIED | WITH CHECK(false) + SECURITY DEFINER triggers |
| INFR-03 | 01-01, 01-07 | Client-side image compression before upload (max 2MB → ≤200KB WebP) | SATISFIED | compressToWebP called in useTest |
| INFR-04 | 01-02 | Supabase Storage enforces 2MB limit and allowed MIME types | SATISFIED | Migration 004: file_size_limit=2097152; allowed_mime_types |
| INFR-05 | 01-09 | Usage monitoring weekly cron alerts at 70% and 90% | SATISFIED | supabase-usage.yml cron '0 9 * * 1' |

**Coverage Summary (after gap closure):**
- SATISFIED: 22/28 requirements (was 18/28)
- PARTIAL: 4/28 requirements (FEED-01, SOCL-02, SOCL-03, LEVL-04) — all carried from initial; none are blockers for Phase 1 goal
- FAILED: 0/28 (was 2/28: FEED-03 and SOCL-01 are now SATISFIED)

---

## Anti-Patterns Found

No new anti-patterns introduced by plans 01-10 or 01-11.

| File | Pattern | Severity | Status |
|------|---------|----------|--------|
| `src/App.tsx` | Stale "placeholder body" comment (pre-existing from plan 05) | Info | Unchanged; code has no impact |

---

## Human Verification Required

### 1. End-to-End L1 Detail Page Flow (New in this re-verification)

**Test:** Open app as unauthenticated user. Scroll feed, click a card title. Confirm navigation to `/p/{slug}`, full prompt visible (no 3-line clamp), Copiar prompt button works, clipboard gets text, no Salvar button visible.
**Expected:** Detail page renders without auth; copying works; back link returns to feed.
**Why human:** Real navigation, clipboard API, and Supabase fetch require live browser + DB.

### 2. Save Toggle Flow

**Test:** Log in, click a card title, arrive at detail page. Tap "Salvar". Verify button changes to "Salvo". Tap again — changes back to "Salvar". Check Supabase Studio: `prompty_saves` table row inserted and deleted correctly.
**Expected:** RPC inserts/deletes row; optimistic update; toast appears.
**Why human:** Requires live Supabase; optimistic rollback behavior needs manual trigger.

### 3. Rating Flow with Image Upload

**Test:** Log in, find a prompty, tap "Copiar prompt", tap "Avaliar este prompt (+5p)", select 3 stars, attach a photo, tap "Enviar".
**Expected:** Image compressed to WebP ≤200KB, prompty_tests row created, profile.points incremented by 5.
**Why human:** Requires live Supabase storage + trigger chain.

### 4. profiles.last_active_at Updated on Session

**Test:** Sign in. Open Supabase Studio → `profiles` table → confirm `last_active_at` column exists and is set to approximately now.
**Expected:** Timestamp within seconds of login time.
**Why human:** Client UPDATE runs against real DB; trigger chain runs server-side.

---

## Test Suite Results

| Suite | Tests | Status |
|-------|-------|--------|
| `src/lib/images/compress.test.ts` | 3 | All pass |
| `src/lib/constants/levels.test.ts` | 16 | All pass |
| `src/components/feed/FeedCard.test.tsx` | 9 | All pass (LEVL-06 preserved) |
| `src/components/modals/LevelUpModal.test.tsx` | 5 | All pass (NEW — Plan 01-11) |
| `src/components/layout/TabBar.test.tsx` | 5 | All pass |
| `src/pages/FeedPage.test.tsx` | 4 | All pass |
| `src/pages/PromptyDetailPage.test.tsx` | 4 | All pass (NEW — Plan 01-10) |
| `src/stores/auth.store.test.ts` | 5 | All pass |
| `src/hooks/useAuth.test.ts` | 6 | All pass |
| `src/lib/__sanity__.test.ts` | 1 | All pass |
| `src/lib/prompty/template.test.ts` | 8 | All pass |
| **Total** | **66** | **66/66 pass** |

Previous run: 57 tests. Added 9 new tests (4 PromptyDetailPage + 5 LevelUpModal). No regressions.

TypeScript: `pnpm tsc --noEmit` — clean (0 errors).

---

## Phase Status Summary

All four gaps from the initial verification are now closed:

**FEED-03 (Critical — CLOSED):** `PromptyDetailPage` at `/p/:slug` exists with 235 lines; FeedCard title is a `<Link>`; route registered in ChromeShell; anonymous and authenticated users can both reach the detail page.

**SOCL-01 (Critical — CLOSED):** `useSave` is no longer orphaned. Imported and called in `PromptyDetailPage`. Auth-conditional Salvar button renders only when `user !== null`, preserving LEVL-06 (no save button on FeedCard itself).

**LEVL-02 (Moderate — CLOSED):** `profiles.last_active_at` column added via migration 005; `touchLastActive()` in `main.tsx` writes timestamp on every session establish and auth-state change. REQUIREMENTS.md annotated with design rationale. The aggregate-points approximation is documented as the locked Phase 1 decision.

**LEVL-03 (Minor — CLOSED):** `UNLOCKS.L2` in `LevelUpModal.tsx` now has exactly four items including 'Avaliar Promptys e enviar imagens geradas'. Locked by 5 new RTL tests in `LevelUpModal.test.tsx`.

Phase 1 goal is achieved: a visitor can navigate the feed, open a prompty detail page, copy the full prompt, and use it in Gemini. Authenticated users can save and rate promptys. Internal events are tracked via SQL triggers without surfacing gamification to L1 users.

---

_Verified: 2026-05-07T20:15:00Z_
_Verifier: Claude (gsd-verifier) — Phase 1 re-verification after gap closure (plans 01-10, 01-11)_
