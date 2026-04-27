'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
import { usePrompt } from './promptContext'
import { SplitPaneScene, PhaseChip } from './splitPane'

/* =========================================================================
 * ACT I VIZ — left-pane visualizations for the new split-pane Act I scenes.
 *
 * Style rules:
 *   - 2D SVG for everything except the cinematic intro and "Ready for Block 0"
 *     handoff (those are SVG fake-3D for now; can promote to R3F later).
 *   - Honest with the model: char-level vocab=65; IDs in [0, 65).
 *   - Aesthetic palette: violet primary, cyan/blue/amber secondary, mint for
 *     "constructed/derived" objects.
 *   - SVG viewBox 1400×900 (taller portrait-ish ratio fits the left pane
 *     aspect after the 38% right pane is taken out of a 16:9 stage).
 * ====================================================================== */

const ACCENT = {
  violet: '#a78bfa',
  blue: '#60a5fa',
  cyan: '#22d3ee',
  amber: '#f59e0b',
  mint: '#34d399',
  pink: '#ec4899',
  dim: 'rgba(255,255,255,0.45)',
  rule: 'rgba(255,255,255,0.10)',
}

/* ─────────────────── Scene A · Act I Intro (slab + dim block stack) ─────────────────── */

/**
 * Single-composition cinematic intro: an empty input slab in axonometric
 * perspective floats just above a tight stack of dim, inactive blocks.
 * One unified object — no scattered dressing.
 */
export function VizActIIntro() {
  const speed = useSpeed()
  // Centerline x. Use viewBox 1400×800 — closer to the panes' actual aspect.
  const CX = 700

  // Slab — top face is a parallelogram. Front face slightly visible underneath.
  // Coords are absolute within the viewBox (no inner translate gymnastics).
  const slab = {
    // Top face polygon: back-left, back-right, front-right, front-left
    backY: 220,
    frontY: 320,
    backHalf: 300,
    frontHalf: 360,
  }
  const sb = slab
  const slabPath =
    `M ${CX - sb.backHalf} ${sb.backY}` +
    ` L ${CX + sb.backHalf} ${sb.backY}` +
    ` L ${CX + sb.frontHalf} ${sb.frontY}` +
    ` L ${CX - sb.frontHalf} ${sb.frontY} Z`

  // 6 blocks — tightly stacked just below the slab
  const blockTopY = 380
  const blockH = 22
  const blockGap = 32
  const blocks = Array.from({ length: 6 }).map((_, i) => ({
    z: i,
    backY: blockTopY + i * blockGap,
    frontY: blockTopY + i * blockGap + blockH,
    backHalf: 280 - i * 14,
    frontHalf: 320 - i * 12,
    opacity: 0.32 - i * 0.04,
  }))

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 1400 800"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="slab-glow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={ACCENT.violet} stopOpacity="0.6" />
            <stop offset="0.5" stopColor={ACCENT.violet} stopOpacity="0.28" />
            <stop offset="1" stopColor={ACCENT.violet} stopOpacity="0.08" />
          </linearGradient>
          <filter id="slab-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* ────── Block stack — drawn first (behind the slab) ────── */}
        {blocks
          .slice()
          .reverse()
          .map((b, idx) => {
            const i = blocks.length - 1 - idx
            const path =
              `M ${CX - b.backHalf} ${b.backY}` +
              ` L ${CX + b.backHalf} ${b.backY}` +
              ` L ${CX + b.frontHalf} ${b.frontY}` +
              ` L ${CX - b.frontHalf} ${b.frontY} Z`
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: b.opacity }}
                transition={{
                  delay: 1.0 / speed + i * 0.1,
                  duration: 0.6 / speed,
                }}
              >
                <path
                  d={path}
                  fill="none"
                  stroke={ACCENT.violet}
                  strokeOpacity={0.55}
                  strokeWidth={1}
                />
                <text
                  x={CX - b.backHalf - 14}
                  y={(b.backY + b.frontY) / 2 + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.dim}
                  letterSpacing="0.18em"
                >
                  BLOCK {i}
                </text>
              </motion.g>
            )
          })}

        {/* ────── Hero slab ────── */}
        <motion.g
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 / speed, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glow underlay */}
          <path
            d={slabPath}
            fill="url(#slab-glow)"
            filter="url(#slab-bloom)"
            opacity="0.9"
          />
          {/* Outline */}
          <path
            d={slabPath}
            fill="rgba(167,139,250,0.06)"
            stroke={ACCENT.violet}
            strokeWidth={2}
            strokeOpacity={0.95}
          />
          {/* Vertical grid lines */}
          {Array.from({ length: 11 }).map((_, i) => {
            const t = (i + 1) / 12
            const xTop = CX - sb.backHalf + 2 * sb.backHalf * t
            const xBot = CX - sb.frontHalf + 2 * sb.frontHalf * t
            return (
              <motion.line
                key={`v-${i}`}
                x1={xTop}
                y1={sb.backY}
                x2={xBot}
                y2={sb.frontY}
                stroke={ACCENT.violet}
                strokeOpacity={0.2}
                strokeWidth={0.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  delay: 1.0 / speed + i * 0.03,
                  duration: 0.5 / speed,
                }}
              />
            )
          })}
          {/* Horizontal grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const t = (i + 1) / 6
            const y = sb.backY + (sb.frontY - sb.backY) * t
            const half = sb.backHalf + (sb.frontHalf - sb.backHalf) * t
            return (
              <motion.line
                key={`h-${i}`}
                x1={CX - half}
                y1={y}
                x2={CX + half}
                y2={y}
                stroke={ACCENT.violet}
                strokeOpacity={0.16}
                strokeWidth={0.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  delay: 1.0 / speed + i * 0.05,
                  duration: 0.5 / speed,
                }}
              />
            )
          })}
        </motion.g>

        {/* ────── [T, d_model] dimension label ────── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 / speed, duration: 0.5 / speed }}
        >
          <line
            x1={CX + sb.backHalf - 6}
            y1={sb.backY - 4}
            x2={CX + sb.backHalf + 60}
            y2={sb.backY - 60}
            stroke={ACCENT.violet}
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <text
            x={CX + sb.backHalf + 70}
            y={sb.backY - 64}
            fontSize="18"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={ACCENT.violet}
          >
            [T, d
            <tspan fontSize="13" dy="4">
              model
            </tspan>
            <tspan dy="-4">]</tspan>
          </text>
        </motion.g>

        {/* ────── Slab pulse (loop) ────── */}
        <motion.path
          d={slabPath}
          fill="none"
          stroke={ACCENT.violet}
          strokeWidth={2}
          initial={{ opacity: 0.95 }}
          animate={{
            opacity: [0.95, 0.6, 0.95],
            strokeWidth: [2, 3.2, 2],
          }}
          transition={{
            duration: 3 / speed,
            delay: 4 / speed,
            repeat: Infinity,
          }}
        />

        {/* ────── Edge shimmer — light particle traversing the front edge ────── */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.circle
            key={`shimmer-${i}`}
            r={3}
            fill={ACCENT.violet}
            filter="url(#slab-bloom)"
            cy={sb.frontY}
            initial={{ cx: CX - sb.frontHalf, opacity: 0 }}
            animate={{
              cx: [CX - sb.frontHalf, CX + sb.frontHalf],
              opacity: [0, 0.95, 0.95, 0],
            }}
            transition={{
              duration: 4 / speed,
              ease: 'linear',
              repeat: Infinity,
              delay: 2 / speed + (i * 1.3) / speed,
              times: [0, 0.1, 0.9, 1],
            }}
          />
        ))}
      </svg>
    </div>
  )
}

