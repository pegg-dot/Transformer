'use client'

import { motion } from 'framer-motion'
import { COLORS, makeRng } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520

const HEAD_COLORS = [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.amber, COLORS.pink, COLORS.cyan]
const HEAD_LABELS = [
  'previous token',
  'name before colon',
  'matching quote',
  'whitespace anchor',
  'line-start',
  'two-back',
]
const T = 8
const TOKENS = ['R', 'O', 'M', 'E', 'O', ':', 'N', 'a']

// Deterministic but visually distinct patterns per head
function patternFor(head: number): number[][] {
  const rng = makeRng(head + 101)
  const mat: number[][] = []
  for (let q = 0; q < T; q++) {
    const row = new Array(T).fill(0)
    // different head patterns
    if (head === 0) {
      // previous token
      if (q > 0) row[q - 1] = 0.9
      row[q] = 0.1
    } else if (head === 1) {
      // attends to start
      row[0] = 0.9
      row[q] = 0.1
    } else if (head === 2) {
      // matching pairs
      row[Math.max(0, q - 3)] = 0.8
      row[q] = 0.2
    } else if (head === 3) {
      // diagonal
      row[q] = 1
    } else if (head === 4) {
      // evenly spread
      for (let k = 0; k <= q; k++) row[k] = 1 / (q + 1)
    } else {
      // random
      let sum = 0
      for (let k = 0; k <= q; k++) {
        row[k] = rng()
        sum += row[k]
      }
      for (let k = 0; k <= q; k++) row[k] /= sum
    }
    mat.push(row)
  }
  return mat
}

const HEADS = Array.from({ length: 6 }).map((_, h) => patternFor(h))

/**
 * Scene — Multi-head attention
 *
 * Six small heads laid out in a 3×2 grid. Each shows a different attention
 * pattern with arcs between tokens. Each head has its own color + label.
 * At the bottom: the six outputs are concatenated and projected — shown as
 * a color-blended "combined" bar that pulses.
 */
export function MultiHeadScene() {
  const GRID_COLS = 3
  const GRID_ROWS = 2
  const HEAD_W = 210
  const HEAD_H = 150
  const GAP_X = 14
  const GAP_Y = 28
  const gridW = GRID_COLS * HEAD_W + (GRID_COLS - 1) * GAP_X
  const gridX = (VIEWBOX_W - gridW) / 2
  const gridY = 60

  function renderHead(h: number, hx: number, hy: number) {
    const color = HEAD_COLORS[h]
    const mat = HEADS[h]
    const rowW = HEAD_W - 24
    const rowY = hy + HEAD_H - 36
    const cell = rowW / T
    return (
      <g key={h}>
        <rect
          x={hx}
          y={hy}
          width={HEAD_W}
          height={HEAD_H}
          rx={3}
          fill="rgba(255,255,255,0.018)"
          stroke={color}
          strokeOpacity={0.35}
        />
        <text
          x={hx + 10}
          y={hy + 20}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={color}
        >
          head {h}
        </text>
        <text
          x={hx + HEAD_W - 10}
          y={hy + 20}
          textAnchor="end"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
        >
          {HEAD_LABELS[h]}
        </text>

        {/* arcs */}
        {mat.map((row, q) =>
          row.map((w, k) => {
            if (k > q || w < 0.05) return null
            const x1 = hx + 12 + k * cell + cell / 2
            const x2 = hx + 12 + q * cell + cell / 2
            const mx = (x1 + x2) / 2
            const apex = rowY - Math.max(10, Math.min(70, Math.abs(x2 - x1) * 1.2))
            const d = `M ${x1} ${rowY} Q ${mx} ${apex} ${x2} ${rowY}`
            return (
              <motion.path
                key={`${h}-${q}-${k}`}
                d={d}
                fill="none"
                stroke={color}
                strokeOpacity={w * 0.7}
                strokeWidth={0.5 + w * 2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, strokeOpacity: [0, w * 0.85, w * 0.5] }}
                transition={{
                  duration: 2,
                  delay: h * 0.2 + q * 0.08,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            )
          })
        )}

        {/* tokens */}
        {TOKENS.map((t, i) => (
          <g key={i}>
            <rect
              x={hx + 12 + i * cell + 1}
              y={rowY}
              width={cell - 2}
              height={18}
              rx={1}
              fill="rgba(0,0,0,0.4)"
              stroke={color}
              strokeOpacity={0.25}
            />
            <text
              x={hx + 12 + i * cell + cell / 2}
              y={rowY + 13}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={COLORS.fg}
            >
              {t}
            </text>
          </g>
        ))}
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" className="block">
      <text
        x={VIEWBOX_W / 2}
        y={32}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.18em"
        fill={COLORS.dim}
      >
        MULTI-HEAD ATTENTION · 6 HEADS IN PARALLEL
      </text>

      {HEADS.map((_, h) => {
        const col = h % GRID_COLS
        const row = Math.floor(h / GRID_COLS)
        const hx = gridX + col * (HEAD_W + GAP_X)
        const hy = gridY + row * (HEAD_H + GAP_Y)
        return renderHead(h, hx, hy)
      })}

      {/* concat arrows downward */}
      {HEADS.map((_, h) => {
        const col = h % GRID_COLS
        const row = Math.floor(h / GRID_COLS)
        const hx = gridX + col * (HEAD_W + GAP_X) + HEAD_W / 2
        const hy = gridY + row * (HEAD_H + GAP_Y) + HEAD_H
        const targetY = 460
        const targetX = VIEWBOX_W / 2
        return (
          <motion.path
            key={`cat-${h}`}
            d={`M ${hx} ${hy} Q ${hx} ${hy + 20} ${targetX} ${targetY}`}
            fill="none"
            stroke={HEAD_COLORS[h]}
            strokeOpacity={0.4}
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5 + h * 0.12 }}
          />
        )
      })}

      {/* concat box */}
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <rect
          x={VIEWBOX_W / 2 - 130}
          y={460}
          width={260}
          height={36}
          rx={3}
          fill="rgba(255,255,255,0.04)"
          stroke={COLORS.fg}
          strokeOpacity={0.4}
        />
        <text
          x={VIEWBOX_W / 2}
          y={478}
          textAnchor="middle"
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill={COLORS.fg}
        >
          concat & project → back to 384 dims
        </text>
        <text
          x={VIEWBOX_W / 2}
          y={491}
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
        >
          6 × 64 = 384 · one perspective per head, blended into a single output
        </text>
      </motion.g>
    </svg>
  )
}
