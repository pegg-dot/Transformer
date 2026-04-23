# Tour Intro + Per-Act Framing — Design

**Date:** 2026-04-21
**Author:** Nate + Claude
**Status:** Approved (design phase) — implementation plan pending

## Problem

The current `/tour` movie drops viewers straight into Scene 1 (`tokens`) with zero setup. Someone who doesn't already know what a transformer is has no frame for why they're looking at a grid of characters mapping to numbers. There is also no orientation inside the larger structure — by Act IV the viewer has lost the sense of where we are in the full system.

## Goal

Add two layers of framing to the existing 25-scene movie, **without touching any existing scene**:

1. **One cold-open scene before Act I** that starts with a human-recognizable prompt UI and reveals the 3D transformer that will answer it.
2. **Six act-intro scenes** (one at the head of each act) that pull the camera out of whatever it's currently close on, name the region of the transformer this act lives in, then dive back in.

Everything is additive to `SCENES[]` in `app/tour/page.tsx`, plus a small edit to `transitions.ts`'s `INCOMING_KIND` map (the intros need `'act-change'` entries; the existing first-scene-of-each-act entries — `tokens`, `layernorm`, `stack`, `loss`, `rope`, `output` — must flip from `'act-change'` to `'forward-flow'` so the banner doesn't fire twice per act). No changes to `MovieOrchestrator.tsx` or `components/movie/scenes.tsx`.

## Non-goals

- Refactoring the existing 25 scenes.
- Adding narration / voiceover (text-only captions stay consistent with current style).
- Changing the act structure, scene count, or banner mechanism.
- Building a reusable "camera choreography" framework — the cold open and Act 4/6 are one-offs.

## Cold open — `intro-cold-open`

One scene, ~20s, four internal beats driven by elapsed time.

**Scene descriptor:**

