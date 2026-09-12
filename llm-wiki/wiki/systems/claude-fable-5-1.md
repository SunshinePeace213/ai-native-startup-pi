---
type: system
status: current
created: 2026-09-02
updated: 2026-09-12
sources:
  - {resource: llm-wiki/raw/articles/artificial-analysis/benchmarking-gpt-6-astra.md, title: "Benchmarking GPT-6 Astra", id: src_1a690917c61d}
  - {resource: llm-wiki/raw/docs/anthropic/models-overview.md, title: "Models overview", id: src_963229517470}
  - {resource: llm-wiki/raw/docs/anthropic/pricing.md, title: "pricing", id: src_41365e6aef45}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
generated: {by: process:llm-wiki-render, at: 2026-09-12}
entity_ids: [ent_claude_fable_5_1]
claim_ids: [clm_a6d1086c1ed4, clm_830c5ae30594, clm_2ef013ac2702, clm_3313bc585301, clm_3998bab92a34, clm_3c016c102ee5, clm_486ba5592791, clm_5bae95a20dd2, clm_8b4e7965fc9f, clm_bcaacdc975c2, clm_de413e5598d2, clm_9c0d8265daab, clm_34fc0b797675, clm_41f9da71e4cf, clm_99361b6ce5ac, clm_a6168419f5b5, clm_b912dae9bece, clm_fb52a42c5df4, clm_4ed7faf79e21, clm_b33fcb0a8223, clm_094644aafda5, clm_2b15ffa95160, clm_3cf4d9ede51e, clm_a50b6a0ab8de]
confidence: 0.90
stale_after: 2027-03-22
last_rendered: 2026-09-12T20:30:33Z
review_required: false
---

# Claude Fable 5.1

> **In here:** Cache hits on Claude Fable 5.1 are priced at 0.025x the base input price — $0.25 per million · 24 claims, confidence 0.90.

## Current understanding

- Prompts written for Claude Fable 5 should perform well on Claude Fable 5.1 without changes, with a handful of behavioral differences worth knowing about (0.93)
- Cache hits on Claude Fable 5.1 are priced at 0.025x the base input price — $0.25 per million — against the 0.1x multiplier every other Claude model uses, so a long agentic session on a stable prefix pays far below Fable's sticker rate (0.93)
- Claude Fable 5.1 writes fewer user-facing updates during long tool-calling turns than Claude Fable 5, more pronounced at higher effort and in longer tool chains, so a harness must request progress-update thinking blocks and strip prompt lines that suppress narration before adding new instructions (0.93)
- On coding tasks, letting the lead agent keep working while subagents run lowers average time to completion at similar quality, token usage, and cost, which needs a subagent-start tool that returns immediately, results passed back in a later user message, and a separate tool the lead calls when it wants to wait (0.93)
- Claude Fable 5.1's safety classifiers produce fewer false positives than Claude Fable 5's did at launch and finding vulnerabilities in source code is permitted, but compile-check phrasing, lesser-known programming languages, and base64 in tool output still make a refusal stop reason more likely (0.93)
- In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel, which costs tokens, a round trip, and wall-clock time without affecting answer quality (0.93)
- On open-ended feature work Claude Fable 5.1 sometimes delivers more than asked - fixing nearby code, extending unmentioned behavior, or committing more test files than the change warrants - and an explicit instruction about what to leave out drops unrequested additions and committed test code substantially with no measurable change in task success (0.93)
- At low effort Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool and more likely to answer from memory, fixed either by raising effort for the affected turns or by prompting it to verify unfamiliar names before answering (0.93)
- Claude Fable 5.1's gains over Claude Fable 5 appear across effort levels and are largest at the higher settings: at medium it roughly matches Claude Fable 5 at lower cost, and at low it is often competitive with Claude Opus and Claude Sonnet models on cost per task while scoring higher (0.93)
- Claude Fable 5.1 is more likely than Claude Fable 5 to rewrite an entire text file rather than make a targeted edit; the resulting file is usually the same, but unless the file is short or most of it is changing the rewrite costs more output tokens and time (0.93)
- Anthropic's own routing rule is to start with Claude Opus 5 for most workloads and reach for Claude Fable 5.1 for demanding reasoning and long-horizon agentic work, or when evals on Opus 5 at higher effort still fall short (0.93)
- Fable 5.1 is the escalation from Opus 5: Anthropic names the trigger as evals on Claude Opus 5 at higher effort still falling short (0.93)
- Anthropic's comparative latency ladder runs Fable 5.1 slower, Opus 5 moderate, Sonnet 5 fast, Haiku 4.5 fastest (0.93)
- Claude Haiku 4.5 has a 200K-token context window, 64K max output, and a reliable knowledge cutoff of February 2025, against 1M context, 128K output, and 2026 cutoffs for Sonnet 5, Opus 5, and Fable 5.1 (0.93)
- Claude API list prices per million input/output tokens are Fable 5.1 $10/$50, Opus 5 $5/$25, Sonnet 5 $2/$10, and Haiku 4.5 $1/$5 (0.93)
- Anthropic positions Fable 5.1 for demanding reasoning and long-horizon agentic work, Opus 5 for complex agentic coding and enterprise work, Sonnet 5 as the best combination of speed and intelligence, and Haiku 4.5 as the fastest model with near-frontier intelligence (0.93)
- At xhigh and especially max effort Claude Fable 5.1 can think for longer before writing, drafting much of a long deliverable in its thinking and then writing it out again as the reply, so requests for long deliverables are better run at high unless a quality gain has been measured (0.92)
- Claude Fable 5.1 executes very long tasks without much guidance on methodology when the goal is clear, but on complex asynchronous workloads it needs a nudge not to end its turn before the work is done (0.92)
- At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score (0.81)
- On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively (0.81)
- On Terminal-Bench v4.0 GPT-6 Astra scores 59%, ahead of Claude Fable 5.1 at 52% and GPT-5.6 Sol at 40% (0.81)
- On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5 (0.81)
- On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54) (0.81)
- GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol (0.81)

