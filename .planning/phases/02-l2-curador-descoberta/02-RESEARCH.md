# Phase 2: L2 Curador + Descoberta - Research

**Researched:** 2026-05-08
**Domain:** Supabase full-text search, RLS for new tables, React cursor-pagination extension, level-gated UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Submissão de resultado (CUR-01)**
- RateSheet **expandida** para L2: mantém as estrelas existentes e adiciona um campo de upload de imagem + nota de texto opcional — tudo no mesmo fluxo
- Upload imediato, sem aprovação manual; admin pode remover depois via Supabase Dashboard
- Os resultados enviados aparecem em uma seção **"Resultados da comunidade"** na PromptyDetailPage, abaixo do conteúdo principal, como galeria de imagens
- O `useTest.ts` existente (compressão WebP + upload para Storage) deve ser reutilizado para o upload do resultado

**Avaliação de qualidade (CUR-02)**
- Combinado com CUR-01 no mesmo fluxo da RateSheet: estrelas + upload de imagem + nota no mesmo envio
- Não é um fluxo separado — o usuário L2 não vê dois botões diferentes

**Histórico e biblioteca pessoal (CUR-03)**
- Nova aba **"Salvos"** no TabBar, desbloqueada para L2+ (aparece entre Feed e Buscar)
- TabBar L2: **Feed | Salvos | Buscar | Perfil**
- A aba Salvos mostra: saves (bookmarks) + cópias + resultados enviados, com sub-filtros em chips (Salvos / Cópias / Resultados)
- Layout: grid de cards compactos 3 colunas (mesmo padrão do grid de recentes do ProfilePage)

**Sugestão de categoria (CUR-04)**
- Claude's discretion: formulário simples no menu "..." da PromptyDetailPage, campo de texto livre ou select de categorias existentes

**Denúncia de conteúdo (CUR-05, MODR-01)**
- Botão "..." no canto da PromptyDetailPage abre um bottom sheet com opções: Denunciar, Sugerir categoria
- Sheet de denúncia: dropdown de categoria (conteúdo impróprio / spam / plagiado / outro) + botão confirmar
- Submissão insere row em tabela `reports`; sem feedback visual elaborado além de toast de confirmação

**Moderação pelo admin (MODR-02, MODR-03)**
- Admin modera via **Supabase Dashboard** diretamente — sem painel no app no MVP
- Campo `is_admin` no perfil controla visibilidade futura de ferramentas admin (não usado no frontend agora)
- Promptys com `status = 'flagged' | 'hidden' | 'removed'` são filtrados nas queries do feed e da detail page (MODR-03)

**Filtros e busca (FEED-06, FEED-07)**
- Aba **"Buscar"** no TabBar para L2+ (confirma o protótipo `Promptys v2.html`)
- Conteúdo da aba: campo de busca por texto no topo + chips filtráveis por categoria e `recommended_model` abaixo + resultados paginados
- Busca full-text via Postgres `to_tsvector` / `to_tsquery` nas colunas `title`, `description`, `style_tags`
- Filtros de categoria e modelo funcionam mesmo sem texto digitado (browsing por categoria)

### Claude's Discretion
- Design visual da seção "Resultados da comunidade" na PromptyDetailPage (grid, tamanho das thumbnails)
- Ícone e label da aba Salvos (bookmark ou coração cheio)
- Estado vazio de cada sub-filtro na aba Salvos
- Implementação dos chips de filtro na aba Buscar (scroll horizontal ou wrap)
- Debounce do campo de busca (300ms recomendado)
- Esquema de pontos para CUR-01/CUR-02 — se enviar resultado ganha pontos, qual trigger SQL

