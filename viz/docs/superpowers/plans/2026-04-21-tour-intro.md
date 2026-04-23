# Tour Intro + Per-Act Framing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 new scenes to `/tour` — 1 cold open before Act I (fake chat UI types a prompt, dissolves to a 3D transformer reveal), 6 act intros (pull back, name the act, dive in). Purely additive to existing scene flow.

**Architecture:** Two new files (`components/movie/introScenes.tsx` for 2D, `components/movie/modelmap/introScenes3D.tsx` for 3D). Register the 3D components in `modelmap/index.tsx`. Wire 7 entries into `SCENES[]` in `app/tour/page.tsx`. Update the `INCOMING_KIND` map in `transitions.ts` so each act's banner fires on the intro, not again on the first real scene.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Framer Motion (2D), @react-three/fiber + @react-three/drei (3D). No new deps.

**Verification pattern:** This viz codebase has no Jest/Vitest configuration (`package.json` has no test runner). The verification gate after every code task is `npx tsc --noEmit` (must be silent) + `npm run build` (must finish with the 5 static routes) + a manual visual check of the affected scenes at `http://localhost:3000/tour`. Where a task's correctness is a property the type system can catch (scene id registered in all three places, waypoint keys valid, etc.), the build acts as the test.

**Spec:** `viz/docs/superpowers/specs/2026-04-21-tour-intro-design.md`.

---

## File structure

Each new scene has two sides (2D sidebar + 3D stage) and one `SCENES[]` entry.

```
viz/
├── app/tour/page.tsx                                    MODIFY (add 7 SCENES[] entries, add 'Prologue' section const, add imports)
├── components/movie/
│   ├── introScenes.tsx                                  NEW (2D: IntroColdOpenPanel + ActFramingPanel + two custom overlays)
│   ├── transitions.ts                                   MODIFY (INCOMING_KIND: +7 new keys, flip 4 existing)
│   └── modelmap/
│       ├── index.tsx                                    MODIFY (register 2 new 3D scenes in SCENE_MAP + MODE_* sets)
│       ├── introScenes3D.tsx                            NEW (3D: SceneIntroReveal + SceneActFraming)
│       └── shared/constants.ts                          MODIFY (add 1 new waypoint for cold-open reveal; add SCENE_WAYPOINT entries for 7 new ids; add SCENE_VIA entries)
```

Responsibility split:
- **`introScenes.tsx`** — all 2D sidebar rendering for the 7 new scenes. One file because they share Framer Motion idioms and are small.
- **`introScenes3D.tsx`** — two parameterized 3D components that cover all 7 scenes. Keeps 3D code close to other `scene*_*.tsx` files in the same directory.
- **`transitions.ts`** edit — pure data change, one hunk.
- **`modelmap/index.tsx`** edit — two-line registration.
- **`app/tour/page.tsx`** edit — concentrated at the top of `SCENES[]` (cold open + act1-intro) and at each act boundary.

---

## Task 1: Add the cold-open 3D reveal waypoint + register new scene ids in shared/constants.ts

**Files:**
- Modify: `viz/components/movie/modelmap/shared/constants.ts`

**Context:** The cold open's final beat zooms out from deep-in to a wide shot of the entire stack. `overview` already exists (`pos: [MID_X - 0.5, 1.3, 5.8]`) but it's medium-close. We want a wider "hero" shot. Add a new `introHero` waypoint. Also add `SCENE_WAYPOINT` entries mapping all 7 new ids to waypoints, and `SCENE_VIA` entries for act-intros that should arc through a pull-back point.

- [ ] **Step 1: Add the `introHero` waypoint**

In `shared/constants.ts`, inside the `WAYPOINTS` object (right after `dioramaWide`, before the closing `} as const satisfies ...`), add:

```ts
  introHero: {
    pos: [MID_X, 1.8, 14],
    look: [MID_X, 0, 0],
    fov: 58,
  },
```

- [ ] **Step 2: Add SCENE_WAYPOINT entries for the 7 new scenes**

In the same file, inside the `SCENE_WAYPOINT: Record<string, WaypointKey> = { ... }` block, append these lines before the closing brace:

```ts
  'intro-cold-open': 'introHero',
  'act1-intro': 'inputStageWide',
  'act2-intro': 'block0Wide',
  'act3-intro': 'stackPullback',
  'act4-intro': 'dioramaWide',
  'act5-intro': 'dioramaWide',
  'act6-intro': 'outputStageWide',
```

- [ ] **Step 3: Add SCENE_VIA entries so intros arc through a pull-back point**

