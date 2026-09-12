---
type: system
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/artifacts.md, title: "Share session output as artifacts", id: src_9e45f4ba4e23}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_mcp_connector]
claim_ids: [clm_366126bf4acf, clm_6d413ce21aa5]
confidence: 0.92
stale_after: 2027-02-25
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# MCP connector

> **In here:** An artifact can call MCP connectors each time someone views it so the page shows current data rather than a snapshot from the session that built it, on Pro, Max, Team, and Enterprise plans with… · 2 claims, confidence 0.92.

## Current understanding

- An artifact is a capture of work rather than an application: with no backend it cannot store form input or serve multiple routes, and calling MCP connectors is its only path to outside data once someone is viewing it (0.93)
- An artifact can call MCP connectors each time someone views it so the page shows current data rather than a snapshot from the session that built it, on Pro, Max, Team, and Enterprise plans with Claude Code v2.1.209 or later (0.91)

## Evidence

- `clm_366126bf4acf` — "An artifact is a capture of work rather than an application: with no backend it cannot store form input or serve multiple routes, and calling MCP connectors is its only path to outside data once someone is viewing it." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "An artifact is a capture of work, not an application."
- `clm_6d413ce21aa5` — "An artifact can call MCP connectors each time someone views it so the page shows current data rather than a snapshot from the session that built it, on Pro, Max, Team, and Enterprise plans with Claude Code v2.1.209 or later." · p 0.91 · active · 1 support · 0 contradict
  - `src_9e45f4ba4e23` Share session output as artifacts: "An artifact can call [MCP connectors](/docs/en/mcp#use-mcp-servers-from-claude-ai) each time someone views it, so the page shows current data rather than a snapshot from the session that built it."

## Timeline

- 2026-08-23 new_claim `clm_366126bf4acf` (src_9e45f4ba4e23)
- 2026-08-23 new_claim `clm_6d413ce21aa5` (src_9e45f4ba4e23)

## Related

- ← uses [[artifacts]] (0.99)
- [[artifacts]] — 2 shared claims
- [[claude-code]] — 1 shared claim
