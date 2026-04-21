'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, glyph, makeRng } from '../scenes/primitives'

/**
 * Multi-head attention — six heads running simultaneously, each showing its
 * own Q, K, V projections AND its own attention weight matrix. The point is
 * scale: each head repeats the full self-attention machinery in parallel,
 * just with different learned weights.
 */

const TOKENS = ['I', ' ', 's', 'a', 'w', ' ']
const T = TOKENS.length
const N_HEADS = 6
const D_K = 4

const HEAD_COLORS = [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.amber, COLORS.pink, COLORS.cyan]
const HEAD_LABELS = [
  'previous-token',
  'line-start',
  'verb-finder',
  'article-hook',
  'content-match',
  'two-back',
]

// Pre-compute per-head Q/K/V and weight matrices
function makeHeadData(h: number) {
  const rng = makeRng(h * 31 + 5)
  const Q = Array.from({ length: T }).map(() =>
    Array.from({ length: D_K }).map(() => +(rng() * 2 - 1).toFixed(2))
  )
  const K = Array.from({ length: T }).map(() =>
    Array.from({ length: D_K }).map(() => +(rng() * 2 - 1).toFixed(2))
  )
  const V = Array.from({ length: T }).map(() =>
    Array.from({ length: D_K }).map(() => +(rng() * 2 - 1).toFixed(2))
  )
  // Hand-crafted attention weights so each head is visually distinctive
  const W: number[][] = []
  for (let q = 0; q < T; q++) {
    const row = new Array(T).fill(0)
    if (h === 0 && q > 0) row[q - 1] = 0.8
    if (h === 1) row[0] = 0.65
    if (h === 2) {
      for (let k = 0; k <= q; k++) if ('aeiou'.includes(TOKENS[k]) || TOKENS[k] === 'w') row[k] = 0.7
    }
    if (h === 3) {
      for (let k = 0; k <= q; k++) if (TOKENS[k] === ' ') row[k] = 0.7
    }
    if (h === 4) {
      for (let k = 0; k <= q; k++) row[k] = 0.1 + rng() * 0.8
    }
    if (h === 5 && q > 1) row[q - 2] = 0.65
    row[q] += 0.15
    let s = 0
    for (let k = 0; k <= q; k++) {
      row[k] = (row[k] || 0.04) + rng() * 0.1
      s += row[k]
    }
    if (s > 0) for (let k = 0; k <= q; k++) row[k] /= s
    for (let k = q + 1; k < T; k++) row[k] = 0
    W.push(row.map((v) => +v.toFixed(3)))
  }
  return { Q, K, V, W }
}

const HEADS = Array.from({ length: N_HEADS }).map((_, h) => ({
  color: HEAD_COLORS[h],
  label: HEAD_LABELS[h],
  ...makeHeadData(h),
}))

