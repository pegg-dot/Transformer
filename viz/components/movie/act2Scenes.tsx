'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
import { usePrompt } from './promptContext'
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
const ACT2_KICKER = 'ACT II · INSIDE A BLOCK'

/* =========================================================================
 * Scene 8 — act2-intro: "Now zoom into one block."
 *
 * Visual story per design feedback:
 *   1. The full transformer is a STACK of 6 repeated blocks. Show it.
 *   2. Block 0 is the HERO — large, in the foreground, brightly outlined,
 *      pulsing. Every other block recedes diagonally into darkness.
 *   3. The input slab from the previous scene visibly ARRIVES at Block 0's
 *      left intake. Color-banded streaks suggest motion.
 *   4. Inside Block 0, two compartments are visible: ATTENTION (top) and
 *      MLP (bottom). Tease of "what's inside this block."
 *   5. Zoom-target corner brackets and a "→ ENTERING BLOCK 0" label make
 *      the action explicit.
 *   6. A more legible token strip across the top reminds the viewer what
 *      vectors are flowing in.
 * ====================================================================== */

export function VizAct2Intro() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const tokens = (prompt || 'To be, or not to be').split('').slice(0, 14)

  // Block stack — Block 0 is the hero (front-left), others recede diagonally
  // to upper-right. Each successive block is smaller + dimmer.
  const blocks = [
    {
      i: 0,
      x: 180,
      y: 380,
      w: 380,
      h: 410,
      depth: 36, // axonometric depth offset
      opacity: 1,
      hero: true,
    },
    { i: 1, x: 470, y: 320, w: 300, h: 320, depth: 28, opacity: 0.55 },
    { i: 2, x: 680, y: 270, w: 230, h: 250, depth: 22, opacity: 0.38 },
    { i: 3, x: 840, y: 230, w: 180, h: 200, depth: 18, opacity: 0.25 },
    { i: 4, x: 970, y: 200, w: 140, h: 160, depth: 14, opacity: 0.16 },
    { i: 5, x: 1075, y: 175, w: 110, h: 130, depth: 11, opacity: 0.10 },
  ]

  const heroBlock = blocks[0]
  // Internal split point: top half attention, bottom half MLP
  const splitY = heroBlock.y + heroBlock.h * 0.48
  const heroCenterY = heroBlock.y + heroBlock.h / 2

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="act2-slab-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="0.3" stopColor="#60a5fa" stopOpacity="0.45" />
            <stop offset="0.55" stopColor="#22d3ee" stopOpacity="0.45" />
            <stop offset="0.8" stopColor="#34d399" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0.5" />
          </linearGradient>
          <filter id="act2-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="act2-block-glow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* ────── Top kicker ────── */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          THE FULL STACK
        </text>

        {/* ────── Token strip ────── */}
        <g>
          <text x={20} y={86} fontSize="10" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.22em" opacity="0.85">
            tokens flowing in ▸
          </text>
          {tokens.map((ch, i) => {
            const cellW = 32
            const startX = 220
            const x = startX + i * (cellW + 4)
            return (
              <motion.g
                key={`tok-${i}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: (0.3 + i * 0.04) / speed,
                  duration: 0.35 / speed,
                }}
              >
                <rect x={x} y={68} width={cellW} height={32} rx={3}
                  fill="rgba(167,139,250,0.06)"
                  stroke={ACCENT.violet}
                  strokeOpacity={0.45}
                  strokeWidth={1} />
                <text x={x + cellW / 2} y={90} textAnchor="middle"
                  fontSize="16" fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill="rgba(255,255,255,0.92)">
                  {ch === ' ' ? '·' : ch}
                </text>
              </motion.g>
            )
          })}
        </g>

        {/* ────── Inflow slab — arriving at Block 0's left intake ────── */}
        <motion.g
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: 1.2 / speed,
            delay: 0.6 / speed,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Glow underlay */}
          <path
            d={`M 20 ${heroCenterY - 50} L 175 ${heroCenterY - 80} L 175 ${heroCenterY + 80} L 20 ${heroCenterY + 50} Z`}
            fill="url(#act2-slab-fill)"
            filter="url(#act2-bloom)"
            opacity="0.55"
          />
          {/* Slab outline */}
          <path
            d={`M 20 ${heroCenterY - 50} L 175 ${heroCenterY - 80} L 175 ${heroCenterY + 80} L 20 ${heroCenterY + 50} Z`}
            fill="rgba(167,139,250,0.08)"
            stroke={ACCENT.violet}
            strokeWidth={1.6}
            strokeOpacity={0.85}
          />
          {/* Color band stripes inside the slab */}
          {[0, 1, 2, 3, 4, 5].map((b) => {
            const colors = [
              ACCENT.violet, ACCENT.blue, ACCENT.cyan,
              ACCENT.mint, ACCENT.amber, ACCENT.pink,
            ]
            const t = (b + 0.5) / 6
            const x1 = 20 + t * 155
            const yTop1 = heroCenterY - 50 + t * (heroCenterY - 80 - (heroCenterY - 50))
            const yBot1 = heroCenterY + 50 + t * (heroCenterY + 80 - (heroCenterY + 50))
            return (
              <line
                key={b}
                x1={x1}
                x2={x1}
                y1={yTop1}
                y2={yBot1}
                stroke={colors[b]}
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
            )
          })}
          {/* Slab → Block 0 arrow */}
          <motion.path
            d={`M 178 ${heroCenterY} L 200 ${heroCenterY}`}
            stroke={ACCENT.violet}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 / speed, delay: 1.6 / speed }}
          />
        </motion.g>

        {/* ────── "[T, d_model] → Block 0" label ────── */}
        <motion.text
          x={100}
          y={heroCenterY - 100}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={ACCENT.violet}
          letterSpacing="0.2em"
          opacity={0.75}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 1.4 / speed, duration: 0.5 / speed }}
        >
          [T, d_model] →
        </motion.text>

        {/* ────── Block stack — drawn back to front so foreground sits on top ────── */}
        {blocks
          .slice()
          .reverse()
          .map((b) => {
            const x = b.x
            const y = b.y
            const w = b.w
            const h = b.h
            const d = b.depth
            const isHero = b.hero
            // Front face + top face for axonometric depth
            const frontPath = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
            const topPath = `M ${x} ${y} L ${x + d} ${y - d} L ${x + w + d} ${y - d} L ${x + w} ${y} Z`
            const sidePath = `M ${x + w} ${y} L ${x + w + d} ${y - d} L ${x + w + d} ${y + h - d} L ${x + w} ${y + h} Z`
            return (
              <motion.g
                key={`block-${b.i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: b.opacity, y: 0 }}
                transition={{
                  delay: (0.5 + b.i * 0.12) / speed,
                  duration: 0.7 / speed,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Hero block gets a glow halo behind */}
                {isHero && (
                  <motion.rect
                    x={x - 14}
                    y={y - 14}
                    width={w + 28}
                    height={h + 28}
                    rx={8}
                    fill="rgba(167,139,250,0.06)"
                    filter="url(#act2-block-glow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 0.85, 0.5] }}
                    transition={{
                      duration: 3 / speed,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1.2 / speed,
                    }}
                  />
                )}
                {/* Top face */}
                <path
                  d={topPath}
                  fill={isHero ? 'rgba(167,139,250,0.10)' : 'rgba(167,139,250,0.04)'}
                  stroke={ACCENT.violet}
                  strokeWidth={isHero ? 1.6 : 0.8}
                  strokeOpacity={isHero ? 0.85 : 0.45}
                />
                {/* Side face */}
                <path
                  d={sidePath}
                  fill={isHero ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.02)'}
                  stroke={ACCENT.violet}
                  strokeWidth={isHero ? 1.4 : 0.7}
                  strokeOpacity={isHero ? 0.7 : 0.38}
                />
                {/* Front face */}
                <path
                  d={frontPath}
                  fill={isHero ? 'rgba(167,139,250,0.05)' : 'rgba(167,139,250,0.018)'}
                  stroke={ACCENT.violet}
                  strokeWidth={isHero ? 2.4 : 1}
                  strokeOpacity={isHero ? 0.95 : 0.5}
                />

                {/* Block label */}
                <text
                  x={x + w / 2}
                  y={y - d - 12}
                  textAnchor="middle"
                  fontSize={isHero ? 14 : 11}
                  fontFamily="var(--font-mono)"
                  fill={isHero ? ACCENT.violet : ACCENT.dim}
                  letterSpacing={isHero ? '0.32em' : '0.22em'}
                  fontWeight={isHero ? 500 : 400}
                  opacity={isHero ? 1 : 0.7}
                >
                  BLOCK {b.i}
                </text>
              </motion.g>
            )
          })}

        {/* ────── Hero block internals — Attention (top) + MLP (bottom) ────── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 / speed, duration: 0.6 / speed }}
        >
          {/* Internal divider between Attention and MLP */}
          <line
            x1={heroBlock.x + 16}
            x2={heroBlock.x + heroBlock.w - 16}
            y1={splitY}
            y2={splitY}
            stroke={ACCENT.violet}
            strokeOpacity={0.45}
            strokeDasharray="4 5"
            strokeWidth={1}
          />

          {/* Attention compartment label + tease */}
          <text
            x={heroBlock.x + heroBlock.w / 2}
            y={heroBlock.y + 36}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill={ACCENT.blue}
            letterSpacing="0.3em"
            opacity={0.85}
          >
            ATTENTION
          </text>
          {/* Mini Q K V tease */}
          {['Q', 'K', 'V'].map((label, i) => {
            const colors = [ACCENT.blue, ACCENT.red, ACCENT.mint]
            const cw = 50
            const cgap = 16
            const totalW = 3 * cw + 2 * cgap
            const startX = heroBlock.x + (heroBlock.w - totalW) / 2
            return (
              <g key={`qkv-${i}`} transform={`translate(${startX + i * (cw + cgap)}, ${heroBlock.y + 60})`}>
                <rect
                  width={cw}
                  height={68}
                  rx={3}
                  fill={`${colors[i]}10`}
                  stroke={colors[i]}
                  strokeWidth={1.2}
                  strokeOpacity={0.55}
                />
                <text
                  x={cw / 2}
                  y={42}
                  textAnchor="middle"
                  fontSize="22"
                  fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={colors[i]}
                  opacity={0.75}
                >
                  {label}
                </text>
              </g>
            )
          })}

          {/* MLP compartment label + tease */}
          <text
            x={heroBlock.x + heroBlock.w / 2}
            y={splitY + 30}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill={ACCENT.amber}
            letterSpacing="0.3em"
            opacity={0.85}
          >
            MLP · FEED-FORWARD
          </text>
          {/* Horizontal bar tease for MLP */}
          {Array.from({ length: 5 }).map((_, i) => {
            const barY = splitY + 56 + i * 18
            const barWidths = [0.7, 0.55, 0.85, 0.4, 0.65]
            const startX = heroBlock.x + 30
            const fullW = heroBlock.w - 60
            return (
              <rect
                key={`mlp-${i}`}
                x={startX}
                y={barY}
                width={fullW * barWidths[i]}
                height={6}
                rx={1.5}
                fill={ACCENT.amber}
                opacity={0.18 + (i % 2) * 0.12}
              />
            )
          })}
        </motion.g>

        {/* ────── Zoom-target corner brackets around the hero block ────── */}
        <motion.g
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 / speed, duration: 0.5 / speed }}
        >
          {(() => {
            const x = heroBlock.x - 14
            const y = heroBlock.y - heroBlock.depth - 28
            const w = heroBlock.w + heroBlock.depth + 28
            const h = heroBlock.h + heroBlock.depth + 42
            const armLen = 22
            const stroke = ACCENT.violet
            return (
              <g stroke={stroke} strokeWidth={2.4} fill="none" opacity={0.95}>
                {/* Top-left */}
                <path d={`M ${x} ${y + armLen} L ${x} ${y} L ${x + armLen} ${y}`} />
                {/* Top-right */}
                <path d={`M ${x + w - armLen} ${y} L ${x + w} ${y} L ${x + w} ${y + armLen}`} />
                {/* Bottom-left */}
                <path d={`M ${x} ${y + h - armLen} L ${x} ${y + h} L ${x + armLen} ${y + h}`} />
                {/* Bottom-right */}
                <path d={`M ${x + w - armLen} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - armLen}`} />
              </g>
            )
          })()}
        </motion.g>

        {/* ────── "→ ENTERING BLOCK 0" cue below the hero ────── */}
        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 / speed, duration: 0.5 / speed }}
        >
          <text
            x={heroBlock.x + heroBlock.w / 2}
            y={heroBlock.y + heroBlock.h + 50}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill={ACCENT.violet}
            letterSpacing="0.34em"
          >
            →  ENTERING BLOCK 0  ←
          </text>
        </motion.g>

        {/* ────── Cinematic motion — subtle push-in pulse on hero block ────── */}
        {/* (Implemented via the halo motion above; the block geometry stays
            stable so the SSR/hydration is clean.) */}

        {/* ────── Bottom caption ────── */}
        <motion.text
          x={700}
          y={950}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={ACCENT.dim}
          opacity={0.85}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 2.2 / speed, duration: 0.6 / speed }}
        >
          The transformer is six identical blocks. We zoom into the first.
        </motion.text>
      </svg>
    </div>
  )
}

