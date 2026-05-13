# Phase 3: L3 Criador - Research

**Researched:** 2026-05-08
**Domain:** Prompty Creation Wizard, Supabase Storage, Template Variable System, Stats Aggregation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Fluxo do editor de criação (CREAT-01, CREAT-02)**
- Wizard 4 etapas, abertas pelo botão sparkle central do TabBar:
  - Etapa 1 — Dados básicos: título (obrigatório), categoria (obrigatório), complexity_level (simple/guided/advanced, padrão: simple)
  - Etapa 2 — Prompt beginner: `beginner_prompt` (obrigatório) — texto plano pronto para copiar
  - Etapa 3 — Imagem: upload da imagem de capa para Supabase Storage (opcional, mas recomendado)
  - Etapa 4 — Modo avançado (opcional): `advanced_template` com `{{chave}}` + definição de variáveis. Botão "Ignorar" pula esta etapa.
- Publicação acontece ao final da etapa 3 (ou 4 se o criador não ignorar). Status inicial: `published`.
- Tags (`style_tags`) e `recommended_model` são opcionais, aparecem na etapa 1 como campos expandíveis.

**Campos obrigatórios para publicar**
- `title` + `beginner_prompt` + `category` — mínimo viável para o feed
- `example_image_url`, `style_tags`, `recommended_model`, `advanced_template`, `inputs_schema` são todos opcionais

**Imagem de capa (CREAT-01)**
- Upload direto para Supabase Storage — mesmo padrão do prompty-results
- Reutiliza `compressToWebP` do `compress.ts` antes do upload
- URL pública armazenada em `example_image_url` no registro do prompty
- Fallback: gradiente linear se sem imagem

**Estatísticas dos próprios promptys (CREAT-03)**
- Seção "Meus Promptys" na ProfilePage, visível apenas para L3+
- Grid de cards com: imagem de capa, título, e 3 contadores: cópias / saves / feedbacks
- Dados lidos das tabelas existentes sem nova tabela de stats; agregados via query no cliente ou view

**Variações simples (CREAT-04)**
- Variação = fork editável com `parent_id` apontando para o prompty original
- Botão "Criar variação" na PromptyDetailPage, visível para qualquer usuário L3
- Abre o wizard com campos pré-preenchidos do original
- Publicada como prompty independente com crédito "Baseado em [título do original]"
- Schema precisa de coluna `parent_id UUID REFERENCES promptys(id)`

**Modo avançado e variáveis (CREAT-05)**
- Etapa 4 dedicada no wizard, marcada como "(opcional)"
- Detecta `{{chave}}` automaticamente e gera formulário de variáveis
- Usa `InputField` de `src/lib/prompty/template.ts`, preview via `resolveBeginner()`
- Definições salvas em `inputs_schema` JSONB
- Versões: botão "Salvar versão" manual, cria snapshot em `prompty_versions`

### Claude's Discretion
- Design visual do wizard (barra de progresso, navegação entre etapas, animações)
- Fallback visual de card sem imagem de capa no feed
- Validação de `{{chave}}` no editor (highlight, contagem de placeholders detectados)
- Exibição do crédito "Baseado em" na detail page e no feed card
- Estrutura exata da tabela `prompty_versions`
- Aba Ranking L3: pode ser placeholder "Em breve" se não houver dados suficientes

### Deferred Ideas (OUT OF SCOPE)
- Ranking geral funcional com algoritmo de pontuação — v2 (GAME2-01)
- Sistema de follow e feed de seguidos — v2 (SOC2-01/02)
- Notificações em tempo real — v2 (SOC2-03)
- Remix com cadeia de atribuição (GitHub-style) — v2 (ADV-03)
- Avaliações multi-dimensionais — v2 (ADV-04)
- Editor avançado colaborativo — out of scope
- Painel de admin no app — Phase 4+
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CREAT-01 | L3 user can create and publish a Prompty with: title, description, beginner_prompt, example_image_url, category, tags, recommended_model | Schema mapping clarified below; Storage bucket needed; wizard component tree defined |
| CREAT-02 | L3 user can set complexity_level (simple/guided/advanced) | Maps to `difficulty` column in existing `promptys` table; wizard step 1 toggle |
| CREAT-03 | L3 user can view basic stats for their own Promptys: copy count, save count, feedback count | Copies via `point_events` WHERE event_type='copy', saves via `prompty_saves`, feedbacks via `prompty_tests`; aggregated query per prompty |
| CREAT-04 | L3 user can create simple variations of an existing Prompty | Requires new `parent_id` column on `promptys`; `prompty_remixes` table already exists as alternate tracking |
| CREAT-05 | L3 user can optionally access advanced mode: advanced_template with {{variable}} syntax, negative_prompt, versions | `template` column stores advanced_template; `inputs_schema` JSONB already exists; `prompty_versions` table already exists |
</phase_requirements>

