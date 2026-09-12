#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pyyaml>=6"]
# ///
"""The llm-wiki renderer — the only writer under the wiki shelves and of the index rows.

    render [--all | --entity <id>…] [--dry-run]
    check

Pages are a pure function of llm-wiki/states/ (render-v2): page = entity, shelf = the
entity's type, slug from the entity id, one page once MIN_CLAIMS_PER_PAGE live claims
name the entity. A stale claim carries the date it went stale, an archived or rejected one
drops to Open questions, `stale_after` dates the page's next crossing, and typed edges lead
Related. `render` rewrites a page only when its content changed — `--entity` covers the
pages whose Related names that entity too; `check` re-renders
every page and reports drift, unresolved ids, status mismatches, spans and archive
hashes that no longer resolve, and index rows that differ.

Every verb takes --root <repo-root>, --segment {shared,private} (env LLM_WIKI_SEGMENT),
and --actor ID (env LLM_WIKI_ACTOR, default process:llm-wiki-render). A render that is
not --dry-run is a run: llm-wiki/governance.json gates it (exit 3 and one denied audit
row when it says no), it holds states/.lock, and it appends one states/audit_log.jsonl
row and prints `run: run_<12hex>` when it wrote or removed a page or changed the index.
A private-segment page's frontmatter carries scope: private, and its Related section may
link a shared page for an entity with none of its own. Exit codes: 0 ok, 1 error, 2
invalid input, 3 denied or locked. Ledgers↔views integrity is the engine's
`rebuild --check`.
"""

from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import common

DESCRIPTION = (__doc__ or "").split("\n\n")[0]
GENERATED_BY = "process:llm-wiki-render"
SPAN_LIMIT = 240
SUMMARY_LIMIT = 200
INDEX_HEADER = "| Page | Status | In here |"
INDEX_SEPARATOR = "| --- | --- | --- |"
# Where a quote or a summary may be cut: after a sentence's `.` or `;`, or before a
# clause's em dash — never mid-word.
BOUNDARY_RE = re.compile(r"[.;](?=\s)|\s—(?=\s)")


@dataclass
class Snapshot:
    sources: dict[str, dict]
    observations: dict[str, dict]
    transitions: list[dict]
    claims: dict[str, dict]
    entities: dict[str, dict]
    relationships: list[dict]
    conflicts: list[dict]
    segment: str
    shared_pages: frozenset[str]


def shared_pages_of(layout: common.Layout) -> frozenset[str]:
    """Entity ids with a shared page — read-only, consulted only while rendering private."""
    if layout.segment != "private":
        return frozenset()
    shared = common.Layout(layout.root, "shared")
    return frozenset(e["entity_id"] for e in common.read_view(shared, "entities") if e["page"])


def load(layout: common.Layout) -> Snapshot:
    retracted = common.retracted_runs(layout)
    return Snapshot(
        sources=common.read_sources(layout, retracted),
        observations={o["observation_id"]: o for o in common.read_observations(layout, retracted)},
        transitions=common.read_transitions(layout, retracted),
        claims={c["claim_id"]: c for c in common.read_view(layout, "claims")},
        entities={e["entity_id"]: e for e in common.read_view(layout, "entities")},
        relationships=common.read_view(layout, "relationships"),
        conflicts=common.read_view(layout, "unresolved_conflicts"),
        segment=layout.segment,
        shared_pages=shared_pages_of(layout),
    )


@dataclass
class Page:
    entity: dict
    path: str
    claims: list[dict]
    live: list[dict]
    archived: list[dict]
    superseded: list[dict]
    rejected: list[dict]
    status: str
    review_required: bool
    confidence: float
    stale_after: str | None
    title: str
    in_here: str


def is_live(claim: dict) -> bool:
    return claim["status"] in common.LIVE_STATUSES


def claim_order(claim: dict) -> tuple:
    """Probability first; a tie goes to the claim naming fewer entities — the more specific one."""
    return (-claim["probability"], len(claim["entity_ids"]), claim["claim_id"])


def key_overlap(entity: dict, claim: dict) -> int:
    """How many of the entity's slug tokens the claim's key names — 0 means the claim is
    about something else, and its text must not be borrowed for this page's summary."""
    tokens = set(common.slug_for(entity["entity_id"]).split("-"))
    return len(tokens & set(re.split(r"[.\-_]", claim["claim_key"])))


