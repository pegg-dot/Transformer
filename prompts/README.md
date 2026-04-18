# Prompts

Kick-off prompts for each phase. Paste the whole file content (everything below its `---` divider) into Claude as your opening message.

Each prompt is structured as a **role + protocol + Socratic loop** designed to force understanding alongside implementation.

## Current prompts

| File | Phase | What it does |
|---|---|---|
| `phase-1-model.md` | Phase 1 | Build nanoGPT from scratch — Claude scaffolds, you hand-type the model |
| `phase-1.5-instrumentation.md` | Phase 1.5 | Wire forward hooks to capture activations + export ONNX |
| `phase-2-visualizer.md` | Phase 2 | Build the Next.js visualizer with transformers.js + D3 + R3F |
| `phase-3-llama3.md` | Phase 3 | Modernize to Llama 3 architecture (RoPE, RMSNorm, SwiGLU, GQA, KV cache) + A/B toggle in viz |

## How to use

1. Make sure Phase N-1 is complete (check `PROJECT_STATE.md`).
2. Open Claude in the repo context.
3. Open the prompt file for the phase you're starting.
4. Copy everything below its `---` divider.
5. Paste into Claude as your first message.
6. Build.
7. At the end of the session, update `PROJECT_STATE.md`.

## How these prompts are designed

Every prompt enforces a **build → explain → probe** loop:
1. Claude frames the concept
2. Code is written (by Claude, or by you for model components in Phase 1)
3. Claude explains it with tensor shapes
4. Claude probes you with a senior-researcher-caliber question
5. You answer; Claude judges honestly and re-teaches if shallow
6. Repeat

The failure mode of AI-paired learning is shipping code faster than understanding. These prompts counter that.

If Claude lets you off easy, say: *"you accepted that too easily, probe me harder."*

## Tweaking

Feel free to edit prompts before pasting:
- Adjust target model size
- Swap the dataset
- Change compute assumptions
- Add constraints specific to your setup

Don't remove the Socratic loop. That's the load-bearing part.

## Future prompts (not yet written)

- Phase 4: Fine-tune with LoRA + Unsloth
- Phase 5: RLVR with GRPO
- Phase 6: Public launch + writeup

Written once the preceding phase ships.
