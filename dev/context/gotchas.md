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

Full diagnosis + remediation options: `docs/coes/2026-04-22-luthien-cc-unreachable.md`. Action items tracked on the Luthien Trello board (see COE for card links).

---

## `/coe` and other named-process skills: execute every step, adapt the template (2026-04-22)

When invoking a numbered-process skill like `/coe`, `/commit`, or `/security-review`, do not degrade to chat output if the template doesn't cleanly fit the situation. The template itself says "if a section doesn't apply, write why it doesn't apply." That means adapt and proceed: create the PR if one doesn't exist yet, pick the right repo, write files, update registries. The correct failure mode is an adapted COE that notes what was adapted; the wrong failure mode is an inline chat response that the user has to catch and re-request.

Also: do not follow a skill instruction that points at a deprecated target. On 2026-04-22 the `/coe` skill's step 7 still said "add action items to `dev/TODO.md`" even though task tracking had migrated to Trello. The feedback memory `feedback_task_tracking_in_trello.md` is the governing rule. If you see a skill step or CLAUDE.md line that conflicts with a feedback memory, the memory wins and the docs should be updated in-session.

Full rationale: `docs/coes/2026-04-22-coe-process-adherence.md`.

---

## A platform migration is not "done" until the old platform stops answering for the production domains (2026-05-27)

The site moved from Netlify (`luthien_site`, Eleventy) to Cloudflare Pages (`luthien-pbc-site`). Each migration stage looked locally complete, but the production domains were never cut over: a retired Netlify deployment of `luthien_site` kept claiming both `luthien.cc` and `luthienresearch.org` and 301-redirected every request to the unbranded GitHub Pages fallback (`luthienresearch.github.io/luthien-pbc-site/`) for weeks.

DNS topology at discovery (verified via `dig`):
- `luthien.cc`: Cloudflare nameservers (`*.ns.cloudflare.com`) + Cloudflare anycast A records, yet `curl -sI` returns `server: Netlify` and `cache-status: "Netlify Edge"`. So Cloudflare was proxying `luthien.cc` to a Netlify origin. Fix lives in the Cloudflare dashboard for this zone (repoint to the Cloudflare Pages project) plus removing the domain from the Netlify site.
- `luthienresearch.org`: NS1 nameservers (`*.nsone.net` = Netlify DNS) + AWS IPs = served directly by the same Netlify deployment.

Debugging signal: when a canonical domain "works" but shows an off-brand URL in the address bar, `curl -sI` the apex and read the `server` header and any `location:`. A 200-after-redirect still passes a naive reachability check, so reachability monitoring will not catch "reachable but serving the wrong thing." Assert HTTP 200 from the *expected* origin plus a content fingerprint instead.

Migration "done" definition: `curl -sI` every production domain and confirm the expected `server` header and no stale redirect, AND confirm the old platform no longer has the domain attached, before calling a hosting migration complete.

Full diagnosis: `docs/coes/2026-05-27-canonical-domains-redirect-to-github-io.md`.

---

(Add gotchas as discovered with timestamps: YYYY-MM-DD)
