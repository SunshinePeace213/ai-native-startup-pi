---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/claude-code/headless.md, title: "Run Claude Code programmatically", id: src_d5ec157b2e7b}
  - {resource: llm-wiki/raw/docs/claude-code/hooks.md, title: "Hooks reference", id: src_af0a3c9de51d}
  - {resource: llm-wiki/raw/docs/claude-code/settings.md, title: "Claude Code settings", id: src_44aa3ffce603}
  - {resource: llm-wiki/raw/docs/pi/extensions.md, title: "Extensions", id: src_a49af96a95e8}
  - {resource: llm-wiki/raw/docs/pi/packages.md, title: "Pi Packages", id: src_1589290f55f3}
  - {resource: llm-wiki/raw/docs/pi/security.md, title: "Security", id: src_38afec4a51af}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_workspace_trust]
claim_ids: [clm_a9cd0f68d4eb, clm_8a5ac3a8a835, clm_794ee065e6ca, clm_3e99f9d5f50a, clm_74ad73ec8056, clm_e28274bf7967, clm_657f7801cf02, clm_a9afd6afe40a]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# workspace trust

> **In here:** An interactive session withholds every settings-file hook until the workspace trust dialog is accepted, but a -p or SDK session never shows that dialog and treats the folder as trusted, so hooks… · 8 claims, confidence 0.92.

## Current understanding

- Pi's project trust decides only whether project-local settings, resources, packages, and extensions are loaded; it is not a sandbox and places no limit on what tools may do once a session is running (0.94)
- Without bare mode a headless print session runs the hooks in a project's .claude/settings.json and connects the servers in its .mcp.json even in a folder that was never trusted, showing no workspace trust dialog and no per-server approval prompt (0.94)
- An interactive session withholds every settings-file hook until the workspace trust dialog is accepted, but a -p or SDK session never shows that dialog and treats the folder as trusted, so hooks committed in a repository run in a folder the user never trusted (0.93)
- Pi loads context files such as AGENTS.override.md, AGENTS.md, and CLAUDE.md regardless of project trust, unless context loading is switched off entirely (0.92)
- The first user/global or CLI Pi extension whose project_trust handler answers yes or no owns the trust decision and suppresses the built-in prompt; undecided passes it on (0.92)
- Pi installs a project's missing packages automatically at startup once the project is trusted, so package settings can be shared with a team through the repository (0.92)
- Pi's non-interactive modes never prompt for trust: absent a saved decision, defaultProjectTrust values "ask" and "never" both ignore trust-gated project resources while "always" loads them (0.91)
- A committed `.claude/settings.json` does not reach a teammate's session until they trust the folder for `permissions.allow` rules, `additionalDirectories`, `extraKnownMarketplaces`, and most `env` values, while `deny` and `ask` rules apply right away (0.89)

## Evidence

- `clm_a9cd0f68d4eb` — "Pi's project trust decides only whether project-local settings, resources, packages, and extensions are loaded; it is not a sandbox and places no limit on what tools may do once a session is running." · p 0.94 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Project trust controls whether pi loads project-local settings, resources, packages, and extensions. It is not a sandbox and it does not restrict what the model can ask tools to do after you start working in a directory."
- `clm_8a5ac3a8a835` — "Without bare mode a headless print session runs the hooks in a project's .claude/settings.json and connects the servers in its .mcp.json even in a folder that was never trusted, showing no workspace trust dialog and no per-server approval prompt." · p 0.94 · active · 1 support · 0 contradict · when: in headless print mode without --bare
  - `src_d5ec157b2e7b` Run Claude Code programmatically: "Without `--bare`, a `-p` session runs the hooks in a project's `.claude/settings.json` and connects the servers in its `.mcp.json`, even in a folder you've never trusted."
- `clm_794ee065e6ca` — "An interactive session withholds every settings-file hook until the workspace trust dialog is accepted, but a -p or SDK session never shows that dialog and treats the folder as trusted, so hooks committed in a repository run in a folder the user never trusted." · p 0.93 · active · 1 support · 0 contradict · when: for hooks defined in settings files
  - `src_af0a3c9de51d` Hooks reference: "* **Interactive session**: Claude Code holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the [workspace trust dialog](/docs/en/permissions#project-allow-rules-and-workspace-trust)…"
- `clm_3e99f9d5f50a` — "Pi loads context files such as AGENTS.override.md, AGENTS.md, and CLAUDE.md regardless of project trust, unless context loading is switched off entirely." · p 0.92 · active · 1 support · 0 contradict
  - `src_38afec4a51af` Security: "Context files such as `AGENTS.override.md`, `AGENTS.md`, and `CLAUDE.md` are loaded regardless of project trust unless context loading is disabled."
- `clm_74ad73ec8056` — "The first user/global or CLI Pi extension whose project_trust handler answers yes or no owns the trust decision and suppresses the built-in prompt; undecided passes it on." · p 0.92 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "A user/global or CLI extension that returns `"yes"` or `"no"` owns the decision; the first yes/no decision wins and suppresses the built-in trust prompt."
- `clm_e28274bf7967` — "Pi installs a project's missing packages automatically at startup once the project is trusted, so package settings can be shared with a team through the repository." · p 0.92 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "Project settings can be shared with your team, and pi installs any missing packages automatically on startup after the project is trusted."
- `clm_657f7801cf02` — "Pi's non-interactive modes never prompt for trust: absent a saved decision, defaultProjectTrust values "ask" and "never" both ignore trust-gated project resources while "always" loads them." · p 0.91 · active · 1 support · 0 contradict · when: in non-interactive modes (-p, --mode json, --mode rpc)
  - `src_38afec4a51af` Security: "Non-interactive modes (`-p`, `--mode json`, and `--mode rpc`) do not show a trust prompt. Without an applicable saved trust decision, `defaultProjectTrust: "ask"` and `"never"` ignore such resources, while `"always"` trusts them."
- `clm_a9afd6afe40a` — "A committed `.claude/settings.json` does not reach a teammate's session until they trust the folder for `permissions.allow` rules, `additionalDirectories`, `extraKnownMarketplaces`, and most `env` values, while `deny` and `ask` rules apply right away." · p 0.89 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "**The key waits for trust.** `permissions.allow` rules, `permissions.additionalDirectories`, `extraKnownMarketplaces`, and most [`env`](/docs/en/settings-reference#env) values apply only after each teammate [trusts the…"

## Timeline

- 2026-08-23 new_claim `clm_794ee065e6ca` (src_af0a3c9de51d)
- 2026-08-23 new_claim `clm_a9afd6afe40a` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_8a5ac3a8a835` (src_d5ec157b2e7b)
- 2026-09-11 new_claim `clm_a9cd0f68d4eb` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_657f7801cf02` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_3e99f9d5f50a` (src_38afec4a51af)
- 2026-09-11 new_claim `clm_e28274bf7967` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_74ad73ec8056` (src_a49af96a95e8)

## Related

- ← applies_to [[bare-mode]] (0.94)
- ← uses [[pi]] (0.94)
- ← applies_to [[pi-extension]] (0.93)
- ← depends_on [[permission-rule]] (0.93)
- ← depends_on [[pi-package]] (0.93)
- [[pi]] — 5 shared claims
- [[claude-code]] — 3 shared claims
- [[hooks]] — 2 shared claims
- [[agent-memory]] — 1 shared claim
- [[bare-mode]] — 1 shared claim
- [[permission-rule]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[pi-package]] — 1 shared claim
- [[sandbox]] — 1 shared claim
- [[settings-file]] — 1 shared claim