In the same file, inside the `SCENE_VIA: Record<string, WaypointKey | null> = { ... }` block, append:

```ts
  'act2-intro': 'stackPullback',
  'act3-intro': 'stackPullback',
  'act4-intro': 'dioramaWide',
  'act5-intro': 'dioramaWide',
  'act6-intro': 'stackPullback',
```

(`act1-intro` and `intro-cold-open` don't need vias — the cold open's own camera path is its whole point, and `act1-intro` is the first framed act so no prior scene to arc from.)

- [ ] **Step 4: Verify typecheck**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit
```

Expected: silent (no output, exit 0). If it complains about unknown waypoint keys, make sure the three you referenced (`inputStageWide`, `block0Wide`, `outputStageWide`, `stackPullback`, `dioramaWide`) exist in `WAYPOINTS`. They do — this is just a spot-check.

- [ ] **Step 5: Commit**

```bash
cd /Users/natepegg/Transformer
git add viz/components/movie/modelmap/shared/constants.ts
git commit -m "tour: add waypoint + scene-waypoint entries for intro scenes"
```

---

## Task 2: Create the 3D intro scene components

**Files:**
- Create: `viz/components/movie/modelmap/introScenes3D.tsx`

**Context:** Two components. `SceneIntroReveal` is the cold-open's 3D side — black for the first 14s (while the 2D typing UI does its work), then the stack fades up and the camera holds at `introHero`. `SceneActFraming` is parameterized by `actNumber` and renders a `StackBackdrop` with different regions emphasized per act.

- [ ] **Step 1: Write the new file**

Create `viz/components/movie/modelmap/introScenes3D.tsx` with:

```tsx
'use client'

import type { SceneProps } from './shared/types'
import {
  COLORS,
  N_BLOCKS,
  blockStart,
  BLOCK_LEN,
  SLAB_H,
  INPUT_LEN,
  OUTPUT_LEN,
  TOTAL_X,
  MID_X,
} from './shared/constants'
import { clamp01, smoothstep } from './shared/easing'
import { Label } from './shared/Label'

/**
 * Cold-open 3D side. `ModelMap3D` already renders a dim-mode-B StackBackdrop
 * for every scene, so we don't need to draw one ourselves — the existing
 * backdrop IS the tower visible behind the 2D chat UI. All this component does
 * is fade in two reveal labels over the last ~5s of the 20s scene, so the
 * audience has language attached to what they're now looking at as the 2D
 * dissolves.
 *
 * Drives per-block "wake up" pulses bottom-to-top to feel like the tower
 * comes alive.
 */
export default function SceneIntroReveal({ t, duration }: SceneProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const labelP = smoothstep(0.75, 0.98, p)

  return (
    <group>
      {/* Per-block pulse wave: each block lights up in sequence across t∈[0.7, 0.95]. */}
      {Array.from({ length: N_BLOCKS }).map((_, bi) => {
        const cx = blockStart(bi) + BLOCK_LEN / 2
        const start = 0.7 + (bi / N_BLOCKS) * 0.2
        const end = start + 0.08
        const pop = smoothstep(start, end, p)
        return (
          <mesh key={bi} position={[cx, 0, 0.3]}>
            <planeGeometry args={[BLOCK_LEN * 0.9, SLAB_H]} />
            <meshBasicMaterial
              color={COLORS.blue}
              transparent
              opacity={0.18 * pop}
            />
          </mesh>
        )
      })}

      <Label
        position={[MID_X, SLAB_H + 0.6, 0.3]}
        size={0.22}
        color={COLORS.fg}
        opacity={0.95 * labelP}
      >
        a transformer
      </Label>

      <Label
        position={[MID_X, -SLAB_H - 0.4, 0.3]}
        size={0.12}
        color={COLORS.dim}
        opacity={0.8 * labelP}
      >
        input → 6 blocks → next token
      </Label>
    </group>
  )
}

export type ActFramingRegion =
  | 'base'
  | 'middle-block'
  | 'full-stack'
  | 'tower-tilt'
  | 'upgrade-markers'
  | 'top'

export interface SceneActFramingProps extends SceneProps {
  region: ActFramingRegion
  headline: string
}

/**
 * Shared 3D renderer for the 6 act-intro scenes. A StackBackdrop + a
 * region-specific emphasis overlay + a centered headline. Drives timing from
 * the `t` prop (speed-aware — the SceneClock already multiplies by useSpeed()).
 */
