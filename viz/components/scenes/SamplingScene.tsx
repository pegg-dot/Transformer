'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, glyph } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520

// Canned logits for demo
const CHARS = ['N', 'a', 'y', ' ', ',', 'O', 'e', 'i', 'o', 'r', 's', 't', 'u']
const LOGITS = [4.1, 3.6, 2.8, 2.2, 1.9, 1.2, 1.0, 0.6, 0.5, 0.1, -0.2, -0.4, -1.0]

const TEMPS = [0.4, 1.0, 1.8]
const TEMP_LABELS = ['T = 0.4  · sharp', 'T = 1.0  · normal', 'T = 1.8  · flat']
const TEMP_DESC = ['top 1-2 dominate', 'natural distribution', 'everything becomes plausible']

function softmax(logits: number[], T: number) {
  const scaled = logits.map((x) => x / T)
  const max = Math.max(...scaled)
  const exps = scaled.map((x) => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/**
 * Scene — Decoding: softmax + temperature + sampling
 *
 * Shows the same logits at three different temperatures side-by-side as bar
 * charts. Auto-cycles. A "sample" dot lands on one of the bars weighted by
 * its probability.
 */
export function SamplingScene() {
  const [tempIdx, setTempIdx] = useState(1)
  const [sampled, setSampled] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTempIdx((i) => (i + 1) % TEMPS.length)
    }, 3400)
    return () => clearInterval(id)
  }, [])

  const T = TEMPS[tempIdx]
  const probs = useMemo(() => softmax(LOGITS, T), [T])

  useEffect(() => {
    // pick a sample every 1.2s based on current probs
    const id = setInterval(() => {
      let r = Math.random()
      for (let i = 0; i < probs.length; i++) {
        r -= probs[i]
        if (r <= 0) {
          setSampled(i)
          return
        }
      }
      setSampled(probs.length - 1)
    }, 1400)
    return () => clearInterval(id)
  }, [probs])

  const MAT_X = 60
  const MAT_Y = 120
  const BAR_W = 44
  const BAR_GAP = 8
  const BAR_MAX_H = 260
  const maxProb = Math.max(...probs)

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
        DECODING · SOFTMAX WITH TEMPERATURE → SAMPLE
      </text>

      {/* Temperature label */}
      <motion.text
        key={tempIdx}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        x={VIEWBOX_W / 2}
        y={72}
        textAnchor="middle"
        fontSize="22"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COLORS.amber}
      >
        {TEMP_LABELS[tempIdx]}
      </motion.text>
      <motion.text
        key={`d-${tempIdx}`}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        x={VIEWBOX_W / 2}
        y={95}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        {TEMP_DESC[tempIdx]}
      </motion.text>

      {/* Temperature indicator on a line */}
      <g transform={`translate(${VIEWBOX_W / 2 - 120}, 440)`}>
        <line x1={0} x2={240} y1={8} y2={8} stroke={COLORS.rule} strokeWidth="2" />
        <motion.circle
          cx={((T - 0.2) / 1.8) * 240}
          cy={8}
          r={6}
          fill={COLORS.amber}
          animate={{ cx: ((T - 0.2) / 1.8) * 240 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        />
        <text x={0} y={30} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          sharp
        </text>
        <text x={120} y={30} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim} textAnchor="middle">
          T
        </text>
        <text x={240} y={30} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim} textAnchor="end">
          flat
        </text>
      </g>

      {/* Bars */}
      {probs.map((p, i) => {
        const barH = (p / maxProb) * BAR_MAX_H
        const x = MAT_X + i * (BAR_W + BAR_GAP)
        const y = MAT_Y + (BAR_MAX_H - barH)
        const isSampled = i === sampled
        return (
          <g key={i}>
            <motion.rect
              animate={{
                y,
                height: barH,
                fill: isSampled ? COLORS.red : COLORS.blue,
              }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              x={x}
              width={BAR_W}
              rx={2}
              opacity={0.7}
              stroke={isSampled ? COLORS.red : 'none'}
              filter={isSampled ? 'url(#bar-glow)' : undefined}
            />
            {/* Token character */}
            <rect
              x={x}
              y={MAT_Y + BAR_MAX_H + 8}
              width={BAR_W}
              height={28}
              rx={2}
              fill="rgba(255,255,255,0.02)"
              stroke={isSampled ? COLORS.red : COLORS.rule}
            />
            <text
              x={x + BAR_W / 2}
              y={MAT_Y + BAR_MAX_H + 27}
              textAnchor="middle"
              fontSize="16"
              fontFamily="var(--font-mono)"
              fill={isSampled ? COLORS.red : COLORS.fg}
            >
              {glyph(CHARS[i])}
            </text>
            {/* Probability number */}
            <motion.text
              animate={{ y: y - 8 }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              x={x + BAR_W / 2}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={isSampled ? COLORS.red : COLORS.dim}
            >
              {(p * 100).toFixed(0)}%
            </motion.text>
          </g>
        )
      })}

      <defs>
        <filter id="bar-glow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* sampled callout */}
      <motion.g
        key={`sample-${sampled}-${tempIdx}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <text
          x={VIEWBOX_W - 90}
          y={440}
          textAnchor="end"
          fontSize="10"
          fontFamily="var(--font-mono)"
          letterSpacing="0.18em"
          fill={COLORS.dim}
        >
          DIE ROLL →
        </text>
        <rect
          x={VIEWBOX_W - 80}
          y={420}
          width={50}
          height={50}
          rx={3}
          fill="rgba(248,113,113,0.08)"
          stroke={COLORS.red}
        />
        <text
          x={VIEWBOX_W - 55}
          y={452}
          textAnchor="middle"
          fontSize="26"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.red}
        >
          {glyph(CHARS[sampled])}
        </text>
      </motion.g>
    </svg>
  )
}
