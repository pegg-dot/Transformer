'use client'

import { useMemo } from 'react'
import { Panel } from './Panel'
import { divergingColor, maxAbs } from '@/lib/color'
import type { Matrix } from '@/lib/types'

interface Props {
  embedding: Matrix     // [T, C]
  tokenStrs: string[]
  title?: string
  kicker?: string
  label?: string
  shapeSuffix?: string
  accent?: 'blue' | 'violet' | 'mint'
}

const EXPLAIN = {
  whatYouSee:
    'A colored grid. Each column is one token in your sequence. Each row is one dimension of its 384-dim embedding vector (downsampled to ~128 rows for clarity). Blue = positive value, red = negative, dark = near zero.',
  whyItMatters:
    'Before the model can do anything interesting, it turns each integer token ID into a vector of 384 real numbers. This is the "residual stream" — every block reads from it and writes back into it. The structure of these vectors is what makes the rest of the model work.',
  whatToLookFor:
    'Rows with consistent patterns across tokens — those are dimensions the model uses to encode something specific. Tokens with similar coloring (vertical stripes) are being represented similarly. Compare "uppercase letter" columns vs. punctuation.',
}

function glyph(ch: string) {
  if (ch === '\n') return '↵'
  if (ch === ' ') return '·'
  if (ch === '\t') return '→'
  return ch
}

export function EmbeddingView({
  embedding,
  tokenStrs,
  title = 'Token embeddings',
  kicker,
  label = 'each token → 384-dim vector',
  shapeSuffix,
  accent = 'violet',
}: Props) {
  const { width, height, data, scale } = useMemo(() => {
    const T = embedding.length
    const C = embedding[0]?.length ?? 0
    const rowCount = Math.min(96, C)
    const rowStride = Math.max(1, Math.floor(C / rowCount))
    const allAbs: number[] = []
    for (const row of embedding) for (const v of row) allAbs.push(v)
    const scaleVal = maxAbs(allAbs) || 1

    const grid: string[][] = []
    for (let r = 0; r < rowCount; r++) {
      const row: string[] = []
      const cFull = Math.min(C - 1, r * rowStride)
      for (let t = 0; t < T; t++) {
        row.push(divergingColor(embedding[t][cFull], scaleVal))
      }
      grid.push(row)
    }
    return { width: T, height: rowCount, data: grid, scale: scaleVal }
  }, [embedding])

  const T = embedding.length
  const C = embedding[0]?.length ?? 0

  return (
    <Panel
      title={title}
      kicker={kicker ?? label}
      shape={shapeSuffix ?? `[T=${T}, C=${C}]`}
      explain={EXPLAIN}
      accent={accent}
    >
      <div className="overflow-x-auto pb-1">
        <div
          className="relative grid border border-[var(--rule-strong)]"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(14px, 1fr))`,
            gridTemplateRows: `repeat(${height}, 2px)`,
            minWidth: `${width * 14}px`,
          }}
        >
          {data.map((row, r) =>
            row.map((color, t) => (
              <div key={`${r}-${t}`} style={{ background: color }} />
            ))
          )}
        </div>
        <div
          className="mt-2 grid mono text-center text-[10px] text-[var(--fg-muted)]"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(14px, 1fr))`,
            minWidth: `${width * 14}px`,
          }}
        >
          {tokenStrs.map((ch, i) => (
            <div key={i} className="truncate" title={`${i}: ${JSON.stringify(ch)}`}>
              {glyph(ch)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 mono text-[10px] text-[var(--fg-muted)]">
        <span className="small-caps text-[var(--fg-dim)]">scale</span>
        <div className="flex h-1.5 w-48 overflow-hidden rounded-sm border border-[var(--rule)]">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ background: divergingColor(((i - 13.5) / 13.5) * scale, scale) }}
            />
          ))}
        </div>
        <span className="tabular">±{scale.toFixed(2)}</span>
        <span className="ml-auto text-[var(--fg-dim)]">rows subsampled to {height} of {C}</span>
      </div>
    </Panel>
  )
}
