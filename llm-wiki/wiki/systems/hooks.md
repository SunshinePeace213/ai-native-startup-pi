---
type: system
status: current
created: 2026-08-21
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md, title: "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents", id: src_93a1e6058bf1}
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/crystallize-placement-and-push-auth.md, title: "Where a crystallize belongs, and why pushes touching a workflow file were refused", id: src_a503e85dd88c}
  - {resource: llm-wiki/raw/chats/llm-wiki-engine-layout-refactor.md, title: "Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer", id: src_157432f58354}
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
  - {resource: llm-wiki/raw/docs/claude-code/hooks-guide.md, title: "Automate actions with hooks", id: src_3466a5945e1e}
  - {resource: llm-wiki/raw/docs/claude-code/hooks.md, title: "Hooks reference", id: src_af0a3c9de51d}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-5-build-findings.md, title: "Phase 5 build findings — what the retune and the loops measured", id: src_21d1317cc326}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_hooks]
claim_ids: [clm_ca5f4231dbc2, clm_19117073da8e, clm_894efdaa13ce, clm_71a4b67427f6, clm_8a5ac3a8a835, clm_0d2e125d097a, clm_805bbec6fa51, clm_794ee065e6ca, clm_9f8da267ecf6, clm_c6f907387ca6, clm_e888d6f6645f, clm_1b386e4233f4, clm_a0b4cf68c8c2, clm_2629d09b0686, clm_a000143bb6c6, clm_fcd14cd753ef, clm_1e096059acb6, clm_c95deb689a75, clm_591380d3c963, clm_890b846d4a42, clm_cdb802990e15, clm_cdc37e66617c, clm_1b37e536a50d, clm_77abb4f39957, clm_e64947bbb8f2, clm_35ea8d540945, clm_d21c16986b36, clm_e9e77e122cab, clm_d8e8392dd4ee, clm_76793491b392, clm_dcd107fbb284, clm_a94c83fea089, clm_4ed8d31fca58, clm_fba2df5be733, clm_49f55182d4b0, clm_7c79b30b59bd, clm_cc642856daba, clm_f7a4e979038d, clm_993eaf50e4ea, clm_44f0d124c01f]
confidence: 0.87
stale_after: 2026-09-27
last_rendered: 2026-09-05T16:35:44Z
review_required: false
---

# hooks

> **In here:** A guard rule carrying the action ask resolves to a block when no human is present to answer, so an unattended agent cannot run what it gates: the destructive-command guard's git-force-push rule… · 40 claims, confidence 0.87.

## Current understanding