---

## Summary

Phase 3 builds the L3 Criador feature set on top of a well-established foundation. The most important discovery is that **the database schema already supports almost everything this phase needs** — `prompty_versions`, `inputs_schema`, `prompty_remixes`, and the `publish` event type in `point_events` were all pre-defined in the Phase 1 migration. The only new migration work is: adding a Storage bucket for cover images, adding `parent_id` to `promptys`, and writing the `publish` points trigger.

The second critical discovery is a **terminology mismatch** between the CONTEXT.md language and the actual database schema. What CONTEXT.md calls `beginner_prompt` is the `template` column. What it calls `advanced_template` is also stored in `template` (the advanced version replaces the beginner one, or they coexist via the `prompty_versions` snapshot). What it calls `category` is the `difficulty` column (which uses 'beginner'/'intermediate'/'advanced' not 'simple'/'guided'/'advanced'). What it calls `recommended_model` maps to `models TEXT[]`. What it calls `example_image_url` maps to `cover_url`. The planner must reconcile this naming gap — either add new columns with the context names, or map wizard fields to existing columns.

The third key finding is that **copy stats cannot be aggregated per-prompty from `point_events`** because `point_events` has a UNIQUE constraint on `(user_id, event_type, ref_id)` — each user only generates one copy event per prompty. This means `COUNT(*)` from `point_events WHERE event_type='copy' AND ref_id=<prompty_id>` gives unique copier count, not total copies. This is semantically correct for "how many people copied" but the planner should document this clearly.

**Primary recommendation:** Use a single migration that adds: `parent_id` FK, the `prompty-covers` storage bucket, and a `trg_award_points_on_publish` trigger. Map wizard fields to existing DB columns without adding new ones.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | already installed | DB reads/writes, Storage upload, RPC calls | Project standard; single client in `src/lib/supabase.ts` |
| `@tanstack/react-query` | already installed | `useInfiniteQuery` for MyPromptys grid cursor pagination | Already used in `useFeed.ts` |
| `react-router-dom` | already installed | Routes `/criar`, `/criar/:parentId`, `/ranking` | Project standard |
| `zustand` | already installed | Auth store for level-gating (`useAuthStore`) | Project standard |

### Reusable Project Assets

| Asset | Path | Reuse In Phase 3 |
|-------|------|-----------------|
| `compressToWebP()` | `src/lib/images/compress.ts` | Cover image upload in wizard step 3 |
| `resolveBeginner()` | `src/lib/prompty/template.ts` | Live preview in wizard step 4 |
| `InputField` type | `src/lib/prompty/template.ts` | `inputs_schema` structure for variable definitions |
| `useTest.ts` | `src/hooks/useTest.ts` | Upload pattern to copy for cover image upload |
| `levelOf()` / `LEVELS` | `src/lib/constants/levels.ts` | L3 gating — check `levelOf(profile.points).id >= 'L3'` |
| `TweaksPanel` | `src/components/dev/TweaksPanel.tsx` | Already supports L3 override via `setForcedLevel('L3')` |

**No new npm packages required for Phase 3.**

---

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)

