# Per-Scene 3D Visualizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `ModelMap3D.tsx` with 26 purpose-built 3D dioramas (Mode A anchored / Mode B free-standing / Mode C hybrid backprop) driven by a shared dispatcher, matching the 3Blue1Brown "Inside an LLM" aesthetic.

**Architecture:** Dispatcher component (`components/movie/modelmap/index.tsx`) routes by `(part, sceneId)` to one of 26 scene files. Shared primitives (Slab, DenseMesh, NumericColumn, BlockFrame, StackBackdrop, Label, CameraController) live in `modelmap/shared/`. Each scene is a pure function of `t` seconds into the scene — no internal state, no intervals.

**Tech Stack:** Next.js 16 (Turbopack), React 19, TypeScript strict, @react-three/fiber, @react-three/drei, three.js r170, framer-motion (already installed).

**Spec reference:** `docs/superpowers/specs/2026-04-19-modelmap3d-per-scene-design.md`

---

## File Structure Map

```
components/movie/modelmap/
├── index.tsx                     dispatcher + <Canvas>
├── shared/
│   ├── constants.ts              colors, geometry consts, camera waypoints, scene durations
│   ├── rng.ts                    mulberry32 RNG (seeded)
│   ├── easing.ts                 easeInOut, easeOutCubic, smoothstep
│   ├── Slab.tsx                  translucent plane + cell grid + corner ticks
│   ├── DenseMesh.tsx             red/blue wire-cloud (BufferGeometry lines)
│   ├── NumericColumn.tsx         vertical strip of rendered floats
│   ├── BlockFrame.tsx            dashed wireframe box for a transformer block
│   ├── StackBackdrop.tsx         full 6-block skeleton for establishing shots / backdrops
│   ├── Label.tsx                 serif-italic floating text wrapper
│   ├── CameraController.tsx      lerps camera to waypoint for current (part, sceneId)
│   └── SceneClock.tsx            provides `t` seconds via useFrame, pushes to scene children
├── sceneA_Tokens.tsx
├── sceneA_Bpe.tsx
├── sceneA_Embed.tsx
├── sceneA_Positional.tsx
├── sceneA_LayerNorm.tsx
├── sceneA_Qkv.tsx
├── sceneA_Attn.tsx               the jewel — 3B1B attention grid
├── sceneA_Multi.tsx
├── sceneA_Ffn.tsx
├── sceneA_FfnFeature.tsx
├── sceneA_Gelu.tsx
├── sceneA_Stack.tsx
├── sceneA_Sample.tsx
├── sceneA_KvCache.tsx
├── sceneA_Output.tsx
├── sceneB_Loss.tsx
├── sceneB_LossSeq.tsx
├── sceneB_LossBatch.tsx
├── sceneB_Training.tsx
├── sceneB_GdRavine.tsx
├── sceneB_GdAdam.tsx
├── sceneB_Rope.tsx
├── sceneB_Modern.tsx
├── sceneC_Backprop.tsx
├── sceneC_BpJacobian.tsx
└── sceneC_BpAccum.tsx
```

Old file `components/movie/ModelMap3D.tsx` is deleted at the end.

---

## Conventions

All scenes export a default component with this exact signature:

```tsx
import type { SceneProps } from './shared/types'
export default function SceneXxx({ t, duration, accent, sceneId }: SceneProps) {
  // ... returns <group>...</group>
}
```

All scenes are **pure functions of `t`** — no `useState`, no `setInterval`, no `useEffect`. The parent `SceneClock` increments `t` each frame and passes it down. Scrubbing backward works automatically.

Verification for visual scenes: dev server running, navigate to `/tour`, click to the target scene, visually confirm behavior matches the spec. There are no unit tests for aesthetic correctness — visual inspection is the test.

---

## Phase 0: Prep

### Task 1: Verify starting state and back up old ModelMap3D

**Files:**
- Modify: (none — backup only)

- [ ] **Step 1: Verify starting state**

```bash
cd /Users/natepegg/Transformer/viz
npx tsc --noEmit
```

Expected: no output (clean)

- [ ] **Step 2: Confirm dev server runs and /tour loads**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tour
```

Expected: `200` (if dev server isn't running, start it: `npm run dev > /tmp/viz-dev.log 2>&1 &`)

- [ ] **Step 3: Commit starting state**

No changes to commit — skip to Task 2.

---

## Phase 1: Foundation (Tasks 2–13)

### Task 2: Create shared constants

**Files:**
- Create: `components/movie/modelmap/shared/types.ts`
- Create: `components/movie/modelmap/shared/constants.ts`

- [ ] **Step 1: Write shared types**

Create `components/movie/modelmap/shared/types.ts`:

```tsx
export type ModelPart =
  | 'tokenize' | 'embed' | 'positional'
  | 'layernorm' | 'attention' | 'ffn' | 'stack'
  | 'sample' | 'kvcache'
  | 'loss' | 'backprop' | 'gradient-descent' | 'modern' | 'generation'

export type SceneMode = 'A' | 'B' | 'C'

export interface SceneProps {
  t: number           // seconds into this scene
  duration: number    // total seconds
  accent: string      // hex color string
  sceneId: string     // e.g. 'qkv', 'attn', 'multi'
}
```

- [ ] **Step 2: Write shared constants**

Create `components/movie/modelmap/shared/constants.ts`:

```tsx
import * as THREE from 'three'

export const COLORS = {
  bg: '#000000',
  fg: '#f5f5f4',
  dim: '#737373',
  rule: '#262626',
  blue: '#60a5fa',
  red: '#f87171',
  violet: '#a78bfa',
  mint: '#6ee7b7',
  gold: '#fbbf24',
  slabTint: 'rgba(96,165,250,0.12)',
} as const

// Stack geometry (the 6-block skeleton used as backdrop)
export const N_BLOCKS = 6
export const BLOCK_LEN = 3.2
export const BLOCK_GAP = 0.5
export const INPUT_LEN = 2.0
export const OUTPUT_LEN = 2.0
export const TOTAL_X =
  INPUT_LEN + N_BLOCKS * (BLOCK_LEN + BLOCK_GAP) - BLOCK_GAP + OUTPUT_LEN
export const MID_X = TOTAL_X / 2

export function blockStart(bi: number): number {
  return INPUT_LEN + bi * (BLOCK_LEN + BLOCK_GAP)
}

// Slab default size
export const SLAB_W = 2.0  // along x
export const SLAB_H = 1.3  // along y
export const SLAB_DEPTH = 0.04

// Camera waypoint catalog — keyed by (part, sceneId?)
export interface Waypoint {
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
}

export const WAYPOINTS: Record<string, Waypoint> = {
  overview: {
    pos: [MID_X - 0.5, 1.3, 5.8],
    look: [MID_X, -0.3, 0],
    fov: 50,
  },
  shelfTop: {
    pos: [2.2, 2.2, 3.8],
    look: [2.2, 0.8, 0],
    fov: 48,
  },
  block0Inside: {
    pos: [blockStart(0) + BLOCK_LEN / 2, 0.3, 2.4],
    look: [blockStart(0) + BLOCK_LEN / 2, 0, 0],
    fov: 44,
  },
  attnGrid: {
    pos: [blockStart(0) + 1.2, 0.5, 2.2],
    look: [blockStart(0) + 1.6, 0, 0],
    fov: 40,
  },
  ffnInside: {
    pos: [blockStart(0) + 2.2, 0.3, 2.2],
    look: [blockStart(0) + 2.2, 0, 0],
    fov: 42,
  },
  stackPullback: {
    pos: [MID_X, 2.0, 8.5],
    look: [MID_X, 0, 0],
    fov: 55,
  },
  sampleOutput: {
    pos: [TOTAL_X - 1.0, 0.3, 2.4],
    look: [TOTAL_X - 1.8, -0.2, 0],
    fov: 44,
  },
  dioramaCenter: {
    pos: [MID_X, 0.5, 4.5],
    look: [MID_X, 0, 0],
    fov: 45,
  },
}

// Map each scene id (matches app/tour/page.tsx ids) to a waypoint name
export const SCENE_WAYPOINT: Record<string, keyof typeof WAYPOINTS> = {
  tokens: 'shelfTop',
  bpe: 'shelfTop',
  embed: 'shelfTop',
  positional: 'shelfTop',
  layernorm: 'block0Inside',
  qkv: 'block0Inside',
  attn: 'attnGrid',
  multi: 'attnGrid',
  ffn: 'ffnInside',
  'ffn-feature': 'ffnInside',
  gelu: 'ffnInside',
  stack: 'stackPullback',
  sample: 'sampleOutput',
  kvcache: 'attnGrid',
  loss: 'dioramaCenter',
  'loss-seq': 'dioramaCenter',
  'loss-batch': 'dioramaCenter',
  backprop: 'stackPullback',
  'bp-jacobian': 'block0Inside',
  'bp-accum': 'stackPullback',
  training: 'dioramaCenter',
  'gd-ravine': 'dioramaCenter',
  'gd-adam': 'dioramaCenter',
  rope: 'dioramaCenter',
  modern: 'dioramaCenter',
  output: 'stackPullback',
}

export const FOG_NEAR = 6
export const FOG_FAR = 18
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add components/movie/modelmap/shared/types.ts components/movie/modelmap/shared/constants.ts
git commit -m "ModelMap3D refactor: types + shared constants

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Shared RNG + easing utilities

**Files:**
- Create: `components/movie/modelmap/shared/rng.ts`
- Create: `components/movie/modelmap/shared/easing.ts`

- [ ] **Step 1: Write rng.ts**

```tsx
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    let t = (a = (a + 0x6D2B79F5) >>> 0)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}
```

- [ ] **Step 2: Write easing.ts**

