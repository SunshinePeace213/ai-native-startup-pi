#!/usr/bin/env python3
"""Build a throwaway llm-wiki vault holding one disputed claim, for a review eval.

Usage: uv run --no-project build_fixture.py [dest]   # prints the vault root

The live review queue is usually empty, so `llm-wiki-review` has nothing to
present and its question round cannot be observed. This seeds a vault the same
way the test suite does — through the CLI seam, never by hand-writing ledgers —
so the flags the skill reads are the ones the engine really produces.

Point the skill at it with LLM_WIKI_ROOT=<printed root>; `state.py` resolves
--root, then $LLM_WIKI_ROOT, then cwd, so no live ledger is touched.
"""

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SCRIPTS = REPO / "scripts" / "llm-wiki"
FIXTURES = REPO / "tests" / "scripts" / "llm-wiki" / "fixtures"
ARCHIVE = "llm-wiki/raw/notes/probe.md"
KEY = "engine.ledgers.append-only"
# Spans must appear verbatim in ARCHIVE; the engine refuses an apply otherwise.
SPAN_SUPPORT = "The engine appends rows and never rewrites one."
SPAN_CONTRA = "A view is rebuilt from the ledgers byte for byte."
ACTOR = "agent:fixture"


def run(root: Path, *args: str, actor: str = ACTOR) -> str:
    cmd = ["uv", "run", "--quiet", str(SCRIPTS / "state.py"), "--root", str(root)]
    if actor:
        cmd += ["--actor", actor]
    r = subprocess.run([*cmd, *args], cwd=root, capture_output=True, text=True, check=False)
    if r.returncode != 0:
        sys.exit(f"fixture build failed: state.py {' '.join(args)} -> {r.returncode}\n{r.stderr}")
    return r.stdout


def observation(source_id: str, stance: str, text: str, span: str) -> dict:
    return {
        "source_id": source_id,
        "claim_key": KEY,
        "claim_text": text,
        "evidence_span": span,
        "stance": stance,
        "confidence": 0.9,
        "conditions": [],
        "entities": [{"name": "Engine", "type": "system"}, {"name": "Transport", "type": "concept"}],
        "relationships": [{"subject": "Engine", "predicate": "uses", "object": "Transport"}],
        "privacy": "public",
        "extractor": {"model": "agent:fixture", "prompt_version": "extract-v2"},
    }


def build(dest: Path) -> Path:
    layer = dest / "llm-wiki"
    (layer / "states" / "inbox").mkdir(parents=True, exist_ok=True)
    (layer / "wiki").mkdir(exist_ok=True)
    (layer / "retrieval").mkdir(exist_ok=True)
    shutil.copytree(REPO / "llm-wiki" / "schemas", layer / "schemas", dirs_exist_ok=True)
    shutil.copy(REPO / "llm-wiki" / "retrieval" / "fusion_config.json", layer / "retrieval")
    shutil.copytree(FIXTURES / "raw", layer / "raw", dirs_exist_ok=True)
    governance = json.loads((REPO / "llm-wiki" / "governance.json").read_text())
    governance["lock_timeout_s"] = 5
    (layer / "governance.json").write_text(json.dumps(governance, indent=2))

    source_id = run(dest, "register", ARCHIVE).splitlines()[0].strip()

    def apply(rows: list[dict]) -> str:
        path = dest / "obs.jsonl"
        path.write_text("".join(json.dumps(r) + "\n" for r in rows))
        return run(dest, "apply", str(path))

    apply([observation(source_id, "new_claim",
                       "The engine appends rows to a ledger and never rewrites one.",
                       SPAN_SUPPORT)])
    apply([observation(source_id, "contradicts",
                       "The engine rewrites ledger rows in place when a view is rebuilt.",
                       SPAN_CONTRA)])
    return dest


def main() -> None:
    dest = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(tempfile.mkdtemp(prefix="wiki-review-eval-"))
    dest.mkdir(parents=True, exist_ok=True)
    build(dest)
    queue = run(dest, "review", "--json", actor="")
    items = json.loads(queue)
    counts = items.get("counts", items) if isinstance(items, dict) else {"items": len(items)}
    print(dest)
    print(f"review queue: {json.dumps(counts)}", file=sys.stderr)


if __name__ == "__main__":
    main()
