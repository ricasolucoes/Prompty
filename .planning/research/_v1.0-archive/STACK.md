# Stack Research

**Domain:** Gamified social network for AI image generation prompts (Supabase-first)
**Researched:** 2026-05-06
**Confidence:** MEDIUM-HIGH (training data through August 2025; web access unavailable for version verification)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (App Router) | Frontend framework + SSR | React 19, Turbopack stable, async params API, Server Actions — the canonical Vercel deploy target. App Router is required for RSC-based data fetching with Supabase SSR. |
| React | 19.x | UI runtime | Ships with Next.js 15. `use()` hook, improved Suspense, `useActionState` — all needed for optimistic UI on the social feed. |
| TypeScript | 5.x | Type safety | `next.config.ts` now supported natively. Essential given the dynamic `inputs_schema` JSONB — TypeScript prevents runtime schema mismatch bugs. |
| Supabase JS | 2.x (`@supabase/supabase-js`) | Database, Auth, Storage, Realtime client | The main Supabase client; handles all Postgres queries, subscriptions, file uploads. Version 2 has a stable SSR-safe API. |
| `@supabase/ssr` | latest (^0.5) | Server-side Supabase in Next.js | Replaces the deprecated `@supabase/auth-helpers-nextjs`. Creates clients for Server Components, Route Handlers, and Middleware with proper cookie handling. Required for RLS to work correctly in SSR context. |
| Tailwind CSS | 4.x | Styling | Released stable early 2025. CSS-first config (no `tailwind.config.js`), faster build with Vite/Turbopack. The dark/glassmorphism aesthetic is trivially composable. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest (CLI-based) | Headless component primitives | Always — Dialog, Sheet, Tabs, DropdownMenu, Avatar, Badge, Toast. Dark mode supported out of the box. Components are copied into the repo (not a package dep), so full customisation for glassmorphism effects. |
| Radix UI | (via shadcn) | Accessible primitives under shadcn | Included transitively via shadcn. Do not install separately. |
| Lucide React | ^0.400 | Icon set | Standard icon library for shadcn ecosystem. Consistent with the project's tech aesthetic. |
| React Hook Form | ^7.x | Form handling | Best-in-class for complex forms. Handles the dynamic `inputs_schema` fields (text, enum, number, boolean, etc.) by registering fields programmatically with `register()` and `setValue()`. |
| Zod | ^3.x | Schema validation | Pair with React Hook Form via `@hookform/resolvers/zod`. Generate Zod schemas at runtime from `inputs_schema` JSONB — validates variable completeness before submission. |
| Zustand | ^5.x | Client state management | Lightweight (no boilerplate). Use for: auth session slice, feed filter state, prompt composer draft. Avoid for server data — that belongs in RSC/Supabase. |
| TanStack Query | ^5.x | Server state / async cache | Optional but recommended for paginated feed, infinite scroll, and optimistic mutations on likes/saves. Pairs with Supabase client in Client Components. |
| `next/image` | (built-in) | Image optimisation | Use for all user-uploaded output images in the feed. Supabase Storage URLs are external — add the Supabase storage domain to `next.config.ts` `images.remotePatterns`. |
| `@supabase/realtime-js` | (via supabase-js) | Live feed updates | Included in `@supabase/supabase-js`. Use Realtime channels for live comment counts and new prompty notifications without polling. |
| `react-json-schema-form` (RJSF) | ^5.x | Dynamic JSON schema forms | For the Prompty variable editor (`inputs_schema` builder). Renders a form from a JSON Schema — saves building a custom field-type router. Use with a Tailwind theme override. **Only use if the schema builder becomes complex**; for the testing UI (variable fill-in), React Hook Form + manual field routing is simpler. |
| `cmdk` | ^1.x | Command palette | Powers the search and quick-navigate UX. Composable with shadcn `Command` component which wraps it. |
| `vaul` | ^0.9 | Drawer component | Bottom-sheet drawers for mobile prompt detail view. Native feel on touch devices. Used by shadcn `Drawer`. |
| `sonner` | ^1.x | Toast notifications | Replaces Radix Toast. Opinionated, beautiful dark-mode toasts. Pair with shadcn's Sonner wrapper. |
| `sharp` | ^0.33 | Image processing (server) | Auto-used by Next.js 15 for image optimisation in production. No manual install needed with `next start`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Dev server | Enabled by default in Next.js 15 (`next dev --turbo`). Up to 76% faster startup. Use it from day 1. |
| ESLint 9 | Linting | Next.js 15 ships with ESLint 9 support. Use flat config format (`eslint.config.mjs`). |
| Prettier | Code formatting | Add `prettier-plugin-tailwindcss` to auto-sort Tailwind class names. |
| Supabase CLI | DB migrations, local dev | Run Supabase locally via Docker. `supabase db push` for schema migrations. Essential for RLS policy development. |
| `@supabase/supabase-js` type gen | TypeScript types from DB | `supabase gen types typescript --local > types/supabase.ts` — generates typed client from schema. Run after every migration. |

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest prompty --typescript --tailwind --app --turbopack

