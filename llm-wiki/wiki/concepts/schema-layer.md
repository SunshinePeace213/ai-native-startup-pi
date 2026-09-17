---
type: concept
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/steering-claude-code-skills-hooks-rules-subagents-and-more.md, title: "Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents", id: src_93a1e6058bf1}
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
  - {resource: llm-wiki/raw/articles/anthropic/the-new-rules-of-context-engineering-for-claude-5-generation-models.md, title: "the-new-rules-of-context-engineering-for-claude-5-generation-models", id: src_8419bce2e672}
  - {resource: llm-wiki/raw/articles/llm-wiki/ahumanft/llm-wiki-v3.md, title: "LLM Wiki V3: Segmentation", id: src_b585de1a26bb}
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/karpathy/llm-wiki.md, title: "LLM Wiki", id: src_6711dfc0cddd}
  - {resource: llm-wiki/raw/articles/llm-wiki/lucianfialho/graphwiki-pattern.md, title: "graphwiki: an LLM Wiki pattern for graph databases", id: src_09c828d1c803}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/books/founders-playbook/index.md, title: "The Founder's Playbook: Building an AI-Native Startup", id: src_72a67c0111dc}
  - {resource: llm-wiki/raw/docs/claude-code/agent-teams.md, title: "Orchestrate teams of Claude Code sessions", id: src_67017872e4a4}
  - {resource: llm-wiki/raw/docs/claude-code/cli-reference.md, title: "CLI reference", id: src_716248fd9713}
  - {resource: llm-wiki/raw/docs/claude-code/code-review.md, title: "Code Review", id: src_1d5f4c9615f1}
  - {resource: llm-wiki/raw/docs/claude-code/github-actions.md, title: "Claude Code GitHub Actions", id: src_7962dafdd21b}
  - {resource: llm-wiki/raw/docs/claude-code/large-codebases.md, title: "Set up Claude Code in a monorepo or large codebase", id: src_5ed7c226af31}
  - {resource: llm-wiki/raw/docs/claude-code/memory.md, title: "How Claude remembers your project", id: src_e698013f1182}
  - {resource: llm-wiki/raw/docs/claude-code/skills.md, title: "Extend Claude with skills", id: src_07950e24c4ee}
  - {resource: llm-wiki/raw/docs/claude-code/sub-agents.md, title: "Create custom subagents", id: src_5671f6c73f3d}
  - {resource: llm-wiki/raw/notes/llm-wiki-review-2026-08-22.md, title: "llm-wiki review — 2026-08-22", id: src_af0433facf9d}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_schema_layer]
claim_ids: [clm_783a8d83a795, clm_6ef07a9ab4ea, clm_64cae6b2f5df, clm_f964c916a3ac, clm_8be3bd552948, clm_d6db5eb024a3, clm_1d63b8bcc9f0, clm_00214cae00e1, clm_e7b69d4a42b4, clm_7e83c9cc911e, clm_b83cb09bdf7b, clm_a02b62bcf985, clm_8bb2293a40b7, clm_9a6a56d1d7eb, clm_66dbb26cde8a, clm_79a68b09eff3, clm_198fc635f5f4, clm_a5d9ea4f9972, clm_15772370d59a, clm_023cf54f8d66, clm_79c2e7c5e29b, clm_08f5d95a4539, clm_a53d87e1c13c, clm_18d10b22c6d8, clm_0e3aa800f1e4, clm_d9fe1d507413, clm_44e43066d79a]
confidence: 0.91
stale_after: 2027-01-17
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# schema layer

> **In here:** The working principle of schema design is that explicit schema stays minimal and structural, implicit charters carry judgment and culture, and explicit triggers connect the two at the right moment… · 27 claims, confidence 0.91.

## Current understanding

