---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-11
sources:
  - {resource: llm-wiki/raw/docs/claude-code/settings.md, title: "Claude Code settings", id: src_44aa3ffce603}
  - {resource: llm-wiki/raw/docs/pi/environment-variables.md, title: "Environment Variables", id: src_7f85c02fc39f}
  - {resource: llm-wiki/raw/docs/pi/packages.md, title: "Pi Packages", id: src_1589290f55f3}
  - {resource: llm-wiki/raw/docs/pi/settings.md, title: "Settings", id: src_7dd0e1ac57d3}
generated: {by: process:llm-wiki-render, at: 2026-09-11}
entity_ids: [ent_settings_file]
claim_ids: [clm_ed2073143ece, clm_785d6c7de321, clm_c85b20ce8899, clm_da9d8c58cc46, clm_6ce4b501b320, clm_ba8a7aa03de1, clm_17270ad4afd2, clm_1cdc0a6c5ecf, clm_503d19530fc4, clm_9415967f93e0, clm_5174112e71a2, clm_3cd9cf0ce96b, clm_e21271f2bfed, clm_a9afd6afe40a]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-11T20:00:23Z
review_required: false
---

# settings file

> **In here:** Claude Code reports a whole settings file as a Settings Error when its JSON or a value is rejected and offers to fix, exit, or continue without it, but downgrades individual bad entries to a… · 14 claims, confidence 0.92.

## Current understanding

- Pi configures from JSON settings files in which project settings override global ones (0.94)
- When the same settings key appears in more than one place, Claude Code uses the value from the highest level that sets it and that value overrides the same key at every level below (0.93)
- Relative resource paths in a Pi settings file resolve against that file's own directory — ~/.pi/agent for global settings and .pi for project settings — with absolute paths and ~ also accepted (0.93)
- Claude Code reports a whole settings file as a Settings Error when its JSON or a value is rejected and offers to fix, exit, or continue without it, but downgrades individual bad entries to a Settings Warning and keeps the rest of the file in effect (0.93)
- A list-valued settings key such as `permissions.allow` set in more than one settings file is combined rather than overridden, so each file adds entries without removing another file's (0.93)
- Claude Code reads settings from four JSON files plus managed settings an organization delivers from the claude.ai console, and the source a setting is saved in decides which people and projects it applies to (0.93)
- Setting PI_OFFLINE turns off every startup network operation in Pi, covering update checks, package updates, and install/update telemetry together (0.92)
- Pi advises leaving retry.provider.maxRetries at 0, because provider-level retries can swallow out-of-usage-limit errors before Pi sees them and block the agent until the provider quota resets (0.92)
- Pi's enableInstallTelemetry governs the anonymous install/update ping and provider attribution headers only; opting out leaves version-check requests running, which PI_SKIP_VERSION_CHECK or offline mode disables separately (0.92)
- Pi's resource arrays in settings take glob patterns plus explicit overrides: !pattern excludes, +path force-includes an exact path, and -path force-excludes one (0.92)
- When one Pi package is listed in both global and project settings the project entry wins, except that an entry marked autoload false applies as a delta over the global one instead (0.92)
- JSON passed to Claude Code with `--settings` merges with the settings files at its own level: a key set there beats the same key in local, project, or user settings, and any key it omits keeps its lower-level value (0.91)
- In Claude Code's settings stack a project's shared `.claude/settings.json` overrides the user's `~/.claude/settings.json`, and `.claude/settings.local.json` in turn overrides the shared project file (0.91)
- A committed `.claude/settings.json` does not reach a teammate's session until they trust the folder for `permissions.allow` rules, `additionalDirectories`, `extraKnownMarketplaces`, and most `env` values, while `deny` and `ask` rules apply right away (0.91)

## Evidence

- `clm_ed2073143ece` — "Pi configures from JSON settings files in which project settings override global ones." · p 0.94 · active · 1 support · 0 contradict
  - `src_7dd0e1ac57d3` Settings: "Pi uses JSON settings files with project settings overriding global settings."
- `clm_785d6c7de321` — "When the same settings key appears in more than one place, Claude Code uses the value from the highest level that sets it and that value overrides the same key at every level below." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "When the same key appears in more than one place, Claude Code uses the value from the highest level that sets it. The stack below shows the levels, highest on top; a key at a higher level overrides the same key anywhere below it."
- `clm_c85b20ce8899` — "Relative resource paths in a Pi settings file resolve against that file's own directory — ~/.pi/agent for global settings and .pi for project settings — with absolute paths and ~ also accepted." · p 0.93 · active · 1 support · 0 contradict
  - `src_7dd0e1ac57d3` Settings: "Paths in `~/.pi/agent/settings.json` resolve relative to `~/.pi/agent`. Paths in `.pi/settings.json` resolve relative to `.pi`. Absolute paths and `~` are supported."
- `clm_da9d8c58cc46` — "Claude Code reports a whole settings file as a Settings Error when its JSON or a value is rejected and offers to fix, exit, or continue without it, but downgrades individual bad entries to a Settings Warning and keeps the rest of the file in effect." · p 0.93 · active · 1 support · 0 contradict · when: at the start of an interactive session
  - `src_44aa3ffce603` Claude Code settings: "**Settings Error**: a user, project, or local file has invalid JSON or a value the schema rejects."
