from __future__ import annotations

from collections.abc import Iterable

import pytest
from fastapi.testclient import TestClient

from agent.config import get_settings
from agent.llm.gemini import get_llm
from agent.main import create_app
from tests.fixtures.fake_gemini import make_fake_gemini


@pytest.fixture
def settings_override(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MAX_ITERATIONS", "2")
    get_settings.cache_clear()
    yield get_settings()
    get_settings.cache_clear()


@pytest.fixture
def app_with_fake_llm(settings_override):
    """Returns a factory that mounts a FastAPI app with a deterministic fake LLM."""

    def _make(responses: Iterable[str]):
        fake = make_fake_gemini(responses)
        app = create_app()
        app.dependency_overrides[get_llm] = lambda: fake
        return app

    return _make


@pytest.fixture
def client_factory(app_with_fake_llm):
    def _make(responses: Iterable[str]) -> TestClient:
        return TestClient(app_with_fake_llm(responses))

    return _make
