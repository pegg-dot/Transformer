# Tour Redesign Plan — "3Blue1Brown-style Spatial Recursion"

## 0. The problem in one sentence

The current tour shows *what* is happening (attention, FFN, etc.) but never makes the viewer feel *where* in the model it's happening. 3B1B's signal move is to keep the **whole transformer visible at all times** and use the **camera** as the narrative voice — pulling back to remind you of the macro, then dollying in to show one piece in detail. Everything else (vector grids, labels, arrows) is in service of that camera.

Our viz today does the opposite: each scene is a 2D panel on the left with a small, decorative 3D pane on the right. The two never connect spatially. There's no "you are here." There's no zoom. There's no answer to "where in the transformer is this happening?"

## 1. What 3B1B actually does (decoded from the reference images)

Looking at images 25–32 the visual grammar is consistent and small:

**A. The persistent stage.** A 3D row of semi-transparent glass blocks: input tokens at the top, then *Attention → MLP → Attention → MLP …* alternating. Always visible. Labels float in 3D space above each block. A "Many repetitions" brace marks the stack. (Images 25, 29, 30.)

**B. Recursive zoom.** Camera dollies forward into the active block. The other blocks don't disappear — they fade and recede. The block being examined fills the screen. Inside it, you see attention heads / MLP linear layers / vector grids. Same pattern again — focus one piece, others remain dim. (Images 27, 28, 32.)

**C. Vectors are the protagonist.** Tokens are visualized as actual vectors of numbers (small grids of values). When the model "thinks," you see vectors flow from one block to the next, getting transformed. Color-coded — red/blue cells for high/low activation, gold for the active "stream." (Images 26, 28, 29, 32.)

**D. Verbal labels in 3D space, not on a separate pane.** "Attention", "Multilayer Perceptron", "Many repetitions", "MLP" — these float **inside** the scene, attached to what they label. (All images.)

**E. Comparison via callout, not split-screen.** When 3B1B wants to explain MLP, the MLP block enlarges, a sub-diagram (Linear → ReLU → Linear) appears *inside or anchored to* the block. There is no "left half is 2D, right half is 3D." It's all one space. (Images 27, 31.)

**F. Concrete examples drive abstraction.** The Queen vector with "Is it English? / Is it a noun? / Does it refer to a person?" — abstract math is grounded in a specific concrete prompt. (Image 32.)

## 2. What the current viz is missing, mapped to A–F

| 3B1B grammar | Our current state | Gap |
|---|---|---|
| **A.** Persistent stage | 3D pane is a 40%-width sidebar | Stage is not the primary view; viewer never feels "inside" the model |
| **B.** Recursive zoom | Camera moves exist (`CameraController`) but each scene's focus is independent — no nested zoom-in / zoom-out | No sense of going deeper |
| **C.** Vector protagonist | We have `NumericColumn` and `Slab` primitives but they're decorative, not the focus | Numbers don't *flow* through the architecture |
| **D.** Labels in 3D | Some 3D labels exist (`Label` component) but most narration is in the 2D pane | Labels aren't tied to spatial positions |
| **E.** Unified space | Hard split: 2D left, 3D right | The two halves don't talk |
| **F.** Concrete drives abstraction | Some scenes use the live prompt, most don't | Abstraction floats free |

## 3. The new architecture

### 3.1 Two-mode stage, not split panes

Drop the fixed left/right split. Replace with a **single full-bleed 3D stage** that has two display modes per scene:

- **Macro mode** — camera pulled back, full transformer visible, labels float in 3D, no overlay panels.
- **Inspect mode** — camera dollied into a specific part. The 2D detail (matrices, formulas, vector breakdowns) is rendered as a **floating glass panel** anchored in 3D space next to the part being examined. Like a callout, not a sidebar.

The existing 2D scene components don't disappear — they get *rehosted* as floating panels. We keep the React-rendered detail (matrices, sliders, prompts) and place it in 3D using `<Html>` from `@react-three/drei`. The user sees "this block of vectors → this matrix multiplication" all in one space.

**Tradeoff:** loses the clean readability of a full-page 2D diagram. Mitigation: when the panel is anchored close to camera and large, it reads almost identically to today's 2D pane.

### 3.2 Persistent context: "where am I"

Three layers of context that stay visible at all times:

1. **The model silhouette** — the full stack of blocks, dimmed when something specific is active. Like image 30: even when you're zoomed into one MLP, you see the dimmed neighbors.
2. **A spatial breadcrumb** — a small overlay (top-left or bottom) in the form `Transformer › Block 0 › Attention › Head 3 › Q`. Updates per scene. This is the "you are here" the viewer is missing.
3. **A token strip at the top of the stage** — always visible as small lit-up boxes showing the tokens of the current prompt (like the `[To] [date] [I] [the] [cle] …` strip in images 29, 30, 32). Highlights the token being attended to in attention scenes.

### 3.3 Recursive zoom as the scene transition language

Right now scene transitions are crossfades + small camera nudges. Replace with **explicit dolly-in / dolly-out** moves:

