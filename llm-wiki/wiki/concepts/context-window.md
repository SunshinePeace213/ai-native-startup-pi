---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/a-harness-for-every-task-dynamic-workflows-in-claude-code.md, title: "A harness for every task: dynamic workflows in Claude Code", id: src_7415e8608f3c}
  - {resource: llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md, title: "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents", id: src_93a1e6058bf1}
  - {resource: llm-wiki/raw/articles/langchain/how-to-build-a-custom-agent-harness.md, title: "How to Build a Custom Agent Harness", id: src_f7dcee3b42fc}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-fable-5.md, title: "prompting-claude-fable-5", id: src_84badaa3952a}
  - {resource: llm-wiki/raw/docs/anthropic/prompting-claude-opus-5.md, title: "prompting-claude-opus-5", id: src_26d415487f93}
  - {resource: llm-wiki/raw/docs/claude-code/agent-teams.md, title: "Orchestrate teams of Claude Code sessions", id: src_67017872e4a4}
  - {resource: llm-wiki/raw/docs/claude-code/large-codebases.md, title: "Set up Claude Code in a monorepo or large codebase", id: src_5ed7c226af31}
  - {resource: llm-wiki/raw/docs/claude-code/mcp.md, title: "Connect Claude Code to tools via MCP", id: src_9e7c0cb34402}
  - {resource: llm-wiki/raw/docs/claude-code/memory.md, title: "How Claude remembers your project", id: src_e698013f1182}
  - {resource: llm-wiki/raw/docs/claude-code/model-config.md, title: "Model configuration", id: src_a959e4684753}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/claude-code/sub-agents.md, title: "Create custom subagents", id: src_5671f6c73f3d}
  - {resource: llm-wiki/raw/docs/claude-code/tools-reference.md, title: "Tools reference", id: src_ab9f8f38615f}
  - {resource: llm-wiki/raw/docs/claude-code/workflows.md, title: "Orchestrate subagents at scale with dynamic workflows", id: src_d6586d5c5c4f}
  - {resource: llm-wiki/raw/docs/pi/compaction.md, title: "Compaction & Branch Summarization", id: src_f3c56d2c0088}
  - {resource: llm-wiki/raw/docs/pi/session-format.md, title: "Session File Format", id: src_92c377275d79}
  - {resource: llm-wiki/raw/docs/pi/sessions.md, title: "Sessions", id: src_6888abe7e7b7}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_context_window]
claim_ids: [clm_b538f92510e2, clm_b4a4dce90006, clm_f964c916a3ac, clm_7ed354e5255b, clm_2bd0da02bf11, clm_673360e615f7, clm_199eade5a5f7, clm_798c31b3b963, clm_79a68b09eff3, clm_bd0cc70821d9, clm_cbe1bfbfb2c0, clm_e5ff207092fb, clm_8d8d4c1628d8, clm_108f88ad9156, clm_64156597f767, clm_708185b8ba6a, clm_3a7e3a8fb83b, clm_a5d9ea4f9972, clm_590e165834af, clm_d16362b414b2, clm_23c00ec362dd, clm_dc8405fc7378, clm_14f5761c068a, clm_3e6077428de5, clm_18d10b22c6d8, clm_70000f81f953, clm_b615b87a6731, clm_11e28d02ab4f, clm_7aa000c22eba, clm_5d4b33c3295a, clm_874d9cfdb703, clm_c9201456d93b, clm_b239352645a0, clm_4ed8d31fca58]
confidence: 0.89
stale_after: 2027-01-10
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# context window

> **In here:** Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window · 34 claims, confidence 0.89.

## Current understanding

