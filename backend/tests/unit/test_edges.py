from agent.graph.edges import should_continue
from agent.graph.state import initial_state


def test_should_continue_answers_when_max_iterations_reached() -> None:
    s = initial_state("q")
    s["iteration"] = 2
    s["needs_more_research"] = True
    assert should_continue(s, max_iterations=2) == "answer"


def test_should_continue_answers_when_satisfied() -> None:
    s = initial_state("q")
    s["iteration"] = 1
    s["needs_more_research"] = False
    assert should_continue(s, max_iterations=2) == "answer"


def test_should_continue_loops_back_to_research() -> None:
    s = initial_state("q")
    s["iteration"] = 1
    s["needs_more_research"] = True
    assert should_continue(s, max_iterations=2) == "research"
