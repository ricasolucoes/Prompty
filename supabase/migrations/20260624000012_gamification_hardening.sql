-- =============================================================================
-- Migration 012: Gamification hardening — GAM-002, GAM-003, GAM-004
-- Follows the 2026-06-23 gamification review (.planning/reviews/gamification-review.md).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- GAM-002: approved-result credit requires a real uploaded image.
-- Previously approved=true (default) + self-insertable prompty_tests let a user
-- farm 10 text-only "results"/day for +10 credits with zero substance. Require a
-- non-empty image_url so the contribution is an actual generated image. Daily cap
-- of 10 stays. (Full moderation — approved=false by default — remains future LOOP-02.)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_credit_on_approved_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  DAILY_CAP CONSTANT INTEGER := 10;  -- daily approved-result credit cap per user
  today_count INTEGER;
BEGIN
  -- Require approval AND a real result image (anti-farm: no credit for empty rows).
  IF NEW.approved = true AND NEW.image_url IS NOT NULL AND length(trim(NEW.image_url)) > 0 THEN
    SELECT COUNT(*) INTO today_count
      FROM credit_events
      WHERE user_id = NEW.user_id
        AND event_type = 'approved_result'
        AND created_at::date = CURRENT_DATE;
    IF today_count < DAILY_CAP THEN
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.user_id, 'approved_result', 1, NEW.id)
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
      PERFORM update_profile_credits(NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- GAM-003: atomic per-user daily generation cap + spend.
-- The Edge Function previously COUNTed generations then spent in two steps — a
-- TOCTOU window let concurrent requests exceed the cap. This function does the cap
-- check AND the spend under one per-user advisory lock, so the reservation is atomic.
-- "Charges today" = spent_generation events today minus refund events today (a
-- refunded failure does not consume the daily cap).
-- Returns reason so the Edge Function can map to 402 (no_credits) vs 429 (daily_cap).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION spend_generation_credit(p_ref UUID, p_daily_cap INTEGER DEFAULT 5)
RETURNS TABLE(ok BOOLEAN, balance INTEGER, reason TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_credits INTEGER;
  v_today   INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'unauthorized'; RETURN;
  END IF;
  IF p_ref IS NULL THEN
    RETURN QUERY SELECT false, 0, 'bad_request'; RETURN;
  END IF;

  -- One lock covers BOTH the cap check and the spend → no TOCTOU.
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  SELECT COALESCE(COUNT(*) FILTER (WHERE event_type = 'spent_generation'), 0)
       - COALESCE(COUNT(*) FILTER (WHERE event_type = 'refund'), 0)
    INTO v_today
    FROM credit_events
    WHERE user_id = v_user_id
      AND created_at::date = CURRENT_DATE
      AND event_type IN ('spent_generation', 'refund');

  SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id FOR UPDATE;

  IF v_today >= p_daily_cap THEN
    RETURN QUERY SELECT false, COALESCE(v_credits, 0), 'daily_cap'; RETURN;
  END IF;

  IF v_credits IS NULL OR v_credits < 1 THEN
    RETURN QUERY SELECT false, COALESCE(v_credits, 0), 'no_credits'; RETURN;
  END IF;

  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (v_user_id, 'spent_generation', -1, p_ref)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

  PERFORM update_profile_credits(v_user_id);

  SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id;
  RETURN QUERY SELECT true, v_credits, 'ok';
END;
$$;
GRANT EXECUTE ON FUNCTION spend_generation_credit(UUID, INTEGER) TO authenticated;

-- -----------------------------------------------------------------------------
-- GAM-004: award +2 credits PER LEVEL crossed (not a flat +2 per transition).
-- record_level_transition emits ONE unlock_events row per level change, even on a
-- multi-level jump (L1→L3). The flat +2 under-credited multi-level jumps. Loop over
-- the levels between previous_level and new_level, awarding +2 each with a
-- deterministic per-level ref_id (level_up_credit_ref) — idempotent via the existing
-- UNIQUE (user_id, event_type, ref_id). Historical +1 rows from migration 009 keep
-- their ref so ON CONFLICT skips them (no double-award); new crossings get +2/level.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_credit_on_level_up()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  old_rank INTEGER := level_rank(COALESCE(NEW.previous_level, 'L1'));
  new_rank INTEGER := level_rank(COALESCE(NEW.new_level, 'L1'));
  r INTEGER;
  lvl TEXT;
BEGIN
  IF new_rank > old_rank THEN
    FOR r IN (old_rank + 1)..new_rank LOOP
      lvl := 'L' || r;
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.user_id, 'level_up', 2, level_up_credit_ref(lvl))
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    END LOOP;
    PERFORM update_profile_credits(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
-- Trigger trg_credit_on_level_up (on unlock_events AFTER INSERT) is unchanged; it
-- already points at award_credit_on_level_up(), which we just redefined above.

-- =============================================================================
-- VERIFY (after apply):
--   -- GAM-002: an approved test with NULL image_url adds no credit row.
--   -- GAM-003: SELECT * FROM spend_generation_credit(gen_random_uuid(), 5);
--   -- GAM-004: a L1→L3 unlock_events insert yields two 'level_up' rows (+2 each).
-- =============================================================================
