#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["jsonschema>=4.23", "pyyaml>=6"]
# ///
"""The llm-wiki state engine — the only writer under llm-wiki/states/.

    register <raw-path> [--created-at YYYY-MM-DD] [--authority X --by human:<name>] [--title T]
    validate <obs.jsonl>
    apply <obs.jsonl> [--dry-run] | apply --inbox [--dry-run]
    inbox [--json]
    decay [--as-of <YYYY-MM-DDTHH:MM:SSZ>] [--dry-run] [--json]
    merge <from_entity_id> <into_entity_id> --by human:<name> --reason <text>
    unmerge <merge_id> --by human:<name> --reason <text>
    undo <run_id> --by human:<name> --reason <text>
    redo <run_id> --by human:<name> --reason <text>
    promote <private-raw-path> --by human:<name> --reason <text> [--as-internal]
    rebuild [--check]
    slice (--entity <id> | --claim-key <key> | --page <path>) [--json]
    status [--json] [--keys]
    queue [--json]
    review [--json] [--include-archived] [--limit N]
    audit [--last N | --run ID | --check] [--json]

Every verb takes --root <repo-root> (default: the working directory), --segment
{shared,private} (env LLM_WIKI_SEGMENT), and --actor ID (env LLM_WIKI_ACTOR, default
agent:unattributed). Every write verb runs as a run: the policy in
llm-wiki/governance.json gates it (exit 3 and one denied audit row when it says no), it
holds states/.lock, it stamps its run_id on every row it appends, and it records one row
in states/audit_log.jsonl. Exit codes: 0 ok, 1 error, 2 invalid input, 3 denied or locked.

Ledgers (sources, per-source observations, transitions, merges, retractions) are
append-only; claims, entities, relationships, unresolved_conflicts, and snapshot are views
folded from them, so `rebuild` reproduces them byte-for-byte. The contract is
docs/llm-wiki/state.md; record shapes are llm-wiki/schemas/*.schema.json.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict
from collections.abc import Collection
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path

import common
from jsonschema import Draft202012Validator

ACTOR = "llm-wiki-state/1.1"
# The verbs that append a ledger row, hence run under the policy, the lock, and the audit
# trail; a drift test reads this and fails when the policy's vocabulary cannot name one.
WRITE_VERBS = (
    "register",
    "apply",
    "decay",
    "merge",
    "unmerge",
    "undo",
    "redo",
    "promote",
    "rebuild",
)
BY_HUMAN_VERBS = ("merge", "unmerge", "undo", "redo", "promote")
SUPPORTING_STANCES = frozenset({"supports", "defines", "new_claim", "modifies"})
FROZEN_STATUSES = frozenset({"superseded", "rejected"})
LIGHT_CHANNELS = ("chats", "code-sessions", "screenshots")
HUMAN_RE = re.compile(r"^human:[a-z0-9-]+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIMESTAMP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


class EngineError(Exception):
    def __init__(self, message: str, code: int = 1):
        super().__init__(message)
        self.code = code


class Refused(EngineError):
    """A verb the engine refuses by name — printed as written, with no `error:` prefix."""


# --------------------------------------------------------------------------- arithmetic


def sigmoid(log_odds: float) -> float:
    return 1.0 / (1.0 + math.exp(-log_odds))


def strength(confidence: float, authority: float, recency: float) -> tuple[float, float, dict]:
    """(s, w, weights): the observation strength, its evidence weight, and the §7.4 breakdown."""
    s = min(
        max(confidence * authority * recency * common.EXTRACTION_QUALITY, 0.0),
        common.S_MAX,
    )
    w = math.log((1.0 + s) / (1.0 - s))
    weights = {
        "semantic_confidence": confidence,
        "source_authority": authority,
        "recency_weight": round(recency, 6),
        "extraction_quality": common.EXTRACTION_QUALITY,
        "observation_strength": round(s, 6),
        "evidence_weight": round(w, 6),
    }
    return s, round(w, 6), weights


def probability_of(log_odds: float) -> float:
    return round(sigmoid(log_odds), 4)


def is_human(observation: dict) -> bool:
    return observation["extractor"]["model"].startswith("human:")


def decayed_status(status: str, probability: float) -> str:
    """Where decay leaves a claim: disputed never re-statuses; the thresholds do the rest."""
    if status == "disputed":
        return status
    if probability < common.P_ARCHIVE:
        return "archived"
    if status == "active" and probability < common.P_ACTIVE:
        return "stale"
    return status


# --------------------------------------------------------------------------- schemas


class Schemas:
    def __init__(self, layout: common.Layout):
        self.layout = layout
        self._validators: dict[str, Draft202012Validator] = {}

    def validator(self, name: str) -> Draft202012Validator:
        if name not in self._validators:
            file_name = "observation" if name == "pending-observation" else name
            path = self.layout.schemas / f"{file_name}.schema.json"
            if not path.is_file():
                raise EngineError(f"schema missing: {path}")
            schema = json.loads(path.read_text(encoding="utf-8"))
            if name == "pending-observation":
                schema = dict(schema)
                schema["required"] = [
                    field_name
                    for field_name in schema["required"]
                    if field_name not in ("observation_id", "extracted_at")
                ]
            self._validators[name] = Draft202012Validator(schema)
        return self._validators[name]

    def errors(self, name: str, record: dict) -> list[str]:
        found = []
        for error in sorted(self.validator(name).iter_errors(record), key=lambda e: list(e.path)):
            where = "/".join(str(part) for part in error.path) or "<record>"
            found.append(f"{where}: {error.message}")
        return found

    def check(self, name: str, record: dict) -> None:
        problems = self.errors(name, record)
        if problems:
            raise EngineError(f"{name} record fails its schema: {'; '.join(problems)}")


# --------------------------------------------------------------------------- state


@dataclass
class State:
    segment: str = "shared"
    runs: set[str] = field(default_factory=set)
    retracted: set[str] = field(default_factory=set)
    sources: dict[str, dict] = field(default_factory=dict)
    observations: dict[str, dict] = field(default_factory=dict)
    observation_order: list[str] = field(default_factory=list)
    transitions: list[dict] = field(default_factory=list)
    merges: list[dict] = field(default_factory=list)
    canonical_of: dict[str, str] = field(default_factory=dict)
    claims: dict[str, dict] = field(default_factory=dict)
    claims_by_key: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    conflicts: dict[str, dict] = field(default_factory=dict)
    reviewed: set[str] = field(default_factory=set)

    def authority_for(self, observation: dict) -> float:
        if is_human(observation):
            return common.HUMAN_AUTHORITY
        return self.sources[observation["source_id"]]["source_authority"]

    def recency_for(self, observation: dict) -> float:
        if is_human(observation):
            return common.RECENCY_UNKNOWN
        source = self.sources[observation["source_id"]]
        return common.recency_weight(source.get("created_at"), observation["extracted_at"])

    def evidence(self, observation: dict) -> tuple[float, float, dict]:
        return strength(
            observation["confidence"],
            self.authority_for(observation),
            self.recency_for(observation),
        )

    def profile_for(self, observation: dict) -> str:
        """The observation's explicit decay profile, else its source channel's default."""
        explicit = observation.get("decay_profile")
        if explicit:
            return explicit
        return common.CHANNEL_DECAY_PROFILE[self.sources[observation["source_id"]]["channel"]]

    def resolve(self, name: str) -> str:
        entity_id = common.entity_id_for(name)
        return self.canonical_of.get(entity_id, entity_id)

    def live_claims(self, key: str) -> list[dict]:
        return [
            self.claims[cid]
            for cid in self.claims_by_key.get(key, [])
            if self.claims[cid]["status"] not in FROZEN_STATUSES
        ]

    def newest_stamp(self) -> str | None:
        stamps = (
            [s["ingested_at"] for s in self.sources.values()]
            + [o["extracted_at"] for o in self.observations.values()]
            + [t["timestamp"] for t in self.transitions]
            + [m["timestamp"] for m in self.merges]
        )
        return max(stamps) if stamps else None


def load_state(layout: common.Layout) -> State:
    """Replay the segment's ledgers into the folded state, skipping every retracted run."""
    state = State(segment=layout.segment)
    state.retracted = common.retracted_runs(layout)
    sources = common.read_source_rows(layout, state.retracted)
    state.sources = {row["source_id"]: row for row in sources}
    # An observation whose registration is retracted is orphaned along with it: the
    # archive is back in the queue, so its rows — and the transitions they drove — are
    # skipped exactly as a retracted run's are, and no reader ever trips on them.
    observations = [
        row
        for row in common.read_observations(layout, state.retracted)
        if row["source_id"] in state.sources
    ]
    for observation in observations:
        state.observations[observation["observation_id"]] = observation
        state.observation_order.append(observation["observation_id"])
    state.merges = common.read_merges(layout, state.retracted)
    state.canonical_of = common.resolve_entities(
        [state.observations[o] for o in state.observation_order], state.merges
    )
    for transition in common.read_transitions(layout, state.retracted):
        observation_id = transition.get("observation_id")
        if observation_id is not None and observation_id not in state.observations:
            continue
        fold(state, transition)
        state.transitions.append(transition)
    state.runs = {
        row["run_id"]
        for rows in (sources, observations, state.merges, state.transitions)
        for row in rows
        if row.get("run_id")
    }
    return state


def needs_review(state: State, claim: dict) -> bool:
    if claim["status"] == "disputed":
        return True
    return (
        claim["status"] == "active"
        and bool(claim["contradicting_observations"])
        and claim["claim_id"] not in state.reviewed
    )


def _merge(state: State, claim: dict, observation: dict, authority: float) -> None:
    claim["source_ids"] = sorted(set(claim["source_ids"]) | {observation["source_id"]})
    claim["entity_ids"] = sorted(
        set(claim["entity_ids"]) | {state.resolve(e["name"]) for e in observation["entities"]}
    )
    claim["source_authority_weight"] = max(claim["source_authority_weight"], authority)


def folded_claim(state: State, transition: dict) -> dict:
    """The claim a transition updates; a replay that cannot find it is a broken history."""
    claim = state.claims.get(transition["claim_id"])
    if claim is None:
        raise EngineError(
            f"transition {transition['transition_id']}: "
            f"claim {transition['claim_id']} is not in state"
        )
    return claim


