'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export interface SceneClockProps {
  running: boolean
  onTick: (t: number) => void
  resetKey: string
}

export function SceneClock({ running, onTick, resetKey }: SceneClockProps) {
  const t = useRef(0)
  const lastKey = useRef(resetKey)

  useFrame((_, dt) => {
    if (lastKey.current !== resetKey) {
      t.current = 0
      lastKey.current = resetKey
    }
    if (running) {
      t.current += dt
      onTick(t.current)
    }
  })

  return null
}
