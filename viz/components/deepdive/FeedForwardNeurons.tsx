'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, makeRng } from '../scenes/primitives'

/**
 * Feed-forward network, visible.
 *
 * Shows two-layer MLP as explicit neurons and weight lines.
 *   left layer  — 8 neurons (input residual, compressed from 384)
 *   middle layer — 24 neurons (the "expanded" 4× hidden, 1536 in the real model)
 *   right layer — 8 neurons (back to residual width)
 *
 * When you hit Play, a signal pulses through: each neuron's activation
 * appears, ReLU zeroes the negatives, signal flows through the compress
 * matrix, output neurons fill in.
 */

const IN_N = 8
const HID_N = 24
const OUT_N = 8

const rng = makeRng(55)
const W1: number[][] = Array.from({ length: IN_N }).map(() =>
  Array.from({ length: HID_N }).map(() => rng() * 2 - 1)
)
const W2: number[][] = Array.from({ length: HID_N }).map(() =>
  Array.from({ length: OUT_N }).map(() => rng() * 2 - 1)
)

// A canonical input vector
const INPUT = Array.from({ length: IN_N }).map(() => rng() * 2 - 1)

function forward(x: number[]) {
  // linear 1
  const pre = Array.from({ length: HID_N }).map((_, j) => {
    let s = 0
    for (let i = 0; i < IN_N; i++) s += x[i] * W1[i][j]
    return s
  })
  const post = pre.map((v) => Math.max(0, v))
  // linear 2
  const out = Array.from({ length: OUT_N }).map((_, j) => {
    let s = 0
    for (let i = 0; i < HID_N; i++) s += post[i] * W2[i][j]
    return s
  })
  return { pre, post, out }
}

const { pre: PRE, post: POST, out: OUT } = forward(INPUT)

const PHASES = [
  { id: 'input', label: 'input · residual stream', color: COLORS.cyan },
  { id: 'expand', label: 'linear  ×W₁  · expand 4× wider', color: COLORS.amber },
  { id: 'relu', label: 'ReLU · zero the negatives', color: COLORS.red },
  { id: 'compress', label: 'linear  ×W₂  · compress back', color: COLORS.amber },
  { id: 'output', label: 'output · added into residual', color: COLORS.cyan },
] as const
type Phase = (typeof PHASES)[number]['id']

