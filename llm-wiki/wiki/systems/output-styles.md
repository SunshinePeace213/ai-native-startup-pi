---
type: system
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md, title: "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents", id: src_93a1e6058bf1}
  - {resource: llm-wiki/raw/docs/claude-code/cli-reference.md, title: "CLI reference", id: src_716248fd9713}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_output_styles]
claim_ids: [clm_66dbb26cde8a, clm_b19037b381c9]
confidence: 0.87
stale_after: 2028-03-22
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# output styles

> **In here:** A custom output style replaces rather than extends the default system prompt, dropping Claude Code's software-engineering instructions on scoping, comments, security, and verification unless… · 2 claims, confidence 0.87.

## Current understanding

- The system-prompt flags apply only to the invocation that passes them; a persona meant to persist and be shared across a project belongs in an output style, and conventions Claude should always follow belong in CLAUDE.md (0.93)
- A custom output style replaces rather than extends the default system prompt, dropping Claude Code's software-engineering instructions on scoping, comments, security, and verification unless keep-coding-instructions is set — which is why append-system-prompt, being purely additive, is the safer lever (0.81)

## Evidence

- `clm_66dbb26cde8a` — "The system-prompt flags apply only to the invocation that passes them; a persona meant to persist and be shared across a project belongs in an output style, and conventions Claude should always follow belong in CLAUDE.md." · p 0.93 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "These flags apply only to the current invocation. For persistent personas you can switch between and share across a project, use [output styles](/docs/en/output-styles)."
- `clm_b19037b381c9` — "A custom output style replaces rather than extends the default system prompt, dropping Claude Code's software-engineering instructions on scoping, comments, security, and verification unless keep-coding-instructions is set — which is why append-system-prompt, being purely additive, is the safer lever" · p 0.81 · active · 1 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "By default, a custom output style drops all of this and Claude Code becomes more of a general assistant than a software engineer assistant."

## Timeline

- 2026-08-23 new_claim `clm_b19037b381c9` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_66dbb26cde8a` (src_716248fd9713)

## Related

- → related_to [[system-prompt]] (0.93)
- → applies_to [[claude-code]] (0.81)
- [[claude-code]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[system-prompt]] — 1 shared claim
