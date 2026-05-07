# Requirements: Promptys

**Defined:** 2026-05-06
**Core Value:** Um Prompty é mais que texto — é um template versionado com variáveis, testes reais e ranking comunitário que prova quais prompts funcionam em diferentes modelos de IA.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across browser sessions
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: Unauthenticated users can browse feed and view Prompty detail pages

### Profiles

- [ ] **PROF-01**: User can set display name, avatar, and bio on their profile
- [ ] **PROF-02**: User can view their own published Promptys on their profile page
- [ ] **PROF-03**: User can view other users' public profiles and their published Promptys
- [ ] **PROF-04**: User profile shows total points and current level

### Prompty Creation

- [ ] **CREAT-01**: User can create a Prompty with title, description, template text using `{{variable}}` syntax, and negative prompt
- [ ] **CREAT-02**: User can define typed input variables for a Prompty (types: text, textarea, enum, number, boolean, image, color, ratio, seed) via `inputs_schema`
- [ ] **CREAT-03**: User can set model targets (Midjourney, Flux, Stable Diffusion, DALL-E, etc.) and difficulty level (beginner/intermediate/advanced) on a Prompty
- [ ] **CREAT-04**: User can add style tags to a Prompty
- [ ] **CREAT-05**: User can upload a cover image for a Prompty
- [ ] **CREAT-06**: User can edit their own Promptys; each save auto-creates a version entry
- [ ] **CREAT-07**: User can set Prompty visibility to Published (public + remixable) or Unlisted (link-only)
- [ ] **CREAT-08**: User can view full version history of their own Prompty

### Prompty Detail and Testing

- [ ] **TEST-01**: Any visitor can view a Prompty detail page showing template, variables, negative prompt, model targets, examples, and ratings
- [ ] **TEST-02**: Authenticated user can fill in Prompty variables via an interactive form and see the resolved final prompt in real time
- [ ] **TEST-03**: Authenticated user can upload a result image (compressed client-side) and submit it as a test result with rating and notes
- [ ] **TEST-04**: Any visitor can browse submitted test results for a Prompty
- [ ] **TEST-05**: User can copy the resolved prompt to clipboard with one click

### Social Feed

- [ ] **FEED-01**: Any visitor can browse the public feed ordered by Latest (newest first)
- [ ] **FEED-02**: Any visitor can browse the public feed ordered by Top (most likes)
- [ ] **FEED-03**: Feed cards display cover image, title, author, model tags, difficulty, like count, test count, and average rating
- [ ] **FEED-04**: User can filter feed by model, difficulty, and style tags
- [ ] **FEED-05**: Feed uses keyset (cursor-based) pagination — no OFFSET
- [ ] **FEED-06**: User can search Promptys by keyword across title, description, and tags

### Social Interactions

- [ ] **SOCL-01**: Authenticated user can like a Prompty
- [ ] **SOCL-02**: Authenticated user can save (bookmark) a Prompty to their collection
- [ ] **SOCL-03**: Authenticated user can view their saved Promptys
- [ ] **SOCL-04**: Authenticated user can comment on a Prompty
- [ ] **SOCL-05**: Authenticated user can delete their own comments

### Gamification

- [ ] **GAME-01**: System awards points via SQL triggers for: publishing a Prompty (+50), submitting a test result (+15), receiving a like on own Prompty (+3), leaving a rating (+10), posting a comment marked helpful (+10)
- [ ] **GAME-02**: Points are recorded in an immutable `point_events` table — no direct frontend writes
- [ ] **GAME-03**: User's total points and level are displayed on their profile and in the feed card author section
- [ ] **GAME-04**: System automatically assigns level based on total points (7 levels: Curioso Visual → Hall of Promptys)
- [ ] **GAME-05**: Point events are idempotent — duplicate actions do not award duplicate points

### Moderation

- [ ] **MODR-01**: Authenticated user can report a Prompty or comment for review
- [ ] **MODR-02**: Admin can change Prompty status (published → flagged → hidden → removed)
- [ ] **MODR-03**: Flagged or removed Promptys are not visible in public feed or via direct URL for non-admins
- [ ] **MODR-04**: Content with prohibited material (real person without consent, deepfake, exploitation prompts) is blocked

### Infrastructure and Security

- [ ] **INFR-01**: All database tables have Row Level Security enabled with explicit policies
- [ ] **INFR-02**: `point_events` table has no INSERT/UPDATE/DELETE policies for client roles — only triggers write to it
- [ ] **INFR-03**: Client-side image compression applied before upload (max 2 MB input → target ≤200 KB WebP output)
- [ ] **INFR-04**: Supabase Storage enforces file size limit (2 MB) and allowed MIME types
- [ ] **INFR-05**: Usage monitoring cron runs weekly; alerts at 70% and 90% of free tier limits (storage, bandwidth, connections)

