from __future__ import annotations

from functools import partial

from langchain_core.language_models import BaseChatModel
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from agent.graph.edges import should_continue
from agent.graph.nodes import answer_node, reflection_node, research_node
from agent.graph.state import OverallState


def build_graph(*, llm: BaseChatModel, max_iterations: int = 2) -> CompiledStateGraph:
    g: StateGraph = StateGraph(OverallState)
    g.add_node("research", partial(research_node, llm=llm))
    g.add_node("reflection", partial(reflection_node, llm=llm))
    g.add_node("answer", partial(answer_node, llm=llm))

    g.add_edge(START, "research")
    g.add_edge("research", "reflection")
    g.add_conditional_edges(
        "reflection",
        partial(should_continue, max_iterations=max_iterations),
        {"research": "research", "answer": "answer"},
    )
    g.add_edge("answer", END)
    return g.compile()
