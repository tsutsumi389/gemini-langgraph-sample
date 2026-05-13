# gemini-langgraph-sample

Gemini × LangGraph フルスタック AI エージェント (MVP)。

- Frontend: Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui
- Backend: FastAPI + LangGraph + langchain-google-genai (`gemini-2.5-flash`)
- Streaming: Server-Sent Events
- Test: pytest (backend) / Vitest + Testing Library + MSW (frontend)

## Quick start

```bash
# backend env
cp backend/.env.example backend/.env
# GEMINI_API_KEY=... を編集

cp frontend/.env.example frontend/.env

# Docker
docker compose up --build
```

- フロント: http://localhost:3000
- バック : http://localhost:8000 (`/healthz`, `POST /chat`)

## Tests

```bash
# backend
cd backend && uv run pytest -v --cov=src/agent --cov-report=term-missing

# frontend
cd frontend && pnpm test
```

## Architecture

LangGraph グラフは `research → reflection → answer` のループ。`reflection_node` が
`needs_more_research=true` を返すと `research_node` に戻り、`MAX_ITERATIONS` (default `2`)
で打ち切る。`POST /chat` は `astream_events` を SSE で配信し、フロントは
`fetch + ReadableStream` で受信して UI に逐次反映する。
