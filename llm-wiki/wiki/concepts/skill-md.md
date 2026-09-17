---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
  - {resource: llm-wiki/raw/docs/agent-skills/best-practices.md, title: "Best practices for skill creators", id: src_58c8a3f32b3f}
  - {resource: llm-wiki/raw/docs/agent-skills/evaluating-skills.md, title: "Evaluating skill output quality", id: src_43d7ded295ed}
  - {resource: llm-wiki/raw/docs/agent-skills/home.md, title: "Agent Skills Overview", id: src_9b4d3b3d8635}
  - {resource: llm-wiki/raw/docs/agent-skills/quickstart.md, title: "Quickstart", id: src_cc19a042a4fe}
  - {resource: llm-wiki/raw/docs/agent-skills/specification.md, title: "Specification", id: src_7bd75101edfa}
  - {resource: llm-wiki/raw/docs/agent-skills/using-scripts.md, title: "Using scripts in skills", id: src_779a634dd418}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/pi/skills.md, title: "Skills", id: src_51c275d28919}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_skill_md]
claim_ids: [clm_6ef07a9ab4ea, clm_810e9ca8ea5b, clm_02e514dade50, clm_c46dc3382318, clm_f88933d98f26, clm_649f1be88c0e, clm_06eb634db8d8, clm_12ec66bc98dd, clm_cf1d2e62d060, clm_e6ce55d5ec53, clm_728bbd954425, clm_b167fbc5a6f4, clm_24f54b73443c, clm_b77585e8f900, clm_be519460c23c, clm_2ca7bcd80c20, clm_2de5f30ab086, clm_2f7a799c6386, clm_4bae63d37071, clm_6007cb4241eb, clm_8632f86d1a67, clm_95ec0eafe6c7, clm_f1d5f35ed2be, clm_f16d89d59999, clm_0798c6e82be8, clm_8475650d0018, clm_ed5c2d07922a, clm_197c7673976d, clm_8d2d12971924, clm_9426ac2144b2, clm_794de3446251, clm_ddc824a97e41]
confidence: 0.90
stale_after: 2026-12-09
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# SKILL.md

> **In here:** A SKILL.md file has two parts — YAML frontmatter between --- markers that tells Claude when to use the skill, and markdown instructions Claude follows when it runs · 32 claims, confidence 0.90.

## Current understanding

