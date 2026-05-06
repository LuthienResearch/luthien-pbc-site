# tracker-worker

Cloudflare Worker that logs tracking-link hits to Analytics Engine.

## How it works

The worker is bound to specific paths on `luthien.cc` (see `wrangler.jsonc`).
When a request arrives with a `?ref=<token>` query param, it logs the hit
(timestamp, token, path, UA, referrer, country, colo, ASN) to the
`luthien_tracker_hits` Analytics Engine dataset and then transparently
forwards the request to the GitHub Pages origin.

Without `?ref=`, the worker is a passthrough.

`?ref=` is free-form: you do not pre-register tokens. Pick any string and
share the link.

## Sharing a link

Append `?ref=<token>` to any tracked URL.

```
https://luthien.cc/pitch?ref=anthropic-2026-05
https://luthien.cc/pitch.pdf?ref=scott-vc-intro
```

Use whatever convention you want for tokens. A reasonable default is
`<recipient>-<context>-<yymm>`.

## Tracking a new path

Add a route to `wrangler.jsonc` and redeploy:

```jsonc
"routes": [
  { "pattern": "luthien.cc/pitch",     "zone_name": "luthien.cc" },
  { "pattern": "luthien.cc/pitch/*",   "zone_name": "luthien.cc" },
  { "pattern": "luthien.cc/pitch.pdf", "zone_name": "luthien.cc" },
  { "pattern": "luthien.cc/feedback",  "zone_name": "luthien.cc" }  // new
]
```

## Local dev

```bash
npm install
npm test            # vitest, runs in miniflare
npm run dev         # wrangler dev, proxies to a local origin or the live site
```

## Deploy

```bash
npm run deploy      # wrangler deploy
```

The Analytics Engine dataset (`luthien_tracker_hits`) is created on first
write; no separate provisioning step.

## Querying hits

Analytics Engine is queried via Cloudflare's SQL API. Set up an API token
with `Account Analytics: Read` and run, e.g.:

```sql
SELECT
  blob1 AS ref,
  count() AS hits,
  min(timestamp) AS first_seen,
  max(timestamp) AS last_seen
FROM luthien_tracker_hits
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY blob1
ORDER BY hits DESC
```

Schema:

| field   | meaning                       |
| ------- | ----------------------------- |
| index1  | ref token (sampled by ref)    |
| blob1   | ref token                     |
| blob2   | request path                  |
| blob3   | user-agent (truncated 256 ch) |
| blob4   | referrer (truncated 256 ch)   |
| blob5   | country (CF geo)              |
| blob6   | CF colo                       |
| blob7   | AS organization               |

## Risk model

The worker sits on the request path of the routes in `wrangler.jsonc`. Any
exception in the logging path is caught and the request falls through to a
plain origin fetch, so a logging bug cannot break the site. A bad worker
deploy can; redeploy or `wrangler delete` to roll back.
