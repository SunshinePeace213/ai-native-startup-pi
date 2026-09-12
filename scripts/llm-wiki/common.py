"""Shared by scripts/llm-wiki/state.py (the engine), scripts/llm-wiki/render.py,
scripts/llm-wiki/graph.py, and scripts/llm-wiki/retrieve.py.

Layout, the named constants, ledger and view I/O, entity resolution, the span, hash,
time, and page-path helpers, the run machinery (policy, lock, audit rows, views hash),
graph loading and walks, and transition dates the four scripts need. No CLI; imported
as ``common`` from ``scripts/llm-wiki/``. The constants are mirrored as code spans in
docs/llm-wiki/state.md and a drift test keeps the two equal.
"""

from __future__ import annotations

import fcntl
import hashlib
import json
import math
import os
import re
import tempfile
import time
from collections.abc import Collection, Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

import yaml

ARITHMETIC = "log-odds-v2"
PRIOR_LOG_ODDS = 0.0
S_MAX = 0.98
P_ACTIVE = 0.70
P_ARCHIVE = 0.55
RECENCY_HALF_LIFE_DAYS = 730
RECENCY_FLOOR = 0.3
RECENCY_UNKNOWN = 1.0
DECAY_MIN_DELTA = 0.005
EXTRACTION_QUALITY = 1.0
HUMAN_AUTHORITY = 1.0
MIN_CLAIMS_PER_PAGE = 2
AUTHORITY = {
    "docs": 0.90,
    "papers": 0.85,
    "books": 0.80,
    "meetings": 0.75,
    "articles": 0.70,
    "code-sessions": 0.65,
    "notes": 0.60,
    "chats": 0.55,
    "screenshots": 0.50,
}
CHANNEL_DECAY_PROFILE = {
    "docs": "external_fact",
    "papers": "external_fact",
    "books": "external_fact",
    "articles": "external_fact",
    "meetings": "meeting_note",
    "code-sessions": "implementation_detail",
    "notes": "default",
    "chats": "default",
    "screenshots": "default",
}
DECAY_HALF_LIFE_DAYS = {
    "architecture_decision": 730,
    "external_fact": 730,
    "default": 365,
    "user_preference": 365,
    "project_status": 120,
    "meeting_note": 120,
    "implementation_detail": 90,
    "bug_report": 30,
}
# The names the state rule mirrors, in the order its Arithmetic section lists them.
ARITHMETIC_CONSTANTS = (
    "ARITHMETIC",
    "PRIOR_LOG_ODDS",
    "S_MAX",
    "P_ACTIVE",
    "P_ARCHIVE",
    "RECENCY_HALF_LIFE_DAYS",
    "RECENCY_FLOOR",
    "RECENCY_UNKNOWN",
    "DECAY_MIN_DELTA",
    "EXTRACTION_QUALITY",
    "HUMAN_AUTHORITY",
    "MIN_CLAIMS_PER_PAGE",
    "AUTHORITY",
    "CHANNEL_DECAY_PROFILE",
    "DECAY_HALF_LIFE_DAYS",
)

# The extraction contract's predicate vocabulary and the subset `impact` walks:
# reverse — a change in the object reaches the subject; forward — the subject's
# change reaches the object; both — either way.
CANONICAL_PREDICATES = (
    "part_of",
    "uses",
    "depends_on",
    "produces",
    "extends",
    "replaces",
    "contradicts",
    "authored",
    "owns",
    "applies_to",
    "cites",
    "related_to",
)
IMPACT_DIRECTION = {
    "uses": "reverse",
    "depends_on": "reverse",
    "extends": "reverse",
    "applies_to": "reverse",
    "cites": "reverse",
    "part_of": "both",
    "produces": "forward",
}
# View-build mapping of every predicate the ledgers carry onto the canonical set;
# a word absent here falls to related_to and `graph check` notes it.
PREDICATE_CANON = {
    **{predicate: predicate for predicate in CANONICAL_PREDICATES},
    "records": "produces",
    "triggers": "produces",
    "appends_to": "produces",
    "builds": "produces",
    "performs": "produces",
    "updates": "applies_to",
    "constrains": "applies_to",
    "resolves": "applies_to",
    "tracks": "applies_to",
    "estimates": "applies_to",
    "protects": "applies_to",
    "routes": "applies_to",
    "serves": "applies_to",
    "enforces": "applies_to",
    "qualifies": "applies_to",
    "compensates_for": "applies_to",
    "keeps_warm": "applies_to",
    "renders": "depends_on",
    "compiled_from": "depends_on",
    "extracted_from": "depends_on",
    "extended": "extends",
    "reinforces": "extends",
    "derived_from": "extends",
    "carries": "uses",
    "operates_on": "uses",
    "invokes": "uses",
    "searches": "uses",
    "consumes": "uses",
    "recorded_in": "part_of",
    "travels_with": "part_of",
    "runs_independently_of": "related_to",
    "contrasts_with": "related_to",
    "degrades": "related_to",
    "stored_as": "related_to",
    "outperforms": "related_to",
}
RELATED_EDGE_LIMIT = 12