## Evidence

- `clm_a6d1086c1ed4` — "Prompts written for Claude Fable 5 should perform well on Claude Fable 5.1 without changes, with a handful of behavioral differences worth knowing about." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Your existing Claude Fable 5 prompts should perform well on Claude Fable 5.1 without changes, but a handful of behavioral differences are worth knowing about."
- `clm_830c5ae30594` — "Cache hits on Claude Fable 5.1 are priced at 0.025x the base input price — $0.25 per million — against the 0.1x multiplier every other Claude model uses, so a long agentic session on a stable prefix pays far below Fable's sticker rate." · p 0.93 · active · 1 support · 0 contradict
  - `src_41365e6aef45` pricing: "Cache hits and refreshes on Claude Fable 5.1 and Claude Mythos 5.1 are priced at 0.025x the base input price. All other models use the standard 0.1x multiplier."
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
- `clm_de413e5598d2` — "Anthropic's own routing rule is to start with Claude Opus 5 for most workloads and reach for Claude Fable 5.1 for demanding reasoning and long-horizon agentic work, or when evals on Opus 5 at higher effort still fall short." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "If you're unsure which model to use, start with [Claude Opus 5](https://platform.claude.com/docs/en/models/opus-5/overview) for most workloads."
- `clm_9c0d8265daab` — "Fable 5.1 is the escalation from Opus 5: Anthropic names the trigger as evals on Claude Opus 5 at higher effort still falling short." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "or when your evals on Claude Opus 5 at higher effort still fall short."
- `clm_34fc0b797675` — "Anthropic's comparative latency ladder runs Fable 5.1 slower, Opus 5 moderate, Sonnet 5 fast, Haiku 4.5 fastest." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| Comparative latency | Slower | Moderate | Fast | Fastest |"
- `clm_41f9da71e4cf` — "Claude Haiku 4.5 has a 200K-token context window, 64K max output, and a reliable knowledge cutoff of February 2025, against 1M context, 128K output, and 2026 cutoffs for Sonnet 5, Opus 5, and Fable 5.1." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| Reliable knowledge cutoff | Jun 2026 | May 2026 | Jan 2026 | Feb 2025 |"
- `clm_99361b6ce5ac` — "Claude API list prices per million input/output tokens are Fable 5.1 $10/$50, Opus 5 $5/$25, Sonnet 5 $2/$10, and Haiku 4.5 $1/$5." · p 0.93 · active · 1 support · 0 contradict
  - `src_41365e6aef45` pricing: "| Claude Opus 5 | $5 / MTok | $6.25 / MTok | $10 / MTok | $0.50 / MTok | $25 / MTok |"
- `clm_a6168419f5b5` — "Anthropic positions Fable 5.1 for demanding reasoning and long-horizon agentic work, Opus 5 for complex agentic coding and enterprise work, Sonnet 5 as the best combination of speed and intelligence, and Haiku 4.5 as the fastest model with near-frontier intelligence." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "For demanding reasoning and long-horizon agentic work | For complex agentic coding and enterprise work | The best combination of speed and intelligence | The fastest model with near-frontier intelligence"
- `clm_b912dae9bece` — "At xhigh and especially max effort Claude Fable 5.1 can think for longer before writing, drafting much of a long deliverable in its thinking and then writing it out again as the reply, so requests for long deliverables are better run at high unless a quality gain has been measured." · p 0.92 · active · 1 support · 0 contradict · when: at xhigh and max effort
  - `src_9f2ae1e705ce` Delivering work: "At `xhigh` and especially `max` effort, Claude Fable 5.1 can think for longer before it starts writing its reply."
