---
type: workflow
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/anthropic/ai-code-migration.md, title: "How Anthropic runs large-scale code migrations with Claude Code", id: src_40c83dc51471}
  - {resource: llm-wiki/raw/articles/anthropic/building-verification-loops-in-claude-code-with-skills.md, title: "Building verification loops in Claude Code with skills", id: src_8e30f40dbfb8}
  - {resource: llm-wiki/raw/articles/anthropic/getting-started-with-loops.md, title: "Loop engineering: Getting started with loops", id: src_d0a8a3247101}
  - {resource: llm-wiki/raw/articles/anthropic/the-ai-native-sdlc-playbook.md, title: "The AI-Native SDLC playbook", id: src_c65435745c66}
  - {resource: llm-wiki/raw/articles/anthropic/using-claude-code-the-unreasonable-effectiveness-of-html.md, title: "Using Claude Code: The unreasonable effectiveness of HTML", id: src_ee5ae103a89f}
  - {resource: llm-wiki/raw/articles/langchain/the-anatomy-of-an-agent-harness.md, title: "The Anatomy of an Agent Harness", id: src_be6da1f4f37a}
  - {resource: llm-wiki/raw/articles/langchain/the-art-of-loop-engineering.md, title: "the-art-of-loop-engineering", id: src_5b435bf5e144}
  - {resource: llm-wiki/raw/docs/claude-code/goal.md, title: "Keep Claude working toward a goal", id: src_5229aa475d30}
  - {resource: llm-wiki/raw/papers/graph-engineering-andrew-ng-playbook/index.md, title: "Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook", id: src_363b13dc0870}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_verification_loop]
claim_ids: [clm_62d0421c8691, clm_5716a98b092a, clm_0e4a65e960de, clm_71598d00ebbf, clm_e9e77e122cab, clm_830c999ae4d6, clm_cf1225dfbfe4, clm_0877adc37cca, clm_6cfecd1b5320, clm_92153b810131, clm_c7ce91b72814, clm_70f0073b5bb5, clm_03066b8b3f8d, clm_23587a9fe68d, clm_72c5ca8e7a3b, clm_678bac7431c0, clm_c56a98949824, clm_a8ebbcbbc60d]
confidence: 0.82
stale_after: 2027-06-14
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# verification loop

> **In here:** A verification loop is a repeating cycle in which the agent examines its own output — running tests, linters, or custom checks · 18 claims, confidence 0.82.

## Current understanding

- A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count (0.98)
- A reflection loop separates critique from rewriting — request a structured list of issues first, then feed that list into a distinct revision step — and makes the evaluator cite evidence from the draft, tests, or source material rather than accepting an opaque replacement (0.90)
- Evals are the AI-native equivalent of stage-gate QA: the suite runs in CI on a schedule and on any change to CLAUDE.md, skills, or hooks, because that configuration steers the agent and deserves the regression testing code gets — with each production incident becoming a permanent eval (0.83)
- The feedback loop and the verifier subagent are different things: the loop runs through the whole task as many times as the work needs, while the verifier packages the final check in a fresh context window once the session believes it is done, so the verdict is not colored by the assumptions that produced the code (0.83)
- The verification loop itself needs protecting because an agent fixing code must not be able to weaken the check on that code: a hook blocks edits to test files during a fix task, and a test that existed before the fix and could not be rewritten is what proves the bug is gone (0.83)
- A verification skill is written from the repetitive manual corrections you keep making during Claude's implementations, documented in plain English as you would explain them to a new team member — and a deterministic rule with no generic linter support still qualifies for capture (0.82)
- Chaining verification skills trades flexibility for automation and may increase token consumption, so a chain should be tested before broad deployment (0.82)
- A verification check is placed by where it runs: standalone and invoked deliberately, embedded in the producing skill so it fires automatically, chained so one skill calls the next at completion, or applied to every PR — and chaining is what converts habits into contracts (0.82)
- Most agentic coding sessions follow one predictable pattern — request changes, gather context, execute actions, verify results, and iterate if needed — with verification being how the agent validates its work before responding (0.82)
- A verification loop is a repeating cycle in which the agent examines its own output — running tests, linters, or custom checks — and corrects failures before proceeding, and packaging that loop as a skill is what makes it apply consistently across every session (0.82)
- Applying a solidified verification chain to every PR is what transitions verification from personal habit to team infrastructure, so PR-wide gates should be deferred while the processes behind them are still in flux (0.82)
- Planning in HTML replaces the single plan file with a web of files for different stages — explorations, mockups, then the implementation plan — kept around as references, and the verification agent reading them in gains much broader context on what is needed (0.81)
- The verification loop wraps the agent loop with a grader that checks output against a rubric and sends the result back with feedback when it falls short (0.80)
- Every loop level has natural points where human oversight adds value: an automated grader can check whether links resolve, but it takes a human to notice the framing is wrong for the audience (0.80)
- Adding a verification loop increases latency and cost per run, and is worth it when quality matters more than speed (0.79)
- A missing test suite does not block the behavior-matching step: where no referee can be inherited, Claude builds one, because the original codebase remains the ground truth either way (0.78)
- An AI code migration is one where engineers write the migration rules and verification loops while agents translate, compile, and test until the new version's behavior matches the original — compressing what were multi-year projects into weeks (0.78)
- As models get more capable, some of what lives in the harness today will be absorbed into the model, which will get better at planning, self-verification, and long-horizon coherence natively (0.75)

