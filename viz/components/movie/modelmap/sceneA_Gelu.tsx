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
  { name: 'ReLU', fn: relu, color: COLORS.blue, x: -1.4 },
  { name: 'GELU', fn: gelu, color: COLORS.gold, x: 0 },
  { name: 'Swish', fn: swish, color: COLORS.mint, x: 1.4 },
]

function Curve({ spec, phase, t }: { spec: typeof CURVES[number]; phase: number; t: number }) {
  const samples = 40
  const pts: [number, number, number][] = Array.from({ length: samples }).map((_, i) => {
    const x = (i / (samples - 1)) * 2 - 1
    return [x * 0.45, spec.fn(x * 2) * 0.2, 0]
  })

  const xs = loopPhase(t, 2.5) * 2 - 1
  const yt = spec.fn(xs * 2) * 0.2

  return (
    <group position={[spec.x, 0, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1, 0.008]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4 * phase} />
      </mesh>
      <mesh position={[0, 0.2, -0.01]}>
        <planeGeometry args={[0.008, 1]} />
        <meshBasicMaterial color={COLORS.dim} transparent opacity={0.4 * phase} />
      </mesh>

      {pts.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.85 * phase} />
        </mesh>
      ))}

      <mesh position={[xs * 0.45, yt, 0.02]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.95 * phase} />
      </mesh>

      <Label position={[0, 0.6, 0]} size={0.13} color={spec.color} opacity={0.9 * phase}>
        {spec.name}
      </Label>
    </group>
  )
}

export default function SceneGelu({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.75

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.0, 0.2]} size={0.17} opacity={0.9 * pEst}>
        Activation choices
      </Label>
      {CURVES.map((spec) => (
        <Curve key={spec.name} spec={spec} phase={pEst} t={t} />
      ))}
      <Slab width={3.8} height={1.8} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.14} />
    </group>
  )
}
