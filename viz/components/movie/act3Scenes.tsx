'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
const BLOCK_W = 156
const BLOCK_H = 320
const BLOCK_Y = 210
const BLOCK_DEPTH = 22 // isometric depth offset (up + right)
const BLOCK_BOTTOM = BLOCK_Y + BLOCK_H
const STREAM_Y = 600
const STREAM_H = 30
const STREAM_X_START = 90
const STREAM_X_END = 1310
const STREAM_LEN = STREAM_X_END - STREAM_X_START
const HERO_DURATION = 8 // seconds for the pulse to traverse the stream

const BLOCK_CENTERS = [180, 380, 580, 780, 980, 1180]
const BLOCK_CENTER_Y = BLOCK_Y + BLOCK_H / 2

// Block hue progression: cyan (195°) → magenta (305°)
function blockHue(i: number): number {
  return 195 + (i / (BLOCK_COUNT - 1)) * 110
}
function blockColor(i: number, sat = 70, light = 65, alpha = 1): string {
  return `hsla(${blockHue(i)}, ${sat}%, ${light}%, ${alpha})`
}

/* =========================================================================
 * Scene 16 — act3-intro: "That block, six times over."
 *
 * Cinematic transition from Act II to Act III. Phase A holds the single
 * block we just studied at center, scaled up. Phase B animates that block
 * back to its slot in a 6-stack while five sibling clones fade in around
 * it; the residual stream emerges underneath, draws left-to-right, and
 * primes the eye for Scene 17.
 * ====================================================================== */

export function VizActIIIntro() {
  const speed = useSpeed()
  const PHASES = 2
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Hero: block index 3 (slightly right-of-center stack slot at x=780)
  const heroIdx = 3
  const heroFinalX = BLOCK_CENTERS[heroIdx]
  const heroFinalY = BLOCK_CENTER_Y
  const heroCenterX = 700
  const heroCenterY = 420
  const heroDx = phase === 0 ? heroCenterX - heroFinalX : 0
  const heroDy = phase === 0 ? heroCenterY - heroFinalY : 0
  const heroScale = phase === 0 ? 1.45 : 1

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="intro-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="intro-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="stack-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="intro-stream-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.85)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.85)" />
          </linearGradient>
          <linearGradient id="intro-stream-bright" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,211,238,1)" />
            <stop offset="50%" stopColor="rgba(96,165,250,1)" />
            <stop offset="100%" stopColor="rgba(236,72,153,1)" />
          </linearGradient>
          <linearGradient id="intro-tube-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="32%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="68%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </linearGradient>
          <linearGradient id="intro-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(96,165,250,0.0)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0.06)" />
          </linearGradient>
        </defs>

        {/* Subtle horizon / floor band — depth cue under the blocks */}
        <rect x={0} y={BLOCK_BOTTOM + 8} width={1400} height={STREAM_Y - BLOCK_BOTTOM - 8}
          fill="url(#intro-floor)" pointerEvents="none" />

        {/* Top kicker */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          ACT III · THE FULL STACK · ZOOMING OUT
        </text>

        {/* Title — crossfades between phases */}
        {[
          'the one block we just studied …',
          '… is repeated six times.',
        ].map((t, i) => (
          <motion.text
            key={`intro-title-${i}`}
            x={700} y={92} textAnchor="middle"
            fontSize="22" fontFamily="var(--font-display)"
            fontStyle="italic" fill="rgba(255,255,255,0.95)"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === i ? 1 : 0 }}
            transition={{ duration: 0.5 / speed, ease: 'easeOut' }}
          >
            {t}
          </motion.text>
        ))}
        <text x={700} y={120} textAnchor="middle"
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.08em">
          {phase === 0
            ? 'Act II zoomed in. Act III zooms back out.'
            : 'same recipe · same shape · stacked into a tower'}
        </text>

        {/* Five sibling clones — fade in only in phase B, staggered by distance from hero */}
        {[0, 1, 2, 4, 5].map((i) => {
          const distFromHero = Math.abs(i - heroIdx)
          return (
            <motion.g
              key={`clone-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: phase >= 1 ? 1 : 0,
                scale: phase >= 1 ? 1 : 0.5,
              }}
              transition={{
                duration: 0.55 / speed,
                delay: phase >= 1 ? (0.3 + distFromHero * 0.15) / speed : 0,
                ease: 'easeOut',
              }}
              style={{
                transformOrigin: `${BLOCK_CENTERS[i]}px ${heroFinalY}px`,
              }}
            >
              <StackBlockBody idx={i} speed={speed} />
            </motion.g>
          )
        })}

        {/* Hero block — animates between centered+scaled (phase A) and slot 3 (phase B) */}
        <motion.g
          animate={{
            x: heroDx,
            y: heroDy,
            scale: heroScale,
          }}
          transition={{ duration: 1.2 / speed, ease: 'easeInOut' }}
          style={{ transformOrigin: `${heroFinalX}px ${heroFinalY}px` }}
        >
          <StackBlockBody idx={heroIdx} speed={speed} />
          {/* Hero glow ring (only in phase A) */}
          <motion.rect
            x={BLOCK_CENTERS[heroIdx] - BLOCK_W / 2 - 8}
            y={BLOCK_Y - 8}
            width={BLOCK_W + 16}
            height={BLOCK_H + 16}
            rx={12}
            fill="none"
            stroke={ACCENT.cyan}
            strokeWidth={1.6}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 0 ? [0.35, 0.85, 0.35] : 0 }}
            transition={{
              duration: 2.0 / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.g>

        {/* Phase-A annotation: "the one we studied" call-out around the hero */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 0 ? 1 : 0 }}
          transition={{ duration: 0.5 / speed, delay: phase === 0 ? 0.6 / speed : 0 }}
        >
          <text x={heroCenterX} y={heroCenterY - BLOCK_H * 0.85}
            textAnchor="middle"
            fontSize="11" fontFamily="var(--font-mono)"
            fill={ACCENT.cyan} letterSpacing="0.22em">
            ↑ THE ONE WE JUST STUDIED
          </text>
          <text x={heroCenterX} y={heroCenterY + BLOCK_H * 0.86}
            textAnchor="middle"
            fontSize="11" fontFamily="var(--font-mono)"
            fill={ACCENT.dim} fontStyle="italic">
            LayerNorm · Attention · FFN · residual add
          </text>
        </motion.g>

        {/* Residual stream — emerges in phase B, drawing left-to-right
            Same 3D tube treatment as Scene 17: ground shadow, bloom,
            color band, cylindrical lighting overlay, top specular. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.6 / speed, delay: phase >= 1 ? 1.1 / speed : 0 }}
        >
          <text x={STREAM_X_START + STREAM_LEN / 2} y={STREAM_Y - 16}
            textAnchor="middle"
            fontSize="11" fontFamily="var(--font-mono)"
            fill={ACCENT.cyan} letterSpacing="0.22em">
            RESIDUAL STREAM · 384-DIM
          </text>
          {/* Tube shadow on the floor */}
          <motion.ellipse
            cx={STREAM_X_START + STREAM_LEN / 2}
            cy={STREAM_Y + STREAM_H + 14}
            ry={5}
            fill="rgba(0,0,0,0.5)"
            filter="url(#stack-shadow)"
            initial={{ rx: 0, opacity: 0 }}
            animate={{
              rx: phase >= 1 ? STREAM_LEN / 2 - 30 : 0,
              opacity: phase >= 1 ? 0.65 : 0,
            }}
            transition={{ duration: 1.2 / speed, delay: phase >= 1 ? 1.3 / speed : 0, ease: 'easeOut' }}
          />
          {/* Bloom halo */}
          <motion.rect
            x={STREAM_X_START} y={STREAM_Y}
            height={STREAM_H} rx={STREAM_H / 2}
            fill="url(#intro-stream-bright)"
            filter="url(#intro-bloom)"
            initial={{ width: 0, opacity: 0.5 }}
            animate={{
              width: phase >= 1 ? STREAM_LEN : 0,
              opacity: phase >= 1 ? [0.6, 0.95, 0.85] : 0,
            }}
            transition={{
              width: { duration: 1.2 / speed, delay: phase >= 1 ? 1.3 / speed : 0, ease: 'easeOut' },
              opacity: { duration: 1.5 / speed, delay: phase >= 1 ? 1.3 / speed : 0 },
            }}
          />
          {/* Inner color band */}
          <motion.rect
            x={STREAM_X_START} y={STREAM_Y + 4}
            height={STREAM_H - 8} rx={(STREAM_H - 8) / 2}
            fill="url(#intro-stream-grad)"
            initial={{ width: 0 }}
            animate={{ width: phase >= 1 ? STREAM_LEN : 0 }}
            transition={{ duration: 1.2 / speed, delay: phase >= 1 ? 1.3 / speed : 0, ease: 'easeOut' }}
          />
          {/* Cylindrical lighting overlay */}
          <motion.rect
            x={STREAM_X_START} y={STREAM_Y + 4}
            height={STREAM_H - 8} rx={(STREAM_H - 8) / 2}
            fill="url(#intro-tube-light)"
            pointerEvents="none"
            initial={{ width: 0 }}
            animate={{ width: phase >= 1 ? STREAM_LEN : 0 }}
            transition={{ duration: 1.2 / speed, delay: phase >= 1 ? 1.3 / speed : 0, ease: 'easeOut' }}
          />
          {/* Top specular highlight */}
          <motion.rect
            x={STREAM_X_START + 24} y={STREAM_Y + 5}
            height={3} rx={1.5}
            fill="rgba(255,255,255,0.42)"
            initial={{ width: 0 }}
            animate={{ width: phase >= 1 ? STREAM_LEN - 48 : 0 }}
            transition={{ duration: 1.2 / speed, delay: phase >= 1 ? 1.4 / speed : 0, ease: 'easeOut' }}
          />
          {/* Endpoint chips */}
          <g transform={`translate(20, ${STREAM_Y - 14})`}>
            <rect width={60} height={50} rx={4}
              fill="rgba(34,211,238,0.10)"
              stroke={ACCENT.cyan} strokeWidth={1.4} />
            <text x={30} y={32} textAnchor="middle"
              fontSize="16" fontFamily="var(--font-mono)" fill={ACCENT.cyan}>
              in
            </text>
          </g>
          <g transform={`translate(1320, ${STREAM_Y - 14})`}>
            <rect width={60} height={50} rx={4}
              fill="rgba(236,72,153,0.18)"
              stroke={ACCENT.pink} strokeWidth={1.6}
              filter="url(#intro-glow)" />
            <text x={30} y={32} textAnchor="middle"
              fontSize="16" fontFamily="var(--font-display)" fontStyle="italic"
              fill={ACCENT.pink}>
              out
            </text>
          </g>
        </motion.g>

        {/* Bottom message panel */}
        <ActIIIIntroBottom phase={phase} />

        {/* Phase summary */}
        <ActIIIIntroPhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

function ActIIIIntroBottom({ phase }: { phase: number }) {
  return (
    <g>
      <rect x={200} y={720} width={1000} height={100} rx={12}
        fill="rgba(34,211,238,0.025)"
        stroke="rgba(34,211,238,0.18)" strokeWidth={1} />
      {[
        {
          big: 'one block · zoomed in',
          small: 'we spent Act II inside this · LayerNorm, attention, FFN',
        },
        {
          big: 'same block · stacked six times',
          small: 'six identical blocks · one running residual stream · climbing',
        },
      ].map((c, i) => (
        <motion.g
          key={`intro-bot-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === i ? 1 : 0 }}
          transition={{ duration: 0.45 }}
        >
          <text x={700} y={758} textAnchor="middle"
            fontSize="20" fontFamily="var(--font-display)"
            fontStyle="italic" fill="rgba(255,255,255,0.92)">
            {c.big}
          </text>
          <text x={700} y={794} textAnchor="middle"
            fontSize="12" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
            {c.small}
          </text>
        </motion.g>
      ))}
    </g>
  )
}