## Evidence

- `clm_62d0421c8691` — "A goal-based loop hands completion judgment to an evaluator model that checks after each iteration whether the success criteria have been met, rather than letting Claude judge its own completion, and it stops on the goal or a maximum turn count" · p 0.98 · active · 2 support · 0 contradict · when: for goal-based loops
  - `src_d0a8a3247101` Loop engineering: Getting started with loops: "an evaluator model checks after each iteration whether the success criteria have been met, rather than Claude trying to judge its own completion"
  - `src_5229aa475d30` Keep Claude working toward a goal: "Each time Claude finishes a turn, Claude Code sends the condition and the conversation so far to your configured [small fast model](/docs/en/model-config), which defaults to Haiku on the Claude API;"
- `clm_5716a98b092a` — "A reflection loop separates critique from rewriting — request a structured list of issues first, then feed that list into a distinct revision step — and makes the evaluator cite evidence from the draft, tests, or source material rather than accepting an opaque replacement" · p 0.90 · active · 1 support · 0 contradict
  - `src_363b13dc0870` Graph Engineering for Multi-Agentic Systems: The Andrew Ng Playbook: "The first practical tip is to separate critique from rewriting. Do not ask "improve this" and accept an opaque replacement. Request a structured list of issues first, then feed that list into a distinct revision step."
- `clm_0e4a65e960de` — "Evals are the AI-native equivalent of stage-gate QA: the suite runs in CI on a schedule and on any change to CLAUDE.md, skills, or hooks, because that configuration steers the agent and deserves the regression testing code gets — with each production incident becoming a permanent eval" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The suite runs non-interactively in CI on a schedule and on any change to `CLAUDE.md`, skills or hooks, since that configuration steers the agent and deserves the regression testing that code gets."
- `clm_71598d00ebbf` — "The feedback loop and the verifier subagent are different things: the loop runs through the whole task as many times as the work needs, while the verifier packages the final check in a fresh context window once the session believes it is done, so the verdict is not colored by the assumptions that produced the code" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "The verifier subagent, on the other hand, is one way to package the final check by running a fresh context window once the session believes the work is done. This way the verdict is not colored by the assumptions that produced the code."
- `clm_e9e77e122cab` — "The verification loop itself needs protecting because an agent fixing code must not be able to weaken the check on that code: a hook blocks edits to test files during a fix task, and a test that existed before the fix and could not be rewritten is what proves the bug is gone" · p 0.83 · active · 1 support · 0 contradict
  - `src_c65435745c66` The AI-Native SDLC playbook: "the loop itself needs protecting, because an agent fixing code must not be able to weaken the check on that code"
