from __future__ import annotations

import asyncio
import contextlib
from collections.abc import Generator, Iterable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from testcontainers.postgres import PostgresContainer

from agent.config import get_settings
from agent.db import engine as engine_module
from agent.db.migrate import run_migrations
from agent.llm.gemini import get_llm
from agent.main import create_app
from tests.fixtures.fake_gemini import make_fake_gemini


@pytest.fixture(scope="session")
def postgres_url() -> Generator[str]:
    container = PostgresContainer("postgres:17-alpine")
    container.start()
    try:
        raw_url = container.get_connection_url()
        url = raw_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://").replace(
            "postgresql://", "postgresql+asyncpg://"
        )
        yield url
    finally:
        container.stop()


@pytest.fixture
def settings_override(monkeypatch: pytest.MonkeyPatch, postgres_url: str) -> Generator[Any]:
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MAX_ITERATIONS", "2")
    monkeypatch.setenv("DATABASE_URL", postgres_url)
    get_settings.cache_clear()
    engine_module.reset_engine_cache()
    settings = get_settings()
    run_migrations()
    yield settings
    get_settings.cache_clear()
    engine_module.reset_engine_cache()


@pytest.fixture(autouse=True)
def _clean_db(settings_override) -> Generator[None]:
    """Truncate persistence tables between tests."""
    yield

    async def _truncate() -> None:
        sm = engine_module.get_sessionmaker()
        async with sm() as session:
            await session.execute(
                text("TRUNCATE TABLE messages, conversations RESTART IDENTITY CASCADE")
            )
            await session.commit()

    with contextlib.suppress(Exception):
        asyncio.run(_truncate())


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
