#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pyyaml>=6"]
# ///
"""Deterministic page gate: validate llm-wiki wiki pages against the schema.

The executable form of the Page Schema in docs/llm-wiki/standards.md.
Owns the mechanical checks — field vocabulary and shapes, folder <-> type, the
routing line, canonical section names, source citations, wikilinks, images —
plus two governance checks: privacy (no private/secret source or observation
row, and no page citing llm-wiki/private/, in the shared segment) and leakage
(no secret or PII pattern in the tracked llm-wiki/ tree, scanned against
evals/governance_patterns.json). Judgment (per-claim evidence quality,
cramming, contradictions) stays with /skill:llm-wiki-lint.

The reserved fields are the Phase-1+ state layer's outputs: never written by
hand today, but a page rendered by that machinery must pass this same gate
unchanged — that is the forward-compatibility contract.

Usage: lint.py [<wiki-root>]        (default llm-wiki/wiki)
One line per check: `PASS <check> <detail>` / `FAIL <check> <detail>`. Exit 1
on any failure. A wiki holding no pages passes the page checks — empty is the
seed state — but privacy and leakage still run.
"""

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

import common
import yaml

DESCRIPTION = (__doc__ or "").split("\n\n")[0]
REQUIRED_FIELDS = {"type", "status", "created", "updated", "sources"}
OPTIONAL_FIELDS = {"generated", "verified", "stale_after", "review_required", "scope"}
RESERVED_FIELDS = {"confidence", "entity_ids", "claim_ids", "last_rendered"}
STATUSES = {"current", "disputed"}
SOURCE_ENTRY_KEYS = {"resource", "title", "id"}
# One fixed spelling per canonical section, so greps and the Phase-1 renderer
# target the same headings.
CANONICAL_SECTIONS = {"Open questions", "Contradictions", "Superseded", "Timeline", "Related"}
NON_PAGES = {"index.md", "log.md"}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
STAMP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}([T ].*)?$")
IN_HERE_RE = re.compile(r"^>\s*\*\*In here:\*\*\s+\S")
H2_RE = re.compile(r"^## (.+?)\s*$", re.M)
WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)[^\]]*\]\]")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)")
LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)")

# The privacy check's forbidden vocabulary: a source's sensitivity or an observation's
# privacy at either of these values must never sit in the shared segment.
SENSITIVE_VALUES = {"private", "secret"}
PRIVATE_PREFIX = "llm-wiki/private/"

# The leakage check's own governance file, and the binary extensions it never opens as
# text — always under raw/assets/, since every other channel is markdown.
GOVERNANCE_PATTERNS_PATH = Path("llm-wiki/evals/governance_patterns.json")
BINARY_ASSET_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".bmp",
    ".ico",
    ".pdf",
    ".mp3",
    ".mp4",
    ".mov",
    ".zip",
    ".woff",
    ".woff2",
}


@dataclass
class Pattern:
    name: str
    regex: re.Pattern


@dataclass
class Page:
    path: Path
    rel: Path
    meta: dict
    body: str


def split_frontmatter(text: str) -> tuple[dict | None, str, str | None]:
    if not text.startswith("---\n"):
        return None, text, "no opening frontmatter fence"
    end = text.find("\n---\n", 4)
    if end == -1:
        return None, text, "frontmatter never closes"
    try:
        meta = yaml.safe_load(text[4:end])
    except yaml.YAMLError as exc:
        return None, text, "frontmatter is not YAML ({})".format(str(exc).replace("\n", " "))
    if not isinstance(meta, dict):
        return None, text, "frontmatter is not a mapping"
    return meta, text[end + 5 :], None


def prose(body: str) -> str:
    """The body with fenced code removed — fence contents are samples, not structure."""
    kept, fenced = [], False
    for line in body.splitlines():
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if not fenced:
            kept.append(line)
    return "\n".join(kept)


def plain_date(value) -> str | None:
    """ISO form when value is a YAML date or YYYY-MM-DD string, else None."""
    if isinstance(value, datetime):
        return None  # a plain-date field must not carry a time
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str) and DATE_RE.match(value):
        return value
    return None