- Isolation is the main reason to reach for a subagent instead of a skill: a subagent suits a side task whose intermediate results would clutter the main conversation, while a skill suits a procedure you want to play out inside the main thread so you can see and steer each step (1.00)
- A subagent's instructional body never enters the parent conversation at all: it runs in its own fresh context window and the only thing returning to the main session is its final message plus metadata (0.98)
- Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code — pushing team-specific conventions into path-scoped rules and procedures into skills as it grows (0.98)
- Six orchestration patterns compose into most workflows — classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, and loop-until-done — with loop-until-done the answer whenever the amount of work is unknown (0.98)
- Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window (0.93)
- A whole-file Read that exceeds the token limit returns only the first page with a `PARTIAL view` notice explaining how to continue with `offset` and `limit`, whereas a read that already passes an explicit `offset` or `limit` and still overflows returns an error instead (0.93)
- A 1 million token context window is supported by Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6, and on the Anthropic API Fable 5, Sonnet 5, and Opus 4.7 and later always run with it (0.93)
- A fork is a subagent that inherits the main session's entire conversation, system prompt, tools, and model, dropping the input isolation other subagents provide while still keeping its own tool calls out of the main context (0.93)
- A single CLAUDE.md at the root of a large codebase either grows to cover every subsystem's conventions, spending context on instructions unrelated to the current task, or stays too generic to be useful (0.93)
- Rules load into context every session or whenever a matching file is opened, while skills load only when invoked or judged relevant, which makes skills the fit for task-specific instructions that need not always be in context (0.93)
- Claude Code works at any repository size, but as a codebase grows its small-project defaults fill the context window with instructions and file reads unrelated to the task, costing tokens and degrading performance (0.93)
- A dynamic workflow script holds the loop, the branching, and the intermediate results itself so Claude's context holds only the final answer, whereas with subagents, skills, and agent teams Claude orchestrates turn by turn and every result lands in a context window (0.93)
- Pi auto-compacts once context tokens exceed the context window minus reserveTokens, which defaults to 16384 tokens held back for the model's response (0.92)
- When /tree leaves one branch for another, Pi can summarize the abandoned branch and attach that summary at the new position, carrying the context forward without replaying the whole branch (0.92)
- A Pi CustomMessageEntry is the extension-injected counterpart that does enter the LLM context, unlike a CustomEntry (0.92)
- Showing Claude Fable 5 a remaining-token countdown is what most often triggers it to suggest a new session, offer to summarize and hand off, or trim its own work, so harnesses should avoid surfacing explicit context-budget counts (0.91)
- Three criteria decide when a loop stops being sufficient and a graph becomes necessary — session persistence, cross-agent coordination, and traceability — and loops handle the first poorly because state is flushed with the context window, the second not at all because a loop is one agent, and the third weakly because conversation history is the only record (0.90)
- A teammate loads the same project context as a regular session — CLAUDE.md, MCP servers, and skills — plus the lead's spawn prompt, but inherits none of the lead's conversation history (0.90)
- An orchestrator becomes a context bottleneck unless its workers return bounded, typed artifacts rather than raw conversation: its context stays manageable on a 200-token artifact per worker and does not on a 5,000-token conversation transcript (0.90)
- Only the first 200 lines or first 25KB of auto memory's `MEMORY.md` index loads at the start of a conversation, so Claude keeps the index short and moves detailed notes into separate topic files (0.90)
- A skill's description is the text Claude matches against to decide when to apply the skill, and the combined description and when_to_use text is truncated at 1,536 characters in the skill listing (0.89)
- Bash output is read back into a command's result up to `BASH_MAX_OUTPUT_LENGTH` characters — 30,000 by default and 150,000 at most — but a valid result over roughly 30,000 characters still arrives as a saved file path plus a short preview no matter how high that variable is set (0.89)
- Where an account supports 1M context the option shows up in the `/model` picker, and the window can also be requested by appending a `[1m]` suffix to a model alias or a full model name (0.89)
- MCP tool output draws a warning past 10,000 tokens and is capped at 25,000 tokens by default, a ceiling raised with the `MAX_MCP_OUTPUT_TOKENS` environment variable while the warning threshold stays fixed (0.89)
- Implicit instructions drift under context pressure: broad behavioral guidance goes cold as the context fills, the model stops attending to it, and the behavior disappears quietly, usually right when it matters most (0.83)
- The context window is not memory but a temporary working surface, where the tokens at the top grow cold as the window fills (0.83)
- Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in (0.83)
- After a certain number of turns or a token threshold the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward — key documents get flagged for re-reference, and the team gets a lightweight reorientation before continuing (0.83)
- The longer Claude works on a complex task inside a single context window the more it becomes susceptible to three specific failure modes — agentic laziness, self-preferential bias, and goal drift — and a workflow combats them by orchestrating separate subagents with their own context windows and isolated goals (0.83)
- Long-running sessions accumulate message history fast and overflow the context window without intervention, which summarization and context-editing middleware exist to prevent (0.79)
- Subagents handle complex sub-tasks with clean context windows while a todo list tracks progress across a long run (0.79)
- Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context (0.77)
- The filesystem is the harness's durable-storage primitive: it lets agents interface with real data, offload information beyond context limits, and persist work across sessions (0.77)
- The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt into a clean context window, forcing the agent to keep working against a completion goal (0.77)

## Evidence

