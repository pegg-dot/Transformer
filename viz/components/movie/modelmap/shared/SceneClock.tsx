'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useSpeed } from '../../speedContext'

export interface SceneClockProps {
  running: boolean
  onTick: (t: number) => void
  resetKey: string
}

/**
 * Per-scene clock driving 3D scene animations. Ticks at `speed * dt` so the
 * reported `t` stays in lock-step with the orchestrator's `elapsed` counter
 * (which also multiplies dt by speed). Without this, at 2x/3x playback the
 * orchestrator would fire "scene over" while the 3D clock was only halfway
 * through the scene's internal animation, cutting labels and pulses off
 * before they finish.
 */
export function SceneClock({ running, onTick, resetKey }: SceneClockProps) {
  const t = useRef(0)
  const lastKey = useRef(resetKey)
  const speed = useSpeed()

  useFrame((_, dt) => {
    if (lastKey.current !== resetKey) {
      t.current = 0
      lastKey.current = resetKey
    }
    if (running) {
      t.current += dt * speed
      onTick(t.current)
    }
  })

  return null
}
