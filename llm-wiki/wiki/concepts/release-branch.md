---
type: concept
status: current
created: 2026-09-05
updated: 2026-09-05
sources:
  - {resource: llm-wiki/raw/chats/single-trunk-git-policy.md, title: "single-trunk-git-policy", id: src_0fe13652a5fb}
generated: {by: process:llm-wiki-render, at: 2026-09-05}
entity_ids: [ent_release_branch]
claim_ids: [clm_8b7803b7aaeb, clm_1f5c7e109be5]
confidence: 0.74
stale_after: 2027-03-13
last_rendered: 2026-09-05T20:28:25Z
review_required: false
---

# release branch

> **In here:** A release branch earns its existence only from stabilization work — commits, a version bump, fixes — while the integration branch keeps moving; · 2 claims, confidence 0.74.

## Current understanding

- A release branch earns its existence only from stabilization work — commits, a version bump, fixes — while the integration branch keeps moving; one that adds none of that is a pointer at the integration branch and only adds a branch to delete (0.74)
- A release pull request that must arrive as a merge commit leaves the released branch holding a commit the integration branch lacks, so a strict up-to-date requirement blocks the next release until someone merges the released branch back — a back-merge step a two-branch flow needs written down and usually does not have (0.73)

## Evidence

- `clm_8b7803b7aaeb` — "A release branch earns its existence only from stabilization work — commits, a version bump, fixes — while the integration branch keeps moving; one that adds none of that is a pointer at the integration branch and only adds a branch to delete" · p 0.74 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "A git-flow release branch exists to stabilize and stamp a version while the integration branch keeps moving."
- `clm_1f5c7e109be5` — "A release pull request that must arrive as a merge commit leaves the released branch holding a commit the integration branch lacks, so a strict up-to-date requirement blocks the next release until someone merges the released branch back — a back-merge step a two-branch flow needs written down and usually does not have" · p 0.73 · active · 1 support · 0 contradict
  - `src_0fe13652a5fb` single-trunk-git-policy: "After a real release, `main` holds a merge commit the integration branch does not, and the ruleset's strict up-to-date requirement then blocks the next release pull request until someone merges `main` back into `dev`."

## Timeline

- 2026-09-05 new_claim `clm_8b7803b7aaeb` (src_0fe13652a5fb)
- 2026-09-05 new_claim `clm_1f5c7e109be5` (src_0fe13652a5fb)

## Related

- → part_of [[git-workflow]] (0.74)
- → depends_on [[branch-protection]] (0.73)
- [[branch-protection]] — 1 shared claim
- [[git-workflow]] — 1 shared claim
