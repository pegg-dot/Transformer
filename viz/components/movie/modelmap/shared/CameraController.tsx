'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { SCENE_WAYPOINT, SCENE_VIA, WAYPOINTS, type Waypoint } from './constants'

function waypointForScene(sceneId: string | undefined): Waypoint {
  if (!sceneId) return WAYPOINTS.overview
  const key = SCENE_WAYPOINT[sceneId]
  return key ? WAYPOINTS[key] : WAYPOINTS.overview
}

function viaWaypointForScene(sceneId: string | undefined): Waypoint | null {
  if (!sceneId) return null
  const key = SCENE_VIA[sceneId]
  return key ? WAYPOINTS[key] : null
}

export interface CameraControllerProps {
  sceneId: string | undefined
  /** Baseline lerp speed (exponential approach). */
  speed?: number
  /** Seconds spent arcing through the via-point before settling on target. */
  viaDurationSec?: number
}

/**
 * Routes the camera from its current position to the target waypoint for the
 * current scene. When the scene has a via-point declared in SCENE_VIA, the
 * camera ARCS through that waypoint first — producing the 3B1B-style pull-back
 * → pan → dive-in effect that establishes the parent container before showing
 * the next sub-component.
 *
 * When there is no via-point, the camera does a plain exponential lerp.
 */
export function CameraController({
  sceneId,
  speed = 1.8,
  viaDurationSec = 0.9,
}: CameraControllerProps) {
  const { camera } = useThree()
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))

  // Via-point tracking: when sceneId changes, if the new scene has a via-point
  // declared, route through it for the first viaDurationSec seconds.
  const viaActiveRef = useRef(false)
  const viaStartRef = useRef(0)
  const viaWpRef = useRef<Waypoint | null>(null)

  useEffect(() => {
    const via = viaWaypointForScene(sceneId)
    if (via) {
      viaActiveRef.current = true
      viaStartRef.current = performance.now()
      viaWpRef.current = via
    } else {
      viaActiveRef.current = false
      viaWpRef.current = null
    }
  }, [sceneId])

  const finalPos = useRef(new THREE.Vector3())
  const finalLook = useRef(new THREE.Vector3())
  const viaPos = useRef(new THREE.Vector3())
  const viaLook = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    const targetWp = waypointForScene(sceneId)
    finalPos.current.set(...targetWp.pos)
    finalLook.current.set(...targetWp.look)

    // Compute the effective target this frame. If a via-point is active, blend
    // via-point → final-target over viaDurationSec using a sin curve so the
    // camera spends real time at the pulled-back position before diving in.
    let effTargetPos = finalPos.current
    let effTargetLook = finalLook.current
    let effFov = targetWp.fov

    if (viaActiveRef.current && viaWpRef.current) {
      const elapsed = (performance.now() - viaStartRef.current) / 1000
      const p = Math.min(1, elapsed / viaDurationSec)
      if (p >= 1) {
        viaActiveRef.current = false
      } else {
        // Weight: 1 at p=0 (full via), 0 at p=1 (full target), with slight hold
        // around the via-point peak to let the viewer register the context.
        const w = Math.pow(1 - p, 2)
        viaPos.current.set(...viaWpRef.current.pos)
        viaLook.current.set(...viaWpRef.current.look)
        effTargetPos = viaPos.current.clone().lerp(finalPos.current, 1 - w)
        effTargetLook = viaLook.current.clone().lerp(finalLook.current, 1 - w)
        effFov = THREE.MathUtils.lerp(targetWp.fov, viaWpRef.current.fov, w)
      }
    }

    if (
      camera instanceof THREE.PerspectiveCamera &&
      Math.abs(camera.fov - effFov) > 0.01
    ) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, effFov, Math.min(1, dt * speed))
      camera.updateProjectionMatrix()
    }

    const alpha = 1 - Math.exp(-speed * dt)
    camera.position.lerp(effTargetPos, alpha)
    currentLook.current.lerp(effTargetLook, alpha)
    camera.lookAt(currentLook.current)
  })

  return null
}
