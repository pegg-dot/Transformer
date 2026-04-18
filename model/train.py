"""Train the Phase 1 GPT on tinyshakespeare.

Usage:
    python -m model.train                    # use config defaults (5000 iters)
    python -m model.train --max_iters 500    # quick sanity run
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import torch

from model.config import config
from model.data import get_batch, prepare_data
from model.gpt import GPTLanguageModel

CHECKPOINT_PATH = Path(__file__).resolve().parent.parent / "checkpoints" / "gpt.pt"


@torch.no_grad()
def estimate_loss(model, train_data, val_data, eval_iters: int):
    """Average train & val loss over `eval_iters` random batches each.

    Flip to .eval() mode so dropout is off during estimation, then back.
    """
    model.eval()
    out = {}
    for split_name, data in [("train", train_data), ("val", val_data)]:
        losses = torch.zeros(eval_iters)
        for k in range(eval_iters):
            X, Y = get_batch(data, config.block_size, config.batch_size, config.device)
            _, loss = model(X, Y)
            losses[k] = loss.item()
        out[split_name] = losses.mean().item()
    model.train()
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max_iters", type=int, default=config.max_iters)
    parser.add_argument("--eval_interval", type=int, default=config.eval_interval)
    parser.add_argument("--sample_tokens", type=int, default=300)
    args = parser.parse_args()

    torch.manual_seed(config.seed)

    print(f"device: {config.device}")
    print(
        f"config: block_size={config.block_size}, batch_size={config.batch_size}, "
        f"n_embd={config.n_embd}, n_head={config.n_head}, n_layer={config.n_layer}, "
        f"lr={config.learning_rate}, dropout={config.dropout}"
    )

    tok, train_data, val_data = prepare_data()
    print(f"vocab_size: {tok.vocab_size}, train tokens: {len(train_data):,}, val tokens: {len(val_data):,}")

    model = GPTLanguageModel(
        vocab_size=tok.vocab_size,
        n_embd=config.n_embd,
        n_head=config.n_head,
        n_layer=config.n_layer,
        block_size=config.block_size,
        dropout=config.dropout,
    ).to(config.device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"model parameters: {n_params:,} (~{n_params / 1e6:.2f}M)")

    optimizer = torch.optim.AdamW(model.parameters(), lr=config.learning_rate)

    t0 = time.time()
    for it in range(args.max_iters + 1):
        if it % args.eval_interval == 0 or it == args.max_iters:
            losses = estimate_loss(model, train_data, val_data, config.eval_iters)
            elapsed = time.time() - t0
            print(
                f"[iter {it:5d}] train {losses['train']:.4f}  val {losses['val']:.4f}  "
                f"elapsed {elapsed:.1f}s"
            )

        if it == args.max_iters:
            break

        X, Y = get_batch(train_data, config.block_size, config.batch_size, config.device)
        _, loss = model(X, Y)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()

    CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {"model_state_dict": model.state_dict(), "iters_trained": args.max_iters},
        CHECKPOINT_PATH,
    )
    print(f"saved checkpoint -> {CHECKPOINT_PATH}")

    print("\n--- sample (temperature=1.0, no top-k) ---")
    start = torch.zeros((1, 1), dtype=torch.long, device=config.device)
    out = model.generate(start, max_new_tokens=args.sample_tokens, temperature=1.0, top_k=None)
    print(tok.decode(out[0].tolist()))


if __name__ == "__main__":
    main()
