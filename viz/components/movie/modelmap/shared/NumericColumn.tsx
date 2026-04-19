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
        >
          {v}
        </Text>
      ))}
    </group>
  )
}
