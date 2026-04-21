'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AttentionHeatmap } from './AttentionHeatmap'
import { Panel } from './Panel'
import { divergingColor } from '@/lib/color'
import type { BlockCapture } from '@/lib/types'

interface Props {
  block: BlockCapture
  layerIndex: number
  tokenStrs: string[]
}

const EXPLAIN_ATTN = {
  whatYouSee:
    'Six small heatmaps — one per attention head. Each is a T×T matrix: rows = query token (who is asking), columns = key token (what is being attended to). Brighter blue = higher attention weight.',
  whyItMatters:
    'Attention is the only mechanism by which tokens communicate. Every head learns a different pattern: one might track the previous token, another matching quotes, another subject-verb agreement. The model gets to combine all six perspectives per layer.',
  whatToLookFor:
    'Diagonals ≈ "previous-token" heads. Bright vertical stripes ≈ a head that always attends to the same anchor (like the line start). Upper triangle is always dark: causal mask — tokens cannot attend to the future.',
}

const EXPLAIN_FFN = {
  whatYouSee:
    'A heatmap of the feed-forward network’s post-ReLU activation. Rows = tokens, columns = FFN hidden dimensions (sampled). Blue = positive firing, dark = ReLU zeroed it out.',
  whyItMatters:
    'The FFN is where the model stores facts, concepts, and transformations. It expands the 384-dim residual stream to 1536 dims, zeros out anything negative (ReLU), then compresses back. Different dimensions fire for different concepts.',
  whatToLookFor:
    'Different tokens should fire on different columns — that’s the FFN doing per-token feature selection. If every row looks the same, the FFN is not discriminating.',
}

const EXPLAIN_RESID = {
  whatYouSee:
    'The residual stream at three snapshots inside this block: before (ln1 input), after the attention sub-layer adds to it, and after the FFN sub-layer adds to it again.',
  whyItMatters:
    'The residual stream is the model’s working memory. Each block *adds* to it, never overwrites. All 6 blocks write into the same 384-dim vector per token, which flows upward until the final prediction.',
  whatToLookFor:
    'Big differences between “before” and “after”: this block changed a lot for those tokens. Nearly-identical rows: this block mostly passed information through.',
}

