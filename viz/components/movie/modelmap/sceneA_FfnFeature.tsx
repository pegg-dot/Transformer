'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep, pingPong } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const NEURONS = 48
const EXAMPLES = [
  { label: 'Golden Gate tokens', color: COLORS.gold },
  { label: 'code tokens', color: COLORS.mint },
  { label: 'French words', color: COLORS.violet },
]

export default function SceneFfnFeature({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)

  const neurons = useMemo(() => {
    const rng = mulberry32(2025)
    return Array.from({ length: NEURONS }).map(() => ({
      x: (rng() * 2 - 1) * 0.8,
      y: (rng() * 2 - 1) * 0.45,
      z: (rng() * 2 - 1) * 0.25,
      exampleIndex: Math.floor(rng() * EXAMPLES.length),
    }))
  }, [])

  const cyclePhase = (p * EXAMPLES.length) % 1
  const activeExample = Math.floor(p * EXAMPLES.length) % EXAMPLES.length
  const pulse = 0.6 + 0.4 * pingPong(cyclePhase * 2, 1)

  const cx = blockStart(0) + BLOCK_LEN * 0.75
  const example = EXAMPLES[activeExample]

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.9, 0.2]} size={0.17} opacity={0.9 * pEst}>
        Hidden neurons fire selectively
      </Label>

      {neurons.map((n, i) => {
        const isActive = n.exampleIndex === activeExample
        const brightness = isActive ? pulse : 0.18
        const color = isActive ? example.color : COLORS.dim
        return (
          <mesh key={i} position={[n.x, n.y, n.z]}>
            <sphereGeometry args={[isActive ? 0.04 : 0.025, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={brightness} />
          </mesh>
        )
      })}

      <Label position={[0, -0.7, 0]} size={0.12} color={example.color} opacity={0.9 * pEst}>
        {'detects: ' + example.label}
      </Label>

      <Slab width={2.2} height={1.7} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
