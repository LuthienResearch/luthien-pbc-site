# tracker-dashboard

Web dashboard for the `luthien_tracker_hits` Analytics Engine dataset
populated by the sibling `tracker-worker/`. Lives at
[`luthien.cc/_t`](https://luthien.cc/_t).

Single-page HTML + vanilla JS, served from a Cloudflare Worker. The worker
also proxies a small JSON API at `/_t/api/hits` that runs SQL against AE.

## Auth model

Cookie-based sessions. The login form at `/_t/login` is a real HTML form
with proper `autocomplete` attributes, so password managers can save and
refill cleanly. Submitting the form sets an HMAC-signed session cookie
(`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/_t`, 30-day TTL).

HTTP Basic Auth still works as a fallback for scripts and curl, so the
smoke script and any automation continue to work without going through
the form.

## First-time setup

The worker is deployed but needs four secrets before it does anything
useful.

### 1. Create a Cloudflare API token

At https://dash.cloudflare.com/3b64ed6e5367ead1f221c01a17592b19/api-tokens
(account-owned, preferred) create a custom token with this permission:

- **Account → Account Analytics → Read**

Scope it to the Luthien account. Copy the token.

### 2. Set the four worker secrets

```bash
cd tracker-dashboard
npm install   # if you haven't already

# Pick a username and password for the dashboard.
echo "your-username"   | npx wrangler secret put DASH_USER
echo "your-password"   | npx wrangler secret put DASH_PASS

# Paste the API token from step 1 when prompted.
npx wrangler secret put AE_API_TOKEN

# Random 32+ byte secret used to sign session cookies.
openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET
```

Rotating `SESSION_SECRET` invalidates every existing session.

### 3. Open the dashboard

Visit https://luthien.cc/_t. You'll be redirected to a login form. After
signing in you'll see one row per `ref` token with hits, first/last seen,
country count, path count. Click a row to drill down into individual hits
(timestamp, path, country, UA).

## URLs

| URL                                            | What                                  |
| ---------------------------------------------- | ------------------------------------- |
| `https://luthien.cc/_t`                        | HTML dashboard                        |
| `https://luthien.cc/_t/api/hits?days=30`       | JSON summary, per-ref aggregate       |
| `https://luthien.cc/_t/api/hits?ref=foo&days=7`| JSON drill-down for a single token    |

`days` is clamped to `[1, 365]` and defaults to 30. `ref` is whitelisted to
`A-Za-z0-9._@:+-` before being injected into the AE SQL string.

## Local dev

```bash
npm test          # vitest, 13 tests
npm run dev       # wrangler dev — needs .dev.vars with the same three secrets
```

`.dev.vars` is gitignored. Format:

```
DASH_USER=local
DASH_PASS=local
AE_API_TOKEN=...
```

## Deploy

```bash
npm run deploy
DASH_USER=... DASH_PASS=... npm run smoke   # post-deploy verification
```

`npm run smoke` hits the live API endpoints and asserts each query shape
returns 200 + parseable JSON. AE has no offline SQL parser, so this is the
practical "did I just break a query" check. Run it after every deploy.

## Rotating credentials

```bash
echo "new-pass" | npx wrangler secret put DASH_PASS
```

The change takes effect within a few seconds, no redeploy needed.

## Why a separate worker

The tracker-worker sits on the critical path of `luthien.cc/pitch*` and
must stay tiny and bug-free. The dashboard has more surface area (auth,
HTML rendering, AE proxy), so it's isolated to its own worker on a
disjoint route. A bug here cannot affect tracking.
