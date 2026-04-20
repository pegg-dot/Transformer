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
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
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

  const adamX = THREE.MathUtils.lerp(-0.02, 0.02, pPath)
  const adamY = THREE.MathUtils.lerp(-0.9, 0.7, pPath)
  const adamZ = f(adamX, adamY) * 0.4 + 0.08

  return (
    <group position={[MID_X, 0.3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <Label position={[0, 1.7, 0]} size={0.18} color={COLORS.fg} opacity={0.9 * pEst}>
        Adam · momentum smooths
      </Label>

      <mesh geometry={geom}>
        <meshBasicMaterial color={COLORS.mint} wireframe transparent opacity={0.4 * pEst} />
      </mesh>

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