# Core Supabase
npm install @supabase/supabase-js @supabase/ssr

# State & forms
npm install zustand @tanstack/react-query react-hook-form @hookform/resolvers zod

# UI components (shadcn CLI — copies components into repo)
npx shadcn@latest init
npx shadcn@latest add button card dialog sheet tabs dropdown-menu avatar badge command drawer

# Icons & notifications
npm install lucide-react sonner

# Dev
npm install -D supabase prettier prettier-plugin-tailwindcss
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Never — deprecated as of 2024. `@supabase/ssr` is the official replacement. |
| Tailwind CSS 4 | Tailwind CSS 3 | If the project needs to support older toolchains or if v4's CSS-first config causes issues with third-party plugins. For this project, v4 is correct. |
| shadcn/ui | Chakra UI, MUI, Mantine | If a fully pre-built component library is preferred over composable primitives. For glassmorphism and custom aesthetics, shadcn is better — full control without fighting theme overrides. |
| Zustand | Redux Toolkit | Redux only if team size demands strict action/reducer discipline. For a focused MVP, Zustand's minimal API is faster to ship. |
| TanStack Query | SWR | SWR is simpler but TanStack Query has better devtools, background refetch, and mutation lifecycle hooks. Prefer TanStack for infinite-scroll feed. |
| React Hook Form | Formik | Formik re-renders on every keystroke; RHF uses uncontrolled inputs. For dynamic schema forms, RHF's `useFieldArray` is superior. |
| Zod | Yup | Zod has better TypeScript inference and composability. Generating schemas from `inputs_schema` JSONB is cleaner with Zod's builder API. |
| Next.js App Router | Pages Router | Pages Router is legacy. App Router enables RSC, Server Actions, streaming — all needed for a performant social feed with SEO. |
| Vercel | Netlify | Both work. Vercel has zero-config Next.js 15 support, Edge Middleware, and Supabase integration. Prefer Vercel unless cost is a factor. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Officially deprecated since mid-2024. Will not receive updates. Cookie handling is broken in Next.js 15's async request API. | `@supabase/ssr` |
| Prisma | Adds an ORM layer over Supabase's Postgres, bypassing RLS (Prisma queries run as service role). Double-abstraction kills the Supabase value proposition. | Supabase client directly + typed generated types |
| Drizzle ORM | Same RLS bypass problem as Prisma. Only useful when you own the Postgres instance without RLS. | Supabase client |
| GraphQL / Apollo | Over-engineered for a Supabase project. Supabase's PostgREST API + Realtime covers all query patterns without a GraphQL layer. | Supabase client queries |
| Redux Toolkit | Boilerplate overhead not justified for MVP scope. The social feed state fits in Zustand + TanStack Query. | Zustand + TanStack Query |
| `create-react-app` | Unmaintained. Dead ecosystem. | `create-next-app` |
| `styled-components` / Emotion | Runtime CSS-in-JS has poor performance in React Server Components and conflicts with RSC. | Tailwind CSS |
| `next-auth` (Auth.js) | Redundant when using Supabase Auth. Creates two parallel auth systems with JWT conflicts. | `@supabase/ssr` + Supabase Auth |
| `react-beautiful-dnd` | Unmaintained since 2022. Breaks with React 19 strict mode. | `@dnd-kit/core` if drag-and-drop is needed |

