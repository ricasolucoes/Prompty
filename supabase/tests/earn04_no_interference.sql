-- EARN-04: credit triggers write ZERO rows to point_events; point triggers unaffected.
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/earn04_no_interference.sql
\set ON_ERROR_STOP on
BEGIN;
-- profiles.id FKs to auth.users; insert via auth.users so handle_new_user fires.
-- ROLLBACK discards everything at the end.
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000e0004','00000000-0000-0000-0000-000000000000','earn04@test.local',crypt('x',gen_salt('bf')),'{"name":"earn04-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;
-- Reset signup_bonus credit so we start at a known balance of 0 before the earn test.
DELETE FROM credit_events WHERE user_id = '00000000-0000-0000-0000-0000000e0004';
SELECT update_profile_credits('00000000-0000-0000-0000-0000000e0004');

DO $$
DECLARE
  v_user UUID := '00000000-0000-0000-0000-0000000e0004';
  v_prompty UUID;
  bad_pe INTEGER;
  ce_level INTEGER; ce_publish INTEGER; ce_approved INTEGER;
  d_level INTEGER; d_publish INTEGER; d_approved INTEGER;
BEGIN
  -- Fire all three credit-earning actions.

  -- (1) level_up: unlock_events insert → award_credit_on_level_up (+2).
  INSERT INTO unlock_events (user_id, previous_level, new_level)
    VALUES (v_user, 'L1', 'L2');

  -- (2) publish: a published promptys row → award_credit_on_publish (+1).
  --     This ALSO legitimately fires the pre-existing award_points_on_publish point trigger.
  INSERT INTO promptys (author_id, title, template, slug, status)
    VALUES (v_user, 'earn04', 'tpl', 'earn04-pub', 'published')
    RETURNING id INTO v_prompty;

  -- (3) approved_result: an approved prompty_tests row → award_credit_on_approved_result (+1).
  --     This ALSO fires the pre-existing award_points_on_test point trigger.
  INSERT INTO prompty_tests (prompty_id, user_id, model, rating, image_url, approved)
    VALUES (v_prompty, v_user, 'm', 5, 'img', true);

  -- (a) ROBUST: the credit triggers must have written NOTHING to point_events.
  --     No point_events row may carry a credit-typed event_type.
  SELECT count(*) INTO bad_pe FROM point_events
    WHERE event_type IN ('level_up', 'publish_prompty', 'approved_result',
                         'signup_bonus', 'spent_generation', 'refund');
  IF bad_pe <> 0 THEN
    RAISE EXCEPTION 'EARN-04 FAIL: % credit-typed rows leaked into point_events', bad_pe;
  END IF;

  -- (b) ROBUST: the expected credit_events rows exist with the right deltas.
  SELECT count(*), COALESCE(sum(delta), 0) INTO ce_level, d_level
    FROM credit_events WHERE user_id = v_user AND event_type = 'level_up';
  SELECT count(*), COALESCE(sum(delta), 0) INTO ce_publish, d_publish
    FROM credit_events WHERE user_id = v_user AND event_type = 'publish_prompty';
  SELECT count(*), COALESCE(sum(delta), 0) INTO ce_approved, d_approved
    FROM credit_events WHERE user_id = v_user AND event_type = 'approved_result';

  IF ce_level <> 1 OR d_level <> 2 THEN
    RAISE EXCEPTION 'EARN-04 FAIL: level_up credit_events=% delta=% (want 1 / 2)', ce_level, d_level;
  END IF;
  IF ce_publish <> 1 OR d_publish <> 1 THEN
    RAISE EXCEPTION 'EARN-04 FAIL: publish_prompty credit_events=% delta=% (want 1 / 1)', ce_publish, d_publish;
  END IF;
  IF ce_approved <> 1 OR d_approved <> 1 THEN
    RAISE EXCEPTION 'EARN-04 FAIL: approved_result credit_events=% delta=% (want 1 / 1)', ce_approved, d_approved;
  END IF;

  RAISE NOTICE 'EARN-04 PASS: 0 credit-typed rows in point_events; credit_events has level_up(+2), publish(+1), approved(+1)';
END $$;
ROLLBACK;
