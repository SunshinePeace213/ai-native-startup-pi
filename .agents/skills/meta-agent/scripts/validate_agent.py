#!/usr/bin/env python3
"""Validate a pi-subagents agent file before it is loaded.

Usage: uv run --no-project scripts/validate_agent.py <path-to-agent.md>

Errors are what pi-subagents rejects or what breaks routing; warnings are the
contract and body anti-patterns this skill exists to catch. Exit 0 when there
are no errors.
"""

import re
import sys
from pathlib import Path

NAME_RE = re.compile(r"^[a-z0-9]+([-_.][a-z0-9]+)*$")
ADVERTISE_DESC_BYTES = 512

PI_BUILTIN_TOOLS = {"read", "bash", "edit", "write", "grep", "find", "ls", "powershell"}
RUNTIME_TOOLS = {"contact_supervisor", "subagent", "intercom", "structured_output", "bg_wait"}
READ_ONLY_TOOLS = {"read", "grep", "find", "ls", "contact_supervisor"}
KNOWN_FIELDS = {
    "name",
    "description",
    "aliases",
    "advertise",
    "package",
    "tools",
    "excludeTools",
    "allowNestedSubagents",
    "extensions",
    "subagentOnlyExtensions",
    "model",
    "fallbackModels",
    "thinking",
    "systemPromptMode",
    "inheritProjectContext",
    "inheritGlobalContext",
    "inheritSkills",
    "skills",
    "skill",
    "skillPath",
    "defaultContext",
    "defaultReads",
    "defaultProgress",
    "output",
    "async",
    "timeoutMs",
    "toolTimeoutMs",
    "acceptance",
    "acceptanceRole",
    "completionGuard",
    "mutationTools",
    "interactive",
    "maxSubagentDepth",
    "memory",
}
THINKING_LEVELS = {"off", "minimal", "low", "medium", "high", "xhigh", "max"}
REVIEW_WORDS = re.compile(r"\b(review|audit|validate|critique|advis|inspect)", re.I)
ANTI_PATTERNS = [
    (
        r"\b(think harder|think carefully|think step by step)\b",
        "effort belongs in `thinking`, not prose",
    ),
    (
        r"\b(be thorough|be comprehensive|be diligent)\b",
        "restates what a strong model already does",
    ),
    (
        r"\b(double[- ]check|re-?verify your (work|answer))\b",
        "self-verification compounds into wasted turns",
    ),
    (r"\b(ALWAYS|NEVER|MUST)\b(?![^\n]*\bbecause\b)", "shouty directive without a reason"),
    (
        r"\b(explain|show|reveal) your (reasoning|thinking|chain of thought)\b",
        "never ask a model to expose its own reasoning",
    ),
    (r"\bask the user\b", "a child cannot reach the user; escalate via contact_supervisor"),
    (
        r"\bwhen to (use|invoke) (me|this agent)\b",
        "triggering lives in the description, not the body",
    ),
]


def parse_frontmatter(text):
    if not text.startswith("---\n"):
        return None, "no frontmatter block at top of file"
    end = text.find("\n---", 4)
    if end == -1:
        return None, "frontmatter never closes"
    fields = {}
    key = None
    for line in text[4:end].splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line[0] in " \t":
            if key is None:
                return None, f"indented line outside a field: {line!r}"
            item = line.strip()
            fields[key] += (", " if item.startswith("- ") else " ") + item.removeprefix("- ")
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


