'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COLORS, glyph, makeRng } from '../scenes/primitives'
import { NumberPanelDiv } from './numberpanel'
import { usePrompt } from './promptContext'

/** ========= 01 · Tokenization ========= */
export function SceneTokenization() {
  const { prompt } = usePrompt()
  const chars = prompt.split('')
  // Deterministic single-pass timeline (scene remounts each visit, no infinite loops):
  //   0.0 – 2.5s  sentence types in
  //   2.5 – 3.5s  pause / read
  //   3.5 – 6.5s  characters drop into pills (in order, left → right)
  //   6.5 – 10s   IDs appear under each pill (in order, left → right)
  //   10  – end   hold
  const STAGGER = 0.22
  const DROP_START = 3.5
  const ID_START = 6.5

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="tok-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* Typing sentence at top — per-char staggered fade-in, then the whole group fades out together */}
        <motion.g
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ delay: DROP_START - 0.4, duration: 0.4, ease: 'easeIn' }}
        >
          {chars.map((ch, i) => (
            <motion.text
              key={`top-${i}`}
              x={460 + i * 40}
              y={120}
              fontSize="52"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={COLORS.fg}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * STAGGER, duration: 0.35, ease: 'easeOut' }}
            >
              {ch === ' ' ? '·' : ch}
            </motion.text>
          ))}
        </motion.g>

        {/* Pills + dropping chars (happen in order after DROP_START) */}
        {chars.map((ch, i) => {
          const x = 340 + i * 64
          const dropDelay = DROP_START + i * STAGGER
          return (
            <g key={`cell-${i}`}>
              <motion.rect
                x={x}
                y={280}
                width={52}
                height={60}
                rx={3}
                fill="rgba(96,165,250,0.08)"
                stroke={COLORS.blue}
                strokeOpacity={0.6}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: dropDelay, duration: 0.3, ease: 'easeOut' }}
              />
              <motion.text
                x={x + 26}
                y={316}
                textAnchor="middle"
                fontSize="24"
                fontFamily="var(--font-mono)"
                fill={COLORS.fg}
                initial={{ opacity: 0, y: 200 }}
                animate={{ opacity: 1, y: 316 }}
                transition={{
                  delay: dropDelay,
                  duration: 0.55,
                  ease: [0.33, 1, 0.4, 1],
                }}
              >
                {ch === ' ' ? '·' : ch}
              </motion.text>

              {/* integer ID — appears strictly after all pills have dropped, still in left-right order */}
              <motion.line
                x1={x + 26} x2={x + 26} y1={345} y2={380}
                stroke={COLORS.violet}
                strokeDasharray="2 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ delay: ID_START + i * STAGGER, duration: 0.35 }}
              />
              <motion.rect
                x={x}
                y={388}
                width={52}
                height={36}
                rx={2}
                fill="rgba(167,139,250,0.1)"
                stroke={COLORS.violet}
                initial={{ opacity: 0, y: 405 }}
                animate={{ opacity: 1, y: 388 }}
                transition={{ delay: ID_START + 0.2 + i * STAGGER, duration: 0.35 }}
              />
              <motion.text
                x={x + 26}
                y={412}
                textAnchor="middle"
                fontSize="16"
                fontFamily="var(--font-mono)"
                fill={COLORS.violet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: ID_START + 0.3 + i * STAGGER, duration: 0.25 }}
              >
                {(ch.charCodeAt(0) % 64).toString().padStart(2, '0')}
              </motion.text>
            </g>
          )
        })}

        {/* labels */}
        <text x={220} y={316} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>char</text>
        <text x={220} y={412} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.violet}>id</text>

        {/* bottom call-out */}
        <text x={700} y={520} textAnchor="middle" fontSize="15" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.dim}>
          strings in · integers out
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'vocab size', value: '65', color: COLORS.violet },
        { label: 'sequence len', value: `T = ${chars.length}`, color: COLORS.fg },
        { label: 'id range', value: '[0, 65)', color: COLORS.fg },
        { label: 'dtype', value: 'int64', color: COLORS.dim },
      ]} />
    </div>
  )
}

/** ========= 02 · Embeddings ========= */
const VOCAB_LETTERS = 'abcdefghijklmnop'.split('')
export function SceneEmbedding() {
  // Walk through the matrix rows ONCE (single forward pass), then hold on the
  // last vector. Previous version looped perpetually which implied the model
  // was iterating — it's not; embedding is a one-shot lookup per token.
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setCursor((c) => (c + 1 < VOCAB_LETTERS.length ? c + 1 : c))
    }, 1100)
    return () => clearInterval(id)
  }, [])

  const rng = makeRng(91)
  const MAT = VOCAB_LETTERS.map(() => Array.from({ length: 24 }).map(() => rng() * 2 - 1))

  const CELL = 18
  const MAT_X = 100
  const MAT_Y = 120
  const matW = 24 * CELL
  const matH = VOCAB_LETTERS.length * CELL

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={MAT_X} y={90} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          EMBEDDING MATRIX   [V={VOCAB_LETTERS.length}, D=24]
        </text>
        {/* row cells */}
        {MAT.map((row, r) => (
          <g key={r} transform={`translate(${MAT_X}, ${MAT_Y + r * CELL})`}>
            {row.map((v, c) => {
              const t = Math.max(-1, Math.min(1, v))
              const color = t >= 0 ? `rgba(167,139,250,${0.15 + t * 0.7})` : `rgba(248,113,113,${0.15 + -t * 0.7})`
              return <rect key={c} x={c * CELL} width={CELL - 1} height={CELL - 1} fill={color} />
            })}
            <text x={-10} y={CELL / 2 + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={r === cursor ? COLORS.violet : COLORS.dim}>
              {VOCAB_LETTERS[r]}
            </text>
          </g>
        ))}

        {/* cursor highlight */}
        <motion.rect
          animate={{ y: MAT_Y + cursor * CELL - 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          x={MAT_X - 2}
          width={matW + 4}
          height={CELL + 2}
          fill="none"
          stroke={COLORS.violet}
          strokeWidth={2}
          filter="url(#emb-glow)"
        />

        <defs>
          <filter id="emb-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {/* extracted row flying right */}
        <motion.g key={`ext-${cursor}`}>
          <motion.g
            initial={{ x: 0, y: MAT_Y + cursor * CELL, opacity: 0 }}
            animate={{ x: 560, y: 300, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.1, times: [0, 0.2, 0.8, 1] }}
          >
            {MAT[cursor].map((v, c) => {
              const t = Math.max(-1, Math.min(1, v))
              const color = t >= 0 ? `rgba(167,139,250,${0.2 + t * 0.75})` : `rgba(248,113,113,${0.2 + -t * 0.75})`
              return (
                <rect
                  key={c}
                  x={MAT_X + c * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  fill={color}
                />
              )
            })}
          </motion.g>
        </motion.g>

        {/* target vector display */}
        <text x={760} y={280} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.violet} letterSpacing="0.18em">
          VECTOR FOR “{VOCAB_LETTERS[cursor]}”
        </text>
        <rect x={760} y={290} width={matW} height={CELL} fill="rgba(255,255,255,0.02)" stroke={COLORS.rule} />
        {MAT[cursor].map((v, c) => {
          const t = Math.max(-1, Math.min(1, v))
          const color = t >= 0 ? `rgba(167,139,250,${0.2 + t * 0.75})` : `rgba(248,113,113,${0.2 + -t * 0.75})`
          return (
            <motion.rect
              key={`tv-${cursor}-${c}`}
              x={760 + c * CELL}
              y={290}
              width={CELL - 1}
              height={CELL - 1}
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + c * 0.02 }}
            />
          )
        })}
        <text x={760} y={340} fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          ∈ ℝ²⁴   ( 384 in the real model )
        </text>
        <text x={760} y={360} fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          this is what every downstream layer reads
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'matrix shape', value: `[V=65, d=384]`, color: COLORS.violet },
        { label: 'viz showing', value: `[${VOCAB_LETTERS.length}, 24]`, color: COLORS.dim },
        { label: 'params', value: '24,960', color: COLORS.fg },
        { label: 'output', value: 'ℝ³⁸⁴', color: COLORS.fg },
        { label: 'lookup', value: 'O(1)', color: COLORS.mint },
      ]} />
    </div>
  )
}

/** ========= 03 · Q/K/V Projection ========= */
export function SceneQKV() {
  const rng = makeRng(42)
  const x_vals = Array.from({ length: 20 }).map(() => rng() * 2 - 1)
  const q_vals = Array.from({ length: 20 }).map(() => rng() * 2 - 1)
  const k_vals = Array.from({ length: 20 }).map(() => rng() * 2 - 1)
  const v_vals = Array.from({ length: 20 }).map(() => rng() * 2 - 1)

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="qkv-glow"><feGaussianBlur stdDeviation="3.5" /></filter>
        </defs>

        {/* Input vector (center) */}
        <text x={700} y={90} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          INPUT · x
        </text>
        <VectorRow values={x_vals} x={500} y={110} w={400} h={24} color={COLORS.fg} />

        {/* Three prisms */}
        {[
          { label: 'Q', sub: 'what am I asking?', color: COLORS.amber, x: 140, vals: q_vals },
          { label: 'K', sub: 'what do I offer?', color: COLORS.blue, x: 600, vals: k_vals },
          { label: 'V', sub: 'what do I carry?', color: COLORS.mint, x: 1060, vals: v_vals },
        ].map((p, i) => {
          const vx = p.x
          return (
            <g key={p.label}>
              {/* Curved connector from x → projection matrix */}
              <motion.path
                d={`M 700 134 Q ${(700 + vx + 100) / 2} 260 ${vx + 100} 300`}
                stroke={p.color}
                strokeWidth={1}
                strokeOpacity={0.4}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
              />

              {/* Traveling particle */}
              {Array.from({ length: 3 }).map((_, pi) => (
                <motion.circle
                  key={`p-${i}-${pi}`}
                  r={5}
                  fill={p.color}
                  filter="url(#qkv-glow)"
                  initial={{ cx: 700, cy: 134, opacity: 0 }}
                  animate={{
                    cx: [700, (700 + vx + 100) / 2, vx + 100],
                    cy: [134, 260, 300],
                    opacity: [0, 1, 1, 0],
                    r: [3, 7, 5, 3],
                  }}
                  transition={{
                    // Single pass — previously looped perpetually, which made
                    // viewers think Q/K/V was an iterative computation. It's
                    // one linear projection per token per forward pass.
                    duration: 3,
                    delay: 1 + i * 0.2 + pi * 1.1,
                    times: [0, 0.3, 0.8, 1],
                    ease: 'easeInOut',
                  }}
                />
              ))}

              {/* Projection matrix box */}
              <rect
                x={(700 + vx + 100) / 2 - 40}
                y={240}
                width={80}
                height={60}
                rx={3}
                fill="rgba(255,255,255,0.02)"
                stroke={p.color}
                strokeOpacity={0.5}
              />
              <text
                x={(700 + vx + 100) / 2}
                y={268}
                textAnchor="middle"
                fontSize="14"
                fontFamily="var(--font-display)"
                fontStyle="italic"
                fill={p.color}
              >
                W_{p.label.toLowerCase()}
              </text>
              <text
                x={(700 + vx + 100) / 2}
                y={288}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill={COLORS.dim}
              >
                learned matrix
              </text>

              {/* Output vector */}
              <text x={vx + 100} y={340} fontSize="26" fontFamily="var(--font-display)" fontStyle="italic" fill={p.color}>
                {p.label}
              </text>
              <text x={vx + 100} y={360} fontSize="10" fontFamily="var(--font-mono)" fill={p.color}>
                {p.sub}
              </text>
              <VectorRow values={p.vals} x={vx} y={380} w={240} h={26} color={p.color} />
              <motion.rect
                x={vx}
                y={380}
                width={240}
                height={26}
                fill="none"
                stroke={p.color}
                strokeWidth={1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 1.2 + i * 0.2 }}
              />
            </g>
          )
        })}

        <text x={700} y={520} textAnchor="middle" fontSize="15" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.dim}>
          Q = x·W_q · K = x·W_k · V = x·W_v
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'input x', value: 'ℝ³⁸⁴', color: COLORS.fg },
        { label: 'W_q shape', value: '[384, 384]', color: COLORS.amber },
        { label: 'W_k shape', value: '[384, 384]', color: COLORS.blue },
        { label: 'W_v shape', value: '[384, 384]', color: COLORS.mint },
        { label: 'flops', value: '3 × 384²', color: COLORS.dim },
      ]} />
    </div>
  )
}

function VectorRow({ values, x, y, w, h, color }: {
  values: number[]; x: number; y: number; w: number; h: number; color: string;
}) {
  const cellW = w / values.length
  return (
    <g>
      {values.map((v, i) => {
        const t = Math.max(-1, Math.min(1, v))
        const rgbMap: Record<string, string> = {
          [COLORS.amber]: '245,158,11',
          [COLORS.blue]: '96,165,250',
          [COLORS.mint]: '52,211,153',
          [COLORS.violet]: '167,139,250',
          [COLORS.fg]: '236,236,233',
        }
        const rgb = rgbMap[color] || '236,236,233'
        const alpha = 0.2 + Math.abs(t) * 0.7
        const fill = t >= 0 ? `rgba(${rgb},${alpha})` : `rgba(248,113,113,${alpha})`
        return <motion.rect key={i} x={x + i * cellW} y={y} width={cellW - 0.5} height={h} fill={fill} initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: i * 0.01}} />
      })}
    </g>
  )
}

/** ========= 04 · Self-attention (4 sub-phases) ========= */
/** Derive deterministic attention tokens/scores/weights from the active prompt. */
function useAttentionData() {
  const { prompt, seed } = usePrompt()
  return useMemo(() => {
    const tokens = prompt.split('')
    const T = tokens.length
    const rng = makeRng(seed || 33)
    const rawScores: number[][] = []
    const weights: number[][] = []
    for (let q = 0; q < T; q++) {
      const rawRow = new Array(T).fill(0)
      for (let k = 0; k < T; k++) {
        rawRow[k] = (rng() - 0.5) * 3
      }
      rawScores.push(rawRow)
      const masked = rawRow.map((v, k) => (k > q ? -Infinity : v))
      const mx = Math.max(...masked.filter(Number.isFinite))
      const exps = masked.map((v) => (Number.isFinite(v) ? Math.exp(v - mx) : 0))
      const sum = exps.reduce((a, b) => a + b, 0) || 1
      weights.push(exps.map((e) => +(e / sum).toFixed(3)))
    }
    return { tokens, T, rawScores, weights }
  }, [prompt, seed])
}

function AttnOneToken() {
  const { tokens, T, weights } = useAttentionData()
  const [query, setQuery] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setQuery((q) => (q + 1) % T), 1400)
    return () => clearInterval(id)
  }, [T])
  // Clamp query if prompt shrank
  const q = Math.min(query, T - 1)

  const CELL_W = Math.max(60, Math.min(100, Math.floor(1000 / T)))
  const rowY = 380
  const cellH = 70
  const rowX = (1400 - T * CELL_W) / 2
  const tokX = (i: number) => rowX + i * CELL_W
  const tokC = (i: number) => tokX(i) + CELL_W / 2

  let bestK = q
  let bestV = 0
  for (let k = 0; k <= q; k++) if (weights[q] && weights[q][k] > bestV) { bestV = weights[q][k]; bestK = k }

  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="attn-1">
      <defs>
        <filter id="attn-glow"><feGaussianBlur stdDeviation="3" /></filter>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(96,165,250,0.95)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.3)" />
        </linearGradient>
      </defs>
      <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        SUB-PHASE A · ONE QUERY AT A TIME
      </text>
      {weights[q]?.map((w, k) => {
        if (k > q || w < 0.04) return null
        const x1 = tokC(k); const x2 = tokC(q)
        const midX = (x1 + x2) / 2
        const apexY = 160 - Math.abs(x2 - x1) * 0.3
        return (
          <motion.path key={`arc-${q}-${k}`} d={`M ${x1} ${rowY} Q ${midX} ${apexY} ${x2} ${rowY}`}
            fill="none" stroke="url(#arc-grad)" strokeWidth={1 + w * 6} strokeLinecap="round" strokeOpacity={0.2 + w * 0.75}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
        )
      })}
      {bestV >= 0.1 && (() => {
        const x1 = tokC(bestK); const x2 = tokC(q)
        const midX = (x1 + x2) / 2
        const apexY = 160 - Math.abs(x2 - x1) * 0.3
        return (
          <motion.circle key={`dot-${q}`} r={6} fill={COLORS.violet} filter="url(#attn-glow)"
            initial={{ cx: x2, cy: rowY, opacity: 0 }}
            animate={{ cx: [x2, midX, x1], cy: [rowY, apexY, rowY], opacity: [0, 1, 0] }}
            transition={{ duration: 1 }} />
        )
      })()}
      {tokens.map((ch, i) => {
        const isQuery = i === q
        const accessible = i <= q
        return (
          <g key={i} transform={`translate(${tokX(i)}, ${rowY})`}>
            <motion.rect animate={{ fill: isQuery ? 'rgba(96,165,250,0.95)' : 'rgba(255,255,255,0.025)' }}
              width={CELL_W - 8} height={cellH} rx={4}
              stroke={isQuery ? COLORS.blue : COLORS.ruleStrong} strokeWidth={isQuery ? 2 : 1}
              opacity={accessible ? 1 : 0.25} />
            <text x={(CELL_W - 8) / 2} y={cellH / 2 + 11} textAnchor="middle" fontSize="36"
              fontFamily="var(--font-display)" fontStyle="italic" fill={isQuery ? COLORS.bg : COLORS.fg}
              opacity={accessible ? 1 : 0.35}>
              {ch === ' ' ? '·' : ch}
            </text>
            <text x={(CELL_W - 8) / 2} y={cellH - 6} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
              fill={isQuery ? 'rgba(7,7,9,0.8)' : COLORS.dim}>
              pos {i}
            </text>
          </g>
        )
      })}
      <motion.text key={`r-${q}`} x={700} y={500} textAnchor="middle" fontSize="16"
        fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 500 }}>
        “{tokens[q] === ' ' ? '·' : tokens[q]}”  attends to{' '}
        <tspan fill={COLORS.violet}>
          {tokens.slice(0, q + 1).map((c) => (c === ' ' ? '·' : c)).join(' ')}
        </tspan>
      </motion.text>
    </svg>
  )
}

