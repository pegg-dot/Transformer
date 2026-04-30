'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useSpeed } from './speedContext'

/**
 * One live numeric chip on the right pane. `value` is rendered as text;
 * if it changes, the chip pulses briefly to draw the eye.
 */
export interface SceneStat {
  label: string
  value: ReactNode
  color?: string
}

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
  /**
   * Optional small "phase X / Y" pill that sits next to the kicker.
   * Useful when the left pane has a multi-phase animation (BPE merges,
   * embedding cursor, etc.) — the chip's value updates in sync.
   */
  phase?: ReactNode
  /**
   * Optional live stat chips rendered between subtitle and equation.
   * Changing values pulse briefly to flag updates.
   */
  stats?: SceneStat[]
  /**
   * Optional free-form ReactNode rendered between stats and equation —
   * for scene-specific live readouts that don't fit the chip shape.
   */
  body?: ReactNode
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
      {/* Left pane — visualization. ~68% width. Includes subtle bg grid so
          empty space around letterboxed scenes reads as intentional stage. */}
      <div className="relative flex-1 overflow-hidden">
        {/* Background dressing — faint dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(167,139,250,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Ambient bottom accent bar — barely visible, slowly oscillates.
            Bridges the "pause and go" feel of phase machines so even when
            the active phase content is briefly quiet, the eye registers
            that the scene is alive. Color picks up the scene's accent
            from text.accent. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: text.accent, mixBlendMode: 'screen' }}
          animate={{ opacity: [0.10, 0.32, 0.10] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* The viz itself, centered, filling the pane.
            The descendant selector hides legacy in-SVG number-chip strips
            (NumberPanelDiv) which were positioned for the old fullscreen
            layout and now collide with content; their data lives in the
            right pane's structured fields instead. */}
        <div className="absolute inset-0 flex items-center justify-center px-6 py-6 [&_[data-num-panel='true']]:hidden">
          <div className="h-full w-full">{viz}</div>
        </div>
      </div>

      {/* Vertical rule between panes — itself pulses subtly so it never
          looks like a dead seam during quiet phase moments. */}
      <motion.div
        className="w-px shrink-0"
        style={{ background: 'var(--rule)' }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Right pane — persistent commentary. ~32% width. */}
      <div
        className="relative shrink-0"
        style={{ width: 'clamp(380px, 32%, 560px)' }}
      >
        <SceneTextPane data={text} />
      </div>
    </div>
  )
}