```
src/
├── components/
│   ├── create/          # NEW — wizard component tree
│   │   ├── CreateWizard.tsx
│   │   ├── WizardStep1Basics.tsx
│   │   ├── WizardStep2Prompt.tsx
│   │   ├── WizardStep3Image.tsx
│   │   ├── WizardStep4Advanced.tsx
│   │   ├── WizardProgressBar.tsx
│   │   └── VariableChip.tsx
│   ├── profile/         # NEW — stats grid
│   │   ├── MyPromptyCard.tsx
│   │   └── MyPromptysGrid.tsx
│   └── layout/
│       └── TabBar.tsx   # MODIFIED — sparkle primary button + Ranking tab
├── hooks/
│   ├── useCreatePrompty.ts  # NEW — wizard publish logic
│   └── useMyPromptys.ts     # NEW — stats aggregation query
├── pages/
│   ├── CriarPage.tsx    # NEW — route /criar and /criar/:parentId
│   └── RankingPage.tsx  # NEW — placeholder route /ranking
└── types/
    └── database.types.ts # UPDATED after migration
supabase/migrations/
    └── 20260508000006_phase3_criador.sql  # NEW
```

### Pattern 1: Wizard State Machine (4-step)

**What:** `CreateWizard` owns step index (0-3) in local `useState`. Each step component receives `data` and `onChange` props. No external state store — wizard state is ephemeral and not persisted.

**When to use:** Single-session flows with linear progression and optional steps.

```typescript
// Established pattern from Phase 1 ProfilePage edit form
const [step, setStep] = useState(0)
const [data, setData] = useState<WizardData>(initialData)

function next() { setStep(s => Math.min(s + 1, 3)) }
function back() { if (step === 0) navigate('/'); else setStep(s => s - 1) }
```

### Pattern 2: Storage Upload (reuse from useTest.ts)

**What:** `compressToWebP` → `supabase.storage.from(bucket).upload(path, blob)` → `getPublicUrl(path)` → store URL. Non-fatal on failure.

```typescript
// Source: src/hooks/useTest.ts — exact pattern to replicate for cover images
async function uploadCoverImage(userId: string, slug: string, file: File): Promise<string | null> {
  const blob = await compressToWebP(file, 200, 0.85)
  const path = `${userId}/${slug}-cover.webp`
  const { error } = await supabase.storage
    .from('prompty-covers')
    .upload(path, blob, { contentType: 'image/webp', upsert: true })
  if (error) { console.warn('Cover upload failed:', error.message); return null }
  const { data } = supabase.storage.from('prompty-covers').getPublicUrl(path)
  return data.publicUrl ?? null
}
```

**Note:** Use `upsert: true` for cover images (unlike prompty-results which uses `upsert: false`) because a creator may re-upload a cover during editing.

### Pattern 3: L3 Gating (LEVL-07 compliant)

**What:** Check level in parent component, conditionally render child — never render disabled buttons.

```typescript
// Source: src/stores/auth.store.ts + src/lib/constants/levels.ts
const profile = useAuthStore((s) => s.profile)
const lvl = levelOf(profile?.points ?? 0)
const isL3 = lvl.id !== 'L1' && lvl.id !== 'L2'  // 'L3' | 'L4' | 'L5'

// In PromptyDetailPage — render only for L3+
{isL3 && (
  <button onClick={() => navigate(`/criar?from=${prompty.id}`)}>
    Criar variação
  </button>
)}
```

**LEVL-07 enforcement:** The button must not appear at all for L1/L2 — not greyed, not disabled.

### Pattern 4: Stats Aggregation (no new table)

**What:** Three separate count queries per owned prompty, using `Promise.all` to parallelize.

```typescript
// Copy count via point_events (unique copier count per prompty)
const { count: copies } = await supabase
  .from('point_events')
  .select('*', { count: 'exact', head: true })
  .eq('event_type', 'copy')
  .eq('ref_id', promptyId)

// Save count
const { count: saves } = await supabase
  .from('prompty_saves')
  .select('*', { count: 'exact', head: true })
  .eq('prompty_id', promptyId)

// Feedback count (prompty_tests = ratings/feedback submissions)
const { count: feedbacks } = await supabase
  .from('prompty_tests')
  .select('*', { count: 'exact', head: true })
  .eq('prompty_id', promptyId)
```

