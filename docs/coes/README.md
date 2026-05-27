# Corrections of Errors (COEs)

Root cause analyses for bugs, incidents, and process failures affecting Luthien's public-facing infrastructure (this site, domains, deployment, analytics, etc.).

Format follows the Amazon COE template documented in the global `CLAUDE.md` (`/coe` command). Each COE lives in its own dated file and is linked from a PR. Action items from COEs are tracked in Trello, not in any `TODO.md`.

Scope note: this directory is for incidents that touch the public site, marketing domains, and anything a prospective user/investor might see. Code-level bugs in `luthien-proxy` have their own COE thread in that repo; cross-repo references are fine.

## Index

| Date | Title | Status |
|------|-------|--------|
| 2026-05-27 | [Canonical domains 301-redirect to the github.io fallback](./2026-05-27-canonical-domains-redirect-to-github-io.md) | Diagnosis partial (luthien.cc unverified from a clean network); canonical decided (luthien.cc); fix pending Cloudflare/Netlify cutover |
| 2026-04-22 | [luthien.cc unreachable on filtered ISPs](./2026-04-22-luthien-cc-unreachable.md) | Canonical-domain decision resolved 2026-05-27 (luthien.cc); reachability risk knowingly accepted |
| 2026-04-22 | [Declined to follow `/coe` process when the template didn't fit (meta-COE)](./2026-04-22-coe-process-adherence.md) | Process fix in flight — template and docs updated in this PR |
