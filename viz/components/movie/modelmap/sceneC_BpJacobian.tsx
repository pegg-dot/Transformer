'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const DIM = 10

export default function SceneBpJacobian({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pInput = smoothstep(0.15, 0.4, p)
  const pSweep = smoothstep(0.4, 0.9, p)
  const pOutput = smoothstep(0.6, 1.0, p)

  const cells = useMemo(() => {
    const rng = mulberry32(11)
    const v = new Float32Array(DIM * DIM)
    for (let i = 0; i < DIM * DIM; i++) v[i] = (rng() * 2 - 1) * 0.8
    return v
  }, [])

  const hiRow = Math.floor(pSweep * DIM) % DIM

  const CELL = 0.1
  const matSize = DIM * CELL
  const cx = blockStart(0) + BLOCK_LEN / 2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.16} color={COLORS.red} opacity={0.95 * pEst}>
        Jacobian ∂y/∂x
      </Label>

      <group position={[matSize / 2 + 0.35, 0, 0]}>
        {Array.from({ length: DIM }).map((_, i) => (
          <mesh key={i} position={[0, (DIM / 2 - i - 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.8, CELL * 0.8, 0.03]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.85 * pInput} />
          </mesh>
        ))}
        <Label position={[0, matSize / 2 + 0.15, 0]} size={0.08} color={COLORS.red} opacity={0.9 * pInput}>
          ∂L/∂y
        </Label>
      </group>

      <Slab
        width={matSize}
        height={matSize}
        cells={{ cols: DIM, rows: DIM, values: cells }}
        opacity={0.2 * pEst}
        showCornerTicks
        tickLength={0.08}
      />

      <mesh position={[0, matSize / 2 - (hiRow + 0.5) * CELL, 0.01]}>
        <planeGeometry args={[matSize, CELL]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.25 * pSweep} />
      </mesh>

      <group position={[-matSize / 2 - 0.35, 0, 0]}>
        {Array.from({ length: DIM }).map((_, i) => (
          <mesh key={i} position={[0, (DIM / 2 - i - 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.8, CELL * 0.8, 0.03]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.85 * pOutput} />
          </mesh>
        ))}
        <Label position={[0, matSize / 2 + 0.15, 0]} size={0.08} color={COLORS.red} opacity={0.9 * pOutput}>
          ∂L/∂x
        </Label>
      </group>
    </group>
  )
}