For the `useMyPromptys` hook: fetch `promptys WHERE author_id = user.id AND status = 'published'`, then for each prompty run the three count queries. For MVP with expected low prompty counts per creator, N+1 queries are acceptable. If performance becomes an issue, a Supabase view or RPC function can replace this.

### Pattern 5: Variable Detection Regex

```typescript
// Source: 03-UI-SPEC.md — exact regex
const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

function extractVariables(template: string): string[] {
  const keys = new Set<string>()
  for (const match of template.matchAll(VARIABLE_REGEX)) {
    if (match[1]) keys.add(match[1])
  }
  return Array.from(keys)
}
```

Run on every `onChange` of the `advanced_template` textarea. Derive `VariableChip[]` from the detected keys. Keys already in `inputs_schema` state retain their label/type/default values; new keys get empty defaults.

### Pattern 6: Variation Fork Flow

**What:** Navigate to `/criar?from=<originalId>` (query param), CriarPage reads `from` param, fetches original prompty, pre-populates wizard data.

```typescript
// In CriarPage
const [searchParams] = useSearchParams()
const parentId = searchParams.get('from')  // null for fresh creation

// If parentId: fetch original, populate wizard initial state
// On publish: set parent_id = parentId in the INSERT
```

**Alternative route:** `/criar/:parentId` (path param). Query param `?from=` is preferred because it keeps `/criar` as the canonical wizard route and avoids route duplication in App.tsx.

### Anti-Patterns to Avoid

- **Writing to `point_events` from frontend:** Always forbidden. The publish points must go through a `SECURITY DEFINER` trigger on `promptys INSERT` (same pattern as `trg_points_on_test`).
- **Duplicating `InputField` parsing logic in VariableChip:** Import from `src/lib/prompty/template.ts` exclusively.
- **Using `category` as a DB column name:** The column is `difficulty`. Map wizard "category" UI label to the `difficulty` column.
- **Separate `beginner_prompt` and `advanced_template` columns:** The DB has a single `template` column. The wizard writes `beginner_prompt` to `template`. If advanced mode is used, the `advanced_template` also saves to `template` (overwriting or the versions table handles history). Clarify this at plan time.
- **Polling for stats:** Use a single query with `count: 'exact'` per table, not polling or realtime subscriptions.
- **Greying out Ranking tab when no data:** Per LEVL-07, render a `ComingScreen`-style placeholder, not a disabled tab.

---

## Critical Schema Discoveries

### Terminology Mismatch: CONTEXT.md vs Database

This is the most important finding for the planner. The following mapping applies:

| CONTEXT.md / CREAT req term | Actual DB column | Notes |
|-----------------------------|-----------------|-------|
| `beginner_prompt` | `template` | Already exists; wizard step 2 writes to `template` |
| `advanced_template` | `template` | Same column — advanced overwrites beginner, OR versions track history |
| `category` | `difficulty` | Existing CHECK: `('beginner','intermediate','advanced')` — wizard labels differ: "Simples/Guiado/Avançado" maps to these values |
| `complexity_level` | `difficulty` | Same column; CREAT-02 is already partially addressed by this column |
| `recommended_model` | `models TEXT[]` | Array; wizard sends single model as `[model]` |
| `example_image_url` | `cover_url` | Already exists |
| `style_tags` | `style_tags TEXT[]` | Already exists |
| `parent_id` | MISSING — must add | New column needed |

**Resolution:** Add `parent_id UUID REFERENCES promptys(id) ON DELETE SET NULL` to `promptys` in the Phase 3 migration. No other new columns needed on `promptys`.

### What Already Exists (no schema work needed)

- `prompty_versions` table — fully defined in migration 001 with `version`, `template`, `negative`, `inputs_schema` columns
- `inputs_schema JSONB` on `promptys` — already exists, already defaults to `[]`
- `prompty_remixes` table — exists, but CONTEXT.md uses `parent_id` pattern instead; both can coexist or the planner can choose one
- `point_events.event_type = 'publish'` — already in the CHECK constraint, but no trigger writes to it yet
- `prompty_versions` RLS — already has `prompty_versions_insert_author` policy

### What Needs New Migration (Phase 3 only)

