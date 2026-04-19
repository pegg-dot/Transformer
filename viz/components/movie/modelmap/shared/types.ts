export type ModelPart =
  | 'tokenize' | 'embed' | 'positional'
  | 'layernorm' | 'attention' | 'ffn' | 'stack'
  | 'sample' | 'kvcache'
  | 'loss' | 'backprop' | 'gradient-descent' | 'modern' | 'generation'

export type SceneMode = 'A' | 'B' | 'C'

export interface SceneProps {
  t: number
  duration: number
  accent: string
  sceneId: string
}
