'use client'

import { motion } from 'framer-motion'
import { COLORS, glyph } from './primitives'

const TEXT = 'cat sat on the mat'
const VIEWBOX_W = 760
const VIEWBOX_H = 520

const CHARS = TEXT.split('')
const IDS: Record<string, number> = {
  a: 1, c: 3, h: 8, e: 5, m: 13, n: 14, o: 15, s: 19, t: 20, ' ': 0,
}

/**
 * Scene 01 — Tokenization
 *
 * A sentence materializes, then each character pulls apart into its own pill
 * with the integer ID that the model actually sees.
 */
export function TokenizationScene() {
  const CELL_W = 34
  const CELL_H = 44
  const GAP = 6
  const rowW = CHARS.length * (CELL_W + GAP) - GAP
  const rowX = (VIEWBOX_W - rowW) / 2
  const topY = 110
  const botY = 280

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" className="block">
      {/* top: sentence as flat text */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <text
          x={VIEWBOX_W / 2}
          y={50}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-mono)"
          letterSpacing="0.18em"
          fill={COLORS.dim}
        >
          INPUT STRING
        </text>
        <text
          x={VIEWBOX_W / 2}
          y={92}
          textAnchor="middle"
          fontSize="42"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.fg}
        >
          “{TEXT}”
        </text>
      </motion.g>

      {/* chars descending into pills */}
      {CHARS.map((ch, i) => {
        const xTarget = rowX + i * (CELL_W + GAP)
        const startX = VIEWBOX_W / 2 - TEXT.length * 9 + i * 19
        return (
          <motion.g key={i}>
            <motion.rect
              initial={{ x: startX, y: 80, width: 16, height: 16, opacity: 0 }}
              animate={{
                x: [startX, startX, xTarget],
                y: [80, 80, topY],
                width: [16, 16, CELL_W],
                height: [16, 16, CELL_H],
                opacity: [0, 0, 1],
              }}
              transition={{
                duration: 2.8,
                delay: 0.4 + i * 0.12,
                repeat: Infinity,
                repeatDelay: CHARS.length * 0.12 + 2,
                times: [0, 0.3, 1],
                ease: 'easeInOut',
              }}
              rx={3}
              fill={COLORS.panel}
              stroke={ch === ' ' ? COLORS.dim : COLORS.blue}
              strokeOpacity={0.7}
            />
            <motion.text
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 1] }}
              transition={{
                duration: 2.8,
                delay: 0.4 + i * 0.12,
                repeat: Infinity,
                repeatDelay: CHARS.length * 0.12 + 2,
                times: [0, 0.3, 0.5, 0.9, 1],
              }}
              x={xTarget + CELL_W / 2}
              y={topY + CELL_H / 2 - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="18"
              fontFamily="var(--font-mono)"
              fill={COLORS.fg}
            >
              {glyph(ch)}
            </motion.text>

            {/* falling arrow + integer ID */}
            <motion.line
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0, 0.4, 0.4, 0] }}
              transition={{
                duration: 2.8,
                delay: 0.6 + i * 0.12,
                repeat: Infinity,
                repeatDelay: CHARS.length * 0.12 + 2,
                times: [0, 0.4, 0.55, 0.7, 0.95, 1],
              }}
              x1={xTarget + CELL_W / 2}
              x2={xTarget + CELL_W / 2}
              y1={topY + CELL_H + 4}
              y2={botY - 4}
              stroke={COLORS.violet}
              strokeDasharray="2 3"
            />
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{
                opacity: [0, 0, 0, 0, 1, 1, 1],
                y: [10, 10, 10, 5, 0, 0, 0],
              }}
              transition={{
                duration: 2.8,
                delay: 0.7 + i * 0.12,
                repeat: Infinity,
                repeatDelay: CHARS.length * 0.12 + 2,
                times: [0, 0.3, 0.5, 0.6, 0.75, 0.95, 1],
              }}
            >
              <rect
                x={xTarget}
                y={botY}
                width={CELL_W}
                height={28}
                rx={2}
                fill="rgba(167,139,250,0.1)"
                stroke={COLORS.violet}
                strokeOpacity={0.7}
              />
              <text
                x={xTarget + CELL_W / 2}
                y={botY + 18}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="13"
                fill={COLORS.violet}
              >
                {(IDS[ch] ?? ch.charCodeAt(0) % 64).toString().padStart(2, '0')}
              </text>
            </motion.g>
          </motion.g>
        )
      })}

      {/* labels */}
      <text
        x={rowX - 12}
        y={topY + CELL_H / 2 + 4}
        textAnchor="end"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        char
      </text>
      <text
        x={rowX - 12}
        y={botY + 18}
        textAnchor="end"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.violet}
      >
        id
      </text>

      <text
        x={VIEWBOX_W / 2}
        y={370}
        textAnchor="middle"
        fontSize="14"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COLORS.dim}
      >
        the model never sees letters — it only sees integers.
      </text>
      <text
        x={VIEWBOX_W / 2}
        y={400}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        vocabulary size: 65 unique characters
      </text>
    </svg>
  )
}
