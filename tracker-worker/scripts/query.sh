#!/usr/bin/env bash
# Query the luthien_tracker_hits Analytics Engine dataset.
#
# Usage:
#   CLOUDFLARE_API_TOKEN=... ./scripts/query.sh                 # default summary
#   CLOUDFLARE_API_TOKEN=... ./scripts/query.sh "SELECT ..."    # custom query
#
# Token needs scope: Account Analytics: Read
# Create at: https://dash.cloudflare.com/profile/api-tokens

set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-3b64ed6e5367ead1f221c01a17592b19}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "error: CLOUDFLARE_API_TOKEN not set" >&2
  echo "create one with 'Account Analytics: Read' at https://dash.cloudflare.com/profile/api-tokens" >&2
  exit 1
fi

DEFAULT_SQL="
SELECT
  blob1 AS ref,
  blob2 AS path,
  count() AS hits,
  min(timestamp) AS first_seen,
  max(timestamp) AS last_seen
FROM luthien_tracker_hits
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY blob1, blob2
ORDER BY hits DESC
FORMAT JSON
"

SQL="${1:-$DEFAULT_SQL}"

curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  --data "$SQL"
