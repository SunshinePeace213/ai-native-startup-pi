---
type: system
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-sonnet-5.md, title: "prompting-claude-sonnet-5", id: src_b6f0e67933fe}
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_claude_sonnet_5]
claim_ids: [clm_28b78f890b6a, clm_9bbf4fdf212d, clm_de1a8212cb6f, clm_03b217447be4, clm_be249df2601f, clm_f9352cf8d901, clm_199eade5a5f7, clm_a3157a371635]
confidence: 0.92
stale_after: 2029-06-19
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# Claude Sonnet 5

> **In here:** Claude Sonnet 5 uses a new tokenizer that produces approximately 30% more tokens for the same text, so max_tokens limits tuned for Claude Sonnet 4.6 may truncate equivalent output · 8 claims, confidence 0.92.

## Current understanding

- Claude Sonnet 5 uses a new tokenizer that produces approximately 30% more tokens for the same text, so max_tokens limits tuned for Claude Sonnet 4.6 may truncate equivalent output (0.93)
- Claude Sonnet 5 interprets prompts literally and explicitly, particularly at lower effort: it does not silently generalize an instruction from one item to another and does not infer requests that were not made, so an instruction meant to apply broadly must state its scope (0.93)
- Setting temperature, top_p, or top_k to a non-default value returns a 400 error on Claude Sonnet 5 — a constraint new for Sonnet-class models — so tone and stylistic variety have to come from system-prompt instructions instead (0.93)
- Lower measured recall from a code-review harness tuned for an earlier model is a harness effect rather than a capability regression: the model investigates just as deeply but converts fewer investigations into reported findings, so precision rises while recall falls (0.93)
- Adaptive thinking is on by default on Claude Sonnet 5, a change from Sonnet 4.6 where the same requests ran without thinking, and manual extended thinking is removed and returns a 400 error (0.93)
- As a rough cross-model mapping when migrating, Claude Sonnet 5 at medium is comparable in intelligence to Claude Sonnet 4.6 at high and Sonnet 5 at high to Sonnet 4.6 at max, and benchmarking should match by observed thinking length rather than by effort name (0.93)
- A 1 million token context window is supported by Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6, and on the Anthropic API Fable 5, Sonnet 5, and Opus 4.7 and later always run with it (0.93)
- Claude Sonnet 5 may settle into a consistent default visual style on open-ended frontend and design briefs, and the two approaches that reliably break it are specifying a concrete alternative or having the model propose distinct directions before building (0.91)

## Evidence

- `clm_28b78f890b6a` — "Claude Sonnet 5 uses a new tokenizer that produces approximately 30% more tokens for the same text, so max_tokens limits tuned for Claude Sonnet 4.6 may truncate equivalent output" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "that produces approximately 30% more tokens for the same text, `max_tokens` limits tuned for Claude Sonnet 4.6 may truncate equivalent output"
- `clm_9bbf4fdf212d` — "Claude Sonnet 5 interprets prompts literally and explicitly, particularly at lower effort: it does not silently generalize an instruction from one item to another and does not infer requests that were not made, so an instruction meant to apply broadly must state its scope" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "Claude Sonnet 5 interprets prompts literally and explicitly, particularly at lower effort levels. It does not silently generalize an instruction from one item to another, and it does not infer requests you didn't make."
- `clm_de1a8212cb6f` — "Setting temperature, top_p, or top_k to a non-default value returns a 400 error on Claude Sonnet 5 — a constraint new for Sonnet-class models — so tone and stylistic variety have to come from system-prompt instructions instead" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "note that setting `temperature`, `top_p`, or `top_k` to a non-default value returns a 400 error on Claude Sonnet 5. This constraint is new for Sonnet-class models."
- `clm_03b217447be4` — "Lower measured recall from a code-review harness tuned for an earlier model is a harness effect rather than a capability regression: the model investigates just as deeply but converts fewer investigations into reported findings, so precision rises while recall falls" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "This can show up as the model doing the same depth of investigation but converting fewer investigations into reported findings, especially on lower-severity bugs."
- `clm_be249df2601f` — "Adaptive thinking is on by default on Claude Sonnet 5, a change from Sonnet 4.6 where the same requests ran without thinking, and manual extended thinking is removed and returns a 400 error" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "is not supported on Claude Sonnet 5 and returns a 400 error. It was deprecated on Claude Sonnet 4.6 and is now removed."
- `clm_f9352cf8d901` — "As a rough cross-model mapping when migrating, Claude Sonnet 5 at medium is comparable in intelligence to Claude Sonnet 4.6 at high and Sonnet 5 at high to Sonnet 4.6 at max, and benchmarking should match by observed thinking length rather than by effort name" · p 0.93 · active · 1 support · 0 contradict
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "As a rough cross-model mapping when migrating: Claude Sonnet 5 at medium is comparable in intelligence to Claude Sonnet 4.6 at high, and Claude Sonnet 5 at high is comparable to Claude Sonnet 4.6 at max."
- `clm_199eade5a5f7` — "A 1 million token context window is supported by Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6, and on the Anthropic API Fable 5, Sonnet 5, and Opus 4.7 and later always run with it." · p 0.93 · active · 1 support · 0 contradict · when: on the Anthropic API for the always-on case
  - `src_a959e4684753` Model configuration: "Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6 support a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#context-window-sizes-by-model) for long sessions with large codebases."
- `clm_a3157a371635` — "Claude Sonnet 5 may settle into a consistent default visual style on open-ended frontend and design briefs, and the two approaches that reliably break it are specifying a concrete alternative or having the model propose distinct directions before building" · p 0.91 · active · 1 support · 0 contradict · when: on open-ended frontend and design briefs
  - `src_b6f0e67933fe` prompting-claude-sonnet-5: "Claude Sonnet 5 may settle into a consistent default visual style on open-ended frontend and design briefs."

## Timeline

- 2026-08-23 new_claim `clm_9bbf4fdf212d` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_f9352cf8d901` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_28b78f890b6a` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_03b217447be4` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_de1a8212cb6f` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_a3157a371635` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_be249df2601f` (src_b6f0e67933fe)
- 2026-08-23 new_claim `clm_199eade5a5f7` (src_a959e4684753)

## Related

- ← applies_to [[code-review]] (0.93)
- → uses [[adaptive-thinking]] (0.93)
- → uses [[effort-level]] (0.93)
- [[adaptive-thinking]] — 1 shared claim
- [[claude-fable-5]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[effort-level]] — 1 shared claim
