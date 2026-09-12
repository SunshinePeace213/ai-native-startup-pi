---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/articles/anthropic/claude-model-and-effort-level-in-claude-code.md, title: "Choosing a Claude model and effort level in Claude Code", id: src_fbabc2423960}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5.md, title: "prompting-claude-fable-5", id: src_84badaa3952a}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-sonnet-5.md, title: "prompting-claude-sonnet-5", id: src_b6f0e67933fe}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_effort_level]
claim_ids: [clm_3a056b12fdae, clm_2361143345d6, clm_639cfed3cd72, clm_276d872e5414, clm_6dfe4cd8cabb, clm_176a1b0b4554, clm_5bae95a20dd2, clm_8479874ac5ba, clm_8b4e7965fc9f, clm_a59ebad0a4be, clm_d14e11fac1d7, clm_e24b51402fe1, clm_f9352cf8d901, clm_b912dae9bece, clm_3cc279b5026f, clm_d6ec10ffd6b5, clm_f78e75dbfc4a]
confidence: 0.91
stale_after: 2028-01-30
last_rendered: 2026-09-02T10:03:36Z
review_required: false
---

# effort level

> **In here:** Effort determines how far Claude will travel along its capability curve, not how far it must travel to complete the task, so effort cannot substitute for a model that lacks the capability · 17 claims, confidence 0.91.

## Current understanding

- Effort is not just thinking time: it controls the total work Claude performs, including how many files it reads, which tools it uses, and how many task-completion steps it takes before checking in (0.98)
- Effort is best treated as a manual override scaling thoroughness or speed by domain or work type — a general preference rather than a task-by-task adjustment — with the model's default effort used for most tasks (0.98)
- The local /code-review command trades coverage for confidence by effort level: low and medium report only the findings it is most confident in, while high through max broaden coverage and may include findings the review is less sure about (0.94)
- Each Claude Security scan writes a revision stamp recording which commit was scanned, at what effort, whether uncommitted changes were part of the scanned tree, and how thoroughly the run was verified, so a report is always tied to the code it describes (0.93)
- Extended thinking is the reasoning Claude emits before responding, and on models with adaptive reasoning the effort level is the primary control over how much of it happens — the thinking settings only turn it on or off and control its display (0.93)
- On Claude Opus 5 low and medium effort produce strong quality at a fraction of the tokens and latency of higher settings, so they serve as the primary control for token cost and response time wherever quality holds, with xhigh reserved for demanding coding and agentic work (0.93)
- At low effort Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool and more likely to answer from memory, fixed either by raising effort for the affected turns or by prompting it to verify unfamiliar names before answering (0.93)
- On Claude Fable 5 effort is the primary control for the intelligence, latency, and cost trade-off: high is the default for most tasks, xhigh for the most capability-sensitive workloads, medium or low for routine work — and its lower effort settings often exceed xhigh performance on prior models (0.93)
- Claude Fable 5.1's gains over Claude Fable 5 appear across effort levels and are largest at the higher settings: at medium it roughly matches Claude Fable 5 at lower cost, and at low it is often competitive with Claude Opus and Claude Sonnet models on cost per task while scoring higher (0.93)
- Effort level names do not correspond to the same amount of thinking across models, so an effort sweep must be re-run on each new model rather than carried over (0.93)
- Claude Opus 5's default user-facing responses run longer than prior Opus models, and because effort controls how much the model thinks rather than how much it says, lowering effort does not reliably shorten the visible response — response length has to be prompted for explicitly (0.93)
- Which effort levels exist depends on the model, and asking for a level the active model does not support runs it at the highest supported level at or below the one requested (0.93)
- As a rough cross-model mapping when migrating, Claude Sonnet 5 at medium is comparable in intelligence to Claude Sonnet 4.6 at high and Sonnet 5 at high to Sonnet 4.6 at max, and benchmarking should match by observed thinking length rather than by effort name (0.93)
- At xhigh and especially max effort Claude Fable 5.1 can think for longer before writing, drafting much of a long deliverable in its thinking and then writing it out again as the reply, so requests for long deliverables are better run at high unless a quality gain has been measured (0.92)
- The axis to raise is picked by the failure: if Claude had adequate context and still got it wrong the answer is a more capable model, and if it skipped steps or abandoned the task prematurely the answer is more effort (0.82)
- Effort determines how far Claude will travel along its capability curve, not how far it must travel to complete the task, so effort cannot substitute for a model that lacks the capability (0.80)
- Per-token costs increase with larger models but total per-task costs may decrease on genuinely difficult tasks, because a smaller model grinding at its capability limit cannot succeed regardless of effort (0.80)

