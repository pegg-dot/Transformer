'use client'

import { motion } from 'framer-motion'
import { COLORS } from '../scenes/primitives'

/**
 * Small info chips that show real numeric context for a scene:
 * tensor shape, L2 norm, max magnitude, a label, etc.
 *
 * Designed to be rendered as an absolutely-positioned strip in the top-right
 * of a scene, giving a quick glance at the "math behind the picture".
 */

export interface NumChip {
  label: string
  value: string
  color?: string
}

export function NumberPanel({
  chips,
  x = '1200px',
  y = '24px',
  width = '180px',
}: {
  chips: NumChip[]
  x?: string
  y?: string
  width?: string
}) {
  return (
    <foreignObject x={0} y={0} width="1" height="1" style={{ overflow: 'visible' }}>
      <div
        style={{
          position: 'absolute',
          top: y,
          left: x,
          width,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
        }}
      >
        <div className="rounded-[2px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.015)] px-3 py-2 backdrop-blur-sm">
          <div className="small-caps mb-1.5 text-[var(--fg-dim)]">real values</div>
          <div className="space-y-1">
            {chips.map((c, i) => (
              <motion.div
                key={`${c.label}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-baseline justify-between gap-2"
              >
                <span className="text-[var(--fg-dim)]">{c.label}</span>
                <span style={{ color: c.color || COLORS.fg }}>{c.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </foreignObject>
  )
}

/**
 * Plain div version (non-SVG) — use when the scene's container is HTML, not SVG.
 */
export function NumberPanelDiv({
  chips,
  className = '',
}: {
  chips: NumChip[]
  className?: string
}) {
  return (
    <div
      className={`absolute top-4 right-4 z-10 w-[200px] rounded-[2px] border border-[rgba(255,255,255,0.1)] bg-[rgba(7,7,9,0.7)] px-3 py-2 mono text-[10px] backdrop-blur-md ${className}`}
    >
      <div className="small-caps mb-1.5 text-[var(--fg-dim)]">real values</div>
      <div className="space-y-1">
        {chips.map((c, i) => (
          <motion.div
            key={`${c.label}-${i}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="text-[var(--fg-dim)]">{c.label}</span>
            <span style={{ color: c.color || COLORS.fg }}>{c.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/** Compute L2 norm of a flat or nested array */
export function l2(values: number[] | number[][]): number {
  let sum = 0
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(walk)
    else if (typeof x === 'number') sum += x * x
  }
  walk(values)
  return Math.sqrt(sum)
}

export function maxAbs(values: number[] | number[][]): number {
  let m = 0
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(walk)
    else if (typeof x === 'number' && Number.isFinite(x)) {
      const a = Math.abs(x)
      if (a > m) m = a
    }
  }
  walk(values)
  return m
}
