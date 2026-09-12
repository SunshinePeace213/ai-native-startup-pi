---
source: llm-as-judge.md
fetched: 2026-08-28
---
> **In here:** the Aug-2026 Anthropic/OpenAI/Google model landscape · why cross-model review direction matters (Claude reviewing Codex +18 pts, Codex reviewing Claude −8.6) · LLM-as-a-judge from zero — judging modes, prompt rules, measured biases with countermeasures, golden-set calibration with Cohen's κ, juries · copy-paste spec, plan, diff, and triage judge prompts

# Cross-Model AI Code Review & LLM-as-a-Judge: A 2026 Practical Guide for a Solo Founder

## TL;DR
- **Your February-2026 diagram is directionally right but stale on names — and it has the review direction backwards.** As of August 2026 the Anthropic lineup is Haiku 4.5, Sonnet 5, Opus 5, and a top "Mythos" tier (public model = Fable 5); "Opus 4.6" and "GPT-5.4" are both superseded. Critically, the controlled study you're thinking of found **Claude reviewing Codex helped (+18 pts) while Codex reviewing Claude *hurt* (−8.6 pts)** on LiveCodeBench. Your proposed "Anthropic authors, OpenAI reviews" split is the *losing* direction — keep your strongest model (Opus 5) as the judge.
- **The two-terminal copy-paste workflow is obsolete.** OpenAI shipped an official `codex-plugin-cc` plugin (March 2026) that runs Codex review from inside Claude Code with one command; MCP bridges and subagents now do programmatically what you did by hand. Modernize to: Plan Mode → judge the plan → implement + write tests → **run the tests first** → cross-model diff review → human check on load-bearing code.
- **Review is not dead — it's been reshaped.** Where tests exist, run them (execution-grounded verification beats asking a model). For judgment calls (specs, plans, security, "did it do the right thing?"), cross-model LLM-as-a-judge with a rubric still adds real value. Your stated weak point — LLM-as-a-judge — is very learnable: use **binary + rubric** grades, **force evidence quotes**, counter **position/verbosity/self-preference bias**, and **calibrate against a 30–50 example golden set you label yourself**.

---

## Key Findings

1. **The Anthropic lineup you pasted is out of date.** Verified against Anthropic's own pricing docs (Aug 2026): Haiku 4.5 ($1/$5 per million tokens in/out), Sonnet 5 ($2/$10, now permanent), Opus 5 ($5/$25), Fable 5 ($10/$50, the public Mythos-tier model). Opus 5 (released July 24, 2026) is the coding flagship; Fable 5 only narrowly beats it on the very hardest coding tasks and costs 2× as much.
2. **Direction of review matters enormously and contradicts your plan.** The arXiv study (2607.21656, Xiang et al.) is the source of your +18/−8.6 numbers. Claude-as-reviewer is "always helpful or neutral"; Codex-as-reviewer helped only when the draft was already weak.
3. **Cross-model review earns its keep for judgment, not for verifiable facts.** Where tests exist, run them. Reserve the LLM judge for open-ended quality (security, architecture, "did it match the spec").
4. **LLM-as-a-judge biases are real and measured** — position, verbosity, self-preference, sycophancy, token-gaming — and each has a concrete countermeasure.
5. **Most eval tooling is overkill for you.** promptfoo or DeepEval running locally is plenty; Braintrust/LangSmith/Arize/Weave are team tools you don't need yet.

---

## Details

### Part 0 — Correcting the model landscape (the "verify everything" section)

**Anthropic (from platform.claude.com/docs pricing, checked Aug 2026):**

| Model | Input $/MTok | Output $/MTok | Role sweet spot | In Claude Code? |
|---|---|---|---|---|
| Claude Haiku 4.5 | $1 | $5 | cheap high-volume grading, mechanical triage, first-pass judge | yes |
| Claude Sonnet 5 | $2 | $10 | default workhorse: implementation, test writing, most review | yes (default) |
| Claude Opus 5 | $5 | $25 | hard planning/architecture, complex debugging, top-tier judge | yes |
| Claude Fable 5 | $10 | $50 | only the very hardest coding; public Mythos tier | yes (restored Jul 1, 2026) |
| Claude Mythos 5 | $10 | $50 | limited availability (Project Glasswing only) | no |

