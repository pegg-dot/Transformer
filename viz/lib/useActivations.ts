'use client'

import { useEffect, useState } from 'react'
import type { Capture } from './types'

interface State {
  data: Capture | null
  loading: boolean
  error: string | null
}

/** Loads activations.json (the canonical replay snapshot). */
export function useActivations(url = '/activations.json') {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(url)
        if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`)
        // Read as text then JSON.parse — gives real errors on malformed input AND
        // avoids a Safari quirk where Response.json() throws "The string did not
        // match the expected pattern" on very large payloads.
        const text = await r.text()
        const data = JSON.parse(text) as Capture
        if (!cancelled) setState({ data, loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        console.error('useActivations failed:', err)
        setState({ data: null, loading: false, error: msg })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
