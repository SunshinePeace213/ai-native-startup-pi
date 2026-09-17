---
type: workflow
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/chats/crystallize-placement-and-push-auth.md, title: "Where a crystallize belongs, and why pushes touching a workflow file were refused", id: src_a503e85dd88c}
  - {resource: llm-wiki/raw/chats/single-trunk-git-policy.md, title: "single-trunk-git-policy", id: src_0fe13652a5fb}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_git_workflow]
claim_ids: [clm_aa71eeb74147, clm_8253d0c26787, clm_8b7803b7aaeb, clm_2ae1a2b6ac23, clm_cc0ef2ab0add]
confidence: 0.73
stale_after: 2026-10-03
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# git workflow

> **In here:** Host-scoped credential helpers route every HTTPS push to GitHub through the CLI's OAuth token, and GitHub refuses any push whose diff touches .github/workflows/ from a token without the workflow… · 5 claims, confidence 0.73.

## Current understanding

- Collapsing a two-branch flow to one trunk means main is both the only long-lived branch and the default branch, every change is a short-lived branch squash-merged back behind the same CI checks, and a release becomes a version bump plus a tag rather than a branch (0.75)
- Editing a ruleset to push past a required check is the failure branch protection exists to prevent rather than a workaround for it, and a rule that names an allowed head branch without a condition checking it is a sentence rather than an enforced control (0.74)
- A release branch earns its existence only from stabilization work — commits, a version bump, fixes — while the integration branch keeps moving; one that adds none of that is a pointer at the integration branch and only adds a branch to delete (0.74)
- Host-scoped credential helpers route every HTTPS push to GitHub through the CLI's OAuth token, and GitHub refuses any push whose diff touches .github/workflows/ from a token without the workflow scope — a policy rejection after the credentials were accepted, not an authentication failure, firing on the pushed diff rather than the branch (0.72)
- Pushing the same commits over SSH succeeds because an SSH key is not an OAuth token and the workflow-scope restriction never applies to it, so repointing the remote at SSH removes the refusal permanently for that checkout (0.72)

## Evidence

- `clm_aa71eeb74147` — "Collapsing a two-branch flow to one trunk means main is both the only long-lived branch and the default branch, every change is a short-lived branch squash-merged back behind the same CI checks, and a release becomes a version bump plus a tag rather than a branch" · p 0.75 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "The trunk collapses to one branch. `main` is the only long-lived branch and also the default branch;"
- `clm_8253d0c26787` — "Editing a ruleset to push past a required check is the failure branch protection exists to prevent rather than a workaround for it, and a rule that names an allowed head branch without a condition checking it is a sentence rather than an enforced control" · p 0.74 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "Branches sync by rebase, never by merging the trunk in, and nothing lands outside a pull request — loosening a ruleset to push past a required check is the failure branch protection exists to prevent, not a workaround for it."
- `clm_8b7803b7aaeb` — "A release branch earns its existence only from stabilization work — commits, a version bump, fixes — while the integration branch keeps moving; one that adds none of that is a pointer at the integration branch and only adds a branch to delete" · p 0.74 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "A git-flow release branch exists to stabilize and stamp a version while the integration branch keeps moving."
- `clm_2ae1a2b6ac23` — "Host-scoped credential helpers route every HTTPS push to GitHub through the CLI's OAuth token, and GitHub refuses any push whose diff touches .github/workflows/ from a token without the workflow scope — a policy rejection after the credentials were accepted, not an authentication failure, firing on the pushed diff rather than the branch" · p 0.72 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "The push refusal was never an authentication failure."
- `clm_cc0ef2ab0add` — "Pushing the same commits over SSH succeeds because an SSH key is not an OAuth token and the workflow-scope restriction never applies to it, so repointing the remote at SSH removes the refusal permanently for that checkout" · p 0.72 · active · 1 support · 0 contradict
  - `src_a503e85dd88c` Where a crystallize belongs, and why pushes touching a workflow file were refused: "Pushing the same commits over SSH succeeds, because an SSH key is not an OAuth token and the scope restriction never applies to it."

## Timeline

- 2026-08-23 new_claim `clm_2ae1a2b6ac23` (src_a503e85dd88c)
- 2026-08-23 new_claim `clm_cc0ef2ab0add` (src_a503e85dd88c)
- 2026-09-05 new_claim `clm_aa71eeb74147` (src_0fe13652a5fb)
- 2026-09-05 new_claim `clm_8b7803b7aaeb` (src_0fe13652a5fb)
- 2026-09-05 new_claim `clm_8253d0c26787` (src_0fe13652a5fb)

## Related

- ← part_of [[trunk]] (0.75)
- ← applies_to [[branch-protection]] (0.74)
- ← part_of [[release-branch]] (0.74)
- [[branch-protection]] — 1 shared claim
- [[release-branch]] — 1 shared claim
- [[trunk]] — 1 shared claim
