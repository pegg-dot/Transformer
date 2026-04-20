'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const MAX_T = 8

export default function SceneKvCache({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.1, p)
  const curT = Math.min(MAX_T, 1 + Math.floor(p * MAX_T))

  const cx = blockStart(0) + BLOCK_LEN * 0.35
  const CELL = 0.16

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.17} opacity={0.9 * pEst}>
        KV cache grows
      </Label>

      <group position={[-1.1, 0, 0]}>
        <mesh>
          <boxGeometry args={[CELL, CELL, 0.03]} />
          <meshBasicMaterial color={COLORS.blue} transparent opacity={0.9 * pEst} />
        </mesh>
        <Label position={[0, CELL + 0.12, 0]} size={0.1} color={COLORS.blue} opacity={0.9 * pEst}>
          Q (new)
        </Label>
        <Label position={[0, -CELL - 0.05, 0]} size={0.07} color={COLORS.dim} opacity={0.8 * pEst}>
          recomputed
        </Label>
      </group>

      <group position={[-0.4, 0, 0]}>
        {Array.from({ length: MAX_T }).map((_, i) => {
          const filled = i < curT
          return (
            <mesh key={i} position={[0, (MAX_T / 2 - i - 0.5) * CELL, 0]}>
              <boxGeometry args={[CELL, CELL * 0.9, 0.03]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={filled ? 0.8 : 0.1} />
            </mesh>
          )
        })}
        <Label position={[0, MAX_T / 2 * CELL + 0.15, 0]} size={0.1} color={COLORS.red} opacity={0.9 * pEst}>
          K archive
        </Label>
        <Label position={[0, -MAX_T / 2 * CELL - 0.15, 0]} size={0.07} color={COLORS.dim} opacity={0.8 * pEst}>
          stored once
        </Label>
      </group>

      <group position={[0.3, 0, 0]}>
        {Array.from({ length: MAX_T }).map((_, i) => {
          const filled = i < curT
          return (
            <mesh key={i} position={[0, (MAX_T / 2 - i - 0.5) * CELL, 0]}>
              <boxGeometry args={[CELL, CELL * 0.9, 0.03]} />
              <meshBasicMaterial color={COLORS.mint} transparent opacity={filled ? 0.8 : 0.1} />
            </mesh>
          )
        })}
        <Label position={[0, MAX_T / 2 * CELL + 0.15, 0]} size={0.1} color={COLORS.mint} opacity={0.9 * pEst}>
          V archive
        </Label>
      </group>

      <Label position={[1.1, 0, 0]} size={0.12} color={COLORS.gold} opacity={0.9 * pEst}>
        {'t = ' + curT}
      </Label>

      <Slab width={3.2} height={MAX_T * CELL + 0.8} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
