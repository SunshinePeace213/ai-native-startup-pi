---
type: system
status: current
created: 2026-09-02
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/docs/anthropic/mitigate-jailbreaks.md, title: "Mitigate jailbreaks and prompt injections", id: src_ba6d75fadd1b}
  - {resource: llm-wiki/raw/docs/anthropic/models-overview.md, title: "Models overview", id: src_963229517470}
  - {resource: llm-wiki/raw/docs/anthropic/pricing.md, title: "pricing", id: src_41365e6aef45}
  - {resource: llm-wiki/raw/docs/anthropic/reduce-latency.md, title: "reduce-latency", id: src_40d06136bbd7}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_claude_haiku_4_5]
claim_ids: [clm_21cc7130eee8, clm_2b81a95aa8bb, clm_7c4565fc3397, clm_3d6594729375, clm_34fc0b797675, clm_41f9da71e4cf, clm_a6168419f5b5, clm_99361b6ce5ac]
confidence: 0.93
stale_after: 2027-03-22
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# Claude Haiku 4.5

> **In here:** Claude Haiku 4.5 does not support the effort parameter at all — it uses extended rather than adaptive thinking — so an effort level stamped on Haiku sets nothing · 8 claims, confidence 0.93.

## Current understanding

- A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification (0.93)
- For speed-critical applications Claude Haiku 4.5 offers the fastest response times while maintaining high intelligence, making model choice one of the most direct latency levers (0.93)
- Claude Haiku 4.5 does not support the effort parameter at all — it uses extended rather than adaptive thinking — so an effort level stamped on Haiku sets nothing (0.93)
- Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block (0.93)
- Anthropic's comparative latency ladder runs Fable 5.1 slower, Opus 5 moderate, Sonnet 5 fast, Haiku 4.5 fastest (0.93)
- Claude Haiku 4.5 has a 200K-token context window, 64K max output, and a reliable knowledge cutoff of February 2025, against 1M context, 128K output, and 2026 cutoffs for Sonnet 5, Opus 5, and Fable 5.1 (0.93)
- Anthropic positions Fable 5.1 for demanding reasoning and long-horizon agentic work, Opus 5 for complex agentic coding and enterprise work, Sonnet 5 as the best combination of speed and intelligence, and Haiku 4.5 as the fastest model with near-frontier intelligence (0.93)
- Claude API list prices per million input/output tokens are Fable 5.1 $10/$50, Opus 5 $5/$25, Sonnet 5 $2/$10, and Haiku 4.5 $1/$5 (0.92)

## Evidence

- `clm_21cc7130eee8` — "A lightweight model such as Claude Haiku 4.5 can pre-screen user input before it reaches the main conversation, with structured outputs constraining the verdict to a simple classification." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "* **Harmlessness screens:** Use a lightweight model like Claude Haiku 4.5 to pre-screen user input before it reaches your main conversation."
- `clm_2b81a95aa8bb` — "For speed-critical applications Claude Haiku 4.5 offers the fastest response times while maintaining high intelligence, making model choice one of the most direct latency levers." · p 0.93 · active · 1 support · 0 contradict · when: for speed-critical applications
  - `src_40d06136bbd7` reduce-latency: "For speed-critical applications, **Claude Haiku 4.5** offers the fastest response times while maintaining high intelligence:"
- `clm_7c4565fc3397` — "Claude Haiku 4.5 does not support the effort parameter at all — it uses extended rather than adaptive thinking — so an effort level stamped on Haiku sets nothing." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| `high` | `high` | `high` | Not supported |"
- `clm_3d6594729375` — "Each tool's raw output can pass through a small Claude Haiku 4.5 classifier call with a structured-output verdict, and only content the screen clears is returned as a tool_result block." · p 0.93 · active · 1 support · 0 contradict
  - `src_ba6d75fadd1b` Mitigate jailbreaks and prompt injections: "Run each tool, pass its raw output to a small classifier call with Claude Haiku 4.5, and only return the content as a `tool_result` block if the screen reports no injection attempt."
- `clm_34fc0b797675` — "Anthropic's comparative latency ladder runs Fable 5.1 slower, Opus 5 moderate, Sonnet 5 fast, Haiku 4.5 fastest." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| Comparative latency | Slower | Moderate | Fast | Fastest |"
- `clm_41f9da71e4cf` — "Claude Haiku 4.5 has a 200K-token context window, 64K max output, and a reliable knowledge cutoff of February 2025, against 1M context, 128K output, and 2026 cutoffs for Sonnet 5, Opus 5, and Fable 5.1." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "| Reliable knowledge cutoff | Jun 2026 | May 2026 | Jan 2026 | Feb 2025 |"
- `clm_a6168419f5b5` — "Anthropic positions Fable 5.1 for demanding reasoning and long-horizon agentic work, Opus 5 for complex agentic coding and enterprise work, Sonnet 5 as the best combination of speed and intelligence, and Haiku 4.5 as the fastest model with near-frontier intelligence." · p 0.93 · active · 1 support · 0 contradict
  - `src_963229517470` Models overview: "For demanding reasoning and long-horizon agentic work | For complex agentic coding and enterprise work | The best combination of speed and intelligence | The fastest model with near-frontier intelligence"
- `clm_99361b6ce5ac` — "Claude API list prices per million input/output tokens are Fable 5.1 $10/$50, Opus 5 $5/$25, Sonnet 5 $2/$10, and Haiku 4.5 $1/$5." · p 0.92 · active · 1 support · 0 contradict
  - `src_41365e6aef45` pricing: "| Claude Opus 5 | $5 / MTok | $6.25 / MTok | $10 / MTok | $0.50 / MTok | $25 / MTok |"

## Timeline

- 2026-09-02 new_claim `clm_2b81a95aa8bb` (src_40d06136bbd7)
- 2026-09-02 new_claim `clm_21cc7130eee8` (src_ba6d75fadd1b)
- 2026-09-02 new_claim `clm_3d6594729375` (src_ba6d75fadd1b)
- 2026-09-12 new_claim `clm_7c4565fc3397` (src_963229517470)
- 2026-09-12 new_claim `clm_41f9da71e4cf` (src_963229517470)
- 2026-09-12 new_claim `clm_34fc0b797675` (src_963229517470)
- 2026-09-12 new_claim `clm_a6168419f5b5` (src_963229517470)
- 2026-09-12 new_claim `clm_99361b6ce5ac` (src_41365e6aef45)

## Related

- → applies_to [[jailbreak]] (0.93)
- → applies_to [[latency]] (0.93)
- → applies_to [[prompt-injection]] (0.93)
- [[claude-fable-5-1]] — 4 shared claims
- [[claude-opus-5]] — 4 shared claims
- [[claude-sonnet-5]] — 4 shared claims
- [[structured-outputs]] — 2 shared claims
- [[effort-level]] — 1 shared claim
- [[jailbreak]] — 1 shared claim
- [[latency]] — 1 shared claim
- [[prompt-injection]] — 1 shared claim