function ActIIIIntroPhaseSummary({ phase }: { phase: number }) {
  const beats = ['one block · zoomed in', 'multiplied · into six']
  return (
    <g transform="translate(700, 950)">
      {beats.map((b, i) => {
        const w = 320
        const x = (i - beats.length / 2) * w + w / 2
        const active = i === phase
        return (
          <g key={`intro-sum-${i}`} transform={`translate(${x}, 0)`}>
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

export function ActIIIIntroSplitPane() {
  const speed = useSpeed()
  const PHASES = 2
  const phaseLabels = ['the one block', 'multiplied into six']
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      We just spent Act II zooming inside <em>this</em> block. LayerNorm,
      attention, multi-head, FFN, residual add — all inside one module.
    </>,
    <>
      Now zoom back out. The full transformer is just the same block, stacked
      six times. One residual stream walks through every one of them.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'one block (Act II)',
      body: <>block(x) = FFN(LN(x + Attn(LN(x))))</>,
    },
    {
      label: 'six blocks (Act III)',
      body: <>x ← block₅(block₄(block₃(block₂(block₁(block₀(x))))))</>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'A single block is dense — LayerNorm + multi-head attention + FFN + two residual adds. Now imagine that whole assembly repeated, top to bottom of the model.',
    'GPT-2 Small had 12 of these. GPT-2 XL had 48. GPT-4 reportedly ~120. The recipe is fixed; depth is the only knob that changes.',
  ]

  return (
    <SplitPaneScene
      viz={<VizActIIIntro />}
      text={{
        kicker: ACT3_KICKER,
        title: 'That block, six times over.',
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
          { label: 'we just saw', value: '1 block', color: ACCENT.cyan },
          { label: 'this act', value: '6 blocks', color: ACCENT.cyan },
          { label: 'GPT-2 Small', value: '12 blocks' },
          { label: 'GPT-2 XL', value: '48 blocks' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
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
          <filter id="stack-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
          <linearGradient id="stack-tube-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="32%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="68%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </linearGradient>
          {/* Subtle floor / horizon — gives the blocks something to sit on */}
          <linearGradient id="stack-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(96,165,250,0.0)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0.06)" />
          </linearGradient>
        </defs>

        {/* Subtle horizon / floor band — depth cue under the blocks */}
        <rect x={0} y={BLOCK_BOTTOM + 8} width={1400} height={STREAM_Y - BLOCK_BOTTOM - 8}
          fill="url(#stack-floor)" pointerEvents="none" />

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

        {/* Hero residual stream */}
        <StackResidualStream phase={phase} speed={speed} />

        {/* Six transformer blocks */}
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <StackBlock key={`blk-${i}`} idx={i} phase={phase} speed={speed} />
        ))}

        {/* Per-block highlight halos — only in CLIMBING phase, sequenced
            with hero pulse arrival so each block lights up in turn */}
        {phase === 1 && Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <StackBlockHighlight key={`halo-${i}`} idx={i} speed={speed} />
        ))}

        {/* Delta injections — connectors + labels always visible (dim);
            pulse landings only fire in CLIMBING phase */}
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <StackDeltaInjection key={`delta-${i}`} idx={i} phase={phase} speed={speed} />
        ))}

        {/* Ambient stream particles — always running, subtle */}
        <StackFlowParticles speed={speed} />

        {/* Hero pulse — only in CLIMBING phase; color-shifts as it travels */}
        {phase === 1 && <StackHeroPulse speed={speed} />}

        {/* Input and output chips */}
        <StackInputOutput speed={speed} />

        {/* Bottom payoff — clean editorial text, no panel */}
        <StackPayoff phase={phase} />

        {/* Phase summary footer */}
        <StackPhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── Hero residual stream (the visual headliner) ───────────────
 * Rendered as a 3D-feeling tube: bloom halo, a horizontal color band, a
 * cylindrical lighting overlay (light up top, shadow down low), and a
 * soft tube shadow on the "ground" below it. */
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

      {/* Tube shadow on the "ground" below the stream */}
      <ellipse
        cx={STREAM_X_START + STREAM_LEN / 2}
        cy={STREAM_Y + STREAM_H + 14}
        rx={STREAM_LEN / 2 - 30} ry={5}
        fill="rgba(0,0,0,0.5)"
        filter="url(#stack-shadow)"
        opacity={0.7} />

      {/* Bloom halo */}
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

      {/* Crisp inner band — horizontal color (cyan→blue→magenta) */}
      <rect
        x={STREAM_X_START} y={STREAM_Y + 4}
        width={STREAM_LEN} height={STREAM_H - 8}
        rx={(STREAM_H - 8) / 2}
        fill="url(#stack-stream-grad)"
      />

      {/* Cylindrical lighting overlay — top-lit, bottom-shadowed */}
      <rect
        x={STREAM_X_START} y={STREAM_Y + 4}
        width={STREAM_LEN} height={STREAM_H - 8}
        rx={(STREAM_H - 8) / 2}
        fill="url(#stack-tube-light)"
        pointerEvents="none"
      />

      {/* Specular highlight along the very top of the tube */}
      <rect
        x={STREAM_X_START + 24} y={STREAM_Y + 5}
        width={STREAM_LEN - 48} height={3}
        rx={1.5}
        fill="rgba(255,255,255,0.42)"
        opacity={0.9}
      />
    </g>
  )
}

/* ─────────── Block body (no entry animation — reused by intro + stack) ───
 * Minimal isometric slab: 3 faces (front + lit top + shadowed right) and
 * a soft ground shadow underneath. Inside, only two abstract motifs:
 *   top   — tiny 3×3 lower-triangular grid (attention)
 *   bottom — three amber bars (FFN)
 * One label: "BLOCK i". The motifs speak for themselves; no extra text.  */
