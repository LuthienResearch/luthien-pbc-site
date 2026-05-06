#!/usr/bin/env bash
# List recent Dub links and their click counts.
#
# Usage:
#   DUB_API_KEY=... ./list.sh

set -euo pipefail

cd "$(dirname "$0")"

if [[ -z "${DUB_API_KEY:-}" && -f .env ]]; then
  set -a; source .env; set +a
fi

if [[ -z "${DUB_API_KEY:-}" ]]; then
  echo "error: DUB_API_KEY not set" >&2
  exit 2
fi

DOMAIN="${DUB_DOMAIN:-l.luthien.cc}"

curl -sS --fail-with-body \
  "https://api.dub.co/links?domain=${DOMAIN}&pageSize=100" \
  -H "Authorization: Bearer ${DUB_API_KEY}" \
  | python3 -c "
import json, sys
links = json.load(sys.stdin)
if not isinstance(links, list):
    print(json.dumps(links, indent=2))
    sys.exit(0)
print(f'{\"slug\":30s}  {\"clicks\":>6s}  {\"created\":<20s}  destination')
print('-' * 100)
for l in sorted(links, key=lambda x: x.get('clicks', 0), reverse=True):
    slug = l.get('key', '?')
    clicks = l.get('clicks', 0)
    created = (l.get('createdAt', '') or '')[:19].replace('T', ' ')
    dest = l.get('url', '')[:60]
    print(f'{slug:30s}  {clicks:>6d}  {created:<20s}  {dest}')
"
