---
type: system
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/commands.md, title: "Commands", id: src_63b61512d6ab}
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_mcp_server]
claim_ids: [clm_8c4373808e22, clm_bd5e3c93d364, clm_1d80b9620932, clm_4a3a128f14d1, clm_1dc5534f1f11, clm_4d483e15f7f2, clm_9bbd3ed4fb7d, clm_0617d629981c, clm_5bd3b13812ff, clm_a93159a85dff, clm_10c46e8fa80e, clm_1c66cecb61a2, clm_849bb2be606c]
confidence: 0.92
stale_after: 2027-01-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# MCP server

> **In here:** A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts… · 13 claims, confidence 0.92.

## Current understanding

- The Model Context Protocol is an open source standard for AI-tool integrations, and an MCP server connected to Claude Code gives it access to external tools, databases, and APIs (0.93)
- A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts inline comments only when `--allowedTools` in `claude_args` names it (0.93)
- HTTP is the recommended transport for remote MCP servers and the most widely supported one for cloud-based services (0.93)
- Every MCP server must be verified as trusted before it is connected, because a server that fetches external content can expose the session to prompt injection (0.93)
- An MCP server is configured at one of three scopes, and that choice controls which projects the server loads in and whether the configuration is shared with the team (0.93)
- When the same MCP server is defined in more than one scope, Claude Code connects once using the entire entry from the highest-precedence source, and never merges fields across scopes (0.93)
- An MCP server can expose resources that are referenced with @ mentions, the same way files are referenced (0.92)
- Prompts exposed by a connected MCP server appear in Claude Code's slash-command list as `/mcp__servername__promptname` (0.92)
- An MCP server can change its available tools, prompts, and resources mid-session by sending a `list_changed` notification, which Claude Code answers by refreshing that server's capabilities without a disconnect and reconnect (0.92)
- Claude Code authenticates to cloud-based MCP servers that require it with OAuth 2.0 (0.92)
- Prompts exposed by connected MCP servers are dynamically discovered and appear as slash commands in the form /mcp__<server>__<prompt> (0.89)
- A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an underscore (0.89)
- The `system/init` event of a Claude Code stream reports session metadata including the model, tools, MCP servers, and loaded plugins, and is the first event in the stream unless startup events precede it (0.89)

## Evidence

