---
type: person
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_andrew_ng]
claim_ids: [clm_41275cf5bf52, clm_53036c4f5724, clm_b88becc65d72]
confidence: 0.90
stale_after: 2029-04-28
last_rendered: 2026-08-23T14:25:57Z
review_required: false
---

# Andrew Ng

> **In here:** Andrew Ng — 3 claims, confidence 0.90, 1 source.

## Current understanding

- Andrew Ng reports GPT-3.5 solving 48.1% of HumanEval zero-shot and GPT-4 67.0%, while GPT-3.5 wrapped in an agentic workflow reaches 95.1% — the gain from the model upgrade is dwarfed by the gain from iterative workflow design, so architecture matters more than model capability (0.91)
- Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities (0.91)
- Ng rates Planning as emerging rather than robust — he cannot always get planning agents to work reliably — so they need tighter constraints: structured plan formats, dependency validation, bounded step counts, and fallback policies (0.90)

## Evidence

- `clm_41275cf5bf52` — "Andrew Ng reports GPT-3.5 solving 48.1% of HumanEval zero-shot and GPT-4 67.0%, while GPT-3.5 wrapped in an agentic workflow reaches 95.1% — the gain from the model upgrade is dwarfed by the gain from iterative workflow design, so architecture matters more than model capability" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "As reported by Ng, GPT-3.5 used zero-shot solves 48.1% of the benchmark, while GPT-4 used zero-shot solves 67.0%. When GPT-3.5 is wrapped in an agentic workflow, the reported score rises to 95.1%."
- `clm_53036c4f5724` — "Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Reflection lets a model inspect and revise its work. Tool Use lets it obtain information outside its parameters. Planning lets it select steps. Multi-Agent Collaboration lets multiple instances contribute distinct capabilities."
- `clm_b88becc65d72` — "Ng rates Planning as emerging rather than robust — he cannot always get planning agents to work reliably — so they need tighter constraints: structured plan formats, dependency validation, bounded step counts, and fallback policies" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Ng's maturity assessment is explicit: "more emerging"

## Timeline

- 2026-08-23 new_claim `clm_41275cf5bf52` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_53036c4f5724` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_b88becc65d72` (src_363b13dc0870)

## Related

- → authored [[agentic-workflow]] (0.91)
- → cites HumanEval (no page yet) (0.91)
- → related_to [[planning]] (0.90)
- [[agentic-workflow]] — 2 shared claims
- [[planning]] — 2 shared claims
- [[multi-agent-collaboration]] — 1 shared claim
- [[reflection]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- HumanEval (no page yet)
