"""Generate text using model.onnx + onnxruntime (pure Python, no PyTorch forward).

This mimics what Phase 2 will do in the browser via transformers.js:
 - Load the ONNX model
 - Tokenize the prompt
 - Repeatedly: feed token ids → get logits → sample next token → append

If this produces coherent Shakespeare-flavored gibberish, the bridge to Phase 2
is confirmed.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import onnxruntime as ort

from model.config import config
from model.data import prepare_data

MODEL_PATH = Path(__file__).resolve().parent.parent / "model" / "model.onnx"


def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)


def sample(
    session: ort.InferenceSession,
    token_ids: list[int],
    max_new: int,
    block_size: int,
    temperature: float,
    top_k: int | None,
    rng: np.random.Generator,
) -> list[int]:
    ids = list(token_ids)
    for _ in range(max_new):
        ctx = ids[-block_size:]                            # crop to block_size
        x = np.asarray([ctx], dtype=np.int64)              # [1, T]
        logits = session.run(None, {"tokens": x})[0]       # [1, T, V]
        next_logits = logits[0, -1, :] / temperature       # [V]

        if top_k is not None:
            kth = np.partition(next_logits, -top_k)[-top_k]
            next_logits = np.where(next_logits < kth, -np.inf, next_logits)

        probs = softmax(next_logits)
        next_id = int(rng.choice(len(probs), p=probs))
        ids.append(next_id)
    return ids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", type=str, default="ROMEO:")
    parser.add_argument("--tokens", type=int, default=200)
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--top_k", type=int, default=None)
    parser.add_argument("--seed", type=int, default=1337)
    args = parser.parse_args()

    tokenizer, _, _ = prepare_data()
    rng = np.random.default_rng(args.seed)

    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    prompt_ids = tokenizer.encode(args.prompt)
    out_ids = sample(
        session,
        token_ids=prompt_ids,
        max_new=args.tokens,
        block_size=config.block_size,
        temperature=args.temperature,
        top_k=args.top_k,
        rng=rng,
    )
    print(tokenizer.decode(out_ids))


if __name__ == "__main__":
    main()
