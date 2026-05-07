# Phase 1: Foundation - Research

**Researched:** 2026-05-06
**Domain:** Next.js 15 App Router + Supabase (Auth, Postgres RLS, SQL triggers, Storage, GitHub Actions monitoring)
**Confidence:** HIGH (all stack decisions pre-validated in project research files; architecture patterns fully specified)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth Flow**
- Email verification required before user can publish or interact
- Session persistence: 7-day rolling session with JWT refresh via `@supabase/ssr` middleware on every request
- Password requirements: Supabase defaults (8+ characters) — no custom rules
- Password reset: email link flow via `resetPasswordForEmail`
- Unauthenticated visitors can browse freely — no forced login wall

**Profile Setup**
- Profile setup is deferred, not blocking — user signs up, redirected to profile setup on first login, can skip
- `username` is required to publish; `display_name`, `avatar`, `bio` are optional at account creation
- Username format: alphanumeric + underscore + hyphen, 3–30 chars, globally unique (DB constraint)
- Public profile pages are SSR and SEO-friendly, accessible to unauthenticated visitors

**RLS and Security Architecture**
- Every table has RLS enabled in `001_schema.sql` — no exceptions
- `point_events` has no INSERT/UPDATE/DELETE policies for any client role — only `SECURITY DEFINER` triggers can write to it; enforced via `WITH CHECK (false)` policy for `authenticated` role
- Service-role key never exposed to client code or Server Components
- Supabase Storage: `prompty-images` bucket with path-scoped RLS: `(storage.foldername(name))[1] = auth.uid()::text`
- SQL role tests required as part of migration validation

**Gamification Infrastructure**
- Level thresholds as TypeScript constants (not a DB table)
  - Level 1: 0 pts — Curioso Visual
  - Level 2: 100 pts — Aprendiz de Prompt
  - Level 3: 500 pts — Prompt Crafter
  - Level 4: 1,500 pts — Remix Alchemist
  - Level 5: 5,000 pts — Style Architect
  - Level 6: 10,000 pts — Model Whisperer
  - Level 7: 25,000 pts — Hall of Promptys
- `point_events` has `UNIQUE (user_id, event_type, reference_id)` — triggers use `ON CONFLICT DO NOTHING`
- Point reversal on unlike/unsave: AFTER DELETE trigger inserts negative-value row (never deletes prior rows)
- `profiles.points` and `profiles.level` are materialized columns updated by triggers — never computed on read
- Point events in Phase 1 schema: `prompty_published` (+50), `test_submitted` (+15), `like_received` (+3), `rating_given` (+10), `helpful_comment` (+10), `like_reversed` (-3), `save_reversed` (-1)

**Infrastructure Monitoring**
- GitHub Actions weekly workflow calls Supabase Management API; alerts at 70% and 90% of free tier limits
- Monitoring runs before first user is invited
- pgBouncer pooled connection URL used for all app queries

**Stack Scaffold**
- Next.js 15 App Router with TypeScript
- `@supabase/ssr` for all Supabase client creation — `createServerClient` for Server Components and Server Actions; `createBrowserClient` (singleton) for Client Components
- Middleware calls `updateSession()` on every request
- Tailwind CSS 4 + shadcn/ui
- All DB types from `supabase gen types typescript` — no manual DB type definitions
- Migration files: `001_schema.sql`, `002_rls.sql`, `003_triggers.sql`, `004_views.sql`

### Claude's Discretion
- Exact loading/skeleton states during auth transitions
- Error message copy for auth failures
- Avatar upload UI details (crop, preview)
- Exact middleware route matcher pattern (which paths require auth vs are public)

