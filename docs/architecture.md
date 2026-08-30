# Architecture

The repository has two connected parts: a **model track** in Python/PyTorch and a **visualization track** in Next.js/TypeScript.

The Python side is the numerical source of truth. It trains the model, captures intermediate activations, and exports the trained network to ONNX. The browser side consumes those artifacts and turns them into an interactive explanation.

```text
┌──────────────────────────────────────────────────────────────┐
│                         MODEL TRACK                          │
│                                                              │
│ Tiny Shakespeare                                             │
│       |                                                      │
│       v                                                      │
│ character-level tokenizer                                    │
│       |                                                      │
│       v                                                      │
│ raw PyTorch GPT (6 blocks, 6 heads, 384-wide)                │
│       |                         |                            │
│       | forward hooks           | ONNX export                │
│       v                         v                            │
│ captured activations        model.onnx                       │
│       |                         |                            │
└───────|─────────────────────────|────────────────────────────┘
        |                         |
        +------------+------------+
                     |
                     v
┌──────────────────────────────────────────────────────────────┐
│                    VISUALIZATION TRACK                       │
│                                                              │
│ Next.js 16 + React 19 + TypeScript                          │
│       |                                                      │
│       +--> captured activation playback                      │
│       +--> ONNX Runtime Web inference                        │
│       +--> D3 2D visualizations                              │
│       +--> Three.js / react-three-fiber 3D deep dives        │
│       +--> Framer Motion transitions                         │
│       |                                                      │
│       v                                                      │
│ guided interactive transformer walkthrough                  │
└──────────────────────────────────────────────────────────────┘
```

## Why the split exists

The two halves have different jobs.

**Python/PyTorch owns model behavior.** Training, sampling, tensor capture, and numerical verification stay close to the model implementation.

**The browser owns explanation.** React components can focus on pedagogy, interaction, animation, and spatial presentation without embedding model-training logic into the frontend.

The handoff is intentionally simple:

- captured activation data for replaying and explaining an instrumented forward pass
- an exported ONNX model for browser-side inference
- a vocabulary file for mapping between token IDs and characters

This also makes the system easier to audit: a reviewer can inspect the model independently from the UI and trace where the data shown by the UI comes from.

## Model track

### Stack

- Python 3.11+ recommended
- PyTorch 2.x
- NumPy
- ONNX
- ONNX Runtime for export verification

### Model design

The current training model is a small GPT-style decoder-only transformer implemented without Hugging Face `transformers` or `torch.nn.Transformer`.

Default configuration:

- character-level tokenization
- 256-token context window
- 384-dimensional embedding/residual width
- 6 transformer blocks
- 6 causal self-attention heads per block
- feed-forward network in each block
- learned token embeddings
- learned positional embeddings
- pre-norm residual connections
- final layer norm + language-model projection
- autoregressive next-token generation

The model is intentionally small enough to train and inspect locally. It is an educational model, not an attempt to match frontier-model quality.

### Data flow

`model/data.py` downloads Tiny Shakespeare on first use, builds the deterministic character vocabulary, converts the corpus into token IDs, and creates a 90/10 train/validation split.

`model/train.py` samples random context windows and trains the language model with AdamW.

`model/sample.py` rebuilds the same tokenizer, loads the saved checkpoint, and performs autoregressive decoding with optional temperature and top-k sampling.

## Activation capture

`model/hooks.py` attaches PyTorch forward hooks without changing the core model architecture.

`model/capture.py` then:

1. loads the trained checkpoint
2. generates a sequence from a prompt
3. attaches the activation hooks
4. runs one clean forward pass over the completed sequence
5. records intermediate tensors
6. recomputes attention scores and weights from captured Q and K tensors
7. serializes the result according to `model/capture_schema.py`

Captured information includes:

- token embeddings
- positional embeddings
- layer-normalization states
- Q/K/V tensors for each attention head
- causal attention scores and weights
- attention outputs
- residual-stream states
- feed-forward intermediate activations
- final normalized state
- logits and next-token probabilities

The visualizer uses a compact copy of this data for faster browser delivery while retaining the canonical capture as a reference artifact.

## ONNX export

`model/export_onnx.py` wraps the model so the exported graph returns logits only.

The export uses dynamic axes for batch and sequence dimensions, allowing the browser to evaluate different sequence lengths up to the model's context limit.

After export, the script loads the graph with ONNX Runtime and compares its logits against PyTorch for several sequence lengths. The export fails if numerical disagreement exceeds the configured tolerance.

The browser-ready model is stored at:

```text
viz/public/model.onnx
```

## Visualization track

### Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- D3.js
- Three.js
- react-three-fiber + drei
- Framer Motion
- ONNX Runtime Web

### Application structure

The visualizer is organized as a guided sequence rather than a static dashboard.

Key areas:

```text
viz/
├── app/                    # Next.js entry points and metadata
├── components/
│   ├── movie/              # sequencing, acts, controls, transitions
│   ├── scenes/             # concept-specific scenes
│   └── deepdive/           # 3D explanations
├── lib/                    # activation loading and inference helpers
└── public/                 # model and captured-data artifacts
```

The walkthrough covers the main transformer path from input representation through attention, feed-forward processing, stacked blocks, logits, and sampling.

3D is used only when spatial relationships are useful, such as embedding space or parallel attention-head structure. Matrix-heavy concepts remain primarily 2D.

## Real model data vs. explanatory extensions

The project makes an important distinction between **visualizing this model** and **teaching the broader inference stack used by modern LLMs**.

The trained model in `model/gpt.py` uses standard autoregressive decoding: each next-token step feeds the current context through the model again. It does not implement a production-style KV cache.

The visualizer includes KV-cache scenes because caching keys and values is fundamental to understanding efficient modern LLM inference. Those scenes are educational extensions, not captured evidence that this toy model uses cached decoding.

That boundary is intentional and documented so the visualization does not overclaim what the underlying implementation does.

## Deployment architecture

The visualizer has no application backend or required API service. The model and activation artifacts are shipped as static files and inference runs in the visitor's browser.

The repository is prepared for Vercel deployment with `viz` as the project root. `viz/vercel.json` applies long-lived immutable cache headers to large model/runtime/activation assets.

A compatible Node host can also run the production build with:

```bash
npm run build
npm run start
```

## Design principles

### Prefer explicit code over abstraction

The core transformer is intentionally direct. The educational value comes from being able to trace a token through the implementation rather than hiding the mechanics behind a high-level library.

### Keep the visualizer tied to numerical artifacts

The UI should explain model behavior using tensors that can be traced back to the model whenever possible. Verification scripts exist to check tensor shapes, causal masking, probability normalization, residual arithmetic, and ONNX/PyTorch agreement.

### Keep production-LLM concepts labeled honestly

The visualizer can teach concepts beyond this small model, but those extensions should be labeled as such. KV caching is the clearest current example.

## Non-goals

- matching frontier-model quality
- supporting every transformer architecture
- turning the toy model into a production inference server
- hiding implementation details behind high-level transformer APIs

The current objective is narrower: build a transformer that can be read end-to-end, connect it to real captured tensors, and make those internals understandable in an interactive browser experience.