```tsx
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

export function pingPong(t: number, period: number): number {
  const k = (t % period) / period
  return k < 0.5 ? k * 2 : (1 - k) * 2
}

export function loopPhase(t: number, duration: number): number {
  return (t % duration) / duration
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/movie/modelmap/shared/rng.ts components/movie/modelmap/shared/easing.ts
git commit -m "ModelMap3D refactor: RNG and easing utilities

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Shared Slab primitive (the fundamental data surface)

**Files:**
- Create: `components/movie/modelmap/shared/Slab.tsx`

- [ ] **Step 1: Write Slab.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, SLAB_DEPTH } from './constants'

export interface SlabProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  width: number
  height: number
  depth?: number
  color?: string
  opacity?: number
  cells?: { cols: number; rows: number; values?: Float32Array } | null
  showCornerTicks?: boolean
  tickLength?: number
}

/**
 * Translucent slab with optional cell grid and corner L-ticks.
 * The fundamental 3B1B data surface.
 */
export function Slab({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width,
  height,
  depth = SLAB_DEPTH,
  color = COLORS.slabTint,
  opacity = 0.15,
  cells = null,
  showCornerTicks = true,
  tickLength = 0.1,
}: SlabProps) {
  const { cellMatrix, cellColors, cellCount } = useMemo(() => {
    if (!cells) return { cellMatrix: null, cellColors: null, cellCount: 0 }
    const total = cells.cols * cells.rows
    const matrix = new Float32Array(total * 16)
    const colors = new Float32Array(total * 3)
    const dummy = new THREE.Object3D()
    const cellW = width / cells.cols
    const cellH = height / cells.rows
    for (let r = 0; r < cells.rows; r++) {
      for (let c = 0; c < cells.cols; c++) {
        const i = r * cells.cols + c
        const x = -width / 2 + cellW * (c + 0.5)
        const y = -height / 2 + cellH * (r + 0.5)
        dummy.position.set(x, y, depth / 2 + 0.002)
        dummy.scale.set(cellW * 0.85, cellH * 0.85, 0.004)
        dummy.updateMatrix()
        dummy.matrix.toArray(matrix, i * 16)
        const v = cells.values ? cells.values[i] : 0
        const clamped = Math.max(-1, Math.min(1, v))
        // red for negative, blue for positive
        if (clamped >= 0) {
          colors[i * 3] = 0.38
          colors[i * 3 + 1] = 0.65
          colors[i * 3 + 2] = 0.98
        } else {
          colors[i * 3] = 0.97
          colors[i * 3 + 1] = 0.44
          colors[i * 3 + 2] = 0.44
        }
      }
    }
    return { cellMatrix: matrix, cellColors: colors, cellCount: total }
  }, [cells, width, height, depth])

  const ticks = useMemo(() => {
    if (!showCornerTicks) return []
    const hw = width / 2
    const hh = height / 2
    const z = depth / 2 + 0.003
    const L = tickLength
    // Each corner gets two short lines (L-shape)
    return [
      [[-hw, -hh, z], [-hw + L, -hh, z]],
      [[-hw, -hh, z], [-hw, -hh + L, z]],
      [[hw, -hh, z], [hw - L, -hh, z]],
      [[hw, -hh, z], [hw, -hh + L, z]],
      [[-hw, hh, z], [-hw + L, hh, z]],
      [[-hw, hh, z], [-hw, hh - L, z]],
      [[hw, hh, z], [hw - L, hh, z]],
      [[hw, hh, z], [hw, hh - L, z]],
    ] as [number, number, number][][]
  }, [showCornerTicks, width, height, depth, tickLength])

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {cellMatrix && cellCount > 0 && (
        <instancedMesh args={[undefined as never, undefined as never, cellCount]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial vertexColors transparent opacity={0.85} depthWrite={false} />
          <primitive
            attach="instanceMatrix"
            object={
              new THREE.InstancedBufferAttribute(cellMatrix, 16).setUsage(THREE.StaticDrawUsage)
            }
          />
          <primitive
            attach="instanceColor"
            object={
              new THREE.InstancedBufferAttribute(cellColors!, 3).setUsage(THREE.StaticDrawUsage)
            }
          />
        </instancedMesh>
      )}
      {ticks.map((seg, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(seg.flat()), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={COLORS.fg} transparent opacity={0.85} />
        </line>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/movie/modelmap/shared/Slab.tsx
git commit -m "ModelMap3D refactor: Slab primitive (translucent glass + corner ticks)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: DenseMesh primitive (red/blue wire cloud)

**Files:**
- Create: `components/movie/modelmap/shared/DenseMesh.tsx`

- [ ] **Step 1: Write DenseMesh.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mulberry32 } from './rng'

export interface DenseMeshProps {
  position?: [number, number, number]
  extent?: [number, number, number]   // x, y, z half-widths
  nodeCount?: number
  connectionCount?: number
  seed?: number
  opacity?: number
}

/**
 * Dense 3D cloud of nodes with red/blue colored connection lines.
 * The 3B1B "activity happens here" cloud.
 */
export function DenseMesh({
  position = [0, 0, 0],
  extent = [0.9, 0.5, 0.3],
  nodeCount = 150,
  connectionCount = 450,
  seed = 1,
  opacity = 0.55,
}: DenseMeshProps) {
  const { positions, colors, lineIndices } = useMemo(() => {
    const rng = mulberry32(seed)
    const nodes: [number, number, number][] = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push([
        (rng() * 2 - 1) * extent[0],
        (rng() * 2 - 1) * extent[1],
        (rng() * 2 - 1) * extent[2],
      ])
    }

    // Build line segments: two vertices per segment, vertex color per vertex
    const linePositions = new Float32Array(connectionCount * 2 * 3)
    const lineColors = new Float32Array(connectionCount * 2 * 3)
    for (let i = 0; i < connectionCount; i++) {
      const a = Math.floor(rng() * nodeCount)
      const b = Math.floor(rng() * nodeCount)
      linePositions.set(nodes[a], i * 6)
      linePositions.set(nodes[b], i * 6 + 3)
      const isBlue = rng() > 0.5
      const r = isBlue ? 0.38 : 0.97
      const g = isBlue ? 0.65 : 0.44
      const bl = isBlue ? 0.98 : 0.44
      lineColors[i * 6] = r
      lineColors[i * 6 + 1] = g
      lineColors[i * 6 + 2] = bl
      lineColors[i * 6 + 3] = r
      lineColors[i * 6 + 4] = g
      lineColors[i * 6 + 5] = bl
    }
    return { positions: linePositions, colors: lineColors, lineIndices: connectionCount }
  }, [nodeCount, connectionCount, seed, extent])

  return (
    <group position={position}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={opacity} depthWrite={false} />
      </lineSegments>
    </group>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/shared/DenseMesh.tsx
git commit -m "ModelMap3D refactor: DenseMesh primitive

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: NumericColumn primitive

**Files:**
- Create: `components/movie/modelmap/shared/NumericColumn.tsx`

- [ ] **Step 1: Write NumericColumn.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { mulberry32 } from './rng'
import { COLORS } from './constants'

export interface NumericColumnProps {
  position?: [number, number, number]
  rows?: number
  rowHeight?: number
  seed?: number
  color?: string
  opacity?: number
}

export function NumericColumn({
  position = [0, 0, 0],
  rows = 10,
  rowHeight = 0.12,
  seed = 1,
  color = COLORS.dim,
  opacity = 0.7,
}: NumericColumnProps) {
  const values = useMemo(() => {
    const rng = mulberry32(seed)
    return Array.from({ length: rows }).map(() => {
      const v = (rng() * 2 - 1) * 9.9
      return v.toFixed(1)
    })
  }, [rows, seed])

  return (
    <group position={position}>
      {values.map((v, i) => (
        <Text
          key={i}
          position={[0, (rows / 2 - i - 0.5) * rowHeight, 0]}
          fontSize={0.075}
          color={color}
          fillOpacity={opacity}
          anchorX="center"
          anchorY="middle"
          material-depthWrite={false}
        >
          {v}
        </Text>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/shared/NumericColumn.tsx
git commit -m "ModelMap3D refactor: NumericColumn primitive

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Label + BlockFrame primitives

**Files:**
- Create: `components/movie/modelmap/shared/Label.tsx`
- Create: `components/movie/modelmap/shared/BlockFrame.tsx`

- [ ] **Step 1: Write Label.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import { COLORS } from './constants'

export interface LabelProps {
  position: [number, number, number]
  children: string
  size?: number
  color?: string
  opacity?: number
  italic?: boolean
}

export function Label({
  position,
  children,
  size = 0.18,
  color = COLORS.fg,
  opacity = 0.9,
  italic = true,
}: LabelProps) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      fillOpacity={opacity}
      anchorX="center"
      anchorY="middle"
      font="/fonts/EBGaramond-Italic.ttf"
      material-depthWrite={false}
    >
      {children}
    </Text>
  )
}
```

Note: if the EBGaramond font isn't present, drop the `font` prop and drei will fall back. That's acceptable for now — aesthetic polish pass later.

- [ ] **Step 2: Write BlockFrame.tsx**

```tsx
'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import { COLORS } from './constants'

export interface BlockFrameProps {
  position?: [number, number, number]
  size: [number, number, number]
  color?: string
  opacity?: number
}

export function BlockFrame({
  position = [0, 0, 0],
  size,
  color = COLORS.dim,
  opacity = 0.5,
}: BlockFrameProps) {
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(size[0], size[1], size[2])
    const e = new THREE.EdgesGeometry(box)
    box.dispose()
    return e
  }, [size])

  return (
    <group position={position}>
      <lineSegments geometry={edges}>
        <lineDashedMaterial
          color={color}
          transparent
          opacity={opacity}
          dashSize={0.14}
          gapSize={0.08}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/shared/Label.tsx components/movie/modelmap/shared/BlockFrame.tsx
git commit -m "ModelMap3D refactor: Label + BlockFrame primitives

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: StackBackdrop (6-block skeleton for establishing shots)

**Files:**
- Create: `components/movie/modelmap/shared/StackBackdrop.tsx`

- [ ] **Step 1: Write StackBackdrop.tsx**

```tsx
'use client'

import {
  N_BLOCKS, blockStart, BLOCK_LEN, SLAB_W, SLAB_H, SLAB_DEPTH,
  INPUT_LEN, OUTPUT_LEN, TOTAL_X, COLORS,
} from './constants'
import { BlockFrame } from './BlockFrame'
import { Slab } from './Slab'

export interface StackBackdropProps {
  mode: 'A' | 'B' | 'C'   // controls how dim
  activeBlock?: number    // block index 0..5 — highlighted vs dimmed
}

/**
 * Faint skeleton of the full transformer stack.
 * Used as a backdrop for establishing shots and as dim context behind dioramas.
 */
export function StackBackdrop({ mode, activeBlock }: StackBackdropProps) {
  const baseOpacity = mode === 'A' ? 0.3 : mode === 'C' ? 0.22 : 0.08

  return (
    <group>
      {/* Input stage (embed + positional) */}
      <Slab
        position={[INPUT_LEN / 2, 0, 0]}
        width={INPUT_LEN * 0.8}
        height={SLAB_H}
        color={COLORS.violet}
        opacity={baseOpacity * 0.5}
        showCornerTicks={false}
      />

      {/* 6 blocks */}
      {Array.from({ length: N_BLOCKS }).map((_, bi) => {
        const isActive = activeBlock === bi
        const opacity = isActive ? baseOpacity * 2.2 : baseOpacity
        const cx = blockStart(bi) + BLOCK_LEN / 2
        return (
          <group key={bi}>
            <BlockFrame
              position={[cx, 0, 0]}
              size={[BLOCK_LEN, SLAB_H, 0.9]}
              color={isActive ? COLORS.fg : COLORS.dim}
              opacity={opacity}
            />
            {/* Two slabs per block (attn + ffn) */}
            <Slab
              position={[cx - 0.7, 0, 0]}
              width={BLOCK_LEN * 0.35}
              height={SLAB_H * 0.9}
              color={COLORS.blue}
              opacity={opacity * 0.4}
              showCornerTicks={isActive}
            />
            <Slab
              position={[cx + 0.7, 0, 0]}
              width={BLOCK_LEN * 0.35}
              height={SLAB_H * 0.9}
              color={COLORS.mint}
              opacity={opacity * 0.4}
              showCornerTicks={isActive}
            />
          </group>
        )
      })}

      {/* Output stage (unembed) */}
      <Slab
        position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0]}
        width={OUTPUT_LEN * 0.8}
        height={SLAB_H}
        color={COLORS.gold}
        opacity={baseOpacity * 0.5}
        showCornerTicks={false}
      />
    </group>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/shared/StackBackdrop.tsx
git commit -m "ModelMap3D refactor: StackBackdrop skeleton

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: CameraController + SceneClock

**Files:**
- Create: `components/movie/modelmap/shared/CameraController.tsx`
- Create: `components/movie/modelmap/shared/SceneClock.tsx`

- [ ] **Step 1: Write CameraController.tsx**

```tsx
'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { SCENE_WAYPOINT, WAYPOINTS, type Waypoint } from './constants'

function waypointForScene(sceneId: string | undefined): Waypoint {
  if (!sceneId) return WAYPOINTS.overview
  const key = SCENE_WAYPOINT[sceneId]
  return WAYPOINTS[key ?? 'overview']
}

export interface CameraControllerProps {
  sceneId: string | undefined
  speed?: number
}

/**
 * Lerps the camera toward the waypoint for the current scene.
 * Never teleports — ensures smooth cinematic transitions.
 */
export function CameraController({ sceneId, speed = 1.8 }: CameraControllerProps) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, dt) => {
    const wp = waypointForScene(sceneId)
    targetPos.current.set(...wp.pos)
    targetLook.current.set(...wp.look)

    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== wp.fov) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, wp.fov, Math.min(1, dt * speed))
      camera.updateProjectionMatrix()
    }

    const alpha = 1 - Math.exp(-speed * dt)
    camera.position.lerp(targetPos.current, alpha)
    currentLook.current.lerp(targetLook.current, alpha)
    camera.lookAt(currentLook.current)
  })

  return null
}
```

- [ ] **Step 2: Write SceneClock.tsx**

```tsx
'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export interface SceneClockProps {
  running: boolean
  onTick: (t: number) => void
  resetKey: string   // changes when scene changes → resets t to 0
}

/**
 * Advances scene-local `t` seconds every frame and pushes to onTick.
 * Resets to 0 whenever resetKey changes.
 */
export function SceneClock({ running, onTick, resetKey }: SceneClockProps) {
  const t = useRef(0)
  const lastKey = useRef(resetKey)

  useFrame((_, dt) => {
    if (lastKey.current !== resetKey) {
      t.current = 0
      lastKey.current = resetKey
    }
    if (running) {
      t.current += dt
      onTick(t.current)
    }
  })

  return null
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/shared/CameraController.tsx components/movie/modelmap/shared/SceneClock.tsx
git commit -m "ModelMap3D refactor: CameraController + SceneClock

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Dispatcher skeleton (no scenes wired yet)

**Files:**
- Create: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write index.tsx with stack-only fallback**

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { Fog } from 'three'
import { useState, useMemo } from 'react'
import { COLORS, FOG_NEAR, FOG_FAR, MID_X } from './shared/constants'
import type { SceneMode } from './shared/types'
import { CameraController } from './shared/CameraController'
import { SceneClock } from './shared/SceneClock'
import { StackBackdrop } from './shared/StackBackdrop'

// Scene registry — will be filled in as scenes are implemented
const SCENE_MAP: Record<string, React.ComponentType<import('./shared/types').SceneProps>> = {}

function sceneMode(sceneId: string): SceneMode {
  if (!sceneId) return 'A'
  const a = new Set([
    'tokens','bpe','embed','positional','layernorm','qkv','attn','multi',
    'ffn','ffn-feature','gelu','stack','sample','kvcache','output',
  ])
  const c = new Set(['backprop','bp-jacobian','bp-accum'])
  if (a.has(sceneId)) return 'A'
  if (c.has(sceneId)) return 'C'
  return 'B'
}

function activeBlockForScene(sceneId: string): number | undefined {
  // Scenes that live inside block 0
  const b0 = new Set(['layernorm','qkv','attn','multi','ffn','ffn-feature','gelu','kvcache','bp-jacobian'])
  return b0.has(sceneId) ? 0 : undefined
}

export interface ModelMap3DProps {
  part: string | undefined   // ModelPart string (legacy arg, tolerated)
  sceneId: string
  accent: string
  duration: number           // ms
}

export function ModelMap3D({ sceneId, accent, duration }: ModelMap3DProps) {
  const [t, setT] = useState(0)
  const Scene = SCENE_MAP[sceneId]
  const mode = useMemo(() => sceneMode(sceneId), [sceneId])
  const activeBlock = useMemo(() => activeBlockForScene(sceneId), [sceneId])
  const durationSec = duration / 1000

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: COLORS.bg }}>
      <Canvas
        camera={{ position: [MID_X - 0.5, 1.3, 5.8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ scene }) => {
          scene.fog = new Fog(COLORS.bg, FOG_NEAR, FOG_FAR)
          scene.background = null
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 8]} intensity={0.6} />
        <directionalLight position={[-4, 2, -3]} intensity={0.3} />

        <CameraController sceneId={sceneId} />
        <SceneClock running={true} onTick={setT} resetKey={sceneId} />

        <StackBackdrop mode={mode} activeBlock={activeBlock} />

        {Scene && <Scene t={t} duration={durationSec} accent={accent} sceneId={sceneId} />}
      </Canvas>
    </div>
  )
}

// Re-export ModelPart for MovieOrchestrator.tsx backwards-compat
export type { ModelPart } from './shared/types'
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/movie/modelmap/index.tsx
git commit -m "ModelMap3D refactor: dispatcher skeleton (stack-only, no scenes yet)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Wire MovieOrchestrator to use new dispatcher

**Files:**
- Modify: `components/movie/MovieOrchestrator.tsx`

- [ ] **Step 1: Find the current ModelMap3D import**

```bash
grep -n "ModelMap3D\|ModelPart" components/movie/MovieOrchestrator.tsx
```

- [ ] **Step 2: Replace the import and usage**

The current import is `import { ModelMap3D, type ModelPart } from './ModelMap3D'`. Change to `import { ModelMap3D, type ModelPart } from './modelmap'`.

In the JSX where `<ModelMap3D part={current.part} accent={current.accent} />` is rendered, change to:

```tsx
<ModelMap3D
  part={current.part}
  sceneId={current.id}
  accent={current.accent}
  duration={current.durationMs}
