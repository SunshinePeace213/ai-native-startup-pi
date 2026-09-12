---
source: session:single-trunk-git-policy
date: 2026-09-06
author: ringo
---

> **In here:** Why this repo's `dev` → `release/<date>` → `main` promotion never worked once, and what replaced it — a single `main` trunk with short-lived branches, squash merges, and tags for releases.

## Asked

Two questions, in order. First: what is the workflow when a change reviewed on
`dev` is ready for `main`, and why does the `release/<date>` branch in it look
wrong? Then: what should the everyday branch policy be, leaving the artifact
chain alone. The second answer was accepted and implemented in the same session.

## Found

### The promotion path had never completed

The written path was `/sdlc:ship` squash-merging each change into `dev`, then a
hand-made `release/<date>` branch opening a pull request into `main`, which the
ruleset required to arrive as a merge commit behind the `test`, `lint`, and
`security-review` checks. It ran once. The release pull request's
`security-review` check failed and the branch was never merged; the ruleset was
edited two minutes after `main` received a direct push, and the pull request was
closed with the comment that `dev` had been merged into `main` directly. At the
time of the audit `main`, `dev`, and `release/2026-09-06` all pointed at the same
commit, so the release branch carried nothing.

### Why the check could not pass

The Claude Code GitHub Action refuses to run when the workflow file on the branch
differs from the copy on the repository's default branch: the run logged
"Workflow validation failed. The workflow file must exist and have identical
content to the version on the repository's default branch." The action step was
skipped, so no report comment existed, and the workflow's own gate then exited 1
with "no report comment found". Any release whose diff touches a Claude workflow
file reproduces this, because validation reads the default branch and the release
was the thing carrying the new file.

### A release branch with no stabilization work is a pointer

A git-flow release branch exists to stabilize and stamp a version while the
integration branch keeps moving. This one added no commits, no version bump, and
no fixes, so it did the same job as a pull request opened straight from the
integration branch while adding a branch to delete. The repository has zero tags
and its version has stayed `0.1.0`, so nothing gave a release an identity either.

### Merge-commit-only plus strict up-to-date forces a back-merge nobody wrote

After a real release, `main` holds a merge commit the integration branch does not,
and the ruleset's strict up-to-date requirement then blocks the next release pull
request until someone merges `main` back into `dev`. No back-merge step existed in
any rule, command, or script. The divergence had been avoided only by the
by-hand fast-forward push the ruleset was meant to forbid.

### The trunk was not the default branch

`main` was the default branch while `dev` was the trunk, and that one mismatch
produced most of the friction: `/sdlc:ship` had to close each issue by hand
because a squash outside the default branch never auto-closes, workflows
triggered by `issue_comment` and `workflow_run` only ever run from the default
branch so harness changes had to be released before they fired, new pull requests
defaulted to the wrong base, and the workflow-validation refusal above followed
from it directly.

### The rule was already being violated

Three pull requests reached `main` from ordinary feature branches rather than a
release branch, and one was still open at audit time. Nothing checked the head
branch name, so "main takes release pull requests only" was a sentence in a rule
file and a ruleset name, never an enforced condition.

## Decided

The trunk collapses to one branch. `main` is the only long-lived branch and also
the default branch; every change is a short-lived branch cut from it in a
worktree, squash-merged back behind the same six CI checks, with the branch
deleted on merge. Releases stop being a branch and become a version bump on an
ordinary pull request plus a `vX.Y.Z` tag on its squash commit. Branches sync by
rebase, never by merging the trunk in, and nothing lands outside a pull request —
loosening a ruleset to push past a required check is the failure branch
protection exists to prevent, not a workaround for it.

The implementation moved every `origin/dev` reference in the rules, the stage
commands, the two simplifier agents, and the daily-lint routine to `origin/main`;
made `/sdlc:ship` stop closing the issue and deleting the remote branch, both of
which the merge now does; changed the worktree hook to base new branches on the
origin default branch; dropped the release exemptions from the continuous
integration jobs so `gate` and `commits` run on every non-draft pull request; and
narrowed the security review to the `security:review` label, removing its
release-only failing step.

## Open

- The GitHub-side half — retargeting the ruleset to `main`, deleting the release
  ruleset, enabling delete-branch-on-merge, and deleting the `dev` and release
  branches — was blocked by the session's permission classifier and left as a
  script for the human to run.
- Five stale remote branches and nine local worktrees may hold unpushed work, so
  none were deleted.
- The open pull request that targets `main` from a lint branch still needs a
  rebase or a close.
