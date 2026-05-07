-- =============================================================================
-- Migration 002: RLS Policies
-- Phase 1 — Foundation
-- Enable Row Level Security on all 9 tables with explicit role-scoped policies
-- =============================================================================

-- profiles: public read, owner-only insert/update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- promptys: public read of published; author-only write
ALTER TABLE promptys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promptys_select_published" ON promptys FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "promptys_select_own_drafts" ON promptys FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "promptys_insert_own" ON promptys FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "promptys_update_own" ON promptys FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- prompty_versions: read same as parent; insert by author
ALTER TABLE prompty_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompty_versions_select_all" ON prompty_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prompty_versions_insert_author" ON prompty_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM promptys p WHERE p.id = prompty_id AND p.author_id = auth.uid()));

-- prompty_tests: anyone can read (public stats); only owner can insert
ALTER TABLE prompty_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompty_tests_select_all" ON prompty_tests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prompty_tests_insert_own" ON prompty_tests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- prompty_ratings: read all, insert/update own
ALTER TABLE prompty_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompty_ratings_select_all" ON prompty_ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prompty_ratings_insert_own" ON prompty_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prompty_ratings_update_own" ON prompty_ratings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- prompty_likes: read all, insert/delete own
ALTER TABLE prompty_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompty_likes_select_all" ON prompty_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prompty_likes_insert_own" ON prompty_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prompty_likes_delete_own" ON prompty_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- prompty_saves: read own only, insert/delete own
ALTER TABLE prompty_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompty_saves_select_own" ON prompty_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prompty_saves_insert_own" ON prompty_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prompty_saves_delete_own" ON prompty_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- prompty_remixes: read all, insert by author of remix_id
ALTER TABLE prompty_remixes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompty_remixes_select_all" ON prompty_remixes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prompty_remixes_insert_author" ON prompty_remixes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM promptys p WHERE p.id = remix_id AND p.author_id = auth.uid()));

-- point_events: immutable, trigger-only writes. RLS blocks all client inserts.
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "point_events_select_own" ON point_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "point_events_no_client_insert" ON point_events FOR INSERT TO anon, authenticated WITH CHECK (false);
-- No UPDATE or DELETE policies — table is append-only via SECURITY DEFINER triggers.