### Deferred Ideas (OUT OF SCOPE)
- OAuth login (Google/GitHub)
- Daily point limits per user
- Admin role and permissions (schema may include `is_admin` boolean on profiles, but admin UI is Phase 4)
- Prompty creation, feed, social interactions, gamification UI display (points/levels on screen)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with email and password | Supabase Auth `signUp()` + email verification flow; @supabase/ssr createServerClient handles cookie session |
| AUTH-02 | User can log in and stay logged in across browser sessions | `signInWithPassword()` + middleware `updateSession()` on every request for rolling 7-day JWT |
| AUTH-03 | User can log out from any page | `signOut()` in Server Action; middleware clears session cookies |
| AUTH-04 | User can reset password via email link | `resetPasswordForEmail()` + `updateUser()` on callback route |
| AUTH-05 | Unauthenticated users can browse feed and view Prompty detail pages | Anon key + RLS SELECT policy on `promptys WHERE status = 'published'`; no forced login wall |
| PROF-01 | User can set display name, avatar, and bio on their profile | Supabase Storage `prompty-images` bucket for avatar; `profiles` table UPDATE via Server Action |
| PROF-02 | User can view their own published Promptys on their profile page | SSR profile page queries `promptys WHERE author_id = uid AND status = 'published'` |
| PROF-03 | User can view other users' public profiles and their published Promptys | SSR `/u/[username]` route; anon access via RLS SELECT policy |
| PROF-04 | User profile shows total points and current level | `profiles.points` + `profiles.level` are materialized columns; TypeScript LEVEL_THRESHOLDS constants for label |
| INFR-01 | All database tables have Row Level Security enabled with explicit policies | `002_rls.sql` — every table; role tests for anon / owner / non-owner |
| INFR-02 | `point_events` table has no INSERT/UPDATE/DELETE policies for client roles — only triggers write to it | `WITH CHECK (false)` policy on `point_events` for `authenticated` role; SECURITY DEFINER triggers bypass RLS |
| INFR-03 | Client-side image compression before upload (max 2 MB input → ≤200 KB WebP) | `browser-image-compression` library; applied before Storage upload for avatars |
| INFR-04 | Supabase Storage enforces file size limit (2 MB) and allowed MIME types | `fileSizeLimit: 2097152`, `allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']` on bucket config |
| INFR-05 | Usage monitoring cron runs weekly; alerts at 70% and 90% of free tier limits | GitHub Actions scheduled workflow calling Supabase Management API |
| GAME-01 | System awards points via SQL triggers | `003_triggers.sql`: AFTER INSERT triggers on relevant tables writing to `point_events`; AFTER DELETE for reversals |
| GAME-02 | Points recorded in immutable `point_events` table — no direct frontend writes | `WITH CHECK (false)` policy; triggers only via postgres superuser role |
| GAME-05 | Point events are idempotent — duplicate actions do not award duplicate points | `UNIQUE (user_id, event_type, reference_id)` + `ON CONFLICT DO NOTHING` in triggers |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire technical foundation that subsequent phases build on. Every subsequent phase depends on the correctness of this phase's database schema (10 tables), RLS policies (all tables, no exceptions), SQL trigger infrastructure (`003_triggers.sql`), and the Next.js + @supabase/ssr scaffold. Errors introduced here — particularly in RLS or trigger idempotency — propagate into every future phase.

The stack is entirely pre-decided: Next.js 15 App Router, @supabase/ssr (NOT deprecated auth-helpers-nextjs), Tailwind CSS 4, shadcn/ui. The primary research challenge is not "what to use" but "exactly how to wire it correctly" — specifically the @supabase/ssr client split, the middleware session refresh, the RLS policy structure for point_events, and the GitHub Actions monitoring workflow.

The greenfield nature of this project means all patterns established here become the canonical reference for Phases 2–4. The Supabase client split (server.ts / browser.ts / middleware.ts), the migration file convention (001–004), and the RLS testing methodology are the three patterns with the highest downstream reuse.

