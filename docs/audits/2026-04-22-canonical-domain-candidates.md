# Canonical domain candidate evaluation

**Date:** 2026-04-22
**Driven by:** Trello card [XaSM8C8L](https://trello.com/c/XaSM8C8L) (canonical-domain decision from COE PR #150). Uses the new checklist from [PR #154](https://github.com/LuthienResearch/luthien-pbc-site/pull/154) and the reachability probe from [PR #153](https://github.com/LuthienResearch/luthien-pbc-site/pull/153).
**Purpose:** Apply the domain-selection checklist to each plausible canonical candidate so Jai + Scott can decide without having to re-do the investigation.

## TL;DR

**Recommendation: `luthienresearch.org`** as canonical. Already owned, 14 months aged, reachability probe passes cleanly from 4 of 5 distributed probes and locally. No acquisition cost, no timing risk.

Second-best: acquire `luthien.ai` from Atom.com marketplace if we want a shorter/more-brandable domain and Atom's ask is reasonable. This takes time and money and still needs post-acquisition reachability validation.

Do not use: `luthien.cc` (broken), `luthien.com` (Afternic marketplace, price unknown), `luthien.io` (Porkbun-registered by third party), `luthien.co` (Key-Systems-registered by third party 2019). `.dev`/`.app` are also registered by third parties per DNS resolution.

---

## Candidates evaluated

| Domain | Owned? | Age | TLD rep | Reachability | Verdict |
|--------|--------|-----|---------|--------------|---------|
| `luthienresearch.org` | ✅ Luthien (Squarespace Domains) | 14 mo | clean (.org) | ✅ passes probe | **GO** |
| `luthien.cc` | ✅ Luthien (Cloudflare) | 4 wk | ⚠️ `.cc` heavily-abused | ❌ fails probe locally | **NO-GO** |
| `luthien.ai` | ❌ Porkbun marketplace (Atom) | 6 mo | clean (.ai) | ❌ redirects to marketplace | **NO-GO** unless acquired |
| `luthien.com` | ❌ Gabia / Afternic marketplace | 21 yr | clean (.com) | n/a (parked) | **NO-GO** unless acquired |
| `luthien.io` | ❌ Porkbun, parked | 8 mo | clean (.io) | n/a (parking page) | **NO-GO** unless acquired |
| `luthien.co` | ❌ Key-Systems | 7 yr | clean (.co) | n/a | **NO-GO** unless acquired |
| `luthien.dev` | ❌ registered (AWS-parked) | unknown | clean (.dev, HSTS-preloaded) | n/a | **NO-GO** unless acquired |
| `luthien.app` | ❌ registered (AWS-parked) | unknown | clean (.app, HSTS-preloaded) | n/a | **NO-GO** unless acquired |

## Detailed findings

### luthienresearch.org ✅ RECOMMENDED

```
whois luthienresearch.org
Registrar: Squarespace Domains LLC
Registrant Organization: Luthien
Creation Date: 2025-02-17T23:48:27Z
Name Server: dns1-4.p06.nsone.net (NS1 managed DNS)
```

Reachability probe:

```
[1/3] Local machine baseline
  OK:   https://luthienresearch.org → HTTP 301 (0.262s)
  OK:   http://luthienresearch.org → 301 → https://luthienresearch.org/

[2/3] check-host.net distributed probes
  hu1.node.check-host.net → HTTP 301
  ir6.node.check-host.net → (empty result — Iran firewall, unrelated to our domain)
  nl1.node.check-host.net → HTTP 301
  pl1.node.check-host.net → HTTP 301
  us2.node.check-host.net → HTTP 301

Reachability probe PASSED for luthienresearch.org
```

**Pros:**
- We already own it. No acquisition cost or negotiation.
- 14 months of age. Not "new domain reputation risk."
- `.org` is universally trusted; no TLD filtering.
- Registered at Squarespace Domains — reputable registrar, not a parking platform.
- Passes the probe cleanly from distributed probes; the one Iran-based failure is unrelated (Iran blocks much of the public internet, not our domain specifically).
- Name ("Luthien Research") has substance and aligns with the PBC/research-org positioning.

**Cons:**
- Longer than `luthien.cc` or `luthien.ai`. Less punchy on a slide.
- Jai's Eleventy site currently runs at `luthienresearch.org`. Making this the canonical for the public site requires either merging the two or deciding on a subdomain structure (e.g., `www.luthienresearch.org` for the public site vs. `blog.luthienresearch.org` for the Eleventy blog, etc.). Needs Jai coordination.

**Cutover cost:** mostly a DNS + Cloudflare Pages custom-domain change + edit pass on the 14 in-repo references + the telemetry subdomain migration (see `docs/audits/2026-04-22-luthien-cc-reference-inventory.md`). No domain purchase.

### luthien.cc ❌ BROKEN, keep as legacy/redirect only

```
whois luthien.cc
Registrar: Cloudflare, Inc.
Creation Date: 2026-03-25T23:36:29Z (4 weeks old)
```

Reachability probe (on Scott's network and at least one other):

```
[1/3] Local machine baseline
  FAIL: https://luthien.cc → tlsv1 alert protocol version
  FAIL: http://luthien.cc → ISP URL-filter redirect (T-Mobile malware warning)

[2/3] check-host.net distributed probes
  5/5 return HTTP 200 (server is fine from most international paths)
```

**Interpretation:** server-side is healthy; consumer ISPs in the US (at least T-Mobile Home Internet + one other residential network) are middleware-filtering the domain by SNI. Full diagnosis: [COE PR #150](https://github.com/LuthienResearch/luthien-pbc-site/pull/150).

**Verdict:** cannot be canonical. Keep as `301 → canonical` so existing links partially resolve for users whose ISP lets them through.

### luthien.ai ❌ NOT OWNED (Atom marketplace)

```
whois luthien.ai
Registrar: Porkbun LLC
Registrant Organization: Private by Design, LLC (Porkbun privacy proxy)
Creation Date: 2025-10-01T14:08:02Z

# Browser visit:
curl -sI -L https://luthien.ai
# HTTP/2 302 → https://www.atom.com/name/luthien.ai  (Atom.com domain marketplace)
```

**Verdict:** not Luthien's. If we want it, we have to negotiate with the current owner via Atom. Pricing on Atom tends to be $500 - $10k+ for good two-syllable `.ai` names; unknown specifically for luthien.ai without an inquiry.

Caveat even if we acquire it: `luthien.ai` was created only 6 months ago, so it has less age than `luthienresearch.org`. Post-acquisition reachability should be re-probed before promotion.

### luthien.com ❌ NOT OWNED (Afternic marketplace)

```
whois luthien.com
Registrar: Gabia, Inc.
Creation Date: 2004-11-03T19:15:01Z (21+ years old)
Name Server: NS1.AFTERNIC.COM, NS2.AFTERNIC.COM (Afternic domain marketplace)

curl https://luthien.com
# Returns a tiny HTML bootstrap that redirects to /lander (Afternic landing page)
```

**Verdict:** not Luthien's. For sale on Afternic. Premium `.com` pricing tier. Possible, but expensive.

Big pro if acquired: 21 years of age = maximum trust from every reputation system. Big con: price tag.

### luthien.io ❌ NOT OWNED

```
whois luthien.io
Registrar: Porkbun LLC
Creation Date: 2025-08-18T19:51:16Z (8 months old)

curl https://luthien.io
# <title>porkbun.com | parked domain</title>
```

**Verdict:** not Luthien's. Parked by the current registrant. `.io` is a strong TLD for dev tools. Would need acquisition + post-acquisition aging.

### luthien.co, luthien.dev, luthien.app ❌ NOT OWNED

- `luthien.co`: Key-Systems, 2019-01. 7 years old. Not parked on a marketplace.
- `luthien.dev`: DNS resolves to `44.227.76.166` (AWS Oregon). HSTS-preloaded TLD. Registrant unknown from WHOIS.
- `luthien.app`: DNS resolves to `44.227.65.245` (AWS Oregon). HSTS-preloaded TLD. Registrant unknown from WHOIS.

**Verdict:** third-party owned. Acquisition cost unknown; `.dev`/`.app` would be cheaper than `.com`/`.ai`.

## Decision matrix

If the tie-breaker is **speed**: `luthienresearch.org` (zero acquisition time).
If the tie-breaker is **brand** (short, punchy): acquire `luthien.ai` via Atom.
If the tie-breaker is **trust/age**: `luthienresearch.org` already beats all unacquired alternatives; `luthien.com` would beat it but is the most expensive.
If the tie-breaker is **cost**: `luthienresearch.org` wins outright ($0 incremental).

## Unresolved dependencies

1. **Relationship with `luthien_site`** (Jai's Eleventy site, currently at `luthienresearch.org`). If we pick `luthienresearch.org` canonical, we need to decide: merge the Eleventy site into this repo, or split paths (e.g., `luthienresearch.org/` = pbc-site, `luthienresearch.org/blog/` = Eleventy). The CLAUDE.md explicitly says "Relationship TBD — this repo may eventually replace or coexist with it." Decision needs Jai.
2. **Telemetry subdomain.** `telemetry.luthien.cc` is a production subdomain for luthien-proxy (covered in the reference audit PR #152). If canonical changes, `telemetry.<canonical>` needs standing up with a grace period where the Worker accepts both hostnames. This is a coordinated release, not a single-edit change.
3. **Email `@luthien.cc` vs `@luthienresearch.org`.** Not tested in this audit (email deliverability card [dM4Xwxeh](https://trello.com/c/dM4Xwxeh) is blocked on SMTP creds). If @luthien.cc is hitting spam at Gmail/Outlook, that's a separate cutover urgency.

## Recommendation

Adopt `luthienresearch.org` as canonical. Ship the redirect from `luthien.cc` → `luthienresearch.org` in parallel with the in-repo reference swap. Defer the luthien.ai acquisition question — only pursue if brand considerations outweigh the cost and we don't want to live with `luthienresearch.org` long-term.

This avoids:
- Acquisition cost and timeline.
- Post-acquisition aging lag (no new domain to wait on).
- The risk of picking another domain that turns out to have a hidden reputation or ownership issue.

The biggest open question with this path is the `luthienresearch.org` / Eleventy-site coordination with Jai. That's a one-conversation decision, not a blocking research question.

## References

- [COE PR #150](https://github.com/LuthienResearch/luthien-pbc-site/pull/150) — originating luthien.cc reachability bug
- [PR #152](https://github.com/LuthienResearch/luthien-pbc-site/pull/152) — cross-repo reference audit (what needs editing when canonical changes)
- [PR #153](https://github.com/LuthienResearch/luthien-pbc-site/pull/153) — reachability probe script used in this evaluation
- [PR #154](https://github.com/LuthienResearch/luthien-pbc-site/pull/154) — domain-selection checklist used to structure this evaluation
- Trello card [XaSM8C8L](https://trello.com/c/XaSM8C8L) — the canonical-domain decision this document is inputs for
