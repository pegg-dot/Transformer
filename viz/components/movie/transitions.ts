import type { Variants, Transition } from 'framer-motion'

export type TransitionKind =
  | 'within-part'
  | 'forward-flow'
  | 'dive-in'
  | 'pull-back'
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
  'dive-in': {
    duration: 0.6,
    easing: [0.22, 1, 0.36, 1],
    cameraSpeed: 1.6,
    sidebarCrossfadeMs: 600,
  },
  'pull-back': {
    duration: 0.6,
    easing: [0.22, 1, 0.36, 1],
    cameraSpeed: 1.6,
    sidebarCrossfadeMs: 600,
  },
  'act-change': {
    // Generous: banner + camera pullback + dive-in need breathing room
    duration: 1.6,
    easing: [0.65, 0, 0.35, 1],
    cameraSpeed: 0.9,
    sidebarCrossfadeMs: 1600,
  },
}

/**
 * Per-kind motion variants for the 2D stage. Framer motion drives `initial`,
 * `animate`, `exit` by looking up the variant using `current.incoming`.
 *
 * Variant names: "enter", "center", "exit".
 * - "enter": how the incoming scene starts
 * - "center": the settled state
 * - "exit": how the outgoing scene leaves
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
  'dive-in': {
    enter: { opacity: 0, scale: 0.85, x: 0, filter: 'blur(4px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.15, x: 0, filter: 'blur(4px)' },
  },
  'pull-back': {
    enter: { opacity: 0, scale: 1.15, x: 0, filter: 'blur(4px)' },
    center: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.85, x: 0, filter: 'blur(4px)' },
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

/**
 * Returns the default transition (for the first scene, which has no incoming
 * transition annotation).
 */
export const DEFAULT_KIND: TransitionKind = 'within-part'

/**
 * Per-scene "incoming" transition kind — the transition used when this scene
 * becomes active from the previous scene. The first scene's entry uses the
 * default kind. Keys match `id` values in `app/tour/page.tsx`.
 */
export const INCOMING_KIND: Record<string, TransitionKind> = {
  // --- intros (all fire the act-change banner) ---
  'intro-cold-open': 'act-change',
  'act1-intro': 'act-change',
  'act2-intro': 'act-change',
  'act3-intro': 'act-change',
  'act4-intro': 'act-change',
  'act5-intro': 'act-change',
  'act6-intro': 'act-change',
  // --- existing scenes ---
  tokens: 'within-part',
  bpe: 'within-part',
  embed: 'forward-flow',
  positional: 'forward-flow',
  layernorm: 'forward-flow',  // was 'act-change' — intro now owns the banner
  qkv: 'forward-flow',
  attn: 'within-part',
  multi: 'within-part',
  ffn: 'forward-flow',
  'ffn-feature': 'within-part',
  gelu: 'within-part',
  stack: 'forward-flow',      // was 'act-change' — intro now owns the banner
  sample: 'forward-flow',
  kvcache: 'within-part',
  loss: 'forward-flow',       // was 'act-change' — intro now owns the banner
  'loss-seq': 'within-part',
  'loss-batch': 'within-part',
  backprop: 'forward-flow',
  'bp-jacobian': 'dive-in',
  'bp-accum': 'within-part',
  training: 'forward-flow',
  'gd-ravine': 'within-part',
  'gd-adam': 'within-part',
  rope: 'forward-flow',       // was 'act-change' — intro now owns the banner
  modern: 'within-part',
  output: 'pull-back',
}

export function incomingKindFor(sceneId: string): TransitionKind {
  return INCOMING_KIND[sceneId] ?? DEFAULT_KIND
}
