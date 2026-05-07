/**
 * displayTokens — turn the user's prompt into a list of realistic-looking
 * BPE-style tokens for the visualizer.
 *
 * The actual model the site runs is character-level (vocab=65). But scenes
 * that talk about "tokens" abstractly (embedding lookup, persistent token
 * strip, etc.) read better when the displayed units look like real
 * tokenizer output — leading-space word-pieces and standalone punctuation,
 * not isolated letters.
 *
 * For the canonical demo prompt ("To be, or not to be") we use a hand-
 * authored splitting with plausible GPT-2-style IDs. For arbitrary user
 * prompts we fall back to a regex that produces visually similar output.
 *
 * IDs are stable per token text — same text always returns the same ID, so
 * the embedding-row lookup behaves consistently across re-renders.
 */
export type DisplayToken = { text: string; id: number }

const HAMLET: Record<string, DisplayToken[]> = {
  'to be, or not to be': [
    { text: 'To',   id: 1675 },
    { text: ' be',  id: 307  },
    { text: ',',    id: 11   },
    { text: ' or',  id: 393  },
    { text: ' not', id: 407  },
    { text: ' to',  id: 284  },
    { text: ' be',  id: 307  },
  ],
}

function stableId(t: string): number {
  let h = 5381
  for (let i = 0; i < t.length; i++) {
    h = ((h << 5) + h + t.charCodeAt(i)) >>> 0
  }
  // Plausible GPT-2-style ID range, bottom 1k reserved for short fragments.
  return (h % 49000) + 1000
}

const TOKEN_RE = /\s*[A-Za-z]+|\s*[0-9]+|[^\s]/g

export function displayTokens(prompt: string | null | undefined): DisplayToken[] {
  if (!prompt) return []
  const key = prompt.trim().toLowerCase()
  const canon = HAMLET[key]
  if (canon) return canon

  // Generic fallback: keep leading whitespace attached to the next
  // word-or-number; punctuation (and stray symbols) become their own tokens.
  const out: DisplayToken[] = []
  for (const m of prompt.matchAll(TOKEN_RE)) {
    const text = m[0]
    if (!text || text.trim() === '') continue
    out.push({ text, id: stableId(text) })
  }
  return out
}
