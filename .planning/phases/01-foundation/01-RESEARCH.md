# Phase 1: L1 Iniciante — Feed e Copiar — Research

**Researched:** 2026-05-07
**Domain:** Tauri 2.0 + React 19 + Supabase (Auth, RLS, SQL triggers, Storage) + Zustand + React Router v7 + Tailwind v4 + Vitest
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Sistema de Níveis:** 5 níveis no schema, 3 com UX distinta no MVP. Thresholds como constantes TypeScript em `src/lib/constants/levels.ts`. `profiles.level` e `profiles.points` atualizados por triggers SQL, nunca por código de aplicação.
- **Pontos via triggers SQL exclusivamente.** `point_events` tem `WITH CHECK (false)` para roles `anon` e `authenticated`. Unique constraint em `(user_id, event_type, ref_id)` com `ON CONFLICT DO NOTHING`.
- **Schema completo desde a Fase 1:** todas as tabelas criadas agora (profiles, promptys, prompty_versions, prompty_tests, prompty_ratings, prompty_likes, prompty_saves, prompty_remixes, point_events) com RLS em todas.
- **Card L1 estilo Facebook:** sem border-radius, full-bleed, sem chips técnicos, prompt truncado em 3 linhas.
- **Prompt resolvido para L1:** variáveis substituídas pelos valores default de `inputs_schema`. Nenhum formulário de variáveis.
- **Função `resolveBeginner(template, inputs_schema)` com `replaceAll` no frontend.**
- **Cópia livre, sem auth.** Anônimo pode copiar. Anônimo não vê: curtir, avaliar, salvar.
- **Auth:** email + password, sem OAuth no MVP. Trigger Supabase cria `profiles` no signup.
- **Sessão:** rolling 7 dias via `supabase.auth.onAuthStateChange`, registrado no app root.
- **Onboarding L1:** 1 slide único. Sem tour.
- **Tab bar L1:** 2 abas (Feed + Perfil). Novas abas aparecem animadas ao subir de nível, nunca cinza/desabilitadas.
- **Header L1:** logo + badge de nível (L1 chip `#22D3EE`). Sem PointsPill, sem busca, sem Criar.
- **Perfil L1:** linguagem de funcionalidades, não pontos. Progress bar sem números.
- **Modal Level Up:** animação pop `cubic-bezier(.2,1.4,.4,1)`, mostrado 1x, para L2 unlock.
- **Regra de UX absoluta:** em nenhum momento o usuário vê cadeado, feature desabilitada ou botão cinza. O que não pode usar não é renderizado.
- **Design system:** tokens CSS V2 (`Promptys v2.html`), definidos em `src/index.css`, classes `theme-light` / `theme-dark` no `<html>`.
- **Seed:** 6 promptys do protótipo (data.jsx) inseridos no banco com `template` e `inputs_schema`.
- **TweaksPanel:** apenas em `NODE_ENV === 'development'` ou flag dev. Nunca em produção.
- **Monitoramento:** GitHub Actions weekly cron com Supabase Management API, alertas em 70% e 90%.
- **Routing:** React Router v6+ (v7 instalado). Protected routes via `<PrivateRoute>` que verifica Zustand auth store.
- **Build:** Vite + React; Tauri como wrapper nativo. `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- **Supabase client único:** `src/lib/supabase.ts`, client-side only, sem split server/browser.

### Claude's Discretion

- Skeleton loading design dos cards
- Exato comportamento do banner pós-cópia (toast vs banner fixo no bottom) — UI-SPEC diz: banner inline dentro do card com `fadeIn .25s`
- Comportamento do "Ver mais" no texto do prompt — UI-SPEC diz: expand inline, sem collapse
- Compressão de imagem no upload de resultado (client-side, target ≤200 KB WebP)
- Tratamento de erros de auth (mensagens de erro de signup/login)

### Deferred Ideas (OUT OF SCOPE)

- Filtros de feed por categoria/modelo (Phase 2)
- Desbloqueio L2 com telas novas (Busca, Salvos) (Phase 2)
- Avaliação multi-dimensional (Phase 2)
- Variáveis editáveis na tela de detalhe (Phase 2)
- Tela de detalhe completa com abas (Phase 2)
- Modal LevelUp: as features listadas (Busca, Salvos) são da Phase 2 — o modal existe agora mas aponta para o futuro
- Badges visuais no perfil (Phase 2+)
- Missões diárias/semanais (Phase 2+)
- Criação de prompty L3 (Phase 3)
- Rankings (Phase 3)
- Remix (Phase 3)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with email and password | Supabase Auth email/password signup; trigger auto-creates `profiles` row |
| AUTH-02 | User can log in and stay logged in across browser sessions | `supabase.auth.onAuthStateChange` in app root; Zustand auth store; rolling 7-day session |
| AUTH-03 | User can log out from any page | `supabase.auth.signOut()` from any screen; clears Zustand store |
| AUTH-04 | User can reset password via email link | `supabase.auth.resetPasswordForEmail()` — built-in Supabase flow |
| AUTH-05 | Unauthenticated users can browse feed and view Prompty detail pages | RLS `SELECT` policy for `anon` role on `promptys`; no auth gate on feed route |
| FEED-01 | Visitor sees vertical feed with cover image, title, category badge, and prompt preview | FeedCard component per UI-SPEC; reads from `promptys` table with RLS SELECT for anon |
| FEED-02 | "Como funciona" card at top for new/unauth users | WelcomeStrip component; conditional render based on auth state + first-session flag |
| FEED-03 | Visitor can open prompty detail showing beginner_prompt in full + Copiar button | L1 card expands inline ("Ver mais"); no separate detail route in L1 |
| FEED-04 | User can copy full beginner_prompt with one tap | `navigator.clipboard.writeText(resolveBeginner(...))` — Clipboard API in Tauri WebView |
| FEED-05 | Feed uses cursor-based keyset pagination — no OFFSET | Supabase `.range()` with cursor via `created_at` + `id`; infinite scroll pattern |
| SOCL-01 | Authenticated user can save (bookmark) a Prompty | INSERT into `prompty_saves(user_id, prompty_id)` via supabase-js; RLS INSERT for authenticated |
| SOCL-02 | Authenticated user can view their saved Promptys | SELECT from `prompty_saves` with JOIN on `promptys`; shown in Profile recents grid |
| SOCL-03 | Authenticated user can mark feedback on a Prompty | INSERT into `prompty_tests(rating, notes, image_url)`; trigger awards +5p |
| PROF-01 | User can set username, avatar, and bio on their profile | UPDATE `profiles` with RLS UPDATE own row |
| PROF-02 | User profile displays level badge and published Promptys (L3 only) | Profile screen reads `profile.level` from Zustand/Supabase; L1 shows minimal variant |
| PROF-03 | Any visitor can view a user's public profile | RLS SELECT on `profiles` for all; public route `/profile/:username` |
| LEVL-01 | System tracks user actions via SQL triggers; points not shown to L1 | SQL triggers on `prompty_tests`, `prompty_likes`, `prompty_saves` → `point_events` → `profiles.points` |
| LEVL-02 | System evaluates L2 unlock criteria | Frontend checks `levelOf(profile.points)` after each action refresh; L2 at 50p |
| LEVL-03 | System shows discrete unlock message when L2 criteria met | LevelUpModal component; triggered when `levelOf()` returns higher level than stored |
| LEVL-04 | System evaluates L3 unlock criteria | `levelOf(points)` with L3 threshold 250p; same detection pattern as L2 |
| LEVL-05 | Level transitions recorded in unlock_events table | `unlock_events` table INSERT via SQL trigger when `profiles.level` changes |
| LEVL-06 | L1 interface never shows ranking, points, badges, comments, remix, variables | Conditional rendering based on `profile.level`; DOM exclusion per UI-SPEC "Must NOT Render" |
| LEVL-07 | Advanced features appear progressively — never disabled/grayed-out | Tab bar renders only L1 tabs; new tabs animate in on level-up, never show locked state |
| INFR-01 | All tables have RLS with explicit policies | Supabase migration files; one policy per role per operation per table |
| INFR-02 | Action tracking via SQL triggers in immutable events table | `point_events` INSERT trigger on `prompty_tests`, `prompty_likes`, `prompty_saves` |
| INFR-03 | Client-side image compression before upload (max 2 MB → ≤200 KB WebP) | `src/lib/images/compress.ts` using Canvas API + `toBlob('image/webp', 0.85)` |
| INFR-04 | Supabase Storage enforces file size limit and allowed MIME types | Storage bucket policy: max 2 MB, MIME whitelist `image/webp, image/jpeg, image/png` |
| INFR-05 | Usage monitoring GitHub Actions weekly cron | Supabase Management API; GitHub Actions scheduled workflow |
</phase_requirements>

---

## Summary

Phase 1 delivers the complete L1 experience on top of a mostly-empty project scaffold. The codebase already has the core packages installed and configured: `@supabase/supabase-js` 2.50+ with a typed client, React Router v7, Zustand 5, Tailwind v4, and Vitest. The Supabase client singleton exists at `src/lib/supabase.ts` but the database schema is entirely absent — the `database.types.ts` is a placeholder. The entire domain layer (schema, RLS, triggers, seed, hooks, components, routing, stores) must be built from scratch in this phase.

The architectural split is clear: **Supabase** owns all data persistence, auth, and event recording via SQL triggers; **React** owns all UI state and rendering logic; **Zustand** bridges auth state and level state between Supabase and components; **React Router v7** handles routing and protected routes. There is no backend, no SSR, and no custom server — this is a pure SPA wrapped in Tauri. The canonical UI reference is `docs/planning/prototypes/Promptys v2.html` and `01-UI-SPEC.md`; both must be treated as the ground truth for every visual decision.

The most critical technical constraint is the points/triggers system: `point_events` is append-only, written only by Postgres triggers (role `postgres`), with a `WITH CHECK (false)` RLS policy blocking all client writes. The frontend never touches `point_events` or `profiles.points` directly. The gamification engine exists entirely in SQL and is invisible to L1 users.

**Primary recommendation:** Build in six sequential layers — (1) Supabase schema + RLS + triggers + seed, (2) auth layer (Supabase Auth + Zustand store + protected routes), (3) level constants and resolver, (4) core UI primitives ported from ui.jsx, (5) FeedScreen with FeedCard as primary component, (6) ProfileScreen L1 + LevelUpModal.

---

## Standard Stack

### Core

| Library | Version (installed) | Version (registry) | Purpose | Why Standard |
|---------|--------------------|--------------------|---------|--------------|
| `@supabase/supabase-js` | ^2.50.0 | 2.105.3 | Database, Auth, Storage, Realtime | Only backend; type-safe via generated `database.types.ts` |
| `react` + `react-dom` | ^19.1.0 | latest 19.x | UI rendering | Project decision; React 19 concurrent features available |
| `react-router-dom` | ^7.6.0 | 7.15.0 | Client-side routing + protected routes | Installed; v7 is backwards-compatible with v6 patterns |
| `zustand` | ^5.0.5 | 5.0.13 | Auth state, level state, feed state | Installed; minimal API, no boilerplate |
| `@tanstack/react-query` | ^5.80.0 | 5.100.9 | Data fetching + cache + pagination | Already installed; use for feed queries with cursor-based pagination |
| `tailwindcss` | ^4.1.6 | 4.2.4 | Utility-first styling | Project decision; v4 CSS-first config |
| `zod` | ^3.24.0 | 3.25.x | Schema validation for form inputs | Installed; use for auth form validation |
| `@tauri-apps/api` | ^2.5.0 | 2.11.0 | Clipboard, native bridge | Tauri 2 API for `invoke` and `clipboard` |

### Supporting

| Library | Version (installed) | Purpose | When to Use |
|---------|---------------------|---------|-------------|
| `clsx` + `tailwind-merge` | ^2.1.1 / ^3.3.0 | Conditional class merging | Every component — use `cn()` utility |
| `class-variance-authority` | ^0.7.1 | Variant-based component API | If components need variant props (e.g. Button sizes) |
| `vitest` | ^3.1.0 | Unit testing | `resolveBeginner`, `levelOf`, store logic |
| `@testing-library/react` | ^16.3.0 | Component testing | FeedCard interactions |
| `supabase` (CLI) | ^2.23.0 | Migrations, type generation | `pnpm gen:types` after schema changes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tanstack/react-query` | `useSWR` | react-query already installed; superior for pagination + mutation tracking |
| Custom `cn()` | direct `clsx` | `tailwind-merge` prevents class conflicts; always use `cn()` |
| Inline SVG icons | `lucide-react` | lucide-react is installed but UI-SPEC mandates custom SVG inline icons per prototype; use inline SVG |
| Canvas API compress | `browser-image-compression` | Canvas + `toBlob` is zero-dependency; sufficient for ≤200 KB WebP target |

