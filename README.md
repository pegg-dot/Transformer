# Transformer From Scratch → Live Visualizer

A dual-track project: build a modern transformer from scratch in raw PyTorch, and simultaneously build a live, interactive web visualizer that shows every internal operation — tokenization, embeddings, attention heads, Q/K/V matrices, KV cache, decoding — running on the model you trained yourself.

**Goal:** a shareable URL that makes a transformer's internals click for anyone who sees it, backed by code you wrote and can explain cold.

## Why this exists

- **Learning artifact.** Building a transformer teaches you the architecture. Visualizing it teaches you everything you missed.
- **Portfolio weapon.** "I built a transformer" is forgettable. "I built a live transformer visualizer running on my own trained model" is a DM to any VC that works.
- **Fundable seed.** The viz is a legitimate educational / interpretability product candidate — lead magnet, course, or standalone tool.

## Repo layout

```
.
├── README.md              ← you are here
├── ROADMAP.md             ← full phase-by-phase plan with success criteria
├── PROJECT_STATE.md       ← living state file — session handoff, always read first
├── docs/
│   ├── architecture.md    ← technical design, stack, key decisions, dual-track flow
│   ├── glossary.md        ← VC-grade quick reference for every concept
│   └── resources.md       ← canonical papers, videos, references
├── prompts/               ← Claude kick-off prompts per phase
│   ├── README.md
│   ├── phase-1-model.md
│   ├── phase-1.5-instrumentation.md
│   └── phase-2-visualizer.md
├── model/                 ← Phase 1+ PyTorch code (populated as we build)
└── viz/                   ← Phase 2+ Next.js app (populated as we build)
```

## Quickstart

1. Read `PROJECT_STATE.md` — always the source of truth for where we are
2. Open the current phase's prompt in `prompts/`
3. Paste into Claude
4. Build (hand-type the model; Claude scaffolds the rest — see Phase 1 prompt for the split)

## The stack

- **Model:** Python, PyTorch (raw — no HuggingFace `transformers`, no `nn.Transformer`). Local for Phase 1, Modal for Phase 3+.
- **Visualizer:** Next.js 15 + TypeScript + Tailwind, transformers.js (in-browser ONNX), D3.js for 2D, react-three-fiber for 3D, Framer Motion, deployed on Vercel.
- **Training pipeline:** Unsloth (Phase 4 fine-tuning), HuggingFace TRL for GRPO (Phase 5 RLVR).
- **Coach:** Claude in Socratic mode (see `prompts/`).

## Current phase

Always see `PROJECT_STATE.md`. That file is the source of truth — every session ends with an update to it.
