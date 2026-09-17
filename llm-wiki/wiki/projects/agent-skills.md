---
type: project
status: current
created: 2026-08-25
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
  - {resource: llm-wiki/raw/docs/agent-skills/home.md, title: "Agent Skills Overview", id: src_9b4d3b3d8635}
  - {resource: llm-wiki/raw/docs/agent-skills/quickstart.md, title: "Quickstart", id: src_cc19a042a4fe}
  - {resource: llm-wiki/raw/docs/agent-skills/specification.md, title: "Specification", id: src_7bd75101edfa}
  - {resource: llm-wiki/raw/docs/pi/skills.md, title: "Skills", id: src_51c275d28919}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_agent_skills]
claim_ids: [clm_810e9ca8ea5b, clm_c46dc3382318, clm_f88933d98f26, clm_649f1be88c0e, clm_cf1d2e62d060, clm_e6ce55d5ec53, clm_946cea9b74e2, clm_e66375272c22, clm_24f54b73443c, clm_b77585e8f900, clm_531764aebf7d, clm_0cd42294ec12, clm_175ad8d5489e, clm_f16d89d59999, clm_9c33c6401aa4, clm_3c47d354c81e, clm_26fcdb481f71]
confidence: 0.90
stale_after: 2026-12-07
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# Agent Skills

> **In here:** The Agent Skills format was originally developed by Anthropic, released as an open standard, adopted by a growing number of agent products, and is open to contributions from the broader ecosystem · 17 claims, confidence 0.90.

## Current understanding

- Clients should parse skills leniently for cross-client compatibility — warning but still loading on a name mismatch or over-length name, skipping only on a missing description or wholly unparseable YAML, and retrying common malformed YAML such as unquoted values containing colons (0.99)
- Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows, in which a skill is a folder containing a SKILL.md file carrying at minimum name and description plus instructions (0.93)
- A SKILL.md file must contain YAML frontmatter followed by Markdown content, and the Markdown body carrying the instructions has no format restrictions (0.93)
- A skill is a folder whose SKILL.md holds metadata and instructions, and which can also bundle scripts, reference materials, templates, and other resources (0.93)
- The required name field is capped at 64 characters, allows only lowercase letters, numbers and hyphens, may not start or end with a hyphen or contain consecutive hyphens, and must match the parent directory name (0.92)
- Beyond the required SKILL.md a skill directory may contain any files, with scripts/, references/, and assets/ recommended as conventions rather than mandated structure (0.92)
- Skills address agents lacking the context to do real work reliably by packaging procedural knowledge and company-, team-, and user-specific context into portable, version-controlled folders that agents load on demand (0.92)
- A skill built once can be used across any skills-compatible agent, making cross-product reuse a core benefit of the standard (0.92)
- The optional metadata map is the spec's extension point: clients use it to store properties the Agent Skills spec does not define, and key names should be made reasonably unique to avoid conflicts (0.91)
- Beyond name and description the spec defines four optional frontmatter fields: license, compatibility (max 500 characters, for environment requirements), metadata (an arbitrary string-to-string map), and the experimental allowed-tools (0.91)
- The Agent Skills format was originally developed by Anthropic, released as an open standard, adopted by a growing number of agent products, and is open to contributions from the broader ecosystem (0.90)
- The optional allowed-tools field is a space-separated string of pre-approved tools and is explicitly experimental, so support for it may vary between agent implementations (0.88)
- Because Agent Skills is an open format, the same skill folder works unchanged in any compatible agent, including VS Code, Claude Code, and OpenAI Codex (0.88)
- The standard ships a reference library, skills-ref, whose validate command checks that a skill's SKILL.md frontmatter is valid and follows all naming conventions (0.87)
- The spec does not mandate where skill directories live — only what goes inside them — and .agents/skills/ has emerged as the widely-adopted convention, so scanning it makes skills installed by other compliant clients visible to yours and vice versa (0.87)
- Project-level skills come from the repository being worked on, which may be untrusted, so clients should consider gating project-level skill loading on a trust check to stop untrusted repositories silently injecting instructions into the agent's context (0.87)
- Whether a skill's instructions are actually carried out depends on the model: tool-use reliability varies, and some models answer on their own rather than running the commands a skill specifies (0.83)

