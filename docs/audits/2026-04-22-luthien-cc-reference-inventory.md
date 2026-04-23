# luthien.cc reference inventory (swap-list)

**Date:** 2026-04-22
**Driven by:** Trello card [5mTdBda5](https://trello.com/c/5mTdBda5) / COE `docs/coes/2026-04-22-luthien-cc-unreachable.md` (PR #150)
**Purpose:** Mechanical inventory of every place `luthien.cc` appears across Luthien repos and Google Drive clones, so that when Jai/Scott pick a canonical domain the cutover is an edit pass rather than a scavenger hunt.

## Headline finding

**`telemetry.luthien.cc` is production code in luthien-proxy**, not just a marketing surface. Every deployed luthien-proxy install sends telemetry to `telemetry.luthien.cc` (Cloudflare Worker → Grafana Cloud). ISPs that reputation-block the `.cc` TLD are silently dropping telemetry traffic from those installs. That's a data-quality issue on top of the marketing-reachability issue.

This changes the cutover calculus: a domain swap has to be coordinated with a new telemetry subdomain and a default-URL update in `settings.py` for backward compatibility, not just "redirect luthien.cc → canonical."

## Sweep methodology

```bash
grep -rln "luthien\.cc" <repo-root>
```

Run against every `~/build/*` path that looked plausible. Counts below. Non-zero repos are itemized in the tables.

| Surface | Path | Matches |
|---------|------|---------|
| luthien-pbc-site (this repo) | `~/build/luthien-pbc-site/` | 14 files |
| luthien-proxy (code + docs) | `~/build/luthien-proxy/` | 5 files |
| luthien-org gdrive clone (source of truth is Google Drive; do not write locally) | `~/build/luthien-org/luth-gdrive-clone/` | 33 files |
| Scott's personal gdrive clone | `~/build/sw3-google-drive/drive/` | 12 files |
| luthien_site (Jai's Eleventy site at luthienresearch.org) | `~/build/luthien_site/` | 0 |
| personal-site | `~/build/personal-site/` | 0 |

**Out-of-scope surfaces** (not reachable from this audit; depend on Scott/Jai or external accounts):
- Cloudflare dashboard custom-domain config for Cloudflare Pages
- DNS records for `luthien.cc` and `telemetry.luthien.cc`
- GitHub repo descriptions / social preview cards / topic tags
- LinkedIn profiles, personal bios, email signatures in Gmail settings
- Slack workspace description, user profile, bookmarks
- Tally form confirmation emails
- GoatCounter analytics domain config
- Any PDFs already delivered to investors (frozen, cannot edit)
- External cold-email copy already sent
- Pitch-deck release assets on GitHub releases (tag `deck-latest`) — regenerated from source by CI, so swapping the source deck is sufficient
- Trajectory / Redwood / Salman / MATS / Great Filter / etc. LOIs already countersigned and delivered

## 1. `luthien-pbc-site` (this repo) — 14 matches

Already inventoried in the COE, reproduced here for completeness.

| File | What | Swap action |
|------|------|-------------|
| `site/index.html` | `og:url` + `og:image` + `twitter:image` meta tags | swap domain in all 3 tags |
| `site/about.html` | `og:url` + `og:image` + `twitter:image` | swap domain |
| `site/blog.html` | `og:url` + `og:image` + `twitter:image` | swap domain |
| `site/assets/images/og-image.svg` | literal text "luthien.cc" rendered into the social-preview card | **edit the SVG text** so OG card shows canonical domain |
| `site/pitch/index.html` (L3586) | `https://luthien.cc/frustrations/` link + "summary at luthien.cc/frustrations" anchor text | swap URL + anchor text |
| `site/pitch/index.html` (L4412) | close-slide anchor `https://luthien.cc` with class `close-link` | swap URL + anchor text |
| `site/pitch/es/index.html` (L2817) | Spanish close-slide anchor `https://luthien.cc` | swap URL + anchor text |
| `site/frustrations.html` | back-link "&larr; luthien.cc" | swap anchor text + href |
| `site/install.sh` (L3) | docstring `curl -fsSL https://luthien.cc/install.sh \| bash` | swap domain; update whatever publishes install.sh to the new canonical |
| `CHANGELOG.md` | historical entry v11.5 mentioning `https://luthien.cc/pitch.pdf` | historical — leave or annotate, don't retroactively rewrite history |
| `.github/workflows/deploy.yml` | comment "Primary: Cloudflare Pages (luthien.cc, honors site/_redirects for /pitch.pdf)" | update comment |

## 2. `luthien-proxy` — 5 files (includes PRODUCTION code)

| File | Line(s) | Kind | Swap action |
|------|---------|------|-------------|
| `README.md` | 107 | User-facing install command: `curl -fsSL https://luthien.cc/install.sh \| bash` | swap domain once install.sh is hosted on canonical |
| `README.md` | 262 | Docs: "Data is sent to `telemetry.luthien.cc` (a Cloudflare Worker)..." | swap subdomain reference after telemetry endpoint is moved |
| `changelog.d/telemetry-worker.md` | 6 | Historical changelog for the telemetry worker | historical; leave or annotate |
| `telemetry-worker/wrangler.jsonc` | 8-9 | **Cloudflare Worker config**: `"pattern": "telemetry.luthien.cc/*"`, `"zone_name": "luthien.cc"` | **Cannot swap in-place without DNS changes.** Requires setting up `telemetry.<canonical>` zone in Cloudflare, new Worker route, then flipping the config and redeploying the Worker. |
| `telemetry-worker/test/index.test.ts` | 35, 58, 137, 147, 179 | 5 hardcoded test URLs | swap after production endpoint moves |
| `src/luthien_proxy/settings.py` | 70 | `telemetry_endpoint: str = "https://telemetry.luthien.cc/v1/events"` (default pydantic setting) | swap default **after** the new telemetry endpoint is live, and ship as a minor version bump so in-flight installs pick up the new default on restart |

**Telemetry migration order** (to avoid dropping data):
1. Stand up `telemetry.<canonical>` Cloudflare Worker on the new zone.
2. Update Worker to accept events on both hostnames for a grace period.
3. Flip `settings.py` default + ship new luthien-proxy release.
4. Monitor `telemetry.luthien.cc` traffic; once it drops to zero or negligible, decommission.

Alternatively: do nothing on telemetry (keep `telemetry.luthien.cc` subdomain alive even after the marketing domain changes). `.cc` is only a reachability problem for consumer-ISP-filtered paths, and deployed luthien-proxy installs may be on networks that don't filter. But silent data loss on the ISPs that do filter will remain. Decision needed from Jai.

## 3. `luthien-org/luth-gdrive-clone` — 33 files (Google Drive source-of-truth; edit in Drive, not locally)

**⚠️ Do not edit locally.** `luth-gdrive-clone/` is a read-only rclone mirror; local writes are overwritten on the next sync. The corresponding Google Drive files must be edited by hand.

Grouped by purpose:

### LOIs (high priority; external partners clicking through)

| File | Likely pattern |
|------|----------------|
| `_Seldon_labs/Yoeri/Luthien_LOI_Template_live.md` | LOI template with "Learn more and try it: **luthien.cc**" |
| `_Seldon_labs/_Upwork-Dogfooding-Improvements/Copy of Trajectory ／ Luthien LOI.md` | same |
| `_Seldon_labs/_Yoeri & LOIs/Luthien_Trajectory_LOI.md` | same |
| `_Seldon_labs/_Yoeri & LOIs/Luthien_LOI_Template_live.md` | template |
| `_mtg notes/2-Redwood/Luthien_Redwood_LOI_DRAFT.md` | LOI |
| `_mtg notes/2-Redwood/Luthien_Redwood_LOI_v2.md` | LOI |
| `_mtg notes/2-Redwood/Luthien_Redwood_LOI.md` | LOI |
| `_mtg notes/2-Redwood/archive/Luthien_Redwood_LOI_DRAFT.md` | archived |

### Pitch materials / investor memos

| File |
|------|
| `_Seldon_labs/_Economics,Investors&Fundraising/_Investor-Memo/Mike/Memo with formatting (body) v2.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/_Investor-Memo/Mike/Memo with formatting (body) LIVE.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/_Investor-Memo/Danan/danan_agenda.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/Founders/Netholabs/Netholabs_Luthien_Agenda.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/Non-Binding Letters of Intent/Salman_Luthien_LOI.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/_pitch deck & materials/Elevator Pitch/-LIVE Explain Luthien in as few words as possible.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/_pitch deck & materials/seldon-pitch/LUTHIEN demo day script v8.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/Luthien Momentum Topics.md` |
| `_Seldon_labs/_Economics,Investors&Fundraising/Scot Frank (Great Filter Ventures) -- LinkedIn Exchange.md` |

### Meeting notes (lower priority; archived conversations)

| File |
|------|
| `_Seldon_labs/PBC Blog draft v2.md` |
| `_Seldon_labs/Cambridge Inference Collab/Cambridge Inference ／ Luthien — Apr 7, 2026.md` |
| `_Seldon_labs/Yoeri/Yoeri／Scott - Wed, March 18, 2026.md` |
| `_Seldon_labs/Yoeri/Yoeri／Scott - Wed, April 1, 2026.md` |
| `_Seldon_labs/_Upwork-Dogfooding-Improvements/stability-agenda-april14.md` |
| `_Seldon_labs/_Upwork-Dogfooding-Improvements/better-luthien-ui-agenda-april10.md` |
| `_Seldon_labs/_Upwork-Dogfooding-Improvements/stability-agenda-march31.md` |
| `_Seldon_labs/_Yoeri & LOIs/Luthien ／ Ryan Kidd Discussion Topics.md` |
| `_Seldon_labs/_Yoeri & LOIs/Yoeri／Scott - Wed, March 18, 2026.md` |
| `_Seldon_labs/_Yoeri & LOIs/Yoeri／Scott - Wed, Apr 8.md` |
| `_Seldon_labs/_Yoeri & LOIs/Yoeri／Scott - Wed, April 1, 2026.md` |
| `_mtg notes/3-Anthropic/Fabien Rogers ／ Luthien - April 1 Topics.md` |
| `_mtg notes/2-Redwood/Buck, Jai, Scott/Luthien update email for Buck.md` |

Strategy suggestion: **don't edit meeting notes.** They're historical records. Focus the manual Google Drive edit pass on (1) LOI templates (future-facing), (2) pitch materials, (3) investor memos. Leave meeting notes as-is.

## 4. `sw3-google-drive/drive` — 12 files (Scott's personal gdrive)

Same pattern: "Learn more and try it: **luthien.cc**" appears in LOI documents. Edit in Google Drive.

| File |
|------|
| `Luthien_Sondera_Discussion_Topics.md` |
| `danan_agenda.md` |
| `demo_day_script_v9.md.md` |
| `Luthien_MATS_LOI.md` |
| `MATS_LOI.md` |
| `Luthien_Redwood_LOI.md` |
| `Luthien_Business_Overview_Great_Filter.md` |
| `Trajectory_LOI.md` |
| `nathaniel_sauerberg_shared_agenda_v2.md.md` |
| `MACAW_Meeting_Prep.md` |
| *(plus 2 more; `grep -rln luthien\\.cc ~/build/sw3-google-drive/drive/`)* |

Highest priority subset: any LOI template that is still being sent to new prospects (MATS, Redwood, Trajectory, Sondera, Great Filter, MACAW, Nathaniel). Edit those in Google Drive before the next outbound send.

## Recommended cutover sequence

1. **Pick canonical domain** ([Trello XaSM8C8L](https://trello.com/c/XaSM8C8L); decision on Jai+Scott). This is the gating decision for everything else.
2. **Stand up new telemetry subdomain** on the canonical (e.g. `telemetry.<canonical>`). Update Worker to accept events on both old and new hostnames for a grace period.
3. **Ship luthien-proxy release** with new `settings.py` default telemetry endpoint. Verify new installs send to new endpoint.
4. **Set up Cloudflare Pages custom domain** for the canonical; configure `luthien.cc` → canonical 301 at the Cloudflare edge.
5. **Swap in-repo self-references** in luthien-pbc-site in a single PR (OG tags, SVG, pitch decks EN+ES, install.sh, frustrations.html, deploy.yml comment).
6. **Manual Google Drive edit pass**: active LOI templates + pitch materials first, then investor memos. Skip archived meeting notes.
7. **Manual external surfaces**: LinkedIn, Slack, email signatures, GitHub repo description, Tally form confirmations.
8. **Monitor telemetry** on `telemetry.luthien.cc` until it decays; then decommission.

Steps 1-5 are cleanly within engineering's control. Steps 6-7 are human manual work and will be ongoing drift — LOIs and memos in Google Drive will likely continue to accumulate `.cc` references if the template isn't updated, so step 6a specifically should be "update the LOI template FIRST."

## Out-of-scope notes

- **Pitch deck PDFs already delivered to investors:** frozen. Some number of investors have `.cc` links in their email archives. We cannot fix those; the 301 redirect is the only mitigation, and it only helps for the subset of ISPs that don't block the TLS handshake to `luthien.cc` itself.
- **GitHub release tag `deck-latest`:** auto-regenerated from `site/pitch/index.html` by CI. No separate edit needed once the source is updated.
- **`install.sh`:** the public install command is `curl -fsSL https://luthien.cc/install.sh | bash`. The `install.sh` script itself lives in `luthien-pbc-site/site/install.sh` and is served from luthien.cc. When cutover happens, both the install command (in README) AND the file's hosting location must move atomically.
