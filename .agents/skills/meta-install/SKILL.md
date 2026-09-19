---
name: meta-install
description: >-
  Bootstraps a checkout of this repository in order — environment files,
  toolchain, dependencies, project trust, the qmd search index — and reports what is
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
the two gates the agent is not allowed to pass on its own: environment setup
and project trust. Missing environment files block all installation phases.

Installs, model downloads, and index builds have side effects. Never run any of
this incidentally during a read-only review, and never replace configuration
that a returning checkout already has.

**Absolute rule:** the agent never reads, writes, copies, or edits `.env` or
`.envrc`. Existence/type checks are allowed; opening either file is not. Every
value and creation command the user needs is *reported* to them, and they run
it themselves. Never source either file or dump the environment to inspect it.

## Bundled files

Both scripts ship with this skill and are run from the repository root:

| Path from the repo root | Use |
| --- | --- |
| `.agents/skills/meta-install/scripts/detect-gpu.sh` | Phase 1 — prints the `QMD_LLAMA_GPU` and `LD_LIBRARY_PATH` lines for this machine. Read-only. |
| `.agents/skills/meta-install/scripts/qmd-setup.sh` | Phase 5 — builds the search index; `--check` is the Phase 6 health check. |
| `references/typescript.md` | Typecheck or lint failure that looks like a toolchain problem. |
| `references/troubleshooting.md` | A phase failed, or setup finished but search is empty. |

## Phase 0 — Survey before touching anything

Run this first and report the result. It decides which phases are still needed
and it writes nothing:

```bash
cd "$(git rev-parse --show-toplevel)"
printf '%-8s %s\n' ".env" "$([ -e .env ] || [ -L .env ] && echo present || echo MISSING)"
printf '%-8s %s\n' ".envrc" "$([ -e .envrc ] || [ -L .envrc ] && echo present || echo MISSING)"
printf '%-8s %s\n' "sample" "$([ -f .env.sample ] && echo present || echo MISSING)"
for bin in uv bun qmd direnv pi git rg; do printf '%-8s %s\n' "$bin" "$(command -v $bin || echo MISSING)"; done
printf '%-8s %s\n' "fd" "$(command -v fd || command -v fdfind || ls ~/.pi/agent/bin/fd 2>/dev/null || echo MISSING)"
printf '%-8s %s\n' "deps" "$([ -d node_modules ] && echo node_modules || echo no-node_modules) $([ -d .venv ] && echo .venv || echo no-.venv)"
printf '%-8s %s\n' "types" "$([ -d node_modules/@types/bun ] && echo '@types/bun ok' || echo '@types/bun MISSING')"
printf '%-8s %s\n' "index" "$([ -d .qmd ] && echo .qmd || echo no-.qmd)"
```

A missing `.qmd/` is the normal state of a fresh clone, not an error.

## Phase 1 — Environment files (GATE: the user does this)

Branch on what Phase 0 found **before installing anything**, even if `uv`,
`bun`, or `direnv` is missing. The detector needs only bash and OS probes.

**`.env` present** — preserve it. Do not inspect it, diff it against the
sample, or "merge newly needed keys". Still check whether `.envrc` exists.
A missing sample does not block an already-configured checkout.

**`.env` missing and `.env.sample` missing** — hard stop. Explain that the
committed variable catalog is absent and cannot be invented. Ask the user to
restore `.env.sample` from the repository or create `.env` by hand with:
`QMD_LLAMA_GPU`, `LD_LIBRARY_PATH`, `LLM_WIKI_ACTOR`, `LLM_WIKI_QMD`,
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, and `QMD_GENERATE_MODEL`. Do not install
anything or attempt any later phase.

**`.env` missing, `.env.sample` present** — do not copy it yourself. Run:

```bash
bash .agents/skills/meta-install/scripts/detect-gpu.sh
```

It prints `QMD_LLAMA_GPU=` for this machine (`cuda` on NVIDIA, `metal` on macOS,
`vulkan` on AMD/Intel, `false` for CPU; `auto` for an unrecognized OS) and, on
Linux + NVIDIA only, the `LD_LIBRARY_PATH=` line for a CUDA library directory.
Report its output verbatim as the user's paste material. Give this **user-run**
copy command, which leaves an existing file or symlink alone:

```bash
if [ ! -e .env ] && [ ! -L .env ]; then
  cp -n .env.sample .env
fi
```

Ask the user to set the detector's `QMD_LLAMA_GPU` and `LD_LIBRARY_PATH` values
in `.env` (leave the latter empty outside CUDA). The sample's `QMD_*_MODEL`
values may stay as shipped; commenting them out permits inherited or qmd
default models. Other sample values can stay untouched.

**`.envrc` missing** — give this **user-run** script, not a tool call. It
creates the direnv loader with exactly `dotenv_if_exists .env` and refuses to
replace an existing path, including a dangling symlink:

```bash
if [ ! -e .envrc ] && [ ! -L .envrc ]; then
  (set -C; printf '%s\n' 'dotenv_if_exists .env' > .envrc)
fi
```

