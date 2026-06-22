# 🤖 Scalable Self-Improving Agent

A production-ready AI agent built with **LangGraph + LangChain** that
iteratively generates and self-improves freelance cover letters.
Supports **OpenRouter** (cloud) and **Ollama** (local) LLM providers
with a single config switch.

---

## Features

| Feature | Detail |
|---|---|
| **Provider-agnostic** | Switch between OpenRouter & Ollama by changing `PROVIDER` in `.env` |
| **Self-improvement loop** | Generates a draft → critiques → rewrites, N times |
| **Persistent memory** | SQLite-backed `MemorySaver` — the agent remembers past threads across sessions |
| **Stateful graph** | LangGraph `StateGraph` with conditional edges for the refinement loop |
| **Clean architecture** | Decoupled: `config`, `state`, `nodes`, `graph`, `memory`, `main` |

---

## Project Structure

```
agent/
├── .env.example    ← Copy to .env and fill in your key(s)
├── requirements.txt
├── config.py       ← LLM provider factory
├── state.py        ← AgentState TypedDict
├── nodes.py        ← generate_draft, analyze_and_enhance, should_continue
├── graph.py        ← StateGraph wiring + SqliteSaver compilation
├── memory.py       ← SQLite checkpointer setup
└── main.py         ← CLI entry-point + demo
```

---

## Quick Start

### 1. Install dependencies

```bash
cd agent
pip install -r requirements.txt
```

### 2. Configure your provider

```bash
cp .env.example .env
```

**OpenRouter (cloud)**
```dotenv
PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct
MAX_ITERATIONS=2
```

**Ollama (local)**
```dotenv
PROVIDER=ollama
OLLAMA_MODEL=llama3      # or mistral, gemma2, etc.
MAX_ITERATIONS=2
```

> Make sure Ollama is running: `ollama serve` and `ollama pull llama3`

### 3. Run the agent

```bash
python main.py
```

---

## How It Works

```
START
  │
  ▼
generate_draft          ← Node 1: writes initial cover letter
  │
  ▼
analyze_and_enhance     ← Node 2: self-critiques & rewrites draft
  │
  ├── iterations < max ──► analyze_and_enhance  (loop again)
  │
  └── iterations ≥ max ──► END
```

### Persistent Memory

Every run is checkpointed to `agent_memory.db`.  Subsequent calls with
the same `thread_id` restore the full conversation — the agent does not
need to be re-given the job description on follow-up runs.

```python
# Run 1: full initial run
agent.invoke(initial_input, {"configurable": {"thread_id": "campaign_001"}})

# Run 2: follow-up — agent remembers everything from Run 1
agent.invoke(
    {"messages": [HumanMessage(content="Make it less formal.")]},
    {"configurable": {"thread_id": "campaign_001"}}
)
```

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `PROVIDER` | `openrouter` | `openrouter` or `ollama` |
| `OPENROUTER_API_KEY` | — | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `meta-llama/llama-3-70b-instruct` | Any model on OpenRouter |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama endpoint |
| `OLLAMA_MODEL` | `llama3` | Any model pulled via Ollama |
| `MAX_ITERATIONS` | `2` | Self-improvement loop count |
| `MEMORY_DB_PATH` | `agent_memory.db` | Path for the SQLite memory file |

---

## Extending the Agent

- **Add a new node**: define a function in `nodes.py`, register it in `graph.py` with `workflow.add_node`, and wire edges.
- **Swap providers per node**: call `get_llm(provider="ollama")` inside a specific node to mix providers.
- **Add long-term vector memory**: replace `SqliteSaver` in `memory.py` with a vector store checkpointer for semantic retrieval.
- **Use a different persona**: edit the system prompts at the top of `nodes.py`.
