'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COLORS, glyph, makeRng } from '../scenes/primitives'

/**
 * Self-attention, step by step, with REAL numbers visible.
 *
 * Stages (auto-cycle):
 *   1. raw Q·Kᵀ
 *   2. scale by 1/√d_k
 *   3. apply causal mask
 *   4. row softmax
 *   5. multiply by V → final output
 */

const TOKENS = ['T', 'h', 'e', ' ', 'c', 'a', 't']
const T = TOKENS.length
const D_K = 4

const rng = makeRng(77)
const Q: number[][] = Array.from({ length: T }).map(() =>
  Array.from({ length: D_K }).map(() => +(rng() * 2 - 1).toFixed(2))
)
const K: number[][] = Array.from({ length: T }).map(() =>
  Array.from({ length: D_K }).map(() => +(rng() * 2 - 1).toFixed(2))
)
const V: number[][] = Array.from({ length: T }).map(() =>
  Array.from({ length: D_K }).map(() => +(rng() * 2 - 1).toFixed(2))
)

function matmul(a: number[][], bT: number[][]): number[][] {
  return a.map((ar) => bT.map((br) => +ar.reduce((s, v, i) => s + v * br[i], 0).toFixed(2)))
}
function scale(m: number[][], s: number) {
  return m.map((r) => r.map((v) => +(v * s).toFixed(2)))
}
function causalMask(m: number[][]) {
  return m.map((r, i) => r.map((v, j) => (j > i ? -Infinity : v)))
}
function rowSoftmax(m: number[][]) {
  return m.map((row) => {
    const finite = row.map((v) => (Number.isFinite(v) ? v : -Infinity))
    const mx = Math.max(...finite.filter(Number.isFinite))
    const exps = finite.map((v) => (Number.isFinite(v) ? Math.exp(v - mx) : 0))
    const s = exps.reduce((a, b) => a + b, 0) || 1
    return exps.map((e) => +(e / s).toFixed(3))
  })
}
function matmulWeightsByV(weights: number[][], V: number[][]): number[][] {
  return weights.map((wRow) => {
    const out = new Array(D_K).fill(0)
    for (let j = 0; j < T; j++) for (let d = 0; d < D_K; d++) out[d] += wRow[j] * V[j][d]
    return out.map((v) => +v.toFixed(2))
  })
}

const SCORES = matmul(Q, K)                       // raw Q·Kᵀ
const SCALED = scale(SCORES, 1 / Math.sqrt(D_K))  // /√d_k
const MASKED = causalMask(SCALED)
const WEIGHTS = rowSoftmax(MASKED)
const OUTPUT = matmulWeightsByV(WEIGHTS, V)

type Stage = 'qk' | 'scale' | 'mask' | 'softmax' | 'av'
const STAGES: { id: Stage; label: string; sub: string; formula: string }[] = [
  { id: 'qk',      label: 'Q · Kᵀ',              sub: 'dot product of every query with every key',                     formula: 'scores[q,k] = Σᵢ Q[q,i] · K[k,i]' },
  { id: 'scale',   label: '÷ √d_k',              sub: 'scale so large dot-products don’t saturate softmax',            formula: 'scores ÷ √d_k' },
  { id: 'mask',    label: 'causal mask',         sub: 'block attention to the future (upper triangle → −∞)',           formula: 'scores[q,k] = −∞  if  k > q' },
  { id: 'softmax', label: 'row softmax',         sub: 'normalize each row to a probability distribution',              formula: 'w[q,k] = exp(s[q,k]) / Σⱼ exp(s[q,j])' },
  { id: 'av',      label: 'w · V',               sub: 'weighted sum of value vectors',                                 formula: 'out[q,i] = Σₖ w[q,k] · V[k,i]' },
]

function cellColor(v: number, stage: Stage) {
  if (!Number.isFinite(v)) return 'rgba(0,0,0,0.85)'
  if (stage === 'softmax' || stage === 'av') {
    const t = Math.max(0, Math.min(1, stage === 'softmax' ? v : Math.abs(v) / 1.5))
    return `rgba(96,165,250,${0.1 + t * 0.8})`
  }
  const t = Math.max(-1, Math.min(1, v / 2))
  if (t >= 0) {
    const a = 0.1 + t * 0.75
    return `rgba(96,165,250,${a})`
  } else {
    const a = 0.1 + -t * 0.75
    return `rgba(248,113,113,${a})`
  }
}

