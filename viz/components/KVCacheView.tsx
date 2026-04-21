'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Panel } from './Panel'
import { divergingColor, maxAbs } from '@/lib/color'
import type { AttentionCapture } from '@/lib/types'

interface Props {
  attn: AttentionCapture
  tokenStrs: string[]
  layerIndex: number
}

const EXPLAIN = {
  whatYouSee:
    'Two tall stripes: K (keys) and V (values) for the attention head you chose. Rows = tokens (oldest at top), columns = per-head feature dims. Drag the slider — each step reveals one more row.',
  whyItMatters:
    'At every generation step, the model adds exactly one new row of K and one new row of V. Every new token reuses all prior rows unchanged. This is the KV cache — the reason modern LLMs are tractable at long context.',
  whatToLookFor:
    'Scrub the step slider forward. Each click = one generation step = one new appended row (blue flash). The attention heatmap above is a T×T matrix that grows exactly like this cache.',
}

function MatrixGrid({
  mat,
  upTo,
  maxAbsVal,
  label,
  accent,
}: {
  mat: number[][]
  upTo: number
  maxAbsVal: number
  label: string
  accent: string
}) {
  const T = mat.length
  const D = mat[0]?.length ?? 0
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="small-caps" style={{ color: accent }}>
          {label}
        </span>
        <span className="mono text-[10px] text-[var(--fg-dim)]">[T={T}, d_k={D}]</span>
      </div>
      <div className="overflow-x-auto">
        <div
          className="relative grid rounded-[2px] border border-[var(--rule-strong)]"
          style={{
            gridTemplateColumns: `repeat(${D}, 1fr)`,
            gridAutoRows: '10px',
            width: '100%',
            minWidth: Math.max(240, D * 5),
          }}
        >
          {mat.map((row, t) =>
            row.map((v, d) => (
              <motion.div
                key={`${t}-${d}`}
                initial={false}
                animate={{ opacity: t <= upTo ? 1 : 0.06 }}
                transition={{ duration: 0.16 }}
                style={{ background: divergingColor(v, maxAbsVal) }}
              />
            ))
          )}
          <motion.div
            key={`hl-${upTo}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="pointer-events-none"
            style={{
              gridColumn: `1 / span ${D}`,
              gridRow: `${upTo + 1} / span 1`,
              background: 'rgba(96,165,250,0.32)',
              boxShadow: '0 0 0 1px rgba(96,165,250,0.8), 0 0 12px 2px rgba(96,165,250,0.4)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function KVCacheView({ attn, tokenStrs, layerIndex }: Props) {
  const H = attn.k.length
  const T = attn.k[0].length
  const [head, setHead] = useState(0)
  const [step, setStep] = useState(T - 1)

  const kMat = attn.k[head]
  const vMat = attn.v[head]

  const scale = useMemo(() => {
    const mk = maxAbs(kMat.flat())
    const mv = maxAbs(vMat.flat())
    return Math.max(mk, mv) || 1
  }, [kMat, vMat])

  return (
    <Panel
      title={`KV cache — head ${head.toString().padStart(2, '0')}`}
      kicker={`layer ${layerIndex.toString().padStart(2, '0')}`}
      shape={`K, V ∈ [H=${H}, T=${T}, d_k=${kMat[0].length}]`}
      explain={EXPLAIN}
      accent="mint"
    >
      <div className="mb-5 flex flex-wrap items-center gap-6 mono text-[11px] text-[var(--fg-muted)]">
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
                    : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:border-[var(--rule-strong)] hover:text-[var(--fg)]'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-1 min-w-[280px] items-center gap-3">
          <span className="small-caps text-[var(--fg-dim)]">step</span>
          <input
            type="range"
            min={0}
            max={T - 1}
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value, 10))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="tabular w-20 text-right text-[var(--fg)]">
            {String(step + 1).padStart(2, '0')} / {T}
          </span>
        </label>
        <button
          type="button"
          onClick={() => setStep(T - 1)}
          className="rounded-[2px] border border-[var(--rule-strong)] px-3 py-1 text-[10px] hover:border-[var(--accent)]"
        >
          ALL
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <MatrixGrid mat={kMat} upTo={step} maxAbsVal={scale} label="K · keys" accent="var(--accent)" />
        <MatrixGrid
          mat={vMat}
          upTo={step}
          maxAbsVal={scale}
          label="V · values"
          accent="var(--accent-violet)"
        />
      </div>

      <div className="mt-5 flex items-center justify-between mono text-[10px] text-[var(--fg-muted)]">
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
          >
            <span className="small-caps text-[var(--fg-dim)]">current token</span>
            <span className="mx-2 text-[var(--fg)]">{JSON.stringify(tokenStrs[step])}</span>
            <span className="text-[var(--fg-dim)]">id {step}</span>
          </motion.span>
        </AnimatePresence>
        <span className="text-[var(--fg-dim)]">
          rows after current step are dimmed · blue flash ≡ newly appended row
        </span>
      </div>
    </Panel>
  )
}
