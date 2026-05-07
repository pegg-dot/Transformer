'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { usePrompt } from '../promptContext'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'
import { displayTokens, chipLabel } from '@/lib/displayTokens'

export default function SceneTokens({ t, duration }: SceneProps) {
  const { prompt } = usePrompt()
  const tokens = useMemo(() => displayTokens(prompt).slice(0, 9), [prompt])
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pType = smoothstep(0, 0.3, p)
  const pDrop = smoothstep(0.35, 0.7, p)
  const pId = smoothstep(0.7, 1.0, p)

  const CUBE = 0.18
  const spacing = 0.24
  const startX = INPUT_LEN / 2 - ((tokens.length - 1) * spacing) / 2

  return (
    <group>
      <Label position={[INPUT_LEN / 2, 1.6, 0.3]} size={0.24} opacity={0.9 * pType}>
        {prompt}
      </Label>

      <Slab
        position={[INPUT_LEN / 2, 0.8, 0]}
        width={tokens.length * spacing + 0.4}
        height={0.6}
        color={COLORS.slabTint}
        opacity={0.1}
        showCornerTicks
        tickLength={0.12}
      />

      {tokens.map((tok, i) => {
        const xPos = startX + i * spacing
        const dropOffset = (1 - pDrop) * 1.2
        return (
          <group key={i}>
            <mesh position={[xPos, 0.8 + dropOffset, 0]}>
              <boxGeometry args={[CUBE, CUBE, CUBE]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.8 * pDrop} />
            </mesh>
            <Text
              position={[xPos, 0.8 + dropOffset, CUBE / 2 + 0.005]}
              fontSize={0.06}
              color={COLORS.fg}
              fillOpacity={0.95 * pDrop}
              anchorX="center"
              anchorY="middle"
            >
              {chipLabel(tok.text)}
            </Text>

            <Text
              position={[xPos, 0.5, 0.05]}
              fontSize={0.05}
              color={COLORS.violet}
              fillOpacity={0.9 * pId}
              anchorX="center"
              anchorY="middle"
            >
              {tok.id}
            </Text>

            <mesh position={[xPos, 0.38, 0]}>
              <planeGeometry args={[0.004, 0.12]} />
              <meshBasicMaterial color={COLORS.violet} transparent opacity={0.5 * pId} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
