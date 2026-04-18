"""tinyshakespeare download, char-level tokenizer, train/val split, get_batch."""
from __future__ import annotations

import urllib.request
from pathlib import Path

import torch

DATA_URL = (
    "https://raw.githubusercontent.com/karpathy/char-rnn/"
    "master/data/tinyshakespeare/input.txt"
)
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "input.txt"


def download_text() -> str:
    """Return the tinyshakespeare corpus, downloading and caching on first call."""
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_PATH.exists():
        print(f"Downloading tinyshakespeare -> {DATA_PATH}")
        urllib.request.urlretrieve(DATA_URL, DATA_PATH)
    return DATA_PATH.read_text(encoding="utf-8")


class CharTokenizer:
    """Character-level tokenizer. vocab is every unique char in the corpus."""

    def __init__(self, text: str) -> None:
        chars = sorted(set(text))
        self.vocab_size: int = len(chars)
        self.stoi: dict[str, int] = {ch: i for i, ch in enumerate(chars)}
        self.itos: dict[int, str] = {i: ch for i, ch in enumerate(chars)}

    def encode(self, s: str) -> list[int]:
        return [self.stoi[c] for c in s]

    def decode(self, ids: list[int]) -> str:
        return "".join(self.itos[i] for i in ids)


def prepare_data(train_frac: float = 0.9) -> tuple[CharTokenizer, torch.Tensor, torch.Tensor]:
    """Download, tokenize, and split into train / val tensors of token ids."""
    text = download_text()
    tokenizer = CharTokenizer(text)
    data = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    n = int(train_frac * len(data))
    return tokenizer, data[:n], data[n:]


def get_batch(
    split_data: torch.Tensor,
    block_size: int,
    batch_size: int,
    device: str,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Sample a batch of (input, target) pairs for next-token prediction.

    Each sample is a contiguous slice of length `block_size`; the target is
    that slice shifted one position right, so y[t] is the token that should
    follow x[t]. Returns tensors already moved to `device`.

    Shapes: x, y -> (batch_size, block_size)
    """
    ix = torch.randint(len(split_data) - block_size, (batch_size,))
    x = torch.stack([split_data[i : i + block_size] for i in ix])
    y = torch.stack([split_data[i + 1 : i + 1 + block_size] for i in ix])
    return x.to(device), y.to(device)
