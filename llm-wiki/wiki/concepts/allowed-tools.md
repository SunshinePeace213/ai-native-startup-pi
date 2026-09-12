---
type: concept
status: current
created: 2026-08-25
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/docs/agent-skills/specification.md, title: "Specification", id: src_7bd75101edfa}
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_allowed_tools]
claim_ids: [clm_6934fabe9f66, clm_bd5e3c93d364, clm_b77585e8f900, clm_f80283eafc06, clm_0cd42294ec12]
confidence: 0.92
stale_after: 2027-01-09
last_rendered: 2026-09-05T16:35:43Z
review_required: false
---

# allowed-tools

> **In here:** The optional allowed-tools field is a space-separated string of pre-approved tools and is explicitly experimental, so support for it may vary between agent implementations · 5 claims, confidence 0.92.

## Current understanding

- With a plain-text prompt the action gives Claude no shell or GitHub API access until the workflow grants the tools the prompt needs, through `--allowedTools` in `claude_args` or a `permissions.allow` rule in the `settings` input; invoking a skill instead lets Claude use the tools its `allowed-tools` frontmatter grants (0.93)
- A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts inline comments only when `--allowedTools` in `claude_args` names it (0.93)
- Beyond name and description the spec defines four optional frontmatter fields: license, compatibility (max 500 characters, for environment requirements), metadata (an arbitrary string-to-string map), and the experimental allowed-tools (0.91)
- A skill's `allowed-tools` pre-approves the listed tools only for the turn that invokes the skill and never restricts the tool pool — every tool stays callable and normal permission settings govern the rest (0.91)
- The optional allowed-tools field is a space-separated string of pre-approved tools and is explicitly experimental, so support for it may vary between agent implementations (0.90)

## Evidence

- `clm_6934fabe9f66` — "With a plain-text prompt the action gives Claude no shell or GitHub API access until the workflow grants the tools the prompt needs, through `--allowedTools` in `claude_args` or a `permissions.allow` rule in the `settings` input; invoking a skill instead lets Claude use the tools its `allowed-tools` frontmatter grants." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "For a plain-text prompt, Claude has no shell or GitHub API access until you grant the tools the prompt needs, with `--allowedTools` in `claude_args` or a [`permissions.allow` rule](/docs/en/permissions#permission-rule-syntax) in the…"
- `clm_bd5e3c93d364` — "A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts inline comments only when `--allowedTools` in `claude_args` names it." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "**`claude_args`**: keep this line even though the skill's own `allowed-tools` frontmatter names the same tool, because the Claude Code GitHub Action starts the MCP server that posts inline comments only when `--allowedTools` in…"
- `clm_b77585e8f900` — "Beyond name and description the spec defines four optional frontmatter fields: license, compatibility (max 500 characters, for environment requirements), metadata (an arbitrary string-to-string map), and the experimental allowed-tools." · p 0.91 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Max 500 characters. Indicates environment requirements (intended product, system packages, network access, etc.)."
- `clm_f80283eafc06` — "A skill's `allowed-tools` pre-approves the listed tools only for the turn that invokes the skill and never restricts the tool pool — every tool stays callable and normal permission settings govern the rest." · p 0.91 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "The `allowed-tools` field grants permission for the listed tools during the turn that invokes the skill, so Claude can use them without prompting you for approval."
- `clm_0cd42294ec12` — "The optional allowed-tools field is a space-separated string of pre-approved tools and is explicitly experimental, so support for it may vary between agent implementations." · p 0.90 · active · 1 support · 0 contradict
  - `src_7bd75101edfa` Specification: "Experimental. Support for this field may vary between agent implementations"

## Timeline

- 2026-08-23 new_claim `clm_f80283eafc06` (src_07950e24c4ee)
- 2026-08-25 new_claim `clm_b77585e8f900` (src_7bd75101edfa)
- 2026-08-25 new_claim `clm_0cd42294ec12` (src_7bd75101edfa)
- 2026-08-30 new_claim `clm_6934fabe9f66` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_bd5e3c93d364` (src_7962dafdd21b)

## Related

- ← depends_on [[mcp-server]] (0.93)
- ← produces [[skills]] (0.93)
- ← uses [[claude-code-github-action]] (0.93)
- ← uses [[skills]] (0.93)
- → part_of [[agent-skills]] (0.92)
- → part_of [[skill-md]] (0.91)
- [[agent-skills]] — 2 shared claims
- [[claude-code-github-action]] — 2 shared claims
- [[skills]] — 2 shared claims
- [[mcp-server]] — 1 shared claim
- [[skill-md]] — 1 shared claim
- [[tool-use]] — 1 shared claim
