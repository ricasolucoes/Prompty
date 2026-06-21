# Phase 4: Ledger de Créditos + Bônus de Cadastro - Research

**Researched:** 2026-05-31
**Domain:** PostgreSQL ledger schema, RLS hardening, SECURITY DEFINER triggers, React/Zustand selector
**Confidence:** HIGH — grounded entirely in the existing codebase migrations, no speculative patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Modelo de dados:** `credit_events` append-only espelhando `point_events`. Colunas: `id uuid pk`, `user_id uuid → profiles(id) ON DELETE CASCADE`, `event_type text CHECK (...)`, `delta integer NOT NULL`, `ref_id uuid NULL`, `created_at timestamptz default now()`.

`event_type` permitidos Phase 4: `signup_bonus`, `earned_contribution`, `spent_generation`, `refund`, `admin_grant`. (Apenas `signup_bonus` é usado nesta fase.)

Coluna cacheada: `profiles.credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0)`.

Função `update_profile_credits(target_user uuid)` recalcula `SUM(delta)` → `profiles.credits`.

**RLS:** `credit_events`: SELECT apenas do próprio; INSERT bloqueado para `anon, authenticated` (WITH CHECK (false)); sem UPDATE/DELETE.

**CRÍTICO — bloquear mutação direta de profiles.credits:** `BEFORE UPDATE` trigger que, quando sessão é `authenticated` (cliente), rejeita `NEW.credits <> OLD.credits`. Apenas funções SECURITY DEFINER podem alterar.

**Bônus de cadastro (idempotente):** Estender `handle_new_user()` — APÓS o `INSERT INTO profiles`, inserir `credit_events (user_id, event_type, delta) VALUES (NEW.id, 'signup_bonus', 1)` com idempotência via índice único parcial `CREATE UNIQUE INDEX credit_events_signup_once ON credit_events (user_id) WHERE event_type = 'signup_bonus'`.

**spend_credit():** `SECURITY DEFINER SET search_path = public`, `pg_advisory_xact_lock`, `SELECT credits ... FOR UPDATE`, retorna `(ok=false, balance)` se insuficiente, senão insere `credit_events` e chama `update_profile_credits`.

**refund_credit():** `SECURITY DEFINER`, insere `credit_events delta=+1, event_type='refund', ref_id=p_ref`, chama `update_profile_credits`.

**Build-order:** `generations` table + bucket `prompty-generations` criados nesta fase (Phase 6 escreve neles).

**Frontend:** Badge de saldo no AppHeader ao lado do badge de nível (inline styles). `useCredits` é selector de 1 linha sobre o profile no store. Sem nova query — `profiles.credits` já vem no `select('*')` do `refetchProfile`. Página/sheet de histórico de créditos consultando `credit_events`.

**Estilo:** Inline styles (padrão Phase 1). Design system colors. Migration SQL em `supabase/migrations/`.

### Claude's Discretion

- Nome exato do arquivo de migration e do trigger de guarda
- Layout exato do badge e da tela de histórico
- Se o histórico de créditos é uma página dedicada ou um sheet no Perfil

### Deferred Ideas (OUT OF SCOPE)

- Ganhar créditos por contribuição → Phase 5
- Edge Function de geração + upload + escolha de provider → Phase 6
- Compra/pagamento de créditos → out of scope (REQUIREMENTS.md)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRED-01 | Usuário ganha 1 crédito automaticamente ao se cadastrar (exatamente uma vez, idempotente) | `handle_new_user` extension + partial unique index pattern from PITFALLS.md Pitfall 6 |
| CRED-02 | Usuário vê seu saldo de créditos na UI (badge no AppHeader) | `useCredits` selector over existing `refetchProfile`; AppHeader modification pattern confirmed from reading the file |
| CRED-03 | Saldo nunca fica negativo e não pode ser alterado diretamente pelo client — só via ledger + triggers/RPC | `CHECK (credits >= 0)` + BEFORE UPDATE guard trigger + RLS WITH CHECK (false) on credit_events |
| CRED-04 | Usuário pode ver o próprio histórico de eventos de crédito, apenas o seu (RLS select-own) | `credit_events_select_own` policy + simple query component |
</phase_requirements>

---

## Summary

