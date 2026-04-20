'use client'

import type { SceneProps } from './shared/types'
import { COLORS, N_BLOCKS, blockStart, BLOCK_LEN, TOTAL_X, OUTPUT_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

export default function SceneBackprop({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)

  const pulse = p * N_BLOCKS
  const activeIdx = Math.max(0, N_BLOCKS - 1 - Math.floor(pulse))
  const local = pulse - Math.floor(pulse)

  return (
    <group>
      <Label position={[TOTAL_X / 2, 1.5, 0.3]} size={0.2} color={COLORS.red} opacity={0.95 * pEst}>
        Gradient flows back
      </Label>

      <mesh position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0.3]}>
        <sphereGeometry args={[Math.max(0.06, 0.18 - p * 0.05), 12, 12]} />
        <meshBasicMaterial color={COLORS.red} transparent opacity={0.95} />
      </mesh>

      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        const cx = blockStart(i) + BLOCK_LEN / 2
        const isActive = i === activeIdx
        const brightness = isActive ? 0.9 : 0.15
        return (
          <group key={i} position={[cx, 0, 0]}>
            <mesh>
              <boxGeometry args={[BLOCK_LEN * 0.9, 0.8, 0.5]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={0.06 + 0.12 * brightness} />
            </mesh>
            {isActive && (
              <mesh position={[(1 - local - 0.5) * BLOCK_LEN * 0.9, 0, 0.3]}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshBasicMaterial color={COLORS.red} />
              </mesh>
            )}
            <Label position={[0, -0.8, 0]} size={0.08} color={COLORS.dim} opacity={0.8}>
              {'∂L/∂W_' + i}
            </Label>
          </group>
        )
      })}
    </group>
  )
}
