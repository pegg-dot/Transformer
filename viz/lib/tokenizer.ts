import type { VocabFile } from './types'

/**
 * Character-level tokenizer — mirror of model/data.py::CharTokenizer.
 * Vocab is loaded from /vocab.json (emitted by the Python side).
 */
export class CharTokenizer {
  readonly vocabSize: number
  readonly itos: string[]
  readonly stoi: Record<string, number>

  constructor(vocab: VocabFile) {
    this.vocabSize = vocab.vocab_size
    this.itos = vocab.itos
    this.stoi = vocab.stoi
  }

  encode(s: string): number[] {
    const ids: number[] = []
    for (const ch of s) {
      const id = this.stoi[ch]
      if (id === undefined) throw new Error(`char not in vocab: ${JSON.stringify(ch)}`)
      ids.push(id)
    }
    return ids
  }

  decode(ids: number[]): string {
    return ids.map((i) => this.itos[i]).join('')
  }

  static async load(url = '/vocab.json'): Promise<CharTokenizer> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`failed to load vocab: ${res.status}`)
    const vocab = (await res.json()) as VocabFile
    return new CharTokenizer(vocab)
  }
}
