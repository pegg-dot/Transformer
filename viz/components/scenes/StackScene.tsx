'use client'

import { motion } from 'framer-motion'
import { COLORS } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520
const N_LAYERS = 6
const N_TOKENS = 6

/**
 * Scene — Stacking layers
 *
 * Six blocks stacked vertically, residual stream as a bright glowing spine
 * threading up through all of them. Signal visibly passes layer-by-layer.
 */
export function StackScene() {
  const CENTER_X = VIEWBOX_W / 2
  const BLOCK_W = 420
  const BLOCK_H = 48
  const GAP = 10
  const topY = 80
  const bottomY = topY + N_LAYERS * (BLOCK_H + GAP) + 40

  const tokenW = BLOCK_W / (N_TOKENS + 2)

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
        BLOCK ×6 · EACH ADDS TO THE SAME RESIDUAL STREAM
      </text>

      <defs>
        <linearGradient id="spine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(52,211,153,0.1)" />
          <stop offset="50%" stopColor="rgba(96,165,250,0.8)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.1)" />
        </linearGradient>
        <filter id="spine-glow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* spine (residual stream) */}
      <rect
        x={CENTER_X - BLOCK_W / 2 - 36}
        y={bottomY}
        width={8}
        height={-bottomY + topY}
        transform={`translate(0, 0) scale(1, -1) translate(0, ${-2 * bottomY + 50})`}
      />
      <line
        x1={CENTER_X - BLOCK_W / 2 - 32}
        x2={CENTER_X - BLOCK_W / 2 - 32}
        y1={bottomY}
        y2={topY}
        stroke="url(#spine)"
        strokeWidth="4"
        filter="url(#spine-glow)"
      />
      <text
        x={CENTER_X - BLOCK_W / 2 - 44}
        y={(topY + bottomY) / 2}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.cyan}
        transform={`rotate(-90, ${CENTER_X - BLOCK_W / 2 - 44}, ${(topY + bottomY) / 2})`}
      >
        residual stream · 384-dim
      </text>

      {/* flowing particles along the spine */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.circle
          key={i}
          r={5}
          cx={CENTER_X - BLOCK_W / 2 - 32}
          filter="url(#spine-glow)"
          initial={{ cy: bottomY, opacity: 0, fill: 'rgba(52,211,153,1)' }}
          animate={{
            cy: [bottomY, topY],
            opacity: [0, 1, 1, 0],
            fill: ['rgba(52,211,153,1)', 'rgba(96,165,250,1)', 'rgba(167,139,250,1)', 'rgba(248,113,113,1)'],
          }}
          transition={{
            duration: 5,
            delay: i * 1.2,
            repeat: Infinity,
            times: [0, 0.1, 0.9, 1],
            ease: 'linear',
          }}
        />
      ))}

      {/* 6 blocks */}
      {Array.from({ length: N_LAYERS }).map((_, li) => {
        const y = bottomY - (li + 1) * (BLOCK_H + GAP) + GAP
        const hue = 200 + li * 20
        return (
          <g key={li}>
            <rect
              x={CENTER_X - BLOCK_W / 2}
              y={y}
              width={BLOCK_W}
              height={BLOCK_H}
              rx={2}
              fill={`hsla(${hue}, 60%, 60%, 0.04)`}
              stroke={`hsla(${hue}, 75%, 65%, 0.4)`}
            />
            {/* inside: mini heatmap of attention + ffn markers */}
            {Array.from({ length: 6 }).map((_, c) => (
              <motion.rect
                key={`attn-${li}-${c}`}
                x={CENTER_X - BLOCK_W / 2 + 16 + c * 14}
                y={y + 10}
                width={10}
                height={10}
                fill={`hsla(${hue}, 75%, 65%, 1)`}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{
                  duration: 1.8,
                  delay: li * 0.12 + c * 0.08,
                  repeat: Infinity,
                }}
              />
            ))}
            {/* FFN bars */}
            {Array.from({ length: 8 }).map((_, c) => (
              <motion.rect
                key={`ffn-${li}-${c}`}
                x={CENTER_X - BLOCK_W / 2 + 110 + c * 14}
                y={y + 10}
                width={10}
                height={10}
                fill={COLORS.amber}
                initial={{ opacity: 0.15 }}
                animate={{ opacity: [0.15, 0.65, 0.15] }}
                transition={{
                  duration: 1.8,
                  delay: li * 0.12 + 0.6 + c * 0.06,
                  repeat: Infinity,
                }}
              />
            ))}
            <text
              x={CENTER_X - BLOCK_W / 2 + 16}
              y={y + 36}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              attention
            </text>
            <text
              x={CENTER_X - BLOCK_W / 2 + 110}
              y={y + 36}
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              ffn
            </text>
            <text
              x={CENTER_X - BLOCK_W / 2 + BLOCK_W - 16}
              y={y + BLOCK_H / 2 + 4}
              textAnchor="end"
              fontSize="14"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={`hsla(${hue}, 75%, 80%, 0.9)`}
            >
              block {li}
            </text>

            {/* residual add indicator (arrow into spine) */}
            <motion.circle
              cx={CENTER_X - BLOCK_W / 2 - 32}
              cy={y + BLOCK_H / 2}
              r={5}
              fill={`hsla(${hue}, 75%, 65%, 0.8)`}
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.6, 0.8] }}
              transition={{ duration: 2, delay: li * 0.3, repeat: Infinity }}
            />
            <motion.line
              x1={CENTER_X - BLOCK_W / 2}
              x2={CENTER_X - BLOCK_W / 2 - 28}
              y1={y + BLOCK_H / 2}
              y2={y + BLOCK_H / 2}
              stroke={`hsla(${hue}, 75%, 65%, 0.5)`}
              strokeDasharray="2 3"
            />
          </g>
        )
      })}

      {/* top: output */}
      <motion.g
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <rect
          x={CENTER_X - 100}
          y={topY - 10}
          width={200}
          height={30}
          rx={3}
          fill="rgba(248,113,113,0.08)"
          stroke={COLORS.red}
        />
        <text
          x={CENTER_X}
          y={topY + 9}
          textAnchor="middle"
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill={COLORS.red}
        >
          unembed · softmax · sample
        </text>
      </motion.g>

      {/* bottom: input */}
      <g transform={`translate(${CENTER_X - (N_TOKENS * tokenW) / 2}, ${bottomY + 14})`}>
        <text
          x={(N_TOKENS * tokenW) / 2}
          y={-2}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COLORS.dim}
        >
          input embeddings
        </text>
        {Array.from({ length: N_TOKENS }).map((_, i) => (
          <rect
            key={i}
            x={i * (tokenW + 2)}
            y={6}
            width={tokenW - 2}
            height={20}
            rx={2}
            fill="rgba(167,139,250,0.1)"
            stroke={COLORS.violet}
            strokeOpacity={0.5}
          />
        ))}
      </g>
    </svg>
  )
}
