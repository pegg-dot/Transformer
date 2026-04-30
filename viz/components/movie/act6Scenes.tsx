'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
}

const ACT6_KICKER = 'ACT VI · THE OUTPUT'

/* =========================================================================
 * Scene 33 — act6-intro: "What does one forward pass actually produce?"
 *
 * Bridge scene. After Act V's modern-upgrades recap, this is the payoff:
 * the ENTIRE network's job, when you strip away every internal trick, is
 * to turn the last position's hidden state into a probability over the
 * vocabulary, and pick one token.
 *
 * Pipeline reads strictly left → right (and top → bottom for context):
 *
 *   PROMPT  ─ position 6 highlighted
 *      │
 *      ▼ (six blocks already happened)
 *   FINAL HIDDEN STATE  →  OUTPUT HEAD (W_U)  →  LOGITS  →  SOFTMAX → BARS
 *                                                                       │
 *                                                       chosen token ◄──┘
 *                                                                │
 *                                                appended to prompt
 *
 * Phases (4 phases × ~5s = 20s total):
 *   p0: prompt strip lights up, last position highlighted
 *   p1: hidden state vector → output head → logits column draws in
 *   p2: softmax bar chart fills in, top bar lights up
 *   p3: winning token tile pops out, flies up, appends to prompt
 * ====================================================================== */

const VB_W = 1400
const VB_H = 1000

// Number of trailing prompt characters to show in the strip. The strip also
// holds one extra slot for the predicted next token, so the on-screen tile
// count is STRIP_WINDOW + 1.
const STRIP_WINDOW = 6

// Probability shape stays fixed — only the characters change with the prompt.
// The shape is what carries the "one peak, several alternates" story; the
// labels carry the prompt-aware part.
const TOPK_PROBS = [0.62, 0.12, 0.08, 0.05, 0.04] as const

type TopKEntry = { tok: string; label: string; p: number }
type Prediction = {
  promptChars: string[] // visible window of the prompt
  basePosition: number // prompt index of promptChars[0]
  lastIdx: number // index inside promptChars of the last char
  nextChar: string // predicted next char (raw, may be ' ')
  nextLabel: string // displayable form of nextChar (' ' becomes '·')
  topK: TopKEntry[]
}

const TOPK_POOL = [' ', 'e', 't', 'a', 'o', 'i', 'n', 's', 'h', 'r', 'l', 'd', 'u', 'm', 'c']

function displayChar(c: string): string {
  return c === ' ' ? '·' : c
}

// Canonical line the demo is set up to land on. Hoisted here so both
// Scene 33 (single next-token prediction) and Scene 34 (the loop) ride the
// same target whenever the prompt is a prefix of it.
const HAMLET_TARGET = 'To be, or not to be -- that is the question.'

function isHamletPrefix(s: string): boolean {
  return (
    s.length > 0 &&
    s.length < HAMLET_TARGET.length &&
    HAMLET_TARGET.toLowerCase().startsWith(s.toLowerCase())
  )
}

/**
 * Given the active prompt, pick a plausible next character and a top-5
 * candidate set. Deterministic (same prompt → same prediction) so the scene
 * doesn't flicker between renders.
 *
 * If the prompt is a prefix of the canonical Hamlet line, the winner is the
 * actual next character of the line (so Scenes 33 and 34 stay in sync). For
 * any other prompt, we fall back to a small letter-class heuristic.
 */
function predictFromPrompt(prompt: string, seed: number): Prediction {
  const cleaned = prompt.length > 0 ? prompt : 'hello'
  const window = cleaned.slice(-STRIP_WINDOW)
  const promptChars = window.split('')
  const lastIdx = promptChars.length - 1
  const basePosition = Math.max(0, cleaned.length - promptChars.length)
  const last = cleaned[cleaned.length - 1] ?? ' '
  const lastLow = last.toLowerCase()

  // Step 1 — pick the winner. Hamlet path overrides the heuristic.
  let winner: string
  if (isHamletPrefix(cleaned)) {
    winner = HAMLET_TARGET[cleaned.length]!
  } else if (last === '.' || last === ',' || last === '!' || last === '?') {
    winner = ' '
  } else if (last === ' ') {
    winner = ['t', 'a', 'i', 's', 'w'][seed % 5]
  } else if ('aeiou'.includes(lastLow)) {
    winner = ['n', 'r', 's', 't', 'l'][seed % 5]
  } else if (/[a-z]/.test(lastLow)) {
    winner = ['e', 'a', 'o', ' ', 'i'][seed % 5]
  } else {
    winner = 'e'
  }

  // Step 2 — build top-5 with the winner first, four plausible alternates
  // after. We compare alternates case-insensitively so the Hamlet 'T' and
  // the heuristic 't' don't both end up in the list.
  const alternates: string[] = []
  for (const c of TOPK_POOL) {
    if (c.toLowerCase() === winner.toLowerCase()) continue
    if (alternates.includes(c)) continue
    alternates.push(c)
    if (alternates.length === 4) break
  }
  const winnerLabel = displayChar(winner)
  const topK: TopKEntry[] = [
    { tok: winner, label: winnerLabel, p: TOPK_PROBS[0] },
    ...alternates.map((c, i) => ({ tok: c, label: displayChar(c), p: TOPK_PROBS[i + 1] })),
  ]

  return {
    promptChars,
    basePosition,
    lastIdx,
    nextChar: winner,
    nextLabel: winnerLabel,
    topK,
  }
}

// Geometry — token strip
const STRIP_Y = 100
const TILE_W = 78
const TILE_H = 64
const STRIP_GAP = 10
const STRIP_LABEL_X = 40
const STRIP_TILES_X = 180

// Geometry — mechanism row
const MECH_Y0 = 230
const MECH_Y1 = 660

// Hidden state vector card
const HSTATE_X = 60
const HSTATE_W = 110
const HSTATE_Y = 270
const HSTATE_H = 320
const HSTATE_CELLS = 8

// Output head box
const HEAD_X = 250
const HEAD_W = 180
const HEAD_Y = 330
const HEAD_H = 200

// Logits column
const LOGIT_X = 510
const LOGIT_W = 90
const LOGIT_Y = 250
const LOGIT_H = 380
const LOGIT_CELLS = 9

// Bar chart
const BAR_X = 700
const BAR_W = 660
const BAR_Y = 240
const BAR_LANE_H = 60
const BAR_GAP = 16
const BAR_LABEL_W = 60 // space at left of bar for "t" / "·" label

// Chosen token tile (animates up to the strip)
const PICK_W = 78
const PICK_H = 64

/* ─────────── Helpers ─────────── */
function fadeIn(delay: number, dur = 0.55) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: dur, ease: 'easeOut' },
  } as const
}

function ArrowRight({
  x1,
  x2,
  y,
  accent,
  label,
  active,
  delay,
}: {
  x1: number
  x2: number
  y: number
  accent: string
  label?: string
  active?: boolean
  delay?: number
}) {
  const animated = active !== undefined && delay !== undefined
  const isOn = active ?? true
  const d = delay ?? 0
  return (
    <g>
      {animated ? (
        <motion.line
          x1={x1}
          y1={y}
          x2={x2 - 8}
          y2={y}
          stroke={accent}
          strokeOpacity={0.85}
          strokeWidth={1.6}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: isOn ? 1 : 0,
            opacity: isOn ? 1 : 0,
          }}
          transition={{
            duration: 0.5,
            delay: isOn ? d : 0,
            ease: 'easeOut',
          }}
        />
      ) : (
        <line
          x1={x1}
          y1={y}
          x2={x2 - 8}
          y2={y}
          stroke={accent}
          strokeOpacity={0.85}
          strokeWidth={1.6}
        />
      )}
      {animated ? (
        <motion.polygon
          points={`${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}`}
          fill={accent}
          fillOpacity={0.95}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: isOn ? 1 : 0, scale: isOn ? 1 : 0.4 }}
          transition={{
            duration: 0.25,
            delay: isOn ? d + 0.45 : 0,
            ease: 'easeOut',
          }}
          style={{ transformOrigin: `${x2 - 5}px ${y}px` }}
        />
      ) : (
        <polygon
          points={`${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}`}
          fill={accent}
          fillOpacity={0.95}
        />
      )}
      {label && (
        <motion.text
          x={(x1 + x2) / 2}
          y={y - 10}
          textAnchor="middle"
          fill={accent}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={11}
          letterSpacing={1.6}
          fontWeight={500}
          initial={animated ? { opacity: 0 } : false}
          animate={animated ? { opacity: isOn ? 1 : 0 } : undefined}
          transition={
            animated
              ? { duration: 0.3, delay: isOn ? d + 0.4 : 0 }
              : undefined
          }
        >
          {label}
        </motion.text>
      )}
    </g>
  )
}

