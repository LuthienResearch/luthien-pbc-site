# COE: canonical domains 301-redirect to the unbranded github.io fallback

**Date:** 2026-05-27
**Author:** Scott (w/ Claude)
**Status:** Diagnosis complete; canonical-domain decision made (luthien.cc). Code stopgap in [luthien_site PR (netlify.toml)](https://github.com/LuthienResearch/luthien_site/pulls). Production fix requires a Cloudflare/Netlify dashboard cutover (runbook below); no code change can repoint the domain.

## Summary

Both public domains, `https://luthien.cc/` and `https://luthienresearch.org/`, currently 301-redirect every request to `https://luthienresearch.github.io/luthien-pbc-site/` — an unbranded GitHub Pages sub-path. The live site is healthy and is being served correctly on Cloudflare Pages (`https://luthien-pbc-site.pages.dev/` returns HTTP 200), but neither canonical domain points at it. A retired deployment of the old `luthien_site` repo (the original Eleventy site) still claims both domains on Netlify and bounces all traffic to the GitHub Pages fallback.

This is **platform-migration / config drift**, not a one-off typo: the site moved from Netlify (`luthien_site`) to Cloudflare Pages (`luthien-pbc-site`), and the production-domain cutover was never durably completed. Per Scott's "version drift ⇒ COE, wrong-URL ⇒ no COE" test, this is a COE.

## Repro Steps (before any fix)

```
$ curl -sI https://luthien.cc/
HTTP/2 301
location: https://luthienresearch.github.io/luthien-pbc-site/
server: Netlify
cache-status: "Netlify Edge"; hit

$ curl -sI https://luthienresearch.org/
HTTP/2 301
location: https://luthienresearch.github.io/luthien-pbc-site/
server: Netlify
```

Controls (the live site is fine; only the domain attachment is wrong):

```
$ curl -sI https://luthien-pbc-site.pages.dev/
HTTP/2 200
server: cloudflare

$ curl -sI https://luthienresearch.github.io/luthien-pbc-site/
HTTP/2 200
server: GitHub.com
```

## RCA/COE

### Bug: the canonical public domains serve a 301 to an unbranded, off-brand fallback URL instead of the live site

**Impact.** Anyone arriving at `luthien.cc` or `luthienresearch.org` — the links on the pitch deck, in cold emails, on LinkedIn — is bounced to `luthienresearch.github.io/luthien-pbc-site/`. The address bar shows a GitHub user-pages URL with a repo name in the path, which reads as unfinished and unprofessional to an investor or LOI prospect, and is the kind of URL no one would deliberately share. The symptom surfaced in internal Slack on 2026-05-20: Jennifer Baik asked "what is the good luthien link for public besides `https://luthienresearch.org/`? or does this one work" — i.e. people on the team no longer knew which public link was safe to share, because the obvious ones bounce.

Severity is reputational, not availability: the site loads (after the redirect), but the first impression is wrong, and the redirect destination cannot be cleanly shared.

**Timeline.**

| Date | Event |
|------|-------|
| 2025 (pre-migration) | `luthien_site` (Eleventy) is the live site on Netlify, serving `luthien.cc`. |
| 2026-02-26 | `luthien-pbc-site` repo created (CHANGELOG v10: "Initial repo migration from scottwofford.com/luthien/landing_v8/"). |
| 2026-03-19 | `luthien_site/netlify.toml` gets a catch-all `/* → https://luthienresearch.github.io/luthien-pbc-site/ 301` (commit `de96792`, "redirect all traffic to luthien-pbc-site on GitHub Pages"). Cloudflare Pages was not set up yet, so GitHub Pages was the only live URL for the new site. This was a reasonable stopgap *at the time*. |
| 2026-03-21 | Carve-outs added so the old site's `/about` and `/updates/*` pages survive the catch-all (commits `d0fa453`, `875146e`). |
| ~2026-04 | Cloudflare Pages stood up for `luthien-pbc-site`; `deploy.yml` makes Cloudflare the primary deploy target ("Cloudflare Pages (luthien.cc)"); `/pitch.pdf`, `/toc`, `/story` shipped via Cloudflare `_redirects`. `luthien.cc` is serving from Cloudflare at this point. |
| 2026-04-22 | [luthien.cc reachability COE](./2026-04-22-luthien-cc-unreachable.md) filed (`.cc` TLD reputation / ISP SNI filtering). Confirms `luthien.cc` was on Cloudflare (SSL Labs scanned the Cloudflare edge). Canonical-domain decision left open, due 2026-04-29. |
| unknown (after 2026-04-22, by 2026-05-20) | `luthien.cc` stops serving from Cloudflare and reverts to the stale Netlify `luthien_site` deployment, which 301s it (and `luthienresearch.org`) to the GitHub Pages fallback. The Cloudflare-Pages-as-canonical state was never durably locked in: the Netlify custom-domain attachment was never removed, so a DNS change (or Netlify reasserting the domain) put the stale redirect back in the path. Exact cause is in the Cloudflare + Netlify dashboards, not in git. |
| 2026-05-20 | Jennifer Baik flags the confusion in Slack. |
| 2026-05-27 | Scott reports the redirect; this COE filed; canonical domain decided: **luthien.cc**. |

Window of exposure: bounded below by "at least one week" (Slack 2026-05-20 → 2026-05-27), plausibly weeks. Anyone who saw the github.io URL and quietly distrusted it is invisible to us.

**5 Whys.**

1. Why do `luthien.cc` and `luthienresearch.org` redirect to github.io? → A retired Netlify deployment of `luthien_site` still claims both domains and its `netlify.toml` has a catch-all `/* → github.io 301`.
2. Why is the retired deployment still in the serving path? → The platform migration from Netlify to Cloudflare Pages was never finished: the Netlify site's custom-domain attachments for both domains were never removed, and DNS was never durably pointed at the Cloudflare Pages project (or was pointed back).
3. Why was the cutover left half-done? → The migration happened in stages over weeks (Mar: content moves, github.io stopgap; Apr: Cloudflare Pages stands up). There was no single checklist that said "the migration is not done until the old platform no longer answers for the production domains." Each stage looked locally complete.
4. Why didn't anyone notice the canonical domain was serving a 301-to-fallback? → The reachability monitor shipped from the April COE (action item #158) checks whether the domain *resolves and answers*, which it does — a 301 to a reachable github.io still passes a reachability check. Reachability monitoring is not correctness monitoring. Nothing asserted "the canonical domain returns 200 and serves our own content," so the regression was silent until a human eyeballed the address bar.
5. Why is there no "is the production domain serving the right thing" check? → Public-domain serving state lives across three dashboards (registrar/DNS, Netlify, Cloudflare Pages) with no single source of truth and no automated assertion tying "domain X should serve content from project Y." The first signal of drift is a person noticing an off-brand URL.

**Systemic root.** There is no single source of truth for *which platform serves each production domain*, and no monitor that asserts the canonical domain returns our own content (HTTP 200 from the expected origin) rather than merely being reachable. A multi-stage platform migration can therefore leave a stale deployment in the path indefinitely, and the only detector is a human noticing.

### Why it wasn't caught

- The April reachability monitor tests reachability, not correctness: a 301 to a reachable fallback passes. (Detection gap.)
- The migration had no "done" definition that included "old platform no longer answers for the production domains." (Process gap.)
- Founder browsing habits hid it: anyone who typed the URL and waited through the redirect saw the right content eventually, so the redirect itself never registered as broken until someone needed to *share* a clean link.

### Why it won't recur

- **Correctness check, not just reachability:** extend the synthetic monitor (April COE #158) to assert that each canonical domain returns HTTP 200 from the expected origin and serves a known content fingerprint (e.g. a string only present on the live site), and to alert on any 3xx whose `Location` leaves the canonical host. This catches "reachable but wrong."
- **Migration "done" definition:** a platform migration is not complete until the old platform returns no answer (or an intended redirect) for every production domain, verified by `curl -sI` against each domain showing the expected `server` header. Captured as a gotcha in `dev/context/gotchas.md`.
- **Single source of truth for domain → platform:** record, in this repo, which platform is authoritative for each production domain, so drift is auditable against a written expectation rather than reconstructed from three dashboards.

## Decision record

**Canonical public domain: `luthien.cc`** (Scott, 2026-05-27). `luthienresearch.org` 301-redirects to `luthien.cc`. This resolves the canonical-domain action item left open by the [April reachability COE](./2026-04-22-luthien-cc-unreachable.md) (was due 2026-04-29).

Knowingly-accepted risk: the April COE documented that `luthien.cc` is filtered at the TLS/SNI layer by some consumer ISPs (T-Mobile Home Internet confirmed) because `.cc` is a high-abuse TLD on shared Cloudflare IPs. Choosing `luthien.cc` as canonical re-accepts that exposure. Mitigation: run the reachability probe (`scripts/reachability-check.sh luthien.cc`) immediately after cutover and on a schedule; `luthienresearch.org` remains a live, unfiltered alias for anyone who can't reach `.cc`.

## Remediation runbook (production fix — dashboard, not code)

No code change can repoint a domain. The fix is a sequenced cutover. **Order matters: step 4 (the netlify.toml PR) must not deploy before steps 1-3, or `luthien.cc` will redirect-loop.**

0. **Untangle current attachment.** In both the Cloudflare Pages dashboard (project `luthien-pbc-site`) and the Netlify dashboard (`luthien_site` site), inspect which custom domains each claims. Note: `luthien.cc` currently resolves to Cloudflare anycast IPs yet is served by Netlify (`server: Netlify`, no `cf-ray`) — a split-brain that means the domain is likely attached on both platforms with Netlify winning. Confirm before changing.
1. **Cloudflare Pages:** add `luthien.cc` as a custom domain on the `luthien-pbc-site` project; let Cloudflare provision the cert.
2. **DNS:** point `luthien.cc` at the Cloudflare Pages project (per Cloudflare's custom-domain instructions).
3. **Netlify:** remove `luthien.cc` (and, if not needed for the org redirect, `luthienresearch.org`) from the `luthien_site` site's custom domains so Netlify stops answering for `luthien.cc`.
4. **`luthienresearch.org` → `luthien.cc` 301:** merge the [luthien_site netlify.toml PR](https://github.com/LuthienResearch/luthien_site/pulls) (catch-all retargeted github.io → `https://luthien.cc/`). This is safe only after `luthien.cc` has left the Netlify site (step 3); otherwise `luthien.cc` 301s to itself on the same Netlify site and loops. Alternatively, implement the org→luthien.cc 301 at the Cloudflare/DNS layer and retire the Netlify site entirely.
5. **Verify:** `curl -sI https://luthien.cc/` returns 200 from Cloudflare; `curl -sI https://luthienresearch.org/` returns 301 → `https://luthien.cc/`; `scripts/reachability-check.sh luthien.cc` runs.

## Action items

Tracked as Trello cards on the Luthien board (source of truth for tasks). This COE document is the record; it is not itself a "delivering PR" below.

| Action item | Delivering PR / artifact | Success criteria | Type | Owner |
|-------------|--------------------------|------------------|------|-------|
| Retarget `luthien_site` catch-all redirect github.io → `luthien.cc` | luthien_site netlify.toml PR | PR merges *after* DNS cutover; `curl -sI https://luthienresearch.org/` → 301 → `https://luthien.cc/` | Point fix | Claude |
| Cloudflare/Netlify/DNS cutover (steps 1-3, 5 above) | dashboard change | `curl -sI https://luthien.cc/` → 200 from Cloudflare | Architectural | Scott / Jai (dashboard access) |
| Upgrade synthetic monitor: assert 200-from-expected-origin + content fingerprint, alert on canonical-host-leaving 3xx | follow-up PR to the monitor workflow | Monitor fails on a 301-to-github.io even though it is reachable | Detection | Claude |
| Record domain → authoritative-platform mapping in-repo; add migration-"done" gotcha | follow-up PR (`dev/context/gotchas.md`) | A written expectation exists to audit drift against | Architectural | Claude |
| Migrate or redirect orphaned old content: `luthienresearch.org/updates/2025-03-redteam-as-upsampling` (7KB post, not on new site) and `/about`; 301 `/updates/2025-03-controlconf` → `/blog/controlconf-london-2025` (already migrated) | follow-up PR | Old deep links resolve to live content, not a 404, after the carve-outs are removed | Point fix | Scott decision + Claude |

## Remaining risk

- External artifacts already in the wild that link to `luthienresearch.github.io/luthien-pbc-site/` directly (if any were shared during the drift window) will not benefit from the canonical-domain fix.
- The accepted `.cc` ISP-filtering risk (April COE) persists for `luthien.cc` as canonical; `luthienresearch.org` is the fallback for filtered users, but only as a redirect — it does not itself serve content, so a filtered user who lands on the `luthien.cc` redirect target is still stuck. Worth revisiting if the reachability probe shows material filtering post-cutover.
- The orphaned `/about` and `/updates` content on `luthienresearch.org` is >1 year old; until migrated or redirected, the carve-outs keep stale content live on a domain that otherwise redirects to the current site.

## Relationship to the April 2026 reachability COE

This is a distinct incident with a distinct root cause. The [April COE](./2026-04-22-luthien-cc-unreachable.md) was about `luthien.cc` being *unreachable* on some networks (`.cc` TLD reputation). This COE is about the canonical domains *serving the wrong thing* (an unfinished platform-migration cutover). They intersect only in that this COE's canonical-domain decision (luthien.cc) closes the April COE's open "decide canonical domain" item — while knowingly re-accepting the reachability risk that item was meant to weigh.