export function SceneActFraming({
  t,
  duration,
  region,
  headline,
}: SceneActFramingProps) {
  const p = clamp01(t / Math.max(0.01, duration))
  const enter = smoothstep(0, 0.2, p)
  const hold = smoothstep(0.2, 0.85, p)

  return (
    // ModelMap3D already renders a StackBackdrop for every scene, so this
    // component only contributes region-specific overlays + the headline.
    // Drawing a second backdrop here would double-up opacity — don't.
    <group>
      {/* Region-specific emphasis */}
      {region === 'base' && (
        <mesh position={[INPUT_LEN / 2, 0, 0.3]}>
          <planeGeometry args={[INPUT_LEN * 0.9, SLAB_H * 1.1]} />
          <meshBasicMaterial
            color={COLORS.violet}
            transparent
            opacity={0.18 * enter}
          />
        </mesh>
      )}

      {region === 'full-stack' && (
        <group>
          {Array.from({ length: N_BLOCKS }).map((_, bi) => {
            const cx = blockStart(bi) + BLOCK_LEN / 2
            // Wave: each block lights up in sequence across the first 75% of the scene.
            const wave = smoothstep(bi / N_BLOCKS, (bi + 1) / N_BLOCKS, p / 0.75)
            return (
              <mesh key={bi} position={[cx, 0, 0.3]}>
                <planeGeometry args={[BLOCK_LEN * 0.92, SLAB_H * 1.05]} />
                <meshBasicMaterial
                  color={COLORS.blue}
                  transparent
                  opacity={0.12 * wave}
                />
              </mesh>
            )
          })}
        </group>
      )}

      {region === 'middle-block' && (
        <mesh position={[blockStart(2) + BLOCK_LEN / 2, 0, 0.3]}>
          <planeGeometry args={[BLOCK_LEN * 0.95, SLAB_H * 1.1]} />
          <meshBasicMaterial
            color={COLORS.blue}
            transparent
            opacity={0.2 * enter}
          />
        </mesh>
      )}

      {region === 'upgrade-markers' && (
        <group>
          {[1, 3, 5].map((bi) => {
            const cx = blockStart(bi) + BLOCK_LEN / 2
            const pop = smoothstep((bi - 1) / 6, bi / 6, p / 0.75)
            return (
              <mesh key={bi} position={[cx, SLAB_H / 2 + 0.25, 0.3]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial
                  color={COLORS.mint}
                  transparent
                  opacity={0.9 * pop}
                />
              </mesh>
            )
          })}
        </group>
      )}

      {region === 'top' && (
        <mesh position={[TOTAL_X - OUTPUT_LEN / 2, 0, 0.3]}>
          <planeGeometry args={[OUTPUT_LEN * 0.9, SLAB_H * 1.1]} />
          <meshBasicMaterial
            color={COLORS.gold}
            transparent
            opacity={0.22 * enter}
          />
        </mesh>
      )}

      {region === 'tower-tilt' && (
        // Tower-tilt: visual bias is handled by the waypoint (dioramaWide).
        // The 3D stage just adds a subtle overall dim so the 2D loss-curve
        // overlay in the sidebar reads as the hero.
        <mesh position={[MID_X, 0, -0.5]}>
          <planeGeometry args={[TOTAL_X, SLAB_H * 2]} />
          <meshBasicMaterial
            color={COLORS.bg}
            transparent
            opacity={0.35 * enter}
          />
        </mesh>
      )}

      <Label
        position={[MID_X, SLAB_H + 0.55, 0.3]}
        size={0.18}
        color={COLORS.fg}
        opacity={0.95 * hold}
      >
        {headline}
      </Label>
    </group>
  )
}

// Per-act wrapper components so modelmap/index.tsx can register one component
// per scene id (matching how every other scene is wired up).
export function SceneAct1Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="base" headline="input · text → numbers" />
}
export function SceneAct2Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="middle-block" headline="one block · attention + FFN" />
}
export function SceneAct3Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="full-stack" headline="six blocks stacked" />
}
export function SceneAct4Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="tower-tilt" headline="how the weights got there" />
}
export function SceneAct5Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="upgrade-markers" headline="what modern models changed" />
}
export function SceneAct6Intro(props: SceneProps) {
  return <SceneActFraming {...props} region="top" headline="the final pick" />
}

```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit
```

Expected: silent. If errors reference missing imports from `./shared/constants`, double-check the import line — the file exports all the listed symbols (confirmed against `viz/components/movie/modelmap/shared/constants.ts`).

- [ ] **Step 3: Commit**

