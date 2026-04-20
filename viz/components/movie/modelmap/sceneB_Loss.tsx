'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const V = 12

export default function SceneLoss({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pCompare = smoothstep(0.3, 0.75, p)
  const pCE = smoothstep(0.75, 1.0, p)

  const { pred, targetIdx, ce } = useMemo(() => {
    const rng = mulberry32(555)
    const logits = Array.from({ length: V }).map(() => rng() * 3)
    const max = Math.max(...logits)
    const exps = logits.map((v) => Math.exp(v - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    const p = exps.map((v) => v / sum)
    const tIdx = 4
    const ceVal = -Math.log(p[tIdx] + 1e-9)
    return { pred: p, targetIdx: tIdx, ce: ceVal }
  }, [])

  const BAR_W = 0.1
  const BAR_H_MAX = 0.8

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.3, 0.3]} size={0.2} opacity={0.9 * pEst}>
        Cross-entropy loss
      </Label>

      <group position={[-1.0, 0, 0]}>
        <Label position={[0, -V * BAR_W / 2 - 0.25, 0]} size={0.1} color={COLORS.blue} opacity={0.9 * pEst}>
          prediction
        </Label>
        {pred.map((v, i) => (
          <mesh key={i} position={[(i - V / 2 + 0.5) * BAR_W, v * BAR_H_MAX / 2, 0]}>
            <boxGeometry args={[BAR_W * 0.8, Math.max(0.02, v * BAR_H_MAX), 0.03]} />
            <meshBasicMaterial color={COLORS.blue} transparent opacity={0.75 * pEst} />
          </mesh>
        ))}
      </group>

      <group position={[1.0, 0, 0]}>
        <Label position={[0, -V * BAR_W / 2 - 0.25, 0]} size={0.1} color={COLORS.gold} opacity={0.9 * pEst}>
          target
        </Label>
        {Array.from({ length: V }).map((_, i) => {
          const isTarget = i === targetIdx
          return (
            <mesh key={i} position={[(i - V / 2 + 0.5) * BAR_W, isTarget ? BAR_H_MAX / 2 : 0.02, 0]}>
              <boxGeometry args={[BAR_W * 0.8, isTarget ? BAR_H_MAX : 0.04, 0.03]} />
              <meshBasicMaterial color={isTarget ? COLORS.gold : COLORS.dim} transparent opacity={0.85 * pEst} />
            </mesh>
          )
        })}
      </group>

      {pCompare > 0 && (
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.8 * pCompare, 0.006]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.7 * pCompare} />
        </mesh>
      )}

      <Text
        position={[0, -1.0, 0.2]}
        fontSize={0.18}
        color={COLORS.red}
        fillOpacity={0.95 * pCE}
        anchorX="center"
        anchorY="middle"
      >
        {'H(p, q) = ' + ce.toFixed(2)}
      </Text>

      <Slab width={3.0} height={2.4} opacity={0.04 + 0.04 * pEst} showCornerTicks tickLength={0.15} />
    </group>
  )
}