def event_problems(value, field: str) -> list[str]:
    if not isinstance(value, dict) or set(value) != {"by", "at"}:
        return [f"{field} must be a {{by, at}} mapping"]
    problems = []
    if not (isinstance(value["by"], str) and common.ACTOR_RE.match(value["by"])):
        problems.append(f"{field}.by must match {common.ACTOR_RE.pattern}")
    if plain_date(value["at"]) is None:
        problems.append(f"{field}.at must be YYYY-MM-DD")
    return problems


def collect(wiki_root: Path) -> tuple[list[Page], list[str]]:
    pages, broken = [], []
    for path in sorted(wiki_root.rglob("*.md")):
        rel = path.relative_to(wiki_root)
        if str(rel) in NON_PAGES:
            continue
        meta, body, err = split_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        if meta is None:
            broken.append(f"{rel}: {err}")
        else:
            pages.append(Page(path, rel, meta, body))
    return pages, broken


def check_vocabulary(pages: list[Page], broken: list[str]) -> list[str]:
    problems = list(broken)
    known = REQUIRED_FIELDS | OPTIONAL_FIELDS | RESERVED_FIELDS
    for page in pages:
        if missing := REQUIRED_FIELDS - set(page.meta):
            problems.append(f"{page.rel}: missing required field(s) {sorted(missing)}")
        if unknown := set(page.meta) - known:
            problems.append(f"{page.rel}: unknown field(s) {sorted(unknown)}")
    return problems


def check_field_shapes(pages: list[Page]) -> list[str]:
    problems = []
    for page in pages:
        meta = page.meta
        found: list[str] = []
        bad = found.append

        if "type" in meta and meta["type"] not in common.SHELVES:
            bad(f"type must be one of {sorted(common.SHELVES)}, got {meta['type']!r}")
        if "status" in meta and meta["status"] not in STATUSES:
            bad(f"status must be one of {sorted(STATUSES)}, got {meta['status']!r}")

        created = plain_date(meta.get("created")) if "created" in meta else None
        updated = plain_date(meta.get("updated")) if "updated" in meta else None
        if "created" in meta and created is None:
            bad("created must be YYYY-MM-DD")
        if "updated" in meta and updated is None:
            bad("updated must be YYYY-MM-DD")
        if created and updated and updated < created:
            bad(f"updated {updated} predates created {created}")

        sources = meta.get("sources")
        if "sources" in meta:
            if not isinstance(sources, list) or not sources:
                bad("sources must be a non-empty list")
            else:
                for entry in sources:
                    if not isinstance(entry, dict) or "resource" not in entry:
                        bad(f"source entry must be a mapping with resource:, got {entry!r}")
                    elif extra := set(entry) - SOURCE_ENTRY_KEYS:
                        bad(f"source entry has unknown key(s) {sorted(extra)}")

        if "generated" in meta:
            found += event_problems(meta["generated"], "generated")
        if "verified" in meta:
            if not isinstance(meta["verified"], list):
                bad("verified must be a list of {by, at} events")
            else:
                for event in meta["verified"]:
                    found += event_problems(event, "verified[]")
        if "stale_after" in meta and plain_date(meta["stale_after"]) is None:
            bad("stale_after must be YYYY-MM-DD")
        if "review_required" in meta and not isinstance(meta["review_required"], bool):
            bad("review_required must be a boolean")
        if "scope" in meta and meta["scope"] not in ("shared", "private"):
            bad(f"scope must be 'shared' or 'private', got {meta['scope']!r}")

        if "confidence" in meta:
            value = meta["confidence"]
            numeric = isinstance(value, int | float) and not isinstance(value, bool)
            if not numeric or not 0 <= value <= 1:
                bad(f"confidence must be a number in [0, 1], got {value!r}")
        for field in ("entity_ids", "claim_ids"):
            if field in meta:
                value = meta[field]
                ok = isinstance(value, list) and all(
                    isinstance(item, str) and item for item in value
                )
                if not ok:
                    bad(f"{field} must be a list of non-empty strings")
        if "last_rendered" in meta:
            value = meta["last_rendered"]
            ok = isinstance(value, date) or (isinstance(value, str) and STAMP_RE.match(value))
            if not ok:
                bad("last_rendered must be a date or ISO timestamp")

        problems += [f"{page.rel}: {message}" for message in found]
    return problems


