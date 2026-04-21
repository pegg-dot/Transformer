# Project State

> This file is the source of truth for where the project is. Every session should **read this first** and **update it last**.

**Last updated:** 2026-04-21 (Phase 2 finish-pass landed: perf audit, 10 MB compact activations, OG image, vercel.json. All prep pushed to main. Interactive `vercel login` + first deploy is the one remaining manual step.)
**Current phase:** Phase 2 — deploy-ready. Everything except the one-time Vercel auth is done. After deploy + smoke-test, Phase 2 flips to ✅.
**Next action:** Run the two commands at the bottom of the "Deploy handoff" section below. They open a browser for one-time Vercel auth, then publish. 5 minutes.

---

## Status board

| Phase | Status | Artifact | Notes |
|---|---|---|---|
| 0. Scaffold repo | ✅ Done | This repo | Docs + prompts in place |
| 1. nanoGPT from scratch | ✅ Done | `model/gpt.py`, `train.py`, `sample.py`, `checkpoints/gpt.pt` | 10.79M params; loss 4.28→1.88 in 500 iters on MPS |
| 1.5. Instrument for viz | ✅ Done | `model/capture_schema.py`, `hooks.py`, `capture.py`, `export_onnx.py`; `activations.json` (51 MB, T=66), `model.onnx` (42 MB) | Hooks attach externally; attn scores/weights recomputed from Q/K; ONNX matches PyTorch to <1e-5. 5000-iter retrain complete (train 1.05, val 1.50); artifacts regenerated against new checkpoint. |
| 2. Visualizer MVP | ⚠️ Deploy-ready | `viz/` (Next.js 16, Turbopack, TS strict, Tailwind v4); `viz/PERF_AUDIT.md`; `viz/vercel.json`; OG+Twitter image routes | Live ONNX gen + 7 replay panels + Beginner/Advanced toggle + Explain-this popovers + `/tour` all working. Build + typecheck clean. Compact activations (10.6 MB / 3.5 MB gz) ship alongside canonical (27 MB). OG + Twitter 1200×630 images with attention-heatmap background. vercel.json sets immutable cache on model/activations/ort. Pending only: one-time `vercel login` + deploy, then flip this to ✅. |
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
- **Phase 1.5 complete.** Capture schema (`capture_schema.py`) defines the Phase-2 API contract as TypedDicts. `hooks.py` attaches forward-hooks externally (no model edits) to every layernorm, head's Q/K/V linears, FFN internals, and block boundaries; attention scores/weights are recomputed from Q and K since they're intermediate tensors inside `Head.forward`. `capture.py` generates N tokens then does one hooked forward pass over the full sequence and writes `activations.json` per schema. `export_onnx.py` exports to opset 17 with dynamic batch+seq axes and verifies PyTorch vs ONNX within 1e-5 at T∈{1,8,32,128,256}. `scripts/verify_activations.py` round-trips the JSON and checks schema + shapes + causal mask + softmax-sums-to-1 + ReLU + residual-stream math. `scripts/onnx_smoke_test.py` generates Shakespeare-flavored gibberish via pure ONNX runtime (no PyTorch forward) — proves the Phase 2 browser bridge.
- **3D viz mode added to `docs/viz_vision.md`.** Orbit the model as a tower; residual stream as glowing ribbon; attention as 3D arcs between token columns; embedding point cloud. Rule: 3D when spatial structure is the point, 2D when the data is a matrix.

## What's in progress

Phase 2 finish-pass landed (M1–M5 infrastructure). `viz/PERF_AUDIT.md` has the full numbers. Summary:

- `activations.json` 27.8 MB → `activations.compact.json` 10.6 MB raw / 3.5 MB gz (4-decimal rounding, no schema change, ~5e-5 max divergence). `useActivations` prefers compact with fallback to canonical. Script: `scripts/compress_activations.py`.
- `model.onnx` stays at 42 MB — dynamic INT8 quant gave 26% size but 93.8% argmax agreement and 0.24 max `|Δlogits|`, so rejected per quality-over-size rule. Script: `scripts/quantize_onnx.py` kept for future retries. Long-lived immutable cache on the raw file handles first-load UX.
- `app/opengraph-image.tsx` + `app/twitter-image.tsx` — programmatic 1200×630 with attention-heatmap background + bold headline + pill signature. `app/layout.tsx` metadata includes full openGraph + twitter blocks, `metadataBase` reads `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL`.
- `viz/vercel.json` — immutable cache on `/model.onnx`, `/activations*.json`, `/ort/*`.
- `.gitignore` has explicit !-exceptions for `viz/public/model.onnx` and `viz/public/activations.json` so the Vercel build has them.
- All commits pushed to `origin/main`. Working tree clean.

