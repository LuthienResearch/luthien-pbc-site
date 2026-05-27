# COE: canonical domains 301-redirect to the github.io fallback

**Date:** 2026-05-27
**Author:** Scott (w/ Claude)
**Status:** Diagnosis partial (see Evidence caveat). Code stopgap in [luthien_site PR #4](https://github.com/LuthienResearch/luthien_site/pull/4) (gated). Production fix is a Cloudflare/Netlify dashboard cutover; no code can repoint a domain.

## Summary

`luthienresearch.org` 301-redirects every request to `https://luthienresearch.github.io/luthien-pbc-site/`, an unbranded GitHub Pages sub-path, served by a retired Netlify deployment of the old `luthien_site` repo. `luthien.cc` was observed doing the same once this session. The live site is healthy on Cloudflare Pages (`luthien-pbc-site.pages.dev` returns 200); the canonical domains were never cut over to serve it. Surfaced when Jennifer Baik asked in Slack (2026-05-20) which public link was safe to share.

## Evidence caveat

This diagnosis was run from a T-Mobile network, which the [April reachability COE](./2026-04-22-luthien-cc-unreachable.md) documents as filtering `.cc` at the TLS/SNI layer. `luthienresearch.org` results are reliable (reproduced repeatedly). `luthien.cc` results are not: it returned a clean `301 server: Netlify` at 11:30 PDT, then was TLS-blocked (T-Mobile interstitial) at 14:35 PDT. **Confirm `luthien.cc`'s current serving state from a non-T-Mobile network before the dashboard cutover.** There is no primary evidence that `luthien.cc` ever served HTTP 200 from Cloudflare Pages, so this COE does not claim it "reverted"; the accurate framing is that the cutover was never completed or verified.

## Repro Steps

No code commit to check out; the broken state lives in DNS + Netlify/Cloudflare config.

```
$ curl -sI https://luthienresearch.org/          # reliable, reproduced repeatedly
HTTP/2 301
location: https://luthienresearch.github.io/luthien-pbc-site/
server: Netlify

$ curl -sI https://luthien.cc/                    # 11:30 PDT, the one time TLS was not filtered
HTTP/2 301
location: https://luthienresearch.github.io/luthien-pbc-site/
server: Netlify
x-nf-request-id: 01KSNB7KQ1SSTFNTGAA4CZ174Q
```

Control (live site is healthy; only the domain attachment is wrong):

```
$ curl -sI https://luthien-pbc-site.pages.dev/    # HTTP/2 200, server: cloudflare
```

## RCA/COE

### Bug: the canonical public domains 301 visitors to an unbranded github.io sub-path instead of serving the live site

**Impact.** First-time visitors arriving from the pitch deck, cold emails, and LinkedIn land on a URL that reads as unfinished and cannot be cleanly shared. Severity is reputational, not availability (the site loads after the redirect). Blast radius is the entire external audience, which is also the highest-stakes audience (investors, LOI prospects).

**Timeline.**

| Date | Event |
|------|-------|
| 2026-02-26 | `luthien-pbc-site` repo created (the new site). |
| 2026-03-19 | `luthien_site/netlify.toml` catch-all set to `/* -> https://luthienresearch.github.io/luthien-pbc-site/ 301` (commit `de96792`), a stopgap before Cloudflare Pages existed. Unchanged since. |
| ~2026-04 | Cloudflare Pages stood up for `luthien-pbc-site`; `deploy.yml` intends it as primary for `luthien.cc`. Whether `luthien.cc` ever served from it is unverified. |
| 2026-04-22 | April reachability COE: `.cc` filtered by some consumer ISPs. |
| 2026-05-20 | Symptom flagged in Slack. |
| 2026-05-27 | Reported; this COE; canonical domain decided: `luthien.cc`. |

**5 Whys.**

1. Why do the canonical domains redirect to github.io? The retired `luthien_site` Netlify deployment still claims the domain(s) and its `netlify.toml` has a catch-all to github.io.
2. Why is it still claiming them? The platform migration (Netlify -> Cloudflare Pages) never finished cutting the canonical domains over; the Netlify attachments were never removed.
3. Why was it left unfinished? The March redirect was a stopgap; no step ever removed it after Cloudflare Pages went live, and no checklist defined "migration done = the old platform stops answering for the production domains."
4. Why was it not noticed for weeks? The April reachability monitor checks reachability, not correctness. A reachable 301 to github.io passes it.
5. Why is there no correctness check? Domain-to-platform serving state spans three dashboards (DNS, Netlify, Cloudflare Pages) with no single source of truth and no assertion that a domain serves the expected origin.

**Root cause:** an incomplete platform-migration cutover (a March stopgap redirect never removed after the new host went live), compounded by no monitor that asserts a canonical domain serves the expected content rather than merely being reachable.

### The Pattern

Recurring class: infra silently in a wrong or degraded state, no correctness monitor, found by a human.

| PR / COE | Date | What went wrong | How discovered |
|----------|------|-----------------|----------------|
| [April reachability COE](./2026-04-22-luthien-cc-unreachable.md) | 2026-04-22 | `luthien.cc` unreachable on some ISPs; no monitor | Founder bounced off it |
| [claude-ai-sync silent-rot](https://github.com/scottwofford/private-claude-code-docs/blob/main/coes/COE-2026-05-07-claude-ai-sync-silent-rot.md) | 2026-05-07 | Sync failed ~3-4 days; no monitor on exit code | Human noticed missing data |
| [drive-sync #2](https://github.com/scottwofford/drive-sync/pull/2) | 2026 | Silent file downgrade; no monitor | Human noticed |
| This COE | 2026-05-27 | Canonical domains serve a 301 to github.io | Human noticed the URL in Slack |

The April reachability monitor exists and passed this broken state, because a reachable 301 satisfies a reachability check. The class-level fix is a correctness monitor (below), not another point fix.

### Detection gap

1. How it was found: a human (Jennifer Baik) noticed the off-brand URL while looking for a clean public link to share.
2. How it should have been found: a monitor asserting each canonical domain returns 200 from the expected origin plus a known content fingerprint, alerting on any redirect that leaves the canonical host. Not yet built.

### What else could break? (sweep)

Grepped both site repos for stale redirects, version-pinned paths, and github.io destinations. Found only: the repo-root `index.html` meta-refresh to `site/v10.9.1/` (not served, since the deploy root is `site/`; already being removed on Scott's parallel branch) and a stale `site/v12/...` path in a CSS comment. The two `github.io` hits in served content are legitimate external links. Redirect configs are `luthien_site/netlify.toml` (the bug) and `site/_redirects` (`/toc`, `/story`, both correct). No additional user-facing stale redirects.

### Incident Detail (evidence)

DNS at discovery (via `dig`): `luthien.cc` is on Cloudflare nameservers (`*.ns.cloudflare.com`) with Cloudflare anycast A records, yet its response (when reachable) carries `server: Netlify` and `x-nf-request-id`, so Cloudflare is fronting it and forwarding to a Netlify origin; the exact mechanism (Worker forward vs proxy) is unconfirmed and should be read off the Cloudflare dashboard. `luthienresearch.org` is on NS1 nameservers (Netlify DNS) pointing at Netlify's AWS load balancer. The redirect itself is the `/* -> github.io 301` catch-all in `luthien_site/netlify.toml`.

### Fixes Applied

| Issue | Fix | Location |
|-------|-----|----------|
| Old Netlify site 301s the canonical domain(s) to github.io | Stopgap: retarget the catch-all github.io -> `luthien.cc` (gated; merge only after the cutover, or it self-redirect-loops) | `luthien_site/netlify.toml` ([PR #4](https://github.com/LuthienResearch/luthien_site/pull/4)) |
| No durable record of the incident | This COE + index entry | `docs/coes/2026-05-27-canonical-domains-redirect-to-github-io.md`, `docs/coes/README.md` |
| Root cause non-obvious (reachable but wrong) | Gotcha: dig/curl signal + migration-"done" definition | `dev/context/gotchas.md` |

### Action items

These live in this doc, not Trello: a Trello card needs a real owner and a due date, and none of these has a firm due date yet.

1. **Check what `luthien.cc` actually does for a normal visitor, before changing anything.** This whole diagnosis ran from a T-Mobile connection, which blocks `.cc` domains, so we do not actually know whether `luthien.cc` is already broken or fine for a typical user. Someone should open `luthien.cc` from a phone on cell data or another network. Owner: Scott/Jai.
2. **The actual fix, in the Cloudflare and Netlify dashboards:** tell Cloudflare to serve `luthien.cc` from the new-site project, tell Netlify to stop answering for `luthien.cc`, then merge [PR #4](https://github.com/LuthienResearch/luthien_site/pull/4) (which points `luthienresearch.org` at `luthien.cc`). Needs whoever holds the Cloudflare/Netlify logins. Done when typing `luthien.cc` shows the real site. Owner: Jai/Scott.
3. **Add an automated check so this cannot silently break again.** Today's checker only asks "does `luthien.cc` respond?", and a broken redirect still responds, so nothing alerted us. The new check would verify `luthien.cc` shows our actual site instead of quietly bouncing somewhere else. Not built yet; its own future task, best written after the fix above. No owner yet. This is the fix that would prevent the whole class of bug, so it is the most important open item.
4. **Decide what to do with two old pages** that exist only on the old site and were never copied over: `/about` and the 2025 post `/updates/2025-03-redteam-as-upsampling`. Either move them to the new site or redirect them away, then remove the special exceptions in `netlify.toml` that currently keep them alive. Year-old content, low stakes. Your call.

### Completeness checklist

- The architectural/detection fix (correctness monitor) is **not shipped**. This PR ships the COE, the gotcha, and the gated code stopgap only. Recorded as the top item in Remaining Risk so a reviewer can push back.
- The manual cutover step is gated: PR #4 is marked DO-NOT-MERGE until the cutover, so nothing auto-deploys into a redirect loop.
- If a similar bug appeared tomorrow (a new domain pointed at a stale origin), would this fix prevent it? Only once the correctness monitor ships. The gotcha and COE help a human diagnose faster but do not detect automatically.

## Decision record

Canonical public domain = `luthien.cc`; `luthienresearch.org` 301-redirects to `luthien.cc` (Scott, 2026-05-27). This closes the April reachability COE's open "decide canonical domain" item.

Open tradeoff, stated plainly: `luthien.cc` is filtered on some consumer ISPs (April COE), and because `luthienresearch.org` will redirect to `luthien.cc`, it does not serve as a fallback for filtered users. The only real mitigation is making `luthien.cc` serve content directly (the cutover) plus re-measuring `.cc` reachability from a clean network afterward; revisit the canonical choice if filtering is material.

## Remaining Risk

- The correctness monitor is unshipped; until it is, a human noticing is the only detector for this class. This is the single most important open item.
- `luthien.cc`'s current serving state is unconfirmed from a clean network (this diagnosis ran from a filtering ISP).
- `.cc` ISP filtering persists; `.org`-as-redirect does not mitigate it.
- Orphaned content over a year old stays live via the carve-outs until migrated or redirected.

## Meta-observation

This is the fourth instance of building liveness/reachability checks but not correctness checks (April reachability COE, May 7 sync silent-rot, drive-sync #2, this). The April COE even shipped a reachability monitor, and that monitor passed this broken state. The test of whether this COE worked is whether the correctness monitor ships; it is currently unowned.
