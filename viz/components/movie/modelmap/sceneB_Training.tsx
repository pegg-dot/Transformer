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
  return 0.4 * Math.sin(x * 1.3) * Math.cos(y * 1.3) + 0.05 * (x * x + y * y)
}

export default function SceneTraining({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration * 0.75))
  const pRoll = easeInOut(p)

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

  const bx = THREE.MathUtils.lerp(-1.5, 0.5, pRoll)
  const by = THREE.MathUtils.lerp(-1.2, 0.0, pRoll)
  const bz = f(bx, by) * 0.5 + 0.1

  return (
    <group position={[MID_X, 0.3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <Label position={[0, 1.9, 0]} size={0.2} opacity={0.9}>
        Loss landscape
      </Label>

      <mesh geometry={geom}>
        <meshBasicMaterial color={COLORS.blue} wireframe transparent opacity={0.4} />
      </mesh>

      <mesh position={[bx, by, bz]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={COLORS.gold} />
      </mesh>

      {Array.from({ length: 20 }).map((_, i) => {
        const tp = p - (i + 1) * 0.015
        if (tp <= 0) return null
        const x2 = THREE.MathUtils.lerp(-1.5, 0.5, easeInOut(tp))
        const y2 = THREE.MathUtils.lerp(-1.2, 0.0, easeInOut(tp))
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
