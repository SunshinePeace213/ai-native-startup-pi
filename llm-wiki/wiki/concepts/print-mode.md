---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/cli-reference.md, title: "CLI reference", id: src_716248fd9713}
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_print_mode]
claim_ids: [clm_0659b458e4aa, clm_935a50944ab0, clm_fa3825370f1f]
confidence: 0.90
stale_after: 2027-01-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# print mode

> **In here:** The -p / --print flag is Claude Code's non-interactive entry point: it prints the response instead of opening an interactive session, and is the surface used for programmatic and SDK-style invocation · 3 claims, confidence 0.90.

## Current understanding

- Bare mode makes a headless Claude Code run reproducible across machines by skipping auto-discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory, and CLAUDE.md, and it is the recommended mode for scripted and SDK calls (0.93)
- The -p / --print flag is Claude Code's non-interactive entry point: it prints the response instead of opening an interactive session, and is the surface used for programmatic and SDK-style invocation (0.89)
- The --bg / --background flag starts a session as a background agent and returns immediately with the session ID and management commands, and it cannot be combined with -p / --print (0.89)

## Evidence

- `clm_0659b458e4aa` — "Bare mode makes a headless Claude Code run reproducible across machines by skipping auto-discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory, and CLAUDE.md, and it is the recommended mode for scripted and SDK calls." · p 0.93 · active · 1 support · 0 contradict · when: in headless print mode
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Add `--bare` to reduce startup time by skipping auto-discovery of hooks, skills, custom commands, [subagents](/docs/en/sub-agents), plugins, MCP servers, auto memory, and CLAUDE.md."
- `clm_935a50944ab0` — "The -p / --print flag is Claude Code's non-interactive entry point: it prints the response instead of opening an interactive session, and is the surface used for programmatic and SDK-style invocation." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "| `--print`, `-p` | Print response without interactive mode (see [Agent SDK documentation](/docs/en/agent-sdk/overview) for programmatic usage details) |"
- `clm_fa3825370f1f` — "The --bg / --background flag starts a session as a background agent and returns immediately with the session ID and management commands, and it cannot be combined with -p / --print." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "| `--bg`, `--background` | Start the session as a [background agent](/docs/en/agent-view) and return immediately. Prints the session ID and management commands."

## Timeline

- 2026-08-23 new_claim `clm_935a50944ab0` (src_716248fd9713)
- 2026-08-23 new_claim `clm_fa3825370f1f` (src_716248fd9713)
- 2026-08-23 new_claim `clm_0659b458e4aa` (src_d5ec157b2e7b)

## Related

- ← applies_to [[bare-mode]] (0.93)
- → part_of [[claude-code]] (0.93)
- [[claude-code]] — 3 shared claims
- [[bare-mode]] — 1 shared claim
- [[claude-agent-sdk]] — 1 shared claim
- background session (no page yet)
