---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md, title: "A field guide to Claude Fable 5: Finding your unknowns", id: src_10f512f5f8de}
  - {resource: llm-wiki/raw/articles/artificial-analysis/gpt-5-6-has-landed.md, title: "GPT-5.6 benchmarks across Intelligence, Speed and Cost", id: src_c49e34d6a671}
  - {resource: llm-wiki/raw/articles/datacurve/deepswe-v1-1.md, title: "DeepSWE v1.1", id: src_74863c70ef6c}
  - {resource: llm-wiki/raw/articles/openai/gpt-5-6.md, title: "gpt-5-6", id: src_6556cffbfc4e}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5.md, title: "prompting-claude-fable-5", id: src_84badaa3952a}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_claude_fable_5]
claim_ids: [clm_a6d1086c1ed4, clm_46759f4da549, clm_99154f0251ed, clm_d661b794ce46, clm_32f17cdfb00d, clm_8479874ac5ba, clm_b423f79733bb, clm_cb95dc403e93, clm_199eade5a5f7, clm_708185b8ba6a, clm_3b50c521dcf6, clm_c1edb617029a, clm_096dbb5c1e93, clm_d79a4bcae597, clm_f527db1617d8, clm_34a7772523ea]
confidence: 0.88
stale_after: 2026-12-18
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# Claude Fable 5

> **In here:** Claude Fable 5's individual requests on hard tasks can run for many minutes and autonomous runs for hours, which is one of the largest shifts teams encounter on migration: client timeouts… · 16 claims, confidence 0.88.

## Current understanding

- Prompts written for Claude Fable 5 should perform well on Claude Fable 5.1 without changes, with a handful of behavioral differences worth knowing about (0.93)
- Claude Fable 5's individual requests on hard tasks can run for many minutes and autonomous runs for hours, which is one of the largest shifts teams encounter on migration: client timeouts, streaming, and progress indicators need adjusting, and harnesses are better restructured to check on runs asynchronously than to block (0.93)
- Instructing Claude Fable 5 to audit each progress claim against an actual tool result nearly eliminated fabricated status reports in Anthropic's testing, even on tasks designed to elicit them (0.93)
- Claude Fable 5's instruction-following is improved enough that a brief instruction steers most behaviors, so enumerating each behavior by name is unnecessary (0.93)
- Skills developed for prior models are often too prescriptive for Claude Fable 5 and can degrade its output quality, so migration means reviewing and removing older instructions wherever default performance is better (0.93)
- On Claude Fable 5 effort is the primary control for the intelligence, latency, and cost trade-off: high is the default for most tasks, xhigh for the most capability-sensitive workloads, medium or low for routine work — and its lower effort settings often exceed xhigh performance on prior models (0.93)
- Fable 5's cybersecurity safety classifiers block certain model activities during a Claude Security scan and automatically downgrade them to Opus; this is expected and the scan should still complete successfully (0.93)
- Separate, fresh-context verifier subagents tend to outperform self-critique, so long-running prompts should make self-verification explicit by scheduling subagent checks against the specification at an interval (0.93)
- A 1 million token context window is supported by Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6, and on the Anthropic API Fable 5, Sonnet 5, and Opus 4.7 and later always run with it (0.93)
- Showing Claude Fable 5 a remaining-token countdown is what most often triggers it to suggest a new session, offer to summarize and hand off, or trim its own work, so harnesses should avoid surfacing explicit context-budget counts (0.91)
- Claude Fable is the first model where the quality of the work is bottlenecked by the human's ability to clarify its unknowns rather than by the model's capability (0.81)
- Instructing Claude fails in both directions: too specific and it follows the instructions even where a pivot would be more appropriate, too vague and it falls back on industry best practices that may not fit the task (0.81)
- 73 of Claude Fable 5's 2,260 DeepSWE trials never completed because a US government directive suspended access partway through the sweep, and its pass rates are computed over the completed trials only (0.81)
- GPT-5.6 Sol at max has the highest Presentation Elo of any model on AA-Briefcase — its PowerPoint and Excel outputs are the most visually attractive — while ranking second to Claude Fable 5 overall (0.80)
- On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task (0.80)
- On Agents' Last Exam, a benchmark of long-running professional workflows across 55 fields, OpenAI reports GPT-5.6 Sol at 53.6, 13.1 points above Claude Fable 5, and 11.4 points above it even at medium effort at about a quarter of the estimated cost (0.79)

