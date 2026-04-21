'use client'

/**
 * Shared visual primitives for the tour scenes.
 */

export const COLORS = {
  bg: '#07070a',
  panel: '#0b0b0f',
  rule: 'rgba(255,255,255,0.08)',
  ruleStrong: 'rgba(255,255,255,0.18)',
  fg: '#ecece9',
  dim: '#6d6d78',

  blue: '#60a5fa',
  violet: '#a78bfa',
  mint: '#34d399',
  red: '#f87171',
  amber: '#f59e0b',
  pink: '#ec4899',
  cyan: '#22d3ee',
  yellow: '#fde047',
} as const

// Deterministic pseudo-random based on integer seed
export function makeRng(seed: number) {
  let s = (seed * 2654435761) | 0
  return () => {
    s = (s * 1664525 + 1013904223) | 0
    return ((s >>> 0) % 100000) / 100000
  }
}

export function glyph(ch: string) {
  if (ch === '\n') return '↵'
  if (ch === ' ') return '·'
  if (ch === '\t') return '→'
  return ch
}

/** A token pill — character with id underneath */
export function TokenCell({
  x,
  y,
  width = 38,
  height = 44,
  ch,
  id,
  color = COLORS.fg,
  fill = COLORS.panel,
  highlight = false,
}: {
  x: number
  y: number
  width?: number
  height?: number
  ch: string
  id?: number
  color?: string
  fill?: string
  highlight?: boolean
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={width}
        height={height}
        rx="3"
        fill={highlight ? color : fill}
        stroke={color}
        strokeOpacity={highlight ? 1 : 0.6}
        strokeWidth={highlight ? 1.5 : 1}
      />
      <text
        x={width / 2}
        y={height / 2 - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="16"
        fontFamily="var(--font-mono)"
        fill={highlight ? COLORS.bg : color}
      >
        {glyph(ch)}
      </text>
      {id !== undefined && (
        <text
          x={width / 2}
          y={height - 6}
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={highlight ? 'rgba(7,7,9,0.7)' : COLORS.dim}
        >
          {id}
        </text>
      )}
    </g>
  )
}

/** A vector rendered as a colored bar strip (each value is a cell) */
export function VectorBar({
  x,
  y,
  values,
  cellW = 6,
  cellH = 16,
  scale = 1,
  label,
  labelColor = COLORS.dim,
}: {
  x: number
  y: number
  values: number[]
  cellW?: number
  cellH?: number
  scale?: number
  label?: string
  labelColor?: string
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {label && (
        <text
          x={-8}
          y={cellH / 2 + 4}
          textAnchor="end"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={labelColor}
        >
          {label}
        </text>
      )}
      {values.map((v, i) => {
        const t = Math.max(-1, Math.min(1, v / scale))
        const pos = [96, 165, 250]
        const neg = [248, 113, 113]
        const neutral = [25, 25, 30]
        const interp = (from: number[], to: number[], s: number) =>
          from.map((a, j) => a + (to[j] - a) * s)
        const c = t >= 0 ? interp(neutral, pos, t) : interp(neutral, neg, -t)
        const color = `rgb(${c.map((x) => Math.round(x)).join(',')})`
        return (
          <rect
            key={i}
            x={i * cellW}
            y={0}
            width={cellW - 0.5}
            height={cellH}
            fill={color}
          />
        )
      })}
      <rect
        x={0}
        y={0}
        width={values.length * cellW - 0.5}
        height={cellH}
        fill="none"
        stroke={COLORS.rule}
      />
    </g>
  )
}

/** A matrix cell grid — rows × cols with per-cell color */
export function MatrixGrid({
  x,
  y,
  rows,
  cols,
  values,
  cellSize = 12,
  scale = 1,
  hueMode = 'diverging',
  cellGap = 0,
}: {
  x: number
  y: number
  rows: number
  cols: number
  values: number[][]
  cellSize?: number
  scale?: number
  hueMode?: 'diverging' | 'blue' | 'violet' | 'mint'
  cellGap?: number
}) {
  const step = cellSize + cellGap
  function color(v: number): string {
    if (hueMode === 'blue') {
      const t = Math.max(0, Math.min(1, v / scale))
      const from = [15, 23, 42]
      const to = [96, 165, 250]
      const rgb = from.map((a, j) => a + (to[j] - a) * t)
      return `rgb(${rgb.map((x) => Math.round(x)).join(',')})`
    }
    if (hueMode === 'violet') {
      const t = Math.max(0, Math.min(1, v / scale))
      const from = [20, 10, 35]
      const to = [167, 139, 250]
      const rgb = from.map((a, j) => a + (to[j] - a) * t)
      return `rgb(${rgb.map((x) => Math.round(x)).join(',')})`
    }
    if (hueMode === 'mint') {
      const t = Math.max(0, Math.min(1, v / scale))
      const from = [10, 30, 20]
      const to = [52, 211, 153]
      const rgb = from.map((a, j) => a + (to[j] - a) * t)
      return `rgb(${rgb.map((x) => Math.round(x)).join(',')})`
    }
    const t = Math.max(-1, Math.min(1, v / scale))
    const pos = [96, 165, 250]
    const neg = [248, 113, 113]
    const neutral = [25, 25, 30]
    const interp = (from: number[], to: number[], s: number) =>
      from.map((a, j) => a + (to[j] - a) * s)
    const c = t >= 0 ? interp(neutral, pos, t) : interp(neutral, neg, -t)
    return `rgb(${c.map((x) => Math.round(x)).join(',')})`
  }
  return (
    <g transform={`translate(${x}, ${y})`}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * step}
            y={r * step}
            width={cellSize}
            height={cellSize}
            fill={color(values[r]?.[c] ?? 0)}
          />
        ))
      )}
      <rect
        x={-0.5}
        y={-0.5}
        width={cols * step + 0.5}
        height={rows * step + 0.5}
        fill="none"
        stroke={COLORS.rule}
      />
    </g>
  )
}

/** A label with small-caps kicker + mono detail */
export function SceneLabel({
  x,
  y,
  kicker,
  title,
  color = COLORS.fg,
}: {
  x: number
  y: number
  kicker?: string
  title: string
  color?: string
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {kicker && (
        <text
          x={0}
          y={0}
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
          letterSpacing="0.18em"
        >
          {kicker.toUpperCase()}
        </text>
      )}
      <text
        x={0}
        y={kicker ? 18 : 0}
        fontSize="15"
        fontFamily="var(--font-display)"
        fill={color}
      >
        {title}
      </text>
    </g>
  )
}
