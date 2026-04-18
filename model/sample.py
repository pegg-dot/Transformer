"""Load a trained GPT checkpoint and generate text.

Usage:
    python -m model.sample --prompt "ROMEO:" --tokens 500
    python -m model.sample --prompt "Hark!" --temperature 0.8 --top_k 40
"""
from __future__ import annotations

import argparse
from pathlib import Path

import torch

from model.config import config
from model.data import prepare_data
from model.gpt import GPTLanguageModel

CHECKPOINT_PATH = Path(__file__).resolve().parent.parent / "checkpoints" / "gpt.pt"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", type=str, default="\n")
    parser.add_argument("--tokens", type=int, default=500)
    parser.add_argument(
        "--temperature",
        type=float,
        default=1.0,
        help="<1 sharpens (more deterministic), >1 flattens (more random)",
    )
    parser.add_argument(
        "--top_k",
        type=int,
        default=None,
        help="keep only the k most-likely tokens each step (None = no filter)",
    )
    args = parser.parse_args()

    # Rebuild tokenizer from the cached corpus (deterministic, same vocab as training).
    tok, _, _ = prepare_data()

    model = GPTLanguageModel(
        vocab_size=tok.vocab_size,
        n_embd=config.n_embd,
        n_head=config.n_head,
        n_layer=config.n_layer,
        block_size=config.block_size,
        dropout=config.dropout,
    ).to(config.device)

    ckpt = torch.load(CHECKPOINT_PATH, map_location=config.device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    prompt_ids = torch.tensor([tok.encode(args.prompt)], dtype=torch.long, device=config.device)

    out = model.generate(
        prompt_ids,
        max_new_tokens=args.tokens,
        temperature=args.temperature,
        top_k=args.top_k,
    )
    print(tok.decode(out[0].tolist()))


if __name__ == "__main__":
    main()
