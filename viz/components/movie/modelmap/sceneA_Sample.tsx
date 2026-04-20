'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, TOTAL_X, OUTPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const VOCAB = 14

export default function SceneSample({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)
  const pLogit = smoothstep(0.2, 0.55, p)
  const pSoft = smoothstep(0.55, 0.8, p)
  const pPick = smoothstep(0.8, 1.0, p)

  const { raw, soft, pickIdx } = useMemo(() => {
    const rng = mulberry32(12)
    const r = new Float32Array(VOCAB)
    for (let i = 0; i < VOCAB; i++) r[i] = (rng() * 2 - 1) * 3
    const max = Math.max(...r)
    const exps = Array.from(r).map((v) => Math.exp(v - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    const s = exps.map((v) => v / sum)
    const pick = s.indexOf(Math.max(...s))
    return { raw: r, soft: s, pickIdx: pick }
  }, [])

  const cx = TOTAL_X - OUTPUT_LEN / 2

  const BAR_H = 0.08
  const BAR_W_MAX = 0.8

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.17} opacity={0.9 * pEst}>
        Sample next token
      </Label>

      <mesh position={[-0.7, 0, 0]}>
        <boxGeometry args={[0.06, 1.3, 0.4]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.4 * pLogit} />
      </mesh>
      <Label position={[-0.7, 0.75, 0]} size={0.08} color={COLORS.gold} opacity={0.85 * pLogit}>W_out</Label>

      {Array.from({ length: VOCAB }).map((_, i) => {
        const rawNorm = raw[i] / 3
        const softNorm = soft[i]
        const barLen = BAR_W_MAX * ((1 - pSoft) * (0.4 + rawNorm * 0.3) + pSoft * softNorm * 3)
        const y = (VOCAB / 2 - i - 0.5) * BAR_H
        const isPick = i === pickIdx
        const color = isPick && pPick > 0.3 ? COLORS.gold : COLORS.fg
        return (
          <group key={i}>
            <mesh position={[-0.1 + barLen / 2, y, 0.05]}>
              <planeGeometry args={[barLen, BAR_H * 0.7]} />
              <meshBasicMaterial color={color} transparent opacity={0.7 + 0.25 * (isPick ? pPick : 0)} />
            </mesh>
            <Text position={[-0.25, y, 0]} fontSize={0.05} color={COLORS.dim} fillOpacity={0.7 * pLogit} anchorX="right">
              {'v' + i}
            </Text>
          </group>
        )
      })}

      {pPick > 0 && (
        <Label position={[0.4, (VOCAB / 2 - pickIdx - 0.5) * BAR_H + 0.18, 0]} size={0.1} color={COLORS.gold} opacity={0.95 * pPick}>
          ← sampled
        </Label>
      )}

      <Slab position={[0.1, 0, -0.05]} width={1.7} height={VOCAB * BAR_H + 0.4} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.08} />
    </group>
  )
}
