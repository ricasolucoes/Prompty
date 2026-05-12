-- =============================================================================
-- Migration 006: L2 Features — Phase 2
-- Adds:
--   1. promptys.category (TEXT, nullable) for FEED-06 category filter
--   2. promptys.fts (tsvector GENERATED ... STORED) + GIN index for FEED-07
--   3. reports table (CUR-05, MODR-01, CUR-04) with RLS
--   4. profiles.is_admin (BOOLEAN, default false) for MODR-02 future surface
-- =============================================================================

-- 1. promptys.category
ALTER TABLE promptys ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_promptys_category ON promptys(category) WHERE category IS NOT NULL;
COMMENT ON COLUMN promptys.category IS 'Phase 2: free-form category for FEED-06 filter chips. Static list maintained client-side in src/lib/constants/categories.ts';

-- 2. promptys.fts — tsvector column for FEED-07 full-text search
-- Implementation: trigger-maintained (not GENERATED ALWAYS AS) because
-- array_to_string() is STABLE (not IMMUTABLE), which PostgreSQL forbids in
-- generated column expressions. A trigger gives identical semantics with full
-- style_tags coverage. See 02-RESEARCH.md Pitfall 3 + Alternatives Considered.
ALTER TABLE promptys ADD COLUMN IF NOT EXISTS fts tsvector;
CREATE INDEX IF NOT EXISTS idx_promptys_fts ON promptys USING GIN(fts);
COMMENT ON COLUMN promptys.fts IS 'Phase 2: trigger-maintained tsvector for FEED-07 full-text search via supabase.textSearch(''fts'', q, {type:''websearch'',config:''simple''}). Covers title + description + style_tags. Maintained by trigger_promptys_fts_update.';

-- Immutable helper to convert text[] to searchable text (avoids STABLE array_to_string in generated column)
CREATE OR REPLACE FUNCTION tags_to_text(tags TEXT[]) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(array_to_string(tags, ' '), '');
$$;

-- Trigger function: rebuild fts on INSERT or UPDATE of fts-relevant columns
CREATE OR REPLACE FUNCTION trigger_fn_promptys_fts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('simple'::regconfig,
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    tags_to_text(coalesce(NEW.style_tags, ARRAY[]::TEXT[]))
  );
  RETURN NEW;
END;
$$;

-- Attach trigger (idempotent via DROP IF EXISTS)
DROP TRIGGER IF EXISTS trigger_promptys_fts_update ON promptys;
CREATE TRIGGER trigger_promptys_fts_update
  BEFORE INSERT OR UPDATE OF title, description, style_tags ON promptys
  FOR EACH ROW EXECUTE FUNCTION trigger_fn_promptys_fts();

-- Backfill fts for existing rows
UPDATE promptys SET fts = to_tsvector('simple'::regconfig,
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  tags_to_text(coalesce(style_tags, ARRAY[]::TEXT[]))
);

-- 3. reports table (CUR-05 + MODR-01 + CUR-04)
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompty_id   UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('report', 'category_suggestion')),
  reason       TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporter_id, prompty_id, type)
);
CREATE INDEX IF NOT EXISTS idx_reports_prompty ON reports(prompty_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
COMMENT ON TABLE reports IS 'Phase 2: user-submitted reports + category suggestions. type discriminator: ''report'' (CUR-05/MODR-01), ''category_suggestion'' (CUR-04). Moderated via Supabase Dashboard — no in-app admin UI in MVP.';

-- Reports RLS: authenticated INSERT own; SELECT only own rows (no admin UI in app)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_select_own" ON reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- 4. profiles.is_admin (MODR-02 future surface — not used in frontend yet)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN profiles.is_admin IS 'Phase 2: admin flag for MODR-02 future surface. Currently unused in frontend; admins moderate via Supabase Dashboard. Toggle manually in DB for elevated users.';
