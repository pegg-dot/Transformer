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
  zOffset, tint, seed, opacity,
}: { zOffset: number; tint: string; seed: number; opacity: number }) {
  const cells = useMemo(() => {
    const rng = mulberry32(seed)
    return Array.from({ length: T * T }).map(() => rng())
  }, [seed])

  const gridW = T * CELL
  return (
    <group position={[0, 0, zOffset]}>
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

export default function SceneMulti({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pHeads = smoothstep(0.1, 0.55, p)
  const pConcat = smoothstep(0.55, 0.85, p)
  const pProj = smoothstep(0.85, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.35
  const tints = [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.gold, COLORS.red, '#f472b6']

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.9, 0.2]} size={0.18} opacity={0.9 * pHeads}>
        Multi-Head · 6 heads
      </Label>

      {Array.from({ length: HEADS }).map((_, h) => (
        <HeadGrid
          key={h}
          zOffset={-h * 0.12}
          tint={tints[h]}
          seed={h * 97 + 1}
          opacity={0.8 * pHeads * (1 - (h / HEADS) * 0.5)}
        />
      ))}

      <group position={[0.9, 0, 0]}>
        {Array.from({ length: HEADS }).map((_, h) => (
          <mesh key={h} position={[h * 0.06 - 0.18, 0, 0]}>
            <boxGeometry args={[0.05, 0.4, 0.03]} />
            <meshBasicMaterial color={tints[h]} transparent opacity={0.9 * pConcat} />
          </mesh>
        ))}
        <Label position={[0, 0.35, 0]} size={0.09} opacity={0.85 * pConcat}>
          concat
        </Label>
      </group>

      <group position={[1.7, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.4, 0.03]} />
          <meshBasicMaterial color={COLORS.fg} transparent opacity={0.9 * pProj} />
        </mesh>
        <Label position={[0, 0.35, 0]} size={0.09} opacity={0.85 * pProj}>
          W_O
        </Label>
      </group>

      <Slab position={[0.6, 0, -0.1]} width={2.8} height={1.6} opacity={0.04 + 0.05 * pHeads} showCornerTicks tickLength={0.12} />
    </group>
  )
}
