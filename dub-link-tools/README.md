# dub-link-tools

CLI helpers for [Dub.co](https://dub.co) link minting on `l.luthien.cc`.

This is a parallel evaluation system, running alongside the in-house
`tracker-worker` + `tracker-dashboard`. See [`../TRACKING.md`](../TRACKING.md)
for the existing system. Both can coexist; they live on different domains
and don't interfere.

## Why this exists

Devil's-advocate review of the in-house tracking system flagged that
**Dub Cloud's free tier is minutes to set up and eliminates ~9 categories
of in-house work** (SQL injection surface, home-rolled cookie crypto,
manual smoke tests, single-shared-password access control, etc.). This
folder is for evaluating Dub side-by-side without disrupting what
already works.

The trade is link shape: `l.luthien.cc/anthropic` vs.
`luthien.cc/pitch?ref=anthropic`. Same-domain is a real advantage for
high-trust shares (pitches to AI labs); short-domain is fine for casual
shares.

## One-time setup

### 1. Create the Dub account

1. Sign up at https://app.dub.co/register using `jai@luthienresearch.org`.
2. Create a workspace (the prompt is unavoidable). Name it `Luthien` or
   similar.

### 2. Add the custom domain

In the Dub dashboard:

1. Go to **Settings → Domains → Add Domain**.
2. Enter `l.luthien.cc`.
3. Dub will tell you to add a CNAME record.

In **Cloudflare** (https://dash.cloudflare.com/3b64ed6e5367ead1f221c01a17592b19/luthien.cc/dns/records):

1. Click **Add Record**.
2. **Type:** `CNAME`
3. **Name:** `l`
4. **Target:** `cname.dub.co`
5. **Proxy status:** **DNS only** (grey cloud — *not* the orange one). Dub
   needs to terminate SSL itself; CF proxy mode breaks the cert flow.
6. **TTL:** Auto.
7. Save.

Back in Dub, click **Verify**. Propagation is usually under a minute on
Cloudflare; up to 24h in pathological cases.

### 3. Generate an API key

1. In Dub, go to **Settings → Tokens → Create Token**.
2. Name it `cli`.
3. Scope: full access (or read+write on links).
4. Copy the token.

In `dub-link-tools/`:

```bash
echo 'DUB_API_KEY=dub_xxxxxxxxxxxxxxxxxxxxxxxx' > .env
```

(`.env` is gitignored.)

## Usage

### Mint a link

```bash
./mint.sh <slug> <destination-url>
# e.g.
./mint.sh anthropic-2026-05 https://luthien.cc/pitch
./mint.sh scott-vc-intro    https://luthien.cc/pitch.pdf
```

Output:

```
  short:        https://l.luthien.cc/anthropic-2026-05
  destination:  https://luthien.cc/pitch
  qrcode:       https://api.dub.co/qr?url=...
  dashboard:    https://app.dub.co/links/<id>
```

Share the `short` URL.

### List links and click counts

```bash
./list.sh
```

For real analytics (geo, UA, referrer, time series), open
https://app.dub.co — Dub's dashboard is the source of truth.

## Free tier limits

- **25 new links/month.** If you mint a lot of bespoke per-recipient links
  this gets tight. Pro is $24/mo for 1k/mo.
- **3 custom domains.** Plenty.
- **30-day analytics retention.** Less than AE's ~3 months.
- **1 user seat.** Only Jai can sign in to the Dub dashboard. Other
  Luthien folks would need a paid plan to share the dashboard, OR you
  share the API key and they call `list.sh`.
- **API access:** included.

The tight one is link count + 1 user. If both bind, Pro is the answer.

## Comparison vs. in-house

| Concern                  | In-house (`luthien.cc/*?ref=`) | Dub (`l.luthien.cc/<slug>`)         |
| ------------------------ | ------------------------------ | ----------------------------------- |
| Link shape               | `luthien.cc/pitch?ref=foo`     | `l.luthien.cc/foo` (302 → pitch)    |
| Same-domain advantage    | yes                            | no (extra hop)                      |
| Setup time               | hours of yak-shaving           | ~5 minutes once account exists      |
| Click analytics          | custom dashboard at /_t        | Dub's dashboard                     |
| QR codes                 | no                             | yes, auto-generated                 |
| A/B link splits          | no                             | yes (Pro)                           |
| Geo / UA / referrer      | yes (AE blobs)                 | yes                                 |
| Retention                | ~3 months (AE free tier)       | 30 days (Dub free tier)             |
| Access control           | one shared password            | per-person Dub login                |
| Maintenance burden       | SQL drift, smoke scripts       | Dub's problem                       |
| Per-month link cap       | unlimited (~10M AE writes/mo)  | 25 free / 1k Pro / 50k+ enterprise  |
| Link expiration          | no                             | yes                                 |
| API for minting          | edit wrangler.jsonc + deploy   | one curl call                       |

## Cleanup if Dub doesn't pan out

```bash
rm -rf dub-link-tools/
# delete the CNAME record in Cloudflare DNS
# delete the workspace in Dub (or just stop using it)
```

Nothing in this folder touches the in-house tracker.
