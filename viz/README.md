# Interactive Transformer Visualizer

This directory contains the browser experience for the repository. It turns a small GPT-style transformer's forward pass into a guided, interactive walkthrough.

The visualizer is intentionally self-contained: the ONNX model, vocabulary, ONNX Runtime browser assets, and captured activation data are included under `public/`, so an outside reviewer can run the app without API keys, a Python server, or a separate model service.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

For a production build:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

## What the visualizer covers

The guided experience includes scenes for:

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
- KV-cache behavior as a modern decoding concept

The project uses a mix of 2D diagrams and 3D interactive views. 3D is reserved for concepts where spatial structure helps, such as embedding space or parallel heads; matrices and probability distributions stay primarily 2D.

## Where the data comes from

The visualizer is tied to the Python model rather than being only a conceptual animation.

`../model/capture.py` attaches hooks to the trained PyTorch network and records intermediate tensors. The resulting activation data is copied into this app's `public/` directory. The trained model is also exported to ONNX and loaded in the browser with ONNX Runtime Web.

Important scope note: the small model in `../model/gpt.py` is a simple character-level GPT implementation. The visualizer also teaches a few concepts used in larger production LLM systems, including KV caching. Those scenes are educational extensions and should not be read as a claim that the training model implements a production KV cache.

## Main directories

```text
viz/
├── app/                    # Next.js app routes and metadata
├── components/
│   ├── movie/              # scene sequencing / orchestration
│   ├── scenes/             # concept-specific walkthrough scenes
│   └── deepdive/           # 3D interactive explanations
├── lib/                    # browser inference + activation helpers
├── public/
│   ├── model.onnx          # exported trained model
│   ├── vocab.json          # tokenizer vocabulary
│   ├── activations.json    # canonical captured activation data
│   ├── activations.compact.json
│   └── ort/                # ONNX Runtime browser assets
├── PERF_AUDIT.md           # payload and performance audit
└── vercel.json             # cache headers for large static assets
```

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- D3.js
- Three.js + react-three-fiber
- Framer Motion
- ONNX Runtime Web

## Deploy to Vercel

If importing the repository through the Vercel dashboard, set the project **Root Directory** to `viz` and keep the detected framework as Next.js. No secrets or API keys are required.

From this directory, the CLI flow is:

```bash
npm install
npm run build
npx vercel
```

Production:

```bash
npx vercel --prod
```

The large ONNX and activation files are static assets. `vercel.json` gives them long-lived cache headers so repeat visits do not continually redownload unchanged model data.

## If you want to modify the model

Model training, sampling, activation capture, and ONNX export live in the repository's `model/` directory. Start with the root `README.md` and `../model/README.md` for the model-side workflow.
