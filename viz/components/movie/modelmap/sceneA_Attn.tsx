'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { smoothstep, clamp01 } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const T = 7
const CELL = 0.18

export default function SceneAttn({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const phaseEstablish = smoothstep(0, 0.25, p)
  const phaseScores = smoothstep(0.2, 0.55, p)
  const phaseSoftmax = smoothstep(0.55, 0.75, p)
  const phaseAggregate = smoothstep(0.75, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.35

  const { rawScores, softmax } = useMemo(() => {
    const rng = mulberry32(987654)
    const raw = new Float32Array(T * T)
    for (let r = 0; r < T; r++) {
      for (let c = 0; c < T; c++) {
        raw[r * T + c] = c > r ? -9999 : (rng() * 2 - 1) * 2
      }
    }
    const soft = new Float32Array(T * T)
    for (let r = 0; r < T; r++) {
      let max = -1e9
      for (let c = 0; c <= r; c++) if (raw[r * T + c] > max) max = raw[r * T + c]
      let sum = 0
      for (let c = 0; c <= r; c++) {
        soft[r * T + c] = Math.exp(raw[r * T + c] - max)
        sum += soft[r * T + c]
      }
      for (let c = 0; c <= r; c++) soft[r * T + c] /= sum
    }
    return { rawScores: raw, softmax: soft }
  }, [])

  const gridW = T * CELL
  const gridH = T * CELL
  const qRowY = gridH / 2 + CELL * 1.4
  const kColX = -gridW / 2 - CELL * 1.4

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, gridH / 2 + 0.7, 0.2]} size={0.2} opacity={0.85 * phaseEstablish}>
        Attention
      </Label>

      <group position={[0, qRowY, 0]}>
        <Label position={[-gridW / 2 - 0.35, 0, 0]} size={0.12} color={COLORS.blue} opacity={0.9 * phaseEstablish}>
          Q
        </Label>
        {Array.from({ length: T }).map((_, c) => (
          <mesh key={c} position={[-gridW / 2 + (c + 0.5) * CELL, 0, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial color={COLORS.blue} transparent opacity={0.4 * phaseEstablish + 0.3 * phaseScores} />
          </mesh>
        ))}
      </group>

      <group position={[kColX, 0, 0]}>
        <Label position={[0, gridH / 2 + 0.3, 0]} size={0.12} color={COLORS.red} opacity={0.9 * phaseEstablish}>
          K
        </Label>
        {Array.from({ length: T }).map((_, r) => (
          <mesh key={r} position={[0, gridH / 2 - (r + 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.4 * phaseEstablish + 0.3 * phaseScores} />
          </mesh>
        ))}
      </group>

      <group>
        {Array.from({ length: T }).map((_, r) =>
          Array.from({ length: T }).map((_, c) => {
            const x = -gridW / 2 + (c + 0.5) * CELL
            const y = gridH / 2 - (r + 0.5) * CELL
            const masked = c > r
            if (masked) {
              return (
                <mesh key={`${r}-${c}`} position={[x, y, 0.005]}>
                  <planeGeometry args={[CELL * 0.92, CELL * 0.92]} />
                  <meshBasicMaterial color={COLORS.red} transparent opacity={0.32 * phaseScores} />
                </mesh>
              )
            }
            const scoreNorm = (rawScores[r * T + c] + 2) / 4
            const softVal = softmax[r * T + c]
            const brightness = THREE.MathUtils.lerp(scoreNorm, softVal * T, phaseSoftmax) * phaseScores
            return (
              <mesh key={`${r}-${c}`} position={[x, y, 0]}>
                <planeGeometry args={[CELL * 0.92, CELL * 0.92]} />
                <meshBasicMaterial color={COLORS.fg} transparent opacity={clamp01(brightness) * 0.85} />
              </mesh>
            )
          })
        )}
      </group>

      <Text
        position={[gridW / 2 + 0.25, 0, 0]}
        fontSize={0.09}
        color={COLORS.fg}
        fillOpacity={0.75 * phaseSoftmax}
        anchorX="left"
        anchorY="middle"
      >
        softmax
      </Text>

      {/* Causal mask label */}
      <Text
        position={[gridW / 2 - 0.04, gridH / 2 - 0.12, 0.03]}
        fontSize={0.085}
        color={COLORS.red}
        fillOpacity={0.95 * phaseScores}
        anchorX="right"
        anchorY="top"
      >
        causal mask
      </Text>
      <Text
        position={[gridW / 2 - 0.04, gridH / 2 - 0.24, 0.03]}
        fontSize={0.055}
        color={COLORS.red}
        fillOpacity={0.8 * phaseScores}
        anchorX="right"
        anchorY="top"
      >
        no future tokens
      </Text>

      <group position={[gridW / 2 + 1.0, -gridH / 2 + 0.3 - (1 - phaseAggregate) * 0.6, 0]}>
        <Label position={[0, gridH / 2 + 0.3, 0]} size={0.12} color={COLORS.mint} opacity={0.9 * phaseAggregate}>
          V
        </Label>
        {Array.from({ length: T }).map((_, r) => (
          <mesh key={r} position={[0, gridH / 2 - (r + 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial color={COLORS.mint} transparent opacity={0.7 * phaseAggregate} />
          </mesh>
        ))}
      </group>

      <group position={[gridW / 2 + 1.7, 0, 0]}>
        {Array.from({ length: T }).map((_, r) => (
          <mesh key={r} position={[0, gridH / 2 - (r + 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial color={COLORS.fg} transparent opacity={0.75 * phaseAggregate} />
          </mesh>
        ))}
        <Label position={[0, gridH / 2 + 0.3, 0]} size={0.1} opacity={0.85 * phaseAggregate}>
          output
        </Label>
      </group>

      <Slab
        position={[0.3, 0, -0.04]}
        width={gridW + 3.8}
        height={gridH + 1.4}
        color={COLORS.slabTint}
        opacity={0.04 + 0.06 * phaseEstablish}
        showCornerTicks={true}
        tickLength={0.14}
      />
    </group>
  )
}
