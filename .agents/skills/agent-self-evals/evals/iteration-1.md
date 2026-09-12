# Iteration 1 — eval 1 (grade `guard.test.ts`, read-only)

Run 2026-09-13 · `pi -a --no-session -p` vs `pi --no-skills --no-session -p` · one trial each.
Raw outputs: `/tmp/ase-ws/eval-1/{with,without}/output.md` (not kept in repo).

| # | assertion | with skill | without skill |
| --- | --- | --- | --- |
| 1 | Flags `spaceBoundaries` exact-string as internal, not outcome | **PASS** — "path-lock · delete; un-export. A double space is a detail of the current pass that no caller sees" | **FAIL** — asserts the opposite: "a rewrite of `spaceBoundaries` would still be checked against the same contract" |
| 2 | Flags a `bashTargets` artefact assertion (sed pattern / quoted `>`) | **PASS** — "quirk-lock · the comment beside it says the `">"` token is 'harmless' — then asserts it" | **FAIL** — not mentioned |
| 3 | Names an uncovered guarantee (hook path or engine fail-open) | **PASS** — "The hook itself — 0 cases", "`engine.ts` fail-open — 0 cases" | **PASS** — "`index.ts` has no tests at all … the `tool_call` handler's write/edit branch … has no coverage" |
| 4 | Keeps symlink and end-to-end pipeline cases | **PASS** — both verdict `contract · keep` | **FAIL** (as written) — keeps symlink, but calls the pipeline case "actively misleading" over its `cd x` decoration |
| 5 | Does not recommend cases for branch coverage | **PASS** — none proposed | **FAIL** — a "Untested branches" list: `REDIRECT_RE` digit prefix, `~` expansion, `realpathLenient` catch paths, `shellSplit` escape branch, `truncate`, `tee -a`, "SHELVES has 7 entries; only concepts exercised" |

**with 5/5 · without 1/5.** Assertion 3 passes in both → per R7 it measures nothing here; replace with one the skill moves (e.g. "reports a Not-covered section separate from per-case verdicts").

## Caveats that keep this honest

- **Contamination.** `references/review-checklist.md` uses `guard.test.ts` as its worked example. The with-skill run said so itself: *"review-checklist.md already contains this exact critique using this exact file."* Eval 1 therefore measures recall of the reference as much as application of the method. Evals 2 and 3 (engine fail-open, librarian) are clean and are the real signal; run them next.
- **The baseline was not weak.** Without the skill the model still found the dead suite, the `cd`-relative hole, and the missing hook tests. What the skill changed is the *verdict system*: it stopped the model from praising helper-level tests as "pure input→output" and stopped it from proposing branch-coverage cases. That is exactly R2/R5 and is the value line.
- **Transient artefact.** Both runs hit a `bunfig.toml` preloading a missing `tests/setup.ts`; it was a side-effect of the trigger sweep, since trashed. Ignore those findings.

## Real bugs surfaced in `guard.ts` (both configurations, unprompted)

- `denialFor("llm-wiki/wiki")` is `null`: the bare shelf root falls through the `shelf !== undefined` check, so `rm -rf llm-wiki/wiki` passes the guard.
- `cd llm-wiki && printf x > states/claims.jsonl` yields target `states/claims.jsonl`, which `index.ts` resolves against `ctx.cwd`, not the `cd`-ed dir → no denial.
- `sh -c '…'`, `>|`, `install`, `ln -sf` are fail-open with no test stating whether that is intended.

These belong in the contract for `write-guard` — as cases citing a line, or as an explicit "Not covered: intended fail-open" entry.
