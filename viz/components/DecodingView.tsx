'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Panel } from './Panel'
import type { Matrix } from '@/lib/types'

interface Props {
  logits: Matrix     // [T, V]
  vocab: string[]
  lastTokenId: number | null
}

const EXPLAIN = {
  whatYouSee:
    'A bar chart of the model’s scores for every possible next character, sorted highest-first. Bars are probabilities (softmax of the raw logits). The red bar is the character that was actually sampled.',
  whyItMatters:
    'Everything before was deterministic matrix math. This is where chance enters. Softmax turns the raw scores into a probability distribution; temperature controls sharpness. Then we roll a weighted die.',
  whatToLookFor:
    'Low temperature ≈ one bar dominates (model plays it safe). High temperature ≈ many bars comparable in size (model gets wild). Compare what top-1 looks like at T=0.2 vs T=2.0.',
}

function glyph(ch: string) {
  if (ch === '\n') return '↵'
  if (ch === ' ') return '·'
  if (ch === '\t') return '→'
  return ch
}

function softmax(logits: number[], temperature: number): number[] {
  let max = -Infinity
  for (const v of logits) {
    const t = v / temperature
    if (t > max) max = t
  }
  let sum = 0
  const out = new Array(logits.length)
  for (let i = 0; i < logits.length; i++) {
    const v = Math.exp(logits[i] / temperature - max)
    out[i] = v
    sum += v
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum
  return out
}

function entropy(p: number[]): number {
  let h = 0
  for (const x of p) if (x > 0) h -= x * Math.log2(x)
  return h
}

export function DecodingView({ logits, vocab, lastTokenId }: Props) {
  const lastLogits = logits[logits.length - 1]
  const [temp, setTemp] = useState(1.0)
  const [k, setK] = useState(15)

  const { ranked, probs } = useMemo(() => {
    const p = softmax(lastLogits, temp)
    const r = p
      .map((pr, i) => ({ id: i, prob: pr, char: vocab[i], logit: lastLogits[i] }))
      .sort((a, b) => b.prob - a.prob)
    return { ranked: r, probs: p }
  }, [lastLogits, vocab, temp])

  const topK = ranked.slice(0, k)
  const maxProb = topK[0]?.prob ?? 1
  const sumTopK = topK.reduce((a, e) => a + e.prob, 0)
  const H = entropy(probs)

  return (
    <Panel
      title="Decoding"
      kicker="next-token distribution"
      shape={`logits [V=${lastLogits.length}]  →  softmax(·/τ)  →  sample`}
      explain={EXPLAIN}
      accent="blue"
      right={
        <div className="flex items-center gap-4 mono text-[10px] text-[var(--fg-muted)]">
          <span>
            <span className="text-[var(--fg-dim)]">H(p) </span>
            <span className="tabular text-[var(--fg)]">{H.toFixed(2)}</span> bits
          </span>
          <span>
            <span className="text-[var(--fg-dim)]">top-{k} </span>
            <span className="tabular text-[var(--fg)]">{(sumTopK * 100).toFixed(1)}%</span>
          </span>
        </div>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-8 mono text-[11px] text-[var(--fg-muted)]">
        <label className="flex items-center gap-3">
          <span className="small-caps text-[var(--fg-dim)]">temperature</span>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.02}
            value={temp}
            onChange={(e) => setTemp(parseFloat(e.target.value))}
            className="w-40 accent-[var(--accent)]"
          />
          <span className="tabular w-10 text-right text-[var(--fg)]">{temp.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-3">
          <span className="small-caps text-[var(--fg-dim)]">show top-k</span>
          <input
            type="number"
            min={1}
            max={vocab.length}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value, 10) || 1)}
            className="w-14 rounded-[2px] border border-[var(--rule-strong)] bg-transparent px-2 py-0.5 text-center text-[var(--fg)]"
          />
        </label>
      </div>

      <div className="space-y-1">
        {topK.map((e, i) => {
          const width = (e.prob / maxProb) * 100
          const isSampled = e.id === lastTokenId
          return (
            <div key={e.id} className="group flex items-center gap-3 mono text-[11px]">
              <div className="tabular w-6 text-right text-[var(--fg-dim)]">
                {(i + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-[var(--rule-strong)] text-[12px] text-[var(--fg)]">
                {glyph(e.char)}
              </div>
              <div className="relative h-6 flex-1 overflow-hidden rounded-[2px] bg-[rgba(255,255,255,0.02)] border border-[var(--rule)]">
                <motion.div
                  key={`${temp}-${e.id}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0"
                  style={{
                    background: isSampled
                      ? 'linear-gradient(90deg, rgba(248,113,113,0.65), rgba(248,113,113,0.35))'
                      : 'linear-gradient(90deg, rgba(96,165,250,0.55), rgba(96,165,250,0.25))',
                    boxShadow: isSampled
                      ? '0 0 16px -4px rgba(248,113,113,0.5), inset 0 0 8px rgba(248,113,113,0.15)'
                      : undefined,
                  }}
                />
                <div className="relative flex h-full items-center justify-between px-3 text-[10px]">
                  <span className="tabular text-[var(--fg)]">
                    {e.prob >= 0.001 ? `${(e.prob * 100).toFixed(1)}%` : e.prob.toExponential(1)}
                  </span>
                  <span className="tabular text-[var(--fg-muted)]">
                    logit {e.logit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {lastTokenId !== null && (
        <div className="mt-4 border-t border-[var(--rule)] pt-3 mono text-[11px] text-[var(--fg-muted)]">
          sampled{' '}
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] border border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.1)] text-[var(--accent-red)]">
            {glyph(vocab[lastTokenId])}
          </span>{' '}
          <span className="text-[var(--fg)]">{JSON.stringify(vocab[lastTokenId])}</span>{' '}
          <span className="text-[var(--fg-dim)]">id {lastTokenId}</span>
        </div>
      )}
    </Panel>
  )
}
