"""Hyperparameters and device selection for the Phase 1 GPT."""
from __future__ import annotations

from dataclasses import dataclass

import torch


def select_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


@dataclass
class Config:
    # data / context
    block_size: int = 256          # max context length fed to the model
    batch_size: int = 64           # parallel sequences per optimizer step

    # model shape
    n_embd: int = 384              # residual stream / embedding width
    n_head: int = 6                # attention heads per block (d_k = n_embd // n_head = 64)
    n_layer: int = 6               # number of stacked transformer blocks
    dropout: float = 0.2

    # training
    max_iters: int = 5000
    eval_interval: int = 500       # how often to compute val loss
    eval_iters: int = 200          # batches to average when estimating loss
    learning_rate: float = 3e-4    # AdamW default-ish for a small GPT

    # runtime
    device: str = select_device()
    seed: int = 1337


config = Config()