/>
```

Note: the scene descriptor uses `durationMs`; confirm the exact property name by reading `app/tour/page.tsx`. If the property is `duration` pass `duration={current.duration}`.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

If errors appear about `current.id` being undefined, read the scene shape in `app/tour/page.tsx` and adapt the prop name.

- [ ] **Step 4: Verify /tour still loads**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tour
```

Expected: `200`. Visit in browser; you should now see the 6-block skeleton backdrop only (no scene content yet). Camera should move between scenes.

- [ ] **Step 5: Commit**

```bash
git add components/movie/MovieOrchestrator.tsx
git commit -m "Wire MovieOrchestrator to new modelmap dispatcher

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Delete old ModelMap3D.tsx

**Files:**
- Delete: `components/movie/ModelMap3D.tsx`

- [ ] **Step 1: Confirm nothing else imports it**

```bash
grep -rn "from ['\"].*ModelMap3D['\"]" components/ app/ lib/
```

Expected: no results (after Task 11 the only import was MovieOrchestrator, now updated).

- [ ] **Step 2: Delete and commit**

```bash
git rm components/movie/ModelMap3D.tsx
npx tsc --noEmit
git commit -m "Remove legacy ModelMap3D.tsx (superseded by modelmap/)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2: The Jewel — Attention Scene (Task 13)

### Task 13: sceneA_Attn.tsx — the 3B1B QK grid

This is the hardest scene and the aesthetic north star. Build it first so the rest can match.

**Files:**
- Create: `components/movie/modelmap/sceneA_Attn.tsx`
- Modify: `components/movie/modelmap/index.tsx` (register in SCENE_MAP)

- [ ] **Step 1: Write sceneA_Attn.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { smoothstep, clamp01 } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const T = 7  // sequence length shown (fixed for visual clarity)