- The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex — is the most important file in the system, the thing that turns a generic LLM into a disciplined knowledge worker: it encodes how the wiki is structured and what workflows to follow when ingesting, answering, or maintaining, plus which entity and relationship types exist in the domain, what quality standards apply, how to handle contradictions, and what is private versus shared (1.00)
- A skill's body loads only when the skill is used, unlike CLAUDE.md content, so long reference material costs almost nothing until it is needed (0.99)
- The pattern has three layers — the raw sources, the wiki, and the schema (0.99)
- Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code — pushing team-specific conventions into path-scoped rules and procedures into skills as it grows (0.98)
- An unscoped rule is mechanically identical to putting the content in CLAUDE.md — always loaded, always costing tokens — so a rule that applies to one part of the tree earns its keep only through a paths field that keeps it out of context during unrelated work (0.98)
- Claude Code offers seven methods for instructing behavior — CLAUDE.md files, rules, skills, subagents, hooks, output styles, and appending the system prompt — and each trades context cost against authority by controlling when an instruction loads, whether it survives compaction, and how much weight it carries (0.98)
- Code Review reads two guidance files with different force: CLAUDE.md is shared project context whose newly introduced violations are flagged as nits, while REVIEW.md is review-only instruction handed to the agents that find and verify findings and consulted by the ones that rank and report them (0.94)
- Every CLAUDE.md Claude Code discovers is concatenated into context rather than overriding the others, ordered from the filesystem root down to the working directory, so the instructions closest to where the session was launched are read last (0.93)
- A long REVIEW.md dilutes the rules that matter most, so it should carry only instructions that change review behavior, with general project context left in CLAUDE.md (0.93)
- Starting Claude Code inside a package loads that package's CLAUDE.md alongside the repository root's, leaving sibling packages' instructions out of context (0.93)
- Claude Code carries knowledge across sessions with two complementary memory systems, CLAUDE.md files and auto memory, both loaded at the start of every conversation and treated as context rather than enforced configuration (0.93)
- The local /code-review follows CLAUDE.md like any Claude Code session but does not read REVIEW.md, and a background review applies its --fix edits outside the session's checkpoints so /rewind does not undo them (0.93)
- Each action run consumes both GitHub Actions minutes and API tokens, and both are capped by giving Claude clearer context and limiting how much work a run can do — `--max-turns` in `claude_args`, workflow-level timeouts, and GitHub's concurrency controls (0.93)
- CLAUDE.md files can live in several locations of differing scope, and they load from the broadest scope to the most specific so a project instruction appears in context after a user instruction (0.93)
- The system-prompt flags apply only to the invocation that passes them; a persona meant to persist and be shared across a project belongs in an output style, and conventions Claude should always follow belong in CLAUDE.md (0.93)
- A single CLAUDE.md at the root of a large codebase either grows to cover every subsystem's conventions, spending context on instructions unrelated to the current task, or stays too generic to be useful (0.93)
- Explore and Plan are the only Claude Code subagents that start without CLAUDE.md files and git status, and no frontmatter field or setting changes which subagents skip them (0.92)
- A teammate loads the same project context as a regular session — CLAUDE.md, MCP servers, and skills — plus the lead's spawn prompt, but inherits none of the lead's conversation history (0.90)
- A CLAUDE.md import resolves a relative path against the file containing the import rather than the working directory, and imported files can recursively import others to a maximum depth of four hops (0.90)
- Persistent context is what keeps AI a force multiplier instead of a source of entropy: founders who skip specs, architectural decisions, and context files like CLAUDE.md hit a predictable wall where every new session requires re-explaining the codebase and AI-generated changes drift from the original vision (0.84)
- The working rule for CLAUDE.md is that when Claude makes a mistake twice the correction goes into the file, and it stays under a page because Claude reads all of it at session start and anything stale takes up context for no benefit (0.83)
- The working principle of schema design is that explicit schema stays minimal and structural, implicit charters carry judgment and culture, and explicit triggers connect the two at the right moment in the workflow — never passively loaded, always invoked on demand (0.83)
- A CLAUDE.md should stay lightweight — a brief description of what the repo is for with most of its tokens spent on gotchas inside the codebase, and nothing stating the obvious that Claude could learn by reading the file system (0.83)
- Implicit instructions drift under context pressure: broad behavioral guidance goes cold as the context fills, the model stops attending to it, and the behavior disappears quietly, usually right when it matters most (0.83)
- The graph schema is deliberately a small, fixed, generic vocabulary of node labels and relationship types enforced by database constraints: it trades domain expressiveness for query simplicity, and domain nuance lives in node properties rather than in new labels (0.83)
- The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page (0.81)
- In a shared repository CLAUDE.md grows the way any unowned config file does, and because every line loads into every session for every engineer whether relevant or not, it consumes tokens and dilutes adherence to the instructions that actually matter (0.81)

