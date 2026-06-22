"""
memory.py — Persistent memory backend for the LangGraph agent.

Uses LangGraph's SqliteSaver so that every graph run is checkpointed to a
local SQLite database file.  Subsequent runs with the same ``thread_id``
automatically restore previous state, giving the agent long-term memory across
sessions without any external infrastructure.

The database file (``agent_memory.db``) is created in the current working
directory on first run and committed after every node execution.
"""

from __future__ import annotations

import os
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver

# Path to the SQLite database (relative to wherever you run main.py)
_DB_PATH = os.getenv("MEMORY_DB_PATH", "agent_memory.db")


def get_checkpointer() -> SqliteSaver:
    """Return a live SqliteSaver instance pointing at the configured DB file.

    In LangGraph >= 0.2, ``SqliteSaver.from_conn_string()`` returns a context
    manager.  We open the underlying sqlite3 connection directly and construct
    the saver from it so it stays alive for the full lifetime of the process.
    """
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    return SqliteSaver(conn)
