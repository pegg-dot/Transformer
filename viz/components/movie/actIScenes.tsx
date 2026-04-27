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
  const { prompt } = usePrompt()
  const T = Math.max(1, (prompt || '').length || 19)

  // Centerline x. Use viewBox 1400×800 — closer to the panes' actual aspect.
  const CX = 700

  // Slab — top face is a parallelogram with axonometric depth.
  const slab = {
    backY: 220,
    frontY: 340,
    backHalf: 320,
    frontHalf: 380,
  }
  const sb = slab
  const slabPath =
    `M ${CX - sb.backHalf} ${sb.backY}` +
    ` L ${CX + sb.backHalf} ${sb.backY}` +
    ` L ${CX + sb.frontHalf} ${sb.frontY}` +
    ` L ${CX - sb.frontHalf} ${sb.frontY} Z`

  // Visible matrix grid inside the slab — quiet "blueprint" texture so it
  // reads as [T, d_model] and not as a flat platform.
  const SLAB_COLS = Math.min(T, 24) // visible token columns (cap so it stays readable)
  const SLAB_ROWS = 8 // compressed d_model micro-rows

  // 6 blocks — tightly stacked just below the slab. Block 0 is the active /
  // visible one; subsequent blocks fade exponentially into darkness.
  const blockTopY = 410
  const blockH = 22
  const blockGap = 32
  const blockOpacities = [0.85, 0.6, 0.4, 0.24, 0.14, 0.07]
  const blocks = Array.from({ length: 6 }).map((_, i) => ({
    z: i,
    backY: blockTopY + i * blockGap,
    frontY: blockTopY + i * blockGap + blockH,
    backHalf: 300 - i * 16,
    frontHalf: 340 - i * 14,
    opacity: blockOpacities[i],
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

        {/* ────── Block stack — drawn first (behind the slab) ──────
            Block 0 is the prominent active one (will receive the slab next).
            Later blocks fade exponentially into darkness. */}
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
            const isBlock0 = i === 0
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
                  fill={isBlock0 ? 'rgba(167,139,250,0.04)' : 'none'}
                  stroke={ACCENT.violet}
                  strokeOpacity={isBlock0 ? 0.85 : 0.55}
                  strokeWidth={isBlock0 ? 1.6 : 1}
                />
                <text
                  x={CX - b.backHalf - 14}
                  y={(b.backY + b.frontY) / 2 + 3}
                  textAnchor="end"
                  fontSize={isBlock0 ? 11 : 10}
                  fontFamily="var(--font-mono)"
                  fill={isBlock0 ? ACCENT.violet : ACCENT.dim}
                  letterSpacing="0.18em"
                  opacity={isBlock0 ? 1 : 0.7}
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
          {/* Glow underlay — stronger so the slab has more presence */}
          <path
            d={slabPath}
            fill="url(#slab-glow)"
            filter="url(#slab-bloom)"
            opacity="0.95"
          />
          {/* Slab body fill */}
          <path
            d={slabPath}
            fill="rgba(167,139,250,0.07)"
            stroke={ACCENT.violet}
            strokeWidth={2}
            strokeOpacity={0.95}
          />

          {/* Internal matrix cells — SLAB_COLS × SLAB_ROWS micro-rectangles
              drawn in the slab's slanted coordinate system. Each cell is
              tinted with a per-position color band so token columns are
              visible. Quiet by default ("blueprint" feel for the intro);
              the charging shimmer below brightens them on a loop. */}
          {Array.from({ length: SLAB_COLS }).map((_, t) => {
            const tNorm = SLAB_COLS <= 1 ? 0 : t / (SLAB_COLS - 1)
            const xTopL = CX - sb.backHalf + 2 * sb.backHalf * tNorm
            const xBotL = CX - sb.frontHalf + 2 * sb.frontHalf * tNorm
            const tNorm2 =
              SLAB_COLS <= 1
                ? 1
                : Math.min(1, tNorm + 1 / (SLAB_COLS - 1))
            const xTopR = CX - sb.backHalf + 2 * sb.backHalf * tNorm2
            const xBotR = CX - sb.frontHalf + 2 * sb.frontHalf * tNorm2

            // Color band per token column (cycles palette)
            const colors = [
              ACCENT.violet, ACCENT.blue, ACCENT.cyan,
              ACCENT.mint, ACCENT.amber, ACCENT.pink,
            ]
            const color = colors[t % colors.length]

            return (
              <g key={`col-${t}`}>
                {/* Column boundary line — slightly more visible than horizontal */}
                <line
                  x1={xTopL}
                  y1={sb.backY}
                  x2={xBotL}
                  y2={sb.frontY}
                  stroke={color}
                  strokeOpacity={0.22}
                  strokeWidth={0.6}
                />
                {/* d_model micro-rows — small filled rects for "matrix density" */}
                {Array.from({ length: SLAB_ROWS }).map((_, d) => {
                  const dt0 = d / SLAB_ROWS
                  const dt1 = (d + 1) / SLAB_ROWS
                  // Cell corners, interpolating across the trapezoid
                  const tl = {
                    x: xTopL + (xBotL - xTopL) * dt0,
                    y: sb.backY + (sb.frontY - sb.backY) * dt0,
                  }
                  const tr = {
                    x: xTopR + (xBotR - xTopR) * dt0,
                    y: sb.backY + (sb.frontY - sb.backY) * dt0,
                  }
                  const br = {
                    x: xTopR + (xBotR - xTopR) * dt1,
                    y: sb.backY + (sb.frontY - sb.backY) * dt1,
                  }
                  const bl = {
                    x: xTopL + (xBotL - xTopL) * dt1,
                    y: sb.backY + (sb.frontY - sb.backY) * dt1,
                  }
                  const v = (Math.sin(t * 0.7 + d * 1.5) + 1) / 2
                  const op = 0.05 + v * 0.18
                  return (
                    <path
                      key={`cell-${t}-${d}`}
                      d={`M ${tl.x} ${tl.y} L ${tr.x} ${tr.y} L ${br.x} ${br.y} L ${bl.x} ${bl.y} Z`}
                      fill={color}
                      opacity={op}
                    />
                  )
                })}
              </g>
            )
          })}

          {/* Horizontal d_model rule lines (sparse, subtle) */}
          {Array.from({ length: 5 }).map((_, i) => {
            const ti = (i + 1) / 6
            const y = sb.backY + (sb.frontY - sb.backY) * ti
            const half = sb.backHalf + (sb.frontHalf - sb.backHalf) * ti
            return (
              <motion.line
                key={`h-${i}`}
                x1={CX - half}
                y1={y}
                x2={CX + half}
                y2={y}
                stroke={ACCENT.violet}
                strokeOpacity={0.14}
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

          {/* Charging shimmer — a brighter band sweeps left→right across the
              slab on a 5s loop. Briefly brightens the cells it passes over
              so the slab feels like it's "charging up" with values. */}
          <motion.path
            d={slabPath}
            fill="rgba(167,139,250,0.18)"
            opacity={0}
            animate={{
              opacity: [0, 0.55, 0],
            }}
            transition={{
              duration: 2.4 / speed,
              repeat: Infinity,
              repeatDelay: 1.6 / speed,
              ease: 'easeInOut',
              delay: 2.4 / speed,
            }}
            style={{
              clipPath: 'inset(0 0 0 0)',
            }}
          />
        </motion.g>

        {/* ────── [T, d_model] kicker callout (top-right) ────── */}
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

        {/* ────── Axis labels — directly on the slab ──────
            Front edge: T = N TOKEN POSITIONS →
            Left slanted edge: d_model = 384 ↑ */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 / speed, duration: 0.6 / speed }}
        >
          {/* T axis along the front edge (slightly below) */}
          <line
            x1={CX - sb.frontHalf + 30}
            y1={sb.frontY + 18}
            x2={CX + sb.frontHalf - 30}
            y2={sb.frontY + 18}
            stroke={ACCENT.dim}
            strokeWidth={0.7}
          />
          <path
            d={`M ${CX + sb.frontHalf - 36} ${sb.frontY + 14} L ${CX + sb.frontHalf - 26} ${sb.frontY + 18} L ${CX + sb.frontHalf - 36} ${sb.frontY + 22}`}
            stroke={ACCENT.dim}
            strokeWidth={0.7}
            fill="none"
          />
          <text
            x={CX}
            y={sb.frontY + 36}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill={ACCENT.violet}
            letterSpacing="0.16em"
            opacity={0.85}
          >
            T = {T} TOKEN POSITIONS →
          </text>

          {/* d_model axis along the left slanted edge */}
          {(() => {
            const sx1 = CX - sb.backHalf - 26
            const sy1 = sb.backY + 8
            const sx2 = CX - sb.frontHalf - 26
            const sy2 = sb.frontY - 8
            const angle =
              (Math.atan2(sy2 - sy1, sx2 - sx1) * 180) / Math.PI
            const mx = (sx1 + sx2) / 2
            const my = (sy1 + sy2) / 2
            return (
              <>
                <line
                  x1={sx1}
                  y1={sy1}
                  x2={sx2}
                  y2={sy2}
                  stroke={ACCENT.dim}
                  strokeWidth={0.7}
                />
                <text
                  x={mx}
                  y={my - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.cyan}
                  letterSpacing="0.16em"
                  opacity={0.85}
                  transform={`rotate(${angle}, ${mx}, ${my - 8})`}
                >
                  d_model = 384 ↑
                </text>
              </>
            )
          })()}
        </motion.g>

        {/* ────── Connector — slab to Block 0 ────── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2.1 / speed, duration: 0.6 / speed }}
        >
          {/* Two faint vertical guides from slab front-edge corners down to
              Block 0's back-edge — visualizes the alignment / "this is the
              thing that will drop into Block 0 next". */}
          <line
            x1={CX - blocks[0].backHalf}
            y1={sb.frontY + 4}
            x2={CX - blocks[0].backHalf}
            y2={blocks[0].backY - 4}
            stroke={ACCENT.violet}
            strokeOpacity={0.35}
            strokeDasharray="3 4"
            strokeWidth={0.8}
          />
          <line
            x1={CX + blocks[0].backHalf}
            y1={sb.frontY + 4}
            x2={CX + blocks[0].backHalf}
            y2={blocks[0].backY - 4}
            stroke={ACCENT.violet}
            strokeOpacity={0.35}
            strokeDasharray="3 4"
            strokeWidth={0.8}
          />
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

        {/* (The "HOW THE ID IS COMPUTED" callout that used to live here was
            getting clipped on the left edge for prompts of 14+ chars and
            became redundant once the right pane's equation card started
            showing the same live lookup ‘ch’ → ID synced to the scanner.
            Removed in favor of the right pane.) */}
      </svg>
    </div>
  )
}

/* ─────────────────── Scene C · BPE ─────────────────── */

/**
 * BPE walkthrough — single unified merge tree for the word "unbelievably".
 *
 *   1. BYTES         12 hex codes (the starting vocab is 256 bytes)
 *   2. INITIAL TOKENS each byte rendered as its character
 *   3. MERGE STEPS    multi-level binary tree of merges (numbered 1..7)
 *   4. FINAL TOKENS   the eventual subword tokenization (un / believ / ably)
 *
 * Phase cycles through the 7 numbered merges. The active merge is highlighted
 * with a dashed violet stroke + glow; previously-completed merges stay
 * visible in mint/violet; future merges are dimmer.
 */
export function VizBPE() {
  const speed = useSpeed()

  const TOTAL_PHASES = 7
  const [phase, setPhase] = useState(0) // 0..TOTAL_PHASES-1, then re-cycles
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % TOTAL_PHASES),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // ── Geometry ──────────────────────────────────────────────────────────
  // Word: u n b e l i e v a b l y (12 chars)
  const word = 'unbelievably'.split('')
  const CELL_W = 56
  const CELL_GAP = 8
  const STEP = CELL_W + CELL_GAP // 64 per byte/initial cell
  const FIRST_X = 240 // x of the first byte cell's left edge
  const cellCenter = (i: number) => FIRST_X + i * STEP + CELL_W / 2

  // Y rows
  const Y_BYTES_BOX_TOP = 160
  const Y_BYTES_BOX_BOT = 200
  const Y_INIT_BOX_TOP = 270
  const Y_INIT_BOX_BOT = 320
  const Y_LVL1_TOP = 410
  const Y_LVL1_BOT = 470
  const Y_LVL2_TOP = 540
  const Y_LVL2_BOT = 600
  const Y_LVL3_TOP = 670
  const Y_LVL3_BOT = 740
  const Y_FINAL_TOP = 820
  const Y_FINAL_BOT = 890

  // Merge tree — 7 numbered merges in a binary tree
  // Levels: 1 (4 first-level), 2 (2 second-level), 3 (1 root)
  const lvl1 = [
    { id: 1, label: 'un',   left: cellCenter(0), right: cellCenter(1) },
    { id: 2, label: 'be',   left: cellCenter(2), right: cellCenter(3) },
    { id: 3, label: 'lie',  left: cellCenter(4), right: cellCenter(5) },
    { id: 4, label: 'ably', left: cellCenter(8), right: cellCenter(9) },
  ].map((m) => ({ ...m, cx: (m.left + m.right) / 2 }))

  const lvl2 = [
    { id: 5, label: 'unbe',     leftMerge: 1, rightMerge: 2 },
    { id: 6, label: 'lievably', leftMerge: 3, rightMerge: 4 },
  ].map((m) => {
    const l = lvl1.find((x) => x.id === m.leftMerge)!
    const r = lvl1.find((x) => x.id === m.rightMerge)!
    return { ...m, left: l.cx, right: r.cx, cx: (l.cx + r.cx) / 2 }
  })

  const lvl3 = (() => {
    const l = lvl2.find((x) => x.id === 5)!
    const r = lvl2.find((x) => x.id === 6)!
    return [
      { id: 7, label: 'unbelievably', left: l.cx, right: r.cx, cx: (l.cx + r.cx) / 2 },
    ]
  })()

  // Final-token row at the bottom
  const finals = [
    { label: 'un',     cx: cellCenter(0.5) }, // sits over u, n
    { label: 'believ', cx: cellCenter(4.5) }, // over b, e, l, i, e, v
    { label: 'ably',   cx: cellCenter(9.5) }, // over a, b, l, y
  ]

  // Helpers
  const isActive = (id: number) => phase === id - 1
  const isComplete = (id: number) => phase >= id
  const allMerges: { id: number; label: string }[] = [
    ...lvl1.map((m) => ({ id: m.id, label: m.label })),
    ...lvl2.map((m) => ({ id: m.id, label: m.label })),
    ...lvl3.map((m) => ({ id: m.id, label: m.label })),
  ]

  // Pretty rule strings for the rules table
  const ruleFor = (id: number): string => {
    switch (id) {
      case 1: return 'u + n → un'
      case 2: return 'b + e → be'
      case 3: return 'l + i → li'
      case 4: return 'li + e → lie'
      case 5: return 'un + be → unbe'
      case 6: return 'lie + vably → lievably'
      case 7: return 'unbe + lievably → unbelievably'
      default: return ''
    }
  }

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* ────── Top header strip ────── */}
        <text x={20} y={70} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.violet} letterSpacing="0.32em">BPE IN ACTION</text>
        <text x={200} y={70} fontSize="14" fontFamily="var(--font-display)"
          fill="rgba(255,255,255,0.85)">
          We start with bytes. Then we repeatedly merge the most frequent adjacent pairs.
        </text>

        {/* ────── Left label column ────── */}
        {/* Vertical violet rule that anchors the labels */}
        <line x1={20} y1={140} x2={20} y2={930} stroke={ACCENT.violet}
          strokeOpacity={0.25} strokeWidth={1} />

        <LayerLabel y={Y_BYTES_BOX_TOP - 5} num="1." title="BYTES"
          sub="Every byte is a token." color={ACCENT.dim} />
        <LayerLabel y={Y_INIT_BOX_TOP - 5} num="2." title="INITIAL TOKENS"
          sub="Start with single characters." color={ACCENT.blue} />
        <LayerLabel y={Y_LVL1_TOP - 5} num="3." title="MERGE STEPS"
          sub="Learn the most frequent adjacent pairs and merge them."
          color={ACCENT.mint} />
        <LayerLabel y={Y_FINAL_TOP - 5} num="4." title="FINAL TOKENS"
          sub="Fewer, larger subword units." color={ACCENT.violet} />

        {/* ────── Layer 1 — bytes (hex codes + char) ────── */}
        {word.map((ch, i) => {
          const x = FIRST_X + i * STEP
          return (
            <g key={`byte-${i}`}>
              <rect
                x={x}
                y={Y_BYTES_BOX_TOP}
                width={CELL_W}
                height={Y_BYTES_BOX_BOT - Y_BYTES_BOX_TOP}
                rx={3}
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1}
              />
              <text
                x={x + CELL_W / 2}
                y={Y_BYTES_BOX_TOP + 26}
                textAnchor="middle"
                fontSize="14"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
              >
                {ch.charCodeAt(0).toString(16).toUpperCase()}
              </text>
              {/* Char rendered below the byte box */}
              <text
                x={x + CELL_W / 2}
                y={Y_BYTES_BOX_BOT + 22}
                textAnchor="middle"
                fontSize="16"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={ACCENT.dim}
              >
                {ch}
              </text>
              {/* Dashed connector to initial tokens */}
              <line
                x1={x + CELL_W / 2}
                x2={x + CELL_W / 2}
                y1={Y_BYTES_BOX_BOT + 30}
                y2={Y_INIT_BOX_TOP - 4}
                stroke={ACCENT.blue}
                strokeOpacity={0.25}
                strokeDasharray="2 4"
                strokeWidth={1}
              />
            </g>
          )
        })}

        {/* ────── Layer 2 — initial tokens (chars in violet pills) ────── */}
        {word.map((ch, i) => {
          const x = FIRST_X + i * STEP
          return (
            <g key={`init-${i}`}>
              <rect
                x={x}
                y={Y_INIT_BOX_TOP}
                width={CELL_W}
                height={Y_INIT_BOX_BOT - Y_INIT_BOX_TOP}
                rx={4}
                fill="rgba(96,165,250,0.06)"
                stroke={ACCENT.blue}
                strokeOpacity={0.55}
                strokeWidth={1.2}
              />
              <text
                x={x + CELL_W / 2}
                y={Y_INIT_BOX_TOP + 36}
                textAnchor="middle"
                fontSize="22"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill="rgba(255,255,255,0.92)"
              >
                {ch}
              </text>
            </g>
          )
        })}

        {/* ────── Connectors: initial tokens → level 1 merges ────── */}
        {lvl1.map((m) => {
          const completed = isComplete(m.id) || isActive(m.id)
          return (
            <g key={`l1-conn-${m.id}`} opacity={completed ? 1 : 0.25}>
              <line
                x1={m.left}
                x2={m.cx}
                y1={Y_INIT_BOX_BOT + 4}
                y2={Y_LVL1_TOP - 4}
                stroke={ACCENT.mint}
                strokeOpacity={isActive(m.id) ? 0.85 : 0.5}
                strokeWidth={isActive(m.id) ? 1.6 : 1}
              />
              <line
                x1={m.right}
                x2={m.cx}
                y1={Y_INIT_BOX_BOT + 4}
                y2={Y_LVL1_TOP - 4}
                stroke={ACCENT.mint}
                strokeOpacity={isActive(m.id) ? 0.85 : 0.5}
                strokeWidth={isActive(m.id) ? 1.6 : 1}
              />
            </g>
          )
        })}

        {/* ────── Layer 3a — Level 1 merges (numbered circles + cards) ────── */}
        {lvl1.map((m) => (
          <MergeCard
            key={`l1-${m.id}`}
            n={m.id}
            label={m.label}
            cx={m.cx}
            yTop={Y_LVL1_TOP}
            yBot={Y_LVL1_BOT}
            active={isActive(m.id)}
            complete={isComplete(m.id) || isActive(m.id)}
          />
        ))}

        {/* ────── Connectors: level 1 → level 2 ────── */}
        {lvl2.map((m) => {
          const completed = isComplete(m.id) || isActive(m.id)
          return (
            <g key={`l2-conn-${m.id}`} opacity={completed ? 1 : 0.18}>
              <line
                x1={m.left}
                x2={m.cx}
                y1={Y_LVL1_BOT + 4}
                y2={Y_LVL2_TOP - 4}
                stroke={ACCENT.mint}
                strokeOpacity={isActive(m.id) ? 0.85 : 0.5}
                strokeWidth={isActive(m.id) ? 1.6 : 1}
              />
              <line
                x1={m.right}
                x2={m.cx}
                y1={Y_LVL1_BOT + 4}
                y2={Y_LVL2_TOP - 4}
                stroke={ACCENT.mint}
                strokeOpacity={isActive(m.id) ? 0.85 : 0.5}
                strokeWidth={isActive(m.id) ? 1.6 : 1}
              />
            </g>
          )
        })}

        {/* ────── Layer 3b — Level 2 merges ────── */}
        {lvl2.map((m) => (
          <MergeCard
            key={`l2-${m.id}`}
            n={m.id}
            label={m.label}
            cx={m.cx}
            yTop={Y_LVL2_TOP}
            yBot={Y_LVL2_BOT}
            active={isActive(m.id)}
            complete={isComplete(m.id) || isActive(m.id)}
            wide
          />
        ))}

        {/* ────── Connectors: level 2 → level 3 ────── */}
        {lvl3.map((m) => {
          const completed = isComplete(m.id) || isActive(m.id)
          return (
            <g key={`l3-conn-${m.id}`} opacity={completed ? 1 : 0.18}>
              <line
                x1={m.left}
                x2={m.cx}
                y1={Y_LVL2_BOT + 4}
                y2={Y_LVL3_TOP - 4}
                stroke={ACCENT.violet}
                strokeOpacity={isActive(m.id) ? 0.95 : 0.55}
                strokeWidth={isActive(m.id) ? 1.8 : 1.1}
              />
              <line
                x1={m.right}
                x2={m.cx}
                y1={Y_LVL2_BOT + 4}
                y2={Y_LVL3_TOP - 4}
                stroke={ACCENT.violet}
                strokeOpacity={isActive(m.id) ? 0.95 : 0.55}
                strokeWidth={isActive(m.id) ? 1.8 : 1.1}
              />
            </g>
          )
        })}

        {/* ────── Layer 3c — Level 3 (root merge) ────── */}
        {lvl3.map((m) => (
          <MergeCard
            key={`l3-${m.id}`}
            n={m.id}
            label={m.label}
            cx={m.cx}
            yTop={Y_LVL3_TOP}
            yBot={Y_LVL3_BOT}
            active={isActive(m.id)}
            complete={isComplete(m.id) || isActive(m.id)}
            isRoot
          />
        ))}

        {/* ────── Connectors: level 3 root → final tokens ────── */}
        {(() => {
          const root = lvl3[0]
          return (
            <g opacity={phase >= 6 ? 1 : 0.3}>
              {finals.map((f, i) => (
                <line
                  key={`final-conn-${i}`}
                  x1={root.cx}
                  y1={Y_LVL3_BOT + 4}
                  x2={f.cx}
                  y2={Y_FINAL_TOP - 4}
                  stroke={ACCENT.violet}
                  strokeOpacity={0.55}
                  strokeWidth={1.2}
                />
              ))}
            </g>
          )
        })()}

        {/* ────── Layer 4 — final tokens (the payoff) ────── */}
        {finals.map((f, i) => {
          const isHero = phase >= 6
          return (
            <motion.g
              key={`final-${i}`}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: isHero ? 1 : 0.45 }}
              transition={{ duration: 0.5 / speed, ease: 'easeOut' }}
            >
              {/* Halo glow when active */}
              {isHero && (
                <motion.rect
                  x={f.cx - 90}
                  y={Y_FINAL_TOP - 6}
                  width={180}
                  height={Y_FINAL_BOT - Y_FINAL_TOP + 12}
                  rx={9}
                  fill="rgba(167,139,250,0.06)"
                  animate={{ opacity: [0.4, 0.85, 0.4] }}
                  transition={{
                    duration: 2.4 / speed,
                    repeat: Infinity,
                    delay: i * 0.3 / speed,
                    ease: 'easeInOut',
                  }}
                />
              )}
              <rect
                x={f.cx - 76}
                y={Y_FINAL_TOP}
                width={152}
                height={Y_FINAL_BOT - Y_FINAL_TOP}
                rx={6}
                fill="rgba(167,139,250,0.18)"
                stroke={ACCENT.violet}
                strokeWidth={2.4}
              />
              <text
                x={f.cx}
                y={(Y_FINAL_TOP + Y_FINAL_BOT) / 2 + 12}
                textAnchor="middle"
                fontSize="32"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={ACCENT.violet}
              >
                {f.label}
              </text>
            </motion.g>
          )
        })}

        {/* ────── Right-side rules table inside the left pane ────── */}
        <g transform="translate(1040, 160)">
          <text fontSize="11" fontFamily="var(--font-mono)"
            fill="rgba(255,255,255,0.85)" letterSpacing="0.22em">
            LEARNED MERGE RULES
            <tspan fill={ACCENT.dim} letterSpacing="0.04em" dx="6">(so far)</tspan>
          </text>
          <rect x={-12} y={20} width={330} height={420} rx={6}
            fill="rgba(255,255,255,0.02)" stroke="rgba(167,139,250,0.18)" />
          {allMerges.map((m, i) => {
            const visible = phase >= i
            const active = phase === i
            return (
              <g key={`rule-${m.id}`}
                opacity={visible ? 1 : 0.18}
                transform={`translate(0, ${36 + i * 56})`}>
                {active && (
                  <motion.rect
                    x={-8} y={-4} width={322} height={48} rx={4}
                    fill="rgba(167,139,250,0.14)"
                    stroke={ACCENT.violet}
                    strokeWidth={1}
                    strokeDasharray="3 4"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{
                      duration: 2 / speed,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                <text x={6} y={22} fontSize="12"
                  fontFamily="var(--font-mono)"
                  fill={active ? ACCENT.violet : ACCENT.dim}>
                  #{m.id}
                </text>
                <text x={42} y={26} fontSize="18"
                  fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={active ? '#fff' : 'rgba(255,255,255,0.78)'}>
                  {ruleFor(m.id)}
                </text>
              </g>
            )
          })}
        </g>

        {/* ────── Bottom caption strip ────── */}
        <text x={700} y={1010} textAnchor="middle"
          fontSize="14" fontFamily="var(--font-display)"
          fontStyle="italic" fill={ACCENT.dim} opacity="0.85">
          BPE turns a long sequence of bytes into a shorter sequence of meaningful subword tokens.
        </text>
      </svg>
    </div>
  )
}

/** Layer-label block in the left margin (number + title + sub-description). */
function LayerLabel({
  y,
  num,
  title,
  sub,
  color,
}: {
  y: number
  num: string
  title: string
  sub: string
  color: string
}) {
  return (
    <g transform={`translate(40, ${y})`}>
      <text fontSize="11" fontFamily="var(--font-mono)"
        fill={color} letterSpacing="0.22em" opacity="0.85">
        {num} {title}
      </text>
      <text y={20} fontSize="11" fontFamily="var(--font-display)"
        fontStyle="italic" fill={ACCENT.dim} opacity="0.65">
        {sub}
      </text>
    </g>
  )
}

/** A merge card in the tree. Numbered circle to the left, label inside.
 *  Active merges get a dashed violet stroke + breathing pulse. */
function MergeCard({
  n,
  label,
  cx,
  yTop,
  yBot,
  active,
  complete,
  wide,
  isRoot,
}: {
  n: number
  label: string
  cx: number
  yTop: number
  yBot: number
  active: boolean
  complete: boolean
  wide?: boolean
  isRoot?: boolean
}) {
  const w = isRoot ? 280 : wide ? 160 : 96
  const x = cx - w / 2
  const h = yBot - yTop
  const cy = (yTop + yBot) / 2
  const numColor = isRoot ? ACCENT.violet : ACCENT.mint
  const strokeColor = isRoot ? ACCENT.violet : ACCENT.mint
  const fillBg = isRoot
    ? 'rgba(167,139,250,0.18)'
    : complete
    ? 'rgba(52,211,153,0.12)'
    : 'rgba(52,211,153,0.04)'

  return (
    <g opacity={complete || active ? 1 : 0.35}>
      {/* Numbered circle to the upper-left of the card */}
      <circle
        cx={x - 14}
        cy={yTop + 6}
        r={11}
        fill="rgba(8,8,11,0.95)"
        stroke={numColor}
        strokeWidth={1.2}
      />
      <text
        x={x - 14}
        y={yTop + 10}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={numColor}
      >
        {n}
      </text>

      {/* Card body — dashed stroke when active */}
      {active ? (
        <motion.rect
          x={x}
          y={yTop}
          width={w}
          height={h}
          rx={5}
          fill={fillBg}
          stroke={ACCENT.violet}
          strokeWidth={2}
          strokeDasharray="6 4"
          animate={{
            filter: [
              `drop-shadow(0 0 0 ${ACCENT.violet}00)`,
              `drop-shadow(0 0 14px ${ACCENT.violet})`,
              `drop-shadow(0 0 0 ${ACCENT.violet}00)`,
            ],
          }}
          transition={{
            duration: 2 / 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <rect
          x={x}
          y={yTop}
          width={w}
          height={h}
          rx={5}
          fill={fillBg}
          stroke={strokeColor}
          strokeWidth={isRoot ? 2.2 : 1.4}
          strokeOpacity={complete ? 0.85 : 0.5}
        />
      )}

      <text
        x={cx}
        y={cy + (isRoot ? 12 : 8)}
        textAnchor="middle"
        fontSize={isRoot ? 30 : wide ? 22 : 22}
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={isRoot ? ACCENT.violet : complete ? ACCENT.mint : 'rgba(255,255,255,0.45)'}
      >
        {label}
      </text>
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
  const { prompt } = usePrompt()
  // Real T from the user's prompt — fall back to 19 (default tour prompt length)
  const T = Math.max(1, (prompt || '').length || 19)

  // Color band per token position (cycle through palette)
  const colorPalette = [
    ACCENT.violet, ACCENT.blue, ACCENT.cyan,
    ACCENT.mint, ACCENT.amber, ACCENT.pink,
  ]
  const colorFor = (t: number) => colorPalette[t % colorPalette.length]

  // Slab geometry — back edge wider than front edge for axonometric perspective.
  // (Inverted from before: the slab "rests" so the FRONT edge is closer/wider.)
  const slab = {
    backY: 380,
    frontY: 600,
    backLeft: 100,
    backRight: 880,
    frontLeft: 60,
    frontRight: 920,
  }
  const slabPath =
    `M ${slab.backLeft} ${slab.backY}` +
    ` L ${slab.backRight} ${slab.backY}` +
    ` L ${slab.frontRight} ${slab.frontY}` +
    ` L ${slab.frontLeft} ${slab.frontY} Z`

  // Block 0 intake slot — positioned so the slab visually slides into it.
  // The slot's left edge sits ~30px to the right of the slab's front-right.
  const intakeX = 970
  const intakeTop = slab.backY - 12
  const intakeBot = slab.frontY + 12

  // Visible matrix grid — token columns × hidden-dim micro-rows
  const ROWS_VIS = 24 // visible "d_model marks" per column (compressed from 384)

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
          <linearGradient id="intake-glow" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.0" />
            <stop offset="0.4" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0.95" />
          </linearGradient>
          <filter id="ready-bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="intake-bloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Background — subtle perspective floor */}
        <g opacity="0.4">
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 620 + i * 32
            const widen = i * 30
            return (
              <line
                key={i}
                x1={40 - widen}
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

        {/* Title label (top-left) */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6 / speed, delay: 0.2 / speed }}>
          <text x={130} y={210} fontSize="11" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.26em">INPUT SLAB</text>
          <text x={130} y={236} fontSize="20" fontFamily="var(--font-display)"
            fontStyle="italic" fill={ACCENT.dim}>
            <tspan fill={ACCENT.violet}>{T}</tspan> × 384
          </text>
          <line x1={140} y1={250} x2={210} y2={350} stroke={ACCENT.violet}
            strokeOpacity={0.5} strokeWidth={1} />
        </motion.g>

        {/* ───── Block stack on the right ─────
            Block 0 is the focused/active one. Blocks 1–2 are dimmer and
            sit behind it. Final ellipsis indicates more blocks beyond. */}
        {/* Blocks 1–2 (dim, behind) — drawn first so Block 0 sits on top */}
        {[1, 2].map((i) => (
          <motion.g key={`bg-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 0.55 }}
            transition={{ delay: 0.4 / speed + i * 0.12 / speed, duration: 0.5 / speed }}>
            <text x={1090 + (i - 1) * 60} y={195} fontSize="9.5"
              fontFamily="var(--font-mono)" fill={ACCENT.dim}
              letterSpacing="0.22em" opacity="0.7">
              Block {i}
            </text>
            <g transform={`translate(${1075 + (i - 1) * 60}, 260)`}>
              <path
                d="M 0 0 L 160 0 L 195 60 L 160 240 L 0 240 L -35 180 Z"
                fill="rgba(255,255,255,0.014)"
                stroke="rgba(167,139,250,0.22)"
                strokeWidth={1}
              />
            </g>
          </motion.g>
        ))}
        <text x={1230} y={195} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.26em" opacity="0.55">· · ·</text>

        {/* Block 0 (active) — large, prominent, with glowing intake slot */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.4 / speed, duration: 0.5 / speed }}>
          <text x={985} y={185} fontSize="14" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.32em" fontWeight={500}>
            BLOCK 0
          </text>
          <g transform="translate(950, 240)">
            <path
              d="M 0 0 L 200 0 L 250 90 L 200 320 L 0 320 L -50 230 Z"
              fill="rgba(255,255,255,0.025)"
              stroke={ACCENT.violet}
              strokeWidth={2}
              strokeOpacity={0.95}
            />
            {/* Top face */}
            <path
              d="M 0 0 L 200 0 L 250 90 L 50 90 Z"
              fill="rgba(167,139,250,0.05)"
              stroke={ACCENT.violet}
              strokeWidth={1}
              strokeOpacity={0.7}
            />
          </g>
        </motion.g>

        {/* Block 0 intake slot — glowing rectangular doorway on the slab-side
            face. Pulses to indicate it's actively receiving the slab. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 / speed, duration: 0.6 / speed }}
        >
          {/* Glow halo */}
          <motion.rect
            x={intakeX - 6}
            y={intakeTop}
            width={20}
            height={intakeBot - intakeTop}
            fill="url(#intake-glow)"
            filter="url(#intake-bloom)"
            animate={{ opacity: [0.55, 0.95, 0.55] }}
            transition={{
              duration: 2.4 / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Slot inner edge */}
          <line
            x1={intakeX}
            x2={intakeX}
            y1={intakeTop}
            y2={intakeBot}
            stroke={ACCENT.violet}
            strokeWidth={2.5}
            strokeOpacity={0.9}
          />
          {/* Top + bottom slot caps */}
          <line x1={intakeX - 4} x2={intakeX + 6} y1={intakeTop}
            y2={intakeTop} stroke={ACCENT.violet} strokeWidth={2} strokeOpacity={0.85} />
          <line x1={intakeX - 4} x2={intakeX + 6} y1={intakeBot}
            y2={intakeBot} stroke={ACCENT.violet} strokeWidth={2} strokeOpacity={0.85} />
        </motion.g>

        {/* The slab — moving toward Block 0 */}
        <motion.g
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.6 / speed, ease: [0.22, 1, 0.36, 1], delay: 0.6 / speed }}>
          {/* Glow underlay */}
          <path
            d={slabPath}
            fill="url(#slab-fill)"
            filter="url(#ready-bloom)"
            opacity="0.55"
          />
          {/* Slab body */}
          <path
            d={slabPath}
            fill="rgba(167,139,250,0.10)"
            stroke={ACCENT.violet}
            strokeWidth={2}
          />

          {/* Token columns inside slab — one per real T, with visible
              d_model micro-rows so the slab reads as a real matrix. */}
          {Array.from({ length: T }).map((_, t) => {
            const tNorm = T <= 1 ? 0 : t / (T - 1)
            const xTop = slab.backLeft + tNorm * (slab.backRight - slab.backLeft)
            const xBot = slab.frontLeft + tNorm * (slab.frontRight - slab.frontLeft)
            const color = colorFor(t)
            return (
              <g key={t}>
                {/* Vertical column edge — strong for first/last, lighter inside */}
                <line
                  x1={xTop} y1={slab.backY}
                  x2={xBot} y2={slab.frontY}
                  stroke={color}
                  strokeOpacity={0.32}
                  strokeWidth={1}
                />
                {/* d_model micro-rows: short cross-marks on each column */}
                {Array.from({ length: ROWS_VIS }).map((_, d) => {
                  const ti = (d + 0.5) / ROWS_VIS
                  const x = xTop + (xBot - xTop) * ti
                  const y = slab.backY + (slab.frontY - slab.backY) * ti
                  // Synthesized intensity from sin(t,d) so each cell looks
                  // like a real activation value
                  const v = (Math.sin(t * 0.7 + d * 1.3) + 1) / 2
                  const op = 0.18 + v * 0.65
                  return (
                    <rect
                      key={d}
                      x={x - 5}
                      y={y - 1.2}
                      width={10}
                      height={2.4}
                      fill={color}
                      opacity={op}
                    />
                  )
                })}
              </g>
            )
          })}

          {/* Horizontal d_model rule lines — every ~6 rows, full slab width */}
          {Array.from({ length: 4 }).map((_, k) => {
            const ti = (k + 1) / 5
            const x1 =
              slab.backLeft + (slab.frontLeft - slab.backLeft) * ti
            const x2 =
              slab.backRight + (slab.frontRight - slab.backRight) * ti
            const y =
              slab.backY + (slab.frontY - slab.backY) * ti
            return (
              <line
                key={`h-${k}`}
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke={ACCENT.violet}
                strokeOpacity={0.12}
                strokeWidth={0.5}
              />
            )
          })}

          {/* Forward arrow — sliding into the intake slot */}
          <motion.path
            d={`M ${slab.frontRight + 5} 490 L ${intakeX - 5} 490 M ${intakeX - 17} 478 L ${intakeX - 5} 490 L ${intakeX - 17} 502`}
            stroke={ACCENT.violet} strokeWidth={2.2} fill="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 2.0 / speed, duration: 0.5 / speed }} />
        </motion.g>

        {/* ───── Axis labels ─────
            "T = N token positions →" along the front edge,
            "d_model = 384 hidden dims" along the side edge. */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.4 / speed, duration: 0.6 / speed }}>
          {/* Front-edge axis label (T) */}
          <line
            x1={slab.frontLeft + 10}
            y1={slab.frontY + 22}
            x2={slab.frontRight - 10}
            y2={slab.frontY + 22}
            stroke={ACCENT.dim}
            strokeWidth={0.8}
          />
          <path
            d={`M ${slab.frontRight - 14} ${slab.frontY + 18} L ${slab.frontRight - 4} ${slab.frontY + 22} L ${slab.frontRight - 14} ${slab.frontY + 26}`}
            stroke={ACCENT.dim}
            strokeWidth={0.8}
            fill="none"
          />
          <text
            x={(slab.frontLeft + slab.frontRight) / 2}
            y={slab.frontY + 50}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill={ACCENT.violet}
            letterSpacing="0.16em"
          >
            T = {T} TOKEN POSITIONS →
          </text>

          {/* Side-edge axis label (d_model) — placed on the LEFT slanted edge */}
          {(() => {
            const sx1 = slab.backLeft - 30
            const sy1 = slab.backY + 20
            const sx2 = slab.frontLeft - 30
            const sy2 = slab.frontY - 20
            const angle =
              (Math.atan2(sy2 - sy1, sx2 - sx1) * 180) / Math.PI
            const mx = (sx1 + sx2) / 2
            const my = (sy1 + sy2) / 2
            return (
              <>
                <line
                  x1={sx1}
                  y1={sy1}
                  x2={sx2}
                  y2={sy2}
                  stroke={ACCENT.dim}
                  strokeWidth={0.8}
                />
                <text
                  x={mx}
                  y={my - 6}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.cyan}
                  letterSpacing="0.16em"
                  transform={`rotate(${angle}, ${mx}, ${my - 6})`}
                >
                  d_model = 384 ↑
                </text>
              </>
            )
          })()}
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

        {/* Caption — payoff line. The prompt is no longer text. */}
        <motion.text
          x={700} y={800} textAnchor="middle"
          fontSize="20" fontFamily="var(--font-display)" fontStyle="italic"
          fill="rgba(255,255,255,0.92)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.8 / speed, duration: 0.6 / speed }}
        >
          The prompt is no longer text. It is a matrix of numbers
        </motion.text>
        <motion.text
          x={700} y={830} textAnchor="middle"
          fontSize="20" fontFamily="var(--font-display)" fontStyle="italic"
          fill="rgba(255,255,255,0.92)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 3.0 / speed, duration: 0.6 / speed }}
        >
          entering the first transformer block.
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
  // Same 7-merge sequence as the VizBPE tree, in order. Phase chip,
  // stats, and "rule learned this step" all stay synchronized with the
  // tree's currently-active merge highlight.
  const rules = [
    'u + n → un',
    'b + e → be',
    'l + i → li',
    'li + e → lie',
    'un + be → unbe',
    'lie + vably → lievably',
    'unbe + lievably → unbelievably',
  ]
  const TOTAL = rules.length // 7

  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => (s + 1) % TOTAL),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [TOTAL, speed])

  const vocabAfter = 256 + step + 1

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
            current={step + 1}
            total={TOTAL}
            label="merging"
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'starting vocab', value: '256' },
          { label: 'after merges', value: vocabAfter, color: ACCENT.mint },
          { label: 'real LLMs', value: '~50K+' },
        ],
        equation: {
          label: 'rule learned this step',
          body: <>{rules[step]}</>,
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
  const T = (prompt || '').length || 19
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
          label: 'input slab → Block 0',
          body: (
            <>
              <span style={{ color: ACCENT.violet }}>{T}</span> token
              vectors × <span style={{ color: ACCENT.cyan }}>384</span>{' '}
              numbers each
              <br />
              <span style={{ fontStyle: 'normal', fontSize: '0.78em', opacity: 0.7 }}>
                X ∈ ℝ<sup>{T} × 384</sup> → Block 0
              </span>
            </>
          ),
        },
        infoCallout:
          'This slab is the residual stream — the running representation that flows through every block, accumulating each block’s contribution.',
      }}
    />
  )
}