def check_folder_type(pages: list[Page]) -> list[str]:
    problems = []
    for page in pages:
        if len(page.rel.parts) < 2:
            problems.append(
                f"{page.rel}: page sits at the wiki root — every page lives in its type folder"
            )
            continue
        page_type = page.meta.get("type")
        folder = common.SHELVES.get(page_type) if isinstance(page_type, str) else None
        if folder and page.rel.parts[0] != folder:
            problems.append(
                f"{page.rel}: type {page_type!r} belongs under {folder}/, not {page.rel.parts[0]}/"
            )
    return problems


def check_routing(pages: list[Page]) -> list[str]:
    problems = []
    for page in pages:
        lines = prose(page.body).splitlines()
        h1_indexes = [i for i, line in enumerate(lines) if line.startswith("# ")]
        if len(h1_indexes) != 1:
            problems.append(f"{page.rel}: expected exactly one H1 title, found {len(h1_indexes)}")
            continue
        following = [line for line in lines[h1_indexes[0] + 1 :] if line.strip()]
        if not following or not IN_HERE_RE.match(following[0]):
            problems.append(f"{page.rel}: first line after the title must be `> **In here:** …`")
    return problems


def check_sections(pages: list[Page]) -> list[str]:
    problems = []
    lower_canon = {name.lower(): name for name in CANONICAL_SECTIONS}
    for page in pages:
        h2s = H2_RE.findall(prose(page.body))
        for heading in h2s:
            canonical = lower_canon.get(heading.lower())
            if canonical and heading != canonical:
                problems.append(f"{page.rel}: section '## {heading}' must be '## {canonical}'")
        if page.meta.get("status") == "disputed" and "Contradictions" not in h2s:
            problems.append(f"{page.rel}: a disputed page carries a `## Contradictions` section")
    return problems


def check_citations(pages: list[Page], repo_root: Path) -> list[str]:
    problems = []
    for page in pages:
        sources = page.meta.get("sources")
        if not isinstance(sources, list):
            continue
        for entry in sources:
            resource = entry.get("resource") if isinstance(entry, dict) else None
            if not isinstance(resource, str):
                continue
            if resource.startswith("/") or ".." in resource or "://" in resource:
                problems.append(f"{page.rel}: resource must be a repo-relative path: {resource}")
            elif not (repo_root / resource).exists():
                problems.append(f"{page.rel}: cited resource does not exist: {resource}")
    return problems


def check_wikilinks(pages: list[Page], extra_stems: frozenset[str] = frozenset()) -> list[str]:
    """extra_stems is the shared root's own page stems, added only when pages themselves
    were collected from a private wiki root — a private page's `## Related` may wikilink
    a shared page (spec.md `### Renderer…`); the shared root never sees private stems."""
    problems = []
    stems = {page.path.stem for page in pages} | extra_stems
    for page in pages:
        for target in WIKILINK_RE.findall(prose(page.body)):
            name = target.strip()
            if name and name not in stems:
                problems.append(f"{page.rel}: wikilink [[{name}]] resolves to no page")
    return problems


def check_images(pages: list[Page]) -> list[str]:
    problems = []
    for page in pages:
        for src in IMAGE_RE.findall(prose(page.body)):
            if src.startswith(("http://", "https://")):
                problems.append(f"{page.rel}: image must be a local file, not {src}")
            elif not (page.path.parent / src).exists():
                problems.append(f"{page.rel}: image does not resolve: {src}")
    return problems


def _scan_ledger_privacy(path: Path, repo_root: Path, field: str) -> list[str]:
    """Row numbers of `path` whose `field` is private or secret — names the row, never
    its content."""
    if not path.is_file():
        return []
    problems = []
    rel = path.relative_to(repo_root).as_posix()
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue  # a malformed row is another check's job
        value = row.get(field) if isinstance(row, dict) else None
        if value in SENSITIVE_VALUES:
            problems.append(f"{rel}:{line_no} {field} {value}")
    return problems