export function MultiHeadParallel() {
  const [activeHead, setActiveHead] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="small-caps text-[var(--fg-dim)]">
              multi-head attention · all {N_HEADS} heads in parallel
            </div>
            <div className="mt-1 display text-[22px]">Six copies of the same machinery.</div>
            <div className="mt-1 text-[12px] text-[var(--fg-muted)]">
              Every head projects the same input into its own Q, K, V with its own learned
              matrices — then runs the full self-attention independently. Results are concatenated
              at the end.
            </div>
          </div>
          <div className="mono text-[10px] text-[var(--fg-dim)]">click a head to isolate</div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HEADS.map((head, h) => (
            <HeadCard
              key={h}
              idx={h}
              head={head}
              tick={tick}
              isActive={activeHead === h}
              isDim={activeHead !== null && activeHead !== h}
              onClick={() => setActiveHead(activeHead === h ? null : h)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[2px] border border-[var(--rule)] bg-[rgba(255,255,255,0.015)] p-4">
        <div className="flex flex-wrap items-center gap-4 mono text-[11px] text-[var(--fg-muted)]">
          <span className="small-caps text-[var(--fg-dim)]">after the heads</span>
          <div className="flex items-center gap-2">
            <span>concat</span>
            <span className="text-[var(--fg-dim)]">→</span>
            <span className="tabular text-[var(--fg)]">
              6 × d_k (64) = 384
            </span>
          </div>
          <span className="text-[var(--fg-dim)]">·</span>
          <div className="flex items-center gap-2">
            <span>project ×W_o</span>
            <span className="text-[var(--fg-dim)]">→</span>
            <span className="tabular text-[var(--fg)]">back to 384</span>
          </div>
          <span className="ml-auto text-[var(--fg-dim)]">
            each head learns a different relationship — the model gets six perspectives for the same compute budget
          </span>
        </div>
      </div>
    </div>
  )
}

function HeadCard({
  idx,
  head,
  tick,
  isActive,
  isDim,
  onClick,
}: {
  idx: number
  head: (typeof HEADS)[number]
  tick: number
  isActive: boolean
  isDim: boolean
  onClick: () => void
}) {
  const HEAT_CELL = 16
  const highlightedRow = tick % T

  return (
    <motion.div
      onClick={onClick}
      animate={{ opacity: isDim ? 0.35 : 1, scale: isActive ? 1.02 : 1 }}
      className={`cursor-pointer rounded-[2px] border p-4 transition-colors ${
        isActive
          ? 'bg-[var(--bg-elevated)]'
          : 'bg-[rgba(255,255,255,0.012)] hover:bg-[rgba(255,255,255,0.03)]'
      }`}
      style={{
        borderColor: isActive ? head.color : 'var(--rule)',
        boxShadow: isActive ? `0 0 0 1px ${head.color}, 0 10px 40px -10px ${head.color}40` : undefined,
      }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="display text-[20px]" style={{ color: head.color }}>
            h{idx}
          </span>
          <span className="mono text-[10px]" style={{ color: head.color, opacity: 0.75 }}>
            {head.label}
          </span>
        </div>
        <span className="mono text-[9px] text-[var(--fg-dim)]">[T={T}, d_k={D_K}]</span>
      </div>

      {/* Q/K/V strip — super compact matrices */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {([{ n: 'Q', v: head.Q }, { n: 'K', v: head.K }, { n: 'V', v: head.V }]).map((grid) => (
          <div key={grid.n}>
            <div className="mono mb-1 text-[9px]" style={{ color: head.color }}>
              {grid.n}
            </div>
            <svg viewBox={`0 0 ${D_K * 8} ${T * 8}`} width="100%" className="block">
              {grid.v.map((row, r) =>
                row.map((val, c) => {
                  const t = Math.max(-1, Math.min(1, val / 1.5))
                  const rgb = head.color.replace('#', '')
                  const fill =
                    t >= 0
                      ? `${head.color}${Math.round((0.15 + t * 0.75) * 255).toString(16).padStart(2, '0')}`
                      : `#f87171${Math.round((0.15 + -t * 0.75) * 255).toString(16).padStart(2, '0')}`
                  void rgb
                  return <rect key={`${r}-${c}`} x={c * 8} y={r * 8} width={7} height={7} fill={fill} />
                })
              )}
            </svg>
          </div>
        ))}
      </div>

      {/* Attention heatmap with row highlight */}
      <div className="mb-2">
        <div className="mono mb-1 flex items-center justify-between text-[9px]">
          <span style={{ color: head.color }}>weights · softmax( Q·Kᵀ / √d_k )</span>
          <span className="text-[var(--fg-dim)]">6 × 6</span>
        </div>
        <svg viewBox={`0 0 ${T * HEAT_CELL + 24} ${T * HEAT_CELL + 18}`} width="100%">
          {/* key chars above */}
          {TOKENS.map((t, i) => (
            <text
              key={`k-${i}`}
              x={20 + i * HEAT_CELL + HEAT_CELL / 2}
              y={10}
              textAnchor="middle"
              fontSize="8"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              {glyph(t)}
            </text>
          ))}
          {/* query chars left */}
          {TOKENS.map((t, i) => (
            <text
              key={`q-${i}`}
              x={14}
              y={18 + i * HEAT_CELL + HEAT_CELL / 2 + 3}
              textAnchor="end"
              fontSize="8"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              {glyph(t)}
            </text>
          ))}
          {/* cells */}
          {head.W.map((row, r) =>
            row.map((val, c) => {
              const hex = head.color
              const alpha = Math.round((0.08 + val * 0.9) * 255).toString(16).padStart(2, '0')
              const isRowActive = r === highlightedRow
              return (
                <motion.rect
                  key={`${r}-${c}`}
                  x={20 + c * HEAT_CELL}
                  y={18 + r * HEAT_CELL}
                  width={HEAT_CELL - 1}
                  height={HEAT_CELL - 1}
                  fill={`${hex}${alpha}`}
                  animate={{
                    opacity: isRowActive ? 1 : 0.65,
                    stroke: isRowActive ? hex : 'transparent',
                  }}
                  transition={{ duration: 0.4 }}
                />
              )
            })
          )}
          {/* highlighted-row arrow */}
          <motion.rect
            x={18}
            y={18 + highlightedRow * HEAT_CELL - 1}
            width={T * HEAT_CELL + 2}
            height={HEAT_CELL + 2}
            fill="none"
            stroke={head.color}
            strokeWidth={1.5}
            animate={{ y: 18 + highlightedRow * HEAT_CELL - 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          />
        </svg>
        <div className="mono mt-1 text-[9px] text-[var(--fg-dim)]">
          row {highlightedRow + 1} (&ldquo;{glyph(TOKENS[highlightedRow])}&rdquo;) — sum ={' '}
          {head.W[highlightedRow].reduce((a, b) => a + b, 0).toFixed(2)}
        </div>
      </div>
    </motion.div>
  )
}
