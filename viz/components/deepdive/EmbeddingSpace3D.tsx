'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

/**
 * 3D semantic-space visualization.
 *
 * 30 vocabulary tokens placed in 3D. Clusters emerge by "meaning" (hand-
 * crafted groups — pronouns, verbs, articles, punctuation). A focus token
 * orbits through the cloud; lines draw to its top-k nearest neighbors with
 * real cosine-similarity values labeled.
 */

interface TokenPoint {
  id: number
  text: string
  pos: [number, number, number]
  group: string
  color: string
}

const GROUP_COLOR: Record<string, string> = {
  pronoun: '#60a5fa',    // blue
  verb: '#34d399',       // mint
  article: '#a78bfa',    // violet
  punct: '#f87171',      // red
  noun: '#f59e0b',       // amber
  conj: '#22d3ee',       // cyan
}

// Hand-crafted semantic clusters. Points near each other are similar tokens.
const DATA: Array<{ text: string; group: string; seed: [number, number, number] }> = [
  // pronouns — cluster near (2, 2, 0)
  { text: 'I', group: 'pronoun', seed: [2.3, 2.1, 0.2] },
  { text: 'we', group: 'pronoun', seed: [2.1, 2.4, -0.1] },
  { text: 'he', group: 'pronoun', seed: [2.4, 1.9, 0.3] },
  { text: 'she', group: 'pronoun', seed: [2.2, 1.8, -0.2] },
  { text: 'they', group: 'pronoun', seed: [1.9, 2.2, 0.4] },
  { text: 'you', group: 'pronoun', seed: [2.0, 2.3, 0.1] },
  // verbs — cluster near (-2, 1, 1)
  { text: 'run', group: 'verb', seed: [-2.1, 1.2, 1.3] },
  { text: 'walk', group: 'verb', seed: [-2.3, 0.9, 1.1] },
  { text: 'sit', group: 'verb', seed: [-1.9, 1.1, 0.8] },
  { text: 'stand', group: 'verb', seed: [-2.0, 1.3, 0.9] },
  { text: 'jump', group: 'verb', seed: [-2.2, 1.0, 1.4] },
  { text: 'go', group: 'verb', seed: [-1.8, 1.4, 1.0] },
  // articles — cluster near (0, -2, 1)
  { text: 'the', group: 'article', seed: [-0.2, -2.1, 1.2] },
  { text: 'a', group: 'article', seed: [0.1, -2.3, 1.0] },
  { text: 'an', group: 'article', seed: [0.0, -1.9, 1.1] },
  // punctuation — cluster near (0, 0, -2)
  { text: '.', group: 'punct', seed: [0.1, 0.2, -2.1] },
  { text: ',', group: 'punct', seed: [-0.2, 0.0, -2.3] },
  { text: ':', group: 'punct', seed: [0.2, -0.2, -2.0] },
  { text: ';', group: 'punct', seed: [-0.1, 0.3, -1.9] },
  { text: '?', group: 'punct', seed: [0.3, 0.1, -2.2] },
  // nouns — cluster near (1, -1, -1)
  { text: 'cat', group: 'noun', seed: [1.3, -1.1, -1.2] },
  { text: 'dog', group: 'noun', seed: [1.1, -1.3, -1.0] },
  { text: 'house', group: 'noun', seed: [1.4, -0.9, -1.3] },
  { text: 'tree', group: 'noun', seed: [1.2, -1.2, -0.9] },
  { text: 'car', group: 'noun', seed: [1.5, -1.0, -1.1] },
  { text: 'book', group: 'noun', seed: [1.0, -1.4, -1.2] },
  // conjunctions — cluster near (-1.5, -1.5, 0)
  { text: 'and', group: 'conj', seed: [-1.4, -1.6, 0.1] },
  { text: 'or', group: 'conj', seed: [-1.6, -1.4, -0.1] },
  { text: 'but', group: 'conj', seed: [-1.5, -1.7, 0.2] },
]

