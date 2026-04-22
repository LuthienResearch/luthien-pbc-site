# Objective

File a meta-COE on why the first two `/coe` attempts on the luthien.cc reachability incident degraded: turn 1 produced chat-only output with no PR, turn 2 produced a PR but included both COEs together and wrote action items into deprecated `dev/TODO.md`. This PR is the corrective output and also lands the documentation/skill/memory changes that should prevent the same degradations from recurring.

Deliverables:
- `docs/coes/2026-04-22-coe-process-adherence.md` (the meta-COE)
- `docs/coes/README.md` (with both entries: luthien.cc COE + this one)
- `dev/context/gotchas.md` update (process-adherence entry)
- `CLAUDE.md` update: mark `dev/TODO.md` as deprecated in the project structure block
- CHANGELOG entry
- 2 Trello cards for outstanding action items

Sibling PR: #150 (luthien.cc reachability COE, the originating incident).

Out-of-session changes already made that this PR documents:
- `~/.claude/commands/coe.md` updated (step 7 → Trello, not TODO.md)
- `private-claude-code-docs/CLAUDE.md` updated (locally, commit pending)
- Two feedback memories added: `feedback_named_process_skills_execute_fully.md` and `feedback_task_tracking_in_trello.md`