## v2 Requirements

### Remix

- **REMIX-01**: Authenticated user can remix a Prompty, creating a new attributed copy with original credit preserved
- **REMIX-02**: Prompty detail page shows remix lineage (parent and children Promptys)
- **REMIX-03**: Original author earns points (+25) when their Prompty is remixed

### Multi-Dimensional Ratings

- **RATE-01**: Authenticated user can rate a Prompty across dimensions: visual quality, prompt accuracy, reproducibility, originality
- **RATE-02**: Prompty detail page shows aggregated dimensional rating profile
- **RATE-03**: Feed supports ordering by multi-dimensional Bayesian average score

### Social Graph

- **SOC2-01**: Authenticated user can follow other users
- **SOC2-02**: Feed includes a "Following" tab showing only Promptys from followed users
- **SOC2-03**: User profile shows follower and following counts

### Realtime Notifications

- **NOTF-01**: Authenticated user receives real-time notifications for likes, comments, and test results on their Promptys
- **NOTF-02**: Notification badge in navigation updates without page refresh
- **NOTF-03**: User can view notification history

### Gamification Display

- **GAME2-01**: User profile displays earned badges (Prompt Crafter, Visual Tester, Sharp Reviewer, Remix Alchemist, Style Architect, Community Spark, Model Whisperer, Hall of Promptys)
- **GAME2-02**: Weekly leaderboard shows top contributors by points

### Trending Feed

- **FEED2-01**: Feed includes a "Trending" tab using hot-score algorithm (decay-weighted with newcomer boost)
- **FEED2-02**: Hot score pre-computed via materialized view refreshed every 5 minutes

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-app image generation (MVP) | Paid API cost unpredictable; massive scope increase; deferred to v3 with credits system |
| OAuth (Google/GitHub) login | Email/password sufficient to validate product; reduces v1 scope |
| Automatic Facebook group import | Copyright risk; platform ToS violation; manual import with attribution only |
| Real-time collaborative editing | OT/CRDT complexity not justified; remix + comments serve async collaboration needs |
| AI-powered prompt improvement | LLM API cost per request; creates vendor dependency; devalues community expertise |
| DM / private messaging | High moderation burden; harassment vector; not core platform value |
| NFT minting | Market collapsed; legally grey; alienates mainstream users |
| Paid prompt sales (PromptBase model) | Paywalls fragment community; free library must remain intact |
| Mobile native app | Web-first; responsive design + PWA serves mobile in v1 |
| pgvector semantic search | Requires vector extension + embedding pipeline; v3 scope |
| Public API | After platform stability is proven; v3 scope |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Pending |
| INFR-04 | Phase 1 | Pending |
| INFR-05 | Phase 1 | Pending |
| GAME-01 | Phase 1 | Pending |
| GAME-02 | Phase 1 | Pending |
| GAME-05 | Phase 1 | Pending |
| PROF-01 | Phase 1 | Pending |
| PROF-02 | Phase 1 | Pending |
| PROF-03 | Phase 1 | Pending |
| PROF-04 | Phase 1 | Pending |
| CREAT-01 | Phase 2 | Pending |
| CREAT-02 | Phase 2 | Pending |
| CREAT-03 | Phase 2 | Pending |
| CREAT-04 | Phase 2 | Pending |
| CREAT-05 | Phase 2 | Pending |
| CREAT-06 | Phase 2 | Pending |
| CREAT-07 | Phase 2 | Pending |
| CREAT-08 | Phase 2 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| TEST-05 | Phase 2 | Pending |
| FEED-01 | Phase 3 | Pending |
| FEED-02 | Phase 3 | Pending |
| FEED-03 | Phase 3 | Pending |
| FEED-04 | Phase 3 | Pending |
| FEED-05 | Phase 3 | Pending |
| FEED-06 | Phase 3 | Pending |
| SOCL-01 | Phase 4 | Pending |
| SOCL-02 | Phase 4 | Pending |
| SOCL-03 | Phase 4 | Pending |
| SOCL-04 | Phase 4 | Pending |
| SOCL-05 | Phase 4 | Pending |
| GAME-03 | Phase 4 | Pending |
| GAME-04 | Phase 4 | Pending |
| MODR-01 | Phase 4 | Pending |
| MODR-02 | Phase 4 | Pending |
| MODR-03 | Phase 4 | Pending |
| MODR-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-06*
*Last updated: 2026-05-06 after initial definition*
