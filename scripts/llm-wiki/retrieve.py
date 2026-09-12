#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["jsonschema>=4.23", "pyyaml>=6"]
# ///
"""The llm-wiki retriever — read-only hybrid search over the state layer.

    search "<question>" [--segment S] [--intent I] [--streams S,…] [--collections C,…]
           [--hops N] [--history] [--status S …] [--min-probability X] [-n N]
           [--explain] [--json]
    eval [--cases PATH] [--json]
    check

Four streams answer a question — qmd's BM25 and vector indexes over the pages and the
archives, a walk over the relationship view, and an in-memory Okapi BM25 over the claims
— and each yields one ranked list of claim ids. Reciprocal rank fusion votes on those
ranks under the intent's weights from llm-wiki/retrieval/fusion_config.json, and a
deterministic rerank multiplies in the belief the state already holds. `search` reads the
union of both segments whenever llm-wiki/private/states/ exists and tags every lead with
its scope; --segment (env LLM_WIKI_SEGMENT) narrows it to one, and `eval` and `check` read
the shared segment only whatever that variable says. The script writes nothing: the engine
owns llm-wiki/states/ and the renderer owns the shelves. Every verb takes
--root <repo-root>; LLM_WIKI_QMD names the qmd binary, else PATH, else the corpus streams
are skipped with their reason and `search` still exits 0.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field, replace
from pathlib import Path

import common
from jsonschema import Draft202012Validator

DESCRIPTION = (__doc__ or "").split("\n\n")[0]
CONFIG_PATH = "llm-wiki/retrieval/fusion_config.json"
SCHEMA_PATH = "llm-wiki/schemas/fusion_config.schema.json"
CLAIM_SCHEMA_PATH = "llm-wiki/schemas/claim.schema.json"
CASES_PATH = "llm-wiki/evals/retrieval_cases.jsonl"
CORPUS_DIRS = ("llm-wiki/raw", "llm-wiki/wiki")
STREAM_ORDER = ("bm25", "vec", "graph", "state")
CORPUS_STREAMS = ("bm25", "vec")
# Every qmd collection the config may name, as (kind, repo-relative prefix); a hit in a
# collection absent here reaches no claim.
COLLECTION_PATHS = {
    "wiki": ("wiki", "llm-wiki/wiki"),
    "raw": ("raw", "llm-wiki/raw"),
    "private-wiki": ("wiki", "llm-wiki/private/wiki"),
    "private-raw": ("raw", "llm-wiki/private/raw"),
}
DEFAULT_INTENT = "factual"
DEFAULT_LIMIT = 10
FAMILIES = ("exact-token", "paraphrase", "structure", "history", "current-fact", "flags")
EXPECTATIONS = ("expect_claims", "expect_keys", "expect_pages", "expect_flag")
FLAT_LIMIT = 400
SPAN_LIMIT = 240
SEED_TOKEN_LENGTH = 3
MIN_STEM = 3
MIN_SUFFIX_STEM = 4
MIN_PREFIX = 3
PATH_PAIR_LIMIT = 4
PATH_HOPS = 2
FALLBACK_WINDOW = 40
BM25_K1 = 1.2
BM25_B = 0.75
QUOTES = "\"'‘’“”"
CLAIM_LINE = re.compile(r"^- `(clm_[0-9a-f]{12})` — ")
CHUNK_HEADER = re.compile(r"@@ -(\d+),(\d+) @@")
WORD = re.compile(r"[a-z0-9]+")
STOPWORDS = frozenset(
    word
    for line in (
        "a about above after again against all am an and any are as at be because been",
        "before being below between both but by can cannot could did do does doing down",
        "during each few for from further had has have having he her here hers herself",
        "him himself his how i if in into is it its itself just me more most my myself no",
        "nor not of off on once only or other others ought our ours ourselves out over",
        "same she should so some such than that the their theirs them themselves then there",
        "these they this those through to too under until up very was we were what when",
        "where which while who whom why will with would you your yours yourself yourselves",
    )
    for word in line.split()
)


class ConfigError(Exception):
    """A missing or unusable fusion config — both search and check exit 1 naming the path."""


# --------------------------------------------------------------------------- config


def load_schema(layout: common.Layout) -> dict:
    path = layout.abs(SCHEMA_PATH)
    if not path.is_file():
        raise ConfigError(f"missing schema: {SCHEMA_PATH}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_config(layout: common.Layout) -> dict:
    path = layout.abs(CONFIG_PATH)
    if not path.is_file():
        raise ConfigError(f"missing config: {CONFIG_PATH}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ConfigError(f"invalid config: {CONFIG_PATH} ({error.msg})") from error


def config_findings(config: dict, schema: dict) -> list[str]:
    """One FAIL line per schema violation — the schema's own `required` names every key."""
    validator = Draft202012Validator(schema)
    return [
        f"FAIL {'.'.join(str(part) for part in error.absolute_path) or '$'}: {error.message}"
        for error in sorted(validator.iter_errors(config), key=lambda e: list(e.absolute_path))
    ]


def claim_statuses(layout: common.Layout) -> set[str]:
    """Every status the claim schema names — the candidate universe under --history."""
    path = layout.abs(CLAIM_SCHEMA_PATH)
    if not path.is_file():
        raise ConfigError(f"missing schema: {CLAIM_SCHEMA_PATH}")
    schema = json.loads(path.read_text(encoding="utf-8"))
    return set(schema["properties"]["status"]["enum"])


def load_config(layout: common.Layout) -> dict:
    config = read_config(layout)
    findings = config_findings(config, load_schema(layout))
    if findings:
        raise ConfigError(f"invalid config: {CONFIG_PATH}\n" + "\n".join(findings))
    return config


# --------------------------------------------------------------------------- the vault


@dataclass
class Vault:
    layout: common.Layout
    claims: dict[str, dict]
    entities: dict[str, dict]
    relationships: list[dict]
    sources: dict[str, dict]
    observations: dict[str, dict]
    transitions: list[dict]
    as_of: str | None
    graph: common.Graph
    segments: list[str] = field(default_factory=lambda: ["shared"])
    entity_of_page: dict[str, str] = field(default_factory=dict)
    claims_of_entity: dict[str, list[str]] = field(default_factory=dict)
    claims_of_observation: dict[str, list[str]] = field(default_factory=dict)
    source_of_path: dict[str, str] = field(default_factory=dict)
    documents: dict[str, list[str]] = field(default_factory=dict)
    files: dict[str, list[str]] = field(default_factory=dict)

    def lines(self, rel_path: str) -> list[str]:
        """The file's lines, read once; an unreadable path reads as empty."""
        if rel_path not in self.files:
            path = self.layout.abs(rel_path)
            text = path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""
            self.files[rel_path] = text.splitlines()
        return self.files[rel_path]

    def document(self, claim_id: str) -> list[str]:
        """The claim's searchable tokens: key, text, conditions, exceptions, entities, spans."""
        if claim_id not in self.documents:
            claim = self.claims[claim_id]
            parts = [
                " ".join(re.split(r"[._-]", claim["claim_key"])),
                claim["current_text"],
                *claim["conditions"],
                *(exception["effect"] for exception in claim["exceptions"]),
            ]
            for entity_id in claim["entity_ids"]:
                entity = self.entities.get(entity_id)
                if entity:
                    parts += [entity["name"], *entity["aliases"]]
            for observation_id in claim["supporting_observations"]:
                observation = self.observations.get(observation_id)
                if observation:
                    parts.append(observation["evidence_span"])
            self.documents[claim_id] = [fold(token) for token in tokenize(" ".join(parts))]
        return self.documents[claim_id]


