# Project State

> This file is the source of truth for where the project is. Every session should **read this first** and **update it last**.

**Last updated:** 2026-04-16 (repo relocated to user's real Transformer folder)
**Current phase:** Phase 0 — Scaffolding complete, Phase 1 next
**Next action:** Install PyTorch (`pip install torch`), then paste `prompts/phase-1-model.md` into Claude to begin Milestone 1 (scaffold environment + data). Remember: Claude scaffolds, you hand-type the model.

---

## Status board

| Phase | Status | Artifact | Notes |
|---|---|---|---|
| 0. Scaffold repo | ✅ Done | This repo | Docs + prompts in place |
| 1. nanoGPT from scratch | ⏳ Not started | `model/` | Up next |
| 1.5. Instrument for viz | ⏳ Not started | `model/capture.py`, `activations.json`, `model.onnx` | |
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

## What's in progress

Nothing yet. Phase 1 kicks off next session.

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
