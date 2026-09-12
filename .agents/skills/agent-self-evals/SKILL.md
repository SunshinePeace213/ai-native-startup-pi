---
name: agent-self-evals
description: >-
  Designs the verification for something just built or changed — picks the
  instrument (contract-derived tests for deterministic code, evals with
  graders for model-driven behaviour), writes the numbered contract, and
  derives balanced, outcome-asserting cases from it. Use whenever tests or
  evals must be written or extended: add tests, cover this, write the cases,
  make sure it works, how do I know it's right; also to grade an existing
  suite for tests that lock implementation paths or prose instead of
  outcomes. Fire even when the user never says test: a readiness question
  about code or a skill just written — is this solid, what could break, prove
  it, is it done, can I commit — asks for the checks that would answer it,
  not a code read; load this before answering. Not for running the with/without-skill loop or the trigger probe
  (skill-creator owns those runners), not for a subagent's file (meta-agent),
  and not for the wiki's health checks (llm-wiki-lint).
---

# Agent self-evals

Agents write tests from the implementation they just wrote, so the tests
memorise its path, lock its prose, and multiply without adding signal — while
the guarantee the code actually makes stays untested. This skill inverts the
order: **contract first, instrument second, cases last**, every case citing
the guarantee it checks.

## Steps

1. **Classify the thing under test** — one row, no mixing:

   | It is | Instrument | Graded by | Runs |
   | --- | --- | --- | --- |
   | Deterministic code — `.pi/extensions/`, `scripts/`, pure functions | `bun test` (TS) / `pytest` (Python) | code | every `bun test` / `uv run pytest` |
   | Model-driven behaviour — a skill, a subagent, a prompt, an extension hook that shapes what the model sees | eval tasks + graders | code where possible, model with a rubric, human to calibrate | on change, from a clean session |

   An extension is code even though it serves a model: its hooks return values
   and send messages, and those are the outcomes. Only what the *model* then
   does with them is behaviour.

2. **Write the contract before any case.** 3–8 numbered lines, each an
   observable guarantee two experts would independently accept, in the form
   `<ID>: <when> → <what is observable>`. Put it where the cases will live
   (header of the test file, or the `expected_output` of an eval task). A
   guarantee you cannot phrase as something a caller, a user, or the
   filesystem observes is not a contract line — it is an implementation
   detail, and gets no case.

3. **Derive cases from the contract, in pairs.** Every line gets at least one
   *should* case and one *should-not* case (blocks / passes, grounds / skips,
   sends / stays silent). Table-driven, each row named `"<ID> <scenario>"` so
   a failure reads as the broken guarantee. Assert at the **public seam**: the
   hook's return value, the message sent, the status text, the file on disk,
   the exit code — never a helper's intermediate value.

4. **Check every assertion against the four locks** — delete or loosen any
   that trips one:

   - **Path lock**: asserts *how* (sequence of calls, an internal string,
     a helper exported only to be tested). Would a correct refactor break it?
     Then it is a path lock.
   - **Prose lock**: exact-matches human- or model-facing text. Assert the
     facts the text must carry (counts, paths, the verb to run); reserve
     exact match for machine-parsed formats — tags, JSON, exit codes.
   - **Quirk lock**: asserts a value the comment beside it admits is an
     artefact ("harmless", "happens to").
   - **One-sided**: a table whose every row expects the same verdict.

5. **For behaviour, size the eval set from failures, not branches.** Start at
   2–3 tasks with realistic context (real paths, real backstory); grow to
   20–50 from real failures seen in transcripts. Each task carries a reference
   solution that passes its own graders — a 0 % pass rate is a broken task,
   not a weak model. Write assertions *after* the first run shows what good
   looks like. Then hand the set to the runner that owns it: skill-creator
   step 6–7 for a skill (`evals/evals.json`, `evals/trigger-eval.json`),
   meta-agent for a subagent.

6. **Run, then read the failures — not just the count.** For code, run the
   suite and quote the output; a failing check is fixed in the code, never in
   the check. For behaviour, read the transcripts of failed trials: decide
   whether the agent erred or the grader rejected a valid solution, and
   revise the grader when it is the latter. Drop any assertion that passes in
   both the with- and without-configuration — it measures nothing.

7. **Grading an existing suite** (the user asks whether the tests are any
   good): read `references/review-checklist.md`, verdict every case as
   `contract` / `path-lock` / `prose-lock` / `quirk-lock` / `one-sided` /
   `orphan` (cites no line), and report the fix per case plus the contract
   lines that have *no* case — the missing tier is usually the riskiest one.

Read `references/standard.md` when a rule is challenged or the why is needed:
it carries the source passages behind each rule.

## Output

```text
## Contract — <feature>
W1: a write/edit/bash aimed at an engine-owned path → blocked, reason names `state.py`
W2: any other path inside the project → passes through untouched
W3: a path outside the project → passes (not this guard's authority)
W4: a symlink to a protected file → blocked through its real path

## Cases
| ID | scenario | expect |
| W1 | bash `echo x >> llm-wiki/states/claims.jsonl` | block, reason ~ state.py |
| W2 | write `llm-wiki/raw/notes/new.md` | pass |
| W3 | write `/tmp/llm-wiki/states/claims.jsonl` | pass |
| W4 | write `alias.jsonl` → symlink to claims.jsonl | block |

## Not covered
<contract lines with no case, and why — or "none">
```

followed by the test file or eval tasks, and the quoted run output.

## Gotchas

- Bun's test scanner skips dot-directories: `bun test .pi/extensions/x`
  matches nothing and says so only in a footnote. Tests for `.pi/` code live
  under `tests/` or are addressed as `./.pi/...`.
- A helper exported *only* so a test can reach it is the path lock's home.
  Un-export it and test through its caller.
- The riskiest contract is usually the one the file header states in prose
  ("fails open everywhere except…") and no test names. Start there.
- "More cases" is right when they come from the contract or from real
  failures; wrong when they come from branch coverage. Coverage percentage is
  never a target.
- A test that only re-states the implementation passes on day one and fails
  only on refactors — it is negative value. Ask: would this catch a bug the
  author did not foresee?
- Non-interactive runs strip `ask_user_question`; when the contract is
  ambiguous and nobody can be asked, write the ambiguity into `Not covered`
  rather than guessing a guarantee.