## Evidence

- `clm_a6d1086c1ed4` — "Prompts written for Claude Fable 5 should perform well on Claude Fable 5.1 without changes, with a handful of behavioral differences worth knowing about." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Your existing Claude Fable 5 prompts should perform well on Claude Fable 5.1 without changes, but a handful of behavioral differences are worth knowing about."
- `clm_46759f4da549` — "Claude Fable 5's individual requests on hard tasks can run for many minutes and autonomous runs for hours, which is one of the largest shifts teams encounter on migration: client timeouts, streaming, and progress indicators need adjusting, and harnesses are better restructured to check on runs asynchronously than to block" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "This is one of the largest shifts teams encounter when adjusting to Claude Fable 5."
- `clm_99154f0251ed` — "Instructing Claude Fable 5 to audit each progress claim against an actual tool result nearly eliminated fabricated status reports in Anthropic's testing, even on tasks designed to elicit them" · p 0.93 · active · 1 support · 0 contradict · when: on long autonomous runs
  - `src_84badaa3952a` prompting-claude-fable-5: "In Anthropic's testing, this nearly eliminated fabricated status reports even on tasks designed to elicit them"
- `clm_d661b794ce46` — "Claude Fable 5's instruction-following is improved enough that a brief instruction steers most behaviors, so enumerating each behavior by name is unnecessary" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "Instruction-following is improved enough that you can steer most behaviors with a brief instruction rather than enumerating each behavior by name."
- `clm_32f17cdfb00d` — "Skills developed for prior models are often too prescriptive for Claude Fable 5 and can degrade its output quality, so migration means reviewing and removing older instructions wherever default performance is better" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "Skills developed for prior models are often too prescriptive for Claude Fable 5 and can degrade output quality. Review and consider removing older instructions if default performance is better."
- `clm_8479874ac5ba` — "On Claude Fable 5 effort is the primary control for the intelligence, latency, and cost trade-off: high is the default for most tasks, xhigh for the most capability-sensitive workloads, medium or low for routine work — and its lower effort settings often exceed xhigh performance on prior models" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "Use `high` as the default for most tasks, with `xhigh` for the most capability-sensitive workloads and `medium` or `low` for routine work."
- `clm_b423f79733bb` — "Fable 5's cybersecurity safety classifiers block certain model activities during a Claude Security scan and automatically downgrade them to Opus; this is expected and the scan should still complete successfully." · p 0.93 · active · 1 support · 0 contradict · when: when running on Claude Fable 5
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Due to Fable 5's cybersecurity safety classifiers, certain model activities will be blocked and automatically downgraded to Opus. This is expected, and the scan should still complete successfully."
- `clm_cb95dc403e93` — "Separate, fresh-context verifier subagents tend to outperform self-critique, so long-running prompts should make self-verification explicit by scheduling subagent checks against the specification at an interval" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "Separate, fresh-context verifier subagents tend to outperform self-critique."
- `clm_199eade5a5f7` — "A 1 million token context window is supported by Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6, and on the Anthropic API Fable 5, Sonnet 5, and Opus 4.7 and later always run with it." · p 0.93 · active · 1 support · 0 contradict · when: on the Anthropic API for the always-on case
  - `src_a959e4684753` Model configuration: "Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6 support a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#context-window-sizes-by-model) for long sessions with large codebases."
- `clm_708185b8ba6a` — "Showing Claude Fable 5 a remaining-token countdown is what most often triggers it to suggest a new session, offer to summarize and hand off, or trim its own work, so harnesses should avoid surfacing explicit context-budget counts" · p 0.91 · active · 1 support · 0 contradict · when: in very long sessions
  - `src_84badaa3952a` prompting-claude-fable-5: "In very long sessions, Claude Fable 5 can occasionally suggest a new session, offer to summarize and hand off, or trim its own work. This is most often triggered when the harness shows a remaining-token countdown to the model."
