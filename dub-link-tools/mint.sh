#!/usr/bin/env bash
# Mint a Dub.co tracking link.
#
# Usage:
#   DUB_API_KEY=... ./mint.sh <slug> <destination-url>           # use default workspace + l.luthien.cc
#   DUB_API_KEY=... ./mint.sh anthropic-2026-05 https://luthien.cc/pitch
#
# The created link will be https://l.luthien.cc/<slug> and will 302 to the
# destination URL. Click analytics live in the Dub dashboard at app.dub.co.
#
# Prereqs (one-time):
#   1. Sign up at https://app.dub.co/register (use jai@luthienresearch.org).
#   2. Add l.luthien.cc as a custom domain (see README.md for DNS).
#   3. Generate an API key at https://app.dub.co/settings/tokens.
#      Set it as DUB_API_KEY in your shell or in dub-link-tools/.env.

set -euo pipefail

cd "$(dirname "$0")"

if [[ -z "${DUB_API_KEY:-}" && -f .env ]]; then
  set -a; source .env; set +a
fi

if [[ -z "${DUB_API_KEY:-}" ]]; then
  echo "error: DUB_API_KEY not set. Generate one at https://app.dub.co/settings/tokens" >&2
  exit 2
fi

DOMAIN="${DUB_DOMAIN:-l.luthien.cc}"

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <slug> <destination-url>" >&2
  echo "  e.g.  $0 anthropic-2026-05 https://luthien.cc/pitch" >&2
  exit 2
fi

SLUG="$1"
DEST="$2"

curl -sS --fail-with-body -X POST "https://api.dub.co/links" \
  -H "Authorization: Bearer ${DUB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json,sys; print(json.dumps({'url': sys.argv[1], 'domain': sys.argv[2], 'key': sys.argv[3]}))" "$DEST" "$DOMAIN" "$SLUG")" \
  | python3 -c "
import json, sys
r = json.load(sys.stdin)
print(f'  short:        {r.get(\"shortLink\")}')
print(f'  destination:  {r.get(\"url\")}')
print(f'  qrcode:       {r.get(\"qrCode\")}')
print(f'  dashboard:    https://app.dub.co/links/{r.get(\"id\", \"\")}')
"
