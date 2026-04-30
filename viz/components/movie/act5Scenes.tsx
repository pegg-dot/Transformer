'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
import { usePrompt } from './promptContext'
import { SplitPaneScene, PhaseChip } from './splitPane'

const ACCENT = {
  mint: '#34d399',
  violet: '#a78bfa',
  blue: '#60a5fa',
  amber: '#f59e0b',
  pink: '#ec4899',
  cyan: '#22d3ee',
  red: '#f87171',
  dim: 'rgba(255,255,255,0.55)',
  rule: 'rgba(255,255,255,0.10)',
}

const ACT5_KICKER = 'ACT V · MODERN UPGRADES'

/* =========================================================================
 * Scene 30 — act5-intro: "Same skeleton. Smarter parts."
 *
 * Orientation/map scene for Act V. Shows the familiar transformer block as
 * a glassy cutaway with the residual stream, two norm plates, attention,
 * and FFN clearly labeled. Four "upgrade" badges fan out around the block,
 * each connected by a thin line to the part it modifies:
 *
 *   RoPE     → Q/K inside attention
 *   RMSNorm  → both norm plates
 *   SwiGLU   → FFN
 *   GQA      → attention heads / KV groups
 *
 * No deep teaching. This is a roadmap: same block, smarter internals.
 * ====================================================================== */

const VB_W = 1400
const VB_H = 1000

// Block (glassy cutaway) geometry — block is the dominant object on screen.
// ~46% of the pane width and ~74% of the height, centered horizontally.
const BLK_W = 640
const BLK_H = 740
const BLK_X = (VB_W - BLK_W) / 2 // 380
const BLK_Y = 140
const BLK_R = 30

// Residual stream — vertical line on the left side of the block.
const RES_X = BLK_X + 70
const RES_TOP = BLK_Y + 50
const RES_BOT = BLK_Y + BLK_H - 50

// Skeleton component slots inside the block (top → bottom).
const SLOT_X = RES_X + 36
const SLOT_W = BLK_W - 110

const NORM1_Y = BLK_Y + 90
const ATT_Y = BLK_Y + 170
const ATT_H = 170
const ADD1_Y = ATT_Y + ATT_H + 40
const NORM2_Y = ADD1_Y + 50
const FFN_Y = NORM2_Y + 60
const FFN_H = 170
const ADD2_Y = FFN_Y + FFN_H + 40

const PLATE_H = 38

// Helper — short fade-in motion factory.
function fadeIn(delay: number, dur = 0.55) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: dur, ease: 'easeOut' },
  } as const
}

// Helper — line draw-in motion (uses pathLength).
function drawIn(delay: number, dur = 0.7) {
  return {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { delay, duration: dur, ease: 'easeOut' },
  } as const
}

/* ─────────── Upgrade callout ─────────── */
function Callout({
  x,
  y,
  w,
  h,
  accent,
  label,
  sub,
  delay,
  icon,
}: {
  x: number
  y: number
  w: number
  h: number
  accent: string
  label: string
  sub: string
  delay: number
  icon: React.ReactNode
}) {
  return (
    <motion.g {...fadeIn(delay, 0.6)}>
      {/* glass background */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        ry={14}
        fill="rgba(255,255,255,0.06)"
        stroke={accent}
        strokeOpacity={0.85}
        strokeWidth={1.6}
      />
      {/* icon zone */}
      <g transform={`translate(${x + 18}, ${y + h / 2})`}>{icon}</g>
      {/* label */}
      <text
        x={x + 70}
        y={y + 32}
        fill={accent}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={20}
        fontWeight={600}
        letterSpacing={1.2}
      >
        {label}
      </text>
      <text
        x={x + 70}
        y={y + 56}
        fill="rgba(255,255,255,0.65)"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={13}
        letterSpacing={0.2}
      >
        {sub}
      </text>
    </motion.g>
  )
}

/* ─────────── Icons ─────────── */
function IconRoPE({ accent }: { accent: string }) {
  // Two concentric arcs with a rotating tick — "rotate Q/K".
  return (
    <g>
      <circle r={22} fill="none" stroke={accent} strokeOpacity={0.4} strokeWidth={1.2} />
      <circle r={14} fill="none" stroke={accent} strokeOpacity={0.7} strokeWidth={1.2} />
      <motion.line
        x1={0}
        y1={0}
        x2={14}
        y2={0}
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'linear' }}
      />
      <circle r={2.2} fill={accent} />
    </g>
  )
}

function IconRMS({ accent }: { accent: string }) {
  // A vector being rescaled — short bar, then a longer bar of identical direction.
  return (
    <g>
      <line x1={-18} y1={6} x2={-2} y2={-8} stroke={accent} strokeOpacity={0.45} strokeWidth={2.2} strokeLinecap="round" />
      <line x1={-18} y1={6} x2={14} y2={-22} stroke={accent} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={14} cy={-22} r={3} fill={accent} />
      <circle cx={-18} cy={6} r={2} fill={accent} fillOpacity={0.7} />
    </g>
  )
}

function IconSwiGLU({ accent }: { accent: string }) {
  // Two waves entering a multiply gate (⊙).
  return (
    <g>
      <path
        d="M -22 -10 q 6 -10 12 0 t 12 0"
        fill="none"
        stroke={accent}
        strokeOpacity={0.7}
        strokeWidth={1.6}
      />
      <path
        d="M -22 10 q 6 -10 12 0 t 12 0"
        fill="none"
        stroke={accent}
        strokeOpacity={0.45}
        strokeWidth={1.6}
      />
      <circle cx={14} cy={0} r={9} fill="none" stroke={accent} strokeWidth={1.4} />
      <line x1={9} y1={-5} x2={19} y2={5} stroke={accent} strokeWidth={1.4} />
      <line x1={9} y1={5} x2={19} y2={-5} stroke={accent} strokeWidth={1.4} />
    </g>
  )
}

