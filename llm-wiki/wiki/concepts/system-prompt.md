---
type: concept
status: current
created: 2026-08-23
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/anthropic/increase-consistency.md, title: "increase-consistency", id: src_1dce2e527884}
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/anthropic/reduce-prompt-leak.md, title: "reduce-prompt-leak", id: src_10de5546316e}
  - {resource: llm-wiki/raw/docs/claude-code/cli-reference.md, title: "CLI reference", id: src_716248fd9713}
  - {resource: llm-wiki/raw/docs/pi/environment-variables.md, title: "Environment Variables", id: src_7f85c02fc39f}
  - {resource: llm-wiki/raw/docs/pi/extensions.md, title: "Extensions", id: src_a49af96a95e8}
  - {resource: llm-wiki/raw/docs/pi/usage.md, title: "Using Pi", id: src_ab670f25c35e}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_system_prompt]
claim_ids: [clm_16f6ac707152, clm_8d072866bebe, clm_4d24426fac61, clm_66dbb26cde8a, clm_2a4a7a195d5a, clm_2ef1b8811d31, clm_91780f43c09d, clm_79e574a54ad5, clm_956634f81fad, clm_ec17dbea2a46, clm_e12133e66288]
confidence: 0.92
stale_after: 2027-01-13
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# system prompt

> **In here:** Appending to Claude Code's system prompt preserves the default tool guidance, safety instructions, and coding conventions so only the difference must be supplied, whereas replacing it drops the… · 11 claims, confidence 0.92.

## Current understanding

- The system prompt should state explicitly that content returned from tools, documents, or searches is untrusted data that must never override the system prompt or the user's original request (0.93)
- Appending to Claude Code's system prompt preserves the default tool guidance, safety instructions, and coding conventions so only the difference must be supplied, whereas replacing it drops the entire default prompt and shifts responsibility for everything the task still needs onto the author (0.93)
- Against direct attacks the system prompt should emphasize ethical and legal boundaries and tell Claude explicitly how to refuse (0.93)
- The system-prompt flags apply only to the invocation that passes them; a persona meant to persist and be shared across a project belongs in an output style, and conventions Claude should always follow belong in CLAUDE.md (0.93)
- Keeping Claude in character takes a system prompt that defines the role and personality in detail plus a list of common scenarios with expected responses, so it handles diverse situations without breaking character (0.92)
- A system prompt can isolate key information and context from user queries, with the key instructions emphasized in the user turn and, on models that support it, re-emphasized by prefilling the assistant turn (0.92)
- Pi replaces its default system prompt from a SYSTEM.md placed per-project or globally, and appends to it instead with APPEND_SYSTEM.md in either location (0.92)
- A role prompt is the most effective way to use a system prompt, and even a leak-guarding system prompt should remain predominantly a role prompt (0.92)
- Pi directs the agent to read PI_PROVIDER and PI_MODEL to answer which model is running rather than infer it from the system prompt (0.91)
- Pi appends a custom tool's promptGuidelines bullets flat into the shared Guidelines section with no tool-name prefix, so each bullet must name its own tool rather than say "this tool" (0.91)
- Claude Code exposes four system-prompt flags — two that replace the default prompt and two that append to it, each in a literal and a file-reading form — and all four work in interactive as well as non-interactive mode (0.89)

## Evidence

- `clm_16f6ac707152` — "The system prompt should state explicitly that content returned from tools, documents, or searches is untrusted data that must never override the system prompt or the user's original request." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **State the policy in your system prompt.** Tell Claude explicitly that content returned from tools, documents, or searches is untrusted data and must never override the system prompt or the user's original request."
- `clm_8d072866bebe` — "Appending to Claude Code's system prompt preserves the default tool guidance, safety instructions, and coding conventions so only the difference must be supplied, whereas replacing it drops the entire default prompt and shifts responsibility for everything the task still needs onto the author." · p 0.93 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "Appending preserves the default tool guidance, safety instructions, and coding conventions, so you only supply what differs."
- `clm_4d24426fac61` — "Against direct attacks the system prompt should emphasize ethical and legal boundaries and tell Claude explicitly how to refuse." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Prompt engineering:** Craft system prompts that emphasize ethical and legal boundaries, and that explicitly tell Claude how to refuse."
- `clm_66dbb26cde8a` — "The system-prompt flags apply only to the invocation that passes them; a persona meant to persist and be shared across a project belongs in an output style, and conventions Claude should always follow belong in CLAUDE.md." · p 0.93 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "These flags apply only to the current invocation. For persistent personas you can switch between and share across a project, use [output styles](/docs/en/output-styles)."
- `clm_2a4a7a195d5a` — "Keeping Claude in character takes a system prompt that defines the role and personality in detail plus a list of common scenarios with expected responses, so it handles diverse situations without breaking character." · p 0.92 · active · 1 support · 0 contradict · when: for role-based applications
  - `src_1dce2e527884` increase-consistency: "* **Prepare Claude for possible scenarios:** Provide a list of common scenarios and expected responses in your prompts. This "trains" Claude to handle diverse situations without breaking character."
