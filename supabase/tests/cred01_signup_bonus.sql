-- CRED-01: signup bonus is granted exactly once and is idempotent.
-- Run: psql "$SUPABASE_DB_URL" -f supabase/tests/cred01_signup_bonus.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users, so seed an auth.users row first. Inserting it fires
-- handle_new_user, which auto-creates the profile AND grants the signup_bonus row — the
-- exact path under test. ROLLBACK at the end discards the throwaway user.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000c0001','00000000-0000-0000-0000-000000000000','cred01@test.local',crypt('x',gen_salt('bf')),'{"name":"cred01-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;

-- Idempotency: two extra signup_bonus inserts must collapse onto the single existing row.
INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES ('00000000-0000-0000-0000-0000000c0001', 'signup_bonus', 1, NULL)
  ON CONFLICT DO NOTHING;
INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES ('00000000-0000-0000-0000-0000000c0001', 'signup_bonus', 1, NULL)
  ON CONFLICT DO NOTHING;

SELECT update_profile_credits('00000000-0000-0000-0000-0000000c0001');

DO $$
DECLARE n INTEGER; bal INTEGER;
BEGIN
  SELECT count(*) INTO n FROM credit_events
    WHERE user_id = '00000000-0000-0000-0000-0000000c0001' AND event_type = 'signup_bonus';
  IF n <> 1 THEN RAISE EXCEPTION 'CRED-01 FAIL: expected 1 signup_bonus row, got %', n; END IF;
  SELECT credits INTO bal FROM profiles WHERE id = '00000000-0000-0000-0000-0000000c0001';
  IF bal <> 1 THEN RAISE EXCEPTION 'CRED-01 FAIL: expected balance 1, got %', bal; END IF;
  RAISE NOTICE 'CRED-01 PASS: exactly 1 signup_bonus, balance=1';
END $$;
ROLLBACK;
