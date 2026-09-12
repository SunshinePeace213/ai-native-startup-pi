#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pyyaml>=6"]
# ///
"""The llm-wiki graph reader — read-only traversal of the views in llm-wiki/states/.

    neighbors <entity_id> [--hops N] [--predicate P …] [--min-confidence X]
    path <entity_id> <entity_id> [--max-hops N]
    impact (<entity_id> | <source_id> | <claim_id>) [--hops N]
    check

Edges come from relationships.jsonl, their endpoints from entities.jsonl, and an impact
walk ends at the live claims naming the entities it reached and the pages those render
on. The script writes nothing: the engine owns llm-wiki/states/ and the renderer owns
the shelves. Every verb takes --root <repo-root>, --segment {shared,private} (env
LLM_WIKI_SEGMENT), and --json, and exits 1 only on an unknown id or a `check` finding.
"""

from __future__ import annotations

import argparse
import json
import sys

import common

DESCRIPTION = (__doc__ or "").split("\n\n")[0]
NO_PAGE = "no page yet"
STATUS_FLAG = {"disputed": " *[disputed]*", "superseded": " *[superseded]*"}
MERGE_COMMAND = (
    'uv run scripts/llm-wiki/state.py merge {source} {target} --by human:<name> --reason "<why>"'
)


# --------------------------------------------------------------------------- naming


def name_of(graph: common.Graph, entity_id: str) -> str:
    entity = graph.entities.get(entity_id)
    return entity["name"] if entity else entity_id


def page_of(graph: common.Graph, entity_id: str) -> str | None:
    entity = graph.entities.get(entity_id)
    return entity["page"] if entity else None


def entity_label(graph: common.Graph, entity_id: str) -> str:
    return f"{name_of(graph, entity_id)} ({entity_id}, {page_of(graph, entity_id) or NO_PAGE})"


def entity_ref(graph: common.Graph, entity_id: str) -> dict:
    return {
        "entity_id": entity_id,
        "name": name_of(graph, entity_id),
        "page": page_of(graph, entity_id),
    }


def counted(count: int, noun: str, plural: str | None = None) -> str:
    return f"{count} {noun}" if count == 1 else f"{count} {plural or noun + 's'}"


def edge_line(graph: common.Graph, step: common.Step, start: str | None) -> str:
    """The contract's edge line; walks from anywhere but `start` name where they came from."""
    edge = step.edge
    arrow = "→" if step.direction == "out" else "←"
    line = (
        f"  {arrow} {edge['predicate']} {entity_label(graph, step.other)} "
        f"· p {edge['probability']:.2f} · {edge['status']}{STATUS_FLAG.get(edge['status'], '')} "
        f"· claims: {', '.join(edge['claim_ids']) or 'none'}"
    )
    if step.origin != start:
        line += f" · hop {step.hop} from {name_of(graph, step.origin)}"
    return line


def edge_json(graph: common.Graph, step: common.Step) -> dict:
    edge = step.edge
    return {
        "relationship_id": edge["relationship_id"],
        "predicate": edge["predicate"],
        "direction": step.direction,
        "hop": step.hop,
        "from": entity_ref(graph, step.origin),
        "other": entity_ref(graph, step.other),
        "probability": edge["probability"],
        "status": edge["status"],
        "claim_ids": edge["claim_ids"],
    }


def by_predicate(graph: common.Graph, steps: list[common.Step]) -> list[common.Step]:
    return sorted(
        steps,
        key=lambda s: (
            s.edge["predicate"],
            s.hop,
            name_of(graph, s.other),
            s.edge["relationship_id"],
        ),
    )


# --------------------------------------------------------------------------- walks


def impact_allows(edge: dict, direction: str) -> bool:
    """IMPACT_DIRECTION only: reverse walks object → subject, forward subject → object."""
    mode = common.IMPACT_DIRECTION.get(edge["predicate"])
    if mode == "both":
        return True
    if mode == "forward":
        return direction == "out"
    if mode == "reverse":
        return direction == "in"
    return False


def require_entity(graph: common.Graph, entity_id: str) -> str:
    if entity_id not in graph.entities:
        raise ValueError(f"no such entity: {entity_id}")
    return entity_id


