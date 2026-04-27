'use client'

import { useEffect, useRef, useState } from 'react'
import { useTransformer } from './useTransformer'

interface State {
  /** Tokens generated so far (decoded). Streams in as the model produces them. */
  text: string
  /** True once the model has finished generating maxNewTokens. */
  done: boolean
  /** True while the model is still warming up (loading ONNX session/tokenizer). */
  loading: boolean
  error: string | null
}

const EMPTY: State = { text: '', done: false, loading: true, error: null }

/**
 * Runs the ONNX char-level model once per `prompt` change, streaming
 * generated tokens into `text`. Use to power the cold-open's AI reply
 * and the output scene's continuation with REAL model output for
 * whatever prompt the viewer has set.
 *
 * Does the heavy lifting in the background (loadeing tokenizer/session,
 * decoding tokens) — callers get a clean { text, done, loading } reactive
 * state and can render directly.
 */
export function useLiveContinuation(prompt: string, maxNewTokens: number = 32) {
  const { ready, generate, tokenizer, error: tErr } = useTransformer()
  const [state, setState] = useState<State>(EMPTY)
  const lastPromptRef = useRef<string | null>(null)

  useEffect(() => {
    if (!ready || !tokenizer) return
    // Avoid re-running when the same prompt remounts (scene cycles).
    if (lastPromptRef.current === prompt) return
    lastPromptRef.current = prompt

    const controller = new AbortController()
    setState({ text: '', done: false, loading: false, error: null })

    let mounted = true
    ;(async () => {
      try {
        let acc = ''
        await generate({
          prompt,
          maxNewTokens,
          temperature: 0.85,
          topK: 40,
          onStep: ({ nextTokenStr }) => {
            acc += nextTokenStr
            if (!mounted) return
            setState((s) => ({ ...s, text: acc }))
          },
          signal: controller.signal,
        })
        if (mounted) setState((s) => ({ ...s, done: true, loading: false }))
      } catch (e) {
        if (mounted) {
          setState((s) => ({
            ...s,
            done: true,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          }))
        }
      }
    })()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [ready, tokenizer, prompt, maxNewTokens, generate])

  if (tErr) {
    return { text: '', done: true, loading: false, error: tErr } satisfies State
  }
  if (!ready) {
    return { ...EMPTY, loading: true }
  }
  return state
}
