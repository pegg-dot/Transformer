/**
 * Mirrors model/capture_schema.py — activations.json shape.
 *
 * Shape conventions (single-sequence capture, B=1):
 *   T   = sequence length (tokens)
 *   V   = vocab_size
 *   C   = n_embd (residual-stream width)
 *   H   = n_head
 *   d_k = C / H
 */

export type Matrix = number[][]
export type Matrix3D = number[][][]

export interface AttentionCapture {
  q: Matrix3D        // [H, T, d_k]
  k: Matrix3D        // [H, T, d_k]
  v: Matrix3D        // [H, T, d_k]
  scores: Matrix3D   // [H, T, T]
  weights: Matrix3D  // [H, T, T]
  out: Matrix        // [T, C]
}

export interface FeedForwardCapture {
  pre_act: Matrix    // [T, 4C]
  post_act: Matrix   // [T, 4C]
  out: Matrix        // [T, C]
}

export interface BlockCapture {
  ln1: Matrix                 // [T, C]
  attn: AttentionCapture
  resid_mid: Matrix           // [T, C]
  ln2: Matrix                 // [T, C]
  ffn: FeedForwardCapture
  resid_out: Matrix           // [T, C]
}

export interface ModelMeta {
  vocab_size: number
  n_embd: number
  n_head: number
  n_layer: number
  block_size: number
  d_k: number
}

export interface RunMeta {
  prompt: string
  prompt_token_ids: number[]
  generated_token_ids: number[]
  temperature: number
  top_k: number | null
  seed: number | null
}

export interface Capture {
  schema_version: string
  model: ModelMeta
  run: RunMeta
  vocab: string[]
  tokens: number[]
  token_strs: string[]
  token_emb: Matrix       // [T, C]
  pos_emb: Matrix         // [T, C]
  embed_sum: Matrix       // [T, C]
  blocks: BlockCapture[]  // length n_layer
  ln_f: Matrix            // [T, C]
  logits: Matrix          // [T, V]
  probs_last: number[]    // [V]
}

/** Runtime vocab file — viz/public/vocab.json */
export interface VocabFile {
  vocab_size: number
  itos: string[]
  stoi: Record<string, number>
}

/** One step of live generation (returned by generate()). */
export interface GenerationStep {
  nextTokenId: number
  nextTokenStr: string
  logits: Float32Array       // [V]
  probs: Float32Array        // [V] softmax applied at temperature
  topK: Array<{ id: number; str: string; prob: number }>
  contextIds: number[]       // tokens fed to this forward pass
  step: number
}
