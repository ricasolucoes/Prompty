-- CRED-03: as the authenticated role, direct mutation of profiles.credits is blocked
-- and inserting into credit_events is blocked by RLS.
-- Run: psql "$SUPABASE_DB_URL" -f supabase/tests/cred03_rls_block.sql
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO profiles (id, name) VALUES ('00000000-0000-0000-0000-0000000c0003', 'cred03-test')
  ON CONFLICT (id) DO NOTHING;
SELECT update_profile_credits('00000000-0000-0000-0000-0000000c0003');

-- Simulate an authenticated client session
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000c0003';

-- Expect: direct UPDATE of credits raises (guard trigger)
DO $$
BEGIN
  BEGIN
    UPDATE profiles SET credits = 999 WHERE id = '00000000-0000-0000-0000-0000000c0003';
    RAISE EXCEPTION 'CRED-03 FAIL: direct credits UPDATE was NOT blocked';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'CRED-03 FAIL%' THEN RAISE; END IF;
    RAISE NOTICE 'CRED-03 PASS: credits UPDATE blocked (%).', SQLERRM;
  END;
END $$;

-- Expect: direct INSERT into credit_events is blocked by RLS WITH CHECK(false)
DO $$
BEGIN
  BEGIN
    INSERT INTO credit_events (user_id, event_type, delta)
      VALUES ('00000000-0000-0000-0000-0000000c0003', 'admin_grant', 50);
    RAISE EXCEPTION 'CRED-03 FAIL: credit_events INSERT was NOT blocked';
  EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'CRED-03 FAIL%' THEN RAISE; END IF;
    RAISE NOTICE 'CRED-03 PASS: credit_events INSERT blocked (%).', SQLERRM;
  END;
END $$;
RESET role;
ROLLBACK;
