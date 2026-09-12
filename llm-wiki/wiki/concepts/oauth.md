---
type: concept
status: current
created: 2026-08-30
updated: 2026-08-30
sources:
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
generated: {by: process:llm-wiki-render, at: 2026-08-30}
entity_ids: [ent_oauth]
claim_ids: [clm_37e3016361bd, clm_cd7280e98da5, clm_a93159a85dff]
confidence: 0.93
stale_after: 2029-09-29
last_rendered: 2026-08-30T09:30:07Z
review_required: false
---

# OAuth

> **In here:** OAuth — 3 claims, confidence 0.93, 2 sources.

## Current understanding

- For a secret shared across repositories, authenticate with a Claude Console API key rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude setup-token` (0.93)
- A workflow can avoid storing a long-lived Anthropic secret entirely by authenticating through workload identity federation, where the action exchanges the workflow's GitHub OpenID Connect token for Claude API access through a Claude Console service account (0.93)
- Claude Code authenticates to cloud-based MCP servers that require it with OAuth 2.0 (0.92)

## Evidence

- `clm_37e3016361bd` — "For a secret shared across repositories, authenticate with a Claude Console API key rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude setup-token`." · p 0.93 · active · 1 support · 0 contradict · when: for a secret shared across repositories
  - `src_7962dafdd21b` Claude Code GitHub Actions: "For a secret shared across repositories, authenticate with an API key from the [Claude Console](https://platform.claude.com) rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude…"
- `clm_cd7280e98da5` — "A workflow can avoid storing a long-lived Anthropic secret entirely by authenticating through workload identity federation, where the action exchanges the workflow's GitHub OpenID Connect token for Claude API access through a Claude Console service account." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "To avoid storing a long-lived secret entirely, authenticate through workload identity federation, where the Claude Code GitHub Action exchanges the workflow's GitHub OpenID Connect (OIDC) token for Claude API access through a Claude…"
- `clm_a93159a85dff` — "Claude Code authenticates to cloud-based MCP servers that require it with OAuth 2.0." · p 0.92 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Many cloud-based MCP servers require authentication. Claude Code supports OAuth 2.0 for secure connections."

## Timeline

- 2026-08-23 new_claim `clm_a93159a85dff` (src_9e7c0cb34402)
- 2026-08-30 new_claim `clm_cd7280e98da5` (src_7962dafdd21b)
- 2026-08-30 new_claim `clm_37e3016361bd` (src_7962dafdd21b)

## Related

- ← uses [[claude-code-github-action]] (0.99)
- ← uses [[claude-code]] (0.92)
- [[claude-code-github-action]] — 2 shared claims
- [[claude-code]] — 1 shared claim
- [[mcp-server]] — 1 shared claim
