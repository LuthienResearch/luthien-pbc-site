# Domain Selection Checklist

**Purpose:** Prevent the next `luthien.cc`-style incident where we promote a domain externally (pitch deck, cold email, LOI) and only discover months later that a meaningful fraction of visitors can't reach it.

**When to run this checklist:**
- Before registering a new domain
- Before promoting any domain to external-facing status (linking it in the pitch deck, sending it to a prospect, making it the primary URL on marketing assets)
- Before redirecting traffic from an existing domain to a new one

**Maintainer:** Whoever is purchasing or promoting a domain is responsible for completing the checklist. File the output as a comment on the relevant Trello card or as a short markdown note under `docs/audits/`.

---

## 1. WHOIS: does Luthien actually own it?

```bash
whois <domain> | grep -iE "registrar|registrant|creat|expir|status"
```

What to look for:
- **Registrar** line: should be one we actually have an account with (Cloudflare, Squarespace, Porkbun if Luthien, etc.). If it's a registrar we don't control, **we don't own the domain.**
- **Registrant** line: often masked behind privacy proxies ("Private by Design, LLC" = Porkbun's proxy; "Domains By Proxy" = GoDaddy's). Privacy masking alone doesn't tell us who owns it — cross-reference against our actual registrar accounts.
- **Creation date**: affects reputation (see step 3).

