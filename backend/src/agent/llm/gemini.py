from __future__ import annotations

from functools import lru_cache

from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

from agent.config import get_settings


@lru_cache
def get_llm() -> BaseChatModel:
    s = get_settings()
    return ChatGoogleGenerativeAI(
        model=s.gemini_model,
        google_api_key=s.gemini_api_key,
    )