def lead_claim(entity: dict, claims: list[dict]) -> dict:
    """The claim the summary line quotes: keyed on this entity, active, specific, first seen."""

    def rank(claim: dict) -> tuple:
        return (
            -key_overlap(entity, claim),
            claim["status"] != "active",
            len(claim["entity_ids"]),
            claim["first_seen"],
            claim["claim_id"],
        )

    return min(claims, key=rank)


def shorten(text: str, limit: int = SUMMARY_LIMIT) -> str:
    """`text` within `limit`, cut at the last sentence or clause boundary inside it; with
    no boundary there, at the last word, which keeps the ellipsis that marks the cut."""
    if len(text) <= limit:
        return text
    window = text[:limit]
    boundaries = [match.end() for match in BOUNDARY_RE.finditer(window)]
    if boundaries:
        return window[: boundaries[-1]].rstrip("— ")
    cut = text[: limit - 1]
    return cut[: cut.rfind(" ")].rstrip(",;:") + "…" if " " in cut else cut + "…"


def sentence(text: str) -> str:
    return text.strip().rstrip(".")


def quoted(text: str, limit: int = SPAN_LIMIT) -> str:
    return f'"{shorten(common.normalize_ws(text), limit)}"'


def stale_after_of(claims: list[dict]) -> str | None:
    """The earliest date an active claim on the page crosses P_ACTIVE unconfirmed."""
    dates = []
    for claim in claims:
        if claim["status"] != "active":
            continue
        since = max(claim["last_confirmed_at"], claim["last_decayed_at"] or "")
        crossing = common.stale_after(claim["log_odds"], since, claim["decay_profile"])
        if crossing is not None:
            dates.append(crossing)
    return min(dates).isoformat() if dates else None


def build_pages(snapshot: Snapshot) -> dict[str, Page]:
    pages: dict[str, Page] = {}
    for entity in snapshot.entities.values():
        claims = [snapshot.claims[c] for c in entity["claim_ids"] if c in snapshot.claims]
        live = sorted((c for c in claims if is_live(c)), key=claim_order)
        path = common.page_path(entity["type"], entity["entity_id"], len(live), snapshot.segment)
        if path is None:
            continue
        lead = lead_claim(entity, [c for c in live if c["status"] != "candidate"] or live)
        archived = sorted((c for c in claims if c["status"] == "archived"), key=claim_order)
        frozen: dict[str, list[dict]] = {"superseded": [], "rejected": []}
        for claim in sorted(claims, key=lambda c: c["claim_id"]):
            if claim["status"] in frozen:
                frozen[claim["status"]].append(claim)
        superseded, rejected = frozen["superseded"], frozen["rejected"]
        status = "disputed" if any(c["status"] == "disputed" for c in live) else "current"
        confidence = round(sum(c["probability"] for c in live) / len(live), 2) if live else 0.0
        sources = {s for c in claims for s in c["source_ids"] if s in snapshot.sources}
        pages[path] = Page(
            entity=entity,
            path=path,
            claims=live + archived + superseded + rejected,
            live=live,
            archived=archived,
            superseded=superseded,
            rejected=rejected,
            status=status,
            review_required=any(c["needs_review"] for c in live),
            confidence=confidence,
            stale_after=stale_after_of(live),
            title=entity["name"],
            in_here=summary_line(entity, lead, live, confidence, len(sources)),
        )
    return pages


def summary_line(
    entity: dict, lead: dict, live: list[dict], confidence: float, sources: int
) -> str:
    """The `In here:` line: the lead claim's own words when it is keyed on this entity,
    else what the page holds — a claim about something else must not speak for it."""
    if key_overlap(entity, lead):
        return (
            f"{shorten(sentence(lead['current_text']))} · {len(live)} claims, "
            f"confidence {confidence:.2f}."
        )
    return (
        f"{entity['name']} — {len(live)} claims, confidence {confidence:.2f}, "
        f"{sources} source{'' if sources == 1 else 's'}."
    )


# --------------------------------------------------------------------------- page text


def claim_line(claim: dict) -> str:
    line = (
        f"- `{claim['claim_id']}` — {quoted(claim['current_text'], 400)} · "
        f"p {claim['probability']:.2f} · "
        f"{claim['status']} · {len(claim['supporting_observations'])} support · "
        f"{len(claim['contradicting_observations'])} contradict"
    )
    if claim["conditions"]:
        line += " · when: " + ", ".join(claim["conditions"])
    return line


