'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * A wide, horizontal forward-pass animation that replaces the old vertical diagram.
 *
 * Left column  : 6 input tokens as character glyphs
 * Middle       : 6 transformer blocks, each drawing attention arcs between tokens
 * Right column : logit bars + sampled character
 *
 * All animated continuously — particles stream, arcs draw, a sampled token pulses.
 */

const DEMO_CHARS = ['R', 'O', 'M', 'E', 'O', ':']
const N_TOKENS = DEMO_CHARS.length
const N_LAYERS = 6

// Random-ish attention patterns per layer (one per block). Deterministic so
// the animation is stable across re-renders.
function seededAttn(seed: number): number[][] {
  // Returns a causal T×T weight matrix
  const T = N_TOKENS
  const out: number[][] = []
  const rand = (() => {
    let s = seed * 2654435761
    return () => {
      s = (s * 1664525 + 1013904223) | 0
      return ((s >>> 0) % 1000) / 1000
    }
  })()
  for (let q = 0; q < T; q++) {
    const row = new Array(T).fill(0)
    let sum = 0
    for (let k = 0; k <= q; k++) {
      const r = 0.15 + rand() * 0.9
      row[k] = r
      sum += r
    }
    for (let k = 0; k <= q; k++) row[k] /= sum
    out.push(row)
  }
  return out
}

const BLOCK_ATTN = Array.from({ length: N_LAYERS }).map((_, i) => seededAttn(i + 7))

