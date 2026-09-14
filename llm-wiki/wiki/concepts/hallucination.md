---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/articles/artificial-analysis/omniscience.md, title: "AA-Omniscience: Knowledge and Hallucination Benchmark", id: src_c197533a04c8}
  - {resource: llm-wiki/raw/docs/anthropic/reduce-hallucinations.md, title: "Reduce hallucinations", id: src_e168e83948d2}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_hallucination]
claim_ids: [clm_3d8a0aa2d11b, clm_83f513f52e26, clm_9da197d8cab5, clm_ba340cd11a58, clm_e5cb45f465fa, clm_23e5e06bdc60, clm_56836c900a72, clm_72f494da5cd4, clm_2c4bdb241a8e]
confidence: 0.92
stale_after: 2027-04-19
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# hallucination

> **In here:** GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose · 9 claims, confidence 0.92.

## Current understanding

- GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose (0.95)
- Hallucination-reduction techniques significantly reduce but never eliminate hallucinations, so critical information must still be validated, especially for high-stakes decisions (0.94)
- For tasks over long documents of more than 20k tokens, asking Claude to extract word-for-word quotes before performing its task grounds the response in the actual text and reduces hallucinations (0.93)
- Explicitly giving Claude permission to admit uncertainty and say it does not know can drastically reduce false information (0.93)
- Having Claude cite quotes and sources for each claim makes its response auditable, and a post-generation pass that finds a supporting quote per claim and retracts any claim without one catches unsupported statements (0.93)
- Explicitly instructing Claude to use only the provided documents and not its general knowledge restricts the space in which it can hallucinate (0.92)
- Running the same prompt several times and comparing the outputs surfaces hallucinations, because inconsistencies across runs indicate fabricated content (0.92)
- Asking Claude to explain its reasoning step by step before a final answer can reveal faulty logic or assumptions behind a hallucination (0.92)
- The AA-Omniscience Index is a bounded -100 to 100 metric over 6,000 questions that jointly penalizes hallucinations and rewards abstention, with 0 meaning a model answers correctly as often as incorrectly (0.83)

## Evidence

- `clm_3d8a0aa2d11b` — "GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose." · p 0.95 · active · 2 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "This is driven by a significant decrease in hallucination rate from 92% to 51% at max effort."
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "| GPT-6 Astra (high) | 44.8% | | GPT-6 Astra (medium) | 46.5% | | GPT-6 Astra (xhigh) | 48.3% | | GPT-6 Astra (max) | 51.3% |"
- `clm_83f513f52e26` — "Hallucination-reduction techniques significantly reduce but never eliminate hallucinations, so critical information must still be validated, especially for high-stakes decisions." · p 0.94 · active · 1 support · 0 contradict
  - `src_e168e83948d2` Reduce hallucinations: "Remember, while these techniques significantly reduce hallucinations, they don't eliminate them entirely. Always validate critical information, especially for high-stakes decisions."
- `clm_9da197d8cab5` — "For tasks over long documents of more than 20k tokens, asking Claude to extract word-for-word quotes before performing its task grounds the response in the actual text and reduces hallucinations." · p 0.93 · active · 1 support · 0 contradict · when: for tasks involving long documents over 20k tokens
  - `src_e168e83948d2` Reduce hallucinations: "* **Use direct quotes for factual grounding:** For tasks involving long documents (>20k tokens), ask Claude to extract word-for-word quotes first before performing its task."
- `clm_ba340cd11a58` — "Explicitly giving Claude permission to admit uncertainty and say it does not know can drastically reduce false information." · p 0.93 · active · 1 support · 0 contradict
  - `src_e168e83948d2` Reduce hallucinations: "* **Allow Claude to say "I don't know":** Explicitly give Claude permission to admit uncertainty. This simple technique can drastically reduce false information."
- `clm_e5cb45f465fa` — "Having Claude cite quotes and sources for each claim makes its response auditable, and a post-generation pass that finds a supporting quote per claim and retracts any claim without one catches unsupported statements." · p 0.93 · active · 1 support · 0 contradict
  - `src_e168e83948d2` Reduce hallucinations: "* **Verify with citations**: Make Claude's response auditable by having it cite quotes and sources for each of its claims. You can also have Claude verify each claim by finding a supporting quote after it generates a response."
- `clm_23e5e06bdc60` — "Explicitly instructing Claude to use only the provided documents and not its general knowledge restricts the space in which it can hallucinate." · p 0.92 · active · 1 support · 0 contradict
  - `src_e168e83948d2` Reduce hallucinations: "* **External knowledge restriction**: Explicitly instruct Claude to only use information from provided documents and not its general knowledge."
- `clm_56836c900a72` — "Running the same prompt several times and comparing the outputs surfaces hallucinations, because inconsistencies across runs indicate fabricated content." · p 0.92 · active · 1 support · 0 contradict
  - `src_e168e83948d2` Reduce hallucinations: "* **Best-of-N verification**: Run Claude through the same prompt multiple times and compare the outputs. Inconsistencies across outputs could indicate hallucinations."
- `clm_72f494da5cd4` — "Asking Claude to explain its reasoning step by step before a final answer can reveal faulty logic or assumptions behind a hallucination." · p 0.92 · active · 1 support · 0 contradict
  - `src_e168e83948d2` Reduce hallucinations: "* **Chain-of-thought verification**: Ask Claude to explain its reasoning step-by-step before giving a final answer. This can reveal faulty logic or assumptions."
- `clm_2c4bdb241a8e` — "The AA-Omniscience Index is a bounded -100 to 100 metric over 6,000 questions that jointly penalizes hallucinations and rewards abstention, with 0 meaning a model answers correctly as often as incorrectly." · p 0.83 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "The evaluation measures a model's AA-Omniscience Index, a bounded metric (-100 to 100) measuring factual recall that jointly penalizes hallucinations and rewards abstention when uncertain, with 0 equating to a model that answers questions…"

## Timeline

- 2026-09-02 new_claim `clm_ba340cd11a58` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_9da197d8cab5` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_e5cb45f465fa` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_72f494da5cd4` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_56836c900a72` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_23e5e06bdc60` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_83f513f52e26` (src_e168e83948d2)
- 2026-09-12 new_claim `clm_3d8a0aa2d11b` (src_1a690917c61d)
- 2026-09-14 new_claim `clm_2c4bdb241a8e` (src_c197533a04c8)
- 2026-09-14 support_update `clm_3d8a0aa2d11b` (src_c197533a04c8)

## Related

- ← applies_to [[aa-omniscience]] (0.83)
- [[aa-omniscience]] — 1 shared claim
- [[artificial-analysis]] — 1 shared claim
- [[gpt-5-6-sol]] — 1 shared claim
- [[gpt-6-astra]] — 1 shared claim
