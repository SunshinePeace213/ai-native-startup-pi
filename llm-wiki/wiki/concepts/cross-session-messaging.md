---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/cross-session-messaging.md, title: "Message your other Claude Code sessions", id: src_10e9043d62f0}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_cross_session_messaging]
claim_ids: [clm_a8d109a3feff, clm_b590ceffeda7, clm_936676a8d258, clm_e4b002d151ce, clm_06937874202e, clm_5de4eb1ed776, clm_ce32f59798b3, clm_55681f67bc76, clm_e5824e43202d]
confidence: 0.91
stale_after: 2027-02-25
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# cross-session messaging

> **In here:** A message to a session on the same machine travels over a per-session socket, or a named pipe on native Windows, and never through Anthropic servers, while a message to a session on another of your… · 9 claims, confidence 0.91.

## Current understanding

- A cross-session message is a piece of text one Claude writes to another and never carries conversation history or files, which is why moving a whole conversation means resuming the session instead (0.92)
- Cross-session messaging requires Claude Code v2.1.224 or later on macOS, Linux, and WSL 2 and v2.1.234 or later on native Windows, and is not available on Amazon Bedrock, Claude Platform on AWS, Google Cloud's Agent Platform, or Microsoft Foundry (0.92)
- A message to a session on the same machine travels over a per-session socket, or a named pipe on native Windows, and never through Anthropic servers, while a message to a session on another of your machines or on Claude Code on the web passes through Anthropic servers (0.91)
- The `crossSessionInbound` setting decides what a session does with messages arriving from your other sessions: `accept` delivers each one to Claude, `hold` shows a notice without delivering, and `refuse` drops each message (0.91)
- A message from another session never counts as the user's consent, so it cannot answer a pending permission prompt, and the receiving Claude is instructed never to change permission settings, `CLAUDE.md`, or other configuration because another session asked (0.91)
- Receiving and sending are separate controls: setting `crossSessionInbound` to `refuse` drops inbound peer messages without delivering them, and permission deny rules naming the bare tool names `SendMessage` and `ListAgents` stop a session from sending or listing (0.91)
- Claude reaches other agents with two tools — `ListAgents` to discover which agents it can reach and `SendMessage` to deliver a message to one of them by name — and the same `SendMessage` tool also addresses subagents and agent-team teammates (0.91)
- With no `crossSessionInbound` value in effect, a receiving session that prompts for permissions delivers each message and holds one only when the sender bypasses permission prompts, while a receiving session that bypasses prompts holds every message for approval unless the sender also bypasses (0.91)
- Setting `isolatePeerMachines` to `true` requires the user's approval before any message reaches a session beyond this machine, even in `bypassPermissions` mode, and a `true` from any settings scope applies so a checked-in project file can turn the requirement on but not off (0.91)

## Evidence

- `clm_a8d109a3feff` — "A cross-session message is a piece of text one Claude writes to another and never carries conversation history or files, which is why moving a whole conversation means resuming the session instead." · p 0.92 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "A message is a piece of text one Claude writes to another, never conversation history or files. To move a whole conversation or its context, [resume the session](/docs/en/sessions#resume-a-session) instead."
- `clm_b590ceffeda7` — "Cross-session messaging requires Claude Code v2.1.224 or later on macOS, Linux, and WSL 2 and v2.1.234 or later on native Windows, and is not available on Amazon Bedrock, Claude Platform on AWS, Google Cloud's Agent Platform, or Microsoft Foundry." · p 0.92 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "Cross-session messaging requires Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, and v2.1.234 or later on native Windows."
- `clm_936676a8d258` — "A message to a session on the same machine travels over a per-session socket, or a named pipe on native Windows, and never through Anthropic servers, while a message to a session on another of your machines or on Claude Code on the web passes through Anthropic servers." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "| Where the other session runs | How the message travels | | :------------------------------------------------------ |…"
- `clm_e4b002d151ce` — "The `crossSessionInbound` setting decides what a session does with messages arriving from your other sessions: `accept` delivers each one to Claude, `hold` shows a notice without delivering, and `refuse` drops each message." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "Set [`crossSessionInbound`](/docs/en/settings-reference#crosssessioninbound) to choose what a session does with messages arriving from your other sessions: | Value | Behavior | | :------- |…"
- `clm_06937874202e` — "A message from another session never counts as the user's consent, so it cannot answer a pending permission prompt, and the receiving Claude is instructed never to change permission settings, `CLAUDE.md`, or other configuration because another session asked." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "* **It can't approve anything**: a message from another session never counts as your consent, so it can't answer a pending permission prompt on your behalf."
- `clm_5de4eb1ed776` — "Receiving and sending are separate controls: setting `crossSessionInbound` to `refuse` drops inbound peer messages without delivering them, and permission deny rules naming the bare tool names `SendMessage` and `ListAgents` stop a session from sending or listing." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "* **Stop receiving**: set `crossSessionInbound` to `refuse`, and Claude Code drops inbound peer messages without delivering them."
- `clm_ce32f59798b3` — "Claude reaches other agents with two tools — `ListAgents` to discover which agents it can reach and `SendMessage` to deliver a message to one of them by name — and the same `SendMessage` tool also addresses subagents and agent-team teammates." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "Claude uses two tools for this: `ListAgents` to discover which agents it can reach, and `SendMessage` to deliver a message to one of them by name."
- `clm_55681f67bc76` — "With no `crossSessionInbound` value in effect, a receiving session that prompts for permissions delivers each message and holds one only when the sender bypasses permission prompts, while a receiving session that bypasses prompts holds every message for approval unless the sender also bypasses." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "* **The receiving session prompts for permissions**: Claude Code delivers each message. It holds one for your approval only when the sending session identifies itself as bypassing permission prompts."
- `clm_e5824e43202d` — "Setting `isolatePeerMachines` to `true` requires the user's approval before any message reaches a session beyond this machine, even in `bypassPermissions` mode, and a `true` from any settings scope applies so a checked-in project file can turn the requirement on but not off." · p 0.91 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "With this set, Claude Code asks for your approval before Claude's message to a session beyond this machine leaves, even in `bypassPermissions` mode, which skips ordinary permission prompts."

## Timeline

- 2026-08-23 new_claim `clm_a8d109a3feff` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_ce32f59798b3` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_936676a8d258` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_e4b002d151ce` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_55681f67bc76` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_06937874202e` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_b590ceffeda7` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_5de4eb1ed776` (src_10e9043d62f0)
- 2026-08-23 new_claim `clm_e5824e43202d` (src_10e9043d62f0)

## Related

- → uses [[sendmessage]] (0.99)
- → part_of [[claude-code]] (0.93)
- → uses [[listagents]] (0.93)
- → depends_on [[permission-mode]] (0.92)
- [[claude-code]] — 7 shared claims
- [[permission-mode]] — 3 shared claims
- [[listagents]] — 2 shared claims
- [[sendmessage]] — 2 shared claims
- [[subagents]] — 1 shared claim
