---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-harness-for-every-task-dynamic-workflows-in-claude-code.md, title: "A harness for every task: dynamic workflows in Claude Code", id: src_7415e8608f3c}
  - {resource: llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md, title: "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents", id: src_93a1e6058bf1}
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5-1.md, title: "Delivering work", id: src_9f2ae1e705ce}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5.md, title: "prompting-claude-fable-5", id: src_84badaa3952a}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/claude-code/agent-teams.md, title: "Orchestrate teams of Claude Code sessions", id: src_67017872e4a4}
  - {resource: llm-wiki/raw/docs/claude-code/claude-security.md, title: "Scan your codebase for vulnerabilities", id: src_2eb7a799d8a7}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
  - {resource: llm-wiki/raw/docs/claude-code/cross-session-messaging.md, title: "Message your other Claude Code sessions", id: src_10e9043d62f0}
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
  - {resource: llm-wiki/raw/docs/claude-code/hooks-guide.md, title: "Automate actions with hooks", id: src_3466a5945e1e}
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
  - {resource: llm-wiki/raw/docs/claude-code/security-guidance.md, title: "Catch security issues as Claude writes code", id: src_99ad4fe8f1dd}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/claude-code/sub-agents.md, title: "Create custom subagents", id: src_5671f6c73f3d}
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
  - {resource: llm-wiki/raw/docs/claude-code/workflows.md, title: "Orchestrate subagents at scale with dynamic workflows", id: src_d6586d5c5c4f}
  - {resource: llm-wiki/raw/docs/claude-code/worktrees.md, title: "Run parallel sessions with worktrees", id: src_0979d158a4cf}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_subagents]
claim_ids: [clm_b538f92510e2, clm_a5e46d967548, clm_1691eac7dbb3, clm_7da30002a7c7, clm_b4a4dce90006, clm_0b9ff75db6fc, clm_e08ab1bdbc30, clm_3c7492d09031, clm_0e89a8901cee, clm_f6f929cedc0a, clm_5ca433e00ea6, clm_a02b62bcf985, clm_3313bc585301, clm_45fbc544515a, clm_66b7f6ded709, clm_cb95dc403e93, clm_798c31b3b963, clm_7c3de0c5639e, clm_e5ff207092fb, clm_f395b23fc4e7, clm_95dd4d28d6cd, clm_e0310c5f4dec, clm_198fc635f5f4, clm_64b87a2b64e4, clm_c54b34646d07, clm_e90a14b6f054, clm_ce32f59798b3, clm_1631e452feb8, clm_5379e62f099f, clm_ab1aa0679c1d, clm_ad6abaac0af5, clm_39423a40f88e, clm_f636b711007c, clm_cdc37e66617c, clm_71598d00ebbf, clm_b8c4a4ce61d2, clm_874d9cfdb703, clm_fba2df5be733, clm_2790bc8fcda1]
confidence: 0.91
stale_after: 2027-01-17
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# subagents

> **In here:** Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time · 39 claims, confidence 0.91.

## Current understanding

