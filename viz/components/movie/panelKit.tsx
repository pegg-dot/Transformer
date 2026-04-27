'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { useSpeed } from './speedContext'

/**
 * Portrait-friendly building blocks for the 2D detail rail.
 *
 * After the 3D-first redesign the rail is ~45% wide (or 58% in `wide`
 * scenes). The old 1400×600-viewBox SVG panels read poorly at those
 * dimensions. These primitives compose into vertical layouts that read
 * top-to-bottom: header → math → annotations → numbers.
 *
 * Goal: the 2D side stops trying to redraw what the 3D side is showing.
 * It becomes the ANNOTATED COMMENTARY — formulas, role labels, numbers,
 * key insights — pointing at what's happening on stage.
 */

interface PanelProps {
  /** Section line like "ACT II · ATTENTION". Tiny mono caps at the top. */
  kicker?: string
  /** The big title — short, sentence-style. */
  title: string
  /** Optional 1–2 line subtitle in muted tone. */
  subtitle?: ReactNode
  /** Color of the kicker / accents. */
  accent: string
  /** The body — composed from <Eq>, <RoleRow>, <Bullet>, <Numbers>, etc. */
  children?: ReactNode
}

export function Panel({ kicker, title, subtitle, accent, children }: PanelProps) {
  const speed = useSpeed()
  return (
    <div className="relative flex h-full w-full flex-col items-stretch justify-center px-6 py-4">
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 / speed, ease: 'easeOut' }}
      >
        {kicker && (
          <div
            className="mono text-[10px] tracking-[0.26em] uppercase"
            style={{ color: accent, opacity: 0.95 }}
          >
            {kicker}
          </div>
        )}
        <div
          className="display text-[clamp(22px,2.4vw,32px)] leading-tight"
          style={{ color: 'var(--fg)' }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-[14px] leading-6 text-[var(--fg-muted)]">
            {subtitle}
          </div>
        )}
        {children && <div className="mt-2 flex flex-col gap-3">{children}</div>}
      </motion.div>
    </div>
  )
}

/** A formula displayed prominently. Optionally with a caption underneath. */
export function Eq({
  children,
  caption,
  accent,
}: {
  children: ReactNode
  caption?: string
  accent?: string
}) {
  const speed = useSpeed()
  return (
    <motion.div
      className="rounded-[4px] border-2 px-4 py-3 text-center"
      style={{
        borderColor: accent ? `${accent}55` : 'var(--rule-strong)',
        background: 'rgba(255,255,255,0.02)',
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 / speed, delay: 0.2 / speed, ease: 'easeOut' }}
    >
      <div
        className="display text-[clamp(18px,2.0vw,26px)] leading-tight"
        style={{ color: 'var(--fg)', fontStyle: 'italic' }}
      >
        {children}
      </div>
      {caption && (
        <div className="mono mt-1.5 text-[10px] tracking-wider text-[var(--fg-dim)]">
          {caption}
        </div>
      )}
    </motion.div>
  )
}

/** A "role" row: bold label on the left, descriptor on the right, accent stripe. */
export function RoleRow({
  label,
  text,
  accent,
  delay = 0,
}: {
  label: string
  text: ReactNode
  accent: string
  delay?: number
}) {
  const speed = useSpeed()
  return (
    <motion.div
      className="flex items-baseline gap-3 border-l-2 pl-3"
      style={{ borderColor: accent }}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 / speed, delay: delay / speed, ease: 'easeOut' }}
    >
      <div
        className="display shrink-0 text-[20px]"
        style={{ color: accent, fontStyle: 'italic' }}
      >
        {label}
      </div>
      <div className="text-[13px] leading-5 text-[var(--fg-muted)]">{text}</div>
    </motion.div>
  )
}

/** A short bulleted insight, numbered or with a leading dot. */
export function Bullet({
  index,
  children,
  accent,
  delay = 0,
}: {
  index?: number
  children: ReactNode
  accent: string
  delay?: number
}) {
  const speed = useSpeed()
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 / speed, delay: delay / speed, ease: 'easeOut' }}
    >
      <div
        className="mono mt-0.5 shrink-0 text-[10px] tracking-wider"
        style={{ color: accent, opacity: 0.95 }}
      >
        {index !== undefined ? String(index).padStart(2, '0') : '·'}
      </div>
      <div className="text-[13px] leading-5 text-[var(--fg)]">{children}</div>
    </motion.div>
  )
}

/** A row of number chips — labels above small mono values. */
export function Numbers({
  chips,
}: {
  chips: { label: string; value: string; color?: string }[]
}) {
  const speed = useSpeed()
  return (
    <motion.div
      className="mt-1 flex flex-wrap items-stretch gap-2"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 / speed, delay: 0.4 / speed, ease: 'easeOut' }}
    >
      {chips.map((c, i) => (
        <div
          key={i}
          className="flex flex-col items-start rounded-[3px] border border-[var(--rule)] px-2.5 py-1.5"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="small-caps text-[8.5px] tracking-[0.2em]"
            style={{ color: c.color ?? 'var(--fg-dim)' }}
          >
            {c.label}
          </div>
          <div
            className="mono mt-0.5 tabular text-[14px]"
            style={{ color: c.color ?? 'var(--fg)' }}
          >
            {c.value}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

/**
 * Show a portrait commentary panel for `panelMs`, then crossfade into
 * the original scene animation. The viewer gets time to read the math
 * + insights first, then watches the rich SVG/canvas visualization.
 *
 * Speed-aware: at 2× the panel auto-advances at 2.5s, etc.
 */
export function PanelThenScene({
  panel,
  scene,
  panelMs = 5000,
}: {
  panel: ReactNode
  scene: ReactNode
  panelMs?: number
}) {
  const speed = useSpeed()
  const [phase, setPhase] = useState<'panel' | 'scene'>('panel')

  useEffect(() => {
    setPhase('panel')
    const timer = setTimeout(() => setPhase('scene'), panelMs / speed)
    return () => clearTimeout(timer)
  }, [panelMs, speed])

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="sync" initial={false}>
        {phase === 'panel' ? (
          <motion.div
            key="panel"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 / speed, ease: 'easeOut' }}
          >
            {panel}
          </motion.div>
        ) : (
          <motion.div
            key="scene"
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 / speed, ease: 'easeOut' }}
          >
            {scene}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiny progress dots showing which phase we're in */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        <span
          className="inline-block h-1 w-6 rounded-full transition-colors"
          style={{
            background:
              phase === 'panel' ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
          }}
        />
        <span
          className="inline-block h-1 w-6 rounded-full transition-colors"
          style={{
            background:
              phase === 'scene' ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
          }}
        />
      </div>
    </div>
  )
}

/** A small "phase" pill with a 1..N counter — for multi-phase scenes. */
export function PhasePill({
  phase,
  total,
  label,
  accent,
}: {
  phase: number
  total: number
  label: string
  accent: string
}) {
  return (
    <div
      className="mono inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-wider"
      style={{ borderColor: accent, color: accent, background: `${accent}1a` }}
    >
      <span className="tabular">
        {phase}/{total}
      </span>
      <span className="opacity-60">·</span>
      <span>{label}</span>
    </div>
  )
}