def fold(state: State, transition: dict) -> None:
    """Apply one transition to the folded claims — the single definition of the views."""
    operation = transition["operation"]
    claim_id = transition["claim_id"]
    after = transition["after"]

    if operation == "decay_update":
        claim = folded_claim(state, transition)
        claim["log_odds"] = transition["decay"]["log_odds_after"]
        claim["probability"] = after["probability"]
        claim["status"] = after["status"]
        claim["last_decayed_at"] = transition["timestamp"]
        claim["needs_review"] = needs_review(state, claim)
        return

    observation = state.observations[transition["observation_id"]]
    authority = state.authority_for(observation)
    weight = (transition["weights"] or {}).get("evidence_weight", 0.0)
    related = transition["related_claim_id"]

    if operation in ("new_claim", "scope_split"):
        claim = {
            "claim_id": claim_id,
            "claim_key": transition["claim_key"],
            "current_text": after["text"],
            "probability": after["probability"],
            "log_odds": round(common.PRIOR_LOG_ODDS + weight, 6),
            "status": after["status"],
            "scope": state.segment,
            "conditions": list(observation["conditions"]),
            "exceptions": [],
            "entity_ids": sorted({state.resolve(e["name"]) for e in observation["entities"]}),
            "source_ids": [observation["source_id"]],
            "supporting_observations": [observation["observation_id"]],
            "contradicting_observations": [],
            "supersedes": [related] if operation == "new_claim" and related else [],
            "superseded_by": None,
            "siblings": [related] if operation == "scope_split" and related else [],
            "first_seen": transition["timestamp"],
            "last_confirmed_at": transition["timestamp"],
            "last_decayed_at": None,
            "decay_profile": state.profile_for(observation),
            "source_authority_weight": authority,
            "needs_review": False,
        }
        state.claims[claim_id] = claim
        state.claims_by_key[claim["claim_key"]].append(claim_id)
        if operation == "scope_split" and related and related in state.claims:
            parent = state.claims[related]
            if claim_id not in parent["siblings"]:
                parent["siblings"].append(claim_id)
        return

    claim = folded_claim(state, transition)
    if operation == "support_update":
        claim["log_odds"] = round(claim["log_odds"] + weight, 6)
        claim["probability"] = after["probability"]
        claim["status"] = after["status"]
        claim["current_text"] = after["text"]
        claim["supporting_observations"].append(observation["observation_id"])
        claim["last_confirmed_at"] = transition["timestamp"]
        if observation.get("decay_profile"):
            claim["decay_profile"] = observation["decay_profile"]
        _merge(state, claim, observation, authority)
    elif operation == "contradiction_update":
        claim["log_odds"] = round(claim["log_odds"] + weight, 6)
        claim["probability"] = after["probability"]
        claim["status"] = after["status"]
        claim["contradicting_observations"].append(observation["observation_id"])
        state.reviewed.discard(claim_id)
        _merge(state, claim, observation, claim["source_authority_weight"])
    elif operation == "exception_addition":
        claim["exceptions"].append(
            {
                "condition": list(observation["conditions"]),
                "effect": observation["claim_text"],
                "evidence": observation["observation_id"],
            }
        )
        _merge(state, claim, observation, claim["source_authority_weight"])
    elif operation == "supersession":
        claim["log_odds"] = round(claim["log_odds"] + weight, 6)
        claim["probability"] = after["probability"]
        claim["status"] = "superseded"
        claim["superseded_by"] = related
    elif operation == "human_override":
        claim["status"] = after["status"]
        state.reviewed.add(claim_id)
        supporting = observation["stance"] in SUPPORTING_STANCES
        side = "supporting_observations" if supporting else "contradicting_observations"
        if observation["observation_id"] not in claim[side]:
            claim[side].append(observation["observation_id"])
        if supporting:
            claim["last_confirmed_at"] = transition["timestamp"]
        _merge(
            state,
            claim,
            observation,
            authority if supporting else claim["source_authority_weight"],
        )
    else:
        raise EngineError(
            f"transition {transition['transition_id']}: unknown operation {operation}"
        )

    claim["needs_review"] = needs_review(state, claim)
    if claim["status"] == "disputed":
        state.conflicts.setdefault(
            claim_id,
            {
                "claim_id": claim_id,
                "opened_by": observation["observation_id"],
                "opened_at": transition["timestamp"],
            },
        )
    else:
        state.conflicts.pop(claim_id, None)


# --------------------------------------------------------------------------- matching


def conditions_overlap(left: list[str], right: list[str]) -> bool:
    """Intersecting normalized conditions, or either side unconditioned."""
    if not left or not right:
        return True
    return bool(
        {common.normalize_condition(c) for c in left}
        & {common.normalize_condition(c) for c in right}
    )


def intersection_size(left: list[str], right: list[str]) -> int:
    return len(
        {common.normalize_condition(c) for c in left}
        & {common.normalize_condition(c) for c in right}
    )


def best_match(candidates: list[dict], observation: dict) -> dict | None:
    overlapping = [
        c for c in candidates if conditions_overlap(c["conditions"], observation["conditions"])
    ]
    if not overlapping:
        return None
    position = {claim["claim_id"]: index for index, claim in enumerate(candidates)}
    return max(
        overlapping,
        key=lambda c: (
            intersection_size(c["conditions"], observation["conditions"]),
            c["probability"],
            -position[c["claim_id"]],
        ),
    )


def _snapshot(claim: dict) -> dict:
    return {
        "probability": claim["probability"],
        "status": claim["status"],
        "text": claim["current_text"],
    }


def _transition(
    observation: dict,
    operation: str,
    claim_id: str,
    *,
    timestamp: str,
    related: str | None,
    before: dict | None,
    after: dict,
    weights: dict | None,
    reason: str,
    actor: str = ACTOR,
    review_required: bool = False,
) -> dict:
    return {
        "transition_id": "tr_"
        + common.short_hash(observation["observation_id"], operation, claim_id),
        "timestamp": timestamp,
        "operation": operation,
        "claim_id": claim_id,
        "claim_key": observation["claim_key"],
        "observation_id": observation["observation_id"],
        "related_claim_id": related,
        "before": before,
        "after": after,
        "weights": weights,
        "reason": reason,
        "actor": actor,
        "review_required": review_required,
    }


def _conditions_text(conditions: list[str]) -> str:
    return "[" + ", ".join(conditions) + "]" if conditions else "[]"


def revived_status(status: str, probability: float) -> str:
    """Where a supporting observation leaves a claim's status."""
    if status in ("candidate", "disputed", "stale") and probability >= common.P_ACTIVE:
        return "active"
    if status == "archived":
        return "active" if probability >= common.P_ACTIVE else "candidate"
    return status


def apply_observation(
    state: State, schemas: Schemas, observation: dict, timestamp: str
) -> list[dict]:
    """Decide and fold the transitions one observation causes; returns them in order."""
    key = observation["claim_key"]
    stance = observation["stance"]
    _, w, weights = state.evidence(observation)
    candidates = state.live_claims(key)
    match = best_match(candidates, observation)
    emitted: list[dict] = []

    def emit(transition: dict) -> None:
        schemas.check("transition", transition)
        fold(state, transition)
        emitted.append(transition)

    def create(operation: str, related: str | None, reason: str) -> str:
        claim_id = "clm_" + common.short_hash(key, observation["observation_id"])
        probability = probability_of(common.PRIOR_LOG_ODDS + w)
        status = "active" if probability >= common.P_ACTIVE else "candidate"
        emit(
            _transition(
                observation,
                operation,
                claim_id,
                timestamp=timestamp,
                related=related,
                before=None,
                after={
                    "probability": probability,
                    "status": status,
                    "text": observation["claim_text"],
                },
                weights=weights,
                reason=reason,
            )
        )
        return claim_id

    override = observation.get("override")
    if override:
        target = match or (max(candidates, key=lambda c: c["probability"]) if candidates else None)
        if target is None:
            target = state.claims[
                create("new_claim", None, "no claim under key; created for the override")
            ]
        emit(
            _transition(
                observation,
                "human_override",
                target["claim_id"],
                timestamp=timestamp,
                related=None,
                before=_snapshot(target),
                after={**_snapshot(target), "status": override["status"]},
                weights=None,
                reason=override["reason"],
                actor=observation["extractor"]["model"],
            )
        )
        return emitted

    if not candidates:
        create("new_claim", None, "no claim under key")
        return emitted
    if match is None and stance in ("creates_exception", "supersedes"):
        match = max(candidates, key=lambda c: c["probability"])
    if match is None and stance != "contradicts":
        create("new_claim", None, "no claim under key with overlapping conditions")
        return emitted

    if stance == "contradicts":
        if match is None:
            parent = max(candidates, key=lambda c: c["probability"])
            create(
                "scope_split",
                parent["claim_id"],
                f"conditions {_conditions_text(observation['conditions'])} disjoint from "
                f"{parent['claim_id']} {_conditions_text(parent['conditions'])}",
            )
            return emitted
        log_odds = round(match["log_odds"] - w, 6)
        probability = probability_of(log_odds)
        status = "disputed" if probability < common.P_ACTIVE else "active"
        emit(
            _transition(
                observation,
                "contradiction_update",
                match["claim_id"],
                timestamp=timestamp,
                related=None,
                before=_snapshot(match),
                after={"probability": probability, "status": status, "text": match["current_text"]},
                weights={**weights, "evidence_weight": -w},
                reason=f"contradicts {match['claim_id']}; p {match['probability']} → {probability}"
                + (" below P_ACTIVE" if status == "disputed" else " with review"),
                review_required=True,
            )
        )
        return emitted

    assert match is not None
    if stance in SUPPORTING_STANCES:
        log_odds = round(match["log_odds"] + w, 6)
        probability = probability_of(log_odds)
        status = revived_status(match["status"], probability)
        text = observation["claim_text"] if stance == "modifies" else match["current_text"]
        review = status == "disputed" or (
            status == "active"
            and bool(match["contradicting_observations"])
            and match["claim_id"] not in state.reviewed
        )
        emit(
            _transition(
                observation,
                "support_update",
                match["claim_id"],
                timestamp=timestamp,
                related=None,
                before=_snapshot(match),
                after={"probability": probability, "status": status, "text": text},
                weights=weights,
                reason=f"{stance} {match['claim_id']}; p {match['probability']} → {probability}"
                + (f"; {match['status']} → {status}" if status != match["status"] else ""),
                review_required=review,
            )
        )
        return emitted

    if stance == "creates_exception":
        emit(
            _transition(
                observation,
                "exception_addition",
                match["claim_id"],
                timestamp=timestamp,
                related=None,
                before=_snapshot(match),
                after=_snapshot(match),
                weights=None,
                reason=(
                    f"exception to {match['claim_id']} under "
                    f"{_conditions_text(observation['conditions'])}"
                ),
                review_required=match["needs_review"],
            )
        )
        return emitted

    if stance == "supersedes":
        old = match
        new_id = create("new_claim", old["claim_id"], f"supersedes {old['claim_id']}")
        log_odds = round(old["log_odds"] - w, 6)
        emit(
            _transition(
                observation,
                "supersession",
                old["claim_id"],
                timestamp=timestamp,
                related=new_id,
                before=_snapshot(old),
                after={
                    "probability": probability_of(log_odds),
                    "status": "superseded",
                    "text": old["current_text"],
                },
                weights={**weights, "evidence_weight": -w},
                reason=f"superseded by {new_id}",
            )
        )
        return emitted

    raise EngineError(f"unhandled stance {stance!r}")


# --------------------------------------------------------------------------- views


