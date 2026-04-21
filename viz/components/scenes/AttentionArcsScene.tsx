'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, glyph } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520

const SENT = 'the cat sat on mat'
const TOKENS = SENT.split('')
const T = TOKENS.length

// Canned attention patterns per "head" — cycles automatically so the scene feels alive
function patternFor(head: number): number[][] {
  const out: number[][] = []
  for (let q = 0; q < T; q++) {
    const row = new Array(T).fill(0)
    if (head === 0) {
      // previous-token head
      if (q > 0) row[q - 1] = 0.8
      row[q] = 0.2
    } else if (head === 1) {
      // first token (BOS-like)
      row[0] = 0.6
      row[q] = 0.4
    } else if (head === 2) {
      // looks at vowels (cat/sat/mat hook)
      for (let k = 0; k <= q; k++) {
        if ('aeiou'.includes(TOKENS[k])) row[k] = 0.7
      }
      row[q] = 0.3
      const s = row.reduce((a, b) => a + b, 0) || 1
      for (let k = 0; k <= q; k++) row[k] /= s
    } else {
      // even-spread
      for (let k = 0; k <= q; k++) row[k] = 1 / (q + 1)
    }
    return row.slice(0, T)
  }
  return out
}

const HEADS = [
  { color: COLORS.blue, label: 'previous-token head', pattern: patternFor(0) },
  { color: COLORS.pink, label: 'start-of-sequence head', pattern: patternFor(1) },
  { color: COLORS.mint, label: 'vowel-seeker head', pattern: patternFor(2) },
]

// Rebuild full matrices
function fullMatrix(headIdx: number): number[][] {
  const out: number[][] = []
  for (let q = 0; q < T; q++) {
    const row = new Array(T).fill(0)
    if (headIdx === 0) {
      if (q > 0) row[q - 1] = 0.85
      row[q] = 0.15
    } else if (headIdx === 1) {
      row[0] = 0.55
      row[q] = 0.45
    } else if (headIdx === 2) {
      let sum = 0
      for (let k = 0; k <= q; k++) {
        if ('aeiou'.includes(TOKENS[k])) {
          row[k] = 0.8
          sum += 0.8
        }
      }
      row[q] = 0.4
      sum += 0.4
      if (sum > 0) for (let k = 0; k <= q; k++) row[k] /= sum
    }
    out.push(row)
  }
  return out
}

/**
 * Scene — Attention arcs (the iconic animation)
 *
 * Tokens in a row. For each query, arcs draw from query → earlier keys with
 * thickness = weight. Cycles through 3 "kinds" of heads, auto-plays query
 * forward very slowly so viewers can see the pattern emerge.
 */
export function AttentionArcsScene() {
  const [headIdx, setHeadIdx] = useState(0)
  const [query, setQuery] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setQuery((q) => {
        if (q + 1 >= T) {
          setHeadIdx((h) => (h + 1) % HEADS.length)
          return 0
        }
        return q + 1
      })
    }, 1400)
    return () => clearInterval(id)
  }, [])

  const weights = fullMatrix(headIdx)
  const head = HEADS[headIdx]

  const CELL_W = 40
  const GAP = 4
  const rowW = T * (CELL_W + GAP) - GAP
  const rowX = (VIEWBOX_W - rowW) / 2
  const rowY = 380
  const cellH = 40

  const tokX = (i: number) => rowX + i * (CELL_W + GAP)
  const tokCenter = (i: number) => tokX(i) + CELL_W / 2

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
        ATTENTION · ONE QUERY AT A TIME
      </text>

      <motion.text
        key={`t-${headIdx}`}
        x={VIEWBOX_W / 2}
        y={66}
        textAnchor="middle"
        fontSize="22"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={head.color}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {head.label}
      </motion.text>

      <defs>
        <filter id="aa-glow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* arcs for current query */}
      {weights[query]?.map((w, k) => {
        if (k > query || w < 0.02) return null
        const x1 = tokCenter(k)
        const x2 = tokCenter(query)
        const midX = (x1 + x2) / 2
        const span = Math.abs(x2 - x1)
        const apexY = Math.max(100, rowY - 60 - Math.sqrt(span) * 10)
        const d = `M ${x1} ${rowY} Q ${midX} ${apexY} ${x2} ${rowY}`
        return (
          <motion.path
            key={`${headIdx}-${query}-${k}`}
            d={d}
            fill="none"
            stroke={head.color}
            strokeOpacity={Math.max(0.2, w * 0.95)}
            strokeWidth={0.6 + w * 4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )
      })}

      {/* flying dot */}
      {(() => {
        const row = weights[query] ?? []
        let bestK = query
        let bestV = row[query] ?? 0
        for (let k = 0; k <= query; k++) {
          if (row[k] > bestV) {
            bestV = row[k]
            bestK = k
          }
        }
        if (bestV < 0.1) return null
        const x1 = tokCenter(bestK)
        const x2 = tokCenter(query)
        const midX = (x1 + x2) / 2
        const span = Math.abs(x2 - x1)
        const apexY = Math.max(100, rowY - 60 - Math.sqrt(span) * 10)
        return (
          <motion.circle
            key={`dot-${headIdx}-${query}`}
            r={4}
            fill={head.color}
            filter="url(#aa-glow)"
            initial={{ cx: x2, cy: rowY, opacity: 0 }}
            animate={{
              cx: [x2, midX, x1],
              cy: [rowY, apexY, rowY],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        )
      })()}

      {/* tokens */}
      {TOKENS.map((ch, i) => {
        const isQuery = i === query
        const isAccessible = i <= query
        return (
          <g key={i} transform={`translate(${tokX(i)}, ${rowY})`}>
            <rect
              width={CELL_W}
              height={cellH}
              rx={3}
              fill={isQuery ? head.color : 'rgba(255,255,255,0.025)'}
              stroke={isQuery ? head.color : COLORS.ruleStrong}
              opacity={isAccessible ? 1 : 0.25}
            />
            <text
              x={CELL_W / 2}
              y={cellH / 2 + 5}
              textAnchor="middle"
              fontSize="17"
              fontFamily="var(--font-mono)"
              fill={isQuery ? COLORS.bg : COLORS.fg}
              opacity={isAccessible ? 1 : 0.4}
            >
              {glyph(ch)}
            </text>
          </g>
        )
      })}

      {/* current query readout */}
      <motion.text
        key={`q-${query}-${headIdx}`}
        x={VIEWBOX_W / 2}
        y={rowY + 70}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        query: “{TOKENS[query]}” at position {query} — looking at prior tokens
      </motion.text>
    </svg>
  )
}
