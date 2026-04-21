"""Schema for activations.json — the capture of one forward pass.

This file is the API contract between the model track (Phase 1.5) and the
visualizer track (Phase 2). Keep it stable.

All tensors are plain nested Python lists of floats (JSON-serializable).
Shape conventions use single-sequence capture (B=1):
    T       = sequence length (tokens)
    V       = vocab_size
    C       = n_embd (residual-stream width)
    H       = n_head
    d_k     = C // H (per-head key/query/value width)
"""
from __future__ import annotations

from typing import TypedDict


# --- per-layer ----------------------------------------------------------------

class AttentionCapture(TypedDict):
    """Everything the viz needs to render one attention sub-layer."""
    q: list           # [H, T, d_k]
    k: list           # [H, T, d_k]
    v: list           # [H, T, d_k]
    scores: list      # [H, T, T] pre-softmax, causally masked (-inf upper tri)
    weights: list     # [H, T, T] post-softmax, each row sums to 1
    out: list         # [T, C]    after concat + output proj + dropout


class FeedForwardCapture(TypedDict):
    """Everything the viz needs to render one FFN sub-layer."""
    pre_act: list     # [T, 4C] after fc1, before ReLU
    post_act: list    # [T, 4C] after ReLU
    out: list         # [T, C]  after fc2 + dropout


class BlockCapture(TypedDict):
    """One transformer block: ln1 → attn → residual → ln2 → ffn → residual."""
    ln1: list                     # [T, C] input to attention
    attn: AttentionCapture
    resid_mid: list               # [T, C] x + attn(ln1(x))
    ln2: list                     # [T, C] input to FFN
    ffn: FeedForwardCapture
    resid_out: list               # [T, C] block output


# --- top level ----------------------------------------------------------------

class ModelMeta(TypedDict):
    vocab_size: int
    n_embd: int
    n_head: int
    n_layer: int
    block_size: int
    d_k: int


class RunMeta(TypedDict):
    prompt: str
    prompt_token_ids: list[int]    # length T_prompt
    generated_token_ids: list[int] # length T_generated (excludes prompt)
    temperature: float
    top_k: int | None
    seed: int | None


class Capture(TypedDict):
    """Top-level shape of activations.json."""
    schema_version: str
    model: ModelMeta
    run: RunMeta

    # Vocabulary for the viz to display tokens as glyphs.
    vocab: list[str]               # length V; vocab[i] is the decoded char

    # Single forward pass over the full token sequence (prompt + generated).
    tokens: list[int]              # length T = T_prompt + T_generated
    token_strs: list[str]          # length T; tokens decoded one-by-one

    token_emb: list                # [T, C] from TokenEmbedding
    pos_emb: list                  # [T, C] from PositionalEmbedding
    embed_sum: list                # [T, C] token_emb + pos_emb (input to blocks)

    blocks: list[BlockCapture]     # length n_layer

    ln_f: list                     # [T, C] final layernorm output
    logits: list                   # [T, V] pre-softmax logits
    probs_last: list               # [V]   softmax of logits[-1] (for temperature=1)


SCHEMA_VERSION = "0.1.0"