export function Pipeline({ className = '' }: { className?: string }) {
  const [sampledChar, setSampledChar] = useState<string>('N')

  // Cycle through a few possible next characters for the sampled display
  useEffect(() => {
    const chars = ['N', 'a', 'y', ',', ' ', 'm', 'y', 'l', 'o', 'r', 'd']
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % chars.length
      setSampledChar(chars[i])
    }, 1700)
    return () => clearInterval(id)
  }, [])

  // SVG geometry
  const VB_W = 1400
  const VB_H = 420
  const PAD = 28
  const INPUT_X = PAD + 40
  const OUTPUT_X = VB_W - PAD - 110
  const INNER_X0 = INPUT_X + 80
  const INNER_X1 = OUTPUT_X - 80
  const BLOCK_GAP = (INNER_X1 - INNER_X0) / N_LAYERS
  const blockX = (i: number) => INNER_X0 + BLOCK_GAP * (i + 0.5)
  const TOK_H = 38
  const TOKS_TOTAL_H = N_TOKENS * (TOK_H + 6) - 6
  const TOKS_Y0 = (VB_H - TOKS_TOTAL_H) / 2
  const tokY = (i: number) => TOKS_Y0 + i * (TOK_H + 6)
  const tokCenter = (i: number) => tokY(i) + TOK_H / 2

  return (
    <div
      className={`relative overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-[linear-gradient(180deg,rgba(11,11,15,1),rgba(7,7,9,1))] ${className}`}
    >
      {/* title strip */}
      <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3">
        <div className="flex items-baseline gap-4">
          <span className="small-caps text-[var(--fg-dim)]">the forward pass · live</span>
          <h3 className="display text-[18px] tracking-tight">
            ROMEO: → <span className="display-italic text-[var(--accent)]">{sampledChar}</span>
          </h3>
        </div>
        <div className="flex items-center gap-4 mono text-[10px] text-[var(--fg-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="ping-soft absolute inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />
            </span>
            <span>animating</span>
          </div>
          <span className="text-[var(--fg-dim)]">6 tokens · 6 layers · 6 heads · 384 dims</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        <defs>
          <linearGradient id="pipe-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(96,165,250,0)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.8)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </linearGradient>
          <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(96,165,250,0.6)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.6)" />
          </linearGradient>
          <radialGradient id="block-glow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="rgba(96,165,250,0.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </radialGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hard-glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* column labels */}
        {[
          { x: INPUT_X, label: 'tokens', sub: 'char → id' },
          { x: blockX(0), label: 'block 0', sub: 'attn · ffn' },
          { x: blockX(5), label: 'block 5', sub: 'attn · ffn' },
          { x: OUTPUT_X, label: 'logits', sub: 'softmax · sample' },
        ].map((c) => (
          <g key={c.label}>
            <text
              x={c.x}
              y={28}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--fg-muted)"
              letterSpacing="0.18em"
            >
              {c.label.toUpperCase()}
            </text>
            <text
              x={c.x}
              y={42}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--fg-dim)"
            >
              {c.sub}
            </text>
          </g>
        ))}

        {/* block glows and frames */}
        {Array.from({ length: N_LAYERS }).map((_, li) => {
          const cx = blockX(li)
          const w = BLOCK_GAP * 0.82
          const h = TOKS_TOTAL_H + 40
          const x = cx - w / 2
          const y = TOKS_Y0 - 20
          return (
            <g key={li}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={2}
                fill="url(#block-glow)"
                stroke="var(--rule)"
              />
              <text
                x={cx}
                y={y + h + 20}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="var(--fg-dim)"
              >
                layer {li.toString().padStart(2, '0')}
              </text>
            </g>
          )
        })}

        {/* Attention arcs inside each block — animate opacity in a staggered loop */}
        {BLOCK_ATTN.map((mat, li) => {
          const cx = blockX(li)
          const w = BLOCK_GAP * 0.82
          const startX = cx - w / 2 + 8
          const endX = cx + w / 2 - 8
          return (
            <g key={`arcs-${li}`}>
              {mat.map((row, q) =>
                row.map((val, k) => {
                  if (k > q) return null
                  if (val < 0.06) return null
                  const y1 = tokCenter(q)
                  const y2 = tokCenter(k)
                  const d = `M ${startX} ${y1} C ${cx} ${y1} ${cx} ${y2} ${endX} ${y2}`
                  const delay = (li * 0.15 + (q * 0.12 + k * 0.05)) % 3
                  return (
                    <motion.path
                      key={`${li}-${q}-${k}`}
                      d={d}
                      fill="none"
                      stroke="url(#arc-grad)"
                      strokeWidth={0.4 + val * 1.8}
                      strokeLinecap="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, val * 0.9, val * 0.9, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay,
                        times: [0, 0.15, 0.85, 1],
                        ease: 'easeInOut',
                      }}
                    />
                  )
                })
              )}
            </g>
          )
        })}

        {/* Inbound flow rails: token → block 0 */}
        {Array.from({ length: N_TOKENS }).map((_, i) => {
          const y = tokCenter(i)
          const x1 = INPUT_X + 25
          const x2 = INNER_X0 - 12
          return (
            <g key={`in-${i}`}>
              <line
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke="var(--rule)"
                strokeDasharray="2 3"
              />
              {/* Traveling particle */}
              <motion.circle
                r="3"
                cy={y}
                fill="rgba(167,139,250,1)"
                filter="url(#soft-glow)"
                initial={{ cx: x1, opacity: 0 }}
                animate={{ cx: [x1, x2], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 3,
                  delay: i * 0.25,
                  repeat: Infinity,
                  times: [0, 0.1, 0.85, 1],
                }}
              />
            </g>
          )
        })}

        {/* Residual connections between blocks */}
        {Array.from({ length: N_LAYERS - 1 }).map((_, li) =>
          Array.from({ length: N_TOKENS }).map((_, i) => {
            const y = tokCenter(i)
            const x1 = blockX(li) + BLOCK_GAP * 0.41
            const x2 = blockX(li + 1) - BLOCK_GAP * 0.41
            return (
              <g key={`rail-${li}-${i}`}>
                <line
                  x1={x1}
                  x2={x2}
                  y1={y}
                  y2={y}
                  stroke="var(--rule)"
                  strokeDasharray="1.5 3"
                />
                <motion.circle
                  r="2.5"
                  cy={y}
                  fill={li % 2 === 0 ? 'rgba(96,165,250,1)' : 'rgba(52,211,153,1)'}
                  filter="url(#soft-glow)"
                  initial={{ cx: x1, opacity: 0 }}
                  animate={{ cx: [x1, x2], opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2.5,
                    delay: li * 0.4 + i * 0.12,
                    repeat: Infinity,
                    times: [0, 0.1, 0.85, 1],
                  }}
                />
              </g>
            )
          })
        )}

        {/* Block-5 → output */}
        {Array.from({ length: N_TOKENS }).map((_, i) => {
          const y = tokCenter(i)
          const x1 = blockX(N_LAYERS - 1) + BLOCK_GAP * 0.41
          const x2 = OUTPUT_X - 28
          // Last token gets the strongest trail (it's the one being predicted off of)
          const isLast = i === N_TOKENS - 1
          return (
            <g key={`out-${i}`}>
              <line
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke={isLast ? 'rgba(52,211,153,0.5)' : 'var(--rule)'}
                strokeDasharray="2 3"
                strokeWidth={isLast ? 1.5 : 1}
              />
              <motion.circle
                r={isLast ? 4 : 2.5}
                cy={y}
                fill={isLast ? 'rgba(52,211,153,1)' : 'rgba(96,165,250,0.8)'}
                filter="url(#soft-glow)"
                initial={{ cx: x1, opacity: 0 }}
                animate={{ cx: [x1, x2], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: isLast ? 2 : 2.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                  times: [0, 0.1, 0.85, 1],
                }}
              />
            </g>
          )
        })}

        {/* Input token cells (left) */}
        {DEMO_CHARS.map((ch, i) => {
          const y = tokY(i)
          return (
            <g key={`tok-${i}`} transform={`translate(${INPUT_X - 25}, ${y})`}>
              <rect
                width="50"
                height={TOK_H}
                rx="2"
                fill="var(--bg-elevated)"
                stroke="var(--rule-strong)"
              />
              <text
                x="16"
                y={TOK_H / 2}
                dominantBaseline="middle"
                fontSize="18"
                fontFamily="var(--font-mono)"
                fill="var(--fg)"
              >
                {ch}
              </text>
              <rect
                x="32"
                y="6"
                width="14"
                height={TOK_H - 12}
                rx="1"
                fill="rgba(167,139,250,0.1)"
                stroke="rgba(167,139,250,0.4)"
              />
              <text
                x="39"
                y={TOK_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="rgba(167,139,250,0.9)"
              >
                {(ch.charCodeAt(0) % 64).toString().padStart(2, '0')}
              </text>
            </g>
          )
        })}

        {/* Output bars (logits) — pulsing to feel alive */}
        {(() => {
          const barsX = OUTPUT_X - 26
          const barsY0 = tokY(0)
          const barsHeight = TOKS_TOTAL_H
          const N = 14
          return (
            <g>
              <rect
                x={barsX}
                y={barsY0}
                width="54"
                height={barsHeight}
                fill="rgba(255,255,255,0.02)"
                stroke="var(--rule-strong)"
                rx="2"
              />
              {Array.from({ length: N }).map((_, i) => {
                const y = barsY0 + 6 + (i * (barsHeight - 12)) / N
                const topVal = i === 0 ? 0.92 : i === 1 ? 0.55 : 0.35 - i * 0.02
                return (
                  <motion.rect
                    key={i}
                    x={barsX + 3}
                    y={y}
                    height={3}
                    rx="1"
                    fill={i === 0 ? 'var(--accent-red)' : 'var(--accent)'}
                    initial={{ width: 0 }}
                    animate={{ width: [0, Math.max(5, topVal * 48), Math.max(3, topVal * 48 * 0.6)] }}
                    transition={{
                      duration: 1.7,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.04,
                      ease: 'easeInOut',
                    }}
                  />
                )
              })}
              <text
                x={barsX + 27}
                y={barsY0 - 8}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="var(--fg-muted)"
              >
                p(next)
              </text>
            </g>
          )
        })()}

        {/* Sampled output character */}
        <g transform={`translate(${OUTPUT_X + 46}, ${tokCenter(Math.floor(N_TOKENS / 2)) - 26})`}>
          <motion.rect
            width="52"
            height="52"
            rx="3"
            fill="rgba(248,113,113,0.08)"
            stroke="var(--accent-red)"
            animate={{
              boxShadow: ['0 0 0 rgba(248,113,113,0)', '0 0 20px rgba(248,113,113,0.4)'],
            }}
          />
          <motion.text
            key={sampledChar}
            x="26"
            y="28"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="32"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill="var(--accent-red)"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {sampledChar === ' ' ? '·' : sampledChar === '\n' ? '↵' : sampledChar}
          </motion.text>
          <text
            x="26"
            y="66"
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="var(--fg-dim)"
          >
            sampled
          </text>
        </g>

        {/* Residual stream glow — one subtle line per row across the whole pipeline */}
        {Array.from({ length: N_TOKENS }).map((_, i) => {
          const y = tokCenter(i)
          return (
            <line
              key={`bg-${i}`}
              x1={INPUT_X + 30}
              x2={OUTPUT_X - 30}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.015)"
              strokeWidth="6"
            />
          )
        })}
      </svg>

      {/* legend */}
      <div className="border-t border-[var(--rule)] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mono text-[10px] text-[var(--fg-muted)]">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-violet)]" />
              token enters
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
              residual passes forward
            </span>
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-[2px] w-6"
                style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-violet))' }}
              />
              attention inside a block
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-mint)]" />
              final signal to logits
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-red)]" />
              sampled token
            </span>
          </div>
          <span className="text-[var(--fg-dim)]">continuous · ~slow transformer speed</span>
        </div>
      </div>
    </div>
  )
}
