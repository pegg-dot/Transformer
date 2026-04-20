'use client'

import { createContext, useContext, useState } from 'react'

/**
 * A shared prompt state that a handful of scenes read from.
 *
 * Scope: only "input-surface" scenes subscribe — tokenization, embeddings,
 * self-attention, multi-head, KV cache. Abstract / training / modern scenes
 * ignore this so they stay pedagogically stable.
 */

const DEFAULT_PROMPT = 'To be, or no'
const MAX_LEN = 12

interface Ctx {
  prompt: string
  setPrompt: (s: string) => void
  seed: number  // deterministic hash of the prompt for fake-data generation
}

const PromptContext = createContext<Ctx>({
  prompt: DEFAULT_PROMPT,
  setPrompt: () => {},
  seed: hashString(DEFAULT_PROMPT),
})

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h >>> 0
}

function clamp(s: string): string {
  // Keep only printable ASCII (space through ~). Newlines break SVG text layout, drop them.
  const cleaned = s.replace(/[^ -~]/g, '').slice(0, MAX_LEN)
  return cleaned.length > 0 ? cleaned : DEFAULT_PROMPT
}

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = useState(DEFAULT_PROMPT)
  const prompt = clamp(raw)
  return (
    <PromptContext.Provider value={{ prompt, setPrompt: setRaw, seed: hashString(prompt) }}>
      {children}
    </PromptContext.Provider>
  )
}

export function usePrompt() {
  return useContext(PromptContext)
}

export { DEFAULT_PROMPT, MAX_LEN }