1. `ALTER TABLE promptys ADD COLUMN parent_id UUID REFERENCES promptys(id) ON DELETE SET NULL`
2. `CREATE INDEX idx_promptys_parent ON promptys(parent_id)` — for variation lookups
3. Storage bucket `prompty-covers` (public, 2MB limit, webp/jpeg/png MIME)
4. Storage RLS for `prompty-covers` (read public, upload own folder)
5. `CREATE OR REPLACE FUNCTION award_points_on_publish()` trigger — inserts `('publish', 50, prompty_id)` into `point_events` on `promptys INSERT WHERE status='published'`
6. `database.types.ts` update — add `parent_id` to `promptys` Row/Insert/Update types

### TabBar: Route Mismatch

Current TabBar has `{ to: '/create', ... }` but CONTEXT.md specifies `/criar`. The route and page must be `/criar`. The TabBar entry must be updated to `to: '/criar'`. App.tsx must add `<Route path="/criar" element={<CriarPage />} />`.

Additionally, the sparkle button for L3 must be **visually distinct** from regular tabs — 48×48px gradient button, -8px vertical margin, NOT a standard NavLink. The current TabBar renders all visible tabs uniformly as NavLinks. The TabBar component needs restructuring to treat the Criar button specially for L3.

### TabBar Test Impact

`src/components/layout/TabBar.test.tsx` has an assertion: `expect(screen.getAllByRole('link')).toHaveLength(5)` for L3. If the sparkle Criar button becomes a `<button>` (not a `<Link>`), this test will fail. The test expects it as a link. **Resolution:** Keep Criar as NavLink (to `/criar`), but apply special styling via conditional class/style when `t.to === '/criar' && isL3`. This avoids test breakage while allowing visual treatment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas pipeline | `compressToWebP()` from `compress.ts` | Already handles resize + quality fallback + WebP conversion |
| Variable parsing | Custom regex utility | `extractVariables()` with the exact regex from UI-SPEC; `resolveBeginner()` from `template.ts` | Single source of truth; prevents logic duplication |
| Points on publish | Frontend INSERT to `point_events` | SQL trigger on `promptys INSERT` | RLS blocks frontend writes; SECURITY DEFINER trigger is the established pattern |
| Slug generation | Manual form field | Auto-generate from title (kebab-case + nanoid suffix) in `useCreatePrompty.ts` | Slugs must be unique; auto-generation prevents conflicts |
| Stats aggregation table | New `prompty_stats` table | Count queries on `point_events`, `prompty_saves`, `prompty_tests` | Avoids write-amplification; existing data is authoritative |
| Level gating in SQL | RLS policy checking level | Frontend check via `levelOf()` + conditional render | LEVL-07: features appear progressively, never as disabled. SQL-level blocking is still enforced by RLS on INSERT (author must be authenticated) |

---

## Common Pitfalls

### Pitfall 1: `beginner_prompt` vs `template` confusion

**What goes wrong:** Developer adds a new `beginner_prompt TEXT` column to `promptys` thinking it's separate from `template`, causing a duplicate-storage bug.
**Why it happens:** CONTEXT.md uses product terminology; schema uses technical column names.
**How to avoid:** Map at the hook layer — `useCreatePrompty.ts` receives `beginner_prompt` from the wizard and writes it to `template`. Document this mapping in the hook with a comment.
**Warning signs:** If `database.types.ts` gains a `beginner_prompt` column, stop — that's wrong.

### Pitfall 2: Copy count is unique copiers, not total copies

**What goes wrong:** Stats show "3 cópias" when 10 people copied, because `point_events` has `UNIQUE (user_id, event_type, ref_id)` — each user generates at most one copy event per prompty.
**Why it happens:** The points system is idempotent by design (ON CONFLICT DO NOTHING). This prevents points gaming but also de-duplicates copy events.
**How to avoid:** Accept unique copier count as the stat. Label it "Usuários que copiaram" if accuracy matters, or just "Cópias" and accept the semantic imprecision for MVP.
**Warning signs:** Creator says "my prompty shows 1 copy but I know many people used it."

### Pitfall 3: `prompty_versions` version number race condition

