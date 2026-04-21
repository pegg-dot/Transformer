"""Compress viz/public/activations.json to activations.compact.json.

Same JSON schema — just fewer significant digits and no whitespace. Rounds every
float to 4 decimal places (≈ float16 precision for values in [-10, 10]) and
serializes with the compactest JSON separators. Ints (token IDs, dims) untouched.

Keeps the original file on disk as the canonical artifact. Compact file is a
build output the viz prefers at fetch time (see viz/lib/useActivations.ts).

Usage:
    python scripts/compress_activations.py
    python scripts/compress_activations.py --decimals 5   # more precision, less shrink
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def round_floats(obj, decimals: int):
    if isinstance(obj, float):
        return round(obj, decimals)
    if isinstance(obj, list):
        return [round_floats(x, decimals) for x in obj]
    if isinstance(obj, dict):
        return {k: round_floats(v, decimals) for k, v in obj.items()}
    return obj


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", type=Path, default=Path("viz/public/activations.json"))
    parser.add_argument("--dst", type=Path, default=Path("viz/public/activations.compact.json"))
    parser.add_argument("--decimals", type=int, default=4)
    args = parser.parse_args()

    src_bytes = args.src.stat().st_size
    print(f"reading {args.src} ({src_bytes / 1e6:.1f} MB)")
    data = json.loads(args.src.read_text())

    compact = round_floats(data, args.decimals)
    args.dst.write_text(json.dumps(compact, separators=(",", ":")))

    dst_bytes = args.dst.stat().st_size
    ratio = dst_bytes / src_bytes
    print(
        f"wrote   {args.dst} ({dst_bytes / 1e6:.1f} MB)  "
        f"— {ratio * 100:.1f}% of original, {decimals_note(args.decimals)}"
    )


def decimals_note(decimals: int) -> str:
    return f"{decimals} decimal places"


if __name__ == "__main__":
    main()
