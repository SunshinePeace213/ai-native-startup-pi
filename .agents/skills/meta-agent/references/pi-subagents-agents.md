---
source: pi-subagents 0.67 docs/agents.md · docs/models.md · docs/tool-reference.md
also: https://github.com/nicobailon/pi-subagents
fetched: 2026-09-12
---

# Agents in pi-subagents, distilled

An agent is one Markdown file: YAML frontmatter that defines the child session,
then the system prompt. The parent Pi launches it with
`subagent({ agent: "<name>", task: "..." })` and receives its final message.

## Where agents live

Lowest to highest priority; higher shadows lower on a name collision.

| Scope | Path |
| --- | --- |
| Builtin | inside the package: `scout`, `researcher`, `evidence-auditor`, `worker`, `reviewer`, `oracle`, `delegate` |
| Installed package | `pi.subagents.agents` in a package manifest |
| User | `~/.pi/agent/agents/**/*.md` |
| Project | `.pi/agents/**/*.md` — **this repo's location** |

- Discovery is recursive. `.chain.md` files are not agents.
- The legacy `.agents/**/*.md` tree is also scanned, but `.agents/skills/` is
  skipped, so skills and agents do not collide.
- `/reload` picks up a new or edited file. `subagent({ action: "list" })`
  shows what resolved; `subagent({ action: "get", agent })` shows one.
- `subagent({ action: "eject", agent: "reviewer", agentScope: "project" })`
  copies a builtin into `.pi/agents/` as an editable file that shadows it.

## How the parent chooses an agent

There is no automatic routing. The parent model reads the request, decides to
delegate, and names the agent. Two things inform that choice:

- `subagent({ action: "list" })` — every agent's name and description.
- `advertise: true` — puts the name and description into the parent system
  prompt catalog. Capped at 16 agents and 512 UTF-8 bytes per description;
  entries that do not fit are dropped silently.

The description is therefore the whole routing surface. Write it as the
situation that should reach this agent, not as a summary of the prompt.

## What reaches the child — nothing unless you opt in

Custom agents start with a **clean system prompt** and only what the
frontmatter grants. This is the opposite of a Claude Code subagent.

| Field | Default | Effect |
| --- | --- | --- |
| `systemPromptMode` | `replace` | `append` keeps Pi's base prompt under yours |
| `inheritProjectContext` | `false` | Include `AGENTS.md` / `CLAUDE.md` from the repo |
| `inheritGlobalContext` | `false` | Also `~/.pi/agent/AGENTS.md`; needs project context on |
| `inheritSkills` | `false` | Show the child Pi's skills catalog |
| `skills` | none | Hand-pick skills regardless of `inheritSkills`; `read` is added so it can load them |
| `skillPath` | none | Private skill dirs, relative to the agent file |
| `defaultContext` | `fresh` | `fork` prefers the parent's conversation history when the launch omits `context` |
| `defaultReads` | none | Files read before the task (`context.md`, `plan.md`) |

Builtins set `inheritProjectContext: true` and `inheritSkills: false`. A
project agent that must follow repo conventions needs the same line.

## Tools and extensions

- `tools` omitted: Pi's normal builtins (`read`, `bash`, `edit`, `write`,
  `grep`, `find`, `ls`). Present: a strict allowlist. Empty: no tools.
- `excludeTools` narrows after resolution.
- pi-subagents runtime tools you may list: `contact_supervisor` (escalate to
  the parent and wait), `subagent` (nested fanout, also via
  `allowNestedSubagents: true`). Children never get `subagent` otherwise.
- An extension tool in `tools` (`web_search`, `ask_user_question`, `mcp:*`)
  does **not** load its extension. **Foreground children never load ambient
  extensions.** Either list the provider in `extensions` /
  `subagentOnlyExtensions`, or make the agent `async: true` so it runs in the
  background runner, which does load them. A foreground launch that needs an
  ambient extension fails with a diagnostic. Before the first model turn every
  explicit tool name is checked against the child registry; a missing provider
  fails the run.
- `ask_user_question` is stripped from any run without a UI. A child never
  asks the user; it escalates through `contact_supervisor` or reports the open
  decision in its final message.
- Agents with only read-only builtins skip the completion guard. `bash` is
  mutation-capable: a bash-holding reviewer or validator sets
  `completionGuard: false` or risks being judged as an implementation agent
  that made no edits.

## Frontmatter reference

| Field | Notes |
| --- | --- |
| `name` | Required. Unique across builtin, user, project. |
| `description` | Required. The routing surface. ≤512 bytes when advertised. |
| `aliases` | Extra names that resolve to this agent. |
| `advertise` | `true` to enter the parent-prompt catalog. |
| `package` | Registers as `<package>.<name>`. |
| `tools`, `excludeTools`, `allowNestedSubagents` | See above. Comma list or `- item` block. |
| `extensions`, `subagentOnlyExtensions` | Child extension loading; see above. |
| `model` | Prefer omitting: **model names are deployment policy** and belong in `.pi/settings.json` `subagents.agentOverrides.<name>.model`. `inherit` selects the parent's model. |
| `fallbackModels` | Ordered backups for provider failures before tool use. |
| `thinking` | `off` … `max`; the capability knob that belongs in the file. |
| `systemPromptMode`, `inheritProjectContext`, `inheritGlobalContext`, `inheritSkills`, `skills`, `skillPath`, `defaultContext`, `defaultReads` | See the context table. |
| `output` | Default output file for single launches. |
| `defaultProgress` | Maintain `progress.md`. |
| `async` | Default a single launch to background. Required for ambient-extension tools. |
| `timeoutMs`, `toolTimeoutMs` | Run and per-tool deadlines. Foreground default 30 min. |
| `acceptance`, `acceptanceRole` | Acceptance gate default; `read-only` or `writer` role for inference. |
| `completionGuard` | `false` for bash-holding non-implementation agents. |
| `mutationTools` | Extension tools that count as edits for the guard. |
| `maxSubagentDepth` | Tightens nested delegation. |
| `memory` | `{ scope: project\|user, path: <dir> }`; first 200 lines of `MEMORY.md` injected; write-capable agents may append. |

Settings overrides (`.pi/settings.json` → `subagents.agentOverrides.<name>`)
replace the same fields for builtin, package, user, and project agents:
`description`, `model`, `thinking`, `tools`, `systemPrompt`,
`inheritProjectContext`, `defaultContext`, `skills`, `disabled`, and more.
Project overrides beat user overrides.

## Refinement overlays

When an agent keeps stumbling on the same project-specific issue,
`subagent({ action: "refine", agent })` drafts a bounded guidance overlay from
its recent runs and stores it at `.pi/subagents/refinements/<agent>.md`,
injected at launch without touching the agent file. `refine.show` and
`refine.rollback` manage it. Use this before editing a builtin.

## Launch-time fields the parent controls

`context: "fresh" | "fork"`, `async`, `output`, `outputMode: "file-only"`,
`skill`, `timeoutMs`, `acceptance`. Agent defaults fill in what the call
omits. Multi-step work is a `workflowScript` with `runs.run` and `runs.all`;
`subagent({ action: "validate", workflowScript })` checks one statically.