def union(*lists: list[str]) -> list[str]:
    """The lists concatenated, each value kept once at its first appearance."""
    return list(dict.fromkeys(value for one in lists for value in one))


def entity_pages(entity: dict) -> list[str]:
    """The pages an entity renders — one per segment once the union merged two records."""
    merged = entity.get("pages")
    if merged is not None:
        return merged
    return [entity["page"]] if entity["page"] else []


def merge_entity(kept: dict | None, entity: dict) -> dict:
    """One entity id across the segments: claim ids, aliases, and pages unioned."""
    if kept is None:
        return {**entity, "pages": entity_pages(entity)}
    return {
        **kept,
        "claim_ids": union(kept["claim_ids"], entity["claim_ids"]),
        "aliases": union(kept["aliases"], entity["aliases"]),
        "pages": union(kept["pages"], entity_pages(entity)),
    }


def merge_graphs(graphs: list[common.Graph]) -> common.Graph:
    """The segments as one graph: entities merged by id, the rest unioned by id.

    Claims, sources, and edges keep the first segment's row on an id collision, so the
    shared segment stays authoritative wherever the two ever name the same record.
    """
    merged = common.Graph(entities={}, edges=[], claims={}, sources={}, observations=[])
    seen: set[str] = set()
    for graph in graphs:
        for claim_id, claim in graph.claims.items():
            merged.claims.setdefault(claim_id, claim)
        for source_id, source in graph.sources.items():
            merged.sources.setdefault(source_id, source)
        merged.observations.extend(graph.observations)
        for edge in graph.edges:
            if edge["relationship_id"] not in seen:
                seen.add(edge["relationship_id"])
                merged.edges.append(edge)
        for entity_id, entity in graph.entities.items():
            merged.entities[entity_id] = merge_entity(merged.entities.get(entity_id), entity)
    for edge in merged.edges:
        merged.touching.setdefault(edge["subject_entity"], []).append((edge, "out"))
        merged.touching.setdefault(edge["object_entity"], []).append((edge, "in"))
    return merged


def load_vault(layout: common.Layout, segments: list[str] | None = None) -> Vault:
    """The layout's own segment, or the union of `segments` — one vault either way."""
    names = segments or [layout.segment]
    layouts = [replace(layout, segment=name) for name in names]
    graphs = [common.load_graph(one) for one in layouts]
    graph = graphs[0] if len(graphs) == 1 else merge_graphs(graphs)
    snapshots = [common.read_snapshot(one) for one in layouts]
    stamps = [snapshot["as_of"] for snapshot in snapshots if snapshot and snapshot.get("as_of")]
    vault = Vault(
        layout=layout,
        claims=graph.claims,
        entities=graph.entities,
        relationships=graph.edges,
        sources=graph.sources,
        observations={o["observation_id"]: o for o in graph.observations},
        transitions=[row for one in layouts for row in common.read_transitions(one)],
        as_of=max(stamps, default=None),
        graph=graph,
        segments=names,
    )
    for entity_id, entity in vault.entities.items():
        for page in entity_pages(entity):
            vault.entity_of_page.setdefault(page, entity_id)
    for claim_id, claim in vault.claims.items():
        for entity_id in claim["entity_ids"]:
            vault.claims_of_entity.setdefault(entity_id, []).append(claim_id)
        evidence = [
            *claim["supporting_observations"],
            *claim["contradicting_observations"],
            *(exception["evidence"] for exception in claim["exceptions"]),
        ]
        for observation_id in evidence:
            vault.claims_of_observation.setdefault(observation_id, []).append(claim_id)
    for source_id, source in vault.sources.items():
        vault.source_of_path.setdefault(source["path"], source_id)
    for edges in graph.touching.values():
        edges.sort(key=lambda pair: (-pair[0]["probability"], pair[0]["relationship_id"]))
    return vault


# --------------------------------------------------------------------------- the question


def flatten(question: str) -> str:
    """One line, quotes stripped, cut at 400 characters — the form qmd receives."""
    stripped = "".join(" " if character in QUOTES else character for character in question)
    return common.normalize_ws(stripped)[:FLAT_LIMIT].strip()


def normalize_words(text: str) -> str:
    """Lowercased words with every other character collapsed to one space."""
    return " ".join(WORD.findall(text.lower()))


def tokenize(text: str) -> list[str]:
    return [word for word in WORD.findall(text.lower()) if word not in STOPWORDS]


def fold(token: str) -> str:
    """One plural rule then one suffix rule — the state stream's only normalization."""
    stem = token
    if len(token) > 4 and token.endswith("ies"):
        stem = token[:-3] + "y"
    elif token.endswith("sses"):
        stem = token[:-2]
    elif token.endswith("s") and not token.endswith(("ss", "us", "is")) and len(token) > MIN_STEM:
        stem = token[:-1]
    if stem.endswith("ing") and len(stem) - 3 >= MIN_SUFFIX_STEM:
        return stem[:-3]
    if stem.endswith("ed") and len(stem) - 2 >= MIN_SUFFIX_STEM:
        return stem[:-2]
    return stem


def query_tokens(question: str) -> list[str]:
    return list(dict.fromkeys(tokenize(question)))


# --------------------------------------------------------------------------- qmd


@dataclass
class Fetch:
    """One corpus stream's raw qmd output: the all-terms hits, then the per-token lists."""

    ran: bool = False
    reason: str | None = None
    partial: list[str] = field(default_factory=list)
    queries: list[str] = field(default_factory=list)
    hits: list[dict] = field(default_factory=list)
    token_hits: list[list[dict]] = field(default_factory=list)

    def every_hit(self) -> list[dict]:
        """Every hit the stream saw — the all-terms pool first, then each token's."""
        return [*self.hits, *(hit for hits in self.token_hits for hit in hits)]


def qmd_binary() -> str | None:
    return os.environ.get("LLM_WIKI_QMD") or shutil.which("qmd")


def run_qmd(binary: str, args: list[str], timeout: float) -> tuple[list[dict] | None, str | None]:
    """(hits, skip reason) — qmd prints one JSON array on stdout and its progress on stderr."""
    # The retriever is always unattended (the extension, a subagent, the eval): tell qmd
    # so, or a local config it does not trust prints a prompt to stdout ahead of the JSON
    # and every stream that reads it fails as "invalid JSON".
    env = {**os.environ, "QMD_TRUST_LOCAL_CONFIG": "1"}
    try:
        done = subprocess.run(  # noqa: S603 — the binary comes from LLM_WIKI_QMD or PATH
            [binary, *args], capture_output=True, text=True, timeout=timeout, env=env
        )
    except subprocess.TimeoutExpired:
        return None, f"timeout {timeout} s"
    except OSError:
        return None, "qmd not found"
    if done.returncode != 0:
        return None, f"exit {done.returncode}"
    try:
        payload = json.loads(done.stdout)
    except json.JSONDecodeError:
        return None, "invalid JSON"
    if not isinstance(payload, list):
        return None, "invalid JSON"
    return payload, None


