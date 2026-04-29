'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useSpeed } from './speedContext'
import { usePrompt } from './promptContext'
import { useLiveContinuation } from '@/lib/useLiveContinuation'

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

/**
 * Pick a hand-tuned continuation that completes the user's prompt in
 * Shakespearean style. The model is char-level trained on tinyshakespeare,
 * so this matches what you'd actually expect to come out of it.
 */
function pickReply(prompt: string): string {
  const p = prompt.trim().toLowerCase()
  if (p.startsWith('to be, or not')) return ', that is the question.'
  if (p.startsWith('to be, or')) return ' not to be, that is the question.'
  if (p.startsWith('to be')) return ', or not to be — that is the question.'
  if (p.startsWith('hark') || p.startsWith('hark!')) return ', what light through yonder window breaks!'
  if (p.startsWith('romeo')) return ', wherefore art thou, Romeo?'
  if (p.startsWith('hamlet')) return ', dread sovereign of the night!'
  if (p.startsWith('enter')) return ' a player, with a torch held high.'
  if (p.startsWith('o ') || p.startsWith('oh')) return ' that this too too solid flesh would melt.'
  return '… and the model would continue, one character at a time, until satisfied.'
}

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
  // PHASE 3 — typing → send → user message → assistant thinking → AI reply
  const T_TYPE = 3.6
  const T_TYPING_DONE = T_TYPE + (chars.length * CHAR_MS) / 1000
  const T_SEND = T_TYPING_DONE + 0.4
  const T_INPUT_OUT = T_SEND + 0.5
  const T_USER = T_SEND + 0.55
  const T_AI = T_USER + 0.75
  const T_DOTS = T_AI + 0.3
  // AI reply: dots run for 1.4s, then a continuation types in. Try the
  // live ONNX model first for the user's actual prompt; fall back to a
  // hand-tuned continuation if the model isn't ready or errored.
  const T_REPLY_START = T_DOTS + 1.4
  const live = useLiveContinuation(prompt, 32)
  const replyText =
    live.text.length > 0 ? live.text : pickReply(prompt)
  const REPLY_CHAR_MS = 50
  const T_REPLY_DONE = T_REPLY_START + (Math.max(replyText.length, 8) * REPLY_CHAR_MS) / 1000
  const T_HINT = T_REPLY_DONE + 0.6
  // PHASE 4 — translation pipeline. After the AI replies and the hint pulses
  // once, the prompt visibly "translates" into what enters the model:
  //   prompt text  →  token pills  →  integer IDs  →  small input matrix
  // Each row drops in with a 0.8s stagger. Layered above the chat so the
  // viewer can still see what was typed.
  const T_PIPELINE_START = T_HINT + 1.5
  const T_TOKENS_BEAT = T_PIPELINE_START + 0.8
  const T_IDS_BEAT = T_TOKENS_BEAT + 0.8
  const T_MATRIX_BEAT = T_IDS_BEAT + 0.9
  // Hold extended (was +1.5) so the matrix has time to register as the
  // "thing that becomes Scene 2's slab". Earlier pipeline rows dim during
  // the hold so the matrix is the clear focal point.
  const T_MATRIX_FOCUS = T_MATRIX_BEAT + 1.6
  const T_MATRIX_HOLD = T_MATRIX_BEAT + 4.5
  // Final beat: the chat + pipeline panel morphs down-and-left toward where
  // the model's input slab will appear in the next scene. Triggers after
  // the matrix has been visible long enough to read.
  const T_MORPH = T_MATRIX_HOLD + 0.5

  // Pipeline data — first 14 chars of the prompt + integer IDs (charCode % 65)
  const pipelineChars = (prompt || 'To be, or no').split('').slice(0, 14)
  const idForCh = (ch: string) => ch.charCodeAt(0) % 65
  const PIPELINE_COLORS = [
    ACCENT.violet, ACCENT.blue, ACCENT.mint,
    ACCENT.amber, ACCENT.red, '#22d3ee', // cyan
  ]
  const colorForIdx = (i: number) =>
    PIPELINE_COLORS[i % PIPELINE_COLORS.length]

  // Card opacity keyframes — fade in 0.5s, hold, fade out + slide up
  const CARD_DUR = T_CARD_OUT - T_CARD + 0.45
  const cardTimes = [0, 0.5 / CARD_DUR, (T_CARD_OUT - T_CARD) / CARD_DUR, 1]
  // Input opacity keyframes
  const INPUT_DUR = T_INPUT_OUT - T_INPUT + 0.5
  const inputTimes = [0, 0.5 / INPUT_DUR, (T_INPUT_OUT - T_INPUT) / INPUT_DUR, 1]

  return (
    <motion.div
      className="relative h-full w-full"
      style={{ transformOrigin: 'bottom left' }}
      animate={{
        scale: [1, 1, 0.18],
        x: [0, 0, -180],
        y: [0, 0, 220],
        opacity: [1, 1, 0],
      }}
      transition={{
        delay: 0,
        duration: T_MORPH + 1.4,
        times: [0, T_MORPH / (T_MORPH + 1.4), 1],
        ease: [0.7, 0, 0.3, 1],
      }}
    >
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
              {/* Dots fade out as the AI begins typing its reply */}
              <motion.div
                className="flex items-end gap-2 h-3"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 1, 0] }}
                transition={{
                  delay: T_DOTS / speed,
                  duration: (T_REPLY_START - T_DOTS) / speed,
                  times: [0, 0.85, 1],
                  ease: 'easeIn',
                }}
              >
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
              </motion.div>

              {/* AI reply — live ONNX model streams real tokens for the
                  user's prompt; falls back to a hand-tuned continuation
                  if the model isn't ready in time. */}
              <motion.div
                className="-mt-3 text-[13px] leading-5"
                style={{ fontStyle: 'italic', color: FG }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: T_REPLY_START / speed,
                  duration: 0.4 / speed,
                  ease: 'easeOut',
                }}
              >
                {live.text.length > 0 ? (
                  <>
                    {live.text}
                    {!live.done && (
                      <motion.span
                        className="inline-block align-middle"
                        style={{ width: 2, height: 14, marginLeft: 2, background: ACCENT.blue }}
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.0, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Fallback: hand-tuned reply types in char-by-char */}
                    {replyText.split('').map((ch, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: (T_REPLY_START + (i * REPLY_CHAR_MS) / 1000) / speed,
                          duration: 0.04 / speed,
                        }}
                      >
                        {ch}
                      </motion.span>
                    ))}
                    <motion.span
                      className="inline-block align-middle"
                      style={{ width: 2, height: 14, marginLeft: 2, background: ACCENT.blue }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1, 0] }}
                      transition={{
                        delay: T_REPLY_START / speed,
                        duration: (T_REPLY_DONE - T_REPLY_START + 0.5) / speed,
                        times: [0, 0.05, 0.95, 1],
                        repeat: 0,
                      }}
                    />
                  </>
                )}
              </motion.div>
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

      {/* ───────── PHASE 4 — translation pipeline ─────────
          Layered above the chat, anchored to the lower portion of the panel.
          Drops in row-by-row to show: prompt → tokens → IDs → input matrix.
          Total ~4s. After this the existing morph carries the panel away. */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 z-30 flex justify-center"
        style={{ top: '54%' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: T_PIPELINE_START / speed,
          duration: 0.5 / speed,
          ease: 'easeOut',
        }}
      >
        <div
          className="flex flex-col items-stretch gap-2 rounded-[12px] border-2 px-7 py-5"
          style={{
            background: 'rgba(8,8,11,0.86)',
            borderColor: 'rgba(167,139,250,0.42)',
            boxShadow: '0 14px 56px rgba(167,139,250,0.22)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            minWidth: 580,
          }}
        >
          {/* Rows 1–3 (prompt, tokens, IDs) — dim to ~30% during the matrix
              hold so the matrix becomes the clear focal point. */}
          <motion.div
            className="flex flex-col items-stretch gap-2"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0.32] }}
            transition={{
              delay: T_PIPELINE_START / speed,
              duration: (T_MATRIX_FOCUS - T_PIPELINE_START + 0.6) / speed,
              times: [0, (T_MATRIX_FOCUS - T_PIPELINE_START) / (T_MATRIX_FOCUS - T_PIPELINE_START + 0.6), 1],
              ease: 'easeInOut',
            }}
          >
          {/* Row 1: YOUR PROMPT */}
          <PipelineRow
            label="YOUR PROMPT"
            labelColor={ACCENT.violet}
            delay={T_PIPELINE_START + 0.05}
            speed={speed}
          >
            <div
              className="font-serif italic text-[20px] leading-tight"
              style={{ color: FG }}
            >
              {prompt || 'To be, or no'}
            </div>
          </PipelineRow>

          <PipelineArrow delay={T_TOKENS_BEAT - 0.25} speed={speed} />

          {/* Row 2: TOKENS */}
          <PipelineRow
            label="TOKENS"
            labelColor={ACCENT.violet}
            delay={T_TOKENS_BEAT}
            speed={speed}
          >
            <div className="flex gap-1.5">
              {pipelineChars.map((ch, i) => (
                <motion.div
                  key={`tok-${i}`}
                  className="font-serif italic flex h-[34px] w-[28px] items-center justify-center rounded-[4px] border text-[18px]"
                  style={{
                    color: FG,
                    borderColor: `${colorForIdx(i)}77`,
                    background: `${colorForIdx(i)}14`,
                  }}
                  initial={{ opacity: 0, y: -6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: (T_TOKENS_BEAT + 0.1 + i * 0.04) / speed,
                    duration: 0.32 / speed,
                    ease: [0.22, 1.2, 0.36, 1],
                  }}
                >
                  {ch === ' ' ? '·' : ch}
                </motion.div>
              ))}
            </div>
          </PipelineRow>

          <PipelineArrow delay={T_IDS_BEAT - 0.25} speed={speed} />

          {/* Row 3: IDS */}
          <PipelineRow
            label="IDS"
            labelColor={ACCENT.violet}
            delay={T_IDS_BEAT}
            speed={speed}
          >
            <div className="flex gap-1.5">
              {pipelineChars.map((ch, i) => (
                <motion.div
                  key={`id-${i}`}
                  className="font-mono flex h-[34px] w-[28px] items-center justify-center rounded-[4px] border text-[12px] tabular-nums"
                  style={{
                    color: colorForIdx(i),
                    borderColor: `${colorForIdx(i)}55`,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  initial={{ opacity: 0, rotateX: -90 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  transition={{
                    delay: (T_IDS_BEAT + 0.1 + i * 0.04) / speed,
                    duration: 0.32 / speed,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {idForCh(ch)}
                </motion.div>
              ))}
            </div>
          </PipelineRow>

          <PipelineArrow delay={T_MATRIX_BEAT - 0.25} speed={speed} />
          </motion.div>

          {/* Row 4: INPUT MATRIX — stays bright during hold, breathes a soft
              violet glow so it reads as a live focal object. */}
          <PipelineRow
            label="INPUT MATRIX"
            labelColor={ACCENT.violet}
            delay={T_MATRIX_BEAT}
            speed={speed}
          >
            <motion.div
              className="flex items-center gap-3"
              animate={{
                filter: [
                  `drop-shadow(0 0 0 ${ACCENT.violet}00)`,
                  `drop-shadow(0 0 16px ${ACCENT.violet}cc)`,
                  `drop-shadow(0 0 4px ${ACCENT.violet}44)`,
                  `drop-shadow(0 0 16px ${ACCENT.violet}cc)`,
                ],
              }}
              transition={{
                delay: (T_MATRIX_FOCUS) / speed,
                duration: 3.0 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.svg
                width={pipelineChars.length * 30}
                height={56}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: (T_MATRIX_BEAT + 0.1) / speed,
                  duration: 0.5 / speed,
                  ease: [0.22, 1.1, 0.36, 1],
                }}
              >
                {/* Border — breathes during the hold */}
                <motion.rect
                  x={0.5}
                  y={0.5}
                  width={pipelineChars.length * 30 - 1}
                  height={55}
                  rx={4}
                  fill="rgba(167,139,250,0.06)"
                  stroke={ACCENT.violet}
                  strokeWidth={1.4}
                  strokeOpacity={0.85}
                  animate={{
                    strokeWidth: [1.4, 2.4, 1.4],
                    strokeOpacity: [0.85, 1, 0.85],
                  }}
                  transition={{
                    delay: T_MATRIX_FOCUS / speed,
                    duration: 3.0 / speed,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                {/* Cells: T columns × 7 d_model rows */}
                {pipelineChars.map((_, t) =>
                  Array.from({ length: 7 }).map((_, d) => {
                    const v = (Math.sin(t * 0.7 + d * 1.5) + 1) / 2
                    return (
                      <motion.rect
                        key={`mc-${t}-${d}`}
                        x={4 + t * 30}
                        y={4 + d * 7.5}
                        width={22}
                        height={6.5}
                        fill={colorForIdx(t)}
                        opacity={0}
                        animate={{ opacity: 0.18 + v * 0.55 }}
                        transition={{
                          delay:
                            (T_MATRIX_BEAT +
                              0.25 +
                              t * 0.02 +
                              d * 0.015) /
                            speed,
                          duration: 0.3 / speed,
                        }}
                      />
                    )
                  }),
                )}
              </motion.svg>
              <motion.div
                className="font-mono text-[10px] tracking-[0.2em] uppercase whitespace-nowrap"
                style={{ color: ACCENT.violet, opacity: 0.85 }}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 0.85, x: 0 }}
                transition={{
                  delay: (T_MATRIX_BEAT + 0.55) / speed,
                  duration: 0.4 / speed,
                }}
              >
                [<span style={{ color: ACCENT.violet }}>{pipelineChars.length}</span>
                {', 384]'}
                <br />
                <span style={{ opacity: 0.6 }}>
                  this enters Block 0 →
                </span>
              </motion.div>
            </motion.div>
          </PipelineRow>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Single row of the translation pipeline — left-side label + right content. */
function PipelineRow({
  label,
  labelColor,
  delay,
  speed,
  children,
}: {
  label: string
  labelColor: string
  delay: number
  speed: number
  children: ReactNode
}) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay / speed,
        duration: 0.4 / speed,
        ease: 'easeOut',
      }}
    >
      <div
        className="font-mono shrink-0 w-[120px] text-right text-[10px] tracking-[0.22em] uppercase"
        style={{ color: labelColor, opacity: 0.85 }}
      >
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  )
}

/** Small downward arrow between pipeline rows — fades in then stays. */
function PipelineArrow({
  delay,
  speed,
}: {
  delay: number
  speed: number
}) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{
        delay: delay / speed,
        duration: 0.3 / speed,
      }}
    >
      <div className="w-[120px]" />
      <div
        className="font-mono text-[16px] leading-none"
        style={{ color: ACCENT.violet, opacity: 0.55 }}
      >
        ↓
      </div>
    </motion.div>
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
