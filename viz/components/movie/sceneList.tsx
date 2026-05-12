'use client'

import { type MovieScene } from './MovieOrchestrator'
import {
  SceneAttention,
  SceneBPE,
  SceneEmbedding,
  SceneLayerNorm,
  SceneMultiHead,
  ScenePositional,
  SceneQKV,
  SceneTokenization,
} from './scenes'
import { IntroColdOpenPanel } from './introScenes'
import {
  PanelQKV,
  PanelFFN,
  PanelLayerNorm,
  PanelAttention,
  PanelMulti,
} from './scenePanels'
import {
  Act1IntroSplitPane,
  TokensSplitPane,
  BPESplitPane,
  EmbeddingSplitPane,
  PositionalSplitPane,
  ReadyForBlock0SplitPane,
} from './actIScenes'
import {
  Act2IntroSplitPane,
  LayerNormSplitPane,
  QKVSplitPane,
  AttentionSplitPane,
  MultiHeadSplitPane,
  FFNSplitPane,
  FFNFeatureSplitPane,
  FFNGeluSplitPane,
} from './act2Scenes'
import {
  ActIIIIntroSplitPane,
  StackSplitPane,
  SampleSplitPane,
  KVCacheSplitPane,
} from './act3Scenes'
import {
  Act4IntroSplitPane,
  BackpropSplitPane,
  BpAccumulationSplitPane,
  BpJacobianSplitPane,
  CELossBatchSplitPane,
  CELossSeqSplitPane,
  CrossEntropySplitPane,
  GdAdamSplitPane,
  GdRavineSplitPane,
  GradientDescentSplitPane,
} from './act4Scenes'
import {
  Act5IntroSplitPane,
  RopeSplitPane,
  ModernSplitPane,
} from './act5Scenes'
import { Act6IntroSplitPane, OutputSplitPane } from './act6Scenes'

const ACCENT = {
  blue: '#60a5fa',
  violet: '#a78bfa',
  mint: '#34d399',
  amber: '#f59e0b',
  pink: '#ec4899',
  cyan: '#22d3ee',
  red: '#f87171',
}

const PROLOGUE = 'Prologue'
const ACT_I = 'Act I · Input'
const ACT_II = 'Act II · Inside a Block'
const ACT_III = 'Act III · The Full Stack'
const ACT_IV = 'Act IV · Training'
const ACT_V = 'Act V · Modern Upgrades'
const ACT_VI = 'Act VI · The Output'

/*
 * DURATION CONVENTION: every scene gets enough time to read the full frame
 * plus watch its internal cycle through once with a 2s tail. Multi-phase
 * scenes use exact durations matching (phases × phase-time).
 */

