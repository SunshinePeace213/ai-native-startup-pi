---
name: meta-install
description: >-
  Bootstraps a checkout of this repository in order — toolchain, environment
  file, dependencies, project trust, the qmd search index — and reports what is
  still missing. Use when somebody is new to this repo or a clone is not working
  yet: set this up, get me started, onboard me, I just cloned this, what do I
  install, nothing runs, `qmd`/`uv` not found, which QMD_LLAMA_GPU value do I
  need, where is my CUDA library path, my GPU is not being used. Fire for
  whatever a checkout is simply missing rather than getting wrong — no .env, no
  .qmd, empty wiki search, absent node_modules/.venv/@types/bun, `Cannot find
  name 'Bun'`, `Cannot find module 'bun:test'`, project skills and slash
  commands not loading — and when the request only asks to make the repo usable
  or to finish a half-done install. Not for verifying a code change
  (docs/testing.md), authoring skills (skill-creator), or an index that already
  works — swapping QMD_EMBED_MODEL, re-embedding, or refreshing after edits
  belong to docs/llm-wiki/qmd-index.md.
---

# Meta Install

Bring a checkout from "just cloned" to "usable" in a fixed order, and stop at
the two gates the agent is not allowed to pass on its own: the environment file
and project trust.

Installs, model downloads, and index builds have side effects. Never run any of
this incidentally during a read-only review, and never replace configuration
that a returning checkout already has.

**Absolute rule:** the agent never reads, writes, copies, or edits `.env` or
`.envrc`. Testing whether `.env` exists is allowed; opening it is not. Every
value the user needs is *reported* to them, and they paste it themselves.

## Bundled files

Both scripts ship with this skill and are run from the repository root:

| Path from the repo root | Use |
| --- | --- |
| `.agents/skills/meta-install/scripts/detect-gpu.sh` | Phase 2 — prints the `QMD_LLAMA_GPU` and `LD_LIBRARY_PATH` lines for this machine. Read-only. |
| `.agents/skills/meta-install/scripts/qmd-setup.sh` | Phase 5 — builds the search index; `--check` is the Phase 6 health check. |
| `references/typescript.md` | Typecheck or lint failure that looks like a toolchain problem. |
| `references/troubleshooting.md` | A phase failed, or setup finished but search is empty. |

## Phase 0 — Survey before touching anything

Run this first and report the result. It decides which phases are still needed
and it writes nothing:

```bash
cd "$(git rev-parse --show-toplevel)"
for bin in uv bun qmd direnv pi git rg; do printf '%-8s %s\n' "$bin" "$(command -v $bin || echo MISSING)"; done
printf '%-8s %s\n' "fd" "$(command -v fd || command -v fdfind || ls ~/.pi/agent/bin/fd 2>/dev/null || echo MISSING)"
printf '%-8s %s\n' ".env" "$([ -e .env ] || [ -L .env ] && echo present || echo MISSING)"
printf '%-8s %s\n' "sample" "$([ -f .env.sample ] && echo present || echo MISSING)"
printf '%-8s %s\n' "deps" "$([ -d node_modules ] && echo node_modules || echo no-node_modules) $([ -d .venv ] && echo .venv || echo no-.venv)"
printf '%-8s %s\n' "types" "$([ -d node_modules/@types/bun ] && echo '@types/bun ok' || echo '@types/bun MISSING')"
printf '%-8s %s\n' "index" "$([ -d .qmd ] && echo .qmd || echo no-.qmd)"
```

A missing `.qmd/` is the normal state of a fresh clone, not an error.

## Phase 1 — Toolchain

