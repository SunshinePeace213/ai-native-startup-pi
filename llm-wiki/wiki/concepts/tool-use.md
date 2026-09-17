---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/pi/extensions.md, title: "Extensions", id: src_a49af96a95e8}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_tool_use]
claim_ids: [clm_246cd8a77124, clm_3c016c102ee5, clm_d2bc28df6adf, clm_db99fcce3d9f, clm_6950c62639be, clm_53036c4f5724, clm_f80283eafc06, clm_c29788ac7b83, clm_57fe4f170ef5]
confidence: 0.89
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# tool use

> **In here:** In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel… · 9 claims, confidence 0.89.

## Current understanding

- A Pi extension is a TypeScript module that subscribes to lifecycle events, registers LLM-callable custom tools, and adds commands (0.94)
- In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel, which costs tokens, a round trip, and wall-clock time without affecting answer quality (0.93)
- Pi's built-in tool set is read, bash, powershell on Windows, edit, write, grep, find, and ls (0.92)
- Pi accepts registerTool calls after startup as well as at load, refreshing the new tool into the same session so the LLM can call it without a /reload (0.92)
- A Pi extension's tool_call handler can block a tool call by returning block with an optional reason and terminate flag, and can patch arguments by mutating event.input in place (0.92)
- Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities (0.91)
- A skill's `allowed-tools` pre-approves the listed tools only for the turn that invokes the skill and never restricts the tool pool — every tool stays callable and normal permission settings govern the rest (0.89)
- The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete (0.81)
- Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools (0.77)

## Evidence

- `clm_246cd8a77124` — "A Pi extension is a TypeScript module that subscribes to lifecycle events, registers LLM-callable custom tools, and adds commands." · p 0.94 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Extensions are TypeScript modules that extend pi's behavior. They can subscribe to lifecycle events, register custom tools callable by the LLM, add commands, and more."
- `clm_3c016c102ee5` — "In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel, which costs tokens, a round trip, and wall-clock time without affecting answer quality." · p 0.93 · active · 1 support · 0 contradict · when: in coding and computer-use agent loops
  - `src_9f2ae1e705ce` Delivering work: "The exception is coding and computer-use loops where the next independent calls are implied by the task rather than explicitly requested (custom coding agents, bash-and-editor harnesses, computer use): there it may issue them one per turn…"
- `clm_d2bc28df6adf` — "Pi's built-in tool set is read, bash, powershell on Windows, edit, write, grep, find, and ls." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "Built-in tools: `read`, `bash`, `powershell` (Windows), `edit`, `write`, `grep`, `find`, `ls`."
- `clm_db99fcce3d9f` — "Pi accepts registerTool calls after startup as well as at load, refreshing the new tool into the same session so the LLM can call it without a /reload." · p 0.92 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "`pi.registerTool()` works both during extension load and after startup. You can call it inside `session_start`, command handlers, or other event handlers."
- `clm_6950c62639be` — "A Pi extension's tool_call handler can block a tool call by returning block with an optional reason and terminate flag, and can patch arguments by mutating event.input in place." · p 0.92 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Return values from `tool_call` control blocking via `{ block: true, reason?: string, terminate?: boolean }`"
- `clm_53036c4f5724` — "Ng's four design patterns are the vocabulary of agentic design: Reflection lets a model inspect and revise its work, Tool Use lets it obtain information outside its parameters, Planning lets it select steps, and Multi-Agent Collaboration lets multiple instances contribute distinct capabilities" · p 0.91 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Reflection lets a model inspect and revise its work. Tool Use lets it obtain information outside its parameters. Planning lets it select steps. Multi-Agent Collaboration lets multiple instances contribute distinct capabilities."
- `clm_f80283eafc06` — "A skill's `allowed-tools` pre-approves the listed tools only for the turn that invokes the skill and never restricts the tool pool — every tool stays callable and normal permission settings govern the rest." · p 0.89 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "The `allowed-tools` field grants permission for the listed tools during the turn that invokes the skill, so Claude can use them without prompting you for approval."
- `clm_c29788ac7b83` — "The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete." · p 0.81 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "At its core, an agent is just a model calling tools in a loop until a task is complete."
- `clm_57fe4f170ef5` — "Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "This gives models a computer and lets them figure out the rest autonomously. The model can design its own tools on the fly via code instead of being constrained to pre-configured tools."

## Timeline

- 2026-08-23 new_claim `clm_53036c4f5724` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_57fe4f170ef5` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_c29788ac7b83` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_f80283eafc06` (src_07950e24c4ee)
- 2026-09-02 new_claim `clm_3c016c102ee5` (src_9f2ae1e705ce)
- 2026-09-11 new_claim `clm_d2bc28df6adf` (src_ab670f25c35e)
- 2026-09-11 new_claim `clm_246cd8a77124` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_6950c62639be` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_db99fcce3d9f` (src_a49af96a95e8)

## Related

- ← uses [[pi]] (0.93)
- ← applies_to [[pi-extension]] (0.93)
- ← uses [[claude-fable-5-1]] (0.93)
- → part_of [[agentic-workflow]] (0.91)
- ← uses [[agent-loops]] (0.81)
- ← related_to [[bash-tool]] (0.78)
- [[pi]] — 4 shared claims
- [[pi-extension]] — 3 shared claims
- [[agent-harness]] — 1 shared claim
- [[agent-loops]] — 1 shared claim
- [[agentic-workflow]] — 1 shared claim
- [[allowed-tools]] — 1 shared claim
- [[andrew-ng]] — 1 shared claim
- [[bash-tool]] — 1 shared claim
- [[claude-fable-5-1]] — 1 shared claim
- [[loop-engineering]] — 1 shared claim
- [[multi-agent-collaboration]] — 1 shared claim
- [[permission-system]] — 1 shared claim
- [[planning]] — 1 shared claim
- [[reflection]] — 1 shared claim
- [[skills]] — 1 shared claim