---

## Stack Patterns by Variant

**For server-rendered public pages (feed, prompty detail, profile):**
- Fetch data in Server Components via `createServerClient` from `@supabase/ssr`
- Use RLS to scope queries — anonymous users get public rows automatically
- Stream with Suspense boundaries for progressive loading

**For authenticated mutations (like, save, create, remix):**
- Use Server Actions with `createServerClient` — keeps service credentials server-only
- Validate with Zod before calling Supabase
- Use `useActionState` (React 19) for optimistic feedback in the UI

**For real-time features (comment counts, feed notifications):**
- Use Supabase Realtime in Client Components with `createBrowserClient` from `@supabase/ssr`
- Subscribe to `postgres_changes` on relevant tables
- Invalidate TanStack Query cache on change events

**For dynamic variable forms (Prompty test fill-in):**
- Parse `inputs_schema` JSONB on the client
- Use `useForm` from React Hook Form, register fields programmatically in a `useEffect` after schema parse
- Generate Zod schema at runtime using `z.object()` builder based on field types

**For image upload (test result images):**
- Upload to Supabase Storage from the client using `supabase.storage.from('test-images').upload()`
- Store the returned path in `prompty_tests.output_image_url`
- Render via `next/image` with the Supabase Storage public URL

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15 | React 19 (App Router) | App Router uses React 19 RC; stable for production per Next.js team. |
| `@supabase/ssr` ^0.5 | Next.js 15 | Handles the async `cookies()` API introduced in Next.js 15 correctly. |
| Tailwind CSS 4 | Next.js 15 | Native CSS-first config; no `postcss.config.js` needed. Use `@import "tailwindcss"` in globals.css. |
| React Hook Form 7 | React 19 | Fully compatible; `useActionState` can be used alongside RHF without conflict. |
| TanStack Query 5 | React 19 | v5 supports React 19 Suspense natively. |
| shadcn/ui | Tailwind 4 | shadcn v2 (2025 CLI) supports Tailwind 4. Run `npx shadcn@latest` to get the updated version. |
| Zustand 5 | React 19 | v5 dropped class-based stores; fully compatible with concurrent features. |

---

## Glassmorphism Implementation Notes

The project's visual identity (Midnight Ink `#090A14`, Electric Violet `#7C3AED`, Prompt Cyan `#22D3EE`) maps naturally to Tailwind 4 CSS variables:

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --color-midnight: #090A14;
  --color-violet: #7C3AED;
  --color-cyan: #22D3EE;
  --color-coral: #FF6B4A;
  --color-mint: #34D399;
}
```

Glass cards are achieved with Tailwind utilities — no extra library needed:

```
bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl
```

shadcn's `Card` component accepts `className` overrides, so glassmorphism is applied at the call site without modifying the primitive.

---

## Sources

- Next.js 15 release blog (`nextjs.org/blog/next-15`) — verified via WebFetch: React 19, Turbopack stable, async request APIs, next.config.ts support — **HIGH confidence**
- `@supabase/ssr` package — training data (replaces `auth-helpers-nextjs`, cookie-based server client) — **MEDIUM confidence** (verify current version with `npm info @supabase/ssr`)
- shadcn/ui — training data (CLI-based, Tailwind 4 support in 2025 CLI) — **MEDIUM confidence**
- Tailwind CSS 4 — training data (CSS-first, released stable 2025) — **MEDIUM confidence**
- React Hook Form + Zod — training data — **HIGH confidence** (stable ecosystem, no major changes expected)
- TanStack Query v5 — training data — **HIGH confidence** (v5 released 2024, widely adopted)
- Zustand v5 — training data — **MEDIUM confidence** (v5 released late 2024)

---

*Stack research for: Promptys — gamified social network for AI image generation prompts*
*Researched: 2026-05-06*