function StackBlockBody({ idx, speed }: { idx: number; speed: number }) {
  const cx = BLOCK_CENTERS[idx]
  const x = cx - BLOCK_W / 2
  const y = BLOCK_Y
  const w = BLOCK_W
  const h = BLOCK_H
  const d = BLOCK_DEPTH

  const color = blockColor(idx)
  const dimColor = blockColor(idx, 60, 55, 0.65)
  const fillFront = blockColor(idx, 70, 50, 0.12)
  const fillTop = blockColor(idx, 70, 65, 0.26)   // lit face — brighter
  const fillRight = blockColor(idx, 70, 35, 0.14) // shadowed face — darker
  const halfY = y + h / 2

  // Polygon points for the 3D faces (depth offset goes up-and-right)
  const topFace = `${x},${y} ${x + w},${y} ${x + w + d},${y - d} ${x + d},${y - d}`
  const rightFace = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`

  return (
    <g>
      {/* Ground shadow — drawn first so block sits on it */}
      <ellipse
        cx={cx + d / 2} cy={y + h + 18}
        rx={w * 0.46} ry={7}
        fill="rgba(0,0,0,0.5)"
        filter="url(#stack-shadow)" />

      {/* Right face (in shadow) */}
      <polygon points={rightFace}
        fill={fillRight}
        stroke={dimColor}
        strokeWidth={1}
        strokeOpacity={0.55} />

      {/* Top face (lit) */}
      <polygon points={topFace}
        fill={fillTop}
        stroke={dimColor}
        strokeWidth={1}
        strokeOpacity={0.55} />

      {/* Front face */}
      <rect x={x} y={y} width={w} height={h} rx={2}
        fill={fillFront}
        stroke={dimColor}
        strokeWidth={1.6} />

      {/* Subtle top-edge highlight */}
      <line x1={x + 4} x2={x + w - 4}
        y1={y + 2} y2={y + 2}
        stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />

      {/* Block label — only text in the block */}
      <text x={cx} y={y + 30} textAnchor="middle"
        fontSize="13" fontFamily="var(--font-mono)"
        fill={color} letterSpacing="0.26em">
        BLOCK {idx}
      </text>

      {/* Attention motif — minimal 3×3 lower-triangular (6 cells) */}
      {Array.from({ length: 3 }).map((_, q) =>
        Array.from({ length: 3 }).map((_, k) => {
          if (k > q) return null
          const cellSize = 18
          const startX = cx - 1.5 * cellSize
          return (
            <motion.rect
              key={`attn-${idx}-${q}-${k}`}
              x={startX + k * cellSize}
              y={y + 76 + q * cellSize}
              width={cellSize - 2}
              height={cellSize - 2}
              rx={2}
              fill={color}
              initial={{ opacity: 0.28 }}
              animate={{ opacity: [0.28, 0.9, 0.28] }}
              transition={{
                duration: 1.8 / speed,
                delay: (idx * 0.08 + q * 0.06 + k * 0.05) / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )
        })
      )}

      {/* Mid divider — very subtle visual separator */}
      <line x1={x + 28} x2={x + w - 28}
        y1={halfY + 6} y2={halfY + 6}
        stroke={ACCENT.rule} strokeWidth={0.6} strokeDasharray="2,3" />

      {/* FFN motif — minimal 3 amber bars */}
      {Array.from({ length: 3 }).map((_, bi) => {
        const barW = 22
        const gap = 8
        const totalW = 3 * barW + 2 * gap
        const barX = cx - totalW / 2 + bi * (barW + gap)
        return (
          <motion.rect
            key={`ffn-${idx}-${bi}`}
            x={barX}
            y={halfY + 52}
            width={barW}
            rx={2}
            fill={ACCENT.amber}
            initial={{ height: 26, opacity: 0.32 }}
            animate={{ height: [26, 70, 26], opacity: [0.32, 0.9, 0.32] }}
            transition={{
              duration: 1.6 / speed,
              delay: (idx * 0.1 + bi * 0.09) / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </g>
  )
}

/* ─────────── Per-block "lights up" halo — only fires in climbing phase ─── */
function StackBlockHighlight({ idx, speed }: { idx: number; speed: number }) {
  const cx = BLOCK_CENTERS[idx]
  const x = cx - BLOCK_W / 2
  const y = BLOCK_Y
  const w = BLOCK_W
  const h = BLOCK_H
  const d = BLOCK_DEPTH

  const blockOffsetT = (cx - STREAM_X_START) / STREAM_LEN
  const arrivalDelay = blockOffsetT * HERO_DURATION
  const color = blockColor(idx)

  return (
    <motion.rect
      x={x - 6} y={y - d - 6}
      width={w + d + 12} height={h + d + 12}
      rx={6}
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      filter="url(#stack-glow)"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.95, 0] }}
      transition={{
        duration: 0.95 / speed,
        delay: arrivalDelay / speed,
        repeat: Infinity,
        repeatDelay: (HERO_DURATION - 0.95) / speed,
        ease: 'easeOut',
      }}
    />
  )
}

/* ─────────── One block in the stack — wraps body with stagger entry ─────────── */
function StackBlock({ idx, phase, speed }: { idx: number; phase: number; speed: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 / speed, delay: (idx * 0.12) / speed }}
    >
      <StackBlockBody idx={idx} speed={speed} />
    </motion.g>
  )
}

/* ─────────── Delta injection: dashed stem from block bottom into stream ───
 * Connector stem and "+Δi" label are always visible (dim in orient phase,
 * stronger in climbing). The pulse landing on the stream only fires in the
 * climbing phase, synchronized with hero pulse arrival. */
function StackDeltaInjection({
  idx, phase, speed,
}: { idx: number; phase: number; speed: number }) {
  const cx = BLOCK_CENTERS[idx]
  const fromY = BLOCK_BOTTOM + 2
  const toY = STREAM_Y + 2
  const blockOffsetT = (cx - STREAM_X_START) / STREAM_LEN
  const arrivalDelay = blockOffsetT * HERO_DURATION
  const stemOpacity = phase === 1 ? 0.6 : 0.28
  const labelOpacity = phase === 1 ? 1 : 0.55

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

      {/* Delta pulse landing on the stream — only fires in CLIMBING phase */}
      {phase === 1 && (
        <motion.circle
          cx={cx} cy={STREAM_Y + STREAM_H / 2}
          r={6}
          fill={ACCENT.amber}
          filter="url(#stack-glow)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.8, 0.5],
          }}
          transition={{
            duration: 0.95 / speed,
            delay: arrivalDelay / speed,
            repeat: Infinity,
            repeatDelay: (HERO_DURATION - 0.95) / speed,
            ease: 'easeOut',
          }}
        />
      )}

      {/* "+Δi" label below stream */}
      <motion.text
        x={cx} y={STREAM_Y + STREAM_H + 22}
        textAnchor="middle"
        fontSize="12" fontFamily="var(--font-mono)"
        fill={ACCENT.amber}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: labelOpacity }}
        transition={{ duration: 0.4 / speed }}
      >
        +Δ{idx}
      </motion.text>
    </g>
  )
}

/* ─────────── Hero pulse: bright orb climbing the stream, visibly enriching ─
 * Color-shifts from cyan (start) through blue and violet to magenta (end),
 * and grows slightly with each delta merge so the eye reads the signal as
 * accumulating refinements as it climbs. */
function StackHeroPulse({ speed }: { speed: number }) {
  const cyY = STREAM_Y + STREAM_H / 2
  return (
    <g>
      {/* Trailing soft glow */}
      <motion.circle
        r={6}
        filter="url(#stack-glow)"
        initial={{ cx: STREAM_X_START, cy: cyY, opacity: 0 }}
        animate={{
          cx: [STREAM_X_START, STREAM_X_END],
          opacity: [0, 0.5, 0.55, 0.6, 0.65, 0.7, 0],
          fill: [
            'rgba(34,211,238,0.6)',
            'rgba(96,165,250,0.65)',
            'rgba(96,165,250,0.7)',
            'rgba(167,139,250,0.7)',
            'rgba(236,72,153,0.7)',
            'rgba(236,72,153,0.7)',
            'rgba(236,72,153,0)',
          ],
        }}
        transition={{
          duration: HERO_DURATION / speed,
          delay: 0.22 / speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Hero orb — bright, color-shifts cyan→magenta, grows with each Δ merge */}
      <motion.circle
        r={9}
        filter="url(#stack-bloom)"
        initial={{ cx: STREAM_X_START, cy: cyY, opacity: 0, scale: 0.8 }}
        animate={{
          cx: [STREAM_X_START, STREAM_X_END],
          opacity: [0, 1, 1, 1, 1, 1, 0],
          scale: [0.85, 1.0, 1.1, 1.2, 1.3, 1.42, 1.5],
          fill: [
            'rgba(180,235,255,1)',
            'rgba(120,210,255,1)',
            'rgba(96,165,250,1)',
            'rgba(140,150,250,1)',
            'rgba(180,140,240,1)',
            'rgba(220,110,200,1)',
            'rgba(236,72,153,1)',
          ],
        }}
        transition={{
          duration: HERO_DURATION / speed,
          repeat: Infinity,
          ease: 'linear',
          times: [0, 0.04, 0.22, 0.42, 0.62, 0.82, 1],
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

/* ─────────── Bottom payoff: clean editorial text, no panel border ─────── */
function StackPayoff({ phase }: { phase: number }) {
  return (
    <g>
      {/* Italic caption */}
      <text x={700} y={742} textAnchor="middle"
        fontSize="22" fontFamily="var(--font-display)"
        fontStyle="italic" fill="rgba(255,255,255,0.95)">
        every block <tspan fill={ACCENT.amber}>adds</tspan> to the stream — never overwrites
      </text>
      {/* Equation */}
      <text x={700} y={790} textAnchor="middle"
        fontSize="30" fontFamily="var(--font-mono)"
        fill={ACCENT.cyan}>
        x ← x + block(x)
      </text>
      {/* Tiny helper line */}
      <text x={700} y={822} textAnchor="middle"
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

/* =========================================================================
 * Scene 18 — sample: "Pick the next character."
 *
 * One continuous transformation pipeline, phase-gated by emphasis only —
 * every stage is mounted always, so the eye reads:
 *
 *   token strip (last position highlighted)
 *        │
 *        ▼
 *   hidden state vector  ──×──  W_out  ──→  logits  ──softmax──  bars
 *                                                                  │
 *                                                                  ▼
 *                                                              sample
 *                                                                  │
 *                                                                  ▼
 *                                                       appended to strip
 *
 * Phase 1 — EXTRACT: highlight last position, hidden state visible
 * Phase 2 — PROJECT: W_out and logits column light up
 * Phase 3 — SOFTMAX + TEMP: bars dominate, slider becomes interactive
 * Phase 4 — SAMPLE + APPEND: char flies up to next slot in token strip
 * ====================================================================== */

const SAMPLE_PROMPT = 'to be or no'                               // 11 chars
const SAMPLE_LAST_IDX = SAMPLE_PROMPT.length - 1                  // 10
const SAMPLE_CHARS = ['t', ' ', 'w', 'n', 'b', 'p', 's', 'c', 'd', 'r', 'm', 'l']
const SAMPLE_LOGITS = [4.5, 3.6, 2.8, 2.2, 1.9, 1.4, 1.1, 0.7, 0.5, 0.2, -0.1, -0.3]

const COL_HIDDEN = ACCENT.cyan
const COL_WOUT = ACCENT.amber
const COL_LOGIT = ACCENT.blue
const COL_SAMPLED = ACCENT.red

const SAMPLE_TOKEN_CELL_W = 56
const SAMPLE_TOKEN_CELL_H = 46
const SAMPLE_TOKEN_GAP = 4
const SAMPLE_TOKEN_COUNT = 12
const SAMPLE_TOKEN_TOTAL_W =
  SAMPLE_TOKEN_COUNT * SAMPLE_TOKEN_CELL_W + (SAMPLE_TOKEN_COUNT - 1) * SAMPLE_TOKEN_GAP
const SAMPLE_TOKEN_X = (1400 - SAMPLE_TOKEN_TOTAL_W) / 2
const SAMPLE_TOKEN_Y = 168

const SAMPLE_PIPELINE_Y_TOP = 290
const SAMPLE_PIPELINE_Y_BOTTOM = 700

const SAMPLE_HID_X = 70
const SAMPLE_HID_W = 70
const SAMPLE_HID_Y = SAMPLE_PIPELINE_Y_TOP
const SAMPLE_HID_CELLS = 16
const SAMPLE_HID_CELL_H = (SAMPLE_PIPELINE_Y_BOTTOM - SAMPLE_HID_Y) / SAMPLE_HID_CELLS

const SAMPLE_WOUT_X = 200
const SAMPLE_WOUT_W = 180
const SAMPLE_WOUT_Y = 320
const SAMPLE_WOUT_H = 380

const SAMPLE_LOGITS_X = 440
const SAMPLE_LOGITS_W = 80
const SAMPLE_LOGITS_Y = 304
const SAMPLE_LOGITS_ROW_H = 32

const SAMPLE_BARS_X = 580
const SAMPLE_BARS_W = 540
const SAMPLE_BARS_Y = 304
const SAMPLE_BARS_ROW_H = 32
const SAMPLE_BARS_LABEL_W = 40

const SAMPLE_BOX_X = 1180
const SAMPLE_BOX_W = 160
const SAMPLE_BOX_Y = 410
const SAMPLE_BOX_H = 160

export function VizSample() {
  const speed = useSpeed()

  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5200 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const [temp, setTemp] = useState(1.0)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (touched) return
    const start = performance.now()
    const SWEEP_DURATION = 14
    let frame = 0
    const loop = () => {
      const t = (performance.now() - start) / 1000
      if (t >= SWEEP_DURATION) {
        setTemp(0.85)
        return
      }
      const phase01 = (Math.sin(t * 0.7) + 1) / 2
      setTemp(+(0.4 + phase01 * 1.4).toFixed(2))
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [touched])

  const scaled = SAMPLE_LOGITS.map((x) => x / temp)
  const max = Math.max(...scaled)
  const exps = scaled.map((x) => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  const probs = exps.map((e) => e / sum)
  const entropy = probs.reduce((a, p) => a + (p > 0 ? -p * Math.log2(p) : 0), 0)
  const maxProb = Math.max(...probs)

  const [sampled, setSampled] = useState(0)
  useEffect(() => {
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
    }, 1500 / speed)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temp, speed])

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="sample-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="sample-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          ACT III · OUTPUT · NEXT-TOKEN PICK
        </text>
        <text x={700} y={92} textAnchor="middle"
          fontSize="22" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.95)">
          one vector → one distribution → one new character
        </text>
        <text x={700} y={120} textAnchor="middle"
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.08em">
          only the last position's hidden state is used to pick the next token
        </text>

        <SampleTokenStrip sampledChar={SAMPLE_CHARS[sampled]} phase={phase} speed={speed} />
        <SampleHiddenState phase={phase} speed={speed} />
        <SampleWOutMatrix phase={phase} speed={speed} />
        <SampleLogitsColumn phase={phase} speed={speed} />
        <SampleProbBars probs={probs} sampledIdx={sampled} temp={temp} phase={phase} speed={speed} />
        <SampleBox char={SAMPLE_CHARS[sampled]} phase={phase} speed={speed} />
        <SamplePipelineArrows phase={phase} speed={speed} />
        <SampleAppendArc phase={phase} speed={speed} />
        <SampleStats temp={temp} entropy={entropy} maxProb={maxProb} />
        <SamplePhaseSummary phase={phase} />
      </svg>

      <SampleTemperatureSlider temp={temp} touched={touched} setTouched={setTouched} setTemp={setTemp} />
    </div>
  )
}

function SampleTokenStrip({
  sampledChar, phase, speed,
}: { sampledChar: string; phase: number; speed: number }) {
  const showAppended = phase === 3
  return (
    <g>
      <text x={SAMPLE_TOKEN_X} y={SAMPLE_TOKEN_Y - 14}
        fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        SEQUENCE ▸
      </text>
      {Array.from({ length: SAMPLE_TOKEN_COUNT }).map((_, i) => {
        const x = SAMPLE_TOKEN_X + i * (SAMPLE_TOKEN_CELL_W + SAMPLE_TOKEN_GAP)
        const isPrompt = i < SAMPLE_PROMPT.length
        const isLast = i === SAMPLE_LAST_IDX
        const isAppendSlot = i === SAMPLE_PROMPT.length
        const ch = isPrompt
          ? SAMPLE_PROMPT[i]
          : isAppendSlot && showAppended
            ? sampledChar
            : ''
        const stroke = isLast
          ? COL_HIDDEN
          : isAppendSlot && showAppended
            ? COL_SAMPLED
            : 'rgba(255,255,255,0.18)'
        const fill = isLast
          ? 'rgba(34,211,238,0.16)'
          : isAppendSlot && showAppended
            ? 'rgba(248,113,113,0.18)'
            : isPrompt
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.015)'
        return (
          <g key={`tok-${i}`}>
            {isLast && (
              <motion.rect
                x={x - 4} y={SAMPLE_TOKEN_Y - 4}
                width={SAMPLE_TOKEN_CELL_W + 8} height={SAMPLE_TOKEN_CELL_H + 8} rx={6}
                fill="none" stroke={COL_HIDDEN} strokeWidth={1.6}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.95, 0.4] }}
                transition={{ duration: 2 / speed, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <rect x={x} y={SAMPLE_TOKEN_Y}
              width={SAMPLE_TOKEN_CELL_W} height={SAMPLE_TOKEN_CELL_H} rx={4}
              fill={fill} stroke={stroke}
              strokeWidth={isLast || (isAppendSlot && showAppended) ? 1.8 : 0.8} />
            <text x={x + SAMPLE_TOKEN_CELL_W / 2}
              y={SAMPLE_TOKEN_Y + SAMPLE_TOKEN_CELL_H / 2 + 8}
              textAnchor="middle"
              fontSize="22" fontFamily="var(--font-display)" fontStyle="italic"
              fill={
                isLast
                  ? COL_HIDDEN
                  : isAppendSlot && showAppended
                    ? COL_SAMPLED
                    : 'rgba(255,255,255,0.85)'
              }>
              {ch === ' ' ? '·' : ch}
            </text>
          </g>
        )
      })}
      {phase === 0 && (
        <motion.text
          x={SAMPLE_TOKEN_X + SAMPLE_LAST_IDX * (SAMPLE_TOKEN_CELL_W + SAMPLE_TOKEN_GAP) + SAMPLE_TOKEN_CELL_W / 2}
          y={SAMPLE_TOKEN_Y + SAMPLE_TOKEN_CELL_H + 22}
          textAnchor="middle"
          fontSize="10" fontFamily="var(--font-mono)" fill={COL_HIDDEN}
          initial={{ opacity: 0, y: SAMPLE_TOKEN_Y + SAMPLE_TOKEN_CELL_H + 28 }}
          animate={{ opacity: 1, y: SAMPLE_TOKEN_Y + SAMPLE_TOKEN_CELL_H + 22 }}
          transition={{ duration: 0.5 / speed, delay: 0.3 / speed }}
        >
          ↑ predict from here
        </motion.text>
      )}
      {showAppended && (
        <motion.text
          x={SAMPLE_TOKEN_X + SAMPLE_PROMPT.length * (SAMPLE_TOKEN_CELL_W + SAMPLE_TOKEN_GAP) + SAMPLE_TOKEN_CELL_W / 2}
          y={SAMPLE_TOKEN_Y - 24}
          textAnchor="middle"
          fontSize="10" fontFamily="var(--font-mono)" fill={COL_SAMPLED}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 / speed, delay: 0.6 / speed }}
        >
          ↓ APPENDED
        </motion.text>
      )}
    </g>
  )
}

function SampleHiddenState({ phase, speed }: { phase: number; speed: number }) {
  const active = phase === 0
  const values = Array.from({ length: SAMPLE_HID_CELLS }).map(
    (_, i) => Math.sin(i * 1.27 + 0.7) * 0.95 + Math.cos(i * 0.42) * 0.25,
  )
  return (
    <g>
      {active && (
        <motion.rect
          x={SAMPLE_HID_X - 6} y={SAMPLE_HID_Y - 6}
          width={SAMPLE_HID_W + 12}
          height={SAMPLE_HID_CELLS * SAMPLE_HID_CELL_H + 12}
          rx={4}
          fill="none" stroke={COL_HIDDEN} strokeWidth={1.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.8 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {values.map((v, i) => {
        const m = Math.max(-1.5, Math.min(1.5, v)) / 1.5
        const fill = m >= 0
          ? `rgba(34,211,238,${0.18 + m * 0.65})`
          : `rgba(248,113,113,${0.18 + -m * 0.5})`
        return (
          <rect key={`hid-${i}`}
            x={SAMPLE_HID_X} y={SAMPLE_HID_Y + i * SAMPLE_HID_CELL_H}
            width={SAMPLE_HID_W} height={SAMPLE_HID_CELL_H - 2} rx={2}
            fill={fill}
            stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />
        )
      })}
      <text x={SAMPLE_HID_X + SAMPLE_HID_W / 2} y={SAMPLE_HID_Y - 14}
        textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_HIDDEN}>
        h<tspan fontSize="10" dy="2">last</tspan>
      </text>
      <text x={SAMPLE_HID_X + SAMPLE_HID_W / 2}
        y={SAMPLE_HID_Y + SAMPLE_HID_CELLS * SAMPLE_HID_CELL_H + 18}
        textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        ∈ R³⁸⁴
      </text>
    </g>
  )
}

function SampleWOutMatrix({ phase, speed }: { phase: number; speed: number }) {
  const active = phase === 1
  const COLS = 12
  const ROWS = 8
  const cellW = SAMPLE_WOUT_W / COLS
  const cellH = SAMPLE_WOUT_H / ROWS
  return (
    <g>
      {active && (
        <motion.rect
          x={SAMPLE_WOUT_X - 8} y={SAMPLE_WOUT_Y - 8}
          width={SAMPLE_WOUT_W + 16} height={SAMPLE_WOUT_H + 16} rx={6}
          fill="none" stroke={COL_WOUT} strokeWidth={1.8}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.95, 0.3] }}
          transition={{ duration: 1.8 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <rect x={SAMPLE_WOUT_X} y={SAMPLE_WOUT_Y}
        width={SAMPLE_WOUT_W} height={SAMPLE_WOUT_H} rx={4}
        fill="rgba(245,158,11,0.04)"
        stroke={`rgba(245,158,11,${active ? 0.55 : 0.30})`} strokeWidth={1.4} />
      {Array.from({ length: ROWS * COLS }).map((_, idx) => {
        const r = Math.floor(idx / COLS)
        const c = idx % COLS
        const v = Math.sin(idx * 1.71) * 0.5 + 0.3
        return (
          <motion.rect
            key={`wout-${idx}`}
            x={SAMPLE_WOUT_X + c * cellW + 1}
            y={SAMPLE_WOUT_Y + r * cellH + 1}
            width={cellW - 2} height={cellH - 2} rx={1}
            fill={`rgba(245,158,11,${0.15 + Math.abs(v) * 0.6})`}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: active ? [0.3, 0.85, 0.3] : 0.4 }}
            transition={{
              duration: 1.6 / speed,
              delay: ((r + c) * 0.04) / speed,
              repeat: active ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
        )
      })}
      <text x={SAMPLE_WOUT_X + SAMPLE_WOUT_W / 2} y={SAMPLE_WOUT_Y - 14}
        textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_WOUT}>
        W<tspan fontSize="10" dy="2">out</tspan>
      </text>
      <text x={SAMPLE_WOUT_X + SAMPLE_WOUT_W / 2} y={SAMPLE_WOUT_Y + SAMPLE_WOUT_H + 18}
        textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        unembedding · 384 → 65
      </text>
    </g>
  )
}

function SampleLogitsColumn({ phase, speed }: { phase: number; speed: number }) {
  const active = phase === 1
  return (
    <g>
      {active && (
        <motion.rect
          x={SAMPLE_LOGITS_X - 6} y={SAMPLE_LOGITS_Y - 6}
          width={SAMPLE_LOGITS_W + 12}
          height={SAMPLE_CHARS.length * SAMPLE_LOGITS_ROW_H + 12} rx={4}
          fill="none" stroke={COL_LOGIT} strokeWidth={1.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.8 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {SAMPLE_CHARS.map((ch, i) => {
        const y = SAMPLE_LOGITS_Y + i * SAMPLE_LOGITS_ROW_H
        const logit = SAMPLE_LOGITS[i]
        const minLogit = -1
        const maxLogit = 5
        const t = (logit - minLogit) / (maxLogit - minLogit)
        const barW = Math.max(0, Math.min(1, t)) * SAMPLE_LOGITS_W
        return (
          <g key={`logit-${i}`}>
            <rect x={SAMPLE_LOGITS_X} y={y + 2}
              width={SAMPLE_LOGITS_W} height={SAMPLE_LOGITS_ROW_H - 4} rx={2}
              fill="rgba(255,255,255,0.025)"
              stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
            <rect x={SAMPLE_LOGITS_X} y={y + 2}
              width={barW} height={SAMPLE_LOGITS_ROW_H - 4} rx={2}
              fill={`rgba(96,165,250,${0.35 + (1 - i / SAMPLE_CHARS.length) * 0.5})`} />
            <text x={SAMPLE_LOGITS_X - 8} y={y + SAMPLE_LOGITS_ROW_H / 2 + 4}
              textAnchor="end"
              fontSize="11" fontFamily="var(--font-mono)" fontStyle="italic"
              fill={ACCENT.dim}>
              {ch === ' ' ? '·' : ch}
            </text>
          </g>
        )
      })}
      <text x={SAMPLE_LOGITS_X + SAMPLE_LOGITS_W / 2} y={SAMPLE_LOGITS_Y - 14}
        textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_LOGIT}>
        logits
      </text>
      <text x={SAMPLE_LOGITS_X + SAMPLE_LOGITS_W / 2}
        y={SAMPLE_LOGITS_Y + SAMPLE_CHARS.length * SAMPLE_LOGITS_ROW_H + 18}
        textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        65 raw scores
      </text>
    </g>
  )
}

function SampleProbBars({
  probs, sampledIdx, temp, phase, speed,
}: {
  probs: number[]
  sampledIdx: number
  temp: number
  phase: number
  speed: number
}) {
  const active = phase === 2 || phase === 3
  const trackX = SAMPLE_BARS_X + SAMPLE_BARS_LABEL_W
  const trackW = SAMPLE_BARS_W - SAMPLE_BARS_LABEL_W - 60
  const totalH = probs.length * SAMPLE_BARS_ROW_H
  return (
    <g>
      {active && (
        <motion.rect
          x={SAMPLE_BARS_X - 6} y={SAMPLE_BARS_Y - 6}
          width={SAMPLE_BARS_W + 12} height={totalH + 12} rx={4}
          fill="none" stroke={phase === 3 ? COL_SAMPLED : ACCENT.amber} strokeWidth={1.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.8 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {SAMPLE_CHARS.map((ch, i) => {
        const y = SAMPLE_BARS_Y + i * SAMPLE_BARS_ROW_H
        const p = probs[i]
        const barW = trackW * p
        const isSampled = i === sampledIdx
        return (
          <g key={`bar-${i}`}>
            <text x={SAMPLE_BARS_X + SAMPLE_BARS_LABEL_W - 10}
              y={y + SAMPLE_BARS_ROW_H / 2 + 4}
              textAnchor="end"
              fontSize="13" fontFamily="var(--font-mono)" fontStyle="italic"
              fill={isSampled ? COL_SAMPLED : 'rgba(255,255,255,0.7)'}>
              {ch === ' ' ? '·' : ch}
            </text>
            <rect x={trackX} y={y + 4}
              width={trackW} height={SAMPLE_BARS_ROW_H - 8} rx={2}
              fill="rgba(255,255,255,0.025)"
              stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />
            <motion.rect
              x={trackX} y={y + 4}
              height={SAMPLE_BARS_ROW_H - 8} rx={2}
              fill={isSampled ? COL_SAMPLED : `rgba(96,165,250,${0.45 + p * 0.45})`}
              filter={isSampled ? 'url(#sample-glow)' : undefined}
              animate={{ width: barW }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            />
            <text x={trackX + barW + 8} y={y + SAMPLE_BARS_ROW_H / 2 + 4}
              fontSize="11" fontFamily="var(--font-mono)"
              fill={isSampled ? COL_SAMPLED : ACCENT.dim}>
              {(p * 100).toFixed(1)}%
            </text>
            {isSampled && (
              <motion.rect
                x={trackX - 4} y={y}
                width={trackW + 8} height={SAMPLE_BARS_ROW_H} rx={3}
                fill="none" stroke={COL_SAMPLED} strokeWidth={1.4}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.85, 0.3] }}
                transition={{ duration: 0.7 / speed, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </g>
        )
      })}
      <text x={SAMPLE_BARS_X + SAMPLE_BARS_W / 2} y={SAMPLE_BARS_Y - 14}
        textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={phase === 3 ? COL_SAMPLED : ACCENT.amber}>
        softmax(logits / T)
      </text>
      <text x={SAMPLE_BARS_X + SAMPLE_BARS_W / 2}
        y={SAMPLE_BARS_Y + totalH + 18}
        textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        T = {temp.toFixed(2)}  ·  one row gets sampled
      </text>
    </g>
  )
}

function SampleBox({
  char, phase, speed,
}: { char: string; phase: number; speed: number }) {
  const active = phase === 3
  return (
    <g>
      <motion.rect
        x={SAMPLE_BOX_X} y={SAMPLE_BOX_Y}
        width={SAMPLE_BOX_W} height={SAMPLE_BOX_H} rx={8}
        fill="rgba(248,113,113,0.10)"
        stroke={COL_SAMPLED}
        strokeWidth={active ? 2.2 : 1.4}
        filter={active ? 'url(#sample-glow)' : undefined}
        animate={{ strokeOpacity: active ? [0.6, 1, 0.6] : 0.55 }}
        transition={{ duration: 1.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
      />
      <text x={SAMPLE_BOX_X + SAMPLE_BOX_W / 2} y={SAMPLE_BOX_Y - 12}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        DIE ROLL ▸ SAMPLED
      </text>
      <AnimatePresence mode="wait">
        <motion.text
          key={char}
          x={SAMPLE_BOX_X + SAMPLE_BOX_W / 2}
          y={SAMPLE_BOX_Y + SAMPLE_BOX_H / 2 + 28}
          textAnchor="middle"
          fontSize="84" fontFamily="var(--font-display)" fontStyle="italic"
          fill={COL_SAMPLED}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.3 }}
          transition={{ duration: 0.3 / speed }}
        >
          {char === ' ' ? '·' : char}
        </motion.text>
      </AnimatePresence>
    </g>
  )
}

function SamplePipelineArrows({ phase, speed }: { phase: number; speed: number }) {
  const arrows = [
    { key: 'a1', label: '× W_out', x1: SAMPLE_HID_X + SAMPLE_HID_W, x2: SAMPLE_WOUT_X, activeAt: 1, color: COL_WOUT },
    { key: 'a2', label: '=', x1: SAMPLE_WOUT_X + SAMPLE_WOUT_W, x2: SAMPLE_LOGITS_X, activeAt: 1, color: COL_LOGIT },
    { key: 'a3', label: 'softmax', x1: SAMPLE_LOGITS_X + SAMPLE_LOGITS_W, x2: SAMPLE_BARS_X + SAMPLE_BARS_LABEL_W, activeAt: 2, color: ACCENT.amber },
    { key: 'a4', label: 'sample', x1: SAMPLE_BARS_X + SAMPLE_BARS_W - 60, x2: SAMPLE_BOX_X, activeAt: 3, color: COL_SAMPLED },
  ]
  const cy = 490
  return (
    <g>
      {arrows.map((a) => {
        const isActive = a.activeAt === phase
        const opacity = isActive ? 1 : 0.4
        return (
          <g key={a.key} opacity={opacity}>
            <motion.line
              x1={a.x1 + 4} x2={a.x2 - 4}
              y1={cy} y2={cy}
              stroke={a.color}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? '0' : '4,4'}
              animate={{ opacity: isActive ? [0.5, 1, 0.5] : 0.4 }}
              transition={{ duration: 1.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
            />
            <path
              d={`M ${a.x2 - 10} ${cy - 5} L ${a.x2 - 4} ${cy} L ${a.x2 - 10} ${cy + 5}`}
              stroke={a.color} strokeWidth={isActive ? 2 : 1} fill="none" />
            <text x={(a.x1 + a.x2) / 2} y={cy - 10}
              textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)" fontStyle="italic"
              fill={a.color}>
              {a.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function SampleAppendArc({ phase, speed }: { phase: number; speed: number }) {
  if (phase !== 3) return null
  const fromX = SAMPLE_BOX_X + SAMPLE_BOX_W / 2
  const fromY = SAMPLE_BOX_Y
  const toX =
    SAMPLE_TOKEN_X +
    SAMPLE_PROMPT.length * (SAMPLE_TOKEN_CELL_W + SAMPLE_TOKEN_GAP) +
    SAMPLE_TOKEN_CELL_W / 2
  const toY = SAMPLE_TOKEN_Y + SAMPLE_TOKEN_CELL_H + 4
  const ctrlX = (fromX + toX) / 2 + 80
  const ctrlY = 280
  return (
    <g>
      <motion.path
        d={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY}, ${toX} ${toY}`}
        stroke={COL_SAMPLED}
        strokeWidth={1.8}
        fill="none"
        strokeDasharray="4,4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.85, 0.85] }}
        transition={{
          pathLength: { duration: 1.0 / speed, ease: 'easeInOut' },
          opacity: { duration: 1.2 / speed },
        }}
      />
      <motion.path
        d={`M ${toX - 6} ${toY - 8} L ${toX} ${toY - 2} L ${toX + 6} ${toY - 8}`}
        stroke={COL_SAMPLED} strokeWidth={1.8} fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 / speed, delay: 0.9 / speed }}
      />
      <motion.circle
        r={5}
        fill={COL_SAMPLED}
        filter="url(#sample-glow)"
        initial={{ cx: fromX, cy: fromY, opacity: 0 }}
        animate={{
          cx: [fromX, ctrlX, toX],
          cy: [fromY, ctrlY, toY],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.0 / speed,
          delay: 0.3 / speed,
          repeat: Infinity,
          repeatDelay: 0.4 / speed,
          ease: 'easeInOut',
        }}
      />
      <text x={(fromX + toX) / 2 - 80} y={ctrlY - 8}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fontStyle="italic"
        fill={COL_SAMPLED}>
        append → run model again
      </text>
    </g>
  )
}