def as_list(value):
    return [v.strip() for v in re.split(r"[,\n]", value) if v.strip()]


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    agent_md = Path(sys.argv[1]).resolve()
    errors, warnings = [], []
    if not agent_md.is_file():
        print(f"ERROR {agent_md} is missing")
        return 1
    parsed, err = parse_frontmatter(agent_md.read_text())
    if err:
        print(f"ERROR {agent_md}: {err}")
        return 1
    fields, body = parsed

    name = fields.get("name", "")
    desc = fields.get("description", "")
    if not name:
        errors.append("`name` is missing")
    elif name.startswith("<"):
        warnings.append("`name` is still the template placeholder")
    elif not NAME_RE.match(name):
        errors.append(f"`name` {name!r}: lowercase letters, digits, single separators")
    elif name != agent_md.stem:
        warnings.append(
            f"`name` {name!r} != file stem {agent_md.stem!r}; keep them equal for discoverability"
        )
    if not desc:
        errors.append("`description` is missing — the parent has nothing to route on")
    else:
        nbytes = len(desc.encode("utf-8"))
        if fields.get("advertise", "").lower() == "true" and nbytes > ADVERTISE_DESC_BYTES:
            errors.append(
                f"`description` is {nbytes} bytes; "
                f"advertised entries are capped at {ADVERTISE_DESC_BYTES}"
            )
        if not re.search(r"\b(use|when|for|not for)\b", desc, re.I):
            warnings.append("`description` reads as a summary, not a routing situation")

    for k in fields:
        if k not in KNOWN_FIELDS:
            warnings.append(f"unknown frontmatter field {k!r} is ignored by pi-subagents")

    thinking = fields.get("thinking", "")
    if thinking and thinking not in THINKING_LEVELS:
        errors.append(f"`thinking` {thinking!r} is not one of {sorted(THINKING_LEVELS)}")
    if fields.get("model") and fields["model"] != "inherit":
        warnings.append(
            "`model` pinned in the agent file; model names are deployment policy "
            "and belong in settings agentOverrides"
        )

    mode = fields.get("systemPromptMode", "replace")
    if mode == "replace" and fields.get("inheritProjectContext", "false").lower() != "true":
        warnings.append(
            "replace mode without `inheritProjectContext: true`: "
            "the child sees no AGENTS.md and no repo conventions"
        )

    tools = as_list(fields["tools"]) if "tools" in fields else None
    if tools is not None:
        if not tools:
            warnings.append("`tools:` is empty — the child gets no tools at all")
        unknown = [
            t
            for t in tools
            if t not in PI_BUILTIN_TOOLS | RUNTIME_TOOLS and not t.startswith("mcp:")
        ]
        if unknown and not fields.get("extensions") and not fields.get("subagentOnlyExtensions"):
            note = (
                ""
                if fields.get("async", "").lower() == "true"
                else " and the agent is not `async: true`, so a foreground launch will fail"
            )
            warnings.append(
                f"extension tools {unknown} need their provider via "
                f"`extensions`/`subagentOnlyExtensions`{note}"
            )
        if "ask_user_question" in tools:
            errors.append(
                "`ask_user_question` never reaches a child; use contact_supervisor for decisions"
            )
        read_only = set(tools) <= READ_ONLY_TOOLS
        if (
            "bash" in tools
            and REVIEW_WORDS.search(desc + " " + body[:400])
            and fields.get("completionGuard", "").lower() != "false"
        ):
            warnings.append(
                "bash-holding review/validation agent without `completionGuard: false` "
                "may be judged as an implementation agent that made no edits"
            )
        if "subagent" in tools and not re.search(
            r"\b(delegate only|never spawn|do not (spawn|launch))", body, re.I
        ):
            warnings.append("holds `subagent` without a delegation cap in the body")
    else:
        read_only = False
        warnings.append("`tools` omitted: the child gets every builtin including edit/write/bash")
    if read_only and fields.get("acceptanceRole", "") not in ("", "read-only"):
        warnings.append("read-only tools but `acceptanceRole` is not read-only")

    if not body.strip():
        errors.append("no system prompt body")
    has_output = re.search(
        r"^(#+ .*\b(output|report|response|findings)\b"
        r"|output format:|your (final response|output))",
        body,
        re.M | re.I,
    )
    if not has_output:
        warnings.append(
            "no `## Output` section — the parent sees only the final message, "
            "so its shape is the contract"
        )
    if "contact_supervisor" in (tools or []) and "contact_supervisor" not in body:
        warnings.append("`contact_supervisor` is in tools but the body never says when to use it")
    if (
        "contact_supervisor" in body
        and "contact_supervisor" not in (tools or [])
        and tools is not None
    ):
        warnings.append(
            "body references `contact_supervisor` but `tools` does not list it; "
            "it exists only when the runtime bridge injects it"
        )
    for pattern, why in ANTI_PATTERNS:
        m = re.search(pattern, body)
        if m:
            warnings.append(f"body: {m.group(0)!r} — {why}")
    lines = body.count("\n")
    if lines > 150:
        warnings.append(f"body is {lines} lines; every line recurs on every child turn")

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    if not errors and not warnings:
        print(f"OK    {name}: frontmatter valid, {lines} body lines")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