- A skill's body loads only when the skill is used, unlike CLAUDE.md content, so long reference material costs almost nothing until it is needed (0.99)
- Clients should parse skills leniently for cross-client compatibility — warning but still loading on a name mismatch or over-length name, skipping only on a missing description or wholly unparseable YAML, and retrying common malformed YAML such as unquoted values containing colons (0.99)
- A Claude Code skill is a SKILL.md file of instructions that Claude adds to its toolkit and either uses on its own when relevant or runs when the user types /skill-name (0.94)
- Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows, in which a skill is a folder containing a SKILL.md file carrying at minimum name and description plus instructions (0.93)
- A SKILL.md file must contain YAML frontmatter followed by Markdown content, and the Markdown body carrying the instructions has no format restrictions (0.93)
- A skill is a folder whose SKILL.md holds metadata and instructions, and which can also bundle scripts, reference materials, templates, and other resources (0.93)
- The specification recommends keeping the main SKILL.md under 500 lines and moving detailed reference material to separate files, because the agent loads the entire file once it decides to activate a skill (0.92)
- The required description field is capped at 1024 characters, must be non-empty, and should describe both what the skill does and when to use it, including keywords that help agents identify relevant tasks (0.92)
- The required name field is capped at 64 characters, allows only lowercase letters, numbers and hyphens, may not start or end with a hyphen or contain consecutive hyphens, and must match the parent directory name (0.92)
- Beyond the required SKILL.md a skill directory may contain any files, with scripts/, references/, and assets/ recommended as conventions rather than mandated structure (0.92)
- Reference files should stay focused and be referenced by relative paths kept one level deep from SKILL.md, avoiding deeply nested reference chains, since agents load them on demand and smaller files use less context (0.91)
- Pi's agent is expected to load a matching SKILL.md itself with read or bash, but models do not always do so, which is why prompting or an explicit /skill:name command exists to force it (0.91)
- The optional metadata map is the spec's extension point: clients use it to store properties the Agent Skills spec does not define, and key names should be made reasonably unique to avoid conflicts (0.91)
- Beyond name and description the spec defines four optional frontmatter fields: license, compatibility (max 500 characters, for environment requirements), metadata (an arbitrary string-to-string map), and the experimental allowed-tools (0.91)
- A SKILL.md file has two parts — YAML frontmatter between --- markers that tells Claude when to use the skill, and markdown instructions Claude follows when it runs — and the skill's directory name becomes the command typed to invoke it (0.90)
- The highest-value content in many skills is a gotchas list — concrete environment-specific facts that defy reasonable assumptions — and these belong in SKILL.md itself, where the agent reads them before hitting the situation (0.88)
- A skill should teach the agent how to approach a class of problems rather than what to produce for one instance, so the approach generalizes even when individual details are specific (0.88)
- Overly comprehensive skills hurt more than they help — the agent struggles to extract what is relevant and pursues unproductive paths from instructions that do not apply — so concise stepwise guidance with a working example outperforms exhaustive documentation (0.88)
- When several tools or approaches could work, a skill should pick a default and mention alternatives briefly rather than presenting them as equal options (0.88)
- A skill should carry only what the agent would not know on its own — project-specific conventions, domain procedures, non-obvious edge cases, and the particular tools or APIs to use — and the test for each piece of content is whether the agent would get it wrong without the instruction (0.88)
- Prescriptiveness should be calibrated per section rather than per skill: give the agent freedom where multiple approaches are valid, and be prescriptive where operations are fragile, consistency matters, or a specific sequence must be followed (0.88)
- When a skill splits content into reference files, the load-bearing part is telling the agent when to load each one — a conditional instruction beats a generic pointer, which is how progressive disclosure is designed to work (0.88)
- Asking an LLM to generate a skill without domain-specific context is the common pitfall — it yields vague generic procedures rather than the specific API patterns, edge cases, and project conventions that make a skill valuable (0.88)
- The standard ships a reference library, skills-ref, whose validate command checks that a skill's SKILL.md frontmatter is valid and follows all naming conventions (0.87)
- Fewer, better instructions often outperform exhaustive rules, so instructions the transcripts show as wasted work should be removed, and a pass rate that plateaus as rules are added signals an over-constrained skill worth trimming (0.87)
- Reasoning-based instructions that say why outperform rigid directives, because models follow instructions more reliably when they understand the purpose (0.87)
- Every skills-compatible agent follows the same three-tier loading strategy: a catalog of name plus description at roughly 50-100 tokens per skill at session start, the full SKILL.md body under a recommended 5000 tokens on activation, and bundled resources only when the instructions reference them (0.87)
- Each eval run must start from a clean context with no leftover state from previous runs or from skill development, so the agent follows only what SKILL.md tells it; subagents give this isolation naturally and otherwise a separate session per run is needed (0.87)
- Bundled files are referenced by relative paths from the skill directory root, which the agent resolves automatically, and the same convention holds inside support files because the agent runs commands from that root (0.86)
- One-off commands invoked from a skill should pin tool versions so the command behaves the same over time, and prerequisites should be stated in SKILL.md rather than assumed of the agent's environment (0.86)
- A working skill can be a single SKILL.md file under 20 lines, with the description telling the agent when to activate and the body carrying the instructions it follows (0.86)
- Clients look for skills in a default directory — VS Code uses .agents/skills/ — so creating .agents/skills/<name>/SKILL.md in a project is enough to make a skill discoverable (0.83)

## Evidence

- `clm_6ef07a9ab4ea` — "A skill's body loads only when the skill is used, unlike CLAUDE.md content, so long reference material costs almost nothing until it is needed." · p 0.99 · active · 2 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "Unlike CLAUDE.md content, a skill's body loads only when it's used, so long reference material costs almost nothing until you need it."
  - `src_07950e24c4ee` Extend Claude with skills: "Skills can include multiple files in their directory. This keeps `SKILL.md` focused on the essentials while letting Claude access detailed reference material only when needed."
- `clm_810e9ca8ea5b` — "Clients should parse skills leniently for cross-client compatibility — warning but still loading on a name mismatch or over-length name, skipping only on a missing description or wholly unparseable YAML, and retrying common malformed YAML such as unquoted values containing colons." · p 0.99 · active · 2 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Skill files authored for other clients may contain technically invalid YAML that their parsers happen to accept. The most common issue is unquoted values containing colons:"
  - `src_51c275d28919` Skills: "Pi implements the [Agent Skills standard](https://agentskills.io/specification), warning about most violations but remaining lenient."