export function SceneTextPane({ data }: { data: SceneTextPaneData }) {
  const speed = useSpeed()
  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden px-8 py-8 lg:px-10">
      {/* Ambient scanner — a faint horizontal violet line that sweeps top→
          bottom every ~9s, picking each text element out as it passes. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-0 h-[40%]"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${data.accent}10 50%, transparent 100%)`,
          mixBlendMode: 'screen',
        }}
        animate={{ y: ['-40%', '140%'] }}
        transition={{
          duration: 9 / speed,
          ease: 'linear',
          repeat: Infinity,
          repeatDelay: 2 / speed,
        }}
      />

      {/* Active "live" indicator — small breathing dot in the corner of the
          kicker line so it's clear something is animating, not a static page. */}

      <motion.div
        className="relative z-10 flex flex-col gap-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 / speed, ease: 'easeOut' }}
      >
        {/* Kicker line — kicker + live dot + optional phase pill */}
        <div className="flex items-center gap-3">
          <div
            className="mono text-[11px] tracking-[0.32em] uppercase"
            style={{ color: data.accent, opacity: 0.95 }}
          >
            {data.kicker}
          </div>
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: data.accent }}
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
            transition={{
              duration: 1.6 / speed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {data.phase && (
            <div className="ml-auto">{data.phase}</div>
          )}
        </div>

        {/* Big italic serif headline with breathing violet underline */}
        <div className="flex flex-col gap-3">
          <h2
            className="display text-[clamp(30px,3.4vw,48px)] font-light leading-[1.05]"
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
            initial={{ width: 0, opacity: 0.7 }}
            animate={{
              width: ['0%', '78%', '78%', '78%'],
              opacity: [0.7, 1, 0.55, 1],
              boxShadow: [
                `0 0 0 ${data.accent}00`,
                `0 0 8px ${data.accent}aa`,
                `0 0 2px ${data.accent}33`,
                `0 0 8px ${data.accent}aa`,
              ],
            }}
            transition={{
              width: { duration: 0.7 / speed, delay: 0.2 / speed, ease: 'easeOut' },
              opacity: {
                duration: 4 / speed,
                delay: 1.0 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              boxShadow: {
                duration: 4 / speed,
                delay: 1.0 / speed,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
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

        {/* Live stat strip — chips that pulse when their value changes */}
        {data.stats && data.stats.length > 0 && (
          <StatStrip stats={data.stats} accent={data.accent} />
        )}

        {/* Free-form body slot — used for scene-specific live readouts */}
        {data.body && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 / speed, delay: 0.55 / speed }}
          >
            {data.body}
          </motion.div>
        )}

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
      <div className="relative z-10 flex-1" />

      {/* Info callout footer */}
      {data.infoCallout && (
        <motion.div
          className="relative z-10 border-t border-[var(--rule)] pt-5"
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

/** Stat chip strip rendered between subtitle and equation. Cells pulse
 *  briefly when their `value` text changes (keyed re-mount + flash). */
function StatStrip({ stats, accent }: { stats: SceneStat[]; accent: string }) {
  const speed = useSpeed()
  return (
    <motion.div
      className="flex flex-wrap gap-2"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 / speed, delay: 0.5 / speed }}
    >
      {stats.map((s, i) => (
        <Stat key={i} stat={s} accent={accent} />
      ))}
    </motion.div>
  )
}

function Stat({ stat, accent }: { stat: SceneStat; accent: string }) {
  // Re-key on value change so the chip flashes when the value updates.
  const valueKey = String(stat.value)
  return (
    <div
      className="flex flex-col rounded-[3px] border px-2.5 py-1.5"
      style={{
        borderColor: 'var(--rule)',
        background: 'rgba(255,255,255,0.02)',
        minWidth: 78,
      }}
    >
      <div
        className="mono text-[8.5px] tracking-[0.22em] uppercase"
        style={{ color: 'var(--fg-dim)' }}
      >
        {stat.label}
      </div>
      <motion.div
        key={valueKey}
        className="mono mt-0.5 tabular text-[14px]"
        style={{ color: stat.color ?? accent }}
        initial={{
          backgroundColor: `${stat.color ?? accent}33`,
          paddingLeft: 4,
          paddingRight: 4,
          marginLeft: -4,
          marginRight: -4,
          borderRadius: 2,
        }}
        animate={{
          backgroundColor: 'rgba(0,0,0,0)',
          paddingLeft: 0,
          paddingRight: 0,
          marginLeft: 0,
          marginRight: 0,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {stat.value}
      </motion.div>
    </div>
  )
}

/** Small mono pill used as the `phase` slot. Renders "X / Y · label". */
export function PhaseChip({
  current,
  total,
  label,
  accent,
}: {
  current: number
  total: number
  label?: string
  accent: string
}) {
  const key = `${current}-${total}-${label ?? ''}`
  return (
    <motion.div
      key={key}
      className="mono inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider"
      style={{
        borderColor: accent,
        color: accent,
        background: `${accent}15`,
      }}
      initial={{ scale: 1.06, backgroundColor: `${accent}33` }}
      animate={{ scale: 1, backgroundColor: `${accent}15` }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <span className="tabular">
        {current} / {total}
      </span>
      {label && (
        <>
          <span className="opacity-50">·</span>
          <span>{label}</span>
        </>
      )}
    </motion.div>
  )
}
