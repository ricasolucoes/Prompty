# Architecture Research: Promptys

**Dimension:** Architecture
**Confidence:** MEDIUM-HIGH

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Next.js App (Vercel)                          │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │  App Router│  │  Server    │  │  Client    │  │  Middleware│     │
│  │  (layouts) │  │  Components│  │  Components│  │  (session) │     │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘    │
│        │               │               │               │            │
│  ┌─────▼───────────────▼───────────────▼───────────────▼──────┐     │
│  │               Supabase Client Layer (@supabase/ssr)          │     │
│  │        server.ts (cookies)    browser.ts (singleton)         │     │
│  └────────────────────────────┬─────────────────────────────────┘    │
└───────────────────────────────│──────────────────────────────────────┘
                                │
                ┌───────────────▼───────────────┐
                │           Supabase             │
                │  Auth (JWT) │ Storage (images) │
                │  PostgREST (auto CRUD + RLS)   │
                │  PostgreSQL:                   │
                │    Tables + RLS Policies       │
                │    Triggers (point_events)     │
                │    Materialized Views (feed)   │
                │    pg_cron (refresh schedule)  │
                │  Realtime (Postgres CDC → WS)  │
                └───────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Notes |
|-----------|----------------|-------|
| Server Components | SSR data fetch, public SEO pages | Anon key; RLS limits to published content |
| Client Components | Mutations, optimistic UI, realtime subscriptions | User JWT; browser supabase singleton |
| Next.js Middleware | Session refresh on every request | `updateSession()` from `@supabase/ssr` |
| `lib/queries/` | All typed query functions | No raw PostgREST calls in components |
| RLS Policies | Row-level authorization | Single source of truth for permissions |
| SQL Triggers | Points ledger, counter denormalization | Only write path for `point_events` |
| `feed_hot` materialized view | Pre-computed hot/trending ranking | pg_cron refresh, `CONCURRENTLY` |
| Supabase Storage | Image hosting (tests, examples, avatars) | Path-scoped bucket RLS |
| Realtime channels | Notification badge, live feed indicator | One channel per user only |

## Recommended Project Structure

```
src/
├── app/
│   ├── (public)/feed/              # SSR public feed
│   ├── (public)/p/[slug]/          # SSR prompty detail (SEO)
│   ├── (public)/u/[username]/      # SSR public profile
│   ├── (auth)/dashboard/           # Protected dashboard
│   ├── (auth)/create/              # Create/edit prompty
│   └── api/revalidate/             # On-demand ISR webhook
├── components/
│   ├── prompty/                    # PromptyCard, PromptyEditor, PromptyTest, VariableInput
│   ├── feed/                       # FeedList (infinite scroll), FeedFilters
│   ├── social/                     # LikeButton (optimistic), RemixModal
│   ├── notifications/              # Bell icon, notification panel
│   └── ui/                         # Generic design system (shadcn)
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # createServerClient per-request
│   │   ├── browser.ts              # createBrowserClient singleton
│   │   └── middleware.ts           # updateSession
│   ├── queries/
│   │   ├── promptys.ts             # listFeed, getPrompty, searchPromptys
│   │   ├── profiles.ts             # getProfile, updateProfile
│   │   ├── social.ts               # likePrompty, savePrompty, remixPrompty
│   │   └── ratings.ts              # ratePrompty, getRatings
│   └── utils/
│       └── template.ts             # {{variable}} parser
├── hooks/
│   ├── useNotifications.ts         # point_events realtime subscription
│   └── useFeedUpdates.ts           # new-prompty live indicator
├── types/database.types.ts         # Generated: supabase gen types typescript
└── supabase/
    └── migrations/
        ├── 001_schema.sql          # Tables, constraints, indexes
        ├── 002_rls.sql             # All RLS policies
        ├── 003_triggers.sql        # Point triggers, counter triggers
        └── 004_views.sql           # feed_hot, pg_cron schedule
```

## Key Data Flows

**Feed load (public, SSR):**
```
Browser GET /feed
  → Server Component → createServerClient (anon key)
    → lib/queries/promptys.listFeed()
      → supabase.from('feed_hot').select().limit(20)
  → Server renders HTML → client hydrates → infinite scroll
```

**Like action (optimistic):**
```
User clicks Like
  → LikeButton (Client Component)
    → Optimistic UI: increment local like_count
      → supabase.from('prompty_likes').insert()
        → RLS: auth.uid() = user_id ✓
          → AFTER INSERT trigger:
              1. INSERT point_events (liker + author points)
              2. UPDATE profiles.points atomically
              3. UPDATE promptys.like_count++ (denormalized)
          → Realtime CDC → author's useNotifications → badge++
```

**Image upload:**
```
User selects file → client validates type/size
  → supabase.storage.from('prompty-images').upload(`${userId}/tests/${uuid}.jpg`)
    → Storage bucket RLS: path prefix = auth.uid() ✓
      → Returns public URL → stored in prompty_tests.result_image_url
```

## Build Order (Dependency Graph)

```
1. Supabase schema + RLS + triggers      ← foundation, everything depends
   001_schema.sql, 002_rls.sql, 003_triggers.sql, 004_views.sql

2. Auth + session middleware              ← unlocks all protected routes

3. Profiles + Prompty CRUD + public feed ← first visible product

4. Social interactions                   ← engagement layer
   Likes, saves, ratings, remix

5. Prompty testing + Storage             ← core differentiator
   Variable input UI, image upload, test result display

6. Realtime + notifications              ← retention layer

7. Search + discovery                    ← findability

8. Gamification display                  ← motivation layer
   Points display, levels, leaderboard
```

## Critical Anti-Patterns

1. **Points from frontend** — Only `SECURITY DEFINER` triggers write `point_events`. No INSERT policy for any role.
2. **Service-role key in Server Components** — Reserve for migrations and Edge Functions only.
3. **Aggregation JOINs on feed** — Use denormalized counters (`like_count`, `test_count`, `rating_avg`) + materialized view.
4. **One Realtime channel per feed card** — One `notifications:{userId}` channel per user maximum.
5. **Base64 images in Postgres** — Always store path/URL; file lives in Supabase Storage.

## RLS Core Patterns

```sql
-- Every table: enable RLS first
ALTER TABLE promptys ENABLE ROW LEVEL SECURITY;

-- Public read: published only
CREATE POLICY "anon_read_published" ON promptys
  FOR SELECT USING (status = 'published');

-- Authenticated insert: own rows
CREATE POLICY "auth_insert_own" ON promptys
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authenticated update: own rows
CREATE POLICY "auth_update_own" ON promptys
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

-- Storage: path-scoped
-- INSERT allowed when (storage.foldername(name))[1] = auth.uid()::text
```

## Scaling Thresholds

| Scale | Key Adjustment |
|-------|---------------|
| 0–1k users | Free tier; direct table queries |
| 1k–50k users | Pro tier; index audit on RLS columns; ISR for detail pages |
| 50k–500k users | Read replicas; Upstash Redis for hot prompty cache |
| 500k+ | Self-hosted Supabase; partition `point_events` by month |

**First bottleneck:** PostgREST connection pool (use pgBouncer pooled URL always)
**Second bottleneck:** Realtime concurrent connections (~200 free tier)
**Third bottleneck:** Materialized view refresh lag under write bursts

## Open Questions

- pg_cron availability on Supabase free tier in 2026 (if not, use trigger-based refresh workaround)
- Realtime concurrent connection limit on current free tier
- Whether `REFRESH MATERIALIZED VIEW CONCURRENTLY` is feasible at free-tier resources
