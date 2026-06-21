-- GAMIFICATION: end-to-end test — copies, likes, publishes, level progression, credit awards
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/gamification_full.sql
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES ('00000000-0000-0000-0000-0000000eaa00','00000000-0000-0000-0000-000000000000','gamif@test.local',crypt('x',gen_salt('bf')),'{"name":"gamif-test"}'::jsonb,NOW(),NOW(),NOW(),'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_user UUID := '00000000-0000-0000-0000-0000000eaa00';
  v_prompty UUID := gen_random_uuid();
  v_prompty2 UUID := gen_random_uuid();
  bal_pts INTEGER;
  bal_crd INTEGER;
  lvl TEXT;
  credit_count INTEGER;
BEGIN
  RAISE NOTICE '=== GAMIFICATION TEST START ===';

  -- 1) Insert seed promptys
  INSERT INTO promptys (id, slug, author_id, title, status, template, negative, inputs_schema, models, difficulty, category, style_tags, cover_gradient, version)
  VALUES
    (v_prompty, 'test-p1', v_user, 'Test P1', 'published', '{{x}}', '', '[]'::jsonb, ARRAY['test'], 'beginner', 'Test', ARRAY[]::text[], 'linear-gradient(135deg,#7C3AED,#22D3EE)', 1),
    (v_prompty2, 'test-p2', v_user, 'Test P2', 'published', '{{x}}', '', '[]'::jsonb, ARRAY['test'], 'beginner', 'Test', ARRAY[]::text[], 'linear-gradient(135deg,#7C3AED,#22D3EE)', 1);
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '0. Start: points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF bal_pts <> 0 OR bal_crd <> 1 THEN RAISE EXCEPTION 'Expected start: 0 pts, 1 crd'; END IF;

  -- 2) Copy 2 promptys (5 pts each = 10)
  INSERT INTO point_events (user_id, event_type, points, ref_id) VALUES (v_user, 'copy', 5, v_prompty);
  PERFORM update_profile_points(v_user);
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '1. After 1st copy: points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF bal_pts <> 5 THEN RAISE EXCEPTION 'Expected 5 pts after 1st copy'; END IF;
  IF lvl <> 'L1' THEN RAISE EXCEPTION 'Still L1'; END IF;

  INSERT INTO point_events (user_id, event_type, points, ref_id) VALUES (v_user, 'copy', 5, v_prompty2);
  PERFORM update_profile_points(v_user);
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '2. After 2 copies (10 pts): points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF bal_pts <> 10 THEN RAISE EXCEPTION 'Expected 10 pts'; END IF;

  -- 3) Rate 1 prompty (5 pts via trigger, triggers like automatically too)
  INSERT INTO prompty_tests (user_id, prompty_id, rating, created_at) VALUES (v_user, v_prompty, 5, NOW());
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '3. After rating (15 pts): points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF bal_pts <> 15 THEN RAISE EXCEPTION 'Expected 15 pts (10 copy + 5 rate)'; END IF;

  -- 4) Like 1 prompty (1 pt, max 10/day)
  INSERT INTO prompty_likes (user_id, prompty_id) VALUES (v_user, v_prompty);
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '4. After like (16 pts): points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF bal_pts <> 16 THEN RAISE EXCEPTION 'Expected 16 pts (15 + 1 like)'; END IF;

  -- 5) Publish own prompty (50 pts → 66 total) → crosses L2 (50) → +1 credit
  INSERT INTO promptys (id, slug, author_id, title, status, template, negative, inputs_schema, models, difficulty, category, style_tags, cover_gradient, version)
  VALUES (gen_random_uuid(), 'test-p3', v_user, 'Test P3', 'published', '{{x}}', '', '[]'::jsonb, ARRAY['test'], 'beginner', 'Test', ARRAY[], 'linear-gradient(135deg,#7C3AED,#22D3EE)', 1);
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '5. After publish (66 pts): points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF bal_pts <> 66 THEN RAISE EXCEPTION 'Expected 66 pts'; END IF;
  IF lvl <> 'L2' THEN RAISE EXCEPTION 'Should be L2, got %', lvl; END IF;
  IF bal_crd <> 2 THEN RAISE EXCEPTION 'Expected 2 credits (signup_bonus + level_up L2), got %', bal_crd; END IF;

  -- 6) Jump L2 → L4 (66 → 816 pts = L3). Need L4 at 1000 pts (20 publishes more = 50×20=1000)
  FOR i IN 1..19 LOOP
    INSERT INTO promptys (id, slug, author_id, title, status, template, negative, inputs_schema, models, difficulty, category, style_tags, cover_gradient, version)
    VALUES (gen_random_uuid(), 'test-p' || (i+3), v_user, 'Test P' || (i+3), 'published', '{{x}}', '', '[]'::jsonb, ARRAY['test'], 'beginner', 'Test', ARRAY[]::text[], 'linear-gradient(135deg,#7C3AED,#22D3EE)', 1);
  END LOOP;
  SELECT points, level, credits INTO bal_pts, lvl, bal_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '6. After 20 publishes (66 + 950 = 1016 pts, should be L4): points=%, level=%, credits=%', bal_pts, lvl, bal_crd;
  IF lvl <> 'L4' THEN RAISE EXCEPTION 'Should be L4, got %', lvl; END IF;
  -- Credits: signup(1) + L2(1) + L3(1) + L4(1) = 4
  IF bal_crd <> 4 THEN RAISE EXCEPTION 'Expected 4 credits (signup + L2/L3/L4), got %', bal_crd; END IF;

  -- Verify event ledger
  SELECT COUNT(*) INTO credit_count FROM credit_events WHERE user_id = v_user AND event_type = 'level_up';
  RAISE NOTICE '7. Credit ledger: % level_up events (expect 3: L2, L3, L4)', credit_count;
  IF credit_count <> 3 THEN RAISE EXCEPTION 'Expected 3 level_up events'; END IF;

  RAISE NOTICE '=== GAMIFICATION TEST PASS ===';
END $$;
ROLLBACK;
