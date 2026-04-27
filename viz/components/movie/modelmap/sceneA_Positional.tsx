'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'

const ROWS = 12

/**
 * Positional encoding — three vectors, one sum.
 *
 * 3B1B beat: the embedding vector (left) and a sinusoidal position
 * vector (middle) literally add together into a single combined vector
 * (right). Same shape as the embedding, with the positional signal
 * mixed in. The viewer reads "the position gets baked into the same
 * vector" without needing the math.
 *
 * Timeline:
 *   0.00–0.20  embedding column fades in
 *   0.20–0.45  position pattern column fades in
 *   0.45–0.75  '+' / '=' operators pulse; combined vector materializes
 *   0.75–1.00  embed / pos columns recede slightly so the sum is hero
 */
export default function ScenePositional({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.85))
  const pEmbed = smoothstep(0.0, 0.2, p)
  const pPos = smoothstep(0.2, 0.45, p)
  const pSum = smoothstep(0.45, 0.75, p)
  const pHero = smoothstep(0.75, 1.0, p)

  const embedVec = useMemo(() => syntheticVector(307, ROWS), [])

  // Real sinusoidal positional encoding sampled at the focused token (pos=3),
  // alternating sin / cos across dimensions with geometric frequencies.
  const posVec = useMemo(() => {
    const pos = 3
    return Array.from({ length: ROWS }).map((_, i) => {
      const freq = Math.pow(10000, -(2 * Math.floor(i / 2)) / ROWS)
      return i % 2 === 0 ? Math.sin(pos * freq) : Math.cos(pos * freq)
    })
  }, [])

  const sumVec = useMemo(
    () => embedVec.map((v, i) => Math.max(-1, Math.min(1, v + posVec[i] * 0.6))),
    [embedVec, posVec]
  )

  const cx = INPUT_LEN / 2 + 0.4

  const xEmbed = -1.6
  const xPos = -0.1
  const xSum = 1.4

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.55, 0.2]} size={0.18} color={COLORS.fg} opacity={0.95 * pEmbed}>
        Positional encoding
      </Label>
      <Label position={[0, 1.32, 0.2]} size={0.085} color={COLORS.dim} opacity={0.9 * pEmbed}>
        position gets baked into the same vector
      </Label>

      <VectorGrid
        position={[xEmbed, 0, 0.1]}
        values={embedVec}
        cellWidth={0.16}
        cellHeight={0.07}
        cellGap={0.008}
        label="embed"
        fade={pEmbed * (1 - pHero * 0.45)}
      />

      <group position={[(xEmbed + xPos) / 2 + 0.1, 0, 0]}>
        <Label position={[0, 0, 0.1]} size={0.22} color={COLORS.fg} opacity={0.95 * pPos}>
          +
        </Label>
      </group>

      <VectorGrid
        position={[xPos, 0, 0.1]}
        values={posVec}
        cellWidth={0.16}
        cellHeight={0.07}
        cellGap={0.008}
        posColor={COLORS.violet}
        negColor="#f59e0b"
        label="pos · sin/cos"
        fade={pPos * (1 - pHero * 0.45)}
      />

      <group position={[(xPos + xSum) / 2 + 0.05, 0, 0]}>
        <Label position={[0, 0.02, 0.1]} size={0.16} color={COLORS.fg} opacity={0.95 * pSum}>
          =
        </Label>
      </group>

      <VectorGrid
        position={[xSum, 0, 0.1]}
        values={sumVec}
        cellWidth={0.18}
        cellHeight={0.075}
        cellGap={0.008}
        label="x + pos"
        fade={pSum + 0.3 * pHero}
      />

      <Slab
        position={[(xEmbed + xSum) / 2, 0, -0.1]}
        width={Math.abs(xSum - xEmbed) + 1.0}
        height={2.4}
        opacity={0.04 + 0.05 * pEmbed}
        showCornerTicks
        tickLength={0.12}
      />
    </group>
  )
}