**Not yet done**: run `vercel login` (interactive browser OAuth — one time), then `vercel --prod`. See the Deploy handoff below.

## Deploy handoff

Nate — to finish Phase 2, run these from your terminal (not in Claude Code, because `vercel login` needs to open a browser):

```bash
cd /Users/natepegg/Transformer/viz
npm i -g vercel   # or: brew install vercel-cli
vercel login      # one-time OAuth; follow the browser prompt
vercel --prod     # on first run it asks: scope, project name, root dir
                  #   - scope: your personal account is fine
                  #   - link to existing project? N
                  #   - project name: transformer-live (or any)
                  #   - in which directory is your code located? ./
                  #   - framework: Next.js (auto-detected)
                  #   - build/output: defaults
```

After it prints the production URL, do the verification in a fresh incognito window:

1. `/` loads, generator streams text, all 7 replay panels render
2. `/tour` loads, scroll advances through the narrative
3. DevTools Network: `activations.compact.json` transfers at ~3 MB (Brotli), `model.onnx` transfers at ~42 MB raw
4. Beginner/Advanced toggle still works and persists on reload
5. Explain-this popovers open on every panel
6. Paste the URL into Slack/iMessage — OG card shows the "Watch a transformer think" image

Then come back and flip Phase 2's row to ✅ in the status board above, drop the URL into the session log.

## Blockers

None (deploy is manual only because CLI OAuth is interactive).

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

### 2026-04-21 — Phase 2 finish-pass (perf + OG + deploy prep)
- **M1 — perf audit.** `viz/PERF_AUDIT.md` captured full baselines. `viz/public/` is 104 MB: `model.onnx` 42 MB + `activations.json` 27 MB + ORT WASM 36 MB + tiny assets. `npm run build` clean; first-load JS for `/` is ~1.5 MB raw / ~450 KB gz (well under the 1 MB hard constraint). Biggest chunk is three.js + r3f at 313 KB gz. Vercel auto-Brotlis `application/json` but not `application/octet-stream`, so model.onnx and the ORT WASM ship raw on the wire.
- **M2 — shrink activations.json.** `scripts/compress_activations.py` rounds every float to 4 decimal places (≈ float16 precision) and serializes with no whitespace. 27.8 MB → 10.6 MB raw, ~3.5 MB gzipped. Max per-value diff vs original: 5e-5. `viz/lib/useActivations.ts` now prefers `/activations.compact.json` and falls back to `/activations.json`. Canonical 27 MB file stays on disk.
- **M3 — ONNX INT8 quant rejected.** `scripts/quantize_onnx.py` + dynamic-INT8 quant would take model.onnx from 42 MB to 12 MB, but max `|Δlogits|` = 0.24 and argmax agreement only 93.8% on a 32-token test input — enough to visibly change generated text. Rejected per quality-over-size rule. Script kept in the repo. Raw model + long-lived immutable cache is the ship answer.
- **M4 — OG + Twitter image.** `app/opengraph-image.tsx` (and `app/twitter-image.tsx` re-exporting it) renders a 1200×630 PNG via `next/og`: "transformer.live" eyebrow in accent blue, "Watch a transformer think." headline, char-level GPT subhead, causal-mask-biased attention-heatmap grid visible in the right half, "by Nate" pill bottom-right. `app/layout.tsx` gets full openGraph + twitter metadata with `metadataBase` resolved from `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL`.
- **M5 prep — vercel.json + force-tracked deploy artifacts.** `viz/vercel.json` sets `Cache-Control: public, max-age=31536000, immutable` on `/model.onnx`, `/activations*.json`, `/ort/*`. `.gitignore` now has explicit !-exceptions for `viz/public/model.onnx` and `viz/public/activations.json` so the Vercel build has them. All commits (`a94edc3`, `0df77df`, `b05f650`, `e72953c`, `1917ff7`) pushed to `origin/main`.
- **Not done:** actual Vercel deploy — `vercel login` is interactive browser OAuth. Handoff commands are in the "Deploy handoff" section above. After Nate runs them and smoke-tests, flip Phase 2 to ✅ and drop the URL in this log.

