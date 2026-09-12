---
source: https://gist.githubusercontent.com/HousamKak/ba96124547d1b7c68d270c293106fe53/raw/ef4b0bc0fe68259244792654efec2e140f428f26/llm-wiki.md
fetched: 2026-08-18
author: HousamKak
---
> **In here:** state-space model for an LLM-maintained wiki (observations, belief updates, evidence lineage) · builds on Karpathy's LLM Wiki v1 and Rohit G.'s v2 (memory lifecycle, governance) · full v3 architecture spec including graph structure, retrieval, crystallization, and rendered pages

# LLM Wiki v3: A State-Space Knowledge System

**Status:** Draft architecture specification  
**Version:** 0.1  
**Purpose:** Extend the LLM Wiki pattern from a persistent markdown wiki into a state-space knowledge system with observations, belief updates, evidence lineage, graph structure, and rendered wiki pages.

---

## 0. Executive Summary

LLM Wiki v1 introduced the core pattern:

> Do not make the LLM re-derive knowledge from raw chunks on every query. Instead, let the LLM incrementally maintain a persistent, interlinked markdown wiki compiled from raw sources.

LLM Wiki v2 extended that pattern with production concerns:

- confidence scoring
- supersession
- forgetting and decay
- consolidation tiers
- typed knowledge graphs
- hybrid retrieval
- automation hooks
- quality controls
- governance and audit trails
- crystallization of useful sessions back into the wiki

LLM Wiki v3 adds a stronger theoretical and implementation layer:

> Treat the wiki as a rendered view of a probabilistic state-space knowledge system.

In v3, raw sources are not directly summarized into permanent truth. Instead:

```text
raw source
  -> LLM extracts structured observations
  -> state updater modifies belief state
  -> graph/index/retrieval layers are updated
  -> markdown wiki pages are rendered from the current state
```

The core slogan:

> **The LLM observes. The state updates. The wiki renders.**

---

## 1. Why v3 Exists

### 1.1 The weakness of classic RAG

Classic RAG usually works like this:

```text
source documents -> chunks -> embeddings -> query-time retrieval -> answer
```

This is useful, but it has a limitation: every query is a new reconstruction effort. Knowledge does not necessarily compound. The system finds relevant fragments again and again.

### 1.2 The improvement of LLM Wiki v1

LLM Wiki v1 changes the pattern:

```text
source documents -> LLM-maintained wiki -> query over compiled knowledge
```

Instead of treating raw documents as passive storage, the LLM actively builds and maintains markdown pages, cross-references, summaries, contradictions, and topic pages.

This creates compounding value.

### 1.3 The improvement of LLM Wiki v2

LLM Wiki v2 observes that a wiki can rot unless knowledge has lifecycle mechanics.

It introduces the need for:

- confidence scores
- old/new claim handling
- source authority
- contradiction management
- forgetting curves
- consolidation tiers
- graph traversal
- hybrid retrieval
- automated ingest/lint/crystallization
- privacy and governance

### 1.4 The missing layer

v2 introduces many correct concepts, but many are described as features rather than as a formal update process.

Questions remain:

- How exactly does a claim become more confident?
- How does a newer source weaken an older source?
- How do repeated observations become stable knowledge?
- How does a contradiction become a supersession instead of noise?
- How do we prevent the markdown page from becoming an unsupported truth source?
- How do we preserve the difference between raw evidence, LLM interpretation, and current belief?

LLM Wiki v3 answers this by introducing a **state-space model**.

---

## 2. Core Thesis

The markdown wiki should not be the primary source of truth.

The source of truth should be:

```text
raw immutable evidence
+ structured LLM observations
+ probabilistic belief state
+ transition history
+ graph relationships
```

The wiki pages are human-readable renderings of that state.

This distinction matters because summaries can distort. If a summary becomes the only thing future agents read, errors can compound silently. In v3, all important claims remain traceable to raw evidence and transition history.

---

## 3. System Model

### 3.1 State-space formulation

Define:

```text
x_t = knowledge state at time t
z_t = observation extracted from a new source or session
u_t = context, domain schema, user goal, governance policy
x_{t+1} = Update(x_t, z_t, u_t)
y_t = rendered outputs: wiki pages, answers, graphs, reports
```

In plain language:

```text
current knowledge
+ interpreted evidence
+ domain rules
= updated knowledge
```

The document/wiki evolves over time.

### 3.2 Role separation

The LLM is a **semantic sensor**.

It reads messy human material and extracts structured observations:

```json
{
  "claim_key": "project.auth.uses_firebase",
  "claim_text": "The project uses Firebase Admin SDK for authentication.",
  "stance": "supports",
  "confidence": 0.83,
  "entities": ["Project", "Firebase Admin SDK", "authentication"],
  "relationships": [
    {
      "subject": "Project",
      "predicate": "uses",
      "object": "Firebase Admin SDK",
      "qualifier": "for authentication"
    }
  ],
  "evidence_span": "Authentication is handled through Firebase Admin SDK...",
  "source_id": "src_001"
}
```

