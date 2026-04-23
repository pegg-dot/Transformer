export const COLORS = {
  bg: '#000000',
  fg: '#f5f5f4',
  dim: '#737373',
  rule: '#262626',
  blue: '#60a5fa',
  red: '#f87171',
  violet: '#a78bfa',
  mint: '#6ee7b7',
  gold: '#fbbf24',
  slabTint: '#60a5fa',
} as const

export const N_BLOCKS = 6
export const BLOCK_LEN = 3.2
export const BLOCK_GAP = 0.5
export const INPUT_LEN = 2.0
export const OUTPUT_LEN = 2.0
export const TOTAL_X =
  INPUT_LEN + N_BLOCKS * (BLOCK_LEN + BLOCK_GAP) - BLOCK_GAP + OUTPUT_LEN
export const MID_X = TOTAL_X / 2

export function blockStart(bi: number): number {
  return INPUT_LEN + bi * (BLOCK_LEN + BLOCK_GAP)
}

export const SLAB_W = 2.0
export const SLAB_H = 1.3
export const SLAB_DEPTH = 0.04

export interface Waypoint {
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
}

// Per-scene camera waypoints. Each scene gets its own so we can center on the
// actual content bounds. Rule of thumb: distance 6 + fov 48 ~= 5 units visible
// horizontally at the target (enough for the widest scenes).
const _attnCx = blockStart(0) + BLOCK_LEN * 0.35 + 0.3 // visual center of attn pipeline
const _inputCx = INPUT_LEN / 2
const _block0Cx = blockStart(0) + BLOCK_LEN / 2

export const WAYPOINTS = {
  overview: {
    pos: [MID_X - 0.5, 1.3, 5.8],
    look: [MID_X, -0.3, 0],
    fov: 50,
  },
  shelfTop: {
    pos: [_inputCx, 1.5, 5.2],
    look: [_inputCx, 0.7, 0],
    fov: 48,
  },
  embedFocus: {
    pos: [_inputCx, 0.2, 4.6],
    look: [_inputCx, 0, 0],
    fov: 48,
  },
  positionalFocus: {
    pos: [_inputCx + 0.2, 0.2, 4.6],
    look: [_inputCx + 0.2, 0, 0],
    fov: 48,
  },
  layerNormFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.1, 0.2, 5.2],
    look: [blockStart(0) + BLOCK_LEN * 0.1, 0, 0],
    fov: 48,
  },
  qkvFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.2 + 0.3, 0.2, 6.2],
    look: [blockStart(0) + BLOCK_LEN * 0.2 + 0.3, 0, 0],
    fov: 48,
  },
  attnFocus: {
    pos: [_attnCx, 0.3, 5.4],
    look: [_attnCx, 0.1, 0],
    fov: 48,
  },
  multiFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.35 + 0.7, 0.2, 5.0],
    look: [blockStart(0) + BLOCK_LEN * 0.35 + 0.7, 0, 0],
    fov: 48,
  },
  ffnFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.75, 0.3, 5.2],
    look: [blockStart(0) + BLOCK_LEN * 0.75, 0.1, 0],
    fov: 48,
  },
  ffnFeatureFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.75, 0.2, 4.4],
    look: [blockStart(0) + BLOCK_LEN * 0.75, 0, 0],
    fov: 48,
  },
  geluFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.75, 0.3, 5.5],
    look: [blockStart(0) + BLOCK_LEN * 0.75, 0.1, 0],
    fov: 48,
  },
  kvCacheFocus: {
    pos: [blockStart(0) + BLOCK_LEN * 0.35, 0.2, 4.8],
    look: [blockStart(0) + BLOCK_LEN * 0.35, 0, 0],
    fov: 48,
  },
  block0Inside: {
    pos: [_block0Cx, 0.2, 5.0],
    look: [_block0Cx, 0, 0],
    fov: 48,
  },
  stackPullback: {
    pos: [MID_X, 2.2, 13],
    look: [MID_X, 0, 0],
    fov: 55,
  },
  sampleOutput: {
    pos: [TOTAL_X - OUTPUT_LEN / 2, 0.3, 4.8],
    look: [TOTAL_X - OUTPUT_LEN / 2, 0, 0],
    fov: 48,
  },
  dioramaCenter: {
    pos: [MID_X, 0.4, 5.8],
    look: [MID_X, 0, 0],
    fov: 48,
  },
  landscape: {
    pos: [MID_X, 2.3, 5.2],
    look: [MID_X, 0.1, 0],
    fov: 52,
  },
  outputEnd: {
    pos: [MID_X, 0.5, 9],
    look: [MID_X, -0.5, 0],
    fov: 55,
  },
  // "Pull-back" waypoints used as via-points during 3B1B-style recursive zoom
  // transitions. The camera routes THROUGH these to establish context before
  // diving into the next scene.
  block0Wide: {
    pos: [blockStart(0) + BLOCK_LEN / 2, 0.8, 7.5],
    look: [blockStart(0) + BLOCK_LEN / 2, 0, 0],
    fov: 50,
  },
  inputStageWide: {
    pos: [INPUT_LEN / 2, 0.8, 6.5],
    look: [INPUT_LEN / 2, 0.3, 0],
    fov: 52,
  },
  outputStageWide: {
    pos: [TOTAL_X - OUTPUT_LEN / 2, 0.8, 6.5],
    look: [TOTAL_X - OUTPUT_LEN / 2, 0.3, 0],
    fov: 52,
  },
  dioramaWide: {
    pos: [MID_X, 1.2, 8.5],
    look: [MID_X, 0, 0],
    fov: 55,
  },
  introHero: {
    pos: [MID_X, 1.8, 14],
    look: [MID_X, 0, 0],
    fov: 58,
  },
} as const satisfies Record<string, Waypoint>

