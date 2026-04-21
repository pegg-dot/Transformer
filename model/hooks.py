"""Forward hooks that record every intermediate tensor during one forward pass.

The capturer attaches hooks to every submodule we want to visualize — without
modifying the model architecture. Used as a context manager.
"""
from __future__ import annotations

from contextlib import AbstractContextManager
from typing import Any

import torch
import torch.nn as nn

from model.gpt import Block, FeedForward, GPTLanguageModel, Head, MultiHeadAttention


def _to_list(t: torch.Tensor) -> list:
    """Detach, move to CPU, convert to nested Python lists (JSON-ready).

    Zeros any non-finite values (+/-inf, NaN). Non-finite values happen
    naturally — e.g. -inf in the causally-masked upper triangle of the
    attention scores tensor — and Python's json.dump emits them as the
    non-standard literal "Infinity" that browsers' JSON.parse rejects.
    Zero is a safe viz sentinel because those cells are never rendered
    (upper triangle is masked out anyway).
    """
    t = t.detach().cpu()
    t = torch.where(torch.isfinite(t), t, torch.zeros_like(t))
    return t.tolist()


class ActivationCapturer(AbstractContextManager):
    """Attaches forward hooks; collects tensors into `raw` keyed by module path.

    We record raw tensors (with batch dim) during the pass. The downstream
    capture script (capture.py) strips batch dim, recomputes attention
    scores/weights from Q/K, and serializes to the schema.
    """

    def __init__(self, model: GPTLanguageModel):
        self.model = model
        self.handles: list[torch.utils.hooks.RemovableHandle] = []

        self.raw: dict[str, Any] = {
            "token_emb": None,
            "pos_emb": None,
            "blocks": [],
            "ln_f": None,
            "logits": None,
        }

        n_layer = len(model.blocks)
        for _ in range(n_layer):
            self.raw["blocks"].append({
                "block_in": None,
                "ln1": None,
                "heads": [],
                "attn_out": None,
                "resid_mid": None,
                "ln2": None,
                "ffn_pre_act": None,
                "ffn_post_act": None,
                "ffn_out": None,
                "resid_out": None,
            })

    # --- hook factories -------------------------------------------------------

    def _save(self, key_path: tuple[str | int, ...]):
        def hook(_module, _input, output):
            d = self.raw
            for k in key_path[:-1]:
                d = d[k]
            d[key_path[-1]] = output.detach()
        return hook

    def _save_input(self, key_path: tuple[str | int, ...]):
        def pre_hook(_module, inputs):
            d = self.raw
            for k in key_path[:-1]:
                d = d[k]
            d[key_path[-1]] = inputs[0].detach()
        return pre_hook

    def _save_head(self, block_idx: int, head_idx: int, name: str):
        def hook(_module, _input, output):
            self.raw["blocks"][block_idx]["heads"][head_idx][name] = output.detach()
        return hook

    def _save_pos_emb(self):
        # pos_emb returns [T, C] — no batch dim.
        def hook(_module, _input, output):
            self.raw["pos_emb"] = output.detach()
        return hook

    # --- attach / detach ------------------------------------------------------

    def __enter__(self) -> "ActivationCapturer":
        m = self.model

        self.handles.append(m.token_emb.register_forward_hook(self._save(("token_emb",))))
        self.handles.append(m.pos_emb.register_forward_hook(self._save_pos_emb()))

        for b_idx, block in enumerate(m.blocks):
            assert isinstance(block, Block)
            self.handles.append(
                block.register_forward_pre_hook(self._save_input(("blocks", b_idx, "block_in")))
            )
            self.handles.append(
                block.register_forward_hook(self._save(("blocks", b_idx, "resid_out")))
            )
            self.handles.append(
                block.ln1.register_forward_hook(self._save(("blocks", b_idx, "ln1")))
            )
            self.handles.append(
                block.ln2.register_forward_pre_hook(self._save_input(("blocks", b_idx, "resid_mid")))
            )
            self.handles.append(
                block.ln2.register_forward_hook(self._save(("blocks", b_idx, "ln2")))
            )

            mha = block.attn
            assert isinstance(mha, MultiHeadAttention)
            for h_idx, head in enumerate(mha.heads):
                assert isinstance(head, Head)
                self.raw["blocks"][b_idx]["heads"].append({"q": None, "k": None, "v": None})
                self.handles.append(head.query.register_forward_hook(self._save_head(b_idx, h_idx, "q")))
                self.handles.append(head.key.register_forward_hook(self._save_head(b_idx, h_idx, "k")))
                self.handles.append(head.value.register_forward_hook(self._save_head(b_idx, h_idx, "v")))

            self.handles.append(mha.register_forward_hook(self._save(("blocks", b_idx, "attn_out"))))

            ffn = block.ffn
            assert isinstance(ffn, FeedForward)
            self.handles.append(ffn.fc1.register_forward_hook(self._save(("blocks", b_idx, "ffn_pre_act"))))
            self.handles.append(ffn.act.register_forward_hook(self._save(("blocks", b_idx, "ffn_post_act"))))
            self.handles.append(ffn.register_forward_hook(self._save(("blocks", b_idx, "ffn_out"))))

        self.handles.append(m.ln_f.register_forward_hook(self._save(("ln_f",))))
        self.handles.append(m.lm_head.register_forward_hook(self._save(("logits",))))

        return self

    def __exit__(self, *_exc) -> None:
        for h in self.handles:
            h.remove()
        self.handles.clear()


def recompute_attention(
    q: torch.Tensor,            # [T, d_k]  single head
    k: torch.Tensor,            # [T, d_k]
) -> tuple[torch.Tensor, torch.Tensor]:
    """Reproduce Head.forward's scores and post-softmax weights from Q and K.

    scores / weights are intermediate tensors inside Head.forward, not outputs
    of any nn.Module, so forward-hooks can't reach them. We recompute using the
    same formula as gpt.py:Head.
    """
    T, d_k = q.shape
    scores = q @ k.transpose(-2, -1) * (d_k ** -0.5)
    mask = torch.tril(torch.ones(T, T, device=q.device, dtype=torch.bool))
    scores = scores.masked_fill(~mask, float("-inf"))
    weights = torch.softmax(scores, dim=-1)
    return scores, weights
