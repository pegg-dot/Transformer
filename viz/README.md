# Interactive Transformer Visualizer

This directory contains the browser experience for the Transformer project.

[**Open the live visualizer → transformer-viz-eight.vercel.app**](https://transformer-viz-eight.vercel.app)

The experience turns the forward pass of a small GPT-style transformer into a guided visual sequence. Core scenes are grounded in activation data captured from the PyTorch model in this repository, while a small number of scenes deliberately extend beyond the exact training implementation to explain concepts used in modern LLM inference.

## What it covers

The walkthrough includes:

- tokenization and token IDs
- token and positional embeddings
- embedding-space intuition
- query, key, and value projections
- attention scores, causal masking, and attention weights
- parallel attention heads
- residual-stream updates
- feed-forward layers
- stacked transformer blocks
- logits and next-token sampling
- training and gradient-descent intuition
- KV caching as a modern decoding concept

The project mixes 2D and 3D explanations based on what makes a concept easiest to understand. Spatial views are used where geometry helps; matrices, probabilities, and token flows stay primarily 2D.

## Data connection

The visualizer is not only a conceptual animation. The Python model is instrumented to capture intermediate tensors used by the browser experience, including embeddings, Q/K/V, attention values, residual states, feed-forward activations, and logits.

The trained network is also exported to ONNX for browser-side inference with ONNX Runtime Web.

The small model itself does **not** implement a production-style KV cache. The KV-cache scene is intentionally educational and is labeled as a modern inference concept rather than an implementation claim about the training model.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- D3.js
- Three.js + react-three-fiber
- Framer Motion
- ONNX Runtime Web

The live deployment is the intended way to experience the visualizer. The repository remains public so the implementation can be inspected and reused under the project license.