/* ─────────── Token strip (the prompt context) ─────────── */
function TokenStrip({ phase, pred }: { phase: number; pred: Prediction }) {
  // Phase 3: the chosen token has been appended.
  const showAppended = phase >= 3
  const { promptChars, basePosition, lastIdx, nextLabel } = pred

  return (
    <g>
      <text
        x={STRIP_LABEL_X}
        y={STRIP_Y + TILE_H / 2 + 5}
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={2.4}
      >
        PROMPT
      </text>

      {/* Existing prompt tokens (the trailing window) */}
      {promptChars.map((ch, i) => {
        const isLast = i === lastIdx
        const x = STRIP_TILES_X + i * (TILE_W + STRIP_GAP)
        return (
          <motion.g key={`tok-${i}`} {...fadeIn(0.05 * i)}>
            <rect
              x={x}
              y={STRIP_Y}
              width={TILE_W}
              height={TILE_H}
              rx={8}
              ry={8}
              fill={isLast ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)'}
              stroke={isLast ? ACCENT.amber : 'rgba(255,255,255,0.35)'}
              strokeWidth={isLast ? 2 : 1.2}
            />
            <text
              x={x + TILE_W / 2}
              y={STRIP_Y + TILE_H / 2 + 12}
              textAnchor="middle"
              fill={isLast ? ACCENT.amber : 'rgba(255,255,255,0.9)'}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={32}
              fontWeight={600}
            >
              {displayChar(ch)}
            </text>
            {/* Absolute position number within the prompt */}
            <text
              x={x + TILE_W / 2}
              y={STRIP_Y - 8}
              textAnchor="middle"
              fill={isLast ? ACCENT.amber : 'rgba(255,255,255,0.4)'}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={10}
              letterSpacing={1.2}
            >
              {basePosition + i}
            </text>
          </motion.g>
        )
      })}

      {/* "Last position" caret */}
      <motion.g {...fadeIn(0.6)}>
        <text
          x={STRIP_TILES_X + lastIdx * (TILE_W + STRIP_GAP) + TILE_W / 2}
          y={STRIP_Y + TILE_H + 20}
          textAnchor="middle"
          fill={ACCENT.amber}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={11}
          letterSpacing={1.6}
          fontWeight={600}
        >
          ↑ last position
        </text>
      </motion.g>

      {/* Appended next-token slot — shown empty before phase 3, filled after */}
      <g>
        {(() => {
          const x = STRIP_TILES_X + (lastIdx + 1) * (TILE_W + STRIP_GAP)
          return (
            <>
              <rect
                x={x}
                y={STRIP_Y}
                width={TILE_W}
                height={TILE_H}
                rx={8}
                ry={8}
                fill="rgba(52,211,153,0.04)"
                stroke={ACCENT.mint}
                strokeOpacity={showAppended ? 0.95 : 0.35}
                strokeWidth={showAppended ? 2 : 1}
                strokeDasharray={showAppended ? undefined : '5 4'}
              />
              <motion.text
                x={x + TILE_W / 2}
                y={STRIP_Y + TILE_H / 2 + 12}
                textAnchor="middle"
                fill={ACCENT.mint}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={32}
                fontWeight={700}
                animate={{ opacity: showAppended ? 1 : 0.0 }}
                transition={{ duration: 0.5 }}
              >
                {nextLabel}
              </motion.text>
              <text
                x={x + TILE_W / 2}
                y={STRIP_Y - 8}
                textAnchor="middle"
                fill={showAppended ? ACCENT.mint : 'rgba(255,255,255,0.3)'}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={10}
                letterSpacing={1.2}
              >
                {basePosition + lastIdx + 1}?
              </text>
            </>
          )
        })()}
      </g>
    </g>
  )
}

/* ─────────── Final hidden state vector card ─────────── */
function HiddenStateCard({ active }: { active: boolean }) {
  // Bright, varied cells to read as "a real activation vector".
  const cellVals = [0.45, 0.78, 0.22, 0.91, 0.34, 0.62, 0.15, 0.71]
  // Stage delays: card border first, then label, then cells cascade,
  // then footer "d_model" caption. Whole sequence ~0.7s.
  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.6 }}
      transition={{ duration: 0.5 }}
    >
      <motion.rect
        x={HSTATE_X}
        y={HSTATE_Y}
        width={HSTATE_W}
        height={HSTATE_H}
        rx={10}
        ry={10}
        fill="rgba(245,158,11,0.06)"
        stroke={ACCENT.amber}
        animate={{
          strokeOpacity: active ? 0.95 : 0.55,
          strokeWidth: active ? 2 : 1.4,
        }}
        transition={{ duration: 0.4 }}
      />
      <motion.text
        x={HSTATE_X + HSTATE_W / 2}
        y={HSTATE_Y - 36}
        textAnchor="middle"
        fill={ACCENT.amber}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2}
        fontWeight={600}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.55 }}
        transition={{ duration: 0.4, delay: active ? 0.1 : 0 }}
      >
        FINAL HIDDEN STATE
      </motion.text>
      <motion.text
        x={HSTATE_X + HSTATE_W / 2}
        y={HSTATE_Y - 20}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.55 }}
        transition={{ duration: 0.4, delay: active ? 0.2 : 0 }}
      >
        h_T (last position)
      </motion.text>

      {/* Cells cascade in top→bottom when active so the vector reads as
          something that was just computed, not a static texture. */}
      {(() => {
        const padY = 18
        const cellH = (HSTATE_H - padY * 2) / HSTATE_CELLS
        const cellW = HSTATE_W - 24
        return cellVals.slice(0, HSTATE_CELLS).map((v, i) => {
          const cx = HSTATE_X + 12
          const cy = HSTATE_Y + padY + i * cellH
          return (
            <motion.rect
              key={i}
              x={cx}
              y={cy + 2}
              width={cellW}
              height={cellH - 4}
              rx={3}
              ry={3}
              fill={`rgba(245,158,11,${0.18 + v * 0.55})`}
              stroke="rgba(245,158,11,0.55)"
              strokeWidth={0.8}
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{
                opacity: active ? 1 : 0.5,
                scaleX: active ? 1 : 0.85,
              }}
              transition={{
                duration: 0.32,
                delay: active ? 0.25 + i * 0.05 : 0,
                ease: 'easeOut',
              }}
              style={{ transformOrigin: `${cx + cellW / 2}px ${cy + cellH / 2}px` }}
            />
          )
        })
      })()}

      <motion.text
        x={HSTATE_X + HSTATE_W / 2}
        y={HSTATE_Y + HSTATE_H + 20}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        letterSpacing={1.4}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.3, delay: active ? 0.7 : 0 }}
      >
        d_model
      </motion.text>
    </motion.g>
  )
}

