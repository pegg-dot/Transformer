'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TransformerTheater } from './TransformerTheater'
import { useMode } from '@/lib/mode'

const STATS = [
  { label: 'layers', value: '6' },
  { label: 'heads', value: '6' },
  { label: 'd_model', value: '384' },
  { label: 'params', value: '10.79M' },
  { label: 'vocab', value: '65' },
  { label: 'runtime', value: 'WASM' },
]

export function Hero() {
  const { mode } = useMode()
  return (
    <section className="relative pt-20 pb-12 md:pt-28">
      <div className="mx-auto max-w-[1600px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex items-center gap-3 small-caps text-[var(--fg-muted)]"
        >
          <span className="h-px w-10 bg-[var(--rule-strong)]" />
          <span>transformer · live · in your browser</span>
        </motion.div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.05 }}
            className="display text-[56px] leading-[0.95] tracking-[-0.035em] md:text-[96px]"
          >
            Watch a neural network{' '}
            <span className="display-italic" style={{ color: 'var(--accent)' }}>
              think
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-md shrink-0 text-[15px] leading-7 text-[var(--fg-muted)] lg:text-right"
          >
            {mode === 'beginner' ? (
              <>
                A small language model running in your browser.{' '}
                <span className="text-[var(--fg)]">Below is the whole transformer, in motion.</span>{' '}
                Hover or click any piece to zoom in.
              </>
            ) : (
              <>
                A 10.79M-param GPT, animated end-to-end.{' '}
                <span className="text-[var(--fg)]">Hover tokens, click blocks, dive in.</span>
              </>
            )}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: 'easeOut' }}
          className="mt-10 overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]"
        >
          <TransformerTheater />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mt-10 flex flex-wrap items-end justify-between gap-8"
        >
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.04 }}
                className="flex flex-col"
              >
                <span className="small-caps text-[var(--fg-dim)]">{s.label}</span>
                <span className="mono tabular mt-1 text-[20px] tracking-tight text-[var(--fg)]">
                  {s.value}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/tour"
              className="group flex items-center gap-3 rounded-full border border-[var(--rule-strong)] px-5 py-2.5 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span>open in theater</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a
              href="#generate"
              className="mono text-[11px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              ↓ run the real model
            </a>
          </div>
        </motion.div>

        <div className="rule mt-16" />
      </div>
    </section>
  )
}
