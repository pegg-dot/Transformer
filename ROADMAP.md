# Roadmap

Phase-by-phase plan. Each phase has a concrete success criterion — something you can demo, not just check off.

Two tracks run in parallel from Phase 1.5 onward: **Model** (what we build and train) and **Viz** (what you can see and share). The whole point is that they compound.

---

## Phase 1 — Build nanoGPT from scratch

**Goal:** A working GPT-style transformer in a single `model/gpt.py`, training on tinyshakespeare, generating Shakespeare-flavored text.

**Protocol:** Claude writes the SCAFFOLD (tokenizer, dataloader, training loop, generation utility). You HAND-TYPE the MODEL (embeddings, attention, multi-head, FFN, block, GPT class). Even if every line is copied from what Claude shows you, typing it yourself is the learning.

**Milestones:**
1. [SCAFFOLD] Environment + data (tinyshakespeare, char-level tokenizer, batcher)
2. [MODEL — you type] Embeddings (token + positional)
3. [MODEL — you type] Single-head self-attention — bedrock
4. [MODEL — you type] Multi-head attention
5. [MODEL — you type] FFN
6. [MODEL — you type] Transformer block
7. [MODEL — you type] Full GPT
8. [SCAFFOLD] Training loop (AdamW, cross-entropy)
9. [SCAFFOLD] Generation (temperature + top-k sampling)
10. [SCAFFOLD] Run it — train, generate, ship

**Success criterion:** Model trains, generates legible Shakespeare-style text. You can whiteboard every piece cold.

**Prompt:** `prompts/phase-1-model.md`

---

## Phase 1.5 — Instrument for visualization

**Goal:** Capture every intermediate value the visualizer will need, export to ONNX.

**Milestones:**
1. PyTorch forward hooks capture: tokens, embeddings, Q/K/V per layer per head, attention weights, attention output, FFN activations, logits
2. Serialize a full forward pass into `activations.json`
3. Export trained model to ONNX for in-browser inference
4. Sanity-check: load and inspect both artifacts

**Success criterion:** `capture.py` runs on a prompt, emits `activations.json` + `model.onnx`. Both load cleanly.

**Prompt:** `prompts/phase-1.5-instrumentation.md`

---

## Phase 2 — Build the visualizer MVP

**Goal:** A Next.js web app that loads your ONNX model, generates text from a user-typed prompt, and visualizes tokenization, embeddings, attention, KV cache, and decoding live.

**Milestones:**
1. Next.js 15 scaffold + Tailwind + TypeScript
2. Load ONNX via transformers.js → prompt → generation (no viz yet, just text)
3. Tokenization view (animated split, IDs visible)
4. Embedding view (colored bars or PCA 3D scatter)
5. Attention heatmap grid — per head, per layer, hoverable
6. KV cache fill visualization
7. Decoding view (logits → softmax → sampling)
8. Controls (temperature, top-k, top-p, step mode, head highlighter)
9. Polish (dark mode, responsive, loading states, OG tags)
10. Deploy to Vercel

**Success criterion:** A public URL. A stranger types a prompt, watches the model think, learns something. DM-able to a VC.

**Prompt:** `prompts/phase-2-visualizer.md`

---

## Phase 3 — Modernize to Llama 3 architecture

**Goal:** Upgrade the model to 2024-era architecture, visualize the differences.

**Model milestones:**
1. Learned positional → RoPE
2. ReLU/GELU FFN → SwiGLU
3. LayerNorm → RMSNorm
4. Multi-head attention → GQA
5. Real KV cache (reused across generation steps)
6. Retrain, compare loss curves

**Viz milestones:**
1. A/B toggle: classic GPT vs Llama 3
2. RoPE-specific visualization (rotation in embedding space)
3. KV cache upgrade showing reuse across steps

**Success criterion:** Side-by-side architecture comparison in the live viz.

---

## Phase 4 — Fine-tune a real small model

**Goal:** Fine-tune Qwen 2.5 1.5B (or Gemma 3 1B) with LoRA on a niche domain via Unsloth.

**Milestones:**
1. Pick a niche domain
2. Build/source dataset (can be synthetic, generated with Claude)
3. Fine-tune on Modal H100 via Unsloth + LoRA
4. Evaluate vs base
5. Export to ONNX, plug into visualizer

**Success criterion:** Dropdown in the viz: "NanoGPT / Llama3-mini / MyFineTune". Fine-tune demonstrably beats base model on domain prompts.

---

## Phase 5 — RLVR with GRPO (DeepSeek R1 style)

**Goal:** Apply GRPO reinforcement learning with a verifiable reward. Watch it develop reasoning.

**Milestones:**
1. Read DeepSeek R1 + DeepSeekMath papers (Claude summarizes)
2. Pick verifiable-reward domain (math, code, structured extraction)
3. Set up HF TRL's `GRPOTrainer` on fine-tuned model
4. Train on Modal, track with W&B
5. Visualize reasoning traces pre/post GRPO

**Success criterion:** A reasoning checkpoint that visibly thinks longer on hard prompts. Viz shows thinking tokens as thought bubble.

---

## Phase 6 — Ship publicly + write it up

**Goal:** Go public. Turn the repo into a distribution event.

**Milestones:**
1. Polish docs/README for external readers
2. Record 60-second demo video
3. Write technical blog post
4. Post to X, HN, r/MachineLearning
5. DM to 10 VCs + 10 researchers

**Success criterion:** Inbound. Conversations. Portfolio artifact that compounds.

---

## Pace

Aggressive ballpark, AI-paired:

- Phase 1: one long weekend
- Phase 1.5: half a weekend
- Phase 2: two weekends
- Phase 3: one weekend
- Phase 4: one to two weekends (bottleneck: compute)
- Phase 5: one to two weekends
- Phase 6: one weekend

Total: ~6–8 weekends end-to-end if focused.

`PROJECT_STATE.md` is the source of truth for current state — update it every session.
