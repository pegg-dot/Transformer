'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PromptProvider, usePrompt, MAX_LEN } from './promptContext'
import { ModelMap3D, type ModelPart } from './modelmap'
import { STAGE_VARIANTS, KIND_TIMING, incomingKindFor } from './transitions'
import { SpeedContext, PlayingContext, usePlaying } from './speedContext'
import { useActivations } from '@/lib/useActivations'
import { useTransformer } from '@/lib/useTransformer'

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
  /** Render the 2D panel as a floating glass card in 3D world-space via
   *  drei's <Html>. Right rail is hidden. Position via `worldPanelPos`. */
  | 'world'

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
  /**
   * Index of the prompt token this scene focuses on (e.g. 3 = the "b" of
   * "To be, or no"). When set, the persistent token strip glows that cell
   * so the viewer knows which token's vector the scene is talking about.
   */
  focusedToken?: number
  /**
   * Make the 2D detail rail wider for content-heavy scenes (matrix grids,
   * multi-phase walkthroughs, anything that looks cramped at the default
   * width). When true, the rail goes from ~45% to ~58%.
   */
  wide?: boolean
  /**
   * For panelAnchor='world': position in 3D world space where the panel's
   * floating glass card anchors. Default: [0, 1.5, 0] (above the model).
   */
  worldPanelPos?: [number, number, number]
  /**
   * Connective narrator text shown briefly during the transition INTO this
   * scene. Bridges the previous scene's idea to this one so Act I reads as
   * a continuous explanation rather than a list of topics.
   * Example: "Now: each ID looks up a vector in a giant table…"
   */
  bridgeIn?: string
}

interface Props {
  scenes: MovieScene[]
}

const ACCENT_BLUE = '#60a5fa'

