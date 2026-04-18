# Project State

> This file is the source of truth for where the project is. Every session should **read this first** and **update it last**.

**Last updated:** 2026-04-18 (Phase 1 complete — trained GPT producing Shakespeare-flavored gibberish)
**Current phase:** Phase 1 — Done. Phase 1.5 (instrument model with forward hooks for live viz) is next.
**Next action:** Optional — re-train for 5000 iters (overnight, ~2 hrs on MPS) to get real-word-quality output; checkpoint currently at 500 iters. Then paste `prompts/phase-1_5-instrumentation.md` into Claude to begin Phase 1.5.

---

## Status board

| Phase | Status | Artifact | Notes |
|---|---|---|---|
| 0. Scaffold repo | ✅ Done | This repo | Docs + prompts in place |
| 1. nanoGPT from scratch | ✅ Done | `model/gpt.py`, `train.py`, `sample.py`, `checkpoints/gpt.pt` | 10.79M params; loss 4.28→1.88 in 500 iters on MPS |
| 1.5. Instrument for viz | ⏳ Not started | `model/capture.py`, `activations.json`, `model.onnx` | Up next |
| 2. Visualizer MVP | ⏳ Not started | `viz/` (Next.js) | |
| 3. Modernize to Llama 3 | ⏳ Not started | Updated model + A/B toggle in viz | |
| 4. Fine-tune (LoRA/Unsloth) | ⏳ Not started | Fine-tuned checkpoint | |
| 5. RLVR with GRPO | ⏳ Not started | Reasoning checkpoint | |
| 6. Public demo + writeup | ⏳ Not started | Public URL + blog post | |

---

## What's done

- Repository scaffolded with docs, prompts, and empty `model/` + `viz/` dirs.
- Roadmap written (`ROADMAP.md`).
- Phase 1, 1.5, 2 prompts ready to paste into Claude.
- Glossary + resources + architecture docs in `docs/`.
- Key decision (Wes's advice): hand-type the model, Claude scaffolds the rest.
- **Phase 1 complete.** Full GPT from scratch in raw PyTorch: TokenEmbedding, PositionalEmbedding, Head, MultiHeadAttention, FeedForward, Block, GPTLanguageModel. Hand-typed by Nate. Trained 500 iters on tinyshakespeare, loss 4.28→1.88. Output has Shakespeare structure (character names, line breaks, vowel/consonant rhythm) with invented words — expected at 500 iters.
- **Prep for Phases 2+ done.** `docs/viz_vision.md` captures the pedagogical-UX aesthetic vision (narrative mode, Beginner/Advanced toggle, Explain-this popovers, preset gallery, speed slider, record/share). `prompts/phase-2-visualizer.md` now explicitly requires those as milestones 10 and 11. `prompts/phase-3-llama3.md` written (was missing). `ROADMAP.md` pacing tightened to "2–4 weeks end-to-end if focused daily."

## What's in progress

Nothing. Phase 1 shipped. Decide whether to train longer first (for real words at ~5000 iters) or move directly into Phase 1.5 instrumentation.

## Blockers

None.

## Key decisions made so far

- **Raw PyTorch, not HuggingFace, for Phase 1–3.** Goal is deep understanding, not convenience.
- **In-browser inference for the visualizer.** Using transformers.js + ONNX. No backend server = free hosting, infinite scale, shareable URL.
- **Socratic build loop.** Every phase prompt enforces a build→explain→probe cycle so the learning actually sticks.
- **Dual-track from Phase 1.5 onward.** Model and viz evolve together.
- **Hand-type the model; AI writes the scaffold.** (Wes's advice.) For Phase 1: Claude writes tokenizer/dataloader/training loop/generation utility. You hand-type the model architecture (embeddings, attention, multi-head, FFN, block, GPT class) — even if every line is copied from Claude's output in chat. Active typing locks in understanding; passive reading doesn't. Claude reads the file after you type to verify, then probes.

## Open questions

- Which niche domain for Phase 4 fine-tuning? (Punt until Phase 3 done.)
- Which verifiable-reward task for Phase 5 RLVR? (Punt until Phase 4 done.)

---

## Session log

Append most recent at top.

### 2026-04-17/18 — Phase 1 complete
- Hand-typed all 6 model modules (TokenEmbedding, PositionalEmbedding, Head, MultiHeadAttention, FeedForward, Block). Final GPTLanguageModel class also hand-typed but wiring fixes were done by Claude after frustration limit was reached.
- Socratic probes done on every milestone. Strongest grasp: multi-head specialization (different heads learn different patterns at same param cost as one big head), and residuals (blocks add to x instead of overwriting so gradients flow and info accumulates).
- Weakest grasp (flagged for re-visit in Phase 1.5 when we can literally visualize these): √d_k scaling math (saturated softmax → vanishing gradients), and temperature direction (had it inverted, corrected with live samples).
- Scaffold: Claude wrote `train.py` + `sample.py`. AdamW, cross-entropy, 500-iter smoke run on MPS took ~14 min. Loss 4.28→1.88. Output is Shakespeare-flavored gibberish as expected.
- Checkpoint saved to `checkpoints/gpt.pt`. Can sample from it with `python -m model.sample --prompt "ROMEO:" --tokens 500`.

### 2026-04-16 — Scaffold + Phase 1 protocol + relocate
- Wrote README, ROADMAP, glossary, architecture, resources
- Wrote phase prompts for 1, 1.5, 2
- Adopted hand-type-the-model split (Wes's advice) in the Phase 1 prompt
- Relocated repo from Claude's outputs folder to user's real Transformer folder
- Ready to start Phase 1 — next: install PyTorch, paste Phase 1 prompt

---

## How to update this file

At end of every working session, update:
1. **Last updated** date
2. **Current phase** and **Next action**
3. **Status board** — flip phase statuses, add artifacts as they ship
4. **What's done / in progress / blockers**
5. **Session log** — one new entry at the top with what you built, what you learned, what's next

If a decision changed course, note it under "Key decisions" and explain why.

Keep this file tight. Prune completed detail once captured in ROADMAP.md or code.
