from __future__ import annotations

import json
import re
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, ValidationError

from agent.graph.prompts import ANSWER_PROMPT, REFLECTION_PROMPT, RESEARCH_PROMPT
from agent.graph.state import OverallState


class ReflectionResult(BaseModel):
    needs_more_research: bool
    reason: str


def _format_notes(notes: list[str]) -> str:
    if not notes:
        return "(none yet)"
    return "\n".join(f"- {n}" for n in notes)


def _invoke_text(llm: BaseChatModel, prompt: str) -> str:
    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content
    return content if isinstance(content, str) else str(content)


def research_node(state: OverallState, *, llm: BaseChatModel) -> dict[str, Any]:
    prompt = RESEARCH_PROMPT.format(
        question=state["question"],
        notes=_format_notes(state["research_notes"]),
    )
    note = _invoke_text(llm, prompt).strip()
    return {
        "research_notes": [note],
        "iteration": state["iteration"] + 1,
    }


_CODEFENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def _strip_codefence(text: str) -> str:
    m = _CODEFENCE_RE.search(text)
    return m.group(1).strip() if m else text.strip()


def reflection_node(state: OverallState, *, llm: BaseChatModel) -> dict[str, Any]:
    prompt = REFLECTION_PROMPT.format(
        question=state["question"],
        notes=_format_notes(state["research_notes"]),
    )
    raw = _invoke_text(llm, prompt)
    cleaned = _strip_codefence(raw)
    try:
        data = json.loads(cleaned)
        result = ReflectionResult.model_validate(data)
    except (json.JSONDecodeError, ValidationError):
        # 解釈不能なら安全側: もうやめる
        result = ReflectionResult(needs_more_research=False, reason=raw[:200])
    return {
        "needs_more_research": result.needs_more_research,
        "reflection": result.reason,
    }


def answer_node(state: OverallState, *, llm: BaseChatModel) -> dict[str, Any]:
    prompt = ANSWER_PROMPT.format(
        question=state["question"],
        notes=_format_notes(state["research_notes"]),
    )
    answer = _invoke_text(llm, prompt).strip()
    return {"answer": answer}
