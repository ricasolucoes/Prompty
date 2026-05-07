# Feature Research: Promptys

**Domain:** AI image prompt sharing — collaborative social network with parameterized templates
**Researched:** 2026-05-06
**Confidence:** MEDIUM (training knowledge of Civitai, PromptHero, PromptBase, Lexica through Aug 2025; live verification recommended)

## Competitive Platform Snapshot

**Civitai** — dominant model/LoRA/image sharing hub. Feed with like/dislike/comments, model version history, Buzz points economy. Prompts embedded in image metadata — never standalone shareable artifacts with variables.

**PromptHero** — pure prompt gallery. Latest/Top/Trending, model/style filter, Like, Pro subscription. No remix, no versioning, no variables, **no comments**.

**PromptBase** — paid prompt marketplace ($1.99–$5). Social layer absent. "Prompt as product" not "community artifact."

**Lexica** — search-first semantic search over SD images. Minimal social. Discovery without community.

**Midjourney showcase** — visual-first gallery. No native follow/comment/like. Social happens in Discord.

**Key gap:** No competitor has parameterized prompt templates. Every platform treats a prompt as raw text.

## Table Stakes (Must Have — Users Leave Without These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User profiles (display_name, avatar, bio) | Every social platform has identity | LOW | `profiles` table; avatar via Supabase Storage |
| Public feed — Latest + Top orderings | Civitai, PromptHero, every platform | MEDIUM | Trending requires hot-score; ship Latest + Top first |
| Prompty detail page | Core consumption surface | MEDIUM | SSR for SEO; template text, variable list, example outputs, ratings |
| Like + Save (bookmark) | Universal social affordance | LOW | `prompty_likes` + `prompty_saves` |
| Example output image(s) | Text prompt with no image gets zero traction | LOW | At least one image required on publish |
| Copy resolved prompt button | If copying is hard the platform fails at its job | LOW | Client-side clipboard API |
| Tags + tag filter | Discoverability baseline | LOW | Text array; autocomplete on input |
| Model filter | AI-specific expectation (Flux, SDXL, Midjourney, DALL-E) | LOW | Enum or text field; filter in feed query |
| Negative prompt field | Stable Diffusion ecosystem expectation | LOW | Text field; shown on detail page |
| Basic keyword search | Must find prompts by topic | MEDIUM | Postgres `tsvector` on title + description + tags |
| Report / flag content | Safety net; expected by users post-Civitai controversies | LOW | `reports` table; admin review queue |
| Prompt versioning (user-visible) | Trust signal — users need to know what changed | MEDIUM | `prompty_versions` auto-insert on edit |
| Comment system | Feedback loop; PromptHero has none — gap to fill | MEDIUM | Flat comments for MVP; moderation hooks required |

## Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Parameterized template `{{variable}}` | No competitor has typed prompt templates | HIGH | `inputs_schema` JSONB: text/image/enum/number/boolean/color/ratio/seed; parser client-side |
| Interactive fill & test form | Turns passive reading into active participation | HIGH | Template parser + live preview; the "aha moment" for users |
| Multi-dimensional ratings | Structured quality dimensions; nobody has this | MEDIUM | `prompty_ratings` table; dimensions: visual_quality, prompt_accuracy, reproducibility, originality |
| Gamification: points + levels + badges | Progression-based leveling tied to contribution quality | HIGH | SQL triggers + immutable `point_events`; must ship before contribution features |
| Remix with attribution chain | GitHub-style fork lineage; Civitai has no remix | MEDIUM | `prompty_remixes` with `original_id`; attribution credit on remix detail |
| Community-proven test results | Multiple real user outputs build trust vs one staged screenshot | MEDIUM | `prompty_tests`; upvote on individual tests; best test = cover |
| Difficulty tag | Beginners vs experts; no platform segments this | LOW | Enum: beginner / intermediate / advanced; filter in feed |
| Hot algorithm with newcomer boost | Prevents established accounts dominating feed | MEDIUM | Hot score with recency weight for accounts <30 days |
| Realtime notifications | Live feedback on likes/remixes/comments | MEDIUM | Supabase Realtime channel; `notifications` table |

## Anti-Features (Deliberately NOT Build)

