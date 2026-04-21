'use client'

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTransformer } from '@/lib/useTransformer'

const PRESETS = ['ROMEO:', 'HAMLET:', 'Hark!', 'Enter a']

export function Generator() {
  const { ready, loading, error, generate } = useTransformer()
  const [prompt, setPrompt] = useState('ROMEO:')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [temperature, setTemperature] = useState(1.0)
  const [topK, setTopK] = useState<number | null>(null)
  const [stats, setStats] = useState<{ step: number; tps: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(async () => {
    if (!ready || running) return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setOutput('')
    setRunning(true)
    setStats(null)
    const start = performance.now()
    try {
      await generate({
        prompt,
        maxNewTokens: 140,
        temperature,
        topK,
        signal: ctl.signal,
        onStep: (s) => {
          setOutput((prev) => prev + s.nextTokenStr)
          const elapsed = (performance.now() - start) / 1000
          setStats({ step: s.step + 1, tps: (s.step + 1) / Math.max(elapsed, 1e-3) })
        },
      })
    } finally {
      setRunning(false)
    }
  }, [ready, running, prompt, temperature, topK, generate])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  return (
    <div className="relative">
      {/* presets */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="small-caps mr-3 text-[var(--fg-dim)]">presets</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPrompt(p)}
            className="mono group relative rounded-full border border-[var(--rule-strong)] bg-[rgba(255,255,255,0.015)] px-3 py-1 text-[11px] text-[var(--fg-muted)] transition-all hover:-translate-y-px hover:border-[var(--accent)] hover:text-[var(--fg)]"
          >
            {p}
          </button>
        ))}
      </div>

      {/* main prompt box */}
      <div className="relative overflow-hidden rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] shadow-[0_10px_60px_-20px_rgba(0,0,0,0.6)]">
        {/* instrument bar */}
        <div className="flex items-center justify-between border-b border-[var(--rule)] px-4 py-2 text-[10px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-1.5 w-1.5 rounded-full ${running ? 'bg-[var(--accent-mint)]' : 'bg-[var(--fg-dim)]'}`}
                />
                {running && (
                  <span className="ping-soft absolute inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />
                )}
              </span>
              <span className="small-caps text-[var(--fg-muted)]">
                {running ? 'generating' : ready ? 'ready' : loading ? 'loading' : 'idle'}
              </span>
            </div>
            <span className="mono text-[var(--fg-dim)]">model.onnx · 42 MB · wasm</span>
          </div>
          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mono tabular flex items-center gap-3 text-[10px] text-[var(--fg-muted)]"
            >
              <span>
                <span className="text-[var(--fg)]">{stats.step}</span> tok
              </span>
              <span>
                <span className="text-[var(--fg)]">{stats.tps.toFixed(1)}</span> tok/s
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex items-stretch">
          <div className="flex items-center border-r border-[var(--rule)] px-4 mono text-[11px] text-[var(--fg-dim)]">
            prompt
          </div>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={running}
            placeholder="type something Shakespearean..."
            className="mono flex-1 bg-transparent px-4 py-4 text-[15px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-dim)]"
          />
          <button
            type="button"
            onClick={running ? stop : run}
            disabled={!ready}
            className={`mono relative flex items-center gap-2 border-l border-[var(--rule)] px-6 text-[12px] tracking-wide transition-colors ${
              running
                ? 'bg-[rgba(248,113,113,0.1)] text-[var(--accent-red)] hover:bg-[rgba(248,113,113,0.18)]'
                : 'bg-[rgba(96,165,250,0.08)] text-[var(--accent)] hover:bg-[rgba(96,165,250,0.18)]'
            } disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[var(--fg-dim)]`}
          >
            {running ? 'STOP' : 'GENERATE ↵'}
          </button>
        </div>

        {/* sliders */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--rule)] px-4 py-3 mono text-[11px]">
          <label className="flex items-center gap-3 text-[var(--fg-muted)]">
            <span className="small-caps">temp</span>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              disabled={running}
              className="w-32 accent-[var(--accent)]"
            />
            <span className="tabular w-10 text-right text-[var(--fg)]">
              {temperature.toFixed(2)}
            </span>
          </label>
          <label className="flex items-center gap-3 text-[var(--fg-muted)]">
            <span className="small-caps">top-k</span>
            <input
              type="number"
              min={0}
              max={65}
              value={topK ?? 0}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                setTopK(v > 0 ? v : null)
              }}
              disabled={running}
              className="w-14 rounded border border-[var(--rule-strong)] bg-transparent px-2 py-0.5 text-center text-[var(--fg)]"
            />
            <span className="text-[10px] text-[var(--fg-dim)]">{topK === null ? 'off' : ''}</span>
          </label>
          <div className="ml-auto text-[10px] text-[var(--fg-dim)]">
            T&lt;1 sharpens · T&gt;1 flattens · top-k masks everything below rank k
          </div>
        </div>
      </div>

      {/* error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-[2px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.05)] px-3 py-2 mono text-[11px] text-[var(--accent-red)]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* output — editorial prose area with mono output inside */}
      <div className="relative mt-6">
        <div className="absolute -left-6 top-0 bottom-0 w-px bg-[var(--rule)]" />
        <div className="min-h-[220px] py-5 pl-6 pr-2">
          <div className="small-caps mb-3 text-[var(--fg-dim)]">
            output · char by char
          </div>
          <div className="mono whitespace-pre-wrap break-words text-[16px] leading-[1.7]">
            <span className="text-[var(--fg-muted)]">{prompt}</span>
            <AnimatePresence initial={false}>
              {output.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="text-[var(--fg)]"
                >
                  {ch}
                </motion.span>
              ))}
            </AnimatePresence>
            {running && (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="inline-block h-[18px] w-[8px] translate-y-1 bg-[var(--accent)]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
