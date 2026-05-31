-- CRED-04: authenticated user A reading credit_events sees only their own rows.
-- Run: psql "$SUPABASE_DB_URL" -f supabase/tests/cred04_rls_isolation.sql
\set ON_ERROR_STOP on
BEGIN;
-- Seed both users via auth.users; handle_new_user gives each a signup_bonus row, so user B
-- genuinely has credit_events rows that RLS must hide from user A.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES
    ('00000000-0000-0000-0000-0000000c04a1','00000000-0000-0000-0000-000000000000','cred04a@test.local',crypt('x',gen_salt('bf')),'{"name":"cred04-A"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated'),
    ('00000000-0000-0000-0000-0000000c04b2','00000000-0000-0000-0000-000000000000','cred04b@test.local',crypt('x',gen_salt('bf')),'{"name":"cred04-B"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
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
