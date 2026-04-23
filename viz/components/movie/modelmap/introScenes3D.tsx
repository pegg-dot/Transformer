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
  return <SceneActFraming {...props} region="base" headline="input · text → numbers" />
}
export function SceneAct2Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="middle-block" headline="one block · attention + FFN" />
}
export function SceneAct3Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="full-stack" headline="six blocks stacked" />
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
