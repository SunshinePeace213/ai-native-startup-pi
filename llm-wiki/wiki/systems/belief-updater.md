---
type: system
status: current
created: 2026-08-20
updated: 2026-09-17
sources:
  - {resource: llm-wiki/raw/articles/llm-wiki/housamkak/llm-wiki.md, title: "LLM Wiki v3: A State-Space Knowledge System", id: src_758247b58186}
  - {resource: llm-wiki/raw/articles/llm-wiki/rohitg00/llm-wiki.md, title: "LLM Wiki v2", id: src_48f57237f6ef}
  - {resource: llm-wiki/raw/chats/llm-wiki-engine-layout-refactor.md, title: "Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer", id: src_157432f58354}
  - {resource: llm-wiki/raw/chats/llm-wiki-phase-5-automation-build.md, title: "llm-wiki Phase 5 automation build — what the session asked, found, and decided", id: src_e261dc10ac79}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-coordination-and-reversal.md, title: "Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach", id: src_e689bfca564a}
  - {resource: llm-wiki/raw/notes/llm-wiki-phase-6-governance-build-notes.md, title: "Phase 6 governance build notes — the fold key, the guards, and what the loops measured", id: src_4863372048fa}
generated: {by: process:llm-wiki-render, at: 2026-09-17}
entity_ids: [ent_belief_updater]
claim_ids: [clm_a0b912ad50ca, clm_61c5c8ab49ab, clm_e64947bbb8f2, clm_877c740dd0fb, clm_2c4f52e16820, clm_30151137c491, clm_c0aec8aa0fdd, clm_d55e8a20db3b, clm_b6682585a170, clm_49f55182d4b0, clm_59b41ebd88de, clm_cbe455eb80f8]
confidence: 0.81
stale_after: 2026-09-24
last_rendered: 2026-09-17T23:03:13Z
review_required: false
---

# belief updater

> **In here:** Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior… · 12 claims, confidence 0.81.

## Current understanding

- A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion (0.96)
- A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set, so a confirmation that carries no override leaves the claim in the review queue and its pages marked review_required (0.91)
- The engine's --root flag is global and precedes the verb, so the hooks run the queue as uv run scripts/llm-wiki/state.py --root <root> queue --json; the verb-first order exits 2 with unrecognized arguments (0.87)
- Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth (0.82)
- Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid — because probabilities saturate too easily while log-odds lets independent sources accumulate naturally (0.82)
- Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required — and the operation vocabulary is new_claim, support_update, contradiction_update, scope_split, exception_addition, supersession, decay_update, promotion, archival, rejection, and human_override (0.82)
- Ledger rows fold in (timestamp, run_id, file order), made causal by an engine invariant that stamps every write run strictly after the newest replayed ledger stamp — max(now, newest + 1 second) — so runs never tie inside one checkout and the run_id component only ever orders runs from two independent branches (0.78)
- The state layer's write lock is useful for what it records rather than only for what it excludes: the holder writes its process id, actor, verb, and start time into the lock file, so a second writer's refusal names who holds it, and a stale record left by a crashed holder is informational because the kernel released the advisory lock with the process (0.76)
- The engine's six scripts live together under scripts/llm-wiki/ as common.py, state.py, render.py, graph.py, retrieve.py, and lint.py; because they run as PEP 723 uv run --script entries that reach each other through the running script's own directory on sys.path, moving them together preserves the launch model exactly and the sibling import shortens to import common (0.76)
- The engine's tests live under a top-level tests/llm-wiki/ rather than inside tests/harness-layer/, because the engine is a product layer and not harness tooling, with its fixtures and hook tests alongside and the shared hook fixtures lifted to tests/conftest.py so both hook directories use one copy (0.76)
- Mirroring module names into per-layer test folders collides on basenames under pytest's default prepend mode and the hyphenated directory names rule out the __init__.py fix, so the suite runs --import-mode=importlib with a pythonpath entry per directory to keep the two cross-module test imports resolving (0.72)
- The renderer embeds a script's own filename in the pages it writes, so renaming that script drifts every rendered page carrying the line and render check reports it as drift; the repair is a re-render through the renderer that owns those files, never a hand edit (0.71)

## Evidence