The state engine is the **belief updater**.

It decides:

- whether this is a new claim
- whether it supports an existing claim
- whether it contradicts an existing claim
- whether it supersedes an existing claim
- how much confidence should change
- what evidence should be attached
- what graph edges should be created
- what pages should be regenerated

The wiki is the **interface**.

It is where humans read, navigate, ask questions, and review knowledge.

---

## 4. Design Principles

### 4.1 Raw evidence is immutable

Never edit raw sources. Store them as received.

Examples:

```text
raw/articles/
raw/papers/
raw/chats/
raw/code_sessions/
raw/meeting_notes/
raw/screenshots/
```

Each source receives a stable ID.

### 4.2 Observations are not truth

An observation is what the LLM believes a source says.

It may be wrong.

Therefore, observations must include:

- source ID
- evidence span
- confidence
- extraction model/version
- timestamp
- claim key
- stance
- entities
- relationships

### 4.3 Beliefs are estimated, not written

The current knowledge state is an estimate over claims.

A claim can be:

- active
- uncertain
- disputed
- superseded
- stale
- archived
- rejected

### 4.4 The wiki is a rendered view

Markdown pages should be generated or updated from the belief state.

A page can include prose, but each load-bearing claim should be backed by evidence metadata.

### 4.5 Contradiction is useful signal

Contradictions should not be hidden.

They should trigger one of these outcomes:

- unresolved dispute
- newer source supersedes older source
- scope split
- exception added
- old claim weakened
- human review required

### 4.6 Knowledge has lifecycle

Not all knowledge should last equally long.

A temporary bug should decay quickly.
An architecture decision should decay slowly.
A repeated workflow pattern should strengthen over time.

### 4.7 Hybrid retrieval is mandatory after scale

Use multiple retrieval streams:

- BM25 for exact names and terms
- vector search for semantic similarity
- graph traversal for structural dependencies
- state search for claims, entities, confidence, and evidence

Fuse results using a ranking method such as reciprocal rank fusion.

### 4.8 Human structure beats random generation

The system should not let the LLM invent the whole ontology freely.

The human or project owner defines stable types:

- entity types
- relationship types
- page types
- claim categories
- confidence rules
- governance rules
- private/shared scopes

The LLM enriches within that schema.

---

## 5. Directory Structure

A practical v3 repository could look like this:

```text
llm-wiki-v3/
│
├── AGENTS.md
├── README.md
├── index.md
│
├── raw/
│   ├── articles/
│   ├── papers/
│   ├── conversations/
│   ├── meetings/
│   ├── code_sessions/
│   ├── screenshots/
│   └── assets/
│
├── observations/
│   ├── pending/
│   ├── accepted/
│   ├── rejected/
│   └── archived/
│
├── state/
│   ├── claims.jsonl
│   ├── entities.jsonl
│   ├── relationships.jsonl
│   ├── unresolved_conflicts.jsonl
│   └── state_snapshot.json
│
├── transitions/
│   ├── transitions.jsonl
│   └── audit_log.jsonl
│
├── graph/
│   ├── nodes.jsonl
│   ├── edges.jsonl
│   └── graph_snapshot.json
│
├── wiki/
│   ├── concepts/
│   ├── projects/
│   ├── people/
│   ├── decisions/
│   ├── systems/
│   ├── workflows/
│   └── questions/
│
├── retrieval/
│   ├── bm25_index/
│   ├── vector_index/
│   ├── graph_index/
│   └── fusion_config.json
│
├── evals/
│   ├── qa_tests.md
│   ├── contradiction_tests.md
│   ├── retrieval_tests.md
│   └── regression_cases.jsonl
│
└── exports/
    ├── briefs/
    ├── slides/
    ├── tables/
    └── datasets/
```

---

## 6. Core Data Models

### 6.1 Source

```json
{
  "source_id": "src_20260424_001",
  "type": "architecture_decision_record",
  "path": "raw/meetings/2026-04-24-retrieval-decision.md",
  "title": "Retrieval Store Decision",
  "created_at": "2026-04-24T09:00:00Z",
  "ingested_at": "2026-04-24T10:15:00Z",
  "author": "Unknown",
  "source_authority": 0.85,
  "scope": "shared",
  "sensitivity": "internal",
  "hash": "sha256:..."
}
```

Important fields:

- `source_authority`: how trusted the source type is
- `scope`: private/shared/team/project
- `sensitivity`: public/internal/private/secret
- `hash`: proves immutability

### 6.2 Observation