export function SelfAttentionStep() {
  const [stageIdx, setStageIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const stage = STAGES[stageIdx].id

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), 4500)
    return () => clearInterval(id)
  }, [paused])

  // Which matrix to display
  const matrix =
    stage === 'qk'
      ? SCORES
      : stage === 'scale'
        ? SCALED
        : stage === 'mask'
          ? MASKED
          : stage === 'softmax'
            ? WEIGHTS
            : WEIGHTS

  const CELL = 52
  const mx = 240
  const my = 40

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="relative rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="small-caps text-[var(--fg-dim)]">
              self-attention · step {stageIdx + 1} of {STAGES.length}
            </div>
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 display text-[28px]"
              style={{ color: COLORS.amber }}
            >
              {STAGES[stageIdx].label}
            </motion.div>
            <div className="mt-1 text-[12px] text-[var(--fg-muted)]">{STAGES[stageIdx].sub}</div>
          </div>
          <div className="flex items-center gap-2">
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setPaused(true)
                  setStageIdx(i)
                }}
                className={`mono h-7 rounded-full border px-3 text-[10px] transition-colors ${
                  stageIdx === i
                    ? 'border-[var(--accent)] bg-[rgba(96,165,250,0.15)] text-[var(--accent)]'
                    : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <svg viewBox={`0 0 ${mx + T * CELL + 40} ${my + T * CELL + 60}`} width="100%">
          {/* key labels (top) */}
          {TOKENS.map((t, i) => (
            <text
              key={`k-${i}`}
              x={mx + i * CELL + CELL / 2}
              y={my - 14}
              textAnchor="middle"
              fontSize="12"
              fontFamily="var(--font-mono)"
              fill={COLORS.blue}
            >
              {glyph(t)}
            </text>
          ))}
          <text
            x={mx + (T * CELL) / 2}
            y={my - 28}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={COLORS.blue}
            letterSpacing="0.18em"
          >
            KEYS K →
          </text>

          {/* query labels (left) */}
          {TOKENS.map((t, i) => (
            <text
              key={`q-${i}`}
              x={mx - 12}
              y={my + i * CELL + CELL / 2 + 5}
              textAnchor="end"
              fontSize="12"
              fontFamily="var(--font-mono)"
              fill={COLORS.amber}
            >
              {glyph(t)}
            </text>
          ))}
          <text
            x={mx - 40}
            y={my + (T * CELL) / 2}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={COLORS.amber}
            letterSpacing="0.18em"
            transform={`rotate(-90 ${mx - 40} ${my + (T * CELL) / 2})`}
          >
            QUERIES Q ↓
          </text>

          {/* cells with values */}
          {matrix.map((row, r) =>
            row.map((v, c) => (
              <g key={`${stage}-${r}-${c}`}>
                <motion.rect
                  x={mx + c * CELL + 1}
                  y={my + r * CELL + 1}
                  width={CELL - 2}
                  height={CELL - 2}
                  rx={2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, fill: cellColor(v, stage) }}
                  transition={{ duration: 0.35 }}
                  stroke={COLORS.rule}
                />
                <motion.text
                  x={mx + c * CELL + CELL / 2}
                  y={my + r * CELL + CELL / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill={Number.isFinite(v) ? 'rgba(255,255,255,0.92)' : COLORS.red}
                  key={`t-${stage}-${r}-${c}`}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * (r * T + c), duration: 0.25 }}
                >
                  {Number.isFinite(v) ? v.toFixed(2) : '−∞'}
                </motion.text>
              </g>
            ))
          )}

          {/* formula row */}
          <text
            x={mx}
            y={my + T * CELL + 38}
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill={COLORS.fg}
          >
            {STAGES[stageIdx].formula}
          </text>
        </svg>
      </div>

      {/* side panel: Q/K/V vectors for selected query + output vector */}
      <div className="flex flex-col gap-4">
        <InputBlock label="Q" values={Q} color={COLORS.amber} />
        <InputBlock label="K" values={K} color={COLORS.blue} />
        <InputBlock label="V" values={V} color={COLORS.mint} />
        <AnimatePresence>
          {stage === 'av' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="display text-[15px]" style={{ color: COLORS.mint }}>
                  output  =  weights · V
                </span>
                <span className="mono text-[9px] text-[var(--fg-dim)]">[T={T}, d_k={D_K}]</span>
              </div>
              <div className="grid grid-cols-[36px_repeat(4,1fr)] gap-1 mono text-[10px]">
                <div />
                {Array.from({ length: D_K }).map((_, d) => (
                  <div key={d} className="text-center text-[var(--fg-dim)]">
                    d{d}
                  </div>
                ))}
                {OUTPUT.map((row, r) => (
                  <FragmentOutputRow key={r} row={row} token={TOKENS[r]} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function FragmentOutputRow({ row, token }: { row: number[]; token: string }) {
  return (
    <>
      <div className="text-[var(--fg-muted)]">{glyph(token)}</div>
      {row.map((v, d) => {
        const t = Math.max(-1, Math.min(1, v / 2))
        const bg =
          t >= 0
            ? `rgba(52,211,153,${0.15 + t * 0.6})`
            : `rgba(248,113,113,${0.15 + -t * 0.6})`
        return (
          <div key={d} className="tabular text-center text-[var(--fg)]" style={{ background: bg }}>
            {v.toFixed(2)}
          </div>
        )
      })}
    </>
  )
}

function InputBlock({ label, values, color }: { label: string; values: number[][]; color: string }) {
  return (
    <div className="rounded-[2px] border border-[var(--rule)] bg-[rgba(255,255,255,0.015)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="display text-[15px]" style={{ color }}>
          {label}
        </span>
        <span className="mono text-[9px] text-[var(--fg-dim)]">[T={T}, d_k={D_K}]</span>
      </div>
      <div className="grid grid-cols-[36px_repeat(4,1fr)] gap-1 mono text-[10px]">
        <div />
        {Array.from({ length: D_K }).map((_, d) => (
          <div key={d} className="text-center text-[var(--fg-dim)]">
            d{d}
          </div>
        ))}
        {values.map((row, r) => (
          <FragmentValueRow key={r} row={row} token={TOKENS[r]} color={color} />
        ))}
      </div>
    </div>
  )
}

function FragmentValueRow({ row, token, color }: { row: number[]; token: string; color: string }) {
  return (
    <>
      <div className="text-[var(--fg-muted)]">{glyph(token)}</div>
      {row.map((v, d) => {
        const t = Math.max(-1, Math.min(1, v / 1.5))
        const rgb =
          color === COLORS.amber
            ? '245,158,11'
            : color === COLORS.blue
              ? '96,165,250'
              : '52,211,153'
        const bg = t >= 0
          ? `rgba(${rgb},${0.15 + t * 0.6})`
          : `rgba(248,113,113,${0.15 + -t * 0.6})`
        return (
          <div key={d} className="tabular text-center text-[var(--fg)]" style={{ background: bg }}>
            {v.toFixed(2)}
          </div>
        )
      })}
    </>
  )
}
