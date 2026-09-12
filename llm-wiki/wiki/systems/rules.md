---
type: system
status: current
created: 2026-08-23
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md, title: "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents", id: src_93a1e6058bf1}
  - {resource: llm-wiki/raw/docs/claude-code/memory.md, title: "How Claude remembers your project", id: src_e698013f1182}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_rules]
claim_ids: [clm_f964c916a3ac, clm_8be3bd552948, clm_bd0cc70821d9]
confidence: 0.96
stale_after: 2029-10-26
last_rendered: 2026-08-30T13:51:43Z
review_required: false
---

# rules

> **In here:** An unscoped rule is mechanically identical to putting the content in CLAUDE.md — always loaded, always costing tokens · 3 claims, confidence 0.96.

## Current understanding

- Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code — pushing team-specific conventions into path-scoped rules and procedures into skills as it grows (0.98)
- An unscoped rule is mechanically identical to putting the content in CLAUDE.md — always loaded, always costing tokens — so a rule that applies to one part of the tree earns its keep only through a paths field that keeps it out of context during unrelated work (0.98)
- Rules load into context every session or whenever a matching file is opened, while skills load only when invoked or judged relevant, which makes skills the fit for task-specific instructions that need not always be in context (0.93)

## Evidence

- `clm_f964c916a3ac` — "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code — pushing team-specific conventions into path-scoped rules and procedures into skills as it grows" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code."
  - `src_e698013f1182` How Claude remembers your project: "**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."
- `clm_8be3bd552948` — "An unscoped rule is mechanically identical to putting the content in CLAUDE.md — always loaded, always costing tokens — so a rule that applies to one part of the tree earns its keep only through a paths field that keeps it out of context during unrelated work" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "An unscoped rule is mechanically identical to putting the content in CLAUDE.md: always loaded, always costing tokens."
  - `src_e698013f1182` How Claude remembers your project: "Rules without [`paths` frontmatter](#path-specific-rules) are loaded at launch with the same priority as `.claude/CLAUDE.md`."
- `clm_bd0cc70821d9` — "Rules load into context every session or whenever a matching file is opened, while skills load only when invoked or judged relevant, which makes skills the fit for task-specific instructions that need not always be in context." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "Rules load into context every session or when matching files are opened."

## Timeline

- 2026-08-23 new_claim `clm_f964c916a3ac` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_8be3bd552948` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_bd0cc70821d9` (src_e698013f1182)
- 2026-08-23 support_update `clm_f964c916a3ac` (src_e698013f1182)
- 2026-08-23 support_update `clm_8be3bd552948` (src_e698013f1182)

## Related

- ← related_to [[schema-layer]] (0.81)
- → related_to [[schema-layer]] (0.81)
- [[context-window]] — 2 shared claims
- [[schema-layer]] — 2 shared claims
- [[skills]] — 1 shared claim