**Primary recommendation:** Build migrations in strict order (schema → rls → triggers → views), validate each migration file with SQL role tests before moving to the next, scaffold the Next.js app with the correct @supabase/ssr wiring first, then layer auth pages and profile pages on top.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | App Router, SSR, Server Actions, Middleware | Locked decision; React 19, Turbopack, async cookies API |
| TypeScript | 5.x | Type safety across app and DB types | Locked; `supabase gen types` output is TypeScript |
| @supabase/supabase-js | 2.x | Postgres, Auth, Storage, Realtime client | Official Supabase JS client |
| @supabase/ssr | ^0.5 | SSR-safe Supabase clients with cookie-based sessions | Locked; replaces deprecated auth-helpers-nextjs |
| Tailwind CSS | 4.x | Styling with CSS-first config | Locked; no postcss.config.js needed; @import "tailwindcss" in globals.css |
| shadcn/ui | latest (2025 CLI) | Headless UI primitives | Locked; components copied into repo for full glassmorphism control |

### Supporting (Phase 1 scope only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | ^0.400 | Icons | All icon needs in auth and profile UI |
| React Hook Form | ^7.x | Forms | Signup, login, profile edit, username setup forms |
| Zod | ^3.x | Schema validation | Validate form inputs before sending to Server Actions |
| @hookform/resolvers | ^3.x | RHF + Zod bridge | Pair with RHF forms |
| sonner | ^1.x | Toast notifications | Auth success/error feedback |
| browser-image-compression | ^2.x | Client-side image compression | Avatar upload before Storage upload (INFR-03) |
| Supabase CLI | latest | Local dev, migrations, type generation | `supabase db push`, `supabase gen types typescript` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | Never — deprecated, broken in Next.js 15 async cookies API |
| Tailwind CSS 4 | Tailwind CSS 3 | Only if third-party plugin incompatibility forces downgrade |
| Server Actions for mutations | Route Handlers (/api) | Route Handlers are equally valid; Server Actions are simpler for form submissions |

**Installation:**
```bash
# Bootstrap
npx create-next-app@latest prompty --typescript --tailwind --app --turbopack

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Forms and validation
npm install react-hook-form @hookform/resolvers zod

# UI
npx shadcn@latest init
npx shadcn@latest add button card input label form avatar dropdown-menu separator

# Notifications and image compression
npm install sonner browser-image-compression lucide-react

# Dev
npm install -D supabase prettier prettier-plugin-tailwindcss
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (public)/
│   │   └── u/[username]/          # SSR public profile (SEO, anon access)
│   ├── (auth)/
│   │   ├── dashboard/             # Protected; requires session
│   │   └── settings/              # Profile edit
│   ├── auth/
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Signup page
│   │   ├── setup-profile/         # First-login deferred profile setup
│   │   ├── reset-password/        # Reset request page
│   │   └── callback/              # Supabase Auth callback (email confirm, password reset)
│   ├── layout.tsx                 # Root layout — providers
│   └── globals.css                # @import "tailwindcss"; CSS variables for brand colors
├── components/
│   ├── auth/                      # LoginForm, SignupForm, ResetPasswordForm
│   ├── profile/                   # ProfileHeader, AvatarUpload, ProfileEditForm
│   └── ui/                        # shadcn components (re-exported from shadcn)
├── lib/
│   ├── supabase/
│   │   ├── server.ts              # createServerClient — Server Components / Server Actions
│   │   ├── client.ts              # createBrowserClient — Client Components (singleton)
│   │   └── middleware.ts          # updateSession — called from middleware.ts
│   ├── queries/
│   │   └── profiles.ts            # getProfile(username), updateProfile(uid, data)
│   └── constants/
│       └── levels.ts              # LEVEL_THRESHOLDS array — TypeScript constants
├── types/
│   └── database.types.ts          # Generated: supabase gen types typescript
├── middleware.ts                   # Next.js middleware — calls updateSession on every request
└── supabase/
    └── migrations/
        ├── 001_schema.sql          # All 10 tables, constraints, indexes
        ├── 002_rls.sql             # RLS policies for every table
        ├── 003_triggers.sql        # point_events triggers, profiles.points/level update triggers
        └── 004_views.sql           # feed_hot view scaffold (Phase 3 will extend)
```

### Pattern 1: Supabase Client Split (@supabase/ssr)

**What:** Three distinct client creation functions for three Next.js contexts — never mix them.
**When to use:** Always. No exceptions.

