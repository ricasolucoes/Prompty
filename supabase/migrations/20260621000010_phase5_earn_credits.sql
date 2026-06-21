-- =============================================================================
-- Migration 010: Phase 5 — Earn Credits by Contributing
-- Adds approved column, extends credit_events event_type CHECK, and creates
-- three SECURITY DEFINER earn triggers:
--   • award_credit_on_level_up   (unlock_events AFTER INSERT → +2)
--   • award_credit_on_publish    (promptys AFTER INSERT OR UPDATE → +1, cap 20)
--   • award_credit_on_approved_result (prompty_tests AFTER INSERT OR UPDATE → +1, daily cap 10)
-- Zero changes to the point_events chain.
-- =============================================================================

-- 1. Add approved column to prompty_tests
--    Default true = auto-approve all existing and new results.
--    LOOP-02 will set approved = false to revoke.
ALTER TABLE prompty_tests
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true;

-- 2. Extend credit_events event_type CHECK with three new earn types.
--    The existing constraint from migration 009 has only ('signup_bonus',
--    'earned_contribution','spent_generation','refund','admin_grant','level_up').
--    We drop and re-add to include publish_prompty and approved_result.
ALTER TABLE credit_events
  DROP CONSTRAINT IF EXISTS credit_events_event_type_check;
ALTER TABLE credit_events
  ADD CONSTRAINT credit_events_event_type_check
    CHECK (event_type IN (
      'signup_bonus','earned_contribution','spent_generation','refund','admin_grant',
      'level_up','publish_prompty','approved_result'));

-- 3. EARN-01: award_credit_on_level_up
--    Fires AFTER INSERT on unlock_events.
--    Awards +2 credits per level transition, idempotent per unlock_events row
--    via ON CONFLICT (user_id, event_type, ref_id) DO NOTHING.
--    Belt-and-suspenders: also guards against a duplicate unlock row for the
--    same new_level via a COUNT JOIN check.
CREATE OR REPLACE FUNCTION award_credit_on_level_up()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE already INTEGER;
BEGIN
  SELECT COUNT(*) INTO already
    FROM credit_events ce
    JOIN unlock_events ue ON ue.id = ce.ref_id
    WHERE ce.user_id = NEW.user_id
      AND ce.event_type = 'level_up'
      AND ue.new_level = NEW.new_level;
  IF already = 0 THEN
    INSERT INTO credit_events (user_id, event_type, delta, ref_id)
    VALUES (NEW.user_id, 'level_up', 2, NEW.id)
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

-- 4. EARN-02: award_credit_on_publish
--    Fires AFTER INSERT OR UPDATE on promptys (draft→published via UPDATE, too).
--    Awards +1 credit per distinct published prompty, lifetime cap 20 per user.
--    ON CONFLICT on ref_id=promptys.id prevents double-award on re-save.
CREATE OR REPLACE FUNCTION award_credit_on_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  PUBLISH_CAP CONSTANT INTEGER := 20;  -- lifetime publish-credit cap per user
  lifetime_count INTEGER;
BEGIN
  IF NEW.status = 'published' THEN
    SELECT COUNT(*) INTO lifetime_count
      FROM credit_events
      WHERE user_id = NEW.author_id
        AND event_type = 'publish_prompty';
    IF lifetime_count < PUBLISH_CAP THEN
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.author_id, 'publish_prompty', 1, NEW.id)
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
      PERFORM update_profile_credits(NEW.author_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_publish ON promptys;
CREATE TRIGGER trg_credit_on_publish
  AFTER INSERT OR UPDATE ON promptys
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_publish();

-- 5. EARN-03: award_credit_on_approved_result
--    Fires AFTER INSERT OR UPDATE on prompty_tests.
--    Awards +1 credit per approved result, daily cap 10 per user.
--    approved=false guard prevents credit when result is revoked.
CREATE OR REPLACE FUNCTION award_credit_on_approved_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  DAILY_CAP CONSTANT INTEGER := 10;  -- daily approved-result credit cap per user
  today_count INTEGER;
BEGIN
  IF NEW.approved = true THEN
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
DROP TRIGGER IF EXISTS trg_credit_on_approved_result ON prompty_tests;
CREATE TRIGGER trg_credit_on_approved_result
  AFTER INSERT OR UPDATE ON prompty_tests
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_approved_result();

-- =============================================================================
-- VERIFY constraint name:
-- SELECT conname FROM pg_constraint WHERE conrelid='credit_events'::regclass AND contype='c';
-- Expected: credit_events_event_type_check
-- =============================================================================
