---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/compaction.md, title: "Compaction & Branch Summarization", id: src_f3c56d2c0088}
  - {resource: llm-wiki/raw/docs/pi/containerization.md, title: "Containerization", id: src_02faa5c62172}
  - {resource: llm-wiki/raw/docs/pi/extensions.md, title: "Extensions", id: src_a49af96a95e8}
  - {resource: llm-wiki/raw/docs/pi/packages.md, title: "Pi Packages", id: src_1589290f55f3}
  - {resource: llm-wiki/raw/docs/pi/rpc.md, title: "RPC Mode", id: src_3c01fb9c03bd}
  - {resource: llm-wiki/raw/docs/pi/sdk.md, title: "SDK", id: src_0954e1c03a59}
  - {resource: llm-wiki/raw/docs/pi/security.md, title: "Security", id: src_38afec4a51af}
  - {resource: llm-wiki/raw/docs/pi/session-format.md, title: "Session File Format", id: src_92c377275d79}
  - {resource: llm-wiki/raw/docs/pi/tui.md, title: "TUI Components", id: src_1d072e1d683a}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_pi_extension]
claim_ids: [clm_246cd8a77124, clm_a26c56900670, clm_ad0fdc5c03ce, clm_f36a84a463a4, clm_cfe96221e72b, clm_e0c84f167157, clm_5ca433e00ea6, clm_570f712c6a4f, clm_70cca73a77f7, clm_985fa12b1b2a, clm_07c0f6c720a3, clm_149a0483eb0e, clm_1d62f096ecfe, clm_74ad73ec8056, clm_8a1d3d106aae, clm_db99fcce3d9f, clm_64156597f767, clm_6950c62639be, clm_e467f67072a9, clm_1b9e0668b95f, clm_8dd60325cd78, clm_ec17dbea2a46]
confidence: 0.93
stale_after: 2027-01-29
last_rendered: 2026-09-11T20:02:51Z
review_required: false
---

# pi extension

> **In here:** A Pi extension can intercept compaction through the session_before_compact event to cancel it outright or supply its own summary · 22 claims, confidence 0.93.

## Current understanding

- A Pi extension is a TypeScript module that subscribes to lifecycle events, registers LLM-callable custom tools, and adds commands (0.94)
- A Pi package bundles extensions, skills, prompt templates, and themes for sharing over npm or git, declaring its resources under the pi key of package.json or through conventional directories (0.94)
- Pi ships no built-in sandbox: its built-in tools read, write, edit, and run shell commands with the permissions of the pi process, and extensions are TypeScript modules running at those same permissions (0.94)
- Pi's design keeps the agent core small and pushes workflow-specific behavior out into extensions, skills, prompt templates, and packages (0.94)
- Pi extensions run with the user's full system permissions and can execute arbitrary code, so only trusted sources should be installed (0.93)
- Pi extensions and custom tools can draw their own TUI components to build interactive interfaces inside the agent (0.93)
- Pi deliberately ships without built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash, leaving those to extensions, packages, or external tools such as containers and tmux (0.93)
- A Pi extension factory may run in an invocation that never starts a session, so background resources — processes, sockets, watchers, timers — must be deferred to session_start or the handler that needs them (0.93)
- Only extensions placed in Pi's auto-discovered locations can be hot-reloaded with /reload; a -e path is for quick tests (0.93)
- Pi extensions execute wherever the pi process itself runs, so under a host-side tool-routing extension every other custom extension tool still runs on the host unless it delegates its own operations (0.93)
- A Pi extension can intercept compaction through the session_before_compact event to cancel it outright or supply its own summary (0.93)
- Pi's RPC mode carries extension dialogs as a request/response sub-protocol: a dialog method emits an extension_ui_request on stdout and blocks until the client returns a matching extension_ui_response on stdin (0.93)
- createAgentSession() draws extensions, skills, prompt templates, themes, and context files from a ResourceLoader, defaulting to DefaultResourceLoader with standard discovery when none is supplied (0.93)
- The first user/global or CLI Pi extension whose project_trust handler answers yes or no owns the trust decision and suppresses the built-in prompt; undecided passes it on (0.93)
- A Pi CustomEntry persists extension state in the session file without taking part in the LLM context (0.93)
- Pi accepts registerTool calls after startup as well as at load, refreshing the new tool into the same session so the LLM can call it without a /reload (0.93)
- A Pi CustomMessageEntry is the extension-injected counterpart that does enter the LLM context, unlike a CustomEntry (0.93)
- A Pi extension's tool_call handler can block a tool call by returning block with an optional reason and terminate flag, and can patch arguments by mutating event.input in place (0.93)
- In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI (0.93)
- Pi's guidance is to reuse the built-in SelectList, SettingsList, and BorderedLoader components, which cover about 90% of extension UI cases, rather than rebuild them (0.92)
- The Gondolin extension keeps pi on the host while mounting the host working directory at /workspace inside a Linux micro-VM and overriding the read, write, edit, bash, grep, find, and ls tools to run there (0.92)
- Pi appends a custom tool's promptGuidelines bullets flat into the shared Guidelines section with no tool-name prefix, so each bullet must name its own tool rather than say "this tool" (0.92)

