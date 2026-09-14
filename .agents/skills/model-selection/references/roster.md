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
for the page) or a row in an archived leaderboard table (`[^src-…]`, path in
the footnote — source-backed, not yet a claim). Checked: 2026-09-15.

Priority when axes conflict: **result > cost > time**. Intelligence, then
taste, decide anything that ships; cost breaks ties; wall-clock is the last
tie-breaker.

## Roster

| Alias | Model · Pi id | Int | Taste | Speed | Cost | Choose for | Don't |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fable` | Claude Fable 5.1 · `anthropic/claude-fable-5-1` | 10 | 9 | 3 | 4 | Highest-judgment work — deep specs; rubric-graded professional deliverables (APEX-Agents Pass@1 leader [^apex-two-metrics]); recall-heavy work (AA-Omniscience accuracy leader [^omni-acc]); long-horizon autonomous runs `opus` cannot finish at any effort [^fable-when] | As a subagent (house rule: orchestrator only). Guarded flows — 0.71 guardrail breaks per task against Astra's 0.44 [^src-ab]. At `low` it skips search tools [^fable-low] |
| `astra` | GPT-6 Astra · `openai-codex/gpt-6-astra` | 10 | 7 | 6 | 6 | Terminal and SaaS agentic work — leads Fable 5.1 on Terminal-Bench v4.0 [^tb-v4] and AutomationBench-AA [^ab-leader], ties it on APEX-Agents and the AA-Omniscience Index [^apex-error] [^omni-index], at ~40–60 % of Fable's per-task cost [^astra-ties] [^astra-cost]; guarded flows — fewest guardrail breaks on the roster [^ab-compliance]; the second-opinion reviewer for Claude-authored code | Presentation-heavy output — its Presentation Elo dropped [^astra-pres]. It takes 24 turns where Claude takes 60 [^astra-turns]: raise effort before switching model — but `max` is not a step up from `xhigh` [^tb-effort] [^deepswe] |
| `opus` | Claude Opus 5 · `anthropic/claude-opus-5` | 9 | 8 | 5 | 4 | **Default for orchestrators, planners, and judgment** [^opus-default]; complex implementation; behaviour-preserving refinement; review judging. Ties Astra on DeepSWE v1.1 at 74 % [^deepswe] | Cost-sensitive SWE runs — the DeepSWE tie costs 1.8× Astra and 3.4× the steps [^deepswe] [^deepswe-steps] |
| `sol` | GPT-5.6 Sol · `openai-codex/gpt-5.6-sol` | 8 | 8 | 7 | 7 | Presentation deliverables — slides, spreadsheets [^sol-pres]; a second opinion in review; the SWE fallback when Astra quota is out — at `max` it ties Astra `xhigh` on DeepSWE for the same cost [^src-deepswe] | As a flagship — Astra replaced it and beats it 62 to 55 on the Coding Agent Index [^cai] and by 20 points on Terminal-Bench v4.0 [^src-tb]. Price is promotional through 2026-11-21 [^sol-price] |
| `sonnet` | Claude Sonnet 5 · `anthropic/claude-sonnet-5` | 7 | 7 | 7 | 7 | **Default for delegated, scoped work** — subagents, review fixes, guarded mechanical flows [^sonnet-pos]. **Under-evidenced** — see below | Judgment calls that ship. Effort above `high`: at `max` it grinds 268 steps for 54 % on DeepSWE, the costliest run on the board [^src-deepswe] |
| `terra` | GPT-5.6 Terra · `openai-codex/gpt-5.6-terra` | 6 | 5 | 8 | 8 | **Candidate** for delegated, scoped work until a head-to-head against `sonnet` runs — at `max` it outscores Sol and Sonnet 5 on APEX-Agents and sits 0.5 pt behind Sol on AutomationBench-AA, at 40 % of Sol's price [^src-apex] [^src-ab] [^terra-price]; OpenAI's own step-down from Astra [^openai-routing] | Terminal-heavy agentic work — 35.4 % on Terminal-Bench v4.0 [^src-tb]. Read the domination note below before stamping it over `luna` for utility work |
| `luna` | GPT-5.6 Luna · `openai-codex/gpt-5.6-luna` | 5 | 4 | 9 | 10 | Utility micro-tasks — eligibility, classification, summaries, scoring — with 1M context and effort control [^luna-tier] [^luna-int]; cheap delegated SWE tasks — 67 % on DeepSWE at `max` for $0.61 per task [^src-deepswe] | Anything needing judgment; anything terminal-heavy — 11.6 % on Terminal-Bench v4.0 [^src-tb] |
| `haiku` | Claude Haiku 4.5 · `anthropic/claude-haiku-4-5` | 4 | 3 | 9 | 9 | Fallback for `luna` only, until a head-to-head eval settles it | No effort parameter [^haiku-effort]; 200K context; knowledge cutoff Feb 2025 [^haiku-limits]; absent from every benchmark the roster cites |

