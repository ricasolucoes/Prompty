# Architecture Research

**Domain:** Credits ledger + Edge Function image generation integrated into Supabase-only app
**Researched:** 2026-05-31
**Confidence:** HIGH (all findings derived from codebase inspection of existing migrations, stores, and hooks)

---

## System Overview

The new subsystem mirrors the existing `point_events` pattern exactly. The ledger (`credit_events`) is append-only and written exclusively by SECURITY DEFINER functions/triggers — never by the client. The Edge Function is the only actor that can perform a debit, because only it holds the provider API key secret.

```
┌──────────────────────────────────────────────────────────────┐
│                    Client (Tauri + React)                      │
│                                                               │
│  useCredits          useGenerate           useAuthStore        │
│  (reads profile.     (invokes Edge         (refetchProfile     │
│   credits via        Function via          after spend)        │
│   refetchProfile)    supabase.functions                        │
│                      .invoke)                                  │
└────────────┬────────────────┬──────────────────┬─────────────┘
             │ SELECT         │ POST /generate   │ SELECT
             ▼                ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│                     Supabase Platform                         │
│                                                               │
│  ┌─────────────────┐   ┌──────────────────────────────────┐  │
│  │  PostgREST/RPC   │   │  Edge Function: generate-image   │  │
│  │                  │   │                                  │  │
│  │  spend_credit()  │   │  1. Verify JWT                   │  │
│  │  (SECURITY       │   │  2. Call spend_credit() RPC      │  │
│  │   DEFINER +      │   │  3. Call provider adapter        │  │
│  │   advisory lock) │   │  4. Upload to Storage bucket     │  │
│  │                  │   │  5. Insert generations row       │  │
│  │  Signup bonus    │   │  6. Refund on failure            │  │
│  │  (handle_new_    │   │  7. Return signed URL            │  │
│  │   user trigger)  │   └──────────────────────────────────┘  │
│  │                  │                                         │
│  │  Earn triggers   │   ┌──────────────────────────────────┐  │
│  │  (level-up,      │   │  Storage: prompty-generations    │  │
│  │   publish,       │   │  (private, signed URLs only)     │  │
│  │   test submit)   │   └──────────────────────────────────┘  │
│  └─────────────────┘                                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL                             │  │
│  │                                                           │  │
│  │  profiles  ◄── credits (cached)                          │  │
│  │  credit_events (append-only)                             │  │
│  │  generations  (FK: user_id + prompty_id + credit_event)  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## (a) credit_events Table + RLS + Cached Credits Recompute

### Schema

`credit_events` mirrors `point_events` column-for-column. The only difference is `delta` (signed integer) instead of `points` (positive only), because credits have both earnings (+) and spends (-).

```sql
-- Migration 008: Credits Ledger
CREATE TABLE credit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
                'signup_bonus',   -- +1 at registration
                'level_up',       -- +1 per level transition (capped)
                'publish',        -- +1 per published prompty (capped)
                'test_submit',    -- +1 per approved test submission (capped)
                'spend',          -- -1 per generation
                'refund'          -- +1 compensating event on provider failure
              )),
  delta       INTEGER NOT NULL,  -- positive = earn, negative = spend
  ref_id      UUID,              -- prompty_id, generation_id, or level transition id
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency: same user cannot earn same event_type for the same ref_id twice.
  -- spend/refund do NOT have this constraint (same prompty can be generated multiple times).
  CONSTRAINT credit_events_unique_earn
    UNIQUE NULLS NOT DISTINCT (user_id, event_type, ref_id)
    -- Apply only to earning event_types; spend and refund have ref_id = generation_id
    -- which is UUID-per-request, so uniqueness is naturally enforced without special logic.
);
CREATE INDEX idx_credit_events_user ON credit_events(user_id, created_at DESC);
```

**Design note on UNIQUE constraint:** The existing `point_events` uses `UNIQUE (user_id, event_type, ref_id)`. This works for earnings where `ref_id` is the resource being acted upon. For `spend` and `refund`, `ref_id` will be the `generation_id` (a UUID minted per request), so uniqueness is naturally enforced. The single `UNIQUE NULLS NOT DISTINCT` constraint covers all cases without a partial index.

### Profiles: add `credits` column

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;
```

