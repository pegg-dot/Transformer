'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, MatrixGrid, makeRng } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520
const T = 8
const TOKENS = ['c', 'a', 't', ' ', 's', 'a', 't', ' ']

function buildScores() {
  const rng = makeRng(71)
  const out: number[][] = []
  for (let q = 0; q < T; q++) {
    const row: number[] = []
    for (let k = 0; k < T; k++) {
      row.push(k > q ? NaN : rng() * 2 - 0.5)
    }
    out.push(row)
  }
  return out
}

function softmaxRow(logits: number[]): number[] {
  const finite = logits.map((x) => (Number.isFinite(x) ? x : -Infinity))
  const max = Math.max(...finite.filter(Number.isFinite))
  const exps = finite.map((x) => (Number.isFinite(x) ? Math.exp(x - max) : 0))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / (sum || 1))
}

const SCORES = buildScores()
const WEIGHTS = SCORES.map(softmaxRow)

type Phase = 'raw' | 'masked' | 'soft'
const PHASES: Phase[] = ['raw', 'masked', 'soft']
const PHASE_LABEL: Record<Phase, string> = {
  raw: 'Q · Kᵀ   (raw scores)',
  masked: 'apply causal mask   (no peeking at the future)',
  soft: 'row softmax   (each row sums to 1.0)',
}
const PHASE_SUBLABEL: Record<Phase, string> = {
  raw: 'dot product of every query with every key, scaled by √d_k',
  masked: 'upper triangle gets −∞, so softmax zeros it out',
  soft: 'weights now behave like probabilities — each query spreads its attention',
}

/**
 * Scene — Attention scores matrix
 *
 * A 3-phase animation that cycles: raw Q·K^T → causal mask → softmax.
 */
export function AttentionScoresScene() {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const phase = PHASES[phaseIdx]

  useEffect(() => {
    const id = setInterval(() => {
      setPhaseIdx((p) => (p + 1) % PHASES.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const CELL = 36
  const MAT_X = (VIEWBOX_W - T * CELL) / 2
  const MAT_Y = 120

  const displayValues: number[][] = (() => {
    if (phase === 'raw') {
      return SCORES.map((row) => row.map((v) => (Number.isFinite(v) ? (v + 0.5) / 2 : (v + 0.5) / 2)))
    }
    if (phase === 'masked') {
      return SCORES.map((row) =>
        row.map((v) => (Number.isFinite(v) ? (v + 0.5) / 2 : -1))
      )
    }
    return WEIGHTS.map((row) => row.map((w) => w))
  })()

  const scale = phase === 'soft' ? 1 : 1
  const hueMode = phase === 'soft' ? 'blue' : 'diverging'

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" className="block">
      {/* Phase label */}
      <motion.g key={phase}>
        <motion.text
          x={VIEWBOX_W / 2}
          y={40}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
          letterSpacing="0.18em"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          STEP {phaseIdx + 1} / 3
        </motion.text>
        <motion.text
          x={VIEWBOX_W / 2}
          y={70}
          textAnchor="middle"
          fontSize="20"
          fontFamily="var(--font-mono)"
          fill={COLORS.fg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {PHASE_LABEL[phase]}
        </motion.text>
        <motion.text
          x={VIEWBOX_W / 2}
          y={92}
          textAnchor="middle"
          fontSize="12"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.dim}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {PHASE_SUBLABEL[phase]}
        </motion.text>
      </motion.g>

      {/* column (key) labels */}
      {TOKENS.map((t, i) => (
        <text
          key={`k-${i}`}
          x={MAT_X + i * CELL + CELL / 2}
          y={MAT_Y - 8}
          textAnchor="middle"
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill={COLORS.blue}
        >
          {t === ' ' ? '·' : t}
        </text>
      ))}
      <text
        x={MAT_X + (T * CELL) / 2}
        y={MAT_Y - 24}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.18em"
        fill={COLORS.blue}
      >
        KEYS K →
      </text>

      {/* row (query) labels */}
      {TOKENS.map((t, i) => (
        <text
          key={`q-${i}`}
          x={MAT_X - 10}
          y={MAT_Y + i * CELL + CELL / 2 + 4}
          textAnchor="end"
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill={COLORS.amber}
        >
          {t === ' ' ? '·' : t}
        </text>
      ))}
      <text
        x={MAT_X - 30}
        y={MAT_Y + (T * CELL) / 2}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.18em"
        fill={COLORS.amber}
        transform={`rotate(-90 ${MAT_X - 30} ${MAT_Y + (T * CELL) / 2})`}
      >
        QUERIES Q ↓
      </text>

      {/* matrix */}
      <motion.g
        key={phase}
        initial={{ opacity: 0.5, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <MatrixGrid
          x={MAT_X}
          y={MAT_Y}
          rows={T}
          cols={T}
          values={displayValues}
          cellSize={CELL - 2}
          cellGap={2}
          scale={scale}
          hueMode={hueMode}
        />
        {/* numeric readouts on softmax phase */}
        {phase === 'soft' &&
          WEIGHTS.map((row, r) =>
            row.map((w, c) =>
              c > r ? null : w > 0.05 ? (
                <text
                  key={`v-${r}-${c}`}
                  x={MAT_X + c * CELL + (CELL - 2) / 2}
                  y={MAT_Y + r * CELL + (CELL - 2) / 2 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill="rgba(255,255,255,0.85)"
                >
                  {w.toFixed(2)}
                </text>
              ) : null
            )
          )}
      </motion.g>

      {/* causal-mask overlay: triangle appearing on phase 2 */}
      {(phase === 'masked' || phase === 'soft') && (
        <motion.g
          key={`mask-${phase}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {Array.from({ length: T }).map((_, r) =>
            Array.from({ length: T }).map((_, c) =>
              c > r ? (
                <rect
                  key={`mask-${r}-${c}`}
                  x={MAT_X + c * CELL}
                  y={MAT_Y + r * CELL}
                  width={CELL - 2}
                  height={CELL - 2}
                  fill="rgba(7,7,9,0.92)"
                  stroke="rgba(255,255,255,0.03)"
                />
              ) : null
            )
          )}
          <text
            x={MAT_X + T * CELL - 8}
            y={MAT_Y + 22}
            textAnchor="end"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            masked (no future peeks)
          </text>
        </motion.g>
      )}

      {/* bottom caption */}
      <text
        x={VIEWBOX_W / 2}
        y={VIEWBOX_H - 30}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        attention = softmax( mask( Q · Kᵀ / √d_k ) )
      </text>
    </svg>
  )
}