**Terra's domination note.** *"Luna and Sol are always on the Pareto frontier
ahead of Terra"* [^terra] was measured on the Intelligence Index v4.1 on
2026-07-09 — a non-agentic index, at Terra's pre-cut price; the 20 % cut
landed on 2026-07-30 [^terra-cut]. It says nothing about the five agentic
benchmarks, where Terra beats or ties Sol. Keep it out of utility work that
`luna` already covers; treat it as a live candidate for the `sonnet` tier.

**Sonnet 5 is under-evidenced.** Its Int 7 and default-tier row rest on
Anthropic's positioning [^sonnet-pos], not on results: it is absent from
Terminal-Bench v4.0, AutomationBench-AA, and the AA-Omniscience top 20; on
APEX-Agents it ranks 13th, behind Terra [^src-apex]; on DeepSWE its best
config is `max` at 54 % for $26.40 — 13 points below Luna `max` at 1/43 the
cost [^src-deepswe]. It keeps the row until a head-to-head against `terra` and
`luna` on this repo's own subagent tasks is run; stamp it at `high`, never
above.

## The five benchmarks

The five this repo tracks (none is saturated — no benchmark has 20 models
above 75 %; the highest score anywhere is 79.4). Scores are at the effort
shown; a single figure means the source ran only that effort.

| Model | Terminal-Bench v4.0 [^tb-v4] | APEX-Agents 1.1 Pass@1 · Mean [^apex-lb] | AutomationBench-AA (breaks/task) [^ab-leader] | AA-Omniscience Index · accuracy [^omni-index] [^omni-acc] | DeepSWE v1.1 ($/task · steps) [^deepswe] |
| --- | --- | --- | --- | --- | --- |
| Fable 5.1 | xhigh **55.1** · max 52.0 · high 52.0 | max **68.6** · 77.1 | max 59.4 (0.71) | max 43.45 · **67.2 %** | not run |
| Astra | xhigh **59.6** · max 59.1 · high 54.0 · medium 49.5 | max 64.7 · 75.1 | max **68.5** · xhigh 67.2 · high 66.6 · medium 64.6 (0.44) | high **43.73** · xhigh 43.42 · max 43.40 · medium 42.22 · 62.6 % | xhigh **74 %** ($6.52 · 29) |
| Opus 5 | max 49.0 | max 65.8 · 77.0 | max 56.6 (0.78) | max 37.07 · 60.9 % | max **74 %** ($11.84 · 99) |
| Sol | max 39.9 | max 51.4 · 65.2 | max 60.1 (0.71) | max 21.97 · 59.4 % | max 73 % ($6.46 · 61) |
| Terra | max 35.4 | max 58.2 · 71.8 | max 59.6 (0.68) | — · 46.8 % | not shown |
| Sonnet 5 | — | max 54.5 · 67.4 | — | — | max 54 % ($26.40 · 268) |
| Luna | max 11.6 | — | max 50.2 (0.85) | — · 42.7 % | max 67 % ($0.61 · 102) |
| Haiku 4.5 | — | — | — | — | — |

Figures beyond the headline claims are read from the archived tables
[^src-tb] [^src-apex] [^src-ab] [^src-omni] [^src-deepswe].

What each one measures, and the caveat that travels with it:

- **Terminal-Bench v4.0** — 66 hard terminal tasks, pass@1 over three runs;
  v4.0 dropped eight saturated tasks, so it is not comparable to earlier
  versions [^tb-break].
- **APEX-Agents** — multi-hour banking/law/consulting work graded by an LM
  judge against expert rubrics; the top five Pass@1 sit inside their own
  ±5 error bars, so it separates tiers, not neighbours [^apex-error].
- **AutomationBench-AA** — SaaS workflows where any guardrail breach zeroes
  the task; it exposes policy adherence more than competence (Astra completes
  88.8 % of objectives, scores 41.6 % strict) [^ab-compliance]. Not comparable
  to Zapier's own board [^ab-metric].
- **AA-Omniscience** — recall and calibration on a −100..100 index;
  knowledge reliability does not track intelligence rank, and domain leaders
  come from three labs [^omni-not-ii] [^omni-domains]. Astra's hallucination
  rate rises with effort — 44.8 % at `high` to 51.3 % at `max` [^src-omni].
- **DeepSWE v1.1** — 113 long-horizon SWE tasks graded from the committed
  patch in a clean container; equal pass rates hide 5× cost differences
  [^deepswe-steps].

## The numbers behind the columns

