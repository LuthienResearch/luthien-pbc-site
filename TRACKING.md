# Tracking links

End-to-end guide for the `?ref=` tracking system on `luthien.cc`. Read this
first if you want to share a tracked link, view hits, onboard a teammate,
or debug something.

For the per-component internals see [`tracker-worker/README.md`](tracker-worker/README.md)
and [`tracker-dashboard/README.md`](tracker-dashboard/README.md).

## TL;DR

- **Share a tracked link:** append `?ref=<token>` to any `luthien.cc` URL.
  Token is free-form, no registration. Example: `https://luthien.cc/pitch?ref=anthropic-2026-05`.
- **View hits:** https://luthien.cc/_t — sign in with the dashboard
  username/password.
- **AE has ~60s consistency lag.** Hits show up within a minute, not
  instantly.

## Architecture

```
recipient clicks https://luthien.cc/pitch?ref=anthropic-2026-05
        │
        ▼
  Cloudflare edge — routes by URL pattern
        │
        ├── /_t, /_t/*    →  luthien-tracker-dashboard worker
        │                    (auth-gated UI + AE proxy)
        │
        └── /*            →  luthien-tracker worker
                             - if ?ref= present: log to AE, then fetch origin
                             - else: transparent passthrough
                             ↓
                        GitHub Pages (site/ in this repo)
```

Two Cloudflare Workers, one Analytics Engine dataset:

| Worker                       | Source                  | Route               | Job                                         |
| ---------------------------- | ----------------------- | ------------------- | ------------------------------------------- |
| `luthien-tracker`            | `tracker-worker/`       | `luthien.cc/*`      | Log `?ref=` hits to AE; passthrough origin  |
| `luthien-tracker-dashboard`  | `tracker-dashboard/`    | `luthien.cc/_t*`    | Cookie-auth UI to query AE                  |