```json
{
  "observation_id": "obs_001",
  "source_id": "src_20260424_001",
  "extracted_at": "2026-04-24T10:20:00Z",
  "extractor": {
    "model": "gpt-5.5-thinking",
    "prompt_version": "extract_claims_v1"
  },
  "claim_key": "retrieval.primary_store",
  "claim_text": "Cosmos DB is the primary retrieval store.",
  "stance": "supports",
  "confidence": 0.86,
  "evidence_span": "Cosmos DB will serve as the primary retrieval store...",
  "entities": ["Cosmos DB", "retrieval store"],
  "relationships": [
    {
      "subject": "Cosmos DB",
      "predicate": "serves_as",
      "object": "primary retrieval store"
    }
  ],
  "conditions": ["current architecture"],
  "valid_from": "2026-04-24",
  "valid_until": null,
  "privacy": "internal"
}
```

### 6.3 Claim State

```json
{
  "claim_id": "claim_001",
  "claim_key": "retrieval.primary_store",
  "current_text": "Cosmos DB is the primary retrieval store.",
  "probability": 0.87,
  "status": "active",
  "scope": "shared",
  "supporting_observations": ["obs_001", "obs_004"],
  "contradicting_observations": [],
  "supersedes": [],
  "superseded_by": null,
  "last_confirmed_at": "2026-04-24T10:20:00Z",
  "decay_profile": "architecture_decision",
  "source_authority_weight": 0.85,
  "needs_review": false
}
```

### 6.4 Entity

```json
{
  "entity_id": "ent_cosmos_db",
  "name": "Cosmos DB",
  "type": "technology",
  "aliases": ["Azure Cosmos DB"],
  "attributes": {
    "vendor": "Microsoft Azure",
    "category": "database"
  },
  "confidence": 0.96,
  "source_observations": ["obs_001"]
}
```

### 6.5 Relationship

```json
{
  "relationship_id": "rel_001",
  "subject_entity": "ent_cosmos_db",
  "predicate": "serves_as",
  "object_entity": "ent_retrieval_store",
  "qualifiers": {
    "role": "primary",
    "system": "RAG pipeline"
  },
  "probability": 0.87,
  "supporting_observations": ["obs_001"],
  "contradicting_observations": [],
  "status": "active"
}
```

### 6.6 Transition

Every state update is append-only.

```json
{
  "transition_id": "tr_001",
  "timestamp": "2026-04-24T10:21:00Z",
  "operation": "support_update",
  "claim_id": "claim_001",
  "observation_id": "obs_001",
  "before": {
    "probability": 0.50,
    "status": "unknown"
  },
  "after": {
    "probability": 0.87,
    "status": "active"
  },
  "reason": "High-confidence observation from medium-high-authority architecture decision source.",
  "actor": "state_updater",
  "review_required": false
}
```

---

## 7. Bayesian Update Layer

### 7.1 Basic idea

For a claim/hypothesis `H` and an observation `O`:

```text
P(H | O) = P(O | H) P(H) / [P(O | H) P(H) + P(O | not H) P(not H)]
```

In this system:

```text
H = claim is true
O = LLM observation from a source
```

The LLM does not decide truth. It outputs a noisy observation.

The updater decides how belief changes.

### 7.2 Practical simplified update

A production system may not need full Bayesian modeling immediately. It can approximate with weighted evidence.

Inputs:

```text
prior_probability
llm_confidence
source_authority
source_recency
stance
claim_decay
number_of_supporting_sources
number_of_contradicting_sources
```

Example support update:

```text
observation_strength = llm_confidence * source_authority * recency_weight
posterior_log_odds = prior_log_odds + logit(observation_strength)
posterior_probability = sigmoid(posterior_log_odds)
```

Example contradiction update:

```text
contradiction_strength = llm_confidence * source_authority * recency_weight
posterior_log_odds = prior_log_odds - logit(contradiction_strength)
posterior_probability = sigmoid(posterior_log_odds)
```

### 7.3 Why log-odds helps

Probabilities saturate too easily.

If several independent sources support the same claim, log-odds lets evidence accumulate more naturally.

```text
odds = p / (1 - p)
log_odds = log(odds)
```

Then:

```text
new_log_odds = old_log_odds + evidence_weight
```

Finally:

```text
p = 1 / (1 + exp(-log_odds))
```

### 7.4 Confidence is not one thing

Use multiple confidence dimensions:

```json
{
  "semantic_confidence": 0.86,
  "source_authority": 0.85,
  "extraction_quality": 0.90,
  "recency_weight": 0.95,
  "agreement_score": 0.80,
  "final_observation_weight": 0.50
}
```

This avoids pretending that one float captures everything.

---

## 8. State Transitions

### 8.1 Main transition types

```text
new_claim
support_update
contradiction_update
scope_split
exception_addition
supersession
decay_update
promotion
archival
rejection
human_override
```

### 8.2 New claim

When no existing claim matches:

```text
unknown -> candidate claim
```

Rules:

- create claim with initial probability
- attach evidence
- mark as candidate if low confidence
- create entity/relationship candidates if needed

### 8.3 Support update

When an observation supports an existing claim:

```text
active claim -> stronger active claim
```

