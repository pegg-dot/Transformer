# PyTorch Transformer Model

This directory contains the GPT-style language model behind the interactive Transformer project.

I implemented the architecture directly in PyTorch rather than using Hugging Face `transformers` or `torch.nn.Transformer` for the core model. The point was to keep the forward pass readable enough that I could trace the tensors myself and connect them to the browser visualizer.

## Model at a glance

- character-level tokenizer
- context length: 256 tokens
- residual / embedding width: 384
- 6 attention heads per block
- 6 transformer blocks
- dropout: 0.2
- approximately 10.79M parameters
- Tiny Shakespeare training corpus
- current checkpoint trained for 5,000 iterations
- approximately 1.05 train loss / 1.50 validation loss

## Implementation

The model directory contains the architecture, training loop, sampling path, non-invasive activation hooks, capture schema, and ONNX export/verification code.

The activation pipeline records model internals used by the visualizer, including token and positional embeddings, normalization outputs, Q/K/V vectors, attention values, residual-stream states, feed-forward activations, and logits.

Attention scores and weights are reconstructed from captured Q and K tensors where those values otherwise exist only transiently inside the attention-head forward pass.

## Browser connection

The trained network can be exported to ONNX and compared numerically against the PyTorch implementation. The visualizer uses an exported model together with captured activation data so the browser experience stays connected to the underlying model rather than becoming a disconnected conceptual animation.

## Scope note: KV caching

The implementation uses straightforward autoregressive generation: each decoding step runs the available context through the model again. It does **not** implement a production-style KV cache.

The interactive visualizer includes a KV-cache explanation because caching keys and values is central to understanding modern LLM inference. That scene is an educational extension and is intentionally separated from claims about what this small model implements.

For the interactive experience, visit [transformer-viz-eight.vercel.app](https://transformer-viz-eight.vercel.app).
