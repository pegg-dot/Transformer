'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AttentionFlow } from '@/components/AttentionFlow'
import { Generator } from '@/components/Generator'
import { Hero } from '@/components/Hero'
import { TopNav } from '@/components/TopNav'
import { SectionHeader } from '@/components/SectionHeader'
import { TokenizationView } from '@/components/TokenizationView'
import { EmbeddingView } from '@/components/EmbeddingView'
import { LayerView } from '@/components/LayerView'
import { LayerSelector } from '@/components/LayerSelector'
import { KVCacheView } from '@/components/KVCacheView'
import { DecodingView } from '@/components/DecodingView'
import { useActivations } from '@/lib/useActivations'

export default function Home() {
  const { data: act, loading, error } = useActivations('/activations.json')
  const [selectedLayer, setSelectedLayer] = useState(0)

  return (
    <>
      <TopNav />

      <Hero />

      {/* --- Section 01: The live model --- */}
      <section id="generate" className="mx-auto max-w-[1400px] px-6 pb-16 scroll-mt-24">
        <SectionHeader
          number="01"
          kicker="live · in your browser"
          title="Generate."
          subtitle="Type or click a preset. The model runs right here — no backend. Every character you see below was sampled one at a time from a 10.79M-parameter GPT trained from scratch on tinyshakespeare."
          accent="blue"
        />
        <div className="mt-10">
          <Generator />
        </div>
      </section>

      {/* --- Section 02: Inside --- */}
      <section className="mx-auto max-w-[1400px] px-6 pb-16">
        <SectionHeader
          number="02"
          kicker="peek inside · canonical replay"
          title="What the model was actually doing."
          subtitle="The live model above is fast but opaque — ONNX only returns logits. To see the internals we capture one canonical forward pass in Python, export every tensor to JSON, and replay it here: tokenization, embeddings, Q/K/V per head, attention, FFN, residual stream, and the final decoding step."
          accent="violet"
        />

        {error && (
          <div className="mt-8 rounded-[2px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.05)] px-4 py-3 mono text-[11px] text-[var(--accent-red)]">
            activations error: {error}
          </div>
        )}
        {loading && (
          <div className="mt-8 mono text-[11px] text-[var(--fg-muted)]">
            loading activations.json…
          </div>
        )}

        {act && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-10 space-y-8"
          >
            <TokenizationView
              tokens={act.tokens}
              tokenStrs={act.token_strs}
              promptLen={act.run.prompt_token_ids.length}
            />

            <EmbeddingView
              embedding={act.embed_sum}
              tokenStrs={act.token_strs}
              title="Input embeddings"
              kicker="token + positional — the block-0 input"
            />

            <div className="pt-4 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[var(--rule)] py-4">
                <LayerSelector
                  n={act.blocks.length}
                  selected={selectedLayer}
                  onSelect={setSelectedLayer}
                />
                <span className="mono text-[10px] text-[var(--fg-dim)]">
                  each block = layernorm → attention → layernorm → ffn, wrapped in residuals
                </span>
              </div>

              {/* THE MAIN ATTENTION ANIMATION */}
              <AttentionFlow
                attention={act.blocks[selectedLayer].attn.weights}
                tokenStrs={act.token_strs}
                promptLen={act.run.prompt_token_ids.length}
                layerIndex={selectedLayer}
              />

              <LayerView
                block={act.blocks[selectedLayer]}
                layerIndex={selectedLayer}
                tokenStrs={act.token_strs}
              />
              <KVCacheView
                attn={act.blocks[selectedLayer].attn}
                tokenStrs={act.token_strs}
                layerIndex={selectedLayer}
              />
            </div>

            <EmbeddingView
              embedding={act.ln_f}
              tokenStrs={act.token_strs}
              title="Final layernorm"
              kicker="what the unembedding reads"
              accent="mint"
            />

            <DecodingView
              logits={act.logits}
              vocab={act.vocab}
              lastTokenId={
                act.run.generated_token_ids.length > 0
                  ? act.run.generated_token_ids[act.run.generated_token_ids.length - 1]
                  : null
              }
            />
          </motion.div>
        )}
      </section>

      {/* --- Section 03: Further --- */}
      <section className="mx-auto max-w-[1400px] px-6 pb-32">
        <SectionHeader
          number="03"
          kicker="what’s next"
          title="The road ahead."
          accent="mint"
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              k: 'phase 3',
              t: 'Modernize to Llama 3',
              d: 'RoPE positions, SwiGLU activations, RMSNorm, GQA — then A/B toggle old vs new in this exact viz.',
            },
            {
              k: 'phase 4',
              t: 'Fine-tune a real model',
              d: 'LoRA on Qwen/Gemma via Unsloth, swap in via dropdown.',
            },
            {
              k: 'phase 5',
              t: 'Reasoning with GRPO',
              d: 'DeepSeek-R1 style RL with verifiable rewards. Visualize the "thinking" trace.',
            },
          ].map((c) => (
            <div
              key={c.t}
              className="group relative rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--accent)]"
            >
              <div className="small-caps text-[var(--fg-dim)]">{c.k}</div>
              <div className="display mt-2 text-[20px]">{c.t}</div>
              <p className="mt-3 text-[13px] leading-6 text-[var(--fg-muted)]">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-8 mono text-[11px] text-[var(--fg-muted)]">
          <span>
            built from scratch · PyTorch → ONNX → WASM · 10.79M params trained in 71 minutes on MPS
          </span>
          <span className="text-[var(--fg-dim)]">v 0.2 · phase 2</span>
        </div>
      </footer>
    </>
  )
}