## Evidence

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active · 5 support · 1 contradict
  - `src_6711dfc0cddd` LLM Wiki: "**The schema** — a document (e.g."
  - `src_48f57237f6ef` LLM Wiki v2: "The original implies this but it's worth being direct: **the schema document (CLAUDE.md, AGENTS.md) is the most important file in the system.** It's what turns a generic LLM into a disciplined knowledge worker."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "An LLM extracts candidate `:Concept`s and `:Claim`s **against the fixed schema** — giving the extractor a schema to fill produces structured, typed output; asking it to "extract triples" does not."
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
  - `src_af0433facf9d` llm-wiki review — 2026-08-22: "llm-wiki.schema.role — Confirm"
- `clm_6ef07a9ab4ea` — "A skill's body loads only when the skill is used, unlike CLAUDE.md content, so long reference material costs almost nothing until it is needed." · p 0.99 · active · 2 support · 0 contradict
  - `src_07950e24c4ee` Extend Claude with skills: "Unlike CLAUDE.md content, a skill's body loads only when it's used, so long reference material costs almost nothing until you need it."
  - `src_07950e24c4ee` Extend Claude with skills: "Skills can include multiple files in their directory. This keeps `SKILL.md` focused on the essentials while letting Claude access detailed reference material only when needed."
- `clm_64cae6b2f5df` — "The pattern has three layers — the raw sources, the wiki, and the schema" · p 0.99 · active · 3 support · 0 contradict
  - `src_6711dfc0cddd` LLM Wiki: "There are three layers: **Raw sources** — your curated collection of source documents."
  - `src_48f57237f6ef` LLM Wiki v2: "The three-layer architecture (raw sources, wiki, schema) works. The operations (ingest, query, lint) cover the basics."
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "1. **Raw Sources** — immutable `:Source` nodes. Original text, never modified after ingest. 2. **Graph Wiki** — the maintained layer. `:Concept` nodes (a synthesized entity or topic, with a prose `summary`"
- `clm_f964c916a3ac` — "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code — pushing team-specific conventions into path-scoped rules and procedures into skills as it grows" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Keep CLAUDE.md under 200 lines, give it an owner, and review changes to it like code."
  - `src_e698013f1182` How Claude remembers your project: "**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."
- `clm_8be3bd552948` — "An unscoped rule is mechanically identical to putting the content in CLAUDE.md — always loaded, always costing tokens — so a rule that applies to one part of the tree earns its keep only through a paths field that keeps it out of context during unrelated work" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "An unscoped rule is mechanically identical to putting the content in CLAUDE.md: always loaded, always costing tokens."
  - `src_e698013f1182` How Claude remembers your project: "Rules without [`paths` frontmatter](#path-specific-rules) are loaded at launch with the same priority as `.claude/CLAUDE.md`."
- `clm_d6db5eb024a3` — "Claude Code offers seven methods for instructing behavior — CLAUDE.md files, rules, skills, subagents, hooks, output styles, and appending the system prompt — and each trades context cost against authority by controlling when an instruction loads, whether it survives compaction, and how much weight it carries" · p 0.98 · active · 2 support · 0 contradict
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "Each method trades context cost against authority."
  - `src_07950e24c4ee` Extend Claude with skills: "Create a skill when you keep pasting the same instructions, checklist, or multi-step procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a fact."
- `clm_1d63b8bcc9f0` — "Code Review reads two guidance files with different force: CLAUDE.md is shared project context whose newly introduced violations are flagged as nits, while REVIEW.md is review-only instruction handed to the agents that find and verify findings and consulted by the ones that rank and report them." · p 0.94 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "* **`CLAUDE.md`**: shared project instructions that Claude Code uses for all tasks, not just reviews. Code Review reads it as project context and flags newly introduced violations as nits."
- `clm_00214cae00e1` — "Every CLAUDE.md Claude Code discovers is concatenated into context rather than overriding the others, ordered from the filesystem root down to the working directory, so the instructions closest to where the session was launched are read last." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "All discovered files are concatenated into context rather than overriding each other. Across the directory tree, content is ordered from the filesystem root down to your working directory."
- `clm_e7b69d4a42b4` — "A long REVIEW.md dilutes the rules that matter most, so it should carry only instructions that change review behavior, with general project context left in CLAUDE.md." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "Length has a cost: a long `REVIEW.md` dilutes the rules that matter most. Keep it to instructions that change review behavior, and leave general project context in `CLAUDE.md`."
- `clm_7e83c9cc911e` — "Starting Claude Code inside a package loads that package's CLAUDE.md alongside the repository root's, leaving sibling packages' instructions out of context." · p 0.93 · active · 1 support · 0 contradict
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "When you start Claude from `packages/api/`, it loads both `packages/api/CLAUDE.md` and the root `CLAUDE.md`. Claude sees the local instructions alongside the repository-wide rules, with no instructions from `packages/web/` in context."
- `clm_b83cb09bdf7b` — "Claude Code carries knowledge across sessions with two complementary memory systems, CLAUDE.md files and auto memory, both loaded at the start of every conversation and treated as context rather than enforced configuration." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "Claude Code has two complementary memory systems. Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration."
- `clm_a02b62bcf985` — "The local /code-review follows CLAUDE.md like any Claude Code session but does not read REVIEW.md, and a background review applies its --fix edits outside the session's checkpoints so /rewind does not undo them." · p 0.93 · active · 1 support · 0 contradict
  - `src_1d5f4c9615f1` Code Review: "The review follows your `CLAUDE.md` like any Claude Code session, but it doesn't read [`REVIEW.md`](#review-md)."
