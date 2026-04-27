'use client'

import type { SceneProps } from './shared/types'
import {
  COLORS, N_BLOCKS, blockStart, BLOCK_LEN, TOTAL_X, OUTPUT_LEN, INPUT_LEN, SLAB_H,
} from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

/**
 * Backprop — gradient flows back, right to left.
 *
 * 3B1B beat: a red wave rolls *backwards* through the stack. Loss lights
 * up at the output, then a particle travels right→left depositing
 * gradient onto each block's weights as it passes. Each block flashes
 * red as the gradient lands, then dims to "weights nudged" gray. Below,
 * a small ∂L/∂W_i label fades in for each block once visited.
 */
export default function SceneBackprop({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.1, p)

  // 2 sweep cycles per scene so the rhythm is unmistakable.
  const cycles = 2
  const cycleP = (p * cycles) % 1
  const cycleIdx = Math.min(cycles - 1, Math.floor(p * cycles))

  // Particle x: starts at output edge, ends at input edge (right → left).
  const startX = TOTAL_X - OUTPUT_LEN / 2
  const endX = INPUT_LEN / 2
  const particleX = startX + (endX - startX) * cycleP

  // Detect which block the particle is in.
  const activeBlockIdx = (() => {
    for (let i = N_BLOCKS - 1; i >= 0; i--) {
      const left = blockStart(i)
      const right = blockStart(i) + BLOCK_LEN
      if (particleX >= left && particleX < right) return i
    }
    return -1
  })()

  // Loss bubble at output (always there during scene; pulses on cycle start).
  const lossPulse = smoothstep(0, 0.1, cycleP)

  return (
    <group>
      <Label position={[TOTAL_X / 2, 1.85, 0.3]} size={0.22} color={COLORS.red} opacity={0.95 * pEst}>
        gradient · flows backward
      </Label>
      <Label position={[TOTAL_X / 2, 1.55, 0.3]} size={0.085} color={COLORS.dim} opacity={0.9 * pEst}>
        every weight learns from how wrong the guess was
      </Label>

      {/* Loss bubble at output — pulses each cycle */}
      <group position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0.5]}>
        <mesh>
          <sphereGeometry args={[0.18 + 0.04 * lossPulse, 16, 16]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.85} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.18 + 0.25 * lossPulse} />
        </mesh>
        <Label position={[0, 0.45, 0]} size={0.1} color={COLORS.red} opacity={0.95 * pEst}>
          loss
        </Label>
      </group>

      {/* Trailing red wake — visible BEHIND the particle (to the right of it). */}
      <mesh position={[(particleX + startX) / 2, 0, 0.45]}>
        <planeGeometry args={[Math.max(0.01, startX - particleX), 0.05]} />
        <meshBasicMaterial color={COLORS.red} transparent opacity={0.55} />
      </mesh>

      {/* Particle */}
      <mesh position={[particleX, 0, 0.6]}>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshBasicMaterial color={COLORS.red} />
      </mesh>
      <mesh position={[particleX, 0, 0.55]}>
        <sphereGeometry args={[0.24, 18, 18]} />
        <meshBasicMaterial color={COLORS.red} transparent opacity={0.3} />
      </mesh>

      {/* Per-block: visited blocks (right of particle) glow dim red as
          "weights nudged"; the active block under the particle pulses bright. */}
      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        const cx = blockStart(i) + BLOCK_LEN / 2
        const blockEnd = blockStart(i) + BLOCK_LEN
        const visited = blockEnd > particleX
        const isActive = i === activeBlockIdx
        // Visited intensity grows over the second cycle so cumulative effect
        // is visible — by the end of run 2, all blocks have been deeply nudged.
        const visitedAmount = visited
          ? Math.min(1, (cycleIdx + 1) / cycles + (isActive ? 0.3 : 0))
          : 0
        return (
          <group key={i} position={[cx, 0, 0]}>
            <mesh position={[0, 0, 0.4]}>
              <boxGeometry args={[BLOCK_LEN * 0.92, 0.85, 0.5]} />
              <meshBasicMaterial
                color={COLORS.red}
                transparent
                opacity={0.06 + 0.4 * visitedAmount + (isActive ? 0.2 : 0)}
              />
            </mesh>
            <Label
              position={[0, -SLAB_H * 0.7, 0.3]}
              size={0.085}
              color={visited ? COLORS.red : COLORS.dim}
              opacity={(visited ? 0.95 : 0.5) * pEst}
            >
              {`∂L/∂W_${i}`}
            </Label>
          </group>
        )
      })}
    </group>
  )
}