const POINTS: TokenPoint[] = DATA.map((d, i) => ({
  id: i,
  text: d.text,
  pos: d.seed,
  group: d.group,
  color: GROUP_COLOR[d.group],
}))

function dot(a: number[], b: number[]) {
  return a.reduce((s, v, i) => s + v * b[i], 0)
}
function norm(a: number[]) {
  return Math.sqrt(dot(a, a))
}
function cosine(a: number[], b: number[]) {
  return dot(a, b) / ((norm(a) * norm(b)) || 1)
}

function AutoRotate() {
  const { camera } = useThree()
  const t = useRef(0)
  useFrame((_, delta) => {
    t.current += delta * 0.08
    const r = 8
    camera.position.x = Math.cos(t.current) * r
    camera.position.z = Math.sin(t.current) * r
    camera.position.y = 2 + Math.sin(t.current * 0.3) * 1
    camera.lookAt(0, 0, 0)
  })
  return null
}

function TokenDot({
  point,
  focused,
  nearby,
  similarity,
  onFocus,
}: {
  point: TokenPoint
  focused: boolean
  nearby: boolean
  similarity: number
  onFocus: () => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (focused && ref.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15
      ref.current.scale.setScalar(s)
    }
  })
  return (
    <group position={point.pos}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onFocus()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[focused ? 0.22 : nearby ? 0.16 : 0.1, 24, 24]} />
        <meshStandardMaterial
          color={point.color}
          emissive={point.color}
          emissiveIntensity={focused ? 1.2 : nearby ? 0.6 : 0.25}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <Text
        position={[0.26, 0.14, 0]}
        fontSize={focused ? 0.25 : nearby ? 0.18 : 0.14}
        color={focused ? '#fff' : point.color}
        anchorX="left"
        anchorY="middle"
        outlineColor="#000"
        outlineWidth={0.006}
      >
        {point.text}
      </Text>
      {nearby && !focused && (
        <Html position={[0.3, -0.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: point.color,
              whiteSpace: 'nowrap',
            }}
          >
            cos = {similarity.toFixed(2)}
          </div>
        </Html>
      )}
    </group>
  )
}

function Scene({ focusIdx, setFocusIdx }: { focusIdx: number; setFocusIdx: (n: number) => void }) {
  const focus = POINTS[focusIdx]
  const sims = POINTS.map((p) => (p.id === focus.id ? -Infinity : cosine(focus.pos, p.pos)))
  const ranked = POINTS.map((p, i) => ({ p, sim: sims[i] }))
    .filter((x) => Number.isFinite(x.sim))
    .sort((a, b) => b.sim - a.sim)
  const nearestIds = new Set(ranked.slice(0, 5).map((x) => x.p.id))

  return (
    <>
      <AutoRotate />
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[-6, -4, -6]} intensity={0.5} color="#60a5fa" />

      {/* Axes */}
      {[
        { dir: [4, 0, 0], color: '#f87171', label: 'x' },
        { dir: [0, 4, 0], color: '#34d399', label: 'y' },
        { dir: [0, 0, 4], color: '#60a5fa', label: 'z' },
      ].map((ax, i) => (
        <group key={i}>
          <Line
            points={[
              [0, 0, 0],
              ax.dir as [number, number, number],
            ]}
            color={ax.color}
            lineWidth={1}
            opacity={0.4}
            transparent
          />
          <Text
            position={[ax.dir[0] * 1.08, ax.dir[1] * 1.08, ax.dir[2] * 1.08]}
            fontSize={0.22}
            color={ax.color}
          >
            {ax.label}
          </Text>
        </group>
      ))}

      {/* Similarity lines from focus to nearest */}
      {ranked.slice(0, 5).map((x) => (
        <Line
          key={x.p.id}
          points={[focus.pos, x.p.pos]}
          color={focus.color}
          lineWidth={Math.max(0.5, x.sim * 3)}
          opacity={0.35 + x.sim * 0.55}
          transparent
          dashed={false}
        />
      ))}

      {/* Dots */}
      {POINTS.map((p, i) => (
        <TokenDot
          key={p.id}
          point={p}
          focused={p.id === focus.id}
          nearby={nearestIds.has(p.id)}
          similarity={sims[i]}
          onFocus={() => setFocusIdx(p.id)}
        />
      ))}
    </>
  )
}

