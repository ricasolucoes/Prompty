-- EARN-02: publish awards +1; repeat UPDATE no double-award; lifetime cap 20.
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/earn02_publish.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users; insert via auth.users so handle_new_user fires.
-- ROLLBACK discards everything at the end.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000e0002','00000000-0000-0000-0000-000000000000','earn02@test.local',crypt('x',gen_salt('bf')),'{"name":"earn02-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;
-- Reset signup_bonus credit so we start at a known balance of 0 before the earn test.
DELETE FROM credit_events WHERE user_id = '00000000-0000-0000-0000-0000000e0002';
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0002');

DO $$
DECLARE
  v_author UUID := '00000000-0000-0000-0000-0000000e0002';
  v_prompty UUID;
  bal INTEGER;
  i INTEGER;
BEGIN
  -- (a) First publish → +1 credit.
  INSERT INTO promptys (author_id, title, template, slug, status)
    VALUES (v_author, 't1', 'b1', 'earn02-slug-1', 'published')
    RETURNING id INTO v_prompty;
  SELECT credits INTO bal FROM profiles WHERE id = v_author;
  IF bal <> 1 THEN RAISE EXCEPTION 'EARN-02 FAIL: expected 1 credit after publish, got %', bal; END IF;

  -- (b) UPDATE the same published prompty → ON CONFLICT blocks, balance stays 1.
  UPDATE promptys SET title = 't1-edited' WHERE id = v_prompty;
  SELECT credits INTO bal FROM profiles WHERE id = v_author;
  IF bal <> 1 THEN RAISE EXCEPTION 'EARN-02 FAIL: re-publish UPDATE double-awarded, got %', bal; END IF;
  RAISE NOTICE 'EARN-02 PASS (award+idempotent): +1, no double-award on UPDATE';

  -- (c) Publish 19 more (total 20) then a 21st; lifetime cap = 20 → 21st gives no credit.
  FOR i IN 2..21 LOOP
    INSERT INTO promptys (author_id, title, template, slug, status)
      VALUES (v_author, 't'||i, 'b'||i, 'earn02-slug-'||i, 'published');
  END LOOP;
  SELECT credits INTO bal FROM profiles WHERE id = v_author;
  IF bal <> 20 THEN RAISE EXCEPTION 'EARN-02 FAIL: lifetime cap 20 breached, got %', bal; END IF;
  RAISE NOTICE 'EARN-02 PASS (cap): 21 publishes but balance capped at 20';
END $$;
ROLLBACK;
