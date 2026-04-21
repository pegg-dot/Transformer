# Phase 2 — Performance Audit (M1)

Generated: 2026-04-21

Measurement pass only — no code touched. Numbers below are the baseline we optimize against in M2–M5.

## 1. Static assets (`viz/public/`)

| File | Raw | gzip | Notes |
|---|---|---|---|
| `model.onnx` | 41.6 MB | 38.2 MB | 10.79M float32 params — weights don't compress much |
| `activations.json` | 26.5 MB | 11.3 MB | T=66, 4 blocks × 4 heads, float32 |
| `ort/ort-wasm-simd-threaded.jsep.wasm` | 23.9 MB | 5.6 MB | SIMD+JSEP build of ORT |
| `ort/ort-wasm-simd-threaded.wasm` | 11.8 MB | 3.0 MB | non-JSEP fallback |
| `ort/*.mjs` (loaders) | 69 KB | — | |
| `vocab.json` | 940 B | — | |
| SVGs (next/globe/vercel/window/file) | ~3 KB | — | |
| **`viz/public/` total** | **104 MB** | — | |

> Brotli (Vercel-default on text-like MIME types) typically compresses JSON ~15–25% tighter than gzip. Real number on the wire will be measured after first deploy.

## 2. Build output (`.next/`)

`npm run build` → clean. 3 static routes: `/`, `/_not-found`, `/tour` (all `○ Static`). TypeScript clean. No warnings.

### Bundle chunks (largest)

| Chunk | Raw | gzip | Likely contents |
|---|---|---|---|
| `0b2ynx5j7b1.v.js` | 1.15 MB | 313 KB | three.js + @react-three (tour + 3D scenes) |
| `063hzgt1mru~k.js` | 384 KB | 104 KB | page-specific (likely onnxruntime-web glue) |
| `0n~dq4kpx9xxx.js` | 222 KB | 69 KB | rootMain (framework + React) |
| `0257pdz1-imal.js` | 146 KB | 39 KB | rootMain |
| `0wg639w~uk587.js` | 141 KB | — | |
| `0t2jzmujzm0md.js` | 141 KB | — | |
| `03~yq9q893hmn.js` | 110 KB | — | polyfills |

### First-load JS estimates

- **rootMainFiles** (loaded on every route, from `build-manifest.json`): `0ht900cau6_ur` + `0dgq26a5_oy.a` + `0n~dq4kpx9xxx` + `0257pdz1-imal` + `turbopack` ≈ **456 KB raw / ~135 KB gz**.
- **Per-route chunks** bring `/` and `/tour` up to roughly **~1.5 MB raw / ~450 KB gz** first-load (three.js dominates because `LayerView` uses r3f on root and `/tour` uses r3f throughout).
- Headroom: first-load gzipped JS (~450 KB) is well under the 1 MB hard constraint. Raw is over 1 MB but raw isn't what ships over the wire — the constraint should be read as gzipped/brotli'd.

### `.next/static/media`

- `ort-wasm-simd-threaded.jsep.0ba.*.wasm` (25 MB) — a duplicate of the wasm at `/public/ort/`, emitted by Turbopack's asset pipeline. At runtime we set `ort.env.wasm.wasmPaths = '/ort/'` (`lib/ort.ts:8`), so the browser loads from `/ort/`, not from `/static/media/`. The `/static/media/` copy is dead weight in the deploy tarball but never served.
- Worth revisiting in a later pass (possibly exclude via `next.config.ts`), but not blocking for ship.

## 3. Vercel footprint check

- Vercel Hobby: no hard per-file size limit for static assets on a Next.js project; practical constraint is the 100 GB/mo bandwidth and the ~250 MB source-tree bound. We're comfortably inside both.
- Total uploaded tree (`viz/public/` + `.next/static/`): **≈ 130 MB**. Safe.
- Biggest single-file concern is `model.onnx` (42 MB). One download per unique visitor. With `Cache-Control: public, max-age=31536000, immutable` (M5), it's one per browser ever.