**Installation:** All packages already installed. No new dependencies needed for Phase 1.

**Version verification (npm registry, 2026-05-07):**
- `@supabase/supabase-js`: installed ^2.50.0, registry 2.105.3 — compatible range, no action needed
- `@tauri-apps/api`: installed ^2.5.0, registry 2.11.0 — compatible
- `react-router-dom`: installed ^7.6.0, registry 7.15.0 — compatible
- `zustand`: installed ^5.0.5, registry 5.0.13 — compatible
- `tailwindcss`: installed ^4.1.6, registry 4.2.4 — compatible
- `vitest`: installed ^3.1.0, registry 4.1.5 — **installed version is 3.x; planner should note this**

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── supabase.ts            # EXISTS — typed client singleton
│   ├── constants/
│   │   └── levels.ts          # LEVELS array + levelOf() — create Wave 0
│   ├── prompty/
│   │   └── template.ts        # resolveBeginner() — create Wave 0
│   └── images/
│       └── compress.ts        # Canvas → WebP compression
├── stores/
│   ├── auth.store.ts          # Zustand: session, user, loading
│   └── level.store.ts         # Zustand: current level, levelUp detection
├── hooks/
│   ├── useAuth.ts             # Auth actions (signIn, signUp, signOut, resetPassword)
│   ├── useFeed.ts             # react-query infinite query for feed
│   ├── useProfile.ts          # Profile data + update
│   └── useLike.ts             # Optimistic like toggle
├── components/
│   ├── ui/                    # Primitive components (ported from ui.jsx)
│   │   ├── Icon.tsx           # Inline SVG icon with name prop
│   │   ├── Avatar.tsx         # Initials + color circle
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Toast.tsx
│   ├── feed/
│   │   ├── FeedCard.tsx       # Primary L1 component
│   │   ├── SkeletonCard.tsx   # Shimmer loading
│   │   ├── WelcomeStrip.tsx   # "Como funciona" card
│   │   └── PostCopyBanner.tsx # Inline post-copy state
│   ├── prompty/
│   │   └── RateSheet.tsx      # Bottom sheet rating modal
│   ├── layout/
│   │   ├── AppHeader.tsx      # Sticky header L1
│   │   ├── TabBar.tsx         # 2-tab bar L1
│   │   └── PrivateRoute.tsx   # Auth guard
│   └── modals/
│       └── LevelUpModal.tsx   # Level-up celebration
├── pages/
│   ├── FeedPage.tsx           # Feed screen
│   ├── ProfilePage.tsx        # Profile screen L1
│   ├── LoginPage.tsx          # Auth forms
│   ├── SignupPage.tsx
│   └── ResetPasswordPage.tsx
├── types/
│   └── database.types.ts      # EXISTS (placeholder — regenerate after migrations)
├── index.css                  # EXISTS — add CSS custom properties + animations here
├── App.tsx                    # Root: router setup + auth listener
└── main.tsx                   # EXISTS
```

### Pattern 1: Zustand Auth Store with Supabase Listener

**What:** Single source of truth for auth state, initialized once in App root via `onAuthStateChange`.
**When to use:** Every component that needs to know if user is logged in or what their profile is.

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}))

// In App.tsx — register ONCE at app root
supabase.auth.onAuthStateChange(async (_event, session) => {
  const user = session?.user ?? null
  useAuthStore.getState().setUser(user)
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    useAuthStore.getState().setProfile(data)
  } else {
    useAuthStore.getState().setProfile(null)
  }
})
```

