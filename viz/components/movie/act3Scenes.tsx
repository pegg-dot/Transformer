'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
import { SplitPaneScene, PhaseChip } from './splitPane'

const ACCENT = {
  violet: '#a78bfa',
  blue: '#60a5fa',
  cyan: '#22d3ee',
  amber: '#f59e0b',
  mint: '#34d399',
  pink: '#ec4899',
  red: '#f87171',
  dim: 'rgba(255,255,255,0.45)',
  rule: 'rgba(255,255,255,0.10)',
}
const ACT3_KICKER = 'ACT III · THE FULL STACK'

/* =========================================================================
 * Scene 17 — stack: "Same recipe, six times."
 *
 * Cinematic zoom-out from the single block we studied (Act II) to the full
 * tower of six. The hero is the RESIDUAL STREAM — one bright horizontal
 * beam running through all six blocks. Each block adds a small Δ to the
 * stream (never overwrites). A single bright pulse continuously climbs
 * left → right; as it crosses each block, that block's delta lights up at
 * the stream landing point.
 * ====================================================================== */

const BLOCK_COUNT = 6
const BLOCK_W = 160
const BLOCK_H = 280
const BLOCK_Y = 220
const BLOCK_BOTTOM = BLOCK_Y + BLOCK_H
const STREAM_Y = 600
const STREAM_H = 22
const STREAM_X_START = 90
const STREAM_X_END = 1310
const STREAM_LEN = STREAM_X_END - STREAM_X_START
const HERO_DURATION = 8 // seconds for the pulse to traverse the stream

const BLOCK_CENTERS = [180, 380, 580, 780, 980, 1180]

// Block hue progression: cyan (195°) → magenta (305°)
function blockHue(i: number): number {
  return 195 + (i / (BLOCK_COUNT - 1)) * 110
}
function blockColor(i: number, sat = 70, light = 65, alpha = 1): string {
  return `hsla(${blockHue(i)}, ${sat}%, ${light}%, ${alpha})`
}

export function VizStack() {
  const speed = useSpeed()

  const PHASES = 2
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      6500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="stack-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="stack-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="stack-stream-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.85)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.85)" />
          </linearGradient>
          <linearGradient id="stack-stream-bright" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,211,238,1)" />
            <stop offset="50%" stopColor="rgba(96,165,250,1)" />
            <stop offset="100%" stopColor="rgba(236,72,153,1)" />
          </linearGradient>
        </defs>

        {/* Top kicker */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          ACT III · THE FULL STACK · RESIDUAL STACK
        </text>

        {/* Big title */}
        <text x={700} y={92} textAnchor="middle"
          fontSize="22" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.95)">
          one signal, climbing through six blocks
        </text>
        <text x={700} y={120} textAnchor="middle"
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.08em">
          same recipe, six times — every block adds to the same running stream
        </text>

        {/* Hero residual stream — drawn early so blocks overlay above */}
        <StackResidualStream phase={phase} speed={speed} />

        {/* Six transformer blocks */}
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <StackBlock key={`blk-${i}`} idx={i} phase={phase} speed={speed} />
        ))}

        {/* Delta injections from each block down into the stream */}
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <StackDeltaInjection key={`delta-${i}`} idx={i} phase={phase} speed={speed} />
        ))}

        {/* Continuous ambient flow particles */}
        <StackFlowParticles speed={speed} />

        {/* Hero pulse — single bright orb climbing the stream */}
        <StackHeroPulse speed={speed} />

        {/* Input and output chips */}
        <StackInputOutput speed={speed} />

        {/* Bottom payoff */}
        <StackPayoff phase={phase} />

        {/* Phase summary */}
        <StackPhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── Hero residual stream (the visual headliner) ─────────── */
