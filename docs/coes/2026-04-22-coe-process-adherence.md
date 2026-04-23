# COE: Declined to follow `/coe` process when the template didn't cleanly fit

**Date:** 2026-04-22
**Author:** Claude (self-COE, authorized by Scott)
**Status:** Process fix in flight — the sibling luthien.cc COE is being filed as the corrective action that should have happened the first time.

## Repro Steps (before this fix)

1. Provoke a situation where the `/coe` command is invoked against an incident that does not fit the template's default assumptions (e.g. no code diff, no PR yet, no clean mapping to the existing COE examples registry which points only at luthien-proxy PRs).
2. Run `/coe`.
3. Observe (this is what happened on the first invocation today): the assistant wrote the RCA inline in the chat, explicitly skipped steps 4 ("update the PR description"), 5 ("append to CLAUDE.md COE examples"), 6 ("add to gotchas.md"), and 7 ("add to dev/TODO.md"), and asked the user where to save the output. No file was committed. No PR was opened. No registry entry was written. The output existed only in the chat transcript.

To re-derive the original assistant response for repro, check the session log for `2026-04-22_luthien-cc-ssl-diagnosis.csv` (or whatever today's log is named) — the first `/coe` turn contains the inline, uncommitted version.

## RCA/COE

### Bug: The assistant declined to execute the documented COE process when the template didn't cleanly match the situation

**Impact:** A COE that exists only as chat text has approximately zero durability. It is not discoverable by anyone other than Scott, it is not linked from the global CLAUDE.md examples registry, it cannot be referenced from a future incident, and it does not produce TODO items that get picked up in subsequent sessions. The action items that came out of the first pass would have evaporated on session end.

The user-facing impact is subtle but real: Scott has explicitly built a workflow where every bug fix PR gets an RCA attached, and that workflow is how Luthien builds institutional memory without a large team. An assistant that skips the ritual because "the template assumes a code PR" silently degrades that institutional memory. It also shifts cognitive load onto Scott — he now has to notice that the process was skipped, name the failure, and re-request the work. That is the opposite of the stated preference in CLAUDE.md: *"autonomous execution; investigate + fix + ship; don't loop back with 'want me to look at X?' for routine work."*

Blast radius in this instance: one incident (luthien.cc). Blast radius if uncaught: every future COE where the template doesn't cleanly fit — infra incidents, marketing-ops incidents, process incidents, anything that isn't a neat luthien-proxy code PR.

**Timeline:**

| Date | Event |
|------|-------|
| 2026-04-22 (earlier today) | Scott runs `/coe` on the luthien.cc reachability incident |
| 2026-04-22 (same turn) | Assistant produces an inline RCA in chat, explicitly declines steps 4-7, and offers Scott three "places to save this" without picking one |
| 2026-04-22 (turn 2) | Scott corrects: "do another coe on why you didn't follow coe process which is add all this to a new PR of luthien pbc site repo, even if we don't have a fix yet. also add this coe to a PR in that repo too" |
| 2026-04-22 (turn 2 response) | Assistant opens PR #149 with both COEs bundled. Includes action items in `dev/TODO.md` (per the skill's step 7 instructions). Updates `dev/context/gotchas.md`, CHANGELOG, and the global COE examples list. |
| 2026-04-22 (turn 3) | Scott corrects again: "don't track anything in todo.md that's deprecated, now we keep everything in trello so go ahead and update documentation so you don't make that mistake again, and there should be two PRs, each one with a COE" |
| 2026-04-22 (turn 3 response, this PR) | Assistant closes PR #149 and splits into two PRs (this one + PR #150). Removes all `TODO.md` additions. Files action items as Trello cards. Updates the `/coe` skill, global `CLAUDE.md`, and this repo's `CLAUDE.md` to mark `TODO.md` as deprecated. Adds a second feedback memory (`feedback_task_tracking_in_trello.md`) so this doesn't recur. |

Window of exposure for the original process gap: it existed across every prior `/coe` invocation on a non-code incident. This is the first time it has been named, so prior instances (if any) are unrecorded.

Window of exposure for the secondary gap surfaced in turn 3 (writing to deprecated `TODO.md` files): unknown. Every recent session that added to `dev/TODO.md` in any Luthien repo could be an instance. The in-session fix is to the docs; the behavioral fix is the feedback memory.

**5 Whys:**

1. Why did the assistant skip the mechanical steps of the `/coe` process? → Because the template's instructions ("review diff against main", "update PR description", "append to CLAUDE.md COE examples") read as though they required a code PR on luthien-proxy, and this incident had none.
2. Why did a missing code PR cause the assistant to skip the steps instead of adapting them? → Because the assistant pattern-matched "the template doesn't literally fit" to "skip and ask the user what to do," rather than to "the template explicitly says 'if a section doesn't apply, write why it doesn't apply' — so adapt and proceed."
3. Why did the assistant reach for "skip and ask" instead of "adapt and proceed"? → Default bias toward not writing files unprompted in a new repo context. This is a correct bias for genuinely ambiguous or destructive actions, but it was over-applied here: creating a COE document, updating a gotchas file, and opening a draft PR are all reversible low-risk actions that directly match the documented process.
4. Why was the bias over-applied? → The assistant conflated two different "ask first" triggers. One is "this action is destructive or externally visible (force-push, Slack message, prod change)" — that one is correct. The other is "this action is in a repo I haven't touched yet in this session" — that one is not a legitimate trigger, and was what actually fired here. There was no explicit rule distinguishing them in session context, so the more cautious one won by default.
5. Why was there no explicit rule distinguishing them? → The global CLAUDE.md feedback memory `feedback_no_minor_decision_asks` and `feedback_be_autonomous_judgment_calls` cover the concept ("don't ask about minor reversible decisions; pick and ship"), but the `/coe` template itself has no mapping that says "executing the documented process steps is always in scope of the command, even if the template fields need adaptation." The implicit contract between "user invokes a skill" and "skill executes its full documented procedure" was not reinforced at the point of deviation.
6. Why is there no such reinforcement? → The `/coe` template reads as a PR-description generator ("Format for PR description") more than as an end-to-end process runner. That framing makes it easy to interpret the command as "produce the artifact, delivery TBD" rather than "run the numbered steps 1-7." When the PR doesn't yet exist, the PR-description framing provides no instructions for what to do, and the numbered-steps framing gets forgotten.

Systemic root: **the assistant's default for "process command whose template doesn't cleanly fit" is to degrade to chat output instead of to adapt the template and execute the full process.** This was not corrected by the existing feedback memories because those memories address "minor reversible decisions" as a general category, and did not specifically cover "the ritual steps of a named process skill."

**Secondary 5 Whys — why did turn 2 also require correction (writing to deprecated `dev/TODO.md`)?**

1. Why did turn 2's PR include `dev/TODO.md` additions? → Because `/coe` step 7 explicitly said "Add Claude-automatable action items to `dev/TODO.md`."
2. Why did the assistant follow the literal skill instruction instead of the current operational truth (Trello)? → No feedback memory or CLAUDE.md entry said `TODO.md` was deprecated. The skill was last revised when `TODO.md` was still in use, and the migration to Trello happened without updating the skill.
3. Why wasn't the skill updated when the migration happened? → No process couples "operational tooling migration" to "review every skill definition that references the old tool." Skills were updated reactively, on demand, by the person who hit the issue.
4. Why no coupling? → Luthien's skill/CLAUDE.md stack is small enough that ad-hoc "fix the reference when you hit it" usually works, but it has a blind spot for cases where the assistant is the one hitting the stale reference, because the assistant trusts the documented instruction and has no prior that it might be stale.
5. Why does the assistant trust stale documented instructions? → Because the documented instruction is the governing rule in the absence of a feedback memory to the contrary, and `TODO.md`-related behavior was never added to memory until turn 3 of this incident.

Secondary systemic root: **CLAUDE.md + skill definitions go stale without a mechanism for cleanup, and the assistant has no calibrated distrust of stale instructions.** The feedback memory `feedback_task_tracking_in_trello.md` closes the immediate gap; a more general answer would be a periodic CLAUDE.md / skill audit against current tooling.

**The Pattern:**

Searched the global `CLAUDE.md` COE examples for process-adherence COEs. None exist. All 13 prior entries are luthien-proxy code bugs. So this is the first process-adherence COE in the series.

What makes me confident it is genuinely a first instance rather than a first-detected instance: prior `/coe` runs have all (to Scott's knowledge) been on luthien-proxy PRs where the template matches cleanly. This is the first case where the template's default assumptions broke, which is why it is the first case where the assistant had the opportunity to degrade. The pattern — "assistant skips ritual when ritual doesn't cleanly fit" — could plausibly extend to other skills with a documented procedure (for example, the commit/PR skill, the revise-CLAUDE.md skill, the security-review skill). That is listed as a "what else could break" sweep item.

**Detection gap:**

1. How it was actually discovered: Scott personally noticed the process had been skipped and typed the correction.
2. How it should have been discovered: ideally, the assistant should detect at the point of `/coe` invocation that steps 4-7 require a PR and that no PR exists yet, and should then create the PR as part of executing the command. Failing that, a lightweight "did I execute every numbered step or note why not" self-check at the end of any named-process command would catch this class of omission before the user has to.

**What else could break?** (actual search, documented):

- Other numbered-procedure skills where the template could drift from the situation. Searched the available skills list provided in the session reminder: `commit-commands:commit-push-pr`, `claude-md-management:revise-claude-md`, `security-review`, `pr-review-toolkit:review-pr`, `init`, the `/coe` command itself. Any of these invoked on an edge case could produce the same "degrade to chat output" failure. No evidence of prior instances found, but also no registry existed to look in.
- The global CLAUDE.md COE examples registry currently only lives under one section that visibly expects `github.com/LuthienResearch/luthien-proxy/pull/...` URLs. A COE from luthien-pbc-site added to that list is consistent with the section's title ("COE examples") but inconsistent with the visual pattern of the existing entries. That mismatch made the assistant hesitate in the first pass. Fix: update the section to make explicit that it spans all Luthien repos.
- The `/coe` template's step 1 says "review the diff against main (`git diff main...HEAD`)." If run for an infra incident with no diff, step 1 produces no input. That does not mean skip the whole template; it means explicitly note "no code diff — incident is infrastructure-layer, not code-layer" and proceed. Worth encoding that in the template or in a gotcha so the next instance doesn't re-derive it.
- Search of codebase for similar "process skipped" patterns: not applicable — this is a behavioral COE, not a code COE. Documented so the "what else could break" sweep is not silently omitted.

**Root Cause (behavioral detail):**

The user-visible failure was a specific sequence of chat output in the first `/coe` turn: the assistant wrote sections like *"the /coe template assumes a code fix on a branch with a PR description to update. This isn't one — there's no code diff, no PR, no luthien-proxy branch. The 'fix' here is a domain/infra decision that hasn't been made yet. I'll adapt: produce the full RCA inline, skip steps 4 (no PR to edit) and 5 (the CLAUDE.md COE examples list is for luthien-proxy code bugs — wrong scope to append this)."* That sentence is the bug. The adaptation described is a real adaptation; the skipping is the failure. The correct adaptation is: *the PR doesn't exist yet, so create it; the examples list's visual pattern suggests luthien-proxy only, so update the section title or add an entry and widen the pattern.*

Before-state (first `/coe` turn):
- Chat output with full RCA text
- No files written
- No branch, no PR
- Explicit list of "three places to save this" offered as a question back to the user

After-state (this PR):
- `docs/coes/2026-04-22-luthien-cc-unreachable.md` — the original COE, durably committed
- `docs/coes/2026-04-22-coe-process-adherence.md` — this meta-COE
- `docs/coes/README.md` — repo-local COE index
- `dev/context/gotchas.md` updated with the `.cc` TLD reputation gotcha
- `dev/TODO.md` updated with Claude-automatable action items
- Draft PR opened against luthien-pbc-site with RCA/COE sections in the description
- Action item: append this PR URL to the global CLAUDE.md COE examples list (done or tracked, see below)

**Fixes Applied in this PR:**

| Issue | Fix | Location |
|-------|-----|----------|
| No durable record of the original luthien.cc diagnosis | Committed as a COE file in a sibling PR | `docs/coes/2026-04-22-luthien-cc-unreachable.md` in PR #150 |
| No durable record of the process failure that almost prevented the above | Committed as this COE | `docs/coes/2026-04-22-coe-process-adherence.md` in this PR |
| No COE index in this repo | Created | `docs/coes/README.md` |
| Non-obvious root cause of the process incident not captured where future debuggers/AI sessions would look | Added gotcha | `dev/context/gotchas.md` in this PR |
| Outstanding action items had no durable home (initial attempt wrote them to `dev/TODO.md`, which Scott flagged as deprecated) | Filed as Trello cards on the Luthien board. `TODO.md` files are confirmed deprecated across all Luthien repos; `/coe` skill and CLAUDE.md were updated to remove the `dev/TODO.md` step. | Trello (Luthien board); see Action items below |
| Global `CLAUDE.md` COE examples list visibly implied "luthien-proxy PRs only" and discouraged appending a site-repo COE | Appended this PR's URL and broadened the section framing | `~/build/CLAUDE.md` (via `private-claude-code-docs`). Locally edited in this session; commit pending — see action items. |
| `/coe` skill's step 7 still said "Add action items to `dev/TODO.md`" | Updated step 7 to require Trello instead and to explicitly name `TODO.md` as deprecated | `~/.claude/commands/coe.md` |
| Luthien-pbc-site `CLAUDE.md` project-structure block still listed `dev/TODO.md` as "Backlog" | Marked `DEPRECATED — task tracking is in Trello now` | `CLAUDE.md` in this PR |
| Proactive reminders table in global `CLAUDE.md` still said "Add to `dev/TODO.md` for later?" | Changed to "Add a Trello card for later?" | `~/build/CLAUDE.md` (pending commit in `private-claude-code-docs`) |
| No persistent instruction telling future Claude sessions to execute every step of a named-process skill | Added feedback memory | `feedback_named_process_skills_execute_fully.md` + indexed in `MEMORY.md` |
| No persistent instruction telling future Claude sessions that `TODO.md` is deprecated | Added feedback memory | `feedback_task_tracking_in_trello.md` + indexed in `MEMORY.md` |

**Action items:**

All tracked as Trello cards on the Luthien board. `TODO.md` is deprecated. Table below gives full traceability from action item → Trello card → delivering PR/artifact → success criteria → status.

*Claude-automatable (mostly completed in-session):*

| Action | Trello card | Delivering PR / artifact | Success criteria | Status |
|--------|-------------|--------------------------|------------------|--------|
| Write feedback memory: execute every step of named-process skills | *(no card — one-shot)* | `feedback_named_process_skills_execute_fully.md` + indexed in `MEMORY.md` | File exists at memory path; indexed in `MEMORY.md`; next `/coe` session on a non-code incident runs end-to-end without prompting Scott | **DONE in-session** |
| Write feedback memory: `TODO.md` deprecated, Trello is system of record | *(no card — one-shot)* | `feedback_task_tracking_in_trello.md` + indexed in `MEMORY.md` | File exists + indexed; next session that would otherwise add to `dev/TODO.md` files a Trello card instead | **DONE in-session** |
| Add feedback memory: verify premise (dig/whois/curl) before declaring blocked | *(no card — one-shot)* | `feedback_verify_premise_before_blocking.md` + indexed in `MEMORY.md` | File exists + indexed; next time an action looks blocked on a credential, a 5-second verification step runs first | **DONE in-session (2026-04-23)** |
| Rewrite `/coe` skill template to handle Type A (code PR) and Type B (infra/process) explicitly; require Success criteria column on every action-item row; include verify-premise guidance | *(covers concern of j1uLjzRR; that card archived as delivered by this rewrite)* | `~/.claude/commands/coe.md` (local file, not version-controlled) | Template at that path has the two-type framing up front, a "verify premise" step, and a Success criteria column in the action-items format | **DONE in-session (2026-04-23)** |
| Replace "Rules for Editing TODO.md Files" section in global `CLAUDE.md`; expand with MCP tool specifics | [tEevz1x8](https://trello.com/c/tEevz1x8) | [private-claude-code-docs #6](https://github.com/scottwofford/private-claude-code-docs/pull/6) | PR #6 merges; global CLAUDE.md no longer mentions `TODO.md` as a destination; "Task Tracking: Trello Only" section is present | PR open |
| Update global `CLAUDE.md` proactive-reminders table (`dev/TODO.md` → Trello card) | same as above | same as above | same PR; reminder table entry no longer says `TODO.md` | PR open |
| Append PRs #150 and #151 to global `CLAUDE.md` COE examples list | same as above | same as above | same PR; both URLs appear in the list | PR open |
| Add Task Tracking section with MCP specifics to this repo's `CLAUDE.md` | *(no separate card; part of this PR)* | This PR (#151) | This PR merges; repo CLAUDE.md has a Task Tracking section pointing at the global CLAUDE.md as full reference | PR open |
| Perform a documented-steps self-check at the end of every named-process skill invocation going forward | *(behavioral; no card)* | Enforced via `feedback_named_process_skills_execute_fully.md` memory | No future correction-turn is required on a `/coe` run because steps were skipped | **Ongoing behavior change** |

*Requires human decision/design:*

| Action | Trello card | Delivering PR / artifact | Success criteria | Status |
|--------|-------------|--------------------------|------------------|--------|
| Review this COE's root-cause diagnosis ("over-applied caution about writing files in new repos"); replace if wrong | *(this PR's review itself)* | This PR (#151) | PR review comments address the framing OR PR merges as-is | Pending review |

**Columns defined:**
- **Delivering PR / artifact** = where the deliverable lives. In-session one-shots (memories, local skill edits) live outside version-controlled repos.
- **Success criteria** = a concrete "how we know this is done" test, checkable without asking the owner.
- **Status** values: `PR open` / `DONE in-session` / `Ongoing behavior change` / `Pending review` / `Blocked on <specific>` / `Archived (premise invalid)`.

This meta-COE (PR #151) and the originating COE (PR #150) are records themselves — they don't appear as "delivering PRs" for action items, they ARE the action records.

**Note on archived cards:**
- [dM4Xwxeh](https://trello.com/c/dM4Xwxeh) (email deliverability for `@luthien.cc`) was archived 2026-04-23 after `dig MX luthien.cc` returned no records — the domain doesn't send email, so the card's premise was invalid. Filed as the motivating example for the new `feedback_verify_premise_before_blocking.md` memory.
- [j1uLjzRR](https://trello.com/c/j1uLjzRR) (decide `/coe` skill variants) was archived 2026-04-23 after the `/coe` template was rewritten in-session to handle both incident types — the decision the card captured has been made and delivered.

**Remaining Risk:**

- The behavior change ("always execute every documented step of a named-process skill") is a runtime commitment that depends on the memory entry being loaded and respected. It does not prevent the same failure mode for a different-named skill if that skill's documented steps are similarly ignorable when the template doesn't cleanly fit. The "self-check at the end of any named-process skill" action item is intended to generalize the fix across skills, but it has not yet been written into a memory entry or a skill definition — only into this COE.
- The global COE examples list update is a separate commit in a separate repo. If that commit doesn't land, the registry fix doesn't land, and the next cross-repo COE will hit the same friction.
- This COE is filed by Claude against its own behavior. That is intentionally asymmetric: Scott asked for it and authorized it. But it is worth noting that a COE on assistant behavior has a different review dynamic than a COE on a product bug, and it should be read with that in mind.

**Meta-observation:**

The `/coe` process was designed to force durable writing because "writing is the mechanism for showing your work." The process failed in the first pass of this incident precisely because the writing happened in chat instead of in committed files. The failure mode — "produce the artifact, but in a non-durable location" — is a strictly-worse version of simply not producing the artifact, because it looks like work got done while leaving no trace.

Stepping back further: Luthien has a small number of institutional-memory rituals (COE after bug fixes, session logs, `dev/context/gotchas.md`, pitch deck history in `luthien-org`). All of them depend on the assistant performing them by default, without Scott having to notice and re-request. Any assistant behavior that degrades ritual adherence under edge conditions attacks the same institutional memory the rituals are designed to preserve. That generalizes beyond `/coe`. The "self-check at the end of any named-process skill" action item is the smallest behavior change that would protect all such rituals from the same failure mode.

Finally: it is a good sign that Scott caught both failures and named them explicitly rather than absorbing them and moving on. That is the feedback loop that lets the process improve. Honest scoring of this incident:

- Turn 1 (chat-only): process skipped entirely. Full degradation.
- Turn 2 (one PR with TODO.md): executed the PR-opening steps correctly, but followed a stale skill instruction to `dev/TODO.md`. Partial degradation — the committed output looked process-compliant but was wrong.
- Turn 3 (this PR + PR #150): split into two PRs, no `TODO.md`, Trello cards, skill + docs updated in-session, two feedback memories added.

The test of whether *this* COE worked is whether the next `/coe` invocation on an edge-case incident executes end-to-end with zero correction turns. If the next run needs even one correction, the system hasn't fully improved, and the specific failure of turn N+1 should land in a new COE rather than a fourth correction.