**What goes wrong:** Two concurrent "Salvar versão" clicks create two versions with `version = MAX(current) + 1`, causing a UNIQUE constraint violation on `(prompty_id, version)`.
**Why it happens:** `SELECT MAX(version) + 1` is not atomic.
**How to avoid:** In the `useCreatePrompty` hook's `saveVersion()`, use a Supabase RPC function that atomically computes the next version number using `COALESCE(MAX(version), 0) + 1` inside a transaction, or use the current `prompty.version` field (which is already on the `promptys` row) as the version number and increment it atomically.
**Warning signs:** 409 conflict errors on version saves.

### Pitfall 4: Wizard state loss on browser back navigation

**What goes wrong:** Creator fills 3 steps, taps the OS back gesture, loses all data.
**Why it happens:** Wizard state is ephemeral `useState`, not persisted.
**How to avoid:** The back button inside the wizard (`chevronL`) is the only supported back navigation — it goes to the previous step. The `ChromeShell` wraps the route, so OS back would navigate to feed. This is acceptable for MVP; document it.
**Warning signs:** User complaints about lost work — address by adding `sessionStorage` draft persistence in a future iteration.

### Pitfall 5: TabBar sparkle button breaks existing test

**What goes wrong:** Making the Criar button a `<button>` (not `<Link>`) causes `screen.getAllByRole('link')` in TabBar.test.tsx to return 4 instead of 5 for L3.
**Why it happens:** The test asserts link count.
**How to avoid:** Keep the Criar entry as a `NavLink` in the TABS array; apply gradient styling conditionally via `style` prop based on `t.to === '/criar'`. The NavLink renders as an `<a>` (role=link). Alternatively, update the test to assert on `aria-label` presence instead of link count.

### Pitfall 6: `parent_id` ON DELETE behavior

**What goes wrong:** Original prompty is deleted (by admin), orphaning variations.
**Why it happens:** FK without delete rule defaults to RESTRICT, blocking deletion.
**How to avoid:** Use `ON DELETE SET NULL` so parent_id becomes NULL if the original is removed. The variation remains in the feed but loses its attribution link. This is the correct behavior for MVP.

### Pitfall 7: Slug uniqueness for wizard-created promptys

**What goes wrong:** Auto-generated slug from title collides with existing slug.
**Why it happens:** Many promptys may share similar titles.
**How to avoid:** Generate slug as `kebab(title)-<6-char-nanoid>`. Example: `"retrato cinematografico"` → `"retrato-cinematografico-x7k2p9"`. The suffix makes collisions negligible. `nanoid(6)` (already available as a browser-compatible function) is sufficient.

---

## Code Examples

### Slug Generation

```typescript
// In useCreatePrompty.ts — no additional package needed
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 8)  // 6 char random
  return `${base}-${suffix}`
}
```

### Wizard Publish (useCreatePrompty.ts)

```typescript
// Maps wizard form data to DB column names
async function publish(form: WizardData): Promise<{ ok: boolean; error?: string; slug?: string }> {
  const user = useAuthStore.getState().user
  if (!user) return { ok: false, error: 'Não autenticado' }

  const slug = generateSlug(form.title)

  // Upload cover image if provided
  let cover_url: string | null = null
  if (form.coverFile) {
    cover_url = await uploadCoverImage(user.id, slug, form.coverFile)
  }

  const { data, error } = await supabase.from('promptys').insert({
    author_id: user.id,
    slug,
    title: form.title,
    template: form.beginner_prompt,       // terminology mapping
    difficulty: form.category,             // terminology mapping: 'simple'→'beginner', etc.
    models: form.recommendedModel ? [form.recommendedModel] : [],
    style_tags: form.styleTags ?? [],
    inputs_schema: form.inputs_schema ?? [],
    cover_url,
    status: 'published',
    parent_id: form.parentId ?? null,
  }).select('slug').single()

  if (error) return { ok: false, error: 'Não foi possível publicar.' }

  // If advanced mode used, save version snapshot
  if (form.advancedTemplate && data) {
    // version save is best-effort
    await supabase.from('prompty_versions').insert({
      prompty_id: data.id,
      version: 1,
      template: form.advancedTemplate,
      inputs_schema: form.inputs_schema ?? [],
    })
  }

  return { ok: true, slug: data?.slug }
}
```