export function EmbeddingSpace3D() {
  const [focusIdx, setFocusIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setFocusIdx((i) => (i + 1) % POINTS.length)
    }, 4500)
    return () => clearInterval(id)
  }, [])

  const focus = POINTS[focusIdx]
  const neighbors = useMemo(() => {
    const list = POINTS
      .map((p) => ({ p, sim: p.id === focus.id ? -Infinity : cosine(focus.pos, p.pos) }))
      .filter((x) => Number.isFinite(x.sim))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 6)
    return list
  }, [focusIdx])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="relative aspect-square overflow-hidden rounded-[3px] border border-[var(--rule-strong)] bg-black md:aspect-[16/10]">
        <Canvas camera={{ position: [6, 3, 6], fov: 55 }}>
          <Scene focusIdx={focusIdx} setFocusIdx={setFocusIdx} />
          <OrbitControls enableZoom enablePan={false} enableRotate />
        </Canvas>

        <div className="pointer-events-none absolute left-4 top-4 mono text-[10px] text-[var(--fg-muted)]">
          <div className="small-caps">embedding space · 3d</div>
          <div className="text-[var(--fg-dim)]">drag to rotate · scroll to zoom</div>
        </div>

        <div className="absolute bottom-3 left-4 mono text-[10px]">
          <span className="text-[var(--fg-dim)]">focus · </span>
          <motion.span
            key={focus.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--fg)]"
            style={{ color: focus.color }}
          >
            &ldquo;{focus.text}&rdquo;
          </motion.span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="small-caps mb-2 text-[var(--fg-dim)]">
            legend · hand-crafted semantic clusters
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mono text-[10px]">
            {Object.entries(GROUP_COLOR).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: v }} />
                <span className="text-[var(--fg-muted)]">{k}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-elevated)] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="small-caps text-[var(--fg-dim)]">nearest neighbors of</div>
              <div className="display mt-1 text-[22px]" style={{ color: focus.color }}>
                &ldquo;{focus.text}&rdquo;
              </div>
            </div>
            <span className="mono text-[10px] text-[var(--fg-dim)]">by cosine similarity</span>
          </div>
          <div className="space-y-1.5">
            {neighbors.map((n, i) => (
              <motion.div
                key={`${focus.id}-${n.p.id}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 mono text-[11px]"
              >
                <span className="tabular w-6 text-[var(--fg-dim)]">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <div
                  className="h-5 w-5 rounded-[2px] border"
                  style={{ background: `${n.p.color}33`, borderColor: n.p.color }}
                />
                <span className="w-20 text-[var(--fg)]">{n.p.text}</span>
                <div className="relative h-3 flex-1 overflow-hidden rounded-[1px] bg-[rgba(255,255,255,0.04)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, n.sim * 100)}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.04 }}
                    className="absolute inset-y-0 left-0"
                    style={{ background: n.p.color, opacity: 0.55 }}
                  />
                </div>
                <span className="tabular w-12 text-right text-[var(--fg-muted)]">
                  {n.sim.toFixed(3)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-[2px] border border-[var(--rule)] bg-[rgba(255,255,255,0.015)] p-4 mono text-[10px] text-[var(--fg-muted)]">
          <div className="mb-2 small-caps text-[var(--accent)]">cosine similarity</div>
          <div className="leading-5">
            cos(a, b) = (a · b) / (‖a‖ · ‖b‖)
            <br />
            <span className="text-[var(--fg-dim)]">
              — range [−1, 1]. Identical direction = 1; orthogonal = 0; opposite = −1. The
              embedding matrix is trained so semantically similar tokens land at similar angles.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