| Model | List $ in / cached / out per MTok | Context · max out (API) | Cutoff | Effort default | Cost per task (AA) |
| --- | --- | --- | --- | --- | --- |
| Fable 5.1 | 10 / **0.25** / 50 [^claude-price] [^fable-cache] | 1M · 128K | Jun 2026 | `high` [^claude-pos] | $7.63 Intelligence [^astra-cost] |
| Astra | 10 / 1 / 50 [^astra-price] | 1.05M · 128K [^astra-ctx] | Apr 2026 | `medium`; `none` → 400 [^astra-none] | $3.26 Intelligence · $7.09 Coding [^astra-cost] |
| Opus 5 | 5 / 0.50 / 25 | 1M · 128K | May 2026 | `high` | ~30 % above Astra on Coding [^astra-cost] |
| Sol | **4 / 0.40 / 20** promo → 5 / 0.50 / 30 [^sol-price] [^gpt-base] | 1.05M · 128K | Feb 2026 | `medium` [^gpt-effort] | $1.04 Intelligence (v4.1) [^sol-vs-fable5] |
| Sonnet 5 | 2 / 0.20 / 10 | 1M · 128K | Jan 2026 | `high` | — |
| Terra | 2 / 0.20 / 12 [^terra-price] | 1.05M · 128K | Feb 2026 | `medium` | $0.55 Intelligence (v4.1, pre-cut) [^sol-vs-fable5] |
| Luna | 0.20 / 0.02 / 1.20 [^luna-price] | 1.05M · 128K | Feb 2026 | `medium` | $0.21 Intelligence (v4.1) [^sol-vs-fable5] |
| Haiku 4.5 | 1 / 0.10 / 5 | 200K · 64K | Feb 2025 | none | — |

Through Pi's `openai-codex` provider every GPT model reports **272K** context;
the API bills 2× input and 1.5× output for a request above 272K anyway
[^gpt-surcharge]. Batch/Flex are 50 %, Fast mode 2× [^astra-fast].

This repo runs on two subscriptions, so per-task cost is quota burn on two
independent pools: routing a stage to the other family spreads load rather
than adding spend. The July price cuts also count against Codex quota
[^terra-cut].

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

**The highest label is not the best-scoring one.** Measured best effort per
model, from the five benchmarks:

| Model | Measured best | Evidence |
| --- | --- | --- |
| Fable 5.1 | `xhigh` | Terminal-Bench 55.1 at `xhigh` against 52.0 at both `max` and `high` [^src-tb]; Omniscience Index `max` 43.45 > `xhigh` 42.38 > `high` 40.80 is the one place `max` wins, by a point [^src-omni] |
| Astra | `xhigh` | Terminal-Bench 59.6 vs `max` 59.1 [^tb-effort]; DeepSWE's best Astra config [^deepswe]; `max` wins AutomationBench by 1.3 [^src-ab] and loses the Omniscience Index to `high`, hallucinating most [^src-omni] |
| Opus 5 | `xhigh` (Anthropic) | Only `max` is benchmarked; Anthropic's rule is `xhigh` for demanding coding and agentic work [^opus-xhigh] |
| Sol · Terra | `max` | The only effort either is measured at; Sol `max` ties Astra `xhigh` on DeepSWE [^src-deepswe] |
| Sonnet 5 | `high` | `max` buys steps, not passes — 268 steps, 54 % [^src-deepswe]; escalate the *model* instead |
| Luna | `medium` (`max` for SWE) | `medium` is DeepSWE's cheapest frontier point; `max` reaches 67 % for $0.61 [^src-deepswe] |

**Session defaults** — the main Pi session is the orchestrator, so it runs at
the measured best, not the provider floor: Fable 5.1 `xhigh`, Astra `xhigh`,
Opus 5 `xhigh`; Sonnet 5 `high`; Sol and Terra `max` when either is the
session model; Luna `medium`. The escalation from Astra `xhigh` is Fable 5.1
`xhigh` — a different family — not Astra `max`.

| Effort | Choose for |
| --- | --- |
| `low` | Mechanical, hard-guarded steps that may pause for the user. Search and retrieval get reached for less here [^fable-low] |
| `medium` | Standard scoped edits; precisely specified unattended flows. OpenAI's default for most workloads [^gpt-effort] |
| `high` | **Default on Claude.** Complex logic; verification-shaped work; consolidating judgment. OpenAI's pick for agentic coding and complex debugging [^gpt-high]. Sonnet 5's ceiling |
| `xhigh` | Cross-cutting or harness-core design; deep specs; long agentic runs; the orchestrator session on Fable 5.1, Astra, and Opus 5. OpenAI: only when evals show a clear benefit [^gpt-xhigh] — Terminal-Bench and DeepSWE do |
| `max` | Hardest single problems — depth over speed; rare. Measured *below* `xhigh` for Fable 5.1 and Astra on terminal work [^tb-effort]; the measured setting for Sol and Terra |

## How to apply