Rules:

- increase probability
- add supporting observation
- update `last_confirmed_at`
- possibly promote from candidate to active

### 8.4 Contradiction update

When an observation contradicts a claim:

```text
active claim -> disputed claim
```

Rules:

- add contradicting observation
- reduce probability
- create unresolved conflict if probability remains ambiguous
- ask whether this is true contradiction, scope split, or supersession

### 8.5 Scope split

Sometimes two claims look contradictory but apply under different conditions.

Example:

```text
General rule: Refunds are not allowed after activation.
Exception: Premium customers may receive prorated refunds after activation.
```

The updater should produce:

```text
claim A: no refund after activation for general customers
claim B: prorated refund after activation for premium customers
```

This is better than treating the claims as mutually exclusive.

### 8.6 Exception addition

When a new observation creates an exception:

```text
general rule + exception -> richer rule state
```

Example:

```json
{
  "rule": "Fees are non-refundable after activation.",
  "exceptions": [
    {
      "condition": "premium customer",
      "effect": "prorated refund may be available",
      "evidence": "obs_005"
    }
  ]
}
```

### 8.7 Supersession

When a newer authoritative source replaces an older claim:

```text
old active claim -> superseded
new claim -> active
```

Rules:

- preserve the old claim
- mark old claim as superseded
- link old and new claim
- lower old claim probability for current validity
- keep old claim historically accessible

### 8.8 Decay update

Over time, claims lose strength unless reinforced.

```text
p_t = decay(p_0, time_elapsed, decay_profile)
```

Suggested decay profiles:

```text
architecture_decision: slow decay
project_status: medium decay
bug_report: fast decay
user_preference: slow-medium decay
meeting_note: medium decay
implementation_detail: medium-fast decay
external_fact: depends on domain
```

### 8.9 Promotion

Raw observations can become stronger memory tiers.

```text
observation -> episodic summary -> semantic claim -> procedural pattern
```

Promotion requires:

- multiple sources or repeated use
- high confidence
- low contradiction
- usefulness in queries
- stable entity/relationship mapping

### 8.10 Archival

Old claims are not always deleted.

They can move to archive when:

- confidence decays below threshold
- superseded by a newer claim
- not accessed or reinforced for a long time
- marked obsolete by human or policy

---

## 9. Memory Tiers

LLM Wiki v3 uses consolidation tiers.

### 9.1 Working memory

Short-term observations from recent sessions.

Examples:

- current debugging notes
- current research findings
- raw extracted observations
- unresolved questions

Lifetime: hours to days.

### 9.2 Episodic memory

Compressed summaries of specific sessions or events.

Examples:

- “Debugging session on auth token expiration”
- “Conversation about state-space RAG”
- “Meeting notes on infrastructure decision”

Lifetime: days to months.

### 9.3 Semantic memory

Cross-session stable facts.

Examples:

- “The app uses Firebase UID as identity key.”
- “Cosmos DB is the primary retrieval store.”
- “Refund rules have a 14-day exception before first use.”

Lifetime: months to years, depending on decay profile.

### 9.4 Procedural memory

Repeated workflows and patterns.

Examples:

- “When reviewing a backend PR, check DTOs, auth guards, Prisma migrations, and integration tests.”
- “For LLM Wiki ingestion, first extract claims, then update state, then render pages.”

Lifetime: long-term, but still versioned.

---

## 10. Retrieval Model

### 10.1 Query flow

```text
user query
  -> classify query intent
  -> identify entities/claim keys
  -> retrieve from BM25
  -> retrieve from vector index
  -> traverse graph
  -> search state claims
  -> fuse results
  -> reconstruct relevant state slice
  -> answer with evidence
```

### 10.2 Retrieval streams

#### BM25

Best for:

- exact terms
- names
- filenames
- acronyms
- error messages
- function names

#### Vector search

Best for:

- semantic similarity
- paraphrases
- conceptual questions
- fuzzy exploration

#### Graph traversal

Best for:

- dependencies
- impact analysis
- “what is connected to X?”
- causal chains
- ownership and responsibility

#### State search

Best for:

- claims by confidence
- contradictions
- superseded facts
- source-supported statements
- current vs historical truth

### 10.3 Fusion

Use reciprocal rank fusion:

```text
RRF_score(d) = sum over rankings [1 / (k + rank_i(d))]
```

Suggested `k`: 60.

Then rerank using:

- source authority
- claim probability
- recency
- graph distance
- query intent match
- page quality score

---

## 11. Wiki Rendering

### 11.1 Principle

Markdown pages should be generated from the current belief state, not treated as unmanaged truth.

### 11.2 Page frontmatter

Example page:

