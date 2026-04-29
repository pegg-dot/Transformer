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
const ACT4_KICKER = 'ACT IV · TRAINING'

/* =========================================================================
 * Scene 20 — act4-intro: "How the weights got there."
 *
 * Act IV opener. Two coordinated zones:
 *   LEFT  — a stylized weight matrix that morphs from CHAOS (random at
 *           initialization) into ORDER (structured, trained patterns).
 *   RIGHT — a big monotone-decreasing LOSS CURVE that draws left→right.
 *           A glowing dot rides the curve as it falls.
 *
 * As the curve drops, the weights settle. The two zones are linked by a
 * subtle dashed feedback arrow: "loss drives weight updates."
 *
 * Bottom strip: predict → loss → backprop → update — repeat. Each token
 * highlights in sync with the curve so the loop reads as a single sentence.
 * ====================================================================== */

const VB_W = 1400
const VB_H = 1000

// Layout zones
const WEIGHTS_X = 110
const WEIGHTS_Y = 200
const WEIGHTS_W = 460
const WEIGHTS_H = 540
const WEIGHTS_ROWS = 8
const WEIGHTS_COLS = 22

const CHART_X = 660
const CHART_Y = 200
const CHART_W = 640
const CHART_H = 540
const CHART_PAD_L = 60
const CHART_PAD_B = 50
const CHART_PAD_T = 40
const CHART_PAD_R = 30

// Loss curve sample points in CHART-LOCAL coords. y INCREASES downward in
// SVG, so to make the loss visually fall we go from small y (top-left,
// "high loss") to large y (bottom-right, "low loss"). Exponential decay
// shape: steep early, asymptote late.
const LOSS_PTS: Array<[number, number]> = (() => {
  const innerW = CHART_W - CHART_PAD_L - CHART_PAD_R
  const innerH = CHART_H - CHART_PAD_T - CHART_PAD_B
  const N = 40
  const yTop = CHART_PAD_T + 10
  const yBot = CHART_PAD_T + innerH - 8
  const out: Array<[number, number]> = []
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const x = CHART_PAD_L + t * innerW
    // Exponential decay from 1 → ~0.05 with a touch of micro-noise
    const decay = Math.exp(-3.2 * t)
    const noise = 0.012 * Math.sin(i * 1.7)
    const norm = Math.max(0, Math.min(1, decay + noise))
    const y = yTop + (1 - norm) * (yBot - yTop)
    out.push([x, y])
  }
  return out
})()

const LOSS_PATH = LOSS_PTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
const LOSS_AREA_PATH = `${LOSS_PATH} L ${LOSS_PTS[LOSS_PTS.length - 1][0].toFixed(1)} ${(CHART_PAD_T + CHART_H - CHART_PAD_T - CHART_PAD_B).toFixed(1)} L ${LOSS_PTS[0][0].toFixed(1)} ${(CHART_PAD_T + CHART_H - CHART_PAD_T - CHART_PAD_B).toFixed(1)} Z`

// Pipeline tokens at the bottom
const PIPELINE = ['predict', 'loss', 'backprop', 'update']

// Deterministic pseudo-random for stable cell colors across re-renders.
function prand(seed: number): number {
  const s = Math.sin(seed * 9301.3 + 49297.7) * 233280.0
  return s - Math.floor(s)
}

