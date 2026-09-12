---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_model_context_protocol]
claim_ids: [clm_8c4373808e22, clm_5ca433e00ea6]
confidence: 0.93
stale_after: 2029-11-23
last_rendered: 2026-09-11T19:57:09Z
review_required: false
---

# Model Context Protocol

> **In here:** Model Context Protocol — 2 claims, confidence 0.93, 2 sources.

## Current understanding

- The Model Context Protocol is an open source standard for AI-tool integrations, and an MCP server connected to Claude Code gives it access to external tools, databases, and APIs (0.93)
- Pi deliberately ships without built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash, leaving those to extensions, packages, or external tools such as containers and tmux (0.93)

## Evidence

- `clm_8c4373808e22` — "The Model Context Protocol is an open source standard for AI-tool integrations, and an MCP server connected to Claude Code gives it access to external tools, databases, and APIs." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Claude Code can connect to hundreds of external tools and data sources through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open source standard for AI-tool integrations."
- `clm_5ca433e00ea6` — "Pi deliberately ships without built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash, leaving those to extensions, packages, or external tools such as containers and tmux." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "It intentionally does not include built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash. You can build or install those workflows as extensions or packages, or use external tools such as containers and tmux."

## Timeline

- 2026-08-23 new_claim `clm_8c4373808e22` (src_9e7c0cb34402)
- 2026-09-11 new_claim `clm_5ca433e00ea6` (src_ab670f25c35e)

## Related

- ← part_of [[mcp-server]] (0.93)
- ← related_to [[pi]] (0.93)
- ← uses [[claude-code]] (0.93)
- [[claude-code]] — 1 shared claim
- [[mcp-server]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[subagents]] — 1 shared claim
