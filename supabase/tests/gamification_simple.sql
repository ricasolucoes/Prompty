-- GAMIFICATION: simple test — verify levels rise correctly with point accumulation
-- Run: psql "${SUPABASE_DB_URL:-$DATABASE_URL}" -f supabase/tests/gamification_simple.sql
\set ON_ERROR_STOP on
BEGIN;

-- Use a completely unique UUID unlikely to exist
DO $$
DECLARE
  v_user UUID;
  v_prompty_1 UUID;
  v_pts INTEGER;
  v_lvl TEXT;
  v_crd INTEGER;
BEGIN
  v_user := '10000000-0000-0000-0000-000000000001'::uuid;
  v_prompty_1 := '20000000-0000-0000-0000-000000000001'::uuid;

  -- Fresh user via auth trigger
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (v_user, '00000000-0000-0000-0000-000000000000', 'gamif-simple@test', crypt('x', gen_salt('bf')), '{"name":"gamif-simple"}'::jsonb, NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  SELECT points, level, credits INTO v_pts, v_lvl, v_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '0. New signup: points=%, level=%, credits=%', COALESCE(v_pts, 0), COALESCE(v_lvl, 'L1'), COALESCE(v_crd, 0);

  -- Seed 1 prompty
  INSERT INTO promptys (id, slug, author_id, title, status, template, negative, inputs_schema, models, difficulty, category, style_tags, cover_gradient, version)
  VALUES (v_prompty_1, 'test-simple', v_user, 'Test Simple', 'published', '{{x}}', '', '[]'::jsonb, ARRAY['test']::text[], 'beginner', 'Test', ARRAY[]::text[], 'linear-gradient(135deg,#7C3AED,#22D3EE)', 1);

  -- Copy 10× (5 pts each = 50 pts) → hits L2 threshold
  FOR i IN 1..10 LOOP
    INSERT INTO point_events (user_id, event_type, points, ref_id)
    VALUES (v_user, 'copy', 5, gen_random_uuid())
    ON CONFLICT DO NOTHING;
  END LOOP;
  PERFORM update_profile_points(v_user);

  SELECT points, level, credits INTO v_pts, v_lvl, v_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '1. After 10 copies (50 pts): points=%, level=%, credits=%', v_pts, v_lvl, v_crd;
  IF v_lvl <> 'L2' THEN RAISE EXCEPTION 'Expected L2 at 50 pts, got %', v_lvl; END IF;
  IF v_crd <> 2 THEN RAISE EXCEPTION 'Expected 2 credits (signup_bonus + level_up L2), got %', v_crd; END IF;

  -- 20 more copies (100 pts) → total 150, still L2
  FOR i IN 1..20 LOOP
    INSERT INTO point_events (user_id, event_type, points, ref_id)
    VALUES (v_user, 'copy', 5, gen_random_uuid())
    ON CONFLICT DO NOTHING;
  END LOOP;
  PERFORM update_profile_points(v_user);

  SELECT points, level, credits INTO v_pts, v_lvl, v_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '2. After 30 copies (150 pts): points=%, level=%, credits=%', v_pts, v_lvl, v_crd;
  IF v_lvl <> 'L2' THEN RAISE EXCEPTION 'Expected still L2, got %', v_lvl; END IF;

  -- 20 more copies (100 pts) → total 250, hits L3
  FOR i IN 1..20 LOOP
    INSERT INTO point_events (user_id, event_type, points, ref_id)
    VALUES (v_user, 'copy', 5, gen_random_uuid())
    ON CONFLICT DO NOTHING;
  END LOOP;
  PERFORM update_profile_points(v_user);

  SELECT points, level, credits INTO v_pts, v_lvl, v_crd FROM profiles WHERE id = v_user;
  RAISE NOTICE '3. After 50 copies (250 pts): points=%, level=%, credits=%', v_pts, v_lvl, v_crd;
  IF v_lvl <> 'L3' THEN RAISE EXCEPTION 'Expected L3 at 250 pts, got %', v_lvl; END IF;
  IF v_crd <> 3 THEN RAISE EXCEPTION 'Expected 3 credits (L2 + L3), got %', v_crd; END IF;

  RAISE NOTICE '=== GAMIFICATION SIMPLE TEST PASS ===';
END $$;
ROLLBACK;
