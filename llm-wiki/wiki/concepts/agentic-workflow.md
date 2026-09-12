---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_agentic_workflow]
claim_ids: [clm_41275cf5bf52, clm_53036c4f5724, clm_77cbb9ef70fc, clm_8a554e6f410e]
confidence: 0.91
stale_after: 2029-06-12
last_rendered: 2026-08-23T14:25:57Z
review_required: false
---

# agentic workflow

> **In here:** Andrew Ng reports GPT-3.5 solving 48.1% of HumanEval zero-shot and GPT-4 67.0%, while GPT-3.5 wrapped in an agentic workflow reaches 95.1% · 4 claims, confidence 0.91.

## Current understanding

- Andrew Ng reports GPT-3.5 solving 48.1% of HumanEval zero-shot and GPT-4 67.0%, while GPT-3.5 wrapped in an agentic workflow reaches 95.1% — the gain from the model upgrade is dwarfed by the gain from iterative workflow design, so architecture matters more than model capability (0.91)
- Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities (0.91)
- The production default is the simplest pattern that satisfies the task — a direct call, then a chain, routing, parallel workers, an orchestrator, and evaluator-optimizer last — because each step adds cost, latency, nondeterminism, and failure modes, so complexity is added in response to observed errors rather than included from the beginning (0.90)
- The patterns are not isolated recipes but stages in the externalization of cognition: a loop externalizes revision, a chain externalizes task order, a network externalizes role specialization, and a graph externalizes shared state and relationships (0.90)

## Evidence

- `clm_41275cf5bf52` — "Andrew Ng reports GPT-3.5 solving 48.1% of HumanEval zero-shot and GPT-4 67.0%, while GPT-3.5 wrapped in an agentic workflow reaches 95.1% — the gain from the model upgrade is dwarfed by the gain from iterative workflow design, so architecture matters more than model capability" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "As reported by Ng, GPT-3.5 used zero-shot solves 48.1% of the benchmark, while GPT-4 used zero-shot solves 67.0%. When GPT-3.5 is wrapped in an agentic workflow, the reported score rises to 95.1%."
- `clm_53036c4f5724` — "Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Reflection lets a model inspect and revise its work. Tool Use lets it obtain information outside its parameters. Planning lets it select steps. Multi-Agent Collaboration lets multiple instances contribute distinct capabilities."
- `clm_77cbb9ef70fc` — "The production default is the simplest pattern that satisfies the task — a direct call, then a chain, routing, parallel workers, an orchestrator, and evaluator-optimizer last — because each step adds cost, latency, nondeterminism, and failure modes, so complexity is added in response to observed errors rather than included from the beginning" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The production default should be the simplest pattern that satisfies the task. Use a direct LLM call for a simple question. Use a chain when the steps are fixed. Use routing when requests belong to clear categories."
- `clm_8a554e6f410e` — "The patterns are not isolated recipes but stages in the externalization of cognition: a loop externalizes revision, a chain externalizes task order, a network externalizes role specialization, and a graph externalizes shared state and relationships" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "They are stages in the externalization of cognition. A loop externalizes revision. A chain externalizes task order. A network externalizes role specialization. A graph externalizes shared state and relationships."

## Timeline

- 2026-08-23 new_claim `clm_41275cf5bf52` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_53036c4f5724` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_8a554e6f410e` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_77cbb9ef70fc` (src_363b13dc0870)

## Related

- → applies_to HumanEval (no page yet) (0.91)
- ← authored [[andrew-ng]] (0.91)
- ← part_of [[multi-agent-collaboration]] (0.91)
- ← part_of [[planning]] (0.91)
- ← part_of [[reflection]] (0.91)
- ← part_of [[tool-use]] (0.91)
- ← part_of [[agent-loops]] (0.90)
- ← part_of evaluator-optimizer (no page yet) (0.90)
- ← part_of [[orchestrator-workers]] (0.90)
- [[andrew-ng]] — 2 shared claims
- [[agent-loops]] — 1 shared claim
- [[graph-architecture]] — 1 shared claim
- [[multi-agent-collaboration]] — 1 shared claim
- [[orchestrator-workers]] — 1 shared claim
- [[planning]] — 1 shared claim
- [[reflection]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- evaluator-optimizer (no page yet)
- HumanEval (no page yet)
