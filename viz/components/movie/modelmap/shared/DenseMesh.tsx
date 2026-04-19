'use client'

import { useMemo } from 'react'
import { mulberry32 } from './rng'

export interface DenseMeshProps {
  position?: [number, number, number]
  extent?: [number, number, number]
  nodeCount?: number
  connectionCount?: number
  seed?: number
  opacity?: number
}

export function DenseMesh({
  position = [0, 0, 0],
  extent = [0.9, 0.5, 0.3],
  nodeCount = 150,
  connectionCount = 450,
  seed = 1,
  opacity = 0.55,
}: DenseMeshProps) {
  const { positions, colors } = useMemo(() => {
    const rng = mulberry32(seed)
    const nodes: [number, number, number][] = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push([
        (rng() * 2 - 1) * extent[0],
        (rng() * 2 - 1) * extent[1],
        (rng() * 2 - 1) * extent[2],
      ])
    }

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
    return { positions: linePositions, colors: lineColors }
  }, [nodeCount, connectionCount, seed, extent])

  return (
    <group position={position}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
