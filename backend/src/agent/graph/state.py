from __future__ import annotations

import operator
from typing import Annotated, TypedDict


class OverallState(TypedDict):
    question: str
    research_notes: Annotated[list[str], operator.add]
    reflection: str
    needs_more_research: bool
    iteration: int
    answer: str


def initial_state(question: str) -> OverallState:
    return OverallState(
        question=question,
        research_notes=[],
        reflection="",
        needs_more_research=False,
        iteration=0,
        answer="",
    )
