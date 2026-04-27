'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'

const D = 12      // input/output rows
const D4 = 24     // expanded rows (4× wider in the real model; visually 2×)

/**
 * FFN — expand · fire · compress.
 *
 * 3B1B beat: a vector enters from the left, gets MULTIPLIED by W1 into a
 * wider hidden layer (4d), passes through a non-linear activation that
 * "fires" certain rows, then gets compressed back through W2 to the
 * original width. The viewer watches the same vector's identity persist
 * even as its dimensionality bulges in the middle.
 *
 * Timeline:
 *   0.00–0.20  input vector grid fades in
 *   0.20–0.50  W1 matrix → expanded hidden vector (taller grid) fades in
 *   0.50–0.75  GELU "fires": some hidden rows brighten, others dim
 *   0.75–1.00  W2 matrix → output vector grid materializes
 */
export default function SceneFfn({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.85))
  const pInput = smoothstep(0.0, 0.2, p)
  const pExpand = smoothstep(0.2, 0.5, p)
  const pFire = smoothstep(0.5, 0.75, p)
  const pCompress = smoothstep(0.75, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.75

  // Input is the focused token's residual. Hidden = some non-linear mash of
  // it (deterministic, not real). Output = compressed back to D rows.
  const inputVec = useMemo(() => syntheticVector(307, D), [])
  const hiddenRaw = useMemo(() => syntheticVector(811, D4), [])
  // GELU-like firing: about 60% of rows light up strongly, others stay near zero.
  const hiddenFired = useMemo(
    () =>
      hiddenRaw.map((v, i) => {
        const fire = (i * 7919) % 5 < 3 // deterministic ~60% mask
        return fire ? v : v * 0.15
      }),
    [hiddenRaw]
  )
  const outputVec = useMemo(() => syntheticVector(919, D), [])

  const xIn = -2.2
  const xHidden = 0
  const xOut = 2.2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.55, 0.2]} size={0.18} color={COLORS.fg} opacity={0.95 * pInput}>
        FFN — expand · fire · compress
      </Label>

      {/* Input vector */}
      <VectorGrid
        position={[xIn, 0, 0.1]}
        values={inputVec}
        cellWidth={0.16}
        cellHeight={0.07}
        cellGap={0.008}
        label="x"
        fade={pInput}
      />

      {/* W1 expansion arrow + matrix */}
      <group position={[(xIn + xHidden) / 2, 0, 0]}>
        <mesh>
          <planeGeometry args={[Math.abs(xHidden - xIn) - 0.7, 0.012]} />
          <meshBasicMaterial color={COLORS.blue} transparent opacity={0.6 * pExpand} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.42, 0.16, 0.04]} />
          <meshBasicMaterial color={COLORS.blue} transparent opacity={0.4 * pExpand} />
        </mesh>
        <Label position={[0, 0.18, 0.05]} size={0.085} color={COLORS.fg} opacity={0.95 * pExpand}>
          W1 · 4d
        </Label>
      </group>

      {/* Hidden 4d vector — taller grid */}
      <VectorGrid
        position={[xHidden, 0, 0.1]}
        values={pFire > 0.05 ? hiddenFired : hiddenRaw}
        cellWidth={0.18}
        cellHeight={0.06}
        cellGap={0.005}
        label="hidden · 4d"
        fade={pExpand}
        pulseRow={Math.floor((p * 7) % D4)}
        pulseStrength={0.4 * pFire}
      />

      {/* GELU activation curve floats above the hidden grid */}
      <group position={[xHidden + 0.6, 0.95, 0]}>
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i / 19) * 0.7 - 0.35
          const y = 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)))
          return (
            <mesh key={i} position={[x, y * 0.5 + 0.05, 0]}>
              <sphereGeometry args={[0.014]} />
              <meshBasicMaterial color={COLORS.gold} transparent opacity={0.9 * pFire} />
            </mesh>
          )
        })}
        <Label position={[0, 0.27, 0]} size={0.07} color={COLORS.gold} opacity={0.9 * pFire}>
          GELU
        </Label>
      </group>

      {/* W2 compression arrow + matrix */}
      <group position={[(xHidden + xOut) / 2, 0, 0]}>
        <mesh>
          <planeGeometry args={[Math.abs(xOut - xHidden) - 0.7, 0.012]} />
          <meshBasicMaterial color={COLORS.mint} transparent opacity={0.6 * pCompress} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.42, 0.16, 0.04]} />
          <meshBasicMaterial color={COLORS.mint} transparent opacity={0.4 * pCompress} />
        </mesh>
        <Label position={[0, 0.18, 0.05]} size={0.085} color={COLORS.fg} opacity={0.95 * pCompress}>
          W2 · d
        </Label>
      </group>

      {/* Output vector */}
      <VectorGrid
        position={[xOut, 0, 0.1]}
        values={outputVec}
        cellWidth={0.16}
        cellHeight={0.07}
        cellGap={0.008}
        label="y"
        fade={pCompress}
      />
    </group>
  )
}
