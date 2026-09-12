---
type: concept
status: current
created: 2026-09-05
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/chats/single-trunk-git-policy.md, title: "single-trunk-git-policy", id: src_0fe13652a5fb}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_trunk]
claim_ids: [clm_77863e0e9135, clm_aa71eeb74147]
confidence: 0.75
stale_after: 2027-05-24
last_rendered: 2026-09-05T20:28:25Z
review_required: false
---

# trunk

> **In here:** A trunk that is not the repository's default branch costs on four fronts at once: a squash outside the default branch never auto-closes its issue, issue_comment and workflow_run workflows only ever… · 2 claims, confidence 0.75.

## Current understanding

- A trunk that is not the repository's default branch costs on four fronts at once: a squash outside the default branch never auto-closes its issue, issue_comment and workflow_run workflows only ever run from the default branch, new pull requests default to the wrong base, and workflow validation compares against the default branch (0.75)
- Collapsing a two-branch flow to one trunk means main is both the only long-lived branch and the default branch, every change is a short-lived branch squash-merged back behind the same CI checks, and a release becomes a version bump plus a tag rather than a branch (0.75)

## Evidence

- `clm_77863e0e9135` — "A trunk that is not the repository's default branch costs on four fronts at once: a squash outside the default branch never auto-closes its issue, issue_comment and workflow_run workflows only ever run from the default branch, new pull requests default to the wrong base, and workflow validation compares against the default branch" · p 0.75 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "`main` was the default branch while `dev` was the trunk, and that one mismatch produced most of the friction: `/sdlc:ship` had to close each issue by hand because a squash outside the default branch never auto-closes, workflows triggered…"
- `clm_aa71eeb74147` — "Collapsing a two-branch flow to one trunk means main is both the only long-lived branch and the default branch, every change is a short-lived branch squash-merged back behind the same CI checks, and a release becomes a version bump plus a tag rather than a branch" · p 0.75 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "The trunk collapses to one branch. `main` is the only long-lived branch and also the default branch;"

## Timeline

- 2026-09-05 new_claim `clm_aa71eeb74147` (src_0fe13652a5fb)
- 2026-09-05 new_claim `clm_77863e0e9135` (src_0fe13652a5fb)

## Related

- ← depends_on [[claude-code-github-action]] (0.75)
- → part_of [[git-workflow]] (0.75)
- [[claude-code-github-action]] — 1 shared claim
- [[git-workflow]] — 1 shared claim