Phase 4 is a pure database + minimal frontend phase. The implementation is structurally identical to the existing `point_events` system (migrations 001–003) — every pattern already exists in the codebase. The main new work is: (1) the BEFORE UPDATE guard trigger on `profiles` to close the `profiles_update_own` policy hole; (2) extending `handle_new_user` with idempotent credit bonus; and (3) adding `spend_credit()` / `refund_credit()` SECURITY DEFINER functions that Phase 6 will consume. The frontend change is minimal: a one-line selector and a badge component alongside the existing level badge in AppHeader.

The critical implementation detail that does NOT have a prior example in the codebase is the BEFORE UPDATE trigger to block client mutation of `profiles.credits`. The correct mechanism is `current_setting('is_superuser', true) = 'on' OR session_user = 'supabase_admin' OR pg_has_role(session_user, 'supabase_auth_admin', 'member')` — but the simplest correct approach in Supabase's PostgreSQL is to check `current_setting('role')` inside the trigger: the authenticated role is `'authenticated'`; SECURITY DEFINER functions run as the function owner (usually `postgres` or `supabase_admin`), which will have `session_user != 'authenticated'`. The guard: raise exception when `NEW.credits IS DISTINCT FROM OLD.credits AND current_user = 'authenticated'`.

**Primary recommendation:** Single migration file `20260531000008_phase4_credits_ledger.sql` containing all DDL — schema, RLS, guard trigger, handle_new_user extension, spend/refund functions, generations table, bucket. Followed by type regeneration and two minimal frontend files.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase hosted) | PG17 | All DDL, triggers, RLS, advisory locks | Already in use; all 7 migrations run here |
| `@supabase/supabase-js` | ^2.50.0 (in package.json) | Client SDK for `select('*')` profile fetch and `credit_events` history query | Already the sole DB client per CLAUDE.md |
| Zustand | ^5.0.5 | `useAuthStore` selector for credits | Already in use — zero new dependency |
| Vitest + @testing-library/react | ^3.1.0 / ^16.3.0 | Unit tests for frontend components and hooks | Already in use — confirmed in package.json |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pnpm gen:types` (supabase CLI) | ^2.23.0 | Regenerate `database.types.ts` after migration | After migration is applied to local Supabase |

**Installation:** No new npm dependencies required.

---

## Architecture Patterns

### Migration File Naming

**Confirmed by inspection:** The last migration is `20260512000007_phase3_criador.sql`. The next migration filename must be:

```
20260531000008_phase4_credits_ledger.sql
```

Format: `YYYYMMDDSSSSSS_description.sql` where SSSSSS is a 6-digit sequence. The sequence `000008` follows `000007` naturally. Date `20260531` is today.

### Recommended Project Structure Changes

```
supabase/
└── migrations/
    └── 20260531000008_phase4_credits_ledger.sql   (NEW — single file, all DDL)

src/
├── hooks/
│   ├── useCredits.ts            (NEW — 5 lines, selector)
│   └── useCreditHistory.ts      (NEW — query credit_events)
├── components/
│   └── layout/
│       └── AppHeader.tsx        (MODIFIED — add credit badge)
├── pages/
│   └── CreditHistoryPage.tsx    (NEW — or sheet on ProfilePage)
└── types/
    └── database.types.ts        (MODIFIED — run pnpm gen:types)
