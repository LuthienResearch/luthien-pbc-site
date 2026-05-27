# COE: canonical domains 301-redirect to the unbranded github.io fallback

**Date:** 2026-05-27
**Author:** Scott (w/ Claude)
**Type:** B (infra / config / process incident; the production fix is a dashboard cutover, not a diff)
**Status:** Diagnosis complete; canonical-domain decision made (luthien.cc); code stopgap open in [luthien_site PR #4 (netlify.toml)](https://github.com/LuthienResearch/luthien_site/pull/4). Production fix requires a Cloudflare/Netlify dashboard cutover (runbook below); no code change can repoint the domain.

## Summary

Both public domains, `https://luthien.cc/` and `https://luthienresearch.org/`, 301-redirect every request to `https://luthienresearch.github.io/luthien-pbc-site/`, an unbranded GitHub Pages sub-path. The live site is healthy and is served correctly on Cloudflare Pages (`https://luthien-pbc-site.pages.dev/` returns HTTP 200), but neither canonical domain points at it. A retired deployment of the old `luthien_site` repo (the original Eleventy site) still claims both domains on Netlify and bounces all traffic to the GitHub Pages fallback.

This is platform-migration / config drift, not a one-off typo: the site moved from Netlify (`luthien_site`) to Cloudflare Pages (`luthien-pbc-site`), and the production-domain cutover was never durably completed. Per Scott's "version drift means COE, wrong-URL means no COE" test, this is a COE.

## Repro Steps (before any fix)

The incident manifests for anyone resolving either production domain. Reproduce against `main` / live infrastructure (there is no code commit to check out; the broken state is in DNS + Netlify/Cloudflare config):

```
$ curl -sI https://luthien.cc/
HTTP/2 301
location: https://luthienresearch.github.io/luthien-pbc-site/
server: Netlify
cache-status: "Netlify Edge"; fwd=stale
x-nf-request-id: 01KSNN23E9HSA4MJ5XJP2WC225

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

**Impact.** Anyone arriving at `luthien.cc` or `luthienresearch.org` (the links on the pitch deck, in cold emails, on LinkedIn) is bounced to `luthienresearch.github.io/luthien-pbc-site/`. The address bar shows a GitHub user-pages URL with a repo name in the path, which reads as unfinished and unprofessional to an investor or LOI prospect, and is the kind of URL no one would deliberately share. The symptom surfaced in internal Slack on 2026-05-20: Jennifer Baik asked "what is the good luthien link for public besides `https://luthienresearch.org/`? or does this one work", i.e. people on the team no longer knew which public link was safe to share, because the obvious ones bounce.

Blast radius: every first-time visitor to either canonical domain, which is the entire externally-facing audience (the pitch deck and cold outreach send people to exactly these domains). Severity: reputational, not availability. The site loads after the redirect, but the first impression is wrong and the destination cannot be cleanly shared. Business impact: a broken-looking first impression on an investor or LOI prospect costs disproportionately more than the same on a returning user.

**Timeline.**

| Date | Event |
|------|-------|
| 2025 (pre-migration) | `luthien_site` (Eleventy) is the live site on Netlify, serving `luthien.cc`. |
| 2026-02-26 | `luthien-pbc-site` repo created (CHANGELOG v10: "Initial repo migration from scottwofford.com/luthien/landing_v8/"). |
| 2026-03-19 | `luthien_site/netlify.toml` gets a catch-all `/* -> https://luthienresearch.github.io/luthien-pbc-site/ 301` (commit `de96792`, "redirect all traffic to luthien-pbc-site on GitHub Pages"). Cloudflare Pages was not set up yet, so GitHub Pages was the only live URL for the new site. A reasonable stopgap at the time. |
| 2026-03-21 | Carve-outs added so the old site's `/about` and `/updates/*` pages survive the catch-all (commits `d0fa453`, `875146e`). |
| ~2026-04 | Cloudflare Pages stood up for `luthien-pbc-site`; `deploy.yml` makes Cloudflare the primary deploy target ("Cloudflare Pages (luthien.cc)"); `/pitch.pdf`, `/toc`, `/story` shipped via Cloudflare `_redirects`. `luthien.cc` is serving from Cloudflare at this point. |
| 2026-04-22 | [luthien.cc reachability COE](./2026-04-22-luthien-cc-unreachable.md) filed (`.cc` TLD reputation / ISP SNI filtering). Confirms `luthien.cc` was on Cloudflare (SSL Labs scanned the Cloudflare edge). Canonical-domain decision left open, due 2026-04-29. |
| unknown (after 2026-04-22, by 2026-05-20) | `luthien.cc` stops serving from Cloudflare and reverts to the stale Netlify `luthien_site` deployment, which 301s it (and `luthienresearch.org`) to the GitHub Pages fallback. The Cloudflare-Pages-as-canonical state was never durably locked in: the Netlify custom-domain attachment was never removed, so a DNS change (or Netlify reasserting the domain) put the stale redirect back in the path. Exact trigger lives in the Cloudflare + Netlify dashboards, not in git. |
| 2026-05-20 | Jennifer Baik flags the confusion in Slack. |
| 2026-05-27 | Scott reports the redirect; this COE filed; canonical domain decided: **luthien.cc**. |

Window of exposure: bounded below by one week (Slack 2026-05-20 to 2026-05-27), plausibly weeks. Anyone who saw the github.io URL and quietly distrusted it is invisible to us.

**5 Whys.**

1. Why do `luthien.cc` and `luthienresearch.org` redirect to github.io? A retired Netlify deployment of `luthien_site` still claims both domains and its `netlify.toml` has a catch-all `/* -> github.io 301`.
2. Why is the retired deployment still in the serving path? The platform migration from Netlify to Cloudflare Pages was never finished: the Netlify site's custom-domain attachments for both domains were never removed, and `luthien.cc`'s Cloudflare zone forwards to the Netlify origin instead of the Cloudflare Pages project.
3. Why was the cutover left half-done? The migration happened in stages over weeks (Mar: content moves, github.io stopgap; Apr: Cloudflare Pages stands up). There was no single checklist that said "the migration is not done until the old platform no longer answers for the production domains." Each stage looked locally complete.
4. Why didn't anyone notice the canonical domain was serving a 301-to-fallback? The reachability monitor shipped from the April COE (action item #158) checks whether the domain resolves and answers, which it does: a 301 to a reachable github.io still passes a reachability check. Reachability monitoring is not correctness monitoring. Nothing asserted "the canonical domain returns 200 and serves our own content," so the regression was silent until a human eyeballed the address bar.
5. Why is there no "is the production domain serving the right thing" check? Public-domain serving state lives across three dashboards (registrar/DNS, Netlify, Cloudflare Pages) with no single source of truth and no automated assertion tying "domain X should serve content from project Y." The first signal of drift is a person noticing an off-brand URL.

**Systemic root.** There is no single source of truth for which platform serves each production domain, and no monitor that asserts the canonical domain returns our own content (HTTP 200 from the expected origin) rather than merely being reachable. A multi-stage platform migration can therefore leave a stale deployment in the path indefinitely, and the only detector is a human noticing.

### The Pattern

This is a recurrence of a known class: public-facing or background infrastructure silently sitting in a wrong or degraded state, with no monitor asserting correctness, discovered only when a human happens to notice.

| PR / COE | Date | What went wrong | How discovered |
|----------|------|-----------------|----------------|
| [luthien.cc reachability COE](./2026-04-22-luthien-cc-unreachable.md) | 2026-04-22 | `luthien.cc` unreachable on some consumer ISPs; no monitor | Founder bounced off it on home internet |
| [luthien-proxy #122](https://github.com/LuthienResearch/luthien-proxy/pull/122) | 2026 | Railway deployment missing env vars (silent infra misconfig) | Runtime failure, not a pre-check |
| [claude-ai-sync silent-rot COE](https://github.com/scottwofford/private-claude-code-docs/blob/main/coes/COE-2026-05-07-claude-ai-sync-silent-rot.md) | 2026-05-07 | Sync silently failed ~3-4 days; no monitor on `last_exit_code` | Human noticed missing data |
| [drive-sync #2](https://github.com/scottwofford/drive-sync/pull/2) | 2026 | Silent bidirectional file downgrade; no monitor | Human noticed shorter file |
| This COE | 2026-05-27 | Canonical domains serve a 301 to off-brand fallback; reachability monitor passes it | Human noticed the URL in Slack |

Because this is a repeat, the COE must answer "why are we still finding bugs this way?" Answer: each prior instance shipped a liveness/reachability check (does it answer? did the cron exit 0?) but not a correctness check (is it serving the right content / did it sync the right direction?). The April reachability monitor is itself the proof: it exists, it runs, and it passed this broken state because a reachable 301 satisfies a reachability assertion. The architectural fix is a correctness assertion, below.

### Detection gap

1. **How was it actually discovered?** A human (Jennifer Baik) noticed the off-brand URL while trying to find a clean public link to share, raised it in Slack on 2026-05-20, and Scott escalated it on 2026-05-27.
2. **How should it have been discovered?** A synthetic monitor asserting that each canonical domain returns HTTP 200 from the expected origin (Cloudflare for `luthien.cc`, or the org's intended target) and contains a known content fingerprint, and that alerts on any 3xx whose `Location` leaves the canonical host. The April monitor (#158) checks reachability only, so it cannot catch "reachable but serving the wrong thing." This is the class-level detector, not just an instance fix.

### What else could break? (sweep)

Searched both site repos for the same category of stale redirect / version-pinned path / off-brand redirect destination:

- `grep -rn 'http-equiv="refresh"'` across `luthien-pbc-site` and `luthien_site/src`: one hit, the repo-root `index.html` meta-refresh to `site/v10.9.1/` (a version path that no longer exists). **Not user-facing**: the deploy root is `site/`, not the repo root, so this file is never served. Same drift class, and already being removed on Scott's parallel `hygiene/deploy-docs-and-stale-root-redirect` branch (commit `f016e00`).
- `grep -rnE 'site/v[0-9]+'`: in addition to the root `index.html` above, one stale path reference in a CSS comment in `site/pitch/index.html:22` (`site/v12/lumentheme-branding-guideline.md`; the file actually lives at `dev/lumentheme-branding-guideline.md`). Cosmetic, comment-only.
- `grep -rn 'github\.io'` across served content: two hits, both legitimate external links (`awestover.github.io`, `mozilla.github.io` Nunjucks docs). No stale github.io redirect destinations in served content. Clean.
- All redirect configs enumerated: `luthien_site/netlify.toml` (the bug, fixed in PR #4) and `luthien-pbc-site/site/_redirects` (only `/toc` and `/story`, both correct). Clean.

Conclusion: the only same-class artifact is the non-served root `index.html` redirect, already handled in parallel. No additional user-facing stale redirects found.

### Incident Detail (evidence)

DNS topology at discovery, verified via `dig`:

- `luthien.cc`: nameservers `sasha.ns.cloudflare.com` / `will.ns.cloudflare.com` (Cloudflare-managed DNS); A records `104.21.3.57` / `172.67.130.71` (Cloudflare anycast). Yet `curl -sI` returns `server: Netlify`, `cache-status: "Netlify Edge"`, and `x-nf-request-id` (a Netlify-specific request id). Interpretation: Cloudflare is fronting `luthien.cc` and forwarding to a Netlify origin (the retired `luthien_site` deployment), rather than to the Cloudflare Pages `luthien-pbc-site` project. The fix lives in the Cloudflare dashboard for this zone, plus removing the domain from the Netlify site.
- `luthienresearch.org`: nameservers `dns{1..4}.p06.nsone.net` (NS1, which is Netlify's managed DNS); A records `52.52.192.191` / `13.52.188.95` (AWS, Netlify's load balancer). Served directly by the same Netlify `luthien_site` deployment.

The redirect itself is the catch-all in `luthien_site/netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "https://luthienresearch.github.io/luthien-pbc-site/"
  status = 301
  force = true
```

### Fixes Applied

| Issue | Fix | File or location |
|-------|-----|------------------|
| Old Netlify site 301s both canonical domains to the unbranded github.io path | Stopgap: retarget the catch-all github.io -> `https://luthien.cc/` (gated behind the DNS cutover to avoid a self-redirect loop) | `luthien_site/netlify.toml` ([PR #4](https://github.com/LuthienResearch/luthien_site/pull/4)) |
| No durable record of the drift, its diagnosis, or the cutover plan | This COE + index entry | `docs/coes/2026-05-27-canonical-domains-redirect-to-github-io.md`, `docs/coes/README.md` (this PR) |
| Migration-drift root cause is non-obvious (a "reachable but wrong" failure) | Gotcha with the `dig`/`curl` debugging signal + a migration-"done" definition | `dev/context/gotchas.md` (this PR) |
| Deploy docs claimed GitHub Pages as the deploy target; no domain->platform mapping | Corrected to Cloudflare-primary + GitHub-Pages-fallback; added "do not add `site/CNAME`, it conflicts with Cloudflare" | `CLAUDE.md` (Scott's `f016e00`, parallel `hygiene/...` branch, not yet merged) |

### Action items

Per the "Trello = humans only" rule (CLAUDE.md rule #3, reaffirmed in the [2026-05-22 sync COE](https://github.com/scottwofford/private-claude-code-docs/blob/main/coes/COE-2026-05-22-claude-ai-sync-transient-api-failure.md) where auto-filing COE cards was corrected): in-session Claude work is recorded by commit here, not in Trello; only items deferred to a human with an ETA get a Trello card. None of the deferred items below has a committed ETA yet, so none is filed; they are recorded here for the next operator.

| Action | Tracking | Status | Type |
|--------|----------|--------|------|
| Add the gotcha (migration-"done" definition + dig/curl signal) | this PR (`dev/context/gotchas.md`) | DONE this PR | Detection |
| File the COE + index entry | this PR | DONE this PR | Detection |
| Append this PR to the COE examples list | commit in `private-claude-code-docs/coe-examples.md` | DONE this session | Detection |
| Record the canonical-domain decision (luthien.cc) with accepted-risk rationale | decision recorded in this COE; closes April COE item | DONE this PR | Architectural (accepted failure mode, written rationale) |
| Retarget `luthien_site` catch-all github.io -> `luthien.cc` | [luthien_site PR #4](https://github.com/LuthienResearch/luthien_site/pull/4) | Open, gated: merge only after DNS cutover | Point fix |
| Cloudflare/Netlify/DNS cutover (runbook steps 0-3, 5) | dashboard change; owner Jai/Scott; no ETA set (not filed to Trello until ETA exists) | Open, owner Jai/Scott | Point fix (per-domain) |
| Upgrade the synthetic monitor to assert 200-from-expected-origin + content fingerprint, alert on canonical-host-leaving 3xx | recommended separate PR to the monitor workflow (kept out of this docs PR per one-PR-one-concern) | Open, no owner committed; see Remaining Risk | Detection (class-level) |
| Decide + execute: migrate or 301 the orphaned `luthienresearch.org/updates/2025-03-redteam-as-upsampling` (7KB post, not on new site) and `/about`; 301 `/updates/2025-03-controlconf` -> `/blog/controlconf-london-2025` (already migrated) | Scott decision; see Remaining Risk | Open, needs decision | Point fix |

Success criteria, per open item:
- **PR #4 merge**: `curl -sI https://luthienresearch.org/` returns 301 -> `https://luthien.cc/`.
- **Cutover**: `curl -sI https://luthien.cc/` returns 200 from Cloudflare (not a 301; `server: cloudflare`).
- **Monitor upgrade**: a deliberate 301-to-github.io test fixture makes the monitor fail even though the URL is reachable.
- **Orphaned content**: old deep links resolve to live content (not a 404) after the Netlify carve-outs are removed.

### Completeness checklist

- [x] **An architectural action item exists and is shipped in this PR**: the canonical-domain decision plus written accepted-risk rationale (the `/coe` template explicitly counts "Scott decided to keep accepting the failure mode, with rationale" as architectural). The complementary single-source-of-truth domain->platform mapping is shipped in Scott's parallel `f016e00` (pending merge).
- [x] **Detection follow-up is explicitly labeled and gated**: the monitor correctness-upgrade is the class-level detection fix. It is intentionally not bundled into this docs-only PR (one PR = one concern; it touches the monitor workflow). This PR ships the COE + decision + code stopgap + gotcha; the correctness monitor is a recommended separate PR, recorded in Remaining Risk so a reviewer can push back if it is dropped.
- [x] **Manual human step is gated, not silently assumed done**: the production fix is a dashboard cutover by Jai/Scott. The dependent code change ([PR #4](https://github.com/LuthienResearch/luthien_site/pull/4)) is marked DO NOT MERGE until the cutover completes, so nothing auto-deploys into a redirect loop.
- [x] **Completeness-gate answer**: "If a similar but different version of this bug appeared tomorrow (for example, a newly purchased domain pointed at a stale origin, or a future hosting migration), would this fix prevent it?" Partially yes: the gotcha + migration-"done" definition + (once shipped) the correctness monitor would catch the class. The canonical-domain decision itself is `luthien.cc`-specific and would not generalize; the detection and process fixes are what carry across.

## Decision record

**Canonical public domain: `luthien.cc`** (Scott, 2026-05-27). `luthienresearch.org` 301-redirects to `luthien.cc`. This resolves the canonical-domain action item left open by the [April reachability COE](./2026-04-22-luthien-cc-unreachable.md) (was due 2026-04-29).

Knowingly-accepted risk: the April COE documented that `luthien.cc` is filtered at the TLS/SNI layer by some consumer ISPs (T-Mobile Home Internet confirmed) because `.cc` is a high-abuse TLD on shared Cloudflare IPs. Choosing `luthien.cc` as canonical re-accepts that exposure. Mitigation: run the reachability probe (`scripts/reachability-check.sh luthien.cc`) immediately after cutover and on a schedule; `luthienresearch.org` remains a live, unfiltered alias for anyone who cannot reach `.cc`.

## Remediation runbook (production fix: dashboard, not code)

No code change can repoint a domain. The fix is a sequenced cutover. Order matters: step 4 (the netlify.toml PR) must not deploy before steps 1-3, or `luthien.cc` will redirect-loop.

0. **Untangle current attachment.** In the Cloudflare dashboard (zone `luthien.cc` and the Cloudflare Pages `luthien-pbc-site` project) and the Netlify dashboard (`luthien_site` site), inspect what each claims. Evidence at filing: `luthien.cc` is on Cloudflare DNS but forwards to a Netlify origin (`server: Netlify`, `x-nf-request-id` present); `luthienresearch.org` is on Netlify DNS (NS1) pointing at Netlify's AWS load balancer. Confirm before changing.
1. **Cloudflare Pages:** add `luthien.cc` as a custom domain on the `luthien-pbc-site` project; let Cloudflare provision the cert.
2. **DNS / routing:** point `luthien.cc` at the Cloudflare Pages project (replace the forward-to-Netlify record) per Cloudflare's custom-domain instructions.
3. **Netlify:** remove `luthien.cc` from the `luthien_site` site's custom domains so Netlify stops answering for it.
4. **`luthienresearch.org` -> `luthien.cc` 301:** merge [luthien_site PR #4](https://github.com/LuthienResearch/luthien_site/pull/4) (catch-all retargeted github.io -> `https://luthien.cc/`). Safe only after `luthien.cc` has left the Netlify site (step 3); otherwise `luthien.cc` 301s to itself on the same Netlify site and loops. Alternative: implement the org->luthien.cc 301 at the Cloudflare/DNS layer and retire the Netlify site entirely.
5. **Verify:** `curl -sI https://luthien.cc/` returns 200 from Cloudflare; `curl -sI https://luthienresearch.org/` returns 301 -> `https://luthien.cc/`; `scripts/reachability-check.sh luthien.cc` runs.

## Remaining Risk

- **The correctness monitor is not yet shipped.** Until it is, the only detector for a recurrence of this class is a human noticing an off-brand URL. This is the single most important open item and is deliberately not in this PR; if it is dropped, the class recurs.
- External artifacts already in the wild that link to `luthienresearch.github.io/luthien-pbc-site/` directly (if any were shared during the drift window) will not benefit from the canonical-domain fix.
- The accepted `.cc` ISP-filtering risk (April COE) persists for `luthien.cc` as canonical. `luthienresearch.org` is the fallback for filtered users, but only as a redirect, so a filtered user who lands on the `luthien.cc` redirect target is still stuck. Revisit if the reachability probe shows material filtering post-cutover.
- The orphaned `/about` and `/updates` content on `luthienresearch.org` is over a year old; until migrated or redirected, the Netlify carve-outs keep stale content live on a domain that otherwise redirects to the current site.

## Meta-observation

What this reveals: we reliably build liveness/reachability checks (does it answer? did the cron exit 0?) and reliably skip correctness checks (is it serving the right content? did it sync the right direction?). This is the fourth instance of "silent infra in a wrong state, no correctness monitor" (April reachability COE, May 7 sync silent-rot, drive-sync #2, now this). The April COE even shipped a monitor, and that monitor passed this broken state, which is the cleanest possible demonstration that reachability != correctness.

Is the COE process working? The detection layer is improving (the April monitor exists and runs), but the same root keeps recurring because each fix has been liveness-scoped. The test of whether this COE worked is whether the correctness monitor actually ships, not whether it is listed.

Process-adherence note: the first pass on this incident (before `/coe` was explicitly invoked) shipped the two PRs and a chat summary but omitted several required COE sections (Pattern table, codebase sweep, completeness checklist, formal meta-observation). They were completed only when `/coe` was run. Minor echo of the [2026-04-22 process-adherence meta-COE](./2026-04-22-coe-process-adherence.md): the full template needs to be run deliberately, not approximated.

## Relationship to the April 2026 reachability COE

This is a distinct incident with a distinct root cause. The [April COE](./2026-04-22-luthien-cc-unreachable.md) was about `luthien.cc` being unreachable on some networks (`.cc` TLD reputation). This COE is about the canonical domains serving the wrong thing (an unfinished platform-migration cutover). They intersect only in that this COE's canonical-domain decision (luthien.cc) closes the April COE's open "decide canonical domain" item, while knowingly re-accepting the reachability risk that item was meant to weigh.
