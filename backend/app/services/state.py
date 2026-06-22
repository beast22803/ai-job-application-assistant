"""
state.py — Shared state for the LangGraph agent.
"""

from __future__ import annotations

from typing import Annotated, List
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages:        Annotated[List[BaseMessage], add_messages]
    job_description: str
    current_draft:   str
    critique_history: List[str]
    iterations:      int
    max_iterations:  int
    is_revision:     bool   # True when processing a follow-up edit request