- `clm_fb52a42c5df4` — "Claude Fable 5.1 executes very long tasks without much guidance on methodology when the goal is clear, but on complex asynchronous workloads it needs a nudge not to end its turn before the work is done." · p 0.92 · active · 1 support · 0 contradict · when: on complex asynchronous workloads
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1 can execute very long tasks without much guidance on methodology, especially when the goal is clear. On complex asynchronous workloads, though, nudge it not to end its turn before the work is done."
- `clm_4ed7faf79e21` — "At max effort GPT-6 Astra uses about 27k output tokens per Intelligence Index task, roughly a third of Claude Fable 5.1's 78k for the same score." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "At max effort, Astra uses 27k output tokens per task, about a third of Claude Fable 5.1 (max with fallback) at 78k, for the same score."
- `clm_b33fcb0a8223` — "On Artificial Analysis's indices GPT-6 Astra ties Claude Fable 5.1 for first place — 53 on the Intelligence Index and 62 on the Coding Agent Index — at roughly 40% and 60% of Fable's cost per task respectively." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra ties leadership with Claude Fable 5.1 in both of our flagship Indices, at lower cost. Astra equals Fable 5.1 in the Intelligence Index at ~40% of the cost, and in the Coding Agent Index at ~60% of the cost."
- `clm_094644aafda5` — "On Terminal-Bench v4.0 GPT-6 Astra scores 59%, ahead of Claude Fable 5.1 at 52% and GPT-5.6 Sol at 40%." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "GPT-6 Astra scores 59% on Terminal-Bench v4.0, ahead of Claude Fable 5.1 (52%) and 19 points ahead of GPT-5.6 Sol (40%)."
- `clm_2b15ffa95160` — "On the Intelligence Index GPT-6 Astra costs $3.26 per task at max effort against $7.63 for Claude Fable 5.1, with every Astra effort level from low ($0.82) to max on the cost frontier; on the Coding Agent Index it costs $7.09 per task, about 40% less than Fable 5.1 and 30% less than Opus 5." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "Every reasoning effort of GPT-6 Astra sits on the Intelligence Index vs Cost per Task frontier, from low at $0.82 per task to max at $3.26."
- `clm_3cf4d9ede51e` — "On the Artificial Analysis Coding Agent Index GPT-6 Astra scores 62, level with Claude Fable 5.1 (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55), and Muse Spark 1.3 (54)." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "In Codex, GPT-6 Astra scores 62 in the Index, level with Claude Fable 5.1 in Claude Code (62) and ahead of Claude Opus 5 (60), GPT-5.6 Sol (55) and Muse Spark 1.3 in Muse Code (54)."
- `clm_a50b6a0ab8de` — "GPT-6 Astra takes markedly fewer turns per task than other frontier models — 24 at max effort on GDPval tasks against 45 for GPT-5.6 Sol and 60 for Claude Fable 5.1 and Claude Opus 5 — and its GDPval-AA v2 score dropped about 45 Elo against Sol." · p 0.81 · active · 1 support · 0 contradict
  - `src_1a690917c61d` Benchmarking GPT-6 Astra: "24 per task at max effort, compared to 45 for GPT-5.6 Sol and 60 turns per task for Claude Fable 5.1 and Claude Opus 5."

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
- 2026-09-12 new_claim `clm_b33fcb0a8223` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_3cf4d9ede51e` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_2b15ffa95160` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_4ed7faf79e21` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_a50b6a0ab8de` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_094644aafda5` (src_1a690917c61d)
- 2026-09-12 new_claim `clm_de413e5598d2` (src_963229517470)
- 2026-09-12 new_claim `clm_9c0d8265daab` (src_963229517470)
- 2026-09-12 new_claim `clm_41f9da71e4cf` (src_963229517470)
- 2026-09-12 new_claim `clm_34fc0b797675` (src_963229517470)
- 2026-09-12 new_claim `clm_a6168419f5b5` (src_963229517470)
- 2026-09-12 new_claim `clm_99361b6ce5ac` (src_41365e6aef45)
- 2026-09-12 new_claim `clm_830c5ae30594` (src_41365e6aef45)

## Related

- → uses [[effort-level]] (1.00)
- ← uses [[agent-harness]] (0.99)
- → extends [[claude-fable-5]] (0.93)
- → applies_to [[agentic-coding]] (0.93)
- → applies_to [[security-review]] (0.93)
- → extends [[claude-opus-5]] (0.93)
- → uses [[edit-tool]] (0.93)
- → uses [[subagents]] (0.93)
- → uses [[tool-use]] (0.93)
- ← related_to [[gpt-6-astra]] (0.81)
- [[claude-opus-5]] — 9 shared claims
- [[artificial-analysis]] — 6 shared claims
- [[gpt-6-astra]] — 6 shared claims
- [[claude-haiku-4-5]] — 4 shared claims
- [[claude-sonnet-5]] — 4 shared claims
- [[effort-level]] — 4 shared claims
- [[gpt-5-6-sol]] — 3 shared claims
- [[agent-harness]] — 2 shared claims
- [[agentic-coding]] — 1 shared claim
- [[claude-fable-5]] — 1 shared claim
- [[edit-tool]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[tool-use]] — 1 shared claim