export default function SceneAttn({ t, duration }: SceneProps) {
  // Phase split: 0-0.25 establish, 0.25-0.55 QK grid lights up,
  // 0.55-0.75 softmax row-normalizes, 0.75-1.0 V-aggregation
  const p = clamp01(t / Math.max(0.01, duration))
  const phaseEstablish = smoothstep(0, 0.25, p)
  const phaseScores = smoothstep(0.2, 0.55, p)
  const phaseSoftmax = smoothstep(0.55, 0.75, p)
  const phaseAggregate = smoothstep(0.75, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.35

  // Precompute QK scores (fake, deterministic)
  const { rawScores, softmax } = useMemo(() => {
    const rng = mulberry32(987654)
    const raw = new Float32Array(T * T)
    for (let r = 0; r < T; r++) {
      for (let c = 0; c < T; c++) {
        raw[r * T + c] = c > r ? -9999 : (rng() * 2 - 1) * 2 // causal mask above diagonal
      }
    }
    const soft = new Float32Array(T * T)
    for (let r = 0; r < T; r++) {
      let max = -1e9
      for (let c = 0; c <= r; c++) if (raw[r * T + c] > max) max = raw[r * T + c]
      let sum = 0
      for (let c = 0; c <= r; c++) {
        soft[r * T + c] = Math.exp(raw[r * T + c] - max)
        sum += soft[r * T + c]
      }
      for (let c = 0; c <= r; c++) soft[r * T + c] /= sum
    }
    return { rawScores: raw, softmax: soft }
  }, [])

  // Grid cell size
  const CELL = 0.18
  const gridW = T * CELL
  const gridH = T * CELL

  // Q row (top, horizontal) and K column (left, vertical)
  const qRowY = gridH / 2 + CELL * 1.4
  const kColX = -gridW / 2 - CELL * 1.4

  return (
    <group position={[cx, 0, 0]}>
      {/* Serif label floating above */}
      <Label position={[0, gridH / 2 + 0.6, 0.2]} size={0.22} opacity={0.85 * phaseEstablish}>
        Attention
      </Label>

      {/* Q row — top */}
      <group position={[0, qRowY, 0]}>
        <Label position={[-gridW / 2 - 0.35, 0, 0]} size={0.1} color={COLORS.blue} opacity={0.9 * phaseEstablish}>
          Q
        </Label>
        {Array.from({ length: T }).map((_, c) => (
          <mesh key={c} position={[-gridW / 2 + (c + 0.5) * CELL, 0, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial
              color={COLORS.blue}
              transparent
              opacity={0.35 * phaseEstablish + 0.3 * phaseScores}
            />
          </mesh>
        ))}
      </group>

      {/* K column — left */}
      <group position={[kColX, 0, 0]}>
        <Label position={[0, gridH / 2 + 0.3, 0]} size={0.1} color={COLORS.red} opacity={0.9 * phaseEstablish}>
          K
        </Label>
        {Array.from({ length: T }).map((_, r) => (
          <mesh key={r} position={[0, gridH / 2 - (r + 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial
              color={COLORS.red}
              transparent
              opacity={0.35 * phaseEstablish + 0.3 * phaseScores}
            />
          </mesh>
        ))}
      </group>

      {/* The QK grid — cells light up during phaseScores, re-weight during phaseSoftmax */}
      <group>
        {Array.from({ length: T }).map((_, r) =>
          Array.from({ length: T }).map((_, c) => {
            const x = -gridW / 2 + (c + 0.5) * CELL
            const y = gridH / 2 - (r + 0.5) * CELL
            const masked = c > r
            if (masked) {
              // show causal mask as faint red X
              return (
                <mesh key={`${r}-${c}`} position={[x, y, 0]}>
                  <planeGeometry args={[CELL * 0.9, CELL * 0.9]} />
                  <meshBasicMaterial
                    color={COLORS.red}
                    transparent
                    opacity={0.08 * phaseScores}
                  />
                </mesh>
              )
            }
            // live cell
            const scoreNorm = (rawScores[r * T + c] + 2) / 4 // ~0..1
            const softVal = softmax[r * T + c]
            const brightness =
              THREE.MathUtils.lerp(scoreNorm, softVal * T, phaseSoftmax) * phaseScores
            return (
              <mesh key={`${r}-${c}`} position={[x, y, 0]}>
                <planeGeometry args={[CELL * 0.92, CELL * 0.92]} />
                <meshBasicMaterial
                  color={COLORS.fg}
                  transparent
                  opacity={clamp01(brightness) * 0.85}
                />
              </mesh>
            )
          })
        )}
      </group>

      {/* Grid frame */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.PlaneGeometry(gridW, gridH)]}
        />
        <lineBasicMaterial color={COLORS.fg} transparent opacity={0.5 * phaseEstablish} />
      </lineSegments>

      {/* Softmax label */}
      <Text
        position={[gridW / 2 + 0.5, 0, 0]}
        fontSize={0.11}
        color={COLORS.fg}
        fillOpacity={0.75 * phaseSoftmax}
        anchorX="left"
        anchorY="middle"
      >
        softmax↑
      </Text>

      {/* V column sliding in from below during phaseAggregate */}
      <group position={[gridW / 2 + 0.9, -gridH / 2 + 0.3 - (1 - phaseAggregate) * 0.6, 0]}>
        <Label position={[0, gridH / 2 + 0.3, 0]} size={0.1} color={COLORS.mint} opacity={0.9 * phaseAggregate}>
          V
        </Label>
        {Array.from({ length: T }).map((_, r) => (
          <mesh key={r} position={[0, gridH / 2 - (r + 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial
              color={COLORS.mint}
              transparent
              opacity={0.7 * phaseAggregate}
            />
          </mesh>
        ))}
      </group>

      {/* Output vector on far right */}
      <group position={[gridW / 2 + 1.6, 0, 0]}>
        {Array.from({ length: T }).map((_, r) => (
          <mesh key={r} position={[0, gridH / 2 - (r + 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.85, CELL * 0.85, 0.02]} />
            <meshBasicMaterial
              color={COLORS.fg}
              transparent
              opacity={0.75 * phaseAggregate}
            />
          </mesh>
        ))}
        <Text
          position={[0, gridH / 2 + 0.3, 0]}
          fontSize={0.09}
          color={COLORS.fg}
          fillOpacity={0.85 * phaseAggregate}
          anchorX="center"
          anchorY="middle"
        >
          output
        </Text>
      </group>

      {/* Backing slab for readability */}
      <Slab
        position={[0, 0, -0.04]}
        width={gridW + 3.2}
        height={gridH + 1.2}
        color={COLORS.slabTint}
        opacity={0.05 + 0.06 * phaseEstablish}
        showCornerTicks={true}
        tickLength={0.14}
      />
    </group>
  )
}
```

- [ ] **Step 2: Register in dispatcher**

In `components/movie/modelmap/index.tsx`, add:

```tsx
import SceneAttn from './sceneA_Attn'
```

and inside `SCENE_MAP`:

```tsx
const SCENE_MAP: Record<string, React.ComponentType<import('./shared/types').SceneProps>> = {
  attn: SceneAttn,
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Visual verify**

Visit `/tour`, let it play until scene 7 (`attn`), confirm:
- Q row appears at top, K column appears at left (blue and red respectively)
- QK grid cells light up around 25% into the scene
- Around 55%, softmax re-normalizes (upper triangle stays dark)
- Around 75%, V column slides in from bottom-right
- Around 85%, output vector appears far right
- Serif "Attention" label visible above

If anything looks wrong, iterate on the scene code and re-verify.

- [ ] **Step 5: Commit**

```bash
git add components/movie/modelmap/sceneA_Attn.tsx components/movie/modelmap/index.tsx
git commit -m "scene: attention (3B1B QK grid, the jewel)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3: Act II remainder (Tasks 14–19)

For each task below, the pattern is identical:
1. Write the scene file
2. Import and register in `SCENE_MAP` in `index.tsx`
3. Type-check
4. Visual verify in `/tour`
5. Commit

The spec's per-scene visualization description is the source of truth. Scene files should use shared primitives (`Slab`, `DenseMesh`, `NumericColumn`, `Label`, `BlockFrame`) wherever possible.

### Task 14: sceneA_LayerNorm.tsx

Residual vector as bar chart → mean line subtracts → variance divides → γ/β cubes multiply/add.

**Files:**
- Create: `components/movie/modelmap/sceneA_LayerNorm.tsx`
- Modify: `components/movie/modelmap/index.tsx` (register)

- [ ] **Step 1: Write sceneA_LayerNorm.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const DIM = 24  // bar count

export default function SceneLayerNorm({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)
  const pMean = smoothstep(0.2, 0.45, p)
  const pVar = smoothstep(0.5, 0.75, p)
  const pGB = smoothstep(0.75, 0.95, p)

  const { raw } = useMemo(() => {
    const rng = mulberry32(314)
    const r = new Float32Array(DIM)
    let sum = 0
    for (let i = 0; i < DIM; i++) {
      r[i] = (rng() * 2 - 1) * 1.8 + 0.6
      sum += r[i]
    }
    return { raw: r, mean: sum / DIM }
  }, [])

  const cx = blockStart(0) + BLOCK_LEN * 0.1

  // Compute current bar heights as a function of phase
  const mean = raw.reduce((a, b) => a + b, 0) / DIM
  const variance = raw.reduce((a, b) => a + (b - mean) ** 2, 0) / DIM
  const std = Math.sqrt(variance + 1e-5)

  const bars = raw.map((v) => {
    // stage 1: raw → mean subtract
    const afterMean = v - mean * pMean
    // stage 2: divide by std
    const afterVar = afterMean / (1 + (std - 1) * pVar)
    // stage 3: γ=1.3, β=0.1
    const gamma = 1 + 0.3 * pGB
    const beta = 0.1 * pGB
    return afterVar * gamma + beta
  })

  const BAR_W = 0.08
  const startX = -(DIM * BAR_W) / 2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.9, 0]} size={0.18} opacity={0.9 * pEst}>
        Layer Norm
      </Label>

      {/* bars */}
      {bars.map((h, i) => (
        <mesh key={i} position={[startX + (i + 0.5) * BAR_W, h * 0.3, 0]}>
          <boxGeometry args={[BAR_W * 0.85, Math.max(0.05, Math.abs(h) * 0.6), 0.05]} />
          <meshBasicMaterial color={h >= 0 ? COLORS.blue : COLORS.red} transparent opacity={0.8 * pEst} />
        </mesh>
      ))}

      {/* zero line */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[DIM * BAR_W + 0.2, 0.01]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.5 * pEst} />
      </mesh>

      {/* mean line sliding in */}
      <mesh position={[0, mean * 0.3 * (1 - pMean), 0.002]}>
        <planeGeometry args={[DIM * BAR_W + 0.2, 0.008]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.8 * smoothstep(0.1, 0.3, p) * (1 - pMean * 0.5)} />
      </mesh>
      <Text position={[DIM * BAR_W / 2 + 0.25, mean * 0.3 * (1 - pMean), 0]} fontSize={0.08} color={COLORS.violet} fillOpacity={0.85 * smoothstep(0.1, 0.3, p)}>
        μ
      </Text>

      {/* variance ellipse (represented as thin horizontal band) */}
      <mesh position={[0, 0, 0.003]}>
        <planeGeometry args={[DIM * BAR_W + 0.2, std * 0.3 * 2 * (1 - pVar * 0.7)]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.15 * smoothstep(0.45, 0.6, p)} />
      </mesh>
      <Text position={[DIM * BAR_W / 2 + 0.25, -0.55, 0]} fontSize={0.08} color={COLORS.violet} fillOpacity={0.85 * smoothstep(0.45, 0.6, p)}>
        σ
      </Text>

      {/* γ β cubes dropping in */}
      <group position={[0, 0.7 + (1 - smoothstep(0.7, 0.85, p)) * 0.6, 0]}>
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color={COLORS.mint} transparent opacity={0.9 * pGB} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color={COLORS.gold} transparent opacity={0.9 * pGB} />
        </mesh>
        <Text position={[-0.15, -0.15, 0]} fontSize={0.08} color={COLORS.mint} fillOpacity={0.9 * pGB}>γ</Text>
        <Text position={[0.15, -0.15, 0]} fontSize={0.08} color={COLORS.gold} fillOpacity={0.9 * pGB}>β</Text>
      </group>

      <Slab position={[0, 0, -0.05]} width={DIM * BAR_W + 0.8} height={2.1} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
```

- [ ] **Step 2: Register in dispatcher**

In `index.tsx`:
```tsx
import SceneLayerNorm from './sceneA_LayerNorm'
// inside SCENE_MAP:
  layernorm: SceneLayerNorm,
```

- [ ] **Step 3: Type-check, visually verify scene 5, commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/sceneA_LayerNorm.tsx components/movie/modelmap/index.tsx
git commit -m "scene: layernorm (bars normalize around mean/variance)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: sceneA_Qkv.tsx

One vector → three projection walls → three sibling vectors (Q blue, K red, V mint) emerge.

**Files:**
- Create: `components/movie/modelmap/sceneA_Qkv.tsx`
- Modify: `components/movie/modelmap/index.tsx` (register)

- [ ] **Step 1: Write sceneA_Qkv.tsx**

```tsx
'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const DIM = 20
const BAR_W = 0.08

function inputBar(color: string, opacity: number) {
  return (
    <group>
      {Array.from({ length: DIM }).map((_, i) => (
        <mesh key={i} position={[-(DIM * BAR_W) / 2 + (i + 0.5) * BAR_W, 0, 0]}>
          <boxGeometry args={[BAR_W * 0.85, 0.35, 0.05]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}

export default function SceneQkv({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pProject = smoothstep(0.25, 0.7, p)
  const pBranch = smoothstep(0.6, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0]} size={0.18} opacity={0.9 * pEst}>
        Q · K · V
      </Label>

      {/* Input vector entering from left */}
      <group position={[-1.4 + 0.3 * pProject, 0, 0]}>
        {inputBar(COLORS.fg, 0.8 * pEst)}
      </group>

      {/* Three projection walls */}
      {[
        { color: COLORS.blue, y: 0.7, label: 'Q' },
        { color: COLORS.red, y: 0.0, label: 'K' },
        { color: COLORS.mint, y: -0.7, label: 'V' },
      ].map((spec, i) => (
        <group key={i}>
          {/* projection wall */}
          <mesh position={[0.2, spec.y, 0]}>
            <boxGeometry args={[0.06, 0.55, 0.35]} />
            <meshBasicMaterial color={spec.color} transparent opacity={0.3 + 0.4 * pProject} />
          </mesh>
          <Label position={[0.2, spec.y + 0.45, 0]} size={0.11} color={spec.color} opacity={0.9 * pProject}>
            {'W_' + spec.label}
          </Label>

          {/* sibling output */}
          <group position={[0.9 + 0.5 * pBranch, spec.y, 0]}>
            {inputBar(spec.color, 0.85 * pBranch)}
          </group>
          <Label position={[1.9, spec.y + 0.3, 0]} size={0.18} color={spec.color} opacity={0.95 * pBranch}>
            {spec.label}
          </Label>
        </group>
      ))}

      <Slab position={[0.3, 0, -0.05]} width={3.4} height={2.1} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.14} />
    </group>
  )
}
```

- [ ] **Step 2: Register, type-check, visual verify scene 6, commit**

Register `qkv: SceneQkv,` in SCENE_MAP; import at top.

```bash
npx tsc --noEmit
git add components/movie/modelmap/sceneA_Qkv.tsx components/movie/modelmap/index.tsx
git commit -m "scene: qkv (one vector splits into Q/K/V through projection walls)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: sceneA_Multi.tsx

Six parallel attention heads at slight z-offsets → concatenate into one wide output → compress back.

**Files:**
- Create: `components/movie/modelmap/sceneA_Multi.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Multi.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const HEADS = 6
const T = 5  // smaller grid per head for density
const CELL = 0.1

function HeadGrid({
  zOffset, tint, seed, opacity,
}: { zOffset: number; tint: string; seed: number; opacity: number }) {
  const cells = useMemo(() => {
    const rng = mulberry32(seed)
    return Array.from({ length: T * T }).map(() => rng())
  }, [seed])

  const gridW = T * CELL
  return (
    <group position={[0, 0, zOffset]}>
      {cells.map((v, i) => {
        const r = Math.floor(i / T)
        const c = i % T
        if (c > r) return null
        const x = -gridW / 2 + (c + 0.5) * CELL
        const y = gridW / 2 - (r + 0.5) * CELL
        return (
          <mesh key={i} position={[x, y, 0]}>
            <planeGeometry args={[CELL * 0.9, CELL * 0.9]} />
            <meshBasicMaterial color={tint} transparent opacity={v * opacity} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function SceneMulti({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pHeads = smoothstep(0.1, 0.55, p)
  const pConcat = smoothstep(0.55, 0.85, p)
  const pProj = smoothstep(0.85, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.35
  const tints = [COLORS.blue, COLORS.violet, COLORS.mint, COLORS.gold, COLORS.red, '#f472b6']

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.85, 0.2]} size={0.18} opacity={0.9 * pHeads}>
        Multi-Head Attention · 6 heads
      </Label>

      {/* 6 parallel head grids at descending z */}
      {Array.from({ length: HEADS }).map((_, h) => (
        <HeadGrid
          key={h}
          zOffset={-h * 0.12}
          tint={tints[h]}
          seed={h * 97 + 1}
          opacity={0.8 * pHeads * (1 - (h / HEADS) * 0.5)}
        />
      ))}

      {/* concat arrow → wide output strip */}
      <group position={[0.9, 0, 0]}>
        {Array.from({ length: HEADS }).map((_, h) => (
          <mesh key={h} position={[h * 0.06 - 0.18, 0, 0]}>
            <boxGeometry args={[0.05, 0.4, 0.03]} />
            <meshBasicMaterial color={tints[h]} transparent opacity={0.9 * pConcat} />
          </mesh>
        ))}
        <Label position={[0, 0.35, 0]} size={0.09} opacity={0.85 * pConcat}>
          concat
        </Label>
      </group>

      {/* output projection → compressed single-vector result */}
      <group position={[1.7, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.4, 0.03]} />
          <meshBasicMaterial color={COLORS.fg} transparent opacity={0.9 * pProj} />
        </mesh>
        <Label position={[0, 0.35, 0]} size={0.09} opacity={0.85 * pProj}>
          W_O
        </Label>
      </group>

      <Slab position={[0.6, 0, -0.1]} width={2.8} height={1.6} opacity={0.04 + 0.05 * pHeads} showCornerTicks tickLength={0.12} />
    </group>
  )
}
```

- [ ] **Step 2: Register, type-check, verify scene 8, commit**

```bash
npx tsc --noEmit
git add components/movie/modelmap/sceneA_Multi.tsx components/movie/modelmap/index.tsx
git commit -m "scene: multi-head attention (6 parallel heads, concat, project)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: sceneA_Ffn.tsx

Fan-out wall → wide hidden layer with dense mesh → GELU curve glyph → fan-in wall.

**Files:**
- Create: `components/movie/modelmap/sceneA_Ffn.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Ffn.tsx**

```tsx
'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { DenseMesh } from './shared/DenseMesh'
import { Label } from './shared/Label'

export default function SceneFfn({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.18, p)
  const pExpand = smoothstep(0.2, 0.55, p)
  const pActivate = smoothstep(0.55, 0.8, p)
  const pCompress = smoothstep(0.8, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.75

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.9, 0.2]} size={0.2} opacity={0.9 * pEst}>
        Multilayer Perceptron
      </Label>

      {/* Input vector (narrow) */}
      <group position={[-1.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.4, 0.04]} />
          <meshBasicMaterial color={COLORS.fg} transparent opacity={0.85 * pEst} />
        </mesh>
        <Label position={[0, 0.3, 0]} size={0.08} opacity={0.8 * pEst}>d</Label>
      </group>

      {/* Fan-out wall */}
      <mesh position={[-0.9, 0, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.6]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.4 * pExpand} />
      </mesh>

      {/* Wide hidden layer with dense mesh */}
      <group position={[0, 0, 0]}>
        <Slab
          width={1.2}
          height={0.9}
          color={COLORS.slabTint}
          opacity={0.08 * pActivate}
          showCornerTicks
          tickLength={0.1}
        />
        <DenseMesh
          extent={[0.55, 0.4, 0.25]}
          nodeCount={80}
          connectionCount={180}
          seed={42}
          opacity={0.5 * pActivate}
        />
        <Label position={[0, 0.55, 0]} size={0.09} color={COLORS.dim} opacity={0.85 * pActivate}>
          4d (expanded)
        </Label>
      </group>

      {/* GELU curve glyph floating above */}
      <group position={[0, 1.05, 0]}>
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i / 19) * 0.8 - 0.4
          // simplified GELU approximation
          const y = 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)))
          return (
            <mesh key={i} position={[x, y * 0.3 + 0.1, 0]}>
              <sphereGeometry args={[0.015]} />
              <meshBasicMaterial color={COLORS.gold} transparent opacity={0.85 * pActivate} />
            </mesh>
          )
        })}
        <Label position={[0.5, 0.15, 0]} size={0.07} color={COLORS.gold} opacity={0.85 * pActivate}>GELU</Label>
      </group>

      {/* Fan-in wall */}
      <mesh position={[0.9, 0, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.6]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.4 * pCompress} />
      </mesh>

      {/* Output vector (narrow) */}
      <group position={[1.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.4, 0.04]} />
          <meshBasicMaterial color={COLORS.fg} transparent opacity={0.85 * pCompress} />
        </mesh>
        <Label position={[0, 0.3, 0]} size={0.08} opacity={0.8 * pCompress}>d</Label>
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Register, type-check, verify scene 9, commit**

```bash
git add components/movie/modelmap/sceneA_Ffn.tsx components/movie/modelmap/index.tsx
git commit -m "scene: ffn (expand → GELU → compress with dense mesh)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: sceneA_FfnFeature.tsx

Recursive zoom: opens with FFN mesh from scene 17, then dives into a few lit hidden neurons with example labels.

**Files:**
- Create: `components/movie/modelmap/sceneA_FfnFeature.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_FfnFeature.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep, pingPong } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const NEURONS = 48
const EXAMPLES = [
  { label: 'Golden Gate tokens', color: COLORS.gold },
  { label: 'code tokens', color: COLORS.mint },
  { label: 'French words', color: COLORS.violet },
]

export default function SceneFfnFeature({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)

  const neurons = useMemo(() => {
    const rng = mulberry32(2025)
    return Array.from({ length: NEURONS }).map((_, i) => ({
      x: (rng() * 2 - 1) * 0.8,
      y: (rng() * 2 - 1) * 0.45,
      z: (rng() * 2 - 1) * 0.25,
      exampleIndex: Math.floor(rng() * EXAMPLES.length),
    }))
  }, [])

  // which example is "active" right now (cycles through over scene)
  const cyclePhase = (p * EXAMPLES.length) % 1
  const activeExample = Math.floor(p * EXAMPLES.length) % EXAMPLES.length
  const pulse = 0.6 + 0.4 * pingPong(cyclePhase * 2, 1)

  const cx = blockStart(0) + BLOCK_LEN * 0.75
  const example = EXAMPLES[activeExample]

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.9, 0.2]} size={0.18} opacity={0.9 * pEst}>
        Hidden neurons fire selectively
      </Label>

      {/* Neurons */}
      {neurons.map((n, i) => {
        const isActive = n.exampleIndex === activeExample
        const brightness = isActive ? pulse : 0.18
        const color = isActive ? example.color : COLORS.dim
        return (
          <mesh key={i} position={[n.x, n.y, n.z]}>
            <sphereGeometry args={[isActive ? 0.04 : 0.025, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={brightness} />
          </mesh>
        )
      })}

      {/* Active example label */}
      <Label position={[0, -0.7, 0]} size={0.13} color={example.color} opacity={0.9 * pEst}>
        {'detects: ' + example.label}
      </Label>

      <Slab width={2.2} height={1.5} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'ffn-feature'`, type-check, verify scene 10, commit**

```bash
git add components/movie/modelmap/sceneA_FfnFeature.tsx components/movie/modelmap/index.tsx
git commit -m "scene: ffn-feature (hidden neurons fire selectively per feature)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 19: sceneA_Gelu.tsx

Three side-by-side activation curves with test points flowing through.

**Files:**
- Create: `components/movie/modelmap/sceneA_Gelu.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Gelu.tsx**

```tsx
'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep, loopPhase } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

type Fn = (x: number) => number
const relu: Fn = (x) => Math.max(0, x)
const gelu: Fn = (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)))
const swish: Fn = (x) => x / (1 + Math.exp(-x))

const CURVES = [
  { name: 'ReLU', fn: relu, color: COLORS.blue, x: -1.6 },
  { name: 'GELU', fn: gelu, color: COLORS.gold, x: 0 },
  { name: 'Swish', fn: swish, color: COLORS.mint, x: 1.6 },
]

function Curve({ spec, phase, t }: { spec: typeof CURVES[number]; phase: number; t: number }) {
  const samples = 40
  const pts: [number, number, number][] = Array.from({ length: samples }).map((_, i) => {
    const x = (i / (samples - 1)) * 2 - 1
    return [x * 0.45, spec.fn(x * 2) * 0.2, 0]
  })

  // Moving test point
  const xs = loopPhase(t, 2.5) * 2 - 1
  const yt = spec.fn(xs * 2) * 0.2

  return (
    <group position={[spec.x, 0, 0]}>
      {/* axes */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1, 0.008]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4 * phase} />
      </mesh>
      <mesh position={[0, 0.2, -0.01]}>
        <planeGeometry args={[0.008, 1]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4 * phase} />
      </mesh>

      {/* curve sample dots */}
      {pts.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.85 * phase} />
        </mesh>
      ))}

      {/* moving test point */}
      <mesh position={[xs * 0.45, yt, 0.02]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.95 * phase} />
      </mesh>

      <Label position={[0, 0.6, 0]} size={0.12} color={spec.color} opacity={0.9 * phase}>
        {spec.name}
      </Label>
    </group>
  )
}

export default function SceneGelu({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.75

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.18} opacity={0.9 * pEst}>
        Activation choices
      </Label>
      {CURVES.map((spec) => (
        <Curve key={spec.name} spec={spec} phase={pEst} t={t} />
      ))}
      <Slab width={4.0} height={1.7} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.14} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'gelu'`, type-check, verify scene 11, commit**

```bash
git add components/movie/modelmap/sceneA_Gelu.tsx components/movie/modelmap/index.tsx
git commit -m "scene: gelu (ReLU / GELU / Swish side-by-side with moving probes)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4: Act I — Input (Tasks 20–23)

### Task 20: sceneA_Tokens.tsx

Italic sentence above the stack → characters fall as cubes into a token shelf slab → violet ID numerals stamp on each.

**Files:**
- Create: `components/movie/modelmap/sceneA_Tokens.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Tokens.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { usePrompt } from '../promptContext'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

export default function SceneTokens({ t, duration }: SceneProps) {
  const { prompt } = usePrompt()
  const chars = useMemo(() => prompt.split('').slice(0, 12), [prompt])
  const p = clamp01(t / Math.max(0.01, duration))
  const pType = smoothstep(0, 0.3, p)
  const pDrop = smoothstep(0.35, 0.7, p)
  const pId = smoothstep(0.7, 1.0, p)

  const CUBE = 0.12
  const spacing = 0.17
  const startX = INPUT_LEN / 2 - ((chars.length - 1) * spacing) / 2

  return (
    <group>
      {/* Typed italic sentence floating above */}
      <Label position={[INPUT_LEN / 2, 1.6, 0.3]} size={0.24} opacity={0.9 * pType}>
        {prompt}
      </Label>

      {/* Token shelf slab */}
      <Slab
        position={[INPUT_LEN / 2, 0.8, 0]}
        width={chars.length * spacing + 0.4}
        height={0.6}
        color={COLORS.slabTint}
        opacity={0.1}
        showCornerTicks
        tickLength={0.12}
      />

      {/* Character cubes */}
      {chars.map((ch, i) => {
        const xPos = startX + i * spacing
        const dropOffset = (1 - pDrop) * 1.2
        return (
          <group key={i}>
            {/* cube */}
            <mesh position={[xPos, 0.8 + dropOffset, 0]}>
              <boxGeometry args={[CUBE, CUBE, CUBE]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.8 * pDrop} />
            </mesh>
            <Text
              position={[xPos, 0.8 + dropOffset, CUBE / 2 + 0.005]}
              fontSize={0.07}
              color={COLORS.fg}
              fillOpacity={0.95 * pDrop}
              anchorX="center"
              anchorY="middle"
            >
              {ch === ' ' ? '·' : ch}
            </Text>

            {/* Violet ID below */}
            <Text
              position={[xPos, 0.55, 0.05]}
              fontSize={0.06}
              color={COLORS.violet}
              fillOpacity={0.9 * pId}
              anchorX="center"
              anchorY="middle"
            >
              {(ch.charCodeAt(0) % 64).toString().padStart(2, '0')}
            </Text>

            {/* drop-pin line to position index */}
            <mesh position={[xPos, 0.4, 0]}>
              <planeGeometry args={[0.004, 0.12]} />
              <meshBasicMaterial color={COLORS.violet} transparent opacity={0.5 * pId} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Register as `'tokens'`, type-check, verify scene 1, commit**

```bash
git add components/movie/modelmap/sceneA_Tokens.tsx components/movie/modelmap/index.tsx
git commit -m "scene: tokens (chars drop into shelf, violet IDs stamp)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 21: sceneA_Bpe.tsx

Raw byte pairs fuse into bigrams, then trigrams over 3 phases.

**Files:**
- Create: `components/movie/modelmap/sceneA_Bpe.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Bpe.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const PHASES = [
  { label: 'bytes', tokens: ['t','h','e',' ','c','a','t'] },
  { label: 'bigrams', tokens: ['th','e',' ','ca','t'] },
  { label: 'trigrams', tokens: ['the',' ','cat'] },
]

export default function SceneBpe({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)
  const phaseIdx = Math.min(PHASES.length - 1, Math.floor(p * PHASES.length))
  const phase = PHASES[phaseIdx]
  const phaseLocal = (p * PHASES.length) % 1
  const pFuse = smoothstep(0.0, 0.6, phaseLocal)

  const CUBE = 0.12
  const spacing = 0.2
  const tokens = phase.tokens
  const startX = INPUT_LEN / 2 - ((tokens.length - 1) * spacing) / 2

  return (
    <group>
      <Label position={[INPUT_LEN / 2, 1.7, 0.3]} size={0.2} opacity={0.9 * pEst}>
        BPE merges
      </Label>
      <Label position={[INPUT_LEN / 2, 1.35, 0.3]} size={0.12} color={COLORS.violet} opacity={0.85 * pEst}>
        {'phase ' + (phaseIdx + 1) + ' · ' + phase.label}
      </Label>

      <Slab
        position={[INPUT_LEN / 2, 0.8, 0]}
        width={tokens.length * spacing + 0.4}
        height={0.6}
        color={COLORS.slabTint}
        opacity={0.1}
        showCornerTicks
        tickLength={0.12}
      />

      {tokens.map((tok, i) => {
        const xPos = startX + i * spacing
        return (
          <group key={`${phaseIdx}-${i}`}>
            <mesh position={[xPos, 0.8, 0]} scale={[1, 1, 1 + pFuse * 0.6]}>
              <boxGeometry args={[CUBE * (1 + tok.length * 0.06), CUBE, CUBE]} />
              <meshBasicMaterial color={COLORS.violet} transparent opacity={0.7 * pFuse} />
            </mesh>
            <Text
              position={[xPos, 0.8, CUBE / 2 + 0.006]}
              fontSize={0.07}
              color={COLORS.fg}
              fillOpacity={0.95 * pFuse}
              anchorX="center"
              anchorY="middle"
            >
              {tok === ' ' ? '·' : tok}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Register as `'bpe'`, type-check, verify scene 2, commit**

```bash
git add components/movie/modelmap/sceneA_Bpe.tsx components/movie/modelmap/index.tsx
git commit -m "scene: bpe (bytes → bigrams → trigrams fuse)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 22: sceneA_Embed.tsx

ID cube drops into a tall V×d wall; matching row illuminates and flies out as a horizontal vector strip.

**Files:**
- Create: `components/movie/modelmap/sceneA_Embed.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Embed.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep, loopPhase } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const V = 16
const D = 20

export default function SceneEmbed({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)

  const { matrix } = useMemo(() => {
    const rng = mulberry32(101)
    const m = new Float32Array(V * D)
    for (let i = 0; i < V * D; i++) m[i] = rng() * 2 - 1
    return { matrix: m }
  }, [])

  // Cycle through different rows
  const cyclePeriod = 2.5
  const rowIdx = Math.floor(loopPhase(t, cyclePeriod * V) * V) % V
  const cycleLocal = loopPhase(t, cyclePeriod)
  const pDrop = smoothstep(0.0, 0.35, cycleLocal)
  const pLight = smoothstep(0.3, 0.55, cycleLocal)
  const pFly = smoothstep(0.55, 0.9, cycleLocal)

  // Render the matrix as instanced cells
  const CELL = 0.07
  const matW = D * CELL
  const matH = V * CELL

  const matrixCells = useMemo(() => {
    const cells = new Float32Array(V * D)
    for (let i = 0; i < V * D; i++) cells[i] = matrix[i]
    return cells
  }, [matrix])

  const cx = INPUT_LEN / 2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, matH / 2 + 0.5, 0.2]} size={0.18} opacity={0.9 * pEst}>
        Embedding lookup
      </Label>
      <Label position={[-matW / 2 - 0.3, matH / 2 + 0.25, 0]} size={0.08} color={COLORS.dim} opacity={0.8 * pEst}>
        V × d
      </Label>

      {/* Embedding matrix wall */}
      <Slab
        position={[0, 0, 0]}
        width={matW}
        height={matH}
        cells={{ cols: D, rows: V, values: matrixCells }}
        opacity={0.25}
        showCornerTicks
        tickLength={0.1}
      />

      {/* ID cube dropping in */}
      <mesh position={[-matW / 2 - 0.4, matH / 2 - (rowIdx + 0.5) * CELL + (1 - pDrop) * 0.6, 0.1]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.9 * pDrop} />
      </mesh>

      {/* Row highlight */}
      <mesh position={[0, matH / 2 - (rowIdx + 0.5) * CELL, 0.03]}>
        <planeGeometry args={[matW + 0.04, CELL + 0.02]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.25 * pLight} />
      </mesh>

      {/* Extracted vector flying right */}
      <group position={[matW / 2 + 0.3 + 1.0 * pFly, matH / 2 - (rowIdx + 0.5) * CELL, 0.06]}>
        {Array.from({ length: D }).map((_, c) => {
          const v = matrix[rowIdx * D + c]
          const color = v >= 0 ? COLORS.blue : COLORS.red
          return (
            <mesh key={c} position={[(c - D / 2 + 0.5) * CELL, 0, 0]}>
              <boxGeometry args={[CELL * 0.9, CELL * 0.9, 0.04]} />
              <meshBasicMaterial color={color} transparent opacity={0.85 * pFly} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'embed'`, type-check, verify scene 3, commit**

```bash
git add components/movie/modelmap/sceneA_Embed.tsx components/movie/modelmap/index.tsx
git commit -m "scene: embed (ID cube → row highlight → vector flies out)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 23: sceneA_Positional.tsx

Token embedding grid + sinusoidal positional grid add cell-by-cell.

**Files:**
- Create: `components/movie/modelmap/sceneA_Positional.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Positional.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, INPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const T = 7
const D = 20

export default function ScenePositional({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pSin = smoothstep(0.25, 0.55, p)
  const pMerge = smoothstep(0.6, 1.0, p)

  const tokenCells = useMemo(() => {
    const rng = mulberry32(333)
    const v = new Float32Array(T * D)
    for (let i = 0; i < T * D; i++) v[i] = rng() * 2 - 1
    return v
  }, [])

  const sinCells = useMemo(() => {
    const v = new Float32Array(T * D)
    for (let r = 0; r < T; r++) {
      for (let c = 0; c < D; c++) {
        const freq = Math.pow(10000, -(2 * Math.floor(c / 2)) / D)
        const val = c % 2 === 0 ? Math.sin(r * freq) : Math.cos(r * freq)
        v[r * D + c] = val
      }
    }
    return v
  }, [])

  const mergedCells = useMemo(() => {
    const v = new Float32Array(T * D)
    for (let i = 0; i < T * D; i++) v[i] = (tokenCells[i] + sinCells[i]) * 0.5
    return v
  }, [tokenCells, sinCells])

  const CELL = 0.08
  const gridW = D * CELL
  const gridH = T * CELL

  const cx = INPUT_LEN / 2 + 0.2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, gridH + 0.6, 0.2]} size={0.18} opacity={0.9 * pEst}>
        Positional encoding
      </Label>

      {/* Token embedding grid (top) */}
      <Slab
        position={[0, gridH / 2 + 0.2 - pMerge * gridH * 0.5, 0]}
        width={gridW}
        height={gridH}
        cells={{ cols: D, rows: T, values: tokenCells }}
        opacity={0.2 * (1 - pMerge * 0.5)}
        showCornerTicks
        tickLength={0.08}
      />
      <Label position={[-gridW / 2 - 0.3, gridH / 2 + 0.2 - pMerge * gridH * 0.5, 0]} size={0.07} color={COLORS.blue} opacity={0.9 * pEst}>
        embed
      </Label>

      {/* Sinusoidal grid (bottom) */}
      <Slab
        position={[0, -gridH / 2 - 0.2 + pMerge * gridH * 0.5, 0]}
        width={gridW}
        height={gridH}
        cells={{ cols: D, rows: T, values: sinCells }}
        opacity={0.2 * pSin * (1 - pMerge * 0.5)}
        showCornerTicks
        tickLength={0.08}
      />
      <Label position={[-gridW / 2 - 0.3, -gridH / 2 - 0.2 + pMerge * gridH * 0.5, 0]} size={0.07} color={COLORS.violet} opacity={0.9 * pSin}>
        sin/cos
      </Label>

      {/* Merged result (appears as the two grids collapse together) */}
      {pMerge > 0.4 && (
        <Slab
          position={[0, 0, 0.04]}
          width={gridW}
          height={gridH}
          cells={{ cols: D, rows: T, values: mergedCells }}
          opacity={0.3 * smoothstep(0.4, 1.0, pMerge)}
          showCornerTicks
          tickLength={0.08}
        />
      )}
    </group>
  )
}
```

- [ ] **Step 2: Register as `'positional'`, type-check, verify scene 4, commit**

```bash
git add components/movie/modelmap/sceneA_Positional.tsx components/movie/modelmap/index.tsx
git commit -m "scene: positional (sinusoidal grid adds to embedding grid)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5: Act III — Scale (Tasks 24–26)