def search_args(query: str, collection: str, pool: int) -> list[str]:
    return ["search", query, "-c", collection, "--format", "json", "-n", str(pool)]


def vector_args(query: str, collection: str, pool: int) -> list[str]:
    return [
        "query",
        f"vec: {query}",
        "-c",
        collection,
        "--format",
        "json",
        "-n",
        str(pool),
        "--no-rerank",
    ]


def pooled(rows: list[tuple[int, dict]]) -> list[dict]:
    """One query's hits across the collections, best qmd score first — collection, then docid."""
    ordered = sorted(
        rows,
        key=lambda row: (-float(row[1].get("score") or 0.0), row[0], row[1].get("docid") or ""),
    )
    return [hit for _, hit in ordered]


def one_query(
    fetch: Fetch, binary: str, build, query: str, collections: list[str], config: dict
) -> list[dict] | None:
    """The pooled hits of one query over every collection, or None when all of them failed.

    A collection that fails records its reason and leaves the others' hits standing.
    """
    rows: list[tuple[int, dict]] = []
    answered = 0
    for index, collection in enumerate(collections):
        args = build(query, collection, config["pool"])
        fetch.queries.append(args[1])
        hits, reason = run_qmd(binary, args, config["timeout_s"])
        if hits is None:
            note = f"{collection}: {reason}"
            if note not in fetch.partial:
                fetch.partial.append(note)
            continue
        answered += 1
        rows += [(index, hit) for hit in hits]
    return pooled(rows) if answered else None


def fetch_corpus(
    stream: str,
    binary: str | None,
    collections: list[str],
    flat: str,
    tokens: list[str],
    config: dict,
) -> Fetch:
    """The stream's qmd calls: one per collection, then one per token when the pool is thin."""
    fetch = Fetch()
    if binary is None:
        fetch.reason = "qmd not found"
        return fetch
    build = search_args if stream == "bm25" else vector_args
    hits = one_query(fetch, binary, build, flat, collections, config)
    if hits is None:
        fetch.reason = ", ".join(dict.fromkeys(one.split(": ", 1)[1] for one in fetch.partial))
        return fetch
    fetch.hits = hits
    fetch.ran = True
    if stream != "bm25" or len(fetch.hits) >= config["min_hits"]:
        return fetch
    for token in tokens:
        merged = one_query(fetch, binary, build, token, collections, config)
        if merged is not None:
            fetch.token_hits.append(merged)
    return fetch


# --------------------------------------------------------------------------- hit mapping


def hit_path(hit: dict) -> tuple[str, str] | None:
    """(kind, repo-relative path) for a `qmd://<collection>/<rest>` hit, else None.

    `private-wiki` and `private-raw` land under llm-wiki/private/; a collection the map
    does not carry reaches nothing.
    """
    location = hit.get("file") or ""
    if not location.startswith("qmd://"):
        return None
    collection, _, rest = location.removeprefix("qmd://").partition("/")
    mapped = COLLECTION_PATHS.get(collection)
    if mapped is None or not rest:
        return None
    kind, prefix = mapped
    return kind, f"{prefix}/{rest}"


def chunk_window(hit: dict) -> tuple[int, int]:
    """The hit's 1-based line span: the snippet's @@ header, else 40 lines from the hit."""
    line = max(int(hit.get("line") or 1), 1)
    match = CHUNK_HEADER.search(hit.get("snippet") or "")
    if not match:
        return line, line + FALLBACK_WINDOW
    start, count = int(match.group(1)), int(match.group(2))
    return min(line, start), max(line, start) + count


def page_claim(vault: Vault, rel_path: str, line: int) -> str | None:
    """The claim named by the nearest claim-id line at or before the hit's line."""
    found = None
    for number, text in enumerate(vault.lines(rel_path), 1):
        if number > line:
            break
        match = CLAIM_LINE.match(text)
        if match:
            found = match.group(1)
    return found


def by_overlap(vault: Vault, claim_ids: list[str], tokens: set[str]) -> list[str]:
    """Most folded query tokens the claim's document holds first, then probability, then id."""
    return sorted(
        claim_ids,
        key=lambda cid: (
            -len(tokens & set(vault.document(cid))),
            -vault.claims[cid]["probability"],
            cid,
        ),
    )


def by_probability(vault: Vault, claim_ids: list[str]) -> list[str]:
    return sorted(claim_ids, key=lambda cid: (-vault.claims[cid]["probability"], cid))


def entity_claims(vault: Vault, entity_id: str, candidates: set[str]) -> list[str]:
    return [cid for cid in vault.claims_of_entity.get(entity_id, []) if cid in candidates]


def wiki_hit_claims(vault: Vault, hit: dict, rel_path: str, ctx: Context) -> list[str]:
    entity_id = vault.entity_of_page.get(rel_path)
    if entity_id is None:
        return []
    ranked: list[str] = []
    named = page_claim(vault, rel_path, max(int(hit.get("line") or 1), 1))
    if named in ctx.candidates:
        ranked.append(named)
    rest = [cid for cid in entity_claims(vault, entity_id, ctx.candidates) if cid not in ranked]
    ranked += by_overlap(vault, rest, ctx.folded_tokens)
    return ranked[: ctx.per_page_cap]


def raw_hit_claims(vault: Vault, hit: dict, rel_path: str, ctx: Context) -> list[str]:
    source_id = vault.source_of_path.get(rel_path)
    if source_id is None:
        return []
    start, end = chunk_window(hit)
    lines = vault.lines(rel_path)
    window = common.normalize_ws(
        " ".join(lines[max(start - 1 - ctx.span_slack, 0) : end + ctx.span_slack])
    )
    inside = [
        observation["observation_id"]
        for observation in vault.observations.values()
        if observation["source_id"] == source_id
        and common.normalize_ws(observation["evidence_span"]) in window
    ]
    reached: list[str] = []
    for observation_id in inside:
        for claim_id in vault.claims_of_observation.get(observation_id, []):
            if claim_id in ctx.candidates and claim_id not in reached:
                reached.append(claim_id)
    if not reached:
        sourced = [
            cid
            for cid, claim in vault.claims.items()
            if cid in ctx.candidates and source_id in claim["source_ids"]
        ]
        return by_overlap(vault, sourced, ctx.folded_tokens)[: ctx.per_page_cap]
    return by_probability(vault, reached)[: ctx.per_page_cap]


def hit_claims(vault: Vault, hit: dict, ctx: Context) -> list[str]:
    """The claims one qmd hit reaches — through a rendered page, or through an archive."""
    located = hit_path(hit)
    if located is None:
        return []
    kind, rel_path = located
    if kind == "wiki":
        return wiki_hit_claims(vault, hit, rel_path, ctx)
    return raw_hit_claims(vault, hit, rel_path, ctx)


def rank_hits(vault: Vault, hits: list[dict], ctx: Context) -> tuple[list[str], list[dict]]:
    """Hit rank is the major order, the claims within one hit the minor; best rank wins."""
    ranked: list[str] = []
    trace: list[dict] = []
    for hit in hits:
        produced = hit_claims(vault, hit, ctx)
        trace.append({"hit": hit, "claims": produced})
        for claim_id in produced:
            if claim_id not in ranked:
                ranked.append(claim_id)
    return ranked, trace


