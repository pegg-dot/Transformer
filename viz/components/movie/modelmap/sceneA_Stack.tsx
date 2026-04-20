'use client'

import type { SceneProps } from './shared/types'
import { COLORS, N_BLOCKS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

export default function SceneStack({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.1, p)

  const pulse = p * N_BLOCKS
  const activeIdx = Math.min(N_BLOCKS - 1, Math.floor(pulse))
  const local = pulse - activeIdx

  return (
    <group>
      <Label position={[blockStart(N_BLOCKS / 2) + BLOCK_LEN / 2, 1.5, 0.3]} size={0.2} opacity={0.9 * pEst}>
        Six blocks · one direction
      </Label>

      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        const cx = blockStart(i) + BLOCK_LEN / 2
        const isActive = i === activeIdx
        const brightness = isActive ? 0.95 : 0.2
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