def check_privacy(pages: list[Page], repo_root: Path) -> list[str]:
    problems = []
    states = repo_root / "llm-wiki" / "states"
    if states.is_dir():
        problems += _scan_ledger_privacy(states / "sources.jsonl", repo_root, "sensitivity")
        for observations in sorted((states / "observations").glob("*.jsonl")):
            problems += _scan_ledger_privacy(observations, repo_root, "privacy")

    for page in pages:
        sources = page.meta.get("sources")
        if isinstance(sources, list):
            for entry in sources:
                resource = entry.get("resource") if isinstance(entry, dict) else None
                if isinstance(resource, str) and resource.startswith(PRIVATE_PREFIX):
                    problems.append(f"{page.rel}: sources cites {resource}")
        for target in LINK_RE.findall(prose(page.body)):
            if target.startswith(PRIVATE_PREFIX):
                problems.append(f"{page.rel}: links to {target}")
                continue
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            resolved = (page.path.parent / target).resolve()
            try:
                rel = resolved.relative_to(repo_root.resolve()).as_posix()
            except ValueError:
                continue
            if rel.startswith(PRIVATE_PREFIX):
                problems.append(f"{page.rel}: links to {rel}")
    return problems


def _load_governance_patterns(repo_root: Path) -> tuple[list[Pattern], list[Pattern]]:
    """(secret-and-pii patterns, allow patterns) from evals/governance_patterns.json."""
    path = repo_root / GOVERNANCE_PATTERNS_PATH
    data = json.loads(path.read_text(encoding="utf-8"))
    watched = [
        Pattern(entry["name"], re.compile(entry["pattern"]))
        for entry in data.get("secrets", []) + data.get("pii", [])
    ]
    allow = [
        Pattern(entry["name"], re.compile(entry["pattern"])) for entry in data.get("allow", [])
    ]
    return watched, allow


def _tracked_llm_wiki_files(repo_root: Path) -> list[str]:
    """Every tracked file under llm-wiki/ when repo_root is a git work tree, else every
    file on disk — a scratch copy scanned by walking."""
    if (repo_root / ".git").exists():
        result = subprocess.run(
            ["git", "ls-files", "-z", "--", "llm-wiki"], cwd=repo_root, capture_output=True
        )
        if result.returncode == 0:
            return [entry.decode("utf-8") for entry in result.stdout.split(b"\0") if entry]
    base = repo_root / "llm-wiki"
    if not base.is_dir():
        return []
    return sorted(
        path.relative_to(repo_root).as_posix() for path in base.rglob("*") if path.is_file()
    )


def _is_binary_asset(rel: str) -> bool:
    return "raw/assets/" in rel and Path(rel).suffix.lower() in BINARY_ASSET_EXTENSIONS


def _leak_names(line: str, watched: list[Pattern], allow: list[Pattern]) -> list[str]:
    """Pattern names this line trips — each checked against its own match, never the
    whole line, so an unrelated allow token elsewhere on the line can't mask a real hit."""
    found = []
    for pattern in watched:
        for match in pattern.regex.finditer(line):
            if not any(a.regex.search(match.group(0)) for a in allow):
                found.append(pattern.name)
                break
    return found


def check_leakage(repo_root: Path) -> list[str] | None:
    """None signals a skipped scan, distinct from an empty (clean) result: a wiki root
    with no governance patterns file is a synthetic fixture for something else entirely,
    and the lint contract forbids reporting a scan that never ran as a clean pass."""
    patterns_path = repo_root / GOVERNANCE_PATTERNS_PATH
    if not patterns_path.is_file():
        return None
    watched, allow = _load_governance_patterns(repo_root)

    problems = []
    for rel in _tracked_llm_wiki_files(repo_root):
        if rel.startswith(PRIVATE_PREFIX) or _is_binary_asset(rel):
            continue
        path = repo_root / rel
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue  # binary or unreadable — never this check's job
        for line_no, line in enumerate(text.splitlines(), start=1):
            for name in _leak_names(line, watched, allow):
                problems.append(f"{rel}:{line_no} {name}")
    return problems


