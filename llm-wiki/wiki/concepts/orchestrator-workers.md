---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_orchestrator_workers]
claim_ids: [clm_a286eb2a1892, clm_77cbb9ef70fc, clm_590e165834af]
confidence: 0.90
stale_after: 2029-05-20
last_rendered: 2026-08-23T14:13:47Z
review_required: false
---

# orchestrator-workers

> **In here:** An orchestrator becomes a context bottleneck unless its workers return bounded, typed artifacts rather than raw conversation: its context stays manageable on a 200-token artifact per worker and does… · 3 claims, confidence 0.90.

## Current understanding

- A knowledge graph serves multi-agent systems in three distinct roles: shared memory for orchestrator-workers, where workers read and write the graph directly instead of passing summaries through the orchestrator's bottleneck; a grounding layer for evaluator-optimizer, where the evaluator checks claims against edges carrying provenance; and a persistent world model for loops, which survives context-window flushes (0.90)
- The production default is the simplest pattern that satisfies the task — a direct call, then a chain, routing, parallel workers, an orchestrator, and evaluator-optimizer last — because each step adds cost, latency, nondeterminism, and failure modes, so complexity is added in response to observed errors rather than included from the beginning (0.90)
- An orchestrator becomes a context bottleneck unless its workers return bounded, typed artifacts rather than raw conversation: its context stays manageable on a 200-token artifact per worker and does not on a 5,000-token conversation transcript (0.90)

## Evidence

- `clm_a286eb2a1892` — "A knowledge graph serves multi-agent systems in three distinct roles: shared memory for orchestrator-workers, where workers read and write the graph directly instead of passing summaries through the orchestrator's bottleneck; a grounding layer for evaluator-optimizer, where the evaluator checks claims against edges carrying provenance;" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "A knowledge graph serves multi-agent systems in three distinct roles."
- `clm_77cbb9ef70fc` — "The production default is the simplest pattern that satisfies the task — a direct call, then a chain, routing, parallel workers, an orchestrator, and evaluator-optimizer last — because each step adds cost, latency, nondeterminism, and failure modes, so complexity is added in response to observed errors rather than included from the beginning" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The production default should be the simplest pattern that satisfies the task. Use a direct LLM call for a simple question. Use a chain when the steps are fixed. Use routing when requests belong to clear categories."
- `clm_590e165834af` — "An orchestrator becomes a context bottleneck unless its workers return bounded, typed artifacts rather than raw conversation: its context stays manageable on a 200-token artifact per worker and does not on a 5,000-token conversation transcript" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Practical systems should require workers to return structured artifacts rather than raw conversation — bounded summaries with typed fields, not open-ended text."

## Timeline

- 2026-08-23 new_claim `clm_77cbb9ef70fc` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_590e165834af` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_a286eb2a1892` (src_363b13dc0870)

## Related

- → part_of [[agentic-workflow]] (0.90)
- → uses [[knowledge-graph]] (0.90)
- → related_to [[context-window]] (0.90)
- [[agentic-workflow]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[knowledge-graph]] — 1 shared claim
- evaluator-optimizer (no page yet)