```ts
{
  id: 'intro-cold-open',
  section: 'Prologue',
  kicker: 'the setup',
  title: 'This is what happens inside.',
  caption: 'A full transformer, from prompt to next token. Every layer, every head.',
  accent: ACCENT.blue,
  durationMs: 20000,
  kind: 'act-change',   // fires the 2.5s banner on entry
  details: `Every time you send a prompt to an AI, it runs through a stack like this. We're going to walk through it end-to-end — starting with the raw text, ending with the next character it picks.`,
  render: () => <IntroColdOpen />,
}
```

**Four beats inside `<IntroColdOpen />`:**

| Beat | t (s) | What happens |
|---|---|---|
| 1 | 0.0–4.0 | Fake chat panel fades in: dark card, rounded border, empty single-line input, blinking caret. Unbranded. A subtle "send" button icon on the right. |
| 2 | 4.0–12.5 | Text auto-types into the input at ~70 ms/char (use a char-index keyed to elapsed time, not a setInterval loop — matches the speed-aware pattern the rest of the movie uses): `What if I asked my AI to finish this sentence: to be, or no`. Caret stays visible at the end. |
| 3 | 12.5–14.5 | Send button pulses once. Input field glows at accent.blue for ~1s. |
| 4 | 14.5–20.0 | Chat card dissolves (opacity 1 → 0 over 1.2s). 3D transformer tower enters from the depth plane, settles into its full silhouette. Title + caption overlay crossfade in at t=16.0s. |

**2D panel** (left "story sidebar"): the chat UI itself, rendered inline.
**3D stage** (right main area): black/fog for beats 1–3. On beat 4, camera pulls from deep-in (where beat-1 token-view would have sat) out to a wide overview of the full stack, with the tower rendered using existing shared geometry (`StackBackdrop` + block slabs).

## Act intros — 6 new scenes

All six share the same declarative shape. Each scene is 10–12s, `kind: 'act-change'`, and declares an `actFraming` payload consumed by the shared component:

```ts
type ActFramingSpec = {
  actNumber: 1 | 2 | 3 | 4 | 5 | 6
  headline: string         // one sentence, declarative
  highlightRegion: 'base' | 'middle-block' | 'full-stack' | 'tower-tilt' | 'upgrade-markers' | 'top'
  accent: string           // from ACCENT palette
  customOverlay?: React.FC // escape hatch for Acts 4 and 6
}
```

**The six specs:**

| id | Section | Headline | Region / overlay | Duration |
|---|---|---|---|---|
| `act1-intro` | `ACT_I` | "First: text becomes numbers." | `base` — bottom ~20% of tower glows; rows of token-ID integers stream at the base. | 10s |
| `act2-intro` | `ACT_II` | "Now zoom into one block. Attention, then a feedforward net." | `middle-block` — block index 2 lifts out of the stack, enlarges 2×, others dim. | 12s |
| `act3-intro` | `ACT_III` | "That block, six times over — one signal climbing through." | `full-stack` — all 6 blocks pulse bottom-to-top in a 3s wave. | 10s |
| `act4-intro` | `ACT_IV` | "How the weights got there in the first place." | `tower-tilt` — tower rotates 20° to 3/4 view; a 2D loss curve sketches in beside it (custom overlay). | 12s |
| `act5-intro` | `ACT_V` | "What real models in 2026 changed." | `upgrade-markers` — blue markers pop in at positions that map to RoPE, GQA, etc. | 10s |
| `act6-intro` | `ACT_VI` | "And the final pick — the next token." | `top` — top block glows; a logit-distribution bar chart sketches above it (custom overlay). | 10s |

## Component split

Acts 1, 2, 3, 5 share a single `<ActFramingScene actNumber={n} highlightRegion={r} accent={c} />` component. Acts 4 and 6 reuse the same shell but plug in a `customOverlay` prop for their unique 2D elements (loss curve, logit chart).

**Rationale:** 4/6 want visuals that don't fit a "highlight-a-region" pattern. Forcing them through the shared template would either bloat the template with act-specific branches or produce a weaker visual for those acts. The escape hatch keeps the common case DRY and the one-offs expressive.

## File layout

New files:

- `components/movie/introScenes.tsx` — 2D sidebar versions (pure React/Framer): `IntroColdOpenPanel`, `ActFramingPanel`, and the two custom overlays `Act4LossOverlay`, `Act6LogitOverlay`.
- `components/movie/modelmap/introScenes3D.tsx` — 3D main-stage versions: `SceneIntroReveal` (beats 1–4 of cold open) and `SceneActFraming` (parameterized).

Edited:

- `app/tour/page.tsx` — 7 new entries in `SCENES[]` (1 before the existing Act I, 1 at the head of each act). Add `'Prologue'` as a section constant. Register 7 new ids in the scene list. Imports from the two new files.
- `components/movie/modelmap/index.tsx` — register the 2 new 3D components in `SCENE_MAP` and add their ids to the right `MODE_*` set (cold open is its own mode; act intros are mode `'B'` — wide stack view — matching how `SceneStack` is classified).
- `components/movie/transitions.ts` — add 7 `'act-change'` entries to `INCOMING_KIND` for the new scenes. Flip the six existing act-opening scenes (`tokens`, `layernorm`, `stack`, `loss`, `rope`, `output`) from `'act-change'` to `'forward-flow'` so the banner only fires on the intro, not again on the first real scene of the same act.

## Animation / timing rules (carried over from existing scenes)

- All time-driven animation uses `elapsed / durationMs` as the source of truth, multiplied by `useSpeed()` — matches existing scenes so 2x/3x playback still completes on time.
- No `setInterval` loops. Single-pass animations only. Match the pattern fixed in the prior "scenes cut off at 2x/3x" audit.
- Each scene finishes its visual animation at ~75% of `durationMs`; the last ~25% is a readable hold. Matches the existing convention.

## Runtime impact

- Before: 25 scenes, total ~8.5 min.
- After: 32 scenes, total ~10 min. (+20s cold open, +64s of act intros.)
- No bundle impact beyond two small component files (~20 KB of JSX + no new deps).

## Risk / rollback

- The only existing files touched are `app/tour/page.tsx` (adds 7 array entries) and `modelmap/index.tsx` (registers 2 new ids). Both are contained list additions — if an intro scene is broken we can comment out its entry and the movie plays end-to-end as before.
- The shared `<ActFramingScene>` reuses existing `StackBackdrop` / block-slab geometry. No new 3D assets.
- `kind: 'act-change'` is already exercised on today's 5 act boundaries — no new transition machinery.

## Verification gate before calling this done

- [ ] All 32 scenes play in order at 1x, 2x, 3x without cut-offs.
- [ ] Cold-open typing finishes before the dissolve (beats 2 and 4 don't overlap).
- [ ] Each act intro fires the 2.5s banner once. The first "real" scene of each act (tokens, layernorm, stack, loss, rope, output) does NOT re-fire the banner, because `INCOMING_KIND` for those six was flipped to `'forward-flow'`.
- [ ] `npm run build` clean, `npx tsc --noEmit` clean.
- [ ] Total /tour runtime is ~10 min ±15s.