- Isolation is the main reason to reach for a subagent instead of a skill: a subagent suits a side task whose intermediate results would clutter the main conversation, while a skill suits a procedure you want to play out inside the main thread so you can see and steer each step (1.00)
- A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter (0.99)
- A dynamic workflow executes a JavaScript file with a few special functions that spawn and coordinate subagents, and it can pick which model each agent uses and whether an agent runs in its own worktree, so Claude chooses the intelligence level and isolation the step needs (0.99)
- Dynamic workflows often use significantly more tokens and are best suited to complex, high-value tasks: the question to ask of a regular coding task is whether it really needs more compute, since most traditional coding tasks do not need a panel of five reviewers (0.98)
- A subagent's instructional body never enters the parent conversation at all: it runs in its own fresh context window and the only thing returning to the main session is its final message plus metadata (0.98)
- Findings only appear in a Claude Security report after independent verifier agents analyze them, which keeps reports short and worth reading (0.94)
- Every Claude Security patch is reviewed by an agent independent of the one that wrote it, and is written only when that review can vouch that the change addresses the one finding, introduces no new vulnerability, and leaves behavior otherwise unchanged; otherwise the user gets a short note explaining why instead of a patch (0.94)
- The Claude Security plugin runs a multi-agent vulnerability scan of a codebase inside a Claude Code session: a team of Claude agents maps the architecture, builds a threat model, hunts for vulnerabilities, and independently reviews every finding before writing the report (0.94)
- A subagent's temporary worktree is removed automatically when the subagent finishes without changes, while one holding changes stays on disk until a periodic sweep can remove it without losing work (0.93)
- After each turn the plugin diffs everything that changed in the working tree during the turn — including changes from Claude's edit tools, Bash commands, and subagents — and sends it to a separate background Claude review focused on security, re-prompting Claude with any findings (0.93)
- Pi deliberately ships without built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash, leaving those to extensions, packages, or external tools such as containers and tmux (0.93)
- The local /code-review follows CLAUDE.md like any Claude Code session but does not read REVIEW.md, and a background review applies its --fix edits outside the session's checkpoints so /rewind does not undo them (0.93)
- On coding tasks, letting the lead agent keep working while subagents run lowers average time to completion at similar quality, token usage, and cost, which needs a subagent-start tool that returns immediately, results passed back in a later user message, and a separate tool the lead calls when it wants to wait (0.93)
- Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time (0.93)
- Claude decides when to delegate to a subagent from that subagent's description field, so a vague description is what keeps a subagent from being used (0.93)
- Separate, fresh-context verifier subagents tend to outperform self-critique, so long-running prompts should make self-verification explicit by scheduling subagent checks against the specification at an interval (0.93)
- A fork is a subagent that inherits the main session's entire conversation, system prompt, tools, and model, dropping the input isolation other subagents provide while still keeping its own tool calls out of the main context (0.93)
- The subagents a dynamic workflow spawns always run in acceptEdits mode with file edits auto-approved and inherit the user's tool allowlist, whatever permission mode the session itself is in (0.93)
- A dynamic workflow script holds the loop, the branching, and the intermediate results itself so Claude's context holds only the final answer, whereas with subagents, skills, and agent teams Claude orchestrates turn by turn and every result lands in a context window (0.93)
- A dynamic workflow script accepts no mid-run user input, has no direct filesystem or shell access, and fails before the run starts if it contains import() — the agents it coordinates are what read, write, and run commands (0.93)
- A subagent can spawn subagents of its own up to three layers below the main conversation by default, and at that depth limit Claude Code withholds the Agent tool so the subagent does the work itself (0.92)
- Claude Code scans every subagent's final report before Claude reads it, because files, web pages, and command output the subagent read can carry instructions aimed at the main conversation (0.92)
- Explore and Plan are the only Claude Code subagents that start without CLAUDE.md files and git status, and no frontmatter field or setting changes which subagents skip them (0.92)
- A parent session running in bypassPermissions, acceptEdits, or auto mode takes precedence over whatever permission mode a subagent declares in its own frontmatter (0.92)
- Goal evaluation is skipped for any turn that ends while a subagent or background shell command is still running, and resumes at the end of the next turn that finishes with no background work (0.92)
- Setting `run_in_background: true` on a Bash command starts it as a background task Claude can keep working alongside, and a command a foreground subagent started ends when that subagent gives its final response (0.92)
- Claude reaches other agents with two tools — `ListAgents` to discover which agents it can reach and `SendMessage` to deliver a message to one of them by name — and the same `SendMessage` tool also addresses subagents and agent-team teammates (0.90)
- Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision — with agents communicating through artifacts and shared state rather than unlimited conversational history, which is the constraint that prepares the system for graph architecture (0.90)
- A dynamic workflow's script body is plain JavaScript with top-level await in which agent() spawns one subagent and pipeline() runs one agent per item in a list (0.90)
- Subagents can run in their own worktrees so parallel edits don't conflict, either by asking Claude to use worktrees for its agents or by adding `isolation: worktree` to a custom subagent's frontmatter (0.90)
- The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable sets the model for every subagent, agent team, and workflow agent, overriding both the per-invocation `model` parameter and a subagent definition's `model` frontmatter unless set to `inherit` (0.90)
- Subagents fit quick, focused workers that report a result back, while agent teams fit work where the workers must share findings, challenge each other, and coordinate on their own (0.90)
- While agent teams are enabled, any subagent Claude spawns with a name launches as a teammate without a confirmation prompt, so a team can form during delegation the user never framed as team work (0.90)
- An agent hook spawns a subagent that can read files, search code, and use tools to verify a condition before returning its decision, unlike a prompt hook's single LLM call (0.90)
- The feedback loop and the verifier subagent are different things: the loop runs through the whole task as many times as the work needs, while the verifier packages the final check in a fresh context window once the session believes it is done, so the verdict is not colored by the assumptions that produced the code (0.83)
- Two or three parallel Claude Code sessions is a sensible starting point, and the practical ceiling is how many streams one person can review properly — so sessions are added only while review is keeping up (0.83)
- Subagents handle complex sub-tasks with clean context windows while a todo list tracks progress across a long run (0.79)
- A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution (0.77)
- The filesystem is a natural collaboration surface because multiple agents and humans coordinate through shared files (0.76)

