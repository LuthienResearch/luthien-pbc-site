# COE: luthien.cc unreachable on filtered ISPs

**Date:** 2026-04-22
**Author:** Scott (w/ Claude)
**Status:** Diagnosis complete. No code fix shipped in this PR. Remediation requires a human decision on the canonical Luthien domain.

## Repro Steps (before any fix)

1. Be on a consumer ISP that filters `.cc` domains or the specific Cloudflare shared-IP ranges hosting luthien.cc. Confirmed on T-Mobile Home Internet; reproduced from a separate non-T-Mobile residential network.
2. Run:
   ```
   curl -sI https://luthien.cc
   ```
3. Observe:
   ```
   curl: (35) LibreSSL/3.3.6: error:1404B42E:SSL routines:ST_CONNECT:tlsv1 alert protocol version
   ```
   Or in Chrome: `ERR_SSL_PROTOCOL_ERROR`. Or on HTTP, T-Mobile returns a 302 to `t-mobile.com/home-internet/http-warning?url=http://luthien.cc/` with the "Let's stop for a moment. This domain may contain malware" interstitial.

Control reproductions on the same network (all succeed):
- `curl -sI https://cloudflare.com` returns 301
- `curl -sI https://luthien.ai` returns 302
- `curl -sI https://luthienresearch.org` returns 301
- Same Cloudflare IP with SNI=cloudflare.com completes TLS and returns the cloudflare.com cert

SSL Labs scan of luthien.cc (scanning from its own infrastructure, not our paths) returns grade A, TLS 1.2 + 1.3 both negotiable. So the Cloudflare edge config is healthy. The breakage is on the path between certain clients and the edge.

## RCA/COE

### Bug: luthien.cc cannot complete a TLS handshake from some consumer ISP networks, and is HTTP-filtered by at least one major US ISP (T-Mobile)

**Impact:** First-time visitors arriving at luthien.cc on affected networks see either Chrome's `ERR_SSL_PROTOCOL_ERROR` or T-Mobile's "malware" interstitial. There is no graceful fallback. Users bounce with the impression that Luthien is broken or sketchy.

Blast radius is asymmetric in the worst possible way: we cannot enumerate the affected population, but the people most likely to hit it are first-time visitors arriving from external links (pitch deck, cold emails, LinkedIn). Repeat visitors on a given broken network also bounce every time. Severity is session-ending, not degraded. Business impact is disproportionate: a broken first impression on an investor or LOI prospect costs more than the same failure on a returning user, and we have been sending pitch decks containing luthien.cc links to exactly that audience.

Scott reproduced the failure on his T-Mobile home network across multiple attempts on 2026-04-21 and 2026-04-22. Claude reproduced it from an independent non-T-Mobile network on 2026-04-22. Jai could not reproduce. That divergence is itself a red flag: it means we cannot use founder reachability as a proxy for customer reachability.

**Timeline:**

| Date | Event |
|------|-------|
| Unknown (pre-2026-04-22) | luthien.cc registered and pointed to Cloudflare. No customer-reachability validation performed at registration or at subsequent links-to-domain events. |
| 2026-04-21 | Scott first hits the issue on T-Mobile home network. |
| 2026-04-22 | Scott raises in internal Slack. Jai cannot reproduce and initially hypothesizes T-Mobile-specific HTTP filtering. |
| 2026-04-22 | Claude reproduces from separate network, confirms TLS-layer interference (not just HTTP filtering) and independence from T-Mobile. |
| 2026-04-22 | This COE filed. No code fix applied: remediation requires a domain decision. |

Window of exposure: **unknown, bounded below by "at least one day known" and plausibly weeks to months unknown.** Anyone who bounced off luthien.cc silently is invisible to us.

**5 Whys:**

