-- =============================================================================
-- Migration 001: Initial Schema
-- Phase 1 — Foundation
-- All 9 core tables with indexes, constraints, and FK relationships
-- =============================================================================

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE,
  name       TEXT,
  bio        TEXT,
  avatar_url TEXT,
  level      TEXT NOT NULL DEFAULT 'L1' CHECK (level IN ('L1','L2','L3','L4','L5')),
  points     INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  streak     INTEGER NOT NULL DEFAULT 0,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_username ON profiles(username);

-- promptys
CREATE TABLE promptys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template        TEXT NOT NULL,
  negative        TEXT,
  inputs_schema   JSONB NOT NULL DEFAULT '[]'::jsonb,
  models          TEXT[] NOT NULL DEFAULT '{}',
  difficulty      TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  style_tags      TEXT[] NOT NULL DEFAULT '{}',
  cover_url       TEXT,
  cover_gradient  TEXT,
  license         TEXT NOT NULL DEFAULT 'community-remix',
  status          TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','flagged','removed')),
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_promptys_status_created ON promptys(status, created_at DESC, id DESC);
CREATE INDEX idx_promptys_author ON promptys(author_id);

-- prompty_versions
CREATE TABLE prompty_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompty_id    UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  template      TEXT NOT NULL,
  negative      TEXT,
  inputs_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompty_id, version)
);

-- prompty_tests (user submitted "I tried this prompt + rating + image")
CREATE TABLE prompty_tests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompty_id  UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model       TEXT,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes       TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_prompty_tests_user ON prompty_tests(user_id);
CREATE INDEX idx_prompty_tests_prompty ON prompty_tests(prompty_id);

-- prompty_ratings (multi-dimensional, used in L2+; created now per CONTEXT.md "Schema completo")
CREATE TABLE prompty_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompty_id        UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visual_quality    NUMERIC(3,2) CHECK (visual_quality BETWEEN 0 AND 5),
  prompt_accuracy   NUMERIC(3,2) CHECK (prompt_accuracy BETWEEN 0 AND 5),
  reproducibility   NUMERIC(3,2) CHECK (reproducibility BETWEEN 0 AND 5),
  originality       NUMERIC(3,2) CHECK (originality BETWEEN 0 AND 5),
  model_compat      NUMERIC(3,2) CHECK (model_compat BETWEEN 0 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (prompty_id, user_id)
);

-- prompty_likes
CREATE TABLE prompty_likes (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompty_id UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, prompty_id)
);
CREATE INDEX idx_prompty_likes_prompty ON prompty_likes(prompty_id);

-- prompty_saves
CREATE TABLE prompty_saves (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompty_id UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, prompty_id)
);
CREATE INDEX idx_prompty_saves_user ON prompty_saves(user_id);

-- prompty_remixes (for Phase 3)
CREATE TABLE prompty_remixes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id  UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  remix_id     UUID NOT NULL REFERENCES promptys(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (original_id, remix_id)
);

-- point_events (immutable, trigger-only writes)
CREATE TABLE point_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('copy','rate','like','streak','publish','remix_accepted')),
  points      INTEGER NOT NULL,
  ref_id      UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_type, ref_id)
);
CREATE INDEX idx_point_events_user ON point_events(user_id, created_at DESC);