- `clm_b538f92510e2` — "Isolation is the main reason to reach for a subagent instead of a skill: a subagent suits a side task whose intermediate results would clutter the main conversation, while a skill suits a procedure you want to play out inside the main thread so you can see and steer each step" · p 1.00 · active · 3 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Use a skill when you want the procedure to play out inside the main thread so you can see and steer each step."
  - `src_07950e24c4ee` Extend Claude with skills: "Add `context: fork` to your frontmatter when you want a skill to run in isolation. The skill content becomes the prompt that drives the subagent. It won't have access to your conversation history."
  - `src_5671f6c73f3d` Create custom subagents: "Consider [Skills](/docs/en/skills) instead when you want reusable prompts or workflows that run in the main conversation context rather than isolated subagent context."
- `clm_b4a4dce90006` — "A subagent's instructional body never enters the parent conversation at all: it runs in its own fresh context window and the only thing returning to the main session is its final message plus metadata" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "The subagent then runs in its own fresh context window, and the only thing that returns to your main session is the subagent's final message (often the aggregated result of many subtasks) plus metadata."
  - `src_5671f6c73f3d` Create custom subagents: "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions."
- `clm_f964c916a3ac` — "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code — pushing team-specific conventions into path-scoped rules and procedures into skills as it grows" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code."
  - `src_e698013f1182` How Claude remembers your project: "**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."
- `clm_7ed354e5255b` — "Six orchestration patterns compose into most workflows — classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, and loop-until-done — with loop-until-done the answer whenever the amount of work is unknown" · p 0.98 · active · 2 support · 0 contradict
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "For tasks with an unknown amount of work, loop spawning agents until a stop condition is met (no new findings, or no more errors in the logs) instead of a fixed number of passes."
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow fits best when the task is larger than one agent can hold in context, or when the same step needs to run across many items. The prompts below show common shapes. Each one asks Claude to write and run a workflow for that task;"
- `clm_2bd0da02bf11` — "Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window" · p 0.93 · active · 1 support · 0 contradict
  - `src_26d415487f93` prompting-claude-opus-5: "as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout the window"
- `clm_673360e615f7` — "A whole-file Read that exceeds the token limit returns only the first page with a `PARTIAL view` notice explaining how to continue with `offset` and `limit`, whereas a read that already passes an explicit `offset` or `limit` and still overflows returns an error instead." · p 0.93 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "By default, Read returns the file from the start."
- `clm_199eade5a5f7` — "A 1 million token context window is supported by Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6, and on the Anthropic API Fable 5, Sonnet 5, and Opus 4.7 and later always run with it." · p 0.93 · active · 1 support · 0 contradict · when: on the Anthropic API for the always-on case
  - `src_a959e4684753` Model configuration: "Fable 5, Sonnet 5, Opus 4.6 and later, and Sonnet 4.6 support a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#context-window-sizes-by-model) for long sessions with large codebases."
- `clm_798c31b3b963` — "A fork is a subagent that inherits the main session's entire conversation, system prompt, tools, and model, dropping the input isolation other subagents provide while still keeping its own tool calls out of the main context." · p 0.93 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "A fork is a subagent that inherits the entire conversation so far instead of starting fresh."
- `clm_79a68b09eff3` — "A single CLAUDE.md at the root of a large codebase either grows to cover every subsystem's conventions, spending context on instructions unrelated to the current task, or stays too generic to be useful." · p 0.93 · active · 1 support · 0 contradict · when: in a large codebase or monorepo
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "In a large codebase, a single CLAUDE.md at the repository root tends to either grow to cover every subsystem's conventions, costing context on instructions unrelated to the current task, or stay too generic to be useful."
- `clm_bd0cc70821d9` — "Rules load into context every session or whenever a matching file is opened, while skills load only when invoked or judged relevant, which makes skills the fit for task-specific instructions that need not always be in context." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "Rules load into context every session or when matching files are opened."
- `clm_cbe1bfbfb2c0` — "Claude Code works at any repository size, but as a codebase grows its small-project defaults fill the context window with instructions and file reads unrelated to the task, costing tokens and degrading performance." · p 0.93 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "A large codebase can be one repository with millions of lines or a monorepo with many packages."
- `clm_e5ff207092fb` — "A dynamic workflow script holds the loop, the branching, and the intermediate results itself so Claude's context holds only the final answer, whereas with subagents, skills, and agent teams Claude orchestrates turn by turn and every result lands in a context window." · p 0.93 · active · 1 support · 0 contradict
  - `src_d6586d5c5c4f` Orchestrate subagents at scale with dynamic workflows: "A workflow moves the plan into code. With subagents, skills, and agent teams, Claude is the orchestrator: it decides turn by turn what to spawn or assign next, and every result lands in a context window."
