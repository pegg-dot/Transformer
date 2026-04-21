'use client'

import { motion } from 'framer-motion'
import { Panel } from './Panel'

interface Props {
  tokens: number[]
  tokenStrs: string[]
  promptLen: number
}

const EXPLAIN = {
  whatYouSee:
    'Your text, split one token per character. Each pill shows the glyph and the integer ID the model sees (0 through 64 — our whole vocabulary).',
  whyItMatters:
    'The model never sees letters; it sees integer IDs. Tokenization is the very first transformation — strings become numbers. Real large models use BPE, chunking several letters into one token; we use char-level so every token stays legible.',
  whatToLookFor:
    'The boundary between your prompt (dim) and the model’s generated tokens (bright blue). Notice how whitespace and newlines are tokens too — even the space between "ROMEO:" and the first word is an ID the model had to predict.',
}

function glyph(ch: string) {
  if (ch === '\n') return '↵'
  if (ch === ' ') return '·'
  if (ch === '\t') return '→'
  return ch
}

export function TokenizationView({ tokens, tokenStrs, promptLen }: Props) {
  const genLen = tokens.length - promptLen
  return (
    <Panel
      title="Tokenization"
      kicker={`T = ${tokens.length}`}
      shape={`tokens [T=${tokens.length}]  ids ∈ [0, 65)`}
      explain={EXPLAIN}
    >
      <div className="mb-4 flex items-center gap-6 mono text-[10px] text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm border border-[var(--rule-strong)] bg-[rgba(255,255,255,0.03)]" />
          <span>prompt · {promptLen}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm border border-[var(--accent)] bg-[rgba(96,165,250,0.1)]" />
          <span>generated · {genLen}</span>
        </div>
        <div className="ml-auto">
          <span>each cell ≡ 1 character = 1 integer ID</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tokenStrs.map((ch, i) => {
          const isPrompt = i < promptLen
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              className={`group relative flex min-w-[32px] flex-col items-center rounded-[2px] border px-1.5 py-1 mono transition-colors ${
                isPrompt
                  ? 'border-[var(--rule-strong)] bg-[rgba(255,255,255,0.015)] text-[var(--fg-muted)]'
                  : 'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.08)] text-[var(--accent)]'
              }`}
              title={`pos=${i} id=${tokens[i]} char=${JSON.stringify(ch)}`}
            >
              <span className="text-[14px] leading-4">{glyph(ch)}</span>
              <span className="tabular mt-0.5 text-[9px] text-[var(--fg-dim)]">{tokens[i]}</span>
            </motion.div>
          )
        })}
      </div>
    </Panel>
  )
}