```typescript
// src/lib/supabase/server.ts
// Source: @supabase/ssr official docs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* called from Server Component — safe to ignore */ }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 2: Middleware Session Refresh

**What:** Next.js middleware calls `updateSession()` on every request to refresh the JWT and maintain rolling session.
**When to use:** Always — the 7-day rolling session requires this.

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  // IMPORTANT: call getUser() to refresh session; do NOT use getSession()
  const { data: { user } } = await supabase.auth.getUser()
  return supabaseResponse
}
```

### Pattern 3: RLS Policy Structure (002_rls.sql)

**What:** Explicit policy per operation per role. Never rely on default-deny without verifying explicit policies exist.
**When to use:** Every table, no exceptions.

```sql
-- Source: Supabase RLS documentation pattern + CONTEXT.md decision

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- point_events: NO client write access
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "point_events_select_own" ON point_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- Explicit block: triggers run as postgres (superuser) and bypass RLS
CREATE POLICY "point_events_no_insert" ON point_events FOR INSERT TO authenticated
  WITH CHECK (false);
CREATE POLICY "point_events_no_update" ON point_events FOR UPDATE TO authenticated
  USING (false);
CREATE POLICY "point_events_no_delete" ON point_events FOR DELETE TO authenticated
  USING (false);
```

### Pattern 4: Idempotent Points Trigger (003_triggers.sql)

**What:** AFTER INSERT on social action tables writes to point_events with ON CONFLICT DO NOTHING.
**When to use:** All point-earning events (Phase 1 scope: scaffolding for Phase 4 activation).

```sql
-- Source: CONTEXT.md decision + PITFALLS.md gamification section
CREATE OR REPLACE FUNCTION handle_like_received()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author_id uuid;
BEGIN
  SELECT author_id INTO v_author_id FROM promptys WHERE id = NEW.prompty_id;
  -- Award points to the Prompty author
  INSERT INTO point_events (user_id, event_type, reference_id, points)
  VALUES (v_author_id, 'like_received', NEW.id, 3)
  ON CONFLICT (user_id, event_type, reference_id) DO NOTHING;
  -- Update materialized points and level on profiles
  UPDATE profiles SET
    points = (SELECT COALESCE(SUM(points), 0) FROM point_events WHERE user_id = v_author_id),
    level = (/* compute from LEVEL_THRESHOLDS equivalent in SQL */)
  WHERE id = v_author_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_insert
  AFTER INSERT ON prompty_likes
  FOR EACH ROW EXECUTE FUNCTION handle_like_received();
```

### Pattern 5: Auth Callback Route

**What:** `/auth/callback` handles email confirmation tokens from Supabase Auth.
**When to use:** Required for email verification (AUTH-01, AUTH-04).

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/setup-profile'
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=invalid_token`)
}
```

### Pattern 6: Level Thresholds as TypeScript Constants

```typescript
// src/lib/constants/levels.ts
export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0,     label: 'Curioso Visual' },
  { level: 2, minPoints: 100,   label: 'Aprendiz de Prompt' },
  { level: 3, minPoints: 500,   label: 'Prompt Crafter' },
  { level: 4, minPoints: 1500,  label: 'Remix Alchemist' },
  { level: 5, minPoints: 5000,  label: 'Style Architect' },
  { level: 6, minPoints: 10000, label: 'Model Whisperer' },
  { level: 7, minPoints: 25000, label: 'Hall of Promptys' },
] as const

export function getLevelForPoints(points: number) {
  return [...LEVEL_THRESHOLDS].reverse().find(t => points >= t.minPoints)
    ?? LEVEL_THRESHOLDS[0]
}
```

### Anti-Patterns to Avoid

