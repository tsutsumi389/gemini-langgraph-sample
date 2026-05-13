import json

from agent.graph.nodes import reflection_node
from agent.graph.state import initial_state
from tests.fixtures.fake_gemini import make_fake_gemini


def test_reflection_marks_sufficient() -> None:
    payload = json.dumps({"needs_more_research": False, "reason": "enough facts"})
    llm = make_fake_gemini([payload])

    state = initial_state("q")
    state["research_notes"] = ["a", "b"]

    out = reflection_node(state, llm=llm)

    assert out["needs_more_research"] is False
    assert "enough facts" in out["reflection"]


def test_reflection_marks_needs_more() -> None:
    payload = json.dumps({"needs_more_research": True, "reason": "missing context"})
    llm = make_fake_gemini([payload])

    state = initial_state("q")
    state["research_notes"] = ["partial"]

    out = reflection_node(state, llm=llm)

    assert out["needs_more_research"] is True
    assert "missing context" in out["reflection"]


def test_reflection_handles_json_wrapped_in_codefence() -> None:
    payload = "```json\n" + json.dumps({"needs_more_research": False, "reason": "ok"}) + "\n```"
    llm = make_fake_gemini([payload])
    state = initial_state("q")
    state["research_notes"] = ["a"]

    out = reflection_node(state, llm=llm)

    assert out["needs_more_research"] is False
