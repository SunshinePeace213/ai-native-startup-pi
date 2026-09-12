# Model roster

The roster for every deployment decision — orchestrator, subagent, or workflow
stage. Plans stamp a model + effort per task from this file; never hard-code
model guidance in templates, tasks, or commands.

Rankings 1–10, higher = better. **Intelligence** is how hard a problem the
model handles unsupervised. **Taste** covers UI/UX, code quality, API design,
and copy. **Speed** is wall-clock per task, not tokens per second. **Cost** is
what we actually pay per task — token efficiency and cache reads included —
not list price. The rankings are house judgments; every figure they rest on is
a wiki claim (`claim.key` in the footnotes, `llm-wiki/wiki/systems/<model>.md`
for the page). Checked: 2026-09-12.

## Roster

| Alias | Model · Pi id | Int | Taste | Speed | Cost | Choose for | Don't |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fable` | Claude Fable 5.1 · `anthropic/claude-fable-5-1` | 10 | 9 | 3 | 4 | Highest-judgment work — deep specs, and long-horizon autonomous runs `opus` cannot finish at any effort [^fable-when] | As a subagent (house rule: orchestrator only). At `low` it skips search tools [^fable-low] |
| `astra` | GPT-6 Astra · `openai-codex/gpt-6-astra` | 10 | 7 | 6 | 5 | Fable-grade coding and long-horizon knowledge work at ~40–60 % of Fable's per-task cost [^astra-ties] [^astra-cost]; the second-opinion reviewer for Claude-authored code | Presentation-heavy output — its Presentation Elo dropped [^astra-pres]. It takes 24 turns where Claude takes 60 [^astra-turns]: raise effort before switching model |
| `opus` | Claude Opus 5 · `anthropic/claude-opus-5` | 9 | 8 | 5 | 5 | **Default for orchestrators, planners, and judgment** [^opus-default]; complex implementation; behaviour-preserving refinement; review judging | — |
| `sol` | GPT-5.6 Sol · `openai-codex/gpt-5.6-sol` | 8 | 8 | 7 | 7 | Presentation deliverables — slides, spreadsheets [^sol-pres]; a second opinion in review | As a flagship — Astra replaced it and beats it 62 to 55 on the Coding Agent Index [^cai]. Price is promotional through 2026-11-21 [^sol-price] |
| `sonnet` | Claude Sonnet 5 · `anthropic/claude-sonnet-5` | 7 | 7 | 7 | 7 | **Default for delegated, scoped work** — subagents, review fixes, guarded mechanical flows [^sonnet-pos] | Judgment calls that ship |
| `luna` | GPT-5.6 Luna · `openai-codex/gpt-5.6-luna` | 5 | 4 | 9 | 10 | Utility micro-tasks — eligibility, classification, summaries, scoring — with 1M context and effort control [^luna-tier] [^luna-int] | Anything needing judgment |
| `haiku` | Claude Haiku 4.5 · `anthropic/claude-haiku-4-5` | 4 | 3 | 9 | 9 | Fallback for `luna` only, until a head-to-head eval settles it | No effort parameter [^haiku-effort]; 200K context; knowledge cutoff Feb 2025 [^haiku-limits] |

**Not on the roster** — `terra` (GPT-5.6 Terra): *"Luna and Sol are always on
the Pareto frontier ahead of Terra"* — for any Terra effort there is a Luna or
Sol effort that is smarter for the same cost or as smart for less [^terra].

## The numbers behind the columns

| Model | List $ in / cached / out per MTok | Context · max out (API) | Cutoff | Effort default | Cost per task (AA) |
| --- | --- | --- | --- | --- | --- |
| Fable 5.1 | 10 / **0.25** / 50 [^claude-price] [^fable-cache] | 1M · 128K | Jun 2026 | `high` [^claude-pos] | $7.63 Intelligence [^astra-cost] |
| Astra | 10 / 1 / 50 [^astra-price] | 1.05M · 128K [^astra-ctx] | Apr 2026 | `medium`; `none` → 400 [^astra-none] | $3.26 Intelligence · $7.09 Coding [^astra-cost] |
| Opus 5 | 5 / 0.50 / 25 | 1M · 128K | May 2026 | `high` | ~30 % above Astra on Coding [^astra-cost] |
| Sol | **4 / 0.40 / 20** promo → 5 / 0.50 / 30 [^sol-price] [^gpt-base] | 1.05M · 128K | Feb 2026 | `medium` [^gpt-effort] | $1.04 Intelligence (v4.1) [^sol-vs-fable5] |
| Sonnet 5 | 2 / 0.20 / 10 | 1M · 128K | Jan 2026 | `high` | — |
| Luna | 0.20 / 0.02 / 1.20 [^luna-price] | 1.05M · 128K | Feb 2026 | `medium` | $0.21 Intelligence (v4.1) [^sol-vs-fable5] |
| Haiku 4.5 | 1 / 0.10 / 5 | 200K · 64K | Feb 2025 | none | — |

Through Pi's `openai-codex` provider every GPT model reports **272K** context;
the API bills 2× input and 1.5× output for a request above 272K anyway
[^gpt-surcharge]. Batch/Flex are 50 %, Fast mode 2× [^astra-fast].

Index scores compare only within one Artificial Analysis article: the Astra
article (Intelligence 53 = Fable 5.1; Coding 62 = Fable 5.1 > Opus 5 60 >
Sol 55 [^cai]) and the earlier GPT-5.6 article (Intelligence v4.1: Sol 59,
Fable 5 60, Terra 55, Luna 51 [^sol-vs-fable5]; Coding v1.1: Sol 80, Terra 77,
Luna 75 [^cai-v11]).

