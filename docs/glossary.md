# Glossary

Every term you need to hold your own in a VC or researcher conversation. One entry = one tight explanation + the question someone might ask you about it.

Organized by order of appearance in the build. Read as you go — don't try to absorb it all upfront.

---

## Phase 1 terms

**Tokenization.** Splitting raw text into discrete units (tokens) that the model consumes. Can be characters, words, or subword pieces (BPE). Char-level is simplest; BPE is what real models use.
*Gotcha:* Why is BPE better than word-level? → Words have a long tail; rare words become `<unk>` and you lose information. BPE keeps the vocab small but never drops info.

**Token embedding.** A lookup table (`nn.Embedding`) that maps each token ID to a vector. The vector is learned. Shape: `(vocab_size, d_model)`.

**Positional embedding.** Because self-attention is order-invariant, we add position info to each token embedding. Classic GPT uses learned positional embeddings; Llama 3 uses RoPE.
*Gotcha:* What happens if we remove positional embeddings? → The model sees tokens as a bag (set), not a sequence. "Dog bites man" and "man bites dog" become identical inputs.

**Self-attention.** Each token looks at every other token (or earlier tokens, in causal attention) and asks: "how relevant is each of you to me?" It builds its new representation as a weighted sum of other tokens' values.

**Query (Q), Key (K), Value (V).** Three linear projections of the input. Intuition: Q is what each token *asks for*, K is what each token *advertises*, V is the content delivered if chosen. Attention score = `softmax(QK^T / √d_k)`. Output = scores × V.
*Gotcha:* Why divide by √d_k? → Without it, dot products grow with dimension, pushing softmax into saturated regions where gradients vanish. Scaling keeps variance stable.

**Causal mask.** For autoregressive generation, token *t* must not see tokens *t+1, ...* (would be cheating during training). We mask the upper triangle of the attention matrix with `-inf` before softmax.
*Gotcha:* Why −inf and not 0? → Softmax: `e^(-inf) = 0`. Setting to 0 pre-softmax doesn't suppress the contribution.

**Multi-head attention.** Instead of one big attention op, split Q/K/V into `h` heads, run attention in parallel, concat outputs, project. Each head learns a different kind of relationship.
*Gotcha:* Why multiple small heads vs one big head? → Different heads learn different semantic relationships (syntax, coref, topic). Empirically works better; Anthropic's interpretability work has mapped specific heads to specific behaviors.

**Residual connection.** `x = x + sublayer(x)`. Without residuals, deep transformers won't train — gradients vanish. Residuals create a "highway" from input to output that gradients flow through cleanly.

**LayerNorm (LN).** Normalizes each token's activation vector (mean 0, variance 1) with learnable scale and shift. Stabilizes training. Classic GPT uses LN; Llama 3 uses RMSNorm.

**FFN / MLP (feed-forward network).** Two-layer MLP applied to each token independently after attention. Usually `d_model → 4·d_model → d_model`. Where per-token "thinking" happens.

**Transformer block.** The repeating unit: `x → LN → attention → + residual → LN → FFN → + residual`. Stack N of these.

**Logits.** Raw unnormalized scores over the vocabulary at each output position. Shape: `(batch, seq_len, vocab_size)`. Feed to softmax to get probabilities.

**Cross-entropy loss.** For language modeling: `-log P(correct_next_token)`. Train by pushing the model to assign higher probability to the actual next token.

**Perplexity.** `exp(cross_entropy)`. Intuitive: "how many tokens is the model choosing between uniformly?" Lower is better. GPT-2 small got ~30 on WikiText; frontier models are <5.

**Greedy decoding.** Always take the argmax. Deterministic but repetitive and bland.

**Temperature.** Divides logits before softmax. `T<1` sharpens (more deterministic); `T>1` flattens (more random). `T=0` is effectively greedy.

**Top-k sampling.** Sample only from the k most likely tokens. Cuts the long tail of nonsense.

**Top-p (nucleus) sampling.** Sample from the smallest set of tokens whose cumulative probability exceeds p. Adaptive.

---

## Phase 3 terms (modernizing to Llama 3)

**RoPE (Rotary Position Embedding).** Instead of adding positional vectors, RoPE rotates query and key vectors by an angle proportional to their position. Relative positions emerge naturally from the geometry.
*Gotcha:* Why is RoPE better than learned positional embeddings? → (1) Extrapolates to longer contexts than trained on. (2) Encodes relative position directly — what actually matters.

**SwiGLU.** FFN variant: `(Swish(xW) ⊙ xV) W_out`. Gated, three matrices instead of two. Empirically stronger than vanilla FFN.

**RMSNorm.** LayerNorm without mean-centering, just re-scaling by root-mean-square. Cheaper, similar quality.

**GQA (Grouped Query Attention).** Between MHA (every head has its own K/V) and MQA (all heads share one K/V): groups of heads share K/V. Sweet spot between quality and memory.

**KV cache.** During autoregressive generation, K and V for previous tokens don't change — cache them instead of recomputing. Makes generation O(n) instead of O(n²).
*Gotcha:* Why only K and V, not Q? → Only Q_t (the new token attending to everything) matters at step t. Q for earlier tokens is never re-used.

---

## Phase 4 terms (fine-tuning)

**SFT (Supervised Fine-Tuning).** Train the base model on (prompt, completion) pairs.

**LoRA (Low-Rank Adaptation).** Freeze base weights, insert small trainable low-rank matrices (`W + BA`, B is `d×r`, A is `r×d`, `r << d`). Cuts trainable params by 1000x+.

**QLoRA.** LoRA + 4-bit quantization of the base model. Fine-tune 7B models on a consumer GPU.

**Unsloth.** Open-source library making LoRA/QLoRA fine-tuning 2–5x faster via CUDA kernel optimizations. Industry standard.

---

## Phase 5 terms (RLVR / GRPO)

**RLHF (RL from Human Feedback).** Train a reward model on human preference pairs, then RL-tune the LLM against that reward. How ChatGPT was aligned.

**DPO (Direct Preference Optimization).** Skip the reward model — optimize directly from preference pairs.

**RLVR (RL with Verifiable Rewards).** Reward comes from ground-truth check (does math match? do tests pass?). No reward model, no human labels. Key to DeepSeek R1's reasoning breakthrough.

**GRPO (Group Relative Policy Optimization).** Efficient policy-gradient method from DeepSeekMath. Generates a group of completions per prompt, normalizes rewards within the group, skips the value function entirely.

---

## Meta-AI terms worth knowing

**MoE (Mixture of Experts).** N FFN "experts" per layer, router picks top-k per token. Scales parameters without scaling compute per token. DeepSeek V3 and Mixtral use this.

**Mamba / state-space models.** Transformer alternative based on SSMs. Linear in sequence length.

**Scaling laws.** Kaplan (2020), Chinchilla (2022) — relationships between params, data, compute, and loss. Chinchilla: for a fixed compute budget, bigger isn't always better.

**Test-time compute / reasoning models.** Letting the model think longer at inference improves quality on hard problems. o1, DeepSeek R1.

**Constitutional AI.** Anthropic's alignment approach — use written principles and AI-generated critiques to refine the model.

---

*Add to this file as new concepts come up during the build.*