def merge_by_rank(lists: list[list[str]], k: int) -> list[str]:
    """Reciprocal-rank merge of several ranked lists — the per-token fallback's vote."""
    scores: dict[str, float] = {}
    for ranking in lists:
        for rank, claim_id in enumerate(ranking, 1):
            scores[claim_id] = scores.get(claim_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores, key=lambda cid: (-scores[cid], cid))


# --------------------------------------------------------------------------- the streams


@dataclass
class Context:
    """What every stream needs about one question: its candidates, tokens, and caps."""

    candidates: set[str]
    tokens: list[str]
    folded_tokens: set[str]
    per_page_cap: int
    span_slack: int
    hops: int
    k: int


@dataclass
class Stream:
    ran: bool
    claims: list[str]
    reason: str | None = None
    partial: list[str] = field(default_factory=list)
    trace: dict = field(default_factory=dict)


@dataclass
class Seeds:
    """The graph stream's seed entities, and what the paths between the named ones found."""

    entities: list[str]
    paths: list[dict] = field(default_factory=list)
    path_claims: dict[str, list[str]] = field(default_factory=dict)


def corpus_stream(vault: Vault, fetch: Fetch, ctx: Context) -> Stream:
    if not fetch.ran:
        return Stream(ran=False, claims=[], reason=fetch.reason, trace={"queries": fetch.queries})
    ranked, trace = rank_hits(vault, fetch.hits, ctx)
    if fetch.token_hits:
        lists = []
        for hits in fetch.token_hits:
            token_ranked, token_trace = rank_hits(vault, hits, ctx)
            lists.append(token_ranked)
            trace += token_trace
        ranked = merge_by_rank(lists, ctx.k)
    return Stream(
        ran=True,
        claims=ranked,
        partial=fetch.partial,
        trace={"queries": fetch.queries, "hits": trace},
    )


def shared_paths(vault: Vault, named: list[str], hops: int) -> Seeds:
    """The shortest path between every pair among the first four named entities.

    Each path contributes its intermediate entities as seeds, and to each of them the
    claims its edges assert, in path order; a pair with no path contributes nothing.
    """
    found = Seeds(entities=[])
    for index, start in enumerate(named[:PATH_PAIR_LIMIT]):
        for target in named[index + 1 : PATH_PAIR_LIMIT]:
            steps = common.shortest_path(vault.graph, start, target, max(hops, PATH_HOPS))
            if steps is None:
                continue
            via = [step.other for step in steps[:-1]]
            claims = [cid for step in steps for cid in step.edge["claim_ids"]]
            found.paths.append({"from": start, "to": target, "via": via})
            for entity_id in via:
                if entity_id not in found.entities:
                    found.entities.append(entity_id)
                known = found.path_claims.setdefault(entity_id, [])
                known += [cid for cid in claims if cid not in known]
    return found


def graph_seeds(
    vault: Vault, question: str, fetches: dict[str, Fetch], config: dict, hops: int
) -> Seeds:
    """Entities the question names, the paths between them, then the top corpus pages."""
    asked = normalize_words(question)
    named: list[str] = []
    for entity_id, entity in vault.entities.items():
        for name in (entity["name"], *entity["aliases"]):
            normal = normalize_words(name)
            if len(normal) < SEED_TOKEN_LENGTH:
                continue
            if re.search(rf"(?<![a-z0-9]){re.escape(normal)}(?![a-z0-9])", asked):
                named.append(entity_id)
                break
    found = shared_paths(vault, named, hops) if len(named) > 1 else Seeds(entities=[])
    seeds = named + [entity_id for entity_id in found.entities if entity_id not in named]
    pages: list[str] = []
    for stream in CORPUS_STREAMS:
        if stream not in fetches:
            continue
        for hit in fetches[stream].every_hit():
            located = hit_path(hit)
            if located is None or located[0] != "wiki":
                continue
            rel_path = located[1]
            if rel_path in vault.entity_of_page and rel_path not in pages:
                pages.append(rel_path)
    for rel_path in pages[: config["seed_hits"]]:
        entity_id = vault.entity_of_page[rel_path]
        if entity_id not in seeds:
            seeds.append(entity_id)
    return replace(found, entities=seeds)


def graph_stream(vault: Vault, seeds: Seeds, ctx: Context, max_fanout: int) -> Stream:
    touching = {eid: edges[:max_fanout] for eid, edges in vault.graph.touching.items()}
    graph = replace(vault.graph, touching=touching)
    steps = common.walk(graph, seeds.entities, ctx.hops, lambda edge, direction: True)
    reached: dict[str, tuple[int, float]] = {}
    for step in steps:
        rank = (step.hop, -step.edge["probability"])
        if step.other not in reached or rank < reached[step.other]:
            reached[step.other] = rank
    order = list(seeds.entities) + sorted(
        (entity_id for entity_id in reached if entity_id not in seeds.entities),
        key=lambda e: (*reached[e], vault.entities[e]["name"], e),
    )
    ranked: list[str] = []
    trace: list[dict] = []
    for entity_id in order:
        asserted = [cid for cid in seeds.path_claims.get(entity_id, []) if cid in ctx.candidates]
        rest = [
            cid for cid in entity_claims(vault, entity_id, ctx.candidates) if cid not in asserted
        ]
        produced = (asserted + by_overlap(vault, rest, ctx.folded_tokens))[: ctx.per_page_cap]
        trace.append(
            {
                "entity_id": entity_id,
                "hop": 0 if entity_id in seeds.entities else reached[entity_id][0],
                "claims": produced,
            }
        )
        for claim_id in produced:
            if claim_id not in ranked:
                ranked.append(claim_id)
    return Stream(
        ran=True,
        claims=ranked,
        trace={"seeds": seeds.entities, "paths": seeds.paths, "hits": trace},
    )


def prefix_matches(token: str, holders: dict[str, set[str]]) -> list[str]:
    """The vocabulary a folded query token reaches: every token it prefixes, else itself."""
    if len(token) < MIN_PREFIX:
        return [token] if token in holders else []
    return sorted(word for word in holders if word.startswith(token))


def state_stream(vault: Vault, ctx: Context) -> Stream:
    """Okapi BM25 over one document per candidate claim, rebuilt from the views each run."""
    documents = {cid: vault.document(cid) for cid in sorted(ctx.candidates)}
    total = len(documents)
    if not total:
        return Stream(ran=True, claims=[], trace={"tokens": ctx.tokens, "hits": []})
    average = sum(len(tokens) for tokens in documents.values()) / total
    holders: dict[str, set[str]] = {}
    for claim_id, tokens in documents.items():
        for token in set(tokens):
            holders.setdefault(token, set()).add(claim_id)
    expanded: list[tuple[list[str], int]] = []
    for token in dict.fromkeys(fold(word) for word in ctx.tokens):
        matched = prefix_matches(token, holders)
        appearances = len({cid for word in matched for cid in holders[word]})
        expanded.append((matched, appearances))
    scores: dict[str, float] = {}
    for claim_id, tokens in documents.items():
        length = len(tokens)
        score = 0.0
        for matched, appearances in expanded:
            frequency = sum(tokens.count(word) for word in matched)
            if not frequency:
                continue
            idf = math.log(1 + (total - appearances + 0.5) / (appearances + 0.5))
            norm = frequency + BM25_K1 * (1 - BM25_B + BM25_B * length / average)
            score += idf * frequency * (BM25_K1 + 1) / norm
        if score > 0:
            scores[claim_id] = score
    ranked = sorted(scores, key=lambda cid: (-scores[cid], -vault.claims[cid]["probability"], cid))
    return Stream(
        ran=True,
        claims=ranked,
        trace={
            "tokens": ctx.tokens,
            "hits": [{"claim_id": cid, "score": round(scores[cid], 6)} for cid in ranked],
        },
    )