1. Why can't users reach luthien.cc? → Their ISPs are interfering with both HTTP (explicit URL-filter interstitial) and HTTPS (SNI-based TLS disruption; confirmed because the exact same Cloudflare IP serves other SNIs cleanly).
2. Why are ISPs interfering? → `.cc` is a high-abuse TLD (Cocos Islands — cheap, loosely regulated, widely used by phishing and malware). Consumer-ISP reputation filters flag new/unknown `.cc` hostnames by default. Cloudflare's shared anycast IPs compound the problem: we inherit reputation from neighboring sites on the same IPs.
3. Why can't we distinguish our legitimate `.cc` from the malicious ones on the same IPs? → Reputation systems score on TLD + domain age + IP neighborhood. None of those is under our short-term control once we've registered. A brand-new `.cc` on shared Cloudflare IPs is indistinguishable from a brand-new `.cc` phishing kit until we age into "trusted" status months or years later.
4. Why are we hosting Luthien's primary surface on `.cc`? → The domain was picked for availability and aesthetics. `.com` was taken; `.cc` was short and brandable. No TLD-reputation or ISP-reachability check was performed at purchase time.
5. Why was no check performed? → No checklist existed for domain purchases. The implicit assumption was "if it resolves for us, it works for users." That assumption is wrong whenever any middlebox in the path applies policy.
6. Why did no checklist exist? → Luthien has no lightweight "customer-path validation" step for any public-facing infra. Domains, hosting endpoints, embedded links, and email-sending domains all share this gap. The first time we find out a surface is broken for real users is when a founder happens to bounce off it themselves.

Systemic root: **no process or tooling validates that customer-facing infrastructure actually works on the paths real users take, before or after it is promoted externally.**

**The Pattern:**

Searched `/Users/scottwofford/build/CLAUDE.md` (global) COE examples list for the same class of bug. The list is all luthien-proxy code bugs. No directly comparable domain/reachability COE exists in the registry today — this is the first reachability COE in the series, and the first COE in the luthien-pbc-site repo.

But the *meta-pattern* ("it works for us, it fails silently for users on real paths") has recurred in luthien-proxy:

| Prior incident | Date | What went wrong | How discovered |
|----|------|----------------|----------------|
| luthien-proxy PR #134 | pre-2026-02 | Thinking blocks broken in real streaming traffic; unit tests green but real Claude Code clients broke | User dogfooding |
| luthien-proxy PR #122 | pre-2026-02 | Railway deployment missing env vars; worked locally, broke in prod | User hit prod |
| luthien-pbc-site (this COE) | 2026-04-22 | Domain unreachable on consumer ISPs; worked for some founders, broken for others + unknown visitors | Founder dogfooding on home ISP |

Three instances of the same meta-pattern is not "three isolated bugs." The COE action items from #122 and #134 were point fixes; neither produced a generalized "validate against real user paths before shipping" capability, which is why we are here again. If this COE produces only a domain swap and a redirect, we will find this class of bug a fourth time on the next surface we stand up.

**Detection gap:**

1. How the bug was actually discovered: Scott bounced off Luthien's own homepage while trying to use it. He asked in Slack. Claude diagnosed.
2. How it should have been discovered: a pre-launch reachability probe that hits the domain from diverse ASNs (residential ISPs, mobile carriers, common enterprise egress, non-US egress) and reports TLS success, HTTP response, and presence of interstitial pages. Additionally, ongoing synthetic monitoring that alerts on any of those reachability signals degrading post-launch.

Neither exists. The only "detection" today is that Scott, Jai, or another founder personally visits the domain from a given network. That is a sample of 2-3 networks, all in the same metro areas, probably on similar ISP reputations to each other.

**What else could break? (actual search, documented):**

