# Pitfalls Research: Promptys

**Dimension:** Pitfalls
**Confidence:** HIGH

## Critical Pitfalls

### 1. RLS Policies That Pass CI But Leak Data
**Phase:** Phase 1 (Auth + Data Model)

What goes wrong: RLS "enabled" but policies are incomplete. Most dangerous: no `WITH CHECK (false)` on `point_events` for client roles, allowing any authenticated user to INSERT their own point rows. Also: `prompty_versions` readable by all authenticated users even for draft promptys.

Prevention:
- SQL role tests for every table: for `anon`, `authenticated-as-owner`, `authenticated-as-non-owner` — test SELECT/INSERT/UPDATE/DELETE
- `point_events` must have `WITH CHECK (false)` for all client-facing roles; only `postgres` role (triggers) can INSERT
- Never use `supabaseAdmin` (service role) in `use client` components

Warning signs: No SQL role tests; `point_events` lacks `WITH CHECK (false)` policy; tests done through app (which may use service role).

---

### 2. Gamification Trigger Double-Fire / Race Conditions
**Phase:** Phase 2 (Gamification)

What goes wrong:
- Trigger fires on INSERT and UPDATE of `prompty_likes` — un-like + re-like earns double points
- No unique constraint on `point_events (user_id, event_type, reference_id)` — network retries duplicate rows
- `total_points` / `level` computed via aggregation on read — O(n) per profile fetch

Prevention:
- `UNIQUE (user_id, event_type, reference_id)` on `point_events`; triggers use `ON CONFLICT DO NOTHING`
- Like/save triggers only on `AFTER INSERT`; separate `AFTER DELETE` for reversal
- Materialize `total_points` and `level` as columns on `profiles`, updated by triggers
- Adversarial test: INSERT same like twice → assert `point_events` count = 1

---

### 3. Feed N+1 and Missing Composite Indexes
**Phase:** Phase 3 (Social Feed)

What goes wrong: Nested selects for counts generate 5+ round trips per row. OFFSET pagination adds O(n) overhead at page 50+.

Prevention:
- Denormalize `likes_count`, `saves_count`, `ratings_count`, `avg_rating` as columns on `promptys`, updated by triggers
- Composite indexes: `(created_at DESC)`, `(likes_count DESC, created_at DESC)`, `(avg_rating DESC, ratings_count DESC)`
- Keyset pagination: cursor = `(created_at, id)` tuple. Never OFFSET
- `EXPLAIN ANALYZE` with 1,000 seed rows before merging feed PR

Warning signs: Feed latency >200ms with <100 rows; counts in separate `useEffect` calls; OFFSET in pagination URL params.

---

### 4. Storage Costs — Uncontrolled Upload Size
**Phase:** Phase 4 (Image Upload)

What goes wrong: Supabase free tier = 1 GB storage, 2 GB bandwidth/month. 2–5 MB uploads per test result exhaust storage within days.

Prevention:
- Client-side compression via `browser-image-compression`: target max 800px wide, WebP 80%, ≤2 MB input → ~150 KB output
- `fileSizeLimit: 2097152` (2 MB) and `allowedMimeTypes` on bucket config
- Store only Storage path in DB (e.g. `tests/user-id/filename.webp`), never full URLs
- Separate `public` (output images) and `private` (reference images) buckets

Warning signs: No `fileSizeLimit` on buckets; raw `event.target.files[0]` uploaded without compression; full Supabase URLs in DB columns.

---

### 5. Realtime Channel Proliferation and Memory Leaks
**Phase:** Phase 5 (Notifications + Realtime)

What goes wrong: Free tier ≈ 200 concurrent Realtime connections. Each component subscribing without cleanup leaks one connection per mount. Subscribing to full `point_events` table broadcasts all users' events to all clients — privacy leak + bandwidth waste.

Prevention:
- Always `return () => supabase.removeChannel(channel)` from `useEffect`
- Filter all subscriptions: `filter: \`user_id=eq.${userId}\``
- Single notification channel per authenticated session in React Context at app root; not per-component

