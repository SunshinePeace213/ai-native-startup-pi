---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/agent-teams.md, title: "Orchestrate teams of Claude Code sessions", id: src_67017872e4a4}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_agent_teams]
claim_ids: [clm_dd6d8444326e, clm_13e5b40d313a, clm_34217cbae0d3, clm_54afb768c457, clm_a5d9ea4f9972, clm_e98123e16126, clm_39423a40f88e, clm_e283c9c6832b, clm_f636b711007c]
confidence: 0.90
stale_after: 2027-02-25
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# agent teams

> **In here:** Subagents fit quick, focused workers that report a result back, while agent teams fit work where the workers must share findings, challenge each other, and coordinate on their own · 9 claims, confidence 0.90.

## Current understanding

- Agent teams are experimental and disabled unless CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is set to 1; without it no team is set up, no team directories are written, and Claude spawns no teammates (0.91)
- An agent team is several coordinated Claude Code instances in which one session acts as the team lead assigning work and synthesizing results, while teammates work independently in their own context windows and message each other directly (0.91)
- Claude Code tells a receiving agent that a SendMessage message came from another Claude session rather than the user, so a teammate can neither approve a permission prompt on the user's behalf nor relay a denied action through another teammate (0.90)
- Every teammate starts with the lead's permission settings, including --dangerously-skip-permissions, and an individual teammate's mode can only be changed after spawning, never set at spawn time (0.90)
- A teammate loads the same project context as a regular session — CLAUDE.md, MCP servers, and skills — plus the lead's spawn prompt, but inherits none of the lead's conversation history (0.90)
- An agent team coordinates through a shared task list whose tasks are pending, in progress, or completed, and a pending task with unresolved dependencies cannot be claimed until they complete (0.90)
- Subagents fit quick, focused workers that report a result back, while agent teams fit work where the workers must share findings, challenge each other, and coordinate on their own (0.90)
- A Claude Code session has exactly one agent team that cannot be shared across sessions, and teammates cannot spawn teammates of their own, so only the lead manages the team (0.90)
- While agent teams are enabled, any subagent Claude spawns with a name launches as a teammate without a confirmation prompt, so a team can form during delegation the user never framed as team work (0.90)

## Evidence

- `clm_dd6d8444326e` — "Agent teams are experimental and disabled unless CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is set to 1; without it no team is set up, no team directories are written, and Claude spawns no teammates." · p 0.91 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Agent teams are experimental and disabled by default. Enable them by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your [settings.json](/docs/en/settings) or environment."
- `clm_13e5b40d313a` — "An agent team is several coordinated Claude Code instances in which one session acts as the team lead assigning work and synthesizing results, while teammates work independently in their own context windows and message each other directly." · p 0.91 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Agent teams let you coordinate multiple Claude Code instances working together. One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results."
- `clm_34217cbae0d3` — "Claude Code tells a receiving agent that a SendMessage message came from another Claude session rather than the user, so a teammate can neither approve a permission prompt on the user's behalf nor relay a denied action through another teammate." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "When one agent sends another a message over `SendMessage`, Claude Code tells the receiving agent the message came from another Claude session, not from you."
- `clm_54afb768c457` — "Every teammate starts with the lead's permission settings, including --dangerously-skip-permissions, and an individual teammate's mode can only be changed after spawning, never set at spawn time." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Teammates start with the lead's permission settings. If the lead runs with `--dangerously-skip-permissions`, all teammates do too. After spawning, you can change individual teammate modes, but you can't set per-teammate modes at spawn time."
- `clm_a5d9ea4f9972` — "A teammate loads the same project context as a regular session — CLAUDE.md, MCP servers, and skills — plus the lead's spawn prompt, but inherits none of the lead's conversation history." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Each teammate has its own context window. When spawned, a teammate loads the same project context as a regular session: CLAUDE.md, MCP servers, and skills. It also receives the spawn prompt from the lead."
- `clm_e98123e16126` — "An agent team coordinates through a shared task list whose tasks are pending, in progress, or completed, and a pending task with unresolved dependencies cannot be claimed until they complete." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "The shared task list coordinates work across the team. The lead creates tasks and teammates work through them. Tasks have three states: pending, in progress, and completed."
- `clm_39423a40f88e` — "Subagents fit quick, focused workers that report a result back, while agent teams fit work where the workers must share findings, challenge each other, and coordinate on their own." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Use subagents when you need quick, focused workers that report back. Use agent teams when teammates need to share findings, challenge each other, and coordinate on their own."
- `clm_e283c9c6832b` — "A Claude Code session has exactly one agent team that cannot be shared across sessions, and teammates cannot spawn teammates of their own, so only the lead manages the team." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "* **One team per session**: a session has exactly one team, scoped to that session. You can't create additional named teams or share a team across sessions. * **No nested teams**: teammates cannot spawn their own teammates."
- `clm_f636b711007c` — "While agent teams are enabled, any subagent Claude spawns with a name launches as a teammate without a confirmation prompt, so a team can form during delegation the user never framed as team work." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Claude launches a teammate when it calls the [Agent tool](/docs/en/tools-reference) with a [`name`](/docs/en/sub-agents#subagent-names) while agent teams are enabled, and Claude Code doesn't ask you to confirm."

## Timeline

- 2026-08-23 new_claim `clm_13e5b40d313a` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_39423a40f88e` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_dd6d8444326e` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_f636b711007c` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_a5d9ea4f9972` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_e98123e16126` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_34217cbae0d3` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_54afb768c457` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_e283c9c6832b` (src_67017872e4a4)

## Related

- → related_to [[subagents]] (0.99)
- → part_of [[claude-code]] (0.93)
- ← part_of [[team-lead]] (0.93)
- → depends_on [[permission-mode]] (0.93)
- → uses [[context-window]] (0.93)
- → uses shared task list (no page yet) (0.93)
- ← owns [[team-lead]] (0.92)
- [[claude-code]] — 5 shared claims
- [[team-lead]] — 4 shared claims
- [[permission-mode]] — 2 shared claims
- [[subagents]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- shared task list (no page yet)
