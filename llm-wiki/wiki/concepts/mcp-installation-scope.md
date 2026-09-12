---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_mcp_installation_scope]
claim_ids: [clm_1dc5534f1f11, clm_4d483e15f7f2]
confidence: 0.93
stale_after: 2029-10-26
last_rendered: 2026-08-23T14:39:21Z
review_required: false
---

# MCP installation scope

> **In here:** When the same MCP server is defined in more than one scope, Claude Code connects once using the entire entry from the highest-precedence source, and never merges fields across scopes · 2 claims, confidence 0.93.

## Current understanding

- An MCP server is configured at one of three scopes, and that choice controls which projects the server loads in and whether the configuration is shared with the team (0.93)
- When the same MCP server is defined in more than one scope, Claude Code connects once using the entire entry from the highest-precedence source, and never merges fields across scopes (0.93)

## Evidence

- `clm_1dc5534f1f11` — "An MCP server is configured at one of three scopes, and that choice controls which projects the server loads in and whether the configuration is shared with the team." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "MCP servers can be configured at three scopes. The scope you choose controls which projects the server loads in and whether the configuration is shared with your team."
- `clm_4d483e15f7f2` — "When the same MCP server is defined in more than one scope, Claude Code connects once using the entire entry from the highest-precedence source, and never merges fields across scopes." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "When the same server is defined in more than one place, Claude Code connects to it once, using the definition from the highest-precedence source. The entire server entry from that source is used; fields are not merged across scopes."

## Timeline

- 2026-08-23 new_claim `clm_1dc5534f1f11` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_4d483e15f7f2` (src_9e7c0cb34402)

## Related

- → applies_to [[mcp-server]] (0.93)
- [[claude-code]] — 2 shared claims
- [[mcp-server]] — 2 shared claims
