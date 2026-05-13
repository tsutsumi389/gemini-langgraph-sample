# backend

FastAPI + LangGraph + Gemini agent.

## Local

```bash
uv sync
cp .env.example .env  # GEMINI_API_KEY を設定
uv run uvicorn agent.main:app --reload
```

## Test

```bash
uv run pytest -v --cov=src/agent --cov-report=term-missing
```
