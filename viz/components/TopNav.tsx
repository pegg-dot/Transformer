'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ModeToggle } from './ModeToggle'

export function TopNav({ showTourLink = true }: { showTourLink?: boolean }) {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 120], [0, 1])
  const blur = useTransform(scrollY, [0, 120], [0, 8])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent"
      style={{
        backgroundColor: useTransform(
          scrollY,
          [0, 120],
          ['rgba(7,7,9,0)', 'rgba(7,7,9,0.7)']
        ),
        borderBottomColor: useTransform(
          scrollY,
          [0, 120],
          ['rgba(255,255,255,0)', 'rgba(255,255,255,0.06)']
        ),
        backdropFilter: useTransform(blur, (b) => `blur(${b}px)`),
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
        <motion.div style={{ opacity }} className="flex items-center gap-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-[17px]">transformer</span>
            <span className="mono text-[10px] text-[var(--fg-muted)]">.live</span>
          </Link>
          <div className="relative flex items-center gap-1.5 pl-3 mono text-[10px] text-[var(--fg-muted)]">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="ping-soft absolute inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />
            </span>
            <span>live in your browser</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          {showTourLink && (
            <Link
              href="/tour"
              className="mono text-[11px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              /tour
            </Link>
          )}
          <ModeToggle />
        </div>
      </div>
    </motion.header>
  )
}