Install only what Phase 0 printed as `MISSING`:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # uv  — Python runner
curl -fsSL https://bun.sh/install | bash          # bun — JS/TS runner
bun install -g @tobilu/qmd                        # qmd — needs bun first
```

`direnv` comes from the OS package manager (`sudo apt install direnv`,
`brew install direnv`). `rg` and `fd` are the search binaries behind the
`grep` and `find` tools (`.pi/extensions/fast-search`); without them those
tools fail with an install hint instead of searching:

```bash
sudo apt install ripgrep fd-find   # Debian/Ubuntu — fd is installed as `fdfind`, which is found
brew install ripgrep fd            # macOS
```

`pi` is the coding agent this repo is built for; install
it per <https://pi.dev>, then the three packages the harness expects, globally:

```bash
pi install npm:pi-subagents                       # subagent tool (.pi/agents/)
pi install npm:pi-web-access                      # web_search + fetch_content
pi install npm:@juicesharp/rpiv-ask-user-question # ask_user_question for llm-wiki-review
```

`uv` and `bun` land in `~/.local/bin` and `~/.bun/bin`. If a freshly installed
binary is still not on `PATH`, the shell must be reopened — say so rather than
looping on `command -v`.

## Phase 2 — Environment file (GATE: the user does this)

Branch on what Phase 0 found.

**`.env` present** — nothing to do. Do not inspect it, do not diff it against
the sample, do not "merge newly needed keys". Move to Phase 3.

**`.env` missing and `.env.sample` missing** — hard stop. Report exactly this
and do not continue to any later phase:

```text
✗ Cannot configure this checkout: neither .env nor .env.sample exists.
  .env.sample is the committed catalog of every variable this repo reads, and I
  am not allowed to invent it. Please create .env by hand with at least:
    QMD_LLAMA_GPU=      LD_LIBRARY_PATH=      LLM_WIKI_ACTOR=      LLM_WIKI_QMD=
    QMD_EMBED_MODEL=    QMD_RERANK_MODEL=     QMD_GENERATE_MODEL=
  Then run `direnv allow` and ask me to continue.
```

**`.env` missing, `.env.sample` present** — do not copy it yourself. Run the
detector, then hand the user one block containing the copy command and the two
machine-specific values it printed:

```bash
bash .agents/skills/meta-install/scripts/detect-gpu.sh
```

It prints `QMD_LLAMA_GPU=` for this machine (`cuda` on NVIDIA, `metal` on macOS,
`vulkan` on AMD/Intel, `false` for CPU) and, on Linux + NVIDIA only, the
`LD_LIBRARY_PATH=` line for a CUDA `targets/<arch>/lib` directory that actually
contains `libcudart`. Report its output verbatim — it is the user's paste
material — wrapped as:

```text
Run these yourself (I do not touch .env):
  cp .env.sample .env
  # then set in .env:
  QMD_LLAMA_GPU=<from the detector>
  LD_LIBRARY_PATH=<from the detector, CUDA only — leave empty otherwise>
  direnv allow
```

Only the two variables above ever need a decision. The `QMD_*_MODEL` variables
are optional: left as the sample ships them the index uses those models, and
commenting them out lets qmd fall back to its own smaller defaults. Everything
else in the sample can stay untouched.

Wait for the user to confirm before Phase 5 — `qmd-setup.sh` reads those
variables from the environment direnv exports.

## Phase 3 — Dependencies

```bash
bun install
uv sync
```

Then confirm Bun's own types are installed, because this is the step that gets
skipped:

```bash
ls -d node_modules/@types/bun || bun add -d @types/bun
```

Typechecking fails with `Cannot find name 'Bun'`, `Cannot find module
'bun:test'`, or an unresolved `Request` when `@types/bun` is absent — the
package is required, not optional. Verify the two halves:

```bash
bun run typecheck   # tsc --noEmit over .ts/.tsx
bun run lint        # eslint over .js/.jsx/.mjs/.cjs
bun test            # tests/ — extension hooks against a fake Pi
```

`.ts`/`.tsx` sit outside the ESLint globs on purpose; `tsc` is what checks them.
If a plugin or a version pin looks wrong, read
`references/typescript.md` before changing anything in `package.json` or
`tsconfig.json`.

## Phase 4 — Trust the project (GATE: the user does this)

Project skills (`.agents/skills/`), agents (`.pi/agents/`), settings, and
extensions load only after Pi trusts the folder, so the user should review the
repo before trusting it. Report the instruction; do not try to write the trust
decision:

```text
In this repo: open `pi`, run `/trust`, then restart Pi for it to take effect.
```

Non-interactive runs approve for a single run with `-a`:

```bash
pi -a -p "/skill:llm-wiki-query what does the wiki know about pi skills"
```

`/reload` picks up edited skills and extensions in an already-trusted session.
The architecture extension starts check-only; `/architecture-sync auto` enables
automatic tree updates for one editing session
([docs/architecture-sync.md](../../../docs/architecture-sync.md)).

## Phase 5 — Search index

```bash
bash .agents/skills/meta-install/scripts/qmd-setup.sh
```

One idempotent script, six announced phases — quote the phase name when
reporting a failure:

| Phase | What it does |
| --- | --- |
| `[1/6] preflight` | qmd on `PATH`, vault present, echoes the resolved GPU/CUDA variables |
| `[2/6] index config and models` | `qmd init`, then records the `QMD_*_MODEL` values into `.qmd/index.yml` |
| `[3/6] model downloads` | lists each model as cached or missing, then `qmd pull --progress` downloads only the missing ones with live percent, transfer rate, and time remaining |
| `[4/6] collections` | drops stale collections, re-adds `wiki` and `raw`, attaches their context blurbs |
| `[5/6] index and embeddings` | `qmd update`, then `qmd embed` (auto-recovers a dimension mismatch with a full re-embed) |
| `[6/6] health check` | model cache, `qmd status` file counts, `qmd doctor` |

The first run on a machine with no prior qmd index downloads several GB and
embeds the whole vault. It is slow; do not interrupt it and do not run it twice
in parallel. An interrupted download resumes on re-run.

## Phase 6 — Health check

The cheap gate, and the one to end on. It only asks whether the pieces exist:

```bash
bash .agents/skills/meta-install/scripts/qmd-setup.sh --check   # models · collections · doctor
```

Plus the tools themselves:

```bash
uv run python -c "import sys; print(sys.version)"
bun --version && qmd --version
rg --version | head -1; (fd --version || fdfind --version) 2>/dev/null   # grep/find backends
uv run scripts/llm-wiki/state.py status   # ledgers load and report counts
```

Inside Pi, `/fast-search` reports which `rg` and `fd` the `grep` and `find`
tools resolved, with install hints for any gap.

Do **not** run the expensive suites as part of setup. `bun run check`,
`uv run pytest`, and `bun run eval:retrieval` belong to a code change, not to an
install; name them as available and let the user choose
([docs/testing.md](../../../docs/testing.md)).

## Report back like this

```text
Setup status for <repo path>
  ✓ toolchain     uv 0.9.x · bun 1.4.x · qmd 2.8.3 · direnv · pi · rg 15.x · fd 10.x
  ⚠ .env          missing — you must run: cp .env.sample .env
                  QMD_LLAMA_GPU=cuda
                  LD_LIBRARY_PATH=/home/you/miniconda3/envs/llm/targets/x86_64-linux/lib
                  then: direnv allow
  ✓ dependencies  bun install · uv sync · @types/bun present
  ⚠ trust         you must run /trust in pi and restart
  ✓ qmd index     wiki 193 files · raw 106 files · 3 models cached · doctor clean
  Blocked on: .env, /trust.  Next: <the single next command>
