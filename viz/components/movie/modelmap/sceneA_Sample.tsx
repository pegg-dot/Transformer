'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, TOTAL_X, OUTPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'
import { VectorGrid, syntheticVector } from './shared/VectorGrid'

// Show a slice of the 65-char vocab; enough to read but not crowd the rail.
const VOCAB = 18

const VOCAB_GLYPHS = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l',
  'n', 'o', 'r', 's', 't', 'u', '·', '!',
]

const STREAM_ROWS = 12

/**
 * Sample — climax of the forward pass.
 *
 * 3B1B beat: the top-of-stack residual vector (left, tall column) gets
 * MULTIPLIED by W_out (a wide projection) into a logit row over the
 * vocabulary. The logits then SOFTMAX into probabilities — bars
 * normalize to a real distribution. The argmax glows gold and a
 * caption appears: ← next token.
 *
 * Timeline:
 *   0.00–0.20  residual stream column fades in (left)
 *   0.20–0.55  W_out projection band fades in; raw logit bars extend
 *   0.55–0.80  softmax: bars renormalize into probabilities
 *   0.80–1.00  argmax pulses gold; "next token" label appears
 */
export default function SceneSample({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.85))
  const pEst = smoothstep(0, 0.2, p)
  const pLogit = smoothstep(0.2, 0.55, p)
  const pSoft = smoothstep(0.55, 0.8, p)
  const pPick = smoothstep(0.8, 1.0, p)

  const streamVec = useMemo(() => syntheticVector(7777, STREAM_ROWS), [])

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

  const BAR_H = 0.075
  const BAR_W_MAX = 0.95

  const xStream = -1.4
  const xWout = -0.4
  const xBars = 0.1

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.25, 0.2]} size={0.18} color={COLORS.fg} opacity={0.95 * pEst}>
        Sample the next token
      </Label>
      <Label position={[0, 1.05, 0.2]} size={0.08} color={COLORS.dim} opacity={0.9 * pEst}>
        residual → logits → probabilities
      </Label>

      {/* Top-of-stack residual stream */}
      <VectorGrid
        position={[xStream, 0, 0.1]}
        values={streamVec}
        cellWidth={0.18}
        cellHeight={0.07}
        cellGap={0.008}
        label="resid · top"
        fade={pEst}
      />

      {/* W_out projection band */}
      <group position={[xWout, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.32, 1.3, 0.06]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={0.4 * pLogit} />
        </mesh>
        <Label position={[0, 0.78, 0.05]} size={0.085} color={COLORS.gold} opacity={0.95 * pLogit}>
          W_out
        </Label>
        <Label position={[0, -0.78, 0.05]} size={0.07} color={COLORS.dim} opacity={0.85 * pLogit}>
          d → V
        </Label>
        <mesh position={[(xWout - xStream) / -2 - 0.2, 0, 0]}>
          <planeGeometry args={[Math.abs(xWout - xStream) - 0.6, 0.012]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={0.55 * pLogit} />
        </mesh>
      </group>

      {/* Probability bars over vocab */}
      <group position={[xBars, 0, 0]}>
        {Array.from({ length: VOCAB }).map((_, i) => {
          const rawNorm = raw[i] / 3
          const softNorm = soft[i]
          // Crossfade: raw logit length → softmax probability length
          const barLen =
            BAR_W_MAX *
            ((1 - pSoft) * (0.45 + rawNorm * 0.32) + pSoft * Math.max(0.05, softNorm * 4))
          const y = (VOCAB / 2 - i - 0.5) * BAR_H
          const isPick = i === pickIdx
          const color = isPick && pPick > 0.3 ? COLORS.gold : COLORS.fg
          const op = 0.6 + 0.35 * (isPick ? pPick : 0)
          return (
            <group key={i}>
              <Text
                position={[-0.05, y, 0]}
                fontSize={0.06}
                color={isPick && pPick > 0.3 ? COLORS.gold : COLORS.dim}
                fillOpacity={0.85 * pLogit}
                anchorX="right"
                anchorY="middle"
              >
                {VOCAB_GLYPHS[i] ?? ''}
              </Text>
              <mesh position={[barLen / 2, y, 0.05]}>
                <planeGeometry args={[barLen, BAR_H * 0.7]} />
                <meshBasicMaterial color={color} transparent opacity={op * pLogit} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* Sampled callout */}
      {pPick > 0 && (
        <group position={[xBars + BAR_W_MAX + 0.25, (VOCAB / 2 - pickIdx - 0.5) * BAR_H, 0]}>
          <Label position={[0.18, 0.05, 0]} size={0.1} color={COLORS.gold} opacity={0.95 * pPick}>
            ← next token
          </Label>
          <Text
            position={[-0.05, 0, 0]}
            fontSize={0.13}
            color={COLORS.gold}
            fillOpacity={0.95 * pPick}
            anchorX="left"
            anchorY="middle"
          >
            {'"' + (VOCAB_GLYPHS[pickIdx] ?? '?') + '"'}
          </Text>
        </group>
      )}

      <Slab
        position={[0, 0, -0.1]}
        width={2.6}
        height={VOCAB * BAR_H + 0.55}
        opacity={0.04 + 0.05 * pEst}
        showCornerTicks
        tickLength={0.1}
      />
    </group>
  )
}
