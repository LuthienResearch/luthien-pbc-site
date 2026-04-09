# Repository Guidelines — luthien-pbc-site

## Purpose

Public website for Luthien (Public Benefit Corporation). Marketing landing page, QA trial instructions, and future pages.

**Tech stack:** Plain HTML/CSS/JS. No build system. Push to main = live via GitHub Pages.

## Sibling Repos

- **luthien-proxy** (`LuthienResearch/luthien-proxy`): The core product. Backend Python proxy.
- **luthien-org** (`LuthienResearch/luthien-org`): Private org docs, feedback synthesis, user interview notes. Landing page iteration history lives here.
- **luthien_site** (`LuthienResearch/luthien_site`): Jai's Eleventy site at luthienresearch.org. Relationship TBD — this repo may eventually replace or coexist with it.
- **personal-site** (`scottwofford/personal-site`): Scott's personal site. Previous home of the landing page (landing_v8).

## Project Structure

```
site/                        # Deployed to GitHub Pages (this is the root)
├── index.html               # Main landing page
├── incidents.html           # Linked incidents/quotes page
├── robots.txt               # Noindex for feedback/
├── assets/
│   └── images/              # All image assets
└── feedback/
    └── index.html           # QA trial instructions (noindexed)

dev/                         # Development tracking (not deployed)
├── OBJECTIVE.md             # Current objective
├── NOTES.md                 # Scratchpad
├── TODO.md                  # Backlog
└── context/
    ├── decisions.md          # Why we chose X over Y
    └── gotchas.md            # Non-obvious things

scripts/                     # Developer helpers
└── dev_checks.sh            # HTML validation
```

## Development Workflow

Same objective workflow as luthien-proxy:

1. Create/switch to feature branch
2. Update `dev/OBJECTIVE.md`
3. Make changes, commit frequently
4. Push to origin, open draft PR
5. When done: update `CHANGELOG.md`, clear `dev/OBJECTIVE.md` and `dev/NOTES.md`, mark PR ready
6. **Update the version tracking doc:** Every new landing page version MUST get a row added to `luthien-org/ui-fb-dev/2-versions-requirements/1.1-landing-page-versions.md` (version summary table) + a changelog entry at the bottom. Commit and push to luthien-org as part of the same work session.

## Creating a New Landing Page Version

**Never edit a released version directory in-place.** Once a version is on main, it's frozen. New changes get a new version directory.

Checklist:
1. Create `site/vX.Y.Z/` directory
2. Copy ALL files from the previous version directory (index.html AND all images: SVGs, PNGs, JPGs)
3. Make your changes in the new directory
4. Update `site/index.html` redirect to point to the new version
5. Verify locally: open the page in a browser and confirm all images load (no broken placeholders)
6. Update the version tracking doc in luthien-org

**COE reference:** Images were broken on v10.9.1 for 3 days because only index.html was copied, not the image files. Esben Kran (Seldon/Apart) reported it.

## Editing Pages

- All pages are self-contained HTML with inline CSS/JS
- Images live in `site/assets/images/`
- Reference images with relative paths: `assets/images/filename.ext`
- No build step — edit HTML directly, push, it's live
- Test locally by opening `site/index.html` in a browser

## Adding New Pages

1. Create `site/new-page/index.html` (directory + index.html for clean URLs)
2. **Follow the shared design system** — colors, fonts, layout patterns, and voice/tone are documented in `luthien-org/ui-fb-dev/design-system.md` (the cross-surface source of truth). For the in-repo Lumen branding specifics (palette hex codes, type scale, iconography), see `site/v12/lumentheme-branding-guideline.md`.
3. Link from the main nav if appropriate

## Deployment

- **GitHub Pages** deploys from `site/` directory on the `main` branch
- Push to main = live (via `.github/workflows/deploy.yml`)
- Custom domain can be added later via `site/CNAME`

## One PR = One Concern

Same rule as luthien-proxy: keep PRs focused. Bug fix? Separate PR. New page? Separate PR.
