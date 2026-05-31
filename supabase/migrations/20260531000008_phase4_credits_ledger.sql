-- =============================================================================
-- Migration 008: Phase 4 — Credits Ledger + Signup Bonus
-- Phase 4 — Ledger de Créditos + Bônus de Cadastro
-- Implements CRED-01, CRED-03, CRED-04:
--   • credit_events immutable append-only ledger (mirrors point_events)
--   • profiles.credits cached balance column
--   • RLS: select-own, no client insert (WITH CHECK false)
--   • BEFORE UPDATE guard trigger closing the profiles_update_own hole
--   • handle_new_user extended with idempotent signup_bonus (CRED-01)
--   • update_profile_credits / spend_credit / refund_credit SECURITY DEFINER functions
--   • generations table + prompty-generations private bucket (consumed by Phase 6)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles.credits column (idempotent add)
-- Mirrors: profiles.points column in migration 001 line 15
-- -----------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0);

-- -----------------------------------------------------------------------------
-- 2. credit_events table (append-only ledger — mirrors point_events in migration 001)
-- delta = signed amount (+1 earned, -1 spent); ref_id links to generation UUID.
-- UNIQUE (user_id, event_type, ref_id) covers non-null ref_id earn/spend events.
-- Partial unique index handles signup_bonus where ref_id IS NULL (standard UNIQUE
-- misses NULL semantics — see RESEARCH.md Pitfall 1).
-- -----------------------------------------------------------------------------
CREATE TABLE credit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
                'signup_bonus','earned_contribution','spent_generation','refund','admin_grant')),
  delta       INTEGER NOT NULL,
  ref_id      UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_type, ref_id)
);
CREATE INDEX idx_credit_events_user ON credit_events(user_id, created_at DESC);

-- Partial unique index: signup_bonus has ref_id NULL.
-- Standard UNIQUE does not cover NULLs in PostgreSQL, so two NULL ref_id rows
-- for the same user could slip through. This partial index prevents that.
CREATE UNIQUE INDEX credit_events_signup_once
  ON credit_events (user_id) WHERE event_type = 'signup_bonus';

-- -----------------------------------------------------------------------------
-- 3. RLS on credit_events (mirrors point_events RLS in migration 002 lines 56–58)
-- SELECT: own rows only.
-- INSERT: blocked for all client roles (WITH CHECK false) — only SECURITY DEFINER functions write.
-- No UPDATE or DELETE policies — table is append-only by design.
-- -----------------------------------------------------------------------------
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_events_select_own" ON credit_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "credit_events_no_client_insert" ON credit_events
  FOR INSERT TO anon, authenticated WITH CHECK (false);

