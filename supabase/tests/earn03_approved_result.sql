-- EARN-03: approved result awards +1; daily cap 10; approved=false → no credit.
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/earn03_approved_result.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users; insert via auth.users so handle_new_user fires.
-- ROLLBACK discards everything at the end.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000e0003','00000000-0000-0000-0000-000000000000','earn03@test.local',crypt('x',gen_salt('bf')),'{"name":"earn03-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;
-- Reset signup_bonus credit so we start at a known balance of 0 before the earn test.
DELETE FROM credit_events WHERE user_id = '00000000-0000-0000-0000-0000000e0003';
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0003');

DO $$
DECLARE
  v_user UUID := '00000000-0000-0000-0000-0000000e0003';
  v_prompty UUID;
  i INTEGER;
BEGIN
  -- Need a real promptys row for the prompty_tests FK.
  -- Publishing the host prompty fires award_credit_on_publish (+1); that credit is separate
  -- from approved_result credits, so it does not interfere with the daily-cap assertion below
  -- (we count only approved_result rows, not total balance).
  INSERT INTO promptys (author_id, title, template, slug, status)
    VALUES (v_user, 'host', 'host-template', 'earn03-host', 'published')
    RETURNING id INTO v_prompty;

  -- (a) + (b): insert 11 approved results; daily cap = 10 → only 10 earn credit today.
  FOR i IN 1..11 LOOP
    INSERT INTO prompty_tests (prompty_id, user_id, model, rating, image_url, approved)
      VALUES (v_prompty, v_user, 'm', 5, 'img'||i, true);
  END LOOP;

  IF (SELECT count(*) FROM credit_events
        WHERE user_id = v_user AND event_type = 'approved_result'
          AND created_at::date = CURRENT_DATE) <> 10 THEN
    RAISE EXCEPTION 'EARN-03 FAIL: daily cap 10 breached, got % approved_result rows',
      (SELECT count(*) FROM credit_events WHERE user_id = v_user
         AND event_type = 'approved_result' AND created_at::date = CURRENT_DATE);
  END IF;
  RAISE NOTICE 'EARN-03 PASS (cap): 11 approved results, only 10 credited today';

  -- (c) approved=false → no new approved_result credit row.
  INSERT INTO prompty_tests (prompty_id, user_id, model, rating, image_url, approved)
    VALUES (v_prompty, v_user, 'm', 5, 'imgx', false);
  IF (SELECT count(*) FROM credit_events
        WHERE user_id = v_user AND event_type = 'approved_result'
          AND created_at::date = CURRENT_DATE) <> 10 THEN
    RAISE EXCEPTION 'EARN-03 FAIL: approved=false granted a credit';
  END IF;
  RAISE NOTICE 'EARN-03 PASS (guard): approved=false grants no credit';
END $$;
ROLLBACK;
