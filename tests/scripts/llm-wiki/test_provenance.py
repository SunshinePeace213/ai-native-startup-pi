"""Rendering — docs/llm-wiki/state.md § Rendering contract; governance family `provenance`.

L8a an entity with MIN_CLAIMS_PER_PAGE active claims gets a page under its shelf whose
    sources: frontmatter resolves to the registered archive, and `render.py check` is clean
L8b an entity below the threshold gets no page
L8c a page edited by hand, or a claim the page no longer reflects, fails `render.py check`
    (exit 1); `render` refreshes it and the check is clean again
L8d `render` is a write run: it audits like every other verb, and a role without `render`
    is refused
"""

from __future__ import annotations

import json

from conftest import HUMAN, Vault, observation, two_observations


def pages(vault: Vault) -> list[str]:
    wiki = vault.root / "llm-wiki" / "wiki"
    return sorted(
        str(p.relative_to(vault.root)) for p in wiki.rglob("*.md") if p.name != "index.md"
    )


def test_L8a_a_two_claim_entity_renders_a_page_that_cites_its_archive(vault: Vault) -> None:
    vault.seed()
    vault.run("render", "render")
    found = pages(vault)
    assert "llm-wiki/wiki/systems/engine.md" in found
    page = (vault.root / "llm-wiki/wiki/systems/engine.md").read_text(encoding="utf-8")
    assert "llm-wiki/raw/notes/probe.md" in page
    assert vault.run("render", "check", actor=None).returncode == 0


def test_L8b_a_one_claim_entity_renders_nothing(vault: Vault) -> None:
    source_id, _ = vault.register()
    vault.apply(two_observations(source_id)[:1])
    vault.run("render", "render")
    assert pages(vault) == []


def test_L8c_drift_between_state_and_page_is_caught_and_refreshed(vault: Vault) -> None:
    source_id, _ = vault.register()
    vault.apply(two_observations(source_id))
    vault.run("render", "render")
    page = vault.root / "llm-wiki/wiki/systems/engine.md"
    rendered = page.read_bytes()

    vault.apply(
        [
            observation(
                source_id,
                "engine.ledgers.append-only",
                "The engine appends rows and never rewrites one — ever.",
                "never rewrites one",
                stance="supports",
            )
        ]
    )
    assert vault.run("render", "check", actor=None, check=False).returncode == 1
    vault.run("render", "render")
    assert page.read_bytes() != rendered
    assert vault.run("render", "check", actor=None).returncode == 0


def test_L8d_render_is_an_audited_run_and_a_role_without_it_is_refused(vault: Vault) -> None:
    vault.seed()
    n = len(vault.audit_rows())
    vault.run("render", "render")
    audit = vault.audit_rows()
    assert len(audit) == n + 1 and audit[-1]["verb"] == "render"

    # The fixture governance grants render to every role; take it from `human` to probe.
    governance = vault.root / "llm-wiki" / "governance.json"
    policy = json.loads(governance.read_text(encoding="utf-8"))
    policy["roles"]["human"]["verbs"] = ["register", "apply"]
    governance.write_text(json.dumps(policy), encoding="utf-8")
    refused = vault.run("render", "render", actor=HUMAN, check=False)
    assert refused.returncode == 3
    assert vault.audit_rows()[-1]["outcome"] == "denied"
