# Phase 5: Ganhar Créditos Contribuindo — Research

**Researched:** 2026-05-31
**Domain:** PostgreSQL SECURITY DEFINER triggers, credit_events ledger, cap enforcement
**Confidence:** HIGH (all findings derived from direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. Table for results is `prompty_tests`, NOT `prompty_results`.
2. No `approved` column exists today — Phase 5 migration ADDS `approved BOOLEAN NOT NULL DEFAULT true` to `prompty_tests`. EARN-03 trigger fires on `approved = true`. Pattern: auto-approve + retroactive revoke when moderation arrives.
3. The `event_type` CHECK in `credit_events` (Phase 4) only covers `('signup_bonus','earned_contribution','spent_generation','refund','admin_grant')`. Phase 5 must ALTER the constraint to ADD: `'level_up'`, `'publish_prompty'`, `'approved_result'`.
4. Three AFTER triggers, SECURITY DEFINER, mirroring `award_points_on_like`:
   - `award_credit_on_level_up` on `unlock_events` AFTER INSERT — +2 credits, once per `new_level` per user (COUNT by new_level as ref), `ref_id` = `unlock_events.id`
   - `award_credit_on_publish` on `promptys` AFTER INSERT OR UPDATE, WHEN `status='published'` — +1, lifetime cap 20, `ref_id` = `promptys.id`
   - `award_credit_on_approved_result` on `prompty_tests` AFTER INSERT OR UPDATE, WHEN `approved=true` — +1, daily cap 10, `ref_id` = `prompty_tests.id`
5. `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` on all earns — requires the UNIQUE index from Phase 4 to cover new event_type values (it does, since the UNIQUE is not filtered by event_type).
6. ZERO changes to existing `point_events` triggers or functions.

### Claude's Discretion
- Whether to add a toast/nudge "+X créditos" in the frontend (optional).
- Exact migration filename (next sequence after Phase 4).
- One trigger function per source table vs. shared helper.

### Deferred Ideas (OUT OF SCOPE)
- UI de moderação/aprovação manual de resultados → Future (LOOP-02).
- Loop "gerou in-app → envia como resultado → ganha crédito" → Future (LOOP-01).
- Geração de imagem / Edge Function / provider → Phase 6.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EARN-01 | Usuário ganha créditos ao subir de nível (+2 por novo nível, uma vez por nível) | `unlock_events` AFTER INSERT trigger; `ON CONFLICT` on `unlock_events.id` as ref_id prevents duplicate; cap logic via COUNT by new_level |
| EARN-02 | Usuário ganha crédito ao publicar um prompty (lifetime cap 20) | `promptys` AFTER INSERT OR UPDATE WHEN status='published'; mirrors `award_points_on_publish`; `ON CONFLICT` on prompty id prevents double-award on edits |
| EARN-03 | Usuário ganha crédito ao enviar resultado aprovado, com teto diário anti-abuso | `prompty_tests` AFTER INSERT OR UPDATE WHEN approved=true; daily COUNT mirrors `award_points_on_like`; needs `approved` column added |
| EARN-04 | Sistema impede farming — server-side caps, não no client | All three triggers COUNT inside SECURITY DEFINER function; caps verified before insert; `ON CONFLICT DO NOTHING` for idempotency |
</phase_requirements>

---

## Summary

Phase 5 is a pure SQL migration. It adds three sibling triggers on `unlock_events`, `promptys`, and `prompty_tests` — each inserting into `credit_events` with SECURITY DEFINER, mirroring the existing `award_points_on_like`/`award_points_on_publish` pattern exactly. No new tables, no frontend changes beyond what Phase 4 already delivers (the `profiles.credits` badge auto-updates via `update_profile_credits`).

Two schema changes are prerequisites in the same migration: (1) `ALTER TABLE prompty_tests ADD COLUMN approved BOOLEAN NOT NULL DEFAULT true` — the `approved` column does not exist in `20260507000001_initial_schema.sql`; (2) `ALTER TABLE credit_events DROP CONSTRAINT ... ADD CONSTRAINT` to extend the `event_type` CHECK to include `'level_up'`, `'publish_prompty'`, `'approved_result'`.

The Phase 4 `credit_events` table has `UNIQUE (user_id, event_type, ref_id)` (confirmed in `04-02-PLAN.md` Task 1 DDL — line 105). This standard (non-partial) UNIQUE covers all event_type values including the new ones, so `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` works immediately for Phase 5's earn types.

**Primary recommendation:** Write a single migration `20260531000009_phase5_earn_credits.sql` with: ALTER prompty_tests (add approved), ALTER credit_events constraint, then the three trigger functions and triggers. One function per source table (project convention). Zero modifications to point_events chain.

---

## Schema Verification (Resolved)

### prompty_tests columns (from `20260507000001_initial_schema.sql`)

```
id, prompty_id, user_id, model, rating, notes, image_url, created_at
```

**Confirmed: NO `approved` column.** Phase 5 must add it.

### credit_events UNIQUE constraint (from `04-02-PLAN.md` Task 1, line 105)

```sql
UNIQUE (user_id, event_type, ref_id)
```

Plus a separate partial unique index for `signup_bonus` (NULL ref_id). The main `UNIQUE (user_id, event_type, ref_id)` constraint covers all non-null ref_ids across all event_types, including the new ones. **`ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` will work for Phase 5 earn events without any index additions.**

### credit_events event_type CHECK (from `04-02-PLAN.md` interfaces block)

Current: `('signup_bonus','earned_contribution','spent_generation','refund','admin_grant')`

Phase 5 extends to: `('signup_bonus','earned_contribution','spent_generation','refund','admin_grant','level_up','publish_prompty','approved_result')`

### unlock_events columns (from `20260507000004_unlock_events.sql`)

```
id, user_id, previous_level, new_level, created_at
```

No extra columns needed. Trigger fires on INSERT.

### promptys.status CHECK (from `20260507000001_initial_schema.sql`)

```
CHECK (status IN ('draft','published','flagged','removed'))
```

`'published'` is a valid value. EARN-02 trigger condition `WHEN NEW.status = 'published'` is safe.

### Migration filename

Last existing migration: `20260512000007_phase3_criador.sql`
Phase 4 creates: `20260531000008_phase4_credits_ledger.sql` (not yet on disk — planned only)
**Phase 5 filename: `20260531000009_phase5_earn_credits.sql`**

---

## Standard Stack

No new dependencies. Phase 5 is 100% PostgreSQL DDL.

| Component | Version | Notes |
|-----------|---------|-------|
| PostgreSQL (via Supabase) | 15+ | SECURITY DEFINER, advisory locks, UNIQUE constraints |
| Supabase local CLI | existing | `npx supabase db push --linked` to apply |
| psql | existing | smoke-test scripts in `supabase/tests/` |

---

## Architecture Pattern: Sibling Trigger

Established by the codebase. Each source table gets its own trigger function. No unified multi-table trigger. Reasons: independent testability, matches existing `award_points_on_test` / `award_points_on_like` / `award_points_on_publish` structure.

Each trigger function follows this exact shape (from `award_points_on_like`, lines 75-96 of `20260507000003_triggers_points.sql`):

```sql
CREATE OR REPLACE FUNCTION award_<name>()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cap_count INTEGER;
BEGIN
  -- [optional condition check]
  SELECT COUNT(*) INTO cap_count
    FROM credit_events
    WHERE user_id = NEW.<user_col>
      AND event_type = '<type>'
      [AND <cap_filter>];         -- daily: AND created_at::date = CURRENT_DATE
  IF cap_count < <limit> THEN
    INSERT INTO credit_events (user_id, event_type, delta, ref_id)
    VALUES (NEW.<user_col>, '<type>', <delta>, NEW.id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_credits(NEW.<user_col>);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_<name> ON <table>;
CREATE TRIGGER trg_<name>
  AFTER <event> ON <table>
  FOR EACH ROW [WHEN (<condition>)] EXECUTE FUNCTION award_<name>();
```

---

## Exact DDL for Phase 5

### Step 1: Add `approved` column to `prompty_tests`

```sql
ALTER TABLE prompty_tests
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true;
```

Default `true` = auto-approve all existing and new results. When moderation arrives (LOOP-02), a flow sets `approved = false` to revoke.

### Step 2: Extend credit_events event_type CHECK

The constraint name is set by Phase 4. The PLAN defines it inline (no explicit name given = PostgreSQL auto-names it `credit_events_event_type_check`). Use `IF EXISTS` to be migration-safe:

```sql
ALTER TABLE credit_events
  DROP CONSTRAINT IF EXISTS credit_events_event_type_check;

ALTER TABLE credit_events
  ADD CONSTRAINT credit_events_event_type_check
    CHECK (event_type IN (
      'signup_bonus',
      'earned_contribution',
      'spent_generation',
      'refund',
      'admin_grant',
      'level_up',
      'publish_prompty',
      'approved_result'
    ));
```

**If Phase 4 gave the constraint an explicit name, use that name.** The 04-02-PLAN.md DDL block does not give an explicit name, so PostgreSQL will auto-name it `credit_events_event_type_check`. Verify at apply-time with:
```sql
SELECT conname FROM pg_constraint WHERE conrelid='credit_events'::regclass AND contype='c';
```

### Step 3: EARN-01 — award_credit_on_level_up

Source table: `unlock_events` (id, user_id, previous_level, new_level, created_at)
Event: AFTER INSERT
Cap: once per `new_level` per user (COUNT WHERE new_level matches is NOT the right cap; the `ON CONFLICT` on `ref_id = unlock_events.id` already guarantees one event per unlock row. The CONTEXT.md cap is "max 1 event de crédito por new_level" — meaning the same level transition can't be re-awarded even if a second unlock_events row somehow appeared. Use COUNT on ref_id cross-joined with new_level OR simply rely on the `ON CONFLICT` since each unlock row is unique. CONTEXT.md also says +2 per new level; the planner must use delta=2.)

```sql
CREATE OR REPLACE FUNCTION award_credit_on_level_up()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  already INTEGER;
BEGIN
  -- Idempotent: one credit award per unlock_events row (ON CONFLICT covers this).
  -- Additional cap: only one credit award per (user, new_level) ever.
  SELECT COUNT(*) INTO already
    FROM credit_events ce
    JOIN unlock_events ue ON ue.id = ce.ref_id
    WHERE ce.user_id = NEW.user_id
      AND ce.event_type = 'level_up'
      AND ue.new_level = NEW.new_level;
  IF already = 0 THEN
    INSERT INTO credit_events (user_id, event_type, delta, ref_id)
    VALUES (NEW.user_id, 'level_up', 2, NEW.id)
    ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
    PERFORM update_profile_credits(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_level_up ON unlock_events;
CREATE TRIGGER trg_credit_on_level_up
  AFTER INSERT ON unlock_events
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_level_up();
```

**Alternative simpler cap** (acceptable if planner prefers): skip the JOIN cap check and rely purely on `ON CONFLICT` — since `record_level_transition` only inserts one `unlock_events` row per actual level-up (it checks `OLD.level IS DISTINCT FROM NEW.level`), duplicate rows for the same transition are impossible in practice. The `ON CONFLICT` is then sufficient. The JOIN approach is the belt-and-suspenders version.

### Step 4: EARN-02 — award_credit_on_publish

Source table: `promptys` (author_id, id, status)
Event: AFTER INSERT OR UPDATE
Condition check inside function: `IF NEW.status = 'published'`
`ON CONFLICT` on `ref_id = promptys.id` prevents double-award when an existing published prompty is updated (status stays 'published', trigger fires again, ON CONFLICT blocks the insert). This is exactly how `award_points_on_publish` works.

```sql
CREATE OR REPLACE FUNCTION award_credit_on_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  -- CONSTANT: lifetime publish credit cap per user
  PUBLISH_CAP CONSTANT INTEGER := 20;
  lifetime_count INTEGER;
BEGIN
  IF NEW.status = 'published' THEN
    SELECT COUNT(*) INTO lifetime_count
      FROM credit_events
      WHERE user_id = NEW.author_id
        AND event_type = 'publish_prompty';
    IF lifetime_count < PUBLISH_CAP THEN
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.author_id, 'publish_prompty', 1, NEW.id)
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
      PERFORM update_profile_credits(NEW.author_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_publish ON promptys;
CREATE TRIGGER trg_credit_on_publish
  AFTER INSERT OR UPDATE ON promptys
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_publish();
```

**Confirm: AFTER INSERT OR UPDATE (not INSERT only).** The existing `award_points_on_publish` fires AFTER INSERT only (line 65, `20260512000007_phase3_criador.sql`). EARN-02 should fire on UPDATE too because a prompty can be created as `draft` then published later. Planner must use AFTER INSERT OR UPDATE.

### Step 5: EARN-03 — award_credit_on_approved_result

Source table: `prompty_tests` (user_id, id, approved)
Event: AFTER INSERT OR UPDATE
Daily cap pattern — verbatim from `award_points_on_like` (lines 78-84 of `20260507000003_triggers_points.sql`):

```sql
SELECT COUNT(*) INTO today_likes
  FROM point_events
  WHERE user_id = NEW.user_id
    AND event_type = 'like'
    AND created_at::date = CURRENT_DATE;
```

Applied to credits:

```sql
CREATE OR REPLACE FUNCTION award_credit_on_approved_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  -- CONSTANT: daily approved-result credit cap per user
  DAILY_CAP CONSTANT INTEGER := 10;
  today_count INTEGER;
BEGIN
  IF NEW.approved = true THEN
    SELECT COUNT(*) INTO today_count
      FROM credit_events
      WHERE user_id = NEW.user_id
        AND event_type = 'approved_result'
        AND created_at::date = CURRENT_DATE;
    IF today_count < DAILY_CAP THEN
      INSERT INTO credit_events (user_id, event_type, delta, ref_id)
      VALUES (NEW.user_id, 'approved_result', 1, NEW.id)
      ON CONFLICT (user_id, event_type, ref_id) DO NOTHING;
      PERFORM update_profile_credits(NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_credit_on_approved_result ON prompty_tests;
CREATE TRIGGER trg_credit_on_approved_result
  AFTER INSERT OR UPDATE ON prompty_tests
  FOR EACH ROW EXECUTE FUNCTION award_credit_on_approved_result();
```

**Note on UPDATE trigger:** When LOOP-02 lands and sets `approved = false`, this trigger fires again. The `approved = true` guard prevents any new credit insert. If revoking credits is needed at that point, that is a separate Phase/migration concern — Phase 5 only awards, never subtracts.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Idempotency | Custom "check if exists" query | `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` |
| Balance cache | Manual UPDATE in frontend | `update_profile_credits()` called inside trigger |
| Cap enforcement | Client-side check | `COUNT(*)` inside SECURITY DEFINER trigger |
| Fraud prevention | Application layer | RLS `WITH CHECK (false)` blocks all direct client inserts |

---

## Common Pitfalls

### Pitfall 1: Trigger on INSERT only for EARN-02
`award_points_on_publish` fires AFTER INSERT only. For credits, prompty can be created as `draft` and published later via UPDATE. EARN-02 trigger MUST be `AFTER INSERT OR UPDATE`. ON CONFLICT prevents double-award.

### Pitfall 2: Standard UNIQUE and NULL ref_id
The `UNIQUE (user_id, event_type, ref_id)` in PostgreSQL treats NULLs as distinct — two rows with `ref_id=NULL` do NOT conflict. Phase 4 handles this for `signup_bonus` via a separate partial unique index (`credit_events_signup_once`). Phase 5 earn events all have non-null ref_ids (unlock_events.id, promptys.id, prompty_tests.id), so the standard UNIQUE works correctly.

### Pitfall 3: CHECK constraint auto-name
PostgreSQL auto-names inline CHECK constraints as `<table>_<column>_check`. The Phase 4 plan uses an inline CHECK (no explicit name), so the constraint is named `credit_events_event_type_check`. Verify before DROP with: `SELECT conname FROM pg_constraint WHERE conrelid='credit_events'::regclass AND contype='c';`

### Pitfall 4: award_credit_on_publish COUNT includes all users
COUNT must filter on `user_id = NEW.author_id`, not just `event_type`. Obvious but easy to omit under copy-paste.

### Pitfall 5: approved = true condition on UPDATE
When `prompty_tests` is updated and `approved` is still `true`, the trigger fires and attempts insert. `ON CONFLICT DO NOTHING` silently prevents the duplicate. This is correct behavior — no defensive check needed.

### Pitfall 6: Interference with point_events triggers
`award_points_on_test` fires on `prompty_tests` AFTER INSERT. `award_credit_on_approved_result` also fires on `prompty_tests` AFTER INSERT OR UPDATE. Both are independent trigger functions on the same table. PostgreSQL fires multiple triggers in alphabetical order by name when there's no explicit ordering. Since they write to different tables (`point_events` vs `credit_events`) and call different helper functions, there is NO interference. Confirmed: each trigger function is self-contained.

---

## Independence from point_events Triggers — Confirmed

| Trigger | Table | Writes to | Calls |
|---------|-------|-----------|-------|
| `award_points_on_test` (existing) | `prompty_tests` | `point_events` | `update_profile_points` |
| `award_credit_on_approved_result` (new) | `prompty_tests` | `credit_events` | `update_profile_credits` |
| `award_points_on_publish` (existing) | `promptys` | `point_events` | `update_profile_points` |
| `award_credit_on_publish` (new) | `promptys` | `credit_events` | `update_profile_credits` |

No shared state. No shared function calls. Zero interference.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | psql smoke scripts (existing pattern: `supabase/tests/`) |
| Config | No config file — direct `psql "$DB" -f <file>` |
| Quick run | `psql "$DB" -f supabase/tests/earn01_level_up.sql` |
| Full suite | `for f in supabase/tests/earn0*.sql; do psql "$DB" -f "$f"; done` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EARN-01 | Level-up awards +2 credits; duplicate unlock row does not double-award | unit (SQL) | `psql "$DB" -f supabase/tests/earn01_level_up.sql` | Wave 0 |
| EARN-01 | Already-awarded level is skipped on re-trigger | unit (SQL) | included in earn01 | Wave 0 |
| EARN-02 | Publish awards +1; repeated UPDATE on same prompty does not double-award | unit (SQL) | `psql "$DB" -f supabase/tests/earn02_publish.sql` | Wave 0 |
| EARN-02 | Lifetime cap 20: 21st publish gives no credit | unit (SQL) | included in earn02 | Wave 0 |
| EARN-03 | Approved result awards +1; daily cap stops at 10 | unit (SQL) | `psql "$DB" -f supabase/tests/earn03_approved_result.sql` | Wave 0 |
| EARN-03 | Non-approved result (approved=false) gives no credit | unit (SQL) | included in earn03 | Wave 0 |
| EARN-04 | point_events unaffected after all three triggers fire | smoke (SQL) | `psql "$DB" -f supabase/tests/earn04_no_interference.sql` | Wave 0 |

### Sampling Rate

- Per task commit: quick psql smoke for the specific trigger being written
- Per wave merge: full `earn0*.sql` suite
- Phase gate: full suite + `cred0*.sql` (Phase 4 regressions) green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `supabase/tests/earn01_level_up.sql` — covers EARN-01 (idempotency + +2 delta)
- [ ] `supabase/tests/earn02_publish.sql` — covers EARN-02 (ON CONFLICT + lifetime cap 20)
- [ ] `supabase/tests/earn03_approved_result.sql` — covers EARN-03 (daily cap 10 + approved guard)
- [ ] `supabase/tests/earn04_no_interference.sql` — covers EARN-04 (point_events row count before = after)

#### Smoke script pattern (copy from `cred01_signup_bonus.sql`)

```sql
-- earn01_level_up.sql
DO $$
DECLARE
  v_user UUID;
  v_unlock UUID;
  c_before INTEGER;
  c_after INTEGER;
  c_after2 INTEGER;
BEGIN
  -- Setup: create test user + profile
  INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'earn01@test.local') RETURNING id INTO v_user;
  -- Simulate level-up by inserting unlock_events directly (bypass guard — we are postgres/service role)
  INSERT INTO unlock_events (user_id, previous_level, new_level) VALUES (v_user, 'L1', 'L2') RETURNING id INTO v_unlock;
  SELECT credits INTO c_after FROM profiles WHERE id = v_user;
  ASSERT c_after = 2, format('EARN-01 FAIL: expected 2 credits after level-up, got %s', c_after);
  -- Re-fire with same ref_id: ON CONFLICT must block
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
    VALUES (v_user, 'level_up', 2, v_unlock) ON CONFLICT DO NOTHING;
  PERFORM update_profile_credits(v_user);
  SELECT credits INTO c_after2 FROM profiles WHERE id = v_user;
  ASSERT c_after2 = 2, format('EARN-01 FAIL: credits changed on duplicate insert, got %s', c_after2);
  RAISE NOTICE 'EARN-01 PASS';
  -- Cleanup
  DELETE FROM auth.users WHERE id = v_user;
END;
$$;
```

---

## Sources

### Primary (HIGH confidence — direct migration inspection)
- `supabase/migrations/20260507000001_initial_schema.sql` — `prompty_tests` columns confirmed (no `approved`); `point_events` UNIQUE pattern; `promptys.status` CHECK
- `supabase/migrations/20260507000003_triggers_points.sql` — `award_points_on_like` daily-cap COUNT pattern (verbatim); `update_profile_credits` blueprint
- `supabase/migrations/20260507000004_unlock_events.sql` — `unlock_events` columns confirmed
- `supabase/migrations/20260512000007_phase3_criador.sql` — `award_points_on_publish` INSERT-only trigger (confirms Phase 5 needs INSERT OR UPDATE)
- `.planning/phases/04-ledger-creditos-bonus/04-02-PLAN.md` — `credit_events` DDL: `UNIQUE (user_id, event_type, ref_id)` confirmed; `event_type` CHECK values confirmed; migration filename `20260531000008` confirmed

### Secondary (HIGH confidence — planning documents)
- `.planning/phases/05-ganhar-creditos-contribuindo/05-CONTEXT.md` — all locked decisions
- `.planning/research/ARCHITECTURE.md` — credit earn trigger blueprints
- `.planning/REQUIREMENTS.md` — EARN-01..EARN-04 definitions

---

## Metadata

**Confidence breakdown:**
- Schema facts (prompty_tests columns, UNIQUE, CHECK): HIGH — verified in migrations
- Trigger patterns: HIGH — verbatim from existing migrations
- Migration filename: HIGH — `20260531000009` (008 is Phase 4, not yet on disk but planned)
- Constraint auto-name: MEDIUM — standard PostgreSQL naming but verify at apply time
- Wave 0 test script internals: MEDIUM — pattern from existing cred01, but not executed

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (migrations are stable; only risk is Phase 4 landing with different constraint name)
