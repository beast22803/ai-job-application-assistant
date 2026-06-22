"""
nodes.py — LangGraph node functions.

Graph topology
──────────────
  START
    │
    ▼
  route_entry ──► "generator"  (first run: no draft yet)
                │
                └► "reviser"   (follow-up: draft already exists)

  generator ──► analyzer ──► (loop or END)

  reviser ──► END   (applies the user's instruction precisely, no re-analysis)
"""

from __future__ import annotations

import re

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.core.config import get_llm
from app.services.state import AgentState


# ─────────────────────────────────────────────────────────────────────────────
# Output cleaner — strips meta-commentary the LLM may leak into the letter
# ─────────────────────────────────────────────────────────────────────────────

# Patterns that signal the start of LLM meta-commentary (not part of the letter)
_META_PATTERNS = re.compile(
    r"(\*\*Changes\s+Made\*\*|Changes\s+[Mm]ade:|"
    r"\*\*Key\s+Changes\*\*|Key\s+[Cc]hanges:|"
    r"\*\*Improvements\*\*|Improvements:|"
    r"\*\*Notes?\*\*|Notes?:|"
    r"^---+\s*$)",
    re.MULTILINE,
)

# Prefixes the LLM wraps around the letter that should be stripped
_PREFIX_PATTERN = re.compile(
    r"^(here\s+is\s+(a\s+)?(the\s+)?(revised?|rewritten?|improved?|updated?|"
    r"enhanced?|final|new|your)\s+[\w\s]*:?\s*\n+)",
    re.IGNORECASE,
)


def _clean(text: str) -> str:
    """Remove any meta-commentary or wrapper phrases from the LLM's output."""
    # Strip trailing sections that start with a meta-commentary marker
    match = _META_PATTERNS.search(text)
    if match:
        text = text[: match.start()].strip()

    # Strip leading "Here is the revised proposal:" style prefixes
    text = _PREFIX_PATTERN.sub("", text).strip()

    return text


# ─────────────────────────────────────────────────────────────────────────────
# Router — decides which node to run first
# ─────────────────────────────────────────────────────────────────────────────

def route_entry(state: AgentState) -> str:
    """
    Return 'reviser' if a draft already exists (i.e. this is a follow-up
    revision request), or 'generator' to start fresh.
    """
    if state.get("current_draft") and state.get("is_revision"):
        return "reviser"
    return "generator"


# ─────────────────────────────────────────────────────────────────────────────
# Node 1 — Draft Generator  (first run only)
# ─────────────────────────────────────────────────────────────────────────────

_GENERATOR_SYSTEM = """\
You are an expert freelance proposal writer who helps engineers win top roles.

Rules you MUST follow:
- Write a tailored cover letter for the job description provided.
- Output ONLY the cover letter text — no bullet points, no "Here is...", \
no "Changes Made", no commentary of any kind before or after the letter.
- Be specific to the job: reference the company name, role, and their tech stack.
- Be concise: 3–4 tight paragraphs maximum.
- Lead with value — what you bring to them, not your career history.
- Never use filler phrases like "I am excited to apply" or "I believe I would be a great fit".\
"""


def generate_draft(state: AgentState) -> dict:
    """Node 1 — produce the initial cover-letter draft."""
    llm = get_llm()

    messages = [
        SystemMessage(content=_GENERATOR_SYSTEM),
        HumanMessage(content=(
            f"Write a cover letter for this job:\n\n{state['job_description']}"
        )),
    ]

    response: AIMessage = llm.invoke(messages)

    return {
        "current_draft": _clean(response.content),
        "messages":      [response],
        "iterations":    state.get("iterations", 0) + 1,
        "is_revision":   False,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 2 — Self-Analyser / Enhancer  (loops up to max_iterations times)
# ─────────────────────────────────────────────────────────────────────────────

_ANALYSER_SYSTEM = """\
You are a ruthless cover-letter editor. You receive a draft and the original \
job description, identify every weakness, and produce a tighter, more \
compelling rewrite.

Rules you MUST follow:
- Output ONLY the rewritten cover letter — no bullet lists, no "Changes Made", \
no commentary before or after. If you add ANY explanation or headers, you fail.
- Fix vague claims, generic phrases, and anything not grounded in the job spec.
- Keep it to 3–4 paragraphs.
- Preserve any specific facts, numbers, or technologies mentioned in the draft.\
"""


def analyze_and_enhance(state: AgentState) -> dict:
    """Node 2 — critique and rewrite the current draft."""
    llm = get_llm()

    response: AIMessage = llm.invoke([
        SystemMessage(content=_ANALYSER_SYSTEM),
        HumanMessage(content=(
            f"Job description:\n{state.get('job_description', '')}\n\n"
            f"Current draft:\n{state['current_draft']}\n\n"
            "Rewrite the cover letter to fix every weakness. "
            "Output ONLY the improved letter — no commentary."
        )),
    ])

    updated_critiques = state.get("critique_history", []) + [
        f"Iteration {state.get('iterations', 0)}: self-analysis complete."
    ]

    return {
        "current_draft":   _clean(response.content),
        "critique_history": updated_critiques,
        "messages":        [response],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node 3 — Reviser  (follow-up runs only — applies user instructions precisely)
# ─────────────────────────────────────────────────────────────────────────────

_REVISER_SYSTEM = """\
You are a precise document editor. You apply user instructions to an existing \
cover letter EXACTLY as specified.

Rules you MUST follow:
- Apply the user's instruction faithfully and literally.
  • If they say "50 words", the output MUST be approximately 50 words.
  • If they say "less formal", reduce formality throughout.
  • If they say "add X", add X and nothing else.
- Output ONLY the revised letter — no "Here is...", no commentary, \
no "Changes Made", nothing before or after the letter itself.
- Preserve the core content unless the instruction says otherwise.\
"""


def revise_draft(state: AgentState) -> dict:
    """Node 3 — apply a user revision instruction to the existing draft."""
    llm = get_llm()

    # Extract the most recent human instruction from the message history
    user_instruction = ""
    for msg in reversed(state.get("messages", [])):
        if isinstance(msg, HumanMessage):
            user_instruction = msg.content
            break

    response: AIMessage = llm.invoke([
        SystemMessage(content=_REVISER_SYSTEM),
        HumanMessage(content=(
            f"Existing cover letter:\n{state['current_draft']}\n\n"
            f"User instruction:\n{user_instruction}\n\n"
            "Apply the instruction exactly. Output ONLY the revised letter."
        )),
    ])

    return {
        "current_draft": _clean(response.content),
        "messages":      [response],
        "is_revision":   False,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Conditional edge — loop analyser or exit
# ─────────────────────────────────────────────────────────────────────────────

def should_continue(state: AgentState) -> str:
    """Loop back to analyser or exit, based on iteration count."""
    if state.get("iterations", 0) < state.get("max_iterations", 1):
        return "enhance"
    return "end"
