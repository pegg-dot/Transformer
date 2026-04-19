# Per-Scene 3D Visualizations for the Tour Sidebar

**Date:** 2026-04-19
**Scope:** Replace the single generic `ModelMap3D` architecture diagram with purpose-built 3D visualizations for each of the 26 tour scenes, inspired by 3Blue1Brown's "Inside an LLM" visual language.

---

## Motivation

The current `ModelMap3D` is a single unified architecture diagram (stack of blocks, tokens on top) with camera auto-pans to the active part. The user's critique: this is *too broad*. It doesn't show **what is actually happening** inside each step — it just points at where it would happen.

3B1B's visualizations are concrete and mechanical: the QK dot-product grid forms in front of you, the softmax re-normalizes in real time, the gradient cascades backward. Each scene teaches a specific mechanic by visually *doing* it.

The spec replaces the sidebar with per-scene 3D dioramas that show the mechanics, while preserving architectural context when it aids teaching.

---

## Hybrid Strategy (Path A + Path B)

Scenes split into three modes based on what they teach:

### Mode A — Anchored-in-architecture (camera dives inside the stack)

The outer stack stays visible; camera flies *into* the relevant block and a purpose-built mini-diorama plays inside it.

**Scenes:** `tokens`, `bpe`, `embed`, `positional`, `layernorm`, `qkv`, `attn`, `multi`, `ffn`, `ffn-feature`, `gelu`, `stack`, `sample`, `kvcache`, `output`

### Mode B — Free-standing diorama (architecture fades to backdrop or away)

Abstract topics (loss surfaces, optimizer trajectories, comparative architectures) don't live at a physical location in the model. Architecture fades back, a purpose-built diorama takes the stage.

**Scenes:** `loss`, `loss-seq`, `loss-batch`, `training`, `gd-ravine`, `gd-adam`, `rope`, `modern`

### Mode C — Hybrid (stack stays dimly visible, overlays animate)

Backprop is architecture-aware but behaves differently from a forward pass — architecture stays visible but dimmed, with overlays.

**Scenes:** `backprop`, `bp-jacobian`, `bp-accum`

---

## Shared Visual Grammar

### Data Surfaces
- Translucent glass slabs (planes with 0.08–0.15 alpha, tinted by role)
- White L-shaped corner ticks at each slab's corners (the 3B1B signature)
- InstancedMesh cell grids for dense data (8×14 or similar, colored per value)

### Activity Indicators
- Dense red/blue wire-mesh cloud floating inside the active slab (150+ nodes, BufferGeometry lines with vertexColors)
- Flanking numeric columns of rendered floats ("5.5, 2.9, 9.2…") to the left and right of the active slab

### Labels
- Serif-italic floating text above the active region ("Attention", "Multilayer Perceptron", "Loss", "Gradient")
- Drei `<Text>` components, white, with anti-aliased rendering