/* ─────────────────── Scene B · Tokenization ─────────────────── */

export function VizTokenization() {
  const { prompt } = usePrompt()
  const speed = useSpeed()

  const chars = (prompt || 'The cat sat on the mat.').split('').slice(0, 14)
  const STAGGER = 0.12 / speed
  const PHASE_DROP = 1.6 / speed
  const PHASE_ID = 3.4 / speed

  // Char-level honest IDs: just charCode % 65 to stay in [0, 65)
  const idFor = (ch: string) => ch.charCodeAt(0) % 65

  const cellW = 78
  const totalW = chars.length * cellW
  const startX = 700 - totalW / 2 + cellW / 2

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 900" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="tok-glow"><feGaussianBlur stdDeviation="2" /></filter>
        </defs>

        {/* Top — sentence in big italic serif */}
        <motion.g initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
          {chars.map((ch, i) => (
            <motion.text
              key={`top-${i}`}
              x={startX + i * cellW - cellW / 2 + cellW / 2}
              y={210}
              textAnchor="middle"
              fontSize="64"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill="rgba(255,255,255,0.92)"
              filter="url(#tok-glow)"
              initial={{ opacity: 0, y: 230 }}
              animate={{ opacity: 1, y: 210 }}
              transition={{ delay: i * STAGGER, duration: 0.4 / speed }}
            >
              {ch === ' ' ? '·' : ch}
            </motion.text>
          ))}
        </motion.g>

        {/* Vertical drop lines — character → token pill */}
        {chars.map((_, i) => {
          const x = startX + i * cellW
          return (
            <motion.line
              key={`drop-${i}`}
              x1={x}
              x2={x}
              y1={232}
              y2={400}
              stroke={ACCENT.violet}
              strokeOpacity={0.45}
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: PHASE_DROP + i * STAGGER, duration: 0.4 / speed }}
            />
          )
        })}

        {/* Token pills row */}
        {chars.map((ch, i) => {
          const x = startX + i * cellW
          return (
            <motion.g
              key={`pill-${i}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: PHASE_DROP + 0.2 / speed + i * STAGGER, duration: 0.4 / speed }}
            >
              <rect
                x={x - 30}
                y={420}
                width={60}
                height={70}
                rx={4}
                fill="rgba(167,139,250,0.06)"
                stroke={ACCENT.violet}
                strokeOpacity={0.7}
                strokeWidth={1.4}
              />
              <text
                x={x}
                y={465}
                textAnchor="middle"
                fontSize="32"
                fontFamily="var(--font-display)"
                fill="rgba(255,255,255,0.95)"
              >
                {ch === ' ' ? '·' : ch}
              </text>
            </motion.g>
          )
        })}

        {/* TOKENS label */}
        <motion.text
          x={startX - 50}
          y={460}
          textAnchor="end"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={ACCENT.violet}
          letterSpacing="0.24em"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: PHASE_DROP + 0.4 / speed, duration: 0.4 / speed }}
        >
          TOKENS ▸
        </motion.text>

        {/* ID pills (smaller, below tokens) */}
        {chars.map((ch, i) => {
          const x = startX + i * cellW
          return (
            <motion.g
              key={`id-${i}`}
              initial={{ opacity: 0, y: 540 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: PHASE_ID + i * STAGGER, duration: 0.4 / speed }}
            >
              <line
                x1={x}
                x2={x}
                y1={490}
                y2={540}
                stroke={ACCENT.violet}
                strokeOpacity={0.3}
                strokeDasharray="2 3"
                strokeWidth={1}
              />
              <rect
                x={x - 28}
                y={550}
                width={56}
                height={42}
                rx={4}
                fill="rgba(167,139,250,0.04)"
                stroke={ACCENT.violet}
                strokeOpacity={0.55}
                strokeWidth={1.2}
              />
              <text
                x={x}
                y={579}
                textAnchor="middle"
                fontSize="20"
                fontFamily="var(--font-mono)"
                fill={ACCENT.violet}
              >
                {idFor(ch)}
              </text>
            </motion.g>
          )
        })}

        <motion.text
          x={startX - 50}
          y={580}
          textAnchor="end"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={ACCENT.violet}
          letterSpacing="0.24em"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: PHASE_ID + 0.5 / speed, duration: 0.4 / speed }}
        >
          TOKEN IDs ▸
        </motion.text>

        {/* Bottom call-out */}
        <motion.text
          x={700}
          y={760}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={ACCENT.dim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: PHASE_ID + chars.length * STAGGER + 0.4 / speed }}
        >
          char-level vocab · 65 entries · IDs in [0, 65)
        </motion.text>

        {/* Looping scanner — after the initial reveal, a violet bar sweeps
            left→right repeatedly, briefly pulsing each token+ID column it
            passes. Keeps the scene visually alive for its full duration. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: PHASE_ID + chars.length * STAGGER + 1.2 / speed }}
        >
          <motion.rect
            x={startX - cellW / 2}
            y={400}
            width={cellW * 0.9}
            height={210}
            rx={6}
            fill="rgba(167,139,250,0.06)"
            stroke={ACCENT.violet}
            strokeOpacity={0.55}
            strokeWidth={1.5}
            filter="url(#tok-glow)"
            animate={{
              x: [
                startX - cellW / 2,
                startX + (chars.length - 1) * cellW - cellW / 2,
                startX - cellW / 2,
              ],
            }}
            transition={{
              duration: (chars.length * 0.55) / speed,
              ease: 'linear',
              repeat: Infinity,
              delay: PHASE_ID + chars.length * STAGGER + 1.6 / speed,
            }}
          />
        </motion.g>

        {/* Math callout for the focused token — shows charCode → mod 65 → ID
            so the viewer sees how IDs are computed. Uses the first non-space
            character of the prompt. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: PHASE_ID + chars.length * STAGGER + 2.4 / speed,
            duration: 0.6 / speed,
          }}
        >
          <line
            x1={startX}
            y1={605}
            x2={startX - 80}
            y2={680}
            stroke={ACCENT.violet}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
          <rect
            x={startX - 280}
            y={682}
            width={260}
            height={56}
            rx={4}
            fill="rgba(7,7,9,0.7)"
            stroke={ACCENT.rule}
            strokeWidth={1}
          />
          <text
            x={startX - 270}
            y={702}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={ACCENT.dim}
            letterSpacing="0.18em"
          >
            HOW THE ID IS COMPUTED
          </text>
          <text
            x={startX - 270}
            y={726}
            fontSize="14"
            fontFamily="var(--font-mono)"
            fill="rgba(255,255,255,0.92)"
          >
            ‘{chars[0] === ' ' ? '·' : chars[0]}’.charCode % 65 ={' '}
            <tspan fill={ACCENT.violet}>{idFor(chars[0])}</tspan>
          </text>
        </motion.g>
      </svg>
    </div>
  )
}

/* ─────────────────── Scene C · BPE ─────────────────── */

export function VizBPE() {
  const speed = useSpeed()
  // ViewBox is taller (1100) and the merge tree is shifted down 160px to
  // give the pair-card's result card breathing room and prevent it from
  // colliding with the merge tree's "FINAL TOKENS" row above the bytes.
  const TREE_OFFSET = 160
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Divider line between top zone (pair-card) and bottom zone (tree) */}
        <line
          x1={120}
          x2={1280}
          y1={490}
          y2={490}
          stroke={ACCENT.rule}
          strokeWidth={1}
          strokeDasharray="4 6"
          opacity="0.5"
        />
        {/* "applying the learned rules" label in the gap */}
        <text
          x={700}
          y={510}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={ACCENT.dim}
          letterSpacing="0.24em"
          opacity="0.75"
        >
          ▾ APPLY THE RULES TO A NEW WORD ▾
        </text>

        {/* Top: pair-merge moment with rule table */}
        <BPEPairCard speed={speed} />

        {/* Bottom: merge tree compressing 'unbelievably' to 'un / bel / iev / ably',
            shifted down so it doesn't collide with the pair card. */}
        <g transform={`translate(0, ${TREE_OFFSET})`}>
          <BPEMergeTree speed={speed} />
        </g>

        {/* Section labels — y values follow the shifted tree */}
        <text x={170} y={680 + TREE_OFFSET} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.22em" textAnchor="end">
          BYTES ▸
        </text>
        <text x={170} y={580 + TREE_OFFSET} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.22em" textAnchor="end">
          INITIAL TOKENS ▸
        </text>
        <text x={170} y={490 + TREE_OFFSET} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.mint} letterSpacing="0.22em" textAnchor="end" opacity="0.85">
          MERGE STEPS ▸
        </text>
        <text x={170} y={400 + TREE_OFFSET} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.violet} letterSpacing="0.22em" textAnchor="end" opacity="0.95">
          FINAL TOKENS ▸
        </text>
      </svg>
    </div>
  )
}

function BPEPairCard({ speed }: { speed: number }) {
  const merges = useMemo(
    () => [
      { a: 'e', b: 'r', merged: 'er', count: 843 },
      { a: 't', b: 'h', merged: 'th', count: 672 },
      { a: 'i', b: 'n', merged: 'in', count: 588 },
      { a: 'er', b: 's', merged: 'ers', count: 410 },
    ],
    [],
  )
  const [step, setStep] = useState(0)
  // Loop the merge sequence — after the 4th merge, hold for one beat and
  // restart from #1. Keeps the rule table animating throughout.
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => (s + 1) % (merges.length + 1)),
      2200 / speed,
    )
    return () => clearInterval(id)
  }, [speed, merges.length])
  // When step === merges.length, we're in the "hold full table" beat.
  const showStep = Math.min(step, merges.length - 1)
  const m = merges[showStep]
  return (
    <g>
      {/* Two source cards */}
      <motion.g key={`pair-${step}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <rect x={310} y={120} width={130} height={130} rx={6}
          fill="rgba(167,139,250,0.10)" stroke={ACCENT.violet} strokeWidth={2} />
        <text x={375} y={210} textAnchor="middle" fontSize="64"
          fontFamily="var(--font-display)" fontStyle="italic" fill="rgba(255,255,255,0.95)">{m.a}</text>

        <motion.text x={490} y={195} textAnchor="middle" fontSize="40"
          fontFamily="var(--font-display)" fill={ACCENT.amber}
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 0.9 / speed, repeat: Infinity }}>+</motion.text>

        <rect x={540} y={120} width={130} height={130} rx={6}
          fill="rgba(167,139,250,0.10)" stroke={ACCENT.violet} strokeWidth={2} />
        <text x={605} y={210} textAnchor="middle" fontSize="64"
          fontFamily="var(--font-display)" fontStyle="italic" fill="rgba(255,255,255,0.95)">{m.b}</text>

        <text x={490} y={285} textAnchor="middle" fontSize="13"
          fontFamily="var(--font-mono)" fill={ACCENT.amber}>frequency = {m.count}</text>

        {/* Down arrow */}
        <motion.path d="M 490 305 L 490 340 M 482 332 L 490 340 L 498 332"
          stroke={ACCENT.mint} strokeWidth={1.8} fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.4 / speed, delay: 0.6 / speed }} />

        {/* Result card */}
        <motion.g
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.8 / speed }}>
          <rect x={380} y={355} width={220} height={100} rx={6}
            fill="rgba(52,211,153,0.16)" stroke={ACCENT.mint} strokeWidth={2.2} />
          <text x={490} y={420} textAnchor="middle" fontSize="56"
            fontFamily="var(--font-display)" fontStyle="italic" fill={ACCENT.mint}>{m.merged}</text>
        </motion.g>
      </motion.g>

      {/* Right side — merge rules table */}
      <g transform="translate(820, 130)">
        <text fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}
          letterSpacing="0.24em">LEARNED MERGE RULES</text>
        <rect x={-10} y={20} width={400} height={240} rx={4}
          fill="rgba(255,255,255,0.02)" stroke={ACCENT.rule} />
        {merges.slice(0, showStep + 1).map((r, i) => {
          const isCurrent = i === showStep
          return (
            <motion.g key={i} transform={`translate(10, ${44 + i * 48})`}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 / speed }}>
              {isCurrent && (
                <motion.rect x={-12} y={2} width={400} height={36} rx={3}
                  fill="rgba(167,139,250,0.10)"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6 / speed, repeat: Infinity }} />
              )}
              <text x={0} y={20} fontSize="11" fontFamily="var(--font-mono)"
                fill={ACCENT.dim} letterSpacing="0.1em">#{i + 1}</text>
              <text x={56} y={22} fontSize="22" fontFamily="var(--font-display)"
                fontStyle="italic" fill="rgba(255,255,255,0.92)">{r.a}</text>
              <text x={108} y={22} fontSize="14" fontFamily="var(--font-mono)" fill={ACCENT.dim}>+</text>
              <text x={140} y={22} fontSize="22" fontFamily="var(--font-display)"
                fontStyle="italic" fill="rgba(255,255,255,0.92)">{r.b}</text>
              <text x={210} y={22} fontSize="14" fontFamily="var(--font-mono)" fill={ACCENT.dim}>→</text>
              <text x={250} y={22} fontSize="22" fontFamily="var(--font-display)"
                fontStyle="italic" fill={ACCENT.mint}>{r.merged}</text>
            </motion.g>
          )
        })}
        {showStep < merges.length - 1 && (
          <text x={185} y={44 + (showStep + 1) * 48 + 14} textAnchor="middle"
            fontSize="14" fill={ACCENT.dim}>⋮</text>
        )}
      </g>
    </g>
  )
}

