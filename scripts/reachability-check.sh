#!/usr/bin/env bash
# Reachability probe for Luthien customer-facing domains.
#
# Purpose: before promoting a new domain externally (pitch deck, cold email,
# LOI), verify it actually reaches visitors on diverse real paths. Prior
# incidents (luthien.cc reachability, see docs/coes/2026-04-22-luthien-cc-unreachable.md)
# show that "it resolves from my laptop" is not a reliable signal — ISP
# middleboxes can SNI-filter, TLS-interfere, or inject malware interstitials
# in ways that are invisible from the developer's home network.
#
# This script hits the given domain from:
#   1. The local machine (baseline)
#   2. check-host.net free public API (probes from ~5 geographic nodes)
#   3. SSL Labs API (to confirm server-side TLS config is healthy when
#      client-side failures happen)
#
# Usage:
#   scripts/reachability-check.sh <domain> [--quick|--full]
#
# Examples:
#   scripts/reachability-check.sh luthien.cc
#   scripts/reachability-check.sh luthien.ai --quick
#
# Modes:
#   --quick (default): local curl + check-host.net (~30 seconds)
#   --full: adds SSL Labs scan (up to 2-3 minutes)
#
# Exit codes:
#   0  all probes succeeded
#   1  one or more probes failed (network filtering suspected)
#   2  script-level error (invalid args, dependency missing, etc.)

set -euo pipefail

DOMAIN="${1:-}"
MODE="${2:---quick}"

if [[ -z "$DOMAIN" ]]; then
    cat >&2 <<'EOF'
Usage: reachability-check.sh <domain> [--quick|--full]

Runs a reachability probe against <domain> from multiple network paths.
See the header of this script for details.
EOF
    exit 2
fi

# Strip protocol if user included it
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"

# Color helpers (only if stdout is a TTY)
if [[ -t 1 ]]; then
    red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }
    green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
    yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
    bold()   { printf '\033[1m%s\033[0m\n' "$*"; }
else
    red()    { printf '%s\n' "$*"; }
    green()  { printf '%s\n' "$*"; }
    yellow() { printf '%s\n' "$*"; }
    bold()   { printf '%s\n' "$*"; }
fi

FAILED=0
record_fail() { red "  FAIL: $*"; FAILED=$((FAILED + 1)); }
record_pass() { green "  OK:   $*"; }
record_warn() { yellow "  WARN: $*"; }

for dep in curl jq; do
    if ! command -v "$dep" >/dev/null 2>&1; then
        red "Missing dependency: $dep"
        exit 2
    fi
done

bold "Reachability probe for $DOMAIN (mode: $MODE)"
printf '\n'

# ----------------------------------------------------------------------------
# Probe 1: local machine baseline
# ----------------------------------------------------------------------------
bold "[1/3] Local machine baseline"

https_result=$(curl -so /dev/null -w '%{http_code}|%{time_total}|%{errormsg}' \
    -m 10 "https://$DOMAIN" 2>&1 || true)
https_code="${https_result%%|*}"
https_rest="${https_result#*|}"
https_time="${https_rest%%|*}"
https_err="${https_rest#*|}"

if [[ "$https_code" =~ ^[23] ]]; then
    record_pass "https://$DOMAIN → HTTP $https_code (${https_time}s)"
elif [[ "$https_code" == "000" ]]; then
    record_fail "https://$DOMAIN → connection/TLS error: $https_err"
else
    record_warn "https://$DOMAIN → HTTP $https_code (unexpected status)"
fi

http_result=$(curl -so /dev/null -w '%{http_code}|%{redirect_url}' \
    -m 10 "http://$DOMAIN" 2>&1 || true)
http_code="${http_result%%|*}"
http_redirect="${http_result#*|}"

if [[ "$http_code" =~ ^3 ]]; then
    if [[ "$http_redirect" == *"t-mobile.com"* ]] || \
       [[ "$http_redirect" == *"http-warning"* ]] || \
       [[ "$http_redirect" == *"malware"* ]]; then
        record_fail "http://$DOMAIN → ISP URL-filter redirect: $http_redirect"
    else
        record_pass "http://$DOMAIN → $http_code → $http_redirect"
    fi
elif [[ "$http_code" =~ ^[2] ]]; then
    record_pass "http://$DOMAIN → HTTP $http_code"
elif [[ "$http_code" == "000" ]]; then
    record_fail "http://$DOMAIN → connection error"
else
    record_warn "http://$DOMAIN → HTTP $http_code"
fi

printf '\n'

# ----------------------------------------------------------------------------
# Probe 2: check-host.net distributed probes
# ----------------------------------------------------------------------------
bold "[2/3] check-host.net distributed probes (~5 geographic nodes)"

ch_submit=$(curl -s -m 10 -H 'Accept: application/json' \
    "https://check-host.net/check-http?host=https://$DOMAIN&max_nodes=5" || true)

if [[ -z "$ch_submit" ]]; then
    record_warn "check-host.net submission failed; skipping distributed probes"