export const SCENES: MovieScene[] = [
  // =============== PROLOGUE ===============
  {
    id: 'intro-cold-open',
    section: PROLOGUE,
    kicker: 'the setup',
    title: 'This is what happens inside.',
    caption: 'A full transformer, from prompt to next token. Every layer, every head.',
    accent: ACCENT.blue,
    // Panel ends with a shrink-and-fade morph that lands ~20.7s in for the
    // default prompt ("To be, or not to be"). 22s gives ~1.3s of buffer
    // before cutting to scene 2. The original 32s reserved time for a
    // Phase 3 camera dive that hasn't been built — until then, anything
    // past the morph is just a black screen.
    durationMs: 22000,
    details: `Every time you send a prompt to an AI, it runs through a stack like this. We're going to walk through it end-to-end — starting with the raw text, ending with the next token it picks.`,
    render: () => <IntroColdOpenPanel />,
    // Phase 1: cold open is a fullscreen chat UI — no 3D underneath yet.
    // Phase 3 will add the morph-into-stack camera dive at the end of this scene.
    panelAnchor: 'fullscreen',
    breadcrumb: ['Prologue'],
  },

  // =============== ACT I — INPUT ===============
  {
    id: 'act1-intro',
    section: ACT_I,
    breadcrumb: ['Input'],
    kicker: 'act one',
    title: 'First: text becomes numbers.',
    caption: 'Your prompt has to be turned into integers before the network can do math on it.',
    accent: ACCENT.violet,
    durationMs: 14000,
    panelAnchor: 'fullscreen',
    details: `The input stage. Three small steps: split the string into tokens, look up each token's vector in an embedding table, and add a position encoding so the network can tell what came first.`,
    render: () => <Act1IntroSplitPane />,
  },
  {
    id: 'tokens',
    section: ACT_I,
    breadcrumb: ['Input', 'Tokenization'],
    bridgeIn: 'Step one. Take the text and chop it into pieces the model can index.',
    kicker: 'tokenization',
    title: 'Text becomes tokens.',
    caption:
      'The prompt gets split into subword tokens, each mapped to an integer ID from the model vocabulary.',
    accent: ACCENT.violet,
    // Reveal (top text → pills → IDs → callout) runs to ~5.8s. Scanner
    // then steps through 7 BPE tokens at 700ms each = 4.9s. 12s covers
    // one full scanner pass with a small hold on the final token.
    durationMs: 12000,
    promptAware: true,
    part: 'tokenize',
    panelAnchor: 'fullscreen',
    details: `Tokenization is a pure lookup — it turns the input string into a list of fixed integers using a vocabulary built once, before training. Real LLMs use BPE-style subword tokens with vocabularies of 32k–256k. Common words become one token (' the'), rare ones split into pieces ('arborescent' → 'ar' + 'bor' + 'escent').

The lookup is identical regardless of granularity: take the string, find each token in the vocab, emit its ID. That's the whole "tokenization" step.

Note: the actual nanoGPT this project trains is character-level (vocab=65, every character is its own token) — same lookup mechanism, just a much smaller table. We show BPE-style tokens here because that's what real LLMs do.

Nothing about the model cares what the original text looked like after this point. It only sees integers.`,
    render: () => <TokensSplitPane />,
  },
  {
    id: 'bpe',
    section: ACT_I,
    breadcrumb: ['Input', 'BPE'],
    bridgeIn: 'Char-level is the toy version. Real models tokenize smarter — like this.',
    kicker: 'real tokenization',
    title: 'Real models use BPE.',
    caption:
      'Start from bytes. Count adjacent pairs. Merge the most frequent. Repeat — thousands of times. (This educational nanoGPT skips BPE and uses char-level from Scene 3; production GPTs all use BPE.)',
    accent: ACCENT.violet,
    // 7 merge steps × 2.4s = 16.8s for one full cycle. 22s = ~1.3 cycles
    // so the final "language" merge has time to land before the cut.
    durationMs: 22000,
    part: 'tokenize',
    panelAnchor: 'fullscreen',
    // BPE merge demo on a different word in the body — keep the global
    // strip hidden so the viewer focuses on the merge tree.
    showTokenStrip: false,
    details: `BPE ("byte-pair encoding") is how modern tokenizers are built. Start with a vocabulary of all 256 bytes. Count every adjacent-pair of tokens in the training corpus. Merge the most frequent pair into one new token. Repeat thousands of times.

After training, you're left with a merge table. At inference time, apply the same merges greedily to any input string. Common English words become one token ("the"), rare words split into multiple subwords ("arborescent" → "ar" + "bor" + "escent").

The reason to use BPE instead of characters: way shorter sequences (fewer positions for attention to chew through) without needing a fixed English word list. The reason to use it instead of fixed words: handles arbitrary text, including typos, code, and non-English.

Note: the actual nanoGPT this project is built around uses character-level tokenization (Scene 3) — every character is its own token, vocab ≈ 65 unique chars. BPE is what real production GPTs do, but it's skipped in the educational model for simplicity.`,
    render: () => <BPESplitPane />,
  },
  {
    id: 'embed',
    section: ACT_I,
    breadcrumb: ['Input', 'Embedding lookup'],
    bridgeIn: 'IDs are just integers. To do math on them, look each one up in a table…',
    focusedToken: 1,
    kicker: 'embeddings',
    title: 'Each token becomes a vector.',
    caption:
      'A token ID indexes into a learned embedding table. The matching row IS the model’s view of that token.',
    accent: ACCENT.violet,
    // 7 tokens × 2.2s cursor cycle = ~15.4s per full pass; 20s = ~1.3
    // passes so every token's row gets pulled out without a visible loop.
    durationMs: 20000,
    part: 'embed',
    panelAnchor: 'fullscreen',
    details: `The embedding matrix is a learned parameter table: shape [vocab_size, d_model]. In our tiny model that's [65, 384]. For every token ID, look up row ID, get back a 384-dimensional vector.

Every downstream layer reads the embedding vector, not the ID. The ID itself has no numerical meaning (ID 47 isn't "47 times bigger" than ID 1). The embedding converts the discrete ID into a dense vector the network can do math on.

This is where the network first starts to encode meaning. Tokens that behave similarly (e.g. "king" and "queen") drift toward similar embedding vectors during training, because they produce similar gradient signals.`,
    render: () => <EmbeddingSplitPane />,
  },
  {
    id: 'positional',
    section: ACT_I,
    breadcrumb: ['Input', 'Positional encoding'],
    bridgeIn: 'But the vector says nothing about WHERE in the sentence the token sat. Add that next.',
    focusedToken: 1,
    kicker: 'positional encoding',
    title: 'Position gets baked in.',
    caption:
      'A position vector is added directly to the token embedding. This nanoGPT uses a learned table indexed by position; the original Transformer used fixed sinusoidal patterns; modern models use RoPE (Scene 31).',
    accent: ACCENT.violet,
    // 8 positions × 1.8s = 14.4s for one full sweep. 17s = ~1.2 sweeps.
    durationMs: 17000,
    part: 'positional',
    panelAnchor: 'fullscreen',
    details: `Attention on its own has no notion of order — "cat sat" and "sat cat" would produce identical attention outputs. Positional encoding fixes this by adding a position-dependent pattern to every embedding, so position 0 looks different from position 5 even for the same token.

This nanoGPT uses a learned position embedding: a second lookup table of shape (block_size × n_embd), indexed by absolute position the same way the token embedding (Scene 5) is indexed by token ID. The values inside that table are gradient-descent-learned, just like the token embedding's values.

The original "Attention is All You Need" paper used fixed sinusoidal patterns — different frequencies per dimension, deterministic so it extrapolates to positions never seen during training. The wave visualization shown here is closer to that original design.

Modern models (LLaMA, GPT-NeoX, Mistral) replaced both approaches with RoPE — rotary position embeddings — covered in Scene 31. The motivation is always the same: let attention know which token came first.`,
    render: () => <PositionalSplitPane />,
  },

  {
    id: 'ready-for-block-0',
    section: ACT_I,
    breadcrumb: ['Input', 'Input slab'],
    bridgeIn: 'Token vector + position vector → one input vector per token. Stack them all.',
    kicker: 'input slab',
    title: 'Ready for Block 0.',
    caption:
      'After tokenization, embedding lookup, and positional encoding, the model has a T × d_model input slab.',
    accent: ACCENT.violet,
    durationMs: 14000,
    panelAnchor: 'fullscreen',
    details: `The output of Act I is a matrix: one row per token position, one column per hidden dimension. This object is the residual stream — the running representation that flows through every transformer block, with each block adding (not replacing) its own contribution.

Nothing in the model has done attention yet. Tokens have not "talked" to each other yet. That happens for the first time in Block 0, which we walk through next.`,
    render: () => <ReadyForBlock0SplitPane />,
  },

  // =============== ACT II — INSIDE A BLOCK ===============
  {
    id: 'act2-intro',
    section: ACT_II,
    breadcrumb: ['Block 0'],
    kicker: 'act two',
    title: 'Now zoom into one block.',
    caption: 'Attention first, then a small feedforward net. Every block runs the same two sub-layers.',
    accent: ACCENT.blue,
    // 14s → 17s — dive starts at 10.5s and settles at ~13s; the extra 3s
    // gives Block 0 visible hold time before the cut to scene 9 (layernorm).
    durationMs: 17000,
    panelAnchor: 'fullscreen',
    details: `A transformer block is a fixed recipe: normalize, run multi-head attention, add the result back to the residual stream, normalize again, run a feedforward net, add that back too. Every one of the six blocks does exactly this.`,
    render: () => <Act2IntroSplitPane />,
  },
  {
    id: 'layernorm',
    section: ACT_II,
    breadcrumb: ['Block 0', 'LayerNorm'],
    bridgeIn: 'Inside Block 0 now. Step one: shape the input so the math stays stable.',
    focusedToken: 1,
    kicker: 'layernorm',
    title: 'Normalize before every sublayer.',
    caption:
      'Subtract mean → divide by std → scale & shift (γ, β). Runs before attention AND before FFN.',
    accent: ACCENT.violet,
    // 5 phases × 2.4s = 12s for one full cycle. 14s = ~1.17 cycles.
    durationMs: 14000,
    part: 'layernorm',
    panelAnchor: 'fullscreen',
    details: `LayerNorm stabilizes training. Without it, gradients through deep stacks of attention/FFN can explode or vanish. The fix: at every layer boundary, renormalize the input vector so its mean is 0 and variance is 1, then apply two learned scale/shift parameters (γ and β) to let the model undo the normalization if useful.

Key detail: LayerNorm runs per-token-vector — it normalizes across the 384 dimensions of ONE token, not across tokens or across batch. This is different from BatchNorm (which averages across the batch) and is why LayerNorm works in models with variable sequence length.

Modern models (LLaMA, PaLM) switched to RMSNorm, which drops the mean-subtraction step for a small speedup with no quality loss.`,
    render: () => <LayerNormSplitPane />,
  },
  {
    id: 'qkv',
    section: ACT_II,
    breadcrumb: ['Block 0', 'Attention', 'Q · K · V'],
    bridgeIn: 'Same vector, three new roles — query, key, value.',
    focusedToken: 1,
    wide: true,
    kicker: 'q · k · v',
    title: 'One vector. Three roles.',
    caption:
      'Three learned matrices project the same input into query, key, and value vectors.',
    accent: ACCENT.violet,
    // 4 phases × 2.4s = 9.6s for one full cycle. 12s = ~1.25 cycles.
    durationMs: 12000,
    part: 'attention',
    panelAnchor: 'fullscreen',
    details: `Q, K, V are three linear projections of the same input vector. Every token gets its own Q (what am I looking for?), K (how can I be found?), and V (what do I contribute?). Three matrices, one shape each [d_model × d_head].

Why three? Because you want to ask a different question than you want to broadcast. Q and K must match in dimension (they're compared via dot product), but V can be totally different — it's just what the token offers once someone has decided to listen to it.

All three are learned. Nothing special about the split — they start as random matrices and the network figures out what each should encode during training.`,
    render: () => <QKVSplitPane />,
  },
  {
    id: 'attn',
    section: ACT_II,
    breadcrumb: ['Block 0', 'Attention'],
    bridgeIn: 'Q asks "who matches me?" K answers. That dot product is the whole game.',
    focusedToken: 1,
    wide: true,
    kicker: 'self-attention',
    title: 'Attention — 4 sub-phases.',
    subGroup: { label: 'phases', index: 4, total: 4, color: ACCENT.blue },
    caption:
      '(A) one query at a time. (B) full Q·Kᵀ matrix cell-by-cell. (C) row-wise softmax. (D) weighted sum over value vectors.',
    accent: ACCENT.blue,
    durationMs: 43000,  // 4 × 10s
    promptAware: true,
    part: 'attention',
    details: `This is the whole game. Q·Kᵀ gives you a [T × T] grid where cell (i, j) is "how much should token i listen to token j". Divide by √d to keep gradients stable, mask out the future (causal), softmax each row so weights sum to 1, then use those weights to average the V vectors.

The output at position i is a weighted sum of everyone else's V vectors, weighted by how well i's question (Q_i) matched their key (K_j). If nothing matches, attention falls back on itself. If something matches strongly, that token dominates.

This is the mechanism that lets "the animal didn't cross the street because IT was tired" resolve "it" to "animal" rather than "street" — the network learns to attend from "it" back to the right antecedent.`,
    render: () => <AttentionSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'multi',
    section: ACT_II,
    breadcrumb: ['Block 0', 'Attention', 'Multi-head'],
    bridgeIn: 'One head only learns one pattern. Run six in parallel — they specialize.',
    focusedToken: 1,
    wide: true,
    kicker: 'multi-head',
    title: 'Six heads in parallel.',
    caption:
      'Same attention machinery, six times, each with its own W_q, W_k, W_v and its own learned pattern.',
    accent: ACCENT.violet,
    durationMs: 26000,
    promptAware: true,
    part: 'attention',
    details: `One attention head only learns one pattern. Real models run 6–32 heads in parallel, each with its own Q, K, V matrices. Each head can specialize — one on syntax, one on coreference, one on positional distance.

After all heads compute their output vectors, concatenate them into one wide vector, then apply one more linear projection (W_O) to mix the heads and return to d_model dimensions.

Empirically, the heads DO specialize. Different heads attend to different kinds of relations, and you can visualize the patterns per head.`,
    render: () => <MultiHeadSplitPane />,
    panelAnchor: 'fullscreen',
  },
  // FFN sub-section — structure first, then interpretation, then activation detail
  {
    id: 'ffn',
    section: ACT_II,
    breadcrumb: ['Block 0', 'FFN'],
    bridgeIn: 'Attention mixed information across tokens. Now process each token alone.',
    focusedToken: 1,
    wide: true,
    kicker: 'feed-forward',
    title: 'Expand. Fire. Compress.',
    subGroup: { label: 'FFN · structure', index: 1, total: 3, color: ACCENT.amber },
    caption:
      'Expand 4× wider (1536 dims), ReLU fires on selected features, compress back to 384, add to residual.',
    accent: ACCENT.amber,
    // 19s → 22s — dive starts at 16s and settles at ~18.2s; extra 3s
    // gives "ZOOM INTO ONE NEURON" caption time to land before cut to
    // scene 14 (ffn-feature).
    durationMs: 22000,
    part: 'ffn',
    details: `The feed-forward block is a simple two-layer MLP applied per-token. First layer expands d_model → 4·d_model. Nonlinearity fires on each expanded dimension. Second layer compresses 4·d_model → d_model. Add the result back to the residual stream.

This nanoGPT uses ReLU as the activation (the simplest possible nonlinearity: max(0, x)). GPT-2 and BERT use the smoother GELU; LLaMA uses SwiGLU. Scene 15 compares all three.

Most of the model's parameters live here. A GPT-2 XL block has ~25M params in FFN versus ~6M in attention. If you want a model to know more facts, make the FFN wider.

Attention moves information BETWEEN tokens. FFN processes information WITHIN a single token. Both are needed.`,
    render: () => <FFNSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'ffn-feature',
    section: ACT_II,
    breadcrumb: ['Block 0', 'FFN', 'One feature'],
    bridgeIn: 'Each of those 1536 hidden dims is its own learned pattern detector. Pick one.',
    focusedToken: 1,
    kicker: 'feature detectors',
    title: 'Each hidden neuron detects something.',
    subGroup: { label: 'FFN · interpretation', index: 2, total: 3, color: ACCENT.amber },
    caption:
      'Zoom into one hidden dimension and watch tokens stream by — it pulses (after ReLU) on matches, stays dim otherwise. Labels are illustrative; real features are messier.',
    accent: ACCENT.amber,
    durationMs: 21000,
    part: 'ffn',
    details: `Each dimension of the hidden (4d) layer can be thought of as one learned feature. During training, different dimensions specialize: maybe dimension #147 correlates with code syntax, another with French words, another with sports vocabulary.

This is speculative for smaller models but well-documented for large ones — see Anthropic's superposition and dictionary-learning research. Many features get packed into overlapping subspaces because there are way more concepts than neurons. Real learned features are often distributed, polysemantic, and context-dependent — the clean labels here are simplified illustrative views.

Interpretability research is largely about teasing out what each dimension represents.`,
    render: () => <FFNFeatureSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'gelu',
    section: ACT_II,
    breadcrumb: ['Block 0', 'FFN', 'Activation'],
    bridgeIn: 'How does each detector actually decide to fire? The activation function picks.',
    focusedToken: 1,
    kicker: 'activation functions',
    title: 'How each feature decides to fire.',
    subGroup: { label: 'FFN · activation detail', index: 3, total: 3, color: ACCENT.amber },
    caption:
      'The gate between W₁ and W₂. Without it, two linear layers collapse to one. This nanoGPT uses ReLU; GPT-2/BERT use GELU; LLaMA uses SwiGLU.',
    accent: ACCENT.amber,
    durationMs: 19000,
    part: 'ffn',
    details: `After W₁ expands the token vector into many hidden coordinates, the activation function decides — per coordinate — how strongly that hidden feature actually fires. It's the gate at the center of "expand → fire → compress" from Scene 13, and it's what determines whether the feature detectors from Scene 14 turn on softly, sharply, or not at all.

This nanoGPT uses ReLU — clip hard at zero, simple and fast. ReLU throws away gradient below zero (the "dying ReLU" issue), but it's cheap and works well at this scale.

GELU (Gaussian Error Linear Unit) is the smooth variant used in BERT and GPT-2: it weighs inputs by a probability-like curve so small negatives leak through. Swish (x · σ(x)) is nearly identical and easier to compute.

The deeper reason this step exists at all: without a nonlinearity between W₁ and W₂, the two matrices would just multiply into one — W₂(W₁x) = (W₂W₁)x. The activation is the *only* reason the FFN is more expressive than a single linear map.

Modern LLMs (LLaMA, PaLM, Mistral) push further with gated variants like SwiGLU: two parallel projections multiplied through Swish before W₂. Slightly better loss per parameter, which is why it became the default. Covered in Scene 32.`,
    render: () => <FFNGeluSplitPane />,
    panelAnchor: 'fullscreen',
  },

  // =============== ACT III — THE FULL STACK ===============
  {
    id: 'act3-intro',
    section: ACT_III,
    breadcrumb: ['Stack of 6'],
    kicker: 'act three',
    title: 'That block, six times over.',
    caption: 'Zoom back out. The block we just studied is the whole recipe — repeated six times, with one residual stream climbing through it all.',
    accent: ACCENT.cyan,
    durationMs: 12000,
    details: `Act II was a deep dive into a single transformer block: LayerNorm, multi-head attention, FFN, two residual adds. Act III zooms back out. The full transformer is just that block, stacked six times. The signal — a 384-dim vector per token — climbs through every one of them, gathering refinements along the way.

Six blocks in our tiny model. GPT-2 Small had 12. GPT-2 XL had 48. GPT-4 reportedly ~120. Depth is the only knob; the recipe is fixed.`,
    render: () => <ActIIIIntroSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'stack',
    section: ACT_III,
    breadcrumb: ['Stack of 6', 'One signal climbing'],
    bridgeIn: 'That single block — repeated six times. Same recipe, deeper meaning each pass.',
    focusedToken: 1,
    wide: true,
    kicker: 'residual stack',
    title: 'Stack six blocks.',
    caption:
      'Every block adds to the same running vector — never overwrites. Information flows up through the residual stream.',
    accent: ACCENT.cyan,
    durationMs: 23000,
    part: 'stack',
    details: `Six blocks in our tiny model. GPT-2 Small had 12. GPT-2 XL had 48. GPT-4 has "many more" (unknown, but reportedly ~120).

Every block uses the residual stream pattern: its output is ADDED to the input, not replaced. This means early features survive all the way to the top, and gradients can flow straight from the final loss back to block 0 without getting attenuated through many multiplications.

Each block asks "given what I just read, what's a better representation?" and nudges the running vector in that direction. Stacking more blocks = more nudges = more complex reasoning.`,
    render: () => <StackSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'sample',
    section: ACT_III,
    breadcrumb: ['Output', 'Next-token pick'],
    bridgeIn: 'After all six blocks, the final vector becomes a probability over the vocabulary.',
    focusedToken: 1,
    wide: true,
    kicker: 'softmax + sampling',
    title: 'Pick the next token.',
    caption:
      'Unembed → ≈50K logits → softmax → temperature → sampled next BPE token. Drag the slider.',
    accent: ACCENT.red,
    durationMs: 27000,
    part: 'sample',
    details: `After the final block, one more linear layer (the "unembedding", shape [d_model × vocab]) projects into vocabulary-space. The output has one logit per vocab entry. Softmax turns logits into probabilities. Sampling picks one token — usually argmax (greedy), top-k, top-p (nucleus), or temperature-adjusted random draw.

Temperature scales the logits before softmax. T=0 means greedy; T=1 means "trust the distribution"; T>1 flattens probabilities and makes output more random; T<1 sharpens them.

The sampled token is then APPENDED to the input sequence and fed back into the model for the next step.`,
    render: () => <SampleSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'kvcache',
    section: ACT_III,
    breadcrumb: ['Stack of 6', 'KV cache'],
    bridgeIn: 'Generation runs one token at a time. The KV cache makes that cheap to repeat.',
    wide: true,
    kicker: 'kv cache',
    title: 'One new row per step.',
    caption:
      'Autoregressive generation in O(N) instead of O(N²). Only compute K and V for the new token; reuse everything else.',
    accent: ACCENT.mint,
    durationMs: 25000,
    promptAware: true,
    part: 'kvcache',
    details: `Without caching, generating each new token requires re-running attention over the entire sequence so far — O(N²) work per token. With a KV cache, the keys and values for prior tokens are stored once and reused.

Only the NEW token's Q, K, V get computed each step. The old K and V columns stay in the cache. Attention attends from the new Q to the full (cached + new) K and V.

This is the single biggest optimization behind fast generation. It's also why context length costs so much memory — the cache grows linearly with sequence length.

Note: this educational nanoGPT does NOT implement KV caching. Its generate() loop re-runs the full forward pass on the truncated context every step. Production inference engines (vLLM, TGI, llama.cpp) all do what's shown here.`,
    render: () => <KVCacheSplitPane />,
    panelAnchor: 'fullscreen',
  },

  // =============== ACT IV — TRAINING (LOSS → BACKPROP → GD) ===============
  {
    id: 'act4-intro',
    section: ACT_IV,
    kicker: 'act four',
    title: 'How the weights got there.',
    caption: 'The model above was trained. Here is what "trained" means.',
    accent: ACCENT.amber,
    durationMs: 14000,
    details: `Training means: run a forward pass, measure how wrong the prediction was (loss), compute which weights are to blame (backprop), nudge them slightly (gradient descent). Repeat a few hundred thousand times.`,
    render: () => <Act4IntroSplitPane />,
    panelAnchor: 'fullscreen',
  },
  // ── LOSS ──
  {
    id: 'loss',
    section: ACT_IV,
    bridgeIn: 'Now measure how wrong the prediction was. One simple formula: −log(p).',
    kicker: 'cross-entropy',
    title: 'How wrong is the guess?',
    subGroup: { label: 'loss · per-example', index: 1, total: 3, color: ACCENT.red },
    caption:
      'Loss = −log( p(correct token) ). Low when confident and right, huge when confident and wrong.',
    accent: ACCENT.red,
    durationMs: 19000,  // 3 × 5.33s
    part: 'loss',
    details: `Cross-entropy loss: given the model's predicted probability p for the true next token, the loss is −log(p). If the model put 100% probability on the correct token, loss = 0. If it put 50%, loss ≈ 0.69. If it put 1%, loss ≈ 4.6. The worse the model, the bigger the loss.

Equivalently: loss measures how many bits of surprise the true token carried given the model's distribution. We want to minimize that surprise.

This scalar is the only number backprop cares about. Every weight in the model gets nudged based on its contribution to this one number.`,
    render: () => <CrossEntropySplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'loss-seq',
    section: ACT_IV,
    bridgeIn: 'Every position predicts the next token — every position gets its own loss.',
    kicker: 'loss · per-position',
    title: 'Every position gets its own loss.',
    subGroup: { label: 'loss · per-position', index: 2, total: 3, color: ACCENT.red },
    caption:
      'A length-T sequence produces T separate predictions in parallel. Losses average into L_seq.',
    accent: ACCENT.red,
    // 3 phases × 5500ms = 16.5s for one full cycle (the earlier audit
    // misreported this as 12s — re-verified against the setInterval).
    // 17s = ~1.03 cycles so L_seq has time to land before the cut.
    durationMs: 17000,
    part: 'loss',
    details: `A length-T sequence produces T separate next-token predictions in parallel (thanks to causal masking — the model can't cheat by looking ahead). Each position has its own prediction and its own target; you compute cross-entropy at every position and average.

This is called "teacher forcing" during training. The model sees the true tokens at positions 0..i−1 and is asked to predict position i. Then the loss for position i gets averaged with losses for every other position in the sequence.

Result: one scalar loss per sequence, computed efficiently in a single forward pass.`,
    render: () => <CELossSeqSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'loss-batch',
    section: ACT_IV,
    bridgeIn: 'Stack all per-sequence losses; the mean across the batch is what training optimizes.',
    kicker: 'loss · batch mean',
    title: 'Average across the batch.',
    subGroup: { label: 'loss · per-batch', index: 3, total: 3, color: ACCENT.red },
    caption:
      'GPU crunches B sequences in parallel. Their losses average into ONE scalar — that is what backprop runs on.',
    accent: ACCENT.red,
    durationMs: 19000,
    part: 'loss',
    details: `GPUs process many sequences in parallel (the "batch"). Every sequence produces its own length-T loss vector (previous scene). Average those into one scalar per sequence, then average across the batch to get one scalar per training step.

That ONE scalar is what drives gradient descent. Backprop starts from this number and walks backward through the network, computing ∂loss/∂w for every parameter.

Batch size matters: bigger batches give less noisy gradients but each step costs more compute. Most frontier models use batch sizes in the hundreds to tens of thousands of sequences.`,
    render: () => <CELossBatchSplitPane />,
    panelAnchor: 'fullscreen',
  },

  // ── BACKPROP (comes before GD — it COMPUTES the gradient GD uses) ──
  {
    id: 'backprop',
    section: ACT_IV,
    bridgeIn: 'From that one scalar, walk backward through every layer to find what each weight is to blame for.',
    kicker: 'backpropagation',
    title: 'The gradient flows back.',
    subGroup: { label: 'backprop · overview', index: 1, total: 3, color: ACCENT.red },
    caption:
      'Given the loss, walk the chain rule backward to compute ∂L/∂W for every weight in every layer.',
    accent: ACCENT.red,
    // 21s → 24s — dive starts at 18s and settles at ~20.4s; extra 3s
    // gives the "ZOOM INTO BLOCK 0 · LOCAL JACOBIAN" caption time to
    // land before cut to scene 25 (bp-jacobian).
    durationMs: 24000,
    part: 'backprop',
    details: `Backpropagation is the chain rule applied mechanically through a computation graph. For each operation, you know the local Jacobian ∂output/∂input. Starting from the loss (where ∂loss/∂loss = 1), multiply Jacobians backward, accumulating ∂loss/∂each_intermediate as you go.

By the end, you have ∂loss/∂w for every weight w. Gradient descent then nudges each w in the opposite direction of its gradient.

Modern autodiff libraries (PyTorch, JAX) build this graph automatically from the forward pass. You write numpy-like code, they track it, and backprop "just works".`,
    render: () => <BackpropSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'bp-jacobian',
    section: ACT_IV,
    bridgeIn: 'Each layer has a sensitivity map — its Jacobian — that the gradient gets multiplied by on the way back.',
    kicker: 'local jacobian',
    title: 'What each layer contributes.',
    subGroup: { label: 'backprop · one layer', index: 2, total: 3, color: ACCENT.amber },
    caption:
      'For y = σ(W·x + b), the Jacobian ∂y/∂x is what gets multiplied into the gradient flowing back. Cell-by-cell math.',
    accent: ACCENT.amber,
    durationMs: 21000,
    part: 'backprop',
    details: `Every layer y = f(x, w) has two Jacobians: ∂y/∂x (how the output changes when the input changes) and ∂y/∂w (how the output changes when the weights change). Backprop multiplies the incoming gradient ∂loss/∂y by ∂y/∂x to get ∂loss/∂x (passed to the previous layer) and by ∂y/∂w to get ∂loss/∂w (used to update this layer's weights).

For a matrix multiply y = W·x, both Jacobians are just matrix multiplies themselves. For a nonlinearity like GELU, the Jacobian is diagonal.

The beauty of backprop: every layer only needs to know its own local Jacobian. The chain rule handles the rest.`,
    render: () => <BpJacobianSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'bp-accum',
    section: ACT_IV,
    bridgeIn: 'Across all examples in the batch, gradients disagree. Average them into one cleaner update.',
    kicker: 'gradient accumulation',
    title: 'Gradients average across the batch.',
    subGroup: { label: 'backprop · batched', index: 3, total: 3, color: ACCENT.mint },
    caption:
      'Every example produces its own ∇W. They average into a single update direction. One step per batch.',
    accent: ACCENT.mint,
    durationMs: 20000,
    part: 'backprop',
    details: `Every example in the batch produces its own gradient ∇W. These are SUMMED (or averaged, depending on convention) to get the batch gradient. One optimizer step uses the batch gradient, not any single example's.

This is why batching works: noisy per-example gradients average into a cleaner batch gradient that points in a more reliable direction. Larger batches = lower-variance gradient = potentially larger learning rate.

"Gradient accumulation" in practice also refers to splitting a big logical batch across multiple forward passes when the GPU can't fit the whole batch in memory. Same math, different mechanics.`,
    render: () => <BpAccumulationSplitPane />,
    panelAnchor: 'fullscreen',
  },

  // ── GRADIENT DESCENT (applies the ∇W backprop just computed) ──
  {
    id: 'training',
    section: ACT_IV,
    bridgeIn: 'With that averaged gradient in hand, take a tiny step downhill. Loss shrinks a bit.',
    kicker: 'gradient descent',
    title: 'Roll down the loss hill.',
    subGroup: { label: 'GD · ideal', index: 1, total: 3, color: ACCENT.mint },
    caption:
      'Step a tiny amount opposite to ∇W. Repeat millions of times. Every W matrix is shaped by this.',
    accent: ACCENT.mint,
    durationMs: 19000,
    part: 'gradient-descent',
    details: `Gradient descent repeats forever: compute loss, backprop to get gradient, subtract (learning_rate · gradient) from every weight. Each step is a tiny nudge of every parameter in the direction that should reduce the loss.

Total training runs are measured in steps, not epochs. GPT-3 trained for ~100k steps. LLaMA-2 trained for ~2M. Each step touches every weight in the model.

The loss landscape is wildly non-convex — it has billions of dimensions, saddle points everywhere, and local minima. But in practice, SGD + momentum + learning rate schedules finds models that generalize well, for reasons we don't fully understand.`,
    render: () => <GradientDescentSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'gd-ravine',
    section: ACT_IV,
    bridgeIn: 'But real loss landscapes are not bowls. Narrow ravines make a single learning rate zig-zag.',
    kicker: 'gd · narrow ravine',
    title: 'Why vanilla GD zig-zags.',
    subGroup: { label: 'GD · realistic', index: 2, total: 3, color: ACCENT.mint },
    caption:
      'Same step size in every direction. Too small = crawls. Too big = explodes. Fixed learning rates zig-zag in a ravine — this is why Adam exists.',
    accent: ACCENT.red,
    durationMs: 19000,
    part: 'gradient-descent',
    details: `Real loss landscapes aren't smooth bowls — they're narrow ravines. The gradient in the steep direction dominates, so plain gradient descent zig-zags across the walls instead of following the valley floor down.

Reducing the learning rate helps in the steep direction but slows progress down the length of the ravine. You want different learning rates in different directions — which plain GD can't provide.

This is exactly what motivated Adam and other adaptive optimizers.`,
    render: () => <GdRavineSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'gd-adam',
    section: ACT_IV,
    bridgeIn: 'Adam tracks gradient variance per weight and scales the step accordingly — straight down the ravine.',
    kicker: 'optimizer · Adam',
    title: 'Adam fixes the ravine.',
    subGroup: { label: 'GD · modern', index: 3, total: 3, color: ACCENT.mint },
    caption:
      'Adam tracks running moments of the gradient. Per-weight effective learning rate → straight shot to the minimum.',
    accent: ACCENT.cyan,
    durationMs: 23000,
    part: 'gradient-descent',
    details: `Adam keeps running estimates of two quantities per parameter: the first moment (mean) and second moment (variance) of the gradient. It divides the raw gradient by √variance so small-gradient directions (like the ravine floor) get a proportionally larger step.

Effect: per-parameter adaptive learning rates, automatic damping in high-curvature directions, smooth progress down the ravine. Adam isn't magic — it's just the right preconditioner for most deep-learning loss landscapes.

Modern variants: AdamW (decouples weight decay), Lion (uses sign only, cheaper memory), Shampoo (block-diagonal second-order info). All build on the same idea.`,
    render: () => <GdAdamSplitPane />,
    panelAnchor: 'fullscreen',
  },

  // =============== ACT V — MODERN UPGRADES ===============
  {
    id: 'act5-intro',
    section: ACT_V,
    kicker: 'act five',
    title: 'Same skeleton. Smarter parts.',
    caption: 'A glassy cutaway of the transformer block, with four upgrade badges (RoPE, RMSNorm, SwiGLU, GQA) wired into the parts they replace.',
    accent: ACCENT.mint,
    // 14s → 17s — pre-title bridge plays 0–2.4s, four upgrade callouts
    // stagger in until ~3.5s, then dive at 11.5s settles at ~13.7s. Adds
    // ~3s of hold on the attention slot before cut to scene 31 (rope).
    durationMs: 17000,
    details: `Act V is a roadmap, not a rewrite. The transformer block you just walked through still describes today's LLMs: residual stream → norm → attention → add → norm → FFN → add. Modern models swap a handful of internals: RoPE for position handling on Q/K, RMSNorm for cheaper normalization, SwiGLU for a gated FFN activation, and GQA for shared K/V across head groups.`,
    render: () => <Act5IntroSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'rope',
    section: ACT_V,
    bridgeIn: 'Modern transformers don’t add position; they rotate Q and K instead. Relative position falls out for free.',
    kicker: 'rotary position',
    title: 'Rotate, don’t add.',
    caption:
      'Old PE: token + position. RoPE: rotate Q and K by position. Relative offset (j − i) falls out of Q · K for free.',
    accent: ACCENT.pink,
    durationMs: 21000,
    part: 'modern',
    details: `RoPE ("rotary position embedding") replaces additive sinusoidal position encodings with multiplicative rotations. For each position p, rotate the Q and K vectors by an angle proportional to p before computing Q·K.

The key property: the dot product between Q at position i and K at position j depends only on their RELATIVE position (j − i), not their absolute positions. That's exactly what attention wants — "how far apart are we?" not "where am I on the number line?"

RoPE also extrapolates better to longer sequences than training length, which matters for long-context models (100k–1M tokens).`,
    render: () => <RopeSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'modern',
    section: ACT_V,
    bridgeIn: 'RoPE was one swap. Three more — RMSNorm, SwiGLU, GQA — finish the modern toolkit.',
    kicker: 'modern upgrades',
    title: 'Three more surgical upgrades.',
    subGroup: { label: 'comparisons', index: 3, total: 3, color: ACCENT.mint },
    caption:
      'RoPE was Scene 31. Three swaps left: LayerNorm → RMSNorm, GELU MLP → SwiGLU MLP, MHA → GQA. Same skeleton, smaller/faster/more stable internals.',
    accent: ACCENT.mint,
    // 27s → 30s — phase cycle is 3 × 9s = 27s; "next · what does it
    // actually output?" handoff line fades in 6s into phase 2 (i.e. at
    // 24s scene-time). Extra 3s gives the handoff message 6s of visible
    // hold before the cut to act6-intro.
    durationMs: 30000,
    part: 'modern',
    details: `Three tweaks appear in almost every frontier open-source model:

RMSNorm: drop the mean-subtraction in LayerNorm. Fewer norm operations, with strong training stability in practice.

SwiGLU: replace the MLP's single activation with a gated pair — SiLU(W_gate·x) ⊙ (W_up·x), then a W_down projection back to hidden_dim. Adds a third projection, so to keep total params comparable, the intermediate width is usually scaled down (e.g. (8/3)·d instead of 4·d). Improves quality per compute/parameter.

GQA (grouped-query attention): instead of N Q/K/V heads, use N query heads but a smaller number G of K/V heads. The KV cache scales with K/V heads, so going from N to G shrinks it by ~N/G. Used by LLaMA-2 and most frontier open models.

Stacked together, these changes give a faster, smaller, slightly better model with no architecture change.`,
    render: () => <ModernSplitPane />,
    panelAnchor: 'fullscreen',
  },

  // =============== ACT VI — THE OUTPUT ===============
  {
    id: 'act6-intro',
    section: ACT_VI,
    kicker: 'act six',
    title: 'And the final pick.',
    caption:
      'Last hidden state → output head → logits → softmax → one sampled token. Then it gets appended to your prompt.',
    accent: ACCENT.mint,
    durationMs: 20000,
    promptAware: true,
    details: `The top of the stack produces one vector per token position. We only care about the last one — it represents the model's best guess at what should come next. A final linear layer projects that vector to a vector of size vocab_size; softmax turns it into probabilities; we sample one.

A forward pass does NOT output a sentence. It outputs a probability distribution over the next token, and one token gets selected. Scene 34 shows what happens when you run that loop over and over.`,
    render: () => <Act6IntroSplitPane />,
    panelAnchor: 'fullscreen',
  },
  {
    id: 'output',
    section: ACT_VI,
    breadcrumb: ['Output', 'Generation loop'],
    bridgeIn: 'Each decode pass produces one token. Each token kicks off another pass. Forever.',
    kicker: 'the generation',
    title: 'Generation = one token at a time.',
    caption:
      "Scene 34 in motion. Each decode step runs through the blocks, selects one next token, appends it to the context, and repeats. With the default prompt, it lands on Hamlet's line.",
    accent: ACCENT.mint,
    durationMs: 28000,
    promptAware: true,
    part: 'generation',
    details: `Everything you just saw runs ONCE per generated token. Tokenize the prompt, embed, add positional, six residual blocks, unembed, softmax, sample. That's one forward pass.

Append the sampled token to the prompt, run again. Repeat until a stop condition (end-of-text token, max length, user interrupt).

With KV caching, the second pass is MUCH cheaper than the first: only the new token's work is done from scratch; everything else is cached.

This loop is how ChatGPT, Claude, and every other LLM generates text. Scale up the model, train longer, and the same loop produces surprisingly coherent long-form output.`,
    render: () => <OutputSplitPane />,
    panelAnchor: 'fullscreen',
  },
]
