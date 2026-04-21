'use client'

import { motion } from 'framer-motion'
import { useMode } from '@/lib/mode'

export function ModeToggle() {
  const { mode, setMode } = useMode()
  return (
    <div className="mono inline-flex items-center rounded-full border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-0.5 text-[10px]">
      {(['beginner', 'advanced'] as const).map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`relative rounded-full px-3 py-1 uppercase tracking-widest transition-colors ${
              active
                ? 'text-[var(--bg)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                className="absolute inset-0 rounded-full bg-[var(--fg)]"
              />
            )}
            <span className="relative">{m.slice(0, 3)}</span>
          </button>
        )
      })}
    </div>
  )
}
