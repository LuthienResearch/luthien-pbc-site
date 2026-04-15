# CHANGELOG

## Version History

| Version | Date | Summary |
|---------|------|---------|
| v12 | 2026-04-15 | Simplified pitch for Seldon Demo Day: distribution-playbook table, failure catalog, static ratio bar, autobiographical team, Trajectory-led traction (PR #116) |
| v11.4 | 2026-04-11 | Pitch deck CTO slide: replace card grid with McKinsey 4-5x hero stat + composite CTO voice split (PR #90) |
| v11.3 | 2026-04-08 | Switch primary CTA from "View on GitHub" + curl install to "Apply for beta" (Tally form). Remove public curl install everywhere. Addresses investor concern about public GitHub star count. |
| v10.6 | 2026-03-09 | Address Josh Levy's agentic feedback: add long-session and multi-session persistence language to hero + architecture section |
| v10.5 | 2026-03-05 | Feedback synthesis from S14/S15 user interviews; footer tagline ("Power is nothing without control") |
| v10 | 2026-02-26 | Initial repo migration from scottwofford.com/luthien/landing_v8/ |

## 2026-04-15

- v12: Simplified pitch deck for Seldon Demo Day (Thu Apr 16). Rewrote 7 slides and deleted 2 per Scott and Jai's Apr 14 redesign session. Key changes: (1) Replaced Auth0 distribution slide with "Do things that don't scale" comparison table (Supabase, HashiCorp, Luthien). (2) Replaced McKinsey/CTO-voice problem-cto with 2x3 failure catalog grid (deleted code, hallucinated APIs, shipped security holes, etc.). (3) Replaced problem-widget iframe with static 12h-vs-45s ratio bar. (4) Rewrote team slide with autobiographical framing. (5) Rewrote traction from funnel to Trajectory Labs lead + Redwood LOI table. (6) Refreshed GTM with "do things that don't scale" framing. (7) Collapsed competitive matrix rows 5-6. (8) Added pricing sub-line to ask slide. (9) Deleted Redwood case-study slide (folded into traction). Narrative arc: title, team, problem-dev, problem-cto, how-it-works, competitive, defensibility, market, distribution-playbook, gtm, traction, quotes, ask, close (14 slides). (PR #116)

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