- `clm_8bb2293a40b7` — "Each action run consumes both GitHub Actions minutes and API tokens, and both are capped by giving Claude clearer context and limiting how much work a run can do — `--max-turns` in `claude_args`, workflow-level timeouts, and GitHub's concurrency controls." · p 0.93 · active · 1 support · 0 contradict
  - `src_7962dafdd21b` Claude Code GitHub Actions: "* Write specific `@claude` requests so Claude needs fewer turns to finish * Use issue templates to provide context up front * Keep your `CLAUDE.md` concise, since Claude reads it on every run * Set `--max-turns` in `claude_args` to limit…"
- `clm_9a6a56d1d7eb` — "CLAUDE.md files can live in several locations of differing scope, and they load from the broadest scope to the most specific so a project instruction appears in context after a user instruction." · p 0.93 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "CLAUDE.md files can live in several locations, each with a different scope. The table below lists them in load order, from broadest scope to most specific, so a project instruction appears in context after a user instruction."
- `clm_66dbb26cde8a` — "The system-prompt flags apply only to the invocation that passes them; a persona meant to persist and be shared across a project belongs in an output style, and conventions Claude should always follow belong in CLAUDE.md." · p 0.93 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "These flags apply only to the current invocation. For persistent personas you can switch between and share across a project, use [output styles](/docs/en/output-styles)."
- `clm_79a68b09eff3` — "A single CLAUDE.md at the root of a large codebase either grows to cover every subsystem's conventions, spending context on instructions unrelated to the current task, or stays too generic to be useful." · p 0.93 · active · 1 support · 0 contradict · when: in a large codebase or monorepo
  - `src_5ed7c226af31` Set up Claude Code in a monorepo or large codebase: "In a large codebase, a single CLAUDE.md at the repository root tends to either grow to cover every subsystem's conventions, costing context on instructions unrelated to the current task, or stay too generic to be useful."
- `clm_198fc635f5f4` — "Explore and Plan are the only Claude Code subagents that start without CLAUDE.md files and git status, and no frontmatter field or setting changes which subagents skip them." · p 0.92 · active · 1 support · 0 contradict
  - `src_5671f6c73f3d` Create custom subagents: "Explore and Plan are the only subagents that omit CLAUDE.md and git status. There is no frontmatter field or per-agent setting to change which agents skip them."
- `clm_a5d9ea4f9972` — "A teammate loads the same project context as a regular session — CLAUDE.md, MCP servers, and skills — plus the lead's spawn prompt, but inherits none of the lead's conversation history." · p 0.90 · active · 1 support · 0 contradict · when: for experimental agent teams
  - `src_67017872e4a4` Orchestrate teams of Claude Code sessions: "Each teammate has its own context window. When spawned, a teammate loads the same project context as a regular session: CLAUDE.md, MCP servers, and skills. It also receives the spawn prompt from the lead."
- `clm_15772370d59a` — "A CLAUDE.md import resolves a relative path against the file containing the import rather than the working directory, and imported files can recursively import others to a maximum depth of four hops." · p 0.90 · active · 1 support · 0 contradict
  - `src_e698013f1182` How Claude remembers your project: "Both relative and absolute paths are allowed. Relative paths resolve relative to the file containing the import, not the working directory. Imported files can recursively import other files, with a maximum depth of four hops."
- `clm_023cf54f8d66` — "Persistent context is what keeps AI a force multiplier instead of a source of entropy: founders who skip specs, architectural decisions, and context files like CLAUDE.md hit a predictable wall where every new session requires re-explaining the codebase and AI-generated changes drift from the original vision" · p 0.84 · active · 1 support · 0 contradict
  - `src_72a67c0111dc` The Founder's Playbook: Building an AI-Native Startup: "Founders who skip specs, architectural decisions, and context files (like CLAUDE.md) hit a predictable wall where every new session requires re-explaining the codebase and AI-generated changes drift from the original vision."
