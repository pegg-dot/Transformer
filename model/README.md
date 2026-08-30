# PyTorch Transformer Model

This directory contains the small GPT-style language model that powers the repository's educational walkthrough.

The architecture is implemented directly in PyTorch rather than through Hugging Face `transformers` or `torch.nn.Transformer`. The point is to keep the forward pass readable enough that each major tensor can be traced and visualized.

## Model at a glance

Default configuration (`config.py`):

- character-level tokenizer
- context length: 256 tokens
- embedding / residual width: 384
- attention heads per block: 6
- transformer blocks: 6
- dropout: 0.2
- roughly 10.79M parameters
- Tiny Shakespeare training data

The current project checkpoint was trained for 5,000 iterations and reached approximately 1.05 train loss / 1.50 validation loss.

## Files

```text
model/
├── gpt.py             # transformer architecture + generation
├── config.py          # hyperparameters and device selection
├── data.py            # Tiny Shakespeare download, tokenizer, batching
├── train.py           # AdamW training loop + checkpoint save
├── sample.py          # load checkpoint and generate text
├── hooks.py           # non-invasive activation hooks
├── capture_schema.py  # structure of captured visualization data
├── capture.py         # run a hooked forward pass and serialize activations
└── export_onnx.py     # export logits-only model to ONNX and verify parity
```

## Setup

Run from the repository root. Python 3.11+ is recommended.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-model.txt
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

The training script automatically uses Apple Silicon MPS when available, then CUDA, then CPU.

## Train

```bash
python -m model.train
```

Tiny Shakespeare is downloaded and cached automatically on first use. The default training configuration runs 5,000 iterations and saves:

```text
checkpoints/gpt.pt
```

For a quick smoke test:

```bash
python -m model.train --max_iters 100
```

## Generate text

```bash
python -m model.sample --prompt "ROMEO:" --tokens 300
```

With sampling controls:

```bash
python -m model.sample \
  --prompt "ROMEO:" \
  --tokens 300 \
  --temperature 0.8 \
  --top_k 40
```

## Capture a forward pass

```bash
python -m model.capture --prompt "ROMEO:" --tokens 40 --out model/activations.json
```

The capture system uses external forward hooks instead of changing the model's forward method. It records data such as:

- token and positional embeddings
- layer-normalization outputs
- Q/K/V vectors per head
- attention scores and normalized attention weights
- attention outputs
- residual-stream states
- feed-forward activations and outputs
- final logits and probabilities

Attention scores and weights are recomputed from the captured Q and K tensors because those intermediates otherwise exist only inside each attention head's forward pass.

## Export to ONNX

```bash
python -m model.export_onnx --out model/model.onnx
```

The ONNX export uses dynamic batch and sequence axes. After exporting, the script compares ONNX Runtime logits against the PyTorch model on several sequence lengths and raises an error if the difference exceeds the configured tolerance.

The browser visualizer uses an exported copy of this model under `../viz/public/model.onnx`.

## Scope note: KV cache

The implementation in `gpt.py` uses straightforward autoregressive generation: each decoding step feeds the available context back through the model. It does **not** implement a production-style KV cache.

The visualizer includes a KV-cache explanation because caching keys and values is important to understanding modern LLM inference. That scene is an educational extension, separate from the exact decoding implementation in this small model.

## Read the architecture

If you want to inspect the transformer itself, start with `gpt.py` in this order:

1. token and positional embeddings
2. one causal attention head
3. multi-head attention
4. feed-forward network
5. transformer block
6. full language model
7. autoregressive generation

For a higher-level explanation of how the Python model connects to the browser visualizer, see `../docs/architecture.md`.