# --------------------------------------------------------------------------- fusion


@dataclass
class Scored:
    ranks: dict[str, int]
    rrf: float
    belief: float
    status_factor: float
    final: float


def belief_of(vault: Vault, claim: dict, rerank: dict) -> float:
    recency = (
        common.recency_weight(claim["last_confirmed_at"], vault.as_of)
        if vault.as_of
        else common.RECENCY_UNKNOWN
    )
    cap = rerank["support_cap"]
    support = min(len(claim["supporting_observations"]), cap) / cap
    return (
        1.0
        + rerank["probability"] * claim["probability"]
        + rerank["authority"] * claim["source_authority_weight"]
        + rerank["recency"] * recency
        + rerank["support"] * support
    )


def fuse(streams: dict[str, Stream], weights: dict[str, float], k: int) -> dict[str, float]:
    scores: dict[str, float] = {}
    for name, stream in streams.items():
        for rank, claim_id in enumerate(stream.claims, 1):
            scores[claim_id] = scores.get(claim_id, 0.0) + weights[name] / (k + rank)
    return scores


def rank_of(streams: dict[str, Stream], claim_id: str) -> dict[str, int]:
    ranks = {}
    for name in STREAM_ORDER:
        stream = streams.get(name)
        if stream and claim_id in stream.claims:
            ranks[name] = stream.claims.index(claim_id) + 1
    return ranks


# --------------------------------------------------------------------------- search


@dataclass
class Options:
    intent: str
    streams: list[str]
    collections: dict[str, list[str]]
    hops: int
    history: bool
    statuses: set[str] | None
    min_probability: float | None
    limit: int


@dataclass
class Result:
    question: str
    intent: str
    history: bool
    as_of: str | None
    k: int
    streams: dict[str, Stream]
    ordered: list[str]
    scored: dict[str, Scored]
    corpus: list[str]
    hidden_by_history: int


def candidate_ids(vault: Vault, history: bool) -> set[str]:
    statuses = claim_statuses(vault.layout) if history else set(common.LIVE_STATUSES)
    return {cid for cid, claim in vault.claims.items() if claim["status"] in statuses}


def run_search(
    vault: Vault, config: dict, question: str, opts: Options, with_corpus: bool = False
) -> Result:
    flat = flatten(question)
    tokens = query_tokens(question)
    seed_tokens = [t for t in tokens if len(t) >= SEED_TOKEN_LENGTH][: config["max_tokens"]]
    binary = qmd_binary()
    fetches = {
        name: fetch_corpus(name, binary, opts.collections[name], flat, seed_tokens, config)
        for name in CORPUS_STREAMS
        if name in opts.streams
    }
    ctx = Context(
        candidates=candidate_ids(vault, opts.history),
        tokens=tokens,
        folded_tokens={fold(token) for token in tokens},
        per_page_cap=config["per_page_cap"],
        span_slack=config["span_slack"],
        hops=opts.hops,
        k=config["k"],
    )
    streams = build_streams(vault, config, question, opts, fetches, ctx)

    profile = config["intents"][opts.intent]
    scores = fuse(streams, profile["weights"], config["k"])
    table = config["status_factor"]["historical" if opts.history else "default"]
    scored: dict[str, Scored] = {}
    for claim_id, rrf in scores.items():
        claim = vault.claims[claim_id]
        belief = belief_of(vault, claim, config["rerank"])
        factor = table[claim["status"]]
        scored[claim_id] = Scored(
            ranks=rank_of(streams, claim_id),
            rrf=round(rrf, 6),
            belief=round(belief, 6),
            status_factor=factor,
            final=round(rrf * belief * factor, 6),
        )
    ordered = sorted(scored, key=lambda cid: (-scored[cid].final, cid))
    ordered = [cid for cid in ordered if keeps(vault.claims[cid], opts)][: opts.limit]

    corpus: list[str] = []
    if with_corpus:
        corpus_streams = {n: s for n, s in streams.items() if n in CORPUS_STREAMS}
        corpus_scores = fuse(corpus_streams, dict.fromkeys(CORPUS_STREAMS, 1.0), config["k"])
        corpus = sorted(corpus_scores, key=lambda cid: (-corpus_scores[cid], cid))

    hidden = 0
    if not ordered and not opts.history:
        wide_ctx = replace(ctx, candidates=candidate_ids(vault, True))
        wide = state_stream(vault, wide_ctx).claims
        hidden = sum(1 for cid in wide if keeps(vault.claims[cid], opts) and cid not in scores)

    return Result(
        question=question,
        intent=opts.intent,
        history=opts.history,
        as_of=vault.as_of,
        k=config["k"],
        streams=streams,
        ordered=ordered,
        scored=scored,
        corpus=corpus,
        hidden_by_history=hidden,
    )


def build_streams(
    vault: Vault,
    config: dict,
    question: str,
    opts: Options,
    fetches: dict[str, Fetch],
    ctx: Context,
) -> dict[str, Stream]:
    streams: dict[str, Stream] = {}
    for name in STREAM_ORDER:
        if name not in opts.streams:
            continue
        if name in CORPUS_STREAMS:
            streams[name] = corpus_stream(vault, fetches[name], ctx)
        elif name == "graph":
            seeds = graph_seeds(vault, question, fetches, config, ctx.hops)
            streams[name] = graph_stream(vault, seeds, ctx, config["max_fanout"])
        else:
            streams[name] = state_stream(vault, ctx)
    return streams


def keeps(claim: dict, opts: Options) -> bool:
    if opts.statuses is not None and claim["status"] not in opts.statuses:
        return False
    return opts.min_probability is None or claim["probability"] >= opts.min_probability


# --------------------------------------------------------------------------- presentation


def counted(count: int, noun: str) -> str:
    return f"{count} {noun}" if count == 1 else f"{count} {noun}s"


def flags_of(vault: Vault, claim: dict) -> list[str]:
    flags = ["*[needs_review]*"] if claim["needs_review"] else []
    status = claim["status"]
    if status == "disputed":
        flags.append("*[disputed]*")
    elif status == "rejected":
        flags.append("*[rejected]*")
    elif status == "stale":
        flags.append(f"*[stale since {common.decay_date(vault.transitions, claim)}]*")
    elif status == "archived":
        flags.append(f"*[archived {common.decay_date(vault.transitions, claim)}]*")
    elif status == "superseded":
        when = common.supersession_date(vault.transitions, claim["claim_id"])
        marker = f"superseded {when}" if when else "superseded"
        flags.append(f"*[{marker} → {claim['superseded_by']}]*")
    return flags


def pages_of(vault: Vault, claim: dict) -> list[str]:
    pages: list[str] = []
    for entity_id in claim["entity_ids"]:
        entity = vault.entities.get(entity_id)
        if entity is None:
            continue
        for page in entity_pages(entity):
            if page not in pages:
                pages.append(page)
    return pages