- `clm_a0b912ad50ca` — "A contradiction is useful signal, never something to hide: it resolves into one of six outcomes — an unresolved dispute, a newer source superseding an older one, a scope split, an exception added to the rule, the old claim weakened, or human review required — and the updater asks which of them applies rather than treating every conflict as mutual exclusion" · p 0.96 · active · 2 support · 0 contradict
  - `src_48f57237f6ef` LLM Wiki v2: "The LLM should propose which claim is more likely correct based on source recency, source authority, and the number of supporting observations. The human can override, but the default behavior should usually be right."
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Contradictions should not be hidden."
- `clm_61c5c8ab49ab` — "A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set, so a confirmation that carries no override leaves the claim in the review queue and its pages marked review_required" · p 0.91 · active · 2 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "A human supports observation lands as a support_update and never marks a claim reviewed; only a human_override transition adds the claim to the engine's reviewed set."
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "Confirm and Restore file a human supports observation with the claim's current text plus an override to status active, so the engine lands the override and closes the review while the numbers stay untouched;"
- `clm_e64947bbb8f2` — "The engine's --root flag is global and precedes the verb, so the hooks run the queue as uv run scripts/llm-wiki/state.py --root <root> queue --json; the verb-first order exits 2 with unrecognized arguments" · p 0.87 · active · 2 support · 0 contradict
  - `src_e261dc10ac79` llm-wiki Phase 5 automation build — what the session asked, found, and decided: "The engine's --root flag is global and precedes the verb, so the hooks run the queue as `uv run scripts/llm_wiki_state.py --root <root> queue --json`; the verb-first order the plan wrote exits 2 with unrecognized arguments."
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The claim recorded under `llm-wiki.engine.root-flag` still quotes the engine at its old path"
- `clm_877c740dd0fb` — "Reading and believing are separate roles: the LLM is a semantic sensor that reads messy human material and emits structured observations, while a deterministic belief updater decides whether an observation creates, supports, contradicts or supersedes a claim and how much confidence changes — the LLM never decides truth" · p 0.82 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "The LLM does not decide truth. It outputs a noisy observation. The updater decides how belief changes."
- `clm_2c4f52e16820` — "Belief moves in log-odds rather than probability: an observation's strength is its confidence times source authority times a recency weight, that strength's logit is added to the claim's prior log-odds when the observation supports and subtracted when it contradicts, and the posterior probability is the sigmoid" · p 0.82 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Probabilities saturate too easily. If several independent sources support the same claim, log-odds lets evidence accumulate more naturally."
- `clm_30151137c491` — "Every state update is append-only: a transition records its operation, the claim and observation that caused it, the probability and status before and after, a reason, the actor, and whether human review is required" · p 0.82 · active · 1 support · 0 contradict
  - `src_758247b58186` LLM Wiki v3: A State-Space Knowledge System: "Every state update is append-only."
- `clm_c0aec8aa0fdd` — "Ledger rows fold in (timestamp, run_id, file order), made causal by an engine invariant that stamps every write run strictly after the newest replayed ledger stamp — max(now, newest + 1 second) — so runs never tie inside one checkout and the run_id component only ever orders runs from two independent branches" · p 0.78 · active · 1 support · 0 contradict
  - `src_4863372048fa` Phase 6 governance build notes — the fold key, the guards, and what the loops measured: "The resolution kept the plan's key and gave the engine the invariant that makes it causal: a write run's stamp is strictly after the newest stamp on any replayed ledger row, computed as `max(now, newest + 1 second)`."
- `clm_d55e8a20db3b` — "The state layer's write lock is useful for what it records rather than only for what it excludes: the holder writes its process id, actor, verb, and start time into the lock file, so a second writer's refusal names who holds it, and a stale record left by a crashed holder is informational because the kernel released the advisory lock with the process" · p 0.76 · active · 1 support · 0 contradict
  - `src_e689bfca564a` Phase 6 coordination and reversal — the lock, the inbox, and what undo can and cannot reach: "What makes it useful in practice is not the exclusion but the record: on acquiring the lock the holder writes its own process id, actor, verb, and start time into the file, so the second writer's refusal names who is holding it instead of…"
