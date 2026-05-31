-- EARN-01: level-up awards +2 credits, once per unlock row (idempotent on ref_id).
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/earn01_level_up.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users; insert into auth.users first so handle_new_user fires
-- and auto-creates the profile + grants signup_bonus (+1 credit). ROLLBACK discards everything.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000e0001','00000000-0000-0000-0000-000000000000','earn01@test.local',crypt('x',gen_salt('bf')),'{"name":"earn01-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;
-- Reset signup_bonus credit so we start at a known balance of 0 before the earn test.
DELETE FROM credit_events WHERE user_id = '00000000-0000-0000-0000-0000000e0001';
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0001');

-- Simulate a level transition by inserting an unlock_events row directly (postgres/owner,
-- bypassing the no-client-insert RLS). The award_credit_on_level_up trigger should fire (+2).
WITH ins AS (
  INSERT INTO unlock_events (user_id, previous_level, new_level)
  VALUES ('00000000-0000-0000-0000-0000000e0001', 'L1', 'L2')
  RETURNING id
)
SELECT id AS unlock_id FROM ins \gset

DO $$
DECLARE bal INTEGER;
BEGIN
  SELECT credits INTO bal FROM profiles WHERE id = '00000000-0000-0000-0000-0000000e0001';
  IF bal <> 2 THEN RAISE EXCEPTION 'EARN-01 FAIL: expected 2 credits after level-up, got %', bal; END IF;
  RAISE NOTICE 'EARN-01 PASS (award): +2 on level-up, balance=2';
END $$;

-- Re-fire on the SAME unlock row: ON CONFLICT (user_id, event_type, ref_id) must block the duplicate.
INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES ('00000000-0000-0000-0000-0000000e0001', 'level_up', 2, :'unlock_id')
  ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0001');

DO $$
DECLARE bal INTEGER;
BEGIN
  SELECT credits INTO bal FROM profiles WHERE id = '00000000-0000-0000-0000-0000000e0001';
  IF bal <> 2 THEN RAISE EXCEPTION 'EARN-01 FAIL: duplicate event changed balance, got %', bal; END IF;
  RAISE NOTICE 'EARN-01 PASS (idempotent): duplicate did not double-award, balance=2';
END $$;
ROLLBACK;