## Evidence

- `clm_b538f92510e2` — "Isolation is the main reason to reach for a subagent instead of a skill: a subagent suits a side task whose intermediate results would clutter the main conversation, while a skill suits a procedure you want to play out inside the main thread so you can see and steer each step" · p 1.00 · active · 3 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Use a skill when you want the procedure to play out inside the main thread so you can see and steer each step."
  - `src_07950e24c4ee` Extend Claude with skills: "Add `context: fork` to your frontmatter when you want a skill to run in isolation. The skill content becomes the prompt that drives the subagent. It won't have access to your conversation history."
  - `src_5671f6c73f3d` Create custom subagents: "Consider [Skills](/docs/en/skills) instead when you want reusable prompts or workflows that run in the main conversation context rather than isolated subagent context."
- `clm_a5e46d967548` — "A review prompt that tells the model to be conservative or to report only high-severity issues is followed literally and yields fewer findings, so the finding stage should ask for everything and a separate pass should filter" · p 0.99 · active · 2 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "ask it to report everything and filter in a separate pass instead"
  - `src_1d5f4c9615f1` Code Review: "When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure."
- `clm_1691eac7dbb3` — "A dynamic workflow executes a JavaScript file with a few special functions that spawn and coordinate subagents, and it can pick which model each agent uses and whether an agent runs in its own worktree, so Claude chooses the intelligence level and isolation the step needs" · p 0.99 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "It's particularly useful to know that dynamic workflows can decide which models an agent uses and whether subagents are run in their own worktree, allowing Claude to choose the intelligence level and isolation needed."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A dynamic workflow is a JavaScript script that orchestrates [subagents](/docs/en/sub-agents) at scale. Claude writes the script for the task you describe, and a runtime executes it in the background while your session stays responsive."
- `clm_7da30002a7c7` — "Dynamic workflows often use significantly more tokens and are best suited to complex, high-value tasks: the question to ask of a regular coding task is whether it really needs more compute, since most traditional coding tasks do not need a panel of five reviewers" · p 0.98 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "For example, most traditional coding tasks do not need a panel of 5 reviewers."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow spawns many agents, so a single run can use meaningfully more tokens than working through the same task in conversation. Runs count toward your plan's usage and rate limits like any other session."
- `clm_b4a4dce90006` — "A subagent's instructional body never enters the parent conversation at all: it runs in its own fresh context window and the only thing returning to the main session is its final message plus metadata" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "The subagent then runs in its own fresh context window, and the only thing that returns to your main session is the subagent's final message (often the aggregated result of many subtasks) plus metadata."
  - `src_5671f6c73f3d` Create custom subagents: "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions."