### Deferred Ideas (OUT OF SCOPE)
- Painel de admin no app (AdminPage) — via Supabase Dashboard por ora; pode ser Phase 4+
- Notificações (salvo / resultado aprovado) — Phase 3 ou futura
- Follow system e feed de seguidos — v2 requirements (SOC2-01/02)
- Trending / hot score — DISC-01 (v2)
- Avaliações multi-dimensionais (visual, precisão, originalidade) — ADV-04 (v2)
- L3 Criador features (criar, publicar, variações) — Phase 3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FEED-06 | Feed can be filtered by category and recommended_model | SearchPage with chip filters; `style_tags`/`models` arrays on `promptys` table already exist; add `category` column via migration |
| FEED-07 | User can search Promptys by keyword across title, description, and tags | Postgres FTS via `to_tsvector`/`to_tsquery`; new GIN index on `promptys`; `useFeed` extension pattern established |
| CUR-01 | L2 user can upload a generated image as a Prompty result (with notes) | `useTest.ts` already handles WebP compression + Storage upload; reuse for community results |
| CUR-02 | L2 user can rate a Prompty quality | `RateSheet.tsx` already exists with stars + image upload; show conditionally for L2+ |
| CUR-03 | L2 user has a history of copied and saved Promptys | New SavedPage; queries `prompty_saves`, `prompty_tests`, `prompty_tests` (results with image_url); chip sub-filter pattern mirrors ProfilePage recents |
| CUR-04 | L2 user can suggest a category correction | "..." menu on PromptyDetailPage; simple form with text or select; inserts into `reports` with type=category_suggestion |
| CUR-05 | L2 user can report inappropriate content | Same "..." menu; separate sheet or inline option in `reports` |
| MODR-01 | Authenticated user can report a Prompty or result | `reports` table (new); RLS: authenticated insert own; no read for non-admin |
| MODR-02 | Admin can change Prompty status | Via Supabase Dashboard (no frontend code); `is_admin` column added to `profiles` for future use |
| MODR-03 | Flagged or removed Promptys not visible in feed or via direct URL | Update `useFeed` query and `PromptyDetailPage` fetch to filter `status IN ('published')` — already done for feed; detail page also filters `eq('status', 'published')` |
</phase_requirements>

---

## Summary

Phase 2 adds L2-gated features across three areas: curation (result upload, quality rating, personal library), discovery (search, category/model filters), and moderation (reporting, status filtering). The codebase from Phase 1 provides nearly all building blocks — the work is extension, not creation.

The most technically novel piece is Postgres full-text search. The `promptys` table uses `title`, `description`, and `style_tags` as FTS targets; a GIN index on a `tsvector` generated column is the standard approach and works natively with `supabase-js`. Two new tables are required: `reports` (for CUR-05/MODR-01/CUR-04) and potentially a `category_suggestions` — but per the decisions, category suggestions also go into `reports` with a distinct `type`. The `prompty_tests` table already doubles as "community results" storage since it has `image_url` and `rating` columns.

The key architectural decision already made in CONTEXT.md is that `prompty_tests` IS the results table — no separate `prompty_results` table is needed. This simplifies schema but means the SavedPage "Resultados" sub-filter queries `prompty_tests WHERE user_id = me AND image_url IS NOT NULL`. The TabBar test at `TabBar.test.tsx:55` currently asserts L2 = 3 tabs; adding "Salvos" will break that test — it must be updated before or during the TabBar modification.

**Primary recommendation:** Work in migration-first order: migration 006 (FTS index + `category` column + `reports` table + `is_admin`) → types regen → hooks (useSearch, useSaved, useReport) → pages (SearchPage, SavedPage) → extend PromptyDetailPage with "..." menu + community results gallery → extend TabBar with Salvos → update failing TabBar test.

---

## Standard Stack

### Core (already in project, HIGH confidence)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.50.0 | DB queries, Storage, FTS via `.textSearch()` | Single client pattern established |
| @tanstack/react-query | ^5.80.0 | `useInfiniteQuery` for paginated search results | Already used in `useFeed.ts` |
| zustand | ^5.0.5 | Auth state, level gating | Already used in `auth.store.ts` |
| react-router-dom | ^7.6.0 | New routes `/search`, `/saved` | Already wired in `App.tsx` |

