# Requirements: Promptys

**Defined:** 2026-05-07 (pivoted from complex social network to progressive disclosure model)
**Core Value:** O usuário copia um prompt pronto, gera uma imagem no Gemini, e volta para contar como ficou.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in and stay logged in across browser sessions
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: User can reset password via email link
- [x] **AUTH-05**: Unauthenticated users can browse feed and view Prompty detail pages

### Feed — L1 (Core Experience)

- [x] **FEED-01**: Any visitor sees a vertical feed of published Promptys with cover image, title, category badge, and a preview of the beginner_prompt
- [x] **FEED-02**: Feed shows a "Como funciona" card at the top for new/unauthenticated users ("Promptys são receitas prontas para gerar imagens com IA. Toque em Copiar prompt, cole no Gemini ou outro app, depois volte aqui e conte como ficou.")
- [x] **FEED-03**: Any visitor can open a Prompty detail page showing example image, title, beginner_prompt in full, and the "Copiar prompt" button
- [x] **FEED-04**: User can copy the full beginner_prompt to clipboard with one tap — this is the primary action
- [x] **FEED-05**: Feed uses cursor-based keyset pagination — no OFFSET queries
- [x] **FEED-06**: Feed can be filtered by category and recommended_model
- [x] **FEED-07**: User can search Promptys by keyword across title, description, and tags

### Social Actions — L1

- [x] **SOCL-01**: Authenticated user can save (bookmark) a Prompty
- [x] **SOCL-02**: Authenticated user can view their saved Promptys
- [x] **SOCL-03**: Authenticated user can mark feedback: "Funcionou" or "Não ficou bom" on a Prompty

### Profiles

- [x] **PROF-01**: User can set username, avatar, and bio on their profile
- [x] **PROF-02**: User profile displays their user_level badge (L1/L2/L3) and published Promptys (for L3)
- [x] **PROF-03**: Any visitor can view a user's public profile

### Level System (Progressive Disclosure)

- [x] **LEVL-01**: System tracks user actions internally (copies, saves, feedback events) via SQL triggers; internal_points not shown to L1 users
- [x] **LEVL-02**: System evaluates L2 unlock criteria: ≥5 copies + ≥3 saves + ≥1 feedback + ≥2 return visits — _approximated by aggregate point accumulation (50p threshold) per Phase 1 CONTEXT.md decision; per-criteria gating deferred to Phase 2. Return visits tracked passively via `profiles.last_active_at` (Plan 01-11)._
- [x] **LEVL-03**: When L2 criteria are met, system shows a discrete unlock message: "Você desbloqueou o modo Curador. Agora pode salvar favoritos, avaliar promptys e enviar imagens geradas."
- [x] **LEVL-04**: System evaluates L3 unlock criteria: submitted valid result images + rated Promptys + received approval on contributions + trusted behavior
- [x] **LEVL-05**: Level transitions are recorded in unlock_events table
- [x] **LEVL-06**: L1 interface never shows ranking, points, badges, comments, remix, variables, or advanced editor
- [x] **LEVL-07**: Advanced features appear progressively — never as disabled/grayed-out buttons

### Curadoria — L2

- [ ] **CUR-01**: L2 user can upload a generated image as a Prompty result (with notes)
- [ ] **CUR-02**: L2 user can rate a Prompty quality (simple 1-5 or thumbs)
- [x] **CUR-03**: L2 user has a history of copied and saved Promptys
- [x] **CUR-04**: L2 user can suggest a category correction
- [x] **CUR-05**: L2 user can report inappropriate content

### Criação — L3

- [ ] **CREAT-01**: L3 user can create and publish a Prompty with: title, description, beginner_prompt, example_image_url, category, tags, recommended_model
- [ ] **CREAT-02**: L3 user can set complexity_level (simple/guided/advanced)
- [ ] **CREAT-03**: L3 user can view basic stats for their own Promptys: copy count, save count, feedback count
- [ ] **CREAT-04**: L3 user can create simple variations of an existing Prompty
- [ ] **CREAT-05**: L3 user can optionally access advanced mode: advanced_template with {{variable}} syntax, negative_prompt, versions

### Moderation

- [x] **MODR-01**: Authenticated user can report a Prompty or result
- [x] **MODR-02**: Admin can change Prompty status (published → flagged → hidden → removed)
- [x] **MODR-03**: Flagged or removed Promptys are not visible in feed or via direct URL for non-admins

