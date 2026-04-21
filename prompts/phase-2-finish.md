# Phase 2 — Finish Pass (Perf + OG + Deploy)

Paste everything below the `---` into Claude Code in the `viz/` session. Additive-only session — nothing already working gets deleted or refactored.

---

# MISSION

Phase 2 finish-pass. Three goals in one session:

1. **Performance audit + compression** — figure out what we're about to ship, and shrink the 93 MB of assets as much as possible without changing what the viz does.
2. **OG image + social metadata** — make the URL render as a proper preview card in iMessage, Slack, X, LinkedIn. Without this, no one clicks when the link is shared.
3. **Vercel deploy** — ship the public URL tonight. Imperfect is fine. The URL existing is what matters.

End state after this session: a public URL on Vercel. Phase 2 called done.

# HARD RULES — READ TWICE

1. **ADDITIVE ONLY. NO DELETION. NO REWRITES.** Every panel currently working on localhost must still work identically after this session: tokenization, embeddings, attention grid, FFN, residual stream, KV cache, decoding, Beginner/Advanced toggle, Explain-this popovers, `/tour` route, live streaming generation — all of it. If something looks like it "should" be refactored, **STOP and ask Nate first**. Don't assume.
2. **Benchmark first, change second.** Get real size numbers before touching anything. Post numbers before decisions.
3. **Verify after every change.** `npm run build` must stay clean. Both `/` and `/tour` must still render and generate in dev. Re-run the build every time you think you finished a milestone.
4. **No new runtime dependencies without justification.** Dev deps for OG image or compression tooling are fine. UI libraries and CSS frameworks are not.
5. **Commit per milestone.** One commit per M1, M2, M3, M4, M5, so rollback is granular if anything breaks on production.

# MILESTONES

## M1 — Performance audit (measure only, don't change anything yet)

Produce a written report at `viz/PERF_AUDIT.md`:

- `npm run build` output: total JS bundle size per route, largest chunks, first-load JS for `/` and `/tour`
- `ls -la viz/public/*` sizes: `model.onnx`, `activations.json`, WASM files, any other statics
- Total static asset footprint vs. Vercel Hobby tier deployment limits (check: https://vercel.com/docs/deployments/limits — is our total under 100 MB uncompressed?)
- Network waterfall sketch for first load of `/` and `/tour`: what requests fire, in what order, approximate sizes
- Does Vercel serve `application/json` with Brotli automatically? (Yes — but confirm. That changes M2 significantly.)

Post the numbers in chat before touching anything. Wait for Nate to nod before proceeding to M2.

## M2 — Shrink activations.json (without changing its contents)

The 51 MB `activations.json` is the biggest concern. Priority order:

a. **Verify Vercel auto-compression.** Deploy a test, look at the network tab's `content-encoding: br` header and transferred size. If Vercel already compresses JSON to ~5–8 MB on the wire, the problem is mostly solved at zero cost.
b. **If a) isn't enough or to be safe:** Float16 quantization on the bulk float arrays (attention Q/K/V/scores/output, FFN activations, residual stream). Keep token IDs and metadata as Float32. Halves uncompressed size. Write a `scripts/compress_activations.py` that produces `activations.compact.json` alongside the original; update the viz's fetch path to prefer the compact version.
c. **Chunk by layer (optional, only if perceived load time is still slow)** — split into `layer_0.json`, `layer_1.json`, etc. and lazy-load as panels scroll into view.

Target: <10 MB on the wire total.

Keep the original 51 MB file on disk untouched — it's the canonical artifact. Compressed versions are build outputs.

## M3 — Check model.onnx (optional optimization)

42 MB ONNX is probably fine for a 10.79M-param char-level model. Verify:

- Is it dynamically quantizable (INT8) without quality loss? Use `onnxruntime.quantization.quantize_dynamic`. If the quantized model's output diverges >1e-3 from the baseline on a test prompt, **revert**. Quality > size.
- Either way, configure `Cache-Control: public, max-age=31536000, immutable` on `model.onnx` in `vercel.json`. First load is slow, every subsequent is instant.

