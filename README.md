# Transformer From Scratch + Interactive Visualizer

[![verification](https://github.com/pegg-dot/Transformer/actions/workflows/smoke.yml/badge.svg)](https://github.com/pegg-dot/Transformer/actions/workflows/smoke.yml)

**A GPT-style transformer I built from scratch in PyTorch, trained on Tiny Shakespeare, instrumented to expose its internal activations, and turned into an interactive browser experience.**

[**Explore the live visualizer → transformer-viz-eight.vercel.app**](https://transformer-viz-eight.vercel.app)

<p align="center">
  <img src="docs/images/transformer-qkv.webp" alt="Interactive transformer visualizer showing query, key, and value projections" width="100%">
</p>

I built this project because I wanted to understand a transformer below the level of an API call. The model came first. I implemented the core architecture directly in PyTorch, trained it, captured what was happening inside the forward pass, and then built the visualizer around those tensors.

The repository is public so the work can be inspected. The live visualizer is the intended way to experience the project.

## What I built

The project connects three pieces that are often learned separately:

- **A transformer implemented from scratch:** token and positional embeddings, causal self-attention, Q/K/V projections, multiple attention heads, feed-forward networks, residual connections, layer normalization, logits, and autoregressive sampling.
- **Instrumentation around the trained model:** hooks capture intermediate tensors from a real forward pass rather than substituting hand-authored numbers for the core transformer scenes.
- **An interactive visual explanation:** a Next.js experience turns those internals into a guided sequence of 2D and 3D scenes covering the transformer stack from input tokens through next-token prediction.

## Model at a glance

The model is intentionally small enough that I could reason about the entire system end to end:

- approximately **10.79 million parameters**
- character-level tokenizer
- **6 transformer blocks**
- **6 attention heads** per block
- **384-dimensional** residual stream
- **256-token** context window
- trained for **5,000 iterations** on Tiny Shakespeare
- approximately **1.05 train loss / 1.50 validation loss** on the current checkpoint

The core architecture is written directly in PyTorch rather than delegated to Hugging Face `transformers` or `torch.nn.Transformer`.

## What the visualizer shows

The browser experience walks through concepts including tokenization, embeddings, Q/K/V, causal attention, multi-head attention, residual updates, feed-forward layers, transformer stacking, logits, sampling, training intuition, and modern decoding concepts.

For the core forward-pass scenes, the visualizer is tied to activations captured from the model itself. A few scenes intentionally go beyond the exact implementation to explain ideas used in larger production LLM systems. For example, the visualizer teaches KV caching even though this small training model uses straightforward autoregressive decoding without a production-style KV cache.

<p align="center">
  <img src="docs/images/transformer-training.webp" alt="Interactive visualizer showing gradient descent on a loss surface" width="100%">
</p>

That distinction matters to me: the goal was not to make a polished animation that merely looks technical. I wanted the explanations to stay anchored to a model I had actually implemented and trained.

## Technical surface

The project spans both model engineering and interactive visualization:

- Python + PyTorch for the transformer, training, sampling, and activation capture
- ONNX export for browser-side model execution
- Next.js + React + TypeScript for the visualizer
- Three.js / react-three-fiber for spatial scenes
- D3.js for data-driven visual explanations
- Framer Motion for scene transitions and interaction
- ONNX Runtime Web for browser inference

The repository also includes numerical and structural checks around captured activations, attention behavior, residual arithmetic, ONNX/PyTorch agreement, and clean-build verification.

## Why I built it

The goal was not to train a competitive language model. It was to make the transformer stack concrete enough that I could trace what happens to a token rather than treating an LLM as a black box.

Building the model before the visualizer changed the project completely. Instead of drawing diagrams first and finding code that resembled them later, I could start with tensors produced by my own implementation and work backward into an explanation.

## Security and privacy

The public visualizer does not require accounts, an application database, API keys, or a separate model server. The model and visualization assets used by the experience are delivered with the application and execute in the browser.

The repository keeps secret-bearing environment files, local deployment state, private keys, checkpoints, and common generated artifacts out of version control. GitHub Actions verifies clean builds and model execution, and the frontend dependency tree is checked for high-severity published vulnerabilities.

If you find a security issue in the repository or deployed visualizer, please follow [`SECURITY.md`](SECURITY.md) rather than publishing exploit details in a public issue.

## License and attribution

This project is released under the **MIT License**.

You may use, modify, and redistribute the software, including in other projects. The MIT terms require the copyright notice and permission notice to be included in copies or substantial portions of the software. In other words, reuse is allowed, but the license and attribution to **Nate Pegg** travel with the code.

See [`LICENSE`](LICENSE) for the exact terms.

---

**Built by Nate Pegg.**