### Pattern 2: Cursor-Based Pagination with React Query

**What:** Infinite scroll using `created_at` + `id` as cursor. No OFFSET queries.
**When to use:** Feed pagination (FEED-05).

```typescript
// src/hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 10

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('promptys')
        .select(`*, profiles(name, avatar_url)`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE)

      if (pageParam) {
        // cursor: { created_at: string, id: string }
        query = query.or(
          `created_at.lt.${pageParam.created_at},and(created_at.eq.${pageParam.created_at},id.lt.${pageParam.id})`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      const last = lastPage[lastPage.length - 1]
      return last ? { created_at: last.created_at, id: last.id } : undefined
    },
    initialPageParam: undefined as { created_at: string; id: string } | undefined,
  })
}
```

### Pattern 3: SQL Trigger Chain (points engine)

**What:** Frontend inserts into action tables; triggers do all the point math.
**When to use:** Any user action that generates points (copy, like, rate).

```sql
-- Trigger: award +5p when prompty_tests row is inserted
CREATE OR REPLACE FUNCTION award_points_on_test()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO point_events(user_id, event_type, points, ref_id)
  VALUES (NEW.user_id, 'rate', 5, NEW.prompty_id)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

  UPDATE profiles
  SET points = (SELECT COALESCE(SUM(points), 0) FROM point_events WHERE user_id = NEW.user_id),
      level   = (SELECT level_from_points((SELECT COALESCE(SUM(points), 0) FROM point_events WHERE user_id = NEW.user_id)))
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;
```

