'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COLORS, glyph, makeRng } from './scenes/primitives'

/**
 * TransformerTheater — one always-running, interactive visualization of the
 * whole GPT. Signal flows left → right: tokens, embeddings, six blocks each
 * with live attention arcs, residual rails between blocks, final layernorm,
 * unembedding, softmax, sampled character. Click any block, token, or the
 * sampled output to zoom into its mechanics.
 */

const VB_W = 1600
const VB_H = 760

const TOKENS = 'ROMEO:'.split('')
const N_TOKENS = TOKENS.length
const N_LAYERS = 6
const N_HEADS = 6

// Canonical IDs for the demo tokens (fake, just for display)
const DEMO_IDS = [50, 42, 26, 17, 42, 11]

// Deterministic attention patterns per (layer, head)
function patternFor(layer: number, head: number): number[][] {
  const rng = makeRng(layer * 7 + head + 13)
  const out: number[][] = []
  for (let q = 0; q < N_TOKENS; q++) {
    const row = new Array(N_TOKENS).fill(0)
    const mix = (head + layer) % 4
    if (mix === 0 && q > 0) row[q - 1] = 0.75
    if (mix === 1) row[0] = 0.55
    if (mix === 2 && q > 1) row[q - 2] = 0.5
    row[q] += 0.25
    let sum = 0
    for (let k = 0; k <= q; k++) {
      row[k] = (row[k] || 0.05) + rng() * 0.25
      sum += row[k]
    }
    for (let k = 0; k <= q; k++) row[k] /= sum
    for (let k = q + 1; k < N_TOKENS; k++) row[k] = 0
    out.push(row)
  }
  return out
}

// Pre-compute all [L][H][T][T] patterns
const PATTERNS = Array.from({ length: N_LAYERS }).map((_, l) =>
  Array.from({ length: N_HEADS }).map((_, h) => patternFor(l, h))
)

// Aggregate attention across heads for display in the main view (one matrix per layer)
const AGG = PATTERNS.map((layer) => {
  const agg: number[][] = []
  for (let q = 0; q < N_TOKENS; q++) {
    const row = new Array(N_TOKENS).fill(0)
    for (let k = 0; k < N_TOKENS; k++) {
      for (let h = 0; h < N_HEADS; h++) row[k] += layer[h][q][k]
      row[k] /= N_HEADS
    }
    agg.push(row)
  }
  return agg
})

// Random FFN activation seed per layer
const FFN_ACTIVATION = Array.from({ length: N_LAYERS }).map((_, l) => {
  const rng = makeRng(l + 200)
  return Array.from({ length: 18 }).map(() => rng())
})

// Candidate next-token cycle (what "sampled" loops through)
const NEXT_CHARS = ['N', 'a', 'y', ',', ' ', 'm', 'y', 'l', 'o', 'r', 'd']

// Fake logits for the sample column
const LOGIT_CHARS = ['N', 'a', 'y', ',', ' ', 'm', 'M', 'o', 'i', 'T', 'H', 'r', 's']
const LOGIT_VALUES = [0.38, 0.21, 0.11, 0.07, 0.05, 0.04, 0.03, 0.03, 0.025, 0.022, 0.018, 0.015, 0.012]

interface DetailState {
  kind: 'block' | 'token' | 'sample' | null
  idx: number | null
}

