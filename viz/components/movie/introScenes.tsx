'use client'

import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
import { usePrompt } from './promptContext'

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

const PROMPT_PREFIX = 'What if I asked my AI to finish this sentence: '

export function IntroColdOpenPanel() {
  const speed = useSpeed()
  const { prompt } = usePrompt()
  const CHAR_MS = 80
  // Type out the prompt the viewer chose (defaults to "To be, or no").
  // The wrapper sentence ("What if I asked my AI…") fades in pre-typed,
  // and only the user's prompt itself is character-typed for emphasis.
  const promptText = `${PROMPT_PREFIX}${prompt}`
  const chars = promptText.split('')

  // ─── Timeline (seconds, at speed 1×) ─────────────────────────────
  // PHASE 1 — title card alone, centered
  const T_CARD = 0.3
  const T_CARD_OUT = 2.4
  // PHASE 2 — small header + empty chat input
  const T_HEADER = 2.7
  const T_INPUT = 3.0
  // PHASE 3 — typing → send → user message → assistant thinking
  const T_TYPE = 3.6
  const T_TYPING_DONE = T_TYPE + (chars.length * CHAR_MS) / 1000
  const T_SEND = T_TYPING_DONE + 0.4
  const T_INPUT_OUT = T_SEND + 0.5
  const T_USER = T_SEND + 0.55
  const T_AI = T_USER + 0.75
  const T_DOTS = T_AI + 0.3
  const T_HINT = T_DOTS + 2.5

  // Card opacity keyframes — fade in 0.5s, hold, fade out + slide up
  const CARD_DUR = T_CARD_OUT - T_CARD + 0.45
  const cardTimes = [0, 0.5 / CARD_DUR, (T_CARD_OUT - T_CARD) / CARD_DUR, 1]
  // Input opacity keyframes
  const INPUT_DUR = T_INPUT_OUT - T_INPUT + 0.5
  const inputTimes = [0, 0.5 / INPUT_DUR, (T_INPUT_OUT - T_INPUT) / INPUT_DUR, 1]

  return (
    <div className="relative h-full w-full">
      {/* ───────── PHASE 1 — title card, centered ───────── */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-10"
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: [8, 0, 0, -16],
          scale: [0.97, 1, 1, 0.96],
        }}
        transition={{
          delay: T_CARD / speed,
          duration: CARD_DUR / speed,
          times: cardTimes,
          ease: 'easeInOut',
        }}
      >
        <div
          className="rounded-[10px] border-2 px-9 py-8 text-center"
          style={{
            borderColor: 'rgba(96,165,250,0.4)',
            background: 'rgba(18,18,21,0.95)',
            boxShadow: '0 14px 48px rgba(96,165,250,0.12)',
            maxWidth: 520,
          }}
        >
          <div
            className="font-mono text-[10px] tracking-[0.28em] uppercase"
            style={{ color: ACCENT.blue }}
          >
            prologue · the setup
          </div>
          <div
            className="mt-3 font-serif italic text-[34px] leading-[1.05]"
            style={{ color: FG }}
          >
            This is what happens inside.
          </div>
          <div className="mt-3 text-[13px] leading-6" style={{ color: DIM }}>
            A full transformer, from prompt to next token.
            <br />
            Every layer, every head.
          </div>
        </div>
      </motion.div>

      {/* ───────── PHASE 2/3 — header at top + chat ───────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-start gap-5 px-10 pt-8">
        {/* Small header (after card dismisses) */}
        <motion.div
          className="flex flex-col items-center gap-1 text-center"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: T_HEADER / speed, duration: 0.5 / speed, ease: 'easeOut' }}
        >
          <div
            className="font-mono text-[9px] tracking-[0.26em] uppercase"
            style={{ color: ACCENT.blue, opacity: 0.85 }}
          >
            prologue · the setup
          </div>
          <div
            className="font-serif italic text-[18px] leading-tight"
            style={{ color: FG, opacity: 0.85 }}
          >
            This is what happens inside.
          </div>
        </motion.div>

        {/* Chat zone — input fades out, conversation fades in */}
        <div className="relative w-full max-w-[560px]" style={{ minHeight: 220 }}>
          {/* Input box */}
          <motion.div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-[10px] border-2 px-4 py-3.5"
            style={{
              borderColor: 'rgba(96, 165, 250, 0.45)',
              background: 'rgba(18, 18, 21, 0.95)',
              boxShadow: '0 8px 32px rgba(96,165,250,0.12)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [12, 0, 0, -8],
            }}
            transition={{
              delay: T_INPUT / speed,
              duration: INPUT_DUR / speed,
              times: inputTimes,
              ease: 'easeInOut',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-h-[22px] font-mono text-[14px]" style={{ color: FG }}>
                {chars.map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: T_TYPE / speed + (i * CHAR_MS) / 1000 / speed,
                      duration: 0.04 / speed,
                    }}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </motion.span>
                ))}
                <motion.span
                  className="inline-block align-middle"
                  style={{ width: 2, height: 16, marginLeft: 2, background: ACCENT.blue }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.0 / speed, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
                />
              </div>
              <motion.div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px]"
                style={{
                  borderColor: ACCENT.blue,
                  border: '1px solid',
                  color: ACCENT.blue,
                  opacity: 0.55,
                }}
                animate={{
                  opacity: [0.55, 1, 0.85],
                  boxShadow: [
                    '0 0 0 rgba(96,165,250,0)',
                    '0 0 24px rgba(96,165,250,0.9)',
                    '0 0 6px rgba(96,165,250,0.25)',
                  ],
                }}
                transition={{
                  delay: T_SEND / speed,
                  duration: 0.9 / speed,
                  ease: 'easeOut',
                  repeat: 0,
                }}
              >
                ↵
              </motion.div>
            </div>
          </motion.div>

          {/* Chat thread — user bubble + AI thinking */}
          <div className="absolute inset-0 flex flex-col justify-center gap-3">
            {/* User message */}
            <motion.div
              className="self-end max-w-[88%] rounded-[14px] rounded-br-[4px] px-4 py-2.5"
              style={{
                background: 'rgba(96,165,250,0.18)',
                border: '1px solid rgba(96,165,250,0.45)',
                color: FG,
              }}
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: T_USER / speed,
                duration: 0.45 / speed,
                ease: [0.22, 1.2, 0.36, 1],
              }}
            >
              <div className="text-[13px] leading-5">{promptText}</div>
            </motion.div>

            {/* AI message — thinking dots */}
            <motion.div
              className="self-start max-w-[88%] rounded-[14px] rounded-bl-[4px] px-4 py-3"
              style={{
                background: 'rgba(115,115,115,0.10)',
                border: '1px solid rgba(115,115,115,0.32)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: T_AI / speed,
                duration: 0.4 / speed,
                ease: 'easeOut',
              }}
            >
              <div
                className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em]"
                style={{ color: DIM }}
              >
                assistant
              </div>
              <div className="flex items-end gap-2 h-3">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block rounded-full"
                    style={{ width: 8, height: 8, background: FG }}
                    initial={{ opacity: 0.2, y: 0, scale: 0.8 }}
                    animate={{
                      opacity: [0.2, 1, 0.2],
                      y: [0, -6, 0],
                      scale: [0.8, 1.05, 0.8],
                    }}
                    transition={{
                      delay: (T_DOTS + i * 0.16) / speed,
                      duration: 1.0 / speed,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Hint pointing into the next scene */}
        <motion.div
          className="mt-2 font-mono text-[11px] tracking-[0.22em] uppercase"
          style={{ color: ACCENT.blue }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 1], y: [4, 0, 0] }}
          transition={{
            delay: T_HINT / speed,
            duration: 1.5 / speed,
            times: [0, 0.4, 1],
            ease: 'easeOut',
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        >
          let&apos;s go inside ↓
        </motion.div>
      </div>
    </div>
  )
}

