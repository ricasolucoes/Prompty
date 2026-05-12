-- =============================================================================
-- Migration 007: Phase 3 — L3 Criador
-- Phase 3
-- Adds parent_id for variations (CREAT-04), prompty-covers Storage bucket
-- (CREAT-01 cover image), and publish-points trigger (50p per published prompty).
-- =============================================================================

-- 1. parent_id column for variation lineage (CREAT-04)
ALTER TABLE promptys ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES promptys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_promptys_parent ON promptys(parent_id);

-- 2. Storage bucket: prompty-covers (CREAT-01)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompty-covers',
  'prompty-covers',
  true,
  2097152,  -- 2 MB in bytes (matches prompty-results)
  ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS for prompty-covers (read public; upload own folder; update/delete own folder)
CREATE POLICY "prompty-covers read public"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'prompty-covers');

CREATE POLICY "prompty-covers upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'prompty-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "prompty-covers update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'prompty-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "prompty-covers delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'prompty-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Publish-points trigger (CREAT-01 — awards 50p when status='published')
CREATE OR REPLACE FUNCTION award_points_on_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' THEN
    INSERT INTO point_events (user_id, event_type, points, ref_id) VALUES (NEW.author_id, 'publish', 50, NEW.id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_points(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_points_on_publish ON promptys;
CREATE TRIGGER trg_points_on_publish
  AFTER INSERT ON promptys
  FOR EACH ROW EXECUTE FUNCTION award_points_on_publish();