Verified specifics:
- **Sonnet 5's $2/$10 introductory rate is now permanent** — the scheduled Sept 1 increase to $3/$15 was cancelled.
- **Fable 5 = Mythos 5 + safety classifiers.** Flagged cyber/bio/chem/distillation queries are transparently rerouted to Opus 4.8 (and billed at Opus rates, not Fable rates). Anthropic says classifiers fire in under 5% of sessions and are deliberately over-conservative. Fable 5/Mythos 5 were first released June 9, 2026; access was suspended June 12 for U.S. Commerce Department export controls and restored July 1, 2026. Mythos 5 (safeguards lifted) stays gated to Project Glasswing partners.
- **Fable 5/Mythos traffic carries mandatory 30-day data retention** that overrides prior zero-retention agreements — relevant if you handle client or sensitive code.
- **Benchmarks (SWE-bench Verified):** Opus 5 ~96.0%, Fable 5 ~95.0%, Opus 4.8 88.6%. SWE-bench Pro: Fable 5 80.3% slightly ahead of Opus 5 79.2%. Sonnet 5 ~85.2% Verified / 63.2% Pro. Opus 5 leads Frontier-Bench and ARC-AGI-3.
- **Tokenizer caveat:** Claude 4.7+ and Mythos-tier models use a tokenizer that emits ~30% more tokens for the same text. Factor this into cost math — a nominally "cheaper" model can cost more per task.
- Fast mode (Opus 5/4.8): $10/$50, research preview.
- API IDs: `claude-fable-5`, `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5-20251001`.

**Verdict for you: Fable 5 is not worth it.** Opus 5 matches it on nearly everything at half the price, without the 30-day retention constraint or the safeguard-reroute surprise billing. Reserve Fable 5 for a genuinely Opus-5-defeating problem — and Anthropic's own guidance notes that when Fable 5 misses a hard problem it usually lacks the key insight and retrying reproduces the same wrong approach, so escalate hard failures to Opus 5 rather than paying to retry on Fable.

**OpenAI Codex (from developers.openai.com/codex/models + release notes):** The numbered Codex line consolidated in 2026. Codex CLI now recommends the GPT-5.6 tier (Sol/Terra/Luna as capability/cost lanes). **GPT-5.4 and GPT-5.4-mini retire from Codex-with-ChatGPT-signin on August 31, 2026** (replaced by gpt-5.6-terra / gpt-5.6-luna); GPT-5.5 (April 23, 2026) was the previous flagship. Reasoning effort is a real knob (low/medium/high/xhigh; toggle with Alt+, / Alt+. in the TUI, or set `model_reasoning_effort` in `config.toml`). `codex exec` runs non-interactively for CI; Codex can also run as an MCP server. So your "GPT-5.4" reference is stale — the modern equivalent is "the current default Codex model at high/xhigh effort."

**Google Gemini (for the tiebreaker question):** Gemini 3.1 Pro (Feb 19, 2026) at $2/$12 per MTok up to 200K tokens ($4/$18 above the 200K threshold, and the whole request re-rates — watch that cliff on full-repo reviews). Strong reasoning, 1M context, genuinely different training lineage — a reasonable third-opinion judge.

### Part 1 — Best-practice workflow in the multi-tier era

Governing principle: **"cheap model for cheap work, expensive model for judgment."** Judgment is where errors are most expensive, so spend there.

| Pipeline stage | Recommended tier | Why |
|---|---|---|
| Spec drafting | Sonnet 5 (escalate to Opus 5 if fuzzy) | cheap, iterative |
| Planning / architecture | **Opus 5** | mistakes cascade — a bad plan produces bad code no matter how good execution is |
| Implementation | Sonnet 5 default; Opus 5 for hard modules | speed + code quality |
| Code review / judging | **Opus 5** (strongest available) | judgment is the expensive-error zone |
| Test writing | Sonnet 5 | mechanical-ish, output is verifiable |
| Mechanical refactors | Haiku 4.5 / Sonnet 5 | cheap, low-judgment |
| Cheap high-volume grading | **Haiku 4.5** first-pass, escalate on flag | volume economics |

**Should the top-tier model be judge or author? Judge.** The research (Part 5) shows the stronger model adds more value reviewing than the weaker model does. Put your best model where judgment happens.

