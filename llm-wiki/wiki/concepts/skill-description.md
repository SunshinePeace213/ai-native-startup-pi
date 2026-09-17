---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
  - {resource: llm-wiki/raw/docs/agent-skills/home.md, title: "Agent Skills Overview", id: src_9b4d3b3d8635}
  - {resource: llm-wiki/raw/docs/agent-skills/optimizing-descriptions.md, title: "Optimizing skill descriptions", id: src_2435d7ebda83}
  - {resource: llm-wiki/raw/docs/agent-skills/quickstart.md, title: "Quickstart", id: src_cc19a042a4fe}
  - {resource: llm-wiki/raw/docs/agent-skills/specification.md, title: "Specification", id: src_7bd75101edfa}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/pi/skills.md, title: "Skills", id: src_51c275d28919}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_skill_description]
claim_ids: [clm_90a71be135d8, clm_12ec66bc98dd, clm_5f3ca55d25bb, clm_23c00ec362dd, clm_b61710bffc40, clm_5b11d3ad951c, clm_e2bdb859a630, clm_0335d473cad6, clm_42bb868ef1cb, clm_e531bde51ac9, clm_f112d81f86c1, clm_581b1e4926be, clm_7754773c8a2a, clm_794de3446251]
confidence: 0.89
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# skill description

> **In here:** An effective description uses imperative phrasing framed as an instruction to the agent, focuses on user intent rather than implementation, errs on the side of being pushy about the contexts where… · 14 claims, confidence 0.89.

## Current understanding

- Agents load skills through progressive disclosure in three stages: discovery loads only each skill's name and description at startup, activation reads the full SKILL.md when a task matches the description, and execution follows the instructions and optionally loads bundled code or referenced files (0.99)
- The required description field is capped at 1024 characters, must be non-empty, and should describe both what the skill does and when to use it, including keywords that help agents identify relevant tasks (0.92)
- The documented remedy for a skill Claude does not use is to put the words users would naturally say into its description, confirm the skill is listed, rephrase the request to match it, or invoke it directly by name (0.92)
- A skill's description is the text Claude matches against to decide when to apply the skill, and the combined description and when_to_use text is truncated at 1,536 characters in the skill listing (0.89)
- The description carries the entire burden of triggering: an under-specified one means the skill will not fire when it should, an over-broad one means it fires when it should not, and if it does not convey when the skill is useful the agent will not reach for it (0.89)
- Optimizing a description against every query overfits it to those phrasings, so the query set splits into a train set that guides revisions and a held-out validation set that checks whether improvements generalize (0.88)
- An effective description uses imperative phrasing framed as an instruction to the agent, focuses on user intent rather than implementation, errs on the side of being pushy about the contexts where it applies, and stays concise within the 1024-character limit (0.88)
- The valuable negative test cases are near-misses that share keywords or concepts with the skill but need something different, because they test whether the description is precise rather than merely broad (0.88)
- Revising a description means addressing the general category the failed queries represent rather than pasting in their specific keywords, which is overfitting (0.88)
- A trigger eval set should run to about 20 realistic queries, 8-10 labeled should-trigger and 8-10 should-not-trigger, varied in phrasing, explicitness, detail, and complexity (0.88)
- The best description is selected by validation pass rate and may not be the last one produced, since a later iteration can overfit the train set; five iterations is usually enough (0.88)
- Agents typically consult skills only for tasks needing knowledge or capability beyond what they can handle alone, so a simple one-step request may not trigger a skill even when the description matches perfectly (0.88)
- Most implementations rely on the model's own judgment as the activation mechanism rather than harness-side trigger matching or keyword detection, using either file-read activation or a dedicated activation tool (0.87)
- A working skill can be a single SKILL.md file under 20 lines, with the description telling the agent when to activate and the body carrying the instructions it follows (0.86)

## Evidence

- `clm_90a71be135d8` — "Agents load skills through progressive disclosure in three stages: discovery loads only each skill's name and description at startup, activation reads the full SKILL.md when a task matches the description, and execution follows the instructions and optionally loads bundled code or referenced files." · p 0.99 · active · 2 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "1. **Discovery**: At startup, agents load only the name and description of each available skill, just enough to know when it might be relevant."
  - `src_51c275d28919` Skills: "This is progressive disclosure: only descriptions are always in context, full instructions load on-demand."
