# Decisions

## Plain HTML, no build system (2026-02-26)

**Decision:** Use plain HTML/CSS/JS with no static site generator or build step.

**Why:**
- The landing page (landing_v8) is already self-contained (~57KB, all CSS/JS inline)
- No build = no "it works on my machine" — any AI agent can edit directly
- Matches personal-site pattern (proven workflow for Scott)
- Zero setup for new contributors — clone + open in browser

**Trade-off:** No component reuse, no templating. Acceptable for 1-2 pages. Revisit if site grows past 3-4 pages (Eleventy would be natural upgrade, matching luthien_site).

## Coexist with luthien_site for now (2026-02-26)

**Decision:** Create luthien-pbc-site as a separate repo from luthien_site (Jai's Eleventy site at luthienresearch.org).

**Why:**
- Different tech stacks (plain HTML vs Eleventy+Nunjucks)
- Different audiences (marketing vs technical docs)
- Avoids blocking on Jai coordination
- Can merge later once direction is clear

**Revisit:** When discussing domain strategy with Jai.

## GitHub Pages deployment (2026-02-26)

**Decision:** Deploy via GitHub Pages from `site/` subdirectory.

**Why:**
- Free, instant, zero config
- `site/` subdirectory keeps dev files out of production
- Can add custom domain later with a CNAME file