## Evidence

- `clm_810e9ca8ea5b` — "Clients should parse skills leniently for cross-client compatibility — warning but still loading on a name mismatch or over-length name, skipping only on a missing description or wholly unparseable YAML, and retrying common malformed YAML such as unquoted values containing colons." · p 0.99 · active · 2 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Skill files authored for other clients may contain technically invalid YAML that their parsers happen to accept. The most common issue is unquoted values containing colons:"
  - `src_51c275d28919` Skills: "Pi implements the [Agent Skills standard](https://agentskills.io/specification), warning about most violations but remaining lenient."
- `clm_c46dc3382318` — "Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows, in which a skill is a folder containing a SKILL.md file carrying at minimum name and description plus instructions." · p 0.93 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows."
- `clm_f88933d98f26` — "A SKILL.md file must contain YAML frontmatter followed by Markdown content, and the Markdown body carrying the instructions has no format restrictions." · p 0.93 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "The `SKILL.md` file must contain YAML frontmatter followed by Markdown content."
- `clm_649f1be88c0e` — "A skill is a folder whose SKILL.md holds metadata and instructions, and which can also bundle scripts, reference materials, templates, and other resources." · p 0.93 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "At its core, a skill is a folder containing a `SKILL.md` file. This file includes metadata (`name` and `description`, at minimum) and instructions that tell an agent how to perform a specific task."
- `clm_cf1d2e62d060` — "The required name field is capped at 64 characters, allows only lowercase letters, numbers and hyphens, may not start or end with a hyphen or contain consecutive hyphens, and must match the parent directory name." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen."
  - exception — when always: Pi is a documented exception to the name-matches-parent-directory rule: it lets a skill's name differ from its directory, holding that requirement suboptimal for skill directories shared across agent harnesses (`obs_80a9d4120894`)
- `clm_e6ce55d5ec53` — "Beyond the required SKILL.md a skill directory may contain any files, with scripts/, references/, and assets/ recommended as conventions rather than mandated structure." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "A skill directory may contain any files and directories beyond the required `SKILL.md`. The conventions below are recommendations for organizing common types of content."
- `clm_946cea9b74e2` — "Skills address agents lacking the context to do real work reliably by packaging procedural knowledge and company-, team-, and user-specific context into portable, version-controlled folders that agents load on demand." · p 0.92 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "Skills solve this by packaging procedural knowledge and company-, team-, and user-specific context into portable, version-controlled folders that agents load on demand."
- `clm_e66375272c22` — "A skill built once can be used across any skills-compatible agent, making cross-product reuse a core benefit of the standard." · p 0.92 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "**Cross-product reuse**: Build a skill once and use it across any skills-compatible agent."
- `clm_24f54b73443c` — "The optional metadata map is the spec's extension point: clients use it to store properties the Agent Skills spec does not define, and key names should be made reasonably unique to avoid conflicts." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Clients can use this to store additional properties not defined by the Agent Skills spec"
- `clm_b77585e8f900` — "Beyond name and description the spec defines four optional frontmatter fields: license, compatibility (max 500 characters, for environment requirements), metadata (an arbitrary string-to-string map), and the experimental allowed-tools." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 500 characters. Indicates environment requirements (intended product, system packages, network access, etc.)."
- `clm_531764aebf7d` — "The Agent Skills format was originally developed by Anthropic, released as an open standard, adopted by a growing number of agent products, and is open to contributions from the broader ecosystem." · p 0.90 · active · 1 support · 0 contradict
  - `src_9b4d3b3d8635` Agent Skills Overview: "The Agent Skills format was originally developed by [Anthropic](https://www.anthropic.com/), released as an open standard, and has been adopted by a growing number of agent products."