function StackResidualStream({ phase, speed }: { phase: number; speed: number }) {
  const baseOpacity = phase === 1 ? 0.95 : 0.55
  return (
    <g>
      {/* Label above */}
      <text x={STREAM_X_START + STREAM_LEN / 2} y={STREAM_Y - 16}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.cyan} letterSpacing="0.22em">
        RESIDUAL STREAM · 384-DIM
      </text>

      {/* Bloom layer for glow */}
      <motion.rect
        x={STREAM_X_START} y={STREAM_Y}
        width={STREAM_LEN} height={STREAM_H}
        rx={STREAM_H / 2}
        fill="url(#stack-stream-bright)"
        filter="url(#stack-bloom)"
        initial={{ opacity: 0.5 }}
        animate={{
          opacity: phase === 1
            ? [baseOpacity * 0.85, baseOpacity, baseOpacity * 0.85]
            : baseOpacity,
        }}
        transition={{ duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Crisp inner band */}
      <rect
        x={STREAM_X_START} y={STREAM_Y + 4}
        width={STREAM_LEN} height={STREAM_H - 8}
        rx={(STREAM_H - 8) / 2}
        fill="url(#stack-stream-grad)"
      />
    </g>
  )
}

/* ─────────── One block in the stack (attn motif + FFN motif + label) ─────────── */
function StackBlock({ idx, phase, speed }: { idx: number; phase: number; speed: number }) {
  const cx = BLOCK_CENTERS[idx]
  const x = cx - BLOCK_W / 2
  const y = BLOCK_Y
  const color = blockColor(idx)
  const dimColor = blockColor(idx, 60, 55, 0.55)
  const fillColor = blockColor(idx, 70, 50, 0.10)
  const halfY = y + BLOCK_H / 2

  return (
    <motion.g
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 / speed, delay: (idx * 0.12) / speed }}
    >
      {/* Block frame */}
      <rect x={x} y={y} width={BLOCK_W} height={BLOCK_H} rx={6}
        fill={fillColor}
        stroke={dimColor}
        strokeWidth={1.5} />

      {/* Block label */}
      <text x={cx} y={y + 22} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={color} letterSpacing="0.22em">
        BLOCK {idx}
      </text>

      {/* Top-half label — ATTN */}
      <text x={cx} y={y + 46} textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.18em">
        ATTN
      </text>
      {/* Attention motif: 4×4 lower-triangular grid */}
      {Array.from({ length: 4 }).map((_, q) =>
        Array.from({ length: 4 }).map((_, k) => {
          if (k > q) return null
          const cellSize = 14
          const startX = cx - 2 * cellSize
          return (
            <motion.rect
              key={`attn-${idx}-${q}-${k}`}
              x={startX + k * cellSize}
              y={y + 58 + q * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              rx={1}
              fill={color}
              initial={{ opacity: 0.18 }}
              animate={{ opacity: [0.18, 0.75, 0.18] }}
              transition={{
                duration: 1.6 / speed,
                delay: (idx * 0.08 + q * 0.07 + k * 0.05) / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )
        })
      )}

      {/* Mid divider */}
      <line x1={x + 14} x2={x + BLOCK_W - 14}
        y1={halfY + 4} y2={halfY + 4}
        stroke={ACCENT.rule} strokeWidth={0.5} strokeDasharray="2,3" />

      {/* Bottom-half label — FFN */}
      <text x={cx} y={halfY + 24} textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.18em">
        FFN
      </text>
      {/* FFN motif: 5 amber bars that breathe */}
      {Array.from({ length: 5 }).map((_, bi) => {
        const barW = 12
        const barX = cx - 2.5 * (barW + 2) + bi * (barW + 2)
        return (
          <motion.rect
            key={`ffn-${idx}-${bi}`}
            x={barX}
            y={halfY + 36}
            width={barW}
            rx={2}
            fill={ACCENT.amber}
            initial={{ height: 16, opacity: 0.18 }}
            animate={{ height: [16, 50, 16], opacity: [0.18, 0.75, 0.18] }}
            transition={{
              duration: 1.4 / speed,
              delay: (idx * 0.1 + bi * 0.08) / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      })}

      {/* Block readout — "attn + ffn → Δi" */}
      <text x={cx} y={y + BLOCK_H - 12} textAnchor="middle"
        fontSize="10" fontFamily="var(--font-mono)"
        fill={dimColor} fontStyle="italic">
        attn + ffn → Δ{idx}
      </text>
    </motion.g>
  )
}

/* ─────────── Delta injection: dashed stem from block bottom into stream ───
 * The pulse on the stream lights up exactly when the hero pulse passes by,
 * so the eye sees one signal climbing and a chain of deltas firing in turn. */
function StackDeltaInjection({
  idx, phase, speed,
}: { idx: number; phase: number; speed: number }) {
  const cx = BLOCK_CENTERS[idx]
  const fromY = BLOCK_BOTTOM + 2
  const toY = STREAM_Y + 2
  const blockOffsetT = (cx - STREAM_X_START) / STREAM_LEN
  const arrivalDelay = blockOffsetT * HERO_DURATION
  const stemOpacity = phase === 1 ? 0.55 : 0.30

  return (
    <g>
      {/* Connector stem */}
      <motion.line
        x1={cx} x2={cx} y1={fromY} y2={toY - 6}
        stroke={ACCENT.amber}
        strokeWidth={1.5}
        strokeDasharray="3,4"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: stemOpacity }}
        transition={{ duration: 0.4 / speed }}
      />
      {/* Arrowhead near stream */}
      <path
        d={`M ${cx - 5} ${toY - 8} L ${cx} ${toY - 2} L ${cx + 5} ${toY - 8}`}
        fill="none" stroke={ACCENT.amber}
        strokeWidth={1.5} strokeOpacity={0.7} />

      {/* Delta pulse landing on the stream — synced with hero pulse arrival */}
      <motion.circle
        cx={cx} cy={STREAM_Y + STREAM_H / 2}
        r={6}
        fill={ACCENT.amber}
        filter="url(#stack-glow)"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.7, 0.5],
        }}
        transition={{
          duration: 0.95 / speed,
          delay: arrivalDelay / speed,
          repeat: Infinity,
          repeatDelay: (HERO_DURATION - 0.95) / speed,
          ease: 'easeOut',
        }}
      />

      {/* "+ Δi" label below stream */}
      <text x={cx} y={STREAM_Y + STREAM_H + 22}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.amber}>
        + Δ{idx}
      </text>
    </g>
  )
}

