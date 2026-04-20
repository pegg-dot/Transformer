'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const CARDS = [
  { title: 'LayerNorm → RMSNorm', old: 'subtract μ · divide σ', nu: 'just divide ||x||', color: COLORS.blue, x: -1.5 },
  { title: 'GELU → SwiGLU', old: 'x · GELU(Wx)', nu: 'Swish(Wx) ⊙ Vx', color: COLORS.gold, x: 0 },
  { title: 'MHA → GQA', old: '8 Q · 8 K · 8 V', nu: '8 Q · 2 K · 2 V', color: COLORS.mint, x: 1.5 },
]

export default function SceneModern({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.4, 0.3]} size={0.2} opacity={0.9}>
        Modern simplifications
      </Label>

      {CARDS.map((card, i) => {
        const pReveal = smoothstep(i * 0.15, 0.3 + i * 0.15, p)
        return (
          <group key={i} position={[card.x, 0, 0]}>
            <Slab width={1.3} height={1.4} color={card.color} opacity={0.12 * pReveal} showCornerTicks tickLength={0.12} />
            <Text position={[0, 0.5, 0.05]} fontSize={0.1} color={card.color} fillOpacity={0.95 * pReveal} anchorX="center" anchorY="middle">
              {card.title}
            </Text>
            <Text position={[0, 0.1, 0.05]} fontSize={0.08} color={COLORS.dim} fillOpacity={0.9 * pReveal} anchorX="center" anchorY="middle">
              {card.old}
            </Text>
            <Text position={[0, -0.1, 0.05]} fontSize={0.09} color={COLORS.dim} fillOpacity={0.8 * pReveal} anchorX="center" anchorY="middle">
              ↓
            </Text>
            <Text position={[0, -0.35, 0.05]} fontSize={0.08} color={card.color} fillOpacity={0.95 * pReveal} anchorX="center" anchorY="middle">
              {card.nu}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