function AttnFullMatrix() {
  // Show the T×T score matrix filling in cell-by-cell
  const { tokens, T, rawScores } = useAttentionData()
  const [fillIdx, setFillIdx] = useState(0)
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      if (i > T * T) i = 0
      setFillIdx(i)
    }, 80)
    return () => clearInterval(id)
  }, [T])

  const CELL = Math.max(34, Math.min(56, Math.floor(480 / T)))
  const MX = (1400 - T * CELL) / 2
  const MY = 130
  function cellColor(v: number, inMask: boolean) {
    if (!inMask) return 'rgba(7,7,9,0.8)'
    const t = Math.max(-1, Math.min(1, v / 2))
    return t >= 0 ? `rgba(96,165,250,${0.15 + t * 0.75})` : `rgba(248,113,113,${0.15 + -t * 0.75})`
  }

  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="attn-2">
      <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        SUB-PHASE B · THE FULL Q·Kᵀ MATRIX · T × T SCORES
      </text>
      <text x={700} y={76} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
        scores[q,k]  =  Q[q]  ·  K[k]  /  √d_k
      </text>
      {/* key labels */}
      {tokens.map((t, i) => (
        <text key={`k-${i}`} x={MX + i * CELL + CELL / 2} y={MY - 8} textAnchor="middle"
          fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.blue}>{t === ' ' ? '·' : t}</text>
      ))}
      {tokens.map((t, i) => (
        <text key={`q-${i}`} x={MX - 14} y={MY + i * CELL + CELL / 2 + 4} textAnchor="end"
          fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.amber}>{t === ' ' ? '·' : t}</text>
      ))}
      {rawScores.map((row, r) => row.map((v, c) => {
        const idx = r * T + c
        const shown = idx < fillIdx
        const inMask = c <= r
        return (
          <g key={`cell-${r}-${c}`}>
            <motion.rect x={MX + c * CELL + 1} y={MY + r * CELL + 1}
              width={CELL - 2} height={CELL - 2} rx={2}
              fill={cellColor(v, inMask)}
              stroke={COLORS.rule}
              initial={{ opacity: 0 }}
              animate={{ opacity: shown ? 1 : 0 }}
              transition={{ duration: 0.2 }} />
            {shown && inMask && (
              <text x={MX + c * CELL + CELL / 2} y={MY + r * CELL + CELL / 2 + 4} textAnchor="middle"
                fontSize="10" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.9)">
                {v.toFixed(1)}
              </text>
            )}
          </g>
        )
      }))}
      {/* Causal-mask callout — prominent red outline around upper triangle + label */}
      <g opacity={0.85}>
        <rect
          x={MX + (T > 1 ? 1 : 0) * CELL + 2}
          y={MY + 2}
          width={(T - 1) * CELL - 4}
          height={(T - 1) * CELL - 4}
          fill="none"
          stroke={COLORS.red}
          strokeWidth={2}
          strokeDasharray="6 3"
          style={{ transform: `translateX(${CELL}px)` }}
        />
      </g>
      <g transform={`translate(${MX + T * CELL + 20}, ${MY + 30})`}>
        <text x={0} y={0} fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.red} fontWeight="600" letterSpacing="0.05em">
          CAUSAL MASK
        </text>
        <text x={0} y={18} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.red} opacity="0.85">
          token q can&apos;t
        </text>
        <text x={0} y={32} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.red} opacity="0.85">
          attend to tokens
        </text>
        <text x={0} y={46} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.red} opacity="0.85">
          in its future
        </text>
        <line x1={-8} y1={-4} x2={-20} y2={-16} stroke={COLORS.red} strokeWidth={1.5} strokeDasharray="3 2" />
      </g>

      <text x={700} y={MY + T * CELL + 48} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
        every cell = a dot product · upper triangle is masked to −∞
      </text>
    </svg>
  )
}

function AttnSoftmaxRows() {
  const { tokens, T, rawScores, weights } = useAttentionData()
  const [row, setRow] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setRow((r) => ((r + 1) % T || 1)), 1800)
    return () => clearInterval(id)
  }, [T])
  const rowIdx = Math.min(row, T - 1) || Math.min(1, T - 1)

  const CELL = Math.max(42, Math.min(64, Math.floor(840 / T)))
  const MX = (1400 - T * CELL) / 2
  const TOP = 140
  const BOT = 340

  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="attn-3">
      <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        SUB-PHASE C · ROW-WISE SOFTMAX · EACH ROW SUMS TO 1
      </text>
      <text x={700} y={80} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
        w[q,k]  =  exp(s[q,k])  /  Σⱼ exp(s[q,j])
      </text>

      <text x={MX - 16} y={TOP + CELL / 2 + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.amber}>
        row q={rowIdx}
      </text>
      <text x={MX - 16} y={TOP + CELL / 2 + 20} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>
        raw scores
      </text>
      {rawScores[rowIdx]?.map((v, c) => {
        const inMask = c <= rowIdx
        return (
          <g key={`raw-${c}`}>
            <motion.rect
              x={MX + c * CELL + 1} y={TOP + 1}
              width={CELL - 2} height={CELL - 2} rx={2}
              animate={{ fill: inMask ? (v >= 0 ? `rgba(96,165,250,${0.2 + Math.min(1, v / 2) * 0.7})` : `rgba(248,113,113,${0.2 + Math.min(1, -v / 2) * 0.7})`) : 'rgba(7,7,9,0.8)' }}
              transition={{ duration: 0.3 }}
            />
            <text x={MX + c * CELL + CELL / 2} y={TOP + CELL / 2 + 4} textAnchor="middle"
              fontSize="14" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.9)">
              {inMask ? v.toFixed(1) : '−∞'}
            </text>
          </g>
        )
      })}

      {/* arrow */}
      <motion.g key={`arrow-${rowIdx}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <path d={`M 700 ${TOP + CELL + 6} L 700 ${BOT - 12} M 692 ${BOT - 20} L 700 ${BOT - 12} L 708 ${BOT - 20}`}
          stroke={COLORS.amber} strokeWidth={1.5} fill="none" />
        <text x={720} y={(TOP + CELL + BOT) / 2 + 4} fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.amber}>
          softmax
        </text>
      </motion.g>

      {/* weights bars */}
      <text x={MX - 16} y={BOT + CELL / 2 + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.blue}>
        weights
      </text>
      <text x={MX - 16} y={BOT + CELL / 2 + 20} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>
        sum = 1.00
      </text>
      {weights[rowIdx]?.map((w, c) => (
        <g key={`w-${c}`}>
          <motion.rect
            x={MX + c * CELL + 1} y={BOT + 1}
            width={CELL - 2} height={CELL - 2} rx={2}
            fill={`rgba(96,165,250,${0.15 + w * 0.8})`}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
          />
          <text x={MX + c * CELL + CELL / 2} y={BOT + CELL / 2 + 4} textAnchor="middle"
            fontSize="12" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.95)">
            {w.toFixed(2)}
          </text>
          <text x={MX + c * CELL + CELL / 2} y={BOT + CELL + 14} textAnchor="middle"
            fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            {tokens[c] === ' ' ? '·' : tokens[c]}
          </text>
        </g>
      ))}

      <text x={700} y={510} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
        softmax turns raw scores into a probability distribution across keys
      </text>
    </svg>
  )
}

function AttnValueMixing() {
  const { tokens, T, weights } = useAttentionData()
  const { seed } = usePrompt()
  const [query, setQuery] = useState(2)
  useEffect(() => {
    const id = setInterval(() => setQuery((q) => ((q + 1) % T) || Math.min(2, T - 1)), 2600)
    return () => clearInterval(id)
  }, [T])
  const q = Math.min(query, T - 1)

  // Deterministic V vectors seeded by prompt
  const rng = makeRng(seed || 777)
  const V_VECS: number[][] = Array.from({ length: T }).map(() =>
    Array.from({ length: 6 }).map(() => +((rng() - 0.5) * 2).toFixed(2))
  )
  const w = weights[q] || new Array(T).fill(0)
  const output = Array.from({ length: 6 }).map((_, d) => {
    let s = 0
    for (let k = 0; k <= query; k++) s += w[k] * V_VECS[k][d]
    return +s.toFixed(2)
  })

  const CELL = 28
  const Y_V = 140
  const X_V = 340

  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="attn-4">
      <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        SUB-PHASE D · VALUE MIXING · WEIGHTED SUM
      </text>
      <text x={700} y={78} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
        out[q]  =  Σₖ  w[q,k]  ·  V[k]
      </text>

      {/* V vectors as rows */}
      <text x={X_V - 16} y={Y_V - 10} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>weight</text>
      {V_VECS.map((row, r) => {
        const inMask = r <= query
        const weight = w[r] || 0
        return (
          <g key={`v-${r}`}>
            <motion.text x={X_V - 16} y={Y_V + r * CELL + CELL / 2 + 4} textAnchor="end"
              fontSize="11" fontFamily="var(--font-mono)"
              initial={{ opacity: 1, fill: COLORS.blue }}
              animate={{ fill: inMask ? COLORS.blue : COLORS.dim, opacity: inMask ? 1 : 0.3 }}>
              {inMask ? weight.toFixed(2) : '—'}
            </motion.text>
            {row.map((v, c) => {
              const t = Math.max(-1, Math.min(1, v))
              const fill = t >= 0 ? `rgba(52,211,153,${0.15 + t * 0.75})` : `rgba(248,113,113,${0.15 + -t * 0.75})`
              return (
                <motion.g key={c}>
                  <motion.rect
                    x={X_V + c * CELL + 1} y={Y_V + r * CELL + 1}
                    width={CELL - 2} height={CELL - 2} rx={2}
                    fill={fill}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: inMask ? 1 : 0.15 }}
                  />
                  <text x={X_V + c * CELL + CELL / 2} y={Y_V + r * CELL + CELL / 2 + 4} textAnchor="middle"
                    fontSize="8" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.85)">
                    {v.toFixed(1)}
                  </text>
                </motion.g>
              )
            })}
            <text x={X_V + 6 * CELL + 14} y={Y_V + r * CELL + CELL / 2 + 4}
              fontSize="11" fontFamily="var(--font-mono)" fill={r === query ? COLORS.amber : COLORS.dim}>
              V[{tokens[r] === ' ' ? '·' : tokens[r]}]
            </text>
          </g>
        )
      })}

      {/* arrow down to output */}
      <text x={X_V + 3 * CELL} y={Y_V + T * CELL + 30} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.mint}>
        weighted sum ↓
      </text>

      {/* output vector */}
      <text x={X_V - 16} y={Y_V + T * CELL + 70} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.mint}>
        out
      </text>
      {output.map((v, c) => {
        const t = Math.max(-1, Math.min(1, v))
        const fill = t >= 0 ? `rgba(52,211,153,${0.25 + t * 0.7})` : `rgba(248,113,113,${0.25 + -t * 0.7})`
        return (
          <motion.g key={`o-${c}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + c * 0.08 }}>
            <rect x={X_V + c * CELL + 1} y={Y_V + T * CELL + 58} width={CELL - 2} height={CELL - 2} rx={2} fill={fill} stroke={COLORS.mint} />
            <text x={X_V + c * CELL + CELL / 2} y={Y_V + T * CELL + 58 + CELL / 2 + 4} textAnchor="middle"
              fontSize="10" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.95)">
              {v.toFixed(1)}
            </text>
          </motion.g>
        )
      })}
      <text x={X_V + 6 * CELL + 14} y={Y_V + T * CELL + 58 + CELL / 2 + 4}
        fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.mint}>
        = attention output for q={query}
      </text>
    </svg>
  )
}

export function SceneAttention() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    // 4 sub-phases cycle through
    // Match scene duration (36s) exactly — 4 phases × 9s each → phase 0 returns precisely when scene advances
    const timings = [10000, 10000, 10000, 10000]
    let cur = 0
    let timer = setTimeout(function next() {
      cur = (cur + 1) % 4
      setPhase(cur)
      timer = setTimeout(next, timings[cur])
    }, timings[0])
    return () => clearTimeout(timer)
  }, [])

  const { T } = useAttentionData()
  const PHASE_LABELS = ['A · one-query zoom', 'B · full Q·Kᵀ matrix', 'C · row-wise softmax', 'D · value mixing']

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div key={phase}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full">
          {phase === 0 && <AttnOneToken />}
          {phase === 1 && <AttnFullMatrix />}
          {phase === 2 && <AttnSoftmaxRows />}
          {phase === 3 && <AttnValueMixing />}
        </motion.div>
      </AnimatePresence>

      {/* Sub-phase banner — prominent */}
      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[rgba(96,165,250,0.4)] bg-[rgba(7,7,9,0.8)] px-4 py-1 mono text-[11px] backdrop-blur-sm" style={{ color: COLORS.blue }}>
        sub-phase {PHASE_LABELS[phase]}
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 w-14 rounded-full transition-colors"
            style={{ background: i === phase ? COLORS.blue : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      <NumberPanelDiv chips={[
        { label: 'T', value: String(T), color: COLORS.fg },
        { label: 'd_k', value: '64', color: COLORS.fg },
        { label: 'scale', value: '1/√64 = 0.125', color: COLORS.amber },
        { label: 'rows sum', value: '1.000', color: COLORS.blue },
        { label: 'mask', value: `${(T * (T - 1)) / 2} cells`, color: COLORS.dim },
        { label: 'flops', value: `${T * T * 64} MACs`, color: COLORS.dim },
      ]} />
    </div>
  )
}

