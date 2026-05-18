from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    conversation_id: UUID | None = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    content: str
    trace: list[dict[str, Any]] | None = None
    status: str
    error: str | None = None
    source_question: str | None = None
    created_at: datetime


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationDetail(ConversationSummary):
    messages: list[MessageOut]