### Stats Aggregation (useMyPromptys.ts)

```typescript
// Per-prompty stat fetch — three parallel count queries
async function fetchStats(promptyId: string) {
  const [copies, saves, feedbacks] = await Promise.all([
    supabase.from('point_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'copy').eq('ref_id', promptyId),
    supabase.from('prompty_saves')
      .select('*', { count: 'exact', head: true })
      .eq('prompty_id', promptyId),
    supabase.from('prompty_tests')
      .select('*', { count: 'exact', head: true })
      .eq('prompty_id', promptyId),
  ])
  return {
    copies: copies.count ?? 0,
    saves: saves.count ?? 0,
    feedbacks: feedbacks.count ?? 0,
  }
}
```

### Publish Points Trigger (SQL migration)

```sql
-- Fires on INSERT into promptys where status = 'published'
CREATE OR REPLACE FUNCTION award_points_on_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' THEN
    INSERT INTO point_events (user_id, event_type, points, ref_id)
    VALUES (NEW.author_id, 'publish', 50, NEW.id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_points(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_points_on_publish ON promptys;
CREATE TRIGGER trg_points_on_publish
  AFTER INSERT ON promptys
  FOR EACH ROW EXECUTE FUNCTION award_points_on_publish();
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 3 |
|--------------|------------------|-------------------|
| Manual `nanoid` import | `Math.random().toString(36).slice(2, 8)` for slug suffix | No package install needed |
| Separate `beginner_prompt` / `template` columns | Single `template` column with versions table | Wizard writes beginner text to `template`; advanced template creates a version snapshot |
| N+1 queries for stats | `Promise.all` with `count: exact, head: true` (no data transfer) | Fast, no over-fetching |

**Already in project — no version research needed:**
- `@tanstack/react-query` v5 infinite query pattern — confirmed in `useFeed.ts`
- `@supabase/supabase-js` storage upload — confirmed in `useTest.ts`
- Vitest + RTL — confirmed in `vitest.config.ts`

---

## Open Questions

1. **`beginner_prompt` vs `advanced_template` in same `template` column**
   - What we know: DB has one `template` column. When a creator uses advanced mode, the advanced template is more complete.
   - What's unclear: Does the wizard replace `template` with `advanced_template` on publish, or does `template` always stay as beginner and advanced lives only in `prompty_versions`?
   - Recommendation: Store beginner text in `template` always. If advanced mode is completed, also create a `prompty_versions` snapshot with `advanced_template`. L1 users always see `resolveBeginner(template, [])`. The `prompty_versions` row is for creator's history, not for L1 display.

2. **`prompty_remixes` table vs `parent_id` on `promptys`**
   - What we know: `prompty_remixes (original_id, remix_id)` already exists in schema (Migration 001). CONTEXT.md decided to use `parent_id` directly on `promptys`.
   - What's unclear: Which approach to implement — populate `prompty_remixes` OR add `parent_id`?
   - Recommendation: Add `parent_id` as CONTEXT.md decided (simpler for stats/display). The `prompty_remixes` table can remain for future v2 chain-attribution. On publish of a variation, insert into BOTH `parent_id` (on `promptys`) AND `prompty_remixes` for forward compatibility.

3. **Difficulty column value mapping for wizard labels**
   - What we know: DB `difficulty` CHECK is `('beginner','intermediate','advanced')`. CONTEXT.md calls these "Simples/Guiado/Avançado" (simple/guided/advanced).
   - What's unclear: Do we change the CHECK constraint or map at the application layer?
   - Recommendation: Map at application layer. Wizard sends `'beginner'` when user picks "Simples", `'intermediate'` for "Guiado", `'advanced'` for "Avançado". No migration needed for the constraint.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x + React Testing Library 16.x |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm test:run --reporter=verbose src/components/create/` |