else
    request_id=$(echo "$ch_submit" | jq -r '.request_id // empty')
    if [[ -z "$request_id" ]]; then
        record_warn "check-host.net did not return a request_id; skipping"
        echo "$ch_submit" | head -c 200
        printf '\n'
    else
        # Poll for results
        node_count=$(echo "$ch_submit" | jq -r '.nodes | length // 0')
        echo "  submitted (request_id=$request_id, nodes=$node_count), polling..."
        for attempt in 1 2 3 4 5 6 7 8; do
            sleep 3
            results=$(curl -s -m 10 -H 'Accept: application/json' \
                "https://check-host.net/check-result/$request_id" || true)
            if [[ -z "$results" ]] || [[ "$results" == "null" ]]; then
                continue
            fi
            # Count completed nodes (non-null entries)
            completed=$(echo "$results" | jq '[.[] | select(. != null)] | length')
            if [[ "$completed" -ge "$node_count" ]]; then
                break
            fi
        done

        if [[ -z "${results:-}" ]] || [[ "$results" == "null" ]]; then
            record_warn "check-host.net returned no results after ${attempt} polls"
        else
            # Each node's result is an array; first element is typically [time, http_code, ...]
            # Iterate nodes and report per-node pass/fail
            # check-host.net response per node: array of attempts; each attempt is
            # [status(1/0), time, message("OK"|"Moved Temporarily"|error), http_code_str, ip]
            # jq script outputs one line per node: "node|status|time|message|http_code"
            parsed=$(echo "$results" | jq -r '
                to_entries[] |
                if .value == null then
                    "\(.key)|TIMEOUT|||"
                else
                    .value[0] as $r |
                    if $r == null then
                        "\(.key)|EMPTY|||"
                    else
                        "\(.key)|\($r[0])|\($r[1])|\($r[2] // "")|\($r[3] // "")"
                    end
                end
            ')
            while IFS='|' read -r node status time_s message http_code; do
                case "$status" in
                    TIMEOUT) yellow "    $node → (timed out)" ;;
                    EMPTY)   yellow "    $node → (empty result)" ;;
                    1)
                        if [[ "$http_code" =~ ^[23] ]]; then
                            green "    $node → HTTP $http_code (${time_s}s, $message)"
                        else
                            record_fail "$node → HTTP $http_code ($message)"
                        fi
                        ;;
                    0)       record_fail "$node → $message" ;;
                    *)       yellow "    $node → unknown status '$status'" ;;
                esac
            done <<< "$parsed"
        fi
    fi
fi

printf '\n'

# ----------------------------------------------------------------------------
# Probe 3: SSL Labs (full mode only — slow)
# ----------------------------------------------------------------------------
if [[ "$MODE" == "--full" ]]; then
    bold "[3/3] SSL Labs scan (2-3 minutes)"
    echo "  kicking off scan…"

    # Kick off
    curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&startNew=on&all=done" \
        >/dev/null || true

    # Poll until READY
    for attempt in $(seq 1 30); do
        sleep 10
        ssl_result=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&all=done" || true)
        status=$(echo "$ssl_result" | jq -r '.status // empty')
        if [[ "$status" == "READY" ]]; then
            break
        elif [[ "$status" == "ERROR" ]]; then
            record_fail "SSL Labs scan error"
            break
        fi
        printf '  …polling (attempt %s, status=%s)\n' "$attempt" "$status"
    done

    if [[ "${status:-}" == "READY" ]]; then
        grades=$(echo "$ssl_result" | jq -r '.endpoints[] | "\(.ipAddress) \(.grade // "?")"')
        while IFS= read -r line; do
            ip="${line%% *}"
            grade="${line#* }"
            if [[ "$grade" == "A"* ]]; then
                record_pass "SSL Labs $ip → grade $grade"
            elif [[ -n "$grade" ]] && [[ "$grade" != "?" ]]; then
                record_warn "SSL Labs $ip → grade $grade"
            else
                record_warn "SSL Labs $ip → no grade"
            fi
        done <<< "$grades"
    fi
else
    echo "[3/3] SSL Labs scan: skipped (run with --full to include)"
fi

printf '\n'

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
if [[ "$FAILED" -eq 0 ]]; then
    green "Reachability probe PASSED for $DOMAIN"
    exit 0
else
    red "Reachability probe FAILED for $DOMAIN ($FAILED failures)"
    echo ""
    echo "Interpretation hints:"
    echo "  - Local-baseline FAIL only: a network path on YOUR ISP is interfering."
    echo "    Try from mobile tether or a VPN exit to confirm."
    echo "  - Distributed-probe FAIL only: reachable from your ISP but not from others."
    echo "    Strong signal of IP-range reputation or TLD reputation filtering."
    echo "  - Mixed FAIL: multiple ISPs filtering; likely TLD reputation issue."
    echo "  - SSL Labs grade A but clients can't connect: middlebox interference."
    echo "    Not a CF/server config issue; path-layer filtering."
    echo ""
    echo "See docs/coes/2026-04-22-luthien-cc-unreachable.md for a worked example."
    exit 1
fi
