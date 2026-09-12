---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_model_alias]
claim_ids: [clm_199a3ad4af87, clm_9094953b81df, clm_a6e2e30ec7ba, clm_14f5761c068a]
confidence: 0.92
stale_after: 2027-01-10
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# model alias

> **In here:** The model version that the `opus` and `sonnet` aliases resolve to is not fixed — it depends on which provider Claude Code is talking to · 4 claims, confidence 0.92.

## Current understanding

- A Claude Code model alias points at the recommended model version for your provider and moves as that recommendation changes, so pinning a version means naming the full model name or setting the matching environment variable (0.93)
- The model version that the `opus` and `sonnet` aliases resolve to is not fixed — it depends on which provider Claude Code is talking to (0.93)
- Without pinned model IDs, Claude Code's aliases resolve to a built-in default per third-party provider that can lag the newest Anthropic release or point at a model the user's account has not enabled (0.93)
- Where an account supports 1M context the option shows up in the `/model` picker, and the window can also be requested by appending a `[1m]` suffix to a model alias or a full model name (0.90)

## Evidence

- `clm_199a3ad4af87` — "A Claude Code model alias points at the recommended model version for your provider and moves as that recommendation changes, so pinning a version means naming the full model name or setting the matching environment variable." · p 0.93 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "Aliases point to the recommended version for your provider and update over time."
- `clm_9094953b81df` — "The model version that the `opus` and `sonnet` aliases resolve to is not fixed — it depends on which provider Claude Code is talking to." · p 0.93 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "The version that the `opus` and `sonnet` aliases resolve to depends on the provider:"
- `clm_a6e2e30ec7ba` — "Without pinned model IDs, Claude Code's aliases resolve to a built-in default per third-party provider that can lag the newest Anthropic release or point at a model the user's account has not enabled." · p 0.93 · active · 1 support · 0 contradict · when: on Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry, and Claude Platform on AWS
  - `src_a959e4684753` Model configuration: "Without pinning, Claude Code uses model aliases such as `fable`, `opus`, `sonnet`, and `haiku` that resolve to a built-in default model ID for each provider."
- `clm_14f5761c068a` — "Where an account supports 1M context the option shows up in the `/model` picker, and the window can also be requested by appending a `[1m]` suffix to a model alias or a full model name." · p 0.90 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "If your account supports 1M context, the option appears in the `/model` picker in the latest versions of Claude Code. If you don't see it, try restarting your session."

## Timeline

- 2026-08-23 new_claim `clm_199a3ad4af87` (src_a959e4684753)
- 2026-08-23 new_claim `clm_9094953b81df` (src_a959e4684753)
- 2026-08-23 new_claim `clm_14f5761c068a` (src_a959e4684753)
- 2026-08-23 new_claim `clm_a6e2e30ec7ba` (src_a959e4684753)

## Related

- → part_of [[claude-code]] (0.93)
- → depends_on [[claude-code]] (0.93)
- → produces [[context-window]] (0.92)
- [[claude-code]] — 4 shared claims
- [[context-window]] — 1 shared claim
- [[model-selection]] — 1 shared claim
- Amazon Bedrock (no page yet)
