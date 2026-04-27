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