```bash
cd /Users/natepegg/Transformer
git add viz/components/movie/modelmap/introScenes3D.tsx
git commit -m "tour: add 3D intro scene components (reveal + act framing)"
```

---

## Task 3: Register the new 3D components in modelmap/index.tsx

**Files:**
- Modify: `viz/components/movie/modelmap/index.tsx`

**Context:** `modelmap/index.tsx` has a `SCENE_MAP: Record<string, ComponentType<SceneProps>>` that maps every scene id to a 3D component. It also has `MODE_A_SCENES` and `MODE_C_SCENES` sets. Scene ids not in either are treated as mode B (the wide/diorama mode in `sceneMode()`), which is what all our new intros want.

- [ ] **Step 1: Add the import**

Edit `viz/components/movie/modelmap/index.tsx`. Locate the import block (ends before `const SCENE_MAP`). Append:

```tsx
import SceneIntroReveal, {
  SceneAct1Intro,
  SceneAct2Intro,
  SceneAct3Intro,
  SceneAct4Intro,
  SceneAct5Intro,
  SceneAct6Intro,
} from './introScenes3D'
```

- [ ] **Step 2: Register in SCENE_MAP**

In the same file, inside the `SCENE_MAP` object literal (between the existing `'bp-accum': SceneBpAccum,` line and the closing `}`), append:

```ts
  'intro-cold-open': SceneIntroReveal,
  'act1-intro': SceneAct1Intro,
  'act2-intro': SceneAct2Intro,
  'act3-intro': SceneAct3Intro,
  'act4-intro': SceneAct4Intro,
  'act5-intro': SceneAct5Intro,
  'act6-intro': SceneAct6Intro,
```

(No MODE_*_SCENES update needed — all 7 new ids default to mode B, which is correct for all of them.)

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit
```

Expected: silent.

- [ ] **Step 4: Commit**

```bash
cd /Users/natepegg/Transformer
git add viz/components/movie/modelmap/index.tsx
git commit -m "tour: register intro 3D components in SCENE_MAP"
```

---

## Task 4: Create the 2D intro scene components

**Files:**
- Create: `viz/components/movie/introScenes.tsx`

**Context:** The 2D side of the intro scenes. `IntroColdOpenPanel` runs the 4-beat fake-typing-and-dissolve animation using Framer Motion. `ActFramingPanel` renders a small "kicker + headline" card for acts 1/2/3/5. `Act4LossOverlay` and `Act6LogitOverlay` are the hand-crafted overlays for the two special acts.

All four components use Framer Motion delays (mount-time-based), matching the existing pattern in `scenes.tsx`. They are NOT time-prop parameterized — that's for the 3D side.

- [ ] **Step 1: Write the new file**

Create `viz/components/movie/introScenes.tsx` with:

```tsx
'use client'

import { motion } from 'framer-motion'

const ACCENT = {
  blue: '#60a5fa',
  violet: '#a78bfa',
  mint: '#34d399',
  amber: '#f59e0b',
  pink: '#ec4899',
  cyan: '#22d3ee',
  red: '#f87171',
}
const FG = '#f5f5f4'
const DIM = '#737373'

/** --- Cold open (Prologue) --- */

const PROMPT_TEXT = 'What if I asked my AI to finish this sentence: to be, or no'