## 4. Network waterfall (predicted, first uncached load of `/`)

Order of critical requests to a fresh browser on `/`:

1. `GET /` → HTML shell (~5 KB) + inline RSC payload
2. rootMain JS chunks (~450 KB gz, parallelizable)
3. `GET /vocab.json` (940 B) — from `useTransformer` effect
4. `GET /model.onnx` (~38 MB after gzip, or ~37 MB brotli) — fires when live generator mounts
5. `GET /ort/ort-wasm-simd-threaded.jsep.wasm` (~5.6 MB gz / ~5 MB br) — fires from ORT WASM init
6. `GET /activations.json` (~11 MB gz / ~8–9 MB br) — fires from `useActivations` for replay panels

Total first-load data to fully interactive: **~50–55 MB on the wire**. Dominated by `model.onnx`. `activations.json` is #2 and is the thing we can meaningfully compress in M2.

## 5. Vercel automatic compression

Confirmed from Vercel docs: Vercel's edge automatically encodes `text/*`, `application/json`, `application/javascript`, and a handful of other MIME types with Brotli (preferred) or Gzip, based on the client's `Accept-Encoding` header. `application/octet-stream` (`.onnx`, `.wasm`) is **not** automatically compressed — those go raw.

- `activations.json` → will be Brotli'd. Expected wire size **~8–10 MB** (from 26.5 MB raw).
- `model.onnx` → raw 42 MB on every miss. Not compressed on the wire.
- `*.wasm` → raw 12 MB + 24 MB on every miss. Not compressed on the wire.

That means M2's aggressive-quantization path is probably unnecessary — the free Brotli pass likely already gets us to the ~10 MB target. We'll confirm on a preview deploy before committing to float16 quantization.

## 6. Decision points for M2–M5

- **M2**: Deploy once to a Vercel preview with the current `activations.json`. Read `content-encoding` and `transfer-size` for the JSON. If <10 MB, stop. Otherwise, add a float16 `activations.compact.json` build step.
- **M3**: Dynamic INT8 quantization on `model.onnx` is the only realistic size win (from 42 MB → ~11 MB). Gate on numerical divergence against a test prompt; revert if >1e-3 at any token position. Always add the long-lived cache header regardless.
- **M4**: Next 16 file-convention (`app/opengraph-image.tsx`, `app/twitter-image.tsx`) + metadata in `app/layout.tsx`. Zero runtime cost.
- **M5**: `vercel.json` with immutable cache for `/model.onnx`, `/activations*.json`, `/ort/*`. `gh repo create` → Vercel connect → URL.

## 6a. M3 follow-up — ONNX INT8 quantization rejected

Ran `scripts/quantize_onnx.py` (dynamic INT8 via `onnxruntime.quantization.quantize_dynamic`). Results on a 32-token test input:

- Size: 43.6 MB → 11.6 MB (26% of source).
- Max `|Δlogits|`: **0.240** (prompt tolerance is 1e-3; even a 1e-2 tolerance fails).
- Mean `|Δlogits|`: 0.041.
- Argmax agreement with baseline: **93.8%** — i.e. ~6% of next-token picks would differ.

That's enough divergence to change generated text visibly after a handful of tokens. Since the viz is supposed to mirror the Phase 1 trained checkpoint exactly, we reject the quantized model (per the prompt's "quality > size" rule). Script stays in the repo for a future-us who wants to retry against a larger/different model. The M5 cache header handles the first-load UX instead.

## 7. Red flags / nothing-to-see-here

- **Duplicate WASM in `.next/static/media`** — cosmetic; not served. Leave for a later pass.
- **`0b2ynx5j7b1.v.js` (1.15 MB, three.js)** — expected; the only page without 3D is `/` and even it uses r3f via `LayerView`. Lazy-splitting three off the `/` route is a polish pass, not a ship blocker.
- **Bundle analyzer absent** — Turbopack's chunk names are hashed; we don't have `@next/bundle-analyzer` wired up. If we hit a real bundle problem later, add it then.