- `clm_02e514dade50` — "A Claude Code skill is a SKILL.md file of instructions that Claude adds to its toolkit and either uses on its own when relevant or runs when the user types /skill-name." · p 0.94 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "Skills extend what Claude can do. Create a `SKILL.md` file with instructions, and Claude adds it to its toolkit. Claude uses skills when relevant, or you can invoke one directly with `/skill-name`."
- `clm_c46dc3382318` — "Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows, in which a skill is a folder containing a SKILL.md file carrying at minimum name and description plus instructions." · p 0.93 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows."
- `clm_f88933d98f26` — "A SKILL.md file must contain YAML frontmatter followed by Markdown content, and the Markdown body carrying the instructions has no format restrictions." · p 0.93 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "The `SKILL.md` file must contain YAML frontmatter followed by Markdown content."
- `clm_649f1be88c0e` — "A skill is a folder whose SKILL.md holds metadata and instructions, and which can also bundle scripts, reference materials, templates, and other resources." · p 0.93 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "At its core, a skill is a folder containing a `SKILL.md` file. This file includes metadata (`name` and `description`, at minimum) and instructions that tell an agent how to perform a specific task."
- `clm_06eb634db8d8` — "The specification recommends keeping the main SKILL.md under 500 lines and moving detailed reference material to separate files, because the agent loads the entire file once it decides to activate a skill." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Keep your main `SKILL.md` under 500 lines. Move detailed reference material to separate files."
- `clm_12ec66bc98dd` — "The required description field is capped at 1024 characters, must be non-empty, and should describe both what the skill does and when to use it, including keywords that help agents identify relevant tasks." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 1024 characters. Non-empty. Describes what the skill does and when to use it."
- `clm_cf1d2e62d060` — "The required name field is capped at 64 characters, allows only lowercase letters, numbers and hyphens, may not start or end with a hyphen or contain consecutive hyphens, and must match the parent directory name." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen."
  - exception — when always: Pi is a documented exception to the name-matches-parent-directory rule: it lets a skill's name differ from its directory, holding that requirement suboptimal for skill directories shared across agent harnesses (`obs_80a9d4120894`)
- `clm_e6ce55d5ec53` — "Beyond the required SKILL.md a skill directory may contain any files, with scripts/, references/, and assets/ recommended as conventions rather than mandated structure." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "A skill directory may contain any files and directories beyond the required `SKILL.md`. The conventions below are recommendations for organizing common types of content."
- `clm_728bbd954425` — "Reference files should stay focused and be referenced by relative paths kept one level deep from SKILL.md, avoiding deeply nested reference chains, since agents load them on demand and smaller files use less context." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains."
- `clm_b167fbc5a6f4` — "Pi's agent is expected to load a matching SKILL.md itself with read or bash, but models do not always do so, which is why prompting or an explicit /skill:name command exists to force it." · p 0.91 · active · 1 support · 0 contradict
  - `src_51c275d28919` Skills: "When a task matches, the agent uses `read`, or `bash` when `read` is unavailable, to load the full SKILL.md (models don't always do this; use prompting or `/skill:name` to force it)"