### Supabase FTS (HIGH confidence — official docs verified)

The `supabase-js` client exposes `.textSearch(column, query, options)` for Postgres FTS:

```typescript
supabase
  .from('promptys')
  .textSearch('fts', query, { type: 'websearch', config: 'portuguese' })
```

The `fts` column is a `tsvector` generated column defined in the migration. `type: 'websearch'` handles partial words and quoted phrases without requiring the caller to manage tsquery syntax.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest + @testing-library/react | ^3.1.0 / ^16.3.0 | Unit/RTL tests for new hooks and pages | All new components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Postgres FTS (tsvector) | Supabase vector (pgvector) semantic search | pgvector is overkill for keyword search; adds cost/complexity; not needed at MVP scale |
| Generated tsvector column | Trigger-maintained tsvector column | Generated column is simpler, auto-syncs, no trigger needed |
| `websearch_to_tsquery` | `plainto_tsquery` | websearch handles partial input better for end-users; use `websearch` type |

**Installation:** No new packages needed — all dependencies are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── hooks/
│   ├── useSearch.ts       # FTS + filter query, useInfiniteQuery
│   ├── useSaved.ts        # user's saves + copies + results, filtered by tab
│   └── useReport.ts       # insert into reports table
├── pages/
│   ├── SearchPage.tsx     # Buscar tab: search field + chips + results
│   └── SavedPage.tsx      # Salvos tab: chip sub-filter + grid
└── components/
    └── feed/
        └── CommunityResults.tsx  # gallery section in PromptyDetailPage

