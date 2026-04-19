'use client'

import { Text } from '@react-three/drei'
import { COLORS } from './constants'

export interface LabelProps {
  position: [number, number, number]
  children: string
  size?: number
  color?: string
  opacity?: number
}

export function Label({
  position,
  children,
  size = 0.18,
  color = COLORS.fg,
  opacity = 0.9,
}: LabelProps) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      fillOpacity={opacity}
      anchorX="center"
      anchorY="middle"
    >
      {children}
    </Text>
  )
}