function BPEMergeTree({ speed }: { speed: number }) {
  const word = 'unbelievably'.split('')
  const finals = [
    { x: 280, label: 'un' },
    { x: 510, label: 'bel' },
    { x: 740, label: 'iev' },
    { x: 970, label: 'ably' },
  ]
  return (
    <g>
      {/* Bottom — bytes */}
      {word.map((ch, i) => (
        <motion.g key={`byte-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.05 * i / speed }}>
          <rect x={200 + i * 80} y={650} width={56} height={42} rx={3}
            fill="rgba(96,165,250,0.05)" stroke={ACCENT.blue} strokeOpacity={0.4} />
          <text x={228 + i * 80} y={680} textAnchor="middle" fontSize="14"
            fontFamily="var(--font-mono)" fill={ACCENT.dim}>
            {ch.charCodeAt(0).toString(16).toUpperCase()}
          </text>
        </motion.g>
      ))}

      {/* Initial char tokens */}
      {word.map((ch, i) => (
        <motion.g key={`tok-${i}`} initial={{ opacity: 0, y: 580 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 / speed + 0.05 * i / speed }}>
          <rect x={200 + i * 80} y={550} width={56} height={48} rx={3}
            fill="rgba(96,165,250,0.10)" stroke={ACCENT.blue} strokeOpacity={0.65} />
          <text x={228 + i * 80} y={584} textAnchor="middle" fontSize="22"
            fontFamily="var(--font-display)" fontStyle="italic" fill="rgba(255,255,255,0.92)">{ch}</text>
        </motion.g>
      ))}

      {/* Mid merges */}
      {[
        { from: [2, 3], cx: 348, label: 'be' },
        { from: [4, 5], cx: 508, label: 'li' },
        { from: [6, 7], cx: 668, label: 'ev' },
        { from: [8, 9], cx: 828, label: 'ab' },
        { from: [10, 11], cx: 988, label: 'ly' },
      ].map((m, i) => (
        <motion.g key={`mid-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.6 / speed + i * 0.15 / speed }}>
          <path d={`M ${228 + m.from[0] * 80} 550 L ${m.cx} 510 L ${228 + m.from[1] * 80} 550`}
            fill="none" stroke={ACCENT.mint} strokeOpacity={0.35} strokeWidth={1} />
          <rect x={m.cx - 32} y={460} width={64} height={44} rx={3}
            fill="rgba(52,211,153,0.10)" stroke={ACCENT.mint} strokeOpacity={0.7} />
          <text x={m.cx} y={490} textAnchor="middle" fontSize="20"
            fontFamily="var(--font-display)" fontStyle="italic" fill={ACCENT.mint}>{m.label}</text>
        </motion.g>
      ))}

      {/* Final tokens — initial spring-in, then continuous breathing pulse
          so the bottom of the scene stays alive throughout. */}
      {finals.map((f, i) => (
        <motion.g key={`final-${i}`} initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 2.6 / speed + i * 0.15 / speed }}>
          <motion.rect x={f.x - 60} y={360} width={120} height={56} rx={5}
            fill="rgba(167,139,250,0.16)"
            stroke={ACCENT.violet}
            strokeWidth={2.2}
            animate={{
              filter: [
                'drop-shadow(0 0 0 rgba(167,139,250,0))',
                `drop-shadow(0 0 12px ${ACCENT.violet})`,
                'drop-shadow(0 0 0 rgba(167,139,250,0))',
              ],
            }}
            transition={{
              duration: 2.4 / speed,
              repeat: Infinity,
              delay: 4 / speed + i * 0.4 / speed,
              ease: 'easeInOut',
            }}
          />
          <text x={f.x} y={400} textAnchor="middle" fontSize="26"
            fontFamily="var(--font-display)" fontStyle="italic" fill={ACCENT.violet}>{f.label}</text>
        </motion.g>
      ))}

      {/* Trailing ellipsis */}
      <text x={1100} y={400} fontSize="22" fontFamily="var(--font-display)"
        fill={ACCENT.dim}>· · ·</text>
    </g>
  )
}

