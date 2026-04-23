# Objective

Execute Trello card [kHs0XHhn](https://trello.com/c/kHs0XHhn) (architectural Claude-automatable action item from COE PR #150): write a domain-selection checklist so the next domain we promote externally doesn't skip the TLD-reputation, WHOIS, reachability-probe, and email-deliverability checks that would have caught the luthien.cc problem before we shipped it.

Deliverable:
- `docs/process/domain-selection.md` — 6-step checklist with worked examples, plus a fast-path go/no-go table. Includes the newly-surfaced finding that `luthien.ai` (casually suggested as a canonical alternative in earlier drafts) is actually registered at Porkbun and redirects to atom.com's domain-sale marketplace — Luthien does NOT own it.

Linked COE: `docs/coes/2026-04-22-luthien-cc-unreachable.md` (PR #150).
Linked probe: `scripts/reachability-check.sh` (PR #153).
Linked audit: `docs/audits/2026-04-22-luthien-cc-reference-inventory.md` (PR #152).
