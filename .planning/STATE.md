---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Phase 6 context updated (OpenAI provider, replan required)
last_updated: "2026-06-21T22:01:32.522Z"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-31)

**Core value:** O usuário copia um prompt pronto, gera uma imagem, e volta para contar como ficou.
**Current focus:** Phase 06 — geracao-imagem

## Current Position

Phase: 06 (geracao-imagem) — EXECUTING
Plan: 2 of 3

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01 P04 | 5 | 3 tasks | 10 files |
| Phase 01 P01 | 5 | 3 tasks | 13 files |
| Phase 01-foundation P03 | 7min | 2 tasks | 5 files |
| Phase 01-foundation P02 | 20min | 3 tasks | 2 files |
| Phase 01 P05 | 125min | 3 tasks | 15 files |
| Phase 01-foundation P06 | 20min | 3 tasks | 9 files |
| Phase 01 P08 | 20 | 3 tasks | 8 files |
| Phase 01-foundation P07 | 20min | 3 tasks | 4 files |
| Phase 01 P09 | 88min | 3 tasks | 5 files |
| Phase 01 P11 | 8min | 2 tasks | 6 files |
| Phase 01 P10 | 4 | 2 tasks | 5 files |
| Phase 02 P01 | 7min | 4 tasks | 16 files |
| Phase 02 P02 | 2min | 3 tasks | 5 files |
| Phase 02 P03 | 4min | 2 tasks | 7 files |
| Phase 02 P05 | 5min | 2 tasks | 6 files |
| Phase 02 P04 | 4min | 2 tasks | 7 files |
| Phase 02 P06 | 4min | 3 tasks | 6 files |
| Phase 02 P07 | 4min | 4 tasks | 6 files |
| Phase 03 P04 | 9min | 3 tasks | 4 files |
| Phase 03 P03 | 129 | 3 tasks | 5 files |
| Phase 03 P05 | 98min | 3 tasks | 8 files |
| Phase 03 P06 | 30min | 3 tasks | 5 files |
| Phase 03.1-milestone-gap-closure P01 | 4min | 3 tasks | 9 files |
| Phase 03.1-milestone-gap-closure P02 | 4min | 2 tasks | 6 files |
| Phase 04-ledger-creditos-bonus P01 | 3 | 2 tasks | 7 files |
| Phase 04-ledger-creditos-bonus P02 | 5 | 2 tasks | 1 files |
| Phase 04-ledger-creditos-bonus P03 | 5min | 2 tasks | 9 files |
| Phase 05 P02 | 15min | 2 tasks | 2 files |
| Phase 06-geracao-imagem P01 | 15 | 3 tasks | 7 files |
| Phase 06-geracao-imagem P02 | 8min | 2 tasks | 6 files |
| Phase 06-geracao-imagem P03 | 20min | 3 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Gamification `point_events` table + SQL triggers MUST be in Phase 1 — retroactive migration is painful and this table is append-only by design
- Phase 1: RLS on all tables from day one — no permissive defaults to fix later
- [Phase 01]: Storage bucket SQL added to migration 004 (not migration 005) — simpler, atomic, avoids unnecessary 5th file
- [Phase 01]: Auth listener registered in main.tsx IIFE — avoids double-registration in React StrictMode
- [Phase 01]: database.types.ts promoted to typed placeholder covering all Phase 1 tables before gen:types is run
- [Phase 01]: QueryClient defaults: staleTime=60s, gcTime=5min, refetchOnWindowFocus=false for Tauri app
- [Phase 01]: vitest.config.ts separate from vite.config.ts — Vitest reads its own config first, Tauri server config stays untouched
- [Phase 01]: compressToWebP uses 50% quality fallback (not 70%) to reliably stay under 200KB cap with the mock formula
- [Phase 01]: database.types.ts expanded from Record placeholder to typed interface — enables type-check without gen:types
- [Phase 01-foundation]: profiles INSERT added explicitly to seed (not relying on trigger) — trigger only fires on INSERT not when auth.users row pre-exists via ON CONFLICT DO NOTHING
- [Phase 01-foundation]: Seed applied via psql + DATABASE_URL (not supabase db execute) — CLI access token unavailable; psql is more reliable for CI scenarios
- [Phase 01-foundation]: verify-seed.ts kept permanently as reusable smoke check, not deleted after first run
- [Phase 01-foundation]: Migration repair used (supabase migration repair --status applied) to reconcile CLI history when psql-applied migrations bypass CLI tracking
- [Phase 01]: Icon PATHS uses React.ReactElement (not JSX.Element) to avoid namespace error with Vite JSX transform
- [Phase 01]: TabBar uses LEVEL_ORDER index comparison — locked tabs are absent from DOM (not greyed/disabled), enforcing LEVL-07
- [Phase 01]: theme.store default is light — matches index.css theme-light class applied on html element
- [Phase 01]: App.tsx redirects / to /onboarding inline via hasOnboarded() check before Routes render
- [Phase 01-foundation]: Cursor pagination uses .or(created_at.lt + and(created_at.eq,id.lt)) — no OFFSET (FEED-05)
- [Phase 01-foundation]: FeedCard action row limited to Curtir + Copiar only — LEVL-06 enforced by 9 RTL tests
- [Phase 01]: usedCount (Você usou X Promptys) uses recents.length — union of saves+tests deduped by prompty_id, capped at 9; friendly approximation avoiding extra DB query
- [Phase 01]: FeedCardWithLike wrapper scopes useLike per card — isolates React re-renders to the individual card that changed like state
- [Phase 01]: LevelUpModal fires on lvl.id change via useLevelStore.hasShown() — persisted to localStorage so modal never re-triggers after dismiss
- [Phase 01-foundation]: [Phase 01-07]: Tauri clipboard plugin loaded via Function constructor dynamic import — avoids TS resolution error for optional plugin not yet installed (deferred to plan-09)
- [Phase 01-foundation]: [Phase 01-07]: record_copy RPC is best-effort — errors swallowed after clipboard write succeeds so user feedback is never blocked
- [Phase 01-foundation]: [Phase 01-07]: Image upload failure non-fatal — null image_url allows prompty_tests insert to proceed without image
- [Phase 01]: TweaksPanel level override uses inline fallback {id: levelId, min: 0} instead of LEVELS[0] to avoid TS18048 on const array element access
- [Phase 01]: GitHub usage monitor dedup: listForRepo with open state + supabase-usage label before creating issue — prevents duplicate critical alerts
- [Phase 01]: supabase-usage.yml uses pnpm exec tsx (not npx tsx) to match project toolchain
- [Phase 01]: profiles.last_active_at is passive timestamp only — no points awarded, not in point_events trigger chain; provides DB surface for return-visit tracking (LEVL-02 approximation)
- [Phase 01]: touchLastActive is fire-and-forget (void + try/catch swallowed) — transient network errors never block auth flow or UI rendering
- [Phase 01]: SQL COMMENT ON FUNCTION/COLUMN used for LEVL-02 design documentation — survives schema dumps, visible in Supabase Studio
- [Phase 01]: Save button placed on PromptyDetailPage, not FeedCard, to preserve LEVL-06 test (FeedCard asserts no save/bookmark button)
- [Phase 01]: Plain <button> used for Save action on detail page because SecondaryButton does not accept aria-label — stateful aria-label required for accessibility
- [Phase 01]: FeedCard.test.tsx wrapped in MemoryRouter after Link addition — required whenever FeedCard renders Link children
- [Phase 02]: FTS column uses trigger (not GENERATED ALWAYS AS) — array_to_string(TEXT[], TEXT) is STABLE in PG17, forbidden in generated column expressions; trigger achieves identical semantics
- [Phase 02]: FTS config uses 'simple'::regconfig — universally available; 'portuguese' config available on Supabase hosted but deferred; upgrade via future migration if needed
- [Phase 02]: Wave 0 test scaffolds use anchor assertion (expect(true).toBe(true)) — Vite static module resolution fails dynamic import of non-existent modules even in catch() blocks (unlike Jest/Node)
- [Phase 02]: Supabase CLI gen types stdout appends version notice — strip trailing lines after `} as const` when piping to file
- [Phase 02]: TABS array now 6 entries; L2=4 tabs (Feed/Salvos/Buscar/Perfil), L3=6 tabs
- [Phase 02]: Placeholder pages inline in App.tsx (SavedPagePlaceholder/SearchPagePlaceholder) — deleted by owning plans 02-03/02-04
- [Phase 02]: CATEGORIES/MODELS exported as const tuples for type inference; DB-driven categories deferred to future phase
- [Phase 02]: moreHorizontal icon uses filled circles (fill=currentColor, stroke=none) — strokeWidth on 1.2px circles is invisible
- [Phase 02]: useSearch disabled (enabled=false) when query empty and no filters — prevents unnecessary fetches on idle state
- [Phase 02]: textSearch uses {type:websearch,config:simple} — websearch handles partial words; simple config matches migration 006
- [Phase 02]: Debounce uses useRef timer (no library) — 300ms, clearTimeout on each keystroke, immediate reset on clear
- [Phase 02]: OptionsSheet test uses not.toContain('1px solid') for last-option border — JSDOM expands borderBottom:'none' to empty string, not 'none'
- [Phase 02]: useCommunityResults filter uses plain callback + 'as string' cast — TS2677 prevents type predicate when profiles union is wider than intersection
- [Phase 02]: SavedCard uses backgroundImage (not background shorthand) for URL images — JSDOM expands background shorthand to empty string, backgroundImage is directly assertable in tests
- [Phase 02]: ratings = all prompty_tests; results = subset where image_url non-empty — two derivations from a single query avoiding a third parallel request
- [Phase 02]: SavedPage handleChipChange ignores null to enforce always-one-active UX (FilterChipBar emits null on toggle-off of active chip)
- [Phase 02]: ReportSheet destructive button uses raw <button> styled inline (#FF3B6B) — PrimaryButton has no style prop, avoids modifying shared component
- [Phase 02]: isL2 uses LEVEL_ORDER.indexOf comparison (not id==='L2') — correctly treats L3/L4/L5 as qualifying
- [Phase 02]: PromptyDetailPage test mock extended with mockProfile alongside mockUser — enables per-test level simulation without Zustand setState on mocked store
- [Phase 02]: CommunityResults absent (returns null) when results.length===0 — no empty state per UI-SPEC
- [Phase 02]: FullImageModal backdrop-click uses e.target===e.currentTarget guard — prevents close when clicking image/attribution
- [Phase 02]: PromptyDetailPage test mock extended with .not() and .or() chain methods — useCommunityResults uses .not('image_url','is',null)
- [Phase 03]: [Phase 03-02]: generateSlug uses Math.random().toString(36).slice(2,8) suffix — no nanoid dependency, stays within project toolchain
- [Phase 03]: [Phase 03-02]: Cover upload to prompty-covers uses upsert:true (creator may re-upload cover for same slug); prompty-results keeps upsert:false (unique path per test via timestamp)
- [Phase 03]: [Phase 03-02]: prompty_versions insert is best-effort — publish() succeeds even if version snapshot fails; SQL trigger awards 50p regardless
- [Phase 03]: [Phase 03-02]: useMyPromptys uses useEffect+useState (not useInfiniteQuery) — creator has tens of promptys at MVP scale; one-shot fetch + Promise.all is appropriate
- [Phase 03]: MyPromptysGrid gate uses lvl.id comparison (L3/L4/L5 pass) — same pattern as TabBar
- [Phase 03]: ProfilePage MyPromptysGrid integration uses content anchors (aria-label + button text) not line numbers
- [Phase 03]: [Phase 03-03]: handlePublish defined in CreateWizard and referenced via false-branch render to satisfy TypeScript strict unused-variable check — Plan 03-05 will wire it to the publish button
- [Phase 03]: [Phase 03-03]: WizardStep1Basics uses role=radio on buttons inside role=radiogroup — ARIA 1.1 pattern enables aria-checked for chip-style selectors without native input type=radio
- [Phase 03]: exactOptionalPropertyTypes bypass: use 'undefined as unknown as T' for Partial<T> fields that must be cleared — avoids illegal undefined assignment while signaling field erasure
- [Phase 03]: handlePublish(overrides?) override pattern prevents stale closure: skip buttons pass cleared values directly as override rather than patching state and reading stale data
- [Phase 03]: fireEvent.change instead of userEvent.type for {{variable}} strings — userEvent treats '{' as keyboard modifier, breaking double-brace template input in tests
- [Phase 03]: [Phase 03-06]: TabBar sparkle uses isCriar conditional inside visible.map — keeps NavLink role=link while applying gradient pill styling; aria-label="Criar Prompty" satisfies WCAG 2.4.4
- [Phase 03]: [Phase 03-06]: isL3OrAbove explicit id comparison (L3||L4||L5) — same pattern as MyPromptysGrid; levelOf() called with profile?.points ?? 0 so anonymous=L1=button hidden
- [Phase 03.1-01]: refetchProfile lives in AuthStore for consistency with setUser/setProfile; fire-and-forget from useCopy and useTest success paths
- [Phase 03.1-01]: PrivateRoute redirects level-insufficient users to / (root) not /feed since FeedPage is mounted at path /
- [Phase 03.1-01]: MODR-03 filter chained as .eq('promptys.status', 'published') after .order() on both useSaved queries using PostgREST join-column dot notation
- [Phase 03.1-02]: NEXT_LEVEL_COPY defined as module-level Partial<Record> in ProfilePage — static data, no constants import needed
- [Phase 03.1-02]: WizardStep2Prompt variable hint is informational-only (no Step 4 link) — keeps Step 2 lean per CONTEXT.md decision
- [Phase 03.1-02]: extractVariables canonical home is template.ts — imported by both Step2 and Step4; no local duplicates
- [Roadmap v0.3.0]: credit_events INSERT blocked via WITH CHECK (false) + BEFORE UPDATE trigger guard on profiles.credits — two complementary layers, not either/or
- [Roadmap v0.3.0]: generations table + prompty-generations bucket created in Phase 4 migration (FK ready early); Edge Function that writes to it arrives in Phase 6
- [Roadmap v0.3.0]: spend_credit() atomicity requires both SELECT FOR UPDATE AND pg_advisory_xact_lock — advisory lock prevents race condition when two sessions begin transaction simultaneously before the row lock is acquired
- [Roadmap v0.3.0]: Phase 6 blocked on provider decision + secrets setup; Phases 4–5 fully provider-independent and can proceed immediately
- [Roadmap v0.3.0]: CORS headers must use @supabase/supabase-js/cors import (v2.95.0+) — 2025 Supabase bug truncates manual Access-Control-Allow-Headers to first 4 entries in OPTIONS response
- [Phase 04-01]: cred03_double_spend.sh uses TRUE two-session concurrency (two backgrounded psql processes + wait) — not sequential, per 04-CONTEXT.md explicit requirement
- [Phase 04-01]: RTL Wave 0 stubs use no imports of non-existent modules — Vite static module resolution fails even in catch(), consistent with Phase 02 decision
- [Phase 04-02]: credit_events UNIQUE (user_id, event_type, ref_id) plus partial index credit_events_signup_once WHERE event_type='signup_bonus' — both coexist, partial index handles NULL ref_id case that standard UNIQUE misses
- [Phase 04-02]: guard_profiles_financial_columns BEFORE UPDATE trigger uses current_user='authenticated' (not session_user) — PostgREST SET LOCAL role changes current_user; SECURITY DEFINER functions run as postgres and bypass the guard
- [Phase 04-02]: spend_credit requires both pg_advisory_xact_lock AND SELECT FOR UPDATE — advisory lock serializes sessions starting concurrently; FOR UPDATE blocks concurrent update_profile_credits
- [Phase 04-03]: database.types.ts hand-edited (not gen:types) in sandbox — orchestrator must regenerate after DB is live
- [Phase 04-03]: CreditHistorySheet as bottom sheet not dedicated route — consistent with OptionsSheet/ReportSheet pattern
- [Phase 04-03]: useCreditHistory has no .eq(user_id) filter — RLS auth.uid() policy scopes rows automatically
- [Phase 05]: earn scripts seed via auth.users (not profiles directly) so handle_new_user fires and FK-dependent inserts (unlock_events, promptys, prompty_tests) succeed
- [Phase 05]: earn04 asserts no credit-typed event_type rows in point_events (not count=0) — award_points_on_publish/award_points_on_test legitimately fire in the same transaction
- [Phase 05]: Migration filename changed from 20260531000009 to 20260621000010 — sequence 009 taken by earlier levelup_ai_credit migration
- [Phase 05]: Drop trg_award_credit_on_level_up on profiles (migration 009) before redefining award_credit_on_level_up for unlock_events AFTER INSERT
- [Phase 06-geracao-imagem]: [Phase 06-01]: app_settings RLS allows SELECT to anon+authenticated; INSERT/UPDATE blocked via WITH CHECK (false) — Edge Function uses service-role key to write
- [Phase 06-geracao-imagem]: [Phase 06-01]: Wave 0 test scaffolds use anchor + it.todo pattern (no static import of useGenerate.ts) — consistent with Phase 02 decision
- [Phase 06-02]: Dual-client pattern in Edge Function: userClient for spend_credit/refund_credit (auth.uid() resolves), adminClient for storage + generations INSERT only — service-role key never reaches src/
- [Phase 06-02]: DAILY_CAP=5 per user/day; ACTIVE_PROVIDER=mock default; generationId pre-minted before spend for complete audit trail; single try/catch guarantees refund on ALL post-spend failure paths (GEN-04)
- [Phase 06-02]: Prompt sanitization (≤1500 chars + injection denylist) runs before spend_credit to avoid wasting credits on rejected input
- [Phase 06-geracao-imagem]: useGenerate uses inFlight useRef (not state) for GEN-03 double-invoke guard — synchronous early-return
- [Phase 06-geracao-imagem]: Edge Function exception documented in both CLAUDE.md and AGENTS.md same commit per rule-sync clause

### Pending Todos

- Provider decision (Gemini/OpenAI/Replicate) needed before Phase 6 starts
- Set billing alert on chosen provider before Phase 6 deploy

### Blockers/Concerns

- Phase 6 blocked on: (1) provider choice, (2) `supabase secrets set ACTIVE_PROVIDER=... GEMINI_API_KEY=...`
- Free tier storage quota (1 GB total): generated images must be WebP < 200KB; not persisted unless submitted as community result

## Session Continuity

Last session: 2026-06-21T22:01:32.519Z
Stopped at: Phase 6 context updated (OpenAI provider, replan required)
Resume file: .planning/phases/06-geracao-imagem/06-CONTEXT.md