/** ========= 05 · Multi-head Parallel ========= */
export function SceneMultiHead() {
  const { prompt } = usePrompt()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200)
    return () => clearInterval(id)
  }, [])

  // Take first 6-8 chars of the prompt
  const tokens = prompt.split('').slice(0, 8)
  const T = tokens.length
  const HEADS = [
    { color: COLORS.blue, pattern: 'prev-token' },
    { color: COLORS.violet, pattern: 'start-anchor' },
    { color: COLORS.mint, pattern: 'vowel-hook' },
    { color: COLORS.amber, pattern: 'two-back' },
    { color: COLORS.pink, pattern: 'content' },
    { color: COLORS.cyan, pattern: 'spread' },
  ]
  // pre-compute simple patterns
  const patterns: number[][][] = HEADS.map((_, h) => {
    const mat: number[][] = []
    for (let q = 0; q < T; q++) {
      const row = new Array(T).fill(0)
      if (h === 0 && q > 0) row[q - 1] = 0.9
      if (h === 1) row[0] = 0.8
      if (h === 2) for (let k = 0; k <= q; k++) if ('aeiou'.includes(tokens[k])) row[k] = 0.8
      if (h === 3 && q > 1) row[q - 2] = 0.85
      if (h === 4) for (let k = 0; k <= q; k++) row[k] = 0.4 + ((k + q + h) * 137) % 70 / 100
      if (h === 5) for (let k = 0; k <= q; k++) row[k] = 1 / (q + 1)
      row[q] = (row[q] || 0) + 0.15
      let s = 0
      for (let k = 0; k <= q; k++) s += row[k]
      for (let k = 0; k <= q; k++) row[k] /= (s || 1)
      mat.push(row)
    }
    return mat
  })

  const activeQuery = tick % T

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          MULTI-HEAD ATTENTION · SIX HEADS IN PARALLEL
        </text>
        <text x={700} y={72} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fontStyle="italic" fill={COLORS.dim}>
          patterns below are illustrative — real heads learn unnamed behaviors during training
        </text>

        {HEADS.map((head, h) => {
          const col = h % 3
          const row = Math.floor(h / 3)
          const bx = 100 + col * 420
          const by = 90 + row * 230
          const bw = 380
          const bh = 200
          const tokenCell = bw / (T + 1)
          const tokensY = by + bh - 40
          return (
            <g key={h}>
              <rect
                x={bx}
                y={by}
                width={bw}
                height={bh}
                rx={3}
                fill="rgba(255,255,255,0.02)"
                stroke={head.color}
                strokeOpacity={0.4}
              />
              <text x={bx + 14} y={by + 22} fontSize="13" fontFamily="var(--font-mono)" fill={head.color}>
                head {h}
              </text>
              <text x={bx + bw - 14} y={by + 22} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                {head.pattern}
              </text>

              {/* Arcs for current query */}
              {patterns[h][activeQuery].map((w, k) => {
                if (k > activeQuery || w < 0.04) return null
                const x1 = bx + 20 + k * tokenCell + tokenCell / 2
                const x2 = bx + 20 + activeQuery * tokenCell + tokenCell / 2
                const mx = (x1 + x2) / 2
                const apex = tokensY - Math.max(20, Math.abs(x2 - x1) * 0.6)
                return (
                  <motion.path
                    key={`${h}-${tick}-${k}`}
                    d={`M ${x1} ${tokensY} Q ${mx} ${apex} ${x2} ${tokensY}`}
                    stroke={head.color}
                    strokeWidth={0.8 + w * 4}
                    strokeOpacity={0.25 + w * 0.7}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )
              })}

              {/* Tokens */}
              {tokens.map((ch, i) => {
                const isQ = i === activeQuery
                return (
                  <g key={i}>
                    <motion.rect
                      x={bx + 20 + i * tokenCell + 2}
                      y={tokensY}
                      width={tokenCell - 4}
                      height={26}
                      rx={2}
                      animate={{ fill: isQ ? head.color : 'rgba(255,255,255,0.03)' }}
                      stroke={isQ ? head.color : COLORS.ruleStrong}
                    />
                    <text
                      x={bx + 20 + i * tokenCell + tokenCell / 2}
                      y={tokensY + 18}
                      textAnchor="middle"
                      fontSize="13"
                      fontFamily="var(--font-mono)"
                      fill={isQ ? COLORS.bg : COLORS.fg}
                    >
                      {ch === ' ' ? '·' : ch}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** ========= 06 · Feed-forward ========= */
export function SceneFFN() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    // Single forward pass — previously looped, implying iterative computation.
    // FFN runs once per token per layer. Walk the 5 phases once and hold.
    const id = setInterval(() => setPhase((p) => (p + 1 < 5 ? p + 1 : p)), 3200)
    return () => clearInterval(id)
  }, [])

  const rng = makeRng(71)
  const INPUT = Array.from({ length: 6 }).map(() => rng() * 2 - 1)
  const HID_N = 18
  const W1 = INPUT.map(() => Array.from({ length: HID_N }).map(() => rng() * 2 - 1))
  const pre = Array.from({ length: HID_N }).map((_, j) => {
    let s = 0
    for (let i = 0; i < 6; i++) s += INPUT[i] * W1[i][j]
    return s
  })
  const post = pre.map((v) => Math.max(0, v))
  const W2 = Array.from({ length: HID_N }).map(() => Array.from({ length: 6 }).map(() => rng() * 2 - 1))
  const out = Array.from({ length: 6 }).map((_, j) => {
    let s = 0
    for (let i = 0; i < HID_N; i++) s += post[i] * W2[i][j]
    return s
  })

  const W = 1200
  const H = 500
  const leftX = 200
  const midX = 600
  const rightX = 1000

  const yFor = (n: number, i: number) => 90 + (i + 0.5) * ((H - 90 - 40) / n)

  const valColor = (v: number, a = 0.7) => {
    const t = Math.max(-1, Math.min(1, v / 2))
    return t >= 0 ? `rgba(96,165,250,${0.15 + t * a})` : `rgba(248,113,113,${0.15 + -t * a})`
  }

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs>
          <filter id="ff-glow"><feGaussianBlur stdDeviation="3.5" /></filter>
        </defs>

        {/* Labels */}
        <text x={leftX} y={40} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.cyan} letterSpacing="0.18em">INPUT</text>
        <text x={leftX} y={56} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>residual · 6-dim</text>
        <text x={midX} y={40} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.amber} letterSpacing="0.18em">HIDDEN · 4× WIDER</text>
        <text x={midX} y={56} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>1536-dim in real model</text>
        <text x={rightX} y={40} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.cyan} letterSpacing="0.18em">OUTPUT</text>
        <text x={rightX} y={56} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>back to 6-dim</text>

        {/* Expand lines */}
        {phase >= 1 && INPUT.map((_, i) =>
          W1[i].map((w, j) => (
            <motion.line
              key={`w1-${i}-${j}`}
              x1={leftX} y1={yFor(6, i)}
              x2={midX} y2={yFor(HID_N, j)}
              stroke={w >= 0 ? COLORS.blue : COLORS.red}
              strokeWidth={Math.min(1.8, Math.abs(w) * 1.6)}
              initial={{ opacity: 0 }}
              animate={{ opacity: Math.min(0.4, Math.abs(w) * 0.35) }}
              transition={{ duration: 0.4, delay: (i + j) * 0.01 }}
            />
          ))
        )}

        {/* Compress lines */}
        {phase >= 3 && post.map((p, i) =>
          p > 0.1 ? W2[i].map((w, j) => (
            <motion.line
              key={`w2-${i}-${j}`}
              x1={midX} y1={yFor(HID_N, i)}
              x2={rightX} y2={yFor(6, j)}
              stroke={w >= 0 ? COLORS.mint : COLORS.red}
              strokeWidth={Math.min(1.5, Math.abs(w) * 1.3)}
              initial={{ opacity: 0 }}
              animate={{ opacity: Math.min(0.35, Math.abs(w) * 0.3) }}
              transition={{ duration: 0.4 }}
            />
          )) : null
        )}

        {/* Input neurons */}
        {INPUT.map((v, i) => (
          <g key={`in-${i}`}>
            <circle cx={leftX} cy={yFor(6, i)} r={18} fill={valColor(v)} stroke={COLORS.cyan} filter="url(#ff-glow)" />
            <text x={leftX} y={yFor(6, i) + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.fg}>{v.toFixed(1)}</text>
          </g>
        ))}

        {/* Hidden neurons */}
        {(phase >= 2 ? post : pre).map((v, j) => {
          const killed = phase >= 2 && pre[j] < 0
          return (
            <motion.g
              key={`hid-${j}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 1 ? 1 : 0 }}
              transition={{ duration: 0.2, delay: j * 0.02 }}
            >
              <circle
                cx={midX}
                cy={yFor(HID_N, j)}
                r={9}
                fill={killed ? 'rgba(30,30,35,1)' : valColor(v, 0.9)}
                stroke={killed ? COLORS.red : COLORS.amber}
                strokeOpacity={killed ? 0.4 : 0.7}
              />
              {killed && (
                <>
                  <line x1={midX - 6} y1={yFor(HID_N, j) - 6} x2={midX + 6} y2={yFor(HID_N, j) + 6} stroke={COLORS.red} />
                  <line x1={midX - 6} y1={yFor(HID_N, j) + 6} x2={midX + 6} y2={yFor(HID_N, j) - 6} stroke={COLORS.red} />
                </>
              )}
            </motion.g>
          )
        })}

        {/* Output neurons */}
        {out.map((v, i) => (
          <motion.g
            key={`out-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 4 ? 1 : 0.2 }}
            transition={{ delay: i * 0.05 }}
          >
            <circle
              cx={rightX}
              cy={yFor(6, i)}
              r={18}
              fill={phase >= 4 ? valColor(v) : 'rgba(255,255,255,0.03)'}
              stroke={COLORS.cyan}
              filter={phase >= 4 ? 'url(#ff-glow)' : undefined}
            />
            <text x={rightX} y={yFor(6, i) + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.fg}>
              {phase >= 4 ? v.toFixed(1) : '·'}
            </text>
          </motion.g>
        ))}

        {/* Phase label */}
        <text x={W / 2} y={H - 12} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          {['input arrives', 'expand 4× · compute hidden', 'GELU squashes negatives (softly)', 'compress back to 6', 'added into residual'][phase]}
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'in · out', value: 'ℝ³⁸⁴ → ℝ³⁸⁴', color: COLORS.fg },
        { label: 'hidden', value: 'ℝ¹⁵³⁶ (4×)', color: COLORS.amber },
        { label: 'W₁', value: '[384, 1536]', color: COLORS.blue },
        { label: 'W₂', value: '[1536, 384]', color: COLORS.mint },
        { label: 'params', value: '~1.18M / block', color: COLORS.dim },
        { label: 'sparsity', value: `${Math.round(post.filter((v: number) => v < 0.01).length / HID_N * 100)}% zeroed`, color: COLORS.red },
      ]} />
    </div>
  )
}

/** ========= 07 · Stack of 6 blocks (residual flow) ========= */
export function SceneStack() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(52,211,153,0.1)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.7)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.1)" />
          </linearGradient>
          <filter id="spine-glow2"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>

        {/* spine */}
        <rect x={90} y={260} width={1220} height={10} fill="url(#spine)" filter="url(#spine-glow2)" />
        <text x={700} y={248} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.cyan} letterSpacing="0.18em">
          RESIDUAL STREAM · 384-DIM
        </text>

        {/* 6 flowing particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.circle
            key={i}
            r={8}
            cy={265}
            filter="url(#spine-glow2)"
            initial={{ cx: 90, opacity: 0, fill: 'rgba(167,139,250,1)' }}
            animate={{
              cx: [90, 1310],
              opacity: [0, 1, 1, 1, 0],
              fill: ['rgba(167,139,250,1)','rgba(96,165,250,1)','rgba(52,211,153,1)','rgba(245,158,11,1)','rgba(248,113,113,1)'],
            }}
            transition={{ duration: 7, delay: i * 1.1, repeat: Infinity, ease: 'linear', times: [0, 0.05, 0.45, 0.95, 1] }}
          />
        ))}

        {/* input pill */}
        <g transform="translate(40, 240)">
          <rect width={60} height={50} rx={4} fill="rgba(167,139,250,0.1)" stroke={COLORS.violet} />
          <text x={30} y={30} textAnchor="middle" fontSize="16" fontFamily="var(--font-mono)" fill={COLORS.violet}>in</text>
        </g>
        {/* output pill */}
        <motion.g
          transform="translate(1300, 240)"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect width={60} height={50} rx={4} fill="rgba(248,113,113,0.1)" stroke={COLORS.red} />
          <text x={30} y={30} textAnchor="middle" fontSize="16" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.red}>out</text>
        </motion.g>

        {/* 6 blocks */}
        {Array.from({ length: 6 }).map((_, li) => {
          const cx = 170 + li * 180
          const hue = 200 + li * 22
          const color = `hsl(${hue}, 70%, 65%)`
          return (
            <g key={li}>
              {/* block frame above spine */}
              <rect
                x={cx - 60}
                y={60}
                width={120}
                height={160}
                rx={3}
                fill={`hsla(${hue}, 70%, 55%, 0.08)`}
                stroke={color}
                strokeOpacity={0.5}
              />
              <text x={cx} y={84} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={color} letterSpacing="0.18em">
                BLOCK {li}
              </text>

              {/* Internal attention mini-grid */}
              {Array.from({ length: 4 }).map((_, q) =>
                Array.from({ length: 4 }).map((_, k) => {
                  if (k > q) return null
                  return (
                    <motion.rect
                      key={`${li}-${q}-${k}`}
                      x={cx - 52 + k * 14}
                      y={100 + q * 14}
                      width={12}
                      height={12}
                      fill={color}
                      initial={{ opacity: 0.1 }}
                      animate={{ opacity: [0.1, 0.7, 0.1] }}
                      transition={{ duration: 1.6, delay: li * 0.1 + q * 0.1 + k * 0.08, repeat: Infinity }}
                    />
                  )
                })
              )}

              {/* FFN bars on the right */}
              {Array.from({ length: 6 }).map((_, bi) => (
                <motion.rect
                  key={`ffn-${li}-${bi}`}
                  x={cx + 8 + bi * 8}
                  y={160}
                  width={6}
                  fill={COLORS.amber}
                  initial={{ opacity: 0.15, height: 15 }}
                  animate={{ opacity: [0.15, 0.6, 0.15], height: [15, 30, 15] }}
                  transition={{ duration: 1.2, delay: li * 0.1 + bi * 0.1, repeat: Infinity }}
                />
              ))}

              {/* arrow from block down to spine */}
              <motion.line
                x1={cx} y1={220}
                x2={cx} y2={256}
                stroke={color}
                strokeDasharray="2 3"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.8, delay: li * 0.2, repeat: Infinity }}
              />
              <motion.circle
                cx={cx}
                cy={265}
                r={6}
                fill={color}
                initial={{ scale: 0.6, opacity: 0.4 }}
                animate={{ scale: [0.6, 1.4, 0.6], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, delay: li * 0.2, repeat: Infinity }}
              />

              {/* block readout */}
              <text x={cx} y={376} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                attn + ffn adds Δ
              </text>
            </g>
          )
        })}

        <text x={700} y={440} textAnchor="middle" fontSize="16" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          every block <tspan fill={COLORS.mint}>adds</tspan> to the stream — never overwrites
        </text>
        <text x={700} y={470} textAnchor="middle" fontSize="15" fontFamily="var(--font-mono)" fill={COLORS.cyan}>
          x ← x + block(x)
        </text>
        <text x={700} y={492} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          each block reads x, computes a delta (attn + ffn), adds it back — skip connections let early features survive to the top
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'layers', value: '6', color: COLORS.fg },
        { label: 'stream dim', value: '384', color: COLORS.cyan },
        { label: 'per block', value: '~1.8M params', color: COLORS.dim },
        { label: 'total', value: '10.79M', color: COLORS.fg },
        { label: 'depth', value: '× residual', color: COLORS.mint },
      ]} />
    </div>
  )
}

/** ========= 08 · Softmax + sampling (interactive temperature) ========= */
export function SceneSample() {
  const [temp, setTemp] = useState(1.0)
  const [touched, setTouched] = useState(false)
  const [sampled, setSampled] = useState(0)

  const TEMP_LABELS = (t: number) =>
    t <= 0.6 ? 'sharp · confident' : t >= 1.4 ? 'flat · creative' : 'normal'
  const CHARS = ['N', 'a', 'y', ',', ' ', 'O', 'e', 'i', 'o', 'r', 's', 't']
  const LOGITS = [4.1, 3.6, 2.8, 2.2, 1.9, 1.2, 1.0, 0.6, 0.5, 0.1, -0.2, -0.4]

  // Auto-sweep temperature for ~2 cycles, then settle at T=1.0.
  // Previously oscillated forever, which looked like temperature was
  // constantly changing in inference — it's a fixed knob.
  useEffect(() => {
    if (touched) return
    const start = performance.now()
    const SWEEP_DURATION = 15.7  // ~2 full sine cycles at ω=0.8
    let frame = 0
    const loop = () => {
      const t = (performance.now() - start) / 1000
      if (t >= SWEEP_DURATION) {
        setTemp(1.0)
        return
      }
      const phase = (Math.sin(t * 0.8) + 1) / 2
      setTemp(+(0.3 + phase * 1.5).toFixed(2))
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [touched])

  const scaled = LOGITS.map((x) => x / temp)
  const max = Math.max(...scaled)
  const exps = scaled.map((x) => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  const probs = exps.map((e) => e / sum)

  // Entropy in bits
  const entropy = probs.reduce((a, p) => a + (p > 0 ? -p * Math.log2(p) : 0), 0)

  useEffect(() => {
    const id = setInterval(() => {
      let r = Math.random()
      for (let i = 0; i < probs.length; i++) {
        r -= probs[i]
        if (r <= 0) { setSampled(i); return }
      }
      setSampled(probs.length - 1)
    }, 1300)
    return () => clearInterval(id)
  }, [temp])

  const barW = 70
  const barGap = 12
  const startX = 120
  const maxH = 300

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="samp-glow"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>

        <motion.text
          x={700} y={90}
          textAnchor="middle"
          fontSize="28"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.amber}
        >
          T = {temp.toFixed(2)} · {TEMP_LABELS(temp)}
        </motion.text>

        {/* Bars */}
        {probs.map((p, i) => {
          const barH = (p / Math.max(...probs)) * maxH
          const x = startX + i * (barW + barGap)
          const y = 440 - barH
          const isSampled = i === sampled
          return (
            <g key={i}>
              <motion.rect
                x={x}
                width={barW}
                rx={3}
                animate={{ y, height: barH, fill: isSampled ? COLORS.red : COLORS.blue }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                filter={isSampled ? 'url(#samp-glow)' : undefined}
                opacity={0.8}
              />
              <motion.text
                x={x + barW / 2}
                textAnchor="middle"
                fontSize="12"
                fontFamily="var(--font-mono)"
                fill={isSampled ? COLORS.red : COLORS.dim}
                animate={{ y: y - 10 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              >
                {(p * 100).toFixed(0)}%
              </motion.text>
              <rect
                x={x}
                y={454}
                width={barW}
                height={40}
                rx={3}
                fill="rgba(255,255,255,0.025)"
                stroke={isSampled ? COLORS.red : COLORS.rule}
                strokeWidth={isSampled ? 1.5 : 1}
              />
              <text x={x + barW / 2} y={482} textAnchor="middle" fontSize="22" fontFamily="var(--font-mono)" fill={isSampled ? COLORS.red : COLORS.fg}>
                {CHARS[i] === ' ' ? '·' : CHARS[i]}
              </text>
            </g>
          )
        })}

        {/* Dice-roll callout */}
        <g transform="translate(1100, 180)">
          <text x={0} y={0} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
            DIE ROLL →
          </text>
          <motion.rect
            x={0} y={20}
            width={120} height={120}
            rx={6}
            fill="rgba(248,113,113,0.1)"
            stroke={COLORS.red}
            strokeWidth={2}
            initial={{ strokeOpacity: 1 }}
            animate={{ strokeOpacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            filter="url(#samp-glow)"
          />
          <AnimatePresence mode="wait">
            <motion.text
              key={sampled}
              x={60} y={105}
              textAnchor="middle"
              fontSize="70"
              fontFamily="var(--font-display)"
              fontStyle="italic"
              fill={COLORS.red}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
            >
              {CHARS[sampled] === ' ' ? '·' : CHARS[sampled]}
            </motion.text>
          </AnimatePresence>
          <text x={60} y={160} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            sampled
          </text>
        </g>
      </svg>

      {/* Real-number panel */}
      <NumberPanelDiv chips={[
        { label: 'logits', value: `[V=${LOGITS.length}]`, color: COLORS.fg },
        { label: 'max logit', value: Math.max(...LOGITS).toFixed(2), color: COLORS.blue },
        { label: 'top prob', value: `${(Math.max(...probs) * 100).toFixed(1)}%`, color: COLORS.amber },
        { label: 'entropy', value: `${entropy.toFixed(2)} bits`, color: COLORS.fg },
        { label: 'T', value: temp.toFixed(2), color: COLORS.amber },
      ]} />

      {/* Interactive temperature slider */}
      <div className="absolute bottom-4 left-1/2 z-10 w-[420px] -translate-x-1/2 rounded-[2px] border border-[rgba(255,255,255,0.12)] bg-[rgba(7,7,9,0.85)] px-4 py-2.5 backdrop-blur-md mono text-[11px]">
        <div className="flex items-center gap-3">
          <span className="small-caps text-[var(--fg-dim)]">temperature</span>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.02}
            value={temp}
            onChange={(e) => {
              setTouched(true)
              setTemp(parseFloat(e.target.value))
            }}
            className="flex-1 accent-[var(--accent-amber)]"
          />
          <span className="tabular w-12 text-right text-[var(--fg)]">{temp.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] text-[var(--fg-dim)]">
          <span>drag me</span>
          <span>{touched ? 'user override · drag further' : 'auto-sweeping'}</span>
        </div>
      </div>
    </div>
  )
}

/** ========= 09 · KV cache growing ========= */
export function SceneKVCache() {
  const { prompt } = usePrompt()
  const SEQ = prompt.split('').slice(0, 10)  // limit to 10 tokens for visual
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % SEQ.length), 1500)
    return () => clearInterval(id)
  }, [])

  const CELL = 22
  const D_K = 20
  const rng = makeRng(121)
  const K = SEQ.map(() => Array.from({ length: D_K }).map(() => rng() * 2 - 1))
  const V = SEQ.map(() => Array.from({ length: D_K }).map(() => rng() * 2 - 1))

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="kv-flash"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {/* Token row at top */}
        {SEQ.map((ch, i) => {
          const isCurrent = i === step
          const isPast = i < step
          return (
            <g key={i} transform={`translate(${280 + i * 76}, 80)`}>
              <motion.rect
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                width={64}
                height={64}
                rx={4}
                fill={isCurrent ? 'rgba(245,158,11,0.25)' : isPast ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.02)'}
                stroke={isCurrent ? COLORS.amber : isPast ? COLORS.blue : COLORS.ruleStrong}
                strokeWidth={isCurrent ? 2 : 1}
                filter={isCurrent ? 'url(#kv-flash)' : undefined}
              />
              <text x={32} y={44} textAnchor="middle" fontSize="28" fontFamily="var(--font-mono)" fill={isCurrent ? COLORS.amber : isPast ? COLORS.blue : COLORS.dim}>
                {ch}
              </text>
            </g>
          )
        })}

        <text x={700} y={180} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          STEP {step + 1} OF {SEQ.length} · ONE NEW ROW APPENDED
        </text>

        {/* K matrix */}
        <g transform="translate(120, 220)">
          <text x={0} y={-8} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.blue}>K · keys</text>
          {K.map((row, r) =>
            row.map((v, c) => {
              const isPast = r < step
              const isCurrent = r === step
              const isFuture = r > step
              const t = Math.max(-1, Math.min(1, v))
              const baseColor = t >= 0 ? `rgba(96,165,250,${0.15 + t * 0.7})` : `rgba(248,113,113,${0.15 + -t * 0.7})`
              return (
                <motion.rect
                  key={`k-${r}-${c}`}
                  x={c * CELL}
                  y={r * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  initial={{ opacity: 1, fill: baseColor }}
                  animate={{
                    opacity: isFuture ? 0.05 : isPast ? 0.45 : 1,
                    fill: baseColor,
                  }}
                  transition={{ duration: 0.3 }}
                />
              )
            })
          )}
          {/* current row flash */}
          <motion.rect
            x={-2}
            y={step * CELL - 1}
            width={D_K * CELL + 4}
            height={CELL + 1}
            fill="none"
            stroke={COLORS.amber}
            strokeWidth={2}
            initial={{ opacity: 1 }} animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
          {/* row labels */}
          {SEQ.map((ch, i) => (
            <text key={i} x={-12} y={i * CELL + CELL / 2 + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={i === step ? COLORS.amber : i < step ? COLORS.fg : COLORS.dim}>
              {ch}
            </text>
          ))}
        </g>

        {/* V matrix */}
        <g transform="translate(720, 220)">
          <text x={0} y={-8} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.violet}>V · values</text>
          {V.map((row, r) =>
            row.map((v, c) => {
              const isPast = r < step
              const isCurrent = r === step
              const isFuture = r > step
              const t = Math.max(-1, Math.min(1, v))
              const baseColor = t >= 0 ? `rgba(167,139,250,${0.15 + t * 0.7})` : `rgba(248,113,113,${0.15 + -t * 0.7})`
              return (
                <motion.rect
                  key={`v-${r}-${c}`}
                  x={c * CELL}
                  y={r * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  initial={{ opacity: 1, fill: baseColor }}
                  animate={{
                    opacity: isFuture ? 0.05 : isPast ? 0.45 : 1,
                    fill: baseColor,
                  }}
                  transition={{ duration: 0.3 }}
                />
              )
            })
          )}
          <motion.rect
            x={-2}
            y={step * CELL - 1}
            width={D_K * CELL + 4}
            height={CELL + 1}
            fill="none"
            stroke={COLORS.amber}
            strokeWidth={2}
            initial={{ opacity: 1 }} animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        </g>

        <text x={700} y={560} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          <tspan fill={COLORS.amber}>{step} new rows computed</tspan>  ·  <tspan fill={COLORS.blue}>{step * 2 * D_K} values reused from cache</tspan>
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'step', value: `${step + 1} / ${SEQ.length}`, color: COLORS.amber },
        { label: 'K cached', value: `[${step}, ${D_K}]`, color: COLORS.blue },
        { label: 'V cached', value: `[${step}, ${D_K}]`, color: COLORS.violet },
        { label: 'reused', value: `${step * 2 * D_K} vals`, color: COLORS.mint },
        { label: 'new', value: `${2 * D_K} vals`, color: COLORS.amber },
        { label: 'cost', value: 'O(N) vs O(N²)', color: COLORS.mint },
      ]} />
    </div>
  )
}

