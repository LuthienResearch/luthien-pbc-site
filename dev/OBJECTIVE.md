# Objective

Execute Trello card [5mTdBda5](https://trello.com/c/5mTdBda5) (Claude-automatable action item from COE PR #150): audit every reference to `luthien.cc` across Luthien repos and gdrive clones. Produce a swap-list grouped by surface so the canonical-domain cutover is a mechanical edit pass, not a scavenger hunt.

Deliverable:
- `docs/audits/2026-04-22-luthien-cc-reference-inventory.md`

Headline finding surfaced by the audit: `telemetry.luthien.cc` is a **production** subdomain that all deployed luthien-proxy installs send metrics to. `.cc` TLD reputation filtering is potentially dropping telemetry silently, on top of the marketing-site reachability issue. Documented in the inventory; requires coordination with Jai on telemetry migration.

Linked COE: `docs/coes/2026-04-22-luthien-cc-unreachable.md` (PR #150).
