---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
  - {resource: llm-wiki/raw/docs/claude-code/permission-modes.md, title: "Choose a permission mode", id: src_4a22e1f99f87}
  - {resource: llm-wiki/raw/docs/claude-code/settings.md, title: "Claude Code settings", id: src_44aa3ffce603}
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_permission_rule]
claim_ids: [clm_fa5f76bf370c, clm_1cbbd4529c24, clm_4a55a86ff637, clm_6ce4b501b320, clm_c381a5766221, clm_f10e48934a62, clm_9d7ccdfee9ae, clm_a9afd6afe40a, clm_77abb4f39957]
confidence: 0.91
stale_after: 2027-01-06
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# permission rule

> **In here:** Every surface that names a Claude Code tool — settings permissions, CLI flags, subagent and skill frontmatter, and hook conditions · 9 claims, confidence 0.91.

## Current understanding

- Every surface that names a Claude Code tool — settings permissions, CLI flags, subagent and skill frontmatter, and hook conditions — uses the same `ToolName(specifier)` rule format, with the specifier's shape set by the tool and shared across several tools (0.93)
- Permission modes only set the baseline that allow, ask, and deny rules layer on top of: deny rules block in every mode including `bypassPermissions`, where allow rules have no effect at all (0.93)
- Claude Code's read-only file tools such as Read, Grep, and Glob run without a permission prompt inside the working directory but still prompt for paths outside it, while Bash prompts by default yet runs a built-in set of read-only commands without prompting (0.93)
- A list-valued settings key such as `permissions.allow` set in more than one settings file is combined rather than overridden, so each file adds entries without removing another file's (0.93)
- Read and Edit deny rules reach only the file commands Claude Code recognizes inside Bash, not arbitrary subprocesses that open files themselves, so OS-level enforcement across every process requires enabling the sandbox (0.93)
- In Claude Code an `Edit(...)` allow rule also grants read access to the same path, and a `Read(...)` deny rule also blocks Edit and Write there — including creating a new file — because both write tools change content Claude has to read back (0.93)
- `dontAsk` mode auto-denies every tool call that would otherwise prompt, leaving Claude only the actions matching `permissions.allow` rules, read-only Bash commands, and calls a `PreToolUse` hook approves (0.89)
- A committed `.claude/settings.json` does not reach a teammate's session until they trust the folder for `permissions.allow` rules, `additionalDirectories`, `extraKnownMarketplaces`, and most `env` values, while `deny` and `ask` rules apply right away (0.89)
- Permission rules, a skill's allowed-tools list, a subagent's tools field, and hook matchers must all name a plugin-bundled MCP tool by its full callable name — a matcher written against the bare server key never fires (0.88)

## Evidence

- `clm_fa5f76bf370c` — "Every surface that names a Claude Code tool — settings permissions, CLI flags, subagent and skill frontmatter, and hook conditions — uses the same `ToolName(specifier)` rule format, with the specifier's shape set by the tool and shared across several tools." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "All of these accept the same rule format, `ToolName(specifier)`. The specifier depends on the tool, and several tools share a format:"
- `clm_1cbbd4529c24` — "Permission modes only set the baseline that allow, ask, and deny rules layer on top of: deny rules block in every mode including `bypassPermissions`, where allow rules have no effect at all." · p 0.93 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "Modes set the baseline. Layer [permission rules](/docs/en/permissions#manage-permissions) on top to pre-approve or block specific tools. Deny rules block in every mode, including `bypassPermissions`."
- `clm_4a55a86ff637` — "Claude Code's read-only file tools such as Read, Grep, and Glob run without a permission prompt inside the working directory but still prompt for paths outside it, while Bash prompts by default yet runs a built-in set of read-only commands without prompting." · p 0.93 · active · 1 support · 0 contradict · when: in Manual permission mode
  - `src_ab9f8f38615f` Tools reference: "The `Permission required` column shows whether the tool prompts in [Manual mode](/docs/en/permission-modes) for paths inside the working directory."
- `clm_6ce4b501b320` — "A list-valued settings key such as `permissions.allow` set in more than one settings file is combined rather than overridden, so each file adds entries without removing another file's." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "When you set the same list key, such as `permissions.allow`, in more than one file, Claude Code combines the lists instead of picking one, so each file can add entries without removing another file's."
- `clm_c381a5766221` — "Read and Edit deny rules reach only the file commands Claude Code recognizes inside Bash, not arbitrary subprocesses that open files themselves, so OS-level enforcement across every process requires enabling the sandbox." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "[Read and Edit deny rules](/docs/en/permissions#tool-specific-permission-rules) also apply to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, `sed`, and `grep`, but not to arbitrary subprocesses that read or…"
- `clm_f10e48934a62` — "In Claude Code an `Edit(...)` allow rule also grants read access to the same path, and a `Read(...)` deny rule also blocks Edit and Write there — including creating a new file — because both write tools change content Claude has to read back." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "An `Edit(...)` allow rule also grants read access to the same path, so you don't need a matching `Read(...)` rule."
- `clm_9d7ccdfee9ae` — "`dontAsk` mode auto-denies every tool call that would otherwise prompt, leaving Claude only the actions matching `permissions.allow` rules, read-only Bash commands, and calls a `PreToolUse` hook approves." · p 0.89 · active · 1 support · 0 contradict
  - `src_4a22e1f99f87` Choose a permission mode: "If you set `dontAsk` mode, Claude Code auto-denies every tool call that would otherwise prompt you."
- `clm_a9afd6afe40a` — "A committed `.claude/settings.json` does not reach a teammate's session until they trust the folder for `permissions.allow` rules, `additionalDirectories`, `extraKnownMarketplaces`, and most `env` values, while `deny` and `ask` rules apply right away." · p 0.89 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "**The key waits for trust.** `permissions.allow` rules, `permissions.additionalDirectories`, `extraKnownMarketplaces`, and most [`env`](/docs/en/settings-reference#env) values apply only after each teammate [trusts the…"
- `clm_77abb4f39957` — "Permission rules, a skill's allowed-tools list, a subagent's tools field, and hook matchers must all name a plugin-bundled MCP tool by its full callable name — a matcher written against the bare server key never fires." · p 0.88 · active · 1 support · 0 contradict · when: for plugin-bundled MCP servers
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Use this full name when referencing the tool in [permission rules](/docs/en/permissions), a skill's `allowed-tools` list, a [subagent's `tools` field](/docs/en/sub-agents#available-tools), or a [hook…"

## Timeline

- 2026-08-23 new_claim `clm_77abb4f39957` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_4a55a86ff637` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_fa5f76bf370c` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_f10e48934a62` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_c381a5766221` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_6ce4b501b320` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_a9afd6afe40a` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_9d7ccdfee9ae` (src_4a22e1f99f87)
- 2026-08-23 new_claim `clm_1cbbd4529c24` (src_4a22e1f99f87)

## Related

- → applies_to [[claude-code]] (0.99)
- → applies_to [[bash-tool]] (0.93)
- → applies_to [[edit-tool]] (0.93)
- → applies_to [[permission-mode]] (0.93)
- → depends_on [[workspace-trust]] (0.93)
- ← extends [[sandbox]] (0.93)
- [[claude-code]] — 6 shared claims
- [[permission-mode]] — 2 shared claims
- [[settings-file]] — 2 shared claims
- [[bash-tool]] — 1 shared claim
- [[edit-tool]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[mcp-tool]] — 1 shared claim
- [[read-tool]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
- working directory (no page yet)
- Write tool (no page yet)
