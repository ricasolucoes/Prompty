# Roadmap: Promptys

## Overview

Promptys ships in four phases. Phase 1 lays the complete data and security foundation — auth, profiles, RLS on every table, and the immutable gamification event store that every later social interaction depends on. Phase 2 delivers the core product differentiator: the parametrizable `{{variable}}` template system and the interactive fill-and-test workflow. Phase 3 opens the platform to the public with a fast, filterable, SEO-friendly feed. Phase 4 completes the social layer — likes, saves, comments, and moderation — and surfaces the gamification display that rewards contributors.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, profiles, RLS on all tables, and the gamification event infrastructure that cannot be retrofitted later
- [ ] **Phase 2: Prompty Creation and Testing** - The `{{variable}}` template system, version history, and the interactive fill-and-test workflow
- [ ] **Phase 3: Public Feed and Discovery** - SSR public feed with multiple orderings, filters, keyword search, and keyset pagination
- [ ] **Phase 4: Social Layer and Moderation** - Likes, saves, comments, moderation tooling, and gamification display on profiles and feed

## Phase Details

### Phase 1: Foundation
**Goal**: Every user can create an account, manage their profile, and the database is fully secured with gamification infrastructure in place before any social interactions are recorded
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, PROF-01, PROF-02, PROF-03, PROF-04, INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, GAME-01, GAME-02, GAME-05
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password, log in, stay logged in across sessions, log out from any page, and reset a forgotten password via email link
  2. Unauthenticated visitors can browse the site without being forced to log in
  3. User can set their display name, avatar, and bio, and view their own and other users' public profiles
  4. Every database table has RLS enabled with explicit policies; the `point_events` table rejects all client-side writes — only SQL triggers can insert rows
  5. Publishing a Prompty, submitting a test result, receiving a like, leaving a rating, and posting a helpful comment each trigger exactly one point event entry; duplicate actions produce no duplicate rows
**Plans**: 6 plans
Plans:
- [ ] 01-foundation/01-01-PLAN.md — Test scaffold (Vitest config + failing test stubs + SQL role/trigger test scripts)
- [ ] 01-foundation/01-02-PLAN.md — Supabase schema + RLS + triggers + views + generated TS types
- [ ] 01-foundation/01-03-PLAN.md — Next.js 15 + Tailwind 4 + shadcn + @supabase/ssr clients + middleware + level constants + image compression
- [ ] 01-foundation/01-04-PLAN.md — Auth pages and Server Actions (signup/login/logout/reset/callback/setup-profile)
- [ ] 01-foundation/01-05-PLAN.md — Profile pages (public SSR + dashboard + settings) + avatar upload
- [ ] 01-foundation/01-06-PLAN.md — Weekly Supabase free-tier usage monitor (GitHub Actions)

### Phase 2: Prompty Creation and Testing
**Goal**: Users can create a fully-featured Prompty with typed variables and version history, and any visitor can view, interact with, and test that Prompty
**Depends on**: Phase 1
**Requirements**: CREAT-01, CREAT-02, CREAT-03, CREAT-04, CREAT-05, CREAT-06, CREAT-07, CREAT-08, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. User can create a Prompty with title, description, `{{variable}}` template, negative prompt, model targets, difficulty, style tags, and a cover image
  2. User can define each variable's type (text, textarea, enum, number, boolean, image, color, ratio, seed) via an `inputs_schema` editor
  3. Any visitor can view a Prompty detail page with the full template, variables, negative prompt, examples, and ratings; authenticated users see an interactive form that resolves the final prompt in real time and offers one-click copy
  4. Authenticated user can upload a result image (compressed client-side) and submit it as a test result; any visitor can browse all submitted test results
  5. User can edit their own Prompty and view the full version history; each save auto-creates a version entry
**Plans**: TBD

### Phase 3: Public Feed and Discovery
**Goal**: Any visitor can find Promptys through a fast, filterable, searchable public feed that loads efficiently and is indexable by search engines
**Depends on**: Phase 2
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06
**Success Criteria** (what must be TRUE):
  1. Any visitor can browse a public feed ordered by Latest or Top (most likes); feed cards show cover image, title, author, model tags, difficulty, like count, test count, and average rating
  2. User can filter the feed by model, difficulty, and style tags, and search by keyword across title, description, and tags
  3. Feed pagination uses cursor-based keyset pagination — no OFFSET queries — and does not break on concurrent inserts
**Plans**: TBD

### Phase 4: Social Layer and Moderation
**Goal**: Authenticated users can engage with Promptys through likes, saves, and comments; gamification levels surface on profiles and feed; and a moderation system keeps the platform safe
**Depends on**: Phase 3
**Requirements**: SOCL-01, SOCL-02, SOCL-03, SOCL-04, SOCL-05, GAME-03, GAME-04, MODR-01, MODR-02, MODR-03, MODR-04
**Success Criteria** (what must be TRUE):
  1. Authenticated user can like a Prompty, save it to their collection, view their saved collection, comment on a Prompty, and delete their own comments
  2. User's total points and current level (one of 7 tiers) are visible on their profile page and in the feed card author section
  3. Authenticated user can report a Prompty or comment for review; admin can change Prompty status through published → flagged → hidden → removed; flagged and removed Promptys are invisible to non-admins in the feed and via direct URL
  4. Promptys containing prohibited content (real person without consent, deepfake, exploitation prompts) cannot be published or remain published
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Prompty Creation and Testing | 0/TBD | Not started | - |
| 3. Public Feed and Discovery | 0/TBD | Not started | - |
| 4. Social Layer and Moderation | 0/TBD | Not started | - |