function IconGQA({ accent }: { accent: string }) {
  // 6 small Q dots feeding 2 K/V group rectangles.
  return (
    <g>
      {Array.from({ length: 6 }).map((_, i) => (
        <circle
          key={i}
          cx={-22 + i * 4}
          cy={-12}
          r={2.2}
          fill={accent}
          fillOpacity={0.85}
        />
      ))}
      <rect x={-22} y={4} width={16} height={12} rx={2} ry={2} fill="none" stroke={accent} strokeWidth={1.4} />
      <rect x={-2} y={4} width={16} height={12} rx={2} ry={2} fill="none" stroke={accent} strokeWidth={1.4} />
      {/* connector lines (Q → group) */}
      {[0, 1, 2].map((i) => (
        <line
          key={`l${i}`}
          x1={-22 + i * 4}
          y1={-9}
          x2={-14}
          y2={4}
          stroke={accent}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      {[3, 4, 5].map((i) => (
        <line
          key={`r${i}`}
          x1={-22 + i * 4}
          y1={-9}
          x2={6}
          y2={4}
          stroke={accent}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
    </g>
  )
}

/* ─────────── Skeleton plate ─────────── */
function Plate({
  y,
  label,
  delay,
  emphasis,
}: {
  y: number
  label: string
  delay: number
  emphasis?: string
}) {
  const stroke = emphasis ?? 'rgba(255,255,255,0.55)'
  return (
    <motion.g {...fadeIn(delay)}>
      <rect
        x={SLOT_X}
        y={y}
        width={SLOT_W}
        height={PLATE_H}
        rx={8}
        ry={8}
        fill="rgba(255,255,255,0.06)"
        stroke={stroke}
        strokeWidth={1.4}
      />
      <text
        x={SLOT_X + SLOT_W / 2}
        y={y + PLATE_H / 2 + 5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.95)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        letterSpacing={1.6}
        fontWeight={500}
      >
        {label}
      </text>
    </motion.g>
  )
}

/* ─────────── Bigger box (attention / FFN) ─────────── */
function Module({
  y,
  height,
  title,
  inner,
  delay,
  accent,
}: {
  y: number
  height: number
  title: string
  inner: React.ReactNode
  delay: number
  accent: string
}) {
  return (
    <motion.g {...fadeIn(delay)}>
      <rect
        x={SLOT_X}
        y={y}
        width={SLOT_W}
        height={height}
        rx={12}
        ry={12}
        fill="rgba(255,255,255,0.05)"
        stroke={accent}
        strokeOpacity={0.85}
        strokeWidth={1.6}
      />
      <text
        x={SLOT_X + 18}
        y={y + 26}
        fill={accent}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={2}
        fontWeight={600}
      >
        {title}
      </text>
      {inner}
    </motion.g>
  )
}

/* ─────────── Residual add node (⊕) ─────────── */
function AddNode({ y, delay }: { y: number; delay: number }) {
  return (
    <motion.g {...fadeIn(delay)}>
      <circle
        cx={RES_X}
        cy={y}
        r={11}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.3}
      />
      <line x1={RES_X - 5.5} y1={y} x2={RES_X + 5.5} y2={y} stroke="rgba(255,255,255,0.85)" strokeWidth={1.3} />
      <line x1={RES_X} y1={y - 5.5} x2={RES_X} y2={y + 5.5} stroke="rgba(255,255,255,0.85)" strokeWidth={1.3} />
    </motion.g>
  )
}

/* ─────────── Connector line from a callout edge to a target ─────────── */
function Connector({
  from,
  to,
  accent,
  delay,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  accent: string
  delay: number
}) {
  // Simple L-shaped path (horizontal then vertical) feels more "circuit map".
  const midX = (from.x + to.x) / 2
  const d = `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`
  return (
    <>
      <motion.path
        d={d}
        fill="none"
        stroke={accent}
        strokeOpacity={0.95}
        strokeWidth={1.6}
        strokeDasharray="4 4"
        {...drawIn(delay, 0.8)}
      />
      <motion.circle
        cx={to.x}
        cy={to.y}
        r={4.2}
        fill={accent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [1, 1.4, 1] }}
        transition={{ delay: delay + 0.7, duration: 0.6 }}
      />
    </>
  )
}

/* ─────────── The viz ─────────── */
export function VizAct5Intro() {
  // Stagger schedule (seconds, real time — speed handled by parent timing).
  const t = {
    block: 0.15,
    plate1: 0.55,
    att: 0.7,
    add1: 0.95,
    plate2: 1.05,
    ffn: 1.2,
    add2: 1.45,
    res: 1.6,
    rope: 2.1,
    rms: 2.45,
    swi: 2.8,
    gqa: 3.15,
  }

  // Callout box geometry.
  const calloutW = 280
  const calloutH = 80

  // Left side callouts (gap is x=0..BLK_X, 380px wide)
  const RMS_X = 40
  const RMS_Y = NORM1_Y - 22
  const GQA_X = 40
  const GQA_Y = ATT_Y + ATT_H - calloutH + 50

  // Right side callouts (gap is x=BLK_X+BLK_W..VB_W, 380px wide)
  const ROPE_X = VB_W - calloutW - 40
  const ROPE_Y = ATT_Y + 6
  const SWI_X = VB_W - calloutW - 40
  const SWI_Y = FFN_Y + 50

  // Connector targets (where the line lands inside the block).
  const ropeTarget = { x: SLOT_X + SLOT_W - 8, y: ATT_Y + 90 }
  const rmsTarget1 = { x: SLOT_X + 8, y: NORM1_Y + PLATE_H / 2 }
  const swiTarget = { x: SLOT_X + SLOT_W - 8, y: FFN_Y + 90 }
  const gqaTarget = { x: SLOT_X + 8, y: ATT_Y + ATT_H - 40 }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="blockGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(52,211,153,0.12)" />
          <stop offset="100%" stopColor="rgba(52,211,153,0.04)" />
        </linearGradient>
        <radialGradient id="blockGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(52,211,153,0.18)" />
          <stop offset="100%" stopColor="rgba(52,211,153,0)" />
        </radialGradient>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft glow halo behind the block — sells "it is the body, the
          callouts are the upgrades". */}
      <motion.ellipse
        cx={BLK_X + BLK_W / 2}
        cy={BLK_Y + BLK_H / 2}
        rx={BLK_W / 2 + 80}
        ry={BLK_H / 2 + 40}
        fill="url(#blockGlow)"
        {...fadeIn(0.05, 1.2)}
      />

      {/* Title strip */}
      <motion.text
        x={VB_W / 2}
        y={56}
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={16}
        letterSpacing={3.4}
        {...fadeIn(0)}
      >
        TRANSFORMER BLOCK · CUTAWAY
      </motion.text>

      {/* Glassy block cutaway */}
      <motion.rect
        x={BLK_X}
        y={BLK_Y}
        width={BLK_W}
        height={BLK_H}
        rx={BLK_R}
        ry={BLK_R}
        fill="url(#blockGlass)"
        stroke={ACCENT.mint}
        strokeOpacity={0.85}
        strokeWidth={1.9}
        {...fadeIn(t.block, 0.7)}
      />
      {/* Block label — top-left corner badge */}
      <motion.text
        x={BLK_X + 18}
        y={BLK_Y + 26}
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2.4}
        opacity={0.85}
        {...fadeIn(t.block + 0.2)}
      >
        TRANSFORMER BLOCK
      </motion.text>

      {/* Residual stream — vertical line with arrows on both ends */}
      <motion.line
        x1={RES_X}
        y1={RES_TOP}
        x2={RES_X}
        y2={RES_BOT}
        stroke={ACCENT.mint}
        strokeOpacity={0.7}
        strokeWidth={2}
        strokeDasharray="2 6"
        {...drawIn(t.res, 1.0)}
      />
      {/* Flowing-data overlay — subtle drifting dashes that read as
          "the residual is carrying signal forward" once the line has
          drawn in. */}
      <motion.line
        x1={RES_X}
        y1={RES_TOP}
        x2={RES_X}
        y2={RES_BOT}
        stroke={ACCENT.mint}
        strokeOpacity={0.55}
        strokeWidth={2}
        strokeDasharray="4 10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6, strokeDashoffset: [0, -28] }}
        transition={{
          opacity: { duration: 0.5, delay: t.res + 1.0 },
          strokeDashoffset: {
            duration: 1.6,
            repeat: Infinity,
            ease: 'linear',
            delay: t.res + 1.0,
          },
        }}
      />
      <motion.text
        x={RES_X - 14}
        y={RES_TOP - 6}
        textAnchor="end"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.6}
        opacity={0.85}
        {...fadeIn(t.res + 0.2)}
      >
        RESIDUAL
      </motion.text>

      {/* Skeleton: norm → attention → add → norm → ffn → add */}
      <Plate y={NORM1_Y} label="NORM" delay={t.plate1} />
      <Module
        y={ATT_Y}
        height={ATT_H}
        title="ATTENTION"
        accent={ACCENT.violet}
        delay={t.att}
        inner={
          (() => {
            const boxW = 78
            const gap = 22
            const triCount = 3
            const triW = triCount * boxW + (triCount - 1) * gap
            const offset = (SLOT_W - triW) / 2
            return (
              <g>
                {/* Q · K · V triplet, centered in the wider slot */}
                {['Q', 'K', 'V'].map((lbl, i) => {
                  const bx = SLOT_X + offset + i * (boxW + gap)
                  return (
                    <g key={lbl}>
                      <rect
                        x={bx}
                        y={ATT_Y + 70}
                        width={boxW}
                        height={62}
                        rx={6}
                        ry={6}
                        fill="rgba(167,139,250,0.14)"
                        stroke="rgba(167,139,250,0.85)"
                        strokeWidth={1.3}
                      />
                      <text
                        x={bx + boxW / 2}
                        y={ATT_Y + 108}
                        textAnchor="middle"
                        fill={ACCENT.violet}
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                        fontSize={22}
                        fontWeight={700}
                      >
                        {lbl}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })()
        }
      />
      <AddNode y={ADD1_Y} delay={t.add1} />
      <Plate y={NORM2_Y} label="NORM" delay={t.plate2} />
      <Module
        y={FFN_Y}
        height={FFN_H}
        title="FFN"
        accent={ACCENT.amber}
        delay={t.ffn}
        inner={
          (() => {
            const boxW = 80
            const sigR = 22
            const gap = 28
            const totalW = boxW + gap + 2 * sigR + gap + boxW
            const offset = (SLOT_W - totalW) / 2
            const upX = SLOT_X + offset
            const sigCx = upX + boxW + gap + sigR
            const dnX = sigCx + sigR + gap
            const cy = FFN_Y + 105
            return (
              <g>
                {/* Up-projection → activation → down-projection */}
                <rect
                  x={upX}
                  y={FFN_Y + 70}
                  width={boxW}
                  height={62}
                  rx={6}
                  ry={6}
                  fill="rgba(245,158,11,0.14)"
                  stroke="rgba(245,158,11,0.85)"
                  strokeWidth={1.3}
                />
                <text
                  x={upX + boxW / 2}
                  y={cy + 4}
                  textAnchor="middle"
                  fill={ACCENT.amber}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize={15}
                  fontWeight={600}
                >
                  W↑
                </text>
                <circle
                  cx={sigCx}
                  cy={cy - 4}
                  r={sigR}
                  fill="rgba(245,158,11,0.14)"
                  stroke="rgba(245,158,11,0.85)"
                  strokeWidth={1.3}
                />
                <text
                  x={sigCx}
                  y={cy + 1}
                  textAnchor="middle"
                  fill={ACCENT.amber}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize={15}
                  fontWeight={600}
                >
                  σ
                </text>
                <rect
                  x={dnX}
                  y={FFN_Y + 70}
                  width={boxW}
                  height={62}
                  rx={6}
                  ry={6}
                  fill="rgba(245,158,11,0.14)"
                  stroke="rgba(245,158,11,0.85)"
                  strokeWidth={1.3}
                />
                <text
                  x={dnX + boxW / 2}
                  y={cy + 4}
                  textAnchor="middle"
                  fill={ACCENT.amber}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize={15}
                  fontWeight={600}
                >
                  W↓
                </text>
              </g>
            )
          })()
        }
      />
      <AddNode y={ADD2_Y} delay={t.add2} />

      {/* Connectors (drawn before callouts so callouts paint on top) */}
      <Connector
        from={{ x: ROPE_X, y: ROPE_Y + calloutH / 2 }}
        to={ropeTarget}
        accent={ACCENT.pink}
        delay={t.rope - 0.05}
      />
      <Connector
        from={{ x: RMS_X + calloutW, y: RMS_Y + calloutH / 2 }}
        to={rmsTarget1}
        accent={ACCENT.blue}
        delay={t.rms - 0.05}
      />
      <Connector
        from={{ x: SWI_X, y: SWI_Y + calloutH / 2 }}
        to={swiTarget}
        accent={ACCENT.amber}
        delay={t.swi - 0.05}
      />
      <Connector
        from={{ x: GQA_X + calloutW, y: GQA_Y + calloutH / 2 }}
        to={gqaTarget}
        accent={ACCENT.mint}
        delay={t.gqa - 0.05}
      />

      {/* RoPE (right) */}
      <Callout
        x={ROPE_X}
        y={ROPE_Y}
        w={calloutW}
        h={calloutH}
        accent={ACCENT.pink}
        label="RoPE"
        sub="rotate Q/K by position"
        delay={t.rope}
        icon={<IconRoPE accent={ACCENT.pink} />}
      />
      {/* RMSNorm (left, top) */}
      <Callout
        x={RMS_X}
        y={RMS_Y}
        w={calloutW}
        h={calloutH}
        accent={ACCENT.blue}
        label="RMSNorm"
        sub="simpler scale normalization"
        delay={t.rms}
        icon={<IconRMS accent={ACCENT.blue} />}
      />
      {/* SwiGLU (right, bottom) */}
      <Callout
        x={SWI_X}
        y={SWI_Y}
        w={calloutW}
        h={calloutH}
        accent={ACCENT.amber}
        label="SwiGLU"
        sub="gated feedforward"
        delay={t.swi}
        icon={<IconSwiGLU accent={ACCENT.amber} />}
      />
      {/* GQA (left, bottom) */}
      <Callout
        x={GQA_X}
        y={GQA_Y}
        w={calloutW}
        h={calloutH}
        accent={ACCENT.mint}
        label="GQA"
        sub="many Q heads, fewer K/V groups"
        delay={t.gqa}
        icon={<IconGQA accent={ACCENT.mint} />}
      />

      {/* Footer: roadmap line */}
      <motion.text
        x={VB_W / 2}
        y={VB_H - 36}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        letterSpacing={3.6}
        opacity={0.85}
        {...fadeIn(t.gqa + 0.4)}
      >
        ROPE · RMSNORM · SWIGLU · GQA
      </motion.text>
    </svg>
  )
}

/* ─────────── Split-pane wrapper ─────────── */
export function Act5IntroSplitPane() {
  // Use speed only to avoid an unused-import lint warning if the linter
  // is strict; the timing inside Viz uses framer's internal clock which
  // is already independent of our orchestrator step.
  void useSpeed()

  return (
    <SplitPaneScene
      viz={<VizAct5Intro />}
      text={{
        kicker: ACT5_KICKER,
        title: 'Same skeleton. Smarter parts.',
        subtitle: (
          <>
            Modern LLMs still use the transformer block: residual stream,
            attention, feedforward, and normalization. The upgrades mostly
            improve <em>position handling</em>, <em>stability</em>,{' '}
            <em>efficiency</em>, and <em>expressivity</em>.
          </>
        ),
        accent: ACCENT.mint,
        stats: [
          { label: 'RoPE', value: 'rotate Q/K', color: ACCENT.pink },
          { label: 'RMSNorm', value: 'scale only', color: ACCENT.blue },
          { label: 'SwiGLU', value: 'gated FFN', color: ACCENT.amber },
          { label: 'GQA', value: 'shared K/V', color: ACCENT.mint },
        ],
        infoCallout:
          'Act V is a roadmap, not a rewrite. The block, the residual stream, the attention/FFN sandwich — all the same. Four internals get swapped.',
      }}
    />
  )
}

/* =========================================================================
 * Scene 31 — rope: "Rotate, don't add."
 *
 * One pane, three reading layers stacked top → bottom:
 *
 *   1. ADD vs ROTATE comparison.
 *      LEFT:  the old additive recipe (token bar + position bar = input).
 *      RIGHT: the RoPE recipe (Q amber + K blue rotated by position p).
 *
 *   2. Tiny attention inset — pins RoPE to its actual location:
 *      "INSIDE THE ATTENTION BLOCK · applied to Q, K only · V untouched".
 *
 *   3. Relative-position demo — two coordinate planes side by side:
 *      LEFT  pair has small Δ  (positions 2, 4)  → small angle gap.
 *      RIGHT pair has large Δ  (positions 2, 10) → large angle gap.
 *      The angle gap IS the relative position. That's the punchline.
 *
 * Three phases, ~21 s total, matching the existing scene budget:
 *   p0 (4.5s): the old way reads, RoPE side dim
 *   p1 (8s):   RoPE side cycles positions; Q/K rotate together
 *   p2 (8s):   bottom demo lights up; attention inset stays on
 * ====================================================================== */

const ROPE_VB_W = 1400
const ROPE_VB_H = 1000

// Position values that the rotation animation cycles through during phase 1.
// Mix of small and large positions so the rotation reads as "position →
// angle", not just "linear sweep".
const ROPE_POS_CYCLE = [0, 2, 4, 8, 12, 16] as const
// One position step adds this many radians to the base angle. Chosen so
// position 16 ≈ a bit over a full turn, which keeps every position visible
// on the unit circle without wrapping confusingly.
const ROPE_THETA = 0.42

// Geometry — top row (ADD vs ROTATE)
const TOP_Y0 = 100
const TOP_Y1 = 480

const ADD_X0 = 70
const ADD_X1 = 660
const ROT_X0 = 740
const ROT_X1 = 1340
const ROT_CX = (ROT_X0 + ROT_X1) / 2 // 1040
const ROT_CY = 290
const ROT_R = 150

// Attention inset (middle band)
const INSET_Y = 510
const INSET_H = 70

// Relative-position demo (bottom)
const REL_Y0 = 615
const REL_TITLE_Y = 640
const REL_LEFT_CX = 460
const REL_RIGHT_CX = 1010
const REL_CY = 815
const REL_R = 120

/**
 * SVG arc-path string from one angle to another around (cx, cy) with radius r.
 * Used by Scene 31 to visualize Q's rotation as an actual arc.
 */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const sx = cx + Math.cos(startAngle) * r
  const sy = cy + Math.sin(startAngle) * r
  const ex = cx + Math.cos(endAngle) * r
  const ey = cy + Math.sin(endAngle) * r
  const delta = endAngle - startAngle
  const sweep = delta >= 0 ? 1 : 0
  const largeArc = Math.abs(delta) > Math.PI ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`
}

/* ─────────── ADD method (left half) ─────────── */
function AddPanel({ dim }: { dim: boolean }) {
  const tokenColors = [
    'rgba(167,139,250,0.30)',
    'rgba(167,139,250,0.45)',
    'rgba(167,139,250,0.65)',
    'rgba(167,139,250,0.55)',
    'rgba(167,139,250,0.40)',
    'rgba(167,139,250,0.50)',
    'rgba(167,139,250,0.60)',
    'rgba(167,139,250,0.45)',
  ]
  const posColors = [
    'rgba(34,211,238,0.25)',
    'rgba(34,211,238,0.35)',
    'rgba(34,211,238,0.45)',
    'rgba(34,211,238,0.55)',
    'rgba(34,211,238,0.40)',
    'rgba(34,211,238,0.30)',
    'rgba(34,211,238,0.50)',
    'rgba(34,211,238,0.60)',
  ]
  const cells = 8
  const cellW = 60
  const gap = 4
  const rowW = cells * cellW + (cells - 1) * gap
  const rowX0 = ADD_X0 + ((ADD_X1 - ADD_X0) - rowW) / 2

  // Each row sits in its own band.
  const tokenY = 178
  const plusY = 240
  const posY = 258
  const eqY = 320
  const sumY = 338

  return (
    <motion.g
      animate={{ opacity: dim ? 0.45 : 1 }}
      transition={{ duration: 0.6 }}
    >
      <text
        x={(ADD_X0 + ADD_X1) / 2}
        y={130}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={2.4}
      >
        OLD · ADD POSITION TO EMBEDDING
      </text>

      {/* Token row */}
      <text
        x={rowX0 - 14}
        y={tokenY + 30}
        textAnchor="end"
        fill={ACCENT.violet}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={1.4}
      >
        token
      </text>
      {tokenColors.map((c, i) => (
        <motion.rect
          key={`t${i}`}
          x={rowX0 + i * (cellW + gap)}
          y={tokenY}
          width={cellW}
          height={42}
          rx={4}
          ry={4}
          fill={c}
          stroke="rgba(167,139,250,0.55)"
          strokeWidth={0.8}
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: `${rowX0 + i * (cellW + gap) + cellW / 2}px ${tokenY + 21}px` }}
          transition={{ duration: 0.4, delay: 0.25 + i * 0.04, ease: 'easeOut' }}
        />
      ))}

      {/* + (pulses gently) */}
      <motion.text
        x={(ADD_X0 + ADD_X1) / 2}
        y={plusY + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={28}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0.85, 1], scale: 1 }}
        transition={{ duration: 1.2, delay: 0.65, ease: 'easeOut' }}
      >
        +
      </motion.text>

      {/* Position row */}
      <text
        x={rowX0 - 14}
        y={posY + 30}
        textAnchor="end"
        fill={ACCENT.cyan}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={1.4}
      >
        position
      </text>
      {posColors.map((c, i) => (
        <motion.rect
          key={`p${i}`}
          x={rowX0 + i * (cellW + gap)}
          y={posY}
          width={cellW}
          height={42}
          rx={4}
          ry={4}
          fill={c}
          stroke="rgba(34,211,238,0.55)"
          strokeWidth={0.8}
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: `${rowX0 + i * (cellW + gap) + cellW / 2}px ${posY + 21}px` }}
          transition={{ duration: 0.4, delay: 0.85 + i * 0.04, ease: 'easeOut' }}
        />
      ))}

      {/* = */}
      <text
        x={(ADD_X0 + ADD_X1) / 2}
        y={eqY + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={26}
      >
        =
      </text>

      {/* Sum row */}
      <text
        x={rowX0 - 14}
        y={sumY + 30}
        textAnchor="end"
        fill="rgba(255,255,255,0.85)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={1.4}
      >
        input
      </text>
      {tokenColors.map((c, i) => {
        // Mix the two by stacking via gradient — cheap visual trick: blend
        // colors by averaging stroke + fill.
        const tokenAlpha = parseFloat(c.split(',')[3]) || 0.5
        const posAlpha = parseFloat(posColors[i].split(',')[3]) || 0.5
        const fill = `rgba(160,180,255,${(tokenAlpha + posAlpha) / 2})`
        return (
          <motion.rect
            key={`s${i}`}
            x={rowX0 + i * (cellW + gap)}
            y={sumY}
            width={cellW}
            height={42}
            rx={4}
            ry={4}
            fill={fill}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            style={{ transformOrigin: `${rowX0 + i * (cellW + gap) + cellW / 2}px ${sumY + 21}px` }}
            transition={{ duration: 0.4, delay: 1.6 + i * 0.04, ease: 'easeOut' }}
            stroke="rgba(200,210,255,0.65)"
            strokeWidth={0.8}
          />
        )
      })}

      {/* Caption */}
      <text
        x={(ADD_X0 + ADD_X1) / 2}
        y={420}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={14}
        fontStyle="italic"
      >
        position is baked in absolutely — every layer sees it
      </text>
    </motion.g>
  )
}

/* ─────────── Rotation plane: shared component ─────────── */
function RotationPlane({
  cx,
  cy,
  r,
  qPos,
  kPos,
  qLabel,
  kLabel,
  active,
  showRelArc,
}: {
  cx: number
  cy: number
  r: number
  qPos: number
  kPos: number
  qLabel: string
  kLabel: string
  active: boolean
  showRelArc?: boolean
}) {
  // Base angles so Q and K start as visibly distinct vectors.
  const Q_BASE = -Math.PI / 5
  const K_BASE = Math.PI / 5
  const qAngle = Q_BASE + qPos * ROPE_THETA
  const kAngle = K_BASE + kPos * ROPE_THETA

  const qx = cx + Math.cos(qAngle) * r * 0.92
  const qy = cy + Math.sin(qAngle) * r * 0.92
  const kx = cx + Math.cos(kAngle) * r * 0.92
  const ky = cy + Math.sin(kAngle) * r * 0.92

  // Arc between Q and K to highlight relative angle (sweep flag picks shorter side).
  const relStart = qAngle
  const relEnd = kAngle
  const arcR = r * 0.35
  const arcStartX = cx + Math.cos(relStart) * arcR
  const arcStartY = cy + Math.sin(relStart) * arcR
  const arcEndX = cx + Math.cos(relEnd) * arcR
  const arcEndY = cy + Math.sin(relEnd) * arcR
  const sweep = relEnd > relStart ? 1 : 0

  // Rotation arcs — visualize how much each vector has rotated from its
  // base. As posIdx grows, the arc grows. Only meaningful in the active
  // (cycling) plane; in phase-2 demo planes both qPos and kPos are fixed.
  const qArcR = r * 0.78
  const kArcR = r * 0.86
  const qArcD = arcPath(cx, cy, qArcR, Q_BASE, qAngle)
  const kArcD = arcPath(cx, cy, kArcR, K_BASE, kAngle)

  return (
    <g style={{ opacity: active ? 1 : 0.35 }}>
      {/* Outer ring — pulses softly when active so the plane feels powered on */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
        animate={
          active
            ? { strokeOpacity: [0.18, 0.4, 0.18] }
            : { strokeOpacity: 0.18 }
        }
        transition={
          active
            ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.4 }
        }
      />
      {/* Inner ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.6}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={0.8}
        strokeDasharray="3 5"
      />
      {/* Crosshairs */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(255,255,255,0.10)" strokeWidth={0.8} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(255,255,255,0.10)" strokeWidth={0.8} />
      {/* Origin dot */}
      <circle cx={cx} cy={cy} r={2.4} fill="rgba(255,255,255,0.55)" />

      {/* Q rotation arc — shows the angle Q has swept from its base. */}
      {qPos !== 0 && (
        <path
          d={qArcD}
          fill="none"
          stroke={ACCENT.amber}
          strokeOpacity={0.4}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeDasharray="3 4"
        />
      )}
      {/* K rotation arc */}
      {kPos !== 0 && (
        <path
          d={kArcD}
          fill="none"
          stroke={ACCENT.blue}
          strokeOpacity={0.4}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeDasharray="3 4"
        />
      )}

      {/* Relative angle arc — draws in cleanly when revealed (phase 2). */}
      {showRelArc && (
        <>
          <motion.path
            key={`rel-arc-${qPos}-${kPos}`}
            d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 ${sweep} ${arcEndX} ${arcEndY}`}
            fill="none"
            stroke={ACCENT.mint}
            strokeWidth={2.4}
            strokeOpacity={0.9}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
          />
          {/* Q-K connecting line — emphasizes "the dot product is between
              these two vectors". */}
          <motion.line
            x1={qx}
            y1={qy}
            x2={kx}
            y2={ky}
            stroke={ACCENT.mint}
            strokeOpacity={0.45}
            strokeWidth={1}
            strokeDasharray="2 5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 0.7, delay: 0.85 }}
          />
          <motion.text
            key={`rel-label-${qPos}-${kPos}`}
            x={cx}
            y={cy + 6}
            textAnchor="middle"
            fill={ACCENT.mint}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize={14}
            fontWeight={600}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: [0.6, 1.15, 1] }}
            transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
          >
            Δ = {kPos - qPos}
          </motion.text>
        </>
      )}

      {/* Q vector (amber) — halo behind tip pulses, line + dot spring to new pos */}
      {active && (
        <motion.circle
          cx={qx}
          cy={qy}
          r={11}
          fill={ACCENT.amber}
          fillOpacity={0.18}
          animate={{
            cx: qx,
            cy: qy,
            scale: [1, 1.6, 1],
            opacity: [0.18, 0.4, 0.18],
          }}
          transition={{
            cx: { type: 'spring', stiffness: 110, damping: 18 },
            cy: { type: 'spring', stiffness: 110, damping: 18 },
            scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: `${qx}px ${qy}px` }}
        />
      )}
      <motion.line
        x1={cx}
        y1={cy}
        x2={qx}
        y2={qy}
        stroke={ACCENT.amber}
        strokeWidth={2.6}
        strokeLinecap="round"
        animate={{ x2: qx, y2: qy }}
        transition={{ type: 'spring', stiffness: 110, damping: 18 }}
      />
      <motion.circle
        cx={qx}
        cy={qy}
        r={4.5}
        fill={ACCENT.amber}
        animate={{ cx: qx, cy: qy }}
        transition={{ type: 'spring', stiffness: 110, damping: 18 }}
      />
      <text
        x={qx + 10}
        y={qy + 4}
        fill={ACCENT.amber}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        fontWeight={600}
      >
        {qLabel}
      </text>

      {/* K vector (blue) — same pattern */}
      {active && (
        <motion.circle
          cx={kx}
          cy={ky}
          r={11}
          fill={ACCENT.blue}
          fillOpacity={0.18}
          animate={{
            cx: kx,
            cy: ky,
            scale: [1, 1.6, 1],
            opacity: [0.18, 0.4, 0.18],
          }}
          transition={{
            cx: { type: 'spring', stiffness: 110, damping: 18 },
            cy: { type: 'spring', stiffness: 110, damping: 18 },
            scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
            opacity: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
          }}
          style={{ transformOrigin: `${kx}px ${ky}px` }}
        />
      )}
      <motion.line
        x1={cx}
        y1={cy}
        x2={kx}
        y2={ky}
        stroke={ACCENT.blue}
        strokeWidth={2.6}
        strokeLinecap="round"
        animate={{ x2: kx, y2: ky }}
        transition={{ type: 'spring', stiffness: 110, damping: 18 }}
      />
      <motion.circle
        cx={kx}
        cy={ky}
        r={4.5}
        fill={ACCENT.blue}
        animate={{ cx: kx, cy: ky }}
        transition={{ type: 'spring', stiffness: 110, damping: 18 }}
      />
      <text
        x={kx + 10}
        y={ky + 4}
        fill={ACCENT.blue}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        fontWeight={600}
      >
        {kLabel}
      </text>
    </g>
  )
}