def evidence_line(snapshot: Snapshot, observation_id: str) -> str:
    observation = snapshot.observations.get(observation_id)
    if observation is None:
        return f"  - `{observation_id}` (observation missing from the ledger)"
    source = snapshot.sources.get(observation["source_id"], {})
    title = source.get("title", observation["source_id"])
    return f"  - `{observation['source_id']}` {title}: {quoted(observation['evidence_span'])}"


def entity_target(snapshot: Snapshot, entity_id: str, by_entity: dict[str, Page]) -> str:
    """A wikilink when the entity has a page — this segment's, or (in private) the shared one."""
    if entity_id in by_entity or entity_id in snapshot.shared_pages:
        return f"[[{common.slug_for(entity_id)}]]"
    entity = snapshot.entities.get(entity_id)
    return f"{entity['name'] if entity else entity_id} (no page yet)"


def edge_lines(snapshot: Snapshot, page: Page, by_entity: dict[str, Page]) -> list[str]:
    """The typed edges touching the page's entity, both directions, capped."""
    entity_id = page.entity["entity_id"]
    edges = []
    for edge in snapshot.relationships:
        if edge["subject_entity"] == entity_id:
            edges.append(("→", edge["object_entity"], edge))
        elif edge["object_entity"] == entity_id:
            edges.append(("←", edge["subject_entity"], edge))
    edges.sort(key=lambda e: (-e[2]["probability"], e[2]["predicate"], common.slug_for(e[1])))
    lines = []
    for arrow, other, edge in edges[: common.RELATED_EDGE_LIMIT]:
        line = (
            f"- {arrow} {edge['predicate']} {entity_target(snapshot, other, by_entity)} "
            f"({edge['probability']:.2f})"
        )
        if edge["status"] in ("disputed", "superseded"):
            line += f" *[{edge['status']}]*"
        lines.append(line)
    hidden = len(edges) - common.RELATED_EDGE_LIMIT
    if hidden > 0:
        lines.append(f"- … {hidden} more edges — `graph.py neighbors {entity_id}`")
    return lines


def shared_claim_lines(snapshot: Snapshot, page: Page, by_entity: dict[str, Page]) -> list[str]:
    shared: dict[str, int] = {}
    for claim in page.live:
        for entity_id in claim["entity_ids"]:
            if entity_id != page.entity["entity_id"]:
                shared[entity_id] = shared.get(entity_id, 0) + 1
    lines = []
    ranked = sorted(shared.items(), key=lambda item: (item[0] not in by_entity, -item[1], item[0]))
    for entity_id, count in ranked:
        target = entity_target(snapshot, entity_id, by_entity)
        plural = "claim" if count == 1 else "claims"
        lines.append(
            f"- {target} — {count} shared {plural}" if entity_id in by_entity else f"- {target}"
        )
    return lines


def related_entities(snapshot: Snapshot, page: Page) -> set[str]:
    """Every entity the page's Related section names, so `--entity` also rewrites the pages
    already on disk whose wikilink or `(no page yet)` placeholder for it has just changed."""
    entity_id = page.entity["entity_id"]
    named = {other for claim in page.live for other in claim["entity_ids"]}
    for edge in snapshot.relationships:
        endpoints = (edge["subject_entity"], edge["object_entity"])
        if entity_id in endpoints:
            named.update(endpoints)
    return named - {entity_id}


def related_lines(snapshot: Snapshot, page: Page, pages: dict[str, Page]) -> list[str]:
    by_entity = {p.entity["entity_id"]: p for p in pages.values()}
    lines = edge_lines(snapshot, page, by_entity) + shared_claim_lines(snapshot, page, by_entity)
    return lines or ["- none yet"]


