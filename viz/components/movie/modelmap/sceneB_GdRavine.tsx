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
  return 0.4 * x * x + 0.04 * y * y
}

export default function SceneGdRavine({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
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

  const zigs = 8
  const zigX = Math.sin(pPath * zigs * Math.PI) * (1 - pPath * 0.8) * 0.9
  const zigY = THREE.MathUtils.lerp(-0.9, 0.7, pPath)
  const zigZ = f(zigX, zigY) * 0.4 + 0.08

  return (
    <group position={[MID_X, 0.3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <Label position={[0, 1.7, 0]} size={0.18} color={COLORS.fg} opacity={0.9}>
        Vanilla GD · zigzag
      </Label>

      <mesh geometry={geom}>
        <meshBasicMaterial color={COLORS.red} wireframe transparent opacity={0.4} />
      </mesh>

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
