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
├── about.html               # About / team page
├── blog.html                # Blog index
├── blog/                    # Blog posts (each in own directory)
├── incidents.html           # Linked incidents/quotes page
├── robots.txt               # Noindex for feedback/
├── assets/
│   └── images/              # All image assets (SVGs, PNGs, etc.)
├── feedback/
│   └── index.html           # QA trial instructions (noindexed)
└── hackathon/
    └── index.html           # Hackathon page

dev/                         # Development tracking (not deployed)
├── OBJECTIVE.md             # Current objective
├── NOTES.md                 # Scratchpad
├── TODO.md                  # DEPRECATED — task tracking is in Trello now
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

## Editing Pages

- All pages are self-contained HTML with inline CSS/JS
- Images live in `site/assets/images/`
- Reference images with relative paths: `assets/images/filename.ext`
- No build step — edit HTML directly, push, it's live
- Test locally by opening `site/index.html` in a browser

## Adding New Pages

1. Create `site/new-page/index.html` (directory + index.html for clean URLs)
2. **Follow the shared design system** — colors, fonts, layout patterns, and voice/tone are documented in `luthien-org/ui-fb-dev/design-system.md` (the cross-surface source of truth). For the in-repo Lumen branding specifics (palette hex codes, type scale, iconography), see `dev/lumentheme-branding-guideline.md`.
3. Link from the main nav if appropriate

## Deployment

- **GitHub Pages** deploys from `site/` directory on the `main` branch
- Push to main = live (via `.github/workflows/deploy.yml`)
- Custom domain can be added later via `site/CNAME`

## One PR = One Concern

Same rule as luthien-proxy: keep PRs focused. Bug fix? Separate PR. New page? Separate PR.

## Writing Voice (READ THIS BEFORE YOU WRITE ANY COPY)

The full voice/tone source of truth lives in `luthien-org/ui-fb-dev/design-system.md` (section: "Content credibility / No AI slop irony" and "Anti-Patterns"). Read it before writing any user-facing copy. The rules below are the non-negotiables Scott has called out most often:

**Do:**
- **Write complete sentences.** No fragments. "Devs install it on Monday." is not a sentence you would say to a person, so do not put it on a slide.
- **Substantiate every claim.** If you assert something, either cite a primary source (quote with attribution + link) or tie it to a number already shown on another slide. Vague framings like "whose whole pitch was 'built for developers'" read as filler and get cut in review.
- **Match the voice of the existing slides.** The Moat slide is the reference: real quote, real attribution, real date, followed by a complete sentence explaining why the fact matters. The Problem slides are the reference for data-driven prose (12 hours autonomous, 45-second increments, because of specific named risks).
- **Prefer named third-party sources** over your own synthesis. "According to SuperTokens' analysis" beats "the real reason Okta paid this is..."
- **Use straight quotes** `"like this"`, not curly `"like this"`. The design system explicitly flags curly quotes as AI-slop.

**Do not:**
- **No em dashes anywhere.** `&mdash;` and `—` are banned. Use a period, a semicolon, or parentheses. The design system calls this "AI slop irony" (R6, Quentin S3). This rule applies to new copy you are adding, even if you see em dashes in existing slides that have not been cleaned up yet.
- **No punchy one-liner closers** like "Devs install it on Monday. The CISO signs the contract on Friday." That is fabricated comedy, and the design system explicitly says "the real quotes ARE the humor, don't add AI-generated filler between them" (Round 4 lesson).
- **No editorialized framing you cannot cite.** "Okta paid this to buy what they couldn't build" is a synthesis I cannot attribute, so it is out. If the slide makes a claim, a reviewer should be able to click through to a source that makes the same claim in almost the same words.
- **No curly quotes, no AI-generated preamble, no fabricated UI, no fictional class names.**
- **No generic phrases** like "developer-first mindset" when a specific quote or metric exists.

**If you catch yourself writing a sentence that is more memorable than informative, delete it.** The slide should read like something an experienced operator would actually say out loud to another operator, not like a pitch-template Mad Lib.

*(Added 2026-04-11 after the Auth0 slide had to be rewritten three times to remove em dashes, curly quotes, a fabricated "couldn't build" framing, and a fabricated Monday/Friday closer.)*
