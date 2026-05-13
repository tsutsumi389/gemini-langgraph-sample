# Backend agent rules

Python 3.13 / FastAPI / LangGraph / `uv` package manager.

## Layout

- `src/agent/` — LangGraph nodes, graph wiring, FastAPI app
- `tests/unit/` — pure-function tests
- `tests/integration/` — graph + API tests (httpx ASGI client)
- `tests/fixtures/` — shared fixtures

## Commands

```bash
uv sync                              # install (incl. dev deps: ruff, mypy, pytest)
uv run pytest -v --cov=src/agent     # tests + coverage
uv run ruff check                    # lint (auto-runs on every Edit via hook)
uv run ruff format                   # format
uv run mypy                          # strict type check
uv run uvicorn agent.main:app --reload --port 8000
```

## Conventions

- Type hints required (`mypy strict`). New public functions need return types.
- Pydantic models for all I/O boundaries (FastAPI request/response, LangGraph state).
- Async-first: tests use `pytest-asyncio` (`asyncio_mode = "auto"`).
- LangGraph state lives in `src/agent/state.py`; nodes consume/return typed state dicts.
