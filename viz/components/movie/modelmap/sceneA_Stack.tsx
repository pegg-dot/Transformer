'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, N_BLOCKS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'

const VEC_ROWS = 12 // compressed view of the d=384 residual stream

export default function SceneStack({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.1, p)

  const pulse = p * N_BLOCKS
  const activeIdx = Math.min(N_BLOCKS - 1, Math.floor(pulse))
  const local = pulse - activeIdx

  // Deterministic per-block vectors: block N's vector = block N-1's vector
  // blended 70/30 with a delta. The viewer reads "the same signal,
  // gradually transformed" instead of six unrelated grids.
  const blockVectors = useMemo(() => {
    const base = syntheticVector(7, VEC_ROWS)
    const out: number[][] = [base]
    for (let i = 1; i < N_BLOCKS; i++) {
      const delta = syntheticVector(7 + i * 13, VEC_ROWS)
      const prev = out[i - 1]
      const next = prev.map((v, j) =>
        Math.max(-1, Math.min(1, v * 0.7 + delta[j] * 0.3))
      )
      out.push(next)
    }
    return out
  }, [])

  return (
    <group>
      <Label position={[blockStart(N_BLOCKS / 2) + BLOCK_LEN / 2, 1.5, 0.3]} size={0.2} opacity={0.9 * pEst}>
        Six blocks · one direction
      </Label>

      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        const cx = blockStart(i) + BLOCK_LEN / 2
        const isActive = i === activeIdx
        const wasActive = i < activeIdx
        const brightness = isActive ? 0.95 : 0.2
        // Visited blocks read at full saturation, the active one pulses,
        // the unvisited ones stay faint.
        const vecFade = isActive ? 1 : wasActive ? 0.7 : 0.3
        return (
          <group key={i} position={[cx, 0, 0]}>
            <mesh>
              <boxGeometry args={[BLOCK_LEN * 0.9, 0.8, 0.5]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.05 + 0.15 * brightness} />
            </mesh>

            {isActive && (
              <mesh position={[(local - 0.5) * BLOCK_LEN * 0.9, 0, 0.3]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color={COLORS.gold} transparent opacity={0.95} />
              </mesh>
            )}

            {/* Vector protagonist: this block's view of the same token's
                residual stream. The progression across blocks is the
                whole point of Act III. */}
            <VectorGrid
              position={[0, -1.65, 0.2]}
              values={blockVectors[i]}
              cellWidth={0.18}
              cellHeight={0.06}
              cellGap={0.008}
              fade={vecFade * pEst}
            />

            <Label position={[0, -0.8, 0]} size={0.1} color={isActive ? COLORS.fg : COLORS.dim} opacity={0.9}>
              {'block ' + i}
            </Label>
          </group>
        )
      })}

      <mesh position={[(blockStart(0) + blockStart(N_BLOCKS - 1) + BLOCK_LEN) / 2, 0.8, 0.25]}>
        <planeGeometry args={[blockStart(N_BLOCKS - 1) + BLOCK_LEN - blockStart(0), 0.015]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.6} />
      </mesh>
      <Label position={[(blockStart(0) + blockStart(N_BLOCKS - 1) + BLOCK_LEN) / 2, 1.0, 0.25]} size={0.09} color={COLORS.mint} opacity={0.9}>
        residual
      </Label>
    </group>
  )
}