- **Importing `@supabase/auth-helpers-nextjs`:** Deprecated and broken in Next.js 15. Use `@supabase/ssr` only.
- **Using `getSession()` in middleware:** Returns unverified cached data. Always use `getUser()` for auth checks that affect routing.
- **Service-role key in Server Components or client code:** Only for migrations and Edge Functions. Never in `src/`.
- **Computing `profiles.points` on read:** O(n) aggregation per profile fetch. Triggers must maintain materialized columns.
- **Missing `SECURITY DEFINER` on trigger functions:** Without it, the trigger runs as the row-inserting role (authenticated), which has no INSERT permission on `point_events`.
- **RLS enabled but no policies:** A table with RLS enabled and no SELECT policy returns 0 rows for all queries — silent, hard-to-debug data loss.
- **Skipping SQL role tests:** Only valid RLS test methodology is direct Postgres queries as each role, not through the app (app may use service role).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management in Next.js | Custom JWT cookie handling | @supabase/ssr `createServerClient` + `updateSession()` | Handles Next.js 15 async cookies API; cookie mutation in middleware; token refresh |
| Client-side image compression | Canvas-based resize logic | `browser-image-compression` | Handles EXIF rotation, progressive JPEG, WebP conversion, file size targeting reliably |
| DB type definitions | Manual TypeScript interfaces | `supabase gen types typescript` | Auto-generated from actual schema; stays in sync after migrations |
| Username uniqueness validation | Client-side debounce check | Postgres `UNIQUE` constraint + Supabase error code `23505` | DB is the source of truth; client check has TOCTOU race |
| Points computation | Read-time aggregation over `point_events` | Materialized `profiles.points` column via trigger | O(n) at read time; denormalization is the correct pattern here |
| Level determination at DB level | `level_thresholds` DB table | TypeScript `LEVEL_THRESHOLDS` constants | Avoids extra query per profile render; thresholds are code-controlled |

**Key insight:** The Supabase client split looks simple but has subtle correctness requirements in Next.js 15's async model — one incorrect import (browser client in Server Component) silently bypasses RLS and leaks user data.

---

## Common Pitfalls

### Pitfall 1: RLS Enabled but Incomplete Policies

**What goes wrong:** `ALTER TABLE point_events ENABLE ROW LEVEL SECURITY` without an explicit `WITH CHECK (false)` policy for `authenticated` means authenticated users can INSERT point rows directly — completely defeating the gamification security model.

**Why it happens:** RLS "enabled" is mistaken for "restrictive." In Supabase, enabling RLS without policies makes the table invisible to all non-postgres roles; but adding a SELECT policy without an explicit deny INSERT policy does not block INSERTs from authenticated users (Postgres allows by default if no restricting policy exists).

**How to avoid:** Every table needs explicit policies for every operation (SELECT, INSERT, UPDATE, DELETE) for every relevant role (anon, authenticated). For `point_events`, add explicit `WITH CHECK (false)` INSERT policy.

**Warning signs:** No SQL role tests in the migration validation process; testing RLS through the app rather than direct Postgres connections.

### Pitfall 2: Trigger Without SECURITY DEFINER Fails Silently

**What goes wrong:** Trigger function without `SECURITY DEFINER` runs as the invoking role (`authenticated`). That role has `WITH CHECK (false)` on `point_events` INSERTs. The trigger call silently fails — no points awarded, no error surfaced to the user.

**Why it happens:** Postgres trigger security context is non-obvious; the default is `SECURITY INVOKER`.

**How to avoid:** Every trigger function that writes to `point_events` must declare `LANGUAGE plpgsql SECURITY DEFINER`. Validate with an adversarial INSERT test: insert a like row and assert `point_events` count increments.

**Warning signs:** `RETURNS trigger LANGUAGE plpgsql` without `SECURITY DEFINER` on any function that writes to `point_events`.

### Pitfall 3: @supabase/ssr Cookie Mutation in Middleware

**What goes wrong:** If `supabaseResponse` is not rebuilt after `setAll()` in middleware, cookie mutations are not forwarded to the browser — session never persists beyond the first request; 7-day rolling session breaks.

**Why it happens:** Next.js middleware response must be reconstructed when cookies change. The pattern in @supabase/ssr docs requires a specific sequence: capture original response, mutate cookies on request, rebuild response, set cookies on new response.

**How to avoid:** Follow the exact middleware pattern from @supabase/ssr documentation (shown in Pattern 2 above). Do not simplify or abbreviate.

### Pitfall 4: getSession() vs getUser() in Auth Checks

