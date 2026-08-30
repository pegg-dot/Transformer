# Transformer From Scratch → Live Visualizer

A transformer I built from scratch in raw PyTorch to understand how LLMs work internally, paired with an interactive visualizer that walks through the model step by step. The project covers tokenization, embeddings, Q/K/V, attention, multi-head attention, feed-forward layers, the residual stream, KV caching, and decoding using activations captured from the model itself.

The model is a 10.79M-parameter GPT-style language model trained on Tiny Shakespeare. It was built without HuggingFace `transformers` or `nn.Transformer`, then instrumented to capture internal activations and exported to ONNX for browser inference.

The visualizer has grown into a guided cinematic walkthrough with roughly 34 scenes, including interactive 2D and 3D explanations of the transformer's internals.

## What's built

- **Transformer from scratch:** token + positional embeddings, causal self-attention, multi-head attention, feed-forward layers, residual connections, layer normalization, and autoregressive generation.
- **Training pipeline:** trained locally on Tiny Shakespeare, with the current checkpoint reaching about 1.05 train loss / 1.50 validation loss after 5,000 iterations.
- **Instrumentation:** hooks capture Q/K/V, attention scores and weights, layer norms, residual-stream states, and feed-forward activations without modifying the model architecture.
- **ONNX export:** the trained model runs outside PyTorch and was verified against PyTorch outputs to within `1e-5`.
- **Interactive visualizer:** a Next.js 16 + TypeScript app that turns the forward pass into a guided movie, with dedicated scenes for tokenization, embeddings, Q/K/V, attention, multi-head attention, FFNs, model stacking, sampling, and KV cache behavior.
- **3D deep dives:** interactive views for embedding space, parallel attention heads, self-attention, feed-forward neurons, and KV-cache steps.

## Repo layout

```text
.
├── README.md
├── PROJECT_STATE.md       # detailed build history and current state
├── ROADMAP.md
├── docs/                  # architecture, glossary, resources, viz design docs
├── model/                 # PyTorch transformer, training, capture, and ONNX export
├── scripts/               # activation verification/compression + ONNX utilities
├── prompts/               # build prompts and earlier phase plans
└── viz/                   # Next.js interactive transformer visualizer
```

## Stack

- **Model:** Python + raw PyTorch
- **Visualizer:** Next.js 16, TypeScript, Tailwind, D3.js, react-three-fiber, Framer Motion
- **Browser inference:** ONNX Runtime / exported ONNX model

## Run the visualizer locally

```bash
git clone https://github.com/pegg-dot/Transformer.git
cd Transformer/viz
npm install
npm run dev
```

Then open **http://localhost:3000** and press **Play**. Use the chapter rail to move between acts.

```bash
npm run build
npm run start
npm run lint
```

Requires Node 20+.

## Status

The transformer, instrumentation pipeline, ONNX export, and cinematic visualizer are built and runnable locally. The visualizer has not yet been deployed to a permanent public URL. Later roadmap experiments around Llama-3-style architecture changes, fine-tuning, and RLVR are separate extensions and are not required for the core project to be complete.