- `clm_830c999ae4d6` — "A verification skill is written from the repetitive manual corrections you keep making during Claude's implementations, documented in plain English as you would explain them to a new team member — and a deterministic rule with no generic linter support still qualifies for capture" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "Start by identifying repetitive manual corrections during Claude's implementations. Document these procedures as you would explain them to a new team member—plain English descriptions of expected behavior."
- `clm_cf1225dfbfe4` — "Chaining verification skills trades flexibility for automation and may increase token consumption, so a chain should be tested before broad deployment" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "Chaining trades flexibility for automation but may increase token consumption—test before broad deployment."
- `clm_0877adc37cca` — "A verification check is placed by where it runs: standalone and invoked deliberately, embedded in the producing skill so it fires automatically, chained so one skill calls the next at completion, or applied to every PR — and chaining is what converts habits into contracts" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "One skill calls another at completion. Anthropic's Claude Code team uses this pattern: `/code-review` hunts bugs, `/simplify` cleans diffs, `/verify` confirms behavior, and `/design` checks UI guidelines."
- `clm_6cfecd1b5320` — "Most agentic coding sessions follow one predictable pattern — request changes, gather context, execute actions, verify results, and iterate if needed — with verification being how the agent validates its work before responding" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "Most agentic coding sessions follow a predictable pattern: request changes, gather context, execute actions, verify results, and iterate if needed."
- `clm_92153b810131` — "A verification loop is a repeating cycle in which the agent examines its own output — running tests, linters, or custom checks — and corrects failures before proceeding, and packaging that loop as a skill is what makes it apply consistently across every session" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "In Claude Code, these loops can be packaged as skills, ensuring consistent application across all sessions."
- `clm_c7ce91b72814` — "Applying a solidified verification chain to every PR is what transitions verification from personal habit to team infrastructure, so PR-wide gates should be deferred while the processes behind them are still in flux" · p 0.82 · active · 1 support · 0 contradict
  - `src_8e30f40dbfb8` Building verification loops in Claude Code with skills: "This transitions verification from personal to team infrastructure. Defer PR-wide gates while processes remain in flux."
- `clm_70f0073b5bb5` — "Planning in HTML replaces the single plan file with a web of files for different stages — explorations, mockups, then the implementation plan — kept around as references, and the verification agent reading them in gains much broader context on what is needed" · p 0.81 · active · 1 support · 0 contradict
  - `src_ee5ae103a89f` Using Claude Code: The unreasonable effectiveness of HTML: "When verifying I'll also ask the verification agent to read in the files and it will have much broader context on what is needed."
- `clm_03066b8b3f8d` — "The verification loop wraps the agent loop with a grader that checks output against a rubric and sends the result back with feedback when it falls short." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "The verification loop adds a grader: something that checks the agent's output against a rubric and, if it fails, sends the result back with feedback."
- `clm_23587a9fe68d` — "Every loop level has natural points where human oversight adds value: an automated grader can check whether links resolve, but it takes a human to notice the framing is wrong for the audience." · p 0.80 · active · 1 support · 0 contradict
  - `src_5b435bf5e144` the-art-of-loop-engineering: "Automation doesn't mean removing humans from the loop. At every level, there are natural points where human oversight adds value. An automated grader can check whether links resolve;"
- `clm_72c5ca8e7a3b` — "Adding a verification loop increases latency and cost per run, and is worth it when quality matters more than speed." · p 0.79 · active · 1 support · 0 contradict · when: when quality matters more than speed
  - `src_5b435bf5e144` the-art-of-loop-engineering: "One tradeoff: adding verification increases latency and cost per run. It's worth it when quality matters more than speed, which is most production use cases."
