from agent.graph.graph import build_graph
from tests.fixtures.fake_gemini import make_fake_gemini


def test_build_graph_compiles_with_loop() -> None:
    llm = make_fake_gemini(["x"])
    graph = build_graph(llm=llm, max_iterations=2)
    mermaid = graph.get_graph().draw_mermaid()

    assert "research" in mermaid
    assert "reflection" in mermaid
    assert "answer" in mermaid
