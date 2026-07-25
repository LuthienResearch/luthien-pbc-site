# Luthien PBC Website

Public website for [Luthien](https://github.com/LuthienResearch/luthien-proxy) — open-source AI control for coding agents.

## Quick Start

```bash
# Clone
git clone https://github.com/LuthienResearch/luthien-pbc-site.git
cd luthien-pbc-site

# View locally — just open in a browser
open site/index.html
```

No build step. No dependencies. Edit HTML, push, it's live.

## Structure

- `site/` — Everything that gets deployed (served as root by both Cloudflare Pages and GitHub Pages)
- `dev/` — Development tracking (objectives, notes, TODO)
- `scripts/` — Developer helpers
- `tracker-worker/` — Cloudflare Worker that logs `?ref=` clicks to Analytics Engine
- `tracker-dashboard/` — Cloudflare Worker serving `luthien.cc/_t`, the tracking dashboard

## Deployment

On push to main, `.github/workflows/deploy.yml` deploys `site/` to two origins:

- **Cloudflare Pages** (primary): serves `luthien.cc` and honors `site/_redirects`. The `luthien.cc` custom domain is configured in the Cloudflare Pages dashboard, not via a repo CNAME.
- **GitHub Pages** (fallback origin): a second HTTPS origin at `luthienresearch.github.io/luthien-pbc-site/` if Cloudflare is down.

## Tracking links

Append `?ref=<token>` to any `luthien.cc` URL to log a hit. View hits at
[`luthien.cc/_t`](https://luthien.cc/_t). Full guide:
[TRACKING.md](TRACKING.md).

## Related Repos

| Repo                                                              | Purpose                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| [luthien-proxy](https://github.com/LuthienResearch/luthien-proxy) | Core product (Python proxy)                                  |
| [luthien-org](https://github.com/LuthienResearch/luthien-org)     | Org docs, feedback synthesis, landing page iteration history |
| [luthien_site](https://github.com/LuthienResearch/luthien_site)   | Eleventy site at luthienresearch.org                         |

## License

Apache 2.0 — see [LICENSE](LICENSE)