SHELVES = {
    "concept": "concepts",
    "project": "projects",
    "person": "people",
    "decision": "decisions",
    "system": "systems",
    "workflow": "workflows",
    "question": "questions",
}
LIVE_STATUSES = frozenset({"candidate", "active", "disputed", "stale"})
TIMESTAMP_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
VIEW_NAMES = ("claims", "entities", "relationships", "unresolved_conflicts", "snapshot")
LEDGER_NAMES = ("sources", "observations", "transitions", "merges", "retractions")
SEGMENTS = ("shared", "private")
DEFAULT_ACTOR = "agent:unattributed"
ACTOR_RE = re.compile(r"^(human|agent|routine|process):[a-z0-9][a-z0-9._-]*$")
LOCK_POLL_S = 0.05


@dataclass(frozen=True)
class Layout:
    """Every path of the layer, under one repo root and one segment."""

    root: Path
    segment: str = "shared"

    @property
    def base(self) -> Path:
        """The segment's own root — llm-wiki/ shared, llm-wiki/private/ private."""
        shared = self.root / "llm-wiki"
        return shared / "private" if self.segment == "private" else shared

    @property
    def raw(self) -> Path:
        return self.base / "raw"

    @property
    def schemas(self) -> Path:
        """Always the shared segment's — both segments record the same shapes."""
        return self.root / "llm-wiki" / "schemas"

    @property
    def policy(self) -> Path:
        """Always the shared segment's — one tracked policy governs both."""
        return self.root / "llm-wiki" / "governance.json"

    @property
    def states(self) -> Path:
        return self.base / "states"

    @property
    def sources(self) -> Path:
        return self.states / "sources.jsonl"

    @property
    def observations_dir(self) -> Path:
        return self.states / "observations"

    def observations_file(self, source_id: str) -> Path:
        return self.observations_dir / f"{source_id}.jsonl"

    @property
    def transitions(self) -> Path:
        return self.states / "transitions.jsonl"

    @property
    def merges(self) -> Path:
        return self.states / "merges.jsonl"

    @property
    def inbox(self) -> Path:
        return self.states / "inbox"

    @property
    def audit_log(self) -> Path:
        return self.states / "audit_log.jsonl"

    @property
    def retractions(self) -> Path:
        return self.states / "retractions.jsonl"

    @property
    def lock(self) -> Path:
        return self.states / ".lock"

    def view(self, name: str) -> Path:
        suffix = ".json" if name == "snapshot" else ".jsonl"
        return self.states / f"{name}{suffix}"

    @property
    def wiki(self) -> Path:
        return self.base / "wiki"

    @property
    def index(self) -> Path:
        return self.wiki / "index.md"

    @property
    def log(self) -> Path:
        return self.wiki / "log.md"

    def rel(self, path: Path | str) -> str:
        """A repo-relative POSIX path — the form every record and citation carries."""
        candidate = Path(path)
        if candidate.is_absolute():
            candidate = candidate.resolve().relative_to(self.root.resolve())
        return candidate.as_posix()

    def abs(self, rel_path: str) -> Path:
        return self.root / rel_path


def layout_from(root: str | Path | None, segment: str | None = None) -> Layout:
    chosen = segment or os.environ.get("LLM_WIKI_SEGMENT") or "shared"
    if chosen not in SEGMENTS:
        raise ValueError(f"segment {chosen!r} is not one of {', '.join(SEGMENTS)}")
    return Layout(Path(root or os.environ.get("LLM_WIKI_ROOT") or ".").resolve(), chosen)


def channel_of(rel: str) -> str:
    """The raw channel folder of a repo-relative archive path, in either segment."""
    parts = rel.split("/")
    if "raw" not in parts:
        return ""
    under_raw = parts[parts.index("raw") + 1 :]
    return under_raw[0] if under_raw else ""


