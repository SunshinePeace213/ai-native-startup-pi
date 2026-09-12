---
type: system
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_claude_fable_5_1]
claim_ids: [clm_a6d1086c1ed4, clm_2ef013ac2702, clm_3313bc585301, clm_3998bab92a34, clm_3c016c102ee5, clm_486ba5592791, clm_5bae95a20dd2, clm_8b4e7965fc9f, clm_bcaacdc975c2, clm_b912dae9bece, clm_fb52a42c5df4]
confidence: 0.93
stale_after: 2029-10-09
last_rendered: 2026-09-02T10:03:36Z
review_required: false
---

# Claude Fable 5.1

> **In here:** Claude Fable 5.1 writes fewer user-facing updates during long tool-calling turns than Claude Fable 5, more pronounced at higher effort and in longer tool chains, so a harness must request… · 11 claims, confidence 0.93.

## Current understanding

- Prompts written for Claude Fable 5 should perform well on Claude Fable 5.1 without changes, with a handful of behavioral differences worth knowing about (0.93)
- Claude Fable 5.1 writes fewer user-facing updates during long tool-calling turns than Claude Fable 5, more pronounced at higher effort and in longer tool chains, so a harness must request progress-update thinking blocks and strip prompt lines that suppress narration before adding new instructions (0.93)
- On coding tasks, letting the lead agent keep working while subagents run lowers average time to completion at similar quality, token usage, and cost, which needs a subagent-start tool that returns immediately, results passed back in a later user message, and a separate tool the lead calls when it wants to wait (0.93)
- Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch and finding vulnerabilities in source code is permitted, but compile-check phrasing, lesser-known programming languages, and base64 in tool output still make a refusal stop reason more likely (0.93)
- In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel, which costs tokens, a round trip, and wall-clock time without affecting answer quality (0.93)
- On open-ended feature work Claude Fable 5.1 sometimes delivers more than asked - fixing nearby code, extending unmentioned behavior, or committing more test files than the change warrants - and an explicit instruction about what to leave out drops unrequested additions and committed test code substantially with no measurable change in task success (0.93)
- At low effort Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool and more likely to answer from memory, fixed either by raising effort for the affected turns or by prompting it to verify unfamiliar names before answering (0.93)
- Claude Fable 5.1's gains over Claude Fable 5 appear across effort levels and are largest at the higher settings: at medium it roughly matches Claude Fable 5 at lower cost, and at low it is often competitive with Claude Opus and Claude Sonnet models on cost per task while scoring higher (0.93)
- Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit; the resulting file is usually the same, but unless the file is short or most of it is changing the rewrite costs more output tokens and time (0.93)
- At xhigh and especially max effort Claude Fable 5.1 can think for longer before writing, drafting much of a long deliverable in its thinking and then writing it out again as the reply, so requests for long deliverables are better run at high unless a quality gain has been measured (0.92)
- Claude Fable 5.1 executes very long tasks without much guidance on methodology when the goal is clear, but on complex asynchronous workloads it needs a nudge not to end its turn before the work is done (0.92)

## Evidence

- `clm_a6d1086c1ed4` — "Prompts written for Claude Fable 5 should perform well on Claude Fable 5.1 without changes, with a handful of behavioral differences worth knowing about." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Your existing Claude Fable 5 prompts should perform well on Claude Fable 5.1 without changes, but a handful of behavioral differences are worth knowing about."
- `clm_2ef013ac2702` — "Claude Fable 5.1 writes fewer user-facing updates during long tool-calling turns than Claude Fable 5, more pronounced at higher effort and in longer tool chains, so a harness must request progress-update thinking blocks and strip prompt lines that suppress narration before adding new instructions." · p 0.93 · active · 1 support · 0 contradict · when: during long tool-calling turns
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1's default behavior is to write fewer user-facing updates during long tool-calling turns than Claude Fable 5 does. This becomes more pronounced at higher effort and in longer tool chains."
- `clm_3313bc585301` — "On coding tasks, letting the lead agent keep working while subagents run lowers average time to completion at similar quality, token usage, and cost, which needs a subagent-start tool that returns immediately, results passed back in a later user message, and a separate tool the lead calls when it wants to wait." · p 0.93 · active · 1 support · 0 contradict · when: on coding tasks
  - `src_9f2ae1e705ce` Delivering work: "On coding tasks, letting the lead continue while subagents run lowers average time to completion at similar quality, token usage, and cost."
