#!/usr/bin/env bash
# Build a throwaway checkout for the meta-install evals. Never run the cases in
# the real repo: the flow installs packages, downloads models, and builds an index.
#
#   bash .agents/skills/meta-install/evals/make-fixture.sh /tmp/mi-fixture
#   bash .agents/skills/meta-install/evals/make-fixture.sh /tmp/mi-fixture --no-sample
#   bash .agents/skills/meta-install/evals/make-fixture.sh /tmp/mi-fixture --with-env
#
# The fixture carries the skill's scripts/, an empty llm-wiki layer, and a
# dependency-free package.json, so `bun install` in it downloads nothing.
#
# SKILL.md and references/ are deliberately NOT copied: a `--no-skills` baseline
# run would find and read them, which destroys the with/without delta. Load the
# skill explicitly instead, which works even with --no-skills:
#
#   with:     pi -a --no-session --skill <repo>/.agents/skills/meta-install -p "<prompt>"
#   without:  pi -a --no-session --no-skills -p "<prompt>"
set -euo pipefail

DEST="${1:?usage: make-fixture.sh <dir> [--no-sample|--with-env]}"
MODE="${2:-}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ROOT="$(git -C "$SKILL_DIR" rev-parse --show-toplevel)"

[ -e "$DEST" ] && {
  echo "refusing to overwrite $DEST" >&2
  exit 1
}

mkdir -p "$DEST/.agents/skills/meta-install" "$DEST/llm-wiki/wiki" "$DEST/llm-wiki/raw" "$DEST/docs"
cp -R "$SKILL_DIR/scripts" "$DEST/.agents/skills/meta-install/scripts"
cp "$SOURCE_ROOT/AGENTS.md" "$DEST/AGENTS.md"
printf '{ "name": "fixture", "private": true, "scripts": { "typecheck": "echo typecheck" } }\n' > "$DEST/package.json"
printf '{ "compilerOptions": { "types": ["bun"] } }\n' > "$DEST/tsconfig.json"
printf '# placeholder page\n' > "$DEST/llm-wiki/wiki/index.md"

case "$MODE" in
  --no-sample) ;; # no .env.sample, no .env — exercises the hard stop
  --with-env)
    printf 'QMD_LLAMA_GPU=auto\nLD_LIBRARY_PATH=\n' > "$DEST/.env.sample"
    cp "$DEST/.env.sample" "$DEST/.env"
    ;;
  *) printf 'QMD_LLAMA_GPU=auto\nLD_LIBRARY_PATH=\nQMD_EMBED_MODEL=\nLLM_WIKI_ACTOR=\n' > "$DEST/.env.sample" ;;
esac

git -C "$DEST" init -q
git -C "$DEST" add -A > /dev/null 2>&1 || true
echo "fixture ready: $DEST (mode: ${MODE:-default})"
