from agent.graph.state import OverallState, initial_state


def test_initial_state_has_all_keys() -> None:
    s = initial_state("hello?")
    assert s["question"] == "hello?"
    assert s["research_notes"] == []
    assert s["reflection"] == ""
    assert s["needs_more_research"] is False
    assert s["iteration"] == 0
    assert s["answer"] == ""


def test_research_notes_reducer_accumulates() -> None:
    """LangGraph の reducer で research_notes が追記されること。"""
    from langgraph.graph import END, StateGraph

    def first(_: OverallState) -> dict:
        return {"research_notes": ["note1"], "iteration": 1}

    def second(_: OverallState) -> dict:
        return {"research_notes": ["note2"], "iteration": 2}

    g: StateGraph = StateGraph(OverallState)
    g.add_node("first", first)
    g.add_node("second", second)
    g.set_entry_point("first")
    g.add_edge("first", "second")
    g.add_edge("second", END)

    result = g.compile().invoke(initial_state("q"))

    assert result["research_notes"] == ["note1", "note2"]
    assert result["iteration"] == 2