- `clm_8c4373808e22` — "The Model Context Protocol is an open source standard for AI-tool integrations, and an MCP server connected to Claude Code gives it access to external tools, databases, and APIs." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Claude Code can connect to hundreds of external tools and data sources through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open source standard for AI-tool integrations."
- `clm_bd5e3c93d364` — "A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts inline comments only when `--allowedTools` in `claude_args` names it." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "**`claude_args`**: keep this line even though the skill's own `allowed-tools` frontmatter names the same tool, because the Claude Code GitHub Action starts the MCP server that posts inline comments only when `--allowedTools` in…"
- `clm_1d80b9620932` — "HTTP is the recommended transport for remote MCP servers and the most widely supported one for cloud-based services." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "HTTP servers are the recommended option for connecting to remote MCP servers. This is the most widely supported transport for cloud-based services."
- `clm_4a3a128f14d1` — "Every MCP server must be verified as trusted before it is connected, because a server that fetches external content can expose the session to prompt injection." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Verify you trust each server before connecting it. Servers that fetch external content can expose you to [prompt injection risk](/docs/en/security#protect-against-prompt-injection)."
- `clm_1dc5534f1f11` — "An MCP server is configured at one of three scopes, and that choice controls which projects the server loads in and whether the configuration is shared with the team." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "MCP servers can be configured at three scopes. The scope you choose controls which projects the server loads in and whether the configuration is shared with your team."
- `clm_4d483e15f7f2` — "When the same MCP server is defined in more than one scope, Claude Code connects once using the entire entry from the highest-precedence source, and never merges fields across scopes." · p 0.93 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "When the same server is defined in more than one place, Claude Code connects to it once, using the definition from the highest-precedence source. The entire server entry from that source is used; fields are not merged across scopes."
- `clm_9bbd3ed4fb7d` — "An MCP server can expose resources that are referenced with @ mentions, the same way files are referenced." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "MCP servers can expose resources that you can reference using @ mentions, similar to how you reference files."
- `clm_0617d629981c` — "Prompts exposed by a connected MCP server appear in Claude Code's slash-command list as `/mcp__servername__promptname`." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Type `/` to see the commands available to you, including those from MCP servers. MCP prompts appear with the format `/mcp__servername__promptname`."
- `clm_5bd3b13812ff` — "An MCP server can change its available tools, prompts, and resources mid-session by sending a `list_changed` notification, which Claude Code answers by refreshing that server's capabilities without a disconnect and reconnect." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Claude Code supports MCP `list_changed` notifications, allowing MCP servers to dynamically update their available tools, prompts, and resources without requiring you to disconnect and reconnect."
- `clm_a93159a85dff` — "Claude Code authenticates to cloud-based MCP servers that require it with OAuth 2.0." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Many cloud-based MCP servers require authentication. Claude Code supports OAuth 2.0 for secure connections."
- `clm_10c46e8fa80e` — "Prompts exposed by connected MCP servers are dynamically discovered and appear as slash commands in the form /mcp__<server>__<prompt>." · p 0.89 · active · 1 support · 0 contradict
  - `src_63b61512d6ab` Commands: "MCP servers can expose prompts that appear as commands. These use the format `/mcp__<server>__<prompt>` and are dynamically discovered from connected servers."
- `clm_1c66cecb61a2` — "A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an underscore." · p 0.89 · active · 1 support · 0 contradict · when: for plugin-bundled MCP servers
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Tools from a plugin-bundled MCP server include both the plugin name and the server key in their callable name."
- `clm_849bb2be606c` — "The `system/init` event of a Claude Code stream reports session metadata including the model, tools, MCP servers, and loaded plugins, and is the first event in the stream unless startup events precede it." · p 0.89 · active · 1 support · 0 contradict
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "The `system/init` event reports session metadata including the model, tools, MCP servers, and loaded plugins. It is the first event in the stream unless startup events precede it:"

## Timeline

- 2026-08-23 new_claim `clm_8c4373808e22` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_1d80b9620932` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_1dc5534f1f11` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_4d483e15f7f2` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_a93159a85dff` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_1c66cecb61a2` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_0617d629981c` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_9bbd3ed4fb7d` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_5bd3b13812ff` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_4a3a128f14d1` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_10c46e8fa80e` (src_63b61512d6ab)
- 2026-08-23 new_claim `clm_849bb2be606c` (src_d5ec157b2e7b)
- 2026-08-30 new_claim `clm_bd5e3c93d364` (src_7962dafdd21b)

## Related

- → depends_on [[allowed-tools]] (0.93)
- ← depends_on [[claude-code-github-action]] (0.93)
- → part_of [[model-context-protocol]] (0.93)
- ← applies_to [[mcp-installation-scope]] (0.93)
- → produces [[slash-command]] (0.93)
- → uses MCP transport (no page yet) (0.93)
- → produces MCP resource (no page yet) (0.92)
- [[claude-code]] — 6 shared claims
- [[mcp-installation-scope]] — 2 shared claims
- [[mcp-tool]] — 2 shared claims
- [[slash-command]] — 2 shared claims
- [[allowed-tools]] — 1 shared claim
- [[claude-code-github-action]] — 1 shared claim
- [[model-context-protocol]] — 1 shared claim
- [[non-interactive-mode]] — 1 shared claim
- [[oauth]] — 1 shared claim
- [[plugin]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
- MCP prompt (no page yet)
- MCP resource (no page yet)
- MCP transport (no page yet)
