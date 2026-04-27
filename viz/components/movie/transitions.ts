import type { Variants, Transition } from 'framer-motion'

/**
 * Per-scene incoming-transition kinds. Each kind controls three things:
 *   1. How the 2D detail panel enters/exits (STAGE_VARIANTS).
 *   2. How fast the 3D camera lerps to its target waypoint.
 *   3. How long the dim-pulse over the 3D stage takes (sidebarCrossfadeMs).
 *
 * Naming follows the spatial-recursion redesign:
 *   within-part  — small step inside the same sub-component (no scale shift)
 *   forward-flow — narrative continuation in the same act (slide horizontally)
 *   zoom-in      — descend into a sub-component (camera dollies forward)
 *   zoom-out     — ascend out to a parent context (camera pulls back)
 *   lateral      — same hierarchical level, different aspect (track sideways)
 *   act-change   — heavy banner-bearing transition between top-level acts
 */
export type TransitionKind =
  | 'within-part'
  | 'forward-flow'
  | 'zoom-in'
  | 'zoom-out'
  | 'lateral'
  | 'act-change'

export interface KindTiming {
  duration: number
  easing: [number, number, number, number]
  cameraSpeed: number
  sidebarCrossfadeMs: number
}

export const KIND_TIMING: Record<TransitionKind, KindTiming> = {
  'within-part': {
    duration: 0.4,
    easing: [0.22, 1, 0.36, 1],
    cameraSpeed: 2.4,
    sidebarCrossfadeMs: 400,
  },
  'forward-flow': {
    duration: 0.6,
    easing: [0.33, 1, 0.4, 1],
    cameraSpeed: 1.8,
    sidebarCrossfadeMs: 600,
  },
  'zoom-in': {
    // Slower camera so the dolly-forward registers as a deliberate descent.
    duration: 0.65,
    easing: [0.22, 1, 0.36, 1],
    cameraSpeed: 1.4,
    sidebarCrossfadeMs: 700,
  },
  'zoom-out': {
    // Slightly faster than zoom-in — the eye reads "pull back to context"
    // quicker than "what's inside this thing".
    duration: 0.6,
    easing: [0.22, 1, 0.36, 1],
    cameraSpeed: 1.6,
    sidebarCrossfadeMs: 650,
  },
  'lateral': {
    // Sideways glide, no scale shift. Snappier than zooms.
    duration: 0.5,
    easing: [0.4, 0, 0.2, 1],
    cameraSpeed: 2.0,
    sidebarCrossfadeMs: 500,
  },
  'act-change': {
    // Generous: banner + camera pullback + dive-in need breathing room.
    duration: 1.6,
    easing: [0.65, 0, 0.35, 1],
    cameraSpeed: 0.9,
    sidebarCrossfadeMs: 1600,
  },
}

/**
 * Per-kind motion variants for the 2D detail panel. Framer-motion drives
 * `initial`, `animate`, `exit` by looking up the variant using the scene's
 * incoming kind.
 *
 * Variant names: "enter", "center", "exit".
 *   - "enter": how the incoming panel starts.
 *   - "center": settled state.
 *   - "exit": how the outgoing panel leaves.
 *
 * Conventions:
 *   zoom-in  — incoming starts SMALL (we just descended into it from outside),
 *              outgoing scales UP and fades (camera flies past it).
 *   zoom-out — incoming starts LARGE (we just pulled back to see it),
 *              outgoing scales DOWN and fades (camera retreats from it).
 *   lateral  — slide sideways, no scale change.
 */
