---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_planning]
claim_ids: [clm_53036c4f5724, clm_b88becc65d72, clm_a8ebbcbbc60d]
confidence: 0.85
stale_after: 2027-06-14
last_rendered: 2026-08-23T14:25:57Z
review_required: false
---

# planning

> **In here:** Ng rates Planning as emerging rather than robust — he cannot always get planning agents to work reliably · 3 claims, confidence 0.85.

## Current understanding

- Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities (0.91)
- Ng rates Planning as emerging rather than robust — he cannot always get planning agents to work reliably — so they need tighter constraints: structured plan formats, dependency validation, bounded step counts, and fallback policies (0.90)
- As models get more capable, some of what lives in the harness today will be absorbed into the model, which will get better at planning, self-verification, and long-horizon coherence natively (0.75)

## Evidence

- `clm_53036c4f5724` — "Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Reflection lets a model inspect and revise its work. Tool Use lets it obtain information outside its parameters. Planning lets it select steps. Multi-Agent Collaboration lets multiple instances contribute distinct capabilities."
- `clm_b88becc65d72` — "Ng rates Planning as emerging rather than robust — he cannot always get planning agents to work reliably — so they need tighter constraints: structured plan formats, dependency validation, bounded step counts, and fallback policies" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Ng's maturity assessment is explicit: "more emerging"
- `clm_a8ebbcbbc60d` — "As models get more capable, some of what lives in the harness today will be absorbed into the model, which will get better at planning, self-verification, and long-horizon coherence natively." · p 0.75 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "As models get more capable, some of what lives in the harness today will get absorbed into the model. Models will get better at planning, self-verification, and long horizon coherence natively."

## Timeline

- 2026-08-23 new_claim `clm_53036c4f5724` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_b88becc65d72` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_a8ebbcbbc60d` (src_be6da1f4f37a)

## Related

- → part_of [[agentic-workflow]] (0.91)
- ← related_to [[andrew-ng]] (0.90)
- → part_of [[agent-harness]] (0.75)
- [[andrew-ng]] — 2 shared claims
- [[agent-harness]] — 1 shared claim
- [[agentic-workflow]] — 1 shared claim
- [[multi-agent-collaboration]] — 1 shared claim
- [[reflection]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