- `clm_12ec66bc98dd` — "The required description field is capped at 1024 characters, must be non-empty, and should describe both what the skill does and when to use it, including keywords that help agents identify relevant tasks." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 1024 characters. Non-empty. Describes what the skill does and when to use it."
- `clm_5f3ca55d25bb` — "The documented remedy for a skill Claude does not use is to put the words users would naturally say into its description, confirm the skill is listed, rephrase the request to match it, or invoke it directly by name." · p 0.92 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "If Claude doesn't use your skill when expected: 1. Check the description includes keywords users would naturally say 2. Verify the skill appears in `What skills are available?` 3."
- `clm_23c00ec362dd` — "A skill's description is the text Claude matches against to decide when to apply the skill, and the combined description and when_to_use text is truncated at 1,536 characters in the skill listing." · p 0.89 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "What the skill does and when to use it. Claude uses this to decide when to apply the skill. If omitted, uses the first paragraph of markdown content."
- `clm_b61710bffc40` — "The description carries the entire burden of triggering: an under-specified one means the skill will not fire when it should, an over-broad one means it fires when it should not, and if it does not convey when the skill is useful the agent will not reach for it." · p 0.89 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "This means the description carries the entire burden of triggering. If the description doesn't convey when the skill is useful, the agent won't know to reach for it."
- `clm_5b11d3ad951c` — "Optimizing a description against every query overfits it to those phrasings, so the query set splits into a train set that guides revisions and a held-out validation set that checks whether improvements generalize." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "If you optimize the description against all your queries, you risk overfitting — crafting a description that works for these specific phrasings but fails on new ones."
- `clm_e2bdb859a630` — "An effective description uses imperative phrasing framed as an instruction to the agent, focuses on user intent rather than implementation, errs on the side of being pushy about the contexts where it applies, and stays concise within the 1024-character limit." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "**Use imperative phrasing.** Frame the description as an instruction to the agent: "Use this skill when..." rather than "This skill does..." The agent is deciding whether to act, so tell it when to act."
- `clm_0335d473cad6` — "The valuable negative test cases are near-misses that share keywords or concepts with the skill but need something different, because they test whether the description is precise rather than merely broad." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "The most valuable negative test cases are **near-misses** — queries that share keywords or concepts with your skill but actually need something different."
- `clm_42bb868ef1cb` — "Revising a description means addressing the general category the failed queries represent rather than pasting in their specific keywords, which is overfitting." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Avoid adding specific keywords from failed queries — that's overfitting."
- `clm_e531bde51ac9` — "A trigger eval set should run to about 20 realistic queries, 8-10 labeled should-trigger and 8-10 should-not-trigger, varied in phrasing, explicitness, detail, and complexity." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Aim for about 20 queries: 8-10 that should trigger and 8-10 that shouldn't."
- `clm_f112d81f86c1` — "The best description is selected by validation pass rate and may not be the last one produced, since a later iteration can overfit the train set; five iterations is usually enough." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "Note that the best description may not be the last one you produced; an earlier iteration might have a higher validation pass rate than later ones that overfit to the train set."
- `clm_581b1e4926be` — "Agents typically consult skills only for tasks needing knowledge or capability beyond what they can handle alone, so a simple one-step request may not trigger a skill even when the description matches perfectly." · p 0.88 · active · 1 support · 0 contradict
  - `src_2435d7ebda83` Optimizing skill descriptions: "One important nuance: agents typically only consult skills for tasks that require knowledge or capabilities beyond what they can handle alone."
- `clm_7754773c8a2a` — "Most implementations rely on the model's own judgment as the activation mechanism rather than harness-side trigger matching or keyword detection, using either file-read activation or a dedicated activation tool." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Most implementations rely on the model's own judgment as the activation mechanism, rather than implementing harness-side trigger matching or keyword detection."
- `clm_794de3446251` — "A working skill can be a single SKILL.md file under 20 lines, with the description telling the agent when to activate and the body carrying the instructions it follows." · p 0.86 · active · 1 support · 0 contradict
  - `src_cc19a042a4fe` Quickstart: "That's it — one file, under 20 lines."

## Timeline

- 2026-08-23 new_claim `clm_23c00ec362dd` (src_07950e24c4ee)
- 2026-08-23 new_claim `clm_5f3ca55d25bb` (src_07950e24c4ee)
- 2026-08-25 new_claim `clm_90a71be135d8` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_12ec66bc98dd` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_794de3446251` (src_cc19a042a4fe)
- 2026-08-25 new_claim `clm_b61710bffc40` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_581b1e4926be` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_e2bdb859a630` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_e531bde51ac9` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_0335d473cad6` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_5b11d3ad951c` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_42bb868ef1cb` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_f112d81f86c1` (src_2435d7ebda83)
- 2026-08-25 new_claim `clm_7754773c8a2a` (src_6932f817f8b4)
- 2026-09-11 support_update `clm_90a71be135d8` (src_51c275d28919)

## Related

- → part_of [[skill-md]] (0.99)
- ← produces [[skill-evaluation]] (0.98)
- ← applies_to [[skill-evaluation]] (0.98)
- ← depends_on [[skills]] (0.93)
- ← uses [[progressive-disclosure]] (0.92)
- → part_of [[progressive-disclosure]] (0.89)
- → part_of [[skill-evaluation]] (0.88)
- → applies_to [[skills]] (0.88)
- ← uses [[skill-catalog]] (0.87)
- [[skill-evaluation]] — 5 shared claims
- [[skills]] — 4 shared claims
- [[progressive-disclosure]] — 2 shared claims
- [[skill-md]] — 2 shared claims
- [[context-window]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[skill-catalog]] — 1 shared claim