def segment_layout(wiki_root: Path) -> tuple[Path, bool]:
    """(repo_root, is_private) for a wiki root under <repo>/llm-wiki/wiki or
    <repo>/llm-wiki/private/wiki — both a shared and a private wiki root sit
    somewhere under the nearest ancestor directory literally named llm-wiki, so
    that ancestor's parent is the repo root in either segment."""
    resolved = wiki_root.resolve()
    for ancestor in resolved.parents:
        if ancestor.name == "llm-wiki":
            rel = resolved.relative_to(ancestor)
            return ancestor.parent, rel.parts[:1] == ("private",)
    raise ValueError(f"{wiki_root} has no llm-wiki/ ancestor")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="lint.py", description=DESCRIPTION)
    parser.add_argument(
        "wiki_root",
        nargs="?",
        default="llm-wiki/wiki",
        metavar="wiki-root",
        help="the wiki root to validate (default: llm-wiki/wiki)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    wiki_root = Path(build_parser().parse_args(argv).wiki_root)
    if not wiki_root.is_dir():
        print(f"FAIL wiki-root no directory at {wiki_root}", file=sys.stderr)
        return 1
    repo_root, private = segment_layout(wiki_root)

    pages, broken = collect(wiki_root)

    shared_stems: frozenset[str] = frozenset()
    if private:
        shared_wiki = repo_root / "llm-wiki" / "wiki"
        if shared_wiki.is_dir():
            shared_pages, _ = collect(shared_wiki)
            shared_stems = frozenset(page.path.stem for page in shared_pages)

    passed_detail = {
        "vocabulary": "every field known, every required field present",
        "field-shapes": "enums, dates, sources, trust and reserved fields well-shaped",
        "folder-type": "every page sits in its type's folder",
        "routing-line": "one H1, then the In-here line",
        "sections": "canonical section spellings; disputed pages carry Contradictions",
        "citations": "every cited resource exists in the repo",
        "wikilinks": "every [[target]] resolves to a page",
        "images": "every image is a resolving local file",
        "privacy": "no private/secret rows, no page cites llm-wiki/private/",
        "leakage": "no secrets or PII in the tracked llm-wiki/ tree",
    }
    skip_detail = {
        "leakage": "governance_patterns.json absent — scan not run",
    }

    if not pages and not broken:
        print("PASS empty-wiki the seed state holds no pages")
        checks = []
    else:
        checks = [
            ("vocabulary", lambda: check_vocabulary(pages, broken)),
            ("field-shapes", lambda: check_field_shapes(pages)),
            ("folder-type", lambda: check_folder_type(pages)),
            ("routing-line", lambda: check_routing(pages)),
            ("sections", lambda: check_sections(pages)),
            ("citations", lambda: check_citations(pages, repo_root)),
            ("wikilinks", lambda: check_wikilinks(pages, shared_stems)),
            ("images", lambda: check_images(pages)),
        ]
    # Privacy and leakage are defined over the shared segment only — a private wiki
    # root's own pages legitimately cite its own private archives. They otherwise run
    # whether or not the wiki holds any pages yet: a planted secret beside an empty
    # shared wiki must still be caught.
    if not private:
        checks += [
            ("privacy", lambda: check_privacy(pages, repo_root)),
            ("leakage", lambda: check_leakage(repo_root)),
        ]

    failures = 0
    for name, run in checks:
        problems = run()
        if problems is None:
            print(f"SKIP {name} {skip_detail[name]}")
        elif problems:
            failures += 1
            print(f"FAIL {name} {'; '.join(problems)}")
        else:
            suffix = "" if name in ("privacy", "leakage") else f" ({len(pages)} pages)"
            print(f"PASS {name} {passed_detail[name]}{suffix}")

    if private:
        print("SKIP privacy shared segment only — not run")
        print("SKIP leakage shared segment only — not run")

    if failures:
        print(f"{failures} failures — the schema is the contract; fix and re-run.")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
