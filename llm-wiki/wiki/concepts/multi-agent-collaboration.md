---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_multi_agent_collaboration]
claim_ids: [clm_53036c4f5724, clm_1631e452feb8]
confidence: 0.90
stale_after: 2029-05-20
last_rendered: 2026-08-23T14:25:57Z
review_required: false
---

# multi-agent collaboration

> **In here:** Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision · 2 claims, confidence 0.90.

## Current understanding

- Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities (0.91)
- Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision — with agents communicating through artifacts and shared state rather than unlimited conversational history, which is the constraint that prepares the system for graph architecture (0.90)

## Evidence

- `clm_53036c4f5724` — "Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Reflection lets a model inspect and revise its work. Tool Use lets it obtain information outside its parameters. Planning lets it select steps. Multi-Agent Collaboration lets multiple instances contribute distinct capabilities."
- `clm_1631e452feb8` — "Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision — with agents communicating through artifacts and shared state rather than unlimited conversational history, which is the constraint that prepares the system for graph architecture" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The practical tip: define an artifact contract for every handoff. The researcher returns claims with sources. The planner returns typed steps. The coder returns code and assumptions. The evaluator returns defects and a decision."

## Timeline

- 2026-08-23 new_claim `clm_53036c4f5724` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_1631e452feb8` (src_363b13dc0870)

## Related

- → part_of [[agentic-workflow]] (0.91)
- ← extends [[graph-architecture]] (0.90)
- → related_to [[subagents]] (0.90)
- [[agentic-workflow]] — 1 shared claim
- [[andrew-ng]] — 1 shared claim
- [[graph-architecture]] — 1 shared claim
- [[planning]] — 1 shared claim
- [[reflection]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[tool-use]] — 1 shared claim