- Going *into* a sub-section: camera zooms forward, surrounding blocks fade.
- Going *back out* (e.g. from "what's inside one head" to "many heads in parallel"): camera pulls back smoothly, hidden blocks fade in.
- Going *across* same level (e.g. attention → FFN inside the same block): camera tracks sideways within the block.

The `transitions.ts` file already has a `kind` system (`act-change`, `within-part`, etc.). Extend it with `zoom-in`, `zoom-out`, `lateral`. The `CameraController` already supports waypoints — add `introHero`, `block0Wide`, `block0Attention`, `block0Attention_Head3`, `block0Attention_Head3_Q`, etc.

### 3.4 Per-scene framing

Every scene now opens with one beat that establishes its position in the hierarchy:

> **"We just looked at attention as a single mechanism. Real transformers run six of these in parallel. Here they are."**
> *(Camera pulls back from one head, fades in the other five, "Many heads" label floats above.)*

> **"We've seen one block. The full model is six of these stacked."**
> *(Camera pulls way back, six blocks light up in sequence, "Many repetitions" label appears.)*

This is the *missing connective tissue* the user is asking for. Every scene must answer: where are we, what just happened above us, what's below us.

## 4. Tour script under the new framework

This is what the rebuilt scene list looks like. **Bold** = camera position. *Italic* = on-screen narrative beat.

### Prologue
1. **Splash / press play** — same as now.
2. **Cold open** — chat exchange. Ends with a "let's go inside ↓" hint AND a literal camera dive: the user message smoothly morphs into the input slab of the transformer stack. *"This is the machine that just generated the answer."*

### Act I — Input (text → vectors)
3. **`act1-intro`** — camera pulled back showing the whole stack. Labels appear: *Tokens*, *Attention*, *MLP*, *Output*. Highlight pulses on the input slab. *"First, your text becomes numbers. That happens here, before any block."*
4. **`tokens`** — dolly to the input slab. Show characters dropping onto a strip of small cubes, each labeled with its integer ID. The strip stays at the top of the stage for the rest of Act I.
5. **`bpe`** — same camera position, callout panel on the right shows the BPE algorithm with a real word splitting into subwords.
6. **`embed`** — camera follows one token cube as it lifts off the strip and expands into a vertical column of 384 numbers (use `NumericColumn` primitive). The other tokens dim. *"Each ID looks up a row in the embedding table."*
7. **`positional`** — camera stays on the same token, a sinusoidal position pattern fades in beside the embedding, then they sum visibly. *"The position gets baked into the same vector."*

End of Act I: **camera pulls back; input slab is now lit up with full vectors visible in the strip; cue into Act II.**

### Act II — Inside one block
8. **`act2-intro`** — camera pulls back to show the input feeding into Block 0 (highlighted), other blocks dim. *"Now we zoom into one block."* Camera dollies forward into Block 0.
9. **`layernorm`** — inside Block 0, sublayer "LayerNorm" highlights at the entry point. Vector grid visible, mean/variance bars animate.
10. **`qkv`** — same vector goes through three matrices (W_Q, W_K, W_V) that float beside it. Q, K, V vectors emerge, color-coded.
11. **`attn`** — multi-phase. Camera widens to show all tokens' Q's and K's as a grid; the attention matrix Q·Kᵀ materializes; softmax row-by-row; weighted sum of V vectors.
12. **`multi`** — camera **pulls back inside Block 0**. The single attention machine duplicates into 6 parallel heads, "Multi-head attention" label appears. *"Same mechanism, six times."*
13. **`ffn` / `ffn-feature` / `gelu`** — camera tracks past attention into the FFN sublayer. Linear → activation → Linear pipeline visible (image 27 / 31 style). Hidden neurons light up by feature.

End of Act II: **camera pulls back fully out of Block 0.**

### Act III — The full stack
14. **`act3-intro`** — Block 0 (just examined) is now bright; it duplicates 5 more times, sliding into place. "Many repetitions" brace appears (image 30 style). *"Same block. Six times."*
15. **`stack`** — vector flows up through all six blocks, getting refined at each step. Watch one token's vector evolve.
16. **`sample`** — top of stack: final vector projects to vocab-size, softmax bars animate, one token gets picked.
17. **`kvcache`** — append the new token; the K and V columns for prior tokens visibly stay cached as the new token's Q attends to the cached + new K/V.

### Act IV — Training
18. **`act4-intro`** — camera **pulls all the way back**, the model goes dark, a loss curve appears beside it. *"All those weights came from somewhere."*
19. **`loss / loss-seq / loss-batch`** — three escalating views: per-prediction → per-sequence → per-batch.
20. **`backprop / bp-jacobian / bp-accum`** — gradient flow visualized as red waves pushing back *up* through the dimmed model stack.
21. **`training / gd-ravine / gd-adam`** — abstract loss-landscape callout panel; the model in the back is being adjusted weight-by-weight.

### Act V — Modern upgrades
22. **`act5-intro`** — model returns. *"Same skeleton, a few surgical upgrades."* The architecture from Act IV gets re-shown with three highlighted hotspots: positional encoding, normalization, FFN.
23. **`rope`** — zoom into the position-encoding step from Act I, replace the additive sinusoid with a rotation animation on Q and K.
24. **`modern`** — zoom into one block. Highlight RMSNorm, SwiGLU, GQA, each with a callout.