### Infrastructure and Security

- [x] **INFR-01**: All database tables have Row Level Security enabled with explicit policies
- [x] **INFR-02**: Action tracking (copies, saves, feedback) recorded via SQL triggers in immutable events table; no direct frontend writes to internal_points
- [x] **INFR-03**: Client-side image compression before upload (max 2 MB → target ≤200 KB WebP)
- [x] **INFR-04**: Supabase Storage enforces file size limit and allowed MIME types
- [x] **INFR-05**: Usage monitoring (GitHub Actions weekly cron) alerts at 70% and 90% of free tier limits

## v2 Requirements

### Advanced Prompty Features (L3 expansion)

- **ADV-01**: Advanced template system with {{variable}} syntax and typed inputs_schema
- **ADV-02**: Prompty versioning — each save creates a version entry
- **ADV-03**: Remix with attribution chain (GitHub-style fork lineage)
- **ADV-04**: Multi-dimensional ratings (visual quality, prompt accuracy, reproducibility, originality)

### Social Graph

- **SOC2-01**: Follow system — user can follow other creators
- **SOC2-02**: Followed-only feed tab
- **SOC2-03**: Realtime notifications for saves, results, and feedback on own Promptys

### Gamification Display (L3 only, in separate area)

- **GAME2-01**: Points leaderboard (separate area, not on home feed)
- **GAME2-02**: Badges displayed on L3 profile: Prompt Crafter, Visual Tester, Sharp Reviewer, etc.
- **GAME2-03**: Weekly ranking for top contributors

### Discovery Improvements

- **DISC-01**: Trending feed (hot score algorithm with newcomer boost)
- **DISC-02**: Collections / curated prompt packs

## Out of Scope

| Feature | Reason |
|---------|--------|
| Ranking on home feed | Ruins L1 experience; only in separate L3 area |
| Visible points/badges for L1 | Calculated internally; shown only when relevant to L3 |
| In-app image generation (MVP) | Paid API cost; scope explosion; deferred to future with credits |
| OAuth (Google/GitHub) login | Email/password sufficient; reduces v1 scope |
| Automatic content import | Copyright risk; platform ToS violation |
| Real-time collaborative editing | OT/CRDT complexity not justified |
| AI-powered prompt improvement | LLM API cost; creates vendor dependency |
| DM / private messaging | Moderation burden; not core value |
| NFT minting | Market collapsed; legally grey; alienates users |
| Paid prompt sales | Paywalls fragment community; free library must stay intact |
| Mobile native app | Web-first; responsive + PWA serves mobile in v1 |
| Advertisements | Product is 100% free and clean — no ads ever |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| FEED-01 | Phase 1 | Complete |
| FEED-02 | Phase 1 | Complete |
| FEED-03 | Phase 1 | Complete |
| FEED-04 | Phase 1 | Complete |
| FEED-05 | Phase 1 | Complete |
| SOCL-01 | Phase 1 | Complete |
| SOCL-02 | Phase 1 | Complete |
| SOCL-03 | Phase 1 | Complete |
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| PROF-03 | Phase 1 | Complete |
| LEVL-01 | Phase 1 | Complete |
| LEVL-02 | Phase 1 | Complete |
| LEVL-03 | Phase 1 | Complete |
| LEVL-04 | Phase 1 | Complete |
| LEVL-05 | Phase 1 | Complete |
| LEVL-06 | Phase 1 | Complete |
| LEVL-07 | Phase 1 | Complete |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 1 | Complete |
| INFR-05 | Phase 1 | Complete |
| FEED-06 | Phase 2 | Complete |
| FEED-07 | Phase 2 | Complete |
| CUR-01 | Phase 2 | Pending |
| CUR-02 | Phase 2 | Pending |
| CUR-03 | Phase 2 | Complete |
| CUR-04 | Phase 2 | Complete |
| CUR-05 | Phase 2 | Complete |
| MODR-01 | Phase 2 | Complete |
| MODR-02 | Phase 2 | Complete |
| MODR-03 | Phase 2 | Complete |
| CREAT-01 | Phase 3 | Pending |
| CREAT-02 | Phase 3 | Pending |
| CREAT-03 | Phase 3 | Pending |
| CREAT-04 | Phase 3 | Pending |
| CREAT-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-07 — pivoted to progressive disclosure model*
*Last updated: 2026-05-07*
