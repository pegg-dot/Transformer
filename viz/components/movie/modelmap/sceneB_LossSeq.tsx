'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const T = 7

export default function SceneLossSeq({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pBars = smoothstep(0.25, 0.7, p)
  const pSum = smoothstep(0.7, 1.0, p)

  const losses = useMemo(() => {
    const rng = mulberry32(4242)
    return Array.from({ length: T }).map(() => 0.3 + rng() * 2.4)
  }, [])
  const total = losses.reduce((a, b) => a + b, 0)

  const SPACING = 0.32

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.3, 0.3]} size={0.18} opacity={0.9 * pEst}>
        Loss · every position
      </Label>

      {losses.map((loss, i) => {
        const x = (i - T / 2 + 0.5) * SPACING
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[-0.06, 0, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.03]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.75 * pEst} />
            </mesh>
            <mesh position={[0.06, 0, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.03]} />
              <meshBasicMaterial color={COLORS.gold} transparent opacity={0.75 * pEst} />
            </mesh>

            <mesh position={[0, 0.3 + loss * 0.15 * pBars, 0]}>
              <boxGeometry args={[0.12, Math.max(0.02, loss * 0.3 * pBars), 0.03]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={0.85 * pBars} />
            </mesh>
            <Text position={[0, 0.35 + loss * 0.3 * pBars + 0.08, 0]} fontSize={0.06} color={COLORS.red} fillOpacity={0.85 * pBars}>
              {loss.toFixed(2)}
            </Text>
          </group>
        )
      })}

      <group position={[T / 2 * SPACING + 0.35, 0.3, 0]}>
        <mesh position={[0, total * 0.05 * pSum, 0]}>
          <boxGeometry args={[0.2, Math.max(0.05, total * 0.1 * pSum), 0.04]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.9 * pSum} />
        </mesh>
        <Text position={[0, total * 0.1 * pSum + 0.12, 0]} fontSize={0.09} color={COLORS.red} fillOpacity={0.95 * pSum}>
          {'Σ = ' + total.toFixed(2)}
        </Text>
      </group>

      <Slab width={3.2} height={2.0} opacity={0.04 + 0.04 * pEst} showCornerTicks tickLength={0.15} />
    </group>
  )
}
