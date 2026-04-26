'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PromptProvider, usePrompt, MAX_LEN } from './promptContext'
import { ModelMap3D, type ModelPart } from './modelmap'
import { STAGE_VARIANTS, KIND_TIMING, incomingKindFor } from './transitions'
import { SpeedContext } from './speedContext'

/**
 * Where the 2D detail panel for this scene lives.
 * - 'right-rail' (default): docked in the right ~30% rail next to the 3D stage.
 * - 'fullscreen': covers the whole stage (for content-dense scenes); 3D dims.
 * - 'hidden': scene is pure 3D, no 2D panel.
 * - block/output anchors are reserved for Phase 4 (Html-anchored callouts).
 */
export type PanelAnchor =
  | 'right-rail'
  | 'fullscreen'
  | 'hidden'
  | 'block0'
  | 'block0.attn'
  | 'output'

export interface MovieScene {
  id: string
  kicker: string
  title: string
  caption: string
  accent: string
  durationMs: number
  render: () => React.ReactNode
  section?: string
  subGroup?: { label: string; index: number; total: number; color?: string }
  promptAware?: boolean
  part?: ModelPart
  /** Optional deeper explanation. Shown in a side inspector when the user opens it. */
  details?: string
  /** Where the 2D detail panel renders. Defaults to 'right-rail'. */
  panelAnchor?: PanelAnchor
  /**
   * Spatial breadcrumb shown over the 3D stage as "you are here" context.
   * If absent, derived from `section` and (when present) `subGroup.label`.
   * Example: ['Block 0', 'Attention', 'Multi-head'].
   */
  breadcrumb?: string[]
  /**
   * Whether the persistent token strip should be visible for this scene.
   * Defaults to true for forward-pass acts (Prologue/Input/Inside-block/Stack/Output)
   * and false for training/modern. Override per-scene if needed.
   */
  showTokenStrip?: boolean
}

interface Props {
  scenes: MovieScene[]
}

const ACCENT_BLUE = '#60a5fa'

export function MovieOrchestrator(props: Props) {
  return (
    <PromptProvider>
      <Inner {...props} />
    </PromptProvider>
  )
}

