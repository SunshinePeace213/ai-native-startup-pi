---
type: concept
status: current
created: 2026-08-25
updated: 2026-08-25
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/adding-skills-support.md, title: "How to add skills support to your agent", id: src_6932f817f8b4}
  - {resource: llm-wiki/raw/docs/agent-skills/specification.md, title: "Specification", id: src_7bd75101edfa}
  - {resource: llm-wiki/raw/docs/agent-skills/using-scripts.md, title: "Using scripts in skills", id: src_779a634dd418}
generated: {by: process:llm-wiki-render, at: 2026-08-25}
entity_ids: [ent_skill_scripts]
claim_ids: [clm_e6ce55d5ec53, clm_816dfea9130f, clm_0746c2102164, clm_5b0d73dd8f51, clm_62002b0c8bcd, clm_bc04d29e3d9d, clm_284494b4fbe2, clm_2902d30214ab, clm_73dc3e6d79f8, clm_8956097bdc7d, clm_fe9dbad7e857, clm_8d2d12971924, clm_9426ac2144b2]
confidence: 0.87
stale_after: 2028-11-08
last_rendered: 2026-08-25T13:05:21Z
review_required: false
---

# skill scripts

> **In here:** Scripts should emit structured formats such as JSON, CSV, or TSV rather than free-form text, so both the agent and standard tools can consume the output, with data on stdout and diagnostics on stderr · 13 claims, confidence 0.87.

## Current understanding

- Beyond the required SKILL.md a skill directory may contain any files, with scripts/, references/, and assets/ recommended as conventions rather than mandated structure (0.92)
- Non-interactivity is a hard requirement of the agent execution environment: agents run in non-interactive shells and cannot answer TTY prompts, so a script that blocks on input hangs indefinitely and all input must arrive by flags, environment variables, or stdin (0.87)
- Scripts should emit structured formats such as JSON, CSV, or TSV rather than free-form text, so both the agent and standard tools can consume the output, with data on stdout and diagnostics on stderr (0.86)
- Error messages directly shape an agent's next attempt, so a script should say what went wrong, what was expected, and what to try, rather than emitting an opaque error that wastes a turn (0.86)
- A script's --help output is the primary way an agent learns its interface, so it should carry a brief description, the available flags, and usage examples while staying concise enough not to crowd the context window (0.86)
- A client with a permission system gating file access should allowlist skill directories, or every reference to a bundled script or reference file raises a permission dialog and breaks the flow for skills carrying resources (0.86)
- Because agents may retry commands, script operations should be idempotent — create-if-not-exists is safer than create-and-fail-on-duplicate (0.86)
- Scripts should use distinct exit codes for different failure types and document them in --help so the agent knows what each code means (0.86)
- A one-off command suits invoking a tool with a few flags, but once a command grows complex enough to be hard to get right on the first try, a tested script in scripts/ is more reliable (0.86)
- Many agent harnesses truncate tool output past a threshold of roughly 10-30K characters, so a script that may produce large output should default to a summary or limit and support paging flags, or require an explicit --output target (0.86)
- Reusable logic belongs in a scripts/ file that declares its own dependencies inline — via PEP 723 for Python, npm:/jsr: specifiers for Deno, pinned imports for Bun, or bundler/inline for Ruby — so the agent runs it with one command and no install step (0.86)
- Bundled files are referenced by relative paths from the skill directory root, which the agent resolves automatically, and the same convention holds inside support files because the agent runs commands from that root (0.86)
- One-off commands invoked from a skill should pin tool versions so the command behaves the same over time, and prerequisites should be stated in SKILL.md rather than assumed of the agent's environment (0.86)

## Evidence

- `clm_e6ce55d5ec53` — "Beyond the required SKILL.md a skill directory may contain any files, with scripts/, references/, and assets/ recommended as conventions rather than mandated structure." · p 0.92 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "A skill directory may contain any files and directories beyond the required `SKILL.md`. The conventions below are recommendations for organizing common types of content."
- `clm_816dfea9130f` — "Non-interactivity is a hard requirement of the agent execution environment: agents run in non-interactive shells and cannot answer TTY prompts, so a script that blocks on input hangs indefinitely and all input must arrive by flags, environment variables, or stdin." · p 0.87 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "This is a hard requirement of the agent execution environment. Agents operate in non-interactive shells — they cannot respond to TTY prompts, password dialogs, or confirmation menus."
- `clm_0746c2102164` — "Scripts should emit structured formats such as JSON, CSV, or TSV rather than free-form text, so both the agent and standard tools can consume the output, with data on stdout and diagnostics on stderr." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "Prefer structured formats — JSON, CSV, TSV — over free-form text."
- `clm_5b0d73dd8f51` — "Error messages directly shape an agent's next attempt, so a script should say what went wrong, what was expected, and what to try, rather than emitting an opaque error that wastes a turn." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "When an agent gets an error, the message directly shapes its next attempt. An opaque "Error: invalid input" wastes a turn."
- `clm_62002b0c8bcd` — "A script's --help output is the primary way an agent learns its interface, so it should carry a brief description, the available flags, and usage examples while staying concise enough not to crowd the context window." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "`--help` output is the primary way an agent learns your script's interface."
- `clm_bc04d29e3d9d` — "A client with a permission system gating file access should allowlist skill directories, or every reference to a bundled script or reference file raises a permission dialog and breaks the flow for skills carrying resources." · p 0.86 · active · 1 support · 0 contradict
  - `src_6932f817f8b4` How to add skills support to your agent: "If your agent has a permission system that gates file access, **allowlist skill directories** so the model can read bundled resources without triggering user confirmation prompts."