/** ========= 10 · Positional Encoding ========= */
export function ScenePositional() {
  const D = 24
  // Compute sinusoidal positional encoding values for 6 positions
  const POSITIONS = 6
  const encodings: number[][] = []
  for (let pos = 0; pos < POSITIONS; pos++) {
    const row: number[] = []
    for (let i = 0; i < D; i++) {
      const dim = Math.floor(i / 2)
      const freq = 1 / Math.pow(10000, (2 * dim) / D)
      row.push(i % 2 === 0 ? Math.sin(pos * freq) : Math.cos(pos * freq))
    }
    encodings.push(row)
  }

  // A "token embedding" that's the same for each position
  const rng = makeRng(33)
  const tokenEmb = Array.from({ length: D }).map(() => rng() * 1.4 - 0.7)

  const MAT_X = 180
  const MAT_Y = 140
  const CELL = 28

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="pe-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          POSITIONAL ENCODING · EACH POSITION GETS A UNIQUE WAVE PATTERN
        </text>

        {/* Wave curves — one per dimension pair, varying frequency */}
        <g>
          {Array.from({ length: 6 }).map((_, dim) => {
            const freq = 1 / Math.pow(10000, (2 * dim) / D)
            const amp = 40 - dim * 5
            const yBase = 110 + dim * 6
            const pts: string[] = []
            for (let x = 0; x <= 380; x += 3) {
              const pos = (x / 380) * POSITIONS
              const y = yBase + Math.sin(pos * freq * 6) * amp * 0.15
              pts.push(`${x === 0 ? 'M' : 'L'} ${800 + x} ${y}`)
            }
            return (
              <motion.path
                key={dim}
                d={pts.join(' ')}
                fill="none"
                stroke={[COLORS.cyan, COLORS.blue, COLORS.violet, COLORS.pink, COLORS.amber, COLORS.mint][dim]}
                strokeOpacity={0.5}
                strokeWidth={1.2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: dim * 0.2, ease: 'easeOut' }}
              />
            )
          })}
          <text x={1180} y={118} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            low-frequency
          </text>
          <text x={1180} y={148} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            high-frequency
          </text>
          <text x={790} y={218} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            pos 0 → pos {POSITIONS - 1}
          </text>
        </g>

        {/* Matrix of positional encodings (rows = position) */}
        <text x={MAT_X} y={120} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.cyan} letterSpacing="0.18em">
          POS · PE MATRIX
        </text>
        {encodings.map((row, r) => (
          <g key={r}>
            <text x={MAT_X - 10} y={MAT_Y + r * CELL + CELL / 2 + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
              {r}
            </text>
            {row.map((v, c) => {
              const t = Math.max(-1, Math.min(1, v))
              const fill = t >= 0 ? `rgba(34,211,238,${0.15 + t * 0.7})` : `rgba(248,113,113,${0.15 + -t * 0.7})`
              return (
                <motion.rect
                  key={`pe-${r}-${c}`}
                  x={MAT_X + c * CELL}
                  y={MAT_Y + r * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  fill={fill}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + r * 0.06 + c * 0.01 }}
                />
              )
            })}
          </g>
        ))}

        {/* Plus sign */}
        <motion.text
          x={MAT_X + D * CELL / 2}
          y={MAT_Y + POSITIONS * CELL + 48}
          textAnchor="middle"
          fontSize="40"
          fontFamily="var(--font-display)"
          fill={COLORS.amber}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3, type: 'spring', stiffness: 200, damping: 18 }}
        >
          +
        </motion.text>

        {/* Token embedding row (same for every position) */}
        <text x={MAT_X} y={MAT_Y + POSITIONS * CELL + 90} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.violet} letterSpacing="0.18em">
          TOKEN EMBEDDING (same, regardless of position)
        </text>
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}>
          {tokenEmb.map((v, c) => {
            const t = Math.max(-1, Math.min(1, v))
            const fill = t >= 0 ? `rgba(167,139,250,${0.2 + t * 0.7})` : `rgba(248,113,113,${0.2 + -t * 0.7})`
            return (
              <rect
                key={c}
                x={MAT_X + c * CELL}
                y={MAT_Y + POSITIONS * CELL + 100}
                width={CELL - 1}
                height={CELL - 1}
                fill={fill}
              />
            )
          })}
        </motion.g>

        {/* Equals */}
        <motion.text
          x={MAT_X + D * CELL / 2}
          y={MAT_Y + POSITIONS * CELL + 160}
          textAnchor="middle"
          fontSize="40"
          fontFamily="var(--font-display)"
          fill={COLORS.mint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2 }}
        >
          =
        </motion.text>

        {/* Final output (sum) */}
        <text x={MAT_X} y={MAT_Y + POSITIONS * CELL + 200} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.mint} letterSpacing="0.18em">
          INPUT TO BLOCK 0 · different per position
        </text>
        {encodings.map((row, r) => (
          <motion.g
            key={`sum-${r}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.6 + r * 0.12 }}
          >
            {row.map((pe, c) => {
              const sum = pe + tokenEmb[c]
              const t = Math.max(-1, Math.min(1, sum / 1.5))
              const fill = t >= 0 ? `rgba(52,211,153,${0.2 + t * 0.7})` : `rgba(248,113,113,${0.2 + -t * 0.7})`
              return (
                <rect
                  key={c}
                  x={MAT_X + c * CELL}
                  y={MAT_Y + POSITIONS * CELL + 210 + r * 10}
                  width={CELL - 1}
                  height={9}
                  fill={fill}
                />
              )
            })}
          </motion.g>
        ))}
      </svg>

      <NumberPanelDiv chips={[
        { label: 'PE shape', value: '[T, d]', color: COLORS.cyan },
        { label: 'formula', value: 'sin/cos(pos·ωᵢ)', color: COLORS.fg },
        { label: 'ωᵢ range', value: '10⁰ → 10⁻⁴', color: COLORS.dim },
        { label: 'values', value: '∈ [−1, 1]', color: COLORS.fg },
        { label: 'adds to', value: 'token emb', color: COLORS.violet },
      ]} />
    </div>
  )
}

/** ========= 11 · Layer Normalization ========= */
export function SceneLayerNorm() {
  const D = 20
  const rng = makeRng(201)
  const raw = Array.from({ length: D }).map(() => rng() * 4 - 2)
  const mean = raw.reduce((a, b) => a + b, 0) / D
  const centered = raw.map((v) => v - mean)
  const variance = centered.reduce((a, v) => a + v * v, 0) / D
  const std = Math.sqrt(variance + 1e-6)
  const normalized = centered.map((v) => v / std)

  const [phase, setPhase] = useState(0)
  useEffect(() => {
    // 4 phases × 4s = 16s (matches scene duration)
    const id = setInterval(() => setPhase((p) => (p + 1) % 4), 4500)
    return () => clearInterval(id)
  }, [])

  const CELL_W = 44
  const CELL_H = 38
  const startX = (1400 - D * CELL_W) / 2
  const Y1 = 160
  const Y2 = 280
  const Y3 = 400

  function valColor(v: number, scale = 2) {
    const t = Math.max(-1, Math.min(1, v / scale))
    return t >= 0 ? `rgba(96,165,250,${0.2 + t * 0.75})` : `rgba(248,113,113,${0.2 + -t * 0.75})`
  }

  const displayVals = phase >= 3 ? normalized : phase >= 2 ? centered : raw
  const displayY = phase >= 3 ? Y3 : phase >= 2 ? Y2 : Y1
  const displayScale = phase >= 3 ? 2 : phase >= 2 ? 2 : 2

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          LAYERNORM · KEEP ACTIVATIONS STABLE BEFORE EACH SUBLAYER
        </text>

        {/* Raw values at top */}
        <text x={startX} y={Y1 - 12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.fg} letterSpacing="0.18em">
          RAW ACTIVATION  ·  mean = {mean.toFixed(2)}   ·   std = {std.toFixed(2)}
        </text>
        {raw.map((v, i) => (
          <g key={`raw-${i}`}>
            <rect x={startX + i * CELL_W + 1} y={Y1} width={CELL_W - 2} height={CELL_H} fill={valColor(v)} />
            <text x={startX + i * CELL_W + CELL_W / 2} y={Y1 + CELL_H / 2 + 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.fg}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {/* Mean line */}
        <motion.line
          x1={startX}
          x2={startX + D * CELL_W}
          y1={Y1 + CELL_H / 2 + (mean / 4) * CELL_H}
          y2={Y1 + CELL_H / 2 + (mean / 4) * CELL_H}
          stroke={COLORS.amber}
          strokeDasharray="4 4"
          strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: phase >= 1 ? 1 : 0, opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.text
          x={startX + D * CELL_W + 12}
          y={Y1 + CELL_H / 2 + (mean / 4) * CELL_H + 4}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={COLORS.amber}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          mean
        </motion.text>

        {/* Arrow down to centered */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path d={`M 700 ${Y1 + CELL_H + 8} L 700 ${Y2 - 20} M 692 ${Y2 - 28} L 700 ${Y2 - 20} L 708 ${Y2 - 28}`} stroke={COLORS.fg} strokeWidth={1} fill="none" />
          <text x={720} y={(Y1 + CELL_H + 8 + Y2 - 20) / 2 + 4} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.amber}>
            subtract mean
          </text>
        </motion.g>

        {/* Centered values */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: phase >= 2 ? 1 : 0.15 }} transition={{ duration: 0.4 }}>
          <text x={startX} y={Y2 - 12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.amber} letterSpacing="0.18em">
            CENTERED  ·  x − mean  ·  new mean = 0
          </text>
          {centered.map((v, i) => (
            <g key={`cen-${i}`}>
              <rect x={startX + i * CELL_W + 1} y={Y2} width={CELL_W - 2} height={CELL_H} fill={valColor(v)} />
              <text x={startX + i * CELL_W + CELL_W / 2} y={Y2 + CELL_H / 2 + 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.fg}>
                {v.toFixed(1)}
              </text>
            </g>
          ))}
        </motion.g>

        {/* Arrow down to normalized */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path d={`M 700 ${Y2 + CELL_H + 8} L 700 ${Y3 - 20} M 692 ${Y3 - 28} L 700 ${Y3 - 20} L 708 ${Y3 - 28}`} stroke={COLORS.fg} strokeWidth={1} fill="none" />
          <text x={720} y={(Y2 + CELL_H + 8 + Y3 - 20) / 2 + 4} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.mint}>
            divide by std
          </text>
        </motion.g>

        {/* Normalized values */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0.15 }} transition={{ duration: 0.4 }}>
          <text x={startX} y={Y3 - 12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.mint} letterSpacing="0.18em">
            NORMALIZED  ·  (x − mean) / std  ·  mean = 0, std = 1
          </text>
          {normalized.map((v, i) => (
            <g key={`nrm-${i}`}>
              <rect x={startX + i * CELL_W + 1} y={Y3} width={CELL_W - 2} height={CELL_H} fill={valColor(v, 2)} />
              <text x={startX + i * CELL_W + CELL_W / 2} y={Y3 + CELL_H / 2 + 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.fg}>
                {v.toFixed(2)}
              </text>
            </g>
          ))}
        </motion.g>

        <motion.text
          x={700}
          y={Y3 + CELL_H + 38}
          textAnchor="middle"
          fontSize="14"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.fg}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
        >
          {phase === 0 && 'some activations are huge, some tiny — unstable for training'}
          {phase === 1 && 'compute the average across the 384 dims'}
          {phase === 2 && 'center the distribution around zero'}
          {phase === 3 && 'now the vector is stable regardless of magnitude'}
        </motion.text>

        {/* Progress dots */}
        <g transform="translate(80, 520)">
          {['raw', 'mean', 'centered', 'normalized'].map((lbl, i) => (
            <g key={lbl} transform={`translate(${i * 150}, 0)`}>
              <circle cx={8} cy={8} r={5} fill={phase >= i ? [COLORS.fg, COLORS.amber, COLORS.amber, COLORS.mint][i] : COLORS.rule} />
              <text x={22} y={12} fontSize="10" fontFamily="var(--font-mono)" fill={phase >= i ? COLORS.fg : COLORS.dim}>
                {i + 1}. {lbl}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'μ raw', value: mean.toFixed(3), color: COLORS.amber },
        { label: 'σ raw', value: std.toFixed(3), color: COLORS.amber },
        { label: 'μ after', value: '≈ 0', color: COLORS.mint },
        { label: 'σ after', value: '≈ 1', color: COLORS.mint },
        { label: 'params γ, β', value: `2 × ${D}`, color: COLORS.fg },
        { label: 'ε', value: '1e-6', color: COLORS.dim },
      ]} />
    </div>
  )
}

/** ========= 12 · Training / Gradient Descent ========= */
export function SceneTraining() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  // 2D loss surface — we show a bowl-shape via contour lines and a ball descending
  const W = 1400
  const H = 600

  // Loss curve points (simulating gradient descent)
  const steps = 32
  const path: { x: number; y: number; w1: number; w2: number; loss: number }[] = []
  let w1 = 2.6, w2 = 2.2
  for (let i = 0; i < steps; i++) {
    // gradient of (w1² + 1.6*w2² + noise)
    const gradW1 = 2 * w1
    const gradW2 = 2 * 1.6 * w2
    const lr = 0.12
    w1 -= lr * gradW1 * (0.8 + Math.random() * 0.2)
    w2 -= lr * gradW2 * (0.8 + Math.random() * 0.2)
    const loss = w1 * w1 + 1.6 * w2 * w2
    const x = 450 + w1 * 80
    const y = 330 - w2 * 60
    path.push({ x, y, w1, w2, loss })
  }

  const currentStep = tick % (steps + 6)
  const clamped = Math.min(currentStep, steps - 1)

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs>
          <radialGradient id="bowl" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(52,211,153,0.4)" />
            <stop offset="50%" stopColor="rgba(245,158,11,0.25)" />
            <stop offset="100%" stopColor="rgba(248,113,113,0.08)" />
          </radialGradient>
          <filter id="train-glow"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>

        <text x={W / 2} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          GRADIENT DESCENT · HOW THE WEIGHTS GET LEARNED
        </text>

        {/* Loss surface contours (ellipses) */}
        {[5, 4, 3, 2, 1].map((r, i) => (
          <ellipse
            key={i}
            cx={450}
            cy={330}
            rx={r * 80}
            ry={r * 60}
            fill={i === 0 ? 'url(#bowl)' : 'none'}
            stroke={`rgba(245,158,11,${0.25 - i * 0.03})`}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        ))}

        {/* Minimum marker */}
        <circle cx={450} cy={330} r={5} fill={COLORS.mint} filter="url(#train-glow)" />
        <text x={450} y={356} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.mint}>
          minimum
        </text>

        {/* Axes */}
        <line x1={50} x2={870} y1={520} y2={520} stroke={COLORS.rule} />
        <line x1={450} x2={450} y1={80} y2={520} stroke={COLORS.rule} strokeDasharray="2 3" />
        <text x={870} y={536} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>w₁</text>
        <text x={456} y={80} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>w₂</text>

        {/* Path traced so far */}
        <motion.path
          d={path.slice(0, clamped + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="none"
          stroke={COLORS.blue}
          strokeOpacity={0.65}
          strokeWidth={2}
        />

        {/* Gradient arrow at current position */}
        {clamped > 0 && clamped < steps - 1 && (() => {
          const cur = path[clamped]
          const next = path[clamped + 1]
          const dx = next.x - cur.x
          const dy = next.y - cur.y
          const len = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / (len || 1), ny = dy / (len || 1)
          const tipX = cur.x + nx * 50, tipY = cur.y + ny * 50
          return (
            <g>
              <line x1={cur.x} x2={tipX} y1={cur.y} y2={tipY} stroke={COLORS.amber} strokeWidth={2} />
              <circle cx={tipX} cy={tipY} r={4} fill={COLORS.amber} />
              <text x={tipX + nx * 16} y={tipY + ny * 16 + 4} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.amber}>
                −∇ loss
              </text>
            </g>
          )
        })()}

        {/* Ball at current position */}
        <motion.circle
          cx={path[clamped]?.x ?? path[0].x}
          cy={path[clamped]?.y ?? path[0].y}
          r={10}
          fill={COLORS.red}
          filter="url(#train-glow)"
        />

        {/* Loss chart on the right */}
        <g transform="translate(960, 120)">
          <text x={0} y={-12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
            LOSS OVER STEPS
          </text>
          <rect x={0} y={0} width={380} height={280} fill="rgba(255,255,255,0.02)" stroke={COLORS.rule} />
          <motion.path
            d={path.slice(0, clamped + 1).map((p, i) => {
              const x = (i / (steps - 1)) * 370 + 5
              const y = 280 - Math.min(280, (p.loss / path[0].loss) * 270)
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
            }).join(' ')}
            fill="none"
            stroke={COLORS.red}
            strokeWidth={2}
          />
          {/* Axis labels */}
          <text x={5} y={296} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>0</text>
          <text x={370} y={296} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim} textAnchor="end">{steps} steps</text>
          <text x={-8} y={10} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim} textAnchor="end">high</text>
          <text x={-8} y={280} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim} textAnchor="end">low</text>
          <text x={380} y={8} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.red} textAnchor="end">
            step {clamped + 1} / {steps}
          </text>
          <text x={380} y={24} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.amber} textAnchor="end">
            loss = {path[clamped]?.loss.toFixed(2)}
          </text>
        </g>

        {/* Readout at bottom */}
        <text x={W / 2} y={H - 40} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          every weight matrix — W_q, W_k, W_v, W_ffn, embedding — is{' '}
          <tspan fill={COLORS.mint}>shaped by this process</tspan>
        </text>
        <text x={W / 2} y={H - 18} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          forward pass → compute loss → backprop the gradient → update weights → repeat millions of times
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'step', value: `${clamped + 1} / ${steps}`, color: COLORS.red },
        { label: 'loss', value: path[clamped]?.loss.toFixed(2) ?? '—', color: COLORS.amber },
        { label: 'w₁', value: path[clamped]?.w1.toFixed(2) ?? '—', color: COLORS.blue },
        { label: 'w₂', value: path[clamped]?.w2.toFixed(2) ?? '—', color: COLORS.red },
        { label: 'lr', value: '0.12', color: COLORS.cyan },
        { label: 'Δloss', value: clamped > 0 ? ((path[clamped].loss - path[clamped - 1].loss) || 0).toFixed(2) : '0.00', color: COLORS.dim },
      ]} />
    </div>
  )
}

/** ========= 13 · BPE tokenization (3 sub-phases) ========= */
function BPEByteVocab() {
  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="bpe-bytes">
      <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        STEP 1 · BPE STARTS FROM A BYTE VOCABULARY (256 ENTRIES)
      </text>
      <motion.text x={700} y={104} textAnchor="middle" fontSize="22" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.violet}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        every byte is already a token · no words yet
      </motion.text>
      {Array.from({ length: 128 }).map((_, i) => {
        const col = i % 16
        const row = Math.floor(i / 16)
        const x = 200 + col * 64
        const y = 150 + row * 46
        const byte = i
        const printable = byte >= 32 && byte < 127
        const char = printable ? String.fromCharCode(byte) : `·`
        return (
          <motion.g key={i} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.008 }}>
            <rect x={x} y={y} width={56} height={38} rx={2} fill="rgba(167,139,250,0.05)" stroke={COLORS.violet} strokeOpacity={0.3} />
            <text x={x + 28} y={y + 18} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill={printable ? COLORS.fg : COLORS.dim}>
              {char}
            </text>
            <text x={x + 28} y={y + 32} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill={COLORS.dim}>
              {byte}
            </text>
          </motion.g>
        )
      })}
      <text x={700} y={540} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
        vocabulary[0..255] · now we <tspan fill={COLORS.violet}>merge</tspan> the most frequent pairs…
      </text>
    </svg>
  )
}

function BPESingleMerge() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 1500)
    return () => clearInterval(id)
  }, [])

  const pairs = [
    { a: 'e', b: 'r', count: 843, merged: 'er' },
    { a: 't', b: 'h', count: 672, merged: 'th' },
    { a: 'i', b: 'n', count: 588, merged: 'in' },
    { a: 'er', b: 's', count: 410, merged: 'ers' },
  ]
  const p = pairs[step]

  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="bpe-merge">
      <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        STEP 2 · COUNT PAIRS · MERGE THE MOST FREQUENT · REPEAT
      </text>

      {/* Current pair being considered */}
      <motion.g key={`pair-${step}`}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <text x={700} y={110} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          MERGE {step + 1} · winning pair
        </text>
        <rect x={500} y={140} width={120} height={100} rx={6} fill="rgba(96,165,250,0.12)" stroke={COLORS.blue} strokeWidth={2} />
        <text x={560} y={196} textAnchor="middle" fontSize="44" fontFamily="var(--font-mono)" fill={COLORS.blue}>{p.a}</text>
        <rect x={630} y={140} width={120} height={100} rx={6} fill="rgba(96,165,250,0.12)" stroke={COLORS.blue} strokeWidth={2} />
        <text x={690} y={196} textAnchor="middle" fontSize="44" fontFamily="var(--font-mono)" fill={COLORS.blue}>{p.b}</text>
        <motion.text x={620} y={196} textAnchor="middle" fontSize="28" fontFamily="var(--font-display)" fill={COLORS.amber}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
          +
        </motion.text>
        <text x={620} y={270} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.amber}>
          frequency = {p.count.toLocaleString()}
        </text>
      </motion.g>

      <motion.path d="M 620 290 L 620 340 M 612 332 L 620 340 L 628 332" stroke={COLORS.mint} strokeWidth={1.5} fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />

      <motion.g key={`merged-${step}`}
        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}>
        <rect x={480} y={360} width={280} height={110} rx={6} fill="rgba(52,211,153,0.15)" stroke={COLORS.mint} strokeWidth={2} />
        <text x={620} y={430} textAnchor="middle" fontSize="56" fontFamily="var(--font-mono)" fill={COLORS.mint}>{p.merged}</text>
        <text x={620} y={500} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          new vocab entry · id = 256 + {step}
        </text>
      </motion.g>

      {/* Rule table on right */}
      <g transform="translate(880, 140)">
        <text fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          MERGE RULES LEARNED
        </text>
        {pairs.slice(0, step + 1).map((r, i) => (
          <motion.g key={i} transform={`translate(0, ${24 + i * 32})`}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <text x={0} y={14} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>#{i + 1}</text>
            <text x={30} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.blue}>{r.a}</text>
            <text x={60} y={14} fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>+</text>
            <text x={80} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.blue}>{r.b}</text>
            <text x={120} y={14} fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>→</text>
            <text x={150} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.mint}>{r.merged}</text>
          </motion.g>
        ))}
      </g>
    </svg>
  )
}

function BPEMergeTree() {
  const WORD = 'unbelievably'
  // Build a merge tree bottom-up
  // Layer 0: raw bytes (12 tokens)
  // Layer 1: e+r -> er, a+b -> ab, l+y -> ly (simulated)
  // Layer 2: believ merges, ably merges
  // Layer 3: [un, believ, ably]

  return (
    <svg viewBox="0 0 1400 600" width="100%" height="100%" key="bpe-tree">
      <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
        STEP 3 · APPLYING LEARNED RULES TO TOKENIZE A NEW WORD
      </text>

      {/* Bottom row — raw bytes */}
      {WORD.split('').map((ch, i) => (
        <motion.g key={`b-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
          <rect x={180 + i * 80} y={460} width={68} height={48} rx={3} fill="rgba(96,165,250,0.08)" stroke={COLORS.blue} strokeOpacity={0.5} />
          <text x={180 + i * 80 + 34} y={492} textAnchor="middle" fontSize="22" fontFamily="var(--font-mono)" fill={COLORS.blue}>{ch}</text>
        </motion.g>
      ))}
      <text x={110} y={488} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>bytes</text>

      {/* Layer 1 merges */}
      {[
        { from: [3, 4], label: 'be', cx: 180 + 3.5 * 80 + 34 },
        { from: [5, 6], label: 'li', cx: 180 + 5.5 * 80 + 34 },
        { from: [9, 10], label: 'bl', cx: 180 + 9.5 * 80 + 34 },
      ].map((m, i) => (
        <motion.g key={`m1-${i}`}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 + i * 0.3 }}>
          <path d={`M ${180 + m.from[0] * 80 + 34} 460 L ${m.cx} 400 L ${180 + m.from[1] * 80 + 34} 460`}
            stroke={COLORS.mint} strokeOpacity={0.4} fill="none" strokeWidth={1} />
          <rect x={m.cx - 40} y={350} width={80} height={44} rx={3} fill="rgba(52,211,153,0.1)" stroke={COLORS.mint} />
          <text x={m.cx} y={378} textAnchor="middle" fontSize="18" fontFamily="var(--font-mono)" fill={COLORS.mint}>{m.label}</text>
        </motion.g>
      ))}
      <text x={110} y={378} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>merge 1</text>

      {/* Layer 2 merges */}
      {[
        { cx: 300, label: 'un', sub: 'rule #17' },
        { cx: 580, label: 'believ', sub: 'rule #94' },
        { cx: 960, label: 'ably', sub: 'rule #52' },
      ].map((m, i) => (
        <motion.g key={`m2-${i}`}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 4 + i * 0.3, type: 'spring', stiffness: 140, damping: 18 }}>
          <rect x={m.cx - 80} y={220} width={160} height={70} rx={5} fill="rgba(167,139,250,0.15)" stroke={COLORS.violet} strokeWidth={2} />
          <text x={m.cx} y={258} textAnchor="middle" fontSize="28" fontFamily="var(--font-mono)" fill={COLORS.violet}>{m.label}</text>
          <text x={m.cx} y={278} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>{m.sub}</text>
        </motion.g>
      ))}
      <text x={110} y={258} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.violet}>final tokens</text>

      {/* Caption */}
      <motion.text x={700} y={140} textAnchor="middle" fontSize="17" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5 }}>
        3 tokens instead of 12 — same information
      </motion.text>
    </svg>
  )
}

