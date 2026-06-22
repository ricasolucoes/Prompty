#!/usr/bin/env bash
# GEN-04: provider failure (force-fail hook) → refund row in credit_events + balance restored.
# MANUAL-ASSISTED: requires local supabase + functions serve. Force-fail via the __FORCE_FAIL__ prompt.
set -euo pipefail
DB="${SUPABASE_DB_URL:-$DATABASE_URL}"
FUNC_URL="${FUNC_URL:-http://localhost:54321/functions/v1/generate-image}"
: "${USER_JWT:?export USER_JWT with a logged-in test user's access token}"
: "${PROMPTY_ID:?export PROMPTY_ID of an existing published prompty}"
: "${USER_ID:?export USER_ID of the same test user}"

REFUNDS_BEFORE=$(psql "$DB" -t -A -c "SELECT COUNT(*) FROM credit_events WHERE user_id='$USER_ID' AND event_type='refund';")

# Expect a non-2xx; capture status without aborting (no -f)
STATUS=$(curl -s -o /tmp/gen04_body.json -w "%{http_code}" -X POST "$FUNC_URL" \
  -H "Authorization: Bearer $USER_JWT" -H "Content-Type: application/json" \
  -d "{\"prompty_id\":\"$PROMPTY_ID\",\"rendered_prompt\":\"__FORCE_FAIL__\"}")
echo "Status: $STATUS"; cat /tmp/gen04_body.json

REFUNDS_AFTER=$(psql "$DB" -t -A -c "SELECT COUNT(*) FROM credit_events WHERE user_id='$USER_ID' AND event_type='refund';")
if [ "$REFUNDS_AFTER" -gt "$REFUNDS_BEFORE" ] && [ "$STATUS" != "200" ]; then
  echo "GEN-04 PASS: refund row added ($REFUNDS_BEFORE → $REFUNDS_AFTER) and non-200 returned"
else
  echo "GEN-04 FAIL: refunds $REFUNDS_BEFORE → $REFUNDS_AFTER, status $STATUS"; exit 1
fi