function SampleStats({
  temp, entropy, maxProb,
}: { temp: number; entropy: number; maxProb: number }) {
  const chips = [
    { label: 'T', value: temp.toFixed(2), color: ACCENT.amber },
    { label: 'top prob', value: `${(maxProb * 100).toFixed(1)}%`, color: COL_LOGIT },
    { label: 'entropy', value: `${entropy.toFixed(2)} bits`, color: ACCENT.mint },
    { label: 'vocab', value: '12 / 65', color: ACCENT.dim },
  ]
  return (
    <g transform="translate(700, 770)">
      {chips.map((c, i) => {
        const w = 200
        const x = (i - chips.length / 2 + 0.5) * w
        return (
          <g key={`chip-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 8} y={-18} width={w - 16} height={36} rx={6}
              fill="rgba(255,255,255,0.025)"
              stroke="rgba(255,255,255,0.10)" strokeWidth={0.8} />
            <text x={-w / 2 + 18} y={-2}
              fontSize="9" fontFamily="var(--font-mono)"
              fill={ACCENT.dim} letterSpacing="0.18em">
              {c.label.toUpperCase()}
            </text>
            <text x={w / 2 - 18} y={6} textAnchor="end"
              fontSize="14" fontFamily="var(--font-mono)"
              fill={c.color}>
              {c.value}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function SamplePhaseSummary({ phase }: { phase: number }) {
  const beats = [
    'extract last hidden state',
    'project through W_out',
    'softmax + temperature',
    'sample + append',
  ]
  return (
    <g transform="translate(700, 950)">
      {beats.map((b, i) => {
        const w = 300
        const x = (i - beats.length / 2 + 0.5) * w
        const active = i === phase
        return (
          <g key={`samp-sum-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 12} y={-14} width={w - 24} height={28} rx={14}
              fill={active ? 'rgba(248,113,113,0.18)' : 'transparent'}
              stroke={active ? COL_SAMPLED : ACCENT.rule}
              strokeWidth={active ? 1.5 : 1} />
            <text x={0} y={4} textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)"
              fill={active ? COL_SAMPLED : ACCENT.dim}
              letterSpacing="0.16em">
              {(i + 1)}.{b.toUpperCase()}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function SampleTemperatureSlider({
  temp, touched, setTouched, setTemp,
}: {
  temp: number
  touched: boolean
  setTouched: (b: boolean) => void
  setTemp: (n: number) => void
}) {
  return (
    <div className="absolute bottom-4 left-1/2 z-10 w-[420px] -translate-x-1/2 rounded-[2px] border border-[rgba(255,255,255,0.12)] bg-[rgba(7,7,9,0.85)] px-4 py-2.5 backdrop-blur-md mono text-[11px]">
      <div className="flex items-center gap-3">
        <span className="small-caps text-[var(--fg-dim)]">temperature</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.02}
          value={temp}
          onChange={(e) => {
            setTouched(true)
            setTemp(parseFloat(e.target.value))
          }}
          className="flex-1 accent-[var(--accent-amber)]"
        />
        <span className="tabular w-12 text-right text-[var(--fg)]">{temp.toFixed(2)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[9px] text-[var(--fg-dim)]">
        <span>drag me</span>
        <span>{touched ? 'user override · drag further' : 'auto-sweeping'}</span>
      </div>
    </div>
  )
}

export function SampleSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const phaseLabels = [
    'extract last hidden state',
    'project through W_out',
    'softmax + temperature',
    'sample + append',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5200 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      Generation is autoregressive. Only the <em>last</em> position's hidden
      state predicts the next token — every other column has already done its
      job.
    </>,
    <>
      Multiply h<sub>last</sub> by W<sub>out</sub> — the unembedding matrix —
      to get one raw <em>logit</em> per vocabulary entry.
    </>,
    <>
      Softmax turns logits into a probability distribution. Temperature scales
      the logits first: low T sharpens, high T flattens. Drag the slider.
    </>,
    <>
      Sample one token from the distribution, append it to the sequence,
      then run the model again with the new last position.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'one vector to predict from',
      body: <>h<sub>last</sub> = stack_top[last position] ∈ R³⁸⁴</>,
    },
    {
      label: 'unembedding',
      body: <>logits = W<sub>out</sub> · h<sub>last</sub>  ·  R³⁸⁴ → R⁶⁵</>,
    },
    {
      label: 'softmax with temperature',
      body: <>p = softmax(logits / T)</>,
    },
    {
      label: 'sample + append',
      body: <>token ~ Categorical(p)  ·  seq.append(token)</>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'During training every position predicts in parallel; during generation we only need the last. The hidden states for prior positions stay in the KV cache (next scene).',
    'W_out is shape (d × V) = (384 × 65) for this tiny model. Some models (e.g. GPT-2) tie this matrix to the input embedding to save parameters.',
    'T = 1 means trust the distribution as-is. T → 0 collapses to argmax (greedy). T > 1 flattens — more random, more diverse, more creative.',
    'After the token is sampled it gets appended to the sequence and the whole forward pass runs again. That\'s autoregressive generation.',
  ]

  return (
    <SplitPaneScene
      viz={<VizSample />}
      text={{
        kicker: 'ACT III · OUTPUT',
        title: 'Pick the next character.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.amber,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={COL_SAMPLED}
          />
        ),
        stats: [
          { label: 'd_model', value: '384', color: COL_HIDDEN },
          { label: 'vocab · V', value: '65', color: COL_WOUT },
          { label: 'this scene', value: 'top 12 shown' },
          { label: 'generation', value: 'autoregressive' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 19 — kvcache: "One new row per step."
 *
 * Three-zone layout that makes the mechanism literal:
 *
 *   token strip (current token highlighted)
 *        │
 *        ▼
 *   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
 *   │  fresh Q    │ →  │   K CACHE    │    │   V CACHE    │
 *   │ (this step  │    │ past rows    │    │ past rows    │
 *   │  only —     │    │ dim          │    │ dim          │
 *   │  not stored)│    │ NEW row      │    │ NEW row      │
 *   └─────────────┘    │ amber        │    │ amber        │
 *                      │ future empty │    │ future empty │
 *                      └──────────────┘    └──────────────┘
 *
 * Phase 1 — ARRIVE: token highlighted, cache state shown
 * Phase 2 — FRESH Q: Q card materializes from current token
 * Phase 3 — APPEND K/V: new rows fade-in with amber pulse on each cache
 * Phase 4 — REUSE: dashed lines from Q to ALL cached K rows; values pulled
 *
 * Step advances when phase wraps from 3 → 0. Cache fills from row 0.
 * ====================================================================== */

const KV_SEQ = ['t', 'o', ' ', 'b', 'e', ' ', 'o', 'r', ' ', 'n', 'o', 't']
const KV_MAX_STEP = KV_SEQ.length - 1
const KV_D_K = 20

const COL_KV_Q = ACCENT.cyan
const COL_KV_K = ACCENT.blue
const COL_KV_V = ACCENT.violet
const COL_KV_NEW = ACCENT.amber

// Token strip
const KV_TOK_X = (1400 - (12 * 60 + 11 * 4)) / 2  // 358
const KV_TOK_Y = 168
const KV_TOK_W = 60
const KV_TOK_H = 50

// Fresh Q card
const KV_Q_X = 70
const KV_Q_Y = 320
const KV_Q_W = 200
const KV_Q_H = 320
const KV_Q_CELLS = 8
const KV_Q_CELL_H = 24

// K cache matrix
const KV_K_X = 320
const KV_K_Y = 320
const KV_K_W = 460
const KV_K_H = 372
const KV_K_CELL_W = KV_K_W / KV_D_K  // 23
const KV_K_ROW_H = KV_K_H / KV_SEQ.length  // 31

// V cache matrix
const KV_V_X = 820
const KV_V_Y = KV_K_Y
const KV_V_W = KV_K_W
const KV_V_H = KV_K_H
const KV_V_CELL_W = KV_K_CELL_W
const KV_V_ROW_H = KV_K_ROW_H

function kvKValue(row: number, col: number): number {
  return Math.sin(row * 1.71 + col * 0.43) * 0.9 + Math.cos(row * 0.6 + col) * 0.3
}
function kvVValue(row: number, col: number): number {
  return Math.sin(row * 0.93 + col * 1.21 + 1.5) * 0.9 + Math.cos(row * 0.4 + col * 0.7) * 0.3
}
function kvQValue(step: number, i: number): number {
  return Math.sin(i * 1.31 + step * 0.7) * 0.9 + Math.cos(i * 0.42 + step * 0.41) * 0.3
}

function kvCellColor(v: number, baseHue: 'blue' | 'violet'): string {
  const m = Math.max(-1, Math.min(1, v))
  if (m >= 0) {
    return baseHue === 'blue'
      ? `rgba(96,165,250,${0.18 + m * 0.62})`
      : `rgba(167,139,250,${0.18 + m * 0.62})`
  }
  return `rgba(248,113,113,${0.18 + -m * 0.55})`
}

export function VizKVCache() {
  const speed = useSpeed()

  // 4 phases. Step advances when phase wraps to 0.
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => {
        const np = (p + 1) % PHASES
        if (np === 0) {
          setStep((s) => (s + 1 > KV_MAX_STEP ? 0 : s + 1))
        }
        return np
      })
    }, 1500 / speed)
    return () => clearInterval(id)
  }, [speed])

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="kv-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="kv-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          ACT III · OUTPUT · KV CACHE · ONE NEW ROW PER STEP
        </text>

        <text x={700} y={92} textAnchor="middle"
          fontSize="22" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.95)">
          recompute Q · reuse K · reuse V
        </text>
        <text x={700} y={120} textAnchor="middle"
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.08em">
          fresh Q for the new token only · K and V rows are appended once and reused forever
        </text>

        {/* Token strip */}
        <KVTokenStrip step={step} />

        {/* Fresh Q card (left) — ephemeral */}
        <KVFreshQ step={step} phase={phase} speed={speed} />

        {/* K cache matrix (center) */}
        <KVCacheMatrix
          which="K"
          x={KV_K_X} y={KV_K_Y} w={KV_K_W} h={KV_K_H}
          cellW={KV_K_CELL_W} rowH={KV_K_ROW_H}
          step={step} phase={phase} speed={speed} />

        {/* V cache matrix (right) */}
        <KVCacheMatrix
          which="V"
          x={KV_V_X} y={KV_V_Y} w={KV_V_W} h={KV_V_H}
          cellW={KV_V_CELL_W} rowH={KV_V_ROW_H}
          step={step} phase={phase} speed={speed} />

        {/* Reuse arrows: Q → cached K rows (only in phase 3) */}
        <KVReuseArrows step={step} phase={phase} speed={speed} />

        {/* Append connectors: Q → new K row, Q → new V row (only in phase 2) */}
        <KVAppendConnectors step={step} phase={phase} speed={speed} />

        {/* Bottom payoff counter */}
        <KVPayoff step={step} />

        {/* Phase summary */}
        <KVPhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── Token strip — current token amber, past dim, future invisible ─── */
function KVTokenStrip({ step }: { step: number }) {
  return (
    <g>
      <text x={KV_TOK_X} y={KV_TOK_Y - 14}
        fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        SEQUENCE ▸  STEP {step + 1} / {KV_SEQ.length}
      </text>
      {KV_SEQ.map((ch, i) => {
        const x = KV_TOK_X + i * (KV_TOK_W + 4)
        const isCurrent = i === step
        const isPast = i < step
        const fill = isCurrent
          ? 'rgba(245,158,11,0.22)'
          : isPast
            ? 'rgba(96,165,250,0.10)'
            : 'rgba(255,255,255,0.015)'
        const stroke = isCurrent
          ? COL_KV_NEW
          : isPast
            ? COL_KV_K
            : 'rgba(255,255,255,0.10)'
        const textColor = isCurrent
          ? COL_KV_NEW
          : isPast
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.30)'
        return (
          <g key={`kv-tok-${i}`}>
            {isCurrent && (
              <motion.rect
                x={x - 4} y={KV_TOK_Y - 4}
                width={KV_TOK_W + 8} height={KV_TOK_H + 8} rx={6}
                fill="none" stroke={COL_KV_NEW} strokeWidth={1.8}
                filter="url(#kv-glow)"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <rect x={x} y={KV_TOK_Y}
              width={KV_TOK_W} height={KV_TOK_H} rx={4}
              fill={fill} stroke={stroke}
              strokeWidth={isCurrent ? 2 : isPast ? 1 : 0.6} />
            <text x={x + KV_TOK_W / 2} y={KV_TOK_Y + KV_TOK_H / 2 + 8}
              textAnchor="middle"
              fontSize="22" fontFamily="var(--font-display)" fontStyle="italic"
              fill={textColor}>
              {ch === ' ' ? '·' : ch}
            </text>
          </g>
        )
      })}
      {/* "current token" caption */}
      <motion.text
        x={KV_TOK_X + step * (KV_TOK_W + 4) + KV_TOK_W / 2}
        y={KV_TOK_Y + KV_TOK_H + 24}
        textAnchor="middle"
        fontSize="10" fontFamily="var(--font-mono)" fill={COL_KV_NEW}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        ↑ current token
      </motion.text>
    </g>
  )
}

/* ─────────── Fresh Q card — ephemeral, cyan, dashed border ─────────── */
function KVFreshQ({
  step, phase, speed,
}: { step: number; phase: number; speed: number }) {
  const active = phase === 1
  const computed = phase >= 1
  const cellX = KV_Q_X + (KV_Q_W - 50) / 2
  return (
    <g>
      {/* Card */}
      <motion.rect
        x={KV_Q_X} y={KV_Q_Y} width={KV_Q_W} height={KV_Q_H} rx={8}
        fill="rgba(34,211,238,0.04)"
        stroke={COL_KV_Q}
        strokeWidth={active ? 2 : 1.2}
        strokeDasharray="6,4"
        animate={{
          strokeOpacity: active ? [0.6, 1, 0.6] : 0.5,
          strokeDashoffset: [0, -20],
        }}
        transition={{
          strokeOpacity: { duration: 1.4 / speed, repeat: Infinity, ease: 'easeInOut' },
          strokeDashoffset: { duration: 4 / speed, repeat: Infinity, ease: 'linear' },
        }}
      />

      {/* Header */}
      <text x={KV_Q_X + KV_Q_W / 2} y={KV_Q_Y + 22}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fill={COL_KV_Q}
        letterSpacing="0.22em">
        FRESH Q
      </text>
      <text x={KV_Q_X + KV_Q_W / 2} y={KV_Q_Y + 38}
        textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}
        fontStyle="italic">
        this step only · not cached
      </text>

      {/* Big Q label */}
      <text x={KV_Q_X + 32} y={KV_Q_Y + KV_Q_H / 2 + 10}
        fontSize="44" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_KV_Q} opacity={computed ? 1 : 0.4}>
        Q
      </text>

      {/* Q vector cells — fade in when computed */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: computed ? 1 : 0.15 }}
        transition={{ duration: 0.6 / speed }}
      >
        {Array.from({ length: KV_Q_CELLS }).map((_, i) => {
          const v = kvQValue(step, i)
          const fill = kvCellColor(v, 'blue').replace('96,165,250', '34,211,238')
          return (
            <motion.rect
              key={`q-${step}-${i}`}
              x={cellX}
              y={KV_Q_Y + 70 + i * KV_Q_CELL_H}
              width={50} height={KV_Q_CELL_H - 2} rx={2}
              fill={fill}
              stroke="rgba(255,255,255,0.10)" strokeWidth={0.5}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 / speed, delay: (i * 0.04) / speed }}
            />
          )
        })}
      </motion.g>

      {/* Footer note */}
      <text x={KV_Q_X + KV_Q_W / 2} y={KV_Q_Y + KV_Q_H - 14}
        textAnchor="middle"
        fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        used now · then discarded
      </text>
    </g>
  )
}

