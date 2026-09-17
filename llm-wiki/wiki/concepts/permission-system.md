---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/hooks-guide.md, title: "Automate actions with hooks", id: src_3466a5945e1e}
  - {resource: llm-wiki/raw/docs/claude-code/hooks.md, title: "Hooks reference", id: src_af0a3c9de51d}
  - {resource: llm-wiki/raw/docs/pi/extensions.md, title: "Extensions", id: src_a49af96a95e8}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_permission_system]
claim_ids: [clm_9f8da267ecf6, clm_a000143bb6c6, clm_6950c62639be, clm_cdb802990e15]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# permission system

> **In here:** permission system — 4 claims, confidence 0.92, 3 sources.

## Current understanding

- A hook exiting 0 reports no objection but does not approve anything: a PreToolUse hook's tool call still goes through the normal permission flow (0.93)
- A command, HTTP, or MCP-tool hook that hits its timeout is canceled and renders no decision, so a stalled PreToolUse hook lets the tool call continue through the normal permission flow rather than acting as a gate (0.93)
- A Pi extension's tool_call handler can block a tool call by returning block with an optional reason and terminate flag, and can patch arguments by mutating event.input in place (0.92)
- The `if` field that narrows a hook to matching tool arguments is best-effort and fails open when a Bash command cannot be parsed, so hard allow-or-deny enforcement belongs in the permission system rather than a hook (0.89)

## Evidence

- `clm_9f8da267ecf6` — "A hook exiting 0 reports no objection but does not approve anything: a PreToolUse hook's tool call still goes through the normal permission flow." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "**Exit 0**: the hook reports no objection through its exit code. For a `PreToolUse` hook this doesn't approve the tool call: the normal [permission flow](/docs/en/permissions) still applies."
- `clm_a000143bb6c6` — "A command, HTTP, or MCP-tool hook that hits its timeout is canceled and renders no decision, so a stalled PreToolUse hook lets the tool call continue through the normal permission flow rather than acting as a gate." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "* A timed-out `command`, `http`, or `mcp_tool` hook doesn't block the tool call. The call continues through the normal [permission flow](/docs/en/permissions), so don't count on a stalled hook to act as a gate."
- `clm_6950c62639be` — "A Pi extension's tool_call handler can block a tool call by returning block with an optional reason and terminate flag, and can patch arguments by mutating event.input in place." · p 0.92 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Return values from `tool_call` control blocking via `{ block: true, reason?: string, terminate?: boolean }`"
- `clm_cdb802990e15` — "The `if` field that narrows a hook to matching tool arguments is best-effort and fails open when a Bash command cannot be parsed, so hard allow-or-deny enforcement belongs in the permission system rather than a hook." · p 0.89 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "The filter also fails open, running your hook regardless of pattern, when the Bash command can't be parsed."

## Timeline

- 2026-08-23 new_claim `clm_a000143bb6c6` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_9f8da267ecf6` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_cdb802990e15` (src_3466a5945e1e)
- 2026-09-11 new_claim `clm_6950c62639be` (src_a49af96a95e8)

## Related

- [[claude-code]] — 3 shared claims
- [[hooks]] — 3 shared claims
- [[pi]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[tool-use]] — 1 shared claim
