-- CRED-01: signup bonus is granted exactly once and is idempotent.
-- Run: psql "$SUPABASE_DB_URL" -f supabase/tests/cred01_signup_bonus.sql
\set ON_ERROR_STOP on
BEGIN;
-- Use a deterministic test user that already has a profile row (FK requires it).
-- Create a throwaway auth user via direct profiles insert is NOT possible (FK to auth.users
-- via handle_new_user). Instead exercise the bonus path directly: insert two signup_bonus rows
-- with ON CONFLICT DO NOTHING and assert only one survives.
INSERT INTO profiles (id, name) VALUES ('00000000-0000-0000-0000-0000000c0001', 'cred01-test')
  ON CONFLICT (id) DO NOTHING;

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
