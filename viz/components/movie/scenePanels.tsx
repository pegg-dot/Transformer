'use client'

import { Panel, Eq, RoleRow, Bullet, Numbers, PhasePill } from './panelKit'

const ACCENT = {
  blue: '#60a5fa',
  violet: '#a78bfa',
  mint: '#34d399',
  amber: '#f59e0b',
  red: '#f87171',
  gold: '#fbbf24',
  cyan: '#22d3ee',
}

/* ─────────── Act II — QKV ─────────── */
export function PanelQKV() {
  return (
    <Panel
      kicker="Block 0 · Attention · Q K V"
      title="One vector, three roles."
      subtitle="Three small linear projections turn the same residual into three vectors with different jobs."
      accent={ACCENT.blue}
    >
      <Eq accent={ACCENT.blue} caption="three independent linear projections of x">
        Q = x W<sub>Q</sub> &nbsp; K = x W<sub>K</sub> &nbsp; V = x W<sub>V</sub>
      </Eq>
      <RoleRow label="Q" accent={ACCENT.blue} delay={0.35}
        text={<>“What am I asking?” The query each token sends out to look around.</>} />
      <RoleRow label="K" accent={ACCENT.red} delay={0.5}
        text={<>“What do I offer?” The key each token broadcasts so others can find it.</>} />
      <RoleRow label="V" accent={ACCENT.mint} delay={0.65}
        text={<>“What do I carry?” The value that gets mixed into the answer.</>} />
      <Numbers chips={[
        { label: 'd', value: '384' },
        { label: 'd_k', value: '64', color: ACCENT.amber },
        { label: 'heads', value: '6' },
        { label: 'params · per matrix', value: '147 K' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act II — FFN ─────────── */
export function PanelFFN() {
  return (
    <Panel
      kicker="Block 0 · FFN"
      title="Expand. Fire. Compress."
      subtitle="Each token's vector is independently lifted into a wider space, mashed by a non-linearity, and squeezed back."
      accent={ACCENT.amber}
    >
      <Eq accent={ACCENT.amber} caption="a 2-layer MLP applied per token (independent of others)">
        FFN(x) = W<sub>2</sub> · GELU(W<sub>1</sub> x)
      </Eq>
      <Bullet index={1} accent={ACCENT.amber} delay={0.4}>
        <strong>W₁</strong> projects up to 4d. Hidden width = 1536.
      </Bullet>
      <Bullet index={2} accent={ACCENT.gold} delay={0.55}>
        <strong>GELU</strong> fires only some hidden rows. The model decides which features matter for THIS token.
      </Bullet>
      <Bullet index={3} accent={ACCENT.mint} delay={0.7}>
        <strong>W₂</strong> compresses back down to d. Result added to the residual stream.
      </Bullet>
      <Numbers chips={[
        { label: 'd', value: '384' },
        { label: '4d hidden', value: '1536', color: ACCENT.amber },
        { label: 'params per FFN', value: '1.18 M' },
        { label: '~ % of model', value: '57%' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act II — LayerNorm ─────────── */
export function PanelLayerNorm() {
  return (
    <Panel
      kicker="Block 0 · LayerNorm"
      title="Re-center. Re-scale. Re-tilt."
      subtitle="Before each sublayer the activations get a controlled distribution, then learnable γ and β tune it."
      accent={ACCENT.blue}
    >
      <Eq accent={ACCENT.blue} caption="normalize per token, then affine-transform">
        LN(x) = γ · (x − μ) / σ + β
      </Eq>
      <RoleRow label="μ" accent={ACCENT.violet} delay={0.4}
        text={<>Mean across the 384 dims of one token's vector. Pulled to zero.</>} />
      <RoleRow label="σ" accent={ACCENT.violet} delay={0.55}
        text={<>Standard deviation across the same 384 dims. Pulled to one.</>} />
      <RoleRow label="γ β" accent={ACCENT.amber} delay={0.7}
        text={<>Learnable scale and shift. Two vectors of length 384, trained.</>} />
      <Numbers chips={[
        { label: 'norm dim', value: '384' },
        { label: 'γ params', value: '384' },
        { label: 'β params', value: '384' },
        { label: 'ε', value: '1e-5' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act I — Positional ─────────── */
export function PanelPositional() {
  return (
    <Panel
      kicker="Input · Positional"
      title="Position gets baked into the same vector."
      subtitle="A sin / cos pattern unique to each position is added directly to the embedding — no extra tensor downstream."
      accent={ACCENT.violet}
    >
      <Eq accent={ACCENT.violet} caption="the model receives x_pos = embed(token) + sinusoid(position)">
        x<sub>pos</sub> = embed + PE
      </Eq>
      <Bullet index={1} accent={ACCENT.violet} delay={0.4}>
        Even dims use <strong>sin(p · ω)</strong>, odd dims use <strong>cos(p · ω)</strong>.
      </Bullet>
      <Bullet index={2} accent={ACCENT.cyan} delay={0.55}>
        Frequencies are geometric: low ω at the top, high ω at the bottom. Lets the model recover both fine and coarse position.
      </Bullet>
      <Bullet index={3} accent={ACCENT.amber} delay={0.7}>
        Same pattern reused at every layer — there's no separate "position channel."
      </Bullet>
      <Numbers chips={[
        { label: 'd', value: '384' },
        { label: 'max pos', value: '256', color: ACCENT.violet },
        { label: 'frequencies', value: 'geometric' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act III — Sample ─────────── */
export function PanelSample() {
  return (
    <Panel
      kicker="Output · Next-Token Pick"
      title="Pick one character."
      subtitle="The top-of-stack vector projects to one logit per vocab entry, softmax becomes probabilities, one gets sampled."
      accent={ACCENT.gold}
    >
      <Eq accent={ACCENT.gold} caption="for the LAST position only — every step picks one char">
        p = softmax(W<sub>out</sub> · h<sub>last</sub> / T)
      </Eq>
      <Bullet index={1} accent={ACCENT.gold} delay={0.4}>
        <strong>Logits</strong> = top-of-stack vector × output projection. One number per vocab entry.
      </Bullet>
      <Bullet index={2} accent={ACCENT.amber} delay={0.55}>
        <strong>Softmax</strong> turns logits into a probability distribution that sums to 1.
      </Bullet>
      <Bullet index={3} accent={ACCENT.mint} delay={0.7}>
        <strong>Sample</strong> draws one. Argmax = greedy. Higher temperature = more randomness.
      </Bullet>
      <Numbers chips={[
        { label: 'vocab', value: '65', color: ACCENT.gold },
        { label: 'd', value: '384' },
        { label: 'temperature', value: '0.85' },
        { label: 'top-k', value: '40' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act III — KV cache ─────────── */
export function PanelKvCache() {
  return (
    <Panel
      kicker="Output · KV Cache"
      title="Recompute Q. Reuse K. Reuse V."
      subtitle="During generation each new step appends ONE row to the K and V archives — never recomputed for prior tokens."
      accent={ACCENT.mint}
    >
      <Eq accent={ACCENT.mint} caption="t = number of generated tokens">
        K<sub>cache</sub>, V<sub>cache</sub> ∈ ℝ<sup>t × d</sup>
      </Eq>
      <Bullet index={1} accent={ACCENT.blue} delay={0.4}>
        Each step the new token's <strong>Q</strong> is computed fresh against the existing cache.
      </Bullet>
      <Bullet index={2} accent={ACCENT.red} delay={0.55}>
        Its <strong>K</strong> and <strong>V</strong> get appended to the archive — one new row per step.
      </Bullet>
      <Bullet index={3} accent={ACCENT.amber} delay={0.7}>
        Without caching: O(n²) work per step. With caching: O(n).
      </Bullet>
      <Numbers chips={[
        { label: 'cache size', value: 't · d · 2', color: ACCENT.mint },
        { label: 'speedup', value: '~ n×' },
        { label: 'memory cost', value: 'linear' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act II — Attention ─────────── */
export function PanelAttention() {
  return (
    <Panel
      kicker="Block 0 · Attention"
      title="Q · Kᵀ · softmax · V."
      subtitle="Every token looks at every prior token, weighs them, and pulls in their values."
      accent={ACCENT.blue}
    >
      <Eq accent={ACCENT.blue} caption="scaled-dot-product attention, one head">
        Attn(Q,K,V) = softmax(Q Kᵀ / √d_k) V
      </Eq>
      <Bullet index={1} accent={ACCENT.blue} delay={0.4}>
        <strong>Q · Kᵀ</strong> — pairwise scores. T × T grid of "how much should i attend to j?"
      </Bullet>
      <Bullet index={2} accent={ACCENT.violet} delay={0.55}>
        <strong>÷ √d_k</strong> — keep variance under control before softmax.
      </Bullet>
      <Bullet index={3} accent={ACCENT.amber} delay={0.7}>
        <strong>softmax</strong> per row — each token's row sums to 1. Causal mask zeros future tokens.
      </Bullet>
      <Bullet index={4} accent={ACCENT.mint} delay={0.85}>
        <strong>· V</strong> — weighted average of value vectors becomes this token's update.
      </Bullet>
      <Numbers chips={[
        { label: 'd_k', value: '64', color: ACCENT.amber },
        { label: '√d_k', value: '8' },
        { label: 'mask', value: 'causal' },
        { label: 'rows sum', value: '1.000' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act II — Multi-head ─────────── */
export function PanelMulti() {
  return (
    <Panel
      kicker="Block 0 · Attention · Multi-head"
      title="Six heads, in parallel."
      subtitle="The same attention mechanism runs six times with different W_Q/W_K/W_V — each head specializes on a different relation."
      accent={ACCENT.blue}
    >
      <Eq accent={ACCENT.blue} caption="concat all heads, then project back to model width">
        MHA(x) = W_O · concat(head_1, …, head_h)
      </Eq>
      <Bullet index={1} accent={ACCENT.violet} delay={0.4}>
        Each head gets its own Q/K/V projections. They don't share weights.
      </Bullet>
      <Bullet index={2} accent={ACCENT.blue} delay={0.55}>
        Heads work on slimmer vectors — d/h instead of d. Width split, not depth duplicated.
      </Bullet>
      <Bullet index={3} accent={ACCENT.mint} delay={0.7}>
        Outputs concatenate back to d, then a final W_O linear mixes the head streams.
      </Bullet>
      <Bullet index={4} accent={ACCENT.amber} delay={0.85}>
        Different heads learn different jobs — syntax, position, named entities, etc.
      </Bullet>
      <Numbers chips={[
        { label: 'heads · h', value: '6', color: ACCENT.blue },
        { label: 'd / h', value: '64' },
        { label: 'd_model', value: '384' },
        { label: 'W_O · params', value: '147 K' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act III — Stack ─────────── */
export function PanelStack() {
  return (
    <Panel
      kicker="Stack of 6 · One Signal Climbing"
      title="Same recipe, six times."
      subtitle="The residual stream walks through six identical-shaped blocks. Each one rewrites the vector slightly. The signal climbs."
      accent={ACCENT.mint}
    >
      <Eq accent={ACCENT.mint} caption="residual updates, applied sequentially">
        x ← x + Attn(LN(x));  x ← x + FFN(LN(x))
      </Eq>
      <Bullet index={1} accent={ACCENT.blue} delay={0.4}>
        <strong>LayerNorm</strong> first — every sublayer reads a normalized version of the residual.
      </Bullet>
      <Bullet index={2} accent={ACCENT.violet} delay={0.55}>
        <strong>Attention adds</strong>, then <strong>FFN adds</strong>. The residual stream is a running sum of all rewrites so far.
      </Bullet>
      <Bullet index={3} accent={ACCENT.mint} delay={0.7}>
        Six blocks deep. Same structure each time. The token's representation gets richer as it climbs.
      </Bullet>
      <Bullet index={4} accent={ACCENT.amber} delay={0.85}>
        Skip-connections (the "+ x") let gradients flow back unchanged through any block.
      </Bullet>
      <Numbers chips={[
        { label: 'blocks · n_layer', value: '6', color: ACCENT.mint },
        { label: 'params · per block', value: '1.7 M' },
        { label: 'total · model', value: '10.79 M' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act I — Embed ─────────── */
export function PanelEmbed() {
  return (
    <Panel
      kicker="Input · Embedding"
      title="Each token becomes a vector."
      subtitle="The token ID indexes into a learned table. The matching row is a 384-dim vector — the model's view of that character."
      accent={ACCENT.violet}
    >
      <Eq accent={ACCENT.violet} caption="lookup, not multiplication — one table row per token">
        embed(t) = E[t, :]
      </Eq>
      <Bullet index={1} accent={ACCENT.violet} delay={0.4}>
        <strong>E ∈ ℝ<sup>V × d</sup></strong> — a learned matrix with one row per vocabulary entry.
      </Bullet>
      <Bullet index={2} accent={ACCENT.blue} delay={0.55}>
        Lookup is just indexing — almost free at inference.
      </Bullet>
      <Bullet index={3} accent={ACCENT.amber} delay={0.7}>
        Two tokens' rows can be close in vector space — the model has learned they're similar.
      </Bullet>
      <Numbers chips={[
        { label: 'vocab · V', value: '65', color: ACCENT.violet },
        { label: 'd', value: '384' },
        { label: 'embed params', value: '24.96 K' },
      ]} />
    </Panel>
  )
}

/* ─────────── Act IV — Loss ─────────── */
export function PanelLoss() {
  return (
    <Panel
      kicker="Training · Cross-Entropy"
      title="How wrong is the guess?"
      subtitle="Loss measures the surprise of the true next token under the model's distribution. Small when confident-and-right, huge when confident-and-wrong."
      accent={ACCENT.red}
    >
      <Eq accent={ACCENT.red} caption="negative log probability of the true target token">
        L = − log p(target)
      </Eq>
      <Bullet index={1} accent={ACCENT.red} delay={0.4}>
        100% on the target → loss = 0. Perfect.
      </Bullet>
      <Bullet index={2} accent={ACCENT.amber} delay={0.55}>
        50% → ≈ 0.69. Some surprise.
      </Bullet>
      <Bullet index={3} accent={ACCENT.violet} delay={0.7}>
        1% → ≈ 4.6. Confident and wrong.
      </Bullet>
      <Bullet index={4} accent={ACCENT.mint} delay={0.85}>
        Backprop only cares about this scalar. Every weight gets nudged by its gradient.
      </Bullet>
    </Panel>
  )
}

/* ─────────── Act IV — Backprop ─────────── */
export function PanelBackprop() {
  return (
    <Panel
      kicker="Training · Backprop"
      title="Gradient flows back."
      subtitle="The chain rule walks the loss backward through every operation, depositing ∂L/∂param onto each weight as it passes."
      accent={ACCENT.red}
    >
      <Eq accent={ACCENT.red} caption="upstream × local — repeated all the way back">
        ∂L/∂W_i = ∂L/∂y · ∂y/∂W_i
      </Eq>
      <Bullet index={1} accent={ACCENT.red} delay={0.4}>
        Start at the output. ∂L/∂logits is one easy derivative.
      </Bullet>
      <Bullet index={2} accent={ACCENT.amber} delay={0.55}>
        Walk backward. Each layer multiplies its local Jacobian onto the upstream gradient.
      </Bullet>
      <Bullet index={3} accent={ACCENT.mint} delay={0.7}>
        At every weight, deposit the gradient. That's the "blame" this weight gets for the loss.
      </Bullet>
      <Bullet index={4} accent={ACCENT.violet} delay={0.85}>
        Skip connections in the residual stream let gradients flow back unchanged — no vanishing.
      </Bullet>
    </Panel>
  )
}

/* ─────────── Act V — RoPE ─────────── */
export function PanelRope() {
  return (
    <Panel
      kicker="Modern Upgrades · RoPE"
      title="Rotate, don't add."
      subtitle="Modern transformers replace additive position encoding with rotation: each Q and K vector spins by an angle proportional to its position."
      accent={ACCENT.violet}
    >
      <Eq accent={ACCENT.violet} caption="position becomes a rotation in 2D pairs">
        q'_p = R(p) · q
      </Eq>
      <Bullet index={1} accent={ACCENT.violet} delay={0.4}>
        Pairs of dimensions get rotated together — pos → angle → 2D rotation matrix.
      </Bullet>
      <Bullet index={2} accent={ACCENT.blue} delay={0.55}>
        Q · K naturally encodes relative position. The dot product depends only on (pos_q − pos_k).
      </Bullet>
      <Bullet index={3} accent={ACCENT.amber} delay={0.7}>
        No PE table to learn. Generalizes better to longer contexts than the model was trained on.
      </Bullet>
      <Bullet index={4} accent={ACCENT.mint} delay={0.85}>
        Used in LLaMA, Qwen, Mistral, Gemini, etc. The current default.
      </Bullet>
    </Panel>
  )
}

/* ─────────── Act V — Modern ─────────── */
export function PanelModern() {
  return (
    <Panel
      kicker="Modern Upgrades"
      title="Same skeleton, three surgical upgrades."
      subtitle="The architecture you just walked through still describes today's models. A handful of swaps make it faster, cheaper, and more numerically stable."
      accent={ACCENT.mint}
    >
      <RoleRow label="RMSNorm" accent={ACCENT.blue} delay={0.4}
        text={<>Drops the mean-subtract step of LayerNorm. Just divides by ‖x‖ — fewer FLOPs, similar effect.</>} />
      <RoleRow label="SwiGLU" accent={ACCENT.gold} delay={0.55}
        text={<>FFN's GELU becomes a gated activation: Swish(W₁ x) ⊙ W_v x. ~2% better, ~50% more params.</>} />
      <RoleRow label="GQA" accent={ACCENT.mint} delay={0.7}
        text={<>Grouped Query Attention — fewer K/V heads than Q heads. KV cache shrinks 4× with little quality cost.</>} />
      <RoleRow label="RoPE" accent={ACCENT.violet} delay={0.85}
        text={<>Rotary positional embeddings, see previous beat. Defaults today.</>} />
    </Panel>
  )
}

/* ─────────── Act VI — Output ─────────── */
export function PanelOutput() {
  return (
    <Panel
      kicker="Output · Forward Pass"
      title="Every character is one full pass."
      subtitle="Prompt enters at the input slab. The vector traverses six blocks. One token emerges. Append. Repeat."
      accent={ACCENT.gold}
    >
      <Eq accent={ACCENT.gold} caption="autoregressive · one character at a time">
        x<sub>0..t</sub> → blocks → softmax → x<sub>t+1</sub>
      </Eq>
      <Bullet index={1} accent={ACCENT.violet} delay={0.4}>
        Tokenize the prompt → embedding + position vectors.
      </Bullet>
      <Bullet index={2} accent={ACCENT.blue} delay={0.55}>
        Walk through 6 blocks of attention + FFN, accumulating into the residual stream.
      </Bullet>
      <Bullet index={3} accent={ACCENT.gold} delay={0.7}>
        Project the LAST token's residual to vocab logits, softmax, sample, append.
      </Bullet>
      <Bullet index={4} accent={ACCENT.mint} delay={0.85}>
        Repeat with the new context (KV cache spares the prior K/V work).
      </Bullet>
    </Panel>
  )
}
