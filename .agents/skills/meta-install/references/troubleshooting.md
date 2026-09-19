# Setup troubleshooting

Read this when a phase of `meta-install` fails. Each entry names the phase, the
symptom as the user sees it, and the one thing to change. Nothing here authorizes
touching `.env` or `.envrc`.

## Phase 1 — environment files

| Symptom | Cause | Action |
| --- | --- | --- |
| `.env` missing | user configuration not created | stop before all installs; give the user the safe copy command and detector output from Phase 1 |
| `.env` exists but `.envrc` is missing | fresh clone has no direnv loader | preserve `.env`; give the user Phase 1's non-overwriting `.envrc` creation command and stop |
| either path is a directory or dangling symlink | configuration path is unusable | stop for the user to repair it; never replace it |
| detector printed no CUDA candidate | no CUDA runtime on the machine | CPU is a valid answer (`QMD_LLAMA_GPU=false`), or the user installs `cuda-runtime cuda-libraries` |
| bash starts warning `libtinfo.so.6: no version information available` | `LD_LIBRARY_PATH` points at a conda env's plain `lib` | repoint it at `targets/<arch>/lib`, which holds CUDA libraries only |

The detector prefers `targets/<arch>/lib` for exactly that reason: a conda env's
`lib` also ships `libstdc++`, `libtinfo`, and `libssl`, which then shadow the
system copies for every process direnv touches.

## Phase 2 — toolchain and activation

| Symptom | Cause | Action |
| --- | --- | --- |
| `command -v` still MISSING right after the installer succeeded | new `PATH` entry not in this shell | tell the user to reopen the shell; do not re-run the installer |
| `bun install -g @tobilu/qmd` fails with `bun: not found` | qmd install ran before bun | install bun first, then retry |
| `direnv` is missing during Phase 1 | toolchain not installed yet | user creates the files first; install direnv in Phase 2, then user enables the shell hook and runs `direnv allow` |
| `.env` exists but qmd ignores its variables | loader absent, direnv not approved/hooked, or Pi inherited an old environment | user verifies the loader privately, enables the hook, approves `.envrc`, and restarts Pi from the activated shell; never print secrets |

## Phase 3 — dependencies

| Symptom | Cause | Action |
| --- | --- | --- |
| `uv sync` cannot find a Python | no interpreter uv can use | `uv python install`, then `uv sync` |

## Phase 5 — qmd, models, index

| Symptom | Cause | Action |
| --- | --- | --- |
| download stalls or dies partway | network | re-run `bash .agents/skills/meta-install/scripts/qmd-setup.sh`; `qmd pull` resumes and skips complete files |
| `qmd doctor`: `model cache: missing 1/3` | an interrupted download left a partial file | re-run the script, or `qmd pull --progress` directly |
| `qmd doctor`: `⚠ device probe: running on CPU (N math cores)` on a GPU machine | CUDA libraries not on the loader path | re-run the detector; `QMD_LLAMA_GPU=cuda` selects the backend but does not tell the linker where CUDA is |
| the script recorded unexpected models although `.env` names others | variables never reached the script | user fixes activation as in Phase 2, restarts Pi, then re-runs the script — the rewrite of `.qmd/index.yml` applies a model edit |
| `dimension mismatch` during embed | embedding model changed | the script already retries with `qmd embed -f`; let it finish, it re-embeds the vault |
| a collection points at a path that is gone | checkout moved | the script drops stale collections on every run; re-run it |
| `qmd status` shows 0 files for `wiki` or `raw` | collections added before the vault existed, or a mask mismatch | re-run the script; if still zero, check `llm-wiki/wiki` and `llm-wiki/raw` exist and contain `.md` |
| `Orphaned: N embedding chunks` | deleted documents left vectors behind | `qmd cleanup` — cosmetic, not a setup failure |

qmd walks up from the working directory to find `.qmd/`, so every command run
anywhere inside the repo uses this index; it is scoped by directory, not by git
branch.

## Phase 4/6 — harness and verification

| Symptom | Cause | Action |
| --- | --- | --- |
| `/skill:*` commands absent, `.pi/agents/` agents unavailable | project not trusted | user reviews repo/package sources, runs `/trust`, then restarts; `-a` is a user-approved one-run alternative |
| declared Pi packages are missing | startup installation failed or project is untrusted | inspect `.pi/settings.json` and `pi list` after trust; report the install failure and retry trusted startup once resolved, not a hardcoded global install list |
| an edited extension or skill has no effect | session cached it | `/reload` |
| `state.py status` reports missing ledgers | `uv sync` never ran | `uv sync`, then retry |
| retrieval returns nothing although `qmd status` looks healthy | embeddings never generated | `qmd embed`, or re-run the setup script |
| `bun run architecture:check` fails right after setup | generated tree is stale for unrelated reasons | not a setup failure; report it and leave it to the owning change |

## Escalate instead of improvising

Stop and report, rather than working around, when:

- Both `.env` and `.env.sample` are absent (the hard stop in Phase 1).
- A fix would mean editing `.env`, `.envrc`, or `llm-wiki/governance.json`.
- A fix would mean pinning `typescript` back or adding a TypeScript ESLint
  plugin.
- A fix would mean `qmd embed -f` on a large vault that the user did not ask to
  re-embed.

Index lifecycle and model changes after setup belong to
`docs/llm-wiki/qmd-index.md`, not to this skill.