## Evidence

- `clm_3a056b12fdae` — "Effort is not just thinking time: it controls the total work Claude performs, including how many files it reads, which tools it uses, and how many task-completion steps it takes before checking in" · p 0.98 · active · 2 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "Effort encompasses more than thinking time—it controls the total work Claude performs, including files read, tools used, and task completion steps before checking in."
  - `src_a959e4684753` Model configuration: "[Effort levels](https://platform.claude.com/docs/en/build-with-claude/effort) control adaptive reasoning, which lets the model decide whether and how much to think on each step based on task complexity."
- `clm_2361143345d6` — "Effort is best treated as a manual override scaling thoroughness or speed by domain or work type — a general preference rather than a task-by-task adjustment — with the model's default effort used for most tasks" · p 0.98 · active · 2 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "Think of effort as a manual override for scaling thoroughness or speed based on domain or work type—consider it a general preference rather than task-by-task adjustment."
  - `src_a959e4684753` Model configuration: "Each level trades token spend against capability. The default suits most coding tasks; adjust when you want a different balance."
- `clm_639cfed3cd72` — "The local /code-review command trades coverage for confidence by effort level: low and medium report only the findings it is most confident in, while high through max broaden coverage and may include findings the review is less sure about." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "Pass an [effort level](/docs/en/model-config#adjust-effort-level) to trade coverage for confidence. At `low` and `medium`, the review reports only the findings it's most confident in, so you see fewer false positives;"
- `clm_276d872e5414` — "Each Claude Security scan writes a revision stamp recording which commit was scanned, at what effort, whether uncommitted changes were part of the scanned tree, and how thoroughly the run was verified, so a report is always tied to the code it describes." · p 0.93 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "**`CLAUDE-SECURITY-REVISION-<commit>.json`**: the revision stamp, recording which commit was scanned, at what effort, whether uncommitted changes were part of the scanned tree, and how thoroughly the run was verified, so a report is…"
- `clm_6dfe4cd8cabb` — "Extended thinking is the reasoning Claude emits before responding, and on models with adaptive reasoning the effort level is the primary control over how much of it happens — the thinking settings only turn it on or off and control its display." · p 0.93 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "Extended thinking is the reasoning Claude emits before responding. On models that support [adaptive reasoning](#adjust-effort-level), the effort level is the primary control for how much thinking happens;"
- `clm_176a1b0b4554` — "On Claude Opus 5 low and medium effort produce strong quality at a fraction of the tokens and latency of higher settings, so they serve as the primary control for token cost and response time wherever quality holds, with xhigh reserved for demanding coding and agentic work" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "use `low` and `medium` liberally as your primary control for token cost and response time wherever quality holds, and step up to `xhigh` for demanding coding and agentic work"
- `clm_5bae95a20dd2` — "At low effort Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool and more likely to answer from memory, fixed either by raising effort for the affected turns or by prompting it to verify unfamiliar names before answering." · p 0.93 · active · 1 support · 0 contradict · when: at low effort
  - `src_9f2ae1e705ce` Delivering work: "At `low` effort, Claude Fable 5.1 is less likely than Claude Fable 5 to call a search or retrieval tool, and more likely to answer from memory."
- `clm_8479874ac5ba` — "On Claude Fable 5 effort is the primary control for the intelligence, latency, and cost trade-off: high is the default for most tasks, xhigh for the most capability-sensitive workloads, medium or low for routine work — and its lower effort settings often exceed xhigh performance on prior models" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "Use `high` as the default for most tasks, with `xhigh` for the most capability-sensitive workloads and `medium` or `low` for routine work."
- `clm_8b4e7965fc9f` — "Claude Fable 5.1's gains over Claude Fable 5 appear across effort levels and are largest at the higher settings: at medium it roughly matches Claude Fable 5 at lower cost, and at low it is often competitive with Claude Opus and Claude Sonnet models on cost per task while scoring higher." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Claude Fable 5.1's capability gains over Claude Fable 5 show up across effort levels and are largest at the higher settings."
- `clm_a59ebad0a4be` — "Effort level names do not correspond to the same amount of thinking across models, so an effort sweep must be re-run on each new model rather than carried over." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Re-run the sweep even if you already ran one on Claude Fable 5: effort level names don't correspond to the same amount of thinking across models."
- `clm_d14e11fac1d7` — "Claude Opus 5's default user-facing responses run longer than prior Opus models, and because effort controls how much the model thinks rather than how much it says, lowering effort does not reliably shorten the visible response — response length has to be prompted for explicitly" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly."
- `clm_e24b51402fe1` — "Which effort levels exist depends on the model, and asking for a level the active model does not support runs it at the highest supported level at or below the one requested." · p 0.93 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "If you set a level the active model does not support, Claude Code falls back to the highest supported level at or below the one you set. For example, `xhigh` runs as `high` on Opus 4.6."
- `clm_f9352cf8d901` — "As a rough cross-model mapping when migrating, Claude Sonnet 5 at medium is comparable in intelligence to Claude Sonnet 4.6 at high and Sonnet 5 at high to Sonnet 4.6 at max, and benchmarking should match by observed thinking length rather than by effort name" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "As a rough cross-model mapping when migrating: Claude Sonnet 5 at medium is comparable in intelligence to Claude Sonnet 4.6 at high, and Claude Sonnet 5 at high is comparable to Claude Sonnet 4.6 at max."
- `clm_b912dae9bece` — "At xhigh and especially max effort Claude Fable 5.1 can think for longer before writing, drafting much of a long deliverable in its thinking and then writing it out again as the reply, so requests for long deliverables are better run at high unless a quality gain has been measured." · p 0.92 · active · 1 support · 0 contradict · when: at xhigh and max effort
  - `src_9f2ae1e705ce` Delivering work: "At `xhigh` and especially `max` effort, Claude Fable 5.1 can think for longer before it starts writing its reply."