- `clm_0b9ff75db6fc` — "Findings only appear in a Claude Security report after independent verifier agents analyze them, which keeps reports short and worth reading." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "Findings only appear in the report after independent verifier agents analyze them, which keeps reports short and worth reading."
- `clm_e08ab1bdbc30` — "Every Claude Security patch is reviewed by an agent independent of the one that wrote it, and is written only when that review can vouch that the change addresses the one finding, introduces no new vulnerability, and leaves behavior otherwise unchanged; otherwise the user gets a short note explaining why instead of a patch." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "A patch is written only when that review can vouch that the change addresses the one finding, introduces no new vulnerability, and leaves behavior otherwise unchanged."
- `clm_3c7492d09031` — "The Claude Security plugin runs a multi-agent vulnerability scan of a codebase inside a Claude Code session: a team of Claude agents maps the architecture, builds a threat model, hunts for vulnerabilities, and independently reviews every finding before writing the report." · p 0.94 · active · 1 support · 0 contradict
  - `src_2eb7a799d8a7` Scan your codebase for vulnerabilities: "The Claude Security plugin runs a multi-agent vulnerability scan of your codebase inside a Claude Code session."
- `clm_0e89a8901cee` — "A subagent's temporary worktree is removed automatically when the subagent finishes without changes, while one holding changes stays on disk until a periodic sweep can remove it without losing work." · p 0.93 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "Each subagent gets a temporary worktree that Claude Code removes automatically when the subagent finishes without changes;"
- `clm_f6f929cedc0a` — "After each turn the plugin diffs everything that changed in the working tree during the turn — including changes from Claude's edit tools, Bash commands, and subagents — and sends it to a separate background Claude review focused on security, re-prompting Claude with any findings." · p 0.93 · active · 1 support · 0 contradict
  - `src_99ad4fe8f1dd` Catch security issues as Claude writes code: "After each turn, the plugin computes a git diff of everything that changed in the working tree during the turn, including changes from Claude's edit tools, Bash commands, and subagents, and sends it to a separate Claude review focused on…"
- `clm_5ca433e00ea6` — "Pi deliberately ships without built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash, leaving those to extensions, packages, or external tools such as containers and tmux." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "It intentionally does not include built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash. You can build or install those workflows as extensions or packages, or use external tools such as containers and tmux."
- `clm_a02b62bcf985` — "The local /code-review follows CLAUDE.md like any Claude Code session but does not read REVIEW.md, and a background review applies its --fix edits outside the session's checkpoints so /rewind does not undo them." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "The review follows your `CLAUDE.md` like any Claude Code session, but it doesn't read [`REVIEW.md`](#review-md)."
- `clm_3313bc585301` — "On coding tasks, letting the lead agent keep working while subagents run lowers average time to completion at similar quality, token usage, and cost, which needs a subagent-start tool that returns immediately, results passed back in a later user message, and a separate tool the lead calls when it wants to wait." · p 0.93 · active · 1 support · 0 contradict · when: on coding tasks
  - `src_9f2ae1e705ce` Delivering work: "On coding tasks, letting the lead continue while subagents run lowers average time to completion at similar quality, token usage, and cost."
- `clm_45fbc544515a` — "Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "Claude Opus 5 delegates to subagents more readily than prior models. Delegation pays off on genuinely independent, sizeable tracks of work, but it multiplies cost and time when applied to small tasks."
- `clm_66b7f6ded709` — "Claude decides when to delegate to a subagent from that subagent's description field, so a vague description is what keeps a subagent from being used." · p 0.93 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "Claude uses each subagent's description to decide when to delegate tasks. When you create a subagent, write a clear description so Claude knows when to use it."
- `clm_cb95dc403e93` — "Separate, fresh-context verifier subagents tend to outperform self-critique, so long-running prompts should make self-verification explicit by scheduling subagent checks against the specification at an interval" · p 0.93 · active · 1 support · 0 contradict
  - `src_84badaa3952a` prompting-claude-fable-5: "Separate, fresh-context verifier subagents tend to outperform self-critique."