```md
---
title: Cosmos DB Retrieval Store
type: decision
entity_ids:
  - ent_cosmos_db
claim_ids:
  - claim_001
confidence: 0.87
status: active
last_rendered: 2026-04-24T11:00:00Z
sources:
  - src_20260424_001
review_required: false
---

# Cosmos DB Retrieval Store

## Current Understanding

Cosmos DB is currently believed to be the primary retrieval store.

Confidence: 0.87

## Evidence

- `src_20260424_001`: Architecture decision record mentioning Cosmos DB as the primary retrieval store.

## Related

- [[Retrieval Architecture]]
- [[Azure AI Search]]
- [[Hybrid Search]]
```

### 11.3 Page sections

Recommended sections:

```text
Current Understanding
Evidence
Open Questions
Contradictions
Superseded Claims
Related Entities
Timeline
```

### 11.4 Never hide uncertainty

Bad:

```md
Cosmos DB is the retrieval store.
```

Better:

```md
Current belief: Cosmos DB is the primary retrieval store.
Confidence: 0.87.
Supported by: ADR-004 and meeting notes from 2026-04-24.
No current contradictions.
```

---

## 12. Main Operations

### 12.1 Ingest

Purpose: turn a raw source into observations and state updates.

```text
1. Register source
2. Sanitize sensitive data
3. Segment source into meaningful units
4. Extract observations with LLM
5. Validate observations against schema
6. Match observations to existing claims/entities
7. Apply state transitions
8. Update graph
9. Update retrieval indexes
10. Render affected wiki pages
11. Log audit trail
```

### 12.2 Query

Purpose: answer using the current knowledge state.

```text
1. Parse user query
2. Determine intent
3. Identify candidate entities and claim keys
4. Retrieve relevant pages, claims, observations, and sources
5. Reconstruct state slice
6. Generate answer with confidence and evidence
7. Decide whether the answer should be crystallized
```

### 12.3 Lint

Purpose: keep the wiki healthy.

Checks:

- orphan pages
- broken links
- claims without evidence
- stale claims
- duplicate entities
- unresolved contradictions
- pages not matching state
- low-quality summaries
- private data leakage
- outdated rendered pages

### 12.4 Crystallize

Purpose: turn useful exploratory work into durable knowledge.

```text
conversation/session
  -> summary
  -> observations
  -> claim updates
  -> new/updated wiki pages
```

A debugging session, research thread, or architecture conversation becomes a source.

### 12.5 Decay

Purpose: reduce the prominence of stale knowledge.

```text
for each claim:
    compute time since last confirmation
    apply decay profile
    lower retrieval priority if stale
    mark for review if below threshold
```

### 12.6 Review

Purpose: allow human override.

Humans can:

- approve claim
- reject claim
- mark claim as obsolete
- merge duplicate entities
- resolve contradiction
- change source authority
- change schema
- restore archived claim

---

## 13. LLM Prompting Contracts

### 13.1 Extraction prompt contract

The LLM must output structured observations, not freeform summary.

Required output:

```json
{
  "source_id": "...",
  "observations": [
    {
      "claim_key": "...",
      "claim_text": "...",
      "stance": "supports | contradicts | supersedes | modifies | creates_exception | defines | new_claim",
      "confidence": 0.0,
      "evidence_span": "...",
      "entities": [],
      "relationships": [],
      "conditions": [],
      "privacy": "public | internal | private | secret",
      "valid_from": null,
      "valid_until": null
    }
  ]
}
```

### 13.2 Matching prompt contract

The LLM may help decide whether a new observation maps to an existing claim.

It must output:

```json
{
  "observation_id": "obs_001",
  "candidate_matches": [
    {
      "claim_id": "claim_001",
      "match_type": "same_claim | related | contradiction | supersession | scope_split | no_match",
      "confidence": 0.82,
      "reason": "..."
    }
  ]
}
```

### 13.3 Rendering prompt contract

The LLM may write page prose, but only from provided state/evidence.

It must not invent new facts.

Required sections:

```text
Current Understanding
Confidence
Evidence
Contradictions or Caveats
Related Pages
Open Questions
```

---

## 14. AGENTS.md Template

```md
# AGENTS.md

You are maintaining an LLM Wiki v3 knowledge system.

## Prime Directive

Do not treat markdown pages as ultimate truth. The source of truth is raw evidence, observations, claim state, transition logs, and graph relationships. Markdown pages are rendered views.

## Source Rules

- Never edit files in `raw/`.
- Every ingested source must receive a `source_id`.
- Sensitive data must be filtered before observations are accepted.
- Every observation must include an evidence span.

## Observation Rules

When reading a source, extract structured observations:

- claim_key
- claim_text
- stance
- confidence
- evidence_span
- entities
- relationships
- conditions
- source_id

Do not write broad summaries without extracting claims.

## State Update Rules

For every observation, decide whether it:

- creates a new claim
- supports an existing claim
- contradicts an existing claim
- supersedes an older claim
- adds an exception
- splits scope
- defines an entity or term

Every update must create a transition log entry.

## Wiki Rendering Rules

Wiki pages must be rendered from current state.

Each page should include:

- current understanding
- confidence
- evidence
- contradictions/caveats
- related pages
- open questions

Do not present low-confidence claims as settled truth.

## Retrieval Rules

Use hybrid retrieval:

- BM25 for exact terms
- vector search for semantic similarity
- graph traversal for dependencies
- state search for claims and confidence

Fuse results and reconstruct the relevant state slice before answering.

## Governance Rules

- Audit every ingest, update, delete, merge, and render.
- Keep private and shared knowledge separate.
- Mark unresolved contradictions for review.
- Preserve superseded claims historically.
```

