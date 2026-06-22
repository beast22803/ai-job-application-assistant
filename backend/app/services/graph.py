"""
graph.py — LangGraph StateGraph assembly.

Topology
────────
  START
    │
    ▼
  route_entry ──► generator ──► analyzer ──┐
                │                          │ (loop if iterations < max)
                │                          ▼
                └──► reviser            analyzer ──► END
                        │
                        ▼
                       END
"""

from __future__ import annotations

from langgraph.graph import StateGraph, START, END

from app.services.state import AgentState
from app.services.nodes import (
    route_entry,
    generate_draft,
    analyze_and_enhance,
    revise_draft,
    should_continue,
)
from app.services.memory import get_checkpointer


def build_agent():
    """Build and compile the self-improving agent graph."""
    workflow = StateGraph(AgentState)

    # ── Nodes ─────────────────────────────────────────────────────────────────
    workflow.add_node("generator", generate_draft)
    workflow.add_node("analyzer",  analyze_and_enhance)
    workflow.add_node("reviser",   revise_draft)

    # ── Entry routing ─────────────────────────────────────────────────────────
    # route_entry checks if a draft already exists → revision path
    # otherwise → fresh generation path
    workflow.add_conditional_edges(
        START,
        route_entry,
        {
            "generator": "generator",
            "reviser":   "reviser",
        },
    )

    # ── Generation path: generate → analyse (loop) → END ─────────────────────
    workflow.add_edge("generator", "analyzer")

    workflow.add_conditional_edges(
        "analyzer",
        should_continue,
        {
            "enhance": "analyzer",   # loop for another refinement pass
            "end":     END,
        },
    )

    # ── Revision path: one-shot apply → END ───────────────────────────────────
    workflow.add_edge("reviser", END)

    # ── Compile with persistent SQLite memory ─────────────────────────────────
    agent = workflow.compile(checkpointer=get_checkpointer())
    return agent
