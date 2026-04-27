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
  return <SceneAct2BlockZoom {...props} />
}
export function SceneAct3Intro(props: SceneProps) {
  return <SceneAct3StackBuild {...props} />
}
export function SceneAct4Intro(props: SceneProps) {
  return <SceneAct4LossDive {...props} />
}
export function SceneAct5Intro(props: SceneProps) {
  return <SceneAct5Hotspots {...props} />
}
export function SceneAct6Intro(props: SceneProps) {
  return <SceneAct6Apex {...props} />
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

// ────────────────────────────────────────────────────────────────────────
// Act 2 intro: pull-back-then-zoom-in on block 0.
// All 6 blocks visible at first. Block 0 spotlights bright while the
// rest dim further. Two inner sublayer cards (Attention | FFN) fade in
// inside block 0 as the camera dollies in (CameraController routes
// through stackPullback → block0Wide via SCENE_VIA).
// ────────────────────────────────────────────────────────────────────────
function SceneAct2BlockZoom({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))

  // Phase 1 (0..0.35): all blocks visible, block 0 highlights.
  const pSpot = smoothstep(0.05, 0.35, p)
  // Phase 2 (0.35..0.7): the inside of block 0 fades in.
  const pInside = smoothstep(0.4, 0.7, p)
  // Phase 3 (0.7..1.0): full labels + residual arrow settle.
  const pSettle = smoothstep(0.7, 0.95, p)

  const block0Cx = blockStart(0) + BLOCK_LEN / 2

  return (
    <group>
      {/* Spotlight glow on block 0 */}
      <mesh position={[block0Cx, 0, 0.4]}>
        <boxGeometry args={[BLOCK_LEN * 1.0, SLAB_H * 1.15, 0.55]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.28 * pSpot} />
      </mesh>

      {/* Inside-block content: Attention card on the left, FFN card on right.
          They fade up after the spotlight as the camera approaches. */}
      <group position={[block0Cx, 0, 0.5]}>
        <mesh position={[-BLOCK_LEN * 0.22, 0, 0]}>
          <boxGeometry args={[BLOCK_LEN * 0.38, SLAB_H * 0.85, 0.08]} />
          <meshBasicMaterial color={COLORS.blue} transparent opacity={0.55 * pInside} />
        </mesh>
        <Label
          position={[-BLOCK_LEN * 0.22, 0.05, 0.04]}
          size={0.105}
          color={COLORS.fg}
          opacity={0.95 * pInside}
        >
          attention
        </Label>
        <Label
          position={[-BLOCK_LEN * 0.22, -0.18, 0.04]}
          size={0.07}
          color={COLORS.dim}
          opacity={0.9 * pInside}
        >
          mix tokens
        </Label>

        <mesh position={[BLOCK_LEN * 0.22, 0, 0]}>
          <boxGeometry args={[BLOCK_LEN * 0.38, SLAB_H * 0.85, 0.08]} />
          <meshBasicMaterial color={COLORS.mint} transparent opacity={0.55 * pInside} />
        </mesh>
        <Label
          position={[BLOCK_LEN * 0.22, 0.05, 0.04]}
          size={0.105}
          color={COLORS.fg}
          opacity={0.95 * pInside}
        >
          FFN
        </Label>
        <Label
          position={[BLOCK_LEN * 0.22, -0.18, 0.04]}
          size={0.07}
          color={COLORS.dim}
          opacity={0.9 * pInside}
        >
          per token
        </Label>

        {/* Residual stream arrow — dotted line passing through both sublayers */}
        <mesh position={[0, -SLAB_H * 0.5, 0.05]}>
          <planeGeometry args={[BLOCK_LEN * 0.85, 0.012]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={0.65 * pSettle} />
        </mesh>
        <Label
          position={[0, -SLAB_H * 0.7, 0.05]}
          size={0.075}
          color={COLORS.gold}
          opacity={0.9 * pSettle}
        >
          residual stream
        </Label>
      </group>

      {/* "Block 0 of 6" tag overhead */}
      <Label
        position={[block0Cx, SLAB_H / 2 + 0.55, 0.3]}
        size={0.13}
        color={COLORS.blue}
        opacity={0.95 * pSpot}
      >
        block 0 · of 6
      </Label>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Act 4 intro: model goes dim, a loss curve appears beside it.
// Phase 1: model dims. Phase 2: a sketched loss curve materializes
// floating above the stack, descending from upper-left to lower-right.
// Phase 3: caption + arrow pointing back at the model.
// ────────────────────────────────────────────────────────────────────────
function SceneAct4LossDive({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pDim = smoothstep(0.0, 0.3, p)
  const pCurve = smoothstep(0.25, 0.7, p)
  const pCaption = smoothstep(0.65, 0.95, p)

  const cx = MID_X
  const curveY = SLAB_H + 0.85
  const curveW = 2.4
  const curveH = 0.8

  // Generate a fixed-shape decay curve: y = e^-3x + small noise
  const N = 40
  const points: [number, number][] = Array.from({ length: N }).map((_, i) => {
    const px = i / (N - 1)
    const py = Math.exp(-3.2 * px) + 0.04 * Math.sin(px * 18)
    return [px, py]
  })

  return (
    <group>
      {/* Dim wash over the stack */}
      <mesh position={[cx, 0, 0.3]}>
        <planeGeometry args={[TOTAL_X, SLAB_H * 1.4]} />
        <meshBasicMaterial color={COLORS.bg} transparent opacity={0.4 * pDim} />
      </mesh>

      {/* Loss curve — axis */}
      <mesh position={[cx - curveW / 2, curveY, 0.4]}>
        <planeGeometry args={[0.012, curveH]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.6 * pCurve} />
      </mesh>
      <mesh position={[cx, curveY - curveH / 2, 0.4]}>
        <planeGeometry args={[curveW, 0.012]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.6 * pCurve} />
      </mesh>
      <Label position={[cx - curveW / 2 - 0.18, curveY, 0.4]} size={0.08} color={COLORS.dim} opacity={0.85 * pCurve}>
        loss
      </Label>
      <Label position={[cx, curveY - curveH / 2 - 0.18, 0.4]} size={0.075} color={COLORS.dim} opacity={0.85 * pCurve}>
        training steps →
      </Label>

      {/* Curve points */}
      {points.map(([px, py], i) => {
        const visibleP = smoothstep(i / N, (i + 1) / N, pCurve)
        if (visibleP < 0.05) return null
        const x = cx - curveW / 2 + px * curveW
        const y = curveY - curveH / 2 + py * curveH
        return (
          <mesh key={i} position={[x, y, 0.45]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.95 * visibleP} />
          </mesh>
        )
      })}

      {/* Title + caption */}
      <Label
        position={[cx, curveY + curveH / 2 + 0.18, 0.4]}
        size={0.13}
        color={COLORS.red}
        opacity={0.95 * pCurve}
      >
        the loss came down
      </Label>
      <Label
        position={[cx, -SLAB_H - 0.4, 0.4]}
        size={0.085}
        color={COLORS.dim}
        opacity={0.9 * pCaption}
      >
        every weight you just saw was nudged by gradients of this number
      </Label>

      {/* Arrow from curve back to model */}
      <mesh position={[cx + 0.6, curveY - curveH / 2 - 0.1, 0.4]} rotation={[0, 0, -Math.PI / 5]}>
        <planeGeometry args={[0.6, 0.012]} />
        <meshBasicMaterial color={COLORS.red} transparent opacity={0.65 * pCaption} />
      </mesh>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Act 5 intro: three "upgrade" hotspots highlighted on the existing model.
// PE region (input slab), normalization (between sublayers), FFN. Each
// gets a label callout and a small marker dot pulses on it.
// ────────────────────────────────────────────────────────────────────────
function SceneAct5Hotspots({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const p1 = smoothstep(0.05, 0.3, p)
  const p2 = smoothstep(0.25, 0.5, p)
  const p3 = smoothstep(0.45, 0.75, p)
  const pAll = smoothstep(0.75, 0.95, p)

  const peCx = INPUT_LEN / 2
  const normCx = blockStart(2) + BLOCK_LEN * 0.3
  const ffnCx = blockStart(4) + BLOCK_LEN * 0.7
  const yLabel = SLAB_H / 2 + 0.4

  const Hotspot = ({
    cx,
    label,
    sub,
    color,
    fade,
  }: {
    cx: number
    label: string
    sub: string
    color: string
    fade: number
  }) => (
    <group position={[cx, 0, 0.45]}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.85 * fade} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25 * fade} />
      </mesh>
      <mesh position={[0, yLabel - 0.05, 0]}>
        <planeGeometry args={[0.012, yLabel - 0.15]} />
        <meshBasicMaterial color={color} transparent opacity={0.6 * fade} />
      </mesh>
      <Label position={[0, yLabel + 0.08, 0]} size={0.105} color={color} opacity={0.95 * fade}>
        {label}
      </Label>
      <Label position={[0, yLabel - 0.1, 0]} size={0.075} color={COLORS.dim} opacity={0.9 * fade}>
        {sub}
      </Label>
    </group>
  )

  return (
    <group>
      <Hotspot cx={peCx} label="RoPE" sub="pos: rotate, not add" color={COLORS.violet} fade={p1} />
      <Hotspot cx={normCx} label="RMSNorm" sub="just divide ||x||" color={COLORS.blue} fade={p2} />
      <Hotspot cx={ffnCx} label="SwiGLU" sub="gate, then mix" color={COLORS.mint} fade={p3} />

      <Label
        position={[MID_X, -SLAB_H - 0.45, 0.3]}
        size={0.1}
        color={COLORS.fg}
        opacity={0.95 * pAll}
      >
        same skeleton · three surgical upgrades
      </Label>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Act 6 intro: top-of-stack apex.
// Camera goes to outputStageWide. Output slab pulses gold. A glyph "?"
// appears above it suggesting "the model is about to choose."
// ────────────────────────────────────────────────────────────────────────
function SceneAct6Apex({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pSlab = smoothstep(0.05, 0.3, p)
  const pGlyph = smoothstep(0.35, 0.7, p)
  const pCaption = smoothstep(0.65, 0.95, p)

  const outCx = TOTAL_X - OUTPUT_LEN / 2
  const labelY = SLAB_H + 0.7

  return (
    <group>
      {/* Output slab spotlight */}
      <mesh position={[outCx, 0, 0.4]}>
        <boxGeometry args={[OUTPUT_LEN * 0.95, SLAB_H * 1.15, 0.55]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.35 * pSlab} />
      </mesh>

      {/* Glyph appearing above the output slab */}
      <Label
        position={[outCx, labelY, 0.45]}
        size={0.5 * pGlyph + 0.05}
        color={COLORS.gold}
        opacity={0.95 * pGlyph}
      >
        ?
      </Label>

      {/* Halo around the glyph */}
      <mesh position={[outCx, labelY, 0.42]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.18 * pGlyph} />
      </mesh>

      {/* Captions */}
      <Label
        position={[outCx, -SLAB_H - 0.25, 0.4]}
        size={0.105}
        color={COLORS.gold}
        opacity={0.95 * pCaption}
      >
        the next character
      </Label>
      <Label
        position={[outCx, -SLAB_H - 0.45, 0.4]}
        size={0.075}
        color={COLORS.dim}
        opacity={0.9 * pCaption}
      >
        one of 65 · sampled from a softmax
      </Label>
    </group>
  )
}
