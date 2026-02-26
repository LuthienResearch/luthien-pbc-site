# Gotchas

Non-obvious behaviors, edge cases, and things that are easy to get wrong.

**Format**: `## Topic (YYYY-MM-DD)` with bullet points.

---

## Image paths are relative to site/ root (2026-02-26)

Images live in `site/assets/images/` but HTML references them as `assets/images/filename.ext` (relative to the page). If you move a page into a subdirectory, image paths need updating.

---

(Add gotchas as discovered with timestamps: YYYY-MM-DD)