| Feature | Why Problematic | Alternative |
|---------|-----------------|-------------|
| In-app image generation (MVP) | Paid API cost unpredictable; scope explosion; Civitai and PromptHero both struggled with it | Link to tools with pre-filled resolved prompt; add MVP 3 with credits system only |
| Real-time collaborative editing | OT/CRDT complexity enormous; not time-sensitive | Remix + comment as async collaboration |
| AI-powered prompt improvement / autocomplete | LLM API cost per request; creates vendor dependency | Community ratings as organic quality signal |
| Automatic Facebook group import | Copyright of group members' posts; Facebook ToS violation | Manual import with explicit attribution + uploader consent checkbox |
| Anonymous posting | Gamification requires identity; enables abuse; breaks attribution | Pseudonymous username; no real name required |
| DM / private messaging | High moderation burden; harassment vector | Comments on Promptys for connection; profile external links |
| NFT minting | Market collapsed; AI content legally grey; alienates users | Attribution system + remix credit — no blockchain |
| Paid prompt sales (PromptBase model) | Paywalls fragment community; trust requires openness | Tip jar / creator badge via optional subscription; free library always |
| Complex per-prompt permission tiers | Confuses creators and users | Two states only: Public (remixable) or Unlisted (link-only) |

## Feature Dependencies

```
Auth / User Profiles
    └── required by ──> All contribution features

Prompty Creation (template parser + inputs_schema)
    └── requires ──> Auth, Image Upload, Versioning trigger

Gamification (point_events + levels)
    └── requires ──> Auth
    └── MUST BE IN PLACE before likes/tests/comments go live
    └── enhances ──> Every contribution action

Fill & Test Form
    └── requires ──> Prompty Creation, Image Upload
    └── enhances ──> Gamification (test = points), Feed (tests = trust signal)

Comments
    └── requires ──> Auth
    └── requires ──> Moderation (comment reports)
    └── enhances ──> Gamification (comment = points)

Remix
    └── requires ──> Prompty Creation + Auth
    └── enhances ──> Attribution chain UI, Gamification

Search + Filters
    └── requires ──> Prompty Creation, Tags system

Follow System
    └── requires ──> Auth + Profiles
    └── enhances ──> Feed, Notifications
```

**Critical:** Gamification infrastructure (`point_events` table + SQL triggers) must be implemented **before** any contribution feature (likes, tests, comments) goes live. Retroactive migration is feasible but painful.

**Auto-versioning must be automatic from day one** — a Postgres trigger on `promptys` UPDATE is far cheaper to add at creation time than to retrofit.

## Competitor Feature Matrix

| Feature | Civitai | PromptHero | PromptBase | Promptys |
|---------|---------|------------|------------|----------|
| Feed (Latest/Top/Trending) | Yes | Yes | No | Yes — P1 |
| User profiles | Yes | Yes | Yes (sellers) | Yes — P1 |
| Follow / social graph | Yes | Limited | No | P2 |
| Like system | Yes | Yes | No | Yes — P1 |
| Comment system | Yes | **No** | **No** | Yes — P1 (gap) |
| Template variables / form | **No** | **No** | **No** | Yes — P1 (differentiator) |
| Versioning | Yes (models) | No | No | Yes — P1 |
| Remix with attribution | **No** | **No** | **No** | P2 |
| Multi-dim ratings | No | No | Stars | P2 |
| Gamification (points/levels) | Buzz (economy) | No | No | Yes — P1 |
| In-app generation | Yes | Basic | No | No MVP; P3 |
| Moderation | Yes | Basic | Basic | Yes — P1 |

## MVP Definition

### v1 Launch Scope

- [ ] Auth — email/password via Supabase
- [ ] Profiles — display_name, avatar, bio, public Promptys list
- [ ] Prompty creation with `{{variable}}` template + `inputs_schema` form builder
- [ ] Prompty detail page with fill & test form (live resolved prompt preview)
- [ ] Image upload for test results (Supabase Storage)
- [ ] Public feed: Latest + Top orderings
- [ ] Like + Save
- [ ] Tags + model filter + keyword search
- [ ] Comment system (flat)
- [ ] Gamification: points + levels via SQL triggers (badge UI can come later)
- [ ] Report flag + admin status toggle
- [ ] Auto-versioning on edit
- [ ] Negative prompt field + difficulty tag

### v1.x (After Core Validation)

- [ ] Remix with attribution chain
- [ ] Multi-dimensional ratings
- [ ] Follow system + followed-only feed
- [ ] Realtime notifications
- [ ] Trending feed (hot score with newcomer boost)
- [ ] Collections / prompt packs
- [ ] Badge display UI

### v2+ (Future)

- [ ] In-app generation with credits
- [ ] Premium template marketplace (free library stays intact)
- [ ] Semantic search via pgvector
- [ ] OAuth (Google/GitHub)
- [ ] Public API for integrations

## Open Questions

- Has any platform shipped typed-variable prompt templates between Aug 2025 and May 2026? (Would change competitive positioning)
- What image moderation approach does Civitai use at infrastructure level for NSFW content?
- What are Civitai's exact hot-score algorithm weights? (Affects trending feed design)
