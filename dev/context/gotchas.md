# Gotchas

Non-obvious behaviors, edge cases, and things that are easy to get wrong.

**Format**: `## Topic (YYYY-MM-DD)` with bullet points.

---

## Image paths are relative to site/ root (2026-02-26)

Images live in `site/assets/images/` but HTML references them as `assets/images/filename.ext` (relative to the page). If you move a page into a subdirectory, image paths need updating.

---

## `.cc` TLD is ISP-reputation-flagged; customer reachability != founder reachability (2026-04-22)

`luthien.cc` is unreachable for some visitors on consumer ISPs (confirmed T-Mobile Home Internet; reproduced from at least one other residential network). Symptom is `ERR_SSL_PROTOCOL_ERROR` in Chrome or a T-Mobile "malware warning" interstitial on HTTP. SSL Labs grades the Cloudflare edge config as A, and other Cloudflare-fronted sites work on the same failing network, so the failure is SNI-based middlebox interference on the path, not a config bug on our end.

Cause: `.cc` (Cocos Islands ccTLD) is heavily abused by phishing/malware, so consumer ISPs reputation-block new/unknown `.cc` hostnames by default. Cloudflare's shared anycast IPs compound the problem via neighbor-IP reputation.

Debugging signal: if someone reports "luthien.cc doesn't load for me," reproduce from at least one non-founder residential network before assuming it's a client issue. Never trust "works on my machine" for reachability on this domain.

Full diagnosis + remediation options: `docs/coes/2026-04-22-luthien-cc-unreachable.md`.

---

## `/coe` and other named-process skills: execute every step, adapt the template (2026-04-22)

When invoking a numbered-process skill like `/coe`, `/commit`, or `/security-review`, do not degrade to chat output if the template doesn't cleanly fit the situation. The template itself says "if a section doesn't apply, write why it doesn't apply." That means adapt and proceed: create the PR if one doesn't exist yet, pick the right repo, write files, update registries. The correct failure mode is an adapted COE that notes what was adapted; the wrong failure mode is an inline chat response that the user has to catch and re-request.

Full rationale: `docs/coes/2026-04-22-coe-process-adherence.md`.

---

(Add gotchas as discovered with timestamps: YYYY-MM-DD)