- A hook handler can be a shell command, an HTTP endpoint, or an LLM prompt, and the same hook events fire wherever Claude Code runs - terminal sessions, IDE extensions, the Desktop app, and the web (1.00)
- Exit code 2 is the only exit code that blocks through the code alone for most hook events - without valid JSON on stdout, exit code 1 is treated as a non-blocking error and the action proceeds (0.99)
- The security-guidance plugin is built entirely on Claude Code hooks, the mechanism for running your own code at specific points in Claude's loop (0.94)
- Command hooks run shell commands with the user's full permissions and can modify, delete, or read anything that user account can reach, so every hook command should be reviewed and tested before it is configured (0.94)
- Without bare mode a headless print session runs the hooks in a project's .claude/settings.json and connects the servers in its .mcp.json even in a folder that was never trusted, showing no workspace trust dialog and no per-server approval prompt (0.94)
- Rules in the plugin's guidance file are guidance for the reviewer rather than deterministic guardrails — the plugin surfaces violations as findings for Claude to fix but does not block writes or guarantee every violation is caught, so hard enforcement needs a blocking hook or a CI check (0.93)
- When several hooks match one event they all run to completion and their outputs are combined, with PreToolUse permission decisions resolved most-restrictive-first in the order deny, defer, ask, allow (0.93)
- An interactive session withholds every settings-file hook until the workspace trust dialog is accepted, but a -p or SDK session never shows that dialog and treats the folder as trusted, so hooks committed in a repository run in a folder the user never trusted (0.93)
- A hook exiting 0 reports no objection but does not approve anything: a PreToolUse hook's tool call still goes through the normal permission flow (0.93)
- PreToolUse hooks fire ahead of any permission-mode check, so a hook returning a deny decision blocks the tool even under bypassPermissions or --dangerously-skip-permissions (0.93)
- Hook events fall into three cadences: once per session (SessionStart, SessionEnd), once per turn (UserPromptSubmit, Stop, StopFailure), and once per tool call inside the agentic loop (PreToolUse, PostToolUse) (0.93)
- Not every hook event supports blocking or steering behavior through JSON, and the events that do each use a different set of decision fields (0.93)
- Claude Code overrides a Stop hook once it has blocked eight consecutive times without progress, so a Stop hook must check whether it already forced a continuation (0.93)
- A prompt hook replaces the shell command with a single-turn call to a Claude model, Haiku by default, so judgment-shaped decisions can be made where a deterministic rule cannot express them (0.93)
- A command, HTTP, or MCP-tool hook that hits its timeout is canceled and renders no decision, so a stalled PreToolUse hook lets the tool call continue through the normal permission flow rather than acting as a gate (0.93)
- Context injected by a hook should be phrased as factual statements, because text framed as out-of-band system instructions can trip Claude's prompt-injection defenses and get surfaced to the user instead of read as context (0.93)
- Claude Code decides whether a hook's stdout is JSON or plain text purely from its first non-whitespace character: output starting with an opening brace is parsed as JSON, and anything else - including a JSON array or quoted string - is treated as plain text (0.91)
- Hook output strings, including additionalContext, systemMessage, and plain stdout, are capped at 10,000 characters, beyond which the text is written to a file and replaced with a preview and path (0.91)
- Hooks block Claude's execution until they finish unless marked async, and an async hook can never block or steer behavior because the action it would have controlled has already completed (0.91)
- A matcher containing regex characters is tested unanchored with JavaScript's RegExp.prototype.test, so `Edit.*` also fires for `NotebookEdit` unless the pattern is anchored with ^ and $ (0.91)
- The `if` field that narrows a hook to matching tool arguments is best-effort and fails open when a Bash command cannot be parsed, so hard allow-or-deny enforcement belongs in the permission system rather than a hook (0.91)
- An agent hook spawns a subagent that can read files, search code, and use tools to verify a condition before returning its decision, unlike a prompt hook's single LLM call (0.91)
- /goal rides on the hooks system, so it follows the same workspace-trust rule as hooks in settings files and is unavailable wherever disableAllHooks or allowManagedHooksOnly is in force (0.90)
- Permission rules, a skill's allowed-tools list, a subagent's tools field, and hook matchers must all name a plugin-bundled MCP tool by its full callable name — a matcher written against the bare server key never fires (0.90)
- The engine's --root flag is global and precedes the verb, so the hooks run the queue as uv run scripts/llm-wiki/state.py --root <root> queue --json; the verb-first order exits 2 with unrecognized arguments (0.89)
- A skill is an advisory control and a hook is the deterministic layer behind it: a policy that must always hold needs something deterministic backing the skill, because the skill makes violations rare while the hook makes them close to impossible (0.83)
- The governing principle for an agent in the pipeline is that it may act up to the production gate and cannot pass it: branch protection turns anything the agent writes into a PR with no direct path to main, and separation of duties holds because the agent that wrote the code has no way to approve it (0.83)
- The verification loop itself needs protecting because an agent fixing code must not be able to weaken the check on that code: a hook blocks edits to test files during a fix task, and a test that existed before the fix and could not be rewritten is what proves the bug is gone (0.83)
- The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction (0.83)
- An instruction is the wrong tool for something that absolutely must not happen: under pressure, in a long session, in an ambiguous situation, or through a prompt injection in a file the task reads, the model can fail to follow a prompted rule, so a real guardrail has to be deterministic — hooks and permissions (0.81)
- Middleware hooks into the agent loop before and after model calls, before and after tool calls, and at agent startup and teardown, with each piece handling one concern and composing freely with any other (0.80)
- The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb and a protected path is denied (0.79)
- The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt into a clean context window, forcing the agent to keep working against a completion goal (0.78)
- A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution (0.78)
- The engine's tests live under a top-level tests/llm-wiki/ rather than inside tests/harness-layer/, because the engine is a product layer and not harness tooling, with its fixtures and hook tests alongside and the shared hook fixtures lifted to tests/conftest.py so both hook directories use one copy (0.76)
- The llm-wiki hooks report and never write: the SessionStart hook prints a queue block only when the engine's read-only queue verb finds an unregistered or unextracted archive, the PostToolUse hook reminds the session that just wrote one, and both fail open to a silent exit 0 when the engine, uv, or the payload is missing (0.76)
- Three defects in a text-matching Bash guard came from tokenization rather than policy: mv was treated as destination-only though it removes its source, a multi-line payload guarded only its first line because the tokenizer eats newlines, and a verb glued to a bracket was never recognised (0.75)
- A path guard that normalizes only lexically leaves a symlinked private segment unguarded — inside a worktree whose private segment is a symlink to the root checkout every private path resolved outside the worktree root, and the fix matches both the lexical path and its realpath (0.75)
- A guard rule carrying the action ask resolves to a block when no human is present to answer, so an unattended agent cannot run what it gates: the destructive-command guard's git-force-push rule matches --force, -f, and --force-with-lease alike and hands every rewrite of an already-pushed branch back to the human (0.74)
- A cross-model builder's workspace sandbox refused the one file that registers its own hooks — the patch came back as writing outside of the project — so a reviewer wrote the mirror entries afterwards (0.73)

