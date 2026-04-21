"""Dynamically INT8-quantize model.onnx and verify numerical fidelity.

Writes model.int8.onnx next to the source. Runs both baseline and quantized
models on a small test prompt; if max absolute divergence at the final logits
is larger than the threshold, deletes the quantized file and exits non-zero.

Usage:
    python scripts/quantize_onnx.py                    # default paths, 1e-2 tol
    python scripts/quantize_onnx.py --tol 5e-3
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import onnxruntime as ort
from onnxruntime.quantization import QuantType, quantize_dynamic


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", type=Path, default=Path("viz/public/model.onnx"))
    parser.add_argument("--dst", type=Path, default=Path("viz/public/model.int8.onnx"))
    parser.add_argument("--tol", type=float, default=1e-2,
                        help="Max allowed abs diff in final logits. INT8 is lossy; 1e-2 is reasonable.")
    parser.add_argument("--T", type=int, default=32, help="Test sequence length")
    args = parser.parse_args()

    src_bytes = args.src.stat().st_size
    print(f"source : {args.src} ({src_bytes / 1e6:.1f} MB)")

    print("quantizing (dynamic INT8)…")
    quantize_dynamic(
        str(args.src),
        str(args.dst),
        weight_type=QuantType.QInt8,
    )
    dst_bytes = args.dst.stat().st_size
    print(f"output : {args.dst} ({dst_bytes / 1e6:.1f} MB, {dst_bytes / src_bytes * 100:.0f}% of source)")

    print("verifying numerical fidelity…")
    rng = np.random.default_rng(42)
    # Use a realistic-ish token-ID input. Vocab is small (65 for char-level GPT).
    test_ids = rng.integers(0, 60, size=(1, args.T)).astype(np.int64)

    base = ort.InferenceSession(str(args.src), providers=["CPUExecutionProvider"])
    quant = ort.InferenceSession(str(args.dst), providers=["CPUExecutionProvider"])

    input_name = base.get_inputs()[0].name
    logits_base = base.run(None, {input_name: test_ids})[0]
    logits_quant = quant.run(None, {input_name: test_ids})[0]

    abs_diff = np.abs(logits_base - logits_quant)
    max_diff = float(abs_diff.max())
    mean_diff = float(abs_diff.mean())
    print(f"  max  |Δlogits| = {max_diff:.5f}")
    print(f"  mean |Δlogits| = {mean_diff:.5f}")

    # Argmax agreement is the pragmatic "did sampling change?" check.
    base_argmax = logits_base.argmax(-1)
    quant_argmax = logits_quant.argmax(-1)
    argmax_match = float((base_argmax == quant_argmax).mean())
    print(f"  argmax agreement = {argmax_match * 100:.1f}%")

    if max_diff > args.tol:
        print(f"FAIL — max diff {max_diff:.5f} exceeds tol {args.tol}. Deleting quantized file.")
        args.dst.unlink(missing_ok=True)
        raise SystemExit(1)

    print("OK — quantized model is within tolerance.")


if __name__ == "__main__":
    main()