/* ─────────── ROTATE method (right half of top row) ─────────── */
function RotatePanel({ active, posIdx }: { active: boolean; posIdx: number }) {
  const p = ROPE_POS_CYCLE[posIdx]
  const { prompt } = usePrompt()
  // Use the actual character at the cycled position (mod prompt length).
  const promptStr = prompt.length > 0 ? prompt : 'To be, or not to be'
  const tokIdx = p % promptStr.length
  const tokChar = promptStr[tokIdx] ?? '·'
  const tokLabel = tokChar === ' ' ? '·' : tokChar

  // Token grounding pipeline geometry — sits to the LEFT of the unit
  // circle, so the viewer sees:
  //   token tile  →  × W_Q  →  rotating Q  (in the unit circle)
  // The same token also produces K via × W_K. Sells "those rotating
  // arrows are projections of an actual character from your prompt".
  const PIPE_X = ROT_X0 + 16
  const PIPE_W = 110
  const TOK_TILE_Y = 200
  const TOK_TILE_H = 56

  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.55 }}
      transition={{ duration: 0.6 }}
    >
      <text
        x={ROT_CX}
        y={130}
        textAnchor="middle"
        fill={ACCENT.pink}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={2.4}
      >
        ROPE · ROTATE Q AND K BY POSITION
      </text>

      {/* Position chip — top right of the rotate panel */}
      <rect
        x={ROT_X1 - 130}
        y={150}
        width={120}
        height={36}
        rx={6}
        ry={6}
        fill="rgba(236,72,153,0.10)"
        stroke={ACCENT.pink}
        strokeOpacity={0.55}
        strokeWidth={1}
      />
      <text
        x={ROT_X1 - 70}
        y={167}
        textAnchor="middle"
        fill={ACCENT.pink}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.4}
      >
        POSITION
      </text>
      <motion.text
        key={`p-${p}`}
        x={ROT_X1 - 70}
        y={182}
        textAnchor="middle"
        fill={ACCENT.pink}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        fontWeight={700}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        p = {p}
      </motion.text>

      {/* ── Token grounding pipeline (left of the unit circle) ──
          Shows "this character → × W_Q → that Q vector" so the
          rotating vectors aren't abstract math objects, they're the
          Q and K projections of a real prompt character. */}
      <text
        x={PIPE_X + PIPE_W / 2}
        y={TOK_TILE_Y - 22}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        letterSpacing={2}
      >
        FROM YOUR PROMPT
      </text>
      <motion.g
        key={`tok-${p}-${tokChar}`}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <rect
          x={PIPE_X}
          y={TOK_TILE_Y}
          width={PIPE_W}
          height={TOK_TILE_H}
          rx={8}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.4}
        />
        <text
          x={PIPE_X + PIPE_W / 2}
          y={TOK_TILE_Y + TOK_TILE_H / 2 + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.95)"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={32}
          fontWeight={700}
        >
          {tokLabel}
        </text>
        <text
          x={PIPE_X + PIPE_W / 2}
          y={TOK_TILE_Y + TOK_TILE_H + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.55)"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={10}
          letterSpacing={1.2}
        >
          @ pos {p}
        </text>
      </motion.g>

      {/* × W_Q badge + arrow toward Q (amber) */}
      {(() => {
        const fromX = PIPE_X + PIPE_W
        const toX = ROT_CX - ROT_R - 12
        const yQ = TOK_TILE_Y + 12
        const yK = TOK_TILE_Y + TOK_TILE_H - 12
        return (
          <g>
            {/* Q line */}
            <motion.path
              d={`M ${fromX + 6} ${TOK_TILE_Y + TOK_TILE_H / 2} Q ${(fromX + toX) / 2} ${yQ}, ${toX} ${yQ}`}
              fill="none"
              stroke={ACCENT.amber}
              strokeOpacity={0.85}
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: active ? 1 : 0.4 }}
              transition={{ duration: 0.6, delay: active ? 0.3 : 0 }}
            />
            {/* Q label */}
            <motion.text
              x={(fromX + toX) / 2}
              y={yQ - 6}
              textAnchor="middle"
              fill={ACCENT.amber}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={11}
              fontWeight={600}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 1 : 0.4 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              × W_Q
            </motion.text>
            {/* K line */}
            <motion.path
              d={`M ${fromX + 6} ${TOK_TILE_Y + TOK_TILE_H / 2} Q ${(fromX + toX) / 2} ${yK}, ${toX} ${yK}`}
              fill="none"
              stroke={ACCENT.blue}
              strokeOpacity={0.85}
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: active ? 1 : 0.4 }}
              transition={{ duration: 0.6, delay: active ? 0.45 : 0 }}
            />
            {/* K label */}
            <motion.text
              x={(fromX + toX) / 2}
              y={yK + 16}
              textAnchor="middle"
              fill={ACCENT.blue}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={11}
              fontWeight={600}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 1 : 0.4 }}
              transition={{ duration: 0.3, delay: 0.75 }}
            >
              × W_K
            </motion.text>
            {/* Particle traveling Q line — sells the projection happening */}
            {active && (
              <motion.circle
                key={`pq-particle-${p}`}
                r={4}
                fill={ACCENT.amber}
                fillOpacity={0.95}
                initial={{
                  cx: fromX + 6,
                  cy: TOK_TILE_Y + TOK_TILE_H / 2,
                  opacity: 0,
                }}
                animate={{
                  cx: [fromX + 6, (fromX + toX) / 2, toX],
                  cy: [TOK_TILE_Y + TOK_TILE_H / 2, yQ, yQ],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.0,
                  delay: 0.5,
                  ease: 'easeInOut',
                  times: [0, 0.15, 0.85, 1],
                  repeat: Infinity,
                  repeatDelay: 1.4,
                }}
              />
            )}
            {/* Particle traveling K line */}
            {active && (
              <motion.circle
                key={`pk-particle-${p}`}
                r={4}
                fill={ACCENT.blue}
                fillOpacity={0.95}
                initial={{
                  cx: fromX + 6,
                  cy: TOK_TILE_Y + TOK_TILE_H / 2,
                  opacity: 0,
                }}
                animate={{
                  cx: [fromX + 6, (fromX + toX) / 2, toX],
                  cy: [TOK_TILE_Y + TOK_TILE_H / 2, yK, yK],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.0,
                  delay: 0.7,
                  ease: 'easeInOut',
                  times: [0, 0.15, 0.85, 1],
                  repeat: Infinity,
                  repeatDelay: 1.4,
                }}
              />
            )}
          </g>
        )
      })()}

      <RotationPlane
        cx={ROT_CX}
        cy={ROT_CY}
        r={ROT_R}
        qPos={p}
        kPos={p}
        qLabel={`q'_${p}`}
        kLabel={`k'_${p}`}
        active={active}
      />

      {/* Caption */}
      <text
        x={ROT_CX}
        y={ROT_CY + ROT_R + 50}
        textAnchor="middle"
        fill="rgba(255,255,255,0.65)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={14}
        fontStyle="italic"
      >
        position p → angle = p · θ
      </text>
      <text
        x={ROT_CX}
        y={ROT_CY + ROT_R + 72}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={1.2}
      >
        q&apos;_p = R(p) · q · · · k&apos;_p = R(p) · k
      </text>
    </motion.g>
  )
}

