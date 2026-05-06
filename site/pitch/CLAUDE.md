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

## Browser opens for iteration: drive Chrome via AppleScript, NOT `open`

When iterating with Scott on a specific slide, you must force-navigate the active Chrome tab to the slide. **Do NOT use macOS `open file://...`** — `open` brings the existing tab to front but does not reliably re-navigate when the URL differs only by hash + cache-buster, which is the common case in this loop. Verified failure mode: 2026-05-06 traction-slide iteration where four consecutive `open` calls left Scott on the previously-active slide while Playwright (which loads in a fresh process) confirmed the URL itself works.

Use this AppleScript form instead. Wrap in a Bash heredoc so the shell expands `$(date +%s)` and the slide name:

```bash
URL="file:///Users/scottwofford/build/luthien-pbc-site/site/pitch/index.html?_=$(date +%s)#<slide-name>"
osascript <<EOF
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then
    make new window
  end if
  set URL of active tab of front window to "$URL"
end tell
EOF
```

`set URL of active tab` forces Chrome to navigate even when the URL string is identical to what's loaded, which is what we want for iteration.

The cache-buster is still load-bearing as a belt-and-suspenders: it forces a true page reload (not just hash navigation) so JS re-runs the mode-routing + hash handlers on init. The `?_=<timestamp>` makes every URL unique. The slide-name hash anchors the deck's `slideIndexFromHash` JS to the right slide on init.

For story-mode previews: `?mode=story&_=$(date +%s)#<slide-name>` (the `&` between mode and cache-buster is critical — `&` not `?`, since both are query params).

This rule applies every time you tell Scott to "open in browser" — single-slide tweaks, prototype comparisons, before/after demos. Compounds with the global "iterate one change at a time, deep-linked, wait for sign-off" rule.

If Scott uses a different default browser later, swap `Google Chrome` for the relevant app name (Safari uses `set current tab's URL`, not `URL of active tab`).

*(Initial rule added 2026-05-05 after Scott twice said "always open directly to the slide" mid-Manoj-prep when reload-without-cache-bust left him on slide 1. Hardened 2026-05-06 after `open` was verified insufficient: switching to AppleScript-driven navigation is the only reliable mechanism observed.)*

## Voice and content (pointer)

Voice rules for slide copy (no em dashes, complete sentences, real quotes with attribution, no AI-slop closers) live in the repo root `CLAUDE.md` under "Writing Voice (READ THIS BEFORE YOU WRITE ANY COPY)." Read that section before writing any new slide content. The Moat slide is the reference for tone; the problem slides are the reference for data-driven prose.

## Auto-generated PDF

`luthien.cc/pitch.pdf` is a Playwright-rendered PDF auto-built on every push touching `site/pitch/index.html` (via `.github/workflows/deck-pdf.yml`). The PDF flattens to one slide per page using the `@media print` rules in the deck's CSS. Never check in a PDF by hand; the workflow publishes it as a rolling release.
