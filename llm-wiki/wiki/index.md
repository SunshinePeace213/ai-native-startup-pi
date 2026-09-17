# Wiki Index

Catalog of the synthesis layer — one section per type folder under
`llm-wiki/wiki/`, each `In here` cell repeating its page's summary line
verbatim. This file is the routing tier: read it to choose a page.

## Concepts

| Page | Status | In here |
| --- | --- | --- |
| [[aa-omniscience]] | current | The AA-Omniscience paper reports Claude 4.1 Opus as the top scorer at 4.8 and only three models above zero, far below the live leaderboard's 43.73 leader, so the published headline result no longer… · 6 claims, confidence 0.81. |
| [[adaptive-thinking]] | current | Adaptive thinking is on by default on Claude Sonnet 5, a change from Sonnet 4.6 where the same requests ran without thinking, and manual extended thinking is removed and returns a 400 error · 3 claims, confidence 0.92. |
| [[adversarial-verification]] | current | adversarial verification — 3 claims, confidence 0.86, 3 sources. |
| [[agent-evaluation]] | current | No single evaluation layer catches every issue, so the most effective teams combine automated evals for fast iteration, production monitoring for ground truth, and periodic human review for… · 6 claims, confidence 0.81. |
| [[agent-harness]] | current | A harness is every piece of code, configuration, and execution logic beyond the model itself; · 20 claims, confidence 0.80. |
| [[agent-memory]] | current | Memory file standards such as AGENTS.md are a form of continual learning: agents durably store knowledge from one session and the harness injects it into future sessions · 3 claims, confidence 0.87. |
| [[agent-teams]] | current | Subagents fit quick, focused workers that report a result back, while agent teams fit work where the workers must share findings, challenge each other, and coordinate on their own · 9 claims, confidence 0.90. |
| [[agent-trace]] | current | For teams running open-weight models the hill climbing loop can feed RL fine-tuning, using trace or eval outcomes as training signal to improve the model itself · 5 claims, confidence 0.78. |
| [[agentic-coding]] | current | Most agentic coding sessions follow one predictable pattern — request changes, gather context, execute actions, verify results, and iterate if needed · 7 claims, confidence 0.86. |
| [[agentic-workflow]] | current | Andrew Ng reports GPT-3.5 solving 48.1% of HumanEval zero-shot and GPT-4 67.0%, while GPT-3.5 wrapped in an agentic workflow reaches 95.1% · 4 claims, confidence 0.91. |
| [[agents-skills]] | current | Clients look for skills in a default directory — VS Code uses .agents/skills/ — so creating .agents/skills/<name>/SKILL.md in a project is enough to make a skill discoverable · 4 claims, confidence 0.87. |
| [[ai-native-startup]] | current | An AI-native startup's defensible moat at Scale is built from accumulated depth · 5 claims, confidence 0.84. |
| [[allowed-tools]] | current | The optional allowed-tools field is a space-separated string of pre-approved tools and is explicitly experimental, so support for it may vary between agent implementations · 5 claims, confidence 0.91. |
| [[apex-agents]] | current | APEX-Agents ranks on Mean Score, the average share of rubric criteria passed, while Pass@1 counts only tasks scoring 100% of the rubric on a single attempt · 10 claims, confidence 0.82. |
| [[auto-mode]] | current | Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or… · 2 claims, confidence 0.93. |
| [[automationbench]] | current | Each AutomationBench-AA task run is capped at roughly 50 tool-using turns against simulated Gmail, Salesforce, Slack, Zendesk, Jira, HubSpot and similar apps reached through REST API tools · 6 claims, confidence 0.82. |
| [[bare-mode]] | current | Bare mode makes a headless Claude Code run reproducible across machines by skipping auto-discovery of hooks, skills, custom commands, subagents, plugins, MCP servers, auto memory, and CLAUDE.md, and… · 2 claims, confidence 0.93. |
| [[branch-protection]] | current | Editing a ruleset to push past a required check is the failure branch protection exists to prevent rather than a workaround for it, and a rule that names an allowed head branch without a condition… · 2 claims, confidence 0.74. |
| [[cache-rewarming]] | current | After a certain number of turns or a token threshold the librarian injects a brief recap — what was retrieved, why it was relevant, what the team is building toward · 2 claims, confidence 0.83. |
| [[claim]] | current | The entity claim status merged into claim because a claim's status is a property of the claim and not a separate concept; its page stopped rendering and its name and alias joined claim's aliases · 19 claims, confidence 0.87. |
| [[command-menu]] | current | After a typo the command menu highlights nothing and still lists the close matches, so pressing Enter submits the text as typed and reports an Unknown command error instead of running the nearest… · 3 claims, confidence 0.91. |
| [[compaction]] | current | When one Pi turn is itself larger than keepRecentTokens the cut point lands mid-turn at an assistant message, and Pi then merges a history summary with a turn-prefix summary · 8 claims, confidence 0.92. |
| [[completion-condition]] | current | A goal condition has to be something Claude's own output can demonstrate in the transcript, because the evaluator judges only what has surfaced in the conversation and never runs commands or reads… · 3 claims, confidence 0.93. |
| [[confidence-scoring]] | current | A claim's confidence is not one number · 4 claims, confidence 0.87. |
| [[context-engineering]] | current | A reference no longer has to be a simple markdown spec: Claude handles richer forms including HTML artifacts, code, a detailed test suite, a function in another codebase to port, and rubrics that… · 10 claims, confidence 0.83. |
| [[context-rot]] | current | Context rot is the degradation of a model's reasoning and task completion as its context window fills up, which is why harnesses need explicit strategies to manage context · 3 claims, confidence 0.76. |
| [[context-window]] | current | Claude Opus 5 carries a 1M token context window as both the default and the maximum, and its instruction following, tool calling, and reasoning stay consistent throughout that window · 34 claims, confidence 0.89. |
| [[cross-model-review]] | current | Review direction matters: in Xiang et al.'s LiveCodeBench study Claude reviewing Codex raised accuracy from 71.6% to 89.7% while Codex reviewing Claude lowered it from 91.4% to 82.8%, so the… · 3 claims, confidence 0.92. |
| [[cross-session-messaging]] | current | A message to a session on the same machine travels over a per-session socket, or a named pipe on native Windows, and never through Anthropic servers, while a message to a session on another of your… · 9 claims, confidence 0.90. |
| [[deepswe]] | current | DeepSWE v1.1 sets main to the task's starting commit with no future commits visible instead of running the agent in detached HEAD, so the agent branches and commits the way it would in normal… · 8 claims, confidence 0.81. |
| [[defense-in-depth]] | current | Anthropic's security layers stack by stage: the security-guidance plugin in session, /security-review as a single on-demand pass over the branch, the Claude Security plugin as an on-demand deep… · 4 claims, confidence 0.95. |
| [[effort-level]] | current | Effort determines how far Claude will travel along its capability curve, not how far it must travel to complete the task, so effort cannot substitute for a model that lacks the capability · 26 claims, confidence 0.91. |
| [[embeddings]] | current | No cosine-similarity threshold cleanly separates same-entity mentions from related-but-distinct ones — the best achievable was F1 0.667 at threshold 0.72 · 3 claims, confidence 0.93. |
| [[entity-extraction]] | current | entity extraction — 2 claims, confidence 0.98, 5 sources. |
| [[entity-resolution]] | current | Entity resolution runs as two stages rather than one cosine threshold: a low vector-similarity threshold screens out the obviously-unrelated candidates for free, then each surviving candidate gets… · 5 claims, confidence 0.84. |
| [[eval-suite]] | current | eval suite — 7 claims, confidence 0.88, 2 sources. |
| [[eval-task]] | current | A good eval task is one where two domain experts would independently reach the same pass/fail verdict; ambiguity in the task specification turns into noise in the metric · 4 claims, confidence 0.77. |
| [[evidence-span]] | current | evidence span — 3 claims, confidence 0.82, 1 source. |
| [[explicit-triggers]] | current | The working principle of schema design is that explicit schema stays minimal and structural, implicit charters carry judgment and culture, and explicit triggers connect the two at the right moment… · 3 claims, confidence 0.83. |
| [[filesystem]] | current | The filesystem is a natural collaboration surface because multiple agents and humans coordinate through shared files · 5 claims, confidence 0.76. |
| [[founder]] | current | The founder being in every loop is an asset at MVP and the constraint at Launch, and the transition from doing the work to designing the systems that do the work is one of the hardest shifts in the… · 3 claims, confidence 0.83. |
| [[git-worktree]] | current | git worktree — 9 claims, confidence 0.91, 2 sources. |
| [[goal-evaluator]] | current | A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion… · 4 claims, confidence 0.94. |
| [[golden-set]] | current | The retrieval golden set holds 34 cases across six families, grown from 20, and its baseline under the Phase 4 retriever and the fusion-v1 config measured fused MRR 0.4657 at recall 0.74 against… · 3 claims, confidence 0.73. |
| [[grader]] | current | grader — 8 claims, confidence 0.85, 3 sources. |
| [[graph-architecture]] | current | A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; · 4 claims, confidence 0.90. |
| [[graph-traversal]] | current | An ingest extracts structured entities — people, projects, libraries, concepts, files, decisions · 3 claims, confidence 0.94. |
| [[guardrail]] | current | AutomationBench scores a task 0 whenever any guardrail is violated and otherwise credits the share of objectives completed, where guardrails are the checks that already held before the agent acted · 2 claims, confidence 0.82. |
| [[hallucination]] | current | GPT-6 Astra's hallucination rate on AA-Omniscience fell to 51% at max effort from GPT-5.6 Sol's 92%, while accuracy also rose · 9 claims, confidence 0.92. |
| [[html-output-format]] | current | Markdown became an increasingly restrictive output format as agents grew more powerful, and members of the Claude Code team now prefer HTML for outputs they read, share, and use as specs and… · 7 claims, confidence 0.81. |
| [[human-in-the-loop]] | current | Expertise that can be codified belongs in the prompt or tools, but sensitive actions such as financial transactions and database operations need live human review · 4 claims, confidence 0.83. |
| [[hybrid-search]] | current | Search that scales combines four retrieval streams · 10 claims, confidence 0.79. |
| [[jailbreak]] | current | jailbreak — 4 claims, confidence 0.93, 1 source. |
| [[json-event-stream-mode]] | current | In Pi's JSON stream the message_end event carries the final authoritative message, so a consumer need not reassemble deltas to get the settled text · 4 claims, confidence 0.92. |
| [[judge-bias]] | current | LLM judges reward length — GPT-4 picked the longer answer more than 90% of the time once lengths differed by over 20% · 5 claims, confidence 0.88. |
| [[judge-calibration]] | current | Raw accuracy misleads on an imbalanced review set: when 80% of outputs pass, a judge that always says pass scores 80% accuracy with κ near zero, so agreement is reported with precision and recall on… · 2 claims, confidence 0.89. |
| [[keybindings]] | current | Every Pi keyboard shortcut is rebindable through ~/.pi/agent/keybindings.json, and an action may carry one key or an array of them · 4 claims, confidence 0.92. |
| [[knowledge-graph]] | current | A knowledge graph is justified only when the same entity or relationship is queried by more than one agent or across more than one session; · 11 claims, confidence 0.91. |
| [[latency]] | current | Engineer a prompt that works well without model or prompt constraints first and only then apply latency reduction, because premature latency optimization can hide what top performance looks like · 7 claims, confidence 0.93. |
| [[llm-as-judge]] | current | An LLM-as-judge grader needs close calibration against human experts, an explicit way out such as returning "Unknown" when it lacks information, and one isolated judge per rubric dimension rather… · 18 claims, confidence 0.90. |
| [[llm-wiki]] | current | In the LLM Wiki pattern the LLM incrementally builds and maintains a persistent wiki — a structured, interlinked collection of markdown files that sits between a reader and their raw sources · 29 claims, confidence 0.87. |
| [[loop-engineering]] | current | The agent loop, the first level of the stack, is a model calling tools in a loop until a task is complete · 8 claims, confidence 0.80. |
| [[managed-settings]] | current | Managed settings an organization deploys sit at the top of Claude Code's precedence stack, so nothing a developer sets overrides them — not even a key passed with `--settings` · 3 claims, confidence 0.93. |
| [[mcp-installation-scope]] | current | When the same MCP server is defined in more than one scope, Claude Code connects once using the entire entry from the highest-precedence source, and never merges fields across scopes · 2 claims, confidence 0.93. |
| [[mcp-tool]] | current | A tool from a plugin-bundled MCP server is callable as `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, with every character outside letters, digits, underscore, and hyphen replaced by an… · 4 claims, confidence 0.89. |
| [[memory-lifecycle]] | current | A wiki that never forgets becomes noisy, so a retention curve lets facts that were important once but have not been accessed or reinforced in months gradually fade — deprioritized rather than deleted · 4 claims, confidence 0.90. |
| [[middleware]] | current | Because each middleware piece is isolated, the same middleware can be reused across every agent in an organization so new agents inherit battle-tested behavior without rebuilding it · 8 claims, confidence 0.79. |
| [[model-alias]] | current | The model version that the `opus` and `sonnet` aliases resolve to is not fixed — it depends on which provider Claude Code is talking to · 4 claims, confidence 0.92. |
| [[model-context-protocol]] | current | Model Context Protocol — 2 claims, confidence 0.93, 2 sources. |
| [[monorepo]] | current | monorepo — 4 claims, confidence 0.93, 2 sources. |
| [[multi-agent-collaboration]] | current | Every multi-agent handoff needs an artifact contract — the researcher returns claims with sources, the planner typed steps, the coder code and assumptions, the evaluator defects and a decision · 2 claims, confidence 0.90. |
| [[non-interactive-mode]] | current | A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs · 10 claims, confidence 0.90. |
| [[oauth]] | current | OAuth — 3 claims, confidence 0.93, 2 sources. |
| [[observation]] | current | observation — 7 claims, confidence 0.85, 4 sources. |
| [[orchestrator-workers]] | current | An orchestrator becomes a context bottleneck unless its workers return bounded, typed artifacts rather than raw conversation: its context stays manageable on a 200-token artifact per worker and does… · 3 claims, confidence 0.90. |
| [[output-consistency]] | current | Precisely defining the desired output format with JSON, XML, or a custom template makes Claude follow every required formatting element · 6 claims, confidence 0.93. |
| [[permission-mode]] | current | A `-p` session starts in the Manual permission mode on every plan, so a non-interactive run that wants a different baseline must pass the permission mode it needs · 19 claims, confidence 0.91. |
| [[permission-rule]] | current | Every surface that names a Claude Code tool — settings permissions, CLI flags, subagent and skill frontmatter, and hook conditions · 9 claims, confidence 0.91. |
| [[permission-system]] | current | permission system — 4 claims, confidence 0.92, 3 sources. |
| [[pi-extension]] | current | A Pi extension can intercept compaction through the session_before_compact event to cancel it outright or supply its own summary · 22 claims, confidence 0.92. |
| [[pi-package]] | current | Git-sourced Pi packages pin to a tag or commit, and pi update reconciles an existing clone to the configured ref without ever advancing it to a newer one · 5 claims, confidence 0.92. |
| [[planning]] | current | Ng rates Planning as emerging rather than robust — he cannot always get planning agents to work reliably · 3 claims, confidence 0.85. |
| [[prefill]] | current | Prefilling the assistant turn is not supported on Claude 4.6 and later models or on Claude Mythos Preview; structured outputs on models that support them, or system prompt instructions, replace it · 2 claims, confidence 0.96. |
| [[print-mode]] | current | The -p / --print flag is Claude Code's non-interactive entry point: it prints the response instead of opening an interactive session, and is the surface used for programmatic and SDK-style invocation · 3 claims, confidence 0.90. |
| [[progressive-disclosure]] | current | Progressive disclosure replaced loading everything upfront: verification and code review moved into skills Claude Code calls selectively, and deferred-loading tools cost no context until the agent… · 11 claims, confidence 0.91. |
| [[prompt-injection]] | current | Before deploying, an agent should be tested with documents, emails, and tool outputs that deliberately contain injection attempts, confirming Claude ignores them and the screening and confirmation… · 12 claims, confidence 0.93. |
| [[prompt-leak]] | current | Monitoring techniques such as output screening and post-processing should be tried before leak-resistant prompting, to catch instances of prompt leak without changing the prompt · 6 claims, confidence 0.93. |
| [[prompt-template]] | current | Pi does not walk subdirectories when discovering prompt templates in a prompts/ directory; nested templates must be added explicitly through settings or a package manifest · 5 claims, confidence 0.92. |
| [[rag]] | current | RAG retrieves chunks at query time and so rediscovers knowledge from scratch on every question, accumulating nothing between queries · 4 claims, confidence 0.92. |
| [[raw-layer]] | current | The raw layer is immutable — the LLM reads from it but never modifies it — and it is the source of truth for everything built above it · 8 claims, confidence 0.88. |
| [[reflection]] | current | A reflection loop separates critique from rewriting — request a structured list of issues first, then feed that list into a distinct revision step · 2 claims, confidence 0.90. |
| [[release-branch]] | current | A release branch earns its existence only from stabilization work — commits, a version bump, fixes — while the integration branch keeps moving; · 2 claims, confidence 0.74. |
| [[rendered-page]] | current | rendered page — 8 claims, confidence 0.81, 5 sources. |
| [[review-md]] | current | The review agents read REVIEW.md as-is: @ import syntax is not expanded and referenced files are not read along with it, so every rule to be enforced must sit directly in the file · 5 claims, confidence 0.93. |
| [[rpc-mode]] | current | In Pi's RPC mode ctx.hasUI is true because dialogs work over the sub-protocol, so an extension must guard genuinely terminal-bound features on ctx.mode === "tui" rather than on hasUI · 6 claims, confidence 0.92. |
| [[sandbox]] | current | Sandboxes give agents safe operating environments: rather than executing locally, the harness connects to a sandbox to run code, inspect files, and install dependencies in isolation · 12 claims, confidence 0.90. |
| [[schema-layer]] | current | The working principle of schema design is that explicit schema stays minimal and structural, implicit charters carry judgment and culture, and explicit triggers connect the two at the right moment… · 27 claims, confidence 0.91. |
| [[segmentation]] | current | When a wiki outgrows its structure the answer is not a stronger foundation but more foundations — each one narrow, each one purpose-built, each one carrying only what it needs to carry · 6 claims, confidence 0.82. |
| [[session]] | current | A Pi session file is JSONL where each line is a typed JSON object, and entries form a tree through id and parentId so branching happens in place rather than by creating new files · 13 claims, confidence 0.92. |
| [[settings-file]] | current | Claude Code reports a whole settings file as a Settings Error when its JSON or a value is rejected and offers to fix, exit, or continue without it, but downgrades individual bad entries to a… · 14 claims, confidence 0.92. |
| [[skill-catalog]] | current | Skills the user disabled, that permissions deny, or that opted out of model-driven activation should be hidden from the catalog entirely rather than listed and blocked at activation, so the model… · 4 claims, confidence 0.87. |
| [[skill-description]] | current | An effective description uses imperative phrasing framed as an instruction to the agent, focuses on user intent rather than implementation, errs on the side of being pushy about the contexts where… · 14 claims, confidence 0.89. |
| [[skill-md]] | current | A SKILL.md file has two parts — YAML frontmatter between --- markers that tells Claude when to use the skill, and markdown instructions Claude follows when it runs · 32 claims, confidence 0.90. |
| [[skill-scripts]] | current | Scripts should emit structured formats such as JSON, CSV, or TSV rather than free-form text, so both the agent and standard tools can consume the output, with data on stdout and diagnostics on stderr · 13 claims, confidence 0.87. |
| [[slash-command]] | current | A Pi prompt template's filename is its command name, so review.md is invoked as /review · 8 claims, confidence 0.92. |
| [[state-layer]] | current | state layer — 20 claims, confidence 0.83, 8 sources. |
| [[statelessness]] | current | There is no such thing as a stateful LLM by itself: every stateful LLM system is built around a stateless model call, which is the constraint every wiki builder is working inside · 3 claims, confidence 0.83. |
| [[streaming]] | current | Streaming lets the model start returning its response before the full output is complete, which significantly improves perceived responsiveness because users see output in real time · 3 claims, confidence 0.93. |
| [[subagents]] | current | Claude Opus 5 delegates to subagents more readily than prior models, and delegation pays off only on genuinely independent, sizeable tracks of work — applied to small tasks it multiplies cost and time · 39 claims, confidence 0.91. |
| [[success-criteria]] | current | Success criteria should use quantitative metrics or well-defined qualitative scales; qualitative measures earn their place only when applied consistently alongside quantitative ones · 4 claims, confidence 0.93. |
| [[supersession]] | current | When new information contradicts or updates an existing claim, the new claim explicitly supersedes the old one — linked, timestamped, and the old version preserved but marked stale · 7 claims, confidence 0.86. |
| [[system-prompt]] | current | Appending to Claude Code's system prompt preserves the default tool guidance, safety instructions, and coding conventions so only the difference must be supplied, whereas replacing it drops the… · 11 claims, confidence 0.92. |
| [[task-harness-fit]] | current | The best harness for a task is not necessarily the one a model was post-trained with: Terminal Bench 2.0 shows the same model scoring differently across harnesses, so optimizing the harness for the… · 3 claims, confidence 0.78. |
| [[team-lead]] | current | team lead — 4 claims, confidence 0.90, 1 source. |
| [[terminal-bench]] | current | Terminal-Bench v4.0 recalibrates compute and time allowances, improves instructions, environments and verifiers, and removes eight tasks that were saturated, refusal-prone, publicly solved, or… · 5 claims, confidence 0.84. |
| [[theme]] | current | A theme change makes Pi's TUI call invalidate() on every component to drop cached renders, so a component that does not implement it correctly will not pick the new theme up · 5 claims, confidence 0.92. |
| [[tool-results]] | current | Third-party content should reach Claude only inside tool_result blocks, never in the system prompt or plain user text, because Claude is trained to treat instructions appearing inside tool results… · 6 claims, confidence 0.93. |
| [[tool-use]] | current | In coding and computer-use loops where the next independent tool calls are implied by the task rather than explicitly requested, Claude Fable 5.1 may issue them one per turn instead of in parallel… · 9 claims, confidence 0.89. |
| [[trunk]] | current | A trunk that is not the repository's default branch costs on four fronts at once: a squash outside the default branch never auto-closes its issue, issue_comment and workflow_run workflows only ever… · 2 claims, confidence 0.75. |
| [[tui]] | current | Every line a Pi TUI component returns from render() must fit within the width parameter it was given · 8 claims, confidence 0.92. |
| [[unknowns]] | current | Unknowns are the gap between the map — the prompts, skills, and context given to Claude · 8 claims, confidence 0.81. |
| [[wiki-layer]] | current | A rename that moves engine files leaves the historical layers quoting the old paths: spec markdown and pilot reports are evidence of what was true when written, and the wiki's own pages are… · 7 claims, confidence 0.89. |
| [[workspace-trust]] | current | An interactive session withholds every settings-file hook until the workspace trust dialog is accepted, but a -p or SDK session never shows that dialog and treats the folder as trusted, so hooks… · 8 claims, confidence 0.92. |

## Projects

| Page | Status | In here |
| --- | --- | --- |
| [[agent-skills]] | current | The Agent Skills format was originally developed by Anthropic, released as an open standard, adopted by a growing number of agent products, and is open to contributions from the broader ecosystem · 17 claims, confidence 0.90. |
| [[artificial-analysis]] | current | Artificial Analysis — 16 claims, confidence 0.83, 5 sources. |
| [[datacurve]] | current | Datacurve — 2 claims, confidence 0.82, 1 source. |
| [[graphwiki]] | current | graphwiki — 6 claims, confidence 0.96, 5 sources. |
| [[langchain]] | current | LangChain — 2 claims, confidence 0.76, 2 sources. |
| [[mercor]] | current | Mercor — 2 claims, confidence 0.82, 1 source. |

## People

| Page | Status | In here |
| --- | --- | --- |
| [[andrej-karpathy]] | current | Andrej Karpathy — 2 claims, confidence 0.91, 3 sources. |
| [[andrew-ng]] | current | Andrew Ng — 3 claims, confidence 0.90, 1 source. |

## Decisions

| Page | Status | In here |
| --- | --- | --- |
| [[model-selection]] | current | Running `/model` in Claude Code saves the chosen model as the default for new sessions by writing the `model` field in user settings, while pressing `s` in the picker switches for the current… · 12 claims, confidence 0.86. |

## Systems

| Page | Status | In here |
| --- | --- | --- |
| [[artifacts]] | current | Artifacts are available on Pro, Max, Team, and Enterprise plans and require a session signed in with /login · 10 claims, confidence 0.92. |
| [[auto-memory]] | current | Auto memory lets Claude accumulate knowledge across sessions without the user writing anything, saving four kinds of notes for itself as it works · 3 claims, confidence 0.92. |
| [[auto-mode-classifier]] | current | Auto mode replaces routine permission prompts with a separate classifier model that reviews each action and blocks anything escalating beyond the request, targeting unrecognized infrastructure, or… · 2 claims, confidence 0.93. |
| [[bash-tool]] | current | Shipping a bash tool gives the model a computer and lets it design its own tools on the fly via code instead of being constrained to pre-configured tools · 8 claims, confidence 0.90. |
| [[belief-updater]] | current | Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior… · 12 claims, confidence 0.81. |
| [[claude-agent-sdk]] | current | The Claude Agent SDK exposes the same tools, agent loop, and context management that power Claude Code, available as a CLI for scripts and CI/CD or as Python and TypeScript packages for full… · 5 claims, confidence 0.88. |
| [[claude-code-github-action]] | current | On public repositories GitHub withholds secrets from runs triggered by fork pull requests, so a workflow-based review runs only on pull requests from branches in the same repository · 14 claims, confidence 0.91. |
| [[claude-code-review]] | current | The Claude Code Review check run always completes with a neutral conclusion so it never blocks merging through branch protection rules; · 10 claims, confidence 0.95. |
| [[claude-code]] | current | A mistyped claude subcommand does not fall through to a prompt: Claude Code suggests the closest matching subcommand and exits without starting a session · 155 claims, confidence 0.91. |
| [[claude-fable-5-1]] | current | Cache hits on Claude Fable 5.1 are priced at 0.025x the base input price — $0.25 per million · 27 claims, confidence 0.89. |
| [[claude-fable-5]] | current | Claude Fable 5's individual requests on hard tasks can run for many minutes and autonomous runs for hours, which is one of the largest shifts teams encounter on migration: client timeouts… · 16 claims, confidence 0.88. |
| [[claude-github-app]] | current | Installing the Claude GitHub App means accepting its full permission set — GitHub does not let you accept a subset · 2 claims, confidence 0.93. |
| [[claude-haiku-4-5]] | current | Claude Haiku 4.5 does not support the effort parameter at all — it uses extended rather than adaptive thinking — so an effort level stamped on Haiku sets nothing · 8 claims, confidence 0.93. |
| [[claude-opus-5]] | current | Claude Opus 5 verifies its own work without being told to, so explicit verification instructions carried over from earlier prompts cause over-verification and removing them reduces wasted tokens… · 17 claims, confidence 0.90. |
| [[claude-security-plugin]] | current | Claude Security scans are nondeterministic — two scans of the same code can surface different findings · 10 claims, confidence 0.94. |
| [[claude-sonnet-5]] | current | Claude Sonnet 5 uses a new tokenizer that produces approximately 30% more tokens for the same text, so max_tokens limits tuned for Claude Sonnet 4.6 may truncate equivalent output · 12 claims, confidence 0.93. |
| [[deep-links]] | current | Markdown renderers that allow only http and https links strip the claude-cli:// scheme, and GitHub does this in READMEs, issues, pull requests, and wikis so the link renders as its bare label · 6 claims, confidence 0.92. |
| [[docker-sandboxes]] | current | Docker Sandboxes — 2 claims, confidence 0.92, 1 source. |
| [[edit-tool]] | current | The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count · 3 claims, confidence 0.93. |
| [[gemini-3-7-flash]] | current | Gemini 3.7 Flash — 2 claims, confidence 0.81, 1 source. |
| [[gemini-3-8-flash]] | current | Gemini 3.8 Flash — 2 claims, confidence 0.81, 2 sources. |
| [[goal-command]] | current | /goal rides on the hooks system, so it follows the same workspace-trust rule as hooks in settings files and is unavailable wherever disableAllHooks or allowManagedHooksOnly is in force · 6 claims, confidence 0.93. |
| [[gpt-5-6-luna]] | current | GPT-5.6 Luna is the cost-sensitive, high-volume tier, corresponding to the nano tier of earlier GPT-5 families · 13 claims, confidence 0.85. |
| [[gpt-5-6-sol]] | current | GPT-5.6 Sol is the flagship of the GPT-5.6 family and corresponds to the unsuffixed model tier of earlier GPT-5 families; the gpt-5.6 alias routes to it · 17 claims, confidence 0.85. |
| [[gpt-5-6-terra]] | current | GPT-5.6 Terra is the balanced tier, corresponding to the mini tier of earlier GPT-5 families · 12 claims, confidence 0.86. |
| [[gpt-6-astra]] | current | GPT-6 Astra lists at $10 per million input tokens, $1 cached input, $12.50 cache writes, and $50 per million output tokens · 25 claims, confidence 0.87. |
| [[hooks]] | current | A guard rule carrying the action ask resolves to a block when no human is present to answer, so an unattended agent cannot run what it gates: the destructive-command guard's git-force-push rule… · 40 claims, confidence 0.87. |
| [[index-md]] | current | Reading index.md first to find relevant pages and then drilling into them works well enough that no embedding-based RAG infrastructure is needed · 3 claims, confidence 0.82. |
| [[listagents]] | current | ListAgents — 2 claims, confidence 0.90, 1 source. |
| [[log-md]] | current | log.md — 2 claims, confidence 0.82, 2 sources. |
| [[loop-command]] | current | The /loop bundled skill re-runs a prompt on repeat for as long as the Claude Code session stays open, and both the interval and the prompt are optional · 6 claims, confidence 0.95. |
| [[mcp-connector]] | current | An artifact can call MCP connectors each time someone views it so the page shows current data rather than a snapshot from the session that built it, on Pro, Max, Team, and Enterprise plans with… · 2 claims, confidence 0.91. |
| [[mcp-server]] | current | A review workflow must keep its `claude_args` `--allowedTools` line even though the skill's own `allowed-tools` frontmatter names the same tool, because the action starts the MCP server that posts… · 13 claims, confidence 0.92. |
| [[output-styles]] | current | A custom output style replaces rather than extends the default system prompt, dropping Claude Code's software-engineering instructions on scoping, comments, security, and verification unless… · 2 claims, confidence 0.87. |
| [[permission-deny-rules]] | current | `Read` deny rules in `permissions.deny` stop Claude Code from opening checked-in paths such as a vendored SDK or committed generated code, which `.gitignore` alone does not cover · 2 claims, confidence 0.91. |
| [[pi-sdk]] | current | Pi's SDK gives programmatic access to the agent for embedding it in other applications, building custom interfaces, or wiring it into automated workflows · 5 claims, confidence 0.92. |
| [[pi]] | current | In Pi's JSON stream the message_end event carries the final authoritative message, so a consumer need not reassemble deltas to get the settled text · 93 claims, confidence 0.92. |
| [[plugin]] | current | plugin — 2 claims, confidence 0.91, 2 sources. |
| [[read-tool]] | current | The Edit tool requires Claude to have read the file in the current conversation first — a read cut short by a `PARTIAL view` notice does not count · 3 claims, confidence 0.93. |
| [[rules]] | current | An unscoped rule is mechanically identical to putting the content in CLAUDE.md — always loaded, always costing tokens · 3 claims, confidence 0.96. |
| [[scheduled-tasks]] | current | GitHub runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity · 6 claims, confidence 0.92. |
| [[security-guidance-plugin]] | current | The security-guidance plugin's two extension points — a Markdown guidance file for the model-backed reviews and a YAML or JSON patterns file for the per-edit string match · 9 claims, confidence 0.95. |
| [[sendmessage]] | current | SendMessage — 2 claims, confidence 0.90, 1 source. |
| [[skills]] | current | Scoping a skill is like scoping a function: it should encapsulate a coherent unit of work that composes with other skills, since too-narrow skills force several to load at once and too-broad ones… · 53 claims, confidence 0.90. |
| [[structured-outputs]] | current | When Claude must always emit valid JSON conforming to a specific schema, Structured Outputs give guaranteed schema compliance and replace prompt-engineering techniques, which remain useful for… · 4 claims, confidence 0.95. |
| [[transition-ledger]] | current | Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human… · 7 claims, confidence 0.81. |
| [[workflow-runtime]] | current | The workflow runtime runs up to 16 agents concurrently — fewer when Claude Code has fewer CPUs available — and allows at most 1,000 agents in total per run · 3 claims, confidence 0.92. |
| [[write-guard]] | current | The guard hooks over the state layer match text and never sandbox: they exit 2 only on a confirmed protected path and accept the false positive that an unquoted heredoc body naming both a write verb… · 4 claims, confidence 0.74. |

## Workflows

| Page | Status | In here |
| --- | --- | --- |
| [[agent-loops]] | current | The hill climbing loop's return path does not merely restart the run: it reaches inside and updates the agent loop directly, so each outer cycle makes the inner loops more effective · 18 claims, confidence 0.86. |
| [[ai-native-sdlc]] | current | Once the build phase runs faster than the traditional lifecycle allows, the bottleneck moves to the steps on either side of it — plan, review and test, and deploy — which still run at human speed · 7 claims, confidence 0.82. |
| [[code-migration]] | current | The core discipline of an AI code migration is that you do not fix the code, you fix the loop that produced it: a mistake recurring across files is repaired by adding a sentence to the rulebook and… · 10 claims, confidence 0.78. |
| [[code-review]] | current | Lower measured recall from a code-review harness tuned for an earlier model is a harness effect rather than a capability regression: the model investigates just as deeply but converts fewer… · 6 claims, confidence 0.89. |
| [[crystallization]] | current | crystallization — 3 claims, confidence 0.82, 3 sources. |
| [[dynamic-workflows]] | current | A static workflow written with the Agent SDK has to work for all edge cases and so ends up generic, whereas a dynamic workflow is a custom harness Claude writes tailor-made for the task at hand · 16 claims, confidence 0.89. |
| [[event-driven-loop]] | current | The event-driven loop connects an agent to its ecosystem so that a document landing, a schedule, or a webhook fires the run, making the agent a component running continuously inside a larger system… · 2 claims, confidence 0.78. |
| [[git-workflow]] | current | Host-scoped credential helpers route every HTTPS push to GitHub through the CLI's OAuth token, and GitHub refuses any push whose diff touches .github/workflows/ from a token without the workflow… · 5 claims, confidence 0.73. |
| [[hill-climbing-loop]] | current | For teams running open-weight models the hill climbing loop can feed RL fine-tuning, using trace or eval outcomes as training signal to improve the model itself · 5 claims, confidence 0.79. |
| [[idea-stage]] | current | AI hands confirmation bias a research engine · 3 claims, confidence 0.88. |
| [[ingest]] | current | An ingest reads the new source, discusses its key takeaways with the human, writes a summary page, updates the index, updates the entity and concept pages it touches, and appends an entry to the log… · 9 claims, confidence 0.86. |
| [[launch-stage]] | current | The founder being in every loop is an asset at MVP and the constraint at Launch, and the transition from doing the work to designing the systems that do the work is one of the hardest shifts in the… · 2 claims, confidence 0.83. |
| [[librarian]] | current | Separating retrieval into a librarian is bias prevention, not just token economy: the team's first read of the research happens together, with the objective present, without a single agent's… · 5 claims, confidence 0.81. |
| [[lint]] | current | A lint pass health-checks the wiki for contradictions between pages, stale claims newer sources have superseded, orphan pages with no inbound links, important concepts lacking their own page… · 4 claims, confidence 0.86. |
| [[mvp-stage]] | current | The MVP stage exits on evidence of product-market fit — a specific, identifiable group of users returning to the product, paying for it, or telling others about it · 7 claims, confidence 0.83. |
| [[query]] | current | Useful exploratory work is crystallized back into the knowledge base as a source rather than written straight into a page · 5 claims, confidence 0.88. |
| [[scale-stage]] | current | An AI-native startup's defensible moat at Scale is built from accumulated depth · 2 claims, confidence 0.83. |
| [[sdlc-pipeline]] | current | The regression-in-fix mistake, seen 4 times, is a fix commit introducing new blocking defects that the delta round then finds · 6 claims, confidence 0.75. |
| [[security-review]] | current | Agentic coding tools generate code that works, not code that is inherently secure, and security defects carry no natural feedback loop because they stay invisible until exploited · 5 claims, confidence 0.89. |
| [[skill-evaluation]] | current | skill evaluation — 17 claims, confidence 0.88, 4 sources. |
| [[verification-loop]] | current | A verification loop is a repeating cycle in which the agent examines its own output — running tests, linters, or custom checks · 18 claims, confidence 0.82. |

## Questions

| Page | Status | In here |
| --- | --- | --- |

## Notes

`scripts/llm_wiki_render.py` maintains these tables — do not hand-edit them.
