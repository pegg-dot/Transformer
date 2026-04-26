'use client'

import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { COLORS } from './constants'

/**
 * A "vector protagonist" — color-coded numeric vector grid in 3D space.
 *
 * 3Blue1Brown convention: each cell is a small box, blue for positive
 * activations, red for negative, opacity proportional to |value|. The
 * column reads like a fingerprint of one vector at one moment.
 *
 * Used to show:
 *   - one token's embedding (Act I)
 *   - the same token's Q / K / V projections (Act II)
 *   - the residual stream evolving across blocks (Act III)
 *
 * Performance: at d=384 we don't render every cell; instead `values` is
 * expected to be a sampled / pooled subset (typically 12–24 entries).
 */

export interface VectorGridProps {
  /** Center position in world space. */
  position?: [number, number, number]
  /** Values to display, expected roughly in [-1, 1]. Out-of-range values clamp. */
  values: number[]
  /** Width of each cell. Default 0.18. */
  cellWidth?: number
  /** Height of each cell. Default 0.10. */
  cellHeight?: number
  /** Vertical gap between cells. Default 0.012. */
  cellGap?: number
  /** Whether to render the numeric value inside each cell. */
  showValues?: boolean
  /** Optional title rendered above the grid. */
  label?: string
  /** Color used for positive values. Default: blue. */
  posColor?: string
  /** Color used for negative values. Default: red. */
  negColor?: string
  /** Multiplier on overall opacity (for fade-in/out). Default 1. */
  fade?: number
  /** Optional row index to glow ("active row"); -1 to disable. */
  pulseRow?: number
  /** Strength of the pulse 0–1. */
  pulseStrength?: number
}

const DEFAULT_POS = '#60a5fa'
const DEFAULT_NEG = '#f87171'

export function VectorGrid({
  position = [0, 0, 0],
  values,
  cellWidth = 0.18,
  cellHeight = 0.10,
  cellGap = 0.012,
  showValues = false,
  label,
  posColor = DEFAULT_POS,
  negColor = DEFAULT_NEG,
  fade = 1,
  pulseRow = -1,
  pulseStrength = 0.6,
}: VectorGridProps) {
  const rows = values.length
  const totalH = rows * cellHeight + (rows - 1) * cellGap
  const top = totalH / 2

  // Pre-compute cell color + opacity once per render. Clamp to [-1, 1] so
  // outliers don't break the gradient and so |value|=1 maps to 100% opacity.
  const cells = useMemo(() => {
    return values.map((v, i) => {
      const clamped = Math.max(-1, Math.min(1, v))
      const mag = Math.abs(clamped)
      const color = clamped >= 0 ? posColor : negColor
      // Stronger floor for visibility — even tiny values still register as
      // a faint cell so the grid never has invisible rows.
      const opacity = (0.28 + 0.72 * mag) * fade
      const isPulsed = i === pulseRow
      return {
        color,
        opacity: isPulsed ? Math.min(1, opacity + pulseStrength * fade) : opacity,
        value: clamped,
        isPulsed,
      }
    })
  }, [values, posColor, negColor, fade, pulseRow, pulseStrength])

  return (
    <group position={position}>
      {label && (
        <Text
          position={[0, top + 0.18, 0]}
          fontSize={0.085}
          color={COLORS.fg}
          fillOpacity={0.9 * fade}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
        >
          {label}
        </Text>
      )}

      {cells.map((c, i) => {
        const y = top - i * (cellHeight + cellGap) - cellHeight / 2
        return (
          <group key={i} position={[0, y, 0]}>
            {/* Filled cell */}
            <mesh>
              <planeGeometry args={[cellWidth, cellHeight]} />
              <meshBasicMaterial
                color={c.color}
                opacity={c.opacity}
                transparent
                depthWrite={false}
              />
            </mesh>
            {/* Outline ring on pulsed row */}
            {c.isPulsed && (
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[cellWidth + 0.04, cellHeight + 0.04]} />
                <meshBasicMaterial
                  color={c.color}
                  opacity={0.35 * fade}
                  transparent
                  depthWrite={false}
                />
              </mesh>
            )}
            {/* Optional numeric label inside the cell */}
            {showValues && (
              <Text
                position={[0, 0, 0.01]}
                fontSize={cellHeight * 0.45}
                color={COLORS.fg}
                fillOpacity={Math.min(1, c.opacity + 0.2)}
                anchorX="center"
                anchorY="middle"
              >
                {c.value.toFixed(1)}
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Helper: deterministic synthetic vector for design-mode previews.
 * Use this when no real activation data is available (e.g. teaching scenes
 * that just need to *show* what a vector "looks like").
 */
export function syntheticVector(seed: number, n: number): number[] {
  let s = seed
  return Array.from({ length: n }).map(() => {
    s = (s * 9301 + 49297) % 233280
    return (s / 233280) * 2 - 1
  })
}