export function VizAct4Intro() {
  const speed = useSpeed()
  const PHASES = 3
  const phaseLabels = ['random at first', 'less wrong over time', 'trained']
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      4500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Curve "draw progress" — locked to phase, but Framer animates the
  // pathLength smoothly between targets.
  const curveProgress = phase === 0 ? 0.04 : phase === 1 ? 0.6 : 1.0
  // Weights "training progress" — chaos at 0, order at 1.
  const trained = phase === 0 ? 0 : phase === 1 ? 0.55 : 1.0

  // Pipeline highlight cycles every ~1.6s through the four tokens.
  const [pipelineIdx, setPipelineIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPipelineIdx((i) => (i + 1) % PIPELINE.length),
      1500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="act4-loss-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT.amber} stopOpacity="0.32" />
          <stop offset="100%" stopColor={ACCENT.amber} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="act4-trained-band" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={ACCENT.cyan} stopOpacity="0.85" />
          <stop offset="50%" stopColor={ACCENT.violet} stopOpacity="0.85" />
          <stop offset="100%" stopColor={ACCENT.amber} stopOpacity="0.85" />
        </linearGradient>
        <filter id="act4-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== LEFT ZONE — WEIGHTS ===================== */}
      <g transform={`translate(${WEIGHTS_X}, ${WEIGHTS_Y})`}>
        <text
          x={0}
          y={-30}
          fontFamily="var(--font-mono)"
          fontSize="13"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          MODEL WEIGHTS
        </text>
        <text
          x={0}
          y={-12}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="22"
          fill="rgba(255,255,255,0.85)"
        >
          {phase === 0 ? 'random at first' : phase === 1 ? 'settling…' : 'trained'}
        </text>

        {/* Frame */}
        <rect
          x={-8}
          y={-2}
          width={WEIGHTS_W + 16}
          height={WEIGHTS_H + 16}
          rx={10}
          fill="rgba(255,255,255,0.02)"
          stroke={ACCENT.rule}
          strokeWidth={1}
        />

        {/* Weight cells — two layered passes, crossfaded by `trained`. */}
        {Array.from({ length: WEIGHTS_ROWS }, (_, r) => {
          const cellW = WEIGHTS_W / WEIGHTS_COLS
          const cellH = WEIGHTS_H / WEIGHTS_ROWS
          return (
            <g key={`row-${r}`}>
              {Array.from({ length: WEIGHTS_COLS }, (_, c) => {
                const seed = r * 31 + c * 7 + 1
                // Chaotic look: random hue + random alpha
                const chaosHue = Math.floor(prand(seed) * 360)
                const chaosAlpha = 0.18 + prand(seed + 11) * 0.55
                // Ordered look: smooth horizontal bands tinted toward amber
                // with a clean column gradient.
                const orderHue = 30 + (r / WEIGHTS_ROWS) * 35 // amber-ish band
                const orderL = 50 + Math.sin((c / WEIGHTS_COLS) * Math.PI * 2 + r * 0.4) * 10
                const orderAlpha = 0.55 + 0.35 * Math.cos((c / WEIGHTS_COLS) * Math.PI * 2 - r * 0.5)
                const x = c * cellW + 1
                const y = r * cellH + 1
                const w = cellW - 2
                const h = cellH - 2
                return (
                  <g key={`cell-${r}-${c}`}>
                    {/* Chaotic layer */}
                    <motion.rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx={2}
                      fill={`hsl(${chaosHue}, 60%, 55%)`}
                      initial={{ opacity: chaosAlpha }}
                      animate={{ opacity: chaosAlpha * (1 - trained) }}
                      transition={{ duration: 1.4 / speed, ease: 'easeInOut' }}
                    />
                    {/* Ordered layer */}
                    <motion.rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx={2}
                      fill={`hsl(${orderHue}, 70%, ${orderL}%)`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: Math.max(0, orderAlpha * trained) }}
                      transition={{ duration: 1.4 / speed, ease: 'easeInOut' }}
                    />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* "trained" gradient sash that crosses the weights when fully trained */}
        <motion.rect
          x={0}
          y={WEIGHTS_H / 2 - 2}
          width={WEIGHTS_W}
          height={4}
          fill="url(#act4-trained-band)"
          initial={{ opacity: 0 }}
          animate={{ opacity: trained > 0.95 ? 0.7 : 0 }}
          transition={{ duration: 1.0 / speed }}
        />
      </g>

      {/* ===================== FEEDBACK ARROW ===================== */}
      {/* Dashed arrow from chart back to weights, labeled "updates". */}
      <g>
        <motion.path
          d={`M ${CHART_X + CHART_PAD_L + 20} ${CHART_Y + CHART_H - CHART_PAD_B + 30}
              C ${CHART_X - 60} ${CHART_Y + CHART_H + 90}
                ${WEIGHTS_X + WEIGHTS_W + 80} ${CHART_Y + CHART_H + 90}
                ${WEIGHTS_X + WEIGHTS_W + 18} ${WEIGHTS_Y + WEIGHTS_H / 2 + 30}`}
          fill="none"
          stroke="rgba(245,158,11,0.55)"
          strokeWidth={1.4}
          strokeDasharray="6 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: phase >= 1 ? 1 : 0, opacity: phase >= 1 ? 0.6 : 0 }}
          transition={{ duration: 1.4 / speed, ease: 'easeOut' }}
        />
        <motion.text
          x={WEIGHTS_X + WEIGHTS_W + 130}
          y={CHART_Y + CHART_H + 80}
          fontFamily="var(--font-mono)"
          fontSize="12"
          letterSpacing="0.16em"
          fill={ACCENT.amber}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 0.85 : 0 }}
          transition={{ duration: 0.6 / speed }}
        >
          ← updates
        </motion.text>
      </g>

      {/* ===================== RIGHT ZONE — LOSS CURVE ===================== */}
      <g transform={`translate(${CHART_X}, ${CHART_Y})`}>
        <text
          x={0}
          y={-30}
          fontFamily="var(--font-mono)"
          fontSize="13"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          TRAINING LOSS
        </text>
        <text
          x={0}
          y={-12}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="22"
          fill="rgba(255,255,255,0.85)"
        >
          loss falls as the model gets less wrong
        </text>

        {/* Chart frame */}
        <rect
          x={-8}
          y={-2}
          width={CHART_W + 16}
          height={CHART_H + 16}
          rx={10}
          fill="rgba(255,255,255,0.02)"
          stroke={ACCENT.rule}
          strokeWidth={1}
        />

        {/* Y axis */}
        <line
          x1={CHART_PAD_L}
          y1={CHART_PAD_T}
          x2={CHART_PAD_L}
          y2={CHART_H - CHART_PAD_B}
          stroke={ACCENT.rule}
          strokeWidth={1}
        />
        {/* X axis */}
        <line
          x1={CHART_PAD_L}
          y1={CHART_H - CHART_PAD_B}
          x2={CHART_W - CHART_PAD_R}
          y2={CHART_H - CHART_PAD_B}
          stroke={ACCENT.rule}
          strokeWidth={1}
        />

        {/* Y-axis ticks (decorative) */}
        {[0, 1, 2, 3].map((i) => {
          const innerH = CHART_H - CHART_PAD_T - CHART_PAD_B
          const y = CHART_PAD_T + (i / 3) * innerH
          return (
            <g key={`yt-${i}`}>
              <line x1={CHART_PAD_L - 6} x2={CHART_PAD_L} y1={y} y2={y} stroke={ACCENT.rule} />
              <line
                x1={CHART_PAD_L}
                x2={CHART_W - CHART_PAD_R}
                y1={y}
                y2={y}
                stroke={ACCENT.rule}
                strokeOpacity={0.35}
                strokeDasharray="3 6"
              />
            </g>
          )
        })}

        {/* Axis labels */}
        <text
          x={CHART_PAD_L - 18}
          y={CHART_PAD_T + 6}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill={ACCENT.dim}
          textAnchor="end"
        >
          high
        </text>
        <text
          x={CHART_PAD_L - 18}
          y={CHART_H - CHART_PAD_B - 2}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill={ACCENT.dim}
          textAnchor="end"
        >
          low
        </text>
        <text
          x={CHART_PAD_L - 38}
          y={CHART_H / 2}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.2em"
          fill={ACCENT.dim}
          transform={`rotate(-90, ${CHART_PAD_L - 38}, ${CHART_H / 2})`}
          textAnchor="middle"
        >
          LOSS
        </text>
        <text
          x={CHART_W - CHART_PAD_R}
          y={CHART_H - CHART_PAD_B + 28}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.2em"
          fill={ACCENT.dim}
          textAnchor="end"
        >
          TRAINING STEPS →
        </text>

        {/* Filled area under curve */}
        <motion.path
          d={LOSS_AREA_PATH}
          fill="url(#act4-loss-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 0.9 : 0.0 }}
          transition={{ duration: 1.2 / speed, ease: 'easeOut' }}
        />

        {/* The loss curve itself */}
        <motion.path
          d={LOSS_PATH}
          fill="none"
          stroke={ACCENT.amber}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#act4-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: curveProgress }}
          transition={{ duration: 2.2 / speed, ease: 'easeOut' }}
        />

        {/* Glowing head dot riding the end of the visible curve */}
        <CurveHead progress={curveProgress} />

        {/* Starting marker — "high loss" */}
        <g transform={`translate(${LOSS_PTS[0][0]}, ${LOSS_PTS[0][1]})`}>
          <circle r={5} fill={ACCENT.red} opacity={0.85} />
          <text
            x={10}
            y={-8}
            fontFamily="var(--font-mono)"
            fontSize="11"
            fill={ACCENT.red}
            opacity={0.9}
          >
            random init
          </text>
        </g>

        {/* End marker — "trained" — only when fully drawn */}
        <motion.g
          transform={`translate(${LOSS_PTS[LOSS_PTS.length - 1][0]}, ${LOSS_PTS[LOSS_PTS.length - 1][1]})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 0.6 / speed }}
        >
          <circle r={6} fill={ACCENT.mint} opacity={0.95} />
          <text
            x={-10}
            y={-12}
            fontFamily="var(--font-mono)"
            fontSize="11"
            fill={ACCENT.mint}
            textAnchor="end"
          >
            trained
          </text>
        </motion.g>
      </g>

      {/* ===================== BOTTOM PIPELINE ===================== */}
      <g transform={`translate(${VB_W / 2}, ${VB_H - 90})`}>
        <text
          x={0}
          y={-26}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.32em"
          fill={ACCENT.dim}
        >
          THE TRAINING LOOP
        </text>
        {(() => {
          const w = 168
          const gap = 22
          const total = PIPELINE.length * w + (PIPELINE.length - 1) * gap
          const startX = -total / 2
          return (
            <>
              {PIPELINE.map((tok, i) => {
                const x = startX + i * (w + gap)
                const active = i === pipelineIdx
                return (
                  <g key={`pl-${i}`} transform={`translate(${x + w / 2}, 0)`}>
                    <motion.rect
                      x={-w / 2}
                      y={-22}
                      width={w}
                      height={44}
                      rx={22}
                      initial={{
                        fill: 'rgba(255,255,255,0.02)',
                        stroke: ACCENT.rule,
                      }}
                      animate={{
                        fill: active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.02)',
                        stroke: active ? ACCENT.amber : ACCENT.rule,
                      }}
                      transition={{ duration: 0.4 / speed }}
                      strokeWidth={1.5}
                    />
                    <motion.text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="13"
                      letterSpacing="0.18em"
                      initial={{ fill: ACCENT.dim }}
                      animate={{ fill: active ? ACCENT.amber : ACCENT.dim }}
                      transition={{ duration: 0.4 / speed }}
                    >
                      {tok.toUpperCase()}
                    </motion.text>
                  </g>
                )
              })}
              {/* Arrows between tokens */}
              {PIPELINE.slice(0, -1).map((_, i) => {
                const x1 = startX + (i + 1) * w + i * gap
                const x2 = x1 + gap
                return (
                  <g key={`arr-${i}`}>
                    <line
                      x1={x1 + 2}
                      x2={x2 - 8}
                      y1={0}
                      y2={0}
                      stroke={ACCENT.rule}
                      strokeWidth={1.2}
                    />
                    <polyline
                      points={`${x2 - 10},-4 ${x2 - 4},0 ${x2 - 10},4`}
                      fill="none"
                      stroke={ACCENT.dim}
                      strokeWidth={1.2}
                    />
                  </g>
                )
              })}
              {/* Loop arrow returning from "update" → "predict" */}
              <motion.path
                d={`M ${startX + PIPELINE.length * w + (PIPELINE.length - 1) * gap + 6} 0
                    Q ${startX + total / 2} 70
                      ${startX - 6} 0`}
                fill="none"
                stroke="rgba(245,158,11,0.7)"
                strokeWidth={1.4}
                strokeDasharray="5 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2.4 / speed,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              />
              <text
                x={0}
                y={62}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="11"
                letterSpacing="0.24em"
                fill={ACCENT.amber}
                opacity={0.8}
              >
                repeat
              </text>
            </>
          )
        })()}
      </g>
    </svg>
  )
}

/**
 * A glowing dot that rides along the loss curve, positioned at the
 * `progress` fraction (0..1) into the LOSS_PTS array.
 */
function CurveHead({ progress }: { progress: number }) {
  // Interpolate a point along LOSS_PTS at fractional position.
  const N = LOSS_PTS.length
  const idxF = Math.max(0, Math.min(N - 1, progress * (N - 1)))
  const i0 = Math.floor(idxF)
  const i1 = Math.min(N - 1, i0 + 1)
  const t = idxF - i0
  const [x0, y0] = LOSS_PTS[i0]
  const [x1, y1] = LOSS_PTS[i1]
  const x = x0 + (x1 - x0) * t
  const y = y0 + (y1 - y0) * t
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={9}
        fill={ACCENT.amber}
        opacity={0.25}
        animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <circle cx={x} cy={y} r={4.5} fill={ACCENT.amber} />
    </g>
  )
}

/* =========================================================================
 * Scene 20 — SplitPane wrapper. Right pane = persistent commentary that
 * frames the whole act.
 * ====================================================================== */

export function Act4IntroSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const phaseLabels = ['random at first', 'less wrong over time', 'trained']
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      4500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const subtitleByPhase: ReactNode[] = [
    <>
      Acts I–III showed a <em>trained</em> model running. But where did all
      those weights come from? At the start of training, every weight was a
      small random number. The model knew nothing.
    </>,
    <>
      Training is a feedback loop. Predict the next token, measure how
      wrong the prediction was, and nudge every weight in the direction
      that would have made the loss a little smaller. Repeat — millions of
      times.
    </>,
    <>
      Over many steps, the loss falls and the weights settle into a shape
      that captures real structure in language. The next scenes break down
      each step of that loop.
    </>,
  ]

  const equationByPhase: { label: string; body: ReactNode }[] = [
    {
      label: 'goal',
      body: <>minimise the loss L(W) over training data</>,
    },
    {
      label: 'one training step',
      body: <>W ← W − η · ∂L/∂W</>,
    },
    {
      label: 'this act covers',
      body: <>LOSS · BACKPROP · OPTIMIZER</>,
    },
  ]

  const calloutByPhase: ReactNode[] = [
    'Random initialization sets every weight to a tiny random value (e.g. drawn from a normal distribution). With these weights, the model produces nonsense — its predictions are essentially uniform over the vocabulary.',
    'Each forward pass produces a prediction. Cross-entropy loss measures how wrong it was. Backprop computes ∂loss/∂w for every weight. The optimizer (Adam, SGD, …) takes the step. That is one iteration.',
    'GPT-3 took about 300 billion tokens of training. GPT-4 reportedly trained for trillions. Each token is one forward + backward pass. The result is the static weight matrix Acts I–III showed.',
  ]

  return (
    <SplitPaneScene
      viz={<VizAct4Intro />}
      text={{
        kicker: ACT4_KICKER,
        title: 'How the weights got there.',
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
          { label: 'start', value: 'random weights', color: ACCENT.red },
          { label: 'driver', value: 'loss ↓', color: ACCENT.amber },
          { label: 'mechanism', value: 'backprop' },
          { label: 'end', value: 'trained model', color: ACCENT.mint },
        ],
        equation: equationByPhase[phase],
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 21 — loss: "How wrong is the guess?"
 *
 * One clean causal chain across the viz pane:
 *
 *   predicted distribution  →  highlight correct token  →  read p(correct)
 *                                                          →  apply −log
 *                                                          →  scalar loss
 *
 * Three phases share the SAME six-token vocabulary and the SAME target
 * ('c'), so the only thing that changes between phases is the predicted
 * distribution. That keeps the comparison clean.
 *
 *   phase 0 — confident & correct  →  p(c)=0.75  →  loss ≈ 0.29 (mint)
 *   phase 1 — uncertain            →  p(c)=0.28  →  loss ≈ 1.27 (amber)
 *   phase 2 — confident & wrong    →  p(c)=0.02  →  loss ≈ 3.91 (red)
 * ====================================================================== */

const CE_VB_W = 1400
const CE_VB_H = 1000

const CE_TOKENS = ['a', 'b', 'c', 'd', 'e', 'f']
const CE_TARGET_IDX = 2

const CE_BAR_W = 78
const CE_BAR_GAP = 22
const CE_BAR_MAX_H = 320
const CE_BARS_X = 120
const CE_BARS_BASELINE_Y = 540 // y at the bottom of the bars

interface CEPhase {
  label: string
  probs: number[]
  tone: 'low' | 'mid' | 'high'
  beat: string
}

const CE_PHASES: CEPhase[] = [
  {
    label: 'confident & correct',
    probs: [0.04, 0.05, 0.75, 0.06, 0.05, 0.05],
    tone: 'low',
    beat: 'The model put most of its weight on the right token. Loss is tiny.',
  },
  {
    label: 'uncertain',
    probs: [0.12, 0.18, 0.28, 0.15, 0.15, 0.12],
    tone: 'mid',
    beat: 'The probability spread thin. Loss climbs — the model is hedging.',
  },
  {
    label: 'confident & wrong',
    probs: [0.06, 0.65, 0.02, 0.13, 0.08, 0.06],
    tone: 'high',
    beat: 'The model was sure — and it was sure of the wrong token. Loss explodes.',
  },
]

function ceLoss(p: number): number {
  return -Math.log(Math.max(p, 1e-12))
}

function ceToneColor(tone: 'low' | 'mid' | 'high'): string {
  if (tone === 'low') return ACCENT.mint
  if (tone === 'mid') return ACCENT.amber
  return ACCENT.red
}

export function VizCrossEntropy() {
  const speed = useSpeed()
  const PHASES = CE_PHASES.length
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const s = CE_PHASES[phase]
  const pCorrect = s.probs[CE_TARGET_IDX]
  const loss = ceLoss(pCorrect)
  const toneColor = ceToneColor(s.tone)

  // Geometry of the target predicted bar
  const targetBarX = CE_BARS_X + CE_TARGET_IDX * (CE_BAR_W + CE_BAR_GAP)
  const targetBarH = pCorrect * CE_BAR_MAX_H
  const targetBarTopY = CE_BARS_BASELINE_Y - targetBarH

  // Right-side readout column
  const READ_X = 940
  const P_BOX_Y = 220
  const NEGLOG_BOX_Y = 380
  const LOSS_BOX_Y = 560

  return (
    <svg viewBox={`0 0 ${CE_VB_W} ${CE_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="ce-bar-target" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT.mint} stopOpacity="0.95" />
          <stop offset="100%" stopColor={ACCENT.mint} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="ce-bar-other" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT.blue} stopOpacity="0.55" />
          <stop offset="100%" stopColor={ACCENT.blue} stopOpacity="0.20" />
        </linearGradient>
        <filter id="ce-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ========== HEADER ========== */}
      <text
        x={CE_BARS_X}
        y={70}
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.22em"
        fill={ACCENT.dim}
      >
        ONE PREDICTION · ONE TARGET · ONE NUMBER
      </text>
      <text
        x={CE_BARS_X}
        y={102}
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="26"
        fill="rgba(255,255,255,0.85)"
      >
        Read the probability on the correct token. Take −log.
      </text>

      {/* ========== TARGET ROW (one-hot) ========== */}
      <text
        x={CE_BARS_X}
        y={158}
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.mint}
      >
        TARGET (ONE-HOT)
      </text>
      {CE_TOKENS.map((t, i) => {
        const x = CE_BARS_X + i * (CE_BAR_W + CE_BAR_GAP)
        const isTarget = i === CE_TARGET_IDX
        return (
          <g key={`tgt-${i}`}>
            <rect
              x={x}
              y={172}
              width={CE_BAR_W}
              height={32}
              rx={3}
              fill={isTarget ? ACCENT.mint : 'rgba(255,255,255,0.03)'}
              stroke={isTarget ? ACCENT.mint : ACCENT.rule}
              strokeWidth={isTarget ? 1.5 : 1}
              opacity={isTarget ? 0.9 : 0.6}
            />
            <text
              x={x + CE_BAR_W / 2}
              y={193}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="13"
              fill={isTarget ? '#0c0c0e' : ACCENT.dim}
              fontWeight={isTarget ? 600 : 400}
            >
              {isTarget ? '1.0' : '0.0'}
            </text>
          </g>
        )
      })}

      {/* ========== HIGHLIGHT COLUMN ========== */}
      {/* A faint vertical band picks out the target column across both
          target row and prediction bars. Helps the eye trace the link. */}
      <rect
        x={targetBarX - 6}
        y={172}
        width={CE_BAR_W + 12}
        height={CE_BARS_BASELINE_Y - 172 + 16}
        rx={6}
        fill={ACCENT.mint}
        opacity={0.06}
      />

      {/* ========== PREDICTION LABEL ========== */}
      <motion.text
        key={`plabel-${phase}`}
        x={CE_BARS_X}
        y={232}
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={toneColor}
        initial={{ opacity: 0, y: 240 }}
        animate={{ opacity: 1, y: 232 }}
        transition={{ duration: 0.4 / speed }}
      >
        PREDICTION · {s.label.toUpperCase()}
      </motion.text>

      {/* ========== PREDICTION BARS ========== */}
      {s.probs.map((p, i) => {
        const x = CE_BARS_X + i * (CE_BAR_W + CE_BAR_GAP)
        const h = p * CE_BAR_MAX_H
        const y = CE_BARS_BASELINE_Y - h
        const isTarget = i === CE_TARGET_IDX
        return (
          <g key={`bar-${i}`}>
            {/* Bar */}
            <motion.rect
              x={x}
              width={CE_BAR_W}
              rx={4}
              fill={isTarget ? 'url(#ce-bar-target)' : 'url(#ce-bar-other)'}
              stroke={isTarget ? ACCENT.mint : 'rgba(96,165,250,0.45)'}
              strokeWidth={isTarget ? 1.5 : 1}
              initial={false}
              animate={{ y, height: h }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            />
            {/* % label above bar */}
            <motion.text
              x={x + CE_BAR_W / 2}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="14"
              fill={isTarget ? ACCENT.mint : 'rgba(255,255,255,0.78)'}
              fontWeight={isTarget ? 600 : 400}
              initial={false}
              animate={{ y: y - 12 }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            >
              {(p * 100).toFixed(0)}%
            </motion.text>
            {/* Token label below baseline */}
            <rect
              x={x}
              y={CE_BARS_BASELINE_Y + 14}
              width={CE_BAR_W}
              height={42}
              rx={3}
              fill="rgba(255,255,255,0.02)"
              stroke={isTarget ? ACCENT.mint : ACCENT.rule}
              strokeWidth={isTarget ? 1.5 : 1}
            />
            <text
              x={x + CE_BAR_W / 2}
              y={CE_BARS_BASELINE_Y + 42}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="20"
              fill={isTarget ? ACCENT.mint : 'rgba(255,255,255,0.78)'}
              fontWeight={isTarget ? 600 : 400}
            >
              {CE_TOKENS[i]}
            </text>
          </g>
        )
      })}

      {/* baseline */}
      <line
        x1={CE_BARS_X - 6}
        x2={CE_BARS_X + CE_TOKENS.length * (CE_BAR_W + CE_BAR_GAP) - CE_BAR_GAP + 6}
        y1={CE_BARS_BASELINE_Y}
        y2={CE_BARS_BASELINE_Y}
        stroke={ACCENT.rule}
        strokeWidth={1}
      />

      {/* ========== EXTRACTION ARROW: target bar → p readout ========== */}
      <motion.g key={`arrow-${phase}`}>
        <motion.path
          d={`M ${targetBarX + CE_BAR_W} ${targetBarTopY + 8}
              C ${targetBarX + CE_BAR_W + 90} ${targetBarTopY + 8}
                ${READ_X - 80} ${P_BOX_Y + 60}
                ${READ_X - 12} ${P_BOX_Y + 60}`}
          fill="none"
          stroke={ACCENT.mint}
          strokeWidth={1.6}
          strokeDasharray="4 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{ delay: 0.6 / speed, duration: 0.9 / speed, ease: 'easeOut' }}
        />
        {/* arrowhead */}
        <motion.polyline
          points={`${READ_X - 18},${P_BOX_Y + 56} ${READ_X - 8},${P_BOX_Y + 60} ${READ_X - 18},${P_BOX_Y + 64}`}
          fill="none"
          stroke={ACCENT.mint}
          strokeWidth={1.6}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 1.4 / speed, duration: 0.3 / speed }}
        />
      </motion.g>

      {/* ========== READOUT 1: p(correct) ========== */}
      <g transform={`translate(${READ_X}, ${P_BOX_Y})`}>
        <rect
          x={0}
          y={0}
          width={340}
          height={120}
          rx={8}
          fill="rgba(52,211,153,0.06)"
          stroke={ACCENT.mint}
          strokeWidth={1.2}
          opacity={0.9}
        />
        <text
          x={20}
          y={28}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.mint}
        >
          p( CORRECT TOKEN )
        </text>
        <text
          x={20}
          y={56}
          fontFamily="var(--font-mono)"
          fontSize="13"
          fill="rgba(255,255,255,0.6)"
        >
          read off bar &apos;{CE_TOKENS[CE_TARGET_IDX]}&apos;
        </text>
        <motion.text
          key={`pcorrect-${phase}`}
          x={170}
          y={100}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="46"
          fill={ACCENT.mint}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 / speed, type: 'spring', stiffness: 180, damping: 16 }}
        >
          {pCorrect.toFixed(2)}
        </motion.text>
      </g>

      {/* ========== TRANSFORM ARROW: p → −log ========== */}
      <motion.g
        key={`tx-${phase}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 / speed, duration: 0.4 / speed }}
      >
        <line
          x1={READ_X + 170}
          x2={READ_X + 170}
          y1={P_BOX_Y + 130}
          y2={NEGLOG_BOX_Y - 8}
          stroke={ACCENT.amber}
          strokeWidth={1.4}
          strokeDasharray="4 5"
        />
        <polyline
          points={`${READ_X + 166},${NEGLOG_BOX_Y - 12} ${READ_X + 170},${NEGLOG_BOX_Y - 4} ${READ_X + 174},${NEGLOG_BOX_Y - 12}`}
          fill="none"
          stroke={ACCENT.amber}
          strokeWidth={1.6}
        />
        <text
          x={READ_X + 184}
          y={(P_BOX_Y + 130 + NEGLOG_BOX_Y) / 2 + 4}
          fontFamily="var(--font-mono)"
          fontSize="12"
          letterSpacing="0.18em"
          fill={ACCENT.amber}
        >
          apply − log
        </text>
      </motion.g>

      {/* ========== READOUT 2: −log( p ) substitution ========== */}
      <g transform={`translate(${READ_X}, ${NEGLOG_BOX_Y})`}>
        <rect
          x={0}
          y={0}
          width={340}
          height={100}
          rx={8}
          fill="rgba(245,158,11,0.06)"
          stroke={ACCENT.amber}
          strokeWidth={1.2}
        />
        <text
          x={20}
          y={28}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.amber}
        >
          THE RULE
        </text>
        <motion.text
          key={`rule-${phase}`}
          x={170}
          y={70}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="22"
          fill="rgba(255,255,255,0.92)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 / speed, duration: 0.4 / speed }}
        >
          L = − log ( {pCorrect.toFixed(2)} )
        </motion.text>
      </g>

      {/* ========== READOUT 3: scalar loss ========== */}
      <g transform={`translate(${READ_X}, ${LOSS_BOX_Y})`}>
        <motion.rect
          key={`lossbox-${phase}`}
          x={0}
          y={0}
          width={340}
          height={170}
          rx={10}
          fill={`${toneColor}1A`}
          stroke={toneColor}
          strokeWidth={1.6}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 / speed, duration: 0.5 / speed }}
        />
        <text
          x={20}
          y={32}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={toneColor}
        >
          LOSS
        </text>
        <text
          x={20}
          y={54}
          fontFamily="var(--font-mono)"
          fontSize="13"
          fill="rgba(255,255,255,0.55)"
        >
          one scalar — feeds backprop
        </text>
        <motion.text
          key={`lossval-${phase}`}
          x={170}
          y={134}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="78"
          fill={toneColor}
          filter="url(#ce-glow)"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.9 / speed, type: 'spring', stiffness: 160, damping: 16 }}
        >
          {loss.toFixed(2)}
        </motion.text>
      </g>

      {/* ========== BOTTOM SCENARIO STRIP ========== */}
      <g transform={`translate(${CE_VB_W / 2}, ${CE_VB_H - 70})`}>
        <text
          x={0}
          y={-30}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.32em"
          fill={ACCENT.dim}
        >
          THREE CASES
        </text>
        {(() => {
          const w = 240
          const gap = 18
          const total = CE_PHASES.length * w + (CE_PHASES.length - 1) * gap
          const startX = -total / 2
          return CE_PHASES.map((c, i) => {
            const active = i === phase
            const accent = ceToneColor(c.tone)
            const x = startX + i * (w + gap) + w / 2
            return (
              <g key={`case-${i}`} transform={`translate(${x}, 0)`}>
                <motion.rect
                  x={-w / 2}
                  y={-22}
                  width={w}
                  height={44}
                  rx={22}
                  initial={{
                    fill: 'rgba(255,255,255,0.02)',
                    stroke: ACCENT.rule,
                  }}
                  animate={{
                    fill: active ? `${accent}26` : 'rgba(255,255,255,0.02)',
                    stroke: active ? accent : ACCENT.rule,
                  }}
                  transition={{ duration: 0.4 / speed }}
                  strokeWidth={1.5}
                />
                <motion.text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="13"
                  letterSpacing="0.18em"
                  initial={{ fill: ACCENT.dim }}
                  animate={{ fill: active ? accent : ACCENT.dim }}
                  transition={{ duration: 0.4 / speed }}
                >
                  {c.label.toUpperCase()}
                </motion.text>
              </g>
            )
          })
        })()}
      </g>
    </svg>
  )
}

export function CrossEntropySplitPane() {
  const speed = useSpeed()
  const PHASES = CE_PHASES.length
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const s = CE_PHASES[phase]
  const pCorrect = s.probs[CE_TARGET_IDX]
  const loss = ceLoss(pCorrect)
  const toneColor = ceToneColor(s.tone)

  const subtitleByPhase: ReactNode[] = [
    <>
      The model assigns a probability to every token in the vocabulary. We
      only care about <em>one</em>: the probability it placed on the
      correct next token. Loss = <em>−log</em> of that number.
    </>,
    <>
      When the model hedges, the probability on the right token shrinks.
      Loss climbs steadily — a few tenths of a nat for each halving of the
      probability.
    </>,
    <>
      This is why <em>−log</em> matters. As p(correct) → 0 the loss → ∞.
      Confident-and-wrong creates a huge gradient — exactly the signal
      backprop needs to fix the mistake.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'Quick anchors: p=1.00 → loss=0.00. p=0.50 → loss≈0.69. p=0.25 → loss≈1.39. p=0.10 → loss≈2.30. p=0.01 → loss≈4.60. The model is paid in nats of surprise.',
    'A uniform model over V tokens always gets loss = log V. With V=6 that is ≈1.79 — the "knows nothing" baseline. Anything below that means the model has actually learned something about which token is more likely.',
    'Squared error would barely care that 1% missed by 99%. −log p does — that is what makes cross-entropy the right loss for token prediction. The next scenes show how this single scalar drives every weight update.',
  ]

  return (
    <SplitPaneScene
      viz={<VizCrossEntropy />}
      text={{
        kicker: 'ACT IV · LOSS',
        title: 'How wrong is the guess?',
        subtitle: subtitleByPhase[phase],
        accent: toneColor,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={s.label}
            accent={toneColor}
          />
        ),
        stats: [
          { label: 'vocab', value: `V = ${CE_TOKENS.length}` },
          { label: 'target', value: `'${CE_TOKENS[CE_TARGET_IDX]}'`, color: ACCENT.mint },
          { label: 'p(correct)', value: pCorrect.toFixed(2), color: ACCENT.mint },
          { label: 'loss', value: loss.toFixed(2), color: toneColor },
        ],
        equation: {
          label: 'one rule',
          body: <>L = − log p(correct token)</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 22 — loss-seq: "Every position gets its own loss."
 *
 * One canvas, three beats:
 *
 *   beat 0 — single column hero. One position, like Scene 21: input token
 *            at the top, an arrow down, the next-token target below it,
 *            and one loss bar. This is the unit pattern.
 *   beat 1 — multiply across the sequence. The other 8 columns pop in.
 *            A copy of the input row slides in below and shifts LEFT by
 *            one to become the target row, so column i's target is the
 *            input at column i+1. Diagonal "next-token" arrows light up.
 *   beat 2 — collect the per-position losses. Every loss bar fills,
 *            then thin amber lines flow from each bar down into the
 *            central L_seq mean box, which pulses with the average.
 * ====================================================================== */

const CELS_VB_W = 1400
const CELS_VB_H = 1000

// 9 input positions → 9 next-token targets. Reads "The cat sa" → predicting
// "he cat sat".
const CELS_INPUTS = ['T', 'h', 'e', ' ', 'c', 'a', 't', ' ', 's']
const CELS_TARGETS = ['h', 'e', ' ', 'c', 'a', 't', ' ', 's', 'a']
const CELS_T = CELS_INPUTS.length

// Per-position losses (deterministic). Mostly low with a few hot spots so
// the mean is realistic and the per-column variance reads.
const CELS_LOSSES = [0.62, 0.41, 0.55, 1.18, 0.38, 0.49, 1.92, 0.71, 1.34]
const CELS_MEAN = +(CELS_LOSSES.reduce((a, b) => a + b, 0) / CELS_T).toFixed(2)

const CELS_COL_W = 96
const CELS_COL_GAP = 22
const CELS_COL_PITCH = CELS_COL_W + CELS_COL_GAP
const CELS_GRID_W = CELS_T * CELS_COL_W + (CELS_T - 1) * CELS_COL_GAP
const CELS_GRID_X = (CELS_VB_W - CELS_GRID_W) / 2

const CELS_INPUT_Y = 220
const CELS_TARGET_Y = 360
const CELS_TOKEN_H = 78
const CELS_BAR_TOP_Y = 510
const CELS_BAR_MAX_H = 160
const CELS_BAR_BASE_Y = CELS_BAR_TOP_Y + CELS_BAR_MAX_H

const CELS_MEAN_BOX_X = (CELS_VB_W - 360) / 2
const CELS_MEAN_BOX_Y = 770
const CELS_MEAN_BOX_W = 360
const CELS_MEAN_BOX_H = 130

function celsLossColor(loss: number): string {
  if (loss < 0.7) return ACCENT.mint
  if (loss < 1.5) return ACCENT.amber
  return ACCENT.red
}

function celsTokDisplay(t: string): string {
  return t === ' ' ? '␣' : t
}

export function VizCELossSeq({ phase }: { phase: number }) {
  const speed = useSpeed()

  // beat 0 — hero column shows its full unit pattern (input → target →
  //          loss → mini-mean equal to that single loss). Other columns
  //          hidden.
  // beat 1 — all 9 columns appear, target row reveals across all of them,
  //          shift caption surfaces. Losses still hidden.
  // beat 2 — every loss bar fills, collector lines flow into the mean
  //          box, mean lights up to L_seq.
  const showAllCols = phase >= 1
  const heroAlwaysOn = true
  const showTargetsAll = phase >= 1
  const showLossesAll = phase >= 2
  const showMean = phase >= 0
  const meanIsFull = phase >= 2

  // Mean value displayed. Beat 0 = just the hero loss. Beat 1 = same
  // (targets are revealing but losses haven't fired yet). Beat 2 = full
  // L_seq.
  const displayedMean = meanIsFull ? CELS_MEAN : CELS_LOSSES[0]

  return (
    <svg viewBox={`0 0 ${CELS_VB_W} ${CELS_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="cels-input-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT.blue} stopOpacity="0.30" />
          <stop offset="100%" stopColor={ACCENT.blue} stopOpacity="0.10" />
        </linearGradient>
        <linearGradient id="cels-target-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT.mint} stopOpacity="0.30" />
          <stop offset="100%" stopColor={ACCENT.mint} stopOpacity="0.10" />
        </linearGradient>
        <filter id="cels-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== HEADER ===================== */}
      <text
        x={CELS_VB_W / 2}
        y={70}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        ONE FORWARD PASS · T NEXT-TOKEN GUESSES IN PARALLEL
      </text>
      <text
        x={CELS_VB_W / 2}
        y={108}
        textAnchor="middle"
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="26"
        fill="rgba(255,255,255,0.85)"
      >
        Every position predicts its own next token. Every guess gets its own loss.
      </text>

      {/* ===================== ROW LABELS ===================== */}
      <text
        x={CELS_GRID_X - 22}
        y={CELS_INPUT_Y + CELS_TOKEN_H / 2 + 4}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.blue}
      >
        INPUT
      </text>
      <motion.text
        x={CELS_GRID_X - 22}
        y={CELS_TARGET_Y + CELS_TOKEN_H / 2 + 4}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.mint}
        initial={{ opacity: 0 }}
        animate={{ opacity: showAllCols ? 1 : 0 }}
        transition={{ duration: 0.5 / speed }}
      >
        TARGET (NEXT TOKEN)
      </motion.text>
      <motion.text
        x={CELS_GRID_X - 22}
        y={CELS_BAR_BASE_Y - CELS_BAR_MAX_H / 2 + 4}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.amber}
        initial={{ opacity: 0 }}
        animate={{ opacity: showLossesAll ? 1 : 0 }}
        transition={{ duration: 0.5 / speed }}
      >
        LOSS
      </motion.text>

      {/* ===================== COLUMNS ===================== */}
      {CELS_INPUTS.map((tok, i) => {
        const isHero = i === 0
        // Hero column reveals targets and losses in beat 0 already, so
        // the unit pattern is on screen before we multiply across.
        const showThisInput = isHero ? heroAlwaysOn : showAllCols
        const showThisTarget = isHero ? phase >= 0 : showAllCols
        const showThisLoss = isHero ? phase >= 0 : showLossesAll
        const x = CELS_GRID_X + i * CELS_COL_PITCH
        const colCenterX = x + CELS_COL_W / 2

        // Per-column appear delay so the columns cascade in (beat 1).
        // Keep small to stay snappy and to render reliably in screenshots.
        const colDelay = 0
        const lossDelay = isHero ? 0 : 0.04 * i

        const lossH = (CELS_LOSSES[i] / 2.5) * CELS_BAR_MAX_H

        return (
          <g key={`col-${i}`}>
            {/* Hero column has a faint highlight band to mark it as the
                "one we just learned in Scene 21". */}
            {isHero && (
              <rect
                x={x - 8}
                y={CELS_INPUT_Y - 14}
                width={CELS_COL_W + 16}
                height={CELS_BAR_BASE_Y - CELS_INPUT_Y + 50}
                rx={10}
                fill={ACCENT.blue}
                opacity={0.05}
              />
            )}

            {/* Input box */}
            <g
              transform={`translate(${x}, ${CELS_INPUT_Y})`}
              style={{
                opacity: showThisInput ? 1 : 0,
                transition: `opacity ${0.4 / speed}s ease ${colDelay / speed}s`,
              }}
            >
              <rect
                width={CELS_COL_W}
                height={CELS_TOKEN_H}
                rx={5}
                fill="url(#cels-input-fill)"
                stroke={ACCENT.blue}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
              <text
                x={CELS_COL_W / 2}
                y={CELS_TOKEN_H / 2 + 12}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="34"
                fill={ACCENT.blue}
                fontWeight={500}
              >
                {celsTokDisplay(tok)}
              </text>
              <text
                x={CELS_COL_W / 2}
                y={CELS_TOKEN_H + 14}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill={ACCENT.dim}
                letterSpacing="0.1em"
              >
                pos {i}
              </text>
            </g>

            {/* "predicts" arrow input → target */}
            <g
              style={{
                opacity: showThisTarget ? 0.9 : 0,
                transition: `opacity ${0.4 / speed}s ease ${(0.4 + colDelay) / speed}s`,
              }}
            >
              <line
                x1={colCenterX}
                x2={colCenterX}
                y1={CELS_INPUT_Y + CELS_TOKEN_H + 18}
                y2={CELS_TARGET_Y - 8}
                stroke={ACCENT.mint}
                strokeOpacity={0.55}
                strokeWidth={1.4}
                strokeDasharray="4 4"
              />
              <polyline
                points={`${colCenterX - 5},${CELS_TARGET_Y - 14} ${colCenterX},${CELS_TARGET_Y - 4} ${colCenterX + 5},${CELS_TARGET_Y - 14}`}
                fill="none"
                stroke={ACCENT.mint}
                strokeWidth={1.4}
              />
            </g>

            {/* Target box */}
            <g
              transform={`translate(${x}, ${CELS_TARGET_Y})`}
              style={{
                opacity: showThisTarget ? 1 : 0,
                transition: `opacity ${0.5 / speed}s ease ${(0.2 + colDelay) / speed}s`,
              }}
            >
              <rect
                width={CELS_COL_W}
                height={CELS_TOKEN_H}
                rx={5}
                fill="url(#cels-target-fill)"
                stroke={ACCENT.mint}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
              <text
                x={CELS_COL_W / 2}
                y={CELS_TOKEN_H / 2 + 12}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="34"
                fill={ACCENT.mint}
                fontWeight={500}
              >
                {celsTokDisplay(CELS_TARGETS[i])}
              </text>
            </g>

            {/* Loss bar (frame + fill + value) */}
            <g
              style={{
                opacity: showThisLoss ? 1 : 0,
                transition: `opacity ${0.4 / speed}s ease ${lossDelay / speed}s`,
              }}
            >
              {/* Frame */}
              <rect
                x={x}
                y={CELS_BAR_TOP_Y}
                width={CELS_COL_W}
                height={CELS_BAR_MAX_H}
                rx={4}
                fill="rgba(255,255,255,0.02)"
                stroke={ACCENT.rule}
                strokeWidth={1}
              />
              {/* Fill */}
              <rect
                x={x + 6}
                y={showThisLoss ? CELS_BAR_BASE_Y - lossH - 4 : CELS_BAR_BASE_Y - 4}
                width={CELS_COL_W - 12}
                height={showThisLoss ? lossH : 0}
                rx={3}
                fill={celsLossColor(CELS_LOSSES[i])}
                opacity={0.55}
                style={{
                  transition: `y ${0.6 / speed}s ease ${(lossDelay + 0.2) / speed}s, height ${0.6 / speed}s ease ${(lossDelay + 0.2) / speed}s`,
                }}
              />
              {/* Numeric loss */}
              <text
                x={colCenterX}
                y={CELS_BAR_BASE_Y + 26}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="14"
                fill={celsLossColor(CELS_LOSSES[i])}
                fontWeight={600}
              >
                {CELS_LOSSES[i].toFixed(2)}
              </text>
            </g>

            {/* Collector line — flows from each loss bar's number into the
                central mean box. Only in beat 2. */}
            <motion.path
              d={`M ${colCenterX} ${CELS_BAR_BASE_Y + 34}
                  Q ${colCenterX} ${CELS_MEAN_BOX_Y - 30}
                    ${CELS_MEAN_BOX_X + CELS_MEAN_BOX_W / 2} ${CELS_MEAN_BOX_Y}`}
              fill="none"
              stroke={ACCENT.amber}
              strokeWidth={1}
              strokeDasharray="3 5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: meanIsFull ? 1 : 0,
                opacity: meanIsFull ? 0.5 : 0,
              }}
              transition={{
                duration: 0.9 / speed,
                delay: (1.2 + lossDelay * 0.5) / speed,
              }}
            />
          </g>
        )
      })}

      {/* ===================== "T = 9" + shift caption ===================== */}
      <motion.text
        x={CELS_VB_W / 2}
        y={CELS_TARGET_Y + CELS_TOKEN_H + 36}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.dim}
        initial={{ opacity: 0 }}
        animate={{ opacity: showAllCols ? 1 : 0 }}
        transition={{ duration: 0.5 / speed, delay: 0.8 / speed }}
      >
        TARGETS = INPUTS SHIFTED BY ONE
      </motion.text>

      {/* ===================== MEAN BOX ===================== */}
      <motion.g
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: showMean ? 1 : 0.15, y: 0 }}
        transition={{ duration: 0.5 / speed }}
      >
        <rect
          x={CELS_MEAN_BOX_X}
          y={CELS_MEAN_BOX_Y}
          width={CELS_MEAN_BOX_W}
          height={CELS_MEAN_BOX_H}
          rx={10}
          fill="rgba(245,158,11,0.10)"
          stroke={ACCENT.amber}
          strokeWidth={1.6}
        />
        <text
          x={CELS_MEAN_BOX_X + 20}
          y={CELS_MEAN_BOX_Y + 28}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.amber}
        >
          MEAN ACROSS POSITIONS · L_SEQ
        </text>
        <text
          x={CELS_MEAN_BOX_X + 20}
          y={CELS_MEAN_BOX_Y + 50}
          fontFamily="var(--font-mono)"
          fontSize="12"
          fill="rgba(255,255,255,0.55)"
        >
          (1/T) · Σₜ −log p(target_t)
        </text>
        <motion.text
          key={`mean-${phase}`}
          x={CELS_MEAN_BOX_X + CELS_MEAN_BOX_W / 2}
          y={CELS_MEAN_BOX_Y + CELS_MEAN_BOX_H - 22}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="46"
          fill={ACCENT.amber}
          filter="url(#cels-glow)"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: showMean ? 1.6 / speed : 0, type: 'spring', stiffness: 160, damping: 18 }}
        >
          {displayedMean.toFixed(2)}
        </motion.text>
      </motion.g>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${CELS_VB_W / 2}, ${CELS_VB_H - 50})`}>
        {(['one column', 'shift the target row', 'collect into L_seq'] as const).map((label, i) => {
          const w = 240
          const gap = 18
          const total = 3 * w + 2 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-18}
                width={w}
                height={36}
                rx={18}
                fill={active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.amber : ACCENT.rule}
                strokeWidth={1.4}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="12"
                letterSpacing="0.18em"
                fill={active ? ACCENT.amber : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function CELossSeqSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const phaseLabels = ['one column', 'shift the target row', 'collect into L_seq']

  const subtitleByPhase: ReactNode[] = [
    <>
      Scene 21 showed a single prediction → a single loss. A real sequence
      runs that same calculation at <em>every</em> position in parallel —
      one forward pass, T predictions.
    </>,
    <>
      The targets are just the input sequence shifted one step right.
      Position 0 should predict position 1, position 1 should predict
      position 2, and so on. Causal masking guarantees the model can&apos;t
      cheat by peeking ahead.
    </>,
    <>
      Each position has its own −log p(target). Average them and you get
      one scalar per sequence: <em>L_seq</em>. That is what backprop runs
      on (still not the final number — the next scene averages across the
      batch).
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'This is the unit pattern: input → next-token target → cross-entropy → one loss number. Hold this in mind — the rest of the scene is just T copies of it firing at once.',
    'This is called teacher forcing during training. The model sees the true tokens at positions 0..i−1 and is asked to predict position i. The shift is what turns one sequence into T independent training problems.',
    `For this 9-position fragment, the per-position losses average to ${CELS_MEAN.toFixed(2)} nats. Real training sequences are 1k–8k tokens long, so each forward pass is solving thousands of next-token problems in parallel.`,
  ]

  return (
    <SplitPaneScene
      viz={<VizCELossSeq phase={phase} />}
      text={{
        kicker: 'ACT IV · LOSS · PER-SEQUENCE',
        title: 'Every position gets its own loss.',
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
          { label: 'sequence length', value: `T = ${CELS_T}`, color: ACCENT.blue },
          { label: 'predictions / pass', value: `${CELS_T}`, color: ACCENT.mint },
          { label: 'per-pos losses', value: 'T scalars' },
          { label: 'sequence loss', value: `L_seq = ${CELS_MEAN.toFixed(2)}`, color: ACCENT.amber },
        ],
        equation: {
          label: 'one rule, T positions',
          body: <>L_seq = (1/T) · Σₜ − log p(target_t)</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 23 — loss-batch: "Average across the batch."
 *
 * The third and final loss scene. Scene 21 = one prediction, one loss.
 * Scene 22 = one sequence, T per-position losses, one L_seq. Scene 23 =
 * B sequences, B×T per-position losses, one L_batch.
 *
 * Four beats:
 *
 *   beat 0 — hero echo. The single sequence row from Scene 22 fades in
 *            with its 9 per-position cells and L_seq = 0.84. Caption:
 *            "From Scene 22 — one sequence, one L_seq."
 *   beat 1 — multiply across the batch. The hero row duplicates into
 *            B = 6 stacked rows. Each new row gets its own per-position
 *            cells and its own L_seq scalar at the right edge. Caption:
 *            "The GPU runs B sequences in parallel."
 *   beat 2 — frame the grid. A bracket appears around the B×T grid with
 *            the label "B sequences × T positions = B·T losses." Cells
 *            stay still, just better explained.
 *   beat 3 — collapse into one scalar. Each row's L_seq sends a thin
 *            amber pulse into the central batch-mean operator on the
 *            right. The big L_batch scalar lights up. Caption:
 *            "↓ backprop runs on this one scalar."
 * ====================================================================== */

const CELB_VB_W = 1400
const CELB_VB_H = 1000

const CELB_B = 6 // sequences in batch
const CELB_T = 9 // positions per sequence

// Per-sequence L_seq values. seq 1 echoes Scene 22 (0.84). Picked so the
// batch mean comes out to a clean number: their sum is 9.55 → mean 1.59.
const CELB_LSEQ = [0.84, 1.42, 2.10, 1.68, 0.96, 2.55] as const
const CELB_LBATCH = +(CELB_LSEQ.reduce((a, b) => a + b, 0) / CELB_B).toFixed(2) // 1.59

// Per-cell losses, deterministically generated so each row's mean equals
// the row's L_seq. Used purely for cell coloring, not numeric display.
const CELB_CELLS: number[][] = (() => {
  const out: number[][] = []
  for (let r = 0; r < CELB_B; r++) {
    const target = CELB_LSEQ[r]
    const seeds: number[] = []
    let sum = 0
    for (let c = 0; c < CELB_T; c++) {
      const noise = 0.5 + ((Math.sin(r * 13.7 + c * 5.3) + 1) / 2) * 2.4
      seeds.push(noise)
      sum += noise
    }
    // Rescale so the row mean equals the target L_seq.
    const scale = target / (sum / CELB_T)
    out.push(seeds.map((v) => +(v * scale).toFixed(2)))
  }
  return out
})()

const CELB_GRID_X = 90
const CELB_GRID_Y = 230
const CELB_ROW_H = 60
const CELB_ROW_GAP = 12
const CELB_ROW_LABEL_W = 64
const CELB_CELL_W = 60
const CELB_CELL_GAP = 6
const CELB_CELLS_X = CELB_GRID_X + CELB_ROW_LABEL_W + 14
const CELB_CELLS_W = CELB_T * CELB_CELL_W + (CELB_T - 1) * CELB_CELL_GAP
const CELB_LSEQ_X = CELB_CELLS_X + CELB_CELLS_W + 24
const CELB_LSEQ_W = 130
const CELB_GRID_RIGHT = CELB_LSEQ_X + CELB_LSEQ_W

const CELB_MEAN_X = 1020
const CELB_MEAN_Y = 320
const CELB_MEAN_W = 320
const CELB_MEAN_H = 280

function celbCellColor(loss: number): string {
  if (loss < 1.0) return ACCENT.mint
  if (loss < 2.0) return ACCENT.amber
  return ACCENT.red
}

function celbLseqColor(l: number): string {
  if (l < 1.2) return ACCENT.mint
  if (l < 2.2) return ACCENT.amber
  return ACCENT.red
}

export function VizCELossBatch({ phase }: { phase: number }) {
  const speed = useSpeed()

  // beat 0 — only seq 1 row visible
  // beat 1 — all 6 sequence rows
  // beat 2 — grid bracket + axis labels
  // beat 3 — collapse arrows + final L_batch
  const showAllRows = phase >= 1
  const showGridFrame = phase >= 2
  const showCollapse = phase >= 3

  // Mean displayed in the central box. Beats 0–2 show only the hero
  // sequence's L_seq (so the box reads 0.84 — the Scene 22 carry-over).
  // Beat 3 shows the full batch mean.
  const displayedMean = showCollapse ? CELB_LBATCH : CELB_LSEQ[0]
  const displayedMeanLabel = showCollapse
    ? 'L_batch — averaged over the batch'
    : 'so far — only seq 1 (Scene 22)'

  return (
    <svg viewBox={`0 0 ${CELB_VB_W} ${CELB_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="celb-row-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ACCENT.violet} stopOpacity="0.10" />
          <stop offset="100%" stopColor={ACCENT.violet} stopOpacity="0.03" />
        </linearGradient>
        <filter id="celb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== HEADER ===================== */}
      <text
        x={CELB_VB_W / 2}
        y={70}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        MANY SEQUENCES · MANY LOSSES · ONE SCALAR
      </text>
      <text
        x={CELB_VB_W / 2}
        y={108}
        textAnchor="middle"
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="26"
        fill="rgba(255,255,255,0.85)"
      >
        Every sequence in the batch contributes one L_seq. Average them.
      </text>

      {/* ===================== AXIS LABELS ===================== */}
      <g
        style={{
          opacity: showGridFrame ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {/* "positions →" along the top of the cell grid */}
        <text
          x={CELB_CELLS_X + CELB_CELLS_W / 2}
          y={CELB_GRID_Y - 16}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.blue}
        >
          T POSITIONS →  (per-sequence, like Scene 22)
        </text>
        {/* "B sequences ↓" along the left of the grid */}
        <text
          x={CELB_GRID_X - 6}
          y={CELB_GRID_Y + (CELB_B * (CELB_ROW_H + CELB_ROW_GAP)) / 2}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.violet}
          transform={`rotate(-90 ${CELB_GRID_X - 6} ${CELB_GRID_Y + (CELB_B * (CELB_ROW_H + CELB_ROW_GAP)) / 2})`}
        >
          B SEQUENCES ↓
        </text>
      </g>

      {/* ===================== ROWS ===================== */}
      {CELB_LSEQ.map((lseq, r) => {
        const isHero = r === 0
        const visibleRow = isHero || showAllRows
        const rowY = CELB_GRID_Y + r * (CELB_ROW_H + CELB_ROW_GAP)
        const rowDelay = isHero ? 0 : 0.06 * r
        const rowMidY = rowY + CELB_ROW_H / 2

        return (
          <g
            key={`row-${r}`}
            style={{
              opacity: visibleRow ? 1 : 0,
              transition: `opacity ${0.4 / speed}s ease ${rowDelay / speed}s`,
            }}
          >
            {/* Hero ring marker — only on row 0 to remind viewer this is
                the Scene-22 sequence we just learned. */}
            {isHero && (
              <rect
                x={CELB_GRID_X - 6}
                y={rowY - 4}
                width={CELB_GRID_RIGHT - CELB_GRID_X + 14}
                height={CELB_ROW_H + 8}
                rx={8}
                fill={ACCENT.cyan}
                opacity={0.06}
                style={{
                  transition: `opacity ${0.5 / speed}s ease`,
                  opacity: showAllRows ? 0.04 : 0.10,
                }}
              />
            )}

            {/* Row label box */}
            <rect
              x={CELB_GRID_X}
              y={rowY}
              width={CELB_ROW_LABEL_W}
              height={CELB_ROW_H}
              rx={5}
              fill="url(#celb-row-fill)"
              stroke={ACCENT.violet}
              strokeOpacity={0.4}
              strokeWidth={1}
            />
            <text
              x={CELB_GRID_X + CELB_ROW_LABEL_W / 2}
              y={rowMidY + 4}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="13"
              fill={ACCENT.violet}
            >
              seq {r + 1}
            </text>

            {/* Cells (per-position losses for this sequence) */}
            {CELB_CELLS[r].map((cellLoss, c) => {
              const cx = CELB_CELLS_X + c * (CELB_CELL_W + CELB_CELL_GAP)
              return (
                <rect
                  key={`cell-${r}-${c}`}
                  x={cx}
                  y={rowY + 4}
                  width={CELB_CELL_W}
                  height={CELB_ROW_H - 8}
                  rx={4}
                  fill={celbCellColor(cellLoss)}
                  opacity={Math.min(0.85, 0.25 + cellLoss * 0.18)}
                />
              )
            })}

            {/* L_seq scalar at the row's right edge */}
            <rect
              x={CELB_LSEQ_X}
              y={rowY}
              width={CELB_LSEQ_W}
              height={CELB_ROW_H}
              rx={6}
              fill={`${celbLseqColor(lseq)}1A`}
              stroke={celbLseqColor(lseq)}
              strokeWidth={1.4}
            />
            <text
              x={CELB_LSEQ_X + 12}
              y={rowY + 22}
              fontFamily="var(--font-mono)"
              fontSize="10"
              letterSpacing="0.18em"
              fill={celbLseqColor(lseq)}
            >
              L_SEQ
            </text>
            <text
              x={CELB_LSEQ_X + CELB_LSEQ_W - 14}
              y={rowY + CELB_ROW_H - 14}
              textAnchor="end"
              fontFamily="var(--font-display, Georgia, serif)"
              fontStyle="italic"
              fontSize="26"
              fill={celbLseqColor(lseq)}
            >
              {lseq.toFixed(2)}
            </text>

            {/* Collapse arrow — only beat 3. Goes from this row's L_seq
                box to the central batch-mean box. */}
            <path
              d={`M ${CELB_LSEQ_X + CELB_LSEQ_W} ${rowMidY}
                  C ${CELB_LSEQ_X + CELB_LSEQ_W + 80} ${rowMidY}
                    ${CELB_MEAN_X - 80} ${CELB_MEAN_Y + CELB_MEAN_H / 2}
                    ${CELB_MEAN_X} ${CELB_MEAN_Y + CELB_MEAN_H / 2}`}
              fill="none"
              stroke={ACCENT.amber}
              strokeWidth={1.2}
              strokeDasharray="4 5"
              style={{
                opacity: showCollapse ? 0.55 : 0,
                transition: `opacity ${0.6 / speed}s ease ${(0.1 * r) / speed}s`,
              }}
            />
          </g>
        )
      })}

      {/* ===================== "B × T = B·T" CAPTION ===================== */}
      <text
        x={CELB_GRID_X}
        y={CELB_GRID_Y + CELB_B * (CELB_ROW_H + CELB_ROW_GAP) + 22}
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.dim}
        style={{
          opacity: showGridFrame ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        B SEQUENCES × T POSITIONS = {CELB_B}·{CELB_T} = {CELB_B * CELB_T} CROSS-ENTROPY LOSSES IN ONE FORWARD PASS
      </text>

      {/* ===================== BATCH MEAN BOX ===================== */}
      <g>
        <rect
          x={CELB_MEAN_X}
          y={CELB_MEAN_Y}
          width={CELB_MEAN_W}
          height={CELB_MEAN_H}
          rx={12}
          fill="rgba(245,158,11,0.08)"
          stroke={ACCENT.amber}
          strokeWidth={1.6}
        />
        <text
          x={CELB_MEAN_X + 20}
          y={CELB_MEAN_Y + 32}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.amber}
        >
          BATCH MEAN · L_BATCH
        </text>
        <text
          x={CELB_MEAN_X + 20}
          y={CELB_MEAN_Y + 56}
          fontFamily="var(--font-mono)"
          fontSize="12"
          fill="rgba(255,255,255,0.55)"
        >
          (1/B) · Σᵢ L_seq(i)
        </text>

        {/* Big scalar */}
        <text
          key={`mean-${phase}`}
          x={CELB_MEAN_X + CELB_MEAN_W / 2}
          y={CELB_MEAN_Y + CELB_MEAN_H / 2 + 16}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="76"
          fill={ACCENT.amber}
          filter="url(#celb-glow)"
          style={{
            transition: `opacity ${0.5 / speed}s ease`,
            opacity: 1,
          }}
        >
          {displayedMean.toFixed(2)}
        </text>

        <text
          x={CELB_MEAN_X + CELB_MEAN_W / 2}
          y={CELB_MEAN_Y + CELB_MEAN_H - 30}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill={ACCENT.dim}
        >
          {displayedMeanLabel}
        </text>

        {/* "↓ backprop runs on this scalar" — surfaces in beat 3 */}
        <g
          style={{
            opacity: showCollapse ? 1 : 0,
            transition: `opacity ${0.5 / speed}s ease ${0.6 / speed}s`,
          }}
        >
          <line
            x1={CELB_MEAN_X + CELB_MEAN_W / 2}
            x2={CELB_MEAN_X + CELB_MEAN_W / 2}
            y1={CELB_MEAN_Y + CELB_MEAN_H + 10}
            y2={CELB_MEAN_Y + CELB_MEAN_H + 50}
            stroke={ACCENT.amber}
            strokeWidth={1.5}
          />
          <polyline
            points={`${CELB_MEAN_X + CELB_MEAN_W / 2 - 6},${CELB_MEAN_Y + CELB_MEAN_H + 44} ${CELB_MEAN_X + CELB_MEAN_W / 2},${CELB_MEAN_Y + CELB_MEAN_H + 54} ${CELB_MEAN_X + CELB_MEAN_W / 2 + 6},${CELB_MEAN_Y + CELB_MEAN_H + 44}`}
            fill="none"
            stroke={ACCENT.amber}
            strokeWidth={1.5}
          />
          <text
            x={CELB_MEAN_X + CELB_MEAN_W / 2}
            y={CELB_MEAN_Y + CELB_MEAN_H + 80}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="12"
            letterSpacing="0.22em"
            fill={ACCENT.amber}
          >
            BACKPROP RUNS ON THIS SCALAR
          </text>
        </g>
      </g>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${CELB_VB_W / 2}, ${CELB_VB_H - 50})`}>
        {(['hero echo', 'B sequences', 'B×T grid', 'collapse to L_batch'] as const).map((label, i) => {
          const w = 180
          const gap = 14
          const total = 4 * w + 3 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-18}
                width={w}
                height={36}
                rx={18}
                fill={active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.amber : ACCENT.rule}
                strokeWidth={1.4}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="11"
                letterSpacing="0.18em"
                fill={active ? ACCENT.amber : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function CELossBatchSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      4500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const phaseLabels = [
    'hero echo',
    'B sequences',
    'B×T grid',
    'collapse to L_batch',
  ]

  const subtitleByPhase: ReactNode[] = [
    <>
      Scene 22 ended with one sequence loss: <em>L_seq</em> = 0.84. That
      is the unit we are about to multiply across a whole batch.
    </>,
    <>
      The GPU runs <em>B</em> sequences side by side in one forward pass.
      Each sequence pays its own cross-entropy at every position and ends
      up with its own <em>L_seq</em>.
    </>,
    <>
      A whole batch produces <em>B × T</em> per-position losses — every
      cell here is one cross-entropy. Rows are sequences, columns are
      token positions. Same shape we built in Scene 22, repeated <em>B</em>{' '}
      times.
    </>,
    <>
      Average the per-sequence losses → one scalar <em>L_batch</em>.
      That is the only number backprop sees. Every weight update follows
      from this single value.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'Hold this in your head: the rest of Scene 23 is just this row, repeated and averaged. Nothing new is added — the model is doing the same thing in parallel.',
    `B = ${CELB_B} here. Real training uses B = 256, 512, even thousands. Larger batches reduce gradient noise but cost more memory. The formula is the same regardless of B.`,
    `${CELB_B} × ${CELB_T} = ${CELB_B * CELB_T} cross-entropy values, all computed in one forward pass. The GPU eats this entire grid for breakfast — that is the point of batching.`,
    `L_batch = ${CELB_LBATCH.toFixed(2)} for this batch. Backprop uses one number to drive every weight update. The next scene shows how that single scalar travels backward through every layer of the model.`,
  ]

  return (
    <SplitPaneScene
      viz={<VizCELossBatch phase={phase} />}
      text={{
        kicker: 'ACT IV · LOSS · PER-BATCH',
        title: 'Average across the batch.',
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
          { label: 'batch size', value: `B = ${CELB_B}`, color: ACCENT.violet },
          { label: 'seq length', value: `T = ${CELB_T}`, color: ACCENT.blue },
          { label: 'losses / pass', value: `${CELB_B * CELB_T}` },
          { label: 'L_batch', value: CELB_LBATCH.toFixed(2), color: ACCENT.amber },
        ],
        equation: {
          label: 'one rule, B sequences',
          body: <>L_batch = (1/B) · Σᵢ L_seq(i)</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 24 — backprop: "The gradient flows back."
 *
 * Take the single scalar L_batch from Scene 23 and show how it becomes
 * a backward-moving gradient signal that traverses the (already-run)
 * model and produces ∂L/∂W at every block.
 *
 * Visual: a 6-block corridor in faint isometric perspective with the
 * input slab at the left and the gold loss node at the right. Forward
 * arrows ghost in blue along the top to remind the viewer that the
 * forward pass has already finished and activations are saved.
 *
 * Then a red pulse leaves the loss and sweeps right-to-left. As it
 * passes each block the block re-tints red, a small ∂L/∂W glyph appears
 * above it, and the pulse continues to the previous block. By the end
 * every block has its own gradient artifact and the loss has reached
 * the input. The caption locks in: "One backward pass computes
 * gradients for every weight."
 *
 * Three phases:
 *   beat 0 — forward, done. Blue corridor with saved activations,
 *            gold loss at right (L_batch = 1.59 from Scene 23).
 *   beat 1 — backward sweep. Red pulse traverses, blocks turn red one
 *            by one, ∂L/∂W glyphs reveal in sequence.
 *   beat 2 — all gradients in. Steady-state showing every block with
 *            its gradient and the closing line.
 * ====================================================================== */

const BP_VB_W = 1400
const BP_VB_H = 1000

const BP_BLOCKS = 6

// Floor (isometric ground plane). The whole stage stands on this.
// Front edge is the bottom of the screen; back edge sits up-and-right
// (the standard Act III isometric direction).
const BP_FLOOR_FRONT_Y = 760
const BP_FLOOR_BACK_Y = 580
const BP_FLOOR_LEFT_X = 50
const BP_FLOOR_RIGHT_X = 1300
const BP_FLOOR_DEPTH_DX = 110 // how far the back edge shifts right
const BP_FLOOR_DEPTH_DY = BP_FLOOR_FRONT_Y - BP_FLOOR_BACK_Y // 180

// Project a "floor" point given fractional depth t ∈ [0, 1] (0 = front,
// 1 = back) and screen-x along the front edge.
function bpFloorPoint(xFront: number, t: number): [number, number] {
  return [
    xFront + t * BP_FLOOR_DEPTH_DX,
    BP_FLOOR_FRONT_Y - t * BP_FLOOR_DEPTH_DY,
  ]
}

// Block dimensions (3D — front face standing upright on the floor)
const BP_BLOCK_W = 124
const BP_BLOCK_H = 320
const BP_BLOCK_DEPTH = 30 // up-right offset for top + right face

// Block standing position. Each block's bottom-front edge sits on the
// floor at depth t ≈ 0.7 (toward the back so the dL/dW tiles have room
// in the foreground in front of them).
const BP_BLOCK_FLOOR_T = 0.62
const BP_BLOCK_BOTTOM_Y = BP_FLOOR_FRONT_Y - BP_BLOCK_FLOOR_T * BP_FLOOR_DEPTH_DY
const BP_BLOCK_TOP_Y = BP_BLOCK_BOTTOM_Y - BP_BLOCK_H

// Block centers along the back-ish row.
const BP_BLOCK_FIRST_FRONT_X = 230 // x along the floor's FRONT edge
const BP_BLOCK_PITCH_FRONT = 152
function bpBlockCx(i: number): number {
  // block center is the front-x shifted by the depth-x offset
  return (
    BP_BLOCK_FIRST_FRONT_X +
    i * BP_BLOCK_PITCH_FRONT +
    BP_BLOCK_FLOOR_T * BP_FLOOR_DEPTH_DX
  )
}

// dL/dW tile (lies flat on the floor in foreground in front of each block)
const BP_TILE_FLOOR_T = 0.18
const BP_TILE_W = 78
const BP_TILE_H = 30 // foreshortened (it's lying flat in isometric)
const BP_TILE_GRID = 4 // 4×4 cells per tile
function bpTileCenter(i: number): [number, number] {
  // The tile sits at the same FRONT-x as the block but at a smaller depth
  const xFront = BP_BLOCK_FIRST_FRONT_X + i * BP_BLOCK_PITCH_FRONT
  return bpFloorPoint(xFront, BP_TILE_FLOOR_T)
}

// Loss node — at the right of the corridor at block mid-height.
const BP_LOSS_CX = 1230
const BP_LOSS_CY = BP_BLOCK_TOP_Y + BP_BLOCK_H * 0.42
const BP_LOSS_R = 56

// Backward pulse path — at block mid-height
const BP_PULSE_Y = BP_LOSS_CY
const BP_PULSE_START_X = BP_LOSS_CX
const BP_PULSE_END_X = bpBlockCx(0) - 70

// L_batch carried over from Scene 23
const BP_LBATCH = 1.59

/* ---------- 3D primitives ---------- */

/** Build the four corners of an isometric "tile" lying flat on the floor.
 *  cx, cy is the screen center of the tile (already a floor point). */
function bpTileCorners(cx: number, cy: number, w: number, h: number) {
  const halfW = w / 2
  const halfH = h / 2
  // Project depth axis as up-right at the same ratio as the floor.
  const depthRatio = BP_FLOOR_DEPTH_DX / BP_FLOOR_DEPTH_DY
  const dx = halfH * depthRatio
  const dy = halfH
  // 4 corners: front-left, front-right, back-right, back-left
  return [
    [cx - halfW - dx, cy + dy],
    [cx + halfW - dx, cy + dy],
    [cx + halfW + dx, cy - dy],
    [cx - halfW + dx, cy - dy],
  ] as const
}

/** Render one isometric block at index i. The `lit` flag (combined with
 *  per-block delay) flips the colour palette from forward (blue) → back
 *  (red) when the right→left pulse arrives. */
function BpBlock({
  i,
  lit,
  litDelayS,
  speed,
}: {
  i: number
  lit: boolean
  litDelayS: number
  speed: number
}) {
  const cx = bpBlockCx(i)
  const x = cx - BP_BLOCK_W / 2
  const y = BP_BLOCK_TOP_Y
  const w = BP_BLOCK_W
  const h = BP_BLOCK_H
  const d = BP_BLOCK_DEPTH

  const fwdEdge = ACCENT.blue
  const fwdFront = 'rgba(96,165,250,0.10)'
  const fwdTop = 'rgba(96,165,250,0.18)'
  const fwdRight = 'rgba(96,165,250,0.07)'
  const backEdge = ACCENT.red
  const backFront = 'rgba(248,113,113,0.16)'
  const backTop = 'rgba(248,113,113,0.26)'
  const backRight = 'rgba(248,113,113,0.10)'

  const topFace = `${x},${y} ${x + w},${y} ${x + w + d},${y - d} ${x + d},${y - d}`
  const rightFace = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`

  const transition = `fill ${0.4 / speed}s ease ${litDelayS / speed}s, stroke ${0.4 / speed}s ease ${litDelayS / speed}s`

  // Internal weight grid — 4×4 cells centered in front face
  const GRID = 4
  const cellSize = 18
  const cellGap = 4
  const gridW = GRID * cellSize + (GRID - 1) * cellGap
  const gridX = cx - gridW / 2
  const gridY = y + 70

  return (
    <g>
      {/* Soft floor shadow */}
      <ellipse
        cx={cx + d / 3}
        cy={BP_BLOCK_BOTTOM_Y + 8}
        rx={w * 0.55}
        ry={9}
        fill="rgba(0,0,0,0.55)"
        opacity={0.7}
      />
      {/* Right face (shadowed) */}
      <polygon
        points={rightFace}
        fill={lit ? backRight : fwdRight}
        stroke={lit ? backEdge : fwdEdge}
        strokeOpacity={0.55}
        strokeWidth={1}
        style={{ transition }}
      />
      {/* Top face (lit) */}
      <polygon
        points={topFace}
        fill={lit ? backTop : fwdTop}
        stroke={lit ? backEdge : fwdEdge}
        strokeOpacity={0.6}
        strokeWidth={1}
        style={{ transition }}
      />
      {/* Front face (translucent) */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill={lit ? backFront : fwdFront}
        stroke={lit ? backEdge : fwdEdge}
        strokeOpacity={0.7}
        strokeWidth={1.4}
        style={{ transition }}
      />
      {/* Top-edge highlight */}
      <line
        x1={x + 4}
        x2={x + w - 4}
        y1={y + 1.5}
        y2={y + 1.5}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={0.8}
      />

      {/* Block label above the top face */}
      <text
        x={cx}
        y={y - d - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={lit ? ACCENT.red : ACCENT.dim}
        style={{ transition: `fill ${0.4 / speed}s ease ${litDelayS / speed}s` }}
      >
        BLOCK {i}
      </text>

      {/* Internal weight grid (visible through translucent front face) */}
      <g>
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const seed = i * 41 + r * 13 + c * 5
            const a = 0.30 + ((Math.sin(seed * 0.91) + 1) / 2) * 0.45
            return (
              <rect
                key={`w-${i}-${r}-${c}`}
                x={gridX + c * (cellSize + cellGap)}
                y={gridY + r * (cellSize + cellGap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={lit ? backEdge : fwdEdge}
                opacity={a}
                style={{ transition: `fill ${0.4 / speed}s ease ${litDelayS / speed}s` }}
              />
            )
          }),
        )}
      </g>

      {/* "weights W_i" label below the grid */}
      <text
        x={cx}
        y={gridY + GRID * (cellSize + cellGap) + 14}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        letterSpacing="0.18em"
        fill="rgba(255,255,255,0.45)"
      >
        weights W_{i}
      </text>

      {/* Saved-activations strip lower in the block (faint mint) */}
      <g transform={`translate(${cx - 38}, ${y + h - 70})`}>
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 4 }, (_, c) => (
            <rect
              key={`a-${i}-${r}-${c}`}
              x={c * 11}
              y={r * 8}
              width={9}
              height={6}
              rx={1.5}
              fill={ACCENT.mint}
              opacity={0.18 + ((Math.sin(i + r * 0.3 + c * 0.5) + 1) / 2) * 0.30}
            />
          )),
        )}
      </g>
      <text
        x={cx}
        y={y + h - 14}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        letterSpacing="0.18em"
        fill="rgba(52,211,153,0.55)"
      >
        saved a_{i}
      </text>
    </g>
  )
}