/* ─────────── K or V cache matrix — past dim, current amber, future invisible ─── */
function KVCacheMatrix({
  which, x, y, w, h, cellW, rowH, step, phase, speed,
}: {
  which: 'K' | 'V'
  x: number; y: number; w: number; h: number
  cellW: number; rowH: number
  step: number; phase: number; speed: number
}) {
  const isK = which === 'K'
  const baseHue: 'blue' | 'violet' = isK ? 'blue' : 'violet'
  const baseColor = isK ? COL_KV_K : COL_KV_V
  const compute = isK ? kvKValue : kvVValue
  const headerColor = baseColor
  const rowsActive = phase === 3 // brighten cached rows when reused

  return (
    <g>
      {/* Header above matrix */}
      <text x={x + w / 2} y={y - 24}
        textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={headerColor}>
        {which} cache
      </text>
      <text x={x + w / 2} y={y - 8}
        textAnchor="middle"
        fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.18em">
        {step + 1} ROW{step === 0 ? '' : 'S'} CACHED · d_k = 20
      </text>

      {/* Frame */}
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={6}
        fill={`rgba(${isK ? '96,165,250' : '167,139,250'},0.025)`}
        stroke={`rgba(${isK ? '96,165,250' : '167,139,250'},0.20)`}
        strokeWidth={1} />

      {/* Cells */}
      {Array.from({ length: KV_SEQ.length }).map((_, r) =>
        Array.from({ length: KV_D_K }).map((_, c) => {
          const isPast = r < step
          const isCurrent = r === step
          const isFuture = r > step
          const v = compute(r, c)
          const baseFill = isFuture
            ? 'rgba(255,255,255,0.02)'
            : isCurrent
              ? `rgba(245,158,11,${0.30 + Math.abs(v) * 0.5})`
              : kvCellColor(v, baseHue)
          const opacityTarget = isFuture ? 0.05 : isPast ? (rowsActive ? 0.7 : 0.45) : 1
          // Current row only "appears" in phase 2+ for the freshly-appended look
          const currentVisible = isCurrent && phase >= 2

          return (
            <motion.rect
              key={`${which}-${r}-${c}`}
              x={x + c * cellW + 0.5}
              y={y + r * rowH + 0.5}
              width={cellW - 1} height={rowH - 1} rx={1}
              fill={baseFill}
              initial={isCurrent ? { opacity: 0 } : false}
              animate={{
                opacity: isCurrent ? (currentVisible ? opacityTarget : 0) : opacityTarget,
              }}
              transition={
                isCurrent
                  ? { duration: 0.4 / speed, delay: (c * 0.012) / speed }
                  : { duration: 0.4 / speed }
              }
            />
          )
        })
      )}

      {/* Current-row outline (always shown to mark "the next slot") */}
      <motion.rect
        x={x - 2} y={y + step * rowH - 2}
        width={w + 4} height={rowH + 4} rx={3}
        fill="none" stroke={COL_KV_NEW}
        strokeWidth={2}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.2 / speed, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Row labels — characters */}
      {KV_SEQ.map((ch, r) => {
        const isPast = r < step
        const isCurrent = r === step
        const isFuture = r > step
        const labelColor = isCurrent
          ? COL_KV_NEW
          : isPast
            ? 'rgba(255,255,255,0.7)'
            : 'rgba(255,255,255,0.20)'
        return (
          <text key={`${which}-row-lbl-${r}`}
            x={x - 14} y={y + r * rowH + rowH / 2 + 4}
            textAnchor="end"
            fontSize="11" fontFamily="var(--font-mono)" fontStyle="italic"
            fill={labelColor}>
            {ch === ' ' ? '·' : ch}
          </text>
        )
      })}

      {/* Annotations: "cached / reused" on past, "new row" on current */}
      {step > 0 && (
        <text x={x + w + 16} y={y + ((step - 1) / 2) * rowH + rowH}
          fontSize="9" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.18em">
          ↑ cached / reused
        </text>
      )}
      <motion.text
        x={x + w + 16}
        y={y + step * rowH + rowH / 2 + 4}
        fontSize="10" fontFamily="var(--font-mono)" fill={COL_KV_NEW}
        letterSpacing="0.18em"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2 / speed, repeat: Infinity, ease: 'easeInOut' }}
      >
        ← NEW ROW
      </motion.text>
    </g>
  )
}

