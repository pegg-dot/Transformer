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
