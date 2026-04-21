"""Round-trip test for activations.json: load, validate shapes, check invariants.

Exits non-zero on any failure. Passes silently-ish on success.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import torch

from model.capture_schema import SCHEMA_VERSION

ACTIVATIONS_PATH = Path(__file__).resolve().parent.parent / "model" / "activations.json"


def shape(x) -> tuple[int, ...]:
    """Return nested-list shape, assuming all inner lists are same length."""
    out: list[int] = []
    cur = x
    while isinstance(cur, list):
        out.append(len(cur))
        if len(cur) == 0:
            break
        cur = cur[0]
    return tuple(out)


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def assert_shape(name: str, got: tuple[int, ...], expected: tuple[int, ...]) -> None:
    if got != expected:
        fail(f"{name}: shape {got} != expected {expected}")


def main() -> None:
    with ACTIVATIONS_PATH.open() as f:
        data = json.load(f)

    # --- schema version ------------------------------------------------------
    v = data.get("schema_version")
    if v != SCHEMA_VERSION:
        fail(f"schema_version {v!r} != {SCHEMA_VERSION!r}")

    # --- model meta ----------------------------------------------------------
    m = data["model"]
    V = m["vocab_size"]
    C = m["n_embd"]
    H = m["n_head"]
    L = m["n_layer"]
    d_k = m["d_k"]
    if d_k != C // H:
        fail(f"d_k ({d_k}) != n_embd/n_head ({C // H})")

    # --- tokens / run --------------------------------------------------------
    tokens = data["tokens"]
    T = len(tokens)
    assert_shape("token_strs", (len(data["token_strs"]),), (T,))
    assert_shape("vocab", (len(data["vocab"]),), (V,))
    prompt_tokens = data["run"]["prompt_token_ids"]
    gen_tokens = data["run"]["generated_token_ids"]
    if len(prompt_tokens) + len(gen_tokens) != T:
        fail(f"prompt({len(prompt_tokens)}) + generated({len(gen_tokens)}) != T({T})")
    if prompt_tokens + gen_tokens != tokens:
        fail("prompt_token_ids + generated_token_ids does not equal tokens")

    # --- top-level tensors ---------------------------------------------------
    assert_shape("token_emb", shape(data["token_emb"]), (T, C))
    assert_shape("pos_emb",   shape(data["pos_emb"]),   (T, C))
    assert_shape("embed_sum", shape(data["embed_sum"]), (T, C))
    assert_shape("ln_f",      shape(data["ln_f"]),      (T, C))
    assert_shape("logits",    shape(data["logits"]),    (T, V))
    assert_shape("probs_last", shape(data["probs_last"]), (V,))

    # embed_sum = token_emb + pos_emb (re-verify in JSON space)
    te = torch.tensor(data["token_emb"])
    pe = torch.tensor(data["pos_emb"])
    es = torch.tensor(data["embed_sum"])
    err = (es - (te + pe)).abs().max().item()
    if err > 1e-5:
        fail(f"embed_sum != token_emb + pos_emb, max|err|={err}")

    # probs_last sums to 1
    pl = torch.tensor(data["probs_last"])
    if abs(pl.sum().item() - 1.0) > 1e-4:
        fail(f"probs_last sum = {pl.sum().item()}")

    # --- blocks --------------------------------------------------------------
    blocks = data["blocks"]
    if len(blocks) != L:
        fail(f"blocks length {len(blocks)} != n_layer {L}")

    for i, b in enumerate(blocks):
        assert_shape(f"blocks[{i}].ln1",       shape(b["ln1"]),       (T, C))
        assert_shape(f"blocks[{i}].resid_mid", shape(b["resid_mid"]), (T, C))
        assert_shape(f"blocks[{i}].ln2",       shape(b["ln2"]),       (T, C))
        assert_shape(f"blocks[{i}].resid_out", shape(b["resid_out"]), (T, C))

        attn = b["attn"]
        assert_shape(f"blocks[{i}].attn.q",       shape(attn["q"]),       (H, T, d_k))
        assert_shape(f"blocks[{i}].attn.k",       shape(attn["k"]),       (H, T, d_k))
        assert_shape(f"blocks[{i}].attn.v",       shape(attn["v"]),       (H, T, d_k))
        assert_shape(f"blocks[{i}].attn.scores",  shape(attn["scores"]),  (H, T, T))
        assert_shape(f"blocks[{i}].attn.weights", shape(attn["weights"]), (H, T, T))
        assert_shape(f"blocks[{i}].attn.out",     shape(attn["out"]),     (T, C))

        # Weights sum to 1 along key dim
        w = torch.tensor(attn["weights"])
        row_sums = w.sum(dim=-1)                    # [H, T]
        if (row_sums - 1.0).abs().max().item() > 1e-4:
            fail(f"blocks[{i}].attn.weights rows don't sum to 1 "
                 f"(max deviation {(row_sums - 1.0).abs().max().item()})")

        # Causal mask: weights above diagonal are 0
        for h in range(H):
            upper = torch.triu(w[h], diagonal=1)
            if upper.abs().max().item() > 1e-6:
                fail(f"blocks[{i}].attn.weights[{h}] leaks above diagonal "
                     f"(max {upper.abs().max().item()})")

        ffn = b["ffn"]
        assert_shape(f"blocks[{i}].ffn.pre_act",  shape(ffn["pre_act"]),  (T, 4 * C))
        assert_shape(f"blocks[{i}].ffn.post_act", shape(ffn["post_act"]), (T, 4 * C))
        assert_shape(f"blocks[{i}].ffn.out",      shape(ffn["out"]),      (T, C))

        # ReLU: post_act = max(pre_act, 0)
        pre = torch.tensor(ffn["pre_act"])
        post = torch.tensor(ffn["post_act"])
        err = (post - pre.clamp(min=0)).abs().max().item()
        if err > 1e-5:
            fail(f"blocks[{i}].ffn.post_act != ReLU(pre_act), max|err|={err}")

        # Residual invariant: resid_mid = block_in + attn_out. block_in is not stored,
        # but for i > 0: block_in[i] == resid_out[i-1]; for i == 0: block_in[0] == embed_sum.
        block_in = es if i == 0 else torch.tensor(blocks[i - 1]["resid_out"])
        attn_out = torch.tensor(attn["out"])
        resid_mid = torch.tensor(b["resid_mid"])
        err = (resid_mid - (block_in + attn_out)).abs().max().item()
        if err > 1e-5:
            fail(f"blocks[{i}].resid_mid != block_in + attn_out, max|err|={err}")

        # Residual invariant: resid_out = resid_mid + ffn_out
        ffn_out = torch.tensor(ffn["out"])
        resid_out = torch.tensor(b["resid_out"])
        err = (resid_out - (resid_mid + ffn_out)).abs().max().item()
        if err > 1e-5:
            fail(f"blocks[{i}].resid_out != resid_mid + ffn_out, max|err|={err}")

    print(f"OK: activations.json valid "
          f"(V={V}, C={C}, H={H}, L={L}, d_k={d_k}, T={T})")
    print(f"  file: {ACTIVATIONS_PATH}")
    print(f"  size: {ACTIVATIONS_PATH.stat().st_size / (1024*1024):.2f} MB")


if __name__ == "__main__":
    main()
