-- Phase 6: app_settings — global key/value config (circuit breaker + future flags)
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Circuit breaker for image generation (Edge Function reads this before spend)
INSERT INTO app_settings (key, value)
VALUES ('generation_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS: readable by everyone (anon + authenticated), NEVER writable by the client.
-- Only the Edge Function (service-role) and admins via Dashboard may change settings.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_select_all" ON app_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "app_settings_no_client_write" ON app_settings
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "app_settings_no_client_update" ON app_settings
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