### Act VI — Output
25. **`act6-intro`** — camera goes to the **top of the stack**. *"After all six blocks, we're back where the cold open ended — the model picks the next token."*
26. **`output`** — the entire forward pass plays in time-lapse: prompt enters, vector traverses the stack, output emerges, gets sampled, gets fed back. Loop.

End of tour: **camera pulls all the way out**, end-card overlay appears.

## 5. Implementation phases

Each phase ships a working tour. The tour gets better at each phase but never breaks.

### Phase 1 — Spatial framework (foundation)
- Promote 3D stage to **70%** of the viewport (or full-bleed with an optional overlay panel) instead of 40% sidebar.
- Add **persistent breadcrumb** overlay (top-left, ~14px text, mono).
- Add **persistent token strip** at the top of the stage (small token boxes, lit per current prompt).
- Refactor `MovieOrchestrator` so the 2D `render()` becomes an **anchored panel** (using `<Html>` from drei) that can be positioned next to a 3D part *or* full-screen as today.
- Per scene, declare `panelAnchor: 'inputSlab' | 'block0' | 'block0.attn' | 'output' | 'fullscreen'`.

**Outcome:** even before any other change, the viewer always sees where they are.

### Phase 2 — Recursive zoom transitions
- Extend `transitions.ts`: add `'zoom-in' | 'zoom-out' | 'lateral'` kinds.
- Extend `CameraController` waypoints with the named positions in §4 (`block0Wide`, `block0_attn`, `block0_attn_qkv`, `block0_ffn`, `stackWide`, `outputClose`, `lossLandscape`, etc.).
- Add a `enteringFrom` field to scenes so transitions know to dolly forward vs. pull back vs. track sideways.
- Add **fade-in/fade-out for non-active blocks** during zoom-in (they recede and dim, not vanish).

**Outcome:** the camera *narrates*.

### Phase 3 — Per-scene rebuilds (the long one)
- Rebuild `act1-intro`, `act2-intro`, `act3-intro` with the framing beats in §4 (each opens with "where we are" and ends with "next we go here").
- Rebuild **tokens / embed / positional** to flow into a shared input strip that persists through Act I.
- Rebuild **attn / multi** as a recursive zoom: one head shown first → camera pulls back → six heads in parallel.
- Rebuild **stack** to show *one block being examined* duplicating into six (image 30 style).

This is the bulk of the work. Each scene is an evening's design.

### Phase 4 — Vector protagonist
- Add a **floating numeric vector** primitive: a tall grid of cells with values, color-coded red/blue, optionally with row labels.
- Use it everywhere a vector is conceptually present: per-token in Act I, Q/K/V in Act II, residual stream in Act III.
- For at least one token, animate the **same vector** evolving through the whole stack (image 26 vibe).

**Outcome:** numbers, not abstractions, drive the story.

### Phase 5 — Concrete grounding
- Pick one example prompt that drives the entire tour (the existing "to be, or no" works).
- Show that prompt's actual vectors at every stage. Same example, same six tokens, evolving.
- Like 3B1B's "Queen vector with feature questions" — pick one token (e.g. "be") and show what the model's representation of it looks like at every block.

**Outcome:** abstract math gets a concrete protagonist.

## 6. What to NOT do

- Don't switch tools (Manim, Windsurf, etc.). R3F is fine.
- Don't try to ship all phases at once. Ship Phase 1 first, see how it reads, iterate.
- Don't preserve every existing scene as-is. Some scenes (`gd-ravine`, `bp-jacobian`) are fine as floating-callout panels and don't need 3D restructuring. Pick battles.
- Don't add interactivity beyond what's there. The tour is meant to be watched. Interactivity comes after the tour reads well as a passive movie.

## 7. Effort estimate

- Phase 1 (framework): 1–2 sessions, ~4–8 hours.
- Phase 2 (transitions): 1 session, ~3–4 hours.
- Phase 3 (rebuilds): 4–6 sessions, ~15–25 hours.
- Phase 4 (vectors): 1–2 sessions, ~4–6 hours.
- Phase 5 (grounding): 1 session, ~3 hours.

**Total: ~30–45 hours of focused work.** It's a real project. Worth it for "VC-credibility-quality" output the user is targeting.

## 8. Decision points the user needs to make

1. **Layout split.** Full-bleed 3D with floating panels (most 3B1B-like, biggest rewrite), or 70/30 split with bigger 3D and overlay-panels (incremental, lower risk)? *Recommendation: 70/30 first, full-bleed in Phase 4.*
2. **Scope.** All 6 acts, or focus first on Acts I–III (the core forward pass) and treat training / modern / output as v2? *Recommendation: Acts I–III first.*
3. **Token strip.** Always-visible at top, or scene-by-scene opt-in? *Recommendation: always-visible during the forward-pass acts (I, II, III, VI), hidden during training (IV) and modern (V).*
4. **Concrete grounding.** Use one prompt for the whole tour, or rotate? *Recommendation: one prompt. "to be, or no" → output: continuation in Shakespeare style.*
