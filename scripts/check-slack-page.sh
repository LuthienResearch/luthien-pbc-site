#!/usr/bin/env bash
# Verify that the deployed /slack page serves the checked-in invitation config.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="${1:-https://luthien.cc}"
BASE_URL="${BASE_URL%/}"
LOCAL_CONFIG="$REPO_ROOT/site/slack/invite.json"

page=$(mktemp)
deployed_config=$(mktemp)
script=$(mktemp)
trap 'rm -f "$page" "$deployed_config" "$script"' EXIT

curl --fail --location --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 \
  "$BASE_URL/slack/" > "$page"
curl --fail --location --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 \
  "$BASE_URL/slack/invite.json" > "$deployed_config"
curl --fail --location --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 \
  "$BASE_URL/slack/slack.js" > "$script"

if ! grep -q '<h1>Seattle AI Safety Slack</h1>' "$page"; then
  echo "$BASE_URL/slack/ did not serve the expected page" >&2
  exit 1
fi

if ! grep -q 'joinLink.href = invite.url' "$script"; then
  echo "$BASE_URL/slack/slack.js did not serve the join-link logic" >&2
  exit 1
fi

if grep -q 'window.location.replace' "$script"; then
  echo "$BASE_URL/slack/slack.js still redirects visitors automatically" >&2
  exit 1
fi

node -e '
  const fs = require("node:fs");
  const expected = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const deployed = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  if (expected.url !== deployed.url || expected.expiresAt !== deployed.expiresAt || expected.updatedAt !== deployed.updatedAt) {
    console.error("The deployed Slack invitation config does not match the repository");
    process.exit(1);
  }
' "$LOCAL_CONFIG" "$deployed_config"

echo "$BASE_URL/slack/ serves the current invitation configuration"
