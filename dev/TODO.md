# TODO

## Styling & Components
- [ ] Extract CSS variables (colors, fonts, spacing) into `assets/css/shared.css`
- [ ] Create reusable snippets (header, footer, CTA) if adding more pages
- [ ] Add favicon
- [ ] Add og:image/og:title/og:description meta tags for social sharing

## Analytics & SEO
- [x] Add GoatCounter analytics (privacy-friendly, matches personal-site)
- [ ] Add sitemap.xml

## Domain & Hosting
- [ ] Decide relationship with luthien_site (replace? coexist?) — coordinate with Jai
- [ ] Set up custom domain (luthienresearch.org or other) once decided
- [ ] **Decide canonical Luthien domain.** luthien.cc is ISP-reputation-blocked on multiple consumer networks (confirmed T-Mobile + one other). Options: adopt luthien.ai as canonical, acquire luthien.com, or pick a different TLD. See `docs/coes/2026-04-22-luthien-cc-unreachable.md`.
- [ ] Once canonical is picked: set up `luthien.cc` → canonical 301 redirect (partial fix; ISPs that block TLS to luthien.cc will still bounce).
- [ ] Audit every reference to `luthien.cc` across this repo, pitch deck sources, personal-site, luthien-org, email signatures, LOI tracking sheet. Produce a swap-list. (Claude-automatable)
- [ ] Build a reachability probe script at `scripts/reachability-check.sh` that hits the domain from multiple external probe endpoints and reports pass/fail per probe. Run before promoting any new domain. (Claude-automatable)
- [ ] Spot-check email deliverability from `@luthien.cc` and `@luthienresearch.org` into Gmail / Outlook / Yahoo. (Claude-automatable)
- [ ] Write a domain-selection checklist (`docs/process/domain-selection.md` or extend `dev/context/decisions.md`): TLD reputation check (Spamhaus, VirusTotal, Safe Browsing), residential-ISP reachability probe, shared-IP neighborhood check, email-deliverability check. Must be run before externally promoting any new domain.

## Process
- [ ] Append this PR's URL to the COE examples list in `~/build/CLAUDE.md` once merged. CLAUDE.md lives in `private-claude-code-docs`; that commit is separate from this repo. (Claude-automatable, next session)
- [ ] Add a Claude feedback memory: "named-process skills (`/coe`, `/commit`, etc.) must execute every documented step; adapt template fields when the default framing doesn't fit; never degrade to chat-only output." See `docs/coes/2026-04-22-coe-process-adherence.md`. (Claude-automatable, next session)

## Content
- [ ] Evaluate Eleventy migration if site grows past 3-4 pages