- `clm_798c31b3b963` — "A fork is a subagent that inherits the main session's entire conversation, system prompt, tools, and model, dropping the input isolation other subagents provide while still keeping its own tool calls out of the main context." · p 0.93 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "A fork is a subagent that inherits the entire conversation so far instead of starting fresh."
- `clm_7c3de0c5639e` — "The subagents a dynamic workflow spawns always run in acceptEdits mode with file edits auto-approved and inherit the user's tool allowlist, whatever permission mode the session itself is in." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "Your permission mode controls only the launch prompt above."
- `clm_e5ff207092fb` — "A dynamic workflow script holds the loop, the branching, and the intermediate results itself so Claude's context holds only the final answer, whereas with subagents, skills, and agent teams Claude orchestrates turn by turn and every result lands in a context window." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow moves the plan into code. With subagents, skills, and agent teams, Claude is the orchestrator: it decides turn by turn what to spawn or assign next, and every result lands in a context window."
- `clm_f395b23fc4e7` — "A dynamic workflow script accepts no mid-run user input, has no direct filesystem or shell access, and fails before the run starts if it contains import() — the agents it coordinates are what read, write, and run commands." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "| No mid-run user input | Only agent permission prompts can pause a run."
- `clm_95dd4d28d6cd` — "A subagent can spawn subagents of its own up to three layers below the main conversation by default, and at that depth limit Claude Code withholds the Agent tool so the subagent does the work itself." · p 0.92 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "By default, a subagent can spawn subagents of its own, up to three layers below the main conversation."
- `clm_e0310c5f4dec` — "Claude Code scans every subagent's final report before Claude reads it, because files, web pages, and command output the subagent read can carry instructions aimed at the main conversation." · p 0.92 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "Claude Code scans each subagent's final report before Claude reads it. A subagent may have read files, web pages, or command output you never reviewed, and text from those sources can carry instructions aimed at the main conversation."
- `clm_198fc635f5f4` — "Explore and Plan are the only Claude Code subagents that start without CLAUDE.md files and git status, and no frontmatter field or setting changes which subagents skip them." · p 0.92 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "Explore and Plan are the only subagents that omit CLAUDE.md and git status. There is no frontmatter field or per-agent setting to change which agents skip them."
- `clm_64b87a2b64e4` — "A parent session running in bypassPermissions, acceptEdits, or auto mode takes precedence over whatever permission mode a subagent declares in its own frontmatter." · p 0.92 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "If the parent uses `bypassPermissions` or `acceptEdits`, this takes precedence and can't be overridden."
- `clm_c54b34646d07` — "Goal evaluation is skipped for any turn that ends while a subagent or background shell command is still running, and resumes at the end of the next turn that finishes with no background work." · p 0.92 · active · 1 support · 0 contradict
  - `src_5229aa475d30` Keep Claude working toward a goal: "If a subagent or a background shell command is still running when a turn ends, Claude Code skips the evaluation for that turn. It evaluates at the end of the next turn that finishes with no background work running."
- `clm_e90a14b6f054` — "Setting `run_in_background: true` on a Bash command starts it as a background task Claude can keep working alongside, and a command a foreground subagent started ends when that subagent gives its final response." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "For long-running processes such as dev servers or watch builds, Claude can set `run_in_background: true` to start the command as a background task and continue working while it runs. List and stop background tasks with `/tasks`."
- `clm_ce32f59798b3` — "Claude reaches other agents with two tools — `ListAgents` to discover which agents it can reach and `SendMessage` to deliver a message to one of them by name — and the same `SendMessage` tool also addresses subagents and agent-team teammates." · p 0.90 · active · 1 support · 0 contradict · when: Claude Code v2.1.224 or later on macOS, Linux, and WSL 2, Claude Code v2.1.234 or later on native Windows
  - `src_10e9043d62f0` Message your other Claude Code sessions: "Claude uses two tools for this: `ListAgents` to discover which agents it can reach, and `SendMessage` to deliver a message to one of them by name."
- `clm_1631e452feb8` — "Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision — with agents communicating through artifacts and shared state rather than unlimited conversational history, which is the constraint that prepares the system for graph architecture" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The practical tip: define an artifact contract for every handoff. The researcher returns claims with sources. The planner returns typed steps. The coder returns code and assumptions. The evaluator returns defects and a decision."
- `clm_5379e62f099f` — "A dynamic workflow's script body is plain JavaScript with top-level await in which agent() spawns one subagent and pipeline() runs one agent per item in a list." · p 0.90 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "The body is plain JavaScript with top-level `await`. `agent()` spawns one subagent and `pipeline()` runs one per item in a list."
- `clm_ab1aa0679c1d` — "Subagents can run in their own worktrees so parallel edits don't conflict, either by asking Claude to use worktrees for its agents or by adding `isolation: worktree` to a custom subagent's frontmatter." · p 0.90 · active · 1 support · 0 contradict
  - `src_0979d158a4cf` Run parallel sessions with worktrees: "Subagents can run in their own worktrees so parallel edits don't conflict."
