---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_mcp_tool]
claim_ids: [clm_5bd3b13812ff, clm_1c66cecb61a2, clm_3e6077428de5, clm_77abb4f39957]
confidence: 0.91
stale_after: 2027-01-06
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# MCP tool

> **In here:** A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an… · 4 claims, confidence 0.91.

## Current understanding

- An MCP server can change its available tools, prompts, and resources mid-session by sending a `list_changed` notification, which Claude Code answers by refreshing that server's capabilities without a disconnect and reconnect (0.92)
- A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an underscore (0.90)
- MCP tool output draws a warning past 10,000 tokens and is capped at 25,000 tokens by default, a ceiling raised with the `MAX_MCP_OUTPUT_TOKENS` environment variable while the warning threshold stays fixed (0.90)
- Permission rules, a skill's allowed-tools list, a subagent's tools field, and hook matchers must all name a plugin-bundled MCP tool by its full callable name — a matcher written against the bare server key never fires (0.90)

## Evidence

- `clm_5bd3b13812ff` — "An MCP server can change its available tools, prompts, and resources mid-session by sending a `list_changed` notification, which Claude Code answers by refreshing that server's capabilities without a disconnect and reconnect." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Claude Code supports MCP `list_changed` notifications, allowing MCP servers to dynamically update their available tools, prompts, and resources without requiring you to disconnect and reconnect."
- `clm_1c66cecb61a2` — "A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an underscore." · p 0.90 · active · 1 support · 0 contradict · when: for plugin-bundled MCP servers
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Tools from a plugin-bundled MCP server include both the plugin name and the server key in their callable name."
- `clm_3e6077428de5` — "MCP tool output draws a warning past 10,000 tokens and is capped at 25,000 tokens by default, a ceiling raised with the `MAX_MCP_OUTPUT_TOKENS` environment variable while the warning threshold stays fixed." · p 0.90 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Claude Code displays a warning when MCP tool output exceeds 10,000 tokens and limits output to 25,000 tokens by default. To raise the limit, set the `MAX_MCP_OUTPUT_TOKENS` environment variable (for example, `MAX_MCP_OUTPUT_TOKENS=50000`);"
- `clm_77abb4f39957` — "Permission rules, a skill's allowed-tools list, a subagent's tools field, and hook matchers must all name a plugin-bundled MCP tool by its full callable name — a matcher written against the bare server key never fires." · p 0.90 · active · 1 support · 0 contradict · when: for plugin-bundled MCP servers
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Use this full name when referencing the tool in [permission rules](/docs/en/permissions), a skill's `allowed-tools` list, a [subagent's `tools` field](/docs/en/sub-agents#available-tools), or a [hook…"

## Timeline

- 2026-08-23 new_claim `clm_1c66cecb61a2` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_77abb4f39957` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_5bd3b13812ff` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_3e6077428de5` (src_9e7c0cb34402)

## Related

- [[claude-code]] — 2 shared claims
- [[mcp-server]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- [[plugin]] — 1 shared claim