**Claude Code mechanics that make this concrete:**
- `/model` switches the model mid-session.
- **Plan Mode** (Shift+Tab twice, or `--permission-mode plan`) is a *hard* read-only constraint — Claude can read (Read/Glob/Grep/WebSearch) but physically cannot Write/Edit/Bash until you approve the plan. This is your spec/plan gate. To get a good plan, ask explicitly: "list the files to edit, the functions to modify in each, and the order of operations."
- **Subagents** are isolated Claude sessions with their own context window *and their own model* — set the `model:` field explicitly (e.g. `model: claude-haiku-4-5` for a cheap reviewer). ⚠️ Subagents inherit the lead's model by default, which the community calls the #1 cost surprise of 2026. Subagents can't show permission prompts, so keep them read-only (review/explore) and let the parent do writes.
- Built-in `/review`, `/security-review`, and the newer bundled skills (`/code-review`, `/verify`, `/run`). Claude Code also now runs on desktop, web, mobile, IDE, and Slack, and the Agent SDK exposes the same primitives (subagents, hooks, MCP) as a library for CI.

### Part 2 — Is your 4-step workflow still valid?

Your diagram: **Plan in Claude → Codex reviews plan → implement in Claude → Codex verifies → ship.**

**What's still right:**
- Plan-first, gate-each-stage discipline — more important than ever.
- Cross-model review (different family) as a concept is sound.

**What's stale / wrong:**
- Model names (Opus 4.6 / GPT-5.4).
- **Direction: you have Codex reviewing Claude, which the evidence says HURTS** (Part 5). Flip it, or keep Opus 5 as the final judge.
- **Two-terminal manual copy-paste is obsolete.** Since ~March 2026 you can integrate:
  - **`openai/codex-plugin-cc`** — OpenAI's official plugin. Commands `/codex:review`, `/codex:rescue` (hand implementation to Codex), `/codex:transfer` (port the session with full context), `/codex:status/result/cancel`, all support `--background` and `--wait`. Install: `/plugin marketplace add openai/codex-plugin-cc` → `/plugin install codex@openai-codex` → `/reload-plugins` → `/codex:setup`. It shells out to your local Codex CLI (same credentials, same usage limits). ⚠️ `/codex:setup --enable-review-gate` auto-runs a Codex review on every Claude stop — powerful but can spike cost; turn it on deliberately.
  - **MCP bridges** (Zen MCP lets Claude call Gemini/GPT/others) and **worktree orchestrators** (magic-cc-codex-worker, Parallel Code, Conductor, Crystal, Emdash) run Claude+Codex+Gemini in parallel, each in an isolated git worktree so branches don't collide.

**Modernized workflow diagram:**
```
1. SPEC      Claude (Sonnet 5) drafts spec  ──►  spec-judge (Opus 5) rubric-grades it
2. PLAN      Claude Plan Mode (Opus 5)      ──►  plan-judge (Opus 5) checks; opt. Codex 2nd opinion
3. IMPLEMENT Claude (Sonnet 5) writes code + tests
4. VERIFY    (a) RUN THE TESTS / type-check  ← execution-grounded, FIRST, free truth
             (b) diff-judge: Opus 5 reviews the diff
                 cross-model: /codex:review (different family, catches different bugs)
5. TRIAGE    "judge the review": dedupe, severity-rank, DROP no-evidence nits,
             ESCALATE Opus/Codex disagreements to you
6. HUMAN     you read the diff on load-bearing paths (auth, payments, data-loss)
```

### Part 3 — Is the review pattern dead?

**Verdict: No, but it changed shape.** Three forces:
1. **Execution-grounded verification beats model opinion where it applies.** Run tests, type-checks, contract checks — facts, not opinions. (See Latent.Space "How to Kill the Code Review," and the broader verifier/RLVR literature.) Rank competing agent outputs by which passes the most checks.
2. **Stronger single models need less step-by-step review** for routine code — a visible shift after Opus 4.5, where many devs stopped reviewing every step.
3. **But review is essential where intent must be reconstructed.** Addy Osmani's "Agentic Code Review" cites the **Faros AI "AI Engineering Impact Report 2026: The Acceleration Whiplash"** (a 29-page report drawing on two years of telemetry across 22,000 developers and 4,000+ teams). Its findings under high AI adoption: **"Code churn… has increased 861%"**, the **"incidents-to-PR ratio is up 242.7%"**, bugs per developer **"rose 54%"**, **"median time in review is up 441.5%,"** and **"31.3% of PRs are now merging with no review at all."** The lesson: nobody *chose* to stop reviewing — reviewers just couldn't keep pace. Spend human attention by blast radius, not by guilt.

