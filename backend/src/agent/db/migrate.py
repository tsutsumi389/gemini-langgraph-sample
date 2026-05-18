from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from agent.config import get_settings

log = logging.getLogger(__name__)


def _alembic_config() -> Config:
    backend_root = Path(__file__).resolve().parents[3]
    cfg = Config(str(backend_root / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_root / "alembic"))
    cfg.set_main_option("sqlalchemy.url", get_settings().database_url)
    return cfg


def run_migrations() -> None:
    """Apply all pending alembic migrations. Safe to call on every startup."""
    log.info("running alembic upgrade head")
    command.upgrade(_alembic_config(), "head")
