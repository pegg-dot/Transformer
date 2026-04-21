'use client'

import { useEffect, useState } from 'react'
import type { Capture } from './types'

interface State {
  data: Capture | null
  loading: boolean
  error: string | null
}

/** Loads activations.json (the canonical replay snapshot).
 *
 * Prefers the compact (4-decimal, whitespace-stripped) build output at
 * `/activations.compact.json` and falls back to the canonical
 * `/activations.json` if the compact file isn't deployed. Same schema either
 * way — `scripts/compress_activations.py` produces it.
 */
export function useActivations(url?: string) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    const candidates = url ? [url] : ['/activations.compact.json', '/activations.json']

    ;(async () => {
      let lastErr: string | null = null
      for (const candidate of candidates) {
        try {
          const r = await fetch(candidate)
          if (!r.ok) {
            lastErr = `fetch ${candidate} → ${r.status}`
            continue
          }
          // Read as text then JSON.parse — gives real errors on malformed input AND
          // avoids a Safari quirk where Response.json() throws "The string did not
          // match the expected pattern" on very large payloads.
          const text = await r.text()
          const data = JSON.parse(text) as Capture
          if (!cancelled) setState({ data, loading: false, error: null })
          return
        } catch (err) {
          lastErr = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
          // fall through to next candidate
        }
      }
      if (!cancelled) {
        console.error('useActivations failed on all candidates:', candidates, lastErr)
        setState({ data: null, loading: false, error: lastErr ?? 'unknown fetch error' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
