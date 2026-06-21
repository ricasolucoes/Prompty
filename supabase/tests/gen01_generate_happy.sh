#!/usr/bin/env bash
# GEN-01: logged-in user with credits ≥1 generates → image returned, balance → 0.
# MANUAL-ASSISTED: requires `supabase start` + `supabase functions serve generate-image`
# and a valid user JWT exported as $USER_JWT (e.g. from a test signup).
set -euo pipefail
DB="${SUPABASE_DB_URL:-$DATABASE_URL}"
FUNC_URL="${FUNC_URL:-http://localhost:54321/functions/v1/generate-image}"
: "${USER_JWT:?export USER_JWT with a logged-in test user's access token}"
: "${PROMPTY_ID:?export PROMPTY_ID of an existing published prompty}"

echo "Pre-balance:"; psql "$DB" -t -A -c "SELECT credits FROM profiles WHERE id = (SELECT user_id FROM credit_events ORDER BY created_at DESC LIMIT 1);"

RESP=$(curl -sf -X POST "$FUNC_URL" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"prompty_id\":\"$PROMPTY_ID\",\"rendered_prompt\":\"a purple cat\"}")
echo "Response: $RESP"

echo "$RESP" | grep -q "signed_url" && echo "GEN-01 PASS: signed_url returned" || { echo "GEN-01 FAIL: no signed_url"; exit 1; }
# Operator asserts balance decremented by checking the profiles.credits delta against pre-balance above.
