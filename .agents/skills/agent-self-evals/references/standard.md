---
sources:
  - llm-wiki/raw/articles/anthropic/demystifying-evals-for-ai-agents.md — "Demystifying evals for AI agents" (Anthropic engineering)
  - llm-wiki/raw/docs/anthropic/develop-tests.md — "Create strong empirical evaluations" (Anthropic docs)
  - llm-wiki/raw/docs/agent-skills/evaluating-skills.md — "Evaluating skill output quality" (agentskills.io)
  - llm-wiki/raw/docs/agent-skills/best-practices.md — "Best practices for skill creators" (agentskills.io)
wiki: llm-wiki/wiki/workflows/skill-evaluation.md · llm-wiki/wiki/concepts/eval-suite.md · llm-wiki/wiki/concepts/grader.md
---

# The verification standard, with its sources

Seven rules. Each carries the passage it rests on so a challenge can be
settled against the source rather than against memory. Line numbers refer to
the raw archives above.

## A premise to correct first

The eval literature does **not** say "fewer tests". It says volume is fine —
and wanted — when it comes from the right place:

> "We see teams delay building evals because they think they need hundreds of
> tasks. In reality, 20-50 simple tasks drawn from real failures is a great
> start." — demystifying-evals L227

> "Prioritize volume over quality: More questions with slightly lower signal
> automated grading is better than fewer questions with high-quality human
> hand-graded evals." — develop-tests

Bloat, slow suites, and brittleness are symptoms of tests derived from the
*implementation*. The rules below fix the derivation, not the count.

## R1 — Contract before case

> "Everything the grader checks should be clear from the task description;
> agents shouldn't fail due to ambiguous specs." — demystifying-evals L237

> A good task is one where two domain experts would independently reach the
> same pass/fail verdict. — wiki claim `agent-evals.task-quality.unambiguous`

A test with no contract line behind it is asserting something nobody agreed
matters. Write the guarantees first; every case cites one.

## R2 — Outcome, not path

> "There is a common instinct to check that agents followed very specific
> steps like a sequence of tool calls in the right order. We've found this
> approach too rigid and results in overly brittle tests, as agents regularly
> find valid approaches that eval designers didn't anticipate. So as not to
> unnecessarily punish creativity, it's often better to grade what the agent
> produced, not the path it took." — demystifying-evals L255

> "The outcome is the final state in the environment at the end of the trial.
> A flight-booking agent might say 'Your flight has been booked' … but the
> outcome is whether a reservation exists in the environment's SQL database."
> — demystifying-evals L39

For code the equivalent of "the path" is an internal helper's return value or
an exact intermediate string. Assert at the seam a caller sees.

## R3 — Balanced sets

> "Test both the cases where a behavior *should* occur and where it
> *shouldn't*. One-sided evals create one-sided optimization. For instance, if
> you only test whether the agent searches when it should, you might end up
> with an agent that searches for almost everything." — demystifying-evals L243

Every contract line gets a should and a should-not case. A table whose rows
all expect the same verdict is one-sided by construction.

## R4 — Prose is not spec

Code-based graders are

> "Brittle to valid variations that don't match expected patterns exactly"
> — demystifying-evals L76 (grader trade-off table)

and assertions must be

> "verifiable and specific ('valid JSON', 'at least 3 recommendations'), not
> vague ('is good') or brittle (exact wording)." — evaluating-skills

Human- or model-facing text is asserted on the facts it must carry. Exact
match is for machine-parsed formats only.

## R5 — Grow from failures, not branches

> "Source realistic tasks from the failures you see." — demystifying-evals L320

> "Start with 2-3 test cases. Don't over-invest before you've seen your first
> round of results." — evaluating-skills

> "Add them [assertions] after you see your first round of outputs — you often
> don't know what 'good' looks like until the skill has run." — evaluating-skills

A new case enters from a contract line or a real failure. Coverage percentage
is never the reason.

## R6 — A failure must explain itself; read it

> "You won't know if your graders are working well unless you read the
> transcripts and grades from many trials. … When a task fails, the
> transcript tells you whether the agent made a genuine mistake or whether
> your graders rejected a valid solution." — demystifying-evals L269

> "Failures should seem fair: it's clear what the agent got wrong and why."
> — demystifying-evals L271

> "Read agent execution traces, not just final outputs." — best-practices L46

Name every case after its contract line and scenario. When it fails, decide
whether the code or the check is wrong *before* editing either.

## R7 — Code gets tests; behaviour gets evals

> "Agent evaluations typically combine three types of graders: code-based,
> model-based, and human. … An essential component of effective evaluation
> design is to choose the right graders for the job." — demystifying-evals L72

> "Remove or replace assertions that always pass in both configurations.
> These don't tell you anything useful — the model handles them fine without
> the skill." — evaluating-skills

> "Each eval run should start with a clean context — no leftover state from
> previous runs or from the skill development process." — evaluating-skills

Deterministic code is graded by code on every run. Model-driven behaviour is
graded by tasks with graders, from a clean session, against a baseline
without the skill, and its assertions are pruned to the ones the skill moves.

## Two more from the source worth knowing

**Saturation.** "An eval at 100% tracks regressions but provides no signal
for improvement." (L273) A suite that has been green for months on
model-driven behaviour has stopped measuring; add harder tasks from new
failures.

**pass@k vs pass^k.** For behaviour that must succeed *every* time (a guard,
a write policy), the metric is pass^k — all k trials pass — not pass@k. Run
the nondeterministic cases several times; three is the usual start.