- `clm_6ce4b501b320` — "A list-valued settings key such as `permissions.allow` set in more than one settings file is combined rather than overridden, so each file adds entries without removing another file's." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "When you set the same list key, such as `permissions.allow`, in more than one file, Claude Code combines the lists instead of picking one, so each file can add entries without removing another file's."
- `clm_ba8a7aa03de1` — "Claude Code reads settings from four JSON files plus managed settings an organization delivers from the claude.ai console, and the source a setting is saved in decides which people and projects it applies to." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "Claude Code reads settings from four files, and an organization can also deliver managed settings from the claude.ai console."
- `clm_17270ad4afd2` — "Setting PI_OFFLINE turns off every startup network operation in Pi, covering update checks, package updates, and install/update telemetry together." · p 0.92 · active · 1 support · 0 contradict
  - `src_7f85c02fc39f` Environment Variables: "Disable startup network operations, including update checks, package updates, and install/update telemetry"
- `clm_1cdc0a6c5ecf` — "Pi advises leaving retry.provider.maxRetries at 0, because provider-level retries can swallow out-of-usage-limit errors before Pi sees them and block the agent until the provider quota resets." · p 0.92 · active · 1 support · 0 contradict
  - `src_7dd0e1ac57d3` Settings: "Keep `retry.provider.maxRetries` at `0` unless provider-level retries are explicitly needed."
- `clm_503d19530fc4` — "Pi's enableInstallTelemetry governs the anonymous install/update ping and provider attribution headers only; opting out leaves version-check requests running, which PI_SKIP_VERSION_CHECK or offline mode disables separately." · p 0.92 · active · 1 support · 0 contradict
  - `src_7dd0e1ac57d3` Settings: "`enableInstallTelemetry` controls the anonymous install/update ping to `https://pi.dev/api/report-install` and Pi attribution headers for OpenRouter, NVIDIA NIM, and Cloudflare provider requests. Opting out disables both."
- `clm_9415967f93e0` — "Pi's resource arrays in settings take glob patterns plus explicit overrides: !pattern excludes, +path force-includes an exact path, and -path force-excludes one." · p 0.92 · active · 1 support · 0 contradict
  - `src_7dd0e1ac57d3` Settings: "Arrays support glob patterns and exclusions. Use `!pattern` to exclude. Use `+path` to force-include an exact path and `-path` to force-exclude an exact path."
- `clm_5174112e71a2` — "When one Pi package is listed in both global and project settings the project entry wins, except that an entry marked autoload false applies as a delta over the global one instead." · p 0.92 · active · 1 support · 0 contradict
  - `src_1589290f55f3` Pi Packages: "If the same package appears in both, the project entry wins unless the project entry has `autoload: false`, in which case it is applied as a delta over the global entry."
- `clm_3cd9cf0ce96b` — "JSON passed to Claude Code with `--settings` merges with the settings files at its own level: a key set there beats the same key in local, project, or user settings, and any key it omits keeps its lower-level value." · p 0.91 · active · 1 support · 0 contradict · when: for one session started from the terminal
  - `src_44aa3ffce603` Claude Code settings: "Claude Code merges JSON you pass with `--settings <file-or-json>` with your settings files by the same rules as the other levels: it takes a key you set here over the same key in local, project, or user settings, and keeps the lower-level…"
- `clm_e21271f2bfed` — "In Claude Code's settings stack a project's shared `.claude/settings.json` overrides the user's `~/.claude/settings.json`, and `.claude/settings.local.json` in turn overrides the shared project file." · p 0.91 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "Your team's `.claude/settings.json` sets it to `true`. Claude Code uses the project value because shared project sits above user, so you see tips in that project and nowhere else."
- `clm_a9afd6afe40a` — "A committed `.claude/settings.json` does not reach a teammate's session until they trust the folder for `permissions.allow` rules, `additionalDirectories`, `extraKnownMarketplaces`, and most `env` values, while `deny` and `ask` rules apply right away." · p 0.91 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "**The key waits for trust.** `permissions.allow` rules, `permissions.additionalDirectories`, `extraKnownMarketplaces`, and most [`env`](/docs/en/settings-reference#env) values apply only after each teammate [trusts the…"

## Timeline

- 2026-08-23 new_claim `clm_ba8a7aa03de1` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_785d6c7de321` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_e21271f2bfed` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_3cd9cf0ce96b` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_6ce4b501b320` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_a9afd6afe40a` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_da9d8c58cc46` (src_44aa3ffce603)
- 2026-09-11 new_claim `clm_ed2073143ece` (src_7dd0e1ac57d3)
- 2026-09-11 new_claim `clm_c85b20ce8899` (src_7dd0e1ac57d3)
- 2026-09-11 new_claim `clm_9415967f93e0` (src_7dd0e1ac57d3)
- 2026-09-11 new_claim `clm_1cdc0a6c5ecf` (src_7dd0e1ac57d3)
- 2026-09-11 new_claim `clm_503d19530fc4` (src_7dd0e1ac57d3)
- 2026-09-11 new_claim `clm_5174112e71a2` (src_1589290f55f3)
- 2026-09-11 new_claim `clm_17270ad4afd2` (src_7f85c02fc39f)

## Related

- ← uses [[pi]] (0.94)
- → part_of [[claude-code]] (0.93)
- [[claude-code]] — 7 shared claims
- [[pi]] — 7 shared claims
- [[permission-rule]] — 2 shared claims
- [[managed-settings]] — 1 shared claim
- [[pi-package]] — 1 shared claim
- [[workspace-trust]] — 1 shared claim