def build_entities(state: State) -> list[dict]:
    entities: dict[str, dict] = {}
    for observation_id in state.observation_order:
        observation = state.observations[observation_id]
        _, w, _ = state.evidence(observation)
        stamp = observation["extracted_at"]
        for entry in observation["entities"]:
            mention_id = common.entity_id_for(entry["name"])
            entity_id = state.canonical_of.get(mention_id, mention_id)
            record = entities.setdefault(
                entity_id,
                {
                    "entity_id": entity_id,
                    "name": None,
                    "spellings": [],
                    "types": Counter(),
                    "log_odds": 0.0,
                    "source_observations": [],
                    "first_seen": stamp,
                    "last_seen": stamp,
                },
            )
            if record["name"] is None and mention_id == entity_id:
                record["name"] = entry["name"]
            for spelling in [entry["name"], *entry.get("aliases", [])]:
                if spelling not in record["spellings"]:
                    record["spellings"].append(spelling)
            record["types"][entry["type"]] += 1
            record["log_odds"] += -w if observation["stance"] == "contradicts" else w
            record["source_observations"].append(observation_id)
            record["first_seen"] = min(record["first_seen"], stamp)
            record["last_seen"] = max(record["last_seen"], stamp)

    merged_from: dict[str, list[str]] = defaultdict(list)
    for merge in state.merges:
        target = state.canonical_of.get(merge["into_entity"], merge["into_entity"])
        if merge["from_entity"] not in merged_from[target]:
            merged_from[target].append(merge["from_entity"])

    claims_by_entity: dict[str, list[dict]] = defaultdict(list)
    for claim in state.claims.values():
        for entity_id in claim["entity_ids"]:
            claims_by_entity[entity_id].append(claim)

    records = []
    for entity_id in sorted(entities):
        record = entities[entity_id]
        name = record["name"] or record["spellings"][0]
        entity_type = record["types"].most_common(1)[0][0]
        claims = sorted(
            claims_by_entity.get(entity_id, []), key=lambda c: (c["first_seen"], c["claim_id"])
        )
        live = sum(1 for c in claims if c["status"] in common.LIVE_STATUSES)
        records.append(
            {
                "entity_id": entity_id,
                "name": name,
                "type": entity_type,
                "aliases": [s for s in record["spellings"] if s != name],
                "merged_from": merged_from.get(entity_id, []),
                "attributes": {},
                "confidence": probability_of(record["log_odds"]),
                "source_observations": record["source_observations"],
                "claim_ids": [c["claim_id"] for c in claims],
                "page": common.page_path(entity_type, entity_id, live, state.segment),
                "first_seen": record["first_seen"],
                "last_seen": record["last_seen"],
            }
        )
    return records


def relationship_status(stances: set[str], statuses: set[str]) -> str:
    """Stance-aware: an edge only contradicting observations assert reads as disputed."""
    if stances and stances <= {"contradicts"}:
        return "disputed"
    if not statuses or statuses & {"candidate", "active", "stale", "archived"}:
        return "active"
    if "disputed" in statuses:
        return "disputed"
    # Every claim is frozen — superseded, rejected, or both. The schema's status enum has
    # no `rejected`, so a wholly rejected edge reads as superseded, frozen like its claims.
    return "superseded"


def build_relationships(state: State) -> list[dict]:
    claims_by_observation: dict[str, list[str]] = defaultdict(list)
    for claim in state.claims.values():
        evidence = (
            claim["supporting_observations"]
            + claim["contradicting_observations"]
            + [exception["evidence"] for exception in claim["exceptions"]]
        )
        for observation_id in evidence:
            claims_by_observation[observation_id].append(claim["claim_id"])

    relationships: dict[str, dict] = {}
    for observation_id in state.observation_order:
        observation = state.observations[observation_id]
        _, w, _ = state.evidence(observation)
        stamp = observation["extracted_at"]
        for relation in observation["relationships"]:
            subject = state.resolve(relation["subject"])
            obj = state.resolve(relation["object"])
            predicate = common.canonical_predicate(relation["predicate"])
            qualifiers = {"qualifier": relation["qualifier"]} if relation.get("qualifier") else {}
            relationship_id = "rel_" + common.short_hash(
                subject, predicate, obj, common.dumps(qualifiers)
            )
            record = relationships.setdefault(
                relationship_id,
                {
                    "relationship_id": relationship_id,
                    "subject_entity": subject,
                    "predicate": predicate,
                    "object_entity": obj,
                    "qualifiers": qualifiers,
                    "log_odds": 0.0,
                    "stances": set(),
                    "supporting_observations": [],
                    "contradicting_observations": [],
                    "claim_ids": [],
                    "first_seen": stamp,
                    "last_seen": stamp,
                },
            )
            record["stances"].add(observation["stance"])
            if observation["stance"] == "contradicts":
                record["log_odds"] -= w
                record["contradicting_observations"].append(observation_id)
            else:
                record["log_odds"] += w
                record["supporting_observations"].append(observation_id)
            for claim_id in claims_by_observation.get(observation_id, []):
                if claim_id not in record["claim_ids"]:
                    record["claim_ids"].append(claim_id)
            record["first_seen"] = min(record["first_seen"], stamp)
            record["last_seen"] = max(record["last_seen"], stamp)

    records = []
    for relationship_id in sorted(relationships):
        record = relationships[relationship_id]
        statuses = {state.claims[c]["status"] for c in record["claim_ids"]}
        status = relationship_status(record.pop("stances"), statuses)
        log_odds = record.pop("log_odds")
        records.append({**record, "probability": probability_of(log_odds), "status": status})
    return records


def build_views(state: State) -> dict[str, str]:
    """Every view as its file text — the one definition `apply`, `rebuild`, and `--check` share."""
    claims = sorted(
        state.claims.values(), key=lambda c: (c["claim_key"], c["first_seen"], c["claim_id"])
    )
    entities = build_entities(state)
    relationships = build_relationships(state)
    conflicts = sorted(state.conflicts.values(), key=lambda c: (c["opened_at"], c["claim_id"]))
    snapshot = {
        "arithmetic": common.ARITHMETIC,
        "as_of": state.newest_stamp(),
        "segment": state.segment,
        "runs": {"live": len(state.runs), "retracted": len(state.retracted)},
        "counts": {
            "sources": len(state.sources),
            "observations": len(state.observations),
            "transitions": len(state.transitions),
            "merges": len(state.merges),
            "claims": len(claims),
            "claims_by_status": dict(sorted(Counter(c["status"] for c in claims).items())),
            "entities": len(entities),
            "relationships": len(relationships),
            "pages": sum(1 for e in entities if e["page"]),
            "unresolved_conflicts": len(conflicts),
        },
    }
    return {
        "claims": common.jsonl_text(claims),
        "entities": common.jsonl_text(entities),
        "relationships": common.jsonl_text(relationships),
        "unresolved_conflicts": common.jsonl_text(conflicts),
        "snapshot": json.dumps(snapshot, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
    }


def validate_views(schemas: Schemas, state: State, views: dict[str, str]) -> None:
    for name, record_name in (
        ("claims", "claim"),
        ("entities", "entity"),
        ("relationships", "relationship"),
    ):
        for line in views[name].splitlines():
            schemas.check(record_name, json.loads(line))


def write_views(layout: common.Layout, schemas: Schemas, state: State) -> list[str]:
    views = build_views(state)
    validate_views(schemas, state, views)
    return [
        name
        for name, text in views.items()
        if common.write_text_if_changed(layout.view(name), text)
    ]


# --------------------------------------------------------------------------- runs


@dataclass
class Run:
    """One write run: the segment it writes, the stamp its rows carry, and the id they take."""

    layout: common.Layout
    timestamp: str
    run_id: str
    inputs: list[dict] = field(default_factory=list)
    views_before: str | None = None
    appended: Counter = field(default_factory=Counter)

    def append(self, ledger: str, path: Path, rows: list[dict]) -> None:
        """Stamp this run on every row, append them, and count them for the audit row."""
        for row in rows:
            row["run_id"] = self.run_id
        common.append_jsonl(path, rows)
        self.appended[ledger] += len(rows)


@dataclass
class Session:
    """The runs one invocation performs under one lock — their ids, stamps, and audit rows.

    Most verbs are one run; `apply --inbox` is one per drained file and `promote` is three
    across both segments, and each of them is minted, stamped, and audited on its own.
    """

    layout: common.Layout
    actor: str
    role: str
    verb: str
    args: list[str]
    policy: dict

    def start(self, inputs: list[dict] | None = None, layout: common.Layout | None = None) -> Run:
        target = layout or self.layout
        views_before = common.views_hash(target)
        timestamp = run_stamp(target)
        entries = list(inputs or [])
        return Run(
            layout=target,
            timestamp=timestamp,
            run_id=common.run_id(
                self.actor, self.verb, timestamp, [entry["hash"] for entry in entries], views_before
            ),
            inputs=entries,
            views_before=views_before,
        )

    def record(self, run: Run, outcome: str | None = None, detail: str | None = None) -> None:
        """Close the run: one audit row in its own segment, then its `run:` line."""
        views_after = common.views_hash(run.layout)
        moved = sum(run.appended.values()) or views_after != run.views_before
        record_run(
            run.layout,
            common.audit_row(
                run.run_id,
                timestamp=run.timestamp,
                actor=self.actor,
                role=self.role,
                verb=self.verb,
                segment=run.layout.segment,
                args=self.args,
                outcome=outcome or ("ok" if moved else "unchanged"),
                inputs=run.inputs,
                appended=run.appended,
                views_before=run.views_before,
                views_after=views_after,
                detail=detail,
            ),
        )
        print(f"run: {run.run_id}")


def verb_args(argv: list[str], verb: str) -> list[str]:
    """The verb's own arguments — everything the command line gave after the verb token."""
    for index, token in enumerate(argv):
        if token == verb and (
            index == 0 or argv[index - 1] not in ("--root", "--segment", "--actor")
        ):
            return argv[index + 1 :]
    return []


def run_actor(args: argparse.Namespace, verb: str) -> str:
    """The identity a run is checked and audited as; the reversal verbs take --by."""
    if verb in BY_HUMAN_VERBS:
        if not HUMAN_RE.match(args.by or ""):
            raise EngineError("--by must be human:<name>")
        return args.by
    actor = args.actor or os.environ.get("LLM_WIKI_ACTOR") or common.DEFAULT_ACTOR
    if not common.ACTOR_RE.match(actor):
        raise EngineError(f"actor {actor!r} is not {common.ACTOR_RE.pattern}", 2)
    return actor


def file_input(layout: common.Layout, path: Path) -> list[dict]:
    """One `inputs` entry for a file a run read, hashed as it was read."""
    try:
        rel = layout.rel(path)
    except ValueError:
        rel = path.resolve().as_posix()
    return [{"path": rel, "hash": common.file_hash(path)}]


def record_run(layout: common.Layout, row: dict) -> None:
    Schemas(layout).check("audit", row)
    common.append_audit(layout, row)


def deny(layout: common.Layout, actor: str, role: str, verb: str, args: list[str]) -> int:
    """Refuse the verb the policy withholds: one denied audit row, the line, exit 3."""
    views = common.views_hash(layout)
    timestamp = common.now()
    detail = f"{role} may not {verb} on {layout.segment}"
    record_run(
        layout,
        common.audit_row(
            common.run_id(actor, verb, timestamp, [], views),
            timestamp=timestamp,
            actor=actor,
            role=role,
            verb=verb,
            segment=layout.segment,
            args=args,
            outcome="denied",
            inputs=[],
            appended={},
            views_before=views,
            views_after=views,
            detail=detail,
        ),
    )
    print(
        f"denied: {actor} may not {verb} on {layout.segment} (governance.json roles.{role})",
        file=sys.stderr,
    )
    return 3


def is_write(args: argparse.Namespace) -> bool:
    """`rebuild --check` compares and writes nothing; every other write verb runs."""
    return args.verb in WRITE_VERBS and not (args.verb == "rebuild" and args.check)


def run_write(layout: common.Layout, args: argparse.Namespace, argv: list[str]) -> int:
    """Gate, lock, and audit one write verb; the body decides what it appends."""
    verb = args.verb
    own_args = verb_args(argv, verb)
    actor = run_actor(args, verb)
    policy = common.load_policy(layout)
    role = common.role_of(policy, actor)
    if not common.allowed(policy, role, verb, layout.segment):
        return deny(layout, actor, role, verb, own_args)
    ensure_segment(layout)
    with common.hold_lock(layout, actor, verb, policy["lock_timeout_s"]):
        return args.run(layout, args, Session(layout, actor, role, verb, own_args, policy))


def ensure_segment(layout: common.Layout) -> None:
    """The private segment's folders are created by its first write."""
    if layout.segment == "private":
        for path in (layout.raw, layout.states, layout.wiki):
            path.mkdir(parents=True, exist_ok=True)


STAMP_FIELDS = {
    "sources": "ingested_at",
    "observations": "extracted_at",
    "transitions": "timestamp",
    "merges": "timestamp",
    "retractions": "timestamp",
}


def newest_ledger_stamp(layout: common.Layout) -> str | None:
    """The newest stamp any row of the five folded ledgers carries."""
    stamps = [
        row[STAMP_FIELDS[ledger]] for ledger, rows in ledger_rows(layout).items() for row in rows
    ]
    return max(stamps) if stamps else None


def run_stamp(layout: common.Layout) -> str:
    """The clock, or one second past the newest ledger row when the clock has not passed it.

    The fold orders rows by `(timestamp, run_id)`, so a run sharing a stamp with the rows it
    builds on would be ordered against them by id; every run is stamped strictly after the
    state it read instead. `LLM_WIKI_NOW` therefore pins the floor of a run, not its stamp.
    """
    now = common.now()
    newest = newest_ledger_stamp(layout)
    return now if newest is None or now > newest else common.bump_stamp(newest)


def ledger_rows(layout: common.Layout) -> dict[str, list[dict]]:
    """Every row of the five append-only ledgers, retracted runs included."""
    return {
        "sources": common.read_jsonl(layout.sources),
        "observations": common.read_observations(layout),
        "transitions": common.read_jsonl(layout.transitions),
        "merges": common.read_jsonl(layout.merges),
        "retractions": common.read_jsonl(layout.retractions),
    }


def audit_check(layout: common.Layout) -> tuple[bool, str, dict]:
    """Whether every stamped ledger row joins an `ok` audit row whose counts match it."""
    counts_by_run: dict[str, Counter] = defaultdict(Counter)
    total = legacy = 0
    for ledger, rows in ledger_rows(layout).items():
        for row in rows:
            total += 1
            if row.get("run_id") is None:
                legacy += 1
            else:
                counts_by_run[row["run_id"]][ledger] += 1
    audit = common.read_jsonl(layout.audit_log)
    recorded = {row["run_id"]: row for row in audit if row["outcome"] == "ok"}
    outcomes = Counter(row["outcome"] for row in audit)
    split = " · ".join(f"{outcomes[name]} {name}" for name in ("ok", "unchanged", "denied"))
    payload = {
        "ledger_rows": total,
        "runs": len(audit),
        "outcomes": {name: outcomes[name] for name in ("ok", "unchanged", "denied")},
        "legacy": legacy,
    }

    unknown = sorted(run for run in counts_by_run if run not in recorded)
    if unknown:
        orphans = sum(sum(counts_by_run[run].values()) for run in unknown)
        line = f"audit --check: {orphans} rows carry an unknown run_id: {', '.join(unknown)}"
        return False, line, {**payload, "complete": False, "detail": line}
    for run, row in sorted(recorded.items()):
        for ledger in common.LEDGER_NAMES:
            carried = counts_by_run[run][ledger]
            if row["appended"][ledger] != carried:
                line = (
                    f"audit --check: {run} records {ledger} {row['appended'][ledger]} "
                    f"but {carried} rows carry its id"
                )
                return False, line, {**payload, "complete": False, "detail": line}
    line = (
        f"audit --check: {total} ledger rows · {len(audit)} runs ({split}) · "
        f"{legacy} legacy · complete"
    )
    return True, line, {**payload, "complete": True, "detail": None}


def audit_line(row: dict) -> str:
    counts = " · ".join(
        f"{name} {row['appended'][name]}" for name in common.LEDGER_NAMES if row["appended"][name]
    )
    tail = f" · {counts}" if counts else ""
    if row["detail"]:
        tail += f" · {row['detail']}"
    return f"{row['run_id']} {row['timestamp']} {row['actor']} {row['verb']} {row['outcome']}{tail}"


def cmd_audit(layout: common.Layout, args: argparse.Namespace) -> int:
    if args.check:
        complete, line, payload = audit_check(layout)
        print(json.dumps(payload, indent=2, sort_keys=True) if args.json else line)
        return 0 if complete else 1

    rows = list(reversed(common.fold_order(common.read_jsonl(layout.audit_log), "timestamp")))
    if args.run_id:
        rows = [row for row in rows if row["run_id"] == args.run_id]
        if not rows:
            raise EngineError(f"unknown run: {args.run_id}", 2)
    shown = rows[: args.last] if args.last else rows
    if args.json:
        print(json.dumps({"runs": shown}, indent=2, sort_keys=True, ensure_ascii=False))
        return 0
    if not rows:
        print("audit: empty")
        return 0
    if args.run_id:
        print(audit_line(rows[0]))
        print(json.dumps(rows[0], indent=2, sort_keys=True, ensure_ascii=False))
        return 0
    print(f"audit: {len(rows)} runs · newest {audit_line(rows[0])}")
    for row in shown:
        print(f"  {audit_line(row)}")
    return 0


# --------------------------------------------------------------------------- register


def _as_date(value: object) -> str | None:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str) and re.match(r"^\d{4}-\d{2}-\d{2}", value):
        return value[:10]
    return None