The frontend's job is just to INSERT into `prompty_tests`. The trigger handles everything else.

### Pattern 4: `resolveBeginner` — Template Rendering

**What:** Substitutes `{{key}}` placeholders with default values from `inputs_schema`. Single source of truth.
**When to use:** Any place that displays the L1 prompt text.

```typescript
// src/lib/prompty/template.ts
export interface InputField {
  key: string
  label: string
  type: 'text' | 'image' | 'enum' | 'number'
  required?: boolean
  default?: string | number
  value?: string | number  // prototype uses 'value' as default
  options?: string[]
  placeholder?: string
}

export function resolveBeginner(template: string, inputs: InputField[]): string {
  return inputs.reduce((acc, field) => {
    const val = field.value ?? field.default ?? ''
    return acc.replaceAll(`{{${field.key}}}`, String(val))
  }, template)
}
```

Note: The prototype `data.jsx` uses `value` as the default field; the schema in CONTEXT.md uses `default`. The resolver must handle both to be safe during seed.

### Pattern 5: Level Detection and LevelUp Modal

**What:** After each profile refresh, compare new level to stored level in Zustand. Show modal once per crossing.
**When to use:** After any action that might change `profile.points`.

```typescript
// src/stores/level.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LevelStore {
  shownLevelUps: string[]   // list of level IDs already shown (persisted)
  markShown: (levelId: string) => void
  needsLevelUpModal: (newLevelId: string) => boolean
}

export const useLevelStore = create<LevelStore>()(
  persist(
    (set, get) => ({
      shownLevelUps: [],
      markShown: (levelId) =>
        set((s) => ({ shownLevelUps: [...s.shownLevelUps, levelId] })),
      needsLevelUpModal: (newLevelId) =>
        !get().shownLevelUps.includes(newLevelId),
    }),
    { name: 'promptys-level-store' }
  )
)
```

### Pattern 6: PrivateRoute Guard

