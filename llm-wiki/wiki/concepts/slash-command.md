---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/commands.md, title: "Commands", id: src_63b61512d6ab}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
  - {resource: llm-wiki/raw/docs/pi/prompt-templates.md, title: "Prompt Templates", id: src_0bc77feb25be}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_slash_command]
claim_ids: [clm_16151e65ea2f, clm_86f2c89fbcb1, clm_742b530ea197, clm_f54dd327d44e, clm_0617d629981c, clm_714f78c08bf2, clm_5d94196bbcc7, clm_10c46e8fa80e]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# slash command

> **In here:** A Pi prompt template's filename is its command name, so review.md is invoked as /review · 8 claims, confidence 0.92.

## Current understanding

- Slash commands control Claude Code from inside a running session, offering a quick way to switch models, manage permissions, clear context, or run a workflow (0.93)
- A Pi prompt template's filename is its command name, so review.md is invoked as /review (0.93)
- Some entries in Claude Code's command list are bundled skills rather than coded-in commands, and they behave like user-written skills — a prompt handed to Claude, which Claude can also invoke on its own when relevant (0.93)
- A slash command sent while Claude is still responding is queued until the current turn finishes, though Claude Code runs a few status commands such as /status, /tasks, and /usage immediately without interrupting the response (0.92)
- Prompts exposed by a connected MCP server appear in Claude Code's slash-command list as `/mcp__servername__promptname` (0.92)
- A few available commands are kept out of Claude Code's slash-command menu by design and a partial name never surfaces them; the command is listed only once its full name is typed, and submitting that full name runs it (0.92)
- A slash command is recognized only at the start of a message and everything after its name becomes its arguments, with skills as the exception: up to six skills can be chained at the start of a message and each receives the trailing text as arguments (0.90)
- Prompts exposed by connected MCP servers are dynamically discovered and appear as slash commands in the form /mcp__<server>__<prompt> (0.89)

## Evidence

- `clm_16151e65ea2f` — "Slash commands control Claude Code from inside a running session, offering a quick way to switch models, manage permissions, clear context, or run a workflow." · p 0.93 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "Commands control Claude Code from inside a session. They provide a quick way to switch models, manage permissions, clear context, run a workflow, and more."
- `clm_86f2c89fbcb1` — "A Pi prompt template's filename is its command name, so review.md is invoked as /review." · p 0.93 · active · 1 support · 0 contradict
  - `src_0bc77feb25be` Prompt Templates: "The filename becomes the command name. `review.md` becomes `/review`."
- `clm_742b530ea197` — "Some entries in Claude Code's command list are bundled skills rather than coded-in commands, and they behave like user-written skills — a prompt handed to Claude, which Claude can also invoke on its own when relevant." · p 0.93 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "**[Skill](/docs/en/skills#bundled-skills)**: a bundled skill. It works like skills you write yourself: a prompt handed to Claude, which Claude can also invoke automatically when relevant."
- `clm_f54dd327d44e` — "A slash command sent while Claude is still responding is queued until the current turn finishes, though Claude Code runs a few status commands such as /status, /tasks, and /usage immediately without interrupting the response." · p 0.92 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "If you send a command while Claude is responding, Claude Code queues it and runs it after the current turn finishes. Claude Code runs some commands immediately without interrupting the response, such as `/status`, `/tasks`, and `/usage`."
- `clm_0617d629981c` — "Prompts exposed by a connected MCP server appear in Claude Code's slash-command list as `/mcp__servername__promptname`." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Type `/` to see the commands available to you, including those from MCP servers. MCP prompts appear with the format `/mcp__servername__promptname`."
- `clm_714f78c08bf2` — "A few available commands are kept out of Claude Code's slash-command menu by design and a partial name never surfaces them; the command is listed only once its full name is typed, and submitting that full name runs it." · p 0.92 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "**Hidden commands**: Claude Code keeps a few available commands, such as `/heapdump`, out of the menu by design."
- `clm_5d94196bbcc7` — "A slash command is recognized only at the start of a message and everything after its name becomes its arguments, with skills as the exception: up to six skills can be chained at the start of a message and each receives the trailing text as arguments." · p 0.90 · active · 1 support · 0 contradict · when: as of Claude Code v2.1.199
  - `src_63b61512d6ab` Commands: "A command is only recognized at the start of your message. Text that follows the command name becomes its arguments."
- `clm_10c46e8fa80e` — "Prompts exposed by connected MCP servers are dynamically discovered and appear as slash commands in the form /mcp__<server>__<prompt>." · p 0.89 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "MCP servers can expose prompts that appear as commands. These use the format `/mcp__<server>__<prompt>` and are dynamically discovered from connected servers."

## Timeline

- 2026-08-23 new_claim `clm_0617d629981c` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_16151e65ea2f` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_5d94196bbcc7` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_f54dd327d44e` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_742b530ea197` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_714f78c08bf2` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_10c46e8fa80e` (src_63b61512d6ab)
- 2026-09-11 new_claim `clm_86f2c89fbcb1` (src_0bc77feb25be)

## Related

- ← produces [[prompt-template]] (0.94)
- → part_of [[claude-code]] (0.93)
- ← extends [[skills]] (0.93)
- ← produces [[mcp-server]] (0.93)
- ← related_to [[skills]] (0.93)
- ← produces MCP prompt (no page yet) (0.92)
- [[claude-code]] — 4 shared claims
- [[mcp-server]] — 2 shared claims
- [[skills]] — 2 shared claims
- [[command-menu]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[prompt-template]] — 1 shared claim
- MCP prompt (no page yet)
