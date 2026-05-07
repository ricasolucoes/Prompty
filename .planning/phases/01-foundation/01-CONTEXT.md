# Phase 1: Foundation - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Every user can create an account, manage their profile, and the database is fully secured with gamification infrastructure in place before any social interactions are recorded.

Deliverables: Supabase schema (all 10 tables), RLS policies on every table, SQL triggers for point events, Next.js app scaffold with auth flow (signup/login/logout/password-reset), public profile pages, and usage monitoring cron.

Not in this phase: Prompty creation, feed, social interactions, or gamification UI display (points/levels shown on screen).

</domain>

<decisions>
## Implementation Decisions

### Auth Flow

- Email verification required before user can publish or interact — reduces disposable email spam
- Session persistence: 7-day rolling session with JWT refresh via `@supabase/ssr` middleware on every request
- Password requirements: Supabase defaults (8+ characters minimum) — no custom rules to keep signup frictionless
- Password reset: email link flow via Supabase Auth (standard `resetPasswordForEmail`)
- Unauthenticated visitors can browse freely — no forced login wall

### Profile Setup

- Profile setup is **deferred, not blocking** — user signs up, gets redirected to a profile setup page on first login, but can skip and browse (reduces signup abandonment)
- **username is required** to publish a Prompty; display_name, avatar, and bio are all optional at account creation
- Username format: alphanumeric + underscore + hyphen, 3–30 characters, globally unique (validated at DB level with unique constraint)
- Public profile pages are accessible to unauthenticated visitors (SSR, SEO-friendly)

### RLS and Security Architecture

- Every table has RLS enabled in `001_schema.sql` — no exceptions
- `point_events` has **no INSERT/UPDATE/DELETE policies for any client role** — only `SECURITY DEFINER` triggers can write to it; enforced via explicit `WITH CHECK (false)` policy for `authenticated` role
- Service-role key is never exposed to client code or Server Components — reserved for migrations and Edge Functions only
- Supabase Storage: separate `prompty-images` bucket with path-scoped RLS (`(storage.foldername(name))[1] = auth.uid()::text`)
- SQL role tests required as part of migration validation: test SELECT/INSERT/UPDATE/DELETE as `anon`, `authenticated-as-owner`, `authenticated-as-non-owner` for every table

### Gamification Infrastructure

- Level thresholds defined as **TypeScript constants in code** (not a DB table) — simpler, avoids extra query per profile render, thresholds rarely change
  - Level 1: 0 pts — Curioso Visual
  - Level 2: 100 pts — Aprendiz de Prompt
  - Level 3: 500 pts — Prompt Crafter
  - Level 4: 1,500 pts — Remix Alchemist
  - Level 5: 5,000 pts — Style Architect
  - Level 6: 10,000 pts — Model Whisperer
  - Level 7: 25,000 pts — Hall of Promptys
- `point_events` has `UNIQUE (user_id, event_type, reference_id)` constraint — triggers use `ON CONFLICT DO NOTHING` for idempotency
- **Point reversal on unlike/unsave**: AFTER DELETE trigger on `prompty_likes` / `prompty_saves` inserts a negative-value row into `point_events` (maintains full audit log; never deletes prior rows)
- `profiles.points` and `profiles.level` are **materialized columns** updated by triggers — never computed on read
- Point events in Phase 1 schema: `prompty_published` (+50), `test_submitted` (+15), `like_received` (+3), `rating_given` (+10), `helpful_comment` (+10), `like_reversed` (-3), `save_reversed` (-1)
  - Note: save/like events for the actor vs recipient are separate event_types

### Infrastructure Monitoring

- **GitHub Actions weekly workflow** calls Supabase Management API and sends email alert at 70% and 90% of free tier limits (storage, bandwidth, DB size, Realtime connections)
- Monitoring runs before first user is invited — not after
- Supabase pgBouncer pooled connection URL used for all app queries (not direct Postgres URL) to respect the 60-connection free tier pool

### Stack Scaffold

- Next.js 15 App Router with TypeScript
- `@supabase/ssr` for all Supabase client creation — `createServerClient` (per-request, cookie-based) for Server Components and Server Actions; `createBrowserClient` (singleton) for Client Components
- Next.js middleware calls `updateSession()` on every request to refresh JWT
- Tailwind CSS 4 + shadcn/ui for UI primitives
- All database types generated via `supabase gen types typescript` — no manual type definitions for DB entities
- Migration files: `001_schema.sql`, `002_rls.sql`, `003_triggers.sql`, `004_views.sql`

### Claude's Discretion

- Exact loading/skeleton states during auth transitions
- Error message copy for auth failures
- Avatar upload UI details (crop, preview)
- Exact middleware route matcher pattern (which paths require auth vs are public)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Vision, principles, stack decisions, key decisions log
- `.planning/REQUIREMENTS.md` — Full v1 requirements with IDs; Phase 1 requirements: AUTH-01–05, PROF-01–04, INFR-01–05, GAME-01, GAME-02, GAME-05

### Roadmap
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 criteria); phase ordering rationale

### Research
- `.planning/research/STACK.md` — Next.js 15 + @supabase/ssr specifics; warning about deprecated `@supabase/auth-helpers-nextjs`; Tailwind CSS 4 + shadcn/ui setup
- `.planning/research/ARCHITECTURE.md` — Supabase client split (server.ts vs browser.ts), project directory structure, RLS policy patterns, trigger design, Storage bucket RLS
- `.planning/research/PITFALLS.md` — RLS testing methodology (test via raw REST API as anon, not through app); point_events idempotency; free tier monitoring; Storage URL anti-patterns
- `.planning/research/SUMMARY.md` — Synthesized findings and open questions

No external ADRs or design docs — this is a greenfield project; all requirements captured in REQUIREMENTS.md and research files above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing codebase

### Established Patterns
- All patterns established in this phase become the foundation for subsequent phases
- Key patterns to establish here that downstream phases will reuse:
  - Supabase client creation (server.ts / browser.ts split)
  - Route protection pattern (middleware + layout-level auth check)
  - TypeScript database types from `supabase gen types`
  - RLS policy file structure (002_rls.sql pattern)

### Integration Points
- Phase 2 (Prompty Creation) will extend the `promptys` table and add CREAT routes — auth middleware established here must cover those routes automatically
- Phase 3 (Feed) will use the `feed_hot` materialized view seeded in `004_views.sql` — structure defined here
- Phase 4 (Social) will trigger point_events — triggers must exist in `003_triggers.sql` before Phase 4 ships

</code_context>

<specifics>
## Specific Ideas

- The product document specifies anti-spam explicitly: "Pontos não devem ser concedidos diretamente no frontend. Use triggers SQL, constraints, limites diários, validação por reputação, tabela de eventos imutáveis."
- The database schema (10 tables) is fully specified in PROJECT.md — use it as the canonical source for column names, types, constraints, and check constraints
- Brand identity is fixed: Midnight Ink #090A14, Electric Violet #7C3AED, Prompt Cyan #22D3EE — apply to auth pages and profile UI in this phase

</specifics>

<deferred>
## Deferred Ideas

- OAuth login (Google/GitHub) — explicitly out of scope; noted in REQUIREMENTS.md Out of Scope table
- Daily point limits per user — mentioned in product doc as anti-spam; not required for Phase 1 (idempotency constraint handles acute fraud; daily limits can be added as a trigger enhancement in Phase 4 when social interactions go live)
- Admin role and permissions — needed for Phase 4 moderation; schema can include an `is_admin` boolean on profiles in Phase 1, but admin UI is Phase 4 scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-05-06*