- `clm_678bac7431c0` — "A missing test suite does not block the behavior-matching step: where no referee can be inherited, Claude builds one, because the original codebase remains the ground truth either way" · p 0.78 · active · 1 support · 0 contradict · when: for codebases without a built-out test suite
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "a missing test suite doesn't block this step — if you can't inherit a referee, have Claude build one, since the original codebase remains the ground truth either way"
- `clm_c56a98949824` — "An AI code migration is one where engineers write the migration rules and verification loops while agents translate, compile, and test until the new version's behavior matches the original — compressing what were multi-year projects into weeks" · p 0.78 · active · 1 support · 0 contradict
  - `src_40c83dc51471` How Anthropic runs large-scale code migrations with Claude Code: "It defines an AI code migration as one where engineers write migration rules and verification loops and agents translate, compile, and test code until the new version's behavior matches the original"
- `clm_a8ebbcbbc60d` — "As models get more capable, some of what lives in the harness today will be absorbed into the model, which will get better at planning, self-verification, and long-horizon coherence natively." · p 0.75 · active · 1 support · 0 contradict
  - `src_be6da1f4f37a` The Anatomy of an Agent Harness: "As models get more capable, some of what lives in the harness today will get absorbed into the model. Models will get better at planning, self-verification, and long horizon coherence natively."

## Timeline

- 2026-08-23 new_claim `clm_92153b810131` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_0877adc37cca` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_830c999ae4d6` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_c7ce91b72814` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_cf1225dfbfe4` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_6cfecd1b5320` (src_8e30f40dbfb8)
- 2026-08-23 new_claim `clm_62d0421c8691` (src_d0a8a3247101)
- 2026-08-23 new_claim `clm_70f0073b5bb5` (src_ee5ae103a89f)
- 2026-08-23 new_claim `clm_c56a98949824` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_678bac7431c0` (src_40c83dc51471)
- 2026-08-23 new_claim `clm_71598d00ebbf` (src_c65435745c66)
- 2026-08-23 new_claim `clm_e9e77e122cab` (src_c65435745c66)
- 2026-08-23 new_claim `clm_0e4a65e960de` (src_c65435745c66)
- 2026-08-23 new_claim `clm_5716a98b092a` (src_363b13dc0870)
- 2026-08-23 new_claim `clm_a8ebbcbbc60d` (src_be6da1f4f37a)
- 2026-08-23 new_claim `clm_03066b8b3f8d` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_72c5ca8e7a3b` (src_5b435bf5e144)
- 2026-08-23 new_claim `clm_23587a9fe68d` (src_5b435bf5e144)
- 2026-08-23 support_update `clm_62d0421c8691` (src_5229aa475d30)

## Related

- ← related_to [[reflection]] (0.90)
- → depends_on [[hooks]] (0.83)
- ← uses [[ai-native-sdlc]] (0.83)
- → uses [[subagents]] (0.83)
- → part_of [[agentic-coding]] (0.82)
- → part_of [[skills]] (0.82)
- → related_to [[code-review]] (0.82)
- → uses [[skills]] (0.82)
- → uses [[html-output-format]] (0.81)
- → extends [[agent-loops]] (0.81)
- → part_of [[loop-engineering]] (0.81)
- ← depends_on [[code-migration]] (0.79)
- … 3 more edges — `graph.py neighbors ent_verification_loop`
- [[agent-loops]] — 2 shared claims
- [[code-migration]] — 2 shared claims
- [[loop-engineering]] — 2 shared claims
- [[skills]] — 2 shared claims
- [[agent-harness]] — 1 shared claim
- [[agentic-coding]] — 1 shared claim
- [[ai-native-sdlc]] — 1 shared claim
- [[code-review]] — 1 shared claim
- [[goal-command]] — 1 shared claim
- [[goal-evaluator]] — 1 shared claim
- [[hooks]] — 1 shared claim
- [[html-output-format]] — 1 shared claim
- [[human-in-the-loop]] — 1 shared claim
- [[planning]] — 1 shared claim
- [[reflection]] — 1 shared claim
- [[subagents]] — 1 shared claim
- small fast model (no page yet)
