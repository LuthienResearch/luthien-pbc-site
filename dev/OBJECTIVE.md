# Pitch deck: date refresh + PR count reconciliation

## Scope

Investor flagged stale date references at luthien.cc/pitch. Replace relative day-of-week language with absolute dates on the two traction slides, and reconcile the PR count (9 vs 10) to match luthien-proxy reality (9 open, 12 submitted, 0 merged).

### Edits (all in `site/pitch/index.html`)

1. Line 4194: `signed on Tuesday` -> `signed Tue Apr 14`
2. Line 4200: `10 Luthien PRs on Sunday.` -> `9 Luthien PRs in pilot week.`
3. Line 4208: `signed on Friday` -> `signed Fri Apr 10`
4. Line 4486: `implemented this week` -> `implemented during pilot week`
5. Line 4498: `Signed Apr 2026` -> `Signed Fri Apr 10`
6. Line 4536: `LOI signed Apr 2026` -> `LOI signed Fri Apr 10, 2026`

## Out of scope

- Traction-number refresh (`9 LOIs in pipeline / 14 live trials / 50-150 seats` vs spreadsheet's 4 signed + 11 pipeline / $524K-$1.14M). Separate pitch-strategy session.
- TBD pricing row on competitors slide (line 4112).
- Trajectory Labs $60K ARR (slide 26) vs $5K MRR (slide 30 appendix) framing. Scott has reviewed: different slides, different metrics, intentional.
