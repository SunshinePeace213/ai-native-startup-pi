---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/cross-session-messaging.md, title: "Message your other Claude Code sessions", id: src_10e9043d62f0}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_sendmessage]
claim_ids: [clm_5de4eb1ed776, clm_ce32f59798b3]
confidence: 0.90
stale_after: 2027-03-02
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# SendMessage

> **In here:** SendMessage — 2 claims, confidence 0.90, 1 source.

## Current understanding

- Receiving and sending are separate controls: setting `crossSessionInbound` to `refuse` drops inbound peer messages without delivering them, and permission deny rules naming the bare tool names `SendMessage` and `ListAgents` stop a session from sending or listing (0.90)
- Claude reaches other agents with two tools — `ListAgents` to discover which agents it can reach and `SendMessage` to deliver a message to one of them by name — and the same `SendMessage` tool also addresses subagents and agent-team teammates (0.90)

## Evidence

- `clm_5de4eb1ed776` — "Receiving and sending are separate controls: setting `crossSessionInbound` to `refuse` drops inbound peer messages without delivering them, and permission deny rules naming the bare tool names `SendMessage` and `ListAgents` stop a session from sending or listing." · p 0.90 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "* **Stop receiving**: set `crossSessionInbound` to `refuse`, and Claude Code drops inbound peer messages without delivering them."
- `clm_ce32f59798b3` — "Claude reaches other agents with two tools — `ListAgents` to discover which agents it can reach and `SendMessage` to deliver a message to one of them by name — and the same `SendMessage` tool also addresses subagents and agent-team teammates." · p 0.90 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "Claude uses two tools for this: `ListAgents` to discover which agents it can reach, and `SendMessage` to deliver a message to one of them by name."

## Timeline

- 2026-08-23 new_claim `clm_ce32f59798b3` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_5de4eb1ed776` (src_10e9043d62f0)

## Related

- ← uses [[cross-session-messaging]] (0.99)
- [[cross-session-messaging]] — 2 shared claims
- [[listagents]] — 2 shared claims
- [[subagents]] — 1 shared claim