supabase/migrations/
└── 20260508000006_l2_features.sql   # FTS index, category col, reports table, is_admin
```

### Pattern 1: Extending useFeed for Search (useSearch hook)

**What:** Mirror `useFeed`'s `useInfiniteQuery` shape but accept `query: string`, `category: string | null`, `model: string | null` as params. Cursor is still `{ created_at, id }`.

**When to use:** SearchPage needs infinite scroll with real-time filter updates.

```typescript
// Source: mirrors useFeed.ts established pattern
export function useSearch(query: string, category: string | null, model: string | null) {
  return useInfiniteQuery({
    queryKey: ['search', query, category, model],
    queryFn: ({ pageParam }) => fetchSearchPage(query, category, model, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined
      const last = lastPage[lastPage.length - 1]
      return last ? { created_at: last.created_at, id: last.id } : undefined
    },
    enabled: query.length > 0 || !!category || !!model,
  })
}
```

**Note on FTS query building:** When `query` is empty but filters are active, skip `.textSearch()` and apply only `.contains()` filters. When `query` is non-empty, combine FTS with filters:

```typescript
async function fetchSearchPage(query, category, model, cursor) {
  let q = supabase
    .from('promptys')
    .select('*, profiles(name, username, avatar_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE)

  if (query) {
    q = q.textSearch('fts', query, { type: 'websearch', config: 'portuguese' })
  }
  if (category) {
    q = q.eq('category', category)
  }
  if (model) {
    q = q.contains('models', [model])
  }
  if (cursor) {
    q = q.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
  }
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as FeedItem[]
}
```

### Pattern 2: Level-Gated Component Rendering

**What:** Conditionally render L2-only elements based on `levelOf(profile.points).id >= 'L2'`.

**When to use:** RateSheet image upload slot, "..." menu on PromptyDetailPage, "Resultados da comunidade" gallery.

```typescript
// In PromptyDetailPage or RateSheet
const profile = useAuthStore((s) => s.profile)
const isL2 = profile ? LEVEL_ORDER.indexOf(levelOf(profile.points).id) >= LEVEL_ORDER.indexOf('L2') : false
```

Never render a disabled/greyed version — `if (!isL2) return null` per LEVL-07.

### Pattern 3: Optimistic Hook Pattern (for useReport)

**What:** Follow `useSave.ts` / `useLike.ts` pattern — local state + DB write + revert on error. Reports don't need optimistic state (no toggle), so useReport is simpler: just async submit + return `{ ok, error }`.

```typescript
// useReport.ts — analogous to useTest.ts (fire-and-forget result)
export function useReport() {
  async function submit(input: { prompty_id: string; reason: string; type: 'report' | 'category_suggestion'; notes?: string }) {
    const user = useAuthStore.getState().user
    if (!user) return { ok: false, error: 'Login necessário.' }
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      prompty_id: input.prompty_id,
      reason: input.reason,
      type: input.type,
      notes: input.notes ?? null,
    })
    if (error) return { ok: false, error: 'Não foi possível enviar.' }
    return { ok: true }
  }
  return { submit }
}
```

### Pattern 4: SavedPage Sub-Filter with Client-Side Chips

**What:** Fetch all three data sources (saves, copies, results) in parallel, hold in state, filter client-side on chip selection.

**When to use:** The data volumes are small (user's own records, typically < 100 items each); no pagination needed for MVP.

```typescript
// useSaved.ts fetches all three in parallel:
const [saves, copies, results] = await Promise.all([
  supabase.from('prompty_saves').select('...').eq('user_id', uid),
  supabase.from('prompty_tests').select('...').eq('user_id', uid),
  supabase.from('prompty_tests').select('...').eq('user_id', uid).not('image_url', 'is', null),
])
// Note: 'copies' and 'results' both come from prompty_tests — results is a subset where image_url IS NOT NULL
```

### Pattern 5: "..." Menu as Inline Bottom Sheet

**What:** A small floating menu triggered by a "..." `<button>` in PromptyDetailPage header area. Render as a fixed bottom sheet (same pattern as RateSheet) with two options: "Denunciar" and "Sugerir categoria".

**When to use:** PromptyDetailPage, L2+ only. The "..." button should not render for L1 (LEVL-07).

### Anti-Patterns to Avoid

- **Duplicating FTS logic in a component:** All search logic stays in `useSearch.ts`; SearchPage is display-only.
- **Using OFFSET for pagination in search results:** Use the same cursor pattern as `useFeed`; OFFSET degrades at scale and is banned by FEED-05.
- **Separate `prompty_results` table:** Per CONTEXT.md, `prompty_tests` IS the results table. Do not create a new table.
- **Rendering disabled "Salvos" tab for L1:** LEVL-07 — absent from DOM, never greyed.
- **Writing to `point_events` directly from frontend:** All points must flow via SQL trigger; if CUR-01/CUR-02 award points, add a new trigger on `prompty_tests` INSERT (the existing `award_points_on_test` trigger already handles this — CUR-01 submissions go to `prompty_tests`, so points are already awarded).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Postgres full-text search | Custom JS text matching | `tsvector` generated column + `.textSearch()` | Handles accents, stemming, ranked results natively in DB |
| Debounced search input | Manual setTimeout | React `useState` + inline debounce with `useRef` holding timer | Simple, no library needed; 300ms per CONTEXT.md decision |
| Image compression for results | New compress function | `compressToWebP` from `src/lib/images/compress.ts` | Already used in `useTest.ts`; handles WebP ≤200KB |
| Level gating logic | Re-implement level check | `levelOf()` from `src/lib/constants/levels.ts` + `LEVEL_ORDER` from TabBar | Single source of truth already established |
| Infinite scroll for search | External library | Same scroll listener pattern as `FeedPage.tsx` | Established pattern; no new dependency needed |

**Key insight:** The Phase 1 schema was already designed with Phase 2 in mind. `prompty_tests.image_url` is the community results field. `status` already includes `'flagged' | 'removed'`. The only missing pieces are: `category` column on `promptys`, `fts` generated column, `reports` table, and `is_admin` on `profiles`.

---

## Common Pitfalls

### Pitfall 1: TabBar Test Breaks When Adding "Salvos"

**What goes wrong:** The existing test `TabBar.test.tsx:55` asserts `getAllByRole('link')` has length 3 for L2. Adding "Salvos" (a 4th L2 tab) will fail this assertion.

**Why it happens:** The test hardcodes the expected tab count for each level. The TABS array change is not backward-compatible with existing assertions.

**How to avoid:** Update `TabBar.test.tsx` in the same plan/wave that modifies `TabBar.tsx`. The correct assertions after Phase 2: L1 = 2 tabs, L2 = 4 tabs (Feed | Salvos | Buscar | Perfil), L3 = 6 tabs (adds Criar + Ranking... or confirm new L3 count).

**Warning signs:** `vitest run` output shows `expected 3 to equal 4` in TabBar test.

### Pitfall 2: `category` Column Missing — Filters Silently No-Op

**What goes wrong:** The `promptys` table schema has `models TEXT[]` and `style_tags TEXT[]` but NO `category` column. Filter by category will silently return 0 results or error.

**Why it happens:** The schema was defined before category-based browsing was a requirement. FEED-06 requires category filter but the column doesn't exist yet.

**How to avoid:** Migration 006 must add `category TEXT` to `promptys` before any frontend filter code is written. Seed data should include category values.

**Warning signs:** `.eq('category', value)` returns 0 results even for seeded data.

### Pitfall 3: FTS `config: 'portuguese'` May Not Be Installed

**What goes wrong:** Supabase's hosted Postgres supports Portuguese FTS dictionary, but the local development container (`supabase start`) may default to `simple` if `pg_catalog.portuguese` isn't configured.

**Why it happens:** FTS text configurations are database-level settings. The local dev DB may differ from production.

**How to avoid:** Define the `tsvector` generated column with `config := 'portuguese'` in the migration and test locally. If `portuguese` is unavailable, fall back to `'simple'` as a migration option. Verify with `SELECT cfgname FROM pg_ts_config;` in Supabase Studio.

**Warning signs:** Migration fails with `text search configuration "portuguese" does not exist`.

### Pitfall 4: `useSaved` Loads Copies AND Results from `prompty_tests` — Risk of Duplication

**What goes wrong:** The "Cópias" sub-filter shows all `prompty_tests` rows. The "Resultados" sub-filter shows `prompty_tests WHERE image_url IS NOT NULL`. A test with an image appears in BOTH sub-filters.

**Why it happens:** `prompty_tests` serves dual purpose — it records both "I rated this" and "I uploaded a result image".

**How to avoid:** This is acceptable UX by design — an item with an image logically belongs in both "Cópias" (I rated it) and "Resultados" (I uploaded an image). Chip labels should be clear: "Avaliações" (not "Cópias") and "Resultados". Alternatively, only show a test row in "Resultados" if `image_url IS NOT NULL`, and in "Avaliações" if it doesn't have an image — i.e. mutually exclusive grouping. Discuss with product owner before implementing (Claude's discretion area).

**Warning signs:** User reports seeing same card twice in Salvos page.

### Pitfall 5: MODR-03 — Detail Page Doesn't Filter Non-Published Promptys via Direct URL

**What goes wrong:** `PromptyDetailPage` already has `.eq('status', 'published')`, so flagged/removed promptys return 404. But if the RLS policy on `promptys` allows `SELECT` for `author_id = auth.uid()` regardless of status, authors can still see their flagged promptys. This is actually correct behavior per current RLS — authors can see their own drafts.

**Why it happens:** Two RLS policies exist: `promptys_select_published` (for all) and `promptys_select_own_drafts` (for author). The frontend filter `.eq('status', 'published')` on the detail page is the guard, not RLS alone.

**How to avoid:** The current code already handles this correctly for non-authors. Document the decision: authors can always see their own promptys regardless of status (this is intentional).

### Pitfall 6: `reports` Table RLS — Reporters Should Not Read Each Other's Reports

**What goes wrong:** If RLS on `reports` uses `USING (true)` for SELECT, users can see all reports, including sensitive content.

**Why it happens:** Copy-paste from `prompty_tests` or `prompty_likes` RLS patterns that allow public read.

**How to avoid:** `reports` table RLS must be: INSERT for authenticated with `WITH CHECK (reporter_id = auth.uid())`; SELECT for authenticated only own rows. No admin UI in the app, so no admin SELECT policy needed at this stage.

### Pitfall 7: Existing `award_points_on_test` Trigger Already Handles CUR-01 Points

**What goes wrong:** A new trigger for "uploading result" points is added that double-awards points alongside the existing `award_points_on_test` trigger, since CUR-01 submissions also go into `prompty_tests`.

**Why it happens:** The CONTEXT.md "Claude's discretion" note about points for CUR-01 suggests a new trigger, but the existing trigger already fires on any `prompty_tests INSERT`.

**How to avoid:** The existing trigger already awards 5p per `prompty_tests INSERT` (idempotent via `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING`). No new trigger is needed for CUR-01. If a distinct point event for "uploaded result with image" is desired, use a different `event_type` (e.g., `'result_upload'`) in a new trigger, but add it to the `event_type CHECK` constraint first.

---

## Code Examples

### FTS Generated Column (Migration)

```sql
-- Source: Supabase FTS documentation pattern
-- Add category column and FTS generated column to promptys
ALTER TABLE promptys ADD COLUMN category TEXT;
ALTER TABLE promptys ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      array_to_string(style_tags, ' ')
    )
  ) STORED;