-- -----------------------------------------------------------------------------
-- 4. update_profile_credits (mirrors update_profile_points in migration 003)
-- Recomputes SUM(delta) → profiles.credits via SECURITY DEFINER.
-- GREATEST(total, 0) soft-floors the cache; CHECK (credits >= 0) is the hard last resort.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_profile_credits(target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO total FROM credit_events WHERE user_id = target_user;
  UPDATE profiles SET credits = GREATEST(total, 0) WHERE id = target_user;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. guard_profiles_financial_columns — BEFORE UPDATE trigger
-- Closes the profiles_update_own policy hole: an authenticated client using
-- supabase.from('profiles').update({ credits: 999 }) would otherwise bypass the ledger.
--
-- IMPORTANT: profiles_update_own policy is NOT dropped/altered — bio/username/avatar
-- updates must still pass. The trigger is SURGICAL: it only raises when a financial
-- column changes AND current_user = 'authenticated'.
--
-- Why current_user (not session_user): PostgREST sets SET LOCAL role = 'authenticated'
-- which changes current_user for the transaction. SECURITY DEFINER functions run under
-- the function owner (postgres), so current_user inside them will NOT be 'authenticated'.
-- See RESEARCH.md Pitfall 3 for full explanation.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_profiles_financial_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.credits IS DISTINCT FROM OLD.credits THEN
      RAISE EXCEPTION 'Direct mutation of profiles.credits is not allowed. Use credit functions.';
    END IF;
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
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION guard_profiles_financial_columns();

-- -----------------------------------------------------------------------------
-- 6. handle_new_user — extended with idempotent signup bonus (CRED-01)
-- Copies exact existing body from migration 003 and appends credit bonus.
-- ON CONFLICT DO NOTHING on the credit_events insert is idempotent via the
-- partial unique index credit_events_signup_once (see Pitfall 1 in RESEARCH.md).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- EXISTING: create profile row on signup (unchanged from migration 003)
  INSERT INTO profiles (id, name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  -- NEW: signup bonus — exactly 1 credit, idempotent via partial unique index.
  -- ON CONFLICT DO NOTHING matches the partial index violation (NULL ref_id).
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (NEW.id, 'signup_bonus', 1, NULL)
  ON CONFLICT DO NOTHING;

  -- NEW: refresh cached credits balance on profiles row
  PERFORM update_profile_credits(NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------------------------
-- 7. spend_credit — atomic credit deduction (CRED-03: atomic double-spend protection)
-- Both pg_advisory_xact_lock AND SELECT FOR UPDATE are mandatory:
--   Advisory lock: serializes two sessions that both begin before either acquires the row lock.
--   FOR UPDATE: blocks any concurrent update_profile_credits call in parallel.
-- Returns TABLE(ok BOOLEAN, balance INTEGER) — exact contract for Phase 6.
-- auth.uid() is derived from JWT inside SECURITY DEFINER — never trust request body.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION spend_credit(p_ref UUID DEFAULT NULL)
RETURNS TABLE(ok BOOLEAN, balance INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_credits INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Per-user advisory lock (auto-releases at transaction end)
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- Row lock for consistent read within lock scope
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

-- -----------------------------------------------------------------------------
-- 8. refund_credit — compensating event (same return shape as spend_credit)
-- Inserts a refund event (delta = +1) and recomputes the cached balance.
-- Used by Phase 6 Edge Function when an AI provider call fails after deduction.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refund_credit(p_ref UUID DEFAULT NULL)
RETURNS TABLE(ok BOOLEAN, balance INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_credits INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Per-user advisory lock for symmetry with spend_credit
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (v_user_id, 'refund', 1, p_ref)
  ON CONFLICT DO NOTHING;

  PERFORM update_profile_credits(v_user_id);

  SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id;
  RETURN QUERY SELECT true, v_credits;
END;
$$;
GRANT EXECUTE ON FUNCTION refund_credit(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. generations table (build-order: created now; Phase 6 Edge Function writes to it)
-- credit_event_id FK links each generation to the spend event for audit.
-- RLS: select-own, no client insert (Edge Function uploads via service-role in Phase 6).
-- Mirrors: unlock_events pattern from migration 004.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 10. Private bucket: prompty-generations
-- public = false — accessed only via signed URLs (no direct public URL).
-- 5 MB limit (AI-generated images are larger than user uploads at 2 MB).
-- No client INSERT policy — Edge Function uploads via service-role key in Phase 6.
-- Owner-scoped read: folder[1] = user_id (same foldername pattern as prompty-covers).
-- Mirrors: prompty-results bucket from migration 004; private pattern from migration 007.
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('prompty-generations', 'prompty-generations', false, 5242880,
        ARRAY['image/webp','image/jpeg','image/png']::text[])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "prompty-generations read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prompty-generations'
         AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- VERIFY: SELECT current_user;
-- The guard trigger checks current_user = 'authenticated' (not session_user).
-- In Supabase PostgREST, client requests run with SET LOCAL role = 'authenticated'
-- which sets current_user. SECURITY DEFINER functions run as the function owner
-- (postgres), so current_user inside them will NOT be 'authenticated'.
-- Smoke-test locally after applying: run cred03_rls_block.sql to confirm.
-- See RESEARCH.md Open Question 2 for full context.
-- =============================================================================
