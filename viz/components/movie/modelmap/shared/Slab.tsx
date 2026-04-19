'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS, SLAB_DEPTH } from './constants'

export interface SlabProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  width: number
  height: number
  depth?: number
  color?: string
  opacity?: number
  cells?: { cols: number; rows: number; values?: Float32Array } | null
  showCornerTicks?: boolean
  tickLength?: number
}

export function Slab({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width,
  height,
  depth = SLAB_DEPTH,
  color = COLORS.slabTint,
  opacity = 0.15,
  cells = null,
  showCornerTicks = true,
  tickLength = 0.1,
}: SlabProps) {
  const ticks = useMemo(() => {
    if (!showCornerTicks) return []
    const hw = width / 2
    const hh = height / 2
    const z = depth / 2 + 0.003
    const L = tickLength
    return [
      [[-hw, -hh, z], [-hw + L, -hh, z]],
      [[-hw, -hh, z], [-hw, -hh + L, z]],
      [[hw, -hh, z], [hw - L, -hh, z]],
      [[hw, -hh, z], [hw, -hh + L, z]],
      [[-hw, hh, z], [-hw + L, hh, z]],
      [[-hw, hh, z], [-hw, hh - L, z]],
      [[hw, hh, z], [hw - L, hh, z]],
      [[hw, hh, z], [hw, hh - L, z]],
    ] as [number, number, number][][]
  }, [showCornerTicks, width, height, depth, tickLength])

  const cellGrid = useMemo(() => {
    if (!cells) return null
    const cellW = width / cells.cols
    const cellH = height / cells.rows
    const items: { x: number; y: number; w: number; h: number; color: string }[] = []
    for (let r = 0; r < cells.rows; r++) {
      for (let c = 0; c < cells.cols; c++) {
        const i = r * cells.cols + c
        const x = -width / 2 + cellW * (c + 0.5)
        const y = height / 2 - cellH * (r + 0.5)
        const v = cells.values ? cells.values[i] : 0
        const clamped = Math.max(-1, Math.min(1, v))
        const color = clamped >= 0 ? COLORS.blue : COLORS.red
        items.push({ x, y, w: cellW * 0.85, h: cellH * 0.85, color })
      }
    }
    return items
  }, [cells, width, height])

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      {cellGrid &&
        cellGrid.map((cell, i) => (
          <mesh key={i} position={[cell.x, cell.y, depth / 2 + 0.002]}>
            <planeGeometry args={[cell.w, cell.h]} />
            <meshBasicMaterial
              color={cell.color}
              transparent
              opacity={0.75}
              depthWrite={false}
            />
          </mesh>
        ))}
      {ticks.map((seg, i) => {
        const positions = new Float32Array(seg.flat())
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[positions, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={COLORS.fg}
              transparent
              opacity={0.85}
            />
          </line>
        )
      })}
    </group>
  )
}