### Color Grammar
- **Blue (#60a5fa)** — forward pass · Q vectors · activations
- **Red (#f87171)** — backward pass · K vectors · gradients · loss
- **Violet (#a78bfa)** — token IDs · embeddings · discrete indices
- **Mint (#6ee7b7)** — V vectors · stored / cached values
- **Gold (#fbbf24)** — sampled token · selected / argmax output
- **White (#f5f5f4)** — labels, corner ticks, structural grid lines

### Motion Grammar
- Data flows left → right on forward pass
- Arrows flow right → left on backward pass
- Camera always auto-lerps via `useFrame`; no `OrbitControls`, no user input
- Every scene loops cleanly within its scene duration

### Backdrop
- Pure black clear color
- Fog, 6–18 units, for atmospheric depth
- Ambient light (0.3) + two directional lights (0.6, 0.3)

### Recursive Zoom Rule
Every scene opens with a 2–3 second **establishing shot** of the parent structure, then dives in. Nested sub-scenes dive again. The camera never teleports — it always flies through the containing level. This mirrors 3B1B's recursive reveal pattern: *show the whole, then show the part, then show the part's part.*

---

## Per-Scene Designs

All numbering matches the order scenes appear in `app/tour/page.tsx`.

### Act I — Input (Mode A)

**1. `tokens`** — Italic sentence types in above the stack. Each character falls as a small cube into a "token shelf" slab at the top of the model. Violet ID numerals stamp onto each cube. Drop-pin lines tether each cube to its position index.

**2. `bpe`** — Same shelf. Raw byte cubes pair up; high-frequency pairs glow and *fuse* into one larger cube carrying the merged token string. Runs 3 phases over the scene duration: bytes → bigrams → trigrams.

**3. `embed`** — One ID cube drops into a tall V×d lookup wall (violet/red gridded cells). The matching row illuminates, extrudes forward, and flies out as a horizontal 1D vector strip that takes position in the sequence. Loop: cycles through tokens.

**4. `positional`** — Two stacked grids: token embeddings (top) + sinusoidal positional pattern (below, red/blue stripes at distinct frequencies per row). Grids merge via visible cell-by-cell addition producing position-aware rows that feed into block 0.

### Act II — Inside Block 0 (Mode A)

Every scene in this act: camera is *inside* block 0's translucent frame; outer stack stays dimly visible through fog.

**5. `layernorm`** — One residual-stream row vector renders as a bar chart with uneven bar heights. A horizontal "mean line" slides in → bars recenter around zero. A variance ellipse divides → bars renormalize. Two tiny γ/β cubes drop from above, multiply/add into the vector. Flanking numeric columns show before/after statistics.

**6. `qkv`** — One vector enters from the left as a thick horizontal bar. Three projection "walls" sit in front of it (blue=Q, red=K, mint=V). The bar passes through all three simultaneously and emerges as three sibling vectors branching into three chambers. Each chamber gets a floating serif label: **Q**, **K**, **V**.

**7. `attn` (THE money shot)** — 3B1B's canonical attention diagram in 3D:
- Q-vectors lined up as a **top row** (horizontal)
- K-vectors lined up as a **left column** (perpendicular, vertical)
- Their intersection forms the **QK grid** — each cell's brightness = Q·K/√d score
- Softmax row-normalizes the grid (bright peaks emerge, others dim)
- Translucent **triangular causal mask** covers upper-triangular cells
- V-vectors slide in from the bottom, multiply cell-wise with the softmax grid
- Weighted V vectors aggregate into output rows on the right

This scene is non-negotiable — it must match the 3B1B attention shot. Everything in Act II builds around it.

**8. `multi`** — Camera pulls back slightly. The attention grid from `attn` replicates into 6 parallel slabs at different z-offsets (6 heads), each grid patterned differently (syntactic/semantic/positional tints). Heads concatenate into one wide output strip; an output-projection wall compresses back to d.

**9. `ffn`** — Input vector (width d) hits a wide "fan-out" wall → expands to 4d (wider, more bars). Dense red/blue mesh cloud fills the expanded space. GELU curve glyph floats above; activations fire nonlinearly across the hidden layer. Fan-in wall on the right compresses back to d. Serif label: *Multilayer Perceptron*.

**10. `ffn-feature`** — Opens with the full FFN mesh from `ffn` (recursive zoom), then camera dives into the 4d hidden layer. Each hidden neuron is a tiny glowing cube. Different input vectors flow through → different subsets of cubes light. Floating example labels above lit clusters: *"Golden Gate tokens"*, *"code tokens"*, *"French words"*.

**11. `gelu`** — Three side-by-side curve plots floating in 3D: ReLU (sharp hinge) · GELU (soft S) · Swish (soft S with negative dip). A cloud of test points flows through all three in parallel; output magnitude = brightness of the point. Camera slow-orbits between the three curves.

### Act III — Scale (Mode A)

**12. `stack`** — Camera pulls way back. All 6 blocks visible in depth. A vector enters block 0 → block lights up → transformation ripples → vector flies to block 1 → repeats. Thin residual "skip wire" loops around each block, visibly bypassing. Block 5 glows at the end.

**13. `sample`** — Final block's output (single vector) hits a tall **unembedding wall** (V rows). Column of vocab logits emerges. Softmax animates (bars renormalize). Top bar lights **gold**, camera rushes to the sampled token which appears at the right edge of the token shelf from Act I.

**14. `kvcache`** — Same QK-grid from `attn` but K and V columns are **tall archive stacks** (cached rows from prior timesteps). Per step: one new Q drops in at top, one new K/V row stamps onto the archives. Floating labels: *"Q: recomputed"* / *"K,V: stored once"*. Grid grows one row/column per tick.

### Act IV — Training

**15. `loss` (Mode B)** — Stack fades back. Two histograms face off center-stage: **prediction** (soft distribution across vocab) vs **target** (one-hot spike). Red divergence arrows between them. Cross-entropy value floats as a serif-italic glowing number.

**16. `loss-seq` (Mode B)** — Row of T positions across the bottom. Each position has its own tiny prediction-vs-target pair (from scene 15) and its own vertical loss bar above it. Bars sum into one "sequence loss" bar on the right.

**17. `loss-batch` (Mode B)** — A **3D batch cube**: B rows × T columns × one scalar loss per cell, rendered as a grid of glowing dots. Cube collapses/averages into a single scalar — the training loss.

**18. `backprop` (Mode C)** — Hybrid. Full stack visible. Red **loss spark** ignites at the output. Gradient cascades backward: each block lights red in reverse order, arrows flow right-to-left, activations pulse backward through attention → LN → embed.

**19. `bp-jacobian` (Mode C)** — Opens with backward-flowing stack from `backprop`, then zooms into one block. Inside: a small Jacobian matrix. Gradient-in vector passes through the matrix → each matrix row highlights as it contributes → gradient-out vector emerges.

**20. `bp-accum` (Mode C)** — B parallel gradient threads flowing backward down the stack (4 translucent stack copies overlapping). Converge at a summation node, divide by B, produce one averaged gradient.

**21. `training` (Mode B)** — Architecture fully gone. **3D loss landscape** (rolling hillscape mesh). A bright ball starts near a ridge, rolls down toward a valley. Glowing dashed path traces behind. Camera tracks the ball.

**22. `gd-ravine` (Mode B)** — Narrow ravine-shaped loss surface. Vanilla GD ball **zig-zags across the walls** (long orthogonal steps, slow progress down the ravine axis). Zigzag path traces brightly.

**23. `gd-adam` (Mode B)** — Recursive zoom: opens with zigzag from `gd-ravine`, then same ravine replays with Adam ball sliding smoothly down the floor. Momentum shown as trailing velocity vectors.

### Act V — Modern + Output

**24. `rope` (Mode B)** — Q and K as arrows in a 2D plane (rendered in 3D space). Position → rotation angle. Token index climbs → both arrows rotate by matching amounts; the **relative angle** (dot product) stays meaningful. Angle arcs sweep as arrows rotate. Recursive zoom: opens with absolute positional embedding cubes from scene 4 fading out, then RoPE rotation taking over.

**25. `modern` (Mode B)** — Three side-by-side comparison slabs floating in space:
- *LayerNorm → RMSNorm* (formula diff rendered as serif text cards)
- *GELU FFN → SwiGLU* (gating pathway shown alongside)
- *MHA → GQA* (8 Q-heads sharing 2 K,V heads — visibly redrawn)

Camera pans across the three.

**26. `output` (Mode A)** — Camera all the way back. Full stack lit softly. A token flows out the bottom of block 5 → through unembed → into a typewriter-style **generated text scroll** appearing letter-by-letter. Ends with the whole transformer softly dimming as the output settles.

---

## Architecture

### Component Boundaries

The existing monolith `ModelMap3D.tsx` (~910 lines) is replaced by a dispatcher component plus one file per scene diorama. This keeps each scene's logic self-contained and editable without touching others.

```
components/movie/modelmap/
├── index.tsx                    (~150 lines — dispatcher, camera controller, shared canvas)
├── shared/
│   ├── Slab.tsx                 (translucent plane + corner ticks + cell grid)
│   ├── DenseMesh.tsx            (red/blue wire cloud)
│   ├── NumericColumn.tsx        (flanking float strips)
│   ├── BlockFrame.tsx           (dashed wireframe container)
│   ├── StackBackdrop.tsx        (6-block skeleton for establishing shots)
│   ├── Label.tsx                (serif-italic floating text)
│   └── constants.ts             (colors, fog, camera waypoints per part)
├── sceneA_Tokens.tsx
├── sceneA_Bpe.tsx
├── sceneA_Embed.tsx
├── sceneA_Positional.tsx
├── sceneA_LayerNorm.tsx
├── sceneA_Qkv.tsx
├── sceneA_Attn.tsx              (the jewel — larger file, ~300 lines)
├── sceneA_Multi.tsx
├── sceneA_Ffn.tsx
├── sceneA_FfnFeature.tsx
├── sceneA_Gelu.tsx
├── sceneA_Stack.tsx
├── sceneA_Sample.tsx
├── sceneA_KvCache.tsx
├── sceneA_Output.tsx
├── sceneB_Loss.tsx
├── sceneB_LossSeq.tsx
├── sceneB_LossBatch.tsx
├── sceneB_Training.tsx
├── sceneB_GdRavine.tsx
├── sceneB_GdAdam.tsx
├── sceneB_Rope.tsx
├── sceneB_Modern.tsx
├── sceneC_Backprop.tsx
├── sceneC_BpJacobian.tsx
└── sceneC_BpAccum.tsx
```

Naming prefix (`sceneA_` / `sceneB_` / `sceneC_`) signals which mode the scene uses, so the dispatcher can apply the right backdrop treatment without a lookup table.

### Dispatch Contract

Each scene file exports a default React component with this signature:

```tsx
export default function SceneDiorama({
  t,           // seconds into this scene
  duration,    // scene total duration in seconds
  accent,      // COLORS[accent] from the scene def
  sceneId,     // for sub-scene variants (e.g. loss vs loss-seq)
}: DioramaProps): JSX.Element
```

The dispatcher (`modelmap/index.tsx`) receives the same `part` + `sceneId` + `accent` props as the current `ModelMap3D`, looks up the scene component, and renders it inside a shared `<Canvas>` with the appropriate mode backdrop.

### Shared Canvas / Mode Backdrop

- **Mode A**: `<StackBackdrop dimmed />` renders the 6-block skeleton behind the diorama at 0.3 opacity so architectural context is always readable. Camera is parked inside the active block's volume.
- **Mode B**: `<StackBackdrop dimmed={0.08} blurred />` renders the stack barely visible as atmospheric context. Camera repositions to the diorama's origin.
- **Mode C**: `<StackBackdrop dimmed />` with inverted lighting (red-tinted rim light) to signal the backward pass.

### Camera Controller

A single `<CameraController part sceneId>` lerps the camera to the waypoint defined for `(part, sceneId)` in `constants.ts`. Waypoints include position, lookAt, fov. Transitions between scenes are always lerps — never teleports — so the recursive zoom rule is enforced at the camera level.

### Data Flow

Scenes that need the user's prompt (`tokens`, `bpe`, `embed`, `attn`, `multi`, `kvcache`, `output`) read `usePrompt()` inside their own file, same as the 2D scenes. No prop drilling.

Deterministic random values (for fake activations, loss surfaces, etc.) use the same `makeRng(seed)` pattern the 2D scenes use, keyed off scene ID.

### Animation Pattern

Every scene is a pure function of `t`. No internal state, no intervals, no animation frames. The dispatcher re-renders on every RAF tick from the parent (via `useFrame` in the dispatcher), passing the current `t`. This means:

- Scrubbing backward works correctly
- Scenes don't accumulate drift
- Each scene is trivially testable in isolation

Scenes compute positions/opacities/brightnesses as `f(t)` and return a tree of `<mesh>`, `<Text>`, `<line>`, etc. Easing functions live in `shared/easing.ts`.

---

## Error Handling

- If `part` / `sceneId` doesn't match a scene file → dispatcher falls back to a minimal stack-only view (same as current `cameraTargetForPart` default)
- If WebGL context is lost → `<Canvas>` surfaces a retry button (drei's built-in)
- No server-side rendering concerns; `<Canvas>` is already `'use client'`

---

## Testing

- Per-scene visual smoke test: render each scene at `t=0`, `t=duration/2`, `t=duration` and snapshot the DOM for structural regressions (drei exposes the three.js scene tree)
- Full tour playthrough test: automated scroll through all 26 scenes, verify no WebGL errors, no React warnings, frame rate stays ≥ 30fps on a mid-tier laptop
- Manual aesthetic review: each scene compared to the 3B1B reference image the user provided

---

## Non-Goals

- User camera control (explicitly out of scope — no OrbitControls, no zoom, no pan)
- Real model inference driving the visualizations (all data is deterministic fake)
- Support for prompts longer than `MAX_LEN` (12)
- Mobile layout (tour is desktop-only; sidebar is 420px fixed)
- Dark/light theme variants (pure black only)

---

## Rollout

The work is one coherent refactor — the existing `ModelMap3D.tsx` is replaced wholesale. There is no intermediate "some scenes use new viz, others use old" state, because the grammar (fog, camera, stack backdrop) is shared infrastructure that must be consistent for the whole tour to feel cohesive.

Implementation order inside the plan:

1. Shared infrastructure (`shared/*`, dispatcher, camera controller, stack backdrop)
2. `attn` (the jewel — de-risk the hardest one first)
3. Act II remainder (`qkv`, `multi`, `ffn`, `ffn-feature`, `gelu`, `layernorm`)
4. Act I (`tokens`, `bpe`, `embed`, `positional`)
5. Act III (`stack`, `sample`, `kvcache`)
6. Act IV training (`loss`, `loss-seq`, `loss-batch`, `backprop`, `bp-jacobian`, `bp-accum`, `training`, `gd-ravine`, `gd-adam`)
7. Act V (`rope`, `modern`, `output`)
8. Pass over camera waypoints + recursive-zoom transitions end-to-end
9. Type-check + dev server smoke test + production build

Only steps 1–2 are load-bearing; every subsequent scene is independent so the work can proceed in any order once the jewel is working.
