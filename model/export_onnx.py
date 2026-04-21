"""Export the trained Phase 1 GPT to ONNX for in-browser inference.

Usage:
    python -m model.export_onnx --out model/model.onnx

Exports only the forward pass (logits). Generation is done step-by-step in the
browser by calling forward repeatedly with a growing sequence. We use dynamic
axes for batch and sequence so the browser can feed any context length up to
block_size.

After export, we verify ONNX matches PyTorch to 1e-4 on random inputs.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

from model.config import config
from model.data import prepare_data
from model.gpt import GPTLanguageModel

CHECKPOINT_PATH = Path(__file__).resolve().parent.parent / "checkpoints" / "gpt.pt"
DEFAULT_OUT = Path(__file__).resolve().parent / "model.onnx"


class LogitsOnly(nn.Module):
    """Wrap GPTLanguageModel so forward returns only logits (no loss tuple)."""
    def __init__(self, model: GPTLanguageModel):
        super().__init__()
        self.model = model

    def forward(self, idx: torch.Tensor) -> torch.Tensor:
        logits, _ = self.model(idx)
        return logits


def export(out_path: Path, opset: int = 17) -> None:
    torch.manual_seed(0)
    tokenizer, _, _ = prepare_data()

    model = GPTLanguageModel(
        vocab_size=tokenizer.vocab_size,
        n_embd=config.n_embd,
        n_head=config.n_head,
        n_layer=config.n_layer,
        block_size=config.block_size,
        dropout=0.0,
    )
    ckpt = torch.load(CHECKPOINT_PATH, map_location="cpu")
    model.load_state_dict(ckpt["model_state_dict"])
    model.train(False)

    wrapped = LogitsOnly(model)
    wrapped.train(False)

    # Use a sample length well inside block_size to exercise dynamic seq handling.
    sample_T = 16
    sample = torch.randint(0, tokenizer.vocab_size, (1, sample_T), dtype=torch.long)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        wrapped,
        (sample,),
        str(out_path),
        input_names=["tokens"],
        output_names=["logits"],
        dynamic_axes={
            "tokens": {0: "batch", 1: "seq"},
            "logits": {0: "batch", 1: "seq"},
        },
        opset_version=opset,
        do_constant_folding=True,
    )
    print(f"exported {out_path} (opset {opset})")

    # --- verification: ONNX runtime output matches PyTorch ----------------
    try:
        import onnxruntime as ort
    except ImportError:
        print("onnxruntime not installed — skipping numerical verification.")
        print("    install with: pip install onnxruntime")
        return

    sess = ort.InferenceSession(str(out_path), providers=["CPUExecutionProvider"])

    max_err = 0.0
    # Test several shapes: tiny, medium, near-block_size.
    for T in (1, 8, 32, 128, config.block_size):
        x = torch.randint(0, tokenizer.vocab_size, (1, T), dtype=torch.long)
        with torch.no_grad():
            pt_logits = wrapped(x).cpu().numpy()
        ort_logits = sess.run(None, {"tokens": x.numpy()})[0]
        err = float(np.abs(pt_logits - ort_logits).max())
        max_err = max(max_err, err)
        status = "OK" if err < 1e-4 else "FAIL"
        print(f"  T={T:<4d} max|pt - onnx| = {err:.2e}   [{status}]")

    if max_err >= 1e-4:
        raise RuntimeError(f"ONNX export did not match PyTorch (max err {max_err:.2e})")
    print(f"  verified PyTorch vs ONNX within 1e-4 (max err {max_err:.2e})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--opset", type=int, default=17)
    args = parser.parse_args()
    export(args.out, opset=args.opset)


if __name__ == "__main__":
    main()
