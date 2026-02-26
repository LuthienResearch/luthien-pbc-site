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

- `site/` — Everything that gets deployed (GitHub Pages root)
- `dev/` — Development tracking (objectives, notes, TODO)
- `scripts/` — Developer helpers

## Deployment

GitHub Pages auto-deploys from `site/` on push to main.

## Related Repos

| Repo | Purpose |
|------|---------|
| [luthien-proxy](https://github.com/LuthienResearch/luthien-proxy) | Core product (Python proxy) |
| [luthien-org](https://github.com/LuthienResearch/luthien-org) | Org docs, feedback synthesis, landing page iteration history |
| [luthien_site](https://github.com/LuthienResearch/luthien_site) | Eleventy site at luthienresearch.org |

## License

Apache 2.0 — see [LICENSE](LICENSE)
