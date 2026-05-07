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

/**
 * Whether the movie is actively playing. Default true so consumers outside
 * a Movie context (e.g. standalone scene previews) keep animating. When the
 * orchestrator is paused, finished, or a popover is open, this flips to
 * false so ambient repeating animations can opt out.
 */
export const PlayingContext = createContext<boolean>(true)

export function usePlaying(): boolean {
  return useContext(PlayingContext)
}
