# Objective

Execute Trello card [7oZ6W99d](https://trello.com/c/7oZ6W99d) (Claude-automatable, architectural-class action item from COE PR #150): add a reachability probe script that verifies a domain actually reaches visitors on diverse real paths before we promote it externally.

Deliverable:
- `scripts/reachability-check.sh` — bash script that hits a domain from (1) the local machine as baseline, (2) check-host.net distributed probes (~5 geographic nodes), (3) optionally SSL Labs (`--full` mode) for server-side TLS verification.

Tested against `luthien.cc`: correctly surfaces the exact pattern from the COE (local FAIL + distributed OK = middlebox SNI filtering on the client's ISP, not a server-side config bug). Script exits 1 on any failure and includes interpretation hints for the output.

Prior incidents this prevents: luthien-proxy #122 (Railway env vars), #134 (streaming thinking blocks), luthien-pbc-site #150 (luthien.cc reachability) — all three share the "it works for founders, silently fails for users" meta-pattern.

Linked COE: `docs/coes/2026-04-22-luthien-cc-unreachable.md` (PR #150).