function ResidualStrip({
  matrix,
  maxAbsVal,
  tokenStrs,
  label,
}: {
  matrix: number[][]
  maxAbsVal: number
  tokenStrs: string[]
  label: string
}) {
  const T = matrix.length
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-3">
        <span className="small-caps text-[var(--fg-dim)]">{label}</span>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid rounded-[2px] border border-[var(--rule-strong)]"
          style={{
            gridTemplateColumns: `repeat(${T}, minmax(14px, 1fr))`,
            minWidth: `${T * 14}px`,
          }}
        >
          {matrix.map((row, t) => {
            const norm = Math.sqrt(row.reduce((a, v) => a + v * v, 0)) / Math.sqrt(row.length)
            return (
              <div
                key={t}
                title={`token ${t} ${JSON.stringify(tokenStrs[t])} · ‖·‖/√C = ${norm.toFixed(3)}`}
                className="h-9 transition-transform hover:scale-y-110"
                style={{ background: divergingColor(norm * Math.sign(row[0]), maxAbsVal) }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function LayerView({ block, layerIndex, tokenStrs }: Props) {
  const H = block.attn.weights.length
  const T = block.attn.weights[0].length
  const [hover, setHover] = useState<{ head: number; q: number; k: number; w: number } | null>(
    null
  )

  const ffnSample = useMemo(() => {
    const mat = block.ffn.post_act
    const C4 = mat[0].length
    const stride = Math.max(1, Math.floor(C4 / 64))
    const rows: number[][] = mat.map((r) => {
      const out: number[] = []
      for (let i = 0; i < C4; i += stride) out.push(r[i])
      return out
    })
    let scale = 0
    for (const r of rows) for (const v of r) if (Math.abs(v) > scale) scale = Math.abs(v)
    return { rows, scale: scale || 1 }
  }, [block])

  const residScale = useMemo(() => {
    const flatten = (m: number[][]) => {
      let mx = 0
      for (const r of m) for (const v of r) if (Math.abs(v) > mx) mx = Math.abs(v)
      return mx
    }
    return Math.max(flatten(block.ln1), flatten(block.resid_out), flatten(block.resid_mid))
  }, [block])

  const cellSize = Math.max(4, Math.min(12, Math.floor(300 / T)))

  return (
    <div className="space-y-5">
      <Panel
        title={`Attention — 6 heads in parallel`}
        kicker={`layer ${layerIndex.toString().padStart(2, '0')}`}
        shape={`weights [H=${H}, T=${T}, T=${T}]  sum over keys = 1`}
        explain={EXPLAIN_ATTN}
        right={
          <AnimatePresence>
            {hover && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mono tabular text-[11px]"
              >
                <span className="text-[var(--fg-muted)]">h</span>
                <span className="text-[var(--fg)]">{hover.head}</span>
                <span className="mx-2 text-[var(--fg-dim)]">·</span>
                <span className="text-[var(--accent)]">q{hover.q}</span>
                <span className="mx-1 text-[var(--fg-dim)]">→</span>
                <span className="text-[var(--accent)]">k{hover.k}</span>
                <span className="mx-2 text-[var(--fg-dim)]">·</span>
                <span className="text-[var(--fg)]">{hover.w.toFixed(3)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        }
      >
        <div className="flex flex-wrap gap-6">
          {block.attn.weights.map((w, h) => (
            <motion.div
              key={h}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: h * 0.04 }}
              className="flex flex-col items-center gap-2"
            >
              <AttentionHeatmap
                weights={w}
                tokenStrs={tokenStrs}
                cell={cellSize}
                onHover={(info) => setHover(info ? { head: h, ...info } : null)}
              />
              <span className="mono tabular text-[10px] text-[var(--fg-dim)]">
                head {h.toString().padStart(2, '0')}
              </span>
            </motion.div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="FFN post-activation"
          kicker={`layer ${layerIndex.toString().padStart(2, '0')}`}
          shape={`[T=${T}, 4C=${block.ffn.post_act[0].length}] (sampled)`}
          explain={EXPLAIN_FFN}
          accent="mint"
        >
          <div className="overflow-x-auto">
            <div
              className="grid rounded-[2px] border border-[var(--rule-strong)]"
              style={{
                gridTemplateColumns: `repeat(${ffnSample.rows[0].length}, 1fr)`,
                gridAutoRows: '4px',
                width: '100%',
                minWidth: 320,
              }}
            >
              {ffnSample.rows.map((row, t) =>
                row.map((v, i) => (
                  <div
                    key={`${t}-${i}`}
                    style={{ background: divergingColor(v, ffnSample.scale) }}
                  />
                ))
              )}
            </div>
            <p className="mt-3 mono text-[10px] text-[var(--fg-muted)]">
              rows = tokens · cols = sampled FFN hidden dims · ReLU has already zeroed the
              reds before this output
            </p>
          </div>
        </Panel>

        <Panel
          title="Residual stream"
          kicker={`layer ${layerIndex.toString().padStart(2, '0')}`}
          shape={`[T=${T}, C=${block.resid_out[0].length}]`}
          explain={EXPLAIN_RESID}
          accent="violet"
        >
          <div className="space-y-3">
            <ResidualStrip
              matrix={block.ln1}
              maxAbsVal={residScale}
              tokenStrs={tokenStrs}
              label="before block · ln1 input"
            />
            <div className="flex justify-center">
              <svg width="16" height="14" viewBox="0 0 16 14" className="text-[var(--accent-violet)]">
                <path d="M8 0v12M3 8l5 4 5-4" stroke="currentColor" fill="none" strokeWidth="1.2" />
              </svg>
            </div>
            <ResidualStrip
              matrix={block.resid_mid}
              maxAbsVal={residScale}
              tokenStrs={tokenStrs}
              label="+ attention · resid_mid"
            />
            <div className="flex justify-center">
              <svg width="16" height="14" viewBox="0 0 16 14" className="text-[var(--accent-violet)]">
                <path d="M8 0v12M3 8l5 4 5-4" stroke="currentColor" fill="none" strokeWidth="1.2" />
              </svg>
            </div>
            <ResidualStrip
              matrix={block.resid_out}
              maxAbsVal={residScale}
              tokenStrs={tokenStrs}
              label="+ ffn · resid_out (block output)"
            />
          </div>
        </Panel>
      </div>
    </div>
  )
}
