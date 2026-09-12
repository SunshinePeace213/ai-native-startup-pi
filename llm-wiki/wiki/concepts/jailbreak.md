---
type: concept
status: current
created: 2026-09-02
updated: 2026-09-02
sources:
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
generated: {by: process:llm-wiki-render, at: 2026-09-02}
entity_ids: [ent_jailbreak]
claim_ids: [clm_59f21cecd99c, clm_21cc7130eee8, clm_4d24426fac61, clm_c89a24eb7edc]
confidence: 0.93
stale_after: 2029-10-09
last_rendered: 2026-09-02T10:16:55Z
review_required: false
---

# jailbreak

> **In here:** jailbreak — 4 claims, confidence 0.93, 1 source.

## Current understanding

- Jailbreaks and direct prompt injection treat the application's own user as the adversary crafting bypass inputs, while indirect prompt injection has a trusted user but adversarial instructions inside third-party content Claude processes such as web pages, emails, documents, and tool results (0.93)
- A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification (0.93)
- Against direct attacks the system prompt should emphasize ethical and legal boundaries and tell Claude explicitly how to refuse (0.93)
- Robust protection against jailbreaks and prompt injection comes from layering strategies, such as a directive-carrying system prompt combined with a harmlessness screen tool whose verdict is a structured boolean (0.92)

## Evidence

- `clm_59f21cecd99c` — "Jailbreaks and direct prompt injection treat the application's own user as the adversary crafting bypass inputs, while indirect prompt injection has a trusted user but adversarial instructions inside third-party content Claude processes such as web pages, emails, documents, and tool results." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Jailbreaks and direct prompt injection**, where the *user* of your application is the adversary and crafts inputs intended to bypass your guardrails."
- `clm_21cc7130eee8` — "A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Harmlessness screens:** Use a lightweight model like Claude Haiku 4.5 to pre-screen user input before it reaches your main conversation."
- `clm_4d24426fac61` — "Against direct attacks the system prompt should emphasize ethical and legal boundaries and tell Claude explicitly how to refuse." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Prompt engineering:** Craft system prompts that emphasize ethical and legal boundaries, and that explicitly tell Claude how to refuse."
- `clm_c89a24eb7edc` — "Robust protection against jailbreaks and prompt injection comes from layering strategies, such as a directive-carrying system prompt combined with a harmlessness screen tool whose verdict is a structured boolean." · p 0.92 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "By layering these strategies, you create a robust defense against jailbreaking and prompt injections, ensuring your Claude-powered applications maintain the highest standards of safety and compliance."

## Timeline

- 2026-09-02 new_claim `clm_59f21cecd99c` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_21cc7130eee8` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_4d24426fac61` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_c89a24eb7edc` (src_ba6d75fadd1b)

## Related

- ← applies_to [[claude-haiku-4-5]] (0.93)
- ← applies_to [[structured-outputs]] (0.93)
- → related_to [[prompt-injection]] (0.93)
- ← applies_to [[system-prompt]] (0.93)
- ← applies_to [[defense-in-depth]] (0.92)
- [[prompt-injection]] — 2 shared claims
- [[claude-haiku-4-5]] — 1 shared claim
- [[defense-in-depth]] — 1 shared claim
- [[structured-outputs]] — 1 shared claim
- [[system-prompt]] — 1 shared claim
