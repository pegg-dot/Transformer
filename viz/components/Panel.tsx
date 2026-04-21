'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMode } from '@/lib/mode'

interface PanelProps {
  title: string
  kicker?: string
  shape?: string
  explain?: {
    whatYouSee: string
    whyItMatters: string
    whatToLookFor: string
  }
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  accent?: 'blue' | 'violet' | 'mint'
  tight?: boolean
}

const ACCENTS = {
  blue: 'var(--accent)',
  violet: 'var(--accent-violet)',
  mint: 'var(--accent-mint)',
}

export function Panel({
  title,
  kicker,
  shape,
  explain,
  right,
  children,
  className = '',
  accent = 'blue',
  tight = false,
}: PanelProps) {
  const [open, setOpen] = useState(false)
  const { mode } = useMode()
  const showShape = mode === 'advanced' && shape

  return (
    <section
      className={`relative rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] shadow-[0_20px_70px_-30px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* accent vertical hairline on the left edge */}
      <span
        className="absolute inset-y-0 left-0 w-px"
        style={{ background: ACCENTS[accent], opacity: 0.35 }}
      />
      <header className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3">
        <div className="flex items-baseline gap-4 min-w-0">
          {kicker && <span className="small-caps text-[var(--fg-dim)]">{kicker}</span>}
          <h3 className="display text-[18px] tracking-tight truncate">{title}</h3>
          {showShape && (
            <span className="mono truncate text-[10px] text-[var(--fg-muted)]">{shape}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {right}
          {explain && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Explain this"
                className="mono flex h-6 w-6 items-center justify-center rounded-full border border-[var(--rule-strong)] text-[11px] text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg)]"
              >
                ?
              </button>
              <AnimatePresence>
                {open && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 top-8 z-40 w-[360px] rounded-[2px] border border-[var(--rule-strong)] bg-[#0f0f13] p-5 text-[13px] shadow-2xl shadow-black/70"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="small-caps mb-1.5 text-[var(--accent)]">
                            what you&apos;re seeing
                          </div>
                          <p className="leading-6 text-[var(--fg)]">{explain.whatYouSee}</p>
                        </div>
                        <div className="rule" />
                        <div>
                          <div className="small-caps mb-1.5 text-[var(--accent)]">
                            why it matters
                          </div>
                          <p className="leading-6 text-[var(--fg-muted)]">{explain.whyItMatters}</p>
                        </div>
                        <div className="rule" />
                        <div>
                          <div className="small-caps mb-1.5 text-[var(--accent)]">
                            what to look for
                          </div>
                          <p className="leading-6 text-[var(--fg-muted)]">
                            {explain.whatToLookFor}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>
      <div className={tight ? 'p-0' : 'p-5'}>{children}</div>
    </section>
  )
}
