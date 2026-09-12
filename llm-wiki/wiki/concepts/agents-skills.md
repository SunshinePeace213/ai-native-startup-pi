---
type: concept
status: current
created: 2026-08-25
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
  - {resource: llm-wiki/raw/docs/agent-skills/quickstart.md, title: "Quickstart", id: src_cc19a042a4fe}
  - {resource: llm-wiki/raw/docs/pi/skills.md, title: "Skills", id: src_51c275d28919}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_agents_skills]
claim_ids: [clm_c65d0e1b83ce, clm_9c33c6401aa4, clm_03e53c040278, clm_ddc824a97e41]
confidence: 0.88
stale_after: 2026-12-09
last_rendered: 2026-09-11T19:57:09Z
review_required: false
---

# .agents/skills

> **In here:** Clients look for skills in a default directory — VS Code uses .agents/skills/ — so creating .agents/skills/<name>/SKILL.md in a project is enough to make a skill discoverable · 4 claims, confidence 0.88.

## Current understanding

- In the shared .agents/skills directories Pi ignores root .md files but discovers nested .md files inside grouping folders whenever they declare skill frontmatter (0.92)
- The spec does not mandate where skill directories live — only what goes inside them — and .agents/skills/ has emerged as the widely-adopted convention, so scanning it makes skills installed by other compliant clients visible to yours and vice versa (0.87)
- The universal precedence convention across existing implementations is that project-level skills override user-level skills, with collisions inside one scope resolved consistently either first-found or last-found and logged as a warning (0.86)
- Clients look for skills in a default directory — VS Code uses .agents/skills/ — so creating .agents/skills/<name>/SKILL.md in a project is enough to make a skill discoverable (0.85)

## Evidence

- `clm_c65d0e1b83ce` — "In the shared .agents/skills directories Pi ignores root .md files but discovers nested .md files inside grouping folders whenever they declare skill frontmatter." · p 0.92 · active · 1 support · 0 contradict
  - `src_51c275d28919` Skills: "In `~/.agents/skills/` and project `.agents/skills/`, root `.md` files are ignored, but nested `.md` files in grouping folders are discovered when they declare skill frontmatter"
- `clm_9c33c6401aa4` — "The spec does not mandate where skill directories live — only what goes inside them — and .agents/skills/ has emerged as the widely-adopted convention, so scanning it makes skills installed by other compliant clients visible to yours and vice versa." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "The `.agents/skills/` paths have emerged as a widely-adopted convention for cross-client skill sharing."
- `clm_03e53c040278` — "The universal precedence convention across existing implementations is that project-level skills override user-level skills, with collisions inside one scope resolved consistently either first-found or last-found and logged as a warning." · p 0.86 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "The universal convention across existing implementations: **project-level skills override user-level skills.**"
- `clm_ddc824a97e41` — "Clients look for skills in a default directory — VS Code uses .agents/skills/ — so creating .agents/skills/<name>/SKILL.md in a project is enough to make a skill discoverable." · p 0.85 · active · 1 support · 0 contradict
  - `src_cc19a042a4fe` Quickstart: "A skill is a folder containing a `SKILL.md` file. VS Code looks for skills in `.agents/skills/` by default."

## Timeline

- 2026-08-25 new_claim `clm_ddc824a97e41` (src_cc19a042a4fe)
- 2026-08-25 new_claim `clm_9c33c6401aa4` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_03e53c040278` (src_6932f817f8b4)
- 2026-09-11 new_claim `clm_c65d0e1b83ce` (src_51c275d28919)

## Related

- ← uses [[pi]] (0.92)
- → extends [[agent-skills]] (0.87)
- → part_of [[skill-md]] (0.87)
- ← uses [[skills]] (0.86)
- [[skills]] — 2 shared claims
- [[agent-skills]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[skill-md]] — 1 shared claim
