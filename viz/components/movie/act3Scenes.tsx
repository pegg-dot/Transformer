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
