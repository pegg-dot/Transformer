'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
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
        <rect
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
        />
      ))}

      {/* + */}
      <text
        x={(ADD_X0 + ADD_X1) / 2}
        y={plusY + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={28}
      >
        +
      </text>

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
        <rect
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
          <rect
            key={`s${i}`}
            x={rowX0 + i * (cellW + gap)}
            y={sumY}
            width={cellW}
            height={42}
            rx={4}
            ry={4}
            fill={fill}
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

  return (
    <g style={{ opacity: active ? 1 : 0.35 }}>
      {/* Outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
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

      {/* Relative angle arc (optional) */}
      {showRelArc && (
        <>
          <path
            d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 ${sweep} ${arcEndX} ${arcEndY}`}
            fill="none"
            stroke={ACCENT.mint}
            strokeWidth={2}
            strokeOpacity={0.85}
          />
          <text
            x={cx}
            y={cy + 6}
            textAnchor="middle"
            fill={ACCENT.mint}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize={14}
            fontWeight={600}
          >
            Δ = {kPos - qPos}
          </text>
        </>
      )}

      {/* Q vector (amber) */}
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

      {/* K vector (blue) */}
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

      {/* Q / K / V tags */}
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
      RoPE replaces the addition with a <em>rotation</em>. Inside the
      attention block, every Q and K vector is rotated by an angle proportional
      to its position. V is untouched.
    </>,
    <>
      Because both Q at position <em>i</em> and K at position <em>j</em> get
      rotated, the dot product <em>q · k</em> depends only on the{' '}
      <em>relative offset (j − i)</em>. Position falls out of attention for
      free.
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
      <rect
        x={x}
        y={MOD_CARD_Y}
        width={MOD_CARD_W}
        height={MOD_CARD_H}
        rx={MOD_CARD_R}
        ry={MOD_CARD_R}
        fill="rgba(255,255,255,0.04)"
        stroke={accent}
        strokeOpacity={active ? 0.85 : 0.4}
        strokeWidth={active ? 1.8 : 1.2}
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

      {/* Highlight badge — bottom of card */}
      <g>
        <rect
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
        <line
          x1={x + 6}
          y1={y + h / 2}
          x2={x + w - 6}
          y2={y + h / 2}
          stroke="#f87171"
          strokeWidth={2}
          strokeOpacity={0.85}
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

  return (
    <g>
      <CardSubLabel x={innerX} y={MOD_CARD_Y + 86} text="CLASSIC · LAYERNORM" color="rgba(255,255,255,0.65)" />

      {/* Classic pipeline: subtract μ → ÷ σ → γ·x+β */}
      <MiniBox
        x={classicX0}
        y={classicY}
        w={opW}
        h={opH}
        label="− μ"
        accent={accent}
        strikethrough={active}
      />
      <Arrow x={classicX0 + opW + arrowGap / 2} y={classicY + opH / 2} accent={accent} />
      <MiniBox
        x={classicX0 + opW + arrowGap}
        y={classicY}
        w={opW}
        h={opH}
        label="÷ σ"
        accent={accent}
      />
      <Arrow x={classicX0 + 2 * (opW + arrowGap) - arrowGap / 2} y={classicY + opH / 2} accent={accent} />
      <MiniBox
        x={classicX0 + 2 * (opW + arrowGap)}
        y={classicY}
        w={opW}
        h={opH}
        label="γ·x + β"
        accent={accent}
      />
      <text
        x={innerX + innerW / 2}
        y={classicY + opH + 38}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
      >
        center first, then scale
      </text>

      {/* Vertical drop arrow */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <line
          x1={innerX + innerW / 2}
          y1={classicY + opH + 60}
          x2={innerX + innerW / 2}
          y2={modernY - 20}
          stroke={ACCENT.mint}
          strokeOpacity={0.7}
          strokeWidth={1.6}
          strokeDasharray="3 5"
        />
        <polygon
          points={`${innerX + innerW / 2},${modernY - 12} ${innerX + innerW / 2 - 6},${modernY - 22} ${innerX + innerW / 2 + 6},${modernY - 22}`}
          fill={ACCENT.mint}
          fillOpacity={0.85}
        />
        <text
          x={innerX + innerW / 2 + 14}
          y={(classicY + opH + modernY) / 2}
          fill={ACCENT.mint}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={11}
          letterSpacing={1.4}
        >
          drop − μ
        </text>
      </motion.g>

      <CardSubLabel x={innerX} y={modernY - 24} text="MODERN · RMSNORM" color={accent} />

      {/* Modern pipeline */}
      <MiniBox
        x={modernX0}
        y={modernY}
        w={opW}
        h={opH}
        label="÷ RMS"
        accent={accent}
      />
      <Arrow x={modernX0 + opW + arrowGap / 2} y={modernY + opH / 2} accent={accent} />
      <MiniBox
        x={modernX0 + opW + arrowGap}
        y={modernY}
        w={opW}
        h={opH}
        label="γ·x"
        accent={accent}
      />
      <text
        x={innerX + innerW / 2}
        y={modernY + opH + 38}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
      >
        scale only
      </text>

      {/* Vector strip — same input vector, before vs after */}
      <text x={innerX + 4} y={stripY - 10} fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize={10} letterSpacing={1.4}>VECTOR</text>
      {Array.from({ length: cellCount }).map((_, j) => (
        <rect
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
        />
      ))}
      <text
        x={innerX + innerW / 2}
        y={stripY + 56}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
      >
        ~30% fewer ops, same stability
      </text>
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

  return (
    <g>
      <CardSubLabel x={innerX} y={MOD_CARD_Y + 86} text="CLASSIC · GELU / RELU" color="rgba(255,255,255,0.65)" />

      {/* Classic single-stream pipeline */}
      <g>
        <MiniBox x={innerX + 10} y={classicY} w={opW} h={opH} label="x" accent={accent} faded />
        <Arrow x={innerX + 10 + opW + 12} y={classicY + opH / 2} accent={accent} />
        <MiniBox x={innerX + 10 + opW + 24} y={classicY} w={opW} h={opH} label="W·x" accent={accent} faded />
        <Arrow x={innerX + 10 + 2 * (opW + 12) + 12} y={classicY + opH / 2} accent={accent} />
        <MiniBox x={innerX + 10 + 2 * (opW + 24)} y={classicY} w={opW} h={opH} label="σ" accent={accent} faded />
        <Arrow x={innerX + 10 + 3 * (opW + 12) + 12 + 12} y={classicY + opH / 2} accent={accent} />
        <MiniBox x={innerX + 10 + 3 * (opW + 24)} y={classicY} w={opW + 4} h={opH} label="out" accent={accent} faded />
      </g>
      <text
        x={innerX + innerW / 2}
        y={classicY + opH + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
      >
        one stream, smooth activation
      </text>

      {/* Vertical drop arrow */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <line
          x1={innerX + innerW / 2}
          y1={classicY + opH + 50}
          x2={innerX + innerW / 2}
          y2={modernY - 20}
          stroke={ACCENT.mint}
          strokeOpacity={0.7}
          strokeWidth={1.6}
          strokeDasharray="3 5"
        />
        <polygon
          points={`${innerX + innerW / 2},${modernY - 12} ${innerX + innerW / 2 - 6},${modernY - 22} ${innerX + innerW / 2 + 6},${modernY - 22}`}
          fill={ACCENT.mint}
          fillOpacity={0.85}
        />
        <text
          x={innerX + innerW / 2 + 14}
          y={(classicY + opH + modernY) / 2}
          fill={ACCENT.mint}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={11}
          letterSpacing={1.4}
        >
          add a gate
        </text>
      </motion.g>

      <CardSubLabel x={innerX} y={modernY - 24} text="MODERN · SWIGLU" color={accent} />

      {/* Modern two-stream gated FFN */}
      {/* Input box */}
      <MiniBox x={innerX + 10} y={modernY + 60} w={opW} h={opH} label="x" accent={accent} />
      {/* Top stream: W₁ + Swish */}
      <MiniBox x={innerX + 130} y={modernY + 18} w={opW + 16} h={opH} label="W₁·x  Swish" accent={accent} />
      {/* Bottom stream: V */}
      <MiniBox x={innerX + 130} y={modernY + 102} w={opW + 16} h={opH} label="V·x" accent={accent} />
      {/* Splitter lines from x to streams */}
      <line x1={innerX + 10 + opW} y1={modernY + 60 + opH / 2} x2={innerX + 130} y2={modernY + 18 + opH / 2} stroke={accent} strokeOpacity={0.7} strokeWidth={1.3} />
      <line x1={innerX + 10 + opW} y1={modernY + 60 + opH / 2} x2={innerX + 130} y2={modernY + 102 + opH / 2} stroke={accent} strokeOpacity={0.7} strokeWidth={1.3} />
      {/* Stream labels */}
      <text x={innerX + 130 - 28} y={modernY + 14} fill="rgba(255,255,255,0.55)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize={9} letterSpacing={1.2}>GATE</text>
      <text x={innerX + 130 - 30} y={modernY + 152} fill="rgba(255,255,255,0.55)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize={9} letterSpacing={1.2}>VALUE</text>

      {/* Multiply gate ⊙ */}
      {(() => {
        const gx = innerX + 270
        const gy = modernY + 60 + opH / 2 - 2
        return (
          <g>
            <line x1={innerX + 130 + opW + 16} y1={modernY + 18 + opH / 2} x2={gx - 14} y2={gy} stroke={accent} strokeOpacity={0.85} strokeWidth={1.5} />
            <line x1={innerX + 130 + opW + 16} y1={modernY + 102 + opH / 2} x2={gx - 14} y2={gy} stroke={accent} strokeOpacity={0.85} strokeWidth={1.5} />
            <circle cx={gx} cy={gy} r={16} fill="rgba(245,158,11,0.18)" stroke={accent} strokeWidth={1.6} />
            <line x1={gx - 7} y1={gy - 7} x2={gx + 7} y2={gy + 7} stroke={accent} strokeWidth={1.4} />
            <line x1={gx - 7} y1={gy + 7} x2={gx + 7} y2={gy - 7} stroke={accent} strokeWidth={1.4} />
            <text x={gx + 28} y={gy - 22} fill={accent} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize={11} letterSpacing={1.2}>⊙</text>
            {/* Output */}
            <line x1={gx + 16} y1={gy} x2={gx + 50} y2={gy} stroke={accent} strokeOpacity={0.85} strokeWidth={1.5} />
            <MiniBox x={gx + 50} y={gy - opH / 2} w={opW} h={opH} label="out" accent={accent} />
          </g>
        )
      })()}

      <text
        x={innerX + innerW / 2}
        y={modernY + 200}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fontStyle="italic"
      >
        gate selects which features to keep
      </text>

      <text
        x={innerX + innerW / 2}
        y={MOD_CARD_Y + MOD_CARD_H - 110}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
      >
        ~2% better loss, ~50% more params
      </text>
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

  // Helper to draw q→kv connector lines
  function drawConn(qIdx: number, kvCenterX: number, qY: number, kvY: number, color: string, opacity = 0.6) {
    const qX = qRowX0 + qIdx * qSpacing
    return (
      <line
        key={`l${qIdx}`}
        x1={qX}
        y1={qY + qDotR}
        x2={kvCenterX}
        y2={kvY}
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1}
      />
    )
  }

  return (
    <g>
      {/* CLASSIC: 8 Q dots, each owns its own K/V pair */}
      <CardSubLabel x={innerX} y={MOD_CARD_Y + 86} text="CLASSIC · MHA" color="rgba(255,255,255,0.65)" />

      {/* Q row */}
      {Array.from({ length: Q_HEADS }).map((_, i) => (
        <g key={`cq${i}`}>
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
        </g>
      ))}
      {/* K/V boxes — one per Q */}
      {Array.from({ length: Q_HEADS }).map((_, i) => {
        const cx = qRowX0 + i * qSpacing
        const kvY = classicY + 50
        return (
          <g key={`ckv${i}`}>
            {drawConn(i, cx, classicY, kvY, accentKV, 0.55)}
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
          </g>
        )
      })}
      <text
        x={innerX + innerW / 2}
        y={classicY + 110}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={11}
        fontStyle="italic"
      >
        8 Q · 8 K · 8 V (16 KV tensors)
      </text>

      {/* Drop arrow */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <line
          x1={innerX + innerW / 2}
          y1={classicY + 130}
          x2={innerX + innerW / 2}
          y2={modernY - 60}
          stroke={ACCENT.mint}
          strokeOpacity={0.7}
          strokeWidth={1.6}
          strokeDasharray="3 5"
        />
        <polygon
          points={`${innerX + innerW / 2},${modernY - 52} ${innerX + innerW / 2 - 6},${modernY - 62} ${innerX + innerW / 2 + 6},${modernY - 62}`}
          fill={ACCENT.mint}
          fillOpacity={0.85}
        />
        <text
          x={innerX + innerW / 2 + 14}
          y={(classicY + 130 + modernY - 60) / 2}
          fill={ACCENT.mint}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={11}
          letterSpacing={1.4}
        >
          share K/V
        </text>
      </motion.g>

      {/* MODERN: 8 Q dots, but only 2 K/V groups */}
      <CardSubLabel x={innerX} y={modernY - 28} text="MODERN · GQA" color={accentQ} />

      {/* Q row */}
      {Array.from({ length: Q_HEADS }).map((_, i) => (
        <g key={`mq${i}`}>
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
        </g>
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
              {g.idxs.map((qi) => drawConn(qi, cxAvg, modernY, kvY, accentKV, 0.7))}
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
            </g>
          )
        })
      })()}

      <text
        x={innerX + innerW / 2}
        y={modernY + 145}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={11}
        fontStyle="italic"
      >
        8 Q · 2 K · 2 V (4 KV tensors · 4× smaller cache)
      </text>
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
