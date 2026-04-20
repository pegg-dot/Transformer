'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const B = 6
const T = 6

export default function SceneLossBatch({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pCollapse = smoothstep(0.65, 1.0, p)

  const cells = useMemo(() => {
    const rng = mulberry32(7777)
    const v = new Float32Array(B * T)
    for (let i = 0; i < B * T; i++) v[i] = 0.3 + rng() * 2.4
    return v
  }, [])
  const mean = Array.from(cells).reduce((a, b) => a + b, 0) / (B * T)

  const SIZE = 0.14
  const pullIn = pCollapse

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.4, 0.3]} size={0.18} opacity={0.9 * pEst}>
        Loss · batch
      </Label>

      {Array.from({ length: B }).map((_, b) =>
        Array.from({ length: T }).map((_, tCol) => {
          const v = cells[b * T + tCol]
          const xPos = (tCol - T / 2 + 0.5) * SIZE * (1 - pullIn)
          const yPos = (b - B / 2 + 0.5) * SIZE * (1 - pullIn)
          const zPos = (b * 0.05 - B * 0.025) * (1 - pullIn)
          return (
            <mesh key={`${b}-${tCol}`} position={[xPos, yPos, zPos]}>
              <boxGeometry args={[SIZE * 0.8, SIZE * 0.8, 0.04]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={(0.4 + v * 0.25) * pEst} />
            </mesh>
          )
        })
      )}

      <Text position={[0, -1.0, 0.2]} fontSize={0.18} color={COLORS.red} fillOpacity={0.95 * pCollapse} anchorX="center" anchorY="middle">
        {'mean = ' + mean.toFixed(3)}
      </Text>
      <Label position={[0, 0.9, 0]} size={0.09} color={COLORS.dim} opacity={0.85 * pEst}>
        {'B × T = ' + (B * T) + ' scalar losses'}
      </Label>

      <Slab width={2.6} height={2.3} opacity={0.04 + 0.04 * pEst} showCornerTicks tickLength={0.14} />
    </group>
  )
}