/* ─────────── Attention inset (middle band) ─────────── */
function AttentionInset({ active }: { active: boolean }) {
  const cx = ROPE_VB_W / 2
  const boxW = 700
  const boxX = cx - boxW / 2
  const boxY = INSET_Y

  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.5 }}
      transition={{ duration: 0.6 }}
    >
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={INSET_H}
        rx={10}
        ry={10}
        fill="rgba(167,139,250,0.05)"
        stroke={ACCENT.violet}
        strokeOpacity={0.4}
        strokeWidth={1.1}
      />
      <text
        x={boxX + 18}
        y={boxY + 24}
        fill={ACCENT.violet}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2}
      >
        INSIDE THE ATTENTION BLOCK
      </text>

      {/* Q / K / V tags. When the inset becomes active, Q and K briefly
          pulse pink to mark "RoPE applies here". V stays dim. */}
      {(['Q', 'K', 'V'] as const).map((lbl, i) => {
        const isV = lbl === 'V'
        const color = isV ? 'rgba(255,255,255,0.45)' : lbl === 'Q' ? ACCENT.amber : ACCENT.blue
        const tagX = boxX + 240 + i * 100
        const tagY = boxY + 38
        return (
          <g key={lbl}>
            <rect
              x={tagX}
              y={tagY}
              width={60}
              height={24}
              rx={5}
              ry={5}
              fill={isV ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'}
              stroke={color}
              strokeOpacity={isV ? 0.4 : 0.8}
              strokeWidth={1.2}
            />
            <text
              x={tagX + 30}
              y={tagY + 16}
              textAnchor="middle"
              fill={color}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={13}
              fontWeight={600}
            >
              {lbl}
            </text>
            {/* RoPE-applies pulse — animated pink ring on Q and K only,
                only when the inset is active. */}
            {!isV && active && (
              <motion.rect
                x={tagX - 3}
                y={tagY - 3}
                width={66}
                height={30}
                rx={6}
                ry={6}
                fill="none"
                stroke={ACCENT.pink}
                strokeWidth={1.6}
                animate={{ opacity: [0, 0.85, 0], scale: [0.95, 1.08, 1] }}
                transition={{
                  duration: 1.6,
                  delay: 0.3 + i * 0.18,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  ease: 'easeInOut',
                }}
                style={{
                  transformOrigin: `${tagX + 30}px ${tagY + 12}px`,
                }}
              />
            )}
          </g>
        )
      })}

      <text
        x={boxX + boxW - 18}
        y={boxY + 28}
        textAnchor="end"
        fill={ACCENT.pink}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={1.4}
      >
        RoPE → Q, K only
      </text>
      <text
        x={boxX + boxW - 18}
        y={boxY + 50}
        textAnchor="end"
        fill="rgba(255,255,255,0.45)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.2}
      >
        V untouched
      </text>
    </motion.g>
  )
}

