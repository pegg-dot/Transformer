import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Tell webpack (build fallback) not to bundle onnxruntime-web's Node-only imports.
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      crypto: false,
    }
    return config
  },
}

export default nextConfig
