# Scene Transitions — Design

**Date:** 2026-04-19
**Scope:** Replace the current uniform blur+scale transition between scenes in the `/tour` movie with categorical transitions that convey how scenes relate spatially and conceptually. Keep the existing camera + 3D system; add variants + crossfade coordination.

---

## Motivation

Right now every scene-to-scene transition uses the same blur+scale+fade on the 2D stage, and the 3D sidebar content swaps abruptly. Transitions should *teach* — the shape of the motion should tell the viewer "we're moving forward through the model", "we're zooming into a sub-structure", "we're crossing into a new act", etc. Without that cue, scenes feel disconnected.

## Approach

**Categorical transitions.** Classify each consecutive scene pair into one of five kinds. Each kind has a distinct 2D animation, 3D camera speed, and duration. Scenes annotate themselves with their `incoming` kind (the kind used when they become active from the previous scene).

### The five transition kinds

| Kind | Semantic | Duration | 2D stage | 3D camera |
|------|----------|----------|----------|-----------|
| `within-part` | same part, different phase | 500ms | fade + scale (0.97 → 1.03) | fast lerp, small Δ |
| `forward-flow` | downstream part | 800ms | old slides left, new slides in from right + fade | lerps along stack x-axis |
| `dive-in` | zooming into sub-structure | 800ms | old scales up 1→1.15 + fades; new enters 0.85→1 | camera dollies closer |
| `pull-back` | zooming out | 800ms | old shrinks 1→0.85; new enters 1.15→1 | camera dollies out |
| `act-change` | crossing an act boundary | 1200ms | fade-to-black with section banner overlay | slower camera arc |

### Per-pair classification (locked)

From scene N → N+1:

| # | Prev | Curr | Kind |
|---|------|------|------|
| 1→2 | tokens | bpe | within-part |
| 2→3 | bpe | embed | forward-flow |
| 3→4 | embed | positional | forward-flow |
| 4→5 | positional | layernorm | **act-change** (I→II) |
| 5→6 | layernorm | qkv | forward-flow |
| 6→7 | qkv | attn | within-part |
| 7→8 | attn | multi | within-part |
| 8→9 | multi | ffn | forward-flow |
| 9→10 | ffn | ffn-feature | within-part |
| 10→11 | ffn-feature | gelu | within-part |
| 11→12 | gelu | stack | **act-change** (II→III) |
| 12→13 | stack | sample | forward-flow |
| 13→14 | sample | kvcache | within-part |
| 14→15 | kvcache | loss | **act-change** (III→IV) |
| 15→16 | loss | loss-seq | within-part |
| 16→17 | loss-seq | loss-batch | within-part |
| 17→18 | loss-batch | backprop | forward-flow |
| 18→19 | backprop | bp-jacobian | dive-in |
| 19→20 | bp-jacobian | bp-accum | within-part |
| 20→21 | bp-accum | training | forward-flow |
| 21→22 | training | gd-ravine | within-part |
| 22→23 | gd-ravine | gd-adam | within-part |
| 23→24 | gd-adam | rope | **act-change** (IV→V) |
| 24→25 | rope | modern | within-part |
| 25→26 | modern | output | pull-back |

### Timing coordination

- AnimatePresence switches from `mode="wait"` to `mode="sync"` so enter and exit run simultaneously — no dead pause at the boundary
- 2D stage exit + enter overlap, choreographed to the transition kind
- 3D camera is a continuous `useFrame` lerp — the new waypoint target takes effect immediately when sceneId changes
- 3D dispatcher holds the *previous* scene component mounted for ~400ms after sceneId changes, fading its opacity 1→0 while the new scene fades 0→1

### Act-change special handling

The current free-floating "▼ entering · Act X" banner is removed. For act-change transitions, the banner is integrated inline:
1. **0–500ms:** old 2D scene fades out, camera begins slow arc toward next waypoint
2. **400–800ms:** section banner ("Act III · Scale") pulses in center-stage, scaled 0.95 → 1.02
3. **700–1200ms:** new 2D scene fades in, banner fades out

### Camera lerp speed

Pass transition kind to `CameraController` so it can choose the right lerp speed:
- `within-part` / `forward-flow` / `dive-in` / `pull-back`: speed 1.8 (current default)
- `act-change`: speed 1.1 (slower so the arc is visible)

### Files touched

- `app/tour/page.tsx` — annotate each scene with `incoming: TransitionKind` (except scene 0)
- `components/movie/MovieOrchestrator.tsx` — variant definitions per kind, AnimatePresence mode="sync", act-change banner integration
- `components/movie/modelmap/index.tsx` — scene-content crossfade (previous scene held mounted briefly, opacity animated)
- `components/movie/modelmap/shared/CameraController.tsx` — `speed` prop driven by transition kind
- `components/movie/transitions.ts` — new file with TransitionKind type, variant definitions, and lookup from sceneId

### Non-goals

- Bespoke per-pair animations (Option C from brainstorming) — deferred until the categorical version is running
- Camera-path intermediate waypoints (e.g. "sweep through the stack" between forward-flow transitions) — current waypoint lerp already produces a natural arc
- Transition-aware 3D content morphing (e.g. attn grid → multi's 6 grids morphing instead of crossfading) — deferred
