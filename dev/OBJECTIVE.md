# Objective

Switch landing page primary CTA from "View on GitHub" (+ public curl install) to "Apply for beta" (Tally form). Motivation: Finn flagged investor concern about low GitHub star count (18) being read as weak adoption — repositioning as private beta signals selectivity instead.

Scope (v11.3):
- Hero: replace curl install + "View on GitHub" button with "Apply for beta" primary CTA. Keep "Book a setup call" as secondary.
- Nav: replace "Book a setup call" with "Apply for beta".
- "Get started" section: replace curl install block with "Apply for beta" CTA.
- Footer: keep GitHub link + update version to v11.3.
- Mirror changes across index.html, about.html, blog.html (shared nav).

Out of scope:
- Body copy rewrites (e.g. "Open-source proxy" stays — still true).
- Creating the Tally form itself (Scott does this; PR uses a `YOUR_FORM_ID` placeholder to be swapped before merge).
- Removing orphaned `.cli-install` CSS and `copyInstallCmd` JS (dead code, but touching it bloats the diff — defer to a cleanup PR).