- `clm_3b50c521dcf6` — "Claude Fable is the first model where the quality of the work is bottlenecked by the human's ability to clarify its unknowns rather than by the model's capability" · p 0.81 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "Claude Fable is the first model where I find the quality of the work is bottlenecked by my ability to clarify its unknowns."
- `clm_c1edb617029a` — "Instructing Claude fails in both directions: too specific and it follows the instructions even where a pivot would be more appropriate, too vague and it falls back on industry best practices that may not fit the task" · p 0.81 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "If you are too specific, Claude will follow your instructions even when a pivot may be more appropriate."
- `clm_096dbb5c1e93` — "73 of Claude Fable 5's 2,260 DeepSWE trials never completed because a US government directive suspended access partway through the sweep, and its pass rates are computed over the completed trials only." · p 0.81 · active · 1 support · 0 contradict
  - `src_74863c70ef6c` DeepSWE v1.1: "Note: 73 of Claude Fable 5's 2,260 trials did not complete due to [access being suspended by a US government directive](https://www.anthropic.com/news/fable-mythos-access) partway through our sweep."
- `clm_d79a4bcae597` — "GPT-5.6 Sol at max has the highest Presentation Elo of any model on AA-Briefcase — its PowerPoint and Excel outputs are the most visually attractive — while ranking second to Claude Fable 5 overall." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) ranks second only to Claude Fable 5 (max) in AA-Briefcase, and has the highest Presentation Elo of any model."
- `clm_f527db1617d8` — "On Artificial Analysis Intelligence Index v4.1 GPT-5.6 Sol at max scores 59, one point below Claude Fable 5, at about one third of the cost per task ($1.04); Terra and Luna score 55 and 51 at $0.55 and $0.21 per task." · p 0.80 · active · 1 support · 0 contradict
  - `src_c49e34d6a671` GPT-5.6 benchmarks across Intelligence, Speed and Cost: "GPT-5.6 Sol (max) scores 1 point below Claude Fable 5 (max) in the Artificial Analysis Intelligence Index at 59 points, at approximately one third of the cost. GPT-5.6 Terra (max) and Luna (max) score 55 and 51 respectively"
- `clm_34a7772523ea` — "On Agents' Last Exam, a benchmark of long-running professional workflows across 55 fields, OpenAI reports GPT-5.6 Sol at 53.6, 13.1 points above Claude Fable 5, and 11.4 points above it even at medium effort at about a quarter of the estimated cost." · p 0.79 · active · 1 support · 0 contradict
  - `src_6556cffbfc4e` gpt-5-6: "GPT‑5.6 Sol sets a new high of 53.6, eclipsing Claude Fable 5 (adaptive reasoning) by 13.1 points. Even at medium reasoning, it beats Fable 5 by 11.4 points at roughly one-quarter the estimated cost."

## Timeline

- 2026-08-23 new_claim `clm_46759f4da549` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_8479874ac5ba` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_d661b794ce46` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_99154f0251ed` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_cb95dc403e93` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_32f17cdfb00d` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_708185b8ba6a` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_3b50c521dcf6` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_c1edb617029a` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_199eade5a5f7` (src_a959e4684753)
- 2026-08-30 new_claim `clm_b423f79733bb` (src_2eb7a799d8a7)
- 2026-09-02 new_claim `clm_a6d1086c1ed4` (src_9f2ae1e705ce)
- 2026-09-12 new_claim `clm_34a7772523ea` (src_6556cffbfc4e)
- 2026-09-12 new_claim `clm_f527db1617d8` (src_c49e34d6a671)
- 2026-09-12 new_claim `clm_d79a4bcae597` (src_c49e34d6a671)
- 2026-09-14 new_claim `clm_096dbb5c1e93` (src_74863c70ef6c)

## Related

- ← extends [[claude-fable-5-1]] (0.93)
- ← applies_to [[skills]] (0.93)
- ← uses [[claude-security-plugin]] (0.93)
- → uses [[effort-level]] (0.93)
- → uses [[subagents]] (0.93)
- → related_to [[context-window]] (0.91)
- ← applies_to [[unknowns]] (0.82)
- → depends_on [[unknowns]] (0.82)
- [[gpt-5-6-sol]] — 3 shared claims
- [[artificial-analysis]] — 2 shared claims
- [[context-window]] — 2 shared claims
- [[unknowns]] — 2 shared claims
- [[claude-fable-5-1]] — 1 shared claim
- [[claude-security-plugin]] — 1 shared claim
- [[claude-sonnet-5]] — 1 shared claim
- [[deepswe]] — 1 shared claim
- [[effort-level]] — 1 shared claim
- [[gpt-5-6-luna]] — 1 shared claim
- [[gpt-5-6-terra]] — 1 shared claim
- [[skills]] — 1 shared claim
- [[subagents]] — 1 shared claim