- **Other Luthien domains on the same filter paths.** I tested, from the network where luthien.cc fails: `luthien.ai` → 302 ✓, `luthienresearch.org` → 301 ✓, `cloudflare.com` → 301 ✓. So the failure is specific to luthien.cc, not our whole footprint. Cloudflare-in-general is fine on this network.
- **Email deliverability from any `@luthien.cc` or `@luthienresearch.org` address.** Not tested in this session. TLD-reputation effects also impact spam scoring. Anything sent from `@luthien.cc` is plausibly being soft-filtered to spam for the same reasons ISPs block the domain. **Needs verification.** Listed as a Claude action item below.
- **Every marketing artifact that embeds a link to luthien.cc.** Not audited in this session. Plausible locations: pitch deck (this repo's `docs/requirements/pitch-deck/`), the personal-site and luthien_site landing pages, LinkedIn bios, email signatures, Trello cards, the LOI tracking sheet, cold-email templates, any cached Google Analytics or Search Console entries. Every one of these is a broken-link landmine until the domain is cut over. **Needs sweep.** Listed as a Claude action item below.
- **Codebase self-references to `luthien.cc`.** `grep -rn "luthien\.cc" site/` on the current tree (run 2026-04-22) returned 14 matches, including:
  - Every page's `og:url` and `og:image` meta tags point at `https://luthien.cc/...` (`site/index.html`, `site/about.html`, `site/blog.html`)
  - `site/assets/images/og-image.svg` has the literal text "luthien.cc" embedded in the SVG, so every social-preview card shows the broken domain
  - `site/pitch/index.html` line 4412 and `site/pitch/es/index.html` line 2817: the closing slide of the pitch deck links to `https://luthien.cc`. Investors viewing the deck are one click away from a broken site.
  - `site/pitch/index.html` line 3586: frustrations page link text and href point at luthien.cc
  - `site/install.sh` line 3: docstring references `curl -fsSL https://luthien.cc/install.sh | bash` as a user-facing install pattern — if the TLS handshake to luthien.cc fails, that install pattern is broken for exactly the developer audience we're targeting
  - CHANGELOG v11.5 mentions `https://luthien.cc/pitch.pdf` as the stable URL for the auto-built pitch deck PDF — meaning the "Download PDF" button on the deck points at a domain that may not resolve for the viewer

  This is materially worse than the initial assessment. Every OG card is broken. Every pitch-deck close link is broken. The public install command is broken. The blast radius is not "external artifacts linking in" — it is also "the site itself exports links that go to a domain that fails to load for a subset of visitors." Cut over cannot be just a redirect; it requires editing the HTML files and the SVG. Filed as a point-fix action item below.
- **install.sh installability:** the install command `curl -fsSL https://luthien.cc/install.sh | bash` is documented in this repo and is listed as a setup path users would actually run. On networks where luthien.cc fails TLS, that curl returns the same `tlsv1 alert protocol version` error, and the install silently fails. If anyone has tried this from a filtered ISP, they have bounced from the install step with no idea why.
- **Other `.cc` or shared-Cloudflare-IP assets Luthien might acquire in the future.** Listed as a process action item.

**Root Cause (technical detail):**

There is no code that broke — nothing was recently changed. The bug has existed since domain registration; it was simply invisible until Scott bounced off it.

Reproduction evidence (collected 2026-04-22):

```
$ curl -v -m 10 https://luthien.cc 2>&1 | grep -E "Trying|Connected|error|alert"
  Trying 172.67.130.71:443...
  Connected to luthien.cc (172.67.130.71) port 443
  LibreSSL/3.3.6: error:1404B42E:SSL routines:ST_CONNECT:tlsv1 alert protocol version

$ echo | openssl s_client -connect 104.21.3.57:443 -servername luthien.cc
  error:0A0000C6:SSL routines:tls_get_more_records:packet length too long

$ echo | openssl s_client -connect 172.67.130.71:443 -servername cloudflare.com
  subject=CN=cloudflare.com      # same IP, different SNI → succeeds cleanly

$ curl -sI https://luthien.ai           # control, same network
  HTTP/2 302
$ curl -sI https://luthienresearch.org   # control, same network
  HTTP/2 301

$ curl -sI http://luthien.cc
  HTTP/1.1 302 Found
  Location: https://www.t-mobile.com/home-internet/http-warning?url=http://luthien.cc/&token=...
```

"packet length too long" from openssl and "tlsv1 alert protocol version" from curl, together with the SNI-selective behavior on the same IP, are characteristic of a middlebox inspecting ClientHello SNI and injecting either corrupt bytes or a spoofed TLS alert. That is not a Cloudflare-side failure; it is path-layer interference keyed on the hostname.

**Fixes Applied in this PR:**

| Issue | Fix | File |
|-------|-----|------|
| No written record of the incident, its diagnosis, or its action items | Added this COE | `docs/coes/2026-04-22-luthien-cc-unreachable.md` |
| No index of COEs in this repo | Added a COE directory README | `docs/coes/README.md` |
| The root cause (TLD reputation / ISP-level SNI filtering) is non-obvious and will trip up anyone debugging "the site is down for my friend but works for me" in the future | Added a gotcha | `dev/context/gotchas.md` |
| Outstanding action items need a durable home | Logged on Trello (Luthien board). `TODO.md` files are deprecated — Trello is the single source of truth for tasks. | Trello (Luthien board) |

No code fix. No domain change. The remediation for the underlying reachability problem requires a human decision on the canonical Luthien domain, which is tracked as a human action item below.

**Action items:**

All action items are tracked as Trello cards on the Luthien board (the source of truth for tasks). `TODO.md` files are deprecated. Cards below:

*Claude-automatable (do first):*

| Card | Trello list | Type |
|------|-------------|------|
| [Audit all luthien.cc references across repos; produce swap-list](https://trello.com/c/5mTdBda5) | This Sprint | **Point fix + Detection** |
| [Build reachability probe at `scripts/reachability-check.sh`](https://trello.com/c/7oZ6W99d) | This Sprint | **Architectural (prevents the class)** |
| [Spot-check email deliverability from @luthien.cc vs @luthienresearch.org](https://trello.com/c/dM4Xwxeh) | This Sprint | **Detection (shortens exposure window)** |
| Edit in-repo self-references once canonical domain is picked (to be opened as a separate PR after the decision lands; not pre-created because the target domain is an input) | (filed after decision) | **Point fix** |

*Requires human decision/design:*

| Card | Trello list | Type |
|------|-------------|------|
| [Decide canonical Luthien domain](https://trello.com/c/XaSM8C8L) (owner: Jai + Scott; due 2026-04-29) | Top Priority | **Architectural** |
| [Write domain-selection checklist to prevent next .cc-style incident](https://trello.com/c/kHs0XHhn) (owner: Jai or Scott; due before next domain purchase) | uncategorized | **Architectural (prevents the class)** |
| [Decide on ongoing synthetic reachability monitoring for customer domains](https://trello.com/c/vbhEJVoW) (owner: Jai; due next sprint) | uncategorized | **Detection** |
| Set up `luthien.cc` → canonical 301 redirect (same day as decision). Not pre-created as a Trello card because it is the mechanical follow-on to the decision card; will be filed when the decision lands. | (filed after decision) | **Point fix** |

**Remaining Risk:**

- Every external artifact already in the wild that links to luthien.cc — pitch decks delivered to investors, LinkedIn posts, cached Google results, cold emails already sent — continues to bounce some fraction of viewers even after cutover. We cannot retroactively fix delivered artifacts.
- Whatever canonical domain we pick could have latent reputation issues we have not measured. The reachability-probe script is specifically designed to de-risk this before promotion, and it must be run on the chosen canonical before cutover, not after.
- The process gap (no pre-launch customer-path validation) is wider than just domains. Railway deployment URLs, demo-environment URLs, embedded-widget endpoints all share the same failure mode. The domain-selection checklist is a start; it does not yet cover those surfaces.

**Meta-observation:**

This is the third known instance of the pattern *"we ship customer-facing infra that works for founders and silently fails for real users on real paths"* (prior: luthien-proxy #122, #134). Each prior COE produced a point fix. None produced a generalized validation capability. That is why this COE exists.

The architectural item that breaks the cycle is the reachability-probe script combined with the domain-selection checklist — both need to actually ship, not just be listed. The test of whether this COE worked is whether the next domain we buy goes through a validation step, or whether a founder bounces off it first.

A second meta-observation, surfaced in a separate COE on `/coe` process adherence (filed as its own PR): the `/coe` process itself almost did not produce this document. The first attempt at running `/coe` on this incident produced an inline chat response with no PR, no committed files, and no registry entry. Process-level adherence to COE is itself a class of bug, and is addressed in that sibling COE.