### RLS Policies (identical pattern to point_events)

```sql
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own events only
CREATE POLICY "credit_events_select_own"
  ON credit_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Client INSERT is blocked — all writes via SECURITY DEFINER functions
CREATE POLICY "credit_events_no_client_insert"
  ON credit_events FOR INSERT TO anon, authenticated
  WITH CHECK (false);
-- No UPDATE or DELETE policies — table is append-only.
```

### update_profile_credits helper (mirrors update_profile_points)

```sql
CREATE OR REPLACE FUNCTION update_profile_credits(target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO total
    FROM credit_events WHERE user_id = target_user;
  -- Floor at 0; a bug should not produce a negative balance
  UPDATE profiles SET credits = GREATEST(total, 0) WHERE id = target_user;
END;
$$;
```

The SUM across signed deltas gives the current balance. `GREATEST(..., 0)` guards against any race that somehow produces a momentary negative.

---

## (b) Signup Bonus: +1 Credit Idempotently in handle_new_user

The profile row must exist before the credit_event FK can be satisfied. `handle_new_user` already inserts the profile. The bonus credit insert must come **after** that INSERT, within the same function body.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Step 1: create profile row (existing logic, unchanged)
  INSERT INTO profiles (id, name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  -- Step 2: grant signup bonus credit — idempotent via ON CONFLICT DO NOTHING.
  -- ref_id = NULL for signup_bonus (no resource reference).
  -- ON CONFLICT covers the UNIQUE (user_id, event_type, ref_id) constraint,
  -- so a duplicate trigger fire (e.g. OAuth re-link) is silently ignored.
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (NEW.id, 'signup_bonus', 1, NULL)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

  -- Step 3: refresh cached balance
  PERFORM update_profile_credits(NEW.id);

  RETURN NEW;
END;
$$;
```

**FK ordering guarantee:** The profile INSERT on conflict does nothing if the row already exists; the credit INSERT always fires after. Since both happen inside the same PL/pgSQL body, there is no window between them — the FK is satisfied before the credit row is attempted.

**Idempotency guarantee:** `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` where `ref_id IS NULL`. PostgreSQL's `NULLS NOT DISTINCT` in the constraint definition makes two NULL ref_ids collide (standard NULL != NULL semantics would allow duplicates). This requires the constraint to be declared with `NULLS NOT DISTINCT` as shown in the schema above.

---

## (c) Earn-by-Contributing Triggers

### Design decision: sibling triggers, not a unified trigger

The existing codebase uses one trigger function per source table (`award_points_on_test`, `award_points_on_like`, `award_points_on_publish`). Follow the same pattern for credits. A single unified trigger that fires on multiple tables would require dynamic table detection and is harder to reason about and test independently. Sibling triggers are the established convention.

### Three earn triggers

**Trigger 1: Level-up credit (fires on unlock_events INSERT)**

The `record_level_transition` trigger already writes to `unlock_events` when `profiles.level` changes. A credit trigger on `unlock_events` INSERT avoids modifying the existing `update_profile_points` chain.

```sql
CREATE OR REPLACE FUNCTION award_credit_on_level_up()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_level_credits INTEGER;
BEGIN
  -- Cap: maximum 5 level-up credits lifetime per user
  SELECT COUNT(*) INTO total_level_credits
    FROM credit_events
    WHERE user_id = NEW.user_id AND event_type = 'level_up';

  IF total_level_credits < 5 THEN
    INSERT INTO credit_events (user_id, event_type, delta, ref_id)
    VALUES (NEW.user_id, 'level_up', 1, NEW.id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_credits(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_level_up ON unlock_events;
CREATE TRIGGER trg_credit_on_level_up
  AFTER INSERT ON unlock_events
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_level_up();
```

**Trigger 2: Publish credit (fires on promptys INSERT where status='published')**

Piggybacks the existing `trg_points_on_publish` source event. Separate trigger function on the same table.

```sql
CREATE OR REPLACE FUNCTION award_credit_on_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_publish_credits INTEGER;
BEGIN
  IF NEW.status = 'published' THEN
    -- Cap: 20 publish credits lifetime per user (anti-spam)
    SELECT COUNT(*) INTO total_publish_credits
      FROM credit_events
      WHERE user_id = NEW.author_id AND event_type = 'publish';

    IF total_publish_credits < 20 THEN
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.author_id, 'publish', 1, NEW.id)
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
      PERFORM update_profile_credits(NEW.author_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_publish ON promptys;
CREATE TRIGGER trg_credit_on_publish
  AFTER INSERT ON promptys
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_publish();
```

**Trigger 3: Test submission credit (fires on prompty_tests INSERT)**

Piggybacks the existing `trg_points_on_test` source event.

```sql
CREATE OR REPLACE FUNCTION award_credit_on_test()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_test_credits INTEGER;
BEGIN
  -- Cap: 10 test submission credits lifetime per user
  SELECT COUNT(*) INTO total_test_credits
    FROM credit_events
    WHERE user_id = NEW.user_id AND event_type = 'test_submit';

  IF total_test_credits < 10 THEN
    INSERT INTO credit_events (user_id, event_type, delta, ref_id)
    VALUES (NEW.user_id, 'test_submit', 1, NEW.id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_credits(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_test ON prompty_tests;
CREATE TRIGGER trg_credit_on_test
  AFTER INSERT ON prompty_tests
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_test();
```

### Idempotency and cap summary

| Event | `ref_id` | Unique constraint | Cap |
|-------|----------|-------------------|-----|
| `signup_bonus` | NULL | `(user_id, event_type, NULL)` via NULLS NOT DISTINCT | 1 (by uniqueness) |
| `level_up` | `unlock_events.id` | `(user_id, event_type, unlock_id)` | 5 lifetime (COUNT check) |
| `publish` | `promptys.id` | `(user_id, event_type, prompty_id)` | 20 lifetime (COUNT check) |
| `test_submit` | `prompty_tests.id` | `(user_id, event_type, test_id)` | 10 lifetime (COUNT check) |
| `spend` | `generations.id` | natural (UUID per request) | n/a |
| `refund` | `generations.id` | natural (UUID per request) | n/a |

The COUNT-based caps use a plain `SELECT COUNT(*)` inside the trigger. This is safe because the trigger runs inside the transaction that also writes the credit event — the COUNT is consistent within that transaction. A concurrent trigger for the same user on the same event_type would also COUNT and both could pass the cap check under high concurrency, but contributing events (publish, level-up, test) are rare enough per user that this is acceptable without an advisory lock. Only the `spend_credit()` RPC uses an advisory lock because double-spend is a financial correctness issue.

---

## (d) Atomic Credit Spend: spend_credit() RPC

This RPC is called by the Edge Function (not the client directly). It must be race-safe: two concurrent generation requests for the same user must not both succeed when only 1 credit remains.

```sql
CREATE OR REPLACE FUNCTION spend_credit(
  p_user_id      UUID,
  p_generation_id UUID  -- pre-minted UUID from the Edge Function
)
RETURNS BOOLEAN   -- true = debit succeeded, false = insufficient balance
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Per-user advisory lock: blocks concurrent calls for the same user_id.
  -- pg_advisory_xact_lock releases automatically at transaction end.
  -- The lock key is derived from a hash of the user_id UUID to fit INTEGER space.
  PERFORM pg_advisory_xact_lock(
    ('x' || substr(p_user_id::text, 1, 16))::bit(64)::bigint
  );

  -- Read balance inside the lock (consistent read)
  SELECT credits INTO current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF current_balance IS NULL OR current_balance < 1 THEN
    RETURN FALSE;
  END IF;

  -- Append the spend event
  INSERT INTO credit_events (id, user_id, event_type, delta, ref_id)
  VALUES (p_generation_id, p_user_id, 'spend', -1, p_generation_id)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

  -- Recompute cached balance (identical pattern to update_profile_points)
  PERFORM update_profile_credits(p_user_id);

  RETURN TRUE;
END;
$$;
-- Edge Function invokes this via the service-role key; no anon/authenticated grant needed.
-- If called via RPC from authenticated client (future), grant separately.
```

**Why `FOR UPDATE` on the profiles SELECT:** The `pg_advisory_xact_lock` serializes concurrent spend_credit calls for the same user. The `FOR UPDATE` on the profiles row adds an additional row-level lock that prevents the balance from being changed by a concurrent `update_profile_credits` call (e.g., an earn trigger firing simultaneously) between the balance check and the INSERT. Belt-and-suspenders.

**Refund as a compensating event:** The Edge Function inserts a `refund` event if the provider call fails. This is not done inside `spend_credit()` — the RPC only handles the debit. The Edge Function controls refund because it is the only actor that knows whether the provider failed.

```sql
CREATE OR REPLACE FUNCTION refund_credit(
  p_user_id       UUID,
  p_generation_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Compensating event: delta = +1, ref_id = same generation_id as the spend.
  -- ON CONFLICT: if a refund was already issued for this generation_id, do nothing.
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (p_user_id, 'refund', 1, p_generation_id)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
  PERFORM update_profile_credits(p_user_id);
END;
$$;
```

Both `spend_credit` and `refund_credit` are called via the service-role key from the Edge Function, not via the anon-key client.

---

## (e) Edge Function Flow: generate-image

**File:** `supabase/functions/generate-image/index.ts`

The function is the only component that holds the provider API key (stored as a Supabase secret via `supabase secrets set PROVIDER_API_KEY=...`). It validates the JWT, debits credit atomically, calls the provider adapter, stores the result in a private Storage bucket, records the generation, and returns a signed URL. On any failure after the debit, it issues a refund.

```
POST /functions/v1/generate-image
Authorization: Bearer <user JWT>
Body: { prompty_id: UUID, rendered_prompt: string }

Step 1: Validate JWT
  supabase.auth.getUser(token)
  → 401 if invalid

Step 2: Mint generation_id
  generation_id = crypto.randomUUID()

Step 3: Atomic spend
  supabase.rpc('spend_credit', { p_user_id, p_generation_id })
  → 402 "insufficient_credits" if returns false

Step 4: Call provider adapter
  const imageBytes = await providerAdapter.generate(rendered_prompt)
  → on failure: call refund_credit(), return 502 "provider_error"

Step 5: Upload to private Storage bucket
  bucket: 'prompty-generations'
  path: `{user_id}/{generation_id}.webp`
  → on failure: call refund_credit(), return 500 "storage_error"

Step 6: Insert generations row
  INSERT INTO generations (id, user_id, prompty_id, storage_path, credit_event_id)
  → on failure: call refund_credit() — image is orphaned in storage but user is not charged
    (Storage cleanup can be a background job; correctness > cleanup)

Step 7: Generate signed URL (1 hour TTL)
  supabase.storage.from('prompty-generations').createSignedUrl(path, 3600)

Step 8: Return { generation_id, signed_url }
```

### Provider adapter interface

```typescript
// supabase/functions/generate-image/adapters/types.ts
interface ProviderAdapter {
  generate(prompt: string): Promise<Uint8Array>  // returns raw image bytes
}

// supabase/functions/generate-image/adapters/gemini.ts  (or openai.ts, replicate.ts)
// Selected at runtime by PROVIDER env var: Deno.env.get('IMAGE_PROVIDER') ?? 'gemini'
```

Swapping providers = add a new adapter file + update the `IMAGE_PROVIDER` secret. No migration required.

### generations table

```sql
CREATE TABLE generations (
  id              UUID PRIMARY KEY,              -- same UUID as generation_id / credit_event.id
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompty_id      UUID REFERENCES promptys(id) ON DELETE SET NULL,
  storage_path    TEXT NOT NULL,
  credit_event_id UUID REFERENCES credit_events(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_generations_user ON generations(user_id, created_at DESC);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
-- Users can only see their own generations
CREATE POLICY "generations_select_own" ON generations FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- Client INSERT blocked — Edge Function inserts via service-role key
CREATE POLICY "generations_no_client_insert" ON generations FOR INSERT TO anon, authenticated
  WITH CHECK (false);
```

### prompty-generations Storage bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompty-generations',
  'prompty-generations',
  false,             -- PRIVATE: access only via signed URLs
  5242880,           -- 5 MB (AI-generated images can be larger than user uploads)
  ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No public read policy — access via signed URLs only.
-- Edge Function uploads via service-role key (bypasses RLS).
-- Users can generate signed URLs for their own files via RPC or client SDK with auth.
CREATE POLICY "prompty-generations read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'prompty-generations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## (f) Frontend Data Flow

### useCredits hook (new, trivial)

Credits are already on the `profiles` row, which `useAuthStore` fetches. No separate hook needed — `useCredits` is a selector over the existing store.

```typescript
// src/hooks/useCredits.ts  (NEW — 5 lines)
import { useAuthStore } from '@/stores/auth.store'

export function useCredits() {
  const credits = useAuthStore((s) => s.profile?.credits ?? 0)
  return { credits }
}
```

After a generation completes (success or refund), the Edge Function has mutated `profiles.credits`. The caller invokes `useAuthStore.getState().refetchProfile()` — the same pattern as `useCopy.ts` line 61. No new refetch mechanism is needed.

### useGenerate hook (new)

```typescript
// src/hooks/useGenerate.ts  (NEW)
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

type GenerateState = 'idle' | 'spending' | 'generating' | 'uploading' | 'done' | 'error'

export function useGenerate() {
  const [state, setState] = useState<GenerateState>('idle')
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(promptyId: string, renderedPrompt: string) {
    setState('spending')
    setError(null)
    setSignedUrl(null)

    const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
      body: { prompty_id: promptyId, rendered_prompt: renderedPrompt },
    })

    // Always refetch credits — whether spend succeeded, failed, or was refunded,
    // the server is the source of truth.
    void useAuthStore.getState().refetchProfile()

    if (fnError || !data?.signed_url) {
      const msg = data?.error ?? fnError?.message ?? 'Erro ao gerar imagem'
      setError(msg)
      setState('error')
      return
    }

    setSignedUrl(data.signed_url)
    setState('done')
  }

  return { generate, state, signedUrl, error, reset: () => setState('idle') }
}
```

### Generate button placement and states

The generate button lives on **PromptyDetailPage** — the same surface where the copy button exists. It is shown only for authenticated users. For anonymous users, render a CTA "Cadastre-se e ganhe 1 crédito" in its place.

```
PromptyDetailPage (MODIFIED)
  ├── CopyButton (existing)
  ├── [if authenticated]
  │     GenerateButton  (NEW inline component)
  │       states: idle → spending → done/error
  │       shows: credits balance, loading spinner, generated image preview
  └── [if anonymous]
        SignupCTA  (NEW inline component)
          text: "Cadastre-se e ganhe 1 crédito para gerar aqui"
```

The generate button shows `credits` from `useCredits()`. If `credits === 0`, the button is disabled with tooltip "Sem créditos — contribua para ganhar mais."

---

## Integration Points

### New vs Modified Components

| Component | Status | Change |
|-----------|--------|--------|
| `supabase/migrations/008_credits_ledger.sql` | NEW | `credit_events` table, `profiles.credits` column, RLS, `update_profile_credits`, `spend_credit`, `refund_credit` |
| `supabase/migrations/008_credits_ledger.sql` | NEW | `generations` table, `prompty-generations` storage bucket |
| `supabase/migrations/008_credits_ledger.sql` | NEW | Earn triggers on `unlock_events`, `promptys`, `prompty_tests` |
| `supabase/migrations/008_credits_ledger.sql` | MODIFIED | `handle_new_user` — add credit insert + `update_profile_credits` call |
| `supabase/functions/generate-image/index.ts` | NEW | Edge Function orchestrator |
| `supabase/functions/generate-image/adapters/` | NEW | Provider adapter(s) |
| `src/types/database.types.ts` | MODIFIED | Add `credit_events`, `generations` tables, `profiles.credits` column |
| `src/hooks/useCredits.ts` | NEW | Selector over `useAuthStore` |
| `src/hooks/useGenerate.ts` | NEW | Edge Function invocation + state machine |
| `src/pages/PromptyDetailPage.tsx` | MODIFIED | Add `GenerateButton` (auth) or `SignupCTA` (anon) |
| `src/stores/auth.store.ts` | UNCHANGED | `refetchProfile` already handles new `credits` column automatically |
| `src/hooks/useCopy.ts` | UNCHANGED | Pattern is reference for `useGenerate` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend → Credit balance | `profiles.credits` via `refetchProfile()` | No new query — piggybacked on existing profile fetch |
| Frontend → Generation | `supabase.functions.invoke('generate-image')` | Single HTTP call; all state in Edge Function |
| Edge Function → DB | Service-role key via `supabase.rpc('spend_credit')` and `supabase.rpc('refund_credit')` | Never anon key inside Edge Function |
| Edge Function → Storage | Service-role key upload to `prompty-generations` bucket | Client gets signed URL, never direct bucket access |
| Trigger chain → Credits | SECURITY DEFINER triggers write `credit_events`, call `update_profile_credits` | Same pattern as point_events; no client involvement |

---

## Build Order

Provider-independence split: Phases 4–5 are pure DB + minimal frontend. Phase 6 adds the Edge Function and requires provider selection.

### Phase 4 — Credits Ledger + Signup Bonus (provider-independent)

1. Migration: `credit_events` table + RLS + `update_profile_credits` + `spend_credit` + `refund_credit`
2. Migration: `profiles.credits` column
3. Migration: `generations` table + RLS + `prompty-generations` storage bucket
4. Modify `handle_new_user` (same migration or separate) to insert signup bonus
5. Run `supabase gen types typescript` → update `database.types.ts`
6. Add `useCredits` hook
7. Show credits balance in ProfilePage header (read-only display)
8. Write tests: `spend_credit` idempotency, signup bonus idempotency, balance floor at 0

### Phase 5 — Earn-by-Contributing (provider-independent)

1. Migration: `award_credit_on_level_up` trigger on `unlock_events`
2. Migration: `award_credit_on_publish` trigger on `promptys`
3. Migration: `award_credit_on_test` trigger on `prompty_tests`
4. Write tests: cap enforcement, ON CONFLICT idempotency for each earn type
5. Smoke-test: create a level-up scenario in dev, verify credit_events + profiles.credits

### Phase 6 — Image Generation (provider-dependent)

1. Choose provider, obtain API key, run `supabase secrets set IMAGE_PROVIDER_KEY=...`
2. Implement `supabase/functions/generate-image/adapters/<provider>.ts`
3. Implement `supabase/functions/generate-image/index.ts` orchestrator (JWT → spend → generate → store → generations row → signed URL → refund on failure)
4. Add `useGenerate` hook
5. Modify `PromptyDetailPage`: add `GenerateButton` (auth) and `SignupCTA` (anon)
6. E2E test: full flow with real provider in staging

---

## Architectural Patterns

### Pattern: Append-only ledger with cached aggregate

**What:** Never UPDATE a balance directly. Append signed-delta events; a helper function recomputes the SUM and writes it to the cache column. The cache is the read surface; the ledger is the truth surface.

**When to use:** Any numeric aggregate that must be auditable, where the history matters (credits, points, streaks). Not needed for simple flags or timestamps.

**Trade-offs:** Slightly more DB I/O per event (one INSERT + one UPDATE vs one UPDATE). Pays back in full audit history, easy balance reconciliation, and bug recovery (recompute from events anytime).

### Pattern: SECURITY DEFINER as trust boundary

**What:** All writes to append-only tables happen inside `SECURITY DEFINER` functions/triggers. RLS blocks all direct INSERT from the client. The function is the only path.

**When to use:** Any table where the server must enforce invariants the client cannot be trusted to uphold (ledgers, event logs, moderation state).

**Trade-offs:** Functions are harder to inspect than table policies. Mitigated by keeping functions small and single-purpose (each trigger does one thing).

### Pattern: Edge Function as secret holder + atomic orchestrator

**What:** The provider API key lives only in Supabase secrets, accessible only to the Edge Function. The Edge Function is the orchestrator: it holds the secret, calls the RPC to debit, calls the provider, and calls the RPC to refund on failure. The client never sees the API key or calls the provider directly.

**When to use:** Any operation that requires a secret (external API key) AND must update app state atomically. In this app, this is the only use case — all other operations are direct client → Supabase.

---

## Anti-Patterns

### Anti-Pattern 1: Client-side balance check before spend

**What people do:** Read `profiles.credits` in the frontend, check `> 0`, then call the generate function.

**Why it's wrong:** The balance can change between the read and the call (another tab, a concurrent session). The server check inside `spend_credit()` is the authoritative gate. The client check is UX only (disable the button when credits = 0).

**Do this instead:** Always let `spend_credit()` return false and surface that as "insufficient credits" error. The client-side check only prevents obviously-futile calls; it does not replace server-side enforcement.

### Anti-Pattern 2: Refund inside spend_credit()

**What people do:** Wrap the entire generate flow (spend + provider call) inside a Postgres transaction, rolling back if the provider fails.

**Why it's wrong:** External HTTP calls cannot participate in a Postgres transaction. The provider call happens in the Edge Function (Deno), outside the DB transaction. Attempting to span the transaction across the provider call would hold a DB lock for the duration of the HTTP call (potentially seconds), which is a deadlock risk and a performance disaster.

**Do this instead:** Two-step: `spend_credit()` commits immediately. The Edge Function calls the provider. If the provider fails, the Edge Function calls `refund_credit()`. The refund is a compensating event, not a rollback. The ledger now has both the spend and the refund, which is the correct audit trail.

### Anti-Pattern 3: Storing the provider API key in the client or the anon-accessible vault

**What people do:** Put the API key in a Supabase vault row with an anon-accessible RLS policy, or include it in the Vite build.

**Why it's wrong:** Any user can extract it from the app bundle or via an authenticated query. The key will be compromised.

**Do this instead:** `supabase secrets set` stores the key in the Edge Function's Deno environment. Only server-side functions can access it.

---

## Sources

- `supabase/migrations/20260507000001_initial_schema.sql` — `point_events` schema (source of mirror pattern)
- `supabase/migrations/20260507000002_rls_policies.sql` — RLS patterns (source of `WITH CHECK (false)` pattern)
- `supabase/migrations/20260507000003_triggers_points.sql` — `handle_new_user`, `update_profile_points`, trigger convention
- `supabase/migrations/20260507000004_unlock_events.sql` — `unlock_events` table (source of level-up trigger hook)
- `supabase/migrations/20260512000007_phase3_criador.sql` — publish trigger (source of earn trigger on `promptys`)
- `src/stores/auth.store.ts` — `refetchProfile` pattern used by `useGenerate`
- `src/hooks/useCopy.ts` — fire-and-forget `refetchProfile` pattern after RPC call

---

*Architecture research for: Promptys v0.3.0 — Credits ledger + Edge Function image generation*
*Researched: 2026-05-31*
