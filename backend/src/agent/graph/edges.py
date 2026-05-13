from __future__ import annotations

from typing import Literal

from agent.graph.state import OverallState

Decision = Literal["research", "answer"]


def should_continue(state: OverallState, *, max_iterations: int) -> Decision:
    if state["iteration"] >= max_iterations:
        return "answer"
    if not state["needs_more_research"]:
        return "answer"
    return "research"
