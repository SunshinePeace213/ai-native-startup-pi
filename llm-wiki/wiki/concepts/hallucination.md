---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/reduce-hallucinations.md, title: "Reduce hallucinations", id: src_e168e83948d2}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_hallucination]
claim_ids: [clm_83f513f52e26, clm_9da197d8cab5, clm_ba340cd11a58, clm_e5cb45f465fa, clm_23e5e06bdc60, clm_56836c900a72, clm_72f494da5cd4]
confidence: 0.93
stale_after: 2029-10-09
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# hallucination

> **In here:** hallucination — 7 claims, confidence 0.93, 1 source.

## Current understanding

- Hallucination-reduction techniques significantly reduce but never eliminate hallucinations, so critical information must still be validated, especially for high-stakes decisions (0.94)
- For tasks over long documents of more than 20k tokens, asking Claude to extract word-for-word quotes before performing its task grounds the response in the actual text and reduces hallucinations (0.93)
- Explicitly giving Claude permission to admit uncertainty and say it does not know can drastically reduce false information (0.93)
- Having Claude cite quotes and sources for each claim makes its response auditable, and a post-generation pass that finds a supporting quote per claim and retracts any claim without one catches unsupported statements (0.93)
- Explicitly instructing Claude to use only the provided documents and not its general knowledge restricts the space in which it can hallucinate (0.92)
- Running the same prompt several times and comparing the outputs surfaces hallucinations, because inconsistencies across runs indicate fabricated content (0.92)
- Asking Claude to explain its reasoning step by step before a final answer can reveal faulty logic or assumptions behind a hallucination (0.92)

## Evidence

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

## Timeline

- 2026-09-02 new_claim `clm_ba340cd11a58` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_9da197d8cab5` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_e5cb45f465fa` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_72f494da5cd4` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_56836c900a72` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_23e5e06bdc60` (src_e168e83948d2)
- 2026-09-02 new_claim `clm_83f513f52e26` (src_e168e83948d2)

## Related

- none yet
