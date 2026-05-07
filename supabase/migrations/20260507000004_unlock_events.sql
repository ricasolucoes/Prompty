-- =============================================================================
-- Migration 004: Unlock Events — Level Transition Tracking
-- Phase 1 — Foundation
-- Records every level-up transition via trigger on profiles.level change.
-- Also adds Storage bucket for prompty test result images.
-- =============================================================================

-- unlock_events: immutable record of level transitions
CREATE TABLE unlock_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_level TEXT NOT NULL,
  new_level      TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_unlock_events_user ON unlock_events(user_id, created_at DESC);

ALTER TABLE unlock_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unlock_events_select_own" ON unlock_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "unlock_events_no_client_insert" ON unlock_events FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Trigger: record level transition on profiles UPDATE when level changes
CREATE OR REPLACE FUNCTION record_level_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.level IS DISTINCT FROM NEW.level THEN
    INSERT INTO unlock_events (user_id, previous_level, new_level)
    VALUES (NEW.id, OLD.level, NEW.level);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_record_level_transition ON profiles;
CREATE TRIGGER trg_record_level_transition
  AFTER UPDATE OF level ON profiles
  FOR EACH ROW EXECUTE FUNCTION record_level_transition();

-- =============================================================================
-- Storage bucket: prompty-results
-- INFR-04: Stores user test result images (screenshots from AI tools)
-- 2 MB limit, MIME whitelist: webp, jpeg, png
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompty-results',
  'prompty-results',
  true,
  2097152,  -- 2 MB in bytes
  ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: anyone can read (public bucket); only authenticated can upload to own folder
CREATE POLICY "prompty-results read public"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'prompty-results');

CREATE POLICY "prompty-results upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'prompty-results'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
