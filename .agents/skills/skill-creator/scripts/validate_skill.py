#!/usr/bin/env python3
"""Validate a skill directory against the Agent Skills standard and Pi's rules.

Usage: uv run --no-project scripts/validate_skill.py <path-to-skill-dir>

Exit 0 when clean. Errors are what Pi refuses to load or the standard
forbids; warnings are what Pi loads anyway but other harnesses may not.
"""

import re
import sys
from pathlib import Path

NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_BODY_LINES = 500
# <root>/.agents/skills/skill-creator/scripts/validate_skill.py -> the project root, so a
# body may also name a repo-level script such as scripts/llm-wiki/state.py.
REPO_ROOT = Path(__file__).resolve().parents[4]
KNOWN_FIELDS = {
    "name",
    "description",
    "license",
    "compatibility",
    "metadata",
    "allowed-tools",
    "disable-model-invocation",
}


def parse_frontmatter(text):
    if not text.startswith("---\n"):
        return None, "no frontmatter block at top of file"
    end = text.find("\n---", 4)
    if end == -1:
        return None, "frontmatter never closes"
    fields = {}
    key = None
    for line in text[4:end].splitlines():
        if not line.strip():
            continue
        if line[0] in " \t":
            if key is None:
                return None, f"indented line outside a field: {line!r}"
            fields[key] += " " + line.strip()
            continue
        if ":" not in line:
            return None, f"line is not `key: value`: {line!r}"
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if value in (">-", ">", "|", "|-"):
            value = ""
        fields[key] = value
    return (fields, text[end + 4 :]), None


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    skill_dir = Path(sys.argv[1]).resolve()
    skill_md = skill_dir / "SKILL.md"
    errors, warnings = [], []

    if not skill_md.is_file():
        print(f"ERROR {skill_md} is missing")
        return 1
    parsed, err = parse_frontmatter(skill_md.read_text())
    if err:
        print(f"ERROR {skill_md}: {err} — Pi will not load this skill")
        return 1
    fields, body = parsed

    name = fields.get("name", "")
    desc = fields.get("description", "")
    if not name:
        errors.append("`name` is missing")
    else:
        if not NAME_RE.match(name):
            errors.append(f"`name` {name!r}: lowercase a-z, 0-9, single hyphens, no edge hyphens")
        if len(name) > 64:
            errors.append(f"`name` is {len(name)} chars; max 64")
        if name != skill_dir.name:
            warnings.append(
                f"`name` {name!r} != directory {skill_dir.name!r} — "
                "Pi tolerates this, the standard does not"
            )
    if not desc:
        errors.append("`description` is missing or empty — Pi will not load the skill")
    else:
        if len(desc) > 1024:
            errors.append(f"`description` is {len(desc)} chars; max 1024")
        if not re.search(
            r"\b(use when|use (this|it) when|when the user|whenever|fire)\b", desc, re.I
        ):
            warnings.append("`description` says what it does but not when to use it")
    if len(fields.get("compatibility", "")) > 500:
        errors.append("`compatibility` exceeds 500 chars")
    for k in fields:
        if k not in KNOWN_FIELDS:
            warnings.append(f"unknown frontmatter field {k!r} is ignored by Pi")

    body_lines = body.count("\n")
    if body_lines > MAX_BODY_LINES:
        warnings.append(f"SKILL.md body is {body_lines} lines; keep it under {MAX_BODY_LINES}")
    if not body.strip():
        warnings.append("SKILL.md has no body")

    linked = re.findall(r"\(((?:scripts|references|assets)/[^)\s]+)\)", body)
    named = re.findall(r"`((?:scripts|references|assets)/[^`\s]+)`", body)
    for ref in sorted(set(linked + named)):
        if "<" in ref:
            continue  # template placeholder
        if not (skill_dir / ref).exists() and not (REPO_ROOT / ref).exists():
            errors.append(
                f"body references {ref} but the file does not exist "
                "beside the skill or at the repo root"
            )

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    if not errors and not warnings:
        print(f"OK    {name}: frontmatter valid, {body_lines} body lines")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