**What:** Wrapper that reads Zustand auth store and redirects unauthenticated users.
**When to use:** Any route that requires auth (profile edit, etc.).

```typescript
// src/components/layout/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function PrivateRoute() {
  const { user, loading } = useAuthStore()
  if (loading) return null  // or skeleton
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
```

### Pattern 7: Optimistic Like Toggle

**What:** Update UI immediately on like tap; sync to Supabase; revert on error.
**When to use:** Like button in FeedCard.

```typescript
// In FeedCard or useLike hook
const [liked, setLiked] = useState(initialLiked)

async function toggleLike() {
  const next = !liked
  setLiked(next)  // optimistic
  const { error } = next
    ? await supabase.from('prompty_likes').insert({ user_id, prompty_id })
    : await supabase.from('prompty_likes').delete()
        .match({ user_id, prompty_id })
  if (error) setLiked(!next)  // revert on error
}
```

### Anti-Patterns to Avoid

- **NEVER insert into `point_events` from frontend code.** The RLS `WITH CHECK (false)` will block it silently. All points flow through triggers.
- **NEVER update `profiles.points` or `profiles.level` from frontend.** These are trigger-maintained materialized columns.
- **NEVER use `.offset()` or `.range(offset, limit)` with offset for pagination.** Use cursor-based (FEED-05).
- **NEVER render locked/greyed features for L1.** Conditional rendering based on level, no disabled states.
- **NEVER import the Supabase client anywhere except through `@/lib/supabase`.** One singleton.
- **NEVER use `window.fetch` directly.** Use supabase client for all data; Tauri invoke for native features.
- **NEVER show `profiles.points` as a number in L1 UI.** Only the progress bar (with feature-unlock language).
- **NEVER use inline style objects** when Tailwind classes + CSS custom properties can do it. Port from prototype JSX style objects to Tailwind.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT refresh logic | `supabase.auth.onAuthStateChange` | Handles refresh, persistence, cross-tab sync |
| Data fetching with cache | Custom fetch + useState | `@tanstack/react-query` | Deduplication, background refresh, pagination state |
| Points calculation | Frontend arithmetic on `point_events` | SQL trigger + `profiles.points` column | Idempotent, server-authoritative, RLS-safe |
| Image compression | Custom resize algorithm | Canvas API `toBlob('image/webp', quality)` | Browser-native, zero deps, output control |
| Form validation | Custom regex validators | `zod` schema + parse | Type inference, composable, already installed |
| Clipboard write | `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Modern API, Promise-based, works in Tauri WebView |
| Theme switching | `localStorage` + manual DOM manipulation | CSS class on `<html>` (`theme-light`/`theme-dark`) | Defined in UI-SPEC; CSS variables cascade automatically |
| Level detection | Custom point threshold checks | `levelOf(points)` from `src/lib/constants/levels.ts` | Single source of truth; reused across components |

**Key insight:** The SQL trigger engine eliminates an entire class of frontend complexity. The frontend is a pure view layer — it records user actions (INSERT into action tables) and reads results (SELECT profiles.points). All business logic lives in Postgres.

---

## Common Pitfalls

### Pitfall 1: `point_events` RLS blocks all frontend inserts silently

**What goes wrong:** Developer tries to insert a copy event from the frontend to track usage. Supabase returns no error (Postgres returns 0 rows affected) because RLS `WITH CHECK (false)` silently drops the insert for `authenticated` and `anon` roles.
**Why it happens:** Supabase RLS `WITH CHECK` on INSERT policies evaluates to false, causing the insert to be silently dropped without an error response by default.
**How to avoid:** ALL inserts to `point_events` must come from SQL triggers with `SECURITY DEFINER` running as role `postgres`. The only frontend inserts are to `prompty_tests`, `prompty_likes`, `prompty_saves`.
**Warning signs:** Points not updating, but no error in the console. Test by checking `point_events` in Supabase Studio directly.

### Pitfall 2: `navigator.clipboard.writeText` requires HTTPS or localhost in some WebViews

**What goes wrong:** Clipboard write fails silently in Tauri Android WebView on some devices.
**Why it happens:** Clipboard API requires secure context. Tauri dev mode uses `localhost` which qualifies, but production WebViews on Android may require explicit configuration.
**How to avoid:** Use `@tauri-apps/api/clipboard` as fallback: `import { writeText } from '@tauri-apps/api/clipboard'`. Wrap in try/catch with fallback to `navigator.clipboard`.
**Warning signs:** Copy button appears to work (button state changes) but clipboard is empty on device testing.

### Pitfall 3: Tailwind v4 CSS-first configuration

**What goes wrong:** Developer tries to add custom tokens in `tailwind.config.ts`. In Tailwind v4, configuration moved to CSS `@theme` directive.
**Why it happens:** Tailwind v4 is a major breaking change from v3. The JS config file is minimal or absent.
**How to avoid:** Add custom tokens via `@theme` in `src/index.css`:
```css
@import "tailwindcss";
@theme {
  --color-primary: #7C3AED;
  /* etc */
}
```
CSS custom properties for design tokens are defined in `.theme-light` / `.theme-dark` classes. The `@theme` directive handles Tailwind utility class generation.
**Warning signs:** `bg-primary` utility doesn't work; custom color classes missing.

### Pitfall 4: React Router v7 breaking changes from v6

**What goes wrong:** Code written using v6 patterns (`<Routes>`, `<Route element={}>`) may work, but v7 has new APIs (typesafe routes, `createBrowserRouter` with `HydrateFallback`).
**Why it happens:** v7 was installed (^7.6.0) but documentation and patterns may mix v6 and v7 APIs.
**How to avoid:** Use `createBrowserRouter` pattern (works in both v6 and v7). Avoid v7-only features (file-based routing) since this is not a framework-mode app.
**Warning signs:** Type errors on route components; `useLoaderData` types are wrong.

### Pitfall 5: Supabase Auth session not available on first render

**What goes wrong:** App flashes login screen on first load even for authenticated users.
**Why it happens:** `onAuthStateChange` fires asynchronously; initial state is `loading: true`, `user: null`. Protected routes see null and redirect before the session is restored.
**How to avoid:** Initialize auth store with `loading: true`. In `PrivateRoute`, return `null` (or skeleton) when `loading === true`. Only redirect when `loading === false && user === null`.
**Warning signs:** Authenticated users see the login page briefly on refresh.

### Pitfall 6: `inputs_schema` column name vs prototype `inputs` field

**What goes wrong:** The schema uses `inputs_schema` (JSONB) but `data.jsx` uses `inputs` as the field name. The seed SQL and the TypeScript types may not align.
**Why it happens:** The prototype was built before the schema was finalized; field names diverged.
**How to avoid:** Always use `inputs_schema` as the column name. When seeding from `data.jsx` mock data, map `inputs → inputs_schema`. The `resolveBeginner` function takes `inputs_schema` value parsed from JSONB.
**Warning signs:** `resolveBeginner` returns unresolved `{{key}}` placeholders; type errors on `prompty.inputs_schema`.

### Pitfall 7: Supabase `gen:types` drift

**What goes wrong:** The current `database.types.ts` is a stub placeholder. All typed queries fail at the TS compiler level.
**Why it happens:** Schema hasn't been pushed to Supabase yet. `gen:types` requires the schema to exist in the linked project.
**How to avoid:** Run migrations first (`supabase db push`), then `pnpm gen:types`. Schema migrations must be authored as SQL migration files in `supabase/migrations/`. Do this in Wave 0 before writing any TypeScript that touches Supabase tables.
**Warning signs:** `supabase.from('profiles')` has type `unknown`; autocomplete doesn't show columns.

### Pitfall 8: CSS custom properties vs Tailwind utility class conflicts

**What goes wrong:** Using `bg-[var(--surface)]` vs direct CSS `background: var(--surface)` inconsistently. Some properties work in arbitrary values, some don't.
**How to avoid:** Use CSS custom properties for anything theme-sensitive (colors, backgrounds). Use Tailwind utilities for spacing, typography, border-radius, flex layout. Don't mix `style={{}}` objects with Tailwind for the same property.

---

## Code Examples

### Complete SQL Migration Structure

```sql
-- supabase/migrations/001_initial_schema.sql

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE,
  name       TEXT,
  avatar_url TEXT,
  level      TEXT NOT NULL DEFAULT 'L1' CHECK (level IN ('L1','L2','L3','L4','L5')),
  points     INTEGER NOT NULL DEFAULT 0,
  streak     INTEGER NOT NULL DEFAULT 0,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- point_events (immutable, trigger-only writes)
