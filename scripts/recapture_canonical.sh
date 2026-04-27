#!/usr/bin/env bash
# Recapture activations.json on the canonical tour prompt.
#
# The viz tour was authored around the prompt "To be, or not to be" but the
# repo's checked-in activations.json captures a "ROMEO:" run. Until this
# script is run, the protagonist VectorGrids in stack/embed/sample show
# residuals from the ROMEO capture (with an honest "real residuals · token
# 'E' of 'ROMEO:'" subtitle).
#
# Run this once locally to align the captured data with the canonical tour
# prompt. Output lands in viz/public/ and the running dev server picks it up
# on next refresh.
#
# Requires: a trained checkpoint at checkpoints/gpt.pt (Phase 1 training).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PROMPT="${PROMPT:-To be, or not to be}"
TOKENS="${TOKENS:-30}"

echo "→ capturing forward pass for prompt: $PROMPT"
python -m model.capture \
  --prompt "$PROMPT" \
  --tokens "$TOKENS" \
  --out viz/public/activations.json

echo "→ compressing to activations.compact.json"
python scripts/compress_activations.py

echo "→ done. Refresh the dev server tab to pick up the new data."
echo "  · viz/public/activations.json         ($(wc -c < viz/public/activations.json | awk '{print $1/1024/1024 "MB"}'))"
echo "  · viz/public/activations.compact.json ($(wc -c < viz/public/activations.compact.json | awk '{print $1/1024/1024 "MB"}'))"