Warning signs: `supabase.channel(...)` in component-level `useEffect` without cleanup return; no filter clause on Realtime subscription.

---

### 6. Template Parser XSS and Schema Drift
**Phase:** Phase 2 (Prompty Creation)

What goes wrong:
- `{{<script>alert(1)</script>}}` as variable name → stored XSS if rendered via `dangerouslySetInnerHTML`
- `inputs_schema` types as string literals in 5+ files → crash or silent fallback when new type added

Prevention:
- Parser regex: `/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g` — alphanumeric + underscore only; reject at save time
- Never use `dangerouslySetInnerHTML` for template output; render as React nodes
- Define `inputs_schema` types as Zod schema in one shared file; both frontend parser and DB validation import from it
- Validate `inputs_schema` structure on Prompty INSERT/UPDATE via Postgres CHECK constraint or trigger

---

### 7. Supabase Free Tier Hard Limits With No Warning
**Phase:** Phase 1 (Infrastructure)

What goes wrong: When storage, bandwidth, DB size, or Realtime connections hit free tier limits, Supabase pauses the project (DB becomes read-only). No built-in alerting for free tier projects.

Prevention:
- Weekly cron (Vercel Cron or GitHub Actions) calling Supabase Management API for usage stats; alert at 70% and 90%
- Purge abandoned test images after 30 days via scheduled Edge Function
- `VACUUM ANALYZE` on `point_events` monthly
- Budget Supabase Pro ($25/month) before public launch

---

## Technical Debt Anti-Patterns

| Shortcut | Long-term Cost | Verdict |
|----------|----------------|---------|
| Supabase auto-REST for feed queries | N+1 on joins; no optimization path | Never for feed |
| Skip client-side image compression | Storage exhausted within days | Never |
| Compute `total_points` on read | O(n) per profile fetch | Never — denormalize from start |
| OFFSET pagination | Exponential slowdown + inconsistent results | Never for social feeds |
| `auth.uid() IS NOT NULL` as only RLS check | Any user reads any row | Never |
| Per-component Realtime channels without cleanup | Connection leak at 50 users | Never |
| Full Supabase Storage URLs in DB | Breaks on bucket rename/migration | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Auth + Next.js App Router | Using `createClient` from base SDK in Server Components | Use `@supabase/ssr` `createServerClient` with cookie-based session |
| Storage uploads from client | Uploading with service-role key | Use anon client with Storage RLS; signed URLs for private buckets |
| Supabase Realtime | Subscribing in Server Components | Realtime only in Client Components; manage in React Context |
| `inputs_schema` JSONB | Typed as `any` | Define Zod schema; validate on insert and at runtime |
| RLS + triggers | Adding INSERT RLS to `point_events` that blocks trigger | Triggers run as `postgres` (superuser) and bypass RLS intentionally |
| Next.js ISR + public feed | Feed cached infinitely; new Promptys don't appear | Use `revalidatePath` on creation or short ISR interval (≤10s) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase |
|---------|------------------|
| RLS misconfiguration / data leak | Phase 1: Auth + Data Model |
| point_events fraud / double-trigger | Phase 2: Gamification |
| Template XSS / schema drift | Phase 2: Prompty Creation |
| Feed N+1 / missing indexes | Phase 3: Social Feed |
| Free tier monitoring | Phase 1: Infrastructure |
| Image upload size / compression | Phase 4: Image Uploads |
| Realtime channel leak | Phase 5: Notifications |
| OFFSET pagination | Phase 3: Social Feed |

## Open Questions

- pg_cron availability on Supabase free tier in 2026 — if not available, use trigger-based materialized view refresh
- Realtime concurrent connection limit on current free tier (was ~200 in 2024)
- Whether `REFRESH MATERIALIZED VIEW CONCURRENTLY` is feasible at free-tier Postgres resources
- Supabase Management API endpoint for usage stats — verify current path and required API key scopes
