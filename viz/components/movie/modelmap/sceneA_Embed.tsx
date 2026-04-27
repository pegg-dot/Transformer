'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep, loopPhase } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'
import { useTokenTrace } from '@/lib/useTokenTrace'

const V = 16
const D = 20
const VEC_ROWS = 12 // protagonist column compressed from d=384
const TRACE_TOKEN = 3

export default function SceneEmbed({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)

  const matrix = useMemo(() => {
    const rng = mulberry32(101)
    const m = new Float32Array(V * D)
    for (let i = 0; i < V * D; i++) m[i] = rng() * 2 - 1
    return m
  }, [])

  const cyclePeriod = 2.5
  const rowIdx = Math.floor(loopPhase(t, cyclePeriod * V) * V) % V
  const cycleLocal = loopPhase(t, cyclePeriod)
  const pDrop = smoothstep(0.0, 0.35, cycleLocal)
  const pLight = smoothstep(0.3, 0.55, cycleLocal)
  const pFly = smoothstep(0.55, 0.9, cycleLocal)

  const CELL = 0.07
  const matW = D * CELL
  const matH = V * CELL

  const cx = INPUT_LEN / 2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, matH / 2 + 0.5, 0.2]} size={0.16} opacity={0.9 * pEst}>
        Embedding lookup
      </Label>
      <Label position={[-matW / 2 - 0.3, matH / 2 + 0.25, 0]} size={0.08} color={COLORS.dim} opacity={0.8 * pEst}>
        V × d
      </Label>

      <Slab
        position={[0, 0, 0]}
        width={matW}
        height={matH}
        cells={{ cols: D, rows: V, values: matrix }}
        opacity={0.25}
        showCornerTicks
        tickLength={0.1}
      />

      <mesh position={[-matW / 2 - 0.4, matH / 2 - (rowIdx + 0.5) * CELL + (1 - pDrop) * 0.6, 0.1]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.9 * pDrop} />
      </mesh>

      <mesh position={[0, matH / 2 - (rowIdx + 0.5) * CELL, 0.03]}>
        <planeGeometry args={[matW + 0.04, CELL + 0.02]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.25 * pLight} />
      </mesh>

      <group position={[matW / 2 + 0.3 + 1.0 * pFly, matH / 2 - (rowIdx + 0.5) * CELL, 0.06]}>
        {Array.from({ length: D }).map((_, c) => {
          const v = matrix[rowIdx * D + c]
          const color = v >= 0 ? COLORS.blue : COLORS.red
          return (
            <mesh key={c} position={[(c - D / 2 + 0.5) * CELL, 0, 0]}>
              <boxGeometry args={[CELL * 0.9, CELL * 0.9, 0.04]} />
              <meshBasicMaterial color={color} transparent opacity={0.85 * pFly} />
            </mesh>
          )
        })}
      </group>

      {/* Protagonist column: the same row, materialized as a tall vertical
          vector grid that lingers after the horizontal "fly-out" finishes.
          Uses real captured embed_sum if loaded, falls back to synthetic. */}
      <ProtagonistEmbed position={[matW / 2 + 1.5, -0.2, 0.1]} fade={pFly} />
    </group>
  )
}

function ProtagonistEmbed({ position, fade }: { position: [number, number, number]; fade: number }) {
  const trace = useTokenTrace(TRACE_TOKEN, VEC_ROWS)
  const fallback = useMemo(() => syntheticVector(307, VEC_ROWS), [])
  const values = trace.ready && trace.embedSum ? trace.embedSum : fallback
  return (
    <VectorGrid
      position={position}
      values={values}
      cellWidth={0.18}
      cellHeight={0.08}
      cellGap={0.01}
      label={trace.ready ? `d=384 · "${trace.capturedTokenChar}"` : 'd=384'}
      fade={fade}
    />
  )
}
