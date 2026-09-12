---
type: system
status: current
created: 2026-08-30
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_plugin]
claim_ids: [clm_98edccb4d232, clm_1c66cecb61a2]
confidence: 0.92
stale_after: 2027-01-10
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# plugin

> **In here:** plugin — 2 claims, confidence 0.92, 2 sources.

## Current understanding

- The action's `prompt` input accepts a skill invocation as well as plain text: a repository skill needs `actions/checkout` before the action step so its files are on the runner, while a plugin skill is installed with the `plugin_marketplaces` and `plugins` inputs and invoked by its namespaced name (0.93)
- A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an underscore (0.90)

## Evidence

- `clm_98edccb4d232` — "The action's `prompt` input accepts a skill invocation as well as plain text: a repository skill needs `actions/checkout` before the action step so its files are on the runner, while a plugin skill is installed with the `plugin_marketplaces` and `plugins` inputs and invoked by its namespaced name." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "* For a skill in your repository's `.claude/skills/` directory, run `actions/checkout` before the `anthropics/claude-code-action` step so the skill files are available on the runner, then pass `/skill-name` as the `prompt`."
- `clm_1c66cecb61a2` — "A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an underscore." · p 0.90 · active · 1 support · 0 contradict · when: for plugin-bundled MCP servers
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Tools from a plugin-bundled MCP server include both the plugin name and the server key in their callable name."

## Timeline

- 2026-08-23 new_claim `clm_1c66cecb61a2` (src_9e7c0cb34402)
- 2026-08-30 new_claim `clm_98edccb4d232` (src_7962dafdd21b)

## Related

- ← uses [[claude-code-github-action]] (0.93)
- [[claude-code-github-action]] — 1 shared claim
- [[mcp-server]] — 1 shared claim
- [[mcp-tool]] — 1 shared claim
- [[skills]] — 1 shared claim