- `clm_79c2e7c5e29b` — "The working rule for CLAUDE.md is that when Claude makes a mistake twice the correction goes into the file, and it stays under a page because Claude reads all of it at session start and anything stale takes up context for no benefit" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "A working rule helps here. When Claude makes a mistake twice, the correction goes into `CLAUDE.md`."
- `clm_08f5d95a4539` — "The working principle of schema design is that explicit schema stays minimal and structural, implicit charters carry judgment and culture, and explicit triggers connect the two at the right moment in the workflow — never passively loaded, always invoked on demand." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "The working principle: explicit schema stays minimal and structural. Implicit charters carry judgment and culture. Explicit triggers connect the two at the right moment in the workflow. Never passively loaded. Always invoked on demand."
- `clm_a53d87e1c13c` — "A CLAUDE.md should stay lightweight — a brief description of what the repo is for with most of its tokens spent on gotchas inside the codebase, and nothing stating the obvious that Claude could learn by reading the file system" · p 0.83 · active · 1 support · 0 contradict
  - `src_8419bce2e672` the-new-rules-of-context-engineering-for-claude-5-generation-models: "Keep your CLAUDE.md lightweight and briefly describe what your repo is for, but spend most of the tokens on gotchas inside of the codebase."
- `clm_18d10b22c6d8` — "Implicit instructions drift under context pressure: broad behavioral guidance goes cold as the context fills, the model stops attending to it, and the behavior disappears quietly, usually right when it matters most." · p 0.83 · active · 1 support · 0 contradict
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "**Implicit instructions drift.** Broad behavioral guidance goes cold as context fills. The model stops attending to it. The behavior disappears quietly, usually right when it matters most."
- `clm_0e3aa800f1e4` — "The graph schema is deliberately a small, fixed, generic vocabulary of node labels and relationship types enforced by database constraints: it trades domain expressiveness for query simplicity, and domain nuance lives in node properties rather than in new labels." · p 0.83 · active · 1 support · 0 contradict
  - `src_09c828d1c803` graphwiki: an LLM Wiki pattern for graph databases: "**Schema** — a small, fixed set of node labels and relationship types (below), enforced with Neo4j constraints."
- `clm_d9fe1d507413` — "The system is built in seven incremental phases — Phase 0 a minimal v1-style wiki, Phase 1 observations and claim state, Phase 2 confidence and transitions, Phase 3 the graph layer, Phase 4 hybrid retrieval, Phase 5 automation, Phase 6 governance and collaboration — each carrying its own goal, Phase 1's being to separate source, observation, belief, and rendered page" · p 0.81 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Separate source, observation, belief, and rendered page."
- `clm_44e43066d79a` — "In a shared repository CLAUDE.md grows the way any unowned config file does, and because every line loads into every session for every engineer whether relevant or not, it consumes tokens and dilutes adherence to the instructions that actually matter" · p 0.81 · active · 1 support · 0 contradict · when: in a shared repository
  - `src_93a1e6058bf1` Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents: "This consumes tokens and dilutes adherence to the instructions that actually matter."

## Contradictions

- `clm_783a8d83a795` — "The schema document — CLAUDE.md for Claude Code, AGENTS.md for Codex" · p 1.00 · active
  - `src_b585de1a26bb` LLM Wiki V3: Segmentation: "Every behavior, every preference, every edge case. The schema becomes dense and the LLM is expected to hold all of it at once. That is the mistake."

## Timeline

