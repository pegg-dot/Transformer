'use client'

import { motion } from 'framer-motion'

interface Props {
  number: string            // "01", "02", etc.
  kicker?: string           // small-caps tag ("inside the model")
  title: string             // serif display
  subtitle?: string
  accent?: 'blue' | 'violet' | 'mint'
  right?: React.ReactNode
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  blue: 'var(--accent)',
  violet: 'var(--accent-violet)',
  mint: 'var(--accent-mint)',
}

export function SectionHeader({
  number,
  kicker,
  title,
  subtitle,
  accent = 'blue',
  right,
}: Props) {
  const color = ACCENTS[accent]
  return (
    <div className="relative">
      <div className="flex items-end justify-between gap-8 pb-3">
        <div className="flex items-end gap-5">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="chapter-num text-[56px] leading-none"
            style={{ color }}
          >
            {number}
          </motion.div>
          <div className="space-y-1 pb-2">
            {kicker && (
              <div className="small-caps text-[var(--fg-muted)]">{kicker}</div>
            )}
            <h2 className="display text-[30px] md:text-[36px]">{title}</h2>
            {subtitle && (
              <p className="max-w-2xl text-[14px] leading-6 text-[var(--fg-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right && <div className="shrink-0 pb-2">{right}</div>}
      </div>
      <div className="rule" />
    </div>
  )
}
