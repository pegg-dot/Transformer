'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import {
  COLORS,
  TOTAL_X,
  N_BLOCKS,
  blockStart,
  BLOCK_LEN,
  INPUT_LEN,
  OUTPUT_LEN,
} from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'
import { usePrompt } from '../promptContext'
import { useLiveContinuation } from '@/lib/useLiveContinuation'

const GENERATED_FALLBACK = '...'

/**
 * Output — the full forward pass replay.
 *
 * 3B1B beat: a single bright "signal" particle starts at the input slab,
 * travels left-to-right along the stack of six blocks, and emerges at the
 * output slab where one new character lands. Loops twice during the
 * scene so the viewer reads the rhythm. Below the stack, the user's
 * prompt + the model's running continuation type out one char per cycle.
 */
export default function SceneOutput({ t, duration }: SceneProps) {
  const { prompt } = usePrompt()
  // Real model continuation for the actual user prompt — this is the
  // payoff: the same prompt that drove the cold-open chat shows up here
  // with the model's real generated tokens.
  const live = useLiveContinuation(prompt, 32)
  const generated = live.text.length > 0 ? live.text : GENERATED_FALLBACK
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.1, p)

  // 2 full traversal cycles per scene, so the viewer can see the rhythm.
  const cycles = 2
  const cycleP = (p * cycles) % 1
  const cycleIdx = Math.min(cycles - 1, Math.floor(p * cycles))

  // Particle x-position from input slab edge to output slab edge.
  const startX = INPUT_LEN / 2
  const endX = TOTAL_X - OUTPUT_LEN / 2
  const particleX = startX + (endX - startX) * cycleP

  // Which block is currently glowing (active under the particle)?
  const activeBlockIdx = (() => {
    for (let i = 0; i < N_BLOCKS; i++) {
      const left = blockStart(i)
      const right = blockStart(i) + BLOCK_LEN
      if (particleX >= left && particleX < right) return i
    }
    return -1
  })()

  // The particle "lands" at the end of each cycle → char appears.
  const totalChars = generated.length
  // Reveal more chars on each successive cycle.
  const charsThisRun = Math.floor(((cycleIdx + cycleP) / cycles) * totalChars)
  const visible = generated.slice(0, Math.min(totalChars, charsThisRun))

  // Pulse the output slab when the particle reaches it.
  const arrived = cycleP > 0.92
  const arrivePulse = arrived ? smoothstep(0.92, 1.0, cycleP) : 0

  return (
    <group>
      <Label position={[TOTAL_X / 2, 1.85, 0.3]} size={0.22} color={COLORS.fg} opacity={0.95 * pEst}>
        the full forward pass
      </Label>
      <Label position={[TOTAL_X / 2, 1.55, 0.3]} size={0.085} color={COLORS.dim} opacity={0.9 * pEst}>
        prompt → 6 blocks → next character → repeat
      </Label>

      {/* Highlight active block */}
      {activeBlockIdx >= 0 && (
        <mesh position={[blockStart(activeBlockIdx) + BLOCK_LEN / 2, 0, 0.4]}>
          <boxGeometry args={[BLOCK_LEN * 0.95, 0.85, 0.6]} />
          <meshBasicMaterial color={COLORS.blue} transparent opacity={0.25} />
        </mesh>
      )}

      {/* Trailing line — visible behind the particle for the current cycle */}
      <mesh position={[(startX + particleX) / 2, 0, 0.5]}>
        <planeGeometry args={[Math.max(0.01, particleX - startX), 0.04]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.5} />
      </mesh>

      {/* The particle itself */}
      <mesh position={[particleX, 0, 0.6]}>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.95} />
      </mesh>
      {/* Particle glow halo */}
      <mesh position={[particleX, 0, 0.55]}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.25} />
      </mesh>

      {/* Output slab pulse on arrival */}
      <mesh position={[endX, 0, 0.45]}>
        <boxGeometry args={[OUTPUT_LEN * 0.85, 0.9, 0.6]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.15 + 0.4 * arrivePulse} />
      </mesh>

      {/* Caption */}
      <Text
        position={[TOTAL_X / 2 - 0.4, -1.4, 0.3]}
        fontSize={0.16}
        color={COLORS.dim}
        fillOpacity={0.85 * pEst}
        anchorX="right"
        anchorY="middle"
      >
        {prompt}
      </Text>

      <Text
        position={[TOTAL_X / 2 - 0.4, -1.4, 0.3]}
        fontSize={0.16}
        color={COLORS.gold}
        fillOpacity={0.95 * pEst}
        anchorX="left"
        anchorY="middle"
      >
        {visible}
      </Text>

      <Text
        position={[TOTAL_X / 2, -1.65, 0.3]}
        fontSize={0.07}
        color={COLORS.dim}
        fillOpacity={0.75 * pEst}
        anchorX="center"
        anchorY="middle"
      >
        each character = one full pass through the stack
      </Text>
    </group>
  )
}
