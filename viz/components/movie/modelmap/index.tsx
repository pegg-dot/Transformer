'use client'

import { Canvas } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Fog } from 'three'
import { useState, useMemo, useEffect, type ComponentType, type ReactNode } from 'react'
import { COLORS, FOG_NEAR, FOG_FAR, MID_X } from './shared/constants'
import type { SceneMode, SceneProps } from './shared/types'
import { CameraController } from './shared/CameraController'
import { SceneClock } from './shared/SceneClock'
import { StackBackdrop } from './shared/StackBackdrop'
import { incomingKindFor, KIND_TIMING } from '../transitions'

import SceneTokens from './sceneA_Tokens'
import SceneBpe from './sceneA_Bpe'
import SceneEmbed from './sceneA_Embed'
import ScenePositional from './sceneA_Positional'
import SceneLayerNorm from './sceneA_LayerNorm'
import SceneQkv from './sceneA_Qkv'
import SceneAttn from './sceneA_Attn'
import SceneMulti from './sceneA_Multi'
import SceneFfn from './sceneA_Ffn'
import SceneFfnFeature from './sceneA_FfnFeature'
import SceneGelu from './sceneA_Gelu'
import SceneStack from './sceneA_Stack'
import SceneSample from './sceneA_Sample'
import SceneKvCache from './sceneA_KvCache'
import SceneOutput from './sceneA_Output'
import SceneLoss from './sceneB_Loss'
import SceneLossSeq from './sceneB_LossSeq'
import SceneLossBatch from './sceneB_LossBatch'
import SceneTraining from './sceneB_Training'
import SceneGdRavine from './sceneB_GdRavine'
import SceneGdAdam from './sceneB_GdAdam'
import SceneRope from './sceneB_Rope'
import SceneModern from './sceneB_Modern'
import SceneBackprop from './sceneC_Backprop'
import SceneBpJacobian from './sceneC_BpJacobian'
import SceneBpAccum from './sceneC_BpAccum'
import SceneIntroReveal, {
  SceneAct1Intro,
  SceneAct2Intro,
  SceneAct3Intro,
  SceneAct4Intro,
  SceneAct5Intro,
  SceneAct6Intro,
} from './introScenes3D'

const SCENE_MAP: Record<string, ComponentType<SceneProps>> = {
  tokens: SceneTokens,
  bpe: SceneBpe,
  embed: SceneEmbed,
  positional: ScenePositional,
  layernorm: SceneLayerNorm,
  qkv: SceneQkv,
  attn: SceneAttn,
  multi: SceneMulti,
  ffn: SceneFfn,
  'ffn-feature': SceneFfnFeature,
  gelu: SceneGelu,
  stack: SceneStack,
  sample: SceneSample,
  kvcache: SceneKvCache,
  output: SceneOutput,
  loss: SceneLoss,
  'loss-seq': SceneLossSeq,
  'loss-batch': SceneLossBatch,
  training: SceneTraining,
  'gd-ravine': SceneGdRavine,
  'gd-adam': SceneGdAdam,
  rope: SceneRope,
  modern: SceneModern,
  backprop: SceneBackprop,
  'bp-jacobian': SceneBpJacobian,
  'bp-accum': SceneBpAccum,
  'intro-cold-open': SceneIntroReveal,
  'act1-intro': SceneAct1Intro,
  'act2-intro': SceneAct2Intro,
  'act3-intro': SceneAct3Intro,
  'act4-intro': SceneAct4Intro,
  'act5-intro': SceneAct5Intro,
  'act6-intro': SceneAct6Intro,
}

const MODE_A_SCENES = new Set([
  'tokens', 'bpe', 'embed', 'positional', 'layernorm', 'qkv', 'attn', 'multi',
  'ffn', 'ffn-feature', 'gelu', 'stack', 'sample', 'kvcache', 'output',
])
const MODE_C_SCENES = new Set(['backprop', 'bp-jacobian', 'bp-accum'])