- `clm_24f54b73443c` — "The optional metadata map is the spec's extension point: clients use it to store properties the Agent Skills spec does not define, and key names should be made reasonably unique to avoid conflicts." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Clients can use this to store additional properties not defined by the Agent Skills spec"
- `clm_b77585e8f900` — "Beyond name and description the spec defines four optional frontmatter fields: license, compatibility (max 500 characters, for environment requirements), metadata (an arbitrary string-to-string map), and the experimental allowed-tools." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 500 characters. Indicates environment requirements (intended product, system packages, network access, etc.)."
- `clm_be519460c23c` — "A SKILL.md file has two parts — YAML frontmatter between --- markers that tells Claude when to use the skill, and markdown instructions Claude follows when it runs — and the skill's directory name becomes the command typed to invoke it." · p 0.90 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "Every skill needs a `SKILL.md` file with two parts: YAML frontmatter between `---` markers that tells Claude when to use the skill, and markdown content with the instructions Claude follows when the skill runs."
- `clm_2ca7bcd80c20` — "The highest-value content in many skills is a gotchas list — concrete environment-specific facts that defy reasonable assumptions — and these belong in SKILL.md itself, where the agent reads them before hitting the situation." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "The highest-value content in many skills is a list of gotchas — environment-specific facts that defy reasonable assumptions."
- `clm_2de5f30ab086` — "A skill should teach the agent how to approach a class of problems rather than what to produce for one instance, so the approach generalizes even when individual details are specific." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "A skill should teach the agent *how to approach* a class of problems, not *what to produce* for a specific instance."
- `clm_2f7a799c6386` — "Overly comprehensive skills hurt more than they help — the agent struggles to extract what is relevant and pursues unproductive paths from instructions that do not apply — so concise stepwise guidance with a working example outperforms exhaustive documentation." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "Overly comprehensive skills can hurt more than they help — the agent struggles to extract what's relevant and may pursue unproductive paths triggered by instructions that don't apply to the current task."
- `clm_4bae63d37071` — "When several tools or approaches could work, a skill should pick a default and mention alternatives briefly rather than presenting them as equal options." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "When multiple tools or approaches could work, pick a default and mention alternatives briefly rather than presenting them as equal options."
- `clm_6007cb4241eb` — "A skill should carry only what the agent would not know on its own — project-specific conventions, domain procedures, non-obvious edge cases, and the particular tools or APIs to use — and the test for each piece of content is whether the agent would get it wrong without the instruction." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "Ask yourself about each piece of content: "Would the agent get this wrong without this instruction?" If the answer is no, cut it."
- `clm_8632f86d1a67` — "Prescriptiveness should be calibrated per section rather than per skill: give the agent freedom where multiple approaches are valid, and be prescriptive where operations are fragile, consistency matters, or a specific sequence must be followed." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "Match the specificity of your instructions to the fragility of the task."
- `clm_95ec0eafe6c7` — "When a skill splits content into reference files, the load-bearing part is telling the agent when to load each one — a conditional instruction beats a generic pointer, which is how progressive disclosure is designed to work." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "The key is telling the agent *when* to load each file."
- `clm_f1d5f35ed2be` — "Asking an LLM to generate a skill without domain-specific context is the common pitfall — it yields vague generic procedures rather than the specific API patterns, edge cases, and project conventions that make a skill valuable." · p 0.88 · active · 1 support · 0 contradict
  - `src_58c8a3f32b3f` Best practices for skill creators: "A common pitfall in skill creation is asking an LLM to generate a skill without providing domain-specific context — relying solely on the LLM's general training knowledge."
- `clm_f16d89d59999` — "The standard ships a reference library, skills-ref, whose validate command checks that a skill's SKILL.md frontmatter is valid and follows all naming conventions." · p 0.87 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "This checks that your `SKILL.md` frontmatter is valid and follows all naming conventions."
- `clm_0798c6e82be8` — "Fewer, better instructions often outperform exhaustive rules, so instructions the transcripts show as wasted work should be removed, and a pass rate that plateaus as rules are added signals an over-constrained skill worth trimming." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "**Keep the skill lean.** Fewer, better instructions often outperform exhaustive rules."
- `clm_8475650d0018` — "Reasoning-based instructions that say why outperform rigid directives, because models follow instructions more reliably when they understand the purpose." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "**Explain the why.** Reasoning-based instructions ("Do X because Y tends to cause Z") work better than rigid directives ("ALWAYS do X, NEVER do Y")."
- `clm_ed5c2d07922a` — "Every skills-compatible agent follows the same three-tier loading strategy: a catalog of name plus description at roughly 50-100 tokens per skill at session start, the full SKILL.md body under a recommended 5000 tokens on activation, and bundled resources only when the instructions reference them." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Every skills-compatible agent follows the same three-tier loading strategy:"
- `clm_197c7673976d` — "Each eval run must start from a clean context with no leftover state from previous runs or from skill development, so the agent follows only what SKILL.md tells it; subagents give this isolation naturally and otherwise a separate session per run is needed." · p 0.87 · active · 1 support · 0 contradict
  - `src_43d7ded295ed` Evaluating skill output quality: "Each eval run should start with a clean context — no leftover state from previous runs or from the skill development process."