export function TransformerTheater() {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)  // 0.5 / 1 / 2
  const [detail, setDetail] = useState<DetailState>({ kind: null, idx: null })
  const [hovered, setHovered] = useState<{ kind: 'block' | 'token'; idx: number } | null>(null)
  const [sampledChar, setSampledChar] = useState('N')
  const [sampledTick, setSampledTick] = useState(0)

  const wrapRef = useRef<HTMLDivElement>(null)

  // Cycle sampled character
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setSampledTick((t) => t + 1)
    }, 2200 / speed)
    return () => clearInterval(id)
  }, [playing, speed])

  useEffect(() => {
    setSampledChar(NEXT_CHARS[sampledTick % NEXT_CHARS.length])
  }, [sampledTick])

  // Click-outside to close detail
  useEffect(() => {
    if (detail.kind === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDetail({ kind: null, idx: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  // ----- geometry -----
  const PAD_LEFT = 40
  const PAD_RIGHT = 40
  const PAD_TOP = 70
  const PAD_BOT = 50

  const COL_W = {
    input: 78,
    embed: 80,
    block: (VB_W - PAD_LEFT - PAD_RIGHT - 78 - 80 - 64 - 80 - 96 - 100) / N_LAYERS,
    ln: 32,
    unembed: 80,
    logits: 96,
    sample: 100,
  }
  const colX = {
    input: PAD_LEFT,
    embed: PAD_LEFT + COL_W.input + 4,
    blocks: PAD_LEFT + COL_W.input + 4 + COL_W.embed + 20,
  } as const
  const blocksStartX = colX.blocks
  const blockX = (i: number) => blocksStartX + i * COL_W.block
  const blocksEndX = blockX(N_LAYERS - 1) + COL_W.block - 8
  const lnX = blocksEndX + 12
  const unembedX = lnX + COL_W.ln + 10
  const logitsX = unembedX + COL_W.unembed + 10
  const sampleX = logitsX + COL_W.logits + 16

  const TOK_H = (VB_H - PAD_TOP - PAD_BOT) / N_TOKENS - 4
  const tokY = (i: number) => PAD_TOP + i * (TOK_H + 4)
  const tokCenter = (i: number) => tokY(i) + TOK_H / 2

  // ----- render helpers -----
  function ColumnLabel({ x, w, label, sub, color = COLORS.dim }: { x: number; w: number; label: string; sub?: string; color?: string }) {
    return (
      <g transform={`translate(${x + w / 2}, 24)`}>
        <text textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={color} letterSpacing="0.18em">
          {label.toUpperCase()}
        </text>
        {sub && (
          <text y={14} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            {sub}
          </text>
        )}
      </g>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="small-caps text-[var(--fg-dim)]">the transformer · live</span>
          <span className="mono text-[10px] text-[var(--fg-muted)]">
            hover any element · click to dive in · esc to exit
          </span>
        </div>
        <div className="flex items-center gap-3 mono text-[11px]">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--rule-strong)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="inline-flex overflow-hidden rounded-full border border-[var(--rule-strong)]">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-[10px] ${
                  speed === s ? 'bg-[var(--fg)] text-[var(--bg)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" className="block">
          <defs>
            <linearGradient id="rail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(34,211,238,0)" />
              <stop offset="50%" stopColor="rgba(34,211,238,0.5)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </linearGradient>
            <linearGradient id="arc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(96,165,250,0.95)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.6)" />
            </linearGradient>
            <radialGradient id="block-bg" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="rgba(96,165,250,0.1)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0)" />
            </radialGradient>
            <filter id="soft-glow"><feGaussianBlur stdDeviation="2.2" /></filter>
            <filter id="hard-glow"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>

          {/* Column labels */}
          <ColumnLabel x={colX.input} w={COL_W.input} label="tokens" sub="char → id" color={COLORS.dim} />
          <ColumnLabel x={colX.embed} w={COL_W.embed} label="embedding" sub="+ positional" color={COLORS.violet} />
          <g>
            <text
              x={(blocksStartX + blocksEndX) / 2}
              y={24}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={COLORS.blue}
              letterSpacing="0.18em"
            >
              TRANSFORMER BLOCKS × 6
            </text>
            <text
              x={(blocksStartX + blocksEndX) / 2}
              y={38}
              textAnchor="middle"
              fontSize="8"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              each block: attention → ffn → add to residual
            </text>
          </g>
          <ColumnLabel x={lnX} w={COL_W.ln} label="ln_f" color={COLORS.mint} />
          <ColumnLabel x={unembedX} w={COL_W.unembed} label="unembed" sub="→ V=65 logits" color={COLORS.mint} />
          <ColumnLabel x={logitsX} w={COL_W.logits} label="softmax" sub="probabilities" color={COLORS.amber} />
          <ColumnLabel x={sampleX} w={COL_W.sample} label="sample" sub="next char" color={COLORS.red} />

          {/* ------------ Residual stream rails ------------ */}
          {Array.from({ length: N_TOKENS }).map((_, i) => {
            const y = tokCenter(i)
            const isFocus = hovered?.kind === 'token' && hovered.idx === i
            return (
              <g key={`rail-${i}`}>
                <line
                  x1={colX.embed + COL_W.embed + 4}
                  x2={lnX}
                  y1={y}
                  y2={y}
                  stroke={isFocus ? COLORS.cyan : COLORS.rule}
                  strokeWidth={isFocus ? 2 : 1}
                  strokeDasharray="3 4"
                  style={{ filter: isFocus ? 'drop-shadow(0 0 4px rgba(34,211,238,0.6))' : undefined }}
                />
              </g>
            )
          })}

          {/* ------------ Input tokens ------------ */}
          {TOKENS.map((ch, i) => {
            const y = tokY(i)
            const isHover = hovered?.kind === 'token' && hovered.idx === i
            return (
              <g
                key={`in-${i}`}
                transform={`translate(${colX.input}, ${y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHovered({ kind: 'token', idx: i })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setDetail({ kind: 'token', idx: i })}
              >
                <rect
                  width={COL_W.input - 8}
                  height={TOK_H}
                  rx={3}
                  fill={isHover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'}
                  stroke={isHover ? COLORS.cyan : COLORS.ruleStrong}
                  strokeWidth={isHover ? 1.5 : 1}
                />
                <text
                  x={20}
                  y={TOK_H / 2 + 6}
                  fontSize="20"
                  fontFamily="var(--font-mono)"
                  fill={COLORS.fg}
                >
                  {glyph(ch)}
                </text>
                <text
                  x={COL_W.input - 16}
                  y={TOK_H / 2 + 4}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill={COLORS.violet}
                >
                  id {DEMO_IDS[i]}
                </text>
              </g>
            )
          })}

          {/* ------------ Embedding bars (violet cells) ------------ */}
          {TOKENS.map((_, i) => {
            const y = tokY(i)
            const x = colX.embed
            const rng = makeRng(i + 33)
            const isHover = hovered?.kind === 'token' && hovered.idx === i
            return (
              <g key={`emb-${i}`} transform={`translate(${x}, ${y})`}>
                <rect
                  width={COL_W.embed - 8}
                  height={TOK_H}
                  rx={3}
                  fill="rgba(167,139,250,0.06)"
                  stroke={isHover ? COLORS.violet : 'rgba(167,139,250,0.3)'}
                />
                {Array.from({ length: 16 }).map((_, c) => {
                  const v = rng() * 2 - 1
                  const alpha = 0.2 + Math.abs(v) * 0.7
                  return (
                    <rect
                      key={c}
                      x={6 + c * 4}
                      y={8 + (c % 2) * 12}
                      width={3}
                      height={TOK_H - 18}
                      fill={v > 0 ? `rgba(167,139,250,${alpha})` : `rgba(248,113,113,${alpha})`}
                    />
                  )
                })}
              </g>
            )
          })}

          {/* ------------ Embedding → Block 0 particles ------------ */}
          {TOKENS.map((_, i) => {
            const y = tokCenter(i)
            const x1 = colX.embed + COL_W.embed - 4
            const x2 = blocksStartX + 6
            return (
              <motion.circle
                key={`in-flow-${i}-${speed}`}
                r={3.5}
                cy={y}
                fill="rgba(167,139,250,1)"
                filter="url(#soft-glow)"
                initial={{ cx: x1, opacity: 0 }}
                animate={{ cx: [x1, x2], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2 / speed,
                  delay: i * 0.2,
                  repeat: Infinity,
                  times: [0, 0.1, 0.85, 1],
                  ease: 'linear',
                }}
              />
            )
          })}

          {/* ------------ Blocks ------------ */}
          {Array.from({ length: N_LAYERS }).map((_, li) => {
            const x = blockX(li)
            const w = COL_W.block - 16
            const yTop = PAD_TOP - 4
            const yBot = PAD_TOP + N_TOKENS * (TOK_H + 4) - 4
            const innerLeft = x + 12
            const innerRight = x + w - 12
            const cx = (innerLeft + innerRight) / 2
            const isHover = hovered?.kind === 'block' && hovered.idx === li
            const isSelected = detail.kind === 'block' && detail.idx === li
            const dimOther = detail.kind === 'block' && detail.idx !== li
            const activeHeads = detail.kind === 'block' && detail.idx === li

            return (
              <g key={`block-${li}`} opacity={dimOther ? 0.3 : 1}>
                {/* Frame */}
                <rect
                  x={x}
                  y={yTop}
                  width={w}
                  height={yBot - yTop}
                  rx={3}
                  fill="url(#block-bg)"
                  stroke={isHover || isSelected ? COLORS.blue : COLORS.rule}
                  strokeWidth={isHover || isSelected ? 1.5 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered({ kind: 'block', idx: li })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setDetail({ kind: 'block', idx: li })}
                />

                {/* Block label */}
                <text
                  x={cx}
                  y={yTop - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill={isHover || isSelected ? COLORS.blue : COLORS.dim}
                >
                  block {li.toString().padStart(2, '0')}
                </text>

                {/* Attention arcs: aggregated (when not selected) OR per-head strongest (when selected) */}
                {AGG[li].map((row, q) =>
                  row.map((v, k) => {
                    if (k > q || v < 0.06) return null
                    const y1 = tokCenter(k)
                    const y2 = tokCenter(q)
                    const mid = (y1 + y2) / 2
                    const bowR = Math.max(8, Math.min(60, Math.abs(y1 - y2) * 0.5))
                    const d = `M ${innerLeft} ${y1} C ${cx - bowR} ${mid - bowR * 0.1}, ${cx + bowR} ${mid + bowR * 0.1}, ${innerRight} ${y2}`
                    const delayBase = li * 0.2 + q * 0.08 + k * 0.04
                    const focusToken =
                      hovered?.kind === 'token' && (hovered.idx === q || hovered.idx === k)
                    return (
                      <motion.path
                        key={`${li}-${q}-${k}`}
                        d={d}
                        fill="none"
                        stroke={focusToken ? COLORS.cyan : 'url(#arc-grad)'}
                        strokeWidth={0.5 + v * 2.4}
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: focusToken ? [0.2, 0.9, 0.4] : [0.05, v * 0.9, v * 0.6, 0.05],
                        }}
                        transition={{
                          duration: 3 / speed,
                          delay: delayBase,
                          repeat: Infinity,
                          times: [0, 0.25, 0.7, 1],
                          ease: 'easeInOut',
                        }}
                      />
                    )
                  })
                )}

                {/* FFN firing dots at bottom-middle of block (small activation grid) */}
                <g transform={`translate(${cx - 22}, ${yBot - 34})`}>
                  {FFN_ACTIVATION[li].map((v, ci) => (
                    <motion.circle
                      key={ci}
                      r={2 + v * 1.6}
                      cx={(ci % 6) * 8}
                      cy={Math.floor(ci / 6) * 8}
                      fill={COLORS.amber}
                      initial={{ opacity: 0.15 }}
                      animate={{ opacity: [0.15, 0.15 + v * 0.75, 0.15] }}
                      transition={{
                        duration: 1.5 / speed,
                        delay: li * 0.1 + ci * 0.04,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </g>

                {/* Active head strip (visible when selected) */}
                {isSelected && activeHeads && (
                  <g transform={`translate(${innerLeft}, ${yBot - 70})`}>
                    <rect
                      width={innerRight - innerLeft}
                      height={24}
                      rx={2}
                      fill="rgba(0,0,0,0.6)"
                      stroke={COLORS.blue}
                    />
                    {Array.from({ length: N_HEADS }).map((_, h) => (
                      <motion.circle
                        key={h}
                        r={4}
                        cx={(h + 0.5) * ((innerRight - innerLeft) / N_HEADS)}
                        cy={12}
                        fill={
                          [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.amber, COLORS.pink, COLORS.cyan][h]
                        }
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, delay: h * 0.1, repeat: Infinity }}
                      />
                    ))}
                  </g>
                )}
              </g>
            )
          })}

          {/* ------------ Rail particles between blocks ------------ */}
          {Array.from({ length: N_LAYERS - 1 }).map((_, li) =>
            TOKENS.map((_, i) => {
              const y = tokCenter(i)
              const x1 = blockX(li) + COL_W.block - 16
              const x2 = blockX(li + 1) + 4
              const isFocus = hovered?.kind === 'token' && hovered.idx === i
              return (
                <motion.circle
                  key={`rail-${li}-${i}-${speed}`}
                  r={isFocus ? 3.5 : 2.5}
                  cy={y}
                  fill={li % 2 === 0 ? COLORS.blue : COLORS.cyan}
                  filter={isFocus ? 'url(#hard-glow)' : 'url(#soft-glow)'}
                  initial={{ cx: x1, opacity: 0 }}
                  animate={{ cx: [x1, x2], opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2 / speed,
                    delay: li * 0.35 + i * 0.12,
                    repeat: Infinity,
                    times: [0, 0.12, 0.82, 1],
                    ease: 'linear',
                  }}
                />
              )
            })
          )}

          {/* ------------ Block 5 → LN → Unembed → Logits ------------ */}
          {TOKENS.map((_, i) => {
            const y = tokCenter(i)
            const x1 = blockX(N_LAYERS - 1) + COL_W.block - 16
            const x2 = logitsX - 6
            const isLast = i === N_TOKENS - 1
            return (
              <g key={`out-${i}`}>
                <line
                  x1={x1}
                  x2={x2}
                  y1={y}
                  y2={y}
                  stroke={isLast ? COLORS.mint : COLORS.rule}
                  strokeDasharray="2 3"
                  strokeWidth={isLast ? 1.5 : 1}
                  opacity={isLast ? 0.5 : 0.4}
                />
                <motion.circle
                  key={`out-p-${i}-${speed}`}
                  r={isLast ? 4 : 2}
                  cy={y}
                  fill={isLast ? COLORS.mint : 'rgba(96,165,250,0.7)'}
                  filter="url(#soft-glow)"
                  initial={{ cx: x1, opacity: 0 }}
                  animate={{ cx: [x1, x2], opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2.3 / speed,
                    delay: i * 0.18,
                    repeat: Infinity,
                    times: [0, 0.1, 0.85, 1],
                    ease: 'linear',
                  }}
                />
              </g>
            )
          })}

          {/* LN column — single narrow bar */}
          <rect
            x={lnX}
            y={PAD_TOP - 4}
            width={COL_W.ln}
            height={N_TOKENS * (TOK_H + 4) - 4}
            rx={2}
            fill="rgba(52,211,153,0.04)"
            stroke="rgba(52,211,153,0.35)"
          />
          {TOKENS.map((_, i) => (
            <motion.rect
              key={`ln-${i}`}
              x={lnX + 4}
              y={tokY(i) + 4}
              width={COL_W.ln - 8}
              height={TOK_H - 8}
              rx={1}
              fill={COLORS.mint}
              opacity={0.15}
              animate={{ opacity: [0.1, 0.45, 0.1] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            />
          ))}

          {/* Unembed column — just a band showing matrix multiply */}
          <g transform={`translate(${unembedX}, ${PAD_TOP - 4})`}>
            <rect
              width={COL_W.unembed}
              height={N_TOKENS * (TOK_H + 4) - 4}
              rx={2}
              fill="rgba(255,255,255,0.02)"
              stroke={COLORS.rule}
            />
            {Array.from({ length: 12 }).map((_, c) =>
              Array.from({ length: 6 }).map((_, r) => (
                <motion.rect
                  key={`u-${r}-${c}`}
                  x={6 + c * 6}
                  y={10 + r * ((N_TOKENS * (TOK_H + 4) - 34) / 6)}
                  width={4}
                  height={3}
                  fill={COLORS.mint}
                  animate={{ opacity: [0.1, 0.5 + (r * c * 0.02), 0.1] }}
                  transition={{
                    duration: 2.5,
                    delay: (r + c) * 0.07,
                    repeat: Infinity,
                  }}
                />
              ))
            )}
            <text
              x={COL_W.unembed / 2}
              y={N_TOKENS * (TOK_H + 4) + 8}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              × Wᵤ [V, C]
            </text>
          </g>

          {/* Logits — vertical bar chart */}
          <g transform={`translate(${logitsX}, ${PAD_TOP - 4})`}>
            <rect
              width={COL_W.logits}
              height={N_TOKENS * (TOK_H + 4) - 4}
              rx={2}
              fill="rgba(255,255,255,0.02)"
              stroke={COLORS.rule}
            />
            {LOGIT_VALUES.map((p, i) => {
              const barH = (p / LOGIT_VALUES[0]) * (COL_W.logits - 16)
              const y = 10 + i * ((N_TOKENS * (TOK_H + 4) - 30) / LOGIT_VALUES.length)
              const isSampled = LOGIT_CHARS[i] === sampledChar
              return (
                <g key={i}>
                  <text
                    x={8}
                    y={y + 8}
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fill={isSampled ? COLORS.red : COLORS.fg}
                  >
                    {glyph(LOGIT_CHARS[i])}
                  </text>
                  <motion.rect
                    x={22}
                    y={y + 2}
                    height={8}
                    rx={1}
                    fill={isSampled ? COLORS.red : COLORS.amber}
                    opacity={isSampled ? 0.8 : 0.4}
                    animate={{ width: [0, barH, barH * 0.8] }}
                    transition={{
                      duration: 1.6,
                      delay: i * 0.04,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeOut',
                    }}
                  />
                </g>
              )
            })}
            <text
              x={COL_W.logits / 2}
              y={N_TOKENS * (TOK_H + 4) + 8}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              softmax top-13
            </text>
          </g>

          {/* Sampled character big */}
          <g
            transform={`translate(${sampleX}, ${VB_H / 2 - 70})`}
            className="cursor-pointer"
            onMouseEnter={() => setHovered({ kind: 'block', idx: -1 })}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setDetail({ kind: 'sample', idx: 0 })}
          >
            <motion.rect
              width={COL_W.sample - 16}
              height={140}
              rx={4}
              fill="rgba(248,113,113,0.08)"
              stroke={COLORS.red}
              animate={{ strokeOpacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              filter="url(#hard-glow)"
            />
            <AnimatePresence mode="wait">
              <motion.text
                key={sampledChar}
                x={(COL_W.sample - 16) / 2}
                y={82}
                textAnchor="middle"
                fontSize="68"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={COLORS.red}
                initial={{ opacity: 0, scale: 0.6, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 82 }}
                exit={{ opacity: 0, scale: 0.8, y: 70 }}
                transition={{ duration: 0.25 }}
              >
                {sampledChar === ' ' ? '·' : sampledChar}
              </motion.text>
            </AnimatePresence>
            <text
              x={(COL_W.sample - 16) / 2}
              y={130}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill={COLORS.dim}
            >
              appended
            </text>
          </g>
        </svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && hovered.idx >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-[var(--rule-strong)] bg-[var(--bg)] px-3 py-1 mono text-[10px] text-[var(--fg)]"
            >
              {hovered.kind === 'block'
                ? `block ${hovered.idx.toString().padStart(2, '0')} · click to dive in`
                : `token '${TOKENS[hovered.idx]}' · click to follow its trail`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rule)] px-5 py-3 mono text-[10px] text-[var(--fg-muted)]">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-violet)]" />
            embedding
          </span>
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-[2px] w-5"
              style={{ background: 'linear-gradient(90deg,var(--accent),var(--accent-violet))' }}
            />
            attention
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-amber)]" />
            ffn firing
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-mint)]" />
            residual / unembed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-red)]" />
            sampled
          </span>
        </div>
        <span className="text-[var(--fg-dim)]">slowed ~100× vs real inference</span>
      </div>

      {/* Detail overlay */}
      <AnimatePresence>
        {detail.kind !== null && (
          <DetailOverlay
            state={detail}
            tokens={TOKENS}
            onClose={() => setDetail({ kind: null, idx: null })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ----- Detail overlay -----

function DetailOverlay({
  state,
  tokens,
  onClose,
}: {
  state: DetailState
  tokens: string[]
  onClose: () => void
}) {
  let title = ''
  let kicker = ''
  let content: React.ReactNode = null

  if (state.kind === 'block' && state.idx !== null) {
    const li = state.idx
    title = `Block ${li.toString().padStart(2, '0')}`
    kicker = 'attention + feed-forward · 6 heads in parallel'
    content = <BlockDetail li={li} tokens={tokens} />
  } else if (state.kind === 'token' && state.idx !== null) {
    title = `Token "${glyph(tokens[state.idx])}"`
    kicker = `position ${state.idx} · its trail through all 6 blocks`
    content = <TokenDetail idx={state.idx} tokens={tokens} />
  } else if (state.kind === 'sample') {
    title = 'Sampling the next character'
    kicker = 'softmax → weighted dice roll'
    content = <SampleDetail />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(7,7,9,0.85)] backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-[min(900px,90vw)] overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] shadow-2xl shadow-black/80"
      >
        <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3">
          <div>
            <div className="small-caps text-[var(--fg-dim)]">{kicker}</div>
            <h3 className="display text-[22px]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mono h-7 rounded-full border border-[var(--rule-strong)] px-3 text-[10px] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
          >
            close  ×
          </button>
        </div>
        <div className="max-h-[calc(85vh-60px)] overflow-auto p-5">{content}</div>
      </motion.div>
    </motion.div>
  )
}

function BlockDetail({ li, tokens }: { li: number; tokens: string[] }) {
  const headColors = [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.amber, COLORS.pink, COLORS.cyan]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {PATTERNS[li].map((mat, h) => (
          <div key={h} className="rounded-[2px] border border-[var(--rule)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="mono text-[10px]" style={{ color: headColors[h] }}>
                head {h}
              </span>
              <span className="mono text-[9px] text-[var(--fg-dim)]">6×6</span>
            </div>
            <svg viewBox={`0 0 ${tokens.length * 14} ${tokens.length * 14}`} width="100%">
              {mat.map((row, q) =>
                row.map((w, k) => {
                  if (k > q) return null
                  return (
                    <rect
                      key={`${q}-${k}`}
                      x={k * 14}
                      y={q * 14}
                      width={13}
                      height={13}
                      fill={headColors[h]}
                      opacity={0.05 + w * 0.85}
                    />
                  )
                })
              )}
              {tokens.map((t, i) => (
                <text
                  key={`t-${i}`}
                  x={i * 14 + 7}
                  y={tokens.length * 14 + 10}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                  fill={COLORS.dim}
                >
                  {t}
                </text>
              ))}
            </svg>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--rule)] pt-4 text-[13px] leading-[1.7] text-[var(--fg-muted)]">
        Each head computes its own Q, K, V from the input residual. Softmax over{' '}
        <span style={{ color: COLORS.amber }}>Q·Kᵀ/√d_k</span> gives a weight per
        (query, key) pair. The heads output gets concatenated and projected back to 384, then
        added into the residual stream. The FFN (4×-wider MLP) then does a second additive update.
      </div>
    </div>
  )
}

function TokenDetail({ idx, tokens }: { idx: number; tokens: string[] }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="small-caps mb-2 text-[var(--fg-dim)]">position · id · glyph</div>
        <div className="flex items-baseline gap-6">
          <div className="display text-[44px]" style={{ color: COLORS.cyan }}>
            {glyph(tokens[idx])}
          </div>
          <div className="mono tabular text-[var(--fg-muted)]">position {idx}</div>
          <div className="mono tabular text-[var(--accent-violet)]">id {DEMO_IDS[idx]}</div>
        </div>
      </div>
      <div>
        <div className="small-caps mb-2 text-[var(--fg-dim)]">
          attention · who this token attended to, per layer
        </div>
        <div className="grid grid-cols-1 gap-2">
          {AGG.map((matrix, li) => (
            <div key={li} className="flex items-center gap-3">
              <span className="mono w-14 text-[10px] text-[var(--fg-dim)]">
                block {li.toString().padStart(2, '0')}
              </span>
              <div className="flex flex-1 gap-1">
                {matrix[idx].map((w, k) => (
                  <div
                    key={k}
                    className="relative flex-1 rounded-[1px]"
                    style={{
                      background:
                        k <= idx
                          ? `rgba(96,165,250,${0.15 + w * 0.85})`
                          : 'rgba(255,255,255,0.02)',
                      height: 18,
                      border: k === idx ? `1px solid ${COLORS.cyan}` : 'none',
                    }}
                    title={`→ '${tokens[k]}' · ${(w * 100).toFixed(1)}%`}
                  >
                    <span className="mono absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[9px] text-[var(--fg)]">
                      {tokens[k]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--rule)] pt-4 text-[13px] leading-[1.7] text-[var(--fg-muted)]">
        Each row is one block. Each cell is how much this token attended to another token at that
        depth. Brighter blue = stronger attention. Causal mask blocks anything to the right of the
        highlighted self-cell.
      </div>
    </div>
  )
}

function SampleDetail() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {LOGIT_CHARS.slice(0, 10).map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="mono w-6 text-right text-[var(--fg-dim)]">
              {(i + 1).toString().padStart(2, '0')}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-[var(--rule-strong)] mono text-[13px]">
              {glyph(c)}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-[2px] bg-[rgba(255,255,255,0.02)]">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${(LOGIT_VALUES[i] / LOGIT_VALUES[0]) * 100}%`,
                  background:
                    i === 0
                      ? 'linear-gradient(90deg, rgba(248,113,113,0.75), rgba(248,113,113,0.3))'
                      : 'linear-gradient(90deg, rgba(96,165,250,0.5), rgba(96,165,250,0.15))',
                }}
              />
              <span className="mono absolute inset-y-0 left-3 flex items-center text-[11px] text-[var(--fg)]">
                {(LOGIT_VALUES[i] * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--rule)] pt-4 text-[13px] leading-[1.7] text-[var(--fg-muted)]">
        The softmax turns 65 raw logits into probabilities summing to 1. Temperature scales the
        logits before softmax: low T sharpens the distribution (the model plays it safe); high T
        flattens it (more creative, more weird). The final character is a weighted random draw —
        the same prompt can produce different continuations.
      </div>
    </div>
  )
}