def quoted(text: str) -> str:
    flat = common.normalize_ws(text)
    return flat if len(flat) <= SPAN_LIMIT else flat[: SPAN_LIMIT - 1].rstrip() + "…"


def evidence_record(vault: Vault, observation_id: str) -> dict:
    """The record `slice` prints: the observation, its stance, and its source."""
    observation = vault.observations[observation_id]
    source = vault.sources.get(observation["source_id"], {})
    human = observation["extractor"]["model"].startswith("human:")
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
        "source_authority": (common.HUMAN_AUTHORITY if human else source.get("source_authority")),
    }


def evidence_of(vault: Vault, claim: dict, limit: int) -> list[dict]:
    return [
        evidence_record(vault, observation_id)
        for observation_id in claim["supporting_observations"][:limit]
        if observation_id in vault.observations
    ]


def result_edges(vault: Vault, result: Result) -> list[dict]:
    """The typed edges among the entities the result's claims name, highest probability first."""
    entity_ids = {
        entity_id
        for claim_id in result.ordered
        for entity_id in vault.claims[claim_id]["entity_ids"]
    }
    edges = [
        edge
        for edge in vault.relationships
        if edge["subject_entity"] in entity_ids and edge["object_entity"] in entity_ids
    ]
    edges.sort(key=lambda edge: (-edge["probability"], edge["relationship_id"]))
    return [
        {
            "relationship_id": edge["relationship_id"],
            "subject": name_of(vault, edge["subject_entity"]),
            "predicate": edge["predicate"],
            "object": name_of(vault, edge["object_entity"]),
            "probability": edge["probability"],
        }
        for edge in edges
    ]


def name_of(vault: Vault, entity_id: str) -> str:
    entity = vault.entities.get(entity_id)
    return entity["name"] if entity else entity_id


def result_pages(vault: Vault, result: Result) -> list[str]:
    pages: list[str] = []
    for claim_id in result.ordered:
        for page in pages_of(vault, vault.claims[claim_id]):
            if page not in pages:
                pages.append(page)
    return pages


def header_line(vault: Vault, result: Result, requested: list[str]) -> str:
    labels = []
    for name in requested:
        stream = result.streams[name]
        if not stream.ran:
            labels.append(f"({name} skipped: {stream.reason})")
        elif stream.partial:
            labels.append(f"({name} partial: {', '.join(stream.partial)})")
        else:
            labels.append(name)
    return (
        f'search: "{result.question}" · intent {result.intent} '
        f"· segments: {', '.join(vault.segments)} · streams {' '.join(labels)} "
        f"· as_of {result.as_of or '—'} · {counted(len(result.ordered), 'claim')}"
    )


def print_text(vault: Vault, result: Result, config: dict, requested: list[str]) -> None:
    print(header_line(vault, result, requested))
    for position, claim_id in enumerate(result.ordered, 1):
        claim = vault.claims[claim_id]
        scored = result.scored[claim_id]
        flags = "".join(" " + flag for flag in flags_of(vault, claim))
        print(
            f"{position}. {claim_id} · {claim['claim_key']} · "
            f"p {claim['probability']:.2f} · {claim['status']} · scope: {claim['scope']}{flags}"
        )
        print(f"   {claim['current_text']}")
        if claim["conditions"]:
            print(f"   when: {', '.join(claim['conditions'])}")
        pages = pages_of(vault, claim)
        print(f"   pages: {' · '.join(pages) if pages else 'none'}")
        ranks = " ".join(f"{name}#{rank}" for name, rank in scored.ranks.items())
        print(f"   streams: {ranks} · rrf {scored.rrf:.4f} · final {scored.final:.4f}")
        for record in evidence_of(vault, claim, config["evidence_per_claim"]):
            print(
                f"   evidence: {record['source_id']} {record['source_title']} "
                f"({record['source_channel']} · authority {record['source_authority']:.2f}): "
                f'"{quoted(record["evidence_span"])}"'
            )
        for exception in claim["exceptions"]:
            when = ", ".join(exception["condition"]) or "always"
            print(f"   exception — when {when}: {exception['effect']}")
    if not result.ordered and result.hidden_by_history:
        hidden = counted(result.hidden_by_history, "claim")
        verb = "matches" if result.hidden_by_history == 1 else "match"
        print(f"note: {hidden} {verb} only under --history")
    pages = result_pages(vault, result)
    if pages:
        print(f"pages: {' · '.join(pages)}")
    if "graph" in result.streams:
        edges = result_edges(vault, result)
        if edges:
            rendered = " · ".join(
                f"{edge['subject']} —{edge['predicate']}→ {edge['object']} "
                f"({edge['probability']:.2f})"
                for edge in edges
            )
            print(f"edges: {rendered}")


def json_payload(vault: Vault, result: Result, config: dict, explain: bool) -> dict:
    claims = []
    for position, claim_id in enumerate(result.ordered, 1):
        claim = vault.claims[claim_id]
        scored = result.scored[claim_id]
        claims.append(
            {
                **claim,
                "rank": position,
                "flags": flags_of(vault, claim),
                "pages": pages_of(vault, claim),
                "streams": scored.ranks,
                "rrf": scored.rrf,
                "belief": scored.belief,
                "status_factor": scored.status_factor,
                "final": scored.final,
                "evidence": evidence_of(vault, claim, config["evidence_per_claim"]),
            }
        )
    payload = {
        "question": result.question,
        "intent": result.intent,
        "segments": list(vault.segments),
        "history": result.history,
        "as_of": result.as_of,
        "k": result.k,
        "streams": {
            name: {"ran": stream.ran, "hits": len(stream.claims), "reason": stream.reason}
            for name, stream in result.streams.items()
        },
        "claims": claims,
        "hidden_by_history": result.hidden_by_history,
        "pages": result_pages(vault, result),
        "edges": result_edges(vault, result) if "graph" in result.streams else [],
    }
    if explain:
        payload["explain"] = {
            name: {**stream.trace, "claims": stream.claims}
            for name, stream in result.streams.items()
        }
    return payload


# --------------------------------------------------------------------------- eval cases


def cases_path(layout: common.Layout, given: str | None) -> Path:
    return Path(given) if given else layout.abs(CASES_PATH)


def case_label(layout: common.Layout, path: Path) -> str:
    """The cases file as the report names it — repo-relative when it lives under the root."""
    try:
        return layout.rel(path)
    except ValueError:
        return str(path)


def case_problem(case: dict, config: dict) -> str | None:
    """Why the case cannot run — the malformed-case reason `check` and `eval` both print."""
    if not case.get("case_id"):
        return "no case_id"
    if not case.get("query"):
        return "no query"
    if case.get("family") not in FAMILIES:
        return f"unknown family {case.get('family')!r}"
    intent = case.get("intent", DEFAULT_INTENT)
    if intent not in config.get("intents", {}):
        return f"unknown intent {intent!r}"
    present = [name for name in EXPECTATIONS if name in case]
    if len(present) != 1:
        return f"{len(present)} expectations — exactly one of {', '.join(EXPECTATIONS)}"
    for name in case.get("needs", []):
        if name not in STREAM_ORDER:
            return f"unknown stream {name!r} in needs"
    return None