function Inner({ scenes }: Props) {
  const [idx, setIdx] = useState(0)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [finished, setFinished] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sceneListOpen, setSceneListOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const tickRef = useRef<number | null>(null)
  const { prompt, setPrompt } = usePrompt()

  const safeIdx = scenes.length > 0 ? Math.min(Math.max(0, idx), scenes.length - 1) : 0
  const current = scenes[safeIdx]
  const currentDurationMs = current?.durationMs ?? 0
  const currentId = current?.id
  const incomingKind = currentId ? incomingKindFor(currentId) : 'within-part' as const
  const isActChange = incomingKind === 'act-change'

  // Banner visibility: shown for ~2.5s at the start of every act-change
  // scene. Banner overlays the scene; the scene plays normally underneath.
  // No clock-pause — that was stealing playback time and causing scenes to
  // appear cut short.
  const actHeld = false
  const [actBannerVisible, setActBannerVisible] = useState(false)
  useEffect(() => {
    if (isActChange) {
      setActBannerVisible(true)
      const bannerTimer = setTimeout(() => setActBannerVisible(false), 2500)
      return () => clearTimeout(bannerTimer)
    } else {
      setActBannerVisible(false)
    }
  }, [currentId, isActChange])

  const anyPopoverOpen = settingsOpen || sceneListOpen || inspectorOpen
  useEffect(() => {
    if (!playing || finished || !current || anyPopoverOpen || actHeld) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) * speed
      last = now
      setElapsed((prev) => Math.min(prev + dt, currentDurationMs))
      tickRef.current = requestAnimationFrame(tick)
    }
    tickRef.current = requestAnimationFrame(tick)
    return () => {
      if (tickRef.current !== null) cancelAnimationFrame(tickRef.current)
    }
  }, [playing, speed, currentDurationMs, finished, current, anyPopoverOpen, actHeld])

  // Boundary watcher with double-fire guard. Without the ref guard, in some
  // re-render orderings React can fire this effect with elapsed >= duration
  // for the OLD scene before the elapsed=0 reset settles, advancing twice and
  // skipping a scene. The ref records the id we last advanced FROM so we
  // never advance from the same scene twice in a row.
  const lastAdvancedFromRef = useRef<string | null>(null)
  useEffect(() => {
    if (finished || !current) return
    if (anyPopoverOpen || actHeld) return
    if (elapsed < currentDurationMs) return
    if (lastAdvancedFromRef.current === current.id) return
    lastAdvancedFromRef.current = current.id
    if (safeIdx === scenes.length - 1) {
      setFinished(true)
      setPlaying(false)
    } else {
      setIdx(safeIdx + 1)
      setElapsed(0)
      setCycle((c) => c + 1)
    }
  }, [elapsed, currentDurationMs, safeIdx, scenes.length, finished, current, anyPopoverOpen, actHeld])

  // Close popovers on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSettingsOpen(false)
        setSceneListOpen(false)
        setInspectorOpen(false)
      }
      if (e.key === 'i' || e.key === 'I') {
        setInspectorOpen((v) => !v)
      }
      if (e.key === ' ') {
        e.preventDefault()
        if (!started) {
          begin()
        } else {
          setPlaying((p) => !p)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started])

  if (!current) return null
  const total = scenes.reduce((a, s) => a + s.durationMs, 0)
  const scenesBeforeMs = scenes.slice(0, safeIdx).reduce((a, s) => a + s.durationMs, 0)
  const cumulative = scenesBeforeMs + elapsed
  const isLastScene = safeIdx === scenes.length - 1
  const sceneProgress = Math.min(1, elapsed / current.durationMs)

  const incomingTiming = KIND_TIMING[incomingKind]

  // Phase 1 spatial framework: panel anchor, breadcrumb, token-strip visibility.
  // All three default by-section so existing scenes work without per-scene wiring.
  const panelAnchor: PanelAnchor = current.panelAnchor ?? 'right-rail'
  const crumbs = deriveBreadcrumb(current)
  const tokenStripVisible = current.showTokenStrip ?? defaultTokenStripVisible(current)

  function jump(to: number) {
    lastAdvancedFromRef.current = null
    setIdx(to)
    setElapsed(0)
    setCycle((c) => c + 1)
    setFinished(false)
    setPlaying(true)
    setStarted(true)
    setSceneListOpen(false)
  }

  function restart() {
    lastAdvancedFromRef.current = null
    setIdx(0)
    setElapsed(0)
    setCycle((c) => c + 1)
    setFinished(false)
    setPlaying(true)
    setStarted(true)
  }

  function begin() {
    setStarted(true)
    setPlaying(true)
    // Force the current scene to remount so its animations start fresh
    // when the user actually presses Play (otherwise they fire while the
    // splash is still covering the canvas).
    setElapsed(0)
    setCycle((c) => c + 1)
  }

  return (
    <SpeedContext.Provider value={speed}>
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      {/* Header — single row, compact */}
      <header className="relative z-20 flex h-12 shrink-0 items-center gap-4 border-b border-[var(--rule)] px-4">
        <button
          type="button"
          onClick={() => {
            lastAdvancedFromRef.current = null
            setIdx(0)
            setElapsed(0)
            setCycle((c) => c + 1)
            setFinished(false)
            setPlaying(false)
            setStarted(false)
          }}
          className="mono shrink-0 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
          title="Back to start"
        >
          transformer.live
        </button>

        {/* Section · title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.25 }}
            className="flex min-w-0 flex-1 items-baseline justify-center gap-3 truncate"
          >
            {current.section && (
              <span
                className="small-caps shrink-0 text-[10px]"
                style={{ color: current.accent, opacity: 0.85 }}
              >
                {current.section}
              </span>
            )}
            <span
              className="display truncate text-[18px] leading-none md:text-[20px]"
              style={{ color: current.accent }}
            >
              {current.title}
            </span>
            <span className="small-caps shrink-0 text-[10px] text-[var(--fg-dim)]">
              {current.kicker}
              {current.subGroup && (
                <span
                  className="ml-1 tabular"
                  style={{ color: current.subGroup.color || current.accent }}
                >
                  · {current.subGroup.label} ({current.subGroup.index}/{current.subGroup.total})
                </span>
              )}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Scene jump button */}
        <button
          type="button"
          onClick={() => {
            setSceneListOpen((v) => !v)
            setSettingsOpen(false)
          }}
          className="mono shrink-0 rounded-[2px] border border-[var(--rule-strong)] px-2.5 py-1 text-[11px] text-[var(--fg-muted)] tabular hover:border-[var(--accent)] hover:text-[var(--fg)]"
          title="Jump to scene"
        >
          {String(safeIdx + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')} ▾
        </button>

        {/* Info / inspector toggle */}
        <button
          type="button"
          onClick={() => {
            setInspectorOpen((v) => !v)
            setSettingsOpen(false)
            setSceneListOpen(false)
          }}
          disabled={!current.details}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
            inspectorOpen
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]'
          }`}
          aria-label="Scene details"
          title={current.details ? 'Scene details (i)' : 'No details for this scene'}
        >
          ⓘ
        </button>

        {/* Settings gear */}
        <button
          type="button"
          onClick={() => {
            setSettingsOpen((v) => !v)
            setSceneListOpen(false)
            setInspectorOpen(false)
          }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] leading-none transition-colors ${
            settingsOpen
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]'
          }`}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </button>
      </header>

      {/* Settings popover */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-3 top-14 z-30 w-[260px] rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-3 shadow-2xl"
          >
            <div className="space-y-3 mono text-[11px]">
              <div>
                <div className="mb-1.5 small-caps text-[10px] text-[var(--fg-dim)]">playback speed</div>
                <div className="flex items-center gap-1">
                  {[0.5, 1, 1.5, 2, 3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`flex-1 rounded-[2px] border px-2 py-1 tabular ${
                        speed === s
                          ? 'border-[var(--accent)] bg-[rgba(96,165,250,0.18)] text-[var(--accent)]'
                          : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="small-caps text-[10px] text-[var(--fg-dim)]">prompt</span>
                  {current.promptAware ? (
                    <span className="flex items-center gap-1 text-[9px] text-[var(--accent-mint)]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />
                      live this scene
                    </span>
                  ) : (
                    <span className="text-[9px] text-[var(--fg-dim)]">not live</span>
                  )}
                </div>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={MAX_LEN}
                  placeholder="To be, or no"
                  className="w-full rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg)] px-2 py-1.5 text-[var(--fg)] outline-none placeholder:text-[var(--fg-dim)] focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2 border-t border-[var(--rule)] pt-2">
                <button
                  type="button"
                  onClick={restart}
                  className="flex-1 rounded-[2px] border border-[var(--rule-strong)] px-2 py-1 text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
                >
                  ↺ restart
                </button>
                <span className="text-[9px] text-[var(--fg-dim)]">space = play/pause · esc = close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene list popover */}
      <AnimatePresence>
        {sceneListOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-1/2 top-14 z-30 max-h-[70vh] w-[380px] -translate-x-1/2 overflow-auto rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-2 shadow-2xl"
          >
            <div className="small-caps px-2 py-1.5 text-[10px] text-[var(--fg-dim)]">jump to scene</div>
            <div className="space-y-0.5">
              {scenes.map((s, i) => {
                const isCurrent = i === safeIdx
                const prevSection = i > 0 ? scenes[i - 1].section : undefined
                const showSection = s.section && s.section !== prevSection
                return (
                  <div key={s.id}>
                    {showSection && (
                      <div
                        className="mt-2 px-2 pb-0.5 small-caps text-[9px]"
                        style={{ color: s.accent, opacity: 0.7 }}
                      >
                        {s.section}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      className={`flex w-full items-baseline gap-2 rounded-[2px] px-2 py-1.5 text-left transition-colors ${
                        isCurrent
                          ? 'bg-[rgba(96,165,250,0.12)]'
                          : 'hover:bg-[rgba(255,255,255,0.04)]'
                      }`}
                    >
                      <span
                        className="mono shrink-0 w-7 text-[10px] tabular"
                        style={{ color: isCurrent ? s.accent : 'var(--fg-dim)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="display shrink-0 text-[13px] leading-tight"
                        style={{ color: isCurrent ? s.accent : 'var(--fg)' }}
                      >
                        {s.title}
                      </span>
                      <span className="ml-auto mono shrink-0 text-[9px] text-[var(--fg-dim)] tabular">
                        {formatMs(s.durationMs)}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage row — 3D leads (flex-1), 2D detail rail at ~32% on the right.
          Phase 1 default. Scenes can opt into 'fullscreen' to overlay the
          stage with their 2D panel (e.g. cold open) or 'hidden' to go pure 3D. */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 3D stage — visible whenever the 2D panel isn't fullscreen */}
        {panelAnchor !== 'fullscreen' && (
          <div className="relative flex-1 overflow-hidden">
            <ModelMap3D
              part={current.part}
              sceneId={current.id}
              accent={current.accent}
              duration={current.durationMs}
              playing={playing && !anyPopoverOpen && !finished && !actHeld}
            />

            {/* Persistent breadcrumb — top-left "you are here". */}
            {started && <BreadcrumbOverlay crumbs={crumbs} accent={current.accent} />}

            {/* Persistent token strip — top-center, forward-pass acts only. */}
            {started && tokenStripVisible && (
              <TokenStripOverlay prompt={prompt} accent={current.accent} />
            )}
          </div>
        )}

        {/* 2D detail rail — right ~32% by default; absolute overlay when fullscreen. */}
        {panelAnchor !== 'hidden' && (
          <div
            className={
              panelAnchor === 'fullscreen'
                ? 'absolute inset-0 z-10'
                : 'relative shrink-0 border-l border-[var(--rule)] bg-[var(--bg)]'
            }
            style={
              panelAnchor === 'fullscreen'
                ? undefined
                : { width: 'clamp(380px, 32%, 540px)' }
            }
          >
            <div className="relative h-full overflow-hidden">
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={`${current.id}-${cycle}`}
                  variants={STAGE_VARIANTS[incomingKind]}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: incomingTiming.duration, ease: incomingTiming.easing }}
                  className="absolute inset-0 flex items-center justify-center px-4 py-3"
                >
                  <div className="h-full w-full max-w-[1400px]">
                    {current.render()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Inspector panel — slides in from the right edge of the rail */}
            <AnimatePresence>
              {inspectorOpen && current.details && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-y-0 right-0 z-20 w-full overflow-y-auto border-l bg-[var(--bg-elevated)] px-5 py-4 shadow-2xl"
                  style={{ borderLeftColor: current.accent }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="small-caps text-[10px]"
                        style={{ color: current.accent, opacity: 0.8 }}
                      >
                        {current.kicker} · details
                      </div>
                      <div
                        className="display mt-0.5 text-[18px] leading-tight"
                        style={{ color: current.accent }}
                      >
                        {current.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectorOpen(false)}
                      className="shrink-0 rounded-full border border-[var(--rule-strong)] px-2 py-0.5 mono text-[10px] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
                      title="Close (i or esc)"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="whitespace-pre-line text-[13px] leading-6 text-[var(--fg-muted)]">
                    {current.details}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Act-change banner — center-stage announcement, ~2.5s. Overlays the
            whole row so it's centered across both 3D and 2D panes. */}
        <AnimatePresence>
          {isActChange && actBannerVisible && current.section && (
            <motion.div
              key={`act-banner-${current.id}`}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -6 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            >
              <div
                className="rounded-[4px] border-2 bg-[rgba(7,7,9,0.92)] px-12 py-7 text-center shadow-2xl backdrop-blur-lg"
                style={{ borderColor: current.accent }}
              >
                <div
                  className="small-caps text-[12px] opacity-75 tracking-widest"
                  style={{ color: current.accent }}
                >
                  entering
                </div>
                <div
                  className="display mt-2 text-[32px]"
                  style={{ color: current.accent }}
                >
                  {current.section}
                </div>
                <div className="mt-2 h-px w-12 mx-auto" style={{ background: current.accent, opacity: 0.5 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End-card — overlays whole row */}
        <AnimatePresence>
          {finished && isLastScene && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            >
              <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-[3px] border border-[var(--rule-strong)] bg-[rgba(7,7,9,0.85)] px-6 py-5 backdrop-blur-md">
                <div className="small-caps text-[var(--fg-dim)]">end of the tour</div>
                <div className="display text-[22px] text-[var(--fg)]">that&apos;s the whole machine.</div>
                <div className="flex items-center gap-2 mono text-[11px]">
                  <button
                    type="button"
                    onClick={restart}
                    className="rounded-full border border-[var(--accent)] bg-[rgba(96,165,250,0.1)] px-4 py-1.5 text-[var(--accent)] hover:bg-[rgba(96,165,250,0.2)]"
                  >
                    ↺ replay
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Press-play splash — shown on first load until user clicks play */}
        <AnimatePresence>
          {!started && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[rgba(7,7,9,0.94)] backdrop-blur-md"
            >
              <div
                className="small-caps text-[11px] tracking-[0.25em]"
                style={{ color: ACCENT_BLUE }}
              >
                transformer.live
              </div>
              <div className="display mt-5 max-w-[900px] px-6 text-center text-[clamp(40px,6.5vw,76px)] leading-[1.05] text-[var(--fg)]">
                Watch a transformer think.
              </div>
              <p className="mt-5 max-w-[560px] px-6 text-center text-[14px] leading-7 text-[var(--fg-muted)]">
                A char-level GPT trained on Shakespeare, end-to-end. From prompt to next token — every layer, every head. About 10 minutes.
              </p>
              <button
                type="button"
                onClick={begin}
                className="group mt-10 flex items-center gap-3 rounded-full border bg-[rgba(96,165,250,0.1)] px-9 py-4 transition-colors hover:bg-[rgba(96,165,250,0.22)]"
                style={{ borderColor: ACCENT_BLUE, color: ACCENT_BLUE }}
              >
                <span className="text-[14px] leading-none">▶</span>
                <span className="display text-[18px] leading-none">Play</span>
              </button>
              <div className="mt-8 mono text-[10px] tracking-wider text-[var(--fg-dim)]">
                space = play/pause · i = scene details · esc = close popovers
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom dock: caption + timeline. Fixed height, always visible. */}
      <div className="relative z-10 shrink-0 border-t border-[var(--rule)] bg-[var(--bg-elevated)]">
        {/* Caption line */}
        <div className="border-b border-[var(--rule)] px-4 py-1.5">
          <AnimatePresence mode="wait">
            <motion.p
              key={current.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.25 }}
              className="truncate text-center text-[13px] leading-tight text-[var(--fg-muted)]"
            >
              {current.caption}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Transport + timeline */}
        <div className="flex items-center gap-3 px-4 py-2">
          <button
            type="button"
            onClick={() => {
              if (!started) {
                begin()
              } else {
                setPlaying((p) => !p)
              }
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--rule-strong)] text-[11px] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
            title="Play/pause (space)"
          >
            {playing ? '❚❚' : '▶'}
          </button>

          <button
            type="button"
            onClick={() => jump(Math.max(0, safeIdx - 1))}
            disabled={safeIdx === 0}
            className="mono shrink-0 rounded-[2px] border border-[var(--rule-strong)] px-1.5 py-0.5 text-[10px] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)] disabled:opacity-30 disabled:hover:border-[var(--rule-strong)] disabled:hover:text-[var(--fg-muted)]"
            title="Previous scene"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => jump(Math.min(scenes.length - 1, safeIdx + 1))}
            disabled={safeIdx === scenes.length - 1}
            className="mono shrink-0 rounded-[2px] border border-[var(--rule-strong)] px-1.5 py-0.5 text-[10px] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)] disabled:opacity-30 disabled:hover:border-[var(--rule-strong)] disabled:hover:text-[var(--fg-muted)]"
            title="Next scene"
          >
            ▶
          </button>

          {/* Segmented progress bar */}
          <div className="relative flex h-2 flex-1 items-center gap-[1px]">
            {scenes.map((s, i) => {
              const flex = s.durationMs / total
              const fillPct = i < safeIdx ? 1 : i === safeIdx ? sceneProgress : 0
              const isCurrent = i === safeIdx
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jump(i)}
                  className="group relative h-full cursor-pointer"
                  style={{ flex }}
                >
                  {/* Fill bar (clipped) */}
                  <div className="absolute inset-0 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
                    <div
                      className="h-full transition-[width] duration-100"
                      style={{
                        width: `${fillPct * 100}%`,
                        background: s.accent,
                        opacity: isCurrent ? 1 : 0.55,
                      }}
                    />
                  </div>

                  {/* Hover highlight ring (not clipped) */}
                  <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 ring-1 ring-inset ring-white/30 transition-opacity duration-150 group-hover:opacity-100" />

                  {/* Current-scene playhead dot */}
                  {isCurrent && (
                    <motion.div
                      layoutId="scene-head"
                      className="pointer-events-none absolute -top-[3px] h-2 w-2 rounded-full"
                      style={{
                        background: s.accent,
                        left: `${fillPct * 100}%`,
                        transform: 'translateX(-50%)',
                        boxShadow: `0 0 10px ${s.accent}`,
                      }}
                    />
                  )}

                  {/* Tooltip (not clipped — opens upward) */}
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-3 w-max max-w-[240px] -translate-x-1/2 rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-left opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className="mono text-[10px] tabular"
                        style={{ color: s.accent }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="small-caps text-[9px] text-[var(--fg-dim)]">
                        {s.kicker}
                      </span>
                    </div>
                    <div
                      className="display mt-0.5 text-[13px] leading-tight"
                      style={{ color: s.accent }}
                    >
                      {s.title}
                    </div>
                    {s.section && (
                      <div
                        className="mt-0.5 small-caps text-[9px]"
                        style={{ color: s.accent, opacity: 0.6 }}
                      >
                        {s.section}
                        {s.subGroup && (
                          <span className="ml-1 mono tabular opacity-70">
                            · {s.subGroup.label} ({s.subGroup.index}/{s.subGroup.total})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-1 mono text-[9px] text-[var(--fg-dim)] tabular">
                      {formatMs(s.durationMs)}
                    </div>
                    {/* Arrow pointing down to segment */}
                    <div
                      className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[var(--rule-strong)] bg-[var(--bg-elevated)]"
                      style={{ marginTop: -4 }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <span className="shrink-0 mono tabular text-[10px] text-[var(--fg-muted)]">
            {formatMs(cumulative)} / {formatMs(total)}
          </span>
        </div>
      </div>
    </div>
    </SpeedContext.Provider>
  )
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

// ────────────────────────────────────────────────────────────────────────
// Phase 1 spatial framework helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Strip the "Act I · " prefix from section labels so the breadcrumb reads
 * "Input" rather than "Act I · Input". Sections without the separator pass
 * through unchanged.
 */
function trimActPrefix(section: string | undefined): string {
  if (!section) return ''
  const idx = section.indexOf('·')
  return idx >= 0 ? section.slice(idx + 1).trim() : section
}

function deriveBreadcrumb(scene: MovieScene): string[] {
  if (scene.breadcrumb && scene.breadcrumb.length > 0) return scene.breadcrumb
  const root = trimActPrefix(scene.section)
  const tail = scene.subGroup?.label
  return tail ? [root, tail] : [root]
}

const FORWARD_PASS_SECTIONS = new Set([
  'Prologue',
  'Act I · Input',
  'Act II · Inside a Block',
  'Act III · The Full Stack',
  'Act VI · The Output',
])

function defaultTokenStripVisible(scene: MovieScene): boolean {
  if (!scene.section) return false
  return FORWARD_PASS_SECTIONS.has(scene.section)
}

function BreadcrumbOverlay({
  crumbs,
  accent,
}: {
  crumbs: string[]
  accent: string
}) {
  if (crumbs.length === 0) return null
  return (
    <div className="pointer-events-none absolute left-4 top-3 z-10 flex items-baseline gap-1.5 text-[12px]">
      <span className="mono text-[10px] tracking-wider text-[var(--fg-dim)]">
        transformer
      </span>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-baseline gap-1.5">
            <span className="mono text-[10px] text-[var(--fg-dim)]">›</span>
            <span
              className="small-caps tracking-wide"
              style={{
                color: isLast ? accent : 'var(--fg-muted)',
                opacity: isLast ? 0.95 : 0.7,
              }}
            >
              {c}
            </span>
          </span>
        )
      })}
    </div>
  )
}

const TOKEN_STRIP_MAX = 36

function TokenStripOverlay({
  prompt,
  accent,
}: {
  prompt: string
  accent: string
}) {
  // Char-level model: each character is one token. Trim to context length.
  const chars = (prompt || '').slice(0, TOKEN_STRIP_MAX).split('')
  if (chars.length === 0) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
      <div className="flex items-center gap-[3px] rounded-[3px] border border-[var(--rule)] bg-[rgba(7,7,9,0.6)] px-2 py-1.5 backdrop-blur-sm">
        <div className="mono mr-2 text-[9px] tracking-widest text-[var(--fg-dim)]">
          tokens
        </div>
        {chars.map((ch, i) => (
          <div
            key={i}
            className="mono flex h-5 min-w-[14px] items-center justify-center rounded-[2px] border px-1 text-[10px] leading-none"
            style={{
              borderColor: 'rgba(255,255,255,0.12)',
              color: 'var(--fg-muted)',
              background: 'rgba(255,255,255,0.02)',
            }}
            title={`token ${i}`}
          >
            {ch === ' ' ? '·' : ch}
          </div>
        ))}
        <div
          className="mono ml-2 tabular text-[9px] text-[var(--fg-dim)]"
          style={{ color: chars.length === TOKEN_STRIP_MAX ? accent : undefined }}
        >
          {chars.length}
        </div>
      </div>
    </div>
  )
}
