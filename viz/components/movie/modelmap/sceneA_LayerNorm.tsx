'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'

const ROWS = 14

/**
 * LayerNorm — re-center, re-scale, re-tilt.
 *
 * 3B1B beat: the input vector (left) is the focused token's residual
 * arriving at block 0. Mean μ and variance σ are computed across its
 * dimensions (visualized as horizontal lines). The vector then gets
 * mean-subtracted, std-divided, and finally scaled and shifted by
 * learnable γ and β. The output vector (right) has the same identity
 * but a controlled distribution.
 *
 * Timeline:
 *   0.00–0.18  input column fades in
 *   0.18–0.40  μ and σ lines fade in over the input
 *   0.40–0.65  vector recenters (mean-subtract) and rescales (÷σ)
 *   0.65–0.95  γ box scales · β box shifts → output column materializes
 */
export default function SceneLayerNorm({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.85))
  const pIn = smoothstep(0.0, 0.18, p)
  const pStat = smoothstep(0.18, 0.4, p)
  const pNorm = smoothstep(0.4, 0.65, p)
  const pGB = smoothstep(0.65, 0.95, p)

  // Input vector — synthetic but skewed (positive offset) so mean/variance
  // are visible. After norm: zero-mean, unit-variance. After γβ: scaled.
  const rawVec = useMemo(() => {
    const r = syntheticVector(919, ROWS)
    return r.map((v) => v * 0.7 + 0.4) // skew so μ ≠ 0
  }, [])

  const mean = rawVec.reduce((a, b) => a + b, 0) / ROWS
  const variance = rawVec.reduce((a, b) => a + (b - mean) ** 2, 0) / ROWS
  const std = Math.sqrt(variance + 1e-5)

  const stagedVec = useMemo(() => {
    return rawVec.map((v) => {
      const afterMean = v - mean * pNorm
      const afterStd = afterMean / (1 + (std - 1) * pNorm)
      const gamma = 1 + 0.4 * pGB
      const beta = 0.2 * pGB
      return Math.max(-1, Math.min(1, afterStd * gamma + beta))
    })
  }, [rawVec, mean, std, pNorm, pGB])

  const cx = blockStart(0) + BLOCK_LEN * 0.1

  const xIn = -1.5
  const xOut = 1.5

  // μ / σ overlay positions — drawn at fractional cell heights over the
  // input grid. Total grid height ≈ ROWS * (cellH + gap).
  const cellH = 0.075
  const gap = 0.008
  const gridH = ROWS * cellH + (ROWS - 1) * gap
  const meanY = (mean / 2) * gridH * (1 - pNorm) // settles toward 0 as we normalize
  const stdSpan = std * 0.5 * gridH * (1 - pNorm * 0.7)

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.45, 0.2]} size={0.18} color={COLORS.fg} opacity={0.95 * pIn}>
        Layer Norm
      </Label>
      <Label position={[0, 1.22, 0.2]} size={0.085} color={COLORS.dim} opacity={0.9 * pIn}>
        re-center · re-scale · γ β
      </Label>

      {/* Input vector */}
      <VectorGrid
        position={[xIn, 0, 0.1]}
        values={rawVec}
        cellWidth={0.18}
        cellHeight={cellH}
        cellGap={gap}
        label="x"
        fade={pIn}
      />

      {/* μ line over input grid */}
      <mesh position={[xIn, meanY, 0.18]}>
        <planeGeometry args={[0.36, 0.012]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.85 * pStat * (1 - pNorm * 0.7)} />
      </mesh>
      <Label position={[xIn + 0.32, meanY, 0.18]} size={0.085} color={COLORS.violet} opacity={0.9 * pStat * (1 - pNorm * 0.7)}>
        μ
      </Label>

      {/* σ band over input grid */}
      <mesh position={[xIn, 0, 0.16]}>
        <planeGeometry args={[0.36, Math.max(0.02, stdSpan)]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.18 * pStat * (1 - pNorm * 0.6)} />
      </mesh>
      <Label position={[xIn + 0.32, -0.5, 0.18]} size={0.085} color={COLORS.violet} opacity={0.9 * pStat * (1 - pNorm * 0.7)}>
        σ
      </Label>

      {/* Arrow from input to output */}
      <mesh position={[(xIn + xOut) / 2, 0, 0.05]}>
        <planeGeometry args={[Math.abs(xOut - xIn) - 0.6, 0.012]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.45 * pNorm} />
      </mesh>

      {/* γ / β tile in the middle */}
      <group position={[0, 0.7, 0.1]}>
        <mesh position={[-0.18, 0, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.05]} />
          <meshBasicMaterial color={COLORS.mint} transparent opacity={0.85 * pGB} />
        </mesh>
        <Label position={[-0.18, 0, 0.05]} size={0.1} color={COLORS.fg} opacity={0.95 * pGB}>
          γ
        </Label>
        <mesh position={[0.18, 0, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.05]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.85 * pGB} />
        </mesh>
        <Label position={[0.18, 0, 0.05]} size={0.1} color={COLORS.fg} opacity={0.95 * pGB}>
          β
        </Label>
        <Label position={[0, -0.18, 0]} size={0.07} color={COLORS.dim} opacity={0.85 * pGB}>
          learnable
        </Label>
      </group>

      {/* Output vector */}
      <VectorGrid
        position={[xOut, 0, 0.1]}
        values={stagedVec}
        cellWidth={0.18}
        cellHeight={cellH}
        cellGap={gap}
        label="LN(x)"
        fade={Math.max(pNorm, pGB)}
      />

      <Slab
        position={[0, 0, -0.1]}
        width={Math.abs(xOut - xIn) + 1.0}
        height={2.3}
        opacity={0.04 + 0.05 * pIn}
        showCornerTicks
        tickLength={0.12}
      />
    </group>
  )
}