**What goes wrong:** `supabase.auth.getSession()` returns the session from the cookie without validating with the Supabase Auth server. A malformed or expired JWT is not detected. Using `getSession()` in middleware for route protection allows expired sessions to access protected routes.

**How to avoid:** Use `supabase.auth.getUser()` for any auth check that affects routing or access control. `getSession()` is only acceptable for displaying session data (e.g., user email in UI) where staleness is acceptable.

### Pitfall 5: Trigger Double-Fire on Like/Unlike Cycle

**What goes wrong:** If the trigger is `AFTER INSERT OR UPDATE`, an unlike + re-like cycle fires the trigger twice. Without the `UNIQUE (user_id, event_type, reference_id)` constraint and `ON CONFLICT DO NOTHING`, the user earns double points.

**How to avoid:** Trigger only on `AFTER INSERT`; `AFTER DELETE` for reversal. Always include `ON CONFLICT DO NOTHING` in trigger INSERTs. Test with adversarial: insert same like row twice, assert `point_events` count = 1.

### Pitfall 6: pgBouncer and Prepared Statements

**What goes wrong:** Supabase's pgBouncer in transaction-mode pooling is incompatible with prepared statements. The Supabase JS client (`@supabase/supabase-js`) uses PostgREST which does not use prepared statements — so this is not an issue for app queries. However, if any direct `pg` or `postgres.js` client is used in the future, it must disable prepared statements.

**How to avoid:** Use only the Supabase JS client for app queries. Never add a second database client library. Always use the pgBouncer pooled URL (`DATABASE_URL` with `?pgbouncer=true&connection_limit=1`) for any migration tooling.

### Pitfall 7: Email Redirect URL Not Configured in Supabase Dashboard

**What goes wrong:** `resetPasswordForEmail()` and signup confirmation emails contain redirect URLs. If the Supabase project's Site URL and Redirect URLs are not configured to include `localhost:3000` and the production URL, the email links return errors.

**How to avoid:** Configure in Supabase Dashboard → Authentication → URL Configuration before any auth testing: Site URL + Redirect URLs must include `http://localhost:3000/auth/callback` and the production domain.

---

## Code Examples

### 001_schema.sql — Core Tables (profiles + point_events)

```sql
-- Source: CONTEXT.md schema specification

-- profiles
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE,
  display_name  text,
  avatar_url    text,
  bio           text,
  points        integer NOT NULL DEFAULT 0,
  level         integer NOT NULL DEFAULT 1,
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$')
);

-- point_events (append-only, immutable, SECURITY DEFINER triggers only)
CREATE TABLE point_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    text NOT NULL,
  reference_id  uuid,          -- the prompty_like.id, prompty_saves.id, etc.
  points        integer NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT point_events_idempotent UNIQUE (user_id, event_type, reference_id)
);

-- Indexes
CREATE INDEX idx_point_events_user ON point_events (user_id);
CREATE INDEX idx_profiles_username ON profiles (username);
```

### 002_rls.sql — Role Test Pattern

```sql
-- Source: PITFALLS.md RLS testing methodology
-- Run these as a validation script after applying 002_rls.sql

-- Test as anon: can select published promptys
SET ROLE anon;
SELECT count(*) FROM promptys WHERE status = 'published'; -- should return rows

-- Test as anon: cannot insert point_events
SET ROLE authenticated;
SET LOCAL jwt.claims.sub TO 'test-user-uuid';
INSERT INTO point_events (user_id, event_type, reference_id, points)
  VALUES ('test-user-uuid', 'manual_fraud', null, 9999);
-- Expected: ERROR 42501 permission denied (WITH CHECK (false) policy)

RESET ROLE;
```

### GitHub Actions Monitoring Workflow

