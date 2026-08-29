#!/usr/bin/env bash
# Verify that the configured Seattle AI Safety Slack invitation is active and
# that its checked-in expiry matches Slack's public invite-page metadata.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$REPO_ROOT/site/slack/invite.json"
WARNING_DAYS="${SLACK_INVITE_WARNING_DAYS:-7}"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to parse $CONFIG" >&2
  exit 1
fi

invite_url=$(node -e 'const c=require(process.argv[1]); process.stdout.write(c.url)' "$CONFIG")
configured_expiry=$(node -e 'const c=require(process.argv[1]); process.stdout.write(String(Date.parse(c.expiresAt)/1000))' "$CONFIG")

case "$invite_url" in
  https://join.slack.com/t/seattleaisafety/shared_invite/*) ;;
  *)
    echo "Configured URL is not a Seattle AI Safety shared invitation" >&2
    exit 1
    ;;
esac

body=$(mktemp)
trap 'rm -f "$body"' EXIT

curl --fail --location --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 \
  --user-agent 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138 Safari/537.36' \
  "$invite_url" > "$body"

if ! grep -q 'Join Seattle AI Safety' "$body"; then
  echo "Slack did not return the Seattle AI Safety join page" >&2
  exit 1
fi

if ! grep -q 'isSharedInviteError&quot;:false' "$body"; then
  echo "Slack reports that the invitation is invalid" >&2
  exit 1
fi

live_expiry=$(grep -oE 'InviteExpirationTs(&quot;|")[^0-9]*[0-9]+' "$body" \
  | head -1 \
  | grep -oE '[0-9]+' \
  | tail -1)

if [[ -z "$live_expiry" ]]; then
  echo "Slack invite monitor could not parse Slack's expiry metadata" >&2
  exit 1
fi

if [[ "$configured_expiry" != "$live_expiry" ]]; then
  echo "Checked-in expiry ($configured_expiry) does not match Slack ($live_expiry)" >&2
  exit 1
fi

now=$(date -u +%s)
seconds_remaining=$((live_expiry - now))
warning_seconds=$((WARNING_DAYS * 86400))

if (( seconds_remaining <= 0 )); then
  echo "The Slack invitation has expired" >&2
  exit 1
fi

if (( seconds_remaining <= warning_seconds )); then
  echo "The Slack invitation expires within $WARNING_DAYS days" >&2
  exit 1
fi

days_remaining=$((seconds_remaining / 86400))
echo "Slack invitation is active with $days_remaining full days remaining"