def resolve_raw_path(layout: common.Layout, raw_path: str) -> tuple[Path, str]:
    candidate = Path(raw_path)
    path = candidate if candidate.is_absolute() else layout.root / candidate
    if not path.is_file():
        raise EngineError(f"archive not found: {raw_path}")
    rel = layout.rel(path)
    prefix = layout.rel(layout.raw) + "/"
    if not rel.startswith(prefix):
        raise EngineError(f"not under {prefix}: {rel}")
    return path, rel


def accepted_levels(segment: str) -> tuple[str, ...]:
    """What a segment accepts as a source's sensitivity or an observation's privacy."""
    return ("public", "internal", "private") if segment == "private" else ("public", "internal")


def cmd_register(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    schemas = Schemas(layout)
    path, rel = resolve_raw_path(layout, args.path)
    digest = common.file_hash(path)
    run = session.start([{"path": rel, "hash": digest}])
    channel = common.channel_of(rel)
    if channel not in common.AUTHORITY:
        raise EngineError(f"{rel}: {channel!r} is not a source channel of the raw layer")
    meta, body = common.read_frontmatter(path)
    sensitivity = str(meta.get("sensitivity", "internal")).lower()
    if sensitivity not in accepted_levels(layout.segment):
        raise EngineError(
            f"{rel}: sensitivity {sensitivity} never enters the {layout.segment} segment"
        )
    if args.created_at is not None and not DATE_RE.match(args.created_at):
        raise EngineError("--created-at must be YYYY-MM-DD", 2)

    heading = re.search(r"^# (.+)$", body, re.M)
    title = args.title or meta.get("title") or (heading.group(1).strip() if heading else path.stem)
    created_at = next(
        (
            d
            for key in ("published", "last_modified", "date", "created")
            if (d := _as_date(meta.get(key)))
        ),
        args.created_at,
    )
    authority_set_by = None
    if args.authority is not None:
        if not args.by or not HUMAN_RE.match(args.by):
            raise EngineError("--authority needs --by human:<name>")
        authority = args.authority
        authority_set_by = args.by
    else:
        authority = common.AUTHORITY[channel]

    source_id = "src_" + common.short_hash(rel)
    # A retracted registration is not a registration: the replay skips its row, so this
    # re-register has to append a live one rather than read the dead row as unchanged.
    existing = common.read_sources(layout, common.retracted_runs(layout)).get(source_id)
    if existing:
        if existing["hash"] != digest:
            raise EngineError(
                f"{rel}: archive edited in place since registration ({existing['hash'][:19]}…); "
                "raw is immutable — re-archive beside it and register the new path"
            )
        unchanged = (
            existing["source_authority"] == authority
            and existing.get("authority_set_by") == authority_set_by
            and existing["title"] == title
            and existing.get("created_at") == created_at
        )
        if unchanged:
            print(source_id)
            session.record(run)
            return 0

    record = {
        "source_id": source_id,
        "channel": channel,
        "path": rel,
        "title": str(title),
        "author": str(meta["author"]) if meta.get("author") else None,
        "created_at": created_at,
        "ingested_at": run.timestamp,
        "source_authority": authority,
        "scope": layout.segment,
        "sensitivity": sensitivity,
        "hash": digest,
    }
    if isinstance(meta.get("source"), str) and meta["source"].startswith(("http://", "https://")):
        record["url"] = meta["source"]
    if authority_set_by:
        record["authority_set_by"] = authority_set_by
    schemas.check("source", record)
    run.append("sources", layout.sources, [record])
    write_views(layout, schemas, load_state(layout))
    print(source_id)
    session.record(run)
    return 0


# --------------------------------------------------------------------------- validate / apply


def load_pending(path_text: str) -> tuple[list[tuple[int, dict]], list[str]]:
    path = Path(path_text)
    if not path.is_file():
        raise EngineError(f"observation file not found: {path_text}", 2)
    records, diagnostics = [], []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            diagnostics.append(f"line {number}: invalid JSON ({exc.msg})")
            continue
        if not isinstance(record, dict):
            diagnostics.append(f"line {number}: not a JSON object")
            continue
        records.append((number, record))
    return records, diagnostics


def mint(record: dict, timestamp: str) -> dict:
    observation = {k: v for k, v in record.items() if k not in ("observation_id", "extracted_at")}
    parts = [record["source_id"], record["claim_key"], record["stance"], record["evidence_span"]]
    if "override" in record:
        parts += ["override", record["override"]["status"], record["override"]["reason"]]
    observation["observation_id"] = "obs_" + common.short_hash(*parts)
    observation["extracted_at"] = timestamp
    return observation


def validate_observations(
    layout: common.Layout,
    schemas: Schemas,
    state: State,
    records: list[tuple[int, dict]],
    archives: dict[str, str | None] | None = None,
) -> list[str]:
    """Every diagnostic the records raise; `archives` pre-supplies text a path has not on disk."""
    diagnostics: list[str] = []
    archives = dict(archives or {})
    for number, record in records:
        problems = schemas.errors("pending-observation", record)
        if problems:
            if "override" in record and any(p.startswith("extractor/model:") for p in problems):
                problems = ["override is valid only on a human:<name> observation"]
            diagnostics.extend(f"line {number}: {problem}" for problem in problems)
            continue
        source = state.sources.get(record["source_id"])
        if source is None:
            diagnostics.append(f"line {number}: source {record['source_id']} is not registered")
        else:
            if source["path"] not in archives:
                archive = layout.abs(source["path"])
                archives[source["path"]] = (
                    archive.read_text(encoding="utf-8", errors="replace")
                    if archive.is_file()
                    else None
                )
            text = archives[source["path"]]
            if text is None:
                diagnostics.append(f"line {number}: archive missing: {source['path']}")
            else:
                found, window = common.find_span(record["evidence_span"], text)
                if not found:
                    hint = f' — nearest: "{window}"' if window else ""
                    diagnostics.append(
                        f"line {number}: evidence_span not found verbatim in {source['path']}{hint}"
                    )
        names = set()
        for entry in record["entities"]:
            names.add(common.entity_id_for(entry["name"]))
            names.update(common.entity_id_for(alias) for alias in entry.get("aliases", []))
        for relation in record["relationships"]:
            for role in ("subject", "object"):
                if common.entity_id_for(relation[role]) not in names:
                    diagnostics.append(
                        f"line {number}: relationship {role} {relation[role]!r} "
                        "is not named in entities"
                    )
        if record["privacy"] not in accepted_levels(layout.segment):
            diagnostics.append(
                f"line {number}: privacy {record['privacy']} "
                f"never enters the {layout.segment} segment"
            )
        model = record["extractor"]["model"]
        if model.startswith("human:") and not HUMAN_RE.match(model):
            diagnostics.append(f"line {number}: extractor.model {model!r} is not human:<name>")
        if "override" in record and not HUMAN_RE.match(model):
            diagnostics.append(
                f"line {number}: override is valid only on a human:<name> observation"
            )
    return diagnostics


def cmd_validate(layout: common.Layout, args: argparse.Namespace) -> int:
    schemas = Schemas(layout)
    state = load_state(layout)
    records, diagnostics = load_pending(args.file)
    diagnostics += validate_observations(layout, schemas, state, records)
    if diagnostics:
        for line in diagnostics:
            print(line)
        return 2
    print(f"ok: {len(records)} observations")
    return 0


def inbox_files(layout: common.Layout) -> list[Path]:
    """Every pending proposal in name order — the order `apply --inbox` drains them."""
    return sorted(layout.inbox.glob("*.jsonl")) if layout.inbox.is_dir() else []


def cmd_apply(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    if args.inbox:
        return drain_inbox(layout, args, session)
    if not args.file:
        raise EngineError("apply takes an observation file, or --inbox to drain them", 2)
    return apply_file(layout, args, session, Path(args.file))


def drain_inbox(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    """Every pending proposal in name order, one run each; an invalid one stays where it is."""
    pending = inbox_files(layout)
    if not pending:
        print("inbox: empty")
        return 0
    applied = invalid = 0
    for path in pending:
        print(f"{path.name}:")
        if apply_file(layout, args, session, path) == 0:
            applied += 1
        else:
            invalid += 1
    print(f"inbox: {applied} applied · {invalid} invalid")
    return 2 if invalid else 0


def apply_file(
    layout: common.Layout, args: argparse.Namespace, session: Session, path: Path
) -> int:
    """Validate one observation file and land it as one run; a drained proposal is removed."""
    schemas = Schemas(layout)
    state = load_state(layout)
    records, diagnostics = load_pending(str(path))
    diagnostics += validate_observations(layout, schemas, state, records)
    if diagnostics:
        for line in diagnostics:
            print(line)
        return 2
    run = session.start(file_input(layout, path))
    apply_records(layout, session, schemas, state, records, run, dry_run=args.dry_run)
    if not args.dry_run and path.resolve().parent == layout.inbox:
        path.unlink()
    return 0


def apply_records(
    layout: common.Layout,
    session: Session,
    schemas: Schemas,
    state: State,
    records: list[tuple[int, dict]],
    run: Run,
    *,
    dry_run: bool = False,
) -> None:
    """Mint, fold, and append validated observations as the rows of one run."""
    timestamp = run.timestamp
    applied: list[dict] = []
    skipped = 0
    transitions: list[dict] = []
    by_source: dict[str, list[dict]] = defaultdict(list)
    for _, record in records:
        observation = mint(record, timestamp)
        if observation["observation_id"] in state.observations:
            skipped += 1
            continue
        schemas.check("observation", observation)
        state.observations[observation["observation_id"]] = observation
        state.observation_order.append(observation["observation_id"])
        common.fold_mentions(state.canonical_of, observation)
        emitted = apply_observation(state, schemas, observation, timestamp)
        state.transitions.extend(emitted)
        transitions.extend(emitted)
        applied.append(observation)
        by_source[observation["source_id"]].append(observation)

    if not applied:
        print("unchanged")
        session.record(run)
        return

    if not dry_run:
        for source_id, observations in by_source.items():
            run.append("observations", layout.observations_file(source_id), observations)
        run.append("transitions", layout.transitions, transitions)
        write_views(layout, schemas, load_state(layout))

    operations = Counter(t["operation"] for t in transitions)
    created = {t["claim_id"] for t in transitions if t["operation"] in ("new_claim", "scope_split")}
    updated = {t["claim_id"] for t in transitions} - created
    affected = sorted({state.resolve(e["name"]) for o in applied for e in o["entities"]})
    entities = build_entities(state)
    prefix = "dry-run · " if dry_run else ""
    print(f"{prefix}observations: {len(applied)} applied · {skipped} already applied")
    print(
        f"transitions: {len(transitions)} · "
        + " · ".join(f"{name} {count}" for name, count in sorted(operations.items()))
    )
    print(f"claims: +{len(created)} ~{len(updated)}")
    print(f"entities: {len(entities)} · affected: {', '.join(affected) or 'none'}")
    session.record(run)


# --------------------------------------------------------------------------- decay


def decay_transition(claim: dict, as_of: str, elapsed: float) -> dict | None:
    """The decay_update row `as_of` lands on a claim, or None when nothing moves enough."""
    profile = claim["decay_profile"]
    half_life = common.DECAY_HALF_LIFE_DAYS[profile]
    factor = common.decay_factor(elapsed, profile)
    log_odds_after = round(claim["log_odds"] * factor, 6)
    probability = probability_of(log_odds_after)
    status = decayed_status(claim["status"], probability)
    moved = round(abs(probability - claim["probability"]), 4) >= common.DECAY_MIN_DELTA
    if not moved and status == claim["status"]:
        return None
    return {
        "transition_id": "tr_" + common.short_hash(claim["claim_id"], "decay_update", as_of),
        "timestamp": as_of,
        "operation": "decay_update",
        "claim_id": claim["claim_id"],
        "claim_key": claim["claim_key"],
        "observation_id": None,
        "related_claim_id": None,
        "before": _snapshot(claim),
        "after": {"probability": probability, "status": status, "text": claim["current_text"]},
        "weights": None,
        "decay": {
            "elapsed_days": round(elapsed, 2),
            "half_life_days": half_life,
            "factor": round(factor, 4),
            "log_odds_before": claim["log_odds"],
            "log_odds_after": log_odds_after,
        },
        "reason": f"decay {elapsed:.1f} d on {profile} (H {half_life} d)",
        "actor": ACTOR,
        "review_required": False,
    }


def cmd_decay(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    schemas = Schemas(layout)
    run = session.start()
    as_of = args.as_of or run.timestamp
    if not TIMESTAMP_RE.match(as_of):
        raise EngineError("--as-of must be YYYY-MM-DDTHH:MM:SSZ", 2)
    if not layout.states.is_dir():
        print("unchanged")
        session.record(run)
        return 0
    state = load_state(layout)
    newest = state.newest_stamp()
    if newest and as_of <= newest:
        raise EngineError(f"as_of {as_of} precedes or equals the newest ledger stamp {newest}")

    rows: list[dict] = []
    scanned = 0
    for claim in sorted(
        state.claims.values(), key=lambda c: (c["claim_key"], c["first_seen"], c["claim_id"])
    ):
        if claim["status"] in FROZEN_STATUSES:
            continue
        scanned += 1
        since = max(claim["last_confirmed_at"], claim["last_decayed_at"] or "")
        transition = decay_transition(claim, as_of, common.elapsed_days(since, as_of))
        if transition is None:
            continue
        schemas.check("transition", transition)
        fold(state, transition)
        state.transitions.append(transition)
        rows.append(transition)

    changed = [t for t in rows if t["before"]["status"] != t["after"]["status"]]
    stale = sum(1 for t in changed if t["after"]["status"] == "stale")
    archived = sum(1 for t in changed if t["after"]["status"] == "archived")
    if args.json:
        print(
            json.dumps(
                {
                    "as_of": as_of,
                    "scanned": scanned,
                    "rows": len(rows),
                    "stale": stale,
                    "archived": archived,
                    "claims": [
                        {
                            "claim_id": t["claim_id"],
                            "claim_key": t["claim_key"],
                            "before": {k: t["before"][k] for k in ("probability", "status")},
                            "after": {k: t["after"][k] for k in ("probability", "status")},
                            "factor": t["decay"]["factor"],
                            "elapsed_days": t["decay"]["elapsed_days"],
                        }
                        for t in rows
                    ],
                },
                indent=2,
                sort_keys=True,
            )
        )
    if not rows:
        if not args.json:
            print("unchanged")
        session.record(run)
        return 0
    if not args.dry_run:
        run.append("transitions", layout.transitions, rows)
        write_views(layout, schemas, load_state(layout))
    if not args.json:
        prefix = "dry-run · " if args.dry_run else ""
        print(
            f"{prefix}decay: scanned {scanned} · rows {len(rows)} · "
            f"stale {stale} · archived {archived}"
        )
        for transition in changed:
            print(
                f"  {transition['claim_id']} ({transition['claim_key']}) "
                f"{transition['before']['status']} → {transition['after']['status']} · "
                f"p {transition['before']['probability']} → {transition['after']['probability']}"
            )
    session.record(run)
    return 0


# --------------------------------------------------------------------------- merge


def cmd_merge(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    schemas = Schemas(layout)
    run = session.start()
    if args.from_entity == args.into_entity:
        raise EngineError(f"self-merge: {args.from_entity}")
    state = load_state(layout) if layout.states.is_dir() else State(segment=layout.segment)
    canonical = state.canonical_of
    for entity_id in (args.from_entity, args.into_entity):
        if entity_id not in canonical:
            raise EngineError(f"unknown entity: {entity_id}")
    into = args.into_entity
    if canonical[into] != into:
        raise EngineError(f"{into} resolves to {canonical[into]} — merge into that instead")
    source = args.from_entity
    if canonical[source] != source:
        if canonical[source] == into:
            print("unchanged")
            session.record(run)
            return 0
        raise EngineError(f"{source} already resolves to {canonical[source]}")

    row = {
        "merge_id": "mrg_" + common.short_hash(source, into),
        "from_entity": source,
        "into_entity": into,
        "by": args.by,
        "reason": args.reason,
        "timestamp": run.timestamp,
    }
    schemas.check("merge", row)
    run.append("merges", layout.merges, [row])
    state = load_state(layout)
    write_views(layout, schemas, state)
    entity = next(e for e in build_entities(state) if e["entity_id"] == into)
    aliases = f" (aliases: {', '.join(entity['aliases'])})" if entity["aliases"] else ""
    print(
        f"merged {source} → {into} · {entity['name']}{aliases} · "
        f"{len(entity['claim_ids'])} claims · merged_from: {', '.join(entity['merged_from'])} · "
        f"page: {entity['page'] or 'none'}"
    )
    session.record(run)
    return 0


# ------------------------------------------------------------------ rebuild / slice / status


def cmd_rebuild(
    layout: common.Layout, args: argparse.Namespace, session: Session | None = None
) -> int:
    schemas = Schemas(layout)
    run = session.start() if session else None
    if not layout.states.is_dir():
        print("no states/ yet — nothing to rebuild")
        if session and run:
            session.record(run)
        return 0
    state = load_state(layout)
    views = build_views(state)
    validate_views(schemas, state, views)
    if args.check:
        differing = [
            name
            for name, text in views.items()
            if not layout.view(name).is_file()
            or layout.view(name).read_text(encoding="utf-8") != text
        ]
        if differing:
            print("rebuild --check: views differ from the ledgers: " + ", ".join(differing))
        else:
            print("rebuild --check: views match the ledgers")
        complete, line, _ = audit_check(layout)
        print(line)
        return 0 if complete and not differing else 1
    written = [
        name
        for name, text in views.items()
        if common.write_text_if_changed(layout.view(name), text)
    ]
    print("rebuilt: " + (", ".join(written) if written else "nothing changed"))
    if session and run:
        session.record(run)
    return 0


def _evidence(state: State, observation_id: str) -> dict:
    observation = state.observations[observation_id]
    source = state.sources.get(observation["source_id"], {})
    return {
        "observation_id": observation_id,
        "stance": observation["stance"],
        "confidence": observation["confidence"],
        "extractor": observation["extractor"]["model"],
        "evidence_span": observation["evidence_span"],
        "conditions": observation["conditions"],
        "source_id": observation["source_id"],
        "source_title": source.get("title"),
        "source_path": source.get("path"),
        "source_channel": source.get("channel"),
        "source_authority": (
            common.HUMAN_AUTHORITY if is_human(observation) else source.get("source_authority")
        ),
    }


def slice_claims(
    layout: common.Layout, state: State, args: argparse.Namespace
) -> tuple[dict, list[dict]]:
    if args.entity:
        selector = {"entity": args.entity}
        claims = [c for c in state.claims.values() if args.entity in c["entity_ids"]]
    elif args.claim_key:
        selector = {"claim_key": args.claim_key}
        claims = [state.claims[cid] for cid in state.claims_by_key.get(args.claim_key, [])]
    else:
        try:
            rel = (
                layout.rel(Path(args.page).resolve())
                if "/" in args.page and not args.page.startswith("llm-wiki/")
                else args.page
            )
        except ValueError:
            rel = args.page
        selector = {"page": rel}
        entity = next((e for e in build_entities(state) if e["page"] == rel), None)
        claims = [state.claims[cid] for cid in entity["claim_ids"]] if entity else []
        if entity:
            selector["entity"] = entity["entity_id"]
    live = [c for c in claims if c["status"] not in FROZEN_STATUSES]
    frozen = [c for c in claims if c["status"] in FROZEN_STATUSES]
    ordered = sorted(live, key=lambda c: (-c["probability"], c["claim_id"])) + sorted(
        frozen, key=lambda c: c["claim_id"]
    )
    return selector, ordered


def cmd_slice(layout: common.Layout, args: argparse.Namespace) -> int:
    state = load_state(layout)
    selector, claims = slice_claims(layout, state, args)
    payload = {"selector": selector, "claims": [], "sources": {}}
    for claim in claims:
        transitions = [t for t in state.transitions if t["claim_id"] == claim["claim_id"]]
        payload["claims"].append(
            {
                **claim,
                "evidence": {
                    "supporting": [_evidence(state, o) for o in claim["supporting_observations"]],
                    "contradicting": [
                        _evidence(state, o) for o in claim["contradicting_observations"]
                    ],
                    "exceptions": [
                        {**exception, "evidence_record": _evidence(state, exception["evidence"])}
                        for exception in claim["exceptions"]
                    ],
                },
                "transitions": transitions,
            }
        )
        for source_id in claim["source_ids"]:
            if source_id in state.sources:
                payload["sources"][source_id] = state.sources[source_id]

    if args.json:
        print(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True))
        return 0

    print(f"# slice · {' · '.join(f'{k}={v}' for k, v in selector.items())} · {len(claims)} claims")
    for entry in payload["claims"]:
        print(
            f"\n## {entry['claim_id']} · {entry['claim_key']} · p {entry['probability']} · "
            f"{entry['status']}" + (" · needs_review" if entry["needs_review"] else "")
        )
        print(entry["current_text"])
        if entry["conditions"]:
            print(f"conditions: {', '.join(entry['conditions'])}")
        print(
            f"decay_profile: {entry['decay_profile']} · last_confirmed_at: "
            f"{entry['last_confirmed_at']} · last_decayed_at: {entry['last_decayed_at'] or '—'}"
        )
        for label in ("supporting", "contradicting"):
            for item in entry["evidence"][label]:
                print(
                    f"{label}: {item['observation_id']} · {item['source_id']} "
                    f"{item['source_title']} ({item['source_channel']}, authority "
                    f"{item['source_authority']}, confidence {item['confidence']}) · "
                    f'"{common.normalize_ws(item["evidence_span"])}"'
                )
        for exception in entry["evidence"]["exceptions"]:
            print(
                f"exception: when {', '.join(exception['condition']) or '—'}: "
                f"{exception['effect']} "
                f"· {exception['evidence']}"
            )
        for link, label in (("supersedes", "supersedes"), ("siblings", "siblings")):
            if entry[link]:
                print(f"{label}: {', '.join(entry[link])}")
        if entry["superseded_by"]:
            print(f"superseded_by: {entry['superseded_by']}")
        for transition in entry["transitions"]:
            before = transition["before"]["probability"] if transition["before"] else "—"
            decay = transition.get("decay")
            print(
                f"transition: {transition['timestamp']} {transition['operation']} "
                f"{before} → {transition['after']['probability']} "
                f"({transition['after']['status']}) "
                f"· {transition['reason']}" + (f" · factor {decay['factor']}" if decay else "")
            )
    return 0


def cmd_status(layout: common.Layout, args: argparse.Namespace) -> int:
    state = load_state(layout) if layout.states.is_dir() else State(segment=layout.segment)
    views = build_views(state)
    snapshot = json.loads(views["snapshot"])
    payload: dict = {
        "arithmetic": snapshot["arithmetic"],
        "as_of": snapshot["as_of"],
        "counts": snapshot["counts"],
    }
    if args.keys:
        payload["keys"] = [
            {
                "claim_key": claim["claim_key"],
                "claim_id": claim["claim_id"],
                "status": claim["status"],
                "probability": claim["probability"],
                "conditions": claim["conditions"],
                "current_text": claim["current_text"],
            }
            for claim in sorted(
                (c for c in state.claims.values() if c["status"] not in FROZEN_STATUSES),
                key=lambda c: (c["claim_key"], c["first_seen"], c["claim_id"]),
            )
        ]
        payload["entities"] = [
            {
                "entity_id": entity["entity_id"],
                "name": entity["name"],
                "type": entity["type"],
                "aliases": entity["aliases"],
                "claims": len(entity["claim_ids"]),
            }
            for entity in build_entities(state)
        ]
    if args.json:
        print(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True))
        return 0

    counts = snapshot["counts"]
    print(f"arithmetic: {snapshot['arithmetic']} · as_of: {snapshot['as_of'] or '—'}")
    print(
        f"sources: {counts['sources']} · observations: {counts['observations']} · "
        f"transitions: {counts['transitions']} · merges: {counts['merges']} · "
        f"claims: {counts['claims']} "
        f"({', '.join(f'{k} {v}' for k, v in counts['claims_by_status'].items()) or 'none'}) · "
        f"entities: {counts['entities']} · relationships: {counts['relationships']} · "
        f"pages: {counts['pages']} · unresolved_conflicts: {counts['unresolved_conflicts']}"
    )
    if args.keys:
        print("\nclaim keys (live claims):")
        for entry in payload["keys"]:
            conditions = f" [{', '.join(entry['conditions'])}]" if entry["conditions"] else ""
            print(
                f"  {entry['claim_key']} · {entry['status']} · "
                f"p {entry['probability']}{conditions} · "
                f"{entry['current_text']}"
            )
        print("\nentities:")
        for entry in payload["entities"]:
            aliases = f" (aliases: {', '.join(entry['aliases'])})" if entry["aliases"] else ""
            print(
                f"  {entry['entity_id']} · {entry['type']} · {entry['name']}{aliases} · "
                f"{entry['claims']} claims"
            )
    return 0


# ------------------------------------------------------------------------ queue / review


def cmd_queue(layout: common.Layout, args: argparse.Namespace) -> int:
    # The queue reads what the replay reads: a retracted register leaves its archive
    # unregistered, and a retracted apply leaves its source unextracted.
    retracted = common.retracted_runs(layout)
    sources = common.read_sources(layout, retracted)
    extracted = {row["source_id"] for row in common.read_observations(layout, retracted)}
    archives = (
        sorted(layout.rel(path) for path in layout.raw.rglob("*.md") if path.is_file())
        if layout.raw.is_dir()
        else []
    )
    unregistered: list[dict] = []
    unextracted: list[dict] = []
    excluded: list[dict] = []
    registers = accepted_levels(layout.segment)
    for rel in archives:
        channel = common.channel_of(rel)
        if channel not in common.AUTHORITY:
            continue
        meta, _ = common.read_frontmatter(layout.abs(rel))
        sensitivity = str(meta.get("sensitivity", "internal")).lower()
        if sensitivity not in registers:
            excluded.append({"path": rel, "sensitivity": sensitivity})
            continue
        lane = "light" if channel in LIGHT_CHANNELS else "deep"
        source_id = "src_" + common.short_hash(rel)
        if source_id not in sources:
            unregistered.append({"path": rel, "channel": channel, "lane": lane})
            continue
        if source_id not in extracted:
            unextracted.append(
                {"path": rel, "channel": channel, "lane": lane, "source_id": source_id}
            )

    if args.json:
        print(
            json.dumps(
                {
                    "unregistered": unregistered,
                    "unextracted": unextracted,
                    "excluded": excluded,
                    "total": len(unregistered) + len(unextracted),
                },
                indent=2,
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 0

    if not (unregistered or unextracted or excluded):
        print("queue: empty")
        return 0
    print(
        f"queue: {len(unregistered)} unregistered · {len(unextracted)} unextracted · "
        f"{len(excluded)} excluded"
    )
    for row in unregistered:
        print(f"  unregistered {row['path']} · {row['channel']} · {row['lane']}")
    for row in unextracted:
        print(
            f"  unextracted  {row['path']} · {row['channel']} · {row['lane']} · {row['source_id']}"
        )
    for row in excluded:
        print(f"  excluded     {row['path']} · {row['sensitivity']}")
    return 0


REVIEW_REASONS = ("disputed", "contradicted", "stale", "duplicate", "archived")


def review_since(state: State, claim: dict, reason: str) -> str:
    """The date of the row that last gave the claim its reason for review."""
    if reason in ("stale", "archived") and claim["last_decayed_at"]:
        return common.decay_date(state.transitions, claim)
    if reason == "duplicate":
        return common.date_of(claim["first_seen"])
    operation = (
        "contradiction_update" if reason in ("disputed", "contradicted") else "human_override"
    )
    dates = [
        common.date_of(transition["timestamp"])
        for transition in state.transitions
        if transition["claim_id"] == claim["claim_id"] and transition["operation"] == operation
    ]
    return dates[-1] if dates else common.date_of(claim["last_confirmed_at"])


def creating_run(state: State, claim_id: str) -> str | None:
    """The run whose transition created a claim — what tells two duplicates apart."""
    for transition in state.transitions:
        if transition["claim_id"] == claim_id and transition["operation"] in (
            "new_claim",
            "scope_split",
        ):
            return transition.get("run_id")
    return None


def duplicate_pairs(state: State) -> dict[str, str]:
    """Live claims under one key, conditions overlapping, created by two different runs.

    A union merge keeps both sides' rows, so two sessions that each opened a claim under the
    same key leave a pair only a human can settle; a scope split from one run is not one.
    """
    pairs: dict[str, str] = {}
    for claim_ids in state.claims_by_key.values():
        live = [
            state.claims[claim_id]
            for claim_id in claim_ids
            if state.claims[claim_id]["status"] not in FROZEN_STATUSES
        ]
        for index, left in enumerate(live):
            for right in live[index + 1 :]:
                if not conditions_overlap(left["conditions"], right["conditions"]):
                    continue
                left_run = creating_run(state, left["claim_id"])
                right_run = creating_run(state, right["claim_id"])
                if left_run and right_run and left_run != right_run:
                    pairs.setdefault(left["claim_id"], right["claim_id"])
                    pairs.setdefault(right["claim_id"], left["claim_id"])
    return pairs


def review_groups(state: State) -> dict[str, list[dict]]:
    """The claims behind each reason, ordered as the queue presents them; frozen ones never."""
    claims = [c for c in state.claims.values() if c["status"] not in FROZEN_STATUSES]
    duplicates = duplicate_pairs(state)
    groups = {
        "disputed": [c for c in claims if c["status"] == "disputed"],
        "contradicted": [c for c in claims if c["status"] == "active" and needs_review(state, c)],
        "stale": [c for c in claims if c["status"] == "stale"],
        "duplicate": sorted(
            (c for c in claims if c["claim_id"] in duplicates),
            key=lambda c: (c["claim_key"], c["claim_id"]),
        ),
        "archived": [c for c in claims if c["status"] == "archived"],
    }
    for reason in ("disputed", "contradicted"):
        groups[reason].sort(key=lambda c: (c["probability"], c["claim_id"]))
    for reason in ("stale", "archived"):
        groups[reason].sort(key=lambda c: (review_since(state, c, reason), c["claim_id"]))
    return groups


def review_evidence(state: State, observation_id: str) -> dict:
    record = _evidence(state, observation_id)
    return {
        "observation_id": record["observation_id"],
        "stance": record["stance"],
        "source_id": record["source_id"],
        "path": record["source_path"],
        "channel": record["source_channel"],
        "authority": record["source_authority"],
        "evidence_span": record["evidence_span"],
    }


def review_item(
    state: State,
    claim: dict,
    reason: str,
    pages: dict[str, str | None],
    duplicates: dict[str, str] | None = None,
) -> dict:
    observations = claim["supporting_observations"] + claim["contradicting_observations"]
    return {
        "duplicate_of": (duplicates or {}).get(claim["claim_id"]),
        "claim_id": claim["claim_id"],
        "claim_key": claim["claim_key"],
        "status": claim["status"],
        "probability": claim["probability"],
        "conditions": claim["conditions"],
        "current_text": claim["current_text"],
        "reason": reason,
        "since": review_since(state, claim, reason),
        "pages": [pages[entity_id] for entity_id in claim["entity_ids"] if pages.get(entity_id)],
        "evidence": [review_evidence(state, observation_id) for observation_id in observations],
    }


def _clipped(text: str, limit: int = 100) -> str:
    """One line of claim text or a span, cut with an ellipsis past `limit` characters."""
    line = common.normalize_ws(text)
    return line if len(line) <= limit else line[:limit].rstrip() + "…"


def cmd_review(layout: common.Layout, args: argparse.Namespace) -> int:
    state = load_state(layout)
    groups = review_groups(state)
    pages = {entity["entity_id"]: entity["page"] for entity in build_entities(state)}
    # A claim in two groups is one thing to judge: it takes the first reason REVIEW_REASONS
    # names, and the counts are claims, not memberships.
    seen: set[str] = set()
    assigned: dict[str, list[dict]] = {}
    for reason in REVIEW_REASONS:
        assigned[reason] = [c for c in groups[reason] if c["claim_id"] not in seen]
        seen.update(c["claim_id"] for c in assigned[reason])
    counts = {reason: len(assigned[reason]) for reason in REVIEW_REASONS}
    shown = REVIEW_REASONS if args.include_archived else REVIEW_REASONS[:4]
    duplicates = duplicate_pairs(state)
    items = [
        review_item(state, claim, reason, pages, duplicates)
        for reason in shown
        for claim in assigned[reason]
    ]
    if args.limit is not None:
        items = items[: args.limit]

    if args.json:
        print(
            json.dumps(
                {"as_of": state.newest_stamp(), "counts": counts, "items": items},
                indent=2,
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 0

    if not any(counts.values()):
        print("review: empty")
        return 0
    header = (
        f"review: {counts['disputed']} disputed · {counts['contradicted']} contradicted · "
        f"{counts['stale']} stale · {counts['duplicate']} duplicate"
    )
    if args.include_archived:
        header += f" · {counts['archived']} archived"
    else:
        header += " (archived hidden — --include-archived)"
    print(header)
    for number, item in enumerate(items, 1):
        contradicting = state.claims[item["claim_id"]]["contradicting_observations"]
        print(
            f"{number}. {item['claim_id']} · {item['claim_key']} · p {item['probability']:.2f} · "
            f"{item['status']} · {item['reason']} since {item['since']}"
        )
        print(f"   text: {_clipped(item['current_text'])}")
        print(f"   pages: {' · '.join(item['pages']) or 'none'}")
        for record in item["evidence"]:
            mark = "−" if record["observation_id"] in contradicting else "+"
            print(
                f"   {mark} {record['source_id']} ({record['channel']} · "
                f'{record["authority"]:.2f}) "{_clipped(record["evidence_span"])}"'
            )
    return 0


# ------------------------------------------------------------------- inbox / retractions


INBOX_NAME_RE = re.compile(r"^(?P<slug>.+)-(?P<stamp>\d{8}T\d{6}Z)-(?P<hex>[0-9a-f]{6})\.jsonl$")


def inbox_actor(slug: str) -> str:
    """The actor a proposal's file name carries; the slug folds `:` and `.` to `-`."""
    prefix, _, rest = slug.partition("-")
    if rest and prefix in ("human", "agent", "routine", "process"):
        return f"{prefix}:{rest}"
    return slug


def inbox_entries(layout: common.Layout) -> list[dict]:
    schemas = Schemas(layout)
    state = load_state(layout) if layout.states.is_dir() else State(segment=layout.segment)
    entries = []
    for path in inbox_files(layout):
        match = INBOX_NAME_RE.match(path.name)
        records, diagnostics = load_pending(str(path))
        diagnostics += validate_observations(layout, schemas, state, records)
        entries.append(
            {
                "name": path.name,
                "path": layout.rel(path),
                "actor": inbox_actor(match["slug"]) if match else None,
                "stamp": match["stamp"] if match else None,
                "rows": len(records),
                "valid": not diagnostics,
                "diagnostics": diagnostics,
            }
        )
    return entries


def cmd_inbox(layout: common.Layout, args: argparse.Namespace) -> int:
    entries = inbox_entries(layout)
    if args.json:
        print(json.dumps({"proposals": entries}, indent=2, ensure_ascii=False, sort_keys=True))
        return 0
    if not entries:
        print("inbox: empty")
        return 0
    invalid = sum(1 for entry in entries if not entry["valid"])
    print(f"inbox: {len(entries)} proposals · {invalid} invalid")
    for entry in entries:
        line = f"  {entry['name']} · {entry['actor'] or 'unknown'} · {entry['rows']} rows · " + (
            "valid" if entry["valid"] else "invalid"
        )
        if entry["diagnostics"]:
            line += " · " + entry["diagnostics"][0]
        print(line)
    return 0


def rows_by_run(layout: common.Layout) -> dict[str, list[tuple[str, dict]]]:
    """Every stamped ledger row, grouped by the run that appended it."""
    grouped: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for ledger, rows in ledger_rows(layout).items():
        for row in rows:
            if row.get("run_id"):
                grouped[row["run_id"]].append((ledger, row))
    return grouped


def is_belief_run(layout: common.Layout, rows: list[tuple[str, dict]]) -> bool:
    """A run carries belief when it appended observations or transitions, or a source that has them.

    Belief replays by delta from each transition's recorded snapshot, so a belief run may only
    be retracted from the top of the stack; a structural run — a merge, a register nothing has
    extracted yet — carries no such dependency and goes from any position.
    """
    if any(ledger in ("observations", "transitions") for ledger, _ in rows):
        return True
    registered = {row["source_id"] for ledger, row in rows if ledger == "sources"}
    extracted = {row["source_id"] for row in common.read_observations(layout)}
    return bool(registered & extracted)


def orphaned_sources(
    layout: common.Layout,
    grouped: dict[str, list[tuple[str, dict]]],
    retracted: set[str],
    rows: list[tuple[str, dict]],
) -> dict[str, str]:
    """The sources a run's observations cite whose registration is itself retracted.

    Maps each such source_id to the retracted register run, so a restore that would
    replay observations of an unregistered archive can be refused by name.
    """
    cited = {row["source_id"] for ledger, row in rows if ledger == "observations"}
    if not cited:
        return {}
    registered_by: dict[str, str] = {}
    for run, run_rows in grouped.items():
        for ledger, row in run_rows:
            if ledger == "sources" and row["source_id"] in cited:
                registered_by[row["source_id"]] = run
    live = {row["source_id"] for row in common.read_source_rows(layout, retracted)}
    return {source: registered_by.get(source, "unknown") for source in cited if source not in live}


def run_opened_at(rows: list[tuple[str, dict]]) -> str:
    """The stamp of a run's first row — what the stack rule orders live runs by."""
    return min(row[STAMP_FIELDS[ledger]] for ledger, row in rows)


def stranded_belief_run(
    layout: common.Layout,
    grouped: dict[str, list[tuple[str, dict]]],
    retracted: set[str],
    targets: Collection[str],
) -> str | None:
    """The newest live belief run retracting `targets` would strand above them, if any.

    Belief replays by delta from each transition's recorded snapshot, so the belief runs a
    reversal retracts have to be the top of the stack: any live belief run opened after the
    oldest of them has to go first.
    """
    live = sorted(
        (run_opened_at(rows), run)
        for run, rows in grouped.items()
        if run not in retracted and is_belief_run(layout, rows)
    )
    marked = [index for index, (_, run) in enumerate(live) if run in targets]
    if not marked:
        return None
    above = [run for _, run in live[marked[0] :] if run not in targets]
    return above[-1] if above else None


def reverse_runs(
    layout: common.Layout, run: Run, targets: list[str], action: str, by: str, reason: str
) -> bool:
    """Retract or restore every target as one step, rebuild, and say whether the views moved.

    The rows land together because the replay only holds up as a set: retracting a register
    without the run that extracted it would leave observations whose source is gone.
    """
    schemas = Schemas(layout)
    rows = []
    for target in targets:
        row = {
            "retraction_id": "rtr_" + common.short_hash(target, action, run.timestamp),
            "target_run_id": target,
            "action": action,
            "by": by,
            "reason": reason,
            "timestamp": run.timestamp,
            "run_id": run.run_id,
        }
        schemas.check("retraction", row)
        rows.append(row)
    run.append("retractions", layout.retractions, rows)
    write_views(layout, schemas, load_state(layout))
    return common.views_hash(layout) != run.views_before


def _moved(moved: bool) -> str:
    return "changed" if moved else "unchanged"


def cmd_undo(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    grouped = rows_by_run(layout)
    retracted = common.retracted_runs(layout)
    target = args.run_id
    rows = grouped.get(target)
    if not rows:
        raise Refused(f"refused: {target} is not retractable (pre-Phase-6)", 2)
    if target not in retracted:
        newest = stranded_belief_run(layout, grouped, retracted, {target})
        if newest:
            raise Refused(
                f"refused: {target} is not the newest live belief run — undo {newest} first", 2
            )
    run = session.start()
    if target in retracted:
        print("unchanged")
        session.record(run)
        return 0
    moved = reverse_runs(layout, run, [target], "retract", args.by, args.reason)
    print(f"undo: {target} retracted · rows {len(rows)} · views {_moved(moved)}")
    session.record(run)
    return 0


def cmd_redo(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    grouped = rows_by_run(layout)
    target = args.run_id
    rows = grouped.get(target)
    if not rows:
        raise Refused(f"refused: {target} is not retractable (pre-Phase-6)", 2)
    retracted = common.retracted_runs(layout)
    if target in retracted:
        missing = orphaned_sources(layout, grouped, retracted, rows)
        if missing:
            named = ", ".join(f"{source} (run {run})" for source, run in sorted(missing.items()))
            raise Refused(
                f"refused: {target} restores observations of {named} whose registration is "
                "retracted — redo the register first",
                2,
            )
    run = session.start()
    if target not in retracted:
        print("unchanged")
        session.record(run)
        return 0
    moved = reverse_runs(layout, run, [target], "restore", args.by, args.reason)
    print(f"redo: {target} restored · rows {len(rows)} · views {_moved(moved)}")
    session.record(run)
    return 0


def cmd_unmerge(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    row = next(
        (m for m in common.read_jsonl(layout.merges) if m["merge_id"] == args.merge_id), None
    )
    if row is None:
        raise EngineError(f"unknown merge: {args.merge_id}", 2)
    target = row.get("run_id")
    if not target:
        raise Refused(f"refused: {args.merge_id} is not retractable (pre-Phase-6)", 2)
    run = session.start()
    if target in common.retracted_runs(layout):
        print("unchanged")
        session.record(run)
        return 0
    rows = rows_by_run(layout)[target]
    moved = reverse_runs(layout, run, [target], "retract", args.by, args.reason)
    print(
        f"unmerge: {args.merge_id} retracted · run {target} · rows {len(rows)} · "
        f"views {_moved(moved)}"
    )
    session.record(run)
    return 0


# --------------------------------------------------------------------------- promote


def promote_target(
    layout: common.Layout, private: common.Layout, raw_path: str
) -> tuple[Path, str]:
    """The private archive and the shared path it takes: llm-wiki/private/raw/X → llm-wiki/raw/X."""
    path, rel = resolve_raw_path(private, raw_path)
    rest = rel[len(private.rel(private.raw)) + 1 :]
    return path, f"{layout.rel(layout.raw)}/{rest}"


def cmd_promote(layout: common.Layout, args: argparse.Namespace, session: Session) -> int:
    """Re-file one private archive into shared as two shared runs, then retract the private ones."""
    if layout.segment != "shared":
        raise EngineError("promote runs from the shared segment", 2)
    schemas = Schemas(layout)
    private = common.Layout(layout.root, "private")
    path, target_rel = promote_target(layout, private, args.path)
    target = layout.abs(target_rel)
    if target.exists():
        raise Refused(f"refused: {target_rel} already exists", 2)

    meta, _ = common.read_frontmatter(path)
    sensitivity = str(meta.get("sensitivity", "internal")).lower()
    if sensitivity == "secret":
        raise Refused(f"refused: {private.rel(path)} is sensitivity secret", 2)
    state = load_state(private) if private.states.is_dir() else State(segment="private")
    source_id = "src_" + common.short_hash(private.rel(path))
    carried = [
        state.observations[o]
        for o in state.observation_order
        if state.observations[o]["source_id"] == source_id
    ]
    private_rows = [o["observation_id"] for o in carried if o["privacy"] == "private"]
    if not args.as_internal and (sensitivity == "private" or private_rows):
        named = ", ".join(private_rows) or private.rel(path)
        raise Refused(f"refused: {named} carries privacy private — rerun with --as-internal", 2)

    text = path.read_text(encoding="utf-8")
    if sensitivity == "private":
        text = text.replace("sensitivity: private", "sensitivity: internal", 1)

    shared_id = "src_" + common.short_hash(target_rel)
    proposals = []
    for number, observation in enumerate(carried, 1):
        record = {
            key: value
            for key, value in observation.items()
            if key not in ("observation_id", "extracted_at", "run_id")
        }
        record["source_id"] = shared_id
        if record["privacy"] == "private":
            record["privacy"] = "internal"
        proposals.append((number, record))

    carried_ids = {o["observation_id"] for o in carried}
    source_rows = [state.sources[source_id]] if source_id in state.sources else []
    carried_transitions = [
        transition
        for transition in common.read_jsonl(private.transitions)
        if transition.get("observation_id") in carried_ids
    ]
    targets = sorted(
        {row["run_id"] for row in source_rows + carried + carried_transitions if row.get("run_id")}
    )
    stranded = stranded_belief_run(
        private, rows_by_run(private), common.retracted_runs(private), targets
    )
    if stranded:
        raise Refused(
            f"refused: {private.rel(path)} sits under a newer live private belief run — "
            f"undo {stranded} first",
            2,
        )

    # Nothing moves until the shared segment accepts what the archive carries: the source row
    # the registration will write, over the text the copy will land.
    provisional = load_state(layout) if layout.states.is_dir() else State(segment=layout.segment)
    if proposals:
        provisional.sources[shared_id] = {
            **state.sources[source_id],
            "source_id": shared_id,
            "path": target_rel,
        }
    diagnostics = validate_observations(layout, schemas, provisional, proposals, {target_rel: text})
    if diagnostics:
        for line in diagnostics:
            print(line)
        return 2

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")
    print(f"promoted: {private.rel(path)} → {target_rel}")

    # The shared registration, as this promote run — cmd_register reads its own flags only.
    registration = argparse.Namespace(
        verb="register", path=target_rel, created_at=None, authority=None, by=None, title=None
    )
    cmd_register(layout, registration, session)

    apply_run = session.start(file_input(layout, target))
    apply_records(layout, session, schemas, load_state(layout), proposals, apply_run)

    # The shared lock is already held; the private one is taken inside it, never the reverse.
    with common.hold_lock(private, session.actor, session.verb, session.policy["lock_timeout_s"]):
        private_run = session.start(layout=private)
        reason = f"{args.reason} — promoted to {target_rel}"
        reverse_runs(private, private_run, targets, "retract", args.by, reason)
        print(f"private: retracted {' · '.join(targets) or 'nothing'}")
        session.record(private_run)
    return 0


# --------------------------------------------------------------------------- cli


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="state.py", description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--root", help="repo root holding llm-wiki/ (default: cwd or $LLM_WIKI_ROOT)"
    )
    parser.add_argument(
        "--segment",
        choices=common.SEGMENTS,
        help="which segment to read and write (default: shared or $LLM_WIKI_SEGMENT)",
    )
    parser.add_argument(
        "--actor",
        help=f"who runs this write (default: $LLM_WIKI_ACTOR or {common.DEFAULT_ACTOR})",
    )
    verbs = parser.add_subparsers(dest="verb", required=True)

    register = verbs.add_parser("register", help="register a raw archive; prints its source_id")
    register.add_argument("path")
    register.add_argument(
        "--created-at", dest="created_at", help="the source's own date when the archive shows none"
    )
    register.add_argument("--authority", type=float)
    register.add_argument("--by")
    register.add_argument("--title")
    register.set_defaults(run=cmd_register)

    validate = verbs.add_parser("validate", help="check an observation file; writes nothing")
    validate.add_argument("file")
    validate.set_defaults(run=cmd_validate)

    apply = verbs.add_parser("apply", help="validate, then land observations as transitions")
    apply.add_argument("file", nargs="?")
    apply.add_argument(
        "--inbox", action="store_true", help="drain states/inbox/ in name order, one run per file"
    )
    apply.add_argument("--dry-run", action="store_true")
    apply.set_defaults(run=cmd_apply)

    inbox = verbs.add_parser("inbox", help="the proposals waiting in states/inbox/")
    inbox.add_argument("--json", action="store_true")
    inbox.set_defaults(run=cmd_inbox)

    decay = verbs.add_parser("decay", help="age unconfirmed claims toward the prior as of a time")
    decay.add_argument("--as-of", dest="as_of", help="YYYY-MM-DDTHH:MM:SSZ (default: now)")
    decay.add_argument("--dry-run", action="store_true")
    decay.add_argument("--json", action="store_true")
    decay.set_defaults(run=cmd_decay)

    merge = verbs.add_parser("merge", help="fold one entity into another; a human judgment")
    merge.add_argument("from_entity")
    merge.add_argument("into_entity")
    merge.add_argument("--by", required=True)
    merge.add_argument("--reason", required=True)
    merge.set_defaults(run=cmd_merge)

    unmerge = verbs.add_parser("unmerge", help="undo the run that merged two entities")
    unmerge.add_argument("merge_id")
    unmerge.add_argument("--by", required=True)
    unmerge.add_argument("--reason", required=True)
    unmerge.set_defaults(run=cmd_unmerge)

    undo = verbs.add_parser("undo", help="retract a run; the replay then skips its rows")
    undo.add_argument("run_id")
    undo.add_argument("--by", required=True)
    undo.add_argument("--reason", required=True)
    undo.set_defaults(run=cmd_undo)

    redo = verbs.add_parser("redo", help="lift the newest retraction of a run")
    redo.add_argument("run_id")
    redo.add_argument("--by", required=True)
    redo.add_argument("--reason", required=True)
    redo.set_defaults(run=cmd_redo)

    promote = verbs.add_parser("promote", help="re-file a private archive into the shared segment")
    promote.add_argument("path")
    promote.add_argument("--by", required=True)
    promote.add_argument("--reason", required=True)
    promote.add_argument(
        "--as-internal",
        dest="as_internal",
        action="store_true",
        help="reclassify the archive and its private observations as internal",
    )
    promote.set_defaults(run=cmd_promote)

    rebuild = verbs.add_parser("rebuild", help="replay the ledgers into the views")
    rebuild.add_argument(
        "--check", action="store_true", help="compare only; exit 1 on any difference"
    )
    rebuild.set_defaults(run=cmd_rebuild)

    slice_ = verbs.add_parser("slice", help="the state slice behind an entity, key, or page")
    target = slice_.add_mutually_exclusive_group(required=True)
    target.add_argument("--entity")
    target.add_argument("--claim-key")
    target.add_argument("--page")
    slice_.add_argument("--json", action="store_true")
    slice_.set_defaults(run=cmd_slice)

    status = verbs.add_parser(
        "status", help="snapshot counts; --keys lists claim keys and entities"
    )
    status.add_argument("--json", action="store_true")
    status.add_argument("--keys", action="store_true")
    status.set_defaults(run=cmd_status)

    queue = verbs.add_parser("queue", help="raw archives no source registers or extracts yet")
    queue.add_argument("--json", action="store_true")
    queue.set_defaults(run=cmd_queue)

    review = verbs.add_parser("review", help="the claim-level review queue behind the views")
    review.add_argument("--json", action="store_true")
    review.add_argument("--include-archived", dest="include_archived", action="store_true")
    review.add_argument("--limit", type=int, help="cap the items shown; the counts stay whole")
    review.set_defaults(run=cmd_review)

    audit = verbs.add_parser("audit", help="the write runs recorded in states/audit_log.jsonl")
    selector = audit.add_mutually_exclusive_group()
    selector.add_argument("--last", type=int, help="show only the newest N runs")
    selector.add_argument("--run", dest="run_id", help="show one run with its full row")
    selector.add_argument(
        "--check", action="store_true", help="prove every stamped ledger row joins its run"
    )
    audit.add_argument("--json", action="store_true")
    audit.set_defaults(run=cmd_audit)
    return parser


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    args = build_parser().parse_args(argv)
    try:
        layout = common.layout_from(args.root, args.segment)
        return run_write(layout, args, argv) if is_write(args) else args.run(layout, args)
    except common.LockHeld as error:
        print(str(error), file=sys.stderr)
        return 3
    except Refused as error:
        print(str(error), file=sys.stderr)
        return error.code
    except EngineError as error:
        print(f"error: {error}", file=sys.stderr)
        return error.code
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
