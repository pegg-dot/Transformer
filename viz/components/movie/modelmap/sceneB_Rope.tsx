'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, smoothstep, loopPhase } from './shared/easing'
import { Label } from './shared/Label'

function ArrowFromOrigin({
  angle,
  length = 0.6,
  color,
  opacity,
}: {
  angle: number
  length?: number
  color: string
  opacity: number
}) {
  const x = Math.cos(angle) * length
  const y = Math.sin(angle) * length
  const headX = x - Math.cos(angle) * 0.07
  const headY = y - Math.sin(angle) * 0.07
  return (
    <group>
      <mesh position={[x / 2, y / 2, 0]} rotation={[0, 0, angle]}>
        <planeGeometry args={[length, 0.015]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[headX, headY, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  )
}

export default function SceneRope({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pos = loopPhase(t, 6) * 8
  const baseAngle = pos * 0.4
  const qAngle = baseAngle + 0.7
  const kAngle = baseAngle - 0.3

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.2, 0.3]} size={0.18} opacity={0.9 * pEst}>
        RoPE · rotate instead of add
      </Label>

      <mesh>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={COLORS.fg} />
      </mesh>

      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.8, 0.004]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.004, 1.8]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4} />
      </mesh>

      <ArrowFromOrigin angle={qAngle} length={0.7} color={COLORS.blue} opacity={0.95 * pEst} />
      <ArrowFromOrigin angle={kAngle} length={0.6} color={COLORS.red} opacity={0.95 * pEst} />

      <Text position={[0, -1.1, 0]} fontSize={0.14} color={COLORS.violet} fillOpacity={0.9 * pEst} anchorX="center" anchorY="middle">
        {'position = ' + pos.toFixed(1)}
      </Text>

      <Text position={[0.9, 0.7, 0]} fontSize={0.1} color={COLORS.mint} fillOpacity={0.9 * pEst} anchorX="center" anchorY="middle">
        {'Δθ = ' + (qAngle - kAngle).toFixed(2)}
      </Text>
    </group>
  )
}