---

## 15. End-to-End Example

### 15.1 Raw document chunks

```text
Chunk 1:
The customer may cancel their subscription at any time.

Chunk 2:
If cancellation occurs after service activation, fees already paid are non-refundable.

Chunk 3:
Customers are eligible for a full refund if they cancel within 14 days of purchase and before first use.

Chunk 4:
Enterprise customers must provide 30 days written notice before cancellation.
```

### 15.2 LLM observations

```json
[
  {
    "claim_key": "subscription.cancellation.allowed",
    "claim_text": "Customers may cancel their subscription at any time.",
    "stance": "supports",
    "confidence": 0.90,
    "conditions": ["at any time"],
    "source_id": "src_contract_001",
    "evidence_span": "The customer may cancel their subscription at any time."
  },
  {
    "claim_key": "subscription.refund.denied_after_activation",
    "claim_text": "Fees already paid are non-refundable after service activation.",
    "stance": "supports",
    "confidence": 0.88,
    "conditions": ["after service activation"],
    "source_id": "src_contract_001",
    "evidence_span": "If cancellation occurs after service activation, fees already paid are non-refundable."
  },
  {
    "claim_key": "subscription.refund.full_before_first_use_14_days",
    "claim_text": "Customers are eligible for a full refund if they cancel within 14 days of purchase and before first use.",
    "stance": "creates_exception",
    "confidence": 0.92,
    "conditions": ["within 14 days of purchase", "before first use"],
    "source_id": "src_contract_001",
    "evidence_span": "Customers are eligible for a full refund if they cancel within 14 days of purchase and before first use."
  },
  {
    "claim_key": "subscription.enterprise.notice_required",
    "claim_text": "Enterprise customers must provide 30 days written notice before cancellation.",
    "stance": "supports",
    "confidence": 0.93,
    "conditions": ["enterprise customers", "before cancellation"],
    "source_id": "src_contract_001",
    "evidence_span": "Enterprise customers must provide 30 days written notice before cancellation."
  }
]
```

### 15.3 Claim state after update

```json
{
  "subscription.cancellation.allowed": {
    "probability": 0.90,
    "status": "active",
    "conditions": ["at any time"],
    "supporting_observations": ["obs_001"]
  },
  "subscription.refund.denied_after_activation": {
    "probability": 0.88,
    "status": "active",
    "conditions": ["after service activation"],
    "supporting_observations": ["obs_002"]
  },
  "subscription.refund.full_before_first_use_14_days": {
    "probability": 0.92,
    "status": "active_exception",
    "conditions": ["within 14 days of purchase", "before first use"],
    "supporting_observations": ["obs_003"]
  },
  "subscription.enterprise.notice_required": {
    "probability": 0.93,
    "status": "active",
    "conditions": ["enterprise customers", "30 days written notice"],
    "supporting_observations": ["obs_004"]
  }
}
```

### 15.4 Rendered wiki page

```md
# Subscription Cancellation and Refunds

## Current Understanding

Customers may cancel their subscription at any time. Confidence: 0.90.

Refunds depend on service state and timing:

- If cancellation occurs after service activation, already-paid fees are non-refundable. Confidence: 0.88.
- Exception: customers may receive a full refund if they cancel within 14 days of purchase and before first use. Confidence: 0.92.

Enterprise customers must provide 30 days written notice before cancellation. Confidence: 0.93.

## Evidence

- Contract chunk 1: cancellation allowed at any time.
- Contract chunk 2: non-refundable after service activation.
- Contract chunk 3: 14-day before-first-use refund exception.
- Contract chunk 4: enterprise notice requirement.

## Open Questions

- Does “first use” mean first login, first paid feature usage, or first service activation?
```

### 15.5 Query answer

Question:

```text
Can I cancel early and get a refund?
```

State reconstruction:

```text
Relevant claims:
- cancellation allowed
- refund denied after activation
- refund exception within 14 days before first use
- enterprise notice requirement
```

Answer:

```text
Yes, cancellation appears to be allowed. Refund eligibility depends on conditions. If the service has already been activated, already-paid fees are likely non-refundable. However, a full refund appears available if cancellation happens within 14 days of purchase and before first use. If the customer is enterprise, 30 days written notice is required.
```

This answer comes from the state, not from a single nearest chunk.

---

## 16. Contradiction and Supersession Example