### Task 24: sceneA_Stack.tsx

Pullback shot showing all 6 blocks firing in sequence with a residual skip wire.

**Files:**
- Create: `components/movie/modelmap/sceneA_Stack.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Stack.tsx**

```tsx
'use client'

import type { SceneProps } from './shared/types'
import { COLORS, N_BLOCKS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

export default function SceneStack({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.1, p)

  // Travelling pulse — which block is "active" right now
  const pulse = p * N_BLOCKS
  const activeIdx = Math.min(N_BLOCKS - 1, Math.floor(pulse))
  const local = pulse - activeIdx

  return (
    <group>
      <Label position={[3.0, 1.5, 0.3]} size={0.2} opacity={0.9 * pEst}>
        Six blocks · one direction
      </Label>

      {/* Travelling packet */}
      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        const cx = blockStart(i) + BLOCK_LEN / 2
        const isActive = i === activeIdx
        const brightness = isActive ? 0.95 : 0.2
        return (
          <group key={i} position={[cx, 0, 0]}>
            {/* block highlight */}
            <mesh>
              <boxGeometry args={[BLOCK_LEN * 0.9, 0.8, 0.5]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.05 + 0.15 * brightness} />
            </mesh>

            {/* the packet when active */}
            {isActive && (
              <mesh position={[(local - 0.5) * BLOCK_LEN * 0.9, 0, 0.3]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color={COLORS.gold} transparent opacity={0.95} />
              </mesh>
            )}

            <Label position={[0, -0.7, 0]} size={0.08} color={isActive ? COLORS.fg : COLORS.dim} opacity={0.9}>
              {'block ' + i}
            </Label>
          </group>
        )
      })}

      {/* Residual skip wire (top arch) */}
      <mesh position={[(blockStart(0) + blockStart(N_BLOCKS - 1) + BLOCK_LEN) / 2, 0.8, 0.25]}>
        <planeGeometry args={[blockStart(N_BLOCKS - 1) + BLOCK_LEN - blockStart(0), 0.01]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.5} />
      </mesh>
      <Label position={[(blockStart(0) + blockStart(N_BLOCKS - 1) + BLOCK_LEN) / 2, 0.95, 0.25]} size={0.07} color={COLORS.mint} opacity={0.8}>
        residual
      </Label>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'stack'`, type-check, verify scene 12, commit**

```bash
git add components/movie/modelmap/sceneA_Stack.tsx components/movie/modelmap/index.tsx
git commit -m "scene: stack (6-block packet traverses stack with residual wire)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 25: sceneA_Sample.tsx

Final block vector → unembedding wall → vocab logits → softmax → gold top bar glows.

**Files:**
- Create: `components/movie/modelmap/sceneA_Sample.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Sample.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, TOTAL_X, OUTPUT_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const VOCAB = 14

export default function SceneSample({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)
  const pLogit = smoothstep(0.2, 0.55, p)
  const pSoft = smoothstep(0.55, 0.8, p)
  const pPick = smoothstep(0.8, 1.0, p)

  const { raw, soft, pickIdx } = useMemo(() => {
    const rng = mulberry32(12)
    const r = new Float32Array(VOCAB)
    for (let i = 0; i < VOCAB; i++) r[i] = (rng() * 2 - 1) * 3
    const max = Math.max(...r)
    const exps = Array.from(r).map((v) => Math.exp(v - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    const s = exps.map((v) => v / sum)
    const pick = s.indexOf(Math.max(...s))
    return { raw: r, soft: s, pickIdx: pick }
  }, [])

  const cx = TOTAL_X - OUTPUT_LEN / 2

  const BAR_H = 0.08
  const BAR_W_MAX = 0.8

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.18} opacity={0.9 * pEst}>
        Sample next token
      </Label>

      {/* Unembedding wall hint */}
      <mesh position={[-0.7, 0, 0]}>
        <boxGeometry args={[0.06, 1.3, 0.4]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.4 * pLogit} />
      </mesh>
      <Label position={[-0.7, 0.75, 0]} size={0.08} color={COLORS.gold} opacity={0.85 * pLogit}>W_out</Label>

      {/* Logit bars */}
      {Array.from({ length: VOCAB }).map((_, i) => {
        const rawNorm = raw[i] / 3  // -1..1
        const softNorm = soft[i]
        const barLen = BAR_W_MAX * ((1 - pSoft) * (0.4 + rawNorm * 0.3) + pSoft * softNorm * 3)
        const y = (VOCAB / 2 - i - 0.5) * BAR_H
        const isPick = i === pickIdx
        const color = isPick && pPick > 0.3 ? COLORS.gold : COLORS.fg
        return (
          <group key={i}>
            <mesh position={[-0.1 + barLen / 2, y, 0.05]}>
              <planeGeometry args={[barLen, BAR_H * 0.7]} />
              <meshBasicMaterial color={color} transparent opacity={0.7 + 0.25 * (isPick ? pPick : 0)} />
            </mesh>
            <Text position={[-0.25, y, 0]} fontSize={0.05} color={COLORS.dim} fillOpacity={0.7 * pLogit} anchorX="right">
              {'v' + i}
            </Text>
          </group>
        )
      })}

      {/* Selection callout */}
      {pPick > 0 && (
        <Label position={[0.4, (VOCAB / 2 - pickIdx - 0.5) * BAR_H + 0.18, 0]} size={0.1} color={COLORS.gold} opacity={0.95 * pPick}>
          ← sampled
        </Label>
      )}

      <Slab position={[0.1, 0, -0.05]} width={1.7} height={VOCAB * BAR_H + 0.4} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.08} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'sample'`, type-check, verify scene 13, commit**

```bash
git add components/movie/modelmap/sceneA_Sample.tsx components/movie/modelmap/index.tsx
git commit -m "scene: sample (logits → softmax → gold pick)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 26: sceneA_KvCache.tsx

Q drops in each step; K and V archives extend with cached rows.

**Files:**
- Create: `components/movie/modelmap/sceneA_KvCache.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_KvCache.tsx**

```tsx
'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const MAX_T = 8

export default function SceneKvCache({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.1, p)
  const curT = Math.min(MAX_T, 1 + Math.floor(p * MAX_T))

  const cx = blockStart(0) + BLOCK_LEN * 0.35
  const CELL = 0.16

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 0.95, 0.2]} size={0.18} opacity={0.9 * pEst}>
        KV cache grows
      </Label>

      {/* Q — recomputed each step (single cell) */}
      <group position={[-1.1, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[CELL, CELL, 0.03]} />
          <meshBasicMaterial color={COLORS.blue} transparent opacity={0.9 * pEst} />
        </mesh>
        <Label position={[0, CELL + 0.08, 0]} size={0.09} color={COLORS.blue} opacity={0.9 * pEst}>
          Q (new)
        </Label>
        <Label position={[0, -CELL * 0.8, 0]} size={0.06} color={COLORS.dim} opacity={0.8 * pEst}>
          recomputed
        </Label>
      </group>

      {/* K archive — stack of cells (grows) */}
      <group position={[-0.4, 0, 0]}>
        {Array.from({ length: MAX_T }).map((_, i) => {
          const filled = i < curT
          return (
            <mesh key={i} position={[0, (MAX_T / 2 - i - 0.5) * CELL, 0]}>
              <boxGeometry args={[CELL, CELL * 0.9, 0.03]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={filled ? 0.8 : 0.1} />
            </mesh>
          )
        })}
        <Label position={[0, MAX_T / 2 * CELL + 0.15, 0]} size={0.09} color={COLORS.red} opacity={0.9 * pEst}>
          K archive
        </Label>
        <Label position={[0, -MAX_T / 2 * CELL - 0.15, 0]} size={0.06} color={COLORS.dim} opacity={0.8 * pEst}>
          stored once
        </Label>
      </group>

      {/* V archive */}
      <group position={[0.3, 0, 0]}>
        {Array.from({ length: MAX_T }).map((_, i) => {
          const filled = i < curT
          return (
            <mesh key={i} position={[0, (MAX_T / 2 - i - 0.5) * CELL, 0]}>
              <boxGeometry args={[CELL, CELL * 0.9, 0.03]} />
              <meshBasicMaterial color={COLORS.mint} transparent opacity={filled ? 0.8 : 0.1} />
            </mesh>
          )
        })}
        <Label position={[0, MAX_T / 2 * CELL + 0.15, 0]} size={0.09} color={COLORS.mint} opacity={0.9 * pEst}>
          V archive
        </Label>
      </group>

      <Label position={[1.1, 0, 0]} size={0.1} color={COLORS.gold} opacity={0.9 * pEst}>
        {'t = ' + curT}
      </Label>

      <Slab width={3.2} height={MAX_T * CELL + 0.6} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.12} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'kvcache'`, type-check, verify scene 14, commit**

```bash
git add components/movie/modelmap/sceneA_KvCache.tsx components/movie/modelmap/index.tsx
git commit -m "scene: kvcache (Q recomputes, K/V archives grow)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 6: Act IV — Training Mode B (Tasks 27–32)

### Task 27: sceneB_Loss.tsx

Prediction vs target histograms face off; cross-entropy value floats.

**Files:**
- Create: `components/movie/modelmap/sceneB_Loss.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_Loss.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const V = 12

export default function SceneLoss({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pCompare = smoothstep(0.3, 0.75, p)
  const pCE = smoothstep(0.75, 1.0, p)

  const { pred, target, targetIdx, ce } = useMemo(() => {
    const rng = mulberry32(555)
    const logits = Array.from({ length: V }).map(() => rng() * 3)
    const max = Math.max(...logits)
    const exps = logits.map((v) => Math.exp(v - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    const p = exps.map((v) => v / sum)
    const tIdx = 4
    const ceVal = -Math.log(p[tIdx] + 1e-9)
    return { pred: p, target: tIdx, targetIdx: tIdx, ce: ceVal }
  }, [])

  const BAR_W = 0.1
  const BAR_H_MAX = 0.8

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.3, 0.3]} size={0.2} opacity={0.9 * pEst}>
        Cross-entropy loss
      </Label>

      {/* Prediction histogram on left */}
      <group position={[-1.0, 0, 0]}>
        <Label position={[0, -V * BAR_W / 2 - 0.25, 0]} size={0.1} color={COLORS.blue} opacity={0.9 * pEst}>
          prediction
        </Label>
        {pred.map((v, i) => (
          <mesh key={i} position={[(i - V / 2 + 0.5) * BAR_W, v * BAR_H_MAX / 2, 0]}>
            <boxGeometry args={[BAR_W * 0.8, Math.max(0.02, v * BAR_H_MAX), 0.03]} />
            <meshBasicMaterial color={COLORS.blue} transparent opacity={0.75 * pEst} />
          </mesh>
        ))}
      </group>

      {/* Target histogram on right (one-hot spike) */}
      <group position={[1.0, 0, 0]}>
        <Label position={[0, -V * BAR_W / 2 - 0.25, 0]} size={0.1} color={COLORS.gold} opacity={0.9 * pEst}>
          target
        </Label>
        {Array.from({ length: V }).map((_, i) => {
          const isTarget = i === targetIdx
          return (
            <mesh key={i} position={[(i - V / 2 + 0.5) * BAR_W, isTarget ? BAR_H_MAX / 2 : 0.02, 0]}>
              <boxGeometry args={[BAR_W * 0.8, isTarget ? BAR_H_MAX : 0.04, 0.03]} />
              <meshBasicMaterial color={isTarget ? COLORS.gold : COLORS.dim} transparent opacity={0.85 * pEst} />
            </mesh>
          )
        })}
      </group>

      {/* Divergence arrows */}
      {pCompare > 0 && (
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.8 * pCompare, 0.006]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.7 * pCompare} />
        </mesh>
      )}

      {/* Cross-entropy number */}
      <Text
        position={[0, -1.1, 0.2]}
        fontSize={0.2}
        color={COLORS.red}
        fillOpacity={0.95 * pCE}
        anchorX="center"
        anchorY="middle"
      >
        {'H(p, q) = ' + ce.toFixed(2)}
      </Text>

      <Slab width={3.0} height={2.4} opacity={0.04 + 0.04 * pEst} showCornerTicks tickLength={0.15} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'loss'`, type-check, verify scene 15, commit**

```bash
git add components/movie/modelmap/sceneB_Loss.tsx components/movie/modelmap/index.tsx
git commit -m "scene: loss (prediction vs target histograms + CE)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 28: sceneB_LossSeq.tsx

Row of T (prediction-vs-target) pairs, each with a loss bar, summed on the right.

**Files:**
- Create: `components/movie/modelmap/sceneB_LossSeq.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_LossSeq.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const T = 7

export default function SceneLossSeq({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pBars = smoothstep(0.25, 0.7, p)
  const pSum = smoothstep(0.7, 1.0, p)

  const losses = useMemo(() => {
    const rng = mulberry32(4242)
    return Array.from({ length: T }).map(() => 0.3 + rng() * 2.4)
  }, [])
  const total = losses.reduce((a, b) => a + b, 0)

  const SPACING = 0.32

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.2, 0.3]} size={0.18} opacity={0.9 * pEst}>
        Loss · every position
      </Label>

      {losses.map((loss, i) => {
        const x = (i - T / 2 + 0.5) * SPACING
        return (
          <group key={i} position={[x, 0, 0]}>
            {/* tiny pred vs target pair */}
            <mesh position={[-0.06, 0, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.03]} />
              <meshBasicMaterial color={COLORS.blue} transparent opacity={0.75 * pEst} />
            </mesh>
            <mesh position={[0.06, 0, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.03]} />
              <meshBasicMaterial color={COLORS.gold} transparent opacity={0.75 * pEst} />
            </mesh>

            {/* loss bar */}
            <mesh position={[0, 0.3 + loss * 0.15 * pBars, 0]}>
              <boxGeometry args={[0.12, Math.max(0.02, loss * 0.3 * pBars), 0.03]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={0.85 * pBars} />
            </mesh>
            <Text position={[0, 0.35 + loss * 0.3 * pBars + 0.08, 0]} fontSize={0.06} color={COLORS.red} fillOpacity={0.85 * pBars}>
              {loss.toFixed(2)}
            </Text>
          </group>
        )
      })}

      {/* Sum on right */}
      <group position={[T / 2 * SPACING + 0.35, 0.3, 0]}>
        <mesh position={[0, total * 0.05 * pSum, 0]}>
          <boxGeometry args={[0.2, Math.max(0.05, total * 0.1 * pSum), 0.04]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.9 * pSum} />
        </mesh>
        <Text position={[0, total * 0.1 * pSum + 0.1, 0]} fontSize={0.09} color={COLORS.red} fillOpacity={0.95 * pSum}>
          {'Σ = ' + total.toFixed(2)}
        </Text>
      </group>

      <Slab width={3.2} height={2.0} opacity={0.04 + 0.04 * pEst} showCornerTicks tickLength={0.15} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'loss-seq'`, type-check, verify scene 16, commit**

```bash
git add components/movie/modelmap/sceneB_LossSeq.tsx components/movie/modelmap/index.tsx
git commit -m "scene: loss-seq (per-position loss bars sum)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 29: sceneB_LossBatch.tsx

3D batch cube (B × T × 1 loss), collapses into a single scalar.

**Files:**
- Create: `components/movie/modelmap/sceneB_LossBatch.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_LossBatch.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const B = 6
const T = 6

export default function SceneLossBatch({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pCollapse = smoothstep(0.65, 1.0, p)

  const cells = useMemo(() => {
    const rng = mulberry32(7777)
    const v = new Float32Array(B * T)
    for (let i = 0; i < B * T; i++) v[i] = 0.3 + rng() * 2.4
    return v
  }, [])
  const mean = Array.from(cells).reduce((a, b) => a + b, 0) / (B * T)

  const SIZE = 0.14
  const pullIn = pCollapse

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.4, 0.3]} size={0.18} opacity={0.9 * pEst}>
        Loss · batch
      </Label>

      {/* Batch cube */}
      {Array.from({ length: B }).map((_, b) =>
        Array.from({ length: T }).map((_, tCol) => {
          const v = cells[b * T + tCol]
          const xPos = (tCol - T / 2 + 0.5) * SIZE * (1 - pullIn)
          const yPos = (b - B / 2 + 0.5) * SIZE * (1 - pullIn)
          const zPos = 0 + (b * 0.05 - B * 0.025) * (1 - pullIn)
          return (
            <mesh key={`${b}-${tCol}`} position={[xPos, yPos, zPos]}>
              <boxGeometry args={[SIZE * 0.8, SIZE * 0.8, 0.04]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={(0.4 + v * 0.25) * pEst} />
            </mesh>
          )
        })
      )}

      {/* Mean scalar */}
      <Text position={[0, -1.0, 0.2]} fontSize={0.2} color={COLORS.red} fillOpacity={0.95 * pCollapse}>
        {'mean = ' + mean.toFixed(3)}
      </Text>
      <Label position={[0, 0.9, 0]} size={0.08} color={COLORS.dim} opacity={0.85 * pEst}>
        {'B × T = ' + (B * T) + ' scalar losses'}
      </Label>

      <Slab width={2.6} height={2.3} opacity={0.04 + 0.04 * pEst} showCornerTicks tickLength={0.14} />
    </group>
  )
}
```

- [ ] **Step 2: Register as `'loss-batch'`, type-check, verify scene 17, commit**

```bash
git add components/movie/modelmap/sceneB_LossBatch.tsx components/movie/modelmap/index.tsx
git commit -m "scene: loss-batch (B×T cube averages to single scalar)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 30: sceneB_Training.tsx

