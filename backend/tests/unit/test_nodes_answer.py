from agent.graph.nodes import answer_node
from agent.graph.state import initial_state
from tests.fixtures.fake_gemini import make_fake_gemini


def test_answer_node_writes_answer() -> None:
    llm = make_fake_gemini(["Paris."])
    state = initial_state("Capital of France?")
    state["research_notes"] = ["France's capital is Paris."]

    out = answer_node(state, llm=llm)

    assert out["answer"] == "Paris."
