#!/usr/bin/env bash
# Build this repo's qmd search index. Idempotent — safe to re-run.
#
#   bash scripts/qmd-setup.sh
#
# Requires the qmd CLI: bun install -g @tobilu/qmd
#
# The index is project-local: config and database live in <root>/.qmd/, not in
# the global ~/.config + ~/.cache. qmd finds it by walking up from the current
# directory, so every command run anywhere inside the repo uses this index.
#
# Two collections over the llm-wiki layer -- sibling folders, so a document is
# never indexed twice and a search scopes to one layer with -c.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT="$REPO_ROOT/llm-wiki"
QMD_DIR="$REPO_ROOT/.qmd"

command -v qmd >/dev/null 2>&1 || {
  echo "qmd not found. Install it with: bun install -g @tobilu/qmd" >&2
  exit 1
}
[ -d "$VAULT" ] || { echo "No llm-wiki/ layer at $VAULT" >&2; exit 1; }

# Ask qmd itself where the global index lives, before .qmd/ exists to shadow it.
# Parsing beats guessing at XDG paths, and this is qmd's own answer.
global_index=""
global_config=""
if [ ! -d "$QMD_DIR" ]; then
  # Readers consume their input to EOF: closing qmd's pipe early would kill it
  # with SIGPIPE, and `pipefail` would then abort the whole script.
  global_index="$(cd "$REPO_ROOT" && qmd status 2>/dev/null | awk '/^Index:/ && !seen {print $2; seen=1}')" || true
  config_home="${QMD_CONFIG_DIR:-${XDG_CONFIG_HOME:+$XDG_CONFIG_HOME/qmd}}"
  config_home="${config_home:-$HOME/.config/qmd}"
  [ -f "$config_home/index.yml" ] && global_config="$config_home/index.yml"
fi

# Reads one role out of a qmd index.yml `models:` block.
read_model() {
  awk -v want="  $2:" '
    /^models:/            { inblock = 1; next }
    inblock && /^[^ ]/    { inblock = 0 }
    inblock && index($0, want) == 1 { print $2; exit }
  ' "$1"
}

# Models: an explicit env var wins — QMD_*_MODEL comes from .env via direnv, and
# it overrides both the global index's models here and the project index's
# recorded models below. Otherwise inherit whatever built the global index: a
# vector's dimension is fixed by the model that produced it, so falling back to
# qmd's smaller defaults would break the index seeded from it.
global_embed=""
if [ -n "$global_config" ]; then
  for role in embed generate rerank; do
    var="QMD_$(echo "$role" | tr '[:lower:]' '[:upper:]')_MODEL"
    inherited="$(read_model "$global_config" "$role")"
    [ "$role" = embed ] && global_embed="$inherited"
    if [ -z "${!var:-}" ] && [ -n "$inherited" ]; then
      export "$var=$inherited"
    fi
  done
fi

# Seed from the global index so unchanged documents keep their vectors. Paths in
# the main checkout do not move, so this is a straight reuse: `qmd embed` below
# only has to cover documents the global index never saw. A vector row is keyed
# by the model that produced it, so once the embed model differs the seed is
# dead weight — skip the copy rather than carry rows nothing will ever match.
mkdir -p "$QMD_DIR"
if [ -n "$global_index" ] && [ -f "$global_index" ] && [ ! -f "$QMD_DIR/index.sqlite" ] \
   && [ "${QMD_EMBED_MODEL:-$global_embed}" = "$global_embed" ]; then
  cp "$global_index" "$QMD_DIR/index.sqlite"
  echo "Seeded $QMD_DIR/index.sqlite from $global_index"
fi

cd "$REPO_ROOT"

# `qmd init` writes .qmd/index.yml using qmd's own serializer, resolving models
# from the environment prepared above. On re-runs it keeps the recorded models.
qmd init