def render_page(snapshot: Snapshot, page: Page, pages: dict[str, Page], volatile: dict) -> str:
    sources = sorted(
        {s for c in page.claims for s in c["source_ids"] if s in snapshot.sources},
        key=lambda s: snapshot.sources[s]["path"],
    )
    head = [
        "---",
        f"type: {page.entity['type']}",
        f"status: {page.status}",
    ]
    if snapshot.segment == "private":
        head.append("scope: private")
    head += [
        f"created: {volatile['created']}",
        f"updated: {volatile['updated']}",
        "sources:",
    ]
    for source_id in sources:
        source = snapshot.sources[source_id]
        head.append(
            f"  - {{resource: {source['path']}, "
            f"title: {json.dumps(source['title'], ensure_ascii=False)}, id: {source_id}}}"
        )
    head += [
        f"generated: {{by: {GENERATED_BY}, at: {volatile['generated_at']}}}",
        f"entity_ids: [{page.entity['entity_id']}]",
        f"claim_ids: [{', '.join(c['claim_id'] for c in page.claims)}]",
        f"confidence: {page.confidence:.2f}",
    ]
    if page.stale_after:
        head.append(f"stale_after: {page.stale_after}")
    head += [
        f"last_rendered: {volatile['last_rendered']}",
        f"review_required: {'true' if page.review_required else 'false'}",
        "---",
        "",
        f"# {page.title}",
        "",
        f"> **In here:** {page.in_here}",
        "",
    ]

    understanding = []
    for claim in page.live:
        if claim["status"] not in ("active", "stale", "disputed"):
            continue
        line = f"- {sentence(claim['current_text'])} ({claim['probability']:.2f})"
        if claim["status"] == "disputed":
            line += " *[disputed]*"
        elif claim["status"] == "stale":
            line += f" *[stale since {common.decay_date(snapshot.transitions, claim)}]*"
        understanding.append(line)
    if not understanding:
        understanding = ["No settled claims yet — see Open questions."]
    body = ["## Current understanding", "", *understanding, "", "## Evidence", ""]
    for claim in page.live:
        body.append(claim_line(claim))
        body.extend(evidence_line(snapshot, o) for o in claim["supporting_observations"])
        for exception in claim["exceptions"]:
            when = ", ".join(exception["condition"]) or "always"
            body.append(
                f"  - exception — when {when}: {sentence(exception['effect'])} "
                f"(`{exception['evidence']}`)"
            )
    body.append("")

    contested = [
        c for c in page.live if c["status"] == "disputed" or c["contradicting_observations"]
    ]
    if contested:
        body += ["## Contradictions", ""]
        for claim in contested:
            body.append(
                f"- `{claim['claim_id']}` — {quoted(claim['current_text'], 400)} · "
                f"p {claim['probability']:.2f} · {claim['status']}"
            )
            body.extend(evidence_line(snapshot, o) for o in claim["contradicting_observations"])
        body.append("")

    if page.superseded:
        body += ["## Superseded", ""]
        for claim in page.superseded:
            when = common.supersession_date(snapshot.transitions, claim["claim_id"])
            tail = (
                f"superseded by `{claim['superseded_by']}`"
                if claim["superseded_by"]
                else "superseded"
            )
            body.append(
                f"- `{claim['claim_id']}` — {quoted(claim['current_text'], 400)} · {tail}"
                + (f" on {when}" if when else "")
            )
        body.append("")

    candidates = [c for c in page.live if c["status"] == "candidate"]
    if candidates or page.archived or page.rejected:
        body += ["## Open questions", ""]
        for claim in candidates:
            line = (
                f"- Does {quoted(sentence(claim['current_text']), 400)} hold? · "
                f"p {claim['probability']:.2f} · {len(claim['supporting_observations'])} support"
            )
            if claim["conditions"]:
                line += " · when: " + ", ".join(claim["conditions"])
            body.append(line)
        for claim in page.archived:
            body.append(
                f"- Is it still true that {quoted(sentence(claim['current_text']), 400)}? · "
                f"archived {common.decay_date(snapshot.transitions, claim)} · "
                f"last confirmed {common.date_of(claim['last_confirmed_at'])} · "
                f"p {claim['probability']:.2f}"
            )
        for claim in page.rejected:
            when = common.supersession_date(snapshot.transitions, claim["claim_id"])
            body.append(
                f"- Should {quoted(sentence(claim['current_text']), 400)} be reconsidered? · "
                f"rejected{f' {when}' if when else ''} · p {claim['probability']:.2f}"
            )
        body.append("")

    body += ["## Timeline", ""]
    claim_ids = {c["claim_id"] for c in page.claims}
    timeline = []
    for transition in snapshot.transitions:
        if transition["claim_id"] not in claim_ids:
            continue
        if transition["operation"] == "decay_update":
            if transition["before"]["status"] == transition["after"]["status"]:
                continue
            actor = transition["after"]["status"]
        elif transition["actor"].startswith("human:"):
            actor = transition["actor"]
        else:
            observation = snapshot.observations.get(transition["observation_id"] or "")
            actor = observation["source_id"] if observation else "—"
        timeline.append(
            f"- {common.date_of(transition['timestamp'])} {transition['operation']} "
            f"`{transition['claim_id']}` ({actor})"
        )
    body += timeline or ["- none yet"]
    body += ["", "## Related", "", *related_lines(snapshot, page, pages), ""]
    return "\n".join(head + body)