## M4 — OG image + social metadata

Next 16 file convention. Create:

1. `app/opengraph-image.tsx` — uses `ImageResponse` from `next/og`. 1200×630. Dark bg (#0a0a0b), white text, accent blue (#60a5fa).
   - Headline: "Watch a transformer think."
   - Subhead (muted): "A char-level GPT, visualized live in your browser."
   - Background: subtle attention heatmap pattern in low-contrast blue. Use the real attention data from activations.json if easy; otherwise a programmatic grid of fading cells.
   - Signature bottom-right, 12px: "by Nate"

2. `app/twitter-image.tsx` — same design, same dimensions.

3. Update `app/layout.tsx` metadata:
```ts
export const metadata: Metadata = {
  title: "Watch a transformer think",
  description: "A char-level GPT trained on Shakespeare, visualized live in your browser. Attention heatmaps, KV cache, decoding — built from scratch.",
  openGraph: {
    title: "Watch a transformer think",
    description: "...",
    url: "https://<your-vercel-domain>",
    siteName: "transformer-viz",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Watch a transformer think",
    description: "...",
  },
};
```

Verify by viewing page source on the built HTML: `<meta property="og:image">` should point to the generated image. After deploy, paste the URL into Slack to visually confirm.

## M5 — Vercel deploy

1. **Git check.** Verify the repo has a clean tree and is pushed to GitHub. If no GitHub repo yet:
   - `gh repo create transformer-viz --public --source=. --remote=origin --push`
   - (or manually create on github.com and `git remote add` + `git push`)

2. **`vercel.json` at repo root (or `viz/vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/model.onnx",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/activations(.*).json",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/ort/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

3. **Connect Vercel.** Either via `vercel` CLI (`npm i -g vercel && vercel`) or the web dashboard. Root directory: `viz/`. Framework preset: Next.js (auto-detected). Build/output commands: defaults.

4. **Deploy.** Grab the URL. Post it in chat.

5. **Smoke-test the production URL in an incognito window, ideally on both desktop and mobile:**
   - `/` loads, streaming generation works, all 7 panels render
   - `/tour` loads, scroll advances through narrative
   - Beginner/Advanced toggle persists via localStorage
   - Explain-this popovers open on every panel
   - Network tab: `activations.json` transfers at <10 MB compressed
   - Paste the URL into Slack or iMessage: OG card appears with the image

6. **Update `PROJECT_STATE.md`:**
   - Flip Phase 2 status to ✅ if everything above passes. Otherwise ⚠️ with explicit list of what broke.
   - Add the public URL to the status board and to "What's done"
   - New session log entry at the top of the log for today's date with: URL, bundle sizes before/after, OG rendering confirmed, any mobile issues observed

# VERIFICATION GATE

Before declaring done, confirm every box:

- [ ] `/tour` and `/` both work on the production URL in incognito
- [ ] Live token streaming works on production (not just localhost)
- [ ] All 7 replay panels render with activation data on production
- [ ] Beginner/Advanced toggle still works and persists
- [ ] Explain-this popovers still open on every panel
- [ ] OG card renders correctly when URL is pasted to Slack or X
- [ ] `npm run build` still clean
- [ ] `npx tsc --noEmit` still clean
- [ ] First-load JS for `/` is under 1 MB (per Phase 2 prompt's hard constraint)
- [ ] `PROJECT_STATE.md` updated with the URL and a session log entry

# IF ANYTHING BREAKS

Don't "fix" by deleting working code. Revert the commit that caused the regression, post the diagnostic in chat, wait for Nate.

# KICKOFF

Read `PROJECT_STATE.md` and verify we're at the "Phase 2 MVP up, remaining: polish + deploy" state. Start M1 — produce the audit at `viz/PERF_AUDIT.md` and post the numbers in chat before changing anything. Move.
