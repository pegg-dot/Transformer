'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const DIM = 24

export default function SceneLayerNorm({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)
  const pMean = smoothstep(0.2, 0.45, p)
  const pVar = smoothstep(0.5, 0.75, p)
  const pGB = smoothstep(0.75, 0.95, p)

  const raw = useMemo(() => {
    const rng = mulberry32(314)
    const r = new Float32Array(DIM)
    for (let i = 0; i < DIM; i++) r[i] = (rng() * 2 - 1) * 1.8 + 0.6
    return r
  }, [])

  const cx = blockStart(0) + BLOCK_LEN * 0.1

  const mean = raw.reduce((a, b) => a + b, 0) / DIM
  const variance = raw.reduce((a, b) => a + (b - mean) ** 2, 0) / DIM
  const std = Math.sqrt(variance + 1e-5)

  const bars = Array.from(raw).map((v) => {
    const afterMean = v - mean * pMean
    const afterVar = afterMean / (1 + (std - 1) * pVar)
    const gamma = 1 + 0.3 * pGB
    const beta = 0.1 * pGB
    return afterVar * gamma + beta
  })

  const BAR_W = 0.08
  const startX = -(DIM * BAR_W) / 2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.9, 0]} size={0.18} opacity={0.9 * pEst}>
        Layer Norm
      </Label>

      {bars.map((h, i) => (
        <mesh key={i} position={[startX + (i + 0.5) * BAR_W, h * 0.3, 0]}>
          <boxGeometry args={[BAR_W * 0.85, Math.max(0.05, Math.abs(h) * 0.6), 0.05]} />
          <meshBasicMaterial color={h >= 0 ? COLORS.blue : COLORS.red} transparent opacity={0.8 * pEst} />
        </mesh>
      ))}

      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[DIM * BAR_W + 0.2, 0.01]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.5 * pEst} />
      </mesh>

      <mesh position={[0, mean * 0.3 * (1 - pMean), 0.002]}>
        <planeGeometry args={[DIM * BAR_W + 0.2, 0.008]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.8 * smoothstep(0.1, 0.3, p) * (1 - pMean * 0.5)} />
      </mesh>
      <Text position={[DIM * BAR_W / 2 + 0.25, mean * 0.3 * (1 - pMean), 0]} fontSize={0.1} color={COLORS.violet} fillOpacity={0.85 * smoothstep(0.1, 0.3, p)}>
        μ
      </Text>

      <mesh position={[0, 0, 0.003]}>
        <planeGeometry args={[DIM * BAR_W + 0.2, std * 0.3 * 2 * (1 - pVar * 0.7)]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.15 * smoothstep(0.45, 0.6, p)} />
      </mesh>
      <Text position={[DIM * BAR_W / 2 + 0.25, -0.55, 0]} fontSize={0.1} color={COLORS.violet} fillOpacity={0.85 * smoothstep(0.45, 0.6, p)}>
        σ
      </Text>

      <group position={[0, 0.7 + (1 - smoothstep(0.7, 0.85, p)) * 0.6, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color={COLORS.mint} transparent opacity={0.9 * pGB} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={0.9 * pGB} />
        </mesh>
        <Text position={[-0.15, -0.2, 0]} fontSize={0.1} color={COLORS.mint} fillOpacity={0.9 * pGB}>γ</Text>
        <Text position={[0.15, -0.2, 0]} fontSize={0.1} color={COLORS.gold} fillOpacity={0.9 * pGB}>β</Text>
      </group>

      <Slab position={[0, 0, -0.05]} width={DIM * BAR_W + 0.8} height={2.1} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