export type WaypointKey = keyof typeof WAYPOINTS

export const SCENE_WAYPOINT: Record<string, WaypointKey> = {
  tokens: 'shelfTop',
  bpe: 'shelfTop',
  embed: 'embedFocus',
  positional: 'positionalFocus',
  layernorm: 'layerNormFocus',
  qkv: 'qkvFocus',
  attn: 'attnFocus',
  multi: 'multiFocus',
  ffn: 'ffnFocus',
  'ffn-feature': 'ffnFeatureFocus',
  gelu: 'geluFocus',
  stack: 'stackPullback',
  sample: 'sampleOutput',
  kvcache: 'kvCacheFocus',
  loss: 'dioramaCenter',
  'loss-seq': 'dioramaCenter',
  'loss-batch': 'dioramaCenter',
  backprop: 'stackPullback',
  'bp-jacobian': 'block0Inside',
  'bp-accum': 'stackPullback',
  training: 'landscape',
  'gd-ravine': 'landscape',
  'gd-adam': 'landscape',
  rope: 'dioramaCenter',
  modern: 'dioramaCenter',
  output: 'outputEnd',
  'intro-cold-open': 'introHero',
  'act1-intro': 'inputStageWide',
  'act2-intro': 'block0Wide',
  'act3-intro': 'stackPullback',
  'act4-intro': 'dioramaWide',
  'act5-intro': 'dioramaWide',
  'act6-intro': 'outputStageWide',
}

/**
 * Via-points for 3B1B-style recursive zoom. When a transition starts, the
 * camera ARCS through the named waypoint before settling at the target. This
 * produces the "pull back → pan → dive in" choreography: you see the parent
 * container, then descend into the next sub-component.
 *
 * Keyed by the INCOMING scene id. Not every transition has a via-point — only
 * the ones where it adds pedagogical clarity (act changes, big zoom jumps).
 */
export const SCENE_VIA: Record<string, WaypointKey | null> = {
  // Act I → II: full pullback, then dive into block 0
  layernorm: 'stackPullback',
  // Attention sub-tour
  attn: 'block0Wide',           // establish block 0 before diving to the grid
  multi: 'block0Wide',          // pull back to see the 6-head parallel layout
  // Attn → FFN inside block 0: pan across via block-wide shot
  ffn: 'block0Wide',
  // Act II → III: huge pullback to see the whole stack
  stack: 'stackPullback',
  // Stack → Sample: follow the flow to the end
  sample: 'outputStageWide',
  // Act III → IV: leave the model for the diorama space
  loss: 'dioramaWide',
  backprop: 'stackPullback',
  training: 'dioramaWide',
  // Act IV → V: come back to model from loss landscape
  rope: 'dioramaWide',
  // Act V finale: pull all the way back
  output: 'stackPullback',
  'act2-intro': 'stackPullback',
  'act3-intro': 'stackPullback',
  'act4-intro': 'dioramaWide',
  'act5-intro': 'dioramaWide',
  'act6-intro': 'stackPullback',
}

// Widened fog range so pulled-back cameras don't fade-to-black the content.
export const FOG_NEAR = 9
export const FOG_FAR = 28
