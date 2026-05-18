from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from agent.db.models import Conversation, Message


class ConversationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_recent(self, limit: int = 100) -> list[Conversation]:
        stmt = select(Conversation).order_by(Conversation.updated_at.desc()).limit(limit)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_with_messages(self, conversation_id: UUID) -> Conversation | None:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get(self, conversation_id: UUID) -> Conversation | None:
        return await self._session.get(Conversation, conversation_id)

    async def create(self, *, title: str) -> Conversation:
        conv = Conversation(title=title)
        self._session.add(conv)
        await self._session.flush()
        return conv

    async def delete(self, conversation_id: UUID) -> bool:
        result = await self._session.execute(
            delete(Conversation).where(Conversation.id == conversation_id)
        )
        return bool(getattr(result, "rowcount", 0))

    async def touch(self, conversation_id: UUID) -> None:
        """Bump updated_at on the conversation row."""
        await self._session.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=func.now())
        )


class MessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_user(self, conversation_id: UUID, *, content: str) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=content,
            status="done",
        )
        self._session.add(msg)
        await self._session.flush()
        return msg

    async def add_assistant(
        self,
        conversation_id: UUID,
        *,
        content: str,
        trace: list[dict[str, Any]],
        status: str,
        error: str | None,
        source_question: str,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=content,
            trace=trace,
            status=status,
            error=error,
            source_question=source_question,
        )
        self._session.add(msg)
        await self._session.flush()
        return msg