- `clm_ad6abaac0af5` — "The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable sets the model for every subagent, agent team, and workflow agent, overriding both the per-invocation `model` parameter and a subagent definition's `model` frontmatter unless set to `inherit`." · p 0.90 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "The model Claude Code uses for all [subagents](/docs/en/sub-agents#choose-a-model), [agent teams](/docs/en/agent-teams), and agents in a [workflow](/docs/en/workflows)."
- `clm_39423a40f88e` — "Subagents fit quick, focused workers that report a result back, while agent teams fit work where the workers must share findings, challenge each other, and coordinate on their own." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Use subagents when you need quick, focused workers that report back. Use agent teams when teammates need to share findings, challenge each other, and coordinate on their own."
- `clm_f636b711007c` — "While agent teams are enabled, any subagent Claude spawns with a name launches as a teammate without a confirmation prompt, so a team can form during delegation the user never framed as team work." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Claude launches a teammate when it calls the [Agent tool](/docs/en/tools-reference) with a [`name`](/docs/en/sub-agents#subagent-names) while agent teams are enabled, and Claude Code doesn't ask you to confirm."
- `clm_cdc37e66617c` — "An agent hook spawns a subagent that can read files, search code, and use tools to verify a condition before returning its decision, unlike a prompt hook's single LLM call." · p 0.90 · active · 1 support · 0 contradict
  - `src_3466a5945e1e` Automate actions with hooks: "When verification requires inspecting files or running commands, use `type: "agent"` hooks."
- `clm_71598d00ebbf` — "The feedback loop and the verifier subagent are different things: the loop runs through the whole task as many times as the work needs, while the verifier packages the final check in a fresh context window once the session believes it is done, so the verdict is not colored by the assumptions that produced the code" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The verifier subagent, on the other hand, is one way to package the final check by running a fresh context window once the session believes the work is done. This way the verdict is not colored by the assumptions that produced the code."
- `clm_b8c4a4ce61d2` — "Two or three parallel Claude Code sessions is a sensible starting point, and the practical ceiling is how many streams one person can review properly — so sessions are added only while review is keeping up" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "Two or three sessions is a sensible starting point. The practical ceiling is how many streams one person can review properly, so add sessions only while review is keeping up."
- `clm_874d9cfdb703` — "Subagents handle complex sub-tasks with clean context windows while a todo list tracks progress across a long run." · p 0.79 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Delegate tasks | Subagents handle complex sub-tasks with clean context windows. A todo list tracks progress across a long run. | SubAgentMiddleware, AsyncSubAgentMiddleware, TodoListMiddleware |"
- `clm_fba2df5be733` — "A harness comprises system prompts, tools and their descriptions, bundled infrastructure such as filesystem, sandbox and browser, orchestration logic for subagent spawning and model routing, and hooks or middleware for deterministic execution." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "- System Prompts - Tools, Skills, MCPs and their descriptions - Bundled Infrastructure (filesystem, sandbox, browser) - Orchestration Logic (subagent spawning, handoffs, model routing) - Hooks/Middleware for deterministic execution…"
- `clm_2790bc8fcda1` — "The filesystem is a natural collaboration surface because multiple agents and humans coordinate through shared files." · p 0.76 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "**The filesystem is a natural collaboration surface.** Multiple agents and humans coordinate through shared files"

## Timeline

- 2026-08-23 new_claim `clm_45fbc544515a` (src_26d415487f93)
- 2026-08-23 new_claim `clm_a5e46d967548` (src_26d415487f93)
- 2026-08-23 new_claim `clm_cb95dc403e93` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_1691eac7dbb3` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_7da30002a7c7` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_b4a4dce90006` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_b538f92510e2` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_71598d00ebbf` (src_c65435745c66)
- 2026-08-23 new_claim `clm_b8c4a4ce61d2` (src_c65435745c66)
- 2026-08-23 new_claim `clm_1631e452feb8` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_fba2df5be733` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_2790bc8fcda1` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_874d9cfdb703` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_c54b34646d07` (src_5229aa475d30)
- 2026-08-23 new_claim `clm_ce32f59798b3` (src_10e9043d62f0)
- 2026-08-23 support_update `clm_b538f92510e2` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_1691eac7dbb3` (src_d6586d5c5c4f)
- 2026-08-23 support_update `clm_7da30002a7c7` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_e5ff207092fb` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_5379e62f099f` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_f395b23fc4e7` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_7c3de0c5639e` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_ab1aa0679c1d` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_0e89a8901cee` (src_0979d158a4cf)
- 2026-08-23 new_claim `clm_ad6abaac0af5` (src_a959e4684753)
- 2026-08-23 support_update `clm_b4a4dce90006` (src_5671f6c73f3d)
- 2026-08-23 support_update `clm_b538f92510e2` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_66b7f6ded709` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_198fc635f5f4` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_64b87a2b64e4` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_798c31b3b963` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_95dd4d28d6cd` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_e0310c5f4dec` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_39423a40f88e` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_f636b711007c` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_e90a14b6f054` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_cdc37e66617c` (src_3466a5945e1e)
- 2026-08-30 new_claim `clm_f6f929cedc0a` (src_99ad4fe8f1dd)
- 2026-08-30 new_claim `clm_3c7492d09031` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_0b9ff75db6fc` (src_2eb7a799d8a7)
- 2026-08-30 new_claim `clm_e08ab1bdbc30` (src_2eb7a799d8a7)
- 2026-08-30 support_update `clm_a5e46d967548` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_a02b62bcf985` (src_1d5f4c9615f1)
- 2026-09-02 new_claim `clm_3313bc585301` (src_9f2ae1e705ce)
- 2026-09-11 new_claim `clm_5ca433e00ea6` (src_ab670f25c35e)

## Related

- ← uses [[claude-security-plugin]] (1.00)
- ← uses [[dynamic-workflows]] (1.00)
- → uses [[context-window]] (1.00)
- ← related_to [[agent-teams]] (0.99)
- ← uses [[claude-code]] (0.99)
- ← applies_to [[model-selection]] (0.93)
- ← applies_to [[security-guidance-plugin]] (0.93)
- ← related_to [[pi]] (0.93)
- ← uses [[claude-code-review]] (0.93)
- → uses [[git-worktree]] (0.93)
- ← uses [[skills]] (0.93)
- ← part_of fork (no page yet) (0.93)
- … 13 more edges — `graph.py neighbors ent_subagents`
- [[claude-code]] — 14 shared claims
- [[dynamic-workflows]] — 6 shared claims
- [[context-window]] — 5 shared claims
- [[claude-security-plugin]] — 3 shared claims
- [[agent-teams]] — 2 shared claims
- [[claude-opus-5]] — 2 shared claims
- [[filesystem]] — 2 shared claims
- [[git-worktree]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[permission-mode]] — 2 shared claims
- [[schema-layer]] — 2 shared claims
- [[agent-harness]] — 1 shared claim
- [[bash-tool]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[claude-fable-5]] — 1 shared claim
- [[claude-fable-5-1]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[cross-session-messaging]] — 1 shared claim
- [[goal-evaluator]] — 1 shared claim
- [[graph-architecture]] — 1 shared claim
- [[listagents]] — 1 shared claim
- [[middleware]] — 1 shared claim
- [[model-context-protocol]] — 1 shared claim
- [[model-selection]] — 1 shared claim
- [[multi-agent-collaboration]] — 1 shared claim
- [[pi]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[review-md]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[security-guidance-plugin]] — 1 shared claim
- [[sendmessage]] — 1 shared claim
- [[skills]] — 1 shared claim
- [[verification-loop]] — 1 shared claim
- [[workflow-runtime]] — 1 shared claim
- agent hooks (no page yet)
- background task (no page yet)
- fork (no page yet)
