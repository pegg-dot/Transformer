'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const HEADS = 6
const T = 5
const CELL = 0.1

function HeadGrid({
  zOffset, tint, seed, opacity, scale = 1,
}: { zOffset: number; tint: string; seed: number; opacity: number; scale?: number }) {
  const cells = useMemo(() => {
    const rng = mulberry32(seed)
    return Array.from({ length: T * T }).map(() => rng())
  }, [seed])

  const gridW = T * CELL
  return (
    <group position={[0, 0, zOffset]} scale={scale}>
      {cells.map((v, i) => {
        const r = Math.floor(i / T)
        const c = i % T
        if (c > r) return null
        const x = -gridW / 2 + (c + 0.5) * CELL
        const y = gridW / 2 - (r + 0.5) * CELL
        return (
          <mesh key={i} position={[x, y, 0]}>
            <planeGeometry args={[CELL * 0.9, CELL * 0.9]} />
            <meshBasicMaterial color={tint} transparent opacity={v * opacity} />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * 3B1B beat: start with ONE attention head front-and-center, then five
 * more fan out into a row beside it. Makes the "one mechanism, six
 * times in parallel" idea visible as it happens, instead of just stacking
 * grids on top of each other.
 *
 * Timeline (normalized t / 0.75d so we land before the scene boundary):
 *   0.00–0.30  head 0 alone, large, centered.
 *   0.30–0.65  heads 1–5 fade-and-slide outward into the row.
 *              head 0 simultaneously shrinks back to fit the row.
 *   0.65–0.85  concat tower assembles from all 6 head outputs.
 *   0.85–1.00  W_O projection materializes.
 */
export default function SceneMulti({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pSolo = smoothstep(0, 0.18, p)
  const pSpread = smoothstep(0.30, 0.65, p)
  const pConcat = smoothstep(0.65, 0.85, p)
  const pProj = smoothstep(0.85, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.35
  const tints = [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.gold, COLORS.red, '#f472b6']

  // Row layout: heads spread across X, head 0 in the middle.
  const rowSpacing = 0.62
  // x positions in row: head 0 at center-left, then 1..5 spread to either side.
  const rowX = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((m) => m * rowSpacing * 0.5)
  // Solo center-of-camera position for head 0 before the spread.
  const soloX = 0
  // Head 0 lerps from solo position (large, central) to row position (smaller, in line).
  const head0X = soloX + (rowX[0] - soloX) * pSpread
  const head0Scale = 1.4 - 0.4 * pSpread

  return (
    <group position={[cx, 0, 0]}>
      {/* Title transitions from "one head" → "six heads in parallel". */}
      <Label position={[0, 0.92, 0.2]} size={0.15} color={COLORS.fg} opacity={0.95 * (1 - pSpread)}>
        one attention head
      </Label>
      <Label position={[0, 0.92, 0.2]} size={0.16} color={COLORS.fg} opacity={0.95 * pSpread}>
        six heads · in parallel
      </Label>

      {/* Head 0 (solo first, then takes its slot in the row). */}
      <group position={[head0X, 0, 0]}>
        <HeadGrid
          zOffset={0}
          tint={tints[0]}
          seed={1}
          opacity={0.95 * pSolo}
          scale={head0Scale}
        />
        <Label
          position={[0, -0.45 * head0Scale, 0.05]}
          size={0.085 * head0Scale}
          color={tints[0]}
          opacity={0.9 * pSolo}
        >
          head 0
        </Label>
      </group>

      {/* Heads 1..5 fade in and slide from head 0's position outward to their row slots. */}
      {[1, 2, 3, 4, 5].map((h) => {
        const targetX = rowX[h]
        const x = soloX + (targetX - soloX) * pSpread
        const op = 0.9 * pSpread
        return (
          <group key={h} position={[x, 0, 0]}>
            <HeadGrid zOffset={0} tint={tints[h]} seed={h * 97 + 1} opacity={op} />
            <Label position={[0, -0.4, 0.05]} size={0.07} color={tints[h]} opacity={op}>
              {`head ${h}`}
            </Label>
          </group>
        )
      })}

      {/* Brace under the heads once spread. */}
      <mesh position={[(rowX[0] + rowX[5]) / 2, -0.55, 0.2]}>
        <planeGeometry args={[rowX[5] - rowX[0] + 0.5, 0.012]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.4 * pSpread} />
      </mesh>

      {/* Concat tower: 6 thin vertical bars, one per head color. */}
      <group position={[0, -1.05, 0]}>
        {Array.from({ length: HEADS }).map((_, h) => (
          <mesh key={h} position={[(h - HEADS / 2 + 0.5) * 0.07, 0, 0]}>
            <boxGeometry args={[0.06, 0.32, 0.04]} />
            <meshBasicMaterial color={tints[h]} transparent opacity={0.9 * pConcat} />
          </mesh>
        ))}
        <Label position={[0, 0.27, 0]} size={0.085} opacity={0.85 * pConcat}>
          concat
        </Label>
      </group>

      {/* W_O projection. */}
      <group position={[0, -1.55, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.08, 0.04]} />
          <meshBasicMaterial color={COLORS.fg} transparent opacity={0.9 * pProj} />
        </mesh>
        <Label position={[0, -0.18, 0]} size={0.085} opacity={0.85 * pProj}>
          W_O
        </Label>
      </group>

      <Slab
        position={[0, -0.05, -0.1]}
        width={rowX[5] - rowX[0] + 1.0}
        height={2.5}
        opacity={0.04 + 0.05 * pSolo}
        showCornerTicks
        tickLength={0.12}
      />
    </group>
  )
}