/** ∂L/∂W tile — a parallelogram lying flat on the floor in front of
 *  block i. Cells are tiny red parallelograms that fill in when lit. */
function BpGradTile({
  i,
  lit,
  litDelayS,
  speed,
}: {
  i: number
  lit: boolean
  litDelayS: number
  speed: number
}) {
  const [cx, cy] = bpTileCenter(i)
  const corners = bpTileCorners(cx, cy, BP_TILE_W, BP_TILE_H)
  const polyPoints = corners.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const G = BP_TILE_GRID
  const [fl, fr, br, bl] = corners

  function P(u: number, v: number): [number, number] {
    const x =
      (1 - u) * (1 - v) * fl[0] +
      u * (1 - v) * fr[0] +
      u * v * br[0] +
      (1 - u) * v * bl[0]
    const y =
      (1 - u) * (1 - v) * fl[1] +
      u * (1 - v) * fr[1] +
      u * v * br[1] +
      (1 - u) * v * bl[1]
    return [x, y]
  }
  function cellQuad(r: number, c: number) {
    const u0 = c / G
    const u1 = (c + 1) / G
    const v0 = r / G
    const v1 = (r + 1) / G
    const a = P(u0, v0)
    const b = P(u1, v0)
    const cc = P(u1, v1)
    const dd = P(u0, v1)
    return `${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} ${cc[0].toFixed(1)},${cc[1].toFixed(1)} ${dd[0].toFixed(1)},${dd[1].toFixed(1)}`
  }

  const transition = `opacity ${0.5 / speed}s ease ${litDelayS / speed}s`

  return (
    <g>
      {/* Tile border (faint when forward, lit when backward) */}
      <polygon
        points={polyPoints}
        fill={lit ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.025)'}
        stroke={lit ? ACCENT.red : 'rgba(255,255,255,0.15)'}
        strokeWidth={1.3}
        style={{
          transition: `fill ${0.5 / speed}s ease ${litDelayS / speed}s, stroke ${0.5 / speed}s ease ${litDelayS / speed}s`,
        }}
      />
      {/* Cell quads — only visible when lit */}
      {Array.from({ length: G }, (_, r) =>
        Array.from({ length: G }, (_, c) => {
          const seed = i * 17 + r * 5 + c * 3
          const a = 0.45 + ((Math.sin(seed * 0.7) + 1) / 2) * 0.40
          return (
            <polygon
              key={`gc-${i}-${r}-${c}`}
              points={cellQuad(r, c)}
              fill={ACCENT.red}
              opacity={lit ? a : 0}
              style={{ transition }}
            />
          )
        }),
      )}
      {/* Falling-arrow connector from block base down to the tile */}
      <line
        x1={bpBlockCx(i)}
        x2={cx}
        y1={BP_BLOCK_BOTTOM_Y + 12}
        y2={cy - BP_TILE_H / 2 - 2}
        stroke={ACCENT.red}
        strokeWidth={1.2}
        strokeDasharray="3 4"
        opacity={lit ? 0.55 : 0}
        style={{ transition }}
      />
      {/* "∂L/∂W_i" label below the tile (closer to viewer) */}
      <text
        x={fl[0] + (fr[0] - fl[0]) / 2}
        y={fl[1] + 18}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill={lit ? ACCENT.red : 'rgba(255,255,255,0.30)'}
        style={{ transition: `fill ${0.5 / speed}s ease ${litDelayS / speed}s` }}
      >
        ∂L/∂W_{i}
      </text>
    </g>
  )
}