**Honest contrarian take for you specifically:** For a solo founder with no users yet, letting AI review most code is a defensible position (Osmani says so explicitly: "Solo with no users… is a defensible 2026 position, and you should not feel guilty about it"). Keep a human on load-bearing paths (auth, payments, anything that can lose data or money).

### Part 4 — THE MAIN EVENT: LLM-as-a-judge, taught from zero

**What it is (like you're 5):** You have a robot that writes essays (the *author* model). Checking every essay yourself is slow, so you hire a *second* robot whose only job is to grade essays against a checklist you wrote (the *judge*). The whole craft is (a) writing a good checklist and (b) proving the grader grades the way you would. That's it. Everything below is detail on those two things.

**The judging modes:**

| Mode | What it does | When to use |
|---|---|---|
| **Pointwise / direct scoring** | grades one output in isolation (score or pass/fail) | monitoring, CI gates, debugging (you see *why* it failed) |
| **Pairwise comparison** | "is A or B better?" | model/prompt selection ("is my new prompt better than the old one?") |
| **Reference-based** | compares output to a gold answer | when you have a known-correct answer |
| **Rubric-based** | scores against explicit named criteria | almost always — the backbone |
| **Binary pass/fail assertions** | one yes/no per criterion | the most reliable primitive |
| **G-Eval** | LLM generates eval steps (chain-of-thought), then form-fills, probability-weighted score | structured pointwise scoring |
| **Checklists** | list of atomic yes/no checks | decompose fuzzy quality into countable parts |
| **Verifier / execution-based** | run the code/tests | whenever the thing is verifiable — beats any LLM judge |

**Why binary + rubric beats a vague 1–10 score:** A "7/10" is noise — the model can't hold a stable absolute scale across runs, and human inter-rater reliability on 1–5 helpfulness sits around 0.45–0.60 to begin with. Break quality into atomic binary criteria ("Does it handle empty input? yes/no") and you get reproducible, debuggable, less-biased grades. Analytic (criterion-by-criterion) rubrics beat holistic ones because they tell you *why* it failed. Pairwise is even more stable than pointwise for "which is better" decisions because there's no absolute scale to hold steady — Anthropic's own current guidance is the hybrid: **unit tests for correctness + LLM rubrics for the qualities tests can't capture.**

**How to write a good judge prompt:**
1. **Define each criterion explicitly.** Don't say "good code"; say "handles errors, no SQL injection, has tests for new behavior."
2. **Few-shot examples of good AND bad,** each with the correct verdict.
3. **Require evidence** — force the judge to quote the exact offending line for every issue. This one trick kills most hallucinated criticism and most token-gaming.
4. **Chain-of-thought BEFORE the verdict** (reason first, score last).
5. **Structured JSON output** against a schema (parseable, loggable, gate-able).
6. **Per-criterion atomic evaluation** with a one-line explanation (avoids "criterion conflation," where the judge blurs multiple issues into one score).

**Known biases and countermeasures (with measured magnitudes):**

| Bias | What it is | Measured magnitude (source) | Countermeasure |
|---|---|---|---|
| **Position bias** | prefers whatever's in slot A or B | Only GPT-4 stayed >60% consistent when the two answers were swapped (Zheng et al. 2023, MT-Bench); weaker judges far worse | Run both orders, average; shuffle options |
| **Verbosity / length bias** | longer = "better" | GPT-4 picked the longer answer >90% of the time when length differed >20% (Saito et al. 2023) | Penalize length in rubric; per-criterion binary checks |
| **Self-preference / self-enhancement** | judge favors its own family's output | GPT-4 recall 0.945 (human-favorable) vs 0.425 (human-unfavorable), a 0.520 gap (Wataoka et al. 2024); GPT-4o's win rate dropped 13 pts when judged blind | Use a **different family** to judge; blind the author identity |
| **Sycophancy** | agrees with a stated user opinion | LLMs affirm whichever side the user takes in **48%** of moral-conflict cases (ELEPHANT, Cheng et al. 2025); debate framing elicits 2–3× more than direct questions | Don't tell the judge your opinion; neutral framing |
| **Superficial-token gaming** | ":" or "Let's solve step by step" fools it | "master key" tokens produce **false-positive rates as high as 80%**, "a widespread failure affecting… leading proprietary systems such as GPT-o1 and Claude-4" (Zhao et al., "One Token to Fool LLM-as-a-Judge," arXiv:2507.08794) | Require evidence quotes; add truncated/garbage outputs as adversarial negatives |
| **Leniency/severity drift, formatting bias, "nice-answer" bias, score clustering** | grades bunch up, drift lenient, reward polish | qualitatively documented (Justice or Prejudice? / CALM, Ye et al.) | binary criteria; calibrate; penalize confident tone in the prompt |

**Calibration & validation — how do you know your judge is any good?**
1. **Build a golden set:** 30–50 examples you grade yourself, covering clean passes, edge cases, and failures. (30 is a viable floor for binary tasks if the failure class is well represented; 200+ for high-stakes production gates. This is practitioner guidance from Galtea/Arize/Evidently, *not* a proven constant.)
2. **Run the judge on all of them.**
3. **Measure agreement, not raw accuracy.** Use **Cohen's kappa** (chance-adjusted). Landis & Koch 1977 scale: <0.20 slight, 0.21–0.40 fair, 0.41–0.60 moderate, 0.61–0.80 substantial, 0.81–1.00 almost perfect. Practical floor ≈ 0.6; ship-ready ≈ 0.8. (Note: these cutoffs are convention, not law.) For 3-way labels use weighted kappa; for uneven annotation use Krippendorff's alpha.
4. **The trap:** raw accuracy lies on imbalanced sets. If 80% of your outputs pass, a judge that always says "pass" scores 80% accuracy but κ ≈ 0 — it's guessing. Also report **precision/recall on defect detection**: high precision + low recall = a conservative judge that misses real bugs.
5. **Align the judge to you, not you to the judge.** When the judge disagrees, fix the *rubric*, not your labels. Iterate ~5–10 times; alignment plateaus.
6. If *you* can't agree with yourself (or a second person) on >80% of examples, the task is ambiguous — fix the rubric before blaming the model.

**Advanced patterns:**
- **Jury / Panel (PoLL, "Panel of LLM evaluators"):** Verga et al., *"Replacing Judges with Juries"* (arXiv:2404.18796, Cohere, 2024) showed a panel of smaller diverse models "outperforms a single large judge, exhibits less intra-model bias due to its composition of disjoint model families, and does so while being over seven times less expensive." If 3 uncorrelated judges agree, joint error is small; if they disagree, you've found a hard case that warrants your attention.
- **When panels DON'T help:** if judges agree >95% you bought one verdict three times — collapse to one. For objective tasks (code compiles or not, test passes or not), skip the panel and run the check.
- **Judge distillation:** prompt/train a cheap model (Haiku) with a strong rubric to approximate a big judge.
- **Meta-judging** ("judge the judge") and **confidence thresholds with escalation to a human** for low-confidence cases.
- **When to just run tests instead:** always, when the property is verifiable. Verifiable checks for "did it solve it"; rubrics for "did it explain/secure/cite/communicate well."

**Operationalizing for a solo founder:**
- Store judge prompts as **versioned files in your repo** — they're code; diff them, review them, roll them back.
- Run judges in CI via `codex exec` or the Claude Agent SDK; **pin the judge model** and use **tolerance bands** (not exact thresholds) so LLM nondeterminism doesn't flake your build.
- **Log every judgment**: input, verdict, evidence quote, model, prompt version.
- **Tooling honesty:** **promptfoo** (YAML, local, CLI, strong red-teaming; now OpenAI-owned but still MIT and model-agnostic) or **DeepEval** (pytest-native, G-Eval and 50+ metrics built in) are the right solo-scale picks — free, local, no infra. **Braintrust, LangSmith, Arize Phoenix, W&B Weave, Confident AI are overkill at solo scale** — they exist for team dashboards, annotation workflows, and production monitoring. OpenAI Evals and Inspect AI are registry/public-sector oriented; Ragas is RAG-specific. **Start with promptfoo; add nothing until you have a second engineer or paying users.**

### Part 5 — Should Anthropic plan+implement while OpenAI reviews?

**Does direction matter? Yes, decisively.** The controlled experiment (Xiang et al., arXiv:2607.21656, 116 hard/medium LiveCodeBench tasks, Claude Opus 4.7 + Codex GPT-5.5, both at high reasoning effort, reviewer sees the draft but can't run tests):
- **Claude reviewing Codex: 71.6% → 89.7% (+18 pts, p=.001)**
- **Codex reviewing Claude: 91.4% → 82.8% (−8.6 pts, p=.046)**
- Claude self-review: unchanged at 91.4%
- Codex self-review: 71.6% → 84.5%

Paper's own summary: *"Claude as reviewer is always helpful or neutral; Codex as reviewer is helpful only when the draft [is weak]."*

**So your proposed division (Anthropic authors, OpenAI reviews) is exactly the losing direction on this benchmark.** At minimum, flip the roles so your strongest model judges — or A/B test on your own tasks before committing.

**Honest caveat:** this is *one* study, on now-superseded models (Opus 4.7 / GPT-5.5), competitive-programming tasks, with a reviewer that couldn't execute tests. Don't over-generalize. But it directly contradicts your plan, which is reason enough to change the default.

**Different family vs strongest model?** Both effects are real: model diversity gives uncorrelated blind spots (why cross-model review catches security/logic bugs single-model review misses), *and* the stronger model reviews better regardless of family. Resolve the tension this way: **make your strongest model (Opus 5) the primary judge, and add a different-family second opinion (Codex via the plugin, or Gemini) for diversity, routing disagreements to yourself.**

**Third model (Gemini) as tiebreaker?** Worth it only when Opus 5 and Codex disagree — then Gemini 3.1 Pro breaks the tie or flags it for you. Don't run three judges on every diff.

**Cheap Anthropic first-pass judge?** Yes — Haiku 4.5 or Sonnet 5 triages everything cheaply; escalate only flagged/uncertain cases to Opus 5. This escalation ladder is your main cost control.

---

## Recommendations

**Stage 1 (this week) — fix the direction and the names.**
- Rewrite your diagram so **Claude (Opus 5) is the reviewer/judge**, not just the author. If Codex writes anything, Claude reviews it — not the reverse.
- Install `codex-plugin-cc` so cross-model review is one command, not copy-paste. Leave the auto review-gate OFF until you understand the cost.
- **Always run tests / type-checks BEFORE any LLM review.** Free truth first.

**Stage 2 (this month) — build one judge and calibrate it.**
- Start with the **diff/implementation judge** (highest leverage; template below).
- Build a **30-example golden set** from your own repo; label pass/fail yourself.
- Run the judge (Opus 5), compute Cohen's kappa, iterate the *rubric* until κ ≥ 0.6.
- Automate it with promptfoo. Version the prompt in git.

**Stage 3 (when you have users) — escalation ladder + optional panel.**
- Haiku 4.5 first-pass → Opus 5 on flags → Gemini tiebreaker only on Opus/Codex disagreement → you on load-bearing paths.

**Thresholds that change the plan:**
- If Opus 5 solo already passes your evals reliably, drop cross-model review for routine code (keep it for security/auth/payments).
- If your judge's κ stays <0.4 after rubric iteration, the task is too ambiguous — simplify to binary criteria or grade it yourself.
- If judges agree >95%, collapse the panel to one.
- If monthly judge spend exceeds ~10–15% of total model spend, push more grading down to Haiku.

**Monthly cost estimate (solo, moderate use, dozens of features/month):**
- Implementation in Claude Code: a **Claude Max plan (~$100–200/mo)** covers most Sonnet 5 / Opus 5 interactive work.
- API-metered judging on Opus 5: grading ~2M input + 0.5M output tokens/month ≈ 2×$5 + 0.5×$25 = **~$22.50/mo**; push high-volume grading to Haiku and it drops to a few dollars.
- Codex via a **ChatGPT Plus subscription (~$20/mo)** for the plugin.
- Gemini tiebreaker: **negligible** (used rarely).
- **Realistic all-in: ~$120–250/month**, dominated by the Claude subscription — *not* the judge API calls. Don't let eval-tooling FOMO add SaaS line items on top of this.

**Copy-paste-ready judge prompt templates:**

**(1) Spec Judge**
```
You are a strict spec reviewer. Grade the SPEC below against each criterion.
For EACH criterion output: verdict (PASS/FAIL), and if FAIL, quote the exact
line and explain in one sentence. Reason step by step BEFORE giving verdicts.

Criteria:
- C1 Scope is unambiguous (no "etc.", no undefined terms)
- C2 Success criteria are testable/measurable
- C3 Edge cases and error behavior are specified
- C4 Out-of-scope is explicitly stated
- C5 Dependencies/assumptions are named

Severity: FAIL on C1/C2 = blocker; others = warning.

Output JSON:
{"verdicts":[{"id":"C1","verdict":"PASS|FAIL","evidence":"<quoted line or ''>","note":"<one sentence>"}],
 "blockers":<int>,"warnings":<int>,"overall":"SHIP|REVISE"}
SPEC:
<<<{{spec}}>>>
```

**(2) Plan Judge**
```
You are a senior architect reviewing an IMPLEMENTATION PLAN before any code is written.
Reason step by step, then grade. Quote the exact plan step for every issue.

Criteria:
- P1 Lists concrete files to create/modify
- P2 Names functions/modules to change and the order of operations
- P3 States test impact and how correctness will be verified
- P4 Identifies rollback / blast-radius risk
- P5 No cascading assumptions (each step's inputs exist from a prior step)

Output JSON:
{"verdicts":[{"id":"P1","verdict":"PASS|FAIL","evidence":"<quote>","note":"..."}],
 "highest_severity":"blocker|warning|none","overall":"APPROVE|REVISE"}
PLAN:
<<<{{plan}}>>>
```

**(3) Diff / Implementation Judge**
```
You are an adversarial code reviewer from a DIFFERENT team than the author.
You have the task, the diff, and the test results. Assume the author is competent;
only flag issues you can prove. Quote the exact offending line for EVERY finding.
Reason step by step BEFORE verdicts. Do not reward length or confident tone.

Check (binary each):
- Correctness: logic matches the task/spec
- Edge cases: empty/null/boundary handled
- Security: injection, authz, secrets, unsafe deserialization
- Error handling: failures caught and surfaced
- Tests: cover the new/changed behavior
- Regressions: nothing previously passing is broken

Severity levels: CRITICAL (security/data-loss/crash), MAJOR (wrong result),
MINOR (style/perf non-blocking).

Output JSON:
{"findings":[{"category":"...","severity":"CRITICAL|MAJOR|MINOR",
  "file":"...","line":"<quoted code>","explanation":"...","suggested_fix":"..."}],
 "critical":<int>,"major":<int>,"minor":<int>,"verdict":"BLOCK|APPROVE_WITH_NITS|APPROVE"}
TASK: <<<{{task}}>>>
DIFF: <<<{{diff}}>>>
TEST_RESULTS: <<<{{test_output}}>>>
```

**(4) "Judge the Review" Triage Judge**
```
You are a triage lead. You are given findings from one or more code reviewers
(possibly different models). Deduplicate, rank by severity, and flag disagreements.
For each finding decide: KEEP (real, actionable), DROP (false positive / no evidence /
style nitpick with no quoted line), or ESCALATE (reviewers disagree, or a CRITICAL claim).
A finding with no quoted offending line = automatic DROP unless CRITICAL.

Output JSON:
{"kept":[{"severity":"...","summary":"...","source":"...","evidence":"<quote>"}],
 "dropped":[{"summary":"...","reason":"no_evidence|duplicate|style"}],
 "escalate_to_human":[{"summary":"...","why":"disagreement|unverified_critical"}],
 "recommended_action":"BLOCK|FIX_THEN_SHIP|SHIP"}
REVIEWS:
<<<{{reviewer_outputs}}>>>
```

---

## Caveats
- **The model landscape moves weekly.** All prices/benchmarks here were verified against Anthropic's docs and OpenAI's models page in Aug 2026; re-check before committing budget.
- **The +18/−8.6 direction result is a single study** on superseded models (Opus 4.7 / GPT-5.5) and competitive-programming tasks with a reviewer that couldn't run tests. Treat it as a strong prior, not gospel — A/B test on your own tasks.
- **Evidence tiers:** *research-backed* = the bias magnitudes (Zheng, Saito, Wataoka, Cheng, Zhao) and the LiveCodeBench study; *practitioner consensus* = golden-set sizes, "review isn't dead but reshaped," tooling recommendations, the Faros telemetry (a vendor report, credible but not peer-reviewed); *speculation* = anything about future model releases.
- **The "r=0.87 vs 0.44" verbosity correlation** that circulates could not be verified in a primary source — I've used Saito et al.'s ">90% when length differs >20%" instead. Similarly, the "GPT-4 +10% / Claude +25%" self-enhancement and "91% vs 8.7% repetitive-list attack" figures come from secondary summaries of Zheng et al. 2023; treat the exact digits as approximate.
- **Golden-set size (30–50)** is practitioner guidance, not a proven constant — more is safer for high-stakes gates.
- **Fable 5's 30-day mandatory data retention and safeguard-reroute billing** are real reasons to default to Opus 5 for any sensitive or client code.