/* ─────────── Output head (W_U projection) ─────────── */
function OutputHead({ active }: { active: boolean }) {
  // Stage delays — kicks in after the hidden→head arrow finishes drawing
  // (~1.1s after phase-1 entry).
  const dBox = 1.1
  const dHeader = 1.25
  const dEq = 1.4
  const dSub = 1.65
  const dItalic = 1.85
  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.5 }}
      transition={{ duration: 0.5 }}
    >
      <motion.rect
        x={HEAD_X}
        y={HEAD_Y}
        width={HEAD_W}
        height={HEAD_H}
        rx={12}
        ry={12}
        fill="rgba(96,165,250,0.06)"
        stroke={ACCENT.blue}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: active ? 1 : 0.5,
          scale: 1,
          strokeOpacity: active ? 0.95 : 0.5,
          strokeWidth: active ? 2 : 1.4,
        }}
        transition={{
          duration: 0.45,
          delay: active ? dBox : 0,
          ease: 'easeOut',
        }}
        style={{
          transformOrigin: `${HEAD_X + HEAD_W / 2}px ${HEAD_Y + HEAD_H / 2}px`,
        }}
      />
      <motion.text
        x={HEAD_X + HEAD_W / 2}
        y={HEAD_Y + 28}
        textAnchor="middle"
        fill={ACCENT.blue}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2}
        fontWeight={600}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.5 }}
        transition={{ duration: 0.35, delay: active ? dHeader : 0 }}
      >
        OUTPUT HEAD
      </motion.text>
      <motion.text
        x={HEAD_X + HEAD_W / 2}
        y={HEAD_Y + HEAD_H / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.92)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={26}
        fontWeight={500}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: active ? 1 : 0.6,
          scale: active ? [0.6, 1.12, 1] : 1,
        }}
        transition={{
          duration: 0.55,
          delay: active ? dEq : 0,
          ease: 'easeOut',
        }}
        style={{
          transformOrigin: `${HEAD_X + HEAD_W / 2}px ${HEAD_Y + HEAD_H / 2}px`,
        }}
      >
        W_U · h_T
      </motion.text>
      <motion.text
        x={HEAD_X + HEAD_W / 2}
        y={HEAD_Y + HEAD_H / 2 + 30}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={1.2}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.35, delay: active ? dSub : 0 }}
      >
        d_model → vocab
      </motion.text>
      <motion.text
        x={HEAD_X + HEAD_W / 2}
        y={HEAD_Y + HEAD_H - 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={11}
        fontStyle="italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.3 }}
        transition={{ duration: 0.35, delay: active ? dItalic : 0 }}
      >
        a single linear layer
      </motion.text>
    </motion.g>
  )
}

/* ─────────── Logits column ─────────── */
function LogitColumn({ active }: { active: boolean }) {
  // Varied logit values — top one (corresponding to "t") is highest.
  const logits = [3.2, -0.4, 1.1, 0.6, 0.8, -1.2, 2.1, -0.1, 1.7]
  const topLogit = Math.max(...logits)
  const padY = 16
  const cellH = (LOGIT_H - padY * 2) / LOGIT_CELLS
  const maxAbs = Math.max(...logits.map((l) => Math.abs(l)))
  // Cells start landing after the head→logits arrow finishes (~2.4s).
  const dCellsStart = 2.4
  const dCellsEnd = dCellsStart + LOGIT_CELLS * 0.05
  return (
    <motion.g
      animate={{ opacity: active ? 1 : 0.4 }}
      transition={{ duration: 0.5 }}
    >
      <motion.text
        x={LOGIT_X + LOGIT_W / 2}
        y={LOGIT_Y - 36}
        textAnchor="middle"
        fill={ACCENT.cyan}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2}
        fontWeight={600}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.5 }}
        transition={{ duration: 0.35, delay: active ? 2.2 : 0 }}
      >
        LOGITS
      </motion.text>
      <motion.text
        x={LOGIT_X + LOGIT_W / 2}
        y={LOGIT_Y - 20}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.5 }}
        transition={{ duration: 0.35, delay: active ? 2.3 : 0 }}
      >
        vocab_size scores
      </motion.text>
      <motion.rect
        x={LOGIT_X}
        y={LOGIT_Y}
        width={LOGIT_W}
        height={LOGIT_H}
        rx={8}
        ry={8}
        fill="rgba(34,211,238,0.04)"
        stroke={ACCENT.cyan}
        initial={{ opacity: 0 }}
        animate={{
          opacity: active ? 1 : 0.5,
          strokeOpacity: active ? 0.85 : 0.45,
        }}
        transition={{ duration: 0.4, delay: active ? 2.3 : 0 }}
        strokeWidth={1.4}
      />
      {logits.map((l, i) => {
        const cy = LOGIT_Y + padY + i * cellH
        const isTop = l === topLogit
        const intensity = (l + maxAbs) / (2 * maxAbs)
        const cellDelay = dCellsStart + i * 0.05
        return (
          <g key={i}>
            <motion.rect
              x={LOGIT_X + 8}
              y={cy + 2}
              width={LOGIT_W - 16}
              height={cellH - 4}
              rx={3}
              ry={3}
              fill={
                isTop
                  ? `rgba(52,211,153,${0.30 + intensity * 0.5})`
                  : `rgba(34,211,238,${0.10 + intensity * 0.35})`
              }
              stroke={isTop ? ACCENT.mint : ACCENT.cyan}
              strokeOpacity={isTop ? 0.95 : 0.55}
              strokeWidth={isTop ? 1.4 : 0.8}
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{
                opacity: active ? 1 : 0.5,
                scaleX: active ? 1 : 0.85,
              }}
              transition={{
                duration: 0.32,
                delay: active ? cellDelay : 0,
                ease: 'easeOut',
              }}
              style={{
                transformOrigin: `${LOGIT_X + LOGIT_W / 2}px ${cy + cellH / 2}px`,
              }}
            />
            <motion.text
              x={LOGIT_X + LOGIT_W / 2}
              y={cy + cellH / 2 + 4}
              textAnchor="middle"
              fill={isTop ? ACCENT.mint : 'rgba(255,255,255,0.7)'}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={11}
              fontWeight={500}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 1 : 0.55 }}
              transition={{
                duration: 0.32,
                delay: active ? cellDelay + 0.05 : 0,
              }}
            >
              {l.toFixed(1)}
            </motion.text>
            {/* Winner glow — pulses around the top logit cell once all
                cells have landed. Sells "this is the argmax". */}
            {isTop && active && (
              <motion.rect
                x={LOGIT_X + 6}
                y={cy}
                width={LOGIT_W - 12}
                height={cellH}
                rx={3}
                ry={3}
                fill="none"
                stroke={ACCENT.mint}
                strokeWidth={1.8}
                animate={{
                  opacity: [0, 0.95, 0.5, 0.95, 0],
                  scale: [1, 1.06, 1.0, 1.06, 1],
                }}
                transition={{
                  duration: 1.6,
                  delay: dCellsEnd + 0.1,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 1.4,
                }}
                style={{
                  transformOrigin: `${LOGIT_X + LOGIT_W / 2}px ${cy + cellH / 2}px`,
                }}
              />
            )}
          </g>
        )
      })}
      <motion.text
        x={LOGIT_X + LOGIT_W / 2}
        y={LOGIT_Y + LOGIT_H + 20}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        letterSpacing={1.4}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.35, delay: active ? dCellsEnd + 0.1 : 0 }}
      >
        vocab
      </motion.text>
    </motion.g>
  )
}