## Evidence

- `clm_246cd8a77124` — "A Pi extension is a TypeScript module that subscribes to lifecycle events, registers LLM-callable custom tools, and adds commands." · p 0.94 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Extensions are TypeScript modules that extend pi's behavior. They can subscribe to lifecycle events, register custom tools callable by the LLM, add commands, and more."
- `clm_a26c56900670` — "A Pi package bundles extensions, skills, prompt templates, and themes for sharing over npm or git, declaring its resources under the pi key of package.json or through conventional directories." · p 0.94 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "Pi packages bundle extensions, skills, prompt templates, and themes so you can share them through npm or git. A package can declare resources in `package.json` under the `pi` key, or use conventional directories."
- `clm_ad0fdc5c03ce` — "Pi ships no built-in sandbox: its built-in tools read, write, edit, and run shell commands with the permissions of the pi process, and extensions are TypeScript modules running at those same permissions." · p 0.94 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Pi does not include a built-in sandbox. Built-in tools can read files, write files, edit files, and run shell commands with the permissions of the pi process. Extensions are TypeScript modules that run with the same permissions."
- `clm_f36a84a463a4` — "Pi's design keeps the agent core small and pushes workflow-specific behavior out into extensions, skills, prompt templates, and packages." · p 0.94 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "Pi keeps the core small and pushes workflow-specific behavior into extensions, skills, prompt templates, and packages."
- `clm_cfe96221e72b` — "Pi extensions run with the user's full system permissions and can execute arbitrary code, so only trusted sources should be installed." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Extensions run with your full system permissions and can execute arbitrary code. Only install from sources you trust."
- `clm_e0c84f167157` — "Pi extensions and custom tools can draw their own TUI components to build interactive interfaces inside the agent." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "Extensions and custom tools can render custom TUI components for interactive user interfaces."
- `clm_5ca433e00ea6` — "Pi deliberately ships without built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash, leaving those to extensions, packages, or external tools such as containers and tmux." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "It intentionally does not include built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash. You can build or install those workflows as extensions or packages, or use external tools such as containers and tmux."
- `clm_570f712c6a4f` — "A Pi extension factory may run in an invocation that never starts a session, so background resources — processes, sockets, watchers, timers — must be deferred to session_start or the handler that needs them." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Extension factories may run in invocations that never start a session. Do not start background resources such as processes, sockets, file watchers, or timers from the factory."
- `clm_70cca73a77f7` — "Only extensions placed in Pi's auto-discovered locations can be hot-reloaded with /reload; a -e path is for quick tests." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Extensions in auto-discovered locations can be hot-reloaded with `/reload`."
- `clm_985fa12b1b2a` — "Pi extensions execute wherever the pi process itself runs, so under a host-side tool-routing extension every other custom extension tool still runs on the host unless it delegates its own operations." · p 0.93 · active · 1 support · 0 contradict
  - `src_02faa5c62172` Containerization: "Extensions run wherever the `pi` process runs. If you run host `pi` with a tool-routing extension, other custom extension tools still run on the host unless they also delegate their operations."
- `clm_07c0f6c720a3` — "A Pi extension can intercept compaction through the session_before_compact event to cancel it outright or supply its own summary." · p 0.93 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "Fired before auto-compaction or `/compact`. Can cancel or provide custom summary."
- `clm_149a0483eb0e` — "Pi's RPC mode carries extension dialogs as a request/response sub-protocol: a dialog method emits an extension_ui_request on stdout and blocks until the client returns a matching extension_ui_response on stdin." · p 0.93 · active · 1 support · 0 contradict
  - `src_3c01fb9c03bd` RPC Mode: "**Dialog methods** (`select`, `confirm`, `input`, `editor`): emit an `extension_ui_request` on stdout and block until the client sends back an `extension_ui_response` on stdin with the matching `id`."
- `clm_1d62f096ecfe` — "createAgentSession() draws extensions, skills, prompt templates, themes, and context files from a ResourceLoader, defaulting to DefaultResourceLoader with standard discovery when none is supplied." · p 0.93 · active · 1 support · 0 contradict
  - `src_0954e1c03a59` SDK: "`createAgentSession()` uses a `ResourceLoader` to supply extensions, skills, prompt templates, themes, and context files. If you do not provide one, it uses `DefaultResourceLoader` with standard discovery."
