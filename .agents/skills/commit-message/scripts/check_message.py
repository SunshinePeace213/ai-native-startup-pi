#!/usr/bin/env python3
"""Check a commit message against this repo's format: `<emoji> <type>(<scope>): <description>`.

Usage:
  uv run --no-project scripts/check_message.py <message-file>
  uv run --no-project scripts/check_message.py - < message.txt
  uv run --no-project scripts/check_message.py --squash <message-file>   # subject-only, no footer rules

Exit 0 when clean, 1 with one line per problem — each says what to change.
Lines starting with `#` are ignored, as `git commit` does.
"""

import re
import sys
from pathlib import Path

TYPES = {
    "feat": "\u2728",  # ✨
    "fix": "\U0001f41b",  # 🐛
    "docs": "\U0001f4dd",  # 📝
    "style": "\U0001f3a8",  # 🎨  (not 💄 — that is UI/CSS in gitmoji)
    "refactor": "\u267b\ufe0f",  # ♻️
    "perf": "\u26a1\ufe0f",  # ⚡️
    "test": "\u2705",  # ✅
    "chore": "\U0001f527",  # 🔧
}
EMOJI_TO_TYPE = {v.rstrip("\ufe0f"): k for k, v in TYPES.items()}
ALIASES = {"ci": "chore", "build": "chore", "deps": "chore", "revert": "<type of the reverted commit>"}
SUBJECT_MAX = 72
BODY_MAX = 72
SUBJECT_RE = re.compile(
    r"^(?P<emoji>\S+) (?P<type>[^\s(!:]+)(\((?P<scope>[^)]*)\))?(?P<bang>!)?: (?P<desc>.*)$"
)
REFS_RE = re.compile(r"^Refs #\d+$")
FORBIDDEN_TRAILERS = ("Signed-off-by:", "Co-Authored-By:", "Co-authored-by:")
NON_IMPERATIVE = re.compile(r"^(added|adds|adding|fixed|fixes|fixing|updated|updates|updating|removed|removes|removing|changed|changes|changing|implemented|implements|refactored|moved|renamed|bumped)\b", re.I)


def check(text, squash=False):
    problems = []
    lines = [ln for ln in text.splitlines() if not ln.startswith("#")]
    while lines and not lines[-1].strip():
        lines.pop()
    if not lines or not lines[0].strip():
        return ["empty message: the first line must be `<emoji> <type>(<scope>): <description>`"]

    subject = lines[0]
    m = SUBJECT_RE.match(subject)
    if not m:
        if re.match(r"^:[a-z_]+:", subject):
            problems.append("subject uses a `:shortcode:`; write the literal emoji (`\u2728`, not `:sparkles:`)")
        elif re.match(r"^[a-z]+(\(|:)", subject):
            problems.append("subject has no emoji: prefix the type's emoji, e.g. `\u2728 feat(scope): ...`")
        else:
            problems.append("subject does not parse: expected `<emoji> <type>(<scope>): <description>`")
        return problems

    emoji, typ, scope, bang, desc = (
        m["emoji"], m["type"], m["scope"], m["bang"], m["desc"],
    )
    if typ != typ.lower():
        problems.append(f"type `{typ}` must be lowercase")
        typ = typ.lower()
    if typ not in TYPES:
        hint = ALIASES.get(typ)
        if hint:
            problems.append(f"type `{typ}` is not in the table: use `{hint}` (scope may carry `{typ}`)")
        else:
            problems.append(f"type `{typ}` is not one of {', '.join(TYPES)}")
    else:
        want = TYPES[typ]
        if re.match(r"^:[a-z_+-]+:$", emoji):
            problems.append(f"emoji is the shortcode `{emoji}`; write the literal `{want}`")
        elif emoji.rstrip("\ufe0f") != want.rstrip("\ufe0f"):
            wrong = EMOJI_TO_TYPE.get(emoji.rstrip("\ufe0f"))
            if wrong:
                problems.append(f"emoji `{emoji}` belongs to `{wrong}`; `{typ}` takes `{want}`")
            else:
                problems.append(f"emoji `{emoji}` is not the one for `{typ}`: use `{want}`")
    if scope is None:
        problems.append("scope is required: `<type>(<scope>)`, named after the area the change touches")
    elif not scope.strip():
        problems.append("scope is empty: name the area the change touches")
    elif scope != scope.lower():
        problems.append(f"scope `{scope}` must be lowercase")
    elif " " in scope:
        problems.append(f"scope `{scope}` must not contain spaces; use `-`")
    if not desc.strip():
        problems.append("description after the colon is empty")
    else:
        if desc.rstrip().endswith("."):
            problems.append("description must not end with a period")
        if desc[0].isupper() and not re.match(r"^[A-Z][A-Z0-9]", desc) and desc.split()[0] not in ("Pi", "SKILL.md", "AGENTS.md"):
            problems.append(f"description starts with a capital (`{desc.split()[0]}`); start lowercase unless it is a proper noun or code")
        if NON_IMPERATIVE.match(desc):
            problems.append(f"description opens with `{desc.split()[0]}`; use the imperative (`add`, `fix`, `update`, ...)")
    if len(subject) > SUBJECT_MAX:
        problems.append(f"subject is {len(subject)} characters; cut it to {SUBJECT_MAX}")

    if len(lines) > 1 and lines[1].strip():
        problems.append("second line must be blank to separate subject from body")

    body = lines[1:]
    refs = [ln for ln in body if ln.startswith("Refs")]
    breaking = [ln for ln in body if ln.startswith("BREAKING CHANGE")]
    for ln in body:
        if any(ln.startswith(t) for t in FORBIDDEN_TRAILERS):
            problems.append(f"remove the `{ln.split(':')[0]}:` trailer; this repo never uses it")
        if len(ln) > BODY_MAX and not ln.startswith(("Refs", "BREAKING CHANGE", "http")):
            problems.append(f"body line exceeds {BODY_MAX} characters: `{ln[:40]}...`")
    for ln in refs:
        if not REFS_RE.match(ln):
            problems.append(f"footer `{ln}` must read exactly `Refs #N`")
    if len(refs) > 1:
        problems.append("only one `Refs #N` footer")
    if refs and body and body[-1] != refs[-1] and not (breaking and body[-1] == breaking[-1]):
        problems.append("`Refs #N` must be the last line")
    if refs:
        idx = body.index(refs[0])
        if idx > 0 and body[idx - 1].strip() and not body[idx - 1].startswith("BREAKING CHANGE"):
            problems.append("blank line required before `Refs #N`")
    if bang and not breaking:
        problems.append("`!` marks a breaking change: add a `BREAKING CHANGE: <what breaks>` footer line")
    if breaking and not bang:
        problems.append("`BREAKING CHANGE:` footer present: add `!` after the scope, e.g. `feat(scope)!:`")
    if squash and (refs or len(body) > 0):
        problems.append("--squash: a PR / squash title is the subject line only")
    return problems


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    squash = "--squash" in argv
    if "--help" in argv or "-h" in argv or len(args) != 1:
        print(__doc__)
        return 2
    text = sys.stdin.read() if args[0] == "-" else Path(args[0]).read_text(encoding="utf-8")
    problems = check(text, squash=squash)
    if problems:
        for p in problems:
            print(f"\u2717 {p}")
        return 1
    print("\u2713 message is clean")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