def volatile_from(meta: dict | None, fresh: dict) -> dict:
    """Dates and stamps carried over from the page on disk, so an unchanged page stays unchanged."""
    if not meta:
        return fresh
    generated: dict = meta["generated"] if isinstance(meta.get("generated"), dict) else {}
    return {
        "created": _scalar(meta.get("created"), fresh["created"]),
        "updated": _scalar(meta.get("updated"), fresh["updated"]),
        "last_rendered": _stamp(meta.get("last_rendered"), fresh["last_rendered"]),
        "generated_at": _scalar(generated.get("at"), fresh["generated_at"]),
    }


def _scalar(value, default: str) -> str:
    if value is None:
        return default
    if hasattr(value, "isoformat"):
        return value.isoformat()[:10]
    return str(value)


def _stamp(value, default: str) -> str:
    if value is None:
        return default
    if hasattr(value, "strftime"):
        return value.strftime(common.TIMESTAMP_FORMAT)
    return str(value)


def fresh_volatile(existing_meta: dict | None) -> dict:
    now = common.now()
    today = common.date_of(now)
    created = today
    if existing_meta and existing_meta.get("created") is not None:
        created = _scalar(existing_meta.get("created"), today)
    return {"created": created, "updated": today, "last_rendered": now, "generated_at": today}


# --------------------------------------------------------------------------- index


def shelf_of(path: str) -> str:
    """The shelf folder segment of a rendered page's path, in either segment."""
    return next(part for part in path.split("/") if part in common.SHELVES.values())


def index_rows(pages: dict[str, Page]) -> dict[str, list[str]]:
    rows: dict[str, list[str]] = {shelf: [] for shelf in common.SHELVES.values()}
    for page in sorted(pages.values(), key=lambda p: p.path):
        shelf = shelf_of(page.path)
        slug = common.slug_for(page.entity["entity_id"])
        cell = page.in_here.replace("|", "\\|")
        rows[shelf].append(f"| [[{slug}]] | {page.status} | {cell} |")
    return rows


def blank_index() -> str:
    """A freshly born segment's index.md: the title and one empty table per shelf."""
    lines = ["# Wiki Index", ""]
    for shelf in common.SHELVES.values():
        lines += [f"## {shelf.capitalize()}", "", INDEX_HEADER, INDEX_SEPARATOR, ""]
    return "\n".join(lines).rstrip("\n") + "\n"


def index_text(current: str, pages: dict[str, Page]) -> str:
    rows = index_rows(pages)
    headings = {shelf.capitalize(): shelf for shelf in rows}
    lines = current.splitlines()
    out: list[str] = []
    seen: set[str] = set()
    section: str | None = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("## "):
            section = headings.get(line[3:].strip())
        if section and line.startswith("| Page |"):
            out += [INDEX_HEADER, INDEX_SEPARATOR, *rows[section]]
            seen.add(section)
            i += 1
            while i < len(lines) and lines[i].startswith("|"):
                i += 1
            continue
        out.append(line)
        i += 1
    for heading, shelf in headings.items():
        if shelf not in seen and rows[shelf]:
            out += ["", f"## {heading}", "", INDEX_HEADER, INDEX_SEPARATOR, *rows[shelf]]
    return "\n".join(out).rstrip("\n") + "\n"


# --------------------------------------------------------------------------- pages on disk


def shelf_pages(layout: common.Layout) -> list[Path]:
    found = []
    for shelf in common.SHELVES.values():
        folder = layout.wiki / shelf
        if folder.is_dir():
            found.extend(sorted(folder.rglob("*.md")))
    return found


def first_difference(expected: str, actual: str) -> str:
    expected_lines, actual_lines = expected.splitlines(), actual.splitlines()
    section = "frontmatter"
    for index in range(max(len(expected_lines), len(actual_lines))):
        line = actual_lines[index] if index < len(actual_lines) else None
        reference = expected_lines[index] if index < len(expected_lines) else None
        if reference and reference.startswith("## "):
            section = reference[3:]
        elif reference and reference.startswith("# "):
            section = "title"
        if line != reference:
            return section
    return "end of file"


# --------------------------------------------------------------------------- verbs


