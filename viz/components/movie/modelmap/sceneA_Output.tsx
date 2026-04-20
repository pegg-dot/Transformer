'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, TOTAL_X } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'
import { usePrompt } from '../promptContext'

const GENERATED = ' on the mat'

export default function SceneOutput({ t, duration }: SceneProps) {
  const { prompt } = usePrompt()
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.15, p)

  const totalChars = GENERATED.length
  const charsVisible = Math.floor(p * totalChars)
  const visible = GENERATED.slice(0, charsVisible)

  return (
    <group>
      <Label position={[TOTAL_X / 2, 1.8, 0.3]} size={0.22} opacity={0.95 * pEst}>
        The output
      </Label>

      <Text
        position={[TOTAL_X / 2 - 0.4, -1.3, 0.3]}
        fontSize={0.15}
        color={COLORS.dim}
        fillOpacity={0.75 * pEst}
        anchorX="right"
        anchorY="middle"
      >
        {prompt}
      </Text>

      <Text
        position={[TOTAL_X / 2 - 0.4, -1.3, 0.3]}
        fontSize={0.15}
        color={COLORS.gold}
        fillOpacity={0.95 * pEst}
        anchorX="left"
        anchorY="middle"
      >
        {visible}
      </Text>
    </group>
  )
}
