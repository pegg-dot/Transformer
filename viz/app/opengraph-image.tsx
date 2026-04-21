import { ImageResponse } from 'next/og'

export const alt = 'Watch a transformer think — a char-level GPT visualized live in your browser'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Deterministic pseudo-random 0..1 so every build produces the identical grid.
function rand(i: number, j: number): number {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
  return s - Math.floor(s)
}

export default async function Image() {
  const ROWS = 14
  const COLS = 28
  const CELL_W = size.width / COLS   // ~43 px
  const CELL_H = size.height / ROWS  // ~45 px
  const cells: React.ReactNode[] = []
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      // Causal-mask-ish: bias the lower triangle to higher intensity so the grid
      // reads as attention rather than noise. Plus a band along the diagonal.
      const colFrac = j / COLS
      const rowFrac = i / ROWS
      const causal = colFrac <= rowFrac + 0.08 ? 1 : 0.2
      const diag = Math.max(0, 1 - Math.abs(rowFrac - colFrac) * 5)
      const intensity = Math.min(1, (rand(i, j) * 0.4 + diag * 0.85) * causal)
      const alpha = intensity * 0.85
      cells.push(
        <div
          key={`${i}-${j}`}
          style={{
            position: 'absolute',
            top: i * CELL_H,
            left: j * CELL_W,
            width: CELL_W,
            height: CELL_H,
            background: `rgba(96, 165, 250, ${alpha})`,
          }}
        />
      )
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0b',
          color: '#e7e7e7',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Attention-heatmap background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            display: 'flex',
          }}
        >
          {cells}
        </div>

        {/* Vignette / gradient to pull focus inward */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(10,10,11,0.96) 0%, rgba(10,10,11,0.92) 45%, rgba(10,10,11,0.7) 70%, rgba(10,10,11,0.4) 100%)',
          }}
        />

        {/* Foreground content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px 96px',
            height: '100%',
          }}
        >
          <div
            style={{
              fontSize: 28,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#60a5fa',
              marginBottom: 28,
              fontWeight: 600,
            }}
          >
            transformer.live
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: '#ffffff',
              marginBottom: 32,
              maxWidth: 960,
            }}
          >
            Watch a transformer think.
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.35,
              color: '#a0a0a8',
              maxWidth: 900,
            }}
          >
            A char-level GPT trained on Shakespeare, visualized live in your browser — attention heatmaps, FFN activations, KV cache, decoding.
          </div>
        </div>

        {/* Signature */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            right: 44,
            padding: '8px 14px',
            borderRadius: 6,
            background: 'rgba(10, 10, 11, 0.78)',
            fontSize: 20,
            color: '#c4c4cc',
            letterSpacing: 1.5,
            display: 'flex',
          }}
        >
          by Nate
        </div>
      </div>
    ),
    { ...size }
  )
}
