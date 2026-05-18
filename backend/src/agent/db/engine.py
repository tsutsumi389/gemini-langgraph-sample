from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from agent.config import get_settings


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_settings()
    # NullPool: open a fresh connection per checkout. Avoids "different event loop"
    # errors when the engine is shared across event loops (notably under
    # FastAPI's TestClient, which spawns a new loop per request).
    return create_async_engine(settings.database_url, poolclass=NullPool)


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with get_sessionmaker()() as session:
        yield session


def reset_engine_cache() -> None:
    """Drop cached engine/sessionmaker. Use in tests after overriding settings."""
    get_engine.cache_clear()
    get_sessionmaker.cache_clear()