### 16.1 Existing claim

```json
{
  "claim_key": "retrieval.primary_store",
  "current_text": "Cosmos DB is the primary retrieval store.",
  "probability": 0.89,
  "status": "active"
}
```

### 16.2 New source

```text
Decision: Replace Cosmos DB retrieval with Azure AI Search as the primary retrieval layer.
```

### 16.3 LLM observation

```json
{
  "claim_key": "retrieval.primary_store",
  "claim_text": "Azure AI Search is now the primary retrieval layer.",
  "stance": "supersedes",
  "supersedes_claim_key": "retrieval.primary_store:Cosmos DB",
  "confidence": 0.92,
  "source_authority": 0.98,
  "evidence_span": "Decision: Replace Cosmos DB retrieval with Azure AI Search as the primary retrieval layer."
}
```

### 16.4 State transition

```json
{
  "operation": "supersession",
  "old_claim": {
    "text": "Cosmos DB is the primary retrieval store.",
    "before_probability": 0.89,
    "after_probability": 0.25,
    "status": "superseded"
  },
  "new_claim": {
    "text": "Azure AI Search is now the primary retrieval layer.",
    "probability": 0.92,
    "status": "active"
  }
}
```

### 16.5 Rendered page

```md
# Retrieval Store

## Current Understanding

Azure AI Search is currently the primary retrieval layer. Confidence: 0.92.

## Previous Approach

Cosmos DB was previously used as the primary retrieval store, but this claim has been superseded by the newer architecture decision.

## Timeline

- 2026-04-20: Cosmos DB selected as primary retrieval store.
- 2026-04-24: Azure AI Search superseded Cosmos DB as primary retrieval layer.
```

---

## 17. Evaluation

A v3 system needs evals. Without evals, it becomes a vibes-based memory system.

### 17.1 Retrieval evals

Metrics:

- MRR
- Recall@k
- NDCG
- answer support coverage
- graph path correctness

Test questions:

```text
What currently powers retrieval?
What used to power retrieval?
Which source superseded the old retrieval design?
What are the unresolved questions about retrieval?
```

### 17.2 State update evals

Test whether the updater correctly handles:

- support
- contradiction
- supersession
- scope split
- exception
- duplicate claim
- stale claim
- low-authority claim

### 17.3 Faithfulness evals

Check whether rendered pages make claims not supported by state/evidence.

### 17.4 Governance evals

Check whether:

- private data leaks into shared pages
- audit logs are complete
- deleted/merged claims are reversible
- source provenance exists

### 17.5 Regression cases

Every failure becomes a test case.

Example:

```json
{
  "case_id": "regression_001",
  "input": "New source says premium customers may get refunds after activation.",
  "expected_transition": "exception_addition",
  "not_expected": "contradiction_update"
}
```

---

## 18. Implementation Roadmap

### Phase 0: Minimal v1-style wiki

Build:

- `raw/`
- `wiki/`
- `index.md`
- `AGENTS.md`
- ingest/query/lint prompts

Goal:

```text
Stop re-deriving. Start compiling.
```

### Phase 1: Observations and claim state

Build:

- observations JSONL
- claims JSONL
- basic state updater
- evidence spans
- page rendering from claims

Goal:

```text
Separate source, observation, belief, and rendered page.
```

### Phase 2: Confidence and transitions

Build:

- support/contradiction/supersession transitions
- transition log
- confidence scores
- source authority
- recency weighting

Goal:

```text
Knowledge changes through auditable transitions.
```

### Phase 3: Graph layer

Build:

- entities
- typed relationships
- graph traversal
- impact queries

Goal:

```text
Move beyond flat pages into structured navigation.
```

### Phase 4: Hybrid retrieval

Build:

- BM25 index
- vector index
- graph retrieval
- state search
- RRF fusion

Goal:

```text
Scale beyond small index files.
```

### Phase 5: Automation

Build:

- auto-ingest hooks
- scheduled lint
- session crystallization
- decay jobs
- stale claim review

Goal:

```text
Reduce bookkeeping burden.
```

### Phase 6: Governance and collaboration

Build:

- private/shared scopes
- audit trail
- reversible bulk operations
- multi-agent write coordination
- access control

Goal:

```text
Make it safe for serious work.
```

---

## 19. MVP Technical Stack

### Simple local stack

```text
Markdown files
JSONL state files
SQLite
Python scripts
ripgrep
SQLite FTS5 or Tantivy
local embeddings or API embeddings
Obsidian for viewing
Git for versioning
```

### More serious stack

```text
PostgreSQL
pgvector
Elasticsearch/OpenSearch or Tantivy
Graph database or relational graph tables
Object storage for raw files
Queue for ingestion jobs
Background worker for decay/lint
API service for query and update
```

### Agent tooling

Any capable coding/research agent can operate the repo if `AGENTS.md` is clear:

- Codex
- Claude Code
- Cursor agent
- custom local agent
- CI worker