CONFIG="$QMD_DIR/index.yml"
[ -f "$QMD_DIR/index.yaml" ] && CONFIG="$QMD_DIR/index.yaml"

# qmd resolves a model as config-first, environment-second, so an existing
# index.yml silences .env entirely — and `qmd init` only writes models into a
# config it just created. Rewrite the recorded model so re-running this script
# is what applies a .env edit. Changing the embed model invalidates every stored
# vector (they are keyed by model), so `qmd embed` below re-embeds the vault.
for role in embed generate rerank; do
  var="QMD_$(echo "$role" | tr '[:lower:]' '[:upper:]')_MODEL"
  want="${!var:-}"
  [ -n "$want" ] || continue
  have="$(read_model "$CONFIG" "$role")"
  [ "$want" = "$have" ] && continue
  awk -v line="  $role:" -v want="$want" '
    /^models:/            { inblock = 1 }
    inblock && index($0, line) == 1 { print line " " want; next }
    { print }
  ' "$CONFIG" > "$CONFIG.tmp" && mv "$CONFIG.tmp" "$CONFIG"
  echo "$role model: ${have:-unset} -> $want"
done

# Download the configured models up front, so a first search does not stall on a
# multi-GB fetch. node-llama-cpp is qmd's own downloader: pointed at qmd's cache
# it writes the exact filenames qmd resolves, and skips any file already there
# at the expected size — the check and the download in one command.
models_dir="${XDG_CACHE_HOME:-$HOME/.cache}/qmd/models"
qmd_pkg="$(dirname "$(dirname "$(readlink -f "$(command -v qmd)")")")"
nlc=""
for candidate in "$qmd_pkg/node_modules/node-llama-cpp/dist/cli/cli.js" \
                 "$(dirname "$(dirname "$qmd_pkg")")/node-llama-cpp/dist/cli/cli.js"; do
  [ -f "$candidate" ] && { nlc="$candidate"; break; }
done
if [ -n "$nlc" ]; then
  uris=()
  for role in embed generate rerank; do
    uri="$(read_model "$CONFIG" "$role")"
    [ -n "$uri" ] && uris+=("$uri")
  done
  [ ${#uris[@]} -gt 0 ] && bun "$nlc" pull -d "$models_dir" "${uris[@]}"
else
  echo "node-llama-cpp not found next to qmd; models will download on first use." >&2
fi

# Re-adding is how this stays idempotent. Embeddings are keyed by content hash,
# so dropping and re-adding a collection does not re-embed unchanged text.
for name in wiki raw sources; do
  qmd collection remove "$name" >/dev/null 2>&1 || true
done

qmd collection add "$VAULT/wiki" --name wiki --mask "**/*.md"
qmd collection add "$VAULT/raw"  --name raw  --mask "**/*.md"

qmd context add qmd://wiki "Compiled synthesis layer: LLM-maintained wiki pages over llm-wiki/raw. Pages carry type/status frontmatter, [[wikilinks]], and cite raw archives in sources:. This is the answer layer."
qmd context add qmd://raw "Immutable source archives: faithful markdown captures of articles, papers, docs, chats, and other sources, filed by form. Cited by wiki pages, never edited by hand. This is the evidence layer."

qmd update

# A vector's dimension is fixed by the model that produced it, so switching the
# embed model leaves `qmd embed` unable to insert into the existing table — it
# refuses in prose rather than with an exit code, and only a full re-embed gets
# through. Reacting to that message rather than to "did this run rewrite the
# model" keeps the recovery idempotent: a re-run after an interrupted switch
# still repairs the index. Any other failure propagates untouched.
embed_status=0
embed_log="$(qmd embed 2>&1 | tee /dev/stderr)" || embed_status=$?
if printf '%s' "$embed_log" | grep -qi "dimension mismatch"; then
  echo "Embed model changed — re-embedding the whole vault."
  qmd embed -f
elif [ "$embed_status" -ne 0 ]; then
  exit "$embed_status"
fi

qmd status
