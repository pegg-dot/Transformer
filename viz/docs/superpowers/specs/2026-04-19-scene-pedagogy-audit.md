# Scene Pedagogy Audit

**Date:** 2026-04-19
**Scope:** Every scene (2D SVG stage + 3D sidebar + caption + details) audited for mechanical accuracy, 2D↔3D alignment, pedagogical clarity, and scene-to-scene thread continuity.

---

## Evaluation framework

Four dimensions per scene:

1. **Mechanical accuracy** — is the visualization actually how transformers work?
2. **2D ↔ 3D alignment** — at the same moment in time, are the stage and sidebar telling the same story?
3. **Pedagogical clarity** — what would confuse a smart first-time viewer?
4. **Thread continuity** — does the output of scene N carry visibly into scene N+1?

---

## Cross-cutting issues (apply to multiple scenes)

### CC-1: Perpetual loops misrepresent inference
Scenes that loop animations (embed, qkv, ffn, gelu, sample) imply iterative or continuous computation. In reality each runs **once per token per forward pass**. Fix: single-pass animation → hold at final state. Only scenes that legitimately iterate (training, gd-ravine, gd-adam, kvcache) should loop.

### CC-2: Causal mask is never labeled
The upper triangle of the QK grid is dim/empty in attn and kvcache. Viewers don't know why. Fix: explicit "causal mask: can't attend to future tokens" label on both 2D and 3D, ideally with a red triangular overlay.

### CC-3: 2D and 3D sub-phase timings drift
2D SceneAttention uses 4 sub-phases × 10s = 40s while 3D SceneAttn uses `p = t/duration` over 43s. At t=10s the 2D just finished phase 1 but the 3D is only ~25% through the establishing shot. Fix: align sub-phase boundaries in both views.

### CC-4: Captions over-promise when internals are simplified
FFN features ("Golden Gate tokens"), multi-head patterns ("prev-token anchor"), Jacobian examples — these are hardcoded illustrations, not learned behaviors. Current captions imply they're universal. Fix: add "illustrative — real models learn unnamed features" disclaimers.

### CC-5: No continuous thread between scenes
Each scene uses its own fake data, seeded differently. A viewer can't trace one token's vector from `tokens` through `embed` through `attention` → it's a different vector each scene. Fix (long-term): use a single deterministic "example token" (e.g. position 3 from "To be, or no") as the demonstration thread across scenes.

---

## Per-scene audit

### 1 · tokens (21s)

**Shows (2D):** Characters fall as pills, violet IDs stamp below. Clean single-pass, holds at end.
**Shows (3D):** Char cubes drop into the top shelf, violet IDs print on the bottom face. Matches 2D.
**Accuracy:** OK. For the char-level Shakespeare model this is literally how tokenization works.
**Clarity:** Good. The italic "To be, or no" at the top establishes the input.
**Thread out:** The ID integers should flow into `embed` — currently they don't visibly.
**Fixes:** Add a tiny "→ 384-dim vector (next)" hint in the last 2s.

### 2 · bpe (35s)

**Shows (2D):** Three phases over 3×10.67s showing byte vocab → single merge → merge-tree applied to "unbelievably".
**Shows (3D):** Same shelf, byte cubes merge into bigrams then trigrams over 3 phases.
**Accuracy:** 2D somewhat misleading — shows one merge pass producing multiple new tokens at once. Real BPE is iterative. 3D is directionally right.
**Clarity:** Viewer doesn't see that each BPE "merge" is a separate pair-count-merge cycle repeated thousands of times.
**Alignment:** 2D is 3 phases × 10.67s, 3D is 3 phases × 11.67s. Close but drifting.
**Fixes:** Add "pass N of many" counter. Align 3D to 10.67s-phase boundaries exactly.

### 3 · embed (21s)

**Shows (2D):** 16×24 matrix, cursor loops through rows, selected row flies right to a display. Loops forever.
**Shows (3D):** V×d wall, ID cube drops in, row highlights, vector flies out. Loops every 2.5s.
**Accuracy:** Lookup is O(1) — right. Loop wrongly implies the model keeps retrying.
**Clarity:** CC-1. Viewer thinks embeddings are dynamic.
**Fixes:** Run through the prompt's chars once (T cycles), then hold on the last vector extruded. Reinforces thread from `tokens`.

### 4 · positional (19s)

