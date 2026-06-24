-- =============================================================================
-- Migration 011: Harden refund_credit (GAM-001 critical) + least-privilege (GAM-005)
-- Security review finding: refund_credit was GRANTed to authenticated and inserted a
-- +1 'refund' event using a client-controlled p_ref WITHOUT verifying a matching spend.
-- An authenticated user could call refund_credit({p_ref: <random uuid>}) repeatedly to
-- mint unlimited credits. Fix: only refund when a real, not-yet-refunded spend exists.
-- =============================================================================

-- 1. refund_credit — refund ONLY a real, unrefunded spend for this user.
--    - Requires p_ref (no NULL refunds).
--    - Requires a matching 'spent_generation' event for (user_id, ref_id).
--    - ON CONFLICT (user_id,'refund',ref_id) guarantees at most ONE refund per spend.
--    The legitimate caller (Edge Function generate-image) refunds with the SAME
--    generation_id used for the spend, so this path is unaffected.
CREATE OR REPLACE FUNCTION refund_credit(p_ref UUID DEFAULT NULL)
RETURNS TABLE(ok BOOLEAN, balance INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id   UUID;
  v_credits   INTEGER;
  v_has_spend BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR p_ref IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Per-user advisory lock for symmetry with spend_credit
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- Only refund if THIS user actually spent a credit against p_ref.
  SELECT EXISTS (
    SELECT 1 FROM credit_events
    WHERE user_id = v_user_id
      AND event_type = 'spent_generation'
      AND ref_id = p_ref
  ) INTO v_has_spend;

  IF NOT v_has_spend THEN
    SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id;
    RETURN QUERY SELECT false, COALESCE(v_credits, 0);
    RETURN;
  END IF;

  -- Idempotent: ON CONFLICT (user_id, event_type, ref_id) → at most one refund per spend.
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (v_user_id, 'refund', 1, p_ref)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

  PERFORM update_profile_credits(v_user_id);

  SELECT credits INTO v_credits FROM profiles WHERE id = v_user_id;
  RETURN QUERY SELECT true, v_credits;
END;
$$;
GRANT EXECUTE ON FUNCTION refund_credit(UUID) TO authenticated;

-- 2. Least privilege (GAM-005): cache-recompute helpers must not be client-callable.
--    They only recompute the cached balance from the ledger (no new balance), but there
--    is no reason to expose them via PostgREST. Triggers/SECURITY DEFINER callers are
--    unaffected (they run as the function owner, not as anon/authenticated).
REVOKE EXECUTE ON FUNCTION update_profile_credits(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_profile_points(UUID)  FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- VERIFY (after apply):
--   -- as an authenticated user with no spend, this must return ok=false and add NO row:
--   SELECT * FROM refund_credit(gen_random_uuid());
--   SELECT count(*) FROM credit_events WHERE event_type='refund';  -- unchanged
-- =============================================================================