/** --- Shared panel for act intros (1, 2, 3, 5) ---
 *
 * Phase 3 spatial-recursion redesign: every act intro now answers three
 * questions in sequence so the viewer knows where they've been, where they
 * are, and where they're about to go:
 *
 *   1. recap   "we just saw …"        (faint, top, slides in first)
 *   2. headline "this act is about …"  (bold, center, the §4 narrative beat)
 *   3. teaser  "coming up: …"          (accent dotted line, bottom)
 *
 * recap is omitted on Act I (nothing came before the cold open beyond
 * "watch a transformer think"). Each line has its own delay so the eye
 * reads them in order.
 */

export interface ActFramingPanelProps {
  actLabel: string
  headline: string
  accent: string
  /** What the previous act covered. Omit on Act I. */
  recap?: string
  /** What this act will cover next. */
  teaser?: string
}

export function ActFramingPanel({
  actLabel,
  headline,
  accent,
  recap,
  teaser,
}: ActFramingPanelProps) {
  const speed = useSpeed()
  const T_ACT = 0.25 / speed
  const T_RECAP = 0.55 / speed
  const T_HEADLINE = recap ? 1.1 / speed : 0.55 / speed
  const T_TEASER = T_HEADLINE + 0.7 / speed
  return (
    <div className="relative flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-[640px] flex-col items-center gap-5 text-center">
        <motion.div
          className="font-mono text-[10px] tracking-[0.26em] uppercase"
          style={{ color: accent }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: T_ACT, duration: 0.45 / speed, ease: 'easeOut' }}
        >
          {actLabel}
        </motion.div>

        {recap && (
          <motion.div
            className="font-mono text-[11px] leading-5 tracking-wide"
            style={{ color: DIM, maxWidth: '480px' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ delay: T_RECAP, duration: 0.45 / speed, ease: 'easeOut' }}
          >
            <span className="opacity-60">we just saw — </span>
            {recap}
          </motion.div>
        )}

        <motion.div
          className="font-serif italic text-[28px] leading-tight"
          style={{ color: FG }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: T_HEADLINE, duration: 0.55 / speed, ease: 'easeOut' }}
        >
          {headline}
        </motion.div>

        {teaser && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T_TEASER, duration: 0.45 / speed, ease: 'easeOut' }}
          >
            <span
              className="inline-block h-px w-6"
              style={{ background: accent, opacity: 0.6 }}
            />
            <span
              className="font-mono text-[10px] tracking-[0.18em] uppercase"
              style={{ color: accent, opacity: 0.85 }}
            >
              coming up — {teaser}
            </span>
            <span
              className="inline-block h-px w-6"
              style={{ background: accent, opacity: 0.6 }}
            />
          </motion.div>
        )}
      </div>
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
