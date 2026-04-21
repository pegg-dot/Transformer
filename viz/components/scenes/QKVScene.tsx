'use client'

import { motion } from 'framer-motion'
import { COLORS, VectorBar, makeRng } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520
const D = 32

const rng = makeRng(42)
const x = Array.from({ length: D }).map(() => rng() * 2 - 1)
const q = Array.from({ length: D }).map(() => rng() * 2 - 1)
const k = Array.from({ length: D }).map(() => rng() * 2 - 1)
const v = Array.from({ length: D }).map(() => rng() * 2 - 1)

/**
 * Scene — One vector becomes three: Q, K, V
 *
 * The input vector is multiplied by three different learned matrices to
 * produce query, key, and value vectors. This scene shows one vector going
 * through three colored "prisms" and emerging as three colored vectors.
 */
export function QKVScene() {
  const CENTER_X = VIEWBOX_W / 2
  const IN_Y = 90
  const OUT_Y = 310
  const CELL_W = 10

  const inX = CENTER_X - (D * CELL_W) / 2
  const vectorW = D * CELL_W

  const qY = OUT_Y - 60
  const kY = OUT_Y
  const vY = OUT_Y + 60

  // Three output x positions (spread horizontally)
  const qX = 90
  const kX = CENTER_X - vectorW / 2
  const vX = VIEWBOX_W - 90 - vectorW

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" className="block">
      {/* input vector x */}
      <text
        x={inX - 14}
        y={IN_Y + 10}
        textAnchor="end"
        fontSize="14"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COLORS.fg}
      >
        x
      </text>
      <motion.g
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <VectorBar x={inX} y={IN_Y} values={x} cellW={CELL_W} cellH={18} scale={1} />
      </motion.g>
      <text
        x={inX + vectorW / 2}
        y={IN_Y + 34}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        input residual · 384-dim
      </text>

      {/* three projections — labeled "prisms" */}
      {[
        { x: qX, y: qY, label: 'Q', sub: 'what am I asking?', vec: q, color: COLORS.amber, mid: 200 },
        { x: kX, y: kY, label: 'K', sub: 'what do I offer?', vec: k, color: COLORS.blue, mid: 180 },
        { x: vX, y: vY, label: 'V', sub: 'my actual content', vec: v, color: COLORS.mint, mid: 220 },
      ].map((p, idx) => {
        const from = { x: inX + vectorW / 2, y: IN_Y + 9 }
        const to = { x: p.x + vectorW / 2, y: p.y + 9 }
        const midX = (from.x + to.x) / 2
        const midY = p.mid
        return (
          <g key={p.label}>
            {/* curved connector */}
            <motion.path
              d={`M ${from.x} ${from.y + 10} Q ${midX} ${midY}, ${to.x} ${to.y - 10}`}
              fill="none"
              stroke={p.color}
              strokeOpacity={0.35}
              strokeWidth="1.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.3 + idx * 0.2 }}
            />

            {/* transforming particle */}
            <motion.circle
              r="4"
              fill={p.color}
              filter="url(#qkv-glow)"
              initial={{ cx: from.x, cy: from.y + 10, opacity: 0 }}
              animate={{
                cx: [from.x, midX, to.x],
                cy: [from.y + 10, midY, to.y - 10],
                opacity: [0, 1, 1, 0],
                r: [2, 6, 4],
              }}
              transition={{
                duration: 2.4,
                delay: 1 + idx * 0.35,
                repeat: Infinity,
                repeatDelay: 2,
                times: [0, 0.5, 0.9, 1],
                ease: 'easeInOut',
              }}
            />

            {/* projection matrix symbol */}
            <g transform={`translate(${midX - 22}, ${midY - 22})`}>
              <rect
                x="0"
                y="0"
                width="44"
                height="44"
                rx="3"
                fill="rgba(255,255,255,0.03)"
                stroke={p.color}
                strokeOpacity={0.5}
              />
              <text
                x="22"
                y="20"
                textAnchor="middle"
                fontSize="14"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={p.color}
              >
                W{String.fromCharCode(120 + idx === 123 ? 122 : 120 + idx)}
              </text>
              <text
                x="22"
                y="36"
                textAnchor="middle"
                fontSize="8"
                fontFamily="var(--font-mono)"
                fill={COLORS.dim}
              >
                learned
              </text>
            </g>

            {/* output vector */}
            <VectorBar x={p.x} y={p.y} values={p.vec} cellW={CELL_W} cellH={18} scale={1} />
            <text
              x={p.x - 14}
              y={p.y + 14}
              textAnchor="end"
              fontSize="18"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={p.color}
            >
              {p.label}
            </text>
            <text
              x={p.x + vectorW / 2}
              y={p.y + 36}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={p.color}
            >
              {p.sub}
            </text>
          </g>
        )
      })}

      <defs>
        <filter id="qkv-glow">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* caption */}
      <text
        x={VIEWBOX_W / 2}
        y={VIEWBOX_H - 52}
        textAnchor="middle"
        fontSize="14"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COLORS.dim}
      >
        the same input vector becomes three different roles.
      </text>
      <text
        x={VIEWBOX_W / 2}
        y={VIEWBOX_H - 28}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        Q = x · W_q   ·   K = x · W_k   ·   V = x · W_v
      </text>
    </svg>
  )
}
