'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const MAX_T = 8
const CELL = 0.16

/**
 * KV cache — one new K/V column per generated step.
 *
 * 3B1B beat: every generation step computes a fresh Q for the new token,
 * but K and V for prior tokens stay where they were. Visually: one Q box
 * pulses (recomputed each step), while a K column and V column GROW —
 * each step adds a new highlighted cell at the bottom and the older cells
 * settle into "archived" gray.
 *
 * Timeline runs in cycles of 1.4s — every cycle one new step arrives,
 * pulses, and gets archived. Plays for 4 visible steps over the scene.
 */
export default function SceneKvCache({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.1, p)

  // Step index 0..MAX_T inclusive grows over the scene.
  const stepP = Math.min(1, p / 0.85)
  const curStepF = stepP * MAX_T
  const curStepInt = Math.min(MAX_T, Math.floor(curStepF))
  const curStepFrac = curStepF - curStepInt

  // The "just-arrived" cell pulse — 0..1 for the most recent slot.
  const arrivePulse = smoothstep(0, 0.5, curStepFrac)

  const cx = blockStart(0) + BLOCK_LEN * 0.35

  // Q column position
  const xQ = -1.4
  const xK = -0.5
  const xV = 0.45
  const xLabel = 1.4

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.05, 0.2]} size={0.18} color={COLORS.fg} opacity={0.95 * pEst}>
        KV cache · grows by one each step
      </Label>
      <Label position={[0, 0.85, 0.2]} size={0.075} color={COLORS.dim} opacity={0.9 * pEst}>
        recompute Q · reuse K · reuse V
      </Label>

      {/* Q (new for every step) */}
      <group position={[xQ, 0, 0]}>
        <mesh>
          <boxGeometry args={[CELL, CELL, 0.03]} />
          <meshBasicMaterial
            color={COLORS.blue}
            transparent
            opacity={(0.55 + 0.4 * arrivePulse) * pEst}
          />
        </mesh>
        <Label position={[0, CELL + 0.14, 0]} size={0.1} color={COLORS.blue} opacity={0.95 * pEst}>
          Q
        </Label>
        <Label position={[0, -CELL - 0.08, 0]} size={0.06} color={COLORS.dim} opacity={0.85 * pEst}>
          recomputed
        </Label>
      </group>

      {/* K archive — grows downward */}
      <group position={[xK, 0, 0]}>
        {Array.from({ length: MAX_T }).map((_, i) => {
          const isFilled = i < curStepInt
          const isArriving = i === curStepInt && arrivePulse > 0.05
          const op = isArriving
            ? 0.4 + 0.55 * arrivePulse
            : isFilled
              ? 0.55
              : 0.06
          const cellColor = isArriving ? COLORS.gold : COLORS.red
          return (
            <mesh
              key={i}
              position={[0, (MAX_T / 2 - i - 0.5) * CELL, 0]}
            >
              <boxGeometry args={[CELL, CELL * 0.9, 0.03]} />
              <meshBasicMaterial color={cellColor} transparent opacity={op * pEst} />
            </mesh>
          )
        })}
        <Label position={[0, (MAX_T / 2) * CELL + 0.15, 0]} size={0.1} color={COLORS.red} opacity={0.95 * pEst}>
          K archive
        </Label>
        <Label position={[0, -(MAX_T / 2) * CELL - 0.13, 0]} size={0.06} color={COLORS.dim} opacity={0.85 * pEst}>
          appended once
        </Label>
      </group>

      {/* V archive — grows downward */}
      <group position={[xV, 0, 0]}>
        {Array.from({ length: MAX_T }).map((_, i) => {
          const isFilled = i < curStepInt
          const isArriving = i === curStepInt && arrivePulse > 0.05
          const op = isArriving
            ? 0.4 + 0.55 * arrivePulse
            : isFilled
              ? 0.55
              : 0.06
          const cellColor = isArriving ? COLORS.gold : COLORS.mint
          return (
            <mesh
              key={i}
              position={[0, (MAX_T / 2 - i - 0.5) * CELL, 0]}
            >
              <boxGeometry args={[CELL, CELL * 0.9, 0.03]} />
              <meshBasicMaterial color={cellColor} transparent opacity={op * pEst} />
            </mesh>
          )
        })}
        <Label position={[0, (MAX_T / 2) * CELL + 0.15, 0]} size={0.1} color={COLORS.mint} opacity={0.95 * pEst}>
          V archive
        </Label>
      </group>

      {/* Step counter */}
      <group position={[xLabel, 0, 0]}>
        <Label position={[0, 0.15, 0]} size={0.08} color={COLORS.dim} opacity={0.85 * pEst}>
          step
        </Label>
        <Label position={[0, -0.02, 0]} size={0.16} color={COLORS.gold} opacity={0.95 * pEst}>
          {`t = ${Math.min(MAX_T, curStepInt + (arrivePulse > 0.05 ? 1 : 0))}`}
        </Label>
        <Label position={[0, -0.2, 0]} size={0.06} color={COLORS.dim} opacity={0.8 * pEst}>
          {`/ ${MAX_T}`}
        </Label>
      </group>

      <Slab width={3.4} height={MAX_T * CELL + 0.85} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