export function SceneBPE() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    // 3 sub-phases × 10s = 30s (matches scene duration — no sub-phase gets repeated)
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 10670)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div key={phase}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full">
          {phase === 0 && <BPEByteVocab />}
          {phase === 1 && <BPESingleMerge />}
          {phase === 2 && <BPEMergeTree />}
        </motion.div>
      </AnimatePresence>
      {/* Phase pips */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i}
            className="h-1 w-12 rounded-full transition-colors"
            style={{ background: phase >= i ? COLORS.violet : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
    </div>
  )
}


/** ========= 14 · Cross-entropy loss ========= */
export function SceneCrossEntropy() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    // 3 scenarios × 4.67s = 14s (matches scene duration)
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 5330)
    return () => clearInterval(id)
  }, [])

  // Three scenarios: good prediction, ok prediction, bad prediction
  // In each: target = 'c' (id 2), predicted probabilities vary
  const TOKENS = ['a', 'b', 'c', 'd', 'e', 'f']
  const TARGET_IDX = 2

  const SCENARIOS = [
    { label: 'confident & correct', probs: [0.05, 0.05, 0.75, 0.05, 0.05, 0.05], loss: -Math.log(0.75) },
    { label: 'uncertain', probs: [0.12, 0.15, 0.28, 0.15, 0.18, 0.12], loss: -Math.log(0.28) },
    { label: 'confident & wrong', probs: [0.1, 0.6, 0.08, 0.1, 0.06, 0.06], loss: -Math.log(0.08) },
  ]

  const s = SCENARIOS[phase]
  const BAR_W = 90
  const BAR_GAP = 22
  const BAR_MAX_H = 200
  const BARS_X = 150
  const BARS_Y = 360

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          CROSS-ENTROPY LOSS · −LOG( P OF THE CORRECT TOKEN )
        </text>

        {/* Target (one-hot) */}
        <text x={150} y={130} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.mint} letterSpacing="0.18em">
          TARGET (ONE-HOT)
        </text>
        {TOKENS.map((t, i) => (
          <g key={`tgt-${i}`}>
            <rect
              x={BARS_X + i * (BAR_W + BAR_GAP)}
              y={150}
              width={BAR_W}
              height={36}
              rx={2}
              fill={i === TARGET_IDX ? COLORS.mint : 'rgba(255,255,255,0.03)'}
              stroke={i === TARGET_IDX ? COLORS.mint : COLORS.rule}
            />
            <text
              x={BARS_X + i * (BAR_W + BAR_GAP) + BAR_W / 2}
              y={174}
              textAnchor="middle"
              fontSize="14"
              fontFamily="var(--font-mono)"
              fill={i === TARGET_IDX ? COLORS.bg : COLORS.dim}
            >
              {i === TARGET_IDX ? '1.0' : '0.0'}
            </text>
          </g>
        ))}

        {/* Predicted probabilities */}
        <motion.text
          key={`plabel-${phase}`}
          x={150}
          y={240}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill={COLORS.amber}
          letterSpacing="0.18em"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          PREDICTION · {s.label.toUpperCase()}
        </motion.text>

        {/* Bars */}
        {s.probs.map((p, i) => {
          const h = p * BAR_MAX_H
          const x = BARS_X + i * (BAR_W + BAR_GAP)
          const y = BARS_Y - h
          const isTarget = i === TARGET_IDX
          return (
            <g key={`bar-${i}`}>
              <motion.rect
                x={x}
                width={BAR_W}
                rx={3}
                animate={{ y, height: h, fill: isTarget ? COLORS.mint : COLORS.blue }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                opacity={0.8}
              />
              <motion.text
                x={x + BAR_W / 2}
                textAnchor="middle"
                fontSize="13"
                fontFamily="var(--font-mono)"
                fill={isTarget ? COLORS.mint : COLORS.fg}
                animate={{ y: y - 8 }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              >
                {(p * 100).toFixed(0)}%
              </motion.text>
              <rect
                x={x}
                y={BARS_Y + 8}
                width={BAR_W}
                height={40}
                rx={3}
                fill="rgba(255,255,255,0.02)"
                stroke={isTarget ? COLORS.mint : COLORS.rule}
                strokeWidth={isTarget ? 2 : 1}
              />
              <text
                x={x + BAR_W / 2}
                y={BARS_Y + 34}
                textAnchor="middle"
                fontSize="20"
                fontFamily="var(--font-mono)"
                fill={isTarget ? COLORS.mint : COLORS.fg}
              >
                {TOKENS[i]}
              </text>
            </g>
          )
        })}

        {/* Loss formula + value */}
        <motion.g
          key={`loss-${phase}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <rect x={1020} y={150} width={320} height={120} rx={3} fill="rgba(248,113,113,0.08)" stroke={COLORS.red} />
          <text x={1180} y={180} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.red} letterSpacing="0.18em">
            LOSS
          </text>
          <text x={1180} y={210} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            −log( {s.probs[TARGET_IDX].toFixed(2)} )
          </text>
          <motion.text
            x={1180}
            y={252}
            textAnchor="middle"
            fontSize="42"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={s.loss < 0.5 ? COLORS.mint : s.loss < 1.5 ? COLORS.amber : COLORS.red}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            {s.loss.toFixed(2)}
          </motion.text>
        </motion.g>

        <text x={700} y={500} textAnchor="middle" fontSize="15" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          cross-entropy  =  <tspan fill={COLORS.amber}>−log p(target)</tspan>
        </text>
        <text x={700} y={524} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          {phase === 0 && 'near-zero loss when the model is confident and right'}
          {phase === 1 && 'medium loss when it is uncertain'}
          {phase === 2 && 'huge loss when it is confident and wrong — gradient will push HARD'}
        </text>
        <text x={700} y={548} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim} fontStyle="italic">
          why −log? p→0 sends loss → ∞, producing a strong gradient to fix confident mistakes. squared error wouldn&apos;t.
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'vocab', value: `V=${TOKENS.length}`, color: COLORS.fg },
        { label: 'p(correct)', value: s.probs[TARGET_IDX].toFixed(2), color: COLORS.mint },
        { label: '−log(p)', value: s.loss.toFixed(2), color: s.loss < 0.5 ? COLORS.mint : s.loss < 1.5 ? COLORS.amber : COLORS.red },
        { label: 'bits', value: `${(s.loss / Math.log(2)).toFixed(2)}`, color: COLORS.dim },
        { label: 'best case', value: '0.00', color: COLORS.mint },
        { label: 'random', value: `${Math.log(TOKENS.length).toFixed(2)}`, color: COLORS.dim },
      ]} />
    </div>
  )
}

/** ========= 15 · Backpropagation ========= */
export function SceneBackprop() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 8), 900)
    return () => clearInterval(id)
  }, [])

  const LAYERS = ['input', 'block 0', 'block 1', 'block 2', 'block 3', 'block 4', 'block 5', 'output']
  const N = LAYERS.length
  const layerX = (i: number) => 120 + i * 160

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="bp-glow"><feGaussianBlur stdDeviation="3.5" /></filter>
        </defs>

        <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          BACKPROPAGATION · GRADIENTS FLOW BACKWARD
        </text>

        {/* Forward pass layer boxes */}
        {LAYERS.map((lbl, i) => {
          const x = layerX(i)
          const isForwardActive = tick < 4 ? tick >= Math.floor((i / N) * 4) : false
          const isBackActive = tick >= 4 ? N - 1 - i <= (tick - 4) * 2 : false
          return (
            <g key={i}>
              <motion.rect
                x={x - 55}
                y={220}
                width={110}
                height={140}
                rx={3}
                fill={isForwardActive || isBackActive ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.025)'}
                stroke={isBackActive ? COLORS.red : isForwardActive ? COLORS.blue : COLORS.rule}
                strokeWidth={isBackActive ? 2 : 1}
                animate={{
                  strokeOpacity: isBackActive ? 1 : isForwardActive ? 0.7 : 0.3,
                }}
              />
              <text x={x} y={248} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.fg}>
                {lbl}
              </text>
              <text x={x} y={268} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                W_{i}
              </text>

              {/* Weight indicators with small animated squares */}
              {Array.from({ length: 9 }).map((_, k) => (
                <motion.rect
                  key={k}
                  x={x - 36 + (k % 3) * 24}
                  y={284 + Math.floor(k / 3) * 20}
                  width={18}
                  height={14}
                  rx={1}
                  fill={isBackActive ? COLORS.red : COLORS.blue}
                  initial={{ opacity: 0.1 }}
                  animate={{ opacity: isBackActive ? [0.2, 0.9, 0.3] : isForwardActive ? [0.2, 0.8, 0.5] : 0.1 }}
                  transition={{ duration: 0.6, delay: k * 0.04 }}
                />
              ))}
            </g>
          )
        })}

        {/* Forward pass arrow */}
        {tick < 4 && (
          <motion.g key={`fwd-${tick}`}>
            <motion.text x={700} y={200} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.blue} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              forward pass →
            </motion.text>
            {Array.from({ length: 3 }).map((_, p) => (
              <motion.circle
                key={p}
                r={5}
                cy={310}
                fill={COLORS.blue}
                filter="url(#bp-glow)"
                initial={{ cx: layerX(0), opacity: 0 }}
                animate={{ cx: [layerX(0), layerX(N - 1)], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 3.5,
                  delay: p * 0.4,
                  times: [0, 0.1, 0.85, 1],
                  ease: 'linear',
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Backward pass arrow */}
        {tick >= 4 && (
          <motion.g key={`bwd-${tick}`}>
            <motion.text x={700} y={200} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.red} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ← gradient flows back
            </motion.text>
            {Array.from({ length: 3 }).map((_, p) => (
              <motion.circle
                key={p}
                r={5}
                cy={310}
                fill={COLORS.red}
                filter="url(#bp-glow)"
                initial={{ cx: layerX(N - 1), opacity: 0 }}
                animate={{ cx: [layerX(N - 1), layerX(0)], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 3.5,
                  delay: p * 0.4,
                  times: [0, 0.1, 0.85, 1],
                  ease: 'linear',
                }}
              />
            ))}
          </motion.g>
        )}

        {/* Loss callout at the right */}
        <g transform={`translate(${layerX(N - 1) + 90}, 220)`}>
          <rect width={120} height={140} rx={3} fill="rgba(248,113,113,0.1)" stroke={COLORS.red} />
          <text x={60} y={42} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.red}>LOSS</text>
          <motion.text
            x={60} y={90}
            textAnchor="middle"
            fontSize="36"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={COLORS.red}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            L
          </motion.text>
          <text x={60} y={124} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>compare to target</text>
        </g>

        {/* Chain rule formula */}
        <text x={700} y={440} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
          ∂L/∂W<tspan fontSize="9">i</tspan>   =   ∂L/∂a<tspan fontSize="9">i+1</tspan>   ·   ∂a<tspan fontSize="9">i+1</tspan>/∂W<tspan fontSize="9">i</tspan>
        </text>
        <text x={700} y={464} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          chain rule: each layer&apos;s gradient = next layer&apos;s gradient × local derivative
        </text>

        <text x={700} y={530} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          once every weight knows <tspan fill={COLORS.red}>∂L/∂W</tspan>, the optimizer nudges it <tspan fill={COLORS.mint}>down the gradient</tspan>
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'layers', value: String(N), color: COLORS.fg },
        { label: 'gradients', value: `N × ∇W`, color: COLORS.red },
        { label: 'pass', value: tick < 4 ? 'FORWARD' : 'BACKWARD', color: tick < 4 ? COLORS.blue : COLORS.red },
        { label: 'rule', value: 'chain', color: COLORS.fg },
        { label: 'memory', value: 'activations', color: COLORS.dim },
        { label: 'depth', value: '1 pass back', color: COLORS.mint },
      ]} />
    </div>
  )
}

/** ========= 16 · RoPE (Rotary Position Embeddings) ========= */
export function SceneRoPE() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500)
    return () => clearInterval(id)
  }, [])

  const N_POS = 6
  const currentPos = tick % N_POS

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="rope-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          ROPE · ROTARY POSITION EMBEDDINGS (LLAMA, GPT-NEOX)
        </text>

        {/* Classical positional encoding (left side) */}
        <text x={350} y={110} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim} letterSpacing="0.18em">
          CLASSIC · ADDS POSITION TO EMBEDDING
        </text>
        <g transform="translate(250, 130)">
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={i * 22} y={0} width={20} height={30} fill={`rgba(167,139,250,${0.2 + (i * 0.1)})`} />
          ))}
          <text x={65} y={50} textAnchor="middle" fontSize="16" fontFamily="var(--font-display)" fill={COLORS.amber}>+</text>
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={i * 22} y={60} width={20} height={30} fill={`rgba(34,211,238,${0.3 + Math.sin(i) * 0.3})`} />
          ))}
          <text x={65} y={110} textAnchor="middle" fontSize="16" fontFamily="var(--font-display)" fill={COLORS.mint}>=</text>
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={i * 22} y={120} width={20} height={30} fill={`rgba(52,211,153,${0.3 + i * 0.1})`} />
          ))}
          <text x={-10} y={18} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>token</text>
          <text x={-10} y={78} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>pos</text>
          <text x={-10} y={138} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>input</text>
        </g>

        {/* Dividing line */}
        <line x1={700} x2={700} y1={100} y2={540} stroke={COLORS.ruleStrong} strokeDasharray="4 4" />

        {/* RoPE (right side) */}
        <text x={1050} y={110} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.pink} letterSpacing="0.18em">
          ROPE · ROTATES Q AND K BY POSITION
        </text>

        {/* 2D rotation visualization */}
        <g transform="translate(950, 310)">
          {/* axes */}
          <line x1={-120} x2={120} y1={0} y2={0} stroke={COLORS.rule} />
          <line x1={0} x2={0} y1={-120} y2={120} stroke={COLORS.rule} />
          {/* reference vector */}
          <motion.line
            x1={0} y1={0}
            x2={90} y2={0}
            stroke={COLORS.blue}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.4}
          />
          <text x={95} y={0} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>pos 0</text>

          {/* rotated vectors at each position */}
          {Array.from({ length: N_POS }).map((_, i) => {
            const angle = (i / (N_POS - 1)) * Math.PI * 0.8  // rotate gradually
            const ex = 90 * Math.cos(angle)
            const ey = -90 * Math.sin(angle)
            const isCurrent = i === currentPos
            return (
              <g key={i}>
                <motion.line
                  x1={0} y1={0}
                  x2={ex} y2={ey}
                  stroke={isCurrent ? COLORS.pink : `rgba(236,72,153,${0.15 + i * 0.1})`}
                  strokeWidth={isCurrent ? 3 : 1.5}
                  filter={isCurrent ? 'url(#rope-glow)' : undefined}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: isCurrent ? 1 : 0.4 }}
                />
                {isCurrent && (
                  <motion.circle
                    cx={ex} cy={ey}
                    r={6}
                    fill={COLORS.pink}
                    filter="url(#rope-glow)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={i}
                  />
                )}
              </g>
            )
          })}

          {/* arc showing rotation */}
          <motion.path
            key={`arc-${currentPos}`}
            d={`M 40 0 A 40 40 0 0 0 ${40 * Math.cos((currentPos / (N_POS - 1)) * Math.PI * 0.8)} ${-40 * Math.sin((currentPos / (N_POS - 1)) * Math.PI * 0.8)}`}
            fill="none"
            stroke={COLORS.pink}
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />

          <motion.text
            key={`label-${currentPos}`}
            x={0} y={150}
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-mono)"
            fill={COLORS.pink}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            position {currentPos} · angle θ·{currentPos}
          </motion.text>
        </g>

        <text x={700} y={510} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          position becomes <tspan fill={COLORS.pink}>rotation</tspan>, not addition
        </text>
        <text x={700} y={538} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          relative position emerges from dot product of rotated Q and K vectors · extrapolates to longer sequences
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'position', value: `${currentPos}`, color: COLORS.pink },
        { label: 'θ base', value: '10,000⁻²ⁱ/ᵈ', color: COLORS.dim },
        { label: 'applied to', value: 'Q, K only', color: COLORS.fg },
        { label: 'params', value: '0 (analytic)', color: COLORS.mint },
        { label: 'extrapolates', value: 'yes', color: COLORS.mint },
      ]} />
    </div>
  )
}

/** ========= 17 · Modern architecture (RMSNorm + SwiGLU + GQA) ========= */
export function SceneModern() {
  const [panel, setPanel] = useState(0)

  useEffect(() => {
    // 3 panels × 7.33s = 22s (matches scene duration)
    const id = setInterval(() => setPanel((p) => (p + 1) % 3), 8000)
    return () => clearInterval(id)
  }, [])

  const PANELS = [
    { kicker: 'normalization', classic: 'LayerNorm', modern: 'RMSNorm' },
    { kicker: 'ffn activation', classic: 'ReLU', modern: 'SwiGLU' },
    { kicker: 'attention', classic: 'MHA · 6 × K,V', modern: 'GQA · 2 groups' },
  ]
  const P = PANELS[panel]

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="mod-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        <motion.text
          key={`k-${panel}`}
          x={700} y={60}
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-mono)"
          letterSpacing="0.18em"
          fill={COLORS.dim}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 60 }}
        >
          MODERN UPGRADES · {P.kicker.toUpperCase()}
        </motion.text>

        {/* Left panel: CLASSIC */}
        <g transform="translate(80, 120)">
          <text fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
            CLASSIC
          </text>
          <motion.text
            key={`c-${panel}`}
            x={0} y={54}
            fontSize="42"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={COLORS.fg}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {P.classic}
          </motion.text>

          {/* LayerNorm vs RMSNorm visual */}
          {panel === 0 && (
            <g transform="translate(0, 90)">
              <text fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.amber}>steps:</text>
              {['subtract mean', 'divide by std', 'scale · shift (γ, β)'].map((s, i) => (
                <g key={i} transform={`translate(0, ${24 + i * 36})`}>
                  <circle cx={8} cy={14} r={6} fill={COLORS.amber} />
                  <text x={24} y={18} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.fg}>{s}</text>
                </g>
              ))}
              <text x={0} y={160} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                5 operations · needs both mean & var
              </text>
            </g>
          )}

          {panel === 1 && (
            <g transform="translate(0, 90)">
              {/* ReLU curve */}
              <svg viewBox="-60 -100 220 180" width={260} height={180}>
                <line x1={-60} x2={160} y1={0} y2={0} stroke={COLORS.rule} />
                <line x1={0} x2={0} y1={-90} y2={90} stroke={COLORS.rule} />
                <path d="M -60 0 L 0 0 L 100 -90" stroke={COLORS.fg} strokeWidth={2.5} fill="none" />
                <text x={20} y={80} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>sharp kink at 0</text>
              </svg>
              <text x={0} y={170} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                zero gradient for negatives → dead neurons
              </text>
            </g>
          )}

          {panel === 2 && (
            <g transform="translate(0, 90)">
              {Array.from({ length: 6 }).map((_, h) => (
                <g key={h} transform={`translate(${(h % 3) * 84}, ${Math.floor(h / 3) * 70})`}>
                  <rect width={72} height={56} rx={3} fill="rgba(96,165,250,0.08)" stroke={COLORS.blue} />
                  <text x={36} y={20} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.blue}>head {h}</text>
                  <rect x={8} y={28} width={26} height={20} rx={2} fill="rgba(96,165,250,0.4)" />
                  <rect x={38} y={28} width={26} height={20} rx={2} fill="rgba(167,139,250,0.4)" />
                  <text x={21} y={42} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill={COLORS.bg}>K</text>
                  <text x={51} y={42} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill={COLORS.bg}>V</text>
                </g>
              ))}
              <text x={0} y={168} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                6 heads × 2 matrices = 12 KV tensors per layer
              </text>
            </g>
          )}
        </g>

        {/* Divider */}
        <motion.path
          d="M 700 100 L 700 500"
          stroke={COLORS.ruleStrong}
          strokeDasharray="5 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
        <motion.text
          x={700} y={290}
          textAnchor="middle"
          fontSize="20"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fill={COLORS.mint}
          animate={{ x: [700, 710, 700] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          →
        </motion.text>

        {/* Right panel: MODERN */}
        <g transform="translate(760, 120)">
          <text fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.mint}>
            MODERN · LLAMA 3
          </text>
          <motion.text
            key={`m-${panel}`}
            x={0} y={54}
            fontSize="42"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fill={COLORS.mint}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {P.modern}
          </motion.text>

          {panel === 0 && (
            <g transform="translate(0, 90)">
              <text fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.mint}>steps:</text>
              {['compute RMS', 'divide by RMS', 'scale · γ'].map((s, i) => (
                <g key={i} transform={`translate(0, ${24 + i * 36})`}>
                  <circle cx={8} cy={14} r={6} fill={COLORS.mint} />
                  <text x={24} y={18} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.fg}>{s}</text>
                </g>
              ))}
              <text x={0} y={160} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                3 operations · faster · no mean subtraction
              </text>
            </g>
          )}

          {panel === 1 && (
            <g transform="translate(0, 90)">
              <svg viewBox="-60 -100 220 180" width={260} height={180}>
                <line x1={-60} x2={160} y1={0} y2={0} stroke={COLORS.rule} />
                <line x1={0} x2={0} y1={-90} y2={90} stroke={COLORS.rule} />
                {(() => {
                  const pts: string[] = []
                  for (let x = -60; x <= 160; x += 2) {
                    const xv = x / 30
                    // Swish-like: x * sigmoid(x) gated
                    const sig = 1 / (1 + Math.exp(-xv))
                    const y = -xv * sig * 30
                    pts.push(`${x === -60 ? 'M' : 'L'} ${x} ${y}`)
                  }
                  return <path d={pts.join(' ')} stroke={COLORS.mint} strokeWidth={2.5} fill="none" />
                })()}
                <text x={20} y={80} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>smooth · gated</text>
              </svg>
              <text x={0} y={170} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                gradient flows everywhere · no dead neurons
              </text>
            </g>
          )}

          {panel === 2 && (
            <g transform="translate(0, 90)">
              {/* 2 groups of K/V shared across 6 heads */}
              {Array.from({ length: 6 }).map((_, h) => {
                const group = Math.floor(h / 3)
                return (
                  <g key={h} transform={`translate(${(h % 3) * 84}, ${Math.floor(h / 3) * 70})`}>
                    <rect width={72} height={56} rx={3} fill={`rgba(${group === 0 ? '52,211,153' : '167,139,250'}, 0.08)`} stroke={group === 0 ? COLORS.mint : COLORS.violet} />
                    <text x={36} y={20} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={group === 0 ? COLORS.mint : COLORS.violet}>
                      head {h} · grp {group}
                    </text>
                    <text x={36} y={44} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={group === 0 ? COLORS.mint : COLORS.violet}>
                      shares K,V
                    </text>
                  </g>
                )
              })}
              <text x={0} y={168} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
                2 groups × 2 matrices = 4 KV tensors · 3× less memory
              </text>
            </g>
          )}
        </g>

        <text x={700} y={540} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          same architecture shape · smaller, faster, better
        </text>
      </svg>

      <NumberPanelDiv chips={[
        { label: 'comparison', value: P.kicker, color: COLORS.mint },
        { label: 'classic', value: P.classic.split(' · ')[0], color: COLORS.fg },
        { label: 'modern', value: P.modern.split(' · ')[0], color: COLORS.mint },
        { label: 'family', value: 'Llama 3', color: COLORS.fg },
        { label: 'impact', value: panel === 2 ? '3× KV' : panel === 0 ? 'faster' : 'better', color: COLORS.mint },
      ]} />
    </div>
  )
}

/** ========= SUB · FFN · GELU curve ========= */
export function SceneFFNGelu() {
  // Single sweep of the probe dot from x=-3 to x=+5, then hold at +5.
  // Previously the dot bounced forever, which looked like the function
  // was being "explored" — it's just a fixed curve.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t < 80 ? t + 1 : t)), 90)
    return () => clearInterval(id)
  }, [])

  const W = 1400
  const H = 600
  const cx = W / 2
  const cy = 340
  const xScale = 90   // px per unit
  const yScale = 90

  // Build curves
  const xs: number[] = []
  for (let x = -5; x <= 5; x += 0.1) xs.push(+x.toFixed(2))
  const relu = (x: number) => Math.max(0, x)
  const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)))
  const swish = (x: number) => x / (1 + Math.exp(-x))

  function path(fn: (x: number) => number) {
    return xs.map((x, i) => {
      const px = cx + x * xScale
      const py = cy - fn(x) * yScale
      return `${i === 0 ? 'M' : 'L'} ${px} ${py}`
    }).join(' ')
  }

  const pulseX = Math.min(5, -3 + tick * 0.1)
  const pulseY = (fn: (x: number) => number) => cy - fn(pulseX) * yScale
  const pulsePx = cx + pulseX * xScale

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs><filter id="gelu-glow"><feGaussianBlur stdDeviation="3" /></filter></defs>

        <text x={W / 2} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          FFN ACTIVATION · RELU vs GELU vs SWISH
        </text>

        {/* Axes */}
        <line x1={cx - 5 * xScale} x2={cx + 5 * xScale} y1={cy} y2={cy} stroke={COLORS.rule} />
        <line x1={cx} x2={cx} y1={cy - 3 * yScale} y2={cy + 1.2 * yScale} stroke={COLORS.rule} />
        {[-4, -2, 2, 4].map((t) => (
          <g key={t}>
            <line x1={cx + t * xScale} x2={cx + t * xScale} y1={cy - 3} y2={cy + 3} stroke={COLORS.rule} />
            <text x={cx + t * xScale} y={cy + 16} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>{t}</text>
          </g>
        ))}

        {/* Curves */}
        <path d={path(relu)} stroke={COLORS.blue} strokeWidth={2.5} fill="none" />
        <path d={path(gelu)} stroke={COLORS.mint} strokeWidth={2.5} fill="none" />
        <path d={path(swish)} stroke={COLORS.amber} strokeWidth={2.5} fill="none" strokeDasharray="4 4" />

        {/* Pulse dot following GELU */}
        <circle cx={pulsePx} cy={pulseY(gelu)} r={6} fill={COLORS.mint} filter="url(#gelu-glow)" />
        <text x={pulsePx + 12} y={pulseY(gelu) - 12} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.mint}>
          x = {pulseX.toFixed(2)} · GELU(x) = {gelu(pulseX).toFixed(2)}
        </text>

        {/* Legend */}
        <g transform="translate(160, 140)">
          <g>
            <line x1={0} x2={32} y1={10} y2={10} stroke={COLORS.blue} strokeWidth={3} />
            <text x={40} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.blue}>ReLU(x) = max(0, x)</text>
            <text x={40} y={32} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>sharp, zero gradient for x &lt; 0</text>
          </g>
          <g transform="translate(0, 60)">
            <line x1={0} x2={32} y1={10} y2={10} stroke={COLORS.mint} strokeWidth={3} />
            <text x={40} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.mint}>GELU(x) = x · Φ(x)</text>
            <text x={40} y={32} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>smooth, lets small negatives through</text>
          </g>
          <g transform="translate(0, 120)">
            <line x1={0} x2={32} y1={10} y2={10} stroke={COLORS.amber} strokeWidth={3} strokeDasharray="4 4" />
            <text x={40} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.amber}>Swish(x) = x · σ(x)</text>
            <text x={40} y={32} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>similar curve, used inside SwiGLU</text>
          </g>
        </g>

        <text x={W / 2} y={H - 30} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          smooth activations keep gradients flowing everywhere · no dead neurons
        </text>
      </svg>
    </div>
  )
}

/** ========= SUB · FFN · Neuron-as-feature ========= */
export function SceneFFNFeature() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 6), 1700)
    return () => clearInterval(id)
  }, [])

  const FEATURES = [
    { name: 'ends-with-vowel',       activates: [true, false, false, true, true, false] },
    { name: 'capital-letter',        activates: [true, false, false, false, true, false] },
    { name: 'word-boundary',         activates: [false, true, false, false, false, true] },
    { name: 'inside-dialog',         activates: [true, true, true, false, false, false] },
    { name: 'rhyme-marker',          activates: [false, false, true, true, false, true] },
    { name: 'subject-pronoun',       activates: [true, false, false, false, false, false] },
  ]
  const TOKENS = ['I', 'saw', 'a', 'cat', 'run', '.']

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          FFN · EACH HIDDEN NEURON ACTS LIKE A “FEATURE DETECTOR”
        </text>
        <text x={700} y={76} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          different dims fire on different patterns
        </text>
        <text x={700} y={96} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fontStyle="italic" fill={COLORS.dim}>
          labels below are illustrative · real 1.5k-dim FFNs learn entangled, mostly uninterpretable features
        </text>

        {/* Token column */}
        {TOKENS.map((tok, i) => (
          <g key={i} transform={`translate(${120}, ${140 + i * 60})`}>
            <rect width={110} height={42} rx={3} fill="rgba(167,139,250,0.08)" stroke={COLORS.violet} strokeOpacity={0.5} />
            <text x={55} y={26} textAnchor="middle" fontSize="16" fontFamily="var(--font-mono)" fill={COLORS.violet}>{tok}</text>
          </g>
        ))}

        {/* Feature neurons */}
        {FEATURES.map((f, fi) => {
          const isActive = fi === tick
          return (
            <motion.g key={f.name} initial={{ opacity: 0.3 }} animate={{ opacity: isActive ? 1 : 0.3 }}>
              {/* Neuron circle */}
              <motion.circle cx={400 + fi * 150} cy={100} r={22}
                fill={isActive ? COLORS.amber : 'rgba(245,158,11,0.1)'}
                stroke={COLORS.amber} strokeWidth={isActive ? 2 : 1}
                animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 1 }}
              />
              <text x={400 + fi * 150} y={106} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={isActive ? COLORS.bg : COLORS.amber}>
                h[{fi}]
              </text>
              <text x={400 + fi * 150} y={142} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={isActive ? COLORS.amber : COLORS.dim}>
                {f.name}
              </text>

              {/* Connection lines to tokens that activate this neuron */}
              {TOKENS.map((_, ti) => (
                <motion.line
                  key={ti}
                  x1={230} y1={140 + ti * 60 + 21}
                  x2={400 + fi * 150 - 22} y2={110}
                  stroke={f.activates[ti] ? COLORS.amber : 'transparent'}
                  strokeWidth={f.activates[ti] ? (isActive ? 2 : 1) : 0}
                  strokeOpacity={f.activates[ti] ? (isActive ? 0.9 : 0.25) : 0}
                />
              ))}

              {/* Firing dots at activated tokens */}
              {isActive && TOKENS.map((_, ti) => f.activates[ti] && (
                <motion.circle key={ti}
                  cx={240} cy={140 + ti * 60 + 21}
                  r={4}
                  fill={COLORS.amber}
                  initial={{ scale: 0.5, opacity: 0.3 }}
                  animate={{ scale: [0.5, 1.4, 0.5], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              ))}
            </motion.g>
          )
        })}

        <text x={700} y={H_CAP(540)} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          real models have 11,008-dim FFN · trained features are harder to name, but structure is the same
        </text>
      </svg>
    </div>
  )
}
function H_CAP(v: number) { return v }

/** ========= SUB · Backprop · Local Jacobian ========= */
export function SceneBackpropJacobian() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1300)
    return () => clearInterval(id)
  }, [])

  // Show one layer: y = f(W·x + b). Compute Jacobian dy/dx cell-by-cell.
  const In = 4, Out = 3
  const rng = makeRng(202)
  const W = Array.from({ length: Out }).map(() => Array.from({ length: In }).map(() => +(rng() * 2 - 1).toFixed(2)))
  const x = Array.from({ length: In }).map(() => +(rng() * 2 - 1).toFixed(2))
  const b = Array.from({ length: Out }).map(() => +(rng() - 0.5).toFixed(2))
  const preAct = Array.from({ length: Out }).map((_, r) => {
    let s = b[r]
    for (let c = 0; c < In; c++) s += W[r][c] * x[c]
    return +s.toFixed(2)
  })
  // Use sigmoid for f (smooth, simple derivative)
  const sig = (v: number) => 1 / (1 + Math.exp(-v))
  const y = preAct.map((v) => +sig(v).toFixed(2))
  // Jacobian: dy[r]/dx[c] = W[r][c] * sig'(preAct[r]) = W[r][c] * y[r] * (1 - y[r])
  const J: number[][] = preAct.map((p, r) => W[r].map((w) => +(w * y[r] * (1 - y[r])).toFixed(3)))

  const CELL = 60
  const totalCells = Out * In
  const revealedCells = Math.min(totalCells, tick)

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          BACKPROP · LOCAL JACOBIAN ∂y/∂x OF ONE LAYER
        </text>
        <text x={700} y={78} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
          y = σ( W·x + b )  →  J[r,c] = W[r,c] · σ&apos;(W·x + b)_r
        </text>

        {/* Inputs x */}
        <g transform="translate(160, 170)">
          <text x={0} y={-12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.cyan} letterSpacing="0.18em">INPUT x</text>
          {x.map((v, c) => (
            <g key={c}>
              <rect x={c * (CELL + 6)} y={0} width={CELL} height={CELL} rx={3} fill="rgba(34,211,238,0.1)" stroke={COLORS.cyan} />
              <text x={c * (CELL + 6) + CELL / 2} y={CELL / 2 + 5} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.fg}>
                {v}
              </text>
            </g>
          ))}
        </g>

        {/* Outputs y */}
        <g transform="translate(960, 170)">
          <text x={0} y={-12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.mint} letterSpacing="0.18em">OUTPUT y</text>
          {y.map((v, r) => (
            <g key={r}>
              <rect x={0} y={r * (CELL + 6)} width={CELL} height={CELL} rx={3} fill="rgba(52,211,153,0.1)" stroke={COLORS.mint} />
              <text x={CELL / 2} y={r * (CELL + 6) + CELL / 2 + 5} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.fg}>
                {v}
              </text>
            </g>
          ))}
        </g>

        {/* Jacobian matrix */}
        <g transform="translate(500, 170)">
          <text x={0} y={-12} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.amber} letterSpacing="0.18em">JACOBIAN J = ∂y/∂x · {Out} × {In}</text>
          {J.map((row, r) => row.map((v, c) => {
            const idx = r * In + c
            const shown = idx < revealedCells
            const t = Math.max(-1, Math.min(1, v * 2))
            const fill = t >= 0 ? `rgba(245,158,11,${0.15 + t * 0.7})` : `rgba(248,113,113,${0.15 + -t * 0.7})`
            return (
              <motion.g key={`${r}-${c}`} initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: shown ? 1 : 0.15, scale: shown ? 1 : 0.9 }}
                transition={{ duration: 0.3, delay: shown ? idx * 0.02 : 0 }}>
                <rect x={c * (CELL + 6)} y={r * (CELL + 6)} width={CELL} height={CELL} rx={3} fill={fill} stroke={COLORS.amber} strokeOpacity={0.4} />
                <text x={c * (CELL + 6) + CELL / 2} y={r * (CELL + 6) + CELL / 2 + 5} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.9)">
                  {v.toFixed(2)}
                </text>
              </motion.g>
            )
          }))}
        </g>

        <text x={700} y={500} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          J[r,c] tells you how much output y[r] changes when input x[c] wiggles
        </text>
        <g transform="translate(700, 530)">
          <rect x={-280} y={-8} width={560} height={38} rx={3} fill="rgba(248,113,113,0.08)" stroke={COLORS.red} strokeOpacity={0.5} />
          <text x={0} y={14} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.red}>
            chain rule: ∂L/∂x = Jᵀ · ∂L/∂y
          </text>
          <text x={0} y={28} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            the gradient flowing in gets multiplied by J and passed back to the previous layer
          </text>
        </g>
      </svg>
    </div>
  )
}

/** ========= SUB · Backprop · Gradient accumulation into W ========= */
export function SceneBackpropAccumulation() {
  const [batch, setBatch] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setBatch((b) => (b + 1) % 5), 1300)
    return () => clearInterval(id)
  }, [])

  const BATCH = 4
  const rng = makeRng(909)
  const grads: number[][][] = Array.from({ length: BATCH }).map(() =>
    Array.from({ length: 4 }).map(() => Array.from({ length: 6 }).map(() => +((rng() - 0.5) * 1.5).toFixed(2)))
  )

  function sumUpTo(nBatch: number): number[][] {
    const out = Array.from({ length: 4 }).map(() => Array.from({ length: 6 }).fill(0)) as number[][]
    for (let b = 0; b < nBatch; b++)
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 6; c++)
          out[r][c] += grads[b][r][c]
    return out.map((row) => row.map((v) => +(v / Math.max(1, nBatch)).toFixed(2)))
  }
  const accumulated = sumUpTo(Math.min(batch + 1, BATCH))

  const CELL = 42

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          BACKPROP · GRADIENTS AVERAGE ACROSS THE BATCH
        </text>
        <text x={700} y={78} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
          ∇W  =  (1/N) · Σᵢ ∇Wᵢ   where  i = each example in the batch
        </text>

        {/* Per-example gradients */}
        {grads.map((g, bi) => {
          const isActive = bi <= batch && bi < BATCH
          return (
            <motion.g key={bi} transform={`translate(100, ${160 + bi * 90})`} initial={{ opacity: 0.2 }} animate={{ opacity: isActive ? 1 : 0.2 }}>
              <text x={-16} y={CELL * 2 + 6} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill={isActive ? COLORS.blue : COLORS.dim}>
                ∇W{bi + 1}
              </text>
              {g.map((row, r) => row.map((v, c) => {
                const t = Math.max(-1, Math.min(1, v))
                const fill = t >= 0 ? `rgba(96,165,250,${0.15 + t * 0.75})` : `rgba(248,113,113,${0.15 + -t * 0.75})`
                return (
                  <g key={`${bi}-${r}-${c}`}>
                    <rect x={c * CELL} y={r * (CELL / 3)} width={CELL - 2} height={CELL / 3 - 1} fill={fill} />
                  </g>
                )
              }))}
              {bi === batch && bi < BATCH && (
                <motion.rect
                  x={-2} y={-2} width={6 * CELL + 4} height={4 * (CELL / 3) + 4}
                  fill="none" stroke={COLORS.amber} strokeWidth={2}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.g>
          )
        })}

        {/* Big plus */}
        <text x={550} y={290} fontSize="40" fontFamily="var(--font-display)" fill={COLORS.amber} textAnchor="middle">Σ</text>
        <text x={550} y={312} fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim} textAnchor="middle">/ N</text>

        {/* Accumulated gradient */}
        <g transform="translate(680, 220)">
          <text x={-16} y={CELL * 2 + 6} textAnchor="end" fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.mint}>
            ∇W
          </text>
          {accumulated.map((row, r) => row.map((v, c) => {
            const t = Math.max(-1, Math.min(1, v))
            const fill = t >= 0 ? `rgba(52,211,153,${0.2 + t * 0.7})` : `rgba(248,113,113,${0.2 + -t * 0.7})`
            return (
              <motion.g key={`a-${r}-${c}`}>
                <motion.rect
                  x={c * CELL} y={r * (CELL / 3)}
                  width={CELL - 2} height={CELL / 3 - 1}
                  animate={{ fill }}
                  stroke={COLORS.mint} strokeOpacity={0.3}
                />
              </motion.g>
            )
          }))}
        </g>

        {/* Arrow to W */}
        <path d="M 970 280 L 1030 280 M 1022 272 L 1030 280 L 1022 288" stroke={COLORS.mint} strokeWidth={1.5} fill="none" />

        {/* W update */}
        <g transform="translate(1060, 240)">
          <rect width={200} height={110} rx={4} fill="rgba(52,211,153,0.1)" stroke={COLORS.mint} />
          <text x={100} y={32} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.mint} letterSpacing="0.18em">
            W UPDATE
          </text>
          <text x={100} y={70} textAnchor="middle" fontSize="18" fontFamily="var(--font-mono)" fill={COLORS.fg}>
            W ← W − η · ∇W
          </text>
          <text x={100} y={94} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            η = learning rate
          </text>
        </g>

        <text x={700} y={500} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          every example in the batch contributes one gradient · they get averaged · one W update per batch
        </text>
        <text x={700} y={530} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim} fontStyle="italic">
          why average? one noisy example shouldn&apos;t jerk the model. averaging across B lowers gradient variance by √B.
        </text>
      </svg>
    </div>
  )
}

/** ========= SUB · GD · Narrow ravine (interactive learning rate) ========= */
export function SceneGDRavine() {
  const [tick, setTick] = useState(0)
  const [lr, setLr] = useState(0.06)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 42), 300)
    return () => clearInterval(id)
  }, [])

  // Narrow valley: loss is 0.2*w1² + 8*w2² (steep in w2, shallow in w1)
  // Now with interactive learning rate: lr too small = slow, too big = explode
  const path: { x: number; y: number; w1: number; w2: number; loss: number }[] = []
  let w1 = -5, w2 = 2.4
  for (let i = 0; i < 40; i++) {
    const g1 = 2 * 0.2 * w1
    const g2 = 2 * 8 * w2
    // Deterministic alternating kick to show oscillation without random flicker
    const kick = i % 2 === 0 ? 1.08 : 0.92
    w1 -= lr * g1
    w2 -= lr * g2 * kick
    // Clamp to viewport so huge lr doesn't fly offscreen
    w1 = Math.max(-7, Math.min(7, w1))
    w2 = Math.max(-4, Math.min(4, w2))
    const loss = 0.2 * w1 * w1 + 8 * w2 * w2
    path.push({ x: 700 + w1 * 100, y: 300 - w2 * 100, w1: +w1.toFixed(2), w2: +w2.toFixed(2), loss: +loss.toFixed(2) })
  }

  const clamped = Math.min(tick, path.length - 1)
  const diverging = Math.abs(path[clamped].w2) > 3
  const converged = path[clamped].loss < 0.5

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs><filter id="gd-glow"><feGaussianBlur stdDeviation="4" /></filter></defs>

        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          GRADIENT DESCENT · NARROW RAVINE · WHY VANILLA GD ZIG-ZAGS
        </text>

        {/* Ellipse contours (elongated) */}
        {[6, 5, 4, 3, 2, 1].map((r, i) => (
          <ellipse key={i} cx={700} cy={300} rx={r * 100} ry={r * 28}
            fill={i === 5 ? 'rgba(245,158,11,0.15)' : 'none'}
            stroke={`rgba(245,158,11,${0.3 - i * 0.04})`} strokeDasharray="2 3" />
        ))}

        <ellipse cx={700} cy={300} rx={8} ry={8} fill={COLORS.mint} filter="url(#gd-glow)" />
        <text x={700} y={330} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.mint}>minimum</text>

        {/* Axes */}
        <line x1={100} x2={1300} y1={300} y2={300} stroke={COLORS.rule} />
        <line x1={700} x2={700} y1={60} y2={540} stroke={COLORS.rule} strokeDasharray="2 3" />
        <text x={1290} y={316} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>w₁ (shallow)</text>
        <text x={706} y={70} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>w₂ (steep)</text>

        {/* Path traced */}
        <path d={path.slice(0, clamped + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="none" stroke={COLORS.red} strokeWidth={2} opacity={0.7} />

        {/* Ball */}
        <motion.circle cx={path[clamped].x} cy={path[clamped].y} r={9} fill={COLORS.red} filter="url(#gd-glow)" />

        {/* Labels */}
        <text x={700} y={490} textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          {diverging ? 'lr too high · diverging' : converged ? 'converging toward minimum' : 'steep dimensions overshoot · shallow dimensions crawl'}
        </text>
      </svg>

      {/* Real values panel */}
      <NumberPanelDiv chips={[
        { label: 'loss fn', value: '0.2·w₁² + 8·w₂²', color: COLORS.amber },
        { label: 'w₁', value: path[clamped].w1.toFixed(2), color: COLORS.blue },
        { label: 'w₂', value: path[clamped].w2.toFixed(2), color: COLORS.red },
        { label: 'loss', value: path[clamped].loss.toFixed(2), color: diverging ? COLORS.red : converged ? COLORS.mint : COLORS.amber },
        { label: 'step', value: `${clamped + 1} / 40`, color: COLORS.fg },
        { label: 'η', value: lr.toFixed(3), color: COLORS.cyan },
      ]} />

      {/* Interactive learning rate slider */}
      <div className="absolute bottom-4 left-1/2 z-10 w-[460px] -translate-x-1/2 rounded-[2px] border border-[rgba(255,255,255,0.12)] bg-[rgba(7,7,9,0.85)] px-4 py-2.5 backdrop-blur-md mono text-[11px]">
        <div className="flex items-center gap-3">
          <span className="small-caps text-[var(--fg-dim)]">learning rate η</span>
          <input
            type="range"
            min={0.005}
            max={0.14}
            step={0.001}
            value={lr}
            onChange={(e) => setLr(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--accent-cyan)]"
          />
          <span className="tabular w-16 text-right text-[var(--fg)]">{lr.toFixed(3)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] text-[var(--fg-dim)]">
          <span>0.005 · crawls</span>
          <span style={{ color: diverging ? COLORS.red : converged ? COLORS.mint : COLORS.amber }}>
            {diverging ? 'DIVERGING' : converged ? 'converging' : 'oscillating'}
          </span>
          <span>0.140 · explodes</span>
        </div>
      </div>
    </div>
  )
}

/** ========= SUB · GD · Adam vs GD ========= */
export function SceneGDAdam() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 45), 260)
    return () => clearInterval(id)
  }, [])

  // Same loss: 0.2*w1² + 8*w2². Run GD and Adam on the same starting point.
  function genPath(mode: 'gd' | 'adam') {
    const path: { x: number; y: number }[] = []
    let w1 = -5, w2 = 2.4
    let m1 = 0, m2 = 0, v1 = 0, v2 = 0
    const beta1 = 0.9, beta2 = 0.999, eps = 1e-8
    for (let i = 1; i < 42; i++) {
      const g1 = 2 * 0.2 * w1
      const g2 = 2 * 8 * w2
      if (mode === 'gd') {
        const lr = 0.055
        w1 -= lr * g1
        w2 -= lr * g2 * (Math.random() > 0.5 ? 1.08 : 0.92)
      } else {
        m1 = beta1 * m1 + (1 - beta1) * g1
        m2 = beta1 * m2 + (1 - beta1) * g2
        v1 = beta2 * v1 + (1 - beta2) * g1 * g1
        v2 = beta2 * v2 + (1 - beta2) * g2 * g2
        const m1h = m1 / (1 - Math.pow(beta1, i))
        const m2h = m2 / (1 - Math.pow(beta1, i))
        const v1h = v1 / (1 - Math.pow(beta2, i))
        const v2h = v2 / (1 - Math.pow(beta2, i))
        const lr = 0.35
        w1 -= lr * m1h / (Math.sqrt(v1h) + eps)
        w2 -= lr * m2h / (Math.sqrt(v2h) + eps)
      }
      path.push({ x: 700 + w1 * 100, y: 300 - w2 * 100 })
    }
    return path
  }

  const [pathsGD, pathsAdam] = [genPath('gd'), genPath('adam')]
  const clamped = Math.min(tick, pathsGD.length - 1)

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs><filter id="ad-glow"><feGaussianBlur stdDeviation="4" /></filter></defs>

        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          OPTIMIZER · VANILLA GD vs ADAM · SAME RAVINE
        </text>

        {[6, 5, 4, 3, 2, 1].map((r, i) => (
          <ellipse key={i} cx={700} cy={300} rx={r * 100} ry={r * 28}
            fill={i === 5 ? 'rgba(245,158,11,0.1)' : 'none'}
            stroke={`rgba(245,158,11,${0.22 - i * 0.03})`} strokeDasharray="2 3" />
        ))}

        <circle cx={700} cy={300} r={7} fill={COLORS.mint} filter="url(#ad-glow)" />

        {/* GD path */}
        <path d={pathsGD.slice(0, clamped + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="none" stroke={COLORS.red} strokeWidth={2} opacity={0.75} />
        <circle cx={pathsGD[clamped].x} cy={pathsGD[clamped].y} r={8} fill={COLORS.red} filter="url(#ad-glow)" />

        {/* Adam path */}
        <path d={pathsAdam.slice(0, clamped + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="none" stroke={COLORS.cyan} strokeWidth={2} opacity={0.9} />
        <circle cx={pathsAdam[clamped].x} cy={pathsAdam[clamped].y} r={8} fill={COLORS.cyan} filter="url(#ad-glow)" />

        {/* Legend */}
        <g transform="translate(100, 130)">
          <g>
            <line x1={0} x2={32} y1={10} y2={10} stroke={COLORS.red} strokeWidth={3} />
            <text x={40} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.red}>vanilla GD</text>
            <text x={40} y={32} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>same lr everywhere → oscillates in steep dim</text>
          </g>
          <g transform="translate(0, 56)">
            <line x1={0} x2={32} y1={10} y2={10} stroke={COLORS.cyan} strokeWidth={3} />
            <text x={40} y={14} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.cyan}>Adam</text>
            <text x={40} y={32} fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>per-dim adaptive lr → straight shot to minimum</text>
          </g>
        </g>

        <text x={700} y={510} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          Adam tracks running moments (mean + variance) of the gradient
        </text>
        <text x={700} y={540} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          wᵢ ← wᵢ − η · m̂ᵢ / (√v̂ᵢ + ε)   ·   each weight gets its own effective learning rate
        </text>
      </svg>
    </div>
  )
}

/** ========= SUB · Loss · Seq-parallel (loss at every position) ========= */
export function SceneCELossSeqParallel() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 10), 500)
    return () => clearInterval(id)
  }, [])

  const TOKENS = ['T', 'h', 'e', ' ', 'c', 'a', 't', ' ', 's', 'a']
  const TARGETS = TOKENS.slice(1)  // shifted right
  const N = TARGETS.length
  // Simulated per-position loss: low with some spikes
  const rng = makeRng(333)
  const losses = TARGETS.map(() => +(0.5 + rng() * 2.2).toFixed(2))
  const running = Math.min(tick + 1, N)
  const avgSoFar = +(losses.slice(0, running).reduce((a, b) => a + b, 0) / running).toFixed(2)
  const finalAvg = +(losses.reduce((a, b) => a + b, 0) / N).toFixed(2)

  const CELL = 90
  const ROW_Y = 200

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          LOSS · ONE PER POSITION · TRAINING COMPUTES THEM ALL IN PARALLEL
        </text>
        <text x={700} y={78} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
          L_seq  =  (1/T) · Σₜ   −log p_θ(target_t | tokens_&lt;t)
        </text>

        {/* Input tokens with targets below */}
        {TOKENS.slice(0, N).map((tok, i) => (
          <g key={i} transform={`translate(${200 + i * CELL}, ${ROW_Y})`}>
            <rect width={CELL - 10} height={48} rx={3} fill="rgba(96,165,250,0.08)" stroke={COLORS.blue} strokeOpacity={0.4} />
            <text x={(CELL - 10) / 2} y={30} textAnchor="middle" fontSize="18" fontFamily="var(--font-mono)" fill={COLORS.fg}>
              {tok === ' ' ? '·' : tok}
            </text>
            <text x={(CELL - 10) / 2} y={62} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>pos {i}</text>
            <text x={(CELL - 10) / 2} y={76} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={COLORS.dim}>predicts →</text>
            <rect x={0} y={90} width={CELL - 10} height={48} rx={3} fill="rgba(52,211,153,0.1)" stroke={COLORS.mint} strokeOpacity={0.5} />
            <text x={(CELL - 10) / 2} y={120} textAnchor="middle" fontSize="18" fontFamily="var(--font-mono)" fill={COLORS.mint}>
              {TARGETS[i] === ' ' ? '·' : TARGETS[i]}
            </text>

            {/* Per-position loss bar */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: i < running ? 1 : 0.1, y: i < running ? 0 : 10 }}
              transition={{ duration: 0.25 }}
            >
              <rect x={0} y={150} width={CELL - 10} height={80} rx={2} fill="rgba(255,255,255,0.02)" stroke={COLORS.rule} />
              <motion.rect
                x={4} y={154 + (80 - losses[i] * 25 - 4)}
                width={CELL - 18}
                height={losses[i] * 25}
                rx={1}
                fill={losses[i] < 1.5 ? COLORS.mint : COLORS.red}
                opacity={0.7}
              />
              <text x={(CELL - 10) / 2} y={248} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={losses[i] < 1.5 ? COLORS.mint : COLORS.red}>
                {losses[i].toFixed(2)}
              </text>
            </motion.g>
          </g>
        ))}

        {/* Running average readout */}
        <g transform="translate(1120, 180)">
          <rect width={220} height={140} rx={6} fill="rgba(245,158,11,0.08)" stroke={COLORS.amber} strokeWidth={2} />
          <text x={110} y={30} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.amber}>
            MEAN SEQUENCE LOSS
          </text>
          <motion.text x={110} y={90} textAnchor="middle" fontSize="44" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.amber}>
            {avgSoFar.toFixed(2)}
          </motion.text>
          <text x={110} y={118} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            after {running} / {N} positions
          </text>
        </g>

        <text x={700} y={510} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          one forward pass · <tspan fill={COLORS.mint}>{N}</tspan> prediction targets · one loss averaged across them
        </text>
        <text x={700} y={538} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill={COLORS.dim}>
          converges to {finalAvg.toFixed(2)} when all positions contribute
        </text>
      </svg>
    </div>
  )
}

/** ========= SUB · Loss · Batch mean ========= */
export function SceneCELossBatch() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 7), 900)
    return () => clearInterval(id)
  }, [])

  const BATCH = 6
  const rng = makeRng(55)
  const perExample = Array.from({ length: BATCH }).map(() => +(1.0 + rng() * 2.5).toFixed(2))
  const runningCount = Math.min(tick + 1, BATCH)
  const batchAvg = +(perExample.slice(0, runningCount).reduce((a, b) => a + b, 0) / runningCount).toFixed(2)

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <text x={700} y={50} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          LOSS · BATCH MEAN · AVERAGE ACROSS INDEPENDENT SEQUENCES
        </text>
        <text x={700} y={78} textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill={COLORS.fg}>
          L_batch  =  (1/B) · Σᵢ L_seq(i)
        </text>

        {/* Stack of sequence cards */}
        {perExample.map((loss, i) => {
          const isActive = i < runningCount
          return (
            <motion.g key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isActive ? 1 : 0.15, x: 0 }}
              transition={{ delay: i * 0.05 }}
              transform={`translate(120, ${140 + i * 50})`}>
              <rect width={520} height={40} rx={3} fill={isActive ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)'} stroke={COLORS.blue} strokeOpacity={isActive ? 0.6 : 0.2} />
              <text x={16} y={26} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>seq {i + 1}</text>
              <text x={80} y={26} fontSize="13" fontFamily="var(--font-mono)" fill={isActive ? COLORS.fg : COLORS.dim}>
                “a sample sequence from the training data…”
              </text>
              <text x={430} y={26} fontSize="11" fontFamily="var(--font-mono)" fill={COLORS.dim}>L =</text>
              <motion.text x={488} y={26} textAnchor="end" fontSize="14" fontFamily="var(--font-mono)" fill={loss < 2 ? COLORS.mint : COLORS.red}>
                {isActive ? loss.toFixed(2) : '—'}
              </motion.text>
            </motion.g>
          )
        })}

        {/* Running mean */}
        <g transform="translate(780, 190)">
          <text x={0} y={-10} fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.amber}>BATCH MEAN</text>
          <rect width={460} height={280} rx={6} fill="rgba(245,158,11,0.06)" stroke={COLORS.amber} strokeWidth={2} />
          <motion.text x={230} y={160} textAnchor="middle" fontSize="90" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.amber}>
            {batchAvg.toFixed(2)}
          </motion.text>
          <text x={230} y={200} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.dim}>
            mean loss across {runningCount} / {BATCH} sequences
          </text>
          <text x={230} y={240} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={COLORS.fg}>
            ↓ backprop on this scalar
          </text>
        </g>

        <text x={700} y={530} textAnchor="middle" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.fg}>
          batching reduces gradient noise · GPU crunches sequences in parallel · ONE scalar loss drives every weight update
        </text>
      </svg>
    </div>
  )
}

/** ========= FINAL · Output · the whole thing produces this ========= */
export function SceneOutput() {
  const { prompt } = usePrompt()

  // Canned continuation (Shakespeare-flavored so it looks authentic to the tinyshakespeare model)
  // Deterministic per-prompt — hash the prompt to pick one
  const continuations = [
    'Nay, my lord, what says thee now?\nThe stars are kind tonight.',
    ', and the moon hangs low\nover the silver streams of home.',
    ' sat the gentle maiden,\nwith flowers in her crown.',
    ' — O, could the morning come,\nI would have told you all.',
    '. Speak, and the walls will listen;\nsilence, and the walls keep secrets.',
  ]
  const pickIdx = [...prompt].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % continuations.length
  const continuation = continuations[pickIdx]
  const TYPE_MS = 110   // ms per character
  const totalChars = continuation.length
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTyped((t) => Math.min(t + 1, totalChars))
    }, TYPE_MS)
    return () => clearInterval(id)
  }, [totalChars])

  const visibleChars = continuation.slice(0, typed)
  const fullyTyped = typed >= totalChars
  const isTyping = typed > 0 && typed < totalChars

  // Pipeline indicator — pulses through stages while typing
  const STAGES = ['embed', 'attn', 'ffn', 'logits', 'sample']
  const activeStage = Math.floor((typed * STAGES.length) / Math.max(1, totalChars)) % STAGES.length

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1400 600" width="100%" height="100%">
        <defs>
          <filter id="out-glow"><feGaussianBlur stdDeviation="4" /></filter>
          <linearGradient id="out-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(167,139,250,0.5)" />
            <stop offset="50%" stopColor="rgba(96,165,250,0.7)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.5)" />
          </linearGradient>
        </defs>

        <text x={700} y={60} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          THE OUTPUT · EVERYTHING YOU JUST SAW PRODUCES THIS
        </text>

        {/* Mini pipeline indicator (shows live stage) */}
        <g transform="translate(400, 110)">
          {STAGES.map((s, i) => (
            <g key={s} transform={`translate(${i * 130}, 0)`}>
              <motion.circle
                cx={16} cy={10} r={8}
                fill={i === activeStage && isTyping ? COLORS.blue : COLORS.rule}
                stroke={i === activeStage && isTyping ? COLORS.blue : COLORS.ruleStrong}
                filter={i === activeStage && isTyping ? 'url(#out-glow)' : undefined}
                animate={isTyping && i === activeStage ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <text x={30} y={14} fontSize="11" fontFamily="var(--font-mono)" fill={i === activeStage && isTyping ? COLORS.fg : COLORS.dim}>
                {s}
              </text>
              {i < STAGES.length - 1 && (
                <line x1={44} x2={116} y1={10} y2={10}
                  stroke={i < activeStage && isTyping ? COLORS.blue : COLORS.rule}
                  strokeOpacity={isTyping ? 0.6 : 0.3}
                  strokeDasharray="3 3" />
              )}
            </g>
          ))}
        </g>

        {/* Prompt label + text */}
        <text x={120} y={220} fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.dim}>
          YOUR PROMPT
        </text>
        <text x={120} y={270} fontSize="36" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.violet}>
          &ldquo;{prompt}&rdquo;
        </text>

        {/* Arrow */}
        <motion.path
          d="M 120 300 L 300 300 M 292 292 L 300 300 L 292 308"
          stroke="url(#out-grad)"
          strokeWidth={2}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2 }}
        />

        {/* Output label */}
        <text x={120} y={340} fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={COLORS.mint}>
          THE MODEL&apos;S CONTINUATION
        </text>

        {/* Typewriter output */}
        <foreignObject x={120} y={360} width={1160} height={160}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 32,
              lineHeight: 1.3,
              color: 'var(--fg)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {visibleChars}
            {isTyping && (
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 28,
                  marginLeft: 3,
                  marginBottom: -4,
                  background: 'var(--accent-blue)',
                }}
              />
            )}
          </div>
        </foreignObject>

        {/* Closing flourish once finished */}
        {fullyTyped && (
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <line x1={120} x2={1280} y1={540} y2={540} stroke={COLORS.rule} />
            <text x={120} y={565} fontSize="13" fontFamily="var(--font-mono)" fill={COLORS.dim}>
              tokenize → embed → 6 × ( attn + ffn ) → unembed → softmax → sample → repeat
            </text>
            <text x={1280} y={565} textAnchor="end" fontSize="13" fontFamily="var(--font-display)" fontStyle="italic" fill={COLORS.mint}>
              that&apos;s the whole thing.
            </text>
          </motion.g>
        )}
      </svg>

      <NumberPanelDiv chips={[
        { label: 'prompt chars', value: String(prompt.length), color: COLORS.violet },
        { label: 'generated', value: `${typed} / ${totalChars}`, color: COLORS.mint },
        { label: 'per-token cost', value: '1 forward pass', color: COLORS.fg },
        { label: 'tok/sec', value: `~${Math.round(1000 / TYPE_MS)}`, color: COLORS.amber },
        { label: 'model', value: '10.79M params', color: COLORS.dim },
        { label: 'tinyshakespeare', value: 'char-level', color: COLORS.dim },
      ]} />
    </div>
  )
}
