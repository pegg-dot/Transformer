'use client'

import { createContext, useContext } from 'react'

/**
 * Lightweight context exposing the current playback speed to 2D scene
 * components. Each scene's setInterval-based animations scale their period
 * by 1/speed so they animate in lock-step with the orchestrator's elapsed
 * clock (which also scales with speed).
 */
export const SpeedContext = createContext<number>(1)

export function useSpeed(): number {
  return useContext(SpeedContext)
}