export function FeedForwardNeurons() {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const phase: Phase = PHASES[phaseIdx].id
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setPhaseIdx((p) => (p + 1) % PHASES.length), 2400)
    return () => clearInterval(id)
  }, [paused])

  const W = 780
  const H = 460
  const PAD_X = 80
  const PAD_Y = 60

  const colX = {
    input: PAD_X,
    hidden: W / 2,
    output: W - PAD_X,
  }

  const yFor = (count: number, i: number) => {
    const span = H - PAD_Y * 2
    return PAD_Y + (i + 0.5) * (span / count)
  }

  // phase-driven visibility
  const showInput = true
  const showExpandLines = phaseIdx >= 1
  const showHiddenPre = phaseIdx >= 1
  const showRelu = phaseIdx >= 2
  const showCompressLines = phaseIdx >= 3
  const showOutput = phaseIdx >= 4

  // color by value
  const valColor = (v: number, alphaFloor = 0.1, alphaMul = 0.8) => {
    const t = Math.max(-1, Math.min(1, v / 2))
    return t >= 0
      ? `rgba(96,165,250,${alphaFloor + t * alphaMul})`
      : `rgba(248,113,113,${alphaFloor + -t * alphaMul})`
  }

  const displayPre = showRelu ? POST : PRE

  return (
    <div className="space-y-4">
      <div className="rounded-[3px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="small-caps text-[var(--fg-dim)]">
              feed-forward network · step {phaseIdx + 1} of {PHASES.length}
            </div>
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 display text-[22px]"
              style={{ color: PHASES[phaseIdx].color }}
            >
              {PHASES[phaseIdx].label}
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            {PHASES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPaused(true)
                  setPhaseIdx(i)
                }}
                className={`mono h-7 rounded-full border px-3 text-[10px] transition-colors ${
                  phaseIdx === i
                    ? 'border-[var(--accent)] bg-[rgba(96,165,250,0.15)] text-[var(--accent)]'
                    : 'border-[var(--rule-strong)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
          <defs>
            <filter id="ff-glow">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Column labels */}
          <text
            x={colX.input}
            y={34}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={COLORS.cyan}
            letterSpacing="0.18em"
          >
            INPUT
          </text>
          <text
            x={colX.input}
            y={48}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            384-dim
          </text>

          <text
            x={colX.hidden}
            y={34}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={COLORS.amber}
            letterSpacing="0.18em"
          >
            HIDDEN · 4× WIDER
          </text>
          <text
            x={colX.hidden}
            y={48}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            1536-dim after ReLU
          </text>

          <text
            x={colX.output}
            y={34}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill={COLORS.cyan}
            letterSpacing="0.18em"
          >
            OUTPUT
          </text>
          <text
            x={colX.output}
            y={48}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            384-dim · Δ residual
          </text>

          {/* Expansion weight lines */}
          {showExpandLines &&
            INPUT.map((xv, i) => {
              const fromY = yFor(IN_N, i)
              return W1[i].map((w, j) => {
                const toY = yFor(HID_N, j)
                const thickness = Math.min(1.8, Math.abs(w) * 1.8)
                const opacity = Math.min(0.45, Math.abs(w) * 0.4)
                return (
                  <motion.line
                    key={`w1-${i}-${j}`}
                    x1={colX.input}
                    y1={fromY}
                    x2={colX.hidden}
                    y2={toY}
                    stroke={w >= 0 ? COLORS.blue : COLORS.red}
                    strokeWidth={thickness}
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity, pathLength: 1 }}
                    transition={{ duration: 0.5, delay: (i + j) * 0.003 }}
                  />
                )
              })
            })}

          {/* Compress weight lines */}
          {showCompressLines &&
            POST.map((_, i) =>
              W2[i].map((w, j) => {
                const fromY = yFor(HID_N, i)
                const toY = yFor(OUT_N, j)
                const thickness = Math.min(1.8, Math.abs(w) * 1.5)
                const opacity = Math.min(0.4, Math.abs(w) * 0.35)
                if (POST[i] < 0.02) return null
                return (
                  <motion.line
                    key={`w2-${i}-${j}`}
                    x1={colX.hidden}
                    y1={fromY}
                    x2={colX.output}
                    y2={toY}
                    stroke={w >= 0 ? COLORS.mint : COLORS.red}
                    strokeWidth={thickness}
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity, pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )
              })
            )}

          {/* Input neurons */}
          {INPUT.map((v, i) => {
            const y = yFor(IN_N, i)
            return (
              <g key={`in-${i}`}>
                <circle
                  cx={colX.input}
                  cy={y}
                  r={12}
                  fill={showInput ? valColor(v) : 'rgba(255,255,255,0.03)'}
                  stroke={COLORS.cyan}
                  strokeOpacity={0.6}
                  filter={showInput ? 'url(#ff-glow)' : undefined}
                />
                <text
                  x={colX.input}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill={COLORS.fg}
                >
                  {v.toFixed(1)}
                </text>
              </g>
            )
          })}

          {/* Hidden neurons */}
          {displayPre.map((v, j) => {
            const y = yFor(HID_N, j)
            const killed = showRelu && PRE[j] < 0
            return (
              <motion.g
                key={`hid-${j}-${phase}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: showHiddenPre ? 1 : 0 }}
                transition={{ duration: 0.25, delay: 0.02 * j }}
              >
                <circle
                  cx={colX.hidden}
                  cy={y}
                  r={7}
                  fill={killed ? 'rgba(30,30,35,1)' : valColor(v, 0.08, 0.9)}
                  stroke={killed ? COLORS.red : COLORS.amber}
                  strokeOpacity={killed ? 0.4 : 0.7}
                />
                {killed && (
                  <motion.line
                    x1={colX.hidden - 5}
                    y1={y - 5}
                    x2={colX.hidden + 5}
                    y2={y + 5}
                    stroke={COLORS.red}
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                  />
                )}
              </motion.g>
            )
          })}

          {/* Output neurons */}
          {OUT.map((v, i) => {
            const y = yFor(OUT_N, i)
            return (
              <motion.g
                key={`out-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: showOutput ? 1 : 0.2 }}
                transition={{ delay: i * 0.03 }}
              >
                <circle
                  cx={colX.output}
                  cy={y}
                  r={12}
                  fill={showOutput ? valColor(v) : 'rgba(255,255,255,0.03)'}
                  stroke={COLORS.cyan}
                  strokeOpacity={showOutput ? 0.7 : 0.3}
                  filter={showOutput ? 'url(#ff-glow)' : undefined}
                />
                <text
                  x={colX.output}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill={COLORS.fg}
                >
                  {showOutput ? v.toFixed(1) : '·'}
                </text>
              </motion.g>
            )
          })}

          {/* Column labels at bottom */}
          <text
            x={colX.input}
            y={H - 12}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            x₁, x₂, ... x₈
          </text>
          <text
            x={colX.hidden}
            y={H - 12}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            h = ReLU(x · W₁ + b₁)
          </text>
          <text
            x={colX.output}
            y={H - 12}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill={COLORS.dim}
          >
            out = h · W₂ + b₂
          </text>
        </svg>

        <div className="mt-3 grid grid-cols-3 gap-4 mono text-[10px] text-[var(--fg-muted)]">
          <div>
            <div className="small-caps text-[var(--cyan)]" style={{ color: COLORS.cyan }}>
              expand
            </div>
            <div className="mt-1">
              Each hidden neuron is a weighted sum of all inputs. More dimensions = more room to
              represent intermediate concepts.
            </div>
          </div>
          <div>
            <div className="small-caps" style={{ color: COLORS.red }}>
              ReLU
            </div>
            <div className="mt-1">
              Kills negatives. Sparsity means only the subset of hidden "features" relevant to this
              token actually fires. The rest are dark.
            </div>
          </div>
          <div>
            <div className="small-caps" style={{ color: COLORS.mint }}>
              compress
            </div>
            <div className="mt-1">
              A second weighted sum brings the signal back to 384 dims. This vector is{' '}
              <em>added</em> to the residual — not replaced.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
