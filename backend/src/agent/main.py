from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agent.api.routes import router
from agent.config import get_settings
from agent.db.migrate import run_migrations

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        run_migrations()
    except Exception:
        log.exception("alembic upgrade failed; the app will start but DB-backed endpoints may 500")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="gemini-langgraph-sample", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()