```

State every gate the user still owns, and give one next command — never a list
of five things to do in an unspecified order.

## Gotchas

- **`.env` and `.envrc` are off limits.** Existence checks only. The user copies
  the sample, sets the values, and runs `direnv allow`; an agent that edits
  `.env` silently clobbers local values.
- **`@types/bun` is the step agents forget.** `"types": ["bun"]` in
  `tsconfig.json` is load-bearing and TypeScript no longer auto-includes
  `@types/*`, so a missing package breaks `Bun`, `bun:test`, and `Request` at
  once. Install it, do not edit `tsconfig.json`.
- **Never pin or announce a TypeScript version from memory.** The repo tracks
  the latest stable TypeScript 7 (the Go-native compiler) as its only
  `typescript`; read `package.json` if the exact version matters.
- **`direnv allow` is required after every `.env` edit**, and again after
  `.envrc` changes. Without it the setup script sees no `QMD_*` values and
  quietly records qmd's defaults.
- **qmd distrusts a project-local config unattended.** Custom `hf:` models in
  `.qmd/index.yml` are a gated field: with no terminal to ask, qmd skips them
  and uses its defaults. `qmd-setup.sh` sets `QMD_TRUST_LOCAL_CONFIG=1` for its
  own download step; a bare `qmd pull` in a non-interactive shell does not.
- **Changing `QMD_EMBED_MODEL` invalidates every stored vector.** A vector's
  dimension is fixed by the model that produced it, so a switch means re-embedding
  the whole vault. Re-running the setup script is what applies a model edit.
- **A freshly installed binary may not be on `PATH` yet.** Say "reopen your
  shell" instead of re-running the installer.
- **`fd` is `fdfind` on Debian/Ubuntu.** The fast-search extension resolves
  that name, and Pi's own download under `~/.pi/agent/bin/` too; the survey
  line accepts all three. Do not symlink or alias just to satisfy
  `command -v fd`.
- **Project skills are silently absent until the project is trusted** — and
  non-interactive runs never prompt. Missing `/skill:*` commands mean trust, not
  a broken skill.

Read `references/typescript.md` when a typecheck or lint failure looks like a
toolchain or dependency problem rather than a code error.
Read `references/troubleshooting.md` when a phase fails, when `qmd doctor`
reports CPU on a GPU machine, or when search returns nothing after setup.
