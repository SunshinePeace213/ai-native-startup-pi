---
type: concept
status: current
created: 2026-08-25
updated: 2026-08-25
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
generated: {by: process:llm-wiki-render, at: 2026-08-25}
entity_ids: [ent_skill_catalog]
claim_ids: [clm_7754773c8a2a, clm_ed5c2d07922a, clm_82f00f3d6803, clm_d64a3fb5380d]
confidence: 0.87
stale_after: 2028-11-26
last_rendered: 2026-08-25T13:05:21Z
review_required: false
---

# skill catalog

> **In here:** Skills the user disabled, that permissions deny, or that opted out of model-driven activation should be hidden from the catalog entirely rather than listed and blocked at activation, so the model… · 4 claims, confidence 0.87.

## Current understanding

- Most implementations rely on the model's own judgment as the activation mechanism rather than harness-side trigger matching or keyword detection, using either file-read activation or a dedicated activation tool (0.87)
- Every skills-compatible agent follows the same three-tier loading strategy: a catalog of name plus description at roughly 50-100 tokens per skill at session start, the full SKILL.md body under a recommended 5000 tokens on activation, and bundled resources only when the instructions reference them (0.87)
- A dedicated activation tool should constrain its name parameter to the set of valid skill names, which stops the model hallucinating nonexistent skills, and should not be registered at all when no skills are available (0.86)
- Skills the user disabled, that permissions deny, or that opted out of model-driven activation should be hidden from the catalog entirely rather than listed and blocked at activation, so the model does not waste turns trying to load them (0.86)

## Evidence

- `clm_7754773c8a2a` — "Most implementations rely on the model's own judgment as the activation mechanism rather than harness-side trigger matching or keyword detection, using either file-read activation or a dedicated activation tool." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Most implementations rely on the model's own judgment as the activation mechanism, rather than implementing harness-side trigger matching or keyword detection."
- `clm_ed5c2d07922a` — "Every skills-compatible agent follows the same three-tier loading strategy: a catalog of name plus description at roughly 50-100 tokens per skill at session start, the full SKILL.md body under a recommended 5000 tokens on activation, and bundled resources only when the instructions reference them." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Every skills-compatible agent follows the same three-tier loading strategy:"
- `clm_82f00f3d6803` — "A dedicated activation tool should constrain its name parameter to the set of valid skill names, which stops the model hallucinating nonexistent skills, and should not be registered at all when no skills are available." · p 0.86 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "If you use a dedicated activation tool, constrain the `name` parameter to the set of valid skill names (e.g., as an enum in the tool schema). This prevents the model from hallucinating nonexistent skill names."
- `clm_d64a3fb5380d` — "Skills the user disabled, that permissions deny, or that opted out of model-driven activation should be hidden from the catalog entirely rather than listed and blocked at activation, so the model does not waste turns trying to load them." · p 0.86 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "**Hide filtered skills entirely** from the catalog rather than listing them and blocking at activation time."

## Timeline

- 2026-08-25 new_claim `clm_ed5c2d07922a` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_7754773c8a2a` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_d64a3fb5380d` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_82f00f3d6803` (src_6932f817f8b4)

## Related

- → part_of [[progressive-disclosure]] (0.87)
- → uses [[skill-description]] (0.87)
- [[progressive-disclosure]] — 1 shared claim
- [[skill-description]] — 1 shared claim
- [[skill-md]] — 1 shared claim
