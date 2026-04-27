'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useSpeed } from './speedContext'

/**
 * Scene-level split-pane layout for educational scenes.
 *
 * Left pane = visualization. Right pane = persistent commentary.
 * Used for Act I scenes (and is the new default for educational content).
 *
 * Mounted via `panelAnchor: 'fullscreen'` so it covers the orchestrator's
 * default 3D-stage / right-rail layout entirely. The chrome (header, bottom
 * timeline) above and below is provided by the orchestrator.
 */

export interface SceneTextPaneData {
  /** Tiny mono caps top line, e.g. "ACT I · INPUT". */
  kicker: string
  /** Big italic serif headline. */
  title: string
  /** Italic dim subtitle, 1–3 lines. */
  subtitle: ReactNode
  /** Optional equation card under the subtitle (LOOKUP RULE etc). */
  equation?: { label: string; body: ReactNode }
  /** Optional small ⓘ callout at the bottom. */
  infoCallout?: ReactNode
  /** Color of the underline + kicker accent. */
  accent: string
}

export function SplitPaneScene({
  viz,
  text,
}: {
  viz: ReactNode
  text: SceneTextPaneData
}) {
  return (
    <div className="absolute inset-0 flex bg-[var(--bg)]">
      {/* Left pane — visualization. ~62% width. */}
      <div className="relative flex-1 overflow-hidden">{viz}</div>

      {/* Vertical rule between panes */}
      <div className="w-px shrink-0 bg-[var(--rule)]" />

      {/* Right pane — persistent commentary. */}
      <div
        className="relative shrink-0"
        style={{ width: 'clamp(420px, 38%, 640px)' }}
      >
        <SceneTextPane data={text} />
      </div>
    </div>
  )
}

export function SceneTextPane({ data }: { data: SceneTextPaneData }) {
  const speed = useSpeed()
  return (
    <div className="flex h-full w-full flex-col justify-center px-10 py-10 lg:px-14">
      <motion.div
        className="flex flex-col gap-7"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 / speed, ease: 'easeOut' }}
      >
        {/* Kicker */}
        <div
          className="mono text-[11px] tracking-[0.32em] uppercase"
          style={{ color: data.accent, opacity: 0.95 }}
        >
          {data.kicker}
        </div>

        {/* Big italic serif headline with violet underline */}
        <div className="flex flex-col gap-3">
          <h2
            className="display text-[clamp(36px,4.2vw,56px)] font-light leading-[1.05]"
            style={{
              color: 'var(--fg)',
              fontStyle: 'italic',
              fontFamily: 'var(--font-display, "Tiempos", "Source Serif Pro", Georgia, serif)',
            }}
          >
            {data.title}
          </h2>
          <motion.div
            className="h-px"
            style={{ background: data.accent }}
            initial={{ width: 0 }}
            animate={{ width: '78%' }}
            transition={{ duration: 0.7 / speed, delay: 0.2 / speed, ease: 'easeOut' }}
          />
        </div>

        {/* Italic dim subtitle */}
        <motion.p
          className="text-[clamp(15px,1.15vw,18px)] leading-[1.55] text-[var(--fg-muted)]"
          style={{
            fontStyle: 'italic',
            fontFamily: 'var(--font-display, "Tiempos", "Source Serif Pro", Georgia, serif)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.5 / speed, delay: 0.35 / speed }}
        >
          {data.subtitle}
        </motion.p>

        {/* Optional equation card */}
        {data.equation && (
          <motion.div
            className="rounded-[3px] border-2 px-5 py-4"
            style={{
              borderColor: `${data.accent}55`,
              background: 'rgba(255,255,255,0.025)',
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 / speed, delay: 0.55 / speed, ease: 'easeOut' }}
          >
            <div
              className="mono text-[10px] tracking-[0.28em] uppercase"
              style={{ color: data.accent, opacity: 0.85 }}
            >
              {data.equation.label}
            </div>
            <div
              className="display mt-3 text-[clamp(20px,1.7vw,26px)] leading-tight"
              style={{ color: 'var(--fg)', fontStyle: 'italic' }}
            >
              {data.equation.body}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Spacer pushes info callout to bottom */}
      <div className="flex-1" />

      {/* Info callout footer */}
      {data.infoCallout && (
        <motion.div
          className="border-t border-[var(--rule)] pt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 / speed, delay: 0.8 / speed }}
        >
          <div className="flex items-start gap-3 text-[13px] leading-[1.55] text-[var(--fg-muted)]">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
              style={{
                borderColor: 'var(--rule-strong)',
                color: 'var(--fg-dim)',
              }}
            >
              ⓘ
            </span>
            <span>{data.infoCallout}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
