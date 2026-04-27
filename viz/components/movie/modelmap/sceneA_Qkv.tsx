'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'

const ROWS = 12

/**
 * Q · K · V — three projections of the same vector.
 *
 * 3B1B beat: ONE input vector (the focused token's residual) sits on the
 * left as a tall numeric column. Three labelled projection matrices fan
 * out from it. As each projection lands, a Q / K / V vector materializes
 * on the right — same shape as the input, different colors, different
 * values. The whole story reads horizontally: input → projections →
 * three "roles" of the same vector.
 *
 * Timeline:
 *   0.00–0.20  input vector grid fades in (left)
 *   0.20–0.55  W_Q / W_K / W_V matrix tiles fade in (center) and beams
 *              run from input → matrix
 *   0.55–0.95  Q / K / V vector grids materialize (right) one at a time
 */
export default function SceneQkv({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.85))
  const pInput = smoothstep(0.0, 0.2, p)
  const pMat = smoothstep(0.18, 0.55, p)
  const pQ = smoothstep(0.55, 0.7, p)
  const pK = smoothstep(0.65, 0.8, p)
  const pV = smoothstep(0.75, 0.92, p)

  const inputVec = useMemo(() => syntheticVector(307, ROWS), [])
  const qVec = useMemo(() => syntheticVector(401, ROWS), [])
  const kVec = useMemo(() => syntheticVector(503, ROWS), [])
  const vVec = useMemo(() => syntheticVector(601, ROWS), [])

  const cx = blockStart(0) + BLOCK_LEN * 0.2

  // Lay out: input on the far left, matrices in the middle, Q/K/V on the right
  // stacked vertically.
  const xInput = -2.4
  const xMat = -0.4
  const xOut = 1.7

  const yQ = 1.05
  const yK = 0.0
  const yV = -1.05

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.95, 0.2]} size={0.18} color={COLORS.fg} opacity={0.95 * pInput}>
        Q · K · V projections
      </Label>
      <Label position={[0, 1.7, 0.2]} size={0.085} color={COLORS.dim} opacity={0.9 * pInput}>
        one vector · three projections
      </Label>

      {/* Input vector — the focused token's residual */}
      <VectorGrid
        position={[xInput, 0, 0.1]}
        values={inputVec}
        cellWidth={0.16}
        cellHeight={0.07}
        cellGap={0.008}
        label="x"
        fade={pInput}
      />

      {/* Three projection matrices, each with a beam to/from input */}
      {[
        { y: yQ, color: COLORS.blue, label: 'W_Q', op: pMat, outOp: pQ },
        { y: yK, color: COLORS.red, label: 'W_K', op: pMat, outOp: pK },
        { y: yV, color: COLORS.mint, label: 'W_V', op: pMat, outOp: pV },
      ].map((spec, i) => (
        <group key={i}>
          {/* Beam from input to matrix */}
          <mesh position={[(xInput + xMat) / 2 + 0.25, spec.y * 0.5, 0]}>
            <planeGeometry args={[Math.abs(xMat - xInput) - 0.7, 0.012]} />
            <meshBasicMaterial color={spec.color} transparent opacity={0.45 * spec.op} />
          </mesh>

          {/* Matrix tile */}
          <group position={[xMat, spec.y, 0]}>
            <mesh>
              <boxGeometry args={[0.42, 0.42, 0.06]} />
              <meshBasicMaterial color={spec.color} transparent opacity={0.35 + 0.35 * spec.op} />
            </mesh>
            <Label position={[0, 0, 0.08]} size={0.12} color={COLORS.fg} opacity={0.95 * spec.op}>
              {spec.label}
            </Label>
          </group>

          {/* Beam from matrix to output */}
          <mesh position={[(xMat + xOut) / 2 + 0.1, spec.y, 0]}>
            <planeGeometry args={[Math.abs(xOut - xMat) - 0.5, 0.012]} />
            <meshBasicMaterial color={spec.color} transparent opacity={0.55 * spec.outOp} />
          </mesh>
        </group>
      ))}

      {/* Output Q / K / V grids on the right */}
      <VectorGrid
        position={[xOut, yQ, 0.1]}
        values={qVec}
        cellWidth={0.13}
        cellHeight={0.05}
        cellGap={0.006}
        posColor={COLORS.blue}
        label="Q"
        fade={pQ}
      />
      <VectorGrid
        position={[xOut, yK, 0.1]}
        values={kVec}
        cellWidth={0.13}
        cellHeight={0.05}
        cellGap={0.006}
        posColor={COLORS.red}
        label="K"
        fade={pK}
      />
      <VectorGrid
        position={[xOut, yV, 0.1]}
        values={vVec}
        cellWidth={0.13}
        cellHeight={0.05}
        cellGap={0.006}
        posColor={COLORS.mint}
        label="V"
        fade={pV}
      />

      <Slab
        position={[(xInput + xOut) / 2, 0, -0.1]}
        width={Math.abs(xOut - xInput) + 1.2}
        height={2.6}
        opacity={0.04 + 0.05 * pInput}
        showCornerTicks
        tickLength={0.14}
      />
    </group>
  )
}
