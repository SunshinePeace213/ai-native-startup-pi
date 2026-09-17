---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
  - {resource: llm-wiki/raw/docs/pi/rpc.md, title: "RPC Mode", id: src_3c01fb9c03bd}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_non_interactive_mode]
claim_ids: [clm_11c6703901c8, clm_c7efa28cfcfb, clm_c8e724381e5f, clm_77037ce59207, clm_1654b0d3617a, clm_5e882ac2e1b6, clm_e261e230a5a7, clm_ed6e352a269a, clm_849bb2be606c, clm_ce1b361863a3]
confidence: 0.90
stale_after: 2027-01-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# non-interactive mode

> **In here:** A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs · 10 claims, confidence 0.90.

## Current understanding

- Pi's RPC mode runs the agent headlessly behind a JSON protocol over stdin and stdout, the embedding path for other applications, IDEs, and custom UIs (0.94)
- SIGTERM ends a `claude -p` run with exit code 143 and leaves the in-progress turn unfinished with no result recorded, so ending the turn instead takes a SIGINT or the Agent SDK's `interrupt()` before the process is stopped (0.93)
- A background Bash task started during a `claude -p` run is terminated about five seconds after Claude returns its final result and stdin closes (0.92)
- A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs (0.92)
- A non-interactive run continues the most recent conversation with `--continue`, which skips background sessions, or a specific conversation with `--resume` and a session ID (0.89)
- A non-interactive Claude Code run selects its response shape with `--output-format`: `text` for plain text (the default), `json` for structured JSON carrying the result, session ID, and metadata, or `stream-json` for newline-delimited JSON streamed in real time (0.89)
- Adding the `-p` (or `--print`) flag to any `claude` command runs Claude Code non-interactively, though not every CLI option combines with it (0.89)
- In Claude Code's `stream-json` output every line is a JSON object representing one event, and pairing the format with `--verbose` and `--include-partial-messages` delivers tokens as they are generated (0.89)
- The `system/init` event of a Claude Code stream reports session metadata including the model, tools, MCP servers, and loaded plugins, and is the first event in the stream unless startup events precede it (0.89)
- The `--allowedTools` flag pre-approves tools for a non-interactive run using permission rule syntax, where a trailing space-asterisk enables prefix matching so `Bash(git diff *)` allows any command starting with `git diff` (0.89)

## Evidence

- `clm_11c6703901c8` — "Pi's RPC mode runs the agent headlessly behind a JSON protocol over stdin and stdout, the embedding path for other applications, IDEs, and custom UIs." · p 0.94 · active · 1 support · 0 contradict
  - `src_3c01fb9c03bd` RPC Mode: "RPC mode enables headless operation of the coding agent via a JSON protocol over stdin/stdout. This is useful for embedding the agent in other applications, IDEs, or custom UIs."
- `clm_c7efa28cfcfb` — "SIGTERM ends a `claude -p` run with exit code 143 and leaves the in-progress turn unfinished with no result recorded, so ending the turn instead takes a SIGINT or the Agent SDK's `interrupt()` before the process is stopped." · p 0.93 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "If you stop a `claude -p` run with SIGTERM, for example with `kill` or from a process supervisor, Claude Code exits with code 143. Claude Code leaves the turn that was in progress unfinished and records no result for it."
- `clm_c8e724381e5f` — "A background Bash task started during a `claude -p` run is terminated about five seconds after Claude returns its final result and stdin closes." · p 0.92 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "If Claude starts a [background Bash task](/docs/en/tools-reference#bash-tool-behavior) during a `claude -p` run, for example a dev server or a watch build, that shell is terminated about five seconds after Claude has returned its final…"
- `clm_77037ce59207` — "A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs." · p 0.92 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "To set a baseline for the whole session instead of listing individual tools, pass a [permission mode](/docs/en/permission-modes)."
- `clm_1654b0d3617a` — "A non-interactive run continues the most recent conversation with `--continue`, which skips background sessions, or a specific conversation with `--resume` and a session ID." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Use `--continue` to continue the most recent conversation, or `--resume` with a session ID to continue a specific conversation. `--continue` skips [background sessions](/docs/en/sessions#resume-a-session)."
- `clm_5e882ac2e1b6` — "A non-interactive Claude Code run selects its response shape with `--output-format`: `text` for plain text (the default), `json` for structured JSON carrying the result, session ID, and metadata, or `stream-json` for newline-delimited JSON streamed in real time." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Use `--output-format` to control how responses are returned: * `text` (default): plain text output * `json`: structured JSON with result, session ID, and metadata * `stream-json`: newline-delimited JSON for real-time streaming"
- `clm_e261e230a5a7` — "Adding the `-p` (or `--print`) flag to any `claude` command runs Claude Code non-interactively, though not every CLI option combines with it." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Add the `-p` (or `--print`) flag to any `claude` command to run it non-interactively. Not every [CLI option](/docs/en/cli-reference) combines with `-p`."
- `clm_ed6e352a269a` — "In Claude Code's `stream-json` output every line is a JSON object representing one event, and pairing the format with `--verbose` and `--include-partial-messages` delivers tokens as they are generated." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Use `--output-format stream-json` with `--verbose` and `--include-partial-messages` to receive tokens as they're generated. Each line is a JSON object representing an event:"
- `clm_849bb2be606c` — "The `system/init` event of a Claude Code stream reports session metadata including the model, tools, MCP servers, and loaded plugins, and is the first event in the stream unless startup events precede it." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "The `system/init` event reports session metadata including the model, tools, MCP servers, and loaded plugins. It is the first event in the stream unless startup events precede it:"
- `clm_ce1b361863a3` — "The `--allowedTools` flag pre-approves tools for a non-interactive run using permission rule syntax, where a trailing space-asterisk enables prefix matching so `Bash(git diff *)` allows any command starting with `git diff`." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "The `--allowedTools` flag uses [permission rule syntax](/docs/en/settings-reference#permission-rule-syntax). The trailing ` *` enables prefix matching, so `Bash(git diff *)` allows any command starting with `git diff`."

## Timeline

- 2026-08-23 new_claim `clm_e261e230a5a7` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_5e882ac2e1b6` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_ed6e352a269a` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_849bb2be606c` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_ce1b361863a3` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_77037ce59207` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_1654b0d3617a` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_c7efa28cfcfb` (src_d5ec157b2e7b)
- 2026-08-23 new_claim `clm_c8e724381e5f` (src_d5ec157b2e7b)
- 2026-09-11 new_claim `clm_11c6703901c8` (src_3c01fb9c03bd)

## Related

- ← uses [[claude-code]] (0.93)
- → uses [[permission-mode]] (0.92)
- [[claude-code]] — 9 shared claims
- [[permission-mode]] — 2 shared claims
- [[claude-agent-sdk]] — 1 shared claim
- [[mcp-server]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[rpc-mode]] — 1 shared claim