/* ─────────── Softmax bar chart ─────────── */
function SoftmaxBars({ phase, pred }: { phase: number; pred: Prediction }) {
  const showBars = phase >= 2
  const showWinner = phase >= 3
  const topK = pred.topK
  const totalH = topK.length * BAR_LANE_H + (topK.length - 1) * BAR_GAP
  const startY = BAR_Y + (LOGIT_H - totalH) / 2

  return (
    <g>
      {/* Title */}
      <text
        x={BAR_X + BAR_W / 2}
        y={BAR_Y - 36}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2}
        fontWeight={600}
      >
        SOFTMAX → P(next token)
      </text>
      <text
        x={BAR_X + BAR_W / 2}
        y={BAR_Y - 20}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
      >
        top-5 candidates
      </text>

      {topK.map((row, i) => {
        const isWinner = i === 0
        const fillColor = isWinner ? ACCENT.mint : ACCENT.cyan
        const labelColor = isWinner ? ACCENT.mint : 'rgba(255,255,255,0.7)'
        const y = startY + i * (BAR_LANE_H + BAR_GAP)
        const barLeft = BAR_X + BAR_LABEL_W + 12
        const barFullW = BAR_W - BAR_LABEL_W - 12 - 90 // leave room for % at right
        const barW = barFullW * row.p

        return (
          <g key={`bar-${i}`}>
            {/* Token tile (left) */}
            <rect
              x={BAR_X}
              y={y}
              width={BAR_LABEL_W}
              height={BAR_LANE_H}
              rx={6}
              ry={6}
              fill={isWinner ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.05)'}
              stroke={fillColor}
              strokeOpacity={isWinner && showWinner ? 1 : 0.6}
              strokeWidth={isWinner && showWinner ? 2 : 1.1}
            />
            <text
              x={BAR_X + BAR_LABEL_W / 2}
              y={y + BAR_LANE_H / 2 + 10}
              textAnchor="middle"
              fill={labelColor}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={26}
              fontWeight={600}
            >
              {row.label}
            </text>

            {/* Bar track */}
            <rect
              x={barLeft}
              y={y + 14}
              width={barFullW}
              height={BAR_LANE_H - 28}
              rx={4}
              ry={4}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth={0.8}
            />
            {/* Bar fill */}
            <motion.rect
              x={barLeft}
              y={y + 14}
              height={BAR_LANE_H - 28}
              rx={4}
              ry={4}
              fill={fillColor}
              fillOpacity={isWinner ? 0.85 : 0.5}
              initial={{ width: 0 }}
              animate={{ width: showBars ? barW : 0 }}
              transition={{ duration: 0.7, delay: 0.15 * i, ease: 'easeOut' }}
            />
            {/* Pulse on winner during phase 3 */}
            {isWinner && showWinner && (
              <motion.rect
                x={barLeft}
                y={y + 14}
                width={barW}
                height={BAR_LANE_H - 28}
                rx={4}
                ry={4}
                fill={fillColor}
                fillOpacity={0.4}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}

            {/* Probability number */}
            <motion.text
              x={BAR_X + BAR_W - 6}
              y={y + BAR_LANE_H / 2 + 6}
              textAnchor="end"
              fill={labelColor}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={16}
              fontWeight={600}
              initial={{ opacity: 0 }}
              animate={{ opacity: showBars ? 1 : 0 }}
              transition={{ delay: 0.15 * i + 0.5, duration: 0.4 }}
            >
              {(row.p * 100).toFixed(0)}%
            </motion.text>
          </g>
        )
      })}

      {/* Bottom callout */}
      <text
        x={BAR_X + BAR_W / 2}
        y={startY + totalH + 28}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-sans-serif, system-ui"
        fontSize={12}
        fontStyle="italic"
      >
        every probability ≥ 0 · they sum to 1
      </text>
    </g>
  )
}

/* ─────────── Chosen token tile that flies up to the strip ─────────── */
function ChosenTokenFlight({ phase, pred }: { phase: number; pred: Prediction }) {
  // Origin: middle of the winning bar's left token-tile area.
  // Destination: empty slot in the strip (lastIdx + 1).
  const topK = pred.topK
  const totalH = topK.length * BAR_LANE_H + (topK.length - 1) * BAR_GAP
  const startY = BAR_Y + (LOGIT_H - totalH) / 2
  const fromX = BAR_X + BAR_LABEL_W / 2 - PICK_W / 2
  const fromY = startY + BAR_LANE_H / 2 - PICK_H / 2
  const toX =
    STRIP_TILES_X + (pred.lastIdx + 1) * (TILE_W + STRIP_GAP) + (TILE_W - PICK_W) / 2
  const toY = STRIP_Y + (TILE_H - PICK_H) / 2

  // We render the flying tile only once we hit phase 3.
  const visible = phase >= 3

  return (
    <motion.g
      initial={false}
      animate={{
        x: visible ? toX - fromX : 0,
        y: visible ? toY - fromY : 0,
        opacity: visible ? [0, 1, 1, 0.0] : 0,
      }}
      transition={{
        duration: 1.6,
        ease: 'easeInOut',
        times: [0, 0.15, 0.85, 1],
      }}
    >
      <rect
        x={fromX}
        y={fromY}
        width={PICK_W}
        height={PICK_H}
        rx={8}
        ry={8}
        fill="rgba(52,211,153,0.18)"
        stroke={ACCENT.mint}
        strokeWidth={2}
      />
      <text
        x={fromX + PICK_W / 2}
        y={fromY + PICK_H / 2 + 12}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={32}
        fontWeight={700}
      >
        {pred.nextLabel}
      </text>
    </motion.g>
  )
}

/* ─────────── The viz ─────────── */
export function VizAct6Intro({ phase, pred }: { phase: number; pred: Prediction }) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      {/* Title strip */}
      <text
        x={VB_W / 2}
        y={48}
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={16}
        letterSpacing={3.4}
      >
        ONE FORWARD PASS · ONE NEXT TOKEN
      </text>

      <TokenStrip phase={phase} pred={pred} />

      {/* Mechanism row container line — purely decorative, helps the
          horizontal flow read as a pipeline. */}
      <line
        x1={40}
        y1={MECH_Y1 + 40}
        x2={VB_W - 40}
        y2={MECH_Y1 + 40}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />

      {/* Six-block hint between strip and mechanism — "all six blocks ran
          here, now we read off the last position". */}
      <motion.g {...fadeIn(0.1)}>
        <text
          x={VB_W / 2}
          y={MECH_Y0 - 30}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={11}
          letterSpacing={2.4}
        >
          ↓ six blocks already ran ↓
        </text>
      </motion.g>

      {/* Hidden state */}
      <HiddenStateCard active={phase >= 1} />

      {/* Hidden → output head arrow — draws after the hidden state cells
          finish cascading (~0.7s), arrowhead lands ~1.05s. */}
      <ArrowRight
        x1={HSTATE_X + HSTATE_W + 8}
        x2={HEAD_X - 8}
        y={HSTATE_Y + HSTATE_H / 2}
        accent={ACCENT.amber}
        active={phase >= 1}
        delay={0.65}
      />

      {/* Output head — pops in starting at ~1.1s (just after the arrow lands). */}
      <OutputHead active={phase >= 1} />

      {/* Output head → logits arrow — draws after the head finishes
          assembling (~1.95s), arrowhead lands ~2.4s. */}
      <ArrowRight
        x1={HEAD_X + HEAD_W + 8}
        x2={LOGIT_X - 8}
        y={HEAD_Y + HEAD_H / 2}
        accent={ACCENT.blue}
        active={phase >= 1}
        delay={1.95}
      />

      {/* Logits column — cells cascade starting at ~2.4s. */}
      <LogitColumn active={phase >= 1} />

      {/* Logits → softmax arrow — draws after logits finish cascading. */}
      <ArrowRight
        x1={LOGIT_X + LOGIT_W + 8}
        x2={BAR_X - 8}
        y={LOGIT_Y + LOGIT_H / 2}
        accent={ACCENT.mint}
        label="softmax"
        active={phase >= 1}
        delay={3.05}
      />

      {/* Bar chart */}
      <SoftmaxBars phase={phase} pred={pred} />

      {/* Chosen token flight */}
      <ChosenTokenFlight phase={phase} pred={pred} />

      {/* Footer caption */}
      <motion.text
        x={VB_W / 2}
        y={VB_H - 28}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={13}
        letterSpacing={3.2}
        opacity={0.85}
        {...fadeIn(0.3)}
      >
        DISTRIBUTION → SELECTION → ONE TOKEN → APPEND
      </motion.text>
    </svg>
  )
}

