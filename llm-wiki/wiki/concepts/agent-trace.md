---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-26
sources:
  - {resource: llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md, title: "Demystifying evals for AI agents", id: src_e66d966eb39d}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
generated: {by: process:llm-wiki-render, at: 2026-08-26}
entity_ids: [ent_agent_trace]
claim_ids: [clm_74d513c47cec, clm_407990353ce0, clm_5373490044e2, clm_6fe59dcba5d2, clm_d804422af101]
confidence: 0.78
stale_after: 2027-08-22
last_rendered: 2026-08-26T08:11:39Z
review_required: false
---

# agent trace

> **In here:** For teams running open-weight models the hill climbing loop can feed RL fine-tuning, using trace or eval outcomes as training signal to improve the model itself · 5 claims, confidence 0.78.

## Current understanding

- The hill climbing loop runs an analysis agent over production traces and uses the findings to rewrite the harness configuration, including prompt, tool, and grader tweaks (0.81)
- For teams running open-weight models the hill climbing loop can feed RL fine-tuning, using trace or eval outcomes as training signal to improve the model itself (0.79)
- The outcome of a trial is the final state of the environment, not what the agent says it did, so a booking agent's success is whether a reservation exists in the database rather than whether the transcript claims one was made (0.77)
- Grade what the agent produced rather than the path it took: checking that an agent followed a specific sequence of tool calls makes brittle tests, because agents regularly find valid approaches the eval designer did not anticipate (0.77)
- Reading transcripts and grades from many trials is the only way to know whether the graders work: a failed task's transcript shows whether the agent made a genuine mistake or the grader rejected a valid solution (0.77)

## Evidence

- `clm_74d513c47cec` — "The hill climbing loop runs an analysis agent over production traces and uses the findings to rewrite the harness configuration, including prompt, tool, and grader tweaks." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The hill climbing loop runs an analysis agent over those traces and uses the findings to rewrite the harness with improved configuration. That can include prompt/tool tweaks or grader tweaks."
- `clm_407990353ce0` — "For teams running open-weight models the hill climbing loop can feed RL fine-tuning, using trace or eval outcomes as training signal to improve the model itself." · p 0.79 · active · 1 support · 0 contradict · when: for teams running open-weight models
  - `src_5b435bf5e144` the-art-of-loop-engineering: "For teams running open-weight models, the hill climbing loop can feed into RL fine-tuning, using trace or eval outcomes as training signal to improve the model itself."
- `clm_5373490044e2` — "The outcome of a trial is the final state of the environment, not what the agent says it did, so a booking agent's success is whether a reservation exists in the database rather than whether the transcript claims one was made." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "A flight-booking agent might say “Your flight has been booked” at the end of the transcript, but the outcome is whether a reservation exists in the environment’s SQL database."
- `clm_6fe59dcba5d2` — "Grade what the agent produced rather than the path it took: checking that an agent followed a specific sequence of tool calls makes brittle tests, because agents regularly find valid approaches the eval designer did not anticipate." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "So as not to unnecessarily punish creativity, it’s often better to grade what the agent produced, not the path it took."
- `clm_d804422af101` — "Reading transcripts and grades from many trials is the only way to know whether the graders work: a failed task's transcript shows whether the agent made a genuine mistake or the grader rejected a valid solution." · p 0.77 · active · 1 support · 0 contradict
  - `src_e66d966eb39d` Demystifying evals for AI agents: "You won't know if your graders are working well unless you read the transcripts and grades from many trials."

## Timeline

- 2026-08-23 new_claim `clm_74d513c47cec` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_407990353ce0` (src_5b435bf5e144)
- 2026-08-26 new_claim `clm_5373490044e2` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_6fe59dcba5d2` (src_e66d966eb39d)
- 2026-08-26 new_claim `clm_d804422af101` (src_e66d966eb39d)

## Related

- ← uses [[hill-climbing-loop]] (0.81)
- ← applies_to [[grader]] (0.77)
- ← uses [[agent-evaluation]] (0.77)
- ← uses [[grader]] (0.77)
- [[grader]] — 2 shared claims
- [[hill-climbing-loop]] — 2 shared claims
- [[agent-evaluation]] — 1 shared claim
- [[agent-harness]] — 1 shared claim
- [[loop-engineering]] — 1 shared claim
