'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const PHASES = [
  { label: 'bytes', tokens: ['t', 'h', 'e', ' ', 'c', 'a', 't'] },
  { label: 'bigrams', tokens: ['th', 'e', ' ', 'ca', 't'] },
  { label: 'trigrams', tokens: ['the', ' ', 'cat'] },
]

export default function SceneBpe({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)
  const phaseIdx = Math.min(PHASES.length - 1, Math.floor(p * PHASES.length))
  const phase = PHASES[phaseIdx]
  const phaseLocal = (p * PHASES.length) % 1
  const pFuse = smoothstep(0.0, 0.6, phaseLocal)

  const CUBE = 0.12
  const spacing = 0.22
  const tokens = phase.tokens
  const startX = INPUT_LEN / 2 - ((tokens.length - 1) * spacing) / 2

  return (
    <group>
      <Label position={[INPUT_LEN / 2, 1.7, 0.3]} size={0.2} opacity={0.9 * pEst}>
        BPE merges
      </Label>
      <Label position={[INPUT_LEN / 2, 1.35, 0.3]} size={0.12} color={COLORS.violet} opacity={0.85 * pEst}>
        {'phase ' + (phaseIdx + 1) + ' · ' + phase.label}
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
        return (
          <group key={`${phaseIdx}-${i}`}>
            <mesh position={[xPos, 0.8, 0]} scale={[1, 1, 1 + pFuse * 0.6]}>
              <boxGeometry args={[CUBE * (1 + tok.length * 0.06), CUBE, CUBE]} />
              <meshBasicMaterial color={COLORS.violet} transparent opacity={0.7 * pFuse} />
            </mesh>
            <Text
              position={[xPos, 0.8, CUBE / 2 + 0.007]}
              fontSize={0.06}
              color={COLORS.fg}
              fillOpacity={0.95 * pFuse}
              anchorX="center"
              anchorY="middle"
            >
              {tok === ' ' ? '·' : tok}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