/* ─────────── Append connectors: Q → new K row, Q → new V row (phase 2) ─── */
function KVAppendConnectors({
  step, phase, speed,
}: { step: number; phase: number; speed: number }) {
  if (phase !== 2) return null
  const fromX = KV_Q_X + KV_Q_W
  const fromY = KV_Q_Y + KV_Q_H / 2
  const toKX = KV_K_X
  const toKY = KV_K_Y + step * KV_K_ROW_H + KV_K_ROW_H / 2
  const toVX = KV_V_X
  const toVY = KV_V_Y + step * KV_V_ROW_H + KV_V_ROW_H / 2

  return (
    <g>
      {[
        { tx: toKX, ty: toKY, label: 'append K row' },
        { tx: toVX, ty: toVY, label: 'append V row' },
      ].map((target, idx) => (
        <g key={`append-${idx}`}>
          <motion.path
            d={`M ${fromX} ${fromY} Q ${(fromX + target.tx) / 2} ${(fromY + target.ty) / 2 - 30}, ${target.tx - 8} ${target.ty}`}
            stroke={COL_KV_NEW}
            strokeWidth={2}
            fill="none"
            strokeDasharray="4,4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 0.7 / speed, delay: (idx * 0.2) / speed }}
          />
          <motion.path
            d={`M ${target.tx - 12} ${target.ty - 5} L ${target.tx - 4} ${target.ty} L ${target.tx - 12} ${target.ty + 5}`}
            stroke={COL_KV_NEW}
            strokeWidth={2}
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 / speed, delay: (0.6 + idx * 0.2) / speed }}
          />
          {/* Travelling particle */}
          <motion.circle
            r={4}
            fill={COL_KV_NEW}
            filter="url(#kv-glow)"
            initial={{ cx: fromX, cy: fromY, opacity: 0 }}
            animate={{
              cx: [fromX, (fromX + target.tx) / 2, target.tx - 4],
              cy: [fromY, (fromY + target.ty) / 2 - 30, target.ty],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.8 / speed,
              delay: (0.1 + idx * 0.2) / speed,
              repeat: Infinity,
              repeatDelay: 0.4 / speed,
              ease: 'easeInOut',
            }}
          />
        </g>
      ))}
    </g>
  )
}

