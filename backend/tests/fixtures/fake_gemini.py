from __future__ import annotations

from collections.abc import Iterable

from langchain_core.language_models.fake_chat_models import FakeListChatModel


def make_fake_gemini(responses: Iterable[str]) -> FakeListChatModel:
    """Deterministic chat model that cycles through `responses` one per invoke."""
    return FakeListChatModel(responses=list(responses))
