---
type: system
status: current
created: 2026-08-23
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
  - {resource: llm-wiki/raw/docs/pi/environment-variables.md, title: "Environment Variables", id: src_7f85c02fc39f}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_bash_tool]
claim_ids: [clm_e0eb3e2d4116, clm_0fc576bb4bbe, clm_bf595ae0cb35, clm_39ba7e3822d8, clm_c381a5766221, clm_e90a14b6f054, clm_dc8405fc7378, clm_57fe4f170ef5]
confidence: 0.91
stale_after: 2027-01-10
last_rendered: 2026-09-11T20:00:23Z
review_required: false
---

# bash tool

> **In here:** Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools · 8 claims, confidence 0.91.

## Current understanding

- The commit and push review layer fires only on commits and pushes Claude makes through its Bash tool, so commits the user runs from their own shell, including the `!` shell escape inside a session, are never reviewed (0.94)
- Pi sets AI_AGENT=pi as a generic marker and PI_CODING_AGENT=true as a Pi-specific one, both inherited by child processes so tooling can tell it launched them (0.93)
- Pi injects the PI_* session variables only into the LLM-callable bash and powershell tools, never into a user's own ! or !! commands (0.93)
- Pi resolves the PI_* session variables when each shell command starts, so switching model or reasoning level reaches the next shell command without restarting Pi (0.93)
- Read and Edit deny rules reach only the file commands Claude Code recognizes inside Bash, not arbitrary subprocesses that open files themselves, so OS-level enforcement across every process requires enabling the sandbox (0.93)
- Setting `run_in_background: true` on a Bash command starts it as a background task Claude can keep working alongside, and a command a foreground subagent started ends when that subagent gives its final response (0.92)
- Bash output is read back into a command's result up to `BASH_MAX_OUTPUT_LENGTH` characters — 30,000 by default and 150,000 at most — but a valid result over roughly 30,000 characters still arrives as a saved file path plus a short preview no matter how high that variable is set (0.90)
- Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools (0.78)

## Evidence

- `clm_e0eb3e2d4116` — "The commit and push review layer fires only on commits and pushes Claude makes through its Bash tool, so commits the user runs from their own shell, including the `!` shell escape inside a session, are never reviewed." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "This layer fires only on commits and pushes Claude makes through its Bash tool. Commits you run from your own shell, including the `!` shell escape inside a session, are not reviewed."
- `clm_0fc576bb4bbe` — "Pi sets AI_AGENT=pi as a generic marker and PI_CODING_AGENT=true as a Pi-specific one, both inherited by child processes so tooling can tell it launched them." · p 0.93 · active · 1 support · 0 contradict
  - `src_7f85c02fc39f` Environment Variables: "`AI_AGENT=pi` is a generic marker that lets tooling identify Pi as the agent that launched the process."
- `clm_bf595ae0cb35` — "Pi injects the PI_* session variables only into the LLM-callable bash and powershell tools, never into a user's own ! or !! commands." · p 0.93 · active · 1 support · 0 contradict
  - `src_7f85c02fc39f` Environment Variables: "These variables are injected into the LLM-callable `bash` and `powershell` tools. They are not injected into user-entered `!` or `!!` commands."
- `clm_39ba7e3822d8` — "Pi resolves the PI_* session variables when each shell command starts, so switching model or reasoning level reaches the next shell command without restarting Pi." · p 0.93 · active · 1 support · 0 contradict
  - `src_7f85c02fc39f` Environment Variables: "The values are resolved when each command starts. Switching models or changing the reasoning level therefore affects the next shell command without restarting Pi."
- `clm_c381a5766221` — "Read and Edit deny rules reach only the file commands Claude Code recognizes inside Bash, not arbitrary subprocesses that open files themselves, so OS-level enforcement across every process requires enabling the sandbox." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "[Read and Edit deny rules](/docs/en/permissions#tool-specific-permission-rules) also apply to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, `sed`, and `grep`, but not to arbitrary subprocesses that read or…"
- `clm_e90a14b6f054` — "Setting `run_in_background: true` on a Bash command starts it as a background task Claude can keep working alongside, and a command a foreground subagent started ends when that subagent gives its final response." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "For long-running processes such as dev servers or watch builds, Claude can set `run_in_background: true` to start the command as a background task and continue working while it runs. List and stop background tasks with `/tasks`."
- `clm_dc8405fc7378` — "Bash output is read back into a command's result up to `BASH_MAX_OUTPUT_LENGTH` characters — 30,000 by default and 150,000 at most — but a valid result over roughly 30,000 characters still arrives as a saved file path plus a short preview no matter how high that variable is set." · p 0.90 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "[`BASH_MAX_OUTPUT_LENGTH`](/docs/en/env-vars) sets how many characters of output Claude Code reads back from the working file into a command's result: 30,000 by default, up to a hard ceiling of 150,000."
- `clm_57fe4f170ef5` — "Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools." · p 0.78 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "This gives models a computer and lets them figure out the rest autonomously. The model can design its own tools on the fly via code instead of being constrained to pre-configured tools."

## Timeline

- 2026-08-23 new_claim `clm_57fe4f170ef5` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_c381a5766221` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_dc8405fc7378` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_e90a14b6f054` (src_ab9f8f38615f)
- 2026-08-30 new_claim `clm_e0eb3e2d4116` (src_99ad4fe8f1dd)
- 2026-09-11 new_claim `clm_0fc576bb4bbe` (src_7f85c02fc39f)
- 2026-09-11 new_claim `clm_39ba7e3822d8` (src_7f85c02fc39f)
- 2026-09-11 new_claim `clm_bf595ae0cb35` (src_7f85c02fc39f)

## Related

- ← depends_on [[security-guidance-plugin]] (0.94)
- ← applies_to [[permission-rule]] (0.93)
- → part_of [[pi]] (0.93)
- → produces background task (no page yet) (0.92)
- → related_to [[tool-use]] (0.78)
- ← uses [[agent-harness]] (0.78)
- [[pi]] — 3 shared claims
- [[agent-harness]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[session]] — 1 shared claim
- [[subagents]] — 1 shared claim
- [[tool-use]] — 1 shared claim
- background task (no page yet)