## Effort

The provider's default is the floor: `high` on Claude, `medium` on GPT, none
on Haiku. Start there; step down for routine, precisely specified work, up for
demanding agentic or capability-sensitive work. Never stamp below the default
to save tokens.

Effort is not just thinking time — it also sets how many files the model
reads, how much it verifies, and how far it pushes a multi-step task before
checking back in [^effort-def]. A step that must run unattended end to end, or
whose job is verification, never goes below `medium`.

Effort names do not map to the same amount of thinking across models
[^effort-noncomp] — Sonnet 5 `medium` ≈ Sonnet 4.6 `high` [^sonnet-map] — so
re-stamp when the model changes. A long deliverable runs at `high`: at
`xhigh` and `max` Fable 5.1 can draft the whole output in thinking and then
write it out again [^fable-long].

| Effort | Choose for |
| --- | --- |
| `low` | Mechanical, hard-guarded steps that may pause for the user. Search and retrieval get reached for less here [^fable-low] |
| `medium` | Standard scoped edits; precisely specified unattended flows. OpenAI's default for most workloads [^gpt-effort] |
| `high` | **Default on Claude.** Complex logic; verification-shaped work; consolidating judgment. OpenAI's pick for agentic coding and complex debugging [^gpt-high] |
| `xhigh` | Cross-cutting or harness-core design; deep specs; long agentic runs. OpenAI: only when evals show a clear benefit [^gpt-xhigh] |
| `max` | Hardest single problems — depth over speed; rare |

## How to apply

- These are defaults, not limits. Standing permission to escalate: if a
  cheaper model's output misses the bar, redo the work on a smarter model
  without asking. Judge the output, not the price tag.
- Cost is a tie-breaker only; when axes conflict for anything that ships,
  intelligence > taste > cost. When torn between two tiers, take the higher.
  This overrides the global per-task/per-session token budgets in this repo.
- `fable` at `low` outscores a cheaper tier run at higher effort for
  comparable cost per task [^fable-curve] [^cost-per-task] — weigh it before
  stamping `sonnet` or `luna` on work that needs judgment.
- Pick the axis by the failure [^axis]. Check the prompt, context, and
  scoping first — a task that shouldn't need escalation is usually starved
  upstream. Then: it didn't *know* enough → raise the model; it didn't *try*
  hard enough → raise the effort.
- One agent, one purpose. A fix that failed a review round escalates a tier
  (model or effort) — never retry the same tier twice.
- A second agent reviews, never the author [^second-agent]; a different
  model family as the reviewer is the cross-model check.
- Anything user-facing (UI, copy, API design) needs taste ≥ 7.

[^fable-when]: `claude.model-routing.fable-when-opus-falls-short` — "or when your evals on Claude Opus 5 at higher effort still fall short."
[^fable-low]: `claude.fable-5-1.search-at-low-effort`
[^fable-curve]: `claude.fable-5-1.effort-capability-curve`
[^fable-long]: `claude.fable-5-1.long-output-effort`
[^fable-cache]: `claude.fable-5-1.cache-read-discount` — 0.025× base input.
[^opus-default]: `claude.model-routing.default` — "start with Claude Opus 5 for most workloads."
[^sonnet-pos]: `claude.positioning` — "The best combination of speed and intelligence."
[^claude-pos]: `claude.positioning` · `claude.latency-ladder`
[^claude-price]: `claude.pricing.current`
[^haiku-effort]: `claude.haiku-4-5.no-effort`
[^haiku-limits]: `claude.haiku-4-5.limits`
[^astra-ties]: `model-benchmarks.astra-ties-fable-5-1`
[^astra-cost]: `model-benchmarks.astra-cost-per-task`
[^astra-pres]: `openai.gpt-6-astra.presentation-quality`
[^astra-turns]: `openai.gpt-6-astra.fewer-turns`
[^astra-price]: `openai.gpt-6-astra.pricing`
[^astra-ctx]: `openai.gpt-6-astra.context-and-cutoff`
[^astra-none]: `openai.gpt-6-astra.no-none-effort`
[^astra-fast]: `openai.gpt-6-astra.fast-and-batch-pricing`
[^cai]: `model-benchmarks.coding-agent-index.astra-era`
[^cai-v11]: `model-benchmarks.coding-agent-index.v1-1`
[^sol-pres]: `openai.gpt-5-6-sol.presentation-elo`
[^sol-price]: `openai.gpt-5-6-sol.pricing`
[^sol-vs-fable5]: `model-benchmarks.gpt-5-6-sol-vs-fable-5`
[^gpt-base]: `openai.gpt-5-6.base-pricing`
[^gpt-effort]: `openai.effort.medium-default` · `openai.gpt-5-6.effort-levels`
[^gpt-high]: `openai.effort.high-for-agentic`
[^gpt-xhigh]: `openai.effort.xhigh-needs-evidence`
[^gpt-surcharge]: `openai.long-context-surcharge`
[^luna-tier]: `openai.gpt-5-6-luna.tier` · `openai.gpt-5-6.price-cut-2026-07`
[^luna-int]: `openai.gpt-5-6-luna.intelligence`
[^luna-price]: `openai.gpt-5-6-luna.pricing`
[^terra]: `openai.gpt-5-6-terra.dominated`
[^effort-def]: `claude.effort.definition`
[^effort-noncomp]: `claude.effort.cross-model-noncomparable`
[^sonnet-map]: `claude.sonnet-5.effort-mapping`
[^cost-per-task]: `claude.cost.per-task`
[^axis]: `claude.model-vs-effort.diagnosis`
[^second-agent]: `claude-code.loops.second-agent-review`