- `clm_8d8d4c1628d8` — "Pi auto-compacts once context tokens exceed the context window minus reserveTokens, which defaults to 16384 tokens held back for the model's response." · p 0.92 · active · 1 support · 0 contradict
  - `src_f3c56d2c0088` Compaction & Branch Summarization: "By default, `reserveTokens` is 16384 tokens (configurable in `~/.pi/agent/settings.json` or `<project-dir>/.pi/settings.json`). This leaves room for the LLM's response."
- `clm_108f88ad9156` — "When /tree leaves one branch for another, Pi can summarize the abandoned branch and attach that summary at the new position, carrying the context forward without replaying the whole branch." · p 0.92 · active · 1 support · 0 contradict
  - `src_6888abe7e7b7` Sessions: "When `/tree` switches away from one branch to another, pi can summarize the abandoned branch and attach that summary at the new position. This preserves important context from the path you left without replaying the whole branch."
- `clm_64156597f767` — "A Pi CustomMessageEntry is the extension-injected counterpart that does enter the LLM context, unlike a CustomEntry." · p 0.92 · active · 1 support · 0 contradict
  - `src_92c377275d79` Session File Format: "Extension-injected messages that DO participate in LLM context."
- `clm_708185b8ba6a` — "Showing Claude Fable 5 a remaining-token countdown is what most often triggers it to suggest a new session, offer to summarize and hand off, or trim its own work, so harnesses should avoid surfacing explicit context-budget counts" · p 0.91 · active · 1 support · 0 contradict · when: in very long sessions
  - `src_84badaa3952a` prompting-claude-fable-5: "In very long sessions, Claude Fable 5 can occasionally suggest a new session, offer to summarize and hand off, or trim its own work. This is most often triggered when the harness shows a remaining-token countdown to the model."
- `clm_3a7e3a8fb83b` — "Three criteria decide when a loop stops being sufficient and a graph becomes necessary — session persistence, cross-agent coordination, and traceability — and loops handle the first poorly because state is flushed with the context window, the second not at all because a loop is one agent, and the third weakly because conversation history is the only record" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "First, **session persistence**: if the work spans multiple sessions and transcript replay is no longer practical, state needs to live outside the context window — the graph."
- `clm_a5d9ea4f9972` — "A teammate loads the same project context as a regular session — CLAUDE.md, MCP servers, and skills — plus the lead's spawn prompt, but inherits none of the lead's conversation history." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Each teammate has its own context window. When spawned, a teammate loads the same project context as a regular session: CLAUDE.md, MCP servers, and skills. It also receives the spawn prompt from the lead."
- `clm_590e165834af` — "An orchestrator becomes a context bottleneck unless its workers return bounded, typed artifacts rather than raw conversation: its context stays manageable on a 200-token artifact per worker and does not on a 5,000-token conversation transcript" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "Practical systems should require workers to return structured artifacts rather than raw conversation — bounded summaries with typed fields, not open-ended text."
- `clm_d16362b414b2` — "Only the first 200 lines or first 25KB of auto memory's `MEMORY.md` index loads at the start of a conversation, so Claude keeps the index short and moves detailed notes into separate topic files." · p 0.90 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. Content beyond that threshold is not loaded at session start."
- `clm_23c00ec362dd` — "A skill's description is the text Claude matches against to decide when to apply the skill, and the combined description and when_to_use text is truncated at 1,536 characters in the skill listing." · p 0.89 · active · 1 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "What the skill does and when to use it. Claude uses this to decide when to apply the skill. If omitted, uses the first paragraph of markdown content."
- `clm_dc8405fc7378` — "Bash output is read back into a command's result up to `BASH_MAX_OUTPUT_LENGTH` characters — 30,000 by default and 150,000 at most — but a valid result over roughly 30,000 characters still arrives as a saved file path plus a short preview no matter how high that variable is set." · p 0.89 · active · 1 support · 0 contradict
  - `src_ab9f8f38615f` Tools reference: "[`BASH_MAX_OUTPUT_LENGTH`](/docs/en/env-vars) sets how many characters of output Claude Code reads back from the working file into a command's result: 30,000 by default, up to a hard ceiling of 150,000."
