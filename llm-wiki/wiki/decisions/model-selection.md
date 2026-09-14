---
type: decision
status: current
created: 2026-08-23
updated: 2026-09-14
sources:
  - {resource: llm-wiki/raw/articles/anthropic/ai-code-migration.md, title: "How Anthropic runs large-scale code migrations with Claude Code", id: src_40c83dc51471}
  - {resource: llm-wiki/raw/articles/anthropic/claude-model-and-effort-level-in-claude-code.md, title: "Choosing a Claude model and effort level in Claude Code", id: src_fbabc2423960}
  - {resource: llm-wiki/raw/articles/artificial-analysis/omniscience.md, title: "AA-Omniscience: Knowledge and Hallucination Benchmark", id: src_c197533a04c8}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
generated: {by: process:llm-wiki-render, at: 2026-09-14}
entity_ids: [ent_model_selection]
claim_ids: [clm_2361143345d6, clm_199a3ad4af87, clm_a59ebad0a4be, clm_4c418d487b7e, clm_ad6abaac0af5, clm_c7fff347847f, clm_3cc279b5026f, clm_49f17b556c83, clm_796c94171245, clm_5c7656071869, clm_f78e75dbfc4a, clm_6134d99b8bc9]
confidence: 0.87
stale_after: 2027-01-17
last_rendered: 2026-09-14T19:58:10Z
review_required: false
---

# model selection

> **In here:** Running `/model` in Claude Code saves the chosen model as the default for new sessions by writing the `model` field in user settings, while pressing `s` in the picker switches for the current… · 12 claims, confidence 0.87.

## Current understanding

- Effort is best treated as a manual override scaling thoroughness or speed by domain or work type — a general preference rather than a task-by-task adjustment — with the model's default effort used for most tasks (0.98)
- A Claude Code model alias points at the recommended model version for your provider and moves as that recommendation changes, so pinning a version means naming the full model name or setting the matching environment variable (0.93)
- Effort level names do not correspond to the same amount of thinking across models, so an effort sweep must be re-run on each new model rather than carried over (0.93)
- Turning on fast mode can implicitly switch the session to an Opus model, so `/fast` refuses to toggle when that model falls outside the organization's allowed models (0.92)
- The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable sets the model for every subagent, agent team, and workflow agent, overriding both the per-invocation `model` parameter and a subagent definition's `model` frontmatter unless set to `inherit` (0.91)
- Running `/model` in Claude Code saves the chosen model as the default for new sessions by writing the `model` field in user settings, while pressing `s` in the picker switches for the current session only (0.91)
- The axis to raise is picked by the failure: if Claude had adequate context and still got it wrong the answer is a more capable model, and if it skipped steps or abandoned the task prematurely the answer is more effort (0.82)
- A model's weights are frozen after training and nothing in a prompt or context modifies them, so supplying documentation for a library the model never saw steers predictions for that request only and adds no permanent knowledge (0.82)
- AA-Omniscience performance varies by domain with models from three different labs leading across its six domains, so models should be chosen for the demands of the use case rather than by general performance where knowledge matters (0.81)
- The model tiers map onto three kinds of consultant — Fable as the specialist who has seen nearly unprecedented problems, Opus as the expert with deep experience of similar challenges, and Sonnet as the highly capable generalist (0.80)
- Per-token costs increase with larger models but total per-task costs may decrease on genuinely difficult tasks, because a smaller model grinding at its capability limit cannot succeed regardless of effort (0.80)
- A migration should not run the largest model for everything: the large model is reserved for reviewers and rule-writing while smaller models carry the high-volume implementation work (0.79)

## Evidence

- `clm_2361143345d6` — "Effort is best treated as a manual override scaling thoroughness or speed by domain or work type — a general preference rather than a task-by-task adjustment — with the model's default effort used for most tasks" · p 0.98 · active · 2 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "Think of effort as a manual override for scaling thoroughness or speed based on domain or work type—consider it a general preference rather than task-by-task adjustment."
  - `src_a959e4684753` Model configuration: "Each level trades token spend against capability. The default suits most coding tasks; adjust when you want a different balance."
- `clm_199a3ad4af87` — "A Claude Code model alias points at the recommended model version for your provider and moves as that recommendation changes, so pinning a version means naming the full model name or setting the matching environment variable." · p 0.93 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "Aliases point to the recommended version for your provider and update over time."
- `clm_a59ebad0a4be` — "Effort level names do not correspond to the same amount of thinking across models, so an effort sweep must be re-run on each new model rather than carried over." · p 0.93 · active · 1 support · 0 contradict
  - `src_9f2ae1e705ce` Delivering work: "Re-run the sweep even if you already ran one on Claude Fable 5: effort level names don't correspond to the same amount of thinking across models."
- `clm_4c418d487b7e` — "Turning on fast mode can implicitly switch the session to an Opus model, so `/fast` refuses to toggle when that model falls outside the organization's allowed models." · p 0.92 · active · 1 support · 0 contradict · when: when an availableModels allowlist is set in managed or policy settings
  - `src_a959e4684753` Model configuration: "`/fast` refuses to toggle when it would implicitly switch to an Opus model outside the list, with the message "is not in your organization's allowed models""
