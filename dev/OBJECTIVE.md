# Objective

File two RCAs against the luthien-pbc-site repo:

1. luthien.cc is unreachable on some consumer ISPs (T-Mobile confirmed, at least one other reproduced). SSL Labs says our Cloudflare config is clean, so the breakage is SNI-level ISP/middlebox interference on a `.cc` TLD with known reputation problems. Diagnosis complete. No code fix in this PR — remediation requires a human decision on canonical Luthien domain.

2. Meta-COE: the first attempt at `/coe` on this incident produced an inline chat response instead of a committed PR, skipping the documented process steps. This PR is the corrective action and also files the RCA on the process gap so the same degradation doesn't recur on the next edge-case incident.

Deliverables in this PR:
- `docs/coes/2026-04-22-luthien-cc-unreachable.md`
- `docs/coes/2026-04-22-coe-process-adherence.md`
- `docs/coes/README.md` (new COE index for this repo)
- `dev/context/gotchas.md` updates (two entries)
- `dev/TODO.md` updates (domain + process follow-ups)
