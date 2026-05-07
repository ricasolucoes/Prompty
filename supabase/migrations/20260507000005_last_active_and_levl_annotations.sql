-- =============================================================================
-- Migration 005: last_active_at column + LEVL-02 design annotation
-- Phase 1 — Foundation (Gap Closure 01-11)
--
-- Adds a passive last_active_at column to profiles. Updated by the client on
-- session establish / restore / auth change. Provides a database surface for
-- "return visit" tracking referenced in LEVL-02. Does NOT award points; does
-- NOT participate in the point_events trigger chain.
-- =============================================================================

-- Add last_active_at column (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NULL;

-- Index to make "active in last N days" queries efficient if/when used in Phase 2.
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at
  ON profiles (last_active_at DESC NULLS LAST);

-- Backfill: set last_active_at to created_at for existing profiles so the column
-- has a non-null value for any pre-existing user (e.g., the demo author).
UPDATE profiles SET last_active_at = created_at WHERE last_active_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- LEVL-02 design annotation (no behavior change)
-- ─────────────────────────────────────────────────────────────────────────────
-- The LEVL-02 requirement reads: "System evaluates L2 unlock criteria:
-- >=5 copies + >=3 saves + >=1 feedback + >=2 return visits".
--
-- The Phase 1 CONTEXT.md decision (Sistema de Níveis section) intentionally
-- replaced per-criteria gating with an aggregate points threshold: L2 unlocks
-- at 50 points. The points economy approximates the four criteria:
--   - 5 copies × 5p = 25p (covers ">=5 copies")
--   - 1 rate × 5p   = 5p  (covers ">=1 feedback")
--   - up to 10 likes × 1p/day, capped (motivational)
--   - the remaining gap to 50p is filled by repeat sessions (return visits)
-- ">=3 saves" award 0p — saves are tracked in prompty_saves but do not
-- contribute to the level threshold (a deliberate choice: saves are a Curator
-- behavior, not a Beginner achievement).
--
-- This COMMENT annotates the design choice so future developers don't try to
-- "fix" level_from_points to literal per-criteria gating.

COMMENT ON FUNCTION level_from_points(INTEGER) IS
  'Resolves user level from aggregate points (L1 0-49, L2 50-249, L3 250-999, L4 1000-4999, L5 5000+). LEVL-02 requirement criteria (>=5 copies, >=3 saves, >=1 feedback, >=2 return visits) are approximated by aggregate point accumulation per CONTEXT.md decision. Saves do not award points by design - they are tracked separately in prompty_saves. Return visits are tracked passively via profiles.last_active_at (Plan 01-11).';

COMMENT ON COLUMN profiles.last_active_at IS
  'Updated by the client on auth session establish/restore/onAuthStateChange. Used as a passive return-visit signal for LEVL-02 approximation. Does not award points and is not part of the point_events trigger chain.';
