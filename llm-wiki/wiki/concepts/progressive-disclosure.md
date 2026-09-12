---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/articles/anthropic/the-new-rules-of-context-engineering-for-claude-5-generation-models.md, title: "the-new-rules-of-context-engineering-for-claude-5-generation-models", id: src_8419bce2e672}
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
  - {resource: llm-wiki/raw/docs/agent-skills/best-practices.md, title: "Best practices for skill creators", id: src_58c8a3f32b3f}
  - {resource: llm-wiki/raw/docs/agent-skills/home.md, title: "Agent Skills Overview", id: src_9b4d3b3d8635}
  - {resource: llm-wiki/raw/docs/agent-skills/optimizing-descriptions.md, title: "Optimizing skill descriptions", id: src_2435d7ebda83}
  - {resource: llm-wiki/raw/docs/agent-skills/specification.md, title: "Specification", id: src_7bd75101edfa}
  - {resource: llm-wiki/raw/docs/claude-code/large-codebases.md, title: "Set up Claude Code in a monorepo or large codebase", id: src_5ed7c226af31}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/pi/skills.md, title: "Skills", id: src_51c275d28919}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_progressive_disclosure]
claim_ids: [clm_6ef07a9ab4ea, clm_90a71be135d8, clm_b7ca365c6ed5, clm_f0cf5ae8be32, clm_06eb634db8d8, clm_728bbd954425, clm_b61710bffc40, clm_95ec0eafe6c7, clm_c9c5dd5b8063, clm_ed5c2d07922a, clm_1a53bb98ed3b]
confidence: 0.91
stale_after: 2028-06-22
last_rendered: 2026-09-11T19:57:10Z
review_required: false
---

# progressive disclosure

> **In here:** Progressive disclosure replaced loading everything upfront: verification and code review moved into skills Claude Code calls selectively, and deferred-loading tools cost no context until the agent… · 11 claims, confidence 0.91.

## Current understanding

- A skill's body loads only when the skill is used, unlike CLAUDE.md content, so long reference material costs almost nothing until it is needed (0.99)
- Agents load skills through progressive disclosure in three stages: discovery loads only each skill's name and description at startup, activation reads the full SKILL.md when a task matches the description, and execution follows the instructions and optionally loads bundled code or referenced files (0.99)
- Any subdirectory can define skills scoped to its own stack, and because a skill loads only when Claude judges it relevant, one area's tooling consumes no context during another area's work (0.93)
- Because full instructions load only when a task calls for them, agents can keep many skills on hand at only a small context footprint (0.93)
- The specification recommends keeping the main SKILL.md under 500 lines and moving detailed reference material to separate files, because the agent loads the entire file once it decides to activate a skill (0.92)
- Reference files should stay focused and be referenced by relative paths kept one level deep from SKILL.md, avoiding deeply nested reference chains, since agents load them on demand and smaller files use less context (0.91)
- The description carries the entire burden of triggering: an under-specified one means the skill will not fire when it should, an over-broad one means it fires when it should not, and if it does not convey when the skill is useful the agent will not reach for it (0.89)
- When a skill splits content into reference files, the load-bearing part is telling the agent when to load each one — a conditional instruction beats a generic pointer, which is how progressive disclosure is designed to work (0.88)
- Skill instructions are durable behavioral guidance, so a client that truncates or summarizes older messages must exempt skill content from pruning — losing it mid-conversation silently degrades the agent with no visible error (0.87)
- Every skills-compatible agent follows the same three-tier loading strategy: a catalog of name plus description at roughly 50-100 tokens per skill at session start, the full SKILL.md body under a recommended 5000 tokens on activation, and bundled resources only when the instructions reference them (0.87)
- Progressive disclosure replaced loading everything upfront: verification and code review moved into skills Claude Code calls selectively, and deferred-loading tools cost no context until the agent searches for their definitions (0.83)

## Evidence

- `clm_6ef07a9ab4ea` — "A skill's body loads only when the skill is used, unlike CLAUDE.md content, so long reference material costs almost nothing until it is needed." · p 0.99 · active · 2 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "Unlike CLAUDE.md content, a skill's body loads only when it's used, so long reference material costs almost nothing until you need it."
  - `src_07950e24c4ee` Extend Claude with skills: "Skills can include multiple files in their directory. This keeps `SKILL.md` focused on the essentials while letting Claude access detailed reference material only when needed."