/* ─────────── Split-pane wrapper ─────────── */
export function Act6IntroSplitPane() {
  const speed = useSpeed()
  const { prompt, seed } = usePrompt()
  const pred = useMemo(() => predictFromPrompt(prompt, seed), [prompt, seed])

  const PHASES = 4
  const PHASE_DURATIONS_MS = [4500, 5000, 5000, 5500] as const
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setTimeout(
      () => setPhase((p) => (p + 1) % PHASES),
      PHASE_DURATIONS_MS[phase] / speed,
    )
    return () => clearTimeout(id)
  }, [phase, speed])

  const phaseLabels = ['context', 'projection', 'softmax', 'selection']
  const phaseAccent = [ACCENT.amber, ACCENT.blue, ACCENT.cyan, ACCENT.mint][phase]

  const promptLen = prompt.length
  const lastAbsPos = Math.max(0, promptLen - 1)
  const lastChar = prompt[promptLen - 1] ?? ''
  const lastCharLabel = lastChar === ' ' ? '·' : lastChar
  const winnerPct = `${(pred.topK[0].p * 100).toFixed(0)}%`

  const subtitleByPhase: ReactNode[] = [
    <>
      All six blocks already ran on every character of <em>your</em> prompt.
      The network now has one hidden vector per position. For predicting the
      next character, only the{' '}
      <strong style={{ color: ACCENT.amber }}>last position</strong> (
      <code>&lsquo;{lastCharLabel}&rsquo;</code> at index{' '}
      <code>{lastAbsPos}</code>) matters.
    </>,
    <>
      A single linear layer — the <em>output head</em> or <em>unembedding</em>
       — projects <code>h_T</code> from <code>d_model</code> down to{' '}
      <code>vocab_size</code>. The result is a vector of{' '}
      <strong style={{ color: ACCENT.cyan }}>logits</strong>: one raw score per
      possible next character.
    </>,
    <>
      <strong style={{ color: ACCENT.mint }}>Softmax</strong> turns logits into
      a probability distribution. Every entry is ≥ 0; they sum to 1. The top
      candidate after &ldquo;…{prompt.slice(-Math.min(8, promptLen))}&rdquo; is{' '}
      <strong style={{ color: ACCENT.mint }}>
        &lsquo;{pred.nextLabel}&rsquo;
      </strong>{' '}
      at {winnerPct}.
    </>,
    <>
      Pick one. Greedy decoding takes the argmax (here:{' '}
      <strong style={{ color: ACCENT.mint }}>
        &lsquo;{pred.nextLabel}&rsquo;
      </strong>
      ). Temperature / top-k / top-p sample from the distribution. The chosen
      token is appended to your prompt — and the whole forward pass runs again
      for the next one.
    </>,
  ]

  const calloutByPhase: ReactNode[] = [
    'During training, the model predicts a next token at every position. At inference, we only sample at the last position because that is the only position whose context includes everything in the prompt.',
    'The output head is often tied to the input embedding matrix (W_U = E^T) — same parameters used to map tokens → vectors are reused to map vectors → tokens. That weight tying saves params and tends to help quality.',
    'Logits are scale-sensitive: dividing them by a "temperature" T before softmax flattens the distribution (T > 1) or sharpens it (T < 1). Temperature 0 collapses to the argmax — pure greedy decoding.',
    'This single forward pass is what produces ONE token. Scene 34 shows what happens when you do it again, and again, and again — feeding each pick back as the new last position.',
  ]

  // Show the trailing window in the stats chip so the right pane reflects
  // the same chars the strip is showing.
  const promptTail = prompt.slice(-STRIP_WINDOW).replace(/ /g, '·')

  return (
    <SplitPaneScene
      viz={<VizAct6Intro phase={phase} pred={pred} />}
      text={{
        kicker: ACT6_KICKER,
        title: 'And the final pick.',
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
          { label: 'prompt tail', value: `"${promptTail}"`, color: ACCENT.amber },
          { label: 'prompt len', value: String(promptLen), color: ACCENT.amber },
          {
            label: 'top guess',
            value:
              phase >= 2
                ? `'${pred.nextLabel}'  (${winnerPct})`
                : '—',
            color: ACCENT.mint,
          },
          {
            label: 'sampled',
            value: phase >= 3 ? `'${pred.nextLabel}'` : '—',
            color: ACCENT.mint,
          },
        ],
        equation: {
          label: 'one full pass, one token',
          body: <>p = softmax(W_U · h_T) &nbsp;·&nbsp; tok ~ p</>,
        },
        infoCallout: calloutByPhase[phase],
      }}
    />
  )
}

/* =========================================================================
 * Scene 34 — output: "Generation = repeat the pass."
 *
 * Scene 33 picked one token. Scene 34 is that exact mechanism, in a loop:
 *
 *   PROMPT  →  pulse traverses 6 blocks  →  one new token appears  →
 *   appended to the sequence  →  pulse runs again  →  another token →
 *   appended  →  ... 5 iterations total, then hold.
 *
 * The sequence on top GROWS as new tokens land. Each new token glows mint
 * for ~1 second, then settles into the strip with a subtle highlight that
 * stays so the viewer can see the full continuation accumulate.
 *
 * Right pane is intentionally light: title, one sentence per phase, a
 * "step n / N" chip, and the equation from Scene 33 as a reminder. The
 * left side is supposed to do most of the explaining.
 *
 * Prompt-aware: the strip starts from the user's actual prompt, and each
 * generated character comes from the same `predictFromPrompt` heuristic
 * extended one step at a time.
 * ====================================================================== */

const OUT_VB_W = 1400
const OUT_VB_H = 1000

const N_BLOCKS = 6

// Fallback step count when the prompt isn't a Hamlet prefix. The Hamlet
// target itself is hoisted at the top of the file (used by Scene 33 too).
const FALLBACK_GEN_STEPS = 12

function genStepsFor(prompt: string): number {
  const p = prompt.length > 0 ? prompt : 'hello'
  if (
    HAMLET_TARGET.toLowerCase().startsWith(p.toLowerCase()) &&
    p.length < HAMLET_TARGET.length
  ) {
    return HAMLET_TARGET.length - p.length
  }
  return FALLBACK_GEN_STEPS
}

// Strip — sized so the full Hamlet line (45 chars) is mostly readable in one
// frame; the trailing window slides in the last few tokens if it overflows.
const OUT_STRIP_Y = 100
const OUT_TILE_W = 32
const OUT_TILE_H = 50
const OUT_STRIP_GAP = 3
const OUT_STRIP_LEFT = 100
const OUT_STRIP_VISIBLE = 36

// Block stack (horizontal, centered)
const BLK_W2 = 180
const BLK_H2 = 320
const BLK_GAP2 = 12
const BLK_TOTAL_W = N_BLOCKS * BLK_W2 + (N_BLOCKS - 1) * BLK_GAP2 // 1140
const BLK_X0 = (OUT_VB_W - BLK_TOTAL_W) / 2 // 130
const BLK_Y2 = 280
function blockX(i: number) {
  return BLK_X0 + i * (BLK_W2 + BLK_GAP2)
}
function blockCenterX(i: number) {
  return blockX(i) + BLK_W2 / 2
}

// Where the new token "emerges" out of the stack and where it lands.
const EMERGE_Y = BLK_Y2 + BLK_H2 + 60
const EMERGE_TILE_W = 56
const EMERGE_TILE_H = 56

// Step duration plan: the first three steps are deliberately slow so the
// viewer learns the rhythm (pulse → land → rest); from there each step
// accelerates so the rest of the line streams out at a generation cadence.
function stepDurationMs(stepIdx: number): number {
  if (stepIdx === 0) return 4000
  if (stepIdx === 1) return 3000
  if (stepIdx === 2) return 2000
  return 700
}

// Sub-phase split inside a step: pulse 45% → land 25% → rest 30%.
function subPhaseDurations(totalMs: number) {
  return {
    pulseEndMs: totalMs * 0.45,
    landEndMs: totalMs * 0.7,
    restEndMs: totalMs,
  }
}

/**
 * Iterate `predictFromPrompt` to produce a deterministic generation
 * sequence. The Hamlet override lives inside `predictFromPrompt` itself,
 * so this just chains predictions without any extra special-casing.
 */
function generateSequence(
  prompt: string,
  baseSeed: number,
  count: number,
): { generated: string[]; perStep: TopKEntry[][] } {
  const generated: string[] = []
  const perStep: TopKEntry[][] = []
  let context = prompt.length > 0 ? prompt : 'hello'
  for (let s = 0; s < count; s++) {
    const stepSeed = (baseSeed + (s + 1) * 1009) >>> 0
    const pred = predictFromPrompt(context, stepSeed)
    generated.push(pred.nextChar)
    perStep.push(pred.topK)
    context = context + pred.nextChar
  }
  return { generated, perStep }
}