- `clm_284494b4fbe2` — "Because agents may retry commands, script operations should be idempotent — create-if-not-exists is safer than create-and-fail-on-duplicate." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "**Idempotency.** Agents may retry commands. "Create if not exists" is safer than "create and fail on duplicate.""
- `clm_2902d30214ab` — "Scripts should use distinct exit codes for different failure types and document them in --help so the agent knows what each code means." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "**Meaningful exit codes.** Use distinct exit codes for different failure types (not found, invalid arguments, auth failure) and document them in your `--help` output so the agent knows what each code means."
- `clm_73dc3e6d79f8` — "A one-off command suits invoking a tool with a few flags, but once a command grows complex enough to be hard to get right on the first try, a tested script in scripts/ is more reliable." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "**Move complex commands into scripts.** A one-off command works well when you're invoking a tool with a few flags."
- `clm_8956097bdc7d` — "Many agent harnesses truncate tool output past a threshold of roughly 10-30K characters, so a script that may produce large output should default to a summary or limit and support paging flags, or require an explicit --output target." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "**Predictable output size.** Many agent harnesses automatically truncate tool output beyond a threshold (e.g., 10-30K characters), potentially losing critical information."
- `clm_fe9dbad7e857` — "Reusable logic belongs in a scripts/ file that declares its own dependencies inline — via PEP 723 for Python, npm:/jsr: specifiers for Deno, pinned imports for Bun, or bundler/inline for Ruby — so the agent runs it with one command and no install step." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "When you need reusable logic, bundle a script in `scripts/` that declares its own dependencies inline."
- `clm_8d2d12971924` — "Bundled files are referenced by relative paths from the skill directory root, which the agent resolves automatically, and the same convention holds inside support files because the agent runs commands from that root." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "Use **relative paths from the skill directory root** to reference bundled files."
- `clm_9426ac2144b2` — "One-off commands invoked from a skill should pin tool versions so the command behaves the same over time, and prerequisites should be stated in SKILL.md rather than assumed of the agent's environment." · p 0.86 · active · 1 support · 0 contradict
  - `src_779a634dd418` Using scripts in skills: "**Pin versions** (e.g., `npx eslint@9.0.0`) so the command behaves the same over time."

## Timeline

- 2026-08-25 new_claim `clm_e6ce55d5ec53` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_816dfea9130f` (src_779a634dd418)
- 2026-08-25 new_claim `clm_62002b0c8bcd` (src_779a634dd418)
- 2026-08-25 new_claim `clm_5b0d73dd8f51` (src_779a634dd418)
- 2026-08-25 new_claim `clm_0746c2102164` (src_779a634dd418)
- 2026-08-25 new_claim `clm_284494b4fbe2` (src_779a634dd418)
- 2026-08-25 new_claim `clm_8956097bdc7d` (src_779a634dd418)
- 2026-08-25 new_claim `clm_9426ac2144b2` (src_779a634dd418)
- 2026-08-25 new_claim `clm_fe9dbad7e857` (src_779a634dd418)
- 2026-08-25 new_claim `clm_8d2d12971924` (src_779a634dd418)
- 2026-08-25 new_claim `clm_2902d30214ab` (src_779a634dd418)
- 2026-08-25 new_claim `clm_73dc3e6d79f8` (src_779a634dd418)
- 2026-08-25 new_claim `clm_bc04d29e3d9d` (src_6932f817f8b4)

## Related

- → part_of [[skill-md]] (0.97)
- → part_of [[agent-skills]] (0.92)
- → part_of [[skills]] (0.86)
- [[skill-md]] — 3 shared claims
- [[agent-skills]] — 1 shared claim
- [[skills]] — 1 shared claim