export const STAGE_VARIANTS: Record<TransitionKind, Variants> = {
  'within-part': {
    enter: { opacity: 0, scale: 0.97, x: 0, filter: 'blur(3px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.03, x: 0, filter: 'blur(3px)' },
  },
  'forward-flow': {
    enter: { opacity: 0, scale: 0.98, x: 60, filter: 'blur(2px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.98, x: -60, filter: 'blur(2px)' },
  },
  'zoom-in': {
    enter: { opacity: 0, scale: 0.85, x: 0, filter: 'blur(4px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.15, x: 0, filter: 'blur(4px)' },
  },
  'zoom-out': {
    enter: { opacity: 0, scale: 1.15, x: 0, filter: 'blur(4px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.85, x: 0, filter: 'blur(4px)' },
  },
  'lateral': {
    enter: { opacity: 0, scale: 1, x: 80, filter: 'blur(0px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1, x: -80, filter: 'blur(0px)' },
  },
  'act-change': {
    enter: { opacity: 0, scale: 0.96, x: 0, filter: 'blur(6px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.96, x: 0, filter: 'blur(6px)' },
  },
}

export function transitionFor(kind: TransitionKind): Transition {
  const t = KIND_TIMING[kind]
  return { duration: t.duration, ease: t.easing }
}

export const DEFAULT_KIND: TransitionKind = 'within-part'

/**
 * Per-scene "incoming" transition kind — used when this scene becomes
 * active from the previous scene. The first scene's entry uses the default.
 *
 * Re-tagged for the spatial-recursion redesign:
 *   - act intros stay 'act-change' (banner anchor)
 *   - scenes that descend into a sub-component → 'zoom-in'
 *   - scenes that pull back to a parent → 'zoom-out'
 *   - scenes at the same hierarchical level as their predecessor → 'lateral'
 */
export const INCOMING_KIND: Record<string, TransitionKind> = {
  // --- intros (all fire the act-change banner) ---
  'intro-cold-open': 'act-change',
  // act1-intro now uses forward-flow: the new split-pane design already
  // shows "ACT I · INPUT" as a kicker on the right pane, so the heavy
  // banner + blur overlay is redundant and was making the right pane
  // feel "not playing" for the first ~2.5s.
  'act1-intro': 'forward-flow',
  'act2-intro': 'act-change',
  'act3-intro': 'act-change',
  'act4-intro': 'act-change',
  'act5-intro': 'act-change',
  'act6-intro': 'act-change',

  // --- Act I: input pipeline ---
  tokens: 'forward-flow',         // first content scene after act1-intro
  bpe: 'lateral',                 // sibling concept: same input strip, different tokenizer
  embed: 'forward-flow',          // descend from token strip into one token's vector
  positional: 'lateral',          // same vector, different overlay (position embedding)
  'ready-for-block-0': 'forward-flow', // input slab handoff to Act II

  // --- Act II: inside one block ---
  layernorm: 'zoom-in',           // entering block 0 from above
  qkv: 'zoom-in',                 // descend into the Q/K/V projection
  attn: 'zoom-in',                // descend further into the attention math grid
  multi: 'zoom-out',              // pull back from one head to see all six in parallel
  ffn: 'lateral',                 // same block, different sublayer (attn → ffn)
  'ffn-feature': 'zoom-in',       // descend into one hidden neuron's feature
  gelu: 'lateral',                // same FFN context, switch to activation detail

  // --- Act III: full stack ---
  stack: 'zoom-out',              // pull all the way back to see six blocks stacked
  sample: 'zoom-in',              // descend into the output projection
  kvcache: 'lateral',             // same output context, alternate caching view

  // --- Act IV: training ---
  loss: 'forward-flow',           // narrative step: forward pass produced a guess
  'loss-seq': 'lateral',
  'loss-batch': 'lateral',
  backprop: 'forward-flow',       // gradient travels backward — narrative direction
  'bp-jacobian': 'zoom-in',       // descend into one layer's gradient detail
  'bp-accum': 'lateral',
  training: 'forward-flow',
  'gd-ravine': 'lateral',
  'gd-adam': 'lateral',

  // --- Act V: modern upgrades ---
  rope: 'forward-flow',
  modern: 'within-part',

  // --- Act VI: output ---
  output: 'zoom-out',             // final pull-back over the whole machine
}

export function incomingKindFor(sceneId: string): TransitionKind {
  return INCOMING_KIND[sceneId] ?? DEFAULT_KIND
}
