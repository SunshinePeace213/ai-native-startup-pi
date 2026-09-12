---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_bare_mode]
claim_ids: [clm_8a5ac3a8a835, clm_0659b458e4aa]
confidence: 0.93
stale_after: 2029-11-23
last_rendered: 2026-08-23T14:39:21Z
review_required: false
---

# bare mode

> **In here:** Bare mode makes a headless Claude Code run reproducible across machines by skipping auto-discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory, and CLAUDE.md, and… · 2 claims, confidence 0.93.

## Current understanding

- Without bare mode a headless print session runs the hooks in a project's .claude/settings.json and connects the servers in its .mcp.json even in a folder that was never trusted, showing no workspace trust dialog and no per-server approval prompt (0.94)
- Bare mode makes a headless Claude Code run reproducible across machines by skipping auto-discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory, and CLAUDE.md, and it is the recommended mode for scripted and SDK calls (0.93)

## Evidence

- `clm_8a5ac3a8a835` — "Without bare mode a headless print session runs the hooks in a project's .claude/settings.json and connects the servers in its .mcp.json even in a folder that was never trusted, showing no workspace trust dialog and no per-server approval prompt." · p 0.94 · active · 1 support · 0 contradict · when: in headless print mode without --bare
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Without `--bare`, a `-p` session runs the hooks in a project's `.claude/settings.json` and connects the servers in its `.mcp.json`, even in a folder you've never trusted."
- `clm_0659b458e4aa` — "Bare mode makes a headless Claude Code run reproducible across machines by skipping auto-discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory, and CLAUDE.md, and it is the recommended mode for scripted and SDK calls." · p 0.93 · active · 1 support · 0 contradict · when: in headless print mode
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Add `--bare` to reduce startup time by skipping auto-discovery of hooks, skills, custom commands, [subagents](/docs/en/sub-agents), plugins, MCP servers, auto memory, and CLAUDE.md."

## Timeline

- 2026-08-23 new_claim `clm_0659b458e4aa` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_8a5ac3a8a835` (src_d5ec157b2e7b)

## Related

- → applies_to [[workspace-trust]] (0.94)
- → applies_to [[print-mode]] (0.93)
- [[claude-code]] — 2 shared claims
- [[hooks]] — 1 shared claim
- [[print-mode]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