- `clm_14f5761c068a` — "Where an account supports 1M context the option shows up in the `/model` picker, and the window can also be requested by appending a `[1m]` suffix to a model alias or a full model name." · p 0.89 · active · 1 support · 0 contradict
  - `src_a959e4684753` Model configuration: "If your account supports 1M context, the option appears in the `/model` picker in the latest versions of Claude Code. If you don't see it, try restarting your session."
- `clm_3e6077428de5` — "MCP tool output draws a warning past 10,000 tokens and is capped at 25,000 tokens by default, a ceiling raised with the `MAX_MCP_OUTPUT_TOKENS` environment variable while the warning threshold stays fixed." · p 0.89 · active · 1 support · 0 contradict
  - `src_9e7c0cb34402` Connect Claude Code to tools via MCP: "Claude Code displays a warning when MCP tool output exceeds 10,000 tokens and limits output to 25,000 tokens by default. To raise the limit, set the `MAX_MCP_OUTPUT_TOKENS` environment variable (for example, `MAX_MCP_OUTPUT_TOKENS=50000`);"
- `clm_18d10b22c6d8` — "Implicit instructions drift under context pressure: broad behavioral guidance goes cold as the context fills, the model stops attending to it, and the behavior disappears quietly, usually right when it matters most." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "**Implicit instructions drift.** Broad behavioral guidance goes cold as context fills. The model stops attending to it. The behavior disappears quietly, usually right when it matters most."
- `clm_70000f81f953` — "The context window is not memory but a temporary working surface, where the tokens at the top grow cold as the window fills." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "The context window is not memory. It is a temporary working surface. Tokens at the top grow cold as the window fills."
- `clm_b615b87a6731` — "Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "This is not just token economy. It is bias prevention. The team's first read of the research happens together, with the objective present, without a single agent's navigational drift already baked in."
- `clm_11e28d02ab4f` — "After a certain number of turns or a token threshold the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward — key documents get flagged for re-reference, and the team gets a lightweight reorientation before continuing." · p 0.83 · active · 1 support · 0 contradict · when: for complex multi-agent systems running long sessions, and overkill for a simple wiki
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "After a certain number of turns or a token threshold, the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward. Key documents get flagged for re-reference."
- `clm_7aa000c22eba` — "The longer Claude works on a complex task inside a single context window the more it becomes susceptible to three specific failure modes — agentic laziness, self-preferential bias, and goal drift — and a workflow combats them by orchestrating separate subagents with their own context windows and isolated goals" · p 0.83 · active · 1 support · 0 contradict · when: over long-running, massively parallel, highly structured or adversarial tasks
  - `src_7415e8608f3c` A harness for every task: dynamic workflows in Claude Code: "This is because the longer Claude works on a complex task in a single context window, the more it becomes susceptible to a few specific failure modes:"
- `clm_5d4b33c3295a` — "Long-running sessions accumulate message history fast and overflow the context window without intervention, which summarization and context-editing middleware exist to prevent." · p 0.79 · active · 1 support · 0 contradict · when: in long-running sessions
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Prevent context overflow | Long-running sessions accumulate message history fast. Without intervention, it overflows the context window. | SummarizationMiddleware, ContextEditingMiddleware |"
- `clm_874d9cfdb703` — "Subagents handle complex sub-tasks with clean context windows while a todo list tracks progress across a long run." · p 0.79 · active · 1 support · 0 contradict
  - `src_f7dcee3b42fc` How to Build a Custom Agent Harness: "| Delegate tasks | Subagents handle complex sub-tasks with clean context windows. A todo list tracks progress across a long run. | SubAgentMiddleware, AsyncSubAgentMiddleware, TodoListMiddleware |"
- `clm_c9201456d93b` — "Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "Context Rot describes how models become worse at reasoning and completing tasks as their context window fills up. Context is a precious and scarce resource, so harnesses need strategies to manage it."
- `clm_b239352645a0` — "The filesystem is the harness's durable-storage primitive: it lets agents interface with real data, offload information beyond context limits, and persist work across sessions." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "Agents need durable storage to interface with real data, offload information beyond context limits, and persist work across sessions."
- `clm_4ed8d31fca58` — "The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt into a clean context window, forcing the agent to keep working against a completion goal." · p 0.77 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "The Ralph Loop is a harness pattern that intercepts the model's exit attempt via a hook and reinjects the original prompt in a clean context window, forcing the agent to continue its work against a completion goal."

## Timeline