- `clm_ad6abaac0af5` — "The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable sets the model for every subagent, agent team, and workflow agent, overriding both the per-invocation `model` parameter and a subagent definition's `model` frontmatter unless set to `inherit`." · p 0.91 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "The model Claude Code uses for all [subagents](/docs/en/sub-agents#choose-a-model), [agent teams](/docs/en/agent-teams), and agents in a [workflow](/docs/en/workflows)."
- `clm_c7fff347847f` — "Running `/model` in Claude Code saves the chosen model as the default for new sessions by writing the `model` field in user settings, while pressing `s` in the picker switches for the current session only." · p 0.91 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "As of v2.1.153, `/model` saves your choice as the default for new sessions by writing the `model` field in your user settings. In the picker: * `Enter`: switch model and save as your default * `s`: switch model for this session only"
- `clm_3cc279b5026f` — "The axis to raise is picked by the failure: if Claude had adequate context and still got it wrong the answer is a more capable model, and if it skipped steps or abandoned the task prematurely the answer is more effort" · p 0.82 · active · 1 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "If Claude has adequate context and still fails, a more capable model is needed. If it skipped steps or abandoned tasks prematurely, increase effort level."
- `clm_49f17b556c83` — "A model's weights are frozen after training and nothing in a prompt or context modifies them, so supplying documentation for a library the model never saw steers predictions for that request only and adds no permanent knowledge" · p 0.82 · active · 1 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "These weights remain frozen after training; nothing in your prompt or context modifies them."
- `clm_796c94171245` — "AA-Omniscience performance varies by domain with models from three different labs leading across its six domains, so models should be chosen for the demands of the use case rather than by general performance where knowledge matters." · p 0.81 · active · 1 support · 0 contradict
  - `src_c197533a04c8` AA-Omniscience: Knowledge and Hallucination Benchmark: "Performance also varies by domain, with the models from three different research labs leading across the six domains."
- `clm_5c7656071869` — "The model tiers map onto three kinds of consultant — Fable as the specialist who has seen nearly unprecedented problems, Opus as the expert with deep experience of similar challenges, and Sonnet as the highly capable generalist" · p 0.80 · active · 1 support · 0 contradict
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "**Fable as specialist:** Has seen nearly unprecedented problems **Opus as expert:** Deep experience with similar challenges **Sonnet as generalist:** Highly capable across domains"
- `clm_f78e75dbfc4a` — "Per-token costs increase with larger models but total per-task costs may decrease on genuinely difficult tasks, because a smaller model grinding at its capability limit cannot succeed regardless of effort" · p 0.80 · active · 1 support · 0 contradict · when: on harder multi-step work
  - `src_fbabc2423960` Choosing a Claude model and effort level in Claude Code: "Per-token costs increase with larger models, but total per-task costs may decrease on genuinely difficult tasks where smaller models cannot succeed regardless of effort."
- `clm_6134d99b8bc9` — "A migration should not run the largest model for everything: the large model is reserved for reviewers and rule-writing while smaller models carry the high-volume implementation work" · p 0.79 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "Don't use the largest model for everything — reserve it for reviewers and rule-writing, and use smaller models for high-volume implementation."

## Timeline

- 2026-08-23 new_claim `clm_3cc279b5026f` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_49f17b556c83` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_5c7656071869` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_2361143345d6` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_f78e75dbfc4a` (src_fbabc2423960)
- 2026-08-23 new_claim `clm_6134d99b8bc9` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_199a3ad4af87` (src_a959e4684753)
- 2026-08-23 new_claim `clm_c7fff347847f` (src_a959e4684753)
- 2026-08-23 support_update `clm_2361143345d6` (src_a959e4684753)
- 2026-08-23 new_claim `clm_ad6abaac0af5` (src_a959e4684753)
- 2026-08-23 new_claim `clm_4c418d487b7e` (src_a959e4684753)
- 2026-09-02 new_claim `clm_a59ebad0a4be` (src_9f2ae1e705ce)
- 2026-09-14 new_claim `clm_796c94171245` (src_c197533a04c8)

## Related

- → related_to [[effort-level]] (0.95)
- → applies_to [[subagents]] (0.93)
- ← applies_to [[effort-level]] (0.93)
- → depends_on [[effort-level]] (0.93)
- → part_of [[claude-code]] (0.93)
- ← uses fast mode (no page yet) (0.92)
- → depends_on model weights (no page yet) (0.82)
- ← applies_to [[aa-omniscience]] (0.81)
- ← uses [[code-migration]] (0.79)
- [[claude-code]] — 4 shared claims
- [[effort-level]] — 4 shared claims
- [[aa-omniscience]] — 1 shared claim
- [[code-migration]] — 1 shared claim
- [[model-alias]] — 1 shared claim
- [[subagents]] — 1 shared claim
- fast mode (no page yet)
- model weights (no page yet)
