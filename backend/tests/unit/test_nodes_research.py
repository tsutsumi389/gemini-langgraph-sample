from agent.graph.nodes import research_node
from agent.graph.state import initial_state
from tests.fixtures.fake_gemini import make_fake_gemini


def test_research_node_appends_note_and_increments_iteration() -> None:
    llm = make_fake_gemini(["Paris is the capital of France."])
    state = initial_state("What is the capital of France?")

    out = research_node(state, llm=llm)

    assert out["research_notes"] == ["Paris is the capital of France."]
    assert out["iteration"] == 1


def test_research_node_uses_existing_notes_in_prompt() -> None:
    """既存 notes が与えられても落ちず iteration が単調増加すること。"""
    llm = make_fake_gemini(["follow-up fact"])
    state = initial_state("q")
    state["research_notes"] = ["earlier fact"]
    state["iteration"] = 1

    out = research_node(state, llm=llm)

    assert out["iteration"] == 2
    assert out["research_notes"] == ["follow-up fact"]
