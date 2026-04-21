'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Panel } from './Panel'
import type { Matrix3D } from '@/lib/types'

interface Props {
  /** [H, T, T] attention weights for a single layer (all heads stacked) */
  attention: Matrix3D
  tokenStrs: string[]
  promptLen: number
  layerIndex: number
}

const EXPLAIN = {
  whatYouSee:
    'Tokens in a row. Arcs drawing from the bright (query) token back to every earlier token. Thicker / more opaque = higher attention weight. One query at a time, so you can actually see what the model was looking at when it processed that character.',
  whyItMatters:
    'Attention is the heart of the transformer. It is the only mechanism that lets tokens read from each other. Every pattern the model has learned — "look at the previous letter", "find the matching quote", "return to the speaker’s name" — shows up here as a specific arc pattern.',
  whatToLookFor:
    'Press play and watch where each query token reaches. First-layer heads often trace short diagonals (hop back 1). Deeper heads go further, weirder. Try the same query on different heads (switch with the H toggles) — completely different perspectives.',
}

function glyph(ch: string) {
  if (ch === '\n') return '↵'
  if (ch === ' ') return '·'
  if (ch === '\t') return '→'
  return ch
}

const SPEEDS = [
  { label: '0.5×', ms: 2800 },
  { label: '1×', ms: 1400 },
  { label: '2×', ms: 700 },
  { label: '4×', ms: 350 },
]