AE dataset: `luthien_tracker_hits`. Schema in
[`tracker-worker/README.md`](tracker-worker/README.md#querying-hits).

## Sharing a tracked link

```
https://luthien.cc/<any-path>?ref=<token>
```

Tokens are free-form strings. No registration, no code change. Pick any
convention. A reasonable default is `<recipient>-<context>-<yymm>`.

Examples:
- `https://luthien.cc/pitch?ref=anthropic-bizdev-2026-05`
- `https://luthien.cc/pitch.pdf?ref=scott-vc-intro`
- `https://luthien.cc/deck?ref=mats-cohort-april`

Anything sharper or pithier works too: `?ref=alice` is fine if you don't
need provenance later.

## Viewing hits

Open https://luthien.cc/_t and sign in. The summary table shows one row
per `ref` token with hits, first/last seen, country count, and path
count. Click any row to drill down into individual hits (timestamp,
path, country, UA).

For ad-hoc queries against the raw dataset, see
[`tracker-worker/README.md`](tracker-worker/README.md#querying-hits) for
the SQL API and a sample query script.

## Onboarding a new admin

A new person who needs to view the dashboard:

1. Get their username and password from whoever set up the dashboard
   (the secrets are stored only in Cloudflare and known to whoever ran
   `wrangler secret put DASH_USER` / `DASH_PASS`).
2. Send them https://luthien.cc/_t. They sign in once and the browser
   prompts to save the password.

There's currently only one shared `DASH_USER` / `DASH_PASS`. If you need
per-person logins, switch to Cloudflare Access (Zero Trust) instead.
That's a bigger lift; do it when there's a real reason (audit trail,
revocation, SSO).

## Maintenance

### Rotating the dashboard password

```bash
cd tracker-dashboard
echo "new-password" | npx wrangler secret put DASH_PASS
```

Effective within seconds. Existing sessions keep working until they
expire (30 days) or `SESSION_SECRET` is rotated.

### Rotating SESSION_SECRET (force-logout everyone)

```bash
cd tracker-dashboard
openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET
```

Every existing session cookie immediately becomes invalid; everyone has
to sign in again.

### Rotating the AE_API_TOKEN

Create a fresh account-owned token at
https://dash.cloudflare.com/3b64ed6e5367ead1f221c01a17592b19/api-tokens
with `Account Analytics: Read`, then:

```bash
cd tracker-dashboard
npx wrangler secret put AE_API_TOKEN   # paste the new token
```

Revoke the old token in the same UI.

### Adding a new tracked path

Already done — the tracker is bound to `luthien.cc/*`, so any path on
the site is tracked when `?ref=` is present. No code change needed for
new pages.

### Smoke test after a deploy

```bash
cd tracker-dashboard
DASH_USER=... DASH_PASS=... npm run smoke
```

Hits each API endpoint shape and asserts 200 + parseable JSON. Catches
AE SQL regressions that the unit tests can't (AE has no offline
parser).

## Debugging

### "I shared a link and it doesn't show in the dashboard"

Check in order:

1. **Did your URL include `?ref=`?** No `?ref=` = no log.
2. **Is the page on `luthien.cc`?** The tracker only binds to that
   hostname. `luthien.cc/foo` works; `luthienresearch.org/foo` doesn't.
3. **Have you waited ~60s?** AE writes are eventually consistent.
4. **Is the worker still deployed?**
   ```
   curl -sI https://luthien.cc/<path>?ref=test | head -5
   cd tracker-worker && npx wrangler tail luthien-tracker
   # then hit the URL again and watch for "tracker hit path=..."
   ```
   The current worker doesn't log on the happy path; if you need
   visibility, temporarily add `console.log` and redeploy.

### "Dashboard returns AE error"

```bash
cd tracker-dashboard
DASH_USER=... DASH_PASS=... npm run smoke
```

Look at which endpoint failed and the AE error body. Most failures are
the worker's SQL drifting against AE's restricted ClickHouse subset.
Past landmines:

- `toString(...)` — not supported. Drop the cast; AE returns `DateTime`
  as a string in JSON automatically.
- `groupUniqArray(...)`, `uniq(...)` — not supported. Use
  `count(DISTINCT col)`.
- `ORDER BY <col>` when `<col>` is also aliased in `SELECT` — fails with
  "unable to find type of column." Use the alias in `ORDER BY`.

### "Dashboard returns 503"

A required secret is missing. Check the four:

```bash
cd tracker-dashboard
npx wrangler secret list
```

Should show `DASH_USER`, `DASH_PASS`, `AE_API_TOKEN`, `SESSION_SECRET`.

### "Dashboard shows no hits even though I just clicked a link"

Almost always AE's eventual consistency window. Wait ~60s and refresh.
If still empty after 2 minutes, run the smoke test — that proves the
API path is healthy and tells you whether it's a tracker-side issue
(no rows being written) or a query-side issue (rows there, query
returning empty).

## Costs and limits

Both workers are on the Cloudflare free Workers plan plus the free
Analytics Engine tier:

- **Workers:** 100k requests/day per worker. Trivial for our volumes.
- **Analytics Engine writes:** 10M/month free. We won't get within
  three orders of magnitude.
- **Analytics Engine reads via SQL API:** generous free tier; the
  dashboard makes 1-2 reads per page load.
- **AE retention:** ~3 months on the free tier. If you need longer,
  export to D1 or another store on a schedule.

## Privacy

Each hit logs: ref token, request path, user-agent (truncated 256 ch),
referrer (truncated 256 ch), country, CF datacenter (`colo`),
AS organisation. **No IP, no fingerprint.** That's deliberate — AE
gives you these fields cheaply and they're enough to know "this link
was opened twice from the US and once from the UK," which is the
question you'll actually have.

If a recipient asks why they appeared in your tracking and you want to
purge their hits, you can't — AE doesn't support row-level deletes on
the free tier. The right answer is "this is a click counter, like
Bitly; the only data we have is which token was clicked, where in the
world, and on what kind of browser."

## Related

- [`tracker-worker/README.md`](tracker-worker/README.md) — passthrough worker internals
- [`tracker-dashboard/README.md`](tracker-dashboard/README.md) — dashboard auth + setup
- [Memory: Luthien Cloudflare](../../.claude/projects/-home-jai-projects-clai/memory/luthien_cloudflare.md) (Jai's auto-memory) — account ID, API token URLs, deployed workers