**Visit the domain in a browser.** If it redirects to a domain marketplace (Atom, Sedo, Dan.com, GoDaddy's "Domain For Sale" page), it is listed for sale. "Owning" a domain at that point means buying it through the marketplace.

### Worked example — why this step exists

During the 2026-04-22 luthien.cc COE, I suggested "fall back to luthien.ai" as the canonical domain because `curl -sI https://luthien.ai` returned 302 and the domain resolved. **That was wrong.** A later `whois luthien.ai` showed Porkbun as the registrar with privacy-masked registrant — not Luthien. Following the redirect in a browser landed on `https://www.atom.com/name/luthien.ai`, Atom's domain marketplace. Luthien does not own luthien.ai.

Lesson: **`curl returning 302` is not evidence of ownership.** Always WHOIS before recommending a domain as canonical.

## 2. Reachability probe: does it work on real paths?

```bash
scripts/reachability-check.sh <domain>
# or with SSL Labs:
scripts/reachability-check.sh <domain> --full
```

What to check:
- All distributed probes return 2xx or 3xx
- No "ISP URL-filter redirect" detected on HTTP
- No TLS-layer errors on HTTPS
- SSL Labs grade ≥ A (full mode only)

**If any probe fails:**
- Local-baseline FAIL only → the problem is your own ISP; re-test from mobile hotspot or VPN exit before concluding.
- Distributed-probe FAIL → multiple ISPs are filtering the domain; TLD/IP reputation likely involved. Do not promote.

### Worked example — why this step exists

`luthien.cc` was promoted across the pitch deck, cold emails, and LOI templates before we realized T-Mobile Home Internet (and at least one other consumer ISP) was TLS-filtering it. We had no signal that a subset of our audience couldn't reach the site. See `docs/coes/2026-04-22-luthien-cc-unreachable.md` for the full diagnosis.

## 3. TLD reputation: is the TLD heavily abused?

High-abuse TLDs (as of early 2026): `.cc`, `.tk`, `.ml`, `.ga`, `.cf`, `.gq`, `.top`, `.xyz`, `.icu`. Consumer ISPs often reputation-flag hostnames on these TLDs by default.

**Check:**
- [Spamhaus Domain Block List](https://www.spamhaus.org/dbl/) — search for the TLD and specific hostname
- [Google Safe Browsing](https://transparencyreport.google.com/safe-browsing/search) — check the exact URL
- [VirusTotal](https://www.virustotal.com/gui/home/url) — paste the URL; check "Community Score" and any vendor flags

**Interpretation:**
- Zero flags across all three + well-aged TLD (.com, .org, .io, .ai, .dev) → safe.
- Flags on the specific hostname → **do not use.**
- TLD flagged but specific hostname clean + domain is aged (>1 year) → usually OK, but probe from consumer ISPs first.
- TLD flagged + domain is new (<6 months) → **expect filtering.** This is the luthien.cc profile.

### Worked example — why this step exists

`luthien.cc` was registered 2026-03-25 (4 weeks before the incident surfaced). The `.cc` TLD has a long-standing reputation problem, and new hostnames on high-abuse TLDs are filtered by default until they age into trust. Nothing about this is Luthien-specific — a brand-new `.cc` from any registrant looks identical to a brand-new `.cc` phishing site to an ISP's reputation system.

## 4. Shared-IP neighborhood: who else is on your IP?

Only relevant for CDN-fronted domains (Cloudflare Pages, Fastly, etc.) that put your site on a shared anycast IP pool.

```bash
dig +short <domain>                                # get IPs
# For each IP:
curl -s "https://api.hackertarget.com/reverseiplookup/?q=<ip>" | head -20
```

Alternatively: [ViewDNS reverse IP lookup](https://viewdns.info/reverseip/).

**Interpretation:**
- Reverse IP shows mostly-reputable neighbors → fine.
- Reverse IP shows spammy/phishy neighbors → your domain inherits their reputation. Consider a dedicated IP (Cloudflare Enterprise) or a different CDN.
- Reverse IP shows nothing (rare on CDNs) → shared but not discoverable; treat as neutral.

This step is optional for `.com`/`.org`/`.ai` but **required for `.cc`/`.xyz`/anything high-abuse** because neighbor reputation compounds TLD reputation.

## 5. Email deliverability: will mail from this domain hit inboxes?

**Only relevant if we plan to send email from `user@<domain>`.**

Send one test email from the domain to each of:
- Gmail (personal)
- Gmail (Workspace if we have one)
- Outlook (personal)
- Yahoo
- A corporate address (test with a friendly customer if possible)

Check inbox vs. spam vs. promotions placement. If the domain is new AND on a high-abuse TLD, expect spam-folder placement until SPF/DKIM/DMARC are configured and the domain ages.

**Optional automated check:**
- [mail-tester.com](https://www.mail-tester.com/) — sends a test email and scores it.
- [MXToolbox blacklist lookup](https://mxtoolbox.com/blacklists.aspx) — check if the domain or its mail IPs are on any RBLs.

## 6. Age and maturity

New domains (< 3 months) on high-abuse TLDs are filtered aggressively. New domains on mature TLDs (.com, .org, .ai) are treated more neutrally but still filtered by some aggressive ISP policies.

**Rule of thumb:**
- < 1 month old: expect problems; don't promote externally yet unless you've passed all checks above
- 1-6 months: monitor; run the reachability probe weekly
- 6+ months on a clean TLD: stable

You cannot fake age. If the timeline requires a working domain sooner, buy an aged domain from a marketplace instead of registering fresh.

---

## Fast-path: go/no-go for common cases

| Domain profile | Go/No-Go |
|----------------|----------|
| New `.com` at a reputable registrar, clean Spamhaus, probe passes | **GO** |
| New `.ai`/`.io`/`.dev` same conditions | **GO** (minor risk from some enterprise filters) |
| New `.cc`/`.xyz`/`.top` even with clean rep | **NO-GO** for external promotion; re-evaluate after 6 months of aging |
| Acquired (aged, 2+ years) domain, any TLD, passes probe | **GO** |
| Any domain where reachability probe FAILS from distributed nodes | **NO-GO** until the failure is understood |
| Any domain the WHOIS step shows we don't own | **NO-GO** until acquired |

---

## Closing the loop

When this checklist is used for a domain decision, save the output (pass/fail per section + notes) somewhere durable:
- Trello card comment is fine for one-off decisions.
- For permanent records (e.g., the canonical Luthien domain), a Markdown file under `docs/audits/YYYY-MM-DD-<domain>-audit.md`.

If a check surfaces something non-obvious (new TLD reputation issue, new marketplace pattern, a registrar we didn't know we had), **update this checklist** in the same PR as the audit so the next person benefits.

---

## References

- [`docs/coes/2026-04-22-luthien-cc-unreachable.md`](../coes/2026-04-22-luthien-cc-unreachable.md) — the incident that motivated this checklist
- [`docs/audits/2026-04-22-luthien-cc-reference-inventory.md`](../audits/2026-04-22-luthien-cc-reference-inventory.md) — how wide the blast radius is when a bad domain decision propagates
- `scripts/reachability-check.sh` — the probe called out in step 2
- Trello card [kHs0XHhn](https://trello.com/c/kHs0XHhn) (architectural action item from COE PR #150) — this document is its deliverable
