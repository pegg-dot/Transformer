'use client'

import * as ort from 'onnxruntime-web'

const BLOCK_SIZE = 256

// WASM artifacts are copied to /public/ort/ — point ORT at them.
ort.env.wasm.wasmPaths = '/ort/'
ort.env.wasm.numThreads = 1

let sessionPromise: Promise<ort.InferenceSession> | null = null

export async function getSession(modelUrl = '/model.onnx'): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })
  }
  return sessionPromise
}

/** Run a single forward pass. Returns logits [1, T, V] as a flat Float32Array. */
export async function forward(ids: number[]): Promise<{
  logits: Float32Array
  T: number
  V: number
}> {
  const session = await getSession()
  const T = ids.length
  const input = new ort.Tensor('int64', BigInt64Array.from(ids.map((i) => BigInt(i))), [1, T])
  const output = await session.run({ tokens: input })
  const logits = output.logits.data as Float32Array
  const [, , V] = output.logits.dims as [number, number, number]
  return { logits, T, V }
}

export function softmax(arr: Float32Array | number[], temperature = 1.0): Float32Array {
  const out = new Float32Array(arr.length)
  let max = -Infinity
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] / temperature
    if (v > max) max = v
  }
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    const v = Math.exp(arr[i] / temperature - max)
    out[i] = v
    sum += v
  }
  for (let i = 0; i < arr.length; i++) out[i] /= sum
  return out
}

/** Multinomial sample from a probability vector. */
export function sample(probs: Float32Array, rng: () => number = Math.random): number {
  const r = rng()
  let acc = 0
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]
    if (r < acc) return i
  }
  return probs.length - 1
}

export function topKFilter(logits: Float32Array, k: number): Float32Array {
  if (k >= logits.length) return logits
  const sorted = Array.from(logits).sort((a, b) => b - a)
  const threshold = sorted[k - 1]
  const out = new Float32Array(logits.length)
  for (let i = 0; i < logits.length; i++) {
    out[i] = logits[i] >= threshold ? logits[i] : -Infinity
  }
  return out
}

export { BLOCK_SIZE }
