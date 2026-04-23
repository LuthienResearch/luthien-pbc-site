# luthien.cc — Design Audit

**Date:** 2026-04-22
**Auditor:** Claude (Opus 4.7) — automated capture + opinionated visual review
**Scope:** 14 routes (12 marketing + EN/ES pitch decks). 28 EN slides, 13 ES slides, all marketing pages at desktop (1440×900) + mobile (375×812). Audit done against the worktree at `~/build/luthien-pbc-site-design-audit/site/` served locally on `:8765` (production luthien.cc was unreachable from this network — the documented `.cc`-TLD SNI/middlebox issue from PR #150).
**Screenshots:** `/tmp/luthien-audit-2026-04-22/` (transient).

---

## TL;DR — three highest-leverage changes

1. **`/feedback/` is on a different planet from the rest of the site.** Inter font, near-black `#09090b` bg, gray text, blue links — zero Lumen. It's the first impression for a trial user and it doesn't look like Luthien. Either re-skin to Lumen *or* explicitly mark it as an internal QA tool that no public link should ever point to. (P0)
2. **Pitch deck has a credibility-corroding number conflict on consecutive slides.** Slide 6 says **"93 USER INTERVIEWS"**, slide 7 footer says **"Luthien's 36 recorded interviews"**. An investor will catch this in 4 seconds. Either reconcile the numbers or annotate the relationship (e.g., "93 conversations / 36 recorded"). (P0)
3. **Brand drift in small, fixable places weakens the whole.** Tailwind-default colors on home filter pills, inconsistent border-radius scale (4/5/6/8/10/14px in one stylesheet), three different base font sizes across pages (16px / 17.6px / 17.92px), and `nav-setup` rounded while `nav-gh` square *inside the same nav*. Centralize tokens — the existing TODO of extracting `assets/css/shared.css` is the right move and gets stronger every week it slips. (P1)

---

## Quick wins (P0 micro-fixes)

These are 5–30 minute fixes with disproportionate impact. Each is concrete enough to file as a Trello card and assign.

### QW-1 — Fix the stale URL in `/feedback/` Part 3
- **File:** `site/feedback/index.html` Part 3 link (`<a class="big-link" href="https://luthienresearch.github.io/luthien-pbc-site/">`).
- **Issue:** Links interview participants to the *old* GitHub Pages subdomain instead of `https://luthien.cc/`. Looks like a domain migration was missed.
- **Fix:** Change `href` to `https://luthien.cc/`. Also update visible text from `luthienresearch.github.io/luthien-pbc-site/` to `luthien.cc`.
- **Why it matters:** Trial users walk through Part 3 testing the *current* site. A stale URL signals "they don't sweat the details" right at the moment we're asking them to.

### QW-2 — Re-skin `/feedback/` to Lumen (or hide it)
- **File:** `site/feedback/index.html` (the entire `<style>` block).
- **Issue:** Page is built on a Tailwind/Vercel-style palette: `body { background: #09090b; color: #d4d4d8; font-family: 'Inter' }`, blue links `#6b9fff`, white nav-gh `#fafafa`. None of it is Lumen.
- **Fix:** Either (a) port to Lumen tokens — replace Inter→Raleway+Lora, `#09090b`→`#141216`, `#d4d4d8`→`#EDE5D8`, `#6b9fff`→`#3B9494`, `#71717a`/`#52525b`→`#9891A8`/`#7A7290`; or (b) keep as-is but add `<meta name="robots" content="noindex">` (already there) and ensure the `noindex` is the policy (no public links inbound). Trial users get the link directly via outreach.
- **Why it matters:** This is the *trial onboarding* experience. Visual brand inconsistency at first contact reads as "early-stage scrappy" — fine if intentional, expensive if not.

### QW-3 — Reconcile "93 interviews" vs "36 recorded interviews" in pitch
- **File:** `site/pitch/index.html` slides `data-slide-name="problem-interviews"` and `data-slide-name="problem-cto"`.
- **Issue:** Slide 6 asserts "93 USER INTERVIEWS"; slide 7's footer says "Luthien's 36 recorded interviews · Twitter · Reddit · Hacker News · GitHub Issues · Cursor Forum · 26k data points total". Adjacent slides, inconsistent number for the same thing.
- **Fix:** Pick one and reconcile. Likely truth: 93 conversations total, 36 of which are recorded. Make slide 7 footer say "36 recorded · 57 unrecorded · 26k passive data points total" (or whatever the reconciliation is) so the math adds up.
- **Why it matters:** Investors stress-test numbers. A back-to-back inconsistency on the *same* metric loses trust on slides 6–7 and contaminates every later number.

### QW-4 — Replace Tailwind palette in homepage filter pills with Lumen
- **File:** `site/index.html` `.filter-pill[data-filter="..."].active` rules (around line ~700–740 of the stylesheet).
- **Issue:** Five non-Lumen colors hardcoded as filter-pill themes:
  - `deleted` → `#ef4444` (Tailwind red-500) — should be `#C45050` (Signal Red)
  - `ignored` → `#C47B42` ✓ (Lumen Amber, OK)
  - `hallucinated` → `#3B9494` ✓ (Lumen Verdigris, OK)
  - `security` → `#34d399` (Tailwind emerald-400) — not in Lumen
  - `cheated` → `#a78bfa` (Tailwind violet-400) — not in Lumen
  - `coverup` → `#fb923c` (Tailwind orange-400) — not in Lumen
- **Fix:** Map the off-Lumen pills to Lumen tones. Lumen has 5 hues; you have 6 categories. Either collapse two categories (e.g. `cheated` + `coverup` → "deception") or extend Lumen with one new accent and document it. Don't ship the Tailwind defaults.
- **Why it matters:** Homepage is the most-seen page; the Problem section is the thing people screenshot. Three off-brand colors on the most quoted block undercuts brand discipline everywhere else.

### QW-5 — Single base font-size across the site
- **Files:** `site/index.html`, `site/about.html`, `site/blog.html` use `html { font-size: 17.6px }`. `site/frustrations.html` uses `16px`. `site/pitch/index.html` uses `112%` (~17.92px). `site/feedback/index.html` and `site/blog/*` inherit defaults.
- **Issue:** Three different base sizes means every `rem` unit drifts between pages. Body copy on `/frustrations` is ~10% smaller than on `/`. Same `1rem` button is different sizes across pages.
- **Fix:** Pick one (recommend 16px — standard, accessible, no surprises) and apply globally. Convert all `rem`s to keep visual sizes constant. Or, if you genuinely want larger projector-friendly text on the pitch deck, keep `112%` only there and standardize everything else on 16px.
- **Why it matters:** Sets up a real shared design system; without consistent base size, no token-based system can give consistent output.

### QW-6 — `.btn` border-radius contradicts Lumen "sharp corners"
- **Files:** `site/index.html`, all marketing pages with `.btn { border-radius: 4px }`.
- **Issue:** `dev/lumentheme-branding-guideline.md` says: *"Buttons … Shape: Sharp corners"*. Implementation has `border-radius: 4px`. Pick one.
- **Fix:** Either update the guideline to "4px subtle radius" (matches reality) or update buttons to `border-radius: 0` (matches the spec). The internal nav `.nav-gh` is already `border-radius: 0`, while `.nav-setup` is `border-radius: 4px` — they live three lines apart in the same nav and disagree.
- **Why it matters:** Tiny visual decision but it appears 50+ times across the site and the brand guide is in the repo claiming the opposite. Pick one and align.

### QW-7 — Hyphen-as-em-dash typography slips in `/feedback/`
- **File:** `site/feedback/index.html`.
- **Issue:** Multiple instances of `-word` patterns where en/em-dash is intended but a regular hyphen with no space-before is used:
  - "Walk through our product as a new user. Think aloud the whole time -we want the good, the bad, and the ugly."
  - "Introduce yourself -where did you grow up?"
  - "Then, give us a 30-second tour of your dock or taskbar -what's open"
- **Fix:** The design system says no em-dashes. Per spec, replace with a period or comma (sentence break) — *not* a space-bracketed dash. So: "the whole time. We want the good, the bad, and the ugly." and "Introduce yourself. Where did you grow up?"
- **Why it matters:** Reads as typo and reinforces the "/feedback/ is off-brand" impression.

---

## Cross-cutting findings (affect ≥3 pages)

### CC-1 — No shared stylesheet; ~80% CSS duplication across pages
- **Pages:** `index.html`, `about.html`, `blog.html`, `frustrations.html`, `hackathon/index.html`, all blog posts. Each page redefines the same `.top-nav`, `.nav-link`, `.nav-setup`, `.nav-gh`, `.container`, `body`, `h1/h2/h3`, `a`, `.divider`, `footer`, etc. with minor drift.
- **Concrete drift examples found:**
  - `body { font-size }` base varies (17.6px / 16px / 112%)
  - `footer { margin-top }` is 48px on `/`, 58px on `/blog.html`
  - `nav-link` color is `#9891A8` on most pages but `#52525b`/`#a1a1aa` on `/feedback/`
  - `hr.divider` border color is `#28243A` everywhere, but on `/feedback/` it's `#27272a`
- **Fix (already in your TODO):** Extract `assets/css/shared.css` with: tokens (CSS custom properties for color, type, spacing, radius), reset, base typography, `.top-nav`, `.nav-*`, `.container`, `footer`, `.divider`, `.btn-*`. Import on every page. Keep page-specific styles inline only for genuinely page-specific blocks (testimonial cards, pitch slides).
- **Why it matters:** Every drift listed above is a downstream symptom of this. Until shared.css exists, you'll keep re-fixing the same things.

### CC-2 — Border-radius scale is inconsistent (no "ladder")
- **Pages:** Most. Observed values: 0px, 2em, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 50%.
- **Fix:** Pick a 3-step ladder and stick to it. Standard would be: `--radius-sm: 4px; --radius-md: 8px; --radius-pill: 999px; --radius-circle: 50%`. Ban any other value via review.
- **Why it matters:** Inconsistent radii is the #1 thing that makes a site feel "made by committee."

### CC-3 — Section padding uses ad-hoc values, not a spacing scale
- **Pages:** Most. Observed `section` paddings: 28px, 32px, 40px, 48px, 60px, 80px, 110px, 120px, 180px (hero top).
- **Fix:** Define `--space-{1..12}` on a 4px or 8px grid. Use only those. Hero top of 180px is overcompensating for the 58px fixed nav — could be cleaner with `padding-top: calc(var(--nav-h) + var(--space-10))`.
- **Why it matters:** Vertical rhythm currently feels uneven across pages — Frustrations has tight gaps while About feels loose.

### CC-4 — Decorative section-reveal animation breaks PDF-to-image flows
- **Pages:** `/`, anywhere using `.section-reveal`.
- **Issue:** `.section-reveal { opacity: 0; transform: translateY(16px); }` until IntersectionObserver adds `.visible`. This means: (a) any PDF print of the homepage shows blank middle sections; (b) my own audit-capture script needed a `force-visible` workaround; (c) anyone with JS disabled or strict reduced-motion sees a half-blank page (the reduced-motion media query handles this for `.section-reveal` but only by `opacity: 1` — confirm it works).
- **Fix:** Use `@keyframes` with `animation-fill-mode: both` triggered by IntersectionObserver *adding* the animation, instead of using opacity:0 as the default. Or: use `animation: fadeIn 0.5s both;` on `.section-reveal` directly — it'll play once on load and then stay visible regardless of scroll.
- **Why it matters:** Currently your homepage is print-broken and screen-reader-fragile. Low risk to fix.

### CC-5 — "Apply for beta" CTA is the only conversion path, and it's a Tally iframe
- **Pages:** `/`, `/about.html`, `/blog.html` nav.
- **Issue:** Single CTA is good (focus). But the underlying form is a Tally embed (`https://tally.so/embed/EkJl0N`) — third-party, no analytics in your hands, expands inline below the hero (good UX), but iframe height is hardcoded `400` with `dynamicHeight=1` which depends on Tally's postMessage protocol working. If it ever fails, the form is unusable and you don't know. Add a fallback: a `<noscript>` link to a hosted Tally page, or a mailto.
- **Why it matters:** This is your funnel. Defense in depth is cheap; losing leads silently is expensive.

### CC-6 — Footer links don't visually distinguish external vs internal
- **Pages:** Most footers list "GitHub · LinkedIn · YouTube · Email" without arrows or icons.
- **Fix:** Add a subtle ↗ glyph or `target="_blank"` styling for external. Industry standard, low cost.
- **Why it matters:** Minor accessibility/affordance improvement.

---

## Per-page deep findings

Each finding cites a screenshot at `/tmp/luthien-audit-2026-04-22/` and the source file:line where applicable. Severity: **P0** = ship-stopper for the audience this page serves; **P1** = real fix worth doing this sprint; **P2** = nice-to-have.

### `/` (Home)
Screenshots: `marketing_home_desktop.png`, `marketing_home_mobile.png`.
Page job: convert a developer visitor into a beta applicant in <60 seconds.

- **P0** — Filter pills use Tailwind palette (covered in QW-4). The Problem section is the most-screenshotted block on the site; the off-Lumen colors leak everywhere.
- **P1** — Only **one** testimonial in the "early feedback" section. You have at least 4 strong ones (they're sitting on pitch slide 19, ES slide 12). Bring 3–4 over and rotate. Single-quote social proof reads as "this is the one quote we got."
- **P1** — The architecture diagram (`<pre>` ASCII art with emoji + colored spans) is clever for devs but the font is ~14px and not selectable as text in a useful way. Either commit to the dev-flex (and make it *bigger* and copy-friendly, with a "Copy" button) or replace with a simple SVG that scales. Right now it's neither great ASCII art nor great diagram.
- **P1** — "Apply for beta" button microcopy ("We'll help set Luthien up in your dev environment for you and your org.") is good. But the *form* below is a Tally embed with a hardcoded 400px height. On mobile this can get cramped. Verify form is fully usable at 375px width with all fields visible without horizontal scroll.
- **P2** — Hero `padding-top: 180px` to clear the 58px fixed nav is brittle. Use `calc(var(--nav-h) + spacing)` so the hero auto-adjusts if nav height ever changes.
- **P2** — The "see more" link to `/frustrations` uses `#7A7290` (Muted Label) — too dim for a call-to-action. Bump to Verdigris or use a clearer chevron-arrow treatment.
- **P2** — Hero h1 has `<span style="color: #C47B42;">You</span>` inline. Move to a class once `shared.css` exists.
- **P2** — `font-size: 17.6px` base (covered in QW-5).

### `/about.html`
Screenshots: `marketing_about_desktop.png`, `marketing_about_mobile.png`.
Page job: establish founder credibility for investors and recruits.

- **P1** — Bio body color `#9891A8` on `#141216` bg measures ~3.6:1 — **fails WCAG AA** for normal text (needs 4.5:1). Bump to `#B0A8BE` (Soft Label) or `#EDE5D8` (Linen) at lower weight.
- **P1** — Photo asymmetry: Scott's photo is professional, Jai's is an outdoor shot with a busy background. Either both crisp, both casual, or both atmospheric — pick a treatment.
- **P2** — Bio formatting drift: Jai's ends "Founded Luthien in January 2025." Scott's ends "co-founded Luthien in March 2025." Different verbs (founded / co-founded), different cap. Pick one.
- **P2** — Page title `clamp(1.8rem, 4vw, 2.8rem)` on About vs hero h1 `clamp(2.2rem, 6vw, 4rem)` on Home — different scales for the same role. Standardize "page title" treatment.
- **P2** — Both bios mention "January 2025" / "March 2025" — different dates for "founded" vs "co-founded." Worth making explicit if there's a story (e.g., Jai founded, Scott joined as co-founder).

### `/blog.html`
Screenshots: `marketing_blog-index_desktop.png`, `marketing_blog-index_mobile.png`.
Page job: surface published thinking; signal "we're a serious org with a point of view."

- **P1** — Author/date format is inconsistent across rows: "Jan 2026 · Luthien", "March 20-22, 2026 · Luthien", "May 2025 (updated Feb 2026) · Scott Wofford", "March 17, 2025 · Jai Dhyani", "March 1, 2025 · Luthien". Mix of "Jan/March" abbreviation, with/without day, range vs point, "updated Feb 2026" inline parenthetical. Standardize to one format (suggest "YYYY-MM-DD · Author").
- **P2** — Five posts in 12 months reads thin. No fix in this audit, but the layout assumes growth — a post-count of ~20+ would benefit from filtering by topic (AI control / engineering / org).
- **P2** — Hover state (`opacity 0.75; transform translateX(4px)`) is delightful. Keep.

### `/blog/*` (5 posts)
Screenshots: `marketing_blog-{21-points,hackathon-2026,controlconf-london,pbc-transition,theory-of-change}_{desktop,mobile}.png`.
Page job: long-form article reading.

- **P1** — Theory of Change post (`theory-of-change`) has a Theory of Change diagram at the top that's small and low-contrast on the desktop screenshot. Verify image asset is at 2x and not stretched.
- **P1** — PBC Transition post opens with a literal "ACTION BY THE SOLE INCORPORATOR OF LUTHIEN RESEARCH PBC" legal-document block. Strong visual but the gravity is undercut by the page treating it like a regular blog post (left-aligned, normal width). Either commit to the legal-document framing (centered, all-caps, monospace, framed border) or move that block to an appendix. Right now it's an awkward halfway.
- **P1** — Hackathon 2026 post is *very* long with no inline TOC sidebar (21-points has one; this one doesn't). Add a sticky TOC for posts >800 words.
- **P2** — Posts cite "Originally published on lesswrong.org" / "luthienresearch.org" with the link in Verdigris. Add a tiny external-link glyph (↗) so readers know they're being sent off-site.
- **P2** — Inconsistent presence of left-side TOC: 21-points has one, ControlConf has one, Theory of Change appears to but very compressed, PBC Transition doesn't, Hackathon-2026 doesn't. Standardize the blog-post template.

### `/frustrations.html`
Screenshots: `marketing_frustrations_desktop.png`, `marketing_frustrations_mobile.png`.
Page job: BD asset — show the depth/breadth of the problem so a developer says "yes, this is real."

- **P0** — Filter pill colors here are the same Tailwind defaults as on `/` (covered in QW-4). Same fix.
- **P1** — Page uses `font-size: 16px` while every other page is 17.6px (covered in QW-5). Body text reads ~10% smaller here than on the rest of the site. Subtle but jarring.
- **P1** — Card-style mimicry of source platforms (Twitter blue, GitHub dark, Reddit, blog) is a smart authenticity move. **But:** the GitHub card border `#30363d` and Twitter card `#1c1c1e` are off the Lumen palette — fine because they're meant to *look like the source*, not Luthien. Document this carve-out in CSS comments so a future cleanup pass doesn't "fix" them.
- **P2** — "loading more..." indicator at bottom on desktop suggests infinite scroll. Verify this works (couldn't observe in static screenshots) and that there's a fallback "view all on GitHub" link if pagination breaks.

### `/hackathon/`
Screenshots: `marketing_hackathon_desktop.png`, `marketing_hackathon_mobile.png`.
Page job: recruit hackathon participants and signal active community.

- **P1** — The page is *very* long and dense. Above the fold has hero + YouTube embed + 2 CTAs (Discord, project ideas). Below: "get started" steps, "project ideas" with 3 categories of ~4–5 cards each, then "why we're building this" with a Theory of Change diagram. Consider collapsing project ideas behind expandable category headers — most readers want to know there are ideas, not read all 12.
- **P1** — Theory of Change diagram at bottom is small and washed-out at the desktop screenshot resolution. Either upsize, use a 2x asset, or replace with a clean SVG.
- **P2** — Project category headers like `// inject a secret motive` use comment-style monospace — nice touch, on-brand.
- **P2** — Two primary CTAs above the fold ("Join us on Discord" + "Find your project idea on Discord") both go to Discord but are different copy. Pick one above the fold.

### `/deck/` (gated investor PDF)
Screenshots: `marketing_deck_desktop.png`, `marketing_deck_mobile.png`.
Page job: collect email in exchange for the pitch PDF.

- **Looks great.** Centered Luthien wordmark with Verdigris underline, tagline "AI's power is nothing without control" (variant of footer "Power is nothing without control" — note the slight wording divergence), email input + Verdigris arrow submit. On-brand, minimalist, fast.
- **P2** — Tagline mismatch: footer says "Power is nothing without control"; this page says "AI's power is nothing without control." Pick one and use it everywhere.
- **P2** — Mobile centered layout is clean. No issues.
- **P2** — No microcopy on what happens after submit (you'll get an email? PDF download?). One-liner under the form would help conversion.

### `/feedback/`
Screenshots: `marketing_feedback_desktop.png`, `marketing_feedback_mobile.png`.
Page job: walk a trial user through structured feedback collection.

- **P0** — Entire page is on a different design system (covered in QW-2). Inter font, `#09090b` bg, blue links. This is the trial-onboarding first-impression and it doesn't look like Luthien.
- **P0** — Stale URL in Part 3 (covered in QW-1).
- **P0** — Hyphen-as-em-dash typography slips throughout (covered in QW-7).
- **P1** — Secondary nav at top (warm up / workflow / landing page / quick start / report) uses `position: fixed; top: 48px` — depends on top nav height being exactly 48px. Will break if either nav resizes. Pin via CSS variable.
- **P2** — "luthienresearch.github.io/luthien-pbc-site/" big-link styling looks like a button, but it's a hyperlink. Since QW-1 fixes the URL, also tighten the visual: either make it a subtle inline link or commit to the button.

---

## Pitch deck — `/pitch/` (EN, 28 slides)

Reviewed slide-by-slide with an investor lens (clarity, credibility, ask). Screenshots: `pitch_en_##_<name>.png`.

### Highest-leverage findings (Pitch EN)

- **P0** — **Number conflicts across slides** (covered in QW-3 above):
  - Slide 6 says **"93 USER INTERVIEWS"**; slide 7 footer says **"36 recorded interviews"**.
  - Slide 24 says **"4 LOIs signed $340K-$600K"**; slide 25 visually highlights **2 LOI cards** ($60K Trajectory Labs + $330K-$500K Redwood Research). The other 2 LOIs aren't shown — investor will ask.
  - Per memory, the LOI tracking sheet is source-of-truth — reconcile against it before next investor send.
- **P0** — **EN/ES decks have inconsistent numbers for the same metric.** Notably ES slide 9 says **"3 LOIs firmadas en 21 días"**; EN slide 24 says **"4 LOIs signed"**. Same metric, two decks, two numbers. Whichever is right, the other is wrong.
- **P1** — **Slide counter mismatch on desktop**: bottom-right counter reads `1 / 16` while the dot indicator shows ~28 dots. Either the counter denominator is hardcoded wrong or it counts a subset (main slides). Mobile counter shows `1 / 28` — agreement matters.
- **P1** — **Top-right "Download PDF" button** is in plain mono pill in EN; missing on ES (see ES section). If you ever pitch from a laptop with no internet, the button needs to be obvious enough to find under stress.

### Per-slide notes (P1/P2 only — P0s above)

- **Slide 0 (title)**: Solid bookend. Verdigris underline under wordmark, "Safety = Trust = Power" tagline. Strong.
- **Slide 1 (team)**: Scott left, Jai right. Scott citation "$4.5B¹ Profit generated at amazon" with footnote 1 — verify the footnote is shown somewhere (not visible in capture). Jai's "Shipped Language Models to 2B users" with AWS + Meta + MATS logos — strong.
- **Slide 2 (problem-dev / METR chart)**: Time horizon chart. Y-axis spans 8s → 12hr — verify the axis is log-scale (the visual suggests log but labels look linear-spaced). If linear, the curve is misleading; if log, label the axis as such.
- **Slide 3 (problem-metr-12h)**: Stage build adding "12 hours / autonomous task horizon, today" callout. Strong red circle annotation. Good.
- **Slide 4 (45 seconds)**: Big bold pink/red "45 seconds" — the color reads as Signal Red but feels almost coral. Verify it's exactly `#C45050` (Lumen Signal Red). If it drifted to `#E47878` or similar, fix.
- **Slide 5 (problem-gap)**: Same chart with red shaded "Claude's squandered potential" area + "12 HR → 45 SEC" annotation. Strong visual; the right-side label "Claude's squandered potential. 12 HR → 45 SEC." feels cramped. Give it more breathing room.
- **Slide 6 (93 user interviews)**: Big number, clean. (See P0 above for number conflict.)
- **Slide 7 (problem-cto / Has your AI ever...)**: "WHAT CLAUDE CODE DOES" small label top-left. Strong rhetorical question. Footer source list could use a logo strip instead of a pipe-separated text list — feels like footnote text rather than a credibility move.
- **Slide 8 (Luthien Solves This.)**: Bridge slide. Fine.
- **Slide 9 (What is Luthien?)**: Bridge slide. Fine. (Could collapse 8+9 into one — two consecutive bridge slides in a row reads as deck padding.)
- **Slide 10 (oneliner / "A Fully Customizable Real-Time Manager for Every AI in Your Org")**: The phrase "Fully Customizable Real-Time Manager" is buzzwordy. "Manager" of what? Suggest sharper version: "A real-time control layer for every AI in your org" or "Programmable guardrails for every AI agent."
- **Slide 11 (differentiation-question / "What makes Luthien different from all of the existing Gateways, Guardrails, and Observability Platforms on the market?")**: 25-word rhetorical question. Hard to scan. Tighten to ~12 words: "What makes Luthien different from existing gateways, guardrails, and observability tools?"
- **Slide 12 (litellm compromised)**: Strong slide. Date "MARCH 24, 2026 · 10:39 UTC" — verify this is a real incident (today is 2026-04-22, this is plausible). Body text "For 40 minutes, installing litellm meant losing everything" — *low contrast*, hard to read against bg. Bump to Linen.
- **Slide 13 (No safety infrastructure)**: Clean attack flow with red "OWNED" badge. Good.
- **Slide 14 (Helicone + Portkey + Guardrails)**: Same flow but with competitor logos and extra steps. Good comparison; the Guardrails AI logo is on a *white* background which clashes against the dark slide. Find a transparent / dark-mode version of the logo.
- **Slide 15 (With Luthien)**: Right-panel checklist (✓ block install / ✓ alert users... / ✓ loop in security / ✓ dispatch agent for org-wide investigation) is clean. Good.
- **Slide 16 (Luthien-exclusive capabilities)**: Clean 2x2. "Not just X, Y, or Z" pattern works. Maybe bold the key noun in each card title for scanability.
- **Slide 17 (How? — code block + "Just Work.")**: Dense code block, then "We worry about complex details like this so your policies / Just Work." — strong slide for a technical investor. Verify the code block is real production code (vs. mockup) — if real, lean into it; if mockup, label "illustrative."
- **Slide 18 (TAM 4-quadrant)**: Clean. Two color groups (Linen for current $4.7B / projected $14.6B; Verdigris for Claude Code revenue $2.5B / TAM $155B). The color split's logic isn't immediately obvious — maybe Linen = "the market today and tomorrow" and Verdigris = "what's actually bookable." Document or change. Also: footnote markers ¹²³ — verify citations are present in slide footer (couldn't see clearly).
- **Slide 19 (user-quotes)**: 4 strong testimonials. Avatars are tiny (~30px); double them. Bold inline numbers (30-50%, $10K-$100K, 2X) is a great pattern.
- **Slide 20 (enterprise-validation)**: VP at 3,500-person legal tech co. Italic Lora serif quote. The verdigris emphasis on "no-brainer" and "very important" reads as a hyperlink — confusing. Use bold or a non-link color.
- **Slide 21 (risk-equation / "Mistake Rate × Tokens = Risk")**: Clever but the color coding is muddled. ↓10X (mistakes ↓ = good) and ↑100X (tokens ↑ = neutral) are *both* Verdigris; ↑10X (risk ↑ = bad) is Red. Suggest: ↓10X Verdigris (good), ↑100X Linen (neutral input), ↑10X Signal Red (bad output).
- **Slide 22 (defensibility / "Won't Anthropic build this?")**: Fabian Roger quote. Clean. Bottom faded text "Doesn't make sense for labs to build provider-agnostic tooling" — looks like a stage that didn't fully reveal in capture; verify it's intended visual (faded as past tense / grayed-out by design).
- **Slide 23 (strategy / "Do things that don't scale.")**: Strong analogy with Supabase, HashiCorp. "TBD" for Luthien is honest. Date stamps under $5B (oct 2025 series E?) and $14B (dec 2024 IPO) are tiny — make them readable.
- **Slide 24 (funnel)**: Clean funnel. Top-right text "No outbound or sales reps yet" — strong. Funnel total is "$340K-$600K" (I previously misread as $500K — corrected). See P0 about LOI count.
- **Slide 25 (traction)**: 2 LOI cards (see P0). Ryan Krzeminski testimonial below feels disconnected from the 2 LOIs above — what's his role on this slide? Is he LOI #3? Add an explicit framing, e.g., "Plus an inbound from..."
- **Slide 26 (ask / $2M Pre-Seed)**: 12-angel grid. Names under photos are small. "Fri Apr 10 - Wed Apr 15" date format — drop the weekday, use "Apr 10–15" for compactness.
- **Slide 27 (close)**: Reprise of title. The "Investment Memo" link below is in a faded state — looks broken. Either show it clearly or remove.

---

## Pitch deck — `/pitch/es/` (ES, 13 slides)

Screenshots: `pitch_es_##_<name>.png`. Reviewed for visual + Spanish-copy quality (per design system: straight quotes, no em-dashes, accents correct).

### Highest-leverage findings (Pitch ES)

- **P0** — **Future-dated source citation.** ES slide 6 (defensibilidad) cites Fabian Roger quote with "(Fabian Roger, Anthropic, 1 dic 2026)" — that's a future date. Today is 2026-04-22. Verify the actual date; likely should be "1 dic 2025" (or a 2025 publication date).
- **P0** — **EN/ES content divergence beyond translation.** The two decks tell different stories at the same point in the deal:
  - EN slide 1 (team): Scott LEFT, Jai RIGHT. ES slide 1: Jai LEFT, Scott RIGHT. **Order swap.**
  - EN Scott credential: "$4.5B¹ Profit generated at amazon". ES Scott: "Generó $6.8B en Ventas, $4.5B en ganancias" (revenue + profit, two numbers). **Different financial framing.**
  - EN Sami Jawhar testimonial: "$10K-$100K/yr". ES: "~$100K/año" (top-of-range only). **Different number.**
  - EN slide 24: "4 LOIs signed $340K-$600K". ES slide 9: "3 LOIs firmadas... $330-500K, 26-37 puestos". **Count differs (4 vs 3); EN range goes higher; ES range matches the single Redwood Research LOI shown on EN slide 25 — suggests ES is conflating the total with one individual LOI.**
  - EN competitive slides (13/14/15): attack-flow narrative. ES slide 5: feature-by-feature comparison matrix. **Different competitive argument.**
  - EN close: "Safety = Trust = Power". ES close: "Toda organización que use agentes de IA necesitará una capa de control. Nosotros la estamos construyendo." **Different closing message.**
  - **Recommend:** treat ES as a *first-class* deck, not a translation. Either bring them into structural parity (same slides, same arguments, same numbers) or document explicitly that ES is a separate, audience-tailored variant. Right now it reads as "translation that drifted."
- **P1** — **Mixed language inside ES deck.** ES slide 2 filter pills ("All / Deleted stuff / Ignored Instructions / Hallucinated / Security holes / Cheated on tests / Lied about it") are in English. ES slide 8 testimonial quotes ("'I'll just fix it myself.'", "'Cool, I'll tell my whole team to use this.'") are in English. Translate the pills (the quotes are arguably fine to leave in original language with a Spanish gloss, but be intentional).
- **P1** — **Missing "Download PDF" button** in ES top-right (EN has it). If there's no Spanish PDF, that's fine — but say so. If there should be, build it.
- **P1** — **Slide-number watermarks** (large faded "1", "2", "3" in top-left) are present in ES, absent in EN. Inconsistent treatment of the same deck format.

### Per-slide notes (ES)

- **Slide 0 (title)**: Spanish accents look correct. Good.
- **Slide 1 (equipo)**: See P0 (order + framing divergence).
- **Slide 2 (problema desarrolladores)**: English filter pills (P1 above). Spanish body looks clean — no em-dash; uses colon for clause break. Good.
- **Slide 3 (problema CTOs)**: "¿Cómo puedo aprovechar la velocidad de la IA, mientras mitigo los riesgos?" — verify quote marks are *straight* (`"`) not curly (`""`). Hard to tell at screenshot resolution; spot-check at the source.
- **Slide 4 (cómo funciona)**: Flow diagram has some elements in faded state — likely stage builds I forced visible. Visual layout fine.
- **Slide 5 (panorama competitivo)**: Feature comparison table. Clean. "parcial" label in amber — good.
- **Slide 6 (defensibilidad)**: Future-dated citation (P0).
- **Slide 7 (mercado / "El mercado está explotando")**: "Estamos vendiendo palas en una fiebre del oro" — strong tagline. "46% del código en GitHub es generado por IA (2025)" — needs source citation.
- **Slide 8 (estrategia)**: English testimonial quotes embedded. Translate or annotate.
- **Slide 9 (tracción)**: LOI count differs from EN (P0).
- **Slide 10 (opiniones)**: Testimonials translated. Verify straight quotes.
- **Slide 11 (lo que buscamos / Pre-Seed)**: Mirrors EN slide 26 layout. Good.
- **Slide 12 (close)**: Different closing line from EN (P0 divergence).

### Mobile pitch experience (sanity check)

`pitch_en_mobile_title.png` and `pitch_es_mobile_title.png` show the title slides at 375px. Both render readably. Concern: the 16:9 deck format is fundamentally not designed for portrait mobile — at 375px wide, dense slides (TAM 4-quadrant, comparison tables, funnel) likely break. **Recommend:** either (a) build a `@media (max-width: 640px)` portrait-fallback layout that stacks 2x2 grids vertically, or (b) detect mobile and redirect to `/deck/` (the gated PDF flow) instead of attempting interactive slides.

---

## Trello card list (P0 + P1 only)

These are ready to file as cards on the Luthien board. Suggested format: title in imperative; body cites the audit-doc finding ID and the file:line(s).

### P0 (file ASAP)
1. **Re-skin /feedback/ to Lumen, or noindex + don't link** — see QW-2 + `/feedback/` section.
2. **Fix stale URL in /feedback/ Part 3** — see QW-1.
3. **Reconcile "93 user interviews" vs "36 recorded interviews" in pitch slides 6/7** — see QW-3.
4. **Reconcile "4 LOIs" vs "3 LOIs" between EN/ES decks; verify against LOI spreadsheet** — see Pitch EN P0 + Pitch ES P0.
5. **Replace Tailwind palette in homepage filter pills with Lumen tokens** — see QW-4.
6. **Fix future-dated Fabian Roger citation in ES slide 6 ("1 dic 2026")** — see Pitch ES P0.
7. **Fix em-dash hyphen typography slips in /feedback/** — see QW-7.
8. **Decide EN/ES deck strategy: parity or first-class variants** — see Pitch ES P0.

### P1 (this sprint)
9. **Standardize base font-size to 16px across all pages** — see QW-5.
10. **Resolve `.btn` border-radius spec mismatch (4px vs "sharp corners")** — see QW-6.
11. **Extract `assets/css/shared.css` (already on TODO; this audit motivates it)** — see CC-1.
12. **Define and enforce a 3-step border-radius scale** — see CC-2.
13. **Define and enforce an 8px-grid spacing scale; eliminate ad-hoc paddings** — see CC-3.
14. **Replace section-reveal opacity:0 default with intersection-observer-driven animation that's print-safe** — see CC-4.
15. **Add fallback for Tally iframe failure on Apply for beta CTA** — see CC-5.
16. **Fix WCAG AA contrast on `/about` bios (currently `#9891A8` ~3.6:1)** — see About P1.
17. **Standardize blog post date/author format on `/blog.html`** — see Blog P1.
18. **Add 3–4 testimonials to homepage Early Feedback (currently only one)** — see Home P1.
19. **Standardize blog-post template — TOC sidebar present on all long posts** — see Blog/* P1.
20. **Translate ES pitch filter pills + decide on testimonial-quote language policy** — see Pitch ES P1.
21. **Add slide-number watermark to EN deck OR remove from ES (consistency)** — see Pitch ES P1.
22. **Audit pitch deck color coding on slide 21 (risk equation)** — see Pitch EN per-slide.
23. **Replace cramped Theory of Change diagram with high-res / SVG** — see Hackathon + Blog P1.

---

## Responsive sweep (added 2026-04-23)

After the main audit shipped, ran a targeted second pass to specifically test responsive behavior at extreme viewports + on a different browser engine. Scope: 4 highest-stakes pages × 6 viewport configs = 36 captures.

**Configs:**
- **Chromium @ 320w / 768w / 1024w / 1920w** — bracket the breakpoints (smallest phone, iPad portrait, iPad landscape, large monitor)
- **WebKit @ 375w / 414w** — actual Safari engine on iPhone-class viewports; catches iOS-Safari-only rendering quirks

**Pages:** Home, Frustrations, Hackathon (full-page captures), Pitch deck (sampled at title + TAM 4-quadrant + funnel — content density representatives).

**Output:** `/tmp/luthien-audit-2026-04-22/responsive/*.png`.

### Top responsive findings

#### R-1 — P1 — Filter pills overflow horizontally at narrow widths (Home + Frustrations)
At 320w (Chromium) and 375w (WebKit), only the first 2 of 6 filter pills fit; the rest scroll horizontally because the bar uses `overflow-x: auto`. There's no visual indicator that more options exist. A user at 320w sees only "All" and "Deleted stuff" and may never discover the other categories.

**Fix:** Add a fade-edge gradient (`mask-image`) on the right edge of `.filter-bar` at narrow widths so users see content is cut off, OR collapse to a `<select>` dropdown below 480px.
**Files:** `site/index.html` `.filter-bar`, `site/frustrations.html` `.filter-bar`.

#### R-2 — P1 — Pitch TAM slide @ WebKit 375w: bottom-right quadrant overflows
The 2x2 TAM grid stays 2-column down to 375w, but the bottom-right quadrant ("AGENTIC AI TAM BY 2030 $155B BANK OF AMERICA") overflows: `$155B` truncates to `$155` (the "B" gets clipped), and "Bank of America" truncates to "Bank of Am...". This is specifically visible on WebKit at 375w; Chromium 320w handles it better because the grid collapses to single-column at very narrow widths.

**Fix options:** (a) Force single-column stack at `<414px` so each quadrant gets full width. (b) Tighten font-size with `clamp()` so the largest number scales down before overflowing. (c) Shrink the BoA logo and label.
**File:** `site/pitch/index.html` slide with `data-slide-name="tam"`.
**Screenshot:** `responsive/pitch_tam_webkit_375w.png` vs `responsive/pitch_tam_chromium_320w.png` (compare).

#### R-3 — P2 — At 1920w, page containers leave huge empty margins
Marketing pages use `.container { max-width: 960px }`. At 1920w, the content occupies the middle 50% and ~480px of empty space sits on each side. Not broken — just under-utilized. Pitch deck uses `max-width: 1100px` with similar effect.

**Fix:** Add a wider tier (`max-width: 1200px` at `min-width: 1440px`, or `1400px` at `1920px`). Or accept the margins as intentional minimalism.

#### R-4 — P2 — Pitch deck handles portrait mobile better than expected
I had this flagged as a likely P0 in the original audit ("16:9 deck format fundamentally not designed for portrait mobile"). The actual sweep shows it holds up surprisingly well: TAM grid collapses to single-column at 320w (chromium), funnel collapses to mostly text + tiny diagram, title slide is clean. **Downgrade from P0 to P2.** Caveat: there are other slides I didn't sample at responsive sizes (slide 14 competitive flow, slide 17 code block, slide 19 testimonial 2x2) that may break — sample them if mobile pitch traffic becomes meaningful.

#### R-5 — P2 — WebKit ≈ Chromium for these pages (good news)
Across all 6 WebKit captures (375w/414w on Home, Frustrations, Hackathon, and 3 pitch slides), I see no rendering differences from Chromium at the same width. This means the original audit findings (which used Chromium only) generalize to Safari/iOS users too. **Caveat:** WebKit-specific bugs tend to live in narrow CSS features — backdrop-filter, mask-image, complex gradients, scroll-snap, custom properties in animations. If you ever add any of those, retest in WebKit specifically.

#### R-6 — P2 — Frustrations card grid stays 2-col even at 1920w
Could go 3-col on very wide displays for better information density. Minor.

### What this sweep did NOT cover
- Real iOS/Android device testing (Playwright WebKit ≈ Safari but isn't 1:1 — touch behavior, viewport quirks, address-bar height changes aren't simulated).
- Slow networks / slow CPU.
- High-contrast mode, prefers-reduced-motion, screen reader navigation.
- 7 remaining pages (5 blog posts, About, Blog index, Deck) — they were less likely to have responsive breaks based on the main audit's findings.

If you want fuller coverage on any of these, that's a separate scoped pass.

### `/feedback/` responsive sweep (added 2026-04-23)

Per follow-up request, ran the same 6 viewports against `/feedback/`. 6 captures, all in `/tmp/luthien-audit-2026-04-22/responsive/feedback_*.png`.

**Findings:**
- **No new responsive breaks.** Layout holds at 320w through 1920w.
- WebKit ≈ Chromium at 375w / 414w (same as the rest of the sweep).
- **Container max-width is 720px** vs. the rest of the site's 960px — at 1920w this leaves a *lot* of empty space, but it's appropriate for a long-form documentation page (line-length readability matters more than space utilization).
- Secondary section-tab nav (warm up / workflow / landing page / quick start / report) is centered under the active tab via JS. At 320w it likely overflows the viewport edge but is positionally clamped — verify by clicking through tabs on a real iPhone.
- All structural P0s on `/feedback/` are still the original brand-mismatch ones (Inter / off-Lumen palette) tracked in card #1221.

---

## Tailwind palette: options + recommendation (added 2026-04-23)

Scott asked: for the homepage filter pills (`/` and `/frustrations`), what are the options, what's the recommendation, why?

### The constraint
6 distinct filter categories: `deleted`, `ignored`, `hallucinated`, `security`, `cheated`, `coverup`. Lumen has 3 accent hues (Verdigris #3B9494, Amber #C47B42, Signal Red #C45050) + 2 neutrals (Linen, Plum Dark). 6 categories → 3 accents = need to either collapse, share, or extend.

### Options

#### Option A — Collapse to 4–5 categories using only existing Lumen hues
- Merge `deleted` + `coverup` → "destructive" (Signal Red)
- Merge `ignored` + `cheated` → "evasive" (Amber)
- `hallucinated` → "fabricated" (Verdigris)
- `security` → its own bucket (Linen as neutral, or merge into one of the above)
- **Pros:** pure Lumen, no new tokens, simpler scan-taxonomy
- **Cons:** loses category granularity; "coverup" merged into "destructive" loses the deception-vs-destruction nuance, which is a real product distinction; the merge is a content-team call, not a designer call

#### Option B — Keep all 6 categories, extend Lumen with 2 new accent hues
- Add **Lumen Sage** (~`#6B9485`, muted teal-green; sits between Verdigris and a calmer green) — for `security` (security wins read as "good catches")
- Add **Lumen Indigo** (~`#7B6B95`, muted purple in the Plum family; harmonizes with Plum Dark bg and Divider `#28243A`) — for `cheated` (deception lives visually in the plum family)
- Map: `deleted`→Signal Red, `ignored`→Amber, `hallucinated`→Verdigris, `security`→Sage, `cheated`→Indigo, `coverup`→Signal Red dim variant
- Document the 2 new tokens in `dev/lumentheme-branding-guideline.md`
- **Pros:** all 6 categories preserved; brand expansion is intentional + documented; Lumen palette stays internally coherent (muted, harmonized)
- **Cons:** 2 new tokens to maintain; needs your design approval; one category (`coverup`) still shares a hue with `deleted` via dim variant

#### Option C — Keep 6 categories, share Lumen hues via saturation variants
- 3 hues × 2 saturations = 6 treatments
- Pros: pure Lumen, no new tokens
- Cons: muted variants are hard to distinguish at small pill size (~12-14px text); risk of visual confusion that defeats the purpose of color coding

#### Option D — Group by failure-type semantics, share hues
- Technical errors (`deleted`, `hallucinated`) → Verdigris family (full + dim)
- Intent failures (`ignored`, `cheated`) → Amber family
- Trust failures (`security`, `coverup`) → Signal Red family
- **Pros:** pure Lumen; the hue-sharing reinforces a taxonomy you can explain to viewers
- **Cons:** pairs that share a hue lose distinction; users have to learn the meta-taxonomy

### Recommendation: **Option B** (extend Lumen with 2 new accent hues)

**Why:**
1. The 6 categories are *real and useful* taxonomic distinctions on a page whose whole job is "show the variety of ways AI fails." Collapsing them flattens the page's argument.
2. The original designer reached for Tailwind defaults because they needed 6 distinct colors — the answer isn't to abandon the differentiation, it's to bring it into Lumen.
3. Lumen currently has 3 accent hues; going to 5 (adding Sage + Indigo, both muted) stays well within "small disciplined palette" range — Tailwind has 22 named hues, Material has ~20, you'd be at 5.
4. Both proposed hues are *muted, low-saturation, and chosen to harmonize with the Plum/Divider neutrals* — they don't add chromatic noise, they extend the existing brand mood.
5. **Net cost:** ~1 hour of palette + docs work + a brief Lumen guideline update. Lower cost than Option A's content/taxonomy decision, lower visual risk than Option C's muted variants.

If you don't want to extend Lumen at all, fall back to **Option A** — it's a content-team call but it's a clean ship. Avoid C and D — they look clever but trade visual clarity for purity.

**Next step if B is accepted:** I can mock up the exact hex values for Sage and Indigo (with WCAG contrast checks against Plum Dark bg), update `dev/lumentheme-branding-guideline.md` with the new tokens, and update the filter-pill CSS in `site/index.html` and `site/frustrations.html` in one PR. ~1 hour, autonomous.

---

## Audit doc transcription error log (added 2026-04-23)

While doing follow-up work I caught **3 transcription errors** in the original audit doc — all from misreading numbers/dates in compressed PNG screenshots. Source-verified corrections:

| Field | I logged | Actual source | File |
|---|---|---|---|
| EN funnel total | $340K-$500K | **$340K-$600K** | `site/pitch/index.html:4184` |
| Slide 7 footer counts | "36 recorded · 26k data points" | **"34 recorded · 204 data points"** | `site/pitch/index.html` (now updated to "93 user interviews (34 recorded)") |
| ES slide 6 date | "1 dic 2026" (future-dated, my P0!) | **"1 abr 2026"** (April, NOT December) | `site/pitch/es/index.html:2430` |

The future-date "P0" was based on misreading "abr" as "dic" — two short Spanish month abbreviations. There is no future-dated citation in the source.

**Lesson for future audits of text-heavy content:** screenshots compress to fuzz at small text sizes. Always grep the source HTML for the exact quoted text before logging a finding as P0. I've updated the relevant Trello cards.

---

## Appendix: capture process notes

- Screenshots taken via Playwright (Chromium, headless) against local server `http://localhost:8765/` (production luthien.cc unreachable from this machine due to known `.cc`-TLD SNI middlebox issue documented in COE PR #150).
- Marketing pages required a force-reveal of `.section-reveal` divs because IntersectionObserver doesn't fire during a full-page screenshot — original capture had blank middle sections. Re-captured with reveal injection in `/tmp/luthien-audit-2026-04-22/recapture_marketing.py`.
- Pitch decks captured slide-by-slide by JS-forcing `.active` on each slide div and screenshotting at 1440×900. Stage-builds (slides with `data-stages="N"`) were captured at their initial state only — some slides have grayed-out content that is intentional in the live deck but reads as "broken" in static capture (noted where it occurs).
- Capture script: `/tmp/luthien-audit-2026-04-22/capture.py`, recapture: `/tmp/luthien-audit-2026-04-22/recapture_marketing.py`.


