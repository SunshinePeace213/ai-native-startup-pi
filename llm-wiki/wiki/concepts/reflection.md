---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_reflection]
claim_ids: [clm_53036c4f5724, clm_5716a98b092a]
confidence: 0.90
stale_after: 2029-05-20
last_rendered: 2026-08-23T14:25:57Z
review_required: false
---

# reflection

> **In here:** A reflection loop separates critique from rewriting — request a structured list of issues first, then feed that list into a distinct revision step · 2 claims, confidence 0.90.

## Current understanding

- Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities (0.91)
- A reflection loop separates critique from rewriting — request a structured list of issues first, then feed that list into a distinct revision step — and makes the evaluator cite evidence from the draft, tests, or source material rather than accepting an opaque replacement (0.90)

## Evidence

- `clm_53036c4f5724` — "Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Reflection lets a model inspect and revise its work. Tool Use lets it obtain information outside its parameters. Planning lets it select steps. Multi-Agent Collaboration lets multiple instances contribute distinct capabilities."
- `clm_5716a98b092a` — "A reflection loop separates critique from rewriting — request a structured list of issues first, then feed that list into a distinct revision step — and makes the evaluator cite evidence from the draft, tests, or source material rather than accepting an opaque replacement" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The first practical tip is to separate critique from rewriting. Do not ask "improve this" and accept an opaque replacement. Request a structured list of issues first, then feed that list into a distinct revision step."

## Timeline

- 2026-08-23 new_claim `clm_53036c4f5724` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_5716a98b092a` (src_363b13dc0870)

## Related

- → part_of [[agentic-workflow]] (0.91)
- → related_to [[verification-loop]] (0.90)
- [[agentic-workflow]] — 1 shared claim
- [[andrew-ng]] — 1 shared claim
- [[multi-agent-collaboration]] — 1 shared claim
- [[planning]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