**Shows (2D):** Sinusoidal waves + PE matrix + token row + "+" → summed matrix.
**Shows (3D):** Two grids (tokens, sin/cos) collapse together into a merged grid.
**Accuracy:** Formula is correct. Waves are continuous; values are sampled at integer positions.
**Clarity:** Viewer may think the wave IS the encoding (it's not — the samples are).
**Fixes:** Add dots at integer positions along each wave. Label "added, not concatenated".
**Alignment:** Both show addition. OK.

### 5 · layernorm (21s)

**Shows (2D):** Four phases showing raw → center → normalize → scale/shift.
**Shows (3D):** Bars unevenly heighted, mean line drops, variance contracts, γ/β cubes fall.
**Accuracy:** Math is right. Both forget to mention "γ=1, β=0 at init; learned during training".
**Clarity:** Doesn't explain WHEN (before attention AND before FFN, "pre-norm" in modern GPTs).
**Alignment:** Timing fits.
**Fixes:** Add "runs before every sublayer (pre-norm)" annotation in both.

### 6 · qkv (18s)

**Shows (2D):** Input vector → three "prisms" (W_q, W_k, W_v) → three output vectors with poetic labels. Particles loop forever.
**Shows (3D):** Input bar → three projection walls → three colored output bars (Q/K/V). Single pass.
**Accuracy:** OK. Q, K, V are just linear projections — anthropomorphizing "what am I asking?" is fine for intuition but can mislead.
**Clarity:** CC-1 for 2D. 3D is clean.
**Fixes:** Stop 2D looping — single pass then hold. Add note "Q/K/V are just learned projections of x; their 'roles' emerge in the attention dot-product next".

### 7 · attn (43s) — **HIGHEST PRIORITY**

**Shows (2D):** 4 sub-phases × 10s: one-query zoom → full T×T matrix fills → softmax → weighted sum. Causal mask visible but unlabeled.
**Shows (3D):** 4 phases via `p = t/duration`: establish → scores → softmax → aggregate. V slides in from below.
**Accuracy:** Math is right. Causal mask is drawn but never explained (CC-2).
**Clarity:** THE BIGGEST ISSUE IN THE TOUR. Viewers see half the grid dark without knowing why. "Upper triangle = can't see future" is the single most important thing to add.
**Alignment:** 2D has discrete sub-phase transitions every 10s; 3D has smooth continuous easing. They don't feel synced.
**Fixes:** 
- Explicit "CAUSAL MASK" label with red triangular overlay in both
- Sync 3D to same 4-phase-boundary structure as 2D (hard phase transitions at 25/50/75% of duration)
- Add a small "position i can see tokens 0..i" sweep during the causal-mask explanation

### 8 · multi (21s)

**Shows (2D):** 6 heads in a grid, each with a hardcoded pattern ("prev-token", "start-anchor"...).
**Shows (3D):** 6 head grids at different z-depths; concat + W_O projection.
**Accuracy:** Patterns are illustrative, not learned (CC-4).
**Clarity:** Viewer may think heads have fixed roles.
**Alignment:** Both show 6 heads in parallel. OK.
**Fixes:** "Illustrative patterns — real heads learn unnamed behaviors during training".

### 9 · ffn (19s)

**Shows (2D):** 5 phases × 3.2s: input → expand 4× → ReLU → compress → output. Loops.
**Shows (3D):** Fan-out wall → wide hidden with dense mesh → GELU glyph → fan-in wall.
**Accuracy:** Both show FFN correctly. 2D says "ReLU" but the GELU scene (#11) says modern uses GELU — inconsistency.
**Clarity:** CC-1 looping in 2D. 3D is single pass — good.
**Alignment:** Both show expand→nonlinearity→compress but the 2D emphasizes ReLU while the 3D emphasizes GELU. Pick one, call it out.
**Fixes:** Use GELU in both (matches modern GPTs and scene #11). Stop 2D loop.

### 10 · ffn-feature (21s)

**Shows (2D):** 6 tokens × 6 named neurons with activation connections cycling.
**Shows (3D):** Neurons as dots in 3D; different neuron subsets fire for different example-types.
**Accuracy:** Illustrative (CC-4). Real features are entangled.
**Clarity:** Feature names ("Golden Gate", "French words") are great intuition pumps but overclaim.
**Alignment:** 2D cycles neuron-focus every 1.7s; 3D cycles example every duration/3. Not matched.
**Fixes:** Add "illustrative labels — real neurons are less interpretable". Sync cycling period.

### 11 · gelu (19s)

**Shows (2D):** Three curves with a pulsing dot on GELU. Loops.
**Shows (3D):** Three curves side-by-side, test-point cloud flowing through.
**Accuracy:** Correct curves.
**Clarity:** CC-1 looping in 2D. 3D loops test-point flow too.
**Alignment:** Both show three curves. OK.
**Fixes:** Both can single-sweep then hold. Add "modern models: GELU (GPT), Swish/SwiGLU (LLaMA)".

### 12 · stack (23s)

**Shows (2D):** 6 blocks + residual stream, particles flow through and change color.
**Shows (3D):** 6 blocks with a traveling gold packet.
**Accuracy:** Misleading (2D). "Residual stream" ≠ a pipe carrying particles — it's a vector that each block READS from and ADDS BACK to. The color-change visual suggests transformation-in-place.
**Clarity:** The residual is THE structural insight of the transformer and this scene almost obscures it.
**Alignment:** Both show 6 blocks. Mechanism is different.
**Fixes:** Show explicit "block reads x, computes f(x), writes x + f(x)" at least once. Call out residual stream as the backbone.

### 13 · sample (27s)

**Shows (2D):** Temperature slider, bar chart, auto-sweep, die-roll box.
**Shows (3D):** Unembed wall → logit column → softmax normalizes → top bar lights gold.
**Accuracy:** Correct softmax + temperature.
**Clarity:** CC-1 — the auto-sweep is perpetual. Also "die roll" anthropomorphizes sampling.
**Alignment:** 2D is interactive, 3D is not. OK since 2D is the "play" surface.
**Fixes:** Let 2D rest when untouched (auto-sweep 1-2 cycles then stop). Add caption "T=0: greedy. T=1: nominal. T>1: creative/incoherent."

### 14 · kvcache (25s)

**Shows (2D):** Step-by-step cache growth, one row added per step.
**Shows (3D):** Q cell (single) + K, V archives growing per step. "Q: recomputed / K,V: stored once".
**Accuracy:** Correct — both show one new (K, V) row per step, Q recomputed.
**Clarity:** Good. This is one of the cleanest scenes.
**Alignment:** Both tick through steps. OK.
**Thread:** Connects well to attn (same grid structure).
**Fixes:** Minor — add "this is why context length costs memory" annotation.

### 15 · loss (19s)

**Shows (2D):** Three scenarios cycling (confident-right, uncertain, confident-wrong).
**Shows (3D):** Prediction histogram vs. target histogram + CE scalar.
**Accuracy:** Formula is right. 2D doesn't explain WHY −log(p) (gradient magnitude).
**Clarity:** Color-coded urgency is great. Missing: why this loss not squared error.
**Alignment:** 2D cycles 3 scenarios over 19s; 3D shows one scenario. Different mental models.
**Fixes:** Add "−log(p) heavily penalizes confident wrong answers → large gradient to fix them".

### 16 · loss-seq (21s)

**Shows (2D):** T positions each with their own loss, bars running-average.
**Shows (3D):** Row of T pred/target pairs with loss bars summing on the right.
**Accuracy:** Both correct. 2D visibly processes sequentially though parallelism is key.
**Clarity:** Should say "in practice all positions run in parallel".
**Alignment:** Good.
**Fixes:** Add parallelism note.

### 17 · loss-batch (19s)

**Shows (2D):** Stack of 6 "seq N" cards, batch mean.
**Shows (3D):** B×T cube collapses to mean scalar.
**Accuracy:** Correct.
**Clarity:** Both work. 3D more visually striking.
**Alignment:** Both averaging. OK.
**Fixes:** None critical.

### 18 · backprop (21s)

**Shows (2D):** 8 layers, blue forward particles then red backward particles.
**Shows (3D):** Reverse-traveling red packet through 6 blocks.
**Accuracy:** Correct direction. 2D doesn't show what gets computed at each layer.
**Clarity:** "Memory: activations" annotation is good. Missing: WHY you need to store activations (local Jacobian depends on them).
**Alignment:** 2D has 8 layers, 3D has 6. Should match.
**Fixes:** Make layer counts consistent (6). Add "activations kept forward so local Jacobian can multiply backward".

### 19 · bp-jacobian (21s)

**Shows (2D):** Jacobian matrix cells fill to illustrate ∂y/∂x.
**Shows (3D):** Jacobian matrix sweeps row-by-row; gradient-in / gradient-out columns flank it.
**Accuracy:** Formulas correct (sigmoid example).
**Clarity:** Jacobian is the hardest concept in the tour and the scene doesn't ground it in the chain rule.
**Alignment:** Similar structure. OK.
**Fixes:** Add one explicit "chain rule: ∂L/∂x = ∂L/∂y · ∂y/∂x" line with the Jacobian in the middle. Show one cell lighting up and say "this is ∂y[0]/∂x[1]".

### 20 · bp-accum (20s)

**Shows (2D):** Per-example gradient matrices accumulate into average.
**Shows (3D):** B parallel gradient threads converge at a (1/B)Σ node.
**Accuracy:** Correct.
**Clarity:** Good mechanism, less good on WHY (variance reduction).
**Alignment:** Good.
**Fixes:** Add "averaging reduces noise — one noisy example doesn't dominate the update".

### 21 · training (19s)

**Shows (2D):** 2D loss surface, ball descends, loss-chart on right.
**Shows (3D):** 3D loss landscape mesh, ball rolls.
**Accuracy:** Correct toy problem. 2D says "real models: millions of dims" — good but buried.
**Clarity:** Good foundation; next two scenes build on this.
**Alignment:** Both descent. Different geometries.
**Fixes:** Minor — emphasize "this is 2 params; real models have billions".

### 22 · gd-ravine (27s)

**Shows (2D):** Elongated contour, ball zigzags, interactive learning rate slider.
**Shows (3D):** Narrow ravine mesh, ball zigzags.
**Accuracy:** Correct demonstration of curvature mismatch.
**Clarity:** Excellent thanks to interactive slider.
**Alignment:** Good.
**Fixes:** None critical.

### 23 · gd-adam (23s)

**Shows (2D):** Same ravine, Adam path vs. vanilla GD path.
**Shows (3D):** Same ravine, smooth Adam trajectory.
**Accuracy:** Correct.
**Clarity:** Good comparison. Formula at bottom of 2D is dense.
**Alignment:** Good.
**Fixes:** Simplify the 2D formula caption: "Adam = per-parameter learning rate based on recent gradient magnitude".

### 24 · rope (21s)

**Shows (2D):** Classic additive PE (left) vs. 2D rotation (right).
**Shows (3D):** Q and K arrows rotating with position; relative angle displayed.
**Accuracy:** Correct. Rotation is in 2D subspaces of the full vector; scene shows one pair.
**Clarity:** Good contrast with additive PE. Missing: extrapolation-to-longer-sequences benefit.
**Alignment:** Good.
**Fixes:** Add "relative position emerges from Q·K; RoPE extrapolates better than additive PE".

### 25 · modern (27s)

**Shows (2D):** Three-panel rotation: LN/RMSNorm, GELU/SwiGLU, MHA/GQA.
**Shows (3D):** Three side-by-side cards.
**Accuracy:** Correct.
**Clarity:** Descriptive but viewers may not grasp WHY each change was adopted.
**Alignment:** 2D rotates panels; 3D shows all three. Pick same structure.
**Fixes:** Add one-line "WHY" per card: faster (RMSNorm), more expressive (SwiGLU), lower KV memory (GQA).

### 26 · output (31s)

**Shows (2D):** Pipeline indicator, prompt in quotes, typewriter continuation.
**Shows (3D):** Full stack pulled back, generated text types at bottom.
**Accuracy:** Correct finale.
**Clarity:** Strong closer.
**Alignment:** Both show the same typewriter. OK.
**Fixes:** None.

---

## Priority queue for fixes

### P0 — highest impact (implement now)

1. **Causal mask label in attn scene (CC-2)** — biggest viewer confusion point. Add explicit "CAUSAL MASK: future tokens invisible" label + red triangular overlay in both 2D and 3D.
2. **Stop perpetual loops (CC-1)** — embed, qkv, ffn, gelu, sample 2D scenes should single-pass then hold.
3. **Sync attn sub-phases (CC-3)** — 3D should use hard 25/50/75% phase boundaries to match 2D's discrete sub-phase cycling.

### P1 — significant improvements (implement next)

4. Residual-stream mechanics clarified in `stack` (scene 12)
5. Illustrative-feature disclaimers on multi and ffn-feature (CC-4)
6. Jacobian grounded in chain rule (scene 19)
7. "Why −log(p)" explanation on loss (scene 15)
8. "Why we average" explanation on bp-accum (scene 20)

### P2 — polish (later)

9. Thread continuity (CC-5) — single deterministic example token traced across scenes
10. Minor WHY additions (rope extrapolation, modern upgrades rationale)
11. Scene 18 backprop layer count alignment (8 → 6)
12. ffn activation consistency (GELU everywhere, not ReLU)

---

## Implementation plan

This session: **P0 fixes** (3 items, ~60 min).
Next session: **P1 fixes** (5 items).
Later: P2 polish.

Each fix gets:
- Change to relevant scene file (2D in `scenes.tsx`, 3D in `modelmap/sceneX_Y.tsx`)
- Type-check + browser verify
- Commit per fix
