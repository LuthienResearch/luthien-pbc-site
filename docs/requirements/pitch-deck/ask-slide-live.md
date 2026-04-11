# Pitch Deck — Ask Slide Live Requirements

**Owner:** Scott
**Last updated:** 2026-04-11
**Feedback source:** [Apr 11 Momentum call with Esben Kran + Finn Metz + Sean Pan](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit?tab=t.ssaq5vqv77j8)
**Source of truth for the deck:** [`site/pitch/index.html`](../../../site/pitch/index.html)

---

## What this doc is

The **single source of truth** for what the Ask slide needs to do. We've iterated on the Ask + Angels slides six times in one day, which is too many, because we were arguing from opinion instead of from requirements. This doc is the fix.

Requirements come from the Apr 11 Momentum call (Esben + Finn) and from the earlier Apr 11 Mike/Scott deck review. Each requirement is traced to a verbatim quote in Appendix A so we can re-litigate specific claims without re-arguing the whole slide.

**Feedback lives elsewhere** — this doc links to it but doesn't duplicate the full transcript:
- [Apr 11 Momentum call transcript](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit?tab=t.ssaq5vqv77j8) — Esben + Finn
- [Apr 11 Mike/Scott deck review transcript](https://docs.google.com/document/d/1Dgft4fieWf0IgnET0B1o9ZqHyqptRRo4OGarwb8nA-k/edit) — Mike, earlier in the day

---

## Every version of this slide

Reverse-chronological, most recent first.

| Version | Date | What it was | Commit | Who saw it | Feedback |
|---|---|---|---|---|---|
| **v7 — 5 concept mockups** | Apr 11 | Comparison page with 5 layout directions (A two-row logo bar, B three recency columns, C momentum arrow with face dots, D logo-first matrix, E two summary stacks). Served at `/tmp/ask-concepts.html` for visual picking. | prototype only, not in repo | Scott | "put together some requirements because this is really frustrating" → this doc. |
| **v6 — Faces + credentials for notable angels** | Apr 11 | 9 face row with per-angel credential line. Guillermo shows "CPO @ R2 (YC W21), acq. by Ant International". Photos link to LinkedIn; R2/Amazon Fraud Detector/Buy with Prime credentials link to source pages. | [`cbb35e0`](https://github.com/LuthienResearch/luthien-pbc-site/commit/cbb35e0) on `merge-angels-ask` | Scott | Too crowded compared to the ruthlessly-minimal target. Led to "group by recency and by logo" ask. |
| **v5 — Text-only simplification** | Apr 11 | No faces at all. One paragraph: "9 angels committed in the past 10 days, including 4 ex-Amazon product leaders and the first angel, Guillermo Bravo (CPO at R2, acquired)." | [`b5e5a09`](https://github.com/LuthienResearch/luthien-pbc-site/commit/b5e5a09) on `merge-angels-ask` | Scott | Too minimal. Scott: "keep the faces, but for notable people include relevant stuff." |
| **v4 — Merged Angels + Ask (full face row)** | Apr 11 | `$2M Pre-Seed` hero + 3 date-grouped rows (2025 / Fri Apr 10 / Sat Apr 11) of face circles with Amazon logos on ex-Amazon folks. 50/30/20 engineering/growth/infrastructure cards removed. | [`3e0f46e`](https://github.com/LuthienResearch/luthien-pbc-site/commit/3e0f46e) on `merge-angels-ask` | Scott, Finn (verbal) | Finn: "separated by day looked odd." Led to v5 strip. |
| **v3 — Separate Angels slide + Ask slide** | Apr 11 | Two slides: (1) "Angels" with 3 date-grouped rows of 9 faces, non-profit grant row below (Ryan Kidd, Manifund, SFF, AISTOF); (2) "$2M Pre-Seed" with 50/30/20 breakdown cards. | [`6dd09ca`](https://github.com/LuthienResearch/luthien-pbc-site/commit/6dd09ca) on `mike-scott-apr11-fb` | Esben, Finn | **Esben:** "that's a lot of angel investors... too much, I don't know any of these." **Finn:** "over-indexing on momentum... amount raised so far is not overwhelmingly impressive in money terms." Led to merge + strip. |
| **v2 — 9-card founder grid** | Apr 11 | Cards in a 9-column grid, each with photo, name, "Angel Investor" role, dynamic "committed yesterday/today" badge, title, company logo, LinkedIn icon. Non-profit grant section below. | [`eda1823`](https://github.com/LuthienResearch/luthien-pbc-site/commit/eda1823) on `mike-scott-apr11-fb` | Esben | Esben: "you can probably just say 'angel investors from' and then add all the logos they're from"; "reduce words"; "cut" non-profit grant section. |
| **v1 — 4-card founder grid + 50/30/20 Ask slide** | Apr 11 (earlier) | 4 angels only (Guillermo, Tom, Chris Porter, Beth Anne Porter) in a grid with full titles + LinkedIn + non-profit grant row. Separate Ask slide with 50% Engineering / 30% Growth / 20% Infrastructure breakdown. | Pre-`mike-scott-apr11-fb` | Mike Mantell, Scott | Mike: CTO perspective should drive the problem; merge angels + ask in a follow-up. |

---

## Requirements

Gathered from Esben + Finn on Apr 11. Each row traces to a verbatim quote in [Appendix A](#appendix-a-what-esben-and-finn-actually-said).

| # | Requirement (problem only) | Current state as of Apr 11 | Key evidence |
|---|---|---|---|
| **R1** | <u>Minimize visual overwhelm.</u> The angel section on the Ask slide must not read as "a wall of faces." Small image + name is the baseline; every extra decoration has to earn its place. | v6 has 9 faces + names + credentials + logos + LinkedIn icons all visible at once. Esben called v3 (simpler than v6) "a lot of angel investors... too much." | [A1](#a1-esben-on-visual-overwhelm). |
| **R2** | <u>Credibility must come from affiliation, not recognition.</u> The target investor is assumed not to know any of these angels personally. Whatever credential the slide shows must be something the investor can evaluate without recognizing the person (a company name, a role, a proof of exit). Whether that credential appears *with* or *without* a face is a design decision, not a requirement. | v6 pairs a face with a text credential. The *content* (affiliation visible) is required; the *form* (face yes/no, list vs grid, logo vs wordmark) is open to the designer within the other constraints. | [A2](#a2-esben-on-logos-as-the-credential). |
| **R3** | <u>Reduce words.</u> Labels like "angel investor" and "committed yesterday" are redundant — the slide title already says "Angels." Cut copy that restates context. | v3 and v6 both include "Angel Investor" role text under every card and a "committed yesterday" badge. | [A3](#a3-esben-on-reducing-words). |
| **R4** | <u>Group by recency *and* by logo.</u> Two dimensions matter: *when* (momentum narrative — the 10-day burst) and *where from* (credibility — the 4 ex-Amazon cluster, the YC-acquired CPO). The slide should make both dimensions legible without dominating the layout. | v3/v4 grouped by day only. v5 killed grouping entirely (text paragraph). v6 is un-grouped faces. No version has shown both dimensions at once. | [A4](#a4-scott-asking-for-two-axis-grouping). |
| **R5** | <u>Don't over-index on momentum.</u> $19K committed is not impressive in dollar terms; leading with it on a dedicated slide undersells. Mention recent closes *briefly* on the Ask slide and leave urgency for email + verbal pitch. | v3 dedicated a full slide to angels; v4/v5/v6 have progressively less angel content. v6 is closest to "briefly" but the face row still dominates the slide. | [A5](#a5-finn-on-not-over-indexing-on-momentum). |
| **R6** | <u>One credibility anchor minimum.</u> If the slide shows any person in detail, it must be "the most impressive individual" — someone whose title alone signals credibility (Finn's example: "CTO at YC-backed startup"). Guillermo Bravo (CPO at R2, YC W21, acq. by Ant International) is the current anchor. | v5 calls out "Guillermo Bravo (CPO at R2, acquired)" in the paragraph. v6 shows his face + credential inline. Both meet this requirement. | [A6](#a6-finn-on-one-credibility-anchor). |
| **R7** | <u>Accessible detail, not visual-forced detail.</u> Full per-angel data (LinkedIn, exact title, achievements, dates) must be reachable (links, footnotes, hover) but must not compete for attention with the headline `$2M Pre-Seed`. | v6 exposes all details inline. v5 hides most details. The right answer is "reachable behind a click," not "forced into the viewport." | [A7](#a7-scott-on-accessible-vs-overwhelming). |
| **R8** | <u>No non-profit grant logos.</u> Non-profit grant funding (Manifund, SFF, AISTOF, Ryan Kidd personal donation) must not appear as logos or look like strategic partnerships. Acceptable: a single line of text like "supported by $200K+ in grants from AI safety funders" buried below the angel section or footnoted. Not acceptable: logo row. | Removed in v4 onward. Re-adding as text is optional. | [A8](#a8-esben-on-nonprofit-grants-as-negative-signal). |
| **R9** | <u>Day-by-day grouping is a visual anti-pattern.</u> Splitting the angels into three date rows (2025 / Fri / Sat) reads as odd. Use count summaries or logo clusters instead. | v3 and v4 both used day rows. Finn + Jennifer both flagged them. v5, v6, and the concept mockups avoid day rows. | [A9](#a9-finn--jennifer-on-day-by-day-grouping). |
| **R10** | <u>The slide merges Ask + Angels.</u> There is one slide, not two. Headline is `$2M Pre-Seed`. Angel momentum is a supporting element, not a co-equal peer. The 50/30/20 engineering/growth/infra breakdown is cut. | Merged in v4. The 50/30/20 cards were cut in v4. This requirement is met in all versions from v4 forward. | [A10](#a10-finn-on-consolidating-ask--angels). |

### Questioning the requirements

Open *requirements* questions I need Scott to resolve before re-implementing. These are not design-decision questions — face yes/no, card-vs-list, grid-vs-flex, and similar layout choices belong to the designer within the constraints above.

1. **How many angels must be individually named?** R6 says "one credibility anchor minimum." R4 says "show both recency and affiliation." A minimum-viable slide could name only Guillermo and show counts for the rest. A maximum slide names all 9. Somewhere between is probably right. Does the answer change per audience (demo-day projector vs investor email)?
2. **Are missing company logos a hard blocker?** Only the Amazon logo is in repo. R2 (the YC company), HelloFresh, SeekOut, Sproutron AI, Habitat Health, LIFE In The Air are all missing as SVG assets. Options: (a) ship with styled text wordmarks for the missing ones; (b) spend ~20 minutes fetching real logos; (c) use only the Amazon logo and text wordmarks for everyone else.
3. **Should we name grant funders as text (R8's "acceptable" path) or cut them entirely?** Esben said either works. Scott's preference not yet recorded. If text, where does it live on the slide?
4. **Does Guillermo's title need "YC W21, acq. by Ant International" verbatim, or just "CPO at an acquired YC-backed startup"?** R6 only demands "most impressive title." The full acquisition detail strengthens credibility but lengthens the credential line.
5. **Is the investor deck read on a projector, in a browser tab, or both?** R7 (accessible detail) changes meaning between the two. Projector audience can't click; browser reader can. If both, the slide has to be legible at a glance *and* have accessible detail behind clicks.

---

## Appendix A: What Esben and Finn actually said

Verbatim pull quotes from the [Apr 11 Momentum call transcript](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit?tab=t.ssaq5vqv77j8). Timestamps link to the transcript anchors.

### A1: Esben on visual overwhelm

> **Esben Kran:** "Yes. That's a lot of angel investors." ([10:47](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:10:47))

> **Esben Kran:** "I don't know any of these. If it was like Andrej Karpathy or something, you know, it would be like 'oh okay awesome, definitely include Andrej Karpathy.'" ([10:47](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:10:47))

### A2: Esben on logos as the credential

> **Esben Kran:** "You can probably just say 'angel investors from' and then add all the logos they're from, or something like this is — you know, this is too much." ([10:47](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:10:47))

### A3: Esben on reducing words

> **Esben Kran:** "I think the most straightforward thing is to have small image, name. I mean you already say there are angel investors at the top. So like you don't need to say 'angel investor committed yesterday, etc.' They're angels. They invested. So you can say title and then LinkedIn." ([12:13](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:12:13))

> **Scott Wofford:** "So maybe just 'angels' in general. I'm trying to reduce words." ([12:13](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:12:13))
> **Esben Kran:** "Yeah."

### A4: Scott asking for two-axis grouping

Scott in a chat message on Apr 11 after the call, deciding to build concept mockups:

> "ok so let's give me some minimalist design concepts. the idea is to group by recency and by Logo"

This wasn't on the Esben call, but it codifies Esben's two suggestions (logos per company affiliation + first-angel-committed-yesterday cadence) as explicit design axes.

### A5: Finn on not over-indexing on momentum

(From the Gemini meeting summary — Finn joined later in the call after Esben left.)

> "Finn advised against over-indexing on momentum in the slides because the amount raised so far is not overwhelmingly impressive in money terms. The consensus was to mention the recent closing of angels briefly in the 'ask' slide, and to mention it verbally or in emails to investors to convey urgency and recentness, rather than dedicating a full slide to it."

### A6: Finn on one credibility anchor

> "Finn suggested limiting the focus on the slide and instead including only the most impressive individuals, such as the face of Gammo with the title 'CTO at YC backed startup,' to signal credibility."

### A7: Scott on accessible vs overwhelming

Scott, explaining the deck's detail strategy to Esben:

> **Scott Wofford:** "I already have their LinkedIns and in general the my strategy is just like all the details in the deck if you want to, like, you know, read my investment memo or like click on my sources, like go crazy. And so I'm wondering visually, how have you seen it done so it's that the detail is accessible however it's not like overwhelming visually." ([10:47](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:10:47))

### A8: Esben on nonprofit grants as negative signal

> **Scott Wofford:** "And how about this nonprofit grant funding?" ([12:13](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:12:13))
> **Esben Kran:** "Cut it."

> **Esben Kran:** "I mean you could write like... it's like 'supported by 200k+ in grants from AI safety' or yeah, who knows? And like you don't need the logos."

> **Esben Kran:** "Basically I mean it's similar to what we chatted about at some point. Like if I as an investor see someone who's not interested in profit investing in this, then it's a negative signal. Like literally negative signal. It is good to know that you guys have won 200k in grants. It is not good for me to like think that this is a strategic partnership you have with these grants makers." ([13:34](https://docs.google.com/document/d/1Jes9RHU18XGWTpC2jKgqO6gr9WqEj1trcBtgXLziuDI/edit#00:13:34))

### A9: Finn + Jennifer on day-by-day grouping

(From the Gemini meeting summary — Jennifer Baik joined near the end.)

> "The team discussed the slide intended to convey momentum, which Jennifer Baik and Scott Wofford both disliked, suggesting that separating items by day looked odd."

### A10: Finn on consolidating Ask + Angels

> "The consensus was to mention the recent closing of angels briefly in the 'ask' slide, and to mention it verbally or in emails to investors to convey urgency and recentness, rather than dedicating a full slide to it."

Explicit action item from the call's Next Steps section:

> **[Scott Wofford] Update Pitch Deck:** Revise pitch deck content based on feedback. Remove the separate angel slide and consolidate momentum details into the ask slide.

---

## Appendix B: 5 Whys — Why we have so many versions of one slide

1. **Why did the Ask slide take 6+ iterations in one day?** Because each iteration responded to a different reviewer's verbal feedback without checking it against the other reviewers' feedback or against explicit requirements.
2. **Why were reviewers contradicting each other?** They weren't (much) — Esben and Finn mostly agreed. The contradictions were between *reviewer feedback* and *Scott's mid-iteration requests* (e.g., "keep the faces, but for notable people include relevant stuff" after Esben said "just show logos").
3. **Why was there no requirements anchor?** Because the whole deck shipped in one big PR without a per-slide requirements doc. When a new piece of feedback came in, the only reference was "what the slide looked like yesterday," not "what the slide is supposed to do."
4. **Why didn't we just write the requirements on the first pass?** Because the deck was a rapid-response artifact for a Monday investor push. Speed was prioritized over a requirements anchor.
5. **Root problem:** Without a requirements doc, we were making UI decisions on vibe. Each change sounded defensible on its own but invalidated the previous defensible change. This doc exists to break that loop. From now on, every Ask-slide change references a specific Rn here, or it waits until the requirement is updated.