export function IntroColdOpenPanel() {
  const CHAR_MS = 70           // ~70 ms per keystroke
  const TYPE_START_S = 1.2     // after the chat UI has settled
  const chars = PROMPT_TEXT.split('')
  const TYPING_DONE_S = TYPE_START_S + (chars.length * CHAR_MS) / 1000
  const SEND_PULSE_S = TYPING_DONE_S + 0.4
  const DISSOLVE_S = SEND_PULSE_S + 1.8

  return (
    <div className="relative h-full w-full">
      <motion.div
        className="absolute inset-0 flex items-center justify-center px-10"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: DISSOLVE_S, duration: 1.2, ease: 'easeIn' }}
      >
        <motion.div
          className="w-full max-w-[540px] rounded-[6px] border px-4 py-3.5"
          style={{
            borderColor: 'rgba(115, 115, 115, 0.5)',
            background: 'rgba(18, 18, 21, 0.85)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-h-[22px] font-mono text-[14px]" style={{ color: FG }}>
              {/* per-char fade-in */}
              {chars.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: TYPE_START_S + (i * CHAR_MS) / 1000,
                    duration: 0.001,
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </motion.span>
              ))}
              {/* blinking caret */}
              <motion.span
                className="inline-block align-middle"
                style={{
                  width: 2,
                  height: 16,
                  marginLeft: 2,
                  background: ACCENT.blue,
                }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.0, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
              />
            </div>
            <motion.div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]"
              style={{
                borderColor: ACCENT.blue,
                border: '1px solid',
                color: ACCENT.blue,
                opacity: 0.8,
              }}
              animate={{
                opacity: [0.8, 1, 0.8],
                boxShadow: [
                  '0 0 0 rgba(96,165,250,0)',
                  `0 0 14px rgba(96,165,250,0.6)`,
                  '0 0 0 rgba(96,165,250,0)',
                ],
              }}
              transition={{
                delay: SEND_PULSE_S,
                duration: 1.0,
                ease: 'easeOut',
                repeat: 0,
              }}
            >
              ↵
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Framing caption that fades in as the chat UI dissolves. */}
      <motion.div
        className="absolute inset-x-0 top-10 flex flex-col items-center gap-1.5 text-center"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: DISSOLVE_S + 0.6, duration: 0.8, ease: 'easeOut' }}
      >
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: ACCENT.blue }}>
          prologue
        </div>
        <div className="font-serif text-[22px] italic" style={{ color: FG }}>
          This is what happens inside.
        </div>
        <div className="max-w-[480px] text-[13px]" style={{ color: DIM }}>
          A full transformer, from prompt to next token. Every layer, every head.
        </div>
      </motion.div>
    </div>
  )
}

/** --- Shared panel for act intros (1, 2, 3, 5) --- */

export interface ActFramingPanelProps {
  actLabel: string       // e.g. "Act I"
  headline: string       // one-sentence act intro
  accent: string
}

export function ActFramingPanel({ actLabel, headline, accent }: ActFramingPanelProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-2.5 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
      >
        <div
          className="font-mono text-[10px] tracking-[0.24em] uppercase"
          style={{ color: accent }}
        >
          {actLabel}
        </div>
        <div
          className="font-serif italic text-[28px] leading-tight"
          style={{ color: FG, maxWidth: '640px' }}
        >
          {headline}
        </div>
      </motion.div>
    </div>
  )
}

/** --- Act 4: Training — miniature loss curve sketches in beside the tower --- */

export function Act4LossOverlay() {
  // A single descending curve that draws itself in over ~3s, then holds.
  // Values chosen so the curve feels realistic: steep early drop, long tail.
  const points = [
    [0, 90], [60, 70], [120, 55], [180, 46], [240, 40],
    [300, 36], [360, 33], [420, 31], [480, 30], [540, 29.5],
  ]
  const d = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="font-mono text-[10px] tracking-[0.24em] uppercase" style={{ color: ACCENT.amber }}>
          Act IV
        </div>
        <div className="font-serif italic text-[28px] leading-tight" style={{ color: FG, maxWidth: 640 }}>
          how the weights got there.
        </div>

        <svg width={560} height={120} viewBox="0 0 560 120" className="mt-3">
          <defs>
            <linearGradient id="loss-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ACCENT.amber} stopOpacity="0.35" />
              <stop offset="100%" stopColor={ACCENT.amber} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={d}
            fill="none"
            stroke={ACCENT.amber}
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.0, duration: 3.0, ease: 'easeOut' }}
          />
          <motion.path
            d={`${d} L 540 100 L 0 100 Z`}
            fill="url(#loss-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.6, duration: 0.8 }}
          />
          <text x={6} y={12} fontSize={9} fontFamily="var(--font-mono)" fill={DIM}>loss</text>
          <text x={520} y={115} fontSize={9} fontFamily="var(--font-mono)" fill={DIM}>iters →</text>
        </svg>
      </motion.div>
    </div>
  )
}

/** --- Act 6: Output — a logit distribution sketches in over the tower top --- */