def expectation_targets(case: dict) -> tuple[str, list[str]]:
    for name in EXPECTATIONS:
        if name in case:
            value = case[name]
            if name == "expect_flag":
                return name, [str(value.get("claim_id") or value.get("key"))]
            return name, list(value)
    return "", []


def unresolved_targets(vault: Vault, case: dict) -> list[str]:
    """Expectation targets that name nothing in the vault — a check finding and an eval failure."""
    kind, targets = expectation_targets(case)
    ids = set(vault.claims)
    keys = {claim["claim_key"] for claim in vault.claims.values()}
    pages = {page for entity in vault.entities.values() for page in entity_pages(entity)}
    known = {
        "expect_claims": ids,
        "expect_keys": keys,
        "expect_pages": pages,
        "expect_flag": ids | keys,
    }.get(kind, set())
    return [target for target in targets if target not in known]


def satisfies(vault: Vault, case: dict, claim_id: str) -> bool:
    claim = vault.claims[claim_id]
    if "expect_status" in case and claim["status"] != case["expect_status"]:
        return False
    kind, targets = expectation_targets(case)
    if kind == "expect_claims":
        return claim_id in targets
    if kind == "expect_keys":
        return claim["claim_key"] in targets
    if kind == "expect_pages":
        return bool(set(targets) & set(pages_of(vault, claim)))
    flag = case["expect_flag"]["flag"]
    named = claim_id == targets[0] or claim["claim_key"] == targets[0]
    return named and any(flag in text for text in flags_of(vault, claim))


def reciprocal_rank(vault: Vault, case: dict, ranked: list[str], k: int) -> tuple[int, float]:
    for position, claim_id in enumerate(ranked[:k], 1):
        if satisfies(vault, case, claim_id):
            return position, 1.0 / position
    return 0, 0.0


def aggregates(rows: list[dict]) -> dict:
    """The fused and corpus-alone scores over every case, and the same per family."""
    families = {}
    for family in sorted({row["family"] for row in rows if row["family"]}):
        members = [row for row in rows if row["family"] == family]
        families[family] = {
            "fused": aggregate(members, "rr"),
            "corpus_alone": aggregate(members, "corpus_alone_rr"),
        }
    return {
        "fused": aggregate(rows, "rr"),
        "corpus_alone": aggregate(rows, "corpus_alone_rr"),
        "by_family": families,
    }


def aggregate(rows: list[dict], key: str) -> dict:
    answered = sum(1 for row in rows if row[key] > 0)
    total = len(rows)
    return {
        "mrr": round(sum(row[key] for row in rows) / total, 6) if total else 0.0,
        "recall": round(answered / total, 6) if total else 0.0,
        "answered": answered,
    }


# --------------------------------------------------------------------------- verbs


def stream_selection(parser: argparse.ArgumentParser, value: str | None) -> list[str]:
    if not value:
        return list(STREAM_ORDER)
    wanted = [name.strip() for name in value.split(",") if name.strip()]
    unknown = [name for name in wanted if name not in STREAM_ORDER]
    if unknown:
        parser.error(
            f"argument --streams: invalid choice: {', '.join(unknown)} "
            f"(choose from {', '.join(STREAM_ORDER)})"
        )
    return [name for name in STREAM_ORDER if name in wanted]


def search_segments(
    parser: argparse.ArgumentParser, layout: common.Layout, chosen: str | None
) -> list[str]:
    """The segments a search reads: `--segment`, else LLM_WIKI_SEGMENT, else the union.

    The union stands only where a private segment exists; `eval` and `check` never widen
    and never read the variable.
    """
    named = chosen or os.environ.get("LLM_WIKI_SEGMENT")
    if named and named not in common.SEGMENTS:
        parser.error(
            f"LLM_WIKI_SEGMENT: invalid choice: {named!r} "
            f"(choose from {', '.join(common.SEGMENTS)})"
        )
    if named:
        return [named]
    private = replace(layout, segment="private")
    return list(common.SEGMENTS) if private.states.is_dir() else ["shared"]


def collections_for(config: dict, segments: list[str], stream: str) -> list[str]:
    """The stream's qmd collections: the configured ones, plus `private`'s for that segment."""
    chosen = list(config["collections"][stream]) if "shared" in segments else []
    private = config["collections"].get("private")
    if "private" in segments and private:
        chosen = union(chosen, private[stream])
    return chosen


def search_options(
    parser: argparse.ArgumentParser,
    config: dict,
    args: argparse.Namespace,
    segments: list[str],
) -> Options:
    if args.intent not in config["intents"]:
        parser.error(
            f"argument --intent: invalid choice: {args.intent!r} "
            f"(choose from {', '.join(sorted(config['intents']))})"
        )
    known = config["status_factor"]["default"]
    unknown = [status for status in args.status or [] if status not in known]
    if unknown:
        parser.error(
            f"argument --status: invalid choice: {', '.join(unknown)} "
            f"(choose from {', '.join(sorted(known))})"
        )
    profile = config["intents"][args.intent]
    override = [name.strip() for name in args.collections.split(",")] if args.collections else None
    return Options(
        intent=args.intent,
        streams=stream_selection(parser, args.streams),
        collections={
            name: override or collections_for(config, segments, name) for name in CORPUS_STREAMS
        },
        hops=profile["hops"] if args.hops is None else args.hops,
        history=bool(args.history or profile["history"]),
        statuses=set(args.status) if args.status else None,
        min_probability=args.min_probability,
        limit=args.n,
    )


def cmd_search(layout: common.Layout, args: argparse.Namespace) -> int:
    parser = args.parser
    config = load_config(layout)
    if not flatten(args.question):
        parser.error("argument question: empty after flattening")
    segments = search_segments(parser, layout, args.segment)
    opts = search_options(parser, config, args, segments)
    vault = load_vault(layout, segments)
    result = run_search(vault, config, args.question, opts)
    if args.json:
        print_json(json_payload(vault, result, config, args.explain))
    else:
        print_text(vault, result, config, opts.streams)
    return 0


def cmd_eval(layout: common.Layout, args: argparse.Namespace) -> int:
    config = load_config(layout)
    path = cases_path(layout, args.cases)
    if not path.is_file():
        print("note: no eval cases file")
        if args.json:
            print_json(
                {
                    "total": 0,
                    "skipped": 0,
                    "cases": [],
                    "aggregate": aggregates([]),
                    "floor": config["floor"],
                }
            )
        return 0
    vault = load_vault(layout)
    rows: list[dict] = []
    for index, case in enumerate(common.read_jsonl(path), 1):
        rows.append(eval_case(vault, config, case, index))
    payload = {
        "total": len(rows),
        "skipped": sum(1 for row in rows if row["skipped"]),
        "cases": rows,
        "aggregate": aggregates(rows),
        "floor": config["floor"],
    }
    if args.json:
        print_json(payload)
    else:
        print_eval(payload, case_label(layout, path))
    return 1 if payload["skipped"] or below_floor(payload) else 0


def below_floor(payload: dict) -> bool:
    """Whether the fused run fell under either floor the config sets."""
    fused, floor = payload["aggregate"]["fused"], payload["floor"]
    return fused["mrr"] < floor["mrr"] or fused["recall"] < floor["recall"]


