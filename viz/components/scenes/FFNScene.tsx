'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, VectorBar, makeRng } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520

const D = 24      // residual width (for viz)
const D4 = 96     // 4D expansion width (for viz)

const rng = makeRng(91)
const x = Array.from({ length: D }).map(() => rng() * 2 - 1)
const h = Array.from({ length: D4 }).map(() => rng() * 2.4 - 1.2)  // pre-activation
const hRelu = h.map((v) => Math.max(0, v))                         // post-ReLU
const out = Array.from({ length: D }).map(() => rng() * 2 - 1)

/**
 * Scene — Feed-forward network
 *
 * Residual stream vector expands 4×, gets ReLU'd (negatives zero out),
 * compresses back, then adds into the residual stream.
 */
export function FFNScene() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % 4)
    }, 2400)
    return () => clearInterval(id)
  }, [])

  const CENTER_X = VIEWBOX_W / 2
  const CELL_W = 14
  const CELL_W_4X = 6

  const inY = 80
  const expY = 180
  const reluY = 260
  const outY = 340
  const sumY = 420

  const inX = CENTER_X - (D * CELL_W) / 2
  const expX = CENTER_X - (D4 * CELL_W_4X) / 2
  const outX = inX

  const relativeW = D * CELL_W

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
        FEED-FORWARD NETWORK · expand → activate → compress → add
      </text>

      {/* 1. input residual */}
      <text
        x={inX - 12}
        y={inY + 14}
        textAnchor="end"
        fontSize="13"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COLORS.cyan}
      >
        x
      </text>
      <VectorBar x={inX} y={inY} values={x} cellW={CELL_W} cellH={22} scale={1} />
      <text
        x={inX + relativeW + 12}
        y={inY + 14}
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        residual · 384-dim
      </text>

      {/* 2. expansion: 384 → 1536 */}
      <motion.g
        animate={{ opacity: phase >= 1 ? 1 : 0.25 }}
        transition={{ duration: 0.4 }}
      >
        <motion.path
          d={`M ${inX + relativeW / 2} ${inY + 24} L ${expX + (D4 * CELL_W_4X) / 2} ${expY - 6}`}
          fill="none"
          stroke={COLORS.amber}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
        <text
          x={CENTER_X + 12}
          y={(inY + expY) / 2}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.amber}
        >
          × W₁ → 4× wider
        </text>
        <VectorBar x={expX} y={expY} values={h} cellW={CELL_W_4X} cellH={22} scale={1.2} />
        <text
          x={expX + D4 * CELL_W_4X + 12}
          y={expY + 14}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
        >
          1536-dim
        </text>
      </motion.g>

      {/* 3. ReLU — zero out negatives */}
      <motion.g
        animate={{ opacity: phase >= 2 ? 1 : 0.25 }}
        transition={{ duration: 0.4 }}
      >
        <text
          x={CENTER_X + 12}
          y={(expY + reluY) / 2 + 10}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.amber}
        >
          ReLU → keep only positive
        </text>
        <VectorBar x={expX} y={reluY} values={hRelu} cellW={CELL_W_4X} cellH={22} scale={1.2} />
        <text
          x={expX + D4 * CELL_W_4X + 12}
          y={reluY + 14}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
        >
          sparse · many zeros
        </text>
        {/* Indicate zeroed cells */}
        {phase >= 2 &&
          h.map((val, i) =>
            val < 0 ? (
              <motion.rect
                key={`zero-${i}`}
                x={expX + i * CELL_W_4X + 1}
                y={reluY + 2}
                width={CELL_W_4X - 2}
                height={18}
                fill="rgba(7,7,9,0.85)"
                stroke={COLORS.red}
                strokeOpacity={0.3}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.005 }}
              />
            ) : null
          )}
      </motion.g>

      {/* 4. compress back */}
      <motion.g
        animate={{ opacity: phase >= 3 ? 1 : 0.25 }}
        transition={{ duration: 0.4 }}
      >
        <motion.path
          d={`M ${expX + (D4 * CELL_W_4X) / 2} ${reluY + 24} L ${outX + relativeW / 2} ${outY - 6}`}
          fill="none"
          stroke={COLORS.amber}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
        <text
          x={CENTER_X + 12}
          y={(reluY + outY) / 2 + 8}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.amber}
        >
          × W₂ → back to 384
        </text>
        <VectorBar x={outX} y={outY} values={out} cellW={CELL_W} cellH={22} scale={1} />
        <text
          x={outX - 12}
          y={outY + 14}
          textAnchor="end"
          fontSize="13"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.amber}
        >
          Δx
        </text>
      </motion.g>

      {/* 5. residual add */}
      <motion.g
        initial={false}
        animate={{ opacity: phase >= 3 ? 1 : 0.1 }}
        transition={{ duration: 0.5 }}
      >
        <text
          x={inX - 12}
          y={sumY + 14}
          textAnchor="end"
          fontSize="13"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.cyan}
        >
          x ←
        </text>
        <VectorBar
          x={inX}
          y={sumY}
          values={x.map((v, i) => v + out[i])}
          cellW={CELL_W}
          cellH={22}
          scale={1.2}
        />
        <text
          x={inX + relativeW + 12}
          y={sumY + 14}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.cyan}
        >
          x + Δx  ← new residual
        </text>
      </motion.g>

      {/* progress markers */}
      <g transform={`translate(40, 40)`}>
        {['expand', 'activate', 'compress', 'add'].map((lbl, i) => (
          <g key={lbl} transform={`translate(0, ${i * 18})`}>
            <motion.circle
              r={4}
              cx={6}
              cy={6}
              animate={{
                fill: phase >= i ? COLORS.amber : 'rgba(255,255,255,0.1)',
              }}
              transition={{ duration: 0.3 }}
            />
            <text
              x={18}
              y={10}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={phase >= i ? COLORS.fg : COLORS.dim}
            >
              {i + 1}. {lbl}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}
