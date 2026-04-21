/**
 * Color scales per docs/viz_vision.md:
 *   - Attention weight [0, 1]: single-hue blue (#0f172a → #60a5fa)
 *   - Activation pos/neg: diverging red → neutral → blue, centered at 0
 */

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/** Attention weight (or any [0, 1] value) → single-hue blue. */
export function attentionColor(w: number): string {
  const t = Math.max(0, Math.min(1, w))
  const low = [15, 23, 42]    // #0f172a
  const high = [96, 165, 250] // #60a5fa
  return rgb(lerp(low[0], high[0], t), lerp(low[1], high[1], t), lerp(low[2], high[2], t))
}

/**
 * Signed activation value → diverging red/neutral/blue.
 * `maxAbs` is the clip — values ≥ |maxAbs| saturate to the ends.
 */
export function divergingColor(v: number, maxAbs: number): string {
  if (!Number.isFinite(maxAbs) || maxAbs <= 0) return 'rgb(63, 63, 70)'
  const t = Math.max(-1, Math.min(1, v / maxAbs))

  const neutral = [35, 35, 38]  // #232326
  const pos = [96, 165, 250]    // blue
  const neg = [239, 68, 68]     // red

  if (t >= 0) {
    return rgb(lerp(neutral[0], pos[0], t), lerp(neutral[1], pos[1], t), lerp(neutral[2], pos[2], t))
  }
  const s = -t
  return rgb(lerp(neutral[0], neg[0], s), lerp(neutral[1], neg[1], s), lerp(neutral[2], neg[2], s))
}

export function maxAbs(values: number[] | Float32Array): number {
  let m = 0
  for (let i = 0; i < values.length; i++) {
    const a = Math.abs(values[i])
    if (a > m) m = a
  }
  return m
}
