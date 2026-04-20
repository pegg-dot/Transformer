'use client'

import type { SceneProps } from './shared/types'
import { COLORS, blockStart, BLOCK_LEN } from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Slab } from './shared/Slab'
import { DenseMesh } from './shared/DenseMesh'
import { Label } from './shared/Label'

export default function SceneFfn({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
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

      <group position={[-1.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.4, 0.04]} />
          <meshBasicMaterial color={COLORS.fg} transparent opacity={0.85 * pEst} />
        </mesh>
        <Label position={[0, 0.3, 0]} size={0.08} opacity={0.8 * pEst}>d</Label>
      </group>

      <mesh position={[-0.9, 0, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.6]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.4 * pExpand} />
      </mesh>

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

      <group position={[0, 1.05, 0]}>
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i / 19) * 0.8 - 0.4
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

      <mesh position={[0.9, 0, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.6]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.4 * pCompress} />
      </mesh>

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