- `clm_8d2d12971924` — "Bundled files are referenced by relative paths from the skill directory root, which the agent resolves automatically, and the same convention holds inside support files because the agent runs commands from that root." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "Use **relative paths from the skill directory root** to reference bundled files."
- `clm_9426ac2144b2` — "One-off commands invoked from a skill should pin tool versions so the command behaves the same over time, and prerequisites should be stated in SKILL.md rather than assumed of the agent's environment." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "**Pin versions** (e.g., `npx eslint@9.0.0`) so the command behaves the same over time."
- `clm_794de3446251` — "A working skill can be a single SKILL.md file under 20 lines, with the description telling the agent when to activate and the body carrying the instructions it follows." · p 0.86 · active · 1 support · 0 contradict
  - `src_cc19a042a4fe` Quickstart: "That's it — one file, under 20 lines."
- `clm_ddc824a97e41` — "Clients look for skills in a default directory — VS Code uses .agents/skills/ — so creating .agents/skills/<name>/SKILL.md in a project is enough to make a skill discoverable." · p 0.83 · active · 1 support · 0 contradict
  - `src_cc19a042a4fe` Quickstart: "A skill is a folder containing a `SKILL.md` file. VS Code looks for skills in `.agents/skills/` by default."

## Timeline

- 2026-08-23 new_claim `clm_02e514dade50` (src_07950e24c4ee)
- 2026-08-23 new_claim `clm_be519460c23c` (src_07950e24c4ee)
- 2026-08-23 new_claim `clm_6ef07a9ab4ea` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_6ef07a9ab4ea` (src_07950e24c4ee)
- 2026-08-25 new_claim `clm_c46dc3382318` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_649f1be88c0e` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_f88933d98f26` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_cf1d2e62d060` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_12ec66bc98dd` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_b77585e8f900` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_24f54b73443c` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_06eb634db8d8` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_e6ce55d5ec53` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_728bbd954425` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_f16d89d59999` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_ddc824a97e41` (src_cc19a042a4fe)
- 2026-08-25 new_claim `clm_794de3446251` (src_cc19a042a4fe)
- 2026-08-25 new_claim `clm_f1d5f35ed2be` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_6007cb4241eb` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_2f7a799c6386` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_8632f86d1a67` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_4bae63d37071` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_2ca7bcd80c20` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_2de5f30ab086` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_95ec0eafe6c7` (src_58c8a3f32b3f)
- 2026-08-25 new_claim `clm_197c7673976d` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_0798c6e82be8` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_8475650d0018` (src_43d7ded295ed)
- 2026-08-25 new_claim `clm_9426ac2144b2` (src_779a634dd418)
- 2026-08-25 new_claim `clm_8d2d12971924` (src_779a634dd418)
- 2026-08-25 new_claim `clm_ed5c2d07922a` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_810e9ca8ea5b` (src_6932f817f8b4)
- 2026-09-11 exception_addition `clm_cf1d2e62d060` (src_51c275d28919)
- 2026-09-11 support_update `clm_810e9ca8ea5b` (src_51c275d28919)
- 2026-09-11 new_claim `clm_b167fbc5a6f4` (src_51c275d28919)

## Related

- → part_of [[agent-skills]] (1.00)
- ← uses [[skills]] (1.00)
- → uses [[progressive-disclosure]] (1.00)
- → part_of [[skills]] (1.00)
- → applies_to [[skills]] (1.00)
- ← part_of [[skill-description]] (0.99)
- ← part_of [[skill-scripts]] (0.97)
- ← uses [[agent-skills]] (0.93)
- ← part_of [[allowed-tools]] (0.91)
- ← produces [[agent-skills]] (0.91)
- ← part_of [[agents-skills]] (0.87)
- ← uses [[progressive-disclosure]] (0.87)
- … 1 more edges — `graph.py neighbors ent_skill_md`
- [[skills]] — 13 shared claims
- [[agent-skills]] — 9 shared claims
- [[progressive-disclosure]] — 5 shared claims
- [[pi]] — 3 shared claims
- [[skill-scripts]] — 3 shared claims
- [[skill-description]] — 2 shared claims
- [[agents-skills]] — 1 shared claim
- [[allowed-tools]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
- [[skill-catalog]] — 1 shared claim
- [[skill-evaluation]] — 1 shared claim