- 2026-08-20 new_claim `clm_70000f81f953` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_18d10b22c6d8` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_b615b87a6731` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_11e28d02ab4f` (src_b585de1a26bb)
- 2026-08-23 new_claim `clm_2bd0da02bf11` (src_26d415487f93)
- 2026-08-23 new_claim `clm_708185b8ba6a` (src_84badaa3952a)
- 2026-08-23 new_claim `clm_7aa000c22eba` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_7ed354e5255b` (src_7415e8608f3c)
- 2026-08-23 new_claim `clm_f964c916a3ac` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_b4a4dce90006` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_b538f92510e2` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_590e165834af` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_3a7e3a8fb83b` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_b239352645a0` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_c9201456d93b` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_4ed8d31fca58` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_5d4b33c3295a` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_874d9cfdb703` (src_f7dcee3b42fc)
- 2026-08-23 new_claim `clm_3e6077428de5` (src_9e7c0cb34402)
- 2026-08-23 new_claim `clm_23c00ec362dd` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_b538f92510e2` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_7ed354e5255b` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_e5ff207092fb` (src_d6586d5c5c4f)
- 2026-08-23 new_claim `clm_199eade5a5f7` (src_a959e4684753)
- 2026-08-23 new_claim `clm_14f5761c068a` (src_a959e4684753)
- 2026-08-23 new_claim `clm_cbe1bfbfb2c0` (src_5ed7c226af31)
- 2026-08-23 new_claim `clm_79a68b09eff3` (src_5ed7c226af31)
- 2026-08-23 support_update `clm_b4a4dce90006` (src_5671f6c73f3d)
- 2026-08-23 support_update `clm_b538f92510e2` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_798c31b3b963` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_a5d9ea4f9972` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_dc8405fc7378` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_673360e615f7` (src_ab9f8f38615f)
- 2026-08-23 new_claim `clm_bd0cc70821d9` (src_e698013f1182)
- 2026-08-23 support_update `clm_f964c916a3ac` (src_e698013f1182)
- 2026-08-23 new_claim `clm_d16362b414b2` (src_e698013f1182)
- 2026-09-11 new_claim `clm_108f88ad9156` (src_6888abe7e7b7)
- 2026-09-11 new_claim `clm_8d8d4c1628d8` (src_f3c56d2c0088)
- 2026-09-11 new_claim `clm_64156597f767` (src_92c377275d79)

## Related

- ← uses [[subagents]] (1.00)
- ← applies_to [[cache-rewarming]] (0.94)
- ← applies_to [[compaction]] (0.93)
- ← uses [[agent-teams]] (0.93)
- ← uses [[claude-opus-5]] (0.93)
- ← produces [[model-alias]] (0.92)
- ← related_to [[session]] (0.92)
- ← related_to [[claude-fable-5]] (0.91)
- ← depends_on [[agent-loops]] (0.90)
- ← related_to [[orchestrator-workers]] (0.90)
- ← applies_to [[dynamic-workflows]] (0.83)
- ← applies_to [[librarian]] (0.80)
- … 4 more edges — `graph.py neighbors ent_context_window`
- [[subagents]] — 5 shared claims
- [[claude-code]] — 4 shared claims
- [[schema-layer]] — 4 shared claims
- [[agent-harness]] — 3 shared claims
- [[dynamic-workflows]] — 3 shared claims
- [[pi]] — 3 shared claims
- [[skills]] — 3 shared claims
- [[cache-rewarming]] — 2 shared claims
- [[claude-fable-5]] — 2 shared claims
- [[context-rot]] — 2 shared claims
- [[explicit-triggers]] — 2 shared claims
- [[librarian]] — 2 shared claims
- [[middleware]] — 2 shared claims
- [[monorepo]] — 2 shared claims
- [[rules]] — 2 shared claims
- [[session]] — 2 shared claims
- [[statelessness]] — 2 shared claims
- [[adversarial-verification]] — 1 shared claim
- [[agent-loops]] — 1 shared claim
- [[agent-teams]] — 1 shared claim
- [[auto-memory]] — 1 shared claim
- [[bash-tool]] — 1 shared claim
- [[claude-opus-5]] — 1 shared claim
- [[claude-sonnet-5]] — 1 shared claim
- [[compaction]] — 1 shared claim
- [[filesystem]] — 1 shared claim
- [[graph-architecture]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[mcp-tool]] — 1 shared claim
- [[model-alias]] — 1 shared claim
- [[orchestrator-workers]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[query]] — 1 shared claim
- [[read-tool]] — 1 shared claim
- [[skill-description]] — 1 shared claim
- fork (no page yet)
- Ralph Loop (no page yet)
