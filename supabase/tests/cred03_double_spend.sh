#!/usr/bin/env bash
# CRED-03: two concurrent spend_credit() sessions with 1 credit → exactly 1 success, balance never < 0.
# TRUE two-session concurrency test using backgrounded psql processes.
# Run: bash supabase/tests/cred03_double_spend.sh
set -euo pipefail

DB="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
if [[ -z "$DB" ]]; then
  echo "ERROR: SUPABASE_DB_URL or DATABASE_URL must be set" >&2
  exit 1
fi

TEST_USER='00000000-0000-0000-0000-0000000c0d5d'
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ---------------------------------------------------------------------------
# 1. Seed: create test profile + exactly 1 credit via signup_bonus row.
#    Idempotent across re-runs: clean prior spend rows for this test user so
#    balance is always 1 at start, regardless of prior test runs.
# ---------------------------------------------------------------------------
psql "$DB" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO profiles (id, name) VALUES ('${TEST_USER}', 'cred03-double-spend-test')
  ON CONFLICT (id) DO NOTHING;

-- Remove any prior spend/bonus rows for this test user to guarantee clean state
DELETE FROM credit_events WHERE user_id = '${TEST_USER}';

-- Grant exactly 1 credit
INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES ('${TEST_USER}', 'signup_bonus', 1, NULL)
  ON CONFLICT DO NOTHING;

SELECT update_profile_credits('${TEST_USER}');
SQL

# Verify seed: must have exactly 1 credit before concurrent spend
SEED_BAL=$(psql "$DB" -At -c "SELECT credits FROM profiles WHERE id = '${TEST_USER}'")
if [[ "$SEED_BAL" != "1" ]]; then
  echo "CRED-03 FAIL: seed balance expected 1, got ${SEED_BAL}" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Launch TWO concurrent psql sessions, each calling spend_credit(NULL).
#    Each psql invocation is a separate backend connection — genuine concurrency.
#    pg_advisory_xact_lock inside spend_credit serializes the two sessions.
# ---------------------------------------------------------------------------
run_spend() {
  psql "$DB" -At -v ON_ERROR_STOP=1 <<SQL
SET role = 'authenticated';
SET request.jwt.claim.sub = '${TEST_USER}';
SELECT ok FROM spend_credit(NULL);
SQL
}

run_spend > "$TMP/r1" 2>"$TMP/e1" &
P1=$!
run_spend > "$TMP/r2" 2>"$TMP/e2" &
P2=$!
wait "$P1"; wait "$P2"

# ---------------------------------------------------------------------------
# 3. Assert: exactly ONE ok=t, ONE ok=f.
# ---------------------------------------------------------------------------
R1=$(cat "$TMP/r1" | tr -d '[:space:]')
R2=$(cat "$TMP/r2" | tr -d '[:space:]')

TRUE_COUNT=0
[[ "$R1" == "t" ]] && TRUE_COUNT=$((TRUE_COUNT + 1))
[[ "$R2" == "t" ]] && TRUE_COUNT=$((TRUE_COUNT + 1))

if [[ "$TRUE_COUNT" -ne 1 ]]; then
  echo "CRED-03 FAIL: expected exactly 1 success, got ${TRUE_COUNT} (r1='${R1}' r2='${R2}')" >&2
  if [[ -s "$TMP/e1" ]]; then echo "--- stderr r1 ---"; cat "$TMP/e1"; fi
  if [[ -s "$TMP/e2" ]]; then echo "--- stderr r2 ---"; cat "$TMP/e2"; fi
  exit 1
fi

# Assert balance = 0, never negative
FINAL_BAL=$(psql "$DB" -At -c "SELECT credits FROM profiles WHERE id = '${TEST_USER}'")
if [[ "$FINAL_BAL" != "0" ]]; then
  echo "CRED-03 FAIL: final balance expected 0, got ${FINAL_BAL}" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 4. Cleanup: remove test user's credit rows and recompute balance.
# ---------------------------------------------------------------------------
psql "$DB" -v ON_ERROR_STOP=1 <<SQL
DELETE FROM credit_events WHERE user_id = '${TEST_USER}';
SELECT update_profile_credits('${TEST_USER}');
SQL

echo "CRED-03 PASS: concurrent double-spend → 1 success, balance=0"
