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
