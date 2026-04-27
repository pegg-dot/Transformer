'use client'

import type { SceneProps } from './shared/types'
import {
  COLORS,
  N_BLOCKS,
  blockStart,
  BLOCK_LEN,
  SLAB_H,
  INPUT_LEN,
  OUTPUT_LEN,
  TOTAL_X,
  MID_X,
} from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

/**
 * Cold-open 3D side. `ModelMap3D` already renders a dim-mode-B StackBackdrop
 * for every scene, so we don't need to draw one ourselves — the existing
 * backdrop IS the tower visible behind the 2D chat UI. All this component does
 * is fade in two reveal labels over the last ~5s of the 20s scene, so the
 * audience has language attached to what they're now looking at as the 2D
 * dissolves.
 *
 * Drives per-block "wake up" pulses bottom-to-top to feel like the tower
 * comes alive.
 */
export default function SceneIntroReveal({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const labelP = smoothstep(0.75, 0.98, p)

  return (
    <group>
      {/* Per-block pulse wave: each block lights up in sequence across t∈[0.7, 0.95]. */}
      {Array.from({ length: N_BLOCKS }).map((_, bi) => {
        const cx = blockStart(bi) + BLOCK_LEN / 2
        const start = 0.7 + (bi / N_BLOCKS) * 0.2
        const end = start + 0.08
        const pop = smoothstep(start, end, p)
        return (
          <mesh key={bi} position={[cx, 0, 0.3]}>
            <planeGeometry args={[BLOCK_LEN * 0.9, SLAB_H]} />
            <meshBasicMaterial
              color={COLORS.blue}
              transparent
              opacity={0.18 * pop}
            />
          </mesh>
        )
      })}

      <Label
        position={[MID_X, SLAB_H + 0.6, 0.3]}
        size={0.22}
        color={COLORS.fg}
        opacity={0.95 * labelP}
      >
        a transformer
      </Label>

      <Label
        position={[MID_X, -SLAB_H - 0.4, 0.3]}
        size={0.12}
        color={COLORS.dim}
        opacity={0.8 * labelP}
      >
        input → 6 blocks → next token
      </Label>
    </group>
  )
}

export type ActFramingRegion =
  | 'base'
  | 'middle-block'
  | 'full-stack'
  | 'tower-tilt'
  | 'upgrade-markers'
  | 'top'

export interface SceneActFramingProps extends SceneProps {
  region: ActFramingRegion
  headline: string
}

/**
 * Shared 3D renderer for the 6 act-intro scenes. Only region-specific
 * overlays + a centered headline — the global StackBackdrop is drawn
 * upstream by ModelMap3D for every scene. Timing is driven by the `t`
 * prop (speed-aware via SceneClock).
 */
export function SceneActFraming({
  t,
  duration,
  region,
  headline,
}: SceneActFramingProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const enter = smoothstep(0, 0.2, p)
  const hold = smoothstep(0.2, 0.85, p)

  return (
    <group>
      {/* Region-specific emphasis */}
      {region === 'base' && (
        <mesh position={[INPUT_LEN / 2, 0, 0.3]}>
          <planeGeometry args={[INPUT_LEN * 0.9, SLAB_H * 1.1]} />
          <meshBasicMaterial
            color={COLORS.violet}
            transparent
            opacity={0.18 * enter}
          />
        </mesh>
      )}

      {region === 'full-stack' && (
        <group>
          {Array.from({ length: N_BLOCKS }).map((_, bi) => {
            const cx = blockStart(bi) + BLOCK_LEN / 2
            const wave = smoothstep(bi / N_BLOCKS, (bi + 1) / N_BLOCKS, p / 0.75)
            return (
              <mesh key={bi} position={[cx, 0, 0.3]}>
                <planeGeometry args={[BLOCK_LEN * 0.92, SLAB_H * 1.05]} />
                <meshBasicMaterial
                  color={COLORS.blue}
                  transparent
                  opacity={0.12 * wave}
                />
              </mesh>
            )
          })}
        </group>
      )}

      {region === 'middle-block' && (
        <mesh position={[blockStart(2) + BLOCK_LEN / 2, 0, 0.3]}>
          <planeGeometry args={[BLOCK_LEN * 0.95, SLAB_H * 1.1]} />
          <meshBasicMaterial
            color={COLORS.blue}
            transparent
            opacity={0.2 * enter}
          />
        </mesh>
      )}

      {region === 'upgrade-markers' && (
        <group>
          {[1, 3, 5].map((bi) => {
            const cx = blockStart(bi) + BLOCK_LEN / 2
            const pop = smoothstep((bi - 1) / N_BLOCKS, bi / N_BLOCKS, p / 0.75)
            return (
              <mesh key={bi} position={[cx, SLAB_H / 2 + 0.25, 0.3]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial
                  color={COLORS.mint}
                  transparent
                  opacity={0.9 * pop}
                />
              </mesh>
            )
          })}
        </group>
      )}

      {region === 'top' && (
        <mesh position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0.3]}>
          <planeGeometry args={[OUTPUT_LEN * 0.9, SLAB_H * 1.1]} />
          <meshBasicMaterial
            color={COLORS.gold}
            transparent
            opacity={0.22 * enter}
          />
        </mesh>
      )}

      {region === 'tower-tilt' && (
        <mesh position={[MID_X, 0, -0.5]}>
          <planeGeometry args={[TOTAL_X, SLAB_H * 2]} />
          <meshBasicMaterial
            color={COLORS.bg}
            transparent
            opacity={0.35 * enter}
          />
        </mesh>
      )}

      <Label
        position={[MID_X, SLAB_H + 0.55, 0.3]}
        size={0.18}
        color={COLORS.fg}
        opacity={0.95 * hold}
      >
        {headline}
      </Label>
    </group>
  )
}