# --------------------------------------------------------------------------- neighbors


def cmd_neighbors(layout: common.Layout, args: argparse.Namespace) -> int:
    graph = common.load_graph(layout)
    start = require_entity(graph, args.entity_id)
    predicates = set(args.predicate or ())
    floor = args.min_confidence

    def allows(edge: dict, _direction: str) -> bool:
        if predicates and edge["predicate"] not in predicates:
            return False
        return floor is None or edge["probability"] >= floor

    steps = by_predicate(graph, common.walk(graph, [start], args.hops, allows))
    if args.json:
        print_json(
            {
                "verb": "neighbors",
                "entity": entity_ref(graph, start),
                "hops": args.hops,
                "predicates": sorted(predicates),
                "min_confidence": floor,
                "edges": [edge_json(graph, step) for step in steps],
            }
        )
        return 0
    print(
        f"neighbors: {entity_label(graph, start)} · "
        f"{counted(len(steps), 'edge')} within {counted(args.hops, 'hop')}"
    )
    for step in steps:
        print(edge_line(graph, step, start))
    return 0


# --------------------------------------------------------------------------- path


def path_line(graph: common.Graph, start: str, steps: list[common.Step]) -> str:
    line = name_of(graph, start)
    for step in steps:
        predicate = step.edge["predicate"]
        arrow = f"—{predicate}→" if step.direction == "out" else f"←{predicate}—"
        line += f" {arrow} {name_of(graph, step.other)}"
    return line


def cmd_path(layout: common.Layout, args: argparse.Namespace) -> int:
    graph = common.load_graph(layout)
    start = require_entity(graph, args.from_entity)
    target = require_entity(graph, args.to_entity)
    steps = common.shortest_path(graph, start, target, args.max_hops)
    if args.json:
        print_json(
            {
                "verb": "path",
                "from": entity_ref(graph, start),
                "to": entity_ref(graph, target),
                "max_hops": args.max_hops,
                "found": steps is not None,
                "hops": len(steps) if steps is not None else None,
                "steps": [edge_json(graph, step) for step in steps or []],
            }
        )
        return 0
    if steps is None:
        print(f"no path within {counted(args.max_hops, 'hop')}")
        return 0
    print(path_line(graph, start, steps))
    return 0


# --------------------------------------------------------------------------- impact


def claims_of_observations(graph: common.Graph, observation_ids: set[str]) -> list[dict]:
    """Claims whose supporting, contradicting, or exception evidence names an observation."""
    hits = []
    for claim in graph.claims.values():
        evidence = {
            *claim["supporting_observations"],
            *claim["contradicting_observations"],
            *(exception["evidence"] for exception in claim["exceptions"]),
        }
        if evidence & observation_ids:
            hits.append(claim)
    return hits


def impact_seeds(
    graph: common.Graph, identifier: str, hops: int
) -> tuple[str, str, list[str], int]:
    """(kind, heading label, seed entities, entity hops) for an entity, source, or claim id."""
    if identifier.startswith("ent_"):
        start = require_entity(graph, identifier)
        return "entity", entity_label(graph, start), [start], hops
    if identifier.startswith("src_"):
        source = graph.sources.get(identifier)
        if source is None:
            raise ValueError(f"no such source: {identifier}")
        observation_ids = {
            o["observation_id"] for o in graph.observations if o["source_id"] == identifier
        }
        seeds = seen_order(
            entity_id
            for claim in claims_of_observations(graph, observation_ids)
            for entity_id in claim["entity_ids"]
        )
        return "source", f"{source['title']} ({identifier})", seeds, max(hops - 1, 0)
    if identifier.startswith("clm_"):
        claim = graph.claims.get(identifier)
        if claim is None:
            raise ValueError(f"no such claim: {identifier}")
        return (
            "claim",
            f"{claim['claim_key']} ({identifier})",
            list(claim["entity_ids"]),
            max(hops - 1, 0),
        )
    raise ValueError(f"unrecognized id: {identifier} — expected ent_…, src_… or clm_…")


def seen_order(values) -> list[str]:
    return list(dict.fromkeys(values))


