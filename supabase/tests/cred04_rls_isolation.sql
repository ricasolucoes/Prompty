-- CRED-04: authenticated user A reading credit_events sees only their own rows.
-- Run: psql "$SUPABASE_DB_URL" -f supabase/tests/cred04_rls_isolation.sql
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO profiles (id, name) VALUES
  ('00000000-0000-0000-0000-0000000c04a1', 'cred04-A'),
  ('00000000-0000-0000-0000-0000000c04b2', 'cred04-B')
  ON CONFLICT (id) DO NOTHING;
SELECT update_profile_credits('00000000-0000-0000-0000-0000000c04a1');
SELECT update_profile_credits('00000000-0000-0000-0000-0000000c04b2');

SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000c04a1';
DO $$
DECLARE other_rows INTEGER;
BEGIN
  SELECT count(*) INTO other_rows FROM credit_events
    WHERE user_id = '00000000-0000-0000-0000-0000000c04b2';
  IF other_rows <> 0 THEN
    RAISE EXCEPTION 'CRED-04 FAIL: user A can see % rows belonging to user B', other_rows;
  END IF;
  RAISE NOTICE 'CRED-04 PASS: user A sees 0 rows of user B';
END $$;
RESET role;
ROLLBACK;
