---
source: sdlc/lessons/digest.md @ 6e5181f (retired by the lesson-stage change)
fetched: 2026-09-01
---

# SDLC lessons digest — recurring mistake classes

> **In here:** The six recurring finding classes the retired `sdlc/lessons/digest.md` tracked across shipped review ledgers, preserved as `sdlc.mistake.*` claims so recurrence keeps accruing in the belief layer.

The digest table recorded one row per recurring finding class across all
shipped ledgers, almost all first observed in plan #80 (cpo-layer). The
`unrunnable-validation-command` class already landed as a lint check; the rest
were still `watching` when the digest retired.

## The classes

- The false-passing-validator mistake, seen 10 times, is a check that passes without proving its criterion — extra rows, substring matches, or vacuous quantifiers let a wrong artifact through.
- The unrunnable-validation-command mistake, seen 3 times, is a spec naming a runner that cannot reach, collect, or grade its target; it was amended as the `proof` check in `scripts/sdlc_lint.py`.
- The path-containment-missing mistake, seen 3 times, is a validator joining caller-supplied paths without containment, so traversal or symlinks escape the project root.
- The stale-counts mistake, seen 5 times, is a summary, dev report, or spec carrying counts and statuses that contradict the ledger they summarize.
- The regression-in-fix mistake, seen 4 times, is a fix commit introducing new blocking defects that the delta round then finds.
- The unfaithful-environment mistake, seen once, is a staged scratch copy missing what the code resolves against — the git repo, the env, the referenced files — so the eval measures the fake.