/* ─────────── Reuse arrows: Q → all cached K rows (phase 3) ─────────── */
function KVReuseArrows({
  step, phase, speed,
}: { step: number; phase: number; speed: number }) {
  if (phase !== 3) return null
  if (step === 0) return null // no cached rows yet on first step

  const fromX = KV_Q_X + KV_Q_W
  const fromY = KV_Q_Y + KV_Q_H / 2

  return (
    <g>
      {/* Lines from Q to each cached K row */}
      {Array.from({ length: step + 1 }).map((_, r) => {
        const toY = KV_K_Y + r * KV_K_ROW_H + KV_K_ROW_H / 2
        const toX = KV_K_X
        return (
          <motion.line
            key={`reuse-${r}`}
            x1={fromX} x2={toX - 4}
            y1={fromY} y2={toY}
            stroke={COL_KV_NEW}
            strokeWidth={1.2}
            strokeDasharray="3,4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.45] }}
            transition={{
              duration: 0.5 / speed,
              delay: (r * 0.05) / speed,
            }}
          />
        )
      })}
      {/* Pulsing glow on each cached K row */}
      {Array.from({ length: step + 1 }).map((_, r) => (
        <motion.rect
          key={`reuse-glow-${r}`}
          x={KV_K_X - 2} y={KV_K_Y + r * KV_K_ROW_H - 1}
          width={KV_K_W + 4} height={KV_K_ROW_H + 2} rx={2}
          fill="none" stroke={COL_KV_NEW}
          strokeWidth={1.4}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{
            duration: 0.7 / speed,
            delay: (r * 0.07) / speed,
            repeat: Infinity,
            repeatDelay: 0.5 / speed,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* "old rows reused" label */}
      <motion.text
        x={KV_K_X + KV_K_W / 2} y={KV_K_Y - 50}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fill={COL_KV_NEW}
        letterSpacing="0.22em"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 / speed }}
      >
        ↓ OLD K ROWS REUSED, NOT RECOMPUTED
      </motion.text>
    </g>
  )
}

/* ─────────── Bottom payoff counter ─────────── */
function KVPayoff({ step }: { step: number }) {
  const newValues = 2 * KV_D_K // K + V row
  const reusedValues = step * 2 * KV_D_K
  return (
    <g>
      <text x={700} y={760} textAnchor="middle"
        fontSize="14" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        THIS STEP
      </text>
      <text x={700} y={800} textAnchor="middle"
        fontSize="20" fontFamily="var(--font-display)" fontStyle="italic"
        fill="rgba(255,255,255,0.95)">
        <tspan fill={COL_KV_NEW}>1 new K row + 1 new V row</tspan>
        {' written  ·  '}
        <tspan fill={COL_KV_K}>{reusedValues} values</tspan>
        {' reused from cache'}
      </text>
      <text x={700} y={830} textAnchor="middle"
        fontSize="13" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        cost per step:&nbsp;
        <tspan fill={ACCENT.mint}>O(N)</tspan>
        {'  vs naïve  '}
        <tspan fill={ACCENT.red}>O(N²)</tspan>
        {'  ·  reuse is the whole optimization'}
      </text>
      <text x={700} y={865} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim} fontStyle="italic">
        new this step: {newValues} values  ·  cache size now: {(step + 1) * KV_D_K * 2} values
      </text>
    </g>
  )
}

