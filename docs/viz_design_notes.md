# viz/

Next.js 15 web app — the live transformer visualizer. Populated during Phase 2.

## Expected contents (after Phase 2)

```
viz/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── TokenizationView.tsx
│   ├── EmbeddingView.tsx
│   ├── LayerView.tsx
│   ├── AttentionHeatmap.tsx
│   ├── KVCacheView.tsx
│   ├── DecodingView.tsx
│   ├── Controls.tsx
│   └── EmbeddingSpace3D.tsx
├── lib/
│   ├── useTransformer.ts
│   ├── tokenizer.ts
│   └── types.ts
├── public/
│   ├── model.onnx
│   └── activations.json
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Dev commands (after scaffold)

```
cd viz
npm install
npm run dev
npm run build
npm run lint
```

## Design north stars

- Dark theme default. Tokens in monospace. Colors map to values.
- Every viz corresponds to real computation. No decorative animation.
- Tensor shapes always visible.
- References: bbycroft.net/llm, poloclub.github.io/transformer-explainer, Linear, Anthropic interpretability posts.

## Deployment

Vercel, static export where possible. Connect GitHub repo, set `viz/` as root. Free tier is enough.