def claim_pages(graph: common.Graph, claim: dict, reached: set[str]) -> list[str]:
    pages = {page_of(graph, e) for e in claim["entity_ids"] if e in reached}
    return sorted(page for page in pages if page)


def cmd_impact(layout: common.Layout, args: argparse.Namespace) -> int:
    graph = common.load_graph(layout)
    kind, label, seeds, hops = impact_seeds(graph, args.id, args.hops)
    steps = common.walk(graph, seeds, hops, impact_allows)
    hop_of = dict.fromkeys(seeds, 0)
    for step in steps:
        hop_of.setdefault(step.other, step.hop)
    steps = by_predicate(graph, steps)
    reached = set(hop_of)
    claims = sorted(
        (
            claim
            for claim in graph.claims.values()
            if claim["status"] in common.LIVE_STATUSES and reached & set(claim["entity_ids"])
        ),
        key=lambda c: (-c["probability"], c["claim_id"]),
    )
    entities = sorted(hop_of, key=lambda e: (hop_of[e], name_of(graph, e), e))

    if args.json:
        print_json(
            {
                "verb": "impact",
                "start": {"kind": kind, "id": args.id},
                "hops": args.hops,
                "entities": [{**entity_ref(graph, e), "hop": hop_of[e]} for e in entities],
                "edges": [edge_json(graph, step) for step in steps],
                "claims": [
                    {
                        "claim_id": claim["claim_id"],
                        "claim_key": claim["claim_key"],
                        "text": claim["current_text"],
                        "probability": claim["probability"],
                        "status": claim["status"],
                        "entity_ids": claim["entity_ids"],
                        "pages": claim_pages(graph, claim, reached),
                    }
                    for claim in claims
                ],
            }
        )
        return 0

    print(
        f"impact: {label} · {counted(len(entities), 'entity', 'entities')} "
        f"· {counted(len(claims), 'live claim')}"
    )
    print("entities:")
    for entity_id in entities:
        print(f"  - {entity_label(graph, entity_id)} · hop {hop_of[entity_id]}")
    print("edges:")
    for step in steps:
        print(edge_line(graph, step, None))
    print("claims:")
    for claim in claims:
        pages = ", ".join(claim_pages(graph, claim, reached)) or NO_PAGE
        print(
            f'  - `{claim["claim_id"]}` "{claim["current_text"]}" '
            f"· p {claim['probability']:.2f} · {claim['status']} · pages: {pages}"
        )
    return 0


# --------------------------------------------------------------------------- check


def alias_ids(entity: dict) -> set[str]:
    return {entity["entity_id"], *(common.entity_id_for(a) for a in entity["aliases"])}


def head_token(entity_id: str) -> str:
    """The last token of an id — the head noun of the name it was built from."""
    return entity_id.removeprefix("ent_").rsplit("_", 1)[-1]


def merge_candidates(graph: common.Graph) -> list[tuple[str, str]]:
    """Pairs to propose to a human: (from, into) by id tokens, else by a shared alias id.

    A token subset only counts when both ids end on the same head noun: `Karpathy` inside
    `Andrej Karpathy` is one person, while `Index` inside `Vector index` is two things.
    """
    ids = sorted(graph.entities)
    tokens = {e: set(e.removeprefix("ent_").split("_")) for e in ids}
    aliases = {e: alias_ids(graph.entities[e]) for e in ids}
    pairs = []
    for index, left in enumerate(ids):
        for right in ids[index + 1 :]:
            same_head = head_token(left) == head_token(right)
            if same_head and tokens[left] < tokens[right]:
                pairs.append((left, right))
            elif same_head and tokens[right] < tokens[left]:
                pairs.append((right, left))
            elif aliases[left] & aliases[right]:
                later, earlier = sorted(
                    (left, right), key=lambda e: (graph.entities[e]["first_seen"], e), reverse=True
                )
                pairs.append((later, earlier))
    return pairs


