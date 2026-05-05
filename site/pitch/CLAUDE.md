# Pitch Deck Guidelines — `site/pitch/`

This file scopes deck-specific patterns. The site-wide rules (writing voice, design system pointer, branch + PR workflow, Trello conventions) live in the repo root `CLAUDE.md`.

The pitch deck is one HTML file (`index.html`) with multiple slide divs. Variations on the deck (different orderings for different audiences) live as URL query modes against the same file, NOT as duplicate files. This is the source of truth for what "live deck" means at any given URL:

- `luthien.cc/pitch` — the canonical deck (default, all slides in default order)
- `luthien.cc/pitch?mode=story` (and the redirect `luthien.cc/story` → `?mode=story`) — the Ivan-feedback playlist with future-of-work opener and reordered narrative
- Future modes (e.g. `?mode=apoorva`) follow the same pattern: same slide pool, different ordering / visibility

## Slide attribute conventions

Every `<div class="slide">` must have:

- **`data-slide-name`** — kebab-case identifier, used as the URL hash (`#problem-cto`, `#competitors-table`). Becomes the deep-link anchor and the hover-tooltip on the nav chip.
- **`data-slide-abbr`** — 1-3 character abbreviation rendered in the nav chip at the bottom-right. Should be content-derived (e.g. `93` for the 93-interviews slide, `LL` for the litellm incident, `S&J` for the Scott+Jai team slide), not generic categorical (avoid `T1`, `P3`, etc.). Two slides — `title` and `close` — intentionally have no abbr; the nav builder renders those as blank dots.
- **`data-stages="N"`** (optional) — for slides with progressive reveals. Used with `data-reveal="K"` on inner elements so pressing → on the slide steps through reveals before advancing to the next slide. The `problem-cto` slide is the canonical example.

## Combine slides via stage-builds before duplicating files

Three back-to-back single-headline slides (e.g. the original `luthien-solves-this` → `what-is-luthien` → `luthien-oneliner`) collapse cleanly into one slide with sequenced reveals. **Prefer combining over splitting.** Today's deck went 28 → 26 slides via two combines (intro trio; differentiation question + capabilities matrix), and the result reads tighter without losing content.

## Browser opens for iteration: always deep-link, always cache-bust

When iterating with Scott on a specific slide, always open the file with both a cache-buster query string AND the slide-name hash so he lands directly on the artifact under discussion:

```
open "file:///Users/scottwofford/build/luthien-pbc-site/site/pitch/index.html?_=$(date +%s)#<slide-name>"
```

The cache-buster is load-bearing. macOS `open` otherwise just brings the existing browser tab to front, and the deck's hash-navigation handlers (`hashchange`, `focus`, `pageshow`, `visibilitychange` — see the JS init around line 5040) don't always re-run when the URL hasn't changed. The `?_=<timestamp>` makes every URL unique, forcing a fresh page load + clean hash navigation on init.

For story-mode previews: `?mode=story&_=$(date +%s)#<slide-name>` (the `&` between mode and cache-buster is critical — `&` not `?`, since both are query params).

This rule applies every time you tell Scott to "open in browser" — single-slide tweaks, prototype comparisons, before/after demos. Compounds with the global "iterate one change at a time, deep-linked, wait for sign-off" rule.

*(Browser-open rule added 2026-05-05 after Scott twice told me "always open directly to the slide" mid-Manoj-prep when reload-without-cache-bust left him on slide 1. File scoped to `site/pitch/` 2026-05-05 to keep deck-specific patterns near the deck.)*

## Voice and content (pointer)

Voice rules for slide copy (no em dashes, complete sentences, real quotes with attribution, no AI-slop closers) live in the repo root `CLAUDE.md` under "Writing Voice (READ THIS BEFORE YOU WRITE ANY COPY)." Read that section before writing any new slide content. The Moat slide is the reference for tone; the problem slides are the reference for data-driven prose.

## Auto-generated PDF

`luthien.cc/pitch.pdf` is a Playwright-rendered PDF auto-built on every push touching `site/pitch/index.html` (via `.github/workflows/deck-pdf.yml`). The PDF flattens to one slide per page using the `@media print` rules in the deck's CSS. Never check in a PDF by hand; the workflow publishes it as a rolling release.