- `clm_3cc279b5026f` — "The axis to raise is picked by the failure: if Claude had adequate context and still got it wrong the answer is a more capable model, and if it skipped steps or abandoned the task prematurely the answer is more effort" · p 0.82 · active · 1 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "If Claude has adequate context and still fails, a more capable model is needed. If it skipped steps or abandoned tasks prematurely, increase effort level."
- `clm_d6ec10ffd6b5` — "Effort determines how far Claude will travel along its capability curve, not how far it must travel to complete the task, so effort cannot substitute for a model that lacks the capability" · p 0.80 · active · 1 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "Effort determines how far Claude **will travel** along capability curves, not how far it **must travel** to complete tasks."
- `clm_f78e75dbfc4a` — "Per-token costs increase with larger models but total per-task costs may decrease on genuinely difficult tasks, because a smaller model grinding at its capability limit cannot succeed regardless of effort" · p 0.80 · active · 1 support · 0 contradict · when: on harder multi-step work
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "Per-token costs increase with larger models, but total per-task costs may decrease on genuinely difficult tasks where smaller models cannot succeed regardless of effort."

## Timeline

- 2026-08-23 new_claim `clm_d14e11fac1d7` (src_26d415487f93)
- 2026-08-23 new_claim `clm_176a1b0b4554` (src_26d415487f93)
- 2026-08-23 new_claim `clm_8479874ac5ba` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_f9352cf8d901` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_3a056b12fdae` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_3cc279b5026f` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_2361143345d6` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_f78e75dbfc4a` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_d6ec10ffd6b5` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_e24b51402fe1` (src_a959e4684753)
- 2026-08-23 support_update `clm_3a056b12fdae` (src_a959e4684753)
- 2026-08-23 support_update `clm_2361143345d6` (src_a959e4684753)
- 2026-08-23 new_claim `clm_6dfe4cd8cabb` (src_a959e4684753)
- 2026-08-30 new_claim `clm_276d872e5414` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_639cfed3cd72` (src_1d5f4c9615f1)
- 2026-09-02 new_claim `clm_8b4e7965fc9f` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_a59ebad0a4be` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_5bae95a20dd2` (src_9f2ae1e705ce)
- 2026-09-02 new_claim `clm_b912dae9bece` (src_9f2ae1e705ce)

## Related

- ← uses [[claude-fable-5-1]] (1.00)
- ← uses [[claude-opus-5]] (0.99)
- ← related_to [[model-selection]] (0.95)
- ← uses [[claude-code]] (0.94)
- ← depends_on extended thinking (no page yet) (0.93)
- → part_of [[claude-code]] (0.93)
- ← produces [[claude-security-plugin]] (0.93)
- → applies_to [[model-selection]] (0.93)
- → depends_on [[claude-code]] (0.93)
- ← depends_on [[model-selection]] (0.93)
- ← uses [[claude-fable-5]] (0.93)
- ← uses [[claude-sonnet-5]] (0.93)
- [[claude-code]] — 4 shared claims
- [[model-selection]] — 4 shared claims
- [[claude-fable-5-1]] — 3 shared claims
- [[claude-opus-5]] — 2 shared claims
- [[claude-fable-5]] — 1 shared claim
- [[claude-security-plugin]] — 1 shared claim
- [[claude-sonnet-5]] — 1 shared claim
- extended thinking (no page yet)