- `clm_74ad73ec8056` — "The first user/global or CLI Pi extension whose project_trust handler answers yes or no owns the trust decision and suppresses the built-in prompt; undecided passes it on." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "A user/global or CLI extension that returns `"yes"` or `"no"` owns the decision; the first yes/no decision wins and suppresses the built-in trust prompt."
- `clm_8a1d3d106aae` — "A Pi CustomEntry persists extension state in the session file without taking part in the LLM context." · p 0.93 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Extension state persistence. Does NOT participate in LLM context."
- `clm_db99fcce3d9f` — "Pi accepts registerTool calls after startup as well as at load, refreshing the new tool into the same session so the LLM can call it without a /reload." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "`pi.registerTool()` works both during extension load and after startup. You can call it inside `session_start`, command handlers, or other event handlers."
- `clm_64156597f767` — "A Pi CustomMessageEntry is the extension-injected counterpart that does enter the LLM context, unlike a CustomEntry." · p 0.93 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Extension-injected messages that DO participate in LLM context."
- `clm_6950c62639be` — "A Pi extension's tool_call handler can block a tool call by returning block with an optional reason and terminate flag, and can patch arguments by mutating event.input in place." · p 0.93 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "Return values from `tool_call` control blocking via `{ block: true, reason?: string, terminate?: boolean }`"
- `clm_e467f67072a9` — "In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI." · p 0.93 · active · 1 support · 0 contradict · when: in RPC mode
  - `src_3c01fb9c03bd` RPC Mode: "Note: `ctx.mode` is `"rpc"` and `ctx.hasUI` is `true` in RPC mode because the dialog and fire-and-forget methods are functional via the extension UI sub-protocol."
- `clm_1b9e0668b95f` — "Pi's guidance is to reuse the built-in SelectList, SettingsList, and BorderedLoader components, which cover about 90% of extension UI cases, rather than rebuild them." · p 0.92 · active · 1 support · 0 contradict
  - `src_1d072e1d683a` TUI Components: "`SelectList`, `SettingsList`, `BorderedLoader` cover 90% of cases. Don't rebuild them."
- `clm_8dd60325cd78` — "The Gondolin extension keeps pi on the host while mounting the host working directory at /workspace inside a Linux micro-VM and overriding the read, write, edit, bash, grep, find, and ls tools to run there." · p 0.92 · active · 1 support · 0 contradict · when: under the Gondolin micro-VM pattern
  - `src_02faa5c62172` Containerization: "The extension mounts the host cwd at `/workspace` in the VM and overrides `read`, `write`, `edit`, `bash`, `grep`, `find`, and `ls`."
- `clm_ec17dbea2a46` — "Pi appends a custom tool's promptGuidelines bullets flat into the shared Guidelines section with no tool-name prefix, so each bullet must name its own tool rather than say "this tool"." · p 0.92 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "`promptGuidelines` bullets are appended flat to the `Guidelines` section with no tool name prefix. Each guideline must name the tool it refers to — avoid "Use this tool when..." because the LLM cannot tell which tool "this" means."

## Timeline

- 2026-09-11 new_claim `clm_ad0fdc5c03ce` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_985fa12b1b2a` (src_02faa5c62172)
- 2026-09-11 new_claim `clm_8dd60325cd78` (src_02faa5c62172)
- 2026-09-11 new_claim `clm_f36a84a463a4` (src_ab670f25c35e)
- 2026-09-11 new_claim `clm_5ca433e00ea6` (src_ab670f25c35e)
- 2026-09-11 new_claim `clm_07c0f6c720a3` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_a26c56900670` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_8a1d3d106aae` (src_92c377275d79)
- 2026-09-11 new_claim `clm_64156597f767` (src_92c377275d79)
- 2026-09-11 new_claim `clm_e0c84f167157` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_1b9e0668b95f` (src_1d072e1d683a)
- 2026-09-11 new_claim `clm_246cd8a77124` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_cfe96221e72b` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_70cca73a77f7` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_6950c62639be` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_570f712c6a4f` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_74ad73ec8056` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_db99fcce3d9f` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_ec17dbea2a46` (src_a49af96a95e8)
- 2026-09-11 new_claim `clm_1d62f096ecfe` (src_0954e1c03a59)
- 2026-09-11 new_claim `clm_149a0483eb0e` (src_3c01fb9c03bd)
- 2026-09-11 new_claim `clm_e467f67072a9` (src_3c01fb9c03bd)

## Related

- → part_of [[pi]] (0.99)
- → extends [[pi]] (0.94)
- ← produces [[pi-package]] (0.94)
- ← uses [[pi]] (0.94)
- → uses [[tui]] (0.93)
- → applies_to [[compaction]] (0.93)
- → applies_to [[tool-use]] (0.93)
- → applies_to [[workspace-trust]] (0.93)
- ← uses [[pi-sdk]] (0.93)
- → uses [[rpc-mode]] (0.93)
- → uses [[session]] (0.93)
- [[pi]] — 22 shared claims
- [[tool-use]] — 3 shared claims
- [[tui]] — 3 shared claims
- [[rpc-mode]] — 2 shared claims
- [[sandbox]] — 2 shared claims
- [[session]] — 2 shared claims
- [[compaction]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[model-context-protocol]] — 1 shared claim
- [[permission-system]] — 1 shared claim
- [[pi-package]] — 1 shared claim
- [[pi-sdk]] — 1 shared claim
- [[prompt-template]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[system-prompt]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
- Gondolin (no page yet)
