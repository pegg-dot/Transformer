'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const T = 7
const D = 20

export default function ScenePositional({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pSin = smoothstep(0.25, 0.55, p)
  const pMerge = smoothstep(0.6, 1.0, p)

  const tokenCells = useMemo(() => {
    const rng = mulberry32(333)
    const v = new Float32Array(T * D)
    for (let i = 0; i < T * D; i++) v[i] = rng() * 2 - 1
    return v
  }, [])

  const sinCells = useMemo(() => {
    const v = new Float32Array(T * D)
    for (let r = 0; r < T; r++) {
      for (let c = 0; c < D; c++) {
        const freq = Math.pow(10000, -(2 * Math.floor(c / 2)) / D)
        const val = c % 2 === 0 ? Math.sin(r * freq) : Math.cos(r * freq)
        v[r * D + c] = val
      }
    }
    return v
  }, [])

  const mergedCells = useMemo(() => {
    const v = new Float32Array(T * D)
    for (let i = 0; i < T * D; i++) v[i] = (tokenCells[i] + sinCells[i]) * 0.5
    return v
  }, [tokenCells, sinCells])

  const CELL = 0.08
  const gridW = D * CELL
  const gridH = T * CELL

  const cx = INPUT_LEN / 2 + 0.2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, gridH + 0.6, 0.2]} size={0.17} opacity={0.9 * pEst}>
        Positional encoding
      </Label>

      <Slab
        position={[0, gridH / 2 + 0.2 - pMerge * gridH * 0.5, 0]}
        width={gridW}
        height={gridH}
        cells={{ cols: D, rows: T, values: tokenCells }}
        opacity={0.2 * (1 - pMerge * 0.5)}
        showCornerTicks
        tickLength={0.08}
      />
      <Label position={[-gridW / 2 - 0.3, gridH / 2 + 0.2 - pMerge * gridH * 0.5, 0]} size={0.07} color={COLORS.blue} opacity={0.9 * pEst}>
        embed
      </Label>

      <Slab
        position={[0, -gridH / 2 - 0.2 + pMerge * gridH * 0.5, 0]}
        width={gridW}
        height={gridH}
        cells={{ cols: D, rows: T, values: sinCells }}
        opacity={0.2 * pSin * (1 - pMerge * 0.5)}
        showCornerTicks
        tickLength={0.08}
      />
      <Label position={[-gridW / 2 - 0.3, -gridH / 2 - 0.2 + pMerge * gridH * 0.5, 0]} size={0.07} color={COLORS.violet} opacity={0.9 * pSin}>
        sin/cos
      </Label>

      {pMerge > 0.4 && (
        <Slab
          position={[0, 0, 0.04]}
          width={gridW}
          height={gridH}
          cells={{ cols: D, rows: T, values: mergedCells }}
          opacity={0.3 * smoothstep(0.4, 1.0, pMerge)}
          showCornerTicks
          tickLength={0.08}
        />
      )}
    </group>
  )
}
