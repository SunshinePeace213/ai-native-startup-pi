#!/usr/bin/env bash
# Suggest the two machine-specific qmd variables for .env. Read-only.
#
#   bash .agents/skills/meta-install/scripts/detect-gpu.sh
#
# Prints the exact `QMD_LLAMA_GPU=` line for this machine, and on Linux+NVIDIA
# the `LD_LIBRARY_PATH=` line pointing at a CUDA `targets/<arch>/lib` directory
# that actually holds the libraries llama.cpp's CUDA backend dlopens.
#
# This script never reads, writes, or touches .env — a human pastes the lines.
set -uo pipefail

CUDA_SONAMES=(libcudart.so libcublas.so libcublasLt.so)

say() { printf '%s\n' "$*"; }

# A candidate qualifies only when it holds the CUDA runtime libraries; a conda
# env with torch installed often has none of them next to it.
score_dir() {
  local dir="$1" hits=0 name
  for name in "${CUDA_SONAMES[@]}"; do
    compgen -G "$dir/$name*" > /dev/null 2>&1 && hits=$((hits + 1))
  done
  printf '%d\n' "$hits"
}

cudart_version() {
  local found
  found="$(compgen -G "$1/libcudart.so.*" 2>/dev/null | head -1)"
  [ -n "$found" ] && printf '%s\n' "${found##*libcudart.so.}"
}

os="$(uname -s)"
arch="$(uname -m)"
say "# machine: $os/$arch"

case "$os" in
  Darwin)
    say "# Apple silicon and Intel Macs both use llama.cpp's Metal backend."
    say ""
    say "QMD_LLAMA_GPU=metal"
    say "# LD_LIBRARY_PATH is CUDA-only — leave it empty on macOS."
    exit 0
    ;;
  Linux) ;;
  *)
    say "# unrecognised OS — let qmd probe for itself."
    say ""
    say "QMD_LLAMA_GPU=auto"
    exit 0
    ;;
esac

vendor=""
if command -v nvidia-smi > /dev/null 2>&1 && nvidia-smi -L 2>/dev/null | grep -q GPU; then
  vendor=nvidia
  say "# GPU: $(nvidia-smi -L 2>/dev/null | head -2 | tr '\n' ';')"
elif command -v rocminfo > /dev/null 2>&1 || compgen -G "/dev/kfd" > /dev/null 2>&1; then
  vendor=amd
  say "# GPU: AMD ROCm device present"
elif command -v vulkaninfo > /dev/null 2>&1 && vulkaninfo --summary > /dev/null 2>&1; then
  vendor=vulkan
  say "# GPU: Vulkan device present (Intel/AMD/other)"
else
  say "# no GPU detected by nvidia-smi, rocminfo, or vulkaninfo"
fi

if [ "$vendor" != nvidia ]; then
  say ""
  case "$vendor" in
    amd | vulkan) say "QMD_LLAMA_GPU=vulkan" ;;
    *) say "QMD_LLAMA_GPU=false   # CPU only; embedding the vault will be slow" ;;
  esac
  say "# LD_LIBRARY_PATH stays empty — it is only for CUDA runtime discovery."
  exit 0
fi

# --- Linux + NVIDIA: find a CUDA targets/<arch>/lib that holds the runtime ----
say ""
say "QMD_LLAMA_GPU=cuda"
say ""
say "# CUDA library search (candidates checked for ${CUDA_SONAMES[*]}):"

candidates=()
add() { [ -d "$1" ] && candidates+=("$1"); }

# `targets/<arch>/lib` first: it holds CUDA libraries only. A conda env's plain
# `lib` also ships libstdc++, libtinfo, and libssl, which shadow the system
# copies for every process direnv touches.
for prefix in \
  "${CUDA_HOME:-}" "${CUDA_PATH:-}" "${CONDA_PREFIX:-}" \
  /usr/local/cuda /usr/local/cuda-*; do
  [ -n "$prefix" ] || continue
  for dir in "$prefix"/targets/*/lib "$prefix"/lib64 "$prefix"/lib; do
    add "$dir"
  done
done
for root in "$HOME"/miniconda3/envs/* "$HOME"/anaconda3/envs/* \
  "$HOME"/miniforge3/envs/* "$HOME"/micromamba/envs/* "$HOME"/.conda/envs/*; do
  add "$root/targets/$arch-linux/lib"
done
for dir in /usr/lib/"$arch"-linux-gnu; do add "$dir"; done

best=""
best_hits=0
seen=""
for dir in "${candidates[@]}"; do
  case " $seen " in *" $dir "*) continue ;; esac
  seen="$seen $dir"
  hits="$(score_dir "$dir")"
  [ "$hits" -eq 0 ] && continue
  say "#   $hits/${#CUDA_SONAMES[@]}  $dir  (libcudart.so.$(cudart_version "$dir"))"
  if [ "$hits" -gt "$best_hits" ]; then
    best="$dir"
    best_hits="$hits"
  fi
done

if [ -z "$best" ]; then
  say "#   none found"
  say "# No CUDA runtime on this machine. Install the CUDA runtime (conda:"
  say "#   'conda install -c nvidia cuda-runtime cuda-libraries'), then re-run"
  say "#   this script. Until then qmd falls back to CPU even with cuda selected."
  say "LD_LIBRARY_PATH="
  exit 0
fi

# Already on the loader path system-wide? Then the variable stays empty.
if printf '%s' "${LD_LIBRARY_PATH:-}" | tr ':' '\n' | grep -qxF "$best" ||
  { command -v ldconfig > /dev/null 2>&1 && ldconfig -p 2>/dev/null | grep -q 'libcudart\.so'; }; then
  say "# libcudart is already resolvable through the system loader path."
  say "# Set it anyway only if 'qmd doctor' reports 'running on CPU'."
fi

say ""
say "LD_LIBRARY_PATH=$best"
say ""
say "# Paste the two lines above into .env, then: direnv allow"
say "# Verify with 'qmd doctor':"
say "#   ✓ device probe: GPU cuda; offloading enabled; devices: ...   <- working"
say "#   ⚠ device probe: running on CPU (N math cores)                <- path wrong"