export function AttentionFlow({ attention, tokenStrs, promptLen, layerIndex }: Props) {
  const H = attention.length
  const T = attention[0].length

  const [head, setHead] = useState(0)
  const [query, setQuery] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speedIdx, setSpeedIdx] = useState(1) // 1× default

  const stepMs = SPEEDS[speedIdx].ms

  // Auto-advance query when playing
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setQuery((q) => (q + 1) % T)
    }, stepMs)
    return () => clearInterval(id)
  }, [playing, stepMs, T])

  const weights = attention[head] // [T, T]

  // SVG geometry
  const CELL_W = 34
  const CELL_H = 38
  const GAP = 4
  const ATTN_H = 220
  const PAD_X = 24
  const PAD_TOP = 24
  const rowW = T * (CELL_W + GAP) - GAP
  const svgW = rowW + PAD_X * 2
  const svgH = ATTN_H + CELL_H + PAD_TOP + 40

  const rowY = ATTN_H + PAD_TOP
  const tokX = (i: number) => PAD_X + i * (CELL_W + GAP)
  const tokCenter = (i: number) => tokX(i) + CELL_W / 2

  // Arcs for current query
  const arcs = useMemo(() => {
    const row = weights[query]
    const out: { k: number; d: string; w: number }[] = []
    for (let k = 0; k <= query; k++) {
      const w = row[k]
      if (w < 0.01) continue
      const x1 = tokCenter(k)
      const x2 = tokCenter(query)
      const midX = (x1 + x2) / 2
      const span = Math.abs(x2 - x1)
      // Taller arcs for longer reaches
      const apexY = Math.max(PAD_TOP + 10, rowY - 40 - Math.sqrt(span) * 10)
      const d = `M ${x1} ${rowY} Q ${midX} ${apexY} ${x2} ${rowY}`
      out.push({ k, d, w })
    }
    return out
  }, [weights, query])

  // Dominant target of this query (for readout)
  const topKey = useMemo(() => {
    const row = weights[query]
    let best = 0
    for (let k = 0; k <= query; k++) if (row[k] > row[best]) best = k
    return { k: best, w: row[best] }
  }, [weights, query])

  return (
    <Panel
      title="Attention — flow"
      kicker={`layer ${layerIndex.toString().padStart(2, '0')} · watch one query at a time`}
      shape={`weights [H=${H}, T=${T}, T=${T}]  ·  head ${head}, query ${query}`}
      explain={EXPLAIN}
      accent="blue"
      right={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="mono flex h-7 w-7 items-center justify-center rounded-full border border-[var(--rule-strong)] text-[11px] text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg)]"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="mono inline-flex overflow-hidden rounded-full border border-[var(--rule-strong)]">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSpeedIdx(i)}
                className={`px-2.5 py-1 text-[10px] transition-colors ${
                  speedIdx === i
                    ? 'bg-[var(--fg)] text-[var(--bg)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Head selector */}
      <div className="mb-5 flex flex-wrap items-center gap-5 mono text-[11px] text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <span className="small-caps text-[var(--fg-dim)]">head</span>
          <div className="flex gap-1">
            {Array.from({ length: H }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHead(i)}
                className={`h-6 w-7 rounded-[2px] border tabular text-[10px] transition-colors ${
                  head === i
                    ? 'border-[var(--accent)] bg-[rgba(96,165,250,0.12)] text-[var(--accent)]'
                    : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-2 h-4 w-px bg-[var(--rule-strong)]" />
        <div className="flex items-center gap-3">
          <span className="small-caps text-[var(--fg-dim)]">query</span>
          <input
            type="range"
            min={0}
            max={T - 1}
            value={query}
            onChange={(e) => {
              setPlaying(false)
              setQuery(parseInt(e.target.value, 10))
            }}
            className="w-48 accent-[var(--accent)]"
          />
          <span className="tabular w-16 text-[var(--fg)]">
            {String(query + 1).padStart(2, '0')} / {T}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-[var(--fg-dim)]">
          <span>top weight →</span>
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] border border-[rgba(96,165,250,0.5)] bg-[rgba(96,165,250,0.12)] text-[var(--accent)]">
            {glyph(tokenStrs[topKey.k])}
          </span>
          <span className="tabular text-[var(--fg)]">{topKey.w.toFixed(2)}</span>
        </div>
      </div>

      {/* SVG canvas */}
      <div className="relative overflow-x-auto rounded-[2px] border border-[var(--rule)] bg-[rgba(255,255,255,0.01)]">
        <svg width={svgW} height={svgH} className="block" style={{ minWidth: '100%' }}>
          <defs>
            <linearGradient id="arc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(96,165,250,0.95)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.35)" />
            </linearGradient>
            <filter id="arc-glow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* baseline */}
          <line
            x1={PAD_X}
            x2={svgW - PAD_X}
            y1={rowY}
            y2={rowY}
            stroke="var(--rule)"
            strokeWidth="1"
          />

          {/* arcs */}
          <AnimatePresence mode="sync">
            {arcs.map((a) => {
              const thickness = 0.6 + a.w * 4.4
              const isTop = a.k === topKey.k
              return (
                <motion.path
                  key={`${head}-${query}-${a.k}`}
                  d={a.d}
                  fill="none"
                  stroke={isTop ? 'var(--accent-violet)' : 'url(#arc-grad)'}
                  strokeWidth={thickness}
                  strokeLinecap="round"
                  filter={isTop ? 'url(#arc-glow)' : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.25 + a.w * 0.75 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    pathLength: { duration: Math.min(0.9, stepMs / 1800), ease: 'easeOut' },
                    opacity: { duration: 0.25 },
                  }}
                />
              )
            })}
          </AnimatePresence>

          {/* moving dot at the query, traveling along active arc to top key */}
          <AnimatePresence>
            {topKey.w > 0.05 && (
              <motion.circle
                key={`dot-${head}-${query}`}
                r="3.5"
                fill="var(--accent-violet)"
                initial={{ cx: tokCenter(query), cy: rowY, opacity: 0 }}
                animate={{
                  cx: [tokCenter(query), (tokCenter(query) + tokCenter(topKey.k)) / 2, tokCenter(topKey.k)],
                  cy: [rowY, rowY - 60 - Math.sqrt(Math.abs(tokCenter(query) - tokCenter(topKey.k))) * 10, rowY],
                  opacity: [0, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: Math.min(1.2, stepMs / 1500),
                  ease: 'easeInOut',
                  times: [0, 0.5, 1],
                }}
                filter="url(#arc-glow)"
              />
            )}
          </AnimatePresence>

          {/* tokens */}
          {tokenStrs.map((ch, i) => {
            const isQuery = i === query
            const isAccessible = i <= query
            const isTop = i === topKey.k && topKey.w > 0.05
            return (
              <g key={i} transform={`translate(${tokX(i)}, ${rowY})`}>
                <rect
                  width={CELL_W}
                  height={CELL_H}
                  rx="2"
                  fill={
                    isQuery
                      ? 'var(--accent)'
                      : isTop
                        ? 'rgba(167,139,250,0.12)'
                        : 'var(--bg-elevated)'
                  }
                  stroke={
                    isQuery
                      ? 'var(--accent)'
                      : isTop
                        ? 'var(--accent-violet)'
                        : 'var(--rule-strong)'
                  }
                  strokeWidth={isQuery ? 1.5 : 1}
                  opacity={isAccessible ? 1 : 0.25}
                />
                <text
                  x={CELL_W / 2}
                  y={CELL_H / 2 - 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontFamily="var(--font-mono)"
                  fill={isQuery ? 'var(--bg)' : isAccessible ? 'var(--fg)' : 'var(--fg-dim)'}
                >
                  {glyph(ch)}
                </text>
                <text
                  x={CELL_W / 2}
                  y={CELL_H - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                  fill={isQuery ? 'rgba(7,7,9,0.7)' : 'var(--fg-dim)'}
                >
                  {i}
                </text>
                {/* prompt vs generated indicator */}
                {i === promptLen - 1 && (
                  <line
                    x1={CELL_W + GAP / 2}
                    x2={CELL_W + GAP / 2}
                    y1={-6}
                    y2={CELL_H + 14}
                    stroke="var(--accent-mint)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                )}
              </g>
            )
          })}

          {/* axis label */}
          <text
            x={PAD_X}
            y={svgH - 6}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--fg-dim)"
          >
            ← past (keys it may attend to)
          </text>
          <text
            x={svgW - PAD_X}
            y={svgH - 6}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--fg-dim)"
          >
            future (masked) →
          </text>
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 mono text-[10px] text-[var(--fg-muted)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-[2px]"
              style={{ background: 'var(--accent)' }}
            />
            <span>query · the token asking</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-[2px] border"
              style={{
                background: 'rgba(167,139,250,0.12)',
                borderColor: 'var(--accent-violet)',
              }}
            />
            <span>top key · strongest connection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[2px] border border-[var(--rule-strong)]" />
            <span>future · causally masked, unreachable</span>
          </div>
        </div>
        <div className="text-[var(--fg-dim)]">
          arc thickness ∝ attention weight · each row sums to 1
        </div>
      </div>
    </Panel>
  )
}