/* ─────────── Growing token strip ─────────── */
function GrowingStrip({
  promptTail,
  promptStartIdx,
  generated,
  step,
  subPhase,
}: {
  promptTail: string[]
  promptStartIdx: number
  generated: string[]
  step: number
  subPhase: 'pulse' | 'land' | 'rest'
}) {
  // Visible chars = prompt tail + generated tokens up through `step`
  // (during 'pulse'/'land' for step `step`, the new char is in the air,
  // not yet in the strip; we show it from 'rest' onwards).
  const settled = generated.slice(0, subPhase === 'rest' ? step + 1 : step)
  const all = [
    ...promptTail.map((c) => ({ c, kind: 'prompt' as const })),
    ...settled.map((c) => ({ c, kind: 'gen' as const })),
  ]

  // If too many tiles, drop from the left so the right edge stays visible.
  const tooMany = Math.max(0, all.length - OUT_STRIP_VISIBLE)
  const visible = all.slice(tooMany)
  const droppedFromLeft = tooMany
  const lastVisibleIdx = visible.length - 1

  return (
    <g>
      <text
        x={OUT_STRIP_LEFT - 18}
        y={OUT_STRIP_Y + OUT_TILE_H / 2 + 4}
        textAnchor="end"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2.4}
      >
        SEQUENCE
      </text>

      {/* "..." indicator if we dropped chars from the left */}
      {droppedFromLeft > 0 && (
        <text
          x={OUT_STRIP_LEFT - 24}
          y={OUT_STRIP_Y + OUT_TILE_H / 2 + 14}
          textAnchor="end"
          fill="rgba(255,255,255,0.4)"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={20}
          fontWeight={600}
        >
          …
        </text>
      )}

      {visible.map((entry, vIdx) => {
        const x = OUT_STRIP_LEFT + vIdx * (OUT_TILE_W + OUT_STRIP_GAP)
        const isLast = vIdx === lastVisibleIdx
        const isGen = entry.kind === 'gen'
        // The most recently appended generated char glows for this step's rest phase.
        const isFreshlyAppended =
          isGen && isLast && subPhase === 'rest' && step >= 0
        return (
          <motion.g
            key={`tile-${droppedFromLeft + vIdx}-${entry.c}`}
            initial={
              isFreshlyAppended
                ? { opacity: 0, scale: 0.6 }
                : false
            }
            animate={
              isFreshlyAppended
                ? { opacity: 1, scale: 1 }
                : undefined
            }
            transition={{ duration: 0.5 }}
          >
            <rect
              x={x}
              y={OUT_STRIP_Y}
              width={OUT_TILE_W}
              height={OUT_TILE_H}
              rx={6}
              ry={6}
              fill={
                isGen
                  ? 'rgba(52,211,153,0.18)'
                  : isLast
                    ? 'rgba(245,158,11,0.18)'
                    : 'rgba(255,255,255,0.05)'
              }
              stroke={
                isGen
                  ? ACCENT.mint
                  : isLast
                    ? ACCENT.amber
                    : 'rgba(255,255,255,0.35)'
              }
              strokeOpacity={isFreshlyAppended ? 1 : 0.85}
              strokeWidth={isFreshlyAppended ? 2 : 1.2}
            />
            <text
              x={x + OUT_TILE_W / 2}
              y={OUT_STRIP_Y + OUT_TILE_H / 2 + 7}
              textAnchor="middle"
              fill={
                isGen
                  ? ACCENT.mint
                  : isLast
                    ? ACCENT.amber
                    : 'rgba(255,255,255,0.92)'
              }
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={18}
              fontWeight={isGen || isLast ? 700 : 600}
            >
              {displayChar(entry.c)}
            </text>
          </motion.g>
        )
      })}

      {/* Pending slot — empty box at the end where the next token will land */}
      {(() => {
        const nextVIdx = visible.length
        const x = OUT_STRIP_LEFT + nextVIdx * (OUT_TILE_W + OUT_STRIP_GAP)
        const isLanding = subPhase === 'land' && step < generated.length
        return (
          <motion.g
            animate={{ opacity: isLanding ? 1 : 0.6 }}
            transition={{ duration: 0.3 }}
          >
            <rect
              x={x}
              y={OUT_STRIP_Y}
              width={OUT_TILE_W}
              height={OUT_TILE_H}
              rx={6}
              ry={6}
              fill="rgba(52,211,153,0.04)"
              stroke={ACCENT.mint}
              strokeOpacity={isLanding ? 0.95 : 0.35}
              strokeWidth={isLanding ? 1.6 : 1}
              strokeDasharray={isLanding ? undefined : '4 4'}
            />
          </motion.g>
        )
      })()}
    </g>
  )
}

/* ─────────── Horizontal 6-block stack + pulse traversal ─────────── */
function BlockStack({
  step,
  subPhase,
  pulseDurSec,
}: {
  step: number
  subPhase: 'pulse' | 'land' | 'rest'
  pulseDurSec: number
}) {
  // We re-key the pulse animation on `step` so each step retriggers cleanly.
  const pulseY = BLK_Y2 + BLK_H2 / 2
  // Stagger each block's highlight across the pulse window.
  const blockStagger = pulseDurSec / N_BLOCKS
  const blockHighlightDur = Math.max(0.25, pulseDurSec * 0.85)

  return (
    <g>
      {/* Background label */}
      <text
        x={OUT_VB_W / 2}
        y={BLK_Y2 - 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={12}
        letterSpacing={3}
        fontWeight={600}
      >
        ONE FULL FORWARD PASS · 6 BLOCKS
      </text>

      {/* Connecting wire under the blocks (stays visible) */}
      <line
        x1={blockX(0)}
        y1={pulseY}
        x2={blockX(N_BLOCKS - 1) + BLK_W2}
        y2={pulseY}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={1}
      />

      {/* Blocks */}
      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        // Stagger highlight: block i lights up while pulse is over it.
        return (
          <motion.g key={`block-${i}-${step}`}>
            <motion.rect
              x={blockX(i)}
              y={BLK_Y2}
              width={BLK_W2}
              height={BLK_H2}
              rx={14}
              ry={14}
              initial={{
                fill: 'rgba(255,255,255,0.04)',
                stroke: 'rgba(167,139,250,0.45)',
                strokeWidth: 1.4,
              }}
              animate={
                subPhase === 'pulse'
                  ? {
                      fill: [
                        'rgba(255,255,255,0.04)',
                        'rgba(167,139,250,0.18)',
                        'rgba(167,139,250,0.06)',
                      ],
                      stroke: [
                        'rgba(167,139,250,0.45)',
                        'rgba(167,139,250,1)',
                        'rgba(167,139,250,0.7)',
                      ],
                      strokeWidth: [1.4, 2.4, 1.6],
                    }
                  : {
                      fill: 'rgba(167,139,250,0.06)',
                      stroke: 'rgba(167,139,250,0.55)',
                      strokeWidth: 1.4,
                    }
              }
              transition={{
                duration: blockHighlightDur,
                delay: subPhase === 'pulse' ? i * blockStagger : 0,
                ease: 'easeOut',
              }}
            />
            {/* Block label */}
            <text
              x={blockCenterX(i)}
              y={BLK_Y2 + 28}
              textAnchor="middle"
              fill={ACCENT.violet}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize={11}
              letterSpacing={1.8}
              fontWeight={600}
            >
              BLOCK {i + 1}
            </text>
            {/* Stylized internals: norm bar + attention chip + ffn chip */}
            <g>
              <rect
                x={blockX(i) + 24}
                y={BLK_Y2 + 60}
                width={BLK_W2 - 48}
                height={14}
                rx={3}
                ry={3}
                fill="rgba(96,165,250,0.18)"
                stroke="rgba(96,165,250,0.55)"
                strokeWidth={0.8}
              />
              <text
                x={blockCenterX(i)}
                y={BLK_Y2 + 71}
                textAnchor="middle"
                fill={ACCENT.blue}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={9}
                letterSpacing={1.6}
              >
                norm
              </text>

              <rect
                x={blockX(i) + 24}
                y={BLK_Y2 + 94}
                width={BLK_W2 - 48}
                height={70}
                rx={6}
                ry={6}
                fill="rgba(167,139,250,0.10)"
                stroke="rgba(167,139,250,0.55)"
                strokeWidth={0.9}
              />
              <text
                x={blockCenterX(i)}
                y={BLK_Y2 + 132}
                textAnchor="middle"
                fill={ACCENT.violet}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={12}
                letterSpacing={1.8}
                fontWeight={600}
              >
                ATTN
              </text>

              <rect
                x={blockX(i) + 24}
                y={BLK_Y2 + 178}
                width={BLK_W2 - 48}
                height={14}
                rx={3}
                ry={3}
                fill="rgba(96,165,250,0.18)"
                stroke="rgba(96,165,250,0.55)"
                strokeWidth={0.8}
              />
              <text
                x={blockCenterX(i)}
                y={BLK_Y2 + 189}
                textAnchor="middle"
                fill={ACCENT.blue}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={9}
                letterSpacing={1.6}
              >
                norm
              </text>

              <rect
                x={blockX(i) + 24}
                y={BLK_Y2 + 212}
                width={BLK_W2 - 48}
                height={70}
                rx={6}
                ry={6}
                fill="rgba(245,158,11,0.10)"
                stroke="rgba(245,158,11,0.55)"
                strokeWidth={0.9}
              />
              <text
                x={blockCenterX(i)}
                y={BLK_Y2 + 250}
                textAnchor="middle"
                fill={ACCENT.amber}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={12}
                letterSpacing={1.8}
                fontWeight={600}
              >
                FFN
              </text>
            </g>
          </motion.g>
        )
      })}

      {/* Pulse — a glowing dot that traverses left → right during 'pulse' */}
      {subPhase === 'pulse' && (
        <motion.circle
          key={`pulse-${step}`}
          cy={pulseY}
          r={11}
          fill={ACCENT.mint}
          fillOpacity={0.85}
          filter="url(#out-pulse-glow)"
          initial={{ cx: blockX(0) - 30 }}
          animate={{
            cx: blockX(N_BLOCKS - 1) + BLK_W2 + 30,
          }}
          transition={{ duration: pulseDurSec, ease: 'easeInOut' }}
        />
      )}
    </g>
  )
}

