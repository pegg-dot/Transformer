# Scene Transitions Implementation Plan

**Goal:** Replace uniform blur+scale with five categorical transitions driven by a per-scene `incoming` field.

**Spec:** `docs/superpowers/specs/2026-04-19-scene-transitions-design.md`

---

## Task 1: Create transitions module

**Files:**
- Create: `components/movie/transitions.ts`

Export `TransitionKind`, `TRANSITION_VARIANTS` (exit/enter/center Framer motion variants for 2D stage per kind), `TRANSITION_TIMING` (duration + easing per kind), and a helper that maps a scene's `incoming` to these.

---

## Task 2: Annotate scenes in app/tour/page.tsx

For each scene after the first, add `incoming: '<kind>'` per the classification table in the spec.

---

## Task 3: Update MovieOrchestrator

**File:** `components/movie/MovieOrchestrator.tsx`

- Add `incoming` to `MovieScene` interface
- Replace AnimatePresence `mode="wait"` with `mode="sync"`
- Replace hardcoded `initial/animate/exit` on scene wrapper with variants keyed by `current.incoming`
- Remove the standalone "▼ entering · Act X" banner
- Add an `act-change` center banner that renders when `current.incoming === 'act-change'`, with its own timing (shows during 400–800ms of the 1200ms transition)

---

## Task 4: Update ModelMap3D dispatcher

**File:** `components/movie/modelmap/index.tsx`

Previous-scene crossfade. Track prev sceneId in a ref; when sceneId changes, render prev for 400ms with opacity fading 1→0 via useFrame-driven state. Current scene renders with opacity 0→1.

Easiest: wrap each scene instance with a `<FadingScene>` component that reads an `active` prop and lerps its own opacity. The dispatcher renders both previous (inactive) and current (active) scenes for 400ms after a swap.

---

## Task 5: Update CameraController

**File:** `components/movie/modelmap/shared/CameraController.tsx`

Accept a `kind?: TransitionKind` prop. If `kind === 'act-change'`, use lerp speed 1.1; else 1.8 (default).

---

## Task 6: Verify

- Type-check: `npx tsc --noEmit`
- Production build: `npm run build`
- Dev reload: visit `/tour`, watch every transition at 1× and 2× speeds
- Spot-check: Act I→II transition should show the banner; 18→19 (backprop→bp-jacobian) should visibly zoom in
