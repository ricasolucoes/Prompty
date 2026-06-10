-- =============================================================================
-- Migration 009: +1 AI Credit per Level-Up
-- Cada nível alcançado (L2..L5) concede 1 Crédito de IA via credit_events.
-- Idempotente por (user, nível): ref_id determinístico derivado do nível, coberto
-- pela UNIQUE (user_id, event_type, ref_id) já existente em credit_events.
-- =============================================================================

-- 1. Allow the new ledger event type
ALTER TABLE credit_events DROP CONSTRAINT IF EXISTS credit_events_event_type_check;
ALTER TABLE credit_events ADD CONSTRAINT credit_events_event_type_check
  CHECK (event_type IN (
    'signup_bonus','earned_contribution','spent_generation','refund','admin_grant','level_up'));

-- 2. Level rank helper (mirrors LEVELS order in src/lib/constants/levels.ts)
CREATE OR REPLACE FUNCTION level_rank(lvl TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lvl
    WHEN 'L1' THEN 1
    WHEN 'L2' THEN 2
    WHEN 'L3' THEN 3
    WHEN 'L4' THEN 4
    WHEN 'L5' THEN 5
    ELSE 1
  END;
$$;

-- Deterministic per-level ref_id so UNIQUE (user_id, event_type, ref_id)
-- guarantees at most one level_up credit per (user, level) — even if points
-- are recomputed and the same threshold is crossed again.
CREATE OR REPLACE FUNCTION level_up_credit_ref(lvl TEXT)
RETURNS UUID LANGUAGE sql IMMUTABLE AS $$
  SELECT md5('level_up:' || lvl)::uuid;
$$;

-- 3. Trigger: award 1 credit per level crossed (handles multi-level jumps,
-- e.g. a +50 publish taking a user straight from L1 to L3 awards 2 credits).
-- AFTER UPDATE OF level — update_profile_credits only touches credits, so it
-- cannot re-fire this trigger.
CREATE OR REPLACE FUNCTION award_credit_on_level_up()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  old_rank INTEGER := level_rank(COALESCE(OLD.level, 'L1'));
  new_rank INTEGER := level_rank(COALESCE(NEW.level, 'L1'));
  r INTEGER;
  lvl TEXT;
BEGIN
  IF new_rank > old_rank THEN
    FOR r IN (old_rank + 1)..new_rank LOOP
      lvl := 'L' || r;
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.id, 'level_up', 1, level_up_credit_ref(lvl))
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    END LOOP;
    PERFORM update_profile_credits(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_credit_on_level_up ON profiles;
CREATE TRIGGER trg_award_credit_on_level_up
  AFTER UPDATE OF level ON profiles
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_level_up();

-- 4. Backfill: users who already reached L2+ before this migration get the
-- credits for every level they have achieved. Idempotent via the same
-- deterministic ref_id — safe to replay.
INSERT INTO credit_events (user_id, event_type, delta, ref_id)
SELECT p.id, 'level_up', 1, level_up_credit_ref('L' || r)
FROM profiles p
CROSS JOIN generate_series(2, 5) AS r
WHERE level_rank(p.level) >= r
ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;

DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT DISTINCT id FROM profiles WHERE level_rank(level) >= 2 LOOP
    PERFORM update_profile_credits(u.id);
  END LOOP;
END $$;

-- =============================================================================
-- VERIFY: run supabase/tests/levelup_credit.sql after applying.
-- =============================================================================
