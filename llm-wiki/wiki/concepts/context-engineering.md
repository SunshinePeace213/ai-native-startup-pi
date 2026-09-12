---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-field-guide-to-claude-fable-finding-your-unknowns.md, title: "A field guide to Claude Fable 5: Finding your unknowns", id: src_10f512f5f8de}
  - {resource: llm-wiki/raw/articles/anthropic/the-new-rules-of-context-engineering-for-claude-5-generation-models.md, title: "the-new-rules-of-context-engineering-for-claude-5-generation-models", id: src_8419bce2e672}
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/docs/claude-code/hooks.md, title: "Hooks reference", id: src_af0a3c9de51d}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_context_engineering]
claim_ids: [clm_fcd14cd753ef, clm_9141bd4b9ef6, clm_eb22268647a0, clm_fb9c93bd8a79, clm_059a28935b6c, clm_188fe3aabeee, clm_a53d87e1c13c, clm_67bf5b559bfc, clm_3ff082dbe3a3, clm_5cee05d79c41]
confidence: 0.84
stale_after: 2028-02-01
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# context engineering

> **In here:** A reference no longer has to be a simple markdown spec: Claude handles richer forms including HTML artifacts, code, a detailed test suite, a function in another codebase to port, and rubrics that… · 10 claims, confidence 0.84.

## Current understanding

- Context injected by a hook should be phrased as factual statements, because text framed as out-of-band system instructions can trip Claude's prompt-injection defenses and get surfaced to the user instead of read as context (0.93)
- References that are files in code are preferred because they give clear, high-fidelity instructions in a language the model knows well — an HTML mockup of a design generally produces better results than a description of it or a screenshot (0.83)
- Rules written as guardrails for older models can now be deleted, because newer models have better judgement and handle those decisions well without explicit rules — guidance that was once a necessary tradeoff is wrong for a subset of prompts (0.83)
- Giving the newest models examples of tool usage constrains them to a certain exploration space, so the lever moved from examples to interface design — what parameters a tool exposes and how expressive they are (0.83)
- Anthropic removed over 80% of Claude Code's system prompt for models like Claude Opus 5 and Claude Fable 5 with no measurable loss on its coding evaluations (0.83)
- Overconstraining produces conflicting messages inside a single request as system prompt, skills, and user request clash, and while Claude can still interpret the intent it must think more carefully about the overlapping instructions before deciding what to do (0.83)
- A CLAUDE.md should stay lightweight — a brief description of what the repo is for with most of its tokens spent on gotchas inside the codebase, and nothing stating the obvious that Claude could learn by reading the file system (0.83)
- The best reference when you cannot describe what you want is source code: pointing Fable at a folder that already implements the behavior gives much richer detail around markup and structure than a screenshot, even when the reference is in a different language (0.82)
- A reference no longer has to be a simple markdown spec: Claude handles richer forms including HTML artifacts, code, a detailed test suite, a function in another codebase to port, and rubrics that verifier agents check taste against (0.81)
- An agent is only as good as the context provided to the model, so the job of a harness is to provide that context at every step (0.80)

## Evidence

- `clm_fcd14cd753ef` — "Context injected by a hook should be phrased as factual statements, because text framed as out-of-band system instructions can trip Claude's prompt-injection defenses and get surfaced to the user instead of read as context." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Write the text as factual statements rather than imperative system instructions. Phrasing such as "The deployment target is production" or "This repo uses `bun test`" reads as project information."
- `clm_9141bd4b9ef6` — "References that are files in code are preferred because they give clear, high-fidelity instructions in a language the model knows well — an HTML mockup of a design generally produces better results than a description of it or a screenshot" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "For example, a HTML mockup of a design will generally produce better results than a description of the design or a screenshot."
- `clm_eb22268647a0` — "Rules written as guardrails for older models can now be deleted, because newer models have better judgement and handle those decisions well without explicit rules — guidance that was once a necessary tradeoff is wrong for a subset of prompts" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "But newer models have better judgement and can handle these decisions well without explicit rules."
- `clm_fb9c93bd8a79` — "Giving the newest models examples of tool usage constrains them to a certain exploration space, so the lever moved from examples to interface design — what parameters a tool exposes and how expressive they are" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "Instead of using examples, think more about the design of your tools, scripts and files- what parameters does Claude have and how can they be more expressive?"
- `clm_059a28935b6c` — "Anthropic removed over 80% of Claude Code's system prompt for models like Claude Opus 5 and Claude Fable 5 with no measurable loss on its coding evaluations" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "We removed over 80% of Claude Code's system prompt for models like Claude Opus 5 and Claude Fable 5 with no measurable loss on our coding evaluations."
- `clm_188fe3aabeee` — "Overconstraining produces conflicting messages inside a single request as system prompt, skills, and user request clash, and while Claude can still interpret the intent it must think more carefully about the overlapping instructions before deciding what to do" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "Generally, Claude can interpret the user's intent to get to the right answer, but Claude must think more carefully about these overlapping and conflicting messages before deciding what to do."
- `clm_a53d87e1c13c` — "A CLAUDE.md should stay lightweight — a brief description of what the repo is for with most of its tokens spent on gotchas inside the codebase, and nothing stating the obvious that Claude could learn by reading the file system" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "Keep your CLAUDE.md lightweight and briefly describe what your repo is for, but spend most of the tokens on gotchas inside of the codebase."
- `clm_67bf5b559bfc` — "The best reference when you cannot describe what you want is source code: pointing Fable at a folder that already implements the behavior gives much richer detail around markup and structure than a screenshot, even when the reference is in a different language" · p 0.82 · active · 1 support · 0 contradict
  - `src_10f512f5f8de` A field guide to Claude Fable 5: Finding your unknowns: "While you can include diagrams, documentation or pictures, the absolute best reference is _source code_."
- `clm_3ff082dbe3a3` — "A reference no longer has to be a simple markdown spec: Claude handles richer forms including HTML artifacts, code, a detailed test suite, a function in another codebase to port, and rubrics that verifier agents check taste against" · p 0.81 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "You may also give Claude references in the form of code. A spec may also be a detailed test suite, or a function in a different codebase that Claude might port."
- `clm_5cee05d79c41` — "An agent is only as good as the context provided to the model, so the job of a harness is to provide that context at every step." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "1. An agent is only as good as the context provided to the model 2. The job of a harness is to provide context to the model at every step"

## Timeline

- 2026-08-23 new_claim `clm_059a28935b6c` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_eb22268647a0` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_188fe3aabeee` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_fb9c93bd8a79` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_a53d87e1c13c` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_3ff082dbe3a3` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_9141bd4b9ef6` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_67bf5b559bfc` (src_10f512f5f8de)
- 2026-08-23 new_claim `clm_5cee05d79c41` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_fcd14cd753ef` (src_af0a3c9de51d)

## Related

- → applies_to [[claude-code]] (0.83)
- → applies_to [[schema-layer]] (0.83)
- → applies_to [[skills]] (0.83)
- ← related_to [[unknowns]] (0.82)
- ← uses [[agent-harness]] (0.80)
- [[claude-code]] — 2 shared claims
- [[agent-harness]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[skills]] — 1 shared claim
- [[unknowns]] — 1 shared claim
