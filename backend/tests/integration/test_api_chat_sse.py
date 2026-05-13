from __future__ import annotations

import json
from collections.abc import Iterator


def _parse_sse_stream(raw: str) -> Iterator[dict]:
    """Yield {'event': str, 'data': dict} for each SSE frame in raw text."""
    normalized = raw.replace("\r\n", "\n")
    for block in normalized.split("\n\n"):
        if not block.strip():
            continue
        event = "message"
        data_parts: list[str] = []
        for line in block.splitlines():
            if line.startswith("event:"):
                event = line[len("event:") :].strip()
            elif line.startswith("data:"):
                data_parts.append(line[len("data:") :].strip())
        if not data_parts:
            continue
        raw_data = "\n".join(data_parts)
        try:
            payload = json.loads(raw_data)
        except json.JSONDecodeError:
            payload = {"raw": raw_data}
        yield {"event": event, "data": payload}


def test_chat_streams_graph_progress_and_final_answer(client_factory) -> None:
    responses = [
        "First fact.",
        json.dumps({"needs_more_research": False, "reason": "enough"}),
        "Final answer.",
    ]
    client = client_factory(responses)

    with client.stream(
        "POST",
        "/chat",
        json={"question": "What is X?"},
    ) as res:
        assert res.status_code == 200
        body = "".join(chunk for chunk in res.iter_text())

    events = list(_parse_sse_stream(body))
    types = [e["event"] for e in events]

    assert types[0] == "graph_start"
    assert "node_update" in types
    assert types[-1] == "final"

    final = events[-1]
    assert final["data"]["answer"] == "Final answer."

    node_names = [e["data"]["node"] for e in events if e["event"] == "node_update"]
    assert node_names == ["research", "reflection", "answer"]


def test_chat_handles_loop_under_max_iterations(client_factory) -> None:
    """reflection が 2 回 more を返しても max=2 で打ち切られて answer に到達する。"""
    responses = [
        "note1",
        json.dumps({"needs_more_research": True, "reason": "need more"}),
        "note2",
        json.dumps({"needs_more_research": True, "reason": "still more"}),
        "Answer derived from notes.",
    ]
    client = client_factory(responses)

    with client.stream("POST", "/chat", json={"question": "deep q"}) as res:
        body = "".join(chunk for chunk in res.iter_text())

    events = list(_parse_sse_stream(body))
    node_updates = [e["data"]["node"] for e in events if e["event"] == "node_update"]

    assert node_updates == ["research", "reflection", "research", "reflection", "answer"]
    assert events[-1]["event"] == "final"
    assert events[-1]["data"]["answer"] == "Answer derived from notes."
