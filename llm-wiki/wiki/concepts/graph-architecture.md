---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_graph_architecture]
claim_ids: [clm_3a7e3a8fb83b, clm_8a554e6f410e, clm_4e9c001d7b2e, clm_1631e452feb8]
confidence: 0.90
stale_after: 2029-05-20
last_rendered: 2026-08-23T14:13:47Z
review_required: false
---

# graph architecture

> **In here:** A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; · 4 claims, confidence 0.90.

## Current understanding

- Three criteria decide when a loop stops being sufficient and a graph becomes necessary — session persistence, cross-agent coordination, and traceability — and loops handle the first poorly because state is flushed with the context window, the second not at all because a loop is one agent, and the third weakly because conversation history is the only record (0.90)
- The patterns are not isolated recipes but stages in the externalization of cognition: a loop externalizes revision, a chain externalizes task order, a network externalizes role specialization, and a graph externalizes shared state and relationships (0.90)
- A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; a graph written to once and never queried is a database table with extra overhead (0.90)
- Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision — with agents communicating through artifacts and shared state rather than unlimited conversational history, which is the constraint that prepares the system for graph architecture (0.90)

## Evidence

- `clm_3a7e3a8fb83b` — "Three criteria decide when a loop stops being sufficient and a graph becomes necessary — session persistence, cross-agent coordination, and traceability — and loops handle the first poorly because state is flushed with the context window, the second not at all because a loop is one agent, and the third weakly because conversation history is the only record" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "First, **session persistence**: if the work spans multiple sessions and transcript replay is no longer practical, state needs to live outside the context window — the graph."
- `clm_8a554e6f410e` — "The patterns are not isolated recipes but stages in the externalization of cognition: a loop externalizes revision, a chain externalizes task order, a network externalizes role specialization, and a graph externalizes shared state and relationships" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "They are stages in the externalization of cognition. A loop externalizes revision. A chain externalizes task order. A network externalizes role specialization. A graph externalizes shared state and relationships."
- `clm_4e9c001d7b2e` — "A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; a graph written to once and never queried is a database table with extra overhead" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "A knowledge graph is justified when the same entity or relationship is queried by more than one agent or across more than one session. A graph that is written to once and never queried is a database table with extra overhead."
- `clm_1631e452feb8` — "Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision — with agents communicating through artifacts and shared state rather than unlimited conversational history, which is the constraint that prepares the system for graph architecture" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The practical tip: define an artifact contract for every handoff. The researcher returns claims with sources. The planner returns typed steps. The coder returns code and assumptions. The evaluator returns defects and a decision."

## Timeline

- 2026-08-23 new_claim `clm_8a554e6f410e` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_1631e452feb8` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_3a7e3a8fb83b` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_4e9c001d7b2e` (src_363b13dc0870)

## Related

- → extends [[agent-loops]] (0.99)
- → extends [[multi-agent-collaboration]] (0.90)
- ← part_of [[knowledge-graph]] (0.90)
- [[agent-loops]] — 2 shared claims
- [[agentic-workflow]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- [[multi-agent-collaboration]] — 1 shared claim
- [[subagents]] — 1 shared claim
