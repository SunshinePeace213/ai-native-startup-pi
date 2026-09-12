---
type: concept
status: current
created: 2026-09-11
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/pi/packages.md, title: "Pi Packages", id: src_1589290f55f3}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_pi_package]
claim_ids: [clm_a26c56900670, clm_11421224af57, clm_b1ea0a490acc, clm_e28274bf7967, clm_5174112e71a2]
confidence: 0.93
stale_after: 2027-01-29
last_rendered: 2026-09-11T20:00:23Z
review_required: false
---

# pi package

> **In here:** Git-sourced Pi packages pin to a tag or commit, and pi update reconciles an existing clone to the configured ref without ever advancing it to a newer one · 5 claims, confidence 0.93.

## Current understanding

- A Pi package bundles extensions, skills, prompt templates, and themes for sharing over npm or git, declaring its resources under the pi key of package.json or through conventional directories (0.94)
- Pi packages run with full system access — extensions execute arbitrary code and skills can direct the model to run executables — so third-party package source should be reviewed before installing (0.93)
- Git-sourced Pi packages pin to a tag or commit, and pi update reconciles an existing clone to the configured ref without ever advancing it to a newer one (0.93)
- Pi installs a project's missing packages automatically at startup once the project is trusted, so package settings can be shared with a team through the repository (0.93)
- When one Pi package is listed in both global and project settings the project entry wins, except that an entry marked autoload false applies as a delta over the global one instead (0.92)

## Evidence

- `clm_a26c56900670` — "A Pi package bundles extensions, skills, prompt templates, and themes for sharing over npm or git, declaring its resources under the pi key of package.json or through conventional directories." · p 0.94 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "Pi packages bundle extensions, skills, prompt templates, and themes so you can share them through npm or git. A package can declare resources in `package.json` under the `pi` key, or use conventional directories."
- `clm_11421224af57` — "Pi packages run with full system access — extensions execute arbitrary code and skills can direct the model to run executables — so third-party package source should be reviewed before installing." · p 0.93 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "Pi packages run with full system access. Extensions execute arbitrary code, and skills can instruct the model to perform any action including running executables. Review source code before installing third-party packages."
- `clm_b1ea0a490acc` — "Git-sourced Pi packages pin to a tag or commit, and pi update reconciles an existing clone to the configured ref without ever advancing it to a newer one." · p 0.93 · active · 1 support · 0 contradict · when: for git package sources
  - `src_1589290f55f3` Pi Packages: "Refs are pinned tags or commits. `pi update --extensions` and `pi update --all` do not move them to newer refs, but they do reconcile an existing clone to the configured ref."
- `clm_e28274bf7967` — "Pi installs a project's missing packages automatically at startup once the project is trusted, so package settings can be shared with a team through the repository." · p 0.93 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "Project settings can be shared with your team, and pi installs any missing packages automatically on startup after the project is trusted."
- `clm_5174112e71a2` — "When one Pi package is listed in both global and project settings the project entry wins, except that an entry marked autoload false applies as a delta over the global one instead." · p 0.92 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "If the same package appears in both, the project entry wins unless the project entry has `autoload: false`, in which case it is applied as a delta over the global entry."

## Timeline

- 2026-09-11 new_claim `clm_a26c56900670` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_11421224af57` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_b1ea0a490acc` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_e28274bf7967` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_5174112e71a2` (src_1589290f55f3)

## Related

- → part_of [[pi]] (0.94)
- → produces [[pi-extension]] (0.94)
- → depends_on [[workspace-trust]] (0.93)
- [[pi]] — 5 shared claims
- [[pi-extension]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[settings-file]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
