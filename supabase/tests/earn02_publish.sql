-- EARN-02: publish awards +1; repeat UPDATE no double-award; lifetime cap 20.
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/earn02_publish.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users; insert via auth.users so handle_new_user fires.
-- ROLLBACK discards everything at the end.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000e0002','00000000-0000-0000-0000-000000000000','earn02@test.local',crypt('x',gen_salt('bf')),'{"name":"earn02-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;
-- Reset credits AND points so we start from a clean slate.
DELETE FROM credit_events WHERE user_id = '00000000-0000-0000-0000-0000000e0002';
DELETE FROM point_events WHERE user_id = '00000000-0000-0000-0000-0000000e0002';
DELETE FROM unlock_events WHERE user_id = '00000000-0000-0000-0000-0000000e0002';
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0002');
SELECT update_profile_points('00000000-0000-0000-0000-0000000e0002');

DO $$
DECLARE
  v_author UUID := '00000000-0000-0000-0000-0000000e0002';
  v_prompty UUID;
  pub_credits INTEGER;
  i INTEGER;
BEGIN
  -- (a) First publish → exactly 1 publish_prompty credit row.
  INSERT INTO promptys (author_id, title, template, slug, status)
    VALUES (v_author, 't1', 'b1', 'earn02-slug-1', 'published')
    RETURNING id INTO v_prompty;
  SELECT count(*) INTO pub_credits FROM credit_events
    WHERE user_id = v_author AND event_type = 'publish_prompty';
  IF pub_credits <> 1 THEN RAISE EXCEPTION 'EARN-02 FAIL: expected 1 publish_prompty credit, got %', pub_credits; END IF;

  -- (b) UPDATE the same published prompty → ON CONFLICT blocks, still 1 publish_prompty row.
  UPDATE promptys SET title = 't1-edited' WHERE id = v_prompty;
  SELECT count(*) INTO pub_credits FROM credit_events
    WHERE user_id = v_author AND event_type = 'publish_prompty';
  IF pub_credits <> 1 THEN RAISE EXCEPTION 'EARN-02 FAIL: re-publish UPDATE double-awarded, got %', pub_credits; END IF;
  RAISE NOTICE 'EARN-02 PASS (award+idempotent): +1, no double-award on UPDATE';

  -- (c) Publish 19 more (total 20) then a 21st; lifetime cap = 20 → 21st gives no credit.
  -- Reset point_events/unlock_events between publishes to avoid level-up noise.
  FOR i IN 2..21 LOOP
    DELETE FROM point_events WHERE user_id = v_author;
    DELETE FROM unlock_events WHERE user_id = v_author;
    PERFORM update_profile_points(v_author);
    INSERT INTO promptys (author_id, title, template, slug, status)
      VALUES (v_author, 't'||i, 'b'||i, 'earn02-slug-'||i, 'published');
  END LOOP;
  SELECT count(*) INTO pub_credits FROM credit_events
    WHERE user_id = v_author AND event_type = 'publish_prompty';
  IF pub_credits <> 20 THEN RAISE EXCEPTION 'EARN-02 FAIL: lifetime cap 20 breached, got %', pub_credits; END IF;
  RAISE NOTICE 'EARN-02 PASS (cap): 21 publishes but publish_prompty credits capped at 20';
END $$;
ROLLBACK;
