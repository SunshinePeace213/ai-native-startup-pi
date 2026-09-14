---
type: project
status: current
created: 2026-09-14
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/datacurve/deepswe-v1-1.md, title: "DeepSWE v1.1", id: src_74863c70ef6c}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_datacurve]
claim_ids: [clm_983bc5b1738a, clm_af3ac5bbcf6b]
confidence: 0.82
stale_after: 2028-04-10
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# Datacurve

> **In here:** Datacurve — 2 claims, confidence 0.82, 1 source.

## Current understanding

- DeepSWE v1.1 grades the agent's committed git patch in a fresh container separate from where the agent worked, following SWE-bench's approach, so grading is independent of the agent's runtime environment (0.83)
- Datacurve swept the tasks' upstream repositories as of June 5th for implementations similar to its tasks, found none, and concludes v1.0 results are free of agents finding the answer through git log (0.81)

## Evidence

- `clm_983bc5b1738a` — "DeepSWE v1.1 grades the agent's committed git patch in a fresh container separate from where the agent worked, following SWE-bench's approach, so grading is independent of the agent's runtime environment." · p 0.83 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "**Isolated Verification:** The agent commits its proposed changes, and we extract the git patch to evaluate in an isolated container, separate from where the agent worked."
- `clm_af3ac5bbcf6b` — "Datacurve swept the tasks' upstream repositories as of June 5th for implementations similar to its tasks, found none, and concludes v1.0 results are free of agents finding the answer through git log." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "We conducted a sweep of the tasks' upstream repos to check whether any had implementations similar to our tasks as of June 5th. We found no such instances, meaning results from v1.0 remain free of this form of cheating."

## Timeline

- 2026-09-14 new_claim `clm_983bc5b1738a` (src_74863c70ef6c)
- 2026-09-14 new_claim `clm_af3ac5bbcf6b` (src_74863c70ef6c)

## Related

- → produces [[deepswe]] (0.83)
- [[deepswe]] — 2 shared claims
