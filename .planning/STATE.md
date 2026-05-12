---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 02-02-PLAN.md
last_updated: "2026-05-12T20:44:18.531Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 24
  completed_plans: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-06)

**Core value:** Um Prompty é mais que texto — é um template versionado com variáveis, testes reais e ranking comunitário que prova quais prompts funcionam em diferentes modelos de IA.
**Current focus:** Phase 02 — l2-curador-descoberta

## Current Position

Phase: 02 (l2-curador-descoberta) — EXECUTING
Plan: 2 of 7

## Performance Metrics

**Velocity:**

- Total plans completed: 0
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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-05-12T20:44:18.528Z
Stopped at: Completed 02-02-PLAN.md
Resume file: None
