---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/agent-teams.md, title: "Orchestrate teams of Claude Code sessions", id: src_67017872e4a4}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_team_lead]
claim_ids: [clm_13e5b40d313a, clm_54afb768c457, clm_e98123e16126, clm_e283c9c6832b]
confidence: 0.90
stale_after: 2027-02-25
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# team lead

> **In here:** team lead — 4 claims, confidence 0.90, 1 source.

## Current understanding

- An agent team is several coordinated Claude Code instances in which one session acts as the team lead assigning work and synthesizing results, while teammates work independently in their own context windows and message each other directly (0.91)
- Every teammate starts with the lead's permission settings, including --dangerously-skip-permissions, and an individual teammate's mode can only be changed after spawning, never set at spawn time (0.90)
- An agent team coordinates through a shared task list whose tasks are pending, in progress, or completed, and a pending task with unresolved dependencies cannot be claimed until they complete (0.90)
- A Claude Code session has exactly one agent team that cannot be shared across sessions, and teammates cannot spawn teammates of their own, so only the lead manages the team (0.90)

## Evidence

- `clm_13e5b40d313a` — "An agent team is several coordinated Claude Code instances in which one session acts as the team lead assigning work and synthesizing results, while teammates work independently in their own context windows and message each other directly." · p 0.91 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Agent teams let you coordinate multiple Claude Code instances working together. One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results."
- `clm_54afb768c457` — "Every teammate starts with the lead's permission settings, including --dangerously-skip-permissions, and an individual teammate's mode can only be changed after spawning, never set at spawn time." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Teammates start with the lead's permission settings. If the lead runs with `--dangerously-skip-permissions`, all teammates do too. After spawning, you can change individual teammate modes, but you can't set per-teammate modes at spawn time."
- `clm_e98123e16126` — "An agent team coordinates through a shared task list whose tasks are pending, in progress, or completed, and a pending task with unresolved dependencies cannot be claimed until they complete." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "The shared task list coordinates work across the team. The lead creates tasks and teammates work through them. Tasks have three states: pending, in progress, and completed."
- `clm_e283c9c6832b` — "A Claude Code session has exactly one agent team that cannot be shared across sessions, and teammates cannot spawn teammates of their own, so only the lead manages the team." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "* **One team per session**: a session has exactly one team, scoped to that session. You can't create additional named teams or share a team across sessions. * **No nested teams**: teammates cannot spawn their own teammates."

## Timeline

- 2026-08-23 new_claim `clm_13e5b40d313a` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_e98123e16126` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_54afb768c457` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_e283c9c6832b` (src_67017872e4a4)

## Related

- → part_of [[agent-teams]] (0.93)
- → owns [[agent-teams]] (0.92)
- [[agent-teams]] — 4 shared claims
- [[claude-code]] — 2 shared claims
- [[permission-mode]] — 1 shared claim
- shared task list (no page yet)