3D loss landscape with a ball rolling downhill.

**Files:**
- Create: `components/movie/modelmap/sceneB_Training.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_Training.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, easeInOut } from './shared/easing'
import { Label } from './shared/Label'

const GRID = 30
const EXTENT = 2.0

function f(x: number, y: number): number {
  // two valleys + a ridge, valley at roughly (0.5, 0)
  return 0.4 * Math.sin(x * 1.3) * Math.cos(y * 1.3) + 0.05 * (x * x + y * y)
}

export default function SceneTraining({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pRoll = easeInOut(p)

  // Terrain mesh
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(EXTENT * 2, EXTENT * 2, GRID, GRID)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      pos.setZ(i, f(x, y) * 0.5)
    }
    g.computeVertexNormals()
    return g
  }, [])

  // Ball path: from (-1.5, -1.2) down to (0.5, 0)
  const bx = THREE.MathUtils.lerp(-1.5, 0.5, pRoll)
  const by = THREE.MathUtils.lerp(-1.2, 0.0, pRoll)
  const bz = f(bx, by) * 0.5 + 0.1

  return (
    <group position={[MID_X, 0.3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <Label position={[0, 1.8, 0]} size={0.18} color={COLORS.fg} opacity={0.9}>
        Loss landscape
      </Label>

      <mesh geometry={geom}>
        <meshBasicMaterial color={COLORS.blue} wireframe transparent opacity={0.35} />
      </mesh>

      <mesh position={[bx, by, bz]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={COLORS.gold} />
      </mesh>

      {/* trail */}
      {Array.from({ length: 20 }).map((_, i) => {
        const tp = (p - (i + 1) * 0.015)
        if (tp <= 0) return null
        const x2 = THREE.MathUtils.lerp(-1.5, 0.5, tp)
        const y2 = THREE.MathUtils.lerp(-1.2, 0.0, tp)
        const z2 = f(x2, y2) * 0.5 + 0.05
        return (
          <mesh key={i} position={[x2, y2, z2]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshBasicMaterial color={COLORS.gold} transparent opacity={0.5 * (1 - i / 20)} />
          </mesh>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Register as `'training'`, type-check, verify scene 21, commit**

```bash
git add components/movie/modelmap/sceneB_Training.tsx components/movie/modelmap/index.tsx
git commit -m "scene: training (ball rolls down loss landscape)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 31: sceneB_GdRavine.tsx