/* ─────────── Relative-position demo (bottom) ─────────── */
function RelativeDemo({ active }: { active: boolean }) {
  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.25 }}
      transition={{ duration: 0.7 }}
    >
      <text
        x={ROPE_VB_W / 2}
        y={REL_TITLE_Y}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        letterSpacing={2.6}
      >
        RELATIVE POSITION EMERGES IN Q · K
      </text>

      {/* Left pair: small Δ */}
      <RotationPlane
        cx={REL_LEFT_CX}
        cy={REL_CY}
        r={REL_R}
        qPos={2}
        kPos={4}
        qLabel="q'_2"
        kLabel="k'_4"
        active
        showRelArc
      />
      <text
        x={REL_LEFT_CX}
        y={REL_CY + REL_R + 42}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={1.4}
      >
        positions 2 and 4
      </text>
      <text
        x={REL_LEFT_CX}
        y={REL_CY + REL_R + 62}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
        fontStyle="italic"
      >
        small offset → small angle gap
      </text>

      {/* Right pair: large Δ */}
      <RotationPlane
        cx={REL_RIGHT_CX}
        cy={REL_CY}
        r={REL_R}
        qPos={2}
        kPos={10}
        qLabel="q'_2"
        kLabel="k'_10"
        active
        showRelArc
      />
      <text
        x={REL_RIGHT_CX}
        y={REL_CY + REL_R + 42}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={1.4}
      >
        positions 2 and 10
      </text>
      <text
        x={REL_RIGHT_CX}
        y={REL_CY + REL_R + 62}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
        fontStyle="italic"
      >
        large offset → large angle gap
      </text>

      {/* Bottom punchline */}
      <text
        x={ROPE_VB_W / 2}
        y={REL_CY + REL_R + 110}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-sans-serif, system-ui"
        fontSize={15}
        fontWeight={500}
      >
        Q · K depends only on (j − i), not absolute positions.
      </text>
    </motion.g>
  )
}