---

## 20. Pseudocode

### 20.1 Ingest source

```python
def ingest_source(path: str):
    source = register_source(path)
    sanitized = sanitize_source(source)
    segments = segment_source(sanitized)

    all_observations = []
    for segment in segments:
        observations = llm_extract_observations(segment, schema=AGENTS_MD)
        validated = validate_observations(observations)
        all_observations.extend(validated)

    for observation in all_observations:
        match = match_observation_to_state(observation)
        transition = compute_transition(match, observation)
        apply_transition(transition)
        append_transition_log(transition)

    update_graph(all_observations)
    update_retrieval_indexes()
    render_affected_pages(all_observations)
    audit("ingest", source.source_id)
```

### 20.2 Update claim

```python
def update_claim(claim, observation):
    if observation.stance == "supports":
        return support_update(claim, observation)

    if observation.stance == "contradicts":
        if is_scope_split(claim, observation):
            return scope_split(claim, observation)
        return contradiction_update(claim, observation)

    if observation.stance == "supersedes":
        return supersession_update(claim, observation)

    if observation.stance == "creates_exception":
        return exception_update(claim, observation)

    if observation.stance == "new_claim":
        return create_claim(observation)
```

### 20.3 Query

```python
def answer_query(query: str):
    intent = classify_query(query)
    entities = extract_query_entities(query)
    claim_keys = infer_claim_keys(query, entities)

    bm25_results = bm25_search(query)
    vector_results = vector_search(query)
    graph_results = graph_traverse(entities, intent)
    state_results = state_search(claim_keys, entities, intent)

    fused = reciprocal_rank_fusion([
        bm25_results,
        vector_results,
        graph_results,
        state_results,
    ])

    state_slice = reconstruct_state_slice(fused)
    answer = llm_answer_from_state(query, state_slice)

    maybe_crystallize(query, answer, state_slice)
    return answer
```

---

## 21. Risks and Failure Modes

### 21.1 LLM extraction errors

The LLM may extract a claim incorrectly.

Mitigation:

- evidence spans
- validation prompts
- second-pass review
- human review for high-impact claims
- regression tests

### 21.2 False confidence

A probability can look scientific even if based on weak assumptions.

Mitigation:

- separate confidence dimensions
- expose evidence counts
- show uncertainty
- avoid over-precise claims

### 21.3 Summary drift

Rendered pages may slowly drift from sources.

Mitigation:

- render from state
- cite evidence IDs
- lint pages against claim state
- never treat page prose as primary source

### 21.4 Graph hallucination

LLM may invent relationships.

Mitigation:

- typed relationship schema
- require evidence spans
- distinguish inferred edges from explicit edges
- confidence thresholds

### 21.5 Knowledge ossification

The wiki may protect old central beliefs too strongly.

Mitigation:

- minority hypothesis retention
- contradiction pressure
- periodic challenge passes
- review central claims with new evidence

### 21.6 Privacy leakage

Private information may enter shared wiki pages.

Mitigation:

- ingest filtering
- scope tags
- access control
- audit logs
- redaction tests

---

## 22. Glossary

**Raw source**  
An immutable input document, conversation, meeting note, paper, code session, screenshot, or other evidence object.

**Observation**  
A structured claim extracted by the LLM from a source. It is a noisy semantic measurement, not truth.

**Claim**  
A unit of belief tracked by the system.

**Belief state**  
The current estimated knowledge of the wiki, including claims, probabilities, evidence, contradictions, and statuses.

**Transition**  
An auditable state update caused by an observation, decay job, or human override.

**Supersession**  
A transition where a newer claim replaces an older claim while preserving historical lineage.

**Scope split**  
A resolution where apparently contradictory claims are both true under different conditions.

**Crystallization**  
The process of turning a useful session or answer into durable observations and wiki updates.

**Rendered wiki**  
Markdown pages generated from the belief state for human reading.

**State slice**  
The subset of claims, evidence, graph edges, and pages needed to answer a query.

---

## 23. The Final Formulation

LLM Wiki v1 gave us the compounding wiki.

LLM Wiki v2 gave us memory lifecycle, structure, automation, and governance.

LLM Wiki v3 gives us the formal engine:

```text
raw evidence
  -> LLM observations
  -> probabilistic state transitions
  -> graph/index updates
  -> rendered markdown wiki
  -> query answers with evidence
  -> crystallized learning back into the system
```

The most important rule:

> Do not let the LLM merely write the wiki. Let the LLM observe evidence, let the state model update belief, and let the wiki render the current understanding.

The shortest version:

> **Knowledge is not written once. It is estimated over time.**

---

## 24. References

- Andrej Karpathy, **LLM Wiki**, GitHub Gist, 2026.  
  https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

- Rohit G., **LLM Wiki v2 — extending Karpathy's LLM Wiki pattern with lessons from building agentmemory**, GitHub Gist, 2026.  
  https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2
