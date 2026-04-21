'use client'

import { motion } from 'framer-motion'

interface Props {
  n: number
  selected: number
  onSelect: (i: number) => void
}

export function LayerSelector({ n, selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="small-caps text-[var(--fg-dim)]">layer</span>
      <div className="relative flex items-center">
        {Array.from({ length: n }).map((_, i) => {
          const active = selected === i
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className="relative px-4 py-1.5 mono tabular text-[13px] transition-colors"
              style={{ color: active ? 'var(--fg)' : 'var(--fg-muted)' }}
            >
              {active && (
                <motion.span
                  layoutId="layer-underline"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  className="absolute inset-x-2 -bottom-px h-[2px]"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <span className="relative">{i.toString().padStart(2, '0')}</span>
            </button>
          )
        })}
      </div>
      <span className="mono text-[10px] text-[var(--fg-dim)]">
        {selected + 1} of {n} blocks
      </span>
    </div>
  )
}
