---
type: concept
status: current
created: 2026-08-23
updated: 2026-08-23
sources:
  - {resource: llm-wiki/raw/docs/claude-code/settings.md, title: "Claude Code settings", id: src_44aa3ffce603}
generated: {by: process:llm-wiki-render, at: 2026-08-23}
entity_ids: [ent_managed_settings]
claim_ids: [clm_b7452ba63021, clm_eaeabd09442d, clm_ba8a7aa03de1]
confidence: 0.93
stale_after: 2029-10-26
last_rendered: 2026-08-23T14:39:21Z
review_required: false
---

# managed settings

> **In here:** Managed settings an organization deploys sit at the top of Claude Code's precedence stack, so nothing a developer sets overrides them — not even a key passed with `--settings` · 3 claims, confidence 0.93.

## Current understanding

- Managed settings an organization deploys sit at the top of Claude Code's precedence stack, so nothing a developer sets overrides them — not even a key passed with `--settings` (0.93)
- For a few security-sensitive keys Claude Code honors the stricter value from a lower scope in preference to the managed value, the one documented break in managed settings' precedence (0.93)
- Claude Code reads settings from four JSON files plus managed settings an organization delivers from the claude.ai console, and the source a setting is saved in decides which people and projects it applies to (0.93)

## Evidence

- `clm_b7452ba63021` — "Managed settings an organization deploys sit at the top of Claude Code's precedence stack, so nothing a developer sets overrides them — not even a key passed with `--settings`." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "**Managed settings**: settings your organization deploys, by a `managed-settings.json` file, an MDM policy, or [server-managed settings](/docs/en/server-managed-settings) from the claude.ai console."
- `clm_eaeabd09442d` — "For a few security-sensitive keys Claude Code honors the stricter value from a lower scope in preference to the managed value, the one documented break in managed settings' precedence." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "For a few security-sensitive keys, Claude Code honors a stricter value from a lower level over a managed value; [Exceptions to managed settings precedence](#exceptions-to-managed-settings-precedence) lists them."
- `clm_ba8a7aa03de1` — "Claude Code reads settings from four JSON files plus managed settings an organization delivers from the claude.ai console, and the source a setting is saved in decides which people and projects it applies to." · p 0.93 · active · 1 support · 0 contradict
  - `src_44aa3ffce603` Claude Code settings: "Claude Code reads settings from four files, and an organization can also deliver managed settings from the claude.ai console."

## Timeline

- 2026-08-23 new_claim `clm_ba8a7aa03de1` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_b7452ba63021` (src_44aa3ffce603)
- 2026-08-23 new_claim `clm_eaeabd09442d` (src_44aa3ffce603)

## Related

- → applies_to [[claude-code]] (0.93)
- [[claude-code]] — 3 shared claims
- [[settings-file]] — 1 shared claim