def eval_case(vault: Vault, config: dict, case: dict, index: int) -> dict:
    case_id = case.get("case_id") or f"case {index}"
    row = {
        "case_id": case_id,
        "family": case.get("family"),
        "rank": 0,
        "rr": 0.0,
        "corpus_alone_rr": 0.0,
        "skipped": False,
        "reason": None,
    }
    problem = case_problem(case, config)
    if problem:
        return {**row, "skipped": True, "reason": f"malformed: {problem}"}
    missing = unresolved_targets(vault, case)
    if missing:
        return {**row, "skipped": True, "reason": f"unresolved: {', '.join(missing)}"}
    intent = case.get("intent", DEFAULT_INTENT)
    profile = config["intents"][intent]
    limit = int(case.get("k", DEFAULT_LIMIT))
    opts = Options(
        intent=intent,
        streams=list(STREAM_ORDER),
        collections={name: list(config["collections"][name]) for name in CORPUS_STREAMS},
        hops=profile["hops"],
        history=profile["history"],
        statuses=None,
        min_probability=None,
        limit=limit,
    )
    result = run_search(vault, config, case["query"], opts, with_corpus=True)
    absent = [name for name in case.get("needs", []) if not result.streams[name].ran]
    if absent:
        reasons = ", ".join(f"{name}: {result.streams[name].reason}" for name in absent)
        return {**row, "skipped": True, "reason": f"needs did not run — {reasons}"}
    rank, rr = reciprocal_rank(vault, case, result.ordered, limit)
    _, corpus_rr = reciprocal_rank(vault, case, result.corpus, limit)
    return {**row, "rank": rank, "rr": round(rr, 6), "corpus_alone_rr": round(corpus_rr, 6)}


def print_eval(payload: dict, source: str) -> None:
    print(f"eval: {counted(payload['total'], 'case')} · {payload['skipped']} skipped · {source}")
    print("| case | family | rank | rr | corpus | note |")
    print("| --- | --- | --- | --- | --- | --- |")
    for row in payload["cases"]:
        note = row["reason"] if row["skipped"] else "ok"
        print(
            f"| {row['case_id']} | {row['family']} | {row['rank']} | "
            f"{row['rr']:.4f} | {row['corpus_alone_rr']:.4f} | {note} |"
        )
    floor = payload["floor"]
    for label in ("fused", "corpus_alone"):
        scores = payload["aggregate"][label]
        against = (
            f" · floor mrr {floor['mrr']:.4f} · recall {floor['recall']:.2f}"
            if label == "fused"
            else ""
        )
        print(
            f"{label}: mrr {scores['mrr']:.4f} · recall {scores['recall']:.2f} "
            f"· answered {scores['answered']}/{payload['total']}{against}"
        )
    for family, scores in payload["aggregate"]["by_family"].items():
        print(
            f"  {family}: fused mrr {scores['fused']['mrr']:.4f} "
            f"· corpus mrr {scores['corpus_alone']['mrr']:.4f}"
        )
    if below_floor(payload):
        print("eval: below the floor")


def corpus_texts(layout: common.Layout) -> dict[str, str]:
    """Every archive and page under the shared segment, normalized for a verbatim match."""
    texts: dict[str, str] = {}
    for folder in CORPUS_DIRS:
        base = layout.abs(folder)
        for path in sorted(base.rglob("*.md")) if base.is_dir() else []:
            text = path.read_text(encoding="utf-8", errors="replace")
            texts[layout.rel(path)] = common.normalize_ws(text).lower()
    return texts


def case_findings(layout: common.Layout, config: dict, cases: list[dict]) -> list[str]:
    """Every case's shape, its expectation against the vault, and its query against the vault.

    A vault that quotes a case's own query measures the vault, not the retriever, so the
    quotation is a finding wherever it sits under raw/ or wiki/.
    """
    vault = load_vault(layout)
    texts = corpus_texts(layout)
    findings: list[str] = []
    for index, case in enumerate(cases, 1):
        case_id = case.get("case_id") or f"case {index}"
        problem = case_problem(case, config)
        if problem:
            findings.append(f"FAIL {case_id}: {problem}")
            continue
        missing = unresolved_targets(vault, case)
        if missing:
            findings.append(
                f"FAIL {case_id}: expectation resolves to nothing — {', '.join(missing)}"
            )
        query = common.normalize_ws(case["query"]).lower()
        quoting = [rel for rel, text in texts.items() if query in text]
        findings += [f"FAIL {case_id}: query appears verbatim in {rel}" for rel in quoting]
    return findings


def cmd_check(layout: common.Layout, _args: argparse.Namespace) -> int:
    config = read_config(layout)
    findings = config_findings(config, load_schema(layout))
    path = cases_path(layout, None)
    has_cases_file = path.is_file()
    cases = common.read_jsonl(path) if has_cases_file else []
    if cases:
        findings += case_findings(layout, config, cases)
    for finding in findings:
        print(finding)
    if not has_cases_file:
        print("note: no eval cases file")
    if findings:
        print(f"check: {counted(len(findings), 'finding')}")
        return 1
    print(
        f"check: clean ({counted(len(config['intents']), 'intent')} · "
        f"{counted(len(cases), 'case')})"
    )
    return 0


# --------------------------------------------------------------------------- cli


def print_json(payload: dict) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="retrieve.py", description=DESCRIPTION)
    parser.add_argument(
        "--root", help="repo root holding llm-wiki/ (default: cwd or $LLM_WIKI_ROOT)"
    )
    verbs = parser.add_subparsers(dest="verb", required=True)

    search = verbs.add_parser("search", help="a ranked state slice for a question")
    search.add_argument("question")
    search.add_argument(
        "--segment",
        choices=common.SEGMENTS,
        help="narrow to one segment (default: both when a private one exists)",
    )
    search.add_argument("--intent", default=DEFAULT_INTENT, metavar="I", help="a config intent")
    search.add_argument("--streams", metavar="S,…", help=f"narrow to {', '.join(STREAM_ORDER)}")
    search.add_argument("--collections", metavar="C,…", help="override the config's collections")
    search.add_argument("--hops", type=int, metavar="N", help="override the intent's hops")
    search.add_argument(
        "--history", action="store_true", help="add the frozen claims and their status factors"
    )
    search.add_argument("--status", nargs="+", metavar="S", help="keep only these statuses")
    search.add_argument("--min-probability", type=float, metavar="X")
    search.add_argument("-n", type=int, default=DEFAULT_LIMIT, metavar="N", help="leads to print")
    search.add_argument("--explain", action="store_true", help="add the per-stream traces")
    search.set_defaults(run=cmd_search)

    evaluate = verbs.add_parser("eval", help="run the golden set; exit 1 on a skip")
    evaluate.add_argument("--cases", metavar="PATH", help=f"default: {CASES_PATH}")
    evaluate.set_defaults(run=cmd_eval)

    check = verbs.add_parser("check", help="config and eval-case integrity; exit 1 on findings")
    check.set_defaults(run=cmd_check)

    for verb in (search, evaluate):
        verb.add_argument("--json", action="store_true", help="the same report as a JSON object")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.parser = parser
    # The shared segment is where the config, the schema, and the cases live; `search`
    # widens from here and `eval` and `check` never do.
    layout = common.layout_from(args.root, "shared")
    try:
        return args.run(layout, args)
    except ConfigError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
