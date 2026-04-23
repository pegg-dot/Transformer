'use client'

import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'

const ACCENT = {
  blue: '#60a5fa',
  violet: '#a78bfa',
  mint: '#34d399',
  amber: '#f59e0b',
  red: '#f87171',
}
const FG = '#f5f5f4'
const DIM = '#737373'

/** --- Cold open (Prologue) --- */

const PROMPT_TEXT = 'What if I asked my AI to finish this sentence: to be, or no'

export function IntroColdOpenPanel() {
  const speed = useSpeed()
  const CHAR_MS = 70
  const TYPE_START_S = 1.2
  const chars = PROMPT_TEXT.split('')
  const TYPING_DONE_S = TYPE_START_S + (chars.length * CHAR_MS) / 1000 / speed
  const SEND_PULSE_S = TYPING_DONE_S + 0.4 / speed
  const DISSOLVE_S = SEND_PULSE_S + 1.8 / speed

  return (
    <div className="relative h-full w-full">
      <motion.div
        className="absolute inset-0 flex items-center justify-center px-10"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: DISSOLVE_S, duration: 1.2 / speed, ease: 'easeIn' }}
      >
        <motion.div
          className="w-full max-w-[540px] rounded-[6px] border px-4 py-3.5"
          style={{
            borderColor: 'rgba(115, 115, 115, 0.5)',
            background: 'rgba(18, 18, 21, 0.85)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 / speed, duration: 0.5 / speed, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-h-[22px] font-mono text-[14px]" style={{ color: FG }}>
              {chars.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: TYPE_START_S + (i * CHAR_MS) / 1000 / speed,
                    duration: 0.001,
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </motion.span>
              ))}
              <motion.span
                className="inline-block align-middle"
                style={{
                  width: 2,
                  height: 16,
                  marginLeft: 2,
                  background: ACCENT.blue,
                }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.0 / speed, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
              />
            </div>
            <motion.div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]"
              style={{
                borderColor: ACCENT.blue,
                border: '1px solid',
                color: ACCENT.blue,
                opacity: 0.8,
              }}
              animate={{
                opacity: [0.8, 1, 0.8],
                boxShadow: [
                  '0 0 0 rgba(96,165,250,0)',
                  '0 0 14px rgba(96,165,250,0.6)',
                  '0 0 0 rgba(96,165,250,0)',
                ],
              }}
              transition={{
                delay: SEND_PULSE_S,
                duration: 1.0 / speed,
                ease: 'easeOut',
                repeat: 0,
              }}
            >
              ↵
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 top-10 flex flex-col items-center gap-1.5 text-center"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DISSOLVE_S + 0.6 / speed, duration: 0.8 / speed, ease: 'easeOut' }}
      >
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: ACCENT.blue }}>
          prologue
        </div>
        <div className="font-serif text-[22px] italic" style={{ color: FG }}>
          This is what happens inside.
        </div>
        <div className="max-w-[480px] text-[13px]" style={{ color: DIM }}>
          A full transformer, from prompt to next token. Every layer, every head.
        </div>
      </motion.div>
    </div>
  )
}

/** --- Shared panel for act intros (1, 2, 3, 5) --- */

export interface ActFramingPanelProps {
  actLabel: string
  headline: string
  accent: string
}

export function ActFramingPanel({ actLabel, headline, accent }: ActFramingPanelProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-2.5 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
      >
        <div
          className="font-mono text-[10px] tracking-[0.24em] uppercase"
          style={{ color: accent }}
        >
          {actLabel}
        </div>
        <div
          className="font-serif italic text-[28px] leading-tight"
          style={{ color: FG, maxWidth: '640px' }}
        >
          {headline}
        </div>
      </motion.div>
    </div>
  )
}

/** --- Act 4: Training — miniature loss curve sketches in beside the tower --- */

export function Act4LossOverlay() {
  const speed = useSpeed()
  const points = [
    [0, 90], [60, 70], [120, 55], [180, 46], [240, 40],
    [300, 36], [360, 33], [420, 31], [480, 30], [540, 29.5],
  ]
  const d = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 / speed, duration: 0.6 / speed, ease: 'easeOut' }}
      >
        <div className="font-mono text-[10px] tracking-[0.24em] uppercase" style={{ color: ACCENT.amber }}>
          Act IV
        </div>
        <div className="font-serif italic text-[28px] leading-tight" style={{ color: FG, maxWidth: 640 }}>
          How the weights got there.
        </div>

        <svg width={560} height={120} viewBox="0 0 560 120" className="mt-3">
          <defs>
            <linearGradient id="loss-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ACCENT.amber} stopOpacity="0.35" />
              <stop offset="100%" stopColor={ACCENT.amber} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={d}
            fill="none"
            stroke={ACCENT.amber}
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.0 / speed, duration: 3.0 / speed, ease: 'easeOut' }}
          />
          <motion.path
            d={`${d} L 540 100 L 0 100 Z`}
            fill="url(#loss-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.6 / speed, duration: 0.8 / speed }}
          />
          <text x={6} y={12} fontSize={9} fontFamily="var(--font-mono)" fill={DIM}>loss</text>
          <text x={520} y={115} fontSize={9} fontFamily="var(--font-mono)" fill={DIM}>iters →</text>
        </svg>
      </motion.div>
    </div>
  )
}

/** --- Act 6: Output — a logit distribution sketches in --- */

export function Act6LogitOverlay() {
  const speed = useSpeed()
  const bars = [
    { label: 't', h: 0.92, color: ACCENT.blue },
    { label: ' ', h: 0.55, color: DIM },
    { label: 'e', h: 0.42, color: DIM },
    { label: 'h', h: 0.34, color: DIM },
    { label: 'o', h: 0.28, color: DIM },
    { label: 'w', h: 0.22, color: DIM },
    { label: 'a', h: 0.18, color: DIM },
  ]
  const BW = 44
  const GAP = 10
  const H = 120

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 / speed, duration: 0.6 / speed, ease: 'easeOut' }}
      >
        <div className="font-mono text-[10px] tracking-[0.24em] uppercase" style={{ color: ACCENT.red }}>
          Act VI
        </div>
        <div className="font-serif italic text-[28px] leading-tight" style={{ color: FG, maxWidth: 640 }}>
          And the final pick.
        </div>

        <svg
          width={bars.length * (BW + GAP)}
          height={H + 22}
          viewBox={`0 0 ${bars.length * (BW + GAP)} ${H + 22}`}
          className="mt-3"
        >
          {bars.map((b, i) => (
            <g key={i} transform={`translate(${i * (BW + GAP)}, 0)`}>
              <motion.rect
                x={0}
                y={H - b.h * H}
                width={BW}
                height={b.h * H}
                fill={b.color}
                fillOpacity={i === 0 ? 0.85 : 0.35}
                initial={{ scaleY: 0, transformOrigin: '50% 100%' }}
                animate={{ scaleY: 1 }}
                transition={{ delay: (1.0 + i * 0.08) / speed, duration: 0.5 / speed, ease: 'easeOut' }}
              />
              <text
                x={BW / 2}
                y={H + 16}
                textAnchor="middle"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill={i === 0 ? FG : DIM}
              >
                {b.label === ' ' ? '␣' : b.label}
              </text>
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  )
}