@dataclass
class RenderResult:
    written: list[str]
    removed: list[str]
    index_changed: bool


def render_once(layout: common.Layout, args: argparse.Namespace) -> tuple[int, RenderResult | None]:
    """Compute and, unless --dry-run, write the pages and index; (exit_code, result)."""
    snapshot = load(layout)
    pages = build_pages(snapshot)
    wanted = set(args.entity or [])
    unknown = sorted(e for e in wanted if e not in snapshot.entities)
    if unknown:
        print(f"error: no such entity: {', '.join(unknown)}", file=sys.stderr)
        return 1, None
    targets = [
        page
        for page in pages.values()
        if not wanted
        or page.entity["entity_id"] in wanted
        or (wanted & related_entities(snapshot, page) and layout.abs(page.path).is_file())
    ]

    written: list[str] = []
    for page in targets:
        path = layout.abs(page.path)
        existing_text = path.read_text(encoding="utf-8") if path.is_file() else None
        existing_meta = common.split_frontmatter(existing_text)[0] if existing_text else None
        fresh = fresh_volatile(existing_meta)
        candidate = render_page(snapshot, page, pages, volatile_from(existing_meta, fresh))
        if existing_text is not None and candidate == existing_text:
            continue
        if not args.dry_run:
            common.write_text_if_changed(path, render_page(snapshot, page, pages, fresh))
        written.append(page.path)

    removed: list[str] = []
    for path in shelf_pages(layout):
        rel = layout.rel(path)
        meta, _ = common.read_frontmatter(path)
        if "entity_ids" not in meta or rel in pages:
            continue
        if not args.dry_run:
            path.unlink()
        removed.append(rel)

    index_exists = layout.index.is_file()
    if index_exists:
        current = layout.index.read_text(encoding="utf-8")
    else:
        current = blank_index() if pages else None
    index_changed = False
    if current is not None:
        updated = index_text(current, pages)
        index_changed = updated != current or not index_exists
        if index_changed and not args.dry_run:
            common.write_text_if_changed(layout.index, updated)

    return 0, RenderResult(written, removed, index_changed)


def print_render_result(result: RenderResult, prefix: str = "") -> None:
    print(f"{prefix}rendered: {', '.join(result.written) if result.written else 'none'}")
    if result.removed:
        print(f"{prefix}removed: {', '.join(result.removed)}")
    print(f"{prefix}index: {'updated' if result.index_changed else 'unchanged'}")


def cmd_render(layout: common.Layout, args: argparse.Namespace) -> int:
    """The dry-run path: computes and previews, never a run — no policy, lock, or audit row."""
    code, result = render_once(layout, args)
    if result is None:
        return code
    print_render_result(result, prefix="dry-run · ")
    return 0


def render_args(args: argparse.Namespace) -> list[str]:
    """The render verb's own arguments, as given on the command line."""
    if args.entity:
        return ["--entity", *args.entity]
    return ["--all"] if args.all else []


def deny_render(layout: common.Layout, actor: str, role: str, args_list: list[str]) -> int:
    """Refuse a denied render: one denied audit row, the engine's denial line, exit 3."""
    views = common.views_hash(layout)
    timestamp = common.now()
    detail = f"{role} may not render on {layout.segment}"
    common.append_audit(
        layout,
        common.audit_row(
            common.run_id(actor, "render", timestamp, [], views),
            timestamp=timestamp,
            actor=actor,
            role=role,
            verb="render",
            segment=layout.segment,
            args=args_list,
            outcome="denied",
            inputs=[],
            appended={},
            views_before=views,
            views_after=views,
            detail=detail,
        ),
    )
    print(
        f"denied: {actor} may not render on {layout.segment} (governance.json roles.{role})",
        file=sys.stderr,
    )
    return 3


