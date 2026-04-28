'use client'

import { useEffect, useState, type ReactNode } from 'react'
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

        {/* ────── Token strip ──────
            The tokens at the top connect down into the input slab via a
            funneling band — visualizes "these N tokens have already become
            the [T, d_model] slab that's about to enter Block 0." */}
        <g>
          <text x={20} y={86} fontSize="10" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.22em" opacity="0.85">
            tokens already in slab ▸
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

          {/* Funnel — converging dashed lines from the token strip down into
              the slab's left face, showing the tokens are now the slab. */}
          {(() => {
            const cellW = 32
            const startX = 220
            const tokenStripBottom = 102
            const slabLeft = 20
            const slabTop = heroCenterY - 50
            const slabBot = heroCenterY + 50
            const tokenLeft = startX
            const tokenRight = startX + tokens.length * (cellW + 4) - 4
            return (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                transition={{ delay: 1.0 / speed, duration: 0.6 / speed }}
              >
                {/* Funnel envelope — from token-strip bottom edge to slab left edge */}
                <path
                  d={`M ${tokenLeft} ${tokenStripBottom} L ${slabLeft} ${slabTop} L ${slabLeft} ${slabBot} L ${tokenRight} ${tokenStripBottom} Z`}
                  fill="rgba(167,139,250,0.04)"
                  stroke={ACCENT.violet}
                  strokeOpacity={0.18}
                  strokeWidth={0.8}
                />
                {/* A few thin guide rays so the funnel reads as "tokens → slab" */}
                {[0, 0.33, 0.66, 1].map((t, i) => {
                  const tx = tokenLeft + t * (tokenRight - tokenLeft)
                  const sy = slabTop + t * (slabBot - slabTop)
                  return (
                    <line
                      key={`funnel-${i}`}
                      x1={tx}
                      y1={tokenStripBottom + 2}
                      x2={slabLeft}
                      y2={sy}
                      stroke={ACCENT.violet}
                      strokeOpacity={0.32}
                      strokeDasharray="2 4"
                      strokeWidth={0.9}
                    />
                  )
                })}
                {/* Tiny "T tokens → [T, d_model]" label */}
                <text
                  x={(tokenLeft + slabLeft) / 2}
                  y={(tokenStripBottom + slabTop) / 2 - 4}
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.violet}
                  letterSpacing="0.18em"
                  opacity={0.75}
                >
                  T tokens
                </text>
              </motion.g>
            )
          })()}
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
            d={`M 178 ${heroCenterY} L ${heroBlock.x - 4} ${heroCenterY}`}
            stroke={ACCENT.violet}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 / speed, delay: 1.6 / speed }}
          />
        </motion.g>

        {/* ────── Block 0 intake slot — glowing rectangular doorway on the
            slab-side face. Pulses + halo so the slab handoff feels physical. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 / speed, duration: 0.5 / speed }}
        >
          {/* Glow halo around the intake */}
          <motion.rect
            x={heroBlock.x - 8}
            y={heroCenterY - 90}
            width={20}
            height={180}
            fill="rgba(167,139,250,0.45)"
            filter="url(#act2-bloom)"
            animate={{ opacity: [0.45, 0.95, 0.45] }}
            transition={{
              duration: 2.4 / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Intake slot — bright violet edge */}
          <line
            x1={heroBlock.x}
            x2={heroBlock.x}
            y1={heroCenterY - 90}
            y2={heroCenterY + 90}
            stroke={ACCENT.violet}
            strokeWidth={3.5}
            strokeOpacity={0.95}
          />
          {/* Top + bottom caps */}
          <line x1={heroBlock.x - 4} x2={heroBlock.x + 6}
            y1={heroCenterY - 90} y2={heroCenterY - 90}
            stroke={ACCENT.violet} strokeWidth={2.4} strokeOpacity={0.85} />
          <line x1={heroBlock.x - 4} x2={heroBlock.x + 6}
            y1={heroCenterY + 90} y2={heroCenterY + 90}
            stroke={ACCENT.violet} strokeWidth={2.4} strokeOpacity={0.85} />
        </motion.g>

        {/* ────── Motion-trail particles — looping flow from slab → intake ────── */}
        {Array.from({ length: 8 }).map((_, i) => {
          const lane = i % 4
          const colors = [
            ACCENT.violet, ACCENT.cyan, ACCENT.mint, ACCENT.amber,
          ]
          const yLane = heroCenterY - 60 + lane * 40
          return (
            <motion.circle
              key={`flow-${i}`}
              r={2.6}
              cy={yLane}
              fill={colors[lane]}
              opacity={0.85}
              animate={{
                cx: [40, heroBlock.x + 10],
                opacity: [0, 0.95, 0.95, 0],
              }}
              transition={{
                duration: 2.2 / speed,
                ease: 'easeOut',
                repeat: Infinity,
                delay: 1.8 / speed + (i * 0.18) / speed,
                times: [0, 0.15, 0.85, 1],
              }}
            />
          )
        })}

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
                  fill={isHero ? 'rgba(167,139,250,0.14)' : 'rgba(167,139,250,0.04)'}
                  stroke={ACCENT.violet}
                  strokeWidth={isHero ? 2 : 0.8}
                  strokeOpacity={isHero ? 1 : 0.45}
                />
                {/* Side face */}
                <path
                  d={sidePath}
                  fill={isHero ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.02)'}
                  stroke={ACCENT.violet}
                  strokeWidth={isHero ? 1.8 : 0.7}
                  strokeOpacity={isHero ? 0.85 : 0.38}
                />
                {/* Front face */}
                <path
                  d={frontPath}
                  fill={isHero ? 'rgba(167,139,250,0.07)' : 'rgba(167,139,250,0.018)'}
                  stroke={ACCENT.violet}
                  strokeWidth={isHero ? 3 : 1}
                  strokeOpacity={isHero ? 1 : 0.5}
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

          {/* LN gate before Attention — matches recipe x ← x + Attn(LN(x)) */}
          <g>
            <rect
              x={heroBlock.x + heroBlock.w / 2 - 60}
              y={heroBlock.y + 14}
              width={120}
              height={22}
              rx={11}
              fill="rgba(34,211,238,0.10)"
              stroke={ACCENT.cyan}
              strokeWidth={1.4}
              strokeOpacity={0.85}
            />
            <text
              x={heroBlock.x + heroBlock.w / 2}
              y={heroBlock.y + 30}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill={ACCENT.cyan}
              letterSpacing="0.26em"
            >
              LayerNorm
            </text>
            {/* Arrow LN → Attention */}
            <line
              x1={heroBlock.x + heroBlock.w / 2}
              x2={heroBlock.x + heroBlock.w / 2}
              y1={heroBlock.y + 38}
              y2={heroBlock.y + 50}
              stroke={ACCENT.cyan}
              strokeOpacity={0.7}
              strokeWidth={1.4}
            />
            <path
              d={`M ${heroBlock.x + heroBlock.w / 2 - 4} ${heroBlock.y + 46} L ${heroBlock.x + heroBlock.w / 2} ${heroBlock.y + 50} L ${heroBlock.x + heroBlock.w / 2 + 4} ${heroBlock.y + 46}`}
              stroke={ACCENT.cyan}
              strokeOpacity={0.85}
              strokeWidth={1.4}
              fill="none"
            />
          </g>

          {/* Attention compartment label + tease */}
          <text
            x={heroBlock.x + heroBlock.w / 2}
            y={heroBlock.y + 70}
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
            const cw = 46
            const cgap = 14
            const totalW = 3 * cw + 2 * cgap
            const startX = heroBlock.x + (heroBlock.w - totalW) / 2
            return (
              <g key={`qkv-${i}`} transform={`translate(${startX + i * (cw + cgap)}, ${heroBlock.y + 84})`}>
                <rect
                  width={cw}
                  height={56}
                  rx={3}
                  fill={`${colors[i]}10`}
                  stroke={colors[i]}
                  strokeWidth={1.2}
                  strokeOpacity={0.55}
                />
                <text
                  x={cw / 2}
                  y={36}
                  textAnchor="middle"
                  fontSize="20"
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

          {/* LN gate before MLP — matches recipe x ← x + FFN(LN(x)) */}
          <g>
            <rect
              x={heroBlock.x + heroBlock.w / 2 - 60}
              y={splitY + 8}
              width={120}
              height={22}
              rx={11}
              fill="rgba(34,211,238,0.10)"
              stroke={ACCENT.cyan}
              strokeWidth={1.4}
              strokeOpacity={0.85}
            />
            <text
              x={heroBlock.x + heroBlock.w / 2}
              y={splitY + 24}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill={ACCENT.cyan}
              letterSpacing="0.26em"
            >
              LayerNorm
            </text>
            {/* Arrow LN → MLP */}
            <line
              x1={heroBlock.x + heroBlock.w / 2}
              x2={heroBlock.x + heroBlock.w / 2}
              y1={splitY + 32}
              y2={splitY + 44}
              stroke={ACCENT.cyan}
              strokeOpacity={0.7}
              strokeWidth={1.4}
            />
            <path
              d={`M ${heroBlock.x + heroBlock.w / 2 - 4} ${splitY + 40} L ${heroBlock.x + heroBlock.w / 2} ${splitY + 44} L ${heroBlock.x + heroBlock.w / 2 + 4} ${splitY + 40}`}
              stroke={ACCENT.cyan}
              strokeOpacity={0.85}
              strokeWidth={1.4}
              fill="none"
            />
          </g>

          {/* MLP compartment label + tease */}
          <text
            x={heroBlock.x + heroBlock.w / 2}
            y={splitY + 60}
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
            const barY = splitY + 76 + i * 16
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
            const armLen = 32
            const stroke = ACCENT.violet
            return (
              <g stroke={stroke} strokeWidth={3.2} fill="none" opacity={1}
                strokeLinecap="round">
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


/* =========================================================================
 * Scene 9 — layernorm: "Normalize before every sublayer."
 *
 * Visual story per design feedback:
 *   1. Four explicit stages laid out left-to-right:
 *        x  →  centered  →  normalized  →  γ·x + β
 *      Each stage gets its own labeled column with the actual vector,
 *      its mean line, and a μ/σ readout below it.
 *   2. Operation arrows between stages with the math symbols (− μ, ÷ σ,
 *      × γ + β) so the four math beats read at a glance.
 *   3. γ and β rendered as VISIBLE parameter strips below the pipeline,
 *      with arrows pointing into the affine stage. They feel like real
 *      learnable vectors, not text labels.
 *   4. The final affine output gets a violet glow + "LN(x) → attention
 *      input" handoff label so it sets up Scene 10.
 *   5. Token strip at the top with token #3 highlighted reminds the
 *      viewer this is one token's 384-dim vector being normalized.
 * ====================================================================== */

export function VizLayerNorm() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const tokens = (prompt || 'To be, or not to be').split('').slice(0, 14)
  const FOCUSED = 3

  // ── Math: actual computed values ──────────────────────────────────────
  const D = 12 // visible dim count
  const RAW = Array.from({ length: D }).map(
    (_, i) => Math.sin(i * 1.27 + 2.1) * 1.0 + 0.42,
  )
  const muRaw = RAW.reduce((a, b) => a + b, 0) / D
  const centered = RAW.map((v) => v - muRaw)
  const muCentered = centered.reduce((a, b) => a + b, 0) / D // ≈ 0
  const sigCentered = Math.sqrt(
    centered.reduce((a, b) => a + b * b, 0) / D,
  )
  const normalized = centered.map((v) => v / (sigCentered || 1))
  const sigNormalized = Math.sqrt(
    normalized.reduce((a, b) => a + b * b, 0) / D,
  ) // ≈ 1
  const GAMMA = Array.from({ length: D }).map(
    (_, i) => 0.85 + 0.42 * Math.sin(i * 0.7 + 0.3),
  )
  const BETA = Array.from({ length: D }).map(
    (_, i) => 0.22 * Math.cos(i * 0.9),
  )
  const affine = normalized.map((v, i) => GAMMA[i] * v + BETA[i])

  // Diverging color (positive violet, negative muted red)
  const colorFor = (v: number): string => {
    const m = Math.max(-2, Math.min(2, v)) / 2
    if (m >= 0) {
      const a = 0.10 + Math.min(1, m) * 0.62
      return `rgba(167,139,250,${a})`
    }
    const a = 0.10 + Math.min(1, -m) * 0.55
    return `rgba(248,113,113,${a})`
  }
  const gammaColor = (v: number): string => {
    // γ values are around 1; saturate amber
    const a = 0.25 + Math.min(1, v) * 0.5
    return `rgba(245,158,11,${a})`
  }
  const betaColor = (v: number): string => {
    if (v >= 0) return `rgba(245,158,11,${0.18 + Math.min(1, v) * 0.5})`
    return `rgba(248,113,113,${0.18 + Math.min(1, -v) * 0.5})`
  }

  // ── Phase progression (5 phases, last one is "settled hold") ──────────
  const PHASES = 5
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Stage visibility — stage K appears at phase K
  const stageOpacity = (k: number): number =>
    phase >= k ? 1 : 0.18

  // ── Geometry ──────────────────────────────────────────────────────────
  const STAGE_X = [120, 410, 700, 990] // left edges of the 4 stage columns
  const COL_W = 84
  const CELL_H = 24
  const VEC_TOP = 200
  const VEC_BOT = VEC_TOP + D * CELL_H // 488

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ln-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="ln-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* ────── Top kicker ────── */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          BLOCK 0 · LAYERNORM
        </text>

        {/* ────── Token strip with focused token ────── */}
        <g>
          <text x={20} y={84} fontSize="10" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.22em" opacity="0.85">
            this token's 384-dim vector ▸
          </text>
          {tokens.map((ch, i) => {
            const cellW = 30
            const startX = 280
            const x = startX + i * (cellW + 4)
            const isFocused = i === FOCUSED
            return (
              <g key={`tok-${i}`}>
                {isFocused && (
                  <motion.rect
                    x={x - 2} y={64} width={cellW + 4} height={36} rx={4}
                    fill="rgba(167,139,250,0.18)"
                    stroke={ACCENT.violet}
                    strokeWidth={1.6}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{
                      duration: 2 / speed,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                <rect x={x} y={66} width={cellW} height={32} rx={3}
                  fill="rgba(167,139,250,0.04)"
                  stroke="rgba(167,139,250,0.32)"
                  strokeWidth={1} />
                <text x={x + cellW / 2} y={88} textAnchor="middle"
                  fontSize="15" fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={isFocused ? '#fff' : 'rgba(255,255,255,0.55)'}>
                  {ch === ' ' ? '·' : ch}
                </text>
              </g>
            )
          })}

          {/* Drop arrow from focused token to stage 1 */}
          <motion.path
            d={`M ${280 + FOCUSED * 34 + 15} 102 L ${STAGE_X[0] + COL_W / 2} ${VEC_TOP - 16}`}
            stroke={ACCENT.violet}
            strokeOpacity={0.45}
            strokeDasharray="3 5"
            strokeWidth={1.2}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 / speed, delay: 0.4 / speed }}
          />
        </g>

        {/* ────── Stage 1: RAW INPUT ────── */}
        <Stage
          x={STAGE_X[0]}
          y={VEC_TOP}
          w={COL_W}
          cellH={CELL_H}
          values={RAW}
          colorFn={colorFor}
          opacity={1} // raw is always visible
          label="1. RAW"
          subLabel="x"
          mu={muRaw}
          sigma={Math.sqrt(RAW.reduce((a, b) => a + (b - muRaw) ** 2, 0) / D)}
          showMuLine
          accent={ACCENT.violet}
        />

        {/* Op 1: − μ */}
        <Operation
          x={STAGE_X[0] + COL_W + 14}
          y={(VEC_TOP + VEC_BOT) / 2}
          width={STAGE_X[1] - (STAGE_X[0] + COL_W) - 28}
          symbol="− μ"
          label="subtract mean"
          color={ACCENT.violet}
          active={phase >= 1}
          speed={speed}
        />

        {/* ────── Stage 2: CENTERED ────── */}
        <motion.g
          initial={false}
          animate={{ opacity: stageOpacity(1) }}
          transition={{ duration: 0.5 / speed }}
        >
          <Stage
            x={STAGE_X[1]}
            y={VEC_TOP}
            w={COL_W}
            cellH={CELL_H}
            values={centered}
            colorFn={colorFor}
            opacity={1}
            label="2. CENTERED"
            subLabel="x − μ"
            mu={muCentered}
            sigma={sigCentered}
            showMuLine
            accent={ACCENT.violet}
          />
        </motion.g>

        {/* Op 2: ÷ σ */}
        <Operation
          x={STAGE_X[1] + COL_W + 14}
          y={(VEC_TOP + VEC_BOT) / 2}
          width={STAGE_X[2] - (STAGE_X[1] + COL_W) - 28}
          symbol="÷ σ"
          label="divide by std"
          color={ACCENT.violet}
          active={phase >= 2}
          speed={speed}
        />

        {/* ────── Stage 3: NORMALIZED ────── */}
        <motion.g
          initial={false}
          animate={{ opacity: stageOpacity(2) }}
          transition={{ duration: 0.5 / speed }}
        >
          <Stage
            x={STAGE_X[2]}
            y={VEC_TOP}
            w={COL_W}
            cellH={CELL_H}
            values={normalized}
            colorFn={colorFor}
            opacity={1}
            label="3. NORMALIZED"
            subLabel="(x − μ) / σ"
            mu={0}
            sigma={sigNormalized}
            showMuLine
            sigmaEnvelope
            accent={ACCENT.cyan}
          />
        </motion.g>

        {/* Op 3: × γ + β */}
        <Operation
          x={STAGE_X[2] + COL_W + 14}
          y={(VEC_TOP + VEC_BOT) / 2}
          width={STAGE_X[3] - (STAGE_X[2] + COL_W) - 28}
          symbol="× γ  + β"
          label="affine: scale + shift"
          color={ACCENT.amber}
          active={phase >= 3}
          speed={speed}
        />

        {/* ────── Stage 4: AFFINE OUTPUT ────── */}
        <motion.g
          initial={false}
          animate={{ opacity: stageOpacity(3) }}
          transition={{ duration: 0.5 / speed }}
        >
          {/* Glow halo for the final output (the payoff) */}
          {phase >= 3 && (
            <motion.rect
              x={STAGE_X[3] - 8}
              y={VEC_TOP - 8}
              width={COL_W + 16}
              height={D * CELL_H + 16}
              rx={6}
              fill="rgba(167,139,250,0.06)"
              filter="url(#ln-bloom)"
              animate={{ opacity: [0.45, 0.85, 0.45] }}
              transition={{
                duration: 3 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
          <Stage
            x={STAGE_X[3]}
            y={VEC_TOP}
            w={COL_W}
            cellH={CELL_H}
            values={affine}
            colorFn={colorFor}
            opacity={1}
            label="4. LN(x)"
            subLabel="γ · x̂ + β"
            mu={affine.reduce((a, b) => a + b, 0) / D}
            sigma={Math.sqrt(
              affine.reduce(
                (a, b) =>
                  a +
                  (b - affine.reduce((p, q) => p + q, 0) / D) ** 2,
                0,
              ) / D,
            )}
            showMuLine={false}
            heroOutline
            accent={ACCENT.violet}
          />
        </motion.g>

        {/* ────── γ and β parameter strips ────── */}
        <motion.g
          initial={false}
          animate={{ opacity: phase >= 3 ? 1 : 0.18 }}
          transition={{ duration: 0.5 / speed }}
        >
          {/* γ strip */}
          <text x={STAGE_X[2] - 30} y={620} textAnchor="end"
            fontSize="14" fontFamily="var(--font-display)"
            fontStyle="italic" fill={ACCENT.amber}
            letterSpacing="0.06em">
            γ
          </text>
          <text x={STAGE_X[2] - 30} y={636} textAnchor="end"
            fontSize="9" fontFamily="var(--font-mono)"
            fill={ACCENT.dim} letterSpacing="0.18em">
            scale (learned)
          </text>
          <ParamStrip
            x={STAGE_X[2]}
            y={604}
            w={COL_W * 4 + 84}
            cellH={28}
            values={GAMMA}
            colorFn={gammaColor}
          />

          {/* β strip */}
          <text x={STAGE_X[2] - 30} y={690} textAnchor="end"
            fontSize="14" fontFamily="var(--font-display)"
            fontStyle="italic" fill={ACCENT.amber}
            letterSpacing="0.06em">
            β
          </text>
          <text x={STAGE_X[2] - 30} y={706} textAnchor="end"
            fontSize="9" fontFamily="var(--font-mono)"
            fill={ACCENT.dim} letterSpacing="0.18em">
            shift (learned)
          </text>
          <ParamStrip
            x={STAGE_X[2]}
            y={672}
            w={COL_W * 4 + 84}
            cellH={28}
            values={BETA}
            colorFn={betaColor}
          />

          {/* Arrows from γ and β into stage 4's affine box */}
          <path
            d={`M ${STAGE_X[3] - 30} 618 L ${STAGE_X[3] - 8} 618`}
            stroke={ACCENT.amber}
            strokeOpacity={0.7}
            strokeWidth={1.4}
            fill="none"
          />
          <path
            d={`M ${STAGE_X[3] - 30} 686 L ${STAGE_X[3] - 8} 686`}
            stroke={ACCENT.amber}
            strokeOpacity={0.7}
            strokeWidth={1.4}
            fill="none"
          />
        </motion.g>

        {/* ────── Caption: γ and β explanation ────── */}
        <motion.text
          x={STAGE_X[0]}
          y={770}
          fontSize="13"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill="rgba(255,255,255,0.78)"
          initial={false}
          animate={{ opacity: phase >= 3 ? 0.85 : 0.25 }}
          transition={{ duration: 0.5 / speed }}
        >
          γ and β are learned per-dimension. They let the model un-do
        </motion.text>
        <motion.text
          x={STAGE_X[0]}
          y={792}
          fontSize="13"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill="rgba(255,255,255,0.78)"
          initial={false}
          animate={{ opacity: phase >= 3 ? 0.85 : 0.25 }}
          transition={{ duration: 0.5 / speed }}
        >
          or re-tune the normalization where it helps the loss go down.
        </motion.text>

        {/* ────── Final handoff label ────── */}
        <motion.g
          initial={false}
          animate={{ opacity: phase >= 4 ? 1 : 0.4 }}
          transition={{ duration: 0.6 / speed }}
        >
          <line
            x1={STAGE_X[3] + COL_W / 2}
            y1={VEC_BOT + 14}
            x2={STAGE_X[3] + COL_W / 2}
            y2={VEC_BOT + 70}
            stroke={ACCENT.violet}
            strokeOpacity={0.7}
            strokeWidth={1.4}
          />
          <path
            d={`M ${STAGE_X[3] + COL_W / 2 - 6} ${VEC_BOT + 64} L ${STAGE_X[3] + COL_W / 2} ${VEC_BOT + 70} L ${STAGE_X[3] + COL_W / 2 + 6} ${VEC_BOT + 64}`}
            stroke={ACCENT.violet}
            strokeOpacity={0.85}
            strokeWidth={1.4}
            fill="none"
          />
          <text
            x={STAGE_X[3] + COL_W / 2}
            y={VEC_BOT + 92}
            textAnchor="middle"
            fontSize="12"
            fontFamily="var(--font-mono)"
            fill={ACCENT.violet}
            letterSpacing="0.22em"
          >
            LN(x) → ATTENTION INPUT
          </text>
        </motion.g>

        {/* ────── Bottom italic caption ────── */}
        <text
          x={700}
          y={950}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={ACCENT.dim}
          opacity={0.85}
        >
          One token's 384-dim vector — recentered, rescaled, then re-tuned.
        </text>
      </svg>
    </div>
  )
}

/** One stage column in the LayerNorm pipeline. */
function Stage({
  x,
  y,
  w,
  cellH,
  values,
  colorFn,
  opacity,
  label,
  subLabel,
  mu,
  sigma,
  showMuLine,
  sigmaEnvelope,
  heroOutline,
  accent,
}: {
  x: number
  y: number
  w: number
  cellH: number
  values: number[]
  colorFn: (v: number) => string
  opacity: number
  label: string
  subLabel: string
  mu: number
  sigma: number
  showMuLine?: boolean
  sigmaEnvelope?: boolean
  heroOutline?: boolean
  accent: string
}) {
  const D = values.length
  const totalH = D * cellH
  // μ position in the column — assumes value range [-2, 2] roughly
  const muY = y + totalH / 2 - (mu * totalH) / 4 // visual: 0 mean is in middle
  return (
    <g opacity={opacity}>
      {/* Stage label above */}
      <text x={x + w / 2} y={y - 30} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={accent} letterSpacing="0.22em">
        {label}
      </text>
      <text x={x + w / 2} y={y - 14} textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)"
        fontStyle="italic" fill="rgba(255,255,255,0.7)">
        {subLabel}
      </text>

      {/* Column outline */}
      <rect
        x={x}
        y={y}
        width={w}
        height={totalH}
        fill="none"
        stroke={accent}
        strokeWidth={heroOutline ? 2.2 : 1.2}
        strokeOpacity={heroOutline ? 0.95 : 0.5}
        rx={3}
      />

      {/* Cells */}
      {values.map((v, i) => (
        <rect
          key={i}
          x={x + 1}
          y={y + i * cellH + 1}
          width={w - 2}
          height={cellH - 2}
          fill={colorFn(v)}
        />
      ))}

      {/* μ overlay line */}
      {showMuLine && (
        <g>
          <line
            x1={x - 6}
            x2={x + w + 6}
            y1={muY}
            y2={muY}
            stroke={ACCENT.cyan}
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <text
            x={x + w + 10}
            y={muY + 4}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={ACCENT.cyan}
            letterSpacing="0.06em"
          >
            μ
          </text>
        </g>
      )}

      {/* σ envelope (for normalized stage) */}
      {sigmaEnvelope && (
        <g>
          <rect
            x={x - 5}
            y={muY - sigma * (totalH / 4)}
            width={w + 10}
            height={sigma * (totalH / 2)}
            fill="rgba(34,211,238,0.05)"
            stroke={ACCENT.cyan}
            strokeOpacity={0.4}
            strokeDasharray="3 4"
            strokeWidth={1}
          />
          <text
            x={x + w + 10}
            y={muY - sigma * (totalH / 4) + 4}
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={ACCENT.cyan}
          >
            +σ
          </text>
          <text
            x={x + w + 10}
            y={muY + sigma * (totalH / 4) + 4}
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={ACCENT.cyan}
          >
            −σ
          </text>
        </g>
      )}

      {/* μ / σ readouts below */}
      <text x={x} y={y + totalH + 22}
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim}>
        μ ={' '}
        <tspan fill={Math.abs(mu) < 0.01 ? ACCENT.mint : ACCENT.cyan}>
          {mu.toFixed(2)}
        </tspan>
      </text>
      <text x={x} y={y + totalH + 40}
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim}>
        σ ={' '}
        <tspan fill={Math.abs(sigma - 1) < 0.01 ? ACCENT.mint : ACCENT.cyan}>
          {sigma.toFixed(2)}
        </tspan>
      </text>
    </g>
  )
}

/** Operation arrow + symbol between two stages. */
function Operation({
  x,
  y,
  width,
  symbol,
  label,
  color,
  active,
  speed,
}: {
  x: number
  y: number
  width: number
  symbol: string
  label: string
  color: string
  active: boolean
  speed: number
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: active ? 1 : 0.35 }}
      transition={{ duration: 0.4 / speed }}
    >
      {/* Arrow line */}
      <line
        x1={x}
        x2={x + width - 8}
        y1={y}
        y2={y}
        stroke={color}
        strokeOpacity={0.8}
        strokeWidth={1.6}
      />
      <path
        d={`M ${x + width - 14} ${y - 6} L ${x + width - 6} ${y} L ${x + width - 14} ${y + 6}`}
        stroke={color}
        strokeOpacity={0.85}
        strokeWidth={1.6}
        fill="none"
      />
      {/* Symbol box above the arrow */}
      <rect
        x={x + width / 2 - 36}
        y={y - 38}
        width={72}
        height={28}
        rx={4}
        fill="rgba(8,8,11,0.75)"
        stroke={color}
        strokeOpacity={0.65}
        strokeWidth={1.2}
      />
      <text
        x={x + width / 2}
        y={y - 19}
        textAnchor="middle"
        fontSize="14"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={color}
      >
        {symbol}
      </text>
      {/* Sub-label below */}
      <text
        x={x + width / 2}
        y={y + 22}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={ACCENT.dim}
        letterSpacing="0.18em"
      >
        {label}
      </text>
    </motion.g>
  )
}

/** Horizontal parameter strip (γ or β). */
function ParamStrip({
  x,
  y,
  w,
  cellH,
  values,
  colorFn,
}: {
  x: number
  y: number
  w: number
  cellH: number
  values: number[]
  colorFn: (v: number) => string
}) {
  const D = values.length
  const cellW = (w - 2) / D
  return (
    <g>
      <rect x={x} y={y} width={w} height={cellH}
        fill="none" stroke={ACCENT.amber} strokeOpacity={0.45}
        strokeWidth={1} rx={2} />
      {values.map((v, i) => (
        <rect
          key={i}
          x={x + 1 + i * cellW}
          y={y + 1}
          width={cellW - 1}
          height={cellH - 2}
          fill={colorFn(v)}
        />
      ))}
    </g>
  )
}

/* ─────────── Scene 9 wrapper ─────────── */
export function LayerNormSplitPane() {
  const speed = useSpeed()
  // Sync phase chip with the viz's phase progression
  const PHASES = 5
  const phaseLabels = [
    'raw input',
    'subtract μ',
    'divide by σ',
    'apply γ, β',
    'output ready',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  return (
    <SplitPaneScene
      viz={<VizLayerNorm />}
      text={{
        kicker: ACT2_KICKER,
        title: 'Re-center. Re-scale. Re-tilt.',
        subtitle: (
          <>
            Before each sublayer the activations get a controlled
            distribution, then learnable γ and β tune it.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'norm dim', value: '384' },
          { label: 'γ params', value: '384' },
          { label: 'β params', value: '384' },
          { label: 'ε', value: '1e-5' },
        ],
        equation: {
          label: 'how each token is normalized',
          body: (
            <>
              LN(x) = γ ·{' '}
              <span style={{ color: ACCENT.cyan }}>(x − μ) / σ</span>
              {' + β'}
            </>
          ),
        },
        infoCallout:
          'LayerNorm runs per-token-vector — across the 384 dims of one token, NOT across tokens or batch. Different from BatchNorm.',
      }}
    />
  )
}


/* =========================================================================
 * Scene 10 — qkv: "One vector. Three roles."
 *
 * Visual story per design feedback:
 *   1. The source vector is explicitly LN(x) — picks up where Scene 9 ended.
 *   2. ONE primary teaching visualization: the branching pipeline. The
 *      same LN(x) is fanned out into three lanes, each multiplied by a
 *      learned matrix, producing Q / K / V output vectors.
 *   3. Each lane reads as a mini pipeline:
 *         LN(x)  →  W_Q  →  Q   (amber, query)
 *         LN(x)  →  W_K  →  K   (blue, key)
 *         LN(x)  →  W_V  →  V   (mint, value)
 *   4. Q, K, V are rendered as parallel-shaped vectors with consistent
 *      cell layout — they're three different vectors from the same source.
 *   5. Explicit role labels under each: "query / key / value" plus the
 *      one-line intuitive caption.
 *   6. Bottom handoff cue: "NEXT: compare Q against all K → attention scores"
 * ====================================================================== */

const COL_Q = '#f59e0b' // amber
const COL_K = '#60a5fa' // blue
const COL_V = '#34d399' // green/mint

export function VizQKV() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const tokens = (prompt || 'To be, or not to be').split('').slice(0, 14)
  const FOCUSED = 3

  // Phase cycle: which lane is "active" right now (0=Q, 1=K, 2=V, 3=all settled)
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // ── Math: deterministic signed values for source vector + matrix → output ──
  const D = 12
  const LN_VALUES = Array.from({ length: D }).map(
    (_, i) => Math.sin(i * 1.27 + 2.1) * 0.85,
  )
  // Synthesize Q/K/V from the source so each output looks like a real
  // projection — different mixes, different per-dim values
  const projectionFor = (whichSeed: number): number[] =>
    Array.from({ length: D }).map((_, i) => {
      const a = Math.sin(i * 0.9 + whichSeed * 1.3)
      const b = Math.cos(i * 0.6 + whichSeed * 0.7 + 0.4)
      return Math.max(-1, Math.min(1, (a * 0.6 + b * 0.5) * 0.9))
    })
  const Q_VALUES = projectionFor(1)
  const K_VALUES = projectionFor(2)
  const V_VALUES = projectionFor(3)

  // Diverging color (positive accent, negative muted red), tinted by the
  // lane's color
  const colorForVal = (v: number, accent: string): string => {
    if (v >= 0) {
      const a = Math.round((0.10 + Math.min(1, v) * 0.62) * 255)
        .toString(16)
        .padStart(2, '0')
      return `${accent}${a}`
    }
    const a = 0.10 + Math.min(1, -v) * 0.55
    return `rgba(248,113,113,${a})`
  }

  // ── Geometry ──────────────────────────────────────────────────────────
  // Source LN(x) vector
  const SRC_X = 100
  const SRC_TOP = 320
  const SRC_W = 60
  const SRC_CELL_H = 30
  const SRC_BOT = SRC_TOP + D * SRC_CELL_H // 680

  // Three weight matrices in middle
  const MATRIX_X = 410
  const MATRIX_W = 130
  const MATRIX_H = 100
  const LANE_Y = [240, 460, 680] // y-center for Q, K, V lanes

  // Three output vectors on the right
  const OUT_X = 700
  const OUT_W = 60
  const OUT_CELL_H = 18
  const OUT_H = D * OUT_CELL_H // 216

  // Right-side labels
  const LABEL_X = 800
  const ROLE_NAMES = ['query', 'key', 'value']
  const ROLE_BLURBS = [
    'what this token is asking',
    'how this token can be found',
    'what this token contributes',
  ]
  const ROLE_COLORS = [COL_Q, COL_K, COL_V]
  const ROLE_LETTERS = ['Q', 'K', 'V']
  const W_NAMES = ['W_Q', 'W_K', 'W_V']

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="qkv-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="qkv-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* ────── Top kicker ────── */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          BLOCK 0 · ATTENTION · Q · K · V
        </text>

        {/* ────── Token strip with focused #3 ────── */}
        <g>
          <text x={20} y={84} fontSize="10" fontFamily="var(--font-mono)"
            fill={ACCENT.violet} letterSpacing="0.22em" opacity={0.85}>
            same focused token ▸
          </text>
          {tokens.map((ch, i) => {
            const cellW = 30
            const startX = 280
            const x = startX + i * (cellW + 4)
            const isFocused = i === FOCUSED
            return (
              <g key={`tok-${i}`}>
                {isFocused && (
                  <motion.rect
                    x={x - 2} y={64} width={cellW + 4} height={36} rx={4}
                    fill="rgba(167,139,250,0.18)"
                    stroke={ACCENT.violet}
                    strokeWidth={1.6}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{
                      duration: 2 / speed,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                <rect x={x} y={66} width={cellW} height={32} rx={3}
                  fill="rgba(167,139,250,0.04)"
                  stroke="rgba(167,139,250,0.32)"
                  strokeWidth={1} />
                <text x={x + cellW / 2} y={88} textAnchor="middle"
                  fontSize="15" fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={isFocused ? '#fff' : 'rgba(255,255,255,0.55)'}>
                  {ch === ' ' ? '·' : ch}
                </text>
              </g>
            )
          })}
        </g>

        {/* ────── Source vector — LN(x) ────── */}
        <g>
          {/* Math labels */}
          <text x={SRC_X + SRC_W / 2} y={SRC_TOP - 50} textAnchor="middle"
            fontSize="20" fontFamily="var(--font-display)" fontStyle="italic"
            fill={ACCENT.violet}>
            LN(x)
          </text>
          <text x={SRC_X + SRC_W / 2} y={SRC_TOP - 28} textAnchor="middle"
            fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}
            letterSpacing="0.22em">
            normalized · ℝ³⁸⁴
          </text>

          {/* Pulsing halo on source */}
          <motion.rect
            x={SRC_X - 6} y={SRC_TOP - 6}
            width={SRC_W + 12} height={D * SRC_CELL_H + 12}
            rx={5}
            fill="rgba(167,139,250,0.06)"
            stroke={ACCENT.violet}
            strokeWidth={2.2}
            strokeOpacity={0.85}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 3 / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Cells */}
          {LN_VALUES.map((v, i) => (
            <rect
              key={`src-${i}`}
              x={SRC_X + 1}
              y={SRC_TOP + i * SRC_CELL_H + 1}
              width={SRC_W - 2}
              height={SRC_CELL_H - 2}
              fill={colorForVal(v, ACCENT.violet)}
            />
          ))}

          {/* "From Scene 9" continuity hint */}
          <text x={SRC_X + SRC_W / 2} y={SRC_BOT + 24}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={ACCENT.cyan}
            opacity={0.65}
            letterSpacing="0.2em">
            ◂ from LayerNorm
          </text>
        </g>

        {/* ────── Branch fan-out: 3 curved arrows from source to each W matrix ────── */}
        {[0, 1, 2].map((lane) => {
          const startX = SRC_X + SRC_W
          const startY = SRC_TOP + D * SRC_CELL_H / 2
          const endX = MATRIX_X - 6
          const endY = LANE_Y[lane]
          // Curve through a control point
          const ctrlX = (startX + endX) / 2 + 30
          const ctrlY = endY
          const isActive = phase === lane || phase === 3
          return (
            <motion.path
              key={`branch-${lane}`}
              d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY}, ${endX} ${endY}`}
              stroke={ROLE_COLORS[lane]}
              strokeWidth={isActive ? 2.4 : 1.2}
              strokeOpacity={isActive ? 0.95 : 0.45}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                strokeOpacity: isActive ? 0.95 : 0.45,
              }}
              transition={{
                pathLength: { duration: 0.7 / speed, delay: (0.4 + lane * 0.12) / speed },
                strokeOpacity: { duration: 0.4 / speed },
              }}
            />
          )
        })}

        {/* ────── Three weight matrices (W_Q, W_K, W_V) ────── */}
        {[0, 1, 2].map((lane) => {
          const yCenter = LANE_Y[lane]
          const yTop = yCenter - MATRIX_H / 2
          const isActive = phase === lane || phase === 3
          const accent = ROLE_COLORS[lane]
          return (
            <g key={`mat-${lane}`}>
              {/* Matrix grid — 9 cols × 6 rows */}
              <motion.g
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.55 }}
                transition={{ duration: 0.4 / speed }}
              >
                <rect
                  x={MATRIX_X}
                  y={yTop}
                  width={MATRIX_W}
                  height={MATRIX_H}
                  rx={3}
                  fill={`${accent}10`}
                  stroke={accent}
                  strokeWidth={isActive ? 2 : 1.2}
                  strokeOpacity={isActive ? 0.95 : 0.55}
                />
                {/* Cell grid suggestive of the 384×384 matrix shape */}
                {Array.from({ length: 6 }).map((_, r) =>
                  Array.from({ length: 9 }).map((_, c) => {
                    const cw = (MATRIX_W - 8) / 9
                    const ch = (MATRIX_H - 8) / 6
                    const seed = (lane * 31 + r * 7 + c * 13) % 100
                    return (
                      <rect
                        key={`${r}-${c}`}
                        x={MATRIX_X + 4 + c * cw}
                        y={yTop + 4 + r * ch}
                        width={cw - 0.5}
                        height={ch - 0.5}
                        fill={accent}
                        opacity={0.10 + (seed % 35) / 200}
                      />
                    )
                  }),
                )}
                {/* Matrix label inside */}
                <text
                  x={MATRIX_X + MATRIX_W / 2}
                  y={yCenter + 4}
                  textAnchor="middle"
                  fontSize="22"
                  fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={accent}
                  opacity={0.95}
                >
                  {W_NAMES[lane]}
                </text>
              </motion.g>
              {/* Shape label below matrix */}
              <text
                x={MATRIX_X + MATRIX_W / 2}
                y={yTop + MATRIX_H + 16}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
                letterSpacing="0.18em"
                opacity={isActive ? 0.85 : 0.5}
              >
                ℝ³⁸⁴ ˣ ³⁸⁴
              </text>
            </g>
          )
        })}

        {/* ────── Connectors: matrix → output vector ────── */}
        {[0, 1, 2].map((lane) => {
          const startX = MATRIX_X + MATRIX_W
          const yCenter = LANE_Y[lane]
          const endX = OUT_X
          const endY = LANE_Y[lane]
          const isActive = phase === lane || phase === 3
          return (
            <g key={`mat-out-${lane}`}>
              <motion.path
                d={`M ${startX + 4} ${yCenter} L ${endX - 14} ${endY}`}
                stroke={ROLE_COLORS[lane]}
                strokeWidth={isActive ? 2.4 : 1.2}
                strokeOpacity={isActive ? 0.95 : 0.45}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.5 / speed,
                  delay: (1.0 + lane * 0.12) / speed,
                }}
              />
              {/* Arrowhead */}
              <path
                d={`M ${endX - 18} ${endY - 5} L ${endX - 8} ${endY} L ${endX - 18} ${endY + 5}`}
                stroke={ROLE_COLORS[lane]}
                strokeWidth={isActive ? 2.2 : 1.2}
                strokeOpacity={isActive ? 0.95 : 0.55}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )
        })}

        {/* ────── Output vectors Q, K, V ────── */}
        {[0, 1, 2].map((lane) => {
          const yCenter = LANE_Y[lane]
          const yTop = yCenter - OUT_H / 2
          const accent = ROLE_COLORS[lane]
          const values = [Q_VALUES, K_VALUES, V_VALUES][lane]
          const isActive = phase === lane || phase === 3
          return (
            <g key={`out-${lane}`}>
              {/* Output halo for active */}
              {isActive && (
                <motion.rect
                  x={OUT_X - 8} y={yTop - 8}
                  width={OUT_W + 16} height={OUT_H + 16}
                  rx={6}
                  fill={`${accent}10`}
                  filter="url(#qkv-glow)"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.45, 0.85, 0.45] }}
                  transition={{
                    duration: 2.4 / speed,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              {/* Outline */}
              <rect
                x={OUT_X}
                y={yTop}
                width={OUT_W}
                height={OUT_H}
                rx={3}
                fill="none"
                stroke={accent}
                strokeWidth={isActive ? 2.2 : 1.4}
                strokeOpacity={isActive ? 1 : 0.6}
              />
              {/* Cells */}
              {values.map((v, i) => (
                <rect
                  key={`out-cell-${lane}-${i}`}
                  x={OUT_X + 1}
                  y={yTop + i * OUT_CELL_H + 1}
                  width={OUT_W - 2}
                  height={OUT_CELL_H - 2}
                  fill={colorForVal(v, accent)}
                />
              ))}
              {/* Big italic letter overlay (Q, K, V) above the vector */}
              <text
                x={OUT_X + OUT_W / 2}
                y={yTop - 16}
                textAnchor="middle"
                fontSize="32"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={accent}
              >
                {ROLE_LETTERS[lane]}
              </text>
              {/* Shape under the vector */}
              <text
                x={OUT_X + OUT_W / 2}
                y={yTop + OUT_H + 16}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
                letterSpacing="0.18em"
                opacity={0.7}
              >
                ∈ ℝ³⁸⁴
              </text>
            </g>
          )
        })}

        {/* ────── Right-side role labels ────── */}
        {[0, 1, 2].map((lane) => {
          const yCenter = LANE_Y[lane]
          const accent = ROLE_COLORS[lane]
          return (
            <g key={`label-${lane}`}>
              {/* "Q = query" */}
              <text
                x={LABEL_X}
                y={yCenter - 18}
                fontSize="20"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={accent}
              >
                {ROLE_LETTERS[lane]}
              </text>
              <text
                x={LABEL_X + 30}
                y={yCenter - 18}
                fontSize="13"
                fontFamily="var(--font-mono)"
                fill={accent}
                letterSpacing="0.18em"
                opacity={0.85}
              >
                = {ROLE_NAMES[lane]}
              </text>
              {/* Intuitive blurb */}
              <text
                x={LABEL_X}
                y={yCenter + 4}
                fontSize="12"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill="rgba(255,255,255,0.65)"
              >
                {ROLE_BLURBS[lane]}
              </text>
              {/* Role pipeline summary, quiet */}
              <text
                x={LABEL_X}
                y={yCenter + 24}
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
                letterSpacing="0.18em"
                opacity={0.6}
              >
                LN(x) · {W_NAMES[lane]} = {ROLE_LETTERS[lane]}
              </text>
            </g>
          )
        })}

        {/* ────── Pipeline summary line at top ────── */}
        <motion.text
          x={700}
          y={170}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill="rgba(255,255,255,0.78)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 0.8 / speed, duration: 0.5 / speed }}
        >
          one vector, three learned projections, three different vectors
        </motion.text>

        {/* ────── Handoff cue at bottom ────── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0.55 }}
          transition={{ duration: 0.5 / speed }}
        >
          <rect
            x={400}
            y={870}
            width={600}
            height={50}
            rx={6}
            fill="rgba(8,8,11,0.7)"
            stroke="rgba(167,139,250,0.32)"
            strokeWidth={1.2}
          />
          <text
            x={700}
            y={902}
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-mono)"
            fill={ACCENT.violet}
            letterSpacing="0.22em"
          >
            NEXT  →  compare{' '}
            <tspan fill={COL_Q} fontStyle="italic" fontFamily="var(--font-display)">
              Q
            </tspan>
            {' '}against all{' '}
            <tspan fill={COL_K} fontStyle="italic" fontFamily="var(--font-display)">
              K
            </tspan>
            {' '}→ attention scores
          </text>
        </motion.g>

        {/* ────── Bottom italic caption ────── */}
        <text
          x={700}
          y={970}
          textAnchor="middle"
          fontSize="13"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={ACCENT.dim}
          opacity={0.85}
        >
          Same input. Three different learned matrices. Three vectors with three different jobs.
        </text>
      </svg>
    </div>
  )
}

/* ─────────── Scene 10 wrapper ─────────── */
export function QKVSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const phaseLabels = [
    'projecting Q',
    'projecting K',
    'projecting V',
    'all three ready',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      2400 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  return (
    <SplitPaneScene
      viz={<VizQKV />}
      text={{
        kicker: ACT2_KICKER,
        title: 'One vector. Three roles.',
        subtitle: (
          <>
            Three small learned matrices project the same LN(x) into a
            <span style={{ color: COL_Q }}> query</span>, a
            <span style={{ color: COL_K }}> key</span>, and a
            <span style={{ color: COL_V }}> value</span> — three different
            views of the same token.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'd_model', value: '384' },
          { label: 'd_k', value: '64', color: COL_Q },
          { label: 'heads', value: '6' },
          { label: 'params/W', value: '147 K' },
        ],
        equation: {
          label: 'three learned projections',
          body: (
            <>
              <span style={{ color: COL_Q }}>Q</span> = LN(x) W
              <sub style={{ color: COL_Q }}>Q</sub>
              <br />
              <span style={{ color: COL_K }}>K</span> = LN(x) W
              <sub style={{ color: COL_K }}>K</sub>
              <br />
              <span style={{ color: COL_V }}>V</span> = LN(x) W
              <sub style={{ color: COL_V }}>V</sub>
            </>
          ),
        },
        infoCallout:
          'Q and K must share dimension (they meet via dot product), but V can encode anything. All three are learned — they start random and the network figures out what each should carry.',
      }}
    />
  )
}


/* =========================================================================
 * Scene 11 — attn: "Attention — 4 sub-phases."
 *
 * Visual story per design feedback:
 *   - Same focused token (position 4 = ',') persists across all 4 phases
 *     so continuity is unmistakable.
 *   - Left side: small persistent "INSIDE A BLOCK" anchor diagram that
 *     subtly responds to the current sub-phase (different highlights in
 *     the attention compartment).
 *   - Right side: big phase-specific teaching graphic that switches every
 *     ~10s. Each phase reads as one beat of attention:
 *       A  one query looks backward  (causal, backward arcs)
 *       B  full Q·Kᵀ matrix          (rows=queries, cols=keys, masked)
 *       C  row-wise softmax           (raw scores → weights summing to 1)
 *       D  weights pull from V        (weighted sum → output vector)
 *   - Q = amber, K = blue, V = mint (continuity with Scene 10 colors).
 * ====================================================================== */

const COL_Q_ATT = '#f59e0b'
const COL_K_ATT = '#60a5fa'
const COL_V_ATT = '#34d399'

export function VizAttention() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const tokens = (prompt || 'To be, or not to be').split('').slice(0, 19)
  const T = tokens.length
  const FOCUSED = Math.min(4, T - 1)

  // 4 phases, each ~10s
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      9500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Deterministic raw scores for the focused row (position FOCUSED)
  // Earlier positions get real values; future positions are -∞ (masked)
  const rawScoresRow = Array.from({ length: T }).map((_, j) => {
    if (j > FOCUSED) return -Infinity
    return Math.sin(j * 1.3 + 0.7) * 1.2 + Math.cos(j * 0.5) * 0.4
  })
  // Softmax of the row
  const softmaxRow = (() => {
    const visible = rawScoresRow.filter((v) => v !== -Infinity)
    const maxV = Math.max(...visible)
    const exps = rawScoresRow.map((v) =>
      v === -Infinity ? 0 : Math.exp(v - maxV),
    )
    const sum = exps.reduce((a, b) => a + b, 0)
    return exps.map((e) => e / sum)
  })()

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="attn-glow"><feGaussianBlur stdDeviation="2.5" /></filter>
          <filter id="attn-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* ────── Top kicker + token strip ────── */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          BLOCK 0 · ATTENTION · 4 SUB-PHASES
        </text>
        <AttentionTokenStrip tokens={tokens} focused={FOCUSED} speed={speed} />

        {/* ────── Persistent left anchor: "INSIDE A BLOCK" ────── */}
        <BlockAnchor
          tokens={tokens}
          focused={FOCUSED}
          phase={phase}
          speed={speed}
        />

        {/* ────── Phase-specific teaching viz on the right ──────
            Wrapped in motion.g keyed on phase so the entire phase content
            crossfades on transition. Each phase's internal animations
            re-trigger on remount (initial → animate). */}
        <motion.g
          key={`phase-${phase}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 / speed, ease: 'easeOut' }}
        >
          {phase === 0 && (
            <PhaseA tokens={tokens} focused={FOCUSED} speed={speed} />
          )}
          {phase === 1 && (
            <PhaseB
              tokens={tokens}
              focused={FOCUSED}
              speed={speed}
              rawScoresRow={rawScoresRow}
            />
          )}
          {phase === 2 && (
            <PhaseC
              tokens={tokens}
              focused={FOCUSED}
              speed={speed}
              rawScoresRow={rawScoresRow}
              softmaxRow={softmaxRow}
            />
          )}
          {phase === 3 && (
            <PhaseD
              tokens={tokens}
              focused={FOCUSED}
              speed={speed}
              softmaxRow={softmaxRow}
            />
          )}
        </motion.g>

        {/* ────── Phase summary strip at bottom (active letter highlighted) ────── */}
        <PhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── Token strip (top of canvas) ─────────── */
function AttentionTokenStrip({
  tokens,
  focused,
  speed,
}: {
  tokens: string[]
  focused: number
  speed: number
}) {
  const cellW = 32
  const startX = 80
  return (
    <g>
      <text x={20} y={84} fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.violet} letterSpacing="0.22em" opacity={0.85}>
        TOKENS ▸
      </text>
      {tokens.map((ch, i) => {
        const x = startX + i * (cellW + 4)
        const isFocused = i === focused
        return (
          <g key={`tok-${i}`}>
            {isFocused && (
              <motion.rect
                x={x - 2} y={64} width={cellW + 4} height={36} rx={4}
                fill="rgba(96,165,250,0.22)"
                stroke={COL_K_ATT}
                strokeWidth={1.8}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 2 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <rect x={x} y={66} width={cellW} height={32} rx={3}
              fill="rgba(167,139,250,0.04)"
              stroke="rgba(167,139,250,0.22)"
              strokeWidth={1} />
            <text x={x + cellW / 2} y={88} textAnchor="middle"
              fontSize="14" fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={isFocused ? '#fff' : 'rgba(255,255,255,0.55)'}>
              {ch === ' ' ? '·' : ch}
            </text>
            {/* Position number under each cell */}
            <text x={x + cellW / 2} y={114} textAnchor="middle"
              fontSize="9" fontFamily="var(--font-mono)"
              fill={isFocused ? COL_K_ATT : ACCENT.dim}>
              {i}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── Persistent left anchor: "INSIDE A BLOCK" diagram ─────────── */
function BlockAnchor({
  tokens,
  focused,
  phase,
  speed,
}: {
  tokens: string[]
  focused: number
  phase: number
  speed: number
}) {
  // Geometry — small diagram on the left side of the viewBox
  const X = 20
  const Y = 180
  const W = 360
  const H = 540

  // Phase-specific caption
  const captions = [
    "One query looking backward at earlier keys.",
    "All query-key pairs scored at once (Q·Kᵀ).",
    "One row's scores normalized into weights.",
    "Weights pulling V vectors into one output.",
  ]

  // Mini token row at top of the block — active token highlighted
  const miniTokenW = 16
  const miniTokenStart = X + 30
  const miniTokenY = Y + 50

  return (
    <g>
      {/* Outer frame */}
      <rect x={X} y={Y} width={W} height={H} rx={8}
        fill="rgba(167,139,250,0.025)"
        stroke="rgba(167,139,250,0.32)"
        strokeWidth={1.6} />

      {/* Header */}
      <text x={X + W / 2} y={Y + 22} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.24em">
        INSIDE A BLOCK
      </text>
      <text x={X + W / 2} y={Y + 50} textAnchor="middle"
        fontSize="22" fontFamily="var(--font-display)"
        fontStyle="italic" fill="rgba(255,255,255,0.92)">
        Attention
      </text>

      {/* Mini token row */}
      <g transform={`translate(0, 32)`}>
        {tokens.slice(0, 12).map((ch, i) => {
          const x = miniTokenStart + i * miniTokenW
          const isFocused = i === focused
          return (
            <rect
              key={`mt-${i}`}
              x={x}
              y={miniTokenY}
              width={miniTokenW - 1}
              height={20}
              rx={1.5}
              fill={isFocused
                ? 'rgba(96,165,250,0.40)'
                : 'rgba(167,139,250,0.08)'}
              stroke={isFocused ? COL_K_ATT : 'rgba(167,139,250,0.35)'}
              strokeWidth={isFocused ? 1.4 : 0.6}
            />
          )
        })}
        {/* Q^K label above active */}
        <text
          x={miniTokenStart + focused * miniTokenW + miniTokenW / 2}
          y={miniTokenY - 8}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COL_Q_ATT}
        >
          Q
          <tspan fontSize="8" dy="-3">K</tspan>
        </text>
        <text
          x={miniTokenStart + focused * miniTokenW + miniTokenW / 2}
          y={miniTokenY + 32}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COL_K_ATT}
        >
          ↓
        </text>
      </g>

      {/* Backward arcs from focused token to earlier tokens */}
      {Array.from({ length: focused }).map((_, j) => {
        const fromX = miniTokenStart + focused * miniTokenW + miniTokenW / 2
        const fromY = miniTokenY + 18
        const toX = miniTokenStart + j * miniTokenW + miniTokenW / 2
        const toY = miniTokenY + 18
        const ctrlY = miniTokenY - 32 - (focused - j) * 4
        const ts = [0, 0.2, 0.4, 0.6, 0.8, 1]
        const cxs = ts.map(
          (t) => Math.pow(1 - t, 2) * fromX + 2 * (1 - t) * t * ((fromX + toX) / 2) + t * t * toX,
        )
        const cys = ts.map(
          (t) => Math.pow(1 - t, 2) * fromY + 2 * (1 - t) * t * ctrlY + t * t * toY,
        )
        return (
          <g key={`anchor-arc-${j}`}>
            <motion.path
              d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${ctrlY}, ${toX} ${toY}`}
              stroke={COL_Q_ATT}
              strokeWidth={1.2}
              fill="none"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: [0.4, 0.85, 0.4] }}
              transition={{
                pathLength: { duration: 0.6 / speed, delay: (j * 0.05) / speed },
                opacity: {
                  duration: 2.0 / speed,
                  delay: (1.0 + j * 0.12) / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
            {/* Continuously traveling particle */}
            <motion.circle
              r={1.8}
              fill={COL_Q_ATT}
              initial={{ cx: fromX, cy: fromY, opacity: 0 }}
              animate={{
                cx: cxs,
                cy: cys,
                opacity: [0, 1, 1, 1, 1, 0],
              }}
              transition={{
                duration: 1.5 / speed,
                delay: (1.0 + j * 0.15) / speed,
                repeat: Infinity,
                repeatDelay: 0.4 / speed,
                ease: 'easeInOut',
              }}
            />
          </g>
        )
      })}

      {/* Three-zone interior: Layer Input | Attention/MLP | Residual Stream */}
      {(() => {
        const zoneY = Y + 200
        const zoneH = 240
        const layerInputX = X + 16
        const layerInputW = 36
        const attMlpX = layerInputX + layerInputW + 12
        const attMlpW = 200
        const residualX = attMlpX + attMlpW + 12
        const residualW = 80

        // Phase-driven highlight: which inner subarea glows?
        // A: query token (already shown above)
        // B: scoring grid inside Attention compartment
        // C: softmax row
        // D: residual stream / V mixing

        return (
          <>
            {/* Layer Input strip (left) — red/amber stack */}
            <g>
              {Array.from({ length: 6 }).map((_, k) => {
                const cellH = zoneH / 6 - 2
                return (
                  <rect
                    key={`li-${k}`}
                    x={layerInputX}
                    y={zoneY + k * (cellH + 2)}
                    width={layerInputW}
                    height={cellH}
                    rx={1}
                    fill="rgba(248,113,113,0.30)"
                  />
                )
              })}
              <text
                x={layerInputX + layerInputW / 2}
                y={zoneY + zoneH + 18}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
                letterSpacing="0.14em"
              >
                Layer
              </text>
              <text
                x={layerInputX + layerInputW / 2}
                y={zoneY + zoneH + 30}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
                letterSpacing="0.14em"
              >
                Input
              </text>
            </g>

            {/* Attention/MLP compartment */}
            <g>
              <rect
                x={attMlpX}
                y={zoneY}
                width={attMlpW}
                height={zoneH}
                rx={3}
                fill="rgba(255,255,255,0.018)"
                stroke={
                  phase === 1
                    ? COL_K_ATT
                    : 'rgba(167,139,250,0.22)'
                }
                strokeWidth={phase === 1 ? 1.8 : 1}
              />
              {/* Inside: phase-specific overlay */}
              {phase === 0 && (
                <text
                  x={attMlpX + attMlpW / 2}
                  y={zoneY + zoneH / 2 + 6}
                  textAnchor="middle"
                  fontSize="13"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.dim}
                  opacity={0.8}
                >
                  MLP
                </text>
              )}
              {phase === 1 && (
                <g>
                  {/* Mini score grid */}
                  <text
                    x={attMlpX + 8}
                    y={zoneY + 16}
                    fontSize="8"
                    fontFamily="var(--font-mono)"
                    fill={COL_K_ATT}
                    letterSpacing="0.18em"
                  >
                    Q · Kᵀ SCORES
                  </text>
                  {Array.from({ length: 6 }).map((_, r) =>
                    Array.from({ length: 8 }).map((_, c) => {
                      const cw = (attMlpW - 16) / 8
                      const ch = (zoneH - 30) / 6
                      const masked = c > r
                      return (
                        <rect
                          key={`scgrid-${r}-${c}`}
                          x={attMlpX + 8 + c * cw}
                          y={zoneY + 22 + r * ch}
                          width={cw - 0.5}
                          height={ch - 0.5}
                          fill={masked
                            ? 'rgba(248,113,113,0.10)'
                            : 'rgba(96,165,250,0.18)'}
                          stroke={masked ? 'rgba(248,113,113,0.18)' : 'rgba(96,165,250,0.32)'}
                          strokeWidth={0.5}
                        />
                      )
                    }),
                  )}
                </g>
              )}
              {phase === 2 && (
                <g>
                  <text
                    x={attMlpX + attMlpW / 2}
                    y={zoneY + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="var(--font-mono)"
                    fill={COL_Q_ATT}
                    letterSpacing="0.18em"
                  >
                    SOFTMAX
                  </text>
                  {/* Top: raw row */}
                  <g transform={`translate(${attMlpX + 12}, ${zoneY + 30})`}>
                    {Array.from({ length: 8 }).map((_, c) => (
                      <rect
                        key={`raw-${c}`}
                        x={c * 22}
                        y={0}
                        width={20}
                        height={20}
                        fill="rgba(96,165,250,0.18)"
                        stroke="rgba(96,165,250,0.45)"
                        strokeWidth={0.6}
                      />
                    ))}
                  </g>
                  {/* Arrow */}
                  <text
                    x={attMlpX + attMlpW / 2}
                    y={zoneY + 78}
                    textAnchor="middle"
                    fontSize="14"
                    fill={COL_Q_ATT}
                  >↓</text>
                  {/* Bottom: weights row */}
                  <g transform={`translate(${attMlpX + 12}, ${zoneY + 92})`}>
                    {Array.from({ length: 8 }).map((_, c) => {
                      const w = 0.05 + Math.abs(Math.sin(c * 0.9)) * 0.4
                      return (
                        <rect
                          key={`wt-${c}`}
                          x={c * 22}
                          y={0}
                          width={20}
                          height={20}
                          fill={`rgba(245,158,11,${w})`}
                          stroke={`rgba(245,158,11,${0.4 + w * 0.3})`}
                          strokeWidth={0.6}
                        />
                      )
                    })}
                  </g>
                  <text
                    x={attMlpX + attMlpW / 2}
                    y={zoneY + 144}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fill={ACCENT.dim}
                  >
                    sum = 1.00
                  </text>
                </g>
              )}
              {phase === 3 && (
                <g>
                  <text
                    x={attMlpX + attMlpW / 2}
                    y={zoneY + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="var(--font-mono)"
                    fill={COL_V_ATT}
                    letterSpacing="0.18em"
                  >
                    V WEIGHTED SUM
                  </text>
                  {/* Vectors flowing into output */}
                  {Array.from({ length: 5 }).map((_, k) => {
                    const yLane = zoneY + 30 + k * 28
                    return (
                      <g key={`vmix-${k}`}>
                        <line
                          x1={attMlpX + 12}
                          x2={attMlpX + attMlpW - 12}
                          y1={yLane + 8}
                          y2={yLane + 8}
                          stroke={COL_V_ATT}
                          strokeOpacity={0.4 + k * 0.1}
                          strokeWidth={1.4}
                        />
                        <text
                          x={attMlpX + attMlpW - 8}
                          y={yLane + 12}
                          fontSize="9"
                          fontFamily="var(--font-mono)"
                          fill={COL_V_ATT}
                          opacity={0.6}
                        >
                          ▸
                        </text>
                      </g>
                    )
                  })}
                </g>
              )}
            </g>

            {/* Residual Stream column (right) */}
            <g>
              <rect
                x={residualX}
                y={zoneY}
                width={residualW}
                height={zoneH}
                rx={3}
                fill={
                  phase === 3
                    ? 'rgba(52,211,153,0.10)'
                    : 'rgba(255,255,255,0.018)'
                }
                stroke={
                  phase === 3
                    ? COL_V_ATT
                    : 'rgba(167,139,250,0.22)'
                }
                strokeWidth={phase === 3 ? 1.8 : 1}
              />
              <text
                x={residualX + residualW / 2}
                y={zoneY + zoneH / 2 - 8}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill={
                  phase === 3 ? COL_V_ATT : ACCENT.dim
                }
                letterSpacing="0.18em"
              >
                Residual
              </text>
              <text
                x={residualX + residualW / 2}
                y={zoneY + zoneH / 2 + 6}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill={
                  phase === 3 ? COL_V_ATT : ACCENT.dim
                }
                letterSpacing="0.18em"
              >
                Stream
              </text>
            </g>

            {/* ── Continuous cross-zone data flow particles ──
                LayerInput → Attention compartment → Residual stream.
                These run regardless of phase to keep the anchor alive. */}
            {Array.from({ length: 7 }).map((_, k) => {
              const startX = layerInputX + layerInputW + 2
              const endX = residualX - 2
              const yLane = zoneY + 16 + ((k * 31) % (zoneH - 32))
              return (
                <motion.circle
                  key={`anchor-flow-${k}`}
                  r={1.6}
                  fill={COL_Q_ATT}
                  initial={{ cx: startX, cy: yLane, opacity: 0 }}
                  animate={{
                    cx: [startX, attMlpX + 4, attMlpX + attMlpW - 4, endX],
                    opacity: [0, 0.7, 0.55, 0],
                  }}
                  transition={{
                    duration: 3.6 / speed,
                    delay: (k * 0.45) / speed,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )
            })}

            {/* Subtle breathing on the active compartment border */}
            <motion.rect
              x={attMlpX - 2}
              y={zoneY - 2}
              width={attMlpW + 4}
              height={zoneH + 4}
              rx={4}
              fill="none"
              stroke={COL_K_ATT}
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{
                duration: 2.6 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )
      })()}

      {/* Bottom caption — phase-driven */}
      <motion.text
        key={`anchor-cap-${phase}`}
        x={X + W / 2}
        y={Y + H - 18}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill="rgba(255,255,255,0.7)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 / speed }}
      >
        {captions[phase]}
      </motion.text>
    </g>
  )
}

/* ─────────── Phase A — one-query backward arcs ─────────── */
function PhaseA({
  tokens,
  focused,
  speed,
}: {
  tokens: string[]
  focused: number
  speed: number
}) {
  const T = tokens.length
  // Token row geometry (right-side viz area)
  const X0 = 460
  const X1 = 1380
  const ROW_Y = 480
  const cellW = (X1 - X0 - 20) / T
  const cellH = 60
  const tokX = (i: number) => X0 + i * cellW + cellW / 2

  return (
    <g>
      <PhaseHeader
        phase="A"
        title="One query looks backward."
        sub="The query at position i compares against all keys at positions ≤ i."
      />

      {/* "KEYS (≤ i)" bracket label above earlier tokens */}
      <g>
        <line
          x1={X0 + 8}
          x2={tokX(focused) - cellW / 2 - 6}
          y1={ROW_Y - 60}
          y2={ROW_Y - 60}
          stroke={COL_Q_ATT}
          strokeWidth={1.4}
          strokeOpacity={0.7}
        />
        <text
          x={(X0 + tokX(focused) - cellW / 2) / 2 + 80}
          y={ROW_Y - 70}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill={COL_Q_ATT}
          letterSpacing="0.22em"
        >
          KEYS (≤ i)
        </text>
      </g>

      {/* Q label above the focused token */}
      <text
        x={tokX(focused)}
        y={ROW_Y - 60}
        textAnchor="middle"
        fontSize="20"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COL_K_ATT}
      >
        Q
      </text>
      {/* Down arrow into the focused token */}
      <path
        d={`M ${tokX(focused)} ${ROW_Y - 50} L ${tokX(focused)} ${ROW_Y - cellH / 2 - 4} M ${tokX(focused) - 6} ${ROW_Y - cellH / 2 - 12} L ${tokX(focused)} ${ROW_Y - cellH / 2 - 4} L ${tokX(focused) + 6} ${ROW_Y - cellH / 2 - 12}`}
        stroke={COL_K_ATT}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />

      {/* Token row */}
      {tokens.map((ch, i) => {
        const x = tokX(i)
        const isFocused = i === focused
        const isKey = i < focused
        return (
          <g key={`a-tok-${i}`}>
            <rect
              x={x - cellW / 2 + 2}
              y={ROW_Y - cellH / 2}
              width={cellW - 4}
              height={cellH}
              rx={4}
              fill={
                isFocused
                  ? 'rgba(96,165,250,0.20)'
                  : isKey
                    ? 'rgba(245,158,11,0.06)'
                    : 'rgba(255,255,255,0.015)'
              }
              stroke={
                isFocused
                  ? COL_K_ATT
                  : isKey
                    ? COL_Q_ATT
                    : 'rgba(255,255,255,0.18)'
              }
              strokeWidth={isFocused ? 2 : isKey ? 1.4 : 0.8}
              strokeOpacity={isFocused ? 1 : isKey ? 0.7 : 0.4}
            />
            <text
              x={x}
              y={ROW_Y + 8}
              textAnchor="middle"
              fontSize="20"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={isFocused ? '#fff' : isKey ? '#fff' : 'rgba(255,255,255,0.4)'}
            >
              {ch === ' ' ? '·' : ch}
            </text>
            <text
              x={x}
              y={ROW_Y + cellH / 2 + 18}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={isFocused ? COL_K_ATT : isKey ? COL_Q_ATT : ACCENT.dim}
            >
              {i}
            </text>
          </g>
        )
      })}

      {/* Backward arcs from focused token to each earlier key */}
      {Array.from({ length: focused }).map((_, j) => {
        const fromX = tokX(focused)
        const fromY = ROW_Y - cellH / 2
        const toX = tokX(j)
        const toY = ROW_Y - cellH / 2
        const arcHeight = 70 + (focused - j) * 8
        const ctrlY = fromY - arcHeight
        // Sample points along the quadratic Bezier for traveling particle
        const ts = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]
        const cxs = ts.map(
          (t) => Math.pow(1 - t, 2) * fromX + 2 * (1 - t) * t * ((fromX + toX) / 2) + t * t * toX,
        )
        const cys = ts.map(
          (t) => Math.pow(1 - t, 2) * fromY + 2 * (1 - t) * t * ctrlY + t * t * toY,
        )
        return (
          <motion.g key={`arc-${j}`}>
            {/* Initial draw — once */}
            <motion.path
              d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${ctrlY}, ${toX} ${toY}`}
              stroke={COL_Q_ATT}
              strokeWidth={2}
              strokeOpacity={0.85}
              fill="none"
              filter="url(#attn-glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.6 / speed,
                delay: (0.4 + j * 0.12) / speed,
              }}
            />
            {/* Continuous opacity pulse on top of the drawn arc */}
            <motion.path
              d={`M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${ctrlY}, ${toX} ${toY}`}
              stroke={COL_Q_ATT}
              strokeWidth={2.4}
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{
                duration: 2.4 / speed,
                delay: (1.2 + j * 0.18) / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Arrowhead near the key */}
            <motion.path
              d={`M ${toX - 5} ${toY - 8} L ${toX} ${toY - 2} L ${toX + 5} ${toY - 8}`}
              stroke={COL_Q_ATT}
              strokeWidth={2}
              strokeOpacity={0.9}
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (1.0 + j * 0.12) / speed }}
            />
            {/* Continuously traveling particle along the arc */}
            <motion.circle
              r={3.5}
              fill={COL_Q_ATT}
              filter="url(#attn-glow)"
              initial={{ cx: fromX, cy: fromY, opacity: 0 }}
              animate={{
                cx: cxs,
                cy: cys,
                opacity: [0, 1, 1, 1, 1, 1, 1, 0],
              }}
              transition={{
                duration: 1.7 / speed,
                delay: (1.4 + j * 0.18) / speed,
                repeat: Infinity,
                repeatDelay: 0.6 / speed,
                ease: 'easeInOut',
              }}
            />
          </motion.g>
        )
      })}

      {/* "POSITIONS" label */}
      <text
        x={X0 + 12}
        y={ROW_Y + cellH / 2 + 50}
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={ACCENT.dim}
        letterSpacing="0.22em"
      >
        POSITIONS
      </text>

      {/* Bottom caption box */}
      <PhaseFooter>
        <tspan>
          Query at position{' '}
          <tspan fill={COL_K_ATT} fontStyle="italic">i</tspan>
          {' '}(here{' '}
          <tspan fill={COL_K_ATT} fontStyle="italic">i</tspan>
          {' = '}
          <tspan fill={COL_K_ATT}>{focused}</tspan>
          ) compares with keys at positions{' '}
          <tspan fill={COL_Q_ATT}>0</tspan>
          ..
          <tspan fill={COL_Q_ATT} fontStyle="italic">i</tspan>
          .
        </tspan>
      </PhaseFooter>
    </g>
  )
}

/* ─────────── Phase B — full Q·Kᵀ matrix ─────────── */
function PhaseB({
  tokens,
  focused,
  speed,
  rawScoresRow,
}: {
  tokens: string[]
  focused: number
  speed: number
  rawScoresRow: number[]
}) {
  const T = tokens.length
  // Show condensed: 7 row labels visible (T, o, b, e, ',', o, ⋮, last)
  const X0 = 460
  const X1 = 1380
  const matrixX = X0 + 80
  const matrixY = 290
  const visibleRows = Math.min(7, T)
  const cellW = (X1 - matrixX - 30) / T
  const cellH = 30
  const matrixW = T * cellW
  const matrixH = (visibleRows + 1) * cellH // +1 for the ellipsis row

  return (
    <g>
      <PhaseHeader
        phase="B"
        title="Every query-key pair gets a score."
        sub={
          <>
            We compute the raw attention scores:{' '}
            <tspan fill={COL_K_ATT} fontStyle="italic">S = Q · Kᵀ</tspan>
            {' '}(scaled).
          </>
        }
      />

      {/* KEYS bracket header */}
      <line
        x1={matrixX}
        x2={matrixX + matrixW}
        y1={matrixY - 36}
        y2={matrixY - 36}
        stroke={COL_K_ATT}
        strokeWidth={1.4}
        strokeOpacity={0.7}
      />
      <text
        x={matrixX + matrixW / 2}
        y={matrixY - 48}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COL_K_ATT}
        letterSpacing="0.22em"
      >
        KEYS (columns)
      </text>

      {/* Column labels (KEYS) */}
      {tokens.map((ch, j) => (
        <g key={`b-col-${j}`}>
          <text
            x={matrixX + j * cellW + cellW / 2}
            y={matrixY - 16}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={
              j <= focused
                ? 'rgba(255,255,255,0.85)'
                : 'rgba(255,255,255,0.35)'
            }
          >
            {ch === ' ' ? '·' : ch}
          </text>
          <text
            x={matrixX + j * cellW + cellW / 2}
            y={matrixY - 4}
            textAnchor="middle"
            fontSize="8"
            fontFamily="var(--font-mono)"
            fill={ACCENT.dim}
          >
            {j}
          </text>
        </g>
      ))}

      {/* QUERIES label (rows) */}
      <text
        x={matrixX - 36}
        y={matrixY + visibleRows * cellH / 2}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COL_Q_ATT}
        letterSpacing="0.22em"
      >
        QUERIES
      </text>
      <text
        x={matrixX - 36}
        y={matrixY + visibleRows * cellH / 2 + 14}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill={ACCENT.dim}
      >
        (rows)
      </text>

      {/* Matrix rows (7 visible + ellipsis row at bottom) */}
      {Array.from({ length: visibleRows }).map((_, r) => {
        const ch = tokens[r]
        const isFocusedRow = r === focused
        return (
          <g key={`b-row-${r}`}>
            {/* Row label */}
            <text
              x={matrixX - 14}
              y={matrixY + r * cellH + cellH / 2 + 4}
              textAnchor="end"
              fontSize="13"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={isFocusedRow ? '#fff' : 'rgba(255,255,255,0.7)'}
            >
              {ch === ' ' ? '·' : ch}
            </text>
            <text
              x={matrixX - 4}
              y={matrixY + r * cellH + cellH / 2 + 4}
              textAnchor="end"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={isFocusedRow ? COL_K_ATT : ACCENT.dim}
            >
              {r}
            </text>

            {/* Active row arrow indicator — pulsing */}
            {isFocusedRow && (
              <motion.text
                x={matrixX - 56}
                y={matrixY + r * cellH + cellH / 2 + 5}
                fontSize="14"
                fill={COL_K_ATT}
                animate={{ x: [matrixX - 56, matrixX - 50, matrixX - 56] }}
                transition={{
                  duration: 1.4 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                →
              </motion.text>
            )}

            {/* Active row breathing halo */}
            {isFocusedRow && (
              <motion.rect
                x={matrixX - 4}
                y={matrixY + r * cellH - 2}
                width={tokens.length * cellW + 8}
                height={cellH + 4}
                rx={3}
                fill="none"
                stroke={COL_K_ATT}
                strokeWidth={2.4}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 2 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            {/* Cells */}
            {tokens.map((_, c) => {
              const masked = c > r
              const score = masked
                ? null
                : rawScoresRow[c] !== undefined && r === focused
                  ? rawScoresRow[c]
                  : Math.sin(r * 1.1 + c * 0.7) * 1.1
              return (
                <motion.g
                  key={`b-cell-${r}-${c}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3 / speed,
                    delay: ((r * 0.05 + c * 0.015)) / speed,
                  }}
                >
                  <rect
                    x={matrixX + c * cellW}
                    y={matrixY + r * cellH}
                    width={cellW - 1}
                    height={cellH - 1}
                    fill={
                      masked
                        ? 'rgba(248,113,113,0.10)'
                        : isFocusedRow
                          ? 'rgba(96,165,250,0.18)'
                          : 'rgba(96,165,250,0.06)'
                    }
                    stroke={
                      masked
                        ? 'rgba(248,113,113,0.45)'
                        : isFocusedRow
                          ? COL_K_ATT
                          : 'rgba(96,165,250,0.20)'
                    }
                    strokeWidth={isFocusedRow ? 1.4 : 0.6}
                    strokeDasharray={masked ? '3 3' : undefined}
                  />
                  <text
                    x={matrixX + c * cellW + cellW / 2}
                    y={matrixY + r * cellH + cellH / 2 + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fill={
                      masked
                        ? 'rgba(248,113,113,0.6)'
                        : isFocusedRow
                          ? '#fff'
                          : 'rgba(255,255,255,0.55)'
                    }
                  >
                    {masked ? '—' : score!.toFixed(2)}
                  </text>
                </motion.g>
              )
            })}
          </g>
        )
      })}

      {/* Ellipsis row */}
      <g>
        {tokens.map((_, c) => (
          <text
            key={`ellipsis-${c}`}
            x={matrixX + c * cellW + cellW / 2}
            y={matrixY + visibleRows * cellH + 16}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill={ACCENT.dim}
          >
            ⋮
          </text>
        ))}
      </g>

      {/* Last row */}
      <g>
        <text
          x={matrixX - 14}
          y={matrixY + matrixH + 12}
          textAnchor="end"
          fontSize="13"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill="rgba(255,255,255,0.7)"
        >
          {tokens[T - 1]}
        </text>
        <text
          x={matrixX - 4}
          y={matrixY + matrixH + 12}
          textAnchor="end"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={ACCENT.dim}
        >
          {T - 1}
        </text>
        {tokens.map((_, c) => {
          const score = Math.sin((T - 1) * 1.1 + c * 0.7) * 1.1
          return (
            <g key={`last-${c}`}>
              <rect
                x={matrixX + c * cellW}
                y={matrixY + matrixH}
                width={cellW - 1}
                height={cellH - 1}
                fill="rgba(96,165,250,0.06)"
                stroke="rgba(96,165,250,0.20)"
                strokeWidth={0.6}
              />
              <text
                x={matrixX + c * cellW + cellW / 2}
                y={matrixY + matrixH + cellH / 2 + 4}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="rgba(255,255,255,0.55)"
              >
                {score.toFixed(2)}
              </text>
            </g>
          )
        })}
      </g>

      {/* Footer caption */}
      <PhaseFooter>
        <tspan>
          Rows are queries. Columns are keys. Each cell is a raw score{' '}
          <tspan fill={COL_K_ATT} fontStyle="italic">(Q_i · K_j / √d_k)</tspan>
          . The red upper triangle is masked (future positions are not visible).
        </tspan>
      </PhaseFooter>
    </g>
  )
}

/* ─────────── Phase C — row-wise softmax ─────────── */
function PhaseC({
  tokens,
  focused,
  speed,
  rawScoresRow,
  softmaxRow,
}: {
  tokens: string[]
  focused: number
  speed: number
  rawScoresRow: number[]
  softmaxRow: number[]
}) {
  const T = tokens.length
  const X0 = 460
  const X1 = 1380
  const cellW = (X1 - X0 - 20) / T
  const RAW_Y = 320
  const WTS_Y = 540
  const cellH = 50

  return (
    <g>
      <PhaseHeader
        phase="C"
        title="Scores become attention weights."
        sub={
          <>
            We normalize the score row for the active query (position{' '}
            <tspan fill={COL_K_ATT} fontStyle="italic">{focused}</tspan>).
          </>
        }
      />

      {/* RAW SCORES label */}
      <text x={X0 + 12} y={RAW_Y - 16}
        fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        RAW ATTENTION SCORES (POSITION{' '}
        <tspan fill={COL_K_ATT}>{focused}</tspan>)
      </text>

      {/* Raw scores row */}
      {tokens.map((_, j) => {
        const x = X0 + 12 + j * cellW
        const isMasked = j > focused
        const isFocused = j === focused
        const v = isMasked ? '-∞' : rawScoresRow[j].toFixed(2)
        return (
          <motion.g
            key={`raw-${j}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35 / speed,
              delay: (j * 0.04) / speed,
            }}
          >
            <rect
              x={x}
              y={RAW_Y}
              width={cellW - 2}
              height={cellH}
              rx={3}
              fill={
                isFocused
                  ? 'rgba(96,165,250,0.22)'
                  : isMasked
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(96,165,250,0.06)'
              }
              stroke={
                isFocused
                  ? COL_K_ATT
                  : isMasked
                    ? 'rgba(255,255,255,0.10)'
                    : 'rgba(96,165,250,0.30)'
              }
              strokeWidth={isFocused ? 2 : 1}
            />
            <text
              x={x + cellW / 2 - 1}
              y={RAW_Y + cellH / 2 + 5}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill={
                isFocused
                  ? '#fff'
                  : isMasked
                    ? 'rgba(248,113,113,0.5)'
                    : 'rgba(255,255,255,0.85)'
              }
            >
              {v}
            </text>
            <text
              x={x + cellW / 2 - 1}
              y={RAW_Y + cellH + 16}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={isFocused ? COL_K_ATT : ACCENT.dim}
            >
              {j}
            </text>
            {/* Active column pulsing outline */}
            {isFocused && (
              <motion.rect
                x={x - 2}
                y={RAW_Y - 2}
                width={cellW + 2}
                height={cellH + 4}
                rx={4}
                fill="none"
                stroke={COL_K_ATT}
                strokeWidth={2.4}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.6 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.g>
        )
      })}

      <text x={X1 - 30} y={RAW_Y + cellH + 30}
        textAnchor="end"
        fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.18em" opacity={0.8}>
        (masked future positions)
      </text>

      {/* Big SOFTMAX arrow */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 / speed, duration: 0.5 / speed }}
      >
        <text
          x={X0 + 12 + (T * cellW) / 2 - 30}
          y={(RAW_Y + cellH + WTS_Y) / 2 + 5}
          textAnchor="middle"
          fontSize="13"
          fontFamily="var(--font-mono)"
          fill={COL_Q_ATT}
          letterSpacing="0.32em"
        >
          SOFTMAX
        </text>
        <path
          d={`M ${X0 + 12 + (T * cellW) / 2 + 50} ${RAW_Y + cellH + 20} L ${X0 + 12 + (T * cellW) / 2 + 50} ${WTS_Y - 12} M ${X0 + 12 + (T * cellW) / 2 + 50 - 8} ${WTS_Y - 20} L ${X0 + 12 + (T * cellW) / 2 + 50} ${WTS_Y - 12} L ${X0 + 12 + (T * cellW) / 2 + 50 + 8} ${WTS_Y - 20}`}
          stroke={COL_Q_ATT}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </motion.g>

      {/* WEIGHTS label */}
      <text x={X0 + 12} y={WTS_Y - 16}
        fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        ATTENTION WEIGHTS (POSITION{' '}
        <tspan fill={COL_K_ATT}>{focused}</tspan>)
      </text>

      {/* Weights row — staggered fade-in after softmax animates */}
      {tokens.map((_, j) => {
        const x = X0 + 12 + j * cellW
        const w = softmaxRow[j] || 0
        const isFocused = j === focused
        return (
          <motion.g
            key={`wts-${j}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4 / speed,
              delay: (1.6 + j * 0.04) / speed,
              ease: [0.22, 1.2, 0.36, 1],
            }}
          >
            <rect
              x={x}
              y={WTS_Y}
              width={cellW - 2}
              height={cellH}
              rx={3}
              fill={`rgba(245,158,11,${0.05 + w * 1.6})`}
              stroke={isFocused ? COL_K_ATT : `rgba(245,158,11,${0.4 + w * 0.5})`}
              strokeWidth={isFocused ? 2 : 1}
            />
            <text
              x={x + cellW / 2 - 1}
              y={WTS_Y + cellH / 2 + 5}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="rgba(255,255,255,0.95)"
            >
              {w.toFixed(3)}
            </text>
            <text
              x={x + cellW / 2 - 1}
              y={WTS_Y + cellH + 16}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={isFocused ? COL_K_ATT : ACCENT.dim}
            >
              {j}
            </text>
            {/* Active column pulse */}
            {isFocused && (
              <motion.rect
                x={x - 2}
                y={WTS_Y - 2}
                width={cellW + 2}
                height={cellH + 4}
                rx={4}
                fill="none"
                stroke={COL_K_ATT}
                strokeWidth={2.4}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.6 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.g>
        )
      })}

      {/* Flow particles from raw row → weights row (looping) */}
      {Array.from({ length: 5 }).map((_, k) => (
        <motion.circle
          key={`c-flow-${k}`}
          cx={X0 + 12 + (T * cellW) / 2 + 50}
          r={3}
          fill={COL_Q_ATT}
          opacity={0}
          animate={{
            cy: [RAW_Y + cellH, WTS_Y - 4],
            opacity: [0, 0.95, 0.95, 0],
          }}
          transition={{
            duration: 1.4 / speed,
            ease: 'easeIn',
            repeat: Infinity,
            delay: (1.0 + k * 0.25) / speed,
            times: [0, 0.15, 0.85, 1],
          }}
        />
      ))}

      {/* sum = 1.00 underline */}
      <line
        x1={X0 + 12}
        x2={X0 + 12 + T * cellW - 2}
        y1={WTS_Y + cellH + 32}
        y2={WTS_Y + cellH + 32}
        stroke={COL_Q_ATT}
        strokeWidth={1.2}
        strokeOpacity={0.7}
      />
      <text
        x={X0 + 12 + (T * cellW) / 2}
        y={WTS_Y + cellH + 50}
        textAnchor="middle"
        fontSize="13"
        fontFamily="var(--font-mono)"
        fill={COL_Q_ATT}
        letterSpacing="0.18em"
      >
        sum = 1.00
      </text>

      {/* Footer caption */}
      <PhaseFooter>
        <tspan>
          Softmax turns raw compatibility scores into a probability distribution
          over keys. All weights are{' '}
          <tspan fill={COL_Q_ATT}>≥ 0</tspan>
          {' and sum to '}
          <tspan fill={COL_Q_ATT}>1</tspan>
          , so they can be used to take a weighted average.
        </tspan>
      </PhaseFooter>
    </g>
  )
}

/* ─────────── Phase D — value mixing ─────────── */
function PhaseD({
  tokens,
  focused,
  speed,
  softmaxRow,
}: {
  tokens: string[]
  focused: number
  speed: number
  softmaxRow: number[]
}) {
  // Show 7 rows + ellipsis (top 6 indices + last)
  const visibleIdx = [0, 1, 2, 3, 4, 5, tokens.length - 1]
  const X0 = 460
  const Y_TOP = 220
  const ROW_H = 46
  const COL_W_LABEL = 130 // weight label column
  const COL_W_VEC = 220 // V vector display column
  const COL_W_MULT = 90 // × multiplier column
  const COL_W_OUT = 220 // weighted output column

  const X_WT = X0 + 30
  const X_VEC = X_WT + COL_W_LABEL + 30
  const X_MULT = X_VEC + COL_W_VEC + 20
  const X_OUT = X_MULT + COL_W_MULT + 10

  // Generate fake V vectors (16 cells each, signed values, palette tint per row)
  const D_V = 16
  const vColors = [
    '#a78bfa', '#7c5dd6', '#22d3ee', '#34d399',
    '#a78bfa', '#22d3ee', '#a78bfa', '#7c5dd6',
    '#22d3ee', '#34d399', '#f59e0b', '#7c5dd6',
    '#a78bfa', '#22d3ee', '#34d399', '#a78bfa',
    '#7c5dd6', '#22d3ee', '#34d399',
  ]
  const vCellFill = (rowIdx: number, cellIdx: number): string => {
    const tint = vColors[rowIdx % vColors.length]
    const v = Math.sin(rowIdx * 1.1 + cellIdx * 0.6 + 0.4)
    const a = Math.round((0.20 + Math.abs(v) * 0.55) * 255)
      .toString(16)
      .padStart(2, '0')
    return `${tint}${a}`
  }

  return (
    <g>
      <PhaseHeader
        phase="D"
        title="Weights pull from value vectors."
        sub={
          <>
            For the selected query at position{' '}
            <tspan fill={COL_K_ATT} fontStyle="italic">i = {focused}</tspan>{' '}
            (the comma):
          </>
        }
      />

      {/* Column headers */}
      <text x={X_WT} y={Y_TOP - 30} fontSize="10"
        fontFamily="var(--font-mono)" fill={ACCENT.dim}
        letterSpacing="0.22em">
        ATTENTION WEIGHTS
      </text>
      <text x={X_WT} y={Y_TOP - 14} fontSize="10"
        fontFamily="var(--font-mono)" fill={ACCENT.dim}
        letterSpacing="0.22em">
        FROM <tspan fill={COL_K_ATT} fontStyle="italic">q_i</tspan>
      </text>

      <text x={X_VEC} y={Y_TOP - 14} fontSize="10"
        fontFamily="var(--font-mono)" fill={ACCENT.dim}
        letterSpacing="0.22em">
        VALUE VECTORS (V[j])
      </text>

      <text x={X_OUT} y={Y_TOP - 14} fontSize="10"
        fontFamily="var(--font-mono)" fill={ACCENT.dim}
        letterSpacing="0.22em">
        WEIGHTED SUM
      </text>

      {/* Rows: weight | × | V[j] | = | weighted V */}
      {visibleIdx.map((j, rowIdx) => {
        const w = softmaxRow[j] || 0
        const yRow = Y_TOP + rowIdx * ROW_H
        const isHero = j === 3 // mockup highlights w[i,3]
        const isEllipsis = rowIdx === 6 && visibleIdx[6] === tokens.length - 1
        return (
          <motion.g
            key={`d-row-${j}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4 / speed,
              delay: (rowIdx * 0.1) / speed,
              ease: 'easeOut',
            }}
          >
            {/* Hero row breathing halo */}
            {isHero && (
              <motion.rect
                x={X_WT - 6}
                y={yRow - 6}
                width={X_OUT + COL_W_VEC + 16 - X_WT + 6}
                height={44}
                rx={6}
                fill="none"
                stroke={COL_K_ATT}
                strokeWidth={1.4}
                strokeOpacity={0.4}
                animate={{
                  opacity: [0.3, 0.85, 0.3],
                  strokeWidth: [1.4, 2.2, 1.4],
                }}
                transition={{
                  duration: 2.4 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            {/* Weight label box */}
            <rect
              x={X_WT}
              y={yRow}
              width={COL_W_LABEL}
              height={32}
              rx={3}
              fill={isHero ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.02)'}
              stroke={isHero ? COL_K_ATT : 'rgba(255,255,255,0.12)'}
              strokeWidth={isHero ? 1.6 : 0.8}
            />
            {isHero && (
              <text x={X_WT - 12} y={yRow + 22}
                textAnchor="middle" fontSize="14" fill={COL_K_ATT}>
                ▸
              </text>
            )}
            <text
              x={X_WT + 12}
              y={yRow + 22}
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="rgba(255,255,255,0.9)"
            >
              w[i,{j}]
            </text>
            <text
              x={X_WT + COL_W_LABEL - 12}
              y={yRow + 22}
              textAnchor="end"
              fontSize="13"
              fontFamily="var(--font-mono)"
              fill={isHero ? COL_K_ATT : COL_Q_ATT}
              fontWeight={isHero ? 600 : 400}
            >
              {w.toFixed(2)}
            </text>

            {/* Arrow → V */}
            <path
              d={`M ${X_WT + COL_W_LABEL + 4} ${yRow + 16} L ${X_VEC - 6} ${yRow + 16}`}
              stroke={ACCENT.dim}
              strokeWidth={1}
              fill="none"
            />

            {/* V vector cells (16 mini cells) */}
            <g>
              {Array.from({ length: D_V }).map((_, c) => {
                const cellW = (COL_W_VEC - 4) / D_V
                return (
                  <rect
                    key={`v-${j}-${c}`}
                    x={X_VEC + c * cellW}
                    y={yRow}
                    width={cellW - 0.5}
                    height={32}
                    fill={vCellFill(j, c)}
                  />
                )
              })}
              <rect
                x={X_VEC - 1}
                y={yRow - 1}
                width={COL_W_VEC + 2}
                height={34}
                rx={1}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={0.8}
              />
              <text
                x={X_VEC - 4}
                y={yRow + 22}
                textAnchor="end"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
              >
                V[{j}]
              </text>
            </g>

            {/* × multiplier */}
            <text
              x={X_MULT}
              y={yRow + 22}
              fontSize="13"
              fontFamily="var(--font-mono)"
              fill={isHero ? '#fff' : 'rgba(255,255,255,0.65)'}
            >
              ×
            </text>
            <text
              x={X_MULT + 22}
              y={yRow + 22}
              fontSize="13"
              fontFamily="var(--font-mono)"
              fill={isHero ? COL_K_ATT : COL_Q_ATT}
            >
              {w.toFixed(2)}
            </text>

            {/* Arrow into output */}
            <path
              d={`M ${X_MULT + COL_W_MULT - 12} ${yRow + 16} L ${X_OUT - 6} ${yRow + 16}`}
              stroke={ACCENT.dim}
              strokeWidth={1}
              fill="none"
            />

            {/* Weighted V cells (mint-tinted by weight) */}
            <g>
              {Array.from({ length: D_V }).map((_, c) => {
                const cellW = (COL_W_VEC - 4) / D_V
                return (
                  <rect
                    key={`wv-${j}-${c}`}
                    x={X_OUT + c * cellW}
                    y={yRow}
                    width={cellW - 0.5}
                    height={32}
                    fill={`rgba(52,211,153,${Math.min(0.85, 0.04 + w * 1.7)})`}
                  />
                )
              })}
              <rect
                x={X_OUT - 1}
                y={yRow - 1}
                width={COL_W_VEC + 2}
                height={34}
                rx={1}
                fill="none"
                stroke={isHero ? COL_V_ATT : 'rgba(52,211,153,0.25)'}
                strokeWidth={isHero ? 1.4 : 0.8}
              />
            </g>

            {/* Ellipsis row spacer between row index 5 and last */}
            {rowIdx === 5 && (
              <g>
                <text
                  x={X_WT + COL_W_LABEL / 2}
                  y={yRow + 60}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.dim}
                >
                  ⋯
                </text>
                <text
                  x={X_VEC + COL_W_VEC / 2}
                  y={yRow + 60}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.dim}
                >
                  ⋯
                </text>
                <text
                  x={X_OUT + COL_W_VEC / 2}
                  y={yRow + 60}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="var(--font-mono)"
                  fill={ACCENT.dim}
                >
                  ⋯
                </text>
              </g>
            )}
          </motion.g>
        )
      })}

      {/* Flow particles along × multiplier arrows — green dots streaming
          from V vectors into the weighted-V output column. */}
      {visibleIdx.slice(0, 5).map((j, rowIdx) => {
        const yLane = Y_TOP + rowIdx * ROW_H + 16
        return (
          <motion.circle
            key={`d-flow-${j}`}
            cy={yLane}
            r={3.2}
            fill={COL_V_ATT}
            opacity={0}
            animate={{
              cx: [X_VEC + 200, X_OUT - 4],
              opacity: [0, 0.95, 0.95, 0],
            }}
            transition={{
              duration: 1.4 / speed,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: (1.0 + rowIdx * 0.18) / speed,
              times: [0, 0.18, 0.82, 1],
            }}
          />
        )
      })}

      {/* Summation node + formula + output vector */}
      {(() => {
        const yFooter = Y_TOP + visibleIdx.length * ROW_H + 80
        return (
          <g>
            {/* Formula card */}
            <rect
              x={X0 + 30}
              y={yFooter}
              width={300}
              height={50}
              rx={4}
              fill="rgba(8,8,11,0.7)"
              stroke={COL_V_ATT}
              strokeOpacity={0.5}
              strokeWidth={1.2}
            />
            <text
              x={X0 + 180}
              y={yFooter + 30}
              textAnchor="middle"
              fontSize="14"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill="rgba(255,255,255,0.95)"
            >
              out
              <tspan fontSize="10" dy="3">i</tspan>
              <tspan dy="-3"> = </tspan>
              <tspan fontSize="20">Σ</tspan>
              <tspan> w[i,j] · V[j]</tspan>
            </text>

            {/* Arrow to output */}
            <path
              d={`M ${X0 + 340} ${yFooter + 25} L ${X0 + 380} ${yFooter + 25}`}
              stroke={COL_V_ATT}
              strokeWidth={1.6}
              strokeOpacity={0.85}
              fill="none"
            />
            <path
              d={`M ${X0 + 372} ${yFooter + 19} L ${X0 + 380} ${yFooter + 25} L ${X0 + 372} ${yFooter + 31}`}
              stroke={COL_V_ATT}
              strokeWidth={1.6}
              fill="none"
            />

            {/* Attention output label */}
            <text
              x={X0 + 400}
              y={yFooter - 4}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={ACCENT.dim}
              letterSpacing="0.22em"
            >
              ATTENTION OUTPUT FOR{' '}
              <tspan fill={COL_K_ATT} fontStyle="italic">q_i</tspan>
            </text>

            {/* Final output vector — mint, glowing */}
            <motion.rect
              x={X0 + 400}
              y={yFooter + 8}
              width={460}
              height={36}
              rx={3}
              fill="rgba(52,211,153,0.35)"
              stroke={COL_V_ATT}
              strokeWidth={2}
              filter="url(#attn-bloom)"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 2.4 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Output vector cells */}
            {Array.from({ length: 24 }).map((_, c) => (
              <rect
                key={`out-${c}`}
                x={X0 + 402 + c * (456 / 24)}
                y={yFooter + 10}
                width={456 / 24 - 0.5}
                height={32}
                fill={`rgba(52,211,153,${0.4 + Math.abs(Math.sin(c * 0.7)) * 0.5})`}
              />
            ))}
          </g>
        )
      })()}

      <PhaseFooter>
        <tspan>
          The attention output is an updated representation for position{' '}
          <tspan fill={COL_K_ATT} fontStyle="italic">i</tspan>
          . It will be added back to the residual stream in the next step.
        </tspan>
      </PhaseFooter>
    </g>
  )
}

/* ─────────── Reusable phase header (kicker + title + sub) ─────────── */
function PhaseHeader({
  phase,
  title,
  sub,
}: {
  phase: 'A' | 'B' | 'C' | 'D'
  title: string
  sub: ReactNode
}) {
  const subTitleByPhase: Record<typeof phase, string> = {
    A: 'one-query zoom',
    B: 'full Q·Kᵀ matrix',
    C: 'row-wise softmax',
    D: 'value mixing',
  }
  return (
    <g>
      {/* Phase chip pill */}
      <rect
        x={460}
        y={140}
        width={300}
        height={36}
        rx={18}
        fill="rgba(167,139,250,0.06)"
        stroke="rgba(167,139,250,0.45)"
        strokeWidth={1.2}
      />
      <text
        x={476}
        y={163}
        fontSize="13"
        fontFamily="var(--font-mono)"
        fill={ACCENT.violet}
        letterSpacing="0.18em"
      >
        sub-phase {phase}  ·  {subTitleByPhase[phase]}
      </text>

      {/* Phase tag label */}
      <text
        x={460}
        y={200}
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={ACCENT.dim}
        letterSpacing="0.32em"
      >
        SUB-PHASE {phase}
      </text>

      {/* Big italic title */}
      <text
        x={460}
        y={244}
        fontSize="34"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill="rgba(255,255,255,0.95)"
      >
        {title}
      </text>

      {/* Sub */}
      <text
        x={460}
        y={275}
        fontSize="14"
        fontFamily="var(--font-display)"
        fill="rgba(255,255,255,0.72)"
      >
        {sub}
      </text>
    </g>
  )
}

/* ─────────── Reusable phase footer (info callout) ─────────── */
function PhaseFooter({ children }: { children: ReactNode }) {
  return (
    <g>
      <rect
        x={460}
        y={830}
        width={920}
        height={68}
        rx={6}
        fill="rgba(8,8,11,0.7)"
        stroke="rgba(167,139,250,0.32)"
        strokeWidth={1.2}
      />
      <circle
        cx={490}
        cy={864}
        r={11}
        fill="none"
        stroke={ACCENT.violet}
        strokeOpacity={0.6}
        strokeWidth={1.2}
      />
      <text
        x={490}
        y={868}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={ACCENT.violet}
      >
        ⓘ
      </text>
      <text
        x={514}
        y={862}
        fontSize="13"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill="rgba(255,255,255,0.85)"
      >
        {children}
      </text>
    </g>
  )
}

/* ─────────── Phase summary strip at bottom ─────────── */
function PhaseSummary({ phase }: { phase: number }) {
  const segs: { letter: string; text: string }[] = [
    { letter: 'A', text: 'one query at a time.' },
    { letter: 'B', text: 'full Q·Kᵀ matrix cell-by-cell.' },
    { letter: 'C', text: 'row-wise softmax.' },
    { letter: 'D', text: 'weighted sum over value vectors.' },
  ]
  return (
    <g>
      <text
        x={700}
        y={950}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill="rgba(255,255,255,0.5)"
      >
        {segs.map((s, i) => (
          <tspan
            key={s.letter}
            fill={
              i === phase
                ? COL_K_ATT
                : 'rgba(255,255,255,0.4)'
            }
            fontWeight={i === phase ? 600 : 400}
          >
            ({s.letter}) {s.text}
            {i < segs.length - 1 ? '  ' : ''}
          </tspan>
        ))}
      </text>
    </g>
  )
}

/* ─────────── Scene 11 wrapper ─────────── */
export function AttentionSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const phaseLabels = [
    'one-query zoom',
    'full Q·Kᵀ matrix',
    'row-wise softmax',
    'value mixing',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      9500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  return (
    <SplitPaneScene
      viz={<VizAttention />}
      text={{
        kicker: ACT2_KICKER,
        title: 'Attention — 4 sub-phases.',
        subtitle: (
          <>
            Same query token across all four phases. Watch one query learn
            who to listen to, then pull from their values.
          </>
        ),
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'T', value: '19', color: COL_K_ATT },
          { label: 'd_k', value: '64', color: COL_Q_ATT },
          { label: 'scale', value: '1/√64', color: COL_Q_ATT },
          { label: 'mask', value: 'causal' },
        ],
        equation: {
          label: 'attention',
          body: (
            <>
              Attn(<tspan style={{ color: COL_Q_ATT }}>Q</tspan>,
              {' '}<tspan style={{ color: COL_K_ATT }}>K</tspan>,
              {' '}<tspan style={{ color: COL_V_ATT }}>V</tspan>) ={' '}
              softmax(QKᵀ / √d_k) V
            </>
          ),
        },
        infoCallout:
          'Causal masking sets future positions to −∞ before softmax, which makes their weights exactly 0. Each row sums to 1 — a clean probability distribution over the visible keys.',
      }}
    />
  )
}


/* =========================================================================
 * Scene 12 — multi: "Six heads, in parallel."
 *
 * Three-beat structure per design feedback:
 *
 *   BEAT 1 — Split into 6 heads
 *     Same input is projected six different ways. Each head has its own
 *     W_Q, W_K, W_V. Show structural Q/K/V boxes inside each head row.
 *
 *   BEAT 2 — Heads learn different patterns
 *     Each head's row shows a token strip with a different attention arc
 *     pattern, plus a role label (prev-token, start-anchor, vowel-hook,
 *     two-back, content, spread).
 *
 *   BEAT 3 — Concat + W_O → one output
 *     Six head outputs flow right into a "concat" column, then through a
 *     W_O box, emerging as one 384-d output vector. The payoff.
 *
 * Persistent across all 3 beats: the 6-head container, the residual/input
 * column on the far left, the concat column, and the same focused token #3.
 * ====================================================================== */

const HEAD_COLORS = [
  '#60a5fa', // head 0 - blue
  '#a78bfa', // head 1 - violet
  '#34d399', // head 2 - mint
  '#f59e0b', // head 3 - amber
  '#ec4899', // head 4 - pink
  '#22d3ee', // head 5 - cyan
]

const HEAD_ROLES = [
  { name: 'prev-token', blurb: 'Looks one step back.' },
  { name: 'start-anchor', blurb: 'Anchors to the beginning.' },
  { name: 'vowel-hook', blurb: 'Connects to nearby vowels.' },
  { name: 'two-back', blurb: 'Attends two tokens back.' },
  { name: 'content', blurb: 'Links semantically related tokens.' },
  { name: 'spread', blurb: 'Distributes attention broadly.' },
]

// Per-head attention pattern: returns the set of "attended positions" for
// the focused query at position f. Each head's pattern is different.
function patternFor(headIdx: number, f: number, T: number): number[] {
  switch (headIdx) {
    case 0: // prev-token: just attends to previous
      return f > 0 ? [f - 1] : []
    case 1: // start-anchor: attends to position 0 + a couple early
      return [0, 1].filter((p) => p < f)
    case 2: // vowel-hook: attends to a few specific earlier positions
      return [Math.max(0, f - 2), Math.max(0, f - 4)].filter(
        (p, i, a) => p < f && a.indexOf(p) === i,
      )
    case 3: // two-back: attends two positions back
      return f >= 2 ? [f - 2, f - 1] : f > 0 ? [0] : []
    case 4: // content: attends to a couple semantically-relevant positions
      return [Math.max(0, f - 3), Math.max(0, f - 5)].filter(
        (p, i, a) => p < f && a.indexOf(p) === i,
      )
    case 5: // spread: attends broadly to all earlier positions
      return Array.from({ length: f }).map((_, i) => i)
    default:
      return []
  }
}

export function VizMultiHead() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const tokens = (prompt || 'To be, or not to be').split('').slice(0, 19)
  const T = tokens.length
  const FOCUSED = Math.min(3, T - 1)

  const PHASES = 3
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      8000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // ── Geometry ──────────────────────────────────────────────────────────
  // Container: x=140..1380, y=160..820
  const CONTAINER_X = 140
  const CONTAINER_Y = 160
  const CONTAINER_W = 1240
  const CONTAINER_H = 660

  // Residual/input column on the far left
  const RESID_X = 165
  const RESID_Y = 240
  const RESID_W = 50
  const RESID_H = 460

  // 6 head rows (stacked vertically)
  const HEAD_AREA_X = 250
  const HEAD_AREA_Y = 220
  const HEAD_AREA_W = 700
  const HEAD_AREA_H = 540
  const HEAD_ROW_H = HEAD_AREA_H / 6 // 90
  const HEAD_ROW_GAP = 4
  const headRowY = (i: number) => HEAD_AREA_Y + i * HEAD_ROW_H

  // Concat column on the right of head rows
  const CONCAT_X = 990
  const CONCAT_Y = 270
  const CONCAT_W = 80
  const CONCAT_H = 440

  // W_O box (phase 3 only)
  const WO_X = 1110
  const WO_Y = 380
  const WO_W = 90
  const WO_H = 220

  // Final 384-d output vector (phase 3 only)
  const OUT_X = 1230
  const OUT_Y = 360
  const OUT_W = 130
  const OUT_H = 260

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="mh-glow"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="mh-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* ────── Token strip ────── */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          TOKENS
        </text>
        {tokens.map((ch, i) => {
          const cellW = 32
          const startX = 90
          const x = startX + i * (cellW + 4)
          const isFocused = i === FOCUSED
          return (
            <g key={`mh-tok-${i}`}>
              {isFocused && (
                <motion.rect
                  x={x - 2} y={20} width={cellW + 4} height={36} rx={4}
                  fill="rgba(236,72,153,0.22)"
                  stroke={HEAD_COLORS[4]}
                  strokeWidth={1.6}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 2 / speed,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              <rect x={x} y={22} width={cellW} height={32} rx={3}
                fill="rgba(167,139,250,0.04)"
                stroke="rgba(167,139,250,0.22)"
                strokeWidth={1} />
              <text x={x + cellW / 2} y={44} textAnchor="middle"
                fontSize="14" fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={isFocused ? '#fff' : 'rgba(255,255,255,0.55)'}>
                {ch === ' ' ? '·' : ch}
              </text>
            </g>
          )
        })}
        {/* T = number indicator */}
        <text x={90 + tokens.length * 36 + 8} y={44}
          fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
          {T}
        </text>

        {/* ────── Main container — BLOCK 0 · ATTENTION (MULTI-HEAD) ────── */}
        <rect
          x={CONTAINER_X}
          y={CONTAINER_Y}
          width={CONTAINER_W}
          height={CONTAINER_H}
          rx={8}
          fill="rgba(8,8,11,0.45)"
          stroke="rgba(167,139,250,0.32)"
          strokeWidth={1.4}
        />
        <text
          x={CONTAINER_X + CONTAINER_W / 2}
          y={CONTAINER_Y + 24}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={ACCENT.dim}
          letterSpacing="0.28em"
        >
          BLOCK 0  ·  ATTENTION (MULTI-HEAD)
        </text>

        {/* ────── Residual / input column ────── */}
        <g>
          <rect
            x={RESID_X}
            y={RESID_Y}
            width={RESID_W}
            height={RESID_H}
            rx={4}
            fill="rgba(96,165,250,0.06)"
            stroke="rgba(96,165,250,0.45)"
            strokeWidth={1.2}
          />
          <text x={RESID_X + RESID_W / 2} y={RESID_Y - 32} textAnchor="middle"
            fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}
            letterSpacing="0.18em">
            residual /
          </text>
          <text x={RESID_X + RESID_W / 2} y={RESID_Y - 18} textAnchor="middle"
            fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}
            letterSpacing="0.18em">
            input
          </text>
          {/* Cells */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect
              key={`resid-cell-${i}`}
              x={RESID_X + 4}
              y={RESID_Y + 8 + i * 48}
              width={RESID_W - 8}
              height={42}
              fill={`rgba(96,165,250,${0.18 + (i % 3) * 0.12})`}
            />
          ))}
          <text x={RESID_X + RESID_W / 2} y={RESID_Y + RESID_H + 18}
            textAnchor="middle"
            fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
            fill={ACCENT.dim}>
            x
          </text>
          <text x={RESID_X + RESID_W / 2} y={RESID_Y + RESID_H + 36}
            textAnchor="middle"
            fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}
            letterSpacing="0.18em">
            384-d
          </text>
        </g>

        {/* ────── Fan-out: residual → 6 head rows ────── */}
        {Array.from({ length: 6 }).map((_, i) => {
          const fromX = RESID_X + RESID_W
          const fromY = RESID_Y + RESID_H / 2
          const toX = HEAD_AREA_X - 4
          const toY = headRowY(i) + HEAD_ROW_H / 2
          const ctrlX = (fromX + toX) / 2 + 8
          return (
            <g key={`fanout-${i}`}>
              <motion.path
                d={`M ${fromX} ${fromY} Q ${ctrlX} ${toY}, ${toX} ${toY}`}
                stroke={HEAD_COLORS[i]}
                strokeWidth={1.8}
                strokeOpacity={0.85}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.6 / speed,
                  delay: (0.3 + i * 0.08) / speed,
                }}
              />
              {/* Continuous flow particle along the fanout arrow */}
              <motion.circle
                r={2.4}
                fill={HEAD_COLORS[i]}
                initial={{ opacity: 0, cx: fromX, cy: fromY }}
                animate={{
                  opacity: [0, 0.95, 0.95, 0],
                  cx: [fromX, ctrlX, toX],
                  cy: [fromY, toY, toY],
                }}
                transition={{
                  duration: 1.8 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (1.0 + i * 0.15) / speed,
                  times: [0, 0.2, 0.85, 1],
                }}
              />
            </g>
          )
        })}

        {/* ────── 6 head rows ────── */}
        {Array.from({ length: 6 }).map((_, i) => {
          const yT = headRowY(i)
          const yC = yT + HEAD_ROW_H / 2
          const yB = yT + HEAD_ROW_H - HEAD_ROW_GAP
          const accent = HEAD_COLORS[i]
          return (
            <g key={`head-${i}`}>
              {/* Head row outline */}
              <rect
                x={HEAD_AREA_X}
                y={yT + 2}
                width={HEAD_AREA_W}
                height={HEAD_ROW_H - 4}
                rx={4}
                fill={`${accent}08`}
                stroke={accent}
                strokeWidth={1.2}
                strokeOpacity={0.65}
              />

              {/* head label */}
              <text
                x={HEAD_AREA_X + 14}
                y={yT + 22}
                fontSize="13"
                fontFamily="var(--font-mono)"
                fill={accent}
                letterSpacing="0.18em"
              >
                head {i}
              </text>
              <text
                x={HEAD_AREA_X + 14}
                y={yT + 38}
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={ACCENT.dim}
                letterSpacing="0.18em"
              >
                64-d
              </text>

              {/* Phase 2/3: role label inline */}
              {phase >= 1 && (
                <text
                  x={HEAD_AREA_X + 14}
                  y={yT + 60}
                  fontSize="10"
                  fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={accent}
                  opacity={0.85}
                >
                  {HEAD_ROLES[i].name}
                </text>
              )}

              {/* Phase content — wrapped in motion.g keyed on phase so the
                  swap from Phase 1 (Q/K/V) → Phase 2 (arcs) crossfades and
                  inner stagger animations re-trigger on remount. */}
              <motion.g
                key={`head-${i}-content-${phase === 0 ? 'qkv' : 'arcs'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45 / speed, ease: 'easeOut' }}
              >
                {phase === 0 && (
                  <Phase1HeadContent
                    yT={yT}
                    yC={yC}
                    i={i}
                    accent={accent}
                    rowX={HEAD_AREA_X + 80}
                    rowW={HEAD_AREA_W - 84}
                    speed={speed}
                  />
                )}
                {phase >= 1 && (
                  <Phase2HeadContent
                    yT={yT}
                    yC={yC}
                    i={i}
                    accent={accent}
                    tokens={tokens}
                    focused={FOCUSED}
                    rowX={HEAD_AREA_X + 80}
                    rowW={HEAD_AREA_W - 220}
                    speed={speed}
                  />
                )}
              </motion.g>

              {/* Mini output strip (4 cells) on the right of every head row */}
              {(() => {
                const stripX = HEAD_AREA_X + HEAD_AREA_W - 100
                const stripY = yC - 12
                const cellCount = 4
                const cellW = 22
                return (
                  <g>
                    {Array.from({ length: cellCount }).map((_, c) => (
                      <rect
                        key={`strip-${i}-${c}`}
                        x={stripX + c * (cellW + 2)}
                        y={stripY}
                        width={cellW}
                        height={24}
                        rx={2}
                        fill={`${accent}${Math.round((0.30 + c * 0.12) * 255).toString(16).padStart(2, '0')}`}
                        stroke={accent}
                        strokeOpacity={0.55}
                        strokeWidth={0.8}
                      />
                    ))}
                  </g>
                )
              })()}

              {/* Output → concat connector */}
              <motion.path
                d={`M ${HEAD_AREA_X + HEAD_AREA_W} ${yC} Q ${(HEAD_AREA_X + HEAD_AREA_W + CONCAT_X) / 2} ${yC}, ${CONCAT_X} ${CONCAT_Y + (i + 0.5) * (CONCAT_H / 6)}`}
                stroke={accent}
                strokeWidth={phase === 2 ? 2.2 : 1.4}
                strokeOpacity={phase === 2 ? 0.95 : 0.55}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: 1,
                  strokeOpacity: phase === 2 ? 0.95 : 0.55,
                }}
                transition={{
                  pathLength: { duration: 0.5 / speed, delay: (0.8 + i * 0.06) / speed },
                  strokeOpacity: { duration: 0.4 / speed },
                }}
              />
              {/* Continuous flow particle: head output → concat */}
              {(() => {
                const fromX = HEAD_AREA_X + HEAD_AREA_W
                const fromY = yC
                const ctrlX = (HEAD_AREA_X + HEAD_AREA_W + CONCAT_X) / 2
                const ctrlY = yC
                const toX = CONCAT_X
                const toY = CONCAT_Y + (i + 0.5) * (CONCAT_H / 6)
                return (
                  <motion.circle
                    r={2.4}
                    fill={accent}
                    initial={{ opacity: 0, cx: fromX, cy: fromY }}
                    animate={{
                      opacity: [0, 0.95, 0.95, 0],
                      cx: [fromX, ctrlX, toX],
                      cy: [fromY, ctrlY, toY],
                    }}
                    transition={{
                      duration: 1.8 / speed,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: (2.0 + i * 0.15) / speed,
                      times: [0, 0.2, 0.85, 1],
                    }}
                  />
                )
              })()}
            </g>
          )
        })}

        {/* ────── Concat column ────── */}
        <g>
          <rect
            x={CONCAT_X}
            y={CONCAT_Y}
            width={CONCAT_W}
            height={CONCAT_H}
            rx={4}
            fill={
              phase === 2
                ? 'rgba(167,139,250,0.18)'
                : 'rgba(167,139,250,0.06)'
            }
            stroke={ACCENT.violet}
            strokeWidth={phase === 2 ? 2 : 1.4}
            strokeOpacity={phase === 2 ? 1 : 0.75}
          />
          <text
            x={CONCAT_X + CONCAT_W / 2}
            y={CONCAT_Y - 8}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill={phase === 2 ? ACCENT.violet : ACCENT.dim}
            letterSpacing="0.22em"
          >
            concat
          </text>
          {/* 6 colored bands inside concat (one per head) */}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={`concat-band-${i}`}
              x={CONCAT_X + 6}
              y={CONCAT_Y + 8 + i * ((CONCAT_H - 16) / 6)}
              width={CONCAT_W - 12}
              height={(CONCAT_H - 16) / 6 - 4}
              fill={HEAD_COLORS[i]}
              opacity={0.75}
            />
          ))}
          <text
            x={CONCAT_X + CONCAT_W / 2}
            y={CONCAT_Y + CONCAT_H + 18}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={ACCENT.dim}
            letterSpacing="0.18em"
          >
            384-d
          </text>
        </g>

        {/* ────── Phase 3: W_O box + final output ────── */}
        {phase === 2 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 / speed, delay: 0.4 / speed }}
          >
            {/* Concat → W_O arrow */}
            <path
              d={`M ${CONCAT_X + CONCAT_W + 4} ${CONCAT_Y + CONCAT_H / 2} L ${WO_X - 6} ${WO_Y + WO_H / 2}`}
              stroke={ACCENT.violet}
              strokeWidth={2}
              strokeOpacity={0.85}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${WO_X - 14} ${WO_Y + WO_H / 2 - 6} L ${WO_X - 4} ${WO_Y + WO_H / 2} L ${WO_X - 14} ${WO_Y + WO_H / 2 + 6}`}
              stroke={ACCENT.violet}
              strokeWidth={2}
              fill="none"
            />

            {/* W_O box */}
            <rect
              x={WO_X}
              y={WO_Y}
              width={WO_W}
              height={WO_H}
              rx={4}
              fill="rgba(167,139,250,0.10)"
              stroke={ACCENT.violet}
              strokeWidth={2}
            />
            {/* Mini grid hint inside W_O */}
            {Array.from({ length: 6 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => (
                <rect
                  key={`wo-${r}-${c}`}
                  x={WO_X + 8 + c * 18}
                  y={WO_Y + 30 + r * 28}
                  width={16}
                  height={26}
                  fill="rgba(167,139,250,0.18)"
                  stroke="rgba(167,139,250,0.3)"
                  strokeWidth={0.5}
                />
              )),
            )}
            <text
              x={WO_X + WO_W / 2}
              y={WO_Y + 22}
              textAnchor="middle"
              fontSize="22"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={ACCENT.violet}
            >
              W
              <tspan fontSize="14" dy="6">O</tspan>
            </text>
            <text
              x={WO_X + WO_W / 2}
              y={WO_Y + WO_H + 18}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={ACCENT.dim}
              letterSpacing="0.18em"
            >
              384 × 384
            </text>

            {/* W_O → final output arrow */}
            <path
              d={`M ${WO_X + WO_W + 4} ${WO_Y + WO_H / 2} L ${OUT_X - 6} ${OUT_Y + OUT_H / 2}`}
              stroke={ACCENT.violet}
              strokeWidth={2}
              strokeOpacity={0.85}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${OUT_X - 14} ${OUT_Y + OUT_H / 2 - 6} L ${OUT_X - 4} ${OUT_Y + OUT_H / 2} L ${OUT_X - 14} ${OUT_Y + OUT_H / 2 + 6}`}
              stroke={ACCENT.violet}
              strokeWidth={2}
              fill="none"
            />

            {/* Continuous flow: 6 colored particles streaming from concat
                through W_O into the final output vector. Visualizes the
                "concat → W_O → output" pipeline staying alive. */}
            {Array.from({ length: 6 }).map((_, k) => {
              const startY = CONCAT_Y + (k + 0.5) * (CONCAT_H / 6)
              return (
                <motion.circle
                  key={`p3-flow-${k}`}
                  r={2.8}
                  fill={HEAD_COLORS[k]}
                  initial={{
                    cx: CONCAT_X + CONCAT_W,
                    cy: startY,
                    opacity: 0,
                  }}
                  animate={{
                    cx: [
                      CONCAT_X + CONCAT_W,
                      WO_X + WO_W / 2,
                      OUT_X + OUT_W / 2,
                    ],
                    cy: [startY, WO_Y + WO_H / 2, OUT_Y + OUT_H / 2],
                    opacity: [0, 0.95, 0.95, 0.6, 0],
                  }}
                  transition={{
                    duration: 2.4 / speed,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: (1.0 + k * 0.22) / speed,
                    times: [0, 0.18, 0.5, 0.82, 1],
                  }}
                />
              )
            })}

            {/* Final 384-d output vector — single, unified, glowing */}
            <motion.rect
              x={OUT_X - 6}
              y={OUT_Y - 6}
              width={OUT_W + 12}
              height={OUT_H + 12}
              rx={6}
              fill="rgba(167,139,250,0.06)"
              filter="url(#mh-bloom)"
              animate={{ opacity: [0.4, 0.85, 0.4] }}
              transition={{
                duration: 3 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <rect
              x={OUT_X}
              y={OUT_Y}
              width={OUT_W}
              height={OUT_H}
              rx={4}
              fill="rgba(167,139,250,0.10)"
              stroke={ACCENT.violet}
              strokeWidth={2.4}
            />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={`out-cell-${i}`}
                x={OUT_X + 4}
                y={OUT_Y + 8 + i * ((OUT_H - 16) / 12)}
                width={OUT_W - 8}
                height={(OUT_H - 16) / 12 - 2}
                fill={`rgba(167,139,250,${0.30 + (i % 3) * 0.18})`}
              />
            ))}
            <text
              x={OUT_X + OUT_W / 2}
              y={OUT_Y - 14}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill={ACCENT.violet}
              letterSpacing="0.22em"
            >
              MHA OUTPUT
            </text>
            <text
              x={OUT_X + OUT_W / 2}
              y={OUT_Y + OUT_H + 18}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill={ACCENT.dim}
              letterSpacing="0.18em"
            >
              384-d
            </text>
          </motion.g>
        )}

        {/* ────── Dimension breakdown ribbon (bottom of scene) ────── */}
        <g transform={`translate(${CONTAINER_X + 20}, ${CONTAINER_Y + CONTAINER_H + 24})`}>
          <text x={0} y={0} fontSize="10" fontFamily="var(--font-mono)"
            fill={ACCENT.dim} letterSpacing="0.22em">
            DIMS
          </text>
          <text x={70} y={0} fontSize="11" fontFamily="var(--font-mono)"
            fill="rgba(255,255,255,0.85)">
            input{' '}
            <tspan fill={ACCENT.violet}>384</tspan>
            {'  →  split into '}
            <tspan fill={HEAD_COLORS[1]}>6 heads</tspan>
            {'  →  '}
            <tspan fill={HEAD_COLORS[3]}>64-d</tspan>
            {' each  →  concat back to '}
            <tspan fill={ACCENT.violet}>384</tspan>
          </text>
        </g>

        {/* ────── Phase summary strip at bottom ────── */}
        <g>
          {[
            { letter: '1', text: 'split into 6 heads' },
            { letter: '2', text: 'each learns a different pattern' },
            { letter: '3', text: 'concat → W_O → 384-d output' },
          ].map((s, i) => {
            const xStart = CONTAINER_X + 20 + i * 420
            const isActive = phase === i
            return (
              <g key={`summary-${i}`}>
                <text
                  x={xStart}
                  y={970}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill={isActive ? ACCENT.violet : 'rgba(255,255,255,0.4)'}
                  letterSpacing="0.18em"
                  fontWeight={isActive ? 600 : 400}
                >
                  ({s.letter}) {s.text}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

/* ─────────── Phase 1 head content: Q/K/V boxes + softmax + arrow ─────────── */
function Phase1HeadContent({
  yT,
  yC,
  i,
  accent,
  rowX,
  rowW,
  speed,
}: {
  yT: number
  yC: number
  i: number
  accent: string
  rowX: number
  rowW: number
  speed: number
}) {
  const boxW = 38
  const boxH = 32
  const boxGap = 8
  const xStart = rowX + 30
  return (
    <g>
      {/* Q, K, V boxes — staggered spring-in per head */}
      {['Q', 'K', 'V'].map((label, k) => (
        <motion.g
          key={`qkv-${i}-${label}`}
          initial={{ opacity: 0, scale: 0.7, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.4 / speed,
            delay: ((i * 0.04) + k * 0.08) / speed,
            ease: [0.22, 1.2, 0.36, 1],
          }}
        >
          <rect
            x={xStart + k * (boxW + boxGap)}
            y={yC - boxH / 2}
            width={boxW}
            height={boxH}
            rx={3}
            fill={`${accent}10`}
            stroke={accent}
            strokeWidth={1.2}
            strokeOpacity={0.7}
          />
          <text
            x={xStart + k * (boxW + boxGap) + boxW / 2}
            y={yC + 5}
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={accent}
          >
            {label}
            <tspan fontSize="9" dy="3">{i}</tspan>
          </text>
        </motion.g>
      ))}

      {/* Arrow */}
      <text
        x={xStart + 3 * (boxW + boxGap) + 4}
        y={yC + 5}
        fontSize="14"
        fontFamily="var(--font-mono)"
        fill={accent}
        opacity={0.7}
      >
        →
      </text>

      {/* softmax attn box — fades in after Q/K/V then continuously breathes */}
      <motion.rect
        x={xStart + 3 * (boxW + boxGap) + 26}
        y={yC - boxH / 2}
        width={68}
        height={boxH}
        rx={3}
        fill={`${accent}08`}
        stroke={accent}
        strokeOpacity={0.6}
        strokeWidth={1}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 1, 0.8, 1],
          strokeWidth: [1, 1.6, 1.2, 1.6],
        }}
        transition={{
          opacity: {
            duration: 2.4 / speed,
            delay: (0.4 + i * 0.04) / speed,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          strokeWidth: {
            duration: 2.4 / speed,
            delay: (0.4 + i * 0.04) / speed,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
      <text
        x={xStart + 3 * (boxW + boxGap) + 26 + 34}
        y={yC - 1}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill={accent}
        opacity={0.85}
      >
        softmax
      </text>
      <text
        x={xStart + 3 * (boxW + boxGap) + 26 + 34}
        y={yC + 11}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill={accent}
        opacity={0.85}
      >
        attn
      </text>

      {/* Arrow to output */}
      <text
        x={xStart + 3 * (boxW + boxGap) + 100}
        y={yC + 5}
        fontSize="14"
        fontFamily="var(--font-mono)"
        fill={accent}
        opacity={0.7}
      >
        →
      </text>

      {/* Flow particles: Q/K/V → softmax → output (continuous loop) */}
      {Array.from({ length: 2 }).map((_, k) => (
        <motion.circle
          key={`flow-${i}-${k}`}
          cy={yC}
          r={2.6}
          fill={accent}
          opacity={0}
          animate={{
            cx: [
              xStart + 3 * (boxW + boxGap) - 6,
              xStart + 3 * (boxW + boxGap) + 26 + 34,
              xStart + 3 * (boxW + boxGap) + 130,
            ],
            opacity: [0, 0.95, 0.95, 0],
          }}
          transition={{
            duration: 2.0 / speed,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: (0.6 + i * 0.08 + k * 1.0) / speed,
            times: [0, 0.2, 0.8, 1],
          }}
        />
      ))}
    </g>
  )
}

/* ─────────── Phase 2/3 head content: token row + attention arcs ─────────── */
function Phase2HeadContent({
  yT,
  yC,
  i,
  accent,
  tokens,
  focused,
  rowX,
  rowW,
  speed,
}: {
  yT: number
  yC: number
  i: number
  accent: string
  tokens: string[]
  focused: number
  rowX: number
  rowW: number
  speed: number
}) {
  const T = tokens.length
  const cellW = (rowW - 20) / T
  const cellH = 22
  const cellY = yC - cellH / 2 + 6
  const tokX = (j: number) => rowX + 16 + j * cellW + cellW / 2

  const attended = patternFor(i, focused, T)

  return (
    <g>
      {/* Token row */}
      {tokens.map((ch, j) => {
        const isFocused = j === focused
        const isAttended = attended.includes(j)
        const x = rowX + 16 + j * cellW
        return (
          <g key={`mh-tok-${i}-${j}`}>
            <rect
              x={x}
              y={cellY}
              width={cellW - 1.5}
              height={cellH}
              rx={2}
              fill={
                isFocused
                  ? `${accent}28`
                  : isAttended
                    ? `${accent}14`
                    : 'rgba(255,255,255,0.02)'
              }
              stroke={
                isFocused
                  ? accent
                  : isAttended
                    ? accent
                    : 'rgba(255,255,255,0.18)'
              }
              strokeWidth={isFocused ? 1.8 : isAttended ? 1.2 : 0.6}
              strokeOpacity={isFocused ? 1 : isAttended ? 0.85 : 0.45}
            />
            <text
              x={x + (cellW - 1.5) / 2}
              y={cellY + cellH - 6}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill={isFocused ? '#fff' : isAttended ? '#fff' : 'rgba(255,255,255,0.45)'}
            >
              {ch === ' ' ? '·' : ch}
            </text>
          </g>
        )
      })}

      {/* Attention arcs from focused → each attended position.
          First draws in (pathLength 0→1), then continuously pulses
          opacity + strokeWidth so the heads stay alive. */}
      {attended.map((j) => {
        const fromX = tokX(focused)
        const fromY = cellY
        const toX = tokX(j)
        const toY = cellY
        const arcHeight = 14 + (focused - j) * 2
        const ctrlY = fromY - arcHeight
        const pathStr = `M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${ctrlY}, ${toX} ${toY}`
        return (
          <g key={`mh-arc-${i}-${j}`}>
            {/* Initial draw-in */}
            <motion.path
              d={pathStr}
              stroke={accent}
              strokeWidth={1.4}
              strokeOpacity={0.85}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.5 / speed,
                delay: (0.4 + i * 0.04 + j * 0.02) / speed,
              }}
            />
            {/* Continuous pulse — kicks in after the initial draw */}
            <motion.path
              d={pathStr}
              stroke={accent}
              fill="none"
              initial={{ opacity: 0, strokeWidth: 1.4 }}
              animate={{
                opacity: [0, 0.95, 0.45, 0.95],
                strokeWidth: [1.4, 2.8, 1.6, 2.8],
              }}
              transition={{
                duration: 2.4 / speed,
                delay: (1.0 + i * 0.04) / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        )
      })}

      {/* Tiny particle dot traveling along an arc — gives a "data flowing"
          feel. Picks the longest arc per head if any. */}
      {attended.length > 0 && (() => {
        const j = attended[0]
        const fromX = tokX(focused)
        const fromY = cellY
        const toX = tokX(j)
        const arcHeight = 14 + (focused - j) * 2
        const midX = (fromX + toX) / 2
        const midY = fromY - arcHeight
        return (
          <motion.circle
            r={2.4}
            fill={accent}
            initial={{ opacity: 0, cx: fromX, cy: fromY }}
            animate={{
              opacity: [0, 0.95, 0.95, 0],
              cx: [fromX, midX, toX],
              cy: [fromY, midY, fromY],
            }}
            transition={{
              duration: 1.6 / speed,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (1.4 + i * 0.18) / speed,
              times: [0, 0.15, 0.85, 1],
            }}
          />
        )
      })()}
    </g>
  )
}

/* ─────────── Scene 12 wrapper ─────────── */
/* =========================================================================
 * Scene 13 — ffn: "Expand. Fire. Compress."
 *
 * Single animated pipeline (NOT five stacked rows). One central FFN chamber
 * with one focused-token vector flowing through five beats:
 *   1. input          — x ∈ R^384 enters
 *   2. W1 expand      — 384 → 1536 (vector swells into a 4× wider feature bank)
 *   3. GELU fire      — many cells dim, active cells glow/pulse amber
 *   4. W2 compress    — 1536 → 384 (output vector emerges)
 *   5. residual add   — x_out = x_in + FFN(LN(x_in))
 *
 * Persistent overlay reminds the viewer this is per-token (no token mixing).
 * ====================================================================== */

const COL_FFN_X = ACCENT.cyan      // residual stream (in/out)
const COL_FFN_W1 = ACCENT.blue     // W1 gate
const COL_FFN_W2 = ACCENT.mint     // W2 gate
const COL_FFN_FIRE = ACCENT.amber  // GELU activation

// GELU approximation — gpt-2 / bert tanh form
function gelu(z: number): number {
  return 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z * z * z)))
}

export function VizFFN() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const tokens = (prompt || 'To be, or not to be').split('').slice(0, 19)
  const T = tokens.length
  const FOCUSED = Math.min(3, T - 1)

  // 5 phases, ~3.2s each
  const PHASES = 5
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      3200 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // ── Math: deterministic vectors ─────────────────────────────────────
  const DIN = 16     // 384 dims rendered as 16 cells
  const DHID = 64    // 1536 dims rendered as 64 cells (4× wider)
  const xIn = Array.from({ length: DIN }).map(
    (_, i) => Math.sin(i * 1.27 + 0.7) * 0.95 + Math.cos(i * 0.42) * 0.25,
  )
  const hPre = Array.from({ length: DHID }).map(
    (_, i) => Math.sin(i * 0.41 + 1.1) * 1.35 + Math.cos(i * 0.27 - 0.6) * 0.55,
  )
  const hPost = hPre.map(gelu)
  const xDelta = Array.from({ length: DIN }).map(
    (_, i) => Math.sin(i * 0.83 - 0.3) * 0.55 + Math.cos(i * 0.51) * 0.22,
  )
  const xOut = xIn.map((v, i) => v + xDelta[i])

  // ── Color helpers ───────────────────────────────────────────────────
  const colorRes = (v: number): string => {
    const m = Math.max(-1.5, Math.min(1.5, v)) / 1.5
    if (m >= 0) return `rgba(34,211,238,${0.18 + m * 0.62})`
    return `rgba(248,113,113,${0.18 + -m * 0.5})`
  }
  const colorAmberFire = (v: number): string => {
    // active = positive post-GELU value; dim = near-zero/negative
    const a = 0.08 + Math.min(1, Math.max(0, v / 1.4)) * 0.92
    return `rgba(245,158,11,${a})`
  }

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ffn-glow"><feGaussianBlur stdDeviation="2.5" /></filter>
          <filter id="ffn-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="ffn-w1-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(96,165,250,0.05)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.55)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0.05)" />
          </linearGradient>
          <linearGradient id="ffn-w2-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(52,211,153,0.05)" />
            <stop offset="50%" stopColor="rgba(52,211,153,0.55)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.05)" />
          </linearGradient>
        </defs>

        {/* ────── Top kicker ────── */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          BLOCK 0 · FFN · EXPAND → FIRE → COMPRESS → ADD
        </text>

        {/* ────── Token strip with focused token ────── */}
        <FFNTokenStrip tokens={tokens} focused={FOCUSED} speed={speed} />

        {/* ────── Per-token reminder banner ────── */}
        <g>
          <rect x={490} y={150} width={420} height={28} rx={14}
            fill="rgba(245,158,11,0.06)"
            stroke="rgba(245,158,11,0.35)" strokeWidth={1} />
          <text x={700} y={169} textAnchor="middle"
            fontSize="11" fontFamily="var(--font-mono)"
            fill={ACCENT.amber} letterSpacing="0.18em">
            PER-TOKEN MLP · NO TOKEN MIXING HERE
          </text>
        </g>

        {/* ────── Chamber outline ────── */}
        <FFNChamber phase={phase} speed={speed} />

        {/* ════════════════════════════════════════════════════════════
             PERSISTENT PIPELINE — every station is always on screen.
             Phase changes only re-emphasize one station; data keeps
             flowing through all of them every frame.
             ════════════════════════════════════════════════════════ */}
        <FFNInputColumn values={xIn} colorRes={colorRes} highlighted={phase === 0} speed={speed} />
        <FFNGateW1 active={phase === 1} speed={speed} />
        <FFNHiddenBlock
          hPre={hPre}
          hPost={hPost}
          fireMask={true}
          intensified={phase === 2}
          speed={speed}
          colorRes={colorRes}
          colorAmberFire={colorAmberFire}
        />
        <FFNGateW2 active={phase === 3} speed={speed} />
        <FFNOutputColumn values={xDelta} colorRes={colorRes} highlighted={phase === 3} speed={speed} />

        {/* ────── Continuous particle streams through the entire pipeline ────── */}
        <FFNFlowParticles phase={phase} speed={speed} />

        {/* ────── Residual stream below + always-visible merge ────── */}
        <FFNResidualStream
          xIn={xIn}
          xOut={xOut}
          colorRes={colorRes}
          phase={phase}
          speed={speed}
        />

        {/* ────── Phase caption (crossfades, no remount) ────── */}
        <FFNCaption phase={phase} speed={speed} />

        {/* ────── Phase summary footer ────── */}
        <FFNPhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── Token strip (top, focused token highlighted) ─────────── */
function FFNTokenStrip({
  tokens,
  focused,
  speed,
}: {
  tokens: string[]
  focused: number
  speed: number
}) {
  const cellW = 32
  const startX = 80
  return (
    <g>
      <text x={20} y={84} fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.amber} letterSpacing="0.22em" opacity={0.85}>
        TOKENS ▸
      </text>
      {tokens.map((ch, i) => {
        const x = startX + i * (cellW + 4)
        const isFocused = i === focused
        return (
          <g key={`ffn-tok-${i}`}>
            {isFocused && (
              <motion.rect
                x={x - 2} y={64} width={cellW + 4} height={36} rx={4}
                fill="rgba(245,158,11,0.20)"
                stroke={ACCENT.amber}
                strokeWidth={1.8}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 2.2 / speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <rect x={x} y={66} width={cellW} height={32} rx={3}
              fill="rgba(245,158,11,0.04)"
              stroke="rgba(245,158,11,0.22)"
              strokeWidth={1} />
            <text x={x + cellW / 2} y={88} textAnchor="middle"
              fontSize="14" fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={isFocused ? '#fff' : 'rgba(255,255,255,0.55)'}>
              {ch === ' ' ? '·' : ch}
            </text>
            <text x={x + cellW / 2} y={114} textAnchor="middle"
              fontSize="9" fontFamily="var(--font-mono)"
              fill={isFocused ? ACCENT.amber : ACCENT.dim}>
              {i}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── Chamber outline + corner brackets ─────────── */
function FFNChamber({ phase, speed }: { phase: number; speed: number }) {
  const X = 80, Y = 220, W = 1240, H = 480
  const brk = 24 // corner bracket length
  // Pulse the chamber outline gently while idle, brighter on phase 2 (fire)
  const pulseOpacity = phase === 2 ? 0.55 : 0.28
  return (
    <g>
      {/* Soft chamber background */}
      <rect x={X} y={Y} width={W} height={H} rx={18}
        fill="rgba(245,158,11,0.025)"
        stroke="rgba(245,158,11,0.18)" strokeWidth={1} />
      {/* corner brackets */}
      {[
        [X, Y, 1, 1], [X + W, Y, -1, 1],
        [X, Y + H, 1, -1], [X + W, Y + H, -1, -1],
      ].map(([cx, cy, sx, sy], i) => (
        <motion.path
          key={`brk-${i}`}
          d={`M ${cx} ${cy + sy * brk} L ${cx} ${cy} L ${cx + sx * brk} ${cy}`}
          stroke={ACCENT.amber}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [pulseOpacity, pulseOpacity + 0.25, pulseOpacity] }}
          transition={{ duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Chamber title */}
      <text x={X + 18} y={Y + 24} fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.amber} letterSpacing="0.32em" opacity={0.7}>
        FFN CHAMBER · 384 → 1536 → 384
      </text>
    </g>
  )
}

/* (FFNStationLabels removed — each station component carries its own label.) */

/* ─────────── Geometry shared by phases ─────────── */
const FFN_GEOM = {
  // input vector column
  inX: 192, inY: 290, cellW: 16, cellH: 22,           // DIN=16 → 16w × 352h
  // W1 gate
  w1X: 360, w1Y: 320, w1W: 60, w1H: 280,
  // hidden block (4 cols × 16 rows = 64 cells, each 22×22 → 88w × 352h)
  hidX: 612, hidY: 290, hidColW: 22, hidColH: 22, hidCols: 4, hidRows: 16,
  // W2 gate
  w2X: 1000, w2Y: 320, w2W: 60, w2H: 280,
  // output vector column
  outX: 1192, outY: 290, outCellW: 16, outCellH: 22,
}

/* Input column renderer — always visible; pulses softly when highlighted */
function FFNInputColumn({
  values,
  colorRes,
  highlighted = false,
  speed,
}: {
  values: number[]
  colorRes: (v: number) => string
  highlighted?: boolean
  speed: number
}) {
  const { inX, inY, cellW, cellH } = FFN_GEOM
  return (
    <g>
      {/* Highlight halo when this station is the current beat */}
      {highlighted && (
        <motion.rect
          x={inX - 6} y={inY - 6}
          width={cellW + 12} height={16 * cellH + 12} rx={4}
          fill="none" stroke={COL_FFN_X} strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.6 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {values.map((v, i) => (
        <rect
          key={`in-${i}`}
          x={inX} y={inY + i * cellH}
          width={cellW} height={cellH - 2} rx={2}
          fill={colorRes(v)}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />
      ))}
      <text x={inX + cellW / 2} y={inY - 14} textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_FFN_X}>
        x
      </text>
      <text x={inX + cellW / 2} y={inY + 16 * cellH + 16} textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        ∈ R³⁸⁴
      </text>
    </g>
  )
}

/* Hidden block renderer — always-on GELU firing; intensified during fire phase */
function FFNHiddenBlock({
  hPre,
  hPost,
  fireMask = true,
  intensified = false,
  speed,
  colorRes,
  colorAmberFire,
}: {
  hPre: number[]
  hPost: number[]
  fireMask?: boolean
  intensified?: boolean
  speed: number
  colorRes: (v: number) => string
  colorAmberFire: (v: number) => string
}) {
  const { hidX, hidY, hidColW, hidColH, hidCols, hidRows } = FFN_GEOM
  return (
    <g>
      {/* Highlight halo around the bank when fire phase is current */}
      {intensified && (
        <motion.rect
          x={hidX - 8} y={hidY - 8}
          width={hidCols * hidColW + 16}
          height={hidRows * hidColH + 16}
          rx={6}
          fill="rgba(245,158,11,0.06)"
          stroke={COL_FFN_FIRE}
          strokeWidth={1.5}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.8 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* Cells — every active hPost cell breathes continuously */}
      {Array.from({ length: hidCols * hidRows }).map((_, idx) => {
        const r = idx % hidRows
        const c = Math.floor(idx / hidRows)
        const cx = hidX + c * hidColW
        const cy = hidY + r * hidColH
        const v = fireMask ? hPost[idx] : hPre[idx]
        const isActive = fireMask && hPost[idx] > 0.15
        const fill = fireMask ? colorAmberFire(hPost[idx]) : colorRes(v / 1.5)
        const breatheRange = intensified ? [0.6, 1, 0.6] : [0.65, 0.92, 0.65]
        const scaleRange = intensified ? [1, 1.08, 1] : [1, 1.03, 1]
        return (
          <motion.rect
            key={`hid-${idx}`}
            x={cx} y={cy} width={hidColW - 2} height={hidColH - 2} rx={2}
            fill={fill}
            stroke={isActive ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.05)'}
            strokeWidth={isActive ? 1 : 0.5}
            initial={{ opacity: 1, scale: 1 }}
            animate={
              isActive
                ? { opacity: breatheRange, scale: scaleRange }
                : { opacity: 1, scale: 1 }
            }
            transition={
              isActive
                ? { duration: (intensified ? 1.4 : 1.8) / speed, repeat: Infinity, ease: 'easeInOut', delay: (idx % 8) * 0.05 }
                : { duration: 0.3 / speed }
            }
          />
        )
      })}
      <text x={hidX + (hidCols * hidColW) / 2} y={hidY - 14} textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={fireMask ? COL_FFN_FIRE : 'rgba(255,255,255,0.85)'}>
        {fireMask ? 'GELU(W₁x)' : 'W₁x'}
      </text>
      <text x={hidX + (hidCols * hidColW) / 2}
        y={hidY + hidRows * hidColH + 16} textAnchor="middle"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        ∈ R¹⁵³⁶ (4× wider feature bank)
      </text>
    </g>
  )
}

/* Output column renderer — always visible; pulses when highlighted */
function FFNOutputColumn({
  values,
  colorRes,
  highlighted = false,
  speed,
}: {
  values: number[]
  colorRes: (v: number) => string
  highlighted?: boolean
  speed: number
}) {
  const { outX, outY, outCellW, outCellH } = FFN_GEOM
  return (
    <g>
      {/* Halo when this is the active station */}
      {highlighted && (
        <motion.rect
          x={outX - 6} y={outY - 6}
          width={outCellW + 12} height={16 * outCellH + 12} rx={4}
          fill="none" stroke={COL_FFN_W2} strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.85, 0.3] }}
          transition={{ duration: 1.6 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {values.map((v, i) => (
        <rect
          key={`out-${i}`}
          x={outX} y={outY + i * outCellH}
          width={outCellW} height={outCellH - 2} rx={2}
          fill={colorRes(v)}
          stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}
        />
      ))}
      <text x={outX + outCellW / 2} y={outY - 14} textAnchor="middle"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_FFN_W2}>
        Δx
      </text>
      <text x={outX + outCellW / 2} y={outY + 16 * outCellH + 16}
        textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim}>
        ∈ R³⁸⁴
      </text>
    </g>
  )
}

/* W1 gate visual */
function FFNGateW1({ active, speed }: { active: boolean; speed: number }) {
  const { w1X, w1Y, w1W, w1H } = FFN_GEOM
  return (
    <g>
      <motion.rect
        x={w1X} y={w1Y} width={w1W} height={w1H} rx={8}
        fill="url(#ffn-w1-grad)"
        stroke={COL_FFN_W1}
        strokeWidth={active ? 2 : 1}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: active ? [0.7, 1, 0.7] : 0.5 }}
        transition={{
          duration: 1.6 / speed,
          repeat: active ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      <text x={w1X + w1W / 2} y={w1Y + w1H / 2 - 6}
        textAnchor="middle" fontSize="22" fontFamily="var(--font-display)"
        fontStyle="italic" fill={COL_FFN_W1}>
        W₁
      </text>
      <text x={w1X + w1W / 2} y={w1Y + w1H / 2 + 16}
        textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim}>
        expand 4×
      </text>
    </g>
  )
}

/* W2 gate visual */
function FFNGateW2({ active, speed }: { active: boolean; speed: number }) {
  const { w2X, w2Y, w2W, w2H } = FFN_GEOM
  return (
    <g>
      <motion.rect
        x={w2X} y={w2Y} width={w2W} height={w2H} rx={8}
        fill="url(#ffn-w2-grad)"
        stroke={COL_FFN_W2}
        strokeWidth={active ? 2 : 1}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: active ? [0.7, 1, 0.7] : 0.5 }}
        transition={{
          duration: 1.6 / speed,
          repeat: active ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      <text x={w2X + w2W / 2} y={w2Y + w2H / 2 - 6}
        textAnchor="middle" fontSize="22" fontFamily="var(--font-display)"
        fontStyle="italic" fill={COL_FFN_W2}>
        W₂
      </text>
      <text x={w2X + w2W / 2} y={w2Y + w2H / 2 + 16}
        textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim}>
        compress
      </text>
    </g>
  )
}

/* ─────────── Continuous flow particles through the entire pipeline ─────────── */
function FFNFlowParticles({ phase, speed }: { phase: number; speed: number }) {
  const { inX, inY, cellW, cellH, w1X, w1W, hidX, hidY, hidColW, hidColH, hidCols, hidRows, w2X, w2W, outX, outY, outCellW, outCellH } = FFN_GEOM
  const N = 18

  // Stream A: x → W₁ → hidden bank (always running, brighter on phase 1)
  const streamA = Array.from({ length: N }).map((_, i) => {
    const startY = inY + ((i * 7) % 16) * cellH + cellH / 2
    const targetCell = (i * 11) % (hidRows * hidCols)
    const tr = targetCell % hidRows
    const tc = Math.floor(targetCell / hidRows)
    const endY = hidY + tr * hidColH + hidColH / 2
    const endX = hidX + tc * hidColW + hidColW / 2
    const bright = phase === 1
    return (
      <motion.circle
        key={`fa-${i}`}
        r={2.4}
        fill={COL_FFN_W1}
        initial={{ cx: inX + cellW, cy: startY, opacity: 0 }}
        animate={{
          cx: [inX + cellW, w1X + 4, w1X + w1W - 4, endX],
          cy: [startY, startY, (startY + endY) / 2, endY],
          opacity: [0, bright ? 1 : 0.55, bright ? 0.95 : 0.5, 0],
        }}
        transition={{
          duration: 1.8 / speed,
          delay: (i * 0.11) / speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    )
  })

  // Stream B: hidden bank → W₂ → output column (always running, brighter on phase 3)
  const streamB = Array.from({ length: N }).map((_, i) => {
    const sourceCell = (i * 13) % (hidRows * hidCols)
    const sr = sourceCell % hidRows
    const sc = Math.floor(sourceCell / hidRows)
    const startX = hidX + sc * hidColW + hidColW / 2
    const startY = hidY + sr * hidColH + hidColH / 2
    const endY = outY + ((i * 5) % 16) * outCellH + outCellH / 2
    const bright = phase === 3
    return (
      <motion.circle
        key={`fb-${i}`}
        r={2.4}
        fill={COL_FFN_W2}
        initial={{ cx: startX, cy: startY, opacity: 0 }}
        animate={{
          cx: [startX, w2X + 4, w2X + w2W - 4, outX],
          cy: [startY, (startY + endY) / 2, (startY + endY) / 2, endY],
          opacity: [0, bright ? 1 : 0.5, bright ? 0.95 : 0.5, 0],
        }}
        transition={{
          duration: 1.8 / speed,
          delay: (0.6 + i * 0.11) / speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    )
  })

  // Stream C: Δx → drop down to merge point on residual stream (brighter on phase 4)
  const mergeX = 700
  const mergeY = 760
  const streamC = Array.from({ length: 12 }).map((_, i) => {
    const startX = outX + outCellW / 2
    const startY = outY + ((i * 3) % 16) * outCellH + outCellH / 2
    const bright = phase === 4
    return (
      <motion.circle
        key={`fc-${i}`}
        r={2.4}
        fill={ACCENT.amber}
        initial={{ cx: startX, cy: startY, opacity: 0 }}
        animate={{
          cx: [startX, startX, mergeX],
          cy: [startY, outY + 16 * outCellH + 30, mergeY],
          opacity: [0, bright ? 1 : 0.45, 0],
        }}
        transition={{
          duration: 1.6 / speed,
          delay: (1.1 + i * 0.16) / speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    )
  })

  return (
    <g>
      {streamA}
      {streamB}
      {streamC}
    </g>
  )
}

/* ─────────── Residual stream below chamber + always-on merge ─────────── */
function FFNResidualStream({
  xIn,
  xOut,
  colorRes,
  phase,
  speed,
}: {
  xIn: number[]
  xOut: number[]
  colorRes: (v: number) => string
  phase: number
  speed: number
}) {
  const BAR_X = 80
  const BAR_W = 1240
  const BAR_Y = 740
  const BAR_H = 30
  const cellCount = 64
  const cellW = BAR_W / cellCount
  const mergeX = 700
  const showUpdated = phase === 4

  return (
    <g>
      {/* Track label */}
      <text x={BAR_X} y={BAR_Y - 10} fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        RESIDUAL STREAM ▸
      </text>
      <text x={BAR_X + BAR_W} y={BAR_Y - 10} textAnchor="end"
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.amber}>
        x ← x + Δx
      </text>

      {/* Track outline */}
      <rect x={BAR_X} y={BAR_Y} width={BAR_W} height={BAR_H} rx={6}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(245,158,11,0.20)" strokeWidth={1} />

      {/* Cells: left side = x_in, right side = x_out (post-merge) */}
      {Array.from({ length: cellCount }).map((_, i) => {
        const past = (i * (BAR_W / cellCount)) < (mergeX - BAR_X)
        const v = past ? xIn[i % xIn.length] : (showUpdated ? xOut[i % xOut.length] : xIn[i % xIn.length])
        const cellX = BAR_X + i * cellW + 1
        const isPostMerge = !past
        return (
          <motion.rect
            key={`res-${i}`}
            x={cellX} y={BAR_Y + 3}
            width={cellW - 2} height={BAR_H - 6} rx={1}
            fill={colorRes(v)}
            initial={{ opacity: 0.5 }}
            animate={{
              opacity: isPostMerge && showUpdated
                ? [0.5, 1, 0.85]
                : 0.6,
            }}
            transition={
              isPostMerge && showUpdated
                ? { duration: 1.2 / speed, ease: 'easeOut', delay: ((i - cellCount / 2) * 0.012) / speed }
                : { duration: 0.4 / speed }
            }
          />
        )
      })}

      {/* Constant left-to-right flow indicator inside the bar */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.circle
          key={`res-flow-${i}`}
          r={2}
          fill="rgba(245,158,11,0.6)"
          initial={{ cx: BAR_X, cy: BAR_Y + BAR_H / 2, opacity: 0 }}
          animate={{
            cx: [BAR_X, BAR_X + BAR_W],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: 4.5 / speed,
            delay: (i * 0.9) / speed,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Merge point: + symbol pulses; brighter on phase 4 */}
      <g>
        <motion.circle
          cx={mergeX} cy={BAR_Y + BAR_H / 2}
          r={18}
          fill="rgba(245,158,11,0.10)"
          stroke={ACCENT.amber}
          strokeWidth={1.5}
          initial={{ opacity: 0.4 }}
          animate={{
            opacity: showUpdated ? [0.5, 1, 0.6] : [0.35, 0.55, 0.35],
            r: showUpdated ? [16, 22, 16] : [16, 18, 16],
          }}
          transition={{ duration: 1.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text x={mergeX} y={BAR_Y + BAR_H / 2 + 8}
          textAnchor="middle" fontSize="22" fontFamily="var(--font-display)"
          fill={ACCENT.amber}>
          +
        </text>
      </g>

      {/* Drop arrow from Δx column to merge — visible always, pulsates */}
      <motion.path
        d={`M ${FFN_GEOM.outX + FFN_GEOM.outCellW / 2} ${FFN_GEOM.outY + 16 * FFN_GEOM.outCellH + 22}
            Q ${FFN_GEOM.outX + FFN_GEOM.outCellW / 2} ${BAR_Y - 20},
              ${mergeX} ${BAR_Y - 6}`}
        stroke={COL_FFN_W2}
        strokeWidth={1.4}
        fill="none"
        opacity={0.55}
        strokeDasharray="4,4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1] }}
        transition={{ duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
      />
    </g>
  )
}

/* ─────────── Phase caption (crossfades; never remounts) ─────────── */
function FFNCaption({ phase, speed }: { phase: number; speed: number }) {
  const captions = [
    'one focused token enters — attention is done, now each token alone',
    'W₁ projects into a 4× wider feature bank',
    'GELU keeps strong activations, silences the rest',
    'W₂ collapses the activated bank into a thin update vector',
    'Δx adds back into the residual stream — the token is updated',
  ]
  return (
    <g>
      {captions.map((c, i) => (
        <motion.text
          key={`cap-${i}`}
          x={700} y={820} textAnchor="middle"
          fontSize="15" fontFamily="var(--font-mono)"
          fill="rgba(255,255,255,0.92)"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === i ? 1 : 0 }}
          transition={{ duration: 0.45 / speed, ease: 'easeOut' }}
        >
          {c}
        </motion.text>
      ))}
    </g>
  )
}

/* ─────────── Phase summary footer ─────────── */
function FFNPhaseSummary({ phase }: { phase: number }) {
  const beats = ['input', 'expand', 'fire', 'compress', 'add']
  return (
    <g transform="translate(700, 940)">
      {beats.map((b, i) => {
        const w = 100
        const x = (i - beats.length / 2) * w + w / 2
        const active = i === phase
        const done = i < phase
        return (
          <g key={`sum-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 6} y={-14} width={w - 12} height={28} rx={14}
              fill={active ? 'rgba(245,158,11,0.18)' : 'transparent'}
              stroke={active ? ACCENT.amber : ACCENT.rule}
              strokeWidth={active ? 1.5 : 1} />
            <text x={0} y={4} textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)"
              fill={active ? ACCENT.amber : done ? 'rgba(255,255,255,0.5)' : ACCENT.dim}
              letterSpacing="0.16em">
              {(i + 1)}.{b.toUpperCase()}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── FFN split-pane wrapper ─────────── */
export function FFNSplitPane() {
  const speed = useSpeed()
  const PHASES = 5
  const phaseLabels = [
    'one token enters',
    'W₁ expand 4×',
    'GELU fire',
    'W₂ compress',
    'residual add',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      3200 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      One focused token leaves attention and arrives at the FFN. From here
      every token is processed <em>independently</em> — no more mixing.
    </>,
    <>
      W₁ projects the 384-d vector into a much wider 1536-d space. Think of
      it as a bank of <em>candidate features</em> the model could detect.
    </>,
    <>
      GELU keeps the strong activations and softly silences the rest. This
      is where the network <em>chooses</em> which features matter for this token.
    </>,
    <>
      W₂ collapses the 1536-d activated vector back down to 384-d — a focused
      update that lives in the same space as the residual stream.
    </>,
    <>
      The FFN's update is added back to the original residual stream:
      x ← x + FFN(LN(x)). The token vector now carries the new information.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'per-token MLP',
      body: <>FFN(x) applied independently at every position</>,
    },
    {
      label: 'expand',
      body: <>h = W₁ x &nbsp;·&nbsp; R³⁸⁴ → R¹⁵³⁶</>,
    },
    {
      label: 'activate',
      body: <>h̃ = GELU(h)</>,
    },
    {
      label: 'compress',
      body: <>Δx = W₂ h̃ &nbsp;·&nbsp; R¹⁵³⁶ → R³⁸⁴</>,
    },
    {
      label: 'residual update',
      body: <>x ← x + W₂ · GELU(W₁ · LN(x))</>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'Attention mixed information across tokens. The FFN does the opposite — it processes each token in isolation. Same parameters at every position.',
    'Most of the model\'s parameters live in W₁ and W₂. A GPT-2 block has ~25M params in FFN vs ~6M in attention. Wider FFN = more facts the model can store.',
    'GELU is smoother than ReLU — small negatives leak through, so gradients keep flowing. Modern models use GELU (GPT) or Swish (LLaMA via SwiGLU).',
    'W₂ is 1536 × 384 — it\'s how the model decides which combination of fired features to project back as an update to the residual stream.',
    'The residual connection means the FFN never replaces the token vector — it only adds a correction. Each block nudges the stream a little closer to the answer.',
  ]

  return (
    <SplitPaneScene
      viz={<VizFFN />}
      text={{
        kicker: ACT2_KICKER,
        title: 'Expand. Fire. Compress.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.amber,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.amber}
          />
        ),
        stats: [
          { label: 'd_model', value: '384', color: COL_FFN_X },
          { label: 'd_hidden', value: '1536', color: COL_FFN_FIRE },
          { label: 'expansion', value: '4×' },
          { label: 'activation', value: 'GELU' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

export function MultiHeadSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const phaseLabels = [
    'split into 6 heads',
    'different patterns',
    'concat → W_O → output',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      8000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Per-phase right-pane content
  const subtitleByPhase: ReactNode[] = [
    <>
      The same input is projected six different ways. Each head gets its own{' '}
      <em>W_Q</em>, <em>W_K</em>, <em>W_V</em>.
    </>,
    <>
      Each head learns to attend to a different relation — previous token,
      sentence start, vowels, two-back, content, broad spread.
    </>,
    <>
      Six 64-dim outputs are concatenated, then a final{' '}
      <em>W_O</em> matrix mixes them back into a single 384-dim stream.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'six independent heads',
      body: (
        <>
          head<sub>i</sub> = Attn<sub>i</sub>(x)
          <br />
          <span style={{ fontSize: '0.78em', opacity: 0.72 }}>
            each head has its own W<sub>Q,i</sub>, W<sub>K,i</sub>, W<sub>V,i</sub>
          </span>
        </>
      ),
    },
    {
      label: 'heads specialize',
      body: (
        <>
          head 0 prev-token · head 1 start-anchor
          <br />
          head 2 vowel-hook · head 3 two-back
          <br />
          head 4 content · head 5 spread
        </>
      ),
    },
    {
      label: 'multi-head attention',
      body: (
        <>
          MHA(x) = W<sub>O</sub> · concat(head<sub>1</sub>, …, head<sub>6</sub>)
        </>
      ),
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'All six heads run in parallel on the same input. Width is split: d_model = 384, h = 6, d_head = 64. So 6 × 64 = 384 — same total work as one big head, but with six different learned views.',
    'Different heads tend to specialize during training — some attend nearby, some far back, some by syntax, some by content. The patterns shown are illustrative; trained heads vary by model.',
    'W_O is a learned 384 × 384 matrix. Without it, the six head streams would just sit side by side. W_O lets them interact and produces the final per-token update added to the residual stream.',
  ]

  return (
    <SplitPaneScene
      viz={<VizMultiHead />}
      text={{
        kicker: ACT2_KICKER,
        title: 'Six heads, in parallel.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.violet,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.violet}
          />
        ),
        stats: [
          { label: 'd_model', value: '384', color: ACCENT.violet },
          { label: 'heads', value: '6', color: '#a78bfa' },
          { label: 'd_head', value: '64', color: '#f59e0b' },
          { label: 'W_O params', value: '147 K' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 14 — ffn-feature: "One hidden neuron, one (illustrative) feature."
 *
 * Three persistent zones, all running continuously:
 *   LEFT   — Hidden bank (1536-d, sampled). One cell highlighted = "dim #147".
 *   CENTER — Token stream sliding through a viewing window (current = focus).
 *   RIGHT  — Activation profile bar chart. Bars pulse when stream matches.
 *
 * Honest framing: the feature label ("code-like tokens") is illustrative,
 * not factual. Real learned features are messy / distributed / polysemantic.
 * ====================================================================== */

const COL_FF_NEURON = ACCENT.amber

interface FFActProfile {
  token: string
  activation: number
}

const FF_TOKEN_STREAM: string[] = [
  'function', 'the', 'import', 'cat', 'return', 'pretty',
  'def', 'sky', 'class', 'run', 'code', 'water',
  'var', 'apple', 'await', 'tree', 'export', 'red',
]

const FF_PROFILE: FFActProfile[] = [
  { token: 'function', activation: 0.94 },
  { token: 'import',   activation: 0.91 },
  { token: 'return',   activation: 0.86 },
  { token: 'class',    activation: 0.82 },
  { token: 'export',   activation: 0.79 },
  { token: 'code',     activation: 0.76 },
  { token: 'def',      activation: 0.72 },
  { token: 'var',      activation: 0.65 },
  { token: 'await',    activation: 0.58 },
  { token: 'the',      activation: 0.10 },
  { token: 'cat',      activation: 0.08 },
  { token: 'sky',      activation: 0.12 },
  { token: 'run',      activation: 0.16 },
  { token: 'pretty',   activation: 0.09 },
  { token: 'water',    activation: 0.11 },
  { token: 'apple',    activation: 0.13 },
  { token: 'tree',     activation: 0.15 },
  { token: 'red',      activation: 0.07 },
]

function ffActivationFor(tok: string): number {
  return FF_PROFILE.find((p) => p.token === tok)?.activation ?? 0
}

/* Dim #147's "learned" weight template — 16 dims, fixed per session. */
const FF_W147 = Array.from({ length: 16 }).map(
  (_, i) => Math.sin(i * 0.71 + 0.3) * 0.95 + Math.cos(i * 0.43) * 0.35,
)
const FF_W147_NORM_SQ = FF_W147.reduce((s, w) => s + w * w, 0)

/* Build a token's hidden representation x such that GELU(x · W₁[147])
 * roughly matches its activation profile. High-activation tokens look
 * similar to W (alignment); low-activation tokens are mostly noise. */
function ffComputeXForToken(activation: number, tokenSeed: number): number[] {
  const targetZ = activation > 0.5 ? activation * 1.7 : activation * 1.2 - 0.05
  const scale = targetZ / FF_W147_NORM_SQ
  return FF_W147.map((w, i) => {
    const base = scale * w
    const noise = Math.sin((i + tokenSeed * 1.7) * 1.13 + tokenSeed * 0.31) * 0.55 * (1 - activation * 0.7)
    return base + noise
  })
}

function ffSeedForToken(tok: string): number {
  return tok.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 100
}

/* Diverging color (cyan positive, muted red negative) — for input/product cells. */
function ffColorRes(v: number): string {
  const m = Math.max(-1.5, Math.min(1.5, v)) / 1.5
  if (m >= 0) return `rgba(34,211,238,${0.18 + m * 0.62})`
  return `rgba(248,113,113,${0.18 + -m * 0.5})`
}

/* Amber-coded color for weight cells (same template every frame). */
function ffColorWeight(w: number): string {
  if (w >= 0) return `rgba(245,158,11,${0.20 + Math.min(1, w) * 0.65})`
  return `rgba(248,113,113,${0.20 + Math.min(1, -w) * 0.55})`
}

/* Product cells: brightness = magnitude, color = sign of product. */
function ffColorProduct(p: number): string {
  const m = Math.min(1, Math.abs(p) / 1.2)
  if (p >= 0) return `rgba(245,158,11,${0.18 + m * 0.78})`
  return `rgba(248,113,113,${0.18 + m * 0.55})`
}

export function VizFFNFeature() {
  const speed = useSpeed()

  // 3 phases, ~7s each
  const PHASES = 3
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      7000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Token stream cursor — monotonically increasing for stable React keys
  const [streamIdx, setStreamIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setStreamIdx((i) => i + 1),
      950 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const currentToken = FF_TOKEN_STREAM[streamIdx % FF_TOKEN_STREAM.length]
  const currentActivation = ffActivationFor(currentToken)
  const isFiring = currentActivation > 0.5

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ff-glow"><feGaussianBlur stdDeviation="2.5" /></filter>
          <filter id="ff-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <clipPath id="ff-stream-clip">
            <rect x={460} y={372} width={460} height={88} rx={6} />
          </clipPath>
        </defs>

        {/* Top kicker */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          BLOCK 0 · FFN · ZOOM INTO ONE HIDDEN DIMENSION
        </text>

        {/* Big title */}
        <text x={700} y={92} textAnchor="middle"
          fontSize="22" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.92)">
          one hidden neuron, one (illustrative) feature
        </text>
        <text x={700} y={118} textAnchor="middle"
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.08em">
          1536 hidden dims · pick one · ask what it lights up on
        </text>

        {/* Hidden bank (left) */}
        <FFFeatureHiddenBank phase={phase} firing={isFiring} speed={speed} />

        {/* Connection arc: stream window → highlighted neuron */}
        <FFFeatureConnection isFiring={isFiring} speed={speed} />

        {/* Token stream (center) */}
        <FFFeatureTokenStream
          streamIdx={streamIdx}
          phase={phase}
          isFiring={isFiring}
          speed={speed}
        />

        {/* Activation panel (right) */}
        <FFFeatureActivationPanel
          currentToken={currentToken}
          phase={phase}
          speed={speed}
        />

        {/* Mechanism strip — dot product with the learned template */}
        <FFFeatureMechanism
          currentToken={currentToken}
          currentActivation={currentActivation}
          isFiring={isFiring}
          speed={speed}
        />

        {/* Honesty note */}
        <FFFeatureHonestyNote />

        {/* Phase summary */}
        <FFFeaturePhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── Hidden bank with hero neuron (LEFT) ─────────── */
const FF_BANK = {
  X: 110, Y: 230, COLS: 14, ROWS: 14, CELL_W: 14, CELL_H: 11,
  HERO_C: 6, HERO_R: 7,
}
const FF_HERO_X = FF_BANK.X + FF_BANK.HERO_C * FF_BANK.CELL_W
const FF_HERO_Y = FF_BANK.Y + FF_BANK.HERO_R * FF_BANK.CELL_H
const FF_HERO_CX = FF_HERO_X + FF_BANK.CELL_W / 2
const FF_HERO_CY = FF_HERO_Y + FF_BANK.CELL_H / 2

function FFFeatureHiddenBank({
  phase, firing, speed,
}: { phase: number; firing: boolean; speed: number }) {
  const { X, Y, COLS, ROWS, CELL_W, CELL_H, HERO_C, HERO_R } = FF_BANK
  return (
    <g>
      {/* Header */}
      <text x={X} y={Y - 28} fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        FFN HIDDEN LAYER
      </text>
      <text x={X} y={Y - 12} fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} fontStyle="italic">
        showing 196 of 1536 dims
      </text>

      {/* Phase 1 highlight ring around bank */}
      {phase === 0 && (
        <motion.rect
          x={X - 8} y={Y - 8}
          width={COLS * CELL_W + 16}
          height={ROWS * CELL_H + 16}
          rx={6}
          fill="none" stroke={COL_FF_NEURON} strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Background cells — dim */}
      {Array.from({ length: COLS * ROWS }).map((_, idx) => {
        const r = Math.floor(idx / COLS)
        const c = idx % COLS
        const isHero = r === HERO_R && c === HERO_C
        if (isHero) return null
        // Subtle variation for realism
        const v = Math.abs(Math.sin(idx * 1.71))
        return (
          <rect
            key={`bank-${idx}`}
            x={X + c * CELL_W} y={Y + r * CELL_H}
            width={CELL_W - 1} height={CELL_H - 1} rx={1}
            fill={`rgba(245,158,11,${0.04 + v * 0.10})`}
            stroke="rgba(245,158,11,0.10)"
            strokeWidth={0.4}
          />
        )
      })}

      {/* Hero halo (always pulsing) */}
      <motion.circle
        cx={FF_HERO_CX} cy={FF_HERO_CY}
        r={20}
        fill="rgba(245,158,11,0.06)"
        stroke={COL_FF_NEURON}
        strokeWidth={1.5}
        filter="url(#ff-bloom)"
        initial={{ opacity: 0.3 }}
        animate={{
          opacity: firing ? [0.5, 1, 0.5] : [0.25, 0.45, 0.25],
          r: firing ? [20, 32, 20] : [18, 22, 18],
        }}
        transition={{
          duration: firing ? 0.55 / speed : 1.8 / speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Hero cell */}
      <motion.rect
        x={FF_HERO_X} y={FF_HERO_Y}
        width={CELL_W - 1} height={CELL_H - 1} rx={1}
        fill={COL_FF_NEURON}
        stroke={COL_FF_NEURON}
        strokeWidth={1.5}
        initial={{ opacity: 0.7 }}
        animate={{
          opacity: firing ? [0.7, 1, 0.7] : [0.4, 0.6, 0.4],
          scale: firing ? [1, 1.5, 1] : [1, 1.05, 1],
        }}
        transition={{
          duration: firing ? 0.5 / speed : 1.6 / speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: `${FF_HERO_CX}px ${FF_HERO_CY}px` }}
      />

      {/* Hero label callout */}
      <line x1={FF_HERO_CX + 28} y1={FF_HERO_CY}
        x2={FF_HERO_CX + 60} y2={FF_HERO_CY}
        stroke={COL_FF_NEURON} strokeWidth={1} strokeOpacity={0.6} />
      <text x={FF_HERO_CX + 66} y={FF_HERO_CY - 4}
        fontSize="13" fontFamily="var(--font-display)"
        fontStyle="italic" fill={COL_FF_NEURON}>
        hidden dim #147
      </text>
      <text x={FF_HERO_CX + 66} y={FF_HERO_CY + 12}
        fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        illustrative detector
      </text>

      {/* Bank-wide footer label */}
      <text x={X + (COLS * CELL_W) / 2}
        y={Y + ROWS * CELL_H + 22}
        textAnchor="middle"
        fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        ∈ R¹⁵³⁶ (post-GELU)
      </text>
    </g>
  )
}

/* ─────────── Token stream sliding through window (CENTER) ─────────── */
const FF_STREAM = {
  X: 460, Y: 372, W: 460, H: 88,
  SLOT_W: 96,
  CENTER_CX: 460 + 230,  // X + W/2
  CENTER_CY: 372 + 44,
}

function FFFeatureTokenStream({
  streamIdx, phase, isFiring, speed,
}: { streamIdx: number; phase: number; isFiring: boolean; speed: number }) {
  const { X, Y, W, H, SLOT_W, CENTER_CX } = FF_STREAM
  const visibleOffsets = [-2, -1, 0, 1, 2]

  return (
    <g>
      {/* Header */}
      <text x={X + W / 2} y={Y - 32}
        textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        INCOMING TOKENS ▸
      </text>
      <text x={X + W / 2} y={Y - 14}
        textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} fontStyle="italic">
        feeding into FFN, one at a time
      </text>

      {/* Window frame */}
      <rect x={X} y={Y} width={W} height={H} rx={8}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(245,158,11,0.20)" strokeWidth={1} />

      {/* Center focus indicator */}
      <rect x={CENTER_CX - SLOT_W / 2 - 4} y={Y - 4}
        width={SLOT_W + 8} height={H + 8} rx={6}
        fill="none"
        stroke={isFiring ? COL_FF_NEURON : 'rgba(245,158,11,0.30)'}
        strokeWidth={isFiring ? 1.8 : 1}
        strokeDasharray={isFiring ? '0' : '4,4'} />
      <text x={CENTER_CX} y={Y + H + 22}
        textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} fontStyle="italic">
        ↑ current token
      </text>

      {/* Tokens — sliding left as streamIdx increments */}
      <g clipPath="url(#ff-stream-clip)">
        {visibleOffsets.map((offset) => {
          const absIdx = streamIdx + offset
          if (absIdx < 0) return null
          const tok = FF_TOKEN_STREAM[absIdx % FF_TOKEN_STREAM.length]
          const act = ffActivationFor(tok)
          const isCenter = offset === 0
          const isHigh = act > 0.5
          const xPos = CENTER_CX + offset * SLOT_W
          // Spawn from one slot to the right, slide to natural position
          const initialX = xPos + SLOT_W
          return (
            <motion.g
              key={`tok-${absIdx}`}
              initial={{ x: initialX - xPos, opacity: 0 }}
              animate={{ x: 0, opacity: isCenter ? 1 : Math.abs(offset) === 1 ? 0.6 : 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 / speed, ease: 'easeOut' }}
            >
              <rect
                x={xPos - SLOT_W / 2 + 6} y={Y + 14}
                width={SLOT_W - 12} height={H - 28} rx={5}
                fill={isCenter && isHigh
                  ? 'rgba(245,158,11,0.18)'
                  : 'rgba(255,255,255,0.04)'}
                stroke={isCenter
                  ? (isHigh ? COL_FF_NEURON : 'rgba(255,255,255,0.30)')
                  : 'rgba(255,255,255,0.10)'}
                strokeWidth={isCenter ? 1.5 : 0.6}
              />
              <text x={xPos} y={Y + H / 2 + 5}
                textAnchor="middle"
                fontSize={isCenter ? '17' : '13'}
                fontFamily="var(--font-mono)" fontStyle="italic"
                fill={isCenter ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.55)'}>
                {tok}
              </text>
              {isCenter && (
                <text x={xPos} y={Y + H - 6}
                  textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
                  fill={isHigh ? COL_FF_NEURON : 'rgba(255,255,255,0.4)'}>
                  h₁₄₇ = {act.toFixed(2)}
                </text>
              )}
            </motion.g>
          )
        })}
      </g>

      {/* Phase 2 highlight */}
      {phase === 1 && (
        <motion.rect
          x={X - 8} y={Y - 44}
          width={W + 16} height={H + 76}
          rx={8}
          fill="none" stroke={COL_FF_NEURON} strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </g>
  )
}

/* ─────────── Connection arc: stream center → hero neuron ─────────── */
function FFFeatureConnection({ isFiring, speed }: { isFiring: boolean; speed: number }) {
  const fromX = FF_STREAM.CENTER_CX
  const fromY = FF_STREAM.Y + 8
  const toX = FF_HERO_CX
  const toY = FF_HERO_CY
  const ctrlX = (fromX + toX) / 2
  const ctrlY = 230
  // Sample 8 points along the quadratic Bezier for traveling particles
  const ts = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]
  const cxs = ts.map(
    (t) => Math.pow(1 - t, 2) * fromX + 2 * (1 - t) * t * ctrlX + t * t * toX,
  )
  const cys = ts.map(
    (t) => Math.pow(1 - t, 2) * fromY + 2 * (1 - t) * t * ctrlY + t * t * toY,
  )
  return (
    <g opacity={isFiring ? 1 : 0.35} style={{ transition: 'opacity 0.3s' }}>
      <path
        d={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY}, ${toX} ${toY}`}
        stroke={COL_FF_NEURON}
        strokeWidth={isFiring ? 2 : 1}
        strokeOpacity={isFiring ? 0.7 : 0.25}
        fill="none"
        strokeDasharray={isFiring ? '0' : '4,4'}
      />
      {/* Continuously traveling particles */}
      {Array.from({ length: 4 }).map((_, k) => (
        <motion.circle
          key={`ff-conn-${k}`}
          r={3}
          fill={COL_FF_NEURON}
          filter="url(#ff-glow)"
          initial={{ cx: fromX, cy: fromY, opacity: 0 }}
          animate={{
            cx: cxs,
            cy: cys,
            opacity: [0, 1, 1, 1, 1, 1, 1, 0],
          }}
          transition={{
            duration: 0.95 / speed,
            delay: (k * 0.22) / speed,
            repeat: Infinity,
            repeatDelay: 0.15 / speed,
            ease: 'easeInOut',
          }}
        />
      ))}
    </g>
  )
}

/* ─────────── Activation profile bar chart (RIGHT) ─────────── */
const FF_PANEL = {
  X: 970, Y: 230, W: 360, ROW_H: 32,
}

function FFFeatureActivationPanel({
  currentToken, phase, speed,
}: { currentToken: string; phase: number; speed: number }) {
  const { X, Y, W, ROW_H } = FF_PANEL
  const sorted = [...FF_PROFILE].sort((a, b) => b.activation - a.activation)
  const TOP_N = 12  // show top 12 to keep it readable
  const visible = sorted.slice(0, TOP_N)

  return (
    <g>
      {/* Header */}
      <text x={X} y={Y - 32} fontSize="10" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        ACTIVATION TEST · DIM #147 ▸
      </text>
      <text x={X} y={Y - 14} fontSize="12" fontFamily="var(--font-mono)"
        fill={COL_FF_NEURON} fontStyle="italic">
        illustrative feature: code-like tokens
      </text>

      {visible.map((p, i) => {
        const yRow = Y + i * ROW_H
        const isCurrent = p.token === currentToken
        const isHigh = p.activation > 0.5
        const labelW = 90
        const trackX = X + labelW
        const trackW = W - labelW - 50
        const barW = trackW * p.activation

        return (
          <g key={`bar-${p.token}`}>
            {/* Token name */}
            <text x={X + labelW - 8} y={yRow + 18}
              textAnchor="end" fontSize="13"
              fontFamily="var(--font-mono)" fontStyle="italic"
              fill={isCurrent ? COL_FF_NEURON : 'rgba(255,255,255,0.7)'}>
              {p.token}
            </text>
            {/* Track */}
            <rect x={trackX} y={yRow + 6} width={trackW} height={20} rx={2}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
            {/* Bar */}
            <motion.rect
              x={trackX} y={yRow + 6}
              width={barW} height={20} rx={2}
              fill={isHigh ? COL_FF_NEURON : 'rgba(255,255,255,0.32)'}
              initial={{ opacity: 0.6 }}
              animate={
                isCurrent
                  ? { opacity: [0.6, 1, 0.6] }
                  : { opacity: 0.55 }
              }
              transition={
                isCurrent
                  ? { duration: 0.55 / speed, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 / speed }
              }
            />
            {/* Numeric value */}
            <text x={trackX + barW + 8} y={yRow + 20}
              fontSize="10" fontFamily="var(--font-mono)"
              fill={isCurrent ? COL_FF_NEURON : ACCENT.dim}>
              {p.activation.toFixed(2)}
            </text>
            {/* Current row halo */}
            {isCurrent && (
              <motion.rect
                x={X - 4} y={yRow + 2}
                width={W + 8} height={ROW_H - 4} rx={3}
                fill="none" stroke={COL_FF_NEURON}
                strokeWidth={1.2}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.85, 0.3] }}
                transition={{ duration: 0.6 / speed, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </g>
        )
      })}

      {/* Phase 3 highlight ring */}
      {phase === 2 && (
        <motion.rect
          x={X - 12} y={Y - 44}
          width={W + 24} height={visible.length * ROW_H + 56}
          rx={6}
          fill="none" stroke={COL_FF_NEURON} strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </g>
  )
}

/* ─────────── Mechanism strip — dot product with learned template ───────────
 * Shows the actual computation that makes dim #147 fire (or not):
 *   x · W₁[147]  →  Σ  →  GELU  →  activation
 * Two stacked 16-cell bars (input x and weights W) make the alignment
 * pattern visible — when many cells share sign/magnitude, the product
 * is large and the neuron fires. */
function FFFeatureMechanism({
  currentToken, currentActivation, isFiring, speed,
}: {
  currentToken: string
  currentActivation: number
  isFiring: boolean
  speed: number
}) {
  const seed = ffSeedForToken(currentToken)
  const x = ffComputeXForToken(currentActivation, seed)
  const xW = x.map((v, i) => v * FF_W147[i])
  const sum = xW.reduce((s, v) => s + v, 0)
  const geluOut = gelu(sum)

  // Layout
  const PANEL_X = 80, PANEL_Y = 638, PANEL_W = 1240, PANEL_H = 184
  const CELL_W = 16, CELL_H = 22
  const ROW_X_BAR = 248
  const ROW_W_BAR = 248 // same start, see below
  const Y_X_BAR = 700
  const Y_W_BAR = 730
  const Y_LABEL_X = 715
  const Y_LABEL_W = 745

  return (
    <g>
      {/* Background panel */}
      <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={10}
        fill="rgba(245,158,11,0.025)"
        stroke="rgba(245,158,11,0.18)" strokeWidth={1} />

      {/* Header */}
      <text x={700} y={PANEL_Y + 24} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        WHY DIM #147 FIRES — DOT PRODUCT WITH ITS LEARNED TEMPLATE
      </text>

      {/* x bar (input — current token's hidden representation) */}
      <text x={ROW_X_BAR - 14} y={Y_LABEL_X} textAnchor="end"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={ACCENT.cyan}>
        x ("{currentToken}")
      </text>
      {x.map((v, i) => (
        <motion.rect
          key={`mech-x-${currentToken}-${i}`}
          x={ROW_X_BAR + i * CELL_W} y={Y_X_BAR}
          width={CELL_W - 1} height={CELL_H - 1} rx={2}
          fill={ffColorRes(v)}
          stroke="rgba(255,255,255,0.10)" strokeWidth={0.5}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 / speed, delay: (i * 0.012) / speed }}
        />
      ))}

      {/* W bar (the LEARNED weight template — fixed for this neuron) */}
      <text x={ROW_W_BAR - 14} y={Y_LABEL_W} textAnchor="end"
        fontSize="13" fontFamily="var(--font-display)" fontStyle="italic"
        fill={COL_FF_NEURON}>
        W₁[147]
      </text>
      {FF_W147.map((w, i) => (
        <rect
          key={`mech-w-${i}`}
          x={ROW_W_BAR + i * CELL_W} y={Y_W_BAR}
          width={CELL_W - 1} height={CELL_H - 1} rx={2}
          fill={ffColorWeight(w)}
          stroke="rgba(255,255,255,0.10)" strokeWidth={0.5}
        />
      ))}

      {/* Alignment cues — small triangles where x and W have same sign */}
      {x.map((v, i) => {
        const aligned = (v > 0 && FF_W147[i] > 0) || (v < 0 && FF_W147[i] < 0)
        const strong = Math.abs(xW[i]) > 0.4
        if (!aligned || !strong) return null
        const cx = ROW_X_BAR + i * CELL_W + CELL_W / 2
        return (
          <motion.path
            key={`align-${currentToken}-${i}`}
            d={`M ${cx - 3} ${Y_W_BAR + CELL_H + 4}
                L ${cx + 3} ${Y_W_BAR + CELL_H + 4}
                L ${cx} ${Y_W_BAR + CELL_H + 9} Z`}
            fill={COL_FF_NEURON}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: [0.5, 1, 0.7] }}
            transition={{
              duration: 0.5 / speed,
              delay: (0.1 + i * 0.012) / speed,
            }}
          />
        )
      })}

      {/* "→" between bars and result */}
      <text x={ROW_X_BAR + 16 * CELL_W + 24} y={729}
        fontSize="22" fontFamily="var(--font-display)" fill={ACCENT.dim}>
        →
      </text>

      {/* Σ scalar */}
      <text x={ROW_X_BAR + 16 * CELL_W + 60} y={715}
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}
        letterSpacing="0.18em">
        x · W = Σ
      </text>
      <motion.text
        key={`sum-${currentToken}`}
        x={ROW_X_BAR + 16 * CELL_W + 60} y={742}
        fontSize="22" fontFamily="var(--font-display)" fontStyle="italic"
        fill={isFiring ? COL_FF_NEURON : 'rgba(255,255,255,0.65)'}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 / speed }}
      >
        {sum.toFixed(2)}
      </motion.text>

      {/* "→" */}
      <text x={ROW_X_BAR + 16 * CELL_W + 150} y={729}
        fontSize="22" fontFamily="var(--font-display)" fill={ACCENT.dim}>
        →
      </text>

      {/* GELU output */}
      <text x={ROW_X_BAR + 16 * CELL_W + 186} y={715}
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}
        letterSpacing="0.18em">
        GELU(Σ) = h₁₄₇
      </text>
      <motion.text
        key={`gelu-${currentToken}`}
        x={ROW_X_BAR + 16 * CELL_W + 186} y={742}
        fontSize="26" fontFamily="var(--font-display)" fontStyle="italic"
        fill={isFiring ? COL_FF_NEURON : 'rgba(255,255,255,0.55)'}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: 1,
          scale: isFiring ? [0.6, 1.2, 1] : [0.6, 1, 1],
        }}
        transition={{ duration: 0.45 / speed }}
      >
        {geluOut.toFixed(2)}
      </motion.text>

      {/* Match indicator */}
      <motion.g
        key={`match-${currentToken}`}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 / speed, delay: 0.15 / speed }}
      >
        <text x={ROW_X_BAR + 16 * CELL_W + 310} y={736}
          fontSize="14" fontFamily="var(--font-mono)" fontStyle="italic"
          fill={isFiring ? COL_FF_NEURON : ACCENT.dim}>
          {isFiring ? '★ fires' : '○ quiet'}
        </text>
      </motion.g>

      {/* Caption */}
      <text x={700} y={PANEL_Y + PANEL_H - 18}
        textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}
        fontStyle="italic">
        x = the token's hidden state · W₁[147] = dim #147's learned template · they align ⇒ Σ large ⇒ GELU keeps it ⇒ neuron fires
      </text>
    </g>
  )
}

/* ─────────── Honesty note (bottom centered) ─────────── */
function FFFeatureHonestyNote() {
  return (
    <g>
      <rect x={250} y={870} width={900} height={40} rx={20}
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      <text x={700} y={895} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)"
        fill="rgba(255,255,255,0.65)" fontStyle="italic">
        ⓘ  Real learned features are often distributed, polysemantic, and messy. This is a simplified illustrative view.
      </text>
    </g>
  )
}

/* ─────────── Phase summary footer ─────────── */
function FFFeaturePhaseSummary({ phase }: { phase: number }) {
  const beats = ['isolate the neuron', 'tokens stream by', 'activation profile']
  return (
    <g transform="translate(700, 950)">
      {beats.map((b, i) => {
        const w = 280
        const x = (i - beats.length / 2) * w + w / 2
        const active = i === phase
        const done = i < phase
        return (
          <g key={`ffsum-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 14} y={-14} width={w - 28} height={28} rx={14}
              fill={active ? 'rgba(245,158,11,0.18)' : 'transparent'}
              stroke={active ? COL_FF_NEURON : ACCENT.rule}
              strokeWidth={active ? 1.5 : 1} />
            <text x={0} y={4} textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)"
              fill={active ? COL_FF_NEURON : done ? 'rgba(255,255,255,0.5)' : ACCENT.dim}
              letterSpacing="0.16em">
              {(i + 1)}.{b.toUpperCase()}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── FFN-feature split-pane wrapper ─────────── */
export function FFNFeatureSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const phaseLabels = [
    'isolate one neuron',
    'tokens stream past',
    'activation profile',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      7000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      Pick one cell from the 1536-d FFN hidden layer. Treat it as an{' '}
      <em>illustrative</em> feature detector and ask what makes it light up.
    </>,
    <>
      Tokens stream past the neuron one at a time. The hero pulses bright
      when the input matches its (illustrative) feature, dim when it doesn't.
    </>,
    <>
      Across many test tokens, here's the response profile: high bars for
      matches, low bars otherwise. This is what selective firing looks like.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'one hidden dimension',
      body: <>h<sub>i</sub> = GELU((W₁ x)<sub>i</sub>),&nbsp; i = 147</>,
    },
    {
      label: 'selective activation',
      body: <>h₁₄₇ ≫ 0 when x matches feature,&nbsp; ≈ 0 otherwise</>,
    },
    {
      label: 'response profile',
      body: <>{'high-activation tokens  ≠  low-activation tokens'}</>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'Each of the 1536 hidden dimensions can specialize during training. We pick one — call it #147 — and ask what it lights up on.',
    'Real models don\'t come with feature labels. Researchers probe a neuron by feeding it many inputs and recording when it activates strongly.',
    'In real models the profile is messier: features are often distributed across many neurons, polysemantic, and context-dependent. The clean labels here are illustrative.',
  ]

  return (
    <SplitPaneScene
      viz={<VizFFNFeature />}
      text={{
        kicker: ACT2_KICKER,
        title: 'Each hidden neuron detects something.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.amber,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.amber}
          />
        ),
        stats: [
          { label: 'd_hidden', value: '1536', color: COL_FF_NEURON },
          { label: 'showing', value: 'dim #147' },
          { label: 'feature', value: 'illustrative' },
          { label: 'GPT-2 XL FFN', value: '~25M params' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 15 — gelu: "The gate that decides how strongly each feature fires."
 *
 * Continuation of the FFN story:
 *   Scene 13 — FFN structure (expand · fire · compress)
 *   Scene 14 — hidden neurons act like feature detectors
 *   Scene 15 — THIS: the activation function decides HOW each detector fires
 *
 * Three-zone layout:
 *   LEFT   — Pipeline view. W₁x raw bar → activation → activated bar.
 *            One neuron zoomed in with a sweeping probe value showing the
 *            three function outputs side-by-side.
 *   RIGHT  — Curves comparison. ReLU · GELU · Swish on one clean axis,
 *            with the probe dot tracking all three simultaneously.
 *   BOTTOM — Nonlinearity insight (W₂(W₁x) = (W₂W₁)x without activation)
 *            and a bridge to modern gated FFNs (SwiGLU).
 * ====================================================================== */

const COL_RELU = ACCENT.blue
const COL_GELU = ACCENT.mint
const COL_SWISH = ACCENT.amber

function relu(z: number): number { return Math.max(0, z) }
function swish(z: number): number { return z / (1 + Math.exp(-z)) }
// gelu() is already defined above (in the FFN scene)

/* Color helper for activated cells: amber for positive (kept), red-tint
 * for cells that GELU softly attenuates from negative input. */
function ffgColorActivated(out: number): string {
  if (out >= 0) return `rgba(245,158,11,${0.15 + Math.min(1, out / 1.6) * 0.78})`
  return `rgba(248,113,113,${0.15 + Math.min(1, -out / 0.5) * 0.45})`
}

/* Color helper for raw pre-activation values (cyan/red diverging) */
function ffgColorRaw(v: number): string {
  const m = Math.max(-2, Math.min(2, v)) / 2
  if (m >= 0) return `rgba(34,211,238,${0.18 + m * 0.65})`
  return `rgba(248,113,113,${0.18 + -m * 0.55})`
}

const FFG_W1X = Array.from({ length: 16 }).map(
  (_, i) => Math.sin(i * 1.27 + 0.7) * 1.6 + Math.cos(i * 0.42) * 0.55,
)

export function VizFFNGelu() {
  const speed = useSpeed()

  // 3 phases × ~6.3s
  const PHASES = 3
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      6300 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Probe sweeps continuously between -2.6 and +2.6
  const [probeTick, setProbeTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setProbeTick((t) => t + 1), 70 / speed)
    return () => clearInterval(id)
  }, [speed])
  const probeZ = Math.sin(probeTick * 0.045) * 2.6

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ffg-glow"><feGaussianBlur stdDeviation="2.5" /></filter>
          <filter id="ffg-bloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Top kicker */}
        <text x={20} y={36} fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.32em">
          BLOCK 0 · FFN · ACTIVATION GATE
        </text>

        {/* Big title */}
        <text x={700} y={88} textAnchor="middle"
          fontSize="22" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.95)">
          the gate that decides how strongly each hidden feature fires
        </text>
        <text x={700} y={114} textAnchor="middle"
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.08em">
          this is the "fire" step from Scene 13 — between W₁ and W₂
        </text>

        {/* LEFT — Pipeline view */}
        <FFGeluPipelineView phase={phase} probeZ={probeZ} speed={speed} />

        {/* RIGHT — Curves comparison */}
        <FFGeluCurvesPanel phase={phase} probeZ={probeZ} speed={speed} />

        {/* BOTTOM — Nonlinearity insight + SwiGLU bridge */}
        <FFGeluBottomPanel phase={phase} speed={speed} />

        {/* Phase summary */}
        <FFGeluPhaseSummary phase={phase} />
      </svg>
    </div>
  )
}

/* ─────────── LEFT: pipeline view (raw → activation → activated) ─────────── */
const FFG_LEFT = {
  X: 80, Y: 170, W: 600, H: 560,
  CELL_W: 24, CELL_H: 26,
  RAW_BAR_X: 156, RAW_BAR_Y: 250,
  ACT_BAR_Y: 380,
}

function FFGeluPipelineView({
  phase, probeZ, speed,
}: { phase: number; probeZ: number; speed: number }) {
  const { X, Y, W, H, CELL_W, CELL_H, RAW_BAR_X, RAW_BAR_Y, ACT_BAR_Y } = FFG_LEFT
  const activated = FFG_W1X.map(gelu)
  const probeOutputs = {
    relu: relu(probeZ),
    gelu: gelu(probeZ),
    swish: swish(probeZ),
  }

  return (
    <g>
      {/* Background panel */}
      <rect x={X} y={Y} width={W} height={H} rx={12}
        fill="rgba(245,158,11,0.025)"
        stroke={phase === 0 ? COL_GELU : 'rgba(245,158,11,0.18)'}
        strokeWidth={phase === 0 ? 1.8 : 1} />

      {/* Header */}
      <text x={X + 22} y={Y + 26}
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        INSIDE THE FFN · BEFORE → AFTER
      </text>
      <text x={X + 22} y={Y + 46}
        fontSize="13" fontFamily="var(--font-display)"
        fontStyle="italic" fill={COL_GELU}>
        the activation gate decides which hidden features survive
      </text>

      {/* W1x label and bar (raw, before activation) */}
      <text x={RAW_BAR_X - 14} y={RAW_BAR_Y + 18} textAnchor="end"
        fontSize="13" fontFamily="var(--font-display)"
        fontStyle="italic" fill={ACCENT.cyan}>
        W₁x
      </text>
      <text x={RAW_BAR_X - 14} y={RAW_BAR_Y + 36} textAnchor="end"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        raw scores
      </text>
      {FFG_W1X.map((v, i) => (
        <rect
          key={`raw-${i}`}
          x={RAW_BAR_X + i * CELL_W} y={RAW_BAR_Y}
          width={CELL_W - 2} height={CELL_H - 2} rx={2}
          fill={ffgColorRaw(v)}
          stroke="rgba(255,255,255,0.10)" strokeWidth={0.5}
        />
      ))}
      {/* tick marks under raw bar showing sign */}
      {FFG_W1X.map((v, i) => (
        <text
          key={`raw-sign-${i}`}
          x={RAW_BAR_X + i * CELL_W + (CELL_W - 2) / 2}
          y={RAW_BAR_Y + CELL_H + 12}
          textAnchor="middle"
          fontSize="9" fontFamily="var(--font-mono)"
          fill={v >= 0 ? ACCENT.cyan : ACCENT.red}
          opacity={0.6}>
          {v >= 0 ? '+' : '−'}
        </text>
      ))}

      {/* Big down arrow with activation label */}
      <g transform={`translate(${RAW_BAR_X + 8 * CELL_W}, ${(RAW_BAR_Y + ACT_BAR_Y) / 2 + 12})`}>
        <motion.path
          d="M -16 -16 L 0 8 L 16 -16"
          stroke={COL_GELU} strokeWidth={2.5} fill="none"
          strokeLinecap="round"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6 / speed, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text x={28} y={4}
          fontSize="13" fontFamily="var(--font-mono)"
          fill={COL_GELU} fontStyle="italic">
          GELU
        </text>
      </g>

      {/* GELU(W1x) label and bar (activated) */}
      <text x={RAW_BAR_X - 14} y={ACT_BAR_Y + 18} textAnchor="end"
        fontSize="13" fontFamily="var(--font-display)"
        fontStyle="italic" fill={COL_GELU}>
        GELU(W₁x)
      </text>
      <text x={RAW_BAR_X - 14} y={ACT_BAR_Y + 36} textAnchor="end"
        fontSize="9" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        fired
      </text>
      {activated.map((out, i) => {
        const isStrong = out > 0.4
        return (
          <motion.rect
            key={`act-${i}`}
            x={RAW_BAR_X + i * CELL_W} y={ACT_BAR_Y}
            width={CELL_W - 2} height={CELL_H - 2} rx={2}
            fill={ffgColorActivated(out)}
            stroke={isStrong ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.10)'}
            strokeWidth={isStrong ? 1 : 0.5}
            initial={{ opacity: 0.7, scale: 1 }}
            animate={
              isStrong
                ? { opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }
                : { opacity: 1, scale: 1 }
            }
            transition={
              isStrong
                ? { duration: 1.4 / speed, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.05) }
                : { duration: 0.3 / speed }
            }
          />
        )
      })}

      {/* Side-by-side note: where the change happened */}
      <text x={X + W / 2} y={ACT_BAR_Y + CELL_H + 28} textAnchor="middle"
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}
        fontStyle="italic">
        negatives are softly suppressed · positives largely survive
      </text>

      {/* Zoom-in: one neuron through three activations with the probe */}
      <FFGeluZoomNeuron probeZ={probeZ} speed={speed} />
    </g>
  )
}

/* Zoomed-in view of one neuron's value going through 3 activations.
 * Lives inside the LEFT panel. */
function FFGeluZoomNeuron({ probeZ, speed }: { probeZ: number; speed: number }) {
  const Z_X = 110, Z_Y = 510, Z_W = 540, Z_H = 200
  const inputBarH = 32

  const outRelu = relu(probeZ)
  const outGelu = gelu(probeZ)
  const outSwish = swish(probeZ)

  // Bar geometry — center at probeBarX, scale ±2.6 → ±BAR_HALF
  const probeBarX = Z_X + Z_W / 2
  const BAR_HALF = 110
  const probeOffset = (probeZ / 2.6) * BAR_HALF
  const outRange = (out: number) => Math.max(-1, Math.min(2.8, out))

  return (
    <g>
      {/* Sub-panel background */}
      <rect x={Z_X} y={Z_Y} width={Z_W} height={Z_H} rx={8}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.10)" strokeWidth={0.8} />

      <text x={Z_X + 16} y={Z_Y + 22}
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        ZOOM ▸ ONE NEURON, THREE GATES
      </text>

      {/* Input bar — probe value shown as a position on a horizontal scale */}
      <text x={Z_X + 16} y={Z_Y + 56}
        fontSize="11" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        raw score z =
      </text>
      <motion.text
        key={`probez-${probeZ.toFixed(2)}`}
        x={Z_X + 132} y={Z_Y + 56}
        fontSize="14" fontFamily="var(--font-display)" fontStyle="italic"
        fill={probeZ >= 0 ? ACCENT.cyan : ACCENT.red}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {probeZ.toFixed(2)}
      </motion.text>

      {/* Tiny number-line for probe */}
      <line x1={probeBarX - BAR_HALF} x2={probeBarX + BAR_HALF}
        y1={Z_Y + 80} y2={Z_Y + 80}
        stroke={ACCENT.rule} strokeWidth={1} />
      {[-2, -1, 0, 1, 2].map((tick) => (
        <g key={`tick-${tick}`}>
          <line
            x1={probeBarX + (tick / 2.6) * BAR_HALF}
            x2={probeBarX + (tick / 2.6) * BAR_HALF}
            y1={Z_Y + 76} y2={Z_Y + 84}
            stroke={ACCENT.rule} strokeWidth={1} />
          <text
            x={probeBarX + (tick / 2.6) * BAR_HALF}
            y={Z_Y + 96} textAnchor="middle"
            fontSize="8" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
            {tick}
          </text>
        </g>
      ))}
      {/* Probe dot on number-line */}
      <motion.circle
        cx={probeBarX + probeOffset} cy={Z_Y + 80}
        r={5}
        fill={probeZ >= 0 ? ACCENT.cyan : ACCENT.red}
        filter="url(#ffg-glow)"
        animate={{ cx: probeBarX + probeOffset }}
        transition={{ duration: 0.1 }}
      />

      {/* Three output rows — one per activation */}
      {([
        { name: 'ReLU', out: outRelu, color: COL_RELU },
        { name: 'GELU', out: outGelu, color: COL_GELU },
        { name: 'Swish', out: outSwish, color: COL_SWISH },
      ] as const).map((act, i) => {
        const rowY = Z_Y + 122 + i * 26
        const out = outRange(act.out)
        const barEnd = probeBarX + (out / 2.8) * BAR_HALF
        return (
          <g key={`act-${act.name}`}>
            <text x={Z_X + 16} y={rowY + 12}
              fontSize="12" fontFamily="var(--font-mono)" fill={act.color}>
              {act.name}(z)
            </text>
            {/* Track */}
            <line x1={probeBarX - BAR_HALF} x2={probeBarX + BAR_HALF}
              y1={rowY + 8} y2={rowY + 8}
              stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
            {/* Zero tick */}
            <line x1={probeBarX} x2={probeBarX}
              y1={rowY + 4} y2={rowY + 12}
              stroke="rgba(255,255,255,0.20)" strokeWidth={0.5} />
            {/* Output bar from 0 to value */}
            <motion.rect
              x={Math.min(probeBarX, barEnd)}
              y={rowY + 4}
              width={Math.abs(barEnd - probeBarX)}
              height={9}
              rx={1}
              fill={act.color}
              opacity={0.85}
              animate={{
                x: Math.min(probeBarX, barEnd),
                width: Math.abs(barEnd - probeBarX),
              }}
              transition={{ duration: 0.18 }}
            />
            <motion.text
              key={`out-${act.name}-${out.toFixed(2)}`}
              x={Z_X + Z_W - 16} y={rowY + 12} textAnchor="end"
              fontSize="11" fontFamily="var(--font-mono)" fill={act.color}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {act.out.toFixed(2)}
            </motion.text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── RIGHT: curves comparison ─────────── */
const FFG_RIGHT = {
  X: 720, Y: 170, W: 600, H: 560,
  GRAPH_X: 760, GRAPH_Y: 240, GRAPH_W: 520, GRAPH_H: 320,
  X_SCALE: 100,  // px per unit on X
  Y_SCALE: 80,   // px per unit on Y
}

function FFGeluCurvesPanel({
  phase, probeZ, speed,
}: { phase: number; probeZ: number; speed: number }) {
  const { X, Y, W, H, GRAPH_X, GRAPH_Y, GRAPH_W, GRAPH_H, X_SCALE, Y_SCALE } = FFG_RIGHT

  const cx = GRAPH_X + GRAPH_W / 2
  const cy = GRAPH_Y + GRAPH_H * 0.7  // axis baseline (allow more room above for positive y)

  // Curves
  const xs: number[] = []
  for (let z = -2.6; z <= 2.6; z += 0.06) xs.push(+z.toFixed(3))
  function buildPath(fn: (z: number) => number) {
    return xs.map((z, i) => {
      const px = cx + z * X_SCALE
      const py = cy - fn(z) * Y_SCALE
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`
    }).join(' ')
  }

  const probePx = cx + probeZ * X_SCALE

  return (
    <g>
      {/* Background */}
      <rect x={X} y={Y} width={W} height={H} rx={12}
        fill="rgba(245,158,11,0.025)"
        stroke={phase === 1 ? COL_GELU : 'rgba(245,158,11,0.18)'}
        strokeWidth={phase === 1 ? 1.8 : 1} />

      {/* Header */}
      <text x={X + 22} y={Y + 26}
        fontSize="11" fontFamily="var(--font-mono)"
        fill={ACCENT.dim} letterSpacing="0.22em">
        ACTIVATION FUNCTIONS · COMPARISON
      </text>
      <text x={X + 22} y={Y + 46}
        fontSize="13" fontFamily="var(--font-display)"
        fontStyle="italic" fill={COL_GELU}>
        same z, three different "fire strengths"
      </text>

      {/* Axes */}
      <line x1={cx - 2.6 * X_SCALE} x2={cx + 2.6 * X_SCALE}
        y1={cy} y2={cy}
        stroke={ACCENT.rule} strokeWidth={1} />
      <line x1={cx} x2={cx}
        y1={cy - 2.4 * Y_SCALE} y2={cy + 0.6 * Y_SCALE}
        stroke={ACCENT.rule} strokeWidth={1} />
      {[-2, -1, 1, 2].map((t) => (
        <g key={`gx-${t}`}>
          <line x1={cx + t * X_SCALE} x2={cx + t * X_SCALE}
            y1={cy - 3} y2={cy + 3}
            stroke={ACCENT.rule} strokeWidth={1} />
          <text x={cx + t * X_SCALE} y={cy + 16}
            textAnchor="middle" fontSize="9"
            fontFamily="var(--font-mono)" fill={ACCENT.dim}>
            {t}
          </text>
        </g>
      ))}
      {[1, 2].map((t) => (
        <g key={`gy-${t}`}>
          <line x1={cx - 3} x2={cx + 3}
            y1={cy - t * Y_SCALE} y2={cy - t * Y_SCALE}
            stroke={ACCENT.rule} strokeWidth={1} />
          <text x={cx - 8} y={cy - t * Y_SCALE + 4}
            textAnchor="end" fontSize="9"
            fontFamily="var(--font-mono)" fill={ACCENT.dim}>
            {t}
          </text>
        </g>
      ))}
      <text x={cx + 2.7 * X_SCALE} y={cy + 4}
        fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
        z
      </text>

      {/* Negative-region callout box */}
      <rect x={cx - 1.5 * X_SCALE} y={cy - 0.4 * Y_SCALE}
        width={1.5 * X_SCALE} height={0.6 * Y_SCALE}
        fill="rgba(248,113,113,0.04)"
        stroke="rgba(248,113,113,0.25)"
        strokeWidth={0.8}
        strokeDasharray="3,3" />
      <text x={cx - 0.75 * X_SCALE} y={cy - 0.5 * Y_SCALE}
        textAnchor="middle" fontSize="9"
        fontFamily="var(--font-mono)" fill={ACCENT.red}
        letterSpacing="0.16em">
        WHERE THEY DIFFER
      </text>

      {/* Curves */}
      <path d={buildPath(relu)} stroke={COL_RELU} strokeWidth={2.4} fill="none" />
      <path d={buildPath(gelu)} stroke={COL_GELU} strokeWidth={2.6} fill="none" />
      <path d={buildPath(swish)} stroke={COL_SWISH} strokeWidth={2.2} fill="none" strokeDasharray="4 4" />

      {/* Vertical probe line */}
      <line x1={probePx} x2={probePx}
        y1={GRAPH_Y + 12} y2={cy + 4}
        stroke="rgba(255,255,255,0.30)"
        strokeWidth={0.8} strokeDasharray="2,2" />

      {/* Probe dots on each curve */}
      <motion.circle cx={probePx} cy={cy - relu(probeZ) * Y_SCALE} r={5}
        fill={COL_RELU} filter="url(#ffg-glow)"
        animate={{ cx: probePx, cy: cy - relu(probeZ) * Y_SCALE }}
        transition={{ duration: 0.1 }} />
      <motion.circle cx={probePx} cy={cy - gelu(probeZ) * Y_SCALE} r={5}
        fill={COL_GELU} filter="url(#ffg-glow)"
        animate={{ cx: probePx, cy: cy - gelu(probeZ) * Y_SCALE }}
        transition={{ duration: 0.1 }} />
      <motion.circle cx={probePx} cy={cy - swish(probeZ) * Y_SCALE} r={5}
        fill={COL_SWISH} filter="url(#ffg-glow)"
        animate={{ cx: probePx, cy: cy - swish(probeZ) * Y_SCALE }}
        transition={{ duration: 0.1 }} />

      {/* Legend with descriptions */}
      <g transform={`translate(${X + 22}, ${Y + H - 158})`}>
        {([
          { name: 'ReLU', formula: 'max(0, z)', desc: 'hard zero below 0', color: COL_RELU, dashed: false },
          { name: 'GELU', formula: 'z · Φ(z)', desc: 'smooth gate, small negatives survive', color: COL_GELU, dashed: false },
          { name: 'Swish', formula: 'z · σ(z)', desc: 'smooth self-gating, used in SwiGLU', color: COL_SWISH, dashed: true },
        ] as const).map((curve, i) => (
          <g key={`leg-${i}`} transform={`translate(0, ${i * 32})`}>
            <line x1={0} x2={32} y1={10} y2={10}
              stroke={curve.color} strokeWidth={2.6}
              strokeDasharray={curve.dashed ? '4 4' : ''} />
            <text x={42} y={14}
              fontSize="13" fontFamily="var(--font-mono)" fill={curve.color}>
              {curve.name}(z) = {curve.formula}
            </text>
            <text x={42} y={28}
              fontSize="10" fontFamily="var(--font-mono)" fill={ACCENT.dim}>
              {curve.desc}
            </text>
          </g>
        ))}
      </g>
    </g>
  )
}

/* ─────────── BOTTOM: nonlinearity insight + SwiGLU bridge ─────────── */
function FFGeluBottomPanel({
  phase, speed,
}: { phase: number; speed: number }) {
  const X = 80, Y = 750, W = 1240, H = 130
  const half = W / 2

  return (
    <g>
      <rect x={X} y={Y} width={W} height={H} rx={10}
        fill="rgba(167,139,250,0.025)"
        stroke={phase === 2 ? COL_GELU : 'rgba(167,139,250,0.20)'}
        strokeWidth={phase === 2 ? 1.8 : 1} />

      {/* LEFT half: nonlinearity insight */}
      <g transform={`translate(${X + 20}, ${Y})`}>
        <text x={0} y={26}
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.22em">
          WHY THE GATE EXISTS
        </text>
        <text x={0} y={56}
          fontSize="14" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.92)">
          Without an activation, two linear layers collapse to one.
        </text>
        <text x={0} y={84}
          fontSize="13" fontFamily="var(--font-mono)" fill={ACCENT.amber}>
          W₂ · (W₁ x)  =  (W₂ W₁) · x
        </text>
        <text x={0} y={108}
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} fontStyle="italic">
          the activation makes the FFN <tspan fill={COL_GELU}>nonlinear</tspan> — that's what gives it expressive power.
        </text>
      </g>

      {/* Divider */}
      <line x1={X + half} x2={X + half}
        y1={Y + 20} y2={Y + H - 20}
        stroke={ACCENT.rule} strokeWidth={1} />

      {/* RIGHT half: modern bridge */}
      <g transform={`translate(${X + half + 20}, ${Y})`}>
        <text x={0} y={26}
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} letterSpacing="0.22em">
          MODERN UPGRADE ▸ SwiGLU
        </text>
        <text x={0} y={56}
          fontSize="14" fontFamily="var(--font-display)"
          fontStyle="italic" fill="rgba(255,255,255,0.92)">
          Many modern LLMs replace the simple activation with a gated FFN.
        </text>
        <text x={0} y={84}
          fontSize="13" fontFamily="var(--font-mono)" fill={COL_SWISH}>
          SwiGLU(x) = (W₁ x ⊙ Swish(V x)) · W₂
        </text>
        <text x={0} y={108}
          fontSize="11" fontFamily="var(--font-mono)"
          fill={ACCENT.dim} fontStyle="italic">
          two parallel projections, multiplied through Swish — slightly better loss per parameter (LLaMA, PaLM).
        </text>
      </g>
    </g>
  )
}

/* ─────────── Phase summary footer ─────────── */
function FFGeluPhaseSummary({ phase }: { phase: number }) {
  const beats = ['raw → activated', 'compare the gates', 'why nonlinearity']
  return (
    <g transform="translate(700, 950)">
      {beats.map((b, i) => {
        const w = 280
        const x = (i - beats.length / 2) * w + w / 2
        const active = i === phase
        const done = i < phase
        return (
          <g key={`ffg-sum-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-w / 2 + 14} y={-14} width={w - 28} height={28} rx={14}
              fill={active ? 'rgba(52,211,153,0.18)' : 'transparent'}
              stroke={active ? COL_GELU : ACCENT.rule}
              strokeWidth={active ? 1.5 : 1} />
            <text x={0} y={4} textAnchor="middle"
              fontSize="11" fontFamily="var(--font-mono)"
              fill={active ? COL_GELU : done ? 'rgba(255,255,255,0.5)' : ACCENT.dim}
              letterSpacing="0.16em">
              {(i + 1)}.{b.toUpperCase()}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ─────────── FFN-GELU split-pane wrapper ─────────── */
export function FFNGeluSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const phaseLabels = [
    'inside the FFN: raw → activated',
    'compare ReLU · GELU · Swish',
    'why we need nonlinearity',
  ]
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      6300 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      Each W₁ row produces a raw score per neuron. The activation is the{' '}
      <em>gate</em> that decides how strongly that hidden feature actually fires.
    </>,
    <>
      ReLU clips hard at zero. GELU and Swish gate smoothly — small negatives
      pass through softly, so gradients keep flowing.
    </>,
    <>
      Without the activation, W₂(W₁x) would just be (W₂W₁)x — one big linear
      map. The nonlinearity is what makes the FFN expressive.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'one neuron',
      body: <>h<sub>i</sub> = GELU((W₁ x)<sub>i</sub>)</>,
    },
    {
      label: 'three gates',
      body: (
        <>
          ReLU: max(0, z) · GELU: z · Φ(z) · Swish: z · σ(z)
        </>
      ),
    },
    {
      label: 'why nonlinear',
      body: <>W₂(W₁ x) ≠ (W₂ W₁) x &nbsp;⇐&nbsp; activation</>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'After W₁ expands x into 1536 hidden coordinates, each one is a candidate feature score. The activation function decides — per coordinate — how strongly that feature ends up firing.',
    'ReLU was the early default (simple, fast). Transformer-era models moved to GELU (BERT, GPT-2). Modern LLMs (LLaMA, PaLM) push further with gated variants like SwiGLU.',
    'Stack two linear maps with no nonlinearity in between and you can collapse them into one matrix — no extra power. The activation is the only thing that makes deep nets actually deep.',
  ]

  return (
    <SplitPaneScene
      viz={<VizFFNGelu />}
      text={{
        kicker: ACT2_KICKER,
        title: 'How each feature decides to fire.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.amber,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.amber}
          />
        ),
        stats: [
          { label: 'classic', value: 'ReLU', color: COL_RELU },
          { label: 'transformer-era', value: 'GELU', color: COL_GELU },
          { label: 'modern LLMs', value: 'SwiGLU', color: COL_SWISH },
          { label: 'role', value: 'nonlinearity' },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}
