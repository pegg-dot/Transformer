'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BLOCK_SIZE, forward, sample, softmax, topKFilter } from './ort'
import { CharTokenizer } from './tokenizer'
import type { GenerationStep } from './types'

interface GenerateOpts {
  prompt: string
  maxNewTokens: number
  temperature?: number
  topK?: number | null
  onStep?: (step: GenerationStep) => void
  signal?: AbortSignal
}

interface UseTransformerState {
  ready: boolean
  loading: boolean
  error: string | null
  tokenizer: CharTokenizer | null
}

/**
 * Hook that loads the tokenizer and ONNX session (lazily) and exposes
 * an async `generate()` that streams tokens one at a time via `onStep`.
 */
export function useTransformer() {
  const [state, setState] = useState<UseTransformerState>({
    ready: false,
    loading: false,
    error: null,
    tokenizer: null,
  })
  const tokenizerRef = useRef<CharTokenizer | null>(null)

  // Lazy-load tokenizer and model on first mount.
  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        const tokenizer = await CharTokenizer.load('/vocab.json')
        tokenizerRef.current = tokenizer
        // Warm the ONNX session in the background (don't block UI).
        import('./ort').then(({ getSession }) => getSession().catch(() => {}))
        if (cancelled) return
        setState({ ready: true, loading: false, error: null, tokenizer })
      } catch (err) {
        if (cancelled) return
        setState({
          ready: false,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          tokenizer: null,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const generate = useCallback(
    async ({
      prompt,
      maxNewTokens,
      temperature = 1.0,
      topK = null,
      onStep,
      signal,
    }: GenerateOpts): Promise<number[]> => {
      const tokenizer = tokenizerRef.current
      if (!tokenizer) throw new Error('tokenizer not ready')

      const ids = tokenizer.encode(prompt)
      for (let step = 0; step < maxNewTokens; step++) {
        if (signal?.aborted) break
        const ctx = ids.slice(-BLOCK_SIZE)
        const { logits, T, V } = await forward(ctx)

        // Grab logits for the final position: slice [T-1, V] from a flat [1,T,V] array.
        const lastLogits = new Float32Array(V)
        const offset = (T - 1) * V
        for (let i = 0; i < V; i++) lastLogits[i] = logits[offset + i]

        const filtered = topK ? topKFilter(lastLogits, topK) : lastLogits
        const probs = softmax(filtered, temperature)
        const nextId = sample(probs)
        ids.push(nextId)

        if (onStep) {
          const top = Array.from(probs)
            .map((p, i) => ({ id: i, prob: p, str: tokenizer.itos[i] }))
            .sort((a, b) => b.prob - a.prob)
            .slice(0, 10)
          onStep({
            nextTokenId: nextId,
            nextTokenStr: tokenizer.itos[nextId],
            logits: lastLogits,
            probs,
            topK: top,
            contextIds: ctx,
            step,
          })
        }

        // Yield to the main thread so the UI can paint.
        await new Promise((r) => setTimeout(r, 0))
      }
      return ids
    },
    []
  )

  return { ...state, generate }
}