/* ─────────── Scene 8 wrapper ─────────── */
export function Act2IntroSplitPane() {
  const speed = useSpeed()
  // Cycle through "what's inside Block 0" hint phases for the right pane
  const phases = ['Attention first', 'then a small FFN', 'add to residual', 'repeat ×6']
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % phases.length),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [phases.length, speed])

  return (
    <SplitPaneScene
      viz={<VizAct2Intro />}
      text={{
        kicker: ACT2_KICKER,
        title: 'Now zoom into one block.',
        subtitle: (
          <>
            Attention first, then a small feedforward net. Every block runs
            the same two sub-layers — and the model stacks{' '}
            <strong>six</strong> of them.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={phases.length}
            label={phases[phase]}
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'blocks', value: '6', color: ACCENT.violet },
          { label: 'params/block', value: '1.7 M' },
          { label: 'focused', value: 'Block 0', color: ACCENT.violet },
        ],
        equation: {
          label: 'block recipe',
          body: (
            <>
              x ← x + Attn(LN(x))
              <br />
              <span style={{ fontSize: '0.78em', opacity: 0.72 }}>
                x ← x + FFN(LN(x))
              </span>
            </>
          ),
        },
        infoCallout:
          'Same recipe, six times. The residual stream walks through six identical-shaped blocks, each adding its own correction.',
      }}
    />
  )
}
