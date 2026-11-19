"""
config.py — Application and LLM provider configuration.
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

import openai
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///agent_memory.db")

# LLM Configuration
_DEFAULT_PROVIDER    = os.getenv("PROVIDER", "openrouter")
_OPENROUTER_BASE     = "https://openrouter.ai/api/v1"
# Large models only: a small fallback model (e.g. a 9B) is what produces garbled resumes.
# Slugs on OpenRouter change often — verify them at https://openrouter.ai/models and, for
# reliability, point OPENROUTER_MODEL at a paid large model.
_OPENROUTER_MODEL    = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
_OPENROUTER_FALLBACKS = [
    m.strip()
    for m in (os.getenv("OPENROUTER_FALLBACK_MODELS") or os.getenv("OPENROUTER_FALLBACK_MODEL")
              or "meta-llama/llama-3.3-70b-instruct:free").split(",")
    if m.strip()
]
_OPENCODE_MODEL      = os.getenv("OPENCODE_MODEL", "")          # 'provider/model', e.g. openrouter/openai/gpt-oss-120b
_OPENCODE_SERVER_URL = os.getenv("OPENCODE_SERVER_URL", "")     # e.g. http://127.0.0.1:4096 (opencode serve)
_OLLAMA_BASE         = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
_OLLAMA_MODEL        = os.getenv("OLLAMA_MODEL", "llama3.2")
_MAX_ITERATIONS      = int(os.getenv("MAX_ITERATIONS", "1"))


def _make_openrouter(model: str, api_key: str, temperature: float):
    base_llm = ChatOpenAI(
        base_url=_OPENROUTER_BASE,
        api_key=api_key,
        model=model,
        temperature=temperature,
        timeout=120,
        max_retries=0,
    )
    return base_llm.with_retry(
        retry_if_exception_type=(
            openai.RateLimitError,
            openai.APIStatusError,
            openai.APIConnectionError,
        ),
        stop_after_attempt=3,
        wait_exponential_jitter=True,
    )


def _openrouter_chain(model_name: str | None, api_key: str, temperature: float):
    primary = _make_openrouter(model_name or _OPENROUTER_MODEL, api_key, temperature)
    fallbacks = [_make_openrouter(m, api_key, temperature) for m in _OPENROUTER_FALLBACKS]
    return primary.with_fallbacks(fallbacks) if fallbacks else primary


def get_llm(
    provider: str | None = None,
    model_name: str | None = None,
    temperature: float = 0.3,
):
    """Return a LangChain chat model for the requested provider."""
    provider = (provider or _DEFAULT_PROVIDER).lower()

    if provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise EnvironmentError("OPENROUTER_API_KEY is not set.")
        return _openrouter_chain(model_name, api_key, temperature)

    if provider == "opencode":
        from app.core.opencode_llm import ChatOpenCode

        oc = ChatOpenCode(
            model=model_name or _OPENCODE_MODEL,
            server_url=_OPENCODE_SERVER_URL or None,
            username=os.getenv("OPENCODE_SERVER_USERNAME", "opencode"),
            password=os.getenv("OPENCODE_SERVER_PASSWORD") or None,
            variant=os.getenv("OPENCODE_VARIANT") or None,
            binary=os.getenv("OPENCODE_BIN", "opencode"),
            timeout=int(os.getenv("OPENCODE_TIMEOUT", "300")),
        )
        api_key = os.getenv("OPENROUTER_API_KEY")
        # If opencode fails (not running, quota, ...) fall back to OpenRouter when a key exists.
        return oc.with_fallbacks([_openrouter_chain(None, api_key, temperature)]) if api_key else oc

    if provider == "ollama":
        return ChatOllama(
            base_url=_OLLAMA_BASE,
            model=model_name or _OLLAMA_MODEL,
            temperature=temperature,
        )

    raise ValueError(f"Unknown provider '{provider}'. Choose 'openrouter', 'ollama' or 'opencode'.")


def get_max_iterations() -> int:
    return _MAX_ITERATIONS
