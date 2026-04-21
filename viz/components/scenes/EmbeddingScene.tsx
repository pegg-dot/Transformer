'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { COLORS, MatrixGrid, TokenCell, makeRng } from './primitives'

const VIEWBOX_W = 760
const VIEWBOX_H = 520
const VOCAB = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v']
const D = 32  // embedding dim (viz), actual model has 384

// Pre-generate embedding matrix values [V, D]
const rng = makeRng(11)
const MATRIX: number[][] = VOCAB.map(() => Array.from({ length: D }).map(() => rng() * 2 - 1))

/**
 * Scene 02 — Embedding matrix lookup
 *
 * The big embedding matrix sits on the left. A token ID points to one row —
 * that row "lifts out" and flies to the token on the right, becoming its vector.
 */
export function EmbeddingScene() {
  const [activeIdx, setActiveIdx] = useState(2) // 'c'

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % VOCAB.length)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  const MAT_X = 60
  const MAT_Y = 70
  const CELL = 11
  const matH = VOCAB.length * CELL
  const matW = D * CELL

  const TOK_X = 520
  const TOK_Y = 120

  // highlighted row position (in svg coords)
  const rowY = MAT_Y + activeIdx * CELL + CELL / 2
  const rowRight = MAT_X + matW

  return (
    <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" className="block">
      {/* title */}
      <text
        x={40}
        y={40}
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.18em"
        fill={COLORS.dim}
      >
        EMBEDDING MATRIX · [V={VOCAB.length}, D={D}]
      </text>

      {/* matrix */}
      <MatrixGrid
        x={MAT_X}
        y={MAT_Y}
        rows={VOCAB.length}
        cols={D}
        values={MATRIX}
        cellSize={CELL}
      />

      {/* row labels (vocab) */}
      {VOCAB.map((ch, i) => (
        <text
          key={ch}
          x={MAT_X - 8}
          y={MAT_Y + i * CELL + CELL / 2 + 3}
          textAnchor="end"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill={i === activeIdx ? COLORS.violet : COLORS.dim}
          fontWeight={i === activeIdx ? 600 : 400}
        >
          {ch}
        </text>
      ))}

      {/* highlighted row outline */}
      <motion.rect
        animate={{ y: MAT_Y + activeIdx * CELL - 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        x={MAT_X - 1}
        width={matW + 2}
        height={CELL + 2}
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="1.5"
      />

      {/* extracted row drifting right to the token */}
      <motion.g
        key={`ext-${activeIdx}`}
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={{
          x: [0, 0, TOK_X - MAT_X + 40, TOK_X - MAT_X + 40],
          y: [0, 0, TOK_Y + 60 - rowY, TOK_Y + 60 - rowY],
          opacity: [0, 1, 1, 1],
        }}
        transition={{ duration: 3, ease: 'easeInOut', times: [0, 0.25, 0.8, 1] }}
      >
        <MatrixGrid
          x={MAT_X}
          y={rowY - CELL / 2}
          rows={1}
          cols={D}
          values={[MATRIX[activeIdx]]}
          cellSize={CELL}
        />
      </motion.g>

      {/* token box on the right */}
      <TokenCell
        x={TOK_X}
        y={TOK_Y}
        ch={VOCAB[activeIdx]}
        id={activeIdx}
        color={COLORS.violet}
      />
      <text
        x={TOK_X + 20}
        y={TOK_Y + 62}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        your token
      </text>

      {/* arrow from token to where the vector settles */}
      <text
        x={TOK_X - 30}
        y={TOK_Y + 25}
        textAnchor="end"
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        lookup
      </text>

      {/* resulting vector label */}
      <text
        x={TOK_X + 40}
        y={TOK_Y + 58 + CELL + 20}
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.violet}
      >
        x  ∈ ℝ³⁸⁴  (384 real numbers)
      </text>
      <text
        x={TOK_X + 40}
        y={TOK_Y + 58 + CELL + 38}
        fontSize="10"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        this is what the rest of the model reads
      </text>

      {/* connecting line from token to extracted row */}
      <motion.path
        key={`path-${activeIdx}`}
        d={`M ${rowRight} ${rowY} C ${rowRight + 50} ${rowY}, ${TOK_X - 40} ${TOK_Y + 22}, ${TOK_X} ${TOK_Y + 22}`}
        fill="none"
        stroke={COLORS.violet}
        strokeOpacity={0.5}
        strokeWidth="1"
        strokeDasharray="3 3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* caption */}
      <text
        x={VIEWBOX_W / 2}
        y={VIEWBOX_H - 60}
        textAnchor="middle"
        fontSize="14"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fill={COLORS.dim}
      >
        each of the 65 characters owns one row.
      </text>
      <text
        x={VIEWBOX_W / 2}
        y={VIEWBOX_H - 35}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={COLORS.dim}
      >
        row lookup → the vector that represents that character
      </text>
    </svg>
  )
}