def run_render(layout: common.Layout, args: argparse.Namespace) -> int:
    """A render that is not --dry-run is a run: policy, lock, and — if it wrote — one audit row."""
    own_args = render_args(args)
    actor = args.actor or os.environ.get("LLM_WIKI_ACTOR") or GENERATED_BY
    if not common.ACTOR_RE.match(actor):
        print(f"error: actor {actor!r} is not {common.ACTOR_RE.pattern}", file=sys.stderr)
        return 2
    policy = common.load_policy(layout)
    role = common.role_of(policy, actor)
    if not common.allowed(policy, role, "render", layout.segment):
        return deny_render(layout, actor, role, own_args)
    with common.hold_lock(layout, actor, "render", policy["lock_timeout_s"]):
        views_before = common.views_hash(layout)
        timestamp = common.now()
        code, result = render_once(layout, args)
        if result is None:
            return code
        print_render_result(result)
        if result.written or result.removed or result.index_changed:
            run = common.run_id(actor, "render", timestamp, [], views_before)
            common.append_audit(
                layout,
                common.audit_row(
                    run,
                    timestamp=timestamp,
                    actor=actor,
                    role=role,
                    verb="render",
                    segment=layout.segment,
                    args=own_args,
                    outcome="ok",
                    inputs=[],
                    appended={},
                    views_before=views_before,
                    views_after=views_before,
                    pages={"written": result.written, "removed": result.removed},
                ),
            )
            print(f"run: {run}")
    return 0


def is_run(args: argparse.Namespace) -> bool:
    """A render that is not --dry-run is a run; check never is."""
    return args.verb == "render" and not args.dry_run


def near_duplicate_keys(snapshot: Snapshot) -> list[tuple[str, str]]:
    keys = sorted({c["claim_key"] for c in snapshot.claims.values() if is_live(c)})
    pairs = []
    for i, left in enumerate(keys):
        for right in keys[i + 1 :]:
            if difflib.SequenceMatcher(None, left, right).ratio() >= 0.9:
                pairs.append((left, right))
    return pairs


def newest_transition_date(snapshot: Snapshot, page: Page) -> str:
    """The date of the newest transition of any claim on the page; "" when it has none."""
    claim_ids = {c["claim_id"] for c in page.claims}
    dates = [
        common.date_of(t["timestamp"]) for t in snapshot.transitions if t["claim_id"] in claim_ids
    ]
    return max(dates, default="")


def volatile_findings(rel: str, volatile: dict, snapshot: Snapshot, page: Page) -> list[str]:
    """The dates check reads back from the page, judged for ordering rather than echoed:
    a hand-edited `updated` or `last_rendered` is invisible to the drift comparison."""
    created, updated = volatile["created"], volatile["updated"]
    newest = newest_transition_date(snapshot, page)
    found = []
    if created > updated:
        found.append(f"{rel}: created {created} is after updated {updated}")
    if newest and updated < newest:
        found.append(f"{rel}: updated {updated} predates its newest claim transition {newest}")
    if common.date_of(volatile["last_rendered"]) < updated:
        found.append(f"{rel}: last_rendered {volatile['last_rendered']} predates updated {updated}")
    if volatile["generated_at"] != updated:
        found.append(f"{rel}: generated.at {volatile['generated_at']} is not updated {updated}")
    return found


def dangling_evidence(snapshot: Snapshot, page: Page) -> list[str]:
    """Observation ids a rendered claim cites that the ledger does not carry."""
    found = []
    for claim in page.claims:
        cited = [
            *((o, "supporting_observations") for o in claim["supporting_observations"]),
            *((o, "contradicting_observations") for o in claim["contradicting_observations"]),
            *((e["evidence"], "exceptions[].evidence") for e in claim["exceptions"]),
        ]
        for observation_id, field in cited:
            if observation_id not in snapshot.observations:
                found.append(
                    f"{claim['claim_id']}: {field} {observation_id} is in no observation ledger"
                )
    return found


