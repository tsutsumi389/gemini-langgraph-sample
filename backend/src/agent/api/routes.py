from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from langchain_core.language_models import BaseChatModel
from sse_starlette.sse import EventSourceResponse

from agent.api.sse import stream_graph_events
from agent.config import Settings, get_settings
from agent.graph.graph import build_graph
from agent.llm.gemini import get_llm
from agent.schemas import ChatRequest

router = APIRouter()


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/chat")
async def chat(
    body: ChatRequest,
    request: Request,
    llm: BaseChatModel = Depends(get_llm),
    settings: Settings = Depends(get_settings),
) -> EventSourceResponse:
    graph = build_graph(llm=llm, max_iterations=settings.max_iterations)
    return EventSourceResponse(
        stream_graph_events(graph, question=body.question, request=request)
    )