/* ─────────── Token tile that flies up from stack to strip ─────────── */
function FlightTile({
  step,
  subPhase,
  generated,
  promptTailLen,
  fromX,
  fromY,
  toBaseX,
  pulseDurSec,
  landDurSec,
}: {
  step: number
  subPhase: 'pulse' | 'land' | 'rest'
  generated: string[]
  promptTailLen: number
  fromX: number
  fromY: number
  toBaseX: number
  pulseDurSec: number
  landDurSec: number
}) {
  // The tile is visible while the pulse exits ('pulse' last 30%) and lands ('land').
  const visible = subPhase === 'land' || subPhase === 'pulse'
  if (step >= generated.length) return null
  const ch = generated[step]

  // Where the new tile should land in the strip — same calc as the strip
  // would use for the `step+1`-th generated tile.
  const totalSettled = promptTailLen + step
  // Drop from left exactly the same way the strip does.
  const dropped = Math.max(0, totalSettled + 1 - OUT_STRIP_VISIBLE)
  const visibleLandIdx = totalSettled - dropped
  const toX = toBaseX + visibleLandIdx * (OUT_TILE_W + OUT_STRIP_GAP)
  const toY = OUT_STRIP_Y + (OUT_TILE_H - EMERGE_TILE_H) / 2

  // The tile pops out near the end of the pulse (last 30% of pulseDurSec)
  // then animates up during the land phase.
  const popDelay = Math.max(0.05, pulseDurSec * 0.7)
  const popDur = Math.max(0.18, pulseDurSec * 0.3)
  const landDur = Math.max(0.25, landDurSec)

  return (
    <motion.g
      key={`flight-${step}`}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0.7 }}
      animate={
        subPhase === 'pulse'
          ? { opacity: 1, x: 0, y: 0, scale: 1 }
          : subPhase === 'land'
            ? {
                opacity: [1, 1, 0],
                x: toX - fromX,
                y: toY - fromY,
                scale: [1, 1, 0.85],
              }
            : { opacity: 0, scale: 0.7 }
      }
      transition={
        subPhase === 'pulse'
          ? { delay: popDelay, duration: popDur, ease: 'easeOut' }
          : subPhase === 'land'
            ? { duration: landDur, ease: 'easeInOut', times: [0, 0.85, 1] }
            : { duration: 0.25 }
      }
      style={{ display: visible ? undefined : 'none' }}
    >
      <rect
        x={fromX}
        y={fromY}
        width={EMERGE_TILE_W}
        height={EMERGE_TILE_H}
        rx={8}
        ry={8}
        fill="rgba(52,211,153,0.20)"
        stroke={ACCENT.mint}
        strokeWidth={2}
        filter="url(#out-pulse-glow)"
      />
      <text
        x={fromX + EMERGE_TILE_W / 2}
        y={fromY + EMERGE_TILE_H / 2 + 9}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={26}
        fontWeight={700}
      >
        {displayChar(ch)}
      </text>
    </motion.g>
  )
}

/* ─────────── Step indicator strip ─────────── */
function StepIndicator({ step, total, done }: { step: number; total: number; done: boolean }) {
  const trackY = 920
  const trackX = 120
  const trackW = OUT_VB_W - 240
  // Scale dot size down when there are many steps so they don't crowd out
  // the track.
  const dotR = total > 10 ? 5 : 8
  const filledFrac = done ? 1 : (step + 1) / total
  return (
    <g>
      <text
        x={trackX}
        y={trackY - 18}
        fill="rgba(255,255,255,0.55)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2}
      >
        {done
          ? 'LOOP CONTINUES…'
          : `STEP ${step + 1} / ${total} · ONE FORWARD PASS PER TOKEN`}
      </text>
      <line
        x1={trackX}
        y1={trackY}
        x2={trackX + trackW}
        y2={trackY}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={1.4}
      />
      {/* Continuous progress fill — reads better than a row of dots once
          there are 20+ steps. */}
      <line
        x1={trackX}
        y1={trackY}
        x2={trackX + trackW * filledFrac}
        y2={trackY}
        stroke={ACCENT.mint}
        strokeOpacity={0.85}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {Array.from({ length: total }).map((_, i) => {
        const cx = trackX + (i / Math.max(1, total - 1)) * trackW
        const filled = done || i <= step
        return (
          <circle
            key={i}
            cx={cx}
            cy={trackY}
            r={dotR}
            fill={filled ? ACCENT.mint : 'rgba(255,255,255,0.12)'}
            stroke={filled ? ACCENT.mint : 'rgba(255,255,255,0.3)'}
            strokeWidth={1.2}
          />
        )
      })}
    </g>
  )
}

