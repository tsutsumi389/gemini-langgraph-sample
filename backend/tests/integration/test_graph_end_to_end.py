import json

from agent.graph.graph import build_graph
from agent.graph.state import initial_state
from tests.fixtures.fake_gemini import make_fake_gemini


def test_graph_runs_research_reflection_answer_when_satisfied() -> None:
    """1周で reflection が「十分」と返したケース。"""
    llm = make_fake_gemini(
        [
            "Fact: Paris is the capital of France.",
            json.dumps({"needs_more_research": False, "reason": "enough"}),
            "Paris is the capital of France.",
        ]
    )
    graph = build_graph(llm=llm, max_iterations=2)

    result = graph.invoke(initial_state("What is the capital of France?"))

    assert result["research_notes"] == ["Fact: Paris is the capital of France."]
    assert result["needs_more_research"] is False
    assert result["answer"].startswith("Paris")


def test_graph_loops_then_answers_when_max_iterations_reached() -> None:
    """reflection が常に more を要求するが max=2 で打ち切られて answer に到達する。"""
    llm = make_fake_gemini(
        [
            "first note",
            json.dumps({"needs_more_research": True, "reason": "more"}),
            "second note",
            json.dumps({"needs_more_research": True, "reason": "more again"}),
            "Final answer text.",
        ]
    )
    graph = build_graph(llm=llm, max_iterations=2)

    result = graph.invoke(initial_state("hard question"))

    assert result["iteration"] == 2
    assert result["research_notes"] == ["first note", "second note"]
    assert result["answer"] == "Final answer text."