```yaml
# .github/workflows/supabase-monitor.yml
name: Supabase Usage Monitor
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 09:00 UTC
  workflow_dispatch:

jobs:
  check-usage:
    runs-on: ubuntu-latest
    steps:
      - name: Check Supabase Usage
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
          ALERT_EMAIL: ${{ secrets.ALERT_EMAIL }}
        run: |
          # Fetch project usage from Supabase Management API
          USAGE=$(curl -s \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
            "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/usage")
          # Parse and alert if any metric > 70% of free tier limit
          # (script checks storage_bytes, egress_bytes, db_size_bytes)
          echo "$USAGE" | node scripts/check-limits.js
```

### Tailwind CSS 4 Brand Colors

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --color-midnight: #090A14;
  --color-violet: #7C3AED;
  --color-cyan: #22D3EE;
  --color-coral: #FF6B4A;
  --color-mint: #34D399;
}
```

### Glass Card Utility (no extra library)

```
/* Tailwind utility class combination — no CSS needed */
className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Mid-2024 | auth-helpers is deprecated; SSR handles Next.js 15 async cookies correctly |
| `tailwind.config.js` + postcss | `@import "tailwindcss"` in CSS | Tailwind CSS v4 (early 2025) | No postcss config needed; CSS-first configuration |
| `supabase gen types` manual run | Part of migration workflow | Always best practice | Must re-run after every migration; automate in CI |
| Pages Router auth patterns | App Router + Server Actions | Next.js 13+ (stable 15) | Server Components fetch data directly; no API routes needed for auth mutations |
| `next-auth` with Supabase | Supabase Auth + @supabase/ssr | — | Two parallel auth systems create JWT conflicts; @supabase/ssr is the only correct approach |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Do not install. Not in package.json for any reason.
- `next-auth` alongside Supabase Auth: Creates two JWT systems that conflict.
- Tailwind CSS `tailwind.config.js` (for new projects): Not needed in v4; CSS-first config.
- `getSession()` for auth checks in middleware: Use `getUser()` instead.

---

## Open Questions

1. **pg_cron on Supabase free tier**
   - What we know: pg_cron was available on Supabase Pro tier in 2024; status on free tier in 2026 is unverified
   - What's unclear: Whether the `feed_hot` materialized view in `004_views.sql` can use pg_cron for refresh scheduling on free tier
   - Recommendation: Scaffold `004_views.sql` with a manual refresh function; document that pg_cron refresh schedule requires verification in the Supabase dashboard's Database Extensions page. If unavailable, use a weekly Edge Function invoked by GitHub Actions as fallback.

2. **Supabase Management API usage endpoint path**
   - What we know: Supabase Management API exists at `api.supabase.com/v1/`; endpoint paths for usage stats were documented in 2024
   - What's unclear: Exact endpoint and required scopes for storage/bandwidth/connection metrics in 2026
   - Recommendation: The GitHub Actions workflow should include a validation step on first run; the `SUPABASE_ACCESS_TOKEN` must be a service role token with read access on the management API.

3. **shadcn/ui compatibility with Tailwind CSS 4**
   - What we know: shadcn 2025 CLI claims Tailwind 4 support; STACK.md documents this as MEDIUM confidence
   - What's unclear: Whether specific shadcn components (Avatar, DropdownMenu) have any Tailwind 4 class incompatibilities
   - Recommendation: Run `npx shadcn@latest init` as the very first scaffold step and validate that generated components render correctly before building auth UI on top.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + Testing Library (to be installed in Wave 0) |
| Config file | `vitest.config.ts` — does not exist yet |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