CREATE TABLE point_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points     INTEGER NOT NULL,
  ref_id     UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_type, ref_id)
);

ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "point_events_select_own" ON point_events FOR SELECT USING (auth.uid() = user_id);
-- No INSERT policy for anon/authenticated — triggers run as postgres (SECURITY DEFINER)

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles(id, name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### CSS Custom Properties + Tailwind v4 Setup

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

/* Design tokens — applied via class on <html> */
.theme-light {
  --bg:           #FAF9F5;
  --surface:      #FFFFFF;
  --surface-2:    #F4F1EA;
  --header-bg:    rgba(250, 249, 245, 0.92);
  --line:         #E7E3DA;
  --line-strong:  #D9D4C8;
  --text-1:       #181818;
  --text-2:       #555555;
  --text-3:       #8A8784;
  --primary:      #7C3AED;
  --primary-soft: rgba(124, 58, 237, 0.10);
  --like:         #FF3B6B;
}

.theme-dark {
  --bg:           #0E0F18;
  --surface:      #161826;
  --surface-2:    #1C1F30;
  --header-bg:    rgba(14, 15, 24, 0.90);
  --line:         #262A3C;
  --line-strong:  #2F3447;
  --text-1:       #F4F5FA;
  --text-2:       #B0B5C5;
  --text-3:       #6D7388;
  --primary:      #9D6BFA;
  --primary-soft: rgba(157, 107, 250, 0.16);
  --like:         #FF5C84;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pop {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.screen { animation: fadeIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
```

### `cn()` Utility

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Image Compression (INFR-03)

```typescript
// src/lib/images/compress.ts
export async function compressToWebP(
  file: File,
  maxKB = 200,
  quality = 0.85
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  // Scale down if needed (maintain aspect ratio)
  const MAX_DIM = 1200
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
  canvas.width  = Math.round(bitmap.width  * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Compression failed'))
        if (blob.size <= maxKB * 1024) return resolve(blob)
        // Retry with lower quality
        canvas.toBlob(
          (b2) => b2 ? resolve(b2) : reject(new Error('Compression failed')),
          'image/webp', quality * 0.7
        )
      },
      'image/webp',
      quality
    )
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand 4 API | Zustand 5 — `create` API unchanged, but `devtools` middleware API changed | Zustand 5.0 (2024) | Use `devtools` from `zustand/middleware`; `redux` devtools still work |
| React Router v6 `<Routes>` + `<Route>` | React Router v7 `createBrowserRouter` recommended | v7.0 (2024) | `createBrowserRouter` gives type safety; `<Routes>` still works |
| Tailwind v3 `tailwind.config.js` | Tailwind v4 CSS-first `@theme` in CSS file | v4.0 (2025) | No `tailwind.config.ts` needed for basic setup; `@import "tailwindcss"` replaces `@tailwind` directives |
| `supabase.auth.session()` | `supabase.auth.getSession()` async + `onAuthStateChange` | supabase-js v2.0 | Synchronous `session()` removed; always async now |
| OFFSET pagination | Cursor-based keyset pagination | Best practice | OFFSET degrades with table size; cursor is O(log n) with index |

**Deprecated/outdated:**
- `@supabase/auth-helpers-react`: Replaced by standard `@supabase/supabase-js` v2 with `onAuthStateChange`. Do not install.
- `@supabase/auth-ui-react`: Pre-built auth UI — not appropriate here since we have custom forms matching the design system.
- Tailwind `@tailwind base; @tailwind components; @tailwind utilities;` directives: Replaced by `@import "tailwindcss"` in v4.

---

## Open Questions

1. **Supabase project linked status**
   - What we know: `database.types.ts` is a placeholder; the `pnpm gen:types` command requires `supabase link --project-ref ouoxxwbiqgecaysoybpv`
   - What's unclear: Is the Supabase project already linked in the developer's local environment? Are migrations already running against the linked project?
   - Recommendation: Wave 0 must verify `supabase status` and link if needed before writing any SQL migrations.

2. **`unlock_events` table for LEVL-05**
   - What we know: REQUIREMENTS.md says "Level transitions are recorded in unlock_events table" (LEVL-05). The `data-model.md` does not list this table.
   - What's unclear: Schema of `unlock_events` — columns: `id`, `user_id`, `event_type` (`L1→L2`, `L1→L3`, etc.), `previous_level`, `new_level`, `created_at`.
   - Recommendation: Include in initial migration. This table is referenced by LEVL-05 and feeds the LevelUp modal trigger detection.

3. **Clipboard API in Tauri iOS WebView**
   - What we know: `navigator.clipboard.writeText` works in desktop Tauri and on localhost. iOS WKWebView has historically required user gesture + HTTPS.
   - What's unclear: Tauri 2.x iOS wraps WKWebView — does the clipboard permission need explicit Tauri plugin configuration?
   - Recommendation: Test early on iOS. If `navigator.clipboard` fails, fall back to `@tauri-apps/api/clipboard` `writeText`. Add try/catch around clipboard call.

4. **GitHub Actions Supabase Management API token**
   - What we know: INFR-05 requires weekly cron using Supabase Management API to check usage.
   - What's unclear: The `SUPABASE_ACCESS_TOKEN` secret for GitHub Actions has not been documented.
   - Recommendation: Document in Wave 0 setup. The Supabase Management API endpoint is `https://api.supabase.com/v1/projects/{ref}/usage`.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (installed as `^3.1.0`) |
| Config file | None found — `vitest` config lives in `vite.config.ts` or needs `vitest.config.ts` |
| Quick run command | `pnpm test:run -- --reporter=dot` |
| Full suite command | `pnpm test:run` |
| Coverage command | `pnpm test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signUp` success creates profile | unit | `pnpm test:run -- src/hooks/useAuth.test.ts` | ❌ Wave 0 |
| AUTH-02 | `onAuthStateChange` sets Zustand store | unit | `pnpm test:run -- src/stores/auth.store.test.ts` | ❌ Wave 0 |
| AUTH-03 | `signOut` clears store | unit | `pnpm test:run -- src/stores/auth.store.test.ts` | ❌ Wave 0 |
| AUTH-04 | `resetPasswordForEmail` called with email | unit | `pnpm test:run -- src/hooks/useAuth.test.ts` | ❌ Wave 0 |
| AUTH-05 | Feed renders for unauthenticated user | unit | `pnpm test:run -- src/pages/FeedPage.test.tsx` | ❌ Wave 0 |
| FEED-04 | `resolveBeginner` substitutes all variables | unit | `pnpm test:run -- src/lib/prompty/template.test.ts` | ❌ Wave 0 |
| FEED-04 | `resolveBeginner` handles missing defaults gracefully | unit | `pnpm test:run -- src/lib/prompty/template.test.ts` | ❌ Wave 0 |
| FEED-05 | Cursor pagination query structure | unit | `pnpm test:run -- src/hooks/useFeed.test.ts` | ❌ Wave 0 |
| LEVL-01 | `levelOf(0)` returns L1; `levelOf(50)` returns L2 | unit | `pnpm test:run -- src/lib/constants/levels.test.ts` | ❌ Wave 0 |
| LEVL-02 | `levelOf(49)` returns L1; `levelOf(50)` returns L2 | unit | `pnpm test:run -- src/lib/constants/levels.test.ts` | ❌ Wave 0 |
| LEVL-06 | L1 FeedCard has no search/ranking/remix elements | unit (RTL) | `pnpm test:run -- src/components/feed/FeedCard.test.tsx` | ❌ Wave 0 |
| LEVL-07 | TabBar renders 2 tabs for L1, not 5 | unit (RTL) | `pnpm test:run -- src/components/layout/TabBar.test.tsx` | ❌ Wave 0 |
| INFR-03 | `compressToWebP` returns blob ≤ 200 KB | unit | `pnpm test:run -- src/lib/images/compress.test.ts` | ❌ Wave 0 |

Tests for SOCL, PROF, INFR-01/02/04/05 are integration/manual-only:
- **SOCL-01/02/03, PROF-01/02/03, INFR-01/02/04**: Require live Supabase; test manually via Supabase Studio + UI smoke test
- **INFR-05**: GitHub Actions — manual review of workflow file

### Sampling Rate

- **Per task commit:** `pnpm test:run -- src/lib/prompty/template.test.ts src/lib/constants/levels.test.ts`
- **Per wave merge:** `pnpm test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/prompty/template.test.ts` — covers FEED-04 (`resolveBeginner` unit tests)
- [ ] `src/lib/constants/levels.test.ts` — covers LEVL-01, LEVL-02 (`levelOf` boundary tests)
- [ ] `src/lib/images/compress.test.ts` — covers INFR-03 (image compression output size)
- [ ] `src/stores/auth.store.test.ts` — covers AUTH-02, AUTH-03
- [ ] `src/hooks/useAuth.test.ts` — covers AUTH-01, AUTH-04
- [ ] `src/components/feed/FeedCard.test.tsx` — covers LEVL-06 (no forbidden elements in L1)
- [ ] `src/components/layout/TabBar.test.tsx` — covers LEVL-07 (2 tabs for L1)
- [ ] `vitest.config.ts` — test environment config (jsdom) not yet declared; add to `vite.config.ts` or create separate file
- [ ] Framework install: already installed — no action needed

---

## Sources

### Primary (HIGH confidence)

- `docs/planning/prototypes/Promptys v2.html` — canonical UI spec for all L1 components, CSS tokens, animations
- `.planning/phases/01-foundation/01-CONTEXT.md` — locked decisions, schema, trigger design, UX rules
- `.planning/phases/01-foundation/01-UI-SPEC.md` — approved design contract: components, typography, spacing, color, interactions
- `docs/data/data-model.md` — table schemas, RLS matrix, mock data structure
- `docs/planning/prototypes/data.jsx` — seed data: 6 promptys with templates and inputs
- `docs/planning/prototypes/ui.jsx` — primitive component implementations to port
- `docs/planning/prototypes/gamification.jsx` — LevelUpModal, LEVELS array canonical implementation
- `docs/planning/prototypes/screens-feed.jsx` — FeedScreen and FeedCard implementation reference
- `package.json` — installed packages with exact versions

### Secondary (MEDIUM confidence)

- npm registry version checks (2026-05-07): `@supabase/supabase-js` 2.105.3, `react-router-dom` 7.15.0, `zustand` 5.0.13, `vitest` 4.1.5 (note: installed 3.x), `@tanstack/react-query` 5.100.9, `tailwindcss` 4.2.4

### Tertiary (LOW confidence)

- Tauri 2.x iOS clipboard behavior — not directly verified; based on known WKWebView constraints. Flag for device testing.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed; versions verified against npm registry
- Architecture patterns: HIGH — derived directly from locked CONTEXT.md decisions + approved UI-SPEC
- SQL triggers / RLS: HIGH — exact schema from data-model.md + CONTEXT.md trigger table
- Pitfalls: MEDIUM–HIGH — most derived from direct analysis of the codebase; Tauri clipboard is LOW
- Component inventory: HIGH — sourced from approved UI-SPEC (01-UI-SPEC.md)

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days — stable stack, no fast-moving parts)
