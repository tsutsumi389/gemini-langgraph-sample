from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from fastapi import Request
from langgraph.graph.state import CompiledStateGraph

from agent.graph.state import OverallState, initial_state

log = logging.getLogger(__name__)


def _preview(value: Any, limit: int = 280) -> str:
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    return text if len(text) <= limit else text[: limit - 1] + "…"


async def stream_graph_events(
    graph: CompiledStateGraph,
    *,
    question: str,
    request: Request,
) -> AsyncIterator[dict[str, str]]:
    """Yield sse-starlette compatible event dicts."""
    yield {"event": "graph_start", "data": json.dumps({"question": question})}

    final_state: OverallState | None = None
    try:
        async for chunk in graph.astream(
            initial_state(question), stream_mode="updates"
        ):
            if await request.is_disconnected():
                log.info("client disconnected; stopping stream")
                return
            # chunk: {node_name: partial_state_update}
            for node_name, update in chunk.items():
                yield {
                    "event": "node_update",
                    "data": json.dumps(
                        {
                            "node": node_name,
                            "update": {k: _preview(v) for k, v in update.items()},
                        },
                        ensure_ascii=False,
                    ),
                }
                final_state = {**(final_state or {}), **update}  # type: ignore[typeddict-item]
    except Exception as exc:  # noqa: BLE001
        log.exception("graph stream failed")
        yield {
            "event": "error",
            "data": json.dumps({"message": str(exc)}, ensure_ascii=False),
        }
        return

    answer = (final_state or {}).get("answer", "")
    yield {
        "event": "final",
        "data": json.dumps({"answer": answer}, ensure_ascii=False),
    }