def cmd_check(layout: common.Layout, args: argparse.Namespace) -> int:
    snapshot = load(layout)
    pages = build_pages(snapshot)
    findings: list[str] = []
    notes: list[str] = []

    seen: set[str] = set()
    for path in shelf_pages(layout):
        rel = layout.rel(path)
        text = path.read_text(encoding="utf-8")
        meta, _ = common.split_frontmatter(text)
        if "entity_ids" not in meta:
            findings.append(
                f"{rel}: not rendered from state (no entity_ids) — hand-written pages are retired"
            )
            continue
        entity_ids = meta.get("entity_ids") or []
        entity_id = entity_ids[0] if entity_ids else None
        if entity_id not in snapshot.entities:
            findings.append(f"{rel}: entity_ids {entity_id!r} resolves to no entity")
            continue
        page = pages.get(rel)
        if page is None or page.entity["entity_id"] != entity_id:
            findings.append(
                f"{rel}: no entity renders this page any more — run render to remove it"
            )
            continue
        seen.add(rel)
        for claim_id in meta.get("claim_ids") or []:
            if claim_id not in snapshot.claims:
                findings.append(f"{rel}: claim_ids entry {claim_id} resolves to no claim")
        volatile = volatile_from(meta, fresh_volatile(meta))
        expected = render_page(snapshot, page, pages, volatile)
        if expected != text:
            findings.append(f"{rel}: drift in {first_difference(expected, text)} — run render")
        findings += volatile_findings(rel, volatile, snapshot, page)
        if meta.get("status") != page.status:
            findings.append(
                f"{rel}: status {meta.get('status')!r} but its claims say {page.status!r}"
            )
        if bool(meta.get("review_required", False)) != page.review_required:
            findings.append(
                f"{rel}: review_required {meta.get('review_required')!r} "
                f"but its claims say {page.review_required}"
            )

    for rel in sorted(set(pages) - seen):
        findings.append(f"{rel}: page missing — run render")

    findings += sorted({f for page in pages.values() for f in dangling_evidence(snapshot, page)})

    if layout.index.is_file():
        current = layout.index.read_text(encoding="utf-8")
        if index_text(current, pages) != current:
            findings.append(
                "llm-wiki/wiki/index.md: rows differ from the rendered pages — run render"
            )
    elif pages:
        findings.append("llm-wiki/wiki/index.md: missing")

    archives: dict[str, str | None] = {}
    for source_id, source in snapshot.sources.items():
        archive = layout.abs(source["path"])
        if not archive.is_file():
            findings.append(f"{source_id}: archive missing: {source['path']}")
            archives[source_id] = None
            continue
        if common.file_hash(archive) != source["hash"]:
            findings.append(
                f"{source_id}: archive hash mismatch for {source['path']} — raw is immutable; "
                "re-archive beside it and register the new path"
            )
        archives[source_id] = archive.read_text(encoding="utf-8", errors="replace")
    for observation_id, observation in snapshot.observations.items():
        text = archives.get(observation["source_id"])
        if text is None:
            if observation["source_id"] not in snapshot.sources:
                findings.append(
                    f"{observation_id}: source {observation['source_id']} is not registered"
                )
            continue
        found, _ = common.find_span(observation["evidence_span"], text)
        if not found:
            findings.append(
                f"{observation_id}: evidence_span not found in "
                f"{snapshot.sources[observation['source_id']]['path']}"
            )

    for left, right in near_duplicate_keys(snapshot):
        notes.append(f"near-duplicate claim keys: {left} ~ {right}")
    for conflict in snapshot.conflicts:
        claim = snapshot.claims.get(conflict["claim_id"], {})
        notes.append(
            f"open conflict: {conflict['claim_id']} ({claim.get('claim_key', '?')}) "
            f"opened by {conflict['opened_by']} at {conflict['opened_at']}"
        )

    for finding in findings:
        print(f"FAIL {finding}")
    for note in notes:
        print(f"note: {note}")
    if findings:
        print(f"check: {len(findings)} findings over {len(pages)} pages")
        return 1
    print(f"check: clean ({len(pages)} pages, {len(notes)} notes)")
    return 0


# --------------------------------------------------------------------------- cli


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="render.py", description=DESCRIPTION)
    parser.add_argument(
        "--root", help="repo root holding llm-wiki/ (default: cwd or $LLM_WIKI_ROOT)"
    )
    parser.add_argument(
        "--segment",
        choices=common.SEGMENTS,
        help="which segment to read and write (default: shared or $LLM_WIKI_SEGMENT)",
    )
    parser.add_argument(
        "--actor", help=f"who runs a render (default: $LLM_WIKI_ACTOR or {GENERATED_BY})"
    )
    verbs = parser.add_subparsers(dest="verb", required=True)

    render = verbs.add_parser("render", help="write or refresh entity pages and their index rows")
    scope = render.add_mutually_exclusive_group()
    scope.add_argument(
        "--all", action="store_true", help="every entity at or above the threshold (default)"
    )
    scope.add_argument("--entity", nargs="+", metavar="ID")
    render.add_argument("--dry-run", action="store_true")
    render.set_defaults(run=cmd_render)

    check = verbs.add_parser("check", help="state↔pages integrity; exit 1 on findings")
    check.set_defaults(run=cmd_check)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    layout = common.layout_from(args.root, args.segment)
    try:
        return run_render(layout, args) if is_run(args) else args.run(layout, args)
    except common.LockHeld as error:
        print(str(error), file=sys.stderr)
        return 3
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
