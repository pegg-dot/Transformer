'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

const BATCH = 4

export default function SceneBpAccum({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pFlow = smoothstep(0.2, 0.65, p)
  const pAvg = smoothstep(0.65, 1.0, p)

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.3, 0.3]} size={0.18} color={COLORS.red} opacity={0.95 * pEst}>
        Gradients · B samples
      </Label>

      {Array.from({ length: BATCH }).map((_, b) => {
        const yOffset = (b - BATCH / 2 + 0.5) * 0.25
        const zOff = b * 0.08
        return (
          <group key={b}>
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 1.4 - i * 0.35 - (1 - pFlow) * 0.4
              return (
                <mesh key={i} position={[x, yOffset, zOff]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshBasicMaterial color={COLORS.red} transparent opacity={0.7 * pFlow * (1 - b / BATCH * 0.2)} />
                </mesh>
              )
            })}
          </group>
        )
      })}

      <group position={[-1.6, 0, 0]}>
        <mesh>
          <sphereGeometry args={[Math.max(0.04, 0.18 * pAvg), 16, 16]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.95 * pAvg} />
        </mesh>
        <Text position={[0, 0.35, 0]} fontSize={0.12} color={COLORS.red} fillOpacity={0.95 * pAvg} anchorX="center" anchorY="middle">
          (1/B) Σ
        </Text>
      </group>
    </group>
  )
}