/* ─────────────────── Scene D · Embedding Lookup (3D-feel matrix) ─────────────────── */

export function VizEmbedding() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const promptChars = (prompt || 'The cat sat').split('').slice(0, 8)

  // Char-level: ID = charCode % 65
  const ids = promptChars.map((ch) => ch.charCodeAt(0) % 65)

  // Cycle through the prompt, lighting up rows in turn
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setCursor((c) => (c + 1) % ids.length),
      2200 / speed,
    )
    return () => clearInterval(id)
  }, [ids.length, speed])

  // 3D-feel matrix: parallelogram with cells, viewing slightly from above-left
  const ROWS = 14
  const COLS = 24
  const CELL_W = 18
  const CELL_H = 20
  const SKEW_X = 0.18 // top edge shifts right relative to bottom
  const matrixX = 470
  const matrixY = 240
  const matrixW = COLS * CELL_W

  // Map "active" row in the visible matrix to the prompt's current ID
  // (clamped — we have 14 visible rows but real V=65)
  const activeRow = ids[cursor] % ROWS

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 900" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="emb-glow"><feGaussianBlur stdDeviation="3.5" /></filter>
          <linearGradient id="vec-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="0.35" stopColor="#60a5fa" />
            <stop offset="0.65" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Header */}
        <text x={matrixX + matrixW / 2} y={matrixY - 60} textAnchor="middle"
          fontSize="13" fontFamily="var(--font-mono)" fill={ACCENT.dim}
          letterSpacing="0.24em">EMBEDDING MATRIX</text>
        <text x={matrixX + matrixW / 2} y={matrixY - 38} textAnchor="middle"
          fontSize="22" fontFamily="var(--font-display)" fontStyle="italic"
          fill={ACCENT.dim}>V × d
          <tspan fontSize="12" dy="3">model</tspan>
        </text>

        {/* Left — token IDs column with arrows pointing into matrix */}
        <g>
          <text x={130} y={matrixY - 18} fontSize="10" fontFamily="var(--font-mono)"
            fill={ACCENT.dim} letterSpacing="0.22em">TOKEN IDs</text>
          {ids.slice(0, 6).map((id, i) => {
            const isActive = i === cursor
            return (
              <g key={i}>
                <motion.rect x={100} y={matrixY + i * 50} width={70} height={36} rx={3}
                  animate={{
                    fill: isActive ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.02)',
                    stroke: isActive ? ACCENT.violet : 'rgba(255,255,255,0.18)',
                  }}
                  transition={{ duration: 0.3 }} strokeWidth={1.5} />
                <motion.text x={135} y={matrixY + i * 50 + 24} textAnchor="middle"
                  fontSize="16" fontFamily="var(--font-mono)"
                  animate={{ fill: isActive ? '#fff' : ACCENT.dim }}
                  transition={{ duration: 0.3 }}>{id}</motion.text>
                {/* Arrow into matrix when active */}
                {isActive && (
                  <motion.path
                    d={`M 175 ${matrixY + i * 50 + 18} Q 320 ${matrixY + i * 50 + 18}, ${matrixX - 6} ${matrixY + activeRow * CELL_H + CELL_H / 2}`}
                    stroke={ACCENT.violet} strokeWidth={1.5} fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.5 / speed }} />
                )}
              </g>
            )
          })}
        </g>

        {/* Matrix — parallelogram (top edge shifted right by SKEW_X for fake-3D) */}
        <g transform={`translate(${matrixX}, ${matrixY})`}>
          {/* Body grid — render rows from back to front */}
          {Array.from({ length: ROWS }).map((_, r) => (
            <g key={r} transform={`translate(${(ROWS - r) * SKEW_X * CELL_H}, ${r * CELL_H})`}>
              {Array.from({ length: COLS }).map((_, c) => {
                const seed = (r * 73 + c * 19) % 100
                const opacity = 0.05 + (seed % 40) / 200
                const isActiveRow = r === activeRow
                return (
                  <rect
                    key={c}
                    x={c * CELL_W}
                    width={CELL_W - 1}
                    height={CELL_H - 1}
                    fill={
                      isActiveRow
                        ? `rgba(167,139,250,${0.55 + (seed % 30) / 100})`
                        : `rgba(167,139,250,${opacity})`
                    }
                  />
                )
              })}
            </g>
          ))}

          {/* Active row highlight stripe (over top) */}
          <motion.rect
            animate={{
              y: activeRow * CELL_H - 2,
              x: (ROWS - activeRow) * SKEW_X * CELL_H - 2,
            }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            width={matrixW + 4}
            height={CELL_H + 2}
            fill="none"
            stroke={ACCENT.violet}
            strokeWidth={2}
            filter="url(#emb-glow)"
          />

          {/* Edge outline (parallelogram) — front face */}
          <path
            d={`M 0 ${ROWS * CELL_H} L ${matrixW} ${ROWS * CELL_H} L ${matrixW + ROWS * SKEW_X * CELL_H} 0 L ${ROWS * SKEW_X * CELL_H} 0 Z`}
            fill="none"
            stroke={ACCENT.violet}
            strokeOpacity={0.55}
            strokeWidth={1.4}
          />

          {/* V brace */}
          <line x1={-14} y1={0} x2={-14} y2={ROWS * CELL_H} stroke={ACCENT.dim} strokeWidth={1} />
          <text x={-26} y={ROWS * CELL_H / 2 + 4} textAnchor="middle" fontSize="14"
            fontFamily="var(--font-display)" fontStyle="italic" fill={ACCENT.dim}>V</text>

          {/* d_model brace */}
          <line
            x1={ROWS * SKEW_X * CELL_H}
            y1={ROWS * CELL_H + 14}
            x2={ROWS * SKEW_X * CELL_H + matrixW}
            y2={ROWS * CELL_H + 14}
            stroke={ACCENT.dim}
            strokeWidth={1}
          />
          <text x={ROWS * SKEW_X * CELL_H + matrixW / 2} y={ROWS * CELL_H + 32}
            textAnchor="middle" fontSize="14" fontFamily="var(--font-display)"
            fontStyle="italic" fill={ACCENT.dim}>
            d
            <tspan fontSize="11" dy="3">model</tspan>
          </text>
        </g>

        {/* Extracted vector on the right */}
        <g transform={`translate(${matrixX + matrixW + 100}, 280)`}>
          <text x={0} y={-30} fontSize="12" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.22em">
            VECTOR FOR TOKEN {ids[cursor]}
          </text>
          <text x={0} y={-12} fontSize="14" fontFamily="var(--font-display)"
            fontStyle="italic" fill={ACCENT.dim}>ℝ
            <tspan fontSize="10" dy="-4">384</tspan>
          </text>

          {/* Vector cells animated as gradient */}
          <motion.g key={`vec-${cursor}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 / speed, delay: 0.3 / speed }}>
            <rect x={0} y={0} width={400} height={36} fill="url(#vec-grad)" rx={2}
              opacity={0.9} />
            {/* Discrete cells overlay */}
            {Array.from({ length: 32 }).map((_, c) => (
              <rect key={c} x={c * 12.5} y={0} width={12} height={36}
                fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
            ))}
            <text x={0} y={56} fontSize="10" fontFamily="var(--font-mono)"
              fill={ACCENT.dim}>1</text>
            <text x={200} y={56} textAnchor="middle" fontSize="10"
              fontFamily="var(--font-mono)" fill={ACCENT.dim}>· · ·</text>
            <text x={400} y={56} textAnchor="end" fontSize="10"
              fontFamily="var(--font-mono)" fill={ACCENT.dim}>384</text>
          </motion.g>

          {/* Stub rows for other tokens (dimmed) */}
          <g transform="translate(0, 100)">
            <text x={0} y={-12} fontSize="11" fontFamily="var(--font-mono)"
              fill={ACCENT.dim} letterSpacing="0.22em">
              VECTOR FOR TOKEN {ids[(cursor + 1) % ids.length]}
            </text>
            <rect x={0} y={0} width={400} height={28} rx={2}
              fill="rgba(255,255,255,0.04)" stroke={ACCENT.rule} />
            {Array.from({ length: 32 }).map((_, c) => (
              <rect key={c} x={c * 12.5 + 0.5} y={0.5}
                width={11.5} height={27} fill="rgba(167,139,250,0.05)" />
            ))}
          </g>
          <g transform="translate(0, 160)">
            <text x={0} y={-12} fontSize="11" fontFamily="var(--font-mono)"
              fill={ACCENT.dim} letterSpacing="0.22em">
              VECTOR FOR TOKEN {ids[(cursor + 2) % ids.length]}
            </text>
            <rect x={0} y={0} width={400} height={28} rx={2}
              fill="rgba(255,255,255,0.04)" stroke={ACCENT.rule} />
            {Array.from({ length: 32 }).map((_, c) => (
              <rect key={c} x={c * 12.5 + 0.5} y={0.5}
                width={11.5} height={27} fill="rgba(167,139,250,0.05)" />
            ))}
          </g>
          <text x={200} y={220} textAnchor="middle" fontSize="14"
            fontFamily="var(--font-mono)" fill={ACCENT.dim}>⋮</text>
        </g>
      </svg>
    </div>
  )
}

/* ─────────────────── Scene E · Positional Encoding ─────────────────── */

export function VizPositional() {
  const speed = useSpeed()
  const POSITIONS = 8
  const D = 12 // visible dim count

  // Pre-compute sinusoidal values for each (pos, dim)
  const peValues = useMemo(() => {
    const arr: number[][] = []
    for (let p = 0; p < POSITIONS; p++) {
      const row: number[] = []
      for (let d = 0; d < D; d++) {
        const dim = Math.floor(d / 2)
        const freq = 1 / Math.pow(10000, (2 * dim) / D)
        row.push(d % 2 === 0 ? Math.sin(p * freq * 1.4) : Math.cos(p * freq * 1.4))
      }
      arr.push(row)
    }
    return arr
  }, [])

  // Embedding values (random but stable)
  const embValues = useMemo(() => {
    const out: number[] = []
    for (let i = 0; i < D; i++) out.push(Math.sin(i * 1.7 + 0.5) * 0.6)
    return out
  }, [])

  const POS_X_START = 230
  const POS_DX = 130
  const COL_W = 88
  const CELL_H = 22

  const WAVE_X0 = POS_X_START - 30
  const WAVE_X1 = POS_X_START + (POSITIONS - 1) * POS_DX + 30

  const colorWave = [ACCENT.cyan, ACCENT.blue, ACCENT.violet, ACCENT.amber, ACCENT.mint]

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 900" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="pos-glow"><feGaussianBlur stdDeviation="2" /></filter>
        </defs>

        {/* Top — wave bank */}
        <text x={WAVE_X0} y={45} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.22em">POSITIONAL ENCODING (PE)</text>

        {Array.from({ length: 5 }).map((_, w) => {
          const freq = 0.6 + w * 0.6
          const ampl = 22 - w * 1.8
          const yBase = 90 + w * 36
          const pts: string[] = []
          for (let x = WAVE_X0; x <= WAVE_X1; x += 4) {
            const t = (x - WAVE_X0) / (WAVE_X1 - WAVE_X0)
            const y = yBase + Math.sin(t * Math.PI * 2 * freq + w * 0.7) * ampl
            pts.push(`${x === WAVE_X0 ? 'M' : 'L'} ${x} ${y}`)
          }
          return (
            <g key={w}>
              <text x={WAVE_X0 - 28} y={yBase + 4} textAnchor="end" fontSize="13"
                fontFamily="var(--font-display)" fontStyle="italic" fill={colorWave[w]}>
                ω<tspan fontSize="9" dy="3">{w}</tspan>
              </text>
              <motion.path d={pts.join(' ')} fill="none" stroke={colorWave[w]}
                strokeOpacity={0.65} strokeWidth={1.5}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.6 / speed, delay: w * 0.18 / speed }} />
              {/* Sample dots at each position */}
              {Array.from({ length: POSITIONS }).map((_, p) => {
                const t = p / (POSITIONS - 1)
                const x = WAVE_X0 + t * (WAVE_X1 - WAVE_X0)
                const y = yBase + Math.sin(t * Math.PI * 2 * freq + w * 0.7) * ampl
                return (
                  <motion.circle key={p} cx={x} cy={y} r={3} fill={colorWave[w]}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 / speed + p * 0.05 / speed }} />
                )
              })}
            </g>
          )
        })}

        {/* Position labels */}
        {Array.from({ length: POSITIONS }).map((_, p) => (
          <text key={p}
            x={POS_X_START + p * POS_DX}
            y={310}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill={ACCENT.dim}>{p + 1}</text>
        ))}
        <text x={WAVE_X0 - 28} y={310} textAnchor="end" fontSize="10"
          fontFamily="var(--font-mono)" fill={ACCENT.dim}
          letterSpacing="0.18em">TOKEN POSITION</text>

        {/* Sampling lines (dropping into columns) */}
        {Array.from({ length: POSITIONS }).map((_, p) => (
          <motion.line key={p}
            x1={POS_X_START + p * POS_DX}
            x2={POS_X_START + p * POS_DX}
            y1={88}
            y2={335}
            stroke={ACCENT.cyan}
            strokeOpacity={0.25}
            strokeDasharray="2 4"
            strokeWidth={1}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 / speed, delay: 2.0 / speed + p * 0.05 / speed }} />
        ))}

        {/* EMBEDDING row label */}
        <text x={POS_X_START - COL_W / 2 - 20} y={368} textAnchor="end" fontSize="10"
          fontFamily="var(--font-mono)" fill={ACCENT.violet} letterSpacing="0.18em">
          EMBEDDING
        </text>
        <text x={POS_X_START - COL_W / 2 - 20} y={386} textAnchor="end" fontSize="10"
          fontFamily="var(--font-display)" fontStyle="italic" fill={ACCENT.dim}>
          (original)
        </text>

        {/* Embedding columns (same vertical bar of cells per position) */}
        {Array.from({ length: POSITIONS }).map((_, p) => (
          <motion.g key={p} transform={`translate(${POS_X_START + p * POS_DX - COL_W / 2}, 350)`}
            initial={{ opacity: 0, y: 360 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 / speed + p * 0.06 / speed, duration: 0.5 / speed }}>
            {embValues.map((v, d) => {
              const t = Math.max(-1, Math.min(1, v))
              const fill = t >= 0
                ? `rgba(167,139,250,${0.30 + t * 0.55})`
                : `rgba(248,113,113,${0.25 + -t * 0.55})`
              return <rect key={d} x={0} y={d * CELL_H} width={COL_W} height={CELL_H - 1.5} fill={fill} />
            })}
            <rect x={0} y={0} width={COL_W} height={D * CELL_H - 1.5}
              fill="none" stroke={ACCENT.violet} strokeOpacity={0.45} strokeWidth={1.2} />
          </motion.g>
        ))}

        {/* + sign on the left */}
        <text x={POS_X_START - COL_W / 2 - 60} y={464} fontSize="36"
          fontFamily="var(--font-display)" fill={ACCENT.amber}>+</text>

        {/* PE row label */}
        <text x={POS_X_START - COL_W / 2 - 20} y={624} textAnchor="end" fontSize="10"
          fontFamily="var(--font-mono)" fill={ACCENT.cyan} letterSpacing="0.18em">
          POSITIONAL
        </text>
        <text x={POS_X_START - COL_W / 2 - 20} y={642} textAnchor="end" fontSize="10"
          fontFamily="var(--font-mono)" fill={ACCENT.cyan} letterSpacing="0.18em">
          ENCODING (PE)
        </text>

        {/* PE columns */}
        {peValues.map((row, p) => (
          <motion.g key={p} transform={`translate(${POS_X_START + p * POS_DX - COL_W / 2}, 600)`}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4 / speed + p * 0.05 / speed, duration: 0.5 / speed }}>
            {row.map((v, d) => {
              const t = Math.max(-1, Math.min(1, v))
              const fill = t >= 0
                ? `rgba(34,211,238,${0.25 + t * 0.55})`
                : `rgba(248,113,113,${0.20 + -t * 0.55})`
              return <rect key={d} x={0} y={d * 6} width={COL_W} height={5} fill={fill} />
            })}
            <rect x={0} y={0} width={COL_W} height={D * 6 - 1}
              fill="none" stroke={ACCENT.cyan} strokeOpacity={0.45} strokeWidth={1.2} />
          </motion.g>
        ))}

        {/* = sign */}
        <text x={POS_X_START - COL_W / 2 - 60} y={730} fontSize="36"
          fontFamily="var(--font-display)" fill={ACCENT.mint}>=</text>

        {/* Result row label */}
        <text x={POS_X_START - COL_W / 2 - 20} y={730} textAnchor="end" fontSize="10"
          fontFamily="var(--font-mono)" fill={ACCENT.mint} letterSpacing="0.18em">
          INPUT
        </text>
        <text x={POS_X_START - COL_W / 2 - 20} y={748} textAnchor="end" fontSize="10"
          fontFamily="var(--font-display)" fontStyle="italic" fill={ACCENT.dim}>
          (with position)
        </text>

        {/* Result columns — sum of embed + PE */}
        {peValues.map((row, p) => (
          <motion.g key={p} transform={`translate(${POS_X_START + p * POS_DX - COL_W / 2}, 700)`}
            initial={{ opacity: 0, y: 740 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.4 / speed + p * 0.05 / speed, duration: 0.5 / speed }}>
            {row.map((pe, d) => {
              const sum = pe + embValues[d]
              const t = Math.max(-1, Math.min(1, sum / 1.2))
              const fill = t >= 0
                ? `rgba(52,211,153,${0.30 + t * 0.55})`
                : `rgba(248,113,113,${0.20 + -t * 0.55})`
              return <rect key={d} x={0} y={d * CELL_H * 0.6} width={COL_W}
                height={CELL_H * 0.6 - 1} fill={fill} />
            })}
            <rect x={0} y={0} width={COL_W} height={D * CELL_H * 0.6 - 1}
              fill="none" stroke={ACCENT.mint} strokeOpacity={0.55} strokeWidth={1.2} />
          </motion.g>
        ))}

        {/* Equation card at bottom */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 4.5 / speed, duration: 0.6 / speed }}>
          <rect x={500} y={830} width={400} height={48} rx={4}
            fill="rgba(255,255,255,0.03)" stroke={ACCENT.rule} />
          <text x={700} y={862} textAnchor="middle" fontSize="20"
            fontFamily="var(--font-display)" fontStyle="italic" fill="rgba(255,255,255,0.95)">
            x<tspan fontSize="13" dy="3">i</tspan>
            <tspan dy="-3" fontSize="11">input</tspan>
            <tspan fontSize="20" dy="0"> = </tspan>
            x<tspan fontSize="13" dy="3">i</tspan>
            <tspan dy="-3" fontSize="11">embed</tspan>
            <tspan fontSize="20"> + PE(i)</tspan>
          </text>
        </motion.g>

        {/* Continuous position scrubber — after waves draw + columns appear,
            a glowing vertical highlight slides across position-by-position
            so the viewer keeps seeing motion through the long static phase. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.6 / speed, duration: 0.4 / speed }}
        >
          <motion.rect
            y={88}
            width={POS_DX * 0.78}
            height={690}
            rx={6}
            fill="rgba(167,139,250,0.06)"
            stroke={ACCENT.violet}
            strokeOpacity={0.65}
            strokeWidth={1.5}
            animate={{
              x: Array.from({ length: POSITIONS + 1 }).map(
                (_, i) =>
                  POS_X_START + ((i % POSITIONS) * POS_DX) - POS_DX * 0.39,
              ),
            }}
            transition={{
              duration: (POSITIONS * 1.1) / speed,
              ease: 'linear',
              repeat: Infinity,
              delay: 6 / speed,
            }}
          />
        </motion.g>
      </svg>
    </div>
  )
}

/* ─────────────────── Scene F · Ready for Block 0 (handoff) ─────────────────── */

export function VizReadyForBlock0() {
  const speed = useSpeed()
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 900" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="slab-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="0.3" stopColor="#60a5fa" stopOpacity="0.55" />
            <stop offset="0.55" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="0.8" stopColor="#34d399" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0.55" />
          </linearGradient>
          <filter id="ready-bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Background — subtle perspective floor */}
        <g opacity="0.4">
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 600 + i * 35
            const widen = i * 30
            return (
              <line
                key={i}
                x1={100 - widen}
                y1={y}
                x2={1300 + widen}
                y2={y}
                stroke={ACCENT.violet}
                strokeOpacity={0.04 + i * 0.012}
                strokeWidth={0.5}
              />
            )
          })}
        </g>

        {/* Title label */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6 / speed, delay: 0.2 / speed }}>
          <text x={130} y={210} fontSize="11" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.26em">INPUT SLAB</text>
          <text x={130} y={236} fontSize="20" fontFamily="var(--font-display)"
            fontStyle="italic" fill={ACCENT.dim}>T × d
            <tspan fontSize="13" dy="3">model</tspan>
          </text>
          <line x1={140} y1={250} x2={210} y2={310} stroke={ACCENT.violet}
            strokeOpacity={0.5} strokeWidth={1} />
        </motion.g>

        {/* Block stack on the right */}
        {[0, 1, 2].map((i) => (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.4 / speed + i * 0.15 / speed, duration: 0.5 / speed }}>
            <text x={970 + i * 70} y={185} fontSize="11" fontFamily="var(--font-mono)"
              fill={i === 0 ? ACCENT.violet : ACCENT.dim} letterSpacing="0.26em">
              BLOCK {i}
            </text>
            {/* Block as glassy parallelepiped */}
            <g transform={`translate(${950 + i * 70}, 250)`}>
              <path
                d="M 0 0 L 200 0 L 240 80 L 200 280 L 0 280 L -40 200 Z"
                fill="rgba(255,255,255,0.02)"
                stroke={i === 0 ? ACCENT.violet : 'rgba(167,139,250,0.32)'}
                strokeWidth={i === 0 ? 2 : 1.2}
                strokeOpacity={i === 0 ? 0.95 : 0.6}
              />
              {/* Top face */}
              <path
                d="M 0 0 L 200 0 L 240 80 L 40 80 Z"
                fill="rgba(167,139,250,0.04)"
                stroke={i === 0 ? ACCENT.violet : 'rgba(167,139,250,0.32)'}
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            </g>
          </motion.g>
        ))}
        <text x={1200} y={185} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.26em">· · ·</text>

        {/* The slab — moving toward Block 0 */}
        <motion.g
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.6 / speed, ease: [0.22, 1, 0.36, 1], delay: 0.6 / speed }}>
          {/* Glow underlay */}
          <path
            d="M 100 380 L 880 380 L 920 600 L 60 600 Z"
            fill="url(#slab-fill)"
            filter="url(#ready-bloom)"
            opacity="0.55"
          />
          {/* Slab body */}
          <path
            d="M 100 380 L 880 380 L 920 600 L 60 600 Z"
            fill="rgba(167,139,250,0.10)"
            stroke={ACCENT.violet}
            strokeWidth={2}
          />
          {/* Token columns inside slab — color-banded to preserve identity */}
          {Array.from({ length: 14 }).map((_, t) => {
            const colors = [
              ACCENT.violet, ACCENT.blue, ACCENT.cyan, ACCENT.mint,
              ACCENT.amber, ACCENT.pink, ACCENT.violet, ACCENT.blue,
              ACCENT.cyan, ACCENT.mint, ACCENT.amber, ACCENT.pink,
              ACCENT.violet, ACCENT.blue,
            ]
            const xTop = 100 + (t / 14) * 780
            const xBot = 60 + (t / 14) * 860
            return (
              <g key={t}>
                <line x1={xTop} y1={380} x2={xBot} y2={600}
                  stroke={colors[t]} strokeOpacity={0.18} strokeWidth={1.5} />
                {/* Glowing dots within */}
                {Array.from({ length: 8 }).map((_, d) => {
                  const ti = (d + 1) / 9
                  const x = xTop + (xBot - xTop) * ti
                  const y = 380 + (600 - 380) * ti
                  return <circle key={d} cx={x} cy={y} r={0.9}
                    fill={colors[t]} opacity={0.6} />
                })}
              </g>
            )
          })}

          {/* Forward arrow */}
          <motion.path
            d="M 920 490 L 980 490 M 968 478 L 980 490 L 968 502"
            stroke={ACCENT.violet} strokeWidth={2.2} fill="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 2.0 / speed, duration: 0.5 / speed }} />
        </motion.g>

        {/* Streaks underneath — implies motion (looping) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.line
            key={i}
            y1={648 + i * 11}
            y2={648 + i * 11}
            x1={0}
            x2={180}
            stroke={ACCENT.violet}
            strokeOpacity={0.22 - i * 0.025}
            strokeWidth={1}
            animate={{ x: [-180, 1400] }}
            transition={{
              duration: 2.6 / speed,
              ease: 'linear',
              repeat: Infinity,
              delay: i * 0.18 / speed,
            }}
          />
        ))}

        {/* Token particles flowing along the slab into Block 0 — looping */}
        {Array.from({ length: 18 }).map((_, i) => {
          const lane = i % 6
          const colors = [
            ACCENT.violet, ACCENT.blue, ACCENT.cyan,
            ACCENT.mint, ACCENT.amber, ACCENT.pink,
          ]
          const yLane = 410 + lane * 32
          return (
            <motion.circle
              key={`flow-${i}`}
              r={2.6}
              cy={yLane}
              fill={colors[lane]}
              opacity={0.85}
              animate={{
                cx: [80, 920],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{
                duration: 2.4 / speed,
                ease: 'easeOut',
                repeat: Infinity,
                delay: 1.2 / speed + (i * 0.13) / speed,
                times: [0, 0.15, 0.85, 1],
              }}
            />
          )
        })}

        {/* Caption */}
        <motion.text
          x={700} y={780} textAnchor="middle"
          fontSize="18" fontFamily="var(--font-display)" fontStyle="italic"
          fill={ACCENT.dim}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.6 / speed, duration: 0.6 / speed }}
        >
          residual stream entering Block 0
        </motion.text>
      </svg>
    </div>
  )
}

/* =========================================================================
 * SCENE WRAPPERS — connect live data (prompt, cycling state) to the
 * SplitPaneScene's right-pane. Each wrapper uses hooks to compute live
 * stats / phase / equation values and forwards them as plain ReactNode.
 *
 * Why wrappers and not data objects: the right pane needs values that
 * change during the scene (current merge index, current cursor row,
 * current position), which means hooks. Hooks must live inside
 * components, so we put each scene's text-pane data inside a small
 * dedicated component.
 * ====================================================================== */

const ACT_KICKER = 'ACT I · INPUT'

/* ─────────── Scene 2 · Act I Intro ─────────── */
export function Act1IntroSplitPane() {
  const { prompt } = usePrompt()
  const T = (prompt || '').length
  return (
    <SplitPaneScene
      viz={<VizActIIntro />}
      text={{
        kicker: ACT_KICKER,
        title: 'First — text becomes numbers.',
        subtitle: 'the input slab, before any block.',
        accent: ACCENT.violet,
        stats: [
          { label: 'T (live)', value: T, color: ACCENT.violet },
          { label: 'd_model', value: '384' },
          { label: 'shape', value: `[${T}, 384]`, color: ACCENT.violet },
        ],
        infoCallout:
          'Your prompt has to be turned into integers before the network can do math on it.',
      }}
    />
  )
}

/* ─────────── Scene 3 · Tokenization ─────────── */
export function TokensSplitPane() {
  const { prompt } = usePrompt()
  const text = prompt || 'The cat sat on the mat.'
  const chars = text.split('').slice(0, 14)
  const speed = useSpeed()

  // Cycle a "currently scanning" index in time with the left-pane scanner
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setCursor((c) => (c + 1) % chars.length),
      550 / speed,
    )
    return () => clearInterval(id)
  }, [chars.length, speed])

  const ch = chars[cursor] ?? '?'
  const id = ch.charCodeAt(0) % 65

  return (
    <SplitPaneScene
      viz={<VizTokenization />}
      text={{
        kicker: ACT_KICKER,
        title: 'Text becomes tokens.',
        subtitle: (
          <>
            The raw text is split into discrete input units before the model
            can process it.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={cursor + 1}
            total={chars.length}
            label="scanning"
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'T', value: chars.length, color: ACCENT.violet },
          { label: 'vocab', value: '65' },
          { label: 'IDs', value: '[0, 65)' },
        ],
        equation: {
          label: 'live tokenization',
          body: (
            <>
              ‘{ch === ' ' ? '·' : ch}’ → ID{' '}
              <span style={{ color: ACCENT.violet }}>{id}</span>
            </>
          ),
        },
        infoCallout:
          'This model uses character tokens — one visible character maps to one vocabulary ID in [0, 65).',
      }}
    />
  )
}

/* ─────────── Scene 4 · BPE ─────────── */
export function BPESplitPane() {
  const speed = useSpeed()
  const merges = ['e + r → er', 't + h → th', 'i + n → in', 'er + s → ers']
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => (s + 1) % (merges.length + 1)),
      2200 / speed,
    )
    return () => clearInterval(id)
  }, [merges.length, speed])
  const showStep = Math.min(step, merges.length - 1)
  const vocabSize = 256 + showStep + 1

  return (
    <SplitPaneScene
      viz={<VizBPE />}
      text={{
        kicker: ACT_KICKER,
        title: 'Real models use BPE.',
        subtitle: (
          <>
            Start from bytes. Count how often adjacent pairs appear. Merge the
            most frequent pair into a new token. <strong>Repeat.</strong>
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={showStep + 1}
            total={merges.length}
            label="merging"
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'starting vocab', value: '256' },
          { label: 'after merges', value: vocabSize, color: ACCENT.mint },
          { label: 'real LLMs', value: '~50K+' },
        ],
        equation: {
          label: 'rule learned',
          body: <>{merges[showStep]}</>,
        },
        infoCallout:
          'These merge rules are model-specific and learned during pretraining — they compress text into far fewer tokens than character-level.',
      }}
    />
  )
}

/* ─────────── Scene 5 · Embedding ─────────── */
export function EmbeddingSplitPane() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const promptChars = (prompt || 'The cat sat').split('').slice(0, 8)
  const ids = promptChars.map((c) => c.charCodeAt(0) % 65)

  // Match the cursor cycle inside VizEmbedding (2200ms)
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setCursor((c) => (c + 1) % Math.max(ids.length, 1)),
      2200 / speed,
    )
    return () => clearInterval(id)
  }, [ids.length, speed])

  const currentId = ids[cursor] ?? 0
  const currentCh = promptChars[cursor] ?? '?'

  // Synthetic vector preview — first 4 dims of a deterministic vector for the ID
  const previewDims = Array.from({ length: 4 }).map((_, i) => {
    const v = Math.sin(currentId * 0.7 + i * 1.3) * 0.6
    return v.toFixed(2)
  })

  return (
    <SplitPaneScene
      viz={<VizEmbedding />}
      text={{
        kicker: ACT_KICKER,
        title: 'Each token becomes a vector.',
        subtitle: (
          <>
            A token ID indexes into a <em>learned</em> embedding table and
            returns one row — a dense, <em>learned</em> vector the model
            can read.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={cursor + 1}
            total={Math.max(ids.length, 1)}
            label={`token ‘${currentCh === ' ' ? '·' : currentCh}’`}
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'V', value: '65' },
          { label: 'd_model', value: '384' },
          { label: 'params', value: '24,960' },
        ],
        equation: {
          label: 'live lookup',
          body: (
            <>
              embed({currentId}) ={' '}
              <span style={{ color: ACCENT.violet }}>
                [{previewDims.join(', ')}, …]
              </span>
            </>
          ),
        },
        infoCallout:
          'E is learned during training and shared across all positions — the same row is returned every time that token appears.',
      }}
    />
  )
}

/* ─────────── Scene 6 · Positional ─────────── */
export function PositionalSplitPane() {
  const speed = useSpeed()
  const POSITIONS = 8

  const [pos, setPos] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPos((p) => (p + 1) % POSITIONS),
      1100 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Compute one PE sample at this position for the lowest frequency
  const peSample = Math.sin(pos * 1.0).toFixed(2)

  return (
    <SplitPaneScene
      viz={<VizPositional />}
      text={{
        kicker: ACT_KICKER,
        title: 'Position gets baked in.',
        subtitle: (
          <>
            A unique sinusoidal pattern for each position is added directly
            to the token embedding so the model knows order.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={pos + 1}
            total={POSITIONS}
            label="position"
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'pos i (live)', value: pos, color: ACCENT.violet },
          { label: 'd_model', value: '384' },
          { label: 'sin(i·ω₀)', value: peSample, color: ACCENT.cyan },
        ],
        equation: {
          label: 'how position joins the vector',
          body: (
            <>
              x<sub>{pos}</sub>
              <sup style={{ fontSize: '0.7em' }}>input</sup>
              {' = '}x<sub>{pos}</sub>
              <sup style={{ fontSize: '0.7em' }}>embed</sup>
              {' + PE('}
              <span style={{ color: ACCENT.violet }}>{pos}</span>
              {')'}
            </>
          ),
        },
        infoCallout:
          'These patterns are fixed (not learned) and work across any sequence length — every position gets a distinct fingerprint.',
      }}
    />
  )
}

/* ─────────── Scene 7 · Ready for Block 0 ─────────── */
export function ReadyForBlock0SplitPane() {
  const { prompt } = usePrompt()
  const T = (prompt || '').length || 14
  const totalFloats = (T * 384).toLocaleString()

  return (
    <SplitPaneScene
      viz={<VizReadyForBlock0 />}
      text={{
        kicker: ACT_KICKER,
        title: 'Ready for Block 0.',
        subtitle: (
          <>
            After tokenization, embedding lookup, and positional encoding,
            the model now has a T-by-d<sub>model</sub> input slab. It can
            finally begin transformer computation.
          </>
        ),
        accent: ACCENT.violet,
        stats: [
          { label: 'T (live)', value: T, color: ACCENT.violet },
          { label: 'd_model', value: '384' },
          { label: 'total floats', value: totalFloats, color: ACCENT.mint },
        ],
        equation: {
          label: 'input slab shape',
          body: (
            <>
              [<span style={{ color: ACCENT.violet }}>{T}</span>
              {', 384] → Block 0'}
            </>
          ),
        },
        infoCallout:
          'This slab is the residual stream — the running representation that flows through every block, accumulating each block’s contribution.',
      }}
    />
  )
}