// Per-act wrapper components so modelmap/index.tsx registers one component
// per scene id (matches how every other scene is wired up).
export function SceneAct1Intro(props: SceneProps) {
  return <SceneAct1Anatomy {...props} />
}
export function SceneAct2Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="middle-block" headline="one block · attention + FFN" />
}
export function SceneAct3Intro(props: SceneProps) {
  return <SceneAct3StackBuild {...props} />
}
export function SceneAct4Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="tower-tilt" headline="how the weights got there" />
}
export function SceneAct5Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="upgrade-markers" headline="what modern models changed" />
}
export function SceneAct6Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="top" headline="the final pick" />
}

// ────────────────────────────────────────────────────────────────────────
// Act 1 intro: anatomy of the model.
// Three labels float into 3D space — Tokens, 6 blocks · attention + FFN,
// Output — naming the parts the rest of the tour will descend into.
// ────────────────────────────────────────────────────────────────────────
function SceneAct1Anatomy({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const inputP = smoothstep(0.05, 0.35, p)
  const blocksP = smoothstep(0.35, 0.65, p)
  const outputP = smoothstep(0.65, 0.92, p)

  const inputCx = INPUT_LEN / 2
  const blocksCx = blockStart(N_BLOCKS / 2) + BLOCK_LEN / 2
  const outputCx = TOTAL_X - OUTPUT_LEN / 2
  const labelY = SLAB_H / 2 + 0.55

  return (
    <group>
      {/* Input region pulse + label */}
      <mesh position={[inputCx, 0, 0.3]}>
        <planeGeometry args={[INPUT_LEN * 0.9, SLAB_H * 1.05]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.18 * inputP} />
      </mesh>
      <Label position={[inputCx, labelY, 0.3]} size={0.13} color={COLORS.violet} opacity={0.95 * inputP}>
        tokens
      </Label>
      <mesh position={[inputCx, labelY - 0.18, 0.3]}>
        <planeGeometry args={[0.4, 0.012]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.6 * inputP} />
      </mesh>

      {/* Six blocks region pulse + label */}
      {Array.from({ length: N_BLOCKS }).map((_, bi) => {
        const cx = blockStart(bi) + BLOCK_LEN / 2
        return (
          <mesh key={bi} position={[cx, 0, 0.3]}>
            <planeGeometry args={[BLOCK_LEN * 0.9, SLAB_H * 1.0]} />
            <meshBasicMaterial color={COLORS.blue} transparent opacity={0.14 * blocksP} />
          </mesh>
        )
      })}
      <Label position={[blocksCx, labelY, 0.3]} size={0.16} color={COLORS.blue} opacity={0.95 * blocksP}>
        6 blocks · attention + FFN
      </Label>
      <mesh position={[blocksCx, labelY - 0.2, 0.3]}>
        <planeGeometry args={[1.4, 0.012]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.6 * blocksP} />
      </mesh>

      {/* Output region pulse + label */}
      <mesh position={[outputCx, 0, 0.3]}>
        <planeGeometry args={[OUTPUT_LEN * 0.9, SLAB_H * 1.05]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.22 * outputP} />
      </mesh>
      <Label position={[outputCx, labelY, 0.3]} size={0.13} color={COLORS.gold} opacity={0.95 * outputP}>
        output
      </Label>
      <mesh position={[outputCx, labelY - 0.18, 0.3]}>
        <planeGeometry args={[0.4, 0.012]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.6 * outputP} />
      </mesh>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Act 3 intro: block-duplication beat (image 30 from the plan).
// Block 0 starts at full brightness (we just zoomed out from inside it).
// Blocks 1–5 slide DOWN from above and fade in one at a time, so the
// viewer literally sees "the same block, six times over" assembling.
// "Many repetitions" brace appears across the top once they're in place.
// ────────────────────────────────────────────────────────────────────────
function SceneAct3StackBuild({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))

  // Block 0 fades up first (it was already there from Act II), then 1..5
  // arrive over a window so each lands distinctly. By 0.85 they're all in.
  const blockProgress = (bi: number): number => {
    if (bi === 0) return smoothstep(0.0, 0.15, p)
    const start = 0.18 + (bi - 1) * 0.13
    return smoothstep(start, start + 0.12, p)
  }

  const slideY = (pi: number) => (1 - pi) * 1.6 // start 1.6u above, settle to 0

  const bracePulse = smoothstep(0.85, 0.96, p)
  const braceLeft = blockStart(0)
  const braceRight = blockStart(N_BLOCKS - 1) + BLOCK_LEN
  const braceY = SLAB_H / 2 + 0.45

  return (
    <group>
      {Array.from({ length: N_BLOCKS }).map((_, bi) => {
        const pi = blockProgress(bi)
        const cx = blockStart(bi) + BLOCK_LEN / 2
        const dy = slideY(pi)
        const op = pi
        return (
          <group key={bi} position={[cx, dy, 0.3]}>
            {/* Filled block plate */}
            <mesh>
              <boxGeometry args={[BLOCK_LEN * 0.92, SLAB_H * 1.05, 0.5]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.16 * op} />
            </mesh>
            {/* Inner attn / ffn slabs (mirrors the recipe) */}
            <mesh position={[-BLOCK_LEN * 0.2, 0, 0.3]}>
              <boxGeometry args={[BLOCK_LEN * 0.3, SLAB_H * 0.85, 0.05]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.45 * op} />
            </mesh>
            <mesh position={[BLOCK_LEN * 0.2, 0, 0.3]}>
              <boxGeometry args={[BLOCK_LEN * 0.3, SLAB_H * 0.85, 0.05]} />
              <meshBasicMaterial color={COLORS.mint} transparent opacity={0.45 * op} />
            </mesh>
            {/* Number label so the duplication reads as 1, 2, 3, … */}
            <Label
              position={[0, -SLAB_H * 0.7, 0.3]}
              size={0.11}
              color={bi === 0 ? COLORS.fg : COLORS.dim}
              opacity={0.9 * op}
            >
              {`× ${bi + 1}`}
            </Label>
          </group>
        )
      })}

      {/* "Many repetitions" brace across the top */}
      <mesh position={[(braceLeft + braceRight) / 2, braceY, 0.3]}>
        <planeGeometry args={[braceRight - braceLeft, 0.012]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.6 * bracePulse} />
      </mesh>
      <mesh position={[braceLeft, braceY - 0.05, 0.3]}>
        <planeGeometry args={[0.012, 0.1]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.6 * bracePulse} />
      </mesh>
      <mesh position={[braceRight, braceY - 0.05, 0.3]}>
        <planeGeometry args={[0.012, 0.1]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.6 * bracePulse} />
      </mesh>
      <Label
        position={[(braceLeft + braceRight) / 2, braceY + 0.18, 0.3]}
        size={0.13}
        color={COLORS.mint}
        opacity={0.95 * bracePulse}
      >
        many repetitions
      </Label>
    </group>
  )
}