def now() -> str:
    """The wall clock as a ledger timestamp; LLM_WIKI_NOW pins it for reproducible runs."""
    pinned = os.environ.get("LLM_WIKI_NOW")
    return pinned or datetime.now(UTC).strftime(TIMESTAMP_FORMAT)


def date_of(timestamp: str) -> str:
    return timestamp[:10]


def parse_timestamp(value: str) -> datetime:
    """A ledger timestamp (`YYYY-MM-DDTHH:MM:SSZ`) or a bare date, as an aware UTC datetime."""
    if len(value) == 10:
        return datetime.combine(date.fromisoformat(value), datetime.min.time(), tzinfo=UTC)
    return datetime.strptime(value, TIMESTAMP_FORMAT).replace(tzinfo=UTC)


def bump_stamp(timestamp: str) -> str:
    """One second past a ledger timestamp."""
    return (parse_timestamp(timestamp) + timedelta(seconds=1)).strftime(TIMESTAMP_FORMAT)


def elapsed_days(since: str, until: str) -> float:
    return (parse_timestamp(until) - parse_timestamp(since)).total_seconds() / 86400


def short_hash(*parts: str) -> str:
    return hashlib.sha256("\x1f".join(parts).encode("utf-8")).hexdigest()[:12]


def file_hash(path: Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


# --------------------------------------------------------------------------- arithmetic


def recency_weight(created_at: str | None, extracted_at: str) -> float:
    """§7.2 recency from the source's age at observation time; neutral when undated."""
    if not created_at:
        return RECENCY_UNKNOWN
    age = (date.fromisoformat(extracted_at[:10]) - date.fromisoformat(created_at[:10])).days
    return max(RECENCY_FLOOR, 0.5 ** (max(age, 0) / RECENCY_HALF_LIFE_DAYS))


def decay_factor(elapsed: float, profile: str) -> float:
    """The multiplier decay applies to log-odds after `elapsed` days on a profile."""
    return 0.5 ** (elapsed / DECAY_HALF_LIFE_DAYS[profile])


def logit(probability: float) -> float:
    return math.log(probability / (1.0 - probability))


def stale_after(log_odds: float, since: str, profile: str) -> date | None:
    """The date a claim left unconfirmed since `since` crosses P_ACTIVE; None at or below it."""
    threshold = logit(P_ACTIVE)
    if log_odds <= threshold:
        return None
    days = DECAY_HALF_LIFE_DAYS[profile] * math.log2(log_odds / threshold)
    return (parse_timestamp(since) + timedelta(days=days)).date()


def canonical_predicate(word: str) -> str:
    return PREDICATE_CANON.get(word, "related_to")


# --------------------------------------------------------------------------- transitions


def supersession_date(transitions: list[dict], claim_id: str) -> str | None:
    for transition in transitions:
        if transition["claim_id"] == claim_id and transition["operation"] in (
            "supersession",
            "human_override",
        ):
            return date_of(transition["timestamp"])
    return None


def decay_date(transitions: list[dict], claim: dict) -> str:
    """When the claim reached its status: its status-changing decay row, else last_decayed_at."""
    for transition in reversed(transitions):
        if (
            transition["claim_id"] == claim["claim_id"]
            and transition["operation"] == "decay_update"
            and transition["after"]["status"] == claim["status"]
            and transition["before"]["status"] != claim["status"]
        ):
            return date_of(transition["timestamp"])
    return date_of(claim["last_decayed_at"])


# --------------------------------------------------------------------------- I/O


def dumps(record: object) -> str:
    return json.dumps(record, ensure_ascii=False, sort_keys=True)


def read_jsonl(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    records = []
    with path.open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{number}: invalid JSON ({exc.msg})") from exc
    return records


def write_text_if_changed(path: Path, text: str) -> bool:
    """Atomic write (temp + rename) that leaves an already-identical file untouched.

    `mkstemp` opens at 0600; views and pages are 0644, so the mode is set before the rename.
    """
    data = text.encode("utf-8")
    if path.is_file() and path.read_bytes() == data:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
        os.chmod(tmp_name, 0o644)
        os.replace(tmp_name, path)
    except BaseException:
        Path(tmp_name).unlink(missing_ok=True)
        raise
    return True


def jsonl_text(records: list[dict]) -> str:
    return "".join(dumps(record) + "\n" for record in records)


def append_jsonl(path: Path, records: list[dict]) -> None:
    if not records:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(jsonl_text(records))


def fold_order(records: list[dict], stamp: str, skip: Collection[str] = ()) -> list[dict]:
    """Ledger rows in `(timestamp, run_id, file order)`, minus the runs `skip` retracts.

    The sort is stable, so rows of one run keep the order it wrote them and a union merge in
    either order folds to the same views: two runs that share a stamp are ordered by their id,
    and a run never shares a stamp with the state it read (see the engine's `run_stamp`). A row
    with no `run_id` is never skipped.
    """
    return sorted(
        (record for record in records if record.get("run_id") not in skip),
        key=lambda record: (record[stamp], record.get("run_id") or ""),
    )


def read_source_rows(layout: Layout, skip: Collection[str] = ()) -> list[dict]:
    """Every registration row of the sources ledger, in replay order."""
    return fold_order(read_jsonl(layout.sources), "ingested_at", skip)


def read_sources(layout: Layout, skip: Collection[str] = ()) -> dict[str, dict]:
    """The sources ledger in replay order, folded to its latest row per source_id."""
    latest: dict[str, dict] = {}
    for row in read_source_rows(layout, skip):
        latest[row["source_id"]] = row
    return latest


def read_observations(layout: Layout, skip: Collection[str] = ()) -> list[dict]:
    """Every observation in the ledgers, in replay order; the per-source files break ties."""
    records: list[dict] = []
    if layout.observations_dir.is_dir():
        for path in sorted(layout.observations_dir.glob("*.jsonl")):
            records.extend(read_jsonl(path))
    return fold_order(records, "extracted_at", skip)


def read_transitions(layout: Layout, skip: Collection[str] = ()) -> list[dict]:
    return fold_order(read_jsonl(layout.transitions), "timestamp", skip)


def read_merges(layout: Layout, skip: Collection[str] = ()) -> list[dict]:
    return fold_order(read_jsonl(layout.merges), "timestamp", skip)


def read_retractions(layout: Layout) -> list[dict]:
    """The retraction ledger in replay order; a retraction is itself never retracted."""
    return fold_order(read_jsonl(layout.retractions), "timestamp")


def retracted_runs(layout: Layout) -> set[str]:
    """The runs whose last retraction row says `retract` — the ones replay skips."""
    action_of: dict[str, str] = {}
    for row in read_retractions(layout):
        action_of[row["target_run_id"]] = row["action"]
    return {target for target, action in action_of.items() if action == "retract"}


def read_view(layout: Layout, name: str) -> list[dict]:
    return read_jsonl(layout.view(name))


def read_snapshot(layout: Layout) -> dict | None:
    path = layout.view("snapshot")
    return json.loads(path.read_text(encoding="utf-8")) if path.is_file() else None


# --------------------------------------------------------------------------- runs


class LockHeld(Exception):
    """`states/.lock` is held by another run past the policy's timeout."""

    def __init__(self, path: str, holder: dict):
        self.path = path
        self.holder = holder
        super().__init__(
            f"locked: {path} held by pid {holder.get('pid', '?')} "
            f"({holder.get('actor', '?')} {holder.get('verb', '?')}) "
            f"since {holder.get('since', '?')}"
        )


def views_hash(layout: Layout) -> str | None:
    """The five views as one digest: `sha256:` + sha256 of their own sha256 hex digests,
    sorted and joined by a newline. None when the segment has no states/ yet."""
    if not layout.states.is_dir():
        return None
    digests = [
        hashlib.sha256(path.read_bytes()).hexdigest()
        for name in VIEW_NAMES
        if (path := layout.view(name)).is_file()
    ]
    return "sha256:" + hashlib.sha256("\n".join(sorted(digests)).encode("utf-8")).hexdigest()


def run_id(
    actor: str, verb: str, timestamp: str, input_hashes: list[str], views_before: str | None
) -> str:
    return "run_" + short_hash(actor, verb, timestamp, ",".join(input_hashes), views_before or "")


def load_policy(layout: Layout) -> dict:
    """The tracked access-control policy every write verb is checked against."""
    if not layout.policy.is_file():
        raise ValueError(f"policy missing: {layout.rel(layout.policy)}")
    return json.loads(layout.policy.read_text(encoding="utf-8"))


def role_of(policy: dict, actor: str) -> str:
    """The actor's role: `actors[actor]`, else its own prefix."""
    return policy["actors"].get(actor) or actor.split(":", 1)[0]


def allowed(policy: dict, role: str, verb: str, segment: str) -> bool:
    grant = policy["roles"].get(role)
    if grant is None:
        return False
    return ("*" in grant["verbs"] or verb in grant["verbs"]) and segment in grant["segments"]


def audit_row(
    run: str,
    *,
    timestamp: str,
    actor: str,
    role: str,
    verb: str,
    segment: str,
    args: list[str],
    outcome: str,
    inputs: list[dict],
    appended: dict[str, int],
    views_before: str | None,
    views_after: str | None,
    pages: dict | None = None,
    detail: str | None = None,
) -> dict:
    """One row of the audit ledger — the record of a write run or a denial."""
    return {
        "run_id": run,
        "timestamp": timestamp,
        "actor": actor,
        "role": role,
        "verb": verb,
        "segment": segment,
        "args": list(args),
        "outcome": outcome,
        "inputs": inputs,
        "appended": {name: appended.get(name, 0) for name in LEDGER_NAMES},
        "pages": pages or {"written": [], "removed": []},
        "views_before": views_before,
        "views_after": views_after,
        "detail": detail,
    }


def append_audit(layout: Layout, row: dict) -> None:
    """The one file under states/ both the engine and the renderer append to."""
    append_jsonl(layout.audit_log, [row])


def lock_holder(path: Path) -> dict:
    """Whatever the lock file says about its holder; an empty mapping when it says nothing."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


@contextmanager
def hold_lock(layout: Layout, actor: str, verb: str, timeout_s: float) -> Iterator[None]:
    """Serialize the writers on `states/.lock`, polling until `timeout_s`, then LockHeld.

    The holder is written inside the file on acquire; the flock is released on exit and the
    file stays, so a crashed holder leaves only a stale record the kernel has already freed.
    """
    path = layout.lock
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = path.open("a+", encoding="utf-8")
    try:
        deadline = time.monotonic() + timeout_s
        while True:
            try:
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except OSError:
                if time.monotonic() >= deadline:
                    raise LockHeld(layout.rel(path), lock_holder(path)) from None
                time.sleep(LOCK_POLL_S)
        try:
            handle.seek(0)
            handle.truncate()
            handle.write(
                dumps({"pid": os.getpid(), "actor": actor, "verb": verb, "since": now()}) + "\n"
            )
            handle.flush()
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    finally:
        handle.close()


def split_frontmatter(text: str) -> tuple[dict, str]:
    """(frontmatter mapping, body); ({}, text) when the file opens with no fence."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    try:
        meta = yaml.safe_load(text[4:end])
    except yaml.YAMLError:
        return {}, text
    return (meta if isinstance(meta, dict) else {}), text[end + 5 :]


def read_frontmatter(path: Path) -> tuple[dict, str]:
    return split_frontmatter(path.read_text(encoding="utf-8", errors="replace"))


# --------------------------------------------------------------------------- spans


def normalize_ws(text: str) -> str:
    """Whitespace runs collapsed to one space — the only normalization a span gets."""
    return " ".join(text.split())


def normalize_condition(text: str) -> str:
    return normalize_ws(text).lower().strip(" .;,")


def find_span(span: str, text: str, window: int = 80) -> tuple[bool, str]:
    """Whether span occurs verbatim in text; on a miss, the nearest archive window.

    The window anchors on the longest leading word run of the span that the archive
    still contains, so the extractor sees where its quote diverged.
    """
    haystack = normalize_ws(text)
    needle = normalize_ws(span)
    if needle and needle in haystack:
        return True, ""
    words = needle.split()
    for count in range(min(len(words), 6), 0, -1):
        anchor = " ".join(words[:count])
        position = haystack.find(anchor)
        if position != -1:
            start = max(0, position - window)
            end = min(len(haystack), position + len(anchor) + window)
            return False, haystack[start:end]
    return False, ""


# --------------------------------------------------------------------------- entities


def entity_id_for(name: str) -> str:
    """Name lowercased, runs of non-alphanumerics collapsed to `_`, under the ent_ prefix."""
    return "ent_" + re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def fold_mentions(canonical_of: dict[str, str], observation: dict) -> None:
    """Register one observation's entity mentions in the resolution map.

    A mention's normalized name resolves to the first-seen entity whose name or alias it
    equals, else starts a new entity; its aliases then point at that entity unless an
    earlier entity already claimed them. Ledger order makes the first spelling canonical.
    """
    for entry in observation["entities"]:
        entity_id = entity_id_for(entry["name"])
        canonical = canonical_of.setdefault(entity_id, entity_id)
        for alias in entry.get("aliases", []):
            canonical_of.setdefault(entity_id_for(alias), canonical)


def apply_merge(canonical_of: dict[str, str], merge: dict) -> None:
    """Point every id that resolves to the merge's `from` at its `into`, chains included."""
    source = canonical_of.get(merge["from_entity"], merge["from_entity"])
    target = canonical_of.get(merge["into_entity"], merge["into_entity"])
    for key, value in canonical_of.items():
        if value == source:
            canonical_of[key] = target


def resolve_entities(observations: list[dict], merges: list[dict]) -> dict[str, str]:
    """Normalized id → canonical entity id: mentions, then merges, each in ledger order."""
    canonical_of: dict[str, str] = {}
    for observation in observations:
        fold_mentions(canonical_of, observation)
    for merge in merges:
        apply_merge(canonical_of, merge)
    return canonical_of


def slug_for(entity_id: str) -> str:
    return entity_id.removeprefix("ent_").replace("_", "-")


def page_path(
    entity_type: str, entity_id: str, live_claims: int, segment: str = "shared"
) -> str | None:
    """The segment's wiki/<shelf>/<slug>.md at or above MIN_CLAIMS_PER_PAGE, else None."""
    if live_claims < MIN_CLAIMS_PER_PAGE:
        return None
    wiki = "llm-wiki/private/wiki" if segment == "private" else "llm-wiki/wiki"
    return f"{wiki}/{SHELVES[entity_type]}/{slug_for(entity_id)}.md"


# --------------------------------------------------------------------------- graph


@dataclass(frozen=True)
class Step:
    """One edge as a walk crossed it: out of `origin` (its subject) or into it."""

    hop: int
    origin: str
    edge: dict
    direction: str
    other: str


@dataclass
class Graph:
    entities: dict[str, dict]
    edges: list[dict]
    claims: dict[str, dict]
    sources: dict[str, dict]
    observations: list[dict]
    touching: dict[str, list[tuple[dict, str]]] = field(default_factory=dict)


def load_graph(layout: Layout) -> Graph:
    graph = Graph(
        entities={e["entity_id"]: e for e in read_view(layout, "entities")},
        edges=read_view(layout, "relationships"),
        claims={c["claim_id"]: c for c in read_view(layout, "claims")},
        sources=read_sources(layout),
        observations=read_observations(layout),
    )
    for edge in graph.edges:
        graph.touching.setdefault(edge["subject_entity"], []).append((edge, "out"))
        graph.touching.setdefault(edge["object_entity"], []).append((edge, "in"))
    return graph


def walk(graph: Graph, seeds: list[str], hops: int, allows) -> list[Step]:
    """BFS over the edges `allows` accepts, in either direction, visiting each entity once."""
    visited = set(seeds)
    frontier = list(seeds)
    steps: list[Step] = []
    for hop in range(1, hops + 1):
        reached: dict[str, None] = {}
        for origin in frontier:
            for edge, direction in graph.touching.get(origin, []):
                other = edge["object_entity"] if direction == "out" else edge["subject_entity"]
                if other in visited or not allows(edge, direction):
                    continue
                steps.append(Step(hop, origin, edge, direction, other))
                reached[other] = None
        if not reached:
            break
        visited |= reached.keys()
        frontier = list(reached)
    return steps


def shortest_path(graph: Graph, start: str, target: str, max_hops: int) -> list[Step] | None:
    if start == target:
        return []
    previous: dict[str, Step] = {}
    visited = {start}
    frontier = [start]
    for hop in range(1, max_hops + 1):
        reached: dict[str, Step] = {}
        for origin in frontier:
            for edge, direction in graph.touching.get(origin, []):
                other = edge["object_entity"] if direction == "out" else edge["subject_entity"]
                if other in visited or other in reached:
                    continue
                reached[other] = Step(hop, origin, edge, direction, other)
        if not reached:
            return None
        previous.update(reached)
        visited |= reached.keys()
        if target in reached:
            chain: list[Step] = []
            node = target
            while node != start:
                chain.append(previous[node])
                node = previous[node].origin
            return list(reversed(chain))
        frontier = list(reached)
    return None