/* ─────────── Phase summary footer ─────────── */
function KVPhaseSummary({ phase }: { phase: number }) {
  const beats = ['arrive', 'fresh Q', 'append K + V', 'reuse cache']
  return (
    <g transform="translate(700, 940)">
      {beats.map((b, i) => {
        const w = 240
        const x = (i - beats.length / 2 + 0.5) * w
        const active = i === phase
        return (
          <g key={`kv-sum-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 12} y={-14} width={w - 24} height={28} rx={14}
              fill={active ? 'rgba(245,158,11,0.18)' : 'transparent'}
              stroke={active ? COL_KV_NEW : ACCENT.rule}
              strokeWidth={active ? 1.5 : 1} />
            <text x={0} y={4} textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)"
              fill={active ? COL_KV_NEW : ACCENT.dim}
              letterSpacing="0.16em">
              {(i + 1)}.{b.toUpperCase()}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── KV cache split-pane wrapper ─────────── */
export function KVCacheSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const phaseLabels = [
    'new token arrives',
    'fresh Q computed',
    'append K + V rows',
    'reuse cached rows',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      1500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      A new token from Scene 18 just arrived. The cache already holds K and V
      rows for every prior position — those are not recomputed.
    </>,
    <>
      Compute a <em>fresh Q</em> from the new token's hidden state. Q is used
      this step only and never stored.
    </>,
    <>
      Compute the new token's <em>K</em> and <em>V</em> too — and append exactly
      one row to each cache. That's the only write per step.
    </>,
    <>
      Attention reads from the <em>full cache</em>: Q dot-products against every
      stored K row, then pulls a weighted sum from V. Old work is reused.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'cache state',
      body: <>K<sub>cache</sub>, V<sub>cache</sub> ∈ R<sup>t × d</sup></>,
    },
    {
      label: 'fresh per step',
      body: <>Q = W<sub>Q</sub> · h<sub>new</sub>  ·  not cached</>,
    },
    {
      label: 'append once',
      body: (
        <>
          K<sub>cache</sub> ← [K<sub>cache</sub> ; W<sub>K</sub> · h<sub>new</sub>]
          <br />
          V<sub>cache</sub> ← [V<sub>cache</sub> ; W<sub>V</sub> · h<sub>new</sub>]
        </>
      ),
    },
    {
      label: 'reuse — attention reads',
      body: <>out = softmax(Q · K<sub>cache</sub>ᵀ / √d_k) · V<sub>cache</sub></>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'During training every position predicts in parallel; during generation we step token by token. The cache is what makes step N fast — N-1 is already done.',
    'Q has to be fresh because it represents the question the new token is asking. The keys and values it queries against are properties of the prior tokens, which never change.',
    'Each step writes exactly 2 × d_model = 2 × 384 = 768 numbers to the cache. That is the entire generation cost beyond the forward pass — no extra recompute.',
    'Without the cache, attention at step N is O(N²) — recompute everything each step. With the cache it is O(N) per step — read N rows, write 1. This is the single biggest optimization in modern LLM serving.',
  ]

  return (
    <SplitPaneScene
      viz={<VizKVCache />}
      text={{
        kicker: 'ACT III · OUTPUT · KV CACHE',
        title: 'One new row per step.',
        subtitle: subtitleByPhase[phase],
        accent: COL_KV_NEW,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={COL_KV_NEW}
          />
        ),
        stats: [
          { label: 'fresh per step', value: 'Q', color: COL_KV_Q },
          { label: 'cached', value: 'K · V', color: COL_KV_K },
          { label: 'append per step', value: '1 K + 1 V row' },
          { label: 'cost per step', value: 'O(N) not O(N²)', color: ACCENT.mint },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}