## Evidence

- `clm_ca5f4231dbc2` — "A hook handler can be a shell command, an HTTP endpoint, or an LLM prompt, and the same hook events fire wherever Claude Code runs - terminal sessions, IDE extensions, the Desktop app, and the web." · p 1.00 · active · 2 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Hooks are user-defined shell commands, HTTP endpoints, or LLM prompts that execute automatically at specific points in Claude Code's lifecycle."
  - `src_3466a5945e1e` Automate actions with hooks: "Hooks are user-defined shell commands. Claude Code runs them at specific points in its lifecycle, which gives you deterministic control: certain actions always happen rather than relying on the LLM to choose to run them."
- `clm_19117073da8e` — "Exit code 2 is the only exit code that blocks through the code alone for most hook events - without valid JSON on stdout, exit code 1 is treated as a non-blocking error and the action proceeds." · p 0.99 · active · 2 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "For most hook events, exit code 2 is the only exit code that blocks through the code alone."
  - `src_3466a5945e1e` Automate actions with hooks: "**Exit 2**: Claude Code blocks the action. Write a reason to stderr."
- `clm_894efdaa13ce` — "The security-guidance plugin is built entirely on Claude Code hooks, the mechanism for running your own code at specific points in Claude's loop." · p 0.94 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "The plugin is built entirely on [hooks](/docs/en/hooks), the mechanism for running your own code at specific points in Claude's loop. It registers:"
- `clm_71a4b67427f6` — "Command hooks run shell commands with the user's full permissions and can modify, delete, or read anything that user account can reach, so every hook command should be reviewed and tested before it is configured." · p 0.94 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access. Review and test all hook commands before adding them to your configuration."
- `clm_8a5ac3a8a835` — "Without bare mode a headless print session runs the hooks in a project's .claude/settings.json and connects the servers in its .mcp.json even in a folder that was never trusted, showing no workspace trust dialog and no per-server approval prompt." · p 0.94 · active · 1 support · 0 contradict · when: in headless print mode without --bare
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Without `--bare`, a `-p` session runs the hooks in a project's `.claude/settings.json` and connects the servers in its `.mcp.json`, even in a folder you've never trusted."
- `clm_0d2e125d097a` — "Rules in the plugin's guidance file are guidance for the reviewer rather than deterministic guardrails — the plugin surfaces violations as findings for Claude to fix but does not block writes or guarantee every violation is caught, so hard enforcement needs a blocking hook or a CI check." · p 0.93 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "These rules are guidance for the reviewer, not deterministic guardrails. The plugin surfaces violations as findings for Claude to fix, but it does not block writes or guarantee every violation is caught."
- `clm_805bbec6fa51` — "When several hooks match one event they all run to completion and their outputs are combined, with PreToolUse permission decisions resolved most-restrictive-first in the order deny, defer, ask, allow." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "After all matching hooks finish, Claude Code combines their outputs. For `PreToolUse` permission decisions, the most restrictive answer applies, in the order `deny`, `defer`, `ask`, `allow`."
- `clm_794ee065e6ca` — "An interactive session withholds every settings-file hook until the workspace trust dialog is accepted, but a -p or SDK session never shows that dialog and treats the folder as trusted, so hooks committed in a repository run in a folder the user never trusted." · p 0.93 · active · 1 support · 0 contradict · when: for hooks defined in settings files
  - `src_af0a3c9de51d` Hooks reference: "* **Interactive session**: Claude Code holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the [workspace trust dialog](/docs/en/permissions#project-allow-rules-and-workspace-trust)…"