- `clm_3998bab92a34` — "Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch and finding vulnerabilities in source code is permitted, but compile-check phrasing, lesser-known programming languages, and base64 in tool output still make a refusal stop reason more likely." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch, and finding vulnerabilities in source code is permitted."
- `clm_3c016c102ee5` — "In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel, which costs tokens, a round trip, and wall-clock time without affecting answer quality." · p 0.93 · active · 1 support · 0 contradict · when: in coding and computer-use agent loops
  - `src_9f2ae1e705ce` Delivering work: "The exception is coding and computer-use loops where the next independent calls are implied by the task rather than explicitly requested (custom coding agents, bash-and-editor harnesses, computer use): there it may issue them one per turn…"
- `clm_486ba5592791` — "On open-ended feature work Claude Fable 5.1 sometimes delivers more than asked - fixing nearby code, extending unmentioned behavior, or committing more test files than the change warrants - and an explicit instruction about what to leave out drops unrequested additions and committed test code substantially with no measurable change in task success." · p 0.93 · active · 1 support · 0 contradict · when: on open-ended feature implementation
  - `src_9f2ae1e705ce` Delivering work: "When asked to implement an open-ended feature, Claude Fable 5.1 delivers what's asked for and sometimes more: it may fix nearby code, extend behavior the task didn't mention, or commit more test files than the change warrants."
- `clm_5bae95a20dd2` — "At low effort Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool and more likely to answer from memory, fixed either by raising effort for the affected turns or by prompting it to verify unfamiliar names before answering." · p 0.93 · active · 1 support · 0 contradict · when: at low effort
  - `src_9f2ae1e705ce` Delivering work: "At `low` effort, Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool, and more likely to answer from memory."
- `clm_8b4e7965fc9f` — "Claude Fable 5.1's gains over Claude Fable 5 appear across effort levels and are largest at the higher settings: at medium it roughly matches Claude Fable 5 at lower cost, and at low it is often competitive with Claude Opus and Claude Sonnet models on cost per task while scoring higher." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1's capability gains over Claude Fable 5 show up across effort levels and are largest at the higher settings."
- `clm_bcaacdc975c2` — "Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit; the resulting file is usually the same, but unless the file is short or most of it is changing the rewrite costs more output tokens and time." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit."
- `clm_b912dae9bece` — "At xhigh and especially max effort Claude Fable 5.1 can think for longer before writing, drafting much of a long deliverable in its thinking and then writing it out again as the reply, so requests for long deliverables are better run at high unless a quality gain has been measured." · p 0.92 · active · 1 support · 0 contradict · when: at xhigh and max effort
  - `src_9f2ae1e705ce` Delivering work: "At `xhigh` and especially `max` effort, Claude Fable 5.1 can think for longer before it starts writing its reply."
- `clm_fb52a42c5df4` — "Claude Fable 5.1 executes very long tasks without much guidance on methodology when the goal is clear, but on complex asynchronous workloads it needs a nudge not to end its turn before the work is done." · p 0.92 · active · 1 support · 0 contradict · when: on complex asynchronous workloads
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1 can execute very long tasks without much guidance on methodology, especially when the goal is clear. On complex asynchronous workloads, though, nudge it not to end its turn before the work is done."

## Timeline

- 2026-09-02 new_claim `clm_a6d1086c1ed4` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_8b4e7965fc9f` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_2ef013ac2702` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_3c016c102ee5` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_fb52a42c5df4` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_486ba5592791` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_5bae95a20dd2` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_bcaacdc975c2` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_b912dae9bece` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_3313bc585301` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_3998bab92a34` (src_9f2ae1e705ce)

## Related

- → uses [[effort-level]] (1.00)
- ← uses [[agent-harness]] (0.99)
- → extends [[claude-fable-5]] (0.93)
- → applies_to [[agentic-coding]] (0.93)
- → applies_to [[security-review]] (0.93)
- → uses [[edit-tool]] (0.93)
- → uses [[subagents]] (0.93)
- → uses [[tool-use]] (0.93)
- [[effort-level]] — 3 shared claims
- [[agent-harness]] — 2 shared claims
- [[agentic-coding]] — 1 shared claim
- [[claude-fable-5]] — 1 shared claim
- [[edit-tool]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[tool-use]] — 1 shared claim