- 2026-08-20 new_claim `clm_64cae6b2f5df` (src_6711dfc0cddd)
- 2026-08-20 new_claim `clm_783a8d83a795` (src_6711dfc0cddd)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_48f57237f6ef)
- 2026-08-20 support_update `clm_783a8d83a795` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_d9fe1d507413` (src_758247b58186)
- 2026-08-20 contradiction_update `clm_783a8d83a795` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_08f5d95a4539` (src_b585de1a26bb)
- 2026-08-20 new_claim `clm_18d10b22c6d8` (src_b585de1a26bb)
- 2026-08-20 support_update `clm_64cae6b2f5df` (src_09c828d1c803)
- 2026-08-20 new_claim `clm_0e3aa800f1e4` (src_09c828d1c803)
- 2026-08-20 support_update `clm_783a8d83a795` (src_09c828d1c803)
- 2026-08-21 support_update `clm_783a8d83a795` (src_af0433facf9d)
- 2026-08-21 human_override `clm_783a8d83a795` (human:ringo)
- 2026-08-23 new_claim `clm_023cf54f8d66` (src_72a67c0111dc)
- 2026-08-23 new_claim `clm_a53d87e1c13c` (src_8419bce2e672)
- 2026-08-23 new_claim `clm_d6db5eb024a3` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_44e43066d79a` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_f964c916a3ac` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_8be3bd552948` (src_93a1e6058bf1)
- 2026-08-23 new_claim `clm_79c2e7c5e29b` (src_c65435745c66)
- 2026-08-23 new_claim `clm_66dbb26cde8a` (src_716248fd9713)
- 2026-08-23 new_claim `clm_6ef07a9ab4ea` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_6ef07a9ab4ea` (src_07950e24c4ee)
- 2026-08-23 support_update `clm_d6db5eb024a3` (src_07950e24c4ee)
- 2026-08-23 new_claim `clm_79a68b09eff3` (src_5ed7c226af31)
- 2026-08-23 new_claim `clm_7e83c9cc911e` (src_5ed7c226af31)
- 2026-08-23 new_claim `clm_198fc635f5f4` (src_5671f6c73f3d)
- 2026-08-23 new_claim `clm_a5d9ea4f9972` (src_67017872e4a4)
- 2026-08-23 new_claim `clm_b83cb09bdf7b` (src_e698013f1182)
- 2026-08-23 new_claim `clm_9a6a56d1d7eb` (src_e698013f1182)
- 2026-08-23 new_claim `clm_00214cae00e1` (src_e698013f1182)
- 2026-08-23 new_claim `clm_15772370d59a` (src_e698013f1182)
- 2026-08-23 support_update `clm_f964c916a3ac` (src_e698013f1182)
- 2026-08-23 support_update `clm_8be3bd552948` (src_e698013f1182)
- 2026-08-30 new_claim `clm_1d63b8bcc9f0` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_e7b69d4a42b4` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_a02b62bcf985` (src_1d5f4c9615f1)
- 2026-08-30 new_claim `clm_8bb2293a40b7` (src_7962dafdd21b)

## Related

- → part_of [[llm-wiki]] (0.99)
- ← uses [[claude-code]] (0.99)
- ← uses [[claude-code-review]] (0.94)
- → part_of [[claude-code]] (0.93)
- ← related_to [[review-md]] (0.93)
- ← uses [[claude-code-github-action]] (0.93)
- ← uses [[subagents]] (0.92)
- → applies_to [[mvp-stage]] (0.84)
- ← applies_to [[context-engineering]] (0.83)
- → applies_to [[knowledge-graph]] (0.82)
- ← applies_to Neo4j (no page yet) (0.82)
- ← uses [[entity-extraction]] (0.82)
- … 8 more edges — `graph.py neighbors ent_schema_layer`
- [[claude-code]] — 8 shared claims
- [[context-window]] — 4 shared claims
- [[claim]] — 3 shared claims
- [[graphwiki]] — 3 shared claims
- [[llm-wiki]] — 3 shared claims
- [[review-md]] — 3 shared claims
- [[explicit-triggers]] — 2 shared claims
- [[knowledge-graph]] — 2 shared claims
- [[monorepo]] — 2 shared claims
- [[rules]] — 2 shared claims
- [[skills]] — 2 shared claims
- [[subagents]] — 2 shared claims
- [[agent-teams]] — 1 shared claim
- [[auto-memory]] — 1 shared claim
- [[claude-code-github-action]] — 1 shared claim
- [[claude-code-review]] — 1 shared claim
- [[context-engineering]] — 1 shared claim
- [[entity-extraction]] — 1 shared claim
- [[ingest]] — 1 shared claim
- [[mvp-stage]] — 1 shared claim
- [[observation]] — 1 shared claim
- [[output-styles]] — 1 shared claim
- [[progressive-disclosure]] — 1 shared claim
- [[raw-layer]] — 1 shared claim
- [[rendered-page]] — 1 shared claim
- [[segmentation]] — 1 shared claim
- [[skill-md]] — 1 shared claim
- [[state-layer]] — 1 shared claim
- [[system-prompt]] — 1 shared claim
- [[wiki-layer]] — 1 shared claim
- Neo4j (no page yet)
