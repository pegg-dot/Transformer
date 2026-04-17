# model/

PyTorch code for the transformer. Populated as you progress through phases.

## Expected contents (by phase)

**After Phase 1:**
- `gpt.py` — model definition (YOU hand-type this): TokenEmbedding, PositionalEmbedding, Head, MultiHeadAttention, FeedForward, Block, GPTLanguageModel
- `data.py` — tinyshakespeare loader, tokenizer, batcher (Claude scaffolds)
- `train.py` — training loop (Claude scaffolds)
- `generate.py` — autoregressive generation with temperature + top-k (Claude scaffolds)
- `checkpoints/best.pt` — trained weights (gitignored)

**After Phase 1.5:**
- `capture_schema.py` — TypedDicts for activations JSON
- `hooks.py` — PyTorch forward-hook registration
- `capture.py` — prompt → `activations.json`
- `export_onnx.py` — trained model → `model.onnx`
- `activations.json` — sample captured forward pass
- `model.onnx` — ONNX export (gitignored)

**After Phase 3:**
- `gpt_llama3.py` — RoPE, SwiGLU, RMSNorm, GQA, real KV cache

**After Phase 4:**
- `finetune/` — LoRA fine-tuning scripts for Qwen/Gemma via Unsloth

**After Phase 5:**
- `rl/` — GRPO training scripts via TRL

## How to use

From the repo root, open Claude with the appropriate phase prompt (see `prompts/`). Claude will scaffold the supporting code and guide you through hand-typing the model itself.

Training runs locally: CPU (slow but works) or Apple Silicon MPS (fast enough) for Phase 1. Modal H100 for Phase 3+.