/* ─────────── Hero pulse: a single bright orb traversing the full stream ─── */
function StackHeroPulse({ speed }: { speed: number }) {
  return (
    <g>
      {/* Trailing glow (slightly behind, softer) */}
      <motion.circle
        r={5}
        fill="rgba(167,139,250,0.55)"
        filter="url(#stack-glow)"
        initial={{ cx: STREAM_X_START, cy: STREAM_Y + STREAM_H / 2, opacity: 0 }}
        animate={{
          cx: [STREAM_X_START, STREAM_X_END],
          opacity: [0, 0.55, 0.55, 0.55, 0],
        }}
        transition={{
          duration: HERO_DURATION / speed,
          delay: 0.18 / speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Hero orb — bright white-ish, grows slightly as it climbs */}
      <motion.circle
        r={9}
        fill="rgba(255,255,255,0.95)"
        filter="url(#stack-bloom)"
        initial={{ cx: STREAM_X_START, cy: STREAM_Y + STREAM_H / 2, opacity: 0 }}
        animate={{
          cx: [STREAM_X_START, STREAM_X_END],
          opacity: [0, 1, 1, 1, 0],
          scale: [0.85, 1, 1.12, 1.28, 1.4],
        }}
        transition={{
          duration: HERO_DURATION / speed,
          repeat: Infinity,
          ease: 'linear',
          times: [0, 0.05, 0.4, 0.85, 1],
        }}
      />
    </g>
  )
}

/* ─────────── Continuous ambient particles flowing through the stream ─── */
function StackFlowParticles({ speed }: { speed: number }) {
  const N = 7
  return (
    <g>
      {Array.from({ length: N }).map((_, i) => (
        <motion.circle
          key={`stk-flow-${i}`}
          r={2.5}
          fill={ACCENT.cyan}
          initial={{ cx: STREAM_X_START, cy: STREAM_Y + STREAM_H / 2, opacity: 0 }}
          animate={{
            cx: [STREAM_X_START, STREAM_X_END],
            opacity: [0, 0.65, 0.65, 0],
          }}
          transition={{
            duration: 4.5 / speed,
            delay: (i * 0.65) / speed,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </g>
  )
}

/* ─────────── Input and output chips at the stream's endpoints ─────────── */
function StackInputOutput({ speed }: { speed: number }) {
  return (
    <g>
      {/* Input chip — cyan, calm */}
      <g transform={`translate(20, ${STREAM_Y - 14})`}>
        <rect width={60} height={50} rx={4}
          fill="rgba(34,211,238,0.10)"
          stroke={ACCENT.cyan} strokeWidth={1.4} />
        <text x={30} y={32} textAnchor="middle"
          fontSize="16" fontFamily="var(--font-mono)" fill={ACCENT.cyan}>
          in
        </text>
      </g>

      {/* Output chip — magenta, glowing, scale-pulse to draw the eye */}
      <motion.g
        transform={`translate(1320, ${STREAM_Y - 14})`}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2 / speed, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `1350px ${STREAM_Y + 11}px` }}
      >
        <rect width={60} height={50} rx={4}
          fill="rgba(236,72,153,0.18)"
          stroke={ACCENT.pink} strokeWidth={1.6}
          filter="url(#stack-glow)" />
        <text x={30} y={32} textAnchor="middle"
          fontSize="16" fontFamily="var(--font-display)" fontStyle="italic"
          fill={ACCENT.pink}>
          out
        </text>
      </motion.g>
    </g>
  )
}

/* ─────────── Bottom payoff: the equation + the message ─────────── */
function StackPayoff({ phase }: { phase: number }) {
  return (
    <g>
      <text x={700} y={730} textAnchor="middle"
        fontSize="20" fontFamily="var(--font-display)"
        fontStyle="italic" fill="rgba(255,255,255,0.92)">
        every block <tspan fill={ACCENT.amber}>adds</tspan> to the stream — never overwrites
      </text>
      <text x={700} y={770} textAnchor="middle"
        fontSize="22" fontFamily="var(--font-mono)"
        fill={ACCENT.cyan}>
        x ← x + block(x)
      </text>
      <text x={700} y={804} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        each block reads x · computes Δ (attn + ffn) · adds it back · skip-connections preserve early features
      </text>
    </g>
  )
}

/* ─────────── Phase summary footer ─────────── */
function StackPhaseSummary({ phase }: { phase: number }) {
  const beats = ['orient — six blocks', 'climbing — stream + deltas']
  return (
    <g transform="translate(700, 950)">
      {beats.map((b, i) => {
        const w = 320
        const x = (i - beats.length / 2) * w + w / 2
        const active = i === phase
        return (
          <g key={`stk-sum-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 14} y={-14} width={w - 28} height={28} rx={14}
              fill={active ? 'rgba(34,211,238,0.18)' : 'transparent'}
              stroke={active ? ACCENT.cyan : ACCENT.rule}
              strokeWidth={active ? 1.5 : 1} />
            <text x={0} y={4} textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)"
              fill={active ? ACCENT.cyan : ACCENT.dim}
              letterSpacing="0.16em">
              {(i + 1)}.{b.toUpperCase()}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── Stack split-pane wrapper ─────────── */
export function StackSplitPane() {
  const speed = useSpeed()
  const PHASES = 2
  const phaseLabels = ['orient · six blocks', 'climbing · stream + deltas']
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      6500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      The block we just zoomed into is repeated <em>six times</em>. Same
      structure, same shape, same residual-add pattern — top to bottom of
      the tower.
    </>,
    <>
      The residual stream walks through every block. Each one reads the
      current stream, computes a small rewrite (attention + FFN), and{' '}
      <em>adds</em> it back. Nothing is overwritten — only refined.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'one block, repeated six times',
      body: <>block(x) = FFN(LN(x + Attn(LN(x))))</>,
    },
    {
      label: 'residual updates, applied sequentially',
      body: (
        <>
          x ← x + Attn(LN(x))
          <br />
          x ← x + FFN(LN(x))
        </>
      ),
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'Six blocks in this tiny model. GPT-2 Small had 12, GPT-2 XL had 48, GPT-4 reportedly ~120. The recipe doesn\'t change with depth — only the count.',
    'Skip connections (the "+ x") are why deep nets work at all. Gradients flow straight from the loss back to block 0 without attenuation, and early features survive all the way to the top.',
  ]

  return (
    <SplitPaneScene
      viz={<VizStack />}
      text={{
        kicker: ACT3_KICKER,
        title: 'Same recipe, six times.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.cyan,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.cyan}
          />
        ),
        stats: [
          { label: 'blocks · n_layer', value: '6', color: ACCENT.cyan },
          { label: 'stream dim', value: '384', color: ACCENT.cyan },
          { label: 'per block', value: '~1.7 M params' },
          { label: 'total · model', value: '10.79 M' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}
