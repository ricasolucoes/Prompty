-- LEVELUP-CREDIT: each level reached awards exactly +1 AI credit, idempotently.
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/levelup_credit.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users; insert via auth.users so handle_new_user fires.
-- ROLLBACK discards everything at the end.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000e0009','00000000-0000-0000-0000-000000000000','levelup@test.local',crypt('x',gen_salt('bf')),'{"name":"levelup-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;
-- Reset signup_bonus so credit assertions start from a known balance of 0.
DELETE FROM credit_events WHERE user_id = '00000000-0000-0000-0000-0000000e0009';
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0009');

DO $$
DECLARE
  v_user UUID := '00000000-0000-0000-0000-0000000e0009';
  bal INTEGER;
  lvl TEXT;
BEGIN
  -- 1) Cross L1 -> L2 (50 points) => +1 credit
  INSERT INTO point_events (user_id, event_type, points, ref_id)
  VALUES (v_user, 'copy', 50, gen_random_uuid());
  PERFORM update_profile_points(v_user);

  SELECT level, credits INTO lvl, bal FROM profiles WHERE id = v_user;
  IF lvl <> 'L2' THEN RAISE EXCEPTION 'expected L2, got %', lvl; END IF;
  IF bal <> 1 THEN RAISE EXCEPTION 'expected 1 credit after L2, got %', bal; END IF;

  -- 2) Recompute without level change => no double award
  PERFORM update_profile_points(v_user);
  SELECT credits INTO bal FROM profiles WHERE id = v_user;
  IF bal <> 1 THEN RAISE EXCEPTION 'double award on recompute: %', bal; END IF;

  -- 3) Multi-level jump L2 -> L4 (1000 points) => +2 credits (L3 and L4)
  INSERT INTO point_events (user_id, event_type, points, ref_id)
  VALUES (v_user, 'copy', 950, gen_random_uuid());
  PERFORM update_profile_points(v_user);

  SELECT level, credits INTO lvl, bal FROM profiles WHERE id = v_user;
  IF lvl <> 'L4' THEN RAISE EXCEPTION 'expected L4, got %', lvl; END IF;
  IF bal <> 3 THEN RAISE EXCEPTION 'expected 3 credits after L4 jump, got %', bal; END IF;

  -- 4) Ledger has exactly one level_up event per level
  SELECT COUNT(*) INTO bal FROM credit_events
    WHERE user_id = v_user AND event_type = 'level_up';
  IF bal <> 3 THEN RAISE EXCEPTION 'expected 3 level_up events, got %', bal; END IF;

  RAISE NOTICE 'LEVELUP-CREDIT OK: L2 +1, idempotent recompute, L4 jump +2';
END $$;
ROLLBACK;