// Short description per section, shown in the chapter-rail tooltip on hover.
// Hand-curated so the tooltip reads as "what's in this chapter" rather than
// a list of kickers.
const CHAPTER_DESC: Record<string, string> = {
  Prologue: 'The setup',
  'Act I · Input': 'Tokenization · Embeddings · Position',
  'Act II · Inside a Block': 'LayerNorm · Attention · FFN',
  'Act III · The Full Stack': 'Residual stack · Sampling · KV cache',
  'Act IV · Training': 'Loss · Backprop · Gradient descent',
  'Act V · Modern Upgrades': 'RoPE · RMSNorm · SwiGLU · GQA',
  'Act VI · The Output': 'Generation loop',
}

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
  const stageRef = useRef<HTMLDivElement | null>(null)
  const { prompt, setPrompt } = usePrompt()

  // Pre-warm the heavy loaders so by the time the user clicks Play the
  // VectorGrids show real residuals and the cold-open chat shows real
  // model output. Status is surfaced in a tiny bottom-right pill.
  const { data: actData, loading: actLoading } = useActivations()
  const { ready: modelReady, loading: modelLoading } = useTransformer()

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

  // Chapter index for the bottom rail. One chapter per `section`, with a
  // hand-curated short description so the hover tooltip can read clean
  // ("Tokenization · Embeddings · Position") rather than a list of every
  // scene's kicker. Computed from the live scenes array so adding/reordering
  // scenes Just Works.
  const chapters = useMemo(() => {
    type Chapter = {
      section: string
      label: string
      desc: string
      startIdx: number
      endIdx: number
      startMs: number
      endMs: number
      accent: string
    }
    const out: Chapter[] = []
    let acc = 0
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i]
      const sectionKey = s.section ?? 'Scenes'
      const last = out[out.length - 1]
      if (!last || last.section !== sectionKey) {
        out.push({
          section: sectionKey,
          label: trimActPrefix(sectionKey).toUpperCase(),
          desc: '',
          startIdx: i,
          endIdx: i,
          startMs: acc,
          endMs: acc + s.durationMs,
          accent: s.accent,
        })
      } else {
        last.endIdx = i
        last.endMs = acc + s.durationMs
      }
      acc += s.durationMs
    }
    for (const c of out) c.desc = CHAPTER_DESC[c.section] ?? ''
    return out
  }, [scenes])
  const grandTotal = useMemo(
    () => scenes.reduce((a, s) => a + s.durationMs, 0),
    [scenes],
  )

  // Per-scene boundary fractions (0..1 of the whole tour). Chapter dividers
  // are a subset of these, so we tag each so the rail can render chapter
  // ticks always-visible and scene-only ticks only on hover.
  const sceneBoundaries = useMemo(() => {
    const out: { frac: number; isChapterStart: boolean }[] = []
    if (grandTotal <= 0) return out
    let acc = 0
    for (let i = 1; i < scenes.length; i++) {
      acc += scenes[i - 1].durationMs
      const isChapterStart =
        !!scenes[i].section && scenes[i].section !== scenes[i - 1].section
      out.push({ frac: acc / grandTotal, isChapterStart })
    }
    return out
  }, [scenes, grandTotal])

  // Seek by absolute fraction of the whole tour. Used by chapter-region
  // clicks: the user clicks somewhere inside a chapter, we map that local
  // position to an absolute ms, then jump to the scene that contains it.
  function seekToFraction(frac: number) {
    const targetMs = Math.max(0, Math.min(1, frac)) * grandTotal
    let acc = 0
    for (let i = 0; i < scenes.length; i++) {
      acc += scenes[i].durationMs
      if (targetMs <= acc) {
        jump(i)
        return
      }
    }
    jump(scenes.length - 1)
  }

  // Effective play state — the single boolean every animation should respect.
  // True only when the user has actually pressed play AND nothing is gating
  // the clock (popovers, end-card, act banner hold). Mirrors the gate used by
  // the elapsed-clock RAF and the 3D stage's `playing` prop.
  const effectivelyPlaying =
    started && playing && !anyPopoverOpen && !finished && !actHeld

  // Sweep all WAAPI + CSS animations under the stage and pause/resume them in
  // lock-step with `effectivelyPlaying`. This catches the long tail of scene-
  // internal `repeat: Infinity` motion-divs that don't read PlayingContext
  // directly (179+ across acts), plus any CSS @keyframes. Re-runs on scene
  // change so animations spawned by the new scene get gated too.
  useEffect(() => {
    const root = stageRef.current
    if (!root || typeof (root as Element).getAnimations !== 'function') return
    let cancelled = false
    const apply = () => {
      if (cancelled) return
      const anims = root.getAnimations({ subtree: true })
      for (const a of anims) {
        // Skip animations on elements that opted out via
        // `data-always-animate="true"` — used for chrome like the press-play
        // splash whose enter/exit animations must complete regardless of
        // the global play state.
        const target = (a.effect as KeyframeEffect | null)?.target as Element | null
        if (target?.closest?.('[data-always-animate="true"]')) continue
        if (effectivelyPlaying) {
          if (a.playState === 'paused') a.play()
        } else {
          if (a.playState === 'running') a.pause()
        }
      }
    }
    apply()
    // Catch animations created on the same frame (framer-motion + react render
    // order) — re-sweep on the next two frames.
    const r1 = requestAnimationFrame(apply)
    const r2 = requestAnimationFrame(() => requestAnimationFrame(apply))
    return () => {
      cancelled = true
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
  }, [effectivelyPlaying, currentId, cycle])

  return (
    <SpeedContext.Provider value={speed}>
    <PlayingContext.Provider value={effectivelyPlaying}>
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
      <div ref={stageRef} className="relative flex flex-1 overflow-hidden">
        {/* 3D stage — visible whenever the 2D panel isn't fullscreen */}
        {panelAnchor !== 'fullscreen' && (
          <div className="relative flex-1 overflow-hidden">
            <ModelMap3D
              part={current.part}
              sceneId={current.id}
              accent={current.accent}
              duration={current.durationMs}
              playing={playing && !anyPopoverOpen && !finished && !actHeld}
              worldPanel={
                panelAnchor === 'world' && started
                  ? {
                      node: current.render(),
                      pos: current.worldPanelPos ?? [0, 1.5, 0],
                    }
                  : undefined
              }
            />

            {/* Persistent breadcrumb — top-left "you are here". */}
            {started && <BreadcrumbOverlay crumbs={crumbs} accent={current.accent} />}
          </div>
        )}

        {/* 2D detail rail — right ~32% by default; absolute overlay when
            fullscreen; absent when 'world' (panel renders in-canvas via Html). */}
        {panelAnchor !== 'hidden' && panelAnchor !== 'world' && (
          <div
            className={
              panelAnchor === 'fullscreen'
                ? 'absolute inset-0 z-10'
                : 'relative shrink-0 border-l border-[var(--rule)] bg-[var(--bg)]'
            }
            style={
              panelAnchor === 'fullscreen'
                ? undefined
                : current.wide
                  ? { width: 'clamp(580px, 58%, 880px)' }
                  : { width: 'clamp(500px, 45%, 760px)' }
            }
          >
            <div className="relative h-full overflow-hidden">
              {/* Scene only mounts after the user presses Play. Without this
                  gate, scenes with delay-based framer-motion (e.g. the
                  cold open's typed-prompt + chat sequence) would start
                  running their animations behind the splash and could
                  leak into the page on first paint. */}
              <AnimatePresence mode="sync" initial={false}>
                {started && (
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
                )}
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

        {/* Persistent token strip — top-center, forward-pass acts only.
            Lifted to the stage-row level (above both 3D stage and the 2D
            fullscreen panel) so the strip stays visible across scene swaps
            in Act I and provides a stable reference the eye can track
            during transitions. Lights up the focused token cell when a
            scene declares one. */}
        {started && tokenStripVisible && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <TokenStripOverlay
              prompt={prompt}
              accent={current.accent}
              focusedToken={current.focusedToken}
            />
          </div>
        )}

        {/* Bridge narrator — connective text shown briefly at the start of
            scenes that declare a `bridgeIn`. Bridges the prior scene's idea
            to this one so an act reads as a continuous explanation rather
            than discrete topics. Skipped on act-change scenes (the act
            banner does that job). */}
        {started && current.bridgeIn && !isActChange && (
          <BridgeNarrator
            text={current.bridgeIn}
            accent={current.accent}
            sceneKey={`${current.id}-${cycle}`}
          />
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

        {/* End-card — overlays whole row. Now an interactive outro:
            change the prompt, replay the whole tour with it. */}
        <AnimatePresence>
          {finished && isLastScene && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[rgba(7,7,9,0.7)] backdrop-blur-md"
            >
              <div className="pointer-events-auto flex w-[min(560px,90%)] flex-col items-center gap-5 rounded-[6px] border-2 border-[var(--rule-strong)] bg-[rgba(7,7,9,0.92)] px-8 py-7 shadow-2xl">
                <div
                  className="small-caps text-[10px] tracking-[0.28em]"
                  style={{ color: ACCENT_BLUE }}
                >
                  end of the tour
                </div>
                <div className="display text-center text-[26px] leading-tight text-[var(--fg)]">
                  that&apos;s the whole machine.
                </div>
                <div className="text-center text-[13px] leading-6 text-[var(--fg-muted)]">
                  Now try your own prompt — type anything below and watch
                  the whole tour run again with your text.
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    restart()
                  }}
                  className="flex w-full items-center gap-2"
                >
                  <div
                    className="mono shrink-0 text-[10px] tracking-wider text-[var(--fg-dim)]"
                  >
                    prompt
                  </div>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={MAX_LEN}
                    placeholder="To be, or no"
                    autoFocus
                    className="mono flex-1 rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-dim)] focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    className="display shrink-0 rounded-[3px] border-2 px-4 py-2 text-[13px] leading-none transition-colors"
                    style={{
                      borderColor: ACCENT_BLUE,
                      color: ACCENT_BLUE,
                      background: 'rgba(96,165,250,0.12)',
                    }}
                  >
                    ▶ run again
                  </button>
                </form>

                <div className="flex items-center gap-2 mono text-[10px] tracking-wider text-[var(--fg-dim)]">
                  <span>{`${prompt.length} / ${MAX_LEN} chars`}</span>
                  <span className="opacity-60">·</span>
                  <span>char-level model · any printable text</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Asset-load status pill — bottom-right, only when something is
            still loading or after a brief "ready" moment. Tells the viewer
            whether VectorGrids show real activations and the chat shows
            real model output. */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col items-end gap-1">
          <StatusPill
            label="activations"
            state={actData ? 'ready' : actLoading ? 'loading' : 'idle'}
          />
          <StatusPill
            label="model"
            state={modelReady ? 'ready' : modelLoading ? 'loading' : 'idle'}
          />
        </div>

        {/* Press-play splash — shown on first load until user clicks play.
            data-always-animate excludes it from the global pause-all-
            animations sweep so its enter/exit fades aren't frozen at
            opacity ~0 when the player is paused (which it always is on
            first load). */}
        <AnimatePresence>
          {!started && (
            <motion.div
              data-always-animate="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[rgba(7,7,9,0.985)] backdrop-blur-md"
            >
              <div
                className="small-caps text-[12px] tracking-[0.3em]"
                style={{ color: ACCENT_BLUE, opacity: 1, textShadow: `0 0 18px ${ACCENT_BLUE}66` }}
              >
                transformer.live
              </div>
              <div
                className="display mt-5 max-w-[900px] px-6 text-center text-[clamp(40px,6.5vw,76px)] leading-[1.05]"
                style={{
                  color: '#ffffff',
                  textShadow: '0 0 24px rgba(96,165,250,0.25), 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                Watch a transformer think.
              </div>
              <p
                className="mt-5 max-w-[560px] px-6 text-center text-[15px] leading-7"
                style={{ color: '#d8d8d2' }}
              >
                A char-level GPT trained on Shakespeare, end-to-end. From prompt to next token — every layer, every head. About 10 minutes.
              </p>
              <button
                type="button"
                onClick={begin}
                className="group mt-10 flex items-center gap-3 rounded-full border-2 px-10 py-4 transition-all hover:scale-[1.03]"
                style={{
                  borderColor: ACCENT_BLUE,
                  color: '#ffffff',
                  background: `linear-gradient(180deg, ${ACCENT_BLUE} 0%, #3b82f6 100%)`,
                  boxShadow: `0 0 32px ${ACCENT_BLUE}66, 0 8px 24px rgba(0,0,0,0.4)`,
                }}
              >
                <span className="text-[15px] leading-none">▶</span>
                <span className="display text-[19px] leading-none">Play</span>
              </button>
              <div
                className="mt-8 mono text-[10px] tracking-wider"
                style={{ color: '#9a9a96' }}
              >
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

        {/* Transport + timeline. Chapter labels live in the rail's hover
            tooltip now, so we don't reserve vertical space above the bar. */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">
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

          {/* Continuous chapter rail. One unbroken line. Chapter changes
              show as small dividers; chapter info lives on hover via a
              tooltip; the rail thickens on hover like YouTube. */}
          <ChapterRail
            chapters={chapters}
            sceneBoundaries={sceneBoundaries}
            cumulativePct={total > 0 ? cumulative / total : 0}
            currentAccent={current.accent}
            onSeek={seekToFraction}
            currentSceneTitle={current.title}
            currentSceneIdx={safeIdx}
          />

          <span className="shrink-0 mono tabular text-[10px] text-[var(--fg-muted)]">
            {formatMs(cumulative)} / {formatMs(total)}
          </span>
        </div>
      </div>
    </div>
    </PlayingContext.Provider>
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
// Continuous chapter rail
//
// One unbroken horizontal line spanning the full width of the transport
// row. Played progress fills as a single segment. Chapter changes show as
// small ticks. Hovering anywhere over a chapter brightens that chapter's
// span and pops a small tooltip above with the chapter name, scene range,
// and a one-line description. Click anywhere to seek to that absolute
// position; the rail finds the scene that contains the click and jumps
// to it.
// ────────────────────────────────────────────────────────────────────────

interface ChapterMeta {
  section: string
  label: string
  desc: string
  startIdx: number
  endIdx: number
  startMs: number
  endMs: number
  accent: string
}

function ChapterRail({
  chapters,
  sceneBoundaries,
  cumulativePct,
  currentAccent,
  currentSceneTitle,
  currentSceneIdx,
  onSeek,
}: {
  chapters: ChapterMeta[]
  sceneBoundaries: { frac: number; isChapterStart: boolean }[]
  cumulativePct: number
  currentAccent: string
  currentSceneTitle: string
  currentSceneIdx: number
  onSeek: (frac: number) => void
}) {
  const [railHovered, setRailHovered] = useState(false)
  const totalMs = chapters.length > 0 ? chapters[chapters.length - 1].endMs : 0
  const pctFor = (ms: number) => (totalMs > 0 ? ms / totalMs : 0)

  return (
    <div
      className="relative flex h-3 flex-1 items-center"
      onMouseEnter={() => setRailHovered(true)}
      onMouseLeave={() => setRailHovered(false)}
    >
      {/* Base track — single continuous thin line spanning the full width. */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full transition-[height] duration-150"
        style={{
          height: railHovered ? 4 : 2,
          background: 'rgba(255,255,255,0.07)',
        }}
      />

      {/* Played fill — one continuous segment, 0 → cumulativePct, painted in
          the current scene's accent. */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-[height,width] duration-150"
        style={{
          height: railHovered ? 4 : 2,
          width: `${Math.max(0, Math.min(1, cumulativePct)) * 100}%`,
          background: currentAccent,
          opacity: 0.85,
          boxShadow: `0 0 8px ${currentAccent}55`,
        }}
      />

      {/* Scene-level ticks — hidden by default; fade in on rail hover so
          the user can see scene boundaries within each chapter without the
          rail looking busy at rest. Drawn first so chapter ticks paint
          on top. */}
      {sceneBoundaries
        .filter((b) => !b.isChapterStart)
        .map((b) => (
          <div
            key={`scene-${b.frac}`}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 transition-[opacity,height] duration-150"
            style={{
              left: `${b.frac * 100}%`,
              width: 1,
              height: railHovered ? 5 : 0,
              background: 'rgba(255,255,255,0.28)',
              opacity: railHovered ? 0.7 : 0,
            }}
          />
        ))}

      {/* Chapter dividers — always visible. Slightly taller and brighter
          than scene ticks so the structural beat reads first. Skip the
          very first chapter since that's the start of the rail. */}
      {chapters.slice(1).map((c) => (
        <div
          key={c.startIdx}
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 transition-[opacity,height] duration-150"
          style={{
            left: `${pctFor(c.startMs) * 100}%`,
            width: 1,
            height: railHovered ? 10 : 8,
            background: 'rgba(255,255,255,0.5)',
            opacity: railHovered ? 0.85 : 0.55,
          }}
        />
      ))}

      {/* Per-chapter hover regions. Each is an invisible button covering
          its chapter span; on hover it brightens that span and pops a
          tooltip above. Clicking anywhere inside the region seeks to the
          scene at the click's absolute position. */}
      {chapters.map((c) => (
        <ChapterHoverRegion
          key={c.startIdx}
          chapter={c}
          startPct={pctFor(c.startMs)}
          endPct={pctFor(c.endMs)}
          onSeek={onSeek}
          railHovered={railHovered}
          isCurrent={currentSceneIdx >= c.startIdx && currentSceneIdx <= c.endIdx}
          currentSceneTitle={currentSceneTitle}
        />
      ))}

      {/* Playhead dot — sits exactly at cumulativePct. Glows in the current
          scene's accent. */}
      <motion.div
        className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          width: railHovered ? 12 : 9,
          height: railHovered ? 12 : 9,
        }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{
          left: `${Math.max(0, Math.min(1, cumulativePct)) * 100}%`,
          background: currentAccent,
          boxShadow: `0 0 14px ${currentAccent}cc, 0 0 2px rgba(0,0,0,0.6)`,
        }}
      />
    </div>
  )
}

function ChapterHoverRegion({
  chapter,
  startPct,
  endPct,
  onSeek,
  railHovered,
  isCurrent,
  currentSceneTitle,
}: {
  chapter: ChapterMeta
  startPct: number
  endPct: number
  onSeek: (frac: number) => void
  railHovered: boolean
  isCurrent: boolean
  currentSceneTitle: string
}) {
  const [hovered, setHovered] = useState(false)
  const widthPct = endPct - startPct
  const sceneCount = chapter.endIdx - chapter.startIdx + 1
  const sceneRange =
    sceneCount === 1
      ? `Scene ${chapter.startIdx + 1}`
      : `Scenes ${chapter.startIdx + 1}–${chapter.endIdx + 1}`

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const local = (e.clientX - rect.left) / rect.width
        const absFrac = startPct + local * widthPct
        onSeek(absFrac)
      }}
      className="group/chapter absolute inset-y-0 z-10 cursor-pointer focus:outline-none"
      style={{
        left: `${startPct * 100}%`,
        width: `${widthPct * 100}%`,
      }}
      // No `title` attribute on purpose — that triggers the browser's
      // native gray tooltip on top of our custom card. aria-label keeps
      // the chapter info accessible to screen readers.
      aria-label={`${chapter.label}, ${sceneRange}`}
    >
      {/* Chapter brightening overlay — sits on top of the base track for
          this chapter's span. Hidden by default; on hover it lights up in
          the chapter's accent so the eye knows which span the tooltip
          refers to. */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
        animate={{
          opacity: hovered ? 0.5 : 0,
          height: railHovered ? 4 : 2,
        }}
        transition={{ duration: 0.18 }}
        style={{ background: chapter.accent }}
      />

      {/* Tooltip — fades + slides up from the rail. Centered on the
          chapter span. */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-3 w-max max-w-[280px] -translate-x-1/2 rounded-[4px] border bg-[rgba(7,7,9,0.94)] px-3 py-2 text-left shadow-2xl backdrop-blur-md"
            style={{
              borderColor: `${chapter.accent}55`,
              boxShadow: `0 12px 32px rgba(0,0,0,0.45), 0 0 18px ${chapter.accent}22`,
            }}
          >
            <div
              className="small-caps text-[10px] tracking-[0.22em]"
              style={{ color: chapter.accent }}
            >
              {chapter.label}
            </div>
            <div className="mt-1 mono text-[10px] tabular text-[var(--fg-muted)]">
              {sceneRange}
              <span className="ml-2 opacity-60">
                · {formatMs(chapter.endMs - chapter.startMs)}
              </span>
            </div>
            {chapter.desc && (
              <div
                className="mt-1.5 text-[12px] leading-snug"
                style={{ color: 'rgba(236,236,233,0.92)' }}
              >
                {chapter.desc}
              </div>
            )}
            {isCurrent && currentSceneTitle && (
              <div
                className="mt-2 border-t pt-1.5 text-[11px] italic leading-snug"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: chapter.accent,
                }}
              >
                now: {currentSceneTitle}
              </div>
            )}
            {/* Bottom arrow */}
            <div
              className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45"
              style={{
                marginTop: -4,
                background: 'rgba(7,7,9,0.94)',
                borderRight: `1px solid ${chapter.accent}55`,
                borderBottom: `1px solid ${chapter.accent}55`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

function StatusPill({
  label,
  state,
}: {
  label: string
  state: 'idle' | 'loading' | 'ready'
}) {
  const dotColor =
    state === 'ready' ? '#34d399' : state === 'loading' ? '#f59e0b' : '#737373'
  // Auto-dismiss "ready" after a few seconds so the pills don't clutter.
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (state === 'ready') {
      const timer = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(timer)
    }
    setVisible(true)
  }, [state])
  if (!visible) return null
  return (
    <div className="mono flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[rgba(7,7,9,0.6)] px-2.5 py-1 text-[9px] tracking-wider text-[var(--fg-dim)] backdrop-blur-sm">
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: dotColor }}
        animate={
          state === 'loading'
            ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }
            : { opacity: 1, scale: 1 }
        }
        transition={
          state === 'loading'
            ? { duration: 1.0, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
      />
      <span>
        {label}{' '}
        {state === 'loading' ? 'loading…' : state === 'ready' ? 'ready' : '—'}
      </span>
    </div>
  )
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
  focusedToken,
}: {
  prompt: string
  accent: string
  focusedToken?: number
}) {
  const playing = usePlaying()
  // Char-level model: each character is one token. Trim to context length.
  const chars = (prompt || '').slice(0, TOKEN_STRIP_MAX).split('')
  if (chars.length === 0) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
      <div className="flex items-center gap-[3px] rounded-[3px] border border-[var(--rule)] bg-[rgba(7,7,9,0.6)] px-2 py-1.5 backdrop-blur-sm">
        <div className="mono mr-2 text-[9px] tracking-widest text-[var(--fg-dim)]">
          tokens
        </div>
        {chars.map((ch, i) => {
          const isFocused = focusedToken === i
          const animateFocused = playing
            ? {
                borderColor: accent,
                color: accent,
                backgroundColor: ['rgba(96,165,250,0.18)', 'rgba(96,165,250,0.32)', 'rgba(96,165,250,0.18)'],
                boxShadow: [
                  `0 0 8px ${accent}40`,
                  `0 0 18px ${accent}88`,
                  `0 0 8px ${accent}40`,
                ],
                scale: [1, 1.1, 1],
              }
            : {
                borderColor: accent,
                color: accent,
                backgroundColor: 'rgba(96,165,250,0.18)',
                boxShadow: `0 0 8px ${accent}40`,
                scale: 1,
              }
          return (
            <motion.div
              key={i}
              className="mono flex h-5 min-w-[14px] items-center justify-center rounded-[2px] border px-1 text-[10px] leading-none"
              animate={
                isFocused
                  ? animateFocused
                  : {
                      borderColor: 'rgba(255,255,255,0.12)',
                      color: 'var(--fg-muted)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      boxShadow: '0 0 0 rgba(0,0,0,0)',
                      scale: 1,
                    }
              }
              transition={
                isFocused
                  ? { duration: 1.6, repeat: playing ? Infinity : 0, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
              title={`token ${i}${isFocused ? ' · focused' : ''}`}
            >
              {ch === ' ' ? '·' : ch}
            </motion.div>
          )
        })}
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

/**
 * Connective narrator card — shows for ~2.6s at the start of a scene whose
 * `bridgeIn` is set, bridging the previous idea to the current one. Sits
 * just above the bottom dock so the eye can drop down for the bridge then
 * back up to the viz. Auto-fades; never replays once dismissed for a scene.
 */
function BridgeNarrator({
  text,
  accent,
  sceneKey,
}: {
  text: string
  accent: string
  sceneKey: string
}) {
  const playing = usePlaying()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2600)
    return () => clearTimeout(t)
  }, [sceneKey])
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={sceneKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-6"
        >
          <div
            className="display flex max-w-[680px] items-center gap-3 rounded-[3px] border bg-[rgba(7,7,9,0.78)] px-5 py-3 text-[15px] italic leading-snug shadow-2xl backdrop-blur-md"
            style={{
              borderColor: `${accent}55`,
              color: 'var(--fg)',
              fontFamily:
                'var(--font-display, "Tiempos", "Source Serif Pro", Georgia, serif)',
            }}
          >
            <motion.span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accent }}
              animate={
                playing
                  ? { opacity: [0.4, 1, 0.4], scale: [0.85, 1.15, 0.85] }
                  : { opacity: 0.7, scale: 1 }
              }
              transition={{
                duration: 1.6,
                repeat: playing ? Infinity : 0,
                ease: 'easeInOut',
              }}
            />
            <span>{text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
