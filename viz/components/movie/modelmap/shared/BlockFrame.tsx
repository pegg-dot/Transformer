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
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