CREATE INDEX idx_promptys_fts ON promptys USING GIN(fts);
```

### Reports Table (Migration)

```sql
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompty_id   UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('report', 'category_suggestion')),
  reason       TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporter_id, prompty_id, type)  -- one report + one suggestion per user per prompty
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_select_own" ON reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
```

### is_admin Column (Migration)

```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
```

### useSaved Hook Fetch Pattern

```typescript
// All three data sources fetched in parallel, client-side filtering by chip
const [savesRes, testsRes] = await Promise.all([
  supabase
    .from('prompty_saves')
    .select('created_at, promptys(id,title,cover_url,cover_gradient,slug)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false }),
  supabase
    .from('prompty_tests')
    .select('created_at, image_url, rating, promptys(id,title,cover_url,cover_gradient,slug)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false }),
])
// results = testsRes rows where image_url IS NOT NULL
// Chip filter: 'saved' | 'rated' | 'results'
```

### Debounced Search Input

```typescript
// In SearchPage.tsx — no library, 300ms per CONTEXT.md
const [query, setQuery] = useState('')
const [debouncedQuery, setDebouncedQuery] = useState('')
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function handleQueryChange(value: string) {
  setQuery(value)
  if (timerRef.current) clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => setDebouncedQuery(value), 300)
}
// Pass debouncedQuery to useSearch, not query
```

### L2 Level Check (reusable pattern)

```typescript
// Mirrors TabBar.tsx LEVEL_ORDER pattern
import { levelOf } from '@/lib/constants/levels'
import { useAuthStore } from '@/stores/auth.store'

const LEVEL_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5']
function useLevelGate(minLevel: string): boolean {
  const profile = useAuthStore((s) => s.profile)
  const currentLevel = profile ? levelOf(profile.points).id : 'L1'
  return LEVEL_ORDER.indexOf(currentLevel) >= LEVEL_ORDER.indexOf(minLevel)
}
// Usage: const isL2 = useLevelGate('L2')
```

---

## Schema Analysis

### What Already Exists (Phase 1)

| Table / Column | Status | Notes |
|----------------|--------|-------|
| `prompty_tests.image_url` | Exists | CUR-01 result images stored here |
| `prompty_tests.rating` | Exists | CUR-02 quality rating (1-5) |
| `prompty_saves` | Exists | CUR-03 bookmarks |
| `promptys.status` CHECK includes `'flagged' \| 'removed'` | Exists | MODR-03 already supported at schema level |
| `promptys.models TEXT[]` | Exists | FEED-06 model filter; use `.contains('models', [model])` |
| `promptys.style_tags TEXT[]` | Exists | FEED-07 FTS target |
| `useTest.ts` upload to `prompty-results` Storage bucket | Exists | CUR-01 reuse confirmed |

### What Is Missing (Phase 2 Migration Required)

| Missing | What to Add | Requirement |
|---------|-------------|-------------|
| `promptys.category TEXT` | New column via migration | FEED-06 |
| `promptys.fts tsvector GENERATED` | New generated column + GIN index | FEED-07 |
| `reports` table | New table + RLS | CUR-05, MODR-01, CUR-04 |
| `profiles.is_admin BOOLEAN` | New column | MODR-02 (future use) |
| SearchPage route `/search` | Already in TabBar but no route/page in App.tsx | FEED-07 |
| SavedPage route `/saved` | Not yet in App.tsx | CUR-03 |

### Note on `prompty_results` vs `prompty_tests`

The CONTEXT.md confirms that `prompty_tests` serves as the "community results" storage. The `database.types.ts` references a conceptual `prompty_results` but the actual table is `prompty_tests`. When CUR-01 uploads a result image, it creates a `prompty_tests` row with `image_url` set. The "Resultados da comunidade" gallery in PromptyDetailPage queries:

```typescript
supabase
  .from('prompty_tests')
  .select('id, image_url, rating, notes, profiles(name, avatar_url)')
  .eq('prompty_id', promptyId)
  .not('image_url', 'is', null)
  .order('created_at', { ascending: false })
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OFFSET-based pagination | Cursor-based keyset pagination | Phase 1 (FEED-05) | Search results must also use cursor, not OFFSET |
| Direct frontend DB writes for points | SQL trigger chain only | Phase 1 (INFR-02) | CUR-01 points are already handled by existing trigger |
| Greyed-out locked features | Absent from DOM entirely | Phase 1 (LEVL-07) | Salvos tab must not appear for L1 users at all |

---

## Open Questions

1. **`to_tsvector` config: `portuguese` vs `simple`**
   - What we know: Supabase hosted Postgres supports `portuguese`; local dev may not have it configured
   - What's unclear: Local dev dictionary availability without testing
   - Recommendation: Write migration with `portuguese`, add a comment to fall back to `'simple'` if local dev fails; production is what matters

2. **Salvos chip: "Cópias" vs "Avaliações"**
   - What we know: CONTEXT.md says sub-filters are "Salvos / Cópias / Resultados"; but copies are tracked in `prompty_tests` (not a separate copies table) and cópias via `record_copy` RPC (in `point_events`, no query-friendly table)
   - What's unclear: How to query "copies" separately from "rated" if both are in `prompty_tests`
   - Recommendation: Re-interpret "Cópias" as "Avaliações" (all `prompty_tests` rows) since that's what's queryable. Alternatively, add a `copy_events` view or use `point_events WHERE event_type = 'copy'`. The simplest: show "Salvos" + "Avaliações" + "Resultados" — three clean buckets from queryable tables.

3. **Category values — static list or DB-driven**
   - What we know: No `categories` table exists; `category` column is new free text
   - What's unclear: What categories are valid for chips in SearchPage
   - Recommendation: Hardcode a static list of categories as a constant in the frontend for Phase 2; a dynamic list from DB is a Phase 4 improvement

---

## Validation Architecture

> `nyquist_validation` is `true` in `.planning/config.json` — this section is included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 + @testing-library/react 16.3 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm run test:run -- --reporter=verbose` |
| Full suite command | `pnpm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-06 | Chip filter applies category/model to search query | unit | `pnpm run test:run -- src/hooks/useSearch.test.ts` | ❌ Wave 0 |
| FEED-07 | FTS query built correctly for text input | unit | `pnpm run test:run -- src/hooks/useSearch.test.ts` | ❌ Wave 0 |
| CUR-01 | useTest submits image_url to prompty_tests | unit | `pnpm run test:run -- src/hooks/useTest.test.ts` | ❌ Wave 0 (useTest.ts has no test file) |
| CUR-02 | RateSheet shows image upload slot for L2, hides for L1 | RTL | `pnpm run test:run -- src/components/feed/RateSheet.test.tsx` | ❌ Wave 0 |
| CUR-03 | SavedPage renders correct chip sub-filters | RTL | `pnpm run test:run -- src/pages/SavedPage.test.tsx` | ❌ Wave 0 |
| CUR-04 | useReport submits type=category_suggestion | unit | `pnpm run test:run -- src/hooks/useReport.test.ts` | ❌ Wave 0 |
| CUR-05 | useReport submits type=report | unit | `pnpm run test:run -- src/hooks/useReport.test.ts` | ❌ Wave 0 |
| MODR-01 | reports table insert accepted for authenticated user | manual | Supabase Studio manual check | manual-only |
| MODR-02 | Admin changes status via Dashboard | manual | Supabase Dashboard manual check | manual-only |
| MODR-03 | Feed and detail page exclude flagged/removed promptys | RTL | `pnpm run test:run -- src/hooks/useFeed.test.ts` | ❌ Wave 0 |
| TabBar-L2 | L2 user sees 4 tabs (Feed + Salvos + Buscar + Perfil) | RTL | `pnpm run test:run -- src/components/layout/TabBar.test.tsx` | ✅ exists (must be UPDATED — currently asserts 3 tabs) |

### Sampling Rate

- **Per task commit:** `pnpm run test:run -- src/hooks/useSearch.test.ts src/hooks/useReport.test.ts src/components/layout/TabBar.test.tsx`
- **Per wave merge:** `pnpm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useSearch.test.ts` — covers FEED-06, FEED-07 (mock supabase, assert correct query params)
- [ ] `src/hooks/useTest.test.ts` — covers CUR-01, CUR-02 (existing hook, no test file yet)
- [ ] `src/hooks/useReport.test.ts` — covers CUR-04, CUR-05
- [ ] `src/components/feed/RateSheet.test.tsx` — covers CUR-02 L2 conditional rendering
- [ ] `src/pages/SavedPage.test.tsx` — covers CUR-03 chip filter logic
- [ ] `src/hooks/useFeed.test.ts` — covers MODR-03 status filter
- [ ] Update `src/components/layout/TabBar.test.tsx` — L2 assertion must change from 3 tabs to 4 tabs (add "Salvos")

---

## Sources

### Primary (HIGH confidence)

- Supabase JS docs `.textSearch()` — verified against supabase-js 2.x API
- Supabase FTS guide (official docs) — `tsvector GENERATED ALWAYS AS ... STORED` + GIN index pattern
- Existing codebase: `useFeed.ts`, `useTest.ts`, `RateSheet.tsx`, `TabBar.tsx`, `database.types.ts`, all five migrations — direct file inspection

### Secondary (MEDIUM confidence)

- Postgres documentation on `to_tsvector` with `portuguese` config — standard Postgres feature, available in Supabase-hosted Postgres
- `websearch_to_tsquery` behavior (handles partial input) — standard Postgres 11+ feature

### Tertiary (LOW confidence — needs validation)

- Availability of `portuguese` FTS config in local Supabase dev container — verify during Wave 0 migration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in `package.json`; no new deps needed
- Architecture: HIGH — directly derived from existing codebase patterns
- Schema changes: HIGH — confirmed against migration files and database.types.ts
- FTS approach: HIGH — Supabase official docs pattern
- Pitfalls: HIGH — several confirmed by reading actual test files and schema constraints

**Research date:** 2026-05-08
**Valid until:** 2026-06-08 (stable stack; Supabase FTS API stable)