function sceneMode(sceneId: string): SceneMode {
  if (MODE_A_SCENES.has(sceneId)) return 'A'
  if (MODE_C_SCENES.has(sceneId)) return 'C'
  return 'B'
}

function activeBlockForScene(sceneId: string): number | undefined {
  const b0 = new Set([
    'layernorm', 'qkv', 'attn', 'multi', 'ffn', 'ffn-feature', 'gelu',
    'kvcache', 'bp-jacobian',
  ])
  return b0.has(sceneId) ? 0 : undefined
}

export interface ModelMap3DProps {
  part?: string
  sceneId: string
  accent: string
  duration: number
  /** When false, freezes the scene clock and switches the Canvas to on-demand
   *  rendering so the GPU sleeps. */
  playing: boolean
  /** Optional in-world 2D panel: rendered via drei's <Html> at a 3D
   *  position so the 2D commentary anchors to a specific part of the
   *  model rather than living in a separate column. */
  worldPanel?: { node: ReactNode; pos: [number, number, number] }
}

export function ModelMap3D({ sceneId, accent, duration, playing, worldPanel }: ModelMap3DProps) {
  const [t, setT] = useState(0)
  const Scene = SCENE_MAP[sceneId]
  const mode = useMemo(() => sceneMode(sceneId), [sceneId])
  const activeBlock = useMemo(() => activeBlockForScene(sceneId), [sceneId])
  const durationSec = duration / 1000

  const kind = useMemo(() => incomingKindFor(sceneId), [sceneId])
  const cameraSpeed = KIND_TIMING[kind].cameraSpeed
  const fadeMs = KIND_TIMING[kind].sidebarCrossfadeMs
  // Act-change arcs spend real time at the pull-back apex; other transitions
  // use a quicker arc so within-act moves don't feel draggy.
  const viaDurationSec = kind === 'act-change' ? 1.6 : 0.9

  // Dim-pulse on sceneId change: snap to dim, lerp back up over fadeMs.
  // Masks the hard scene-content swap beneath.
  const [bright, setBright] = useState(1)
  useEffect(() => {
    setBright(0.15)
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / fadeMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setBright(0.15 + (1 - 0.15) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [sceneId, fadeMs])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: COLORS.bg }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          filter: `brightness(${bright})`,
        }}
      >
        <Canvas
          camera={{ position: [MID_X - 0.5, 1.3, 5.8], fov: 50 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
          frameloop={playing ? 'always' : 'demand'}
          onCreated={({ scene }) => {
            scene.fog = new Fog(COLORS.bg, FOG_NEAR, FOG_FAR)
            scene.background = null
          }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 8]} intensity={0.6} />
          <directionalLight position={[-4, 2, -3]} intensity={0.3} />

          <CameraController sceneId={sceneId} speed={cameraSpeed} viaDurationSec={viaDurationSec} />
          <SceneClock running={playing} onTick={setT} resetKey={sceneId} />

          <StackBackdrop mode={mode} activeBlock={activeBlock} />

          {Scene && <Scene t={t} duration={durationSec} accent={accent} sceneId={sceneId} />}

          {/* In-world floating glass panel — the plan's full-bleed mode.
              Renders the 2D detail panel as a drei <Html> at a chosen
              world position. distanceFactor scales it with camera. */}
          {worldPanel && (
            <Html
              position={worldPanel.pos}
              transform
              distanceFactor={6}
              style={{
                width: 420,
                pointerEvents: 'auto',
              }}
            >
              <div
                style={{
                  padding: '16px 18px',
                  background: 'rgba(7,7,9,0.78)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  borderRadius: 6,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  color: 'var(--fg)',
                }}
              >
                {worldPanel.node}
              </div>
            </Html>
          )}
        </Canvas>
      </div>
    </div>
  )
}

export type { ModelPart } from './shared/types'