**`.envrc` present** — leave it untouched. Ask the user to verify privately
that it loads `.env` (normally with `dotenv_if_exists .env`); do not append,
replace, read, or request its contents. If either path is a directory, broken
symlink, or otherwise unusable, stop for the user to repair it, not overwrite it.

If either file was missing, **end this turn here** with the user commands and
one next action; resume only after user confirmation and existence checks.
Do not run installers, `bun install`, `uv sync`, Pi package resolution, or qmd
setup while this gate is blocked. `dotenv_if_exists` tolerates a missing `.env`
at runtime; it does not relax this skill's setup gate.

If direnv is already installed and hooked into the user's shell, ask them to
review `.envrc` and run `direnv allow`. If it is missing, defer activation until
Phase 2; file creation does not depend on direnv being installed.

## Phase 2 — Toolchain and environment activation

Only after Phase 1 passes, install what Phase 0 printed as `MISSING`:

```bash
# why: install the missing uv Python runner from its official installer
curl -LsSf https://astral.sh/uv/install.sh | sh
# why: install the missing Bun JS/TS runner from its official installer
curl -fsSL https://bun.sh/install | bash
bun install -g @tobilu/qmd   # qmd — needs bun first
```

Respect approval prompts for installers; a refusal is a stop, not permission
to try another route. `direnv`, `rg`, and `fd` come from the OS package manager
(choose the matching OS and only missing packages):

```bash
# why: install missing shell-loading and search tools on Debian/Ubuntu
sudo apt install direnv ripgrep fd-find
brew install direnv ripgrep fd   # macOS
```

`fd-find` provides `fdfind`, which the fast-search extension accepts. `rg` and
`fd` back `grep` and `find`; without them those tools report an install hint.

Install the Pi CLI itself per <https://pi.dev> if missing. **Pi packages are
declared only in `.pi/settings.json` → `packages`**, not a duplicated list of
`pi install` commands here and not root `package.json` dependencies. Read the
settings for the current list. Pi installs missing project packages on startup
**after project trust** (Phase 4), under `.pi/npm/` or `.pi/git/`. Git cloning
alone downloads none of them. Do not install them globally as a workaround.
These declarations do not install uv, Bun, qmd, or the repo's JS/Python libraries.
Pi can resolve packages even for `pi --help` in a trusted checkout. The skill's
environment gate controls its own actions, not Pi's earlier startup: prepare
files before granting trust if no package downloads should happen first.

`uv` and `bun` land in `~/.local/bin` and `~/.bun/bin`. If a freshly installed
binary is still not on `PATH`, tell the user to reopen the shell, not rerun
its installer.

Before Phase 3, have the user enable the appropriate
[direnv shell hook](https://direnv.net/docs/hook.html), review `.envrc`, and run
`direnv allow` from the repo. They should restart Pi from that activated shell
so its tools inherit the exports. Wait for confirmation; do not call
`direnv allow` on their behalf or print exported secrets. An already-activated
returning checkout needs no repeated approval.

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
extensions load only after Pi trusts the folder. Trust also permits automatic
installation of the `packages` declared in `.pi/settings.json`; these packages
run with full system access. Have the user review the repo and package sources
first. Report the instruction; do not write the trust decision or launch a
trust-approved Pi process on their behalf:

```text
In this repo: open `pi`, run `/trust`, then restart Pi for it to take effect.
```

After restart, use `pi list` to check the resolved package paths. If package
installation failed, report that failure; do not claim the harness is ready or
fall back to global installs. Project entries take precedence over matching
global packages, so an existing global installation need not be removed.

For a deliberately user-approved non-interactive run, `-a` grants trust for
that run (and can therefore install missing packages). This is a **user-run**
example, not a way for the agent to cross either gate:

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
  ⚠ environment   .env missing; .envrc missing — user creation commands above
  ⏸ toolchain     surveyed only; installs blocked by Phase 1
  ⏸ dependencies  not attempted
  ⏸ trust/packages user review + /trust + restart still required
  ⏸ qmd index     not attempted
  Blocked on: environment files. Next: <the first applicable user command>
```

State every gate the user still owns, and give one next command — never a list
of five things to do in an unspecified order. Mark a phase successful only when
observed; list tool versions, resolved packages, and index counts when verified.

## Gotchas

- **`.env` and `.envrc` are user-owned.** Existence/type checks only. Missing
  either blocks installation. Give safe creation commands to the user; never
  execute them yourself or overwrite local configuration.
- **`@types/bun` is the step agents forget.** `"types": ["bun"]` in
  `tsconfig.json` is load-bearing and TypeScript no longer auto-includes
  `@types/*`, so a missing package breaks `Bun`, `bun:test`, and `Request` at
  once. Install it, do not edit `tsconfig.json`.
- **Never pin or announce a TypeScript version from memory.** The repo tracks
  the latest stable TypeScript 7 (the Go-native compiler) as its only
  `typescript`; read `package.json` if the exact version matters.
- **Approve new or changed `.envrc` with `direnv allow`.** With the shell hook,
  `dotenv_if_exists .env` watches `.env` for reloads; ordinary `.env` edits do
  not themselves require reapproval. An already-running Pi process retains its
  old environment: restart it from the activated shell before index setup.
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