### 2026-04-18 — Phase 2 MVP up (live ONNX + 6 replay panels + tour)
- Retrained Phase 1 for 5000 iters in background (71 min on MPS, train 1.05 / val 1.50). Output quality jumped from character-soup to real-English-word-soup. Backup of 500-iter checkpoint saved to `checkpoints/gpt_500iters.pt`. Regenerated `model.onnx` (verified <1e-5 vs PyTorch) and `activations.json` (51 MB, T=66) against the new checkpoint.
- Scaffolded `viz/` with Next.js 16 (App Router, Turbopack default, TS strict, Tailwind v4). Next 16 docs read from `node_modules/next/dist/docs/` before writing any code.
- Swapped `@huggingface/transformers` for `onnxruntime-web` — simpler for our custom char-level model, smaller bundle. WASM copied to `/public/ort/`, path set via `ort.env.wasm.wasmPaths`.
- `lib/`: `types.ts` (TS mirror of capture_schema.py), `tokenizer.ts` (loads `/vocab.json`, matches Python CharTokenizer), `ort.ts` (lazy session, forward pass, softmax, top-k filter, multinomial sample), `useTransformer.ts` (React hook that streams generation token-by-token), `useActivations.ts` (fetches activations.json), `color.ts` (attention single-hue blue scale + diverging red/blue for signed activations), `mode.tsx` (Beginner/Advanced context, localStorage-backed).
- `components/`: `Panel.tsx` (reusable chrome: title + tensor-shape badge visible in Advanced + Explain-this popover with three-section copy), `TokenStream.tsx` (Framer Motion per-char fade), `TokenizationView.tsx`, `EmbeddingView.tsx`, `AttentionHeatmap.tsx`, `LayerView.tsx` (attention head grid + FFN post-activation sample + residual stream before/middle/after), `KVCacheView.tsx` (K and V matrices with scrubbable step slider, newest-row flash), `DecodingView.tsx` (top-k logit bars with live temperature slider, sampled token highlighted red), `ModeToggle.tsx` (animated pill toggle via Framer Motion layoutId).
- `app/page.tsx`: live generator at top (streaming text, temperature, top-k, tokens/sec, stop button) + reveal of 7 panels below driven by `activations.json` replay. Beginner mode swaps technical copy for plain-English.
- `app/tour/page.tsx`: 5-step scrollable narrative at `/tour`. Sticky left panel updates as user scrolls via IntersectionObserver; steps are tokens → embed → early-layer attention → late-layer attention → decode. Linked from homepage.
- `next.config.ts`: turbopack root fix, webpack fallbacks for Node-only imports (ort tree-shake).
- `globals.css`: dark theme (#0a0a0b bg, #e7e7e7 fg), accent blue (#60a5fa), custom scrollbar, Geist + Geist Mono fonts.
- Verified: `npx tsc --noEmit` clean, `npm run build` clean (both / and /tour statically prerendered). Live dev server serves homepage at ~30ms, tour at ~250ms first hit.
- Deferred for next session: 3D embedding point cloud (r3f), preset gallery with multiple `activations.json` files, global speed multiplier slider, record/share button, OG image, Vercel deploy, attention-patterns auto-captions ("this head looks like a previous-token head").

### 2026-04-18 — Phase 1.5 complete (instrumentation + ONNX)
- Wrote `model/capture_schema.py` — TypedDicts for activations.json. Chose stacked `[H, T, T]` attention arrays over nested per-head dicts (viz-friendly; matches tensor ops).
- Wrote `model/hooks.py` — `ActivationCapturer` context manager attaches `register_forward_hook` / `register_forward_pre_hook` on every module of interest without modifying `gpt.py`. Captures token/pos embeddings, per-head Q/K/V (via linear-layer hooks), attn output, FFN pre/post-act and out, block I/O. Attention scores and softmax weights are recomputed from Q,K because they're intermediate tensors inside `Head.forward` — no hook can see them.
- Smoke-tested hooks in-session: all shapes correct, attention weights per head sum to 1 exactly, `resid_mid == block_in + attn_out` with zero error.
- Wrote `model/capture.py` — generates N tokens, then does one hooked forward pass over the full sequence, recomputes attention, assembles the schema dict, writes `activations.json`. 27 MB at T=36.
- Wrote `scripts/verify_activations.py` — strict round-trip validator. Checks schema_version, all shapes, embed_sum = token_emb + pos_emb, softmax rows = 1, causal mask (no leak above diagonal), ReLU invariant, `resid_mid = block_in + attn_out`, `resid_out = resid_mid + ffn_out`. All pass.
- Wrote `model/export_onnx.py` — wrapped model to return logits-only, exported at opset 17 with dynamic batch+seq axes. Verified ONNX matches PyTorch to <1e-5 across T ∈ {1, 8, 32, 128, 256}. Installed `onnx` + `onnxruntime` into `.venv`.
- Wrote `scripts/onnx_smoke_test.py` — pure ONNX-runtime sampling loop in Python (no torch.forward anywhere). Produces Shakespeare-flavored gibberish. This proves the Phase 2 browser bridge works.
- Added 3D mode section to `docs/viz_vision.md` per user ask: orbit the model tower, residual ribbon, attention arcs in 3D, embedding point cloud. Rule: 3D when spatial, 2D for matrices.
- Security hook false-positive around PyTorch's inference-mode call (read as Python `eval`) — worked around by using `model.train(False)` which is the equivalent.

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