- These are defaults, not limits. Standing permission to escalate: if a
  cheaper model's output misses the bar, redo the work on a smarter model
  without asking. Judge the output, not the price tag.
- Result > cost > time. When axes conflict for anything that ships,
  intelligence > taste > cost; wall-clock is the last tie-breaker. When torn
  between two tiers, take the higher. This overrides the global
  per-task/per-session token budgets in this repo.
- `fable` at `low` outscores a cheaper tier run at higher effort for
  comparable cost per task [^fable-curve] [^cost-per-task] — weigh it before
  stamping `sonnet` or `luna` on work that needs judgment.
- Pick the axis by the failure [^axis]. Check the prompt, context, and
  scoping first — a task that shouldn't need escalation is usually starved
  upstream. Then: it didn't *know* enough → raise the model; it didn't *try*
  hard enough → raise the effort. A model already at its measured best effort
  escalates on the model axis.
- One agent, one purpose. A fix that failed a review round escalates a tier
  (model or effort) — never retry the same tier twice.
- A second agent reviews, never the author [^second-agent]; a different
  model family as the reviewer is the cross-model check.
- Anything user-facing (UI, copy, API design) needs taste ≥ 7.
- Guarded flows — anything that must not touch what already holds — favour
  the model with the lowest guardrail-break rate, which is Astra, not a Claude
  model [^ab-compliance] [^src-ab].

[^fable-when]: `claude.model-routing.fable-when-opus-falls-short` — "or when your evals on Claude Opus 5 at higher effort still fall short."
[^fable-low]: `claude.fable-5-1.search-at-low-effort`
[^fable-curve]: `claude.fable-5-1.effort-capability-curve`
[^fable-long]: `claude.fable-5-1.long-output-effort`
[^fable-cache]: `claude.fable-5-1.cache-read-discount` — 0.025× base input.
[^opus-default]: `claude.model-routing.default` — "start with Claude Opus 5 for most workloads."
[^opus-xhigh]: `claude.opus-5.effort-low-medium` — "step up to `xhigh` for demanding coding and agentic work."
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
[^openai-routing]: `openai.model-routing.default` — "Start with `gpt-6-astra`… drop to `gpt-5.6-terra` for lower cost."
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
[^terra]: `openai.gpt-5-6-terra.dominated` — Intelligence Index v4.1, 2026-07-09.
[^terra-price]: `openai.gpt-5-6-terra.pricing`
[^terra-cut]: `openai.gpt-5-6.price-cut-2026-07`
[^tb-v4]: `model-benchmarks.terminal-bench-v4`
[^tb-effort]: `model-benchmarks.terminal-bench-v4.effort-non-monotonic`
[^tb-break]: `model-benchmarks.terminal-bench-v4.version-break`
[^apex-lb]: `model-benchmarks.apex-agents.leaderboard`
[^apex-two-metrics]: `model-benchmarks.apex-agents.leaderboard` — Fable 5.1 leads Pass@1 at 68.6; Gemini 3.7 Flash leads Mean Score.
[^apex-error]: `model-benchmarks.apex-agents.ranking-within-error`
[^ab-leader]: `model-benchmarks.automationbench.leaderboard`
[^ab-compliance]: `model-benchmarks.automationbench.compliance-gap`
[^ab-metric]: `model-benchmarks.automationbench.metric-divergence`
[^omni-index]: `model-benchmarks.aa-omniscience.leaderboard`
[^omni-acc]: `model-benchmarks.aa-omniscience.accuracy-vs-index`
[^omni-not-ii]: `model-benchmarks.aa-omniscience.not-intelligence-index`
[^omni-domains]: `model-benchmarks.aa-omniscience.domain-specialization`
[^deepswe]: `deepswe.v1-1.leaderboard`
[^deepswe-steps]: `deepswe.v1-1.step-efficiency`
[^effort-def]: `claude.effort.definition`
[^effort-noncomp]: `claude.effort.cross-model-noncomparable`
[^sonnet-map]: `claude.sonnet-5.effort-mapping`
[^cost-per-task]: `claude.cost.per-task`
[^axis]: `claude.model-vs-effort.diagnosis`
[^second-agent]: `claude-code.loops.second-agent-review`
[^src-tb]: table in `llm-wiki/raw/articles/artificial-analysis/terminalbench-v4-0.md` — no claim yet.
[^src-apex]: table in `llm-wiki/raw/articles/mercor/apex-agents-leaderboard.md` — no claim yet.
[^src-ab]: table in `llm-wiki/raw/articles/artificial-analysis/automationbench-aa.md` — no claim yet.
[^src-omni]: tables in `llm-wiki/raw/articles/artificial-analysis/omniscience.md` — no claim yet.
[^src-deepswe]: "Best" table in `llm-wiki/raw/articles/datacurve/deepswe-v1-1.md` — no claim yet.
