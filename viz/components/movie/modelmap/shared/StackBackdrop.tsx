'use client'

import {
  N_BLOCKS, blockStart, BLOCK_LEN, SLAB_H,
  INPUT_LEN, OUTPUT_LEN, TOTAL_X, COLORS,
} from './constants'
import { BlockFrame } from './BlockFrame'
import { Slab } from './Slab'

export interface StackBackdropProps {
  mode: 'A' | 'B' | 'C'
  activeBlock?: number
}

export function StackBackdrop({ mode, activeBlock }: StackBackdropProps) {
  const baseOpacity = mode === 'A' ? 0.3 : mode === 'C' ? 0.22 : 0.08

  // When a specific block is active (camera dollied into it) every other
  // stage element recesses further so the active one reads as "filling the
  // frame." When nothing is highlighted (overview / training) the stack
  // holds its baseline opacity.
  const hasActive = activeBlock !== undefined
  const recess = hasActive ? 0.55 : 1

  return (
    <group>
      <Slab
        position={[INPUT_LEN / 2, 0, 0]}
        width={INPUT_LEN * 0.8}
        height={SLAB_H}
        color={COLORS.violet}
        opacity={baseOpacity * 0.5 * recess}
        showCornerTicks={false}
      />

      {Array.from({ length: N_BLOCKS }).map((_, bi) => {
        const isActive = activeBlock === bi
        const opacity = isActive ? baseOpacity * 2.2 : baseOpacity * recess
        const cx = blockStart(bi) + BLOCK_LEN / 2
        return (
          <group key={bi}>
            <BlockFrame
              position={[cx, 0, 0]}
              size={[BLOCK_LEN, SLAB_H, 0.9]}
              color={isActive ? COLORS.fg : COLORS.dim}
              opacity={opacity}
            />
            <Slab
              position={[cx - 0.7, 0, 0]}
              width={BLOCK_LEN * 0.35}
              height={SLAB_H * 0.9}
              color={COLORS.blue}
              opacity={opacity * 0.4}
              showCornerTicks={isActive}
            />
            <Slab
              position={[cx + 0.7, 0, 0]}
              width={BLOCK_LEN * 0.35}
              height={SLAB_H * 0.9}
              color={COLORS.mint}
              opacity={opacity * 0.4}
              showCornerTicks={isActive}
            />
          </group>
        )
      })}

      <Slab
        position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0]}
        width={OUTPUT_LEN * 0.8}
        height={SLAB_H}
        color={COLORS.gold}
        opacity={baseOpacity * 0.5 * recess}
        showCornerTicks={false}
      />
    </group>
  )
}
