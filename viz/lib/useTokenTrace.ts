'use client'

import { useMemo } from 'react'
import { useActivations } from './useActivations'

export interface TokenTrace {
  /** Whether real captured data is loaded. False → caller should fall back. */
  ready: boolean
  /** The actual prompt the captured run was on (e.g. "ROMEO:"). */
  capturedPrompt: string
  /** Token character at the requested index in the captured run. */
  capturedTokenChar: string
  /** Stride-sampled embedding+position vector for the token (length = sampleDims). */
  embedSum: number[] | null
  /** Stride-sampled residual stream after each transformer block (n_layer entries). */
  blockResiduals: number[][] | null
  /** Stride-sampled final layer norm output for the token. */
  lnF: number[] | null
}

const EMPTY: TokenTrace = {
  ready: false,
  capturedPrompt: '',
  capturedTokenChar: '',
  embedSum: null,
  blockResiduals: null,
  lnF: null,
}

/**
 * Returns the residual-stream trace of one captured token through all
 * transformer blocks, stride-sampled down to `sampleDims` cells so it
 * fits a VectorGrid. Each scalar is normalized to roughly [-1, 1] using
 * the per-tensor max-abs.
 *
 * If activations haven't loaded yet, returns `ready=false` and the
 * caller should fall back to synthetic data.
 */
export function useTokenTrace(tokenIdx: number, sampleDims: number = 12): TokenTrace {
  const { data } = useActivations()

  return useMemo(() => {
    if (!data) return EMPTY
    const T = data.token_strs.length
    if (tokenIdx < 0 || tokenIdx >= T) return EMPTY

    const C = data.model.n_embd
    const stride = Math.max(1, Math.floor(C / sampleDims))

    const sample = (vec: number[]): number[] => {
      const out: number[] = []
      for (let i = 0; i < sampleDims; i++) {
        const idx = Math.min(C - 1, i * stride)
        out.push(vec[idx])
      }
      // Normalize to ~[-1, 1] using the sampled slice's max-abs (so the
      // VectorGrid color/opacity dynamic range works).
      const maxAbs = Math.max(1e-6, ...out.map((v) => Math.abs(v)))
      return out.map((v) => v / maxAbs)
    }

    const embedSum = sample(data.embed_sum[tokenIdx])
    const blockResiduals = data.blocks.map((b) => sample(b.resid_out[tokenIdx]))
    const lnF = sample(data.ln_f[tokenIdx])

    return {
      ready: true,
      capturedPrompt: data.run.prompt,
      capturedTokenChar: data.token_strs[tokenIdx] ?? '?',
      embedSum,
      blockResiduals,
      lnF,
    }
  }, [data, tokenIdx, sampleDims])
}
