'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, glyph, makeRng } from '../scenes/primitives'

/**
 * KV cache over generation steps.
 *
 * Shows generation step by step. At each step: exactly ONE new row of K and
 * ONE new row of V is computed; all previous rows are reused from the cache.
 * The new row flashes; reused rows are dim.
 */

const SEQ = 'ROMEO:Nay'.split('')
const MAX_T = SEQ.length
const D_K = 16

const rng = makeRng(111)
const K_ALL: number[][] = Array.from({ length: MAX_T }).map(() =>
  Array.from({ length: D_K }).map(() => rng() * 2 - 1)
)
const V_ALL: number[][] = Array.from({ length: MAX_T }).map(() =>
  Array.from({ length: D_K }).map(() => rng() * 2 - 1)
)

export function KVCacheSteps() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setStep((s) => (s + 1) % MAX_T)
    }, 1800)
    return () => clearInterval(id)
  }, [paused])

  const CELL = 14
  const currentT = step + 1

  const cellColor = (v: number) => {
    const t = Math.max(-1, Math.min(1, v / 1.5))
    return t >= 0
      ? `rgba(96,165,250,${0.12 + t * 0.75})`
      : `rgba(248,113,113,${0.12 + -t * 0.75})`
  }

  return (
    <div className="rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="small-caps text-[var(--fg-dim)]">
            kv cache · step {currentT} of {MAX_T}
          </div>
          <div className="mt-1 display text-[22px]">
            One new row per step. Everything else is reused.
          </div>
          <div className="mt-1 text-[12px] text-[var(--fg-muted)]">
            This is why autoregressive generation is tractable: at step N, you don&apos;t recompute
            K and V for tokens 0..N−1 — they&apos;re cached from previous steps. Only the brand-new
            token gets full attention math.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPaused(true)
              setStep(0)
            }}
            className="mono h-7 rounded-full border border-[var(--rule-strong)] px-3 text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="mono flex h-7 w-7 items-center justify-center rounded-full border border-[var(--rule-strong)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            {paused ? '▶' : '❚❚'}
          </button>
          <input
            type="range"
            min={0}
            max={MAX_T - 1}
            value={step}
            onChange={(e) => {
              setPaused(true)
              setStep(parseInt(e.target.value, 10))
            }}
            className="w-36 accent-[var(--accent)]"
          />
        </div>
      </div>

      {/* token row with current one highlighted */}
      <div className="mb-4 flex items-center gap-1">
        {SEQ.map((ch, i) => {
          const isPast = i < step
          const isCurrent = i === step
          const isFuture = i > step
          return (
            <motion.div
              key={i}
              animate={{
                scale: isCurrent ? 1.1 : 1,
                opacity: isFuture ? 0.2 : 1,
              }}
              className="flex h-8 w-8 items-center justify-center rounded-[2px] border mono text-[14px]"
              style={{
                borderColor: isCurrent ? COLORS.amber : isPast ? COLORS.blue : COLORS.rule,
                background: isCurrent
                  ? 'rgba(245,158,11,0.15)'
                  : isPast
                    ? 'rgba(96,165,250,0.08)'
                    : 'transparent',
                color: isCurrent ? COLORS.amber : isPast ? COLORS.blue : COLORS.dim,
              }}
            >
              {glyph(ch)}
            </motion.div>
          )
        })}
        <div className="ml-3 mono text-[11px] text-[var(--fg-muted)]">
          <span className="small-caps mr-2" style={{ color: COLORS.amber }}>
            new
          </span>
          <span style={{ color: COLORS.blue }}>cached</span>
        </div>
      </div>

      {/* K and V matrices */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {([{ m: K_ALL, label: 'K · keys', color: COLORS.blue }, { m: V_ALL, label: 'V · values', color: COLORS.violet }]).map((panel) => (
          <div key={panel.label}>
            <div className="mb-2 flex items-center justify-between mono text-[10px]">
              <span className="small-caps" style={{ color: panel.color }}>
                {panel.label}
              </span>
              <span className="text-[var(--fg-dim)]">
                [T = {currentT}, d_k = {D_K}]  ·  {currentT * D_K} values
              </span>
            </div>
            <svg viewBox={`0 0 ${D_K * CELL + 48} ${MAX_T * CELL + 8}`} width="100%">
              {/* row labels */}
              {SEQ.map((ch, i) => (
                <text
                  key={i}
                  x={38}
                  y={i * CELL + CELL / 2 + 4}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill={i === step ? COLORS.amber : i < step ? COLORS.fg : COLORS.dim}
                >
                  {glyph(ch)} ({i})
                </text>
              ))}
              {panel.m.map((row, r) =>
                row.map((v, c) => {
                  const isPast = r < step
                  const isCurrent = r === step
                  const isFuture = r > step
                  return (
                    <motion.rect
                      key={`${r}-${c}`}
                      x={44 + c * CELL}
                      y={r * CELL}
                      width={CELL - 1}
                      height={CELL - 1}
                      animate={{
                        opacity: isFuture ? 0.05 : isPast ? 0.55 : 1,
                        fill: cellColor(v),
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  )
                })
              )}
              {/* current-row flash highlight */}
              <motion.rect
                key={`hl-${step}`}
                x={43}
                y={step * CELL - 1}
                width={D_K * CELL + 2}
                height={CELL + 1}
                fill="none"
                stroke={COLORS.amber}
                strokeWidth={1.5}
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </svg>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[var(--rule)] pt-4 grid grid-cols-1 gap-4 md:grid-cols-3 mono text-[10px] text-[var(--fg-muted)]">
        <div>
          <div className="small-caps" style={{ color: COLORS.blue }}>
            what gets computed at step {currentT}
          </div>
          <div className="mt-1 leading-5">
            1 new row of K, 1 new row of V. That&apos;s it. The query for the new token attends
            against all cached keys.
          </div>
        </div>
        <div>
          <div className="small-caps" style={{ color: COLORS.blue }}>
            what gets reused
          </div>
          <div className="mt-1 leading-5 tabular">
            {step} × 2 × {D_K} = {step * 2 * D_K} cached values (rows 0..{step - 1}). Zero
            recomputation.
          </div>
        </div>
        <div>
          <div className="small-caps" style={{ color: COLORS.blue }}>
            why it matters
          </div>
          <div className="mt-1 leading-5">
            Without the cache, generating token N would cost O(N²). With cache, O(N). This is the
            difference between minutes and hours on long contexts.
          </div>
        </div>
      </div>
    </div>
  )
}
