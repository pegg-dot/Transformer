'use client'

import { useState } from 'react'
import { attentionColor } from '@/lib/color'
import type { Matrix } from '@/lib/types'

interface Props {
  weights: Matrix            // [T, T]
  tokenStrs: string[]
  cell?: number
  onHover?: (info: { q: number; k: number; w: number } | null) => void
  hoverable?: boolean
  glowOnHover?: boolean
}

export function AttentionHeatmap({
  weights,
  tokenStrs,
  cell = 10,
  onHover,
  hoverable = true,
  glowOnHover = true,
}: Props) {
  const T = weights.length
  const [hover, setHover] = useState<{ q: number; k: number } | null>(null)

  return (
    <div
      className="relative grid rounded-[2px] border border-[var(--rule-strong)] transition-[box-shadow] duration-200"
      style={{
        gridTemplateColumns: `repeat(${T}, ${cell}px)`,
        gridAutoRows: `${cell}px`,
        width: T * cell,
        height: T * cell,
        boxShadow:
          hover && glowOnHover
            ? '0 0 0 1px var(--accent), 0 0 28px -6px rgba(96,165,250,0.5)'
            : 'none',
      }}
      onMouseLeave={() => {
        setHover(null)
        onHover?.(null)
      }}
    >
      {weights.map((row, q) =>
        row.map((w, k) => (
          <div
            key={`${q}-${k}`}
            style={{
              background: attentionColor(w),
              outline:
                hover && (hover.q === q || hover.k === k)
                  ? hover.q === q && hover.k === k
                    ? '1px solid rgba(255,255,255,0.9)'
                    : '1px solid rgba(255,255,255,0.15)'
                  : undefined,
              outlineOffset: '-1px',
            }}
            onMouseEnter={
              hoverable
                ? () => {
                    setHover({ q, k })
                    onHover?.({ q, k, w })
                  }
                : undefined
            }
            title={
              hoverable
                ? `q=${q}(${JSON.stringify(tokenStrs[q])}) → k=${k}(${JSON.stringify(
                    tokenStrs[k]
                  )}) · ${w.toFixed(3)}`
                : undefined
            }
          />
        ))
      )}
    </div>
  )
}
