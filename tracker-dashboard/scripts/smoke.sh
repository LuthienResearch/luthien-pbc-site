#!/usr/bin/env bash
# Post-deploy smoke test for tracker-dashboard.
#
# Hits both API endpoints on the live worker and asserts they return 200 with
# parseable JSON. AE has no offline SQL parser, so this is the closest we can
# get to a "lint" — running each query shape against the real dataset. Catches
# unsupported functions, alias collisions, and AE schema drift before they
# silently break the dashboard UI.
#
# Usage:
#   DASH_USER=... DASH_PASS=... ./scripts/smoke.sh
#
# Or set DASH_URL to test a non-default endpoint:
#   DASH_URL=https://luthien.cc/_t DASH_USER=... DASH_PASS=... ./scripts/smoke.sh

set -euo pipefail

DASH_URL="${DASH_URL:-https://luthien.cc/_t}"

if [[ -z "${DASH_USER:-}" || -z "${DASH_PASS:-}" ]]; then
  if [[ -f .dev.vars ]]; then
    # shellcheck disable=SC1091
    set -a; source .dev.vars; set +a
  fi
fi

if [[ -z "${DASH_USER:-}" || -z "${DASH_PASS:-}" ]]; then
  echo "error: DASH_USER and DASH_PASS must be set (env or .dev.vars)" >&2
  exit 2
fi

fail=0

probe() {
  local name="$1"
  local path="$2"
  local resp http body
  resp=$(curl -sS -u "${DASH_USER}:${DASH_PASS}" -w '\n%{http_code}' "${DASH_URL}${path}")
  http="${resp##*$'\n'}"
  body="${resp%$'\n'*}"

  if [[ "$http" != "200" ]]; then
    echo "FAIL  ${name}  (HTTP ${http})"
    echo "      body: ${body}" | head -c 400
    echo
    fail=1
    return
  fi

  if ! echo "$body" | python3 -c "import json,sys; json.load(sys.stdin)" >/dev/null 2>&1; then
    echo "FAIL  ${name}  (invalid JSON)"
    echo "      body: ${body}" | head -c 400
    echo
    fail=1
    return
  fi

  local rows
  rows=$(echo "$body" | python3 -c "import json,sys; print(json.load(sys.stdin).get('rows', '?'))")
  echo "ok    ${name}  rows=${rows}"
}

echo "smoke ${DASH_URL}"
probe "summary 30d        " "/api/hits?days=30"
probe "summary 1d         " "/api/hits?days=1"
probe "summary 365d       " "/api/hits?days=365"
probe "summary clamp hi   " "/api/hits?days=99999"
probe "summary clamp bad  " "/api/hits?days=garbage"

# Drill-down — pick the top ref from the summary so we exercise a real value.
TOP_REF=$(curl -sS -u "${DASH_USER}:${DASH_PASS}" "${DASH_URL}/api/hits?days=30" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['ref'] if d.get('data') else '')")

if [[ -n "$TOP_REF" ]]; then
  probe "drill ${TOP_REF}" "/api/hits?days=30&ref=$(printf %s "$TOP_REF" | python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read()))')"
else
  echo "skip  drill-down (no refs in dataset yet)"
fi

probe "drill nonexistent  " "/api/hits?days=30&ref=__smoke_nonexistent__"

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "smoke FAILED"
  exit 1
fi

echo
echo "smoke OK"