No existing test infrastructure detected — this is a greenfield project.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can sign up with email + password | integration (Server Action) | `npx vitest run tests/auth/signup.test.ts` | ❌ Wave 0 |
| AUTH-02 | Session persists across requests via middleware | integration (middleware) | `npx vitest run tests/auth/session.test.ts` | ❌ Wave 0 |
| AUTH-03 | User can log out | integration (Server Action) | `npx vitest run tests/auth/logout.test.ts` | ❌ Wave 0 |
| AUTH-04 | Password reset email flow | manual-only | — | Manual: verify email received + link redirects |
| AUTH-05 | Unauthenticated access to browse routes | integration (middleware) | `npx vitest run tests/auth/public-access.test.ts` | ❌ Wave 0 |
| PROF-01 | Profile update saves correctly | unit (Server Action) | `npx vitest run tests/profiles/update.test.ts` | ❌ Wave 0 |
| PROF-02 | Own published Promptys appear on profile | integration | `npx vitest run tests/profiles/own-promptys.test.ts` | ❌ Wave 0 |
| PROF-03 | Public profile accessible to anon | integration | `npx vitest run tests/profiles/public-profile.test.ts` | ❌ Wave 0 |
| PROF-04 | Points and level display correctly | unit (getLevelForPoints) | `npx vitest run tests/lib/levels.test.ts` | ❌ Wave 0 |
| INFR-01 | All tables have RLS enabled | SQL role test | `supabase db test` or psql script | ❌ Wave 0 |
| INFR-02 | point_events blocks client INSERT | SQL role test | psql: SET ROLE authenticated; INSERT → expect 42501 | ❌ Wave 0 |
| INFR-03 | Image compressed before upload | unit (browser-image-compression) | `npx vitest run tests/lib/image-compression.test.ts` | ❌ Wave 0 |
| INFR-04 | Storage bucket enforces size + MIME | manual | Supabase dashboard bucket policy check | Manual |
| INFR-05 | Monitoring cron runs and alerts | manual | Trigger workflow_dispatch; verify email alert | Manual |
| GAME-01 | Points trigger fires on like insert | SQL integration test | psql adversarial insert test | ❌ Wave 0 |
| GAME-02 | No direct INSERT to point_events from client | SQL role test | Same as INFR-02 | ❌ Wave 0 |
| GAME-05 | Duplicate like does not double-award points | SQL integration test | psql: insert same like twice; count point_events = 1 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/` (unit tests only, <5s)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite + SQL role tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `tests/auth/signup.test.ts` — covers AUTH-01
- [ ] `tests/auth/session.test.ts` — covers AUTH-02
- [ ] `tests/auth/logout.test.ts` — covers AUTH-03
- [ ] `tests/auth/public-access.test.ts` — covers AUTH-05
- [ ] `tests/profiles/update.test.ts` — covers PROF-01
- [ ] `tests/profiles/own-promptys.test.ts` — covers PROF-02
- [ ] `tests/profiles/public-profile.test.ts` — covers PROF-03
- [ ] `tests/lib/levels.test.ts` — covers PROF-04 (getLevelForPoints unit test)
- [ ] `tests/lib/image-compression.test.ts` — covers INFR-03
- [ ] `supabase/tests/rls_roles.sql` — covers INFR-01, INFR-02, GAME-02 (SQL role tests)
- [ ] `supabase/tests/triggers_idempotency.sql` — covers GAME-01, GAME-05
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react`

---

## Sources

### Primary (HIGH confidence)
- Project research files (STACK.md, ARCHITECTURE.md, PITFALLS.md) — validated during project research phase 2026-05-06
- CONTEXT.md — all locked decisions sourced from user decisions session 2026-05-06
- CLAUDE.md project rules — project-specific architecture conventions

### Secondary (MEDIUM confidence)
- @supabase/ssr documentation patterns — training data through August 2025; patterns verified against project's STACK.md which confirmed the SSR package
- Next.js 15 App Router middleware patterns — training data corroborated by STACK.md which cites official Next.js 15 release blog verification

### Tertiary (LOW confidence — flag for validation)
- Supabase Management API endpoint paths for usage monitoring — unverified in 2026; require manual validation on first GitHub Actions run
- pg_cron availability on Supabase free tier in 2026 — unverified; check dashboard Extensions page

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked by user decisions; corroborated by project research files
- Architecture: HIGH — patterns fully specified in CONTEXT.md and ARCHITECTURE.md
- Pitfalls: HIGH — sourced from dedicated PITFALLS.md with adversarial test cases
- SQL trigger patterns: HIGH — specified in CONTEXT.md with exact semantics
- Monitoring workflow: MEDIUM — GitHub Actions pattern is standard; Supabase Management API endpoint needs 2026 validation

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (stable ecosystem; Supabase free tier limits may change sooner)