- `clm_9f8da267ecf6` — "A hook exiting 0 reports no objection but does not approve anything: a PreToolUse hook's tool call still goes through the normal permission flow." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "**Exit 0**: the hook reports no objection through its exit code. For a `PreToolUse` hook this doesn't approve the tool call: the normal [permission flow](/docs/en/permissions) still applies."
- `clm_c6f907387ca6` — "PreToolUse hooks fire ahead of any permission-mode check, so a hook returning a deny decision blocks the tool even under bypassPermissions or --dangerously-skip-permissions." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "`PreToolUse` hooks fire before any permission-mode check, in every [permission mode](/docs/en/permission-modes), including `dontAsk`."
- `clm_e888d6f6645f` — "Hook events fall into three cadences: once per session (SessionStart, SessionEnd), once per turn (UserPromptSubmit, Stop, StopFailure), and once per tool call inside the agentic loop (PreToolUse, PostToolUse)." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Events fall into three cadences: * once per session: `SessionStart` and `SessionEnd` * once per turn: `UserPromptSubmit`, `Stop`, and `StopFailure` * on every tool call inside the agentic loop: `PreToolUse` and `PostToolUse`, except…"
- `clm_1b386e4233f4` — "Not every hook event supports blocking or steering behavior through JSON, and the events that do each use a different set of decision fields." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Not every event supports blocking or controlling behavior through JSON. The events that do each use a different set of fields to express that decision."
- `clm_a0b4cf68c8c2` — "Claude Code overrides a Stop hook once it has blocked eight consecutive times without progress, so a Stop hook must check whether it already forced a continuation." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "Claude Code overrides a Stop hook after it blocks eight times in a row without progress. Your hook script needs to check whether it already triggered a continuation."
- `clm_2629d09b0686` — "A prompt hook replaces the shell command with a single-turn call to a Claude model, Haiku by default, so judgment-shaped decisions can be made where a deterministic rule cannot express them." · p 0.93 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "For decisions that require judgment rather than deterministic rules, use `type: "prompt"` hooks."
- `clm_a000143bb6c6` — "A command, HTTP, or MCP-tool hook that hits its timeout is canceled and renders no decision, so a stalled PreToolUse hook lets the tool call continue through the normal permission flow rather than acting as a gate." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "* A timed-out `command`, `http`, or `mcp_tool` hook doesn't block the tool call. The call continues through the normal [permission flow](/docs/en/permissions), so don't count on a stalled hook to act as a gate."
- `clm_fcd14cd753ef` — "Context injected by a hook should be phrased as factual statements, because text framed as out-of-band system instructions can trip Claude's prompt-injection defenses and get surfaced to the user instead of read as context." · p 0.93 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Write the text as factual statements rather than imperative system instructions. Phrasing such as "The deployment target is production" or "This repo uses `bun test`" reads as project information."
- `clm_1e096059acb6` — "Claude Code decides whether a hook's stdout is JSON or plain text purely from its first non-whitespace character: output starting with an opening brace is parsed as JSON, and anything else - including a JSON array or quoted string - is treated as plain text." · p 0.91 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Whether Claude Code reads your stdout as [JSON output](#json-output) or as plain text depends on its first character, ignoring leading whitespace: * **Starts with `{`**: Claude Code parses it as JSON."
- `clm_c95deb689a75` — "Hook output strings, including additionalContext, systemMessage, and plain stdout, are capped at 10,000 characters, beyond which the text is written to a file and replaced with a preview and path." · p 0.91 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "Hook output strings, including `additionalContext`, `systemMessage`, and plain stdout, are capped at 10,000 characters."
- `clm_591380d3c963` — "Hooks block Claude's execution until they finish unless marked async, and an async hook can never block or steer behavior because the action it would have controlled has already completed." · p 0.91 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "By default, hooks block Claude's execution until they complete. For long-running tasks like deployments, test suites, or external API calls, set `"async": true` to run the hook in the background while Claude continues working."
- `clm_890b846d4a42` — "A matcher containing regex characters is tested unanchored with JavaScript's RegExp.prototype.test, so `Edit.*` also fires for `NotebookEdit` unless the pattern is anchored with ^ and $." · p 0.91 · active · 1 support · 0 contradict
  - `src_af0a3c9de51d` Hooks reference: "A matcher on the regular-expression path is tested with JavaScript's `RegExp.prototype.test`, which succeeds on a match anywhere in the value. `Edit.*` matches both `Edit` and `NotebookEdit`;"
- `clm_cdb802990e15` — "The `if` field that narrows a hook to matching tool arguments is best-effort and fails open when a Bash command cannot be parsed, so hard allow-or-deny enforcement belongs in the permission system rather than a hook." · p 0.91 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "The filter also fails open, running your hook regardless of pattern, when the Bash command can't be parsed."
- `clm_cdc37e66617c` — "An agent hook spawns a subagent that can read files, search code, and use tools to verify a condition before returning its decision, unlike a prompt hook's single LLM call." · p 0.91 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "When verification requires inspecting files or running commands, use `type: "agent"` hooks."
- `clm_1b37e536a50d` — "/goal rides on the hooks system, so it follows the same workspace-trust rule as hooks in settings files and is unavailable wherever disableAllHooks or allowManagedHooksOnly is in force." · p 0.90 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "Claude Code makes `/goal` available under the same [workspace trust rule as hooks in settings files](/docs/en/permissions#what-runs-before-you-trust-a-folder), because the evaluator is part of the hooks system."
- `clm_77abb4f39957` — "Permission rules, a skill's allowed-tools list, a subagent's tools field, and hook matchers must all name a plugin-bundled MCP tool by its full callable name — a matcher written against the bare server key never fires." · p 0.90 · active · 1 support · 0 contradict · when: for plugin-bundled MCP servers
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Use this full name when referencing the tool in [permission rules](/docs/en/permissions), a skill's `allowed-tools` list, a [subagent's `tools` field](/docs/en/sub-agents#available-tools), or a [hook…"
- `clm_e64947bbb8f2` — "The engine's --root flag is global and precedes the verb, so the hooks run the queue as uv run scripts/llm-wiki/state.py --root <root> queue --json; the verb-first order exits 2 with unrecognized arguments" · p 0.89 · active · 2 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "The engine's --root flag is global and precedes the verb, so the hooks run the queue as `uv run scripts/llm_wiki_state.py --root <root> queue --json`; the verb-first order the plan wrote exits 2 with unrecognized arguments."
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The claim recorded under `llm-wiki.engine.root-flag` still quotes the engine at its old path"
- `clm_35ea8d540945` — "A skill is an advisory control and a hook is the deterministic layer behind it: a policy that must always hold needs something deterministic backing the skill, because the skill makes violations rare while the hook makes them close to impossible" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "A policy that must always hold needs something deterministic behind the skill, such as a hook that blocks the action or a review pass that re-checks the policy at the PR."
- `clm_d21c16986b36` — "The governing principle for an agent in the pipeline is that it may act up to the production gate and cannot pass it: branch protection turns anything the agent writes into a PR with no direct path to main, and separation of duties holds because the agent that wrote the code has no way to approve it" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The governing principle is that the agent may act up to the production gate and cannot pass it."
- `clm_e9e77e122cab` — "The verification loop itself needs protecting because an agent fixing code must not be able to weaken the check on that code: a hook blocks edits to test files during a fix task, and a test that existed before the fix and could not be rewritten is what proves the bug is gone" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "the loop itself needs protecting, because an agent fixing code must not be able to weaken the check on that code"
- `clm_d8e8392dd4ee` — "The pattern's biggest practical gap is that every operation is manual; hooks firing on events — new source, session start, session end, query, memory write, and schedule — should automate the bookkeeping entirely while the human stays in the loop for curation and direction" · p 0.83 · active · 1 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The human should still be in the loop for curation and direction. But the bookkeeping, the part that makes people abandon wikis, should be fully automated."
  - exception — when for the deep lane, which turns a source into belief: Automation stops at the light lane: the weekly routine files only the light-lane channels and the deep lane stays a session's command (`obs_da678a69fac4`)
- `clm_76793491b392` — "An instruction is the wrong tool for something that absolutely must not happen: under pressure, in a long session, in an ambiguous situation, or through a prompt injection in a file the task reads, the model can fail to follow a prompted rule, so a real guardrail has to be deterministic — hooks and permissions" · p 0.81 · active · 1 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Claude will follow the instruction most of the time, but when under pressure, in a long session or an ambiguous situation, or due to a prompt injection in a file accessed as part of the task, the model can fail to follow a prompted rule."
- `clm_dcd107fbb284` — "Middleware hooks into the agent loop before and after model calls, before and after tool calls, and at agent startup and teardown, with each piece handling one concern and composing freely with any other." · p 0.80 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "Middleware hooks into the agent loop at each step: before and after model calls, before and after tool calls, at agent startup and teardown. Each piece handles one concern and composes freely with any other"
- `clm_a94c83fea089` — "The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb and a protected path is denied" · p 0.79 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The guards match text; they do not sandbox. The documented consequence is that an unquoted heredoc body naming both a write verb and a protected path is denied even though nothing is being written to that path"
- `clm_4ed8d31fca58` — "The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt into a clean context window, forcing the agent to keep working against a completion goal." · p 0.78 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt in a clean context window, forcing the agent to continue its work against a completion goal."
- `clm_fba2df5be733` — "A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution." · p 0.78 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "- System Prompts - Tools, Skills, MCPs and their descriptions - Bundled Infrastructure (filesystem, sandbox, browser) - Orchestration Logic (subagent spawning, handoffs, model routing) - Hooks/Middleware for deterministic execution…"
- `clm_49f55182d4b0` — "The engine's tests live under a top-level tests/llm-wiki/ rather than inside tests/harness-layer/, because the engine is a product layer and not harness tooling, with its fixtures and hook tests alongside and the shared hook fixtures lifted to tests/conftest.py so both hook directories use one copy" · p 0.76 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The engine's tests live under a top-level `tests/llm-wiki/`, with its fixtures at `tests/llm-wiki/fixtures/` and its hook tests at `tests/llm-wiki/hooks/`."
- `clm_7c79b30b59bd` — "The llm-wiki hooks report and never write: the SessionStart hook prints a queue block only when the engine's read-only queue verb finds an unregistered or unextracted archive, the PostToolUse hook reminds the session that just wrote one, and both fail open to a silent exit 0 when the engine, uv, or the payload is missing" · p 0.76 · active · 1 support · 0 contradict
  - `src_21d1317cc326` Phase 5 build findings — what the retune and the loops measured: "The hooks report and never write. The SessionStart hook prints an `<llm-wiki-queue>` block only when the engine's read-only queue verb finds an unregistered or unextracted archive;"
- `clm_cc642856daba` — "Three defects in a text-matching Bash guard came from tokenization rather than policy: mv was treated as destination-only though it removes its source, a multi-line payload guarded only its first line because the tokenizer eats newlines, and a verb glued to a bracket was never recognised" · p 0.75 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "`mv <protected> /tmp/x` was allowed, and worse, pinned as allowed by the generated test, though `mv` removes its source exactly like `rm` does; `mv` now yields every operand while `cp` stays destination-only."
- `clm_f7a4e979038d` — "A path guard that normalizes only lexically leaves a symlinked private segment unguarded — inside a worktree whose private segment is a symlink to the root checkout every private path resolved outside the worktree root, and the fix matches both the lexical path and its realpath" · p 0.75 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The first was the worst: inside a worktree whose private segment is the symlink this same build's worktree hook creates, every private path resolved back to the root checkout and therefore fell outside the worktree root"
- `clm_993eaf50e4ea` — "A guard rule carrying the action ask resolves to a block when no human is present to answer, so an unattended agent cannot run what it gates: the destructive-command guard's git-force-push rule matches --force, -f, and --force-with-lease alike and hands every rewrite of an already-pushed branch back to the human" · p 0.74 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "The destructive-command guard's `git-force-push` rule carries the action `ask` and matches `--force`, `-f`, and `--force-with-lease` alike."
- `clm_44f0d124c01f` — "A cross-model builder's workspace sandbox refused the one file that registers its own hooks — the patch came back as writing outside of the project — so a reviewer wrote the mirror entries afterwards" · p 0.73 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The guard family was built by a Codex model through a wrapper, and the one edit its sandbox refused was `.codex/hooks.json` — the file that registers the guards on the Codex side."

## Timeline

- 2026-08-20 new_claim `clm_d8e8392dd4ee` (src_48f57237f6ef)
- 2026-08-21 new_claim `clm_7c79b30b59bd` (src_21d1317cc326)
- 2026-08-21 exception_addition `clm_d8e8392dd4ee` (src_21d1317cc326)
- 2026-08-21 new_claim `clm_e64947bbb8f2` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_a94c83fea089` (src_4863372048fa)
- 2026-08-22 new_claim `clm_f7a4e979038d` (src_4863372048fa)
- 2026-08-22 new_claim `clm_cc642856daba` (src_4863372048fa)
- 2026-08-22 new_claim `clm_44f0d124c01f` (src_4863372048fa)
- 2026-08-23 support_update `clm_e64947bbb8f2` (src_157432f58354)
- 2026-08-23 new_claim `clm_49f55182d4b0` (src_157432f58354)
- 2026-08-23 new_claim `clm_993eaf50e4ea` (src_a503e85dd88c)
- 2026-08-23 new_claim `clm_76793491b392` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_35ea8d540945` (src_c65435745c66)
- 2026-08-23 new_claim `clm_e9e77e122cab` (src_c65435745c66)
- 2026-08-23 new_claim `clm_d21c16986b36` (src_c65435745c66)
- 2026-08-23 new_claim `clm_fba2df5be733` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_4ed8d31fca58` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_dcd107fbb284` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_1b37e536a50d` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_77abb4f39957` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_ca5f4231dbc2` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_e888d6f6645f` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_19117073da8e` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_1e096059acb6` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_1b386e4233f4` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_c95deb689a75` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_fcd14cd753ef` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_71a4b67427f6` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_794ee065e6ca` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_591380d3c963` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_a000143bb6c6` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_890b846d4a42` (src_af0a3c9de51d)
- 2026-08-23 support_update `clm_ca5f4231dbc2` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_9f8da267ecf6` (src_3466a5945e1e)
- 2026-08-23 support_update `clm_19117073da8e` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_805bbec6fa51` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_c6f907387ca6` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_a0b4cf68c8c2` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_cdb802990e15` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_2629d09b0686` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_cdc37e66617c` (src_3466a5945e1e)
- 2026-08-23 new_claim `clm_8a5ac3a8a835` (src_d5ec157b2e7b)
- 2026-08-30 new_claim `clm_0d2e125d097a` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_894efdaa13ce` (src_99ad4fe8f1dd)

## Related

- ← part_of [[write-guard]] (0.99)
- ← depends_on [[security-guidance-plugin]] (0.94)
- → part_of [[claude-code]] (0.94)
- ← related_to [[security-guidance-plugin]] (0.93)
- ← depends_on [[goal-command]] (0.92)
- → uses [[belief-updater]] (0.91)
- ← depends_on [[verification-loop]] (0.83)
- → related_to [[skills]] (0.83)
- ← uses [[ai-native-sdlc]] (0.83)
- ← uses [[claude-code]] (0.81)
- ← related_to [[middleware]] (0.80)
- → produces [[ingest]] (0.79)
- … 4 more edges — `graph.py neighbors ent_hooks`
- [[claude-code]] — 21 shared claims
- [[write-guard]] — 4 shared claims
- [[permission-system]] — 3 shared claims
- [[agent-harness]] — 2 shared claims
- [[agent-loops]] — 2 shared claims
- [[belief-updater]] — 2 shared claims
- [[ingest]] — 2 shared claims
- [[llm-wiki]] — 2 shared claims
- [[security-guidance-plugin]] — 2 shared claims
- [[subagents]] — 2 shared claims
- [[workspace-trust]] — 2 shared claims
- [[ai-native-sdlc]] — 1 shared claim
- [[bare-mode]] — 1 shared claim
- [[context-engineering]] — 1 shared claim
- [[context-window]] — 1 shared claim
- [[filesystem]] — 1 shared claim
- [[goal-command]] — 1 shared claim
- [[lint]] — 1 shared claim
- [[mcp-tool]] — 1 shared claim
- [[middleware]] — 1 shared claim
- [[permission-mode]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[security-review]] — 1 shared claim
- [[segmentation]] — 1 shared claim
- [[skills]] — 1 shared claim
- [[state-layer]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
- agent hooks (no page yet)
- async hooks (no page yet)
- matcher (no page yet)
- prompt hooks (no page yet)
- Ralph Loop (no page yet)