- `clm_0cd42294ec12` — "The optional allowed-tools field is a space-separated string of pre-approved tools and is explicitly experimental, so support for it may vary between agent implementations." · p 0.88 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Experimental. Support for this field may vary between agent implementations"
- `clm_175ad8d5489e` — "Because Agent Skills is an open format, the same skill folder works unchanged in any compatible agent, including VS Code, Claude Code, and OpenAI Codex." · p 0.88 · active · 1 support · 0 contradict
  - `src_cc19a042a4fe` Quickstart: "This tutorial uses VS Code, but Agent Skills are an open format. The same skill works in any compatible agent, including Claude Code and OpenAI Codex."
- `clm_f16d89d59999` — "The standard ships a reference library, skills-ref, whose validate command checks that a skill's SKILL.md frontmatter is valid and follows all naming conventions." · p 0.87 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "This checks that your `SKILL.md` frontmatter is valid and follows all naming conventions."
- `clm_9c33c6401aa4` — "The spec does not mandate where skill directories live — only what goes inside them — and .agents/skills/ has emerged as the widely-adopted convention, so scanning it makes skills installed by other compliant clients visible to yours and vice versa." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "The `.agents/skills/` paths have emerged as a widely-adopted convention for cross-client skill sharing."
- `clm_3c47d354c81e` — "Project-level skills come from the repository being worked on, which may be untrusted, so clients should consider gating project-level skill loading on a trust check to stop untrusted repositories silently injecting instructions into the agent's context." · p 0.87 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "Project-level skills come from the repository being worked on, which may be untrusted (e.g., a freshly cloned open-source project). Consider gating project-level skill loading on a trust check"
- `clm_26fcdb481f71` — "Whether a skill's instructions are actually carried out depends on the model: tool-use reliability varies, and some models answer on their own rather than running the commands a skill specifies." · p 0.83 · active · 1 support · 0 contradict
  - `src_cc19a042a4fe` Quickstart: "Tool-use reliability varies across models — some follow skill instructions and run commands consistently, while others may attempt to answer on their own."

## Timeline

- 2026-08-25 new_claim `clm_c46dc3382318` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_649f1be88c0e` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_531764aebf7d` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_946cea9b74e2` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_e66375272c22` (src_9b4d3b3d8635)
- 2026-08-25 new_claim `clm_f88933d98f26` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_cf1d2e62d060` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_b77585e8f900` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_0cd42294ec12` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_24f54b73443c` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_e6ce55d5ec53` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_f16d89d59999` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_175ad8d5489e` (src_cc19a042a4fe)
- 2026-08-25 new_claim `clm_26fcdb481f71` (src_cc19a042a4fe)
- 2026-08-25 new_claim `clm_9c33c6401aa4` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_3c47d354c81e` (src_6932f817f8b4)
- 2026-08-25 new_claim `clm_810e9ca8ea5b` (src_6932f817f8b4)
- 2026-09-11 exception_addition `clm_cf1d2e62d060` (src_51c275d28919)
- 2026-09-11 support_update `clm_810e9ca8ea5b` (src_51c275d28919)

## Related

- ← part_of [[skill-md]] (1.00)
- ← part_of [[skills]] (1.00)
- → uses [[skill-md]] (0.93)
- ← extends [[pi]] (0.92)
- ← uses [[pi]] (0.92)
- ← part_of [[allowed-tools]] (0.92)
- ← part_of [[skill-scripts]] (0.92)
- → applies_to [[skills]] (0.92)
- → produces [[skill-md]] (0.91)
- → applies_to [[claude-code]] (0.88)
- ← extends [[agents-skills]] (0.87)
- [[skill-md]] — 9 shared claims
- [[skills]] — 4 shared claims
- [[allowed-tools]] — 2 shared claims
- [[pi]] — 2 shared claims
- [[agents-skills]] — 1 shared claim
- [[claude-code]] — 1 shared claim
- [[skill-scripts]] — 1 shared claim
