# Architecture

The system is two tracks that compound: **Model** and **Viz**. They're joined by a simple handoff format — a captured activation record plus an ONNX export of the trained model.

```
  ┌────────────────────────────────────────────────────────────────┐
  │                          MODEL TRACK                            │
  │                                                                 │
  │  tinyshakespeare ─▶ nanoGPT ─▶ Llama3-arch ─▶ fine-tune ─▶ RLVR │
  │                      │             │                            │
  │                  forward hooks capture every intermediate       │
  │                      │             │                            │
  │                      ▼             ▼                            │
  │              activations.json   model.onnx                      │
  └──────────────────────┬──────────────────────────────────────────┘
                         │
                         │  (handoff — both artifacts are the API between tracks)
                         │
  ┌──────────────────────▼──────────────────────────────────────────┐
  │                           VIZ TRACK                             │
  │                                                                  │
  │  Next.js app ─▶ load ONNX via transformers.js ─▶ run live        │
  │       │                                                          │
  │       ├─ D3 heatmaps (attention, per head per layer)             │
  │       ├─ react-three-fiber (embeddings in 3D, matrix animations) │
  │       ├─ Framer Motion (token decode transitions)                │
  │       └─ Tailwind + dark UI                                      │
  │                                                                  │
  │   Deployed: Vercel (static — no backend)                         │
  └──────────────────────────────────────────────────────────────────┘
```

## Why this split

**Separation of concerns.** The model track is Python, PyTorch, and a GPU. The viz track is TypeScript, React, and a browser. Forcing a clean handoff (activations JSON + ONNX) means we can swap either side without rewriting the other.

**In-browser inference.** Running the model client-side via transformers.js means:
- No backend = free to host, infinite scale
- Shareable as a single URL
- Model runs on the visitor's laptop — feels magical
- Forces the model to stay small (good constraint for a demo)

**Raw PyTorch, not HuggingFace `transformers`.** The goal is understanding, not convenience. By Phase 4 (fine-tuning a real model) we'll use Unsloth + HuggingFace — but by then you've built attention by hand and the abstractions won't hide anything.

## Stack

### Model track

- **Language:** Python 3.11+
- **Framework:** PyTorch 2.x (raw — no `nn.Transformer`, no HF `transformers` until Phase 4)
- **Training compute:** Local CPU / Apple Silicon MPS (Phase 1), Modal H100 (Phase 3+)
- **Data:** tinyshakespeare (Phase 1–3), domain dataset (Phase 4+)
- **Tokenization:** char-level (Phase 1), BPE (Phase 3+)
- **Fine-tuning:** Unsloth + LoRA (Phase 4)
- **RL:** HuggingFace TRL `GRPOTrainer` (Phase 5)
- **Tracking:** Weights & Biases (Phase 3+)
- **Export:** ONNX for in-browser inference, safetensors for checkpoints

### Viz track

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + custom dark theme
- **Inference:** `@huggingface/transformers` (transformers.js) running ONNX in browser
- **2D viz:** D3.js for heatmaps, distributions, line charts
- **3D viz:** react-three-fiber for embedding space, matrix animations
- **Animations:** Framer Motion for UI transitions
- **Deployment:** Vercel (static export where possible)

## The handoff format

Phase 1.5 produces two files that are the API between tracks.

### `activations.json` (or msgpack for size)

One forward pass of the model on a given prompt, fully instrumented:

```json
{
  "prompt": "To be or not to be",
  "tokens": [{ "text": "T", "id": 23 }, ...],
  "embeddings": [...],
  "layers": [
    {
      "layer_idx": 0,
      "attention": {
        "q": [...], "k": [...], "v": [...],
        "scores": [...],
        "output": [...]
      },
      "ffn": { "activations": [...], "output": [...] },
      "residual_out": [...]
    },
    ...
  ],
  "logits": [...],
  "sampled_token": { "id": 42, "text": "e", "temperature": 0.8, "top_k": 40 }
}
```

### `model.onnx`

Standard ONNX export of the trained model. transformers.js loads it in-browser. Use dynamic shapes for variable-length inputs.

## Key design decisions

**Decision: in-browser inference via ONNX over a Python backend.**
- *Why:* Zero infra, free hosting, instant shareability.
- *Trade-off:* Model must stay small (tens of millions of params max). Fine for a nanoGPT demo.

**Decision: raw PyTorch for Phases 1–3.**
- *Why:* Understanding is the whole point.
- *Trade-off:* Slower to write. Worth it — AI-paired scaffolding absorbs most of the friction.

**Decision: Socratic build loop in every phase prompt.**
- *Why:* AI makes it easy to ship code you don't understand. That's the failure mode.
- *Trade-off:* Slight slowdown per milestone. Strongly net positive.

**Decision: hand-type the model, Claude scaffolds the rest.** (Phase 1 specific.)
- *Why:* Active typing burns patterns into muscle memory in a way passive reading doesn't. Wes's advice, learning-science-backed.
- *Trade-off:* Slower than letting Claude write it all. The time spent typing IS the learning.

**Decision: dual-track from Phase 1.5 onward.**
- *Why:* Every model component becomes a viz component. The project visibly compounds.
- *Trade-off:* More scope. Manageable because each viz component maps 1:1 to a captured value.

## Non-goals

- Matching frontier model quality. Our models will be small and dumb. That's fine.
- Perfect code. Optimize for clarity and pedagogy, then speed. Not for "production."
- Supporting every architecture ever. Classic GPT + Llama 3 tells the full story.
