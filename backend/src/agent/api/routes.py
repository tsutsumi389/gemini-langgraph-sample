from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from langchain_core.language_models import BaseChatModel
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from agent.api.sse import stream_graph_events
from agent.config import Settings, get_settings
from agent.db.engine import get_session
from agent.db.repository import ConversationRepository
from agent.graph.graph import build_graph
from agent.llm.gemini import get_llm
from agent.schemas import ChatRequest, ConversationDetail, ConversationSummary

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
    session: AsyncSession = Depends(get_session),
) -> EventSourceResponse:
    graph = build_graph(llm=llm, max_iterations=settings.max_iterations)
    return EventSourceResponse(
        stream_graph_events(
            graph,
            question=body.question,
            request=request,
            session=session,
            conversation_id=body.conversation_id,
        )
    )


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    session: AsyncSession = Depends(get_session),
) -> list[ConversationSummary]:
    repo = ConversationRepository(session)
    items = await repo.list_recent()
    return [ConversationSummary.model_validate(c) for c in items]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ConversationDetail:
    repo = ConversationRepository(session)
    conv = await repo.get_with_messages(conversation_id)
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "conversation not found")
    return ConversationDetail.model_validate(conv)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = ConversationRepository(session)
    deleted = await repo.delete(conversation_id)
    await session.commit()
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "conversation not found")