| Full suite command | `pnpm test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CREAT-01 | Wizard publishes prompty with title + prompt + category | unit | `pnpm test:run src/hooks/useCreatePrompty.test.ts` | ❌ Wave 0 |
| CREAT-01 | CriarPage renders step 1 with title/category fields | unit | `pnpm test:run src/pages/CriarPage.test.tsx` | ❌ Wave 0 |
| CREAT-02 | Complexity toggle renders 3 options, defaults to 'simple' | unit | `pnpm test:run src/components/create/WizardStep1Basics.test.tsx` | ❌ Wave 0 |
| CREAT-03 | MyPromptysGrid shows stats counters for L3 user | unit | `pnpm test:run src/components/profile/MyPromptysGrid.test.tsx` | ❌ Wave 0 |
| CREAT-03 | MyPromptysGrid hidden for L1/L2 (LEVL-07) | unit | same file | ❌ Wave 0 |
| CREAT-04 | Variation fork pre-fills wizard with parent data | unit | `pnpm test:run src/pages/CriarPage.test.tsx` | ❌ Wave 0 |
| CREAT-04 | "Criar variação" button visible only for L3 on PromptyDetailPage | unit | `pnpm test:run src/pages/PromptyDetailPage.test.tsx` | ✅ exists (extend) |
| CREAT-05 | Variable detection extracts unique keys from template text | unit | `pnpm test:run src/components/create/WizardStep4Advanced.test.tsx` | ❌ Wave 0 |
| CREAT-05 | resolveBeginner preview matches detected variables | unit | `pnpm test:run src/lib/prompty/template.test.ts` | ✅ exists (extend) |
| LEVL-07 | TabBar L3: 5 links visible (Feed/Buscar/Criar/Ranking/Perfil) | unit | `pnpm test:run src/components/layout/TabBar.test.tsx` | ✅ exists (passes) |

### Sampling Rate

- **Per task commit:** `pnpm test:run src/components/create/ src/hooks/useCreatePrompty.test.ts`
- **Per wave merge:** `pnpm test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useCreatePrompty.test.ts` — covers CREAT-01, CREAT-04
- [ ] `src/pages/CriarPage.test.tsx` — covers CREAT-01, CREAT-04 (route + wizard mount)
- [ ] `src/components/create/WizardStep1Basics.test.tsx` — covers CREAT-02
- [ ] `src/components/profile/MyPromptysGrid.test.tsx` — covers CREAT-03 (stats display + L3 gate)
- [ ] `src/components/create/WizardStep4Advanced.test.tsx` — covers CREAT-05 (variable detection)

---

## Sources

### Primary (HIGH confidence)

- `supabase/migrations/20260507000001_initial_schema.sql` — exact column names, CHECK constraints, existing tables
- `supabase/migrations/20260507000002_rls_policies.sql` — existing RLS policies; what policies exist for new tables
- `supabase/migrations/20260507000003_triggers_points.sql` — trigger pattern, `update_profile_points()` function signature
- `src/hooks/useTest.ts` — authoritative Storage upload pattern
- `src/lib/prompty/template.ts` — `InputField` type, `resolveBeginner()` signature
- `src/components/layout/TabBar.tsx` — current route structure, level-gating implementation
- `src/types/database.types.ts` — TypeScript types confirming schema structure
- `src/lib/constants/levels.ts` — L3 threshold (250 points), `levelOf()` function
- `03-UI-SPEC.md` — variable detection regex, component inventory, interaction contracts
- `03-CONTEXT.md` — locked decisions, integration points

### Secondary (MEDIUM confidence)

- `src/pages/ProfilePage.tsx` — existing grid pattern (`gridTemplateColumns: 'repeat(3, 1fr)'`) to extend for MyPromptys
- `src/pages/PromptyDetailPage.tsx` — hook structure, where to add "Criar variação" button
- `src/components/layout/TabBar.test.tsx` — test assertions that constrain TabBar implementation changes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Schema mapping: HIGH — read directly from migration files
- Architecture patterns: HIGH — extracted from existing production code
- Pitfalls: HIGH — identified from code constraints (UNIQUE constraints, RLS, test assertions)
- Stats aggregation: MEDIUM — `count: exact, head: true` pattern verified from supabase-js docs patterns; Supabase JS v2 supports this natively

**Research date:** 2026-05-08
**Valid until:** 2026-06-08 (stable stack; 30-day window)