Narrow ravine-shaped surface; ball zigzags across walls.

**Files:**
- Create: `components/movie/modelmap/sceneB_GdRavine.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_GdRavine.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, easeInOut } from './shared/easing'
import { Label } from './shared/Label'

const GRID = 40
const EX = 2.2
const EY = 1.1

function f(x: number, y: number): number {
  // ravine: steep in x, shallow in y
  return 0.4 * x * x + 0.04 * y * y
}

export default function SceneGdRavine({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pPath = easeInOut(p)

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(EX * 2, EY * 2, GRID, GRID)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, f(pos.getX(i), pos.getY(i)) * 0.4)
    }
    g.computeVertexNormals()
    return g
  }, [])

  // Zigzag path: large x swings, slow y progress
  const zigs = 8
  const zigX = Math.sin(pPath * zigs * Math.PI) * (1 - pPath * 0.8) * 0.9
  const zigY = THREE.MathUtils.lerp(-0.9, 0.7, pPath)
  const zigZ = f(zigX, zigY) * 0.4 + 0.08

  return (
    <group position={[MID_X, 0.3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <Label position={[0, 1.8, 0]} size={0.18} color={COLORS.fg} opacity={0.9}>
        Vanilla GD · zigzag
      </Label>

      <mesh geometry={geom}>
        <meshBasicMaterial color={COLORS.red} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Trail */}
      {Array.from({ length: 60 }).map((_, i) => {
        const tp = p - (i + 1) * 0.008
        if (tp <= 0) return null
        const px = Math.sin(easeInOut(tp) * zigs * Math.PI) * (1 - easeInOut(tp) * 0.8) * 0.9
        const py = THREE.MathUtils.lerp(-0.9, 0.7, easeInOut(tp))
        const pz = f(px, py) * 0.4 + 0.05
        return (
          <mesh key={i} position={[px, py, pz]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.7 * (1 - i / 60)} />
          </mesh>
        )
      })}

      <mesh position={[zigX, zigY, zigZ]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={COLORS.red} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'gd-ravine'`, type-check, verify scene 22, commit**

```bash
git add components/movie/modelmap/sceneB_GdRavine.tsx components/movie/modelmap/index.tsx
git commit -m "scene: gd-ravine (vanilla GD zigzags across ravine)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 32: sceneB_GdAdam.tsx

Same ravine, Adam ball slides down floor with velocity trail.

**Files:**
- Create: `components/movie/modelmap/sceneB_GdAdam.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_GdAdam.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, easeOutCubic, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

const GRID = 40
const EX = 2.2
const EY = 1.1

function f(x: number, y: number): number {
  return 0.4 * x * x + 0.04 * y * y
}

