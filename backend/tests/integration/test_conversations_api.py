from __future__ import annotations

import json

import pytest


@pytest.fixture
def make_client(client_factory):
    """Default responses sufficient to run one full graph pass."""

    def _make() -> object:
        return client_factory(
            [
                "First fact.",
                json.dumps({"needs_more_research": False, "reason": "enough"}),
                "Final answer.",
            ]
        )

    return _make


def _run_chat(client, question: str) -> str:
    """Drive the chat endpoint and return the conversation_id from graph_start."""
    with client.stream("POST", "/chat", json={"question": question}) as res:
        assert res.status_code == 200
        body = "".join(chunk for chunk in res.iter_text())
    for block in body.replace("\r\n", "\n").split("\n\n"):
        event = ""
        data = ""
        for line in block.splitlines():
            if line.startswith("event:"):
                event = line[len("event:") :].strip()
            elif line.startswith("data:"):
                data = line[len("data:") :].strip()
        if event == "graph_start":
            return json.loads(data)["conversation_id"]
    raise AssertionError("graph_start event not found in stream")


def test_chat_persists_conversation_and_messages(make_client) -> None:
    client = make_client()
    conversation_id = _run_chat(client, "What is X?")

    listed = client.get("/conversations")
    assert listed.status_code == 200
    summaries = listed.json()
    assert any(s["id"] == conversation_id for s in summaries)

    detail = client.get(f"/conversations/{conversation_id}")
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["id"] == conversation_id
    roles = [m["role"] for m in payload["messages"]]
    assert roles == ["user", "assistant"]
    assistant = payload["messages"][1]
    assert assistant["content"] == "Final answer."
    assert assistant["status"] == "done"
    assert len(assistant["trace"]) >= 1


def test_chat_continues_existing_conversation(make_client) -> None:
    client = make_client()
    conv_id = _run_chat(client, "first question")

    client2 = make_client()
    with client2.stream(
        "POST",
        "/chat",
        json={"question": "follow up", "conversation_id": conv_id},
    ) as res:
        assert res.status_code == 200
        body = "".join(chunk for chunk in res.iter_text())
    assert f'"conversation_id": "{conv_id}"' in body

    detail = client2.get(f"/conversations/{conv_id}")
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) == 4


def test_delete_conversation_cascades(make_client) -> None:
    client = make_client()
    conv_id = _run_chat(client, "hi")

    res = client.delete(f"/conversations/{conv_id}")
    assert res.status_code == 204

    assert client.get(f"/conversations/{conv_id}").status_code == 404
    listed = client.get("/conversations").json()
    assert not any(c["id"] == conv_id for c in listed)


def test_get_conversation_404_for_unknown_id(make_client) -> None:
    client = make_client()
    res = client.get("/conversations/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_chat_with_unknown_conversation_id_emits_error_event(make_client) -> None:
    client = make_client()
    with client.stream(
        "POST",
        "/chat",
        json={
            "question": "ghost",
            "conversation_id": "00000000-0000-0000-0000-000000000000",
        },
    ) as res:
        assert res.status_code == 200
        body = "".join(chunk for chunk in res.iter_text())
    assert "event: error" in body
    assert "conversation not found" in body
