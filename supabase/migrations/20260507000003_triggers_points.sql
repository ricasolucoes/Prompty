-- =============================================================================
-- Migration 003: Points Engine — Triggers & Functions
-- Phase 1 — Foundation
-- Server-authoritative points via SECURITY DEFINER triggers.
-- Frontend cannot write to point_events directly (RLS blocks it).
-- =============================================================================

-- Server-side level resolver (mirrors TS levelOf in src/lib/gamification.ts)
CREATE OR REPLACE FUNCTION level_from_points(p INTEGER)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p >= 5000 THEN RETURN 'L5';
  ELSIF p >= 1000 THEN RETURN 'L4';
  ELSIF p >=  250 THEN RETURN 'L3';
  ELSIF p >=   50 THEN RETURN 'L2';
  ELSE RETURN 'L1';
  END IF;
END;
$$;

-- Auto-create profile on signup
-- Fires on auth.users INSERT so every OAuth/email signup gets a profile row
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper to update points + level for a user from point_events sum
-- Called by every award_* trigger; recalculates from full event sum for consistency
CREATE OR REPLACE FUNCTION update_profile_points(target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0) INTO total FROM point_events WHERE user_id = target_user;
  UPDATE profiles SET points = total, level = level_from_points(total) WHERE id = target_user;
END;
$$;

-- Trigger 1: rate event on prompty_tests insert
-- Awards 5 points per unique (user, prompty) test submission
CREATE OR REPLACE FUNCTION award_points_on_test()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO point_events (user_id, event_type, points, ref_id)
  VALUES (NEW.user_id, 'rate', 5, NEW.prompty_id)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
  PERFORM update_profile_points(NEW.user_id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_points_on_test ON prompty_tests;
CREATE TRIGGER trg_points_on_test
  AFTER INSERT ON prompty_tests
  FOR EACH ROW EXECUTE FUNCTION award_points_on_test();

-- Trigger 2: like event with daily 10/day limit
-- Awards 1 point per unique like, capped at 10 likes/day to prevent gaming
CREATE OR REPLACE FUNCTION award_points_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today_likes INTEGER;
BEGIN
  SELECT COUNT(*) INTO today_likes
    FROM point_events
    WHERE user_id = NEW.user_id
      AND event_type = 'like'
      AND created_at::date = CURRENT_DATE;
  IF today_likes < 10 THEN
    INSERT INTO point_events (user_id, event_type, points, ref_id)
    VALUES (NEW.user_id, 'like', 1, NEW.prompty_id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_points(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_points_on_like ON prompty_likes;
CREATE TRIGGER trg_points_on_like
  AFTER INSERT ON prompty_likes
  FOR EACH ROW EXECUTE FUNCTION award_points_on_like();

-- Trigger 3: copy event — explicit RPC called from client (idempotent via ON CONFLICT)
-- Anon users can copy but receive no points (early return when auth.uid() is NULL)
CREATE OR REPLACE FUNCTION record_copy(p_prompty_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO point_events (user_id, event_type, points, ref_id)
  VALUES (auth.uid(), 'copy', 5, p_prompty_id)
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
  PERFORM update_profile_points(auth.uid());
END;
$$;
GRANT EXECUTE ON FUNCTION record_copy(UUID) TO authenticated;
-- Anon users can call the function — it early-returns without writing
GRANT EXECUTE ON FUNCTION record_copy(UUID) TO anon;