export default function SceneGdAdam({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.25, p)
  const pPath = easeOutCubic(p)

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(EX * 2, EY * 2, GRID, GRID)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, f(pos.getX(i), pos.getY(i)) * 0.4)
    }
    g.computeVertexNormals()
    return g
  }, [])

  // Smooth path down the floor
  const adamX = THREE.MathUtils.lerp(-0.02, 0.02, pPath)  // stays near ravine floor
  const adamY = THREE.MathUtils.lerp(-0.9, 0.7, pPath)
  const adamZ = f(adamX, adamY) * 0.4 + 0.08

  return (
    <group position={[MID_X, 0.3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <Label position={[0, 1.8, 0]} size={0.18} color={COLORS.fg} opacity={0.9 * pEst}>
        Adam · momentum smooths
      </Label>

      <mesh geometry={geom}>
        <meshBasicMaterial color={COLORS.mint} wireframe transparent opacity={0.4 * pEst} />
      </mesh>

      {/* Smooth trail */}
      {Array.from({ length: 30 }).map((_, i) => {
        const tp = p - (i + 1) * 0.015
        if (tp <= 0) return null
        const ppt = easeOutCubic(tp)
        const px = THREE.MathUtils.lerp(-0.02, 0.02, ppt)
        const py = THREE.MathUtils.lerp(-0.9, 0.7, ppt)
        const pz = f(px, py) * 0.4 + 0.05
        return (
          <mesh key={i} position={[px, py, pz]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshBasicMaterial color={COLORS.mint} transparent opacity={0.75 * (1 - i / 30)} />
          </mesh>
        )
      })}

      <mesh position={[adamX, adamY, adamZ]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={COLORS.mint} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'gd-adam'`, type-check, verify scene 23, commit**

```bash
git add components/movie/modelmap/sceneB_GdAdam.tsx components/movie/modelmap/index.tsx
git commit -m "scene: gd-adam (momentum smooths ravine descent)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 7: Act IV — Backprop Mode C (Tasks 33–35)

### Task 33: sceneC_Backprop.tsx

Full stack visible (dimmed). Red loss spark ignites at output; gradient cascades backward.

**Files:**
- Create: `components/movie/modelmap/sceneC_Backprop.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneC_Backprop.tsx**

```tsx
'use client'

import type { SceneProps } from './shared/types'
import { COLORS, N_BLOCKS, blockStart, BLOCK_LEN, TOTAL_X, OUTPUT_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

export default function SceneBackprop({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)

  // Backward pulse: starts at output (right) and travels left through blocks
  const pulse = p * N_BLOCKS
  const activeIdx = Math.max(0, N_BLOCKS - 1 - Math.floor(pulse))
  const local = pulse - Math.floor(pulse)

  return (
    <group>
      <Label position={[TOTAL_X / 2, 1.5, 0.3]} size={0.2} color={COLORS.red} opacity={0.95 * pEst}>
        Gradient flows back
      </Label>

      {/* Loss spark at output */}
      <mesh position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0.3]}>
        <sphereGeometry args={[0.18 - p * 0.05, 12, 12]} />
        <meshBasicMaterial color={COLORS.red} transparent opacity={0.95} />
      </mesh>

      {/* Reverse-traveling gradient packet */}
      {Array.from({ length: N_BLOCKS }).map((_, i) => {
        const cx = blockStart(i) + BLOCK_LEN / 2
        const isActive = i === activeIdx
        const brightness = isActive ? 0.9 : 0.15
        return (
          <group key={i} position={[cx, 0, 0]}>
            <mesh>
              <boxGeometry args={[BLOCK_LEN * 0.9, 0.8, 0.5]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={0.06 + 0.12 * brightness} />
            </mesh>
            {isActive && (
              <mesh position={[(1 - local - 0.5) * BLOCK_LEN * 0.9, 0, 0.3]}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshBasicMaterial color={COLORS.red} />
              </mesh>
            )}
            <Label position={[0, -0.7, 0]} size={0.07} color={COLORS.dim} opacity={0.8}>
              {'∂L/∂W_' + i}
            </Label>
          </group>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Register as `'backprop'`, type-check, verify scene 18, commit**

```bash
git add components/movie/modelmap/sceneC_Backprop.tsx components/movie/modelmap/index.tsx
git commit -m "scene: backprop (gradient packet flows right-to-left through stack)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 34: sceneC_BpJacobian.tsx

Zoomed inside one block: gradient passes through a Jacobian matrix.

**Files:**
- Create: `components/movie/modelmap/sceneC_BpJacobian.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneC_BpJacobian.tsx**

```tsx
'use client'

import { useMemo } from 'react'
import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { mulberry32 } from './shared/rng'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const DIM = 10

export default function SceneBpJacobian({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pInput = smoothstep(0.15, 0.4, p)
  const pSweep = smoothstep(0.4, 0.9, p)
  const pOutput = smoothstep(0.6, 1.0, p)

  const cells = useMemo(() => {
    const rng = mulberry32(11)
    const v = new Float32Array(DIM * DIM)
    for (let i = 0; i < DIM * DIM; i++) v[i] = (rng() * 2 - 1) * 0.8
    return v
  }, [])

  // which row is currently being highlighted
  const hiRow = Math.floor(pSweep * DIM) % DIM

  const CELL = 0.1
  const matSize = DIM * CELL
  const cx = blockStart(0) + BLOCK_LEN / 2

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.16} color={COLORS.red} opacity={0.95 * pEst}>
        Jacobian ∂y/∂x
      </Label>

      {/* Gradient-in (coming from right, flowing left) */}
      <group position={[matSize / 2 + 0.35, 0, 0]}>
        {Array.from({ length: DIM }).map((_, i) => (
          <mesh key={i} position={[0, (DIM / 2 - i - 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.8, CELL * 0.8, 0.03]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.85 * pInput} />
          </mesh>
        ))}
        <Label position={[0, matSize / 2 + 0.15, 0]} size={0.08} color={COLORS.red} opacity={0.9 * pInput}>
          ∂L/∂y
        </Label>
      </group>

      {/* Matrix */}
      <Slab
        width={matSize}
        height={matSize}
        cells={{ cols: DIM, rows: DIM, values: cells }}
        opacity={0.2 * pEst}
        showCornerTicks
        tickLength={0.08}
      />

      {/* Row highlight */}
      <mesh position={[0, matSize / 2 - (hiRow + 0.5) * CELL, 0.01]}>
        <planeGeometry args={[matSize, CELL]} />
        <meshBasicMaterial color={COLORS.fg} transparent opacity={0.25 * pSweep} />
      </mesh>

      {/* Gradient-out (exits left) */}
      <group position={[-matSize / 2 - 0.35, 0, 0]}>
        {Array.from({ length: DIM }).map((_, i) => (
          <mesh key={i} position={[0, (DIM / 2 - i - 0.5) * CELL, 0]}>
            <boxGeometry args={[CELL * 0.8, CELL * 0.8, 0.03]} />
            <meshBasicMaterial color={COLORS.red} transparent opacity={0.85 * pOutput} />
          </mesh>
        ))}
        <Label position={[0, matSize / 2 + 0.15, 0]} size={0.08} color={COLORS.red} opacity={0.9 * pOutput}>
          ∂L/∂x
        </Label>
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'bp-jacobian'`, type-check, verify scene 19, commit**

```bash
git add components/movie/modelmap/sceneC_BpJacobian.tsx components/movie/modelmap/index.tsx
git commit -m "scene: bp-jacobian (gradient passes through Jacobian matrix)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 35: sceneC_BpAccum.tsx

B parallel gradient threads converge to one averaged gradient.

**Files:**
- Create: `components/movie/modelmap/sceneC_BpAccum.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneC_BpAccum.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

const BATCH = 4

export default function SceneBpAccum({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pFlow = smoothstep(0.2, 0.65, p)
  const pAvg = smoothstep(0.65, 1.0, p)

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.2, 0.3]} size={0.18} color={COLORS.red} opacity={0.95 * pEst}>
        Gradients · B samples
      </Label>

      {/* B parallel grad tubes flowing leftward */}
      {Array.from({ length: BATCH }).map((_, b) => {
        const yOffset = (b - BATCH / 2 + 0.5) * 0.25
        const zOff = b * 0.08
        return (
          <group key={b}>
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 1.4 - i * 0.35 - (1 - pFlow) * 0.4
              return (
                <mesh key={i} position={[x, yOffset, zOff]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshBasicMaterial color={COLORS.red} transparent opacity={0.7 * pFlow * (1 - b / BATCH * 0.2)} />
                </mesh>
              )
            })}
          </group>
        )
      })}

      {/* Convergence node (averaging) */}
      <group position={[-1.6, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.18 * pAvg, 16, 16]} />
          <meshBasicMaterial color={COLORS.red} transparent opacity={0.95 * pAvg} />
        </mesh>
        <Text position={[0, 0.3, 0]} fontSize={0.1} color={COLORS.red} fillOpacity={0.95 * pAvg}>
          (1/B) Σ
        </Text>
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'bp-accum'`, type-check, verify scene 20, commit**

```bash
git add components/movie/modelmap/sceneC_BpAccum.tsx components/movie/modelmap/index.tsx
git commit -m "scene: bp-accum (B gradient threads average)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 8: Act V — Modern + Output (Tasks 36–38)

### Task 36: sceneB_Rope.tsx

Q and K arrows in 2D plane rotate with position; angle arcs sweep.

**Files:**
- Create: `components/movie/modelmap/sceneB_Rope.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_Rope.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, smoothstep, loopPhase } from './shared/easing'
import { Label } from './shared/Label'

function ArrowFromOrigin({
  angle,
  length = 0.6,
  color,
  opacity,
}: {
  angle: number
  length?: number
  color: string
  opacity: number
}) {
  const x = Math.cos(angle) * length
  const y = Math.sin(angle) * length
  const headX = x - Math.cos(angle) * 0.07
  const headY = y - Math.sin(angle) * 0.07
  return (
    <group>
      <mesh position={[x / 2, y / 2, 0]} rotation={[0, 0, angle]}>
        <planeGeometry args={[length, 0.015]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[headX, headY, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  )
}

export default function SceneRope({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.2, p)
  const pos = loopPhase(t, 6) * 8  // token index cycles 0..8
  const baseAngle = pos * 0.4
  const qAngle = baseAngle + 0.7
  const kAngle = baseAngle - 0.3

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.2, 0.3]} size={0.18} opacity={0.9 * pEst}>
        RoPE · rotate instead of add
      </Label>

      {/* origin dot */}
      <mesh>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={COLORS.fg} />
      </mesh>

      {/* axes (faint) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.8, 0.004]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.004, 1.8]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4} />
      </mesh>

      <ArrowFromOrigin angle={qAngle} length={0.7} color={COLORS.blue} opacity={0.95 * pEst} />
      <ArrowFromOrigin angle={kAngle} length={0.6} color={COLORS.red} opacity={0.95 * pEst} />

      {/* Position readout */}
      <Text position={[0, -1.1, 0]} fontSize={0.14} color={COLORS.violet} fillOpacity={0.9 * pEst}>
        {'position = ' + pos.toFixed(1)}
      </Text>

      {/* Relative angle arc (conceptual) */}
      <Text position={[0.9, 0.7, 0]} fontSize={0.1} color={COLORS.mint} fillOpacity={0.9 * pEst}>
        {'Δθ = ' + (qAngle - kAngle).toFixed(2)}
      </Text>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'rope'`, type-check, verify scene 24, commit**

```bash
git add components/movie/modelmap/sceneB_Rope.tsx components/movie/modelmap/index.tsx
git commit -m "scene: rope (Q,K rotate together; relative angle preserved)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 37: sceneB_Modern.tsx

Three side-by-side comparison cards.

**Files:**
- Create: `components/movie/modelmap/sceneB_Modern.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneB_Modern.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, MID_X } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const CARDS = [
  { title: 'LayerNorm → RMSNorm', old: 'subtract μ · divide σ', nu: 'just divide ||x||', color: COLORS.blue, x: -1.5 },
  { title: 'GELU → SwiGLU', old: 'x · GELU(Wx)', nu: 'Swish(Wx) ⊙ Vx', color: COLORS.gold, x: 0 },
  { title: 'MHA → GQA', old: '8 Q · 8 K · 8 V', nu: '8 Q · 2 K · 2 V', color: COLORS.mint, x: 1.5 },
]

export default function SceneModern({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))

  return (
    <group position={[MID_X, 0, 0]}>
      <Label position={[0, 1.5, 0.3]} size={0.2} opacity={0.9}>
        Modern simplifications
      </Label>

      {CARDS.map((card, i) => {
        const pReveal = smoothstep(i * 0.15, 0.3 + i * 0.15, p)
        return (
          <group key={i} position={[card.x, 0, 0]}>
            <Slab width={1.3} height={1.4} color={card.color} opacity={0.12 * pReveal} showCornerTicks tickLength={0.12} />
            <Text position={[0, 0.5, 0.05]} fontSize={0.1} color={card.color} fillOpacity={0.95 * pReveal} anchorX="center">
              {card.title}
            </Text>
            <Text position={[0, 0.05, 0.05]} fontSize={0.08} color={COLORS.dim} fillOpacity={0.9 * pReveal} anchorX="center">
              {card.old}
            </Text>
            <Text position={[0, -0.1, 0.05]} fontSize={0.06} color={COLORS.dim} fillOpacity={0.7 * pReveal} anchorX="center">
              ↓
            </Text>
            <Text position={[0, -0.3, 0.05]} fontSize={0.08} color={card.color} fillOpacity={0.95 * pReveal} anchorX="center">
              {card.nu}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 2: Register as `'modern'`, type-check, verify scene 25, commit**

```bash
git add components/movie/modelmap/sceneB_Modern.tsx components/movie/modelmap/index.tsx
git commit -m "scene: modern (RMSNorm · SwiGLU · GQA comparison cards)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 38: sceneA_Output.tsx

Camera pulls all the way back. Full stack lit; typewriter text scroll emerges at bottom.

**Files:**
- Create: `components/movie/modelmap/sceneA_Output.tsx`
- Modify: `components/movie/modelmap/index.tsx`

- [ ] **Step 1: Write sceneA_Output.tsx**

```tsx
'use client'

import { Text } from '@react-three/drei'
import type { SceneProps } from './shared/types'
import { COLORS, TOTAL_X, OUTPUT_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'
import { usePrompt } from '../promptContext'

const GENERATED = ' on the mat'

export default function SceneOutput({ t, duration }: SceneProps) {
  const { prompt } = usePrompt()
  const p = clamp01(t / Math.max(0.01, duration))
  const pEst = smoothstep(0, 0.15, p)

  // Number of generated chars visible
  const totalChars = GENERATED.length
  const charsVisible = Math.floor(p * totalChars)
  const visible = GENERATED.slice(0, charsVisible)

  return (
    <group>
      <Label position={[TOTAL_X / 2, 1.8, 0.3]} size={0.22} opacity={0.95 * pEst}>
        The output
      </Label>

      {/* Input prompt (faint, as history) */}
      <Text
        position={[TOTAL_X / 2 - 1.5, -1.3, 0.3]}
        fontSize={0.14}
        color={COLORS.dim}
        fillOpacity={0.75 * pEst}
        anchorX="right"
        anchorY="middle"
      >
        {prompt}
      </Text>

      {/* Generated text */}
      <Text
        position={[TOTAL_X / 2 - 1.5, -1.3, 0.3]}
        fontSize={0.14}
        color={COLORS.gold}
        fillOpacity={0.95 * pEst}
        anchorX="left"
        anchorY="middle"
      >
        {visible}
      </Text>
    </group>
  )
}
```

- [ ] **Step 2: Register as `'output'`, type-check, verify scene 26, commit**

```bash
git add components/movie/modelmap/sceneA_Output.tsx components/movie/modelmap/index.tsx
git commit -m "scene: output (typewriter generation at stack exit)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 9: Integration & Polish (Tasks 39–42)

### Task 39: Full tour playthrough verification

- [ ] **Step 1: Start dev server clean**

```bash
lsof -i :3000 -t | xargs kill 2>/dev/null ; sleep 1
rm -f /tmp/viz-dev.log
npm run dev > /tmp/viz-dev.log 2>&1 &
sleep 5
tail -10 /tmp/viz-dev.log
```

Expected: "Ready in Xms".

- [ ] **Step 2: Open /tour in the user's browser and play through all 26 scenes**

Manually verify each scene transitions smoothly and the diorama content matches the spec. Note any scenes that:
- fail to render
- have obviously wrong content
- flicker or stutter
- produce console warnings

- [ ] **Step 3: Fix any broken scenes inline**

For each issue, open the corresponding `sceneX_Name.tsx`, fix, type-check, re-verify. Commit each fix individually:

```bash
git add components/movie/modelmap/sceneX_Name.tsx
git commit -m "scene: fix <description of fix>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 40: Type-check + production build

- [ ] **Step 1: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: build succeeds, no errors. Warnings about unused variables are acceptable.

- [ ] **Step 3: If build fails, fix and re-run**

Common failures:
- Unused imports: remove them
- Type mismatches in scene files: fix the signature mismatches
- Missing registrations in SCENE_MAP: verify every scene imported is registered

Commit any fixes:

```bash
git add -A
git commit -m "fix: build issues from per-scene refactor

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 41: Review camera waypoint transitions end-to-end

- [ ] **Step 1: Play the full tour and watch camera motion**

Watch for:
- Any abrupt camera cuts (should all be smooth lerps)
- Any scenes where the camera doesn't show the content clearly
- Any waypoints that feel too close or too far

- [ ] **Step 2: Tune waypoints in `shared/constants.ts` as needed**

Adjust `WAYPOINTS` entries for any scenes that need better framing.

- [ ] **Step 3: Commit waypoint tweaks**

```bash
git add components/movie/modelmap/shared/constants.ts
git commit -m "tune: camera waypoint framing for per-scene dioramas

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 42: Final verification + summary

- [ ] **Step 1: Run full suite one last time**

```bash
npx tsc --noEmit
npm run build
```

Both should succeed clean.

- [ ] **Step 2: Confirm legacy file removed**

```bash
ls components/movie/ModelMap3D.tsx 2>&1 | grep -q "No such"
```

Expected: the file no longer exists (confirmed in Task 12).

- [ ] **Step 3: Confirm all 26 scenes wired**

```bash
grep -c "^  [a-z-]\+:" components/movie/modelmap/index.tsx
```

Expected: at least 26 (one per scene id).

- [ ] **Step 4: Report completion**

Stop the dev server and report to the user:
- All 26 scenes implemented and visually verified
- Type-check and production build clean
- Legacy ModelMap3D.tsx removed
- Plan file path for reference

---

## Self-Review Checklist

Before executing: verify each Mode A scene matches the spec's description, each Mode B scene matches the spec's description, and the dispatcher registers every scene id listed in `SCENE_WAYPOINT` in `constants.ts`. If any scene id is in `SCENE_WAYPOINT` but not in `SCENE_MAP`, add its registration.