export function Act6LogitOverlay() {
  const bars = [
    { label: 't', h: 0.92, color: ACCENT.blue },
    { label: ' ', h: 0.55, color: DIM },
    { label: 'e', h: 0.42, color: DIM },
    { label: 'h', h: 0.34, color: DIM },
    { label: 'o', h: 0.28, color: DIM },
    { label: 'w', h: 0.22, color: DIM },
    { label: 'a', h: 0.18, color: DIM },
  ]
  const BW = 44
  const GAP = 10
  const H = 120

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="font-mono text-[10px] tracking-[0.24em] uppercase" style={{ color: ACCENT.red }}>
          Act VI
        </div>
        <div className="font-serif italic text-[28px] leading-tight" style={{ color: FG, maxWidth: 640 }}>
          the final pick.
        </div>

        <svg
          width={bars.length * (BW + GAP)}
          height={H + 22}
          viewBox={`0 0 ${bars.length * (BW + GAP)} ${H + 22}`}
          className="mt-3"
        >
          {bars.map((b, i) => (
            <g key={i} transform={`translate(${i * (BW + GAP)}, 0)`}>
              <motion.rect
                x={0}
                y={H - b.h * H}
                width={BW}
                height={b.h * H}
                fill={b.color}
                fillOpacity={i === 0 ? 0.85 : 0.35}
                initial={{ scaleY: 0, transformOrigin: '50% 100%' }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1.0 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
              />
              <text
                x={BW / 2}
                y={H + 16}
                textAnchor="middle"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill={i === 0 ? FG : DIM}
              >
                {b.label === ' ' ? '␣' : b.label}
              </text>
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck + build**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit && npm run build
```

Expected: typecheck silent; build finishes showing 5 static routes (`/`, `/_not-found`, `/opengraph-image`, `/tour`, `/twitter-image`).

- [ ] **Step 3: Commit**

```bash
cd /Users/natepegg/Transformer
git add viz/components/movie/introScenes.tsx
git commit -m "tour: add 2D intro scene components (cold open + act framing)"
```

---

## Task 5: Update transitions.ts — add 7 new INCOMING_KIND entries, flip 4 existing

**Files:**
- Modify: `viz/components/movie/transitions.ts`

**Context:** The banner that names each act fires whenever `incomingKindFor(sceneId)` returns `'act-change'`. Currently `layernorm`, `stack`, `loss`, and `rope` have that kind. Our new intros need to take over the banner for each act, and those four existing scenes need to flip to `'forward-flow'` so the banner doesn't fire twice per act.

- [ ] **Step 1: Replace the INCOMING_KIND object literal**

Edit `viz/components/movie/transitions.ts`. Locate the `export const INCOMING_KIND: Record<string, TransitionKind> = { ... }` block. Replace the entire object literal (from `{` to matching `}`) with:

```ts
export const INCOMING_KIND: Record<string, TransitionKind> = {
  // --- intros (all fire the act-change banner) ---
  'intro-cold-open': 'act-change',
  'act1-intro': 'act-change',
  'act2-intro': 'act-change',
  'act3-intro': 'act-change',
  'act4-intro': 'act-change',
  'act5-intro': 'act-change',
  'act6-intro': 'act-change',
  // --- existing scenes ---
  tokens: 'within-part',
  bpe: 'within-part',
  embed: 'forward-flow',
  positional: 'forward-flow',
  layernorm: 'forward-flow',  // was 'act-change' — intro now owns the banner
  qkv: 'forward-flow',
  attn: 'within-part',
  multi: 'within-part',
  ffn: 'forward-flow',
  'ffn-feature': 'within-part',
  gelu: 'within-part',
  stack: 'forward-flow',      // was 'act-change' — intro now owns the banner
  sample: 'forward-flow',
  kvcache: 'within-part',
  loss: 'forward-flow',       // was 'act-change' — intro now owns the banner
  'loss-seq': 'within-part',
  'loss-batch': 'within-part',
  backprop: 'forward-flow',
  'bp-jacobian': 'dive-in',
  'bp-accum': 'within-part',
  training: 'forward-flow',
  'gd-ravine': 'within-part',
  'gd-adam': 'within-part',
  rope: 'forward-flow',       // was 'act-change' — intro now owns the banner
  modern: 'within-part',
  output: 'pull-back',
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit
```

Expected: silent.

- [ ] **Step 3: Commit**

```bash
cd /Users/natepegg/Transformer
git add viz/components/movie/transitions.ts
git commit -m "tour: flip act-opening scenes to forward-flow; intros own the banner"
```

---

## Task 6: Wire 7 new scenes into SCENES[] in app/tour/page.tsx

**Files:**
- Modify: `viz/app/tour/page.tsx`

**Context:** Seven entries in the `SCENES` array. Insert in reading order: cold open first, then act1-intro before `tokens`, act2-intro before `layernorm`, act3-intro before `stack`, act4-intro before `loss`, act5-intro before `rope`, act6-intro before `output`. Add a new section constant `PROLOGUE` and the four imports from the new files.

- [ ] **Step 1: Add the imports + section constant**

Edit `viz/app/tour/page.tsx`. Locate the top import block. Append below the existing `import { ... } from '@/components/movie/scenes'`:

```tsx
import {
  IntroColdOpenPanel,
  ActFramingPanel,
  Act4LossOverlay,
  Act6LogitOverlay,
} from '@/components/movie/introScenes'
```

Locate the section constants (the `ACT_I`, `ACT_II`, ... block). Add above `ACT_I`:

```ts
const PROLOGUE = 'Prologue'
```

- [ ] **Step 2: Insert the cold open entry at the top of SCENES[]**

In `app/tour/page.tsx`, locate the line `const SCENES: MovieScene[] = [`. The next line is `  // =============== ACT I — INPUT ===============`. Insert BEFORE that comment the following entry (and new ACT-0 comment):

```tsx
  // =============== PROLOGUE ===============
  {
    id: 'intro-cold-open',
    section: PROLOGUE,
    kicker: 'the setup',
    title: 'This is what happens inside.',
    caption: 'A full transformer, from prompt to next token. Every layer, every head.',
    accent: ACCENT.blue,
    durationMs: 20000,
    details: `Every time you send a prompt to an AI, it runs through a stack like this. We're going to walk through it end-to-end — starting with the raw text, ending with the next character it picks.`,
    render: () => <IntroColdOpenPanel />,
  },

```

- [ ] **Step 3: Insert act1-intro before the `tokens` scene**

In `app/tour/page.tsx`, find `id: 'tokens',`. The scene object starts with `{` just above it. Insert this new scene object BEFORE the `tokens` scene:

```tsx
  {
    id: 'act1-intro',
    section: ACT_I,
    kicker: 'act one',
    title: 'First: text becomes numbers.',
    caption: 'Your prompt has to be turned into integers before the network can do math on it.',
    accent: ACCENT.violet,
    durationMs: 10000,
    details: `The input stage. Three small steps: split the string into tokens, look up each token's vector in an embedding table, and add a position encoding so the network can tell what came first.`,
    render: () => (
      <ActFramingPanel actLabel="Act I · Input" headline="First: text becomes numbers." accent={ACCENT.violet} />
    ),
  },
```

- [ ] **Step 4: Insert act2-intro before the `layernorm` scene**

Find `id: 'layernorm',`. Insert BEFORE it:

```tsx
  {
    id: 'act2-intro',
    section: ACT_II,
    kicker: 'act two',
    title: 'Now zoom into one block.',
    caption: 'Attention first, then a small feedforward net. Every block runs the same two sub-layers.',
    accent: ACCENT.blue,
    durationMs: 12000,
    details: `A transformer block is a fixed recipe: normalize, run multi-head attention, add the result back to the residual stream, normalize again, run a feedforward net, add that back too. Every one of the six blocks does exactly this.`,
    render: () => (
      <ActFramingPanel actLabel="Act II · Inside a Block" headline="Attention, then a small feedforward net." accent={ACCENT.blue} />
    ),
  },
```

- [ ] **Step 5: Insert act3-intro before the `stack` scene**

Find `id: 'stack',`. Insert BEFORE it:

```tsx
  {
    id: 'act3-intro',
    section: ACT_III,
    kicker: 'act three',
    title: 'That block, six times over.',
    caption: 'One signal climbs through six identical blocks, each adding its own refinement.',
    accent: ACCENT.mint,
    durationMs: 10000,
    details: `The residual stream is a 384-dim vector per token that flows through all six blocks. Each block reads it, computes a correction, adds that correction back. By the top, the stream carries everything the model knows about "what comes next."`,
    render: () => (
      <ActFramingPanel actLabel="Act III · The Full Stack" headline="One signal climbing through six blocks." accent={ACCENT.mint} />
    ),
  },
```

- [ ] **Step 6: Insert act4-intro before the `loss` scene**

Find `id: 'loss',`. Insert BEFORE it:

```tsx
  {
    id: 'act4-intro',
    section: ACT_IV,
    kicker: 'act four',
    title: 'How the weights got there.',
    caption: 'The model above was trained. Here is what "trained" means.',
    accent: ACCENT.amber,
    durationMs: 12000,
    details: `Training means: run a forward pass, measure how wrong the prediction was (loss), compute which weights are to blame (backprop), nudge them slightly (gradient descent). Repeat a few hundred thousand times.`,
    render: () => <Act4LossOverlay />,
  },
```

- [ ] **Step 7: Insert act5-intro before the `rope` scene**

Find `id: 'rope',`. Insert BEFORE it:

```tsx
  {
    id: 'act5-intro',
    section: ACT_V,
    kicker: 'act five',
    title: 'What modern models changed.',
    caption: 'Same skeleton. A few surgical upgrades that make real-world LLMs work.',
    accent: ACCENT.mint,
    durationMs: 10000,
    details: `The architecture you just saw is GPT-2 vintage (2019). Llama 3 and friends keep the same backbone but swap in: rotary position embeddings (RoPE), grouped-query attention (GQA), SwiGLU activations, RMSNorm. Each is a small local change.`,
    render: () => (
      <ActFramingPanel actLabel="Act V · Modern Upgrades" headline="Same skeleton, a few surgical upgrades." accent={ACCENT.mint} />
    ),
  },
```

- [ ] **Step 8: Insert act6-intro before the `output` scene**

Find `id: 'output',`. Insert BEFORE it:

```tsx
  {
    id: 'act6-intro',
    section: ACT_VI,
    kicker: 'act six',
    title: 'And the final pick.',
    caption: 'The network outputs a probability over every possible next token. One gets chosen.',
    accent: ACCENT.red,
    durationMs: 10000,
    details: `The top of the stack produces one vector per token position. We only care about the last one — it represents the model's best guess at what should come next. A final linear layer projects that vector to a vector of size vocab_size; softmax turns it into probabilities; we sample one.`,
    render: () => <Act6LogitOverlay />,
  },
```

- [ ] **Step 9: Verify typecheck + build**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit && npm run build
```

Expected: typecheck silent; build shows 5 static routes.

- [ ] **Step 10: Visual smoke test**

```bash
cd /Users/natepegg/Transformer/viz && npm run dev
```

Open `http://localhost:3000/tour`. Verify:
1. The tour starts with the cold-open scene — fake chat input, text types in, Enter pulses, dissolves to the 3D reveal with "This is what happens inside." title.
2. Each act starts with its intro (look for "ACT I/II/III/IV/V/VI" banner and the matching headline).
3. The banner for each act fires once (on the intro), not twice (not again on `tokens`, `layernorm`, `stack`, `loss`, `rope`).
4. `tokens` picks up right after `act1-intro` without a second banner.

If any banner fires twice, re-check Task 5's flip of `layernorm/stack/loss/rope` to `forward-flow`.

- [ ] **Step 11: Commit**

```bash
cd /Users/natepegg/Transformer
git add viz/app/tour/page.tsx
git commit -m "tour: wire 7 intro scenes into SCENES[] (cold open + 6 act intros)"
```

---

## Task 7: Final verification + cleanup

**Files:** none modified — pure verification pass.

- [ ] **Step 1: Playback test at 1x / 2x / 3x**

With `npm run dev` still running, at `http://localhost:3000/tour`:
1. Click the speed toggle (should be visible in the player header — 1x / 2x / 3x per prior work).
2. Play through the entire movie at each speed. Verify no scene cuts off before its content finishes. If any intro cuts off at 2x/3x, it means a scene's timing is keyed to `useEffect`/`setInterval` rather than `elapsed / duration × useSpeed()`. The 3D intros use `t` (already speed-aware via `SceneClock`). The 2D intros use Framer Motion `transition.delay`, which is NOT speed-aware. If the 2D cold-open typing runs past the scene's `durationMs` at 3x, bump `durationMs` up or shorten the `TYPE_START_S`/`CHAR_MS` constants.

- [ ] **Step 2: Final build + typecheck**

```bash
cd /Users/natepegg/Transformer/viz && npx tsc --noEmit && npm run build
```

Expected: typecheck silent; build clean.

- [ ] **Step 3: Stop dev server**

```bash
# in the terminal where dev is running:
# Ctrl+C
```

- [ ] **Step 4: Tag + optional push**

```bash
cd /Users/natepegg/Transformer
git log --oneline -10   # sanity check — 7 new commits
# push only if you've been pushing throughout
git push origin main
```

---

## Out of scope (do NOT do in this plan)

- Adding narration / TTS / voiceover. Text-only.
- Replacing existing `SceneStack` or other "full-stack" scenes with the new framing — keep them.
- Refactoring `MovieOrchestrator.tsx` banner timing. The 2.5s window is fine for our headlines.
- Adding more waypoints beyond `introHero`. The existing pull-back waypoints are sufficient.
- Touching `scenes.tsx` or `modelmap/scene*_*.tsx` files. If a scene needs tweaking to match the new intros, that's a separate spec.

## Risk / rollback

Each task commits on its own. To back out the entire feature:

```bash
git log --oneline | head -12   # find the last commit before Task 1
git reset --hard <that-sha>
```

Individual rollback: comment out the offending entry in `SCENES[]` and re-run `npm run build`. The tour will skip that scene and continue.