/* ─────────── The viz ─────────── */
export function VizRoPE({ phase, posIdx }: { phase: number; posIdx: number }) {
  return (
    <svg
      viewBox={`0 0 ${ROPE_VB_W} ${ROPE_VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      {/* Title */}
      <text
        x={ROPE_VB_W / 2}
        y={56}
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={16}
        letterSpacing={3.4}
      >
        ADD vs ROTATE
      </text>

      {/* Vertical divider between ADD and ROTATE */}
      <line
        x1={(ADD_X1 + ROT_X0) / 2}
        y1={TOP_Y0}
        x2={(ADD_X1 + ROT_X0) / 2}
        y2={TOP_Y1}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={1}
      />

      <AddPanel dim={phase === 1} />
      <RotatePanel active={phase >= 1} posIdx={posIdx} />

      <AttentionInset active={phase >= 1} />

      <RelativeDemo active={phase >= 2} />
    </svg>
  )
}

/* ─────────── Split-pane wrapper ─────────── */
export function RopeSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  // Total ~21s to match the existing scene budget.
  const PHASE_DURATIONS_MS = [4500, 8000, 8500] as const
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setTimeout(
      () => setPhase((p) => (p + 1) % PHASES),
      PHASE_DURATIONS_MS[phase] / speed,
    )
    return () => clearTimeout(id)
  }, [phase, speed])

  // Cycle through ROPE_POS_CYCLE only during phase 1.
  const [posIdx, setPosIdx] = useState(0)
  useEffect(() => {
    if (phase !== 1) return
    setPosIdx(0)
    const stepMs = PHASE_DURATIONS_MS[1] / ROPE_POS_CYCLE.length / speed
    const id = setInterval(() => {
      setPosIdx((i) => (i + 1) % ROPE_POS_CYCLE.length)
    }, stepMs)
    return () => clearInterval(id)
  }, [phase, speed])

  const phaseLabels = ['the old way', 'rotate Q/K', 'relative position']
  const subtitleByPhase: ReactNode[] = [
    <>
      Pre-RoPE transformers <em>added</em> a position embedding to the token
      embedding. Position got baked in as an absolute offset that every layer
      saw the same way.
    </>,
    <>
      Pick a token from your prompt. Project to{' '}
      <strong style={{ color: ACCENT.amber }}>Q</strong> via{' '}
      <code>W_Q</code> and to <strong style={{ color: ACCENT.blue }}>K</strong>{' '}
      via <code>W_K</code>. <strong style={{ color: ACCENT.pink }}>RoPE</strong>{' '}
      then rotates each by an angle proportional to its position{' '}
      <code>p</code>. <strong style={{ color: ACCENT.violet }}>V</strong> is
      untouched.
    </>,
    <>
      Because both Q at position <em>i</em> and K at position <em>j</em> get
      rotated, the dot product <em>q · k</em> depends only on the{' '}
      <em>relative offset (j − i)</em>. Position falls out of attention for
      free — no learned position table required.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'Additive PE works, but it tangles position into the token vector. Every layer keeps recomputing what was originally a positional shift, and extrapolating beyond the training length is brittle.',
    'θ_i = 10000^(−2i/d). Each pair of dimensions gets its own angular frequency, so different feature pairs encode position at different scales — like mixing minute and hour hands.',
    'Used in LLaMA, Qwen, Mistral, Gemini, DeepSeek. Long-context models (100k–1M tokens) lean on RoPE because it extrapolates more gracefully than learned positional tables.',
  ]

  const p = ROPE_POS_CYCLE[posIdx]

  return (
    <SplitPaneScene
      viz={<VizRoPE phase={phase} posIdx={posIdx} />}
      text={{
        kicker: 'ACT V · MODERN · ROPE',
        title: 'Rotate, don’t add.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.pink,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.pink}
          />
        ),
        stats: [
          { label: 'applied to', value: 'Q, K only', color: ACCENT.pink },
          { label: 'V', value: 'untouched' },
          { label: 'live position', value: phase === 1 ? `p = ${p}` : '—', color: ACCENT.pink },
          { label: 'params added', value: '0 (analytic)' },
          { label: 'used in', value: 'LLaMA · Qwen · Gemini', color: ACCENT.mint },
        ],
        equation: {
          label: 'rotate, then dot-product',
          body: <>q&apos;_p = R(p) · q &nbsp;·&nbsp; k&apos;_p = R(p) · k</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 32 — modern: "Three more surgical upgrades."
 *
 * RoPE was Scene 31. Scene 32 takes care of the rest of the modern bundle:
 * RMSNorm, SwiGLU, GQA. One card per upgrade, all three on screen the whole
 * time. The active card is at full opacity; the others dim. Each card shows
 * the classic recipe on top and the modern recipe on the bottom, with an
 * animated arrow between them so the SWAP is the thing you notice — not the
 * boxes.
 *
 * A small "✓ RoPE — Scene 31" pill sits at the very top so the viewer
 * understands that RoPE is already accounted for.
 *
 * Phases (~9 s each, total 27 s — matches existing scene budget):
 *   p0: RMSNorm  (LayerNorm → RMSNorm: drop the mean-subtract step)
 *   p1: SwiGLU   (single activation → gated FFN with two streams + ⊙)
 *   p2: GQA      (every-Q-has-its-own KV → groups of Q share KV)
 * ====================================================================== */

const MOD_VB_W = 1400
const MOD_VB_H = 1000

const MOD_CARD_Y = 140
const MOD_CARD_H = 730
const MOD_CARD_W = 430
const MOD_CARD_GAP = 25
const MOD_TOTAL_W = 3 * MOD_CARD_W + 2 * MOD_CARD_GAP // 1340
const MOD_CARD_X0 = (MOD_VB_W - MOD_TOTAL_W) / 2 // 30
const MOD_CARD_R = 18

function modCardX(i: number) {
  return MOD_CARD_X0 + i * (MOD_CARD_W + MOD_CARD_GAP)
}

/* ─────────── Card shell ─────────── */
/**
 * Returns a motion-prop spread for a Scene-32 card-body subsection. The
 * subsection sits at opacity 0.5 when the card is inactive, and animates
 * up to opacity 1 with a per-stage `delay` when the card becomes active.
 * That gives every card a clear classic → swap → modern → badge flow.
 */
function stage(active: boolean, delay: number) {
  return {
    initial: { opacity: 0.4 },
    animate: { opacity: active ? 1 : 0.4 },
    transition: {
      duration: 0.42,
      delay: active ? delay : 0,
      ease: 'easeOut' as const,
    },
  }
}

/**
 * Same idea but for path elements that should draw in via pathLength when
 * the card activates.
 */
function stagePath(active: boolean, delay: number, dur = 0.55) {
  return {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: active ? 1 : 0, opacity: active ? 1 : 0 },
    transition: {
      duration: dur,
      delay: active ? delay : 0,
      ease: 'easeOut' as const,
    },
  }
}

function ModCard({
  i,
  active,
  accent,
  title,
  badge,
  children,
}: {
  i: number
  active: boolean
  accent: string
  title: string
  badge: string
  children: React.ReactNode
}) {
  const x = modCardX(i)
  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.32 }}
      transition={{ duration: 0.6 }}
    >
      {/* Card background */}
      <motion.rect
        x={x}
        y={MOD_CARD_Y}
        width={MOD_CARD_W}
        height={MOD_CARD_H}
        rx={MOD_CARD_R}
        ry={MOD_CARD_R}
        fill="rgba(255,255,255,0.04)"
        stroke={accent}
        animate={{
          strokeOpacity: active ? 0.85 : 0.4,
          strokeWidth: active ? 1.8 : 1.2,
        }}
        transition={{ duration: 0.6 }}
      />

      {/* Title */}
      <text
        x={x + MOD_CARD_W / 2}
        y={MOD_CARD_Y + 36}
        textAnchor="middle"
        fill={accent}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={14}
        letterSpacing={2.4}
        fontWeight={600}
      >
        {title}
      </text>

      {/* Highlight badge — bottom of card. Pulses once on activation
          (after the classic→modern flow has finished). */}
      <g>
        <motion.rect
          x={x + 26}
          y={MOD_CARD_Y + MOD_CARD_H - 56}
          width={MOD_CARD_W - 52}
          height={32}
          rx={8}
          ry={8}
          fill={`${accent}22`}
          stroke={accent}
          strokeOpacity={0.6}
          strokeWidth={1}
          animate={
            active
              ? {
                  strokeOpacity: [0.6, 1, 0.85],
                  scale: [1, 1.03, 1],
                }
              : { strokeOpacity: 0.6, scale: 1 }
          }
          transition={
            active
              ? {
                  duration: 1.2,
                  delay: 4.0,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 2.4,
                }
              : { duration: 0.4 }
          }
          style={{
            transformOrigin: `${x + MOD_CARD_W / 2}px ${MOD_CARD_Y + MOD_CARD_H - 40}px`,
          }}
        />
        <text
          x={x + MOD_CARD_W / 2}
          y={MOD_CARD_Y + MOD_CARD_H - 35}
          textAnchor="middle"
          fill={accent}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={13}
          letterSpacing={1.6}
          fontWeight={500}
        >
          {badge}
        </text>
      </g>

      {children}
    </motion.g>
  )
}

/* Inline labelled box used inside cards */
function MiniBox({
  x,
  y,
  w,
  h,
  label,
  accent,
  faded,
  strikethrough,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  accent: string
  faded?: boolean
  strikethrough?: boolean
}) {
  return (
    <g opacity={faded ? 0.35 : 1}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        ry={6}
        fill={`${accent}1a`}
        stroke={accent}
        strokeOpacity={faded ? 0.5 : 0.85}
        strokeWidth={1.2}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill={accent}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        fontWeight={500}
      >
        {label}
      </text>
      {strikethrough && (
        <motion.line
          x1={x + 6}
          y1={y + h / 2}
          x2={x + w - 6}
          y2={y + h / 2}
          stroke="#f87171"
          strokeWidth={2.4}
          strokeOpacity={0.95}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.95 }}
          transition={{ duration: 0.55, delay: 0.4, ease: 'easeOut' }}
        />
      )}
    </g>
  )
}

function CardSubLabel({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      fontSize={11}
      letterSpacing={2}
      fontWeight={600}
    >
      {text}
    </text>
  )
}

function Arrow({ x, y, accent, label }: { x: number; y: number; accent: string; label?: string }) {
  return (
    <g>
      <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={accent} strokeOpacity={0.7} strokeWidth={1.4} />
      <polygon
        points={`${x + 8},${y} ${x + 4},${y - 4} ${x + 4},${y + 4}`}
        fill={accent}
        fillOpacity={0.85}
      />
      {label && (
        <text
          x={x + 14}
          y={y + 4}
          fill="rgba(255,255,255,0.55)"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={10}
          letterSpacing={1.2}
        >
          {label}
        </text>
      )}
    </g>
  )
}

/* ─────────── RMSNorm card ─────────── */
function RMSNormCardBody({ active }: { active: boolean }) {
  const x0 = modCardX(0)
  const padX = 22
  const innerX = x0 + padX
  const innerW = MOD_CARD_W - 2 * padX
  const accent = ACCENT.blue

  // Pipeline op box geometry
  const opW = 100
  const opH = 42
  const arrowGap = 22

  // CLASSIC row: 3 ops centered
  const classicTotal = 3 * opW + 2 * arrowGap
  const classicX0 = innerX + (innerW - classicTotal) / 2
  const classicY = MOD_CARD_Y + 110

  // MODERN row: 2 ops centered
  const modernTotal = 2 * opW + 1 * arrowGap
  const modernX0 = innerX + (innerW - modernTotal) / 2
  const modernY = MOD_CARD_Y + 320

  // Vector strip showing input → after-step (small visual hint)
  const stripY = MOD_CARD_Y + 470
  const cellCount = 8
  const cellW = (innerW - 60) / cellCount
  const cellGap = 4

  // Stage delays — classic appears first (0.0–1.0), drop arrow draws
  // (~1.2–1.8), modern appears (~2.0–3.0), then captions / strip.
  const dArrowX = innerX + innerW / 2

  return (
    <g>
      <motion.g {...stage(active, 0.0)}>
        <CardSubLabel x={innerX} y={MOD_CARD_Y + 86} text="CLASSIC · LAYERNORM" color="rgba(255,255,255,0.65)" />
      </motion.g>

      {/* Classic pipeline: subtract μ → ÷ σ → γ·x+β. Each box pops in. */}
      <motion.g {...stage(active, 0.18)}>
        <MiniBox
          x={classicX0}
          y={classicY}
          w={opW}
          h={opH}
          label="− μ"
          accent={accent}
          strikethrough={active}
        />
      </motion.g>
      <motion.g {...stage(active, 0.34)}>
        <Arrow x={classicX0 + opW + arrowGap / 2} y={classicY + opH / 2} accent={accent} />
      </motion.g>
      <motion.g {...stage(active, 0.50)}>
        <MiniBox
          x={classicX0 + opW + arrowGap}
          y={classicY}
          w={opW}
          h={opH}
          label="÷ σ"
          accent={accent}
        />
      </motion.g>
      <motion.g {...stage(active, 0.66)}>
        <Arrow x={classicX0 + 2 * (opW + arrowGap) - arrowGap / 2} y={classicY + opH / 2} accent={accent} />
      </motion.g>
      <motion.g {...stage(active, 0.82)}>
        <MiniBox
          x={classicX0 + 2 * (opW + arrowGap)}
          y={classicY}
          w={opW}
          h={opH}
          label="γ·x + β"
          accent={accent}
        />
      </motion.g>
      <motion.text
        {...stage(active, 1.05)}
        x={innerX + innerW / 2}
        y={classicY + opH + 38}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
      >
        center first, then scale
      </motion.text>

      {/* Vertical drop arrow — line draws via pathLength then arrowhead pops */}
      <motion.line
        x1={dArrowX}
        y1={classicY + opH + 60}
        x2={dArrowX}
        y2={modernY - 20}
        stroke={ACCENT.mint}
        strokeOpacity={0.85}
        strokeWidth={1.6}
        strokeDasharray="3 5"
        {...stagePath(active, 1.25, 0.6)}
      />
      <motion.polygon
        points={`${dArrowX},${modernY - 12} ${dArrowX - 6},${modernY - 22} ${dArrowX + 6},${modernY - 22}`}
        fill={ACCENT.mint}
        fillOpacity={0.95}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: active ? 1 : 0.3, scale: active ? 1 : 0.7 }}
        transition={{ duration: 0.3, delay: active ? 1.85 : 0, ease: 'easeOut' }}
        style={{ transformOrigin: `${dArrowX}px ${modernY - 17}px` }}
      />
      <motion.text
        x={dArrowX + 14}
        y={(classicY + opH + modernY) / 2}
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.4}
        {...stage(active, 1.7)}
      >
        drop − μ
      </motion.text>

      <motion.g {...stage(active, 2.0)}>
        <CardSubLabel x={innerX} y={modernY - 24} text="MODERN · RMSNORM" color={accent} />
      </motion.g>

      {/* Modern pipeline — only 2 boxes */}
      <motion.g {...stage(active, 2.2)}>
        <MiniBox
          x={modernX0}
          y={modernY}
          w={opW}
          h={opH}
          label="÷ RMS"
          accent={accent}
        />
      </motion.g>
      <motion.g {...stage(active, 2.4)}>
        <Arrow x={modernX0 + opW + arrowGap / 2} y={modernY + opH / 2} accent={accent} />
      </motion.g>
      <motion.g {...stage(active, 2.6)}>
        <MiniBox
          x={modernX0 + opW + arrowGap}
          y={modernY}
          w={opW}
          h={opH}
          label="γ·x"
          accent={accent}
        />
      </motion.g>
      <motion.text
        x={innerX + innerW / 2}
        y={modernY + opH + 38}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
        {...stage(active, 2.85)}
      >
        scale only
      </motion.text>

      {/* Vector strip — cells stagger in left→right, then a sweep glow
          travels across once to suggest "this is the data flowing through". */}
      <motion.text
        x={innerX + 4}
        y={stripY - 10}
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        letterSpacing={1.4}
        {...stage(active, 3.1)}
      >
        VECTOR
      </motion.text>
      {Array.from({ length: cellCount }).map((_, j) => (
        <motion.rect
          key={j}
          x={innerX + 60 + j * (cellW + cellGap)}
          y={stripY}
          width={cellW}
          height={26}
          rx={3}
          ry={3}
          fill={`${accent}${(20 + j * 4).toString(16).padStart(2, '0')}`}
          stroke={accent}
          strokeOpacity={0.5}
          strokeWidth={0.8}
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: active ? 1 : 0.4, scaleY: 1 }}
          transition={{
            duration: 0.4,
            delay: active ? 3.2 + j * 0.04 : 0,
            ease: 'easeOut',
          }}
          style={{
            transformOrigin: `${innerX + 60 + j * (cellW + cellGap) + cellW / 2}px ${stripY + 13}px`,
          }}
        />
      ))}
      {/* Sweep glow across the strip — visual hint that the modern pipeline
          processes the same vector in fewer steps. */}
      {active && (
        <motion.rect
          y={stripY - 1}
          width={cellW * 0.7}
          height={28}
          rx={2}
          fill={accent}
          fillOpacity={0.6}
          initial={{ x: innerX + 60 - cellW, opacity: 0 }}
          animate={{
            x: [
              innerX + 60 - cellW,
              innerX + 60 + cellCount * (cellW + cellGap),
            ],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 1.4,
            delay: 4.0,
            ease: 'easeInOut',
            times: [0, 0.15, 0.85, 1],
            repeat: Infinity,
            repeatDelay: 2.4,
          }}
        />
      )}
      <motion.text
        x={innerX + innerW / 2}
        y={stripY + 56}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
        {...stage(active, 3.7)}
      >
        ~30% fewer ops, same stability
      </motion.text>
    </g>
  )
}

/* ─────────── SwiGLU card ─────────── */
function SwiGLUCardBody({ active }: { active: boolean }) {
  const x0 = modCardX(1)
  const padX = 22
  const innerX = x0 + padX
  const innerW = MOD_CARD_W - 2 * padX
  const accent = ACCENT.amber

  // Classic: input → [W·x] → [σ] → output (single stream)
  const classicY = MOD_CARD_Y + 110
  const opW = 70
  const opH = 38

  // Modern: two streams — top [Wx + Swish], bottom [Vx], merged via ⊙ gate
  const modernY = MOD_CARD_Y + 310

  // Pre-compute coords for the modern two-stream layout so we can
  // animate splitter lines, stream boxes, gate, and output in sequence.
  const xBoxX = innerX + 10
  const xBoxY = modernY + 60
  const topStreamX = innerX + 130
  const topStreamY = modernY + 18
  const botStreamY = modernY + 102
  const streamW = opW + 16
  const gx = innerX + 270
  const gy = modernY + 60 + opH / 2 - 2
  const dArrowX = innerX + innerW / 2

  return (
    <g>
      <motion.g {...stage(active, 0.0)}>
        <CardSubLabel x={innerX} y={MOD_CARD_Y + 86} text="CLASSIC · GELU / RELU" color="rgba(255,255,255,0.65)" />
      </motion.g>

      {/* Classic single-stream pipeline — each box pops in left→right */}
      <motion.g {...stage(active, 0.18)}>
        <MiniBox x={innerX + 10} y={classicY} w={opW} h={opH} label="x" accent={accent} faded />
      </motion.g>
      <motion.g {...stage(active, 0.30)}>
        <Arrow x={innerX + 10 + opW + 12} y={classicY + opH / 2} accent={accent} />
      </motion.g>
      <motion.g {...stage(active, 0.42)}>
        <MiniBox x={innerX + 10 + opW + 24} y={classicY} w={opW} h={opH} label="W·x" accent={accent} faded />
      </motion.g>
      <motion.g {...stage(active, 0.54)}>
        <Arrow x={innerX + 10 + 2 * (opW + 12) + 12} y={classicY + opH / 2} accent={accent} />
      </motion.g>
      <motion.g {...stage(active, 0.66)}>
        <MiniBox x={innerX + 10 + 2 * (opW + 24)} y={classicY} w={opW} h={opH} label="σ" accent={accent} faded />
      </motion.g>
      <motion.g {...stage(active, 0.78)}>
        <Arrow x={innerX + 10 + 3 * (opW + 12) + 12 + 12} y={classicY + opH / 2} accent={accent} />
      </motion.g>
      <motion.g {...stage(active, 0.90)}>
        <MiniBox x={innerX + 10 + 3 * (opW + 24)} y={classicY} w={opW + 4} h={opH} label="out" accent={accent} faded />
      </motion.g>
      <motion.text
        x={innerX + innerW / 2}
        y={classicY + opH + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
        {...stage(active, 1.05)}
      >
        one stream, smooth activation
      </motion.text>

      {/* Vertical drop arrow — line draws then arrowhead pops */}
      <motion.line
        x1={dArrowX}
        y1={classicY + opH + 50}
        x2={dArrowX}
        y2={modernY - 20}
        stroke={ACCENT.mint}
        strokeOpacity={0.85}
        strokeWidth={1.6}
        strokeDasharray="3 5"
        {...stagePath(active, 1.3, 0.6)}
      />
      <motion.polygon
        points={`${dArrowX},${modernY - 12} ${dArrowX - 6},${modernY - 22} ${dArrowX + 6},${modernY - 22}`}
        fill={ACCENT.mint}
        fillOpacity={0.95}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: active ? 1 : 0.3, scale: active ? 1 : 0.7 }}
        transition={{ duration: 0.3, delay: active ? 1.85 : 0, ease: 'easeOut' }}
        style={{ transformOrigin: `${dArrowX}px ${modernY - 17}px` }}
      />
      <motion.text
        x={dArrowX + 14}
        y={(classicY + opH + modernY) / 2}
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.4}
        {...stage(active, 1.7)}
      >
        add a gate
      </motion.text>

      <motion.g {...stage(active, 2.0)}>
        <CardSubLabel x={innerX} y={modernY - 24} text="MODERN · SWIGLU" color={accent} />
      </motion.g>

      {/* Modern two-stream gated FFN */}
      {/* Input box appears first */}
      <motion.g {...stage(active, 2.18)}>
        <MiniBox x={xBoxX} y={xBoxY} w={opW} h={opH} label="x" accent={accent} />
      </motion.g>
      {/* Splitter lines from x to top + bottom streams (draw via pathLength) */}
      <motion.line
        x1={xBoxX + opW}
        y1={xBoxY + opH / 2}
        x2={topStreamX}
        y2={topStreamY + opH / 2}
        stroke={accent}
        strokeOpacity={0.85}
        strokeWidth={1.4}
        {...stagePath(active, 2.32, 0.45)}
      />
      <motion.line
        x1={xBoxX + opW}
        y1={xBoxY + opH / 2}
        x2={topStreamX}
        y2={botStreamY + opH / 2}
        stroke={accent}
        strokeOpacity={0.85}
        strokeWidth={1.4}
        {...stagePath(active, 2.32, 0.45)}
      />
      {/* Stream labels */}
      <motion.text
        x={topStreamX - 28}
        y={modernY + 14}
        fill="rgba(255,255,255,0.65)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={9}
        letterSpacing={1.2}
        {...stage(active, 2.52)}
      >
        GATE
      </motion.text>
      <motion.text
        x={topStreamX - 30}
        y={modernY + 152}
        fill="rgba(255,255,255,0.65)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={9}
        letterSpacing={1.2}
        {...stage(active, 2.52)}
      >
        VALUE
      </motion.text>
      {/* Top stream: W₁ + Swish */}
      <motion.g {...stage(active, 2.62)}>
        <MiniBox x={topStreamX} y={topStreamY} w={streamW} h={opH} label="W₁·x  Swish" accent={accent} />
      </motion.g>
      {/* Bottom stream: V */}
      <motion.g {...stage(active, 2.76)}>
        <MiniBox x={topStreamX} y={botStreamY} w={streamW} h={opH} label="V·x" accent={accent} />
      </motion.g>
      {/* Gate connector lines (both streams converge into ⊙) */}
      <motion.line
        x1={topStreamX + streamW}
        y1={topStreamY + opH / 2}
        x2={gx - 14}
        y2={gy}
        stroke={accent}
        strokeOpacity={0.95}
        strokeWidth={1.6}
        {...stagePath(active, 2.95, 0.45)}
      />
      <motion.line
        x1={topStreamX + streamW}
        y1={botStreamY + opH / 2}
        x2={gx - 14}
        y2={gy}
        stroke={accent}
        strokeOpacity={0.95}
        strokeWidth={1.6}
        {...stagePath(active, 2.95, 0.45)}
      />
      {/* ⊙ Multiply gate — circle pops, then × inside fades in */}
      <motion.circle
        cx={gx}
        cy={gy}
        r={16}
        fill="rgba(245,158,11,0.18)"
        stroke={accent}
        strokeWidth={1.6}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          active
            ? { opacity: 1, scale: [0.5, 1.18, 1] }
            : { opacity: 0.4, scale: 0.85 }
        }
        transition={{
          duration: 0.55,
          delay: active ? 3.25 : 0,
          ease: 'easeOut',
        }}
        style={{ transformOrigin: `${gx}px ${gy}px` }}
      />
      <motion.line
        x1={gx - 7}
        y1={gy - 7}
        x2={gx + 7}
        y2={gy + 7}
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
        {...stagePath(active, 3.55, 0.3)}
      />
      <motion.line
        x1={gx - 7}
        y1={gy + 7}
        x2={gx + 7}
        y2={gy - 7}
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
        {...stagePath(active, 3.55, 0.3)}
      />
      <motion.text
        x={gx + 28}
        y={gy - 22}
        fill={accent}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.2}
        {...stage(active, 3.55)}
      >
        ⊙
      </motion.text>
      {/* Output line + box */}
      <motion.line
        x1={gx + 16}
        y1={gy}
        x2={gx + 50}
        y2={gy}
        stroke={accent}
        strokeOpacity={0.95}
        strokeWidth={1.6}
        {...stagePath(active, 3.7, 0.3)}
      />
      <motion.g {...stage(active, 3.82)}>
        <MiniBox x={gx + 50} y={gy - opH / 2} w={opW} h={opH} label="out" accent={accent} />
      </motion.g>

      <motion.text
        x={innerX + innerW / 2}
        y={modernY + 200}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
        {...stage(active, 4.0)}
      >
        gate selects which features to keep
      </motion.text>

      <motion.text
        x={innerX + innerW / 2}
        y={MOD_CARD_Y + MOD_CARD_H - 110}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
        {...stage(active, 4.2)}
      >
        ~2% better loss, ~50% more params
      </motion.text>
    </g>
  )
}

/* ─────────── GQA card ─────────── */
function GQACardBody({ active }: { active: boolean }) {
  const x0 = modCardX(2)
  const padX = 22
  const innerX = x0 + padX
  const innerW = MOD_CARD_W - 2 * padX
  const accentQ = ACCENT.amber
  const accentKV = ACCENT.blue
  const Q_HEADS = 8

  const classicY = MOD_CARD_Y + 110
  const modernY = MOD_CARD_Y + 360

  // Q dot row geometry — same in both halves
  const qDotR = 10
  const qSpacing = (innerW - 40) / Q_HEADS
  const qRowX0 = innerX + 20 + qSpacing / 2

  // KV box geometry
  const kvW = 38
  const kvH = 30

  const dArrowX = innerX + innerW / 2

  // Animated connector helper — line draws via pathLength when card is active.
  function ConnLine({
    qIdx,
    kvCenterX,
    qY,
    kvY,
    color,
    opacity,
    delay,
  }: {
    qIdx: number
    kvCenterX: number
    qY: number
    kvY: number
    color: string
    opacity: number
    delay: number
  }) {
    const qX = qRowX0 + qIdx * qSpacing
    return (
      <motion.line
        x1={qX}
        y1={qY + qDotR}
        x2={kvCenterX}
        y2={kvY}
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1.1}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: active ? 1 : 0,
          opacity: active ? opacity : 0,
        }}
        transition={{
          duration: 0.4,
          delay: active ? delay : 0,
          ease: 'easeOut',
        }}
      />
    )
  }

  return (
    <g>
      {/* CLASSIC: 8 Q dots, each owns its own K/V pair */}
      <motion.g {...stage(active, 0.0)}>
        <CardSubLabel x={innerX} y={MOD_CARD_Y + 86} text="CLASSIC · MHA" color="rgba(255,255,255,0.65)" />
      </motion.g>

      {/* Q dots cascade in left→right (8 dots over ~0.4 s) */}
      {Array.from({ length: Q_HEADS }).map((_, i) => (
        <motion.g
          key={`cq${i}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: active ? 1 : 0.4,
            scale: active ? 1 : 0.85,
          }}
          transition={{
            duration: 0.32,
            delay: active ? 0.15 + i * 0.05 : 0,
            ease: 'easeOut',
          }}
          style={{
            transformOrigin: `${qRowX0 + i * qSpacing}px ${classicY}px`,
          }}
        >
          <circle
            cx={qRowX0 + i * qSpacing}
            cy={classicY}
            r={qDotR}
            fill={`${accentQ}33`}
            stroke={accentQ}
            strokeWidth={1.2}
          />
          <text
            x={qRowX0 + i * qSpacing}
            y={classicY + 4}
            textAnchor="middle"
            fill={accentQ}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize={9}
            fontWeight={600}
          >
            Q
          </text>
        </motion.g>
      ))}
      {/* K/V boxes — one per Q. Connector line draws first, then KV box drops in */}
      {Array.from({ length: Q_HEADS }).map((_, i) => {
        const cx = qRowX0 + i * qSpacing
        const kvY = classicY + 50
        return (
          <g key={`ckv${i}`}>
            <ConnLine
              qIdx={i}
              kvCenterX={cx}
              qY={classicY}
              kvY={kvY}
              color={accentKV}
              opacity={0.55}
              delay={0.55 + i * 0.05}
            />
            <motion.g
              initial={{ opacity: 0, y: -8 }}
              animate={{
                opacity: active ? 1 : 0.4,
                y: 0,
              }}
              transition={{
                duration: 0.32,
                delay: active ? 0.7 + i * 0.05 : 0,
                ease: 'easeOut',
              }}
            >
              <rect
                x={cx - kvW / 2}
                y={kvY}
                width={kvW}
                height={kvH}
                rx={3}
                ry={3}
                fill={`${accentKV}22`}
                stroke={accentKV}
                strokeOpacity={0.75}
                strokeWidth={1}
              />
              <text
                x={cx}
                y={kvY + kvH / 2 + 4}
                textAnchor="middle"
                fill={accentKV}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={9}
                fontWeight={600}
              >
                KV
              </text>
            </motion.g>
          </g>
        )
      })}
      <motion.text
        x={innerX + innerW / 2}
        y={classicY + 110}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={11}
        fontStyle="italic"
        {...stage(active, 1.25)}
      >
        8 Q · 8 K · 8 V (16 KV tensors)
      </motion.text>

      {/* Drop arrow — line draws via pathLength then arrowhead pops */}
      <motion.line
        x1={dArrowX}
        y1={classicY + 130}
        x2={dArrowX}
        y2={modernY - 60}
        stroke={ACCENT.mint}
        strokeOpacity={0.85}
        strokeWidth={1.6}
        strokeDasharray="3 5"
        {...stagePath(active, 1.5, 0.6)}
      />
      <motion.polygon
        points={`${dArrowX},${modernY - 52} ${dArrowX - 6},${modernY - 62} ${dArrowX + 6},${modernY - 62}`}
        fill={ACCENT.mint}
        fillOpacity={0.95}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: active ? 1 : 0.3, scale: active ? 1 : 0.7 }}
        transition={{ duration: 0.3, delay: active ? 2.05 : 0, ease: 'easeOut' }}
        style={{ transformOrigin: `${dArrowX}px ${modernY - 57}px` }}
      />
      <motion.text
        x={dArrowX + 14}
        y={(classicY + 130 + modernY - 60) / 2}
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.4}
        {...stage(active, 1.9)}
      >
        share K/V
      </motion.text>

      {/* MODERN: 8 Q dots, but only 2 K/V groups */}
      <motion.g {...stage(active, 2.2)}>
        <CardSubLabel x={innerX} y={modernY - 28} text="MODERN · GQA" color={accentQ} />
      </motion.g>

      {/* Q dots cascade in (modern) */}
      {Array.from({ length: Q_HEADS }).map((_, i) => (
        <motion.g
          key={`mq${i}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: active ? 1 : 0.4,
            scale: active ? 1 : 0.85,
          }}
          transition={{
            duration: 0.32,
            delay: active ? 2.32 + i * 0.04 : 0,
            ease: 'easeOut',
          }}
          style={{
            transformOrigin: `${qRowX0 + i * qSpacing}px ${modernY}px`,
          }}
        >
          <circle
            cx={qRowX0 + i * qSpacing}
            cy={modernY}
            r={qDotR}
            fill={`${accentQ}33`}
            stroke={accentQ}
            strokeWidth={1.2}
          />
          <text
            x={qRowX0 + i * qSpacing}
            y={modernY + 4}
            textAnchor="middle"
            fill={accentQ}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize={9}
            fontWeight={600}
          >
            Q
          </text>
        </motion.g>
      ))}

      {/* 2 K/V groups, centered under groups of 4 Q heads */}
      {(() => {
        const groups = [
          { idxs: [0, 1, 2, 3] },
          { idxs: [4, 5, 6, 7] },
        ]
        const kvY = modernY + 80
        return groups.map((g, gi) => {
          const cxAvg =
            g.idxs.reduce((acc, i) => acc + (qRowX0 + i * qSpacing), 0) / g.idxs.length
          const kvBoxW = 60
          const kvBoxH = 36
          return (
            <g key={`mkvg${gi}`}>
              {g.idxs.map((qi) => (
                <ConnLine
                  key={`mc-${qi}`}
                  qIdx={qi}
                  kvCenterX={cxAvg}
                  qY={modernY}
                  kvY={kvY}
                  color={accentKV}
                  opacity={0.7}
                  delay={2.85 + gi * 0.4 + (qi % 4) * 0.04}
                />
              ))}
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: active ? 1 : 0.4,
                  scale: active ? 1 : 0.85,
                }}
                transition={{
                  duration: 0.45,
                  delay: active ? 3.15 + gi * 0.18 : 0,
                  ease: 'easeOut',
                }}
                style={{
                  transformOrigin: `${cxAvg}px ${kvY + kvBoxH / 2}px`,
                }}
              >
                <rect
                  x={cxAvg - kvBoxW / 2}
                  y={kvY}
                  width={kvBoxW}
                  height={kvBoxH}
                  rx={4}
                  ry={4}
                  fill={`${accentKV}33`}
                  stroke={accentKV}
                  strokeOpacity={0.9}
                  strokeWidth={1.4}
                />
                <text
                  x={cxAvg}
                  y={kvY + kvBoxH / 2 + 4}
                  textAnchor="middle"
                  fill={accentKV}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize={11}
                  fontWeight={600}
                >
                  KV
                </text>
              </motion.g>
            </g>
          )
        })
      })()}

      <motion.text
        x={innerX + innerW / 2}
        y={modernY + 145}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={11}
        fontStyle="italic"
        {...stage(active, 3.7)}
      >
        8 Q · 2 K · 2 V (4 KV tensors · 4× smaller cache)
      </motion.text>
    </g>
  )
}

/* ─────────── ✓ RoPE pill (top) ─────────── */
function RopeDonePill() {
  const w = 220
  const h = 32
  const x = MOD_VB_W / 2 - w / 2
  const y = 70
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2}
        ry={h / 2}
        fill="rgba(236,72,153,0.10)"
        stroke={ACCENT.pink}
        strokeOpacity={0.55}
        strokeWidth={1}
      />
      {/* Check mark */}
      <g transform={`translate(${x + 18}, ${y + h / 2})`}>
        <circle r={9} fill="rgba(236,72,153,0.18)" stroke={ACCENT.pink} strokeWidth={1.2} />
        <path d="M -4 0 L -1 3 L 4 -3" fill="none" stroke={ACCENT.pink} strokeWidth={1.6} strokeLinecap="round" />
      </g>
      <text
        x={x + w / 2 + 10}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill={ACCENT.pink}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={1.6}
      >
        RoPE — handled in Scene 31
      </text>
    </g>
  )
}

/* ─────────── The viz ─────────── */
export function VizModern({ phase }: { phase: number }) {
  return (
    <svg
      viewBox={`0 0 ${MOD_VB_W} ${MOD_VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      {/* Title strip */}
      <text
        x={MOD_VB_W / 2}
        y={36}
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={16}
        letterSpacing={3.4}
      >
        THREE MORE SURGICAL UPGRADES
      </text>

      <RopeDonePill />

      {/* Three cards */}
      <ModCard
        i={0}
        active={phase === 0}
        accent={ACCENT.blue}
        title="LAYERNORM → RMSNORM"
        badge="scale only"
      >
        <RMSNormCardBody active={phase === 0} />
      </ModCard>
      <ModCard
        i={1}
        active={phase === 1}
        accent={ACCENT.amber}
        title="GELU → SWIGLU"
        badge="gated FFN"
      >
        <SwiGLUCardBody active={phase === 1} />
      </ModCard>
      <ModCard
        i={2}
        active={phase === 2}
        accent={ACCENT.mint}
        title="MHA → GQA"
        badge="shared K/V"
      >
        <GQACardBody active={phase === 2} />
      </ModCard>

      {/* Footer */}
      <text
        x={MOD_VB_W / 2}
        y={MOD_VB_H - 24}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={3.2}
        opacity={0.85}
      >
        SAME SKELETON · SMALLER · FASTER · MORE STABLE
      </text>
    </svg>
  )
}

/* ─────────── Split-pane wrapper ─────────── */
export function ModernSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const PHASE_DURATIONS_MS = [9000, 9000, 9000] as const
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setTimeout(
      () => setPhase((p) => (p + 1) % PHASES),
      PHASE_DURATIONS_MS[phase] / speed,
    )
    return () => clearTimeout(id)
  }, [phase, speed])

  const phaseAccent = [ACCENT.blue, ACCENT.amber, ACCENT.mint][phase]
  const phaseLabels = ['RMSNorm', 'SwiGLU', 'GQA']

  // Per-phase right-pane copy: Classic / Modern / Why it matters.
  const subtitleByPhase: ReactNode[] = [
    <>
      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Classic:</strong>{' '}
      LayerNorm centers <em>and</em> scales — subtract mean, divide by std,
      rescale, shift.
      <br />
      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Modern:</strong>{' '}
      RMSNorm <em>scales only</em> — divide by the vector&apos;s RMS, then
      rescale.
      <br />
      <strong style={{ color: ACCENT.mint }}>Why it matters:</strong> ~30%
      fewer ops per norm, similar stability.
    </>,
    <>
      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Classic:</strong> the
      FFN passes its hidden vector through one smooth activation (GELU/ReLU).
      <br />
      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Modern:</strong>{' '}
      SwiGLU splits the hidden vector into a <em>value</em> stream and a{' '}
      <em>gate</em> stream, then multiplies them element-wise.
      <br />
      <strong style={{ color: ACCENT.mint }}>Why it matters:</strong> the gate
      lets the network choose which features to keep — better feature
      selection per param.
    </>,
    <>
      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Classic:</strong>{' '}
      every Q head has its own K and V — N heads × 2 = 2N tensors per layer.
      <br />
      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Modern:</strong>{' '}
      groups of Q heads <em>share</em> a single K/V pair — N Q heads, only G
      groups of K/V.
      <br />
      <strong style={{ color: ACCENT.mint }}>Why it matters:</strong> the KV
      cache shrinks by N/G× — most of long-context inference cost lives there.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'RMSNorm assumes the mean is already roughly zero (residual streams stay centered in practice). Dropping the mean-subtract step removes a bandwidth-bound reduction, which is why it speeds up training without hurting quality.',
    'A common shape: hidden_dim → 4·hidden_dim through the gate path AND the value path, then ⊙, then back down. That is why SwiGLU FFNs use ~50% more params than a plain GELU FFN at the same hidden_dim — but the loss-per-param wins.',
    'Used by LLaMA-2 (8 Q : 1 KV), LLaMA-3, Mistral, Gemini, Qwen. Inference latency is dominated by reading the KV cache from HBM; shrinking it 4–8× makes long-context decoding much faster.',
  ]

  return (
    <SplitPaneScene
      viz={<VizModern phase={phase} />}
      text={{
        kicker: 'ACT V · MODERN · RECAP',
        title: 'Three more surgical upgrades.',
        subtitle: subtitleByPhase[phase],
        accent: phaseAccent,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={phaseAccent}
          />
        ),
        stats: [
          { label: 'card', value: `${phase + 1} / 3`, color: phaseAccent },
          { label: 'upgrade', value: phaseLabels[phase], color: phaseAccent },
          { label: 'rope', value: '✓ done in 31', color: ACCENT.pink },
        ],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}