/* ---------- Scene 24 viz ---------- */

export function VizBackprop({ phase }: { phase: number }) {
  const speed = useSpeed()

  // beat 0 — forward state, no pulse
  // beat 1 — pulse sweeps right→left, blocks light red one by one,
  //          ∂L/∂W tiles glow on the floor
  // beat 2 — all blocks red, all tiles glowing, closing line
  const sweepStarted = phase >= 1
  const sweepDone = phase >= 2

  // Sweep timing: total length 3.4s. Block at index BP_BLOCKS-1 (rightmost)
  // lights first, then leftward.
  const SWEEP_TOTAL_S = 3.4
  const stepS = SWEEP_TOTAL_S / (BP_BLOCKS + 1)

  return (
    <svg viewBox={`0 0 ${BP_VB_W} ${BP_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bp-loss-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ACCENT.amber} stopOpacity="0.85" />
          <stop offset="55%" stopColor={ACCENT.amber} stopOpacity="0.30" />
          <stop offset="100%" stopColor={ACCENT.amber} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bp-pulse-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ACCENT.red} stopOpacity="0.95" />
          <stop offset="60%" stopColor={ACCENT.red} stopOpacity="0.25" />
          <stop offset="100%" stopColor={ACCENT.red} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bp-floor-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(167,139,250,0.04)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.16)" />
        </linearGradient>
        <filter id="bp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bp-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* ===================== HEADER ===================== */}
      <text
        x={BP_VB_W / 2}
        y={62}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        ONE LOSS · ONE BACKWARD PASS · ONE ∂L/∂W PER LAYER
      </text>
      <text
        x={BP_VB_W / 2}
        y={100}
        textAnchor="middle"
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="24"
        fill="rgba(255,255,255,0.85)"
      >
        The error signal walks back through saved activations.
      </text>

      {/* ===================== FLOOR PLANE ===================== */}
      {(() => {
        const fl = bpFloorPoint(BP_FLOOR_LEFT_X, 0)
        const fr = bpFloorPoint(BP_FLOOR_RIGHT_X, 0)
        const br = bpFloorPoint(BP_FLOOR_RIGHT_X, 1)
        const bl = bpFloorPoint(BP_FLOOR_LEFT_X, 1)
        const floorPoly = `${fl[0]},${fl[1]} ${fr[0]},${fr[1]} ${br[0]},${br[1]} ${bl[0]},${bl[1]}`
        const verticalLines: ReactNode[] = []
        for (let x = BP_FLOOR_LEFT_X + 120; x < BP_FLOOR_RIGHT_X; x += 140) {
          const [x0, y0] = bpFloorPoint(x, 0)
          const [x1, y1] = bpFloorPoint(x, 1)
          verticalLines.push(
            <line
              key={`fv-${x}`}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke="rgba(167,139,250,0.10)"
              strokeWidth={0.6}
            />,
          )
        }
        const horizontalLines: ReactNode[] = []
        for (const t of [0.25, 0.5, 0.75]) {
          const [x0, y0] = bpFloorPoint(BP_FLOOR_LEFT_X, t)
          const [x1, y1] = bpFloorPoint(BP_FLOOR_RIGHT_X, t)
          horizontalLines.push(
            <line
              key={`fh-${t}`}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke="rgba(167,139,250,0.10)"
              strokeWidth={0.6}
            />,
          )
        }
        return (
          <g>
            <polygon
              points={floorPoly}
              fill="url(#bp-floor-fade)"
              stroke="rgba(167,139,250,0.18)"
              strokeWidth={0.8}
            />
            {verticalLines}
            {horizontalLines}
          </g>
        )
      })()}

      {/* ===================== FORWARD ARROW (top, faint blue) ===================== */}
      <g opacity={0.55}>
        <text
          x={bpBlockCx(0) - BP_BLOCK_W / 2}
          y={BP_BLOCK_TOP_Y - BP_BLOCK_DEPTH - 36}
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.22em"
          fill={ACCENT.blue}
        >
          FORWARD · activations saved
        </text>
        <line
          x1={bpBlockCx(0) - BP_BLOCK_W / 2}
          x2={BP_LOSS_CX + BP_LOSS_R - 6}
          y1={BP_BLOCK_TOP_Y - BP_BLOCK_DEPTH - 18}
          y2={BP_BLOCK_TOP_Y - BP_BLOCK_DEPTH - 18}
          stroke={ACCENT.blue}
          strokeOpacity={0.5}
          strokeWidth={1.2}
          strokeDasharray="6 5"
        />
        <polyline
          points={`${BP_LOSS_CX + BP_LOSS_R - 14},${BP_BLOCK_TOP_Y - BP_BLOCK_DEPTH - 22} ${BP_LOSS_CX + BP_LOSS_R - 6},${BP_BLOCK_TOP_Y - BP_BLOCK_DEPTH - 18} ${BP_LOSS_CX + BP_LOSS_R - 14},${BP_BLOCK_TOP_Y - BP_BLOCK_DEPTH - 14}`}
          fill="none"
          stroke={ACCENT.blue}
          strokeWidth={1.4}
          strokeOpacity={0.7}
        />
      </g>

      {/* ===================== BACKWARD GLOW LANE (mid-block height) ===================== */}
      <g
        style={{
          opacity: sweepStarted ? 1 : 0,
          transition: `opacity ${0.4 / speed}s ease`,
        }}
      >
        <line
          x1={BP_PULSE_END_X}
          x2={BP_PULSE_START_X}
          y1={BP_PULSE_Y}
          y2={BP_PULSE_Y}
          stroke={ACCENT.red}
          strokeOpacity={0.10}
          strokeWidth={28}
          filter="url(#bp-soft)"
        />
        <line
          x1={BP_PULSE_END_X}
          x2={BP_PULSE_START_X}
          y1={BP_PULSE_Y}
          y2={BP_PULSE_Y}
          stroke={ACCENT.red}
          strokeOpacity={0.55}
          strokeWidth={1.6}
          strokeDasharray="6 6"
        />
        <polyline
          points={`${BP_PULSE_END_X + 10},${BP_PULSE_Y - 6} ${BP_PULSE_END_X},${BP_PULSE_Y} ${BP_PULSE_END_X + 10},${BP_PULSE_Y + 6}`}
          fill="none"
          stroke={ACCENT.red}
          strokeWidth={1.7}
        />
      </g>

      {/* ===================== BLOCKS ===================== */}
      {Array.from({ length: BP_BLOCKS }, (_, i) => {
        const litDelayS = (BP_BLOCKS - 1 - i) * stepS + 0.15
        return (
          <BpBlock
            key={`bp-block-${i}`}
            i={i}
            lit={sweepStarted}
            litDelayS={litDelayS}
            speed={speed}
          />
        )
      })}

      {/* ===================== LOSS NODE ===================== */}
      <g>
        <circle
          cx={BP_LOSS_CX}
          cy={BP_LOSS_CY}
          r={BP_LOSS_R + 14}
          fill="url(#bp-loss-glow)"
        />
        <circle
          cx={BP_LOSS_CX}
          cy={BP_LOSS_CY}
          r={BP_LOSS_R}
          fill="rgba(245,158,11,0.20)"
          stroke={ACCENT.amber}
          strokeWidth={1.6}
          filter="url(#bp-glow)"
        />
        <text
          x={BP_LOSS_CX}
          y={BP_LOSS_CY - 10}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.22em"
          fill={ACCENT.amber}
        >
          L_BATCH
        </text>
        <text
          x={BP_LOSS_CX}
          y={BP_LOSS_CY + 18}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="26"
          fill={ACCENT.amber}
        >
          {BP_LBATCH.toFixed(2)}
        </text>
      </g>

      {/* ===================== ∂L/∂W TILES ON FLOOR ===================== */}
      {Array.from({ length: BP_BLOCKS }, (_, i) => {
        const litDelayS = (BP_BLOCKS - 1 - i) * stepS + 0.30
        return (
          <BpGradTile
            key={`bp-tile-${i}`}
            i={i}
            lit={sweepStarted}
            litDelayS={litDelayS}
            speed={speed}
          />
        )
      })}

      {/* ===================== TRAVELING PULSE (drawn last) ===================== */}
      <g
        style={{
          opacity: sweepStarted && !sweepDone ? 1 : 0,
          transition: `opacity ${0.3 / speed}s ease`,
        }}
      >
        <circle
          cx={BP_PULSE_END_X}
          cy={BP_PULSE_Y}
          r={28}
          fill="url(#bp-pulse-glow)"
          style={{
            transform: sweepStarted
              ? `translateX(0px)`
              : `translateX(${BP_PULSE_START_X - BP_PULSE_END_X}px)`,
            transition: sweepStarted
              ? `transform ${SWEEP_TOTAL_S / speed}s linear`
              : 'none',
          }}
        />
        <circle
          cx={BP_PULSE_END_X}
          cy={BP_PULSE_Y}
          r={9}
          fill={ACCENT.red}
          filter="url(#bp-glow)"
          style={{
            transform: sweepStarted
              ? `translateX(0px)`
              : `translateX(${BP_PULSE_START_X - BP_PULSE_END_X}px)`,
            transition: sweepStarted
              ? `transform ${SWEEP_TOTAL_S / speed}s linear`
              : 'none',
          }}
        />
      </g>

      {/* ===================== LEGEND ===================== */}
      <g transform={`translate(${BP_FLOOR_LEFT_X + 20}, ${BP_FLOOR_FRONT_Y + 12})`}>
        <rect x={0} y={0} width={12} height={12} rx={2} fill={ACCENT.blue} opacity={0.7} />
        <text
          x={20}
          y={10}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="rgba(255,255,255,0.65)"
        >
          forward activations (saved)
        </text>
        <rect x={230} y={0} width={12} height={12} rx={2} fill={ACCENT.red} opacity={0.85} />
        <text
          x={250}
          y={10}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="rgba(255,255,255,0.65)"
        >
          backward gradients (flowing)
        </text>
      </g>

      {/* ===================== ENDING CAPTION ===================== */}
      <g
        style={{
          opacity: sweepDone ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        <text
          x={BP_VB_W / 2}
          y={BP_VB_H - 78}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="20"
          fill={ACCENT.red}
        >
          One backward pass → one ∂L/∂W per layer.
        </text>
        <text
          x={BP_VB_W / 2}
          y={BP_VB_H - 56}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          NEXT · THE OPTIMIZER USES THESE GRADIENTS TO STEP THE WEIGHTS
        </text>
      </g>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${BP_VB_W / 2}, ${BP_VB_H - 26})`}>
        {(['forward · saved', 'backward sweep', 'all gradients in'] as const).map((label, i) => {
          const w = 220
          const gap = 18
          const total = 3 * w + 2 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`bp-beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-12}
                width={w}
                height={24}
                rx={12}
                fill={active ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.red : ACCENT.rule}
                strokeWidth={1.2}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="0.18em"
                fill={active ? ACCENT.red : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function BackpropSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      6000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const phaseLabels = ['forward · saved', 'backward sweep', 'all gradients in']

  const subtitleByPhase: ReactNode[] = [
    <>
      Scene 23 produced one scalar: <em>L_batch</em> = {BP_LBATCH.toFixed(2)}.
      The forward pass already ran and every block kept its activations
      around. Now the gradient signal will travel back through that same
      chain.
    </>,
    <>
      A red error pulse leaves the loss and sweeps right-to-left. As it
      reaches each block, that block uses its saved activations and a
      local Jacobian to compute <em>∂L/∂W</em> for its own weights and
      the incoming gradient for the layer to its left.
    </>,
    <>
      Every layer ends up with its own ∂L/∂W. The model itself didn&apos;t
      run backward — the <em>error signal</em> propagated backward through
      the computation graph. The next two scenes zoom into one block&apos;s
      Jacobian and into batched gradient accumulation.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'Without saved activations there is no backprop. Frameworks like PyTorch and JAX track the forward graph automatically; tinygrad does it manually but in <500 lines.',
    'Chain rule, mechanically: incoming gradient × local derivative = outgoing gradient + a term for ∂L/∂W. Every layer only needs to know its own local Jacobian — the chain-rule plumbing handles the rest.',
    'For a 12-block GPT-2 small with ~125M parameters, one backward pass touches every one of those parameters and produces 125M scalar gradients. Each one tells the optimizer how to nudge that weight to make L_batch smaller.',
  ]

  return (
    <SplitPaneScene
      viz={<VizBackprop phase={phase} />}
      text={{
        kicker: 'ACT IV · BACKPROP · OVERVIEW',
        title: 'The gradient flows back.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.red,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.red}
          />
        ),
        stats: [
          { label: 'starts at', value: `L_batch = ${BP_LBATCH.toFixed(2)}`, color: ACCENT.amber },
          { label: 'direction', value: 'right → left', color: ACCENT.red },
          { label: 'per block', value: '∂L/∂W_i', color: ACCENT.red },
          { label: 'depends on', value: 'saved acts', color: ACCENT.mint },
        ],
        equation: {
          label: 'chain rule, layer by layer',
          body: <>∂L/∂W_l = ∂L/∂y · ∂y/∂W_l</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 25 — bp-jacobian: "What each layer contributes."
 *
 * Zoom into one block from Scene 24 and show what happens locally when
 * the backward gradient reaches it.
 *
 *   forward (saved):   x  →  layer  →  y     (blue)
 *   the Jacobian:     ∂y/∂x  is the local sensitivity map
 *   backward:         ∂L/∂y  ×  ∂y/∂x   =   ∂L/∂x
 *                     incoming    Jacobian    outgoing
 *   weight gradient:  the same local info gives ∂L/∂W
 *
 * Four beats:
 *
 *   beat 0 — isolate. One translucent block at center, x and y vectors
 *            on the sides in blue, Jacobian plane visible but faint.
 *   beat 1 — one cell. Highlight ∂y₂/∂x₁: when x₁ wiggles, y₂ wiggles.
 *            Lines connect cell → x₁ and cell → y₂.
 *   beat 2 — backward conversion. A red ∂L/∂y vector enters from the
 *            right, passes through the (now fully lit) Jacobian, and
 *            exits left as ∂L/∂x. The whole Jacobian glows red.
 *   beat 3 — also the weight gradient. A small ∂L/∂W tile drops onto
 *            the floor below the block in the same isometric idiom as
 *            Scene 24, completing the "two outputs" story.
 * ====================================================================== */

const BPJ_VB_W = 1400
const BPJ_VB_H = 1000

// One central block (echo of Scene 24's BpBlock idiom).
const BPJ_BLOCK_X = 450
const BPJ_BLOCK_Y = 240
const BPJ_BLOCK_W = 500
const BPJ_BLOCK_H = 440
const BPJ_BLOCK_DEPTH = 36

// Jacobian heatmap plane inside the front face. 5×5 cells.
const BPJ_J_SIZE = 5
const BPJ_J_CELL = 56
const BPJ_J_GAP = 5
const BPJ_J_W = BPJ_J_SIZE * BPJ_J_CELL + (BPJ_J_SIZE - 1) * BPJ_J_GAP // 300
const BPJ_J_X = BPJ_BLOCK_X + (BPJ_BLOCK_W - BPJ_J_W) / 2
const BPJ_J_Y = BPJ_BLOCK_Y + 84

function bpjCellX(c: number) {
  return BPJ_J_X + c * (BPJ_J_CELL + BPJ_J_GAP)
}
function bpjCellY(r: number) {
  return BPJ_J_Y + r * (BPJ_J_CELL + BPJ_J_GAP)
}

// Highlighted cell for beat 1: ∂y₂/∂x₁ → row 1 (y₂, 0-indexed = 1), col 0 (x₁, 0-indexed = 0)
const BPJ_HIGH_ROW = 1
const BPJ_HIGH_COL = 0

// Input vector x — column on left of the block.
const BPJ_X_VEC_X = 250
const BPJ_X_VEC_Y = BPJ_J_Y
const BPJ_X_CELL = BPJ_J_CELL
const BPJ_X_GAP = BPJ_J_GAP

// Output vector y — column on right of the block.
const BPJ_Y_VEC_X = BPJ_BLOCK_X + BPJ_BLOCK_W + 60
const BPJ_Y_VEC_Y = BPJ_J_Y

// ∂L/∂W tile (echo of Scene 24's gradient tile)
const BPJ_TILE_CX = BPJ_BLOCK_X + BPJ_BLOCK_W / 2
const BPJ_TILE_CY = BPJ_BLOCK_Y + BPJ_BLOCK_H + 90
const BPJ_TILE_W = 220
const BPJ_TILE_H = 50
const BPJ_TILE_GRID = 4

// Deterministic Jacobian "magnitude" per cell — drives heatmap intensity.
function bpjMag(r: number, c: number): number {
  const seed = r * 13 + c * 7 + 1
  return 0.3 + ((Math.sin(seed * 0.91) + 1) / 2) * 0.65
}

export function VizBpJacobian({ phase }: { phase: number }) {
  const speed = useSpeed()

  const showOneCell = phase >= 1
  const showFullJacobian = phase >= 2
  const showBackward = phase >= 2
  const showWeightGrad = phase >= 3

  // Block face polygons
  const x = BPJ_BLOCK_X
  const y = BPJ_BLOCK_Y
  const w = BPJ_BLOCK_W
  const h = BPJ_BLOCK_H
  const d = BPJ_BLOCK_DEPTH
  const topFace = `${x},${y} ${x + w},${y} ${x + w + d},${y - d} ${x + d},${y - d}`
  const rightFace = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`

  return (
    <svg viewBox={`0 0 ${BPJ_VB_W} ${BPJ_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bpj-pulse-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ACCENT.red} stopOpacity="0.95" />
          <stop offset="60%" stopColor={ACCENT.red} stopOpacity="0.25" />
          <stop offset="100%" stopColor={ACCENT.red} stopOpacity="0" />
        </radialGradient>
        <filter id="bpj-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== HEADER ===================== */}
      <text
        x={BPJ_VB_W / 2}
        y={62}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        ONE LAYER · LOCAL SENSITIVITY MAP · GRADIENT CONVERTER
      </text>
      <text
        x={BPJ_VB_W / 2}
        y={100}
        textAnchor="middle"
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="24"
        fill="rgba(255,255,255,0.85)"
      >
        How a layer transforms the gradient passing through it.
      </text>

      {/* ===================== INPUT VECTOR x (left) ===================== */}
      <g>
        <text
          x={BPJ_X_VEC_X + BPJ_X_CELL / 2}
          y={BPJ_X_VEC_Y - 16}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.blue}
        >
          INPUT  x
        </text>
        {Array.from({ length: BPJ_J_SIZE }, (_, r) => {
          const cy = BPJ_X_VEC_Y + r * (BPJ_X_CELL + BPJ_X_GAP)
          const isX1 = r === BPJ_HIGH_COL
          return (
            <g key={`x-${r}`}>
              <rect
                x={BPJ_X_VEC_X}
                y={cy}
                width={BPJ_X_CELL}
                height={BPJ_X_CELL}
                rx={4}
                fill="rgba(96,165,250,0.18)"
                stroke={ACCENT.blue}
                strokeOpacity={isX1 && showOneCell ? 1 : 0.4}
                strokeWidth={isX1 && showOneCell ? 1.8 : 1}
                style={{ transition: `stroke-opacity ${0.3 / speed}s ease, stroke-width ${0.3 / speed}s ease` }}
              />
              <text
                x={BPJ_X_VEC_X + BPJ_X_CELL / 2}
                y={cy + BPJ_X_CELL / 2 + 5}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="14"
                fill={ACCENT.blue}
              >
                x
                <tspan dy="3" fontSize="10">{r + 1}</tspan>
              </text>
            </g>
          )
        })}
      </g>

      {/* ===================== TRANSLUCENT BLOCK (cutaway) ===================== */}
      <g>
        {/* Floor shadow under block */}
        <ellipse
          cx={BPJ_BLOCK_X + BPJ_BLOCK_W / 2 + d / 3}
          cy={BPJ_BLOCK_Y + BPJ_BLOCK_H + 8}
          rx={BPJ_BLOCK_W * 0.46}
          ry={11}
          fill="rgba(0,0,0,0.55)"
          opacity={0.7}
        />
        {/* Right face (shadowed) */}
        <polygon
          points={rightFace}
          fill={showBackward ? 'rgba(248,113,113,0.10)' : 'rgba(96,165,250,0.07)'}
          stroke={showBackward ? ACCENT.red : ACCENT.blue}
          strokeOpacity={0.55}
          strokeWidth={1}
          style={{ transition: `fill ${0.4 / speed}s ease, stroke ${0.4 / speed}s ease` }}
        />
        {/* Top face (lit) */}
        <polygon
          points={topFace}
          fill={showBackward ? 'rgba(248,113,113,0.20)' : 'rgba(96,165,250,0.18)'}
          stroke={showBackward ? ACCENT.red : ACCENT.blue}
          strokeOpacity={0.6}
          strokeWidth={1}
          style={{ transition: `fill ${0.4 / speed}s ease, stroke ${0.4 / speed}s ease` }}
        />
        {/* Front face (translucent) */}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={6}
          fill={showBackward ? 'rgba(248,113,113,0.10)' : 'rgba(96,165,250,0.08)'}
          stroke={showBackward ? ACCENT.red : ACCENT.blue}
          strokeOpacity={0.7}
          strokeWidth={1.4}
          style={{ transition: `fill ${0.4 / speed}s ease, stroke ${0.4 / speed}s ease` }}
        />
        {/* Top edge highlight */}
        <line
          x1={x + 4}
          x2={x + w - 4}
          y1={y + 1.5}
          y2={y + 1.5}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={0.8}
        />

        {/* Block label */}
        <text
          x={BPJ_BLOCK_X + BPJ_BLOCK_W / 2}
          y={BPJ_BLOCK_Y - d - 8}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={showBackward ? ACCENT.red : ACCENT.dim}
          style={{ transition: `fill ${0.4 / speed}s ease` }}
        >
          ONE LAYER
        </text>
      </g>

      {/* ===================== JACOBIAN HEATMAP PLANE ===================== */}
      {/* Header text just above the matrix, inside the block */}
      <text
        x={BPJ_BLOCK_X + BPJ_BLOCK_W / 2}
        y={BPJ_J_Y - 22}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill="rgba(255,255,255,0.55)"
      >
        ∂y / ∂x  ·  the layer&apos;s local sensitivity map
      </text>

      {/* Cells */}
      {Array.from({ length: BPJ_J_SIZE }, (_, r) =>
        Array.from({ length: BPJ_J_SIZE }, (_, c) => {
          const cellX = bpjCellX(c)
          const cellY = bpjCellY(r)
          const mag = bpjMag(r, c)
          const isHigh = r === BPJ_HIGH_ROW && c === BPJ_HIGH_COL
          // Forward state: faint blue. After phase 2, all cells red.
          // Phase 1: only the highlighted cell is bright.
          let opacity: number
          let fill: string
          if (showFullJacobian) {
            fill = ACCENT.red
            opacity = mag
          } else if (showOneCell && isHigh) {
            fill = ACCENT.amber
            opacity = 0.85
          } else {
            fill = ACCENT.blue
            opacity = mag * 0.45
          }
          return (
            <rect
              key={`j-${r}-${c}`}
              x={cellX}
              y={cellY}
              width={BPJ_J_CELL}
              height={BPJ_J_CELL}
              rx={4}
              fill={fill}
              opacity={opacity}
              stroke={isHigh && showOneCell ? ACCENT.amber : 'rgba(255,255,255,0.06)'}
              strokeWidth={isHigh && showOneCell ? 2 : 1}
              style={{ transition: `fill ${0.45 / speed}s ease, opacity ${0.45 / speed}s ease, stroke ${0.45 / speed}s ease, stroke-width ${0.45 / speed}s ease` }}
            />
          )
        }),
      )}

      {/* "∂y₂/∂x₁" callout for the highlighted cell — visible in beat 1 */}
      {(() => {
        const cellCx = bpjCellX(BPJ_HIGH_COL) + BPJ_J_CELL / 2
        const cellCy = bpjCellY(BPJ_HIGH_ROW) + BPJ_J_CELL / 2
        const calloutX = BPJ_BLOCK_X + BPJ_BLOCK_W / 2
        const calloutY = BPJ_J_Y + BPJ_J_SIZE * (BPJ_J_CELL + BPJ_J_GAP) + 24
        // Show only in beat 1 (single-cell highlight)
        const visible = showOneCell && !showFullJacobian
        return (
          <g
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity ${0.4 / speed}s ease`,
            }}
          >
            {/* dashed connector cell → callout */}
            <line
              x1={cellCx}
              x2={calloutX}
              y1={cellCy}
              y2={calloutY - 16}
              stroke={ACCENT.amber}
              strokeOpacity={0.65}
              strokeWidth={1.2}
              strokeDasharray="3 4"
            />
            <rect
              x={calloutX - 168}
              y={calloutY - 14}
              width={336}
              height={36}
              rx={18}
              fill="rgba(245,158,11,0.16)"
              stroke={ACCENT.amber}
              strokeWidth={1.4}
            />
            <text
              x={calloutX}
              y={calloutY + 10}
              textAnchor="middle"
              fontFamily="var(--font-display, Georgia, serif)"
              fontStyle="italic"
              fontSize="16"
              fill={ACCENT.amber}
            >
              ∂y
              <tspan dy="3" fontSize="11">2</tspan>
              <tspan dy="-3"> / ∂x</tspan>
              <tspan dy="3" fontSize="11">1</tspan>
              <tspan dy="-3">  —  if x</tspan>
              <tspan dy="3" fontSize="11">1</tspan>
              <tspan dy="-3"> wiggles, this is how y</tspan>
              <tspan dy="3" fontSize="11">2</tspan>
              <tspan dy="-3"> wiggles</tspan>
            </text>
          </g>
        )
      })()}

      {/* ===================== OUTPUT VECTOR y (right) ===================== */}
      <g>
        <text
          x={BPJ_Y_VEC_X + BPJ_X_CELL / 2}
          y={BPJ_Y_VEC_Y - 16}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.blue}
        >
          OUTPUT  y
        </text>
        {Array.from({ length: BPJ_J_SIZE }, (_, r) => {
          const cy = BPJ_Y_VEC_Y + r * (BPJ_X_CELL + BPJ_X_GAP)
          const isY2 = r === BPJ_HIGH_ROW
          return (
            <g key={`y-${r}`}>
              <rect
                x={BPJ_Y_VEC_X}
                y={cy}
                width={BPJ_X_CELL}
                height={BPJ_X_CELL}
                rx={4}
                fill="rgba(96,165,250,0.18)"
                stroke={ACCENT.blue}
                strokeOpacity={isY2 && showOneCell ? 1 : 0.4}
                strokeWidth={isY2 && showOneCell ? 1.8 : 1}
                style={{ transition: `stroke-opacity ${0.3 / speed}s ease, stroke-width ${0.3 / speed}s ease` }}
              />
              <text
                x={BPJ_Y_VEC_X + BPJ_X_CELL / 2}
                y={cy + BPJ_X_CELL / 2 + 5}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="14"
                fill={ACCENT.blue}
              >
                y
                <tspan dy="3" fontSize="10">{r + 1}</tspan>
              </text>
            </g>
          )
        })}
      </g>

      {/* ===================== FORWARD ARROWS (faint blue) ===================== */}
      <g opacity={0.45}>
        {/* x → block */}
        <line
          x1={BPJ_X_VEC_X + BPJ_X_CELL + 10}
          x2={BPJ_BLOCK_X - 4}
          y1={BPJ_X_VEC_Y + (BPJ_J_SIZE * (BPJ_X_CELL + BPJ_X_GAP)) / 2 - BPJ_X_GAP / 2}
          y2={BPJ_X_VEC_Y + (BPJ_J_SIZE * (BPJ_X_CELL + BPJ_X_GAP)) / 2 - BPJ_X_GAP / 2}
          stroke={ACCENT.blue}
          strokeWidth={1.4}
          strokeDasharray="6 4"
        />
        {/* block → y */}
        <line
          x1={BPJ_BLOCK_X + BPJ_BLOCK_W + 4}
          x2={BPJ_Y_VEC_X - 10}
          y1={BPJ_X_VEC_Y + (BPJ_J_SIZE * (BPJ_X_CELL + BPJ_X_GAP)) / 2 - BPJ_X_GAP / 2}
          y2={BPJ_X_VEC_Y + (BPJ_J_SIZE * (BPJ_X_CELL + BPJ_X_GAP)) / 2 - BPJ_X_GAP / 2}
          stroke={ACCENT.blue}
          strokeWidth={1.4}
          strokeDasharray="6 4"
        />
      </g>

      {/* ===================== BACKWARD GRADIENT VECTORS (red) ===================== */}
      {/* Incoming ∂L/∂y on the right (above output column), outgoing ∂L/∂x
          on the left (above input column). Both visible in beat 2+. */}
      <g
        style={{
          opacity: showBackward ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {/* Top backward lane label */}
        <text
          x={BPJ_VB_W / 2}
          y={BPJ_J_Y - 56}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.red}
        >
          BACKWARD ·  ∂L/∂y  ENTERS RIGHT,  ∂L/∂x  EXITS LEFT
        </text>

        {/* Wide red glow band running across mid-height of block */}
        {(() => {
          const laneY = BPJ_J_Y + (BPJ_J_SIZE * (BPJ_J_CELL + BPJ_J_GAP)) / 2 - BPJ_J_GAP / 2
          return (
            <g>
              <line
                x1={BPJ_X_VEC_X + BPJ_X_CELL + 4}
                x2={BPJ_Y_VEC_X - 4}
                y1={laneY}
                y2={laneY}
                stroke={ACCENT.red}
                strokeOpacity={0.10}
                strokeWidth={28}
              />
              <line
                x1={BPJ_X_VEC_X + BPJ_X_CELL + 8}
                x2={BPJ_Y_VEC_X - 8}
                y1={laneY}
                y2={laneY}
                stroke={ACCENT.red}
                strokeOpacity={0.55}
                strokeWidth={1.6}
                strokeDasharray="6 6"
              />
              <polyline
                points={`${BPJ_X_VEC_X + BPJ_X_CELL + 14},${laneY - 6} ${BPJ_X_VEC_X + BPJ_X_CELL + 4},${laneY} ${BPJ_X_VEC_X + BPJ_X_CELL + 14},${laneY + 6}`}
                fill="none"
                stroke={ACCENT.red}
                strokeWidth={1.8}
              />
            </g>
          )
        })()}

        {/* Incoming gradient vector ∂L/∂y — red column on the right */}
        {Array.from({ length: BPJ_J_SIZE }, (_, r) => {
          const cy = BPJ_Y_VEC_Y + r * (BPJ_X_CELL + BPJ_X_GAP)
          const cellX = BPJ_Y_VEC_X + BPJ_X_CELL + 18
          return (
            <rect
              key={`dy-${r}`}
              x={cellX}
              y={cy + 8}
              width={BPJ_X_CELL - 16}
              height={BPJ_X_CELL - 16}
              rx={3}
              fill={ACCENT.red}
              opacity={0.55 + 0.30 * Math.sin(r * 0.7 + 1)}
            />
          )
        })}
        <text
          x={BPJ_Y_VEC_X + BPJ_X_CELL + 18 + (BPJ_X_CELL - 16) / 2}
          y={BPJ_Y_VEC_Y - 16}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.18em"
          fill={ACCENT.red}
        >
          ∂L/∂y
        </text>

        {/* Outgoing gradient vector ∂L/∂x — red column on the left */}
        {Array.from({ length: BPJ_J_SIZE }, (_, r) => {
          const cy = BPJ_X_VEC_Y + r * (BPJ_X_CELL + BPJ_X_GAP)
          const cellX = BPJ_X_VEC_X - 36
          return (
            <rect
              key={`dx-${r}`}
              x={cellX}
              y={cy + 8}
              width={BPJ_X_CELL - 16}
              height={BPJ_X_CELL - 16}
              rx={3}
              fill={ACCENT.red}
              opacity={0.50 + 0.32 * Math.cos(r * 0.6 + 0.5)}
            />
          )
        })}
        <text
          x={BPJ_X_VEC_X - 36 + (BPJ_X_CELL - 16) / 2}
          y={BPJ_X_VEC_Y - 16}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.18em"
          fill={ACCENT.red}
        >
          ∂L/∂x
        </text>
      </g>

      {/* ===================== ∂L/∂W TILE BELOW BLOCK ===================== */}
      {/* Drops in beat 3. Shows the layer also produces a weight gradient. */}
      <g
        style={{
          opacity: showWeightGrad ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        <line
          x1={BPJ_BLOCK_X + BPJ_BLOCK_W / 2}
          x2={BPJ_TILE_CX}
          y1={BPJ_BLOCK_Y + BPJ_BLOCK_H + 12}
          y2={BPJ_TILE_CY - BPJ_TILE_H / 2 - 4}
          stroke={ACCENT.red}
          strokeWidth={1.3}
          strokeDasharray="3 4"
          opacity={0.6}
        />
        {/* Tile background */}
        <rect
          x={BPJ_TILE_CX - BPJ_TILE_W / 2}
          y={BPJ_TILE_CY - BPJ_TILE_H / 2}
          width={BPJ_TILE_W}
          height={BPJ_TILE_H}
          rx={6}
          fill="rgba(248,113,113,0.18)"
          stroke={ACCENT.red}
          strokeWidth={1.4}
        />
        {/* Tile cells (4×4) */}
        {(() => {
          const cellW = (BPJ_TILE_W - 10) / BPJ_TILE_GRID
          const cellH = (BPJ_TILE_H - 10) / BPJ_TILE_GRID
          return Array.from({ length: BPJ_TILE_GRID }, (_, r) =>
            Array.from({ length: BPJ_TILE_GRID }, (_, c) => {
              const seed = r * 5 + c * 3
              const a = 0.45 + ((Math.sin(seed * 0.7) + 1) / 2) * 0.4
              return (
                <rect
                  key={`wg-${r}-${c}`}
                  x={BPJ_TILE_CX - BPJ_TILE_W / 2 + 5 + c * cellW + 1}
                  y={BPJ_TILE_CY - BPJ_TILE_H / 2 + 5 + r * cellH + 1}
                  width={cellW - 2}
                  height={cellH - 2}
                  rx={1.5}
                  fill={ACCENT.red}
                  opacity={a}
                />
              )
            }),
          )
        })()}
        <text
          x={BPJ_TILE_CX}
          y={BPJ_TILE_CY + BPJ_TILE_H / 2 + 22}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="16"
          fill={ACCENT.red}
        >
          ∂L/∂W  —  same local information also gives the weight gradient
        </text>
      </g>

      {/* ===================== CHAIN-RULE CALC LINE (bottom) ===================== */}
      <g
        style={{
          opacity: showBackward ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease ${0.4 / speed}s`,
        }}
      >
        <text
          x={BPJ_VB_W / 2}
          y={BPJ_VB_H - 76}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="22"
          fill="rgba(255,255,255,0.92)"
        >
          <tspan fill={ACCENT.red}>∂L/∂x</tspan>
          {'   =   '}
          <tspan fill={ACCENT.red}>∂L/∂y</tspan>
          {'   ·   '}
          <tspan fill={ACCENT.amber}>∂y/∂x</tspan>
        </text>
        <text
          x={BPJ_VB_W / 2}
          y={BPJ_VB_H - 52}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          OUTGOING GRADIENT  =  INCOMING GRADIENT  ×  LOCAL JACOBIAN
        </text>
      </g>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${BPJ_VB_W / 2}, ${BPJ_VB_H - 22})`}>
        {(['isolate the layer', 'one cell · ∂y₂/∂x₁', 'gradient through Jacobian', '+ ∂L/∂W'] as const).map((label, i) => {
          const w = 196
          const gap = 14
          const total = 4 * w + 3 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`bpj-beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-12}
                width={w}
                height={24}
                rx={12}
                fill={active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.amber : ACCENT.rule}
                strokeWidth={1.2}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="0.18em"
                fill={active ? ACCENT.amber : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function BpJacobianSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      4500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const phaseLabels = [
    'isolate the layer',
    'one cell · ∂y₂/∂x₁',
    'gradient through Jacobian',
    '+ ∂L/∂W',
  ]

  const subtitleByPhase: ReactNode[] = [
    <>
      Take any one block from Scene 24. During forward, it mapped its
      input <em>x</em> to its output <em>y</em>. The activations are
      saved. Now we&apos;re going to look at how this layer participates in
      the backward pass.
    </>,
    <>
      Each Jacobian cell answers a wiggle question: <em>if x₁ moves a
      tiny bit, how much does y₂ move?</em> The whole matrix is just every
      such input-output sensitivity stacked side by side.
    </>,
    <>
      During backprop the layer&apos;s job is to <em>convert</em> the
      gradient. The incoming <em>∂L/∂y</em> is multiplied by the local
      Jacobian to produce <em>∂L/∂x</em>, which travels to the previous
      layer.
    </>,
    <>
      The same local information also yields <em>∂L/∂W</em> — the weight
      gradient for this layer. That is what the optimizer (next scene)
      uses to nudge the weights.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'Simplified one-layer view. Real transformer blocks contain LayerNorm + multi-head attention + FFN + residual adds — many local Jacobians chained together. The principle is identical, just deeper.',
    'For a matmul y = Wx, the Jacobian ∂y/∂x is just W itself. For a nonlinearity like GELU, the Jacobian is diagonal. For a residual block, it has an identity component. Each layer only needs to know its own local Jacobian.',
    'This is the chain rule made physical: incoming gradient × local derivative = outgoing gradient. The autodiff library (PyTorch, JAX) walks this calculation backward through every operation in the forward graph automatically.',
    'Two outputs per backward step at every layer: the incoming-gradient transform that gets passed back, and the weight-gradient that stays put. The optimizer uses ∂L/∂W to take the actual learning step in Scene 27.',
  ]

  return (
    <SplitPaneScene
      viz={<VizBpJacobian phase={phase} />}
      text={{
        kicker: 'ACT IV · BACKPROP · LOCAL JACOBIAN',
        title: 'What each layer contributes.',
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
          { label: 'incoming', value: '∂L/∂y', color: ACCENT.red },
          { label: 'local', value: '∂y/∂x', color: ACCENT.amber },
          { label: 'outgoing', value: '∂L/∂x', color: ACCENT.red },
          { label: 'also', value: '∂L/∂W', color: ACCENT.red },
        ],
        equation: {
          label: 'one rule, one layer',
          body: <>∂L/∂x = ∂L/∂y · ∂y/∂x</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 26 — bp-accum: "Gradients average across the batch."
 *
 * The batch-level closing of the backprop arc:
 *
 *   Scene 24 — gradient flows back through every block
 *   Scene 25 — one block transforms the gradient
 *   Scene 26 — every example in the batch produces its OWN ∇W; those
 *              gradients average into one ∇W_batch which drives one
 *              optimizer step.
 *
 * Four beats:
 *
 *   beat 0 — per-example gradients. Four sample lanes light up one
 *            after another; each emits its own ∇W heatmap (red/blue
 *            patches of different intensities).
 *   beat 1 — same W, different examples. A bracket + label clarifies
 *            that all four gradients are gradients of the SAME weight
 *            matrix. Tiles get a faint shared-frame highlight.
 *   beat 2 — collapse to the mean. The four heatmaps converge through
 *            a Σ/B operator into a single teal/green ∇W_batch tile,
 *            visibly smoother than the noisy per-example ones.
 *   beat 3 — one update step. An amber arrow from ∇W_batch drops into
 *            the gold update box: W ← W − η·∇W_batch.
 *
 * Color roles:
 *   red/blue  — per-example gradients (noisy)
 *   teal/mint — averaged batch gradient (smoothed)
 *   amber/gold — η, the update / learning rate
 * ====================================================================== */

const BPA_VB_W = 1400
const BPA_VB_H = 1000

const BPA_B = 4 // batch size shown
const BPA_GRID = 5 // per-tile heatmap is 5×5

// Per-example tile geometry (left column, stacked vertically)
const BPA_TILE_CELL = 18
const BPA_TILE_GAP = 3
const BPA_TILE_W = BPA_GRID * BPA_TILE_CELL + (BPA_GRID - 1) * BPA_TILE_GAP // 102
const BPA_TILE_H = BPA_TILE_W
const BPA_TILES_X = 200 // x of leftmost cell of each per-example tile
const BPA_TILES_Y0 = 220 // y of first tile
const BPA_TILE_VGAP = 24
const BPA_TILE_PITCH = BPA_TILE_H + BPA_TILE_VGAP // 126
function bpaTileY(i: number) {
  return BPA_TILES_Y0 + i * BPA_TILE_PITCH
}

// Averaging operator (Σ / B)
const BPA_OP_CX = 530
const BPA_OP_CY = (bpaTileY(0) + bpaTileY(BPA_B - 1) + BPA_TILE_H) / 2 // mid of stack
const BPA_OP_R = 64

// Averaged batch gradient ∇W_batch (right side, larger and smoother)
const BPA_AVG_CELL = 30
const BPA_AVG_GAP = 4
const BPA_AVG_W = BPA_GRID * BPA_AVG_CELL + (BPA_GRID - 1) * BPA_AVG_GAP // 166
const BPA_AVG_X = 740
const BPA_AVG_Y = BPA_OP_CY - BPA_AVG_W / 2

// Update box (gold) at bottom-right
const BPA_UPDATE_X = 700
const BPA_UPDATE_Y = 720
const BPA_UPDATE_W = 540
const BPA_UPDATE_H = 130

// Deterministic per-cell gradient magnitude for sample i, row r, col c.
// Each sample's pattern is offset so they look distinctly noisy.
function bpaSampleMag(i: number, r: number, c: number): number {
  const seed = i * 19 + r * 7 + c * 3
  return 0.25 + ((Math.sin(seed * 0.91 + i * 0.7) + 1) / 2) * 0.7
}

// Averaged value at (r, c) — the literal mean across samples.
function bpaAvgMag(r: number, c: number): number {
  let s = 0
  for (let i = 0; i < BPA_B; i++) s += bpaSampleMag(i, r, c)
  return s / BPA_B
}

// Sign-ish: per-cell, randomly red (positive) or blue (negative) for the
// per-example tiles, to make them feel like real (signed) gradients.
function bpaSampleSign(i: number, r: number, c: number): 1 | -1 {
  return ((i + r + c) % 2 === 0 ? 1 : -1) * (Math.sin(i * 11 + r * 5 + c * 3) > 0 ? 1 : -1)
}

export function VizBpAccum({ phase }: { phase: number }) {
  const speed = useSpeed()

  // beat 1+ — "same W" frame visible
  const sameWFrame = phase >= 1
  // beat 2+ — average tile visible, sample tiles dim slightly
  const showAvg = phase >= 2
  // beat 3 — update box + arrow visible
  const showUpdate = phase >= 3

  return (
    <svg viewBox={`0 0 ${BPA_VB_W} ${BPA_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bpa-update-fill" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(245,158,11,0.10)" />
          <stop offset="100%" stopColor="rgba(245,158,11,0.16)" />
        </linearGradient>
        <radialGradient id="bpa-avg-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ACCENT.mint} stopOpacity="0.55" />
          <stop offset="60%" stopColor={ACCENT.mint} stopOpacity="0.16" />
          <stop offset="100%" stopColor={ACCENT.mint} stopOpacity="0" />
        </radialGradient>
        <filter id="bpa-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== HEADER ===================== */}
      <text
        x={BPA_VB_W / 2}
        y={62}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        EVERY EXAMPLE VOTES · ONE BATCH · ONE UPDATE STEP
      </text>
      <text
        x={BPA_VB_W / 2}
        y={100}
        textAnchor="middle"
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="24"
        fill="rgba(255,255,255,0.85)"
      >
        Each example’s gradient is one vote; the batch average is the step.
      </text>

      {/* ===================== "SAME W" FRAME (beat 1+) ===================== */}
      {/* A subtle bracket around the per-example tiles indicating they
          are gradients for the SAME weight matrix. */}
      <g
        style={{
          opacity: sameWFrame ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        <rect
          x={BPA_TILES_X - 110}
          y={bpaTileY(0) - 14}
          width={BPA_TILE_W + 130}
          height={BPA_B * BPA_TILE_PITCH - BPA_TILE_VGAP + 28}
          rx={14}
          fill="rgba(167,139,250,0.04)"
          stroke="rgba(167,139,250,0.30)"
          strokeWidth={1.2}
          strokeDasharray="6 5"
        />
        <text
          x={BPA_TILES_X - 110 + (BPA_TILE_W + 130) / 2}
          y={bpaTileY(0) - 22}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.violet}
        >
          SAME  W  ·  DIFFERENT EXAMPLES
        </text>
      </g>

      {/* ===================== PER-EXAMPLE GRADIENTS ===================== */}
      {Array.from({ length: BPA_B }, (_, i) => {
        const tileY = bpaTileY(i)
        const dimWhenAvg = showAvg ? 0.55 : 1
        const cascadeDelayS = i * 0.25
        return (
          <g
            key={`s-${i}`}
            style={{
              opacity: dimWhenAvg,
              transition: `opacity ${0.5 / speed}s ease`,
            }}
          >
            {/* Sample label */}
            <text
              x={BPA_TILES_X - 14}
              y={tileY + BPA_TILE_H / 2 - 6}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="11"
              letterSpacing="0.22em"
              fill="rgba(255,255,255,0.55)"
              style={{
                opacity: 1,
                transition: `opacity ${0.4 / speed}s ease ${cascadeDelayS / speed}s`,
              }}
            >
              SAMPLE {i + 1}
            </text>
            <text
              x={BPA_TILES_X - 14}
              y={tileY + BPA_TILE_H / 2 + 16}
              textAnchor="end"
              fontFamily="var(--font-display, Georgia, serif)"
              fontStyle="italic"
              fontSize="20"
              fill={ACCENT.red}
              style={{
                opacity: 1,
                transition: `opacity ${0.4 / speed}s ease ${cascadeDelayS / speed}s`,
              }}
            >
              ∇W
              <tspan dy="-6" fontSize="13">{i + 1}</tspan>
            </text>

            {/* Tile cascading in (cell-by-cell) */}
            <g
              style={{
                opacity: 1,
                transition: `opacity ${0.4 / speed}s ease ${cascadeDelayS / speed}s`,
              }}
            >
              <rect
                x={BPA_TILES_X - 4}
                y={tileY - 4}
                width={BPA_TILE_W + 8}
                height={BPA_TILE_H + 8}
                rx={5}
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              {Array.from({ length: BPA_GRID }, (_, r) =>
                Array.from({ length: BPA_GRID }, (_, c) => {
                  const m = bpaSampleMag(i, r, c)
                  const sign = bpaSampleSign(i, r, c)
                  const fill = sign > 0 ? ACCENT.red : ACCENT.blue
                  return (
                    <rect
                      key={`s-${i}-${r}-${c}`}
                      x={BPA_TILES_X + c * (BPA_TILE_CELL + BPA_TILE_GAP)}
                      y={tileY + r * (BPA_TILE_CELL + BPA_TILE_GAP)}
                      width={BPA_TILE_CELL}
                      height={BPA_TILE_CELL}
                      rx={2}
                      fill={fill}
                      opacity={m * 0.85}
                    />
                  )
                }),
              )}
            </g>

            {/* Outflow arrow toward the averaging operator */}
            <line
              x1={BPA_TILES_X + BPA_TILE_W + 8}
              x2={BPA_OP_CX - BPA_OP_R - 6}
              y1={tileY + BPA_TILE_H / 2}
              y2={BPA_OP_CY}
              stroke={ACCENT.dim}
              strokeOpacity={0.45}
              strokeWidth={1}
              strokeDasharray="3 4"
              style={{
                opacity: sameWFrame ? 0.6 : 0,
                transition: `opacity ${0.5 / speed}s ease`,
              }}
            />
          </g>
        )
      })}

      {/* ===================== AVERAGING OPERATOR (Σ / B) ===================== */}
      <g>
        {/* Soft halo */}
        <circle
          cx={BPA_OP_CX}
          cy={BPA_OP_CY}
          r={BPA_OP_R + 12}
          fill={showAvg ? 'rgba(52,211,153,0.10)' : 'rgba(167,139,250,0.06)'}
          style={{ transition: `fill ${0.5 / speed}s ease` }}
        />
        <circle
          cx={BPA_OP_CX}
          cy={BPA_OP_CY}
          r={BPA_OP_R}
          fill={showAvg ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)'}
          stroke={showAvg ? ACCENT.mint : 'rgba(255,255,255,0.30)'}
          strokeWidth={1.6}
          style={{ transition: `fill ${0.5 / speed}s ease, stroke ${0.5 / speed}s ease` }}
        />
        <text
          x={BPA_OP_CX}
          y={BPA_OP_CY - 4}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={showAvg ? ACCENT.mint : 'rgba(255,255,255,0.65)'}
          style={{ transition: `fill ${0.5 / speed}s ease` }}
        >
          MEAN
        </text>
        <text
          x={BPA_OP_CX}
          y={BPA_OP_CY + 22}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="22"
          fill={showAvg ? ACCENT.mint : 'rgba(255,255,255,0.78)'}
          style={{ transition: `fill ${0.5 / speed}s ease` }}
        >
          (1/B) Σ
        </text>
      </g>

      {/* Operator → averaged tile arrow */}
      <line
        x1={BPA_OP_CX + BPA_OP_R + 6}
        x2={BPA_AVG_X - 6}
        y1={BPA_OP_CY}
        y2={BPA_OP_CY}
        stroke={ACCENT.mint}
        strokeWidth={1.4}
        strokeDasharray="4 4"
        style={{
          opacity: showAvg ? 0.7 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      />
      <polyline
        points={`${BPA_AVG_X - 14},${BPA_OP_CY - 5} ${BPA_AVG_X - 6},${BPA_OP_CY} ${BPA_AVG_X - 14},${BPA_OP_CY + 5}`}
        fill="none"
        stroke={ACCENT.mint}
        strokeWidth={1.6}
        style={{
          opacity: showAvg ? 0.8 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      />

      {/* ===================== AVERAGED ∇W_batch TILE ===================== */}
      <g
        style={{
          opacity: showAvg ? 1 : 0.15,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        <text
          x={BPA_AVG_X + BPA_AVG_W / 2}
          y={BPA_AVG_Y - 16}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.mint}
        >
          BATCH GRADIENT  ·  ∇W_batch
        </text>
        {/* halo */}
        <rect
          x={BPA_AVG_X - 18}
          y={BPA_AVG_Y - 18}
          width={BPA_AVG_W + 36}
          height={BPA_AVG_W + 36}
          rx={16}
          fill="url(#bpa-avg-glow)"
        />
        <rect
          x={BPA_AVG_X - 8}
          y={BPA_AVG_Y - 8}
          width={BPA_AVG_W + 16}
          height={BPA_AVG_W + 16}
          rx={10}
          fill="rgba(52,211,153,0.06)"
          stroke={ACCENT.mint}
          strokeWidth={1.4}
        />
        {Array.from({ length: BPA_GRID }, (_, r) =>
          Array.from({ length: BPA_GRID }, (_, c) => {
            const m = bpaAvgMag(r, c)
            return (
              <rect
                key={`avg-${r}-${c}`}
                x={BPA_AVG_X + c * (BPA_AVG_CELL + BPA_AVG_GAP)}
                y={BPA_AVG_Y + r * (BPA_AVG_CELL + BPA_AVG_GAP)}
                width={BPA_AVG_CELL}
                height={BPA_AVG_CELL}
                rx={3}
                fill={ACCENT.mint}
                opacity={Math.max(0.25, m * 0.95)}
              />
            )
          }),
        )}
        <text
          x={BPA_AVG_X + BPA_AVG_W / 2}
          y={BPA_AVG_Y + BPA_AVG_W + 30}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.18em"
          fill={ACCENT.dim}
        >
          smoothed average — one direction to step
        </text>
      </g>

      {/* ===================== UPDATE BOX (gold) ===================== */}
      <g
        style={{
          opacity: showUpdate ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {/* Arrow from averaged tile down to update box */}
        <line
          x1={BPA_AVG_X + BPA_AVG_W / 2}
          x2={BPA_UPDATE_X + BPA_UPDATE_W / 2}
          y1={BPA_AVG_Y + BPA_AVG_W + 50}
          y2={BPA_UPDATE_Y - 10}
          stroke={ACCENT.amber}
          strokeWidth={1.6}
          strokeDasharray="5 5"
        />
        <polyline
          points={`${BPA_UPDATE_X + BPA_UPDATE_W / 2 - 6},${BPA_UPDATE_Y - 16} ${BPA_UPDATE_X + BPA_UPDATE_W / 2},${BPA_UPDATE_Y - 6} ${BPA_UPDATE_X + BPA_UPDATE_W / 2 + 6},${BPA_UPDATE_Y - 16}`}
          fill="none"
          stroke={ACCENT.amber}
          strokeWidth={1.7}
        />

        <rect
          x={BPA_UPDATE_X}
          y={BPA_UPDATE_Y}
          width={BPA_UPDATE_W}
          height={BPA_UPDATE_H}
          rx={14}
          fill="url(#bpa-update-fill)"
          stroke={ACCENT.amber}
          strokeWidth={1.6}
          filter="url(#bpa-glow)"
        />
        <text
          x={BPA_UPDATE_X + 22}
          y={BPA_UPDATE_Y + 32}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.amber}
        >
          ONE OPTIMIZER STEP
        </text>
        <text
          x={BPA_UPDATE_X + BPA_UPDATE_W / 2}
          y={BPA_UPDATE_Y + 92}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="38"
          fill={ACCENT.amber}
        >
          W ← W − <tspan fill={ACCENT.amber} fontWeight={500}>η</tspan>
          {' · '}
          <tspan fill={ACCENT.mint}>∇W_batch</tspan>
        </text>
      </g>

      {/* ===================== ENDING CAPTION ===================== */}
      <g
        style={{
          opacity: showUpdate ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease ${0.4 / speed}s`,
        }}
      >
        <text
          x={BPA_VB_W / 2}
          y={BPA_VB_H - 76}
          textAnchor="middle"
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="20"
          fill={ACCENT.mint}
        >
          One averaged gradient → one optimizer step.
        </text>
      </g>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${BPA_VB_W / 2}, ${BPA_VB_H - 30})`}>
        {(['per-example ∇W', 'same W, different examples', 'mean → ∇W_batch', 'one update step'] as const).map((label, i) => {
          const w = 220
          const gap = 14
          const total = 4 * w + 3 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`bpa-beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-12}
                width={w}
                height={24}
                rx={12}
                fill={active ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.mint : ACCENT.rule}
                strokeWidth={1.2}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="0.18em"
                fill={active ? ACCENT.mint : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function BpAccumulationSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      4500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  const phaseLabels = [
    'per-example ∇W',
    'same W, different examples',
    'mean → ∇W_batch',
    'one update step',
  ]

  const subtitleByPhase: ReactNode[] = [
    <>
      Backprop just produced <em>∂L/∂W</em> for every weight in the
      model. But the loss was a batch loss — so each example in the
      batch produced its own gradient estimate for every weight matrix.
    </>,
    <>
      All four of these are gradients of the <em>same</em> weight matrix
      W — just measured against different examples. Different examples
      vote for slightly different directions; that disagreement is
      gradient noise.
    </>,
    <>
      Average them: <em>∇W_batch = (1/B) Σᵢ ∇Wᵢ</em>. The mean is
      smoother than any individual gradient — that&apos;s why batching
      gives a more reliable update direction.
    </>,
    <>
      That single averaged direction drives one optimizer step:{' '}
      <em>W ← W − η · ∇W_batch</em>. The next scenes show what happens
      when you turn that step into a sequence — gradient descent.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'One backward pass through the batched forward graph yields B per-example gradients per weight, all at once. PyTorch sums them by default; setting reduction="mean" averages.',
    'Same weight matrix, different vote. Each example pushes W in the direction that would reduce its own loss — the batch finds the consensus push.',
    'Smaller batches mean noisier gradients (more variance per cell), which can actually help generalization. Bigger batches mean cleaner gradients, but each step costs more compute. Tuning B is half of training-recipe folklore.',
    'η is the learning rate — the size of the step we take in the averaged-gradient direction. Real optimizers like Adam also rescale this direction per-parameter. Scene 27 covers gradient descent; Scene 28 introduces Adam.',
  ]

  return (
    <SplitPaneScene
      viz={<VizBpAccum phase={phase} />}
      text={{
        kicker: 'ACT IV · BACKPROP · BATCHED',
        title: 'Gradients average across the batch.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.mint,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.mint}
          />
        ),
        stats: [
          { label: 'votes / batch', value: `B = ${BPA_B}`, color: ACCENT.violet },
          { label: 'per example', value: '∇Wᵢ', color: ACCENT.red },
          { label: 'averaged', value: '∇W_batch', color: ACCENT.mint },
          { label: 'step', value: 'W ← W − η·∇W_batch', color: ACCENT.amber },
        ],
        equation: {
          label: 'one rule, B votes',
          body: <>∇W_batch = (1/B) · Σᵢ ∇Wᵢ</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 27 — training: "Roll down the loss hill."
 *
 * The first optimizer scene. Pick up the averaged batch gradient from
 * Scene 26 and turn it into a weight update. Visual hero is a 3D
 * isometric wireframe loss surface with a glowing low-loss basin and
 * a yellow point (the current weights W) descending step by step.
 *
 * Four beats:
 *
 *   beat 0 — set the metaphor. Surface visible, yellow dot at start,
 *            top-left legend explains "height = loss / position = W".
 *   beat 1 — the two arrows. Coral arrow ∇L(W) points uphill (steepest
 *            increase). Teal arrow -η∇L(W) points downhill (descent
 *            direction). Connection to Scene 26: ∇L = ∇W_batch.
 *   beat 2 — take many tiny steps. Yellow dot animates from start to
 *            basin along the actual gradient-descent trajectory; trail
 *            of dots remains. Contour map mirrors the path. Loss curve
 *            on the right falls.
 *   beat 3 — settled near basin. Final state with full path, big light
 *            -bulb callout reinforces the rule.
 * ====================================================================== */

const GD_VB_W = 1400
const GD_VB_H = 1000

// 3D loss-surface zone (left)
const GD_SURF_OX = 470 // surface origin x in screen coords (centered)
const GD_SURF_OY = 480 // surface origin y in screen coords
const GD_SURF_SCALE = 150
const GD_SURF_H_SCALE = 80 // height scale (loss → screen y)
const GD_GRID = 16 // wireframe resolution

// Loss surface — an ANISOTROPIC bowl: the wy axis is ~2.5× stiffer than
// the wx axis. That means descent does NOT go in a straight line — it
// drops fast along wy first, then curves to slide along the shallow wx
// direction toward the basin. Min at (0.3, -0.3).
const GD_BASIN_WX = 0.3
const GD_BASIN_WY = -0.3
const GD_K_X = 0.4 // 1/2 · (eigenvalue of Hessian along wx)
const GD_K_Y = 1.0 // 1/2 · (eigenvalue of Hessian along wy) — much stiffer

function gdLoss(wx: number, wy: number): number {
  const a = wx - GD_BASIN_WX
  const b = wy - GD_BASIN_WY
  return GD_K_X * a * a + GD_K_Y * b * b
}
function gdGradient(wx: number, wy: number): [number, number] {
  return [2 * GD_K_X * (wx - GD_BASIN_WX), 2 * GD_K_Y * (wy - GD_BASIN_WY)]
}

// Project (world x, world y, loss) → screen (x, y) using a simple
// isometric projection. Higher loss → smaller screen y (appears higher).
function gdProject(wx: number, wy: number, z: number): [number, number] {
  const COS = Math.cos(Math.PI / 6) // ~0.866
  const SIN = Math.sin(Math.PI / 6) // 0.5
  const sx = GD_SURF_OX + (wx * COS - wy * COS) * GD_SURF_SCALE
  const sy = GD_SURF_OY + (wx * SIN + wy * SIN) * GD_SURF_SCALE - z * GD_SURF_H_SCALE
  return [sx, sy]
}

// Trail: 32 steps of actual gradient descent from start (-0.7, 0.7) to
// minimum at (GD_BASIN_WX, GD_BASIN_WY). On the anisotropic bowl this
// path visibly CURVES: wy collapses fast along the steep direction,
// then the path slides toward the basin along the shallow wx axis.
const GD_TRAIL: Array<{ wx: number; wy: number; loss: number; sx: number; sy: number }> = (() => {
  const out: Array<{ wx: number; wy: number; loss: number; sx: number; sy: number }> = []
  let wx = -0.70
  let wy = 0.70
  const eta = 0.18
  for (let k = 0; k <= 32; k++) {
    const z = gdLoss(wx, wy)
    const [sx, sy] = gdProject(wx, wy, z)
    out.push({ wx, wy, loss: z, sx, sy })
    const [gx, gy] = gdGradient(wx, wy)
    wx -= eta * gx
    wy -= eta * gy
  }
  return out
})()

// Contour map zone (top right of viz)
const GD_CMAP_X = 950
const GD_CMAP_Y = 100
const GD_CMAP_W = 360
const GD_CMAP_H = 360
const GD_CMAP_CX = GD_CMAP_X + GD_CMAP_W / 2
const GD_CMAP_CY = GD_CMAP_Y + GD_CMAP_H / 2

// Project (wx, wy) into top-down contour map coords. Basin maps to map
// center; world wx ∈ [-1, 1] maps across the map width.
function gdCmapPoint(wx: number, wy: number): [number, number] {
  const u = (wx - GD_BASIN_WX) / 1.4
  const v = (wy - GD_BASIN_WY) / 1.4
  const cx = GD_CMAP_CX + u * (GD_CMAP_W / 2)
  const cy = GD_CMAP_CY + v * (GD_CMAP_H / 2)
  return [cx, cy]
}

// Loss-over-steps zone (bottom right of viz)
const GD_LCHART_X = 950
const GD_LCHART_Y = 510
const GD_LCHART_W = 360
const GD_LCHART_H = 200
const GD_LCHART_PAD_L = 36
const GD_LCHART_PAD_R = 14
const GD_LCHART_PAD_T = 14
const GD_LCHART_PAD_B = 28

function gdLchartPoint(stepIdx: number, loss: number): [number, number] {
  const innerW = GD_LCHART_W - GD_LCHART_PAD_L - GD_LCHART_PAD_R
  const innerH = GD_LCHART_H - GD_LCHART_PAD_T - GD_LCHART_PAD_B
  const t = stepIdx / 32
  const maxLoss = GD_TRAIL[0].loss
  const x = GD_LCHART_X + GD_LCHART_PAD_L + t * innerW
  const y = GD_LCHART_Y + GD_LCHART_PAD_T + (1 - loss / maxLoss) * innerH
  return [x, y]
}

// Constants for phase-driven UI fields
const GD_LR = 0.20

export function VizGradientDescent({ phase, stepIdx }: { phase: number; stepIdx: number }) {
  const speed = useSpeed()

  const showArrows = phase >= 1
  const showTrail = phase >= 2

  const safeIdx = Math.max(0, Math.min(GD_TRAIL.length - 1, stepIdx))
  const cur = GD_TRAIL[safeIdx]
  const start = GD_TRAIL[0]

  // ---------- WIREFRAME GRID polylines ----------
  const rowPolylines: string[] = []
  const colPolylines: string[] = []
  for (let i = 0; i <= GD_GRID; i++) {
    const wx = -1.4 + (2.8 * i) / GD_GRID
    const ptsRow: string[] = []
    const ptsCol: string[] = []
    for (let j = 0; j <= GD_GRID; j++) {
      const wy = -1.4 + (2.8 * j) / GD_GRID
      const loss = gdLoss(wx, wy)
      const [sx, sy] = gdProject(wx, wy, loss)
      ptsRow.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
      // For the column polyline, we transpose — same i but x/y flipped.
      const wx2 = -1.4 + (2.8 * j) / GD_GRID
      const wy2 = -1.4 + (2.8 * i) / GD_GRID
      const loss2 = gdLoss(wx2, wy2)
      const [sx2, sy2] = gdProject(wx2, wy2, loss2)
      ptsCol.push(`${sx2.toFixed(1)},${sy2.toFixed(1)}`)
    }
    rowPolylines.push(ptsRow.join(' '))
    colPolylines.push(ptsCol.join(' '))
  }

  // ---------- ARROWS ----------
  // ∇L(W): points in the direction of steepest increase — i.e., up the
  // gradient direction projected into screen + height.
  const [gx, gy] = gdGradient(cur.wx, cur.wy)
  const gMag = Math.sqrt(gx * gx + gy * gy)
  const gxN = gx / gMag
  const gyN = gy / gMag
  // Tail at current point on surface
  const arrowLen = 0.32
  const upWx = cur.wx + arrowLen * gxN
  const upWy = cur.wy + arrowLen * gyN
  const upLoss = gdLoss(upWx, upWy)
  const [arrowUpSx, arrowUpSy] = gdProject(upWx, upWy, upLoss)
  // Descent: opposite direction
  const downWx = cur.wx - arrowLen * gxN
  const downWy = cur.wy - arrowLen * gyN
  const downLoss = gdLoss(downWx, downWy)
  const [arrowDownSx, arrowDownSy] = gdProject(downWx, downWy, downLoss)

  // ---------- LOSS CURVE PATH ----------
  const lossCurvePts = GD_TRAIL.slice(0, stepIdx + 1).map((t, i) => gdLchartPoint(i, t.loss))
  const lossCurvePath = lossCurvePts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')

  // ---------- DELTA loss for stats ----------
  const dLoss = stepIdx > 0 ? cur.loss - GD_TRAIL[stepIdx - 1].loss : 0

  return (
    <svg viewBox={`0 0 ${GD_VB_W} ${GD_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="gd-current-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ACCENT.amber} stopOpacity="0.85" />
          <stop offset="60%" stopColor={ACCENT.amber} stopOpacity="0.20" />
          <stop offset="100%" stopColor={ACCENT.amber} stopOpacity="0" />
        </radialGradient>
        <filter id="gd-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* ===================== HEADER strip ===================== */}
      <text
        x={GD_VB_W / 2}
        y={56}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        WEIGHTS DESCEND THE LOSS LANDSCAPE  ·  ONE TINY STEP AT A TIME
      </text>

      {/* ===================== METAPHOR LEGEND (top-left) ===================== */}
      <g transform="translate(40, 100)">
        <rect
          x={0}
          y={0}
          width={250}
          height={70}
          rx={8}
          fill="rgba(255,255,255,0.025)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <line x1={16} x2={16} y1={16} y2={32} stroke={ACCENT.cyan} strokeWidth={1.4} />
        <polyline points="13,18 16,14 19,18" fill="none" stroke={ACCENT.cyan} strokeWidth={1.4} />
        <polyline points="13,30 16,34 19,30" fill="none" stroke={ACCENT.cyan} strokeWidth={1.4} />
        <text x={32} y={28} fontFamily="var(--font-mono)" fontSize="12" fill="rgba(255,255,255,0.78)">
          height = loss
        </text>
        <circle cx={16} cy={52} r={4} fill={ACCENT.amber} />
        <text x={32} y={56} fontFamily="var(--font-mono)" fontSize="12" fill="rgba(255,255,255,0.78)">
          position = weights
        </text>
      </g>

      {/* ===================== Y-AXIS (loss high → low) ===================== */}
      <g transform="translate(28, 240)">
        <text
          x={0}
          y={-12}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.18em"
          fill={ACCENT.dim}
        >
          loss L(W)
        </text>
        <line x1={0} x2={0} y1={4} y2={310} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
        <text x={0} y={26} fontFamily="var(--font-mono)" fontSize="10" fill={ACCENT.cyan}>
          high
        </text>
        <text x={0} y={306} fontFamily="var(--font-mono)" fontSize="10" fill={ACCENT.amber}>
          low
        </text>
      </g>

      {/* ===================== 3D WIREFRAME LOSS SURFACE ===================== */}
      <g>
        {/* Wireframe rows (constant wx) */}
        {rowPolylines.map((pts, i) => (
          <polyline
            key={`row-${i}`}
            points={pts}
            fill="none"
            stroke="rgba(96,165,250,0.30)"
            strokeWidth={0.7}
          />
        ))}
        {/* Wireframe cols (constant wy) */}
        {colPolylines.map((pts, i) => (
          <polyline
            key={`col-${i}`}
            points={pts}
            fill="none"
            stroke="rgba(96,165,250,0.30)"
            strokeWidth={0.7}
          />
        ))}

        {/* Honesty label */}
        <text
          x={50}
          y={830}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="14"
          fill="rgba(255,255,255,0.45)"
        >
          2D slice of a much larger weight space
        </text>
      </g>

      {/* ===================== TRAIL of past steps ===================== */}
      <g
        style={{
          opacity: showTrail ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {GD_TRAIL.slice(0, stepIdx + 1).map((t, i) => (
          <circle
            key={`trail-${i}`}
            cx={t.sx}
            cy={t.sy}
            r={i === stepIdx ? 0 : 3.2}
            fill={ACCENT.amber}
            opacity={0.55 + 0.4 * (i / Math.max(1, stepIdx))}
          />
        ))}
      </g>

      {/* ===================== CURRENT W (yellow point) ===================== */}
      <g
        style={{
          transform: `translate(${cur.sx - start.sx}px, ${cur.sy - start.sy}px)`,
          transition: `transform ${0.18 / speed}s linear`,
        }}
      >
        <circle cx={start.sx} cy={start.sy} r={22} fill="url(#gd-current-glow)" />
        <circle
          cx={start.sx}
          cy={start.sy}
          r={9}
          fill={ACCENT.amber}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={1.4}
        />
        {/* Label "current W (weights)" — only when not stepping */}
        <g
          style={{
            opacity: phase < 2 ? 1 : 0,
            transition: `opacity ${0.4 / speed}s ease`,
          }}
        >
          <text
            x={start.sx - 14}
            y={start.sy - 14}
            textAnchor="end"
            fontFamily="var(--font-display, Georgia, serif)"
            fontStyle="italic"
            fontSize="18"
            fill={ACCENT.amber}
          >
            current W
          </text>
          <text
            x={start.sx - 14}
            y={start.sy + 4}
            textAnchor="end"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="rgba(255,255,255,0.55)"
          >
            (weights)
          </text>
        </g>
      </g>

      {/* ===================== ARROWS ∇L(W) and -η∇L(W) ===================== */}
      <g
        style={{
          opacity: showArrows ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {/* ∇L uphill arrow (coral) */}
        <line
          x1={cur.sx}
          y1={cur.sy}
          x2={arrowUpSx}
          y2={arrowUpSy}
          stroke={ACCENT.red}
          strokeWidth={2.5}
        />
        <polygon
          points={(() => {
            const dx = arrowUpSx - cur.sx
            const dy = arrowUpSy - cur.sy
            const len = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / len
            const uy = dy / len
            const head = 12
            const a1x = arrowUpSx - ux * head + uy * head * 0.5
            const a1y = arrowUpSy - uy * head - ux * head * 0.5
            const a2x = arrowUpSx - ux * head - uy * head * 0.5
            const a2y = arrowUpSy - uy * head + ux * head * 0.5
            return `${arrowUpSx},${arrowUpSy} ${a1x},${a1y} ${a2x},${a2y}`
          })()}
          fill={ACCENT.red}
        />
        <text
          x={arrowUpSx + 12}
          y={arrowUpSy - 10}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="20"
          fill={ACCENT.red}
        >
          ∇L(W)
        </text>
        <text
          x={arrowUpSx + 12}
          y={arrowUpSy + 10}
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill={ACCENT.red}
        >
          (steepest increase)
        </text>

        {/* -η∇L descent arrow (mint/teal) */}
        <line
          x1={cur.sx}
          y1={cur.sy}
          x2={arrowDownSx}
          y2={arrowDownSy}
          stroke={ACCENT.cyan}
          strokeWidth={2.5}
        />
        <polygon
          points={(() => {
            const dx = arrowDownSx - cur.sx
            const dy = arrowDownSy - cur.sy
            const len = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / len
            const uy = dy / len
            const head = 12
            const a1x = arrowDownSx - ux * head + uy * head * 0.5
            const a1y = arrowDownSy - uy * head - ux * head * 0.5
            const a2x = arrowDownSx - ux * head - uy * head * 0.5
            const a2y = arrowDownSy - uy * head + ux * head * 0.5
            return `${arrowDownSx},${arrowDownSy} ${a1x},${a1y} ${a2x},${a2y}`
          })()}
          fill={ACCENT.cyan}
        />
        <text
          x={arrowDownSx + 12}
          y={arrowDownSy - 6}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="20"
          fill={ACCENT.cyan}
        >
          −η∇L(W)
        </text>
        <text
          x={arrowDownSx + 12}
          y={arrowDownSy + 14}
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill={ACCENT.cyan}
        >
          (descent direction)
        </text>
      </g>

      {/* ===================== CONTOUR MAP (top right) ===================== */}
      <g>
        <text
          x={GD_CMAP_X + GD_CMAP_W / 2}
          y={GD_CMAP_Y - 14}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          TOP-DOWN VIEW (CONTOUR MAP)
        </text>
        <rect
          x={GD_CMAP_X - 6}
          y={GD_CMAP_Y - 6}
          width={GD_CMAP_W + 12}
          height={GD_CMAP_H + 12}
          rx={10}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />

        {/* Concentric level-set ellipses for the actual anisotropic loss
            L = K_X·(wx-bx)² + K_Y·(wy-by)². At level k the contour is an
            ellipse with x-radius √(k/K_X) and y-radius √(k/K_Y) in
            world coords; we scale by the same 1/1.4 used by gdCmapPoint
            so the ellipses align with the dot path. Smaller k → tighter
            ellipse, cooler colour. */}
        {[1.4, 0.95, 0.55, 0.25, 0.08].map((k, i) => {
          const xR = (Math.sqrt(k / GD_K_X) / 1.4) * (GD_CMAP_W / 2)
          const yR = (Math.sqrt(k / GD_K_Y) / 1.4) * (GD_CMAP_H / 2)
          return (
            <ellipse
              key={`contour-${i}`}
              cx={GD_CMAP_CX}
              cy={GD_CMAP_CY}
              rx={xR}
              ry={yR}
              fill="none"
              stroke={i < 2 ? ACCENT.amber : i < 4 ? ACCENT.dim : ACCENT.cyan}
              strokeOpacity={0.45}
              strokeWidth={1}
            />
          )
        })}

        {/* Path (yellow dotted) */}
        {GD_TRAIL.slice(0, stepIdx + 1).map((t, i) => {
          const [cx, cy] = gdCmapPoint(t.wx, t.wy)
          return (
            <circle
              key={`cm-${i}`}
              cx={cx}
              cy={cy}
              r={i === stepIdx ? 5 : 2.8}
              fill={i === stepIdx ? ACCENT.amber : ACCENT.amber}
              opacity={i === stepIdx ? 1 : 0.45 + 0.5 * (i / Math.max(1, stepIdx))}
              style={{
                transition: `opacity ${0.4 / speed}s ease`,
              }}
            />
          )
        })}

        {/* Optimum (teal dot at center) */}
        <circle cx={GD_CMAP_CX} cy={GD_CMAP_CY} r={6} fill={ACCENT.cyan} />
        <circle cx={GD_CMAP_CX} cy={GD_CMAP_CY} r={14} fill={ACCENT.cyan} opacity={0.18} />

        {/* Legend */}
        <g transform={`translate(${GD_CMAP_X + 10}, ${GD_CMAP_Y + GD_CMAP_H + 18})`}>
          <circle cx={6} cy={5} r={4} fill={ACCENT.amber} />
          <text x={18} y={9} fontFamily="var(--font-mono)" fontSize="10" fill="rgba(255,255,255,0.65)">
            weights path  (W₀ → W₁ → …)
          </text>
          <circle cx={6} cy={25} r={4} fill={ACCENT.cyan} />
          <text x={18} y={29} fontFamily="var(--font-mono)" fontSize="10" fill="rgba(255,255,255,0.65)">
            optimum  (low loss)
          </text>
        </g>
      </g>

      {/* ===================== LOSS-OVER-STEPS chart ===================== */}
      <g>
        <text
          x={GD_LCHART_X + GD_LCHART_W / 2}
          y={GD_LCHART_Y - 14}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          LOSS OVER STEPS
        </text>
        <rect
          x={GD_LCHART_X - 6}
          y={GD_LCHART_Y - 6}
          width={GD_LCHART_W + 12}
          height={GD_LCHART_H + 12}
          rx={10}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />
        {/* Y axis */}
        <line
          x1={GD_LCHART_X + GD_LCHART_PAD_L}
          x2={GD_LCHART_X + GD_LCHART_PAD_L}
          y1={GD_LCHART_Y + GD_LCHART_PAD_T}
          y2={GD_LCHART_Y + GD_LCHART_H - GD_LCHART_PAD_B}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
        />
        {/* X axis */}
        <line
          x1={GD_LCHART_X + GD_LCHART_PAD_L}
          x2={GD_LCHART_X + GD_LCHART_W - GD_LCHART_PAD_R}
          y1={GD_LCHART_Y + GD_LCHART_H - GD_LCHART_PAD_B}
          y2={GD_LCHART_Y + GD_LCHART_H - GD_LCHART_PAD_B}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
        />
        {/* Y labels */}
        <text
          x={GD_LCHART_X + 4}
          y={GD_LCHART_Y + GD_LCHART_PAD_T + 6}
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill={ACCENT.cyan}
        >
          high
        </text>
        <text
          x={GD_LCHART_X + 4}
          y={GD_LCHART_Y + GD_LCHART_H - GD_LCHART_PAD_B - 2}
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill={ACCENT.amber}
        >
          low
        </text>
        {/* X labels */}
        <text
          x={GD_LCHART_X + GD_LCHART_PAD_L}
          y={GD_LCHART_Y + GD_LCHART_H - 6}
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill={ACCENT.dim}
        >
          0
        </text>
        <text
          x={GD_LCHART_X + GD_LCHART_W - GD_LCHART_PAD_R}
          y={GD_LCHART_Y + GD_LCHART_H - 6}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill={ACCENT.dim}
        >
          step 32
        </text>
        {/* Loss curve */}
        {stepIdx > 0 && (
          <path
            d={lossCurvePath}
            fill="none"
            stroke={ACCENT.red}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        {stepIdx > 0 && (
          <circle
            cx={gdLchartPoint(stepIdx, cur.loss)[0]}
            cy={gdLchartPoint(stepIdx, cur.loss)[1]}
            r={4}
            fill={ACCENT.amber}
          />
        )}
      </g>

      {/* ===================== LIVE READOUT (small panel under loss chart) ===================== */}
      <g transform={`translate(${GD_LCHART_X - 6}, ${GD_LCHART_Y + GD_LCHART_H + 28})`}>
        <rect
          x={0}
          y={0}
          width={GD_LCHART_W + 12}
          height={150}
          rx={10}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />
        <text x={16} y={22} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.22em" fill={ACCENT.dim}>
          REAL VALUES
        </text>
        {(() => {
          const rows: Array<[string, string, string]> = [
            ['step', `${stepIdx} / 32`, ACCENT.amber],
            ['loss  L(W)', cur.loss.toFixed(4), ACCENT.amber],
            ['learning rate  η', GD_LR.toFixed(2), 'rgba(255,255,255,0.78)'],
            ['Δloss', stepIdx > 0 ? dLoss.toFixed(4) : '—', ACCENT.cyan],
          ]
          return rows.map(([label, val, color], i) => (
            <g key={`v-${i}`}>
              <text x={16} y={48 + i * 24} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.55)">
                {label}
              </text>
              <text
                x={GD_LCHART_W - 8}
                y={48 + i * 24}
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize="13"
                fill={color}
              >
                {val}
              </text>
            </g>
          ))
        })()}
      </g>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${GD_VB_W / 2}, ${GD_VB_H - 26})`}>
        {(['set the metaphor', '∇L  vs  −η∇L', 'take many tiny steps', 'settled in basin'] as const).map((label, i) => {
          const w = 220
          const gap = 14
          const total = 4 * w + 3 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`gd-beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-12}
                width={w}
                height={24}
                rx={12}
                fill={active ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.mint : ACCENT.rule}
                strokeWidth={1.2}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="0.18em"
                fill={active ? ACCENT.mint : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function GradientDescentSplitPane() {
  const speed = useSpeed()
  const PHASES = 4
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      5500 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Smooth step counter. Beats 0–1 hold at step 0; beat 2 advances from
  // 0→32 over ~4.8s so the yellow point visibly rolls down the hill;
  // beat 3 holds at 32. Drives both the viz and the stats panel.
  const [stepIdx, setStepIdx] = useState(0)
  useEffect(() => {
    if (phase < 2) {
      setStepIdx(0)
      return
    }
    if (phase >= 3) {
      setStepIdx(32)
      return
    }
    setStepIdx(0)
    let i = 0
    const totalMs = 4800 / speed
    const stepMs = totalMs / 32
    const id = setInterval(() => {
      i += 1
      if (i >= 32) {
        setStepIdx(32)
        clearInterval(id)
      } else {
        setStepIdx(i)
      }
    }, stepMs)
    return () => clearInterval(id)
  }, [phase, speed])

  const safeIdx = Math.max(0, Math.min(GD_TRAIL.length - 1, stepIdx))
  const cur = GD_TRAIL[safeIdx]

  const phaseLabels = [
    'set the metaphor',
    '∇L vs −η∇L',
    'take many tiny steps',
    'settled in basin',
  ]

  const subtitleByPhase: ReactNode[] = [
    <>
      The model&apos;s weights live as a single point on a giant loss
      landscape. <em>Height</em> is the loss; <em>position</em> is the
      current weights. The basin we&apos;re aiming for is where the loss
      is lowest.
    </>,
    <>
      The averaged batch gradient from Scene 26 is exactly{' '}
      <em>∇L(W)</em>: it points in the direction of steepest{' '}
      <em>increase</em>. To <em>lower</em> the loss we step the other
      way — distance <em>η</em>, opposite direction.
    </>,
    <>
      Each step nudges the weights downhill by{' '}
      <em>η · ∇L(W)</em>. After many tiny steps, the path curves toward
      the basin and the loss drops on the chart at right.
    </>,
    <>
      The weights settle near the optimum and the loss curve flattens.
      Real training takes hundreds of thousands of these steps. The next
      scene shows what happens when the landscape isn&apos;t this kind.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'A real transformer has hundreds of millions of weights, so the landscape lives in a hundred-million-dimensional space. We can only ever see 2D slices. The math is identical regardless of dimension.',
    'Why the minus sign? ∇L points toward higher loss. Subtracting it moves toward lower loss. η controls how big a step — too large overshoots, too small crawls. Tuning it is half the art.',
    `After ${stepIdx} steps the loss has dropped from ${GD_TRAIL[0].loss.toFixed(2)} to ${cur.loss.toFixed(4)}. Each step in this 2D toy is one optimizer call; in real training it is one full forward+backward pass over a batch of B sequences.`,
    'In practice every weight update follows this same rule with η scheduled (warmup, decay) and ∇W usually transformed by Adam or another optimizer (next scene) so the step size adapts per-parameter.',
  ]

  return (
    <SplitPaneScene
      viz={<VizGradientDescent phase={phase} stepIdx={stepIdx} />}
      text={{
        kicker: 'ACT IV · GD · IDEAL',
        title: 'Roll down the loss hill.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.mint,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.mint}
          />
        ),
        stats: [
          { label: 'step', value: `${stepIdx} / 32`, color: ACCENT.amber },
          { label: 'loss  L(W)', value: cur.loss.toFixed(4), color: ACCENT.amber },
          { label: 'learning rate  η', value: GD_LR.toFixed(2) },
          { label: 'Δloss', value: stepIdx > 0 ? (cur.loss - GD_TRAIL[stepIdx - 1].loss).toFixed(4) : '—', color: ACCENT.cyan },
        ],
        equation: {
          label: 'one step',
          body: <>W ← W − η · ∇W_batch L</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 28 — gd-ravine: "Why vanilla GD zig-zags."
 *
 * Counter to Scene 27's clean bowl: a NARROW ravine. The loss is steep
 * in one direction (w₂) and shallow in the other (w₁), so a single
 * fixed learning rate is too big for the steep axis (overshoots,
 * bounces off the walls) and too small for the shallow axis (crawls
 * forward). The trajectory zig-zags across the valley while making slow
 * progress along it.
 *
 * Three beats:
 *
 *   beat 0 — set the geometry. Ravine visible, current pink point at
 *            the start. Axis labels Loss / w₁ / w₂. Caption: "narrow
 *            ravine — steep across, shallow along."
 *   beat 1 — annotate the asymmetry. "steep across · large curvature
 *            · → overshoot" pointer at the steep wall, "slow along ·
 *            small curvature · → tiny progress" pointer along the
 *            valley.
 *   beat 2 — take many tiny steps. The pink dot zig-zags from start
 *            to near minimum (real GD path). Contour map mirrors the
 *            zig-zag through narrow horizontal ellipses. Slider on the
 *            right shows current η in the "oscillating · just right"
 *            zone.
 * ====================================================================== */

const GR_VB_W = 1400
const GR_VB_H = 1000

// Ravine loss. w₁ is the SHALLOW (along-valley) axis; w₂ is the STEEP
// (across-valley) axis. Anisotropy ratio chosen so the gradient
// direction is dominated by w₂, producing classic zig-zag.
const GR_K_SHALLOW = 0.02 // along w₁
const GR_K_STEEP = 1.0 // along w₂
const GR_BASIN_W1 = 0
const GR_BASIN_W2 = 0

function grLoss(w1: number, w2: number): number {
  const a = w1 - GR_BASIN_W1
  const b = w2 - GR_BASIN_W2
  return GR_K_SHALLOW * a * a + GR_K_STEEP * b * b
}
function grGradient(w1: number, w2: number): [number, number] {
  return [2 * GR_K_SHALLOW * (w1 - GR_BASIN_W1), 2 * GR_K_STEEP * (w2 - GR_BASIN_W2)]
}

// 3D surface projection (same isometric idiom as Scene 27).
const GR_SURF_OX = 410
const GR_SURF_OY = 470
const GR_SURF_SCALE = 175 // larger than Scene 27 so the ravine reads
const GR_SURF_H_SCALE = 90
const GR_GRID = 22 // wireframe resolution — denser since the ravine is sharp

function grProject(w1: number, w2: number, z: number): [number, number] {
  const COS = Math.cos(Math.PI / 6)
  const SIN = Math.sin(Math.PI / 6)
  const sx = GR_SURF_OX + (w1 * COS - w2 * COS) * GR_SURF_SCALE
  const sy = GR_SURF_OY + (w1 * SIN + w2 * SIN) * GR_SURF_SCALE - z * GR_SURF_H_SCALE
  return [sx, sy]
}

const GR_LR = 0.95 // learning rate — chosen so |1 - η·hessian_steep| ≈ 0.9
// (slow oscillation decay, visible zig-zag throughout 32 steps), and
// |1 - η·hessian_shallow| ≈ 0.96 (slow forward drift along the valley).

const GR_TRAIL: Array<{ w1: number; w2: number; loss: number; sx: number; sy: number }> = (() => {
  const out: Array<{ w1: number; w2: number; loss: number; sx: number; sy: number }> = []
  let w1 = -1.5
  let w2 = 1.0
  for (let k = 0; k <= 32; k++) {
    const z = grLoss(w1, w2)
    const [sx, sy] = grProject(w1, w2, z)
    out.push({ w1, w2, loss: z, sx, sy })
    const [g1, g2] = grGradient(w1, w2)
    w1 -= GR_LR * g1
    w2 -= GR_LR * g2
  }
  return out
})()

// Contour map (right side of viz pane)
const GR_CMAP_X = 870
const GR_CMAP_Y = 130
const GR_CMAP_W = 430
const GR_CMAP_H = 320
const GR_CMAP_CX = GR_CMAP_X + GR_CMAP_W / 2
const GR_CMAP_CY = GR_CMAP_Y + GR_CMAP_H / 2

function grCmapPoint(w1: number, w2: number): [number, number] {
  const u = (w1 - GR_BASIN_W1) / 1.65
  const v = (w2 - GR_BASIN_W2) / 1.2
  return [GR_CMAP_CX + u * (GR_CMAP_W / 2), GR_CMAP_CY + v * (GR_CMAP_H / 2)]
}

// Slider zone
const GR_SLIDER_X = 870
const GR_SLIDER_Y = 600
const GR_SLIDER_W = 430
const GR_SLIDER_H = 130

export function VizGdRavine({ phase, stepIdx }: { phase: number; stepIdx: number }) {
  const speed = useSpeed()

  const showAnnots = phase >= 1
  const showTrail = phase >= 2
  const showSlider = phase >= 0

  const safeIdx = Math.max(0, Math.min(GR_TRAIL.length - 1, stepIdx))
  const cur = GR_TRAIL[safeIdx]

  // --- Wireframe polylines ---
  const rowPolylines: string[] = []
  const colPolylines: string[] = []
  for (let i = 0; i <= GR_GRID; i++) {
    const w1 = -1.7 + (3.4 * i) / GR_GRID
    const ptsRow: string[] = []
    const ptsCol: string[] = []
    for (let j = 0; j <= GR_GRID; j++) {
      const w2 = -1.2 + (2.4 * j) / GR_GRID
      const loss = grLoss(w1, w2)
      const [sx, sy] = grProject(w1, w2, loss)
      ptsRow.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
      const w1b = -1.7 + (3.4 * j) / GR_GRID
      const w2b = -1.2 + (2.4 * i) / GR_GRID
      const lossB = grLoss(w1b, w2b)
      const [sx2, sy2] = grProject(w1b, w2b, lossB)
      ptsCol.push(`${sx2.toFixed(1)},${sy2.toFixed(1)}`)
    }
    rowPolylines.push(ptsRow.join(' '))
    colPolylines.push(ptsCol.join(' '))
  }

  // Annotation arrow base — at the current point during beat 1.
  const [g1, g2] = grGradient(cur.w1, cur.w2)
  const gMag = Math.sqrt(g1 * g1 + g2 * g2)
  const g1N = g1 / gMag
  const g2N = g2 / gMag
  const arrowLen = 0.28
  // "Steep across" arrow — points uphill across the ravine wall
  const upW1 = cur.w1 + arrowLen * g1N
  const upW2 = cur.w2 + arrowLen * g2N
  const [arrowUpSx, arrowUpSy] = grProject(upW1, upW2, grLoss(upW1, upW2))
  // "Slow along" arrow — points along the valley toward the minimum
  // (rough: along the gradient projected onto the w1 axis only)
  const alongW1 = cur.w1 + 0.5 * Math.sign(GR_BASIN_W1 - cur.w1) // toward basin in w1
  const alongW2 = cur.w2 // same w2
  const alongLoss = grLoss(alongW1, alongW2)
  const [alongSx, alongSy] = grProject(alongW1, alongW2, alongLoss)

  return (
    <svg viewBox={`0 0 ${GR_VB_W} ${GR_VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="gr-min-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ACCENT.mint} stopOpacity="0.95" />
          <stop offset="60%" stopColor={ACCENT.mint} stopOpacity="0.30" />
          <stop offset="100%" stopColor={ACCENT.mint} stopOpacity="0" />
        </radialGradient>
        <filter id="gr-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== HEADER strip ===================== */}
      <text
        x={GR_VB_W / 2}
        y={56}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.32em"
        fill={ACCENT.dim}
      >
        ONE LEARNING RATE FOR ALL DIRECTIONS  ·  RAVINES MAKE THAT FAIL
      </text>

      {/* ===================== LANDSCAPE LABEL ===================== */}
      <text
        x={32}
        y={104}
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.dim}
      >
        LOSS LANDSCAPE  L(w₁, w₂)
      </text>
      <text
        x={32}
        y={126}
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="14"
        fill="rgba(255,255,255,0.62)"
      >
        A narrow ravine — steep across, shallow along.
      </text>

      {/* ===================== Y-AXIS: Loss ===================== */}
      <text
        x={28}
        y={250}
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.18em"
        fill="rgba(255,255,255,0.55)"
      >
        Loss
      </text>
      <line x1={28} x2={28} y1={262} y2={550} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
      <polyline points="24,266 28,258 32,266" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />

      {/* ===================== 3D WIREFRAME RAVINE ===================== */}
      <g>
        {rowPolylines.map((pts, i) => (
          <polyline
            key={`r-${i}`}
            points={pts}
            fill="none"
            stroke="rgba(248,113,113,0.42)"
            strokeWidth={0.75}
          />
        ))}
        {colPolylines.map((pts, i) => (
          <polyline
            key={`c-${i}`}
            points={pts}
            fill="none"
            stroke="rgba(248,113,113,0.42)"
            strokeWidth={0.75}
          />
        ))}
      </g>

      {/* ===================== Honesty + axis labels ===================== */}
      <text
        x={120}
        y={620}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.18em"
        fill="rgba(255,255,255,0.45)"
      >
        w₂
      </text>
      <text
        x={680}
        y={720}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.18em"
        fill="rgba(255,255,255,0.45)"
      >
        w₁
      </text>

      {/* ===================== TRAIL ===================== */}
      <g
        style={{
          opacity: showTrail ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {GR_TRAIL.slice(0, safeIdx + 1).map((t, i) => (
          <circle
            key={`tr-${i}`}
            cx={t.sx}
            cy={t.sy}
            r={i === safeIdx ? 0 : 4}
            fill={ACCENT.red}
            opacity={0.45 + 0.5 * (i / Math.max(1, safeIdx))}
          />
        ))}
      </g>

      {/* ===================== MINIMUM (green dot at basin) ===================== */}
      {(() => {
        const [mx, my] = grProject(GR_BASIN_W1, GR_BASIN_W2, 0)
        return (
          <g>
            <circle cx={mx} cy={my} r={28} fill="url(#gr-min-glow)" />
            <circle cx={mx} cy={my} r={7} fill={ACCENT.mint} stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
          </g>
        )
      })()}

      {/* ===================== CURRENT W (pink dot) ===================== */}
      <g
        style={{
          transform: `translate(${cur.sx - GR_TRAIL[0].sx}px, ${cur.sy - GR_TRAIL[0].sy}px)`,
          transition: `transform ${0.18 / speed}s linear`,
        }}
      >
        <circle cx={GR_TRAIL[0].sx} cy={GR_TRAIL[0].sy} r={20} fill={ACCENT.red} opacity={0.25} filter="url(#gr-glow)" />
        <circle cx={GR_TRAIL[0].sx} cy={GR_TRAIL[0].sy} r={9} fill={ACCENT.red} stroke="rgba(255,255,255,0.85)" strokeWidth={1.4} />
      </g>

      {/* ===================== ANNOTATIONS (beat 1+) ===================== */}
      <g
        style={{
          opacity: showAnnots ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        {/* "steep across" — red arrow pointing across the ravine wall */}
        <line x1={cur.sx} y1={cur.sy} x2={arrowUpSx} y2={arrowUpSy} stroke={ACCENT.red} strokeWidth={2} />
        <polygon
          points={(() => {
            const dx = arrowUpSx - cur.sx
            const dy = arrowUpSy - cur.sy
            const len = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / len
            const uy = dy / len
            const head = 10
            const a1x = arrowUpSx - ux * head + uy * head * 0.5
            const a1y = arrowUpSy - uy * head - ux * head * 0.5
            const a2x = arrowUpSx - ux * head - uy * head * 0.5
            const a2y = arrowUpSy - uy * head + ux * head * 0.5
            return `${arrowUpSx},${arrowUpSy} ${a1x},${a1y} ${a2x},${a2y}`
          })()}
          fill={ACCENT.red}
        />
        <text
          x={arrowUpSx + 14}
          y={arrowUpSy - 30}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="20"
          fill={ACCENT.red}
        >
          steep across
        </text>
        <text x={arrowUpSx + 14} y={arrowUpSy - 12} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.62)">
          large curvature
        </text>
        <text x={arrowUpSx + 14} y={arrowUpSy + 4} fontFamily="var(--font-mono)" fontSize="11" fill={ACCENT.red}>
          → overshoot
        </text>

        {/* "slow along" — mint arrow along the valley */}
        <line x1={cur.sx} y1={cur.sy} x2={alongSx} y2={alongSy} stroke={ACCENT.mint} strokeWidth={2} />
        <polygon
          points={(() => {
            const dx = alongSx - cur.sx
            const dy = alongSy - cur.sy
            const len = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / len
            const uy = dy / len
            const head = 10
            const a1x = alongSx - ux * head + uy * head * 0.5
            const a1y = alongSy - uy * head - ux * head * 0.5
            const a2x = alongSx - ux * head - uy * head * 0.5
            const a2y = alongSy - uy * head + ux * head * 0.5
            return `${alongSx},${alongSy} ${a1x},${a1y} ${a2x},${a2y}`
          })()}
          fill={ACCENT.mint}
        />
        <text
          x={alongSx + 14}
          y={alongSy - 24}
          fontFamily="var(--font-display, Georgia, serif)"
          fontStyle="italic"
          fontSize="20"
          fill={ACCENT.mint}
        >
          slow along
        </text>
        <text x={alongSx + 14} y={alongSy - 6} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.62)">
          small curvature
        </text>
        <text x={alongSx + 14} y={alongSy + 10} fontFamily="var(--font-mono)" fontSize="11" fill={ACCENT.mint}>
          → tiny progress
        </text>
      </g>

      {/* ===================== LEGEND (bottom-left) ===================== */}
      <g transform="translate(40, 760)">
        <rect x={0} y={0} width={210} height={86} rx={8} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        <circle cx={18} cy={20} r={5} fill={ACCENT.red} />
        <text x={32} y={24} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.78)">
          current update
        </text>
        <circle cx={18} cy={42} r={4} fill={ACCENT.red} opacity={0.55} />
        <text x={32} y={46} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.78)">
          past updates
        </text>
        <circle cx={18} cy={64} r={5} fill={ACCENT.mint} />
        <text x={32} y={68} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.78)">
          minimum
        </text>
      </g>

      {/* ===================== CONTOUR MAP (top-right of viz) ===================== */}
      <g>
        <text
          x={GR_CMAP_X + GR_CMAP_W / 2}
          y={GR_CMAP_Y - 14}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.dim}
        >
          CONTOUR VIEW (TOP-DOWN)
        </text>
        <rect
          x={GR_CMAP_X - 6}
          y={GR_CMAP_Y - 6}
          width={GR_CMAP_W + 12}
          height={GR_CMAP_H + 12}
          rx={10}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />
        {/* w₁ axis (horizontal) */}
        <line
          x1={GR_CMAP_X + 30}
          x2={GR_CMAP_X + GR_CMAP_W - 10}
          y1={GR_CMAP_CY}
          y2={GR_CMAP_CY}
          stroke="rgba(255,255,255,0.20)"
          strokeWidth={1}
        />
        <text x={GR_CMAP_X + GR_CMAP_W - 6} y={GR_CMAP_CY - 8} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.55)">
          w₁
        </text>
        {/* w₂ axis (vertical) */}
        <line
          x1={GR_CMAP_CX}
          x2={GR_CMAP_CX}
          y1={GR_CMAP_Y + 10}
          y2={GR_CMAP_Y + GR_CMAP_H - 10}
          stroke="rgba(255,255,255,0.20)"
          strokeWidth={1}
        />
        <text x={GR_CMAP_CX + 6} y={GR_CMAP_Y + 18} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.55)">
          w₂
        </text>

        {/* Anisotropic level-set ellipses — wide & short */}
        {[0.6, 0.35, 0.18, 0.07, 0.02].map((k, i) => {
          const xR = (Math.sqrt(k / GR_K_SHALLOW) / 1.65) * (GR_CMAP_W / 2)
          const yR = (Math.sqrt(k / GR_K_STEEP) / 1.2) * (GR_CMAP_H / 2)
          return (
            <ellipse
              key={`ec-${i}`}
              cx={GR_CMAP_CX}
              cy={GR_CMAP_CY}
              rx={Math.min(xR, GR_CMAP_W / 2 - 10)}
              ry={yR}
              fill="none"
              stroke={i < 2 ? ACCENT.red : i < 4 ? ACCENT.dim : ACCENT.mint}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          )
        })}

        {/* Path on contour — segments connecting consecutive points so the
            zig-zag reads clearly */}
        {GR_TRAIL.slice(0, safeIdx + 1).map((t, i) => {
          if (i === 0) return null
          const [x0, y0] = grCmapPoint(GR_TRAIL[i - 1].w1, GR_TRAIL[i - 1].w2)
          const [x1, y1] = grCmapPoint(t.w1, t.w2)
          return (
            <line
              key={`pl-${i}`}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke={ACCENT.red}
              strokeOpacity={0.55}
              strokeWidth={1.4}
            />
          )
        })}
        {GR_TRAIL.slice(0, safeIdx + 1).map((t, i) => {
          const [cx, cy] = grCmapPoint(t.w1, t.w2)
          return (
            <circle
              key={`cm-${i}`}
              cx={cx}
              cy={cy}
              r={i === safeIdx ? 6 : 3.2}
              fill={ACCENT.red}
              opacity={i === safeIdx ? 1 : 0.45 + 0.5 * (i / Math.max(1, safeIdx))}
            />
          )
        })}

        {/* Minimum marker on contour */}
        <circle cx={GR_CMAP_CX} cy={GR_CMAP_CY} r={6} fill={ACCENT.mint} />
        <circle cx={GR_CMAP_CX} cy={GR_CMAP_CY} r={14} fill={ACCENT.mint} opacity={0.18} />

        {/* "one learning rate for all directions" caption */}
        <text
          x={GR_CMAP_X + GR_CMAP_W / 2}
          y={GR_CMAP_Y + GR_CMAP_H + 28}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.22em"
          fill={ACCENT.red}
          style={{
            opacity: showAnnots ? 1 : 0,
            transition: `opacity ${0.5 / speed}s ease`,
          }}
        >
          one learning rate for all directions
        </text>
      </g>

      {/* ===================== LEARNING-RATE SLIDER ===================== */}
      <g
        style={{
          opacity: showSlider ? 1 : 0,
          transition: `opacity ${0.5 / speed}s ease`,
        }}
      >
        <rect
          x={GR_SLIDER_X}
          y={GR_SLIDER_Y}
          width={GR_SLIDER_W}
          height={GR_SLIDER_H}
          rx={10}
          fill="rgba(255,255,255,0.025)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
        <text x={GR_SLIDER_X + 22} y={GR_SLIDER_Y + 30} fontFamily="var(--font-mono)" fontSize="11" letterSpacing="0.22em" fill={ACCENT.dim}>
          LEARNING RATE  η
        </text>
        <text x={GR_SLIDER_X + GR_SLIDER_W - 22} y={GR_SLIDER_Y + 30} textAnchor="end" fontFamily="var(--font-mono)" fontSize="14" fill={ACCENT.cyan}>
          {GR_LR.toFixed(3)}
        </text>
        {/* Track */}
        {(() => {
          const trackX = GR_SLIDER_X + 22
          const trackY = GR_SLIDER_Y + 60
          const trackW = GR_SLIDER_W - 44
          // η ∈ [0.0, 1.2]; current value GR_LR (=0.95) → near "oscillating · just right"
          const t = Math.min(1, Math.max(0, GR_LR / 1.2))
          const knobX = trackX + t * trackW
          return (
            <g>
              <line x1={trackX} x2={trackX + trackW} y1={trackY} y2={trackY} stroke="rgba(255,255,255,0.15)" strokeWidth={4} strokeLinecap="round" />
              <line x1={trackX} x2={knobX} y1={trackY} y2={trackY} stroke={ACCENT.cyan} strokeWidth={4} strokeLinecap="round" />
              <circle cx={knobX} cy={trackY} r={10} fill={ACCENT.cyan} stroke="rgba(255,255,255,0.7)" strokeWidth={1.4} />
            </g>
          )
        })()}
        {/* Three regime labels */}
        <text x={GR_SLIDER_X + 32} y={GR_SLIDER_Y + 100} fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.78)">
          crawls
        </text>
        <text x={GR_SLIDER_X + 32} y={GR_SLIDER_Y + 116} fontFamily="var(--font-mono)" fontSize="9" fill="rgba(255,255,255,0.45)">
          too small
        </text>

        <text x={GR_SLIDER_X + GR_SLIDER_W / 2} y={GR_SLIDER_Y + 100} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill={ACCENT.amber}>
          oscillating
        </text>
        <text x={GR_SLIDER_X + GR_SLIDER_W / 2} y={GR_SLIDER_Y + 116} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={ACCENT.amber}>
          just right
        </text>

        <text x={GR_SLIDER_X + GR_SLIDER_W - 32} y={GR_SLIDER_Y + 100} textAnchor="end" fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.78)">
          explodes
        </text>
        <text x={GR_SLIDER_X + GR_SLIDER_W - 32} y={GR_SLIDER_Y + 116} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="rgba(255,255,255,0.45)">
          too large
        </text>
      </g>

      {/* ===================== ENDING CAPTION ===================== */}
      <text
        x={GR_VB_W / 2}
        y={GR_VB_H - 92}
        textAnchor="middle"
        fontFamily="var(--font-display, Georgia, serif)"
        fontStyle="italic"
        fontSize="18"
        fill="rgba(255,255,255,0.85)"
      >
        Fixed learning rate <tspan fill={ACCENT.red}>overshoots</tspan> steep directions and makes <tspan fill={ACCENT.mint}>slow progress</tspan> along shallow ones.
      </text>

      <text
        x={GR_VB_W / 2}
        y={GR_VB_H - 68}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="0.22em"
        fill={ACCENT.dim}
      >
        A FIXED LEARNING RATE WASTES STEPS BOUNCING ACROSS STEEP DIRECTIONS
      </text>

      {/* ===================== BEAT INDICATOR ===================== */}
      <g transform={`translate(${GR_VB_W / 2}, ${GR_VB_H - 30})`}>
        {(['set the geometry', 'steep vs shallow', 'zig-zag descent'] as const).map((label, i) => {
          const w = 240
          const gap = 18
          const total = 3 * w + 2 * gap
          const startX = -total / 2
          const cx = startX + i * (w + gap) + w / 2
          const active = i === phase
          return (
            <g key={`gr-beat-${i}`} transform={`translate(${cx}, 0)`}>
              <rect
                x={-w / 2}
                y={-12}
                width={w}
                height={24}
                rx={12}
                fill={active ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.02)'}
                stroke={active ? ACCENT.red : ACCENT.rule}
                strokeWidth={1.2}
                style={{ transition: `fill ${0.3 / speed}s ease, stroke ${0.3 / speed}s ease` }}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="0.18em"
                fill={active ? ACCENT.red : ACCENT.dim}
                style={{ transition: `fill ${0.3 / speed}s ease` }}
              >
                {label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function GdRavineSplitPane() {
  const speed = useSpeed()
  const PHASES = 3
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p + 1) % PHASES),
      6000 / speed,
    )
    return () => clearInterval(id)
  }, [speed])

  // Smooth step counter — beat 2 advances 0→32 over ~5s.
  const [stepIdx, setStepIdx] = useState(0)
  useEffect(() => {
    if (phase < 2) {
      setStepIdx(0)
      return
    }
    setStepIdx(0)
    let i = 0
    const totalMs = 5200 / speed
    const stepMs = totalMs / 32
    const id = setInterval(() => {
      i += 1
      if (i >= 32) {
        setStepIdx(32)
        clearInterval(id)
      } else {
        setStepIdx(i)
      }
    }, stepMs)
    return () => clearInterval(id)
  }, [phase, speed])

  const safeIdx = Math.max(0, Math.min(GR_TRAIL.length - 1, stepIdx))
  const cur = GR_TRAIL[safeIdx]

  const phaseLabels = ['set the geometry', 'steep vs shallow', 'zig-zag descent']

  const subtitleByPhase: ReactNode[] = [
    <>
      Real loss surfaces aren&apos;t round bowls. They&apos;re narrow
      <em> ravines</em> — steep across, shallow along. The gradient at
      every point is dominated by the steep direction.
    </>,
    <>
      Same step size in every direction means the update is too{' '}
      <em>large</em> for the steep wall (bounces) and too <em>small</em>{' '}
      for the long valley (crawls). One η can&apos;t serve both.
    </>,
    <>
      The path zig-zags across the ravine wasting steps, while making
      slow progress along the valley toward the minimum. This is the
      problem Adam was built to fix.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'A 2D toy. Real loss landscapes are still ravine-shaped — they have many directions of high curvature and many of low. The same one-η problem appears, just in millions of dimensions.',
    'Cause: ∇L points across the ravine wall (where the slope is biggest), so −η∇L overshoots the valley. The component along the ravine is tiny, so each step barely moves down the valley.',
    'Reduce η → less overshoot but even slower progress along the valley. Increase η → faster valley progress but unstable / explodes across the wall. There is no good single η. Next scene: Adam scales each direction independently.',
  ]

  return (
    <SplitPaneScene
      viz={<VizGdRavine phase={phase} stepIdx={stepIdx} />}
      text={{
        kicker: 'ACT IV · GD · REALISTIC',
        title: 'Why vanilla GD zig-zags.',
        subtitle: subtitleByPhase[phase],
        accent: ACCENT.red,
        phase: (
          <PhaseChip
            current={phase + 1}
            total={PHASES}
            label={phaseLabels[phase]}
            accent={ACCENT.red}
          />
        ),
        stats: [
          { label: 'w₁  (along)', value: cur.w1.toFixed(2), color: ACCENT.cyan },
          { label: 'w₂  (across)', value: cur.w2.toFixed(2), color: ACCENT.red },
          { label: 'loss', value: cur.loss.toFixed(2), color: ACCENT.amber },
          { label: 'step', value: `${safeIdx} / 32` },
          { label: 'η  (fixed)', value: GR_LR.toFixed(3), color: ACCENT.cyan },
        ],
        equation: {
          label: 'one rule, one η',
          body: <>W ← W − η · ∇L(W)</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}
