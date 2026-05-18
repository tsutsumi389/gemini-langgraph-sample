from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID

from fastapi import Request
from langgraph.graph.state import CompiledStateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from agent.db.repository import ConversationRepository, MessageRepository
from agent.graph.state import initial_state

log = logging.getLogger(__name__)

TITLE_MAX = 24


def _preview(value: Any, limit: int = 280) -> str:
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _derive_title(question: str) -> str:
    one_line = " ".join(question.split()).strip()
    if not one_line:
        return "New chat"
    if len(one_line) <= TITLE_MAX:
        return one_line
    return one_line[:TITLE_MAX] + "…"


async def stream_graph_events(
    graph: CompiledStateGraph,
    *,
    question: str,
    request: Request,
    session: AsyncSession,
    conversation_id: UUID | None,
) -> AsyncIterator[dict[str, str]]:
    """Run the graph, stream SSE events, and persist user/assistant messages."""
    conv_repo = ConversationRepository(session)
    msg_repo = MessageRepository(session)

    if conversation_id is None:
        conversation = await conv_repo.create(title=_derive_title(question))
    else:
        existing = await conv_repo.get(conversation_id)
        if existing is None:
            yield {
                "event": "error",
                "data": json.dumps({"message": "conversation not found"}, ensure_ascii=False),
            }
            return
        conversation = existing

    await msg_repo.add_user(conversation.id, content=question)
    await session.commit()

    conversation_id_str = str(conversation.id)
    yield {
        "event": "graph_start",
        "data": json.dumps(
            {"question": question, "conversation_id": conversation_id_str},
            ensure_ascii=False,
        ),
    }

    answer = ""
    trace: list[dict[str, Any]] = []
    error_message: str | None = None
    aborted = False

    try:
        async for chunk in graph.astream(initial_state(question), stream_mode="updates"):
            if await request.is_disconnected():
                log.info("client disconnected; stopping stream")
                aborted = True
                return
            for node_name, update in chunk.items():
                preview_update = {k: _preview(v) for k, v in update.items()}
                trace.append({"node": node_name, "update": preview_update})
                yield {
                    "event": "node_update",
                    "data": json.dumps(
                        {"node": node_name, "update": preview_update},
                        ensure_ascii=False,
                    ),
                }
                if "answer" in update:
                    answer = update["answer"]
    except Exception as exc:
        log.exception("graph stream failed")
        error_message = str(exc)
        yield {
            "event": "error",
            "data": json.dumps({"message": error_message}, ensure_ascii=False),
        }
        return
    finally:
        if not aborted:
            status = "error" if error_message else "done"
            await msg_repo.add_assistant(
                conversation.id,
                content=answer,
                trace=trace,
                status=status,
                error=error_message,
                source_question=question,
            )
            await conv_repo.touch(conversation.id)
            await session.commit()

    yield {
        "event": "final",
        "data": json.dumps({"answer": answer}, ensure_ascii=False),
    }