/* ─────────── The viz ─────────── */
export function VizOutputLoop({
  step,
  subPhase,
  done,
  promptTail,
  promptStartIdx,
  generated,
  totalSteps,
  pulseDurSec,
  landDurSec,
}: {
  step: number
  subPhase: 'pulse' | 'land' | 'rest'
  done: boolean
  promptTail: string[]
  promptStartIdx: number
  generated: string[]
  totalSteps: number
  pulseDurSec: number
  landDurSec: number
}) {
  // Where the flying tile starts: right under the centre of the last block.
  const fromX = blockCenterX(N_BLOCKS - 1) - EMERGE_TILE_W / 2
  const fromY = EMERGE_Y

  return (
    <svg
      viewBox={`0 0 ${OUT_VB_W} ${OUT_VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      <defs>
        <filter id="out-pulse-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text
        x={OUT_VB_W / 2}
        y={50}
        textAnchor="middle"
        fill="rgba(255,255,255,0.9)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={16}
        letterSpacing={3.4}
      >
        GENERATION = REPEAT THE FORWARD PASS
      </text>

      <GrowingStrip
        promptTail={promptTail}
        promptStartIdx={promptStartIdx}
        generated={generated}
        step={step}
        subPhase={subPhase}
      />

      <BlockStack step={step} subPhase={subPhase} pulseDurSec={pulseDurSec} />

      {/* Output emergence label, just under the stack */}
      <text
        x={OUT_VB_W / 2}
        y={EMERGE_Y - 14}
        textAnchor="middle"
        fill={ACCENT.mint}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={11}
        letterSpacing={2.4}
        opacity={0.85}
      >
        ↑ next token emerges here, then appends to the sequence ↑
      </text>

      {/* Flight tile */}
      <FlightTile
        step={step}
        subPhase={subPhase}
        generated={generated}
        promptTailLen={promptTail.length}
        fromX={fromX}
        fromY={fromY}
        toBaseX={OUT_STRIP_LEFT}
        pulseDurSec={pulseDurSec}
        landDurSec={landDurSec}
      />

      {/* Step indicator */}
      <StepIndicator step={step} total={totalSteps} done={done} />

      {/* End-of-loop hint */}
      {done && (
        <motion.text
          x={OUT_VB_W / 2}
          y={970}
          textAnchor="middle"
          fill={ACCENT.mint}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize={13}
          letterSpacing={3}
          fontWeight={600}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          …UNTIL END-OF-TEXT, MAX-LENGTH, OR YOU STOP IT.
        </motion.text>
      )}
    </svg>
  )
}

/* ─────────── Split-pane wrapper ─────────── */
export function OutputSplitPane() {
  const speed = useSpeed()
  const { prompt, seed } = usePrompt()

  const nGenSteps = useMemo(() => genStepsFor(prompt), [prompt])
  const onHamletPath = useMemo(
    () =>
      HAMLET_TARGET.toLowerCase().startsWith(
        (prompt.length > 0 ? prompt : 'hello').toLowerCase(),
      ) && prompt.length < HAMLET_TARGET.length,
    [prompt],
  )

  // Pre-compute the whole generation once per (prompt, seed) so each step
  // is decided up front and the animation just plays it back. This keeps
  // the pulse / land / rest timing decoupled from the prediction logic.
  const { generated } = useMemo(
    () => generateSequence(prompt, seed, nGenSteps),
    [prompt, seed, nGenSteps],
  )

  // Snap the prompt's trailing window so the strip starts off pre-filled.
  // Reserve room for as many generated tiles + 1 pending slot as we plan
  // to add, but never leave fewer than 4 prompt tiles visible.
  const promptForStrip = prompt.length > 0 ? prompt : 'hello'
  const promptTailMax = Math.max(4, OUT_STRIP_VISIBLE - (nGenSteps + 1))
  const promptTail = promptForStrip.slice(-promptTailMax).split('')
  const promptStartIdx = promptForStrip.length - promptTail.length

  // Step machine: at each step we run pulse → land → rest, then advance.
  const [step, setStep] = useState(0)
  const [subPhase, setSubPhase] = useState<'pulse' | 'land' | 'rest'>('pulse')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Reset on prompt change
    setStep(0)
    setSubPhase('pulse')
    setDone(false)
  }, [prompt, seed])

  useEffect(() => {
    if (done) return
    const total = stepDurationMs(step)
    const { pulseEndMs, landEndMs, restEndMs } = subPhaseDurations(total)
    const t1 = setTimeout(() => setSubPhase('land'), pulseEndMs / speed)
    const t2 = setTimeout(() => setSubPhase('rest'), landEndMs / speed)
    const t3 = setTimeout(() => {
      if (step + 1 >= nGenSteps) {
        setDone(true)
      } else {
        setStep(step + 1)
        setSubPhase('pulse')
      }
    }, restEndMs / speed)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [step, speed, done, nGenSteps])

  // Per-step animation durations forwarded to the viz so framer's transitions
  // match the step machine.
  const stepTotalMs = stepDurationMs(step)
  const { pulseEndMs, landEndMs } = subPhaseDurations(stepTotalMs)
  const pulseDurSec = pulseEndMs / 1000
  const landDurSec = (landEndMs - pulseEndMs) / 1000

  // Right-pane copy keyed off subPhase + done.
  let kicker = 'ACT VI · GENERATION'
  let phaseLabel: string
  let subtitle: ReactNode
  let phaseAccent: string

  if (done) {
    phaseLabel = onHamletPath ? 'and the rest is silence' : 'loop continues'
    phaseAccent = ACCENT.mint
    subtitle = onHamletPath ? (
      <>
        And there it is — <em>“to be, or not to be — that is the question.”</em>
        Real models keep going for hundreds or thousands of tokens, each one
        another full pass through the same six blocks. That&apos;s the whole
        machine.
      </>
    ) : (
      <>
        {nGenSteps} characters generated. Real models keep going for hundreds
        or thousands of tokens — each one is <em>another full pass</em>
         through the same six blocks. That&apos;s the whole machine.
      </>
    )
  } else if (subPhase === 'pulse') {
    phaseLabel = 'forward pass'
    phaseAccent = ACCENT.violet
    subtitle = (
      <>
        Pulse traverses the six blocks. Embed → norm → attention → norm → FFN
        → … → output head. <em>Every</em> generated character costs one of
        these passes.
      </>
    )
  } else if (subPhase === 'land') {
    phaseLabel = 'token lands'
    phaseAccent = ACCENT.mint
    const ch = generated[step] ?? ''
    subtitle = (
      <>
        <strong style={{ color: ACCENT.mint }}>
          &lsquo;{displayChar(ch)}&rsquo;
        </strong>{' '}
        was sampled from the softmax. It gets appended to the sequence — the
        new context for the next pass.
      </>
    )
  } else {
    phaseLabel = 'next pass'
    phaseAccent = ACCENT.amber
    subtitle = (
      <>
        The sequence is one character longer now. The very next forward pass
        runs on the <em>updated</em> context — the previous prediction is
        already part of what the model conditions on.
      </>
    )
  }

  const settledGenerated = (done ? generated : subPhase === 'rest' ? generated.slice(0, step + 1) : generated.slice(0, step)).join('')

  return (
    <SplitPaneScene
      viz={
        <VizOutputLoop
          step={step}
          subPhase={subPhase}
          done={done}
          promptTail={promptTail}
          promptStartIdx={promptStartIdx}
          generated={generated}
          totalSteps={nGenSteps}
          pulseDurSec={pulseDurSec}
          landDurSec={landDurSec}
        />
      }
      text={{
        kicker,
        title: 'Generation = repeat the pass.',
        subtitle,
        accent: phaseAccent,
        phase: (
          <PhaseChip
            current={done ? nGenSteps : step + 1}
            total={nGenSteps}
            label={phaseLabel}
            accent={phaseAccent}
          />
        ),
        stats: [
          { label: 'prompt', value: `${promptForStrip.length} chars`, color: ACCENT.amber },
          { label: 'so far', value: settledGenerated.length > 0 ? `"${settledGenerated.replace(/ /g, '·')}"` : '—', color: ACCENT.mint },
          { label: 'this step', value: subPhase === 'land' || subPhase === 'rest' ? `'${displayChar(generated[step] ?? '')}'` : '—', color: ACCENT.mint },
          { label: 'cost / token', value: '1 full pass', color: ACCENT.violet },
        ],
        equation: {
          label: 'one rule, repeated',
          body: (
            <>
              p = softmax(W_U · h_T) &nbsp;·&nbsp; tok ~ p &nbsp;·&nbsp; ctx ←
              ctx + tok
            </>
          ),
        },
        infoCallout: done
          ? 'KV-caching makes pass 2..N much cheaper than pass 1: only the new token\'s K/V pair is computed; the rest is read from cache. That\'s why most inference cost is bandwidth, not compute.'
          : 'This is the entire generation algorithm. The loop you\'re watching is the same one ChatGPT, Claude, and every other LLM runs — just at much larger scale.',
      }}
    />
  )
}
