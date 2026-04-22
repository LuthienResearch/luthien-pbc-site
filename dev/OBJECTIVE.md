# Objective

File an RCA/COE for: `luthien.cc` is unreachable on some consumer ISPs (confirmed T-Mobile Home Internet; reproduced from at least one other residential network). SSL Labs grades the Cloudflare edge A, so the breakage is path-layer SNI-based middlebox interference, not a config bug. First-time visitors (investors, cold-email targets, LOI prospects) bounce silently with either `ERR_SSL_PROTOCOL_ERROR` or a T-Mobile "malware warning" interstitial.

No code fix in this PR. Remediation requires a human decision on the canonical Luthien domain (tracked in Trello: https://trello.com/c/XaSM8C8L).

Deliverables:
- `docs/coes/2026-04-22-luthien-cc-unreachable.md`
- `docs/coes/README.md` (new COE index for this repo)
- `dev/context/gotchas.md` update (TLD reputation gotcha)
- CHANGELOG entry
- 6 Trello cards for action items (see COE file for links)