```

### Pattern 1: Mirror update_profile_points → update_profile_credits

The exact blueprint from migration 003, lines 46–52:

```sql
-- Migration 003, lines 46–52 (exact source to mirror)
CREATE OR REPLACE FUNCTION update_profile_points(target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total FROM point_events WHERE user_id = target_user;
  UPDATE profiles SET points = total, level = level_from_points(total) WHERE id = target_user;
END;
$$;
```

The credits mirror (key differences: column name `delta` not `points`; update `credits` not `points + level`; floor at 0 via GREATEST):

```sql
CREATE OR REPLACE FUNCTION update_profile_credits(target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO total FROM credit_events WHERE user_id = target_user;
  UPDATE profiles SET credits = GREATEST(total, 0) WHERE id = target_user;
END;
$$;
```

`GREATEST(total, 0)` ensures the cache column can never dip below 0 even if a bug produces a momentary negative sum. The `CHECK (credits >= 0)` constraint is the database-level last resort.

### Pattern 2: handle_new_user Extension

Existing function (migration 003, lines 23–36) does a single profile INSERT. Extension adds two statements after the INSERT:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- EXISTING: create profile (unchanged)
  INSERT INTO profiles (id, name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  -- NEW: signup bonus — idempotent via partial unique index
  -- The partial index credit_events_signup_once makes two NULL-ref_id
  -- rows for the same (user_id, 'signup_bonus') collide.
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (NEW.id, 'signup_bonus', 1, NULL)
  ON CONFLICT DO NOTHING;

  -- NEW: refresh cached balance
  PERFORM update_profile_credits(NEW.id);

  RETURN NEW;
END;
$$;
-- Trigger already exists (DROP IF EXISTS before CREATE in migration 003) —
-- DROP TRIGGER / CREATE TRIGGER must be repeated to bind to the new function body.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Why `ON CONFLICT DO NOTHING` (not `ON CONFLICT (user_id, event_type, ref_id)`)?**
With a partial unique index, the conflict target in ON CONFLICT must either be the index predicate expression OR use the generic DO NOTHING (which matches any unique violation). Using a named partial index as conflict target requires `ON CONFLICT ON CONSTRAINT <index_name>` or just `ON CONFLICT DO NOTHING`. The simpler form is `ON CONFLICT DO NOTHING` — it catches any unique violation including the partial one.

### Pattern 3: BEFORE UPDATE Guard Trigger on profiles.credits

**The problem:** Migration 002 creates `profiles_update_own` policy:
```sql
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
This allows an authenticated user to run `supabase.from('profiles').update({ credits: 999 })` and bypass the ledger entirely.

**The solution:** A BEFORE UPDATE trigger that blocks credit mutation from the `authenticated` role. SECURITY DEFINER functions run as `postgres` (the function definer), not as `authenticated`, so the check correctly distinguishes client vs server callers.

```sql
CREATE OR REPLACE FUNCTION guard_profiles_financial_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Block direct client mutation of credits (and points/level as belt-and-suspenders)
  -- SECURITY DEFINER functions run as 'postgres', not 'authenticated'
  -- current_user is the role whose privileges are active in this session context
  IF current_user = 'authenticated' THEN
    IF NEW.credits IS DISTINCT FROM OLD.credits THEN
      RAISE EXCEPTION 'Direct mutation of profiles.credits is not allowed. Use credit functions.';
    END IF;
    -- Also guard points and level (belt-and-suspenders for the existing system)
    IF NEW.points IS DISTINCT FROM OLD.points THEN
      RAISE EXCEPTION 'Direct mutation of profiles.points is not allowed. Use point functions.';
    END IF;
    IF NEW.level IS DISTINCT FROM OLD.level THEN
      RAISE EXCEPTION 'Direct mutation of profiles.level is not allowed. Use point functions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_financial_columns ON profiles;
CREATE TRIGGER trg_guard_financial_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profiles_financial_columns();
```

**Why `current_user = 'authenticated'` works:** In Supabase PostgREST, client requests run with `SET LOCAL role = 'authenticated'` — which sets `current_user` to `'authenticated'` for that transaction. SECURITY DEFINER functions run under the definer's role (`postgres` by default), so `current_user` inside a SECURITY DEFINER function will NOT be `'authenticated'`. This is the Supabase-standard pattern.

**Verification:** After applying the migration, test with:
```sql
-- As authenticated client (should RAISE EXCEPTION):
UPDATE profiles SET credits = 999 WHERE id = auth.uid();

-- As service_role / SECURITY DEFINER (should succeed):
SELECT update_profile_credits('<user_uuid>');
```

### Pattern 4: spend_credit() — Advisory Lock + FOR UPDATE

The CONTEXT.md specifies both `pg_advisory_xact_lock` AND `SELECT ... FOR UPDATE`. Both are needed because:
- Advisory lock serializes two concurrent sessions that both begin their transactions before either reaches the FOR UPDATE row lock
- FOR UPDATE then additionally blocks any concurrent `update_profile_credits` call (e.g., an earn trigger firing simultaneously)

```sql
CREATE OR REPLACE FUNCTION spend_credit(p_ref UUID DEFAULT NULL)
RETURNS TABLE(ok BOOLEAN, balance INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id    UUID;
  v_credits    INTEGER;
BEGIN
  -- Derive user_id from JWT (never trust request body for financial ops)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Per-user advisory lock (releases at transaction end automatically)
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- Row lock: consistent read within the lock scope
  SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id FOR UPDATE;

  IF v_credits IS NULL OR v_credits < 1 THEN
    RETURN QUERY SELECT false, COALESCE(v_credits, 0);
    RETURN;
  END IF;

  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (v_user_id, 'spent_generation', -1, p_ref)
  ON CONFLICT DO NOTHING;

  PERFORM update_profile_credits(v_user_id);

  SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id;
  RETURN QUERY SELECT true, v_credits;
END;
$$;
GRANT EXECUTE ON FUNCTION spend_credit(UUID) TO authenticated;
```

**Note on advisory lock key:** `hashtext()` returns INTEGER (4 bytes). `pg_advisory_xact_lock` takes BIGINT. The cast is implicit and safe. Alternatively use the 2-integer variant: `pg_advisory_xact_lock(hashtext(v_user_id::text), 42)` where 42 is a namespace constant.

### Pattern 5: generations Table (Created Early, Written Phase 6)

Mirrors the pattern from migration 004 (unlock_events): table + RLS in same file.

```sql
CREATE TABLE generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompty_id      UUID REFERENCES promptys(id) ON DELETE SET NULL,
  credit_event_id UUID REFERENCES credit_events(id),
  image_path      TEXT,
  provider        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_generations_user ON generations(user_id, created_at DESC);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generations_select_own" ON generations
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "generations_no_client_insert" ON generations
  FOR INSERT TO anon, authenticated WITH CHECK (false);
```

### Pattern 6: Storage Bucket (private)

Following the pattern from migration 004 (`prompty-results`) and migration 007 (`prompty-covers`), but with `public = false`:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompty-generations',
  'prompty-generations',
  false,          -- PRIVATE: accessed only via signed URLs
  5242880,        -- 5 MB (AI-generated images larger than user uploads)
  ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public        = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Read own folder only (folder[1] = user_id)
CREATE POLICY "prompty-generations read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'prompty-generations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
-- No client INSERT policy — Edge Function uploads via service-role key (Phase 6)
```

### Pattern 7: Frontend — useCredits Selector

`auth.store.ts` already has `select('*')` on profiles. After migration, `profiles.credits` is in the Row type. `refetchProfile` will automatically include it. The selector is:

```typescript
// src/hooks/useCredits.ts
import { useAuthStore } from '@/stores/auth.store'

export function useCredits() {
  const credits = useAuthStore((s) => s.profile?.credits ?? 0)
  return { credits }
}
```

**CRITICAL for TypeScript:** After applying the migration, run `pnpm gen:types` to regenerate `database.types.ts`. Until then, add `credits?: number` manually to the Profile Row type in `database.types.ts` to unblock TypeScript compilation during development.

### Pattern 8: AppHeader Credit Badge

The existing AppHeader (confirmed by reading the file) renders:
1. Left: logo + "Promptys" wordmark
2. Right: level badge (a single `<div>` with inline styles)

The credit badge goes alongside the level badge, wrapped in a flex container:

```tsx
// In AppHeader.tsx — replace the single right-side badge div with a row of two badges
const credits = useAuthStore((s) => s.profile?.credits ?? 0)

// ...inside the header JSX, replace the single level badge div:
<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  {/* Credit badge */}
  <div style={{
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(255,107,74,0.12)',   // Solar Coral soft
    color: '#FF6B4A',                        // Solar Coral
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }}
    aria-label={`${credits} crédito${credits === 1 ? '' : 's'}`}
  >
    <span aria-hidden="true">🎟</span>
    {credits}
  </div>
  {/* Existing level badge — unchanged */}
  <div style={{ /* existing styles */ }}>
    {lvl.name}
  </div>
</div>
```

Color choice: Solar Coral `#FF6B4A` (from CLAUDE.md design system) distinguishes credits from the level badge which uses Electric Violet `#7C3AED`.

### Anti-Patterns to Avoid

- **Never call `update({ credits: ... })` from the frontend.** The BEFORE UPDATE guard trigger will reject it, but the code should never reach that point. Search codebase for `.update(` before merging to confirm no such call exists.
- **Never create a separate `useCredits` query to Supabase.** The balance is already on the profile row from `select('*')`. A new `.from('profiles').select('credits')` is redundant and creates a second subscription to the same data.
- **Do not add an UPDATE policy on credit_events.** The table is append-only by design. No rows are ever modified. The absence of an UPDATE policy is intentional.
- **Do not use `UPDATE profiles SET credits = credits - 1`** inside `spend_credit`. Always recompute from `SUM(delta)` via `update_profile_credits` — this keeps the cache consistent with the ledger even if multiple events fire in a single transaction.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Advisory locking | Custom lock table with INSERT/DELETE | `pg_advisory_xact_lock(hashtext(...))` | Built into PostgreSQL; auto-releases at tx end; no cleanup needed |
| Idempotent bonus | CHECK in application code | Partial unique index + `ON CONFLICT DO NOTHING` | Database-enforced; survives trigger retries, re-seeds, OAuth re-links |
| Balance floor enforcement | Application-layer `Math.max(0, balance)` | `GREATEST(total, 0)` in `update_profile_credits` + `CHECK (credits >= 0)` constraint | Two layers: soft (GREATEST) + hard (constraint) |
| Client-mutation blocking | Frontend validation | BEFORE UPDATE trigger + RLS `WITH CHECK (false)` | Server-enforced; frontend cannot be trusted |
| Type-safe RPC return | Multiple RPC calls | `RETURNS TABLE(ok BOOLEAN, balance INTEGER)` | Single round-trip; atomic result; clear contract for Phase 6 |

---

## Common Pitfalls

### Pitfall 1: UNIQUE constraint on credit_events for signup_bonus idempotency

**What goes wrong:** Using `UNIQUE (user_id, event_type, ref_id)` with `ref_id = NULL` for the signup bonus. In standard PostgreSQL, `NULL != NULL`, so two rows with the same `user_id`, `event_type='signup_bonus'`, and `ref_id=NULL` do NOT collide on a standard unique constraint — duplicates are possible.

**Why it happens:** The existing `point_events` table uses `UNIQUE (user_id, event_type, ref_id)` (migration 001, line 121). This works for points because ref_id is always a non-null UUID. The signup bonus has `ref_id = NULL`, which breaks the standard uniqueness semantics.

**How to avoid:** Use a **partial unique index** (not a table constraint):
```sql
CREATE UNIQUE INDEX credit_events_signup_once
  ON credit_events (user_id)
  WHERE event_type = 'signup_bonus';
```
This is simpler and more correct than `NULLS NOT DISTINCT` (a PostgreSQL 15+ feature that may or may not be available on the Supabase hosted version). The partial index enforces "exactly one signup_bonus per user" without any NULL semantics complication.

**Warning signs:** Any user with `COUNT(*) > 1` from `SELECT count(*) FROM credit_events WHERE event_type = 'signup_bonus' GROUP BY user_id HAVING count(*) > 1`.

### Pitfall 2: UNIQUE constraint on credit_events table-level — conflicts with partial index approach

**What goes wrong:** The table-level `UNIQUE (user_id, event_type, ref_id)` from point_events — if copied verbatim — will not protect the signup bonus case (NULL ref_id) but WILL prevent `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` from working for spending events where ref_id is a UUID.

**How to avoid:** The credit_events table should have:
1. A table-level `UNIQUE (user_id, event_type, ref_id)` for earn/spend events where ref_id is non-null
2. A separate `UNIQUE INDEX ... WHERE event_type = 'signup_bonus'` for the null-ref_id case

Or: omit the table-level unique constraint entirely and rely solely on the partial index for signup_bonus. For `spent_generation`/`refund` events, the `ref_id` is a UUID-per-request (minted by Phase 6's Edge Function), so uniqueness is natural.

**Simplest correct approach for Phase 4 scope (signup_bonus only):**
```sql
-- Just the partial index for signup_bonus:
CREATE UNIQUE INDEX credit_events_signup_once
  ON credit_events (user_id)
  WHERE event_type = 'signup_bonus';
```
The broader table-level UNIQUE can be added in the same migration for future earn/spend events:
```sql
UNIQUE (user_id, event_type, ref_id)  -- on the table definition
```
These two constraints do not conflict: the partial index is more specific and handles the NULL ref_id case that the table constraint misses.

### Pitfall 3: current_user vs session_user vs pg_has_role in the guard trigger

**What goes wrong:** Using `session_user` in the guard trigger. `session_user` in Supabase is typically `postgres` or `authenticator` for all PostgREST requests — it does NOT change to `authenticated` during a request. Only `current_user` (reflecting `SET LOCAL role = 'authenticated'`) is the correct check.

**How to avoid:** Use `current_user = 'authenticated'` not `session_user`. Verified via Supabase PostgREST docs: PostgREST sets `SET LOCAL role = <role>` before executing queries, which changes `current_user` but not `session_user`.

**Test to confirm:**
```sql
-- In a client session (should return 'authenticated'):
SELECT current_user;
-- In a SECURITY DEFINER function (should return 'postgres' or function owner):
CREATE OR REPLACE FUNCTION test_current_user() RETURNS TEXT
LANGUAGE sql SECURITY DEFINER AS $$ SELECT current_user; $$;
SELECT test_current_user();
```

### Pitfall 4: `profiles_update_own` policy still allows non-credits UPDATE after the guard trigger

**What goes wrong:** The guard trigger blocks credits/points/level mutations but the policy still permits UPDATE of other columns like `bio`, `username`, `avatar_url`. This is the CORRECT behavior — the policy is broad; the trigger is surgical. Do not drop or replace the policy.

**How to avoid:** Keep `profiles_update_own` unchanged. The trigger only raises on financial column changes. Non-financial column updates (bio, username, avatar_url, streak) pass through the trigger without issue.

### Pitfall 5: `pnpm gen:types` strips trailing version notice from Supabase CLI

**What goes wrong:** `supabase gen types typescript --local` appends a version notice after the `} as const` closing brace, which breaks the TypeScript file. This is a known issue logged in STATE.md (Phase 02 decision).

**How to avoid:** The `gen:types` script in package.json already pipes through prettier: `supabase gen types typescript --local > src/types/database.types.ts && prettier --write src/types/database.types.ts`. Prettier will handle minor formatting issues. If the version notice appears, strip trailing lines after `} as const` manually.

---

## Code Examples

### complete credit_events table DDL

```sql
-- Source: mirror of supabase/migrations/20260507000001_initial_schema.sql lines 113–123
CREATE TABLE credit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
                'signup_bonus',
                'earned_contribution',
                'spent_generation',
                'refund',
                'admin_grant'
              )),
  delta       INTEGER NOT NULL,
  ref_id      UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_type, ref_id)  -- covers non-null ref_id cases
);
CREATE INDEX idx_credit_events_user ON credit_events(user_id, created_at DESC);

-- Partial unique index for signup_bonus (ref_id IS NULL — standard UNIQUE misses this)
CREATE UNIQUE INDEX credit_events_signup_once
  ON credit_events (user_id)
  WHERE event_type = 'signup_bonus';
```

### profiles.credits column addition

```sql
-- Source: mirrors point_events pattern (profiles.points in migration 001 line 15)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0);
```

### RLS for credit_events

```sql
-- Source: mirror of migration 002 lines 56–58 (point_events)
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_events_select_own"
  ON credit_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "credit_events_no_client_insert"
  ON credit_events FOR INSERT TO anon, authenticated
  WITH CHECK (false);
-- No UPDATE or DELETE policies — append-only
```

### useCreditHistory hook

```typescript
// src/hooks/useCreditHistory.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function useCreditHistory() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['credit_events', user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_events')
        .select('id, event_type, delta, created_at, ref_id')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `UPDATE profiles SET points = points + N` | Append-only `point_events` + `update_profile_points` recomputes SUM | Phase 1 (migration 003) | Full audit history; no balance drift; established pattern to mirror exactly |
| RLS-only write blocking | RLS + BEFORE UPDATE trigger guard | Phase 4 (this phase) | Closes the `profiles_update_own` hole for financial columns |
| No credit system | `credit_events` ledger + `profiles.credits` cache | Phase 4 (this phase) | Provider-independent foundation for Phase 6 generation |

---

## Open Questions

1. **UNIQUE constraint interaction between table-level UNIQUE and partial index**
   - What we know: PostgreSQL allows both to coexist. `ON CONFLICT DO NOTHING` will satisfy whichever fires first.
   - What's unclear: Whether the table-level `UNIQUE (user_id, event_type, ref_id)` with ref_id = NULL causes issues when the partial index is present.
   - Recommendation: Test in local Supabase with two consecutive `INSERT ... ON CONFLICT DO NOTHING` for `signup_bonus` with `ref_id = NULL`. If both constraints fire simultaneously PostgreSQL deduplicates. Safe to proceed with both.

2. **`current_user` value inside Supabase BEFORE UPDATE trigger**
   - What we know: PostgREST sets `SET LOCAL role = 'authenticated'` which changes `current_user`. SECURITY DEFINER functions override `current_user` to the function owner.
   - What's unclear: Exact `current_user` value in the Supabase local dev environment (may be `postgres` for all roles in local dev vs. `authenticated` in hosted).
   - Recommendation: Add a `-- VERIFY: SELECT current_user;` comment in the migration and confirm the guard trigger fires correctly in a smoke test before marking CRED-03 complete.

3. **Credit history as page vs sheet**
   - What we know: CONTEXT.md leaves this to Claude's discretion. The app already has a profile page.
   - Recommendation: A bottom sheet on ProfilePage is consistent with the existing OptionsSheet/ReportSheet pattern (seen in `src/hooks/useReport.ts`). A dedicated route adds routing complexity without user value at this stage. Use a sheet.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 |
| Config file | `vitest.config.ts` (separate from vite.config.ts per STATE.md decision) |
| Quick run command | `pnpm test:run --reporter=verbose` |
| Full suite command | `pnpm run quality:all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRED-01 | `handle_new_user` fires → exactly 1 credit_events row with `event_type='signup_bonus'` | SQL smoke (supabase local + psql) | `psql $SUPABASE_DB_URL -f supabase/tests/cred01_signup_bonus.sql` | ❌ Wave 0 |
| CRED-01 | `handle_new_user` fires TWICE → still exactly 1 bonus row (idempotency) | SQL smoke | Same script, second invocation | ❌ Wave 0 |
| CRED-02 | AppHeader renders credit badge with correct count from store | RTL unit | `pnpm test:run src/components/layout/AppHeader.test.tsx` | ❌ Wave 0 |
| CRED-02 | `useCredits` returns `profile.credits ?? 0` when profile is null | RTL unit | `pnpm test:run src/hooks/useCredits.test.ts` | ❌ Wave 0 |
| CRED-03 | `supabase.from('profiles').update({ credits: 999 })` from authenticated client returns error | SQL smoke / RLS test | `psql $SUPABASE_DB_URL -f supabase/tests/cred03_rls_block.sql` | ❌ Wave 0 |
| CRED-03 | Two concurrent `spend_credit()` calls for user with 1 credit → exactly 1 success, balance = 0 | Concurrency SQL test | `psql $SUPABASE_DB_URL -f supabase/tests/cred03_double_spend.sql` | ❌ Wave 0 |
| CRED-03 | `supabase.from('credit_events').insert(...)` from authenticated client returns RLS error | SQL smoke | same cred03_rls_block.sql | ❌ Wave 0 |
| CRED-04 | Authenticated user queries `credit_events` → receives only own rows | SQL smoke | `psql $SUPABASE_DB_URL -f supabase/tests/cred04_rls_isolation.sql` | ❌ Wave 0 |
| CRED-04 | CreditHistoryPage/sheet renders events sorted by date | RTL unit | `pnpm test:run src/pages/CreditHistoryPage.test.tsx` | ❌ Wave 0 |

### Concurrency Test Strategy for Double-Spend (CRED-03)

The project has no pgTAP configured (none found in migrations or package.json). The established test pattern is a psql SQL script. For the double-spend test, a pgbench or two-session psql approach is needed:

```sql
-- supabase/tests/cred03_double_spend.sql
-- Strategy: use two BEGIN/COMMIT blocks with pg_sleep to simulate overlap,
-- or use dblink for a second session. Since dblink may not be available,
-- use the "lock contention" approach: verify advisory lock by checking
-- that pg_advisory_xact_lock actually serializes via a single-session simulation.

-- Simpler deterministic test:
-- 1. Set user credits to 1
-- 2. Call spend_credit() twice in the SAME transaction (should fail — can't hold lock twice)
-- 3. Call spend_credit() in session 1, then again after first commits
-- Verify balance never goes negative.

-- Minimal deterministic version:
BEGIN;
-- Set up: user with exactly 1 credit (via direct insert for test only)
INSERT INTO credit_events (user_id, event_type, delta) VALUES (:'test_user_id', 'signup_bonus', 1) ON CONFLICT DO NOTHING;
SELECT update_profile_credits(:'test_user_id');

-- Spend 1 (should succeed)
SELECT * FROM spend_credit(NULL);

-- Spend 2 (should return ok=false, balance=0)
SELECT * FROM spend_credit(NULL);

-- Assert balance is 0, not -1
SELECT credits FROM profiles WHERE id = :'test_user_id';
ROLLBACK;
```

For true two-session concurrency, the planner should use a shell script with two psql processes:
```bash
psql $SUPABASE_DB_URL -c "SELECT spend_credit(NULL)" &
psql $SUPABASE_DB_URL -c "SELECT spend_credit(NULL)" &
wait
psql $SUPABASE_DB_URL -c "SELECT credits FROM profiles WHERE id = '<test_user>'"
# Assert: credits = 0, not -1
```

### Sampling Rate

- **Per task commit:** `pnpm test:run --reporter=verbose` (Vitest unit tests, < 30s)
- **Per wave merge:** `pnpm test:run` + SQL smoke scripts
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `supabase/tests/cred01_signup_bonus.sql` — idempotency test for signup bonus (CRED-01)
- [ ] `supabase/tests/cred03_rls_block.sql` — RLS block for profiles.credits + credit_events insert (CRED-03)
- [ ] `supabase/tests/cred03_double_spend.sql` — concurrent spend_credit test (CRED-03)
- [ ] `supabase/tests/cred04_rls_isolation.sql` — cross-user isolation test (CRED-04)
- [ ] `src/components/layout/AppHeader.test.tsx` — credit badge rendering (CRED-02)
- [ ] `src/hooks/useCredits.test.ts` — selector behavior (CRED-02)
- [ ] `src/pages/CreditHistoryPage.test.tsx` — history rendering (CRED-04)

---

## Sources

### Primary (HIGH confidence)

- `supabase/migrations/20260507000001_initial_schema.sql` — exact `point_events` schema to mirror; `profiles` column pattern
- `supabase/migrations/20260507000002_rls_policies.sql` — exact `profiles_update_own` policy (the hole to fix); `point_events_no_client_insert` pattern to copy
- `supabase/migrations/20260507000003_triggers_points.sql` — exact `handle_new_user`, `update_profile_points`, trigger idioms to mirror
- `supabase/migrations/20260507000004_unlock_events.sql` — `record_level_transition` BEFORE/AFTER trigger pattern; Storage bucket DDL pattern
- `supabase/migrations/20260512000007_phase3_criador.sql` — Storage RLS `foldername` pattern for private bucket
- `src/stores/auth.store.ts` — confirmed `select('*')` on profiles; `refetchProfile` implementation
- `src/components/layout/AppHeader.tsx` — exact current structure; where credit badge fits
- `src/types/database.types.ts` — confirmed `profiles` Row type lacks `credits` column (needs `gen:types` after migration)
- `package.json` — `gen:types`, `test:run`, `test:coverage` commands; no pgTAP dependency
- `.planning/research/PITFALLS.md` — Pitfall 2 (client-mutated credits), Pitfall 6 (signup bonus idempotency), with verified SQL patterns
- `.planning/research/ARCHITECTURE.md` — full credits design including `spend_credit` / `refund_credit` signatures
- `.planning/phases/04-ledger-creditos-bonus/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Supabase PostgREST documentation — `SET LOCAL role = 'authenticated'` sets `current_user` for client requests; SECURITY DEFINER overrides to function owner
- PostgreSQL docs — `pg_advisory_xact_lock` auto-releases at transaction end; `hashtext()` returns integer safe for advisory lock key

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries confirmed in package.json; no new dependencies
- Architecture: HIGH — all patterns derived from reading actual migration files
- SQL idioms: HIGH — exact code copied from migrations 001–003 and adapted
- Guard trigger `current_user` check: MEDIUM — verified via Supabase PostgREST docs but should be smoke-tested in local dev
- Concurrency test approach: MEDIUM — psql two-session approach is standard but pgTAP would be more ergonomic; pgTAP not present in project

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable — PostgreSQL/Supabase SQL patterns don't change; frontend patterns are project-internal)
