"""Run one forward pass with hooks attached and write activations.json.

Usage:
    python -m model.capture --prompt "ROMEO:" --tokens 40 --out model/activations.json

The script:
  1. Loads the Phase 1 checkpoint (dropout disabled, inference mode).
  2. Generates `--tokens` tokens from the prompt (no hooks — we don't need
     per-step captures; we want one clean snapshot of the full sequence).
  3. Attaches hooks, runs a single forward pass over the full token sequence,
     collects raw tensors.
  4. Recomputes per-head attention scores and weights from captured Q / K.
  5. Serializes to activations.json per model.capture_schema.Capture.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
import torch.nn.functional as F

from model.capture_schema import SCHEMA_VERSION
from model.config import config
from model.data import prepare_data
from model.gpt import GPTLanguageModel
from model.hooks import ActivationCapturer, _to_list, recompute_attention

CHECKPOINT_PATH = Path(__file__).resolve().parent.parent / "checkpoints" / "gpt.pt"
DEFAULT_OUT = Path(__file__).resolve().parent / "activations.json"


def build_capture(
    model: GPTLanguageModel,
    tokenizer,
    token_ids: torch.Tensor,        # [1, T]
    prompt: str,
    prompt_len: int,
    temperature: float,
    top_k: int | None,
    seed: int | None,
) -> dict:
    """Run one hooked forward pass over token_ids and assemble the schema dict."""
    with ActivationCapturer(model) as cap:
        with torch.no_grad():
            _ = model(token_ids)
    raw = cap.raw

    # Strip batch dim: everything is [1, T, ...] → [T, ...]
    token_emb = raw["token_emb"][0]                 # [T, C]
    pos_emb = raw["pos_emb"]                        # [T, C] (no batch)
    embed_sum = token_emb + pos_emb                 # [T, C]
    ln_f = raw["ln_f"][0]                           # [T, C]
    logits = raw["logits"][0]                       # [T, V]
    probs_last = F.softmax(logits[-1], dim=-1)      # [V]

    blocks_out: list[dict] = []
    for b in raw["blocks"]:
        q_stack, k_stack, v_stack, scores_stack, weights_stack = [], [], [], [], []
        for head in b["heads"]:
            q = head["q"][0]                         # [T, d_k]
            k = head["k"][0]                         # [T, d_k]
            v = head["v"][0]                         # [T, d_k]
            scores, weights = recompute_attention(q, k)   # [T, T], [T, T]
            q_stack.append(q)
            k_stack.append(k)
            v_stack.append(v)
            scores_stack.append(scores)
            weights_stack.append(weights)

        # Stack heads on axis 0 → [H, T, ...]
        q_all = torch.stack(q_stack, dim=0)
        k_all = torch.stack(k_stack, dim=0)
        v_all = torch.stack(v_stack, dim=0)
        scores_all = torch.stack(scores_stack, dim=0)
        weights_all = torch.stack(weights_stack, dim=0)

        blocks_out.append({
            "ln1": _to_list(b["ln1"][0]),
            "attn": {
                "q": _to_list(q_all),
                "k": _to_list(k_all),
                "v": _to_list(v_all),
                "scores": _to_list(scores_all),
                "weights": _to_list(weights_all),
                "out": _to_list(b["attn_out"][0]),
            },
            "resid_mid": _to_list(b["resid_mid"][0]),
            "ln2": _to_list(b["ln2"][0]),
            "ffn": {
                "pre_act": _to_list(b["ffn_pre_act"][0]),
                "post_act": _to_list(b["ffn_post_act"][0]),
                "out": _to_list(b["ffn_out"][0]),
            },
            "resid_out": _to_list(b["resid_out"][0]),
        })

    vocab = [tokenizer.itos[i] for i in range(tokenizer.vocab_size)]
    token_list = token_ids[0].tolist()
    d_k = config.n_embd // config.n_head

    return {
        "schema_version": SCHEMA_VERSION,
        "model": {
            "vocab_size": tokenizer.vocab_size,
            "n_embd": config.n_embd,
            "n_head": config.n_head,
            "n_layer": config.n_layer,
            "block_size": config.block_size,
            "d_k": d_k,
        },
        "run": {
            "prompt": prompt,
            "prompt_token_ids": token_list[:prompt_len],
            "generated_token_ids": token_list[prompt_len:],
            "temperature": temperature,
            "top_k": top_k,
            "seed": seed,
        },
        "vocab": vocab,
        "tokens": token_list,
        "token_strs": [tokenizer.itos[i] for i in token_list],
        "token_emb": _to_list(token_emb),
        "pos_emb": _to_list(pos_emb),
        "embed_sum": _to_list(embed_sum),
        "blocks": blocks_out,
        "ln_f": _to_list(ln_f),
        "logits": _to_list(logits),
        "probs_last": _to_list(probs_last),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", type=str, default="ROMEO:")
    parser.add_argument("--tokens", type=int, default=40,
                        help="number of new tokens to generate before capture")
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--top_k", type=int, default=None)
    parser.add_argument("--seed", type=int, default=1337)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    if args.seed is not None:
        torch.manual_seed(args.seed)

    tokenizer, _, _ = prepare_data()

    # dropout=0 for deterministic capture (no stochastic attention/ffn).
    model = GPTLanguageModel(
        vocab_size=tokenizer.vocab_size,
        n_embd=config.n_embd,
        n_head=config.n_head,
        n_layer=config.n_layer,
        block_size=config.block_size,
        dropout=0.0,
    ).to(config.device)

    ckpt = torch.load(CHECKPOINT_PATH, map_location=config.device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.train(False)  # inference mode

    prompt_ids = torch.tensor(
        [tokenizer.encode(args.prompt)], dtype=torch.long, device=config.device
    )
    prompt_len = prompt_ids.shape[1]

    # Generate without hooks (hooks only wrap the final capture pass).
    if args.tokens > 0:
        with torch.no_grad():
            full_ids = model.generate(
                prompt_ids,
                max_new_tokens=args.tokens,
                temperature=args.temperature,
                top_k=args.top_k,
            )
    else:
        full_ids = prompt_ids

    if full_ids.shape[1] > config.block_size:
        full_ids = full_ids[:, -config.block_size:]

    capture_dict = build_capture(
        model=model,
        tokenizer=tokenizer,
        token_ids=full_ids,
        prompt=args.prompt,
        prompt_len=prompt_len,
        temperature=args.temperature,
        top_k=args.top_k,
        seed=args.seed,
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w") as f:
        json.dump(capture_dict, f)

    size_mb = args.out.stat().st_size / (1024 * 1024)
    T = full_ids.shape[1]
    print(f"wrote {args.out}  ({size_mb:.2f} MB, T={T})")
    print(f"  generated: {tokenizer.decode(full_ids[0].tolist())!r}")


if __name__ == "__main__":
    main()
