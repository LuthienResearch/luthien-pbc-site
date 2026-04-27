# CHANGELOG

## Version History

| Version | Date | Summary |
|---------|------|---------|
| v12.2 | 2026-04-27 | Short URL: `/toc` 301-redirects to `/blog/theory-of-change/` via Cloudflare Pages `_redirects`. For sharing the theory-of-change post in conversations and decks. |
| (docs)  | 2026-04-22 | Meta-COE on `/coe` process adherence (PR #151): the first two attempts at running `/coe` on the luthien.cc reachability incident degraded (chat-only, then TODO.md-written). This PR documents both failures and lands the documentation updates (mark `TODO.md` deprecated in CLAUDE.md; update `/coe` skill step 7 to use Trello; two feedback memories) that should prevent recurrence. Companion: PR #150 (luthien.cc reachability COE). |
| (docs)  | 2026-04-22 | RCA filed for luthien.cc reachability (PR #150): domain fails TLS on T-Mobile Home Internet and at least one other consumer ISP due to `.cc` TLD reputation / ISP middlebox SNI filtering. SSL Labs verified Cloudflare edge config clean. Added `docs/coes/` directory with COE + index, TLD-reputation gotcha, and 6 Trello action-item cards. No site content changed. |
| v12.1 | 2026-04-20 | Pitch deck date refresh: replace relative day-of-week language on traction slide with absolute dates; reconcile Trajectory PR count (9 since pilot started Sun Apr 12); remove 416 lines of dead archived-presentation-slides template (PR #144) |
| v12 | 2026-04-15 | Simplified pitch for Seldon Demo Day: distribution-playbook table, failure catalog, static ratio bar, autobiographical team, Trajectory-led traction (PR #116) |
| v11.5 | 2026-04-14 | Auto-generated pitch deck PDF: Playwright CI builds `luthien-deck.pdf` from `site/pitch/index.html` on every change, published as a rolling GitHub release and exposed at `/pitch.pdf` via Cloudflare Pages `_redirects`. Added "Download PDF" link on the deck. Dropped unused GitHub Pages fallback deploy. |
| v11.4 | 2026-04-11 | Pitch deck CTO slide: replace card grid with McKinsey 4-5x hero stat + composite CTO voice split (PR #90) |
| v11.3 | 2026-04-08 | Switch primary CTA from "View on GitHub" + curl install to "Apply for beta" (Tally form). Remove public curl install everywhere. Addresses investor concern about public GitHub star count. |
| v10.6 | 2026-03-09 | Address Josh Levy's agentic feedback: add long-session and multi-session persistence language to hero + architecture section |
| v10.5 | 2026-03-05 | Feedback synthesis from S14/S15 user interviews; footer tagline ("Power is nothing without control") |
| v10 | 2026-02-26 | Initial repo migration from scottwofford.com/luthien/landing_v8/ |

## 2026-04-20

- v12.1: Pitch deck date refresh. An investor flagged stale relative-date language on the traction slide ("signed on Tuesday", "signed on Friday", "10 Luthien PRs on Sunday"). Replaced with absolute dates matching the footnote convention already in use: "signed Tue Apr 14" (Trajectory), "signed Fri Apr 10" (Redwood). Reconciled the Trajectory PR count: card said "10", footnote said "9". Queried luthien-proxy (author sjawhar): 12 submitted, 9 currently open, 0 merged. Copy now reads "9 Luthien PRs since pilot started on Sun Apr 12" (pilot start = date of Sami's first PR). Also deleted 416 lines of dead HTML in `<template id="archived-presentation-slides">` which held 6 inert slides (competitive, traction-table, market, gtm, quotes, second ask) that the browser never rendered. (PR #144)

## 2026-04-15

- v12: Simplified pitch deck for Seldon Demo Day (Thu Apr 16). Rewrote 7 slides and deleted 2 per Scott and Jai's Apr 14 redesign session. Key changes: (1) Replaced Auth0 distribution slide with "Do things that don't scale" comparison table (Supabase, HashiCorp, Luthien). (2) Replaced McKinsey/CTO-voice problem-cto with 2x3 failure catalog grid (deleted code, hallucinated APIs, shipped security holes, etc.). (3) Replaced problem-widget iframe with static 12h-vs-45s ratio bar. (4) Rewrote team slide with autobiographical framing. (5) Rewrote traction from funnel to Trajectory Labs lead + Redwood LOI table. (6) Refreshed GTM with "do things that don't scale" framing. (7) Collapsed competitive matrix rows 5-6. (8) Added pricing sub-line to ask slide. (9) Deleted Redwood case-study slide (folded into traction). Narrative arc: title, team, problem-dev, problem-cto, how-it-works, competitive, defensibility, market, distribution-playbook, gtm, traction, quotes, ask, close (14 slides). (PR #116)

## 2026-04-14

- v11.5: Auto-generated pitch deck PDF pipeline. New workflow `.github/workflows/deck-pdf.yml` runs Playwright against `site/pitch/index.html` on every push touching the deck, producing a 1280×720 text-searchable PDF. Output is published as a rolling GitHub release under tag `deck-latest`. Cloudflare Pages `site/_redirects` exposes a stable URL at `https://luthien.cc/pitch.pdf` (302 to the release asset). Added "Download PDF" link on the deck top-right controls. Added `@media print` rules so the slide stack flattens to one-slide-per-page for both the automated build and native browser print. Removed the GitHub Pages fallback job from `deploy.yml` (Cloudflare is the only deploy target now, which is what makes `_redirects` work).

## 2026-04-11

- v11.4: Pitch deck CTO problem slide (slide 4) redesigned. Replaced "Lost potential" / "Security risk" card grid + problem-widget iframe with a facts-vs-feeling split. Left half: hero 4-5x stat (McKinsey Developer Velocity Index, April 2020) with verbatim pull quote and linen McKinsey wordmark chip. Right half: three-beat composite CTO voice with verdigris accent on the emotional turn. Headline tightened to "Lost revenue. Unacceptable risk." Full McKinsey citation in slide-footnotes. (PR #90)

## 2026-04-08

- v11.3: Switch primary CTA across nav, hero, and "get started" section from "View on GitHub" + visible curl install to "Apply for beta" (linked to Tally form). Keep "Book a setup call" as secondary hero CTA. Keep GitHub icon in nav and GitHub link in footer (standard open-source convention). Motivation: Finn flagged that investors will read 18 GitHub stars as weak adoption signal — repositioning as private beta signals selectivity instead of low traction.

## 2026-03-09

- v10.6: Add "whether it's minute one or hour ten" to hero differentiator; add compaction/multi-session persistence line to architecture section. Addresses Josh Levy's Slack feedback that Luthien felt focused on chat/one-off interactions.
- Footer tagline: "Power is nothing without control." linking to Pirelli ad (PR #8)

## 2026-02-26

- Initial repo setup: landing page (from landing_v8), QA trial instructions, GitHub Pages deployment
- Migrated from scottwofford.com/luthien/landing_v8/ to standalone repo