- `clm_90a71be135d8` — "Agents load skills through progressive disclosure in three stages: discovery loads only each skill's name and description at startup, activation reads the full SKILL.md when a task matches the description, and execution follows the instructions and optionally loads bundled code or referenced files." · p 0.99 · active · 2 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "1. **Discovery**: At startup, agents load only the name and description of each available skill, just enough to know when it might be relevant."
  - `src_51c275d28919` Skills: "This is progressive disclosure: only descriptions are always in context, full instructions load on-demand."
- `clm_b7ca365c6ed5` — "Any subdirectory can define skills scoped to its own stack, and because a skill loads only when Claude judges it relevant, one area's tooling consumes no context during another area's work." · p 0.93 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "Any subdirectory can define [skills](/docs/en/skills) scoped to its own stack. A skill loads on demand when Claude determines it's relevant, so API-specific tooling doesn't consume context during frontend work."
- `clm_f0cf5ae8be32` — "Because full instructions load only when a task calls for them, agents can keep many skills on hand at only a small context footprint." · p 0.93 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "Full instructions load only when a task calls for them, so agents can keep many skills on hand with only a small context footprint."
- `clm_06eb634db8d8` — "The specification recommends keeping the main SKILL.md under 500 lines and moving detailed reference material to separate files, because the agent loads the entire file once it decides to activate a skill." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Keep your main `SKILL.md` under 500 lines. Move detailed reference material to separate files."
- `clm_728bbd954425` — "Reference files should stay focused and be referenced by relative paths kept one level deep from SKILL.md, avoiding deeply nested reference chains, since agents load them on demand and smaller files use less context." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains."
- `clm_b61710bffc40` — "The description carries the entire burden of triggering: an under-specified one means the skill will not fire when it should, an over-broad one means it fires when it should not, and if it does not convey when the skill is useful the agent will not reach for it." · p 0.89 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "This means the description carries the entire burden of triggering. If the description doesn't convey when the skill is useful, the agent won't know to reach for it."
- `clm_95ec0eafe6c7` — "When a skill splits content into reference files, the load-bearing part is telling the agent when to load each one — a conditional instruction beats a generic pointer, which is how progressive disclosure is designed to work." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "The key is telling the agent *when* to load each file."
- `clm_c9c5dd5b8063` — "Skill instructions are durable behavioral guidance, so a client that truncates or summarizes older messages must exempt skill content from pruning — losing it mid-conversation silently degrades the agent with no visible error." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "If your agent truncates or summarizes older messages when the context window fills up, **exempt skill content from pruning**. Skill instructions are durable behavioral guidance"
- `clm_ed5c2d07922a` — "Every skills-compatible agent follows the same three-tier loading strategy: a catalog of name plus description at roughly 50-100 tokens per skill at session start, the full SKILL.md body under a recommended 5000 tokens on activation, and bundled resources only when the instructions reference them." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Every skills-compatible agent follows the same three-tier loading strategy:"
- `clm_1a53bb98ed3b` — "Progressive disclosure replaced loading everything upfront: verification and code review moved into skills Claude Code calls selectively, and deferred-loading tools cost no context until the agent searches for their definitions" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "For example, we moved verification and code review into their own skills that Claude Code could selectively call."

## Timeline

- 2026-08-23 new_claim `clm_1a53bb98ed3b` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_6ef07a9ab4ea` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_6ef07a9ab4ea` (src_07950e24c4ee)
- 2026-08-23 new_claim `clm_b7ca365c6ed5` (src_5ed7c226af31)
- 2026-08-25 new_claim `clm_90a71be135d8` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_f0cf5ae8be32` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_06eb634db8d8` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_728bbd954425` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_95ec0eafe6c7` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_b61710bffc40` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_ed5c2d07922a` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_c9c5dd5b8063` (src_6932f817f8b4)
- 2026-09-11 support_update `clm_90a71be135d8` (src_51c275d28919)

## Related

- ← uses [[skills]] (1.00)
- ← uses [[skill-md]] (1.00)
- → applies_to [[skills]] (0.93)
- → uses [[skill-description]] (0.92)
- ← uses [[pi]] (0.92)
- ← part_of [[skill-description]] (0.89)
- ← part_of [[skill-catalog]] (0.87)
- → uses [[skill-md]] (0.87)
- [[skills]] — 6 shared claims
- [[skill-md]] — 5 shared claims
- [[skill-description]] — 2 shared claims
- [[claude-code]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[skill-catalog]] — 1 shared claim
