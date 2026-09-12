"""A scratch vault per test, driven through the engine's public seam — the CLI.

Every test lands rows exactly as a skill or the extension would: `uv run state.py --root
<vault> <verb>`. Nothing imports the engine, so a refactor of its internals cannot break a
test that the contract does not break too. The contract is docs/llm-wiki/state.md.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[3]
SCRIPTS = REPO / "scripts" / "llm-wiki"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
ARCHIVE = "llm-wiki/raw/notes/probe.md"
LEDGERS = (
    "sources.jsonl",
    "transitions.jsonl",
    "merges.jsonl",
    "audit_log.jsonl",
    "retractions.jsonl",
)
VIEWS = (
    "claims.jsonl",
    "entities.jsonl",
    "relationships.jsonl",
    "unresolved_conflicts.jsonl",
    "snapshot.json",
)

HUMAN = "human:test"
AGENT = "agent:test"
ROUTINE = "routine:test"  # may register, decay, rebuild, render — never apply


def observation(source_id: str, key: str, text: str, span: str, **extra: object) -> dict:
    """One extract-v2 row on the Engine entity; `extra` overrides any field."""
    row = {
        "source_id": source_id,
        "claim_key": key,
        "claim_text": text,
        "evidence_span": span,
        "stance": "new_claim",
        "confidence": 0.9,
        "conditions": [],
        "entities": [
            {"name": "Engine", "type": "system", "aliases": ["state engine"]},
            {"name": "Renderer", "type": "system"},
        ],
        "relationships": [{"subject": "Engine", "predicate": "uses", "object": "Renderer"}],
        "privacy": "public",
        "extractor": {"model": "human:test", "prompt_version": "manual"},
    }
    row.update(extra)
    return row


def two_observations(source_id: str) -> list[dict]:
    return [
        observation(
            source_id,
            "engine.ledgers.append-only",
            "The engine appends rows and never rewrites one.",
            "The engine appends rows and never rewrites one.",
        ),
        observation(
            source_id,
            "engine.views.rebuilt-from-ledgers",
            "A view is rebuilt from the ledgers byte for byte.",
            "A view is rebuilt from the ledgers byte for byte.",
        ),
    ]


@dataclass
class Vault:
    root: Path
    states: Path = field(init=False)

    def __post_init__(self) -> None:
        self.states = self.root / "llm-wiki" / "states"

    # -- the seam -------------------------------------------------------------------------

    def run(
        self, script: str, *args: str, actor: str | None = HUMAN, check: bool = True
    ) -> subprocess.CompletedProcess[str]:
        cmd = ["uv", "run", "--quiet", str(SCRIPTS / f"{script}.py"), "--root", str(self.root)]
        if actor:
            cmd += ["--actor", actor]
        result = subprocess.run(
            [*cmd, *args], cwd=self.root, capture_output=True, text=True, check=False
        )
        if check and result.returncode != 0:
            raise AssertionError(
                f"{script} {' '.join(args)} exited {result.returncode}\n{result.stderr}"
            )
        return result

    def state(self, *args: str, **kw: object) -> subprocess.CompletedProcess[str]:
        return self.run("state", *args, **kw)  # type: ignore[arg-type]

    def json(self, *args: str) -> dict:
        return json.loads(self.state(*args, "--json", actor=None).stdout)

    # -- verbs the tests lean on ----------------------------------------------------------

    def register(self, actor: str = HUMAN) -> tuple[str, str]:
        """(source_id, run_id) of registering the fixture archive."""
        out = self.state("register", ARCHIVE, actor=actor).stdout.splitlines()
        return out[0].strip(), out[-1].split()[-1]

    def apply(
        self, rows: list[dict], actor: str = HUMAN, check: bool = True
    ) -> subprocess.CompletedProcess[str]:
        path = self.root / "obs.jsonl"
        path.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
        return self.apply_file(path, actor=actor, check=check)

    def apply_file(
        self, path: Path, actor: str = HUMAN, check: bool = True
    ) -> subprocess.CompletedProcess[str]:
        return self.state("apply", str(path), actor=actor, check=check)

    def seed(self) -> tuple[str, str, str]:
        """register + apply two observations → (source_id, register_run, apply_run)."""
        source_id, register_run = self.register()
        apply_run = last_run(self.apply(two_observations(source_id)))
        return source_id, register_run, apply_run

    # -- what the contract observes -------------------------------------------------------

    def ledgers(self) -> dict[str, bytes]:
        found = {
            name: (self.states / name).read_bytes()
            for name in LEDGERS
            if (self.states / name).exists()
        }
        obs = self.states / "observations"
        if obs.is_dir():
            for path in sorted(obs.glob("*.jsonl")):
                found[f"observations/{path.name}"] = path.read_bytes()
        return found

    def views(self) -> dict[str, bytes]:
        return {
            name: (self.states / name).read_bytes()
            for name in VIEWS
            if (self.states / name).exists()
        }

    def belief_views(self) -> dict[str, bytes]:
        """The four replayed views; the snapshot also counts runs, which a reversal moves."""
        return {k: v for k, v in self.views().items() if k != "snapshot.json"}

    def snapshot(self) -> dict:
        return json.loads((self.states / "snapshot.json").read_text(encoding="utf-8"))

    def views_digest(self) -> str:
        h = hashlib.sha256()
        for name, data in sorted(self.views().items()):
            h.update(name.encode())
            h.update(data)
        return h.hexdigest()

    def audit_rows(self) -> list[dict]:
        path = self.states / "audit_log.jsonl"
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]

    def counts(self) -> dict:
        return self.json("status")["counts"]

    def rows(self) -> list[tuple[str, dict]]:
        """Every (ledger, row) currently in the ledgers, run_id-bearing or not."""
        out: list[tuple[str, dict]] = []
        for name, data in self.ledgers().items():
            for line in data.decode("utf-8").splitlines():
                if line.strip():
                    out.append((name, json.loads(line)))
        return out


def last_run(result: subprocess.CompletedProcess[str]) -> str:
    """The `run: run_…` line every write verb prints last."""
    for line in reversed(result.stdout.splitlines()):
        if line.startswith("run: "):
            return line.split()[-1]
    raise AssertionError(f"no run line in:\n{result.stdout}")


def assert_prefix_intact(before: dict[str, bytes], after: dict[str, bytes]) -> None:
    """Append-only: every byte a ledger held before is still there, at the same offset."""
    for name, old in before.items():
        assert name in after, f"{name} vanished"
        assert after[name][: len(old)] == old, f"{name} was rewritten, not appended"


@pytest.fixture
def vault(tmp_path: Path) -> Vault:
    """A fresh vault: the repo's real governance and schemas, a one-second lock, one archive."""
    root = tmp_path / "project"
    layer = root / "llm-wiki"
    (layer / "states" / "inbox").mkdir(parents=True)
    (layer / "wiki").mkdir()
    (layer / "retrieval").mkdir()
    shutil.copytree(REPO / "llm-wiki" / "schemas", layer / "schemas")
    shutil.copy(REPO / "llm-wiki" / "retrieval" / "fusion_config.json", layer / "retrieval")
    shutil.copytree(FIXTURES / "raw", layer / "raw")
    governance = json.loads((REPO / "llm-wiki" / "governance.json").read_text(encoding="utf-8"))
    governance["lock_timeout_s"] = 1
    (layer / "governance.json").write_text(json.dumps(governance, indent=2), encoding="utf-8")
    return Vault(root)


@pytest.fixture
def seeded(vault: Vault) -> tuple[Vault, str, str, str]:
    source_id, register_run, apply_run = vault.seed()
    return vault, source_id, register_run, apply_run


def python() -> str:
    return sys.executable