- `clm_b6682585a170` — "The engine's six scripts live together under scripts/llm-wiki/ as common.py, state.py, render.py, graph.py, retrieve.py, and lint.py; because they run as PEP 723 uv run --script entries that reach each other through the running script's own directory on sys.path, moving them together preserves the launch model exactly and the sibling import shortens to import common" · p 0.76 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The engine's scripts run as PEP 723 `uv run --script` entries and reach each other through `import llm_wiki_common`, which resolves only because Python puts the running script's own directory on `sys.path`."
- `clm_49f55182d4b0` — "The engine's tests live under a top-level tests/llm-wiki/ rather than inside tests/harness-layer/, because the engine is a product layer and not harness tooling, with its fixtures and hook tests alongside and the shared hook fixtures lifted to tests/conftest.py so both hook directories use one copy" · p 0.76 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The engine's tests live under a top-level `tests/llm-wiki/`, with its fixtures at `tests/llm-wiki/fixtures/` and its hook tests at `tests/llm-wiki/hooks/`."
- `clm_59b41ebd88de` — "Mirroring module names into per-layer test folders collides on basenames under pytest's default prepend mode and the hyphenated directory names rule out the __init__.py fix, so the suite runs --import-mode=importlib with a pythonpath entry per directory to keep the two cross-module test imports resolving" · p 0.72 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "Mirroring module names into per-layer test folders collides on basenames: `tests/llm-wiki/test_common.py` and `tests/harness-layer/hooks/auto-format/test_common.py` cannot both be imported under pytest's default prepend mode, which…"
- `clm_cbe455eb80f8` — "The renderer embeds a script's own filename in the pages it writes, so renaming that script drifts every rendered page carrying the line and render check reports it as drift; the repair is a re-render through the renderer that owns those files, never a hand edit" · p 0.71 · active · 1 support · 0 contradict
  - `src_157432f58354` Moving the llm-wiki engine under scripts/llm-wiki and splitting its tests out of the harness layer: "The renderer embeds the graph script's own filename in the pages it writes: the `## Related` overflow line reads `graph.py neighbors <entity_id>`."

## Timeline

- 2026-08-20 new_claim `clm_a0b912ad50ca` (src_48f57237f6ef)
- 2026-08-20 new_claim `clm_877c740dd0fb` (src_758247b58186)
- 2026-08-20 new_claim `clm_2c4f52e16820` (src_758247b58186)
- 2026-08-20 new_claim `clm_30151137c491` (src_758247b58186)
- 2026-08-20 support_update `clm_a0b912ad50ca` (src_758247b58186)
- 2026-08-21 new_claim `clm_61c5c8ab49ab` (src_e261dc10ac79)
- 2026-08-21 support_update `clm_61c5c8ab49ab` (src_e261dc10ac79)
- 2026-08-21 new_claim `clm_e64947bbb8f2` (src_e261dc10ac79)
- 2026-08-22 new_claim `clm_c0aec8aa0fdd` (src_4863372048fa)
- 2026-08-22 new_claim `clm_d55e8a20db3b` (src_e689bfca564a)
- 2026-08-23 new_claim `clm_b6682585a170` (src_157432f58354)
- 2026-08-23 support_update `clm_e64947bbb8f2` (src_157432f58354)
- 2026-08-23 new_claim `clm_49f55182d4b0` (src_157432f58354)
- 2026-08-23 new_claim `clm_59b41ebd88de` (src_157432f58354)
- 2026-08-23 new_claim `clm_cbe455eb80f8` (src_157432f58354)

## Related

- → applies_to [[claim]] (0.98)
- → applies_to [[state-layer]] (0.93)
- ← uses [[hooks]] (0.91)
- → owns [[claim]] (0.79)
- → uses [[observation]] (0.79)
- → produces [[transition-ledger]] (0.79)
- → uses [[transition-ledger]] (0.79)
- → part_of [[llm-wiki]] (0.76)
- → produces [[rendered-page]] (0.75)
- [[claim]] — 5 shared claims
- [[state-layer]] — 5 shared claims
- [[llm-wiki]] — 4 shared claims
- [[confidence-scoring]] — 2 shared claims
- [[hooks]] — 2 shared claims
- [[observation]] — 2 shared claims
- [[transition-ledger]] — 2 shared claims
- [[evidence-span]] — 1 shared claim
- [[rendered-page]] — 1 shared claim
- [[supersession]] — 1 shared claim