- `clm_2ef1b8811d31` — "A system prompt can isolate key information and context from user queries, with the key instructions emphasized in the user turn and, on models that support it, re-emphasized by prefilling the assistant turn." · p 0.92 · active · 1 support · 0 contradict
  - `src_10de5546316e` reduce-prompt-leak: "* **Separate context from queries:** You can try using system prompts to isolate key information and context from user queries."
- `clm_91780f43c09d` — "Pi replaces its default system prompt from a SYSTEM.md placed per-project or globally, and appends to it instead with APPEND_SYSTEM.md in either location." · p 0.92 · active · 1 support · 0 contradict
  - `src_ab670f25c35e` Using Pi: "Append to the default prompt without replacing it with `APPEND_SYSTEM.md` in either location."
- `clm_79e574a54ad5` — "A role prompt is the most effective way to use a system prompt, and even a leak-guarding system prompt should remain predominantly a role prompt." · p 0.92 · active · 1 support · 0 contradict
  - `src_10de5546316e` reduce-prompt-leak: "Notice that this system prompt is still predominantly a role prompt, which is the [most effective way to use system…"
- `clm_956634f81fad` — "Pi directs the agent to read PI_PROVIDER and PI_MODEL to answer which model is running rather than infer it from the system prompt." · p 0.91 · active · 1 support · 0 contradict
  - `src_7f85c02fc39f` Environment Variables: "When asked which model or provider is running, inspect these variables instead of inferring the answer from the system prompt:"
- `clm_ec17dbea2a46` — "Pi appends a custom tool's promptGuidelines bullets flat into the shared Guidelines section with no tool-name prefix, so each bullet must name its own tool rather than say "this tool"." · p 0.91 · active · 1 support · 0 contradict
  - `src_a49af96a95e8` Extensions: "`promptGuidelines` bullets are appended flat to the `Guidelines` section with no tool name prefix. Each guideline must name the tool it refers to — avoid "Use this tool when..." because the LLM cannot tell which tool "this" means."
- `clm_e12133e66288` — "Claude Code exposes four system-prompt flags — two that replace the default prompt and two that append to it, each in a literal and a file-reading form — and all four work in interactive as well as non-interactive mode." · p 0.89 · active · 1 support · 0 contradict
  - `src_716248fd9713` CLI reference: "Claude Code provides four flags for customizing the system prompt. All four work in both interactive and non-interactive modes."

## Timeline

- 2026-08-23 new_claim `clm_e12133e66288` (src_716248fd9713)
- 2026-08-23 new_claim `clm_8d072866bebe` (src_716248fd9713)
- 2026-08-23 new_claim `clm_66dbb26cde8a` (src_716248fd9713)
- 2026-09-02 new_claim `clm_2a4a7a195d5a` (src_1dce2e527884)
- 2026-09-02 new_claim `clm_4d24426fac61` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_16f6ac707152` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_2ef1b8811d31` (src_10de5546316e)
- 2026-09-02 new_claim `clm_79e574a54ad5` (src_10de5546316e)
- 2026-09-11 new_claim `clm_91780f43c09d` (src_ab670f25c35e)
- 2026-09-11 new_claim `clm_956634f81fad` (src_7f85c02fc39f)
- 2026-09-11 new_claim `clm_ec17dbea2a46` (src_a49af96a95e8)

## Related

- → applies_to [[prompt-injection]] (0.93)
- → applies_to [[jailbreak]] (0.93)
- ← related_to [[output-styles]] (0.93)
- ← uses [[pi]] (0.93)
- → applies_to [[output-consistency]] (0.92)
- → applies_to [[prompt-leak]] (0.92)
- [[pi]] — 3 shared claims
- [[claude-code]] — 2 shared claims
- [[prompt-leak]] — 2 shared claims
- [[jailbreak]] — 1 shared claim
- [[output-consistency]] — 1 shared claim
- [[output-styles]] — 1 shared claim
- [[pi-extension]] — 1 shared claim
- [[prefill]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
- [[schema-layer]] — 1 shared claim