def cmd_check(layout: common.Layout, args: argparse.Namespace) -> int:
    graph = common.load_graph(layout)
    findings: list[str] = []
    notes: list[str] = []

    for edge in graph.edges:
        for role in ("subject_entity", "object_entity"):
            if edge[role] not in graph.entities:
                findings.append(
                    f"{edge['relationship_id']}: {role} {edge[role]} resolves to no entity"
                )

    for edge in graph.edges:
        if edge["subject_entity"] == edge["object_entity"]:
            notes.append(
                f"self-loop {edge['relationship_id']}: {edge['predicate']} "
                f"{entity_label(graph, edge['subject_entity'])} onto itself"
            )

    outside: dict[str, list[str]] = {}
    for edge in graph.edges:
        if edge["predicate"] not in common.CANONICAL_PREDICATES:
            outside.setdefault(edge["predicate"], []).append(edge["relationship_id"])
    for predicate in sorted(outside):
        edges = ", ".join(outside[predicate])
        notes.append(f"predicate {predicate} is outside CANONICAL_PREDICATES ({edges})")

    for entity_id in sorted(graph.entities):
        if not graph.touching.get(entity_id):
            notes.append(f"isolated entity {entity_label(graph, entity_id)} — no edges")

    candidates = merge_candidates(graph)
    for source, target in candidates:
        notes.append(
            f"merge candidates {name_of(graph, source)} ({source}) and "
            f"{name_of(graph, target)} ({target}) — "
            + MERGE_COMMAND.format(source=source, target=target)
        )

    if args.json:
        print_json(
            {
                "verb": "check",
                "findings": findings,
                "notes": notes,
                "merge_candidates": [
                    {
                        "from_entity": source,
                        "into_entity": target,
                        "command": MERGE_COMMAND.format(source=source, target=target),
                    }
                    for source, target in candidates
                ],
                "counts": {
                    "entities": len(graph.entities),
                    "edges": len(graph.edges),
                    "findings": len(findings),
                    "notes": len(notes),
                },
            }
        )
        return 1 if findings else 0

    for finding in findings:
        print(f"FAIL {finding}")
    for note in notes:
        print(f"note: {note}")
    if findings:
        print(f"check: {len(findings)} findings over {counted(len(graph.edges), 'edge')}")
        return 1
    print(
        f"check: clean ({len(graph.entities)} entities, "
        f"{len(graph.edges)} edges, {len(notes)} notes)"
    )
    return 0


# --------------------------------------------------------------------------- cli


def print_json(payload: dict) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="graph.py", description=DESCRIPTION)
    parser.add_argument(
        "--root", help="repo root holding llm-wiki/ (default: cwd or $LLM_WIKI_ROOT)"
    )
    parser.add_argument(
        "--segment",
        choices=common.SEGMENTS,
        help="which segment to read (default: shared or $LLM_WIKI_SEGMENT)",
    )
    verbs = parser.add_subparsers(dest="verb", required=True)

    neighbors = verbs.add_parser("neighbors", help="edges touching an entity, by predicate")
    neighbors.add_argument("entity_id")
    neighbors.add_argument("--hops", type=int, default=1, metavar="N")
    neighbors.add_argument("--predicate", nargs="+", metavar="P", help="keep only these predicates")
    neighbors.add_argument("--min-confidence", type=float, metavar="X", help="drop edges below X")
    neighbors.set_defaults(run=cmd_neighbors)

    path = verbs.add_parser("path", help="shortest chain between two entities")
    path.add_argument("from_entity", metavar="ENTITY_ID")
    path.add_argument("to_entity", metavar="ENTITY_ID")
    path.add_argument("--max-hops", type=int, default=4, metavar="N")
    path.set_defaults(run=cmd_path)

    impact = verbs.add_parser("impact", help="what a change here reaches: edges, claims, pages")
    impact.add_argument("id", metavar="ID", help="ent_…, src_… or clm_…")
    impact.add_argument("--hops", type=int, default=2, metavar="N")
    impact.set_defaults(run=cmd_impact)

    check = verbs.add_parser("check", help="graph integrity; exit 1 on findings")
    check.set_defaults(run=cmd_check)

    for verb in (neighbors, path, impact, check):
        verb.add_argument("--json", action="store_true", help="the same report as a JSON object")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    layout = common.layout_from(args.root, args.segment)
    try:
        return args.run(layout, args)
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
