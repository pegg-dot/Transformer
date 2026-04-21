# Visualizer Vision

> Reference doc for Phase 2 and onward. When polish and UX decisions come up, this is the bar. Read before starting Phase 2.

The visualizer is NOT a dashboard. It's a **teaching instrument**. A visitor — VC, researcher, or curious engineer — should leave with a deeper mental model of transformers than they arrived with. Every design decision is judged against that outcome.

## Core principles

1. **Every visual corresponds to real computation.** No decorative animation. If something moves, it's because a real tensor moved.
2. **Information density over flash.** Don't be impressive. Be clarifying.
3. **Progressive disclosure.** First impression simple. Power users expand panels.
4. **Narrative-first.** A scrollable story-mode walks a first-time visitor through one prompt end-to-end, annotated. Free-play dashboard is the *second* thing they see.
5. **"Explain this" everywhere.** Every panel has a tiny info button that pops up: what you're seeing, why it matters, what to look for.
6. **Not too fast.** Default animation speed is deliberate. A speed slider is always visible. Step-through mode for deep inspection.

## Non-negotiables (from user's stated vision)

- **Animations feel good** — easings, choreographed transitions, no jarring pops. Framer Motion with custom spring configs.
- **Pop-ups / tooltips** — "what am I looking at" on every panel.
- **Layered explanation** — Beginner mode (plain English, no jargon) vs Advanced mode (Q/K/V, logits, tensor shapes) toggle.
- **Scrollable story mode** — advances the model through one prompt as the visitor scrolls, Distill-style.
- **Visually polished** — dark mode, monospace for tokens, careful color scales, clean typography.
- **Math on demand** — button on every panel to show the equation overlay.

## Reference artifacts (the bar)

- **Distill.pub** — scrollytelling + rigorous viz. https://distill.pub/
- **Anthropic interpretability** — https://transformer-circuits.pub/. Clean, annotated, layered.
- **bbycroft.net/llm** — canonical "see a transformer compute" viz.
- **Polo Club transformer-explainer** — https://poloclub.github.io/transformer-explainer/. Strong interactivity.
- **3Blue1Brown** — animation pacing and narrative voice.
- **FT Visual Storytelling** — narrative structure.

If your build feels weaker than any of the above, keep polishing.

## Animation design

Use Framer Motion. Every transition has:
- **Easing:** `ease-out` for entrances, `ease-in-out` for state changes. No linear.
- **Duration:** 300–600ms for UI transitions, 1.2–2.5s for pedagogical "watch the computation" animations.
- **Spring config:** `{ stiffness: 100, damping: 15 }` as default.
- **Choreography:** staggered children (50–100ms stagger) for lists/grids.
- **Global speed multiplier:** 0.25× / 0.5× / 1× / 2× / 4× user-controllable, affects all animations.

## Progressive disclosure

Two modes, toggleable in the top bar:
- **Beginner** — plain-English labels, tooltips auto-open on hover, math hidden behind "show math" buttons, jargon replaced ("attention score" → "how much token A cares about token B").
- **Advanced** — full vocab, tensor shapes always shown, raw matrices viewable, no hand-holding.

Default is Beginner on first visit. Persisted via localStorage.

## The "explain this" pattern

Every visualization panel has a 16×16 "?" icon in its top-right. Click opens a popover with three sections:
1. **What you're seeing** — one-sentence description.
2. **Why it matters** — role this plays in how the model works.
3. **What to look for** — specific patterns to spot ("if the diagonal is bright, this head has probably learned positional attention").

Popovers close on outside click or Escape. Non-modal; you can interact with the viz while open.

## Story / narrative mode

Separate route at `/tour`. Layout: sticky viz canvas on the left, scrolling narrative text on the right (Distill-style). Scrolling advances the model through one curated prompt (e.g. "ROMEO:", 30–60 tokens). At each scroll step:
- 1–2 sentences of copy on the right.
- Relevant panels on the left highlight / animate.
- Irrelevant panels dim to 30% opacity.

**Story mode is the first thing a first-time visitor sees.** Free-play dashboard lives at `/play`.

## Visual identity

- **Theme:** Dark default (`#0a0a0b` bg, `#e7e7e7` text). Light mode optional, de-prioritized.
- **Typography:** Geist Sans for UI, Geist Mono for tokens / numbers / tensor shapes.
- **Color scales:**
  - Attention weight: single-hue blue `#0f172a → #60a5fa`, 0 to 1.
  - Pos/neg activations: diverging `red → white → blue`, centered at 0.
  - Never rainbow for ordinal values.
- **Borders:** 1px solid at subtle opacity. Linear.app-style.
- **Shadows:** virtually none. Flat + color for depth, not drop shadows.
- **Spacing:** 8px grid. Generous padding. Nothing cramped.

## 3D / spatial mode

An optional 3D mode renders the model as a physical object you can orbit around. Three.js + React Three Fiber. Toggle in the top bar: **2D (default) ↔ 3D**.

What's 3D-worthy (animation actually helps):
- **The full stack as a tower.** Embeddings at the bottom, 6 blocks stacked, logits at the top. Camera orbits; click any block to zoom in.
- **Residual stream as a glowing ribbon** threading up through the tower — you *see* information flowing layer-to-layer.
- **Attention as arcs in 3D space** between token columns. Arc thickness = weight. Multi-head = translucent layered arcs.
- **Embeddings in 3D projection.** Run UMAP/t-SNE on the vocab offline, render as a point cloud. Current token lights up; nearest neighbors glow.

What stays 2D (3D would hurt clarity):
- Q/K/V matrices and attention heatmaps. 2D grids read faster than any 3D gimmick.
- Tensor shape readouts and logit distributions. Text and bars.

Rule: **3D when spatial structure is the point; 2D when the data is a matrix.** Never 3D for decoration.

## Preset prompt gallery

Before typing, visitors see a row of clickable preset prompts:
- "ROMEO:"
- "HAMLET:"
- "Hark!"
- "Enter a"
- Custom prompt input.

Each preset pre-loads an `activations.json` so inference is instant (no ONNX warm-up). Critical for first-impression: the viz does something interesting within 2 seconds of arrival.

## Record / share

Every panel has a "Record 10s" button that captures the panel to MP4 or GIF. Instantly shareable on X / LinkedIn. Built-in evergreen marketing.

## What "done" feels like

If a senior researcher opens the URL and spends 5+ minutes without asking "what am I looking at?" — the viz is done. If they DM it to someone saying "you have to see this" — we shipped.

## What this is NOT

- A real LLM chatbot. (Model produces gibberish. That's fine; the viz is the artifact.)
- A production inference backend. Educational toy.
- A model-training UI. Training happens offline in Python.
- An interpretability research tool. Not yet. Phase 3+ may add interp probes.

## Phase mapping

| Phase | What contributes to the vision |
|---|---|
| 1 | Char-level tokenization (keeps viz tokens readable) |
| 1.5 | `activations.json` schema (every field drives a panel) |
| 2 | All of the above is built here |
| 3 | A/B toggle classic vs modern — the *comparison* is itself pedagogy |
| 4 | Dropdown to swap in a fine-tuned model |
| 5 | Reasoning trace visualization (thought bubbles over generation) |
| 6 | Public launch + demo video + blog = distribution |
