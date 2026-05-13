# Agent rules — gemini-langgraph-sample

Pointers, not prose. See `README.md` for human setup, sub-AGENTS for per-stack details.

## Architecture (one-liner)

LangGraph: `research → reflection → answer` loop. `reflection_node` returns
`needs_more_research=true` to revisit `research_node`; capped by `MAX_ITERATIONS=2`.
`POST /chat` streams via SSE; frontend consumes with `fetch + ReadableStream`.

## Boot

```bash
cp backend/.env.example backend/.env  # set GEMINI_API_KEY
cp frontend/.env.example frontend/.env
docker compose up --build
```

## Commands you must run before declaring done

```bash
# Backend
cd backend && uv run ruff check && uv run mypy && uv run pytest

# Frontend
cd frontend && pnpm check:ci && pnpm test && pnpm build
```

## Hard rules

- Do **not** edit `biome.json`, `eslint.config.mjs`, `.claude/settings.json`, or `.env*`. PreToolUse hook will block.
- Do **not** modify `[tool.ruff*]` or `[tool.mypy]` sections of `backend/pyproject.toml` without explicit user approval.
- Do **not** use `git commit --no-verify` or skip hooks.
- PostToolUse hook auto-runs ruff/biome on every edit; if it reports violations, fix them before moving on.
- Stop hook runs `mypy + pytest + biome check + vitest` and **blocks completion** on failure. Don't try to declare done with red checks — fix and let it pass.

## Where to look

- LangGraph nodes: `backend/src/agent/`
- Backend tests: `backend/tests/{unit,integration}/`
- Frontend entry: `frontend/src/app/`
- Sub-rules: [`backend/AGENTS.md`](backend/AGENTS.md), [`frontend/AGENTS.md`](frontend/AGENTS.md)
