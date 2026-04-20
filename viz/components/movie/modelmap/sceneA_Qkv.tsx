'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { Label } from './shared/Label'

const DIM = 20
const BAR_W = 0.08

function InputBar({ color, opacity }: { color: string; opacity: number }) {
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
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pEst = smoothstep(0, 0.2, p)
  const pProject = smoothstep(0.25, 0.7, p)
  const pBranch = smoothstep(0.6, 1.0, p)

  const cx = blockStart(0) + BLOCK_LEN * 0.2

  const specs = [
    { color: COLORS.blue, y: 0.7, label: 'Q' },
    { color: COLORS.red, y: 0.0, label: 'K' },
    { color: COLORS.mint, y: -0.7, label: 'V' },
  ]

  return (
    <group position={[cx, 0, 0]}>
      <Label position={[0, 1.1, 0]} size={0.18} opacity={0.9 * pEst}>
        Q · K · V projections
      </Label>

      <group position={[-1.4 + 0.3 * pProject, 0, 0]}>
        <InputBar color={COLORS.fg} opacity={0.8 * pEst} />
      </group>

      {specs.map((spec, i) => (
        <group key={i}>
          <mesh position={[0.2, spec.y, 0]}>
            <boxGeometry args={[0.06, 0.55, 0.35]} />
            <meshBasicMaterial color={spec.color} transparent opacity={0.3 + 0.4 * pProject} />
          </mesh>
          <Label position={[0.2, spec.y + 0.45, 0]} size={0.1} color={spec.color} opacity={0.9 * pProject}>
            {'W_' + spec.label}
          </Label>

          <group position={[0.9 + 0.5 * pBranch, spec.y, 0]}>
            <InputBar color={spec.color} opacity={0.85 * pBranch} />
          </group>
          <Label position={[1.9, spec.y + 0.3, 0]} size={0.2} color={spec.color} opacity={0.95 * pBranch}>
            {spec.label}
          </Label>
        </group>
      ))}

      <Slab position={[0.3, 0, -0.05]} width={3.6} height={2.3} opacity={0.04 + 0.05 * pEst} showCornerTicks tickLength={0.14} />
    </group>
  )
}
