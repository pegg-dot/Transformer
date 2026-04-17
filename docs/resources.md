# Resources

Curated. Ordered by when you'll want them.

---

## Phase 1 — Build nanoGPT

### Primary

- **Andrej Karpathy, "Let's build GPT: from scratch, in code, spelled out."** [YouTube](https://www.youtube.com/watch?v=kCc8FmEb1nY). Canonical transformer-from-scratch video. Great companion for Phase 1.
- **karpathy/nanoGPT** — [github.com/karpathy/nanoGPT](https://github.com/karpathy/nanoGPT). Reference only — don't copy.
- **"Attention Is All You Need"** (Vaswani et al., 2017) — [arXiv:1706.03762](https://arxiv.org/abs/1706.03762). Read after Phase 1.

### Secondary

- **"The Illustrated Transformer"** by Jay Alammar — [jalammar.github.io/illustrated-transformer](https://jalammar.github.io/illustrated-transformer/).
- **Karpathy, "Let's reproduce GPT-2 (124M)"** — [YouTube](https://www.youtube.com/watch?v=l8pRSuU81PU). Good Phase 3 prep.

---

## Phase 2 — Visualizer

### Existing visualizers (study the bar)

- **bbycroft.net/llm** — 3D nanoGPT walkthrough. Gorgeous, static.
- **Polo Club Transformer Explainer** — [poloclub.github.io/transformer-explainer](https://poloclub.github.io/transformer-explainer/). Interactive, in-browser. Closest to our target.
- **Financial Times "Generative AI exists because of the transformer"** — scrollytelling explainer.
- **3Blue1Brown transformer series** — [YouTube playlist](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi). Gold standard for intuition.

### Tools

- **transformers.js** — [huggingface.co/docs/transformers.js](https://huggingface.co/docs/transformers.js). ONNX in-browser.
- **D3.js** — [d3js.org](https://d3js.org/). 2D viz.
- **react-three-fiber** — [r3f.docs.pmnd.rs](https://r3f.docs.pmnd.rs/). 3D React.
- **Framer Motion** — [motion.dev](https://motion.dev/). Animations.
- **Next.js 15 App Router docs** — [nextjs.org/docs](https://nextjs.org/docs).

### Design inspiration

- Linear (linear.app), Vercel dashboard.
- Anthropic Interpretability — [transformer-circuits.pub](https://transformer-circuits.pub/).

---

## Phase 3 — Modernize to Llama 3

- **"RoFormer"** (Su et al., 2021) — [arXiv:2104.09864](https://arxiv.org/abs/2104.09864). RoPE paper.
- **"The Llama 3 Herd of Models"** (Meta, 2024) — [arXiv:2407.21783](https://arxiv.org/abs/2407.21783).
- **"GLU Variants Improve Transformer"** (Shazeer, 2020) — [arXiv:2002.05202](https://arxiv.org/abs/2002.05202). SwiGLU.
- **"Root Mean Square Layer Normalization"** (Zhang & Sennrich, 2019) — [arXiv:1910.07467](https://arxiv.org/abs/1910.07467). RMSNorm.
- **"GQA"** (Ainslie et al., 2023) — [arXiv:2305.13245](https://arxiv.org/abs/2305.13245).

---

## Phase 4 — Fine-tuning

- **Unsloth docs** — [docs.unsloth.ai](https://docs.unsloth.ai/).
- **"LoRA"** (Hu et al., 2021) — [arXiv:2106.09685](https://arxiv.org/abs/2106.09685).
- **"QLoRA"** (Dettmers et al., 2023) — [arXiv:2305.14314](https://arxiv.org/abs/2305.14314).
- **HuggingFace PEFT** — [huggingface.co/docs/peft](https://huggingface.co/docs/peft).
- **Qwen 2.5 / Gemma 3 model cards** — [huggingface.co/Qwen](https://huggingface.co/Qwen), [huggingface.co/google](https://huggingface.co/google).

---

## Phase 5 — RLVR / GRPO

- **"DeepSeek-R1"** (DeepSeek, 2025) — [arXiv:2501.12948](https://arxiv.org/abs/2501.12948). The paper.
- **"DeepSeekMath"** (DeepSeek, 2024) — [arXiv:2402.03300](https://arxiv.org/abs/2402.03300). GRPO origin.
- **HuggingFace TRL** — [huggingface.co/docs/trl](https://huggingface.co/docs/trl). `GRPOTrainer`.
- **"Training Verifiers to Solve Math Word Problems"** (OpenAI, 2021) — [arXiv:2110.14168](https://arxiv.org/abs/2110.14168).

---

## Compute / infrastructure

- **Modal** — [modal.com](https://modal.com/). Serverless GPU. Primary cloud compute.
- **Lambda Labs** — [lambda.ai](https://lambda.ai/). Cheaper bare-metal.
- **Colab** — [colab.research.google.com](https://colab.research.google.com/). Free T4.
- **Weights & Biases** — [wandb.ai](https://wandb.ai/). Experiment tracking.
- **Vercel** — [vercel.com](https://vercel.com/). Free Next.js hosting.

---

## Meta-reading (VC/strategy context)

- **Anthropic interpretability research** — [transformer-circuits.pub](https://transformer-circuits.pub/).
- **Chinchilla paper** (Hoffmann et al., 2022) — [arXiv:2203.15556](https://arxiv.org/abs/2203.15556).
- **Scaling laws** (Kaplan et al., 2020) — [arXiv:2001.08361](https://arxiv.org/abs/2001.08361).
- **Latent Space podcast** — [latent.space](https://www.latent.space/).
- **Dwarkesh podcast** — [dwarkeshpatel.com](https://www.dwarkesh.com/).
