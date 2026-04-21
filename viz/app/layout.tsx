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

export const metadata: Metadata = {
  title: 'transformer.live — watch a neural network think',
  description:
    'A GPT transformer running live in your browser, with every attention head, FFN activation, and residual stream update visualized as it happens.',
  openGraph: {
    title: 'transformer.live',
    description: 'Watch a neural network think, in your browser.',
    type: 'website',
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
