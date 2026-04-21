import type { Metadata } from 'next'
import { Fraunces, JetBrains_Mono, Manrope } from 'next/font/google'
import { ModeProvider } from '@/lib/mode'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
})

const manrope = Manrope({
  variable: '--font-body',
  subsets: ['latin'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

// Vercel injects VERCEL_URL on preview/production. Fall back to localhost for
// `next dev` so generated OG/twitter absolute URLs still resolve locally.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

const title = 'Watch a transformer think'
const description =
  'A char-level GPT trained on Shakespeare, visualized live in your browser. Attention heatmaps, KV cache, decoding — built from scratch.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'transformer.live',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-x-hidden bg-[--bg] text-[--fg]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-grid opacity-[0.035]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.05]" />
        <div className="pointer-events-none fixed left-[10%] top-[-20%] z-0 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.18),transparent)] blur-3xl" />
        <div className="pointer-events-none fixed right-[-10%] bottom-[10%] z-0 h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.10),transparent)] blur-3xl" />
        <ModeProvider>
          <div className="relative z-10">{children}</div>
        </ModeProvider>
      </body>
    </html>
  )
}
